import './test-env.mjs';
// 0.3.2 SP15 (the split: B-280, B-286; mcp/work/SP15.md). A characterisation suite for the Model Health Check's model
// index: normalizeModel's output, buildIndex's index and the dependency references (daxRefs of every DAX text, aggBase of
// every aggregation) for 14 made-up models are the ones recorded on the base (integration/0.3.2 aacd75b, before
// normalizeModel, buildIndex, K, daxRefs and aggBase moved from assets/js/model-health-engine.js to
// assets/js/model-index.js). On the base the engine's private functions are read by loading its file with them added
// to its API (the file on disk is never changed). Recorded in fixtures/sp15-index.json; SP15_RECORD=1 records them again
// (only on the base, never to make a run pass). Made-up models only: sp9's 11 (fixtures/health-models.mjs) and three
// written here.
//   N1-N14  each model: normalizeModel, the index (every key and the object it names), daxRefs, aggBase; for B1-B3
//           analyze()'s whole output too (the unused fields above all)
//   Q1      check_model_health's answer on B3 (the incomplete model: its warning first)
//   C1      the cases cover calculation groups, a measure using another table's measure, the incomplete model
//   after the move: I1 model-index.js holds the five, the engine requires it and exports the same functions;
//   I2 the index is frozen (a write throws) and no code writes to it;  I3 the load order (worker, both tool pages)
//   node test-0.3.2-sp15.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { copyFixtures, CASES as SP9_CASES, mp, col, ms, ent } from './fixtures/health-models.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..'), JS = path.join(REPO, 'assets/js');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'sp15-index.json');
const SRC = (f) => fs.readFileSync(path.join(REPO, f), 'utf8');
const Health = require('../assets/js/model-health-engine.js');
const AFTER = fs.existsSync(path.join(JS, 'model-index.js'));

// the index's functions: model-index.js after the move; on the base, the engine's own (its file loaded with them added
// to its API; its require loads the neighbour the same way)
const sandbox = (file, edit) => { const m = { exports: {} }; new Function('module', 'exports', 'self', 'require', edit(fs.readFileSync(path.join(JS, file), 'utf8')))(m, m.exports, undefined, (dep) => require(path.join(JS, path.basename(dep)))); return m.exports; };
const IDX = AFTER ? require('../assets/js/model-index.js')
  : sandbox('model-health-engine.js', (s) => { const at = 'const api = { analyze,'; if (s.split(at).length !== 2) throw new Error('the engine\'s API line moved'); return s.replace(at, 'const api = { buildIndex, aggBase, K, analyze,'); });

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp15-')));
process.env.DATAARCUS_ROOT = ROOT;
const { loadModel, unreadableOf } = await import(new URL('./lib/model.mjs', import.meta.url).href);
copyFixtures(ROOT);
const viaLoader = (p) => { const m = loadModel(p, { root: ROOT }); return { model: m.tmsl, report: m.report, extra: unreadableOf(m) }; };

