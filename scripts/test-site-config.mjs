// The website's configuration files, checked on every push (owner's rule 2026-10-06: any website change runs a check
// on all site config files). No network: it reads the repo as GitHub Pages publishes it.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverSource } from '../mcp/test-source.mjs';   // (0.3.1 S9: the tools are registered in mcp/tools/, one module a tool)

// (fileURLToPath, as check-min.mjs: a URL's pathname is "/C:/..." on Windows, which resolved to "C:\C:\...")
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const SITE = 'https://dataarcus.com/';
const local = (url) => { let p = url.replace(SITE, ''); if (p === '' || p.endsWith('/')) p += 'index.html'; return p; };

// _config.yml: the site's own files are published, notes and code are not
const config = read('_config.yml');
for (const x of ['mcp', 'content', 'scripts', 'CLAUDE.md']) ok(new RegExp(`exclude:.*\\b${x.replace('.', '\\.')}\\b`).test(config), `_config.yml: ${x} must stay excluded`);
ok(/include:.*\.well-known/.test(config), '_config.yml: .well-known must be included (Jekyll hides dot folders)');
ok(exists('CNAME') && read('CNAME').trim() === 'dataarcus.com', 'CNAME must be dataarcus.com');

// robots.txt and the sitemap
const robots = read('robots.txt');
ok(/Sitemap:\s*https:\/\/dataarcus\.com\/sitemap\.xml/.test(robots), 'robots.txt must point to the sitemap');
ok(!/Disallow:\s*\/\s*$/m.test(robots), 'robots.txt must not block the whole site');
const sitemap = read('sitemap.xml');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
ok(locs.length > 0, 'sitemap.xml has no <loc>');
for (const u of locs) {
  ok(u.startsWith(SITE), `sitemap: ${u} is not on ${SITE}`);
  ok(exists(local(u)), `sitemap: ${u} has no file (${local(u)})`);
  ok(!u.includes('/go/'), `sitemap: ${u} is a short link (redirect)`);
}

// icons and the web manifest
for (const f of ['favicon.ico', 'assets/img/favicon.svg', 'assets/img/favicon-48.png', 'assets/img/favicon-192.png', 'assets/img/favicon-512.png', 'assets/img/apple-touch-icon.png']) ok(exists(f), `missing ${f}`);
let manifest = null;
try { manifest = JSON.parse(read('site.webmanifest')); } catch (e) { fails.push(`site.webmanifest is not valid JSON: ${e.message}`); }
if (manifest) {
  ok(manifest.name && manifest.start_url && manifest.theme_color, 'site.webmanifest needs name, start_url, theme_color');
  for (const i of manifest.icons || []) ok(exists(i.src.replace(/^\//, '')), `site.webmanifest icon missing: ${i.src}`);
}

// security.txt (RFC 9116): a contact and an Expires date in the future
const sec = read('.well-known/security.txt');
ok(/^Contact:\s*\S+/m.test(sec), 'security.txt needs Contact');
const exp = (sec.match(/^Expires:\s*(\S+)/m) || [])[1];
ok(exp && new Date(exp) > new Date(), `security.txt Expires is missing or past (${exp})`);
ok(exp && new Date(exp) - new Date() > 30 * 864e5, `security.txt Expires is within 30 days (${exp}): renew it`);

// llms.txt: every link is a page that exists
const llms = read('llms.txt');
ok(llms.startsWith('# '), 'llms.txt must start with "# " (its title)');
for (const m of llms.matchAll(/\((https:\/\/dataarcus\.com\/[^)]*)\)/g)) ok(exists(local(m[1])), `llms.txt links a missing page: ${m[1]}`);

// every published page: icon, manifest, theme colour; every page in the sitemap: canonical and a preview image
const pages = [];
const walk = (d) => { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
  const p = path.join(d, e.name);
  if (e.isDirectory()) { if (!/^(node_modules|mcp|content|scripts|\.|go$)/.test(e.name)) walk(p); }
  else if (e.name.endsWith('.html')) pages.push(p);
} };
walk('.');
for (const p of pages) {
  const h = read(p);
  ok(/rel="icon"[^>]*favicon-48\.png/.test(h), `${p}: no 48 px PNG icon`);
  ok(/rel="manifest" href="\/site\.webmanifest"/.test(h), `${p}: no manifest link`);
  ok(/name="theme-color"/.test(h), `${p}: no theme-color`);
  // (round 16: main.min.js is cached like every script, so a page loads it with its version stamp, as the others)
  ok(!/main\.min\.js"/.test(h) || /main\.min\.js\?v=[0-9a-z]+"/.test(h), `${p}: main.min.js without a ?v= stamp`);
}
for (const u of locs) {
  const h = read(local(u));
  ok(/rel="canonical"/.test(h), `${local(u)}: no canonical`);
  // (round 17, the outside review's G-08: a canonical must name the page itself, or search engines index another one)
  const own = SITE + local(u).replace(/\\/g, '/').replace(/(^|\/)index\.html$/, '$1');
  const canon = (h.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/) || h.match(/<link[^>]*href="([^"]+)"[^>]*rel="canonical"/) || [])[1];
  ok(!canon || canon === own, `${local(u)}: canonical is ${canon}, not the page's own URL ${own}`);
  ok(/property="og:image"/.test(h), `${local(u)}: no og:image`);
}

