import './test-env.mjs';
// 0.3.2 FN1F (the ratchet on functions over 150 lines: D-1104-13; mcp/work/FN1F.md). A characterisation suite recorded
// on the base (integration/0.3.2 4bc74921) before three functions became named steps: field-suggest.js rank,
// report-build.mjs reportBuild, svg-kpi-compiler.js compile. Made-up inputs only (fixtures/fn1f-cases.mjs: a seeded
// generator and hand-made edges; a tiny sales model written here). Each answer compared by sha256 and length, recorded
// in fixtures/fn1f-pins.json; FN1F_RECORD=1 records them again (only on the base, never to make a run pass).
//   S1  the compiler: 426 designs (every layer kind, bound or not, mirrored, tagged, the value kinds, columns, bad
//       inputs), each design's toDax, toMeasure (plain, card, table), toImageUrl (tagged with five value sets, plain)
//       and compile's own answer, design by design
//   R1  the picker's rank: 260 made-up models (calendars of every shape, gross and net, variants, period measures,
//       shares, aliases, Arabic names) with their option sets (cards, language, relationships, counts, pins, excluded
//       columns, flags, full values), and 19 small edge models (one per rule a generated model never sat on the edge
//       of: a score's weight, a name with ], a cycle, aliases, self differences, the count limits, Arabic twins, the
//       notes' caps), rank's choices and notes and suggest's binding, model by model
//   B1  reportBuild through reportRun's build: 56 runs (designs and hand-placed pages, themes, logos, the gallery, SVG
//       columns and cards, the scripts, refusals), every file and value, then the build's finish (the write and its
//       answer with every note, in the made-up folder) and every written file, run by run
//   C1  the corpora reach the rules they pin (every layer kind and value kind; refusals and builds; notes of every kind)
//   node test-0.3.2-fn1f.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { svgDesigns, rankCases, rankEdges, buildRuns } from './fixtures/fn1f-cases.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(typeof t === 'string' ? Buffer.from(t, 'utf8') : Buffer.from(t)).digest('hex');
const pin = (t) => sha(t).slice(0, 20) + ':' + Buffer.byteLength(String(t), 'utf8');
const GOLD = path.join(HERE, 'fixtures', 'fn1f-pins.json');
const RECORD = process.env.FN1F_RECORD === '1';
const gold = RECORD ? { S: {}, R: {}, B: {} } : JSON.parse(fs.readFileSync(GOLD, 'utf8'));
const got = { S: {}, R: {}, B: {} };
const J = (x) => JSON.stringify(x === undefined ? null : x);
const tryJ = (f) => { try { return J(f()); } catch (e) { return 'threw: ' + String(e && e.message || e); } };
// a part's cases, compared one by one; the first few that differ are named
const part = (key, label) => { const bad = Object.keys(got[key]).filter((k) => got[key][k] !== (gold[key] || {})[k]), missing = Object.keys(gold[key] || {}).filter((k) => !(k in got[key]));
  chk(() => RECORD || (!bad.length && !missing.length), () => `${label}: ${bad.length} of ${Object.keys(got[key]).length} answers differ from the base (${bad.slice(0, 8).join(', ')})${missing.length ? `; ${missing.length} recorded cases not made (${missing.slice(0, 4).join(', ')})` : ''}`); };
const seen = { layers: new Set(), values: new Set(), notes: new Set(), refused: 0, built: 0, wrote: 0, svgErrors: 0 };

