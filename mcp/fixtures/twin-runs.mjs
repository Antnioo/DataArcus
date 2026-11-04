// The Arabic twin's characterisation runs, shared by the split's suites (0.3.2 SP11: written in test-0.3.2-sp11.mjs;
// SP26: moved here as it was, so sp11 and sp26 run the same flow). On import: a fresh working folder (DATAARCUS_ROOT)
// and SP1's seeded random, loaded before the tools, so every run's ids come from one fixed seed in this process.
// runCases(cases): for each [name, dir, make, args, own] the texts listed page by page, an Arabic for each (own, its
// draft, else the lab's), the plan, the click, the write; returns { got, plans }; summary(got) the hashes recorded.
// Made-up reports only: the guards' fixtures, twin-fuzz's generator and cases, and the fitting project written here.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
// the lab's Arabic for a text without a draft (test-0.3.1-twin-fuzz.mjs arabicFor), computed before the seed replaces crypto's randomness (hashing is not random)
const ARABIC = ['عنوان عربي', 'عنوان عربي تجريبي', 'عنوان عربي تجريبي طويل'];
const arabicFor = (s) => ARABIC[parseInt(sha(String(s)).slice(0, 4), 16) % 3];

export const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-twin-runs-')));
process.env.DATAARCUS_ROOT = ROOT;
await import(pathToFileURL(path.join(HERE, 'fixtures', 'sp1', 'seeded-random.mjs')).href);
const Plans = await import('../lib/plans.mjs');
const { register } = await import('../tools/create_arabic_twin.mjs');
const { sampleFiles } = await import('../lib/sample-project.mjs');
let handler = null;
register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = h; } }, {});
export const call = async (a) => { let r; try { r = await handler(a); } catch (e) { return { err: true, t: 'threw: ' + String(e && e.message || e), j: null }; } const t = (r.content || []).map((c) => c.text || '').join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* words */ } return { err: !!r.isError, t, j }; };

export const norm = (t) => [ROOT, JSON.stringify(ROOT).slice(1, -1), ROOT.split(path.sep).join('/')].reduce((s, r) => s.split(r).join('<ROOT>'), String(t))
  .replace(/plan-[0-9a-f]{8,}/g, 'plan-<id>').split('\\\\').join('/');
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
export const filesOf = (dir) => tree(dir).map((f) => { const b = fs.readFileSync(f), t = b.includes(0) ? null : b.toString('utf8');
  return path.relative(dir, f).split(path.sep).join('/') + '\0' + (t != null && norm(t) !== t ? sha(norm(t)) : sha(b)) + '\n'; }).sort().join('');
// (CI's Windows checkout writes the fixtures' text files with CRLF, SP1) the copies get LF, as the repository holds them
export const lf = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) return lf(f);
  const b = fs.readFileSync(f); if (!b.includes(0) && b.includes(13)) fs.writeFileSync(f, b.toString('utf8').replace(/\r\n/g, '\n')); });
export const put = (f, x) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof x === 'string' ? x : JSON.stringify(x, null, 2) + '\n'); };
export const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
export const schema = (s) => 'https://developer.microsoft.com/json-schemas/fabric/' + s + '/schema.json';
export const VS = schema('item/report/definition/visualContainer/2.1.0');
export const L = (v) => ({ expr: { Literal: { Value: String(v) } } });
export const Q = (s) => L("'" + s + "'");
export const obj = (p) => [{ properties: p }];

