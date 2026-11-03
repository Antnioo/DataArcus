import './test-env.mjs';
// 0.3.2 SP13 (the split: B-280, B-286; mcp/work/SP13.md). A characterisation suite for the page buttons and the filter
// panels: for 9 runs of plan_layout, approve_plan and create_report, create_report's whole answer and every file it
// wrote are byte for byte the ones recorded on the base (integration/0.3.2 a57e094, before pbip-page.js's page buttons
// and filter panels moved to assets/js/pbip-navigation.js). The server's random ids come from one fixed seed
// (fixtures/sp1/seeded-random.mjs, SP1's); normalised: the plan id and the working folder (SP3's way). Recorded in
// fixtures/sp13-reports.json; SP13_RECORD=1 records them again (only on the base, never to make a run pass). Made-up
// models only: the twin-project and health-project fixtures and tiny models written here.
//   T1-T9  each run's answer and its written files;  C1  the runs cover the navigation paths (tabs, tabs on two rows and
//   their line, Power BI's navigator, single buttons right to left, a page with none, the Reset bookmark, a strip, the
//   slide-in panel, Arabic, both page sizes)
//   after the move: M1  pbip-page.js's write is the page assembly over pbip-navigation.js (which writes no file and
//   names no visual);  M2  theme-generator.js's BUILDER loads pbip-navigation once, right after pbip-tooltip
//   node test-0.3.2-sp13.mjs
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
const GOLD = path.join(HERE, 'fixtures', 'sp13-reports.json');

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp13-')));
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

// hand-placed pages (made up): n pages named by names, each a header (title and logo), a slicer slot and a table
const hand = (n, names, w, h, head, slicer, rtl) => names.slice(0, n).map((name) => ({ name, width: w, height: h, slots: [
  { kind: 'title', x: rtl ? w - 24 - Math.round(w * 0.3) : 24, y: 12, w: Math.round(w * 0.3), h: head }, { kind: 'logo', x: rtl ? 24 : w - 24 - 120, y: 12, w: 120, h: head },
  Object.assign({ kind: 'slicer' }, slicer), { kind: 'table', x: 24 + (slicer.x < 300 ? slicer.w + 24 : 0), y: head + 40, w: Math.round(w * 0.5), h: Math.round(h * 0.5) }] }));
const LONG = ['Regional sales overview', 'Product performance detail', 'Customer orders by month', 'Shipping and weights', 'Margins by product line', 'Prices and discounts', 'Targets and forecasts', 'Notes and definitions'];
const LONG_AR = ['نظرة عامة على المبيعات', 'أداء المنتجات بالتفصيل', 'طلبات العملاء حسب الشهر', 'الشحن والأوزان', 'الهوامش حسب خط المنتج', 'الأسعار والخصومات'];

// each run in its own folder (a fresh copy): EN and AR, glass (the default) and plain, 1920 x 1080 and 1280 x 720, the
// tiny model and the twin fixture; the rail at the start, the strip on top, the slide-in panel; hand-placed pages: many
// pages (tabs on two rows), a low header (Power BI's navigator; single buttons right to left), a small slicer slot
const CASES = [
  ['T1 EN glass 1920 x 1080, rail at the start, two pages', 'tiny1', () => tiny('tiny1'), { path: 'tiny1', name: 'SP13 EN glass', layout: 'analysis', kpis: 3, filters: 'start', planFields: EN, secondPage: true }],
  ['T2 EN plain 1280 x 720, strip on top', 'tiny2', () => tiny('tiny2'), { path: 'tiny2', name: 'SP13 EN plain', layout: 'exec', kpis: 3, filters: 'top', page: '1280x720', planFields: Object.assign({}, EN, { timeAxis: 'Calendar[Month]' }), design: PLAIN, secondPage: true }],
  ['T3 AR glass 1920 x 1080, slide-in panel, names approved', 'tiny3', () => tiny('tiny3'), { path: 'tiny3', name: 'SP13 AR glass', layout: 'analysis', kpis: 3, filters: 'start', lang: 'ar', displayNames: AR_NAMES, planFields: AR, secondPage: true, slidePanel: true }],
  ['T4 AR plain 1280 x 720, strip on top, names approved', 'tiny4', () => tiny('tiny4'), { path: 'tiny4', name: 'SP13 AR plain', layout: 'exec', kpis: 3, filters: 'top', page: '1280x720', lang: 'ar', displayNames: AR_NAMES, planFields: Object.assign({}, AR, { timeAxis: 'Calendar[Month Name]' }), design: PLAIN, secondPage: true }],
  ['T5 EN glass 1280 x 720 on the twin, slide-in panel', 'twin5', () => copy('twin-project', 'twin5'), { path: 'twin5', name: 'SP13 twin EN', layout: 'ops', kpis: 3, filters: 'end', page: '1280x720', secondPage: true, slidePanel: true }],
  ['T6 hand-placed, 8 pages, tabs on two rows', 'health6', () => copy('health-project', 'health6'), { path: 'health6', name: 'SP13 hand tabs', pages: hand(8, LONG, 1920, 1080, 96, { x: 24, y: 160, w: 300, h: 420 }) }],
  ['T7 hand-placed AR on the twin, 6 pages, a low header, a small slicer slot', 'twin7', () => copy('twin-project', 'twin7'), { path: 'twin7', name: 'SP13 hand AR', lang: 'ar', pages: hand(6, LONG_AR, 1280, 720, 30, { x: 24, y: 80, w: 60, h: 80 }) }],
  ['T8 hand-placed EN, 7 pages, a low header, a narrow strip', 'health8', () => copy('health-project', 'health8'), { path: 'health8', name: 'SP13 hand EN', pages: hand(7, LONG, 1280, 720, 30, { x: 700, y: 60, w: 240, h: 80 }) }],
  ['T9 hand-placed AR on the twin, 4 pages, a header too low for tabs: single buttons', 'twin9', () => copy('twin-project', 'twin9'), { path: 'twin9', name: 'SP13 hand AR buttons', lang: 'ar', pages: hand(4, ['المبيعات', 'المنتجات', 'العملاء', 'الشحن'], 1280, 720, 20, { x: 1036, y: 80, w: 220, h: 400 }, true) }]
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
if (process.env.SP13_DUMP) fs.writeFileSync(process.env.SP13_DUMP, JSON.stringify(got, null, 1));
const hash = (x) => (x ? { err: x.err, length: x.t.length, sha256: sha(x.t) } : null);
const now = Object.fromEntries(Object.entries(got).map(([k, v]) => [k, { plan: hash(v.plan), report: hash(v.report), files: { count: v.files.split('\n').length - 1, sha256: sha(v.files) } }]));
if (process.env.SP13_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-sp13.mjs: create_report\'s answers and the written files recorded on the base (normalised: the plan id, the working folder and the path separator)', runs: now }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).runs;
for (const [name] of CASES) chk(() => gold[name] && JSON.stringify(now[name]) === JSON.stringify(gold[name]),
  () => `${name.split(' ')[0]}. "${name.replace(/^T\d+ /, '')}": create_report's answer and the written files are the base's, byte for byte: now ${JSON.stringify(now[name])}, recorded ${JSON.stringify(gold[name] || null)} (SP13_DUMP=<file> writes them)`);

