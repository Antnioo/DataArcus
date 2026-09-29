// TMDL projects: tmdl-model.js reads a project's definition/*.tmdl files into the same model JSON as a model.bim,
// so the Model Health Check gives the same answers on a project saved by Power BI Desktop as on its .pbit export.
// Runs in Node, no browser:  node scripts/tests/tmdl-model.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const load = (file) => { const m = { exports: {} }; new Function('module', 'exports', 'self', fs.readFileSync(path.join(ROOT, 'assets/js', file), 'utf8'))(m, m.exports, undefined); return m.exports; };

// Pairs saved from the same open model in Power BI Desktop: File > Save as (TMDL project) and File > Export > Power BI template
export const PAIRS = ['tmdl-health', 'tmdl-ramadan'];
const FIX = path.join(ROOT, 'scripts/tests/fixtures/model-health');

// Power BI writes some files as UTF-16LE, others as UTF-8 (with or without BOM)
const decode = (u8) => {
  if (u8[0] === 0xff && u8[1] === 0xfe) return new TextDecoder('utf-16le').decode(u8.subarray(2));
  if (u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) return new TextDecoder('utf-8').decode(u8.subarray(3));
  if (u8.length > 1 && u8[1] === 0) return new TextDecoder('utf-16le').decode(u8);
  return new TextDecoder('utf-8').decode(u8);
};
// the model inside a .pbit (stored and deflate entries)
function pbitModel(buf) {
  let e = buf.length - 22; while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  let p = buf.readUInt32LE(e + 16);
  for (let n = buf.readUInt16LE(e + 10); n > 0; n--) {
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20), nlen = buf.readUInt16LE(p + 28), lho = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nlen);
    if (name === 'DataModelSchema') {
      const start = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28), raw = buf.subarray(start, start + size);
      return JSON.parse(decode(new Uint8Array(method === 8 ? zlib.inflateRawSync(raw) : raw)));
    }
    p += 46 + nlen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
  }
  throw new Error('no DataModelSchema');
}
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((x) => (x.isDirectory() ? walk(path.join(d, x.name)) : [path.join(d, x.name)]));
// the engine's view of a model, as plain JSON (rawTables is the input passed through, so it is left out)
const view = (H, json) => {
  const n = H.normalizeModel(json), r = H.analyze(json, null);
  return { model: { ...n, entityExprs: [...n.entityExprs].sort() }, score: r.score, stats: r.stats, findings: r.findings, skipped: r.skipped || [], tables: r.tables, measures: r.measures, relationships: r.relationships, roles: r.roles };
};
// where two JSON values first differ, e.g. "model.tables[2].columns[0].kind: "data" vs "calculated""
function diffs(a, b, at = '', out = []) {
  if (out.length >= 8) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) diffs(a[k], b[k], Array.isArray(a) ? `${at}[${k}]` : at ? `${at}.${k}` : k, out);
  } else if (JSON.stringify(a) !== JSON.stringify(b)) out.push(`${at}: ${JSON.stringify(a)} (pbit) vs ${JSON.stringify(b)} (tmdl)`.slice(0, 300));
  return out;
}

