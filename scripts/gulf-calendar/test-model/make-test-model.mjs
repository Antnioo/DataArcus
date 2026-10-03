// The Gulf Calendar test model: a made-up model (no real data) to run the Gulf Calendar's DAX in Power BI Desktop.
//   node scripts/gulf-calendar/test-model/make-test-model.mjs
// writes, next to this file:
//   calendar.dax  the Calendar Generator's table (announced dates on, UAE weekend, 2018-2030), as the website writes it
//   sales.dax     a made-up Sales table: two stores, an amount per day from a fixed formula
//   measures.dax  the Measure Builder's script (Ramadan and Eid measures), as the website writes it
//   check.dax     one query: every measure in the contexts below, next to the number worked out here in JavaScript
// The expected numbers come from this file's own model of the table (the Umm al-Qura calendar with the announced
// dates of gulf-dates.js, the UAE weekend rules, the Sales formula), not from the DAX. The gulf-calendar test suite
// checks that the four files are what the tools write today. Steps for Desktop: README.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const G = createRequire(import.meta.url)('../../../assets/js/gulf-dates.js');

export const MODEL_CG = { name: 'Calendar', start: '2018-01-01', end: '2030-12-31', week: 'sun', weekend: 'uae', lang: 'en', fy: 1, hijri: true, fiscal: true, relative: true, observed: true };
export const MODEL_MB = { mode: 'column', agg: 'SUM', fact: 'Sales', column: 'Amount', base: 'Total Sales', cal: 'Calendar', dateCol: 'Date',
  pick: ['ramLY', 'ramPct', 'eidFitr', 'eidFitrLY', 'eidFitrPct', 'eidAdha', 'eidAdhaLY', 'eidAdhaPct'] };
export const SALES_DAX = `Sales =
-- Made-up sales for the Gulf Calendar test model: two stores, every day from 2018 to 2030 (no real data)
SELECTCOLUMNS (
    GENERATE ( CALENDAR ( DATE ( 2018, 1, 1 ), DATE ( 2030, 12, 31 ) ), { 1, 2 } ),
    "Date", [Date],
    "Store", [Value],
    "Amount", 100 + MOD ( YEAR ( [Date] ) * 7 + MONTH ( [Date] ) * 31 + DAY ( [Date] ) * 13 + [Value] * 17, 50 )
)`;

const DAY = 864e5;
const T = (s) => Date.parse(s + 'T00:00:00Z');
const ymd = (t) => { const d = new Date(t); return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]; };

