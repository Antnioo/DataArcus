import './test-env.mjs';
// 0.3.2 SP39 (the split, finish: B-280, B-286; mcp/work/SP39.md). A characterisation suite: everything
// assets/js/report-mirror.js hands out gives exactly what it gave on the base (integration/0.3.2 at 643e1e6), before
// its chart transforms moved to mirror-charts.js, its text runs and literals to mirror-text.js and its group and
// badge geometry to mirror-units.js. Recorded on the base in fixtures/sp39-mirror.json; SP39_RECORD=1 records again
// (only on the base, never to make a run pass).
// The corpus: every visual and page of the twin and report fixtures (twin-project, health-project, hm1, hm2,
// twin-fuzz), their mobile.json files, and 20 made-up visuals on 3 made-up pages (no employer data): every chart
// family (column, line, area, combo, bar, bar with a legend), a waterfall by month, a continuous date axis, a table
// with widths and one without, a matrix by weekday, a group holding a tile and two badges, a bar list with its names
// beside it, a text box with runs, a button, a new card with an image, a donut legend, a flat matrix, an unreadable visual.
//   V1-Vn  each visual: mirrorVisual under 8 option sets (kind, changes, output sha), mirrorChart under 3, the texts
//          (textsOfVisual), labelVisual with made-up labels, a phone layout's texts, labels and mirror, and the
//          matrix and table helpers (flatMatrix, flatTable, rowNamesBeside, heatmapBeside, heatmapNames,
//          rowLabelStyle), each as recorded; the input never changed by the pure ones
//   G1-Gn  each page: mirrorPage under 3 option sets and unitsOf, as recorded
//   K1     the api: its names, KIND_WHAT, MATRIX_RTL, FLAT_LOST, PHONE_W, BLANK_PNG, round, pageImages, pageHasPicture
//   C1     the corpus: at least 60 visuals, every kind, a badge unit and a bars unit among the units
//   M1-M6  (after each move) the module exists, says its interface at its top, is required by report-mirror.js and
//          loaded before it by the theme generator, holds its functions and report-mirror.js no copy; every file
//          under 600 lines
//   node test-0.3.2-sp39.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..'), JS = path.join(REPO, 'assets/js'), FIX = path.join(HERE, 'fixtures');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (s) => crypto.createHash('sha256').update(Buffer.from(String(s), 'utf8')).digest('hex').slice(0, 24) + ':' + Buffer.byteLength(String(s), 'utf8');
const GOLD = path.join(FIX, 'sp39-mirror.json');
const record = process.env.SP39_RECORD === '1';
const Mirror = require('../assets/js/report-mirror.js');
const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
// a call's answer as text: its JSON (functions named), or what it threw
const out = (f) => { try { const r = f(); return r === undefined ? 'undefined' : JSON.stringify(r, (k, v) => (typeof v === 'function' ? '[function]' : v instanceof Set ? [...v] : v)); } catch (e) { return 'threw: ' + String(e && e.message || e); } };

// ---------- the corpus ----------
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const pages = [];
['twin-project', 'health-project'].forEach((d) => {
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)).forEach((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name === 'pages') fs.readdirSync(p, { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => x.name).sort().forEach((pid) => {
      const pdir = path.join(p, pid), vdir = path.join(pdir, 'visuals'), page = rd(path.join(pdir, 'page.json'));
      const names = fs.existsSync(vdir) ? fs.readdirSync(vdir).sort().filter((n) => fs.existsSync(path.join(vdir, n, 'visual.json'))) : [];
      const mobiles = {}; names.forEach((n) => { const m = path.join(vdir, n, 'mobile.json'); if (fs.existsSync(m)) mobiles[n] = rd(m); });
      pages.push({ id: d + '/' + pid, pageJson: page, page: { width: page.width, height: page.height }, visuals: names.map((n) => rd(path.join(vdir, n, 'visual.json'))), mobiles: names.map((n) => mobiles[n] || null) });
    });
    else if (e.isDirectory()) walk(p);
  });
  walk(path.join(FIX, d));
});
['hm1', 'hm2', 'twin-fuzz'].forEach((d) => fs.readdirSync(path.join(FIX, d)).sort().forEach((f) => rd(path.join(FIX, d, f)).pages.forEach((pg, i) => pages.push({ id: d + '/' + f + '#' + i, pageJson: pg, page: { width: pg.width, height: pg.height }, visuals: pg.visuals, mobiles: [] }))));

