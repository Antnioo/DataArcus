// 0.3.0 D4 (the laptop's proofs of rc.1 and rc.2, Desktop 2.159, the lab's "Dense Ops"): a redesign treated a "No data"
// card laid over a chart as a visual of its own: written, the card stood BESIDE its chart as an empty panel and the
// charts were squeezed. A visual that lies over another (the same box at any z, the writer's card one layer below its
// chart; or inside it and above it: a card, a title box) is one unit with it: it moves and resizes with it, keeps its
// place relative to it, never takes a slot of its own, and the plan and the approval page name the unit once. Detected
// by geometry and z-order from the report's files, never by a text. Made-up fixture only (mcp/fixtures/twin-project
// plus the overlays added here): no employer or client data.
//   O1 the plan: each overlay in its chart's entry (overlays), never an entry of its own
//   O2 the planned places: a card on its chart's new box; a title box 16 and 8 from the chart's top left, as before
//   O3 no chart narrower than it was unless the plan says why
//   O4 the written copy: each overlay's box equals or stays inside its chart's; only allowlisted pointers changed; the
//      original byte-identical; Microsoft's validator 0 errors, check_report 0 "can break"
//   O5 the approval page: the unit on one line; no line of its own for an overlay
//   O6 no false unit: a card beside a chart, a chart inside a bigger chart but below it, a backdrop behind two charts
//   O7 a hidden overlay keeps its chart in place, with why
//   O8 the writer's panel behind a shorter table (a text box below it): one unit; the table stays inside it, never smaller
//   node test-0.3.0-redesign-overlay.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x.err ? x.t.slice(0, 500) : JSON.stringify(x.j).slice(0, 500));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => fs.writeFileSync(f, JSON.stringify(j, null, 2));
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const rels = (d) => tree(d).map((f) => path.relative(d, f).split(path.sep).join('/')).sort();
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const print = (d) => rels(d).map((r) => r + ':' + sha(fs.readFileSync(path.join(d, r)))).join('\n');
const get = (url) => new Promise((resolve) => { http.get(url, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); }).on('error', () => resolve('')); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const diff = (a, b, at = '') => {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)) return [...new Set(Object.keys(a).concat(Object.keys(b)))].flatMap((k) => diff(a[k], b[k], at + '/' + k));
  return [at];
};

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-overlay-'));
const SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
const lit = (v) => ({ expr: { Literal: { Value: v } } });
const measure = (e, m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: e } }, Property: m } }, queryRef: `${e}.${m}`, nativeQueryRef: m });
const column = (e, c) => ({ field: { Column: { Expression: { SourceRef: { Entity: e } }, Property: c } }, queryRef: `${e}.${c}`, nativeQueryRef: c });
const pos = (x, y, w, h, z) => ({ x, y, z, height: h, width: w, tabOrder: z });
// the writer's "No data" card: a new card, no title, no tooltip, no outline (pbip-page.js)
const card = (name, p, extra) => Object.assign({ $schema: SCHEMA, name, position: p, visual: { visualType: 'cardVisual', query: { queryState: { Data: { projections: [measure('Sales', 'Total Sales')] } } },
  objects: { label: [{ properties: { show: lit('false') }, selector: { id: 'default' } }], outline: [{ properties: { show: lit('false') }, selector: { id: 'default' } }], fillCustom: [{ properties: { show: lit('false') } }] },
  visualContainerObjects: { title: [{ properties: { show: lit('false') } }], visualTooltip: [{ properties: { show: lit('false') } }] } } }, extra || {});
