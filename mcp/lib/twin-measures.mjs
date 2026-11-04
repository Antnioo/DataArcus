// The Arabic twin, step 5c: the measure rewiring (0.3.2 SP40: moved out of twin-pages.mjs as it was, behaviour
// identical). The twin's own copy of the report's measures (reportExtensions.json: the original's file is only read):
// its Arabic title measures ("Title AR: ..."), its text measures (the empty state's "No data AR: ..." in one report with
// both languages, else rewritten), the waterfall's and the tables' row label measures (each name free across the model
// and the report, the same DAX in the same table one measure), every visual of the Arabic pages moved to them, and what
// the plan says of them.
// The interface (D-1103-11): twinMeasures(P, labels) is called once per twin, before its pages; P is the twin's input
// (P.R the report as read, P.model, P.same: both languages in one report), labels the approved texts by id. It returns M,
// whose state (the twin's measures written so far) is its own, held by the caller (no module state):
//   M.applied    how many approved texts the measures took (the text measures; the titles' are counted by rewire)
//   M.waterfall  the mirror's waterfall options (opts.waterfall: the model's facts, the theme, extMeasure)
//   M.rewire(vj, at, rtl) -> { applied, table }: one twin visual of page `at`, changed in place: moved to the text
//                measures' Arabic copies, its table given its row label measure (rtl only; table: what the plan says
//                of it, or null) and that column's style, its title moved to its Arabic title measure
//   M.said(pages) -> { ext, notShown, titleMeasures, waterfallMeasures, textMeasures }: after every page (pages: the
//                twin's built pages), the twin's reportExtensions.json (or null) and what is said of the measures
// rewireMeasures(vj, rename) and rowLabelTable(vj, isText, extMeasure) are the visual-level parts, exported for that use.
// No IO; it imports only the engines and twin-read's, twin-visuals' and twin-texts' pure helpers. Made-up names only.
import { safeName } from './read-report.mjs';
import { isObj } from './twin-read.mjs';
import { typeOf, Ls } from './twin-visuals.mjs';
import { arabicDax, titleMeasuresOf, textMeasuresOf } from './twin-texts.mjs';
import { waterfallFacts } from './twin-model.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Mirror = require('../../assets/js/report-mirror.js');
const Q = require('../../assets/js/pbip-query.js');

const EXT_SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/reportExtension/1.0.0/schema.json';

// (0.3.0 X1) a visual of the Arabic pages moved to the Arabic copy of a report measure (rename: "Entity\0name" -> the
// copy's name): the field, its queryRef and every selector naming it, and its nativeQueryRef, as Power BI names a
// measure's projection ("Entity.Name", "Name")
export function rewireMeasures(vj, rename) {
  const refs = new Map();
  rename.forEach((to, k) => { const [entity, from] = k.split('\u0000'); refs.set(entity + '.' + from, { ref: entity + '.' + to, from, to }); });
  const walk = (o) => {
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (!isObj(o)) return;
    const ms = isObj(o.Measure) ? o.Measure : null, src = ms && isObj(ms.Expression) && isObj(ms.Expression.SourceRef) ? ms.Expression.SourceRef : null;
    if (src && src.Schema === 'extension' && rename.has(src.Entity + '\u0000' + ms.Property)) ms.Property = rename.get(src.Entity + '\u0000' + ms.Property);
    const r = typeof o.queryRef === 'string' ? refs.get(o.queryRef) : null;
    if (r && o.nativeQueryRef === r.from) o.nativeQueryRef = r.to;
    Object.keys(o).forEach((k) => { if (typeof o[k] === 'string' && refs.has(o[k])) o[k] = refs.get(o[k]).ref; else walk(o[k]); });
  };
  walk(vj);
}

