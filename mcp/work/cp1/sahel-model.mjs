// CP1: the made-up model "Sahel Electronics" (a made-up Gulf electronics retailer; no real data, no real company),
// before and after the 10-minute fixes. Run: node mcp/work/cp1/sahel-model.mjs [before|after] -> prints the Health Check's findings.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const E = require('../../../assets/js/model-health-engine.js');

const m = (n) => [{ name: n, source: { type: 'm', expression: `let Source = Csv.Document(File.Contents(SourceFolder & "${n}.csv")) in Source` } }];
const col = (name, dataType, extra = {}) => ({ name, dataType, sourceColumn: name, ...extra });

export function build(after) {
  const A = !!after;
  const hideKey = A ? { isHidden: true } : {};
  const noSum = A ? { summarizeBy: 'none' } : {};
  const sales = { name: 'Sales', columns: [
    col('OrderLineID', 'int64', A ? { isHidden: true, summarizeBy: 'none' } : {}),
    col('OrderDate', 'dateTime', hideKey),
    col('ProductKey', 'int64', { ...hideKey, ...noSum }),
    col('BranchKey', 'int64', { ...hideKey, ...noSum }),
    col('Quantity', 'int64'),
    col('Net Amount', 'decimal', A ? { description: 'Line amount after discount, excluding VAT, in AED.' } : {}),
    col('Cost', 'decimal'),
    ...(A ? [] : [col('Old Notes', 'string')])
  ], partitions: m('Sales'), measures: [
    { name: 'Total Sales', expression: 'SUM ( Sales[Net Amount] )', formatString: '#,0', ...(A ? { description: 'Net sales after discounts, excluding VAT, in AED. The default for "sales".', displayFolder: 'Sales' } : {}) },
    { name: 'Total Cost', expression: 'SUM ( Sales[Cost] )', formatString: '#,0', ...(A ? { description: 'Cost of the goods sold, in AED.', displayFolder: 'Sales' } : {}) },
    A ? { name: 'Margin %', expression: 'DIVIDE ( [Total Sales] - [Total Cost], [Total Sales] )', formatString: '0.0%', description: 'Gross margin: (sales - cost) / sales. Use this, never an average of line margins.', displayFolder: 'Sales' }
      : { name: 'Margin %', expression: '( [Total Sales] - [Total Cost] ) / [Total Sales]' },
    { name: 'Ramadan Sales', expression: 'CALCULATE ( [Total Sales], \'Calendar\'[Is Ramadan] = TRUE () )', formatString: '#,0', ...(A ? { description: 'Total Sales on the days of Ramadan (the Hijri month 9) only.', displayFolder: 'Sales' } : {}) }
  ] };
  const product = { name: 'Product', columns: [
    col('ProductKey', 'int64', { ...hideKey, ...noSum }),
    col(A ? 'Product Name' : 'Name', 'string'),
    col('Category', 'string'),
    col('ProductCode', 'int64', noSum)
  ], partitions: m('Product') };
  const branch = { name: 'Branch', columns: [
    col('BranchKey', 'int64', { ...hideKey, ...noSum }),
    col(A ? 'Branch Name' : 'Name', 'string'),
    col('City', 'string'),
    col('اسم الفرع', 'string', A ? { description: 'Branch name in Arabic (the same branch as Branch Name).' } : {})
  ], partitions: m('Branch') };
  const calendar = { name: 'Calendar', ...(A ? { dataCategory: 'Time' } : {}), columns: [
    col('Date', 'dateTime', A ? { isKey: true } : {}),
    col('Year', 'int64', noSum),
    col('Month Number', 'int64', { ...noSum, ...(A ? { isHidden: true } : {}) }),
    col('Month Name', 'string', A ? { sortByColumn: 'Month Number' } : {}),
    col('Hijri Year', 'int64', noSum),
    col('Hijri Month Number', 'int64', { ...noSum, ...(A ? { isHidden: true } : {}) }),
    col('Hijri Month Name', 'string', A ? { sortByColumn: 'Hijri Month Number' } : {}),
    col('Is Ramadan', 'boolean')
  ], partitions: m('Calendar') };
  const rel = (f, fc, t, tc, x = {}) => ({ name: `${f}_${fc}`, fromTable: f, fromColumn: fc, toTable: t, toColumn: tc, ...x });
  return { name: 'Sahel Electronics', compatibilityLevel: 1601, model: { culture: 'en-US', tables: [sales, product, branch, calendar], relationships: [
    rel('Sales', 'OrderDate', 'Calendar', 'Date'),
    rel('Sales', 'ProductKey', 'Product', 'ProductKey'),
    rel('Sales', 'BranchKey', 'Branch', 'BranchKey', A ? {} : { crossFilteringBehavior: 'bothDirections' })
  ] } };
}

// one report page: a card, a column chart by month, a table by branch, a slicer by Hijri month
export function report(after) {
  const f = (k, e, p) => ({ field: { [k]: { Expression: { SourceRef: { Entity: e } }, Property: p } } });
  const v = (id, type, refs) => ({ path: `definition/pages/p1/visuals/${id}/visual.json`, json: { visual: { visualType: type, query: { queryState: { Values: { projections: refs } } } } } });
  return { format: 'pbir', files: [
    { path: 'definition/pages/p1/page.json', json: { displayName: 'Sales overview' } },
    v('v1', 'card', [f('Measure', 'Sales', 'Total Sales')]),
    v('v2', 'clusteredColumnChart', [f('Column', 'Calendar', 'Month Name'), f('Measure', 'Sales', 'Total Sales')]),
    v('v3', 'tableEx', [f('Column', 'Branch', after ? 'Branch Name' : 'Name'), f('Column', 'Branch', 'اسم الفرع'), f('Column', 'Branch', 'City'), f('Measure', 'Sales', 'Total Sales'), f('Measure', 'Sales', 'Margin %')]),
    v('v4', 'clusteredBarChart', [f('Column', 'Product', after ? 'Product Name' : 'Name'), f('Column', 'Product', 'Category'), f('Measure', 'Sales', 'Ramadan Sales')]),
    v('v5', 'slicer', [f('Column', 'Calendar', 'Hijri Month Name')]),
    v('v6', 'slicer', [f('Column', 'Calendar', 'Year')]),
    v('v7', 'tableEx', [f('Column', 'Product', 'ProductCode'), f('Column', 'Calendar', 'Hijri Year'), f('Column', 'Sales', 'Quantity'), f('Measure', 'Sales', 'Total Cost')])
  ] };
}

if (process.argv[1] && process.argv[1].endsWith('sahel-model.mjs')) {
  const which = process.argv[2] || 'before';
  const r = E.analyze(build(which === 'after'), report(which === 'after'));
  console.log(which, 'score', JSON.stringify(r.score), 'stats', JSON.stringify({ t: r.stats.tables, c: r.stats.columns, m: r.stats.measures, rel: r.stats.relationships }));
  for (const f of r.findings) console.log(' ', f.id, f.sev || '', f.items.length, f.items.map((i) => i.obj + (i.detail ? ' (' + i.detail + ')' : '')).join('; '));
  console.log('  confirm:', JSON.stringify(r.confirm.map((c) => c.id + ' ' + c.obj)));
  if (process.argv[3] === 'json') fs.writeFileSync(`sahel-${which}.json`, JSON.stringify({ model: build(which === 'after'), report: report(which === 'after') }));
}
