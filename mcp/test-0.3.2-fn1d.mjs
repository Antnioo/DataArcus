import './test-env.mjs';
// 0.3.2 FN1D (mcp/work/FN1D.md): the three model-health functions split into named steps, behaviour identical. A
// characterisation suite: the whole output of each function for made-up models, recorded on the base (integration/0.3.2
// a16fa727, before the split) in fixtures/fn1d-health.json. FN1D_RECORD=1 records them again (only on the base, never
// to make a run pass). Made-up models only (fixtures/health-models.mjs, the Calendar Generator's own tables, the Gulf
// pack's test model in scripts/gulf-calendar/test-model).
//   E1-E*  model-health-engine.js analyze(): sp27's inputs and the Gulf models, the whole answer (findings, scores,
//          documentation, confirm, rawTables)
//   Q1-Q*  health-confirm.js pleaseConfirm(): each normalised model with and without ctx.userTables (the website's
//          worker gives userTables; a call without ctx reads every table)
//   G1-G*  gulf-health.js analyze(): one per model, every country (and one unknown), with and without Sharjah's
//          weekend, three asOf dates, two maxItems
//   node test-0.3.2-fn1d.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as F from './fixtures/health-models.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'fn1d-health.json');
const Health = require('../assets/js/model-health-engine.js');
const Index = require('../assets/js/model-index.js');
const Confirm = require('../assets/js/health-confirm.js');
const Gulf = require('../assets/js/gulf-health.js');
const Cal = require('../assets/js/calendar-generator.js');

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fn1d-')));
process.env.DATAARCUS_ROOT = ROOT;
const { loadModel, unreadableOf } = await import(new URL('./lib/model.mjs', import.meta.url).href);
F.copyFixtures(ROOT);
const viaLoader = (p) => { const m = loadModel(p, { root: ROOT }); return { model: m.tmsl, report: m.report, extra: unreadableOf(m) }; };

// ---------- the Gulf models (as test.mjs's gulf-health part writes them, and the Calendar Generator's own tables) ----------
const dax = (file) => fs.readFileSync(path.join(REPO, 'scripts/gulf-calendar/test-model', file), 'utf8').replace(/\r\n/g, '\n');
const calc = (name, expr) => ({ name, columns: [], partitions: [{ name, mode: 'import', source: { type: 'calculated', expression: expr } }] });
const mq = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"Date"}, {}) in Source' } }];
const col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const packMeasures = dax('measures.dax').split(/\n(?=    MEASURE 'Sales'\[)/).slice(1).map((b) => { const m = b.match(/MEASURE 'Sales'\[([^\]]+)\] =\n([\s\S]*?)(?=\nEVALUATE|$)/); return { name: m[1], expression: m[2] }; });
const salesT = (measures) => ({ name: 'Sales', columns: [col('Date', 'dateTime'), col('Amount', 'double')], partitions: mq('Sales'), measures });
const bim = (tables) => ({ compatibilityLevel: 1567, model: { tables, relationships: tables.length > 1 ? [{ name: 'r', fromTable: 'Sales', fromColumn: 'Date', toTable: tables[0].name, toColumn: 'Date' }] : [] } });
const total = [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }];
const packCal = dax('calendar.dax').replace(/^Calendar =\n/, '');
const base2018 = JSON.parse(fs.readFileSync(path.join(REPO, 'scripts/tests/fixtures/gulf-calendar/baseline.json'), 'utf8')).cg['10'].dax.replace(/^Calendar =\n/, '');
const imported = (cols) => ({ name: 'Calendar', columns: [col('Date', 'dateTime')].concat(cols.map((c) => col(c, /^Is /.test(c) ? 'boolean' : 'int64'))), partitions: mq('Calendar') });
const weekendLine = packCal.split('\n').find((l) => l.trim().startsWith('"Is Weekend", '));
const st = (o) => Object.assign({}, Cal.DEFAULTS, { start: '2021-01-01', end: '2023-12-31', fy: 4 }, o);
// moved: { 'year,month': 'YYYY-MM-DD' } a Hijri month's first day written in the generator's month list; edit: the DAX changed
const built = (o, measures, moved, edit) => { const b = Cal.build(st(o));
  let d = b.dax.split('\n').slice(1).join('\n');
  Object.entries(moved || {}).forEach(([k, v]) => { const [y, m] = k.split(','), re = new RegExp('"\\d{4}-\\d{2}-\\d{2}"(\\s*,\\s*' + y + '\\s*,\\s*' + m + '\\s*\\})'); if (!re.test(d)) throw new Error('no month ' + k); d = d.replace(re, '"' + v + '"$1'); });
  if (edit) d = edit(d);
  return bim([{ name: 'Calendar', columns: b.columns.map((name) => ({ name })), partitions: [{ source: { type: 'calculated', expression: d } }] }, salesT(measures || total)]); };
