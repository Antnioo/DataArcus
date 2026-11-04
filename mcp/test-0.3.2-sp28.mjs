import './fixtures/sp1/seeded-random.mjs';
import './test-env.mjs';
// 0.3.2 SP28 (the split, finish: B-280, B-286; mcp/work/SP28.md). A characterisation suite for the visuals of a report
// page: for 14 made-up reports built straight with the shared writer (pbip-export.js build, as the website and the MCP
// call it), every file it writes and its whole result (the notes, without the files and the ZIP) are byte for byte the
// ones recorded on the base (integration/0.3.2, before pbip-page.js's visual builders moved to assets/js/pbip-visuals*.js).
// The writer's random ids come from one fixed seed (fixtures/sp1/seeded-random.mjs, SP1's), loaded first in this process,
// so the names come out in the same sequence or the records differ. Recorded in fixtures/sp28-builds.json; SP28_RECORD=1
// records them again (only on the base, never to make a run pass). Made-up models only.
//   B1-B14  each build's files and result;  C1  the builds cover every visual family and the high-risk paths (kind changes,
//   the Top N title measure, renamed twin titles, the tables' row labels and pictures, "No data", pills, the mirror, the
//   gallery, the phone layout)
//   after the move: M1  pbip-page.js assembles over pbip-visuals.js (which names no visual and writes no file);
//   M2  theme-generator.js's BUILDER loads the new files once, before pbip-tooltip
//   node test-0.3.2-sp28.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'sp28-builds.json');
const Px = require('../assets/js/pbip-export.js'), E = require('../assets/js/design-engine.js');

// a report on a made-up model, the way the MCP and the website call the writer (test-0.2.9w.mjs's way): a designed page
// (the design engine's layout) or hand-placed slots
const build = (bind, o = {}) => {
  const lang = o.lang || 'en', d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma';
  d.layout = Object.assign({}, d.layout, o.layout || {}); E.repairState(d);
  const specs = o.pages ? null : E.projectPages(d.layout, lang, { second: !!o.second, panel: !!o.panel });
  const pages = o.pages || specs.map((sp) => ({ name: sp.name, page: sp.page, slots: sp.slots, panel: sp.panel, png: new Uint8Array([1, 2]), grow: true }));
  const extra = Object.assign({}, o); ['lang', 'layout', 'pages', 'second', 'panel'].forEach((k) => delete extra[k]);
  return Px.build(Object.assign({ name: 'SP28', title: 'SP28 report', pageName: pages[0].name, lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: E.buildTheme(d, lang),
    sample: false, model: { byPath: 'M.SemanticModel' }, bind, texts: E.REPORT_TEXTS[lang], pages }, extra));
};
const hand = (w, h, slots, name) => ({ name: name || 'Hand', page: { w, h }, slots, panel: null, hand: true, png: new Uint8Array([3]) });
const T = 'Sales', M = (m, x) => Object.assign({ t: T, m }, x || {}), C = (c, x, t) => Object.assign({ t: t || T, c }, x || {});
// the made-up model's fields: measures (a whole number, a percent, one in kg), a month label with its date, days, a
// quarter, a two-valued flag, a many-valued name, Arabic names
const MONTH = C('Month Name', { sortBy: { t: 'Calendar', c: 'Month Number' } }, 'Calendar');
const base = (x) => Object.assign({
  kpis: [M('Total Sales', { wholeFormat: '#,0' }), M('Orders', { wholeFormat: '#,0' }), M('Margin %', { pct: true, pctFormat: '0.0%' }), M('Avg Price')],
  measure: M('Total Sales'), date: MONTH,
  cats: { bar: C('City'), column: C('Channel'), donut: C('Segment'), funnel: C('Stage'), treemap: C('Product'), map: C('City') }, y: { funnel: M('Orders'), gauge: M('Margin %', { pct: true, pctFormat: '0.0%' }) },
  catPool: [C('City'), C('Channel'), C('Segment'), C('Product')],
  table: [C('City'), M('Total Sales', { tableFormat: '#,0' }), M('Orders'), M('Margin %')], slicers: [C('City'), C('Channel'), C('Segment')],
  tip: { card: M('Total Sales', { wholeFormat: '#,0' }), cat: C('Segment'), y: M('Orders'), date: MONTH }
}, x || {});
const AR_B = (x) => base(Object.assign({ kpis: [M('إجمالي المبيعات', { wholeFormat: '#,0' }), M('الطلبات'), M('الهامش', { pct: true, pctFormat: '0%' })], measure: M('إجمالي المبيعات'),
  cats: { bar: C('المدينة'), column: C('القناة'), donut: C('الشريحة'), funnel: C('المرحلة'), treemap: C('المنتج'), map: C('المدينة') }, catPool: [C('المدينة'), C('القناة'), C('المنتج')],
  table: [C('المدينة'), M('إجمالي المبيعات'), M('الطلبات')], slicers: [C('المدينة'), C('القناة'), null], tip: { card: M('إجمالي المبيعات'), cat: C('القناة'), y: M('الطلبات'), date: null }, date: C('الشهر', { dateOf: { t: 'Calendar', c: 'Date' } }) }, x || {}));
