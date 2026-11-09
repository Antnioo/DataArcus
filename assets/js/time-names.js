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
  const api = Object.freeze({ TIME_WORDS, wordsOf, isTimeName });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DATimeNames = api;
})(typeof self !== 'undefined' ? self : this);
