// The made-up models of the Model Health Check's characterisation suites (0.3.2 SP9, SP15: one place for both).
// Made-up data only. copyFixtures(ROOT) copies the project fixtures into a temporary ROOT (LF, as the repository holds
// them); CASES(viaLoader) lists the 11 cases, viaLoader(path) reading a project the way the MCP does.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), MCP = path.join(HERE, '..'), REPO = path.join(MCP, '..');

export function copyFixtures(ROOT) {
  // (CI's Windows checkout writes the fixtures' text files with CRLF, SP1) the copies get LF, as the repository holds them
  const lf = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) return lf(f);
    const b = fs.readFileSync(f); if (!b.includes(0) && b.includes(13)) fs.writeFileSync(f, b.toString('utf8').replace(/\r\n/g, '\n')); });
  const copy = (from, to) => { fs.cpSync(from, path.join(ROOT, to), { recursive: true }); if (fs.statSync(from).isDirectory()) lf(path.join(ROOT, to)); };
  copy(path.join(MCP, 'fixtures', 'health-project'), 'health');
  copy(path.join(MCP, 'fixtures', 'twin-project'), 'twin');
  copy(path.join(REPO, 'scripts/tests/fixtures/model-health/tmdl-health/definition'), 'tmdl/H.SemanticModel/definition');
  copy(path.join(REPO, 'scripts/tests/fixtures/model-health/tmdl-health/Health Test.pbit'), 'tmdl-health.pbit');
  copy(path.join(REPO, 'scripts/tests/fixtures/model-health/tmdl-ramadan/definition'), 'ramadan/R.SemanticModel/definition');
  copy(path.join(REPO, 'scripts/tests/fixtures/model-health/legacy.pbit'), 'legacy.pbit');
  // the incomplete model: the TMDL project with one table file cut to nothing (AU47: named, never skipped silently)
  copy(path.join(REPO, 'scripts/tests/fixtures/model-health/tmdl-health/definition'), 'broken/B.SemanticModel/definition');
  fs.writeFileSync(path.join(ROOT, 'broken/B.SemanticModel/definition/tables/Notes.tmdl'), '');
  // (SP15) the incomplete model of another shape: the TMDL project with a table file that is not TMDL
  copy(path.join(REPO, 'scripts/tests/fixtures/model-health/tmdl-health/definition'), 'garbled/G.SemanticModel/definition');
  fs.writeFileSync(path.join(ROOT, 'garbled/G.SemanticModel/definition/tables/Sales Agg.tmdl'), '{ "this": "is not TMDL" }\n\tcolumn [broken\n');
}

