// 0.3.1 GL2 (the owner, 27 Oct, on the laptop run of GL1's lab: "tables are not cleared of alternate rows formating so
// the whole background still has a solid background"; mcp/work/GL2.md; written red first): under the glass look, tables
// (tableEx) and matrices (pivotTable) get no solid fill anywhere. Their cards have no transparency property
// (@microsoft/powerbi-core-visual-schema's capabilities), so each fill is a colour with alpha (#RRGGBBAA, Microsoft's
// report theme schema's colour pattern). Made-up models only, in a temp working folder: no employer or client data.
//   F   every fill of both types (values' rows, column and row headers, totals, subtotals) see-through: clear, or with
//       Chart style table "banded" a faint tint on the alternate rows; never a 6-digit (opaque) fill
//   G   the grid lines: the look's own colour, at least as visible as on the solid card, worst case
//   C   the contrast over the picture's darkest and lightest pixel: text on the band 4.5:1, the grid lines their
//       minimum, the band's transparency raised only as far as needed; every preset
//   S   Microsoft's colour pattern for every colour in the theme
//   N   the non-glass looks byte for byte the base engine's (every preset, light and dark, table auto/minimal/banded,
//       EN and AR); the glass theme unchanged outside tables and matrices
//   D   (the laptop of 27 Oct) the dark look's shadow stronger than GL1's, which barely showed on a dark page; light unchanged
//   L   the lab's report folder from create_report's answer on Windows (backslashes, a drive letter) and on Linux
//   W   through the tools (EN banded, AR dark): the report's theme carries the fills; Microsoft's validator 0 errors,
//       check_report 0 "can break"
//   node test-0.3.1-glass-tables.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const require = createRequire(import.meta.url);
const E = require('../assets/js/design-engine.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e).slice(0, 300) }; } };
const cut = (o) => (typeof o === 'string' ? o : JSON.stringify(o) || '').slice(0, 500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

const design = (preset, look, table, layout) => { const d = E.fresh(); d.preset = preset; d.data = E.PRESETS[preset].data.slice(); d.ui = Object.assign({}, E.PRESETS[preset].ui); d.chart = Object.assign({}, look ? { look } : {}, table ? { table } : {}); E.repairState(d); Object.assign(d.layout, layout || {}); return d; };
const card = (th, t, c) => (((((th || {}).visualStyles || {})[t] || {})['*'] || {})[c] || [])[0] || {};
const colourOf = (f) => f && f.solid && f.solid.color;
const CLEAR = /^#[0-9a-fA-F]{6}00$/, OPAQUE = /^#[0-9a-fA-F]{6}$/;
const alphaOf = (h) => parseInt(String(h).slice(7, 9), 16);
// every fill of a table or matrix (capabilities 0.1.3: each card's back colours)
const FILLS = { tableEx: [['values', 'backColor'], ['values', 'backColorPrimary'], ['values', 'backColorSecondary'], ['columnHeaders', 'backColor'], ['total', 'backColor']],
  pivotTable: [['values', 'backColor'], ['values', 'backColorPrimary'], ['values', 'backColorSecondary'], ['columnHeaders', 'backColor'], ['rowHeaders', 'backColor'], ['total', 'backColor'], ['subTotals', 'backColor'], ['rowTotal', 'backColor'], ['columnTotal', 'backColor']] };

// ---------- F, G: the fills and the grid, EN and AR, light and dark, every table style ----------
for (const [preset, mode] of [['Corporate', 'light'], ['DataArcus', 'dark']]) for (const table of ['auto', 'minimal', 'banded']) for (const lang of ['en', 'ar']) {
  const nm = `${mode} ${table} ${lang}`, d = design(preset, 'glass', table), th = get(() => E.buildTheme(d, lang)), g = get(() => E.glassLook(d)), tb = (g && g.table) || {};
  const wrong = [];
  Object.entries(FILLS).forEach(([t, list]) => list.forEach(([c, p]) => { const v = colourOf(card(th, t, c)[p]);
    const ok = table === 'banded' && c === 'values' && p === 'backColorSecondary' ? /^#[0-9a-fA-F]{8}$/.test(v || '') && alphaOf(v) > 0 && alphaOf(v) <= Math.round(0.08 * 255) : CLEAR.test(v || '');
    if (!ok) wrong.push(`${t}.${c}.${p}=${v}`); }));
  chk(() => !wrong.length, () => `F1-${nm}. every table and matrix fill see-through (clear; banded: the alternate rows a faint tint): wrong ${wrong.slice(0, 6).join(', ')}`);
  const opaque = ['tableEx', 'pivotTable'].flatMap((t) => Object.entries(((th.visualStyles || {})[t] || {})['*'] || {}).flatMap(([c, arr]) => Object.entries(arr[0] || {}).filter(([p, v]) => /back/i.test(p) && OPAQUE.test(colourOf(v) || '')).map(([p]) => `${t}.${c}.${p}`)));
  chk(() => th.visualStyles && !opaque.length, () => `F2-${nm}. no opaque fill on any table or matrix card: ${opaque.join(', ')}`);
  chk(() => ['tableEx', 'pivotTable'].every((t) => CLEAR.test(colourOf(card(th, t, 'values').backColorPrimary)) && colourOf(card(th, t, 'values').backColorPrimary).slice(0, 7) === d.ui.card),
    () => `F3-${nm}. the rows clear in the card's own colour ${d.ui.card}: ${cut(card(th, 'tableEx', 'values'))}`);
  chk(() => ['tableEx', 'pivotTable'].every((t) => { const gr = card(th, t, 'grid'); return colourOf(gr.gridHorizontalColor) === tb.grid && colourOf(gr.gridVerticalColor) === tb.grid && OPAQUE.test(tb.grid); }),
    () => `G1-${nm}. the grid lines in the look's colour ${tb.grid}: ${cut(card(th, 'tableEx', 'grid'))}`);
  chk(() => table === 'auto' ? !('gridHorizontal' in card(th, 'tableEx', 'grid')) : card(th, 'tableEx', 'grid').gridHorizontal === (table === 'minimal'), () => `G2-${nm}. the grid's on/off stays the table style's: ${cut(card(th, 'tableEx', 'grid'))}`);
  const ids = (g.checks || []).map((x) => x.id);
  chk(() => ids.includes('gridOnGlass') && (table === 'banded') === ids.includes('textOnBand') && (table === 'banded') === ids.includes('gridOnBand') && g.checks.every((x) => x.pass),
    () => `C1-${nm}. the table's worst cases listed and passing: ${cut(g.checks)}`);
}

// ---------- C: every preset, banded ----------
const over = (card0, p, t) => E.mix(p, card0, 1 - t / 100);
for (const preset of Object.keys(E.PRESETS)) {
  const d = design(preset, 'glass', 'banded'), g = get(() => E.glassLook(d)), tb = (g && g.table) || {}, u = E.colours(d).ui, R = E.roles(u);
  const ends = g.image ? [g.image.darkest, g.image.lightest] : [], bases = ends.map((p) => over(u.card, p, g.t)), bands = bases.map((b) => E.mix(b, u.accent, (tb.bandAlpha || 0) / 100));
  const min = E.contrast(R.grid, u.card), gridOk = (x) => x.every((b) => E.contrast(tb.grid, b) >= min - 0.005);
  chk(() => tb.grid && gridOk(bases) && gridOk(bands) && bands.every((b) => E.contrast(u.text, b) >= 4.5),
    () => `C2-${preset}. over the darkest and the lightest pixel: text on the band 4.5:1, the grid lines at least their solid ${min.toFixed(2)}:1: ${cut(tb)}`);
  chk(() => tb.bandAlpha >= 0 && tb.bandAlpha <= 8 && (tb.bandAlpha === 8 || (() => { const b2 = bases.map((b) => E.mix(b, u.accent, (tb.bandAlpha + 1) / 100)); return !(b2.every((b) => E.contrast(u.text, b) >= 4.5 + E.GLASS.margin) && gridOk(b2)); })()),
    () => `C3-${preset}. the band's transparency raised only as far as needed (alpha 8% asked): ${cut(tb)}`);
  chk(() => tb.band === u.accent + Math.round(tb.bandAlpha * 2.55).toString(16).padStart(2, '0'), () => `C4-${preset}. the band is the accent at its alpha: ${cut(tb)}`);
}
// a grid already darker than it needs: kept as roles gives it (the line is darkened only as far as needed)
chk(() => { const d = design('Corporate', 'glass'), g = E.glassLook(d), u = E.colours(d).ui; return g.table.grid !== E.roles(u).grid && E.contrast(g.table.grid, u.card) < E.contrast(u.text, u.card); },
  () => 'C5. the grid line darkened towards the text, never to the text itself');

// ---------- S: Microsoft's colour pattern (reportThemeSchema-2.159.json, definitions.color) ----------
const MS_COLOR = /^#[0-9a-fA-F]{8}$|^#(?:[0-9a-fA-F]{3}){1,2}$/;
for (const [preset, table] of [['Corporate', 'banded'], ['DataArcus', 'auto']]) {
  const th = E.buildTheme(design(preset, 'glass', table), 'en'), bad = [];
  const walk = (o, at) => { if (Array.isArray(o)) o.forEach((x, i) => walk(x, at + '/' + i)); else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => { if (k === 'color' && typeof v === 'string' && !MS_COLOR.test(v)) bad.push(at + '/' + k + '=' + v); walk(v, at + '/' + k); }); };
  walk(th.visualStyles, '');
  chk(() => !bad.length, () => `S1-${preset}. every colour in the theme matches Microsoft's colour pattern: ${bad.slice(0, 4).join(', ')}`);
}

// ---------- N: the non-glass looks byte for byte the base engine's ----------
const BASE_REF = process.env.GL2_BASE || 'cba24a5';
const base = get(() => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-gl2-base-')), f = path.join(dir, 'design-engine.js');
  fs.writeFileSync(f, execFileSync('git', ['show', `${BASE_REF}:assets/js/design-engine.js`], { cwd: path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), maxBuffer: 1 << 26 })); return require(f); });
