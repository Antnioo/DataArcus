// FN1C (0.3.2): three writer and twin functions split into named steps, behaviour identical. The parts no other suite
// turned red under a mutant, pinned to their output on ca3a1b73 (red there under each part's mutant first):
//   H1-H3  lib/shadow-model.mjs shadowModel: the files, tables, guesses and notes of the shadow of five fixture models
//          and two made-up ones with the hard cases (a calculation group, a field parameter, a true/false key, a 1:1 and
//          a many-to-many relationship, sort-by columns, a calculated column a relationship needs, an Arabic model,
//          what is left out; a second one: an Arabic culture with English names, text sorted by text and by a key,
//          names that make the same file name), in both forms (m, dax) and with other row counts, byte for byte (fixtures/fn1c-shadow.json)
//   node test-0.3.2-fn1c.mjs            (--record writes the fixture: only on the base, never to make a split pass)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), FIX = path.join(HERE, 'fixtures', 'fn1c-shadow.json');
const RECORD = process.argv.includes('--record');
const problems = []; let checks = 0;
const chk = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
const digest = (x) => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');

// a made-up model with the hard cases (made-up names only)
const made = { compatibilityLevel: 1550, model: { culture: 'ar-AE', discourageImplicitMeasures: true, tables: [
  { name: 'Orders', columns: [
    { name: 'Order Id', dataType: 'int64', sourceColumn: 'Order Id', summarizeBy: 'none' },
    { name: 'Order Date', dataType: 'dateTime', sourceColumn: 'Order Date', formatString: 'Short Date' },
    { name: 'Shop Code', dataType: 'string', sourceColumn: 'Shop Code' },
    { name: 'Is Gift', sourceColumn: 'Is Gift' },
    { name: 'Net', dataType: 'decimal', sourceColumn: 'Net', formatString: '#,0.00', description: 'made up' },
    { name: 'Discount Rate', dataType: 'double', sourceColumn: 'Discount Rate', formatString: '0.0%' },
    { name: 'Order Year', dataType: 'int64', sourceColumn: 'Order Year' },
    { name: 'Channel', dataType: 'string', sourceColumn: 'Channel', sortByColumn: 'Channel Order', displayFolder: 'Sales' },
    { name: 'Channel Order', dataType: 'int64', sourceColumn: 'Channel Order', isHidden: true },
    { name: 'Region Key', type: 'calculated', dataType: 'string', expression: 'LEFT ( [Shop Code], 2 )' },
    { name: 'Net x2', type: 'calculated', dataType: 'double', expression: '[Net] * 2' },
    { name: 'Odd', dataType: 'binary', sourceColumn: 'Odd' },
    { name: 'rowNumber', type: 'rowNumber' }],
  measures: [{ name: 'Total Net', expression: 'SUM ( Orders[Net] )', formatString: '#,0', isHidden: false, displayFolder: 'KPIs' },
    { name: 'Net Fmt', expression: ['SUM (', '    Orders[Net]', ')'], formatStringDefinition: { expression: '"#,0"' } }],
  partitions: [{ name: 'Orders', mode: 'import', source: { type: 'm', expression: 'let S = 1 in S' } }] },
  { name: 'Shops', isHidden: true, columns: [
    { name: 'Shop Code', dataType: 'string', sourceColumn: 'Shop Code', isKey: true },
    { name: 'Shop Name', dataType: 'string', sourceColumn: 'Shop Name' },
    { name: 'Opened', dataType: 'dateTime', sourceColumn: 'Opened' }],
  partitions: [{ name: 'Shops', mode: 'import', source: { type: 'm', expression: 'let S = 1 in S' } }] },
  { name: 'Regions', columns: [
    { name: 'Region Key', sourceColumn: 'Region Key', isKey: true },
    { name: 'اسم المنطقة', dataType: 'string', sourceColumn: 'اسم المنطقة' }] },
  { name: 'Gift Flags', columns: [{ name: 'Is Gift', dataType: 'boolean', sourceColumn: 'Is Gift' }, { name: 'Label', dataType: 'string', sourceColumn: 'Label' }] },
  { name: 'Shop Extra', columns: [{ name: 'Shop Code', dataType: 'string', sourceColumn: 'Shop Code' }, { name: 'Floor Area', dataType: 'double', sourceColumn: 'Floor Area' }] },
  { name: 'Targets', columns: [{ name: 'Channel', dataType: 'string', sourceColumn: 'Channel' }, { name: 'Target', dataType: 'double', sourceColumn: 'Target' }] },
  { name: 'التقويم', dataCategory: 'Time', columns: [
    { name: 'التاريخ', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Date]', isKey: true },
    { name: 'Year', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Year]' },
    { name: 'Month Number', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Month Number]' },
    { name: 'Month Name', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Month Name]', sortByColumn: 'Month Number' },
    { name: 'Day Name', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Day Name]', sortByColumn: 'Day of Week' },
    { name: 'Day of Week', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Day of Week]' },
    { name: 'Is Weekend', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Is Weekend]' },
    { name: 'Week', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Week]' }],
  hierarchies: [{ name: 'Calendar', isHidden: true, levels: [{ name: 'Month', ordinal: 1, column: 'Month Name' }, { name: 'Year', ordinal: 0, column: 'Year' }] }],
  partitions: [{ name: 'التقويم', mode: 'import', source: { type: 'calculated', expression: 'CALENDARAUTO ()' } }] },
  { name: 'Time Calc', calculationGroup: { precedence: 2, calculationItems: [{ name: 'Current', expression: 'SELECTEDMEASURE ()', ordinal: 0 },
    { name: 'YTD', expression: ['CALCULATE (', '    SELECTEDMEASURE (),', '    DATESYTD ( \'التقويم\'[التاريخ] )', ')'], ordinal: 1, formatStringDefinition: { expression: '"0.0"' } }] },
  columns: [{ name: 'Time Calc', dataType: 'string', sourceColumn: 'Name' }], partitions: [{ name: 'Time Calc part', source: { type: 'calculationGroup' } }] },
  { name: 'Pick', columns: [
    { name: 'Pick', type: 'calculatedTableColumn', dataType: 'string', sourceColumn: '[Value1]', sortByColumn: 'Pick Order', relatedColumnDetails: { groupByColumns: [{ groupingColumn: 'Pick Fields' }] } },
    { name: 'Pick Fields', type: 'calculatedTableColumn', dataType: 'string', sourceColumn: '[Value2]', isHidden: true, extendedProperties: [{ type: 'json', name: 'ParameterMetadata', value: { version: 3, kind: 2 } }, { type: 'string', name: 'Other', value: 'x' }] },
    { name: 'Pick Order', type: 'calculatedTableColumn', dataType: 'int64', sourceColumn: '[Value3]', isHidden: true }],
  partitions: [{ name: 'Pick', mode: 'import', source: { type: 'calculated', expression: '{ ("Total Net", NAMEOF(\'Orders\'[Total Net]), 0) }' } }] }],
relationships: [
  { name: 'o-cal', fromTable: 'Orders', fromColumn: 'Order Date', toTable: 'التقويم', toColumn: 'التاريخ' },
  { fromTable: 'Orders', fromColumn: 'Shop Code', toTable: 'Shops', toColumn: 'Shop Code' },
  { fromTable: 'Orders', fromColumn: 'Region Key', toTable: 'Regions', toColumn: 'Region Key' },
  { fromTable: 'Orders', fromColumn: 'Is Gift', toTable: 'Gift Flags', toColumn: 'Is Gift' },
  { name: 'one-one', fromTable: 'Shop Extra', fromColumn: 'Shop Code', toTable: 'Shops', toColumn: 'Shop Code', fromCardinality: 'one', toCardinality: 'one', crossFilteringBehavior: 'bothDirections' },
  { name: 'many-many', fromTable: 'Targets', fromColumn: 'Channel', toTable: 'Orders', toColumn: 'Channel', fromCardinality: 'many', toCardinality: 'many', isActive: false },
  { name: 'gone', fromTable: 'Orders', fromColumn: 'Order Id', toTable: 'Nowhere', toColumn: 'Id' }],
roles: [{ name: 'r' }], perspectives: [{ name: 'p' }], cultures: [{ name: 'ar-AE' }], expressions: [{ name: 'e' }], dataSources: [{ name: 'd' }], functions: [{ name: 'f' }] } };

// a second made-up model: an Arabic culture with English names (the weekend Friday and Saturday), a text sorted by
// a text, a text sorted by a key column, and table names that make the same file name
const made2 = { model: { culture: 'ar-SA', tables: [
  { name: 'Calendar', dataCategory: 'Time', columns: [
    { name: 'Date', dataType: 'dateTime', sourceColumn: 'Date', isKey: true },
    { name: 'Day Name', dataType: 'string', sourceColumn: 'Day Name', sortByColumn: 'Day Number' },
    { name: 'Day Number', dataType: 'int64', sourceColumn: 'Day Number' },
    { name: 'Is Weekend', dataType: 'boolean', sourceColumn: 'Is Weekend' }] },
  { name: 'Items', columns: [
    { name: 'Item Key', dataType: 'string', sourceColumn: 'Item Key' },
    { name: 'Size', dataType: 'string', sourceColumn: 'Size', sortByColumn: 'Size Code' },
    { name: 'Size Code', dataType: 'string', sourceColumn: 'Size Code' },
    { name: 'Item Label', dataType: 'string', sourceColumn: 'Item Label', sortByColumn: 'Item Key' }] },
  { name: 'Item Stock', columns: [{ name: 'Item Key', dataType: 'string', sourceColumn: 'Item Key', isKey: true }, { name: 'Qty', dataType: 'int64', sourceColumn: 'Qty' }] },
  { name: 'Moves', columns: [{ name: 'Day', dataType: 'dateTime', sourceColumn: 'Day' }, { name: 'Qty', dataType: 'int64', sourceColumn: 'Qty' }] },
  { name: 'Notes/One', columns: [{ name: 'Text', dataType: 'string', sourceColumn: 'Text' }] },
  { name: 'Notes_One', columns: [{ name: 'Text', dataType: 'string', sourceColumn: 'Text' }] },
  { name: 'notes_one', columns: [{ name: 'Text', dataType: 'string', sourceColumn: 'Text' }] },
  { name: 'Trail.', columns: [{ name: 'Text', dataType: 'string', sourceColumn: 'Text' }] }],
relationships: [
  { name: 'stock', fromTable: 'Items', fromColumn: 'Item Key', toTable: 'Item Stock', toColumn: 'Item Key' },
  { name: 'moves', fromTable: 'Moves', fromColumn: 'Day', toTable: 'Calendar', toColumn: 'Date' }] } };

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fn1c-'));
const got = {};
try {
  const cp = (from, to) => fs.cpSync(path.join(HERE, from), path.join(ROOT, to), { recursive: true });
  cp('test-models/arabic-long-names', 'arabic'); cp('test-models/no-measures', 'plain'); cp('fixtures/health-project', 'health'); cp('fixtures/twin-project', 'twin');
  cp('test-models/large-synthetic/Large Synthetic.SemanticModel', 'large/Large Synthetic.SemanticModel');
  process.env.DATAARCUS_ROOT = ROOT;
  const { loadModel } = await import('./lib/model.mjs');
  const { shadowModel } = await import('./lib/shadow-model.mjs');
  const models = { made, made2 };
  for (const k of ['plain', 'arabic', 'large', 'health', 'twin']) models[k] = loadModel(k, { root: ROOT }).tmsl;
  const OPTS = { m: undefined, dax: { form: 'dax' }, rows: { rows: { dim: 3, fact: 17, date: 40, alone: 5 } }, daxRows: { form: 'dax', rows: { dim: 2, date: 31 } } };
  for (const [k, tm] of Object.entries(models)) for (const [o, opts] of Object.entries(OPTS)) {
    if (k === 'large' && o !== 'm') continue;
    const sh = shadowModel(tm, opts);
    got[k + '/' + o] = { files: digest(sh.files), tables: digest(sh.tables), guessed: digest(sh.guessed), notes: digest(sh.notes), n: sh.files.length };
  }
} finally { fs.rmSync(ROOT, { recursive: true, force: true }); }

if (RECORD) { fs.writeFileSync(FIX, JSON.stringify(got, null, 1) + '\n'); console.log('recorded ' + Object.keys(got).length + ' cases'); process.exit(0); }
const want = JSON.parse(fs.readFileSync(FIX, 'utf8'));
chk(Object.keys(got).length === Object.keys(want).length && Object.keys(want).length === 25, `H1. the 25 recorded cases are made (got ${Object.keys(got).length})`);
for (const c of Object.keys(want)) {
  const g = got[c] || {};
  chk(g.files === want[c].files && g.n === want[c].n, `H2 ${c}. the shadow's files, byte for byte as on ca3a1b73`);
  chk(g.tables === want[c].tables && g.guessed === want[c].guessed && g.notes === want[c].notes, `H3 ${c}. its tables, guesses and notes as on ca3a1b73`);
}
console.log(problems.length ? `FAIL  fn1c  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  fn1c  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
