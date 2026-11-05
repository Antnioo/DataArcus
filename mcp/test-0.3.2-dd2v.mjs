// 0.3.2 DD2V (mcp/work/DD2V.md): one list each for "keeps its grid left to right" (assets/js/mirror-policy.js keepsGridLtr)
// and "is a bar chart" (assets/js/visual-types.js BAR_TYPES, isBar): CONTRACTS.md's families grid and vt-bar. Made-up types only.
//   B1-B18  the contract probe's 18 types through isBar, source and .min.js: each answer pinned
//   G1-G18  the same 18 types through keepsGridLtr: each answer pinned
//   F1      BAR_TYPES is frozen and holds the catalog's three bar types, each a native type
//   P       the parity test: every place of the probe's families grid (2) and vt-bar (5) on the 18 types: one answer each
//   S1-S3   one place: no place keeps a list of its own; each reads isBar or keepsGridLtr; the ledger's places are the probe's
//   node test-0.3.2-dd2v.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const VT = require('../assets/js/visual-types.js');
const VTmin = require('../assets/js/visual-types.min.js');
const MP = require('../assets/js/mirror-policy.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) problems.push((typeof msg === 'function' ? msg() : msg) + err); };
const show = (s) => JSON.stringify(s);

// [id, the type, is a bar, keeps its grid]: the probe's 18 types (scripts/contracts-probe.mjs TYPES)
const TYPES = [
  ['tableEx', false, true], ['pivotTable', false, true], ['table', false, false], ['matrix', false, false], ['accessibleTable', false, false],
  ['slicer', false, false], ['advancedSlicerVisual', false, false], ['listSlicer', false, false], ['textSlicer', false, false], ['filterSlicer', false, false],
  ['barChart', true, false], ['clusteredBarChart', true, false], ['stackedBarChart', false, false], ['hundredPercentStackedBarChart', true, false],
  ['columnChart', false, false], ['stackedColumnChart', false, false], ['', false, false], ['myCustomVisual1234', false, false],
];
chk(() => TYPES.length === 18, () => `the probe has 18 types, this list ${TYPES.length}`);
TYPES.forEach(([t, bar, grid], i) => {
  chk(() => VT.isBar(t) === bar && VTmin.isBar(t) === bar, () => `B${i + 1} ${show(t)}: isBar ${VT.isBar(t)}, .min.js ${VTmin.isBar(t)}, wanted ${bar}`);
  chk(() => MP.keepsGridLtr({ visual: { visualType: t } }) === grid, () => `G${i + 1} ${show(t)}: keepsGridLtr ${MP.keepsGridLtr({ visual: { visualType: t } })}, wanted ${grid}`);
});
chk(() => Object.isFrozen(VT.BAR_TYPES) && VT.BAR_TYPES.join() === 'barChart,clusteredBarChart,hundredPercentStackedBarChart' && VT.BAR_TYPES.every((t) => VT.isNative(t)),
  () => `F1 BAR_TYPES is ${show(VT.BAR_TYPES)}, frozen ${Object.isFrozen(VT.BAR_TYPES)}; wanted the catalog's three, frozen`);
chk(() => !VT.isBar(null) && !VT.isBar(undefined), () => 'F2 isBar(null) and isBar(undefined) must be false');

// ---- P: every place on every type, one answer each (the probe's own loaders) ----
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(ROOT, ...f.split('/')), 'utf8').replace(/\r\n/g, '\n');
const { FAMILIES, answerOf, placeName } = await import('../scripts/contracts-probe.mjs');
const PLACES = {
  grid: [['assets/js/mirror-policy.js', 'keepsGridLtr'], ['mcp/lib/page-picture.mjs', 'newOverlaps']],
  'vt-bar': [['assets/js/visual-types.js', 'isBar'], ['assets/js/mirror-policy.js', 'kindOf'], ['assets/js/page-preview.js', 'kindOf'],
    ['assets/js/layout-check.js', 'placeOf'], ['mcp/lib/page-picture.mjs', 'newOverlaps']],
};
for (const [id, places] of Object.entries(PLACES)) {
  const fam = FAMILIES.find((f) => f.id === id), col = id === 'grid' ? 2 : 1;
  chk(() => fam && fam.places.length === places.length && places.every(([f, n]) => fam.places.some((p) => p.file === f && p.fn === n)),
    () => `S3 the probe's family ${id} has ${fam ? fam.places.map(placeName).join(', ') : 'no family'}; wanted ${places.map((p) => p.join(' ')).join(', ')}`);
  if (!fam) continue;
  chk(() => fam.inputs.length === 18 && fam.inputs.every((x, i) => x.t === TYPES[i][0]), () => `S4 the probe's ${id} inputs are not the 18 types of this test`);
  for (const p of fam.places) for (const [i, x] of fam.inputs.entries()) {
    const want = TYPES[i][col], got = await answerOf(p, x);
    chk(() => got.key === show(want), () => `P ${id} ${placeName(p)} ${show(x.t)}: ${got.shown}, wanted ${show(want)}`);
  }
}

// ---- S: one place, no list of its own ----
const NO_LIST = [['assets/js/mirror-policy.js', /\bBAR = Object\.freeze|stackedBarChart/], ['assets/js/page-preview.js', /stackedBarChart|stackedColumnChart/],
  ['assets/js/layout-check.js', /\bBARS\b|\bconst KINDS = \[\[\/\^\(barChart/], ['mcp/lib/page-picture.mjs', /\bBARS\b|\bTABLES\b|stackedBarChart/]];
for (const [f, re] of NO_LIST) chk(() => !re.test(read(f)), () => `S1 ${f} holds a list of its own (${re})`);
const READS = [['assets/js/mirror-policy.js', /VT\.BAR_TYPES/], ['assets/js/page-preview.js', /VT\.isBar/], ['assets/js/layout-check.js', /VT\.isBar/],
  ['mcp/lib/page-picture.mjs', /\{ isBar \}[^;]*visual-types\.js/], ['mcp/lib/page-picture.mjs', /\{ keepsGridLtr \}[^;]*mirror-policy\.js/]];
for (const [f, re] of READS) chk(() => re.test(read(f)), () => `S2 ${f} must read the one list (${re})`);

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2v  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2v  ${checks} checks`);
