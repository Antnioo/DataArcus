// 0.3.2 SP36 (the split, finish: lang-manager.js -> locale-routes.js, locale-catalog.js, locale-dom.js;
// mcp/work/SP36.md): the language manager characterised on the base (integration/0.3.2 c2dbd06, before any move) and
// the same after each move. 14 sessions of made-up inputs, each in a fresh visitor, through window.langManager (its
// methods stay as they were: the split keeps them as one-line delegates). After every step: the manager's language
// and state, <html> lang/dir, body.rtl, the font links, the title and every meta and link tag it writes, every
// translated element (text, HTML, attributes), the switcher, the saved language, the address and history, the
// warnings and errors. Recorded in fixtures/sp36-lang.json; SP36_RECORD=1 records again (only on the base, never to
// make a run pass).
//   S1..S14  the sessions as recorded (the precedence of an Arabic copy, ?lang=, the saved language and the browser's;
//            storage blocked; a switch with and without an Arabic copy; a breakpoint crossing; made-up documents and
//            dictionaries; the Arabic copy's link fallback; the route table on made-up paths)
//   M1  (after a move) every page that loads lang-manager.min.js loads the new modules before it, in the order
//       routes, catalog, dom, each once, and one stamp per script path across the site
//   M2  (after a move) the new modules hold no storage, timer, fetch or eval
//   M3  (after a move) the pure modules in Node: the same answers as the page gave (locale-routes.js, locale-catalog.js)
//   M4  (after a move) each new module states its interface at its top
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { visitor, ready, pages, ROOT } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOLD = path.join(HERE, 'fixtures', 'sp36-lang.json');
const JS = (n) => path.join(ROOT, 'assets/js', n + '.js');
const MODS = ['locale-routes', 'locale-catalog', 'locale-dom'].filter((n) => fs.existsSync(JS(n)));
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 16);

// every visitor: console.warn kept in order; storage blockable and the browser's language settable from the page
// (window.__block, window.__browser), and a saved language set once per tab (sessionStorage marks it done)
const HOOKS = ({ block, browser, saved }) => {
  window.__warns = [];
  const w = console.warn.bind(console);
  console.warn = (...a) => { window.__warns.push(a.join(' ')); w(...a); };
  window.__block = !!block; window.__browser = browser || 'en-US';
  const real = window.localStorage;
  Object.defineProperty(window, 'localStorage', { configurable: true, get() { if (window.__block) throw new DOMException('The operation is insecure.', 'SecurityError'); return real; } });
  Object.defineProperty(navigator, 'language', { configurable: true, get: () => window.__browser });
  if (saved !== undefined && !sessionStorage.getItem('__sp36')) { sessionStorage.setItem('__sp36', '1'); if (saved === null) real.removeItem('dataarcus-lang'); else real.setItem('dataarcus-lang', saved); }
};

// what the manager produced, read from the page
const STATE = () => {
  const lm = window.langManager, d = document.documentElement, q = (s) => document.querySelector(s);
  let saved; try { saved = window.localStorage.getItem('dataarcus-lang'); } catch (e) { saved = 'blocked'; }
  const own = (e) => [e.tagName, e.getAttribute('data-i18n') || '', e.textContent, e.value || '', e.getAttribute('placeholder') || ''].join('|');
  const tr = [...document.querySelectorAll('[data-i18n]')].map(own);
  const html = [...document.querySelectorAll('[data-i18n-html]')].map((e) => e.innerHTML);
  const attrs = ['placeholder', 'alt', 'aria-label', 'title'].map((a) => [...document.querySelectorAll(`[data-i18n-${a}]`)].map((e) => e.getAttribute(a)));
  const sw = [...document.querySelectorAll('.language-switcher-container, .desktop-lang-switcher')].map((e) => e.outerHTML.replace(/\s+/g, ' '));
  return {
    lang: lm ? lm.currentLang : null, initialized: lm ? lm.initialized : null, rtl: lm ? lm.rtlLanguages : null,
    htmlLang: d.lang, htmlDir: d.dir, bodyRtl: document.body.classList.contains('rtl'), pending: d.classList.contains('i18n-pending'),
    arFont: (q('#ar-font') || {}).href || null, arFontLabel: (q('#ar-font-label') || {}).href || null,
    title: document.title, metas: [...document.head.querySelectorAll('meta[name], meta[property], link[rel="canonical"], link[rel="icon"]')].map((m) => m.outerHTML).join('\n'),
    i18n: tr.length + ':' + tr.join('\n'), html: html.length + ':' + html.join('\n'), attrs: JSON.stringify(attrs), switcher: sw,
    saved, at: location.pathname + location.search + location.hash, history: history.length, hstate: JSON.stringify(history.state),
    warns: window.__warns.slice(), dict: lm ? JSON.stringify(lm.translations).length : null,
  };
};
const SHA = ['i18n', 'html', 'attrs', 'metas'];
async function state(pg) {
  const s = await pg.evaluate(STATE);
  for (const k of SHA) s[k] = sha(s[k]);
  return s;
}