// ---- twin-fuzz's generator and materialize (test-0.3.1-twin-fuzz.mjs, as they are) ----
export const fcol = (n) => ({ field: { Column: { Expression: { SourceRef: { Entity: 'Synthetic' } }, Property: n } }, queryRef: 'Synthetic.' + n, nativeQueryRef: n });
export const fmea = (n = 'Metric') => ({ field: { Measure: { Expression: { SourceRef: { Entity: 'Synthetic' } }, Property: n } }, queryRef: 'Synthetic.' + n, nativeQueryRef: n });
export const query = (roles) => ({ queryState: Object.fromEntries(Object.entries(roles).map(([r, p]) => [r, { projections: p }])) });
export const TYPES = ['card', 'textbox', 'tableEx', 'flatMatrix', 'groupedMatrix', 'heatmap', 'clusteredBarChart', 'clusteredColumnChart', 'lineChart', 'areaChart', 'donutChart', 'slicer', 'actionButton', 'shape', 'image', 'group'];
export function visual(kind, n) {
  const v = { $schema: VS, name: 'v' + n, position: { x: 0, y: 0, width: 300, height: 220, z: n * 1000, tabOrder: n * 1000 } };
  if (kind === 'group') { v.visualGroup = { displayName: 'Synthetic group', groupMode: 'ScaleMode' }; return v; }
  v.visual = { visualType: /Matrix|heatmap/.test(kind) ? 'pivotTable' : kind };
  const a = v.visual;
  if (kind === 'textbox') a.objects = { general: obj({ paragraphs: [{ textRuns: [{ value: 'Synthetic heading', textStyle: { fontFamily: 'Segoe UI', fontSize: '14pt' } }], horizontalTextAlignment: 'left' }] }) };
  else if (kind === 'actionButton') a.objects = { text: obj({ show: L('true'), text: Q('Synthetic action') }), icon: obj({ show: L('true'), shapeType: Q('rightArrow'), placement: Q('left') }) };
  else if (kind === 'shape') a.objects = { shape: obj({ tileShape: Q('rectangle') }) };
  else if (kind === 'image') a.objects = { general: obj({ imageUrl: Q('synthetic.svg') }) };
  else {
    const matrix = a.visualType === 'pivotTable';
    a.query = query(matrix ? { Rows: kind === 'groupedMatrix' ? [fcol('Category'), fcol('Group')] : [fcol(kind === 'heatmap' ? 'Weekday' : 'Category')], ...(kind === 'heatmap' ? { Columns: [fcol('Hour')] } : {}), Values: [fmea()] }
      : ['card', 'slicer', 'tableEx'].includes(kind) ? { Values: kind === 'card' ? [fmea()] : kind === 'slicer' ? [fcol('Category')] : [fcol('Category'), fmea()] }
        : { Category: [fcol(['clusteredColumnChart', 'lineChart', 'areaChart'].includes(kind) ? 'Date' : 'Category')], Y: [fmea()], ...(kind === 'donutChart' ? { Series: [fcol('Group')] } : {}) });
    a.objects = matrix ? { subTotals: obj({ rowSubtotals: L('false'), columnSubtotals: L('false') }), grid: obj({ textSize: L('10D') }) } : kind === 'donutChart' ? { legend: obj({ show: L('true'), position: Q('Right') }) } : {};
    if (['lineChart', 'areaChart', 'clusteredColumnChart'].includes(kind)) a.query.sortDefinition = { sort: [{ field: fcol('Date').field, direction: 'Ascending' }], isDefaultSort: true };
    if (kind !== 'heatmap') a.visualContainerObjects = { title: obj({ show: L('true'), text: Q('Synthetic title') }) };
  }
  return v;
}
export function rng(seed) { let x = seed >>> 0; return () => { x += 0x6D2B79F5; let t = x; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function generate(seed) {
  const r = rng(seed), pick = (n) => Math.floor(r() * n), dims = [[1280, 720], [1280, 800], [1920, 1080]];
  const pages = [];
  for (let p = 0, count = 1 + pick(3); p < count; p++) {
    const [width, height] = dims[pick(3)], pg = { id: 'p' + p, width, height, tooltip: p > 0 && pick(5) === 0, background: pick(13) === 0, visuals: [] };
    for (let i = 0, n = 1 + pick(25); i < n; i++) {
      const v = visual(TYPES[pick(TYPES.length)], i), w = 60 + pick(Math.floor(width * 0.43)), h = 30 + pick(Math.floor(height * 0.43));
      Object.assign(v.position, { width: w, height: h, x: pick(4) === 0 ? width - w : pick(width - w + 1), y: pick(4) === 0 ? height - h : pick(height - h + 1) });
      const group = pg.visuals.find((x) => x.visualGroup && x.position.width >= w && x.position.height >= h);
      if (group && pick(4) === 0) { v.parentGroupName = group.name; v.position.x = pick(group.position.width - w + 1); v.position.y = pick(group.position.height - h + 1); }
      const labelUnique = (x) => { if (!x || typeof x !== 'object') return; for (const k of Object.keys(x)) { if (typeof x[k] === 'string') x[k] = x[k].replace(/Synthetic (heading|action|title)/g, 'Synthetic $1 page ' + p + ' visual ' + i); else labelUnique(x[k]); } }; labelUnique(v);
      pg.visuals.push(v);
    }
    if (seed % 7 === 0 && pg.visuals.length >= 2) {
      const a = visual('textbox', 0), b = visual('shape', 1);
      a.position = { x: 20, y: 20, width: 320, height: 60, z: 1, tabOrder: 1 };
      b.position = { x: 300, y: 25, width: 25, height: 25, z: 2, tabOrder: 2 };
      pg.visuals.splice(0, 2, a, b);
      for (const v of pg.visuals) if (v.parentGroupName && !pg.visuals.some((g) => g.name === v.parentGroupName && g.visualGroup)) delete v.parentGroupName;
    }
    pages.push(pg);
  }
  return { pages };
}
export function modelFor(spec) {
  const fields = new Map([['Category', 'string'], ['Group', 'string'], ['Weekday', 'string'], ['Hour', 'int64'], ['Date', 'dateTime']]), measures = new Set(['Metric']);
  const walk = (x) => { if (!x || typeof x !== 'object') return; if (x.Column && x.Column.Property) fields.set(x.Column.Property, /Date/.test(x.Column.Property) ? 'dateTime' : 'string'); if (x.Measure && x.Measure.Property) measures.add(x.Measure.Property); Object.values(x).forEach(walk); };
  walk(spec);
  return { compatibilityLevel: 1567, model: { culture: 'en-US', tables: [{ name: 'Synthetic', columns: [...fields].map(([name, dataType]) => ({ name, dataType, sourceColumn: name })), measures: [...measures].map((name) => ({ name, expression: 'BLANK()' })), partitions: [{ name: 'Synthetic', mode: 'import', source: { type: 'm', expression: 'let Source = #table({}, {}) in Source' } }] }] } };
}
export function materialize(spec, dir) {
  const wr = (f, x) => put(path.join(dir, f), x), D = 'Synthetic.Report/definition';
  wr('Synthetic.pbip', { $schema: schema('pbip/pbipProperties/1.0.0'), version: '1.0', artifacts: [{ report: { path: 'Synthetic.Report' } }], settings: { enableAutoRecovery: true } });
  wr('Synthetic.Report/.platform', { $schema: schema('gitIntegration/platformProperties/2.0.0'), metadata: { type: 'Report', displayName: 'Synthetic' }, config: { version: '2.0', logicalId: '11111111-2222-4333-8444-555555555555' } });
  wr('Synthetic.Report/definition.pbir', { $schema: schema('item/report/definitionProperties/2.0.0'), version: '4.0', datasetReference: { byPath: { path: '../Synthetic.SemanticModel' } } });
  wr('Synthetic.SemanticModel/definition.pbism', { $schema: schema('item/semanticModel/definitionProperties/1.0.0'), version: '4.0', settings: {} });
  wr('Synthetic.SemanticModel/model.bim', modelFor(spec));
  wr(D + '/version.json', { $schema: schema('item/report/definition/versionMetadata/1.0.0'), version: '2.0.0' });
  wr(D + '/report.json', { $schema: schema('item/report/definition/report/2.1.0'), settings: { useStylableVisualContainerHeader: true } });
  const ids = spec.pages.map((p) => p.id);
  wr(D + '/pages/pages.json', { $schema: schema('item/report/definition/pagesMetadata/1.0.0'), pageOrder: ids, activePageName: ids[0] });
  spec.pages.forEach((p, i) => {
    const pg = { $schema: schema('item/report/definition/page/2.0.0'), name: ids[i], displayName: 'Synthetic page', displayOption: 'FitToPage', width: p.width, height: p.height };
    if (p.tooltip) Object.assign(pg, { type: 'Tooltip', visibility: 'HiddenInViewMode', pageBinding: { name: 'syntheticBinding', type: 'Tooltip' } });
    if (p.background) pg.objects = { background: obj({ image: { image: { name: Q('synthetic.svg'), url: { expr: { ResourcePackageItem: { PackageName: 'RegisteredResources', PackageType: 1, ItemName: 'synthetic.svg' } } }, scaling: Q('Fit') } } }) };
    wr(D + '/pages/' + ids[i] + '/page.json', pg);
    for (const v of p.visuals) wr(D + '/pages/' + ids[i] + '/visuals/' + v.name + '/visual.json', v);
  });
  if (spec.pages.some((p) => p.background)) wr('Synthetic.Report/StaticResources/RegisteredResources/synthetic.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#eeeeee"/></svg>');
}

// ---- the project written here (made up): twin-project with a page of fitting shapes and a heatmap page ----
// fit (1280 x 720): a strip of two dropdown slicers, a Reset button and a card with no free room (its long Arabic
// label: the slicers give the width); a narrow button with an icon boxed in by cards (its text made smaller, then
// its icon off where that is not enough); a 60-wide
// button between cards (cut); a text box with free room (widened, then taller) and one boxed in (cut); a table with
// set column widths and two stale columnWidth entries for columns it no longer shows (B-289), its Arabic headers one
// long (must wrap: cut) and one short (grows into the spare room); a table with too little spare room (may be cut);
// a table whose first column English hides (4 wide). heat (1280 x 800): mx8's Call Center heatmap with its
// names table and its hour chart under it.
export const T = 'Sales', W = 'Work';
export const col = (t, c, d) => Object.assign({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c }, d ? { displayName: d } : {});
export const mea = (t, m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m });
export const cw = (ref, w) => ({ properties: { value: L(w + 'D') }, selector: { metadata: ref } });
export const box = (name, x, y, width, height, z, visual, more) => Object.assign({ $schema: VS, name, position: { x, y, z, height, width, tabOrder: z }, visual }, more || {});
export const slicer = (name, x, y, w, h, z) => box(name, x, y, w, h, z, { visualType: 'slicer', query: { queryState: { Values: { projections: [col(T, 'Region')] } } }, objects: { data: obj({ mode: Q('Dropdown') }) } });
export const card = (name, x, y, w, h, z) => box(name, x, y, w, h, z, { visualType: 'card', query: { queryState: { Values: { projections: [mea(T, 'Orders')] } } } });
export const button = (name, x, y, w, h, z, text, pt) => box(name, x, y, w, h, z, { visualType: 'actionButton', objects: { icon: obj({ show: L('true'), shapeType: Q('rightArrow'), placement: Q('left') }), text: obj(Object.assign({ show: L('true'), text: Q(text) }, pt ? { fontSize: L(pt + 'D') } : {})) },
  visualContainerObjects: { visualLink: obj({ show: L('true'), type: Q('Bookmark'), bookmark: Q('bmReset') }) } });
export const textbox = (name, x, y, w, h, z, text) => box(name, x, y, w, h, z, { visualType: 'textbox', objects: { general: obj({ paragraphs: [{ textRuns: [{ value: text, textStyle: { fontFamily: 'Segoe UI', fontSize: '14pt' } }], horizontalTextAlignment: 'left' }] }) } });
const DAY = [col(W, 'Weekday', ' ')];
export const heat = (name, b) => box(name, b.x, b.y, b.width, b.height, 26000, { visualType: 'pivotTable',
  query: { queryState: { Rows: { projections: DAY }, Columns: { projections: [col(W, 'Call Hour')] }, Values: { projections: [mea(W, 'Calls')] } } },
  objects: { subTotals: obj({ rowSubtotals: L('false'), columnSubtotals: L('false') }), columnHeaders: obj({ outlineStyle: L('0D') }), rowHeaders: obj({ outlineStyle: L('0D'), steppedLayoutIndentation: L('10D'), outlineWeight: L('1D') }),
    grid: obj({ gridHorizontal: L('true'), gridVertical: L('true'), gridHorizontalWeight: L('5D'), gridVerticalWeight: L('2D'), textSize: L('10D') }), columnWidth: [cw(DAY[0].queryRef, 38.06)] },
  visualContainerObjects: { stylePreset: obj({ name: Q('None') }), padding: obj({ right: L('6D') }) } });
export const hours = (name, b) => box(name, b.x, b.y, b.width, b.height, 28000, { visualType: 'columnChart', query: { queryState: { Category: { projections: [col(W, 'Call Hour')] }, Y: { projections: [mea(W, 'Calls')] } } },
  objects: { categoryAxis: obj({ show: L('false') }), valueAxis: obj({ show: L('false') }) }, visualContainerObjects: { padding: obj({ left: L('0D'), right: L('20D') }) } });
export function fitProject(dir) {
  fs.cpSync(path.join(HERE, 'fixtures/twin-project'), dir, { recursive: true }); lf(dir);
  const DEF = path.join(dir, 'Twin Sales.Report/definition'), bimF = path.join(dir, 'Twin Sales.SemanticModel/model.bim'), bim = rd(bimF);
  bim.model.tables.push({ name: W, columns: ['Weekday', 'Call Hour'].map((name) => ({ name, dataType: /Hour/.test(name) ? 'double' : 'string', sourceColumn: name })), measures: [{ name: 'Calls', expression: '1' }] });
  put(bimF, bim);
  const pj = path.join(DEF, 'pages/pages.json'), pages = rd(pj);
  const page = (id, w, h, vs) => { pages.pageOrder.push(id); put(path.join(DEF, 'pages', id, 'page.json'), { $schema: schema('item/report/definition/page/2.0.0'), name: id, displayName: id === 'fit' ? 'Fitting' : 'Calls', displayOption: 'FitToPage', width: w, height: h });
    vs.forEach((v) => put(path.join(DEF, 'pages', id, 'visuals', v.name, 'visual.json'), v)); };
  const tbl = box('tblFit', 20, 420, 600, 280, 9000, { visualType: 'tableEx', query: { queryState: { Values: { projections: [col(T, 'Product'), col(T, 'Region'), { field: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: T } }, Property: 'Amount' } }, Function: 0 } }, queryRef: 'Sum(Sales.Amount)', nativeQueryRef: 'Sum of Amount' }] } } },
    objects: { columnWidth: [cw('Sales.Product', 60), cw('Sales.Region', 50), cw('Sum(Sales.Amount)', 80), cw('Sales.Old Code', 150), cw('Sales.Old Name', 100)] } });
  const tblMay = box('tblMay', 700, 420, 209, 200, 9500, { visualType: 'tableEx', query: { queryState: { Values: { projections: [col(T, 'Region'), { field: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: T } }, Property: 'Amount' } }, Function: 0 } }, queryRef: 'Sum(Sales.Amount)', nativeQueryRef: 'Sum of Amount' }] } } },
    objects: { columnWidth: [cw('Sales.Region', 70), cw('Sum(Sales.Amount)', 100)] } });
  // (MX2: Fintech's watchlist) a column English hides (4 wide, under HIDDEN_W) stays hidden: never widened for its header
  const tblHid = box('tblHid', 940, 420, 320, 200, 9800, { visualType: 'tableEx', query: { queryState: { Values: { projections: [col(T, 'Product'), col(T, 'Region'), { field: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: T } }, Property: 'Amount' } }, Function: 0 } }, queryRef: 'Sum(Sales.Amount)', nativeQueryRef: 'Sum of Amount' }] } } },
    objects: { columnWidth: [cw('Sales.Product', 4), cw('Sales.Region', 90), cw('Sum(Sales.Amount)', 90)] } });
  // (0.3.2 TT1: tblFit's header was cut only because its stale entries counted, B-289; fixed, it fits) a table with no
  // spare room, so the cut path stays reached: its Arabic Product header in its English 50
  const tblCut = box('tblCut', 700, 640, 120, 70, 9900, { visualType: 'tableEx', query: { queryState: { Values: { projections: [col(T, 'Product'), { field: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: T } }, Property: 'Amount' } }, Function: 0 } }, queryRef: 'Sum(Sales.Amount)', nativeQueryRef: 'Sum of Amount' }] } } },
    objects: { columnWidth: [cw('Sales.Product', 50), cw('Sum(Sales.Amount)', 60)] } });
  page('fit', 1280, 720, [
    slicer('slA', 0, 20, 400, 40, 1000), slicer('slB', 400, 20, 400, 40, 2000), button('btnLong', 800, 20, 80, 40, 3000, 'Reset'), card('cardTop', 880, 20, 400, 40, 4000),
    card('cardL', 0, 100, 220, 40, 5000), button('btnIcon', 220, 100, 100, 40, 5500, 'Clear', 10), card('cardR', 320, 100, 960, 40, 6000),
    card('cardC1', 0, 150, 400, 40, 6500), button('btnCut', 400, 150, 60, 40, 7000, 'Go'), card('cardC2', 460, 150, 820, 40, 7500),
    textbox('tbGrow', 20, 200, 160, 30, 8000, 'Notes'), card('cardT1', 600, 200, 200, 30, 8200), textbox('tbCut', 800, 200, 80, 30, 8400, 'Note'), card('cardT2', 880, 200, 200, 30, 8600),
    tbl, tblMay, tblHid, tblCut]);
  page('heat', 1280, 800, [heat('heatG', { x: 543.33, y: 434.17, width: 317.5, height: 188.33 }), hours('hoursG', { x: 557.5, y: 603.75, width: 310, height: 82.5 })]);
  put(pj, pages);
}
export const FIT_AR = {
  'button:fit/btnLong': 'إعادة ضبط جميع الفلاتر في هذه الصفحة',
  'button:fit/btnIcon': 'مسح الكل',
  'button:fit/btnCut': 'الانتقال إلى صفحة التفاصيل الكاملة للمنتجات',
  'textbox:fit/tbGrow/0.0': 'ملاحظات حول المبيعات في كل منطقة خلال الربع الأخير من السنة المالية الحالية',
  'textbox:fit/tbCut/0.0': 'ملاحظة طويلة جدا لا تتسع في مكانها أبدا مهما حاولنا',
  'field:Sales.Product': 'اسم المنتج الكامل كما يظهر في كتالوج الشركة',
  'field:Sales.Region': 'المنطقة'
};

