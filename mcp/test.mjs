// End-to-end test of the DataArcus MCP server: starts it over stdio like an agent would and calls every tool.
// Runs on copies of the fixtures in a temporary folder, so nothing in the repo changes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mcp-'));
fs.cpSync(path.join(REPO, 'scripts/tests/fixtures/bridge-project'), path.join(ROOT, 'tmdl-project'), { recursive: true });
fs.cpSync(path.join(HERE, 'fixtures/health-project'), path.join(ROOT, 'bim-project'), { recursive: true });
fs.copyFileSync(path.join(REPO, 'assets/data/model-health-sample.pbit'), path.join(ROOT, 'sample.pbit'));
// a TMDL project with DAX tables, saved by Power BI Desktop: their column types are not in the files
fs.cpSync(path.join(REPO, 'scripts/tests/fixtures/model-health/tmdl-ramadan/definition'), path.join(ROOT, 'dax-project/Ramadan Test.SemanticModel/definition'), { recursive: true });
// the same model as Desktop exported it (.pbit): its DataModelSchema has every column type, like the open model does
const pbitSchema = (file) => {
  const buf = fs.readFileSync(file);
  let e = buf.length - 22; while (buf.readUInt32LE(e) !== 0x06054b50) e--;
  let p = buf.readUInt32LE(e + 16);
  for (let n = buf.readUInt16LE(e + 10); n > 0; n--) {
    const size = buf.readUInt32LE(p + 20), nlen = buf.readUInt16LE(p + 28), lho = buf.readUInt32LE(p + 42);
    if (buf.toString('utf8', p + 46, p + 46 + nlen) === 'DataModelSchema') {
      const start = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28), raw = buf.subarray(start, start + size);
      const d = buf.readUInt16LE(p + 10) === 8 ? zlib.inflateRawSync(raw) : raw;
      return JSON.parse(new TextDecoder('utf-16le').decode(d[0] === 0xff && d[1] === 0xfe ? d.subarray(2) : d));
    }
    p += 46 + nlen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
  }
};
const ramadan = pbitSchema(path.join(REPO, 'scripts/tests/fixtures/model-health/tmdl-ramadan/Ramadan Test.pbit'));
fs.writeFileSync(path.join(ROOT, 'ramadan.bim'), JSON.stringify(ramadan));

const problems = []; let checks = 0;
const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
const client = new Client({ name: 'test', version: '1' });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(HERE, 'server.mjs')], env: { ...process.env, DATAARCUS_ROOT: ROOT }, stderr: 'ignore' }));
const call = async (name, args) => { const r = await client.callTool({ name, arguments: args }); const t = r.content[0].text; return { err: !!r.isError, t, j: r.isError ? null : JSON.parse(t) }; };
const hash = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');

const tools = (await client.listTools()).tools.map((t) => t.name).sort();
check(tools.join() === 'check_model_health,create_report,generate_theme,plan_layout,read_model,suggest_fields', `tools: ${tools}`);

// read_model: a TMDL project, automatic date tables left out
let r = await call('read_model', { path: 'tmdl-project' });
check(!r.err && r.j.tables.map((t) => t.table).join() === 'Calendar,Customer,Sales', `read_model tables: ${r.err ? r.t : r.j.tables.map((t) => t.table)}`);
check(!r.err && r.j.tables.find((t) => t.table === 'Calendar').dateTable, 'read_model: Calendar not marked as the date table');

r = await call('read_model', { path: 'bim-project' });
check(!r.err && r.j.existingReports.join() === 'Health Test Report', `existing reports: ${r.err ? r.t : r.j.existingReports}`);

// suggest_fields: base measures first, three different slicers
r = await call('suggest_fields', { path: 'tmdl-project', kpis: 3 });
check(!r.err && r.j.kpis[0].m === 'Total Sales' && r.j.date.c === 'Month Name', `suggest_fields: ${r.t.slice(0, 200)}`);
const sl = r.err ? [] : r.j.slicers.filter(Boolean).map((s) => s.t + s.c);
check(sl.length === 3 && new Set(sl).size === 3, `suggest_fields slicers: ${sl}`);

// check_model_health: a .pbit and a TMDL project saved by Desktop (no .pbit needed) both give a score and findings
r = await call('check_model_health', { path: 'sample.pbit' });
check(!r.err && r.j.score.overall > 0 && r.j.findings.length > 3 && r.j.reportRead, `health on .pbit: ${r.t.slice(0, 200)}`);
r = await call('check_model_health', { path: 'tmdl-project' });
check(!r.err && r.j.score.overall > 0 && r.j.stats.tables === 3 && r.j.stats.autoDateTables === 1 && r.j.stats.measures === 4 && r.j.findings.some((f) => f.id === 'AUTODATE'),
  `health on TMDL: ${r.t.slice(0, 200)}`);
