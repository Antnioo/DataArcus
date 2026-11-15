// 0.3.3 IX4 (D-1111-17; IX1's stage 4): the free page "is this month like the same month last year?" for the Gulf
// calendar, tools/gulf-like-for-like.html, on the engines gulf-compare.js and gulf-dates.js (never a copy), English only
// (the Arabic page is held: locale-routes.js AR_HELD). Every expected number is worked out from gulf-dates.js by hand
// (mcp/work/IX4.md, "Expected numbers"), never read back from the page's own code.
//   N1  the page script loads in Node and answers (answer, overview, DIFFER)
//   E1..E8  the months of the note's table, from answer(): counts, IX1's words ("are not like for like", never "wrong"),
//           the weekend and VAT rows, Oman's own dates, an estimate with the sighting sentence, "not known" outside
//   D1  every estimate date of gulf-dates.js is .NET's UmAlQuraCalendar date (fixtures/umalqura-dotnet.json) or is on
//       the page's DIFFER list, and a date on DIFFER is said "estimate: published tables differ by a day"
//   M1  one engine: the page loads gulf-dates.min.js and gulf-compare.min.js (stamped) before its own script, and its
//       script holds no date of its own (no YYYY-MM-DD)
//   W1  public words: no "first", "only", "official", "wrong" in the page or its script; "Free" is said (a free tool)
//   H1  Arabic held: no ar/ copy, hasArCopy false, not in PAIRS, the English address in the sitemap and no /ar/ one, the
//       hub's card marked data-ar-held and absent from the Arabic hub
//   C1  csp.mjs passes (the page's policy is the one csp.mjs writes)
//   B1..B9  the page in a browser at 1440 px: the verdict and the rows for the months above, the 12-month overview and
//           a click on it, no request after the page loaded, storage untouched, no page error
//   P1  at 390 px, English and with Arabic saved as the visitor's language: no sideways scroll, the tool reads left to
//       right, no page error
//   L1  (0.3.3 LF1, AUD-074) the page does not jump on load (CLS at most 0.1; 0.20 at 1440 and 0.31 at 992 before) for the
//       months that fill the most (March and February 2027: estimates, the most dates) and November 2026, the clock set
//       to each, at 1440 and 992; and the empty result box hides when the month is not known
//   A1  (AUD-075) a page in AR_HELD stays lang="en" dir="ltr", visible from the start, in English, with no Arabic font and
//       no language switch, whether Arabic comes from ?lang=ar or from the saved choice (which it leaves as it was), at
//       390 and 1440 px; the held list read from locale-routes.js only (the page has no Arabic head guard, every other
//       page has one)
//   A2  /tools/?lang=ar shows no card for a held page (as /ar/tools/), /tools/ in English does, at 390 and 1440 px
//   A3  /ar/tools/'s ItemList names exactly the tools it shows (the same set and count), positions 1..n
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { ROOT, visitor, ready } from './lib.mjs';