// ---------- this file's own model of the calendar and the sales ----------
const UAQ = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' });
const uaq = (t) => { const o = {}; UAQ.formatToParts(new Date(t)).forEach((p) => { if (['day', 'month', 'year'].includes(p.type)) o[p.type] = +p.value; }); return o; };
const FROM = T(MODEL_CG.start), TO = T(MODEL_CG.end);
const starts = (() => {
  const out = [];
  for (let t = FROM - 40 * DAY; t <= TO; t += DAY) { const h = uaq(t); if (h.day === 1) out.push({ t, y: h.year, m: h.month }); }
  const moved = new Map();
  for (const e of G.events) {
    if (e.ramadan) moved.set(`${e.hijriYear}/9`, T(e.ramadan));
    if (e.fitr) moved.set(`${e.hijriYear}/10`, T(e.fitr));
    if (e.adha) moved.set(`${e.hijriYear}/12`, T(e.adha) - 9 * DAY);
  }
  return out.map((s) => (moved.has(`${s.y}/${s.m}`) ? { ...s, t: moved.get(`${s.y}/${s.m}`) } : s));
})();
const days = [];
for (let t = FROM, i = 0; t <= TO; t += DAY) {
  while (i + 1 < starts.length && starts[i + 1].t <= t) i++;
  const s = starts[i], [y, mo, d] = ymd(t), hd = Math.round((t - s.t) / DAY) + 1, wd = new Date(t).getUTCDay() + 1;
  const rule = G.weekends.uae.filter((r) => r.from === null || T(r.from) <= t).pop();
  days.push({ t, y, mo, d, hy: s.y, hm: s.m, hd, start: s.t, weekend: rule.days.includes(wd),
    sales: [1, 2].reduce((a, store) => a + 100 + ((y * 7 + mo * 31 + d * 13 + store * 17) % 50), 0),
    ramadan: s.m === 9, fitr: s.m === 10 && hd <= 3, adha: s.m === 12 && hd >= 10 && hd <= 13 });
}
for (const x of days) x.estimate = (x.ramadan || x.fitr || x.adha) && x.start > T(G.checked);
const sum = (f) => days.filter(f).reduce((a, x) => a + x.sales, 0);
const count = (f) => days.filter(f).length;
const ramadanDay = (hy, n) => days.find((x) => x.hy === hy && x.ramadan && x.hd === n);
const ramadanLen = (hy) => count((x) => x.hy === hy && x.ramadan);
// the measures' rules, written out again here: same Ramadan days last Hijri year; Eid windows of the Eids that start in view
const lastRamadan = (inView) => {
  const keys = new Set(days.filter((x) => inView(x) && x.ramadan).map((x) => `${x.hy - 1}/${x.hd}`));
  return keys.size ? sum((x) => x.ramadan && keys.has(`${x.hy}/${x.hd}`)) || null : null;
};
const thisRamadan = (inView) => sum((x) => inView(x) && x.ramadan);
const eidWindow = (inView, month, day, eidDays, lastYear) => {
  const firsts = days.filter((x) => inView(x) && x.hm === month && x.hd === day);
  if (!firsts.length) return null;
  const eids = lastYear ? days.filter((x) => x.hm === month && x.hd === day && firsts.some((f) => f.hy - 1 === x.hy)) : firsts;
  const total = sum((x) => eids.some((e) => x.t >= e.t - 7 * DAY && x.t <= e.t + (eidDays - 1) * DAY));
  return eids.length ? total : null;
};
const pct = (a, b) => (a === null || b === null || b === 0 ? null : (a - b) / b);
const fitr = (v, ly) => eidWindow(v, 10, 1, 3, ly), adha = (v, ly) => eidWindow(v, 12, 10, 4, ly);

