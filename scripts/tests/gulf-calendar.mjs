// The Gulf Calendar pack: the sourced dates, the Calendar Generator's "announced dates" and country weekends, and
// the Measure Builder's Eid measures. With the new options off, both tools write exactly what they wrote before
// (fixtures/gulf-calendar/baseline.json, captured on main before the pack).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT, visitor } from './lib.mjs';
import { CG_CONFIGS, MB_CONFIGS, read } from './capture-gulf-baseline.mjs';

const require = createRequire(import.meta.url);
const G = require('../../assets/js/gulf-dates.js');
const BASE = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/tests/fixtures/gulf-calendar/baseline.json'), 'utf8'));
const CG = '/tools/dax-calendar-table-generator.html', MB = '/tools/dax-measure-builder.html';
const DAY = 864e5;
const T = (s) => Date.parse(s + 'T00:00:00Z');
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const UAQ = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' });
const uaq = (t) => { const o = {}; UAQ.formatToParts(new Date(t)).forEach((p) => { if (['day', 'month', 'year'].includes(p.type)) o[p.type] = +p.value; }); return o; };

// The weekends the sources say (scripts/gulf-calendar/DATES-SOURCES.md), written out by hand rather than read from
// gulf-dates.js, so a wrong rule in the data fails here: [date, weekday, weekend?]
const WEEKEND_CASES = {
  uae: [['2005-06-02', 'Thu', true], ['2005-06-04', 'Sat', false], ['2006-08-31', 'Thu', true], ['2006-09-01', 'Fri', true], ['2006-09-02', 'Sat', true],
    ['2006-09-07', 'Thu', false], ['2021-12-26', 'Sun', false], ['2021-12-31', 'Fri', true], ['2022-01-01', 'Sat', true], ['2022-01-02', 'Sun', true],
    ['2022-01-07', 'Fri', false], ['2026-10-03', 'Sat', true], ['2026-10-04', 'Sun', true], ['2026-10-02', 'Fri', false]],
  ksa: [['2013-06-27', 'Thu', true], ['2013-06-28', 'Fri', true], ['2013-06-29', 'Sat', true], ['2013-07-04', 'Thu', false], ['2026-10-02', 'Fri', true], ['2026-10-04', 'Sun', false]],
  omn: [['2013-04-25', 'Thu', true], ['2013-05-02', 'Thu', false], ['2013-05-04', 'Sat', true], ['2026-10-04', 'Sun', false]],
  kwt: [['2007-08-30', 'Thu', true], ['2007-09-01', 'Sat', true], ['2007-09-06', 'Thu', false], ['2026-10-03', 'Sat', true]],
  bhr: [['2006-08-31', 'Thu', true], ['2006-09-02', 'Sat', true], ['2006-09-07', 'Thu', false]],
  qat: [['2003-07-31', 'Thu', true], ['2003-08-02', 'Sat', true], ['2003-08-07', 'Thu', false], ['2026-10-03', 'Sat', true]]
};