const S = (kind, x, y, w, h, more) => Object.assign({ kind, x, y, w, h }, more || {});
const head = (w, rtl) => [S('title', rtl ? w - 24 - 400 : 24, 12, 400, 56), S('logo', rtl ? 24 : w - 24 - 120, 12, 120, 56)];

const BUILDS = [
  ['B1 the sample download, EN, exec 1280 x 720, two pages', () => Px.build(Object.assign({ name: 'Sample EN', title: 'Sample EN', lang: 'en', rtl: false, sample: true }, (() => { const d = E.fresh(); d.layout = {}; E.repairState(d);
    const pages = E.projectPages(d.layout, 'en', { second: true, panel: false }).map((sp) => ({ name: sp.name, page: sp.page, slots: sp.slots, panel: sp.panel, png: new Uint8Array([1]), grow: true }));
    return { font: d.font, ui: d.ui, theme: E.buildTheme(d, 'en'), texts: E.REPORT_TEXTS.en, pageName: pages[0].name, pages }; })()))],
  ['B2 the sample download, AR, analysis 1920 x 1080, the rail, transparent', () => Px.build(Object.assign({ name: 'Sample AR', title: 'تقرير', lang: 'ar', rtl: true, sample: true }, (() => { const d = E.fresh(); d.font = 'Tahoma';
    d.layout = { preset: 'analysis', page: '1920x1080', filters: true, fpos: 'start', transparent: true }; E.repairState(d);
    const pages = E.projectPages(d.layout, 'ar', { second: false, panel: false }).map((sp) => ({ name: sp.name, page: sp.page, slots: sp.slots, panel: sp.panel, png: new Uint8Array([1]), grow: true }));
    return { font: d.font, ui: d.ui, theme: E.buildTheme(d, 'ar'), texts: E.REPORT_TEXTS.ar, pageName: pages[0].name, pages }; })()))],
  ['B3 EN own model, exec, gradient colours, quiet grid, "No data", two pages', () => build(base(), { second: true, chartColors: 'gradient', quietGrid: true })],
  ['B4 EN own model, analysis 1920 x 1080, filters on top, pills, dotted grid, straight lines', () => build(base({ slicers: [C('Segment', { two: true, texts: ['Retail', 'Corporate'] }), C('Quarter', { cal: { rows: 4, kind: 'quarter' } }, 'Calendar'), C('Channel', { few: 3, texts: ['Online', 'Store', 'Phone'] })] }),
    { layout: { preset: 'analysis', page: '1920x1080', filters: true, fpos: 'top' }, slicerStyle: 'pills', grid: 'dotted', smoothLines: false })],
  ['B5 AR own model, ops, mirrored axes, the slide-in panel, pills', () => build(AR_B({ slicers: [C('الشريحة', { two: true, texts: ['أفراد', 'شركات'] }), C('القناة'), null] }), { lang: 'ar', layout: { preset: 'ops', filters: true, fpos: 'end' }, panel: true, chartAxes: 'mirrored', slicerStyle: 'pills', second: true })],
  ['B6 EN hand-placed: every kind of visual, SVG cards and columns, subtitles, full values', () => build(base({ table: [C('Day Name'), M('Total Sales'), M('Orders')] }), { pages: [hand(1280, 720, head(1280).concat([
    S('kpi', 24, 80, 290, 96), S('kpi', 330, 80, 290, 96), S('kpi', 636, 80, 290, 96), S('card', 942, 80, 314, 96),
    S('table', 24, 190, 500, 240, { title: 'Daily table' }), S('matrix', 540, 190, 340, 160), S('gauge', 896, 190, 360, 160, { title: 'Margin gauge' }),
    S('funnel', 24, 446, 300, 250), S('treemap', 340, 446, 300, 250, { role: 'mix' }), S('map', 656, 446, 300, 250), S('text', 972, 370, 284, 326, { title: 'Notes', text: 'Sales rose in the north.' })]))],
    svgCards: [{ card: 0, t: T, m: 'Ring card', expression: '"<svg/>"', w: 64, h: 64 }], svgColumns: [{ page: 0, t: T, m: 'Bar pic', expression: '"<svg/>"', expressionNoNumber: '"<svg n/>"', w: 160, h: 24 }],
    subtitles: { mix: 'Products by sales', 'Margin gauge': 'Against the target' }, kpiValues: 'full', logoPlaceholder: false })],
  ['B7 EN hand-placed: column charts that change kind (days, many names, two values, a quarter, Day Short), Top N', () => build(base({
    cats: { bar: C('Product Name', { wide: true }), column: C('Day Name', { short: C('Day Short') }), donut: C('Segment'), funnel: C('Stage'), treemap: C('Product'), map: C('City') }, catPool: [C('Product Name', { wide: true }), C('Region'), C('Day Name')] }),
  { pages: [hand(1280, 720, head(1280).concat([S('column', 24, 80, 380, 300), S('column', 420, 80, 400, 300), S('bar', 836, 80, 420, 300), S('bar', 24, 396, 600, 300), S('column', 640, 396, 616, 300)]))] })],
  ['B8 EN hand-placed: a column chart by many names and by quarter, a two-valued bar, many fields in a narrow table', () => build(base({
    cats: { bar: C('Is Return', { two: true }), column: C('Fiscal Quarter'), donut: C('Segment'), funnel: C('Stage'), treemap: C('Product'), map: C('City') },
    table: [C('Customer Full Legal Name'), C('Region Description'), C('Product Category Long Name'), M('Total Sales Amount In Currency'), M('Orders Count Total'), M('Average Discount Percentage')] }),
  { pages: [hand(1280, 720, head(1280).concat([S('bar', 24, 80, 400, 300), S('column', 440, 80, 400, 300), S('table', 856, 80, 260, 300), S('column', 24, 396, 1232, 300, { topN: 5 })]))], noDataMessage: false })],
  ['B9 AR hand-placed: a right-to-left table with its row label, twin titles renamed, a matrix of months', () => build(AR_B({ table: [C('المدينة'), M('إجمالي المبيعات'), M('الطلبات')] }), { lang: 'ar', pages: [hand(1920, 1080, head(1920, true).concat([
    S('bar', 1236, 100, 660, 400), S('bar', 560, 100, 660, 400), S('table', 24, 100, 520, 400), S('table', 1236, 520, 660, 300), S('matrix', 24, 520, 520, 300), S('donut', 560, 520, 660, 300)]))],
    bind: AR_B({ table: [C('المدينة'), M('إجمالي المبيعات'), M('الطلبات')], cats: { bar: C('المدينة'), column: C('القناة'), donut: C('المدينة'), funnel: C('المرحلة'), treemap: C('المنتج'), map: C('المدينة') }, catPool: [C('المدينة')] }) })],
  ['B10 EN gallery: combo in two units, waterfall, small multiples, a mirrored-off AR twin of it next', () => build(base({ gallery: { combo: { columns: M('Return %', { pct: true, pctFormat: '0.0%' }), line: M('Margin %', { pct: true, pctFormat: '0.0%' }), axis: MONTH }, multiples: { split: C('Region') } },
    axes: { confirmed: [require('../assets/js/axis-units.js').record(M('Return %', { pct: true, pctFormat: '0.0%' }), M('Margin %', { pct: true, pctFormat: '0.0%' }), 'comparable', [])] } }), { gallery: true, pages: [hand(1280, 720, head(1280).concat([
    S('combo', 24, 80, 600, 300), S('waterfall', 640, 80, 616, 300), S('multiples', 24, 396, 1232, 300)]))] })],
  ['B11 AR gallery, mirrored: the waterfall drawn from the right, native waterfall, multiples', () => build(AR_B(), { lang: 'ar', gallery: true, chartAxes: 'mirrored', waterfallRtl: 'mirror', pages: [hand(1280, 720, head(1280, true).concat([
    S('waterfall', 24, 80, 600, 300), S('combo', 640, 80, 616, 300), S('multiples', 24, 396, 600, 300), S('line', 640, 396, 616, 300)]))] })],
  ['B12 EN small cards: blank text kept, a percent card, a control character, no phone layout, grid none', () => build(base({ kpis: [M('Total Sales Last Ramadan Period Including Returns'), M('Orders', { unitAuto: true }), M('Bad\u0007Name')], measure: M('Bad\u0007Name'),
    cats: { bar: C('City'), column: C('Month Name'), donut: C('Segment'), funnel: C('Stage'), treemap: C('Product'), map: C('City') }, table: [MONTH, M('Total Sales'), M('Orders')] }),
    { pages: [hand(1280, 720, head(1280).concat([S('kpi', 24, 80, 90, 60), S('kpi', 120, 80, 60, 60), S('kpi', 186, 80, 60, 60), S('line', 24, 160, 600, 300), S('column', 640, 160, 600, 360, { title: 'Channel mix' }), S('table', 24, 476, 600, 220)]))],
    phoneLayout: false, grid: 'none', kpiValues: 'full', o: null })],
  ['B13 EN two pages with page filters, a logo file, the strip, a long title', () => build(base({ measure: M('Total Sales Amount Including Every Regional Adjustment And Discount') }), { title: 'A very long report title for the header', second: true,
    layout: { preset: 'analysis', filters: true, fpos: 'top', kpis: 3 }, logo: { ext: 'png', bytes: new Uint8Array([9, 9]) }, pageFilters: [{ t: T, c: 'Region', type: 'text', values: ['North', 'South'] }] })],
  ['B14 AR own model, exec 1920 x 1080, a day table, mirrored, tight rows, no data card', () => build(AR_B({ table: [C('اسم اليوم'), M('إجمالي المبيعات'), M('الطلبات')], cats: { bar: C('اسم اليوم'), column: C('اسم الشهر'), donut: C('الشريحة', { two: true }), funnel: C('المرحلة'), treemap: C('المنتج'), map: C('المدينة') } }),
    { lang: 'ar', chartAxes: 'mirrored', pages: [hand(1920, 1080, head(1920, true).concat([S('table', 24, 100, 600, 220), S('column', 640, 100, 600, 420), S('bar', 1256, 100, 640, 420), S('matrix', 24, 340, 600, 180), S('line', 24, 540, 1200, 500), S('kpi', 1256, 540, 120, 120), S('kpi', 1392, 540, 240, 120)]))] })]
];

