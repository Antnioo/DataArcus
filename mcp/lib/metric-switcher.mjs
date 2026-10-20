// L3 (the owner, 19 Oct: "implement ideas we had from the labs"): the metric switcher. A field parameter and one
// single-select slicer switch the charts of a page of their own between 2-5 of the model's measures, each keeping its own
// format (a SWITCH measure cannot). Proven in the lab of 10 Oct (Desktop 2.158.1304.0, a made-up report): the TMDL table
// below (three columns, a calculated partition of NAMEOF rows), the charts' Y role holding the first measure with
// fieldParameters, the slicer with singleSelect, the titles bound to a title measure that reads the order column.
// The model is never changed by DataArcus: the table comes as a TMDL script in a new file next to the project (as
// add_gulf_calendar's), written with the report in the same write; the user applies it in TMDL view. Model names are
// untrusted input: they are quoted (Fix.name for TMDL, the writer's daxNames for DAX), compared, never followed.
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { takenNames, nameKey, tagOf, scriptFileOf } from './model-script.mjs';   // (the one helper for model additions as scripts, shared with L4's flip cards)

const require = createRequire(import.meta.url);
const Q = require('../../assets/js/pbip-query.js'), Fix = require('../../assets/js/model-health-tmdl.js'), Tmdl = require('../../assets/js/tmdl-model.js');
const { SCHEMA, json, q, proj, obj, str, bool, num, mirrorChart, sorted, daxNames, hasControl, shown, lineStyle, timeAxisPlan, label } = Q;

export const SWITCH_MIN = 2, SWITCH_MAX = 5;
export const PAGE_NAME = { en: 'Metric', ar: 'المؤشر' };
export const FALLBACK = { en: 'Choose one metric', ar: 'اختر مؤشراً واحداً' };
const HEADER = { en: 'Metric', ar: 'المؤشر' }, BY = { en: (x) => 'by ' + x, ar: (x) => 'حسب ' + x };
const KIND_WORD = { en: { bar: 'Bar chart', line: 'Line chart' }, ar: { bar: 'مخطط شريطي', line: 'مخطط خطي' } };
// what the plan, the approval page and the answer say before the script is applied (the brief: a note, never "can break")
export const BEFORE_APPLIED = 'Until the script is applied, only the Metric page shows Power BI\'s error on its slicer and charts (the field parameter is not in the model yet); every other page works either way.';
export const MODEL_CHANGE = (t) => `A new table ${JSON.stringify(t)} (a field parameter: three columns and a title measure), as a TMDL script next to the project. DataArcus never changes the model: the user applies the script in TMDL view.`;
export const SCRIPT_SUFFIX = ' - metric switcher';

const keyOf = (s) => { const mk = String(s).trim().match(/^'?(.+?)'?\[(.+)\]$/); return mk ? { t: mk[1], m: mk[2] } : null; };

/** The measures asked for, checked against the model's own (tables: the reader's). { measures: [{ t, m }], problems } */
export function resolveSwitch(tables, list) {
  const problems = [], out = [];
  if (!Array.isArray(list)) return { measures: out, problems };
  if (list.length < SWITCH_MIN || list.length > SWITCH_MAX) problems.push(`metricSwitcher takes ${SWITCH_MIN} to ${SWITCH_MAX} measures; the plan names ${list.length}.`);
  list.forEach((x, i) => {
    const k = keyOf(x), t = k && (tables || []).find((y) => y.name === k.t);
    const shownAs = JSON.stringify(shown(String(x)).slice(0, 160));
    if (!k) { problems.push(`metricSwitcher[${i}] ${shownAs} is not written as Table[Measure].`); return; }
    if (!t || !(t.measures || []).some((y) => y.name === k.m)) { problems.push(`metricSwitcher[${i}] ${shownAs} is not a measure of the model${t && (t.columns || []).some((y) => y.name === k.m) ? ' (it is a column: a field parameter here switches measures only)' : ''}.`); return; }
    if (hasControl(k.t) || hasControl(k.m)) { problems.push(`metricSwitcher[${i}]: the name holds a control character (a tab or a line break) that no DAX may name; rename it in the model first.`); return; }
    if (out.some((y) => y.t === k.t && y.m === k.m)) { problems.push(`metricSwitcher names ${shownAs} twice.`); return; }
    out.push({ t: k.t, m: k.m });
  });
  return { measures: out, problems };
}

