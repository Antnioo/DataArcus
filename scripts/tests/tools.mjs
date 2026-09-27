// Tool pages: scrolling inside the tools lands below the navbar (model health results,
// exam navigation), the call-to-action buttons are spaced in both directions, the FAQ
// sits right after them, and the site still works when the AOS library fails to load.
import { visitor, settle } from './lib.mjs';

const below = (pg, id) => pg.evaluate((id) => {
  const el = document.getElementById(id), nav = document.getElementById('navbar');
  return { top: Math.round(el.getBoundingClientRect().top), covered: Math.round(nav.getBoundingClientRect().bottom) };
}, id);

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const landed = (r, what) => check(r.top >= r.covered - 1 && r.top <= r.covered + 40, `${what}: top at ${r.top}px, navbar ends at ${r.covered}px`);

  // Model health check: the sample model's results scroll into view below the navbar
  for (const vp of [[1440, 900], [390, 844]]) {
    const v = await visitor(browser, { viewport: vp });
    await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=en`, { waitUntil: 'networkidle' });
    await v.pg.evaluate(() => scrollTo(0, 400));
    await v.pg.click('#mhSample');
    await v.pg.waitForSelector('#mhTab', { timeout: 20000 });
    await settle(v.pg);
    landed(await below(v.pg, 'mhApp'), `model health ${vp[0]}px results`);
    if (v.errs.length) problems.push(`model health ${vp[0]}px: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }

  // Exam simulators: moving to the next question from lower down scrolls back to the question
  for (const page of ['dp-600-practice-exam', 'pl-300-practice-exam']) {
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.pg.goto(`${url}/tools/${page}.html?lang=en`, { waitUntil: 'networkidle' });
    await v.pg.click('[data-go="practice"]'); await v.pg.click('#dpStart');
    await v.pg.waitForSelector('#dpSkip');
    await v.pg.evaluate(() => scrollTo({ top: document.getElementById('dpApp').getBoundingClientRect().top + scrollY + 500, behavior: 'instant' }));
    await v.pg.click('#dpSkip'); await settle(v.pg);
    landed(await below(v.pg, 'dpApp'), `${page} next question`);
    if (v.errs.length) problems.push(`${page}: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }

  // Call-to-action buttons and FAQ spacing on every tool page, both languages
  for (const page of ['power-bi-theme-generator', 'dax-calendar-table-generator', 'dax-measure-builder', 'power-bi-licensing-cost-calculator', 'index',
    'power-bi-model-health-check', 'svg-kpi-designer', 'dp-600-practice-exam', 'pl-300-practice-exam']) for (const lang of ['en', 'ar']) for (const vp of [[1440, 900], [390, 844]]) {
    const v = await visitor(browser, { viewport: vp });
    await v.pg.goto(`${url}/tools/${page}.html?lang=${lang}`, { waitUntil: 'networkidle' });
    const r = await v.pg.evaluate(() => {
      const cta = document.querySelector('.tg-cta, .th-cta'), faq = document.querySelector('section.tg-faq');
      const btns = cta ? [...cta.querySelectorAll('a.btn, a.tg-btn2')].map((a) => a.getBoundingClientRect()) : [];
      let gap = null;
      if (btns.length === 2) {
        const [a, b] = btns, sameRow = Math.abs(a.top - b.top) < 5;
        gap = sameRow ? Math.round(Math.max(b.left - a.right, a.left - b.right)) : Math.round(b.top - a.bottom);
      }
      return { gap, faqGap: cta && faq ? Math.round(faq.getBoundingClientRect().top - cta.getBoundingClientRect().bottom) : null };
    });
    const tag = `${page} ${lang} ${vp[0]}px`;
    if (r.gap !== null) check(r.gap >= 6, `${tag}: CTA buttons ${r.gap}px apart`);
    if (r.faqGap !== null) check(r.faqGap <= 60, `${tag}: ${r.faqGap}px between the CTA box and the FAQ`);
    await v.ctx.close();
  }

  // AOS blocked: content still shows, and the rest of main.js (navbar, cookie code) still runs
  const v = await visitor(browser, { viewport: [1440, 900], timezone: 'Europe/Berlin', consent: null });
  await v.ctx.route(/cdn\.jsdelivr\.net\/npm\/aos/, (rt) => rt.abort());
  await v.pg.goto(`${url}/index.html?lang=en`, { waitUntil: 'networkidle' });
  const r = await v.pg.evaluate(() => ({ hidden: [...document.querySelectorAll('[data-aos]')].length, banner: !!document.querySelector('.cc-bar'), smooth: document.documentElement.classList.contains('smooth-scroll') }));
  check(r.hidden === 0 && r.banner && r.smooth, `AOS blocked: ${JSON.stringify(r)}`);
  check(!v.errs.some((e) => /AOS/.test(e)), `AOS blocked: ${v.errs.join(' | ')}`);
  await v.ctx.close();
  return { checks, problems };
}