// ---------- the made-up models ----------
export const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
export const col = (name, dataType, extra) => Object.assign({ name, dataType, sourceColumn: name }, extra || {});
export const ms = (name, expression, extra) => Object.assign({ name, expression, formatString: '#,0' }, extra || {});
// DAX written the hard way: comments of the three kinds holding references, strings holding brackets and quotes,
// quoted table names with spaces and apostrophes, VARs (one a constant divisor), virtual columns, unterminated text
export const TRICKY = [
  ms('Total', 'SUM ( Sales[Amount] ) // Sales[Spare] is only in this comment'),
  ms('Commented', "-- [Total] in a line comment\n/* 'Sales'[Region] and [Spare] in a block */\nCALCULATE ( [Total], Sales[Region] = \"[Not a ref] and 'not a table'\" )"),
  ms('Quoted Text', '"He said ""[Total]"" twice" & " ]] [["'),
  ms('Per Box', 'SUM ( Sales[Qty/Box] ) / 1000'),
  ms('With Vars', 'VAR _Base = [Total]\nVAR _Ticks = 60\nVAR _Rows = COUNTROWS ( \'Bob\'\'s Sales\' )\nRETURN DIVIDE ( _Base, _Rows ) / _Ticks'),
  ms('Net', "SUM ( 'Bob''s Sales'[Net Amount] ) + SUM ( 'Sales Region Map'[Weight] )"),
  ms('Virtual', 'SUMX ( ADDCOLUMNS ( Sales, "Spare", Sales[Amount] * 2 ), [Spare] )'),
  ms('Iterator', 'SUMX ( Sales, [Amount] * [Qty/Box] )'),
  ms('Unused Measure', 'IF ( ISBLANK ( [Total] ), 0, [Total] ) /* never closed'),
  ms('Half String', 'CONCATENATE ( "a", "never closed )'),
  ms('Bracket Name', 'SUM ( Sales[Odd]]Name] )'),
  ms('Text Measure', 'FORMAT ( [Total], "#,0" )'),
  ms('Same Twice', 'SUM ( Sales[Amount] ) + SUM ( Sales[Amount] )')
];
export const trickyModel = () => ({ compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Qty/Box', 'int64'), col('Region', 'string'), col('Spare', 'string'), col('Odd]Name', 'double'), col('Region Key', 'int64'), col('Date', 'dateTime')], measures: TRICKY },
  { name: "Bob's Sales", partitions: mp("Bob's Sales"), columns: [col('Net Amount', 'double'), col('Region Key', 'int64'), col('Note', 'string')] },
  { name: 'Sales Region Map', partitions: mp('Sales Region Map'), columns: [col('Region Key', 'int64', { isKey: true }), col('Weight', 'double'), col('Label', 'string')] },
  { name: 'Calendar', dataCategory: 'Time', partitions: [{ name: 'Calendar', source: { type: 'calculated', expression: 'CALENDARAUTO () // the model\'s dates' } }],
    columns: [col('Date', 'dateTime', { isKey: true }), Object.assign(col('Month', 'string', { sortByColumn: 'Month No' }), { type: 'calculated', expression: 'FORMAT ( [Date], "MMM" )' }), Object.assign(col('Month No', 'int64'), { type: 'calculated', expression: 'MONTH ( \'Calendar\'[Date] )' })] }],
relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }, { name: 'r2', fromTable: "Bob's Sales", fromColumn: 'Region Key', toTable: 'Sales Region Map', toColumn: 'Region Key', crossFilteringBehavior: 'bothDirections' }] } });
// a PBIR report on the tricky model: a page filter, a visual with a hierarchy level and a variation source, a bookmark and a report measure
export const ent = (e, p, kind = 'Column') => ({ [kind]: { Expression: { SourceRef: { Entity: e } }, Property: p } });
export const pbir = () => ({ format: 'pbir', files: [
  { path: 'definition/pages/p1/page.json', json: { name: 'p1', displayName: 'Overview «1»', filterConfig: { filters: [{ field: ent('Sales', 'Region') }] } } },
  { path: 'definition/pages/p1/visuals/v1/visual.json', json: { visual: { visualType: 'clusteredColumnChart', query: { queryState: { Category: { projections: [{ field: ent('Calendar', 'Month') }, { field: { HierarchyLevel: { Expression: { Hierarchy: { Expression: { SourceRef: { Entity: 'Calendar' } }, Hierarchy: 'Dates' } }, Level: 'Year' } } }] },
    Y: { projections: [{ field: ent('Sales', 'Net', 'Measure') }, { field: ent('Sales', 'With Vars', 'Measure') }] } } },
    vcObjects: { title: [{ properties: { text: { expr: { Literal: { Value: "'Bob''s [chart]'" } } } } }] } } } },
  { path: 'definition/pages/p1/visuals/v2/visual.json', json: { visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: [{ field: { Column: { Expression: { SourceRef: { Source: 's' } }, Property: 'Label' } } }, { field: { PropertyVariationSource: { Expression: { SourceRef: { Entity: 'Calendar' } }, Name: 'Variation', Property: 'Date' } } }] } } } }, From: [{ Name: 's', Entity: 'Sales Region Map' }] } },
  { path: 'definition/bookmarks/b1.bookmark.json', json: { displayName: 'Only [North]', explorationState: { filters: [ent('Sales', 'Iterator', 'Measure')] } } },
  { path: 'definition/reportExtensions.json', json: { entities: [{ name: 'Sales', measures: [{ name: 'Report Only', expression: 'CALCULATE ( [Text Measure], \'Bob\'\'s Sales\'[Note] = "x" )' }] }] } }] });