const GULF = [
  ['the pack\'s test model', () => bim([calc('Calendar', packCal), salesT(packMeasures)])],
  ['the generator\'s 2018-2030 calendar, no announced dates', () => bim([calc('Calendar', base2018), salesT(total)])],
  ['an imported calendar with Hijri, flags and weekend', () => bim([imported(['Hijri Year', 'Hijri Month Number', 'Hijri Day', 'Is Ramadan', 'Ramadan Day', 'Is Eid al-Fitr', 'Is Eid al-Adha', 'Is Weekend']), salesT(total)])],
  ['an imported calendar, Hijri only', () => bim([imported(['Hijri Year', 'Hijri Month Number', 'Hijri Day']), salesT(total)])],
  ['an imported calendar, no Hijri', () => bim([imported(['Year', 'Month']), salesT(total)])],
  ['no calendar', () => bim([{ name: 'Sales', columns: [col('Amount', 'double'), col('Region', 'string')], partitions: mq('Sales'), measures: total }])],
  ['the pack with another weekend form', () => bim([calc('Calendar', packCal.replace(weekendLine, '        "Is Weekend", WEEKDAY ( [Date], 2 ) > 5,')), salesT(packMeasures)])],
  ['the pack without its estimates column', () => bim([calc('Calendar', packCal.split('\n').filter((l) => !/"Is Estimated Date"/.test(l)).join('\n')), salesT(packMeasures)])],
  ...['uae', 'ksa', 'qat', 'kwt', 'bhr', 'omn', 'shj'].map((w) => ['the generator, weekend ' + w + ', announced dates', () => built({ weekend: w, observed: true })]),
  ['the generator, Saudi weekend, Umm al-Qura dates', () => built({ weekend: 'ksa', observed: false })],
  ['the generator, Omani weekend, Umm al-Qura 2018-2026', () => built({ weekend: 'omn', observed: false, start: '2018-01-01', end: '2026-12-31' })],
  ['the generator, no Hijri', () => built({ hijri: false })],
  ['the generator in Arabic', () => built({ lang: 'ar', observed: true })],
  ['the generator, a calendar ending in 2022', () => built({ start: '2020-06-01', end: '2022-02-01', observed: true }, packMeasures)],
  ['the generator, with the pack\'s measures', () => built({ observed: true, start: '2024-01-01', end: '2030-12-31' }, packMeasures)],
  ['an empty model', () => ({ model: { tables: [] } })],
  ['null', () => null],
  ['the generator, only a vs Last Ramadan measure', () => built({ observed: true }, [{ name: 'Sales vs Last Ramadan', expression: 'SUM ( Sales[Amount] )' }])],
  // (FN1D) the Gulf check's edges no case reached: months moved from Umm al-Qura (by two and five days, Dhu al-Hijja a
  // day early), Oman's own Ramadan 1440, a range that can't be read, a calendar ending in Ramadan, an Eid measure only,
  // a DAX calendar the generator did not make, Hijri and Eid columns without Ramadan's
  ['the generator, months moved: Ramadan 1443 two days late, Dhu al-Hijja 1443 a day early, Shawwal 1444 five days late', () => built({ observed: false }, null, { '1443,9': '2022-04-04', '1443,12': '2022-06-29', '1444,10': '2023-04-26' })],
  ['the generator, Ramadan 1443 five days late', () => built({ observed: false }, null, { '1443,9': '2022-04-07' })],
  ['the generator, Oman\'s own Ramadan 1440, from 17 May 2018', () => built({ weekend: 'omn', observed: false, start: '2018-05-17', end: '2019-12-31' }, null, { '1440,9': '2019-05-07' })],
  ['the generator, a range that can\'t be read', () => built({ observed: true }, null, null, (d) => d.replace(/CALENDAR\s*\(\s*DATE\s*\([^)]*\)\s*,\s*DATE\s*\([^)]*\)\s*\)/, 'CALENDAR ( MIN ( Sales[Date] ), MAX ( Sales[Date] ) )'))],
  ['the generator, ending in Ramadan 1443', () => built({ observed: true, end: '2022-04-15' })],
  ['the generator, an Eid measure only', () => built({ observed: true }, [{ name: 'Eid al-Fitr Window Sales', expression: 'SUM ( Sales[Amount] )' }])],
  ['a DAX calendar the generator did not make', () => bim([{ name: 'Calendar', dataCategory: 'Time', columns: [col('Date', 'dateTime'), col('Hijri Year', 'int64'), col('Hijri Month Number', 'int64'), col('Hijri Day', 'int64')], partitions: [{ name: 'Calendar', mode: 'import', source: { type: 'calculated', expression: 'CALENDAR ( DATE ( 2022, 1, 1 ), DATE ( 2022, 12, 31 ) )' } }] }, salesT(total)])],
  ['an imported calendar, Hijri and an Eid column', () => bim([imported(['Hijri Year', 'Hijri Month Number', 'Hijri Day', 'Is Eid al-Fitr']), salesT(total)])]
];

