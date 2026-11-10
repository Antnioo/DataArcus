import './test-env.mjs';
// 0.3.2 SP10 (the split: B-280, B-286; mcp/work/SP10.md). A characterisation suite: the Arabic twin's named rules (which
// family a visual is, which category axis is time, which content keeps left to right inside its mirrored box) give
// exactly the answers they gave on the base (integration/0.3.2 at e3f0123, before they moved from
// assets/js/report-mirror.js to assets/js/mirror-policy.js). Recorded on the base in fixtures/sp10-policy.json: on the
// base isTime is not exported, so report-mirror.js's own source runs in a vm with one added line that hands it out;
// once mirror-policy.js exists the suite reads DAMirrorPolicy. SP10_RECORD=1 records again (only on the base, never to
// make a run pass).
// The corpus: every visual of every twin and report fixture (twin-project, health-project, hm1, hm2, twin-fuzz) and 30
// made-up visuals (a date hierarchy, a FiscalYear column, a StartOfMonth date column, an Arabic month, a weekday
// heatmap, waterfalls by month, fiscal year and category, a flat matrix, button slicers on one row and on three, new
// cards across and down, a custom visual...).
//   V1-Vn  each visual: its kind (kindOf), its category's time answer (isTime with and without the date tables), and
//          mirrorVisual's kind, changes and output (sha) under six option sets, as recorded
//   G1-Gn  each page: mirrorPage's output (sha), kinds and units under the twin's options, as recorded
//   C1     the corpus: at least 60 visuals, every kind the brief names among them
//   P1-P10 (after the move) the policy's predicates give the recorded answers; it is pure, frozen and the one home of
//          its rules; the theme generator loads it before report-mirror.min.js
//   node test-0.3.2-sp10.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { pureSharedFiles, asSibling } from './ledger-places.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..'), JS = path.join(REPO, 'assets/js'), FIX = path.join(HERE, 'fixtures');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (s) => crypto.createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex').slice(0, 24) + ':' + Buffer.byteLength(s, 'utf8');
const GOLD = path.join(FIX, 'sp10-policy.json');
const record = process.env.SP10_RECORD === '1';
const moved = fs.existsSync(path.join(JS, 'mirror-policy.js'));
const Mirror = require('../assets/js/report-mirror.js');
const P = moved ? require('../assets/js/mirror-policy.js') : null;

// isTime(field, dateTables): the policy's, or (on the base) report-mirror.js's own, handed out by one added line
const isTime = moved ? P.isTime : (() => {
  const src = fs.readFileSync(path.join(JS, 'report-mirror.js'), 'utf8');
  if (src.split('const api = {').length !== 2) throw new Error('report-mirror.js\'s api line is not where the base had it');
  const m = { exports: {} }, req = createRequire(path.join(JS, 'report-mirror.js'));
  vm.runInThisContext('(function (module, exports, require) {' + src.replace('const api = {', 'const api = { __isTime: isTime,') + '\n})', { filename: 'report-mirror.js (base, isTime handed out)' })(m, m.exports, req);
  return m.exports.__isTime;
})();

// ---------- the corpus ----------
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const pages = [];
// the PBIR fixtures: each page's visuals in their folder's order (sorted, so every system reads them alike)
['twin-project', 'health-project'].forEach((d) => {
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)).forEach((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name === 'pages') fs.readdirSync(p, { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => x.name).sort().forEach((pid) => {
      const pdir = path.join(p, pid), vdir = path.join(pdir, 'visuals'), page = rd(path.join(pdir, 'page.json'));
      const visuals = fs.existsSync(vdir) ? fs.readdirSync(vdir).sort().filter((n) => fs.existsSync(path.join(vdir, n, 'visual.json'))).map((n) => rd(path.join(vdir, n, 'visual.json'))) : [];
      pages.push({ id: d + '/' + pid, page: { width: page.width, height: page.height }, visuals });
    });
    else if (e.isDirectory()) walk(p);
  });
  walk(path.join(FIX, d));
});
['hm1', 'hm2', 'twin-fuzz'].forEach((d) => fs.readdirSync(path.join(FIX, d)).sort().forEach((f) => rd(path.join(FIX, d, f)).pages.forEach((pg, i) => pages.push({ id: d + '/' + f + '#' + i, page: { width: pg.width, height: pg.height }, visuals: pg.visuals }))));

