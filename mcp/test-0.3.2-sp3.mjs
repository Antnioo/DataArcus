import './test-env.mjs';
// 0.3.2 SP3 (the split, step 3: B-280, B-286; mcp/work/SP3.md). A characterisation suite: for 9 runs of plan_layout,
// approve_plan and create_report, create_report's whole answer and the files it wrote are byte for byte the ones recorded
// on the base (integration/0.3.2, before the answer and its notes moved from lib/report-run.mjs to lib/report-result.mjs).
// The server's random ids come from one fixed seed (fixtures/sp1/seeded-random.mjs, SP1's), so the written files' ids
// and digests compare too; normalised: the plan id ("plan-" and 12 hex) and the working folder's path (a new temporary
// folder per run). Each answer and each run's files are compared by sha256 and length, recorded in
// fixtures/sp3-answers.json; SP3_RECORD=1 records them again (only on the base, never to make a run pass).
// Made-up models only: the twin-project and health-project fixtures and a tiny model written here.
//   R1-R9  create_report's answer and the written files' digest;  C1  the answers show the moved pieces' words
//   node test-0.3.2-sp3.mjs
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
const GOLD = path.join(HERE, 'fixtures', 'sp3-answers.json');

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp3-')));
process.env.DATAARCUS_ROOT = ROOT;
// (CI's Windows checkout writes the fixtures' text files with CRLF, SP1) the copies get LF, as the repository holds them
const lf = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) return lf(f);
  const b = fs.readFileSync(f); if (!b.includes(0) && b.includes(13)) fs.writeFileSync(f, b.toString('utf8').replace(/\r\n/g, '\n')); });
const copy = (from, to) => { fs.cpSync(path.join(HERE, 'fixtures', from), path.join(ROOT, to), { recursive: true }); lf(path.join(ROOT, to)); };
// the tiny model (made up): sales by region and month, an Arabic column, a measure with a dynamic format
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const bim = { compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Cost', 'double'), col('Region', 'string'), col('المنطقة', 'string'), col('Product', 'string'), col('Date', 'dateTime')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' },
      { name: 'Margin', expression: 'SUM ( Sales[Amount] ) - SUM ( Sales[Cost] )', formatString: '#,0', formatStringDefinition: { expression: 'IF ( ABS ( SELECTEDMEASURE () ) >= 1000000, "#,0.0,,\\"M\\"", "#,0" )' } },
      { name: 'Avg Price', expression: 'DIVIDE ( SUM ( Sales[Amount] ), COUNTROWS ( Sales ) )' }] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [Object.assign(col('Date', 'dateTime'), { isKey: true }), Object.assign(col('Month Name', 'string'), { sortByColumn: 'Month Number' }), col('Month Number', 'int64')] }],
  relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } };
