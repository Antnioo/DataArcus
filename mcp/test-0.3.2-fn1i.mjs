import './fixtures/sp1/seeded-random.mjs';
import './test-env.mjs';
// 0.3.2 FN1I (mcp/work/FN1I.md): a characterisation suite for pbip-export.js build before and after its split into named
// steps. For 21 made-up reports built straight with the shared writer, over the conditions of build's own parts that
// test-0.3.2-sp28.mjs's 14 builds do not reach (no data at all, a model by connection, a report next to someone's
// project with names taken and the approved Arabic names' note, a sample with that note, a Semibold theme and one with its
// own bold label, the theme's own gridlines, data colours under 3:1, the model's date and number columns, "No data" off,
// SVG cards alone, a gallery kind without the gallery, grid none), every file it writes (its path and bytes), its ZIP's size (the ZIP holds
// the time it was made) and its whole result are byte for byte the ones recorded on the base (integration/0.3.2 5cf96356, before the split). The
// writer's random ids come from one fixed seed (SP1's), loaded first, so the ids come out in the same sequence or the
// records differ. Recorded in fixtures/fn1i-builds.json; FN1I_RECORD=1 records them again (only on the base, never to
// make a run pass); FN1I_DUMP=<file> writes the files and results as text. Made-up models only.
//   F1-F21  each build's files, ZIP and result;  F22  every build ran (none threw)
//   node test-0.3.2-fn1i.mjs
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
const GOLD = path.join(HERE, 'fixtures', 'fn1i-builds.json');
const Px = require('../assets/js/pbip-export.js'), E = require('../assets/js/design-engine.js');

// a report the way the MCP and the website call the writer: a designed page (the design engine's layout) or hand-placed
// slots; o's own keys go to the writer as given
const build = (bind, o = {}) => {
  const lang = o.lang || 'en', d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma';
  if (o.design) o.design(d);
  d.layout = Object.assign({}, d.layout, o.layout || {}); E.repairState(d);
  const specs = o.pages ? null : E.projectPages(d.layout, lang, { second: !!o.second, panel: !!o.panel });
  const pages = o.pages || specs.map((sp) => ({ name: sp.name, page: sp.page, slots: sp.slots, panel: sp.panel, png: new Uint8Array([1, 2]), grow: true }));
  const extra = Object.assign({}, o); ['lang', 'layout', 'pages', 'second', 'panel', 'design', 'themeWith'].forEach((k) => delete extra[k]);
  const theme = E.buildTheme(d, lang);
  return Px.build(Object.assign({ name: 'FN1I', title: 'FN1I report', pageName: pages[0].name, lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: o.themeWith ? o.themeWith(theme) : theme,
    sample: false, model: { byPath: 'M.SemanticModel' }, bind, texts: E.REPORT_TEXTS[lang], pages }, extra));
};
const hand = (w, h, slots, name) => ({ name: name || 'Hand', page: { w, h }, slots, panel: null, hand: true, png: new Uint8Array([3]) });
const T = 'Sales', M = (m, x) => Object.assign({ t: T, m }, x || {}), C = (c, x, t) => Object.assign({ t: t || T, c }, x || {});
const MONTH = C('Month Name', { sortBy: { t: 'Calendar', c: 'Month Number' } }, 'Calendar');
const base = (x) => Object.assign({
  kpis: [M('Total Sales', { wholeFormat: '#,0' }), M('Orders', { wholeFormat: '#,0' }), M('Margin %', { pct: true, pctFormat: '0.0%' })],
  measure: M('Total Sales'), date: MONTH,
  cats: { bar: C('City'), column: C('Channel'), donut: C('Segment'), funnel: C('Stage'), treemap: C('Product'), map: C('City') }, y: { funnel: M('Orders'), gauge: M('Margin %', { pct: true, pctFormat: '0.0%' }) },
  catPool: [C('City'), C('Channel'), C('Segment')],
  table: [C('City'), M('Total Sales', { tableFormat: '#,0' }), M('Orders')], slicers: [C('City'), C('Channel'), null],
  tip: { card: M('Total Sales', { wholeFormat: '#,0' }), cat: C('Segment'), y: M('Orders'), date: MONTH }
}, x || {});
const S = (kind, x, y, w, h, more) => Object.assign({ kind, x, y, w, h }, more || {});
const head = (w, rtl) => [S('title', rtl ? w - 24 - 400 : 24, 12, 400, 56), S('logo', rtl ? 24 : w - 24 - 120, 12, 120, 56)];
const AR_NOTE = '\n\n## الأسماء العربية\n- Sales: المبيعات (approved)\n';
const sampleOf = (lang, x) => Object.assign({ name: 'Sample ' + lang, title: 'Sample', lang, rtl: lang === 'ar', sample: true }, (() => { const d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma'; d.layout = {}; E.repairState(d);
  const pages = E.projectPages(d.layout, lang, { second: false, panel: false }).map((sp) => ({ name: sp.name, page: sp.page, slots: sp.slots, panel: sp.panel, png: new Uint8Array([1]), grow: true }));
  return { font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), texts: E.REPORT_TEXTS[lang], pageName: pages[0].name, pages }; })(), x || {});