// a build's record: every file (its path and the sha256 of its bytes) and the result without its files and ZIP
const got = {};
for (const [name, run] of BUILDS) {
  let r; try { r = run(); } catch (e) { r = { threw: String(e && e.stack || e).split('\n').slice(0, 3).join(' | ') }; }
  const files = (r.files || []).map((f) => f.path + '\0' + sha(typeof f.data === 'string' ? f.data : Buffer.from(f.data || []))).join('\n');
  const rest = Object.assign({}, r); delete rest.files; delete rest.zip;
  got[name] = { r, files, result: JSON.stringify(rest) };
}
if (process.env.SP28_DUMP) fs.writeFileSync(process.env.SP28_DUMP, JSON.stringify(Object.fromEntries(Object.entries(got).map(([k, v]) => [k, { files: (v.r.files || []).map((f) => [f.path, typeof f.data === 'string' ? f.data : '<bytes ' + (f.data || []).length + '>']), result: JSON.parse(v.result) }])), null, 1));
const now = Object.fromEntries(Object.entries(got).map(([k, v]) => [k, { files: { count: (v.r.files || []).length, sha256: sha(v.files) }, result: { length: v.result.length, sha256: sha(v.result) } }]));
if (process.env.SP28_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-sp28.mjs: the shared writer\'s files and result for 14 made-up reports, recorded on the base (one fixed seed for the ids)', builds: now }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).builds;
for (const [name] of BUILDS) chk(() => gold[name] && JSON.stringify(now[name]) === JSON.stringify(gold[name]),
  () => `${name.split(' ')[0]}. "${name.replace(/^B\d+ /, '')}": the writer's files and result are the base's, byte for byte: now ${JSON.stringify(now[name])}, recorded ${JSON.stringify(gold[name] || null)}${got[name].r.threw ? ' threw ' + got[name].r.threw : ''} (SP28_DUMP=<file> writes them)`);