// a click on the switcher; a switch that goes to another address is followed to its ready page
async function toggle(pg) {
  const sel = (await pg.$('.lang-btn')) ? '.lang-btn' : '.lang-btn-desktop';
  const nav = pg.waitForNavigation({ timeout: 2500 }).then(() => true, () => false);
  await pg.click(sel);
  if (await nav) await ready(pg); else await pg.waitForTimeout(100);
}

// the made-up inputs of the pure parts, run in the page through the manager's methods
const MADE_UP_PATHS = ['/', '/index.html', '/ar/', '/ar/index.html', '/ar', '/tools/', '/tools/index.html', '/tools/power-bi-theme-generator.html',
  '/ar/tools/dax-measure-builder.html', '/tools/power-bi-model-health-check.html', '/articles/article-power-bi-model-health-check.html', '/power-bi-mcp/',
  '/power-bi-mcp/index.html', '/dashboards/maven-market-dashboard.html', '/portfolio.html', '/blog.html', '/articles/article-kpi.html', '/privacy.html',
  '/404.html', '/tools/power-bi-theme-generator-lab.html', '/go/svg/index.html', '/assets/x.html', '/services/copilot-readiness-audit.html',
  '/made-up/page.html', '/made-up/folder/', '/made-up/file.pdf', '/arabic/x.html', '/articles/article-evm.html', '/dashboards/er-health-dashboard.html', '/ar/ar/x.html'];
// every translation global the route table can name, read from the sources (the base file, or the module it moved to)
const GLOBALS = [...new Set(['lang-manager', 'locale-routes'].filter((n) => fs.existsSync(JS(n))).flatMap((n) => [...fs.readFileSync(JS(n), 'utf8').matchAll(/\b([a-z][A-Za-z0-9]*Translations)\b/g)].map((m) => m[1])))].filter((n) => n !== 'commonTranslations').sort();

const ROUTES = ({ paths, globals }) => {
  const lm = window.langManager, home = location.pathname + location.search, out = [];
  const keep = {}; globals.forEach((g) => { keep[g] = window[g]; window[g] = { __k: g }; });
  for (const p of paths) {
    history.replaceState(null, '', p);
    const t = lm.getPageTranslations();
    out.push([p, location.pathname, lm.pagePath(), lm.hasArCopy(p), t === null ? null : t === undefined ? 'undefined' : t.__k].join(' '));
  }
  globals.forEach((g) => { if (keep[g] === undefined) delete window[g]; else window[g] = keep[g]; });
  // one link's Arabic-copy address, from an Arabic copy's folder
  history.replaceState(null, '', '/ar/articles/made-up.html');
  const div = document.implementation.createHTMLDocument('').createElement('div');   // inert: nothing it names is fetched
  div.innerHTML = ['../tools/', 'blog.html', '/portfolio.html', 'https://dataarcus.com/tools/svg-kpi-designer.html', 'https://dataarcus.com/404.html', 'https://dataarcus.com',
    'https://dataarcus.com/', '#top', 'mailto:a@example.com', '//cdn.example/y.js', '', 'tel:1', 'https://other.example/', '/tools/power-bi-theme-generator-lab.html',
    'x.html?q=1#h', 'HTTPS://example.org/a', '../go/svg/', 'folder/', '/assets/doc.html', 'javascript:void(0)'].map((h, i) => `<a href="${h}">${i}</a>`).join('')
    + '<img src="../assets/img/a.png"><img src="https://dataarcus.com/assets/b.png"><link href="/blog.html"><iframe src="../tools/"></iframe><a>none</a><a href="/blog.html" src="x/y.png">both</a>';
  lm.arLinks(div);
  out.push(div.innerHTML);
  // the other language's address (the hreflang link), from a page with none of its own
  const pair = [];
  for (const [at, lang, href] of [['/blog.html', 'ar', 'https://dataarcus.com/ar/blog.html'], ['/blog.html', 'en', 'https://dataarcus.com/blog.html'], ['/ar/tools/', 'en', '/tools/index.html'],
    ['/ar/tools/index.html', 'ar', 'https://dataarcus.com/ar/tools/'], ['/tools/', 'ar', '../ar/tools/?x=1#y'], ['/blog.html', 'ar', null]]) {
    history.replaceState(null, '', at);
    const l = href === null ? null : Object.assign(document.createElement('link'), { rel: 'alternate', hreflang: lang });
    if (l) { l.setAttribute('href', href); document.head.appendChild(l); }
    pair.push([at, lang, href, lm.pairUrl(lang), lm.pairUrl(lang === 'ar' ? 'en' : 'ar')].join(' '));
    if (l) l.remove();
  }
  out.push(pair.join('\n'));
  history.replaceState(null, '', home);
  return out;
};

