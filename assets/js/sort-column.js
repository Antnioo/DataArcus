/* DataArcus sort-column (0.3.2 DD1H): which column sorts this month or day name? The one rule, in one place.
 * Month and weekday names sort A to Z unless the model gives them a sort-by column. For such a column without one,
 * sortColumnFor finds the number column of the same table to sort by: a year-month number for "Month Year", a weekday
 * number for a day name, a month number for a month name; a Hijri or fiscal name only by a Hijri or fiscal number; the
 * Gulf calendar's Arabic name columns ("Day Name (Arabic)") are the same kind of name as their English ones. A column
 * whose type is unknown (a DAX table's) counts only when its name says it is a number ("Month Number", "Day of Week").
 * The report writer (field-catalog.js) and the Model Health Check's fix script (model-health-tmdl.js) both read it here
 * (the owner, D-1104-12 and D-1016-01: one place). Pure: column metadata in, a column out; nothing is read or changed.
 * Browser and Node (module.exports / window.DASortColumn). */
(function (root) {
  'use strict';
  const NAME_LIKE = /(^|\s|_)(month|day|weekday)\s*_?(name|short)$|^(day of week|weekday|mmm|mmmm)$|short\s*month|month\s*-?\s*year|^month\s*year$|^(اسم\s*)?(الشهر|اليوم)$/i;
  const sortKind = (name) => (/month|الشهر/i.test(name) && /year|السنة/i.test(name) ? 'yearMonth' : /day|week|اليوم/i.test(name) ? 'day' : 'month');
  const SORT_BY = {
    yearMonth: /^(year\s*-?\s*month|month\s*-?\s*year|yyyymm)\s*(no|num|number|index|key|sort|order|id)?$/i,
    day: /(weekday|day\s*of\s*week)\s*(no|num|number|index)?$|^weekday$|^رقم\s*اليوم$/i,
    month: /month\s*(no|num|number|index)$|^month$|month\s*of\s*year|^رقم\s*الشهر$/i
  };
  const FAMILY = /hijri|fiscal|هجري|مالي/i;
  const family = (n) => (String(n).match(FAMILY) || [''])[0].toLowerCase();
  const ARABIC_SUFFIX = /\s*\((arabic|عربي)\)\s*$/i;
  const nameLike = (name) => NAME_LIKE.test(String(name).replace(ARABIC_SUFFIX, '').replace(FAMILY, '').trim());
  // a column's type, lower case; a column given with none is unknown, never text (mcp/docs/RULES-POWERBI.md: a missing
  // type defaulted to text gives wrong findings). A caller with its own reader passes it as typeOf.
  const colType = (c) => String((c && c.dataType) || 'unknown').toLowerCase();
  const NUMBER_NAME = /(no|num|number|index|key|sort|order|id)$|day\s*of\s*week|month\s*of\s*year|^رقم/i;
  // columns: the table's columns ({ name, dataType, ... }), or none (then null); name: the name column to sort
  function sortColumnFor(columns, name, typeOf) {
    if (!nameLike(name)) return null;
    const kind = sortKind(name), fam = family(name), type = typeof typeOf === 'function' ? typeOf : colType;
    const plain = (c) => String(c.name).replace(FAMILY, '').trim();
    const ok = (c) => c.name !== name && family(c.name) === fam && SORT_BY[kind].test(plain(c)) && (/^(int64|double|decimal|number)$/.test(type(c)) || (type(c) === 'unknown' && NUMBER_NAME.test(plain(c))));
    return (columns || []).find(ok) || null;
  }
  const api = { NAME_LIKE, sortKind, SORT_BY, FAMILY, family, ARABIC_SUFFIX, nameLike, colType, sortColumnFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DASortColumn = api;
})(typeof self !== 'undefined' ? self : this);