const BUILDS = [
  ['F1 no data at all (no sample, no model): the semantic model written, empty', () => build(null, { model: undefined })],
  ['F2 a model by connection, EN, gradient bars from one data colour', () => build(base(), { model: { byConnection: 'Data Source=pbiazure://api.powerbi.com;Initial Catalog=x' }, chartColors: 'gradient',
    themeWith: (t) => Object.assign({}, t, { dataColors: ['#1f6feb', '#1f6feb', '#1f6feb'] }) })],
  ['F3 next to their project: names taken, the approved names note in <report>.README.md', () => build(base(), { name: 'Sales', model: { byPath: 'C:/x/Sales.SemanticModel', taken: ['Sales - New design', 'sales - new design 2'] }, namesNote: AR_NOTE })],
  ['F4 next to their project, no note: no README, no .gitignore', () => build(base(), { name: 'Other', model: { byPath: 'Proj/Shop.Dataset' } })],
  ['F5 the sample, AR, with the approved names note after the README', () => Px.build(sampleOf('ar', { namesNote: AR_NOTE }))],
  ['F6 a Semibold theme: the bold total label added', () => build(base(), { themeWith: (t) => Object.assign({}, t, { textClasses: Object.assign({}, t.textClasses, { label: { fontFace: 'Segoe UI Semibold', fontSize: 10 } }) }) })],
  ['F7 a Semibold theme with its own bold label: kept', () => build(base(), { font: 'Segoe UI Semibold', themeWith: (t) => Object.assign({}, t, { textClasses: Object.assign({}, t.textClasses, { label: { fontFace: 'Segoe UI Semibold', fontSize: 10 }, boldLabel: { fontFace: 'Arial Black' } }) }) })],
  ['F8 quiet grid, the theme with its own gridlines: none written', () => build(base(), { quietGrid: true, themeWith: (t) => Object.assign({}, t, { visualStyles: Object.assign({}, t.visualStyles, { lineChart: { '*': { valueAxis: [{ gridlineShow: false }] } } }) }) })],
  ['F9 data colours under 3:1 on the card: made readable, told', () => build(base(), { themeWith: (t) => Object.assign({}, t, { dataColors: ['#20252f', '#232a36', '#1f6feb'] }) })],
  ['F10 the model\'s date and number columns: continuous axes, mirrored AR', () => build(base({ date: C('Order Date', { type: 'dateTime' }, 'Calendar'), cats: { bar: C('City'), column: C('Year', { num: true }, 'Calendar'), donut: C('Segment'), funnel: C('Stage'), treemap: C('Product'), map: C('City') } }),
    { lang: 'ar', chartAxes: 'mirrored', model: { byPath: 'M.SemanticModel', columns: { Calendar: { 'Order Date': { type: 'dateTime' }, Week: { type: 'int64' }, Name: { type: 'string' } }, Sales: { Amount: { type: 'decimal' } } } } })],
  ['F11 "No data" off, a slicer panel, a logo, two pages', () => build(base(), { noDataMessage: false, second: true, panel: true, layout: { filters: true, fpos: 'end' }, logo: { ext: 'jpg', bytes: new Uint8Array([7, 8, 9]) } })],
  ['F12 SVG cards alone, then "No data" measures beside them', () => build(base(), { svgCards: [{ card: 0, t: T, m: 'Ring', expression: '"<svg/>"', w: 64, h: 64 }] })],
  ['F13 a gallery kind without the gallery: written plain, told', () => build(base(), { pages: [hand(1280, 720, head(1280).concat([S('combo', 24, 80, 600, 300), S('waterfall', 640, 80, 616, 300), S('column', 24, 396, 1232, 300)]))] })],
  ['F14 grid none, slicer pills, no tooltip binding', () => build(base({ tip: null }), { grid: 'none', slicerStyle: 'pills' })],
  ['F15 a tooltip with no month: the category pages only, Top 6', () => build(base({ tip: { card: M('Total Sales'), cat: C('Segment'), y: M('Orders'), date: null } }), { pages: [hand(1280, 720, head(1280).concat([S('bar', 24, 80, 600, 300), S('column', 640, 80, 616, 300), S('line', 24, 396, 1232, 300)]))] })],
  ['F16 a Windows device name and a long name cut at a word', () => build(base(), { name: 'CON.quarterly report: north & south regions, all channels', sample: true, model: undefined })],
  ['F17 a tooltip by a month label with its date: the trend kept to its last 6 months', () => build(base({ date: C('Month', { dateOf: { t: 'Calendar', c: 'Date' } }, 'Calendar'), tip: { card: M('Total Sales'), cat: C('Segment'), y: M('Orders'), date: C('Month', { dateOf: { t: 'Calendar', c: 'Date' } }, 'Calendar') } }))],
  ['F18 their own model and the sample asked: the model wins', () => build(base(), { sample: true })],
  ['F19 no font given: Segoe UI', () => build(base(), { font: undefined })],
  ['F20 one column summed in one chart and counted in another: a tooltip page each', () => build(base({ measure: C('Amount', { agg: 0 }), y: { funnel: C('Amount', { agg: 5 }), gauge: M('Margin %', { pct: true, pctFormat: '0.0%' }) } }), { pages: [hand(1280, 720, head(1280).concat([S('bar', 24, 80, 600, 300), S('funnel', 640, 80, 616, 300), S('column', 24, 396, 1232, 300)]))] })],
  ['F21 a line chart by a decimal column (the model\'s type only), mirrored AR', () => build(base({ date: C('Discount') }),
    { lang: 'ar', chartAxes: 'mirrored', model: { byPath: 'M.SemanticModel', columns: { Sales: { Discount: { type: 'decimal' } } } } })]
];

