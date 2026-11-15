// DD1A (0.3.2; the owner, D-1104-15, 4 Nov: one time test for all four places; D-1104-12 "a library of functions where
// a place calls them so if we need to fix something we fix it at the source"; D-1104-18; D-1016-01): one answer to "is
// this column, by its name, a date part?". The words and the list live in assets/js/time-names.js only
// (mcp/docs/CONTRACTS.md, family 1a).
//   U1  the ledger's 24 made-up names and the false cases (Amount, Sales, Category, «المبيعات», Region, Holiday, Today,
//       Birthday, Dateline: a time word inside a longer word is not one): isTimeName pinned
//   U2  wordsOf pinned: camel case, "_", "-", digits, the Arabic article, short vowels, «أ» read as «ا»
//   U3  every word of the list and its plural is time, alone and with the article; the list is frozen
//   U4  never throws on an odd input (null, a number, an object), never a data value: names only
//   P   the parity test: every place of the ledger's 1a (mirror-policy isTime, page-preview timeDirOf, pbip-query isTime,
//       layout-check TIMEY; run as scripts/contracts-probe.mjs runs them) gives isTimeName's answer on the 24 names,
//       the false cases and the more true ones: one answer each
//   U5  (0.3.3 AU2, AUD-051) isDateName: a date table's untyped column that reads as a date by its name. English:
//       the 40 names mirror-policy's DATE_LIKE accepted on c21df8d5 still accepted, its 34 refused still refused (the
//       table read from the regex as it was: RepeatIQ's StartOfMonth, "Start of Month", "Order Date", "Month Start",
//       "Day" among them); Arabic: «تاريخ», «التاريخ», «تاريخ الطلب», «اليوم», «بداية الشهر», «بداية السنة» are dates,
//       «المدير العام», «اليومية», «تاريخي», a weekday name and «بداية العام» (D-1105-04) are not
//   U6  (AU2, B-402) isWeekdayName: the heatmap's rows. English: the 37 names report-mirror's WEEKDAY accepted on
//       c21df8d5 still accepted, its 31 refused still refused; Arabic: «يوم الأسبوع», «اسم اليوم» are weekday names
//   S   no place keeps a word list of its own: TIME_NAME, TIME_WORDS and a wordsOf of its own are gone, each reads
//       time-names.js; what a place knows first stays its own (a date table, the picker's time or kind mark)
// Made-up names only.   node test-0.3.2-dd1a.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { FAMILIES, answerOf, placeName, definitions } from '../scripts/contracts-probe.mjs';

const require = createRequire(import.meta.url);
const T = require('../assets/js/time-names.js');

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

// ---- U1: the ledger's 24 names (scripts/contracts-probe.mjs NAMES) and the false cases ----
const LEDGER = [['', false], ['Date', true], ['Order Date', true], ['OrderDate', true], ['FiscalYear', true],
  ['Fiscal Year', true], ['MonthName', true], ['Month_Name', true], ['Qtr', true], ['FY', true], ['Yr', true],
  ['Hijri Month', true], ['التاريخ', true], ['تاريخ', true], ['الشهر', true], ['شهر', true], ['هجري', true],
  ['اسم_الشهر', true], ['Weekday', true], ['Days', true], ['Candidate', false], ['Update Status', false],
  ['Holiday Package', false], ['Sales', false]];
const FALSE_CASES = ['Amount', 'Sales', 'Category', 'المبيعات', 'Region', 'Holiday', 'Today', 'Birthday', 'Dateline',
  'Sales Amount 2024', 'العميل', 'المنطقة'];
const MORE_TRUE = ['FYTotal', 'WeekNum', 'Month2024', 'Month-Year', 'fiscal_period', 'Quarters', 'Yrs', 'الأسبوع',
  'اسبوع', 'السنة الهجرية', 'الأيام', 'Week Day', 'تاريخ الطلب', 'العام المالي'];
LEDGER.forEach(([n, want]) => chk(() => T.isTimeName(n) === want, () => `U1 isTimeName(${JSON.stringify(n)}) = ${T.isTimeName(n)}, the rule says ${want}`));
FALSE_CASES.forEach((n) => chk(() => T.isTimeName(n) === false, () => `U1 isTimeName(${JSON.stringify(n)}) is true: not a time name`));
MORE_TRUE.forEach((n) => chk(() => T.isTimeName(n) === true, () => `U1 isTimeName(${JSON.stringify(n)}) is false: a time name`));
// TN2 (owner D-1105-04): «عام» / «العام» is time only as the FIRST word of a name, never after another word
[['العام', true], ['العام المالي', true], ['عام 2024', true], ['عام', true], ['المدير العام', false], ['الرصيد العام', false],
  ['القطاع العام', false], ['Sales العام', false]].forEach(([n, want]) => chk(() => T.isTimeName(n) === want, () => `U1 TN2 isTimeName(${JSON.stringify(n)}) = ${T.isTimeName(n)}, the rule says ${want}`));

