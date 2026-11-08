import './test-env.mjs';
// 0.3.2 FN1G (mcp/work/FN1G.md): three mcp/lib functions split into named steps, behaviour identical. A
// characterisation suite: the whole output of each function, recorded on the base (integration/0.3.2 1ee00b30, before
// the split) in fixtures/fn1g-pins.json. FN1G_RECORD=1 records them again (only on the base, never to make a run pass).
// Made-up models and reports only (the twin-project fixture and copies of it edited here).
//   G1-G*  gulf-calendar.mjs addGulfCalendar(): every refusal, country, weekend, option, relateTo and measures shape,
//          the answer and the script the writer is given (the write itself is the writer's: none here)
//   Q1-Q*  gulf-date-questions.mjs gulfDateQuestions(): made-up models with and without a calendar (generated, named,
//          none), every question, answer, problem and the memory between calls (in this order, one process)
//   T1-T*  twin-copy.mjs languageCopy() through create_arabic_twin into "same" (the plan, the write, every file),
//          on copies of the twin project edited for each edge (tabs shown, sync groups, buttons with no room,
//          bookmarks, filters, pictures, pages.json, .platform)
//   node test-0.3.2-fn1g.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
// first: a fresh working folder and the seeded random, before the tools load
import { ROOT, twin, norm, filesOf, sha, put, rd, lf, L, Q, obj } from './fixtures/twin-runs.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const GOLD = path.join(HERE, 'fixtures', 'fn1g-pins.json');
const { addGulfCalendar } = await import('./lib/gulf-calendar.mjs');
const { gulfDateQuestions } = await import('./lib/gulf-date-questions.mjs');
const Gulf = require('../assets/js/gulf-health.js');
const Fix = require('../assets/js/model-health-tmdl.js');
const Cal = require('../assets/js/calendar-generator.js');
const pin = (t) => ({ length: t.length, sha256: sha(t) });
const got = {}, texts = {};
const keep = (k, t) => { got[k] = pin(t); texts[k] = t; };

// ---------- made-up models ----------
const mq = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType, more) => Object.assign({ name, sourceColumn: name }, dataType ? { dataType } : {}, more || {});
const tbl = (name, columns, measures) => Object.assign({ name, columns, partitions: mq(name) }, measures ? { measures } : {});
const rel = (name, fromTable, fromColumn, toTable, toColumn, isActive) => Object.assign({ name, fromTable, fromColumn, toTable, toColumn }, isActive === false ? { isActive: false } : {});
const bim = (tables, relationships) => ({ compatibilityLevel: 1567, model: { tables, relationships: relationships || [] } });
const SALES = () => tbl('Sales', [col('Date', 'dateTime'), col('OrderDate', 'dateTime'), col('ShipDate'), col('Amount', 'double'), col('Name', 'string'), col('Kind', 'unknown'), col('RowNumber-1', 'int64', { type: 'rowNumber' })],
  [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0.00' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )' }, { name: 'Odd`Name', expression: '1' }, { name: 'Ctl\tName', expression: '1' },
    { name: 'Margin', expression: 'DIVIDE ( 1, 2 )', formatString: '0.0%' }, { name: 'Units', expression: '1' }, { name: 'Cost', expression: '1' }]);
const genCal = (name, o) => { const b = Cal.build(Object.assign({}, Cal.DEFAULTS, { name, start: '2022-01-01', end: '2024-12-31', hijri: true, observed: true }, o || {}));
  return { name, columns: b.columns.map((c) => col(c, /Date$/.test(c) && c !== 'Is Estimated Date' ? 'dateTime' : null, c === 'Hijri Month Name' ? { sortByColumn: 'Hijri Month Number' } : {})), partitions: [{ name, mode: 'import', source: { type: 'calculated', expression: b.dax.split('\n').slice(1).join('\n') } }] }; };
const M = {
  plain: bim([SALES(), tbl('Ctl\tT', [col('Date', 'dateTime')])]),
  related: bim([SALES(), tbl('Calendar', [col('Date', 'dateTime')]), tbl('Orders', [col('OrderDate', 'dateTime'), col('Due', 'dateTime')]), tbl('Dates2', [col('Date', 'dateTime')]), tbl('Other', [col('Date', 'dateTime')]),
    tbl('TextDates', [col('Date', 'string')]), tbl('LocalDateTable_1', [col('Date', 'dateTime')]), tbl('Untyped', [col('Date')])],
  [rel('r1', 'Sales', 'Date', 'Calendar', 'Date'), rel('r2', 'Orders', 'OrderDate', 'Dates2', 'Date'), rel('r3', 'Dates2', 'Date', 'Other', 'Date'), rel('r4', 'Sales', 'OrderDate', 'LocalDateTable_1', 'Date'),
    rel('r5', 'Orders', 'Due', 'TextDates', 'Date'), rel('r6', 'Sales', 'ShipDate', 'Untyped', 'Date'), rel('DataArcus Gulf Calendar 1', 'Orders', 'Due', 'Other', 'Date', false)]),
  taken: bim([SALES(), tbl('Gulf Calendar', [col('Date', 'dateTime')]), tbl('Gulf Calendar 2', [col('Gulf Calendar 3', 'string')]), tbl('Gulf Currency Pegs', [col('Currency', 'string')])]),
  gen: bim([SALES(), genCal('Calendar')], [rel('r1', 'Sales', 'Date', 'Calendar', 'Date')]),
  empty: bim([])
};
const mOf = (k) => ({ tmsl: JSON.parse(JSON.stringify(M[k])), source: 'fn1g-' + k });

