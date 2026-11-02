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
  // a 'quoted name' that never closes (the text ends inside it)
  function openQuote(s) {
    s = String(s).replace(/^\s+/, '');
    if (s[0] !== "'") return false;
    for (let i = 1; i < s.length; i++) if (s[i] === "'") { if (s[i + 1] === "'") i++; else return false; }
    return true;
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
    // (AU47, the night audit's AUD-047: a file Power BI Desktop could not open was read in part, silently) what this
    // parse could not place, with its line: read() names the file, never its text
    // top.last: the file's last item as the parse read it, the evidence a file with no final line break is cut short
    const top = { type: 'file', props: [], children: [], problems: [], last: null }, owners = [top];
    const problem = (code, i) => { if (!top.problems.length) top.problems.push({ code, line: i + 1 }); };
    let desc = [];
    // the expression after "=": inline text, ``` fenced lines, or the lines deeper than `deeper`
    const expr = (inline, i, deeper) => {
      const block = [];
      let j = i + 1;
      if (inline === '```') {
        for (; j < lines.length && lines[j].t !== '```'; j++) block.push(lines[j]);
        if (j >= lines.length) problem('stopped', i);   // a ``` fence never closed
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
      if (t.startsWith('///')) { desc.push(t.replace(/^\/\/\/ ?/, '')); top.last = { kind: 'description' }; i++; continue; }
      // (F-M1, the fuzz test: a truncated or mis-indented file left holes in this stack and the reader threw. A line
      // deeper than its parent belongs to the deepest object there is, and the stack never has a hole.)
      // (AU47) indentation that is neither tabs nor four spaces, or a line more than one level deeper than its parent
      if (/^\s/.test(lines[i].raw.replace(/^( {4})+/, (x) => '\t'.repeat(x.length / 4)).slice(d)) || d > owners.length - 1) problem('indent', i);
      const at = Math.min(d, owners.length - 1), owner = owners[at];
      let m;
      if ((m = t.match(/^(\w+)\s*:\s*(.*)$/))) { owner.props.push([m[1], m[2].trim()]); top.last = { kind: 'prop', key: m[1], value: m[2].trim() }; i++; continue; }
      let node;
      if ((m = t.match(/^(\w+)\s*=\s*(.*)$/))) {
        const e = expr(m[2].trim(), i, d + 1);
        node = { type: m[1], name: null, expr: e.value }; i = e.next;
        top.last = { kind: 'expression', expr: e.value };
      } else if ((m = t.match(/^(\w+)$/))) {
        let j = i + 1; while (j < lines.length && (!lines[j].t || lines[j].t.startsWith('///'))) j++;
        if (!(j < lines.length && lines[j].d > d)) { owner.props.push([m[1], true]); top.last = { kind: 'flag', key: m[1] }; i++; continue; }
        node = { type: m[1], name: null }; i++;
      } else if ((m = t.match(/^ref\s+(\w+)\s+(.+)$/))) {
        node = { type: 'ref', name: readName(m[2])[0], of: m[1] }; i++;
        top.last = { kind: 'declaration', name: node.name, open: openQuote(m[2]) };
      } else if ((m = t.match(/^(\w+)\s+(.+)$/))) {
        const [name, rest] = readName(m[2]);
        node = { type: m[1], name };
        const eq = rest.match(/^\s*=\s*(.*)$/);
        if (eq) { const e = expr(eq[1].trim(), i, d + 1); node.expr = e.value; i = e.next; } else i++;
        top.last = eq ? { kind: 'expression', expr: node.expr, name, open: openQuote(m[2]) } : { kind: 'declaration', name, open: openQuote(m[2]) };
      } else { problem('stopped', i); i++; continue; }
      node.props = []; node.children = [];
      if (desc.length) { node.description = desc.join('\n'); desc = []; }
      owner.children.push(node);
      owners.length = at + 1; owners.push(node);
    }
    return top;
  }

  // ---------- 2. the tree into model JSON (the shape of a model.bim) ----------
  // lineage tags are left out (the health check has no use for them) unless fromFiles is asked to keep them: the
  // fix scripts write an object back whole, and without its tag Power BI Desktop gives it a new one (measured)
  const DROP = new Set(['lineageTag', 'sourceLineageTag', 'changedProperty']), TAGS = new Set(['lineageTag', 'sourceLineageTag']);
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

  // opts.lineageTags: keep each object's tags (passed down, never kept in the module: the audit's A1-14)
  function toJson(node, opts) {
    const keepTags = !!(opts && opts.lineageTags);
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
      if (LISTS[c.type]) (o[LISTS[c.type]] = o[LISTS[c.type]] || []).push(toJson(c, opts));
      else if (c.name == null && c.expr != null && !c.props.length && !c.children.length && !/Definition$|^source$/.test(c.type)) o[c.type] = c.expr;
      else o[c.type] = toJson(c, opts);
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
  const modelFiles = (files) => (files || []).filter((f) => f && /\.tmdl$/i.test(f.path) && !/(^|\/)TMDLScripts\//i.test(f.path.replace(/\\/g, '/')));
  // opts.lineageTags: keep each object's lineageTag and sourceLineageTag
  function fromFiles(files, opts) { return build(modelFiles(files), opts || {}, new Map()); }
  // (AU47) the model and every file that could not be read fully: { model, skipped: [{ path, code, line? }] }. A skipped
  // file is named with why, never with its text; what it held in part is still in the model, and the caller says so first
  // (the MCP's read_model and check_model_health, the website's Health Check) or refuses to plan on it
  function read(files, opts) {
    const files0 = modelFiles(files), parsed = new Map(files0.map((f) => [f, parse(f.text)]));
    const problemOf = (f) => problemIn(f, parsed.get(f));
    const skipped = files0.map(problemOf).filter(Boolean);
    return { model: build(files0, opts || {}, parsed), skipped };
  }
  // why one file can't be read fully, or null: the first of empty, not text, git merge-conflict markers, a line the
  // parse could not place (indentation, a line it stopped at), cut short (no final line break, and the last item is
  // visibly incomplete: cutAtEnd), a tables/ file with no table in it
  function problemIn(f, tree) {
    const text = String(f.text == null ? '' : f.text).replace(/^\uFEFF/, ''), at = (re) => { const k = text.split(/\r?\n/).findIndex((l) => re.test(l)); return k + 1; };
    const out = (code, line) => Object.assign({ path: f.path, code }, line ? { line } : {});
    if (!text.trim()) return out('empty');
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/.test(text)) return out('notText');
    if (/^(<{7}|>{7})( |$)/m.test(text)) return out('conflict', at(/^(<{7}|={7}|>{7})( |$)/));
    if (tree.problems.length) return out(tree.problems[0].code, tree.problems[0].line);
    if (!/\n$/.test(text) && cutAtEnd(tree.last)) return out('cut', text.split(/\r?\n/).length);
    if (/(^|\/)tables\/[^/]+$/i.test(f.path.replace(/\\/g, '/')) && !tree.children.some((n) => n.type === 'table')) return out('noTable');
    return null;
  }
  // (the reviewer, 26 Oct: a missing final line break alone is no evidence; VS Code, Notepad and git tools often leave
  // none on a whole file) a file whose last line has no line break is cut short only when that last item is
  // visibly incomplete: an unknown bare word (a property cut mid-word), a property with no value, a data type that is
  // none, a [column] or "text" that never closes, a declaration with no name or an open 'quoted name', an expression
  // whose brackets or strings never close, or a description with no object after it. A file cut exactly at a line
  // break, or between two whole items, reads as a whole, shorter file: nothing in it says otherwise
  const FLAGS = new Set(['isHidden', 'isPrivate', 'isNameInferred', 'isDataTypeInferred', 'isKey', 'isUnique', 'isNullable', 'isDefaultLabel', 'isDefaultImage',
    'showAsVariationsOnly', 'isAvailableInMdx', 'legacyRedirects', 'returnErrorValuesAsNull', 'fastCombine', 'excludeFromModelRefresh', 'isRemoved']);
  const TYPES = new Set(['string', 'int64', 'double', 'dateTime', 'decimal', 'boolean', 'binary', 'variant', 'unknown', 'automatic']);
  // brackets and "strings" that never close ("" inside a string is a quote)
  function unclosed(x) {
    let depth = 0, inStr = false;
    for (let i = 0; i < x.length; i++) {
      const c = x[i];
      if (inStr) { if (c === '"') { if (x[i + 1] === '"') i++; else inStr = false; } continue; }
      if (c === '"') inStr = true; else if ('([{'.includes(c)) depth++; else if (')]}'.includes(c)) depth--;
    }
    return inStr || depth > 0;
  }
  function cutAtEnd(last) {
    if (!last) return false;
    if (last.kind === 'description') return true;
    if (last.kind === 'flag') return !FLAGS.has(last.key);
    if (last.kind === 'prop') return !last.value || (last.key === 'dataType' && !TYPES.has(last.value)) || unclosed(last.value);
    if (last.kind === 'declaration') return !last.name || last.open;
    if (last.kind === 'expression') return !String(last.expr || '').trim() || last.open || unclosed(String(last.expr));
    return false;
  }
  const WHY = {
    empty: ['empty file', 'ملف فارغ'],
    notText: ['not text', 'ليس ملفًا نصيًا'],
    conflict: ['git merge-conflict markers (<<<<<<<) at line #', 'علامات تعارض دمج من git (<<<<<<<) في السطر #'],
    indent: ['unexpected indentation at line #', 'مسافة بادئة غير متوقعة في السطر #'],
    stopped: ['parse stopped at line #', 'توقفت القراءة عند السطر #'],
    cut: ['cut short: line #, the last, stops in the middle of an item', 'الملف مقطوع: السطر #، وهو الأخير، يتوقف في منتصف عنصر'],
    noTable: ['no table definition in it', 'لا يحتوي على تعريف جدول']
  };
  const whyOf = (s, lang) => (WHY[s.code] || WHY.stopped)[lang === 'ar' ? 1 : 0].replace('#', String(s.line || 1));
  // the one message, first in every answer that read such a model: items { path | file, code | why } (a caller passes
  // the file as it shows names, screened, and the reason in its words); again: 'check' on the website, else 'ask'
  function unreadableSaid(skipped, lang, again) {
    const list = (skipped || []).map((s) => `${s.file != null ? s.file : s.path} (${s.why != null && lang !== 'ar' ? s.why : whyOf(s, lang)})`), n = list.length;
    if (lang === 'ar') return `تعذّرت قراءة ${n} من ملفات النموذج: ${list.join('؛ ')}. ${again === 'check' ? 'الفحص أدناه ينقصه' : 'الإجابة أدناه ينقصها'} ما تحتويه هذه الملفات؛ أصلح الملف في Power BI Desktop أو في محرر النصوص ثم ${again === 'check' ? 'افحصه' : 'اسأل'} مرة أخرى.`;
    return `${n} model file(s) could not be read: ${list.join('; ')}. The ${again === 'check' ? 'check' : 'answer'} below is missing what they hold; fix the file in Power BI Desktop or your editor and ${again === 'check' ? 'check it' : 'ask'} again.`;
  }
  function build(files, opts, parsed) {
    const parts = { tables: [], relationships: [], expressions: [], functions: [], roles: [], perspectives: [], cultures: [], dataSources: [], queryGroups: [], annotations: [] };
    const refs = {};
    let database = null, model = null;
    files.forEach((f) => (parsed.get(f) || parse(f.text)).children.forEach((n) => {
        if (n.type === 'database') database = n;
        else if (n.type === 'model') model = n;
        else if (n.type === 'ref') (refs[n.of] = refs[n.of] || []).push(n.name);
        else if (n.type === 'annotation') parts.annotations.push(toJson(n, opts));
        else {
          const key = { table: 'tables', relationship: 'relationships', expression: 'expressions', function: 'functions', role: 'roles', perspective: 'perspectives',
            cultureInfo: 'cultures', dataSource: 'dataSources', queryGroup: 'queryGroups' }[n.type];
          if (key) parts[key].push(toJson(n, opts));
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
    const m = model ? toJson(model, opts) : {};
    if (parts.annotations.length) m.annotations = (m.annotations || []).concat(parts.annotations);
    if (parts.queryGroups.length) m.queryGroups = (m.queryGroups || []).concat(parts.queryGroups);
    ['tables', 'relationships', 'expressions', 'functions', 'roles', 'perspectives', 'cultures', 'dataSources'].forEach((k) => { if (parts[k].length || k === 'tables') m[k] = parts[k]; });
    const db = database ? toJson(database, opts) : {};
    return Object.assign(db, { model: m });
  }

  const api = { fromFiles, read, whyOf, unreadableSaid, parse };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TmdlModel = api;
})(typeof self !== 'undefined' ? self : this);
