/*
 * DataArcus - Arabic calendar columns (0.3.0 C1, the owner, 21 Oct 2026: "we can't control English values in data in
 * the AR report, but we can introduce some columns in the calendar that we work with Arabic columns").
 * One builder for the Arabic twins of a date table's text columns and flags, shared by the Calendar Generator (the
 * website and the MCP's add_gulf_calendar: columns of its DAX table) and the MCP's script for a user's own date table
 * (calculated columns, never applied by DataArcus). Each twin is named "<English name> (Arabic)"; digits stay Western,
 * as in every Arabic report DataArcus writes. Nothing here reads a data value: the columns are chosen by name and type.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.DataArcusArabicCalendar = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];   // WEEKDAY type 1: 1 = Sunday
  const HIJRI = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
  const QUARTER = 'الربع', FISCAL_YEAR = 'السنة المالية', FISCAL_QUARTER = 'الربع المالي';
  // a flag's two labels (true, false). An Eid flag's false is «أيام أخرى» ("other days"): a pill reading «لا» ("no")
  // alone says nothing of what it answers, and «—» reads as a blank value
  // (0.3.0 F7, the E1 Arabic review's F-4) each pair says exactly the flag's true and false: a public holiday on a weekday
  // is not a working day and not the weekend, so Is Working Day's false is «يوم عطلة» (a day off: a weekend or a
  // holiday) and Is Weekend's false «خارج عطلة نهاية الأسبوع» (not the weekend), as Ramadan's is «خارج رمضان»
  const FLAGS = {
    'is weekend': ['عطلة نهاية الأسبوع', 'خارج عطلة نهاية الأسبوع'],
    'is working day': ['يوم عمل', 'يوم عطلة'],
    'is ramadan': ['رمضان', 'خارج رمضان'],
    'is eid al-fitr': ['عيد الفطر', 'أيام أخرى'],
    'is eid al-adha': ['عيد الأضحى', 'أيام أخرى']
  };
  const SUFFIX = ' (Arabic)';
  const arabicOf = (name) => String(name) + SUFFIX;
  const key = (s) => String(s == null ? '' : s).replace(/[\s_]+/g, ' ').trim().toLowerCase();
  // the kinds of text column a date table has, by the English column's name
  const KINDS = [
    [/^month name$/, 'month'], [/^month short$/, 'month'], [/^day name$/, 'day'], [/^day short$/, 'day'],
    [/^quarter$/, 'quarter'], [/^year quarter$/, 'yearQuarter'], [/^fiscal year$/, 'fiscalYear'], [/^fiscal quarter$/, 'fiscalQuarter'],
    [/^hijri month name$/, 'hijri']
  ];
  const kindOf = (name) => { const k = key(name); if (Object.prototype.hasOwnProperty.call(FLAGS, k)) return 'flag'; const x = KINDS.find(([re]) => re.test(k)); return x ? x[1] : null; };
  const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  const sw = (expr, list) => `SWITCH ( ${expr}, ${list.map((v, i) => `${i + 1}, ${q(v)}`).join(', ')} )`;
  // (0.3.0 P7, J18's rule, terminology.mjs isolateLatin) a digit run inside an Arabic text in a first-strong isolate
  // (U+2068 ... U+2069), and a right-to-left mark (U+200F) beside a run at either end of the text, so it reads in its place
  // inside a pill: «2025 الربع 1» as RLM FSI 2025 PDI « الربع » FSI 1 PDI RLM
  const isoNum = (expr) => `UNICHAR ( 8296 ) & ${expr} & UNICHAR ( 8297 )`, RLM = 'UNICHAR ( 8207 )';
  const atStart = (dax) => `${RLM} & ${dax}`, atEnd = (dax) => `${dax} & ${RLM}`;

  /**
   * The Arabic twins a date table gets.
   * o.columns: the table's columns [{ name, type, sortBy }] (type as the model has it: 'boolean', 'string', 'int64'...;
   *   sortBy: the column it is sorted by, if any).
   * o.src: DAX of the values the twins are made from: { month, weekday (type 1), quarter, year, hijriMonth?,
   *   fiscalMonth?, fiscalYearNo?, fiscalYearText?, fiscalQuarterText?, flag(name)? } (an expression, or null).
   * o.sorts: the number columns a twin of a kind may sort by when its English column has no sort: { month, day, hijri }.
   * Returns { columns: [{ name, of, kind, dax, sortBy, sortNew? }], skipped: [{ of, why }] }: sortNew is a hidden number
   * column to write first ({ name, dax }), when the twin needs an order and the table has none to give.
   */
  function columnsFor(o) {
    const cols = (o && o.columns) || [], src = (o && o.src) || {}, sorts = (o && o.sorts) || {};
    const has = new Set(cols.map((c) => key(c.name))), out = [], skipped = [];
    cols.forEach((c) => {
      const kind = kindOf(c.name); if (!kind) return;
      const name = arabicOf(c.name);
      if (has.has(key(name))) return;   // its Arabic twin is there already
      const t = String(c.type || '').toLowerCase();
      let dax = null, order = null, why = null;
      if (kind === 'month') { dax = src.month && sw(src.month, MONTHS); order = { by: sorts.month, dax: src.month }; }
      else if (kind === 'day') { dax = src.weekday && sw(src.weekday, DAYS); order = { by: sorts.day, dax: src.weekday }; }
      else if (kind === 'hijri') { dax = src.hijriMonth && sw(src.hijriMonth, HIJRI); order = { by: sorts.hijri, dax: src.hijriMonth }; if (!dax) why = 'no Hijri month number to name'; }
      else if (kind === 'quarter') dax = src.quarter && atEnd(`${q(QUARTER + ' ')} & ${isoNum(src.quarter)}`);
      else if (kind === 'yearQuarter') dax = src.year && src.quarter && atEnd(atStart(`${isoNum(src.year)} & ${q(' ' + QUARTER + ' ')} & ${isoNum(src.quarter)}`));
      else if (kind === 'fiscalYear') { dax = src.fiscalYearNo ? atEnd(`${q(FISCAL_YEAR + ' ')} & ${isoNum(src.fiscalYearNo)}`) : src.fiscalYearText ? atEnd(`${q(FISCAL_YEAR + ' ')} & ${isoNum(src.fiscalYearText)}`) : null; if (!dax) why = 'no fiscal year to name'; }
      else if (kind === 'fiscalQuarter') { dax = src.fiscalMonth ? atEnd(`${q(FISCAL_QUARTER + ' ')} & ${isoNum(`ROUNDUP ( ( ${src.fiscalMonth} ) / 3, 0 )`)}`) : src.fiscalQuarterText ? atEnd(`${q(FISCAL_QUARTER + ' ')} & ${isoNum(src.fiscalQuarterText)}`) : null; if (!dax) why = 'no fiscal month number to count its quarter from'; }
      else if (kind === 'flag') {
        const f = src.flag ? src.flag(c.name) : null, [yes, no] = FLAGS[key(c.name)];
        if (f && (t === 'boolean' || src.flagTyped === false)) dax = `IF ( ${f}, ${q(yes)}, ${q(no)} )`;
        else why = t && t !== 'boolean' ? `it is a ${t} column, not true/false: its labels can't be told from its type` : 'its type is not known';
      }
      if (!dax) { skipped.push({ of: c.name, why: why || 'its values can\'t be made from the date' }); return; }
      const col = { name, of: c.name, kind, dax, sortBy: null };
      if (order) {
        if (c.sortBy) col.sortBy = c.sortBy;
        else if (order.by && has.has(key(order.by))) col.sortBy = order.by;
        else { col.sortBy = name + ' Order'; col.sortNew = { name: name + ' Order', dax: order.dax }; }
      }
      out.push(col);
    });
    return { columns: out, skipped };
  }
  return { MONTHS, DAYS, HIJRI, QUARTER, FISCAL_YEAR, FISCAL_QUARTER, FLAGS, SUFFIX, arabicOf, kindOf, columnsFor };
});
