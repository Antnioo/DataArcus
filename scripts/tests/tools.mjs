// Tool pages: scrolling inside the tools lands below the navbar (model health results,
// exam navigation), the call-to-action buttons are spaced in both directions, the FAQ
// sits right after them, and the site still works when the AOS library fails to load.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { visitor, settle, ROOT } from './lib.mjs';

const below = (pg, id) => pg.evaluate((id) => {
  const el = document.getElementById(id), nav = document.getElementById('navbar');
  return { top: Math.round(el.getBoundingClientRect().top), covered: Math.round(nav.getBoundingClientRect().bottom) };
}, id);

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const landed = (r, what) => check(r.top >= r.covered - 1 && r.top <= r.covered + 40, `${what}: top at ${r.top}px, navbar ends at ${r.covered}px`);

  // The exam banks (audit AUD-024 to AUD-028, 2026-10-04). Answers are revealed with each option's own explanation,
  // so on a single-answer question the one empty explanation must sit on the correct option. Yes/no statements aren't
  // shuffled and earn partial credit, so answering "Yes" to everything must not pay: between 40% and 60% of each
  // bank's statements are true, and no question is all Yes. Explanations that open with "Yes."/"No." agree with the
  // key. PBIP and PBIR are generally available (not "preview"), and no question keys a Q&A experience (Microsoft
  // retires Q&A in February 2027).
  for (const [file, name] of [['dp600-questions.js', 'DP600'], ['pl300-questions.js', 'PL300']]) {
    const ctx = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/data', file), 'utf8'), ctx);
    const bank = ctx.window[name], all = [...bank.q, ...bank.cases.flatMap((c) => c.questions)];
    let yes = 0, no = 0;
    const bad = { why: [], qa: [], allYes: [], said: [], preview: [] };
    for (const q of all) {
      if (q.type === 'single') {
        const empty = q.why.map((w, i) => (w ? -1 : i)).filter((i) => i >= 0);
        if (!(empty.length === 1 && empty[0] === q.ans)) bad.why.push(`${q.id} (empty on ${empty.join(', ')}, answer ${q.ans})`);
        if (/\bQ&A\b/.test(q.opts[q.ans])) bad.qa.push(q.id);
      }
      if (q.type === 'yesno') {
        q.ans.forEach((a) => (a ? yes++ : no++));
        if (q.ans.every((a) => a)) bad.allYes.push(q.id);
        q.why.forEach((w, i) => { const m = /^(Yes|No)\./.exec(w); if (m && (m[1] === 'Yes') !== q.ans[i]) bad.said.push(`${q.id} #${i + 1}`); });
      }
      if (/(PBIR|Power BI (Desktop )?projects?)[^.]*\bpreview\b/i.test([q.exp, ...(q.why || [])].join(' '))) bad.preview.push(q.id);
    }
    check(!bad.why.length, `${name}: the empty explanation isn't on the correct option: ${bad.why.join('; ')}`);
    check(!bad.qa.length, `${name}: the answer is a Q&A experience, which retires in February 2027: ${bad.qa.join(', ')}`);
    check(!bad.allYes.length, `${name}: every statement is Yes: ${bad.allYes.join(', ')}`);
    check(!bad.said.length, `${name}: an explanation's "Yes."/"No." disagrees with the key: ${bad.said.join(', ')}`);
    check(!bad.preview.length, `${name}: calls PBIP or PBIR a preview: ${bad.preview.join(', ')}`);
    const share = yes / (yes + no);
    check(share >= 0.4 && share <= 0.6, `${name}: ${yes} of ${yes + no} yes/no statements are Yes (${Math.round(share * 100)}%), outside 40% to 60%`);
  }

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

  // Licensing calculator: each option's line adds up to its total (beta prep 2026-10-04). A per-user price converted to
  // AED or SAR has cents (Pro $14 = AED 51.415): shown as a whole "AED 51", 825 users x 617 a year came to AED 520,607
  // beside a total of AED 520,590. The shown parts must give the shown total, within their rounding (half a unit for
  // the capacity and the total, half a fil or halala per user).
  for (const lang of ['en', 'ar']) for (const [currency, period, creators, viewers, extra] of [['AED', 'month', 10, 150, {}], ['AED', 'year', 25, 800, { fabric: true, billing: 'payg' }],
    ['SAR', 'month', 10, 150, { premium: true }], ['SAR', 'year', 40, 2000, { premium: true, e5: true }], ['USD', 'month', 10, 150, { premium: true }]]) {
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.ctx.addInitScript((s) => localStorage.setItem('dataarcus-licensing-calculator', JSON.stringify(s)), { currency, period, creators, viewers, ...extra });
    await v.pg.goto(`${url}/tools/power-bi-licensing-cost-calculator.html?lang=${lang}`, { waitUntil: 'networkidle' });
    const rows = await v.pg.$$eval('#bars .lc-row:not(.invalid)', (rs) => rs.map((r) => ({ cost: r.querySelector('.lc-cost').firstChild.textContent, detail: r.querySelector('.lc-detail').textContent })));
    const num = (s) => +s.replace(/,/g, '');
    for (const r of rows) {
      const total = num(r.cost.match(/\d[\d,]*(?:\.\d+)?/)[0]);
      let sum = 0, users = 0;
      for (const part of r.detail.split('+')) {
        const n = part.match(/\d[\d,]*(?:\.\d+)?/g).map(num);
        if (part.includes('×')) { users += n[0]; sum += n[0] * n[n.length - 1]; } else sum += n[n.length - 1];
      }
      check(Math.abs(sum - total) <= 1 + users * 0.005, `licensing ${lang} ${currency} per ${period}: "${r.detail.trim()}" makes ${Math.round(sum).toLocaleString('en-US')}, the total shows ${r.cost.trim()}`);
    }
    check(rows.length >= 2, `licensing ${lang} ${currency}: ${rows.length} options read`);
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
      // dropdown lists: the browser draws the open list itself; with the site's white text it must also be dark,
      // or the options are white on white (only the highlighted one shows)
      const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g); if (!m) return null; const [r, g, b, a] = m.map(Number); return a === 0 ? null : (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
      const unreadable = [...document.querySelectorAll('select')].filter((e) => e.getClientRects().length).flatMap((sel) => [...sel.options].slice(0, 3).map((o) => {
        const cs = getComputedStyle(o), fg = lum(cs.color), bg = lum(cs.backgroundColor);
        const dark = /dark/.test(getComputedStyle(sel).colorScheme);
        return (bg == null ? (dark ? null : (fg > 0.6 ? 'white text on the browser\'s light list' : null)) : (Math.abs(fg - bg) < 0.4 ? 'too little contrast' : null)) && `${sel.id || sel.name || 'select'}: ${o.textContent.trim().slice(0, 20)}`;
      })).filter(Boolean);
      return { unreadable, rowGap, tall, gap, faqGap: cta && faq ? Math.round(faq.getBoundingClientRect().top - cta.getBoundingClientRect().bottom) : null };
    });
    const tag = `${page} ${lang} ${vp[0]}px`;
    if (r.gap !== null) check(r.gap >= 6, `${tag}: CTA buttons ${r.gap}px apart`);
    check(!r.tall.length, `${tag}: tall input boxes: ${r.tall.join(', ')}`);
    check(!r.unreadable.length, `${tag}: dropdown options unreadable (white on white): ${r.unreadable.slice(0, 3).join(' | ')}`);
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

  // Pages don't jump once they load (audit AUD-001, 2026-10-04): the tools' first view takes the place reserved for
  // it, and the SVG KPI Designer's first-visit banner is there from the start. Layout shift (CLS) over the first 3 s,
  // first visit, phone and desktop, English and Arabic: at most 0.1 ("good"). Web fonts are not loaded in the tests
  // (lib.mjs), so this is the script-caused part; the font swap is measured with Lighthouse.
  for (const page of ['svg-kpi-designer', 'pl-300-practice-exam', 'dp-600-practice-exam', 'power-bi-model-health-check']) for (const lang of ['en', 'ar']) for (const vp of [[1440, 900], [390, 844]]) {
    const v = await visitor(browser, { viewport: vp });
    await v.ctx.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    await v.pg.goto(`${url}/tools/${page}.html?lang=${lang}`, { waitUntil: 'load' }); await v.pg.waitForTimeout(3000);
    const cls = await v.pg.evaluate(() => +window.__cls.toFixed(3));
    check(cls <= 0.1, `${page} ${lang} ${vp[0]}px: layout shift ${cls} after loading (want 0.1 or less)`);
    await v.ctx.close();
  }
  // a returning visitor (tutorial seen) never sees the SVG KPI Designer's banner, not even for a moment
  {
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.ctx.addInitScript(() => { try { localStorage.setItem('dataarcus-svg-kpi-tour', '{"seen":true}'); } catch (e) { /* ignore */ } });
    await v.pg.goto(`${url}/tools/svg-kpi-designer.html?lang=en`, { waitUntil: 'domcontentloaded' });
    const early = await v.pg.evaluate(() => [...document.querySelectorAll('.kd-banner')].some((b) => b.getClientRects().length));
    await v.pg.waitForLoadState('networkidle');
    const late = await v.pg.evaluate(() => [...document.querySelectorAll('.kd-banner')].some((b) => b.getClientRects().length));
    check(!early && !late, `SVG KPI Designer, tutorial seen: the banner shows (${early ? 'while loading' : 'after loading'})`);
    await v.ctx.close();
  }

  // Accessibility of the tools (audit AUD-018, 2026-10-04), EN and AR: every drop-down has a name, a tab list holds
  // tabs that say which one is selected, a code or table box that scrolls can be reached and scrolled by keyboard,
  // and the SVG KPI Designer's layers can be picked and edited without a mouse.
  for (const lang of ['en', 'ar']) {
    for (const page of ['power-bi-theme-generator', 'dax-calendar-table-generator', 'dax-measure-builder', 'svg-kpi-designer', 'power-bi-licensing-cost-calculator', 'power-bi-model-health-check']) {
      const v = await visitor(browser, { viewport: [1440, 900] });
      await v.pg.goto(`${url}/tools/${page}.html?lang=${lang}`, { waitUntil: 'networkidle' });
      if (page === 'power-bi-model-health-check') { await v.pg.click('#mhSample'); await v.pg.waitForSelector('#mhTab', { timeout: 20000 }); }
      const r = await v.pg.evaluate(() => {
        const named = (e) => (e.getAttribute('aria-label') || '').trim() || (e.getAttribute('aria-labelledby') && document.getElementById(e.getAttribute('aria-labelledby'))?.textContent.trim()) || (e.id && document.querySelector(`label[for="${e.id}"]`)?.textContent.trim()) || e.closest('label')?.textContent.trim();
        const what = (e) => e.id ? '#' + e.id : e.tagName.toLowerCase() + [...e.attributes].filter((a) => a.name.startsWith('data-')).map((a) => `[${a.name}="${a.value}"]`).join('');
        const selects = [...document.querySelectorAll('main select')].filter((e) => e.getClientRects().length && !named(e)).map(what);
        const tablists = [...document.querySelectorAll('[role=tablist]')].filter((t) => { const tabs = t.querySelectorAll('[role=tab]'); return !tabs.length || [...tabs].filter((x) => x.getAttribute('aria-selected') === 'true').length !== 1; }).map(what);
        const scroll = [...document.querySelectorAll('main pre, main table, main [id="slotTable"], main code')].map((e) => e.closest('[id]') && getComputedStyle(e).overflow === 'visible' ? e.parentElement : e)
          .filter((e) => e.getClientRects().length && (e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2) && /(auto|scroll)/.test(getComputedStyle(e).overflow + getComputedStyle(e).overflowX + getComputedStyle(e).overflowY))
          .filter((e) => e.tabIndex < 0 && !e.querySelector('a, button, input, select, textarea, [tabindex]')).map(what);
        return { selects, tablists, scroll };
      });
      check(!r.selects.length, `${page} ${lang}: drop-downs without a name: ${r.selects.join(', ')}`);
      check(!r.tablists.length, `${page} ${lang}: tab lists without tabs or without one selected tab: ${r.tablists.join(', ')}`);
      check(!r.scroll.length, `${page} ${lang}: scrolling boxes a keyboard can't reach: ${r.scroll.join(', ')}`);
      if (v.errs.length) problems.push(`${page} ${lang} a11y: ${v.errs.join(' | ')}`);
      await v.ctx.close();
    }
    // keyboard only: Tab to the second layer, Enter picks it (announced as pressed), its properties open and can be
    // changed from the keyboard
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.pg.goto(`${url}/tools/svg-kpi-designer.html?lang=${lang}`, { waitUntil: 'networkidle' });
    const names = await v.pg.$$eval('#layers .kd-lname', (bs) => bs.map((b) => b.textContent.trim()));
    let reached = false;
    for (let k = 0; k < 120 && !reached; k++) { await v.pg.keyboard.press('Tab'); reached = await v.pg.evaluate((n) => document.activeElement?.classList.contains('kd-lname') && document.activeElement.textContent.trim() === n, names[1]); }
    await v.pg.keyboard.press('Enter');
    const after = await v.pg.evaluate(() => ({ pressed: [...document.querySelectorAll('#layers .kd-lname')].map((b) => b.getAttribute('aria-pressed')), active: document.querySelector('#layers li.active .kd-lname')?.textContent.trim(), field: !!document.querySelector('#props input, #props select') }));
    check(reached && after.active === names[1] && after.pressed.filter((x) => x === 'true').length === 1 && after.pressed[1] === 'true' && after.field,
      `svg-kpi-designer ${lang}, keyboard: layer "${names[1]}" ${reached ? 'reached' : 'not reached by Tab'}; after Enter ${JSON.stringify(after)}`);
    await v.ctx.close();
  }

  // Every drop-down on the tools shows its whole option text (audit AUD-013, 2026-10-04; the Calendar Generator's own
  // check is in gulf-calendar): each option's width in the drop-down's font against the room inside it, EN and AR,
  // phone to wide desktop. The SVG KPI Designer starts from a design with formula values, so its formula drop-downs
  // are measured too.
  for (const lang of ['en', 'ar']) for (const w of [390, 768, 1024, 1440]) for (const page of ['power-bi-theme-generator', 'dax-measure-builder', 'svg-kpi-designer', 'power-bi-licensing-cost-calculator']) {
    const v = await visitor(browser, { viewport: [w, 900] });
    await v.pg.goto(`${url}/tools/${page}.html?lang=${lang}`, { waitUntil: 'networkidle' });
    const cut = await v.pg.evaluate(() => {
      const c = document.createElement('canvas').getContext('2d'), out = [];
      for (const s of document.querySelectorAll('main select')) {
        if (!s.getClientRects().length) continue;
        const cs = getComputedStyle(s), room = s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        c.font = cs.font;
        for (const o of s.options) { const need = Math.ceil(c.measureText(o.textContent.trim()).width); if (need > room + 0.5) out.push(`${s.id || s.dataset.vk || 'select'} "${o.textContent.trim()}" ${need}px in ${Math.floor(room)}px`); }
      }
      return [...new Set(out)];
    });
    check(!cut.length, `${page} ${lang} ${w}px: drop-down text cut: ${cut.slice(0, 6).join('; ')}${cut.length > 6 ? ` and ${cut.length - 6} more` : ''}`);
    await v.ctx.close();
  }
  // the Ramadan sales card starter (5 Oct): in the "Start from" row in English and Arabic, with its Arabic name; it
  // opens the 340 x 150 card with the tool's sample measure names, and its Arabic title is drawn right to left
  for (const lang of ['en', 'ar']) {
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.pg.goto(`${url}/tools/svg-kpi-designer.html?lang=${lang}`, { waitUntil: 'networkidle' });
    const label = await v.pg.$eval('#starters [data-t="ramadan"]', (b) => b.textContent.trim()).catch(() => null);
    if (label) await v.pg.click('#starters [data-t="ramadan"]');
    const got = await v.pg.evaluate(() => {
      const svg = document.querySelector('#stage svg.kd-svg'), texts = svg ? [...svg.querySelectorAll('text')] : [];
      const ar = texts.find((t) => t.textContent === 'مبيعات رمضان');
      let rtl = null;
      if (ar) { const n = ar.getNumberOfChars(); rtl = ar.getComputedTextLength() > 20 && ar.getStartPositionOfChar(0).x > ar.getStartPositionOfChar(n - 1).x; }
      return { vb: svg && svg.getAttribute('viewBox'), rtl, measures: [...document.querySelectorAll('[data-vk="measure"]')].map((i) => i.value),
        layers: [...document.querySelectorAll('.kd-layer .kd-lname span')].map((x) => x.textContent) };
    });
    // the Layers panel lists names that say what each layer draws (owner's go 5 Oct ~15:58); one name per layer, the
    // same in English and Arabic, because the template format has no per-language layer name
    const names = ['Ring', 'Percent', 'Of target', 'Title', 'Title (Arabic)', 'Sales value', 'Target', 'Crescent', 'Crescent cut-out', 'Star'];
    check(JSON.stringify([...got.layers].sort()) === JSON.stringify([...names].sort()), `svg-kpi-designer ${lang}: the Ramadan card's layer names: ${JSON.stringify(got.layers)}`);
    check(label === (lang === 'ar' ? 'بطاقة مبيعات رمضان' : 'Ramadan sales card') && /340 150$/.test(got.vb || '') && got.rtl === true && ['Sales', 'Target', 'Sales LY'].every((m) => got.measures.includes(m)),
      `svg-kpi-designer ${lang}: the Ramadan sales card starter: label "${label}", ${JSON.stringify(got)}`);
    await v.ctx.close();
  }

  return { checks, problems };
}