// made-up visuals: the shapes the split map names as high risk
const L = (v) => ({ expr: { Literal: { Value: v } } });
const col = (t, c) => ({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c });
const mea = (t, m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m });
const S_VIS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
const vc = (name, x, y, z, w, h, visual, extra) => Object.assign({ $schema: S_VIS, name, position: { x, y, z, width: w, height: h }, visual }, extra || {});
const T = 'Shop', D = 'Dates';
const title = (t) => ({ title: [{ properties: { show: L('true'), text: L("'" + t + "'") } }], general: [{ properties: { altText: L("'" + t + " chart'") } }] });
const PAGE1 = [
  vc('xColumn', 20, 20, 1, 400, 200, { visualType: 'clusteredColumnChart', query: { queryState: { Category: { projections: [col(D, 'Month')] }, Y: { projections: [mea(T, 'Sales')] }, Series: { projections: [col(T, 'Region')] } }, sortDefinition: { sort: [{ field: col(D, 'Month').field, direction: 'Ascending' }] } }, objects: { legend: [{ properties: { position: L("'Right'") } }] }, visualContainerObjects: title('Sales by month') }),
  vc('xLineDate', 440, 20, 2, 400, 200, { visualType: 'lineChart', query: { queryState: { Category: { projections: [col(D, 'Date')] }, Y: { projections: [mea(T, 'Sales')] } } }, visualContainerObjects: { dropShadow: [{ properties: { preset: L("'BottomRight'") } }] } }),
  vc('xArea', 860, 20, 3, 400, 200, { visualType: 'areaChart', query: { queryState: { Category: { projections: [col(T, 'Region')] }, Y: { projections: [mea(T, 'Sales')] } } }, objects: { legend: [{ properties: { position: L("'Diagonal'") } }] } }),
  vc('xCombo', 20, 240, 4, 400, 200, { visualType: 'lineClusteredColumnComboChart', query: { queryState: { Category: { projections: [col(D, 'Year')] }, Y: { projections: [mea(T, 'Sales')] }, Y2: { projections: [mea(T, 'Margin')] } } } }),
  vc('xBarLegend', 440, 240, 5, 400, 200, { visualType: 'clusteredBarChart', query: { queryState: { Category: { projections: [col(T, 'Region')] }, Y: { projections: [mea(T, 'Sales')] }, Legend: { projections: [col(T, 'Segment')] } } }, objects: { legend: [{ properties: { position: L("'TopRight'") } }] } }),
  vc('xWaterfall', 860, 240, 6, 400, 200, { visualType: 'waterfallChart', query: { queryState: { Category: { projections: [col(D, 'Month')] }, Y: { projections: [mea(T, 'Change')] } } }, objects: { sentimentColors: [{ properties: { increaseFill: { solid: { color: L("'#2E7D32'") } }, decreaseFill: { solid: { color: L("'#C62828'") } } } }], valueAxis: [{ properties: { show: L('true') } }] } }),
  vc('xTableWidths', 20, 460, 7, 500, 200, { visualType: 'tableEx', query: { queryState: { Values: { projections: [col(T, 'Region'), mea(T, 'Sales'), mea(T, 'Margin')] } } }, objects: { columnWidth: [{ properties: { value: L('120D') }, selector: { metadata: 'Shop.Region' } }, { properties: { value: L('90D') }, selector: { metadata: 'Shop.Sales' } }, { properties: { value: L('90D') }, selector: { metadata: 'Shop.Margin' } }], columnFormatting: [{ properties: { fontColor: { solid: { color: L("'#112233'") } } }, selector: { metadata: 'Shop.Region' } }] } }),
  vc('xTableNoWidths', 540, 460, 8, 500, 200, { visualType: 'tableEx', query: { queryState: { Values: { projections: [col(T, 'Segment'), mea(T, 'Orders')] } } }, objects: { values: [{ properties: { icon: { layout: L("'After'") } } }] }, visualContainerObjects: { padding: [{ properties: { left: L('4D'), right: L('10D') } }] } }),
  vc('xHeatmap', 20, 680, 9, 700, 260, { visualType: 'pivotTable', query: { queryState: { Rows: { projections: [col(D, 'Weekday')] }, Columns: { projections: [col(D, 'Hour')] }, Values: { projections: [mea(T, 'Calls')] } } }, objects: { grid: [{ properties: { textSize: L('9D') } }], columnWidth: [{ properties: { value: L('40D') }, selector: { metadata: 'Dates.Weekday' } }] }, visualContainerObjects: { padding: [{ properties: { left: L('2D'), right: L('8D') } }] } })
];
const PAGE2 = [
  vc('gTile', 0, 0, 1000, 600, 300, { visualType: 'group' }),
  vc('tile', 0, 0, 10, 600, 300, { visualType: 'cardVisual', query: { queryState: { Data: { projections: [mea(T, 'Sales'), mea(T, 'Margin')] } } }, objects: { image: [{ properties: { position: L("'Left'") } }], padding: [{ properties: { leftMargin: L('12D') } }], value: [{ properties: { horizontalAlignment: L("'left'"), fontSize: L('28D') }, selector: { id: 'default' } }] }, visualContainerObjects: { title: [{ properties: { show: L('true'), text: L("'Sales and margin this quarter against the plan'"), fontSize: L('12D') } }], padding: [{ properties: { top: L('8D'), left: L('8D') } }] } }, { parentGroupName: 'gTile' }),
  vc('badgeUp', 552, 20, 20, 60, 30, { visualType: 'textbox', objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: '+12%', textStyle: { fontSize: '10pt' } }] }] } }] } }, { parentGroupName: 'gTile' }),
  vc('badgeIcon', 20, 20, 21, 40, 40, { visualType: 'image' }, { parentGroupName: 'gTile' }),
  vc('xButton', 700, 20, 30, 160, 40, { visualType: 'actionButton', objects: { text: [{ properties: { text: L("'Open details'"), horizontalAlignment: L("'left'") } }], icon: [{ properties: { placement: L("'left'") } }] }, visualContainerObjects: { general: [{ properties: { altText: L("'Details button'") } }] } }),
  vc('xText', 700, 80, 31, 300, 80, { visualType: 'textbox', objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: 'Monthly ', textStyle: {} }, { value: 'sales', textStyle: { fontWeight: 'bold' } }] }, { horizontalTextAlignment: 'center', textRuns: [{ value: 'All regions' }] }] } }] } })
];
const PAGE3 = [
  vc('xBars', 20, 20, 1, 300, 300, { visualType: 'barChart', query: { queryState: { Category: { projections: [col(T, 'Region')] }, Y: { projections: [mea(T, 'Sales')] } } }, objects: { categoryAxis: [{ properties: { show: L('false') } }] } }),
  vc('xBarNames', 330, 20, 2, 150, 300, { visualType: 'tableEx', query: { queryState: { Values: { projections: [col(T, 'Region')] } } } }),
  vc('xFlatMatrix', 920, 340, 4, 340, 200, { visualType: 'pivotTable', query: { queryState: { Rows: { projections: [col(T, 'Customer')] }, Values: { projections: [mea(T, 'Visits'), mea(T, 'Cost')] } } }, objects: { rowHeaders: [{ properties: { fontColor: { solid: { color: L("'#334455'") } } } }], subTotals: [{ properties: { rowSubtotals: L('true') } }] } }),
  vc('xBroken', 20, 400, 5, 100, 50, 'not an object'),
  vc('xDonut', 600, 20, 3, 300, 300, { visualType: 'donutChart', query: { queryState: { Y: { projections: [mea(T, 'Answered'), mea(T, 'Unanswered')] } } }, objects: { legend: [{ properties: { show: L('true') } }] } })
];
pages.push({ id: 'made-up/charts', pageJson: { width: 1280, height: 960 }, page: { width: 1280, height: 960 }, visuals: PAGE1, mobiles: [] });
pages.push({ id: 'made-up/group', pageJson: { width: 1280, height: 720, objects: { background: [{ properties: { image: { image: { name: L("'bg.png'") } } } }] } }, page: { width: 1280, height: 720 }, visuals: PAGE2, mobiles: [] });
pages.push({ id: 'made-up/bars', pageJson: { width: 1280, height: 720 }, page: { width: 1280, height: 720 }, visuals: PAGE3, mobiles: [] });
const MADE_N = PAGE1.length + PAGE2.length + PAGE3.length;

