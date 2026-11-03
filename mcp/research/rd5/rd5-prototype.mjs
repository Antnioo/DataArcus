// RD5's measured prototype (3 Nov 2026): a JS evaluation of the DAX logic, as svg-expressions.js does, on made-up data
// written to os.tmpdir() only. No model, no .pbix, no person's data. Run: node mcp/research/rd5/rd5-prototype.mjs
// Part 1: which day of last Ramadan each method pairs with each Ramadan day (the generator's own Hijri columns).
// Part 2: a VAT standard-rate column by date and country, generated as DAX the way weekendDax nests the weekend rules,
//         read back from its own text and checked against every dated change.
// Part 3: the peg table, each rate against its central bank's own figure.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require('../../../assets/js/calendar-generator.js');
const GD = require('../../../assets/js/gulf-dates.js');

let checks = 0, fails = 0;
const ok = (cond, what) => { checks++; if (!cond) { fails++; console.log('FAIL script=rd5-prototype cause=' + what); } };
const { DAY, iso, parse } = C;
const out = {};

// ---------- Part 1: Ramadan to Ramadan ----------
// the calendar the MCP writes by default (announced: true): Umm al-Qura with Ramadan, Shawwal, Dhu al-Hijjah moved
const st = { start: '2016-09-01', end: '2030-12-31', hijri: true, observed: true };
const H = C.hijriFor(st);
const from = parse('2016-09-01'), to = parse('2030-12-31');
const days = [];
for (let t = from; t <= to; t += DAY) { const h = H(t); days.push({ t, hy: h.year, hm: h.month, hd: h.day }); }
const byT = new Map(days.map((d) => [d.t, d]));
// Ramadan days by Hijri year: [ {t, day} ]
const ram = {};
days.forEach((d) => { if (d.hm === 9) (ram[d.hy] = ram[d.hy] || []).push(d); });
// the Hijri day of the year (position from 1 Muharram), for the calendar-based hypothesis C
const muharram = {};
days.forEach((d) => { if (d.hm === 1 && d.hd === 1) muharram[d.hy] = d.t; });
const doy = (d) => (muharram[d.hy] != null ? Math.round((d.t - muharram[d.hy]) / DAY) + 1 : null);
const atDoy = (hy, n) => (muharram[hy] != null ? byT.get(muharram[hy] + (n - 1) * DAY) : undefined);
// classic SAMEPERIODLASTYEAR = DATEADD ( dates, -1, YEAR ): the same month and day a year back, 29 Feb to 28 Feb
const gregBack = (t) => { const x = new Date(t); const y = x.getUTCFullYear() - 1, m = x.getUTCMonth(); let dd = x.getUTCDate();
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); if (dd > last) dd = last; return Date.UTC(y, m, dd); };

const methods = {
  // A: classic SAMEPERIODLASTYEAR on the Date column
  A_sameperiodlastyear: (d) => byT.get(gregBack(d.t)),
  // B: today's Measure Builder "Last Ramadan" (TREATAS Hijri Year - 1, Ramadan Day)
  B_hijri_treatas: (d) => (ram[d.hy - 1] || []).find((x) => x.hd === d.hd),
  // C (hypothesis, to confirm in Desktop): calendar-based SAMEPERIODLASTYEAR on a Hijri calendar shifting a date by its
  //   position in the year (Learn: "treated as the 60th day of the year")
  C_calendar_dayofyear: (d) => atDoy(d.hy - 1, doy(d)),
  // D (hypothesis): calendar-based DATEADD ( Hijri, -12, MONTH ): the same month, the same day in it; a day the
  //   shorter month lacks taken as blank (the other reading, the month's last day, counted in D_clamp)
  D_calendar_month_blank: (d) => (ram[d.hy - 1] || []).find((x) => x.hd === d.hd),
  D_calendar_month_clamp: (d) => { const l = ram[d.hy - 1] || []; return l.find((x) => x.hd === d.hd) || l[l.length - 1]; }
};

