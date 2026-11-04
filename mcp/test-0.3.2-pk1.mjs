import './test-env.mjs';
// 0.3.2 PK1 (the owner D-1104-01; mcp/work/PK1.md): the redesign's patch kinds as a registry (lib/redesign-kinds.mjs),
// behaviour identical. Recorded on the base (integration/0.3.2 1691046, before the registry) in
// fixtures/pk1-redesign.json; PK1_RECORD=1 records again (only on the base, never to make a run pass). Made-up reports
// only, in os.tmpdir(); the logical id fixed, so nothing in a plan is random.
//   C1-C10  SP19's 10 made-up reports (copies of fixtures/twin-project with pages added)
//   C11 filters, an interaction, a slicer selection, a tooltip link and a bookmark's filter (opaque payloads)
//   C12 consistentText "theme" with keepPositions     C13 consistentText on a report with no theme file (the NC1 lab)
//   C14 a report with no .platform                    C15 the NC1 lab's native copy (written through the server)
//   C16 titles and a restyle on the lab's native copy
//   For each: the plan (problems, patches, the answer's sha256 and length, digest, verifyCopy's checks) and the files
//   writeRedesign writes (each path and sha256, read back from disk) are the base's.
//   R1-R12  made-up copies outside every kind are refused with the base's exact message (today's kinds' edges and the
//           planned kinds' shapes: a mobile.json added, a page added, a page background in the theme, the page order)
//   K1-K6   (after) the registry: ALLOW is the base's literal; five kinds enabled; the four planned ones have the full
//           shape and are not enabled; a sentence EN and AR each; buildCopy/verifyCopy hold no pointer of their own;
//           the module reads and writes no file
//   node test-0.3.2-pk1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'pk1-redesign.json');
const TMP = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-pk1-')));
const ROOT = path.join(TMP, 'work');
process.env.DATAARCUS_ROOT = ROOT;
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); };
// (CI's Windows checkout writes CRLF; the copy's digest is over the original's bytes) LF copies
const lf = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) return lf(f);
  const b = fs.readFileSync(f); if (!b.includes(0) && b.includes(13)) fs.writeFileSync(f, b.toString('utf8').replace(/\r\n/g, '\n')); });

// ---------- the made-up reports (C1-C10 as test-0.3.2-sp19.mjs makes them) ----------
const TW = path.join(HERE, 'fixtures', 'twin-project', 'Twin Sales.Report', 'definition', 'pages');
const T = { chart: rd(path.join(TW, 'p1overview/visuals/colRegion/visual.json')), card: rd(path.join(TW, 'p1overview/visuals/cardSales/visual.json')),
  table: rd(path.join(TW, 'p2details/visuals/tblProducts/visual.json')), textbox: rd(path.join(TW, 'p1overview/visuals/title/visual.json')),
  custom: rd(path.join(TW, 'p2details/visuals/customGauge/visual.json')) };
