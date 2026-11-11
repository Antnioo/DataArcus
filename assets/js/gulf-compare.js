/*
 * DataArcus - two periods compared in the Gulf (0.3.3 IX1; a library: no page and no tool loads it yet).
 * A comparison by Gregorian dates (this March against last March, this month against the month before) sets two
 * periods side by side that are often not like for like here: Ramadan moves about 11 days earlier each year, the Eids
 * move with it, a country's weekend or its VAT rate changed on a known day. For each month of a year and the month
 * `back` months earlier, this file counts, from gulf-dates.js only:
 *   ramadan  the Ramadan days each month holds          fitr  the Eid al-Fitr days (1 to 3 Shawwal)
 *   adha     the Eid al-Adha days (10 to 13 Dhu al-Hijjah)
 *   weekend  the official weekend in each month, when a country is given and the two differ
 *   vat      the standard VAT rates in force in each month, when a country is given and the two differ
 * Each pair is [this month, the month it is compared with]. A month is `estimated` when a date it counts is not
 * announced yet (gulf-dates.js: after `checked`, the Umm al-Qura calendar's date). The dates are the UAE's
 * announcements, a country's own where gulf-dates.js has them (Oman). Nothing is read but that table: no model, no
 * data; a caller says which year. Outside the table's years nothing is counted, and why is said.
 *   monthsCompared({ year, back, country })   back: 12 (a year back, the default), 3, 1 ...; negative: ahead
 *   rangeCompared({ from, to, back, country }) the same by year: how many months differ
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./gulf-dates.js'));
  else root.DataArcusGulfCompare = factory(root.DataArcusGulfDates);
})(typeof self !== 'undefined' ? self : this, function (GD) {
  'use strict';
  const DAY = 864e5;
  const T = (s) => Date.parse(s + 'T00:00:00Z');
  const iso = (t) => new Date(t).toISOString().slice(0, 10);
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const FITR_DAYS = 3, ADHA_DAYS = 4;   // the calendar's own flags (gulf-measures.js: 1-3 Shawwal, 10-13 Dhu al-Hijjah)
  // the Gregorian years the table holds whole: from its first Ramadan's year to its last Eid al-Adha's
  const RANGE = { first: +GD.events[0].ramadan.slice(0, 4), last: Math.max.apply(null, GD.events.filter((e) => e.adha).map((e) => +e.adha.slice(0, 4))) };
  const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // each day that is Ramadan or an Eid day, for one country's dates: { 'R2026-02-18': estimated?, ... }; built once a country
  const cache = {};
  function daysOf(country) {
    const code = own(GD.own, country) ? country : 'uae';
    if (cache[code]) return cache[code];
    const days = {}, mine = (GD.own || {})[code] || [];
    GD.events.forEach((e0) => {
      const e = Object.assign({}, e0, mine.find((o) => o.hijriYear === e0.hijriYear) || {}), est = (k) => (e0.estimate || []).indexOf(k) >= 0;
      // Ramadan ends the day before Eid al-Fitr; with no Eid in the table yet, its first 29 days (it has 29 or 30)
      const end = e.fitr ? T(e.fitr) : T(e.ramadan) + 29 * DAY;
      for (let t = T(e.ramadan); t < end; t += DAY) days['R' + iso(t)] = est('ramadan') || (e.fitr ? est('fitr') : true);
      if (e.fitr) for (let i = 0; i < FITR_DAYS; i++) days['F' + iso(T(e.fitr) + i * DAY)] = est('fitr');
      if (e.adha) for (let i = 0; i < ADHA_DAYS; i++) days['A' + iso(T(e.adha) + i * DAY)] = est('adha');
    });
    return (cache[code] = { code, days });
  }
  // a rule list of gulf-dates.js (each holds from its date until the next): the rule in force on a day
  const ruleOn = (rules, t) => { let hit = null; rules.forEach((r) => { if (r.from === null || T(r.from) <= t) hit = r; }); return hit; };
  // one month (y, m from 1): its first and last day, its count of each kind of day and whether one is an estimate
  function monthOf(D, y, m) {
    const first = Date.UTC(y, m - 1, 1), last = Date.UTC(y, m, 0), out = { key: iso(first).slice(0, 7), first, last, R: 0, F: 0, A: 0, estimated: false };
    for (let t = first; t <= last; t += DAY) ['R', 'F', 'A'].forEach((k) => { const e = D.days[k + iso(t)]; if (e !== undefined) { out[k]++; if (e) out.estimated = true; } });
    return out;
  }
  // what holds in a month under a rule list: the distinct values on its first and its last day (a change inside it gives two)
  const inMonth = (rules, mo, pick) => { const a = pick(ruleOn(rules, mo.first)), b = pick(ruleOn(rules, mo.last)); return same(a, b) ? [a] : [a, b]; };
  const WHY = `The dates DataArcus keeps cover ${RANGE.first} to ${RANGE.last}: both periods must be inside them.`;

  function monthsCompared(o) {
    o = o || {};
    const year = Number(o.year), back = o.back === undefined || o.back === null ? 12 : Math.trunc(Number(o.back));
    const country = typeof o.country === 'string' && own(GD.weekends, o.country.toLowerCase()) ? o.country.toLowerCase() : null;
    const out = { known: false, year: Number.isInteger(year) ? year : null, back: Number.isFinite(back) ? back : null, country, dates: null, months: [], differ: null, estimated: null, checked: GD.checked,
      notChecked: country ? [] : ['The weekend and the VAT rate: no Gulf country was given.'] };
    const other = (m) => { const n = year * 12 + (m - 1) - back; return { y: Math.floor(n / 12), m: (n % 12 + 12) % 12 + 1 }; };
    if (!Number.isInteger(year) || !Number.isFinite(back) || back === 0 || [year, other(1).y, other(12).y].some((y) => y < RANGE.first || y > RANGE.last)) return Object.assign(out, { why: WHY });
    const D = daysOf(country), weekends = country ? GD.weekends[country] : null, vat = country && GD.vat && own(GD.vat.rates, country) ? GD.vat.rates[country] : null;
    for (let m = 1; m <= 12; m++) {
      const b = other(m), A = monthOf(D, year, m), B = monthOf(D, b.y, b.m);
      const row = { month: A.key, against: B.key, ramadan: [A.R, B.R], fitr: [A.F, B.F], adha: [A.A, B.A], weekend: null, vat: null };
      if (weekends) { const names = (mo) => inMonth(weekends, mo, (r) => r.days.map((d) => WEEKDAYS[d - 1])), a = names(A), z = names(B); if (!same(a, z)) row.weekend = [a.length === 1 ? a[0] : a, z.length === 1 ? z[0] : z]; }
      if (vat) { const a = inMonth(vat, A, (r) => r.rate), z = inMonth(vat, B, (r) => r.rate); if (!same(a, z)) row.vat = [a, z]; }
      row.differs = A.R !== B.R || A.F !== B.F || A.A !== B.A || !!row.weekend || !!row.vat;
      row.estimated = row.differs && (A.estimated || B.estimated);
      out.months.push(row);
    }
    out.known = true; out.dates = D.code;
    out.differ = out.months.filter((r) => r.differs).length;
    out.estimated = out.months.filter((r) => r.estimated).length;
    return out;
  }

  // the same by year, from `from` to `to` (kept inside the table's years): [{ year, differ, estimated }], and the totals
  function rangeCompared(o) {
    o = o || {};
    const back = o.back === undefined || o.back === null ? 12 : o.back, years = [];
    const from = Math.max(RANGE.first, Number.isInteger(o.from) ? o.from : RANGE.first), to = Math.min(RANGE.last, Number.isInteger(o.to) ? o.to : RANGE.last);
    for (let y = from; y <= to; y++) { const c = monthsCompared({ year: y, back, country: o.country }); if (c.known) years.push({ year: y, differ: c.differ, estimated: c.estimated }); }
    return { back, years, months: years.length * 12, differ: years.reduce((n, y) => n + y.differ, 0), estimated: years.reduce((n, y) => n + y.estimated, 0), checked: GD.checked };
  }

  return { monthsCompared, rangeCompared, RANGE, CHECKED: GD.checked, WEEKDAYS, FITR_DAYS, ADHA_DAYS };
});