check(!r.err && !r.j.skipped, `health on TMDL with every type known: nothing should be skipped: ${r.err ? r.t : JSON.stringify(r.j.skipped)}`);
// columns of DAX tables: the checks that need their type are listed as skipped, with the ways to get them, never guessed
r = await call('check_model_health', { path: 'dax-project' });
const sk = r.err || !r.j.skipped ? [] : r.j.skipped.checks.map((s) => s.id);
check(!r.err && ['DATE_NOT_MARKED', 'SUMMARIZE_KEYS'].every((id) => sk.includes(id)) && !r.j.findings.some((f) => f.id === 'STRING_KEYS' || f.id === 'DATE_NOT_MARKED'),
  `health on DAX tables: skipped ${sk}, findings ${r.err ? r.t.slice(0, 200) : r.j.findings.map((f) => f.id)}`);
check(!r.err && r.j.skipped && /types/i.test(r.j.skipped.why) && r.j.skipped.getThem.length === 2 && /Export > Power BI template/.test(r.j.skipped.getThem[0]),
  `health on DAX tables: why and how to get the skipped checks: ${r.err ? '' : String(JSON.stringify(r.j.skipped)).slice(0, 300)}`);

// columnTypes (read from the open model): the skipped checks run, and the result is exactly the fully typed model's
const want = await call('check_model_health', { path: 'ramadan.bim' });
const typesOf = (form) => Object.fromEntries(ramadan.model.tables.flatMap((t) => t.columns.filter((c) => c.type !== 'rowNumber')
  .map((c) => [`${t.name}[${c.name}]`, form === 'name' ? c.dataType : form === 'number' ? { string: 2, int64: 6, double: 8, dateTime: 9, decimal: 10, boolean: 11 }[c.dataType] : String({ string: 2, int64: 6, double: 8, dateTime: 9, decimal: 10, boolean: 11 }[c.dataType])])));
const same = (a, b) => JSON.stringify([a.score, a.stats, a.findings]) === JSON.stringify([b.score, b.stats, b.findings]);
for (const form of ['name', 'number', 'number as text']) {
  r = await call('check_model_health', { path: 'dax-project', maxItems: 200, columnTypes: typesOf(form) });
  const ct = r.err ? {} : r.j.columnTypes || {};
  check(!want.err && !r.err && same(r.j, { ...want.j }) && !r.j.skipped, `columnTypes as ${form}: not the same as the typed model: ${r.err ? r.t.slice(0, 200) : `score ${JSON.stringify(r.j.score)} vs ${JSON.stringify(want.j && want.j.score)}, skipped ${!!r.j.skipped}`}`);
  check(ct.applied === 36 && !(ct.alreadyTyped || []).length && !(ct.notInModel || []).length && !(ct.badType || []).length, `columnTypes as ${form}: report ${JSON.stringify(ct)}`);
}
// names that match no column and types that can't be used are listed back; quoted table names and any case match
r = await call('check_model_health', { path: 'dax-project', columnTypes: { "'calendar'[DATE]": 9, 'Nope[X]': 'string', 'Calendar[Year]': 1, 'Calendar[Month Name]': 'text', 'Calendar[Day]': '19' } });
const ct = r.err ? {} : r.j.columnTypes || {};
check(ct.applied === 1 && JSON.stringify(ct.notInModel) === '["Nope[X]"]' && JSON.stringify((ct.badType || []).map((b) => b.column).sort()) === '["Calendar[Day]","Calendar[Month Name]","Calendar[Year]"]',
  `columnTypes with bad names and types: ${r.err ? r.t.slice(0, 200) : JSON.stringify(ct)}`);
// a type the files already give is never replaced, and is listed back
const plain = await call('check_model_health', { path: 'tmdl-project' });
r = await call('check_model_health', { path: 'tmdl-project', columnTypes: { 'Sales[Amount]': 'string', 'Calendar[Date]': 'dateTime' } });
check(!r.err && JSON.stringify(r.j.columnTypes && r.j.columnTypes.alreadyTyped) === '["Sales[Amount]","Calendar[Date]"]' && r.j.columnTypes.applied === 0 && same(r.j, plain.j),
  `columnTypes for typed columns: ${r.err ? r.t.slice(0, 200) : JSON.stringify(r.j.columnTypes)}`);

