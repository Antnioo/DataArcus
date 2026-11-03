import './test-env.mjs';
// 0.3.2 SP19 (the split: B-280, B-286; mcp/work/SP19.md). A characterisation suite for the redesign's grid fitting
// (lib/redesign-grid.mjs after SP19: the geometry, the D4 units and gridPage, moved out of lib/redesign.mjs). For 10
// made-up reports (copies of fixtures/twin-project with pages added here), planRedesign's answer is the one recorded on
// the base (integration/0.3.2 763632d, before the move): its problems, every patch (page, visual, file, pointer, from,
// to), every page entry (changes with from, to and narrower; notChanged with why; margins), verbatim, and the whole
// answer's sha256 and length. Recorded in fixtures/sp19-redesign.json; SP19_RECORD=1 records them again (only on the
// base, never to make a run pass). The logical id is fixed, so nothing in a plan is random.
//   C1   the twin as it is (groups, buttons, a page navigator, a custom visual, a tooltip page)
//   C2   overlays: a "No data" card one z below its chart in the same box; a title box laid on a chart
//   C3   a panel behind one chart (one unit) and a backdrop behind three charts (not a unit)
//   C4   a card laid over a custom visual (the unit keeps its place)
//   C5   a page already on the grid
//   C6   a page too full: a table that would get smaller, rows past the page's bottom
//   C7   two pages, each with a visual id used twice
//   C8   a 1920 x 1080 page: rows touching, a shape beside a row (the margin sentence)
//   C9   a group among native visuals, and a hidden visual
//   C10  titles, a restyle and consistentText "report" on a page with overlapping rows
//   node test-0.3.2-sp19.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'sp19-redesign.json');
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp19-')));
process.env.DATAARCUS_ROOT = ROOT;
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); };
// (sp1's lesson: CI's Windows checkout writes CRLF, the copy's digest is over the original's bytes) LF copies
const lf = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) return lf(f);
  const b = fs.readFileSync(f); if (!b.includes(0) && b.includes(13)) fs.writeFileSync(f, b.toString('utf8').replace(/\r\n/g, '\n')); });

const TW = path.join(HERE, 'fixtures', 'twin-project', 'Twin Sales.Report', 'definition', 'pages');
const T = { chart: rd(path.join(TW, 'p1overview/visuals/colRegion/visual.json')), card: rd(path.join(TW, 'p1overview/visuals/cardSales/visual.json')),
  table: rd(path.join(TW, 'p2details/visuals/tblProducts/visual.json')), textbox: rd(path.join(TW, 'p1overview/visuals/title/visual.json')),
  custom: rd(path.join(TW, 'p2details/visuals/customGauge/visual.json')) };
const SCHEMA = T.chart.$schema;
// a made-up visual: [name, kind, x, y, w, h, z, extra]; kind is a template (chart, card, table, textbox, custom), a
// visual type on the chart template (lineChart, ...), 'shape', or 'group'
function visual([name, kind, x, y, w, h, z, extra]) {
  const position = { x, y, z, height: h, width: w, tabOrder: z };
  let j;
  if (kind === 'group') j = { $schema: SCHEMA, name, position, visualGroup: { displayName: name, groupMode: 'ScaleMode' } };
  else if (kind === 'shape') j = { $schema: SCHEMA, name, position, visual: { visualType: 'shape', objects: {} } };
  else { const t = T[kind] || T.chart; j = JSON.parse(JSON.stringify(t)); j.name = name; j.position = position; delete j.parentGroupName; if (!T[kind]) j.visual.visualType = kind; }
  return Object.assign(j, extra || {});
}
// a case: a copy of the twin with pages added ([id, w, h, visuals]) and its order; folder names may repeat a visual's
// name (the JSON "name" is the id), so each visual file is in a folder of its own
function makeCase(dir, pages, edit) {
  fs.cpSync(path.join(HERE, 'fixtures', 'twin-project'), path.join(ROOT, dir), { recursive: true });
  const P = path.join(ROOT, dir, 'Twin Sales.Report', 'definition', 'pages');
  pages.forEach(([id, w, h, vs, more]) => {
    wr(path.join(P, id, 'page.json'), Object.assign({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: id, displayName: 'Page ' + id, displayOption: 'FitToPage', width: w, height: h }, more || {}));
    vs.forEach((v, k) => wr(path.join(P, id, 'visuals', `v${String(k).padStart(2, '0')}`, 'visual.json'), visual(v)));
  });
  if (pages.length) { const f = path.join(P, 'pages.json'), j = rd(f); j.pageOrder = j.pageOrder.concat(pages.map((p) => p[0])); wr(f, j); }
  if (edit) edit(path.join(ROOT, dir, 'Twin Sales.Report', 'definition'));
  lf(path.join(ROOT, dir));
}