// ---- U2: the words ----
const WORDS = [['OrderDate', 'order date'], ['FYTotal', 'fy total'], ['Month_Name', 'month name'], ['Month-Year', 'month year'],
  ['WeekNum2', 'week num'], ['Holiday Package', 'holiday package'], ['التاريخ', 'تاريخ'], ['اسم_الشهر', 'اسم شهر'],
  ['الأسبوع', 'اسبوع'], ['الشَّهر', 'شهر'], ['الـشهر', 'شهر'], ['ال', 'ال'], ['الف', 'الف'], ['', ''], ['Sales ٢٠٢٤', 'sales']];
WORDS.forEach(([n, want]) => chk(() => T.wordsOf(n).join(' ') === want, () => `U2 wordsOf(${JSON.stringify(n)}) = ${JSON.stringify(T.wordsOf(n))}, the rule says ${want}`));

// ---- U3: the one list ----
const EN = ['date', 'day', 'weekday', 'week', 'month', 'quarter', 'qtr', 'year', 'yr', 'fy', 'period'];
const AR = ['تاريخ', 'يوم', 'أسبوع', 'شهر', 'ربع', 'سنة', 'عام', 'فترة', 'هجري'];
const PLURAL_AR = ['تواريخ', 'أيام', 'أسابيع', 'شهور', 'أشهر', 'أرباع', 'سنوات', 'سنين', 'أعوام', 'فترات'];
EN.forEach((w) => chk(() => T.isTimeName(w) && T.isTimeName(w + 's') && T.isTimeName(w.toUpperCase()) && T.isTimeName('Sales ' + w[0].toUpperCase() + w.slice(1)), () => `U3 ${w}: alone, plural, upper case or after another word is not time`));
chk(() => T.isTimeName('hijri') && T.isTimeName('Hijri'), () => 'U3 hijri is not time');
AR.concat(PLURAL_AR).forEach((w) => chk(() => T.isTimeName(w) && T.isTimeName('ال' + w), () => `U3 ${w}: alone or with «ال» is not time`));
chk(() => Object.isFrozen(T) && Object.isFrozen(T.TIME_WORDS) && T.TIME_WORDS.length === EN.length * 2 + 1 + AR.length + PLURAL_AR.length + 1, () => `U3 the list is not frozen or not the one list (${T.TIME_WORDS.length} words)`);

// ---- U4: odd inputs ----
[null, undefined, 12, {}, [], true, NaN].forEach((x) => chk(() => T.isTimeName(x) === false && Array.isArray(T.wordsOf(x)), () => `U4 isTimeName(${String(x)}) threw or said true`));

// ---- U5, U6 (0.3.3 AU2): a date by its name, a weekday by its name ----
// (the English tables: every name below read on c21df8d5 by the regexes the mirror held, DATE_LIKE (mirror-policy.js)
// and WEEKDAY (report-mirror.js, on the trimmed name); their answers kept exactly, the odd ones too: Restart, Date2)
const DATE_YES = ['StartOfMonth', 'Start of Month', 'Order Date', 'Month Start', 'Day', 'Date', 'date', 'DATE', 'Ship Date', 'Due_Date',
  'Order_Day', 'Dates', 'DateKey', 'Date Key', 'Start Of Year', 'StartOfWeek', 'startofquarter', 'Start of Week', 'Week Start',
  'Quarter Start', 'Year_Start', 'Fiscal Start', 'start', 'Start', 'Business Day', 'Calendar Day', 'Report Date', 'Datetime',
  'Date Time', 'Startofyear', 'Restart', 'Kickstart', 'Date2', 'Restart Date', 'Delivery Day', 'Start Date', 'Upstart', 'Due Day',
  'Last Date', 'Datestamp'];
