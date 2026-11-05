// 0.3.2 DD2Z (mcp/work/DD2Z.md): the last two families in one place (CONTRACTS.md vt-slicer and blank). Made-up inputs only.
//   V1-V18  the probe's 18 types through visual-types.js isSlicer, source and .min.js: the four slicers Desktop makes
//           (lab/look032 A, Power BI Desktop 2.159.1231.0); filterSlicer is none of them
//   F1      SLICER_TYPES is frozen and holds those four, each a native type
//   P       the parity test: every place of the probe's family vt-slicer on the 18 types, and of blank on its 14 inputs:
//           the answers Desktop gives (lab/look032 B: DIVIDE and / and BLANK, Infinity and NaN), one answer each
//   R1-R4   the SVG KPI "Progress ring" starter with a BLANK and with a 0 target, and with a target: "0%" and an empty
//           ring (as Desktop draws it: DIVIDE gives BLANK, the compiled COALESCE gives 0), 83% for 1240000 of 1500000
//   S       one place: no list of its own; each reads isSlicer; the editor reads the one evaluator
//   node test-0.3.2-dd2z.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const VT = require('../assets/js/visual-types.js');
const VTmin = require('../assets/js/visual-types.min.js');
const K = require('../assets/js/svg-kpi-compiler.js');
const TPL = require('../assets/js/svg-kpi-templates.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) problems.push((typeof msg === 'function' ? msg() : msg) + err); };
const show = (s) => JSON.stringify(s);

// ---- V: the probe's 18 types, and the four slicers Desktop makes ----
const TYPES = ['tableEx', 'pivotTable', 'table', 'matrix', 'accessibleTable', 'slicer', 'advancedSlicerVisual', 'listSlicer', 'textSlicer', 'filterSlicer',
  'barChart', 'clusteredBarChart', 'stackedBarChart', 'hundredPercentStackedBarChart', 'columnChart', 'stackedColumnChart', '', 'myCustomVisual1234'];
const SLICERS = new Set(['slicer', 'advancedSlicerVisual', 'listSlicer', 'textSlicer']);
chk(() => TYPES.length === 18, () => `the probe has 18 types, this list ${TYPES.length}`);
TYPES.forEach((t, i) => chk(() => VT.isSlicer(t) === SLICERS.has(t) && VTmin.isSlicer(t) === SLICERS.has(t),
  () => `V${i + 1} ${show(t)}: isSlicer ${VT.isSlicer(t)}, .min.js ${VTmin.isSlicer(t)}, wanted ${SLICERS.has(t)}`));
chk(() => Object.isFrozen(VT.SLICER_TYPES) && VT.SLICER_TYPES.join() === 'slicer,advancedSlicerVisual,listSlicer,textSlicer' && VT.SLICER_TYPES.every((t) => VT.isNative(t)),
  () => `F1 SLICER_TYPES is ${show(VT.SLICER_TYPES)}, frozen ${Object.isFrozen(VT.SLICER_TYPES)}; wanted the four Desktop makes, frozen`);
chk(() => !VT.isSlicer(null) && !VT.isSlicer(undefined), () => 'F2 isSlicer(null) and isSlicer(undefined) must be false');

// ---- P: every place on every input, one answer each (the probe's own loaders) ----
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(ROOT, ...f.split('/')), 'utf8').replace(/\r\n/g, '\n');
const { FAMILIES, answerOf, placeName } = await import('../scripts/contracts-probe.mjs');
const PLACES = {
  'vt-slicer': [['assets/js/visual-types.js', 'isSlicer'], ['assets/js/mirror-policy.js', 'kindOf'], ['assets/js/page-preview.js', 'kindOf'],
    ['assets/js/report-a11y.js', 'describe'], ['mcp/lib/report-inventory.mjs', 'inventory']],
  blank: [['assets/js/svg-expressions.js', 'evalNode'], ['assets/js/svg-editor-panels.js', 'evalValues']],
};
// what Desktop answers (lab/look032 B, DAX query view, ISBLANK and the value as text); BLANK is null
const BLANK = { 'DIVIDE ( 5, BLANK )': null, 'DIVIDE ( BLANK, BLANK )': null, 'DIVIDE ( 5, 0 )': null, 'DIVIDE ( 6, 3 )': 2, '5 / BLANK': Infinity, 'BLANK / BLANK': null,
  '5 / 0': Infinity, '0 / 0': NaN, '6 / 3': 2, '5 - 3': 2, 'BLANK - 3': -3, '5 - BLANK': 5, 'BLANK - BLANK': null, '5 - 0': 5 };