const SCHEMA = T.chart.$schema;
function visual([name, kind, x, y, w, h, z, extra]) {
  const position = { x, y, z, height: h, width: w, tabOrder: z };
  let j;
  if (kind === 'group') j = { $schema: SCHEMA, name, position, visualGroup: { displayName: name, groupMode: 'ScaleMode' } };
  else if (kind === 'shape') j = { $schema: SCHEMA, name, position, visual: { visualType: 'shape', objects: {} } };
  else { const t = T[kind] || T.chart; j = JSON.parse(JSON.stringify(t)); j.name = name; j.position = position; delete j.parentGroupName; if (!T[kind]) j.visual.visualType = kind; }
  return Object.assign(j, extra || {});
}
function makeCase(dir, pages, edit) {
  fs.cpSync(path.join(HERE, 'fixtures', 'twin-project'), path.join(ROOT, dir), { recursive: true });
  const P = path.join(ROOT, dir, 'Twin Sales.Report', 'definition', 'pages');
  pages.forEach(([id, w, h, vs, more]) => {
    wr(path.join(P, id, 'page.json'), Object.assign({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: id, displayName: 'Page ' + id, displayOption: 'FitToPage', width: w, height: h }, more || {}));
    vs.forEach((v, k) => wr(path.join(P, id, 'visuals', `v${String(k).padStart(2, '0')}`, 'visual.json'), visual(v)));
  });
  if (pages.length) { const f = path.join(P, 'pages.json'), j = rd(f); j.pageOrder = j.pageOrder.concat(pages.map((p) => p[0])); wr(f, j); }
  if (edit) edit(path.join(ROOT, dir, 'Twin Sales.Report'));
  lf(path.join(ROOT, dir));
}
const lit = (v) => ({ Literal: { Value: v } });
const colOf = (e, p) => ({ Column: { Expression: { SourceRef: { Entity: e } }, Property: p } });
const inFilter = (e, p, v) => ({ Version: 2, From: [{ Name: 's', Entity: e, Type: 0 }], Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: 's' } }, Property: p } }], Values: [[lit(v)]] } } }] });
const edit = (f, fn) => { const j = rd(f); fn(j); wr(f, j); };
const TWIN = (dir, pages, opts, ed) => ({ dir, report: dir + '/Twin Sales.pbip', model: dir, opts: opts || {}, make: () => makeCase(dir, pages, ed) });
const LABP = 'lab/Gulf Retail.Report', NATP = 'lab/Gulf Retail native.Report';
const CASES = [
  ['C1 the twin as it is', TWIN('c1', [])],
  ['C2 overlays: a No data card under its chart, a title box on a chart', TWIN('c2', [['pOver', 1280, 720, [
    ['chSales', 'lineChart', 40, 40, 600, 300, 2000], ['noData', 'card', 40, 40, 600, 300, 1000], ['chMargin', 'clusteredColumnChart', 660, 40, 580, 300, 3000],
    ['tbHead', 'textbox', 680, 50, 300, 40, 4000], ['chRegion', 'chart', 40, 380, 1200, 300, 5000]]]])],
  ['C3 a panel behind one chart, a backdrop behind three', TWIN('c3', [['pPanels', 1280, 720, [
    ['panel', 'shape', 30, 30, 620, 320, 1000], ['chIn', 'lineChart', 40, 40, 600, 300, 2000], ['chSide', 'card', 700, 40, 540, 300, 3000],
    ['backdrop', 'shape', 20, 370, 1240, 330, 4000], ['ch1', 'chart', 40, 390, 380, 290, 5000], ['ch2', 'lineChart', 450, 390, 380, 290, 6000], ['ch3', 'areaChart', 860, 390, 380, 290, 7000]]]])],
  ['C4 a card laid over a custom visual', TWIN('c4', [['pCustom', 1280, 720, [
    ['gauge', 'custom', 40, 40, 500, 300, 1000], ['onGauge', 'card', 60, 60, 200, 100, 2000], ['chBeside', 'lineChart', 580, 40, 660, 300, 3000], ['chLow', 'chart', 40, 360, 1200, 320, 4000]]]])],
  ['C5 a page already on the grid', TWIN('c5', [['pGrid', 1280, 720, [
    ['g1', 'card', 16, 16, 408, 160, 1000], ['g2', 'card', 440, 16, 400, 160, 2000], ['g3', 'card', 856, 16, 408, 160, 3000],
    ['g4', 'lineChart', 16, 192, 1248, 512, 4000]]]])],
  ['C6 a page too full for the grid', TWIN('c6', [['pFull', 1280, 720, [
    ['bigTable', 'table', 0, 0, 1280, 300, 1000], ['r1', 'card', 0, 310, 400, 200, 2000], ['r2', 'card', 410, 310, 400, 200, 3000], ['r3', 'lineChart', 820, 310, 460, 200, 4000],
    ['r4', 'chart', 0, 520, 640, 200, 5000], ['r5', 'areaChart', 650, 520, 630, 200, 6000], ['r6', 'card', 100, 690, 300, 120, 7000]]]])],
  ['C7 two pages, each with a visual id twice', TWIN('c7', [
    ['pTwiceA', 1280, 720, [['same', 'card', 30, 30, 300, 150, 1000], ['same', 'lineChart', 360, 30, 880, 150, 2000], ['otherA', 'chart', 30, 220, 1220, 460, 3000]]],
    ['pTwiceB', 1280, 720, [['dup', 'chart', 40, 40, 560, 600, 1000], ['dup', 'chart', 640, 40, 600, 600, 2000], ['tail', 'card', 40, 660, 300, 50, 3000]]]])],
  ['C8 a 1920 x 1080 page: rows touching, a shape beside a row', TWIN('c8', [['pLarge', 1920, 1080, [
    ['bar', 'shape', 0, 0, 20, 400, 1000], ['k1', 'card', 20, 0, 600, 400, 2000], ['k2', 'lineChart', 630, 0, 1290, 400, 3000],
    ['k3', 'chart', 0, 400, 960, 680, 4000], ['k4', 'table', 960, 400, 900, 600, 5000]]]])],
  ['C9 a group among visuals, a hidden visual', TWIN('c9', [['pGroups', 1280, 720, [
    ['grpA', 'group', 40, 40, 500, 300, 1000], ['inA', 'card', 0, 0, 240, 140, 1100, { parentGroupName: 'grpA' }], ['inB', 'lineChart', 250, 0, 250, 300, 1200, { parentGroupName: 'grpA' }],
    ['nearGrp', 'chart', 560, 50, 680, 290, 2000], ['hiddenCh', 'areaChart', 40, 380, 600, 300, 3000, { isHidden: true }], ['lowCh', 'lineChart', 660, 380, 580, 300, 4000]]]])],
  ['C10 titles, a restyle and consistentText report', TWIN('c10', [['pTitles', 1280, 720, [
    ['t1', 'chart', 20, 20, 610, 330, 1000], ['t2', 'lineChart', 600, 30, 660, 320, 2000], ['t3', 'table', 20, 370, 1240, 330, 3000]]]],
  { titles: { 'pTitles/t1': 'Sales by region', 'pTitles/t3': 'Products', 'p1overview/colRegion': 'Regions' }, restyle: { preset: 'Midnight', mode: 'dark' }, consistentText: 'report' },
  (R) => edit(path.join(R, 'definition', 'pages', 'pTitles', 'visuals', 'v01', 'visual.json'), (j) => { j.visual.objects = Object.assign({}, j.visual.objects, { labels: [{ properties: { fontSize: { expr: lit('13D') }, fontFamily: { expr: lit("'Georgia'") } } }] }); }))],
  ['C11 filters, an interaction, a slicer selection, a tooltip link, a bookmark filter', TWIN('c11', [], { titles: { 'p1overview/colRegion': 'Sales by region' } }, (R) => {
    const P = path.join(R, 'definition', 'pages');
    edit(path.join(P, 'p1overview/page.json'), (j) => { j.filterConfig = { filters: [{ name: 'pf1', field: colOf('Sales', 'Region'), type: 'Categorical', filter: inFilter('Sales', 'Region', "'North'") }] }; j.visualInteractions = [{ source: 'slRegion', target: 'lineMonth', type: 'NoFilter' }]; });
    edit(path.join(P, 'p2details/visuals/barProduct/visual.json'), (j) => { j.filterConfig = { filters: [{ name: 'vf1', field: colOf('Sales', 'Product'), type: 'TopN', filter: inFilter('Sales', 'Product', "'Widget'") }] }; });
    edit(path.join(P, 'p1overview/visuals/slRegion/visual.json'), (j) => { j.visual.objects = Object.assign({}, j.visual.objects, { general: [{ properties: { filter: { filter: inFilter('Sales', 'Region', "'South'") } } }] }); });
    edit(path.join(P, 'p1overview/visuals/lineMonth/visual.json'), (j) => { j.visual.visualContainerObjects = Object.assign({}, j.visual.visualContainerObjects, { visualTooltip: [{ properties: { type: { expr: lit("'ReportPage'") }, section: { expr: lit("'p3tooltip'") } } }] }); });
    edit(path.join(R, 'definition/bookmarks/bmReset.bookmark.json'), (j) => { j.explorationState.sections.p1overview.filters = { byExpr: [{ name: 'bf1', type: 'Categorical', expression: colOf('Sales', 'Region'), filter: inFilter('Sales', 'Region', "'East'") }] }; });
  })],
  ['C12 consistentText theme with keepPositions', TWIN('c12', [], { consistentText: 'theme', keepPositions: true })],
  ['C13 consistentText on a report with no theme file (the lab)', { dir: 'lab', report: LABP, model: 'lab', opts: { consistentText: 'report' } }],
  ['C14 a report with no .platform', TWIN('c14', [], {}, (R) => fs.rmSync(path.join(R, '.platform')))],
  ['C15 the lab\'s native copy', { dir: 'lab', report: NATP, model: 'lab', opts: {} }],
  ['C16 titles and a restyle on the lab\'s native copy (no theme file: refused)', { dir: 'lab', report: NATP, model: 'lab', opts: { restyle: { preset: 'Midnight' }, consistentText: 'report', keepPositions: true } }]
];

