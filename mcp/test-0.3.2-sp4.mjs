import './test-env.mjs';
// 0.3.2 SP4 (the split, step 4: B-280, B-286; mcp/work/SP4.md). The binding (field identities, formats, bindings) moved
// from lib/report-run.mjs to lib/report-bind.mjs; sp3 does not reach three of its paths, so this suite does, with sp3's
// harness: for 3 runs of plan_layout, approve_plan and create_report, the plan's answer, create_report's whole answer and
// the files it wrote are byte for byte the ones recorded on the base (integration/0.3.2 at 04a9922, before the move), in
// fixtures/sp4-answers.json; SP4_RECORD=1 records them again (only on the base, never to make a run pass). SP1's seed
// (fixtures/sp1/seeded-random.mjs) fixes the random ids; normalised: the plan id, the working folder, the path separator.
// Made-up models only, written here.
//   P1  a model without measures, Arabic: the columns counted and summed, their Arabic names, a display name on a counted column
//   P2  kpiValues "full" (the cards' and the table's formats) and a Ramadan flag's page filter (the flag's day axis)
//   P3  hand-placed pages with more KPI slots than measures and a text slot without text
//   B1  report-run.mjs's fieldsDesign and planBinding are report-bind.mjs's (plan-lint's import unchanged)
//   B2  report-bind.mjs reads no file and writes nothing (explicit inputs)
//   node test-0.3.2-sp4.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'sp4-answers.json');

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp4-')));
process.env.DATAARCUS_ROOT = ROOT;
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const calendar = () => ({ name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [Object.assign(col('Date', 'dateTime'), { isKey: true }), Object.assign(col('Month Name', 'string'), { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Is Ramadan', 'boolean'), col('Ramadan Day', 'int64')] });
const modelAt = (dir, tables, relationships) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships } })); };
// a model without measures (made up): orders by id, region, product and amount
const noMeasures = (dir) => modelAt(dir, [{ name: 'Orders', partitions: mp('Orders'), columns: [col('Order Id', 'int64'), col('Region', 'string'), col('المنتج', 'string'), col('Amount', 'double'), col('Order Date', 'dateTime')] }, calendar()],
  [{ name: 'r1', fromTable: 'Orders', fromColumn: 'Order Date', toTable: 'Calendar', toColumn: 'Date' }]);
// sales with measures (made up): a percentage, a measure without a format, numbers without thousand separators
const sales = (dir) => modelAt(dir, [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Product', 'string'), col('Date', 'dateTime')],
  measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )' },
    { name: 'Share', expression: 'DIVIDE ( 1, 3 )', formatString: '0.0%' }] }, calendar()],
  [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }]);