const got = {};
for (const [name, run] of BUILDS) {
  let r; try { r = run(); } catch (e) { r = { threw: String(e && e.stack || e).split('\n').slice(0, 3).join(' | ') }; }
  const files = (r.files || []).map((f) => f.path + '\0' + sha(typeof f.data === 'string' ? f.data : Buffer.from(f.data || [])));
  const rest = Object.assign({}, r); delete rest.files; delete rest.zip;
  let zipSha = null; try { zipSha = r.zip ? r.zip().length : null; } catch (e) { zipSha = 'threw ' + String(e && e.message || e); }
  got[name] = { r, files, zip: zipSha, result: JSON.stringify(rest) };
}
if (process.env.FN1I_DUMP) fs.writeFileSync(process.env.FN1I_DUMP, JSON.stringify(Object.fromEntries(Object.entries(got).map(([k, v]) => [k, { files: (v.r.files || []).map((f) => [f.path, typeof f.data === 'string' ? f.data : '<bytes ' + (f.data || []).length + '>']), result: JSON.parse(v.result) }])), null, 1));
const now = Object.fromEntries(Object.entries(got).map(([k, v]) => [k, { files: v.files, zip: v.zip, result: { length: v.result.length, sha256: sha(v.result) } }]));
if (process.env.FN1I_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-fn1i.mjs: the shared writer\'s files (path and sha256), ZIP size and result for 21 made-up reports, recorded on the base 5cf96356 (one fixed seed for the ids)', builds: now }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).builds;
for (const [name] of BUILDS) {
  const a = now[name], b = gold[name] || { files: [] }, diff = a.files.filter((f) => !b.files.includes(f)).concat(b.files.filter((f) => !a.files.includes(f)).map((f) => 'gone ' + f)).map((f) => f.split('\0')[0]).slice(0, 8);
  chk(() => gold[name] && JSON.stringify(a) === JSON.stringify(b),
    () => `${name.split(' ')[0]}. "${name.replace(/^F\d+ /, '')}": the writer's files, ZIP and result are the base's, byte for byte: files that differ ${JSON.stringify(diff)}; ZIP ${a.zip === b.zip ? 'same' : 'differs'}; result ${JSON.stringify(a.result) === JSON.stringify(b.result) ? 'same' : 'differs'}${got[name].r.threw ? '; threw ' + got[name].r.threw : ''} (FN1I_DUMP=<file> writes them)`);
}
const threw = Object.entries(got).filter(([, v]) => v.r.threw).map(([k]) => k.split(' ')[0]);
chk(() => !threw.length, () => `F22. every build ran: threw ${threw.join(', ')}`);

if (problems.length) { console.log(`FAIL script=test-0.3.2-fn1i.mjs cause=${JSON.stringify(problems[0].slice(0, 300))}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  fn1i  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  fn1i  ${checks} checks`);