// ---------- the lab: written through the server (its native copy), the copy's logical id fixed ----------
fs.mkdirSync(ROOT, { recursive: true });
const { run } = await import('./lab/custom-visuals-run.mjs');
const LABW = path.join(TMP, 'labrun');
await run(path.join(HERE, 'server.mjs'), LABW);
fs.cpSync(path.join(LABW, 'lab'), path.join(ROOT, 'lab'), { recursive: true });
for (const n of ['Gulf Retail native redesigned.Report', 'Gulf Retail native redesigned.pbip']) fs.rmSync(path.join(ROOT, 'lab', n), { recursive: true });
edit(path.join(ROOT, NATP, '.platform'), (j) => { j.config.logicalId = '00000000-0000-4000-8000-0000000000c1'; });
lf(path.join(ROOT, 'lab'));
CASES.forEach(([, c]) => { if (c.make) c.make(); });

const R = await import('./lib/redesign.mjs'), M = await import('./lib/model.mjs'), RR = await import('./lib/read-report.mjs');
const norm = (t) => [ROOT, JSON.stringify(ROOT).slice(1, -1), ROOT.split(path.sep).join('/')].reduce((s, r) => s.split(r).join('<ROOT>'), String(t));
const LOGICAL = '00000000-0000-4000-8000-0000000000a1';
const walk = (d, base = d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name), base) : [path.relative(base, path.join(d, e.name)).split(path.sep).join('/')])).sort();
const got = {};
for (const [name, c] of CASES) {
  const model = M.loadModel(c.model), p = R.planRedesign(c.report, model, Object.assign({ logicalId: LOGICAL }, c.opts));
  const answer = norm(JSON.stringify(p.answer)), rec = { problems: p.problems, patches: p.patches, checks: p.answer.checks || null, digest: p.digest, answer: { length: answer.length, sha256: sha(answer) } };
  let written = null;
  if (!p.problems.length) {
    // the write, as create_report calls it after the go: the plan's patches and source pinned, the plan's files kept
    const plan = { data: { patches: p.patches, pins: { create_report: { files: { source: p.pin.files.source } } } } };
    try {
      const w = R.writeRedesign(c.report, model, plan, c.opts, { files: p.tree, digest: p.digest, logicalId: p.logicalId });
      const out = path.join(ROOT, path.dirname(c.report)), files = [path.basename(w.pbip)].concat(walk(path.join(out, w.report)).map((r) => w.report + '/' + r));
      written = { checks: w.checks, files: files.map((r) => [r, sha(fs.readFileSync(path.join(out, r)))]) };
      fs.rmSync(path.join(out, w.report), { recursive: true }); fs.rmSync(path.join(out, w.pbip));
    } catch (e) { written = { error: norm(String(e && e.message || e)) }; }
  }
  got[name] = JSON.parse(norm(JSON.stringify({ plan: rec, written })));
}