// nothing outside the DataArcus folder
r = await call('read_model', { path: '../' });
check(r.err && /outside the allowed folder/.test(r.t), 'a path outside the folder was read');

// create_report: next to the model, never over an existing report, every field in the model
const bim = path.join(ROOT, 'bim-project/Health Test.SemanticModel/model.bim'), before = hash(bim);
const page = { name: 'Overview', width: 1280, height: 720, slots: [
  { kind: 'title', x: 24, y: 16, w: 600, h: 48 }, { kind: 'kpi', x: 24, y: 80, w: 300, h: 110 }, { kind: 'kpi', x: 340, y: 80, w: 300, h: 110 },
  { kind: 'line', title: 'Trend', x: 24, y: 210, w: 800, h: 480 }, { kind: 'table', title: 'Detail', x: 840, y: 210, w: 416, h: 480 }] };
r = await call('create_report', { path: 'bim-project', name: 'Health Test Report', pages: [page] });
check(!r.err && r.j.report === 'Health Test Report - New design.Report', `create_report name: ${r.t.slice(0, 200)}`);
const r2 = await call('create_report', { path: 'bim-project', name: 'Health Test Report', pages: [page] });
check(!r2.err && r2.j.report === 'Health Test Report - New design 2.Report', `create_report second name: ${r2.t.slice(0, 200)}`);
check(hash(bim) === before, 'create_report changed the model');
if (!r.err) {
  const dir = path.join(ROOT, 'bim-project', r.j.report);
  const pbir = JSON.parse(fs.readFileSync(path.join(dir, 'definition.pbir'), 'utf8'));
  check(pbir.datasetReference.byPath.path === '../Health Test.SemanticModel', `pbir: ${JSON.stringify(pbir.datasetReference)}`);
  const model = JSON.parse(fs.readFileSync(bim, 'utf8')).model.tables;
  const has = (k, t, n) => model.some((x) => x.name === t && (k === 'Measure' ? x.measures || [] : x.columns).some((c) => c.name === n));
  const refs = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name === 'visual.json') JSON.stringify(JSON.parse(fs.readFileSync(f, 'utf8')), (k, v) => { if (v && (v.Column || v.Measure) && (v.Column || v.Measure).Expression) refs.push([v.Column ? 'Column' : 'Measure', (v.Column || v.Measure).Expression.SourceRef.Entity, (v.Column || v.Measure).Property]); return v; }); });
  walk(dir);
  check(refs.length >= 4, `create_report bound only ${refs.length} fields`);
  // with no background given, the page background is fully transparent (the theme's page colour shows)
  const { PNG } = (await import('node:module')).createRequire(import.meta.url)('pngjs');   // the MCP's own dev dependency
  const bg = fs.readdirSync(path.join(dir, 'StaticResources/RegisteredResources')).filter((f) => f.endsWith('.png'));
  check(bg.length && bg.every((f) => PNG.sync.read(fs.readFileSync(path.join(dir, 'StaticResources/RegisteredResources', f))).data.every((v, i) => i % 4 !== 3 || v === 0)), `background not transparent: ${bg}`);
  const bad = refs.filter(([k, t, n]) => !has(k, t, n));
  check(!bad.length, `fields not in the model: ${bad.map((b) => b.join(' ')).join(', ')}`);
}
// a dark theme: the report's title and panes take the theme's colours, not the light defaults
fs.writeFileSync(path.join(ROOT, 'dark.json'), JSON.stringify({ name: 'Dark', foreground: '#f8fafc', background: '#1a1f2e', tableAccent: '#00d4ff',
  visualStyles: { page: { '*': { background: [{ color: { solid: { color: '#0a0f1c' } }, transparency: 0 }] } } } }));
