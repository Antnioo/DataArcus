// 0.3.2 DD2K (mcp/work/DD2K.md): one place for the contrast of two colours. assets/js/contrast.js holds luminance and
// contrast (the WCAG ratio). Made-up colours only. Each answer is pinned as the base (023af77) gave it.
//   C1-C9   contrast on the contracts probe's 9 pairs (NaN for #FFF, a name, an empty text; either way round)
//   L1-L6   luminance on 6 colours
//   M1-M2   the module is the same as .min.js; it never throws on a non-text
//   node test-0.3.2-dd2k.mjs
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Contrast = require('../assets/js/contrast.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const same = (x, y) => Object.is(x, y) || (typeof x === 'number' && typeof y === 'number' && x === y);

// [id, a, b, the ratio the base gave]
export const PAIRS = [
  ['C1', '#000000', '#FFFFFF', 21], ['C2', '#ffffff', '#ffffff', 1], ['C3', '#767676', '#FFFFFF', 4.542224959605253],
  ['C4', '#118DFF', '#FFFFFF', 3.345129056818874], ['C5', '#FFF', '#000000', NaN], ['C6', '118DFF', '#FFFFFF', 1.8102189821748678],
  ['C7', 'red', '#FFFFFF', NaN], ['C8', '', '#FFFFFF', NaN], ['C9', '#000000FF', '#FFFFFF', 21],
];
// [id, colour, the luminance the base gave]
export const LUMS = [['L1', '#000000', 0], ['L2', '#FFFFFF', 1], ['L3', '#767676', 0.18116424424986022], ['L4', '#118DFF', 0.26388923481431276], ['L5', '#FFF', NaN], ['L6', 'red', NaN]];
const show = (n) => (Number.isNaN(n) ? 'NaN' : String(n));

for (const [id, a, b, want] of PAIRS) {
  const got = Contrast.contrast(a, b), back = Contrast.contrast(b, a);
  chk(() => same(got, want) && same(back, want), () => `${id} contrast(${JSON.stringify(a)}, ${JSON.stringify(b)}) gave ${show(got)} (turned round ${show(back)}), the base ${show(want)}`);
}
for (const [id, c, want] of LUMS) {
  const got = Contrast.luminance(c);
  chk(() => same(got, want), () => `${id} luminance(${JSON.stringify(c)}) gave ${show(got)}, the base ${show(want)}`);
}
{ const min = require('../assets/js/contrast.min.js');
  chk(() => PAIRS.every(([, a, b]) => same(min.contrast(a, b), Contrast.contrast(a, b))) && LUMS.every(([, c]) => same(min.luminance(c), Contrast.luminance(c))),
    () => 'M1 contrast.min.js must answer as contrast.js does'); }
chk(() => Number.isNaN(Contrast.contrast(undefined, '#FFFFFF')) && Number.isNaN(Contrast.luminance(null)) && Object.keys(Contrast).sort().join() === 'contrast,luminance',
  () => 'M2 a non-text colour gives NaN, never a throw; the module holds luminance and contrast only');

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2k  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2k  ${checks} checks`);