// the language a visitor gets: every combination of an Arabic copy's path, ?lang=, the saved language and the browser's
const DETECT = () => {
  const lm = window.langManager, home = location.pathname + location.search, out = [], real = window.localStorage;
  for (const at of ['/blog.html', '/ar/blog.html']) for (const q of ['', '?lang=en', '?lang=ar', '?lang=fr', '?lang=AR']) for (const saved of [null, 'en', 'ar', 'xx', 'blocked']) for (const br of ['en-US', 'ar-AE', 'ar', 'fr-FR']) {
    history.replaceState(null, '', at + q);
    window.__block = false;
    if (saved === null || saved === 'blocked') real.removeItem('dataarcus-lang'); else real.setItem('dataarcus-lang', saved);
    window.__block = saved === 'blocked'; window.__browser = br;
    const got = lm.detectLanguage();
    window.__block = false;
    out.push(`${at}${q} ${saved} ${br} -> ${got} saved ${real.getItem('dataarcus-lang')}`);
  }
  window.__block = false; window.__browser = 'en-US'; real.removeItem('dataarcus-lang');
  history.replaceState(null, '', home);
  return out;
};

// made-up dictionaries and documents for the DOM translation, the meta tags and the Arabic copy's links
const DICT = {
  en: { meta: { title: 'Made-up title', description: 'Made-up description', keywords: 'k1, k2', author: 'Made-up author', 'og:image': 'https://dataarcus.com/x.png', 'twitter:card': 'summary', canonical: 'https://dataarcus.com/made-up.html', icon: '/made-up.ico', empty: '', 'og:locale': 'xx_XX', custom: 'ignored' },
    other: { meta: { title: 'Other title', description: 'Other description', 'og:title': 'Other OG' } },
    s: { a: 'Alpha', b: '<a href="../tools/">Tools</a> <a href="https://dataarcus.com/blog.html">Blog</a> <a href="#x">x</a> <a href="/404.html">404</a> <img src="img/a.png">', n: { deep: 'Deep' }, zero: 0, empty: '' }, btn: 'Send', ph: 'Type here', al: 'An image', ti: 'A tip' },
  ar: { meta: { title: 'عنوان', description: 'وصف', 'og:title': 'عنوان المشاركة' }, other: { meta: { title: 'عنوان آخر' } },
    s: { a: 'ألف', b: '<a href="../tools/">الأدوات</a> <a href="https://dataarcus.com/tools/power-bi-theme-generator-lab.html">lab</a> <a href="blog.html#top">المدونة</a>', n: { deep: 'عميق' }, zero: 0, empty: '' }, btn: 'إرسال', ph: 'اكتب', al: 'صورة', ti: 'تلميح' },
};
const BODY = '<p data-i18n="s.a">x</p><input type="submit" data-i18n="btn" value="v"><input data-i18n="ph" placeholder="p"><textarea data-i18n="ph" placeholder="p"></textarea>'
  + '<span data-i18n="nope">keep</span><span data-i18n="s.n">obj</span><span data-i18n="s.zero">zero</span><span data-i18n="s.empty">empty</span><b data-i18n="s.a.b">deeper</b>'
  + '<div data-i18n-html="s.b">old</div><div data-i18n-html="s.n">obj</div><img data-i18n-alt="al" alt="o"><button data-i18n-aria-label="ti" data-i18n-title="ti">b</button>'
  + '<input data-i18n-placeholder="ph"><abbr data-i18n-title="nope" title="t">a</abbr>';