// Runs one generated column expression of the subset the weekend columns use (IF, >=, DATE, WEEKDAY ... IN { }, NOT,
// TRUE/FALSE) for one date, by turning it into JavaScript. Anything outside that subset throws.
const daxEval = (expr, t) => {
  const js = expr.replace(/WEEKDAY \( \[Date\], 1 \) IN \{ ([\d, ]+) \}/g, '[$1].includes(W)').replace(/DATE \( (\d+), (\d+), (\d+) \)/g, 'Date.UTC($1, $2 - 1, $3)')
    .replace(/\[Date\]/g, 'D').replace(/\bNOT \(/g, '!(').replace(/\bIF \(/g, 'IF(').replace(/\bTRUE \(\)/g, 'true').replace(/\bFALSE \(\)/g, 'false');
  if (/[A-Za-z_]{2,}/.test(js.replace(/\b(IF|Date|UTC|includes|true|false)\b/g, ''))) throw new Error('not in the evaluator\'s subset: ' + js);
  // eslint-disable-next-line no-new-func
  return Function('IF', 'D', 'W', `return (${js});`)((c, a, b) => (c ? a : b), t, new Date(t).getUTCDay() + 1);
};
// a column's expression in the generated table: from `"Name", ` to the end of its line
const column = (dax, name) => { const m = dax.match(new RegExp(`\\n {8}"${name}", (.*?),?\\n`)); return m ? m[1] : null; };
// the embedded Hijri month starts: [{ t, y, m }]
const monthStarts = (dax) => [...dax.matchAll(/\{ "(\d{4}-\d{2}-\d{2})", (\d+), (\d+) \}/g)].map((m) => ({ t: T(m[1]), y: +m[2], m: +m[3] }));
// a date's Hijri year, month and day the way the generated DAX finds them (the last month start on or before it)
const hijriOf = (starts, t) => { let s = null; for (const x of starts) if (x.t <= t) s = x; return s && { y: s.y, m: s.m, d: Math.round((t - s.t) / DAY) + 1, start: s.t }; };

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const open = async (page, saved, lang = 'en') => {
    const v = await visitor(browser, { viewport: [1440, 900] });
    if (saved) await v.ctx.addInitScript(([k, s]) => { try { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, s); sessionStorage.setItem('seeded', 1); } } catch (e) { /* ignore */ } }, saved);
    await v.pg.goto(`${url}${page}?lang=${lang}`, { waitUntil: 'networkidle' });
    return v;
  };
  const done = async (v, tag) => { if (v.errs.length) problems.push(`${tag}: ${v.errs.join(' | ')}`); await v.ctx.close(); };
  const cgSaved = (o) => ['dataarcus-calendar-generator', JSON.stringify(o)];
  const dax = (v) => v.pg.$eval('#dax', (e) => e.textContent);

  // ---------- 1. The sourced dates hold together ----------
  {
    const sources = fs.readFileSync(path.join(ROOT, 'scripts/gulf-calendar/DATES-SOURCES.md'), 'utf8');
    const checked = T(G.checked);
    for (const e of G.events) {
      const est = e.estimate || [];
      for (const [k, month, day] of [['ramadan', 9, 1], ['fitr', 10, 1], ['adha', 12, 10]]) {
        if (!e[k]) continue;
        const t = T(e[k]), h = uaq(t);
        const off = Math.round((t - T(iso(t))) / DAY); // 0, keeps the dates whole days
        check(off === 0 && /^\d{4}-\d{2}-\d{2}$/.test(e[k]), `${e.hijriYear} ${k}: ${e[k]} is not a date`);
        check(t >= T('2018-01-01') && t <= T('2030-12-31'), `${e.hijriYear} ${k}: ${e[k]} outside 2018-2030`);
        // the UAQ date of the same event, and the gap to the listed date
        const uaqDate = (() => { for (let x = t - 3 * DAY; x <= t + 3 * DAY; x += DAY) { const u = uaq(x); if (u.year === e.hijriYear && u.month === month && u.day === day) return x; } return null; })();
        check(uaqDate !== null && Math.abs(uaqDate - t) <= DAY, `${e.hijriYear} ${k}: ${e[k]} is more than a day from Umm al-Qura (${uaqDate && iso(uaqDate)})`);
        if (est.includes(k)) check(uaqDate === t, `${e.hijriYear} ${k}: the estimate ${e[k]} is not Umm al-Qura's ${uaqDate && iso(uaqDate)}`);
        // dates after the last check are estimates, and only those
        const monthStart = k === 'adha' ? t - 9 * DAY : t;
        check(est.includes(k) === monthStart > checked, `${e.hijriYear} ${k}: marked ${est.includes(k) ? 'estimate' : 'announced'} but its month starts ${monthStart > checked ? 'after' : 'on or before'} the last check ${G.checked}`);
        void h;
      }
      if (e.fitr) check([29, 30].includes((T(e.fitr) - T(e.ramadan)) / DAY), `${e.hijriYear}: Ramadan lasts ${(T(e.fitr) - T(e.ramadan)) / DAY} days`);
      if (e.adha) check([67, 68, 69].includes((T(e.adha) - T(e.fitr)) / DAY), `${e.hijriYear}: Eid al-Adha ${(T(e.adha) - T(e.fitr)) / DAY} days after Eid al-Fitr`);
      check(new RegExp(`\\| ${e.hijriYear} \\| \\w{3} ${e.ramadan} \\|`).test(sources), `${e.hijriYear}: Ramadan ${e.ramadan} is not in DATES-SOURCES.md`);
      if (e.fitr) check(sources.includes(`${e.fitr} |`) && sources.includes(`${e.adha} |`), `${e.hijriYear}: the Eids are not in DATES-SOURCES.md`);
    }
    // every Gregorian year 2018-2030 has its Ramadan, and only 2018 differs from Umm al-Qura
    for (let y = 2018; y <= 2030; y++) check(G.events.some((e) => e.ramadan.startsWith(String(y))), `no Ramadan listed for ${y}`);
    const differs = G.events.filter((e) => { const u = uaq(T(e.ramadan)); return u.day !== 1; }).map((e) => e.hijriYear);
    check(differs.join() === '1439', `Ramadan differs from Umm al-Qura in ${differs.join(', ') || 'no year'} (the sources show only 1439, 2018)`);
    // the weekday DATES-SOURCES.md prints is the date's weekday
    const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (const m of sources.matchAll(/\b(Sun|Mon|Tue|Wed|Thu|Fri|Sat) (\d{4}-\d{2}-\d{2})\b/g)) check(WD[new Date(T(m[2])).getUTCDay()] === m[1], `DATES-SOURCES.md: ${m[2]} is not a ${m[1]}`);
    for (const [c, cases] of Object.entries(WEEKEND_CASES)) for (const [d, wd] of cases) check(WD[new Date(T(d)).getUTCDay()] === wd, `weekend case ${c} ${d} is not a ${wd}`);
  }

  // ---------- 2. Nothing changes with the new options off ----------
  // (round 18, the owner's yes, 6 Oct 2026: an English calendar has one column more since, "Day Short" (Sun ... Sat)
  // after "Day Name"; the comparison with before the pack takes that line out and counts one column less, and
  // checks the line is exactly the new column)
  const SHORT = '        "Day Short", SWITCH ( WEEKDAY ( [Date], 1 ), 1, "Sun", 2, "Mon", 3, "Tue", 4, "Wed", 5, "Thu", 6, "Fri", 7, "Sat" ),\n';
  const lessShort = (k, v) => { if (typeof v !== 'string') return v; if (k === 'dax') return v.replace(SHORT, ''); if (k === 'stats' && shortIn) return v.replace(/(\d+)(?!.*\d)/, (n) => String(+n - 1)); return v; };
  let shortIn = false;
  for (const [i, c] of CG_CONFIGS.entries()) for (const lang of ['en', 'ar']) {
    const want = BASE.cg.find((b) => JSON.stringify(b.saved) === JSON.stringify(c) && b.lang === lang);
    const got = await read(browser, url, CG, 'dataarcus-calendar-generator', c, lang);
    shortIn = typeof got.dax === 'string' && got.dax.includes(SHORT);
    for (const k of ['dax', 'stats', 'preview', 'ramadan']) check(lessShort(k, got[k]) === want[k], `calendar ${JSON.stringify(c)} ${lang}: ${k} differs from before the pack`);
    if (got.errs.length) problems.push(`calendar config ${i} ${lang}: ${got.errs.join(' | ')}`);
    // an old save with the new options in their "off" state gives the same table too
    if (lang === 'en') {
      const off = await read(browser, url, CG, 'dataarcus-calendar-generator', { ...c, observed: false }, lang);
      check(lessShort('dax', off.dax) === want.dax, `calendar ${JSON.stringify(c)} with observed: false differs from before the pack`);
    }
  }
  for (const c of MB_CONFIGS) {
    const want = BASE.mb.find((b) => JSON.stringify(b.saved) === JSON.stringify(c));
    const got = await read(browser, url, MB, 'dataarcus-measure-builder', c);
    check(got.script === want.script && got.tmdl === want.tmdl, `measure builder ${JSON.stringify(c).slice(0, 80)}: output differs from before the pack`);
    if (got.errs.length) problems.push(`measure builder: ${got.errs.join(' | ')}`);
  }

  // ---------- 3. Announced Ramadan and Eid dates ----------
  {
    const v = await open(CG, cgSaved({ observed: true, start: '2018-01-01', end: '2030-12-31' }));
    const r = await v.pg.evaluate(() => ({ dax: document.getElementById('dax').textContent, chips: document.getElementById('ramadan').textContent,
      box: !!document.getElementById('cgObserved') && document.getElementById('cgObserved').checked, stats: document.getElementById('stats').textContent }));
    check(r.box, 'announced dates: the saved option is not shown checked');
    const starts = monthStarts(r.dax);
    check(starts.length > 150, `announced dates: only ${starts.length} Hijri month starts`);
    // every month is 29 or 30 days long, and the months follow each other
    for (let i = 1; i < starts.length; i++) {
      const len = (starts[i].t - starts[i - 1].t) / DAY, next = starts[i - 1].m === 12 ? { y: starts[i - 1].y + 1, m: 1 } : { y: starts[i - 1].y, m: starts[i - 1].m + 1 };
      check([29, 30].includes(len) && starts[i].y === next.y && starts[i].m === next.m, `announced dates: ${starts[i - 1].y}/${starts[i - 1].m} from ${iso(starts[i - 1].t)} lasts ${len} days, then ${starts[i].y}/${starts[i].m}`);
    }
    // the table the DAX builds puts each listed date on its Hijri day
    for (const e of G.events) {
      const at = (d) => hijriOf(starts, T(d));
      const ram = at(e.ramadan);
      check(ram && ram.y === e.hijriYear && ram.m === 9 && ram.d === 1, `announced dates: ${e.ramadan} is ${JSON.stringify(ram)} in the table, not 1 Ramadan ${e.hijriYear}`);
      const before = hijriOf(starts, T(e.ramadan) - DAY);
      check(before && before.m === 8, `announced dates: the day before ${e.ramadan} is not in Sha'ban`);
      if (e.fitr) {
        const f = at(e.fitr), last = hijriOf(starts, T(e.fitr) - DAY);
        check(f && f.y === e.hijriYear && f.m === 10 && f.d === 1, `announced dates: ${e.fitr} is ${JSON.stringify(f)}, not 1 Shawwal ${e.hijriYear}`);
        check(last && last.m === 9 && last.d === (T(e.fitr) - T(e.ramadan)) / DAY, `announced dates: Ramadan ${e.hijriYear} does not end the day before ${e.fitr}`);
      }
      if (e.adha) { const a = at(e.adha); check(a && a.y === e.hijriYear && a.m === 12 && a.d === 10, `announced dates: ${e.adha} is ${JSON.stringify(a)}, not 10 Dhu al-Hijjah ${e.hijriYear}`); }
    }
    // the columns: the flags read the moved months, and the estimates are flagged from the last checked date on
    const est = column(r.dax, 'Is Estimated Date');
    check(!!est, 'announced dates: no Is Estimated Date column');
    const cut = G.checked.split('-').map(Number);
    check(est && est.includes(`[Hijri Month Start] > DATE ( ${cut[0]}, ${cut[1]}, ${cut[2]} )`) && /\[Hijri Month Number\] = 9/.test(est) && /\[Hijri Month Number\] = 10 && \[Hijri Day\] <= 3/.test(est) && /\[Hijri Month Number\] = 12 && \[Hijri Day\] >= 10 && \[Hijri Day\] <= 13/.test(est),
      `announced dates: Is Estimated Date is ${est}`);
    check(/-- Hijri month starts: Umm al-Qura, with Ramadan, Shawwal and Dhu al-Hijjah moved to the dates the UAE announced/.test(r.dax), 'announced dates: the DAX does not say where its dates come from');
    check(/Ramadan 1439: 17 May 2018 to 14 Jun 2018/.test(r.chips), `announced dates: the Ramadan list shows ${r.chips.slice(0, 60)}`);
    check(/Ramadan 1448: 8 Feb 2027 to 8 Mar 2027 \(estimate\)/.test(r.chips), `announced dates: Ramadan 2027 is not shown as an estimate: ${(r.chips.match(/Ramadan 1448[^R]*/) || [''])[0]}`);
    check(/ · 36 columns$/.test(r.stats), `announced dates: stats ${r.stats} (34 columns before, plus Is Estimated Date and, since round 18, Day Short)`);
    // the preview shows the moved date too
    const p = await v.pg.evaluate(() => [...document.querySelectorAll('#preview tr')].map((tr) => tr.textContent));
    check(p.some((row) => /^2018-05-17Thursday1 Ramadan 1439✓/.test(row)) && p.some((row) => /^2018-05-1630 Sha'ban 1439|^2018-05-16Wednesday30 Sha'ban 1439/.test(row)),
      `announced dates: the preview shows ${p.slice(1, 5).join(' | ')}`);
    // without Hijri dates the option can't apply: it is disabled and the table is the one without Hijri columns
    await v.pg.click('#cgHijri');
    const off = await v.pg.evaluate(() => ({ dis: !!document.getElementById('cgObserved')?.disabled, dax: document.getElementById('dax').textContent }));
    check(off.dis && !/DATATABLE|Is Estimated Date/.test(off.dax), 'announced dates: still applied with Hijri dates off');
    await done(v, 'announced dates');
  }
  // the option in Arabic, and Umm al-Qura before 2018 unchanged by it
  {
    const v = await open(CG, cgSaved({ observed: true, start: '2015-01-01', end: '2017-12-31' }), 'ar');
    const r = await v.pg.evaluate(() => ({ label: document.querySelector('#cgObserved + span')?.textContent || '', dax: document.getElementById('dax').textContent }));
    check(/[؀-ۿ]/.test(r.label) && /الإمارات/.test(r.label), `announced dates in Arabic: label ${r.label}`);
    const before = await read(browser, url, CG, 'dataarcus-calendar-generator', { start: '2015-01-01', end: '2017-12-31' }, 'ar');
    check(JSON.stringify(monthStarts(r.dax)) === JSON.stringify(monthStarts(before.dax)), 'announced dates: months before 2018 moved');
    await done(v, 'announced dates Arabic');
  }

  // ---------- 4. Weekends by country, and the 2022 UAE change ----------
  for (const [c, cases] of Object.entries(WEEKEND_CASES)) {
    const v = await open(CG, cgSaved({ weekend: c, start: '2003-01-01', end: '2027-12-31', hijri: false }));
    const d = await dax(v);
    const we = column(d, 'Is Weekend'), wd = column(d, 'Is Working Day');
    check(we && wd, `${c} weekend: no Is Weekend or Is Working Day column`);
    if (we && wd) for (const [date, , want] of cases) {
      let got, work;
      try { got = daxEval(we, T(date)); work = daxEval(wd, T(date)); } catch (e) { problems.push(`${c} weekend: ${e.message}`); break; }
      check(got === want && work === !want, `${c} weekend: ${date} is ${got ? '' : 'not '}a weekend day (want ${want ? '' : 'not '}), working day ${work}`);
    }
    const flag = column(d, 'Is After UAE Weekend Change');
    if (c === 'uae') {
      check(!!flag, 'uae weekend: no Is After UAE Weekend Change column');
      if (flag) for (const [date, want] of [['2021-12-31', false], ['2022-01-01', true], ['2030-01-01', true], ['2006-01-01', false]]) check(daxEval(flag, T(date)) === want, `UAE change flag on ${date}: want ${want}`);
    } else check(!flag, `${c} weekend: has the UAE change column`);
    check(new RegExp(`· weekend ${c}\\b`).test(d), `${c} weekend: the DAX header does not name the weekend`);
    check(await v.pg.$eval('#cgWeekend', (e) => e.value) === c, `${c} weekend: the saved weekend is not selected`);
    await done(v, `${c} weekend`);
  }
  // the preview's Weekend column follows the date's rule (the UAE across the change)
  {
    const v = await open(CG, cgSaved({ weekend: 'uae', start: '2021-12-29', end: '2022-01-31', hijri: false }));
    const rows = await v.pg.evaluate(() => [...document.querySelectorAll('#preview tr')].slice(1).map((tr) => [tr.cells[0].textContent, tr.cells[tr.cells.length - 1].textContent === '✓']));
    const want = [['2021-12-29', false], ['2021-12-30', false], ['2021-12-31', true], ['2022-01-01', true], ['2022-01-02', true], ['2022-01-03', false], ['2022-01-04', false]];
    check(JSON.stringify(rows) === JSON.stringify(want), `uae preview weekends: ${JSON.stringify(rows)}`);
    // every country is in the list, with its name in both languages
    const opts = await v.pg.$$eval('#cgWeekend option', (os) => os.map((o) => o.value));
    check(['uae', 'ksa', 'kwt', 'qat', 'bhr', 'omn'].every((c) => opts.includes(c)), `weekend list: ${opts.join(', ')}`);
    // the quick setups are unchanged: UAE still picks the fixed Saturday-Sunday weekend
    await v.pg.click('[data-quick="uae"]');
    check(await v.pg.$eval('#cgWeekend', (e) => e.value) === 'sat-sun', 'quick setup UAE no longer picks Saturday + Sunday');
    await done(v, 'uae preview');
    const a = await open(CG, cgSaved({ weekend: 'ksa' }), 'ar');
    const names = await a.pg.$$eval('#cgWeekend option', (os) => os.map((o) => o.textContent));
    check(names.filter((n) => /[؀-ۿ]/.test(n)).length === names.length, `weekend list in Arabic: ${names.join(' | ')}`);
    await done(a, 'weekend list Arabic');
  }
  // odd saved values for the new settings are ignored
  for (const bad of [{ observed: 'yes' }, { observed: 1 }, { weekend: 'uae ' }, { weekend: 'hasOwnProperty' }]) {
    const v = await open(CG, cgSaved(bad));
    const d = await dax(v);
    check(lessShort('dax', d) === BASE.cg[0].dax, `calendar saved ${JSON.stringify(bad)}: the table is not the default one`);
    await done(v, `calendar saved ${JSON.stringify(bad)}`);
  }

  // ---------- 5. Eid window measures in the Measure Builder ----------
  {
    const mbSaved = (o) => ['dataarcus-measure-builder', JSON.stringify(o)];
    const v = await open(MB, mbSaved({ pick: ['eidFitrPct', 'eidAdhaPct'] }));
    const r = await v.pg.evaluate(() => ({ script: document.getElementById('script').textContent, tmdl: document.getElementById('tmdl').textContent,
      groups: [...document.querySelectorAll('#patterns .mb-group .tg-label')].map((e) => e.textContent), note: getComputedStyle(document.getElementById('ramNote')).display }));
    const m = (name) => (r.script.match(new RegExp(`MEASURE 'Sales'\\[Total Sales ${name.replace(/[%]/g, '\\$&')}\\] =\\n([\\s\\S]*?)(?=\\n\\n|\\n\\nEVALUATE)`)) || [])[1] || '';
    // the % measures bring in the window and last year's window they divide
    for (const e of ['Eid al-Fitr', 'Eid al-Adha']) for (const n of [`${e} Window`, `${e} Window Last Year`, `${e} Window vs Last Year %`]) check(m(n), `Eid measures: ${n} missing`);
    const fitr = m('Eid al-Fitr Window'), adha = m('Eid al-Adha Window'), fitrLY = m('Eid al-Fitr Window Last Year'), adhaLY = m('Eid al-Adha Window Last Year');
    // Eid al-Fitr is 1 Shawwal and lasts 3 days, Eid al-Adha 10 Dhu al-Hijjah and 4 days (as the calendar's flags);
    // the window starts 7 days before; the Eids are the ones whose first day is in view
    check(/VAR _DaysBefore = 7\n/.test(fitr) && /VAR _EidDays = 3\n/.test(fitr) && /FILTER \( 'Calendar', 'Calendar'\[Hijri Month Number\] = 10 && 'Calendar'\[Hijri Day\] = 1 \)/.test(fitr),
      `Eid al-Fitr window: ${fitr.slice(0, 300)}`);
    check(/VAR _DaysBefore = 7\n/.test(adha) && /VAR _EidDays = 4\n/.test(adha) && /FILTER \( 'Calendar', 'Calendar'\[Hijri Month Number\] = 12 && 'Calendar'\[Hijri Day\] = 10 \)/.test(adha),
      `Eid al-Adha window: ${adha.slice(0, 300)}`);
    for (const [n, x] of [['Fitr', fitr], ['Adha', adha], ['Fitr LY', fitrLY], ['Adha LY', adhaLY]]) {
      check(/REMOVEFILTERS \( 'Calendar' \)/.test(x) && /FILTER \(\n\s+ALL \( 'Calendar'\[Date\] \),\n\s+VAR _Day = 'Calendar'\[Date\]\n\s+RETURN\n\s+NOT ISEMPTY \(\n\s+FILTER \( _Eids, _Day >= \[@Eid\] - _DaysBefore && _Day <= \[@Eid\] \+ _EidDays - 1 \)\n\s+\)/.test(x),
        `Eid ${n}: the window is not the days around each Eid in view: ${x.slice(0, 400)}`);
    }
    // last year: the Eids of the previous Hijri year of each Eid in view, found in the whole calendar
    check(/"@Year", 'Calendar'\[Hijri Year\] - 1/.test(fitrLY) && /FILTER \( ALL \( 'Calendar' \), 'Calendar'\[Hijri Month Number\] = 10 && 'Calendar'\[Hijri Day\] = 1 && 'Calendar'\[Hijri Year\] IN _Years \)/.test(fitrLY),
      `Eid al-Fitr last year: ${fitrLY.slice(0, 400)}`);
    check(/'Calendar'\[Hijri Month Number\] = 12 && 'Calendar'\[Hijri Day\] = 10 && 'Calendar'\[Hijri Year\] IN _Years/.test(adhaLY), `Eid al-Adha last year: ${adhaLY.slice(0, 400)}`);
    check(/DIVIDE \( \[Total Sales Eid al-Fitr Window\] - \[Total Sales Eid al-Fitr Window Last Year\], \[Total Sales Eid al-Fitr Window Last Year\] \)/.test(m('Eid al-Fitr Window vs Last Year %')), 'Eid al-Fitr %: not window vs last year');
    check(/measure 'Total Sales Eid al-Adha Window vs Last Year %' = ```\n[\s\S]*?formatString: 0\.0%\n\t\t\tdisplayFolder: Time intelligence\\Eid\n/.test(r.tmdl), 'Eid measures: TMDL format or folder');
    check(r.groups.includes('Eid (needs the DataArcus calendar)'), `Eid measures: groups ${r.groups.join(' | ')}`);
    check(r.note !== 'none', 'Eid measures: the note about the calendar columns is hidden');
    await done(v, 'Eid measures');
    // other table and column names are used everywhere
    const o = await open(MB, mbSaved({ pick: ['eidAdhaLY'], cal: 'Dates', dateCol: 'Day' }));
    const os = await o.pg.$eval('#script', (e) => e.textContent);
    check(/ALL \( 'Dates'\[Day\] \)/.test(os) && /'Dates'\[Hijri Year\] IN _Years/.test(os) && !/'Calendar'|\[Date\]/.test(os), `Eid measures with other names: ${os.slice(0, 500)}`);
    await done(o, 'Eid measures other names');
    const a = await open(MB, mbSaved({ pick: ['eidFitr'] }), 'ar');
    const ar = await a.pg.evaluate(() => ({ groups: [...document.querySelectorAll('#patterns .mb-group .tg-label')].map((e) => e.textContent), what: document.querySelector('#list .mb-card:last-child .mb-what').textContent }));
    check(ar.groups.some((g) => /العيد/.test(g)) && /[؀-ۿ]/.test(ar.what), `Eid measures in Arabic: ${ar.groups.join(' | ')} / ${ar.what}`);
    await done(a, 'Eid measures Arabic');
  }

  // ---------- 6. The made-up test model is what the tools write today ----------
  {
    const dir = path.join(ROOT, 'scripts/gulf-calendar/test-model');
    const f = (n) => (fs.existsSync(path.join(dir, n)) ? fs.readFileSync(path.join(dir, n), 'utf8') : null);
    const { MODEL_CG, MODEL_MB, expected, checkQuery } = await import('../gulf-calendar/test-model/make-test-model.mjs').catch(() => ({}));
    check(!!MODEL_CG, 'test model: make-test-model.mjs missing');
    if (MODEL_CG) {
      const cg = await read(browser, url, CG, 'dataarcus-calendar-generator', MODEL_CG);
      const mb = await read(browser, url, MB, 'dataarcus-measure-builder', MODEL_MB);
      check(f('calendar.dax') === cg.dax + '\n', 'test model: calendar.dax is not what the generator writes now (run make-test-model.mjs)');
      check(f('measures.dax') === mb.script + '\n', 'test model: measures.dax is not what the measure builder writes now (run make-test-model.mjs)');
      const exp = expected();
      check(f('check.dax') === checkQuery(exp), 'test model: check.dax does not hold the expected numbers (run make-test-model.mjs)');
      check(exp.length >= 25 && exp.every((x) => x.expected === null || Number.isFinite(x.expected)), `test model: ${exp.length} checks`);
    }
  }

  // ---------- 7. The MCP's Gulf check (assets/js/gulf-health.js) reads the generator's calendars as the generator means them ----------
  {
    let GH = null;
    try { GH = require('../../assets/js/gulf-health.js'); } catch (e) { /* not there yet */ }
    const wrap = (dax) => ({ model: { tables: [{ name: 'Calendar', columns: [], partitions: [{ name: 'Calendar', source: { type: 'calculated', expression: dax.replace(/^Calendar =\n/, '') } }] }] } });
    const days = (dax, country) => { const r = GH.analyze(wrap(dax), { country, asOf: '2026-10-03' }), f = r.findings.find((x) => x.id === 'GC_WEEKEND'); return r.cantTell.some((x) => x.check === 'weekend') ? 'cannot tell' : f ? f.count : 0; };
    const model = fs.readFileSync(path.join(ROOT, 'scripts/gulf-calendar/test-model/calendar.dax'), 'utf8').replace(/\r\n/g, '\n');
    check(!!GH && days(model, 'uae') === 0 && days(model, 'ksa') === 939, `gulf-health on the test model's calendar: UAE ${GH ? days(model, 'uae') : 'no gulf-health.js'}, Saudi Arabia ${GH ? days(model, 'ksa') : ''} mismatched days (want 0 and 939)`);
    // a calendar the generator makes with a country's weekend agrees with that country's rule on every day, and the
    // weekend options the fixes name are the page's own
    const off = [], v = await visitor(browser, { viewport: [1280, 900] });
    await v.pg.goto(`${url}${CG}?lang=en`, { waitUntil: 'networkidle' });
    const labels = await v.pg.evaluate(() => Object.fromEntries([...document.querySelectorAll('#cgWeekend option')].map((o) => [o.value, o.textContent.trim()])));
    await v.ctx.close();
    for (const c of Object.keys(G.weekends)) {
      const cg = await read(browser, url, CG, 'dataarcus-calendar-generator', { weekend: c, start: '2000-01-01', end: '2030-12-31' });
      const n = GH ? days(cg.dax, c) : 'no gulf-health.js';
      if (n !== 0 || !GH || GH.COUNTRIES[c].weekendOption !== labels[c]) off.push(`${c}: ${n} days, option "${GH && GH.COUNTRIES[c].weekendOption}" / page "${labels[c]}"`);
    }
    check(!off.length, `gulf-health and the generator disagree: ${off.join('; ')}`);
    const other = model.replace(/"Is Weekend", .*,\n/, '"Is Weekend", WEEKDAY ( [Date], 2 ) > 5,\n');
    check(!!GH && other !== model && days(other, 'uae') === 'cannot tell', `gulf-health on another form of Is Weekend: ${GH ? days(other, 'uae') : 'no gulf-health.js'} (want "cannot tell")`);
  }

  // ---------- 8. The Calendar Generator reads right in Arabic (live-site reports of 2026-10-04) ----------
  // every option of every drop-down fits its box, in both languages, from phone to wide desktop
  for (const lang of ['en', 'ar']) for (const w of [1440, 1280, 1024, 992, 768, 390]) {
    const v = await visitor(browser, { viewport: [w, 900] });
    await v.pg.goto(`${url}${CG}?lang=${lang}`, { waitUntil: 'networkidle' });
    const cut = await v.pg.evaluate(() => {
      const c = document.createElement('canvas').getContext('2d'), out = [];
      for (const s of document.querySelectorAll('.cg-form select')) {
        const cs = getComputedStyle(s), room = s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        c.font = cs.font;
        for (const o of s.options) { const need = Math.ceil(c.measureText(o.textContent.trim()).width); if (need > room) out.push(`${s.id} "${o.textContent.trim()}" needs ${need}px, has ${Math.floor(room)}px`); }
      }
      return out;
    });
    check(!cut.length, `calendar generator ${lang} ${w}px: drop-down text cut: ${cut.join('; ')}`);
    await done(v, `drop-downs ${lang} ${w}px`);
  }
  // with English month names on the Arabic page, a Hijri date reads "28 Sha'ban 1443" (day first, as in English);
  // with Arabic names it stays right to left (day on the right)
  for (const names of ['en', 'ar']) {
    const v = await open(CG, cgSaved({ hijri: true, lang: names, start: '2022-03-25', end: '2022-04-30' }), 'ar');
    const r = await v.pg.evaluate(() => {
      const cell = document.querySelectorAll('#preview tr')[1].cells[2], txt = cell.textContent, node = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT).nextNode();
      const rect = (a, b) => { const g = document.createRange(); g.setStart(node, a); g.setEnd(node, b); return g.getBoundingClientRect(); };
      const day = txt.indexOf(' '), month = [day + 1, txt.lastIndexOf(' ')];
      return { txt, day: rect(0, day), month: rect(month[0], month[1]) };
    });
    const ok = names === 'en' ? r.day.right <= r.month.left + 1 : r.day.left >= r.month.right - 1;
    check(ok, `calendar preview, Arabic page, ${names} names: "${r.txt}" shows the day on the ${r.day.left < r.month.left ? 'left' : 'right'} of the month`);
    await done(v, `preview order ${names}`);
  }
  // the Arabic note of the announced-dates option ends on an Arabic word, so its full stop sits after Arabic text and
  // not next to the English column name (at desktop width, where the sentence ends on the name's line)
  {
    const v = await open(CG, null, 'ar');
    const r = await v.pg.evaluate(() => {
      const small = document.querySelector('#cgObserved + span small'), txt = small.textContent.trim();
      const walker = document.createTreeWalker(small, NodeFilter.SHOW_TEXT); let last = null, n; while ((n = walker.nextNode())) if (n.textContent.trim()) last = n;
      const s = last.textContent, end = s.lastIndexOf('.');
      const g = document.createRange(); g.setStart(last, end); g.setEnd(last, end + 1); const dot = g.getBoundingClientRect();
      const before = s.slice(0, end).trimEnd(), wordStart = before.search(/\S+$/);
      const h = document.createRange(); h.setStart(last, Math.max(0, wordStart)); h.setEnd(last, before.length); const word = h.getBoundingClientRect();
      return { txt, word: before.slice(wordStart), dot: { l: dot.left, r: dot.right, t: dot.top }, wb: { l: word.left, r: word.right, t: word.top } };
    });
    check(/[؀-ۿ]$/.test(r.word) && Math.abs(r.dot.t - r.wb.t) < 4 && r.wb.l >= r.dot.r - 1,
      `calendar note in Arabic: the full stop follows "${r.word}" (${JSON.stringify(r.dot)} vs ${JSON.stringify(r.wb)}): ${r.txt.slice(-60)}`);
    await done(v, 'note full stop');
  }


  // The Arabic name columns (owner 2026-10-06): on by default on a fresh page with English names, in both page languages; off with the
  // box unticked; the box is off and the columns left out when the names are Arabic already
  for (const lang of ['en', 'ar']) {
    const v = await open(CG, null, lang);
    const look = () => v.pg.evaluate(() => { const b = document.getElementById('cgArabic'), d = document.getElementById('dax').textContent;
      return { on: !!b && b.checked, off: !!b && b.disabled, label: b ? b.closest('label').textContent.replace(/\s+/g, ' ').trim() : '',
        cols: ['Day Name (Arabic)', 'Month Name (Arabic)', 'Hijri Month Name (Arabic)'].filter((c) => d.includes('"' + c + '"')).length,
        ar: /"الأحد"/.test(d) && /"يناير"/.test(d) && /"رمضان"/.test(d) }; });
    // the Arabic page writes Arabic names by default: the box is off there until the names are English
    if (lang === 'ar') { const z = await look(); check(z.off && z.cols === 0, `calendar ar: Arabic names by default, yet the Arabic name columns are written (${JSON.stringify(z)})`);
      await v.pg.selectOption('#cgLang', 'en'); await v.pg.waitForTimeout(150); }
    const a = await look();
    check(a.on && !a.off && a.cols === 3 && a.ar && (lang === 'ar' ? /[؀-ۿ]/.test(a.label) : /Arabic name columns/i.test(a.label)), `calendar ${lang}: Arabic name columns not on by default (${JSON.stringify(a)})`);
    await v.pg.evaluate(() => document.getElementById('cgArabic').click()); await v.pg.waitForTimeout(150);
    const b = await look();
    check(!b.on && b.cols === 0, `calendar ${lang}: Arabic name columns still written with the box off (${JSON.stringify(b)})`);
    await v.pg.evaluate(() => document.getElementById('cgArabic').click()); await v.pg.selectOption('#cgLang', 'ar'); await v.pg.waitForTimeout(150);
    const c = await look();
    check(c.off && c.cols === 0, `calendar ${lang}: Arabic names in the table, yet the Arabic name columns are written or the box is on (${JSON.stringify(c)})`);
    await done(v, `arabic names ${lang}`);
  }

  // Years Power BI can't take are refused with a message (audit AUD-004, 2026-10-04): a two-digit year typed in the
  // date field (0025) was read as 1925 here and 2025 by DAX's DATE, and years before 1900 aren't DAX dates at all
  // (DATE supports 1 March 1900 on). Copy and Download are off and no DAX is shown until the dates are fixed.
  for (const lang of ['en', 'ar']) {
    const v = await open(CG, null, lang);
    const state = () => v.pg.evaluate(() => ({ err: document.getElementById('err').textContent.trim(), dax: document.getElementById('dax').textContent, copy: document.getElementById('copyBtn').disabled, min: document.getElementById('cgStart').min, max: document.getElementById('cgEnd').max }));
    for (const [start, end, ok] of [['0025-01-01', '0030-12-31', false], ['1899-12-30', '1905-12-31', false], ['1900-02-28', '1905-12-31', false], ['2025-01-01', '0030-12-31', false],
      ['1900-03-01', '1905-12-31', true], ['9990-01-01', '9999-12-31', true], ['2025-01-01', '2030-12-31', true]]) {
      await v.pg.fill('#cgStart', start); await v.pg.fill('#cgEnd', end); await v.pg.waitForTimeout(150);
      const r = await state();
      const good = ok ? !r.err && /CALENDAR \( DATE \(/.test(r.dax) && !r.copy && new RegExp(`DATE \\( ${+start.slice(0, 4)}, `).test(r.dax)
        : r.err.length > 10 && /1900/.test(r.err) && !r.dax && r.copy;
      check(good, `calendar ${lang} ${start} to ${end}: ${ok ? 'refused or wrong' : 'accepted'} (${JSON.stringify({ err: r.err.slice(0, 80), dax: r.dax.slice(0, 40), copy: r.copy })})`);
    }
    const r = await state();
    check(r.min === '1900-03-01' && r.max === '9999-12-31', `calendar ${lang}: date fields don't say the range (min ${r.min}, max ${r.max})`);
    await done(v, `calendar years ${lang}`);
  }
  // ---------- 8. The generator as a shared module (assets/js/calendar-generator.js): in Node it writes the page's table ----------
  // (the MCP's add_gulf_calendar uses it; one generator, never a copy)
  {
    let Cal = null;
    try { delete require.cache[require.resolve('../../assets/js/calendar-generator.js')]; Cal = require('../../assets/js/calendar-generator.js'); } catch (e) { /* not a module yet */ }
    check(!!Cal && typeof Cal.build === 'function', 'calendar-generator.js is not a module with build() in Node');
    const DEF = { name: 'Calendar', start: '2022-01-01', end: '2027-12-31', fy: 1, week: 'sun', weekend: 'sat-sun', lang: 'en', hijri: true, fiscal: true, relative: true, observed: false };
    const cols = (stats) => +((String(stats).match(/(\d+) (columns|عمود)/) || [])[1]);
    for (const b of BASE.cg) {
      const out = Cal && typeof Cal.build === 'function' ? Cal.build(Object.assign({}, DEF, b.saved)) : null;
      // (round 18, S3: an English calendar has "Day Short" since; the baseline predates it: its line out, one column less)
      const sh = !!out && out.dax.includes(SHORT);
      check(!!out && lessShort('dax', out.dax) === b.dax && out.columns.length - (sh ? 1 : 0) === cols(b.stats), `shared generator ${JSON.stringify(b.saved)} ${b.lang}: ${out ? (lessShort('dax', out.dax) === b.dax ? 'columns ' + out.columns.length + ' vs ' + cols(b.stats) : 'DAX differs from the page') : 'no build()'}`);
    }
    const { MODEL_CG } = await import('../gulf-calendar/test-model/make-test-model.mjs');
    const model = fs.readFileSync(path.join(ROOT, 'scripts/gulf-calendar/test-model/calendar.dax'), 'utf8').replace(/\r\n/g, '\n');
    const mo = Cal && typeof Cal.build === 'function' ? Cal.build(Object.assign({}, DEF, MODEL_CG)) : null;
    // 36 -> 39 (owner 2026-10-06): the test model's options have the three Arabic name columns on
    check(!!mo && mo.dax + '\n' === model && mo.columns.length === 40, /* 39 -> 40: round 18, S3 (the owner's yes): Day Short */ `shared generator on the test model's options: ${mo ? (mo.dax + '\n' === model ? 'columns ' + mo.columns.length : 'DAX differs from calendar.dax') : 'no build()'}`);
  }

  return { checks, problems };
}
