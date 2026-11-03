import './test-env.mjs';
// 0.3.2 SP7 (the split: B-280, B-286; mcp/work/SP7.md). A characterisation suite for the tooltip pages: for 8 runs of
// plan_layout, approve_plan and create_report, create_report's whole answer and every file it wrote are byte for byte
// the ones recorded on the base (integration/0.3.2 90eaa7c, before pbip-page.js's tooltip pages moved to
// assets/js/pbip-tooltip.js). The server's random ids come from one fixed seed (fixtures/sp1/seeded-random.mjs, SP1's);
// normalised: the plan id and the working folder (SP3's way). Recorded in fixtures/sp7-reports.json; SP7_RECORD=1
// records them again (only on the base, never to make a run pass). Made-up models only: the twin-project and
// health-project fixtures and two tiny models written here.
//   T1-T8  each run's answer and its written files;  C1  the runs cover the tooltip paths (the Top 6 with its title
//   measure, the 6-month and the 12-month trend, an Arabic tooltip title, the empty tooltip page, both page sizes,
//   glass and plain, mirrored bars)
//   after the move: M1  pbip-page.js's tooltips is the page assembly over pbip-tooltip.js (which writes no file and
//   names no visual);  M2  theme-generator.js's BUILDER loads pbip-tooltip once, before pbip-page
//   node test-0.3.2-sp7.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'sp7-reports.json');

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp7-')));
process.env.DATAARCUS_ROOT = ROOT;
// (CI's Windows checkout writes the fixtures' text files with CRLF, SP1) the copies get LF, as the repository holds them
const lf = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) return lf(f);
  const b = fs.readFileSync(f); if (!b.includes(0) && b.includes(13)) fs.writeFileSync(f, b.toString('utf8').replace(/\r\n/g, '\n')); });
