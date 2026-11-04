import './test-env.mjs';
// 0.3.2 SP43 (the split, finish: B-280, B-286; mcp/work/SP43.md). A characterisation suite recorded on the base
// (integration/0.3.2 4d97158) before three moves: pbip-export.js's bidi isolation to assets/js/pbip-bidi.js,
// report-run.mjs's build to lib/report-build.mjs, plan_layout.mjs's exact artifact to lib/plan-artifact.mjs. Made-up
// models only (a tiny sales model written here, the twin-project and health-project fixtures, the sample model).
// Random ids come from one fixed seed (SP1's fixtures/sp1/seeded-random.mjs: in this process and in the server), the
// clock is fixed for the ZIP; normalised: the plan id and the working folder. Each result compared by sha256 and
// length, recorded in fixtures/sp43-split.json; SP43_RECORD=1 records them again (only on the base, never to make a run pass).
//   B1-B4  bidi: isolateFiles on a made-up file map (approved names mixed Arabic and English; every mixed text), the
//          writer's Arabic build with mixed names, its English build (left alone)
//   R1-R6  reportRun(a, 'build') (in process): designed EN and AR (mixed names, a page filter, the switcher, flip cards,
//          status icons), the gallery on the twin, hand-placed pages with a theme, a text slot left out; every file and
//          every value it returns;  R7  reportRun(a, 'write') with no approved artifact: its refusal
//   P1-P5  the seeded server: a plan then its write with the same pins (the answer and every written file), the same
//          plan's write refused when a pin changed (nothing written), the bilingual plan, a refused field, hand pages
//   C1  the runs reach every seam (isolation in names and all modes, scripts, gallery, bilingual, both refusals)
//   M1-M3  after each move: the module holds the code, the facade calls it and keeps what the map leaves it
//   node test-0.3.2-sp43.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(typeof t === 'string' ? Buffer.from(t, 'utf8') : Buffer.from(t)).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'sp43-split.json');
const RECORD = process.env.SP43_RECORD === '1';
const there = (f) => fs.existsSync(path.join(HERE, f));
const read = (f) => fs.readFileSync(path.join(HERE, f), 'utf8');

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp43-')));
process.env.DATAARCUS_ROOT = ROOT;
// the fixed clock (the ZIP's entries carry the time of the call) and the seeded random ids, in this process
const RealDate = Date, FIXED = new RealDate(2026, 10, 4, 9, 30, 0).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(FIXED); } static now() { return FIXED; } };
const SEED = pathToFileURL(path.join(HERE, 'fixtures', 'sp1', 'seeded-random.mjs')).href;
await import(SEED);

// (CI's Windows checkout writes the fixtures' text files with CRLF, SP1) the copies get LF, as the repository holds them
const lf = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) return lf(f);
  const b = fs.readFileSync(f); if (!b.includes(0) && b.includes(13)) fs.writeFileSync(f, b.toString('utf8').replace(/\r\n/g, '\n')); });
const copy = (from, to) => { fs.cpSync(path.join(HERE, 'fixtures', from), path.join(ROOT, to), { recursive: true }); lf(path.join(ROOT, to)); };
// the tiny model (made up, sp3's): sales by region and month, an Arabic column, a ratio for the status icons
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const bim = { compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Cost', 'double'), col('Region', 'string'), col('المنطقة', 'string'), col('Product', 'string'), col('Date', 'dateTime')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' },
      { name: 'Margin', expression: 'SUM ( Sales[Amount] ) - SUM ( Sales[Cost] )', formatString: '#,0' },
      { name: 'Fill Rate', expression: 'DIVIDE ( SUM ( Sales[Cost] ), SUM ( Sales[Amount] ) )', formatString: '0.0%' },
      { name: 'Avg Price', expression: 'DIVIDE ( SUM ( Sales[Amount] ), COUNTROWS ( Sales ) )' }] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [Object.assign(col('Date', 'dateTime'), { isKey: true }), Object.assign(col('Month Name', 'string'), { sortByColumn: 'Month Number' }), col('Month Number', 'int64')] }],
  relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } };
