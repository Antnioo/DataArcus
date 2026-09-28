// The language switcher on every page: the label in the other language, drawn in the right font and level with the globe.
// The switcher is built by lang-manager.js, so one fix there (or in style.css) covers every page; this checks all of them.
// Google Fonts are stubbed in tests, so the checks are on what makes the label line up, not on pixels:
//  - English pages load the Arabic letters of the label (without them phones use their own Arabic font, which sits low)
//  - the Arabic label uses the site's Arabic font, keeps its letters joined, and gets its optical lift
//  - the English label on Arabic pages stays in Inter with no lift
import { visitor, pages } from './lib.mjs';

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  for (const vp of [[390, 844], [1440, 900]]) {
    const v = await visitor(browser, { viewport: vp, motion: 'reduce' });
    const mobile = vp[0] < 992, sel = mobile ? '.lang-btn .lang-text' : '.lang-btn-desktop span';
    for (const p of pages()) for (const lang of ['en', 'ar']) {
      const where = `${p} ${lang} ${vp[0]}px`;
      await v.pg.goto(`${url}/${p}?lang=${lang}`, { waitUntil: 'domcontentloaded' });
      const s = await v.pg.waitForSelector(sel, { timeout: 5000 }).catch(() => null);
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
  return { checks, problems };
}
