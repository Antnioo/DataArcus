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
