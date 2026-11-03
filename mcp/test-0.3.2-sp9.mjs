import './test-env.mjs';
// 0.3.2 SP9 (the split: B-280, B-286; mcp/work/SP9.md). A characterisation suite for the Model Health Check's DAX tokens
// and report references: analyze()'s whole output for 11 made-up models, the tokens and report references of 14 inputs
// and check_model_health's answer are the ones recorded on the base (integration/0.3.2 a57e094, before the tokenizer and
// the report reading moved from assets/js/model-health-engine.js to assets/js/dax-reference-parser.js). Recorded in
// fixtures/sp9-health.json; SP9_RECORD=1 records them again (only on the base, never to make a run pass). Made-up models
// only: the health, twin and TMDL fixtures and five models written here.
//   A1-A11  analyze() on each model: findings, unused fields, score, skipped checks, questions, tables, measures
//   T1      tokenizeDax, collectReportRefs and analyzeReport on 14 inputs
//   Q1      check_model_health's answer (the health project; the incomplete TMDL model keeps its warning)
//   C1      the cases cover comments, strings with brackets, quoted names, VARs, an Arabic table, the incomplete model
//   after the move: P1 the parser holds no model state and the engine's functions are the parser's;  P2 the load order
//   (the worker, both tool pages)
//   node test-0.3.2-sp9.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'sp9-health.json');
const Health = require('../assets/js/model-health-engine.js');

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp9-')));
process.env.DATAARCUS_ROOT = ROOT;
const { loadModel, unreadableOf } = await import(new URL('./lib/model.mjs', import.meta.url).href);
// (CI's Windows checkout writes the fixtures' text files with CRLF, SP1) the copies get LF, as the repository holds them
const lf = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) return lf(f);
  const b = fs.readFileSync(f); if (!b.includes(0) && b.includes(13)) fs.writeFileSync(f, b.toString('utf8').replace(/\r\n/g, '\n')); });
const copy = (from, to) => { fs.cpSync(from, path.join(ROOT, to), { recursive: true }); if (fs.statSync(from).isDirectory()) lf(path.join(ROOT, to)); };
copy(path.join(HERE, 'fixtures', 'health-project'), 'health');
copy(path.join(HERE, 'fixtures', 'twin-project'), 'twin');
copy(path.join(REPO, 'scripts/tests/fixtures/model-health/tmdl-health/definition'), 'tmdl/H.SemanticModel/definition');
copy(path.join(REPO, 'scripts/tests/fixtures/model-health/tmdl-health/Health Test.pbit'), 'tmdl-health.pbit');
copy(path.join(REPO, 'scripts/tests/fixtures/model-health/tmdl-ramadan/definition'), 'ramadan/R.SemanticModel/definition');
copy(path.join(REPO, 'scripts/tests/fixtures/model-health/legacy.pbit'), 'legacy.pbit');
// the incomplete model: the TMDL project with one table file cut to nothing (AU47: named, never skipped silently)
copy(path.join(REPO, 'scripts/tests/fixtures/model-health/tmdl-health/definition'), 'broken/B.SemanticModel/definition');
fs.writeFileSync(path.join(ROOT, 'broken/B.SemanticModel/definition/tables/Notes.tmdl'), '');