const DOCS = [
  `<!DOCTYPE html><html><head><title>T</title><meta name="description" content="d"><meta property="og:title" content="o"><meta name="twitter:title" content="t"><meta property="og:locale" content="en_US"><link rel="canonical" href="https://dataarcus.com/c.html"></head><body>${BODY}</body></html>`,
  `<!DOCTYPE html><html data-i18n-meta="other.meta"><head><title>T</title><meta property="og:title" content="o"><meta property="og:description" content="o"><meta name="twitter:description" content="t"><link rel="canonical" href="https://dataarcus.com/c.html"><link rel="alternate" hreflang="en" href="https://dataarcus.com/c.html"></head><body>${BODY}</body></html>`,
  `<!DOCTYPE html><html><head></head><body>${BODY}</body></html>`,
  `<!DOCTYPE html><html data-i18n-meta="s.a"><head><title>T</title></head><body><p data-i18n="s.a">x</p></body></html>`,
];
const DOM = ({ dict, docs, metaDoc }) => {
  const lm = window.langManager, home = location.pathname + location.search, keep = [lm.translations, lm.currentLang], out = [];
  history.replaceState(null, '', '/ar/articles/made-up.html');
  lm.translations = dict;
  for (const [lang, arCopy] of [['en', false], ['ar', true], ['ar', false], ['en', true], ['ar', undefined]]) for (const src of docs) {
    lm.currentLang = lang;
    const doc = new DOMParser().parseFromString(src, 'text/html');
    const w0 = window.__warns.length;
    if (arCopy === undefined) lm.applyLanguage(doc); else lm.applyLanguage(doc, arCopy);
    out.push(`${lang} ${arCopy}\n${doc.documentElement.outerHTML}\n${window.__warns.slice(w0).join('\n')}`);
  }
  // the meta tags alone, and the key lookup
  lm.currentLang = 'en';
  const doc = new DOMParser().parseFromString(metaDoc, 'text/html'); lm.updateMetaTags(doc); out.push(doc.documentElement.outerHTML);
  out.push(['s.a', 's.n.deep', 's.n', 's.zero', 's.empty', 'nope', 's.a.b', 'meta', 'meta.title', 's', 'other.meta.title', 'x.y.z', ''].map((k) => JSON.stringify([k, lm.getText(k)])).join('\n'));
  lm.currentLang = 'fr'; out.push(JSON.stringify(lm.getText('s.a')));
  [lm.translations, lm.currentLang] = keep;
  history.replaceState(null, '', home);
  return out;
};
const DOCS_META = '<html><head><meta name="keywords" content="old"></head><body></body></html>';