// ---------- the checks: [name, DAX for the value, expected] ----------
const C = "'Calendar'";
const ctx = (measure, ...filters) => `CALCULATE ( ${measure}${filters.map((f) => `, ${f}`).join('')} )`;
const yr = (y) => `${C}[Year] = ${y}`, mon = (m) => `${C}[Month Number] = ${m}`, hy = (y) => `${C}[Hijri Year] = ${y}`, rd = (n) => `${C}[Ramadan Day] = ${n}`;
const dt = (s) => `${C}[Date] = DATE ( ${s.split('-').map(Number).join(', ')} )`;
const rows = (f) => `${ctx(`COUNTROWS ( ${C} )`, ...f)} + 0`;
export function expected() {
  const inY = (y) => (x) => x.y === y, inYM = (y, m) => (x) => x.y === y && x.mo === m, inHY = (h) => (x) => x.hy === h, all = () => true;
  const ram = (h, n) => (x) => x.hy === h && x.ramadan && x.hd === n;
  const first2018 = days.find((x) => x.y === 2018 && x.ramadan);
  const list = [
    // the calendar itself (the generator's table as Desktop builds it)
    ['C01 rows in the calendar', `COUNTROWS ( ${C} )`, days.length],
    ['C02 Ramadan days in 2018', rows([`${C}[Is Ramadan] = TRUE ()`, yr(2018)]), count((x) => x.y === 2018 && x.ramadan)],
    ['C03 first Ramadan day of 2018, days after 1 January', `INT ( ${ctx(`MIN ( ${C}[Date] )`, `${C}[Is Ramadan] = TRUE ()`, yr(2018))} - DATE ( 2018, 1, 1 ) )`, Math.round((first2018.t - T('2018-01-01')) / DAY)],
    ['C04 Ramadan Day on 2026-03-19', ctx(`MAX ( ${C}[Ramadan Day] )`, dt('2026-03-19')), 30],
    ['C05 Eid al-Fitr days in 2025', rows([`${C}[Is Eid al-Fitr] = TRUE ()`, yr(2025)]), count((x) => x.y === 2025 && x.fitr)],
    ['C06 Eid al-Adha days in 2026', rows([`${C}[Is Eid al-Adha] = TRUE ()`, yr(2026)]), count((x) => x.y === 2026 && x.adha)],
    ['C07 estimated dates in 2026', rows([`${C}[Is Estimated Date] = TRUE ()`, yr(2026)]), count((x) => x.y === 2026 && x.estimate)],
    ['C08 estimated dates in 2027', rows([`${C}[Is Estimated Date] = TRUE ()`, yr(2027)]), count((x) => x.y === 2027 && x.estimate)],
    ['C09 weekend days in 2021 (Fri-Sat)', rows([`${C}[Is Weekend] = TRUE ()`, yr(2021)]), count((x) => x.y === 2021 && x.weekend)],
    ['C10 weekend days in 2022 (Sat-Sun)', rows([`${C}[Is Weekend] = TRUE ()`, yr(2022)]), count((x) => x.y === 2022 && x.weekend)],
    ['C11 Friday 2021-12-31 is a weekend day', rows([`${C}[Is Weekend] = TRUE ()`, dt('2021-12-31')]), 1],
    ['C12 Friday 2022-01-07 is a working day', rows([`${C}[Is Working Day] = TRUE ()`, dt('2022-01-07')]), 1],
    ['C13 days after the UAE weekend change in 2021', rows([`${C}[Is After UAE Weekend Change] = TRUE ()`, yr(2021)]), 0],
    ['C14 days after the UAE weekend change in 2022', rows([`${C}[Is After UAE Weekend Change] = TRUE ()`, yr(2022)]), 365],
    ['C15 Ramadan 1446 length', rows([`${C}[Is Ramadan] = TRUE ()`, hy(1446)]), ramadanLen(1446)],
    // Ramadan day N vs last year, and this Ramadan vs last Ramadan (the Measure Builder's existing measures)
    ['R01 Ramadan 1447 day 1: sales', ctx('[Total Sales]', hy(1447), rd(1)), sum(ram(1447, 1))],
    ['R02 Ramadan 1447 day 1: last Ramadan', ctx('[Total Sales Last Ramadan]', hy(1447), rd(1)), ramadanDay(1446, 1).sales],
    ['R03 Ramadan 1447 day 15: last Ramadan', ctx('[Total Sales Last Ramadan]', hy(1447), rd(15)), ramadanDay(1446, 15).sales],
    ['R04 Ramadan 1447 day 30: last Ramadan had 29 days', ctx('[Total Sales Last Ramadan]', hy(1447), rd(30)), ramadanDay(1446, 30) ? ramadanDay(1446, 30).sales : null],
    ['R05 Ramadan 1447 day 10: vs last Ramadan %', ctx('[Total Sales vs Last Ramadan %]', hy(1447), rd(10)), pct(ramadanDay(1447, 10).sales, ramadanDay(1446, 10).sales)],
    ['R06 year 2026 card: last Ramadan', ctx('[Total Sales Last Ramadan]', yr(2026)), lastRamadan(inY(2026))],
    ['R07 year 2026 card: vs last Ramadan %', ctx('[Total Sales vs Last Ramadan %]', yr(2026)), pct(thisRamadan(inY(2026)), lastRamadan(inY(2026)))],
    ['R08 year 2030 (two Ramadans): last Ramadan', ctx('[Total Sales Last Ramadan]', yr(2030)), lastRamadan(inY(2030))],
    ['R09 Hijri year 1444: last Ramadan', ctx('[Total Sales Last Ramadan]', hy(1444)), lastRamadan(inHY(1444))],
    ['R10 year 2018: no Ramadan before it in the calendar', ctx('[Total Sales Last Ramadan]', yr(2018)), lastRamadan(inY(2018))],
    // Eid windows
    ['E01 2026: Eid al-Fitr window', ctx('[Total Sales Eid al-Fitr Window]', yr(2026)), fitr(inY(2026), false)],
    ['E02 March 2026: Eid al-Fitr window', ctx('[Total Sales Eid al-Fitr Window]', yr(2026), mon(3)), fitr(inYM(2026, 3), false)],
    ['E03 February 2026: no Eid starts in it', ctx('[Total Sales Eid al-Fitr Window]', yr(2026), mon(2)), fitr(inYM(2026, 2), false)],
    ['E04 March 2025: window runs into April', ctx('[Total Sales Eid al-Fitr Window]', yr(2025), mon(3)), fitr(inYM(2025, 3), false)],
    ['E05 April 2025: Eid days but not its first day', ctx('[Total Sales Eid al-Fitr Window]', yr(2025), mon(4)), fitr(inYM(2025, 4), false)],
    ['E06 2026: Eid al-Fitr window last year', ctx('[Total Sales Eid al-Fitr Window Last Year]', yr(2026)), fitr(inY(2026), true)],
    ['E07 2018: no Eid al-Fitr before it in the calendar', ctx('[Total Sales Eid al-Fitr Window Last Year]', yr(2018)), fitr(inY(2018), true)],
    ['E08 2026: Eid al-Fitr window vs last year %', ctx('[Total Sales Eid al-Fitr Window vs Last Year %]', yr(2026)), pct(fitr(inY(2026), false), fitr(inY(2026), true))],
    ['E09 2026: Eid al-Adha window', ctx('[Total Sales Eid al-Adha Window]', yr(2026)), adha(inY(2026), false)],
    ['E10 2026: Eid al-Adha window last year', ctx('[Total Sales Eid al-Adha Window Last Year]', yr(2026)), adha(inY(2026), true)],
    ['E11 2026: Eid al-Adha window vs last year %', ctx('[Total Sales Eid al-Adha Window vs Last Year %]', yr(2026)), pct(adha(inY(2026), false), adha(inY(2026), true))],
    ['E12 2030: Eid al-Fitr window', ctx('[Total Sales Eid al-Fitr Window]', yr(2030)), fitr(inY(2030), false)],
    ['E13 whole calendar: every Eid al-Fitr window', '[Total Sales Eid al-Fitr Window]', fitr(all, false)],
    ['E14 Hijri year 1447: Eid al-Adha window', ctx('[Total Sales Eid al-Adha Window]', hy(1447)), adha(inHY(1447), false)],
    ['E15 Hijri year 1447: Eid al-Adha window last year', ctx('[Total Sales Eid al-Adha Window Last Year]', hy(1447)), adha(inHY(1447), true)]
  ];
  return list.map(([name, dax, exp]) => ({ name, dax, expected: exp === undefined ? null : exp }));
}
const num = (x) => (x === null ? 'BLANK ()' : Number.isInteger(x) ? String(x) : x.toPrecision(15));
export const checkQuery = (exp) => `// Gulf Calendar test model: each result next to the number worked out beforehand in JavaScript
// (scripts/gulf-calendar/test-model/make-test-model.mjs). Run it in DAX query view: every row must say Pass = TRUE.
EVALUATE
VAR _Checks =
    {
${exp.map((x) => `        ( "${x.name}", ${x.dax}, ${num(x.expected)} )`).join(',\n')}
    }
RETURN
    SELECTCOLUMNS (
        _Checks,
        "Check", [Value1],
        "Result", [Value2],
        "Expected", [Value3],
        "Pass", IF ( ISBLANK ( [Value3] ), ISBLANK ( [Value2] ), ABS ( [Value2] - [Value3] ) < 0.000001 )
    )
ORDER BY [Check]
`;