// ---------- the parts no other case reached (FN1D's mutants that turned nothing red, each red under this model first) ----------
// auto date tables of both kinds (not hidden, marked as dates), a function reading a column, a shared M expression, two
// sources with different counts (the most used one seen last), a row-number column, a query of 45 steps, a report with an auto date hierarchy's level
// and a hierarchy named as a column
const longM = 'let\n' + Array.from({ length: 45 }, (_, i) => '    S' + i + ' = ' + (i ? 'S' + (i - 1) : 'Csv.Document(File.Contents("C:\\\\data\\\\a.csv"))')).join(',\n') + '\nin\n    S44';
const extraModel = (bare) => { const m = { culture: 'en-US', tables: [
  { name: 'Sales', partitions: [{ name: 'Sales', mode: 'import', source: { type: 'm', expression: longM } }],
    columns: [{ name: 'RowNumber-2662979B-1795-4F74-8F37-6A1BA8059B61', dataType: 'int64', type: 'rowNumber', isHidden: true }, F.col('Date', 'dateTime'), F.col('Amount', 'double'), F.col('Extra', 'double'), F.col('Category', 'string'), F.col('Spare', 'string')],
    hierarchies: [{ name: 'Cat H', levels: [{ name: 'Category', column: 'Category' }] }],
    measures: [F.ms('Total', 'Twice ( SUM ( Sales[Amount] ) )'), F.ms('Plain', 'SUM ( Sales[Amount] )')] },
  { name: 'Lookup', partitions: [{ name: 'Lookup', mode: 'import', source: { type: 'm', expression: 'let S = Excel.Workbook(File.Contents("C:\\\\x.xlsx")), T = Csv.Document(Web.Contents("https://example.com/a.csv")) in T' } }], columns: [F.col('Key', 'int64'), F.col('Name', 'string')] },
  { name: 'LocalDateTable_0a1b', dataCategory: 'Time', partitions: [{ name: 'L', source: { type: 'calculated', expression: 'Calendar(Date(2020,1,1), Date(2020,12,31))' } }], columns: [F.col('Date', 'dateTime'), F.col('Year', 'int64')] },
  { name: 'DateTableTemplate_9f8e', dataCategory: 'Time', partitions: [{ name: 'D', source: { type: 'calculated', expression: 'Calendar(Date(2020,1,1), Date(2020,12,31))' } }], columns: [F.col('Date', 'dateTime'), F.col('Year', 'int64')] }],
  relationships: [], functions: [{ name: 'Twice', expression: '( x ) => x * 2 + SUM ( Sales[Extra] )' }],
  expressions: [{ name: 'Shared Source', kind: 'm', expression: 'let S = Excel.Workbook(File.Contents("C:\\\\shared.xlsx")) in S' },
    { name: 'Web Source', kind: 'm', expression: 'let A = Web.Contents("https://example.com/a"), B = Web.Contents("https://example.com/b") in B' }] };
  return bare ? m : { compatibilityLevel: 1702, model: m }; };