// ---------- R1-R12: made-up copies outside every kind (on C1's files), each refused ----------
const SRC = (dir) => { const d = path.join(ROOT, dir, 'Twin Sales.Report'); return Object.fromEntries(walk(d).map((r) => [r, fs.readFileSync(path.join(d, ...r.split('/')))])); };
const src = SRC('c1'), THEME = 'StaticResources/RegisteredResources/twin-theme.json', V = 'definition/pages/p1overview/visuals/colRegion/visual.json';
const J = (b) => JSON.parse(Buffer.from(b).toString('utf8')), B = (j) => Buffer.from(JSON.stringify(j, null, 2), 'utf8');
const change = (rel, fn) => { const out = Object.assign({}, src), j = J(src[rel]); fn(j); out[rel] = B(j); return out; };
const REFUSE = [
  ['R1 a visual\'s type changed', () => [change(V, (j) => { j.visual.visualType = 'lineChart'; }), [{ file: V, pointer: '/visual/visualType', to: 'lineChart' }]]],
  ['R2 a page.json changed', () => [change('definition/pages/p1overview/page.json', (j) => { j.displayName = 'Renamed'; }), [{ file: 'definition/pages/p1overview/page.json', pointer: '/displayName', to: 'Renamed' }]]],
  ['R3 report.json\'s existing theme name changed', () => [change('definition/report.json', (j) => { j.themeCollection.customTheme.name = 'other.json'; }), [{ file: 'definition/report.json', pointer: '/themeCollection/customTheme/name', to: 'other.json' }]]],
  ['R4 a theme text class changed', () => [change(THEME, (j) => { j.textClasses = { title: { fontFace: 'Georgia' } }; }), [{ file: THEME, pointer: '/textClasses/title/fontFace', to: 'Georgia' }]]],
  ['R5 .platform\'s type changed', () => [change('.platform', (j) => { j.metadata.type = 'SemanticModel'; }), [{ file: '.platform', pointer: '/metadata/type', to: 'SemanticModel' }]]],
  ['R6 a file added outside the registered resources', () => { const x = { a: 1 }, out = Object.assign({}, src, { 'definition/extra.json': B(x) }); return [out, [{ op: 'add', file: 'definition/extra.json', to: x }]]; }],
  ['R7 an added theme with a colour class', () => { const x = { name: 'DataArcusText', textClasses: { title: { color: '#FF0000' } } }, f = 'StaticResources/RegisteredResources/DataArcusText.json'; return [Object.assign({}, src, { [f]: B(x) }), [{ op: 'add', file: f, to: x }]]; }],
  ['R8 an allowlisted pointer not in the plan', () => [change(V, (j) => { j.position.x = 999; }), []]],
  ['R9 (phone) a mobile.json added', () => { const x = { $schema: SCHEMA.replace('visualContainer/', 'visualContainerMobileState/'), position: { x: 0, y: 0, z: 0, width: 300, height: 200, tabOrder: 0 } }, f = 'definition/pages/p1overview/visuals/colRegion/mobile.json'; return [Object.assign({}, src, { [f]: B(x) }), [{ op: 'add', file: f, to: x }]]; }],
  ['R10 (page) a page added and named in the page order', () => { const pg = { name: 'pNew', displayName: 'New', width: 1280, height: 720 }, f = 'definition/pages/pNew/page.json', out = change('definition/pages/pages.json', (j) => { j.pageOrder.push('pNew'); }); out[f] = B(pg); return [out, [{ op: 'add', file: f, to: pg }, { file: 'definition/pages/pages.json', pointer: '/pageOrder/3', to: 'pNew' }]]; }],
  ['R11 (season) a page background in the theme', () => { const v = [{ color: { solid: { color: '#0B3D2E' } } }]; return [change(THEME, (j) => { j.visualStyles = Object.assign({}, j.visualStyles, { page: { '*': { background: v } } }); }), [{ file: THEME, pointer: '/visualStyles/page/*/background', to: v }]]; }],
  ['R12 (page) the page order changed, no page added', () => [change('definition/pages/pages.json', (j) => { j.pageOrder.reverse(); }), [{ file: 'definition/pages/pages.json', pointer: '/pageOrder/0', to: 'p3tooltip' }]]]
];
const refused = {};
for (const [name, mk] of REFUSE) {
  let msg = 'accepted';
  try { const [out, patches] = mk(); R.verifyCopy(src, out, patches, THEME); } catch (e) { msg = String(e && e.message || e); }
  refused[name] = msg;
}

