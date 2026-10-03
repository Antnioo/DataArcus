/*
 * DataArcus - Gulf Calendar dates (shared by the Calendar Generator, its tests and the test model).
 * Ramadan's first day, Eid al-Fitr (1 Shawwal) and Eid al-Adha (10 Dhu al-Hijjah) as announced in the UAE,
 * 2018 to 2030, and the official weekend of each GCC country with the date each change took effect.
 * Every date and its source: scripts/gulf-calendar/DATES-SOURCES.md. Dates listed under `estimate` are not
 * announced yet: they are the Umm al-Qura calendar's dates, and the moon sighting can move them by a day.
 */
(function (root) {
  var GULF_DATES = {
    // the last date checked against an official announcement; update with DATES-SOURCES.md after each one
    checked: '2026-05-27',
    events: [
      { hijriYear: 1439, ramadan: '2018-05-17', fitr: '2018-06-15', adha: '2018-08-21' },
      { hijriYear: 1440, ramadan: '2019-05-06', fitr: '2019-06-04', adha: '2019-08-11' },
      { hijriYear: 1441, ramadan: '2020-04-24', fitr: '2020-05-24', adha: '2020-07-31' },
      { hijriYear: 1442, ramadan: '2021-04-13', fitr: '2021-05-13', adha: '2021-07-20' },
      { hijriYear: 1443, ramadan: '2022-04-02', fitr: '2022-05-02', adha: '2022-07-09' },
      { hijriYear: 1444, ramadan: '2023-03-23', fitr: '2023-04-21', adha: '2023-06-28' },
      { hijriYear: 1445, ramadan: '2024-03-11', fitr: '2024-04-10', adha: '2024-06-16' },
      { hijriYear: 1446, ramadan: '2025-03-01', fitr: '2025-03-30', adha: '2025-06-06' },
      { hijriYear: 1447, ramadan: '2026-02-18', fitr: '2026-03-20', adha: '2026-05-27' },
      { hijriYear: 1448, ramadan: '2027-02-08', fitr: '2027-03-09', adha: '2027-05-16', estimate: ['ramadan', 'fitr', 'adha'] },
      { hijriYear: 1449, ramadan: '2028-01-28', fitr: '2028-02-26', adha: '2028-05-05', estimate: ['ramadan', 'fitr', 'adha'] },
      { hijriYear: 1450, ramadan: '2029-01-16', fitr: '2029-02-14', adha: '2029-04-24', estimate: ['ramadan', 'fitr', 'adha'] },
      { hijriYear: 1451, ramadan: '2030-01-05', fitr: '2030-02-04', adha: '2030-04-13', estimate: ['ramadan', 'fitr', 'adha'] },
      // Ramadan 1452 starts in 2030; its Eids fall in 2031, outside the checked range
      { hijriYear: 1452, ramadan: '2030-12-26', estimate: ['ramadan'] }
    ],
    // Official (government) weekend by country: each rule holds from its date until the next one. Days are
    // WEEKDAY ( [Date], 1 ) numbers: 1 Sunday ... 5 Thursday, 6 Friday, 7 Saturday. The first rule is the weekend the
    // first change replaced; earlier history was not checked. Private companies can differ.
    weekends: {
      uae: [{ from: null, days: [5, 6] }, { from: '2006-09-01', days: [6, 7] }, { from: '2022-01-01', days: [7, 1] }],
      ksa: [{ from: null, days: [5, 6] }, { from: '2013-06-29', days: [6, 7] }],
      kwt: [{ from: null, days: [5, 6] }, { from: '2007-09-01', days: [6, 7] }],
      qat: [{ from: null, days: [5, 6] }, { from: '2003-08-01', days: [6, 7] }],
      bhr: [{ from: null, days: [5, 6] }, { from: '2006-09-01', days: [6, 7] }],
      omn: [{ from: null, days: [5, 6] }, { from: '2013-05-01', days: [6, 7] }]
    },
    // the day the UAE's federal government moved to the Saturday-Sunday weekend
    uaeWeekendChange: '2022-01-01'
  };
  if (typeof module === 'object' && module.exports) module.exports = GULF_DATES;
  else root.DataArcusGulfDates = GULF_DATES;
})(typeof globalThis !== 'undefined' ? globalThis : this);
