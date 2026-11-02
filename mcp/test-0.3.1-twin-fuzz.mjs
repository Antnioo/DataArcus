import './test-env.mjs';
// 0.3.1 MX6 (the reviewer's brief of 2 Nov; mcp/work/MX6.md; written red first on 0f47f4cb). The fastest checks of
// Codex's twin-fuzz lab (evidence/0.3.1-fuzz, never merged: fuzz.mjs, METHOD.md, SUITE-PROPOSAL.md items 1-2 and 3 in
// part), ported: its six reduced cases (mcp/fixtures/twin-fuzz/<case>.json, the lab's spec.json, made up) and 25 fixed
// generated reports (the lab's generator, seeds 20261102..20261126), each through the real plan / approve / write flow
// (the tool's own handler; the approval given as the window's click gives it). Per input:
//   W   the approved twin is written
//   V1  Microsoft's validator (offline, as mcp/lib/artifact.mjs) finds no error code in the twin the original lacks
//   V2  every written visual.json has a $schema
//   B1  every written box (its parent groups added) inside its page; a visual in a group inside the group
//   M1  every English visual's twin box is its exact mirror (x reflected in its page or group, y, width, height), unless
//       the page is kept left to right or the plan names it by page/visual (fitted, movedByRule, keptTogether,
//       keptInView, pictureChecks, cannot, the heatmap names in mirrors; a button's underline in its fitted entry, withLine)
// And the three bugs by name: B1-1 (a chart pushed off the page when a button borrows a slicer's width), B1-3 (a bar
// kept over a table past the page edge), M1-1 (a neighbour moved by the button fitting, the plan silent); and N5 (made
// up here): a button's underline widened with it is named in the button's own fitted entry (withLine). N6-N9 (MX8): the night
// lab's B2new-1 and B2new-8, a chart lined up with a heatmap's grid kept off a visual it did not overlap in English;
// N10: B2new-2's new overlap (another rule) reaches pictureChecks.newOverlaps on a page with no picture.
// Not here (the lab's strict properties, not bugs, per the brief): B2 overlaps, B3's 60 px floor, D1 raw bytes, P1.
// Metadata only: no model rows, measures are BLANK().   node test-0.3.1-twin-fuzz.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fuzz-')));
process.env.DATAARCUS_ROOT = ROOT;