export default async function run() {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  // same value, whatever the order of object keys
  const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((y) => [y, x[y]])) : x));
  const eq = (got, want, msg) => check(canon(got) === canon(want), `${msg}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  let T;
  try { T = load('tmdl-model.js'); } catch (e) { return { checks: 1, problems: ['assets/js/tmdl-model.js: ' + e.message] }; }
  const H = load('model-health-engine.js');
  const model = (files) => T.fromFiles(Object.entries(files).map(([p, text]) => ({ path: 'X.SemanticModel/definition/' + p, text })));

  // ---- one table with every kind of object, written the way Power BI writes TMDL ----
  const sales = [
    '/// Sales facts',
    "table 'Sales Data'",
    '\tlineageTag: 0b1c',
    '\tdataCategory: Regular',
    '',
    '\t/// Headline number',
    '\t/// second line',
    "\tmeasure 'Total ''Net'' Sales' =",
    '\t\t\tSUMX(',
    "\t\t\t    'Sales Data',",
    '\t\t\t    [Qty] * [Price]',
    '\t\t\t)',
    '\t\tformatString: """Yes"";""Yes"";""No"""',
    '\t\tdisplayFolder: KPIs',
    '\t\tisHidden',
    '\t\tlineageTag: 11aa',
    '\t\tformatStringDefinition = IF([Qty] > 1, "0", "0.0")',
    '\t\tdetailRowsDefinition =',
    "\t\t\t\tSELECTCOLUMNS('Sales Data', \"Q\", [Qty])",
    '',
    '\t\tkpi',
    '\t\t\ttargetExpression = 100',
    '\t\t\tstatusExpression = IF([Total] > 100, 1, -1)',
    '',
    '\t\tchangedProperty = Name',
    '',
    '\t\tannotation PBI_FormatHint = {"isGeneralNumber":true}',
    '',
    '\tmeasure Fenced = ```',
    '\t\t\tVAR x = 1',
    '\t\t\tcolumn fake',
    '',
    '\t\t\tRETURN x',
    '\t\t\t```',
    '\t\tformatString: 0.0%',
    '',
    '\tcolumn Qty',
    '\t\tdataType: int64',
    '\t\tisKey',
    '\t\tsummarizeBy: none',
    '\t\tsourceColumn: Qty',
    '',
    "\tcolumn 'Line Total' = [Qty] * [Price]",
    '\t\tdataType: double',
    '\t\tisHidden',
    '',
    '\tcolumn Price',
    '\t\tdataType: double',
    '\t\tsortByColumn: Qty',
    '\t\tdisplayFolder: Money\\Prices',
    '',
    '\tcolumn OrderDate',
    '\t\tdataType: dateTime',
    '\t\tsourceColumn: OrderDate',
    '',
    '\t\tvariation Variation',
    '\t\t\tisDefault',
    '\t\t\trelationship: 9f2c',
    "\t\t\tdefaultHierarchy: LocalDateTable_1f2e.'Date Hierarchy'",
    '',
    '\tcolumn SumQty',
    '\t\tdataType: int64',
    '\t\tsourceColumn: SumQty',
    '',
    '\t\talternateOf',
    "\t\t\tbaseColumn: 'Sales Data'.Qty",
    '\t\t\tsummarization: sum',
    '',
    "\thierarchy 'Qty Levels'",
    '\t\tlevel Qty',
    '\t\t\tcolumn: Qty',
    '',
    "\tpartition 'Sales Data' = m",
    '\t\tmode: directQuery',
    '\t\tsource =',
    '\t\t\t\tlet',
    '\t\t\t\t    Source = Sql.Database("s", "d")',
    '\t\t\t\tin',
    '\t\t\t\t    Source',
    '',
    '\tannotation PBI_ResultType = Table',
    ''].join('\r\n');
  let m = model({ 'tables/Sales Data.tmdl': sales }), t = m.model.tables[0];
  eq(m.model.tables.map((x) => x.name), ['Sales Data'], 'table name');
  eq([t.description, t.dataCategory], ['Sales facts', 'Regular'], 'table description and category');
  eq(t.measures.map((x) => x.name), ["Total 'Net' Sales", 'Fenced'], 'measure names (quoted, with a doubled quote)');
  const ms = t.measures[0];
  eq(ms.expression, "SUMX(\n    'Sales Data',\n    [Qty] * [Price]\n)", 'multi-line measure');
  eq(ms.formatString, '"Yes";"Yes";"No"', 'quoted property value');
  eq([ms.displayFolder, ms.isHidden, ms.description], ['KPIs', true, 'Headline number\nsecond line'], 'measure properties');
  eq(ms.formatStringDefinition, { expression: 'IF([Qty] > 1, "0", "0.0")' }, 'format string expression');
  eq(ms.detailRowsDefinition, { expression: "SELECTCOLUMNS('Sales Data', \"Q\", [Qty])" }, 'detail rows expression');
  eq([ms.kpi && ms.kpi.targetExpression, ms.kpi && ms.kpi.statusExpression], ['100', 'IF([Total] > 100, 1, -1)'], 'KPI expressions');
  eq(ms.annotations, [{ name: 'PBI_FormatHint', value: '{"isGeneralNumber":true}' }], 'measure annotation');
  eq([t.measures[1].expression, t.measures[1].formatString], ['VAR x = 1\ncolumn fake\n\nRETURN x', '0.0%'], 'fenced measure, "column" inside it is DAX');
  eq(t.columns.map((c) => c.name), ['Qty', 'Line Total', 'Price', 'OrderDate', 'SumQty'], 'columns (none from inside expressions)');
  const col = (n) => t.columns.find((c) => c.name === n) || {};
  eq([col('Qty').dataType, col('Qty').isKey, col('Qty').summarizeBy, col('Qty').sourceColumn, col('Qty').type], ['int64', true, 'none', 'Qty', undefined], 'data column');
  eq([col('Line Total').type, col('Line Total').expression, col('Line Total').isHidden], ['calculated', '[Qty] * [Price]', true], 'calculated column');
  eq([col('Price').sortByColumn, col('Price').displayFolder], ['Qty', 'Money\\Prices'], 'sort by column, folder');
  eq(col('OrderDate').variations, [{ name: 'Variation', isDefault: true, relationship: '9f2c', defaultHierarchy: { table: 'LocalDateTable_1f2e', hierarchy: 'Date Hierarchy' } }], 'variation');
  eq(col('SumQty').alternateOf, { baseColumn: { table: 'Sales Data', column: 'Qty' }, summarization: 'sum' }, 'aggregation column');
  eq(t.hierarchies, [{ name: 'Qty Levels', levels: [{ name: 'Qty', column: 'Qty' }] }], 'hierarchy');
  eq(t.partitions, [{ name: 'Sales Data', mode: 'directQuery', source: { type: 'm', expression: 'let\n    Source = Sql.Database("s", "d")\nin\n    Source' } }], 'partition');
  eq(t.annotations, [{ name: 'PBI_ResultType', value: 'Table' }], 'table annotation');
  // the same table indented with 4 spaces reads the same
  eq(model({ 'tables/S.tmdl': sales.replace(/\t/g, '    ') }).model.tables, m.model.tables, 'spaces instead of tabs');

  // ---- calculation group, calculated table, field parameter ----
  m = model({
    'tables/Time Calc.tmdl': ["table 'Time Calc'", '\tcalculationGroup', '\t\tprecedence: 2', '',
      '\t\tcalculationItem Current = SELECTEDMEASURE()', '',
      '\t\tcalculationItem YTD =', "\t\t\t\tCALCULATE(SELECTEDMEASURE(), DATESYTD('Calendar'[Date]))", '', '\t\t\tformatStringDefinition = "0.0"', '',
      '\tcolumn Name', '\t\tdataType: string', '\t\tsourceColumn: Name', '',
      "\tpartition 'Time Calc' = calculationGroup", '\t\tsource = ""', ''].join('\n'),
    'tables/Dates.tmdl': ['table Dates', '\tcolumn Date', '\t\tdataType: dateTime', '\t\tisNameInferred', '\t\tsourceColumn: [Date]', '',
      '\tcolumn Label', '\t\tisNameInferred', '\t\tsourceColumn: [Label]', '',
      '\tpartition Dates = calculated', '\t\tmode: import', '\t\tsource = CALENDAR(DATE(2024,1,1), DATE(2024,12,31))', ''].join('\n'),
    'tables/Pick.tmdl': ['table Pick', "\tcolumn 'Pick Fields'", '\t\tdataType: string', '\t\tsourceColumn: [Value2]', '',
      '\t\trelatedColumnDetails', "\t\t\tgroupByColumn: 'Pick Name'", '',
      '\t\textendedProperty ParameterMetadata =', '\t\t\t\t{', '\t\t\t\t  "version": 3,', '\t\t\t\t  "kind": 2', '\t\t\t\t}', '',
      "\tcolumn 'Pick Name'", '\t\tdataType: string', '\t\tsourceColumn: [Value1]', '',
      '\tpartition Pick = calculated', '\t\tmode: import', '\t\tsource =', '\t\t\t\t{', "\t\t\t\t    (\"Qty\", NAMEOF('Sales Data'[Qty]), 0)", '\t\t\t\t}', ''].join('\n')
  });
  const byName = (n) => m.model.tables.find((x) => x.name === n) || {};
  const cg = byName('Time Calc').calculationGroup || {};
  eq([cg.precedence, (cg.calculationItems || []).map((c) => [c.name, c.expression, c.formatStringDefinition])],
    [2, [['Current', 'SELECTEDMEASURE()', undefined], ['YTD', "CALCULATE(SELECTEDMEASURE(), DATESYTD('Calendar'[Date]))", { expression: '"0.0"' }]]], 'calculation group');
  eq(byName('Time Calc').partitions[0].source.type, 'calculationGroup', 'calculation group partition');
  eq([byName('Dates').columns[0].type, byName('Dates').columns[0].sourceColumn, byName('Dates').partitions[0].source],
    ['calculatedTableColumn', '[Date]', { type: 'calculated', expression: 'CALENDAR(DATE(2024,1,1), DATE(2024,12,31))' }], 'calculated table');
  // Desktop writes no dataType when Power BI works the type out from the DAX: the type is unknown, not text
  eq(byName('Dates').columns.map((c) => c.dataType), ['dateTime', 'unknown'], 'column without a dataType');
  const pf = byName('Pick').columns[0] || {};
  eq(pf.relatedColumnDetails, { groupByColumns: [{ groupingColumn: 'Pick Name' }] }, 'field parameter: related column');
  eq(pf.extendedProperties, [{ type: 'json', name: 'ParameterMetadata', value: { version: 3, kind: 2 } }], 'field parameter: extended property');

  // ---- the model's other files ----
  m = model({
    'database.tmdl': "database 'My Model'\n\tcompatibilityLevel: 1601\n",
    'model.tmdl': ['model Model', '\tculture: ar-AE', '\tdefaultPowerBIDataSourceVersion: powerBI_V3', '\tdiscourageImplicitMeasures', '\tdataAccessOptions', '\t\tlegacyRedirects', '',
      'queryGroup Parameters', '', 'annotation __PBI_TimeIntelligenceEnabled = 0', '', 'annotation PBI_QueryOrder = ["Server","Sales Data"]', '', "ref table 'Sales Data'", 'ref cultureInfo ar-AE', ''].join('\n'),
    'relationships.tmdl': ['relationship 5a1b', "\tfromColumn: 'Sales Data'.Qty", "\ttoColumn: Calendar.'Month No'", '',
      'relationship r2', '\tisActive: false', '\tcrossFilteringBehavior: bothDirections', '\tfromCardinality: one', '\tsecurityFilteringBehavior: bothDirections',
      "\tfromColumn: Sales.'Customer''s Key'", "\ttoColumn: 'Cust.Table'.Key", ''].join('\n'),
    'expressions.tmdl': ['expression Server = "localhost" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]', '\tlineageTag: 3c3c', '\tqueryGroup: Parameters', '',
      '\tannotation PBI_ResultType = Text', '', "expression 'Shared Sales' =", '\t\tlet', '\t\t    Source = Server', '\t\tin', '\t\t    Source', '\tlineageTag: 4d4d', ''].join('\n'),
    'functions.tmdl': "function 'Add Tax' = (amount: NUMERIC) => amount * 1.05\n\tlineageTag: 5e5e\n",
    'roles/Region Managers.tmdl': ["role 'Region Managers'", '\tmodelPermission: read', '', "\ttablePermission 'Sales Data' = [Qty] > 0", '',
      '\t\tcolumnPermission Price', '\t\t\tmetadataPermission: none', '', '\ttablePermission Calendar = ```', '\t\t\t[Year] = 2025', '\t\t\t```', ''].join('\n'),
    'perspectives/Finance.tmdl': "perspective Finance\n\tperspectiveTable 'Sales Data'\n\t\tperspectiveColumn Qty\n",
    'cultures/ar-AE.tmdl': ['cultureInfo ar-AE', '', '\tlinguisticMetadata =', '\t\t\t{', '\t\t\t  "Version": "1.0.0"', '\t\t\t}', '\t\tcontentType: json', ''].join('\n'),
    'tables/Sales Data.tmdl': sales,
    '../TMDLScripts/Script 1.tmdl': "createOrReplace\n\ttable Scratch\n",
    'tables/notes.txt': 'table Nope\n'
  });
  eq([m.name, m.compatibilityLevel], ['My Model', 1601], 'database');
  eq([m.model.culture, m.model.discourageImplicitMeasures], ['ar-AE', true], 'model properties');
  eq(m.model.annotations, [{ name: '__PBI_TimeIntelligenceEnabled', value: '0' }, { name: 'PBI_QueryOrder', value: '["Server","Sales Data"]' }], 'model annotations');
  eq(m.model.tables.map((x) => x.name), ['Sales Data'], 'only definition/*.tmdl files are read (not TMDL scripts, not other files)');
  eq(m.model.relationships, [
    { name: '5a1b', fromTable: 'Sales Data', fromColumn: 'Qty', toTable: 'Calendar', toColumn: 'Month No' },
    { name: 'r2', isActive: false, crossFilteringBehavior: 'bothDirections', fromCardinality: 'one', securityFilteringBehavior: 'bothDirections', fromTable: 'Sales', fromColumn: "Customer's Key", toTable: 'Cust.Table', toColumn: 'Key' }], 'relationships');
  eq(m.model.expressions, [
    { name: 'Server', kind: 'm', expression: '"localhost" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]', queryGroup: 'Parameters', annotations: [{ name: 'PBI_ResultType', value: 'Text' }] },
    { name: 'Shared Sales', kind: 'm', expression: 'let\n    Source = Server\nin\n    Source' }], 'shared expressions');
  eq(m.model.functions, [{ name: 'Add Tax', expression: '(amount: NUMERIC) => amount * 1.05' }], 'functions');
  eq(m.model.roles, [{ name: 'Region Managers', modelPermission: 'read', tablePermissions: [
    { name: 'Sales Data', filterExpression: '[Qty] > 0', columnPermissions: [{ name: 'Price', metadataPermission: 'none' }] },
    { name: 'Calendar', filterExpression: '[Year] = 2025' }] }], 'roles');
  eq([(m.model.perspectives || []).map((p) => p.name), (m.model.cultures || []).map((c) => c.name)], [['Finance'], ['ar-AE']], 'perspectives and cultures');
  // the health engine reads it
  const r = H.analyze(m, null);
  eq([r.stats.tables, r.stats.measures, r.stats.relationships], [1, 2, 2], 'health engine on the TMDL model');

  // ---- columns whose type is unknown: the checks that need the type are skipped, never guessed ----
  const cal = (typed) => ({
    'relationships.tmdl': 'relationship r1\n\tfromColumn: Sales.Date\n\ttoColumn: Calendar.Date\n',
    'tables/Sales.tmdl': 'table Sales\n\tcolumn Date\n\t\tdataType: dateTime\n\t\tisHidden\n\t\tsourceColumn: Date\n\n\tpartition Sales = m\n\t\tmode: import\n\t\tsource = #table({"Date"}, {})\n',
    'tables/Calendar.tmdl': ['table Calendar',
      ...[['Date', 'dateTime'], ['Year', 'int64'], ['Month Name', 'string'], ['Rate', 'double']].flatMap(([n, ty]) => ["\tcolumn '" + n + "'", ...(typed ? ['\t\tdataType: ' + ty] : []), '\t\tsourceColumn: [' + n + ']', '']),
      '\tpartition Calendar = calculated', '\t\tmode: import', '\t\tsource = ADDCOLUMNS(CALENDAR(DATE(2024,1,1), DATE(2024,12,31)), "Year", YEAR([Date]))', ''].join('\n')
  });
  const ids = (list) => (list || []).map((f) => f.id + ':' + f.items.map((x) => x.obj).join('|')).sort();
  const TYPE_RULES = ['DATE_NOT_MARKED', 'SUMMARIZE_KEYS', 'MONTH_SORT', 'DOUBLE', 'STRING_KEYS'];
  const known = H.analyze(model(cal(true)), null), unknown = H.analyze(model(cal(false)), null);
  eq(ids(known.findings.filter((f) => TYPE_RULES.includes(f.id))), ['DATE_NOT_MARKED:Calendar', 'DOUBLE:Calendar[Rate]', 'MONTH_SORT:Calendar[Month Name]', 'SUMMARIZE_KEYS:Calendar[Year]'], 'types known: the type checks find these');
  eq(known.skipped, [], 'types known: nothing skipped');
  eq(ids(unknown.findings.filter((f) => TYPE_RULES.includes(f.id))), [], 'types unknown: no type check gives a finding');
  eq(ids(unknown.skipped), ['DATE_NOT_MARKED:Calendar', 'DOUBLE:Calendar[Date]|Calendar[Year]|Calendar[Month Name]|Calendar[Rate]', 'MONTH_SORT:Calendar[Month Name]',
    'STRING_KEYS:Calendar[Date]', 'SUMMARIZE_KEYS:Calendar[Year]'], 'types unknown: every check that needed a type is listed as skipped');
  check(!!unknown.skipped && unknown.skipped.every((s) => s.reason === 'unknownType'), 'skipped checks say why');

  // ---- parity: the same model saved by Power BI Desktop as a TMDL project and exported as a .pbit ----
  // Exact, except where the TMDL gives no column type (columns of DAX tables): those columns may differ only in their type,
  // the checks that need the type must list what the .pbit found as skipped, and the TMDL may never find anything the .pbit does not.
  // The score then follows from the findings, so it may differ too; everything else must match exactly.
  for (const pair of PAIRS) {
    const dir = path.join(FIX, pair), def = path.join(dir, 'definition'), pbit = fs.existsSync(dir) && fs.readdirSync(dir).find((f) => /\.pbit$/i.test(f));
    if (!fs.existsSync(def) || !pbit) { check(false, `${pair}: fixture missing (needs definition/ and a .pbit saved from the same model in Power BI Desktop)`); continue; }
    const files = walk(def).filter((f) => f.endsWith('.tmdl')).map((f) => ({ path: 'definition/' + path.relative(def, f).replace(/\\/g, '/'), text: decode(new Uint8Array(fs.readFileSync(f))) }));
    const pj = pbitModel(fs.readFileSync(path.join(dir, pbit))), tj = T.fromFiles(files);
    const a = view(H, pj), b = view(H, tj);
    check(a.stats.tables > 0, `${pair}: the .pbit has no tables`);
    // the columns without a type in the TMDL: each one must be a type Power BI inferred (the .pbit says so)
    const untyped = new Set(), pcol = (t, c) => ((((pj.model.tables.find((x) => x.name === t) || {}).columns) || []).find((x) => x.name === c)) || {};
    tj.model.tables.forEach((t) => (t.columns || []).forEach((c) => { if (c.dataType === 'unknown') untyped.add(t.name + '|' + c.name); }));
    const notInferred = [...untyped].filter((k) => !pcol(...k.split('|')).isDataTypeInferred);
    check(!notInferred.length, `${pair}: TMDL columns without a type that the .pbit does not mark as inferred: ${notInferred.join(', ')}`);
    // (a) and (b): the type checks, rule by rule
    const items = (r, f) => ((r.find((x) => x.id === f) || {}).items || []).map((x) => x.obj);
    TYPE_RULES.forEach((id) => {
      const pb = items(a.findings, id), tm = items(b.findings, id), sk = items(b.skipped, id);
      const extra = tm.filter((o) => !pb.includes(o)), lost = pb.filter((o) => !tm.includes(o) && !sk.includes(o));
      check(!extra.length, `${pair}: ${id} finds ${extra.join(', ')} in the TMDL but not in the .pbit`);
      check(!lost.length, `${pair}: ${id} finds ${lost.join(', ')} in the .pbit, but the TMDL neither finds nor skips it`);
    });
    if (!untyped.size) check(!b.skipped.length, `${pair}: every type is known, yet checks were skipped: ${ids(b.skipped)}`);
    // everything else exactly: the types of untyped columns taken from the .pbit, the type findings compared above, the score left out
    const fill = (tables) => tables.forEach((t) => (t.columns || []).forEach((c) => { if (untyped.has(t.name + '|' + c.name)) c.dataType = pcol(t.name, c.name).dataType; }));
    fill(b.model.tables); fill(b.tables);
    const rest = (v, untypedPair) => ({ ...v, skipped: undefined, findings: v.findings.filter((f) => !(untypedPair && TYPE_RULES.includes(f.id))), score: untypedPair ? undefined : v.score });
    const d = diffs(rest(a, untyped.size), rest(b, untyped.size));
    check(!d.length, `${pair}: TMDL and .pbit differ\n        ${d.join('\n        ')}`);
  }
  return { checks, problems };
}

// run directly: node scripts/tests/tmdl-model.mjs
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { checks, problems } = await run();
  console.log(problems.length ? `FAIL  tmdl-model  ${checks} checks\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  tmdl-model  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
