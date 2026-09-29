// Every page, in English and Arabic, on a phone and a laptop:
// no errors, no missing translations, no sideways scrolling, nothing marked hidden on screen, the phone menu opens,
// and the top offset (style.css --top-offset) matches the real navbar.
import fs from 'node:fs';
import path from 'node:path';
import { pages, visitor, ROOT } from './lib.mjs';

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  // text-only translations (data-i18n) replace the whole element, so their HTML must be plain text:
  // an icon or tag inside would be wiped, and duplicated text would still show to search engines
  for (const p of pages()) {
    const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
    for (const m of html.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]*)<(?!\/)/g)) problems.push(`${p}: data-i18n="${m[1]}" has a tag inside ("${m[2].trim().slice(0, 40)}...")`);
    checks++;
  }
  for (const p of pages()) for (const lang of ['en', 'ar']) for (const vp of [[390, 844], [1440, 900]]) {
    const v = await visitor(browser, { viewport: vp });
    await v.pg.goto(`${url}/${p}?lang=${lang}`, { waitUntil: 'networkidle' });
    const tag = `${p} ${lang} ${vp[0]}px`;
    const r = await v.pg.evaluate(() => {
      const nav = document.getElementById('navbar'), pins = [...document.querySelectorAll('[data-pin]')].reduce((a, e) => a + e.offsetHeight, 0);
      return {
        missing: document.body.innerText.includes('[Missing:'),
        // translated attributes (data-i18n-placeholder, -alt, -aria-label, -title): never a missing key, and Arabic on Arabic pages
        attrs: ['placeholder', 'alt', 'aria-label', 'title'].flatMap((a) => [...document.querySelectorAll(`[data-i18n-${a}]`)].map((e) => [a, e.getAttribute(a) || ''])),
        sideways: document.documentElement.scrollWidth > innerWidth,
        offset: parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),
        expected: nav ? nav.offsetHeight + pins + 12 : null,
        // an element marked hidden must not show, whatever display class it has (Bootstrap's d-flex beats its own [hidden])
        shownHidden: [...document.querySelectorAll('[hidden]')].filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.id || e.className || e.tagName),
        // forward and back arrows point the reading direction: mirrored exactly once on Arabic pages
        arrows: [...document.querySelectorAll('.bi-arrow-right, .bi-arrow-left, .bi-arrow-right-circle, .bi-arrow-left-circle')].filter((e) => e.getClientRects().length).map((e) => {
          let flips = 0; for (let n = e; n && n.nodeType === 1; n = n.parentElement) if (/^matrix\(-1/.test(getComputedStyle(n).transform)) flips++;
          if (/^matrix\(-1/.test(getComputedStyle(e, '::before').transform)) flips++;
          return flips % 2;
        })
      };
    });
    if (r.missing) problems.push(`${tag}: missing translation`);
    const badAttrs = r.attrs.filter(([, val]) => val.includes('[Missing:') || (lang === 'ar' && !/[\u0600-\u06FF]/.test(val)));
    if (badAttrs.length) problems.push(`${tag}: attributes not translated: ${badAttrs.slice(0, 3).map(([a, val]) => a + '=' + val).join(' | ')}`);
    if (r.sideways) problems.push(`${tag}: page scrolls sideways`);
    const wrongWay = r.arrows.filter((f) => f !== (lang === 'ar' ? 1 : 0)).length;
    if (wrongWay) problems.push(`${tag}: ${wrongWay} of ${r.arrows.length} arrows point against the reading direction`);
    if (r.shownHidden.length) problems.push(`${tag}: hidden but shown: ${r.shownHidden.join(', ')}`);
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
  // animated numbers reach their value once scrolled into view, also on a short screen (a phone held sideways)
  for (const p of pages().filter((p) => fs.readFileSync(path.join(ROOT, p), 'utf8').includes('data-count='))) {
    const v = await visitor(browser, { viewport: [844, 390] });
    await v.pg.goto(`${url}/${p}?lang=en`, { waitUntil: 'networkidle' });
    const n = await v.pg.locator('[data-count]').count();
    for (let i = 0; i < n; i++) { await v.pg.locator('[data-count]').nth(i).scrollIntoViewIfNeeded(); await v.pg.waitForTimeout(150); }
    await v.pg.waitForTimeout(2500);
    const wrong = await v.pg.$$eval('[data-count]', (els) => els.filter((e) => e.textContent.trim() !== e.dataset.count + (e.dataset.suffix || '')).map((e) => `${e.textContent.trim()} (want ${e.dataset.count})`));
    if (wrong.length) problems.push(`${p} 844x390: counters stuck at ${wrong.join(', ')}`);
    checks++; await v.ctx.close();
  }
  // blog search looks in each card's title, excerpt and category, not its date
  for (const [lang, term] of [['en', 'quiz'], ['en', 'september'], ['ar', 'اختبار']]) {
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.pg.goto(`${url}/blog.html?lang=${lang}`, { waitUntil: 'networkidle' });
    await v.pg.fill('#blogSearch', term); await v.pg.waitForTimeout(500);
    const r = await v.pg.evaluate((term) => {
      const cards = [...document.querySelectorAll('[data-category]')], has = (c) => ['h3', 'p', '.badge'].some((s) => (c.querySelector(s) || { textContent: '' }).textContent.toLowerCase().includes(term));
      return { shown: cards.filter((c) => c.style.display !== 'none').length, want: cards.filter(has).length, wrong: cards.filter((c) => (c.style.display !== 'none') !== has(c)).length };
    }, term);
    if (r.wrong) problems.push(`blog ${lang} search "${term}": shows ${r.shown} posts, ${r.want} contain it`);
    checks++; await v.ctx.close();
  }
  return { checks, problems };
}
