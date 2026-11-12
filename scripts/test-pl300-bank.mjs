// PL-300 bank test (PQ1, B-400 + B-401).
//  1. Length giveaway: among single-answer questions (the bank's and the case studies') the share where the right
//     option is the strictly longest must not pass 40% (AUD-055: it was 131/174 = 75.3%). DP-600's share is printed.
//  2. One count: every "N questions" on the PL-300 pages, the hubs and the share images equals the bank's length.
//  3. (SN3) The exam mixes its options: the bank has the right option first in every single-answer question, and the page draws
//     them through exam-session's newInst. Over the whole bank the right option is first on screen in no more than 40%.
// Run: node scripts/test-pl300-bank.mjs   (prints `PASS  pl300-bank  <N> checks`)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const load = (f, key) => { const w = {}; vm.runInNewContext(read(f), { window: w }); return w[key]; };
const MAX_SHARE = 0.40;
let checks = 0; const bad = [];
const ok = (c, m) => { checks++; if (!c) bad.push(m); };

function share(bank) {
  const qs = [...bank.q, ...(bank.cases || []).flatMap((c) => c.questions)].filter((q) => q.type === 'single');
  const hit = qs.filter((q) => { const L = q.opts.map((o) => String(o).length), m = Math.max(...L); return L[q.ans] === m && L.filter((x) => x === m).length === 1; });
  return { n: qs.length, hit: hit.length, share: hit.length / qs.length, ids: hit.map((q) => q.id) };
}
const pl = load('assets/data/pl300-questions.js', 'PL300');
const dp = load('assets/data/dp600-questions.js', 'DP600');
const p = share(pl), d = share(dp);
console.log(`PL-300: right option strictly longest in ${p.hit}/${p.n} = ${(p.share * 100).toFixed(1)}% single-answer questions (limit ${MAX_SHARE * 100}%)`);
console.log(`DP-600: ${d.hit}/${d.n} = ${(d.share * 100).toFixed(1)}% (printed, not failed)`);
ok(p.n > 0, 'no single-answer questions found');
ok(p.share <= MAX_SHARE, `PL-300 right option is the strictly longest in ${(p.share * 100).toFixed(1)}% (${p.hit}/${p.n}), limit ${MAX_SHARE * 100}%`);

// the bank's total: its questions plus the case-study questions (what the page says it holds)
const total = pl.q.length + pl.cases.reduce((a, c) => a + c.questions.length, 0);
ok(total > 0, 'empty bank');
const FILES = ['tools/pl-300-practice-exam.html', 'ar/tools/pl-300-practice-exam.html', 'assets/js/translations/pl300.js', 'assets/js/translations/pl300.min.js',
  'tools/index.html', 'ar/tools/index.html', 'index.html', 'ar/index.html', 'assets/js/translations/tools-hub.js', 'assets/js/translations/tools-hub.min.js',
  'assets/js/translations/homepage.js', 'assets/js/translations/homepage.min.js', 'scripts/make-share-images.mjs'];
const RE = /(?<![-\d])(\d{3})\s+(?:original\s+|practice\s+|Power BI\s+)*(?:questions?|سؤالًا|سؤال)/g;
for (const f of FILES) {
  if (!fs.existsSync(path.join(ROOT, f))) continue;
  const s = read(f);
  // a count is a number of 3 digits next to the word question(s) / سؤال; it is PL-300's when the page is PL-300's own
  // or the 70 characters before it (30 after) name PL-300 or Power BI and not DP-600 / Fabric
  const own = /pl-300-practice-exam|translations\/pl300/.test(f);
  for (const m of s.matchAll(RE)) {
    const ctx = s.slice(Math.max(0, m.index - 70), m.index + m[0].length + 30);
    if (!own && (!/PL-300|Power BI|pl300/.test(ctx) || /Fabric|DP-600|فابريك/.test(ctx))) continue;
    ok(+m[1] === total, `${f}: says ${m[1]} questions, the bank holds ${total}`);
  }
}
// DP-600 (SN3): every stated count equals the bank's questions plus its case questions (the share above is printed, the count is checked)
const dpTotal = dp.q.length + (dp.cases || []).reduce((a, c) => a + c.questions.length, 0);
ok(dpTotal > 0, 'empty DP-600 bank');
const DP_FILES = ['tools/dp-600-practice-exam.html', 'ar/tools/dp-600-practice-exam.html', 'assets/js/translations/dp600.js', 'assets/js/translations/dp600.min.js',
  'tools/index.html', 'ar/tools/index.html', 'index.html', 'ar/index.html', 'assets/js/translations/tools-hub.js', 'assets/js/translations/tools-hub.min.js',
  'assets/js/translations/homepage.js', 'assets/js/translations/homepage.min.js', 'scripts/make-share-images.mjs'];
