// A report's fields resolved against the model: the fields, page filters, SVG columns and cards, the chart axes, and
// the model's relationships for the field picker.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import { modelOf } from './model.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Bind = require('../../assets/js/pbip-bind.js');
const Axes = require('../../assets/js/axis-units.js');
const Fix = require('../../assets/js/model-health-tmdl.js');
const Svg = require('../../assets/js/svg-kpi-compiler.js');

// (round 22) the model's relationships for the field picker, which puts a category the measure's table is related to first;
// (round 22b, the reviewer's second review, item 3) with the whole model's tables, which a measure's DAX may read outside the scope
// (round 23: lang, the report's language, for the picker's language rule)
// (round 23 part 5, the review's 10: one reader of relationships, the shared engine's, with both-directions ones)
export const relsOf = (m, lang) => ({ ...(lang ? { lang } : {}), modelTables: m.tables, relationships: Bind.relsOfTmsl(m.tmsl) });

// ---------- the fields of an approved plan (create_report's fields) ----------
// "Table[Field]" or "'Table'[Field]" as read_model lists them. Each is looked up in the whole model (hidden fields
// too: the user may want one); wanted: 'm' a measure, 'c' a column, 'any'. Returns the picker's own shapes, so the
// report writer binds a given field exactly as it binds a picked one. Every problem is collected and told at once.
export function resolveFields(tables, fields) {
  const r = fieldsAndProblems(tables, fields);
  if (r && r.problems.length) throw new Error(`Nothing was written. ${r.problems.length} of the fields can't be used: ${r.problems.join('; ')}. Use the names exactly as read_model lists them (Table[Field]).`);
  return r && r.out;
}
// the same check, the problems returned (plan_layout's planFields: told before the plan is shown)
export function fieldsAndProblems(tables, fields) {
  if (!fields || !Object.keys(fields).length) return null;
  const problems = [];
  const one = (ref, wanted, where) => {
    const mk = String(ref).trim().match(/^'?(.+?)'?\[(.+)\]$/);
    if (!mk) { problems.push(`${where}: "${ref}" is not written as Table[Field]`); return null; }
    const t = tables.find((x) => x.name === mk[1]) || tables.find((x) => x.name.toLowerCase() === mk[1].toLowerCase());
    const meas = t && (t.measures.find((x) => x.name === mk[2]) || t.measures.find((x) => x.name.toLowerCase() === mk[2].toLowerCase()));
    const col = t && (t.columns.find((x) => x.name === mk[2]) || t.columns.find((x) => x.name.toLowerCase() === mk[2].toLowerCase()));
    if (!t) { problems.push(`${where}: no table "${mk[1]}" in the model (${ref})`); return null; }
    if (!meas && !col) { problems.push(`${where}: ${ref} is not in the model`); return null; }
    if (wanted === 'm' && !meas) { problems.push(`${where}: ${ref} is a column; a measure is needed here`); return null; }
    if (wanted === 'c' && !col) { problems.push(`${where}: ${ref} is a measure; a column is needed here`); return null; }
    // (A3-3: the picker's own measure builder, with the one format rule's formats; a measure the user names is never a variant)
    if (meas && wanted !== 'c') { const k = Bind.measureOf(t, meas.name, tables); return Object.assign({ t: k.t, m: k.m, pct: k.pct, variant: false }, k.text ? { text: true } : {}, k.pctFormat ? { pctFormat: k.pctFormat } : {}, k.wholeFormat ? { wholeFormat: k.wholeFormat } : {}, k.unitAuto ? { unitAuto: true } : {}, k.tableFormat ? { tableFormat: k.tableFormat } : {}, k.fullFormat ? { fullFormat: k.fullFormat } : {}); }   // (round 11, RESCORE-4: unitAuto was dropped here, so the written text-suffix card kept its 2 decimals: "50.87KAED")
    // (the cross-review's G9: the picker's own field builder, so a new picker property needs no edit here)
    return Bind.fieldOf(t, col.name);
  };
  const out = {};
  if (fields.kpis) out.kpis = fields.kpis.map((r, i) => one(r, 'm', `fields.kpis[${i}]`));
  if (fields.measure) out.measure = one(fields.measure, 'm', 'fields.measure');
  for (const k of ['timeAxis', 'category', 'category2']) if (fields[k]) out[k] = one(fields[k], 'c', 'fields.' + k);
  if (fields.table) out.table = fields.table.map((r, i) => one(r, 'any', `fields.table[${i}]`));
  if (fields.slicers) out.slicers = fields.slicers.map((r, i) => one(r, 'c', `fields.slicers[${i}]`));
  return { out, problems };
}
// ---------- page filters (create_report's pageFilters) ----------
// [{ field: "Table[Column]", values: [...] }]: a column of the model (never a measure), looked up as the plan's fields
// are; each value written as a literal of the column's type. Where the files give the column no type (a DAX table's
// column), the value's own type is used and the answer says so. No dates and no DAX. Every problem is told at once.
export function resolvePageFilters(tables, list) {
  if (!list || !list.length) return null;
  const problems = [], seen = new Set();
  const KINDS = { boolean: 'boolean', string: 'text', int64: 'whole', double: 'decimal' };
  const out = list.map((f, i) => {
    const where = `pageFilters[${i}]`, ref = String(f.field).trim(), mk = ref.match(/^'?(.+?)'?\[(.+)\]$/);
    if (!mk) { problems.push(`${where}: "${f.field}" is not written as Table[Column]`); return null; }
    const t = tables.find((x) => x.name === mk[1]) || tables.find((x) => x.name.toLowerCase() === mk[1].toLowerCase());
    if (!t) { problems.push(`${where}: no table "${mk[1]}" in the model (${ref})`); return null; }
    const col = t.columns.find((x) => x.name === mk[2]) || t.columns.find((x) => x.name.toLowerCase() === mk[2].toLowerCase());
    const meas = t.measures.find((x) => x.name === mk[2]) || t.measures.find((x) => x.name.toLowerCase() === mk[2].toLowerCase());
    if (!col && meas) { problems.push(`${where}: ${ref} is a measure, and a page filter takes a column`); return null; }
    if (!col) { problems.push(`${where}: ${ref} is not in the model`); return null; }
    const key = `${t.name}[${col.name}]`;
    if (seen.has(key)) { problems.push(`${where}: ${key} is given twice: give one filter with all its values`); return null; }
    seen.add(key);
    const type = String(col.dataType || 'unknown').toLowerCase(), known = Object.hasOwn(KINDS, type) ? KINDS[type] : undefined;   // (AUD-036: never an inherited name such as constructor)
    if (/^date/.test(type)) { problems.push(`${where}: ${key} is a date column, and a page filter on a date is not supported yet (filter a year, month or flag column instead)`); return null; }
    if (!known && type !== 'unknown') { problems.push(`${where}: ${key} has the type ${type}, and a page filter takes a true/false, text, whole number or decimal number column`); return null; }
    const values = [];   // (0.2.9, audit 6's A6-14: typed; the report writer writes the literals, Pbip.pageFilterOf)
    for (const v of f.values) {
      // the kind of this value: the column's, or (no type in the files) the value's own
      const kind = known || (typeof v === 'boolean' ? 'boolean' : typeof v === 'number' ? (Number.isInteger(v) ? 'whole' : 'decimal') : 'text');
      if (kind === 'boolean') {
        const b = typeof v === 'boolean' ? v : /^true$/i.test(String(v).trim()) ? true : /^false$/i.test(String(v).trim()) ? false : null;
        if (b == null) { problems.push(`${where}: ${key} is a true/false column: the value ${JSON.stringify(v)} must be true or false`); return null; }
        values.push(b);
      } else if (kind === 'text') {
        if (typeof v !== 'string') { problems.push(`${where}: ${key} is a text column: the value ${JSON.stringify(v)} must be a text`); return null; }
        values.push(v);
      } else {
        const n = typeof v === 'number' ? v : typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim()) ? Number(v) : NaN;
        if (!Number.isFinite(n) || /e/i.test(String(n))) { problems.push(`${where}: ${key} is a number column: the value ${JSON.stringify(v)} must be a plain number`); return null; }
        if (kind === 'whole' && !Number.isSafeInteger(n)) { problems.push(`${where}: ${key} is a whole number column: the value ${JSON.stringify(v)} must be a whole number`); return null; }
        values.push(n);
      }
    }
    return Object.assign({ t: t.name, c: col.name, key, type, values }, known ? {} : { typedBy: 'the values given: the model\'s files give this column no type' });
  });
  if (problems.length) throw new Error(`Nothing was written. ${problems.length} of the page filters can't be used: ${problems.join('; ')}. A page filter takes a column of the model, written exactly as read_model lists it (Table[Column]), and values of the column's type.`);
  return out;
}

