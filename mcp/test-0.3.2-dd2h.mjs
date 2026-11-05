// 0.3.2 DD2H (mcp/work/DD2H.md): one HTML escape. assets/js/html-escape.js htmlEsc is the one home of CONTRACTS.md's
// family html (a text safe inside an HTML page). Made-up texts only.
//   H1-H10  the contract probe's 10 texts through htmlEsc, source and .min.js: each answer pinned
//   H11-H14 four more (0, false, all five characters, a text with a line break): each answer pinned
//   F1      the module is frozen and holds htmlEsc only
//   P       the parity test: every place of CONTRACTS.md's family html (the probe's places, run as
//           scripts/contracts-probe.mjs runs them) on all 14 texts: one answer each, htmlEsc's
//   S1-S3   one place: no place holds an escape chain of its own; each keeps its name as a one-line alias of htmlEsc;
//           the ledger's places are the probe's (9)
//   L1-L3   loaded first: every page that loads a place's script loads html-escape.min.js before it; the theme
//           generator's loaders load it before the field picker and the preview
//   node test-0.3.2-dd2h.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { FAMILIES, answerOf, placeName } from '../scripts/contracts-probe.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(ROOT, ...f.split('/')), 'utf8').replace(/\r\n/g, '\n');
const require = createRequire(import.meta.url);
const HE = require('../assets/js/html-escape.js');
const HEmin = require('../assets/js/html-escape.min.js');
const { htmlEsc } = HE;
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const show = (s) => JSON.stringify(s);

// [id, label, the text, its answer]: the probe's 10 (scripts/contracts-probe.mjs ESCAPES), then four more
const TEXTS = [
  ['H1', "'' (empty)", '', ''],
  ['H2', 'a & b', 'a & b', 'a &amp; b'],
  ['H3', '<b>', '<b>', '&lt;b&gt;'],
  ['H4', '"q"', '"q"', '&quot;q&quot;'],
  ['H5', "it's", "it's", 'it&#39;s'],
  ['H6', '&amp; (escaped already)', '&amp;', '&amp;amp;'],
  ['H7', 'Arabic', 'المبيعات', 'المبيعات'],
  ['H8', 'null', null, ''],
  ['H9', 'undefined', undefined, ''],
  ['H10', '12 (a number)', 12, '12'],
  ['H11', '0 (a number)', 0, '0'],
  ['H12', 'false', false, 'false'],
  ['H13', 'all five', `<a href="x">Tom & Jerry's</a>`, '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;'],
  ['H14', 'a line break', 'a\nb', 'a\nb'],
];
for (const [id, label, t, want] of TEXTS) {
  const a = htmlEsc(t), m = HEmin.htmlEsc(t);
  chk(() => a === want && m === want, () => `${id} (${label}): htmlEsc ${show(a)}, .min.js ${show(m)}, wanted ${show(want)}`);
}
chk(() => Object.isFrozen(HE) && Object.keys(HE).join() === 'htmlEsc', () => `F1 html-escape.js exports ${show(Object.keys(HE))}, frozen ${Object.isFrozen(HE)}; wanted only htmlEsc, frozen`);

// ---- P: every place on every text, one answer each (the probe's own loaders) ----
const fam = FAMILIES.find((f) => f.id === 'html');
const PLACES = [
  ['assets/js/exam-view.js', 'esc'], ['assets/js/field-picker-ui.js', 'esc'], ['assets/js/health-downloads.js', 'esc'],
  ['assets/js/health-view.js', 'esc'], ['assets/js/page-preview.js', 'esc'], ['assets/js/svg-kpi-designer.js', 'esc'],
  ['assets/js/theme-generator.js', 'esc'], ['assets/js/measure-builder.js', 'escapeHtml'], ['mcp/lib/approval-view.mjs', 'esc'],
];
chk(() => fam && fam.places.length === PLACES.length && PLACES.every(([f, n]) => fam.places.some((p) => p.file === f && p.fn === n)),
  () => `S3 the probe's family html has ${fam ? fam.places.map(placeName).join(', ') : 'no family'}; wanted the ${PLACES.length} places`);
for (const p of (fam ? fam.places : [])) {
  for (const [id, label, t, want] of TEXTS) {
    const got = await answerOf(p, { label, s: t });
    chk(() => got.key === show(want), () => `P ${placeName(p)} ${id} (${label}): ${got.shown}, wanted ${show(want)}`);
  }
}

// ---- S: one place ----
const CHAIN = /replace\(\/\[&<>"'?\]\/g|'&amp;'/;
for (const [f, n] of PLACES) {
  const src = read(f);
  chk(() => !CHAIN.test(src), () => `S1 ${f} holds an HTML escape chain of its own again: read html-escape.js htmlEsc`);
  const alias = new RegExp(`^\\s*const ${n} = (?:HE\\.htmlEsc|window\\.DAHtmlEscape\\.htmlEsc|htmlEsc);$`, 'm');
  chk(() => alias.test(src) && /html-escape\.js|DAHtmlEscape/.test(src), () => `S2 ${f} must keep \`const ${n} = ...htmlEsc;\` and read html-escape.js`);
}

// ---- L: loaded first ----
const PAGES = ['tools', 'ar/tools'].flatMap((d) => fs.readdirSync(path.join(ROOT, d)).filter((x) => x.endsWith('.html')).map((x) => d + '/' + x));
const SCRIPTS = ['exam-view', 'health-downloads', 'health-view', 'svg-kpi-designer', 'theme-generator', 'measure-builder'];
let pagesSeen = 0;
for (const pg of PAGES) {
  const h = read(pg), at = (n) => h.search(new RegExp(`assets/js/${n}\\.min\\.js\\?v=`));
  const uses = SCRIPTS.filter((n) => at(n) >= 0);
  if (!uses.length) continue;
  pagesSeen++;
  const he = at('html-escape');
  chk(() => he >= 0 && uses.every((n) => he < at(n)) && h.split('html-escape.min.js').length === 2,
    () => `L1 ${pg} must load html-escape.min.js once, before ${uses.join(', ')}`);
}
chk(() => pagesSeen === 13, () => `L2 ${pagesSeen} pages load a place's script, 13 wanted (the exam, health check, SVG KPI, measure builder and theme generator pages, English and Arabic)`);
const tg = read('assets/js/theme-generator.js'), pos = (re) => tg.search(re);
chk(() => {
  const bind = pos(/const loadBind = /), prev = pos(/const loadPreview = /);
  const heInBind = tg.indexOf('html-escape.min.js', bind), picker = tg.indexOf('field-picker-ui.min.js', bind);
  const heInPrev = tg.indexOf('html-escape.min.js', prev), preview = tg.indexOf('page-preview.min.js', prev);
  return heInBind > bind && heInBind < picker && heInPrev > prev && heInPrev < preview && preview < tg.indexOf('\n', prev);
}, () => 'L3 theme-generator.js must load html-escape.min.js in loadBind before field-picker-ui.min.js and in loadPreview before page-preview.min.js');

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2h  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2h  ${checks} checks`);