// the Arabic model: an Arabic table and column names, unqualified columns in an iterator, a role filter, a calculation group, an aggregation
export const arabicModel = () => ({ compatibilityLevel: 1567, model: { culture: 'ar-SA', tables: [
  { name: 'المبيعات', partitions: mp('المبيعات'), columns: [col('المبلغ', 'double'), col('الكمية', 'int64'), col('المنطقة', 'string'), col('رمز العميل', 'int64'), col('التاريخ', 'dateTime')],
    measures: [ms('إجمالي المبيعات', "SUM ( 'المبيعات'[المبلغ] ) -- المبلغ"), ms('متوسط', 'AVERAGEX ( المبيعات, [المبلغ] * [الكمية] )'), ms('نص', '"[المنطقة]"'),
      ms('مؤشر', '[إجمالي المبيعات]', { kpi: { targetExpression: '1000', statusExpression: "IF ( [إجمالي المبيعات] > 1000, 1, -1 )" }, detailRowsDefinition: { expression: "SELECTCOLUMNS ( 'المبيعات', \"المنطقة\", 'المبيعات'[المنطقة] )" } })] },
  { name: 'العملاء', partitions: mp('العملاء'), columns: [col('رمز العميل', 'int64', { isKey: true }), col('الاسم', 'string'), col('المدينة', 'string')] },
  { name: 'Sales Agg', partitions: mp('Sales Agg'), isHidden: true, columns: [col('Amount Sum', 'double', { alternateOf: { summarization: 'sum', baseColumn: "'المبيعات'[المبلغ]" } }), col('Region', 'string', { alternateOf: { summarization: 'groupBy', baseColumn: { table: 'المبيعات', column: 'المنطقة' } } })] },
  { name: 'Time Calc', partitions: [{ name: 'Time Calc', source: { type: 'calculationGroup' } }], calculationGroup: { precedence: 1, calculationItems: [{ name: 'YTD', expression: 'CALCULATE ( SELECTEDMEASURE (), DATESYTD ( \'المبيعات\'[التاريخ] ) )' }, { name: 'Current', expression: 'SELECTEDMEASURE ()', formatStringDefinition: { expression: '"#,0"' } }] },
    columns: [col('Name', 'string'), col('Ordinal', 'int64')] }],
relationships: [{ name: 'r1', fromTable: 'المبيعات', fromColumn: 'رمز العميل', toTable: 'العملاء', toColumn: 'رمز العميل' }],
roles: [{ name: 'المنطقة الشمالية', tablePermissions: [{ name: 'المبيعات', filterExpression: '[المنطقة] = "الشمال"' }] }] } });
// a legacy Layout (string configs, as Power BI writes it) with bookmarks in a group and report measures
export const legacy = () => ({ format: 'legacy', files: [{ path: 'Report/Layout', json: {
  config: JSON.stringify({ bookmarks: [{ displayName: 'Group', children: [{ displayName: 'الشمال', explorationState: { filters: [ent('العملاء', 'المدينة')] } }] }],
    modelExtensions: [{ entities: [{ name: 'المبيعات', measures: [{ name: 'تقرير فقط', expression: "[متوسط] + SUM ( 'المبيعات'[الكمية] )" }] }] }] }),
  sections: [{ name: 's1', displayName: 'الصفحة ١', filters: JSON.stringify([{ expression: ent('المبيعات', 'المنطقة') }]), visualContainers: [
    { config: JSON.stringify({ singleVisual: { visualType: 'card', projections: {}, prototypeQuery: { From: [{ Name: 'm', Entity: 'المبيعات' }], Select: [{ Measure: { Expression: { SourceRef: { Source: 'm' } }, Property: 'إجمالي المبيعات' } }] } } }), filters: '[]' },
    { config: JSON.stringify({ singleVisualGroup: { displayName: 'مجموعة' } }), query: JSON.stringify({ Commands: [{ SemanticQueryDataShapeCommand: { Query: { From: [{ Name: 'c', Entity: 'العملاء' }], Select: [{ Column: { Expression: { SourceRef: { Source: 'c' } }, Property: 'الاسم' } }] } } }] }) },
    { config: '{not json' }] }] } }] });
