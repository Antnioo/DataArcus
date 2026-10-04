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
  // Single-line property values; refuse values that would break the line
  const safeValue = (v) => typeof v === 'string' && !/[\r\n]/.test(v);
  // TMDL strips leading and trailing double quotes and whitespace from a property value, so a value with either
  // is written in double quotes, with its own double quotes doubled ("Yes";"No" -> """Yes"";""No""")
  const textValue = (v) => (/"/.test(v) || v !== v.trim() ? '"' + v.replace(/"/g, '""') + '"' : v);

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
    out.push(ind(depth) + key + ': ' + textValue(v));
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

  // ---------- round 2: sort columns and number formats as ready scripts (shared by the website and the MCP) ----------
  // Month and weekday names sort A to Z unless the model gives them a sort-by column. sortColumnFor finds the number
  // column of the same table to sort by: a year-month number for "Month Year", a weekday number for a day name, a
  // month number for a month name; a Hijri or fiscal name only by a Hijri or fiscal number; a column the files give no
  // type for (a DAX table's) only when its name says it is a number. (assets/js/pbip-bind.js has the same rule for the
  // report writer: keep the two alike; mcp/test.mjs compares them.)
  const NAME_LIKE = /(^|\s|_)(month|day|weekday)\s*_?(name|short)$|^(day of week|weekday|mmm|mmmm)$|short\s*month|month\s*-?\s*year|^month\s*year$|^(اسم\s*)?(الشهر|اليوم)$/i;
  const sortKind = (n) => (/month|الشهر/i.test(n) && /year|السنة/i.test(n) ? 'yearMonth' : /day|week|اليوم/i.test(n) ? 'day' : 'month');
  const SORT_BY = {
    yearMonth: /^(year\s*-?\s*month|month\s*-?\s*year|yyyymm)\s*(no|num|number|index|key|sort|order|id)?$/i,
    day: /(weekday|day\s*of\s*week)\s*(no|num|number|index)?$|^weekday$|^رقم\s*اليوم$/i,
    month: /month\s*(no|num|number|index)$|^month$|month\s*of\s*year|^رقم\s*الشهر$/i
  };
  const FAMILY = /hijri|fiscal|هجري|مالي/i;
  const family = (n) => (String(n).match(FAMILY) || [''])[0].toLowerCase();
  function sortColumnFor(columns, colName) {
    if (!NAME_LIKE.test(String(colName).replace(FAMILY, '').trim())) return null;
    const kind = sortKind(colName), fam = family(colName);
    const type = (c) => String(c.dataType || (c.type === 'calculatedTableColumn' || c.isDataTypeInferred ? 'unknown' : 'string')).toLowerCase(), plain = (c) => String(c.name).replace(FAMILY, '').trim();
    const numberName = /(no|num|number|index|key|sort|order|id)$|day\s*of\s*week|month\s*of\s*year|^رقم/i;
    const ok = (c) => c.name !== colName && family(c.name) === fam && SORT_BY[kind].test(plain(c)) && (/^(int64|double|decimal|number)$/.test(type(c)) || (type(c) === 'unknown' && numberName.test(plain(c))));
    return (columns || []).find(ok) || null;
  }
  const noSortColumn = (n) => ({ yearMonth: 'no year-month number column (like 202401)', day: 'no weekday number column', month: 'no month number column' })[sortKind(n)];
  const WEEK_STARTS = ['sunday', 'monday', 'saturday'];
  const tref = (t) => "'" + String(t).replace(/'/g, "''") + "'", cref = (t, c) => tref(t) + '[' + String(c).replace(/]/g, ']]') + ']';
  // the DAX of a number column made from the table's date column; the week starts on Sunday (Saudi Arabia and most of
  // the Gulf), Monday (the Saturday-Sunday weekend, as in the UAE since 2022) or Saturday
  const numberDax = (kind, d, weekStart) => (kind === 'month' ? 'MONTH ( ' + d + ' )' : kind === 'yearMonth' ? 'YEAR ( ' + d + ' ) * 100 + MONTH ( ' + d + ' )'
    : weekStart === 'monday' ? 'WEEKDAY ( ' + d + ', 2 )' : weekStart === 'saturday' ? 'MOD ( WEEKDAY ( ' + d + ', 1 ), 7 ) + 1' : 'WEEKDAY ( ' + d + ', 1 )');
  const numberName = (kind) => ({ month: 'Month Number', yearMonth: 'Year Month Number', day: 'Day of Week Number' })[kind];
  // items: [{ table, column }] (the columns of the MONTH_SORT finding); opts.weekStart: 'sunday' (default), 'monday', 'saturday'.
  // Returns { script, count, sorts: [{ column, by, added }], byHand: [{ column, why, steps }], weekStart }.
  // A column of a DAX table is never rewritten by a script (a TMDL script can't change it under "ref table":
  // confirmed in Power BI Desktop), a Hijri or fiscal name without its own number can't be worked out from a date,
  // and a table without a date column has nothing to make the number from: those are told as steps by hand.
  function sortFixes(rawTables, items, opts) {
    const weekStart = WEEK_STARTS.includes(opts && opts.weekStart) ? opts.weekStart : 'sunday';
    const byTable = new Map(), sorts = [], byHand = [];
    const hand = (obj, why, steps) => byHand.push({ column: obj, why, steps });
    // a column that is itself the number another listed name is sorted by is not a name to sort (an untyped
    // "Day of Week" beside "Day Name": the check can't tell without a type)
    const numbers = new Set();
    (items || []).forEach((it) => { const t = (rawTables || []).find((x) => x.name === it.table), by = t && sortColumnFor(t.columns, it.column); if (by) numbers.add(it.table + '[' + by.name + ']'); });
    (items || []).forEach((it) => {
      if (numbers.has(it.table + '[' + it.column + ']')) return;
      const t = (rawTables || []).find((x) => x.name === it.table), c0 = t && (t.columns || []).find((x) => x.name === it.column), obj = it.table + '[' + it.column + ']';
      if (!c0) { hand(obj, 'not found in the model files', 'Select the column in Power BI Desktop, then Column tools > Sort by column > its number column.'); return; }
      const kind = sortKind(it.column), dax = c0.type === 'calculatedTableColumn', by = sortColumnFor(t.columns, it.column);
      if (dax) { hand(obj, 'a column of a DAX table: a script can\'t change it', by ? 'Select ' + obj + ' in Power BI Desktop, then Column tools > Sort by column > ' + by.name + '.'
        : 'Add a number column to the table\'s DAX (' + noSortColumn(it.column) + ' found), for example "' + numberName(kind) + '", ' + numberDax(kind, '[Date]', weekStart) + ', then select ' + obj + ' > Column tools > Sort by column > that column.'); return; }
      if (!byTable.has(t.name)) byTable.set(t.name, { added: new Map(), cols: new Map() });
      const g = byTable.get(t.name);
      let byName = by && by.name, added = false;
      if (!by) {
        const d = (t.columns || []).find((x) => /^date$/i.test(x.name) && x.dataType === 'dateTime') || (t.columns || []).find((x) => x.dataType === 'dateTime');
        if (family(it.column)) { hand(obj, noSortColumn(it.column) + ' for this ' + family(it.column) + ' name, and it can\'t be worked out from the date', 'Add the ' + family(it.column) + ' number column at the source, then Column tools > Sort by column.'); return; }
        if (!d) { hand(obj, noSortColumn(it.column) + ', and the table has no date column to make one from', 'Add a number column at the source, then select ' + obj + ' > Column tools > Sort by column > that column.'); return; }
        byName = numberName(kind);
        for (let n = 2; (t.columns || []).some((x) => x.name === byName); n++) byName = numberName(kind) + ' ' + n;
        if (!g.added.has(kind)) g.added.set(kind, { type: 'calculated', name: byName, dataType: 'int64', isHidden: true, summarizeBy: 'none', expression: numberDax(kind, cref(t.name, d.name), weekStart) });
        byName = g.added.get(kind).name; added = true;
      }
      const c = g.cols.get(c0.name) || JSON.parse(JSON.stringify(c0));
      c.sortByColumn = byName; g.cols.set(c0.name, c);
      sorts.push({ column: obj, by: it.table + '[' + byName + ']', added });
    });
    const out = ['createOrReplace', ''];
    let count = 0;
    byTable.forEach((g, tname) => {
      const block = [];
      const emit = (c) => { const lines = column(c, 2); if (lines) { block.push.apply(block, lines); block.push(''); return true; } return false; };
      const done = new Set();
      g.cols.forEach((c, cname) => {
        const newCol = Array.from(g.added.values()).find((a) => a.name === c.sortByColumn);
        // the column must be one this builder can write back whole: otherwise it is left for the user, never half-written
        if (!column(c, 2)) { hand(tname + '[' + cname + ']', 'has a property this script builder does not know', 'Select it in Power BI Desktop, then Column tools > Sort by column > ' + c.sortByColumn + (newCol ? ' (add it first: ' + newCol.expression + ')' : '') + '.'); return; }
        if (newCol && !done.has(newCol.name)) { emit(newCol); done.add(newCol.name); }
        emit(c); count++;
      });
      if (block.length) out.push(ind(1) + 'ref table ' + name(tname), '', ...block);
    });
    const kept = sorts.filter((s) => !byHand.some((h) => h.column === s.column));
    return { script: count ? out.join('\n').replace(/\n+$/, '\n') : null, count, sorts: kept, byHand, weekStart };
  }

  // A format for a measure that has none, with its reason: a name that reads as a percentage gets 0.0%; a count (COUNT,
  // COUNTROWS, DISTINCTCOUNT...) or a sum of a whole-number column gets #,0; every other measure #,0.00. A suggestion,
  // shown with its reason and never applied by itself.
  const PCT_NAME = /(%|\bpct\b|\bpercent(age)?\b|\brate\b|\bratio\b|\bshare\b|\bmargin\b|نسبة|هامش)/i;
  function suggestFormat(m, rawTables) {
    const expr = text(m.expression).replace(/\/\/.*$/gm, '').replace(/--.*$/gm, '').trim();
    if (PCT_NAME.test(m.name)) return { format: '0.0%', reason: 'the name reads as a percentage' };
    if (/^(COUNT|COUNTA|COUNTAX|COUNTBLANK|COUNTROWS|COUNTX|DISTINCTCOUNT|DISTINCTCOUNTNOBLANK)\s*\(/i.test(expr)) return { format: '#,0', reason: 'it counts rows or values' };
    const sum = expr.match(/^SUM\s*\(\s*'?([^'\[\]]+?)'?\s*\[\s*([^\]]+)\]\s*\)$/i);
    if (sum) {
      const t = (rawTables || []).find((x) => x.name.toLowerCase() === sum[1].trim().toLowerCase()), c = t && (t.columns || []).find((x) => x.name.toLowerCase() === sum[2].trim().toLowerCase());
      if (c && c.dataType === 'int64') return { format: '#,0', reason: 'a sum of a whole-number column' };
    }
    return { format: '#,0.00', reason: 'a number: thousands separator and two decimals' };
  }
  // names: the measures to give a format (the NO_FORMAT finding), or to change to a percentage (PCT_FORMAT: percent true).
  // Returns { script, count, suggested: [{ measure, format, reason }], byHand: [{ measure, why, steps }] }.
  function formatFixes(rawTables, names, opts) {
    const want = new Set((names || []).map((n) => String(n).toLowerCase())), percent = !!(opts && opts.percent);
    const out = ['createOrReplace', ''], suggested = [], byHand = [];
    let count = 0;
    (rawTables || []).forEach((t) => {
      const block = [];
      (t.measures || []).forEach((m0) => {
        if (!want.has(String(m0.name).toLowerCase())) return;
        if (m0.formatStringDefinition || (m0.formatString && !percent)) return;   // it has a format: never touched
        const s = percent ? { format: '0.0%', reason: 'the name reads as a percentage but the format is ' + m0.formatString } : suggestFormat(m0, rawTables);
        const lines = measure(Object.assign({}, m0, { formatString: s.format }), 2);
        if (lines) { block.push.apply(block, lines); block.push(''); count++; suggested.push({ measure: '[' + m0.name + ']', format: s.format, reason: s.reason }); }
        else byHand.push({ measure: '[' + m0.name + ']', why: 'has a property this script builder does not know', steps: 'Select the measure in Power BI Desktop, then Measure tools > Format: ' + s.format + ' (' + s.reason + ').' });
      });
      if (block.length) out.push(ind(1) + 'ref table ' + name(t.name), '', ...block);
    });
    return { script: count ? out.join('\n').replace(/\n+$/, '\n') : null, count, suggested, byHand };
  }

  // ---------- round 6: thousand separators ----------
  // A number format without a thousand separator shows 13857, not 13,857. lacksSeparator(format): a custom number
  // format (digit placeholders 0 or #) with no "," before the decimal point. Never true for a percentage, a date or
  // time format, scientific notation, text, a named format, or no format at all (a measure without a format is the
  // NO_FORMAT finding's; a column without one is asked about separately, see separatorFixes).
  const unquoted = (f) => String(f).replace(/"[^"]*"/g, '').replace(/\\./g, '');
  function lacksSeparator(format) {
    if (format == null || !String(format).trim()) return false;
    const f = unquoted(format);
    if (!/[0#]/.test(f) || /%/.test(f) || /e[+-]/i.test(f) || /[dmyhs]/i.test(f) || /^[a-z ]+$/i.test(f.trim())) return false;
    return f.split(';').some((sec) => /[0#]/.test(sec) && !/,/.test(sec.split('.')[0]));
  }
  // the same format with the separator: each section's whole-number part becomes #,0 ("0.00" -> "#,0.00")
  function withSeparator(format) {
    let quoted = false;
    // split into sections at ";" outside quotes, then replace the first run of digit placeholders of each
    const secs = []; let cur = '';
    for (const ch of String(format)) { if (ch === '"') quoted = !quoted; if (ch === ';' && !quoted) { secs.push(cur); cur = ''; } else cur += ch; }
    secs.push(cur);
    return secs.map((sec) => {
      if (/,/.test(unquoted(sec).split('.')[0]) || !/[0#]/.test(unquoted(sec))) return sec;
      let q = false, done = false, out = '';
      for (let i = 0; i < sec.length; i++) {
        const ch = sec[i];
        if (ch === '"') q = !q;
        if (!q && !done && (ch === '0' || ch === '#')) { let j = i; while (j < sec.length && (sec[j] === '0' || sec[j] === '#')) j++; out += '#,0'; i = j - 1; done = true; } else out += ch;
      }
      return out;
    }).join(';');
  }
  // Columns that are identifiers or parts of a date, by name: a separator would be wrong on them (2,026)
  const NOT_A_QUANTITY = /year|month|day|week|quarter|hijri|(^|[\s_-])(id|key|code|no|num|number|index|sort|order|rank|zip|postal|phone|mobile)s?$|[a-z]ID$|Key$|السنة|الشهر|اليوم|رقم/i;
  // Measures whose format has no separator, and visible number columns that are summed (summarizeBy not "none", not
  // an identifier or a date part by name) whose format has none or that have no format: each with the format to
  // give it, and a script that does. A percentage by name is left to the percentage check. max: objects of each kind.
  // Returns { script, count, measures: [{ measure, from, to }], columns: [{ column, from, to }], byHand, more }.
  function separatorFixes(rawTables, opts) {
    const max = (opts && opts.max) || 200, out = ['createOrReplace', ''], measures = [], columns = [], byHand = [];
    let count = 0, more = 0;
    (rawTables || []).forEach((t) => {
      const block = [];
      (t.measures || []).forEach((m0) => {
        if (m0.formatStringDefinition || !lacksSeparator(m0.formatString) || PCT_NAME.test(m0.name)) return;
        if (measures.length >= max) { more++; return; }
        const to = withSeparator(m0.formatString), lines = measure(Object.assign({}, m0, { formatString: to }), 2);
        if (lines) { block.push.apply(block, lines); block.push(''); count++; measures.push({ measure: '[' + m0.name + ']', from: m0.formatString, to }); }
        else byHand.push({ measure: '[' + m0.name + ']', why: 'has a property this script builder does not know', steps: 'Select the measure in Power BI Desktop, then Measure tools > Format: ' + to + '.' });
      });
      (t.columns || []).forEach((c0) => {
        if (c0.type === 'rowNumber' || c0.isHidden || !/^(int64|double|decimal)$/.test(String(c0.dataType)) || c0.summarizeBy === 'none' || NOT_A_QUANTITY.test(c0.name)) return;
        if (c0.formatString && !lacksSeparator(c0.formatString)) return;
        const to = c0.formatString ? withSeparator(c0.formatString) : c0.dataType === 'int64' ? '#,0' : '#,0.00', obj = t.name + '[' + c0.name + ']';
        if (columns.length >= max) { more++; return; }
        // a DAX table's column can't be rewritten by a script (see sortFixes)
        if (c0.type === 'calculatedTableColumn') { byHand.push({ column: obj, why: 'a column of a DAX table: a script can\'t change it', steps: 'Select ' + obj + ' in Power BI Desktop, then Column tools > Format: ' + to + ' (the thousands separator button).' }); return; }
        const lines = column(Object.assign({}, c0, { formatString: to }), 2);
        if (lines) { block.push.apply(block, lines); block.push(''); count++; columns.push({ column: obj, from: c0.formatString || null, to }); }
        else byHand.push({ column: obj, why: 'has a property this script builder does not know', steps: 'Select ' + obj + ' in Power BI Desktop, then Column tools > Format: ' + to + '.' });
      });
      if (block.length) out.push(ind(1) + 'ref table ' + name(t.name), '', ...block);
    });
    return { script: count ? out.join('\n').replace(/\n+$/, '\n') : null, count, measures, columns, byHand, more };
  }

  const api = { measure, column, columnFixes, moveMeasures, name, sortColumnFor, noSortColumn, sortKind, sortFixes, formatFixes, suggestFormat, lacksSeparator, withSeparator, separatorFixes, notAQuantity: (n) => NOT_A_QUANTITY.test(String(n)) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MHTmdl = api;
})(typeof self !== 'undefined' ? self : this);