// ---------- G: addGulfCalendar ----------
const GC_DIR = path.join(ROOT, 'gc');
const gcRun = (k, a, how) => {
  const writes = [];
  const env = { Gulf, Fix, scriptDir: how === 'noDir' ? null : GC_DIR, scriptBase: 'M',
    writeScript: (dir, base, script) => { writes.push([dir, base, script]);
      if (how === 'left') { const e = new Error('Nothing was written: the model changed since the plan.'); e.left = ['x']; throw e; }
      if (how === 'nothing') throw new Error('Nothing was written: the name the plan showed is taken.');
      if (how === 'code') { const e = new Error('denied'); e.code = 'EACCES'; throw e; }
      if (how === 'msg') throw new Error('disk full');
      if (how === 'str') throw 'plain';
      return path.join(dir, base + '.tmdl'); } };
  let out;
  try { out = { ok: addGulfCalendar(mOf(k), a, env) }; } catch (e) { out = { err: String(e && e.message), left: e && e.left || null }; }
  return norm(JSON.stringify({ out, writes }, null, 1));
};
const Y = { firstYear: 2023, lastYear: 2024 };
const G_CASES = [
  ['plain', {}], ['plain', Y], ['plain', { country: 'xx', ...Y }], ['plain', { firstYear: 2024 }], ['plain', { firstYear: 2024.5, lastYear: 2025 }], ['plain', { firstYear: 2025, lastYear: 2024 }],
  ['plain', { firstYear: 1950, lastYear: 2010 }], ['plain', { firstYear: 1950, lastYear: 2009 }], ['plain', { firstYear: 1900, lastYear: 1901 }], ['plain', { firstYear: 999, lastYear: 1000 }], ['plain', { firstYear: 9998, lastYear: 10000 }], ['plain', { firstYear: 1901, lastYear: 1901 }],
  ['plain', { name: '', ...Y }], ['plain', { name: ' Bad-Name ', ...Y }], ['plain', { name: 'x'.repeat(41), ...Y }], ['plain', { name: 'x'.repeat(40), ...Y }], ['plain', { name: 'LocalDateTable_x', ...Y }], ['plain', { name: 'datetabletemplate_y', ...Y }],
  ['plain', { name: 'total  SALES', ...Y }], ['plain', { name: 'amount', ...Y }], ['plain', { name: 'التقويم الخليجي', ...Y }], ['plain', { name: null, ...Y }], ['plain', { name: 12, ...Y }],
  ['taken', Y], ['taken', { name: 'gulf calendar 3', ...Y }], ['taken', { name: 'Gulf Calendar 4', pegs: true, ...Y }],
  ...['uae', 'ksa', 'qat', 'kwt', 'bhr', 'omn'].map((c) => ['plain', { country: c, ...Y }]),
  ...['omn', 'qat', 'ksa'].map((c) => ['plain', { country: c, announced: false, ...Y }]),
  ...['country', 'sat-sun', 'fri-sat', 'fri', 'sun', 'shj', 'ksa', 'omn', 'bad', null].map((w) => ['plain', { weekend: w, ...Y }]),
  ['plain', { weekStart: 'monday', fiscalStart: 7, lang: 'ar', arabicNames: false, ...Y }], ['plain', { weekStart: 'saturday', ...Y }], ['plain', { vat: true, ...Y }], ['plain', { vat: true, country: 'kwt', ...Y }], ['plain', { vat: true, country: 'omn', firstYear: 2020, lastYear: 2021 }],
  ['plain', { pegs: true, ...Y }], ['plain', { pegs: true, vat: true, measures: ['Sales[Total Sales]'], relateTo: ['Sales[Date]'], ...Y }],
  ['plain', { asOf: '2023-06-01', ...Y }], ['plain', { asOf: '2026-12-01', firstYear: 2025, lastYear: 2027 }], ['plain', { firstYear: 2025, lastYear: 2030 }], ['plain', { firstYear: 2010, lastYear: 2012 }], ['plain', { announced: false, firstYear: 2025, lastYear: 2027 }],
  ['plain', { relateTo: ['Sales[Date]', 'Sales[OrderDate]', 'Sales[ShipDate]', 'Sales[Kind]', 'Ctl\tT[Date]', 'x[y]'], ...Y }], ['plain', { relateTo: ['Sales Date'], ...Y }], ['plain', { relateTo: ['Sales[Nope]'], ...Y }],
  ['plain', { relateTo: ['Nope[Date]'], ...Y }], ['plain', { relateTo: ['LocalDateTable_1[Date]'], ...Y }], ['plain', { relateTo: ['Sales[Amount]'], ...Y }], ['plain', { relateTo: ['Sales[RowNumber-1]'], ...Y }], ['plain', { relateTo: ['Sales[Date]', ' sales[date] '], ...Y }],
  ['plain', { relateTo: ['Sales[ShipDate]', 'Sales[Kind]'], ...Y }], ['plain', { relateTo: ['Sales[Kind]'], ...Y }], ['plain', { relateTo: ["'Sales'[Date]"], ...Y }], ['plain', { relateTo: ['Ctl\tT[Date]'], ...Y }],
  ['related', { relateTo: ['Sales[Date]'], ...Y }], ['related', { relateTo: ['Orders[OrderDate]'], ...Y }], ['related', { relateTo: ['Sales[OrderDate]'], ...Y }], ['related', { relateTo: ['Orders[Due]'], ...Y }],
  ['related', { relateTo: ['Sales[ShipDate]'], ...Y }], ['related', { relateTo: ['Sales[Date]', 'Orders[OrderDate]', 'Orders[Due]', 'Sales[OrderDate]', 'Sales[ShipDate]'], ...Y }], ['related', { relateTo: ['Sales[Date]', 'Calendar[Date]'], ...Y }],
  ['related', Y], ['related', { name: 'Calendar', ...Y }], ['gen', Y], ['gen', { relateTo: ['Sales[OrderDate]'], ...Y }], ['empty', Y],
  ['plain', { measures: 'Sales[Total Sales]', ...Y }], ['plain', { measures: ['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Margin]'], ...Y }], ['plain', { measures: ['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Margin]', 'Sales[Units]', 'Sales[Cost]', 'Sales[Name]'], ...Y }],
  ['plain', { measures: ['Sales Total'], ...Y }], ['plain', { measures: ['Sales[Amount]'], ...Y }], ['plain', { measures: ['Nope[Total Sales]'], ...Y }], ['plain', { measures: ['Sales[Odd`Name]'], ...Y }], ['plain', { measures: ['Sales[Ctl\tName]'], ...Y }],
  ['plain', { measures: ['Sales[Total Sales]', 'sales[total  sales]'], ...Y }], ['plain', { measures: [], ...Y }], ['plain', { measures: null, ...Y }], ['plain', { measures: ["'Sales'[Orders]"], country: 'ksa', ...Y }],
  ['plain', { measures: ['Sales[Orders]', 'Sales[Units]'], relateTo: ['Sales[Date]', 'Sales[Date]'], ...Y }], ['plain', { measures: ['Sales[Nope]'], relateTo: ['Sales[Nope]'], ...Y }],
  ['related', { measures: ['Sales[Total Sales]'], relateTo: ['Orders[Due]'], ...Y }], ['taken', { measures: ['Sales[Total Sales]'], pegs: true, name: 'Total Sales Last Ramadan', ...Y }]
];
G_CASES.forEach(([k, a], i) => keep(`G${i + 1}`, gcRun(k, a)));
['noDir', 'left', 'nothing', 'code', 'msg', 'str'].forEach((how, i) => keep(`G${G_CASES.length + 1 + i} writer ${how}`, gcRun('plain', { measures: ['Sales[Total Sales]'], ...Y }, how)));