// a model of DAX-only tables and functions (a user-defined function a measure calls), model only
export const daxTables = () => ({ compatibilityLevel: 1702, model: { tables: [
  { name: 'Numbers', partitions: [{ name: 'Numbers', source: { type: 'calculated', expression: 'GENERATESERIES ( 1, 10, 1 ) /* [Value] */' } }], columns: [col('Value', 'int64')],
    measures: [ms('Double It', 'Twice ( SUM ( Numbers[Value] ) )'), ms('Unqualified', 'MAXX ( Numbers, [Value] )'), ms('Strings Only', '"Numbers[Value]" & "\'Numbers\'"')] },
  { name: 'Spare Table', partitions: mp('Spare Table'), columns: [col('Value', 'int64'), col('Other', 'string')] }],
functions: [{ name: 'Twice', expression: '( x ) => x * 2 // [Value]' }] } });

export const CASES = (viaLoader) => [
  ['A1 the health project (model.bim and a PBIR report)', () => viaLoader('health')],
  ['A2 the twin project', () => viaLoader('twin')],
  ['A3 a TMDL project (folder)', () => viaLoader('tmdl/H.SemanticModel')],
  ['A4 the same project as a .pbit', () => viaLoader('tmdl-health.pbit')],
  ['A5 the Ramadan TMDL project', () => viaLoader('ramadan/R.SemanticModel')],
  ['A6 legacy.pbit (a legacy Layout)', () => viaLoader('legacy.pbit')],
  ['A7 the tricky DAX, model only', () => ({ model: trickyModel(), report: null })],
  ['A8 the tricky DAX with a PBIR report', () => ({ model: trickyModel(), report: pbir() })],
  ['A9 the Arabic model with a legacy report', () => ({ model: arabicModel(), report: legacy() })],
  ['A10 DAX tables and a function, model only', () => ({ model: daxTables(), report: null })],
  ['A11 the incomplete TMDL model (a table file empty)', () => viaLoader('broken/B.SemanticModel')]
];

// ---------- (SP15) three more models, read by sp15 and sp27 ----------
// B1 calculation groups: two groups with precedence, items using measures, SELECTEDMEASURE, a format string expression
// using a measure of another table, a group column used by a report, a group nobody uses
export const calcGroups = () => ({ compatibilityLevel: 1601, model: { culture: 'en-US', tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Date', 'dateTime'), col('Unused', 'string')],
    measures: [ms('Total', 'SUM ( Sales[Amount] )'), ms('Target', '1000'), ms('Ratio', 'DIVIDE ( [Total], [Target] )', { formatString: '0%' }), ms('Old Total', '[Total] * 2')] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime', { isKey: true }), col('Year', 'int64')] },
  { name: 'Time Intelligence', partitions: [{ name: 'Time Intelligence', source: { type: 'calculationGroup' } }], calculationGroup: { precedence: 20, calculationItems: [
    { name: 'Current', expression: 'SELECTEDMEASURE ()' },
    { name: 'YTD', expression: "CALCULATE ( SELECTEDMEASURE (), DATESYTD ( 'Calendar'[Date] ) )", formatStringDefinition: { expression: 'IF ( ISSELECTEDMEASURE ( [Ratio] ), "0.0%", SELECTEDMEASUREFORMATSTRING () )' } },
    { name: 'vs Target', expression: 'SELECTEDMEASURE () - [Target]' }] },
    columns: [col('Period', 'string', { sourceColumn: 'Name' }), col('Ordinal', 'int64')] },
  { name: 'Currency', partitions: [{ name: 'Currency', source: { type: 'calculationGroup' } }], calculationGroup: { calculationItems: [
    { name: 'USD', expression: 'SELECTEDMEASURE () * 1', formatStringDefinition: { expression: '"$#,0"' } },
    { name: 'Local', expression: "SELECTEDMEASURE () * MAX ( 'Rates'[Rate] )" }] },
    columns: [col('Currency', 'string', { sourceColumn: 'Name' })] },
  { name: 'Rates', partitions: mp('Rates'), columns: [col('Rate', 'double'), col('Code', 'string')] }],
relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } });
export const calcGroupsReport = () => ({ format: 'pbir', files: [
  { path: 'definition/pages/p1/page.json', json: { name: 'p1', displayName: 'Page 1' } },
  { path: 'definition/pages/p1/visuals/v1/visual.json', json: { visual: { visualType: 'matrix', query: { queryState: {
    Rows: { projections: [{ field: ent('Time Intelligence', 'Period') }] }, Values: { projections: [{ field: ent('Sales', 'Ratio', 'Measure') }] } } } } } }] });