// the dictionaries: loading the common and the page's, the deep merge, setLanguage's checks
const CATALOG = () => {
  const lm = window.langManager, home = location.pathname + location.search, keep = [lm.translations, window.commonTranslations, window.privacyTranslations], out = [];
  const common = { en: { nav: { a: 'A', b: 'B' }, arr: [1, 2], s: 'S' }, ar: { nav: { a: 'أ' } } };
  window.commonTranslations = common;
  window.privacyTranslations = { en: { nav: { b: 'B2', c: 'C' }, arr: [3], s: { t: 'T' } }, fr: { x: 1 }, ar: { nav: null, z: { y: 'ي' } } };
  history.replaceState(null, '', '/privacy.html');
  lm.translations = {}; lm.loadTranslations(); out.push(JSON.stringify(lm.translations), JSON.stringify(common));
  delete window.commonTranslations;
  lm.translations = { x: { y: 1 }, en: { keep: 'K' } }; lm.loadTranslations(); out.push(JSON.stringify(lm.translations));
  history.replaceState(null, '', '/made-up/page.html');
  lm.translations = { en: { a: 1 } }; lm.loadTranslations(); out.push(JSON.stringify(lm.translations));
  window.commonTranslations = common; lm.translations = {}; lm.loadTranslations(); out.push(JSON.stringify(lm.translations), String(lm.translations === common));
  lm.translations = { en: { a: { b: 1 } } }; lm.mergeTranslations({ en: { a: { c: 2 } }, ar: { d: [1] } }); out.push(JSON.stringify(lm.translations));
  out.push(JSON.stringify(lm.deepMerge({ a: { b: 1 }, c: [1], h: 'x' }, { a: { d: 2 }, c: [2], e: null, f: { g: undefined, h: { i: 0 } }, h: { j: 1 } })));
  out.push(JSON.stringify(lm.deepMerge({}, {})), JSON.stringify(lm.deepMerge({ a: 1 }, { a: { b: { c: 'd' } } })));
  [lm.translations, window.commonTranslations, window.privacyTranslations] = keep;
  if (keep[1] === undefined) delete window.commonTranslations;
  if (keep[2] === undefined) delete window.privacyTranslations;
  history.replaceState(null, '', home);
  return out;
};
const SET = () => {
  const lm = window.langManager, out = [];
  for (const l of ['fr', 'AR', '', 'ar', 'ar', 'en']) {
    const r = lm.setLanguage(l);
    let saved; try { saved = localStorage.getItem('dataarcus-lang'); } catch (e) { saved = 'blocked'; }
    out.push([JSON.stringify(l), r, lm.currentLang, document.documentElement.dir, document.documentElement.lang, document.body.classList.contains('rtl'), !!document.getElementById('ar-font'), saved, location.search, history.length, document.title].join(' '));
  }
  out.push([lm.otherLang(), lm.switcherLabel(true), lm.switcherLabel(false), lm.switcherAria(), lm.isMobileView()].join(' '));
  return out;
};

const ev = (fn, arg) => async (pg) => { const r = await pg.evaluate(fn, arg); return { out: r }; };
const resize = (w) => async (pg) => { await pg.setViewportSize({ width: w, height: 900 }); await pg.waitForTimeout(500); };

// [name, { start, viewport, block, browser, saved }, steps]
export const SESSIONS = [
  ['an English visitor on the home page', { start: '/' }, []],
  ['?lang=ar on the home page, saved, then the home page again', { start: '/?lang=ar', saved: null }, [['open / again', (pg) => pg.goto(pg.url().replace(/\?.*$/, ''), { waitUntil: 'networkidle' }).then(() => ready(pg))]]],
  ['an Arabic copy with English saved', { start: '/ar/', saved: 'en' }, [['switch (to the English page)', toggle], ['switch (back to the copy)', toggle]]],
  ['Arabic saved on /tools/, switched in place', { start: '/tools/', saved: 'ar' }, [['switch', toggle], ['switch', toggle]]],
  ['an Arabic browser, nothing saved, the blog', { start: '/blog.html', browser: 'ar-AE', saved: null }, [['switch', toggle]]],
  ['storage blocked, an Arabic browser, an Arabic copy', { start: '/ar/blog.html', browser: 'ar-AE', block: true }, [['switch (to ?lang=en)', toggle], ['switch (in place)', toggle]]],
  ['the home page in English, switched to its copy', { start: '/?lang=en' }, [['switch', toggle]]],
  ['the 404 page (no copy), switched in place twice', { start: '/404.html?lang=en' }, [['switch', toggle], ['switch', toggle]]],
  ['a lab page (no copy) in Arabic', { start: '/tools/power-bi-theme-generator-lab.html?lang=ar' }, [['switch', toggle]]],
  ['an Arabic copy whose translated HTML has links', { start: '/ar/tools/svg-kpi-designer.html' }, [['open the Arabic article copy', (pg) => pg.goto(pg.url().replace(/\/ar\/.*$/, '/ar/articles/article-power-bi-report-ready-for-arabic.html'), { waitUntil: 'networkidle' }).then(() => ready(pg))]]],
  ['a phone, across the breakpoint and back, then a switch', { start: '/?lang=en', viewport: [390, 844] }, [['wider than 992', resize(1200)], ['a phone again', resize(390)], ['switch', toggle]]],
  ['made-up documents and dictionaries (DOM, meta, lookup)', { start: '/404.html?lang=en' }, [['translate made-up documents', ev(DOM, { dict: DICT, docs: DOCS, metaDoc: DOCS_META })]]],
  ['the route table and the language precedence on made-up paths', { start: '/404.html?lang=en' }, [['the routes', ev(ROUTES, { paths: MADE_UP_PATHS, globals: GLOBALS })], ['the precedence', ev(DETECT)]]],
  ['made-up dictionaries loaded and merged; setLanguage', { start: '/404.html?lang=en' }, [['load and merge', ev(CATALOG)], ['setLanguage', ev(SET)]]],
];