const pairs = [];
const years = Object.keys(ram).map(Number).filter((y) => ram[y - 1] && ram[y].length >= 29 && ram[y - 1].length >= 29 && ram[y][0].t - from > 400 * DAY);
const summary = {};
Object.keys(methods).forEach((k) => { summary[k] = { ramadanDays: 0, sameRamadanDay: 0, otherRamadanDay: 0, notRamadan: 0, unpaired: 0, doubled: 0 }; });
years.forEach((hy) => {
  Object.entries(methods).forEach(([k, f]) => {
    const seen = new Map();
    ram[hy].forEach((d) => {
      const p = f(d), s = summary[k]; s.ramadanDays++;
      if (!p) { s.unpaired++; return; }
      seen.set(p.t, (seen.get(p.t) || 0) + 1);
      if (p.hm === 9 && p.hy === hy - 1 && p.hd === d.hd) s.sameRamadanDay++;
      else if (p.hm === 9) s.otherRamadanDay++;
      else s.notRamadan++;
    });
    summary[k].doubled += [...seen.values()].filter((n) => n > 1).length;
    pairs.push({ hijriYear: hy, method: k, length: ram[hy].length, lastLength: ram[hy - 1].length,
      wrong: ram[hy].filter((d) => { const p = f(d); return !p || !(p.hm === 9 && p.hy === hy - 1 && p.hd === d.hd); }).length });
  });
});
out.ramadanPairs = { hijriYears: years, summary };
// the per-year counts for A, the method most reports use
out.sameperiodlastyearByYear = pairs.filter((p) => p.method === 'A_sameperiodlastyear').map((p) => ({ hijriYear: p.hijriYear, ramadanStarts: iso(ram[p.hijriYear][0].t), days: p.length, wrong: p.wrong }));

// the made-up fact, 3 years by day (2023-2025): flat sales, no real growth, so a right Ramadan comparison says ~0 %
const fact = [];
const f0 = parse('2023-01-01'), f1 = parse('2025-12-31');
for (let t = f0; t <= f1; t += DAY) {
  const d = byT.get(t); let v = 1000;
  if (d.hm === 9) v *= d.hd >= 21 ? 2.0 : 1.5;                        // Ramadan, the last ten nights higher
  if ((d.hm === 10 && d.hd <= 3) || (d.hm === 12 && d.hd >= 10 && d.hd <= 13)) v *= 2.5;  // Eid days
  fact.push({ t, v });
}
fs.writeFileSync(path.join(os.tmpdir(), 'rd5-madeup-fact.json'), JSON.stringify(fact.map((r) => [iso(r.t), r.v])));
const val = new Map(fact.map((r) => [r.t, r.v]));
const growth = {};
[1445, 1446].forEach((hy) => {
  const thisR = ram[hy].reduce((s, d) => s + val.get(d.t), 0);
  growth[hy] = {};
  ['A_sameperiodlastyear', 'B_hijri_treatas', 'C_calendar_dayofyear'].forEach((k) => {
    const last = ram[hy].reduce((s, d) => { const p = methods[k](d); return s + (p && val.has(p.t) ? val.get(p.t) : 0); }, 0);
    growth[hy][k] = +(100 * (thisR - last) / last).toFixed(1);
  });
  growth[hy].days = ram[hy].length; growth[hy].lastDays = ram[hy - 1].length;
});
out.growthOnFlatSales = growth;

// checks: the Hijri pairing is right on every day both Ramadans have
ok(summary.B_hijri_treatas.notRamadan === 0 && summary.B_hijri_treatas.otherRamadanDay === 0, 'B pairs a wrong day');
ok(summary.B_hijri_treatas.unpaired === pairs.filter((p) => p.method === 'B_hijri_treatas').reduce((s, p) => s + Math.max(0, p.length - p.lastLength), 0), 'B unpaired is not day 30 after a 29-day Ramadan');
ok(summary.A_sameperiodlastyear.sameRamadanDay === 0, 'SPLY paired a Ramadan day with the same Ramadan day');
// on flat sales B's growth is exactly the unpaired day 30's share of last Ramadan, and 0 when the lengths match
[1445, 1446].forEach((hy) => {
  const sum = (l) => l.reduce((s, d) => s + val.get(d.t), 0), n = ram[hy].length, nLast = ram[hy - 1].length;
  const lastPaired = sum(ram[hy - 1].filter((d) => d.hd <= n)), lastAll = sum(ram[hy - 1]), thisR = sum(ram[hy]);
  ok(Math.abs(growth[hy].B_hijri_treatas - +(100 * (thisR - lastPaired) / lastPaired).toFixed(1)) < 0.05, `B's growth in ${hy} is not its own definition`);
  // what a 30th day does: this year's day 30 counts on one side only; last year's day 30 is dropped when this year has 29
  growth[hy].unpairedDayEffect = n > nLast ? +(100 * sum(ram[hy].filter((d) => d.hd > nLast)) / lastPaired).toFixed(1) : 0;
  growth[hy].againstAllOfLastRamadan = +(100 * (thisR - lastAll) / lastAll).toFixed(1); });