const tiny = (dir) => { fs.mkdirSync(path.join(ROOT, dir, 'Tiny.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'Tiny.SemanticModel/model.bim'), JSON.stringify(bim)); };
const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Margin]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]', category2: 'Sales[Product]', table: ['Sales[Region]', 'Sales[Product]', 'Sales[Total Sales]', 'Sales[Avg Price]'] };
// Arabic and English mixed in the approved names (the bidi edge): an acronym, a code, a name kept English
const MIXED = { 'Sales[Total Sales]': 'إجمالي المبيعات KSA', 'Sales[Orders]': 'الطلبات B2B', 'Sales[Margin]': 'Margin', 'Sales[Product]': 'المنتج SKU-7', 'Sales[Region]': 'المنطقة' };
const norm = (t) => [ROOT, JSON.stringify(ROOT).slice(1, -1), ROOT.split(path.sep).join('/')].reduce((s, r) => s.split(r).join('<ROOT>'), String(t))
  .replace(/plan-[0-9a-f]{12}/g, 'plan-<id>').split('\\\\').join('/');
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const filesOf = (dir) => tree(dir).map((f) => { const b = fs.readFileSync(f), t = b.includes(0) ? null : b.toString('utf8');
  return path.relative(dir, f).split(path.sep).join('/') + '\0' + (t != null && norm(t) !== t ? sha(norm(t)) : sha(b)) + '\n'; }).sort().join('');
const listOf = (files) => files.map((f) => f.path + '\0' + (typeof f.data === 'string' ? sha(norm(f.data)) : sha(f.data))).join('\n');
const gold = RECORD ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8')).runs;
const got = {};
const same = (key, value) => { const v = { length: value.length, sha256: sha(value) }; got[key] = v; return RECORD || JSON.stringify(gold[key]) === JSON.stringify(v); };
const was = (key) => `now ${JSON.stringify(got[key])}, recorded ${JSON.stringify(gold[key] || null)}`;
const seen = {};

// ---------- B: the bidi isolation (pbip-export.js's isolateFiles, the writer's Arabic build) ----------
const Pbip = require('../assets/js/pbip-export.js'), D = require('../assets/js/design-engine.js');
const L = (s) => ({ expr: { Literal: { Value: "'" + s.replace(/'/g, "''") + "'" } } });
const fileMap = () => [
  { path: 'X.Report/definition/pages/p1/page.json', data: JSON.stringify({ displayName: 'مبيعات KSA', objects: { outspace: [{ properties: { color: L('#ffffff') } }] } }, null, 2) + '\n' },
  { path: 'X.Report/definition/pages/p1/visuals/v1/visual.json', data: JSON.stringify({ visual: { visualType: 'card', visualContainerObjects: { title: [{ properties: { text: L('Total Sales') } }], general: [{ properties: { altText: L('إجمالي المبيعات KSA حسب Region') } }] },
    query: { queryState: { Values: { projections: [{ displayName: 'الطلبات B2B', field: {} }, { displayName: 'Plain', field: {} }] } } } }, filterConfig: { filters: [{ name: 'f', filter: { Where: [{ Condition: { In: { Values: [[L('KSA شمال')]] } } }] } }] } }, null, 2) + '\n' },
  { path: 'X.Report/definition/pages/p1/visuals/v2/visual.json', data: JSON.stringify({ visual: { visualType: 'textbox', objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: 'نسبة EBITDA في Q1' }, { value: 'English only' }] }] } }] } } }, null, 2) },
  { path: 'X.Report/definition/pages/p1/visuals/v3/mobile.json', data: JSON.stringify({ visualContainerObjects: { title: [{ properties: { text: L('المنتج SKU-7') } }] } }, null, 2) + '\n' },
  { path: 'X.Report/definition/bookmarks/b1.bookmark.json', data: JSON.stringify({ displayName: 'إعادة Reset', name: 'b1' }, null, 2) + '\n' },
  { path: 'X.Report/definition/reportExtensions.json', data: JSON.stringify({ entities: [{ name: 'Sales', measures: [
    { name: 'Title AR', dataType: 'Text', expression: '"إجمالي المبيعات KSA " & FORMAT ( [Total Sales], "#,0" )' },
    { name: 'Wrapped', dataType: 'Text', expression: 'UNICHAR ( 8295 ) & ( "الطلبات B2B" ) & UNICHAR ( 8297 )' },
    { name: 'Num', dataType: 'Double', expression: '"الطلبات B2B"' }] }] }, null, 2) + '\n' },
  { path: 'X.Report/definition/broken.json', data: '{ not json' },
  { path: 'X.SemanticModel/model.bim', data: '{"name":"مبيعات KSA"}' },
  { path: 'X.Report/static/logo.png', data: new Uint8Array([137, 80, 78, 71]) }];
{
  const names = Object.values(MIXED).concat(['⁨KSA⁩ معزول', 'English Only']);
  const f1 = fileMap(), n1 = Pbip.isolateFiles(f1, names);
  chk(() => same('B1', n1 + '\n' + listOf(f1)), () => `B1. isolateFiles with the approved names (Arabic and English mixed) changes the same texts as the base: ${was('B1')}`);
  const f2 = fileMap(), n2 = Pbip.isolateFiles(f2, [], { all: true });
  chk(() => same('B2', n2 + '\n' + listOf(f2)), () => `B2. isolateFiles on every mixed text (an Arabic build) changes the same texts as the base: ${was('B2')}`);
  const f0 = fileMap(), n0 = Pbip.isolateFiles(f0, ['English Only']);
  seen.bidi = n1 > 0 && n2 > n1 && n0 === 0 && listOf(f0) === listOf(fileMap());
  const design = (preset) => { const d = D.fresh(); d.preset = preset; d.data = D.PRESETS[preset].data.slice(); d.ui = Object.assign({}, D.PRESETS[preset].ui); D.repairState(d); return d; };
  const png = (i) => new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, i]);
  const input = (lang, preset) => { const d = design(preset), pages = D.projectPages(d.layout, lang, { second: true });
    return { name: 'SP43 ' + lang, title: lang === 'ar' ? 'لوحة المبيعات KSA 2026' : 'Sales KSA 2026', pageName: pages[0].name, lang, rtl: lang === 'ar', font: d.font, sample: true, logo: null, theme: D.buildTheme(d, lang), ui: d.ui,
      texts: D.REPORT_TEXTS[lang], namesNote: '\n\nNames: إجمالي المبيعات KSA', pages: pages.map((p, i) => ({ name: p.name, page: p.page, slots: p.slots.map((s) => (s.title ? Object.assign({}, s, { title: s.title + ' KPI' }) : s)), png: png(i), panel: p.panel, kpiInset: p.kpiInset })) }; };
  const b3 = Pbip.build(input('ar', 'Desert Gulf')), b4 = Pbip.build(input('en', 'DataArcus'));
  chk(() => same('B3', listOf(b3.files) + '\n' + sha(b3.zip())), () => `B3. the writer's Arabic build (titles mixed Arabic and English) is the base's, every file and the ZIP: ${was('B3')}`);
  chk(() => same('B4', listOf(b4.files) + '\n' + sha(b4.zip())), () => `B4. the writer's English build (nothing isolated) is the base's: ${was('B4')}`);
}

