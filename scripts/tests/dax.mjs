// DAX tools: the measure builder and the calendar generator write DAX that is right in every filter context
// and for every input, and the pages survive odd saved settings.
import { visitor } from './lib.mjs';

const MB = '/tools/dax-measure-builder.html?lang=en', CG = '/tools/dax-calendar-table-generator.html?lang=en';
// type into the date boxes the way a visitor does (each box fires its own input event)
const setDates = (pg, start, end) => pg.evaluate(([a, b]) => [['cgStart', a], ['cgEnd', b]].forEach(([id, val]) => {
  const el = document.getElementById(id); el.value = val; el.dispatchEvent(new Event('input'));
}), [start, end]);

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const open = async (page, saved) => {
    const v = await visitor(browser, { viewport: [1440, 900] });
    if (saved) await v.ctx.addInitScript(([k, s]) => { try { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, s); sessionStorage.setItem('seeded', 1); } } catch (e) { /* ignore */ } }, saved);
    await v.pg.goto(url + page, { waitUntil: 'networkidle' });
    return v;
  };
  const done = async (v, tag) => { if (v.errs.length) problems.push(`${tag}: ${v.errs.join(' | ')}`); await v.ctx.close(); };

  // Rolling months and average days: the number used in the DAX is the number the box shows once the visitor leaves it
  {
    const v = await open(MB);
    await v.pg.click('input[value="avgDays"]');
    const M = /DATESINPERIOD \([^\n]*, -(\d+), MONTH/, D = /DATESINPERIOD \([^\n]*, -(\d+), DAY/;
    for (const [id, typed, want, re] of [['n', '999', 36, M], ['n', '-3', 1, M], ['n', '0', 1, M], ['days', '1e2', 100, D], ['days', '999', 365, D]]) {
      await v.pg.fill('#' + id, typed); await v.pg.locator('#' + id).blur();
      const r = await v.pg.evaluate((id) => ({ box: document.getElementById(id).value, dax: document.getElementById('script').textContent }), id);
      const used = +((r.dax.match(re) || [])[1]);
      check(used === want && +r.box === want, `measure builder: typed ${typed} in ${id}: DAX uses ${used}, box shows ${r.box} (want ${want})`);
    }
    await done(v, 'measure builder rolling');
  }

  // Calendar generator: a range it cannot build clears the old table, so Copy and Download cannot hand it out
  {
    const v = await open(CG);
    const before = await v.pg.$eval('#dax', (e) => e.textContent);
    await setDates(v.pg, '2024-01-01', '2023-01-01');
    const r = await v.pg.evaluate(() => ({ dax: document.getElementById('dax').textContent, stats: document.getElementById('stats').textContent,
      copy: document.getElementById('copyBtn').disabled, dl: document.getElementById('dlBtn').disabled, preview: document.getElementById('preview').textContent }));
    check(before && !r.dax && !r.stats && r.copy && r.dl, `calendar: end before start keeps the old output ${JSON.stringify({ dax: r.dax.slice(0, 40), stats: r.stats, copy: r.copy, dl: r.dl })}`);
    check(/End date must be after/.test(r.preview), 'calendar: the range message is not shown where the output was');
    await setDates(v.pg, '2024-01-01', '2024-12-31');
    const ok = await v.pg.evaluate(() => ({ dax: document.getElementById('dax').textContent, copy: document.getElementById('copyBtn').disabled }));
    check(/DATE \( 2024, 12, 31 \)/.test(ok.dax) && !ok.copy, 'calendar: a good range after a bad one does not bring the output back');
    // 1970-01-01 (timestamp 0) is a date like any other, and the 60-year limit counts leap days
    for (const [a, b, good] of [['1970-01-01', '1971-01-01', true], ['1966-01-01', '2025-12-31', true], ['1966-01-01', '2026-01-01', false]]) {
      await setDates(v.pg, a, b);
      const err = await v.pg.$eval('#err', (e) => e.textContent);
      check(!err === good, `calendar: ${a} to ${b} ${good ? 'rejected' : 'accepted'}`);
    }
    await done(v, 'calendar range');
  }

  return { checks, problems };
}