// ---------- the made-up models ----------
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType, extra) => Object.assign({ name, dataType, sourceColumn: name }, extra || {});
const ms = (name, expression, extra) => Object.assign({ name, expression, formatString: '#,0' }, extra || {});
// DAX written the hard way: comments of the three kinds holding references, strings holding brackets and quotes,
// quoted table names with spaces and apostrophes, VARs (one a constant divisor), virtual columns, unterminated text
const TRICKY = [
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
const trickyModel = () => ({ compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Qty/Box', 'int64'), col('Region', 'string'), col('Spare', 'string'), col('Odd]Name', 'double'), col('Region Key', 'int64'), col('Date', 'dateTime')], measures: TRICKY },
  { name: "Bob's Sales", partitions: mp("Bob's Sales"), columns: [col('Net Amount', 'double'), col('Region Key', 'int64'), col('Note', 'string')] },
  { name: 'Sales Region Map', partitions: mp('Sales Region Map'), columns: [col('Region Key', 'int64', { isKey: true }), col('Weight', 'double'), col('Label', 'string')] },
  { name: 'Calendar', dataCategory: 'Time', partitions: [{ name: 'Calendar', source: { type: 'calculated', expression: 'CALENDARAUTO () // the model\'s dates' } }],
    columns: [col('Date', 'dateTime', { isKey: true }), Object.assign(col('Month', 'string', { sortByColumn: 'Month No' }), { type: 'calculated', expression: 'FORMAT ( [Date], "MMM" )' }), Object.assign(col('Month No', 'int64'), { type: 'calculated', expression: 'MONTH ( \'Calendar\'[Date] )' })] }],
relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }, { name: 'r2', fromTable: "Bob's Sales", fromColumn: 'Region Key', toTable: 'Sales Region Map', toColumn: 'Region Key', crossFilteringBehavior: 'bothDirections' }] } });
// a PBIR report on the tricky model: a page filter, a visual with a hierarchy level and a variation source, a bookmark and a report measure
const ent = (e, p, kind = 'Column') => ({ [kind]: { Expression: { SourceRef: { Entity: e } }, Property: p } });
const pbir = () => ({ format: 'pbir', files: [
  { path: 'definition/pages/p1/page.json', json: { name: 'p1', displayName: 'Overview «1»', filterConfig: { filters: [{ field: ent('Sales', 'Region') }] } } },
  { path: 'definition/pages/p1/visuals/v1/visual.json', json: { visual: { visualType: 'clusteredColumnChart', query: { queryState: { Category: { projections: [{ field: ent('Calendar', 'Month') }, { field: { HierarchyLevel: { Expression: { Hierarchy: { Expression: { SourceRef: { Entity: 'Calendar' } }, Hierarchy: 'Dates' } }, Level: 'Year' } } }] },
    Y: { projections: [{ field: ent('Sales', 'Net', 'Measure') }, { field: ent('Sales', 'With Vars', 'Measure') }] } } },
    vcObjects: { title: [{ properties: { text: { expr: { Literal: { Value: "'Bob''s [chart]'" } } } } }] } } } },
  { path: 'definition/pages/p1/visuals/v2/visual.json', json: { visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: [{ field: { Column: { Expression: { SourceRef: { Source: 's' } }, Property: 'Label' } } }, { field: { PropertyVariationSource: { Expression: { SourceRef: { Entity: 'Calendar' } }, Name: 'Variation', Property: 'Date' } } }] } } } }, From: [{ Name: 's', Entity: 'Sales Region Map' }] } },
  { path: 'definition/bookmarks/b1.bookmark.json', json: { displayName: 'Only [North]', explorationState: { filters: [ent('Sales', 'Iterator', 'Measure')] } } },
  { path: 'definition/reportExtensions.json', json: { entities: [{ name: 'Sales', measures: [{ name: 'Report Only', expression: 'CALCULATE ( [Text Measure], \'Bob\'\'s Sales\'[Note] = "x" )' }] }] } }] });