// ---------- S: the SVG KPI compiler ----------
const Svg = require('../assets/js/svg-kpi-compiler.js');
const series = { Sales: [3, null, -2, 7, 7, 1e6, 0.5, null, 4, 2, 9, 1], Target: [1, 2, 0, 5, null, 3], 'Sales LY': [2, 2, 2], Base: [1, 2, 3] };
const columns = { "'Geo'[Region]": 'North <&> "x"', "'Sales'[Units]": '42', "'T'[C]": '7' };
for (const [id, d, sets] of svgDesigns()) {
  (d.layers || []).forEach((l) => seen.layers.add(l.type)); (d.values || []).forEach((v) => seen.values.add(v.kind));
  const c = tryJ(() => { const k = Svg.compile(d, { tag: true }); if (k.errors.length) seen.svgErrors++; return [k.vars.map((v) => [v.name, v.comment]), k.hideIf, k.errors, k.name]; });
  const out = [c, tryJ(() => Svg.toDax(d)), tryJ(() => Svg.toMeasure(d)), tryJ(() => Svg.toMeasure(d, { context: 'card' })), tryJ(() => Svg.toMeasure(d, { context: 'table' })),
    tryJ(() => sets.map((v) => Svg.toImageUrl(d, v, { tag: true, series, columns }))), tryJ(() => Svg.toImageUrl(d, sets[0]))].join('\n');
  got.S[id] = pin(out);
}
part('S', 'S1. the compiler\'s answers for 426 designs');

// ---------- R: the field picker's rank ----------
const Bind = require('../assets/js/pbip-bind.js'), Sug = require('../assets/js/field-suggest.js');
for (const [id, json, nKpis, opt] of rankCases().concat(rankEdges())) {
  const tables = Bind.fromTmsl(JSON.parse(JSON.stringify(json))).filter((t) => !/^(LocalDateTable_|DateTableTemplate_)/.test(t.name)), rels = Bind.relsOfTmsl(json);
  const r = tryJ(() => { const x = Sug.rank(tables, nKpis, opt(tables, rels)); Object.keys(x.notes || {}).forEach((k) => seen.notes.add(k)); return x; });
  got.R[id] = pin(r + '\n' + tryJ(() => Bind.suggest(tables, nKpis, opt(tables, rels))));
}
part('R', 'R1. rank\'s choices and notes (and suggest\'s binding) for 260 models and 19 edge models');

// ---------- B: reportBuild, through reportRun's build (in process) ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fn1f-')));
process.env.DATAARCUS_ROOT = ROOT;
const RealDate = Date, FIXED = new RealDate(2026, 10, 6, 9, 30, 0).getTime();
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(FIXED); } static now() { return FIXED; } };
await import(pathToFileURL(path.join(HERE, 'fixtures', 'sp1', 'seeded-random.mjs')).href);
// the tiny model (made up, sp43's): sales by region and month, an Arabic column, a ratio for the status icons
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const bim = { compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Cost', 'double'), col('Region', 'string'), col('المنطقة', 'string'), col('Product', 'string'), col('Date', 'dateTime')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' },
      { name: 'Margin', expression: 'SUM ( Sales[Amount] ) - SUM ( Sales[Cost] )', formatString: '#,0' },
      { name: 'Fill Rate', expression: 'DIVIDE ( SUM ( Sales[Cost] ), SUM ( Sales[Amount] ) )', formatString: '0.0%' },
      { name: 'Avg Price', expression: 'DIVIDE ( SUM ( Sales[Amount] ), COUNTROWS ( Sales ) )' }] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [Object.assign(col('Date', 'dateTime'), { isKey: true }), Object.assign(col('Month Name', 'string'), { sortByColumn: 'Month Number' }), col('Month Number', 'int64')] }],
  relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } };
const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Margin]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]', category2: 'Sales[Product]', table: ['Sales[Region]', 'Sales[Product]', 'Sales[Total Sales]', 'Sales[Avg Price]'] };
const HAND = [{ name: 'Hand', width: 1280, height: 720, slots: [{ kind: 'title', x: 24, y: 12, w: 600, h: 40 }, { kind: 'kpi', x: 24, y: 70, w: 300, h: 120 }, { kind: 'kpi', x: 340, y: 70, w: 300, h: 120 },
  { kind: 'text', x: 656, y: 70, w: 600, h: 120 }, { kind: 'bar', x: 24, y: 210, w: 600, h: 300 }, { kind: 'table', x: 640, y: 210, w: 616, h: 300 }] }];
