/*! DataArcus label limits | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// A column chart or a bar chart, from the category labels' measured limits (0.3, J11; B-140 option B). Browser and Node
// (module.exports / window.DALabelLimits). Metadata only: the names' lengths come from what the model says (a month,
// a weekday, a quarter axis has known names), never from the data; a text category's names are not known, so it takes
// the writer's stand-in of 12 letters.
(function (root) {
  'use strict';
  // Measured in Power BI Desktop 2.159 on the laptop (108 charts; the axis at the theme's label size, about 15pt on a
  // 1920-wide page): a column chart's width on the 1920 page, its number of categories, then the longest name in
  // characters that stays level on one line, and the longest that is never cut or slanted when it may wrap to 2 lines.
  // 0 is "<4": a 4-letter name already slanted, and nothing shorter was measured, so no name is taken to fit.
  const MEASURED = {
    en: [[400, 5, 4, 4], [400, 8, 0, 0], [400, 12, 0, 0], [600, 5, 8, 16], [600, 8, 4, 4], [600, 12, 0, 0], [900, 5, 16, 32], [900, 8, 8, 16], [900, 12, 4, 4]],
    ar: [[400, 5, 4, 4], [400, 8, 0, 0], [400, 12, 0, 0], [600, 5, 8, 24], [600, 8, 4, 4], [600, 12, 0, 0], [900, 5, 12, 32], [900, 8, 8, 24], [900, 12, 4, 4]]
  };
  const WIDTHS = [400, 600, 900], COUNTS = [5, 8, 12], PAGE = 1920, LABEL_PT = 15;
  // the laptop's rule from the same charts: labels slant when the room a category has is below 40 + 8.5 a letter (15pt)
  const RULE = { base: 40, letter: 8.5 };
  // the stand-in for a name the tools can't read (a text category): 12 letters, as the writer's tables and topCount
  const STAND_IN = 12;
  // the names of the axes whose names are known (the calendar generator's, and Power BI's short forms)
  const NAMES = {
    month: { en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      ar: (typeof module !== 'undefined' && module.exports ? require('./arabic-calendar.js') : root.DataArcusArabicCalendar).MONTHS },   // (0.3.1 SQ14) the one Arabic month list
    monthShort: { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
    day: { en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] },
    dayShort: { en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
    quarter: { en: ['Q1', 'Q2', 'Q3', 'Q4'] }
  };
  const NOUN = { month: 'months', monthShort: 'months', day: 'weekdays', dayShort: 'weekdays', quarter: 'quarters' };
  const AR = /[؀-ۿ]/;
  // a name's length in characters (as measured: letters, not bytes; direction marks not counted)
  const len = (s) => [...String(s == null ? '' : s)].filter((ch) => ch !== '‎' && ch !== '‏').length;
  const namesFor = (axis, lang) => { const n = NAMES[axis]; return n ? n[lang] || n.en : null; };

  // The limit at a width (of a 1920 page) and a count, never optimistic between the measured points. The table follows
  // the room a category has (px per category: 600 px with 5 and 900 with 8, 120 and 113 a category, have the same
  // limits; so have 400 with 5, 600 with 8 and 900 with 12, at 75 to 80), as the laptop's rule says (slant below 40 +
  // 8.5 a letter): the measured row with the most room at or below the chart's, the lower limit on a tie. A chart wider
  // than 900 is read by its room too (its value axis and padding take less of it: on the safe side). Narrower than 400 or
  // more than 12 categories is outside the table: null, the caller keeps its own rule.
  function limitAt(lang, width, count) {
    const rows = MEASURED[lang];
    if (!rows || !(width >= WIDTHS[0]) || !(count >= 1) || count > COUNTS[COUNTS.length - 1]) return null;
    const room = width / count, below = rows.filter((r) => r[0] / r[1] <= room + 1e-9);
    if (!below.length) return { room: Math.round(room), width: null, count: null, level: 0, wrap: 0 };   // less room than any measured: nothing fits
    const most = Math.max(...below.map((r) => r[0] / r[1])), at = below.filter((r) => r[0] / r[1] === most);
    const r = at.reduce((a, b) => (b[3] < a[3] || (b[3] === a[3] && b[2] < a[2]) ? b : a));
    return { room: Math.round(room), width: r[0], count: r[1], level: r[2], wrap: r[3] };
  }

  // decide({ lang, width, pageWidth, labelPt, count, axis, names, nameLength })
  //   lang      'en' or 'ar': the script of the names ('ar' rows for Arabic names); null when not known (both, the lower)
  //   width     the chart's width in page units, on a page pageWidth wide (scaled to the 1920 page of the measurements)
  //   labelPt   the axis label size on that page; larger than the measured one (scaled) is outside the table
  //   count     the categories the chart shows; null when not known: the table's worst row (12), said in why
  //   noun      what the categories are, for why ('months'); else the axis's, else 'categories'
  //   axis      'month', 'monthShort', 'day', 'dayShort', 'quarter': names known; else names, or nameLength, or the stand-in
  // returns { kind: 'column' | 'bar' | null, why, limit, nameLength, count, width } (kind null: outside the table)
  function decide(o) {
    o = o || {};
    const width = Math.round((+o.width || 0) * PAGE / (+o.pageWidth || PAGE));
    const list = o.axis ? namesFor(o.axis, o.lang === 'ar' ? 'ar' : 'en') : Array.isArray(o.names) && o.names.length ? o.names : null;
    const known = !!list || o.nameLength != null;
    const longest = list ? Math.max(...list.map(len)) : o.nameLength != null ? +o.nameLength : STAND_IN;
    const lang = o.lang === 'ar' || o.lang === 'en' ? o.lang : list && list.some((x) => AR.test(x)) ? 'ar' : list ? 'en' : null;
    const assumed = o.count == null || !(+o.count >= 1);
    const count = assumed ? (o.axis && list ? list.length : COUNTS[COUNTS.length - 1]) : +o.count;
    const noun = o.noun || (o.axis && NOUN[o.axis]) || 'categories';
    const what = `${count} ${noun}${assumed && !(o.axis && list) ? ' (count unknown: the measured table\'s worst row, 12, assumed)' : ''}`;
    const named = known ? `${longest} letters` : `names unknown, taken as ${STAND_IN} letters on one line`;
    const base = { width, count, nameLength: longest, assumedCount: assumed && !(o.axis && list) };
    if (o.labelPt != null && +o.labelPt * PAGE / (+o.pageWidth || PAGE) > LABEL_PT + 0.5) return Object.assign(base, { kind: null, limit: null, why: `outside the measured limits: labels larger than ${LABEL_PT}pt on a 1920 page` });
    // per language: the measured row at or below the chart's room; names known take its limit with wrapping, names not
    // known (the stand-in) its level limit, since a real name may be longer than the stand-in (D15: bank's 17-letter
    // "Debtconsolidation" was cut). Between two measured rows a name also stays level where the laptop's rule says so
    // (room >= 40 + 8.5 a letter) and the measured row above holds it level too: never past a measurement.
    const one = (lg) => {
      const at = limitAt(lg, width, count);
      if (!at) return null;
      const lim = known ? at.wrap : at.level, up = MEASURED[lg].filter((r) => r[0] / r[1] > width / count).sort((x, y) => x[0] / x[1] - y[0] / y[1] || x[2] - y[2])[0];
      const byRule = longest > lim && up && up[2] >= longest && width / count >= RULE.base + RULE.letter * longest;
      return Object.assign({}, at, { limit: byRule ? longest : lim, byRule: !!byRule, up: up ? { width: up[0], count: up[1] } : null });
    };
    // the language of the rows: the names' own; not known, the lower of the two (never optimistic)
    const at = lang ? one(lang) : (() => { const e = one('en'), a = one('ar'); return e && a ? (a.limit < e.limit ? a : e) : null; })();
    if (!at) return Object.assign(base, { kind: null, limit: null, why: `outside the measured limits: ${what} at ${width} px (measured from 400 px, up to 12 categories)` });
    const limit = at.limit, kind = longest <= limit ? 'column' : 'bar';
    const who = lang === 'ar' ? 'Arabic' : lang === 'en' ? 'English' : 'English and Arabic';
    const measured = at.byRule ? `${at.room} px a category; measured ${who}: between ${at.width} px with ${at.count} and ${at.up.width} px with ${at.up.count}, and the laptop's rule (${RULE.base} + ${RULE.letter} a letter) holds ${longest} letters level`
      : `${at.room} px a category; measured ${who}: ${limit ? `names up to ${limit} letters stay uncut${known ? '' : ' on one line'}` : 'even 4-letter names slant'} ${at.width ? `at ${Math.round(at.width / at.count)} px a category (${at.width} px with ${at.count})` : 'with less room than any measured chart'}`;
    const why = kind === 'column' ? `column: ${what} at ${width} px stay uncut (${named}; ${measured})`
      : `bar: ${what} at ${width} px would slant or be cut (${named}; ${measured})`;
    return Object.assign(base, { kind, limit, why });
  }

  const api = { MEASURED, WIDTHS, COUNTS, PAGE, LABEL_PT, RULE, STAND_IN, NAMES, limitAt, decide, len };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DALabelLimits = api;
})(typeof self !== 'undefined' ? self : this);