chk(() => typeof base.buildTheme === 'function', () => `N0. the base engine (${BASE_REF}) loads: ${cut(base)}`);
if (typeof base.buildTheme === 'function') {
  const differ = [];
  const bdesign = (preset, look, table, layout) => { const d = base.fresh(); d.preset = preset; d.data = base.PRESETS[preset].data.slice(); d.ui = Object.assign({}, base.PRESETS[preset].ui); d.chart = Object.assign({}, look ? { look } : {}, table ? { table } : {}); base.repairState(d); Object.assign(d.layout, layout || {}); return d; };
  for (const preset of Object.keys(E.PRESETS)) for (const look of [null, 'auto']) for (const table of ['auto', 'minimal', 'banded']) for (const layout of [{}, { transparent: true }, { page: '1280x720', shadow: false }]) for (const lang of ['en', 'ar']) {
    if (JSON.stringify(E.buildTheme(design(preset, look, table, layout), lang)) !== JSON.stringify(base.buildTheme(bdesign(preset, look, table, layout), lang))) differ.push([preset, look, table, JSON.stringify(layout), lang].join(' '));
  }
  chk(() => !differ.length, () => `N1. every non-glass theme byte for byte the base's (presets x look none/auto x table x layouts x EN/AR): differ on ${differ.slice(0, 4).join('; ')}`);
  // (the dark shadow is D's, below: every dropShadow left out of this comparison)
  const strip = (th) => { const c = JSON.parse(JSON.stringify(th)); delete c.visualStyles.tableEx; delete c.visualStyles.pivotTable; Object.values(c.visualStyles).forEach((v) => Object.values(v).forEach((x) => { delete x.dropShadow; })); return JSON.stringify(c); };
  const glassDiffer = Object.keys(E.PRESETS).flatMap((preset) => ['auto', 'banded'].filter((table) => strip(E.buildTheme(design(preset, 'glass', table), 'en')) !== strip(base.buildTheme(bdesign(preset, 'glass', table), 'en'))).map((t) => preset + ' ' + t));
  chk(() => !glassDiffer.length, () => `N2. the glass theme unchanged outside tables and matrices: differs on ${glassDiffer.join(', ')}`);
  const keep = Object.keys(E.PRESETS).filter((preset) => { const a = E.glassLook(design(preset, 'glass')), b = base.glassLook(bdesign(preset, 'glass')); return a.t !== b.t || a.rim !== b.rim || a.labels !== b.labels || a.strength !== b.strength; });
  chk(() => !keep.length, () => `N3. the look's cards, rim, labels and picture unchanged: differ on ${keep.join(', ')}`);
  const shadows = (th) => JSON.stringify(Object.entries(th.visualStyles).map(([t, v]) => [t, (v['*'] || {}).dropShadow]));
  const lightDiffer = Object.keys(E.PRESETS).filter((preset) => E.glassLook(design(preset, 'glass')).mode === 'light' && shadows(E.buildTheme(design(preset, 'glass'), 'en')) !== shadows(base.buildTheme(bdesign(preset, 'glass'), 'en')));
  chk(() => !lightDiffer.length, () => `N4. a light glass theme's shadows unchanged: differ on ${lightDiffer.join(', ')}`);
}