const textbox = (name, p) => ({ $schema: SCHEMA, name, position: p, visual: { visualType: 'textbox', objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: 'Made-up title box' }] }] } }] } } });
const shape = (name, p) => ({ $schema: SCHEMA, name, position: p, visual: { visualType: 'shape', objects: { shape: [{ properties: { tileShape: lit("'rectangle'") } }] } } });
const column2 = (name, p) => ({ $schema: SCHEMA, name, position: p, visual: { visualType: 'clusteredColumnChart', query: { queryState: { Category: { projections: [column('Sales', 'Product')] }, Y: { projections: [measure('Sales', 'Total Sales')] } } } } });
const add = (dir, j) => { const d = path.join(dir, 'Twin Sales.Report/definition/pages', j.page || 'p1overview', 'visuals', j.name); delete j.page; fs.mkdirSync(d, { recursive: true }); wr(path.join(d, 'visual.json'), j); };
function project(name, extras) {
  const dir = path.join(ROOT, name);
  fs.cpSync(path.join(HERE, 'fixtures/twin-project'), dir, { recursive: true });
  extras.forEach((j) => add(dir, j));
  return dir;
}
// colRegion 40, 250, 600 x 430 (z 10000); lineMonth 660, 250, 580 x 430 (z 11000): the twin fixture's charts
const ND_COL = () => card('ndCol', pos(40, 250, 600, 430, 9500));            // below its chart, the same box (the writer's)
const ND_LINE = (extra) => card('ndLine', pos(660, 250, 580, 430, 12000), extra);   // above its chart, the same box
const TTL_LINE = () => textbox('ttlLine', pos(676, 258, 240, 36, 13000));    // a title box inside the chart, above it
const ov = project('ov', [ND_COL(), ND_LINE(), TTL_LINE()]);
const neg = project('neg', [card('cardBeside', pos(660, 20, 200, 50, 500)), column2('chartIn', pos(100, 300, 200, 200, 9000)), shape('bgShape', pos(30, 240, 1220, 450, 100))]);
const hid = project('hid', [ND_COL(), ND_LINE({ isHidden: true })]);
const tbl = project('tbl', [Object.assign(textbox('panelTbl', pos(60, 120, 900, 940, 1500)), { page: 'p2details' })]);
const ORIG = path.join(ov, 'Twin Sales.Report'), OUT = path.join(ov, 'Twin Sales redesigned.Report');
const MODEL = (n) => `${n}/Twin Sales.SemanticModel`, FROM = (n) => `${n}/Twin Sales.pbip`;