// (0.3.1 TW1, M1-S2: the twin's mirrored table had no "Total": Power BI writes it only in the first projection's column,
// and only when that is a column of text (measured, round 10), and the reversed columns put a number first) A table whose
// original starts with a column of text and shows a number takes the writer's right-to-left table (pbip-query.js
// rowLabelOf, round 23, proven in Desktop 2.158 on 8 Oct): that column first at width 0 (hidden; it keeps the rows, their
// order and what a click filters), the numbers as mirrored, and at the right the report measure "Row label: <Column>"
// (rowLabelDax: the row's name, «الإجمالي» on the total row) under the column's header, with the column's width. A name
// with a control character, or a number Power BI sums in a way DAX can't name, keeps the table as mirrored (AUD-032).
// isText(t, c): the model's type allows text; extMeasure(t, want, expression): the measure's free name. Returns
// "Table[Row label: ...]" or null
const fieldOk = (f) => isObj(f) && isObj(f.Expression) && isObj(f.Expression.SourceRef) && !f.Expression.SourceRef.Schema && typeof f.Expression.SourceRef.Entity === 'string' && typeof f.Property === 'string';
export function rowLabelTable(vj, isText, extMeasure) {
  const qs = typeOf(vj) === 'tableEx' && isObj(vj.visual.query) && isObj(vj.visual.query.queryState) ? vj.visual.query.queryState : null, ps = qs && isObj(qs.Values) && Array.isArray(qs.Values.projections) ? qs.Values.projections : null;
  if (!ps || ps.length < 2 || !ps.every((p) => isObj(p) && isObj(p.field) && typeof p.queryRef === 'string')) return null;
  const last = ps[ps.length - 1], col = last.field.Column;
  if (!fieldOk(col) || !isText(col.Expression.SourceRef.Entity, col.Property)) return null;
  const f = { t: col.Expression.SourceRef.Entity, c: col.Property }, rest = ps.slice(0, -1);
  const vals = rest.filter((p) => (isObj(p.field.Measure) && !(isObj(p.field.Measure.Expression) && isObj(p.field.Measure.Expression.SourceRef) && p.field.Measure.Expression.SourceRef.Schema)) || (isObj(p.field.Aggregation) && p.displayName !== ' '));
  const okVal = (p) => (p.field.Measure ? fieldOk(p.field.Measure) : isObj(p.field.Aggregation.Expression) && fieldOk(p.field.Aggregation.Expression.Column) && Q.AGG_DAX[p.field.Aggregation.Function] != null);
  const names = (p) => (p.field.Measure ? [p.field.Measure.Expression.SourceRef.Entity, p.field.Measure.Property] : [p.field.Aggregation.Expression.Column.Expression.SourceRef.Entity, p.field.Aggregation.Expression.Column.Property]);
  if (!vals.length || !vals.every(okVal) || [f.t, f.c].concat(...vals.map(names)).some((n) => Q.hasControl(n))) return null;
  const name = extMeasure(f.t, Q.ROW_LABEL + Q.shown(f.c), Q.rowLabelDax(f, 'الإجمالي', vals)), ref = f.t + '.' + name;
  qs.Values.projections = [last].concat(rest, [{ field: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: f.t } }, Property: name } }, queryRef: ref, nativeQueryRef: name, displayName: last.displayName != null ? last.displayName : (last.nativeQueryRef || f.c) }]);
  const o = vj.visual.objects = isObj(vj.visual.objects) ? vj.visual.objects : {}, cw = o.columnWidth = Array.isArray(o.columnWidth) ? o.columnWidth : [];
  const w = cw.find((e) => isObj(e) && isObj(e.selector) && e.selector.metadata === last.queryRef && isObj(e.properties));
  if (w) cw.push({ properties: { value: w.properties.value }, selector: { metadata: ref } });
  if (w) w.properties.value = { expr: { Literal: { Value: '0D' } } }; else cw.push({ properties: { value: { expr: { Literal: { Value: '0D' } } } }, selector: { metadata: last.queryRef } });
  const cf = o.columnFormatting = Array.isArray(o.columnFormatting) ? o.columnFormatting : [];
  cf.push({ properties: { alignment: Ls('Right'), styleHeader: { expr: { Literal: { Value: 'true' } } }, styleValues: { expr: { Literal: { Value: 'true' } } }, styleTotal: { expr: { Literal: { Value: 'true' } } } }, selector: { metadata: ref } });
  return f.t + '[' + name + ']';
}