// ---------- D: the dark shadow ----------
{ const g = E.glassLook(design('DataArcus', 'glass')), gl = E.glassLook(design('Corporate', 'glass')), th = E.buildTheme(design('DataArcus', 'glass'), 'en'), sh = card(th, 'barChart', 'dropShadow');
  chk(() => g.mode === 'dark' && g.shadow.transparency < 55 && g.shadow.blur >= 18 && g.shadow.distance >= 4 && (g.shadow.transparency < 55 && (g.shadow.blur > 18 || g.shadow.distance > 4)),
    () => `D1. the dark look's shadow stronger than GL1's 55 / 18 / 4 (less transparent, wider or further): ${cut(g.shadow)}`);
  chk(() => sh.show === true && sh.transparency === g.shadow.transparency && sh.shadowBlur === g.shadow.blur && sh.shadowDistance === g.shadow.distance, () => `D2. the dark theme writes it on every visual: ${cut(sh)}`);
  chk(() => JSON.stringify(gl.shadow) === '{"transparency":85,"blur":18,"distance":4}', () => `D3. the light look's shadow as GL1 shipped it: ${cut(gl.shadow)}`); }

// ---------- L: the lab's paths on Windows and Linux ----------
const Lab = await import('./lab/glass-lab.mjs').catch((e) => ({ threw: String(e && e.message || e) }));
chk(() => Lab.reportDirOf('C:\\DataArcus\\tests\\glass-lab', 'glass\\Glass EN light.pbip', 'Glass EN light', path.win32) === 'C:\\DataArcus\\tests\\glass-lab\\glass\\Glass EN light.Report'
  && Lab.pbipOf('C:\\DataArcus\\tests\\glass-lab', 'glass\\Glass EN light.pbip', path.win32) === 'C:\\DataArcus\\tests\\glass-lab\\glass\\Glass EN light.pbip',
  () => `L1. on Windows (create_report answers "glass\\Glass EN light.pbip"): the report folder keeps "glass": ${cut(Lab.threw || Lab.reportDirOf('C:\\DataArcus\\tests\\glass-lab', 'glass\\Glass EN light.pbip', 'Glass EN light', path.win32))}`);