if (process.env.PK1_DUMP) fs.writeFileSync(process.env.PK1_DUMP, JSON.stringify({ cases: got, refused }, null, 1));
if (process.env.PK1_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-pk1.mjs: 16 redesigns (plan: problems, patches, verifyCopy checks, digest, the answer as sha256 and length; the files writeRedesign writes, each sha256) and 12 made-up copies refused (the exact message), recorded on the base (integration/0.3.2 1691046, before the registry); the working folder normalised', cases: got, refused }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8'));
const first = (a, b) => { const x = JSON.stringify(a), y = JSON.stringify(b); let i = 0; while (i < x.length && x[i] === y[i]) i++; return `at ${i}: now ...${x.slice(Math.max(0, i - 60), i + 80)} | recorded ...${y.slice(Math.max(0, i - 60), i + 80)}`; };
for (const [name] of CASES) {
  const g = gold.cases[name];
  chk(() => g && JSON.stringify(got[name].plan) === JSON.stringify(g.plan), () => `${name.split(' ')[0]} plan. planRedesign for "${name.replace(/^C\d+ /, '')}" is the base's (problems, patches, checks, digest, answer): ${g ? first(got[name].plan, g.plan) : 'not recorded'} (PK1_DUMP=<file> writes them)`);
  chk(() => g && JSON.stringify(got[name].written) === JSON.stringify(g.written), () => `${name.split(' ')[0]} write. writeRedesign for "${name.replace(/^C\d+ /, '')}" writes the base's files (each sha256) and checks: ${g ? first(got[name].written, g.written) : 'not recorded'}`);
}
for (const [name] of REFUSE) chk(() => /^Nothing was written: the copy check found /.test(refused[name]) && refused[name] === gold.refused[name],
  () => `${name.split(' ')[0]}. "${name.replace(/^R\d+ /, '')}" is refused with the base's message: now "${refused[name]}", recorded "${gold.refused[name]}"`);