// ---------- Q: gulfDateQuestions ----------
const named = () => tbl('Cal', [col('Date', 'dateTime'), col('Hijri_Year', 'int64'), col('الشهر الهجري', 'string', { sortByColumn: 'Hijri Month No' }), col('Hijri Month No', 'int64'), col('Ramadan Flag', 'boolean'),
  col('Ramadan Day', 'int64'), col('Estimated', 'boolean'), col('Hijri Year 2', 'int64'), col('RowNumber-2', 'int64', { type: 'rowNumber' })]);
const plainNames = () => tbl('Cal', [col('Date', 'dateTime'), col('Hijri Month Name', 'string'), col('Ramadan Day', 'int64'), col('Is Ramadan', 'boolean'), col('Hijri Year', 'int64')]);
const facts = (more) => tbl('Sales', [col('OrderDate', 'dateTime'), col('ShipDate', 'dateTime'), col('DueDate', 'date'), col('Amount', 'double'), col('Region', 'string'), ...(more || [])],
  [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )' }, { name: 'Ship Sales', expression: 'CALCULATE ( [Total Sales], USERELATIONSHIP ( Sales[ShipDate], Calendar[Date] ) )' },
    { name: 'Ship Sales 2', expression: ['CALCULATE ( [Total Sales],', "USERELATIONSHIP ( 'Sales'[ ShipDate ], Calendar[Date] ) )"] }, { name: 'Lines', expression: 'COUNTROWS ( Sales )' }]);