// ---------- R: reportRun's build, in process ----------
tiny('t1'); tiny('t2'); copy('twin-project', 'w3'); copy('health-project', 'h4'); tiny('t5'); tiny('t6'); tiny('t7');
const { reportRun } = await import('./lib/report-run.mjs'), { withLookDefaults } = await import('./lib/report-inputs.mjs'), { planLayout } = await import('./lib/design.mjs');
const designOf = (o) => planLayout(Object.assign({ lang: 'en' }, o)).design;
// a theme file next to the hand-placed pages (generate_theme's 1920 x 1080 sizes: scaled to the 1280 x 720 pages)
fs.writeFileSync(path.join(ROOT, 'h4', 'theme.json'), JSON.stringify(D.buildTheme(designOf({ layout: 'exec', page: '1920x1080' }), 'en')));
const HAND = [{ name: 'Hand', width: 1280, height: 720, slots: [{ kind: 'title', x: 24, y: 12, w: 600, h: 40 }, { kind: 'kpi', x: 24, y: 70, w: 300, h: 120 }, { kind: 'kpi', x: 340, y: 70, w: 300, h: 120 },
  { kind: 'text', x: 656, y: 70, w: 600, h: 120 }, { kind: 'bar', x: 24, y: 210, w: 600, h: 300 }, { kind: 'table', x: 640, y: 210, w: 616, h: 300 }] }];