// ---------- the three new models ----------
// B1 calculation groups: two groups with precedence, items using measures, SELECTEDMEASURE, a format string expression
// using a measure of another table, a group column used by a report, a group nobody uses
const calcGroups = () => ({ compatibilityLevel: 1601, model: { culture: 'en-US', tables: [
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
const calcGroupsReport = () => ({ format: 'pbir', files: [
  { path: 'definition/pages/p1/page.json', json: { name: 'p1', displayName: 'Page 1' } },
  { path: 'definition/pages/p1/visuals/v1/visual.json', json: { visual: { visualType: 'matrix', query: { queryState: {
    Rows: { projections: [{ field: ent('Time Intelligence', 'Period') }] }, Values: { projections: [{ field: ent('Sales', 'Ratio', 'Measure') }] } } } } } }] });
// B2 a measure using measures of another table: a measures-only table, qualified and unqualified, a column in the
// measure table named like another table's measure, a calculated column using a measure, a chain three deep, a virtual
// column named like a measure (it is the virtual column, not the measure)
const crossTable = () => ({ compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Cost', 'double'), col('Region', 'string'), col('Spare', 'string')],
    measures: [ms('Total', 'SUM ( Sales[Amount] )'), ms('Cost Sum', 'SUM ( Sales[Cost] )')] },
  { name: 'Metrics', partitions: mp('Metrics'), columns: [col('Total', 'double'), Object.assign(col('Flag', 'string'), { type: 'calculated', expression: 'IF ( [Total] > 0, "yes", "no" )' })],
    measures: [ms('Margin', '[Total] - [Cost Sum]'), ms('Qualified', "Sales[Total] + 'Sales'[Cost Sum]"), ms('Margin %', 'DIVIDE ( [Margin], [Total] )', { formatString: '0%' }),
      ms('Chain', '[Margin %] * 2'), ms('Lonely', "COUNTROWS ( 'Metrics' )"),
      ms('Virtual Total', 'SUMX ( ADDCOLUMNS ( Sales, "Total", Sales[Amount] ), [Total] )')] },
  { name: '_Measures', partitions: mp('_Measures'), columns: [col('Value', 'int64', { isHidden: true })], measures: [ms('Headline', 'Metrics[Chain] + [Qualified]')] }] } });
const crossTableReport = () => ({ format: 'pbir', files: [
  { path: 'definition/pages/p1/page.json', json: { name: 'p1', displayName: 'Page 1' } },
  { path: 'definition/pages/p1/visuals/v1/visual.json', json: { visual: { visualType: 'card', query: { queryState: { Values: { projections: [{ field: ent('_Measures', 'Headline', 'Measure') }, { field: ent('Sales', 'Region') }] } } } } } }] });

const CASES = SP9_CASES(viaLoader).concat([
  ['B1 calculation groups with a PBIR report', () => ({ model: calcGroups(), report: calcGroupsReport() }), true],
  ['B2 measures using another table\'s measures, with a PBIR report', () => ({ model: crossTable(), report: crossTableReport() }), true],
  ['B3 the incomplete TMDL model (a table file that is not TMDL)', () => viaLoader('garbled/G.SemanticModel'), true]]);

// ---------- what the index gives for one model ----------
const plain = (k, v) => (v instanceof Set ? { Set: Array.from(v) } : v instanceof Map ? { Map: Array.from(v.keys()) } : v);
function indexOf(json) {
  const M = IDX.normalizeModel(json), IX = IDX.buildIndex(M);
  const ti = (t) => M.tables.indexOf(t);
  const index = {
    tables: Array.from(IX.tables, ([k, t]) => [k, ti(t)]),
    columns: Array.from(IX.columns, ([k, e]) => [k, ti(e.table), e.table.columns.indexOf(e.col)]),
    measures: Array.from(IX.measures, ([k, e]) => [k, ti(e.table), e.table.measures.indexOf(e.m)]),
    colsByName: Array.from(IX.colsByName, ([k, a]) => [k, a.map((e) => [ti(e.table), e.table.columns.indexOf(e.col)])]),
    functions: Array.from(IX.functions, ([k, f]) => [k, M.functions.indexOf(f)]),
    keys: Object.keys(IX)
  };
  // every DAX text, as analyze reads it and each part alone, with and without a home table
  const dax = [];
  const ref = (what, expr, home) => dax.push([what, home, IDX.daxRefs(expr, home, IX)]);
  M.functions.forEach((f) => ref('f ' + f.name, f.expr, null));
  M.tables.forEach((t) => {
    t.measures.forEach((m) => { ref('m ' + m.name, m.expr + '\n' + m.fsExpr + '\n' + m.detailRows + '\n' + m.kpi, null); ref('m home ' + m.name, m.expr, t.name); });
    t.columns.forEach((c) => { if (c.kind === 'calculated') ref('c ' + t.name + '|' + c.name, c.expr, t.name); });
    if (t.isCalcTable) ref('t ' + t.name, t.calcExpr, null);
    if (t.calcGroup) t.calcGroup.items.forEach((ci) => ref('ci ' + t.name + '|' + ci.name, ci.expr + '\n' + ci.fsExpr, null));
  });
  M.roles.forEach((r) => r.permissions.forEach((p) => ref('role ' + r.name + '|' + p.table, p.filter, p.table)));
  ref('empty', '', null); ref('undefined', undefined, 'Sales');
  const agg = [];
  M.tables.forEach((t) => t.columns.forEach((c) => { if (c.alternateOf) agg.push([t.name + '|' + c.name, IDX.aggBase(c.alternateOf)]); }));
  return { normalized: M, index, dax, agg };
}
// aggBase on its own inputs: the written forms of a base column or table, and wrong ones
const AGG_INPUTS = [null, {}, { baseColumn: { table: 'Sales', column: 'Amount' } }, { baseColumn: "'Bob''s Sales'[Net]]Amount]" }, { baseColumn: ' Sales [Amount] ' },
  { baseColumn: 'Sales' }, { baseTable: 'Sales' }, { baseTable: { name: 'Sales' } }, { baseColumn: { table: 'Sales' }, baseTable: 'Other' }, { baseColumn: "'المبيعات'[المبلغ]" }];

const now = {}, texts = {};
CASES.forEach(([name, make, full], i) => {
  let t;
  try {
    const c = make(), x = indexOf(c.model);
    if (full) x.analyze = Health.analyze(c.model, c.report);
    if (full) x.extra = c.extra || null;
    if (i === 0) x.aggInputs = AGG_INPUTS.map((a) => IDX.aggBase(a));
    t = JSON.stringify(x, plain);
  } catch (e) { t = 'threw: ' + String(e && e.stack || e); }
  const key = 'N' + (i + 1) + ' ' + name;
  texts[key] = t; now[key] = { length: t.length, sha256: sha(t) };
});

// Q1: check_model_health on the incomplete model (the answer the MCP gives: its warning first)
const norm = (t) => [ROOT, JSON.stringify(ROOT).slice(1, -1), ROOT.split(path.sep).join('/')].reduce((s, r) => s.split(r).join('<ROOT>'), String(t)).replace(/plan-[0-9a-f]{12}/g, 'plan-<id>').split('\\\\').join('/');
const s = await serverClient(ROOT);
let q = '';
try { const r = await s.call('check_model_health', { path: 'garbled/G.SemanticModel' }); q = r.err + '\n' + norm(r.t); } finally { await s.close(); }
now.Q1 = { length: q.length, sha256: sha(q) }; texts.Q1 = q;

if (process.env.SP15_DUMP) fs.writeFileSync(process.env.SP15_DUMP, JSON.stringify(texts, null, 1));
if (process.env.SP15_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-sp15.mjs: normalizeModel, the index, daxRefs and aggBase (and analyze() for B1-B3), and check_model_health\'s answer on the incomplete model, recorded on the base (normalised: the working folder, the plan id and the path separator)', records: now }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).records;
for (const k of Object.keys(now)) chk(() => gold[k] && JSON.stringify(now[k]) === JSON.stringify(gold[k]),
  () => `${k.split(' ')[0]}. ${k.replace(/^\w+ /, '')}: the output is the base's: now ${JSON.stringify(now[k])}, recorded ${JSON.stringify(gold[k] || null)} (SP15_DUMP=<file> writes them)`);