// B2 a measure using measures of another table: a measures-only table, qualified and unqualified, a column in the
// measure table named like another table's measure, a calculated column using a measure, a chain three deep, a virtual
// column named like a measure (it is the virtual column, not the measure)
export const crossTable = () => ({ compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Cost', 'double'), col('Region', 'string'), col('Spare', 'string')],
    measures: [ms('Total', 'SUM ( Sales[Amount] )'), ms('Cost Sum', 'SUM ( Sales[Cost] )')] },
  { name: 'Metrics', partitions: mp('Metrics'), columns: [col('Total', 'double'), Object.assign(col('Flag', 'string'), { type: 'calculated', expression: 'IF ( [Total] > 0, "yes", "no" )' })],
    measures: [ms('Margin', '[Total] - [Cost Sum]'), ms('Qualified', "Sales[Total] + 'Sales'[Cost Sum]"), ms('Margin %', 'DIVIDE ( [Margin], [Total] )', { formatString: '0%' }),
      ms('Chain', '[Margin %] * 2'), ms('Lonely', "COUNTROWS ( 'Metrics' )"),
      ms('Virtual Total', 'SUMX ( ADDCOLUMNS ( Sales, "Total", Sales[Amount] ), [Total] )')] },
  { name: '_Measures', partitions: mp('_Measures'), columns: [col('Value', 'int64', { isHidden: true })], measures: [ms('Headline', 'Metrics[Chain] + [Qualified]')] }] } });
export const crossTableReport = () => ({ format: 'pbir', files: [
  { path: 'definition/pages/p1/page.json', json: { name: 'p1', displayName: 'Page 1' } },
  { path: 'definition/pages/p1/visuals/v1/visual.json', json: { visual: { visualType: 'card', query: { queryState: { Values: { projections: [{ field: ent('_Measures', 'Headline', 'Measure') }, { field: ent('Sales', 'Region') }] } } } } } }] });