const extraReport = () => ({ format: 'pbir', files: [
  { path: 'definition/pages/p1/page.json', json: { name: 'p1', displayName: 'One' } },
  { path: 'definition/pages/p1/visuals/v1/visual.json', json: { visual: { visualType: 'clusteredColumnChart', query: { queryState: {
    Category: { projections: [{ field: { HierarchyLevel: { Expression: { Hierarchy: { Expression: { SourceRef: { Entity: 'Sales' } }, Hierarchy: 'Date' } }, Level: 'Year' } } }, { field: F.ent('Sales', 'Cat H') }] },
    Y: { projections: [{ field: F.ent('Sales', 'Total', 'Measure') }] } } } } } }] });

// ---------- E: analyze() ----------
const one = (model, report) => [{ model, report }];
const ENGINE = F.CASES(viaLoader).map(([name, make]) => [name, () => [make()]]).concat([
  ['calculation groups with a PBIR report', () => one(F.calcGroups(), F.calcGroupsReport())],
  ['measures using another table\'s measures, with a PBIR report', () => one(F.crossTable(), F.crossTableReport())],
  ['the incomplete TMDL model (a table file that is not TMDL)', () => [viaLoader('garbled/G.SemanticModel')]],
  ['the edge cases (sp27 E1)', () => [
    { model: F.rulesModel(), report: F.rulesReport() }, { model: F.rulesModel(), report: null }, { model: F.questionsModel(), report: null },
    ...F.guardModels(), { model: F.unusedModel(), report: F.unusedReport() }, { model: F.unusedModel(), report: null }, { model: null, report: null }, { model: {}, report: {} }]],
  ['the Gulf models', () => GULF.map(([, make]) => ({ model: make(), report: null }))],
  ['the tricky DAX with the legacy report, the Arabic model with the PBIR report', () => [{ model: F.trickyModel(), report: F.legacy() }, { model: F.arabicModel(), report: F.pbir() }]],
  ['FN1D\'s model, with its report, model only, and without the model wrapper', () => [{ model: extraModel(), report: extraReport() }, { model: extraModel(), report: null }, { model: extraModel(true), report: extraReport() }]]
]);