const D = require('../assets/js/design-engine.js');
const { reportRun } = await import('./lib/report-run.mjs'), { withLookDefaults } = await import('./lib/report-inputs.mjs'), { planLayout } = await import('./lib/design.mjs');
const designOf = (o) => planLayout(Object.assign({ lang: 'en' }, o)).design;
const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const pngOf = (w, h) => new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, ...u32(w), ...u32(h), 8, 6, 0, 0, 0, 0, 0, 0, 0]);
const jpgOf = (w, h) => new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0, 17, 8, h >> 8, h & 255, w >> 8, w & 255, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1, 0, 0, 0]);
const titles = (layout, lang) => D.projectPages(designOf({ layout, lang }).layout, lang, {}).flatMap((p) => p.slots.map((x) => x.title)).filter(Boolean);
const RUNS = buildRuns(designOf, FIELDS, HAND, titles);
// the model variants (made up): no measures, nothing to count (one date column), one ID column to count, one text column only, no date, seven measures and a table related to nothing
const variant = (k) => { const b = JSON.parse(JSON.stringify(bim)), [sales] = b.model.tables;
  if (k === 'none') sales.measures = [];
  if (k === 'empty') { b.model.tables = [{ name: 'Days', partitions: mp('Days'), columns: [col('Day', 'dateTime')] }]; b.model.relationships = []; }
  if (k === 'one') { b.model.tables = [{ name: 'Orders', partitions: mp('Orders'), columns: [col('Order Id', 'string'), col('Region', 'string')] }]; b.model.relationships = []; }
  if (k === 'bare') { b.model.tables = [{ name: 'Notes', partitions: mp('Notes'), columns: [col('Note', 'string')] }]; b.model.relationships = []; }
  if (k === 'nodate') { sales.columns = sales.columns.filter((x) => x.name !== 'Date'); b.model.tables = [sales]; b.model.relationships = []; }
  if (k === 'big') { sales.measures.push({ name: 'Cost Total', expression: 'SUM ( Sales[Cost] )', formatString: '#,0' }, { name: 'Products', expression: 'DISTINCTCOUNT ( Sales[Product] )', formatString: '#,0' });
    b.model.tables.push({ name: 'Other', partitions: mp('Other'), columns: [col('Value', 'double')], measures: [{ name: 'Other Total', expression: 'SUM ( Other[Value] )', formatString: '#,0' }] }); }
  return b; };