const RUNS = [
  ['R1', { path: 't1', name: 'SP43 build EN', lang: 'en', design: designOf({ layout: 'exec' }), fields: FIELDS, subtitles: { Trend: 'By month' } }],
  ['R2', { path: 't2', name: 'SP43 build AR', lang: 'ar', design: designOf({ layout: 'analysis', lang: 'ar' }), fields: FIELDS, displayNames: MIXED, pageFilters: [{ field: 'Sales[Region]', values: ['North'] }],
    metricSwitcher: ['Sales[Total Sales]', 'Sales[Orders]'], flipCards: true, secondPage: true }],
  ['R3', { path: 'w3', name: 'SP43 gallery', lang: 'en', design: designOf({ layout: 'analysis' }), gallery: ['combo', 'waterfall'], text: 'What it means: made-up words.' }],
  ['R4', { path: 'h4', name: 'SP43 hand placed pages with a long name', lang: 'en', pages: HAND, theme: 'h4/theme.json' }],
  ['R5', { path: 't5', name: 'SP43 icons', lang: 'en', design: designOf({ layout: 'exec' }), fields: Object.assign({}, FIELDS, { table: ['Sales[Region]', 'Sales[Fill Rate]', 'Sales[Total Sales]'] }), statusIcons: [{ measure: 'Sales[Fill Rate]', good: '>= 0.97', bad: '< 0.94' }] }],
  ['R6', { path: 't6', name: 'SP43 hand AR', lang: 'ar', pages: HAND, displayNames: MIXED, fields: { kpis: ['Sales[Total Sales]', 'Sales[Orders]'], category: 'Sales[Product]' } }]
];
const valuesOf = (b) => JSON.stringify(Object.fromEntries(Object.entries(b).filter(([k, v]) => typeof v !== 'function' && k !== 'm' && k !== 'files')));
for (const [id, a] of RUNS) {
  let out;
  try { const b = reportRun(withLookDefaults(a), 'build'); out = listOf(b.files) + '\n' + norm(valuesOf(b)); seen[id] = b; } catch (e) { out = 'threw: ' + norm(String(e && e.message || e)); }
  chk(() => same(id, out), () => `${id}. reportRun's build of "${a.name}" (every file and every value it returns) is the base's: ${was(id)}`);
}
{
  let t; try { reportRun(withLookDefaults({ path: 't7', name: 'SP43 write', lang: 'en', design: designOf({ layout: 'exec' }), fields: FIELDS, planId: 'plan-000000000000' }), 'write'); t = 'wrote'; } catch (e) { t = norm(String(e && e.message || e)); }
  seen.R7 = t;
  chk(() => same('R7', t), () => `R7. reportRun's write with no approved artifact refuses as the base did: ${was('R7')} (${t.slice(0, 160)})`);
}