// ---------- (SP27) the edge cases: the rules no other case raises, every question, the guards' shapes ----------
const many = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));
const rel = (fromTable, fromColumn, toTable, toColumn, extra) => Object.assign({ name: fromTable + '_' + toTable + '_' + fromColumn, fromTable, fromColumn, toTable, toColumn }, extra || {});
// R: every rule the 14 other cases never raise (both naming styles, a both-way bridge, a many-to-many, an inactive
// relationship unused and an active one turned on again, a text key, an automatic date table, FILTER over a table, a
// variable and a measure, IFERROR, a division, a rate without a percent format, 20 measures without folders, twin DAX,
// a long measure, a chain nine deep and a cycle, a trailing space, Table.Buffer, a long query) with a report that
// names a table the model lacks
export const rulesModel = () => ({ compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
  { name: 'fact Sales', partitions: [{ name: 'p', mode: 'import', source: { type: 'm', expression: 'let\n' + many(42, (i) => `  S${i} = Table.Buffer(#table({"A"}, {}))`).join(',\n') + '\nin\n  S42' } }],
    columns: [col('Amount', 'double'), col('Customer Code', 'string'), col('Order Date', 'dateTime'), col('Ship Date', 'dateTime'), col('Name ', 'string'), col('Product Key', 'int64'), col('Qty', 'int64')],
    measures: [ms('Total', 'SUM ( \'fact Sales\'[Amount] )', { displayFolder: 'Main', description: 'd' }),
      ms('Count', 'COUNTROWS ( \'fact Sales\' )', { displayFolder: 'Main', description: 'd' }),
      ms('Filtered', "CALCULATE ( [Total], FILTER ( 'fact Sales', 'fact Sales'[Amount] > 0 ) )"),
      ms('Filtered Var', "CALCULATE ( [Total], FILTER ( ALL ( 'fact Sales' ), 'fact Sales'[Amount] > MAX ( 'fact Sales'[Amount] ) ) )"),
      ms('Filtered Measure', "CALCULATE ( [Total], FILTER ( 'fact Sales', [Count] > 1 ) )"),
      ms('Safe', 'IFERROR ( [Total] / 2, 0 )'), ms('Per Order', '[Total] / [Count]'),
      ms('Margin %', 'DIVIDE ( 1, 2 )', { formatString: '#,0.00' }), ms('Rate Count', 'COUNTROWS ( \'fact Sales\' )', { formatString: '#,0.00' }),
      ms('Twin A', "CALCULATE ( SUM ( 'fact Sales'[Amount] ), 'fact Sales'[Qty] > 1 )"), ms('Twin B', "CALCULATE ( SUM ( 'fact Sales'[Amount] ), 'fact Sales'[Qty] > 1 )"),
      ms('Long', 'VAR a = 1\n' + many(61, (i) => `  + ${i}`).join('\n') + '\nRETURN a'),
      ms('Ship Total', "CALCULATE ( [Total], USERELATIONSHIP ( 'fact Sales'[Ship Date], 'dim_Date'[Date] ) )"),
      ms('Again', "CALCULATE ( [Total], USERELATIONSHIP ( 'fact Sales'[Order Date], 'dim_Date'[Date] ) )"),
      ms('L1', '[Total] + 1'), ...many(8, (i) => ms('L' + (i + 1), `[L${i}] + 1`)),
      ms('Loop A', '[Loop B] + 1'), ms('Loop B', '[Loop A] + 1')] },
  { name: 'Plain', partitions: mp('Plain'), columns: [col('Value', 'double')], measures: many(20, (i) => ms('Plain ' + i, `SUM ( Plain[Value] ) * ${i}`)) },
  { name: 'dim_Customer', partitions: mp('dim_Customer'), columns: [col('Customer Code', 'string', { isKey: true }), col('City', 'string')] },
  { name: 'dim_Date', partitions: mp('dim_Date'), dataCategory: 'Time', columns: [col('Date', 'dateTime', { isKey: true }), col('Year', 'int64')] },
  { name: 'dim Product', partitions: mp('dim Product'), columns: [col('Product Key', 'int64', { isKey: true }), col('Colour', 'string')] },
  { name: 'Bridge', partitions: mp('Bridge'), columns: [col('Product Key', 'int64'), col('Group Key', 'int64')] },
  { name: 'Groups', partitions: mp('Groups'), columns: [col('Group Key', 'int64', { isKey: true }), col('Label', 'string')] },
  { name: 'Tags', partitions: mp('Tags'), columns: [col('Tag', 'string'), col('Amount', 'double')] },
  { name: 'LocalDateTable_0a1b', isHidden: true, partitions: [{ name: 'l', source: { type: 'calculated', expression: 'CALENDAR ( DATE ( 2020, 1, 1 ), DATE ( 2020, 12, 31 ) )' } }],
    columns: [col('Date', 'dateTime'), col('Year', 'int64')] }],
relationships: [rel('fact Sales', 'Customer Code', 'dim_Customer', 'Customer Code'), rel('fact Sales', 'Order Date', 'dim_Date', 'Date'),
  rel('fact Sales', 'Ship Date', 'dim_Date', 'Date', { isActive: false }), rel('fact Sales', 'Product Key', 'dim Product', 'Product Key', { isActive: false }),
  rel('Bridge', 'Product Key', 'dim Product', 'Product Key', { crossFilteringBehavior: 'bothDirections' }), rel('Bridge', 'Group Key', 'Groups', 'Group Key'),
  rel('Tags', 'Tag', 'dim_Customer', 'City', { fromCardinality: 'many', toCardinality: 'many' })] } });