// ---------- K1-K6 (after PK1): the registry ----------
// the base's literal ALLOW (redesign.mjs:121 at 1691046), regex for regex, in its order
const TP = (await import('./lib/text-format.mjs'));
const BASE_ALLOW = {
  visual: [String.raw`^\/position\/(x|y|width|height)$`, String.raw`^\/visual\/visualContainerObjects\/title\/\d+\/properties\/text\/expr\/Literal\/Value$`, TP.TEXT_POINTER.source],
  platform: [String.raw`^\/metadata\/displayName$`, String.raw`^\/config\/logicalId$`],
  theme: [new RegExp(`^/(${['dataColors', 'foreground', 'background', 'tableAccent', 'good', 'neutral', 'bad'].join('|')})(/\\d+)?$`).source, TP.THEME_STYLE_AT.source],
  report: [String.raw`^\/themeCollection\/customTheme\/(name|reportVersionAtImport|type)$`, String.raw`^\/resourcePackages\/\d+\/(name|type)$`, String.raw`^\/resourcePackages\/\d+\/items\/\d+\/(name|path|type)$`]
};
let K = null; try { K = await import('./lib/redesign-kinds.mjs'); } catch (e) { K = null; }
const srcOf = (f) => fs.readFileSync(path.join(HERE, 'lib', f), 'utf8');
chk(() => K && JSON.stringify(Object.fromEntries(Object.entries(K.ALLOW).map(([f, l]) => [f, l.map((re) => re.source + '/' + re.flags)]))) === JSON.stringify(Object.fromEntries(Object.entries(BASE_ALLOW).map(([f, l]) => [f, l.map((s) => s + '/')]))),
  () => `K1. the registry's ALLOW is the base's literal, regex for regex: ${K ? JSON.stringify(Object.fromEntries(Object.entries(K.ALLOW).map(([f, l]) => [f, l.map(String)]))).slice(0, 400) : 'no lib/redesign-kinds.mjs'}`);