const copy = (from, to) => { fs.cpSync(path.join(HERE, 'fixtures', from), path.join(ROOT, to), { recursive: true }); lf(path.join(ROOT, to)); };
// the tiny model (made up): sales by region and month, an Arabic column, a measure with a dynamic format; tinyMonth: the
// same with a month label the model does not sort (its table's date column beside it: the tooltip's trend keeps 6 months)
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const bim = { compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Cost', 'double'), col('Weight', 'double'), col('Region', 'string'), col('المنطقة', 'string'), col('Product', 'string'), col('Microsoft 365 Business Standard Plan Name', 'string'), col('Date', 'dateTime')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' },
      { name: 'Margin', expression: 'SUM ( Sales[Amount] ) - SUM ( Sales[Cost] )', formatString: '#,0', formatStringDefinition: { expression: 'IF ( ABS ( SELECTEDMEASURE () ) >= 1000000, "#,0.0,,\\"M\\"", "#,0" )' } },
      { name: 'Shipped Weight', expression: 'SUM ( Sales[Weight] )', formatString: '#,0 "kg"' }, { name: 'Avg Price', expression: 'DIVIDE ( SUM ( Sales[Amount] ), COUNTROWS ( Sales ) )' }] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [Object.assign(col('Date', 'dateTime'), { isKey: true }), Object.assign(col('Month Name', 'string'), { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Month', 'string')] }],
  relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } };
const tiny = (dir) => { fs.mkdirSync(path.join(ROOT, dir, 'Tiny.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'Tiny.SemanticModel/model.bim'), JSON.stringify(bim)); };
const EN = { kpis: ['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Shipped Weight]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]', category2: 'Sales[Microsoft 365 Business Standard Plan Name]', table: ['Sales[Region]', 'Sales[Product]', 'Sales[Total Sales]', 'Sales[Avg Price]'] };
const AR = { kpis: ['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Margin]'], measure: 'Sales[Margin]', timeAxis: 'Calendar[Month]', category: 'Sales[المنطقة]', category2: 'Sales[Product]', table: ['Sales[المنطقة]', 'Sales[Product]', 'Sales[Total Sales]', 'Sales[Margin]'], slicers: ['Sales[Product]'] };
const AR_NAMES = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Orders]': 'الطلبات', 'Sales[Margin]': 'الهامش', 'Sales[Product]': 'المنتج', 'Calendar[Month]': 'الشهر', 'Calendar[Month Name]': 'اسم الشهر' };
const PLAIN = { chart: { look: 'plain' } };

// each run in its own folder (a fresh copy): EN and AR, glass (the default) and plain, 1920 x 1080 and 1280 x 720, the
// twin fixture and the tiny model, a month the report keeps to 6, and hand-placed pages with no chart (the empty page)
const CASES = [
  ['T1 EN glass 1920 x 1080', 'tiny1', () => tiny('tiny1'), { path: 'tiny1', name: 'SP7 EN glass', layout: 'analysis', kpis: 3, filters: 'start', planFields: EN, secondPage: true }],
  ['T2 EN plain 1280 x 720', 'tiny2', () => tiny('tiny2'), { path: 'tiny2', name: 'SP7 EN plain', layout: 'exec', kpis: 3, page: '1280x720', planFields: Object.assign({}, EN, { timeAxis: 'Calendar[Month]' }), design: PLAIN }],
  ['T3 AR glass 1920 x 1080, names approved', 'tiny3', () => tiny('tiny3'), { path: 'tiny3', name: 'SP7 AR glass', layout: 'analysis', kpis: 3, filters: 'start', lang: 'ar', displayNames: AR_NAMES, planFields: AR, secondPage: true }],
  ['T4 AR plain 1280 x 720, names approved', 'tiny4', () => tiny('tiny4'), { path: 'tiny4', name: 'SP7 AR plain', layout: 'exec', kpis: 3, filters: 'top', page: '1280x720', lang: 'ar', displayNames: AR_NAMES, planFields: Object.assign({}, AR, { timeAxis: 'Calendar[Month Name]' }), design: PLAIN }],
  ['T5 EN glass on the twin', 'twin5', () => copy('twin-project', 'twin5'), { path: 'twin5', name: 'SP7 twin EN', layout: 'analysis', kpis: 3, filters: 'start', secondPage: true }],
  ['T6 AR plain 1280 x 720 on the twin, no names', 'twin6', () => copy('twin-project', 'twin6'), { path: 'twin6', name: 'SP7 twin AR', layout: 'ops', lang: 'ar', page: '1280x720', design: PLAIN }],
  ['T7 AR glass 1280 x 720 on the twin', 'twin7', () => copy('twin-project', 'twin7'), { path: 'twin7', name: 'SP7 twin AR glass', layout: 'focus', lang: 'ar', page: '1280x720' }],
  ['T8 hand-placed pages, no chart', 'health8', () => copy('health-project', 'health8'), { path: 'health8', name: 'SP7 hand', pages: [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'title', x: 24, y: 12, w: 600, h: 40 }, { kind: 'table', x: 24, y: 80, w: 916, h: 400 }] }] }]
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
if (process.env.SP7_DUMP) fs.writeFileSync(process.env.SP7_DUMP, JSON.stringify(got, null, 1));
const hash = (x) => (x ? { err: x.err, length: x.t.length, sha256: sha(x.t) } : null);
const now = Object.fromEntries(Object.entries(got).map(([k, v]) => [k, { plan: hash(v.plan), report: hash(v.report), files: { count: v.files.split('\n').length - 1, sha256: sha(v.files) } }]));
if (process.env.SP7_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-sp7.mjs: create_report\'s answers and the written files recorded on the base (normalised: the plan id, the working folder and the path separator)', runs: now }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).runs;
for (const [name] of CASES) chk(() => gold[name] && JSON.stringify(now[name]) === JSON.stringify(gold[name]),
  () => `${name.split(' ')[0]}. "${name.replace(/^T\d+ /, '')}": create_report's answer and the written files are the base's, byte for byte: now ${JSON.stringify(now[name])}, recorded ${JSON.stringify(gold[name] || null)} (SP7_DUMP=<file> writes them)`);

// the runs cover the tooltip pages' paths: read from the written files (each run's tooltip pages: type "Tooltip")
const pagesOf = (dir) => tree(path.join(ROOT, dir)).filter((f) => /[\\/]pages[\\/][^\\/]+[\\/]page\.json$/.test(f)).map((f) => ({ f, j: JSON.parse(fs.readFileSync(f, 'utf8')) })).filter((p) => p.j.type === 'Tooltip');
const visualsOf = (p) => { const d = path.join(path.dirname(p.f), 'visuals'); return fs.existsSync(d) ? fs.readdirSync(d).map((v) => fs.readFileSync(path.join(d, v, 'visual.json'), 'utf8')) : []; };
const tips = Object.fromEntries(CASES.map(([name, dir, , args]) => [name.split(' ')[0], (args.sample ? [] : pagesOf(dir)).map((p) => ({ w: p.j.width, h: p.j.height, name: p.j.displayName, vs: visualsOf(p) }))]));
const any = (fn) => Object.values(tips).some((ps) => ps.some(fn));
const COVER = {
  'every run has tooltip pages': Object.values(tips).every((ps) => ps.length > 0),
  'a Top 6 (376 wide)': any((p) => p.w === 376 && p.vs.some((v) => v.includes('"TopN"'))),
  'a Top-N title measure': any((p) => p.vs.some((v) => /"Schema":"extension"/.test(v.replace(/\s/g, '')) && /"title"/.test(v))),
  'a 6-month trend': any((p) => p.vs.some((v) => v.includes('Last 6 months'))),
  'a 12-month trend': any((p) => p.w === 320 && p.h > 400),
  'an Arabic tooltip page': any((p) => /[؀-ۿ]/.test(p.name)),
  'more than one page of a kind': any((p) => (p.name || '').includes(' · ') && (p.name.match(/ · /g) || []).length >= (p.h > 400 ? 2 : 1)),
  'the empty page': any((p) => p.vs.some((v) => v.includes('"textbox"'))),
  'mirrored bars': any((p) => p.vs.some((v) => /"clusteredBarChart"/.test(v) && /invertAxis|switchAxisPosition|yAxisPosition/.test(v)))
};
chk(() => Object.values(COVER).every(Boolean) && Object.values(got).every((v) => v.report && !v.report.err),
  () => `C1. the runs cover the tooltip paths: missing ${JSON.stringify(Object.keys(COVER).filter((k) => !COVER[k]))}; written ${Object.values(got).filter((v) => v.report && !v.report.err).length} of ${CASES.length}`);

// ---------- after the move (SP7): pbip-page.js assembles, pbip-tooltip.js builds; the website loads it first ----------
const SRC = (f) => fs.readFileSync(path.join(HERE, '..', 'assets', 'js', f), 'utf8');
const pageSrc = SRC('pbip-page.js'), tipSrc = SRC('pbip-tooltip.js'), Tip = require('../assets/js/pbip-tooltip.js'), Page = require('../assets/js/pbip-page.js');
chk(() => typeof Tip.tooltipPages === 'function' && typeof Page.tooltips === 'function' && /TP\.tooltipPages\(/.test(pageSrc) && /require\('\.\/pbip-tooltip\.js'\)/.test(pageSrc)
  && !/const tipPage = |const tipSix = |const tipTop = |TOOLTIP-FIX-LAB/.test(pageSrc) && /const tipSix = 40 \+ 27 \* 6 \+ 8;/.test(tipSrc) && !/\badd\(|\brnd\(|\bjson\(|\bD \+ '\/pages/.test(tipSrc),
  () => 'M1 pbip-page.js\'s tooltips must be the page assembly over pbip-tooltip.js (tooltipPages), which holds the tooltip rules once and writes no file, names no visual');
const tg = SRC('theme-generator.js'), list = (tg.match(/const BUILDER = \[([^\]]*)\]/) || [])[1] || '';
const at = (f) => list.indexOf('/assets/js/' + f + '.min.js?v='), once = (f) => list.split('/assets/js/' + f + '.min.js?v=').length === 2;
chk(() => ['story-titles', 'pbip-query', 'pbip-sizing', 'pbip-tooltip', 'pbip-page'].every(once) && ['story-titles', 'pbip-query', 'pbip-sizing'].every((f) => at(f) < at('pbip-tooltip')) && at('pbip-tooltip') < at('pbip-page'),
  () => 'M2 theme-generator.js\'s BUILDER loads pbip-tooltip once, after what it reads and before pbip-page: ' + list.slice(0, 300));

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp7.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp7  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp7  ${checks} checks`);
