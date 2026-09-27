// Cookie banner and analytics (Europe-only banner; see main.js section 9 and the consent loader in each <head>).
import { visitor } from './lib.mjs';

const state = (pg) => pg.evaluate(() => ({ banner: !!document.querySelector('.cc-bar'), stored: localStorage.getItem('dataarcus-consent'), cookies: document.cookie }));

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const first = (tz) => visitor(browser, { timezone: tz, consent: null });

  // Outside Europe: no banner, analytics load
  let v = await first('Asia/Dubai');
  await v.pg.goto(`${url}/?lang=en`, { waitUntil: 'networkidle' });
  let s = await state(v.pg);
  check(!s.banner, 'Dubai: banner shown (should be Europe only)');
  check(v.hits.length > 0, 'Dubai: analytics did not load');
  // the privacy page button still lets them turn it off
  await v.pg.goto(`${url}/privacy.html?lang=ar`, { waitUntil: 'networkidle' });
  await v.pg.evaluate(() => { document.cookie = '_ga=GA1.1.123; path=/'; });
  await v.pg.click('[data-cc-open]');
  check((await state(v.pg)).banner, 'Dubai: Cookie settings button does not open the banner');
  const ar = await v.pg.evaluate(() => document.querySelector('.cc-bar [data-cc=reject]')?.innerText);
  check(ar === 'رفض', `Dubai: banner not in Arabic on the Arabic page (${ar})`);
  await v.pg.click('[data-cc="reject"]');
  s = await state(v.pg);
  check(s.stored === 'denied' && !/_ga=/.test(s.cookies), `Dubai: Reject did not clear analytics (${s.stored}, ${s.cookies})`);
  v.hits.length = 0;
  await v.pg.goto(`${url}/tools/index.html?lang=en`, { waitUntil: 'networkidle' });
  check(v.hits.length === 0, 'Dubai: analytics still load after Reject');
  if (v.errs.length) problems.push('Dubai: ' + v.errs.join(' | '));
  await v.ctx.close();

  // Europe: banner, nothing before Accept
  v = await first('Europe/Berlin');
  await v.pg.goto(`${url}/?lang=en`, { waitUntil: 'networkidle' });
  s = await state(v.pg);
  check(s.banner, 'Berlin: no banner');
  check(v.hits.length === 0, 'Berlin: analytics loaded before consent');
  await v.pg.click('[data-cc="accept"]'); await v.pg.waitForTimeout(300);
  check(v.hits.length > 0, 'Berlin: Accept did not load analytics');
  await v.pg.goto(`${url}/portfolio.html`, { waitUntil: 'networkidle' });
  check(!(await state(v.pg)).banner, 'Berlin: banner back after Accept');
  await v.ctx.close();

  // Europe, Reject: never tracked, tools still work
  v = await first('Europe/London');
  await v.pg.goto(`${url}/`, { waitUntil: 'networkidle' });
  await v.pg.click('[data-cc="reject"]');
  await v.pg.goto(`${url}/tools/power-bi-theme-generator.html?lang=en`, { waitUntil: 'networkidle' });
  await v.pg.click('#exampleBtn'); await v.pg.waitForTimeout(300);
  check(v.hits.length === 0, 'London: analytics loaded after Reject');
  if (v.errs.length) problems.push('London: ' + v.errs.join(' | '));
  await v.ctx.close();

  // Phone: the banner and the WhatsApp button do not overlap
  for (const lang of ['en', 'ar']) {
    v = await visitor(browser, { viewport: [390, 844], timezone: 'Europe/Paris', consent: null });
    await v.pg.goto(`${url}/?lang=${lang}`, { waitUntil: 'networkidle' }); await v.pg.waitForTimeout(300);
    const overlap = await v.pg.evaluate(() => { const a = document.querySelector('.cc-bar')?.getBoundingClientRect(), w = document.querySelector('.wa-float')?.getBoundingClientRect();
      return a && w ? !(w.bottom <= a.top || w.top >= a.bottom || w.right <= a.left || w.left >= a.right) : null; });
    check(overlap === false, `phone ${lang}: banner and WhatsApp button overlap (${overlap})`);
    await v.ctx.close();
  }
  return { checks, problems };
}