// ---------- SVG columns (create_report's svgColumns; experimental) ----------
// [{ label, design, page? }]: a design in the SVG KPI Designer's own format (values + layers; no raw SVG, no script),
// compiled by the shared compiler to a DAX expression that returns a data:image/svg+xml text. Every measure and column
// the design names is looked up in the model and written back as a DAX name (model names are untrusted text). The
// length is capped until Desktop measures the real limit (D-P2). Every problem is told at once.
// The cap is a size and speed limit, not a Power BI limit: Desktop drew pictures of 2,000,000 characters in a table
// (third sitting of 2026-10-04), slowly above 64,000.
export const SVG_CAP = 32000, SVG_STATUS = 'experimental: checked in Power BI Desktop in a table, a matrix and the new card\'s image; the image visual, phone and PDF are not checked';
// opt: { mirror: the report is right to left (a design is mirrored unless it says mirror: false), what: 'svgColumns' | 'svgCards', taken: labels used already }
export function resolveSvgColumns(tables, list, opt) {
  if (!list || !list.length) return null;
  const WHAT = (opt && opt.what) || 'svgColumns';
  const problems = [], labels = (opt && opt.taken) || new Set();
  const find = (ref, kind) => {
    const text = String(ref == null ? '' : ref).trim(), mk = text.match(/^'?(.+?)'?\[(.+)\]$/);
    const pick = (l, n) => l.find((x) => x.name === n) || l.find((x) => x.name.toLowerCase() === n.toLowerCase());
    if (mk) { const t = pick(tables, mk[1]), o = t && pick(kind === 'm' ? t.measures : t.columns, mk[2]); return o ? { t, o } : null; }
    if (kind !== 'm' || !text) return null;
    for (const t of tables) { const o = t.measures.find((x) => x.name === text); if (o) return { t, o }; }
    for (const t of tables) { const o = pick(t.measures, text); if (o) return { t, o }; }
    return null;
  };
  const daxColumn = (t, c) => "'" + t.replace(/'/g, "''") + "'[" + c.replace(/\]/g, ']]') + ']';
  const out = list.map((sc, i) => {
    const where = `${WHAT}[${i}]`, label = String(sc.label).trim(), before = problems.length;
    if (!label || /[\[\]]|\p{Cc}|\p{Cf}/u.test(label)) problems.push(`${where}: the label ${JSON.stringify(sc.label)} can't be used (a label has no brackets and no hidden characters)`);
    else if (tables.some((t) => t.measures.some((x) => x.name.toLowerCase() === label.toLowerCase()))) problems.push(`${where}: "${label}" is a measure of the model; give the SVG column another label`);
    else if (labels.has(label.toLowerCase())) problems.push(`${where}: the label "${label}" is given twice`);
    labels.add(label.toLowerCase());
    let d;
    try { d = JSON.parse(JSON.stringify(sc.design)); } catch (e) { d = null; }
    if (!d || typeof d !== 'object' || Array.isArray(d) || JSON.stringify(d).length > 40000 || !Array.isArray(d.layers) || d.layers.length > 60 || (d.values != null && (!Array.isArray(d.values) || d.values.length > 20))) {
      problems.push(`${where} ("${label}"): the design must be an object with layers (60 at most) and values (20 at most), as the SVG KPI Designer writes it`); return null; }
    let entity = null;
    const textColumns = new Map();   // value id -> the text column it holds (or is worked out from)
    d.values = (d.values || []).map((v) => {
      if (!v || typeof v !== 'object') return v;
      if (v.kind === 'measure') { const f = find(v.measure, 'm'); if (!f) { problems.push(`${where} ("${label}"): ${v.measure} is not in the model (a measure is needed)`); return v; } entity = entity || f.t.name;
        // (round 14: a percent by the card rule or the shared format rule is marked, so a text bound to it shows a percent)
        const right = Fix.formatOf(Object.assign({}, f.o, { expression: Bind.exprOf(f.o) }), 'measure', []);
        return Object.assign({}, v, { measure: f.o.name, percent: !!(Bind.measureCard(f.o).pct || (right && /%/.test(right.format))) }, f.o.formatString ? { format: String(f.o.formatString) } : {}); }
      if (v.kind === 'column') { const f = find(v.column, 'c'); if (!f) { problems.push(`${where} ("${label}"): ${v.column} is not in the model (a column is needed, written as Table[Column])`); return v; }
        if (/^(string|boolean|date)/i.test(String(f.o.dataType || ''))) textColumns.set(v.id, `${f.t.name}[${f.o.name}]`);
        return Object.assign({}, v, { column: daxColumn(f.t.name, f.o.name) }); }
      if (textColumns.has(v.a) || textColumns.has(v.b)) textColumns.set(v.id, textColumns.get(v.a) || textColumns.get(v.b));
      return v;
    });
    // a size, a position, a colour rule or "show if" needs a number: a text column there would be an error in Power BI
    d.layers.forEach((l) => Object.entries((l && l.bind) || {}).forEach(([prop, b]) => { if (prop === 'text' || !b) return;
      [b.v].concat((b.rules || []).map((r) => r.v)).filter((id) => textColumns.has(id)).forEach((id) => problems.push(`${where} ("${label}"): ${textColumns.get(id)} is not a number column; a size, a position or a colour rule needs a number (a number column or a measure). A text column can only be shown as a text (bind.text with fmt "text")`)); }));
    // the report's theme in the design (round 13): "theme:<name>" colours, and the theme's colours where a layer names none
    if (opt && opt.palette) { const t = Svg.themed(d, opt.palette); if (t.errors.length) { problems.push(`${where} ("${label}"): ${[...new Set(t.errors)].slice(0, 3).join('; ')}`); return null; } d = t.design; }
    // round 15 (the owner's go on round 14's recommendation 3): on a KPI card the card shows the value, so a ring there
    // has no number inside it (a text bound to a value whose place is inside a ring is left out); a table picture keeps it
    // (audit 6, A6-11: the compiler makes that variant: toMeasure(d, { context: 'card' }) below)
    if (opt && opt.mirror && d.mirror !== false) d.mirror = true;
    if (d.layers.some((l) => l && l.type === 'spark')) { const f = find(d.dateCol, 'c'); if (!f) problems.push(`${where} ("${label}"): a sparkline needs dateCol, a date column of the model written as Table[Column]`); else d.dateCol = daxColumn(f.t.name, f.o.name); }
    else delete d.dateCol;
    d.name = label;
    if (problems.length > before) return null;
    let c;
    try { c = Svg.toMeasure(d, { context: WHAT === 'svgCards' ? 'card' : 'table' }); if (c.ringNumberDropped && opt.ringNumbers) opt.ringNumbers.push(label); } catch (e) { c = { dax: '', errors: ['the design can\'t be compiled: ' + String(e && e.message || e).slice(0, 120)] }; }
    if (c.errors.length) { problems.push(`${where} ("${label}"): ${[...new Set(c.errors)].slice(0, 5).join('; ')}`); return null; }
    if (c.dax.length > SVG_CAP) { problems.push(`${where} ("${label}"): the measure is ${c.dax.length.toLocaleString('en-US')} characters; the limit is ${SVG_CAP.toLocaleString('en-US')}, to keep the report's size and its speed (Power BI draws longer pictures, slowly): use fewer or shorter layers`); return null; }
    if (!/RETURN\n\s+(IF \( ISBLANK \( \w+ \), BLANK \(\), )?"data:image\/svg\+xml;utf8," & _svg( \))?$/.test(c.dax)) { problems.push(`${where} ("${label}"): the compiled measure does not end in a data:image/svg+xml text`); return null; }
    // round 18 (the owner's answer, 6 Oct ~20:51 Dubai: "yes drop the number under 40"): a ring as a table picture
    // drawn under 40 high has no number inside (its number could not be read at 28); the writer picks this version
    // where the picture comes out that small, and the table's own value column carries the number
    // (audit 6, A6-11: the compiler's own variant, toMeasure's noNumber in the 'table' context)
    const small = WHAT === 'svgColumns' && c.noNumber ? c.noNumber : null;
    const withMeasures = tables.find((t) => t.measures.length) || tables[0];
    return { label, t: entity || (withMeasures && withMeasures.name), expression: c.dax, ...(small ? { expressionNoNumber: small } : {}), page: sc.page != null ? sc.page : null, card: sc.card != null ? sc.card : null,
      w: Math.max(8, Math.min(2000, +d.w || 240)), h: Math.max(8, Math.min(2000, +d.h || 80)) };
  });
  if (problems.length) throw new Error(`Nothing was written. ${problems.length} of the SVG ${WHAT === 'svgCards' ? 'cards' : 'columns'} can't be used: ${problems.join('; ')}. An SVG column takes a design in the SVG KPI Designer's format (values and layers), with measures and columns named exactly as read_model lists them.`);
  return out;
}

// What each visual of the written pages shows, by name: the answer's boundFields
const VISUAL_NAMES = { kpi: 'KPI card', card: 'Card', line: 'Line chart', bar: 'Bar chart', column: 'Column chart', donut: 'Donut chart', table: 'Table', gauge: 'Gauge', funnel: 'Funnel', treemap: 'Treemap', map: 'Map', slicer: 'Slicer' };
// (0.2.9, audit 6's A6-12: what the report writer says it wrote, Pbip.build's bound, not worked out again here)
export function boundOf(bound) {
  return (bound || []).map((p) => ({ page: p.page, visuals: p.visuals.map((v) => ({ visual: VISUAL_NAMES[v.kind] || v.kind, fields: v.fields })) }));
}
// (0.3.1 LR1) the slicers the written pages hold, each field once in the order written (the plan names them all)
export function slicersOf(bound) {
  return [...new Set([].concat(...(bound || []).map((p) => p.visuals.filter((v) => v.kind === 'slicer').map((v) => v.fields[0]))).filter(Boolean))];
}
// (0.3.0 J19, B-172) sharedAxes: the person's answers as the confirmation memory's records (axis-units.js), on the
// model's own measures; problems: each name that is not a measure of the model (the call is refused)
const refParts = (x) => { const r = /^(.+?)\[(.+)\]$/.exec(String(x || '').trim()); return r ? { t: r[1].replace(/^'|'$/g, ''), m: r[2] } : null; };
export function axesProblems(m, list) {
  const raw = modelOf(m.tmsl).tables || [], has = (r) => !!r && raw.some((t) => t.name === r.t && (t.measures || []).some((x) => x.name === r.m));
  return (list || []).flatMap((e) => e.measures.filter((x) => !has(refParts(x))).map((x) => `sharedAxes names "${String(x).slice(0, 120)}", which is not a measure of the model (Table[Measure] as read_model lists it).`));
}
export function axesOf(m, list) {
  const raw = modelOf(m.tmsl).tables || [];
  return { tables: raw, confirmed: (list || []).map((e) => { const [x, y] = e.measures.map(refParts); return x && y ? Axes.record(x, y, e.answer, raw) : null; }).filter(Boolean) };
}