/** The table's free names: "Metric", else "Metric 2"... with its columns and its title measure. raw: the model's tables. */
export function switchNames(raw) {
  const taken = takenNames(raw || []);
  for (let n = 1; n < 100; n++) {
    const table = 'Metric' + (n > 1 ? ' ' + n : ''), names = { table, display: table, fields: table + ' Fields', order: table + ' Order', title: table + ' Title' };
    if (![names.table, names.fields, names.order, names.title].some((x) => taken.has(nameKey(x)))) return names;
  }
  throw new Error('Nothing was written: no free name for the metric switcher\'s table (Metric to Metric 99 are all taken).');
}

// a lineage tag per object, the same for the same plan (the exact artifact is built once; a rebuild gives the same bytes):
// model-script.mjs's tagOf
const nameofOf = (x) => 'NAMEOF(' + daxNames.column(x.t, x.m) + ')';

/** The title measure's DAX: the order column, never the display column alone (the lab's composite-key error). */
export function titleDax(names, items, fallback) {
  const O = daxNames.column(names.table, names.order);
  return `IF ( HASONEVALUE ( ${O} ), SWITCH ( SELECTEDVALUE ( ${O} ), ${items.map((x, i) => `${i}, ${daxNames.string(x.label)}`).join(', ')} ), ${daxNames.string(fallback)} )`;
}

/** The table as Power BI Desktop saves a field parameter (one TMDL table), and the script that adds it. */
export function switchTable(names, items, fallback, seed) {
  const N = Fix.name, T = (n) => tagOf(seed, n);
  const lines = [`table ${N(names.table)}`, `\tlineageTag: ${T('table')}`, '',
    `\tmeasure ${N(names.title)} = ${titleDax(names, items, fallback)}`, `\t\tlineageTag: ${T('title')}`, '',
    `\tcolumn ${N(names.display)}`, `\t\tlineageTag: ${T('display')}`, '\t\tsummarizeBy: none', '\t\tsourceColumn: [Value1]', `\t\tsortByColumn: ${N(names.order)}`, '',
    '\t\trelatedColumnDetails', `\t\t\tgroupByColumn: ${N(names.fields)}`, '', '\t\tannotation SummarizationSetBy = Automatic', '',
    `\tcolumn ${N(names.fields)}`, '\t\tisHidden', `\t\tlineageTag: ${T('fields')}`, '\t\tsummarizeBy: none', '\t\tsourceColumn: [Value2]', `\t\tsortByColumn: ${N(names.order)}`, '',
    '\t\textendedProperty ParameterMetadata =', '\t\t\t\t{', '\t\t\t\t  "version": 3,', '\t\t\t\t  "kind": 2', '\t\t\t\t}', '', '\t\tannotation SummarizationSetBy = Automatic', '',
    `\tcolumn ${N(names.order)}`, '\t\tisHidden', '\t\tformatString: 0', `\t\tlineageTag: ${T('order')}`, '\t\tsummarizeBy: sum', '\t\tsourceColumn: [Value3]', '', '\t\tannotation SummarizationSetBy = Automatic', '',
    `\tpartition ${N(names.table)} = calculated`, '\t\tmode: import', '\t\tsource =', '\t\t\t\t{',
    ...items.map((x, i) => `\t\t\t\t    (${daxNames.string(x.label)}, ${nameofOf(x)}, ${i})${i < items.length - 1 ? ',' : ''}`), '\t\t\t\t}', ''];
  const table = lines.join('\n');
  return { table, script: 'createOrReplace\n\n' + table.split('\n').map((l) => (l ? '\t' + l : l)).join('\n') };
}

/** The table the script adds, in the reader's shape (Bind.fromTmsl's input), for the reference check of the page. */
export const scriptModel = (tableText) => Tmdl.fromFiles([{ path: 'definition/tables/metric.tmdl', text: tableText }]);

/**
 * The switch: names, script and the page's files, added to the build r (Pbip.build's result: files, base).
 * o: { raw (the model's tables, for free names), measures [{ t, m }], labels { "T[M]": label }, bind (the writer's bound
 * fields: cats.bar, date), lang, rtl, smooth, page { w, h }, seed }. Returns what the plan and the answer say.
 */