// ---------- B: the questions' edges (FN1D's mutants of health-confirm.js that turned nothing red; each red here first) ----------
const T = (name, cols, measures, extra) => Object.assign({ name, partitions: F.mp(name), columns: cols, measures: measures || [] }, extra || {});
const R = (f, fc, t, tc, extra) => Object.assign({ name: f + t + fc, fromTable: f, fromColumn: fc, toTable: t, toColumn: tc }, extra || {});
const M_ = (tables, relationships) => ({ compatibilityLevel: 1567, model: { culture: 'en-US', tables, relationships: relationships || [] } });
const sales = (measures, more) => T('Sales', [F.col('Date', 'dateTime'), F.col('Region', 'string'), F.col('Amount', 'double'), F.col('Revenue', 'double'), F.col('Qty', 'int64'), F.col('Cases', 'double')].concat(more || []), measures);
const cal = (extra, cols) => T('Calendar', cols || [F.col('Date', 'dateTime'), F.col('Year', 'int64')], [], extra);
const pf = (n, e, f) => F.ms(n, e, { formatString: f });
const BOUND = [
  ['measures at the edges: a lower-case table, 100 *, a column\'s amount, / 1000 *, all, an empty text, MIN, two concepts', () => M_([sales([
    F.ms('Total North', 'CALCULATE ( SUM ( Sales[Amount] ), sales[Region] <> "North" )'), pf('Share', '100 * DIVIDE ( SUM ( Sales[Amount] ), 2 )', '0.0%'),
    pf('Big', 'DIVIDE ( SUM ( Sales[Revenue] ), 1000 )', '#,0'), pf('Revenue Div', 'SUM ( Sales[Revenue] ) / 1000 * 3', '#,0'),
    F.ms('All Sales', 'CALCULATE ( SUM ( Sales[Amount] ), Sales[Region] <> "North" )'), F.ms('Total Empty', 'CALCULATE ( SUM ( Sales[Amount] ), Sales[Region] <> "" )'),
    F.ms('Min Deaths', 'MIN ( Sales[Cases] )'), F.ms('Revenue Cost', 'SUM ( Sales[Qty] )')])])],
  ['dates and formats at the edges: lag, day in lower case, MAX of a number, a ratio said as a margin, * 100 shown plain, bytes', () => M_([sales([
    F.ms('Current Lag', 'CALCULATE ( SUM ( Sales[Amount] ), DATEADD ( Sales[Date], -1, DAY ) )'), F.ms('Current Day', 'CALCULATE ( SUM ( Sales[Amount] ), DATEADD ( Sales[Date], -1, day ) )'),
    F.ms('Latest Qty', 'MAX ( Sales[Qty] ) - 1'), pf('Current Ratio Margin', 'DIVIDE ( 3, 2 )', '0%'), pf('Score', 'SUM ( Sales[Amount] ) * 100', '#,0'),
    pf('Revenue Bytes', 'DIVIDE ( SUM ( Sales[Revenue] ), 1000 )', '#,0')])])],
  ['relationships at the edges: one to one, a key not named as a key, a candidate in another relationship, two candidates', () => M_([
    T('Orders', [F.col('Customer Id', 'int64'), F.col('Ship Customer Key', 'int64'), F.col('Amount', 'double')]),
    T('Customers', [F.col('Ship Customer Key', 'int64', { isKey: true }), F.col('Name', 'string')]),
    T('Returns', [F.col('Customer Id', 'int64'), F.col('Customer Ref', 'int64')]), T('Refs', [F.col('Customer Ref', 'int64'), F.col('Name', 'string')]),
    T('Visits', [F.col('Shop Id', 'int64'), F.col('Visit Shop Key', 'int64'), F.col('Amount', 'double')]), T('Shops', [F.col('Visit Shop Key', 'int64'), F.col('Name', 'string')]),
    T('Notes', [F.col('Shop Id', 'int64'), F.col('Visit Shop Key', 'int64'), F.col('visit shop key ', 'int64')])],
  [R('Orders', 'Customer Id', 'Customers', 'Ship Customer Key', { fromCardinality: 'one' }), R('Returns', 'Customer Id', 'Refs', 'Customer Ref'),
    R('Visits', 'Shop Id', 'Shops', 'Visit Shop Key'), R('Visits', 'Visit Shop Key', 'Shops', 'Name', { isActive: false }), R('Notes', 'Shop Id', 'Shops', 'Visit Shop Key')])],
  ['a measures table with hidden columns, a field parameter, a DATATABLE calendar', () => M_([sales([F.ms('Total', 'SUM ( Sales[Amount] )')]),
    T('Calendar', [F.col('Date', 'dateTime', { isHidden: true }), F.col('Year', 'int64', { isHidden: true })], [F.ms('M1', '1')]),
    T('Dates', [F.col('Date', 'dateTime', { relatedColumnDetails: { groupByColumns: [] } }), F.col('Year', 'int64')]),
    T('Date Table', [F.col('Date', 'dateTime'), F.col('Year', 'int64')], [], { partitions: [{ name: 'D', source: { type: 'calculated', expression: 'DATATABLE ( "Date", DATETIME, {{ "2020-01-01" }} )' } }] })])],
  ['one regular table only, a calendar', () => M_([cal()])],
  ['a calendar read by a calculated table', () => M_([sales(), cal(), T('Copy', [F.col('Date', 'dateTime'), F.col('Year', 'int64')], [], { partitions: [{ name: 'C', source: { type: 'calculated', expression: 'FILTER ( Calendar, TRUE () )' } }] })])],
  ['a calendar read by a calculation group', () => M_([sales(), cal(), { name: 'Time Calc', partitions: [{ name: 'Time Calc', source: { type: 'calculationGroup' } }], calculationGroup: { calculationItems: [{ name: 'All', expression: 'CALCULATE ( SELECTEDMEASURE (), ALL ( Calendar ) )' }] }, columns: [F.col('Name', 'string')] }])],
  ['a calendar read only in a time-intelligence call, a period table marked as dates, a calendar read by MAX', () => M_([
    sales([F.ms('YTD', 'CALCULATE ( SUM ( Sales[Amount] ), DATESYTD ( Calendar[Date] ) )'), F.ms('Last', 'MAX ( Dates[Date] )')]), cal(),
    T('Periods', [F.col('Day', 'dateTime'), F.col('Year', 'int64')], [], { dataCategory: 'Time' }), T('Dates', [F.col('Date', 'dateTime'), F.col('Year', 'int64')])])],
  ['facts at the edges: two columns, a key named after Branches, a key marked as the key, a key DAX reads, an untyped key', () => M_([
    T('Small', [F.col('Amount', 'double'), F.col('Customer Key', 'int64')]), T('Customer', [F.col('Customer Key', 'int64'), F.col('Name', 'string')]),
    T('Footfall', [F.col('Branch Key', 'int64'), F.col('Amount', 'double'), F.col('Note', 'string')]), T('Branches', [F.col('Branch Key', 'int64'), F.col('Name', 'string')]),
    T('Orders', [F.col('Region Key', 'int64'), F.col('Amount', 'double'), F.col('Note', 'string')]), T('Region Map', [F.col('Region Key', 'int64', { isKey: true }), F.col('Weight', 'double')]),
    T('Bookings', [F.col('Agent Key', 'int64'), F.col('Amount', 'double'), F.col('Note', 'string')], [F.ms('Agents Booked', 'CALCULATE ( SUM ( Bookings[Amount] ), TREATAS ( VALUES ( Agent[Agent Key] ), Bookings[Agent Key] ) )')]),
    T('Agent', [F.col('Agent Key', 'int64', { isKey: true }), F.col('Name', 'string')]),
    T('Calls', [F.col('Line Key', 'int64'), F.col('Amount', 'double'), F.col('Note', 'string')]), T('Lines', [F.col('Line Key', 'unknown', { isKey: true }), F.col('Name', 'string')])])]
];