const DATE_NO = ['Week ?', 'Year', 'Month', 'Weekday', 'Days', 'Holiday', 'Today', 'Birthday', 'Day of Week', 'Day Name',
  'Order Date Key', 'Month Name', 'Sales', 'Amount', 'Updated', 'Start Time', 'Startup Date x', 'Start Month 2', 'Mid-Day',
  'End of Month', 'EndOfMonth', 'Month End', 'Day Count', 'Daily', 'Candidate', 'Weekend', 'Monday', 'Order DateTime',
  'Fiscal Year', 'Quarter', 'Startdate', 'Payday', 'Sunday', 'Day_'];
const WEEKDAY_YES = ['Weekday', 'weekday', 'Week Day', 'WeekDay', 'Day Name', 'DayName', 'day name', 'Day of Week', 'Day of the Week',
  'DayOfWeek', 'dayofweek', 'Weekday Name', 'Week Day Name', ' Weekday ', 'WEEKDAY', 'Day Of The Week', 'DAY NAME', 'weekday name',
  'Dayname ', 'week day', 'WEEK DAY', 'dayname', 'DAYNAME', 'Dayofweek', 'DAYOFWEEK', 'day of the week', 'DAY OF THE WEEK',
  'day of week', 'Day of week', 'WeekDay Name', 'weekday Name', 'Week Day name', 'week day name', 'Day name', '  Day Name',
  'Day Of Week', 'Weekday\t'];
const WEEKDAY_NO = ['WeekDayName', 'Weekdayname', 'Day', 'Days', 'Week', 'Weekdays', 'Day Names', 'Day of Month', 'Day of Year',
  'Day of the Month', 'Weekday Number', 'Week Number', 'Weekday Short', 'Short Day', 'Day Short', 'Weekend', 'Day Type', 'Week Days',
  'Week-Day', 'Week_Day', 'Day_Name', 'DOW', 'Day Of Week Number', 'Name of Day', 'The Weekday', 'Weekday 2', 'Date', 'Day No',
  'DayOfWeekName', 'Weekday (Name)', 'WeekdayName'];
chk(() => DATE_YES.length >= 30 && DATE_NO.length >= 30 && WEEKDAY_YES.length >= 30 && WEEKDAY_NO.length >= 30, () => 'U5/U6 a table under 30 names');
chk(() => typeof T.isDateName === 'function' && typeof T.isWeekdayName === 'function', () => 'U5/U6 time-names.js exports no isDateName or isWeekdayName');
const askD = (n) => (typeof T.isDateName === 'function' ? T.isDateName(n) : undefined), askW = (n) => (typeof T.isWeekdayName === 'function' ? T.isWeekdayName(n) : undefined);
DATE_YES.forEach((n) => chk(() => askD(n) === true, () => `U5 isDateName(${JSON.stringify(n)}) = ${askD(n)}: DATE_LIKE accepted it`));
DATE_NO.forEach((n) => chk(() => askD(n) === false, () => `U5 isDateName(${JSON.stringify(n)}) = ${askD(n)}: DATE_LIKE refused it`));
WEEKDAY_YES.forEach((n) => chk(() => askW(n) === true, () => `U6 isWeekdayName(${JSON.stringify(n)}) = ${askW(n)}: WEEKDAY accepted it`));
WEEKDAY_NO.forEach((n) => chk(() => askW(n) === false, () => `U6 isWeekdayName(${JSON.stringify(n)}) = ${askW(n)}: WEEKDAY refused it`));
// Arabic (new): a noun comes before what describes it, so «تاريخ الطلب» is "Order Date" and «بداية الشهر» "Start of Month"
[['تاريخ', true], ['التاريخ', true], ['تاريخ الطلب', true], ['اليوم', true], ['بداية الشهر', true], ['بداية السنة', true],
  ['تاريخ_الشحن', true], ['يوم الطلب', true], ['بداية الأسبوع', true], ['بداية الربع', true], ['التَّاريخ', true],
  ['المدير العام', false], ['اليومية', false], ['تاريخي', false], ['يوم الأسبوع', false], ['اسم اليوم', false], ['يوم الشهر', false],
  ['الشهر', false], ['السنة', false], ['العام', false], ['عام 2024', false], ['بداية العام', false], ['بداية', false],
  ['بداية المشروع', false], ['المبيعات', false], ['أيام', false], ['تاريخ ميلاد العميل x', true]]
  .forEach(([n, want]) => chk(() => askD(n) === want, () => `U5 Arabic isDateName(${JSON.stringify(n)}) = ${askD(n)}, the rule says ${want}`));