const TODAY = ['grid', 'titles', 'themeTokens', 'copyName', 'consistentText'], PLANNED = ['season', 'phone', 'page', 'tidy'];
chk(() => K && JSON.stringify(K.KINDS.map((k) => k.name)) === JSON.stringify(TODAY) && K.KINDS.every((k) => k.enabled === true) && JSON.stringify(K.PLANNED.map((k) => k.name)) === JSON.stringify(PLANNED) && K.PLANNED.every((k) => k.enabled === false),
  () => `K2. five kinds enabled (${TODAY}), the four planned ones not: ${K ? JSON.stringify([K.KINDS.map((k) => [k.name, k.enabled]), K.PLANNED.map((k) => [k.name, k.enabled])]) : 'no module'}`);
chk(() => K && K.KINDS.concat(K.PLANNED).every((k) => !K.shapeProblems(k).length) && K.shapeProblems({ name: 'x' }).length > 0,
  () => `K3. every kind, the planned ones too, has the full shape (name, changes or adds with their files and pointers, validators as functions, a sentence EN and AR): ${K ? JSON.stringify(K.KINDS.concat(K.PLANNED).map((k) => [k.name, K.shapeProblems(k)])) : 'no module'}`);
chk(() => K && K.KINDS.concat(K.PLANNED).every((k) => k.said.en.length > 20 && /[؀-ۿ]/.test(k.said.ar) && !/[—]/.test(k.said.en + k.said.ar)) && K.sentenceOf('grid', 'ar') === K.KINDS[0].said.ar && K.sentenceOf('phone', 'en') === null,
  () => `K4. each kind's plan sentence in English and Arabic (no em dash); sentenceOf names only an enabled kind: ${K ? JSON.stringify(K.KINDS.map((k) => k.said)).slice(0, 300) : 'no module'}`);
// buildCopy and verifyCopy hold no pointer, file pattern or kind name of their own: they read the registry
const body = (s, fn) => { const i = s.indexOf(`export function ${fn}(`); let d = 0, j = s.indexOf('{', i); for (let k = j; k < s.length; k++) { if (s[k] === '{') d++; else if (s[k] === '}' && !--d) return s.slice(i, k + 1); } return ''; };
chk(() => { const s = srcOf('redesign.mjs'), b = body(s, 'buildCopy') + body(s, 'verifyCopy'); return b.length > 500 && !/logicalId'|RegisteredResources|'report'|'theme'|ALLOW\b|kind === '/.test(b) && !/^const ALLOW = /m.test(s) && /from '\.\/redesign-kinds\.mjs'/.test(s); },
  () => 'K5. buildCopy and verifyCopy name no pointer, file pattern or file kind of their own (they read lib/redesign-kinds.mjs), and redesign.mjs keeps no ALLOW literal');
chk(() => { const s = srcOf('redesign-kinds.mjs'); return !/from 'node:(fs|path|child_process)'|writeTree|readFileSync|writeFileSync/.test(s); },
  () => 'K6. lib/redesign-kinds.mjs reads and writes no file');

fs.rmSync(TMP, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.2-pk1.mjs cause=${problems[0].slice(0, 300).replace(/\s+/g, ' ')}`); problems.forEach((x) => console.log('  - ' + x)); console.log(`FAIL  pk1  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  pk1  ${checks} checks`);
