import './test-env.mjs';
// 0.3.2 VC1 (the owner's brief of 3 Nov; mcp/work/VC1.md; written red first on 71819c3). B-305, the safe half: the
// twin's plan names each visual it turns that holds a visual calculation whose result depends on order (RUNNINGSUM,
// MOVINGAVERAGE, PREVIOUS, NEXT, FIRST, LAST, RANK), as RD2's finding RD2-D2 (rd/0.3.2-number-check, read only).
// The shape, made up, from mcp/fixtures/twin-project in os.tmpdir():
//   p1overview/lineMonth  a line chart over months with RUNNINGSUM([Total Sales])        turned: named
//   p1overview/cardOrders a card (cardVisual) of two values, one a RANK                   turned: named
//   p1overview/colRegion  a column chart, a plain measure and a calculation that only
//                         says RUNNINGSUM( inside a string (with the canary)             turned: not named
// Through the real plan / approve / write flow (the tool's handler; the click as the window gives it).
//   P1-P4  the plan names lineMonth and cardOrders by page, their functions counted, the count 2, EN and AR words
//   G1     colRegion not named (a string is no function)
//   G2     no expression text in any answer (the canary, the calculations' text)
//   G3     the written twin: the plan's build byte for byte; the three visuals turned as the mirror turns them
//   G4     the answer's size, before (no visual calculation) and after (the shape), under the cap
// Metadata only: no model rows.   node test-0.3.2-vc1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-vc1-')));
process.env.DATAARCUS_ROOT = ROOT;

const Plans = await import('./lib/plans.mjs');
const { planTwin } = await import('./lib/twin-plan.mjs');
const { twinTree } = await import('./lib/twin-write.mjs');
const { register } = await import('./tools/create_arabic_twin.mjs');
const { ANSWER_MAX } = await import('./lib/answer.mjs');
let handler = null;
register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = h; } }, {});
const call = async (a) => { const r = await handler(a), t = (r.content || []).map((c) => c.text || '').join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* a refusal's words */ } return { err: !!r.isError, t, j }; };

const CANARY = 'VC1-CANARY-7731';
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, x) => fs.writeFileSync(f, JSON.stringify(x, null, 2) + '\n');
const calc = (name, expr) => ({ field: { NativeVisualCalculation: { Language: 'dax', Expression: expr, Name: name } }, queryRef: name, nativeQueryRef: name });
const V = (dir, page, v) => path.join(dir, 'Twin Sales.Report/definition/pages', page, 'visuals', v, 'visual.json');
const EXPRS = [`RUNNINGSUM([Total Sales]) + 0 * LEN("${CANARY}")`, `RANK(DENSE, ROWS, ORDERBY([Orders], DESC)) + 0 * LEN("${CANARY}")`, `[Total Sales] * 2 + 0 * LEN("RUNNINGSUM( ${CANARY}") // PREVIOUS(`];
function make(name, withCalcs) {
  const dir = path.join(ROOT, name); fs.cpSync(path.join(HERE, 'fixtures/twin-project'), dir, { recursive: true });
  if (!withCalcs) return dir;
  { const f = V(dir, 'p1overview', 'lineMonth'), j = rd(f); j.visual.query.queryState.Y.projections.push(calc('Running total', EXPRS[0])); wr(f, j); }
  { const f = V(dir, 'p1overview', 'cardOrders'), j = rd(f); j.visual.visualType = 'cardVisual'; const qs = j.visual.query.queryState; qs.Data = { projections: qs.Values.projections.concat([calc('Order rank', EXPRS[1])]) }; delete qs.Values; wr(f, j); }
  { const f = V(dir, 'p1overview', 'colRegion'), j = rd(f); j.visual.query.queryState.Y.projections.push(calc('Doubled', EXPRS[2])); wr(f, j); }
  return dir;
}
const base = make('plain', false), shape = make('vc1', true);
const pbip = (d) => path.relative(ROOT, path.join(d, 'Twin Sales.pbip'));