// C1: the cases cover what the index reads
const T = (k) => texts[Object.keys(texts).find((x) => x.startsWith(k + ' '))];
const J = (k) => JSON.parse(T(k));
const COVER = {
  'every case read': Object.values(texts).every((t) => !t.startsWith('threw')),
  'two calculation groups normalised, items and format strings': J('N12').normalized.tables.filter((t) => t.calcGroup).length === 2 && /ISSELECTEDMEASURE \( \[Ratio\] \)/.test(T('N12')),
  'a calculation item uses another table\'s measure': J('N12').dax.some(([w, , r]) => w === 'ci Time Intelligence|vs Target' && r.refs.includes('m:target')),
  'a measure uses another table\'s measure, qualified and not': J('N13').dax.some(([w, , r]) => w === 'm Margin' && r.refs.includes('m:total') && r.refs.includes('m:cost sum'))
    && J('N13').dax.some(([w, , r]) => w === 'm Qualified' && r.style.qualifiedMeasures.length === 2),
  'a virtual column named like a measure is not the measure': J('N13').dax.some(([w, , r]) => w === 'm Virtual Total' && !r.refs.includes('m:total')),
  'unused fields found with a report (B1, B2)': ['N12', 'N13'].every((k) => /"UNUSED_COL"/.test(T(k)) && /"UNUSED_MEASURE"/.test(T(k))),
  'the incomplete model keeps its warning': /"unreadable":\{"message":"[^"]*Sales Agg\.tmdl/.test(T('N14')) && /Sales Agg\.tmdl/.test(q) && /^false\n\{"unreadable"/.test(q),
  'aggregations read': J('N9').agg.length === 2 && J('N9').agg.every(([, b]) => b)
};
chk(() => Object.values(COVER).every(Boolean), () => `C1. the cases cover the index's paths: missing ${JSON.stringify(Object.keys(COVER).filter((k) => !COVER[k]))}`);

// ---------- after the move (SP15): model-index.js holds the index; the engine calls it; the index is frozen ----------
if (AFTER) {
  const isrc = SRC('assets/js/model-index.js'), esrc = SRC('assets/js/model-health-engine.js');
  const FIVE = ['normalizeModel', 'buildIndex', 'daxRefs', 'aggBase'];
  chk(() => FIVE.every((f) => typeof IDX[f] === 'function') && typeof IDX.K === 'object' && Object.isFrozen(IDX.K)
    && Health.normalizeModel === IDX.normalizeModel && Health.daxRefs === IDX.daxRefs
    && !/function (normalizeModel|buildIndex|daxRefs|aggBase)\b|\bconst K = /.test(esrc) && /require\('\.\/model-index\.js'\)/.test(esrc)
    && !/\bRULES\b|function analyze|pleaseConfirm|scoreFrom/.test(isrc) && /require\('\.\/dax-reference-parser\.js'\)/.test(isrc),
  () => 'I1 model-index.js holds normalizeModel, buildIndex, K, daxRefs and aggBase (no rules); the engine requires it and exports the same functions');
  const IX = IDX.buildIndex(IDX.normalizeModel(crossTable()));
  const throws = (f) => { try { f(); return false; } catch (e) { return true; } };
  chk(() => Object.isFrozen(IX) && ['tables', 'columns', 'measures', 'colsByName', 'functions'].every((k) => IX[k] instanceof Map && throws(() => IX[k].set('x', 1)) && throws(() => IX[k].delete('x')) && throws(() => IX[k].clear()))
    && throws(() => { IX.tables = null; }) && IX.tables.size > 0
    && !/\bIX\.\w+\.(set|delete|clear)\(|\bIX\.\w+\s*=[^=]|\bIX\[/.test(esrc),
  () => 'I2 the index is frozen: its maps refuse set, delete and clear, the object refuses a new value, and the engine never writes to it');
  const worker = SRC('assets/js/model-health-worker.js'), imp = (worker.match(/importScripts\(([^)]*)\)/) || [])[1] || '';
  const order = (s) => { const a = s.indexOf('dax-reference-parser.min.js?v='), b = s.indexOf('model-index.min.js?v='), c = s.indexOf('model-health-engine.min.js?v=');
    return a >= 0 && a < b && b < c && s.split('model-index.min.js?v=').length === 2; };
  const pages = ['tools/power-bi-model-health-check.html', 'ar/tools/power-bi-model-health-check.html'].map(SRC);
  chk(() => order(imp) && pages.every(order), () => `I3 the worker and both tool pages load dax-reference-parser, then model-index (once), then model-health-engine: worker ${imp}`);
}

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp15.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp15  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp15  ${checks} checks`);