// ---------- Q: pleaseConfirm() ----------
const allModels = () => [].concat(...ENGINE.map(([, make]) => make().map((c) => c.model)));

// ---------- G: Gulf analyze() ----------
const COUNTRIES = ['uae', 'ksa', 'qat', 'kwt', 'bhr', 'omn', undefined, 'egy'];
const OPTS = [];
COUNTRIES.forEach((country) => [undefined, 'shj'].forEach((weekend) => ['2022-01-15', '2026-10-03', '2027-06-01'].forEach((asOf) => [undefined, 1, 500].forEach((maxItems) => OPTS.push({ country, weekend, asOf, maxItems })))));

const now = {};
const pin = (key, run) => { let t; try { t = JSON.stringify(run()); } catch (e) { t = 'threw: ' + String(e && e.stack || e).split('\n')[0]; } now[key] = { length: t.length, sha256: sha(t) }; };
ENGINE.forEach(([name, make], i) => pin('E' + (i + 1) + ' ' + name, () => make().map((c) => Health.analyze(c.model, c.report))));
allModels().forEach((m, i) => pin('Q' + (i + 1), () => {
  const M = Index.normalizeModel(m), userTables = M.tables.filter((t) => !/^(LocalDateTable_|DateTableTemplate_)/.test(t.name));
  return [Confirm.pleaseConfirm(M), Confirm.pleaseConfirm(M, {}), Confirm.pleaseConfirm(M, { userTables })];
}));
BOUND.forEach(([name, make], i) => pin('B' + (i + 1) + ' ' + name, () => { const M = Index.normalizeModel(make()); return [Confirm.pleaseConfirm(M), Health.analyze(make(), null).confirm]; }));
const gulfOut = [];
GULF.forEach(([name, make], i) => pin('G' + (i + 1) + ' ' + name, () => { const r = OPTS.map((o) => Gulf.analyze(make(), o)); gulfOut.push(...r); return r; }));