// ---- the real flow: the texts listed page by page, an Arabic for each (its draft, else the lab's), the plan, the click, the write ----
export async function twin(base, own) {
  const labels = {};
  let from = 0, last = -1;
  do {
    const p = await call(Object.assign({}, base, { textsFrom: from }));
    if (p.err || !p.j) throw new Error('plan refused: ' + p.t.slice(0, 300));
    for (const t of p.j.texts || []) { labels[t.id] = own && own[t.id] ? own[t.id] : t.draftArabic || arabicFor(t.text || ''); if (t.altTextToo) labels[t.altTextToo] = labels[t.id]; }
    last = from; from = p.j.moreTexts && Number.isFinite(p.j.moreTexts.from) ? p.j.moreTexts.from : -1;
  } while (from >= 0 && from > last);
  const p = await call(Object.assign({}, base, { labels })), id = p.j && p.j.plan && p.j.plan.planId;
  if (!id) return { plan: p, write: null };
  Plans.approve(id, 'user-in-browser');
  return { plan: p, write: await call(Object.assign({}, base, { labels, planId: id })) };
}
export const fuzz = (n) => JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures/twin-fuzz', n + '.json'), 'utf8'));
export const lineCase = () => { const b = visual('actionButton', 1), u = visual('shape', 2);
  b.position = { x: 600, y: 100, width: 60, height: 40, z: 1000, tabOrder: 1000 }; u.position = { x: 600, y: 142, width: 60, height: 3, z: 2000, tabOrder: 2000 };
  return { pages: [{ id: 'p0', width: 1280, height: 720, visuals: [b, u] }] }; };