export function addSwitch(r, o) {
  const lang = o.lang === 'ar' ? 'ar' : 'en', names = switchNames(o.raw), fallback = FALLBACK[lang];
  const items = o.measures.map((x) => Object.assign({}, x, { label: String(shown((o.labels || {})[`${x.t}[${x.m}]`] || x.m)).replace(/\p{Cc}/gu, ' ').trim().slice(0, 100) || x.m }));
  const { table, script } = switchTable(names, items, fallback, o.seed || '');
  const W = o.page.w, H = o.page.h, k = H / 1080, m = Math.round(32 * k), gap = Math.round(24 * k);
  const B = o.bind || {}, cat = (B.cats || {}).bar || (B.cats || {}).column || null;
  const tp = B.date ? timeAxisPlan(B.date) : null, date = tp && ['own', 'model', 'number'].includes(tp.order) ? B.date : null;
  const sw = Math.round(W * 0.18), sh = Math.round(Math.min(H - 2 * m, (70 + items.length * 40) * k));
  const x0 = m + sw + gap, aw = W - x0 - m, charts = [cat ? 'bar' : null, date ? 'line' : null].filter(Boolean);
  const cw = charts.length > 1 ? Math.round((aw - gap) / 2) : aw;
  const at = (x, w) => (o.rtl ? W - x - w : x);
  const pageId = crypto.createHash('sha256').update((o.seed || '') + '\0page').digest('hex').slice(0, 20);
  const D = r.base + '.Report/definition', files = [];
  const P = { Measure: { Expression: { SourceRef: { Entity: names.table } }, Property: names.title } };
  const param = { parameterExpr: { Column: { Expression: { SourceRef: { Entity: names.table } }, Property: names.display } }, index: 0, length: 1 };
  const first = items[0];
  const visual = (name, x, y, w, h, z, v) => ({ $schema: SCHEMA.visual, name, position: { x: at(x, w), y, z, height: h, width: w, tabOrder: z }, visual: v });
  const vs = [];
  // the slicer: one metric at a time; its header in the report's language. No saved selection: the schema types a
  // formatting property as anything (no checkable place for general.filter) and no Desktop run has shown its shape for a
  // field parameter, so nothing is written for it ("For the laptop"); with nothing chosen the title asks for one
  vs.push(visual('metricslicer' + pageId.slice(0, 8), m, m, sw, sh, 0, { visualType: 'slicer', query: q({ Values: [proj({ t: names.table, c: names.display, name: HEADER[lang] })] }),
    objects: { data: obj({ mode: str('Basic') }), selection: obj({ singleSelect: bool(true) }) },
    visualContainerObjects: { general: obj({ altText: str(lang === 'ar' ? 'اختيار المؤشر الذي تعرضه المخططات' : 'Choose the metric the charts show') }) } }));
  const chart = (kind, f, x, z) => {
    const type = kind === 'bar' ? 'clusteredBarChart' : 'lineChart';
    const query = q({ Category: [proj(f)], Y: [proj(first)] });
    query.queryState.Y.fieldParameters = [param];
    sorted(query, f, false);
    const v = { visualType: type, query, objects: kind === 'line' ? { lineStyles: obj(lineStyle(o.smooth !== false)) } : {},
      // (0.3.0 A1: in a right-to-left report the title and subtitle are aligned right, where an Arabic reader starts: RTL_MIRROR)
      visualContainerObjects: { title: obj(Object.assign({ show: bool(true), text: { expr: P } }, o.rtl ? { alignment: str('right') } : {})), subTitle: obj(Object.assign({ show: bool(true), text: str(BY[lang](label(f))) }, o.rtl ? { alignment: str('right') } : {})),
        general: obj({ altText: str(`${KIND_WORD[lang][kind]}: ${lang === 'ar' ? 'المؤشر المختار' : 'the chosen metric'} ${BY[lang](label(f))}`) }) } };
    if (o.rtl) mirrorChart(v, kind);
    if (grid) { const va = v.objects.valueAxis || (v.objects.valueAxis = [{ properties: {} }]); Object.assign(va[0].properties, JSON.parse(JSON.stringify(grid))); gridded++; }
    if (!Object.keys(v.objects).length) delete v.objects;
    vs.push(visual('metric' + kind + pageId.slice(0, 8), x, m, cw, H - 2 * m, z, v));
  };
  // the gridlines of the report's own charts (grid: dotted, none, or the quiet grey), on this page's charts too (0.3.0 A1:
  // they kept the theme's solid gridlines), counted in the answer's grid.charts when a grid was asked
  const ownVisuals = r.files.filter((f) => /\/visuals\/[^/]+\/visual\.json$/.test(f.path)).map((f) => JSON.parse(f.data));
  const gv = ownVisuals.map((v) => (((((v.visual || {}).objects || {}).valueAxis || [])[0] || {}).properties || {})).find((p) => p.gridlineShow || p.gridlineStyle || p.gridlineColor);
  const grid = gv ? Object.fromEntries(['gridlineShow', 'gridlineStyle', 'gridlineColor'].filter((k) => gv[k]).map((k) => [k, gv[k]])) : null;
  let gridded = 0;
  let cx = x0, z = 1000;
  charts.forEach((kind) => { chart(kind, kind === 'bar' ? cat : date, cx, z); cx += cw + gap; z += 1000; });
  // the report's page filters (pageFilters: the same on each of its pages) hold on this page too, each under a name of
  // its own (0.3.0 A1: the Metric page of a Ramadan report showed every date)
  const ownPages = r.files.filter((f) => /\/page\.json$/.test(f.path)).map((f) => JSON.parse(f.data)).filter((p) => p.type !== 'Tooltip');
  const ownPage = ownPages.find((p) => p.filterConfig && (p.filterConfig.filters || []).length), ownPage0 = ownPages[0];
  const filterConfig = ownPage ? { filters: ownPage.filterConfig.filters.map((x, i) => Object.assign({}, x, { name: 'Filter' + crypto.createHash('sha256').update(pageId + '\0filter' + i).digest('hex').slice(0, 24) })) } : null;
  // the report's page background and outspace (0.3.0 A1: the page had none): the first page's own when its image is the
  // one-pixel colour of a solid design; a page image that draws panels is that page's layout, so its outspace colour then
  const firstObj = ownPage0 && ownPage0.objects, img = firstObj && firstObj.background && (((firstObj.background[0].properties.image || {}).image || {}).url || {}).expr;
  const imgFile = img && img.ResourcePackageItem ? r.files.find((f) => f.path.endsWith('/RegisteredResources/' + img.ResourcePackageItem.ItemName)) : null;
  const onePixel = (d) => { try { const b = Buffer.from(d); return b.length > 24 && b.readUInt32BE(16) === 1 && b.readUInt32BE(20) === 1; } catch (e) { return false; } };
  const outColour = firstObj && firstObj.outspace && firstObj.outspace[0].properties.color;
  const objects = !firstObj ? null : !img || (imgFile && onePixel(imgFile.data)) ? JSON.parse(JSON.stringify({ background: firstObj.background, outspace: firstObj.outspace }))
    : outColour ? { background: [{ properties: { color: outColour, transparency: { expr: { Literal: { Value: '0D' } } } } }], outspace: firstObj.outspace } : null;
  if (objects) Object.keys(objects).forEach((k) => objects[k] === undefined && delete objects[k]);
  files.push({ path: `${D}/pages/${pageId}/page.json`, data: json(Object.assign({ $schema: SCHEMA.page, name: pageId, displayName: PAGE_NAME[lang], displayOption: 'FitToPage', width: W, height: H }, objects && Object.keys(objects).length ? { objects } : {}, filterConfig ? { filterConfig } : {})) });
  if (gridded && r.grid && typeof r.grid.charts === 'number') r.grid.charts += gridded;
  vs.forEach((v) => files.push({ path: `${D}/pages/${pageId}/visuals/${v.name}/visual.json`, data: json(v) }));
  // the page goes after the report's own pages, before the tooltip pages (pages.json keeps every other page as it is)
  const pagesFile = r.files.find((f) => f.path === `${D}/pages/pages.json`), pj = JSON.parse(pagesFile.data), own = r.files.filter((f) => /\/page\.json$/.test(f.path)).map((f) => JSON.parse(f.data)).filter((p) => p.type !== 'Tooltip').map((p) => p.name);
  const after = pj.pageOrder.reduce((n, id, i) => (own.includes(id) ? i + 1 : n), 0);
  pj.pageOrder.splice(after, 0, pageId);
  pagesFile.data = json(pj);
  const scriptFile = scriptFileOf(r.base, SCRIPT_SUFFIX);
  r.files.splice(r.files.findIndex((f) => /\.pbip$/.test(f.path)), 0, ...files, { path: scriptFile, data: script });
  return { names, items: items.map((x) => ({ field: `${x.t}[${x.m}]`, label: x.label })), fallback, page: PAGE_NAME[lang], pageId, scriptFile, table,
    charts: charts.map((kind) => ({ kind, by: kind === 'bar' ? `${cat.t}[${cat.c}]` : `${date.t}[${date.c}]` })),
    notSwitched: [cat ? null : 'bar chart: the report has no category for it', date ? null : B.date ? `line chart: ${B.date.t}[${B.date.c}] has no month order the chart can use (a month name without a sort column)` : 'line chart: the report has no month or date axis'].filter(Boolean) };
}

