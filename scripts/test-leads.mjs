// The Arabic-ready checklist and its sign-up page (LEAD1, 25 Oct 2026). No browser, no network:
//   - every text the checklist takes from the article is in the article (English in its English text, Arabic in its
//     Arabic translation): the checklist claims nothing the article doesn't; 19 kinds in 6 groups
//   - the PDFs were made from the printable pages scripts/leads/arabic-checklist.mjs builds now (the hashes the maker
//     wrote); each PDF is one page
//   - the form's endpoint is in ONE place (the page's form action); while it is https://formspree.io/f/FORM_ID_HERE the
//     page says so, is noindex, and is in no sitemap, llms.txt or link of another page (its go/ short links aside); once
//     the owner's id is in, the page must be indexable and in the sitemap (test-site-config then wants its /ar/ copy)
//   - the privacy page names Formspree (EN, AR); the short links open the page with their UTM tags
// The article lives on integration/0.3.1 until 0.3.1 reaches main: it is read from disk, else from that branch.
//   node scripts/test-leads.mjs
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { GROUPS, claims, html, ARTICLE } from './leads/arabic-checklist.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const fails = []; let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) fails.push(msg); };

export const PAGE = 'resources/arabic-report-checklist.html';
export const PDFS = ['assets/downloads/arabic-report-checklist-en.pdf', 'assets/downloads/arabic-report-checklist-ar.pdf'];
export const NOT_LIVE = 'https://formspree.io/f/FORM_ID_HERE';
const TR = 'assets/js/translations/article-power-bi-report-ready-for-arabic.js';

// the article's text, English and Arabic, from its translations (the English page is built from the same "en" strings)
function article() {
  let src = exists(TR) ? read(TR) : null, from = TR;
  if (!src) {
    try { src = execFileSync('git', ['show', `origin/integration/0.3.1:${TR}`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); from = `origin/integration/0.3.1:${TR}`; } catch (e) { return null; }
  }
  const window = {};
  new Function('window', src)(window);
  const t = Object.values(window).find((v) => v && v.en && v.ar);
  const flat = (o) => Object.values(o).flatMap((v) => (typeof v === 'string' ? [v] : flat(v)));
  const text = (o) => norm(flat(o).join('\n'));
  return { from, en: text(t.en), ar: text(t.ar) };
}
const norm = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/[\s ]+/g, ' ');

// 1. The checklist: the article's words, 19 kinds in 6 groups
const art = article();
ok(art, `the article's text: neither ${TR} nor origin/integration/0.3.1 has it (git fetch origin integration/0.3.1)`);
if (art) for (const [lang, where, t] of claims()) ok(art[lang].includes(norm(t)), `checklist (${lang}) ${where}: not in the article (${art.from}): "${t}"`);
// the sign-up page's claims are the article's sentences too: each is on the page (its translations) and in the article
const PAGE_CLAIMS = {
  en: ['19 kinds in six groups', 'Most Power BI reports in the Gulf are built in English first, or by someone who reads from the left. Then a manager asks for the Arabic version.',
    'Every place, order and alignment on the page stays as it was built: for a reader who starts at the left.', 'Each kind has one of three answers:',
    'DataArcus does it, through your approval.', 'Nothing is written before you approve the plan.', 'A Power BI Desktop setting.',
    'On an Arabic page you built yourself: the setting to change, by name.', 'Power BI has no setting for it.', 'Said plainly, with what you can do instead.',
    "It reads the report's files on your computer, never your data, and changes nothing."],
  ar: ['19 نوعًا في ست مجموعات', 'تُبنى معظم تقارير Power BI في الخليج بالإنجليزية أولًا، أو يبنيها شخص يقرأ من اليسار. ثم يطلب المدير النسخة العربية.',
    'فيبقى كل موضع وترتيب ومحاذاة في الصفحة كما بُني: لقارئ يبدأ من اليسار.', 'ولكل نوع واحد من ثلاثة أجوبة:',
    'يقوم به DataArcus، بموافقتك.', 'ولا يُكتب شيء قبل أن توافق على الخطة.', 'إعداد في Power BI Desktop.',
    'في صفحة عربية بنيتها بنفسك: الإعداد الذي تغيّره، باسمه.', 'لا إعداد له في Power BI.', 'نقولها بوضوح، مع ما يمكنك فعله بدلًا منه.',
    'يقرأ ملفات التقرير على جهازك، ولا يقرأ بياناتك، ولا يغيّر شيئًا.'],
};
{
  const window = {};
  new Function('window', read('assets/js/translations/arabic-checklist.js'))(window);
  const t = window.arabicChecklistTranslations;
  const flat = (o) => Object.values(o).flatMap((v) => (typeof v === 'string' ? [v] : flat(v)));
  for (const lang of ['en', 'ar']) {
    const page = norm(flat(t[lang].lc).join('\n'));
    for (const c of PAGE_CLAIMS[lang]) {
      ok(page.includes(norm(c)), `the page (${lang}) no longer says "${c}": update PAGE_CLAIMS with the page`);
      if (art) ok(art[lang].includes(norm(c)), `the page (${lang}) says "${c}", which is not in the article (${art.from})`);
    }
  }
}
ok(GROUPS.length === 6, `the article has 6 groups; the checklist ${GROUPS.length}`);
ok(GROUPS.flatMap((g) => g.rows).length === 19, `the article has 19 kinds; the checklist ${GROUPS.flatMap((g) => g.rows).length}`);

