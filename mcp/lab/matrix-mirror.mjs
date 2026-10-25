// 0.3.1 M1 (the owner, 25 Oct: "add one very extensive lab for matrix mirror ...; when I opened the last one myself it
// was not mirrored"): one project for the laptop to open in Power BI Desktop (2.159 or later) and screenshot at 100%,
// page by page. It shows everything Microsoft's capabilities give a matrix (pivotTable) that could make it read from the
// right (none of them is named for direction: the capabilities have no right-to-left, direction or text-direction
// property for a matrix or a table), so the laptop can say which one reads right before anything ships.
// A made-up model of its own, written here: facility service requests (8 service types, 24 months, two row groups);
// no employer or client data. Typed Power Query rows (the night of 6-7 Oct fact: untyped rows load as text).
// Pages (each matrix's title is its variant id and what it sets; mcp/work/M1.md "Variants" names each property's JSON
// path and source, and "For the laptop" what to judge):
//   1 Baselines            B1-B6: create_report's English matrix and the twin's today; the months-across matrix (the
//                          owner's case), one and two measures, English and the twin's today
//   2 Column order         C1-C6: the column field sorted Descending, rows and columns sorted, a reversed sort column,
//                          year and month Descending, a sort by a field not in the visual, the measures reversed
//   3 Totals               T1-T6: row subtotals at the top or the bottom, column or row totals off, both off, Descending
//                          months with the column total
//   4 Headers and layout   H1-H8: right alignment of row headers, column headers, values; stepped off; Tabular and
//                          Outline layout; values on rows; months in rows (transposed)
//   5a-5c Combinations 1280, 6a-6c the same at 1920: X1-X6 written by the shared engine (report-mirror.js matrixRtl,
//                          the lab's switch): Descending months with everything right-aligned, 12 and 24 months, long
//                          Arabic and long English names, the reversed sort column, transposed
//   7 Table reference      R1-R3: a table as create_report writes it, its twin today (columns reversed: what mirrored
//                          looks like), a table by month mirrored
// Microsoft's validator runs on the project; its error count is printed (0 expected).
//   node lab/matrix-mirror.mjs <empty folder>            (from mcp/; prints the .pbip to open)
//   node lab/matrix-mirror.mjs --variants                prints the variants table (mcp/work/M1.md)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), require = createRequire(import.meta.url);
const Mirror = require('../../assets/js/report-mirror.js'), Px = require('../../assets/js/pbip-export.js'), E = require('../../assets/js/design-engine.js');
const S = 'https://developer.microsoft.com/json-schemas/fabric/';
const SCHEMA = {
  pbip: S + 'pbip/pbipProperties/1.0.0/schema.json', pbir: S + 'item/report/definitionProperties/2.0.0/schema.json',
  platform: S + 'gitIntegration/platformProperties/2.0.0/schema.json', version: S + 'item/report/definition/versionMetadata/1.0.0/schema.json',
  report: S + 'item/report/definition/report/2.1.0/schema.json', pages: S + 'item/report/definition/pagesMetadata/1.0.0/schema.json',
  page: S + 'item/report/definition/page/2.0.0/schema.json', visual: S + 'item/report/definition/visualContainer/2.1.0/schema.json'
};
const L = (v) => ({ expr: { Literal: { Value: v } } });
const str = (s) => L("'" + String(s).replace(/'/g, "''") + "'");
const bool = (b) => L(b ? 'true' : 'false');
const clone = (o) => JSON.parse(JSON.stringify(o));

// ---------- the made-up model ----------
const T24 = 'Service Requests', T12 = 'Service Requests 12m';
const TYPES = [
  ['HVAC', 'التكييف', 'HVAC preventive maintenance and repairs', 'صيانة أنظمة التكييف والتهوية الوقائية والإصلاحات', 'Building systems', 'أنظمة المبنى'],
  ['Electrical', 'الكهرباء', 'Electrical distribution and lighting', 'شبكات توزيع الكهرباء والإنارة الداخلية والخارجية', 'Building systems', 'أنظمة المبنى'],
  ['Plumbing', 'السباكة', 'Plumbing, drainage and water supply', 'السباكة والصرف الصحي وتمديدات المياه', 'Building systems', 'أنظمة المبنى'],
  ['Lifts', 'المصاعد', 'Lifts and escalators', 'المصاعد والسلالم المتحركة', 'Building systems', 'أنظمة المبنى'],
  ['Fire Safety', 'السلامة من الحريق', 'Fire alarms, sprinklers and extinguishers', 'أنظمة إنذار الحريق والرشاشات وطفايات الحريق', 'Building systems', 'أنظمة المبنى'],
  ['Cleaning', 'التنظيف', 'Cleaning of offices and common areas', 'تنظيف المكاتب والمناطق المشتركة', 'Soft services', 'الخدمات العامة'],
  ['Security', 'الأمن', 'Security guarding and access control', 'الحراسة الأمنية والتحكم في الدخول', 'Soft services', 'الخدمات العامة'],
  ['Landscaping', 'تنسيق الحدائق', 'Landscaping and irrigation', 'تنسيق الحدائق وأنظمة الري', 'Soft services', 'الخدمات العامة']];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
// 24 months, November 2024 to October 2026
const MONTHS = Array.from({ length: 24 }, (_, i) => { const y = 2024 + Math.floor((10 + i) / 12), m = (10 + i) % 12; return { y, m, key: y * 100 + m + 1 }; });
const COLS = [['Service Type', 'text', 'string'], ['Service Type AR', 'text', 'string'], ['Service Type Long', 'text', 'string'], ['Service Type AR Long', 'text', 'string'],
  ['Group', 'text', 'string'], ['Group AR', 'text', 'string'], ['Month Start', 'datetime', 'dateTime'], ['Year', 'Int64.Type', 'int64'], ['Month', 'text', 'string'], ['Month AR', 'text', 'string'],
  ['Month Desc', 'text', 'string'], ['Month AR Desc', 'text', 'string'], ['Month Key', 'Int64.Type', 'int64'], ['Month Key Desc', 'Int64.Type', 'int64'], ['Cost', 'number', 'double'], ['Count', 'Int64.Type', 'int64']];
const SORT_BY = { Month: 'Month Key', 'Month AR': 'Month Key', 'Month Desc': 'Month Key Desc', 'Month AR Desc': 'Month Key Desc' };
const q2 = (s) => '"' + String(s).replace(/"/g, '""') + '"';
function rowsOf(months) {
  return TYPES.flatMap((t, i) => months.map((mo, j) => {
    const en = MONTHS_EN[mo.m] + ' ' + mo.y, ar = MONTHS_AR[mo.m] + ' ' + mo.y, count = 20 + ((i * 7 + j * 3) % 17) + i * 2, cost = count * (180 + i * 35) + j * 40;
    return [q2(t[0]), q2(t[1]), q2(t[2]), q2(t[3]), q2(t[4]), q2(t[5]), `#datetime(${mo.y}, ${mo.m + 1}, 1, 0, 0, 0)`, mo.y, q2(en), q2(ar), q2(en), q2(ar), mo.key, -mo.key, cost, count];
  }));
}
const mOf = (rows) => `let Source = #table(type table [${COLS.map(([n, t]) => '#"' + n + '" = ' + t).join(', ')}], {${rows.map((r) => '{' + r.join(', ') + '}').join(', ')}}) in Source`;
function model() {
  const table = (name, months, suffix) => ({ name, partitions: [{ name, mode: 'import', source: { type: 'm', expression: mOf(rowsOf(months)) } }],
    columns: COLS.map(([n, , dt]) => Object.assign({ name: n, dataType: dt, sourceColumn: n }, SORT_BY[n] ? { sortByColumn: SORT_BY[n] } : {}, /Key|Year|Cost|Count/.test(n) ? { summarizeBy: /Cost|Count/.test(n) ? 'sum' : 'none' } : {})),
    measures: [{ name: 'Total Cost' + suffix, expression: `SUM ( '${name}'[Cost] )`, formatString: '#,0' }, { name: 'Request Count' + suffix, expression: `SUM ( '${name}'[Count] )`, formatString: '#,0' }] });
  return { compatibilityLevel: 1567, model: { culture: 'en-US', defaultPowerBIDataSourceVersion: 'powerBI_V3', tables: [table(T24, MONTHS, ''), table(T12, MONTHS.slice(12), ' 12m')] } };
}

// ---------- the matrices ----------
const col = (t, c, display) => Object.assign({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c }, display ? { displayName: display } : {});
const mea = (t, m, display) => Object.assign({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m }, display ? { displayName: display } : {});
const AR = { cost: 'التكلفة الإجمالية', count: 'عدد الطلبات', type: 'نوع الخدمة', month: 'الشهر', group: 'المجموعة', year: 'السنة' };
// an Arabic matrix (the Arabic columns, the Arabic display names), English-shaped: what the twin starts from
function matrix(o) {
  const t = o.months === 24 ? T24 : T12, sfx = o.months === 24 ? '' : ' 12m', ar = o.lang !== 'en';
  const rowCol = o.long ? (ar ? 'Service Type AR Long' : 'Service Type Long') : ar ? 'Service Type AR' : 'Service Type';
  const monthCol = o.monthCol || (ar ? 'Month AR' : 'Month');
  const rows = (o.groups ? [col(t, ar ? 'Group AR' : 'Group', ar ? AR.group : null)] : []).concat([col(t, rowCol, ar ? AR.type : null)]);
  const cols = (o.year ? [col(t, 'Year', ar ? AR.year : null)] : []).concat([col(t, monthCol, ar ? AR.month : null)]);
  const vals = [mea(t, 'Total Cost' + sfx, ar ? AR.cost : null)].concat(o.measures === 2 ? [mea(t, 'Request Count' + sfx, ar ? AR.count : null)] : []);
  const roles = o.transposed ? { Rows: cols, Columns: rows, Values: vals } : { Rows: rows, Columns: cols, Values: vals };
  return { visualType: 'pivotTable', query: { queryState: Object.fromEntries(Object.entries(roles).map(([r, ps]) => [r, { projections: ps }])) }, objects: {}, visualContainerObjects: {} };
}
const entry = (v, card, props, selector) => { v.objects[card] = v.objects[card] || []; v.objects[card].push(Object.assign({ properties: props }, selector ? { selector } : {})); return v; };
const sortBy = (v, list) => { v.query.sortDefinition = { sort: list.map(([f, d]) => ({ field: clone(f.field), direction: d })), isDefaultSort: false }; return v; };
const roleOf = (v, r) => v.query.queryState[r].projections;
const titled = (v, id, what) => { v.visualContainerObjects.title = [{ properties: { show: bool(true), text: str(id + ' · ' + what), titleWrap: bool(true) } }]; return v; };
// through the shared engine, as a path would write it
const engine = (v, box, W, mode) => ({ visual: Mirror.mirrorVisual({ name: 'x', position: { x: box.x, y: box.y, z: 0, width: box.w, height: box.h }, visual: v }, W, mode ? { matrixRtl: mode } : {}).json.visual });

// create_report's own English matrix and table on the lab's fields (pbip-export.js, the writer create_report calls)
function written() {
  const d = E.fresh(); E.repairState(d);
  const B = { kpis: [{ t: T12, m: 'Total Cost 12m' }], measure: { t: T12, m: 'Total Cost 12m' }, table: [{ t: T12, c: 'Service Type' }, { t: T12, m: 'Total Cost 12m' }, { t: T12, m: 'Request Count 12m' }] };
  const r = Px.build({ name: 'W', title: 'W', pageName: 'W', lang: 'en', font: d.font, ui: d.ui, theme: E.buildTheme(d, 'en'), sample: false, model: { byPath: 'Lab.SemanticModel' }, bind: B, texts: E.REPORT_TEXTS.en,
    pages: [{ name: 'W', page: { w: 1280, h: 720 }, slots: [{ kind: 'matrix', x: 20, y: 20, w: 600, h: 320 }, { kind: 'table', x: 640, y: 20, w: 600, h: 320 }], panel: null, hand: true, png: Buffer.from(Mirror.BLANK_PNG, 'base64') }] });
  const vs = r.files.filter((f) => /\/visual\.json$/.test(f.path)).map((f) => JSON.parse(String(f.data))).filter((v) => v.visual);
  const take = (type) => { const v = clone(vs.find((x) => x.visual.visualType === type).visual); delete v.drillFilterOtherVisuals; v.visualContainerObjects = {}; return v; };
  return { matrix: take('pivotTable'), table: take('tableEx') };
}

// ---------- the variants: id, what it sets, where (JSON path), the source ----------
const CAP = '@microsoft/powerbi-core-visual-schema data/capabilities.json pivotTable';
const QRY = 'mcp/schemas visualConfiguration 2.1.0 schema-embedded.json';
const V = [];
const add = (page, id, what, path0, source, make) => V.push({ page, id, what, path: path0, source, make });
// 1 Baselines
add(1, 'B1', 'English matrix as create_report writes it', '(none: the writer\'s own)', 'pbip-export.js build (pbip-query.js bindQuery matrix: Rows + Values, no Columns)', (k) => ({ v: k.w.matrix, en: true }));
add(1, 'B2', 'B1 through the twin today', 'query.queryState.Values.projections reversed', 'report-mirror.js mirrorVisual (default matrixRtl "values")', (k) => ({ v: k.w.matrix, en: true, twin: true }));
add(1, 'B3', 'months across, English (the owner\'s case)', '(none)', 'the owner\'s shape: Rows service type, Columns month, one measure, totals on', () => ({ v: matrix({ lang: 'en' }), en: true }));
add(1, 'B4', 'B3 through the twin today: not mirrored', 'position only (one measure: nothing to reverse)', 'report-mirror.js mirrorVisual (default)', () => ({ v: matrix({ lang: 'en' }), en: true, twin: true }));
add(1, 'B5', 'months across, two measures, English', '(none)', '', () => ({ v: matrix({ lang: 'en', measures: 2 }), en: true }));
add(1, 'B6', 'B5 through the twin today', 'query.queryState.Values.projections reversed', 'report-mirror.js mirrorVisual (default)', () => ({ v: matrix({ lang: 'en', measures: 2 }), en: true, twin: true }));
// 2 Column order (Arabic)
add(2, 'C1', 'months sorted Descending', 'visual.query.sortDefinition.sort[0] = { field: Month AR, direction: "Descending" }', QRY + ' SortDefinition (line 77), QuerySort (line 94); ' + CAP + '.sorting (default, custom)',
  () => { const v = matrix({}); return { v: sortBy(v, [[roleOf(v, 'Columns')[0], 'Descending']]) }; });
add(2, 'C2', 'rows Ascending, then months Descending', 'visual.query.sortDefinition.sort = [Service Type AR Ascending, Month AR Descending]', QRY + ' SortDefinition (a list), QuerySort',
  () => { const v = matrix({}); return { v: sortBy(v, [[roleOf(v, 'Rows')[0], 'Ascending'], [roleOf(v, 'Columns')[0], 'Descending']]) }; });
add(2, 'C3', 'a reversed sort column in Columns', 'Columns: Service Requests 12m[Month AR Desc] (sortByColumn Month Key Desc, the key negated)', 'the model (model.bim sortByColumn): no report property; the same texts as Month AR',
  () => ({ v: matrix({ monthCol: 'Month AR Desc' }) }));
add(2, 'C4', 'year and month in Columns, both Descending', 'Columns [Year, Month AR]; sortDefinition [Year Descending, Month AR Descending]', QRY + ' SortDefinition; ' + CAP + ' dataRoles Columns',
  () => { const v = matrix({ year: true }); return { v: sortBy(v, roleOf(v, 'Columns').map((p) => [p, 'Descending'])) }; });
add(2, 'C5', 'sorted by Month Key (not in the visual) Descending', 'visual.query.sortDefinition.sort[0] = { field: Month Key, direction: "Descending" }', QRY + ' QuerySort (round 2: a chart sorts only by a field it holds; a matrix?)',
  () => { const v = matrix({}); return { v: sortBy(v, [[col(T12, 'Month Key'), 'Descending']]) }; });
add(2, 'C6', 'two measures reversed (today\'s twin), months across', 'query.queryState.Values.projections reversed', 'report-mirror.js matrixRtl "values" (the default)', () => ({ v: matrix({ measures: 2 }), engine: 'values' }));
// 3 Totals (Arabic, two row levels)
const SUB = CAP + '.objects.subTotals';
add(3, 'T1', 'row subtotals at the top', 'objects.subTotals[0].properties: rowSubtotals true, rowSubtotalsPosition "Top"', SUB + '.rowSubtotals, .rowSubtotalsPosition (Top, Bottom)',
  () => ({ v: entry(matrix({ groups: true }), 'subTotals', { rowSubtotals: bool(true), rowSubtotalsPosition: str('Top') }) }));
add(3, 'T2', 'row subtotals at the bottom', 'objects.subTotals[0].properties: rowSubtotals true, rowSubtotalsPosition "Bottom"', SUB + '.rowSubtotalsPosition',
  () => ({ v: entry(matrix({ groups: true }), 'subTotals', { rowSubtotals: bool(true), rowSubtotalsPosition: str('Bottom') }) }));
add(3, 'T3', 'column totals off', 'objects.subTotals[0].properties.columnSubtotals false', SUB + '.columnSubtotals (no position property for column totals)',
  () => ({ v: entry(matrix({ groups: true }), 'subTotals', { columnSubtotals: bool(false) }) }));
add(3, 'T4', 'row totals off', 'objects.subTotals[0].properties.rowSubtotals false', SUB + '.rowSubtotals', () => ({ v: entry(matrix({ groups: true }), 'subTotals', { rowSubtotals: bool(false) }) }));
add(3, 'T5', 'row and column totals off', 'objects.subTotals[0].properties: rowSubtotals false, columnSubtotals false', SUB, () => ({ v: entry(matrix({ groups: true }), 'subTotals', { rowSubtotals: bool(false), columnSubtotals: bool(false) }) }));
add(3, 'T6', 'months Descending with the column total on', 'sortDefinition [Month AR Descending]; objects.subTotals[0].properties.columnSubtotals true', QRY + ' SortDefinition; ' + SUB + '.columnSubtotals',
  () => { const v = matrix({ groups: true }); sortBy(v, [[roleOf(v, 'Columns')[0], 'Descending']]); return { v: entry(v, 'subTotals', { columnSubtotals: bool(true) }) }; });
// 4 Headers and layout (Arabic)
add(4, 'H1', 'row headers right-aligned', 'objects.rowHeaders[0].properties.alignment "Right"', CAP + '.objects.rowHeaders.alignment (Auto, Left, Center, Right)', () => ({ v: entry(matrix({}), 'rowHeaders', { alignment: str('Right') }) }));
add(4, 'H2', 'column headers and their title right-aligned', 'objects.columnHeaders[0].properties: alignment "Right", titleAlignment "Right"', CAP + '.objects.columnHeaders.alignment, .titleAlignment',
  () => ({ v: entry(matrix({}), 'columnHeaders', { alignment: str('Right'), titleAlignment: str('Right') }) }));
add(4, 'H3', 'values right-aligned (header, values, subtotals, total)', 'objects.columnFormatting[] { selector: { metadata: <measure queryRef> }, properties: alignment "Right", styleHeader, styleValues, styleSubtotals, styleTotal true }',
  CAP + '.objects.columnFormatting.alignment, .styleHeader, .styleValues, .styleSubtotals, .styleTotal (the values card has no alignment)',
  () => { const v = matrix({}); return { v: entry(v, 'columnFormatting', { alignment: str('Right'), styleHeader: bool(true), styleValues: bool(true), styleSubtotals: bool(true), styleTotal: bool(true) }, { metadata: roleOf(v, 'Values')[0].queryRef }) }; });
add(4, 'H4', 'stepped layout off (two row levels)', 'objects.rowHeaders[0].properties.stepped false', CAP + '.objects.rowHeaders.stepped', () => ({ v: entry(matrix({ groups: true }), 'rowHeaders', { stepped: bool(false) }) }));
add(4, 'H5', 'layout Tabular (two row levels)', 'objects.general[0].properties.layout "Tabular"', CAP + '.objects.general.layout (Compact, Outline, Tabular)', () => ({ v: entry(matrix({ groups: true }), 'general', { layout: str('Tabular') }) }));
add(4, 'H6', 'layout Outline (two row levels)', 'objects.general[0].properties.layout "Outline"', CAP + '.objects.general.layout', () => ({ v: entry(matrix({ groups: true }), 'general', { layout: str('Outline') }) }));
add(4, 'H7', 'values on rows (two measures)', 'objects.values[0].properties.valuesOnRow true', CAP + '.objects.values.valuesOnRow ("Show values in row groups rather than columns")', () => ({ v: entry(matrix({ measures: 2 }), 'values', { valuesOnRow: bool(true) }) }));
add(4, 'H8', 'transposed: months in Rows, service types in Columns', 'queryState: Rows [Month AR], Columns [Service Type AR]', CAP + ' dataRoles Rows, Columns', () => ({ v: matrix({ transposed: true }) }));
// 5 and 6 Combinations: the shared engine's candidates (report-mirror.js matrixRtl), at 1280 (5a-5c) and 1920 (6a-6c)
const COMBOS = [
  ['X1', 'columnsDescendingAlignRight', '12 months, Descending, every alignment right', {}],
  ['X2', 'columnsDescendingAlignRight', '24 months (scrolls), Descending, every alignment right', { months: 24 }],
  ['X3', 'columnsDescendingAlignRight', 'long Arabic names, Descending, every alignment right', { long: true }],
  ['X4', 'columnsDescendingAlignRight', 'long English names, English labels, Descending, every alignment right', { long: true, lang: 'en' }],
  ['X5', 'alignRight', 'the reversed sort column (Month AR Desc), 24 months, every alignment right', { months: 24, monthCol: 'Month AR Desc' }],
  ['X6', 'alignRight', 'transposed, every alignment right', { transposed: true }]];
[[5, 1280, 720], [6, 1920, 1080]].forEach(([page, W]) => COMBOS.forEach(([id, mode, what, o]) => add(page, id + (W === 1920 ? '-1920' : ''), what,
  'report-mirror.js matrixRtl "' + mode + '": ' + (/columnsDescending/.test(mode) ? 'sortDefinition each Columns field Descending; ' : '') + 'rowHeaders.alignment, columnHeaders.alignment and titleAlignment "Right", columnFormatting.alignment "Right" per measure',
  CAP + ' (as H1-H3, C1); the engine writes it (the lab\'s switch, opts.matrixRtl)', () => ({ v: matrix(Object.assign({ measures: 2 }, o)), engine: mode, en: o.lang === 'en' }))));
// 7 Table reference
add(7, 'R1', 'English table as create_report writes it', '(none)', 'pbip-export.js build', (k) => ({ v: k.w.table, en: true }));
add(7, 'R2', 'R1 through the twin today: columns reversed (what mirrored looks like)', 'query.queryState.Values.projections reversed; columnFormatting alignment Right on text columns', 'report-mirror.js mirrorVisual (table)', (k) => ({ v: k.w.table, en: true, twin: true }));
add(7, 'R3', 'a table by month through the twin (Arabic names)', 'as R2', 'report-mirror.js mirrorVisual (table)', () => ({ v: { visualType: 'tableEx', query: { queryState: { Values: { projections: [col(T12, 'Month AR', AR.month), mea(T12, 'Total Cost 12m', AR.cost), mea(T12, 'Request Count 12m', AR.count)] } } }, objects: {}, visualContainerObjects: {} }, twin: true }));

const PAGES = [
  { id: 'p1baselines', name: '1 Baselines', w: 1280, h: 1080, ids: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'], grid: [2, 3] },
  { id: 'p2colorder', name: '2 Column order', w: 1280, h: 1080, ids: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'], grid: [2, 3] },
  { id: 'p3totals', name: '3 Totals', w: 1280, h: 1080, ids: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'], grid: [2, 3] },
  { id: 'p4headers', name: '4 Headers and layout', w: 1280, h: 1080, ids: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8'], grid: [2, 4] },
  { id: 'p5acombos', name: '5a X1 X2 at 1280', w: 1280, h: 720, ids: ['X1', 'X2'], grid: [1, 2] },
  { id: 'p5bcombos', name: '5b X3 X4 at 1280', w: 1280, h: 720, ids: ['X3', 'X4'], grid: [1, 2] },
  { id: 'p5ccombos', name: '5c X5 X6 at 1280', w: 1280, h: 720, ids: ['X5', 'X6'], grid: [1, 2] },
  { id: 'p6acombos', name: '6a X1 X2 at 1920', w: 1920, h: 1080, ids: ['X1-1920', 'X2-1920'], grid: [1, 2] },
  { id: 'p6bcombos', name: '6b X3 X4 at 1920', w: 1920, h: 1080, ids: ['X3-1920', 'X4-1920'], grid: [1, 2] },
  { id: 'p6ccombos', name: '6c X5 X6 at 1920', w: 1920, h: 1080, ids: ['X5-1920', 'X6-1920'], grid: [1, 2] },
  { id: 'p7tables', name: '7 Table reference', w: 1280, h: 720, ids: ['R1', 'R2', 'R3'], grid: [3, 1] }];

export function variantsTable() {
  return ['| Page | Id | What it sets | JSON path | Source |', '|---|---|---|---|---|'].concat(V.map((x) => `| ${x.page} | ${x.id} | ${x.what} | ${x.path.replace(/\|/g, '/')} | ${x.source.replace(/\|/g, '/')} |`)).join('\n');
}

export function writeLab(out) {
  const ROOT = path.resolve(out), P = 'Matrix Mirror Lab', R = P + '.Report', DEF = R + '/definition', SM = 'Lab.SemanticModel';
  if (fs.existsSync(ROOT) && fs.readdirSync(ROOT).length) throw new Error('give an empty folder: ' + ROOT);
  const put = (rel, o) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof o === 'string' ? o : JSON.stringify(o, null, 2) + '\n'); };
  put(SM + '/definition.pbism', { version: '1.0' });
  put(SM + '/model.bim', model());
  put(P + '.pbip', { $schema: SCHEMA.pbip, version: '1.0', artifacts: [{ report: { path: R } }], settings: { enableAutoRecovery: true } });
  put(R + '/definition.pbir', { $schema: SCHEMA.pbir, version: '4.0', datasetReference: { byPath: { path: '../' + SM } } });
  put(R + '/.platform', { $schema: SCHEMA.platform, metadata: { type: 'Report', displayName: P }, config: { version: '2.0', logicalId: '3c7e1f52-8a4d-4b2e-9f61-0d5a7b2c8e14' } });
  put(DEF + '/version.json', { $schema: SCHEMA.version, version: '2.0.0' });
  put(DEF + '/report.json', { $schema: SCHEMA.report, themeCollection: {}, settings: { useStylableVisualContainerHeader: true, defaultDrillFilterOtherVisuals: true, useDefaultAggregateDisplayName: true } });
  put(DEF + '/pages/pages.json', { $schema: SCHEMA.pages, pageOrder: PAGES.map((p) => p.id), activePageName: PAGES[0].id });
  const k = { w: written() };
  const byId = Object.fromEntries(V.map((x) => [x.id, x]));
  PAGES.forEach((pg) => {
    put(`${DEF}/pages/${pg.id}/page.json`, { $schema: SCHEMA.page, name: pg.id, displayName: pg.name, displayOption: 'FitToPage', width: pg.w, height: pg.h });
    const [cols, rows] = pg.grid, gap = 16, w = Math.floor((pg.w - gap * (cols + 1)) / cols), h = Math.floor((pg.h - gap * (rows + 1)) / rows);
    pg.ids.forEach((id, i) => {
      const x = byId[id], m = x.make(k), box = { x: gap + (i % cols) * (w + gap), y: gap + Math.floor(i / cols) * (h + gap), w, h };
      let v = clone(m.v);
      // the twin's today (the default) or the engine's candidate: the visual as that path writes it; each keeps its own cell
      // of the lab's grid (where a path places it, the page mirrored, is not what is judged here)
      if (m.twin || m.engine) v = engine(v, box, pg.w, m.engine).visual;
      titled(v, id, x.what);
      const name = id.toLowerCase().replace(/[^a-z0-9]/g, '') + pg.id.slice(0, 3);
      put(`${DEF}/pages/${pg.id}/visuals/${name}/visual.json`, { $schema: SCHEMA.visual, name, position: { x: box.x, y: box.y, z: (i + 1) * 1000, height: box.h, width: box.w, tabOrder: (i + 1) * 1000 }, visual: v });
    });
  });
  // Microsoft's validator (the version mcp/package.json pins), offline
  const cli = path.join(HERE, '../node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js');
  const r = spawnSync(process.execPath, [cli, 'validate', path.join(ROOT, R)], { encoding: 'utf8' });
  const text = (r.stdout || '') + (r.stderr || ''), errs = (text.match(/\berror\b/gi) || []).length;
  return { pbip: path.join(ROOT, P + '.pbip'), pages: PAGES.length, visuals: PAGES.reduce((n, p) => n + p.ids.length, 0), validator: { exit: r.status, text: text.trim().slice(0, 4000) }, errs };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--variants') { console.log(variantsTable()); process.exit(0); }
  if (!process.argv[2]) { console.error('node lab/matrix-mirror.mjs <empty folder>'); process.exit(2); }
  const r = writeLab(process.argv[2]);
  console.log(`wrote ${r.pages} pages, ${r.visuals} matrices and tables: ${r.pbip}\nvalidator (exit ${r.validator.exit}):\n${r.validator.text}`);
  process.exit(r.validator.exit === 0 ? 0 : 1);
}