// the builds cover the visual families and the high-risk paths: read from the results and the written visuals
const rs = Object.values(got).map((v) => v.r).filter((r) => r.files);
const vis = rs.flatMap((r) => r.files.filter((f) => /visual\.json$/.test(f.path)).map((f) => JSON.parse(f.data)).filter((v) => v.visual));
const types = new Set(vis.map((v) => v.visual.visualType)), some = (k, fn) => rs.some((r) => { const x = r[k]; return fn ? fn(x) : Array.isArray(x) ? x.length > 0 : x && Object.keys(x).length > 0; });
const COVER = {
  'every visual type': ['cardVisual', 'lineChart', 'clusteredBarChart', 'clusteredColumnChart', 'donutChart', 'tableEx', 'pivotTable', 'gauge', 'funnel', 'treemap', 'map', 'textbox', 'image', 'slicer', 'advancedSlicerVisual',
    'lineClusteredColumnComboChart', 'waterfallChart', 'columnChart'].filter((t) => !types.has(t)),
  'kind changes (bar, donut)': some('kindChanges', (x) => (x || []).some((k) => k.to === 'bar')) && some('kindChanges', (x) => (x || []).some((k) => k.to === 'donut')),
  'bar charts by names': some('barCharts'), 'Day Short': some('shortDays'), 'Top N charts': some('topCharts'), 'bar bands': some('barBands'), 'time axes': some('timeAxes'),
  'the Top N title measure': vis.some((v) => JSON.stringify(((v.visual.visualContainerObjects || {}).title || [{}])[0]).includes('"Schema":"extension"')),
  'twin titles told apart': (() => { const r = got[BUILDS[8][0]].r, bars = (r.files || []).filter((f) => /visual\.json$/.test(f.path)).map((f) => JSON.parse(f.data)).filter((v) => v.visual && v.visual.visualType === 'clusteredBarChart');
    const t = bars.map((v) => JSON.stringify(((v.visual.visualContainerObjects.title || [{}])[0].properties || {}).text)); return bars.length >= 2 && new Set(t).size === bars.length; })(),
  'row labels': some('rowLabels'), 'pictures in a table': some('svgSizes'), 'rings without their number': some('ringsSmall'), 'table columns left out': some('tableColumns'), 'smaller table text': some('tableSmaller'),
  'tight rows or rows that scroll': some('tableRows') || vis.some((v) => JSON.stringify(v.visual.objects || {}).includes('rowPadding')), 'calendar order': some('tableOrder'),
  'KPI titles fitted': some('kpiTitles', (x) => x && (x.wrapped.length || x.shortened.length)), 'titles fitted': some('titles', (x) => x && (x.wrapped.length || x.shortened.length)), 'blank kept': some('blankKept'),
  '"No data" skipped (a control character)': some('noDataSkipped'), '"No data" cards': vis.some((v) => JSON.stringify(v.visual.query || {}).includes('No data')), 'subtitles': some('subtitlesUsed'),
  'pills': types.has('advancedSlicerVisual'), 'mirrored charts': rs.some((r) => r.chartAxes && r.chartAxes.charts > 0), 'gradient charts': rs.some((r) => r.chartColors && r.chartColors.charts > 0),
  'right-to-left waterfall': some('waterfallRtl'), 'a phone layout and none': rs.some((r) => r.files.some((f) => /mobile\.json$/.test(f.path))) && rs.some((r) => r.files.some((f) => /visual\.json$/.test(f.path)) && !r.files.some((f) => /mobile\.json$/.test(f.path)))
};
const missing = Object.keys(COVER).filter((k) => (Array.isArray(COVER[k]) ? COVER[k].length : !COVER[k]));
chk(() => !missing.length && rs.length === BUILDS.length, () => `C1. the builds cover every visual family: missing ${JSON.stringify(missing.map((k) => (Array.isArray(COVER[k]) ? k + ' ' + COVER[k].join() : k)))}; built ${rs.length} of ${BUILDS.length}`);