const tiny = (dir) => { fs.mkdirSync(path.join(ROOT, dir, 'Tiny.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'Tiny.SemanticModel/model.bim'), JSON.stringify(bim)); };
const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Margin]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[المنطقة]', category2: 'Sales[Product]', table: ['Sales[المنطقة]', 'Sales[Product]', 'Sales[Total Sales]', 'Sales[Margin]'], slicers: ['Sales[Product]'] };
const EN_FIELDS = { kpis: FIELDS.kpis, measure: FIELDS.measure, timeAxis: FIELDS.timeAxis, category: 'Sales[Region]', category2: 'Sales[Product]', table: ['Sales[Region]', 'Sales[Product]', 'Sales[Total Sales]', 'Sales[Avg Price]'] };
const AR_NAMES = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Orders]': 'الطلبات', 'Sales[Margin]': 'الهامش', 'Sales[Product]': 'المنتج' };

// each run in its own folder (a fresh copy), so no run's written files change another's: the sample project and a report
// on it (R9, in the sample's folder: its files are the sample's and the report's), a glass
// report (the default look) on the twin, the plain look asked, an Arabic report with approved names and a page filter, a
// bilingual one, one with scripts offered (flip cards and the metric switcher, Arabic), one with a field the
// plan refuses, and hand-placed pages
const CASES = [
  ['R1 the sample project', null, null, { sample: true }],
  ['R9 a report on the sample', 'Gulf Retail Sample', null, { path: 'Gulf Retail Sample', name: 'SP3 on the sample', layout: 'exec' }],
  ['R2 glass (the default look)', 'twin2', () => copy('twin-project', 'twin2'), { path: 'twin2', name: 'SP3 glass', layout: 'analysis', kpis: 3, filters: 'start' }],
  ['R3 the plain look asked, subtitles', 'tiny3', () => tiny('tiny3'), { path: 'tiny3', name: 'SP3 plain', layout: 'exec', kpis: 3, planFields: EN_FIELDS, design: { chart: { look: 'plain' } }, subtitles: { 'Trend': 'By month', 'Nowhere': 'x' } }],
  ['R4 Arabic, names approved, a page filter', 'tiny4', () => tiny('tiny4'), { path: 'tiny4', name: 'SP3 Arabic', layout: 'analysis', kpis: 3, filters: 'start', lang: 'ar', displayNames: AR_NAMES, planFields: FIELDS, pageFilters: [{ field: 'Sales[Region]', values: ['North'] }], secondPage: true }],
  ['R5 bilingual', 'twin5', () => copy('twin-project', 'twin5'), { path: 'twin5', name: 'SP3 both', languages: 'en+ar', layout: 'exec' }],
  ['R6 scripts offered', 'tiny6', () => tiny('tiny6'), { path: 'tiny6', name: 'SP3 scripts', layout: 'exec', kpis: 3, lang: 'ar', planFields: { kpis: FIELDS.kpis, measure: FIELDS.measure, timeAxis: FIELDS.timeAxis, category: 'Sales[Region]' }, flipCards: true, metricSwitcher: ['Sales[Total Sales]', 'Sales[Orders]'] }],
  ['R7 a refused field', 'tiny7', () => tiny('tiny7'), { path: 'tiny7', name: 'SP3 refused', layout: 'exec', kpis: 3, planFields: { kpis: ['Sales[Total Sales]', 'Sales[Nope]'], measure: 'Sales[Total Sales]' } }],
  ['R8 hand-placed pages', 'health8', () => copy('health-project', 'health8'), { path: 'health8', name: 'SP3 hand', pages: [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'title', x: 24, y: 12, w: 600, h: 40 }, { kind: 'kpi', x: 24, y: 70, w: 300, h: 120 }, { kind: 'bar', x: 340, y: 70, w: 600, h: 400 }, { kind: 'table', x: 24, y: 480, w: 916, h: 220 }] }] }]
];
CASES.forEach(([, , make]) => make && make());
// the documented random ids, and nothing else: the plan id, the working folder (with its JSON-escaped form) and the path
// separator
const norm = (t) => [ROOT, JSON.stringify(ROOT).slice(1, -1), ROOT.split(path.sep).join('/')].reduce((s, r) => s.split(r).join('<ROOT>'), String(t))
  .replace(/plan-[0-9a-f]{12}/g, 'plan-<id>')
  // (the answers name files by their path: "twin2\\SP3 glass.pbip" on Windows) every backslash, JSON-escaped, as / on every OS
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
let lv1Ext = null;   // (0.3.2 LV1) R5's reportExtensions.json, for L1 below
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
    if (/^R5 /.test(name)) { const x = path.join(ROOT, folder, 'SP3 both.Report/definition/reportExtensions.json'); lv1Ext = fs.existsSync(x) ? fs.readFileSync(x, 'utf8') : null; }
  }
} finally { await s.close(); }
if (process.env.SP3_DUMP) fs.writeFileSync(process.env.SP3_DUMP, JSON.stringify(got, null, 1));
const hash = (x) => (x ? { err: x.err, length: x.t.length, sha256: sha(x.t) } : null);
const now = Object.fromEntries(Object.entries(got).map(([k, v]) => [k, { plan: hash(v.plan), report: hash(v.report), files: { count: v.files.split('\n').length - 1, sha256: sha(v.files) } }]));
if (process.env.SP3_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-sp3.mjs: create_report\'s answers and the written files recorded on the base (normalised: the plan id, the working folder and the path separator)', runs: now }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).runs;
for (const [name] of CASES) chk(() => gold[name] && JSON.stringify(now[name]) === JSON.stringify(gold[name]),
  () => `${name.split(' ')[0]}. "${name.replace(/^R\d+ /, '')}": create_report's answer and the written files are the base's, byte for byte: now ${JSON.stringify(now[name])}, recorded ${JSON.stringify(gold[name] || null)} (SP3_DUMP=<file> writes them)`);

