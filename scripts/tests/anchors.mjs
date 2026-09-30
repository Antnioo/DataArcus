// In-page links (#section) on every page: after clicking, and after arriving with #section
// in the address, the target sits just below the navbar and any pinned bar, never hidden under them.
// Full-width sections land flush under the bars, with nothing of the section above showing.
// This is what style.css (--top-offset, section[id]) and main.js section 2 promise.
import { pages, visitor, settle, ready } from './lib.mjs';

const landing = (pg, id) => pg.evaluate((id) => {
  const el = document.getElementById(id), nav = document.getElementById('navbar');
  const covered = Math.max(nav ? nav.getBoundingClientRect().bottom : 0, ...[...document.querySelectorAll('[data-pin]')].map((e) => e.getBoundingClientRect().bottom));
  const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
  // a full-width section lands flush under the bars, so nothing of the section above peeks out
  const section = el.tagName === 'SECTION', prev = el.previousElementSibling;
  return { top: Math.round(el.getBoundingClientRect().top), covered: Math.round(covered), atEnd, section,
    peek: section && prev ? Math.round(prev.getBoundingClientRect().bottom - covered) : 0,
    active: document.querySelector('.tg-steps a.active')?.dataset.step };
}, id);

const judge = (r, tag, id, problems) => {
  if (r.top < r.covered - 1) problems.push(`${tag} #${id}: top at ${r.top}px, hidden under bars ending at ${r.covered}px`);
  else if (r.section && !r.atEnd && Math.abs(r.top - r.covered) > 1) problems.push(`${tag} #${id}: section lands ${r.top - r.covered}px below the bars (should be flush)`);
  if (r.peek > 1) problems.push(`${tag} #${id}: ${r.peek}px of the section above shows under the bars`);
  else if (!r.atEnd && r.top > r.covered + 40) problems.push(`${tag} #${id}: top at ${r.top}px, too far below the bars (${r.covered}px)`);
  if (r.active !== undefined && r.active !== id) problems.push(`${tag} #${id}: steps bar highlights "${r.active}"`);
};

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  for (const p of pages()) for (const vp of [[1440, 900], [390, 844]]) {
    const v = await visitor(browser, { viewport: vp });
    await v.pg.goto(`${url}/${p}?lang=en`, { waitUntil: 'networkidle' });
    await ready(v.pg);
    const ids = await v.pg.evaluate(() => [...new Set([...document.querySelectorAll('main a[href^="#"], section a[href^="#"], header a[href^="#"]')]
      .filter((a) => a.offsetParent && a.getAttribute('href').length > 1 && document.getElementById(a.getAttribute('href').slice(1)))
      .map((a) => a.getAttribute('href').slice(1)))]);
    for (const id of ids) {
      await v.pg.evaluate(() => scrollTo(0, 0)); await settle(v.pg);
      await v.pg.locator(`a[href="#${id}"]:visible`).first().click();
      await settle(v.pg);
      judge(await landing(v.pg, id), `${p} ${vp[0]}px click`, id, problems); checks++;
      // arriving from another page with #id in the address
      const w = await visitor(browser, { viewport: vp });
      await w.pg.goto(`${url}/${p}?lang=en#${id}`, { waitUntil: 'load' });
      await ready(w.pg); await w.pg.waitForTimeout(900); await settle(w.pg);
      judge(await landing(w.pg, id), `${p} ${vp[0]}px arrive`, id, problems); checks++;
      if (w.errs.length) problems.push(`${p} #${id}: ${w.errs.join(' | ')}`);
      await w.ctx.close();
    }
    if (v.errs.length) problems.push(`${p}: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }
  // the navbar's About / Contact / Services links: on the homepage, and arriving from another page
  for (const vp of [[1440, 900], [390, 844]]) for (const from of ['index.html', 'tools/index.html']) for (const id of ['services', 'about', 'contact']) {
    const v = await visitor(browser, { viewport: vp });
    await v.pg.goto(`${url}/${from}?lang=en`, { waitUntil: 'networkidle' });
    await ready(v.pg);
    if (vp[0] < 992) { await v.pg.click('.navbar-toggler'); await v.pg.waitForTimeout(400); }
    await v.pg.locator(`#navmenu a[href$="#${id}"]`).first().click();
    await v.pg.waitForLoadState('networkidle'); await ready(v.pg); await v.pg.waitForTimeout(700); await settle(v.pg);
    judge(await landing(v.pg, id), `navbar ${from} ${vp[0]}px`, id, problems); checks++;
    if (v.errs.length) problems.push(`navbar ${from} #${id}: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }
  return { checks, problems };
}
