/* DataArcus time names: is a column, by its name, a date part (a day, a week, a month, a quarter, a year, a date)?
 * Answered in one place (0.3.2 DD1A; the owner D-1104-15 "one time test for all four places", D-1104-12 "we create a
 * library of functions where a place calls them so if we need to fix something we fix it at the source", D-1016-01).
 *   wordsOf(name)     the name's words, lower case: split at camel case (OrderDate -> order date, FYTotal -> fy total),
 *                     "_", "-", spaces, digits and marks; the Arabic article «ال» taken off a word of 3 letters or more
 *                     (التاريخ -> تاريخ); Arabic short vowels and the tatweel dropped, «أ إ آ» read as «ا» (اسبوع = أسبوع)
 *   isTimeName(name)  true when one of its words is in TIME_WORDS (whole words only: Holiday, Today, Candidate are not)
 *                     «عام» (year, and also "general") counts only as the FIRST word of a name («العام», «عام 2024»),
 *                     never after another word («المدير العام», «القطاع العام»): an Arabic adjective follows its noun
 *                     (owner D-1105-04, TN2). «أعوام» (only "years") counts anywhere.
 *   isDateName(name)  (0.3.3 AU2, AUD-051) does the name read as a date, not a part of one (the twin's date table column
 *                     whose type the model read does not know: is it a date axis): English as mirror-policy's DATE_LIKE
 *                     read it (ends in "date" or "day" as a word, starts with "date", "start of X", "X start": RepeatIQ's
 *                     StartOfMonth, "Order Date", "Month Start", "Day"; not "Year", "Day of Week", "Day Name"); Arabic,
 *                     the noun first: a first word «تاريخ» («تاريخ الطلب»), «يوم» alone or before a word that is not a
 *                     time word («اليوم», «يوم الطلب»; not «يوم الأسبوع»), «بداية» before a time word («بداية الشهر»;
 *                     «عام» there only as a first word, D-1105-04, so not «بداية العام»). Not «اليومية», «تاريخي»
 *   isWeekdayName(name) (AU2, B-402) is it the days of the week by name (the heatmap's rows): English as report-mirror's
 *                     WEEKDAY read it (Weekday, Week Day, Day Name, Day of (the) Week, DayOfWeek, Weekday Name), the
 *                     name trimmed; Arabic: the words «يوم أسبوع», «اسم يوم», «اسم يوم أسبوع» («يوم الأسبوع», «اسم اليوم»)
 *   TIME_WORDS        the one list: date, day, weekday, week, month, quarter, qtr, year, yr, fy, period, hijri and
 *                     تاريخ، يوم، أسبوع، شهر، ربع، سنة، عام، فترة، هجري, each with its plural
 * The name only: what a place knows first (a date table, the field picker's time or kind mark) stays first in its own
 * code. Pure: no state, never throws, reads names only, never a data value. The ledger: mcp/docs/CONTRACTS.md (1a);
 * the test: mcp/test-0.3.2-dd1a.mjs. Browser, worker and Node (module.exports / window.DATimeNames / self.DATimeNames). */
(function (root) {
  'use strict';
  const ALEF = /[أإآ]/g;
  const MARKS = /[ً-ٰٟـ]/g;
  const fold = (w) => w.replace(MARKS, '').replace(ALEF, 'ا');
  const EN = ['date', 'day', 'weekday', 'week', 'month', 'quarter', 'qtr', 'year', 'yr', 'fy', 'period'];
  const AR = ['تاريخ', 'تواريخ', 'يوم', 'أيام', 'أسبوع', 'أسابيع', 'شهر', 'شهور', 'أشهر', 'ربع', 'أرباع', 'سنة', 'سنوات', 'سنين',
    'عام', 'أعوام', 'فترة', 'فترات', 'هجري', 'هجرية'];
  const TIME_WORDS = Object.freeze(EN.concat(EN.map((w) => w + 's'), ['hijri'], AR));
  const SET = new Set(TIME_WORDS.map(fold));
  const wordsOf = (name) => (typeof name === 'string' || typeof name === 'number' ? fold(String(name)) : '')
    .replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').toLowerCase()
    .split(/[^a-zء-يٮ-ۓ]+/).filter(Boolean).map((w) => w.replace(/^ال(?=..)/, ''));
  const AAM = fold('عام');
  const isTimeName = (name) => wordsOf(name).some((w, i) => SET.has(w) && (w !== AAM || i === 0));
  // (0.3.3 AU2) a date, a weekday: the English rules as the mirror held them (c21df8d5), unchanged; the Arabic by words
  const DATE_EN = /(?:^|[\s_])(?:date|day)$|^date|start ?of ?[a-z]+$|startof[a-z]*$|(?:^|[\s_])[a-z]* ?start$/i;
  const WEEKDAY_EN = /^(week ?day|day ?name|day of (the )?week|dayofweek|week ?day name)$/i;
  const TARIKH = fold('تاريخ'), YAWM = fold('يوم'), BIDAYA = fold('بداية'), USBU = fold('أسبوع'), ISM = fold('اسم');
  const isWeekdayName = (name) => {
    if (typeof name !== 'string') return false;
    if (WEEKDAY_EN.test(name.trim())) return true;
    const w = wordsOf(name).join(' ');
    return w === YAWM + ' ' + USBU || w === ISM + ' ' + YAWM || w === ISM + ' ' + YAWM + ' ' + USBU;
  };
  const isDateName = (name) => {
    if (typeof name !== 'string') return false;
    if (DATE_EN.test(name)) return true;
    const w = wordsOf(name);
    if (!w.length || isWeekdayName(name)) return false;
    const time2 = w.length > 1 && SET.has(w[1]) && w[1] !== AAM;
    return w[0] === TARIKH || (w[0] === YAWM && !time2) || (w[0] === BIDAYA && time2);
  };
  const api = Object.freeze({ TIME_WORDS, wordsOf, isTimeName, isDateName, isWeekdayName });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DATimeNames = api;
})(typeof self !== 'undefined' ? self : this);