const QM = {
  gen: bim([facts(), genCal('Calendar'), tbl('Returns', [col('ReturnDate', 'dateTime')], [{ name: 'Returns', expression: 'COUNTROWS ( Returns )' }]), tbl('LocalDateTable_9', [col('Date', 'dateTime')]),
    tbl('Misc', [col('Note', 'string')], [{ name: 'Other Ship', expression: 'CALCULATE ( 1, USERELATIONSHIP ( Sales[ShipDate], Calendar[Date] ) )' }, { name: 'Other Ship 2', expression: 'CALCULATE ( 2, USERELATIONSHIP ( Sales[ShipDate], Calendar[Date] ) )' }])],
  [rel('a', 'Sales', 'OrderDate', 'Calendar', 'Date'), rel('b', 'Sales', 'ShipDate', 'Calendar', 'Date', false), rel('c', 'Sales', 'Region', 'Regions', 'Region'), { name: 'broken', fromTable: 'Sales' }]),
  genEst: bim([facts(), genCal('Calendar', { observed: false })], [rel('a', 'Sales', 'OrderDate', 'Calendar', 'Date'), rel('b', 'Sales', 'ShipDate', 'Calendar', 'Date', false)]),
  named: bim([facts(), named()], [rel('a', 'Sales', 'OrderDate', 'Cal', 'Date'), rel('b', 'Sales', 'ShipDate', 'Cal', 'Date')]),
  plainNames: bim([facts(), plainNames()], [rel('a', 'Sales', 'OrderDate', 'Cal', 'Date', false)]),
  one: bim([tbl('Sales', [col('OrderDate', 'dateTime'), col('Amount', 'double')], [{ name: 'Total Sales', expression: '1' }]), tbl('Cal', [col('Date', 'dateTime'), col('Month', 'string')])], [rel('a', 'Sales', 'OrderDate', 'Cal', 'Date')]),
  none: bim([facts()]),
  noRel: bim([facts(), genCal('Calendar')], [])
};
const qRun = (k, a, opts, src) => { let out; try { out = gulfDateQuestions({ tmsl: JSON.parse(JSON.stringify(QM[k])), source: src || 'fn1g-q-' + k }, a, opts); } catch (e) { out = { threw: String(e && e.message) }; } return JSON.stringify(out, null, 1); };
const PF = (o) => Object.assign({ kpis: ['Sales[Total Sales]'] }, o);
const ram = (f, values) => ({ field: f, values: values || ['True'] });
const Q_CASES = [
  ['gen', {}], ['gen', { planFields: PF() }], ['gen', { planFields: PF(), gulfDates: {} }], ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }) }], ['gen', { planFields: {} }, { axis: 'Sales[OrderDate]' }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }), pageFilters: [ram('Calendar[Is Ramadan]')] }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }), pageFilters: [ram('Calendar[Is Eid al-Fitr]')] }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Hijri Month Name]' }), pageFilters: [ram('Calendar[Hijri Year]', [1445])] }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }), gulfDates: { dateRole: 'Sales[ShipDate]' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }), gulfDates: { dateRole: 'Sales[Nope]' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]', measure: 'Sales[Ship Sales]', kpis: ['Sales[Ship Sales]', 'Sales[Ship Sales 2]'] }), gulfDates: { dateRole: 'Sales[ShipDate]' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]', kpis: ['Sales[Ship Sales]', 'Sales[Total Sales]'] }), gulfDates: { dateRole: "'Sales'[ShipDate]" } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]', kpis: ['Misc[Other Ship]', 'Nope[X]', 'Sales[Lines]'] }), gulfDates: { dateRole: 'Sales[ShipDate]' } }],
  ['gen', { planFields: { timeAxis: 'Calendar[Date]' }, gulfDates: { dateRole: 'Sales[ShipDate]' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }), gulfDates: { dateRole: 'Sales[OrderDate]' } }],
  ['gen', { planFields: PF({ timeAxis: 'Sales[ShipDate]' }), gulfDates: { dateRole: 'Sales[ShipDate]' } }],
  ['gen', { planFields: PF({ timeAxis: 'Sales[ShipDate]' }) }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]', kpis: ['Returns[Returns]'] }), gulfDates: { dateRole: 'Returns[ReturnDate]' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }), pageFilters: [ram('Calendar[Is Ramadan]')], gulfDates: { grain: 'gregorian', scope: 'all' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Hijri Month Name]' }), pageFilters: [ram('Calendar[Is Ramadan]')], gulfDates: { grain: 'gregorian', scope: 'all' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }), pageFilters: [ram('Calendar[Is Ramadan]')], gulfDates: { grain: 'hijri' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Hijri Month Name]' }), pageFilters: [ram('Calendar[Is Ramadan]')], gulfDates: { grain: 'hijri', scope: 'year' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }), pageFilters: [ram('Calendar[Is Ramadan]')], gulfDates: { grain: 'seasonDay', scope: 'year', year: 1445 } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Ramadan Day]' }), pageFilters: [ram('Calendar[Is Ramadan]'), ram('Calendar[Hijri Year]', [1445])], gulfDates: { grain: 'seasonDay', scope: 'year', year: 1445, country: 'omn' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Ramadan Day]' }), pageFilters: [ram('Calendar[Is Ramadan]'), ram('Calendar[Hijri Year]', [1444])], gulfDates: { grain: 'seasonDay', scope: 'year', year: 1445, country: 'qat' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Ramadan Day]' }), pageFilters: [ram('Calendar[Is Ramadan]'), ram('Calendar[Hijri Year]', []), ram('Calendar[Hijri Year 2]')], gulfDates: { grain: 'seasonDay', scope: 'year', year: 1446, country: 'kwt' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Ramadan Day]' }), pageFilters: [ram('Calendar[Is Ramadan]'), ram('Calendar[Hijri Year]', [1448])], gulfDates: { grain: 'seasonDay', scope: 'year', year: 1448, country: 'uae' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }), pageFilters: [ram('Calendar[Is Ramadan]'), ram('Calendar[Hijri Year]', [1445]), null, { field: 'bad' }], gulfDates: { grain: 'gregorian', scope: 'all', country: 'bhr' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }), pageFilters: [ram('Calendar[Is Ramadan]')], gulfDates: { grain: 'weekly', scope: 'some', year: '1445', hijriYearColumn: 'Calendar[Hijri Year]' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }), pageFilters: [ram('Calendar[Is Ramadan]')], gulfDates: { scope: 'year', hijriYearColumn: 'Calendar[Nope]' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }), pageFilters: [ram('Calendar[Is Ramadan]')], gulfDates: { scope: 'year', year: 1445, hijriYearColumn: 'Calendar[Hijri Year]' } }],
  // the memory: the same model again with no answers given (the earlier ones come back), then a model changed
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }), pageFilters: [ram('Calendar[Is Ramadan]')] }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }), pageFilters: [ram('Calendar[Is Ramadan]')], gulfDates: { grain: 'hijri' } }],
  ['genEst', { planFields: PF({ timeAxis: 'Calendar[Date]' }), pageFilters: [ram('Calendar[Is Ramadan]')], gulfDates: { grain: 'gregorian', scope: 'year', year: 1445, country: 'ksa' } }],
  ['genEst', { planFields: PF({ timeAxis: 'Calendar[Date]' }), pageFilters: [ram('Calendar[Is Ramadan]')], gulfDates: { grain: 'gregorian', scope: 'all', country: 'omn' } }],
  ['named', { planFields: PF() }], ['named', { planFields: PF({ timeAxis: 'Cal[Date]' }), pageFilters: [ram('Cal[Ramadan Flag]')] }],
  ['named', { planFields: PF({ timeAxis: 'Cal[الشهر الهجري]' }), pageFilters: [ram('Cal[Ramadan Flag]')], gulfDates: { grain: 'hijri', scope: 'year', year: 1445, dateRole: 'Sales[OrderDate]' } }],
  ['named', { planFields: PF({ timeAxis: 'Cal[Date]' }), pageFilters: [ram('Cal[Ramadan Flag]'), ram('Cal[Hijri_Year]', [1445])], gulfDates: { grain: 'seasonDay', scope: 'year', year: 1445, hijriYearColumn: 'Cal[Hijri Year 2]' } }],
  ['named', { planFields: PF({ timeAxis: 'Cal[Date]' }), pageFilters: [ram('Cal[Ramadan Flag]'), ram('Cal[Hijri Year 2]', [1445])], gulfDates: { grain: 'gregorian', scope: 'year', year: 1445 } }],
  ['named', { planFields: PF({ timeAxis: 'Cal[Date]' }), pageFilters: [ram('Cal[Ramadan Flag]')], gulfDates: { scope: 'all', grain: 'gregorian' } }],
  ['named', { planFields: PF({ timeAxis: 'Cal[Date]' }), pageFilters: [ram('Cal[Ramadan Flag]')], gulfDates: { scope: 'year', year: 1445, grain: 'gregorian', dateRole: 'Sales[ShipDate]' } }],
  ['plainNames', { planFields: PF({ timeAxis: 'Cal[Date]' }), pageFilters: [ram('Cal[Is Ramadan]')], gulfDates: { grain: 'hijri', scope: 'year', year: 1445 } }],
  ['plainNames', { planFields: PF({ timeAxis: 'Cal[Hijri Month Name]' }), pageFilters: [ram('Cal[Is Ramadan]')], gulfDates: { grain: 'hijri', scope: 'year', year: 1445, hijriYearColumn: 'Cal[Hijri Year]' } }],
  ['plainNames', { planFields: PF({ timeAxis: 'Cal[Date]' }), gulfDates: { dateRole: 'Sales[OrderDate]' } }],
  ['one', { planFields: PF({ timeAxis: 'Cal[Date]' }), gulfDates: { grain: 'hijri' } }], ['one', { planFields: PF({ timeAxis: 'Cal[Date]' }), gulfDates: { grain: 'seasonDay', scope: 'year', year: 1445 } }],
  ['one', { planFields: PF({ timeAxis: 'Cal[Date]' }), pageFilters: [ram('Cal[Ramadan]')], gulfDates: { scope: 'all', grain: 'gregorian' } }], ['one', { planFields: PF() }],
  ['none', { planFields: PF() }], ['none', { planFields: PF(), gulfDates: { grain: 'hijri', scope: 'year', year: 1445, firstYear: 2022, lastYear: 2024, country: 'ksa' } }],
  ['none', { planFields: PF(), pageFilters: [ram('Sales[Ramadan]')], gulfDates: { grain: 'seasonDay', scope: 'year', country: 'zz', firstYear: 2022.5 } }],
  ['none', { planFields: { timeAxis: 'Sales[OrderDate]' }, gulfDates: { dateRole: 'Sales[ShipDate]' } }],
  ['noRel', { planFields: PF({ timeAxis: 'Calendar[Date]' }), pageFilters: [ram('Calendar[Is Ramadan]')] }], ['noRel', { planFields: PF({ timeAxis: 'Calendar[Date]' }), gulfDates: { dateRole: 'Sales[OrderDate]' } }],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }), gulfDates: { dateRole: 'Sales[ShipDate]' } }, null, 'fn1g-q-gen-again'],
  ['gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }) }, null, 'fn1g-q-gen-again']
];
Q_CASES.forEach(([k, a, o, src], i) => keep(`Q${i + 1}`, qRun(k, a, o, src)));
// the memory's cap: many answers recorded for many models, then the first model asked again (its answer dropped)
for (let i = 0; i < 2600; i++) qRun('one', { planFields: PF({ timeAxis: 'Cal[Date]' }), gulfDates: { grain: 'gregorian', scope: 'all' } }, null, 'fn1g-cap-' + i);
keep(`Q${Q_CASES.length + 1} after the memory's cap`, qRun('gen', { planFields: PF({ timeAxis: 'Calendar[Date]' }), pageFilters: [ram('Calendar[Is Ramadan]')] }));
keep(`Q${Q_CASES.length + 2} the last of the cap`, qRun('one', { planFields: PF({ timeAxis: 'Cal[Date]' }), pageFilters: [ram('Cal[Ramadan]')] }, null, 'fn1g-cap-2599'));

