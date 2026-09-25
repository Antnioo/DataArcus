/*
 * DataArcus Power BI Model Health Check: TMDL script builder (premium preview).
 * Turns model objects read from a .pbit back into TMDL, the way Power BI Desktop's
 * TMDL view writes them, so fixes can be applied with createOrReplace + Preview.
 * Objects with properties this builder does not know are never rewritten (they
 * are listed as "do by hand"), so no property can be dropped silently.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  const TAB = '\t';
  const ind = (n) => TAB.repeat(n);
  const text = (v) => (Array.isArray(v) ? v.join('\n') : v == null ? '' : String(v));

  // Names: quote unless plain; escape single quotes by doubling
  const name = (n) => (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(n) ? n : "'" + String(n).replace(/'/g, "''") + "'");
  // Single-line property values are written as-is; refuse values that would break the line
  const safeValue = (v) => typeof v === 'string' && !/[\r\n]/.test(v) && v === v.trim();

  const MEASURE_KEYS = new Set(['name', 'expression', 'formatString', 'displayFolder', 'description', 'lineageTag', 'isHidden', 'dataCategory', 'annotations', 'changedProperties', 'formatStringDefinition', 'detailRowsDefinition', 'isSimpleMeasure', 'sourceLineageTag']);
  const COLUMN_KEYS = new Set(['type', 'name', 'dataType', 'isNameInferred', 'isDataTypeInferred', 'isHidden', 'sourceColumn', 'lineageTag', 'summarizeBy', 'annotations', 'formatString', 'sortByColumn', 'changedProperties', 'description', 'expression', 'displayFolder', 'dataCategory', 'isKey', 'isUnique', 'isNullable', 'isDefaultLabel', 'isDefaultImage', 'isAvailableInMdx', 'encodingHint', 'sourceProviderType', 'keepUniqueRows', 'sourceLineageTag']);
  // Written as "key: value" (strings/enums) or as a bare flag / "key: false" (booleans)
  const SCALAR_ORDER_COL = ['dataType', 'isHidden', 'formatString', 'displayFolder', 'dataCategory', 'isKey', 'isUnique', 'isNullable', 'isDefaultLabel', 'isDefaultImage', 'isAvailableInMdx', 'encodingHint', 'sourceProviderType', 'keepUniqueRows', 'lineageTag', 'sourceLineageTag', 'summarizeBy', 'isNameInferred', 'sourceColumn', 'sortByColumn'];
  const SCALAR_ORDER_MEASURE = ['formatString', 'isHidden', 'displayFolder', 'dataCategory', 'isSimpleMeasure', 'lineageTag', 'sourceLineageTag'];

  function description(desc, depth) {
    const d = text(desc);
    if (!d) return [];
    return d.split(/\r?\n/).map((l) => ind(depth) + '/// ' + l);
  }
  // Expressions are always fenced with ``` so their text is kept exactly
  function expressionBlock(head, expr, depth) {
    const lines = text(expr).split(/\r?\n/);
    return [head + ' = ```'].concat(lines.map((l) => ind(depth + 2) + l), [ind(depth + 2) + '```']);
  }
  function scalar(key, v, depth, out) {
    if (v === undefined || v === null) return true;
    if (typeof v === 'boolean') { out.push(ind(depth) + (v ? key : key + ': false')); return true; }
    if (typeof v === 'number') { out.push(ind(depth) + key + ': ' + v); return true; }
    if (key === 'sortByColumn') { out.push(ind(depth) + key + ': ' + name(v)); return true; }
    if (!safeValue(v)) return false;
    out.push(ind(depth) + key + ': ' + v);
    return true;
  }
  function trailer(obj, depth, out) {
    (obj.changedProperties || []).forEach((cp) => out.push(ind(depth) + 'changedProperty = ' + cp.property));
    const ann = obj.annotations || [];
    if (ann.length) out.push('');
    for (const a of ann) {
      const v = text(a.value);
      if (/[\r\n]/.test(v)) return false;
      out.push(ind(depth) + 'annotation ' + name(a.name) + ' = ' + v, '');
    }
    if (ann.length) out.pop();
    return true;
  }

  // Returns lines, or null when the object has something this builder should not touch
  function measure(m, depth) {
    if (Object.keys(m).some((k) => !MEASURE_KEYS.has(k))) return null;
    const out = description(m.description, depth);
    const head = ind(depth) + 'measure ' + name(m.name);
    out.push.apply(out, expressionBlock(head, m.expression, depth));
    for (const k of SCALAR_ORDER_MEASURE) if (!scalar(k, m[k], depth + 1, out)) return null;
    if (m.formatStringDefinition) out.push.apply(out, expressionBlock(ind(depth + 1) + 'formatStringDefinition', m.formatStringDefinition.expression, depth + 1));
    if (m.detailRowsDefinition) out.push.apply(out, expressionBlock(ind(depth + 1) + 'detailRowsDefinition', m.detailRowsDefinition.expression, depth + 1));
    if (!trailer(m, depth + 1, out)) return null;
    return out;
  }
  function column(c, depth) {
    if (Object.keys(c).some((k) => !COLUMN_KEYS.has(k))) return null;
    const out = description(c.description, depth);
    const head = ind(depth) + 'column ' + name(c.name);
    if (c.type === 'calculated') out.push.apply(out, expressionBlock(head, c.expression, depth));
    else out.push(head);
    for (const k of SCALAR_ORDER_COL) {
      if (k === 'dataType' && c.isDataTypeInferred) continue; // Power BI leaves inferred types out
      if (!scalar(k, c[k], depth + 1, out)) return null;
    }
    if (!trailer(c, depth + 1, out)) return null;
    return out;
  }

  // ---------- fix builders ----------
  // edits: [{ table, column, set: { isHidden?, summarizeBy?, sortByColumn? } }]
  function columnFixes(rawTables, edits) {
    const byTable = new Map();
    const manual = [];
    edits.forEach((e) => {
      const t = rawTables.find((x) => x.name === e.table);
      const c0 = t && (t.columns || []).find((x) => x.name === e.column);
      if (!c0) { manual.push(e); return; }
      // Columns of DAX (calculated) tables cannot be rewritten under "ref table": TMDL then treats them
      // as data columns and rejects isNameInferred (confirmed in Power BI Desktop). Leave them for the user.
      if (c0.type === 'calculatedTableColumn') { manual.push(Object.assign({ reason: 'daxTable' }, e)); return; }
      const key = t.name;
      if (!byTable.has(key)) byTable.set(key, new Map());
      const cols = byTable.get(key);
      const c = cols.get(c0.name) || JSON.parse(JSON.stringify(c0));
      if (e.set.isHidden) {
        c.isHidden = true;
        c.changedProperties = c.changedProperties || [];
        if (!c.changedProperties.some((p) => p.property === 'IsHidden')) c.changedProperties.push({ property: 'IsHidden' });
      }
      if (e.set.summarizeBy) {
        c.summarizeBy = e.set.summarizeBy;
        c.annotations = (c.annotations || []).map((a) => (a.name === 'SummarizationSetBy' ? { name: a.name, value: 'User' } : a));
      }
      if (e.set.sortByColumn) c.sortByColumn = e.set.sortByColumn;
      cols.set(c0.name, c);
    });
    const out = ['createOrReplace', ''];
    let count = 0;
    byTable.forEach((cols, t) => {
      const block = [];
      cols.forEach((c, cname) => {
        const lines = column(c, 2);
        if (lines) { block.push.apply(block, lines); block.push(''); count++; }
        else manual.push({ table: t, column: cname });
      });
      if (block.length) out.push(ind(1) + 'ref table ' + name(t), '', ...block);
    });
    return { script: count ? out.join('\n').replace(/\n+$/, '\n') : null, count, manual };
  }
  function moveMeasures(rawTables, names, folder) {
    const want = new Set(names.map((n) => n.toLowerCase()));
    const out = ['createOrReplace', ''];
    const manual = [];
    let count = 0;
    rawTables.forEach((t) => {
      const block = [];
      (t.measures || []).forEach((m0) => {
        if (!want.has(String(m0.name).toLowerCase())) return;
        // keep the original folder under the review folder, so the move can be undone
        const m = Object.assign({}, m0, { displayFolder: m0.displayFolder ? folder + '\\' + m0.displayFolder : folder });
        const lines = measure(m, 2);
        if (lines) { block.push.apply(block, lines); block.push(''); count++; }
        else manual.push(m0.name);
      });
      if (block.length) out.push(ind(1) + 'ref table ' + name(t.name), '', ...block);
    });
    return { script: count ? out.join('\n').replace(/\n+$/, '\n') : null, count, manual };
  }

  const api = { measure, column, columnFixes, moveMeasures, name };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MHTmdl = api;
})(typeof self !== 'undefined' ? self : this);