// the model's facts the twin passes (made up)
const DT = [D, 'Dim Date', 'Calendar'], DC = [D + '.Date', 'Calendar.Order Date', 'Calendar.StartOfMonth'], TC = [D + '.Month', D + '.Weekday', T + '.Region', T + '.Segment'];
const THEME = { visualStyles: { '*': { '*': { dropShadow: [{ preset: 'BottomRight', show: true }] } } } };
const WF = { theme: { dataColors: ['#123456'] }, extMeasure: (t, want) => want, formatOf: () => '#,0', sortByOf: (t, c) => (c === 'Month' ? 'Month No' : null), typeOf: () => null };
const RUNS = {
  A: {},
  B: { timeRightToLeft: false, dateTables: DT },
  C: { dateTables: DT, dateColumns: DC, textColumns: TC },
  D: { waterfallRtl: 'mirror', dateTables: DT, dateColumns: DC, waterfall: WF },
  E: { waterfallRtl: 'mirror', timeRightToLeft: false, dateTables: DT },
  K: { keepDirection: true, matrixAsTable: false },
  M: { matrixRtl: 'columnsDescendingAlignRight', matrixAsTable: false, theme: THEME },
  N: { matrixRtl: 'none', textColumns: TC }
};
const CHART_RUNS = { A: {}, C: RUNS.C, B: RUNS.B };
const PAGE_RUNS = { A: {}, C: RUNS.C, D: RUNS.D };
const widthIn = (pg, v) => { const g = isObj(v) && v.parentGroupName != null ? pg.visuals.find((x) => isObj(x) && String(x.name) === String(v.parentGroupName)) : null; return g && isObj(g.position) ? g.position.width : pg.page.width; };
const rows = [];
pages.forEach((pg) => pg.visuals.forEach((v, i) => rows.push({ id: pg.id + '/' + (isObj(v) && v.name != null ? v.name : '#' + i), v, W: widthIn(pg, v), pid: pg.id.replace(/[^A-Za-z0-9]/g, ''), mobile: pg.mobiles[i] || null })));