// the runs cover the page buttons' and the filter panels' paths: read from the written report pages (not tooltip pages)
const pagesOf = (dir) => tree(path.join(ROOT, dir)).filter((f) => /[\\/]pages[\\/][^\\/]+[\\/]page\.json$/.test(f)).map((f) => ({ f, j: JSON.parse(fs.readFileSync(f, 'utf8')) })).filter((p) => p.j.type !== 'Tooltip');
const visualsOf = (p) => { const d = path.join(path.dirname(p.f), 'visuals'); return fs.existsSync(d) ? fs.readdirSync(d).map((v) => JSON.parse(fs.readFileSync(path.join(d, v, 'visual.json'), 'utf8'))) : []; };
const pages = Object.fromEntries(CASES.map(([name, dir]) => [name.split(' ')[0], pagesOf(dir).map((p) => ({ w: p.j.width, name: p.j.displayName, vs: visualsOf(p) }))]));
const any = (fn) => Object.values(pages).some((ps) => ps.some(fn));
const link = (v, type) => { const l = ((v.visual || {}).visualContainerObjects || {}).visualLink; return !!(l && JSON.stringify(l).includes("'" + type + "'")); };
const has = (v, k, t) => String(JSON.stringify(((v.visual || {}).objects || {})[k])).includes(t);
const tabsOf = (p) => p.vs.filter((v) => link(v, 'PageNavigation') && has(v, 'fill', 'false'));
const COVER = {
  'page tabs': any((p) => tabsOf(p).length > 1),
  'tabs on two rows': any((p) => new Set(tabsOf(p).map((v) => v.position.y)).size === 2),
  'the tab line under the current page': any((p) => p.vs.some((v) => v.visual && v.visual.visualType === 'shape')),
  'Power BI\'s page navigator': any((p) => p.vs.some((v) => v.visual && v.visual.visualType === 'pageNavigator')),
  'single page buttons right to left': any((p) => p.vs.filter((v) => link(v, 'PageNavigation') && has(v, 'outline', 'true')).length > 1),
  'a Reset bookmark button': any((p) => p.vs.some((v) => link(v, 'Bookmark') && JSON.stringify(v).includes('enabledTooltip'))),
  'slicers side by side (a strip)': any((p) => { const ys = p.vs.filter((v) => v.visual && /slicer/i.test(v.visual.visualType) && !v.parentGroupName?.includes('panel')).map((v) => v.position.y); return ys.length > 1 && new Set(ys).size === 1; }),
  'the slide-in panel (a hidden group)': any((p) => p.vs.some((v) => v.isHidden && v.visualGroup)),
  'a page with no page buttons (told)': Object.values(got).some((v) => v.report && v.report.t.includes('"leftOutOn"')),
  'an Arabic page': any((p) => /[\u0600-\u06ff]/.test(p.name)),
  'both page sizes': any((p) => p.w === 1920) && any((p) => p.w === 1280)
};
chk(() => Object.values(COVER).every(Boolean) && Object.values(got).every((v) => v.report && !v.report.err),
  () => `C1. the runs cover the navigation paths: missing ${JSON.stringify(Object.keys(COVER).filter((k) => !COVER[k]))}; written ${Object.values(got).filter((v) => v.report && !v.report.err).length} of ${CASES.length}`);

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp13.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp13  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp13  ${checks} checks`);