// made-up visuals (no employer data): the shapes the brief names that the fixtures do not hold
const L = (v) => ({ expr: { Literal: { Value: v } } });
const col = (t, c) => ({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c });
const mea = (t, m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m });
const lvl = (t, h, l) => ({ field: { HierarchyLevel: { Expression: { Hierarchy: { Expression: { SourceRef: { Entity: t } }, Hierarchy: h } }, Level: l } }, queryRef: t + '.' + h + '.' + l, nativeQueryRef: l });
const S_VIS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
let at = 0;
const vc = (name, w, h, visual, extra) => { const x = (at * 37) % 900, y = Math.floor(at / 4) * 60; at++; return Object.assign({ $schema: S_VIS, name, position: { x, y, z: 1000 + at, width: w, height: h }, visual }, extra || {}); };
const T = 'Orders', D = 'Dim Date', CAL = 'Calendar';
const sortBy = (p, dir) => ({ sort: [{ field: JSON.parse(JSON.stringify(p.field)), direction: dir }] });
const MADE = [
  vc('mDateHier', 400, 200, { visualType: 'clusteredColumnChart', query: { queryState: { Category: { projections: [lvl(D, 'Date Hierarchy', 'Year'), lvl(D, 'Date Hierarchy', 'Month')] }, Y: { projections: [mea(T, 'Sales')] } } } }),
  vc('mDateHierLine', 400, 200, { visualType: 'lineChart', query: { queryState: { Category: { projections: [lvl(D, 'Date Hierarchy', 'Year'), lvl(D, 'Date Hierarchy', 'Quarter'), lvl(D, 'Date Hierarchy', 'Month')] }, Y: { projections: [mea(T, 'Sales')] } }, sortDefinition: sortBy(lvl(D, 'Date Hierarchy', 'Year'), 'Ascending') } }),
  vc('mFiscalYear', 400, 200, { visualType: 'lineChart', query: { queryState: { Category: { projections: [col(T, 'FiscalYear')] }, Y: { projections: [mea(T, 'Sales')] } } } }),
  vc('mFiscalYearDim', 400, 200, { visualType: 'columnChart', query: { queryState: { Category: { projections: [col(D, 'FiscalYear')] }, Y: { projections: [mea(T, 'Sales')] }, Series: { projections: [col(T, 'Region')] } } }, objects: { legend: [{ properties: { position: L("'Top'") } }] } }),
  vc('mStartOfMonth', 400, 200, { visualType: 'areaChart', query: { queryState: { Category: { projections: [col(CAL, 'StartOfMonth')] }, Y: { projections: [mea(T, 'Sales')] } } } }),
  vc('mOrderDateCat', 400, 200, { visualType: 'lineChart', query: { queryState: { Category: { projections: [col(CAL, 'Order Date')] }, Y: { projections: [mea(T, 'Sales')] } } }, objects: { categoryAxis: [{ properties: { axisType: L("'Categorical'") } }] } }),
  vc('mMonthName', 400, 200, { visualType: 'clusteredColumnChart', query: { queryState: { Category: { projections: [col(CAL, 'Month Name')] }, Y: { projections: [mea(T, 'Sales')] } }, sortDefinition: sortBy(col(CAL, 'Month Name'), 'Ascending') } }),
  vc('mArabicMonth', 400, 200, { visualType: 'lineChart', query: { queryState: { Category: { projections: [col(T, 'الشهر')] }, Y: { projections: [mea(T, 'Sales')] } } } }),
  vc('mHolidayPackage', 400, 200, { visualType: 'clusteredColumnChart', query: { queryState: { Category: { projections: [col(T, 'Holiday Package')] }, Y: { projections: [mea(T, 'Sales')] } }, sortDefinition: sortBy(mea(T, 'Sales'), 'Descending') } }),
  vc('mBarLegend', 400, 200, { visualType: 'clusteredBarChart', query: { queryState: { Category: { projections: [col(T, 'Region')] }, Y: { projections: [mea(T, 'Sales')] }, Legend: { projections: [col(T, 'Segment')] } } } }),
  vc('mBarHiddenAxis', 300, 200, { visualType: 'barChart', query: { queryState: { Category: { projections: [col(T, 'Region')] }, Y: { projections: [mea(T, 'Sales')] } } }, objects: { categoryAxis: [{ properties: { show: L('false') } }] } }),
  vc('mComboMonth', 400, 200, { visualType: 'lineClusteredColumnComboChart', query: { queryState: { Category: { projections: [col(D, 'Month')] }, Y: { projections: [mea(T, 'Sales')] }, Y2: { projections: [mea(T, 'Margin')] } } } }),
  vc('mWaterfallMonth', 400, 200, { visualType: 'waterfallChart', query: { queryState: { Category: { projections: [col(D, 'Month')] }, Y: { projections: [mea(T, 'Change')] } } }, objects: { sentimentColors: [{ properties: { increaseFill: { solid: { color: L("'#2E7D32'") } } } }] } }),
  vc('mWaterfallFiscal', 400, 200, { visualType: 'waterfallChart', query: { queryState: { Category: { projections: [col(T, 'FiscalYear')] }, Y: { projections: [mea(T, 'Change')] } } } }),
  vc('mWaterfallDate', 400, 200, { visualType: 'waterfallChart', query: { queryState: { Category: { projections: [col(CAL, 'StartOfMonth')] }, Y: { projections: [mea(T, 'Change')] } } } }),
  vc('mWaterfallCat', 400, 200, { visualType: 'waterfallChart', query: { queryState: { Category: { projections: [col(T, 'Region')] }, Y: { projections: [mea(T, 'Change')] }, Breakdown: { projections: [col(T, 'Segment')] } } } }),
  vc('mTable1', 200, 200, { visualType: 'tableEx', query: { queryState: { Values: { projections: [col(T, 'Region')] } } } }),
  vc('mTable3', 500, 200, { visualType: 'tableEx', query: { queryState: { Values: { projections: [col(T, 'Region'), mea(T, 'Sales'), col(T, 'Segment')] } } }, objects: { values: [{ properties: { icon: { layout: L("'After'") } } }] } }),
  vc('mMatrixFlat', 400, 200, { visualType: 'pivotTable', query: { queryState: { Rows: { projections: [col(T, 'Patient Id')] }, Values: { projections: [mea(T, 'Visits'), mea(T, 'Cost')] } } } }),
  vc('mHeatmap', 600, 260, { visualType: 'pivotTable', query: { queryState: { Rows: { projections: [col(D, 'Weekday')] }, Columns: { projections: [col(D, 'Hour')] }, Values: { projections: [mea(T, 'Calls')] } } }, objects: { rowHeaders: [{ properties: { fontSize: L('9D') } }] } }),
  vc('mCard', 200, 100, { visualType: 'card', query: { queryState: { Values: { projections: [mea(T, 'Sales')] } } } }),
  vc('mKpi', 200, 100, { visualType: 'kpi', query: { queryState: { Indicator: { projections: [mea(T, 'Sales')] }, TrendLine: { projections: [col(D, 'Month')] } } } }),
  vc('mNewCardAcross', 600, 120, { visualType: 'cardVisual', query: { queryState: { Data: { projections: [mea(T, 'Sales'), mea(T, 'Margin'), mea(T, 'Orders')] } } }, objects: { padding: [{ properties: { leftMargin: L('12D') } }] } }),
  vc('mNewCardDown', 200, 300, { visualType: 'cardVisual', query: { queryState: { Data: { projections: [mea(T, 'Open'), mea(T, 'Closed')] } } }, objects: { layout: [{ properties: { orientation: L("'1D'") } }] } }),
  vc('mPillsOneRow', 900, 50, { visualType: 'advancedSlicerVisual', query: { queryState: { Values: { projections: [col(D, 'Month')] } } }, objects: { layout: [{ properties: { rowCount: L('1L') } }] } }),
  vc('mPillsGrid', 300, 150, { visualType: 'advancedSlicerVisual', query: { queryState: { Values: { projections: [col(D, 'Month')] } } }, objects: { layout: [{ properties: { rowCount: L('3L') } }] } }),
  vc('mSlicerList', 200, 300, { visualType: 'slicer', query: { queryState: { Values: { projections: [col(T, 'Region')] } } } }),
  vc('mDonutLegend', 300, 300, { visualType: 'donutChart', query: { queryState: { Y: { projections: [mea(T, 'Answered'), mea(T, 'Unanswered')] } } }, objects: { legend: [{ properties: { show: L('true') } }] } }),
  vc('mScatter', 400, 300, { visualType: 'scatterChart', query: { queryState: { Category: { projections: [col(T, 'Region')] }, X: { projections: [mea(T, 'Sales')] }, Y: { projections: [mea(T, 'Margin')] } } } }),
  vc('mCustom', 300, 200, { visualType: 'madeUpChart0123456789ABCDEF0123456789AB', query: { queryState: { Category: { projections: [col(D, 'Date')] } } } }),
  vc('mNoType', 200, 100, {}),
  vc('mUnreadable', 200, 100, 'not an object'),
  vc('mNewCardDown1D', 200, 300, { visualType: 'cardVisual', query: { queryState: { Data: { projections: [mea(T, 'Open'), mea(T, 'Closed'), mea(T, 'Late')] } } }, objects: { layout: [{ properties: { orientation: L('1D'), rowCount: L('3L') } }] } }),
  vc('mYearCol', 400, 200, { visualType: 'clusteredColumnChart', query: { queryState: { Category: { projections: [col(T, 'Year')] }, Y: { projections: [mea(T, 'Sales')] } } } }),
  vc('mPillsLow', 900, 50, { visualType: 'advancedSlicerVisual', query: { queryState: { Values: { projections: [col(T, 'Region')] } } }, objects: { layout: [{ properties: { cellPadding: L('4L') } }] } }),
  vc('mPillsTall', 900, 120, { visualType: 'advancedSlicerVisual', query: { queryState: { Values: { projections: [col(T, 'Region')] } } }, objects: { layout: [{ properties: { cellPadding: L('4L') } }] } })
];
pages.push({ id: 'made-up', page: { width: 1280, height: 720 }, visuals: MADE });

