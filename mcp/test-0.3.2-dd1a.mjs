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

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  dd1a  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  dd1a  ${checks} checks`);