// ---------- T: the EN-AR copy (languageCopy) through create_arabic_twin into "same" ----------
const PROJ = path.join(HERE, 'fixtures/twin-project'), RD = 'Twin Sales.Report/definition';
const T_CASES = [];
const tcase = (name, edit, args, own) => T_CASES.push([name, edit, args || {}, own]);
const at = (dir, rel) => path.join(ROOT, dir, rel);
const edit = (dir, rel, f) => { const p = at(dir, rel), j = rd(p); const r = f(j); put(p, r === undefined ? j : r); };
const visualRel = (pg, v) => `${RD}/pages/${pg}/visuals/${v}/visual.json`;
tcase('T1 as it is, English tabs', null);
tcase('T2 the Arabic tabs shown', null, { tabsShown: 'ar' });
tcase('T3 no .platform, pages.json opens on the tooltip page, Arabic tabs', (d) => { fs.rmSync(at(d, 'Twin Sales.Report/.platform')); edit(d, `${RD}/pages/pages.json`, (j) => { j.activePageName = 'p3tooltip'; }); }, { tabsShown: 'ar' });
tcase('T4 pages.json with no order and no active page', (d) => edit(d, `${RD}/pages/pages.json`, (j) => { delete j.pageOrder; delete j.activePageName; }), { tabsShown: 'ar' });
tcase('T5 pages.json and bookmarks.json not JSON', (d) => { fs.writeFileSync(at(d, `${RD}/pages/pages.json`), '{ not json'); fs.writeFileSync(at(d, `${RD}/bookmarks/bookmarks.json`), 'nope'); });
tcase('T6 a slicer in its own sync group, one of two fields, a list slicer', (d) => {
  edit(d, visualRel('p1overview', 'slRegion'), (j) => { j.visual.syncGroup = { groupName: 'Region sync', fieldChanges: true, filterChanges: false }; });
  const two = rd(at(d, visualRel('p1overview', 'slRegion'))); two.name = 'slTwo'; delete two.visual.syncGroup; two.position = Object.assign({}, two.position, { y: 300, z: 7100, tabOrder: 7100 });
  two.visual.query.queryState.Values.projections.push(JSON.parse(JSON.stringify(two.visual.query.queryState.Values.projections[0]))); put(at(d, visualRel('p1overview', 'slTwo')), two);
  const three = rd(at(d, visualRel('p1overview', 'slRegion'))); three.name = 'slList'; delete three.visual.syncGroup; three.visual.visualType = 'listSlicer'; three.position = Object.assign({}, three.position, { x: 40, y: 600, z: 7200, tabOrder: 7200 });
  three.visual.query.queryState.Values.projections[0].queryRef = 'Sales.' + 'R'.repeat(90); put(at(d, visualRel('p1overview', 'slList')), three);
  const four = rd(at(d, visualRel('p1overview', 'slRegion'))); four.name = 'slNoRef'; delete four.visual.syncGroup; four.position = Object.assign({}, four.position, { x: 40, y: 660, z: 7300, tabOrder: 7300 }); delete four.visual.query.queryState.Values.projections[0].queryRef; put(at(d, visualRel('p1overview', 'slNoRef')), four);
});
tcase('T7 a drillthrough page, page links, a tooltip link and a bookmark link on a visual', (d) => {
  edit(d, `${RD}/pages/p2details/page.json`, (j) => { j.pageBinding = { name: 'drillBinding', type: 'Drillthrough', parameters: [] }; j.filterConfig = { filters: [{ name: 'pf1', type: 'Categorical' }, { name: 'pf2' }, { noName: true }] }; j.visualInteractions = [{ source: 'barProduct', target: 'tblProducts', type: 'NoFilter' }, { source: 'zzz', target: 'barProduct' }, null]; });
  edit(d, visualRel('p1overview', 'btnDetails'), (j) => { j.visual.visualContainerObjects = Object.assign({}, j.visual.visualContainerObjects, { visualLink: [{ properties: { show: L('true'), type: Q('PageNavigation'), navigationSection: Q('p2details'), bookmark: Q('bmDetails') } }, { properties: { drillthroughSection: Q('p2details'), section: Q('nope') } }, 'x', { noProps: 1 }],
    visualTooltip: [{ properties: { type: Q('ReportPage'), section: Q('p3tooltip') } }] }); j.filterConfig = { filters: [{ name: 'vf1' }] }; });
});
tcase('T8 bookmarks: a group (with and without its Arabic name), filters by name, visual groups, other pages', (d) => {
  edit(d, `${RD}/bookmarks/bookmarks.json`, (j) => { j.items = [{ name: 'grp1', displayName: 'Views', children: ['bmReset', 'bmDetails', 'bmGone'] }, { name: 'grp2', displayName: 'Empty', children: [] }, 'odd', { name: 'bmLoose' }]; });
  edit(d, `${RD}/bookmarks/bmDetails.bookmark.json`, (j) => { j.explorationState = { version: '1.3', activeSection: 'p2details', sections: { p2details: { filters: { byName: { pf1: { x: 1 }, keep: {} } }, visualContainers: { barProduct: { filters: { byName: { pf2: {} } } }, ghost: {} }, visualContainerGroups: { g0: {} } }, elsewhere: { visualContainers: { a: {} } }, p1overview: 'odd' } }; j.options = { targetVisualNames: ['barProduct', 'ghost'] }; });
  edit(d, `${RD}/pages/p2details/page.json`, (j) => { j.filterConfig = { filters: [{ name: 'pf1' }, { name: 'pf2' }] }; });
  edit(d, `${RD}/bookmarks/bmReset.bookmark.json`, (j) => { delete j.explorationState; });
}, null, { 'bookmarkGroup:grp1': 'طرق العرض' });
tcase('T9 a page with no room for its button (a visual over the whole page)', (d) => {
  const full = rd(at(d, visualRel('p2details', 'note2'))); full.name = 'cover'; full.position = { x: 0, y: 0, z: 1, width: 1280, height: 720, tabOrder: 1 }; put(at(d, visualRel('p2details', 'cover')), full);
});
tcase('T10 the same with the Arabic tabs, its page hidden in the original', (d) => {
  const full = rd(at(d, visualRel('p2details', 'note2'))); full.name = 'cover'; full.position = { x: 0, y: 0, z: 1, width: 1280, height: 720, tabOrder: 1 }; put(at(d, visualRel('p2details', 'cover')), full);
  edit(d, `${RD}/pages/p2details/page.json`, (j) => { j.visibility = 'AlwaysVisible'; });
}, { tabsShown: 'ar' });
tcase('T11 a page drawn on a picture, a bookmark navigator, two pictures of one name', (d) => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#dddddd"/></svg>';
  put(at(d, 'Twin Sales.Report/StaticResources/RegisteredResources/bg.svg'), svg); put(at(d, 'Twin Sales.Report/StaticResources/RegisteredResources/bg-ar.svg'), svg);
  edit(d, `${RD}/pages/p1overview/page.json`, (j) => { j.objects = { background: obj({ image: { image: { name: Q('bg.svg'), url: { expr: { ResourcePackageItem: { PackageName: 'RegisteredResources', PackageType: 1, ItemName: 'bg.svg' } } }, scaling: Q('Fit') } } }), wallpaper: obj({ image: { image: { name: Q('missing.svg') } } }) }; });
  edit(d, `${RD}/report.json`, (j) => { j.resourcePackages = (j.resourcePackages || []).concat([]); });
  const bn = rd(at(d, visualRel('p2details', 'note2'))); bn.name = 'bmNav'; bn.visual = { visualType: 'bookmarkNavigator' }; bn.position = Object.assign({}, bn.position, { x: 900, y: 600, z: 9100, tabOrder: 9100 }); put(at(d, visualRel('p2details', 'bmNav')), bn);
});
tcase('T12 tab orders: none free between two stops, a group of its own, no tab orders', (d) => {
  ['btnReset', 'cardOrders', 'title', 'lineMonth', 'btnDetails', 'colRegion', 'nav', 'slRegion'].forEach((v, i) => edit(d, visualRel('p1overview', v), (j) => { if (j.position) j.position.tabOrder = i; }));
  ['btnBack', 'note2', 'barProduct', 'tblProducts', 'customGauge'].forEach((v) => edit(d, visualRel('p2details', v), (j) => { if (j.position) delete j.position.tabOrder; }));
});
T_CASES.forEach(([name, ed], i) => { const d = 'fn1g-t' + (i + 1); fs.cpSync(PROJ, path.join(ROOT, d), { recursive: true }); lf(path.join(ROOT, d)); if (ed) ed(d); });
for (const [name, , args, own] of T_CASES) {
  const d = 'fn1g-t' + (T_CASES.findIndex((c) => c[0] === name) + 1);
  let r; try { r = await twin(Object.assign({ path: d + '/Twin Sales.pbip', arabicMonth: false, into: 'same' }, args), own || null); } catch (e) { r = { plan: { err: true, t: 'threw: ' + String(e && e.message) }, write: null }; }
  keep(name, JSON.stringify({ plan: { err: r.plan.err, t: norm(r.plan.t) }, write: r.write ? { err: r.write.err, t: norm(r.write.t) } : null, files: filesOf(path.join(ROOT, d)) }));
}

