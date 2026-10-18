// The Arabic pages at /ar/ (mcp/plans/ARABIC-INDEXING.md, option 2; step 1, the pilot). Each English page in PAIRS
// gets a copy at ar/<the same path>: real Arabic HTML on its own address, so search engines index the Arabic page.
// The copy is made by the same code visitors run: the browser opens the page at ?lang=ar on the local server, and
// lang-manager.js translates the page's own HTML with the translations it loaded (the page as written, not the page
// after every script ran: the scripts run again on the copy and would add their widgets twice). Then what must differ:
//   - <html lang="ar" dir="rtl"> and the Arabic font in the file itself; title, description and Open Graph in Arabic
//   - canonical and og:url = the /ar/ address; hreflang en / ar / x-default (x-default = English) on both copies
//   - every relative address made root-absolute (from /ar/tools/, "../assets" would be /ar/assets), and links to a page
//     that has an Arabic copy go to that copy (the others stay English)
//   - the language switch as a plain link to the English page (lang-manager replaces it with its button)
//   - inline scripts byte for byte (their CSP hashes stay); the policy is written by csp.mjs, as on every page
// Generated files are never edited by hand: CI renders them again and fails when a committed file differs.
//   node scripts/ar-pages.mjs           check: every copy, the English pages' hreflang lines and the sitemap are what
//                                       a fresh render gives, and each copy loads with no missing file or link
//   node scripts/ar-pages.mjs --write   write them
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SITE = 'https://dataarcus.com/';

// The pilot: the tools hub and the four tools whose scripts load nothing by a page-relative address. The Health Check,
// the Theme Generator, the Licensing Calculator and the two exams load files from '../assets/...' in their scripts
// (a worker, a sample, the builder, the prices, the outline), which from /ar/tools/ would be /ar/assets/: step 2.
export const PAIRS = ['tools/index.html', 'tools/dax-calendar-table-generator.html', 'tools/dax-measure-builder.html', 'tools/svg-kpi-designer.html'];

export const arFile = (file) => 'ar/' + file;
// a page file's address ("tools/index.html" -> https://dataarcus.com/tools/), and back
export const urlOf = (file) => SITE + file.replace(/(^|\/)index\.html$/, '$1');
export const fileOf = (p) => { p = p.replace(/^\/+/, ''); return !p || p.endsWith('/') ? p + 'index.html' : p; };
// the three hreflang lines, the same on both copies of a page: each lists itself and the other (Google: reciprocal)
export const alternates = (enFile) => [['en', urlOf(enFile)], ['ar', urlOf(arFile(enFile))], ['x-default', urlOf(enFile)]];

// The English page with its hreflang lines right after its canonical, indented like it (the lines are replaced, never
// added twice)
export function withAlternates(html, enFile) {
  const bare = html.replace(/^[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\r?\n/gm, '');
  const m = bare.match(/^([ \t]*)<link rel="canonical"[^>]*>\r?\n/m);
  if (!m) throw new Error(`${enFile}: no canonical line`);
  const eol = m[0].endsWith('\r\n') ? '\r\n' : '\n';
  const lines = alternates(enFile).map(([l, u]) => `${m[1]}<link rel="alternate" hreflang="${l}" href="${u}" />${eol}`).join('');
  return bare.slice(0, m.index + m[0].length) + lines + bare.slice(m.index + m[0].length);
}

// The sitemap with the pairs: the xhtml namespace; on each pair's two <url> entries the three alternates (after the
// entry's own lines, so sitemap-lastmod.mjs still finds <loc> then <lastmod>); the Arabic entry right after the English
// one, with the English entry's lines, except its own lastmod once it has one (sitemap-lastmod.mjs keeps that)
export function sitemapWithPairs(xml) {
  const ns = 'xmlns:xhtml="http://www.w3.org/1999/xhtml"';
  let out = xml.includes(ns) ? xml : xml.replace(/<urlset xmlns="([^"]+)"/, `<urlset xmlns="$1" ${ns}`);
  const blocks = [...out.matchAll(/([ \t]*)<url>[\s\S]*?<\/url>\r?\n/g)];
  const locOf = (b) => (b.match(/<loc>([^<]+)<\/loc>/) || [])[1];
  const pairOf = new Map(PAIRS.flatMap((f) => [[urlOf(f), f], [urlOf(arFile(f)), f]]));
  const arLastmod = new Map(blocks.filter((b) => locOf(b[0]).startsWith(SITE + 'ar/')).map((b) => [locOf(b[0]), (b[0].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1]]));
  const clean = (b) => b.replace(/^[ \t]*<xhtml:link [^\n]*\n/gm, '');
  const withLinks = (b, ind, f) => b.replace(/([ \t]*)<\/url>/, (all, end) => alternates(f).map(([l, u]) => `${ind}  <xhtml:link rel="alternate" hreflang="${l}" href="${u}"/>\n`).join('') + all);
  let res = '', at = 0;
  for (const b of blocks) {
    res += out.slice(at, b.index); at = b.index + b[0].length;
    const loc = locOf(b[0]);
    if (loc.startsWith(SITE + 'ar/')) continue;   // written again after its English entry
    const f = pairOf.get(loc), own = clean(b[0]);
    if (!f) { res += own; continue; }
    res += withLinks(own, b[1], f);
    const ar = urlOf(arFile(f)), last = arLastmod.get(ar);
    let copy = own.replace(`<loc>${loc}</loc>`, `<loc>${ar}</loc>`);
    if (last) copy = copy.replace(/<lastmod>[^<]+<\/lastmod>/, `<lastmod>${last}</lastmod>`);
    res += withLinks(copy, b[1], f);
  }
  return res + out.slice(at);
}