export function twinMeasures(P, labels) {
  const { R } = P;
  // (D1) a waterfall's measures go into the twin's own reportExtensions.json (the original's copied, or a new one), each
  // name free of the model's and the report's; the same DAX in the same table is one measure
  const wfWritten = [];
  const waterfall = Object.assign(waterfallFacts(P.model), { theme: R.theme, extMeasure: (t, want, expression, dataType, formatString) => {
    if (!ext) ext = { $schema: EXT_SCHEMA, name: 'extension', entities: [] };
    let e = ext.entities.find((x) => isObj(x) && x.name === t); if (!e) ext.entities.push(e = { name: t, measures: [] }); if (!Array.isArray(e.measures)) e.measures = [];
    const had = wfWritten.find((x) => x.t === t && x.expression === expression); if (had) return had.m;
    const names = takenAnywhere(); let m = want; for (let k = 2; names.has(m.toLowerCase()); k++) m = want + ' (' + k + ')';
    e.measures.push(Object.assign({ name: m, dataType, expression }, formatString ? { formatString } : {})); wfWritten.push({ t, m, expression }); return m; } });
  let applied = 0;
  // the title measures: the twin's own Arabic ones, named "Title AR: ...", beside the original's (which stay as they are)
  const tms = titleMeasuresOf(R), rename = new Map(), written = [];
  let ext = R.ext ? JSON.parse(JSON.stringify(R.ext)) : null;
  // (D1: a measure's name is unique across the whole model, report measures included, without case (writer P3): the
  // waterfall's names are checked against every table's and every report measure's)
  const takenAnywhere = () => new Set([].concat(...((ext && ext.entities) || []).map((e) => (isObj(e) && Array.isArray(e.measures) ? e.measures.map((x) => (isObj(x) ? x.name : '')) : [])),
    ...((P.model && P.model.tables) || []).map((t) => (t.columns || []).map((c) => c.name).concat((t.measures || []).map((c) => c.name)))).map((n) => String(n).toLowerCase()));
  const taken = (entity) => { const e = ext.entities.find((x) => isObj(x) && x.name === entity), t = P.model && (P.model.tables || []).find((x) => x.name === entity);
    return new Set([].concat((e && Array.isArray(e.measures) ? e.measures : []).map((x) => isObj(x) ? x.name : ''), t ? (t.columns || []).map((c) => c.name).concat((t.measures || []).map((c) => c.name)) : []).map((n) => String(n).toLowerCase())); };
  tms.filter((x) => x.pd.branches && ext).forEach((x) => {
    const ls = x.pd.branches.map((b) => (labels['titleText:' + b.template] != null ? labels['titleText:' + b.template] : null));
    if (ls.every((l) => l == null)) return;
    const e = ext.entities.find((y) => isObj(y) && y.name === x.entity), base = /^Title: /.test(x.name) ? 'Title AR: ' + x.name.slice(7) : 'Title AR: ' + x.name, names = taken(x.entity);
    let name = base; for (let k = 2; names.has(name.toLowerCase()); k++) name = base + ' (' + k + ')';
    e.measures.push(Object.assign(JSON.parse(JSON.stringify(x.measure)), { name, expression: arabicDax(x.pd, ls) }));
    rename.set(x.entity + '\u0000' + x.name, name); written.push(safeName(x.entity + '[' + name + ']'));
  });
  // (0.3.0 D3) the report's other text measures a visual shows (the empty state): rewritten in the twin's own copy of
  // reportExtensions.json (the original's file is only read), each text as approved
  let rewritten = 0;
  // (0.3.0 X1) both languages in one report: the English pages keep the measure as it is, the Arabic pages get their own
  // ("No data AR: ..."), each name free as the waterfall's are, and their visuals are moved to it (textRename)
  const textRename = new Map();
  if (ext) textMeasuresOf(R).filter((x) => x.pd.branches).forEach((x) => {
    const ls = x.pd.branches.map((b) => (b.template && labels['measureText:' + b.template] != null ? labels['measureText:' + b.template] : null));
    if (ls.every((l) => l == null)) return;
    const e = ext.entities.find((y) => isObj(y) && y.name === x.entity), m = e && Array.isArray(e.measures) ? e.measures.find((y) => isObj(y) && y.name === x.name) : null;
    if (!m) return;
    if (P.same) {
      const base = /^No data: /.test(x.name) ? 'No data AR: ' + x.name.slice(9) : x.name + ' AR', names = takenAnywhere();
      let name = base; for (let k = 2; names.has(name.toLowerCase()); k++) name = base + ' (' + k + ')';
      e.measures.push(Object.assign(JSON.parse(JSON.stringify(m)), { name, expression: arabicDax(x.pd, ls) }));
      textRename.set(x.entity + '\u0000' + x.name, name);
    } else m.expression = arabicDax(x.pd, ls);
    rewritten++; applied++;
  });
  // (TW1, M1-S2) the tables' row labels: each in the twin's reportExtensions.json, named free as the waterfall's are; the
  // same DAX in the same table is one measure
  const rlWritten = [];
  const typeIn = (t, c) => { const tb = P.model && (P.model.tables || []).find((x) => x.name === t), cl = tb && (tb.columns || []).find((x) => x.name === c); return cl ? String(cl.dataType || '') : ''; };
  const isText = (t, c) => /^(|string|text|unknown)$/i.test(typeIn(t, c));
  const rowLabelMeasure = (t, want, expression) => {
    if (!ext) ext = { $schema: EXT_SCHEMA, name: 'extension', entities: [] };
    let e = ext.entities.find((x) => isObj(x) && x.name === t); if (!e) ext.entities.push(e = { name: t, measures: [] }); if (!Array.isArray(e.measures)) e.measures = [];
    const had = rlWritten.find((x) => x.t === t && x.expression === expression); if (had) return had.m;
    const names = takenAnywhere(); let m = want; for (let k = 2; names.has(m.toLowerCase()); k++) m = want + ' (' + k + ')';
    e.measures.push({ name: m, dataType: 'Text', expression }); rlWritten.push({ t, m, expression }); return m; };
  // one twin visual of the Arabic pages: its text measures, its table's row label, its title's measure
  const rewire = (vj, at, rtl) => {
    let took = 0, table = null;
    if (textRename.size) rewireMeasures(vj, textRename);
    if (rtl) { const rl = rowLabelTable(vj, isText, rowLabelMeasure); if (rl) table = { page: safeName(at), visual: safeName(String(vj.name)), measure: safeName(rl) }; }
    if (rtl) Mirror.rowLabelStyle(vj);   // (0.3.1 MX1) the row label column keeps its text column's colours
    const t = isObj(vj) && isObj(vj.visual) && isObj(vj.visual.visualContainerObjects) && Array.isArray(vj.visual.visualContainerObjects.title) ? vj.visual.visualContainerObjects.title : [];
    t.forEach((e) => { const ms = isObj(e) && isObj(e.properties) && isObj(e.properties.text) && isObj(e.properties.text.expr) && isObj(e.properties.text.expr.Measure) ? e.properties.text.expr.Measure : null, src = ms && isObj(ms.Expression) && isObj(ms.Expression.SourceRef) ? ms.Expression.SourceRef : null;
      if (src && src.Schema === 'extension' && rename.has(src.Entity + '\u0000' + ms.Property)) { ms.Property = rename.get(src.Entity + '\u0000' + ms.Property); took++; } });
    return { applied: took, table };
  };
  // after every page: what is said of the measures
  const said = (pages) => {
    // (0.3.1 TB1c, the laptop's part 5: the write said "translated: 0 ... stays as the model gives it" of two measure
    // titles written as approved fixed Arabic) a title measure no title of the twin's pages still shows was replaced by
    // approved fixed Arabic titles: fixed, not "not translated"
    const shownTitle = new Set(); pages.forEach((x) => x.visuals.forEach((vj) => { const t = isObj(vj) && isObj(vj.visual) && isObj(vj.visual.visualContainerObjects) && Array.isArray(vj.visual.visualContainerObjects.title) ? vj.visual.visualContainerObjects.title : [];
      t.forEach((e) => { const ms = isObj(e) && isObj(e.properties) && isObj(e.properties.text) && isObj(e.properties.text.expr) && isObj(e.properties.text.expr.Measure) ? e.properties.text.expr.Measure : null, src = ms && isObj(ms.Expression) && isObj(ms.Expression.SourceRef) ? ms.Expression.SourceRef : null;
        if (src) shownTitle.add((src.Schema === 'extension' ? 'ext' : 'model') + '\u0000' + src.Entity + '\u0000' + ms.Property); }); }));
    const stillShown = (x) => shownTitle.has((x.own ? 'ext' : 'model') + '\u0000' + x.entity + '\u0000' + x.name);
    const notTranslated = tms.filter((x) => !x.pd.branches && stillShown(x)).map((x) => ({ what: 'Chart title (from a title measure)', measure: safeName(x.entity + '[' + x.name + ']'), why: x.pd.why }));
    const fixedTitles = tms.filter((x) => !x.pd.branches && !stillShown(x)).map((x) => ({ measure: safeName(x.entity + '[' + x.name + ']'), why: 'every title it gave is written as its approved fixed Arabic title (it no longer changes with the selection)' }));
    // (0.3.0 D3) the original's own title measures the twin's charts no longer use: left in the twin's file as they are
    // (X1: in one report the English pages still show them)
    const notShown = P.same ? [] : [...rename.keys()].map((k) => { const [entity, name] = k.split('\u0000'); return { measure: safeName(entity + '[' + name + ']'), now: safeName(entity + '[' + rename.get(k) + ']'), why: 'the original\'s title measure: the twin\'s charts use their own Arabic one instead; left in the twin\'s reportExtensions.json as it is, and no visual of the twin shows it' }; });
    return { ext: written.length || rewritten || wfWritten.length || rlWritten.length ? ext : null, notShown, titleMeasures: tms.length ? Object.assign({ measures: tms.length, translated: written.length, written, notTranslated }, fixedTitles.length ? { fixed: fixedTitles } : {}) : null, waterfallMeasures: wfWritten.map((x) => safeName(x.t + '[' + x.m + ']')), textMeasures: [...textRename].map(([k, to]) => ({ measure: safeName(k.split('\u0000')[0] + '[' + k.split('\u0000')[1] + ']'), arabic: safeName(k.split('\u0000')[0] + '[' + to + ']') })) };
  };
  return { applied, waterfall, rewire, said };
}
