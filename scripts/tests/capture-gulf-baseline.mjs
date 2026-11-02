// Captures what the Calendar Generator and the Measure Builder write today, for the gulf-calendar suite's
// "unchanged when the new options are off" checks. Run once, on main, before the Gulf Calendar options were added:
//   node scripts/tests/capture-gulf-baseline.mjs
// Never re-run it to make a failing check pass: a difference means the default output changed.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, launch, visitor } from './lib.mjs';

export const CG_CONFIGS = [
  {}, { hijri: false }, { lang: 'ar' }, { weekend: 'fri-sat', week: 'sat', fy: 4 }, { weekend: 'fri', fiscal: false, relative: false },
  { weekend: 'sun', week: 'mon', start: '2018-01-01', end: '2030-12-31' }, { start: '2030-06-01', end: '2031-02-01' }, { start: '2017-12-25', end: '2018-07-01' }
];
const ALL_IDS = ['mtd', 'qtd', 'ytd', 'py', 'yoy', 'yoyPct', 'pytd', 'ytdPct', 'pm', 'momPct', 'roll', 'avgDays', 'running', 'share', 'ramLY', 'ramPct'];
export const MB_CONFIGS = [{}, { pick: ALL_IDS }, { pick: ['ramLY', 'ramPct'], cal: 'Dates' }, { mode: 'existing', existing: 'Revenue', home: 'KPIs', pick: ALL_IDS }];

// opens a page with these saved settings and returns what it shows
export async function read(browser, url, page, store, saved, lang = 'en') {
  const v = await visitor(browser, { viewport: [1440, 900] });
  await v.ctx.addInitScript(([k, s]) => { try { localStorage.setItem(k, s); } catch (e) { /* ignore */ } }, [store, JSON.stringify(saved)]);
  await v.pg.goto(`${url}${page}?lang=${lang}`, { waitUntil: 'networkidle' });
  const out = await v.pg.evaluate((ids) => Object.fromEntries(ids.map((id) => { const e = document.getElementById(id); return [id, e ? (e.tagName === 'PRE' || id === 'dax' || id === 'script' || id === 'tmdl' ? e.textContent : e.innerHTML) : null]; })),
    page.includes('calendar') ? ['dax', 'stats', 'preview', 'ramadan'] : ['script', 'tmdl']);
  out.errs = v.errs;
  await v.ctx.close();
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await serve(), browser = await launch();
  const cg = [], mb = [];
  for (const c of CG_CONFIGS) for (const lang of ['en', 'ar']) cg.push({ saved: c, lang, ...(await read(browser, server.url, '/tools/dax-calendar-table-generator.html', 'dataarcus-calendar-generator', c, lang)) });
  for (const c of MB_CONFIGS) mb.push({ saved: c, ...(await read(browser, server.url, '/tools/dax-measure-builder.html', 'dataarcus-measure-builder', c)) });
  await browser.close(); server.close();
  const bad = [...cg, ...mb].filter((r) => r.errs.length);
  if (bad.length) { console.error('Page errors:', bad.map((r) => r.errs).flat()); process.exit(1); }
  fs.writeFileSync(path.join(ROOT, 'scripts/tests/fixtures/gulf-calendar/baseline.json'), JSON.stringify({ captured: new Date().toISOString().slice(0, 10), cg, mb }, null, 1) + '\n');
  console.log(`Captured ${cg.length} calendar and ${mb.length} measure builder outputs.`);
}
