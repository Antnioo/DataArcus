/*
 * DataArcus - two periods compared in the Gulf (0.3.3 IX1; check_report's likeForLike since IX2; the page
 * tools/gulf-like-for-like.html since IX4).
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
 *   monthOn({ year, month, country })   (0.3.3 IX4, the website's page) one month on its own: its counts, and for a
 *                                      country the weekend days it holds, the weekend's days and the VAT rate
 *   eventsOf(country)                  the table's Hijri years with a country's own dates over the UAE's
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

  // a country code as the weekend list knows it (lower case), or null
  const countryOf = (c) => (typeof c === 'string' && own(GD.weekends, c.toLowerCase()) ? c.toLowerCase() : null);
  // the table's Hijri years with a country's own dates over the UAE's; each keeps the UAE row's `estimate` list
  const eventsOf = (country) => { const mine = (GD.own || {})[own(GD.own, country) ? country : 'uae'] || []; return GD.events.map((e0) => Object.assign({}, e0, mine.find((o) => o.hijriYear === e0.hijriYear) || {})); };
  // each day that is Ramadan or an Eid day, for one country's dates: { 'R2026-02-18': estimated?, ... }; built once a country
  const cache = {};
  function daysOf(country) {
    const code = own(GD.own, country) ? country : 'uae';
    if (cache[code]) return cache[code];
    const days = {};
    eventsOf(code).forEach((e) => {
      const est = (k) => (e.estimate || []).indexOf(k) >= 0;
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
    const country = countryOf(o.country);
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

  // one month on its own (0.3.3 IX4): its Ramadan, Eid al-Fitr and Eid al-Adha days and whether a day counted is an
  // estimate; for a country, the weekend days it holds (each day under the weekend rule in force that day), the weekend's
  // days and the standard VAT rate(s) in force in it (two when one changed inside the month). Outside the table: not known.
  function monthOn(o) {
    o = o || {};
    const year = Number(o.year), month = Number(o.month), country = countryOf(o.country);
    const out = { known: false, month: null, country, ramadan: null, fitr: null, adha: null, estimated: null, weekendDays: null, weekend: null, vat: null };
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12 || year < RANGE.first || year > RANGE.last) return Object.assign(out, { why: WHY });
    const D = daysOf(country), A = monthOf(D, year, month);
    Object.assign(out, { known: true, month: A.key, ramadan: A.R, fitr: A.F, adha: A.A, estimated: A.estimated });
    if (country) {
      const rules = GD.weekends[country];
      let n = 0;
      for (let t = A.first; t <= A.last; t += DAY) if (ruleOn(rules, t).days.indexOf(new Date(t).getUTCDay() + 1) >= 0) n++;
      out.weekendDays = n;
      out.weekend = inMonth(rules, A, (r) => r.days.map((d) => WEEKDAYS[d - 1]));
      if (GD.vat && own(GD.vat.rates, country)) out.vat = inMonth(GD.vat.rates[country], A, (r) => r.rate);
    }
    return out;
  }

  return { monthsCompared, rangeCompared, monthOn, eventsOf, RANGE, CHECKED: GD.checked, WEEKDAYS, FITR_DAYS, ADHA_DAYS };
});