// the plan, before (no visual calculation) and after (the shape)
const p0 = await call({ path: pbip(base), arabicMonth: false }), p1 = await call({ path: pbip(shape), arabicMonth: false });
const oc = p1.j ? p1.j.orderCalculations : null;
const listed = oc && Array.isArray(oc.visuals) ? oc.visuals : [];
const at = (v) => listed.find((x) => x.visual === v);
chk(() => !!at('p1overview/lineMonth') && at('p1overview/lineMonth').functions.RUNNINGSUM === 1, () => `P1 the plan names p1overview/lineMonth with RUNNINGSUM 1: ${JSON.stringify(oc)}`);
chk(() => !!at('p1overview/cardOrders') && at('p1overview/cardOrders').functions.RANK === 1, () => `P2 the plan names p1overview/cardOrders with RANK 1: ${JSON.stringify(oc)}`);
chk(() => oc.count === 2 && listed.length === 2, () => `P3 the count is 2: ${JSON.stringify(oc)}`);
chk(() => /turned right to left; it holds a running or neighbour calculation, so its numbers may differ from the original: check it in Desktop/.test(oc.en) && /[؀-ۿ]/.test(oc.ar) && /Desktop/.test(oc.ar), () => `P4 the EN and AR sentences: ${JSON.stringify(oc)}`);
chk(() => !at('p1overview/colRegion'), () => `G1 colRegion (a plain measure, RUNNINGSUM( only inside a string) is not named: ${JSON.stringify(oc)}`);
const noOc = !!p0.j && p0.j.orderCalculations === undefined;
chk(() => noOc, () => `G1b a twin with no visual calculation has no orderCalculations: ${p0.t.slice(0, 200)}`);

// approve and write the shape's twin
const id = p1.j && p1.j.plan && p1.j.plan.planId;
let w = null, P = null;
if (id) {
  Plans.approve(id, 'user-in-browser');
  P = planTwin({ path: path.join(shape, 'Twin Sales.pbip'), arabicMonth: false });
  w = await call({ path: pbip(shape), arabicMonth: false, planId: id });
}
chk(() => w && !w.err && w.j && w.j.written, () => `G3a the twin is written: ${w ? w.t.slice(0, 300) : 'no plan id: ' + p1.t.slice(0, 300)}`);
const leaks = [p0.t, p1.t, w ? w.t : ''].join('\n');
chk(() => !leaks.includes(CANARY) && !EXPRS.some((e) => leaks.includes(e)) && !/ORDERBY\(|LEN\(/.test(leaks), () => 'G2 no expression text in any answer');
// the written twin: every file the plan's build, byte for byte (the write path unchanged); the turned visuals as the mirror turns them
const files = P ? twinTree(P).files : [];
const twinDir = path.join(shape, 'Twin Sales AR.Report');
// (.platform: its logicalId is drawn per plan; the write keeps the approved plan's, so it is compared without it)
const noId = (b) => String(b).replace(/"logicalId": "[^"]*"/, '');
const diff = files.filter((x) => { if (x.path.endsWith('/.platform')) { const f = path.join(shape, x.path); return !fs.existsSync(f) || noId(x.data) !== noId(fs.readFileSync(f)); } const f = path.join(shape, x.path); return !fs.existsSync(f) || !Buffer.from(x.data).equals(fs.readFileSync(f)); }).map((x) => x.path);
chk(() => files.length > 10 && diff.length === 0, () => `G3b every written file is the plan's build byte for byte (${files.length} files): ${JSON.stringify(diff.slice(0, 5))}`);
const pageDir = path.join(shape, 'Twin Sales.Report/definition/pages/p1overview');
const names = ['lineMonth', 'cardOrders', 'colRegion'];
const before = Object.fromEntries(names.map((n) => [n, rd(path.join(pageDir, 'visuals', n, 'visual.json'))]));
chk(() => names.every((n) => { const t = rd(path.join(twinDir, 'definition/pages/p1overview/visuals', n, 'visual.json'));
  return JSON.stringify(t.visual.query) !== JSON.stringify(before[n].visual.query); }), () => 'G3c lineMonth, cardOrders and colRegion are still turned in the twin (their query\'s order as the mirror makes it)');
// the written twin's digest (its files sorted, .platform without its logicalId): the note compares it before and after
const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const H = crypto.createHash('sha256');
walk(twinDir).concat([path.join(shape, 'Twin Sales AR.pbip')]).map((f) => path.relative(shape, f).split(path.sep).join('/')).sort().forEach((rel) => { const b = fs.readFileSync(path.join(shape, rel)); H.update(rel + '\n'); H.update(rel.endsWith('/.platform') ? noId(b) : b); });
console.log('written twin digest: ' + H.digest('hex').slice(0, 16));
// the answer's size (L-1102-06)
const size0 = p0.t.length, size1 = p1.t.length;
chk(() => size1 < ANSWER_MAX && size0 < ANSWER_MAX, () => `G4 the answers under ${ANSWER_MAX}: ${size0}, ${size1}`);
console.log(`sizes: plain ${size0}, vc1 ${size1} (+${size1 - size0})`);

fs.rmSync(ROOT, { recursive: true, force: true });
problems.forEach((p) => console.log('problem: ' + String(p).slice(0, 600)));
if (problems.length) console.log(`FAIL script=vc1 cause=${problems.length} problem(s)`);
console.log(`${problems.length ? 'FAIL' : 'PASS'}  vc1  ${checks} checks`);
process.exitCode = problems.length ? 1 : 0;