r = await call('create_report', { path: 'bim-project', name: 'Dark Test', theme: 'dark.json', pages: [page] });
if (!r.err) {
  const titles = []; const walkT = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walkT(f); else if (e.name === 'visual.json') { const t = fs.readFileSync(f, 'utf8'); if (/"textRuns"/.test(t) && /Dark Test/.test(t)) titles.push(t); } });
  walkT(path.join(ROOT, 'bim-project', r.j.report));
  check(titles.length && titles.every((t) => /#f8fafc/i.test(t) && !/#1f2937/i.test(t)), 'dark theme: the title does not use the theme text colour');
} else check(false, `dark theme report: ${r.t}`);
r = await call('create_report', { path: 'sample.pbit', name: 'X', pages: [page] });
check(r.err && /project folder/.test(r.t), 'create_report accepted a .pbit');

// ---------- design tools: the website's design engine, byte for byte ----------
// The design fixtures (captured from the Theme Generator page), read here directly so the MCP needs none of the
// website's test packages: a blob starting with "=" is kept as it is, any other is compact JSON to pretty-print.
const FIX = JSON.parse(fs.readFileSync(path.join(REPO, 'scripts/tests/fixtures/design-engine/cases.json'), 'utf8'));
const blob = (h) => { const v = FIX.blobs[h]; return v == null ? null : v[0] === '=' ? v.slice(1) : JSON.stringify(JSON.parse(v), null, 2); };
const DESIGNS = FIX.cases.map((c) => Object.assign({}, c, { theme: blob(c.theme) }));
const E = (await import('node:module')).createRequire(import.meta.url)('../assets/js/design-engine.js');
const tryCall = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e.message), j: null }; } };
check(DESIGNS.length === 54, `design fixtures: ${DESIGNS.length}`);

// generate_theme: every fixture's saved design, given through the tool's own inputs, writes the website's theme JSON
// byte for byte, under the website's file name (the PNG's name without -background-<layout>.png, plus .json)
const themeInput = (c) => { const s = c.state, l = s.layout; return { name: s.name, palette: { data: s.data, ui: s.ui }, font: s.font, ...(s.chart ? { chart: s.chart } : {}),
  layout: { page: l.page === 'custom' ? { w: l.pageW, h: l.pageH } : l.page, radius: l.radius, shadow: l.shadow, transparent: l.transparent, ...(l.dir ? { dir: l.dir } : {}) },
  lang: c.lang, folder: `themes/${c.id}` }; };
let themeOk = 0; const themeBad = [];
for (const c of DESIGNS) {
  r = await tryCall('generate_theme', themeInput(c));
  const want = path.join(ROOT, 'themes', c.id, c.file.replace(/-background-(exec|analysis|ops|focus)\.png$/, '.json'));
  const ok = !r.err && r.j.path === want && fs.existsSync(want) && fs.readFileSync(want, 'utf8') === c.theme && !r.j.repaired.length;
  if (ok) themeOk++; else themeBad.push(`${c.id}: ${r.err ? r.t.slice(0, 120) : `path ${r.j.path}, same JSON ${fs.existsSync(want) && fs.readFileSync(want, 'utf8') === c.theme}, repaired ${JSON.stringify(r.j.repaired).slice(0, 120)}`}`);
}
check(themeOk === DESIGNS.length, `generate_theme parity: ${themeOk} of ${DESIGNS.length}; ${themeBad.slice(0, 3).join(' | ')}`);
// a second theme with the same name gets a free file name; nothing outside the DataArcus folder
r = await tryCall('generate_theme', { name: 'Same Name' }); const r2t = await tryCall('generate_theme', { name: 'Same Name' });
check(!r.err && !r2t.err && path.basename(r.j.path) === 'same-name.json' && path.basename(r2t.j.path) === 'same-name-2.json', `generate_theme free names: ${r.t.slice(0, 100)} / ${r2t.t.slice(0, 100)}`);
r = await tryCall('generate_theme', { name: 'X', folder: '../outside' });
check(r.err && /outside the allowed folder/.test(r.t), `generate_theme wrote outside the folder: ${r.t.slice(0, 100)}`);
// values that can't be used are listed with what was used instead, never guessed
r = await tryCall('generate_theme', { name: 'Bad', palette: { data: ['#112233', 'red', '#445566', '#778899', '#aabbcc', '#ddeeff', '#123456', '#654321'], ui: { background: '#ffffff', card: 'white', text: '#111111', accent: '#0f4c5c' } },
  font: 'Comic Sans MS', chart: { legend: 'Middle' }, preset: 'Nope' });
const rep = r.err ? [] : r.j.repaired.map((x) => x.field);
check(!r.err && ['palette.data[1]', 'palette.ui.card', 'palette.ui.good', 'palette.ui.neutral', 'palette.ui.bad', 'font', 'chart.legend', 'preset'].every((f) => rep.includes(f)) && r.j.design.font === 'Segoe UI',
  `generate_theme repaired: ${r.err ? r.t.slice(0, 150) : JSON.stringify(rep)}`);