if (process.env.FN1D_RECORD === '1') {
  fs.writeFileSync(GOLD, JSON.stringify(now, null, 1) + '\n');
  console.log('recorded ' + Object.keys(now).length + ' outputs in ' + path.relative(REPO, GOLD));
}
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8'));
chk(() => Object.keys(gold).join('|') === Object.keys(now).join('|'), () => `F1. the same inputs as recorded: recorded ${Object.keys(gold).length}, now ${Object.keys(now).length}`);
Object.keys(gold).forEach((k) => chk(() => now[k] && now[k].sha256 === gold[k].sha256 && now[k].length === gold[k].length,
  () => `${k}: the output is not the base's (recorded ${gold[k].length} characters, now ${now[k] ? now[k].length : 'missing'})`));
// the cases reach what they pin: every Gulf finding, a cantTell of each kind, the questions of each kind
{
  const ids = new Set(), cant = new Set();
  gulfOut.forEach((r) => { r.findings.forEach((f) => ids.add(f.id)); r.cantTell.forEach((c) => cant.add(c.check)); });
  const want = ['GC_NO_CALENDAR', 'GC_NO_HIJRI', 'GC_NO_FLAGS', 'GC_WEEKEND', 'GC_DATES_DIFFER', 'GC_DATES_NOTE', 'GC_ESTIMATES', 'GC_ENDS_EARLY', 'GC_NO_MEASURES'];
  chk(() => want.every((x) => ids.has(x)) && ['weekend', 'dates', 'range'].every((x) => cant.has(x)), () => `C1. the Gulf cases raise every finding and each cantTell: missing ${want.filter((x) => !ids.has(x)).concat(['weekend', 'dates', 'range'].filter((x) => !cant.has(x))).join(', ')}`);
  const qs = new Set();
  allModels().forEach((m) => Confirm.pleaseConfirm(Index.normalizeModel(m)).forEach((q) => qs.add(q.id + (q.table ? ':' + q.table.looksLike : ''))));
  const wantQ = ['totalFilter', 'duplicateAggregate', 'wrongColumn', 'shiftedCurrentDate', 'ratioAsPercent', 'percentTwice', 'thousandsPlain', 'wrongRelationshipKey', 'unrelatedTable:date', 'unrelatedTable:fact'];
  chk(() => wantQ.every((x) => qs.has(x)), () => `C2. the models ask every question: missing ${wantQ.filter((x) => !qs.has(x)).join(', ')}`);
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log('FAIL script=test-0.3.2-fn1d.mjs cause=' + JSON.stringify(problems[0]).slice(0, 300)); problems.forEach((p) => console.log('  - ' + p)); }
console.log(`${problems.length ? 'FAIL' : 'PASS'}  fn1d  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
