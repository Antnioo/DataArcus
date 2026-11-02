import './test-env.mjs';
// 0.3.2 SP1 (the split, step 1: B-280, B-286; mcp/work/SP1.md). A characterisation suite: plan_layout's whole answer,
// for 10 plans, is byte for byte the answer recorded on the base (integration/0.3.2 a234f06, before the wording moved to
// lib/plan-disclosure.mjs). The server's random ids come from one fixed seed (fixtures/sp1/seeded-random.mjs), so the
// digests and the lists ordered by id compare too; normalised: the plan id ("plan-" and 12 hex, plans.mjs) and the
// working folder's path (a new temporary folder per run). Each answer is compared by its sha256 and length,
// recorded in fixtures/sp1-answers.json; SP1_RECORD=1 records them again (only on the base, never to make a run pass).
// Made-up models only: the twin-project and health-project fixtures and a tiny model written here.
//   P1-P10  the answers;  C1  they show every moved piece's words (the look, the page size, the bilingual answer, the
//   Arabic plan's line, the names kept in English, the titles in English), so each is compared
//   node test-0.3.2-sp1.mjs
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
const GOLD = path.join(HERE, 'fixtures', 'sp1-answers.json');

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp1-')));
process.env.DATAARCUS_ROOT = ROOT;
fs.cpSync(path.join(HERE, 'fixtures', 'twin-project'), path.join(ROOT, 'twin'), { recursive: true });
fs.cpSync(path.join(HERE, 'fixtures', 'health-project'), path.join(ROOT, 'health'), { recursive: true });
// (CI's Windows checkout writes the fixtures' text files with CRLF: the redesign's digest is over the original's bytes) the
// copies get LF, as the repository holds them, so every OS plans from the same bytes
const lf = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) return lf(f);
  const b = fs.readFileSync(f); if (!b.includes(0) && b.includes(13)) fs.writeFileSync(f, b.toString('utf8').replace(/\r\n/g, '\n')); });
lf(path.join(ROOT, 'twin')); lf(path.join(ROOT, 'health'));
// the tiny model (made up): sales by region and month, an Arabic column, a measure with a dynamic format
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const bim = { compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Cost', 'double'), col('Region', 'string'), col('المنطقة', 'string'), col('Product', 'string'), col('Date', 'dateTime')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' },
      { name: 'Margin', expression: 'SUM ( Sales[Amount] ) - SUM ( Sales[Cost] )', formatString: '#,0', formatStringDefinition: { expression: 'IF ( ABS ( SELECTEDMEASURE () ) >= 1000000, "#,0.0,,\\"M\\"", "#,0" )' } }] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [Object.assign(col('Date', 'dateTime'), { isKey: true }), Object.assign(col('Month Name', 'string'), { sortByColumn: 'Month Number' }), col('Month Number', 'int64')] }],
  relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } };
fs.mkdirSync(path.join(ROOT, 'tiny/Tiny.SemanticModel'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'tiny/Tiny.SemanticModel/model.bim'), JSON.stringify(bim));
// a second made-up model whose measure no fixed list names: kept in English, said why, and its titles keep no plan id
const odd = JSON.parse(JSON.stringify(bim)); odd.model.tables[0].measures.push({ name: 'Qzx Flux', expression: 'SUM ( Sales[Cost] )', formatString: '#,0' });
fs.mkdirSync(path.join(ROOT, 'odd/Odd.SemanticModel'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'odd/Odd.SemanticModel/model.bim'), JSON.stringify(odd));
const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Margin]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[المنطقة]', category2: 'Sales[Product]', table: ['Sales[المنطقة]', 'Sales[Product]', 'Sales[Total Sales]', 'Sales[Margin]'], slicers: ['Sales[Product]'] };
const AR_NAMES = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Orders]': 'الطلبات', 'Sales[Margin]': 'الهامش', 'Sales[Product]': 'المنتج' };