const CASES = [
  ['C1 the twin as it is', 'c1', [], {}],
  ['C2 overlays: a No data card under its chart, a title box on a chart', 'c2', [['pOver', 1280, 720, [
    ['chSales', 'lineChart', 40, 40, 600, 300, 2000], ['noData', 'card', 40, 40, 600, 300, 1000], ['chMargin', 'clusteredColumnChart', 660, 40, 580, 300, 3000],
    ['tbHead', 'textbox', 680, 50, 300, 40, 4000], ['chRegion', 'chart', 40, 380, 1200, 300, 5000]]]], {}],
  ['C3 a panel behind one chart, a backdrop behind three', 'c3', [['pPanels', 1280, 720, [
    ['panel', 'shape', 30, 30, 620, 320, 1000], ['chIn', 'lineChart', 40, 40, 600, 300, 2000], ['chSide', 'card', 700, 40, 540, 300, 3000],
    ['backdrop', 'shape', 20, 370, 1240, 330, 4000], ['ch1', 'chart', 40, 390, 380, 290, 5000], ['ch2', 'lineChart', 450, 390, 380, 290, 6000], ['ch3', 'areaChart', 860, 390, 380, 290, 7000]]]], {}],
  ['C4 a card laid over a custom visual', 'c4', [['pCustom', 1280, 720, [
    ['gauge', 'custom', 40, 40, 500, 300, 1000], ['onGauge', 'card', 60, 60, 200, 100, 2000], ['chBeside', 'lineChart', 580, 40, 660, 300, 3000], ['chLow', 'chart', 40, 360, 1200, 320, 4000]]]], {}],
  ['C5 a page already on the grid', 'c5', [['pGrid', 1280, 720, [
    ['g1', 'card', 16, 16, 408, 160, 1000], ['g2', 'card', 440, 16, 400, 160, 2000], ['g3', 'card', 856, 16, 408, 160, 3000],
    ['g4', 'lineChart', 16, 192, 1248, 512, 4000]]]], {}],
  ['C6 a page too full for the grid', 'c6', [['pFull', 1280, 720, [
    ['bigTable', 'table', 0, 0, 1280, 300, 1000], ['r1', 'card', 0, 310, 400, 200, 2000], ['r2', 'card', 410, 310, 400, 200, 3000], ['r3', 'lineChart', 820, 310, 460, 200, 4000],
    ['r4', 'chart', 0, 520, 640, 200, 5000], ['r5', 'areaChart', 650, 520, 630, 200, 6000], ['r6', 'card', 100, 690, 300, 120, 7000]]]], {}],
  ['C7 two pages, each with a visual id twice', 'c7', [
    ['pTwiceA', 1280, 720, [['same', 'card', 30, 30, 300, 150, 1000], ['same', 'lineChart', 360, 30, 880, 150, 2000], ['otherA', 'chart', 30, 220, 1220, 460, 3000]]],
    ['pTwiceB', 1280, 720, [['dup', 'chart', 40, 40, 560, 600, 1000], ['dup', 'chart', 640, 40, 600, 600, 2000], ['tail', 'card', 40, 660, 300, 50, 3000]]]], {}],
  ['C8 a 1920 x 1080 page: rows touching, a shape beside a row', 'c8', [['pLarge', 1920, 1080, [
    ['bar', 'shape', 0, 0, 20, 400, 1000], ['k1', 'card', 20, 0, 600, 400, 2000], ['k2', 'lineChart', 630, 0, 1290, 400, 3000],
    ['k3', 'chart', 0, 400, 960, 680, 4000], ['k4', 'table', 960, 400, 900, 600, 5000]]]], {}],
  ['C9 a group among visuals, a hidden visual', 'c9', [['pGroups', 1280, 720, [
    ['grpA', 'group', 40, 40, 500, 300, 1000], ['inA', 'card', 0, 0, 240, 140, 1100, { parentGroupName: 'grpA' }], ['inB', 'lineChart', 250, 0, 250, 300, 1200, { parentGroupName: 'grpA' }],
    ['nearGrp', 'chart', 560, 50, 680, 290, 2000], ['hiddenCh', 'areaChart', 40, 380, 600, 300, 3000, { isHidden: true }], ['lowCh', 'lineChart', 660, 380, 580, 300, 4000]]]], {}],
  ['C10 titles, a restyle and consistentText report', 'c10', [['pTitles', 1280, 720, [
    ['t1', 'chart', 20, 20, 610, 330, 1000], ['t2', 'lineChart', 600, 30, 660, 320, 2000], ['t3', 'table', 20, 370, 1240, 330, 3000]]]],
    { titles: { 'pTitles/t1': 'Sales by region', 'pTitles/t3': 'Products', 'p1overview/colRegion': 'Regions' }, restyle: { preset: 'Midnight', mode: 'dark' }, consistentText: 'report' },
    (D) => { const f = path.join(D, 'pages', 'pTitles', 'visuals', 'v01', 'visual.json'), j = rd(f);
      j.visual.objects = Object.assign({}, j.visual.objects, { labels: [{ properties: { fontSize: { expr: { Literal: { Value: '13D' } } }, fontFamily: { expr: { Literal: { Value: "'Georgia'" } } } } }] }); wr(f, j); }]
];
CASES.forEach(([, dir, pages, , edit]) => makeCase(dir, pages, edit));

