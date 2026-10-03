/*
 * DataArcus - TMDL projects: reads a semantic model's definition/*.tmdl files (as Power BI Desktop saves a project)
 * into the same model JSON as a model.bim or a .pbit's DataModelSchema, so every engine that takes a model.bim
 * (the Model Health Check first) works on TMDL projects too. Pure JavaScript, runs in the browser and in Node.
 * Input: [{ path, text }] with paths relative to anything that contains "definition/". Nothing is sent anywhere.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';

  // ---------- names ----------
  // 'Quoted name' with '' for a quote, or a plain name. Returns [name, rest of the string].
  function readName(s) {
    s = s.replace(/^\s+/, '');
    if (s[0] === "'") {
      let out = '', i = 1;
      for (; i < s.length; i++) {
        if (s[i] === "'") { if (s[i + 1] === "'") { out += "'"; i++; } else break; } else out += s[i];
      }
      return [out, s.slice(i + 1)];
    }
    const m = s.match(/^(.*?)(\s*=.*)?$/);
    return [m[1].trim(), m[2] || ''];
  }
  // Table.Column, 'Table'.'Column' or a mix: [table, column]
  function readRef(s) {
    s = String(s).trim();
    if (s[0] === "'") { const [t, rest] = readName(s); return [t, readName(rest.replace(/^\./, ''))[0]]; }
    const dot = s.indexOf('.');
    return dot < 0 ? [s, ''] : [s.slice(0, dot), readName(s.slice(dot + 1))[0]];
  }
  // a value written "in double quotes" with "" for a quote, only when the quotes enclose the whole value
  function unquote(v) {
    if (v[0] !== '"') return v;
    let out = '', i = 1;
    for (; i < v.length; i++) {
      if (v[i] === '"') { if (v[i + 1] === '"') { out += '"'; i++; } else break; } else out += v[i];
    }
    return i === v.length - 1 ? out : v;
  }

  // ---------- 1. TMDL text into a tree of objects ----------
  // Every object has a depth; its properties and child objects sit one tab deeper, and a multi-line expression
  // (after "=") two tabs deeper, or between ``` fences. /// lines are the description of the next object.
  function parse(text) {
    const lines = String(text).replace(/^﻿/, '').split(/\r?\n/).map((raw) => {
      const l = raw.replace(/^( {4})+/, (s) => '\t'.repeat(s.length / 4)), d = l.match(/^\t*/)[0].length;
      return { d, t: l.slice(d).trim(), raw: raw.replace(/\s+$/, '') };
    });
    const top = { type: 'file', props: [], children: [] }, owners = [top];
    let desc = [];
    // the expression after "=": inline text, ``` fenced lines, or the lines deeper than `deeper`
    const expr = (inline, i, deeper) => {
      const block = [];
      let j = i + 1;
      if (inline === '```') {
        for (; j < lines.length && lines[j].t !== '```'; j++) block.push(lines[j]);
        j++;
        inline = '';
      } else {
        for (; j < lines.length && (!lines[j].t || lines[j].d > deeper); j++) block.push(lines[j]);
      }
      while (block.length && !block[block.length - 1].t) block.pop();
      // the expression's own indentation stays: only the levels every line shares are removed
      const cut = Math.min(...block.filter((b) => b.t).map((b) => b.d));
      const body = block.map((b) => (b.t ? b.raw.replace(new RegExp('^(\\t| {4}){' + cut + '}'), '') : ''));
      return { value: [inline, ...body].filter((x, k) => k > 0 || x !== '').join('\n'), next: j };
    };
    for (let i = 0; i < lines.length;) {
      const { d, t } = lines[i];
      if (!t) { i++; continue; }
      if (t.startsWith('///')) { desc.push(t.replace(/^\/\/\/ ?/, '')); i++; continue; }
      const owner = owners[Math.min(d, owners.length - 1)];
      let m;
      if ((m = t.match(/^(\w+)\s*:\s*(.*)$/))) { owner.props.push([m[1], m[2].trim()]); i++; continue; }
      let node;
      if ((m = t.match(/^(\w+)\s*=\s*(.*)$/))) {
        const e = expr(m[2].trim(), i, d + 1);
        node = { type: m[1], name: null, expr: e.value }; i = e.next;
      } else if ((m = t.match(/^(\w+)$/))) {
        let j = i + 1; while (j < lines.length && (!lines[j].t || lines[j].t.startsWith('///'))) j++;
        if (!(j < lines.length && lines[j].d > d)) { owner.props.push([m[1], true]); i++; continue; }
        node = { type: m[1], name: null }; i++;
      } else if ((m = t.match(/^ref\s+(\w+)\s+(.+)$/))) {
        node = { type: 'ref', name: readName(m[2])[0], of: m[1] }; i++;
      } else if ((m = t.match(/^(\w+)\s+(.+)$/))) {
        const [name, rest] = readName(m[2]);
        node = { type: m[1], name };
        const eq = rest.match(/^\s*=\s*(.*)$/);
        if (eq) { const e = expr(eq[1].trim(), i, d + 1); node.expr = e.value; i = e.next; } else i++;
      } else { i++; continue; }
      node.props = []; node.children = [];
      if (desc.length) { node.description = desc.join('\n'); desc = []; }
      owner.children.push(node);
      owners.length = d + 1; owners[d + 1] = node;
    }
    return top;
  }

  // ---------- 2. the tree into model JSON (the shape of a model.bim) ----------
  // lineage tags are left out (the health check has no use for them) unless fromFiles is asked to keep them: the
  // fix scripts write an object back whole, and without its tag Power BI Desktop gives it a new one (measured)
  const DROP = new Set(['lineageTag', 'sourceLineageTag', 'changedProperty']), TAGS = new Set(['lineageTag', 'sourceLineageTag']);
  let keepTags = false;
  const NUMBERS = new Set(['compatibilityLevel', 'precedence', 'ordinal']);
  const NAMES = new Set(['sortByColumn', 'column', 'groupByColumn', 'expressionSource', 'queryGroup', 'baseTable', 'relationship', 'hierarchy']);
  const LISTS = { column: 'columns', measure: 'measures', hierarchy: 'hierarchies', level: 'levels', partition: 'partitions', calculationItem: 'calculationItems',
    annotation: 'annotations', extendedProperty: 'extendedProperties', variation: 'variations', tablePermission: 'tablePermissions', columnPermission: 'columnPermissions',
    perspectiveTable: 'perspectiveTables', perspectiveColumn: 'perspectiveColumns', perspectiveMeasure: 'perspectiveMeasures', perspectiveHierarchy: 'perspectiveHierarchies',
    member: 'members', queryGroup: 'queryGroups' };
  // what the text after "=" is, per object type (a column with one is a calculated column)
  const DEFAULT = { measure: 'expression', column: 'expression', calculationItem: 'expression', expression: 'expression', function: 'expression',
    tablePermission: 'filterExpression', annotation: 'value', linguisticMetadata: 'content' };

  function value(k, v) {
    if (v === true) return true;
    if (v === 'true' || v === 'false') return v === 'true';
    if (NUMBERS.has(k) && /^-?\d+$/.test(v)) return +v;
    if (NAMES.has(k)) return readName(v)[0];
    if (k === 'defaultHierarchy') { const [table, hierarchy] = readRef(v); return { table, hierarchy }; }
    if (k === 'baseColumn') { const [table, column] = readRef(v); return { table, column }; }
    return unquote(v);
  }

  function toJson(node) {
    const o = {};
    if (node.name != null) o.name = node.name;
    if (node.description != null) o.description = node.description;
    if (node.expr != null) {
      if (DEFAULT[node.type]) o[DEFAULT[node.type]] = node.expr;
      else if (node.type === 'extendedProperty') { try { Object.assign(o, { type: 'json', value: JSON.parse(node.expr) }); } catch (e) { Object.assign(o, { type: 'string', value: node.expr }); } }
      else if (node.type === 'formatStringDefinition' || node.type === 'detailRowsDefinition' || node.type === 'source') o.expression = node.expr;
    }
    node.props.forEach(([k, v]) => {
      if (DROP.has(k) && !(keepTags && TAGS.has(k))) return;
      if (node.type === 'relationship' && (k === 'fromColumn' || k === 'toColumn')) {
        const [t, c] = readRef(v), side = k.slice(0, -6);
        o[side + 'Table'] = t; o[side + 'Column'] = c;
      } else if (node.type === 'relatedColumnDetails' && k === 'groupByColumn') (o.groupByColumns = o.groupByColumns || []).push({ groupingColumn: value(k, v) });
      else o[k] = value(k, v);
    });
    node.children.forEach((c) => {
      if (c.type === 'ref' || DROP.has(c.type)) return;
      if (LISTS[c.type]) (o[LISTS[c.type]] = o[LISTS[c.type]] || []).push(toJson(c));
      else if (c.name == null && c.expr != null && !c.props.length && !c.children.length && !/Definition$|^source$/.test(c.type)) o[c.type] = c.expr;
      else o[c.type] = toJson(c);
    });
    if (node.type === 'column' && node.expr != null) o.type = 'calculated';
    // Desktop writes no dataType when Power BI works the type out from the DAX (columns of DAX tables): only the
    // open model knows it, so it is unknown here, never taken as text
    if (node.type === 'column' && !o.dataType) o.dataType = 'unknown';
    // "partition X = m": the text after "=" is the kind of source
    if (node.type === 'partition') o.source = Object.assign({ type: node.expr || 'm' }, o.source);
    if (node.type === 'expression' && !o.kind) o.kind = 'm';
    return o;
  }

  // ---------- 3. a project's files into one model ----------
  // opts.lineageTags: keep each object's lineageTag and sourceLineageTag
  function fromFiles(files, opts) {
    keepTags = !!(opts && opts.lineageTags);
    try { return build(files); } finally { keepTags = false; }
  }
  function build(files) {
    const parts = { tables: [], relationships: [], expressions: [], functions: [], roles: [], perspectives: [], cultures: [], dataSources: [], queryGroups: [], annotations: [] };
    const refs = {};
    let database = null, model = null;
    (files || []).filter((f) => f && /\.tmdl$/i.test(f.path) && !/(^|\/)TMDLScripts\//i.test(f.path.replace(/\\/g, '/')))
      .forEach((f) => parse(f.text).children.forEach((n) => {
        if (n.type === 'database') database = n;
        else if (n.type === 'model') model = n;
        else if (n.type === 'ref') (refs[n.of] = refs[n.of] || []).push(n.name);
        else if (n.type === 'annotation') parts.annotations.push(toJson(n));
        else {
          const key = { table: 'tables', relationship: 'relationships', expression: 'expressions', function: 'functions', role: 'roles', perspective: 'perspectives',
            cultureInfo: 'cultures', dataSource: 'dataSources', queryGroup: 'queryGroups' }[n.type];
          if (key) parts[key].push(toJson(n));
        }
      }));
    // the model's own order (model.tmdl lists its tables, roles, cultures... with "ref"), files not listed after
    const order = (list, of) => {
      const at = new Map((refs[of] || []).map((n, i) => [n, i]));
      return list.map((x, i) => [x, at.has(x.name) ? at.get(x.name) : at.size + i]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
    };
    parts.tables = order(parts.tables, 'table');
    parts.roles = order(parts.roles, 'role');
    parts.perspectives = order(parts.perspectives, 'perspective');
    parts.cultures = order(parts.cultures, 'cultureInfo');
    parts.expressions = order(parts.expressions, 'expression');
    // a column of a DAX table is a calculated table column, as in a model.bim
    parts.tables.forEach((t) => {
      if ((t.partitions || []).some((p) => p.source && p.source.type === 'calculated')) (t.columns || []).forEach((c) => { if (!c.type) c.type = 'calculatedTableColumn'; });
    });
    const m = model ? toJson(model) : {};
    if (parts.annotations.length) m.annotations = (m.annotations || []).concat(parts.annotations);
    if (parts.queryGroups.length) m.queryGroups = (m.queryGroups || []).concat(parts.queryGroups);
    ['tables', 'relationships', 'expressions', 'functions', 'roles', 'perspectives', 'cultures', 'dataSources'].forEach((k) => { if (parts[k].length || k === 'tables') m[k] = parts[k]; });
    const db = database ? toJson(database) : {};
    return Object.assign(db, { model: m });
  }

  const api = { fromFiles, parse };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TmdlModel = api;
})(typeof self !== 'undefined' ? self : this);
