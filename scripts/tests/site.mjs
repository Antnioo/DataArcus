// Every page, in English and Arabic, on a phone and a laptop:
// no errors, no missing translations, no sideways scrolling, the phone menu opens,
// and the top offset (style.css --top-offset) matches the real navbar.
import { pages, visitor } from './lib.mjs';

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  for (const p of pages()) for (const lang of ['en', 'ar']) for (const vp of [[390, 844], [1440, 900]]) {
    const v = await visitor(browser, { viewport: vp });
    await v.pg.goto(`${url}/${p}?lang=${lang}`, { waitUntil: 'networkidle' });
    const tag = `${p} ${lang} ${vp[0]}px`;
    const r = await v.pg.evaluate(() => {
      const nav = document.getElementById('navbar'), pins = [...document.querySelectorAll('[data-pin]')].reduce((a, e) => a + e.offsetHeight, 0);
      return {
        missing: document.body.innerText.includes('[Missing:'),
        sideways: document.documentElement.scrollWidth > innerWidth,
        offset: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),
        expected: nav ? nav.offsetHeight + pins + 12 : null
      };
    });
    if (r.missing) problems.push(`${tag}: missing translation`);
    if (r.sideways) problems.push(`${tag}: page scrolls sideways`);
    if (r.expected !== null && Math.abs(r.offset - r.expected) > 1) problems.push(`${tag}: top offset ${r.offset}, navbar needs ${r.expected}`);
    if (vp[0] < 992 && await v.pg.locator('.navbar-toggler').count()) {
      await v.pg.click('.navbar-toggler'); await v.pg.waitForTimeout(450);
      if (!await v.pg.evaluate(() => document.querySelector('#navmenu')?.classList.contains('show'))) problems.push(`${tag}: phone menu does not open`);
      // an open menu must not push pinned bars down, even if the screen resizes (phone rotation)
      await v.pg.evaluate(() => dispatchEvent(new Event('resize')));
      const nav = await v.pg.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')));
      if (r.expected !== null && nav > 90) problems.push(`${tag}: open menu counted as navbar height (${nav}px)`);
    }
    if (v.errs.length) problems.push(`${tag}: ${v.errs.join(' | ')}`);
    checks++; await v.ctx.close();
  }
  return { checks, problems };
}
