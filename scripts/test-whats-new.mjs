// W1 (20 Oct): the beta page /power-bi-mcp/ says what is new in 0.3.0, in English and Arabic, and names nothing that is
// not in 0.3.0. Reads the translations (beta-page.js), the English page and its generated Arabic copy.
//   node scripts/test-whats-new.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const box = { window: {} };
vm.runInNewContext(read('assets/js/translations/beta-page.js'), box);
const T = box.window.betaPageTranslations;
const pages = { en: read('power-bi-mcp/index.html'), ar: read('ar/power-bi-mcp/index.html') };
let checks = 0; const fails = [];
const ok = (c, msg) => { checks++; if (!c) fails.push(msg); };

// 0.3.1 drafts and an unapproved comparison: never on the page as available
const NOT_IN_030 = [/DAX function/i, /VS ?Code/i, /render_report/i, /Skills? for Fabric/i, /see the result/i, /Power BI Report skill/i,
  /دوال DAX/, /مكتبة دوال/];
// claims the brief rules out (a first-of-kind "first" / "only", official, best, AI-powered)
const FLUFF = [/\bthe first\b/i, /\bfirst (tool|agent|mcp)\b/i, /\bonly (tool|agent|mcp)\b/i, /\bofficial\b/i, /\bbest\b/i, /AI-powered/i,
  /الأول من نوعه/, /الوحيد/, /رسمي/, /الأفضل/];
const strip = (s) => String(s).replace(/<[^>]*>/g, ' ');

for (const lang of ['en', 'ar']) {
  const b = (T && T[lang] && T[lang].beta) || {}, n = b.new || {};
  const lines = Object.keys(n).filter((k) => /^l\d+$/.test(k)), tries = Object.keys(n).filter((k) => /^t\d+$/.test(k));
  ok(/0\.3\.0/.test(n.title || ''), `${lang}: beta.new.title names 0.3.0 ("${n.title}")`);
  ok(/0\.3\.0/.test(n.version || ''), `${lang}: beta.new.version says testers get 0.3.0`);
  ok(lines.length >= 6 && lines.length <= 8, `${lang}: ${lines.length} new lines, want 6-8`);
  ok(tries.length === 4 && !!n.try, `${lang}: "try first" has ${tries.length} items, want 4 and a heading`);
  const text = Object.values(n).map(strip).join(' \n ');
  for (const re of NOT_IN_030) ok(!re.test(text), `${lang}: the 0.3.0 section names a feature not in 0.3.0: ${re}`);
  for (const re of FLUFF) ok(!re.test(text), `${lang}: the 0.3.0 section makes a claim it must not: ${re}`);
  ok(/11/.test(b.tools && b.tools.title), `${lang}: the tools title still says 11`);
}
// the same facts in both: the same keys
const keys = (l) => Object.keys((T && T[l] && T[l].beta && T[l].beta.new) || {}).sort().join(',');
ok(keys('en') && keys('en') === keys('ar'), `en and ar beta.new keys differ: ${keys('en')} | ${keys('ar')}`);

for (const [lang, html] of Object.entries(pages)) {
  const sec = (html.match(/<section id="new"[\s\S]*?<\/section>/) || [''])[0];
  ok(!!sec, `${lang}: no <section id="new"> on the page`);
  const used = [...sec.matchAll(/data-i18n(?:-html)?="beta\.new\.([^"]+)"/g)].map((m) => m[1]);
  ok(used.length >= 12, `${lang}: the section uses ${used.length} beta.new keys, want every line`);
  for (const k of used) ok(T.en.beta.new[k] != null && T.ar.beta.new[k] != null, `${lang}: beta.new.${k} missing in a language`);
  ok(/0\.3\.0/.test(sec), `${lang}: the section shows no 0.3.0`);
  ok(!NOT_IN_030.some((re) => re.test(strip(sec))), `${lang}: the section on the page names a feature not in 0.3.0`);
  ok((html.match(/<li class="mb-2"><code translate="no">[a-z_]+<\/code>/g) || []).length === 11, `${lang}: the page does not list 11 tools`);
}
ok(/[؀-ۿ]/.test(((pages.ar.match(/<section id="new"[\s\S]*?<\/section>/) || [''])[0])), 'ar: the generated Arabic page\'s section is not in Arabic');

if (fails.length) { console.error(`FAIL  whats-new  ${fails.length} of ${checks} checks\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS  whats-new  ${checks} checks`);