// a phone layout for a visual that has none: its own formatting in a phone box (made up)
const phoneOf = (r) => r.mobile || (isObj(r.v) && isObj(r.v.visual) ? { position: { x: 10, y: 10, z: 1, width: 150, height: 80 }, objects: clone(r.v.visual.objects), visualContainerObjects: clone(r.v.visual.visualContainerObjects) } : null);
// made-up approved labels: every id the texts give, in Arabic letters
const labelsOf = (texts) => { const l = {}; texts.forEach((t, i) => { l[t.id] = 'نص ' + i + ' المبيعات والهامش'; }); return l; };
const answerOf = (r) => {
  const a = { runs: {}, chart: {} }, before = JSON.stringify(r.v);
  Object.keys(RUNS).forEach((k) => { let m; try { m = Mirror.mirrorVisual(r.v, r.W, RUNS[k]); } catch (e) { m = { threw: String(e.message) }; } a.runs[k] = { kind: m.kind, changes: m.changes, sha: sha(out(() => m)) }; });
  Object.keys(CHART_RUNS).forEach((k) => { a.chart[k] = sha(out(() => Mirror.mirrorChart(isObj(r.v) ? clone(r.v.visual) : r.v, CHART_RUNS[k]))); });
  const texts = (() => { try { return Mirror.textsOfVisual(r.pid, r.v); } catch (e) { return []; } })();
  a.texts = sha(out(() => texts));
  a.label = sha(out(() => { const j = clone(r.v), n = Mirror.labelVisual(r.pid, j, labelsOf(texts)); return { n, j }; }));
  const mob = phoneOf(r);
  const ptexts = (() => { try { return Mirror.textsOfMobile(r.pid, r.v, mob); } catch (e) { return []; } })();
  a.phone = sha(out(() => ptexts));
  a.phoneLabel = sha(out(() => { const m = clone(mob), n = Mirror.labelMobile(r.pid, r.v, m, labelsOf(ptexts), { font: 'Segoe UI', was: r.v }); return { n, m }; }));
  a.phoneMirror = sha(out(() => Mirror.mirrorMobile(r.v, mob)));
  a.grid = sha(out(() => ({ flatMatrix: Mirror.flatMatrix(r.v), flatTable: Mirror.flatTable(r.v), beside: Mirror.rowNamesBeside(r.v, { width: 80 }), heat: Mirror.heatmapBeside(r.v, {}), heatM: Mirror.heatmapBeside(r.v, { mirrored: true }), names: Mirror.heatmapNames(Mirror.mirrorVisual(r.v, r.W, RUNS.C).json, { background: '#FAFAFA' }), rowLabel: (() => { const j = clone(r.v); return { changed: Mirror.rowLabelStyle(j), j }; })() })));
  a.pure = JSON.stringify(r.v) === before;
  return a;
};
const pageOf = (pg) => {
  const a = { runs: {} }, before = JSON.stringify(pg.visuals);
  Object.keys(PAGE_RUNS).forEach((k) => { let m; try { m = Mirror.mirrorPage(pg.page, pg.visuals, PAGE_RUNS[k]); } catch (e) { m = { threw: String(e.message) }; } a.runs[k] = { sha: sha(out(() => m)), kinds: m.kinds, units: m.units }; });
  a.units = out(() => Mirror.unitsOf(pg.visuals));
  a.picture = out(() => ({ images: Mirror.pageImages(pg.pageJson), has: Mirror.pageHasPicture(pg.pageJson), blank: Mirror.pageHasPicture(pg.pageJson, { blank: () => true }) }));
  a.pure = JSON.stringify(pg.visuals) === before;
  return a;
};
const apiOf = () => ({ names: Object.keys(Mirror).sort(), types: Object.keys(Mirror).sort().map((k) => typeof Mirror[k]), KIND_WHAT: sha(JSON.stringify(Mirror.KIND_WHAT)), MATRIX_RTL: Mirror.MATRIX_RTL, MATRIX_RTL_DEFAULT: Mirror.MATRIX_RTL_DEFAULT, FLAT_LOST: sha(Mirror.FLAT_LOST), PHONE_W: Mirror.PHONE_W, BLANK_PNG: sha(Mirror.BLANK_PNG),
  round: [0.004, -0.004, 1.005, 2.675, -1e-13, 12.3456, 1279.999].map((x) => Mirror.round(x)), images: out(() => [null, {}, { objects: { wallpaper: [{ properties: { image: { image: { name: L("'w.png'") } } } }] } }].map((p) => Mirror.pageImages(p))) });

