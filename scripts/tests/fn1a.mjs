// 0.3.2 FN1A (runRules, create and mount into named steps; mcp/work/FN1A.md): two parts of the pages that no website
// suite turned red when broken on the base (e56b070), pinned as they behave today.
//   D1 the Model Health Check's Documentation tab (health-view.js docsTab): each download button sends its analytics
//      event, in the order clicked (html, md, csv)
//   O1 the DP-600 practice exam (exam-view.js outline): the weekly outline file, coming after the home screen is drawn,
//      draws the home screen again with the weights it gives (a made-up weight, served for this check only)
import { visitor } from './lib.mjs';

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };

  // D1
  {
    const v = await visitor(browser, { viewport: [1440, 900], downloads: true });
    await v.ctx.addInitScript(() => {
      window.__ev = []; let theirs = null;
      Object.defineProperty(window, 'dataArcusTrack', { configurable: true,
        get: () => (name, params) => { window.__ev.push([name, params || {}]); if (theirs) try { theirs(name, params); } catch (e) { /* ignore */ } },
        set: (f) => { theirs = f; } });
    });
    await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=en`, { waitUntil: 'networkidle' });
    await v.pg.click('#mhSample');
    await v.pg.waitForSelector('#mhTab', { timeout: 30000 });
    await v.pg.click('[data-tab="docs"]');
    await v.pg.waitForSelector('[data-doc="csv"]');
    for (const k of ['html', 'md', 'csv']) await v.pg.evaluate((s) => document.querySelector(s).click(), `[data-doc="${k}"]`);
    const ev = await v.pg.evaluate(() => window.__ev.filter((e) => e[0] === 'mh_download').map((e) => e[1].kind));
    check(ev.join(' ') === 'html md csv' && !v.errs.length, `D1 the Documentation tab's buttons must send mh_download html, md, csv: got "${ev.join(' ')}" ${v.errs.join(' | ')}`.trim());
    await v.ctx.close();
  }

  // O1
  {
    const v = await visitor(browser, { viewport: [1440, 900] });
    const W = '41–44%';
    await v.ctx.route(/\/assets\/data\/dp600-outline\.json/, async (rt) => {
      const r = await rt.fetch(), d = await r.json();
      (d.domains || []).forEach((x) => { if (/^prepare data$/i.test(x.name)) x.w = W; });
      await new Promise((ok) => setTimeout(ok, 1500)); // after the home screen is drawn
      await rt.fulfill({ response: r, body: JSON.stringify(d) });
    });
    await v.pg.goto(`${url}/tools/dp-600-practice-exam.html?lang=en`, { waitUntil: 'domcontentloaded' });
    await v.pg.waitForSelector('#dpApp .dp-domrow');
    const before = await v.pg.evaluate(() => document.getElementById('dpApp').textContent);
    await v.pg.waitForFunction(() => document.getElementById('dpOutline').textContent.trim().length > 0, null, { timeout: 15000 });
    await v.pg.waitForTimeout(100);
    const after = await v.pg.evaluate(() => document.getElementById('dpApp').textContent);
    check(!before.includes(W) && after.includes(W) && !v.errs.length, `O1 the home screen must show the outline's weight ${W} once the file has come (before: ${before.includes(W)}, after: ${after.includes(W)}) ${v.errs.join(' | ')}`.trim());
    await v.ctx.close();
  }
  return { checks, problems };
}