// ---------- the pins ----------
if (process.env.FN1G_RECORD) {
  fs.writeFileSync(GOLD, JSON.stringify({ about: 'FN1G: the whole outputs of addGulfCalendar, gulfDateQuestions and languageCopy (through create_arabic_twin into "same"), recorded on integration/0.3.2 1ee00b30 before the split (test-0.3.2-fn1g.mjs; FN1G_RECORD=1, only on the base)', pins: got }, null, 1) + '\n');
  if (process.env.FN1G_DUMP) fs.writeFileSync(process.env.FN1G_DUMP, JSON.stringify(texts));
  console.log('recorded ' + Object.keys(got).length + ' pins');
}
if (process.env.FN1G_DUMP && !process.env.FN1G_RECORD) fs.writeFileSync(process.env.FN1G_DUMP, JSON.stringify(texts));
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).pins;
chk(() => Object.keys(got).length === Object.keys(gold).length && Object.keys(got).every((k, i) => k === Object.keys(gold)[i]), () => `the cases are the recorded ones (${Object.keys(got).length} vs ${Object.keys(gold).length})`);
for (const k of Object.keys(gold)) chk(() => got[k] && got[k].sha256 === gold[k].sha256 && got[k].length === gold[k].length, () => `${k}: the output differs from the base's (${got[k] ? got[k].length : 'none'} vs ${gold[k].length} characters)`);
// the inputs reach what they are for (the pins hold today's output; these say each case is the edge it names)
const J = (k) => JSON.parse(texts[k]);
chk(() => G_CASES.length > 90 && Object.keys(got).filter((k) => /^G/.test(k)).every((k) => texts[k].length > 20), () => 'G: every case answered');
chk(() => /Nothing was written/.test(J('G1').out.err) && J('G2').out.ok && /Unknown country/.test(J('G3').out.err), () => 'G: a refusal, an answer, an unknown country');
chk(() => Object.keys(got).filter((k) => /^G/.test(k)).filter((k) => J(k).out.ok).length >= 45 && Object.keys(got).filter((k) => /^G/.test(k)).filter((k) => J(k).out.err).length >= 35, () => 'G: answers and refusals both many');
chk(() => Q_CASES.length >= 55 && Object.keys(got).filter((k) => /^Q/.test(k)).filter((k) => J(k) && J(k).answer).length >= 40, () => 'Q: answers for most cases');
chk(() => T_CASES.every(([n]) => { const x = J(n); return x.write && !x.write.err; }), () => 'T: every copy written: ' + T_CASES.filter(([n]) => { const x = J(n); return !(x.write && !x.write.err); }).map(([n]) => n).join(', '));
fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log('FAIL script=test-0.3.2-fn1g.mjs cause=' + JSON.stringify(problems[0]).slice(0, 300)); problems.slice(0, 30).forEach((p) => console.log('  ' + p)); }
console.log(`${problems.length ? 'FAIL' : 'PASS'}  fn1g  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