// the model's facts the twin passes (made up): its date tables, its date columns, its text columns
const DT = [D, CAL], DC = [CAL + '.Order Date', CAL + '.StartOfMonth', D + '.Date'], TC = [CAL + '.Month Name', D + '.Month', T + '.Region', T + '.Segment', T + '.Holiday Package'];
const RUNS = {
  A: {},
  B: { timeRightToLeft: false, dateTables: DT },
  C: { dateTables: DT, dateColumns: DC, textColumns: TC },
  D: { waterfallRtl: 'mirror', dateTables: DT, dateColumns: DC },
  E: { waterfallRtl: 'mirror', timeRightToLeft: false, dateTables: DT },
  K: { keepDirection: true }
};
const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const cat0 = (v) => { const qs = isObj(v) && isObj(v.visual) && isObj(v.visual.query) && isObj(v.visual.query.queryState) ? v.visual.query.queryState : null; const ps = qs && isObj(qs.Category) && Array.isArray(qs.Category.projections) ? qs.Category.projections : null; return ps && isObj(ps[0]) ? ps[0] : null; };
const widthIn = (pg, v) => { const g = isObj(v) && v.parentGroupName != null ? pg.visuals.find((x) => isObj(x) && String(x.name) === String(v.parentGroupName)) : null; return g && isObj(g.position) ? g.position.width : pg.page.width; };
const rows = [];
pages.forEach((pg) => pg.visuals.forEach((v, i) => rows.push({ id: pg.id + '/' + (isObj(v) && v.name != null ? v.name : '#' + i), v, W: widthIn(pg, v) })));