// the plans: the sample, a layout alone (a page size asked), English, Arabic with approved names, Arabic with none
// (titles in English, no plan id), bilingual, a redesign, hand-placed pages, and options with scripts
const CASES = [
  ['P1 sample', { sample: true }],
  ['P2 layout only, a page size asked', { layout: 'ops', kpis: 5, filters: 'end', page: '1280x720' }],
  ['P3 English on a model', { path: 'twin', name: 'SP1 English', layout: 'analysis', kpis: 3, filters: 'start' }],
  ['P4 Arabic, names approved', { path: 'tiny', name: 'SP1 Arabic', layout: 'analysis', kpis: 3, filters: 'start', lang: 'ar', displayNames: AR_NAMES, planFields: FIELDS, pageFilters: [{ field: 'Sales[Region]', values: ['North'] }], secondPage: true }],
  ['P5 Arabic, no names', { path: 'twin', name: 'SP1 Arabic bare', lang: 'ar' }],
  ['P6 bilingual', { path: 'twin', name: 'SP1 both', languages: 'en+ar', layout: 'exec' }],
  ['P7 redesign', { path: 'twin', redesignFrom: 'twin/Twin Sales.pbip' }],
  ['P8 hand-placed pages', { path: 'health', name: 'SP1 hand', pages: [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'title', x: 24, y: 12, w: 600, h: 40 }] }] }],
  ['P10 Arabic, a field no list names', { path: 'odd', name: 'SP1 odd', lang: 'ar', layout: 'exec', kpis: 3, planFields: { kpis: ['Sales[Qzx Flux]', 'Sales[Total Sales]', 'Sales[Orders]'], measure: 'Sales[Qzx Flux]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]' } }],
  ['P9 options and scripts', { path: 'tiny', name: 'SP1 options', layout: 'exec', kpis: 3, planFields: { kpis: FIELDS.kpis, measure: FIELDS.measure, timeAxis: FIELDS.timeAxis, category: 'Sales[Region]' }, flipCards: true, metricSwitcher: ['Sales[Total Sales]', 'Sales[Orders]'] }]
];
// the documented random ids, and nothing else: the plan id and the working folder (with its JSON-escaped form)
const norm = (t) => [ROOT, JSON.stringify(ROOT).slice(1, -1), ROOT.split(path.sep).join('/')].reduce((s, r) => s.split(r).join('<ROOT>'), String(t))
  .replace(/plan-[0-9a-f]{12}/g, 'plan-<id>');

// one fixed seed for the server's random ids (fixtures/sp1/seeded-random.mjs): digests and lists ordered by id compare too
const SEED = pathToFileURL(path.join(HERE, 'fixtures', 'sp1', 'seeded-random.mjs')).href;
const s = await serverClient(ROOT, { NODE_OPTIONS: [process.env.NODE_OPTIONS, `--import ${SEED}`].filter(Boolean).join(' ') });
const got = {};
try {
  for (const [name, args] of CASES) { const r = await s.call('plan_layout', args); got[name] = { err: r.err, t: norm(r.t) }; }
} finally { await s.close(); }
if (process.env.SP1_DUMP) fs.writeFileSync(process.env.SP1_DUMP, JSON.stringify(got, null, 1));
const now = Object.fromEntries(Object.entries(got).map(([k, v]) => [k, { err: v.err, length: v.t.length, sha256: sha(v.t) }]));
if (process.env.SP1_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-sp1.mjs: plan_layout\'s answers recorded on the base (normalised: the plan id and the working folder)', answers: now }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).answers;
for (const [name] of CASES) chk(() => gold[name] && now[name].sha256 === gold[name].sha256 && now[name].length === gold[name].length && now[name].err === gold[name].err,
  () => `${name.split(' ')[0]}. plan_layout's answer for "${name.replace(/^P\d+ /, '')}" is the base's, byte for byte: now ${JSON.stringify(now[name])}, recorded ${JSON.stringify(gold[name] || null)} (SP1_DUMP=<file> writes the answers)`);

const all = Object.values(got).map((v) => v.t).join('\n');
const MARKS = ['"reportLook"', '"pageSize"', '"bilingual":{', 'Say in the plan, before the go', 'No Arabic name: none was given', '"titlesInEnglish"', '"chosenBy":"asked"'];
chk(() => MARKS.every((x) => all.includes(x)), () => `C1. the answers show every moved piece's words: missing ${JSON.stringify(MARKS.filter((x) => !all.includes(x)))}`);

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp1.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp1  ${checks} checks`);