/** What the plan, the approval page and create_report's answer say of the switch (s: addSwitch's result). */
export function switchSaid(s) {
  return { measures: s.items, page: s.page, charts: s.charts, notSwitched: s.notSwitched, fallbackTitle: s.fallback, table: s.names.table, script: s.scriptFile,
    modelChange: MODEL_CHANGE(s.names.table), beforeApplied: BEFORE_APPLIED,
    howToApply: `Save a copy of your Power BI file first. Open "${s.scriptFile}" (next to the project) in Notepad, select all and copy; in Power BI Desktop open TMDL view, paste into a new tab, choose Preview: it shows one new table ${JSON.stringify(s.names.table)}; then Apply. On the ${JSON.stringify(s.page)} page choose one metric in the slicer: both charts and their titles switch, each measure in its own format. With nothing chosen the title says ${JSON.stringify(s.fallback)}.`,
    savedSelection: `Not written: the slicer opens with nothing chosen, so the charts show every metric together until one is chosen, and the titles say ${JSON.stringify(s.fallback)}. A saved first choice needs its file shape seen in Power BI Desktop first.` };
}

// ---- check_report: a field parameter on a report's visuals, and a title measure that reads its display column alone ----
/** The field parameters a report's visuals use: [{ table, column, file }] (inv: the reading layer's inventory). */
export function fieldParametersOf(visualJsons) {
  const out = [];
  visualJsons.forEach(({ file, json: v }) => { const st = (((v || {}).visual || {}).query || {}).queryState || {};
    Object.values(st).forEach((role) => ((role && role.fieldParameters) || []).forEach((p) => { const c = p && p.parameterExpr && p.parameterExpr.Column;
      const t = c && c.Expression && c.Expression.SourceRef && c.Expression.SourceRef.Entity; if (typeof t === 'string' && typeof c.Property === 'string') out.push({ table: t, column: c.Property, file }); })); });
  return out;
}
/** A model's field-parameter tables (ParameterMetadata kind 2) and the measures that read a display column alone. */
export function titleProblems(tmslModel) {
  const tables = (tmslModel && tmslModel.tables) || [], params = [];
  tables.forEach((t) => { const fieldsCol = (t.columns || []).find((c) => (c.extendedProperties || []).some((e) => e && e.name === 'ParameterMetadata' && e.value && +e.value.kind === 2));
    if (!fieldsCol) return; const display = (t.columns || []).find((c) => c.relatedColumnDetails && (c.relatedColumnDetails.groupByColumns || []).some((g) => g.groupingColumn === fieldsCol.name));
    if (display) params.push({ table: t.name, display: display.name, others: (t.columns || []).filter((c) => c !== display).map((c) => c.name) }); });
  const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const out = [];
  params.forEach((p) => tables.forEach((t) => (t.measures || []).forEach((ms) => {
    const e = String(ms.expression || ''), tq = `(?:'${esc(p.table).replace(/'/g, "''")}'|${esc(p.table)})`, ref = (c) => new RegExp(`(${tq})?\\s*\\[${esc(c).replace(/\]/g, ']]')}\\]`, 'i');
    if (ref(p.display).test(e) && !p.others.some((c) => ref(c).test(e))) out.push({ table: t.name, measure: ms.name, parameter: p.table, display: p.display });
  })));
  return { params, problems: out };
}