// ---------- after the move (SP28): pbip-page.js assembles, pbip-visuals.js builds; the website loads it before pbip-tooltip ----------
const SRC = (f) => fs.readFileSync(path.join(HERE, '..', 'assets', 'js', f), 'utf8'), lines = (t) => t.split('\n').length - 1;
const pageSrc = SRC('pbip-page.js'), VIS = ['pbip-visuals-charts.js', 'pbip-visuals-tables.js', 'pbip-visuals.js'], visSrc = VIS.map(SRC).join('\n'), Vis = require('../assets/js/pbip-visuals.js'), Ch = require('../assets/js/pbip-visuals-charts.js'), Tb = require('../assets/js/pbip-visuals-tables.js');
chk(() => ['look', 'slotKind', 'kpiRow', 'slicers', 'categoryPlan', 'visual', 'noDataCard', 'emptyPanel', 'phoneLook', 'themeSizes'].every((f) => typeof Vis[f] === 'function')
  && ['slotKind', 'categoryPlan', 'prepare', 'hover', 'format', 'fix', 'mirror', 'topCount'].every((f) => typeof Ch[f] === 'function') && ['kpiRow', 'slicers', 'prepare', 'card', 'format', 'fix'].every((f) => typeof Tb[f] === 'function')
  && /require\('\.\/pbip-visuals-charts\.js'\)/.test(SRC('pbip-visuals.js')) && /require\('\.\/pbip-visuals-tables\.js'\)/.test(SRC('pbip-visuals.js')) && /require\('\.\/pbip-visuals\.js'\)/.test(pageSrc)
  && ['V.look(', 'V.slotKind(', 'V.kpiRow(', 'V.slicers(', 'V.categoryPlan(', 'V.visual(', 'V.noDataCard(', 'V.phoneLook('].every((t) => pageSrc.includes(t))
  && !/const (fixVisual|asBar|byField|slicerHeader|valuesKnown|phoneLook|PHONE|topCount|knownCount|BAND_TYPES|cardObjects|paneObjects) = /.test(pageSrc) && /const BAND_TYPES = /.test(SRC('pbip-visuals-charts.js')) && /const slicerHeader = /.test(SRC('pbip-visuals-tables.js'))
  && !/(^|[^.\w])(rnd|add|json|container)\(|\bD \+ '\/pages|new WeakMap/.test(visSrc) && [pageSrc].concat(VIS.map(SRC)).every((t) => lines(t) < 600),
  () => `M1 pbip-page.js must be the page assembly over pbip-visuals.js (look, slotKind, kpiRow, slicers, categoryPlan, visual, phoneLook), whose builders hold the visuals' rules once, name no visual, write no file and keep no state (the charts in pbip-visuals-charts.js, the cards, tables and slicers in pbip-visuals-tables.js); every file under 600 lines: ${[['pbip-page.js', pageSrc]].concat(VIS.map((f) => [f, SRC(f)])).map(([f, t]) => f + ' ' + lines(t)).join(', ')}`);
const tg = SRC('theme-generator.js'), list = (tg.match(/const BUILDER = \[([^\]]*)\]/) || [])[1] || '';
const at = (f) => list.indexOf('/assets/js/' + f + '.min.js?v='), once = (f) => list.split('/assets/js/' + f + '.min.js?v=').length === 2;
chk(() => ['story-titles', 'pbip-query', 'pbip-sizing', 'label-limits', 'pbip-tooltip', 'pbip-page'].concat(VIS.map((f) => f.replace(/\.js$/, ''))).every(once)
  && VIS.every((f) => { const i = at(f.replace(/\.js$/, '')); return ['story-titles', 'pbip-query', 'pbip-sizing', 'label-limits'].every((d) => at(d) < i) && i < at('pbip-tooltip'); })
  && at('pbip-visuals-charts') < at('pbip-visuals') && at('pbip-visuals-tables') < at('pbip-visuals'),
  () => 'M2 theme-generator.js\'s BUILDER loads pbip-visuals-charts and pbip-visuals-tables, then pbip-visuals, once each, after what they read and before pbip-tooltip and pbip-page: ' + list.slice(0, 400));

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp28.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp28  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp28  ${checks} checks`);