// (0.3.2 LV1, changed on purpose: R5's recorded plan, answer and files hashes are LV1's, by hand, not by SP3_RECORD) the
// bilingual report's Arabic title measures write each value in a first-strong isolate; with those isolates taken out,
// its reportExtensions.json is the base's file byte for byte (its hash as recorded on the base, 4418828), so nothing
// else in R5 moved: the other differences were the plan's digest of these files
// (0.3.3 FB1, changed on purpose: e3986dff... -> the hash below) the Details page's main chart is no longer pressed to 168
// high beside the rail (the cards' row lies over the rail, mcp/work/FB1.md), so it holds as many categories as the
// other chart by Product and the two share one Keep and one Title measure: "Keep: Total Sales by Product (2)", its
// "Title: ... (2)" and "Title AR: ... (2)" are gone from the file, nothing else moved (the two files diffed)
const BASE_EXT = 'd87bede39e4858d2f6e457999fde9a6d58e57a6afdf7fb5081462bfa45e0dc30';
// (0.3.3 AT1, changed on purpose: the owner's «من أصل», D-1110-07) the approved words taken out too, so the hash is the base's
const unLv1 = (t) => t.replace(/(\\?")( )من أصل( )/g, '$1$2من$3').replace(/(?:UNICHAR \( 8207 \) & )?UNICHAR \( 8296 \) & (_[A-Za-z0-9_]+) & UNICHAR \( 8297 \)(?: & UNICHAR \( 8207 \))?/g, '$1');
chk(() => lv1Ext && /UNICHAR \( 8296 \) & _s & UNICHAR \( 8297 \)/.test(lv1Ext) && (norm(unLv1(lv1Ext)) !== unLv1(lv1Ext) ? sha(norm(unLv1(lv1Ext))) : sha(unLv1(lv1Ext))) === BASE_EXT,
  () => `L1. R5's reportExtensions.json is the base's but for LV1's isolates: ${lv1Ext ? sha(norm(unLv1(lv1Ext))) : 'not written'}`);

// the answers show the pieces that moved (the notes, the number formats, the chart colours, the KPI values, the looks,
// the scripts offered and the names), so each is compared; and a refusal (R7) and the files of every written run
const all = Object.values(got).map((v) => (v.report ? v.report.t : '')).join('\n');
const MARKS = ['"reportNotes"', '"kpiValues"', '"chartColors"', '"boundFields"', '"flipCards"', '"metricSwitcher"', '"arabicNames"', '"displayNames"', '"pageFilters"', '"phone"', '"check"', '"formats"', '"numberFormats"', '"chartAxes"', '"modelNotes"'];
chk(() => MARKS.every((x) => all.includes(x)) && Object.values(got).filter((v) => v.report && !v.report.err).length === CASES.length - 1 && Object.values(got).some((v) => !v.report && v.plan.t.includes("\"planProblems\"")),
  () => `C1. the answers show every moved piece: missing ${JSON.stringify(MARKS.filter((x) => !all.includes(x)))}; written ${Object.values(got).filter((v) => v.report && !v.report.err).length} of ${CASES.length}`);

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp3.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp3  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp3  ${checks} checks`);