// (round 19: a script's folder from a URL's pathname is "/C:/..." and %-encoded on Windows: fileURLToPath, as here)
const scriptsWith = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((f) => f.isDirectory() ? (f.name === 'node_modules' ? [] : scriptsWith(path.join(dir, f.name))) : /\.m?js$/.test(f.name) && !/\.min\.js$/.test(f.name) ? [path.join(dir, f.name)] : []);
for (const f of ['scripts', 'mcp'].flatMap(scriptsWith)) ok(!/import\.meta\.url\)\.pathname/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')), `${f}: builds a path from the module URL's pathname (use fileURLToPath)`);

// the AI agent's public pages say what the MCP server has (0.2.9, the audit's A7-10): the number of tools, in English
// and Arabic, a line for each tool on the beta page, and check_report (not create_report) named as the offline check
{
  const tools = [...serverSource().matchAll(/server\.registerTool\('([a-z_]+)'/g)].map((m) => m[1]), n = tools.length;
  const beta = read('assets/js/translations/beta-page.js'), home = read('assets/js/translations/homepage.js'), page = read('power-bi-mcp/index.html');
  const [betaEn, betaAr] = [beta.slice(0, beta.search(/^\s*ar:\s*\{|"ar":\s*\{/m)), beta.slice(beta.search(/^\s*ar:\s*\{|"ar":\s*\{/m))];
  ok(new RegExp(`"title": "The ${n} tools"`).test(betaEn) && new RegExp(`"title": "[^"]*${n}[^"]*أداة`).test(betaAr), `the beta page's tools title must say ${n} tools in English and Arabic (the server has ${n})`);
  ok(new RegExp(`public beta \\(${n} tools\\)`).test(home) && new RegExp(`\\(${n} أداة\\)`).test(home), `the home page's agent line must say ${n} tools in English and Arabic`);
  ok(new RegExp(`>The ${n} tools<`).test(page), `power-bi-mcp/index.html must say "The ${n} tools"`);
  const missing = tools.filter((t) => !page.includes(`<code translate="no">${t}</code>`) || (beta.match(new RegExp(`"${t}":`, 'g')) || []).length < 2);
  ok(!missing.length, `the beta page must have a line for each tool in English and Arabic: missing ${missing.join(', ')}`);
  ok(!/"validator": "It checks the report offline/.test(betaEn) && /check_report/.test((betaEn.match(/"safe":[\s\S]*?\}/) || [''])[0]), 'the beta page must say check_report is the offline check (create_report does not run the validator)');
}

// the Health Check's "30+ checks" pill (17 Oct, the outside audit: a count typed by hand must follow the engine): the
// number in English and Arabic is never more than the engine's rules
{
  const rules = Object.keys(createRequire(import.meta.url)(path.join(ROOT, 'assets/js/model-health-engine.js')).RULES).length;
  const mh = read('assets/js/translations/model-health.js');
  const said = [...mh.matchAll(/"rules": "(?:(\d+)\+ checks|أكثر من (\d+) فحصًا)"/g)].map((m) => +(m[1] || m[2]));
  ok(said.length === 2 && said.every((n) => n <= rules), `the Health Check says ${said.join(' / ')} checks in English / Arabic; the engine has ${rules} rules`);
}

// B-155 (the outside audit, 18 Oct): a .pbit holds the model's definition, not the data Power BI loaded, but that
// definition can hold small tables typed in with Enter data (compressed in the Power Query text) and DATATABLE values in
// DAX. No public page says it has "no data rows"; each page that talks about it says the exact thing, English and Arabic.
{
  const EN = "not the data Power BI loaded", AR = 'لا البيانات التي حمّلها Power BI';
  const old = /no data rows|without any data rows|has the model but no data|contains no data|صفوف بيانات|النموذج بلا بيانات/;
  const files = ['tools/power-bi-model-health-check.html', 'articles/article-power-bi-model-health-check.html', 'articles/article-power-bi-model-ai-ready.html', 'services/copilot-readiness-audit.html'];
  const tr = ['model-health', 'article-power-bi-model-health-check', 'article-power-bi-model-ai-ready', 'copilot-audit'].map((n) => `assets/js/translations/${n}.js`);
  for (const f of files.concat(files.map((f) => 'ar/' + f), tr, tr.map((f) => f.replace(/\.js$/, '.min.js')))) {
    const t = read(f), say = f.startsWith('ar/') ? AR : EN;
    ok(!old.test(t), `${f}: still says a .pbit has no data (B-155): ${(t.match(old) || [])[0]}`);
    ok(t.includes(say) && t.includes('Enter data') && t.includes('DATATABLE'), `${f}: must say a .pbit holds the model's definition, "${say}", and name Enter data and DATATABLE (B-155)`);
  }
  for (const f of tr.concat(files.map((f) => 'ar/' + f))) ok(read(f).includes(AR), `${f}: the Arabic must say "${AR}" (B-155)`);
}

// AUD-040 (night audit, 19 Oct): a .pbit also keeps values saved in the report's filters, slicers and formatting (Microsoft
// Learn, desktop-templates: "the value 'Contoso' is persisted as part of the metadata"). The same four pages name them next
// to Enter data and DATATABLE, and the audit page no longer says the data "never leaves your machine".
{
  const EN = "values saved in the report's filters, slicers and formatting", AR = 'محفوظة في فلاتر التقرير والـ slicers والتنسيق';
  const old = /The data Power BI loaded never leaves|البيانات التي حمّلها Power BI لا تغادر/;
  const files = ['tools/power-bi-model-health-check.html', 'articles/article-power-bi-model-health-check.html', 'articles/article-power-bi-model-ai-ready.html', 'services/copilot-readiness-audit.html'];
  const tr = ['model-health', 'article-power-bi-model-health-check', 'article-power-bi-model-ai-ready', 'copilot-audit'].map((n) => `assets/js/translations/${n}.js`);
  for (const f of files.concat(files.map((f) => 'ar/' + f), tr, tr.map((f) => f.replace(/\.js$/, '.min.js')))) {
    const t = read(f), say = f.startsWith('ar/') ? AR : EN;
    ok(!old.test(t), `${f}: still says the loaded data never leaves the machine (AUD-040)`);
    ok(t.includes(say), `${f}: must name "${say}" among what a .pbit keeps (AUD-040)`);
  }
  for (const f of tr) ok(read(f).includes(AR), `${f}: the Arabic must say "${AR}" (AUD-040)`);
  for (const f of ['services/copilot-readiness-audit.html', 'tools/power-bi-model-health-check.html']) {
    const ld = read(f).match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g).join('');
    ok(ld.includes(EN) || ld.includes("values saved in the report's filters"), `${f}: the FAQ JSON-LD must name the filter values (AUD-040)`);
  }
}

