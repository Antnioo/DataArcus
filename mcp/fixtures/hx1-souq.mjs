// 0.3.3 HX1 (mcp/work/HX1.md): "Souq", a made-up retail model and its report, in memory, for the lineage's suite
// (test-0.3.3-hx1.mjs) and its demo (lab/lineage-demo.mjs). Made up from nothing: no employer or client data; no rows.
// Readable names and ids on purpose, so a failing check names the visual.
//   The model (TMSL, as a model.bim holds it): 8 tables (Sales, Returns, Calendar, Store, Product, Staff, Targets,
//   _Measures), 12 measures in _Measures, 6 relationships. Staff hangs off Store and no visual shows it; Targets is
//   joined to nothing; Sales[Line Margin] is a calculated column; Calendar[Month] is sorted by Calendar[Month Number].
//   The report (PBIR): Overview (3 cards, a column chart by month, a bar chart by region, a slicer on the year, a
//   text box) and Details (a page filter on the brand; a table by category, a line by month, a card, a table by city):
//   11 visuals, 10 with a query.
// souqModel() and souqReport() give a fresh copy each call, so a test changes its own.

const col = (name, dataType, more) => Object.assign({ name, dataType, sourceColumn: name }, more || {});
const m = (name, expression, formatString) => Object.assign({ name, expression }, formatString ? { formatString } : {});
const part = (name, query) => [{ name, mode: 'import', source: { type: 'm', expression: query } }];
const rel = (fromTable, fromColumn, toTable, toColumn) => ({ name: `${fromTable}-${toTable}`, fromTable, fromColumn, toTable, toColumn });