const require = createRequire(import.meta.url);
const PAGE = '/tools/gulf-like-for-like.html', FILE = 'tools/gulf-like-for-like.html', JS = 'assets/js/gulf-like-for-like.js';
const GD = require('../../assets/js/gulf-dates.js');
const NET = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/tests/fixtures/umalqura-dotnet.json'), 'utf8')).rows;
const has = (f) => fs.existsSync(path.join(ROOT, f));
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };

  // N1
  let L = null;
  try { L = require('../../' + JS); } catch (e) { /* missing: said below */ }
  check(L && typeof L.answer === 'function' && typeof L.overview === 'function' && Array.isArray(L.DIFFER), `N1 ${JS} loads in Node with answer, overview and DIFFER`);
  const A = (o) => (L ? L.answer(o) : { known: false, verdict: '', rows: [], dates: [] });
  const row = (a, key) => (a.rows || []).find((r) => r.key === key) || {};

  // E1..E8
  const feb26 = A({ year: 2026, month: 2, country: 'uae' });
  check(feb26.known && feb26.like === false && /are not like for like/.test(feb26.verdict) && /Ramadan days: 11 against 0/.test(feb26.verdict), `E1 February 2026 (UAE): not like for like, "Ramadan days: 11 against 0" (got ${feb26.verdict})`);
  check(JSON.stringify(row(feb26, 'ramadan').pair) === '[11,0]' && JSON.stringify(row(feb26, 'fitr').pair) === '[0,0]' && JSON.stringify(row(feb26, 'adha').pair) === '[0,0]', `E1 February 2026's rows: Ramadan 11/0, Eid al-Fitr 0/0, Eid al-Adha 0/0 (got ${JSON.stringify(feb26.rows)})`);
  const mar26 = A({ year: 2026, month: 3, country: 'uae' });
  check(/Ramadan days: 19 against 29/.test(mar26.verdict) && /Eid al-Fitr days: 3 against 2/.test(mar26.verdict), `E2 March 2026: Ramadan 19 against 29, Eid al-Fitr 3 against 2 (got ${mar26.verdict})`);
  const aug26 = A({ year: 2026, month: 8, country: 'uae' });
  check(aug26.known && aug26.like === true && /are like for like on the Gulf calendar/.test(aug26.verdict) && !/not like for like/.test(aug26.verdict), `E3 August 2026: like for like on the Gulf calendar (got ${aug26.verdict})`);
  // August 2026 has 10 Saturdays and Sundays (Sat 1 ... Mon 31), August 2025 has 10 (Fri 1 ... Sun 31): by hand
  check(JSON.stringify(row(aug26, 'weekendDays').pair) === '[10,10]', `E3 August 2026's weekend days 10 against 10 (got ${JSON.stringify(row(aug26, 'weekendDays').pair)})`);
  const jan22 = A({ year: 2022, month: 1, country: 'uae' });
  check(jan22.like === false && /the weekend: Saturday \+ Sunday against Friday \+ Saturday/.test(jan22.verdict), `E4 January 2022 (UAE): the weekend changed (got ${jan22.verdict})`);
  const jan22k = A({ year: 2022, month: 1, country: 'ksa' });
  check(jan22k.like === true && !/weekend:/.test(jan22k.verdict), `E4 January 2022 (Saudi Arabia): like for like, no weekend change (got ${jan22k.verdict})`);
  const jul20 = A({ year: 2020, month: 7, country: 'ksa' });
  check(jul20.like === false && /the standard VAT rate: 15% against 5%/.test(jul20.verdict), `E5 July 2020 (Saudi Arabia): VAT 15% against 5% (got ${jul20.verdict})`);
  const feb26o = A({ year: 2026, month: 2, country: 'omn' });
  check(/Ramadan days: 10 against 0/.test(feb26o.verdict), `E6 February 2026 (Oman): 10 Ramadan days, Oman's own date (got ${feb26o.verdict})`);
  const feb27 = A({ year: 2027, month: 2, country: 'uae' });
  check(feb27.estimated === true && /estimate/i.test(feb27.note || '') && /moon is sighted/.test(feb27.note || '') && /may differ by a day/.test(feb27.note || ''), `E7 February 2027: an estimate, with the sighting sentence (got ${feb27.note})`);
  check(feb26.estimated === false, 'E7 February 2026 is not an estimate (announced)');
  for (const y of [2031, 2018]) {
    const a = A({ year: y, month: 3, country: 'uae' });
    check(a.known === false && /not known/i.test(a.verdict) && !(a.rows || []).length && !/\d+ against \d+/.test(a.verdict), `E8 March ${y}: "not known", no number (got ${a.verdict})`);
  }
  check(!/\bwrong\b/i.test([feb26, mar26, jan22, jul20, feb27].map((a) => a.verdict + ' ' + (a.note || '')).join(' ')), 'E1-E7 never "wrong"');

  // D1
  const net = Object.fromEntries(NET.map((r) => [r.hijriYear, r]));
  const differ = (L && L.DIFFER) || [];
  for (const e of GD.events) for (const k of e.estimate || []) {
    const same = net[e.hijriYear] && net[e.hijriYear][k] === e[k], listed = differ.includes(`${e.hijriYear}:${k}`);
    check(same || listed, `D1 ${e.hijriYear} ${k} ${e[k]}: .NET says ${net[e.hijriYear] && net[e.hijriYear][k]}, and the page's DIFFER does not list it`);
    check(!(same && listed), `D1 ${e.hijriYear} ${k}: on DIFFER though .NET agrees`);
  }
  if (L && L.answer) {
    const saved = L.DIFFER.slice();
    L.DIFFER.push('1448:ramadan');
    const d = L.answer({ year: 2027, month: 2, country: 'uae' });
    L.DIFFER.length = 0; saved.forEach((x) => L.DIFFER.push(x));
    const r = (d.dates || []).find((x) => /Ramadan 1448/.test(x.what));
    check(r && r.status === 'estimate: published tables differ by a day', `D1 a date on DIFFER is said "estimate: published tables differ by a day" (got ${r && r.status})`);
    const plain = (L.answer({ year: 2027, month: 2, country: 'uae' }).dates || []).find((x) => /Ramadan 1448/.test(x.what));
    check(plain && plain.status === 'estimate', `D1 a date the tables agree on is said "estimate" (got ${plain && plain.status})`);
  }

  // M1, W1
  const html = has(FILE) ? read(FILE) : '', js = has(JS) ? read(JS) : '';
  const at = (s) => html.indexOf(s);
  check(html && at('gulf-dates.min.js?v=') > 0 && at('gulf-compare.min.js?v=') > at('gulf-dates.min.js?v=') && at('gulf-like-for-like.min.js?v=') > at('gulf-compare.min.js?v='), 'M1 the page loads gulf-dates.min.js, gulf-compare.min.js, then gulf-like-for-like.min.js, each stamped');
  check(js && !/\d{4}-\d{2}-\d{2}/.test(js.replace(/^\s*(\/\/|\*|\/\*).*$/gm, '')), 'M1 the page script holds no date of its own (every date from gulf-dates.js)');
  const text = html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
  const strings = (js.match(/'[^'\n]*'|`[^`]*`/g) || []).join(' ');
  for (const w of ['first', 'only', 'official', 'wrong']) check(html && !new RegExp(`\\b${w}\\b`, 'i').test(text + ' ' + strings), `W1 the page never says "${w}"`);
  check(/\bFree\b/.test(text), 'W1 the page says "Free" (a free tool, D-1027-15)');

  // H1
  const LR = require('../../assets/js/locale-routes.js');
  check(!has('ar/' + FILE), 'H1 no Arabic copy ships (ar/tools/gulf-like-for-like.html)');
  check(Array.isArray(LR.AR_HELD) && LR.AR_HELD.includes(PAGE) && LR.hasArCopy(PAGE) === false && LR.hasArCopy('/tools/power-bi-licensing-cost-calculator.html') === true, 'H1 locale-routes: the page is held (AR_HELD), hasArCopy false; other tools unchanged');
  const { PAIRS } = await import('../ar-pages.mjs');
  const sitemap = read('sitemap.xml');
  check(!PAIRS.includes(FILE) && sitemap.includes(`<loc>https://dataarcus.com/${FILE}</loc>`) && !sitemap.includes(`/ar/${FILE}`), 'H1 in the sitemap in English, not in PAIRS, no /ar/ address');
  const hub = read('tools/index.html'), arHub = read('ar/tools/index.html');
  check(/<div\b[^>]*data-ar-held[^>]*>\s*(<!--[\s\S]*?-->\s*)?<a\b[^>]*href="gulf-like-for-like\.html"/.test(hub), 'H1 the hub has the card, its column marked data-ar-held');
  // (its ItemList JSON-LD is the English hub's, byte for byte as every inline script of a copy: English names only)
  check(!arHub.replace(/<script\b[\s\S]*?<\/script>/gi, '').includes('gulf-like-for-like'), 'H1 the Arabic hub has no card, link or text for the held page');

  // C1
  const csp = spawnSync(process.execPath, [path.join(ROOT, 'scripts/csp.mjs')], { encoding: 'utf8' });
  check(csp.status === 0, `C1 csp.mjs passes: ${(csp.stdout + csp.stderr).trim().slice(0, 200)}`);

  if (!html) { problems.push(`B ${FILE} does not exist: no browser checks`); return { checks, problems }; }

  // B1..B9 at 1440 px
  const v = await visitor(browser, { viewport: [1440, 900] });
  try {
    const asked = [];
    await v.pg.goto(`${url}${PAGE}?lang=en`, { waitUntil: 'networkidle' });
    await ready(v.pg);
    const store = () => v.pg.evaluate(() => JSON.stringify([Object.entries(localStorage).sort(), Object.entries(sessionStorage).sort()]));
    const before = await store();
    v.pg.on('request', (r) => asked.push(r.url()));
    const pick = async (y, m, c) => { await v.pg.selectOption('#lfYear', String(y)); await v.pg.selectOption('#lfMonth', String(m)); await v.pg.selectOption('#lfCountry', c); };
    const view = () => v.pg.evaluate(() => ({ verdict: document.querySelector('#lfVerdict').textContent.replace(/\s+/g, ' ').trim(),
      rows: [...document.querySelectorAll('#lfRows tr')].map((t) => [...t.children].map((c) => c.textContent.trim())), tableShown: !document.querySelector('#lfDetail').hidden,
      dates: document.querySelector('#lfDates').textContent.replace(/\s+/g, ' '), note: document.querySelector('#lfNote').textContent.replace(/\s+/g, ' '),
      over: [...document.querySelectorAll('#lfYearRows tr')].map((t) => ({ month: t.dataset.month, text: t.textContent.replace(/\s+/g, ' ').trim(), on: t.classList.contains('on') })) }));
    await pick(2026, 2, 'uae');
    let s = await view();
    check(/are not like for like/.test(s.verdict) && /Ramadan days: 11 against 0/.test(s.verdict), `B1 February 2026: the verdict (got ${s.verdict})`);
    const ram = s.rows.find((r) => /^Ramadan days/.test(r[0]));
    check(ram && ram[1] === '11' && ram[2] === '0', `B1 the Ramadan row 11 | 0 (got ${JSON.stringify(ram)})`);
    check(/Ramadan 1447/.test(s.dates) && /18 February 2026/.test(s.dates) && /announced/.test(s.dates), `B1 the dates used: Ramadan 1447, 18 February 2026, announced (got ${s.dates.slice(0, 200)})`);
    check(s.over.length === 12 && s.over.filter((o) => /not like for like/.test(o.text)).length === 5 && s.over.find((o) => o.month === '2').on, `B8 the 2026 overview: 12 months, 5 not like for like, February marked (got ${s.over.map((o) => o.text).join(' / ').slice(0, 300)})`);
    await pick(2026, 8, 'uae'); s = await view();
    check(/are like for like on the Gulf calendar/.test(s.verdict), `B2 August 2026: like for like (got ${s.verdict})`);
    await pick(2031, 3, 'uae'); s = await view();
    check(/not known/i.test(s.verdict) && !s.tableShown && !/\d+ against \d+/.test(s.verdict), `B3 2031: not known, no table (got ${s.verdict})`);
    await pick(2027, 2, 'uae'); s = await view();
    check(/moon is sighted/.test(s.note) && /estimate/.test(s.dates), `B4 February 2027: the estimate said (note ${s.note.slice(0, 120)}; dates ${s.dates.slice(0, 120)})`);
    await pick(2026, 2, 'omn'); s = await view();
    check(/Ramadan days: 10 against 0/.test(s.verdict), `B5 Oman: 10 Ramadan days (got ${s.verdict})`);
    await pick(2020, 7, 'ksa'); s = await view();
    check(/15% against 5%/.test(s.verdict) && s.rows.some((r) => /VAT/.test(r[0]) && r[1] === '15%' && r[2] === '5%'), `B5 Saudi Arabia July 2020: VAT 15% against 5% (got ${s.verdict})`);
    await pick(2026, 1, 'uae');
    await v.pg.click('#lfYearRows tr[data-month="3"]'); s = await view();
    check(/Ramadan days: 19 against 29/.test(s.verdict) && (await v.pg.$eval('#lfMonth', (e) => e.value)) === '3', `B9 a click on March in the overview selects it (got ${s.verdict})`);
    check(asked.length === 0, `B6 no request after the page loaded (got ${asked.slice(0, 3).join(', ')})`);
    check((await store()) === before, 'B7 nothing stored (localStorage and sessionStorage unchanged by the tool)');
    check(!v.errs.length, `B no page error: ${v.errs.slice(0, 3).join(' | ')}`);
  } finally { await v.ctx.close(); }

  // P1 at 390 px
  for (const lang of ['en', 'ar']) {
    const p = await visitor(browser, { viewport: [390, 844] });
    try {
      if (lang === 'ar') await p.ctx.addInitScript(() => { try { localStorage.setItem('dataarcus-lang', 'ar'); } catch (e) { /* ignore */ } });
      await p.pg.goto(`${url}${PAGE}`, { waitUntil: 'networkidle' });
      await ready(p.pg);
      await p.pg.selectOption('#lfYear', '2026'); await p.pg.selectOption('#lfMonth', '3');
      const m = await p.pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth, dir: getComputedStyle(document.querySelector('#lfTool')).direction,
        wide: [...document.querySelectorAll('main *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(e).overflowX !== 'auto' && !e.closest('.lf-scroll')).map((e) => e.tagName + '.' + e.className).slice(0, 3) }));
      check(m.sw <= m.w && !m.wide.length, `P1 ${lang} at 390 px: no sideways scroll (scrollWidth ${m.sw}, width ${m.w}; ${m.wide.join(', ')})`);
      check(m.dir === 'ltr', `P1 ${lang}: the tool reads left to right (got ${m.dir})`);
      check(!p.errs.length, `P1 ${lang}: no page error: ${p.errs.slice(0, 3).join(' | ')}`);
    } finally { await p.ctx.close(); }
  }

  // L1: the clock set to a month (the page opens on the visitor's month), layout shift over the first 2.5 s
  for (const [y, m] of [[2027, 3], [2027, 2], [2026, 11]]) for (const w of [1440, 992]) {
    const c = await visitor(browser, { viewport: [w, 900] });
    try {
      await c.pg.clock.setFixedTime(new Date(Date.UTC(y, m - 1, 15, 12)));
      await c.ctx.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
      await c.pg.goto(`${url}${PAGE}?lang=en`, { waitUntil: 'load' }); await c.pg.waitForTimeout(2500);
      const r = await c.pg.evaluate(() => ({ cls: +window.__cls.toFixed(3), month: document.querySelector('#lfMonth').value }));
      check(r.month === String(m) && r.cls <= 0.1, `L1 ${y}-${m} at ${w} px: layout shift ${r.cls} on load (want 0.1 or less; the page opened on month ${r.month})`);
    } finally { await c.ctx.close(); }
  }
  {
    const c = await visitor(browser, { viewport: [1440, 900] });
    try {
      await c.pg.goto(`${url}${PAGE}?lang=en`, { waitUntil: 'load' }); await ready(c.pg);
      await c.pg.selectOption('#lfYear', '2031');
      const shown = await c.pg.evaluate(() => document.querySelector('#lfDetail').getClientRects().length);
      check(shown === 0, 'L1 a month not known: the empty result box (#lfDetail) is not shown');
    } finally { await c.ctx.close(); }
  }

  // A1: Arabic asked for on a held page, by the address or by the saved choice
  const guarded = (f) => /classList\.add\("i18n-pending"\)/.test(read(f));
  check(!guarded(FILE), `A1 ${FILE} (held) carries no Arabic head guard`);
  for (const [how, vp] of [['?lang=ar', [390, 844]], ['?lang=ar', [1440, 900]], ['saved', [390, 844]], ['saved', [1440, 900]]]) {
    const a = await visitor(browser, { viewport: vp });
    try {
      if (how === 'saved') await a.ctx.addInitScript(() => { try { if (!sessionStorage.getItem('__a1')) { sessionStorage.setItem('__a1', '1'); localStorage.setItem('dataarcus-lang', 'ar'); } } catch (e) { /* ignore */ } });
      await a.ctx.addInitScript(() => { window.__hidden = false; new MutationObserver(() => { if (document.documentElement.classList.contains('i18n-pending') || document.documentElement.dir === 'rtl') window.__hidden = true; }).observe(document, { attributes: true, subtree: true, attributeFilter: ['class', 'dir'] }); });
      await a.pg.goto(`${url}${PAGE}${how === 'saved' ? '' : how}`, { waitUntil: 'networkidle' });
      await ready(a.pg);
      const r = await a.pg.evaluate(() => { const d = document.documentElement, cs = (s) => getComputedStyle(document.querySelector(s));
        return { lang: d.lang, dir: d.dir || 'ltr', flipped: window.__hidden, rtl: document.body.classList.contains('rtl'), font: !!document.getElementById('ar-font'), lm: window.langManager && window.langManager.currentLang,
          sw: document.querySelectorAll('.language-switcher-container, .desktop-lang-switcher').length, nav: cs('.navbar').direction, foot: cs('footer').direction,
          tag: (document.querySelector('[data-i18n="footer.tagline"]') || {}).textContent, saved: localStorage.getItem('dataarcus-lang'), sw2: document.documentElement.scrollWidth, w: innerWidth }; });
      const tag = `A1 ${how} at ${vp[0]} px`;
      check(r.lang === 'en' && r.dir === 'ltr' && !r.flipped && !r.rtl && !r.font && r.lm === 'en', `${tag}: the page stays English, left to right, never hidden or flipped (got ${JSON.stringify(r)})`);
      check(r.nav === 'ltr' && r.foot === 'ltr' && /^Custom-built Power BI/.test(r.tag || ''), `${tag}: the menu and the footer read left to right, in English (got ${r.nav} ${r.foot} "${(r.tag || '').slice(0, 30)}")`);
      check(r.sw === 0, `${tag}: no language switch on a page with no Arabic (got ${r.sw})`);
      check(r.saved === (how === 'saved' ? 'ar' : null), `${tag}: the saved choice is left as it was (got ${r.saved})`);
      check(r.sw2 <= r.w && !a.errs.length, `${tag}: no sideways scroll (${r.sw2} > ${r.w}), no page error: ${a.errs.slice(0, 3).join(' | ')}`);
    } finally { await a.ctx.close(); }
  }
  {
    const { pages } = await import('./lib.mjs');
    const LRp = require('../../assets/js/locale-routes.js');
    const missing = pages().filter((f) => !f.startsWith('build/') && !f.startsWith('go/') && !LRp.AR_HELD.includes('/' + f) && /lang-manager\.min\.js/.test(read(f)) && !guarded(f));
    check(!missing.length, `A1 every other page that loads lang-manager carries the Arabic head guard (missing: ${missing.slice(0, 5).join(', ')})`);
  }

  // A2: the hub in Arabic in place and in English
  for (const [lang, vp] of [['ar', [390, 844]], ['ar', [1440, 900]], ['en', [1440, 900]]]) {
    const h = await visitor(browser, { viewport: vp });
    try {
      await h.pg.goto(`${url}/tools/?lang=${lang}`, { waitUntil: 'networkidle' }); await ready(h.pg);
      const r = await h.pg.evaluate(() => ({ held: [...document.querySelectorAll('[data-ar-held]')].filter((e) => e.getClientRects().length).length, cards: [...document.querySelectorAll('a.th-card')].filter((e) => e.getClientRects().length).length, sw: document.documentElement.scrollWidth, w: innerWidth }));
      check(lang === 'ar' ? r.held === 0 : r.held === 1, `A2 /tools/?lang=${lang} at ${vp[0]} px: the held page's card is ${lang === 'ar' ? 'hidden' : 'shown'} (shown: ${r.held}; cards shown ${r.cards})`);
      check(r.sw <= r.w && !h.errs.length, `A2 /tools/?lang=${lang} at ${vp[0]} px: no sideways scroll, no page error: ${h.errs.slice(0, 3).join(' | ')}`);
    } finally { await h.ctx.close(); }
  }

  // A3: the Arabic hub's ItemList against its cards
  {
    const ld = [...arHub.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch (e) { return null; } }).find((j) => j && j['@type'] === 'ItemList');
    const cards = [...arHub.replace(/<script\b[\s\S]*?<\/script>/gi, '').matchAll(/<a class="th-card" href="([^"]+)"/g)].map((m) => m[1].replace(/^.*\//, ''));
    const items = ld ? ld.itemListElement : [];
    const named = items.map((i) => i.url.replace(/^.*\//, ''));
    check(ld && JSON.stringify(named.slice().sort()) === JSON.stringify(cards.slice().sort()) && items.every((i, k) => i.position === k + 1), `A3 /ar/tools/: the ItemList names the ${cards.length} tools shown, positions 1..${cards.length} (got ${named.length}: ${named.join(', ')})`);
  }
  return { checks, problems };
}
