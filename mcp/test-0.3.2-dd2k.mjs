// 0.3.2 DD2K (mcp/work/DD2K.md): one place for the contrast of two colours. assets/js/contrast.js holds luminance and
// contrast (the WCAG ratio). Made-up colours only. Each answer is pinned as the base (023af77) gave it.
//   C1-C9   contrast on the contracts probe's 9 pairs (NaN for #FFF, a name, an empty text; either way round)
//   L1-L6   luminance on 6 colours
//   M1-M2   the module is the same as .min.js; it never throws on a non-text
//   P1-P37  parity: contrast.js and the three places that answered before (design-colours.js and pbip-query.js through
//           their exports, lum too; svg-kpi-compiler.js contrastOf handed out of its source, as sp16 hands out dax):
//           one answer on each of the 9 pairs, the pinned one; the places' lum is the module's luminance
//   S1-S4   one place: the three callers hold no luminance, no 0.05 and no pow of their own, and read contrast.js;
//           the pages and the builder list load contrast.min.js before them
//   R1      the red proof's own check: a copy with 0.05 changed to 0.04 is told apart on the 9 pairs
//   node test-0.3.2-dd2k.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
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

// ---- parity: every place that answered before gives the one answer ----
const Colours = require('../assets/js/design-colours.js'), Query = require('../assets/js/pbip-query.js');
const svgContrastOf = (() => {   // contrastOf is no export: the compiler's source, run as it is, with it handed out
  const f = path.join(ROOT, 'assets', 'js', 'svg-kpi-compiler.js'), m = { exports: {} }, text = src('assets/js/svg-kpi-compiler.js');
  vm.runInThisContext('(function (module, exports, require) {' + text.replace('const api = {', 'const api = { __contrastOf: contrastOf,') + '\n})', { filename: f })(m, m.exports, createRequire(f));
  return m.exports.__contrastOf;
})();
const PLACES = [['contrast.js', Contrast.contrast], ['design-colours.js contrast', Colours.contrast], ['pbip-query.js contrast', Query.contrast], ['svg-kpi-compiler.js contrastOf', svgContrastOf]];
for (const [id, a, b, want] of PAIRS) for (const [name, fn] of PLACES) {
  const got = fn(a, b);
  chk(() => same(got, want), () => `P${id.slice(1)} ${name}(${JSON.stringify(a)}, ${JSON.stringify(b)}) gave ${show(got)}, the one answer ${show(want)}`);
}
chk(() => Colours.lum === Contrast.luminance && Colours.contrast === Contrast.contrast && Query.contrast === Contrast.contrast && Query.lum === Contrast.luminance,
  () => 'P37 design-colours.js and pbip-query.js must export the SAME functions as contrast.js (lum, contrast)');
// the red proof's own check: 0.05 changed to 0.04 in a copy is told apart (what the checks above do to a changed copy)
{ const red = (a, b) => { const x = Contrast.luminance(a), y = Contrast.luminance(b); return (Math.max(x, y) + 0.04) / (Math.min(x, y) + 0.04); };
  chk(() => PAIRS.some(([, a, b, want]) => !same(red(a, b), want)), () => 'R1 a copy with 0.04 for 0.05 must give another answer on some pair'); }

// ---- one place ----
for (const f of ['design-colours.js', 'pbip-query.js', 'svg-kpi-compiler.js']) {
  const text = src('assets/js/' + f);
  chk(() => /require\('\.\/contrast\.js'\)/.test(text) && /root\.DAContrast/.test(text) && !/\+ 0\.05\)|0\.03928|0\.2126 \*/.test(text),
    () => `S1 ${f} must read contrast.js (require, or DAContrast in the browser) and hold no luminance of its own (no "+ 0.05)", 0.03928, "0.2126 *")`);
}
chk(() => !/\blum\s*=\s*\(|\blumOf\b/.test(src('assets/js/design-colours.js') + src('assets/js/pbip-query.js') + src('assets/js/svg-kpi-compiler.js')),
  () => 'S2 no place may define a luminance function (lum, lumOf) of its own');
{ const tag = (t) => t.indexOf('contrast.min.js?v=');
  const pages = ['tools/power-bi-theme-generator.html', 'tools/power-bi-theme-generator-lab.html', 'ar/tools/power-bi-theme-generator.html'];
  chk(() => pages.every((f) => { const t = src(f); return tag(t) > 0 && tag(t) < t.indexOf('design-colours.min.js?v=') && tag(t) < t.indexOf('pbip-query.min.js?v='); }),
    () => 'S3 the theme generator pages must load contrast.min.js before design-colours.min.js and pbip-query.min.js');
  chk(() => ['tools/svg-kpi-designer.html', 'ar/tools/svg-kpi-designer.html'].every((f) => { const t = src(f); return tag(t) > 0 && tag(t) < t.indexOf('svg-kpi-compiler.min.js?v='); }),
    () => 'S4a the SVG KPI designer pages must load contrast.min.js before svg-kpi-compiler.min.js');
  const g = src('assets/js/theme-generator.js'), b = g.indexOf("const BUILDER = ["), c = g.indexOf('/assets/js/contrast.min.js?v=', b), q = g.indexOf('/assets/js/pbip-query.min.js?v=', b);
  chk(() => c > b && c < q && g.split('/assets/js/contrast.min.js?v=').length === 2, () => 'S4b theme-generator.js must list contrast.min.js once in BUILDER, before pbip-query.min.js'); }

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2k  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2k  ${checks} checks`);