const R = await import('./lib/redesign.mjs'), M = await import('./lib/model.mjs');
const norm = (t) => [ROOT, JSON.stringify(ROOT).slice(1, -1), ROOT.split(path.sep).join('/')].reduce((s, r) => s.split(r).join('<ROOT>'), String(t));
const LOGICAL = '00000000-0000-4000-8000-000000000019';
const got = {};
for (const [name, dir, , opts] of CASES) {
  const model = M.loadModel(dir), p = R.planRedesign(dir + '/Twin Sales.pbip', model, Object.assign({ logicalId: LOGICAL }, opts));
  const answer = norm(JSON.stringify(p.answer));
  got[name] = JSON.parse(norm(JSON.stringify({ problems: p.problems, patches: p.patches, pages: p.answer.pages, digest: p.digest, answer: { length: answer.length, sha256: sha(answer) } })));
}
if (process.env.SP19_DUMP) fs.writeFileSync(process.env.SP19_DUMP, JSON.stringify(got, null, 1));
if (process.env.SP19_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-sp19.mjs: planRedesign on 10 made-up reports, recorded on the base (integration/0.3.2 763632d): problems, patches and page entries verbatim, the whole answer as sha256 and length (the working folder normalised)', cases: got }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).cases;
const first = (a, b) => { const x = JSON.stringify(a), y = JSON.stringify(b); let i = 0; while (i < x.length && x[i] === y[i]) i++; return `at ${i}: now ...${x.slice(Math.max(0, i - 60), i + 80)} | recorded ...${y.slice(Math.max(0, i - 60), i + 80)}`; };
for (const [name] of CASES) chk(() => gold[name] && JSON.stringify(got[name]) === JSON.stringify(gold[name]),
  () => `${name.split(' ')[0]}. planRedesign for "${name.replace(/^C\d+ /, '')}" is the base's (problems, patches, pages, answer): ${gold[name] ? first(got[name], gold[name]) : 'not recorded'} (SP19_DUMP=<file> writes them)`);

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.2-sp19.mjs cause=${problems[0].slice(0, 300).replace(/\s+/g, ' ')}`); problems.forEach((x) => console.log('  - ' + x)); console.log(`FAIL  sp19  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp19  ${checks} checks`);
