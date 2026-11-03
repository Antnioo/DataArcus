// RD6 scratch: the twin-fuzz lab's generator and twin flow, extracted as they are from mcp/test-0.3.1-twin-fuzz.mjs
// (lines 44-144 on integration/0.3.2) by the command in the RD6 note; made-up reports only, written under ROOT
// (os.tmpdir()). Set process.env.DATAARCUS_ROOT before importing this module.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const ROOT = process.env.DATAARCUS_ROOT;
const Plans = await import('../../lib/plans.mjs');
const { register } = await import('../../tools/create_arabic_twin.mjs');
let handler = null;
register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = h; } }, {});
const call = async (a) => { const r = await handler(a), t = (r.content || []).map((c) => c.text || '').join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* a refusal */ } return { err: !!r.isError, t, j }; };
const put = (f, x) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof x === 'string' ? x : JSON.stringify(x, null, 2) + '\n'); };
const schema = (s) => 'https://developer.microsoft.com/json-schemas/fabric/' + s + '/schema.json';
const VS = schema('item/report/definition/visualContainer/2.1.0');
const L = (v) => ({ expr: { Literal: { Value: String(v) } } });
const Q = (s) => L("'" + s + "'");
const obj = (p) => [{ properties: p }];
const col = (n) => ({ field: { Column: { Expression: { SourceRef: { Entity: 'Synthetic' } }, Property: n } }, queryRef: 'Synthetic.' + n, nativeQueryRef: n });
const mea = (n = 'Metric') => ({ field: { Measure: { Expression: { SourceRef: { Entity: 'Synthetic' } }, Property: n } }, queryRef: 'Synthetic.' + n, nativeQueryRef: n });
const query = (roles) => ({ queryState: Object.fromEntries(Object.entries(roles).map(([r, p]) => [r, { projections: p }])) });
const TYPES = ['card', 'textbox', 'tableEx', 'flatMatrix', 'groupedMatrix', 'heatmap', 'clusteredBarChart', 'clusteredColumnChart', 'lineChart', 'areaChart', 'donutChart', 'slicer', 'actionButton', 'shape', 'image', 'group'];
function visual(kind, n) {
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
    a.query = query(matrix ? { Rows: kind === 'groupedMatrix' ? [col('Category'), col('Group')] : [col(kind === 'heatmap' ? 'Weekday' : 'Category')], ...(kind === 'heatmap' ? { Columns: [col('Hour')] } : {}), Values: [mea()] }
      : ['card', 'slicer', 'tableEx'].includes(kind) ? { Values: kind === 'card' ? [mea()] : kind === 'slicer' ? [col('Category')] : [col('Category'), mea()] }
        : { Category: [col(['clusteredColumnChart', 'lineChart', 'areaChart'].includes(kind) ? 'Date' : 'Category')], Y: [mea()], ...(kind === 'donutChart' ? { Series: [col('Group')] } : {}) });
    a.objects = matrix ? { subTotals: obj({ rowSubtotals: L('false'), columnSubtotals: L('false') }), grid: obj({ textSize: L('10D') }) } : kind === 'donutChart' ? { legend: obj({ show: L('true'), position: Q('Right') }) } : {};
    if (['lineChart', 'areaChart', 'clusteredColumnChart'].includes(kind)) a.query.sortDefinition = { sort: [{ field: col('Date').field, direction: 'Ascending' }], isDefaultSort: true };
    if (kind !== 'heatmap') a.visualContainerObjects = { title: obj({ show: L('true'), text: Q('Synthetic title') }) };
  }
  return v;
}
function rng(seed) { let x = seed >>> 0; return () => { x += 0x6D2B79F5; let t = x; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function generate(seed) {
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
function modelFor(spec) {
  const fields = new Map([['Category', 'string'], ['Group', 'string'], ['Weekday', 'string'], ['Hour', 'int64'], ['Date', 'dateTime']]), measures = new Set(['Metric']);
  const walk = (x) => { if (!x || typeof x !== 'object') return; if (x.Column && x.Column.Property) fields.set(x.Column.Property, /Date/.test(x.Column.Property) ? 'dateTime' : 'string'); if (x.Measure && x.Measure.Property) measures.add(x.Measure.Property); Object.values(x).forEach(walk); };
  walk(spec);
  return { compatibilityLevel: 1567, model: { culture: 'en-US', tables: [{ name: 'Synthetic', columns: [...fields].map(([name, dataType]) => ({ name, dataType, sourceColumn: name })), measures: [...measures].map((name) => ({ name, expression: 'BLANK()' })), partitions: [{ name: 'Synthetic', mode: 'import', source: { type: 'm', expression: 'let Source = #table({}, {}) in Source' } }] }] } };
}
function materialize(spec, dir) {
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

// ---- the real flow: the texts listed page by page, an Arabic for each, the plan, the click, the write ----
const ARABIC = ['عنوان عربي', 'عنوان عربي تجريبي', 'عنوان عربي تجريبي طويل'];
// (the lab's own choice: the text's sha-256, its first 4 hex digits, mod 3)
const arabicFor = (s) => ARABIC[parseInt(crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 4), 16) % 3];
async function writeTwin(spec, name) {
  const dir = path.join(ROOT, name); fs.mkdirSync(dir); materialize(spec, dir);
  const base = { path: name + '/Synthetic.pbip', arabicMonth: false }, labels = {};
  let from = 0, last = -1;
  do {
    const p = await call(Object.assign({}, base, { textsFrom: from }));
    if (p.err || !p.j) throw new Error('plan refused: ' + p.t.slice(0, 300));
    for (const t of p.j.texts || []) { labels[t.id] = arabicFor(t.text || ''); if (t.altTextToo) labels[t.altTextToo] = labels[t.id]; }
    last = from; from = p.j.moreTexts && Number.isFinite(p.j.moreTexts.from) ? p.j.moreTexts.from : -1;
  } while (from >= 0 && from > last);
  const p = await call(Object.assign({}, base, { labels })), id = p.j && p.j.plan && p.j.plan.planId;
  if (!id) throw new Error('no plan id: ' + p.t.slice(0, 300));
  Plans.approve(id, 'user-in-browser');
  const w = await call(Object.assign({}, base, { labels, planId: id }));
  return { dir, plan: p.j, w };
}
export { generate, materialize, writeTwin };