r = await tryCall('generate_theme', { name: 'Bad Harmony', brand: '#0f4c5c', harmony: 'rainbow' });
check(!r.err && r.j.repaired.some((x) => x.field === 'harmony'), `generate_theme bad harmony: ${r.t.slice(0, 150)}`);
// brand + each harmony: the engine's generate(), with the first colour as the table accent, as on the website
for (const h of ['analogous', 'complementary', 'triadic', 'mono']) {
  r = await tryCall('generate_theme', { name: 'Brand ' + h, brand: '#0F4C5C', harmony: h });
  check(!r.err && JSON.stringify(r.j.design.data) === JSON.stringify(E.generate('#0f4c5c', h)) && r.j.design.ui.accent === r.j.design.data[0], `generate_theme brand ${h}: ${r.t.slice(0, 150)}`);
}
// font sizes stay within Power BI's 8-60 on the biggest and smallest pages
for (const [w, h] of [[3840, 2160], [640, 360]]) {
  r = await tryCall('generate_theme', { name: `Size ${w}`, layout: { page: { w, h } } });
  const sizes = []; if (!r.err) JSON.stringify(JSON.parse(fs.readFileSync(r.j.path, 'utf8')), (k, v) => { if ((k === 'fontSize' || k === 'textSize') && typeof v === 'number') sizes.push(v); return v; });
  check(!r.err && sizes.length && sizes.every((s) => s >= 8 && s <= 60), `generate_theme ${w}x${h} font sizes: ${r.err ? r.t.slice(0, 100) : sizes}`);
}
// no layout, or only part of one: the engine's current defaults (1920 x 1080 and its text sizes), never an old save's
const themeSizes = (file) => { const s = new Set(); JSON.stringify(JSON.parse(fs.readFileSync(file, 'utf8')), (k, v) => { if ((k === 'fontSize' || k === 'textSize') && typeof v === 'number') s.add(v); return v; }); return [...s].sort((a, b) => a - b).join(); };
for (const [tag, extra] of [['no layout', {}], ['only radius', { layout: { radius: 4 } }]]) {
  r = await tryCall('generate_theme', Object.assign({ name: 'Default ' + tag }, extra));
  check(!r.err && JSON.stringify(r.j.page) === '{"w":1920,"h":1080}' && r.j.design.layout.page === '1920x1080' && themeSizes(r.j.path) === '15,18,27,42' && (!extra.layout || r.j.design.layout.radius === 4),
    `generate_theme ${tag}: page ${r.err ? r.t.slice(0, 100) : JSON.stringify(r.j.page) + ', text sizes ' + themeSizes(r.j.path)}`);
}
// the contrast checks come back, with a warning for each one that fails
r = await tryCall('generate_theme', { name: 'Low Contrast', palette: { data: Array(8).fill('#eeeeee'), ui: { background: '#ffffff', card: '#ffffff', text: '#cccccc', accent: '#0f4c5c' } } });
check(!r.err && r.j.contrast.checks.length === 4 && r.j.contrast.checks.some((x) => !x.pass) && r.j.warnings.some((w) => /Text on visuals/.test(w)) && r.j.contrast.weak.length === 8,
  `generate_theme contrast: ${r.t.slice(0, 200)}`);

// plan_layout: every fixture's saved design gives the website's slot table exactly (names in the case's language,
// right-to-left mirrored, custom sizes fitted as the website does)
let slotOk = 0; const slotBad = [];
for (const c of DESIGNS) {
  r = await tryCall('plan_layout', { design: c.state, lang: c.lang });
  const rows = r.err ? null : r.j.slots.map((s) => [s.role, s.visual, s.x, s.y, s.w, s.h].map(String));
  if (rows && JSON.stringify(rows) === JSON.stringify(c.slots)) slotOk++;
  else slotBad.push(`${c.id}: ${r.err ? r.t.slice(0, 120) : JSON.stringify(rows).slice(0, 160) + ' vs ' + JSON.stringify(c.slots).slice(0, 160)}`);
}
check(slotOk === DESIGNS.length, `plan_layout parity: ${slotOk} of ${DESIGNS.length}; ${slotBad.slice(0, 3).join(' | ')}`);
// the tool's own choices override the design's: analysis, filters at the end, right to left, Arabic, 3 KPIs, 1920 x 1080
r = await tryCall('plan_layout', { layout: 'analysis', filters: 'end', dir: 'rtl', lang: 'ar', kpis: 3, page: '1920x1080' });
const ps = r.err ? [] : r.j.slots, at = (role) => ps.find((s) => s.role === role) || {};
check(!r.err && JSON.stringify(r.j.page) === '{"w":1920,"h":1080}' && ps.length === 8 && at('الفلاتر').x === 24 && at('الفلاتر').w === 294 && at('مؤشر 1').x === 1388 && at('مؤشر 3').x === 336
  && at('جدول التفاصيل').h === 442 && r.j.design.layout.preset === 'analysis' && r.j.design.layout.fpos === 'end', `plan_layout choices: ${r.t.slice(0, 250)}`);