// the Arabic model: an Arabic table and column names, unqualified columns in an iterator, a role filter, a calculation group, an aggregation
const arabicModel = () => ({ compatibilityLevel: 1567, model: { culture: 'ar-SA', tables: [
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
const legacy = () => ({ format: 'legacy', files: [{ path: 'Report/Layout', json: {
  config: JSON.stringify({ bookmarks: [{ displayName: 'Group', children: [{ displayName: 'الشمال', explorationState: { filters: [ent('العملاء', 'المدينة')] } }] }],
    modelExtensions: [{ entities: [{ name: 'المبيعات', measures: [{ name: 'تقرير فقط', expression: "[متوسط] + SUM ( 'المبيعات'[الكمية] )" }] }] }] }),
  sections: [{ name: 's1', displayName: 'الصفحة ١', filters: JSON.stringify([{ expression: ent('المبيعات', 'المنطقة') }]), visualContainers: [
    { config: JSON.stringify({ singleVisual: { visualType: 'card', projections: {}, prototypeQuery: { From: [{ Name: 'm', Entity: 'المبيعات' }], Select: [{ Measure: { Expression: { SourceRef: { Source: 'm' } }, Property: 'إجمالي المبيعات' } }] } } }), filters: '[]' },
    { config: JSON.stringify({ singleVisualGroup: { displayName: 'مجموعة' } }), query: JSON.stringify({ Commands: [{ SemanticQueryDataShapeCommand: { Query: { From: [{ Name: 'c', Entity: 'العملاء' }], Select: [{ Column: { Expression: { SourceRef: { Source: 'c' } }, Property: 'الاسم' } }] } } }] }) },
    { config: '{not json' }] }] } }] });
// a model of DAX-only tables and functions (a user-defined function a measure calls), model only
const daxTables = () => ({ compatibilityLevel: 1702, model: { tables: [
  { name: 'Numbers', partitions: [{ name: 'Numbers', source: { type: 'calculated', expression: 'GENERATESERIES ( 1, 10, 1 ) /* [Value] */' } }], columns: [col('Value', 'int64')],
    measures: [ms('Double It', 'Twice ( SUM ( Numbers[Value] ) )'), ms('Unqualified', 'MAXX ( Numbers, [Value] )'), ms('Strings Only', '"Numbers[Value]" & "\'Numbers\'"')] },
  { name: 'Spare Table', partitions: mp('Spare Table'), columns: [col('Value', 'int64'), col('Other', 'string')] }],
functions: [{ name: 'Twice', expression: '( x ) => x * 2 // [Value]' }] } });

const viaLoader = (p) => { const m = loadModel(p, { root: ROOT }); return { model: m.tmsl, report: m.report, extra: unreadableOf(m) }; };
const CASES = [
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
const outOf = ([, make]) => { const c = make(); return JSON.stringify({ result: Health.analyze(c.model, c.report), extra: c.extra || null }); };
const now = {}, texts = {};
for (const c of CASES) { let t; try { t = outOf(c); } catch (e) { t = 'threw: ' + String(e && e.stack || e); } texts[c[0]] = t; now[c[0]] = { length: t.length, sha256: sha(t) }; }

// T1: the tokens and the report references of hard inputs
const T_INPUTS = TRICKY.map((m) => m.expression).concat(["'المبيعات'[المبلغ] + [x]]y] - 1.5e3 // end"]);
const tokens = JSON.stringify({ tokens: T_INPUTS.map((s) => Health.tokenizeDax(s)),
  refs: [pbir(), legacy()].map((r) => { const acc = []; Health.collectReportRefs(r.files.map((f) => f.json), acc, {}); return acc; }),
  reports: [pbir(), legacy(), { format: 'pbir', files: [] }, { format: 'pbir', files: [{ path: 'definition/report.json', json: {} }] }].map((r) => Health.analyzeReport(r)) });
now.T1 = { length: tokens.length, sha256: sha(tokens) }; texts.T1 = tokens;

// Q1: check_model_health through the server (the answer the MCP gives; the incomplete model's warning first)
const norm = (t) => [ROOT, JSON.stringify(ROOT).slice(1, -1), ROOT.split(path.sep).join('/')].reduce((s, r) => s.split(r).join('<ROOT>'), String(t)).replace(/plan-[0-9a-f]{12}/g, 'plan-<id>').split('\\\\').join('/');
const s = await serverClient(ROOT);
let q = '';
try {
  for (const p of ['health', 'broken/B.SemanticModel']) { const r = await s.call('check_model_health', { path: p }); q += p + '\n' + r.err + '\n' + norm(r.t) + '\n'; }
} finally { await s.close(); }
now.Q1 = { length: q.length, sha256: sha(q) }; texts.Q1 = q;

if (process.env.SP9_DUMP) fs.writeFileSync(process.env.SP9_DUMP, JSON.stringify(texts, null, 1));
if (process.env.SP9_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-sp9.mjs: analyze()\'s output, the tokens and report references, and check_model_health\'s answer, recorded on the base (normalised: the working folder, the plan id and the path separator)', records: now }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).records;
for (const k of Object.keys(now)) chk(() => gold[k] && JSON.stringify(now[k]) === JSON.stringify(gold[k]),
  () => `${k.split(' ')[0]}. ${k.replace(/^\w+ /, '')}: the output is the base's: now ${JSON.stringify(now[k])}, recorded ${JSON.stringify(gold[k] || null)} (SP9_DUMP=<file> writes them)`);

// C1: the cases cover what the parser reads
const A = (k) => texts[CASES.find((c) => c[0].startsWith(k + ' '))[0]];
const COVER = {
  'every case analysed': CASES.every((c) => !texts[c[0]].startsWith('threw')),
  'comments of three kinds': TRICKY.some((m) => m.expression.includes('//')) && TRICKY.some((m) => m.expression.includes('--')) && TRICKY.some((m) => m.expression.includes('/*')),
  'strings holding brackets': TRICKY.some((m) => /"[^"]*\[[^"]*"/.test(m.expression)),
  'quoted names with spaces and apostrophes': /Bob''s Sales/.test(JSON.stringify(TRICKY)) && /Sales Region Map/.test(JSON.stringify(TRICKY)),
  'VARs': TRICKY.some((m) => /\bVAR\b/.test(m.expression)),
  'an Arabic table found unused or used': /المبيعات/.test(A('A9')) && /"UNUSED_MEASURE","items":\[\{"obj":"\[نص\]"/.test(A('A9')),
  'unused fields found with a report': /"UNUSED_COL"/.test(A('A8')) && /"UNUSED_MEASURE"/.test(A('A8')),
  'questions asked': /"confirm":\[\{/.test(A('A1') + A('A7') + A('A8') + A('A9')),
  'the incomplete model keeps its warning': /"unreadable":\{"message":"[^"]*Notes\.tmdl/.test(A('A11')) && /Notes\.tmdl/.test(q)
};
chk(() => Object.values(COVER).every(Boolean), () => `C1. the cases cover the parser's paths: missing ${JSON.stringify(Object.keys(COVER).filter((k) => !COVER[k]))}`);

// ---------- after the move (SP9): the parser is pure, the engine calls it; every loader loads it first ----------
if (fs.existsSync(path.join(REPO, 'assets/js/dax-reference-parser.js'))) {
  const SRC = (f) => fs.readFileSync(path.join(REPO, f), 'utf8');
  const P = require('../assets/js/dax-reference-parser.js'), psrc = SRC('assets/js/dax-reference-parser.js'), esrc = SRC('assets/js/model-health-engine.js');
  chk(() => ['tokenizeDax', 'daxCode', 'collectReportRefs', 'visualLabel', 'analyzeReport'].every((f) => typeof P[f] === 'function')
    && Health.tokenizeDax === P.tokenizeDax && Health.collectReportRefs === P.collectReportRefs && Health.analyzeReport === P.analyzeReport
    && !/function (tokenizeDax|daxCode|collectReportRefs|visualLabel|analyzeReport)\b/.test(esrc) && /require\('\.\/dax-reference-parser\.js'\)/.test(esrc)
    && !/\bIX\b|buildIndex|normalizeModel|\bRULES\b|require\(/.test(psrc),
  () => 'P1 dax-reference-parser.js holds the tokenizer and the report reading (no model state, no require); the engine requires it and exports the same functions');
  const worker = SRC('assets/js/model-health-worker.js'), imp = (worker.match(/importScripts\(([^)]*)\)/) || [])[1] || '';
  const order = (s, a, b) => s.indexOf(a) >= 0 && s.indexOf(a) < s.indexOf(b) && s.split(a).length === 2;
  const pages = ['tools/power-bi-model-health-check.html', 'ar/tools/power-bi-model-health-check.html'].map(SRC);
  chk(() => order(imp, 'dax-reference-parser.min.js?v=', 'model-health-engine.min.js?v=') && pages.every((h) => order(h, 'dax-reference-parser.min.js?v=', 'model-health-engine.min.js?v=')),
    () => `P2 the worker and both tool pages load dax-reference-parser.min.js once, before model-health-engine.min.js: worker ${imp}`);
}

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp9.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp9  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp9  ${checks} checks`);
