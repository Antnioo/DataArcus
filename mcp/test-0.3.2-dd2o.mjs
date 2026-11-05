// DD2O (0.3.2; the owner, D-1104-12, 4 Nov: "a library of functions where a place calls them so if we need to fix
// something we fix it at the source"; D-1104-18; D-1104-15: equal copies, one copy, no answer changes; D-1016-01): one
// place for two boxes overlapping. The tolerant yes or no and the shared area live in mcp/lib/box-overlap.mjs only
// (docs/CONTRACTS.md families overlap and overlap-area): two questions, two functions.
//   U1-U52   the module on 13 pairs (the contract probe's 9, then a zero-width box apart, a box exactly 0.5 px over,
//            touching corners, two zero-size boxes at one point): overlaps and overlapArea, each on both box shapes
//            ({ x, y, width, height } and { x, y, w, h }), each answer pinned (52 checks)
// Made-up boxes only.   node test-0.3.2-dd2o.mjs
import { overlaps, overlapArea } from './lib/box-overlap.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

// ---------- the inputs (the contract probe's BOXES, scripts/contracts-probe.mjs, then four more) and today's answers ----------
const BOXES = [
  { label: 'apart', a: [0, 0, 100, 100], b: [200, 0, 100, 100], overlap: false, area: 0 },
  { label: 'touching edges', a: [0, 0, 100, 100], b: [100, 0, 100, 100], overlap: false, area: 0 },
  { label: '0.4 px overlap', a: [0, 0, 100, 100], b: [99.6, 0, 100, 100], overlap: false, area: 40 },
  { label: '1 px overlap', a: [0, 0, 100, 100], b: [99, 0, 100, 100], overlap: true, area: 100 },
  { label: '1 px overlap, 3 px high (area 3)', a: [0, 0, 100, 3], b: [99, 0, 100, 3], overlap: true, area: 3 },
  { label: '3 px overlap both ways (area 9)', a: [0, 0, 100, 100], b: [97, 97, 100, 100], overlap: true, area: 9 },
  { label: 'one inside the other', a: [0, 0, 100, 100], b: [10, 10, 20, 20], overlap: true, area: 400 },
  { label: 'the same box', a: [0, 0, 100, 100], b: [0, 0, 100, 100], overlap: true, area: 10000 },
  { label: 'a zero-width box inside', a: [0, 0, 100, 100], b: [50, 10, 0, 20], overlap: true, area: 0 },
  { label: 'a zero-width box apart', a: [0, 0, 100, 100], b: [300, 10, 0, 20], overlap: false, area: 0 },
  { label: 'exactly 0.5 px over', a: [0, 0, 100, 100], b: [99.5, 0, 100, 100], overlap: false, area: 50 },
  { label: 'touching corners', a: [0, 0, 100, 100], b: [100, 100, 50, 50], overlap: false, area: 0 },
  { label: 'two zero-size boxes at one point', a: [10, 10, 0, 0], b: [10, 10, 0, 0], overlap: false, area: 0 },
];
const wh = ([x, y, w, h]) => ({ x, y, width: w, height: h }), xywh = ([x, y, w, h]) => ({ x, y, w, h });
const r2 = (n) => Math.round(n * 100) / 100;

// ---------- U: the module, each answer pinned, on both shapes ----------
let un = 0;
BOXES.forEach((x) => [['{width, height}', wh], ['{w, h}', xywh]].forEach(([shape, mk]) => {
  const o = overlaps(mk(x.a), mk(x.b)), a = overlapArea(mk(x.a), mk(x.b));
  chk(() => o === x.overlap, () => `U${un + 1}. overlaps, ${x.label}, ${shape}: ${x.overlap} pinned, got ${o}`); un++;
  chk(() => r2(a) === x.area, () => `U${un + 1}. overlapArea, ${x.label}, ${shape}: ${x.area} pinned, got ${a}`); un++;
}));

if (problems.length) { console.log(`FAIL script=test-0.3.2-dd2o.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2o  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2o  ${checks} checks`);