const got = { about: 'SP39: everything report-mirror.js hands out (mirrorVisual under 8 option sets, mirrorChart, the texts, labels and phone layout, the matrix and table helpers, mirrorPage, unitsOf, the page pictures and the api) recorded on integration/0.3.2 at 643e1e6, before the chart, text and unit moves', api: apiOf(), visuals: {}, pages: {} };
rows.forEach((r) => { got.visuals[r.id] = answerOf(r); });
pages.forEach((pg) => { got.pages[pg.id] = pageOf(pg); });
const gold = record ? got : rd(GOLD);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

rows.forEach((r, i) => chk(() => gold.visuals[r.id] && same(got.visuals[r.id], gold.visuals[r.id]) && got.visuals[r.id].pure,
  () => `V${i + 1} ${r.id}: ${JSON.stringify(got.visuals[r.id]).slice(0, 300)} is not the base's ${JSON.stringify(gold.visuals[r.id]).slice(0, 300)}`));
pages.forEach((pg, i) => chk(() => gold.pages[pg.id] && same(got.pages[pg.id], gold.pages[pg.id]) && got.pages[pg.id].pure, () => `G${i + 1} ${pg.id}: mirrorPage or unitsOf is not the base's`));
chk(() => same(got.api, gold.api), () => `K1 the api is not the base's: ${JSON.stringify(got.api).slice(0, 400)}`);
const kinds = new Set(rows.map((r) => got.visuals[r.id].runs.A.kind)), units = pages.map((pg) => got.pages[pg.id].runs.C.units || { on: [], bars: [] });
chk(() => rows.length >= 60 && MADE_N === 20 && Object.keys(gold.visuals).length === rows.length && ['column', 'bar', 'waterfallNative', 'table', 'matrixAsTable', 'matrix', 'newCard', 'slicer', 'plain', 'custom', 'group', 'textbox', 'button', 'navigator', 'other', 'unreadable'].every((k) => kinds.has(k)) &&
  rows.some((r) => got.visuals[r.id].runs.D.kind === 'waterfall') && units.some((u) => u.on.length >= 2) && units.some((u) => u.bars.length >= 1) && rows.some((r) => r.mobile),
() => `C1 the corpus must hold at least 60 visuals (${rows.length}), every kind (${[...kinds].join(', ')}), a mirrored waterfall, two badges on a tile, a bar list with its names and a phone layout`);