export const rulesReport = () => ({ format: 'pbir', files: [
  { path: 'definition/pages/p1/page.json', json: { name: 'p1', displayName: 'Page 1' } },
  { path: 'definition/pages/p1/visuals/v1/visual.json', json: { visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: [
    { field: ent('fact Sales', 'Total', 'Measure') }, { field: ent('Gone', 'Old Column') }, { field: ent('fact Sales', 'Missing Measure', 'Measure') }, { field: ent('Groups', 'Label') }] } } } } } }] });
// Q: every question (a total leaving out a category, a doubled aggregate, a name that says another column, a current
// value moved by a day both ways, a ratio as a percentage, a value multiplied by 100 twice, an amount divided by 1,000
// shown plain, a relationship on the wrong key, an unrelated date table and an unrelated fact table), and the shapes
// that must not ask (a dynamic format, a previous value, a scaled name, a unit, a generic key)
export const questionsModel = () => ({ compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Cases', 'int64'), col('Deaths', 'int64'), col('Category', 'string'), col('Date', 'dateTime'),
    col('Customer Key', 'int64'), col('Billing Customer Key', 'int64'), col('Duration ms', 'int64')],
    measures: [ms('Total Sales', 'CALCULATE ( SUM ( Sales[Amount] ), Sales[Category] <> "Returns" )'),
      ms('Units Doubled', 'SUM(Sales[Cases]) + SUM(Sales[Cases])'), ms('Deaths', 'SUM ( Sales[Cases] )'),
      ms('Current Cases', 'CALCULATE ( SUM ( Sales[Cases] ), DATEADD ( Sales[Date], -1, DAY ) )'),
      ms('Latest Date', 'MAX ( Sales[Date] ) - 1'), ms('Previous Current Cases', 'CALCULATE ( SUM ( Sales[Cases] ), DATEADD ( Sales[Date], -1, DAY ) )'),
      ms('Current Ratio', 'DIVIDE ( SUM ( Sales[Amount] ), 2 )', { formatString: '0.0%' }),
      ms('Growth', 'DIVIDE ( SUM ( Sales[Amount] ), 3 ) * 100', { formatString: '0.0%' }),
      ms('Revenue K', 'DIVIDE ( SUM ( Sales[Amount] ), 1000 )', { formatString: '#,0' }),
      ms('Revenue', 'SUM ( Sales[Amount] ) / 1000000', { formatString: '#,0.0' }),
      ms('Revenue Dynamic', 'SUM ( Sales[Amount] ) / 1000', { formatStringDefinition: { expression: '"#,0"' } }),
      ms('Duration', 'SUM ( Sales[Duration ms] ) / 1000', { formatString: '#,0' })] },
  { name: 'Customer', partitions: mp('Customer'), columns: [col('Billing Customer Key', 'int64', { isKey: true }), col('Name', 'string'), col('Id', 'int64')] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime', { isKey: true }), col('Year', 'int64')] },
  { name: 'Orders', partitions: mp('Orders'), columns: [col('Product Code', 'string'), col('Qty', 'int64'), col('Note', 'string')] },
  { name: 'Product', partitions: mp('Product'), columns: [col('Product Code', 'string', { isKey: true }), col('Colour', 'string')] }],