chk(() => Lab.reportDirOf('/tmp/lab', 'glass/Glass AR dark.pbip', 'Glass AR dark', path.posix) === '/tmp/lab/glass/Glass AR dark.Report' && Lab.pbipOf('/tmp/lab', 'glass/Glass AR dark.pbip', path.posix) === '/tmp/lab/glass/Glass AR dark.pbip',
  () => 'L2. on Linux and macOS the same folder');

// ---------- W: through the tools ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-gl2-')));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
const bim = path.join(ROOT, 'shop/Shop.SemanticModel/model.bim'); fs.mkdirSync(path.dirname(bim), { recursive: true });
fs.writeFileSync(bim, JSON.stringify({ compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Date', 'dateTime')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime', { isKey: true }), col('Month Name', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64')] }],
  relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } }));
const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Orders]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]', category2: 'Sales[Channel]', table: ['Sales[Region]', 'Sales[Total Sales]'], slicers: ['Sales[Channel]'] };
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const req = (url, body) => new Promise((resolve) => { if (!url) { resolve(''); return; } const u = new URL(url), r = http.request(u, { method: body ? 'POST' : 'GET', headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); }); r.on('error', () => resolve('')); if (body) r.write(body); r.end(); });
const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
try {
  for (const [nm, lang, mode, table] of [['EN light banded', 'en', 'light', 'banded'], ['AR dark', 'ar', 'dark', 'auto']]) {
    const gt = await s.call('generate_theme', { chart: { look: 'glass', table }, mode, lang }), d = (gt.j || {}).design;
    chk(() => !gt.err && d && d.chart.look === 'glass', () => `W0-${nm}. generate_theme makes the glass design: ${cut(gt.t)}`);
    if (!d) continue;
    const args = { path: 'shop/Shop.SemanticModel', lang, layout: 'exec', filters: 'top', secondPage: true, name: 'Glass ' + nm };
    const pl = await s.call('plan_layout', Object.assign({ design: d, planFields: FIELDS }, args)), id = pl.j && pl.j.plan && pl.j.plan.planId;
    chk(() => !!id, () => `W1-${nm}. plan_layout makes a plan: ${pl.t.slice(0, 300)}`);
    if (!id) continue;
    const n = links().length; await s.call('approve_plan', { planId: id });
    for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50);
    await req(links()[n], 'decision=approve'); await s.call('approve_plan', { planId: id });
    const r = await s.call('create_report', Object.assign({ planId: id, design: pl.j.design, fields: FIELDS }, args));
    chk(() => !r.err, () => `W2-${nm}. create_report writes the report: ${r.t.slice(0, 300)}`);
    if (r.err) continue;
    const RES = path.join(ROOT, 'shop', 'Glass ' + nm + '.Report', 'StaticResources/RegisteredResources');
    const theme = fs.readdirSync(RES).filter((f) => /\.json$/.test(f)).map((f) => rd(path.join(RES, f)))[0];
    chk(() => theme && ['tableEx', 'pivotTable'].every((t) => CLEAR.test(colourOf(card(theme, t, 'values').backColorPrimary)) && CLEAR.test(colourOf(card(theme, t, 'columnHeaders').backColor))),
      () => `W3-${nm}. the report's theme carries the clear fills: ${cut(theme && card(theme, 'tableEx', 'values'))}`);
    const c = await s.call('check_report', { path: r.j.open }), cj = c.j || {};
    chk(() => !c.err && cj.validator && cj.validator.ran && cj.validator.errors === 0 && cj.impact.kinds.canBreak.count === 0,
      () => `W4-${nm}. Microsoft's validator 0 errors and check_report 0 "can break": ${cut(c.err ? c.t : { v: cj.validator, f: (cj.findings || []).filter((f) => f.impact === 'canBreak' || f.severity === 'error').slice(0, 4) })}`);
  }
} finally {
  await s.close();
  try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* the OS cleans its temp folder */ }
}
if (problems.length) { console.log(`FAIL script=test-0.3.1-glass-tables.mjs cause=${problems[0].slice(0, 160).replace(/\s+/g, ' ')}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  glass-tables  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  glass-tables  ${checks} checks`);
process.exit(0);