export const FUZZ = ['B1-1', 'B1-3', 'B2-1', 'B2new-1', 'B2new-2', 'B2new-8', 'B3-1', 'M1-1', 'V1-1'];
export const SP11_CASES = [
  ['T1 the twin-project fixture, its own report', 't1', () => { fs.cpSync(path.join(HERE, 'fixtures/twin-project'), path.join(ROOT, 't1'), { recursive: true }); lf(path.join(ROOT, 't1')); }, { path: 't1/Twin Sales.pbip', arabicMonth: false }],
  ['T2 the twin-project fixture, both languages in one report', 't2', () => { fs.cpSync(path.join(HERE, 'fixtures/twin-project'), path.join(ROOT, 't2'), { recursive: true }); lf(path.join(ROOT, 't2')); }, { path: 't2/Twin Sales.pbip', arabicMonth: false, into: 'same' }],
  ['T3 the sample project', 't3', () => sampleFiles('t3').forEach((f) => put(path.join(ROOT, f.path), f.data)), null],
  ...FUZZ.map((n, i) => [`T${4 + i} twin-fuzz ${n}`, 'f' + n, () => materialize(fuzz(n), path.join(ROOT, 'f' + n)), { path: 'f' + n + '/Synthetic.pbip', arabicMonth: false }]),
  ['T13 twin-fuzz\'s button with its underline', 'fline', () => materialize(lineCase(), path.join(ROOT, 'fline')), { path: 'fline/Synthetic.pbip', arabicMonth: false }],
  ['T14 hm2\'s A1-1', 'hm2', () => materialize(fuzz('../hm2/A1-1'), path.join(ROOT, 'hm2')), { path: 'hm2/Synthetic.pbip', arabicMonth: false }, true],
  ['T15 the fitting shapes, their own report', 't15', () => fitProject(path.join(ROOT, 't15')), { path: 't15/Twin Sales.pbip', arabicMonth: false }, FIT_AR],
  ['T16 the fitting shapes, both languages in one report', 't16', () => fitProject(path.join(ROOT, 't16')), { path: 't16/Twin Sales.pbip', arabicMonth: false, into: 'same' }, FIT_AR],
  ['T17 twin-fuzz seed 20261102', 's1', () => materialize(generate(20261102), path.join(ROOT, 's1')), { path: 's1/Synthetic.pbip', arabicMonth: false }],
  ['T18 twin-fuzz seed 20261109', 's2', () => materialize(generate(20261109), path.join(ROOT, 's2')), { path: 's2/Synthetic.pbip', arabicMonth: false }]
];

export async function runCases(cases, problems) {
  const got = {}, plans = {};
  try {
    for (const [name, dir, make, args0, own] of cases) {
      fs.mkdirSync(path.join(ROOT, dir), { recursive: true }); make();
      let args = args0;
      if (!args) { const pbip = fs.readdirSync(path.join(ROOT, dir)).find((f) => f.endsWith('.pbip')); args = { path: dir + '/' + pbip, arabicMonth: false }; }
      const r = await twin(args, own === true ? null : own);
      plans[name] = r.plan.j;
      got[name] = { plan: { err: r.plan.err, t: norm(r.plan.t) }, write: r.write ? { err: r.write.err, t: norm(r.write.t) } : null, files: filesOf(path.join(ROOT, dir)) };
    }
  } catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }
  return { got, plans };
}
const hash = (x) => (x ? { err: x.err, length: x.t.length, sha256: sha(x.t) } : null);
export const summary = (got) => Object.fromEntries(Object.entries(got).map(([k, v]) => [k, { plan: hash(v.plan), write: hash(v.write), files: { count: v.files.split('\n').length - 1, sha256: sha(v.files) } }]));