// M3: the pure modules in Node give what the page gave (the route table, the arLinks addresses, the merge)
function pureInNode(gold) {
  const bad = [], req = createRequire(import.meta.url);
  if (MODS.includes('locale-routes')) {
    const R = req(JS('locale-routes'));
    // the page's rows: path, location.pathname, pagePath(), hasArCopy(), the global the route names (each stubbed as itself)
    const want = gold.S13.steps[1].out;
    const rows = MADE_UP_PATHS.map((p) => { const pp = R.pagePath(p); return [p, p, pp, R.hasArCopy(p), R.pageKey(pp)].join(' '); });
    const miss = rows.findIndex((r, i) => r !== want[i]);
    if (miss >= 0) bad.push(`locale-routes pagePath/hasArCopy/pageKey: ${rows[miss]} (the page: ${want[miss]})`);
    if (R.LOCALES.ar.dir !== 'rtl' || R.LOCALES.en.dir !== 'ltr' || R.LOCALES.ar.hasCopy('/404.html') || !R.LOCALES.ar.hasCopy('/blog.html') || !R.LOCALES.en.hasCopy('/404.html')) bad.push('locale-routes descriptors: direction or route availability wrong');
    if (R.pairUrl('https://dataarcus.com/ar/blog.html', 'http://127.0.0.1:1/blog.html') !== 'http://127.0.0.1:1/ar/blog.html' || R.pairUrl('/tools/index.html', 'http://h/tools/') !== null) bad.push('locale-routes pairUrl');
  }
  if (MODS.includes('locale-catalog')) {
    const C = req(JS('locale-catalog')), want = gold.S14.steps[1].out;
    const got = JSON.stringify(C.deepMerge({ a: { b: 1 }, c: [1], h: 'x' }, { a: { d: 2 }, c: [2], e: null, f: { g: undefined, h: { i: 0 } }, h: { j: 1 } }));
    if (got !== want[7]) bad.push(`locale-catalog deepMerge ${got} (the page: ${want[7]})`);
    const warns = [], t = C.load({ en: { s: { a: 'A' } } }, { en: { s: { b: 'B' } } });
    if (C.text(t, 'en', 's.b', (m) => warns.push(m)) !== 'B' || C.text(t, 'en', 's.a.x', (m) => warns.push(m)) !== '[Missing: s.a.x]' || warns.length !== 1) bad.push('locale-catalog load/text');
  }
  return bad;
}

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const record = process.env.SP36_RECORD === '1';
  const gold = record ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8')), got = {};
  for (const [k, [name, o, steps]] of SESSIONS.entries()) {
    const id = 'S' + (k + 1), bad = [], rec = [];
    const v = await visitor(browser, { viewport: o.viewport || [1440, 900], motion: 'reduce' });
    await v.ctx.addInitScript(HOOKS, { block: o.block, browser: o.browser, saved: o.saved });
    const pg = v.pg;
    try {
      await pg.goto(url + o.start, { waitUntil: 'networkidle' });
      await ready(pg);
      rec.push({ step: 'open ' + o.start, ...(await state(pg)) });
      for (const [label, act] of steps) {
        const r = await act(pg);
        const s = { step: label, ...(await state(pg)) };
        if (r && r.out) s.out = r.out;
        rec.push(s);
      }
    } catch (e) { bad.push(e.message.split('\n')[0]); }
    // the address is the test server's: kept as a path only
    for (const r of rec) { for (const f of ['arFont', 'arFontLabel']) if (r[f]) r[f] = r[f].replace(url, ''); if (r.out) r.out = r.out.map((x) => x.split(url).join('<server>')); }
    if (v.errs.length) bad.push('page errors: ' + v.errs.slice(0, 3).join(' | '));
    await v.ctx.close();
    got[id] = { session: name, steps: rec };
    if (record) { if (bad.length) throw new Error(`${id} cannot be recorded: ${bad.join('; ')}`); continue; }
    const g = gold[id];
    if (!g) bad.push('no record'); else {
      const diff = [];
      for (let i = 0; i < Math.max(g.steps.length, rec.length); i++) {
        const a = g.steps[i] || {}, b = rec[i] || {};
        const keys = [...new Set(Object.keys(a).concat(Object.keys(b)))].filter((x) => JSON.stringify(a[x]) !== JSON.stringify(b[x]));
        if (keys.length) diff.push(`step ${i} "${a.step || b.step}": ${keys.map((x) => `${x} ${JSON.stringify(a[x]).slice(0, 300)} -> ${JSON.stringify(b[x]).slice(0, 300)}`).join(', ')}`);
      }
      if (diff.length) bad.push(`${diff.length} steps differ from the base: ${diff.slice(0, 3).join('; ')}`);
    }
    check(!bad.length, `${id} "${name}": ${bad.join('; ')}`);
  }
  if (record) { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); return { checks: checks + SESSIONS.length, problems }; }
  if (MODS.length) {
    // M1: deferred scripts run in document order: the new modules, then the manager, each once, on every page; one stamp each
    const order = MODS.concat('lang-manager'), stamps = {}, wrong = [];
    for (const p of pages()) {
      const t = fs.readFileSync(path.join(ROOT, p), 'utf8');
      if (!t.includes('lang-manager.min.js')) continue;
      const at = order.map((s) => t.indexOf('/' + s + '.min.js?v='));
      if (!order.every((s) => t.split('/' + s + '.min.js?v=').length === 2) || !at.every((x, i) => x > 0 && (i === 0 || x > at[i - 1]))) wrong.push(p);
      for (const s of order) { const m = new RegExp(`/${s}\\.min\\.js\\?v=([0-9a-z]+)`).exec(t); (stamps[s] = stamps[s] || new Set()).add(m && m[1]); }
    }
    const many = order.filter((s) => stamps[s] && stamps[s].size !== 1);
    check(!wrong.length && !many.length, `M1 every page loading lang-manager.min.js must load ${order.join(', ')} once each, in that order, one stamp each: wrong order ${wrong.slice(0, 5).join(', ') || '-'}; several stamps ${many.join(', ') || '-'}`);
    // M2 and M4: no storage, timers, fetch or eval in a new module; its interface at its top (comments left out for M2)
    const banned = [], noTop = [];
    const API = { 'locale-routes': ['LOCALES', 'pagePath(', 'hasArCopy(', 'pageKey(', 'arAddress(', 'pairUrl('], 'locale-catalog': ['load(', 'merge(', 'deepMerge(', 'text('], 'locale-dom': ['translate(', 'arLinks(', 'direction(', 'meta('] };
    for (const n of MODS) {
      const src = fs.readFileSync(JS(n), 'utf8'), code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      if (/localStorage|sessionStorage|setTimeout|setInterval|fetch\(|eval\(|new Function/.test(code)) banned.push(n);
      const top = (/^\/\*[\s\S]*?\*\//.exec(src) || [''])[0];
      if (!API[n].every((w) => top.includes(w))) noTop.push(n);
    }
    check(!banned.length, `M2 the new modules must hold no storage, timer, fetch or eval (found: ${banned.join(', ')})`);
    const bad = pureInNode(gold); check(!bad.length, `M3 the pure modules in Node: ${bad.join('; ')}`);
    check(!noTop.length, `M4 each new module must state its interface at its top: ${noTop.join(', ')}`);
  }
  return { checks, problems };
}