// The Arabic copies at /ar/ (mcp/plans/ARABIC-INDEXING.md, option 2): each page in scripts/ar-pages.mjs's PAIRS and its
// copy name each other (hreflang en, ar, x-default = English, fully qualified), each names itself as canonical, the copy
// is lang="ar" dir="rtl" with its title, description and Open Graph in Arabic within the limits search results show,
// its links go to the Arabic copy of a page that has one and every file it names exists, the sitemap lists both with
// their alternates, robots.txt lets crawlers in, llms.txt names them. (That each copy is what a fresh render gives is
// scripts/ar-pages.mjs's own check, in CI after Chromium is installed.)
{
  const { PAIRS, arFile, urlOf, fileOf, alternates } = await import('./ar-pages.mjs');
  const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([a-z:-]+)="([^"]*)"/gi)].map((m) => [m[1].toLowerCase(), m[2].replace(/&amp;/g, '&')]));
  const tags = (h, name) => [...h.replace(/<script\b[\s\S]*?<\/script>/gi, '').matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => attrs(m[0]));
  const head = (h) => {
    const links = tags(h, 'link'), metas = tags(h, 'meta'), html = tags(h, 'html')[0] || {};
    const meta = (k, v) => (metas.find((m) => m[k] === v) || {}).content;
    return { lang: html.lang, dir: html.dir, title: ((h.match(/<title>([^<]*)<\/title>/) || [])[1] || '').trim(), description: meta('name', 'description'),
      ogTitle: meta('property', 'og:title'), ogDescription: meta('property', 'og:description'), ogUrl: meta('property', 'og:url'),
      canonical: (links.find((l) => l.rel === 'canonical') || {}).href, alt: links.filter((l) => l.rel === 'alternate' && l.hreflang).map((l) => [l.hreflang, l.href]) };
  };
  const AR = /[؀-ۿ]/;
  const onDisk = exists('ar') ? fs.readdirSync(path.join(ROOT, 'ar'), { recursive: true }).map((f) => 'ar/' + f.split(path.sep).join('/')).filter((f) => f.endsWith('.html')) : [];
  // every public page has its copy: the pages outside the sitemap are exactly the ones lang-manager's hasArCopy() leaves
  // English (404.html, a -lab page), so the links it rewrites at run time go to copies that exist
  const want = pages.map((p) => p.split(path.sep).join('/')).filter((p) => !p.startsWith('ar/') && !/^404\.html$|-lab\.html$/.test(p)).sort();
  ok(JSON.stringify(want) === JSON.stringify([...PAIRS].sort()), `the pages with an Arabic copy (the sitemap) must be every page but 404.html and -lab pages: missing ${want.filter((p) => !PAIRS.includes(p)).join(', ') || '-'}, extra ${PAIRS.filter((p) => !want.includes(p)).join(', ') || '-'}`);
  for (const f of onDisk) ok(PAIRS.map(arFile).includes(f), `${f}: an Arabic copy with no English page in scripts/ar-pages.mjs PAIRS`);
  for (const en of PAIRS) {
    const ar = arFile(en);
    ok(exists(en) && exists(ar), `the pair ${en} and ${ar}: ${exists(en) ? ar : en} is missing`);
    if (!exists(en) || !exists(ar)) continue;
    const E = head(read(en)), A = head(read(ar)), want = JSON.stringify(alternates(en));
    ok(E.lang === 'en' && !E.dir, `${en}: <html lang="en"> (got lang=${E.lang} dir=${E.dir})`);
    ok(A.lang === 'ar' && A.dir === 'rtl', `${ar}: <html lang="ar" dir="rtl"> (got lang=${A.lang} dir=${A.dir})`);
    for (const [f, h, own] of [[en, E, urlOf(en)], [ar, A, urlOf(ar)]]) {
      ok(JSON.stringify(h.alt) === want, `${f}: hreflang must be exactly ${want} (got ${JSON.stringify(h.alt)})`);
      ok(h.alt.every(([, u]) => u.startsWith(SITE)), `${f}: hreflang addresses must be fully qualified https://dataarcus.com/...`);
      ok(h.canonical === own, `${f}: canonical ${h.canonical}, not its own ${own}`);
      ok(h.ogUrl === own, `${f}: og:url ${h.ogUrl}, not its own ${own}`);
    }
    for (const k of ['title', 'description', 'ogTitle', 'ogDescription']) {
      ok(E[k] && A[k] && E[k] !== A[k], `${ar}: ${k} is the same as the English page's (or missing): "${(A[k] || '').slice(0, 50)}"`);
      ok(AR.test(A[k] || ''), `${ar}: ${k} has no Arabic letters: "${(A[k] || '').slice(0, 50)}"`);
    }
    ok([...A.title].length <= 60, `${ar}: title over 60 characters (${[...A.title].length}), the limit the English titles keep`);
    ok(A.description && [...A.description].length <= 155, `${ar}: description empty or over 155 characters (${[...(A.description || '')].length})`);
    // every address in the copy: the files exist; a page link goes to the Arabic copy when the page has one
    const h = read(ar).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (s) => s.replace(/>[\s\S]*<\//, '></'));
    for (const m of h.matchAll(/<([a-z]+)\b[^>]*?\s(href|src|poster|action)="([^"]*)"/gi)) {
      const [, tag, , val] = m;
      if (/^(#|mailto:|tel:|data:|javascript:)/i.test(val) || /rel="(canonical|alternate|preconnect)"/.test(m[0])) continue;
      if (/^https?:\/\//i.test(val) && !val.startsWith(SITE)) continue;
      const p = new URL(val.replace(/&amp;/g, '&'), urlOf(ar)).pathname, file = fileOf(p);
      ok(exists(file), `${ar}: ${val} is not on the site (${file})`);
      // (the language switch, marked hreflang="en", is the one link meant for the English page)
      if (tag.toLowerCase() === 'a' && !file.startsWith('ar/') && !/\shreflang="en"/.test(m[0] + h.slice(m.index + m[0].length).split('>')[0])) ok(!PAIRS.includes(file), `${ar}: links to ${val}, which has an Arabic copy (${arFile(file)})`);
    }
  }
  // the sitemap: the xhtml namespace; both copies of each pair, each with the alternates of the pair, itself included
  ok(/<urlset[^>]*\sxmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/.test(sitemap), 'sitemap.xml: the xmlns:xhtml namespace is not declared');
  const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({ loc: (m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1], alt: [...m[1].matchAll(/<xhtml:link\b[^>]*>/g)].map((t) => attrs(t[0])).map((a) => [a.hreflang, a.href]) }));
  for (const en of PAIRS) for (const u of [urlOf(en), urlOf(arFile(en))]) {
    const e = entries.find((x) => x.loc === u);
    ok(e, `sitemap.xml: no entry for ${u}`);
    if (e) ok(JSON.stringify(e.alt) === JSON.stringify(alternates(en)), `sitemap.xml: ${u} must list the alternates ${JSON.stringify(alternates(en))} (got ${JSON.stringify(e.alt)})`);
  }
  for (const e of entries) if (e.alt.length) ok(PAIRS.some((en) => [urlOf(en), urlOf(arFile(en))].includes(e.loc)), `sitemap.xml: ${e.loc} has alternates but no Arabic copy`);
  ok(!/^Disallow:\s*\/ar\b/im.test(robots), 'robots.txt must not block /ar/');
  ok(PAIRS.some((en) => llms.includes(`(${urlOf(arFile(en))})`)), 'llms.txt must name the Arabic versions (a link to an /ar/ page)');
}

if (fails.length) { console.error(`FAIL  site config: ${fails.length} problem(s)\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS  site config: _config, CNAME, robots, sitemap (${locs.length} URLs), icons, manifest, security.txt, llms.txt, ${pages.length} pages`);