const Plans = await import('./lib/plans.mjs');
const { register } = await import('./tools/create_arabic_twin.mjs');
const { runReportValidation, getMetadataProvider } = await import('@microsoft/powerbi-report-authoring-cli');
const provider = await getMetadataProvider();
let handler = null;
register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = h; } }, {});
const call = async (a) => { const r = await handler(a), t = (r.content || []).map((c) => c.text || '').join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* a refusal's words */ } return { err: !!r.isError, t, j }; };

// ---- the lab's generator (fuzz.mjs: visual, rng, generate) and materialize, as they are ----
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
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
async function validate(reportDir, pbipPath) {
  const r = await runReportValidation({ reportDir, defDir: path.join(reportDir, 'definition'), provider, skipSchema: true, pbipPath });
  return Object.entries(r.diagnostics || {}).filter(([, d]) => d.severity === 'error' && d.items && d.items.length).map(([code]) => code);
}
// a box on its page: its parent groups' offsets added
const absolute = (v, all) => { const b = Object.assign({}, v.position); let p = v.parentGroupName; const seen = new Set();
  while (p != null && !seen.has(p)) { seen.add(p); const g = all.find((x) => x.name === p); if (!g) break; b.x += g.position.x; b.y += g.position.y; p = g.parentGroupName; } return b; };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// named by the plan: the page kept left to right, or page/visual as a whole token in what the plan says it changed
function named(plan, pg, v) {
  if ((plan.pages || []).some((p) => p && p.id === pg && p.leftToRight)) return true;
  const said = JSON.stringify({ mirrors: (plan.mirrors || []).filter((x) => x && x.kind === 'heatmapNames'), cannot: plan.cannot, movedByRule: plan.movedByRule, keptTogether: plan.keptTogether, keptInView: plan.keptInView, pictureChecks: plan.pictureChecks, fitted: plan.fitted });
  return new RegExp(esc(pg + '/' + v) + '(?=[^A-Za-z0-9_]|$)').test(said) || Object.values(plan.fitted || {}).flat().some((x) => x && x.page === pg && (x.visual === v || (Array.isArray(x.withLine) && x.withLine.includes(v))));
}

const runs = [];
for (const f of fs.readdirSync(path.join(HERE, 'fixtures/twin-fuzz')).filter((n) => n.endsWith('.json')).sort()) runs.push({ name: f.replace(/\.json$/, ''), spec: JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures/twin-fuzz', f), 'utf8')) });
for (let i = 0; i < 25; i++) runs.push({ name: 'seed' + (20261102 + i), spec: generate(20261102 + i) });
// (made up here) a narrow button with its underline just under it: the line widens with it, named in its entry (N5)
{ const b = visual('actionButton', 1), u = visual('shape', 2);
  b.position = { x: 600, y: 100, width: 60, height: 40, z: 1000, tabOrder: 1000 }; u.position = { x: 600, y: 142, width: 60, height: 3, z: 2000, tabOrder: 2000 };
  runs.push({ name: 'line', spec: { pages: [{ id: 'p0', width: 1280, height: 720, visuals: [b, u] }] } }); }

const t0 = Date.now(), at = {};
try {
  for (const run of runs) {
    const { name, spec } = run;
    let r = null;
    try { r = await writeTwin(spec, name); } catch (e) { r = { error: String(e && e.message || e) }; }
    chk(() => !r.error && !r.w.err && r.w.j && r.w.j.written, () => `W ${name}. the approved twin is written: ${r.error || r.w.t.slice(0, 300)}`);
    if (r.error || r.w.err) { checks += 4; problems.push(`${name}: V1, V2, B1, M1 not run (nothing written)`); continue; }
    const enDir = path.join(r.dir, 'Synthetic.Report'), arDir = path.join(r.dir, 'Synthetic AR.Report');
    const en = await validate(enDir, path.join(r.dir, 'Synthetic.pbip')), ar = await validate(arDir, path.join(r.dir, 'Synthetic AR.pbip'));
    chk(() => ar.every((c) => en.includes(c)), () => `V1 ${name}. the validator's error codes the twin has and the original lacks: ${ar.filter((c) => !en.includes(c)).join(', ')}`);
    const files = tree(path.join(arDir, 'definition/pages')).filter((x) => x.endsWith('visual.json')).map((x) => ({ rel: path.relative(path.join(arDir, 'definition/pages'), x).split(path.sep), json: JSON.parse(fs.readFileSync(x, 'utf8')) }));
    chk(() => files.length && files.every((x) => typeof x.json.$schema === 'string' && x.json.$schema), () => `V2 ${name}. visuals without $schema: ${files.filter((x) => !x.json.$schema).map((x) => x.rel.join('/')).join(', ')}`);
    const out = [], moved = [];
    for (const pg of spec.pages) {
      const av = files.filter((x) => x.rel[0] === pg.id).map((x) => x.json), byName = new Map(av.map((v) => [v.name, v]));
      at[name + '/' + pg.id] = byName;
      for (const v of av) {
        const b = absolute(v, av), g = v.parentGroupName != null ? byName.get(v.parentGroupName) : null;
        if (b.x < -0.5 || b.y < -0.5 || b.x + b.width > pg.width + 0.5 || b.y + b.height > pg.height + 0.5) out.push(`${pg.id}/${v.name} at ${JSON.stringify([b.x, b.y, b.width, b.height])} on ${pg.width} x ${pg.height}`);
        else if (g && (v.position.x < -0.5 || v.position.y < -0.5 || v.position.x + v.position.width > g.position.width + 0.5 || v.position.y + v.position.height > g.position.height + 0.5)) out.push(`${pg.id}/${v.name} outside its group ${g.name}`);
      }
      for (const e of pg.visuals) {
        const a = byName.get(e.name); if (!a) { moved.push(`${pg.id}/${e.name} missing`); continue; }
        if (named(r.plan, pg.id, e.name)) continue;
        const parent = pg.visuals.find((x) => x.name === e.parentGroupName), W = parent ? parent.position.width : pg.width;
        if (Math.abs(W - a.position.x - a.position.width - e.position.x) > 0.5 || Math.abs(a.position.y - e.position.y) > 0.5 || Math.abs(a.position.width - e.position.width) > 0.5 || Math.abs(a.position.height - e.position.height) > 0.5)
          moved.push(`${pg.id}/${e.name} English ${JSON.stringify([e.position.x, e.position.y, e.position.width, e.position.height])} Arabic ${JSON.stringify([a.position.x, a.position.y, a.position.width, a.position.height])} mirror x ${W - e.position.x - e.position.width}`);
      }
    }
    chk(() => !out.length, () => `B1 ${name}. visuals outside their page or group: ${out.join('; ')}`);
    chk(() => !moved.length, () => `M1 ${name}. boxes off their exact mirror the plan does not name: ${moved.join('; ')}`);
    run.plan = r.plan;
  }
  const plan = (n) => (runs.find((x) => x.name === n) || {}).plan || {}, box = (n, pg, v) => { const m = at[n + '/' + pg]; return m && m.get(v) ? m.get(v).position : null; };
  const said = (n, w) => (plan(n).movedByRule || []).some((x) => x.where === w);
  // the three bugs by name (red on 0f47f4cb: x -59, x -57, the group at 312 and not said)
  chk(() => { const b = box('B1-1', 'p0', 'v7'); return b && b.x >= 0 && b.x + b.width <= 1280; }, () => `N1. B1-1: the column chart beside the slicer stays on its page when the button is fitted: ${JSON.stringify(box('B1-1', 'p0', 'v7'))}`);
  chk(() => { const b = box('B1-3', 'p0', 'v5'); return b && b.x >= 0 && b.x + b.width <= 1280; }, () => `N2. B1-3: the bar kept over the table stays on its page: ${JSON.stringify(box('B1-3', 'p0', 'v5'))}`);
  chk(() => said('B1-3', 'p0/v5'), () => `N3. B1-3: the plan names the bar (movedByRule): ${JSON.stringify(plan('B1-3').movedByRule)}`);
  chk(() => said('M1-1', 'p0/v15'), () => `N4. M1-1: the plan names the group the button's fitting moved (movedByRule): ${JSON.stringify(plan('M1-1').movedByRule)}`);
  const lb = box('line', 'p0', 'v1'), lu = box('line', 'p0', 'v2'), le = ((plan('line').fitted || {}).buttons || []).find((x) => x.visual === 'v1');
  chk(() => lb && lu && lb.width > 60 && lu.x === lb.x && lu.width === lb.width && le && JSON.stringify(le.withLine) === '["v2"]', () => `N5. a button's underline widens with it and is named in its fitted entry (withLine): ${JSON.stringify([lb, lu, le])}`);
  // (0.3.1 MX8) the night lab's B2new-1 and B2new-8 (on a6000a27): a chart lined up with a heatmap's grid moved onto a
  // visual it did not overlap in English (B2new-8: a group); now kept at its mirror and said (red on a6000a27 first)
  const abs = (n, pg, v, en) => { const vs = en ? new Map(((runs.find((x) => x.name === n) || {}).spec.pages.find((p) => p.id === pg) || { visuals: [] }).visuals.map((y) => [y.name, y])) : at[n + '/' + pg];
    const o = vs && vs.get(v); if (!o) return null; const b = { x: o.position.x, y: o.position.y, w: o.position.width, h: o.position.height };
    let g = o.parentGroupName, d = 0; while (g && vs.get(g) && d++ < 10) { b.x += vs.get(g).position.x; b.y += vs.get(g).position.y; g = vs.get(g).parentGroupName; } return b; };
  const meet = (p, q) => p && q ? Math.max(0, Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x)) * Math.max(0, Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y)) : -1;
  [['B2new-1', 'v8', 'v15', 'v8'], ['B2new-8', 'v5', 'v17', 'v17']].forEach(([n, a, b, chart], k) => {
    chk(() => meet(abs(n, 'p0', a, true), abs(n, 'p0', b, true)) === 0 && meet(abs(n, 'p0', a), abs(n, 'p0', b)) === 0, () => `N${6 + 2 * k}. ${n}: ${a} and ${b} do not overlap in English, nor in the twin: ${JSON.stringify([abs(n, 'p0', a), abs(n, 'p0', b)])}`);
    chk(() => (plan(n).movedByRule || []).some((x) => x.where === 'p0/' + chart && /kept at its mirror/.test(x.rule)), () => `N${7 + 2 * k}. ${n}: the plan says why ${chart} is not lined up with its heatmap's grid: ${JSON.stringify(plan(n).movedByRule)}`);
  });
  // (MX8) a new overlap from another rule (B2new-2: a widened button's row moves a column onto a chart; on both heads)
  // reaches pictureChecks.newOverlaps on a page with no picture (only pages drawn on a picture were checked)
  chk(() => ((plan('B2new-2').pictureChecks || {}).newOverlaps || []).some((x) => x.where === 'p0: v5, v6'), () => `N10. B2new-2: pictureChecks.newOverlaps names v5 and v6: ${JSON.stringify(plan('B2new-2').pictureChecks)}`);
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }

const secs = ((Date.now() - t0) / 1000).toFixed(1);
fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-twin-fuzz.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((x) => console.log('  - ' + x)); console.log(`FAIL  twin-fuzz  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  twin-fuzz  ${checks} checks (${runs.length} reports, ${secs} s)`);