if (import.meta.url === `file://${process.argv[1]}`) {
  const { serve, launch } = await import('../../tests/lib.mjs');
  const { read } = await import('../../tests/capture-gulf-baseline.mjs');
  const server = await serve(), browser = await launch();
  const cg = await read(browser, server.url, '/tools/dax-calendar-table-generator.html', 'dataarcus-calendar-generator', MODEL_CG);
  const mb = await read(browser, server.url, '/tools/dax-measure-builder.html', 'dataarcus-measure-builder', MODEL_MB);
  await browser.close(); server.close();
  if (cg.errs.length || mb.errs.length) { console.error([...cg.errs, ...mb.errs].join('\n')); process.exit(1); }
  const exp = expected();
  fs.writeFileSync(path.join(HERE, 'calendar.dax'), cg.dax + '\n');
  fs.writeFileSync(path.join(HERE, 'sales.dax'), SALES_DAX + '\n');
  fs.writeFileSync(path.join(HERE, 'measures.dax'), mb.script + '\n');
  fs.writeFileSync(path.join(HERE, 'check.dax'), checkQuery(exp));
  fs.writeFileSync(path.join(HERE, 'expected.json'), JSON.stringify(exp.map(({ name, expected: e }) => ({ name, expected: e })), null, 1) + '\n');
  console.log(`Wrote calendar.dax, sales.dax, measures.dax, check.dax and expected.json (${exp.length} checks).`);
}