const { sampleFiles } = await import('./lib/sample-project.mjs');
for (const [, a] of RUNS) {
  const dir = a.path.split('/')[0];
  if (a.model === 'sample') { sampleFiles(dir).forEach((f) => { fs.mkdirSync(path.dirname(path.join(ROOT, f.path)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f.path), f.data); }); continue; }
  fs.mkdirSync(path.join(ROOT, dir, 'Tiny.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'Tiny.SemanticModel/model.bim'), JSON.stringify(a.model ? variant(a.model) : bim)); }
fs.writeFileSync(path.join(ROOT, 't5', 'logo.png'), pngOf(400, 100));
fs.writeFileSync(path.join(ROOT, 't10', 'logo.jpg'), jpgOf(100, 300));
fs.writeFileSync(path.join(ROOT, 't17', 'logo.gif'), Buffer.from('GIF89a'));
fs.writeFileSync(path.join(ROOT, 't6', 'bg.png'), pngOf(1280, 900));
fs.writeFileSync(path.join(ROOT, 't6', 'theme.json'), JSON.stringify({ name: 'Theirs', visualStyles: { tableEx: { '*': { values: [{ fontSize: 12 }] } } } }));
fs.writeFileSync(path.join(ROOT, 't7', 'theme.json'), JSON.stringify(D.buildTheme(designOf({ layout: 'exec', page: { w: 2560, h: 1453 } }), 'en')));
fs.writeFileSync(path.join(ROOT, 'u10', 'logo.jpeg'), jpgOf(400, 100));
fs.writeFileSync(path.join(ROOT, 'u11', 'logo.png'), pngOf(100, 150));
fs.writeFileSync(path.join(ROOT, 'u18', 'theme.json'), JSON.stringify(D.buildTheme(designOf({ layout: 'exec' }), 'en')));
fs.writeFileSync(path.join(ROOT, 'u19', 'theme.json'), JSON.stringify({ name: 'Plain' }));
const norm = (t) => [ROOT, JSON.stringify(ROOT).slice(1, -1), ROOT.split(path.sep).join('/')].reduce((s, r) => s.split(r).join('<ROOT>'), String(t)).replace(/plan-[0-9a-f]{12}/g, 'plan-<id>').split('\\\\').join('/');
const listOf = (files) => files.map((f) => f.path + '\0' + (typeof f.data === 'string' ? sha(norm(f.data)) : sha(f.data))).join('\n');
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const filesOf = (dir) => tree(dir).map((f) => { const b = fs.readFileSync(f), t = b.includes(0) ? null : b.toString('utf8');
  return path.relative(dir, f).split(path.sep).join('/') + '\0' + (t != null && norm(t) !== t ? sha(norm(t)) : sha(b)) + '\n'; }).sort().join('');
const valuesOf = (b) => JSON.stringify(Object.fromEntries(Object.entries(b).filter(([k, v]) => typeof v !== 'function' && k !== 'm' && k !== 'files')));
for (const [id, given, mode] of RUNS) {
  let out; const a = Object.assign({}, given); delete a.model;
  try { const b = reportRun(withLookDefaults(a), mode || 'build'); out = listOf(b.files) + '\n' + norm(valuesOf(b)); seen.built++;
    // the write and its answer (every note reportBuild gives: create_report's finish, on the made-up folder)
    let ans; try { ans = J(b.finish('plan-000000000000')); seen.wrote++; } catch (e) { ans = 'threw: ' + String(e && e.message || e); }
    out += '\n' + norm(ans) + '\n' + filesOf(path.join(ROOT, a.path)); } catch (e) { out = 'threw: ' + norm(String(e && e.message || e)); seen.refused++; }
  got.B[id] = pin(out);
}
part('B', 'B1. reportBuild\'s files and values for 56 runs');

// ---------- C: the corpora reach what they pin ----------
chk(() => ['rect', 'circle', 'line', 'text', 'ring', 'arrow', 'spark', 'hexagon'].every((k) => seen.layers.has(k)) && ['measure', 'column', 'ratio', 'diff', 'pct', 'mystery'].every((k) => seen.values.has(k)) && seen.svgErrors > 10,
  () => `C1. the designs must hold every layer kind and value kind and some errors: ${[...seen.layers]} / ${[...seen.values]} / ${seen.svgErrors}`);
chk(() => ['language', 'noCategory', 'excluded', 'axisBy', 'calendarNames', 'formatsMixed', 'calendarSwaps', 'noRelatedCalendar', 'slicerPool', 'catPool', 'skipped', 'why', 'statsNotInModel'].every((k) => seen.notes.has(k)),
  () => `C1. the models must raise every note of rank: ${[...seen.notes].join(', ')}`);
chk(() => seen.built >= 10 && seen.wrote === seen.built && seen.refused >= 6, () => `C1. the runs must build, write and refuse: ${seen.built} built, ${seen.wrote} written, ${seen.refused} refused`);

fs.rmSync(ROOT, { recursive: true, force: true });
if (RECORD) { fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n'); console.log(`recorded ${GOLD}`); }
if (problems.length) { console.log(`FAIL script=test-0.3.2-fn1f.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  fn1f  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  fn1f  ${checks} checks`);
