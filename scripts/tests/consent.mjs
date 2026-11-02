// Cookie banner and analytics (Europe-only banner; see main.js section 9 and the consent loader in each <head>).
// (round 16: every page is read after ready() from lib.mjs, as anchors.mjs does: "the network is quiet" was not enough
// under load once, "Berlin: no banner")
import { visitor, ready } from './lib.mjs';

const state = (pg) => pg.evaluate(() => ({ banner: !!document.querySelector('.cc-bar'), stored: localStorage.getItem('dataarcus-consent'), cookies: document.cookie }));

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const first = (tz) => visitor(browser, { timezone: tz, consent: null });

  // Outside Europe: no banner, analytics load
  let v = await first('Asia/Dubai');
  await v.pg.goto(`${url}/?lang=en`, { waitUntil: 'networkidle' }); await ready(v.pg);
  let s = await state(v.pg);
  check(!s.banner, 'Dubai: banner shown (should be Europe only)');
  check(v.hits.length > 0, 'Dubai: analytics did not load');
  // the privacy page button still lets them turn it off
  await v.pg.goto(`${url}/privacy.html?lang=ar`, { waitUntil: 'networkidle' }); await ready(v.pg);
  await v.pg.evaluate(() => { document.cookie = '_ga=GA1.1.123; path=/'; });
  await v.pg.click('[data-cc-open]');
  check((await state(v.pg)).banner, 'Dubai: Cookie settings button does not open the banner');
  const ar = await v.pg.evaluate(() => document.querySelector('.cc-bar [data-cc=reject]')?.innerText);
  check(ar === 'رفض', `Dubai: banner not in Arabic on the Arabic page (${ar})`);
  await v.pg.click('[data-cc="reject"]');
  s = await state(v.pg);
  check(s.stored === 'denied' && !/_ga=/.test(s.cookies), `Dubai: Reject did not clear analytics (${s.stored}, ${s.cookies})`);
  v.hits.length = 0;
  await v.pg.goto(`${url}/tools/index.html?lang=en`, { waitUntil: 'networkidle' }); await ready(v.pg);
  check(v.hits.length === 0, 'Dubai: analytics still load after Reject');
  if (v.errs.length) problems.push('Dubai: ' + v.errs.join(' | '));
  await v.ctx.close();

  // Europe: banner, nothing before Accept
  v = await first('Europe/Berlin');
  await v.pg.goto(`${url}/?lang=en`, { waitUntil: 'networkidle' }); await ready(v.pg);
  s = await state(v.pg);
  check(s.banner, 'Berlin: no banner');
  check(v.hits.length === 0, 'Berlin: analytics loaded before consent');
  await v.pg.click('[data-cc="accept"]'); await v.pg.waitForTimeout(300);
  check(v.hits.length > 0, 'Berlin: Accept did not load analytics');
  await v.pg.goto(`${url}/portfolio.html`, { waitUntil: 'networkidle' }); await ready(v.pg);
  check(!(await state(v.pg)).banner, 'Berlin: banner back after Accept');
  await v.ctx.close();

  // Europe, Reject: never tracked, tools still work
  v = await first('Europe/London');
  await v.pg.goto(`${url}/`, { waitUntil: 'networkidle' }); await ready(v.pg);
  await v.pg.click('[data-cc="reject"]');
  await v.pg.goto(`${url}/tools/power-bi-theme-generator.html?lang=en`, { waitUntil: 'networkidle' }); await ready(v.pg);
  await v.pg.click('#exampleBtn'); await v.pg.waitForTimeout(300);
  check(v.hits.length === 0, 'London: analytics loaded after Reject');
  if (v.errs.length) problems.push('London: ' + v.errs.join(' | '));
  await v.ctx.close();

  // Phone: the banner and the WhatsApp button do not overlap
  for (const lang of ['en', 'ar']) {
    v = await visitor(browser, { viewport: [390, 844], timezone: 'Europe/Paris', consent: null });
    await v.pg.goto(`${url}/?lang=${lang}`, { waitUntil: 'networkidle' }); await ready(v.pg); await v.pg.waitForTimeout(300);
    const overlap = await v.pg.evaluate(() => { const a = document.querySelector('.cc-bar')?.getBoundingClientRect(), w = document.querySelector('.wa-float')?.getBoundingClientRect();
      return a && w ? !(w.bottom <= a.top || w.top >= a.bottom || w.right <= a.left || w.left >= a.right) : null; });
    check(overlap === false, `phone ${lang}: banner and WhatsApp button overlap (${overlap})`);
    await v.ctx.close();
  }

  // EU/EEA time zones outside Europe/* (audit AUD-021, 2026-10-04): Cyprus, Spain's Ceuta and Melilla, France's
  // outermost regions, Svalbard; each gets the banner and no analytics before Accept. Others still don't.
  const EU_OUTSIDE = ['Asia/Nicosia', 'Asia/Famagusta', 'Africa/Ceuta', 'America/Guadeloupe', 'America/Martinique', 'America/Cayenne', 'America/Marigot',
    'Indian/Reunion', 'Indian/Mayotte', 'Arctic/Longyearbyen', 'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores', 'Atlantic/Reykjavik'];
  for (const tz of [...EU_OUTSIDE, 'Asia/Riyadh', 'America/New_York', 'Africa/Cairo', 'Asia/Karachi']) {
    v = await first(tz);
    await v.pg.goto(`${url}/?lang=en`, { waitUntil: 'networkidle' }); await ready(v.pg);
    const r = { banner: (await state(v.pg)).banner, eu: await v.pg.evaluate(() => window.daConsent.eu), hits: v.hits.length };
    const want = EU_OUTSIDE.includes(tz);
    check(r.banner === want && r.eu === want && (want ? r.hits === 0 : r.hits > 0), `${tz}: ${JSON.stringify(r)} (want ${want ? 'the banner and no analytics' : 'no banner'})`);
    await v.ctx.close();
  }

  // Microsoft Clarity records pages as they look (audit AUD-022, 2026-10-04): on the tools, everything the visitor
  // types or drops in and everything the tool writes back sits inside data-clarity-mask="true", so recordings show
  // it masked; FAQ, headings and calls to action stay readable. The SVG KPI Designer puts the design in the address
  // (#d=), which masking can't hide, so that page never loads Clarity.
  const MASKED = [['power-bi-model-health-check', async (pg) => { await pg.click('#mhSample'); await pg.waitForSelector('#mhTab', { timeout: 20000 }); }, ['#mhApp']],
    ['dax-measure-builder', null, []], ['dax-calendar-table-generator', null, ['#dax', '#preview', '#ramadan', '#stats']],
    ['power-bi-theme-generator', null, ['#json', '#layCanvas', '#slotTable', '#preview']], ['power-bi-theme-generator-lab', null, ['#json', '#layCanvas', '#slotTable', '#preview']],
    ['power-bi-licensing-cost-calculator', null, []]];
  for (const [name, run, ids] of MASKED) {
    v = await visitor(browser, { viewport: [1440, 900] });
    await v.pg.goto(`${url}/tools/${name}.html?lang=en`, { waitUntil: 'networkidle' }); await ready(v.pg);
    if (run) await run(v.pg);
    const open = await v.pg.evaluate((ids) => {
      const masked = (e) => !!e.closest('[data-clarity-mask="true"]'), main = document.querySelector('main');
      const what = (e) => e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : '');
      const fields = [...main.querySelectorAll('input:not([type=hidden]), textarea, select, pre, code, table, output, svg')]
        .filter((e) => !e.closest('.tg-faq, .tg-cta, header'));
      const results = ids.map((id) => document.querySelector(id)).filter(Boolean);
      return [...new Set([...fields, ...results].filter((e) => !masked(e)).map(what))];
    }, ids);
    check(!open.length, `${name}: not masked from Clarity: ${open.slice(0, 8).join(', ')}${open.length > 8 ? ` and ${open.length - 8} more` : ''}`);
    if (v.errs.length) problems.push(`${name}: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }
  v = await visitor(browser, { timezone: 'Asia/Dubai', consent: 'granted' });
  await v.pg.goto(`${url}/tools/svg-kpi-designer.html?lang=en`, { waitUntil: 'networkidle' }); await ready(v.pg);
  const kd = { clarity: v.hits.filter((h) => /clarity/.test(h)).length, google: v.hits.filter((h) => /google/.test(h)).length, fn: await v.pg.evaluate(() => typeof window.clarity) };
  check(kd.clarity === 0 && kd.fn === 'undefined' && kd.google > 0, `SVG KPI Designer: Clarity must not load there (Google Analytics still does): ${JSON.stringify(kd)}`);
  await v.ctx.close();
  return { checks, problems };
}
