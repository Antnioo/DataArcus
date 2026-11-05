// 0.3.2 DD2V (mcp/work/DD2V.md): one list each for "keeps its grid left to right" (assets/js/mirror-policy.js keepsGridLtr)
// and "is a bar chart" (assets/js/visual-types.js BAR_TYPES, isBar): CONTRACTS.md's families grid and vt-bar. Made-up types only.
//   B1-B18  the contract probe's 18 types through isBar, source and .min.js: each answer pinned
//   G1-G18  the same 18 types through keepsGridLtr: each answer pinned
//   F1      BAR_TYPES is frozen and holds the catalog's three bar types, each a native type
//   node test-0.3.2-dd2v.mjs
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

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2v  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2v  ${checks} checks`);