// ---------- Part 2: VAT standard rate by date and country ----------
// every change sourced in RD5-gulf-measures.md section b; checked 2026-11-03. Standard rate only: zero-rated and exempt
// supplies, and the transitional rules (a contract before the change could keep the old rate), are not in a date column.
const VAT = {
  checked: '2026-11-03',
  rates: {
    uae: [{ from: null, rate: 0 }, { from: '2018-01-01', rate: 5 }],
    ksa: [{ from: null, rate: 0 }, { from: '2018-01-01', rate: 5 }, { from: '2020-07-01', rate: 15 }],
    bhr: [{ from: null, rate: 0 }, { from: '2019-01-01', rate: 5 }, { from: '2022-01-01', rate: 10 }],
    omn: [{ from: null, rate: 0 }, { from: '2021-04-16', rate: 5 }],
    qat: [{ from: null, rate: 0 }],
    kwt: [{ from: null, rate: 0 }]
  }
};
const dateDax = (s) => `DATE ( ${s.split('-').map(Number).join(', ')} )`;
const vatDax = (rules) => (rules.length === 1 ? String(rules[0].rate)
  : `IF ( [Date] >= ${dateDax(rules[rules.length - 1].from)}, ${rules[rules.length - 1].rate}, ${vatDax(rules.slice(0, -1))} )`);
// read the generated DAX back (the way a reviewer reads it): every IF ( [Date] >= DATE ( y, m, d ), rate, ...
const evalVatDax = (dax, t) => {
  let s = dax;
  for (;;) {
    const m = s.match(/^IF \( \[Date\] >= DATE \( (\d+), (\d+), (\d+) \), (\d+), ([\s\S]*) \)$/);
    if (!m) return Number(s);
    if (t >= Date.UTC(+m[1], +m[2] - 1, +m[3])) return Number(m[4]);
    s = m[5];
  }
};
const vatOf = (rules, t) => { let r = null; rules.forEach((x) => { if (x.from === null || parse(x.from) <= t) r = x.rate; }); return r; };
out.vat = {};
const v0 = parse('2017-01-01'), v1 = parse('2026-12-31');
Object.entries(VAT.rates).forEach(([c, rules]) => {
  const dax = vatDax(rules); let prev = null; const changes = [], daysAt = {}; let disagree = 0;
  for (let t = v0; t <= v1; t += DAY) {
    const a = evalVatDax(dax, t), b = vatOf(rules, t);
    if (a !== b) disagree++;
    daysAt[a] = (daysAt[a] || 0) + 1;
    if (prev !== null && a !== prev) changes.push(`${iso(t)}: ${prev} to ${a}`);
    prev = a;
  }
  const want = rules.filter((r) => r.from).map((r, i, arr) => `${r.from}: ${(i ? arr[i - 1].rate : rules[0].rate)} to ${r.rate}`);
  ok(disagree === 0, `VAT ${c}: the DAX and the rule list disagree on ${disagree} days`);
  ok(JSON.stringify(changes) === JSON.stringify(want), `VAT ${c}: changes ${changes} not ${want}`);
  out.vat[c] = { dax, changes, daysAt, disagree };
});
// the edges, one by one (the day before and the day of each change)
[['ksa', '2020-06-30', 5], ['ksa', '2020-07-01', 15], ['bhr', '2021-12-31', 5], ['bhr', '2022-01-01', 10], ['omn', '2021-04-15', 0], ['omn', '2021-04-16', 5], ['uae', '2017-12-31', 0], ['uae', '2018-01-01', 5], ['qat', '2026-11-03', 0], ['kwt', '2026-11-03', 0]]
  .forEach(([c, d, r]) => ok(evalVatDax(out.vat[c].dax, parse(d)) === r, `VAT ${c} on ${d} is not ${r}`));

// ---------- Part 3: pegs (units of the currency per 1 US dollar) ----------
// each the central bank's own figure (section b); KWD has no fixed rate: a basket, never written as a number
const PEGS = {
  checked: '2026-11-03',
  usd: { AED: { perUsd: 3.6725, bank: 'CBUAE' }, SAR: { perUsd: 3.75, bank: 'SAMA' }, QAR: { perUsd: 3.64, bank: 'QCB' },
    BHD: { perUsd: 0.376, bank: 'CBB' }, OMR: { perUsd: 0.3845, bank: 'CBO', usdPer: 2.6008 } },
  basket: { KWD: { bank: 'CBK', since: '2007-05-20', said: 'an undisclosed weighted basket of currencies; no fixed rate' } }
};
// Oman's bank states USD per rial: the two must agree to the 4th decimal
ok(Math.abs(1 / PEGS.usd.OMR.usdPer - PEGS.usd.OMR.perUsd) < 5e-5, 'OMR: 1 / 2.6008 is not 0.3845');
ok(!('KWD' in PEGS.usd), 'KWD written as a fixed rate');
out.pegs = { ...PEGS, omrInverse: +(1 / PEGS.usd.OMR.usdPer).toFixed(6) };

fs.writeFileSync(path.join(os.tmpdir(), 'rd5-result.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
console.log(`${fails ? 'FAIL' : 'PASS'}  rd5-prototype  ${checks} checks`);
process.exit(fails ? 1 : 0);