const DP_RE = /(?<![-\d])(\d{3})\s+(?:original\s+|practice\s+|Fabric\s+)*(?:questions?|سؤالًا|سؤال)/g;
let dpStated = 0;
for (const f of DP_FILES) {
  if (!fs.existsSync(path.join(ROOT, f))) continue;
  const s = read(f);
  const own = /dp-600-practice-exam|translations\/dp600/.test(f);
  for (const m of s.matchAll(DP_RE)) {
    const ctx = s.slice(Math.max(0, m.index - 70), m.index + m[0].length + 30);
    if (!own && (!/DP-600|Fabric|فابريك/.test(ctx) || /PL-300|pl300/.test(ctx))) continue;
    dpStated++;
    ok(+m[1] === dpTotal, `${f}: says ${m[1]} DP-600 questions, the bank holds ${dpTotal}`);
  }
}
ok(dpStated >= 14, `only ${dpStated} stated DP-600 counts found (the page 3, its Arabic copy 3, translations 4, the home page, the hub, the share images 2 at least 14)`);
console.log(`stated DP-600 counts checked: ${dpStated}, bank total ${dpTotal}`);
// the options as the page draws them (newInst's perm: the source option shown at each place), a fixed seed, 20 draws of the whole bank
const SES = createRequire(import.meta.url)('../assets/js/exam-session.js');
const seeded = (n) => () => { n = (n + 0x6D2B79F5) | 0; let t = Math.imul(n ^ (n >>> 15), 1 | n); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rand = seeded(20261112);
let mixN = 0;
for (const [name, bank] of [['PL-300', pl], ['DP-600', dp]]) {
  const singles = [...bank.q, ...(bank.cases || []).flatMap((c) => c.questions)].filter((q) => q.type === 'single');
  let first = 0, n = 0;
  for (let draw = 0; draw < 20; draw++) for (const q of singles) { n++; if (SES.newInst(q, rand).perm.indexOf(q.ans) === 0) first++; }
  mixN += n;
  console.log(`${name}: the right option is drawn first in ${first}/${n} = ${(first / n * 100).toFixed(1)}% (limit ${MAX_SHARE * 100}%; source order would be ${(singles.filter((q) => q.ans === 0).length / singles.length * 100).toFixed(1)}%)`);
  ok(n > 0 && first / n <= MAX_SHARE, `${name}: the right option is drawn first in ${(first / n * 100).toFixed(1)}% of ${n} single-answer draws, limit ${MAX_SHARE * 100}% (are the options drawn in source order?)`);
}
const stated = checks - 2 - (dpStated + 2) - 2;
ok(stated >= 8, `only ${stated} stated counts found (the page, its Arabic copy, hubs and share images carry at least 8)`);
console.log(`stated counts checked: ${stated}, bank total ${total}`);
if (bad.length) { bad.slice(0, 20).forEach((b) => console.log('FAIL  ' + b)); console.log(`FAIL  pl300-bank  ${checks} checks`); process.exit(1); }
console.log(`PASS  pl300-bank  ${checks} checks`);
