/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The report writer's fields and queries (0.2.9, audit 3's A3-12: build split into its query, sizing, page and notes
// modules; pbip-export.js puts them together): the PBIR values, a bound field's projection and title, the one DAX
// quoter (daxNames), each visual's query, its order and its filters, and the report's own measures (measures).
// Pure: no files, no sizes.
(function (root) {
  'use strict';

  // Schema versions from mid-2025, so the project also opens in Power BI Desktop builds that are about a year old
  const S = 'https://developer.microsoft.com/json-schemas/fabric/';
  const SCHEMA = {
    pbip: S + 'pbip/pbipProperties/1.0.0/schema.json',
    pbir: S + 'item/report/definitionProperties/2.0.0/schema.json',
    pbism: S + 'item/semanticModel/definitionProperties/1.0.0/schema.json',
    version: S + 'item/report/definition/versionMetadata/1.0.0/schema.json',
    report: S + 'item/report/definition/report/2.1.0/schema.json',
    pages: S + 'item/report/definition/pagesMetadata/1.0.0/schema.json',
    page: S + 'item/report/definition/page/2.0.0/schema.json',
    visual: S + 'item/report/definition/visualContainer/2.1.0/schema.json',
    mobile: S + 'item/report/definition/visualContainerMobileState/2.1.0/schema.json',
    bookmark: S + 'item/report/definition/bookmark/1.4.0/schema.json',
    bookmarks: S + 'item/report/definition/bookmarksMetadata/1.0.0/schema.json',
    platform: S + 'gitIntegration/platformProperties/2.0.0/schema.json'
  };

  // ---------- small helpers ----------
  const lit = (v) => ({ expr: { Literal: { Value: v } } });
  const str = (s) => lit("'" + String(s).replace(/'/g, "''") + "'");
  const S0 = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : '');
  const bool = (b) => lit(b ? 'true' : 'false');
  const num = (n) => lit(n + 'D');
  const color = (hex) => ({ solid: { color: str(hex) } });
  const obj = (props, selector) => (selector ? [{ properties: props, selector }] : [{ properties: props }]);
  // a line's style (L1, the owner's smooth lines of 19 Oct, from the lab of 13 Oct): 3 wide (P2); smooth by default,
  // monotone ('monotoneX': never swings past the data), with a filled circle on each point so every value stays findable
  // (the series' own colour: no markerColor), its size from the line's width. One entry, no selector: the form Desktop
  // 2.158 drew in the lab of 7 Oct ("a smooth line, a dot per month"). smooth false: the straight line, no markers.
  // Every name and value is in Microsoft's capabilities for lineChart and both combos' lineStyles.
  const LINE_WIDTH = 3;
  const lineStyle = (smooth) => Object.assign({ strokeWidth: num(LINE_WIDTH) }, smooth ? { lineChartType: str('smooth'), interpolationSmooth: str('monotoneX'), showMarker: bool(true), markerShape: str('circle'), markerSize: num(LINE_WIDTH + 2) } : {});
  const resource = (item) => ({ expr: { ResourcePackageItem: { PackageName: 'RegisteredResources', PackageType: 1, ItemName: item } } });
  const json = (o) => JSON.stringify(o, null, 2);
  const rnd = () => {
    const b = new Uint8Array(10);
    if (root.crypto && root.crypto.getRandomValues) root.crypto.getRandomValues(b); else for (let i = 0; i < 10; i++) b[i] = Math.floor(Math.random() * 256);
    return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  };
  // a random GUID (version 4), for a .platform file's logicalId
  const guid = () => {
    const h = (rnd() + rnd()).slice(0, 32).split('');
    h[12] = '4'; h[16] = '89ab'[parseInt(h[16], 16) % 4];
    return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20, 32)].map((p) => p.join('')).join('-');
  };
  // contrast of two colours (WCAG): the page's marks keep the accent colour only where it can be read on the card
  const lum = (hex) => { const v = [1, 3, 5].map((i) => parseInt(String(hex).slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4))); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const mixHex = (a, b, t) => {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };

  // field references for visual queries
  const fieldCol = (t, c) => ({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c });
  const fieldMea = (t, m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m });
  const q = (roles) => { const st = {}; Object.keys(roles).forEach((r) => { st[r] = { projections: roles[r] }; }); return { queryState: st }; };
  // a bound field: { t: table, c: column } or { t: table, m: measure }, with an optional display name (name): the
  // report then shows that name wherever it shows the field (legend, axis titles, table headers, slicer headers:
  // the projection's displayName; measured in Desktop 2.158, DESKTOP-TESTS.md round 2) and in the titles written
  // here. The model is not renamed, and queryRef stays the field's own.
  const fname = (f) => (f.m != null ? f.m : f.c);
  // 0.2.9, audit 3's A3-11: a model's name may hold format characters (Unicode Cf); a right-to-left override (U+202E) in
  // a measure's name reversed the title it was shown in. Shown text (titles, alt text, display names, the report
  // measures' own names) drops them, as the report's file name does; the joiners U+200C and U+200D stay (Arabic and
  // Persian words and emoji need them). The model's names are untouched: the DAX and the field references keep them.
  // (0.3.1 SQ1, 0.2.9-writer-S4: "Total\tSales" in a title) a run of control characters (Cc: a tab, a line break) is
  // shown as one space.
  const shown = (x) => String(x).replace(/(?![\u200C\u200D])\p{Cf}/gu, '').replace(/\p{Cc}+/gu, ' ');
  // Round 12 (#25): a model without measures still gets numbers: a column counted or summed by the visual itself (what
  // Desktop writes when a column is dropped on a value well), f.agg being Microsoft's QueryAggregateFunction (semantic
  // query schema: 0 Sum, 2 Distinct count, 5 Count of the non-null values). Such a field is a value, like a measure.
  const AGG = { 0: ['Sum', 'Sum of '], 2: ['Count', 'Count of '], 5: ['CountNonNull', 'Count of '] };
  const fieldAgg = (t, c, fn) => ({ field: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, Function: fn } },
    queryRef: (AGG[fn] || ['Agg'])[0] + '(' + t + '.' + c + ')', nativeQueryRef: (AGG[fn] || ['', ''])[1] + c });
  const isValue = (f) => !!f && (f.m != null || f.agg != null);
  const proj = (f) => Object.assign(f.agg != null ? fieldAgg(f.t, f.c, f.agg) : f.m != null ? fieldMea(f.t, f.m) : fieldCol(f.t, f.c), f.name ? { displayName: shown(f.name) } : {});
  const tproj = (f) => Object.assign(proj(f), f.tableFormat ? { format: String(f.tableFormat) } : {});
  const label = (f) => (f ? shown(f.name ? f.name : fname(f)) : null);
  // (S1, B-181) a name whose letters are all Latin (a helper named in English stays in one script)
  const latinOnly = (x) => !/[^\P{L}\p{Script=Latin}]/u.test(String(x));
  // a name holding a control character (\p{Cc}: a tab, a line break), which no DAX this writer builds may name (AUD-032;
  // round 22b, the outside review's X-05): the one test, used by the MCP's server for its scripts too
  const hasControl = (x) => /\p{Cc}/u.test(String(x));
  // 0.2.9, audit 3's A3-10: the one DAX quoter of the writer (it had five: ref, daxName, daxTable, dq and one inline),
  // exported for the SVG compiler and the server too. table 'Name', measure [Name], column 'Table'[Name], string "Text";
  // a name with a control character is refused (AUD-032): no DAX this writer builds may hold one
  const daxSafe = (n) => { const s = String(n); if (hasControl(s)) throw new Error('A DAX name may not hold a control character (a tab, a line break): ' + JSON.stringify(s)); return s; };
  const daxNames = {
    table: (t) => "'" + daxSafe(t).replace(/'/g, "''") + "'",
    measure: (m) => '[' + daxSafe(m).replace(/\]/g, ']]') + ']',
    column: (t, c) => daxNames.table(t) + daxNames.measure(c),
    string: (s) => '"' + daxSafe(s).replace(/"/g, '""') + '"'
  };

  // what each slot becomes in Power BI, and the sample fields it shows; cards are the card visual (cardVisual): Microsoft
  // deprecates the legacy "card"
  const TYPES = { kpi: 'cardVisual', card: 'cardVisual', line: 'lineChart', bar: 'clusteredBarChart', column: 'clusteredColumnChart', donut: 'donutChart', table: 'tableEx',
    gauge: 'gauge', funnel: 'funnel', treemap: 'treemap', map: 'map', text: 'textbox', slicer: 'slicer', title: 'textbox', logo: 'image', matrix: 'pivotTable' };
  // the kinds of slot that are charts (they show the tooltip page on hover)
  const CHARTS = ['line', 'bar', 'column', 'donut', 'funnel', 'treemap', 'map'];
  // Months and weekdays in order (round 2; measured in Desktop 2.158, DESKTOP-TESTS.md round 2): a category whose bound
  // field says which number column puts it in order (f.sortBy, from the field picker: a month or day name without a
  // sort-by column in the model) gets Min of that column in the chart's Tooltips role and a sort by it. A chart only
  // sorts by a field that is in it, and our charts show a report page tooltip, so the number is never seen. The model
  // is not touched; tables and slicers can't do this and follow the model.
  // Round 23 (the owner's "nothing critical left"; seen in Desktop on 7 Oct: "the bar chart by city is alphabetical"):
  // a bar or column chart by a text category (byValue) is sorted by its measure, largest first; a time category (a
  // month, day, week, quarter or year, Hijri ones too, a name the model sorts, a number) keeps its own order
  // (round 23 part 5, the review's 9: whole words, so "Holiday Package" or "Candidate" is a text category)
  const TIME_WORDS = /\b(month|day|weekday|week|quarter|year|hijri|date|period)s?\b|(^|\s)(الشهر|اليوم|الأسبوع|الربع|السنة|هجري|الهجري)(\s|$)/i;
  // (part 6, the re-review's 1: a name is split into its words first, at CamelCase, "_", "-" and digits: MonthName,
  // Month_Name, FiscalYear, WeekNum, اسم_الشهر are time; "Holiday Package" and "Candidate" are not)
  const wordsOf = (n) => String(n).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').replace(/[_\-\d]+/g, ' ');
  // 0.2.9, audit 3's A3-8: the field picker marks a time category (time: true or false, or its kind: a day, week,
  // month, quarter, year, date, period or Hijri category is time; any other kind is not) and its mark decides; the
  // name's words (TIME_WORDS) only where the picker gives no mark ("Day Type" with a kind of its own is a category)
  const TIME_KINDS = /^(date|day|weekday|week|month|quarter|year|period|hijri|time)s?$/i;
  const isTime = (f) => (f.time != null ? !!f.time : f.kind != null ? TIME_KINDS.test(String(f.kind)) : TIME_WORDS.test(wordsOf(f.c)));
  const sorted = (query, f, byValue) => {
    if (!query || !f) return query;
    if (!f.sortBy) {
      const y = byValue && query.queryState.Y && query.queryState.Y.projections[0];
      if (y && !f.ordered && !f.num && !isTime(f)) query.sortDefinition = { sort: [{ field: y.field, direction: 'Descending' }], isDefaultSort: true };
      return query;
    }
    const field = { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: f.sortBy.t } }, Property: f.sortBy.c } }, Function: 3 } };
    query.queryState.Tooltips = { projections: [{ field, queryRef: 'Min(' + f.sortBy.t + '.' + f.sortBy.c + ')', nativeQueryRef: 'Min of ' + f.sortBy.c }] };
    query.sortDefinition = { sort: [{ field, direction: 'Ascending' }], isDefaultSort: true };
    return query;
  };
  // Round 13 (the owner's ask, 6 Oct 2026; measured in Desktop 2.158, DESKTOP-TESTS.md "round 13, item 1"): the bars of
  // a bar or column chart fade by their value. It is the data colour's conditional formatting: dataPoint.fill as a
  // FillRule (linearGradient2) on the chart's own measure, for every data point. Desktop drew the smallest bar exactly
  // the low colour and the largest exactly the high one, in English and Arabic alike. The ends are written as colours,
  // not as ThemeDataColor: "60% lighter" there goes towards white, so on a dark design the smallest bar came out the
  // brightest. The high end is the bars' colour today (the theme's first data colour); the low end is that colour
  // mixed towards the card as far as it still stands 3:1 off the card (60% at most), so the smallest bar never fades
  // into its panel. A colour that cannot fade by 15% and keep 3:1 gets no rule (null). A bar has no gradient fill of
  // its own in Desktop 2.158 (dataPoint holds fill, fillRule, fillTransparency and the border only).
  const HEX6 = /^#[0-9a-f]{6}$/i;
  // Round 15 (the owner's go on round 13's recommendation 3, 6 Oct 2026): a colour too close to its card to fade
  // towards it (golden task 1: #0F6CBD on the dark DataArcus card, 3.2:1) fades the other way: the smallest bar is the
  // colour itself and the largest a brighter tint of it, mixed 40% towards the text colour (further off the card), so
  // every bar still stands 3:1 off the card (reversed: true). A colour under 3:1 itself gets no rule (null).
  const gradientEnds = (base, card, text) => {
    if (!HEX6.test(String(base)) || !HEX6.test(String(card))) return null;
    for (let n = 12; n >= 3; n--) { const low = mixHex(base, card, n / 20); if (contrast(low, card) >= 3) return { low, high: String(base).toLowerCase() }; }
    if (HEX6.test(String(text)) && contrast(base, card) >= 3) { const high = mixHex(base, text, 0.4); if (contrast(high, card) > contrast(base, card)) return { low: String(base).toLowerCase(), high, reversed: true }; }
    return null;
  };
  const gradientFill = (input, ends) => [{
    properties: { fill: { solid: { color: { expr: { FillRule: { Input: input, FillRule: { linearGradient2: {
      min: { color: { Literal: { Value: "'" + ends.low + "'" } } }, max: { color: { Literal: { Value: "'" + ends.high + "'" } } },
      nullColoringStrategy: { strategy: { Literal: { Value: "'asZero'" } } } } } } } } } } },
    selector: { data: [{ dataViewWildcard: { matchingOption: 1 } }] } }];
  // Round 13 (the owner's ask, 5 Oct 2026; measured in Desktop 2.158, DESKTOP-TESTS.md "round 13, item 3"): Desktop does
  // not mirror a chart in a right-to-left report, so the writer does what Desktop honours. (0.3.1 M1, the owner: "make sure
  // the AR and twin are using the same engine") The rules are the Arabic twin's, in one place: report-mirror.js chartRtl.
  // A column or line chart: the value axis at the right, the categories from the right by the sort turned round (a
  // categorical axis ignores categoryAxis.invertAxis, so it is no longer written there); a continuous axis (a date or a
  // number column, opts.dateColumns) ignores the sort and honours invertAxis. A bar chart: the bars grow from the right and
  // the names sit at the right; its top-to-bottom order stays. A legend goes to the other side (at the top right when it
  // has none). Called on the English chart, after its sort is written; kind is kept for the callers (the engine reads the
  // visual's type)
  const Mirror = () => (typeof module !== 'undefined' && module.exports ? require('./report-mirror.js') : root.DAMirror);
  const mirrorChart = (visual, kind, opts) => Mirror().mirrorChart(visual, opts);
  // Round 12, the owner's ask (#17; seen in Desktop 2.158, round 11: the chart ran Sunday to Saturday, the table beside
  // it Friday, Monday, Saturday): days and months in calendar order in tables too. A day or month name that the model
  // gives no sort-by column (f.sortBy, from the field picker: the number column that orders it) is followed by a helper
  // column, the minimum of that number (as the charts carry it in their tooltips), and the table is sorted by it
  // ascending; the helper is written without a header, as narrow as Desktop draws a column, in the card colour, so it
  // does not show (see the table's objects). A name the model sorts itself (f.ordered) gets a sort by itself. The week
  // starts where the model's day number starts. (A table sorts only by a field it holds, as a chart does: round 2.)
  const orderHelper = (f) => ({ field: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: f.sortBy.t } }, Property: f.sortBy.c } }, Function: 3 } },
    queryRef: 'Min(' + f.sortBy.t + '.' + f.sortBy.c + ')', nativeQueryRef: 'Min of ' + f.sortBy.c, displayName: ' ' });
  const orderedBy = (fs) => fs.find((f) => isTextField(f) && (f.sortBy || f.ordered)) || null;
  const inOrder = (query, fs, rtl, at) => {
    const f = orderedBy(fs); if (!f) return query;
    // (round 14: in a right-to-left table the helper goes at the left end, away from the text column at the right;
    // round 23: after the hidden name column, at = 1, which stays the table's first column)
    if (f.sortBy) { const h = orderHelper(f), ps = query.queryState.Values.projections; ps.splice(rtl ? at || 0 : ps.length, 0, h); query.sortDefinition = { sort: [{ field: h.field, direction: 'Ascending' }], isDefaultSort: true }; }
    else query.sortDefinition = { sort: [{ field: proj(f).field, direction: 'Ascending' }], isDefaultSort: true };
    return query;
  };
  // a table's fields in the order they are shown (see bindQuery). Right to left: reversed (Power BI doesn't mirror
  // tables), but the first text column stays first (the owner's design choice 5, 5 Oct 2026): Power BI writes the total
  // row's "Total" only in the first projection's column and only when that is a column of text (measured in Desktop
  // 2.158, 4 Oct: with a measure first there was no "Total"), so the category sits at the left end and "Total" shows.
  const isTextField = (f) => f.c != null && !f.num && f.agg == null;
  // 0.2.9, audit 3's A3-7: the field picker's own nameLike (pbip-bind.js), never a hand copy of it (the copy had lost
  // "Month Year"). In the browser the picker is loaded with the user's model; without it (the sample) no name is
  // taken for a day or month name. A category's kind: the picker's, where it gives it ({ kind, rows, family }), else
  // read from the name as before: a day name (7 rows), a month name (12; "Month Year" is no month name: it holds a
  // month per year), a quarter without a year in its name (4; "Year Quarter" holds many).
  const Story = () => (typeof module !== 'undefined' && module.exports ? require('./story-titles.js') : root.DAStoryTitles);
  const Bind = () => { try { return (typeof module !== 'undefined' && module.exports ? require('./pbip-bind.js') : root.DABind) || null; } catch (e) { return null; } };
  const nameLike = (n) => { const b = Bind(); return !!(b && b.nameLike && b.nameLike(n)); };
  const YEARISH = /year|سنة|السنة|عام/i;
  const KIND_ROWS = { day: 7, month: 12, quarter: 4 };
  const catKind = (f) => {
    if (!f || f.c == null) return null;
    if (f.kind) return { kind: String(f.kind), rows: f.rows != null && isFinite(+f.rows) ? +f.rows : KIND_ROWS[f.kind] || 0, family: f.family || null };
    const c = String(f.c), kind = /(^|\s)(day|weekday)|اليوم/i.test(c) && nameLike(c) ? 'day' : /quarter|الربع/i.test(c) && !YEARISH.test(c) ? 'quarter'
      : /month|الشهر/i.test(c) && nameLike(c) && !YEARISH.test(c) ? 'month' : null;
    return kind ? { kind, rows: KIND_ROWS[kind], family: null } : null;
  };
  // The names a day or month category shows, by its family, to measure them (asBar, Day Short): English, Arabic or Hijri
  // (the calendar generator's names, calendar-generator.js). Arabic: the name has Arabic letters or says so ("(Arabic)").
  // (0.3.1 SQ14, Q1-S3) the Arabic month names are arabic-calendar.js's MONTHS, the one list (a page loads it first)
  const AR_MONTHS = (typeof module !== 'undefined' && module.exports ? require('./arabic-calendar.js') : root.DataArcusArabicCalendar).MONTHS;
  const NAMES = {
    day: { en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] },
    month: { en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], ar: AR_MONTHS },
    hijri: { en: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qa'dah", 'Dhu al-Hijjah'],
      ar: ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'] }
  };
  const namesOf = (f, kind) => {
    const c = String(f.c), ar = /[\u0600-\u06FF]/.test(c) || /\((arabic|عربي|ar)\)\s*$/i.test(c) || f.lang === 'ar' ? 'ar' : 'en';
    const hijri = kind === 'month' && (/hijri/i.test(String(f.family || '')) || /hijri|هجري/i.test(c));
    return (NAMES[hijri ? 'hijri' : kind] || {})[ar] || null;
  };
  // Round 14, the owner's ask (6 Oct 2026; his capture "GM AR dark 720" had Day Name at the left of an Arabic table):
  // the text column is the LAST projection in a right-to-left report, so Desktop draws it at the right edge, and the
  // measures sit to its left in reading order. This replaces design choice 5 (text first, for the total row's "Total",
  // which Power BI writes only in the first projection's column when it is text): the reading order comes first.
  const tableFields = (B, rtl) => {
    const fs = (B.table || []).filter(Boolean);
    if (!rtl) return fs;
    const r = fs.slice().reverse(), first = fs.find(isTextField);
    return first ? r.filter((f) => f !== first).concat([first]) : r;
  };
  // Round 23 (the owner's go, 8 Oct 2026: "i wanna fix the word total as well"; way 4 of the sitting of 7-8 Oct, measured
  // in Desktop 2.158.1304, DESKTOP-TESTS.md): Power BI writes the total row's "Total" only in a table's first column, and
  // a right-to-left table's first column is at the left, a number. So a right-to-left table with a total row (a text
  // column and a measure or an aggregated column; text columns alone have none) shows its name column through a
  // report-level text measure at the right, "Row label: <Column>" in the column's table (reportExtensions.json, the model
  // untouched), which gives the row's name on a row and «الإجمالي» on the total row, under the column's display name; the
  // column itself is the table's first projection, at width 0 with the automatic widths on (it stayed hidden, and the
  // other columns grew to fit), and keeps the rows, their order and the identity a click filters the page by. A name
  // with a control character keeps the table as before (AUD-032: no DAX may name it). Left to right: never.
  const ROW_LABEL = 'Row label: ';
  // (round 23 part 5: the table's numbers are named in the label's DAX too, so none may hold a control character either)
  const rowLabelOf = (fs, rtl) => { const f = rtl ? fs.find(isTextField) : null; return f && fs.some(isValue) && !hasControl(f.t) && !hasControl(f.c) && fs.filter(isValue).every((v) => !hasControl(v.t) && !hasControl(v.m != null ? v.m : v.c)) ? f : null; };
  const rowLabelProj = (f) => ({ field: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: f.t } }, Property: ROW_LABEL + shown(f.c) } }, queryRef: f.t + '.' + ROW_LABEL + shown(f.c), nativeQueryRef: ROW_LABEL + shown(f.c), displayName: label(f) });
  // (round 23 part 5, the reviewer's code review, R1: a label that always has a value kept every row in the table, so
  // rows whose numbers are all blank (a product without sales in the chosen year) showed with their name, and an empty
  // table showed its names over the "No data" card. The label is blank unless one of the table's numbers (vals: its
  // projections, the measures and the columns the visual sums or counts, in the table's order) has a value there, as
  // Power BI decides for an English table's rows; the total row's word likewise)
  const AGG_DAX = { 0: 'SUM', 1: 'AVERAGE', 2: 'DISTINCTCOUNT', 3: 'MIN', 4: 'MAX', 5: 'COUNTA' };   // (part 6: 2 is the visual's distinct count)
  const valueDax = (p) => (p.field.Measure ? daxNames.column(p.field.Measure.Expression.SourceRef.Entity, p.field.Measure.Property)
    : (AGG_DAX[p.field.Aggregation.Function] || 'COUNTA') + ' ( ' + daxNames.column(p.field.Aggregation.Expression.Column.Expression.SourceRef.Entity, p.field.Aggregation.Expression.Column.Property) + ' )');
  // 0.2.9 part 2 (O-13) and the cross-review's G6: how a time axis's field is ordered, decided once here; the writer
  // applies it and plan_layout says it. order: 'own' (a date or number), 'model' (the model's sort-by column), 'number'
  // (the report sorts by the number column, by), 'monthStart' (a month label of a date table: by its first date, the
  // last 12 months with data), 'az' (a text with no order: A to Z)
  // (A3-10: a date column whose name holds a control character can't be named in the month's DAX: no month start)
  const monthLabel = (f) => !!(f && f.c != null && f.dateOf && !f.sortBy && !f.ordered && !f.num && f.agg == null && !/^(int64|double|decimal|number|date)/.test(String(f.type || 'string')) && !hasControl(f.dateOf.t) && !hasControl(f.dateOf.c));
  // 0.2.9 rc1 (the laptop's proof of 11 Oct: a Month-Year column of a DAX table, which the files give no type, ran A to Z
  // with about 60 labels): a month label with no date column and no sort-by column is read as a date itself, by a report
  // measure (DATEVALUE of "1 " & the label, or of the label & "-01", or of the label: "Apr 2018", "April 2018",
  // "2018-04"), which orders the chart and keeps its last 12 months; a label no form reads gives blank, and then the chart
  // keeps every point. Only a month-and-year label ("Month-Year", "Year Month"): a month name alone keeps its rules (the
  // picker's sort column, or the model's), and a "period" or week label is no date (G11)
  const labelMonth = (f) => !!(f && f.c != null && !f.dateOf && !f.sortBy && !f.ordered && !f.num && f.agg == null && /^(string|unknown)$/.test(String(f.type || 'string').toLowerCase()) && /month|الشهر/i.test(String(f.c)) && YEARISH.test(String(f.c)) && !hasControl(f.t) && !hasControl(f.c));
  const timeAxisPlan = (f) => {
    if (!f || f.c == null) return null;
    if (f.agg != null || f.num || /^(int64|double|decimal|number|date)/.test(String(f.type || 'string'))) return { order: 'own' };
    if (f.ordered) return { order: 'model' };
    if (f.sortBy) return { order: 'number', by: f.sortBy };
    if (monthLabel(f)) return { order: 'monthStart', by: f.dateOf, last: 12 };
    if (labelMonth(f)) return { order: 'monthLabel', last: 12 };
    return { order: 'az' };
  };
  const rowLabelDax = (f, word, vals) => { const c = daxNames.column(f.t, f.c), inner = 'IF ( ISINSCOPE ( ' + c + ' ), SELECTEDVALUE ( ' + c + ' ), ' + daxNames.string(word) + ' )';
    return vals && vals.length ? 'IF ( ' + vals.map((p) => 'NOT ISBLANK ( ' + valueDax(p) + ' )').join(' || ') + ', ' + inner + ' )' : inner; };
  // the query of one visual, or null when a field it needs is not bound
  // rtl: a right-to-left report reverses a table's columns, so its first column (the category) sits on the right,
  // where an Arabic reader starts; Power BI doesn't mirror tables itself
  const CAT_KINDS = ['bar', 'column', 'donut', 'funnel', 'treemap', 'map'];
  function bindQuery(kind, B, kpiIndex, rtl) {
    const cat = (B.cats || {})[kind], y = kind === 'funnel' && B.y && 'funnel' in B.y ? B.y.funnel : (B.y || {})[kind] || B.measure, need = (...fs) => fs.every(Boolean);
    // one field per card: a card past the end of the list stays empty rather than repeating the first KPI
    const kpi = (B.kpis || [])[kpiIndex] || null;
    switch (kind) {
      // the card visual's field role is Data (with Values or Fields it stays empty)
      case 'kpi': return kpi ? q({ Data: [proj(kpi)] }) : null;
      case 'card': return need(B.measure) ? q({ Data: [proj(B.measure)] }) : null;
      case 'line': return need(B.date, B.measure) ? sorted(q({ Category: [proj(B.date)], Y: [proj(B.measure)] }), B.date) : null;
      case 'bar': case 'column': return need(cat, y) ? sorted(q({ Category: [proj(cat)], Y: [proj(y)] }), cat, true) : null;
      case 'donut': case 'funnel': return need(cat, y) ? q({ Category: [proj(cat)], Y: [proj(y)] }) : null;
      // a table column's number format on the report side is "format" on its projection (measured in Desktop 2.158,
      // third sitting of 2026-10-04: 13857 became 13,857); the field carries it as tableFormat
      // (round 23: a right-to-left table with a total row: the name column hidden first, the row-label measure last)
      case 'table': { const fs = tableFields(B, rtl), rl = rowLabelOf(fs, rtl); if (!fs.length) return null;
        return rl ? inOrder(q({ Values: [tproj(rl)].concat(fs.filter((f) => f !== rl).map(tproj), [rowLabelProj(rl)]) }), fs, rtl, 1) : inOrder(q({ Values: fs.map(tproj) }), fs, rtl); }
      // a matrix: rows by the table's first text column, its measures as the values
      // (round 16, design finding #15: a hand-placed matrix showed days A to Z: it is put in calendar order as a table is,
      // by the helper column or the model's own sort)
      case 'matrix': { const fs = (B.table || []).filter(Boolean), row = fs.find(isTextField), vals = fs.filter(isValue); return row && vals.length ? inOrder(q({ Rows: [proj(row)], Values: vals.map(tproj) }), fs, false) : null; }
      // (round 16, design finding #16: a gauge on a percent measure read 0.34 between 0.00 and 0.68; it shows the card's
      // percent format through its projection's format, as tables do)
      case 'gauge': return need(y) ? q({ Y: [Object.assign(proj(y), y.pctFormat ? { format: String(y.pctFormat) } : {})] }) : null;
      case 'treemap': return need(cat, y) ? q({ Group: [proj(cat)], Values: [proj(y)] }) : null;
      case 'map': return need(cat, y) ? q({ Category: [proj(cat)], Size: [proj(y)] }) : null;
      default: return null;
    }
  }
  // chart title for a user's own fields: "Sales by Region"
  // Round 14, the owner's ask (6 Oct 2026): a title is never half Arabic, half English. "A by B" joins two names of the
  // same script with that script's word ("إجمالي المبيعات حسب اسم اليوم", "Total Sales by Day Name"); when only one of
  // the two names is Arabic, the title is the measure's name alone (plan_layout proposes Arabic names to approve).
  const AR_LETTERS = /[\u0600-\u06FF]/;
  const byTitle = (a, by, b) => {
    if (!a || !b) return a || null;
    const ar = AR_LETTERS.test(a);
    if (ar !== AR_LETTERS.test(b)) return a;
    if (AR_LETTERS.test(by) && !ar) return a;   // (0.3.0 R2: an Arabic report never joins two English names with "by")
    return a + ' ' + (ar ? (AR_LETTERS.test(by) ? by : 'حسب') : (AR_LETTERS.test(by) ? 'by' : by)) + ' ' + b;
  };
  // 0.3, J4 (B-130, B-131): the title says what the visual answers, from its fields' metadata (story-titles.js): its
  // measure's time intelligence in words ("Sales PY" -> "Sales last year"), and every shorter form its rules allow, so
  // the page can pick the first that fits its box (bindStory: the list, the full title first)
  function bindStory(kind, B, by) {
    const cat = (B.cats || {})[kind], y = kind === 'funnel' && B.y && 'funnel' in B.y ? B.y.funnel : (B.y || {})[kind] || B.measure;
    const of = (m, c) => Story().variants(m, c, by, shown);
    if (kind === 'line' && B.date && B.measure) return of(B.measure, B.date);
    if (['bar', 'column', 'donut', 'funnel', 'treemap', 'map'].includes(kind) && cat && y) return of(y, cat);
    if ((kind === 'gauge' || kind === 'card') && y) return of(y, null);
    // a table or matrix by its content (the owner's design choice 3, 5 Oct 2026): its first measure by its first text
    // column, "Total Sales by Region"; the other columns are named by their headers
    if (kind === 'table' || kind === 'matrix') {
      const fs = (B.table || []).filter(Boolean), m = fs.find(isValue), c = fs.find(isTextField);
      return m ? of(m, c || null) : null;
    }
    return null;
  }
  function bindTitle(kind, B, by) { const v = bindStory(kind, B, by); return v ? v[0].text : null; }
  // a KPI card's title: its measure's name, its time intelligence in words (a display name stays as given); by: the
  // report's word (an Arabic report keeps an English name as it is, R2)
  const kpiLabel = (f, by) => (f ? Story().nameOf(f, shown, AR_LETTERS.test(by || '')) : null);
  const PF_KINDS = { boolean: 'boolean', string: 'text', int64: 'whole', double: 'decimal' };
  // one page filter value as Power BI writes it, by the column's type (or, with none, the value's own), or null
  const pfLiteral = (v, type) => {
    const kind = PF_KINDS[String(type || '').toLowerCase()] || (typeof v === 'boolean' ? 'boolean' : typeof v === 'number' ? (Number.isInteger(v) ? 'whole' : 'decimal') : 'text');
    if (kind === 'boolean') return typeof v === 'boolean' ? String(v) : null;
    if (kind === 'text') return typeof v === 'string' && !hasControl(v) ? "'" + v.replace(/'/g, "''") + "'" : null;
    if (typeof v !== 'number' || !Number.isFinite(v) || /e/i.test(String(v)) || (kind === 'whole' && !Number.isSafeInteger(v))) return null;
    return String(v) + (kind === 'whole' ? 'L' : 'D');
  };
  // 0.2.9, audit 6's A6-14: one page filter ("is one of", Categorical) on a column { t, c, type } from its typed values, the
  // shape Microsoft's report authoring reference gives (the field by its table, the condition by the alias of From), its
  // literals written here; a value of the wrong type is refused (a TypeError). literals: ones already written (checked by
  // build's checkBuild), used in place of values
  const pageFilterOf = (col, values, literals) => {
    const lits = literals || (values || []).map((v) => pfLiteral(v, col.type));
    if (!lits.length || lits.some((v) => v == null)) throw new TypeError('pageFilterOf: every value of ' + col.t + '[' + col.c + '] must be ' + ({ boolean: 'true or false', text: 'a text', whole: 'a whole number', decimal: 'a plain number' }[PF_KINDS[String(col.type || '').toLowerCase()]] || 'true, false, a text or a plain number'));
    const alias = (/^[A-Za-z]/.test(col.t) ? col.t[0] : 't').toLowerCase();
    return {
      name: 'Filter' + rnd() + rnd().slice(0, 4),
      field: { Column: { Expression: { SourceRef: { Entity: col.t } }, Property: col.c } },
      type: 'Categorical',
      filter: { Version: 2, From: [{ Name: alias, Entity: col.t, Type: 0 }],
        Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: alias } }, Property: col.c } }], Values: lits.map((v) => [{ Literal: { Value: v } }]) } } }] },
      howCreated: 'User'
    };
  };

  // ---------- 0.2.9 part 2: the owner's own test of 0.2.8 (10 Oct 2026), recipes measured in Desktop 2.158.1304 ----------
  // (dataarcus-engine business/research/REPORT-FIXES-LAB.md and TOOLTIP-FIX-LAB.md, on the laptop, 10 Oct)
  // The report's own measures that order and filter a visual (the time axes, the tooltip pages), made once per report on
  // its notes: report-level measures (DateTime and Integer) into reportExtensions.json with the others, the same
  // expression in the same table one measure (their list: n.timeExt; names kept free of the model's: n.freeExt)
  function measures(c) {
    const {
      freeExt, timeExt
    } = c;
    // (the cross-review's G4: the writer's own daxNames and valueDax, one DAX for a visual's value everywhere)
    // (D1: with the value's format, formatString, for the right-to-left waterfall's measures)
    const extMeasure = (t, want, expression, dataType, formatString) => {
      const had = timeExt.find((x) => x.t === t && x.expression === expression); if (had) return had.m;
      let m = freeExt(t, want); for (let k = 2; timeExt.some((x) => x.t === t && x.m === m); k++) m = freeExt(t, want + ' (' + k + ')');
      timeExt.push(Object.assign({ t, m, expression, dataType }, formatString ? { formatString } : {})); return m;
    };
    const extField = (t, m) => ({ Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: t } }, Property: m } });
    // a field of a visual as DAX (a model measure, or a column a visual sums or counts), or null
    // (A3-10: null too for a name with a control character, which daxNames refuses)
    const daxOf = (field) => { const m = field && field.Measure && !field.Measure.Expression.SourceRef.Schema ? field.Measure : null, c = field && field.Aggregation && field.Aggregation.Expression.Column;
      const names = m ? [m.Expression.SourceRef.Entity, m.Property] : c ? [c.Expression.SourceRef.Entity, c.Property] : null;
      return names && !names.some(hasControl) ? valueDax({ field }) : null; };
    // O-13: a month label (a text column the model does not sort, with its table's date column, f.dateOf) is put in time
    // order by a measure, the month's first date, in the visual's Tooltips; and kept to the last n months, counted back
    // from the last date where the visual's measure has a value (not from today: an old data set still shows its last
    // months), by a visual filter on a measure that is 1 for those months
    // (rc1: a month label without its date, timeAxisPlan's monthLabel, read as a date: asDate)
    const asDate = (x) => 'IFERROR ( DATEVALUE ( "1 " & ' + x + ' ), IFERROR ( DATEVALUE ( ' + x + ' & "-01" ), IFERROR ( DATEVALUE ( ' + x + ' ), BLANK () ) ) )';
    const monthStart = (f) => (f.dateOf ? extMeasure(f.dateOf.t, 'Month start (sort)', 'MIN ( ' + daxNames.column(f.dateOf.t, f.dateOf.c) + ' )', 'DateTime')
      : extMeasure(f.t, 'Month start (sort)', asDate('MIN ( ' + daxNames.column(f.t, f.c) + ' )'), 'DateTime'));
    const lastMonths = (f, yField, n) => {
      const y = daxOf(yField); if (!y) return null;
      // (0.3.1 SQ1, S1-S9) the hidden helper's name in one script, plain English, as B-181's "Keep:": with the measure's
      // name where it is all Latin, else "Last N months"
      const lastName = (ym) => (latinOnly(shown(ym)) ? 'Last ' + n + ' months: ' + shown(ym) : 'Last ' + n + ' months');
      if (!f.dateOf) {
        const c = daxNames.column(f.t, f.c), yn = yField.Measure ? yField.Measure.Property : yField.Aggregation.Expression.Column.Property;
        const m = extMeasure(f.t, lastName(yn), 'VAR _last = CALCULATE ( MAXX ( FILTER ( ALL ( ' + c + ' ), NOT ISBLANK ( ' + y + ' ) ), ' + asDate(c) + ' ), ALL ( ' + daxNames.table(f.t) + ' ) ) RETURN IF ( ISBLANK ( _last ), 1, IF ( ' + asDate('MAX ( ' + c + ' )') + ' > EDATE ( _last, -' + n + ' ), 1 ) )', 'Integer');
        return { name: 'Filter' + rnd() + rnd().slice(0, 4), type: 'Advanced', field: extField(f.t, m),
          filter: { Version: 2, From: [{ Name: 'm', Entity: f.t, Schema: 'extension', Type: 0 }],
            Where: [{ Condition: { Comparison: { ComparisonKind: 0, Left: { Measure: { Expression: { SourceRef: { Source: 'm' } }, Property: m } }, Right: { Literal: { Value: '1L' } } } } }] }, howCreated: 'User' };
      }
      const d = daxNames.column(f.dateOf.t, f.dateOf.c), yName = yField.Measure ? yField.Measure.Property : yField.Aggregation.Expression.Column.Property;
      const m = extMeasure(f.dateOf.t, lastName(yName), 'VAR _last = CALCULATE ( MAXX ( FILTER ( ALL ( ' + d + ' ), NOT ISBLANK ( ' + y + ' ) ), ' + d + ' ), ALL ( ' + daxNames.table(f.dateOf.t) + ' ) ) RETURN IF ( MAX ( ' + d + ' ) > EDATE ( _last, -' + n + ' ), 1 )', 'Integer');
      return { name: 'Filter' + rnd() + rnd().slice(0, 4), type: 'Advanced', field: extField(f.dateOf.t, m),
        filter: { Version: 2, From: [{ Name: 'm', Entity: f.dateOf.t, Schema: 'extension', Type: 0 }],
          Where: [{ Condition: { Comparison: { ComparisonKind: 0, Left: { Measure: { Expression: { SourceRef: { Source: 'm' } }, Property: m } }, Right: { Literal: { Value: '1L' } } } } }] }, howCreated: 'User' };
    };
    const byMonthStart = (query, f, dir) => { const m = monthStart(f), et = f.dateOf ? f.dateOf.t : f.t, field = extField(et, m);
      query.queryState.Tooltips = { projections: [{ field, queryRef: et + '.' + m, nativeQueryRef: m }] };
      query.sortDefinition = { sort: [{ field, direction: dir }], isDefaultSort: true }; };
    // O-3 (the "(Blank)" month on the line chart): a visual filter "is not blank" on a chart's category column, the
    // shape Desktop writes for it
    const notBlank = (col) => ({ name: 'Filter' + rnd() + rnd().slice(0, 4), type: 'Advanced', field: { Column: col },
      filter: { Version: 2, From: [{ Name: 'c', Entity: col.Expression.SourceRef.Entity, Type: 0 }],
        Where: [{ Condition: { Not: { Expression: { Comparison: { ComparisonKind: 0, Left: { Column: { Expression: { SourceRef: { Source: 'c' } }, Property: col.Property } }, Right: { Literal: { Value: 'null' } } } } } } }] }, howCreated: 'User' });
    // the tooltip pages (TOOLTIP-FIX-LAB): a category's bars are its Top n by the measure shown, a Top N visual filter
    const topN = (col, yField, n) => {
      const ct = col.Expression.SourceRef.Entity, yt = yField.Measure ? yField.Measure.Expression.SourceRef.Entity : yField.Aggregation.Expression.Column.Expression.SourceRef.Entity;
      const ya = yt === ct ? 'd' : '_', from = [{ Name: 'd', Entity: ct, Type: 0 }].concat(yt === ct ? [] : [{ Name: '_', Entity: yt, Type: 0 }]);
      const order = yField.Measure ? { Measure: { Expression: { SourceRef: { Source: ya } }, Property: yField.Measure.Property } }
        : { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Source: ya } }, Property: yField.Aggregation.Expression.Column.Property } }, Function: yField.Aggregation.Function } };
      return { name: 'Filter' + rnd() + rnd().slice(0, 4), type: 'TopN', field: { Column: col },
        filter: { Version: 2, From: [{ Name: 'subquery', Type: 2, Expression: { Subquery: { Query: { Version: 2, From: from,
          Select: [{ Column: { Expression: { SourceRef: { Source: 'd' } }, Property: col.Property }, Name: 'field' }], OrderBy: [{ Direction: 2, Expression: order }], Top: n } } } }, { Name: 'd', Entity: ct, Type: 0 }],
          Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: 'd' } }, Property: col.Property } }], Table: { SourceRef: { Source: 'subquery' } } } } }] }, howCreated: 'User' };
    };
    // (design round 10, the re-score's N14 and N15: "Top 9 of 10" left out one value its chart could show, "Top 6:" stood
    // over 2 bars, and "Top 6" over 7 where two tied) a chart's top categories are kept by a report measure, not a fixed
    // Top N filter: the categories with a value (counted without the chart's own filter on its column, REMOVEFILTERS),
    // ranked by the chart's measure (RANKX, ties sharing a rank); kept: all of them when they are n + extra or fewer, the
    // first n by rank otherwise. The title counts what is kept: "Top S of M: <title>" only when S < M, S the bars shown
    // (more than n where values tie), the plain title otherwise. No comparison sign in the DAX (a <= b is written
    // MAX ( a, b ) = b), as round 9's names check keeps to names and strings. null where the DAX can't name the fields.
    const topSet = (f, yField, n, extra) => {
      const y0 = daxOf(yField); if (!y0) return null;
      let c; try { c = daxNames.column(f.t, f.c); } catch (e) { return null; }
      const y = 'CALCULATE ( ' + y0 + ' )', cap = n + extra + 1;
      const head = 'VAR _t = CALCULATETABLE ( FILTER ( VALUES ( ' + c + ' ), NOT ISBLANK ( ' + c + ' ) && NOT ISBLANK ( ' + y + ' ) ), REMOVEFILTERS ( ' + c + ' ) ) VAR _n = COUNTROWS ( _t ) VAR _k = IF ( MIN ( _n, ' + cap + ' ) = ' + cap + ', ' + n + ', _n )';
      // (0.3.0 S1, B-181: "Keep: Web Orders Total Score by مجموعة الخطة" in the Fields pane) the hidden helper's name in one
      // script, plain English: the measure by the shown name, else by the model's names, else "Keep: top categories"
      const yName = shown(yField.Measure ? yField.Measure.Property : yField.Aggregation.Expression.Column.Property);
      const keepWant = ['Keep: ' + yName + ' by ' + label(f), 'Keep: ' + yName + ' by ' + shown(f.c)].find(latinOnly) || 'Keep: top categories';
      const keep = () => { const keepName = extMeasure(f.t, keepWant, head +' VAR _r = RANKX ( _t, ' + y + ', , DESC ) RETURN IF ( MAX ( _r, _k ) = _k, 1 )', 'Integer');
      const filter = { name: 'Filter' + rnd() + rnd().slice(0, 4), type: 'Advanced', field: extField(f.t, keepName),
        filter: { Version: 2, From: [{ Name: 'm', Entity: f.t, Schema: 'extension', Type: 0 }],
          Where: [{ Condition: { Comparison: { ComparisonKind: 0, Left: { Measure: { Expression: { SourceRef: { Source: 'm' } }, Property: keepName } }, Right: { Literal: { Value: '1L' } } } } }] }, howCreated: 'User' };
        return filter; };
      // the title: lead "Top ", of " of ", rest the title after "Top S of M: " as fitted, plain the plain title as fitted
      const title = (name, words, rest, plain) => extMeasure(f.t, name, head + ' VAR _s = COUNTROWS ( FILTER ( _t, MAX ( RANKX ( _t, ' + y + ', , DESC ), _k ) = _k ) ) RETURN IF ( _s = _n, ' + daxNames.string(plain) + ', ' + daxNames.string(words[0]) + ' & _s & ' + daxNames.string(words[1]) + ' & _n & ' + daxNames.string(': ' + rest) + ' )', 'Text');
      return { keep, title };
    };
    return { extMeasure, extField, daxOf, monthStart, lastMonths, byMonthStart, notBlank, topN, topSet };
  }

  const api = {
    S, SCHEMA, lit, str, S0, bool, num, color, obj, resource, LINE_WIDTH, lineStyle,
    json, rnd, guid, lum, contrast, mixHex, fieldCol, fieldMea, q, fname,
    shown, AGG, fieldAgg, isValue, proj, tproj, label, hasControl, daxSafe, daxNames,
    TYPES, CHARTS, TIME_WORDS, wordsOf, TIME_KINDS, isTime, sorted, HEX6, gradientEnds, gradientFill,
    mirrorChart, orderHelper, orderedBy, inOrder, isTextField, Bind, nameLike, YEARISH, KIND_ROWS, catKind,
    AR_MONTHS, NAMES, namesOf, tableFields, ROW_LABEL, rowLabelOf, rowLabelProj, AGG_DAX, valueDax, monthLabel,
    labelMonth, timeAxisPlan, rowLabelDax, CAT_KINDS, bindQuery, AR_LETTERS, byTitle, bindTitle, bindStory, kpiLabel, PF_KINDS, pfLiteral, pageFilterOf, measures
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPbipQuery = api;
})(typeof self !== 'undefined' ? self : this);
