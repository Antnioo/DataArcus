// 0.3.2 DD2H (mcp/work/DD2H.md): one HTML escape. assets/js/html-escape.js htmlEsc is the one home of CONTRACTS.md's
// family html (a text safe inside an HTML page). Made-up texts only.
//   H1-H10  the contract probe's 10 texts through htmlEsc, source and .min.js: each answer pinned
//   H11-H14 four more (0, false, all five characters, a text with a line break): each answer pinned
//   F1      the module is frozen and holds htmlEsc only
//   node test-0.3.2-dd2h.mjs
import { createRequire } from 'node:module';

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

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd2h  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd2h  ${checks} checks`);
