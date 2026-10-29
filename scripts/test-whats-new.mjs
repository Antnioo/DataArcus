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

// D5 (0.3.1 release prep, 25 Oct; mcp/work/D5.md): "What's new in 0.3.1", written before the release and shown at it.
// The one flag: the section's `hidden` attribute. Hidden, the download still says 0.3.0 and the date may be the
// placeholder; shown (the reviewer removes `hidden` at the release), the download names 0.3.1 and the date is a real day.
// Not in 0.3.1: the DAX function library (a branch of its own), render_report, a VS Code extension, a published plugin,
// anything promised for the matrix.
const NOT_IN_031 = [/DAX function/i, /render_report/i, /VS ?Code extension/i, /\.vsix/i, /see the result/i, /Power BI Report skill/i, /دوال DAX/, /مكتبة دوال/,
  /plugin is (?:published|live|in the marketplace)/i];
const PLACEHOLDER = /\[release day\]|\[يوم الإصدار\]/;
for (const lang of ['en', 'ar']) {
  const b = (T && T[lang] && T[lang].beta) || {}, n = b.new31 || {};
  const lines = Object.keys(n).filter((k) => /^l\d+$/.test(k));
  ok(/0\.3\.1/.test(n.title || ''), `${lang}: beta.new31.title names 0.3.1 ("${n.title}")`);
  ok(!!n.date, `${lang}: beta.new31.date (the release day, a placeholder until then)`);
  ok(lines.length >= 6 && lines.length <= 8, `${lang}: ${lines.length} 0.3.1 lines, want 6-8`);
  const text = Object.values(n).map(strip).join(' \n ');
  for (const re of NOT_IN_031) ok(!re.test(text), `${lang}: the 0.3.1 section names a thing not in 0.3.1: ${re}`);
  for (const re of FLUFF) ok(!re.test(text), `${lang}: the 0.3.1 section makes a claim it must not: ${re}`);
  ok(!/\bfree\b|مجان/i.test(n.title || ''), `${lang}: the 0.3.1 title says free`);
  const mx = text.split(/(?<=[.:؟])\s+/).filter((s) => /\bmatri(?:x|ces)\b|المصفوف/i.test(s));
  ok(!mx.some((s) => /\b(?:soon|coming|will|planned|next (?:version|release))\b|قريبًا|سنضيف|سيصبح|مخطط له|الإصدار القادم/i.test(s)), `${lang}: the 0.3.1 section promises something for the matrix`);
  ok(!/runs? Power BI (?:Desktop )?on (?:a )?Mac|Power BI Desktop (?:on|for) macOS/i.test(text), `${lang}: the 0.3.1 section says Power BI runs on a Mac`);
}
const keys31 = (l) => Object.keys((T && T[l] && T[l].beta && T[l].beta.new31) || {}).sort().join(',');
ok(keys31('en') && keys31('en') === keys31('ar'), `en and ar beta.new31 keys differ: ${keys31('en')} | ${keys31('ar')}`);
for (const [lang, html] of Object.entries(pages)) {
  const sec = (html.match(/<section id="new-031"[^>]*>[\s\S]*?<\/section>/) || [''])[0];
  ok(!!sec, `${lang}: no <section id="new-031"> on the page`);
  const used = [...sec.matchAll(/data-i18n(?:-html)?="beta\.new31\.([^"]+)"/g)].map((m) => m[1]);
  ok(used.length >= 8, `${lang}: the 0.3.1 section uses ${used.length} beta.new31 keys, want the title, the date and every line`);
  for (const k of used) ok(T.en.beta.new31 && T.en.beta.new31[k] != null && T.ar.beta.new31 && T.ar.beta.new31[k] != null, `${lang}: beta.new31.${k} missing in a language`);
  const hidden = /^<section id="new-031"[^>]*\shidden(?:="")?[\s>]/.test(sec), hero = (html.match(/<a [^>]*>[^<]*<i [^>]*bi-download[^>]*><\/i><span data-i18n="beta\.hero\.button">([^<]*)<\/span>/) || [])[1] || '';
  if (hidden) ok(/0\.3\.0/.test(hero) && !/0\.3\.1/.test(hero), `${lang}: the 0.3.1 section is hidden, but the download says "${hero}" (0.3.0 until the release)`);
  else {
    ok(/0\.3\.1/.test(hero), `${lang}: the 0.3.1 section is shown, but the download says "${hero}" (show it at the release, with the 0.3.1 download)`);
    ok(!PLACEHOLDER.test(((T[lang].beta.new31) || {}).date || ''), `${lang}: the 0.3.1 section is shown with the date placeholder: set the release day`);
  }
  ok(html.indexOf('<section id="new-031"') < html.indexOf('<section id="new">'), `${lang}: the 0.3.1 section comes after the 0.3.0 one (newest first)`);
}

if (fails.length) { console.error(`FAIL  whats-new  ${fails.length} of ${checks} checks\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS  whats-new  ${checks} checks`);