[['يوم الأسبوع', true], ['اسم اليوم', true], ['يوم الاسبوع', true], ['اسم يوم الأسبوع', true], ['إسم اليوم', true], ['يوم_الأسبوع', true],
  ['اليوم', false], ['يوم', false], ['الأسبوع', false], ['أيام الأسبوع', false], ['اسم الشهر', false], ['يوم الشهر', false],
  ['اليومية', false], ['اسم العميل', false], ['نوع اليوم', false], ['المدير العام', false], ['تاريخ', false]]
  .forEach(([n, want]) => chk(() => askW(n) === want, () => `U6 Arabic isWeekdayName(${JSON.stringify(n)}) = ${askW(n)}, the rule says ${want}`));
[null, undefined, 12, {}, [], true, NaN].forEach((x) => chk(() => askD(x) === false && askW(x) === false, () => `U5/U6 an odd input (${String(x)}) threw or said true`));

// ---- P: the parity test, the four places on every name ----
const f1a = FAMILIES.find((x) => x.id === '1a');
chk(() => f1a && f1a.places.length === 4 && f1a.inputs.length === LEDGER.length, () => 'P the probe has no family 1a with 4 places and the 24 names');
const NAMES = LEDGER.map(([n]) => n).concat(FALSE_CASES, MORE_TRUE).map((n) => ({ label: n === '' ? "'' (empty)" : n, name: n }));
for (const place of (f1a ? f1a.places : [])) for (const input of NAMES) {
  const got = await answerOf(place, input), want = T.isTimeName(input.name);
  chk(() => got.key === String(want), () => `P ${placeName(place)} on ${input.label}: ${got.shown}, isTimeName says ${want}`);
}
// what a place knows first stays first: a date table (mirror-policy), the picker's mark (pbip-query)
const P = require('../assets/js/mirror-policy.js'), Q = require('../assets/js/pbip-query.js');
const col = (t, n) => ({ Column: { Property: n, Expression: { SourceRef: { Entity: t } } } });
chk(() => P.isTime(col('Calendar', 'Region'), ['Calendar']) === true && P.isTime(col('Sales', 'Region'), ['Calendar']) === false && P.isTime({ HierarchyLevel: { Level: 'Year' } }, []) === true,
  () => 'P mirror-policy isTime: a date table or a hierarchy level is no longer first');
chk(() => Q.isTime({ c: 'Day Type', kind: 'category' }) === false && Q.isTime({ c: 'Region', time: true }) === true && Q.isTime({ c: 'Month', time: false }) === false && Q.isTime({ c: 'Region', kind: 'month' }) === true,
  () => "P pbip-query isTime: the picker's time or kind mark is no longer first");

// ---- S: no own word list ----
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (f) => fs.readFileSync(path.join(ROOT, ...f.split('/')), 'utf8').replace(/\r\n/g, '\n');
for (const f of ['assets/js/mirror-policy.js', 'assets/js/page-preview.js', 'assets/js/pbip-query.js', 'assets/js/layout-check.js']) {
  const s = src(f), own = ['TIME_NAME', 'TIME_WORDS'].filter((n) => definitions(s, n).length > 0);
  const ownWords = definitions(s, 'wordsOf').filter((d) => !/^(=\s*)?TN\.wordsOf$/.test(d.text.trim()));
  chk(() => !own.length && !ownWords.length && /require\('\.\/time-names\.js'\)/.test(s) && /root\.DATimeNames/.test(s) && /TN\.isTimeName\(|TN\.isTimeName\b/.test(s),
    () => `S ${f} keeps a word list of its own (${own.concat(ownWords.map(() => 'wordsOf')).join(', ')}) or does not read time-names.js`);
}

// (0.3.3 AU2) the mirror keeps no date or weekday regex of its own: it asks time-names.js
{
  const mp = src('assets/js/mirror-policy.js'), rm = src('assets/js/report-mirror.js');
  chk(() => !definitions(mp, 'DATE_LIKE').length && !/DATE_LIKE/.test(mp) && /TN\.isDateName\(/.test(mp), () => 'S mirror-policy.js keeps DATE_LIKE or does not ask TN.isDateName');
  chk(() => !definitions(rm, 'WEEKDAY').length && /\.isWeekdayName\(/.test(rm) && !/week \?day/i.test(rm), () => 'S report-mirror.js keeps its WEEKDAY regex or does not ask isWeekdayName');
}

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd1a  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd1a  ${checks} checks`);