export function souqModel() {
  return {
    compatibilityLevel: 1567,
    model: {
      culture: 'en-US',
      tables: [
        { name: 'Sales', partitions: part('Sales', 'let Source = #table(type table [Date = date], {}) in Source'), columns: [
          col('Date', 'dateTime'), col('StoreKey', 'int64'), col('ProductKey', 'int64'), col('Amount', 'decimal'), col('Quantity', 'int64'), col('Cost', 'decimal'),
          { name: 'Line Margin', dataType: 'decimal', type: 'calculated', expression: 'Sales[Amount] - Sales[Cost]' }] },
        { name: 'Returns', partitions: part('Returns', 'let Source = #table(type table [Date = date], {}) in Source'), columns: [col('Date', 'dateTime'), col('StoreKey', 'int64'), col('Amount', 'decimal')] },
        { name: 'Calendar', dataCategory: 'Time', partitions: part('Calendar', 'let Source = #table(type table [Date = date], {}) in Source'), columns: [
          col('Date', 'dateTime', { isKey: true }), col('Year', 'int64'), col('Month', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Month Order', 'int64')] },
        { name: 'Store', partitions: part('Store', 'let Source = #table(type table [StoreKey = Int64.Type], {}) in Source'), columns: [col('StoreKey', 'int64'), col('City', 'string'), col('Region', 'string')] },
        { name: 'Product', partitions: part('Product', 'let Source = #table(type table [ProductKey = Int64.Type], {}) in Source'), columns: [col('ProductKey', 'int64'), col('Category', 'string'), col('Brand', 'string')] },
        { name: 'Staff', partitions: part('Staff', 'let Source = #table(type table [StaffKey = Int64.Type], {}) in Source'), columns: [col('StaffKey', 'int64'), col('StoreKey', 'int64'), col('Name', 'string')] },
        { name: 'Targets', partitions: part('Targets', 'let Source = #table(type table [Target = number], {}) in Source'), columns: [col('Month Number', 'int64'), col('Target', 'decimal')] },
        { name: '_Measures', partitions: part('_Measures', 'let Source = #table(type table [Value = number], {}) in Source'), columns: [col('Value', 'int64', { isHidden: true })], measures: [
          m('Revenue', 'SUM ( Sales[Amount] )', '#,0'),
          m('Returns Value', 'SUM ( Returns[Amount] )', '#,0'),
          m('Net Revenue', '[Revenue] - [Returns Value]', '#,0'),
          m('Cost', 'SUM ( Sales[Cost] )', '#,0'),
          m('Margin', '[Net Revenue] - [Cost]', '#,0'),
          m('Margin %', 'DIVIDE ( [Margin], [Net Revenue] )', '0.0%'),
          m('Revenue LY', "CALCULATE ( [Revenue], SAMEPERIODLASTYEAR ( 'Calendar'[Date] ) )", '#,0'),
          m('Growth %', 'DIVIDE ( [Revenue] - [Revenue LY], [Revenue LY] )', '0.0%'),
          m('Units', 'SUM ( Sales[Quantity] )', '#,0'),
          m('Avg Price', 'DIVIDE ( [Revenue], [Units] )', '#,0.00'),
          m('Target', 'SUM ( Targets[Target] )', '#,0'),
          m('Headcount', 'COUNTROWS ( Staff )', '#,0')] }
      ],
      relationships: [
        rel('Sales', 'Date', 'Calendar', 'Date'), rel('Sales', 'StoreKey', 'Store', 'StoreKey'), rel('Sales', 'ProductKey', 'Product', 'ProductKey'),
        rel('Returns', 'Date', 'Calendar', 'Date'), rel('Returns', 'StoreKey', 'Store', 'StoreKey'), rel('Staff', 'StoreKey', 'Store', 'StoreKey')
      ]
    }
  };
}

// ---- the report's PBIR pieces ----
const S = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/';
const src = (t) => ({ Expression: { SourceRef: { Entity: t } } });
export const colRef = (t, c) => ({ field: { Column: Object.assign(src(t), { Property: c }) }, queryRef: `${t}.${c}`, nativeQueryRef: c });
export const msrRef = (name) => ({ field: { Measure: Object.assign(src('_Measures'), { Property: name }) }, queryRef: `_Measures.${name}`, nativeQueryRef: name });
export const sumRef = (t, c) => ({ field: { Aggregation: { Expression: { Column: Object.assign(src(t), { Property: c }) }, Function: 0 } }, queryRef: `Sum(${t}.${c})`, nativeQueryRef: `Sum of ${c}` });
const visual = (page, name, visualType, roles, more) => ({ path: `definition/pages/${page}/visuals/${name}/visual.json`,
  json: Object.assign({ $schema: S + 'visualContainer/2.1.0/schema.json', name, position: { x: 0, y: 0, z: 0, width: 300, height: 200 },
    visual: Object.assign({ visualType }, roles ? { query: { queryState: Object.fromEntries(Object.entries(roles).map(([r, l]) => [r, { projections: l }])) } } : {}) }, more || {}) });
const page = (name, displayName, more) => ({ path: `definition/pages/${name}/page.json`, json: Object.assign({ $schema: S + 'page/2.0.0/schema.json', name, displayName, width: 1280, height: 720 }, more || {}) });

export function souqReport() {
  return { format: 'pbir', files: [
    { path: 'definition/report.json', json: { $schema: S + 'report/2.1.0/schema.json' } },
    page('overview', 'Overview'),
    visual('overview', 'card-revenue', 'card', { Values: [msrRef('Revenue')] }),
    visual('overview', 'card-margin-pct', 'card', { Values: [msrRef('Margin %')] }),
    visual('overview', 'card-units', 'card', { Values: [msrRef('Units')] }),
    visual('overview', 'column-revenue-by-month', 'clusteredColumnChart', { Category: [colRef('Calendar', 'Month')], Y: [msrRef('Revenue')] }),
    visual('overview', 'bar-net-revenue-by-region', 'clusteredBarChart', { Category: [colRef('Store', 'Region')], Y: [msrRef('Net Revenue')] }),
    visual('overview', 'slicer-year', 'slicer', { Values: [colRef('Calendar', 'Year')] }),
    visual('overview', 'text-title', 'textbox', null),
    page('details', 'Details', { filterConfig: { filters: [{ name: 'f-brand', field: colRef('Product', 'Brand').field, type: 'Categorical' }] } }),
    visual('details', 'table-category', 'tableEx', { Values: [colRef('Product', 'Category'), msrRef('Units'), msrRef('Avg Price')] }),
    visual('details', 'line-growth-by-month', 'lineChart', { Category: [colRef('Calendar', 'Month')], Y: [msrRef('Growth %')] }),
    visual('details', 'card-target', 'card', { Values: [msrRef('Target')] }),
    visual('details', 'table-city-margin', 'tableEx', { Values: [colRef('Store', 'City'), sumRef('Sales', 'Line Margin')] })
  ] };
}

// a measure, a table, a column or a visual of a copy, to change in a test
export const measureOf = (model, name) => model.model.tables.flatMap((t) => t.measures || []).find((x) => x.name === name);
export const tableOf = (model, name) => model.model.tables.find((t) => t.name === name);
export const columnOf = (model, t, c) => tableOf(model, t).columns.find((x) => x.name === c);
export const visualOf = (report, name) => report.files.find((f) => f.path.endsWith(`/visuals/${name}/visual.json`)).json;