// The Arabic copy of an English page, from the local server (the English page as it is on disk)
export async function render(browser, url, enFile) {
  const { visitor, ready } = await import('./tests/lib.mjs');
  const { apply } = await import('./csp.mjs');
  const v = await visitor(browser, { viewport: [1440, 900] });
  try {
    await v.pg.goto(`${url}/${enFile}?lang=ar`, { waitUntil: 'networkidle' });
    await ready(v.pg);
    const html = await v.pg.evaluate(async ({ enFile, pairs, alt, site }) => {
      const src = await (await fetch('/' + enFile, { cache: 'no-store' })).text();
      const doc = new DOMParser().parseFromString(src, 'text/html'), lm = window.langManager;
      if (!lm || lm.currentLang !== 'ar') throw new Error('the page did not open in Arabic');
      lm.applyLanguage(doc);
      const root = doc.documentElement, head = doc.head, own = alt[1][1];
      root.setAttribute('lang', 'ar'); root.setAttribute('dir', 'rtl'); doc.body.classList.add('rtl');
      const set = (sel, attr, val) => { const e = doc.querySelector(sel); if (e) e.setAttribute(attr, val); };
      set('link[rel="canonical"]', 'href', own);
      set('meta[property="og:url"]', 'content', own);
      // the Arabic font from the start (lang-manager adds it too, but only once its script runs)
      const font = lm.updateDirection.toString().match(/https:\/\/fonts\.googleapis\.com\/css2\?family=IBM\+Plex\+Sans\+Arabic[^'"]*/)[0];
      const fl = doc.createElement('link'); fl.id = 'ar-font'; fl.rel = 'stylesheet'; fl.href = font;
      const pre = [...head.querySelectorAll('link[rel="preconnect"]')].pop();
      head.insertBefore(fl, pre ? pre.nextSibling : null); head.insertBefore(doc.createTextNode('\n  '), fl);
      // addresses: relative ones from the English page's folder become root-absolute; links to a page with an Arabic
      // copy go to the copy (relative, root-absolute or https://dataarcus.com/...)
      const base = new URL('/' + enFile, location.origin);
      const page = (p) => { p = p.replace(/^\/+/, ''); return !p || p.endsWith('/') ? p + 'index.html' : p; };
      const fix = (val, link) => {
        const abs = val.startsWith(site);
        if (!abs && (/^(#|[a-z][a-z0-9+.-]*:|\/\/)/i.test(val) || val === '')) return val;
        const u = new URL(abs ? val.slice(site.length - 1) : val, base);
        let p = u.pathname;
        if (link && pairs.includes(page(p))) p = '/ar' + p;
        return (abs ? site.slice(0, -1) : '') + p + u.search + u.hash;
      };
      for (const e of doc.querySelectorAll('[href], [src], [poster], [action]')) for (const a of ['href', 'src', 'poster', 'action']) {
        const val = e.getAttribute(a);
        if (val === null || (e.matches('link[rel="canonical"], link[rel="alternate"]') && a === 'href')) continue;
        const to = fix(val, a === 'href' && e.tagName === 'A');
        if (to !== val) e.setAttribute(a, to);
      }
      for (const e of doc.querySelectorAll('[srcset]')) e.setAttribute('srcset', e.getAttribute('srcset').split(',').map((s) => s.trim().replace(/^\S+/, (u) => fix(u, false))).join(', '));
      // the language switch, a plain link to the English page for a reader or crawler without scripts
      const nav = doc.querySelector('.navbar-nav');
      if (nav) nav.insertAdjacentHTML('beforeend', `<li class="nav-item desktop-lang-switcher"><a class="nav-link lang-btn-desktop" href="${new URL(alt[0][1]).pathname}" hreflang="en" lang="en" aria-label="${lm.switcherAria()}"><i class="bi bi-globe2 me-1"></i> <span lang="en">${lm.switcherLabel(false)}</span></a></li>\n`);
      return '<!DOCTYPE html>\n' + root.outerHTML + '\n';
    }, { enFile, pairs: PAIRS, alt: alternates(enFile), site: SITE });
    if (v.errs.length) throw new Error(`${enFile}?lang=ar: ${v.errs.slice(0, 3).join(' | ')}`);
    return apply(html);
  } finally { await v.ctx.close(); }
}

// An Arabic copy as a visitor opens it, with English saved as their language: still Arabic, every file it asks the
// site for exists, and every link on it (after its scripts ran) goes to a page that exists
async function loads(browser, url, file) {
  const { visitor, ready } = await import('./tests/lib.mjs');
  const v = await visitor(browser, { viewport: [1440, 900] });
  const missing = [];
  v.pg.on('response', (r) => { const u = new URL(r.url()); if (u.origin === url && r.status() >= 400) missing.push(u.pathname); });
  await v.ctx.addInitScript(() => { try { localStorage.setItem('dataarcus-lang', 'en'); } catch (e) { /* ignore */ } });
  try {
    await v.pg.goto(`${url}/${file}`, { waitUntil: 'networkidle' });
    await ready(v.pg);
    const r = await v.pg.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir,
      links: [...new Set([...document.querySelectorAll('a[href]')].map((a) => new URL(a.getAttribute('href'), location.href)).filter((u) => u.origin === location.origin).map((u) => u.pathname))] }));
    const problems = [];
    if (r.lang !== 'ar' || r.dir !== 'rtl') problems.push(`${file}: opens as ${r.lang}/${r.dir} for a visitor who saved English`);
    if (missing.length) problems.push(`${file}: the site has no ${[...new Set(missing)].join(', ')}`);
    const broken = r.links.filter((p) => !fs.existsSync(path.join(ROOT, fileOf(p))));
    if (broken.length) problems.push(`${file}: links to missing pages ${broken.join(', ')}`);
    if (v.errs.length) problems.push(`${file}: ${v.errs.slice(0, 3).join(' | ')}`);
    return problems;
  } finally { await v.ctx.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write');
  const { serve, launch } = await import('./tests/lib.mjs');
  const lf = (s) => s.replace(/\r\n/g, '\n');
  const read = (f) => (fs.existsSync(path.join(ROOT, f)) ? fs.readFileSync(path.join(ROOT, f), 'utf8') : null);
  const stale = [];
  const put = (f, want) => {
    const now = read(f);
    if (now !== null && lf(now) === lf(want)) return;
    if (write) { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), want); stale.push(f); return; }
    const a = lf(now || '').split('\n'), b = lf(want).split('\n'), i = a.findIndex((l, k) => l !== b[k]);
    stale.push(now === null ? `${f}: missing` : `${f}: line ${i + 1} is\n      ${(a[i] || '(end)').trim().slice(0, 160)}\n    a fresh render gives\n      ${(b[i] || '(end)').trim().slice(0, 160)}`);
  };
  // the English pages first: the copies are rendered from them, hreflang lines included
  for (const f of PAIRS) put(f, withAlternates(read(f), f));
  put('sitemap.xml', sitemapWithPairs(read('sitemap.xml')));
  const orphans = fs.existsSync(path.join(ROOT, 'ar')) ? fs.readdirSync(path.join(ROOT, 'ar'), { recursive: true }).map((f) => 'ar/' + f.split(path.sep).join('/')).filter((f) => f.endsWith('.html') && !PAIRS.map(arFile).includes(f)) : [];
  for (const f of orphans) { if (write) { fs.rmSync(path.join(ROOT, f)); stale.push(`${f} (removed: no English page in PAIRS)`); } else stale.push(`${f}: not the copy of a page in PAIRS`); }
  const server = await serve(), browser = await launch(), problems = [];
  try {
    for (const f of PAIRS) put(arFile(f), await render(browser, server.url, f));
    if (write || !stale.length) for (const f of PAIRS) problems.push(...await loads(browser, server.url, arFile(f)));
  } finally { await browser.close(); server.close(); }
  if (write) console.log(stale.length ? `Wrote ${stale.length} files:\n  ${stale.join('\n  ')}` : `All ${PAIRS.length} Arabic copies are up to date.`);
  else if (stale.length) console.error(`${stale.length} files differ from a fresh render (node scripts/ar-pages.mjs --write; never edit them by hand):\n  ${stale.join('\n  ')}`);
  if (problems.length) console.error(`The Arabic copies as a visitor opens them:\n  ${problems.join('\n  ')}`);
  if ((!write && stale.length) || problems.length) process.exit(1);
  if (!write) console.log(`PASS  ${PAIRS.length} Arabic copies, their English pages' hreflang lines and the sitemap match a fresh render; each loads with no missing file or link.`);
}
