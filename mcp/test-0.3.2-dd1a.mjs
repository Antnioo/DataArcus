// DD1A (0.3.2; the owner, D-1104-15, 4 Nov: one time test for all four places; D-1104-12 "a library of functions where
// a place calls them so if we need to fix something we fix it at the source"; D-1104-18; D-1016-01): one answer to "is
// this column, by its name, a date part?". The words and the list live in assets/js/time-names.js only
// (mcp/docs/CONTRACTS.md, family 1a).
//   U1  the ledger's 24 made-up names and the false cases (Amount, Sales, Category, «المبيعات», Region, Holiday, Today,
//       Birthday, Dateline: a time word inside a longer word is not one): isTimeName pinned
//   U2  wordsOf pinned: camel case, "_", "-", digits, the Arabic article, short vowels, «أ» read as «ا»
//   U3  every word of the list and its plural is time, alone and with the article; the list is frozen
//   U4  never throws on an odd input (null, a number, an object), never a data value: names only
// Made-up names only.   node test-0.3.2-dd1a.mjs
import { createRequire } from 'node:module';

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

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd1a  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd1a  ${checks} checks`);
