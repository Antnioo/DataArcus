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
    // every Tabular Editor (C#) script in the fix plan closes all its strings, so it compiles
    if (vp[0] > 1000) {
      await v.pg.click('[data-tab=fix]');
      await v.pg.evaluate(() => { window.__copied = []; navigator.clipboard.writeText = (t) => { window.__copied.push(t); return Promise.resolve(); }; });
      for (const b of await v.pg.$$('#mhTab [data-script^="te:"]')) await b.click();
      const cs = await v.pg.evaluate(() => window.__copied);
      const open = (src) => { let inStr = false; for (let i = 0; i < src.length; i++) { const ch = src[i];
        if (!inStr) { if (ch === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) break; } else if (ch === '"') inStr = true; }
        else if (ch === '\\') i++; else if (ch === '"') inStr = false; else if (ch === '\n') return true; } return inStr; };
      check(cs.length >= 2, `model health: only ${cs.length} Tabular Editor scripts to check`);
      cs.forEach((c) => check(!open(c), `model health: a Tabular Editor script leaves a string open:\n${c.slice(0, 300)}`));
    }
    if (v.errs.length) problems.push(`model health ${vp[0]}px: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }

  // Measure builder: each output tab shows only its own box, and the TMDL script sets formats, folders and descriptions
  {
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.pg.goto(`${url}/tools/dax-measure-builder.html?lang=en`, { waitUntil: 'networkidle' });
    for (const tab of ['tmdl', 'one', 'all']) {
      await v.pg.click(`[data-tab-out="${tab}"]`);
      const shown = await v.pg.evaluate(() => ['outAll', 'outTmdl', 'outOne'].filter((id) => document.getElementById(id).offsetParent));
      const want = { all: 'outAll', tmdl: 'outTmdl', one: 'outOne' }[tab];
      check(shown.length === 1 && shown[0] === want, `measure builder "${tab}" tab shows ${shown.join(', ') || 'nothing'}`);
    }
    const t = await v.pg.$eval('#tmdl', (e) => e.textContent);
    check(t.startsWith('createOrReplace\n\n\tref table Sales\n'), `measure builder TMDL: header ${JSON.stringify(t.slice(0, 40))}`);
    check(/\t\tmeasure 'Total Sales YoY %' = ```\n[\s\S]*?\t\t\t\t```\n\t\t\tformatString: 0\.0%\n\t\t\tdisplayFolder: Time intelligence\\Compare\n/.test(t), 'measure builder TMDL: YoY % has no % format or folder');
    check(/\t\t\/\/\/ Month to date[^\n]*\n\t\tmeasure 'Total Sales MTD' = ```\n\t\t\t\tCALCULATE/.test(t), 'measure builder TMDL: MTD has no description or expression');
    check((t.match(/```/g) || []).length % 2 === 0, 'measure builder TMDL: unbalanced ``` fences');
    await v.pg.evaluate(() => { document.documentElement.lang = 'ar'; });
    const ar = await v.pg.$eval('#tmdl', (e) => e.textContent);
    check(ar === t, 'measure builder TMDL: the model text changes with the page language');
    if (v.errs.length) problems.push(`measure builder: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }

  // Licensing calculator: paginated reports are not sold as a Premium feature (Microsoft Learn: Pro can publish
  // them to any workspace), in either language
  for (const lang of ['en', 'ar']) {
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.pg.goto(`${url}/tools/power-bi-licensing-cost-calculator.html?lang=${lang}`, { waitUntil: 'networkidle' });
    const note = await v.pg.$eval('[data-i18n="lc.premiumNote"]', (e) => e.textContent);
    check(!/paginated|مرقّمة/i.test(note), `licensing ${lang}: Premium features list paginated reports: ${note}`);
    // a number the calculator cannot use is replaced by the one it used once the field is left
    for (const [typed, shown] of [['250000', '100000'], ['-50', '0'], ['12.7', '12']]) {
      await v.pg.fill('#viewers', typed); await v.pg.press('#viewers', 'Tab');
      const got = await v.pg.$eval('#viewers', (e) => e.value);
      check(got === shown, `licensing ${lang}: typed ${typed} viewers, the field shows ${got}, the costs use ${shown}`);
    }
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
      // settings boxes in tool panels are compact (the site-wide form style is sized for the contact form);
      // headline number boxes with a big font, like the licensing calculator's, are meant to be larger
      const tall = [...document.querySelectorAll('.tg-panel .form-control, .tg-panel .form-select')].filter((e) => e.getClientRects().length && e.getBoundingClientRect().height > 44 && parseFloat(getComputedStyle(e).fontSize) < 18).map((e) => (e.id || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().height) + 'px');
      // a button right beside a settings box (the theme generator's Generate) is as tall as the box
      const gen = document.getElementById('genBtn'), sel = document.getElementById('harmony');
      const rowGap = gen && sel ? Math.abs(Math.round(gen.getBoundingClientRect().height - sel.getBoundingClientRect().height)) : 0;
      return { rowGap, tall, gap, faqGap: cta && faq ? Math.round(faq.getBoundingClientRect().top - cta.getBoundingClientRect().bottom) : null };
    });
    const tag = `${page} ${lang} ${vp[0]}px`;
    if (r.gap !== null) check(r.gap >= 6, `${tag}: CTA buttons ${r.gap}px apart`);
    check(!r.tall.length, `${tag}: tall input boxes: ${r.tall.join(', ')}`);
    check(r.rowGap <= 1, `${tag}: Generate button ${r.rowGap}px off the height of the box beside it`);
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