const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const s = await serverClient(ROOT, {}), w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const pageOf = (R, id) => ((R && R.pages) || []).find((p) => p.id === id) || { changes: [], notChanged: [] };
const entryOf = (pg, v) => pg.changes.concat(pg.notChanged).find((x) => x.visual === v);
const OVERLAYS = ['ndCol', 'ndLine', 'ttlLine'];
const before = print(ORIG);
try {
  // ---------- O1: the plan ----------
  const pl = await s.call('plan_layout', { path: MODEL('ov'), redesignFrom: FROM('ov') });
  const R = (pl.j && pl.j.redesign) || {}, p1 = pageOf(R, 'p1overview');
  const ovNames = (v) => ((entryOf(p1, v) || {}).overlays || []).map((o) => o.visual).sort().join();
  chk(() => !pl.err && pl.j.plan && pl.j.plan.planId, () => `O1. a plan id: ${short(pl)}`);
  chk(() => !p1.changes.concat(p1.notChanged).some((x) => OVERLAYS.includes(x.visual)), () => `O1. no overlay is an entry of its own: ${JSON.stringify(p1.changes.concat(p1.notChanged).map((x) => x.visual))}`);
  chk(() => ovNames('colRegion') === 'ndCol' && ovNames('lineMonth') === 'ndLine,ttlLine', () => `O1. each overlay is named in its chart's entry: ${JSON.stringify([entryOf(p1, 'colRegion'), entryOf(p1, 'lineMonth')])}`);
  chk(() => /ndCol/.test((entryOf(p1, 'colRegion') || {}).unit || '') && /ndLine/.test((entryOf(p1, 'lineMonth') || {}).unit || '') && /ttlLine/.test((entryOf(p1, 'lineMonth') || {}).unit || ''), () => `O1. the unit is said in one sentence: ${JSON.stringify([entryOf(p1, 'colRegion'), entryOf(p1, 'lineMonth')].map((x) => x && x.unit))}`);
  chk(() => !JSON.stringify(R).includes('Made-up title box'), () => 'O1. the title box\'s text is never in the plan');
  // ---------- O2: the planned places ----------
  const P = {}; (R.patches || []).filter((x) => x.page === 'p1overview').forEach((x) => { (P[x.visual] = P[x.visual] || {})[x.pointer.split('/').pop()] = x.to; });
  const at = (v, o) => Object.assign({}, o, P[v] || {}), O = { colRegion: [40, 250, 600, 430], ndCol: [40, 250, 600, 430], lineMonth: [660, 250, 580, 430], ndLine: [660, 250, 580, 430], ttlLine: [676, 258, 240, 36] };
  const B = (v) => { const o = O[v], b = at(v, { x: o[0], y: o[1], width: o[2], height: o[3] }); return [b.x, b.y, b.width, b.height]; };
  const want = { colRegion: [40, 248, 602, 432], ndCol: [40, 248, 602, 432], lineMonth: [658, 248, 582, 432], ndLine: [658, 248, 582, 432], ttlLine: [674, 256, 240, 36] };
  Object.entries(want).forEach(([v, b]) => chk(() => JSON.stringify(B(v)) === JSON.stringify(b), () => `O2. ${v} is planned at ${b.join(', ')}: ${B(v).join(', ')}`));
  // ---------- O3: no chart narrower without a why ----------
  const narrow = p1.changes.filter((c) => c.from && c.to && c.to.w < c.from.w && !c.narrower);
  chk(() => !narrow.length, () => `O3. a visual narrower than it was says why: ${JSON.stringify(narrow)}`);
  chk(() => B('colRegion')[2] >= 600 && B('lineMonth')[2] >= 580, () => `O3. the charts are not squeezed: ${B('colRegion')[2]}, ${B('lineMonth')[2]}`);

  // ---------- O5: the approval page ----------
  { const pw = await w.call('plan_layout', { path: MODEL('ov'), redesignFrom: FROM('ov') }), n = links().length; await w.call('approve_plan', { planId: pw.j.plan.planId }); const page = await get(await linkAt(n));
    const rows = (page.match(/<tr[\s\S]*?<\/tr>/g) || []).filter((r) => /lineMonth|colRegion|ndCol|ndLine|ttlLine/.test(r));
    chk(() => rows.some((r) => /lineMonth/.test(r) && /ndLine/.test(r) && /ttlLine/.test(r) && /moves from/.test(r)) && rows.some((r) => /colRegion/.test(r) && /ndCol/.test(r)), () => `O5. the approval page shows each unit on one line: ${rows.map((r) => r.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300)).join(' | ')}`);
    chk(() => !rows.some((r) => /ndCol|ndLine|ttlLine/.test(r) && !/colRegion|lineMonth/.test(r)), () => `O5. no line of its own for an overlay: ${rows.map((r) => r.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200)).join(' | ')}`); }

  // ---------- O4: the written copy ----------
  await s.call('approve_plan', { planId: pl.j.plan.planId });
  const out = await s.call('create_report', { path: MODEL('ov'), redesignFrom: FROM('ov'), planId: pl.j.plan.planId });
  chk(() => !out.err && out.j.written === true, () => `O4. the copy is written: ${short(out)}`);
  const box = (d, v) => { const p = rd(path.join(d, 'definition/pages/p1overview/visuals', v, 'visual.json')).position; return { x: p.x, y: p.y, w: p.width, h: p.height }; };
  if (fs.existsSync(OUT)) {
    const inside = (a, b) => a.x >= b.x - 0.01 && a.y >= b.y - 0.01 && a.x + a.w <= b.x + b.w + 0.01 && a.y + a.h <= b.y + b.h + 0.01;
    chk(() => JSON.stringify(box(OUT, 'ndCol')) === JSON.stringify(box(OUT, 'colRegion')) && JSON.stringify(box(OUT, 'ndLine')) === JSON.stringify(box(OUT, 'lineMonth')), () => `O4. each card's box is its chart's: ${JSON.stringify(['colRegion', 'ndCol', 'lineMonth', 'ndLine'].map((v) => box(OUT, v)))}`);
    chk(() => inside(box(OUT, 'ttlLine'), box(OUT, 'lineMonth')), () => `O4. the title box stays inside its chart: ${JSON.stringify([box(OUT, 'ttlLine'), box(OUT, 'lineMonth')])}`);
    const bad = [];
    rels(ORIG).forEach((r) => { const a = fs.readFileSync(path.join(ORIG, r)), b = fs.readFileSync(path.join(OUT, r)); if (a.equals(b)) return; diff(JSON.parse(a), JSON.parse(b)).forEach((p) => { if (!((/visual\.json$/.test(r) && /^\/position\/(x|y|width|height)$/.test(p)) || (r === '.platform' && /^\/(metadata\/displayName|config\/logicalId)$/.test(p)))) bad.push(r + p); }); });
    chk(() => !bad.length, () => `O4. only allowlisted pointers change: ${JSON.stringify(bad.slice(0, 10))}`);
  } else chk(() => false, () => 'O4. no copy was written');
  chk(() => print(ORIG) === before, () => 'O4. the original is byte-identical (every file\'s hash)');
  { const cli = path.join(HERE, 'node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js'), pv = spawnSync(process.execPath, [cli, 'validate', OUT], { encoding: 'utf8' });
    let vd = null; try { vd = JSON.parse(pv.stdout).data; } catch (e) { vd = null; }
    chk(() => vd && vd.errorCount === 0, () => `O4. Microsoft's validator: 0 errors on the copy: ${vd ? JSON.stringify(Object.entries(vd.diagnostics || {}).filter(([, d]) => d.severity === 'error').map(([k]) => k)) : String(pv.stdout || pv.stderr).slice(0, 300)}`); }
  { const c = await s.call('check_report', { path: 'ov/Twin Sales redesigned.pbip' }), j = c.j || {};
    chk(() => !c.err && j.validator && j.validator.ran && j.validator.errors === 0 && j.impact.kinds.canBreak.count === 0, () => `O4. check_report: 0 "can break" on the copy: ${c.err ? c.t.slice(0, 300) : JSON.stringify({ v: j.validator, canBreak: j.impact && j.impact.kinds.canBreak })}`); }

  // ---------- O6: no false unit ----------
  { const pn = await s.call('plan_layout', { path: MODEL('neg'), redesignFrom: FROM('neg') }), Rn = (pn.j && pn.j.redesign) || {}, q = pageOf(Rn, 'p1overview');
    const all = q.changes.concat(q.notChanged);
    chk(() => !pn.err && pn.j.plan && all.every((x) => !(x.overlays || []).length), () => `O6. no unit: a card beside a chart, a chart below a bigger one, a backdrop behind two charts: ${JSON.stringify(all.filter((x) => (x.overlays || []).length))}`);
    chk(() => ['cardBeside', 'chartIn', 'bgShape'].every((v) => entryOf(q, v)), () => `O6. each has its own entry: ${JSON.stringify(all.map((x) => x.visual))}`);
    chk(() => q.changes.some((x) => x.visual === 'colRegion') && q.changes.some((x) => x.visual === 'lineMonth') && q.notChanged.some((x) => x.visual === 'bgShape'), () => `O6. the charts still move, the backdrop stays: ${JSON.stringify(q.changes.map((x) => x.visual))}`); }

  // ---------- O7: a hidden overlay ----------
  { const ph = await s.call('plan_layout', { path: MODEL('hid'), redesignFrom: FROM('hid') }), Rh = (ph.j && ph.j.redesign) || {}, q = pageOf(Rh, 'p1overview');
    const lm = q.notChanged.find((x) => x.visual === 'lineMonth');
    chk(() => !ph.err && ph.j.plan && lm && /ndLine/.test(lm.why) && /hidden/.test(lm.why) && (lm.overlays || []).some((o) => o.visual === 'ndLine'), () => `O7. a hidden overlay keeps its chart in place, with why: ${JSON.stringify(lm || q)}`);
    chk(() => !(Rh.patches || []).some((x) => x.visual === 'ndLine' || x.visual === 'lineMonth'), () => `O7. neither is patched: ${JSON.stringify((Rh.patches || []).map((x) => x.visual))}`);
    chk(() => q.changes.some((x) => x.visual === 'colRegion' && (x.overlays || []).some((o) => o.visual === 'ndCol')), () => `O7. the other chart still moves with its card: ${JSON.stringify(q.changes)}`); }

  // ---------- O8: the panel behind a table ----------
  { const pt = await s.call('plan_layout', { path: MODEL('tbl'), redesignFrom: FROM('tbl') }), Rt = (pt.j && pt.j.redesign) || {}, q = pageOf(Rt, 'p2details');
    const e = entryOf(q, 'panelTbl'), T = {}, Pn = {}; (Rt.patches || []).forEach((x) => { const o = x.visual === 'tblProducts' ? T : x.visual === 'panelTbl' ? Pn : null; if (o) o[x.pointer.split('/').pop()] = x.to; });
    const t = Object.assign({ x: 60, y: 120, width: 900, height: 900 }, T), pn = Object.assign({ x: 60, y: 120, width: 900, height: 940 }, Pn);
    chk(() => !pt.err && pt.j.plan && e && (e.overlays || []).some((o) => o.visual === 'tblProducts') && !entryOf(q, 'tblProducts'), () => `O8. the panel and its table are one entry: ${JSON.stringify(q.changes.concat(q.notChanged).map((x) => [x.visual, (x.overlays || []).map((o) => o.visual)]))}`);
    chk(() => t.x >= pn.x && t.y >= pn.y && t.x + t.width <= pn.x + pn.width && t.y + t.height <= pn.y + pn.height && t.width >= 900 && t.height >= 900, () => `O8. the table stays inside its panel and never gets smaller: ${JSON.stringify({ t, pn })}`); }
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }
await s.close(); await w.close();
fs.rmSync(ROOT, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL  redesign-overlay  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  redesign-overlay  ${checks} checks`);
