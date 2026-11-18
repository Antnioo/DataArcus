// WN033 (18 Nov): the beta page /power-bi-mcp/ says what is new in 0.3.3 and 0.3.2, in English and Arabic, newest first,
// with only the newest section open: 0.3.2, 0.3.1 and 0.3.0 are each folded in a closed native <details>, keeping their ids.
//   node scripts/test-whats-new-latest.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const NAME = 'whats-new-033-032';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const box = { window: {} };
vm.runInNewContext(read('assets/js/translations/beta-page.js'), box);
const T = box.window.betaPageTranslations;
const pages = { en: read('power-bi-mcp/index.html'), ar: read('ar/power-bi-mcp/index.html') };
let checks = 0; const fails = [];
const ok = (c, msg) => { checks++; if (!c) fails.push(msg); };
const strip = (s) => String(s).replace(/<[^>]*>/g, ' ');

// the brief's words: no "first", "only", "official" in a heading, no first-of-kind claim, no "free", no em dash, no job codes
const FLUFF = [/\bthe first\b/i, /\bfirst (tool|agent|mcp)\b/i, /\bonly (tool|agent|mcp)\b/i, /\bofficial\b/i, /\bbest\b/i, /AI-powered/i,
  /الأول من نوعه/, /الوحيد/, /رسمي/, /الأفضل/];
const HEADING = [/\bfirst\b/i, /\bonly\b/i, /\bofficial\b/i, /الأول/, /فقط/, /رسمي/];
const JOB = /\b(?:[A-Z]{1,4}\d{1,4}|[A-Z]-\d{3,4}(?:-\d+)?|D-\d{4}-\d{2})\b/;
const SECTIONS = [
  { key: 'new33', id: 'new-033', version: '0.3.3', day: { en: /17 November 2026/, ar: /17 نوفمبر 2026/ }, folded: false },
  { key: 'new32', id: 'new-032', version: '0.3.2', day: { en: /9 November 2026/, ar: /9 نوفمبر 2026/ }, folded: true },
  { key: 'new31', id: 'new-031', version: '0.3.1', folded: true },
  { key: 'new', id: 'new', version: '0.3.0', folded: true }
];

for (const s of SECTIONS.filter((x) => x.day)) {
  for (const lang of ['en', 'ar']) {
    const n = (T && T[lang] && T[lang].beta && T[lang].beta[s.key]) || {};
    const lines = Object.keys(n).filter((k) => /^l\d+$/.test(k));
    ok(n.title && n.title.includes(s.version), `${lang}: beta.${s.key}.title names ${s.version} ("${n.title}")`);
    ok(s.day[lang].test(n.date || ''), `${lang}: beta.${s.key}.date is the release day ("${n.date}")`);
    ok(lines.length >= 5 && lines.length <= 8, `${lang}: ${lines.length} ${s.version} lines, want 5 to 8`);
    const text = Object.values(n).map(strip).join(' \n ');
    for (const re of FLUFF) ok(!re.test(text), `${lang}: the ${s.version} section makes a claim it must not: ${re}`);
    for (const k of lines) ok(!HEADING.some((re) => re.test(strip((n[k].match(/<strong>([\s\S]*?)<\/strong>/) || [])[1] || ''))), `${lang}: beta.${s.key}.${k}'s heading says first, only or official`);
    ok(!HEADING.some((re) => re.test(n.title || '')), `${lang}: the ${s.version} title says first, only or official`);
    ok(!/\bfree\b|مجان/i.test(text), `${lang}: the ${s.version} section says free`);
    ok(!/\u2014/.test(text), `${lang}: the ${s.version} section has an em dash`);
    ok(!JOB.test(text), `${lang}: the ${s.version} section names an internal job code: ${(text.match(JOB) || [])[0]}`);
    if (lang === 'ar') ok(/[؀-ۿ]/.test(text) && lines.every((k) => /[؀-ۿ]/.test(strip(n[k]))), `ar: a ${s.version} line is not in Arabic`);
  }
  const keys = (l) => Object.keys((T && T[l] && T[l].beta && T[l].beta[s.key]) || {}).sort().join(',');
  ok(keys('en') && keys('en') === keys('ar'), `en and ar beta.${s.key} keys differ: ${keys('en')} | ${keys('ar')}`);
}

for (const [lang, html] of Object.entries(pages)) {
  const at = SECTIONS.map((s) => html.indexOf(`<section id="${s.id}">`));
  ok(at.every((i) => i > 0), `${lang}: a section is missing: ${SECTIONS.filter((s, i) => at[i] < 0).map((s) => s.id).join(', ')}`);
  ok(at.every((i, j) => j === 0 || at[j - 1] < i), `${lang}: the sections are not newest first (0.3.3, 0.3.2, 0.3.1, 0.3.0)`);
  for (const s of SECTIONS) {
    const sec = (html.match(new RegExp(`<section id="${s.id}">[\\s\\S]*?</section>`)) || [''])[0];
    const used = [...sec.matchAll(new RegExp(`data-i18n(?:-html)?="beta\\.${s.key}\\.([^"]+)"`, 'g'))].map((m) => m[1]);
    if (s.day) {
      ok(used.length >= 7, `${lang}: the ${s.version} section uses ${used.length} beta.${s.key} keys, want the title, the date and every line`);
      for (const k of used) ok((T.en.beta[s.key] || {})[k] != null && (T.ar.beta[s.key] || {})[k] != null, `${lang}: beta.${s.key}.${k} missing in a language`);
    }
    if (!s.folded) {
      ok(!/<details/.test(sec) && !/\shidden[\s>=]/.test(sec.split('>')[0]), `${lang}: the newest section (${s.version}) is not fully open`);
      ok(new RegExp(`<h2 class="mt-5 mb-3" data-i18n="beta\\.${s.key}\\.title">`).test(sec), `${lang}: the ${s.version} section has no h2 of its own`);
      continue;
    }
    const d = sec.match(/^<section id="[^"]+">\s*<details class="whats-new-fold"( open)?>\s*<summary><h2 data-i18n="beta\.(\w+)\.title">([^<]*)<\/h2><\/summary>[\s\S]*<\/details>\s*<\/section>$/);
    ok(!!d, `${lang}: the ${s.version} section is not one <details> with its h2 in the <summary>`);
    ok(d && !d[1], `${lang}: the ${s.version} section is open by default (only the newest stays open)`);
    ok(d && d[2] === s.key && d[3].includes(s.version), `${lang}: the ${s.version} summary is not the version's h2 ("${d && d[3]}")`);
  }
  // a link to a folded section's id opens it: the page's inline script, on arrival and on hashchange
  ok(/<script>\s*\/\/ A link to a folded "What's new" section[\s\S]*?querySelector\(':scope > details'\)[\s\S]*?addEventListener\('hashchange'/.test(html), `${lang}: no script that opens a folded section from its #id`);
  ok(/\.whats-new-fold > summary::after \{[^}]*margin-inline-start: auto/.test(html), `${lang}: the chevron does not follow the reading direction`);
}

if (fails.length) { console.error(`FAIL  ${NAME}  ${fails.length} of ${checks} checks\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS  ${NAME}  ${checks} checks`);
