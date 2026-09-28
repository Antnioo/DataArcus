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
  // the name the page gives the download (read from the link: this test browser may rename non-Latin file names)
  const fileName = (pg, btn) => pg.evaluate((btn) => {
    let name = null; const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { name = this.download; };
    try { document.querySelector(btn).click(); } finally { HTMLAnchorElement.prototype.click = click; }
    return name;
  }, btn);
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

  // Empty name boxes: the DAX uses the default each box shows as its placeholder, never '' or [] or an invented table
  {
    const v = await open(MB);
    for (const id of ['base', 'fact', 'column', 'cal', 'dateCol']) await v.pg.fill('#' + id, '  ');
    const r = await v.pg.evaluate(() => ({ dax: document.getElementById('script').textContent, tmdl: document.getElementById('tmdl').textContent,
      ph: ['base', 'fact', 'column', 'cal', 'dateCol', 'existing', 'home'].map((id) => document.getElementById(id).placeholder) }));
    check(!/''\[|\[\]|'Measures'/.test(r.dax), `measure builder: empty names give ${(r.dax.match(/.*(''\[|\[\]|'Measures').*/) || [''])[0].trim()}`);
    check(/MEASURE 'Sales'\[Total Sales\] =\n\s+SUM \( 'Sales'\[Amount\] \)/.test(r.dax) && /DATESMTD \( 'Calendar'\[Date\] \)/.test(r.dax) && /ref table Sales\n/.test(r.tmdl),
      'measure builder: empty names do not fall back to the defaults');
    check(r.ph.join() === 'Total Sales,Sales,Amount,Calendar,Date,Total Sales,Sales', `measure builder: placeholders ${r.ph.join()}`);
    await done(v, 'measure builder empty names');
  }

  // Arabic names: kept in the calendar's table name and in both download file names
  {
    const v = await open(MB);
    await v.pg.fill('#base', 'المبيعات');
    { const f = await fileName(v.pg, '#dlBtn'); check(f === 'المبيعات-measures.dax', `measure builder: an Arabic measure name gives the file name ${f}`); }
    await done(v, 'measure builder Arabic name');
    const c = await open(CG);
    await c.pg.fill('#cgName', 'تقويم');
    check((await c.pg.$eval('#dax', (e) => e.textContent)).startsWith('تقويم =\n'), 'calendar: an Arabic table name becomes Calendar');
    check(await fileName(c.pg, '#dlBtn') === 'تقويم-table.dax', 'calendar: an Arabic table name is dropped from the file name');
    await done(c, 'calendar Arabic name');
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
