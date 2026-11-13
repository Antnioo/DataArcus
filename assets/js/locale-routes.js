/*
 * DataArcus - the locales and the page routes (0.3.2 SP36, moved from lang-manager.js): which languages the site
 * speaks, which way each one reads, which pages have an Arabic copy, and which translation file each page uses.
 * Pure: no page, no storage, no network, no state; strings in, strings out. Browser (window.LocaleRoutes) and Node.
 *
 * Interface (one input, one output each):
 *   LOCALES            { en, ar }: a locale descriptor each, { lang, dir, prefix, hasCopy(path) }: its language, its
 *                      direction ('ltr' | 'rtl', from RTL), its copies' path prefix ('' | '/ar') and its route
 *                      availability (whether a page path has a copy in that language: every page in English)
 *   LANGS              ['en', 'ar']: the languages a visitor can choose (?lang=, the saved choice, the switcher)
 *   RTL                ['ar', 'he', 'fa']: the languages written right to left (the manager's rtlLanguages)
 *   isArPath(pathname) -> boolean: the address is an Arabic copy (/ar/...); its address is its language
 *   pagePath(pathname) -> the page's own path: an Arabic copy is the page at the same path without /ar
 *   hasArCopy(path)    -> boolean: the page has an Arabic copy (scripts/ar-pages.mjs, PAIRS = the sitemap): every
 *                      public page; not files, the go/ short links, the 404 page, a lab page or a page in AR_HELD
 *   AR_HELD            the public pages whose Arabic copy is held until the owner approves its words (0.3.3 IX4,
 *                      D-1111-17): English only, in the sitemap without an /ar/ address; ar-pages.mjs and
 *                      test-site-config.mjs read this list, the one place it is kept
 *   pageKey(path)      -> the name of the window global that holds the page's own translations, or null (the route
 *                      table: the first entry whose text the path contains, in order)
 *   arAddress(value, pageLink, base) -> the address a link or file in translated HTML has on an Arabic copy, or null
 *                      to leave it: a relative address is read from base (the English page); a page link (an <a href>)
 *                      to a page with an Arabic copy goes to the copy
 *   pairUrl(href, here) -> the address of this page in another language (href: its <link rel="alternate" hreflang>,
 *                      here: this page's address), or null when it names this page itself
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  const SITE = 'https://dataarcus.com';
  const RTL = ['ar', 'he', 'fa'];
  const LANGS = ['en', 'ar'];

  const isArPath = (pathname) => /^\/ar\//.test(pathname);
  const pagePath = (pathname) => pathname.replace(/^\/ar(?=\/)/, '');
  // the Gulf like-for-like page: its Arabic is drafted in mcp/work/IX4.md, "For the owner"
  const AR_HELD = Object.freeze(['/tools/gulf-like-for-like.html']);
  const hasArCopy = (p) => /(\.html|\/)$/.test(p) && !/^\/(ar|go|assets)\//.test(p) && !/^\/404\.html$|-lab\.html$/.test(p) && AR_HELD.indexOf(p) < 0;

  const descriptor = (lang, prefix, hasCopy) => Object.freeze({ lang, dir: RTL.includes(lang) ? 'rtl' : 'ltr', prefix, hasCopy });
  const LOCALES = Object.freeze({ en: descriptor('en', '', () => true), ar: descriptor('ar', '/ar', hasArCopy) });

  // The route table, in order: the free tools first (/tools/index.html also contains "index"), then the beta page (a
  // folder, /power-bi-mcp/, also as /power-bi-mcp/index.html: before the home page's "index"), then the rest.
  // HOME: the home page ("index", "/" or "").
  const HOME = {};
  const ROUTES = [
    ['power-bi-theme-generator', 'themeGeneratorTranslations'],
    ['dax-calendar-table-generator', 'calendarGeneratorTranslations'],
    ['dax-measure-builder', 'measureBuilderTranslations'],
    ['/tools/power-bi-model-health-check', 'modelHealthTranslations'],
    ['dp-600-practice-exam', 'dp600Translations'],
    ['pl-300-practice-exam', 'pl300Translations'],
    ['svg-kpi-designer', 'svgKpiTranslations'],
    ['power-bi-licensing-cost-calculator', 'licensingCalculatorTranslations'],
    ['/tools/', 'toolsHubTranslations'],
    ['/power-bi-mcp/', 'betaPageTranslations'],
    ['adventureworks-dashboard', 'adventureworksTranslations'],
    ['call-center-dashboard', 'callcenterTranslations'],
    ['maven-market-dashboard', 'mavenmarketTranslations'],
    ['portfolio', 'portfolioTranslations'],
    [HOME, 'homepageTranslations'],
    ['article-clv', 'clvTranslations'],
    ['er-health-dashboard', 'erHealthTranslations'],
    ['blog', 'blogTranslations'],
    ['article-etl-vs-power-query', 'etlpqTranslations'],
    ['article-kpi', 'kpiTranslations'],
    ['article-shopify', 'shopifyTranslations'],
    ['consumer-financial-complaints', 'cfpbComplaintsTranslations'],
    ['repeatiq-dashboard', 'repeatiqCommerceTranslations'],
    ['fintech-dashboard', 'fintechRiskTranslations'],
    ['article-evm', 'evmTranslations'],
    ['dataarcus-pulse', 'dataarcusPulseTranslations'],
    ['article-journey-attribution', 'journeyAttributionTranslations'],
    ['article-gulf-calendar-power-bi', 'gulfCalendarArticleTranslations'],
    ['article-ramadan-sales-power-bi', 'ramadanSalesTranslations'],
    ['article-power-bi-model-health-check', 'modelHealthArticleTranslations'],
    ['article-power-bi-report-ready-for-arabic', 'reportReadyArabicTranslations'],
    ['article-power-bi-copilot-ready-check', 'copilotReadyCheckTranslations'],
    ['article-power-bi-custom-visual-ai-checks', 'customVisualChecksTranslations'],
    ['article-power-bi-best-practice-exceptions', 'bestPracticeExceptionsTranslations'],
    ['article-power-bi-report-redesign', 'reportRedesignArticleTranslations'],
    ['article-power-bi-model-ai-ready', 'aiReadyArticleTranslations'],
    ['article-power-bi-report-styles', 'reportStylesArticleTranslations'],
    ['article-power-bi-licensing-guide', 'licensingGuideTranslations'],
    ['copilot-readiness-audit', 'copilotAuditTranslations'],
    ['privacy', 'privacyTranslations'],
  ];
  function pageKey(path) {
    for (const [text, name] of ROUTES) {
      if (text === HOME ? path.includes('index') || path === '/' || path === '' : path.includes(text)) return name;
    }
    return null;
  }

  function arAddress(v, pageLink, base) {
    const abs = !!v && v.startsWith(SITE + '/');
    if (!abs && /^(#|[a-z][a-z0-9+.-]*:|\/\/)/i.test(v)) return null;
    const u = new URL(abs ? v.slice(SITE.length) : v, base);
    const p = pageLink && hasArCopy(u.pathname) ? '/ar' + u.pathname : u.pathname;
    return (abs ? SITE : '') + p + u.search + u.hash;
  }

  function pairUrl(href, here) {
    const at = new URL(here), to = new URL(href, here), bare = (p) => p.replace(/\/index\.html$/, '/');
    return bare(to.pathname) === bare(at.pathname) ? null : at.origin + to.pathname;
  }

  const api = Object.freeze({ LOCALES, LANGS, RTL, AR_HELD, isArPath, pagePath, hasArCopy, pageKey, arAddress, pairUrl });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LocaleRoutes = api;
})(typeof self !== 'undefined' ? self : this);