check(!r.err && r.j.why.length === 3 && r.j.why.every((w) => /[؀-ۿ]/.test(w)), `plan_layout reasons in Arabic: ${r.err ? '' : JSON.stringify(r.j.why)}`);
// forAuthoring: the PBIR visual.json position (x, y, z, width, height, tabOrder), in reading order (top to bottom, then
// along the reading direction), z and tabOrder 1000, 2000..., the same numbers as the slots
const fa = r.err ? [] : r.j.forAuthoring, order = ps.slice().sort((a, b) => (a.y - b.y) || (b.x - a.x));
check(fa.length > 0 && fa.length === ps.length && fa.every((v, i) => v.role === order[i].role && v.position.x === order[i].x && v.position.y === order[i].y && v.position.width === order[i].w
  && v.position.height === order[i].h && v.position.z === (i + 1) * 1000 && v.position.tabOrder === (i + 1) * 1000), `plan_layout forAuthoring: ${JSON.stringify(fa).slice(0, 250)}`);
// no filters, no header, left to right: fewer slots, the first KPI at the left margin
r = await tryCall('plan_layout', { layout: 'exec', filters: 'none', header: false, dir: 'ltr', kpis: 6 });
check(!r.err && r.j.slots.length === 10 && !r.j.slots.some((s) => s.kind === 'title' || s.kind === 'slicer') && r.j.slots.find((s) => s.role === 'KPI 1').x === 24, `plan_layout no header: ${r.t.slice(0, 200)}`);
// a custom size outside the limits is fitted, and says so
r = await tryCall('plan_layout', { page: { w: 9999, h: 100 } });
check(!r.err && JSON.stringify(r.j.page) === '{"w":3840,"h":1600}' && JSON.stringify(r.j.fitted) === '{"asked":{"w":9999,"h":100}}', `plan_layout fitted: ${r.t.slice(0, 200)}`);
// a design with only part of a layout (no version, no page) is the current kind, not an old save: 1920 x 1080
for (const [tag, dz] of [['partial layout', { name: 'P', layout: { preset: 'analysis' } }], ['no layout', { name: 'P' }]]) {
  r = await tryCall('plan_layout', { design: dz });
  check(!r.err && JSON.stringify(r.j.page) === '{"w":1920,"h":1080}' && r.j.design.layout.preset === (dz.layout ? 'analysis' : 'exec'), `plan_layout ${tag}: ${r.err ? r.t.slice(0, 100) : JSON.stringify(r.j.page) + ' ' + r.j.design.layout.preset}`);
}
// ---------- create_report with a design: the website's project pages, positions exactly as planned ----------
// a written report read back: its visible pages in order, each with its size and every visual's absolute box (a visual in
// a group stores its position relative to the group), type, hidden flag and text
const readReport = (dir) => {
  const D = path.join(dir, 'definition'), order = JSON.parse(fs.readFileSync(path.join(D, 'pages/pages.json'), 'utf8')).pageOrder;
  return order.map((id) => {
    const P = path.join(D, 'pages', id), pj = JSON.parse(fs.readFileSync(path.join(P, 'page.json'), 'utf8')), vs = {};
    const vdir = path.join(P, 'visuals');
    if (fs.existsSync(vdir)) fs.readdirSync(vdir).forEach((n) => { const t = fs.readFileSync(path.join(vdir, n, 'visual.json'), 'utf8'), v = JSON.parse(t); vs[v.name] = { v, t }; });
    const abs = (v) => { const p = v.position, g = v.parentGroupName && vs[v.parentGroupName] ? abs(vs[v.parentGroupName].v) : { x: 0, y: 0 }; return { x: p.x + g.x, y: p.y + g.y }; };
    const visuals = Object.values(vs).map(({ v, t }) => Object.assign(abs(v), { w: v.position.width, h: v.position.height, type: v.visual ? v.visual.visualType : 'group', hidden: !!v.isHidden, text: t }));
    return { name: pj.displayName, w: pj.width, h: pj.height, hidden: pj.visibility === 'HiddenInViewMode', visuals };
  });
};
const bimModel = JSON.parse(fs.readFileSync(path.join(ROOT, 'bim-project/Health Test.SemanticModel/model.bim'), 'utf8')).model.tables;
const boundFields = (dir) => { const refs = []; const w = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) w(f); else if (e.name === 'visual.json') JSON.stringify(JSON.parse(fs.readFileSync(f, 'utf8')), (k, v) => { if (v && (v.Column || v.Measure) && (v.Column || v.Measure).Expression && (v.Column || v.Measure).Expression.SourceRef.Entity) refs.push([v.Column ? 'Column' : 'Measure', (v.Column || v.Measure).Expression.SourceRef.Entity, (v.Column || v.Measure).Property]); return v; }); }); w(dir); return refs; };
const inModel = ([k, t, n]) => bimModel.some((x) => x.name === t && (k === 'Measure' ? x.measures || [] : x.columns).some((c) => c.name === n));
const slotsPlaced = (pages, want) => {   // every slot except the filter rail has a visual at exactly its box; slicers sit in the rail
  const bad = [];
  want.forEach((wp, i) => {
    const got = pages[i] || { visuals: [] };
    if (got.name !== wp.name || got.w !== wp.page.w || got.h !== wp.page.h) bad.push(`page ${i + 1}: ${got.name} ${got.w}x${got.h}, want ${wp.name} ${wp.page.w}x${wp.page.h}`);
    wp.slots.forEach((s) => {
      if (s.rail) { const sl = got.visuals.filter((v) => v.type === 'slicer'); if (!sl.length || sl.some((v) => v.x < s.x || v.y < s.y || v.x + v.w > s.x + s.w || v.y + v.h > s.y + s.h)) bad.push(`page ${i + 1}: slicers not inside the rail ${JSON.stringify(s)}`); }
      else if (!got.visuals.some((v) => v.type !== 'group' && v.x === s.x && v.y === s.y && v.w === s.w && v.h === s.h)) bad.push(`page ${i + 1}: nothing at ${s.title} ${s.x},${s.y} ${s.w}x${s.h}`);
    });
  });
  return bad;
};
const gs = await tryCall('generate_theme', { name: 'Gulf Sales', brand: '#0F4C5C', harmony: 'analogous', lang: 'ar', font: 'Tahoma', folder: 'themes/cr' });
const gp = gs.err ? gs : await tryCall('plan_layout', { design: gs.j.design, layout: 'analysis', filters: 'end', lang: 'ar' });
r = gp.err ? gp : await tryCall('create_report', { path: 'bim-project', name: 'Gulf Sales', design: gp.j.design, lang: 'ar' });
if (!r.err) {
  const dir = path.join(ROOT, 'bim-project', r.j.report), pages = readReport(dir), want = E.projectPages(gp.j.design.layout, 'ar', { second: true, panel: false });
  const shown = pages.filter((p) => !p.hidden), bad = slotsPlaced(shown, want);
  check(shown.length === 2 && pages.length === 3 && !bad.length, `create_report design: ${shown.length} pages; ${bad.slice(0, 4).join(' | ')}`);
  check(shown[0].visuals.some((v) => v.x === 1388 && v.w === 508) && JSON.stringify(shown.map((p) => p.name)) === '["تحليل","نظرة عامة"]', 'create_report design: not mirrored or page names not Arabic');
  // the Arabic labels from the engine
  const all1 = shown.map((p) => p.visuals.map((v) => v.text).join('')).join('');
  check(all1.includes('إعادة ضبط الفلاتر') && all1.includes('شعارك') && !all1.includes('Reset filters'), 'create_report design: the report labels are not Arabic');
  // the registered theme is the design's theme exactly, with nothing changed (its visuals are already solid)
  const themeFiles = fs.readdirSync(path.join(dir, 'StaticResources/RegisteredResources')).filter((f) => f.endsWith('-theme.json'));
  check(themeFiles.length === 1 && fs.readFileSync(path.join(dir, 'StaticResources/RegisteredResources', themeFiles[0]), 'utf8') === JSON.stringify(E.buildTheme(gp.j.design, 'ar'), null, 2) && !r.j.themeChanged,
    `create_report design: registered theme ${themeFiles} is not the design's theme; themeChanged ${JSON.stringify(r.j.themeChanged)}`);
  const refs = boundFields(dir);
  check(refs.length >= 4 && refs.every(inModel), `create_report design: fields not in the model: ${refs.filter((x) => !inModel(x)).map((x) => x.join(' '))}`);
} else check(false, `create_report design: ${r.t.slice(0, 200)}`);
// one page, and filters as a slide-in panel: a hidden group at the panel's box, the page without the rail
r = gp.err ? gp : await tryCall('create_report', { path: 'bim-project', name: 'Gulf Panel', design: gp.j.design, lang: 'ar', secondPage: false, slidePanel: true });
if (!r.err) {
  const pages = readReport(path.join(ROOT, 'bim-project', r.j.report)).filter((p) => !p.hidden), want = E.projectPages(gp.j.design.layout, 'ar', { second: false, panel: true });
  const panel = want[0].panel, bad = slotsPlaced(pages, want);
  check(pages.length === 1 && !bad.length && panel && pages[0].visuals.some((v) => v.type === 'group' && v.hidden && v.x === panel.x && v.y === panel.y && v.w === panel.w && v.h === panel.h),
    `create_report slide-in panel: ${pages.length} pages, panel ${JSON.stringify(panel)}; ${bad.slice(0, 3).join(' | ')}`);
} else check(false, `create_report slide-in panel: ${r.t.slice(0, 200)}`);
// a design with transparent visuals: the report's theme has solid visuals (no background panels yet), and says so
const gt2 = await tryCall('generate_theme', { name: 'See Through', layout: { transparent: true }, folder: 'themes/cr' });
r = gt2.err ? gt2 : await tryCall('create_report', { path: 'bim-project', name: 'See Through', design: gt2.j.design });
if (!r.err) {
  const dir = path.join(ROOT, 'bim-project', r.j.report), f = fs.readdirSync(path.join(dir, 'StaticResources/RegisteredResources')).find((x) => x.endsWith('-theme.json'));
  const th = JSON.parse(fs.readFileSync(path.join(dir, 'StaticResources/RegisteredResources', f), 'utf8'));
  check(th.visualStyles['*']['*'].background[0].show === true && r.j.themeChanged && /transparent/i.test(JSON.stringify(r.j.themeChanged)), `create_report transparent: ${JSON.stringify(r.j.themeChanged)}`);
} else check(false, `create_report transparent: ${r.t.slice(0, 200)}`);
// text sizes within 8-60 on the biggest and smallest pages
for (const [w, h] of [[3840, 2160], [640, 360]]) {
  const g = await tryCall('generate_theme', { name: `Report ${w}`, layout: { page: { w, h } }, folder: 'themes/cr' });
  r = g.err ? g : await tryCall('create_report', { path: 'bim-project', name: `Report ${w}`, design: g.j.design });
  const sizes = [];
  if (!r.err) { const dir = path.join(ROOT, 'bim-project', r.j.report, 'StaticResources/RegisteredResources'); JSON.stringify(JSON.parse(fs.readFileSync(path.join(dir, fs.readdirSync(dir).find((x) => x.endsWith('-theme.json'))), 'utf8')), (k, v) => { if ((k === 'fontSize' || k === 'textSize') && typeof v === 'number') sizes.push(v); return v; }); }
  check(!r.err && sizes.length && sizes.every((s) => s >= 8 && s <= 60) && readReport(path.join(ROOT, 'bim-project', r.j.report))[0].w === w, `create_report ${w}x${h}: ${r.err ? r.t.slice(0, 120) : sizes}`);
}
// pages or a design, never both or neither
r = await tryCall('create_report', { path: 'bim-project', name: 'Both', pages: [page], design: gp.err ? {} : gp.j.design });
check(r.err && /pages or a design/.test(r.t), `create_report with both: ${r.t.slice(0, 120)}`);
r = await tryCall('create_report', { path: 'bim-project', name: 'Neither' });
check(r.err && /pages or a design/.test(r.t), `create_report with neither: ${r.t.slice(0, 120)}`);

// a design from generate_theme passes straight through: same colours, same page, positions for that page
const gt = await tryCall('generate_theme', { name: 'Chain', brand: '#0f4c5c', harmony: 'analogous', layout: { page: '1280x720' } });
r = gt.err ? gt : await tryCall('plan_layout', { design: gt.j.design, layout: 'ops' });
check(!r.err && JSON.stringify(r.j.page) === '{"w":1280,"h":720}' && JSON.stringify(r.j.design.data) === JSON.stringify(gt.j.design.data) && r.j.slots.filter((s) => s.kind === 'kpi').length === 6,
  `plan_layout after generate_theme: ${r.t.slice(0, 200)}`);

await client.close();
fs.rmSync(ROOT, { recursive: true, force: true });
console.log(problems.length ? `FAIL  mcp  ${checks} checks\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  mcp  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