// ---------- P: the seeded server: plan_layout's exact artifact, then create_report's write ----------
tiny('p1'); tiny('p2'); copy('twin-project', 'p3'); tiny('p4'); copy('health-project', 'p5');
const s = await serverClient(ROOT, { NODE_OPTIONS: [process.env.NODE_OPTIONS, `--import ${SEED}`].filter(Boolean).join(' ') });
const ask = async (name, args) => { try { return await s.call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
const P1 = { path: 'p1', name: 'SP43 plan AR', layout: 'exec', kpis: 3, lang: 'ar', planFields: FIELDS, displayNames: MIXED, flipCards: true };
try {
  {
    const pl = await ask('plan_layout', P1), id = pl.j && pl.j.plan && pl.j.plan.planId;
    if (id) await ask('approve_plan', { planId: id });
    const cr = id ? await ask('create_report', { path: 'p1', planId: id }) : { err: true, t: 'no plan id' };
    seen.P1 = !!(id && !cr.err);
    chk(() => same('P1', norm(pl.t) + '\n' + norm(cr.t) + '\n' + filesOf(path.join(ROOT, 'p1'))), () => `P1. a plan then its write with the same pins: the plan, the answer and every written file are the base's: ${was('P1')} (${String(cr.t).slice(0, 160)})`);
  }
  {
    const pl = await ask('plan_layout', Object.assign({}, P1, { path: 'p2' })), id = pl.j && pl.j.plan && pl.j.plan.planId;
    if (id) await ask('approve_plan', { planId: id });
    const before = filesOf(path.join(ROOT, 'p2'));
    const cr = id ? await ask('create_report', { path: 'p2', planId: id, displayNames: Object.assign({}, MIXED, { 'Sales[Orders]': 'الطلبات B2C' }) }) : { err: false, t: 'no plan id' };
    seen.P2 = !!(id && cr.err && filesOf(path.join(ROOT, 'p2')) === before);
    chk(() => same('P2', norm(pl.t) + '\n' + norm(cr.t) + '\n' + filesOf(path.join(ROOT, 'p2'))) && seen.P2, () => `P2. the same plan's write with a pin changed is refused, nothing written, as on the base: ${was('P2')} (${String(cr.t).slice(0, 160)})`);
  }
  const plans = [['P3', { path: 'p3', name: 'SP43 both', languages: 'en+ar', layout: 'exec' }], ['P4', { path: 'p4', name: 'SP43 refused', layout: 'exec', kpis: 3, planFields: { kpis: ['Sales[Total Sales]', 'Sales[Nope]'], measure: 'Sales[Total Sales]' } }],
    ['P5', { path: 'p5', name: 'SP43 hand', pages: HAND }]];
  for (const [id, args] of plans) {
    const pl = await ask('plan_layout', args);
    seen[id] = pl;
    chk(() => same(id, norm(pl.t)), () => `${id}. plan_layout's answer for "${args.name}" is the base's: ${was(id)} (${String(pl.t).slice(0, 160)})`);
  }
} finally { await s.close(); }

// ---------- C1: the runs reach every seam ----------
{
  const R2 = seen.R2, R3 = seen.R3, R5 = seen.R5;
  const cover = { bidi: !!seen.bidi, scripts: !!(R2 && R2.metricSwitcher && R2.flip), gallery: !!(R3 && R3.gallery && R3.gallery.length), icons: !!(R5 && R5.icons), hand: !!seen.R4 && !!seen.R6,
    writeRefused: /Nothing was written/.test(seen.R7 || ''), planWrite: !!seen.P1, pinRefused: !!seen.P2, bilingual: !!(seen.P3 && seen.P3.j && seen.P3.j.bilingual), fieldRefused: !!(seen.P4 && /planProblems/.test(seen.P4.t)), handPlan: !!(seen.P5 && seen.P5.j && seen.P5.j.plan) };
  chk(() => Object.values(cover).every(Boolean), () => `C1. the runs reach every seam: missing ${JSON.stringify(Object.keys(cover).filter((k) => !cover[k]))}`);
}

// ---------- M: after each move (only once the module is there) ----------
if (fs.existsSync(path.join(HERE, '..', 'assets', 'js', 'pbip-bidi.js'))) {
  const Bidi = require('../assets/js/pbip-bidi.js'), px = fs.readFileSync(path.join(HERE, '..', 'assets', 'js', 'pbip-export.js'), 'utf8'), bd = fs.readFileSync(path.join(HERE, '..', 'assets', 'js', 'pbip-bidi.js'), 'utf8');
  const tg = fs.readFileSync(path.join(HERE, '..', 'assets', 'js', 'theme-generator.js'), 'utf8'), list = (tg.match(/const BUILDER = \[([^\]]*)\]/) || [])[1] || '', at = (f) => list.indexOf('/assets/js/' + f + '.min.js?v=');
  chk(() => Pbip.isolateFiles === Bidi.isolateFiles && !/function walkVisual|const daxTexts|WRAP_OPEN/.test(px) && /isolateFiles\(files, \[\], \{ all: true \}\)/.test(px) && /function isolateFiles\(files, names, o\)/.test(bd) && /root\.DAPbipBidi = api/.test(bd)
      && at('text-measure') >= 0 && at('pbip-bidi') > at('text-measure') && at('pbip-bidi') < at('pbip-export') && list.split('/assets/js/pbip-bidi.min.js?v=').length === 2,
    () => 'M1. pbip-export.js gives pbip-bidi.js\'s isolateFiles (one copy), calls it for an Arabic build, and BUILDER loads pbip-bidi once, after text-measure and before pbip-export');
}
if (there('lib/report-build.mjs')) {
  const rr = read('lib/report-run.mjs'), rb = read('lib/report-build.mjs');
  chk(() => /export function reportBuild\(/.test(rb) && /reportBuild\(/.test(rr) && !/Pbip\.build\(/.test(rr) && /Pbip\.build\(/.test(rb) && /Plans\.gate\(/.test(rr) && /if \(!building\) throw/.test(rr) && /writeTree\(/.test(rr)
      && !/Plans\.|writeTree|withPlan|writeFile|mkdirSync|fieldBinding\(/.test(rb),
    () => 'M2. report-build.mjs builds (Pbip.build), report-run.mjs keeps the gate, the binding, the mode boundary and the write; report-build.mjs writes nothing and touches no plan');
}
if (there('lib/plan-artifact.mjs')) {
  const pl = read('tools/plan_layout.mjs'), pa = read('lib/plan-artifact.mjs');
  chk(() => /export async function exactArtifact\(/.test(pa) && /export function bilingualOf\(/.test(pa) && !/function exactArtifact|function bilingualOf|reportRun/.test(pl) && /exactArtifact\(ab, planPin, a\.lang\)/.test(pl)
      && /Plans\.propose\(/.test(pl) && !/Plans\.|server|ctx\b|register/.test(pa),
    () => 'M3. plan-artifact.mjs builds and checks the exact artifact; plan_layout.mjs keeps registration and the one proposal, and passes no server context');
}

if (RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-sp43.mjs: the three files\' outputs recorded on the base (integration/0.3.2 4d97158; normalised: the plan id and the working folder)', runs: got }, null, 1) + '\n');
fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.2-sp43.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp43  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp43  ${checks} checks`);