const shown = (v) => (v === undefined ? 'undefined' : typeof v === 'number' && !Number.isFinite(v) ? String(v) : JSON.stringify(v));
for (const [id, places] of Object.entries(PLACES)) {
  const fam = FAMILIES.find((f) => f.id === id);
  chk(() => fam && fam.places.length === places.length && places.every(([f, n]) => fam.places.some((p) => p.file === f && p.fn === n)),
    () => `S3 the probe's family ${id} has ${fam ? fam.places.map(placeName).join(', ') : 'no family'}; wanted ${places.map((p) => p.join(' ')).join(', ')}`);
  if (!fam) continue;
  if (id === 'vt-slicer') chk(() => fam.inputs.length === 18 && fam.inputs.every((x, i) => x.t === TYPES[i]), () => 'S4 the probe\'s vt-slicer inputs are not the 18 types of this test');
  else chk(() => fam.inputs.length === Object.keys(BLANK).length && fam.inputs.every((x) => x.label in BLANK), () => 'S4 the probe\'s blank inputs are not the 14 of this test');
  for (const p of fam.places) for (const x of fam.inputs) {
    const want = id === 'vt-slicer' ? SLICERS.has(x.t) : BLANK[x.label], got = await answerOf(p, x);
    if (got.na) continue;
    chk(() => got.key === shown(want), () => `P ${id} ${placeName(p)} ${x.label}: ${got.shown}, wanted ${shown(want)}`);
  }
}
chk(() => FAMILIES.find((f) => f.id === 'blank').places.some((p) => p.fn === 'evalValues' && ['DIVIDE ( 5, BLANK )'].every((l) => !p.applies || p.applies(FAMILIES.find((f) => f.id === 'blank').inputs.find((x) => x.label === l)))),
  'S5 the editor must answer the DIVIDE rows');

// ---- R: the Progress ring (a ratio by DIVIDE, then COALESCE ( _Achievement, 0 )) ----
const ring = () => JSON.parse(JSON.stringify(TPL.TEMPLATES.find((t) => t.id === 'ring')));
const svgOf = (target) => { const m = { Sales: 1240000, 'Sales LY': 1100000 }; if (target !== undefined) m.Target = target; return decodeURIComponent(K.toImageUrl(ring(), m).url); };
const percent = (svg) => (svg.match(/>([0-9]+%)</) || [])[1];
const dash = (svg) => (svg.match(/stroke-dasharray='([^']*)'/) || [])[1];
const blankSvg = svgOf(null), zeroSvg = svgOf(0), noneSvg = svgOf(undefined), fullSvg = svgOf(1500000);
chk(() => percent(blankSvg) === '0%', () => `R1 a BLANK target: the ring reads ${percent(blankSvg)}, wanted 0%`);
chk(() => percent(zeroSvg) === '0%', () => `R2 a 0 target: the ring reads ${percent(zeroSvg)}, wanted 0%`);
chk(() => percent(noneSvg) === '0%' && /^0\.00 /.test(dash(blankSvg)) && dash(noneSvg) === dash(blankSvg) && dash(blankSvg) === dash(zeroSvg), () => 'R3 a missing, a BLANK and a 0 target draw the same empty ring');
chk(() => percent(fullSvg) === '83%' && dash(fullSvg) !== dash(blankSvg), () => `R4 1240000 of 1500000: ${percent(fullSvg)}, wanted 83% and a ring that differs from the empty one`);

// ---- S: one place, no list of its own ----
const NO_LIST = [['assets/js/mirror-policy.js', /\bSLICER = Object\.freeze/], ['assets/js/page-preview.js', /\^\(slicer\|advancedSlicerVisual/], ['assets/js/report-a11y.js', /\bSLICERS\b|advancedSlicerVisual/],
  ['mcp/lib/report-inventory.mjs', /\bSLICERS\b/], ['assets/js/svg-editor-panels.js', /a == null \|\| b == null \|\| b === 0/]];
for (const [f, re] of NO_LIST) chk(() => !re.test(read(f)), () => `S1 ${f} holds a rule of its own (${re})`);
const READS = [['assets/js/mirror-policy.js', /VT\.isSlicer/], ['assets/js/page-preview.js', /VT\.isSlicer/], ['assets/js/report-a11y.js', /VT\.isSlicer/],
  ['mcp/lib/report-inventory.mjs', /VT\.isSlicer/], ['assets/js/svg-editor-panels.js', /evalValueKind/]];
for (const [f, re] of READS) chk(() => re.test(read(f)), () => `S2 ${f} must read the one place (${re})`);

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2z  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2z  ${checks} checks`);