relationships: [rel('Sales', 'Customer Key', 'Customer', 'Billing Customer Key'), rel('Product', 'Product Code', 'Customer', 'Name', { isActive: false })] } });
// the guards' shapes: b148's doubled aggregate and its wrong relationship key; AUD-043's rate names in two languages
export const guardModels = () => [
  { model: { compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Qty', 'int64'), col('Amount', 'double')],
    measures: [ms('Units Doubled', 'SUM(Sales[Qty]) + SUM(Sales[Qty])'), ms('Total Sales', 'SUM ( Sales[Amount] )')] }] } }, report: null },
  { model: { model: { tables: [{ name: 'T', columns: [col('A', 'double')],
    measures: ['Margin %', 'هامش الربح %', 'هامش الربح ٪', 'Margin ٪', 'Margin ％', 'نسبة الربح', 'Total Sales', 'إجمالي المبيعات', 'معدل الطلب'].map((n) => ms(n, 'DIVIDE ( 1, 2 )', { formatString: '#,0.00' })) }] } }, report: null },
  { model: { compatibilityLevel: 1567, model: { tables: [
    { name: 'Orders', partitions: mp('Orders'), columns: [col('Customer Id', 'int64'), col('Ship Customer Key', 'int64'), col('Amount', 'double')] },
    { name: 'Customers', partitions: mp('Customers'), columns: [col('Ship Customer Key', 'int64', { isKey: true }), col('Name', 'string')] }],
  relationships: [rel('Orders', 'Customer Id', 'Customers', 'Ship Customer Key')] } }, report: null }];
// U: the unused-field claims with a report: a field parameter, a sort-by column, a measures table's placeholder, a
// hierarchy, a role, a report measure, a column only a calculated column reads
export const unusedModel = () => ({ compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Month', 'string', { sortByColumn: 'Month No' }), col('Month No', 'int64'), col('Spare', 'string'),
    col('Hidden Spare', 'string', { isHidden: true }), Object.assign(col('Double Amount', 'double'), { type: 'calculated', expression: 'Sales[Amount] * 2' }), col('Raw', 'double'),
    Object.assign(col('From Raw', 'double'), { type: 'calculated', expression: 'Sales[Raw] + 1' })],
    hierarchies: [{ name: 'By Month', levels: [{ name: 'Month', column: 'Month' }] }], measures: [ms('Total', 'SUM ( Sales[Amount] )'), ms('Never', 'SUM ( Sales[Raw] )')] },
  { name: '_Measures', partitions: mp('_Measures'), columns: [col('Value', 'int64', { isHidden: true })], measures: [ms('Headline', '[Total]')] },
  { name: 'Pick', partitions: [{ name: 'Pick', source: { type: 'calculated', expression: '{ ( "Amount", NAMEOF ( Sales[Amount] ), 0 ) }' } }],
    columns: [Object.assign(col('Pick', 'string'), { relatedColumnDetails: { groupByColumns: [{ groupingColumn: 'Pick Fields' }] } }), col('Pick Fields', 'string', { isHidden: true }), col('Pick Order', 'int64', { isHidden: true })] },
  { name: 'Region Map', partitions: mp('Region Map'), columns: [col('Region', 'string', { isKey: true }), col('Owner', 'string')] },
  { name: 'Nobody', partitions: mp('Nobody'), columns: [col('A', 'string'), col('B', 'int64')] }],
relationships: [rel('Sales', 'Region', 'Region Map', 'Region')],
roles: [{ name: 'Owners', tablePermissions: [{ name: 'Region Map', filterExpression: '[Owner] = USERPRINCIPALNAME ()' }] }] } });
export const unusedReport = () => ({ format: 'pbir', files: [
  { path: 'definition/pages/p1/page.json', json: { name: 'p1', displayName: 'Page 1' } },
  { path: 'definition/pages/p1/visuals/v1/visual.json', json: { visual: { visualType: 'matrix', query: { queryState: { Rows: { projections: [
    { field: { HierarchyLevel: { Expression: { Hierarchy: { Expression: { SourceRef: { Entity: 'Sales' } }, Hierarchy: 'By Month' } }, Level: 'Month' } } }, { field: ent('Pick', 'Pick') }] },
    Values: { projections: [{ field: ent('_Measures', 'Headline', 'Measure') }, { field: ent('Sales', 'Double Amount') }] } } } } } },
  { path: 'definition/reportExtensions.json', json: { entities: [{ name: 'Sales', measures: [{ name: 'Report Only', expression: 'SUM ( Sales[From Raw] )' }] }] } }] });
