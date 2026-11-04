/*
 * DataArcus - Ramadan and Eid measures (shared by the DAX Measure Builder page and the MCP's add_gulf_calendar).
 * The same Ramadan days of the Hijri year before (Hijri Year - 1 and Ramadan Day, TREATAS), its growth on Ramadan days
 * only, and the Eid al-Fitr and Eid al-Adha windows (7 days before, 3 or 4 Eid days) with last year's and the growth.
 * They need the DataArcus calendar table (Hijri Year, Hijri Month Number, Hijri Day, Ramadan Day, Is Ramadan).
 * Measured (RD5, 3 Nov 2026, made-up data): this pairing is right on 379 of 383 Ramadan days 1439-1451, the 4 others
 * day 30 after a 29-day Ramadan (no partner: blank); SAMEPERIODLASTYEAR pairs 0 of 383 right.
 * (0.3.2 GM1) Moved out of measure-builder.js, its output byte for byte the page's (scripts/tests/capture-gm1-baseline.mjs).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DataArcusGulfMeasures = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // ---------- DAX name helpers (the Measure Builder's) ----------
  const tbl = (t) => "'" + String(t || '').trim().replace(/'/g, "''") + "'";
  const colRef = (t, c) => `${tbl(t)}[${String(c || '').trim().replace(/]/g, ']]')}]`;
  const mRef = (m) => `[${String(m || '').trim().replace(/]/g, ']]')}]`;

  // Eid windows: the days before each Eid plus the Eid days (Eid al-Fitr: 1-3 Shawwal, Eid al-Adha: 10-13 Dhu al-Hijjah,
  // as the calendar's flags), for the Eids whose first day is in view, so a month or a year shows the Eid it holds.
  // Last year: the Eid of the previous Hijri year of each Eid in view, looked up in the whole calendar.
  // x: { c: the calendar table as DAX ('Calendar'), d: its date column as DAX, ref: (id) => a sibling measure as DAX }
  const eidDax = (b, x, month, day, eidDays, lastYear) => {
    const c = x.c, d = x.d, hm = `${c}[Hijri Month Number] = ${month}`, hd = `${c}[Hijri Day] = ${day}`;
    const eids = lastYear
      ? `VAR _Years =\n    SELECTCOLUMNS (\n        FILTER ( ${c}, ${hm} && ${hd} ),\n        "@Year", ${c}[Hijri Year] - 1\n    )\nVAR _Eids =\n    SELECTCOLUMNS (\n        FILTER ( ALL ( ${c} ), ${hm} && ${hd} && ${c}[Hijri Year] IN _Years ),\n        "@Eid", ${d}\n    )`
      : `VAR _Eids =\n    SELECTCOLUMNS (\n        FILTER ( ${c}, ${hm} && ${hd} ),\n        "@Eid", ${d}\n    )`;
    return `VAR _DaysBefore = 7\nVAR _EidDays = ${eidDays}\n${eids}\nVAR _Window =\n    FILTER (\n        ALL ( ${d} ),\n        VAR _Day = ${d}\n        RETURN\n            NOT ISEMPTY (\n                FILTER ( _Eids, _Day >= [@Eid] - _DaysBefore && _Day <= [@Eid] + _EidDays - 1 )\n            )\n    )\nRETURN\n    IF (\n        NOT ISEMPTY ( ${lastYear ? '_Years' : '_Eids'} ),\n        CALCULATE ( ${b}, REMOVEFILTERS ( ${c} ), _Window )\n    )`;
  };
  const eidPct = (w, ly) => (b, x) => { const W = x.ref(w), L = x.ref(ly); return `DIVIDE ( ${W} - ${L}, ${L} )`; };

  // Each pattern: id, group, name suffix, what it does (English; the page has its Arabic), percent, needs, dax (b: the
  // base measure as DAX; x as above). The order is the page's.
  const PATTERNS = [
    { id: 'ramLY', g: 'Ramadan', suffix: 'Last Ramadan',
      what: 'Same Ramadan days last Hijri year. Put Ramadan Day on the axis to compare day by day. Needs the DataArcus calendar table.',
      // The Ramadan days in view (Hijri year + day, so a year with two Ramadans keeps both), moved back one Hijri year.
      // Not MAX ( Hijri Year ): on a card or total row that is the latest year in view, often the Ramadan in view itself.
      dax: (b, x) => { const c = x.c; return `VAR _RamadanDays =\n    FILTER (\n        SUMMARIZE ( ${c}, ${c}[Hijri Year], ${c}[Ramadan Day] ),\n        NOT ISBLANK ( ${c}[Ramadan Day] )\n    )\nVAR _SameDaysLastYear =\n    SELECTCOLUMNS (\n        _RamadanDays,\n        "Hijri Year", ${c}[Hijri Year] - 1,\n        "Ramadan Day", ${c}[Ramadan Day]\n    )\nRETURN\n    CALCULATE (\n        ${b},\n        REMOVEFILTERS ( ${c} ),\n        TREATAS ( _SameDaysLastYear, ${c}[Hijri Year], ${c}[Ramadan Day] )\n    )`; } },
    { id: 'ramPct', g: 'Ramadan', suffix: 'vs Last Ramadan %', pct: true, needs: ['ramLY'],
      what: 'Growth of the Ramadan days in view vs the same days of last Ramadan. Days outside Ramadan are left out, so a card filtered to a year compares the two Ramadans.',
      // only the Ramadan days count on this side too, or a year card divides the whole year by one Ramadan
      dax: (b, x) => `VAR _ThisRamadan = CALCULATE ( ${b}, KEEPFILTERS ( ${x.c}[Is Ramadan] = TRUE () ) )\nVAR _LastRamadan = ${x.ref('ramLY')}\nRETURN\n    DIVIDE ( _ThisRamadan - _LastRamadan, _LastRamadan )` },
    { id: 'eidFitr', g: 'Eid', suffix: 'Eid al-Fitr Window',
      what: 'The 7 days before Eid al-Fitr and its 3 days, for each Eid whose first day is in view. Needs the DataArcus calendar table.',
      dax: (b, x) => eidDax(b, x, 10, 1, 3, false) },
    { id: 'eidFitrLY', g: 'Eid', suffix: 'Eid al-Fitr Window Last Year',
      what: 'The same Eid al-Fitr window in the previous Hijri year, for each Eid in view.',
      dax: (b, x) => eidDax(b, x, 10, 1, 3, true) },
    { id: 'eidFitrPct', g: 'Eid', suffix: 'Eid al-Fitr Window vs Last Year %', pct: true, needs: ['eidFitr', 'eidFitrLY'],
      what: 'Growth of the Eid al-Fitr window vs last year’s.', dax: eidPct('eidFitr', 'eidFitrLY') },
    { id: 'eidAdha', g: 'Eid', suffix: 'Eid al-Adha Window',
      what: 'The 7 days before Eid al-Adha and its 4 days (10 to 13 Dhu al-Hijjah), for each Eid whose first day is in view. Needs the DataArcus calendar table.',
      dax: (b, x) => eidDax(b, x, 12, 10, 4, false) },
    { id: 'eidAdhaLY', g: 'Eid', suffix: 'Eid al-Adha Window Last Year',
      what: 'The same Eid al-Adha window in the previous Hijri year, for each Eid in view.',
      dax: (b, x) => eidDax(b, x, 12, 10, 4, true) },
    { id: 'eidAdhaPct', g: 'Eid', suffix: 'Eid al-Adha Window vs Last Year %', pct: true, needs: ['eidAdha', 'eidAdhaLY'],
      what: 'Growth of the Eid al-Adha window vs last year’s.', dax: eidPct('eidAdha', 'eidAdhaLY') }
  ];
  const byId = (id) => PATTERNS.find((p) => p.id === id);

  /**
   * The 8 measures for one base measure, in the page's order: [{ id, name, expression, what, pct, g }].
   * o: { base (the measure's name), cal (the calendar table's name), dateColumn (default "Date"), nameOf (optional:
   * (id, wanted name) => the name to use, so a caller can avoid names a model has; references follow it) }
   */
  function measuresFor(o) {
    const names = {}, nameOf = o.nameOf || ((id, want) => want);
    PATTERNS.forEach((p) => { names[p.id] = nameOf(p.id, `${String(o.base).trim()} ${p.suffix}`); });
    const x = { c: tbl(o.cal), d: colRef(o.cal, o.dateColumn || 'Date'), ref: (id) => mRef(names[id]) };
    return PATTERNS.map((p) => ({ id: p.id, name: names[p.id], expression: p.dax(mRef(o.base), x), what: p.what, pct: !!p.pct, g: p.g }));
  }

  return { PATTERNS, byId, measuresFor, tbl, colRef, mRef };
});
