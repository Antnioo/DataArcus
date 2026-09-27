// In-page links (#section) on every page: after clicking, and after arriving with #section
// in the address, the section's top sits just below the navbar and any pinned bar —
// never hidden under them. This is what style.css --top-offset and main.js section 2 promise.
import { pages, visitor, settle } from './lib.mjs';

const landing = (pg, id) => pg.evaluate((id) => {
  const el = document.getElementById(id), nav = document.getElementById('navbar');
  const covered = Math.max(nav ? nav.getBoundingClientRect().bottom : 0, ...[...document.querySelectorAll('[data-pin]')].map((e) => e.getBoundingClientRect().bottom));
  const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
  return { top: Math.round(el.getBoundingClientRect().top), covered: Math.round(covered), atEnd, active: document.querySelector('.tg-steps a.active')?.dataset.step };
}, id);

const judge = (r, tag, id, problems) => {
  if (r.top < r.covered - 1) problems.push(`${tag} #${id}: top at ${r.top}px, hidden under bars ending at ${r.covered}px`);
  else if (!r.atEnd && r.top > r.covered + 40) problems.push(`${tag} #${id}: top at ${r.top}px, too far below the bars (${r.covered}px)`);
  if (r.active !== undefined && r.active !== id) problems.push(`${tag} #${id}: steps bar highlights "${r.active}"`);
};

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  for (const p of pages()) for (const vp of [[1440, 900], [390, 844]]) {
    const v = await visitor(browser, { viewport: vp });
    await v.pg.goto(`${url}/${p}?lang=en`, { waitUntil: 'networkidle' });
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
      await w.pg.waitForTimeout(900); await settle(w.pg);
      judge(await landing(w.pg, id), `${p} ${vp[0]}px arrive`, id, problems); checks++;
      if (w.errs.length) problems.push(`${p} #${id}: ${w.errs.join(' | ')}`);
      await w.ctx.close();
    }
    if (v.errs.length) problems.push(`${p}: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }
  return { checks, problems };
}