const CASES = [
  ['P1 a model without measures, Arabic', 'nm1', () => noMeasures('nm1'), { path: 'nm1', name: 'SP4 counts', layout: 'exec', lang: 'ar', secondPage: true, displayNames: { 'Orders[Order Id]': 'رقم الطلب', 'Orders[Region]': 'المنطقة' } }],
  ['P2 kpiValues full, a Ramadan page filter', 'sl2', () => sales('sl2'), { path: 'sl2', name: 'SP4 full', layout: 'analysis', kpis: 3, kpiValues: 'full',
    planFields: { kpis: ['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Share]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Ramadan Day]', category: 'Sales[Region]', table: ['Sales[Region]', 'Sales[Total Sales]', 'Sales[Orders]', 'Sales[Share]'] },
    pageFilters: [{ field: 'Calendar[Is Ramadan]', values: [true] }], gulfDates: { grain: 'seasonDay', scope: 'all' } }],
  ['P3 hand-placed pages, KPI slots left out', 'sl3', () => sales('sl3'), { path: 'sl3', name: 'SP4 hand', kpiValues: 'full', planFields: { kpis: ['Sales[Total Sales]', 'Sales[Orders]'] }, pages: [{ name: 'P', width: 1280, height: 720, slots: [
    { kind: 'title', x: 24, y: 12, w: 600, h: 40 }, { kind: 'kpi', x: 24, y: 70, w: 200, h: 120 }, { kind: 'kpi', x: 240, y: 70, w: 200, h: 120 }, { kind: 'kpi', x: 456, y: 70, w: 200, h: 120 }, { kind: 'kpi', x: 672, y: 70, w: 200, h: 120 },
    { kind: 'text', x: 888, y: 70, w: 360, h: 120 }, { kind: 'bar', x: 24, y: 210, w: 600, h: 300 }, { kind: 'table', x: 640, y: 210, w: 616, h: 300 }] }] }]
];
CASES.forEach(([, , make]) => make && make());
const norm = (t) => [ROOT, JSON.stringify(ROOT).slice(1, -1), ROOT.split(path.sep).join('/')].reduce((s, r) => s.split(r).join('<ROOT>'), String(t))
  .replace(/plan-[0-9a-f]{12}/g, 'plan-<id>')
  // (the answers name files by their path: "nm1\\SP4 counts.pbip" on Windows) every backslash, JSON-escaped, as / on every OS
  .split('\\\\').join('/');
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
// a run's files: every file in its folder, by relative path (with /) and the sha256 of its bytes (text normalised as the answer)
const filesOf = (dir) => tree(dir).map((f) => { const b = fs.readFileSync(f), t = b.includes(0) ? null : b.toString('utf8');
  return path.relative(dir, f).split(path.sep).join('/') + '\0' + (t != null && norm(t) !== t ? sha(norm(t)) : sha(b)) + '\n'; }).sort().join('');

// one fixed seed for the server's random ids (SP1's fixtures/sp1/seeded-random.mjs): ids and digests compare too
const SEED = pathToFileURL(path.join(HERE, 'fixtures', 'sp1', 'seeded-random.mjs')).href;
const s = await serverClient(ROOT, { NODE_OPTIONS: [process.env.NODE_OPTIONS, `--import ${SEED}`].filter(Boolean).join(' ') });
const ask = async (name, args) => { try { return await s.call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
const got = {};
try {
  for (const [name, dir, , args] of CASES) {
    let pl = await ask('plan_layout', args);
    // (the bilingual report) its Arabic titles approved as drafted, a title without a draft kept English, as the plan asks
    const texts = pl.j && pl.j.bilingual && !pl.j.plan && pl.j.bilingual.texts;
    if (texts) pl = await ask('plan_layout', Object.assign({}, args, { arabicTexts: Object.fromEntries(texts.map((x) => [x.text, x.draftArabic || x.text])) }));
    const id = pl.j && pl.j.plan && pl.j.plan.planId, folder = args.sample ? pl.j && pl.j.sample && pl.j.sample.folder : dir;
    if (id) await ask('approve_plan', { planId: id });
    const cr = id ? await ask('create_report', { path: args.sample ? folder : args.path, planId: id }) : null;
    got[name] = { plan: { err: pl.err, t: norm(pl.t) }, report: cr ? { err: cr.err, t: norm(cr.t) } : null, files: folder ? filesOf(path.join(ROOT, folder)) : '' };
  }
} finally { await s.close(); }
if (process.env.SP4_DUMP) fs.writeFileSync(process.env.SP4_DUMP, JSON.stringify(got, null, 1));
const hash = (x) => (x ? { err: x.err, length: x.t.length, sha256: sha(x.t) } : null);
const now = Object.fromEntries(Object.entries(got).map(([k, v]) => [k, { plan: hash(v.plan), report: hash(v.report), files: { count: v.files.split('\n').length - 1, sha256: sha(v.files) } }]));
if (process.env.SP4_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-sp4.mjs: create_report\'s answers and the written files recorded on the base (normalised: the plan id, the working folder and the path separator)', runs: now }, null, 1) + '\n');

const gold = fs.existsSync(GOLD) ? JSON.parse(fs.readFileSync(GOLD, 'utf8')).runs : {};
for (const [name] of CASES) chk(() => gold[name] && JSON.stringify(now[name]) === JSON.stringify(gold[name]),
  () => `${name.split(' ')[0]}. "${name.replace(/^P\d+ /, '')}": create_report's answer and the written files are the base's, byte for byte: now ${JSON.stringify(now[name])}, recorded ${JSON.stringify(gold[name] || null)} (SP4_DUMP=<file> writes them)`);

// B1, B2: the module's entry points and its inputs
const RB = path.join(HERE, 'lib', 'report-bind.mjs'), bindSrc = fs.existsSync(RB) ? fs.readFileSync(RB, 'utf8') : '';
const RR = await import('./lib/report-run.mjs'), RBm = bindSrc ? await import('./lib/report-bind.mjs') : {};
chk(() => typeof RBm.planBinding === 'function' && RR.planBinding === RBm.planBinding && RR.fieldsDesign === RBm.fieldsDesign && typeof RBm.fieldBinding === 'function',
  () => 'B1. report-run.mjs re-exports report-bind.mjs\'s fieldsDesign and planBinding (plan-lint imports them from report-run.mjs), and report-bind.mjs has fieldBinding');
chk(() => bindSrc && !/from 'node:(fs|path|child_process)'|readUserFile|writeTree|withPlan|Plans\.|loadModel|process\.env/.test(bindSrc),
  () => `B2. report-bind.mjs reads no file and writes nothing: ${bindSrc ? (bindSrc.match(/from 'node:(fs|path|child_process)'|readUserFile|writeTree|withPlan|Plans\.|loadModel|process\.env/) || [''])[0] : 'missing'}`);

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp4.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp4  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp4  ${checks} checks`);