// 2. The printable pages and the PDFs
{
  const f = 'scripts/leads/arabic-checklist.built.json', built = exists(f) ? JSON.parse(read(f)) : {};
  for (const lang of ['en', 'ar']) ok(built[lang] === crypto.createHash('sha256').update(html(lang)).digest('hex'), `the ${lang} PDF was not made from the checklist as it is now (node scripts/leads/make-arabic-checklist.mjs)`);
}
for (const f of PDFS) {
  const pdf = exists(f) ? fs.readFileSync(path.join(ROOT, f), 'latin1') : '';
  const pages = (pdf.match(/\/Type\s*\/Page(?![a-z])/g) || []).length;
  ok(pdf.startsWith('%PDF-') && pages === 1, `${f}: must be a PDF of exactly 1 page (${pdf ? pages + ' pages' : 'missing'})`);
}

// 3. The page and its one endpoint
ok(exists(PAGE), `${PAGE}: missing`);
if (exists(PAGE)) {
  const h = read(PAGE);
  const actions = [...h.matchAll(/<form\b[^>]*\saction="(https:\/\/formspree\.io\/f\/[^"]*)"/g)].map((m) => m[1]);
  ok(actions.length === 1, `${PAGE}: one form posting to Formspree (found ${actions.length})`);
  // the one place: no other site file (the Arabic copy, generated from the page, aside) names a Formspree form
  const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '*.html', '*.js'], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n')
    .filter((f) => f && f !== PAGE && f !== 'ar/' + PAGE && !/^(node_modules|mcp|scripts|content)\//.test(f) && exists(f));
  const others = files.filter((f) => /formspree\.io\/f\//.test(read(f)));
  ok(!others.length, `the Formspree endpoint must live only in ${PAGE}'s form action; also in ${others.join(', ')}`);
  for (const f of PDFS) ok(h.includes(`href="/${f}"`), `${PAGE}: no download link to /${f}`);
  ok(/id="lead-off"/.test(h) && /id="lead-ok"/.test(h) && /id="lead-fail"/.test(h), `${PAGE}: the not-live, success and failure blocks (lead-off, lead-ok, lead-fail)`);
  ok(/id="lead-fail"[\s\S]*mailto:hello@DataArcus\.com[\s\S]*wa\.me\/971506583577/.test(h), `${PAGE}: the failure block must offer the email and WhatsApp buttons`);
  ok(/We'll email you the checklist and up to three follow-ups\. Unsubscribe any time\./.test(h), `${PAGE}: the consent line`);
  ok(/type="email"[^>]*required|required[^>]*type="email"/.test(h), `${PAGE}: the email field must be required`);
  const live = actions[0] && actions[0] !== NOT_LIVE;
  const sitemap = read('sitemap.xml'), llms = read('llms.txt'), url = 'https://dataarcus.com/' + PAGE;
  if (!live) {
    ok(/<meta name="robots" content="noindex/.test(h), `${PAGE}: not live (${NOT_LIVE}), so it must be noindex`);
    ok(!sitemap.includes(url), `${PAGE}: not live, so it must not be in sitemap.xml`);
    ok(!llms.includes(PAGE), `${PAGE}: not live, so it must not be in llms.txt`);
    ok(!exists('ar/' + PAGE), `${PAGE}: not live, so it has no Arabic copy yet`);
    // no page links to it (nav, footer, articles, tools); only its go/ short links forward to it
    const name = path.basename(PAGE);
    const linking = files.filter((f) => f.endsWith('.html') && !f.startsWith('go/') && read(f).includes(name));
    ok(!linking.length, `${PAGE}: not live, so no page may link to it: ${linking.join(', ')}`);
  } else {
    ok(exists(ARTICLE), `${PAGE}: live, but the article it and the PDFs link (${ARTICLE}) is not on this branch: it goes live after 0.3.1 reaches main`);
    ok(/^https:\/\/formspree\.io\/f\/[A-Za-z0-9]{6,}$/.test(actions[0]), `${PAGE}: the endpoint ${actions[0]} is not a Formspree form id`);
    ok(!/<meta name="robots" content="noindex/.test(h), `${PAGE}: live, so it must not be noindex`);
    ok(sitemap.includes(`<loc>${url}</loc>`), `${PAGE}: live, so it must be in sitemap.xml (then node scripts/ar-pages.mjs --write)`);
  }
}

// 4. The privacy page (EN and AR) and the short links
const priv = read('assets/js/translations/privacy.js');
ok((priv.match(/Formspree/g) || []).length >= 2 && (priv.match(/formspree\.io\/legal\/privacy-policy/g) || []).length >= 2, 'privacy: the English and Arabic texts must name Formspree and link its privacy policy');
// one campaign per post and a pair of links (test-analytics-events.mjs): the English post and the Arabic post, each with
// its personal and page link
for (const [name, lang, content] of [['arabic-checklist', null, 'personal'], ['arabic-checklist-page', null, 'page'], ['arabic-checklist-ar', 'ar', 'personal'], ['arabic-checklist-ar-page', 'ar', 'page']]) {
  const go = `go/${name}/index.html`, g = exists(go) ? read(go) : '';
  const to = (g.match(/location\.replace\('([^']+)'/) || [])[1] || '';
  const camp = lang ? 'arabic-checklist-ar-' : 'arabic-checklist-';
  ok(to.startsWith('https://dataarcus.com/' + PAGE + '?') && new RegExp(`utm_source=linkedin&utm_medium=social&utm_campaign=${camp}\\d{4}-\\d{2}-\\d{2}&utm_content=${content}$`).test(to) && (lang ? /[?&]lang=ar(&|$)/.test(to) : !/lang=/.test(to)), `${go}: must forward to ${PAGE}${lang ? '?lang=ar' : ''} with the LinkedIn UTM tags (got "${to}")`);
  ok(/<meta name="robots" content="noindex"/.test(g), `${go}: noindex, as the other short links`);
}

if (fails.length) { fails.forEach((f) => console.log('  - ' + f)); console.log(`FAIL  test-leads  ${fails.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  test-leads  ${checks} checks`);