// M: after each move, its module (the order of the split: charts, then text, then units)
const SRC = (f) => (fs.existsSync(path.join(JS, f)) ? fs.readFileSync(path.join(JS, f), 'utf8') : null);
const lines = (s) => s.split('\n').length - (s.endsWith('\n') ? 1 : 0);
const TG = SRC('theme-generator.js'), RM = SRC('report-mirror.js');
const atJ = (f) => TG.indexOf('/assets/js/' + f + '?v=');
const MODS = [
  { file: 'mirror-charts.js', root: 'DAMirrorCharts', has: ['chartRtl', 'chartsOf', 'mirrorChart', 'matrixRtl'], gone: /function (chartRtl|matrixRtl)\(|const LEGEND =|rtlWaterfall\(/ },
  { file: 'mirror-text.js', root: 'DAMirrorText', has: ['textsOfVisual', 'labelVisual', 'textsOfMobile', 'labelMobile', 'paragraphsOf'], gone: /function (textsOfVisual|labelVisual|eachTextProp|phoneCard|labelMobile)\(|const TEXT_PROPS =/ },
  { file: 'mirror-units.js', root: 'DAMirrorUnits', has: ['unitsOf', 'placesOf', 'widthOf', 'boxOf', 'nameOf'], gone: /function unitsOf\(|const BADGE =|const showsNames =/ }
];
MODS.forEach((m, i) => { const s = SRC(m.file); if (s == null) return;
  const M = require('../assets/js/' + m.file);
  chk(() => /^\/\* DataArcus /.test(s) && /Interface/.test(s.slice(0, 2500)) && m.has.every((k) => typeof M[k] === 'function') && Object.isFrozen(M) &&
    new RegExp("require\\('\\./" + m.file.replace('.', '\\.') + "'\\)").test(RM) && new RegExp('root\\.' + m.root + '\\b').test(RM) && !m.gone.test(RM) &&
    TG.split('/assets/js/' + m.file.replace('.js', '.min.js') + '?v=').length === 2 && atJ('mirror-policy.min.js') < atJ(m.file.replace('.js', '.min.js')) && atJ(m.file.replace('.js', '.min.js')) < atJ('report-mirror.min.js') && fs.existsSync(path.join(JS, m.file.replace('.js', '.min.js'))) &&
    !/\beval\s*\(|new Function|\bimport\s*\(|\bfetch\(|document\.|window\.(?!DA)/.test(s) && lines(s) < 600,
  () => `M${i + 1} ${m.file}: must exist with its interface at its top, hand out ${m.has.join(', ')} frozen, be required by report-mirror.js (and read as root.${m.root} in the browser), hold its functions alone (no copy left in report-mirror.js), be loaded once by the theme generator after mirror-policy and before report-mirror, do no IO and stay under 600 lines (${lines(s)})`);
});
const moved = MODS.filter((m) => SRC(m.file) != null).length;
if (moved) chk(() => lines(RM) < (moved === 3 ? 600 : 885) && /require\('\.\/mirror-policy\.js'\)/.test(RM), () => `M4 report-mirror.js must shrink (${lines(RM)} lines; under 600 once all three moved) and keep reading mirror-policy.js`);
if (moved === 3) {
  // the one home: each shared PBIR writer defined once at the top level (mirror-charts.js), the others read it
  chk(() => { const defs = ['report-mirror.js', 'mirror-charts.js', 'mirror-text.js', 'mirror-units.js'].map((f) => SRC(f)).map((s) => (s.match(/^  const (mk|str|clone|plainEntry|listIn|sameField) = \(/gm) || []).length);
    return defs[1] === 6 && defs[0] === 0 && defs[2] === 0 && defs[3] === 0; }, () => 'M5 mk, str, clone, plainEntry, listIn and sameField must be defined once, in mirror-charts.js');
  // the orchestration order in mirrorVisual: charts (donut, waterfall, axes) before pills, tables, matrix, cards, text, padding, titles
  chk(() => { const body = RM.slice(RM.indexOf('function mirrorVisual('), RM.indexOf('function mirrorVisual(') + 12000); const at = (re) => body.search(re);
    const seq = [/Charts\.chartsOf\(/, /P\.oneRowButtons\(/, /kind === 'table' \|\| kind === 'matrixAsTable'/, /Charts\.matrixRtl\(/, /kind === 'newCard'/, /kind === 'textbox'/, /kind === 'button'/, /entries\(v\.visualContainerObjects, 'padding'\)/, /P\.titled\(kind\)/].map(at);
    return seq.every((x) => x > 0) && seq.every((x, k) => k === 0 || x > seq[k - 1]); }, () => 'M6 mirrorVisual must keep its order: the charts, the pills, the tables, the matrix, the new cards, the text, the padding, the titles');
}

if (record) { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); console.log(`  (recorded ${rows.length} visuals and ${pages.length} pages)`); }
if (problems.length) { console.log(`FAIL script=test-0.3.2-sp39.mjs cause=${problems.length} of ${checks} checks`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp39  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp39  ${checks} checks`);