const answerOf = (r) => {
  const c = cat0(r.v), runs = {};
  Object.keys(RUNS).forEach((k) => { const m = Mirror.mirrorVisual(r.v, r.W, RUNS[k]); runs[k] = { kind: m.kind, changes: m.changes, sha: sha(JSON.stringify(m)) }; });
  return { kind: Mirror.kindOf(r.v), time: c ? { dt: !!isTime(c.field, DT), none: !!isTime(c.field, []) } : null, runs };
};
const pageOf = (pg) => { const m = Mirror.mirrorPage(pg.page, pg.visuals, RUNS.C); return { sha: sha(JSON.stringify(m.visuals)), kinds: m.kinds, units: m.units }; };
const got = { about: 'SP10: the twin\'s policy answers (kind, time axis, mirrorVisual under six option sets, mirrorPage) recorded on integration/0.3.2 at e3f0123, before the move to mirror-policy.js', visuals: {}, pages: {} };
rows.forEach((r) => { got.visuals[r.id] = answerOf(r); });
pages.forEach((pg) => { got.pages[pg.id] = pageOf(pg); });
const gold = record ? got : rd(GOLD);
// (0.3.2 DD1A, the owner D-1104-15: one time test for the twin, the preview, the writer and the check, time-names.js
// isTimeName.) The recorded file stays as recorded; the answers DD1A moved are written here, each one, and nothing else
// may differ: FiscalYear and StartOfMonth are time by their words now (Fiscal Year, Start Of Month), with or without the
// date tables. Two outputs follow: with time kept left to right (runs B and E) the FiscalYear line is no longer sorted
// and the FiscalYear waterfall is kept as a time waterfall. Those runs' output (sha) is not pinned here; their kind and
// changes are.
const DD1A = {
  // (0.3.2 PF1, B-380: a chart over time kept left to right is said "columnTime"; its output is the same)
  'made-up/mFiscalYear': { time: { dt: true, none: true }, runs: { B: { kind: 'columnTime', changes: ['position', 'value axis', 'title'] }, E: { kind: 'columnTime', changes: ['position', 'value axis', 'title'] } } },
  'made-up/mFiscalYearDim': { time: { dt: true, none: true } },
  'made-up/mStartOfMonth': { time: { dt: true, none: true } },
  'made-up/mWaterfallFiscal': { time: { dt: true, none: true }, runs: { E: { kind: 'waterfallTime', changes: ['position', 'value axis'] } } },
  'made-up/mWaterfallDate': { time: { dt: true, none: true } }
};
if (!record && moved) for (const [id, d] of Object.entries(DD1A)) {
  const g = gold.visuals[id]; if (!g) continue;
  g.time = d.time;
  for (const [k, r] of Object.entries(d.runs || {})) g.runs[k] = { kind: r.kind, changes: r.changes, sha: ((got.visuals[id] || { runs: {} }).runs[k] || {}).sha };
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// V: each visual as recorded
rows.forEach((r, i) => chk(() => gold.visuals[r.id] && same(got.visuals[r.id], gold.visuals[r.id]),
  () => `V${i + 1} ${r.id}: ${JSON.stringify(got.visuals[r.id]).slice(0, 300)} is not the base's ${JSON.stringify(gold.visuals[r.id]).slice(0, 300)}`));
// G: each page as recorded
pages.forEach((pg, i) => chk(() => gold.pages[pg.id] && same(got.pages[pg.id], gold.pages[pg.id]), () => `G${i + 1} ${pg.id}: mirrorPage is not the base's`));
// C1: the corpus
const kinds = new Set(rows.map((r) => got.visuals[r.id].kind)), types = new Set(rows.map((r) => (isObj(r.v) && isObj(r.v.visual) ? r.v.visual.visualType : null)));
chk(() => rows.length >= 60 && Object.keys(gold.visuals).length === rows.length && ['column', 'bar', 'waterfall', 'table', 'matrix', 'newCard', 'slicer', 'plain', 'custom', 'group', 'textbox', 'button', 'navigator', 'other', 'unreadable'].every((k) => kinds.has(k)) &&
  ['card', 'slicer', 'pivotTable', 'tableEx', 'waterfallChart'].every((t) => types.has(t)) && rows.some((r) => isObj(cat0(r.v)) && isObj(cat0(r.v).field.HierarchyLevel)) && rows.some((r) => isObj(cat0(r.v)) && isObj(cat0(r.v).field.Column) && cat0(r.v).field.Column.Property === 'FiscalYear') &&
  rows.some((r) => got.visuals[r.id].runs.A.kind === 'pills') && rows.some((r) => got.visuals[r.id].runs.D.kind === 'waterfall'),
() => `C1 the corpus must hold at least 60 visuals (${rows.length}), the recorded ones (${Object.keys(gold.visuals).length}), every kind (${[...kinds].join(', ')}), a date hierarchy, a FiscalYear column, a heatmap, a waterfall, a card, a slicer and a custom visual`);

// P: after the move, the policy's predicates
if (moved) {
  const ofKind = (k) => rows.filter((r) => gold.visuals[r.id].kind === k);
  const bad = (list, f) => list.filter((r) => { try { return !f(r); } catch (e) { return true; } }).map((r) => r.id);
  let b;
  // P1: kindOf, the one function (report-mirror.js hands out the policy's)
  chk(() => !(b = bad(rows, (r) => P.kindOf(r.v) === gold.visuals[r.id].kind)).length && Mirror.kindOf === P.kindOf && Mirror.isCustom === P.isCustom, () => `P1 the policy's kindOf must give the recorded kind and be report-mirror.js's: ${b.join(', ')}`);
  // P2: the category's time answer (categoryIsTime: the first Category field, isTime)
  chk(() => !(b = bad(rows, (r) => { const t = gold.visuals[r.id].time, v = isObj(r.v) ? r.v.visual : null; return t ? P.categoryIsTime(v, DT) === t.dt && P.categoryIsTime(v, []) === t.none : !P.categoryIsTime(v, DT); })).length,
    () => `P2 categoryIsTime must give the recorded time answer: ${b.join(', ')}`);
  // P3: a continuous time axis inverted (invertsTimeAxis) exactly where the twin's run C wrote 'time axis'
  chk(() => { const cols = ofKind('column'); b = bad(cols, (r) => P.invertsTimeAxis(r.v.visual, RUNS.C) === gold.visuals[r.id].runs.C.changes.includes('time axis') && !P.invertsTimeAxis(r.v.visual, RUNS.B)); return cols.length >= 10 && cols.some((r) => gold.visuals[r.id].runs.C.changes.includes('time axis')) && !b.length; },
    () => `P3 invertsTimeAxis must answer as the recorded runs C (true) and B (time kept left to right: false): ${b.join(', ')}`);
  // P4: a kind that moves only (movesOnly) changed nothing but its place and shadow in every run
  chk(() => { const only = rows.filter((r) => P.movesOnly(gold.visuals[r.id].kind)); b = bad(only, (r) => Object.values(gold.visuals[r.id].runs).every((x) => x.changes.every((c) => c === 'position' || c === 'shadow')));
    return only.length >= 8 && !b.length && ['custom', 'group', 'unreadable'].every((k) => P.movesOnly(k)) && !['column', 'bar', 'table', 'matrix', 'newCard', 'textbox', 'button', 'slicer', 'plain', 'other', 'navigator'].some((k) => P.movesOnly(k)); },
  () => `P4 movesOnly must hold for custom, group and unreadable only, and they changed only place and shadow: ${b.join(', ')}`);
  // P5: a waterfall's way (waterfallKind): native kept, time kept left to right, else the right-to-left chart
  chk(() => { const wf = ofKind('waterfall'); b = bad(wf, (r) => { const g = gold.visuals[r.id].runs, v = r.v.visual;
    return P.waterfallKind(v, { mode: 'native' }) === 'waterfallNative' && g.A.kind === 'waterfallNative' &&
      P.waterfallKind(v, { mode: 'mirror', dateTables: DT }) === 'waterfall' && ['waterfall', 'waterfallKept'].includes(g.D.kind) &&
      (P.waterfallKind(v, { mode: 'mirror', timeRightToLeft: false, dateTables: DT }) === 'waterfallTime') === (g.E.kind === 'waterfallTime'); });
  return wf.length >= 3 && !b.length && wf.some((r) => gold.visuals[r.id].runs.E.kind === 'waterfallTime') && wf.some((r) => gold.visuals[r.id].runs.E.kind !== 'waterfallTime'); },
  () => `P5 waterfallKind must answer as the recorded runs A, D and E: ${b.join(', ')}`);
  // P6: button slicers on one row read from the right (oneRowButtons), exactly where the twin wrote 'pills'
  chk(() => { const sl = ofKind('slicer'); b = bad(sl, (r) => P.oneRowButtons(r.v.visual, r.v.position && r.v.position.height) === (gold.visuals[r.id].runs.A.kind === 'pills')); return sl.length >= 4 && !b.length; },
    () => `P6 oneRowButtons must answer as the recorded pills: ${b.join(', ')}`);
  // P7: a new card's values down (verticalValues) keep their order; across, reversed (the recorded output differs)
  chk(() => { const nc = ofKind('newCard'); b = bad(nc, (r) => typeof P.verticalValues(r.v.visual) === 'boolean'); return nc.some((r) => P.verticalValues(r.v.visual)) && nc.some((r) => !P.verticalValues(r.v.visual)) && !b.length; },
    () => `P7 verticalValues must tell a card's values down from across: ${b.join(', ')}`);
  // P8: the grids that keep left to right inside (keepsGridLtr: B-284's home) and the kinds that get a right title
  chk(() => !(b = bad(rows, (r) => P.keepsGridLtr(r.v) === ['table', 'matrix'].includes(gold.visuals[r.id].kind))).length &&
    ['column', 'bar', 'table', 'matrix', 'matrixAsTable', 'newCard'].every((k) => P.titled(k)) && !['plain', 'slicer', 'textbox', 'button', 'custom', 'waterfallNative'].some((k) => P.titled(k)),
  () => `P8 keepsGridLtr must hold for tables and matrices only, titled for the charts, tables, matrices and new cards: ${b.join(', ')}`);
  // P9: pure (no input changed) and frozen
  chk(() => { b = bad(rows, (r) => { const before = JSON.stringify(r.v), v = isObj(r.v) ? r.v.visual : null; P.kindOf(r.v); P.categoryIsTime(v, DT); P.invertsTimeAxis(v, RUNS.C); P.oneRowButtons(v, 40); P.verticalValues(v); P.keepsGridLtr(r.v); P.waterfallKind(v, { mode: 'mirror', timeRightToLeft: false, dateTables: DT }); return JSON.stringify(r.v) === before; });
    return !b.length && Object.isFrozen(P) && Object.isFrozen(P.COLUMN) && Object.isFrozen(P.BAR) && Object.isFrozen(P.SIDELESS) && Object.isFrozen(P.MOVES_ONLY); },
  () => `P9 the predicates must change no visual and the api and its tables be frozen: ${b.join(', ')}`);
  // P10: the one home of each rule, and the load order. mirror-policy.js requires visual-types.js and, besides it, only
  // the pure shared files (a list, never a number; 0.3.2 DD1A: the reviewer's call): pbir-values.js, time-names.js
  // (0.3.3 SG2: and any pure shared file the CONTRACTS.md ledger names as a one place, read by ledger-places.mjs)
  const PURE_SHARED = ["'./visual-types.js'", "'./pbir-values.js'", "'./time-names.js'", ...[...pureSharedFiles()].map((f) => `'${asSibling(f)}'`)];
  chk(() => {
    const m = fs.readFileSync(path.join(JS, 'report-mirror.js'), 'utf8'), p = fs.readFileSync(path.join(JS, 'mirror-policy.js'), 'utf8'), tg = fs.readFileSync(path.join(JS, 'theme-generator.js'), 'utf8');
    const reqs = (p.match(/require\(([^)]*)\)/g) || []).map((x) => x.slice(8, -1));
    const atJ = (f) => tg.indexOf('/assets/js/' + f + '?v='), n = tg.split('/assets/js/mirror-policy.min.js?v=').length - 1;
    return /require\('\.\/mirror-policy\.js'\)/.test(m) && /root\.DAMirrorPolicy/.test(m) && !/const (COLUMN|BAR|WATERFALL|SLICER|SIDELESS|TIME_NAME|DATE_LIKE|ONE_ROW_H) =|function (kindOf|isTime)\(/.test(m) &&
      reqs.includes("'./visual-types.js'") && reqs.every((r) => PURE_SHARED.includes(r)) && !/\beval\s*\(|new Function|\bimport\s*\(|Gallery\(\)/.test(p) &&
      n === 1 && atJ('visual-types.min.js') > 0 && atJ('visual-types.min.js') < atJ('mirror-policy.min.js') && atJ('mirror-policy.min.js') < atJ('report-mirror.min.js') && fs.existsSync(path.join(JS, 'mirror-policy.min.js'));
  }, () => 'P10 the families, the time names and the content rules must live in mirror-policy.js only (it requires visual-types.js and only the pure shared files pbir-values.js and time-names.js), report-mirror.js read them, and the theme generator load mirror-policy.min.js once, after visual-types and before report-mirror');
}

if (record) { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); console.log(`  (recorded ${rows.length} visuals and ${pages.length} pages)`); }
if (problems.length) { console.log(`FAIL script=test-0.3.2-sp10.mjs cause=${problems.length} of ${checks} checks`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp10  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp10  ${checks} checks`);
