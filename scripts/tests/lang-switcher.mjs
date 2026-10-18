// The language switcher on every page: the label in the other language, drawn in the right font and level with the globe.
// The switcher is built by lang-manager.js, so one fix there (or in style.css) covers every page; this checks all of them.
// Google Fonts are stubbed in tests, so the checks are on what makes the label line up, not on pixels:
//  - English pages load the Arabic letters of the label (without them phones use their own Arabic font, which sits low)
//  - the Arabic label uses the site's Arabic font, keeps its letters joined, and gets its optical lift
//  - the English label on Arabic pages stays in Inter with no lift
import { visitor, pages, langsOf, WAIT } from './lib.mjs';

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  for (const vp of [[390, 844], [1440, 900]]) {
    const v = await visitor(browser, { viewport: vp, motion: 'reduce' });
    const mobile = vp[0] < 992, sel = mobile ? '.lang-btn .lang-text' : '.lang-btn-desktop span';
    for (const p of pages()) for (const lang of langsOf(p)) {
      const where = `${p} ${lang} ${vp[0]}px`;
      await v.pg.goto(`${url}/${p}?lang=${lang}`, { waitUntil: 'domcontentloaded' });
      const s = await v.pg.waitForSelector(sel, { timeout: /404|offline/.test(p) ? 3000 : WAIT }).catch(() => null);
      if (!s) { if (!/404|offline/.test(p)) check(false, `${where}: no language switcher`); continue; }
      const r = await s.evaluate((e) => { const c = getComputedStyle(e), f = document.getElementById('ar-font-label');
        return { lang: e.getAttribute('lang'), text: e.textContent.trim(), font: c.fontFamily, top: c.top, spacing: c.letterSpacing, labelFont: f ? decodeURIComponent(f.href) : null }; });
      if (lang === 'en') {
        check(r.lang === 'ar', `${where}: label is not marked lang="ar" (${r.lang})`);
        check(!!r.labelFont && [...r.text.replace(/\s/g, '')].every((ch) => r.labelFont.includes(ch)), `${where}: the Arabic letters of "${r.text}" are not loaded (${r.labelFont})`);
        check(/IBM Plex Sans Arabic/.test(r.font), `${where}: Arabic label not in the Arabic font (${r.font})`);
        check(r.spacing === 'normal', `${where}: letter spacing ${r.spacing} breaks the Arabic letters`);
        check(parseFloat(r.top) < 0, `${where}: Arabic label has no optical lift (top ${r.top})`);
      } else {
        check(r.lang === 'en', `${where}: label is not marked lang="en" (${r.lang})`);
        check(/^Inter/.test(r.font), `${where}: English label not in Inter (${r.font})`);
        check(r.top === 'auto' || parseFloat(r.top) === 0, `${where}: English label is shifted (top ${r.top})`);
      }
    }
    if (v.errs.length) problems.push(`${vp[0]}px: ` + v.errs.slice(0, 3).join(' | '));
    await v.ctx.close();
  }
  // Storage blocked (strict privacy settings): an Arabic browser still gets Arabic and a working switcher on every page
  {
    const v = await visitor(browser, { viewport: [1440, 900], motion: 'reduce', consent: null });
    await v.ctx.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('The operation is insecure.', 'SecurityError'); } });
      Object.defineProperty(navigator, 'language', { get: () => 'ar-AE' });
    });
    for (const p of pages()) {
      await v.pg.goto(`${url}/${p}`, { waitUntil: 'domcontentloaded' });
      const s = await v.pg.waitForSelector('.lang-btn-desktop', { timeout: /404|offline/.test(p) ? 3000 : WAIT }).catch(() => null);
      const lang = await v.pg.evaluate(() => document.documentElement.lang);
      if (!s) { if (!/404|offline/.test(p)) check(false, `${p} storage blocked: no language switcher (page in ${lang})`); continue; }
      check(lang === 'ar', `${p} storage blocked: Arabic browser gets ${lang}`);
      // an Arabic copy's switch goes to its English page (with ?lang=en, as nothing can be saved)
      if (p.startsWith('ar/')) await Promise.all([v.pg.waitForURL((u) => !u.pathname.startsWith('/ar/'), { timeout: WAIT }).then(() => v.pg.waitForFunction(() => window.langManager && window.langManager.initialized, null, { timeout: WAIT })).catch(() => null), s.click()]);
      else { await s.click(); await v.pg.waitForTimeout(100); }
      check(await v.pg.evaluate(() => document.documentElement.lang) === 'en', `${p} storage blocked: the switcher does not switch to English`);
    }
    if (v.errs.length) problems.push('storage blocked: ' + v.errs.slice(0, 3).join(' | '));
    await v.ctx.close();
  }
  // The Arabic copies (scripts/ar-pages.mjs, mcp/plans/ARABIC-INDEXING.md): on a page with a copy the switch goes to the
  // other address and saves the choice, on a phone and a laptop; the copy stays Arabic for a visitor who saved English
  {
    const { PAIRS, arFile } = await import('../ar-pages.mjs');
    const at = (f) => '/' + f.replace(/index\.html$/, '');
    for (const vp of [[1440, 900], [390, 844]]) {
      const v = await visitor(browser, { viewport: vp, motion: 'reduce' }), sel = vp[0] < 992 ? '.lang-btn' : '.lang-btn-desktop';
      const state = () => v.pg.evaluate(() => [location.pathname, document.documentElement.lang, document.documentElement.dir || 'ltr', localStorage.getItem('dataarcus-lang')].join(' '));
      const go = async (to) => { const s = await v.pg.waitForSelector(sel, { timeout: WAIT }).catch(() => null); if (!s) return false;
        await Promise.all([v.pg.waitForURL((u) => u.pathname === to, { timeout: WAIT }).catch(() => null), s.click()]);
        await v.pg.waitForFunction(() => window.langManager && window.langManager.initialized, null, { timeout: WAIT }).catch(() => null); return true; };
      for (const en of PAIRS) {
        const E = at(en), A = at(arFile(en)), where = `${en} ${vp[0]}px`;
        await v.pg.goto(`${url}${E}?lang=en`, { waitUntil: 'domcontentloaded' });
        check(await go(A), `${where}: no language switcher`);
        check(await state() === `${A} ar rtl ar`, `${where}: the switch to Arabic gives "${await state()}", want "${A} ar rtl ar"`);
        check(await go(E), `${where}: no language switcher on ${A}`);
        check(await state() === `${E} en ltr en`, `${where}: the switch back gives "${await state()}", want "${E} en ltr en"`);
        await v.pg.goto(`${url}${A}`, { waitUntil: 'domcontentloaded' });
        await v.pg.waitForFunction(() => window.langManager && window.langManager.initialized, null, { timeout: WAIT }).catch(() => null);
        check(await state() === `${A} ar rtl ar`, `${where}: ${A} with English saved gives "${await state()}", want "${A} ar rtl ar"`);
      }
      if (v.errs.length) problems.push(`Arabic copies ${vp[0]}px: ` + v.errs.slice(0, 3).join(' | '));
      await v.ctx.close();
    }
  }
  return { checks, problems };
}
