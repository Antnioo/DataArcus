import './test-env.mjs';
// 0.3.2 FN1A (runRules, create and mount into named steps; mcp/work/FN1A.md): four parts of the Model Health Check's
// rules that no other suite turned red when broken on the base (e56b070), pinned on one made-up model, written as
// today's findings. The rest of runRules is pinned by test-0.3.2-sp27.mjs (its whole output on 15 inputs).
//   A1 auto date/time: a LocalDateTable_ table names the table whose column points to it (autoDateRules)
//   A2 calculated columns: a column whose DAX reads a measure belongs in DAX, one that only looks up with RELATED does
//      not (daxOnlyColumnOf)
//   A3 a percent name over a count (COUNTROWS at its root) takes a whole-number format; a ratio is listed (measureShape)
//   A4 a measure returning text (UNICHAR) takes no number format; a number without one is listed (textCheck)
//   node test-0.3.2-fn1a.mjs
import { createRequire } from 'node:module';
import { col, ms, mp } from './fixtures/health-models.mjs';

const require = createRequire(import.meta.url);
const Health = require('../assets/js/model-health-engine.js');
const problems = []; let checks = 0;
const chk = (ok, msg) => { checks++; if (!ok) problems.push(msg); };

// made-up: a sales table with an auto date table, two calculated columns and five measures
const LOCAL = 'LocalDateTable_fn1a';
const model = () => ({ compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [
    col('OrderDate', 'dateTime', { extendedProperties: [{ type: 'json', name: 'Link', value: { table: LOCAL } }] }),
    col('Amount', 'decimal'), col('Qty', 'int64'),
    { name: 'ViaMeasure', dataType: 'decimal', type: 'calculated', expression: '[Total] * 2' },
    { name: 'ViaRelated', dataType: 'string', type: 'calculated', expression: 'RELATED ( Product[Name] )' }],
  measures: [ms('Total', 'SUM ( Sales[Amount] )'), ms('Orders %', 'COUNTROWS ( Sales )', { formatString: '0' }),
    ms('Margin %', 'DIVIDE ( [Total], 3 )', { formatString: '0.00' }),
    { name: 'Label', expression: 'UNICHAR ( 9650 )' }, { name: 'Plain', expression: 'SUM ( Sales[Qty] )' }] },
  { name: 'Product', partitions: mp('Product'), columns: [col('Name', 'string')] },
  { name: LOCAL, isHidden: true, partitions: [{ name: 'p', mode: 'import', source: { type: 'calculated', expression: 'CALENDAR ( DATE ( 2020, 1, 1 ), DATE ( 2020, 12, 31 ) )' } }], columns: [col('Date', 'dateTime')] }],
relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'OrderDate', toTable: LOCAL, toColumn: 'Date', joinOnDateBehavior: 'datePartOnly' }] } });

const r = Health.analyze(model(), null);
const items = (id) => JSON.stringify(((r.findings || []).find((f) => f.id === id) || { items: [] }).items.map((i) => ({ obj: i.obj, detail: i.detail })));
const want = (label, id, list) => chk(items(id) === JSON.stringify(list), `${label} ${id}: want ${JSON.stringify(list)}, got ${items(id)}`);
want('A1', 'AUTODATE', [{ obj: LOCAL, detail: 'Sales' }]);
want('A2', 'CALC_COLS', [{ obj: 'Sales[ViaRelated]', detail: 'uses model data' }]);
want('A3', 'PCT_FORMAT', [{ obj: '[Margin %]', detail: '0.00' }]);
want('A4', 'NO_FORMAT', [{ obj: '[Plain]' }]);

if (problems.length) { console.log(`FAIL script=test-0.3.2-fn1a.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  fn1a  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  fn1a  ${checks} checks`);
