// FN1C (0.3.2): three writer and twin functions split into named steps, behaviour identical. The parts no other suite
// turned red under a mutant, pinned to their output on ca3a1b73 (red there under each part's mutant first):
//   H1-H3  lib/shadow-model.mjs shadowModel: the files, tables, guesses and notes of the shadow of five fixture models
//          and two made-up ones with the hard cases (a calculation group, a field parameter, a true/false key, a 1:1 and
//          a many-to-many relationship, sort-by columns, a calculated column a relationship needs, an Arabic model,
//          what is left out; a second one: an Arabic culture with English names, text sorted by text and by a key,
//          names that make the same file name), in both forms (m, dax) and with other row counts, byte for byte (fixtures/fn1c-shadow.json)
//   P1-P3  lib/twin-plan.mjs planTwin: the whole plan (its answer, texts, labels, what stays English, the terminology
//          sheet) of five runs over a made-up project with the shapes the plan says a line for (fixtures/fn1c-twin.mjs):
//          matrices chosen flat or refused, the kinds that cannot mirror, a card grid, a flip card, a field parameter's
//          slicer, bar lists, a badge, legends, a running calculation, wide tables, a picture page, labels by id and by
//          words, the copy in both languages, and no model; byte for byte as on ca3a1b73 (fixtures/fn1c-plans.json)
//   node test-0.3.2-fn1c.mjs            (--record writes the fixture: only on the base, never to make a split pass)
import './fixtures/sp1/seeded-random.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), FIX = path.join(HERE, 'fixtures', 'fn1c-shadow.json'), FIX2 = path.join(HERE, 'fixtures', 'fn1c-plans.json');
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

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fn1c-')));
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
} catch (e) { fs.rmSync(ROOT, { recursive: true, force: true }); throw e; }

// ---- the twin's plan: five runs over the made-up project ----
const plans = {};
const ROOT2 = fs.realpathSync.native(ROOT);   // (the working folder the model reader took first)
try {
  const F = await import('./fixtures/fn1c-twin.mjs');
  const { planTwin } = await import('./lib/twin-plan.mjs');
  const norm = (x) => JSON.stringify(x, (k, v) => (Buffer.isBuffer(v) || v instanceof Uint8Array ? 'bytes:' + digest(Buffer.from(v).toString('base64')) : v instanceof Map ? [...v] : v instanceof Set ? [...v] : typeof v === 'function' ? 'fn' : v))
    .split(JSON.stringify(ROOT2).slice(1, -1)).join('<ROOT>').split(ROOT2).join('<ROOT>').split('\\\\').join('/');   // (a Windows path's separators, as sp11's norm)
  const one = (P) => ({ answer: norm(P.answer), texts: norm(P.texts), labels: norm(P.labels), rest: norm({ mixedTitles: P.mixedTitles, textsUnknown: P.textsUnknown, notTranslated: P.notTranslated, termRows: P.termRows, addedVisuals: P.addedVisuals, same: P.same, outBase: P.outBase, month: P.month, names: P.names, terms: P.terms, modelPrint: P.modelPrint }) });
  const ID = '00000000-0000-4000-8000-0000000000f1', pb = (d) => path.join(d, 'Twin Sales.pbip');
  const a = F.makeProject(path.join(ROOT2, 'twin-a')), b = F.noModel(F.makeProject(path.join(ROOT2, 'twin-b')));
  const r1 = planTwin({ path: pb(a), logicalId: ID, matrixAsTable: ['mGrouped', 'p4more/mCols', 'nothere'] });
  // labels: every text an Arabic of its own but the page buttons (they take their page's) and the titles that change
  // with the selection (one given by a column is then mixed), and a text by its words
  const labels = {}; r1.texts.forEach((t, i) => { if (t.kind !== 'button' && t.kind !== 'dynamicTitle' && i % 5 !== 4) labels[t.id] = 'نص عربي ' + (i + 1); }); labels.unknownId = 'x';
  const runs = {
    r1,
    r2: planTwin({ path: pb(a), logicalId: ID, into: 'same', timeRightToLeft: false, waterfallRtl: 'mirror', arabicMonth: false }),
    r3: planTwin({ path: pb(a), logicalId: ID, labels, textLabels: { 'Back to start': 'العودة إلى البداية', 'Not a text here': 'لا' }, textsFrom: 3, termsFrom: 1 }),
    r4: planTwin({ path: pb(b), logicalId: ID, mirrorPicturePages: true }),
    r5: planTwin({ path: pb(a), logicalId: ID, labels, into: 'same', tabsShown: 'ar', flipPictures: true }),
  };
  Object.entries(runs).forEach(([k, P]) => { plans[k] = Object.fromEntries(Object.entries(one(P)).map(([x, t]) => [x, digest(t)])); plans[k].size = one(P).answer.length; });
} finally { fs.rmSync(ROOT2, { recursive: true, force: true }); }

if (RECORD) { fs.writeFileSync(FIX, JSON.stringify(got, null, 1) + '\n'); fs.writeFileSync(FIX2, JSON.stringify(plans, null, 1) + '\n'); console.log('recorded ' + Object.keys(got).length + ' shadows, ' + Object.keys(plans).length + ' plans'); process.exit(0); }
const want = JSON.parse(fs.readFileSync(FIX, 'utf8'));
chk(Object.keys(got).length === Object.keys(want).length && Object.keys(want).length === 25, `H1. the 25 recorded cases are made (got ${Object.keys(got).length})`);
for (const c of Object.keys(want)) {
  const g = got[c] || {};
  chk(g.files === want[c].files && g.n === want[c].n, `H2 ${c}. the shadow's files, byte for byte as on ca3a1b73`);
  chk(g.tables === want[c].tables && g.guessed === want[c].guessed && g.notes === want[c].notes, `H3 ${c}. its tables, guesses and notes as on ca3a1b73`);
}
const wantP = JSON.parse(fs.readFileSync(FIX2, 'utf8'));
chk(Object.keys(plans).length === 5 && Object.keys(wantP).length === 5, `P1. the 5 recorded plans are made (got ${Object.keys(plans).length})`);
for (const k of Object.keys(wantP)) {
  const g = plans[k] || {};
  chk(g.answer === wantP[k].answer && g.size === wantP[k].size, `P2 ${k}. the plan's answer, byte for byte as on ca3a1b73 (${g.size} characters, recorded ${wantP[k].size})`);
  chk(g.texts === wantP[k].texts && g.labels === wantP[k].labels && g.rest === wantP[k].rest, `P3 ${k}. its texts, labels, what stays English and the terminology sheet as on ca3a1b73`);
}
console.log(problems.length ? `FAIL  fn1c  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  fn1c  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
