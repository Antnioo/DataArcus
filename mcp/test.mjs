// End-to-end test of the DataArcus MCP server: starts it over stdio like an agent would and calls every tool.
// Runs on copies of the fixtures in a temporary folder, so nothing in the repo changes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { layoutProblems, phoneTextProblems, navProblems, sortProblems, headerProblems, tooltipMeasures, tooltipProblems, tooltipPageProblems, tableProblems, cardStyleProblems, projectProblems, panelProblems } from '../scripts/tests/report-check.mjs';

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

// round 2: sort order and number formats come with ready TMDL scripts (fixes), never applied by the tool
{
  const dcol = (name, dataType) => ({ name, dataType, sourceColumn: name, lineageTag: 'tag-' + name }), mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"Date"}, {}) in Source' } }];
  fs.writeFileSync(path.join(ROOT, 'sort.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
    { name: 'Calendar', columns: [dcol('Date', 'dateTime'), dcol('Month Name', 'string'), dcol('Month Number', 'int64'), dcol('Day Name', 'string'), dcol('Hijri Month Name', 'string')], partitions: mp('Calendar') },
    { name: 'Sales', columns: [dcol('Date', 'dateTime'), dcol('Amount', 'double'), dcol('Qty', 'int64')], partitions: mp('Sales'),
      measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )' }, { name: 'Units', expression: 'SUM ( Sales[Qty] )' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )' },
        { name: 'Margin %', expression: 'DIVIDE ( [Total Sales] - 1, [Total Sales] )' }, { name: 'Has Format', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Return Rate', expression: 'DIVIDE ( 1, 2 )', formatString: '0.00' }] }],
    relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } }));
  const plainRun = await call('check_model_health', { path: 'sort.bim' });
  const fx = plainRun.err ? {} : plainRun.j.fixes || {}, ms = fx.MONTH_SORT || {}, nf = fx.NO_FORMAT || {}, pf = fx.PCT_FORMAT || {};
  check(!plainRun.err && /sortByColumn: 'Month Number'/.test(ms.fixScript || '') && /WEEKDAY \( 'Calendar'\[Date\], 1 \)/.test(ms.fixScript || '') && ms.weekStart === 'sunday' && /TMDL view/.test(String(ms.howToApply))
    && (ms.byHand || []).length === 1 && ms.byHand[0].column === 'Calendar[Hijri Month Name]', `health fixes, sort: ${plainRun.err ? plainRun.t.slice(0, 200) : JSON.stringify(ms).slice(0, 500)}`);
  check(JSON.stringify((nf.suggested || []).map((x) => [x.measure, x.format])) === JSON.stringify([['[Total Sales]', '#,0.00'], ['[Units]', '#,0'], ['[Orders]', '#,0'], ['[Margin %]', '0.0%']]) && (nf.suggested || []).every((x) => x.reason)
    && !/Has Format|Return Rate/.test(nf.fixScript || '') && /never applied/i.test(String(nf.howToApply)), `health fixes, formats: ${JSON.stringify(nf).slice(0, 500)}`);
  check((pf.suggested || []).length === 1 && pf.suggested[0].measure === '[Return Rate]' && pf.suggested[0].format === '0.0%', `health fixes, a rate formatted as a number: ${JSON.stringify(pf).slice(0, 300)}`);
  // the week start is a choice: Monday (the UAE's Saturday-Sunday weekend) and Saturday change the weekday expression only
  for (const [ws, want] of [['monday', "WEEKDAY ( 'Calendar'[Date], 2 )"], ['saturday', "MOD ( WEEKDAY ( 'Calendar'[Date], 1 ), 7 ) + 1"]]) {
    const o = await call('check_model_health', { path: 'sort.bim', weekStart: ws });
    const a = String(((o.j || {}).fixes || {}).MONTH_SORT ? o.j.fixes.MONTH_SORT.fixScript : '').split('\n'), b = String(ms.fixScript || '').split('\n'), diff = a.filter((l, i) => l !== b[i]);
    check(!o.err && a.length === b.length && diff.length === 1 && diff[0].trim() === want && o.j.fixes.MONTH_SORT.weekStart === ws, `health fixes, week starting ${ws}: ${o.err ? o.t.slice(0, 200) : JSON.stringify(diff).slice(0, 200)}`);
    check(!o.err && JSON.stringify([o.j.score, o.j.findings]) === JSON.stringify([plainRun.j.score, plainRun.j.findings]), `health fixes, week starting ${ws}: the score or the findings moved`);
  }
  // a DAX table's columns are never rewritten by a script: steps by hand, naming the sort column
  const dx = await call('check_model_health', { path: 'dax-project', maxItems: 200 });
  const dms = dx.err ? {} : (dx.j.fixes || {}).MONTH_SORT || {};
  const skippedSort = dx.err ? [] : (((dx.j.skipped || {}).checks || []).find((c) => c.id === 'MONTH_SORT') || {}).items || [];
  check(!dx.err && !dms.fixScript && (dms.byHand || []).some((h) => h.column === 'Calendar[Month Name]' && /Sort by column > Month Number/.test(h.steps)) && (dms.byHand || []).some((h) => h.column === 'Calendar[Day Name]' && /Sort by column > Day of Week/.test(h.steps)),
    `health fixes on DAX tables: ${dx.err ? dx.t.slice(0, 200) : JSON.stringify(dms).slice(0, 400)} (skipped: ${skippedSort.length})`);
  // the report writer's rule for the sort column and the health check's are the same
  const req = (await import('node:module')).createRequire(import.meta.url), Bn = req('../assets/js/pbip-bind.js'), Tm = req('../assets/js/model-health-tmdl.js');
  const colsM = ['Date', 'Month', 'Month Number', 'Month No', 'Month Name', 'Month Short', 'Year Month', 'Year Month Sort', 'Month Year', 'Day of Week', 'Weekday', 'Day Name', 'Hijri Month Number', 'Hijri Month Name', 'Fiscal Month Number', 'Fiscal Month Name', 'Quarter', 'اسم الشهر', 'رقم الشهر', 'اسم اليوم', 'رقم اليوم'];
  const mismatch = [];
  for (const dataType of ['unknown', 'int64', 'string']) for (const n of colsM) { const cs = colsM.map((x) => ({ name: x, dataType: /name|short|اسم/i.test(x) ? 'string' : dataType }));
    const a = (Bn.sortColumnFor(cs, n) || {}).name, b = typeof Tm.sortColumnFor === 'function' ? (Tm.sortColumnFor(cs, n) || {}).name : 'no function'; if (a !== b) mismatch.push(`${n} (${dataType}): ${a} vs ${b}`); }
  check(!mismatch.length, `sort column rule differs between the report writer and the health check: ${mismatch.slice(0, 4).join(' | ')}`);
}

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
      // (round 1: a header text box, the title or "Your logo", may start lower in its slot so its text is centred in the
      // header: the same x, width and bottom edge)
      else if (!got.visuals.some((v) => v.type !== 'group' && v.x === s.x && v.w === s.w && (v.y === s.y && v.h === s.h || ((s.kind === 'title' || s.kind === 'logo') && v.type === 'textbox' && v.y > s.y && v.y + v.h === s.y + s.h)))) bad.push(`page ${i + 1}: nothing at ${s.title} ${s.x},${s.y} ${s.w}x${s.h}`);
    });
  });
  return bad;
};
const gs = await tryCall('generate_theme', { name: 'Gulf Sales', brand: '#0F4C5C', harmony: 'analogous', lang: 'ar', font: 'Tahoma', folder: 'themes/cr' });
const gp = gs.err ? gs : await tryCall('plan_layout', { design: gs.j.design, layout: 'analysis', filters: 'end', lang: 'ar' });
r = gp.err ? gp : await tryCall('create_report', { path: 'bim-project', name: 'Gulf Sales', design: gp.j.design, lang: 'ar' });
if (!r.err) {
  // (round 4, owner 2026-10-03: this model has 2 measures a card can show, so every page has 2 KPI cards, not the
  // design's 3 and 4 with the extra ones empty)
  const dir = path.join(ROOT, 'bim-project', r.j.report), pages = readReport(dir), want = E.projectPages(Object.assign({}, gp.j.design.layout, { kpiCards: 2 }), 'ar', { second: true, panel: false });
  const shown = pages.filter((p) => !p.hidden), bad = slotsPlaced(shown, want);
  // (round 1: the model has a month column, so the report has two tooltip pages: by category and the monthly trend)
  check(shown.length === 2 && pages.length === 4 && !bad.length, `create_report design: ${shown.length} pages; ${bad.slice(0, 4).join(' | ')}`);
  // (round 4: the first of 2 cards, on the right half; it was the first of 3, at 1388, 508 wide)
  const k1 = want[0].slots.find((s) => s.kind === 'kpi');
  check(k1.x === 1125 && k1.w === 771 && shown[0].visuals.some((v) => v.x === k1.x && v.w === k1.w) && JSON.stringify(shown.map((p) => p.name)) === '["تحليل","نظرة عامة"]', `create_report design: not mirrored or page names not Arabic (first KPI slot ${k1.x}, ${k1.w})`);
  // the Arabic labels from the engine
  const all1 = shown.map((p) => p.visuals.map((v) => v.text).join('')).join('');
  check(all1.includes('إعادة ضبط الفلاتر') && all1.includes('شعارك') && !all1.includes('Reset filters'), 'create_report design: the report labels are not Arabic');
  // the registered theme is the design's theme exactly, with nothing changed (its visuals are already solid) but its
  // name: inside a project the theme carries the name report.json references, its file name (Microsoft's theming
  // reference and validator; owner's decision 2026-10-01, round 0 change 7)
  const themeFiles = fs.readdirSync(path.join(dir, 'StaticResources/RegisteredResources')).filter((f) => f.endsWith('-theme.json'));
  check(themeFiles.length === 1 && fs.readFileSync(path.join(dir, 'StaticResources/RegisteredResources', themeFiles[0]), 'utf8') === JSON.stringify(Object.assign({}, E.buildTheme(gp.j.design, 'ar'), { name: themeFiles[0] }), null, 2) && !r.j.themeChanged,
    `create_report design: registered theme ${themeFiles} is not the design's theme; themeChanged ${JSON.stringify(r.j.themeChanged)}`);
  const refs = boundFields(dir);
  check(refs.length >= 4 && refs.every(inModel), `create_report design: fields not in the model: ${refs.filter((x) => !inModel(x)).map((x) => x.join(' '))}`);
} else check(false, `create_report design: ${r.t.slice(0, 200)}`);
// one page, and filters as a slide-in panel: a hidden group at the panel's box, the page without the rail
r = gp.err ? gp : await tryCall('create_report', { path: 'bim-project', name: 'Gulf Panel', design: gp.j.design, lang: 'ar', secondPage: false, slidePanel: true });
if (!r.err) {
  const pages = readReport(path.join(ROOT, 'bim-project', r.j.report)).filter((p) => !p.hidden), want = E.projectPages(Object.assign({}, gp.j.design.layout, { kpiCards: 2 }), 'ar', { second: false, panel: true });
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
  // and the report really shows those solid visuals: the cards, charts and tables leave their panel to the theme
  // (visual.json used to switch every visual's background, border and shadow off, so nothing had a panel), and the
  // result says what the report shows
  const all = {}; const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f2 = path.join(d, e.name); if (e.isDirectory()) walk(f2); else all[path.relative(path.dirname(dir), f2).split(path.sep).join('/')] = fs.readFileSync(f2); }); walk(dir);
  const pp = panelProblems(all);
  check(pp.solid && pp.panels > 0 && !pp.bad.length, `create_report transparent: ${pp.bad.length} visuals without the theme's panel: ${pp.bad.slice(0, 2).join('; ')}`);
  check(/own panel/.test(String(r.j.panels)) && /own panel/.test(JSON.stringify(r.j.themeChanged)), `create_report transparent: the result should say each card, chart and table has its own panel: ${JSON.stringify(r.j.panels)}`);
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

// ---------- report quality: what the Desktop check of Gulf Sales AR found ----------
// a report from a design on the Ramadan Test project (its DAX tables' columns have no type in the files)
{
  const t0 = await tryCall('generate_theme', { name: 'Quality', brand: '#0F4C5C', folder: 'themes/q' });
  const q = t0.err ? t0 : await tryCall('create_report', { path: 'dax-project', name: 'Quality', design: t0.j.design, layout: 'analysis', kpis: 4, filters: 'end', lang: 'en' });
  check(!q.err, `quality report: ${q.t.slice(0, 200)}`);
  if (!q.err) {
    const dir = path.join(ROOT, 'dax-project', q.j.report), pages = readReport(dir), all = pages.flatMap((p) => p.visuals);
    // 1. buttons: each formatting card's "show" on its own (no state selector), the look in the default state, the way
    //    Desktop saves buttons; a "show" inside the state is ignored and the Reset button drew only its icon
    const buttons = all.filter((v) => v.type === 'actionButton').map((v) => JSON.parse(v.text).visual.objects);
    const bad = buttons.flatMap((o) => Object.entries(o).filter(([, list]) => list.some((x) => x.selector && x.properties.show !== undefined)).map(([k]) => k));
    check(buttons.length > 0 && !bad.length, `buttons: "show" inside a state selector in ${bad.join(', ') || 'no button found'}`);
    const reset = buttons.find((o) => o.icon && JSON.stringify(o.icon).includes("'reset'"));
    const on = (card) => reset && (reset[card] || []).some((x) => !x.selector && JSON.stringify(x.properties.show) === JSON.stringify({ expr: { Literal: { Value: 'true' } } }));
    check(on('text') && on('fill') && on('outline'), `Reset button: text, fill and outline must be switched on outside the state (${JSON.stringify(reset).slice(0, 300)})`);
    // 2. tooltip page: its own text sizes (the theme's are made for the full page): value 20, titles 10
    const tipPage = pages.find((p) => p.hidden), tipText = tipPage ? tipPage.visuals.map((v) => v.text).join('') : '';
    check(/"value":\[\{"properties":\{"fontSize":\{"expr":\{"Literal":\{"Value":"20D"\}\}\}[^\]]*"selector":\{"id":"default"\}\}\]/.test(tipText.replace(/\s/g, '')) && (tipText.replace(/\s/g, '').match(/"fontSize":\{"expr":\{"Literal":\{"Value":"10D"\}\}\}/g) || []).length === 2,
      'tooltip page: the card value must be 20 and both titles 10');
    // 3. logo placeholder: readable (at least 12pt in a 48-high header slot)
    const logo = all.find((v) => v.type === 'textbox' && /Your logo/.test(v.text)), size = logo && +((logo.text.match(/"fontSize":\s*"(\d+)pt"/) || [])[1]);
    check(size >= 12, `logo placeholder: ${size}pt`);
    // 4. fields: no number (Amount) or date (Sales[Date]) as a category, axis or slicer; the date table's named parts instead
    const cols = boundFields(dir).filter(([k]) => k === 'Column').map(([, t, c]) => `${t}[${c}]`);
    check(!cols.includes('Sales[Amount]') && !cols.includes('Sales[Date]') && cols.includes('Calendar[Month Name]') && cols.includes('Calendar[Quarter]') && cols.includes('Calendar[Day Name]'),
      `fields: ${[...new Set(cols)].join(', ')}`);
    // 5. the model's own issues are told, with the fix, and the model is not changed
    const notes = (q.j.modelNotes || []).map((n) => n.field);
    check(notes.includes('Calendar[Month Name]') && notes.includes('Sales[Total Sales vs Last Ramadan %]'), `modelNotes: ${JSON.stringify(q.j.modelNotes)}`);
  }
}
// tables fill their visual (grow to fit); in a right-to-left report the category column comes last, so it sits on
// the right where an Arabic reader starts (Power BI doesn't mirror tables); day names without a sort column are told
{
  const t1 = await tryCall('generate_theme', { name: 'Quality AR', brand: '#0F4C5C', folder: 'themes/q' });
  const en = t1.err ? t1 : await tryCall('create_report', { path: 'dax-project', name: 'Table EN', design: t1.j.design, layout: 'analysis', filters: 'end', lang: 'en' });
  const ar = t1.err ? t1 : await tryCall('create_report', { path: 'dax-project', name: 'Table AR', design: t1.j.design, layout: 'analysis', filters: 'end', lang: 'ar' });
  const tables = (res) => res.err ? [] : readReport(path.join(ROOT, 'dax-project', res.j.report)).flatMap((p) => p.visuals).filter((v) => v.type === 'tableEx').map((v) => JSON.parse(v.text).visual);
  const cols = (v) => v.query.queryState.Values.projections.map((x) => (x.field.Column ? 'C:' + x.field.Column.Property : 'M:' + x.field.Measure.Property));
  const grow = (v) => /growToFit/.test(JSON.stringify(v.objects || {})) && /autoSizeColumnWidth/.test(JSON.stringify(v.objects || {}));
  const te = tables(en), ta = tables(ar);
  check(te.length && ta.length && te.concat(ta).every(grow), `tables must grow to fit: ${te.length} EN, ${ta.length} AR, ${JSON.stringify((te[0] || {}).objects)}`);
  check(te.length && ta.length && cols(te[0])[0].startsWith('C:') && cols(ta[0]).slice(-1)[0].startsWith('C:') && JSON.stringify(cols(ta[0])) === JSON.stringify(cols(te[0]).slice().reverse()),
    `right-to-left table column order: EN ${te.length ? cols(te[0]) : '-'} / AR ${ta.length ? cols(ta[0]) : '-'}`);
  check(!ar.err && (ar.j.modelNotes || []).some((n) => n.field === 'Calendar[Day Name]'), `modelNotes should tell Day Name has no sort column: ${JSON.stringify(ar.j && ar.j.modelNotes)}`);
}
// cards are cardVisual (Microsoft deprecates the legacy card): field role Data; value size and centring, no label
// and no inner outline, each on the "default" selector; padding set; the height they need fits their box (Microsoft's
// card sizing: text takes 1.5 x its size); the title follows the reading direction; on the phone, their own sizes
const cardProblems = (dir, rtl) => {
  const files = [], bad = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (/^(visual|mobile)\.json$/.test(e.name)) files.push(f); });
  walk(dir);
  const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined), n = (p) => parseFloat(lit(p));
  const def = (list) => (list || []).find((x) => x.selector && x.selector.id === 'default'), props = (list) => ((list || [])[0] || {}).properties || {};
  let cards = 0;
  files.filter((f) => f.endsWith('visual.json')).forEach((f) => {
    const j = JSON.parse(fs.readFileSync(f, 'utf8')), v = j.visual, id = j.name;
    if (!v) return;
    if (v.visualType === 'card' || v.visualType === 'multiRowCard') { bad.push(`${id}: legacy ${v.visualType}`); return; }
    if (v.visualType !== 'cardVisual') return;
    cards++;
    const o = v.objects || {}, c = v.visualContainerObjects || {}, val = def(o.value), pad = def(o.padding), lay = def(o.layout);
    const roles = Object.keys((v.query || {}).queryState || {});
    if (roles.length && roles.join() !== 'Data') bad.push(`${id}: role ${roles}`);
    if (!val || !(n(val.properties.fontSize) >= 8) || lit(val.properties.horizontalAlignment) !== "'center'") bad.push(`${id}: value ${JSON.stringify(val)}`);
    if (lit((def(o.label) || { properties: {} }).properties.show) !== 'false') bad.push(`${id}: label not hidden`);
    if (lit((def(o.outline) || { properties: {} }).properties.show) !== 'false') bad.push(`${id}: inner outline not off`);
    const t = props(c.title), vp = props(c.padding), sp = props(c.spacing);
    if (lit(t.alignment) !== (rtl ? "'right'" : "'left'")) bad.push(`${id}: title alignment ${lit(t.alignment)}`);
    if (lit(sp.customizeSpacing) !== 'true' || n(sp.spaceBelowTitleArea) !== 0) bad.push(`${id}: spacing ${JSON.stringify(sp)}`);
    const need = n(vp.top) + n(vp.bottom) + (lit(t.show) === 'true' ? Math.ceil(1.5 * n(t.fontSize)) : 0) + 2 * n(pad && pad.properties.paddingUniform) + 2 * n(lay && lay.properties.paddingUniform) + Math.ceil(1.5 * n(val && val.properties.fontSize));
    if (!(need <= j.position.height)) bad.push(`${id}: needs ${need} high, box ${j.position.height}`);
    const mf = path.join(path.dirname(f), 'mobile.json');
    if (fs.existsSync(mf)) {
      const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
      if (n((def((m.objects || {}).value) || { properties: {} }).properties.fontSize) !== 20 || n(props((m.visualContainerObjects || {}).title).fontSize) !== 10) bad.push(`${id}: phone sizes ${JSON.stringify(m.objects)} ${JSON.stringify(m.visualContainerObjects)}`);
    }
  });
  return { cards, bad };
};
{
  const t2 = await tryCall('generate_theme', { name: 'Cards', brand: '#0F4C5C', folder: 'themes/c' });
  for (const [name, lang, layout, kpis] of [['Cards EN', 'en', 'exec', 4], ['Cards AR', 'ar', 'analysis', 3]]) {
    const plan = t2.err ? t2 : await tryCall('plan_layout', { design: t2.j.design, layout, kpis, filters: layout === 'exec' ? 'none' : 'end', lang });
    const res = plan.err ? plan : await tryCall('create_report', { path: 'dax-project', name, design: plan.j.design, lang });
    const { cards, bad } = res.err ? { cards: 0, bad: [res.t.slice(0, 200)] } : cardProblems(path.join(ROOT, 'dax-project', res.j.report), lang === 'ar');
    // every KPI card on both pages, and the card of each of the two tooltip pages (round 1: by category, and the monthly trend)
    const want = plan.err ? -1 : E.projectPages(plan.j.design.layout, lang, { second: true, panel: false }).reduce((a, p) => a + p.slots.filter((s) => s.kind === 'kpi').length, 0) + 2;
    check(cards === want && !bad.length, `${name}: ${cards} cardVisual, want ${want}; ${bad.slice(0, 6).join('; ')}`);
  }
}

// the phone layout (no visual on top of another) and the sizes of the header, page buttons, slicers and buttons, on the
// smallest and largest pages and on 1920 x 1080 (see scripts/tests/report-check.mjs)
{
  const filesOf = (dir) => { const out = {}; const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else out[path.relative(dir, f).split(path.sep).join('/')] = fs.readFileSync(f); }); walk(dir); return out; };
  const t3 = await tryCall('generate_theme', { name: 'Sizes', brand: '#0F4C5C', folder: 'themes/s' });
  for (const [name, lang, layout, page] of [['Sizes EN 1080', 'en', 'exec', '1920x1080'], ['Sizes EN 360', 'en', 'exec', { w: 640, h: 360 }], ['Sizes AR 360', 'ar', 'analysis', { w: 640, h: 360 }],
    ['Sizes EN 2160', 'en', 'exec', { w: 3840, h: 2160 }], ['Sizes AR 2160', 'ar', 'analysis', { w: 3840, h: 2160 }]]) {
    const plan = t3.err ? t3 : await tryCall('plan_layout', { design: t3.j.design, layout, filters: layout === 'exec' ? 'none' : 'end', lang, page });
    const res = plan.err ? plan : await tryCall('create_report', { path: 'dax-project', name, design: plan.j.design, lang });
    const lp = res.err ? { phone: [res.t.slice(0, 200)], sizes: [] } : layoutProblems(filesOf(path.join(ROOT, 'dax-project', res.j.report)));
    check(!lp.phone.length, `${name}: phone ${lp.phone.slice(0, 3).join('; ')}${lp.phone.length > 3 ? ` (+${lp.phone.length - 3})` : ''}`);
    check(!lp.sizes.length, `${name}: sizes ${lp.sizes.slice(0, 3).join('; ')}${lp.sizes.length > 3 ? ` (+${lp.sizes.length - 3})` : ''}`);
  }
}

// round 0 (measured in Power BI Desktop 2.158, scripts/tests/DESKTOP-TESTS.md): every chart linked to the tooltip page
// with type Canvas; the tooltip page 320 x 284 with a bar chart; each table header aligned with its column; cards
// without their own fill and with padding Desktop applies; the theme under one name and a .platform file; a logo
{
  const filesOf = (dir) => { const out = {}; const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else out[path.relative(path.dirname(dir), f).split(path.sep).join('/')] = fs.readFileSync(f); }); walk(dir); return out; };
  // Microsoft's validator on a report folder: { errors, what } (warnings are not errors)
  const validate = (dir) => {
    const cli = path.join(HERE, 'node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js');
    const p = spawnSync(process.execPath, [cli, 'validate', dir], { encoding: 'utf8' });
    try {
      const d = JSON.parse(p.stdout).data, diag = d.diagnostics || {};
      return { errors: d.errorCount, what: Object.keys(diag).filter((k) => diag[k].severity === 'error').map((k) => `${k}: ${String(diag[k].items[0].message).split(': ')[0]}`).join('; ') };
    } catch (e) { return { errors: -1, what: 'the validator did not run: ' + String(p.stderr || p.error || p.stdout).slice(0, 200) }; }
  };
  const t4 = await tryCall('generate_theme', { name: 'Round0', brand: '#0F4C5C', folder: 'themes/r0' });
  const made = {};
  for (const [name, lang] of [['Round0 EN', 'en'], ['Round0 AR', 'ar']]) {
    const plan = t4.err ? t4 : await tryCall('plan_layout', { design: t4.j.design, layout: 'exec', kpis: 4, filters: 'none', lang });
    const res = plan.err ? plan : await tryCall('create_report', { path: 'dax-project', name, design: plan.j.design, lang });
    if (res.err) { check(false, `${name}: ${res.t.slice(0, 200)}`); continue; }
    const files = filesOf(path.join(ROOT, 'dax-project', res.j.report)), rtl = lang === 'ar'; made[lang] = plan;
    const a = tooltipProblems(files), t = tooltipPageProblems(files), tb = tableProblems(files, rtl), cd = cardStyleProblems(files, rtl), sh = projectProblems(files);
    // the default two-page report: 4 charts (page 1 line, bar, column; page 2 column), 2 tables, 7 KPI cards and the two tooltip
    // cards (round 1: the bar and column charts show the monthly trend on hover, the line chart the bar chart by category)
    check(a.charts === 4 && a.trend === 3 && !a.bad.length, `${name}: ${a.bad.length} of ${a.charts} charts with a wrong tooltip link, ${a.trend} linked to the monthly trend (4 charts, 3 to the trend expected): ${a.bad.slice(0, 2).join('; ')}`);
    check(t.pages === 2 && t.charts === 2 && t.trend === 1 && !t.bad.length, `${name}: tooltip pages: ${t.bad.slice(0, 2).join('; ') || `${t.pages} pages, ${t.charts} charts, ${t.trend} trend`}`);
    check(tb.columns >= 6 && !tb.bad.length, `${name}: ${tb.bad.length} of ${tb.columns} table columns without header alignment: ${tb.bad.slice(0, 2).join('; ')}`);
    check(cd.cards === 9 && !cd.bad.length, `${name}: ${new Set(cd.bad.map((x) => x.split(':')[0])).size} of ${cd.cards} cards with their own fill or ignored padding (9 cards expected): ${cd.bad.slice(0, 2).join('; ')}`);
    check(!sh.length, `${name}: ${sh.join('; ')}`);
    // round 1: "Your logo" and the title are centred in the header's height
    const hd = headerProblems(files), ph = phoneTextProblems(files);
    // round 2: the category tooltip's chart shows a base measure, never one that is empty for a single item
    // ("Total Sales Last Ramadan" gave an empty chart on the line chart's tooltip)
    // round 2: an Arabic report's page buttons run right to left (two pages: two buttons on each); an English one keeps the navigator
    const nv = navProblems(files, rtl);
    check(!nv.bad.length && nv.buttons === (rtl ? 4 : 0) && nv.navigators === (rtl ? 0 : 2), `${name}: page buttons: ${nv.buttons} single buttons, ${nv.navigators} navigators; ${nv.bad.slice(0, 2).join('; ')}`);
    // round 2: the model's Month Name and Day Name have no sort-by column; the charts by them are put in order by the
    // report (Min of Month Number / Day of Week in the tooltip fields, sorted by it), the trend tooltip too
    const sp = sortProblems(files), byOf = (cat) => [...new Set(sp.sorted.filter((x) => x.category === cat).map((x) => x.by))].join();
    check(!sp.bad.length && byOf('Calendar.Month Name') === 'Calendar.Month Number' && sp.sorted.some((x) => x.tooltip && x.category === 'Calendar.Month Name') && sp.sorted.some((x) => x.type === 'lineChart'),
      `${name}: months not put in order: ${JSON.stringify(sp.sorted).slice(0, 300)} ${sp.bad.slice(0, 2).join('; ')}`);
    check(byOf('Calendar.Day Name') === 'Calendar.Day of Week', `${name}: the chart by Day Name is sorted by "${byOf('Calendar.Day Name')}", want Calendar.Day of Week`);
    // round 2: display names. Without the input nothing carries one; an Arabic report lists the fields it shows under
    // their model names (none has an Arabic letter here); an English report has no such list
    const allText = (fl) => Object.keys(fl).filter((k) => k.endsWith('/visual.json')).map((k) => String(fl[k])).join('\n');
    const projections = (fl) => { const out = []; Object.keys(fl).filter((k) => k.endsWith('/visual.json')).forEach((k) => { const v = JSON.parse(String(fl[k])); Object.values(((v.visual || {}).query || {}).queryState || {}).forEach((r) => (r.projections || []).forEach((p) => out.push(p))); }); return out; };
    check(projections(files).every((p) => p.displayName === undefined) && (rtl ? Array.isArray((res.j.arabicNames || {}).missing) && res.j.arabicNames.missing.includes('Sales[Total Sales]') && res.j.arabicNames.missing.includes('Calendar[Month Name]') : !res.j.arabicNames),
      `${name}: without displayNames: a displayName written, or arabicNames ${JSON.stringify(res.j.arabicNames || null).slice(0, 200)}`);
    if (rtl) {
      const given = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Calendar[Month Name]': 'الشهر', 'Calendar[Quarter]': 'الربع', 'Nope[X]': 'لا شيء' };
      const nr = await tryCall('create_report', { path: 'dax-project', name: 'Names AR', design: plan.j.design, lang: 'ar', displayNames: given });
      if (nr.err) check(false, `display names: ${nr.t.slice(0, 200)}`);
      else {
        const nf = filesOf(path.join(ROOT, 'dax-project', nr.j.report)), ps = projections(nf), txt = allText(nf);
        const of = (ref) => ps.filter((p) => p.queryRef === ref);
        // every projection of a named field shows the given name; a field without a name has none; queryRef is untouched
        check(of('Sales.Total Sales').length >= 4 && of('Sales.Total Sales').every((p) => p.displayName === 'إجمالي المبيعات') && of('Calendar.Month Name').length >= 2 && of('Calendar.Month Name').every((p) => p.displayName === 'الشهر')
          && of('Sales.Total Sales Last Ramadan').length >= 1 && of('Sales.Total Sales Last Ramadan').every((p) => p.displayName === undefined),
          `display names: projections ${JSON.stringify(ps.filter((p) => /Total Sales$|Month Name|Last Ramadan$/.test(p.queryRef)).map((p) => [p.queryRef, p.displayName])).slice(0, 300)}`);
        // our own titles use the names: the KPI card's title, "X حسب Y" on the line chart and on the trend tooltip
        check(txt.includes("'إجمالي المبيعات حسب الشهر'") && txt.includes("'إجمالي المبيعات'") && !txt.includes("'Total Sales حسب Month Name'"), 'display names: titles still use the model names');
        // the table's column formatting still points at the field (its queryRef), not at the name
        const tp = tableProblems(nf, true);
        check(tp.columns >= 6 && !tp.bad.length, `display names: ${tp.bad.length} of ${tp.columns} table columns lost their header alignment: ${tp.bad.slice(0, 2).join('; ')}`);
        const an = nr.j.arabicNames || {}, dn = nr.j.displayNames || {};
        check(Array.isArray(an.missing) && an.missing.includes('Sales[Total Sales Last Ramadan]') && !an.missing.includes('Sales[Total Sales]') && !an.missing.includes('Calendar[Month Name]') && !an.missing.includes('Calendar[Quarter]')
          && JSON.stringify(dn.notUsed) === '["Nope[X]"]' && dn.used === 3, `display names: arabicNames ${JSON.stringify(an).slice(0, 200)}, displayNames ${JSON.stringify(dn)}`);
        const v2 = validate(path.join(ROOT, 'dax-project', nr.j.report));
        check(v2.errors === 0, `display names: Microsoft's validator: ${v2.errors} errors ${v2.what}`);
      }
      const bad = await tryCall('create_report', { path: 'dax-project', name: 'Names bad', design: plan.j.design, lang: 'ar', displayNames: { 'Sales[Total Sales]': '   ' } });
      check(bad.err && /display name/i.test(bad.t), `display names: an empty name was accepted: ${bad.t.slice(0, 120)}`);
    }
    const tm = tooltipMeasures(files);
    check(tm.category === 'Sales.Total Sales' && tm.trend === 'Sales.Total Sales', `${name}: tooltip charts show ${JSON.stringify(tm)}, want Sales.Total Sales on both`);
    // round 1: every text in the phone layout fits its phone box
    check(ph.visuals > 10 && !ph.bad.length, `${name}: phone text: ${ph.bad.slice(0, 2).join('; ')} (${ph.bad.length} of ${ph.visuals} visuals)`);
    check(hd.boxes >= 2 && !hd.bad.length, `${name}: header text not centred: ${hd.bad.slice(0, 2).join('; ')} (${hd.boxes} boxes)`);
    // a solid design shows its panels: 13 visuals (7 KPI cards, 4 charts, 2 tables) are left to the theme, the group
    // around the KPI cards draws no band, and the header, slicers and buttons keep theirs off
    const pp = panelProblems(files);
    check(pp.solid && pp.panels === 13 && !pp.bad.length, `${name}: panels: ${pp.panels} visuals left to the theme (13 expected), ${pp.bad.length} wrong: ${pp.bad.slice(0, 2).join('; ')}`);
    check(/own panel/.test(String(res.j.panels)), `${name}: the result should say what the report shows: ${JSON.stringify(res.j.panels)}`);
    // Microsoft's validator (their report authoring CLI, a pinned dev dependency of these tests) finds no error in the
    // export; and the card visual's theme entry has no "radius": inside a theme the card's "border" is the card's own
    // border, which has none (the validator's PBIR_THEME_VISUAL_PROP_UNKNOWN), while other visual types keep theirs
    const dir = path.join(ROOT, 'dax-project', res.j.report), v = validate(dir);
    check(v.errors === 0, `${name}: Microsoft's validator: ${v.errors} errors: ${v.what}`);
    const th = JSON.parse(fs.readFileSync(path.join(dir, 'StaticResources/RegisteredResources', fs.readdirSync(path.join(dir, 'StaticResources/RegisteredResources')).find((f) => f.endsWith('-theme.json'))), 'utf8')).visualStyles;
    const cb = th.cardVisual['*'].border[0], ob = th.clusteredColumnChart['*'].border[0];
    check(cb.show === true && !('radius' in cb) && ob.radius > 0 && th.card['*'].border[0].radius === ob.radius, `${name}: theme border: cardVisual ${JSON.stringify(cb)}, column chart ${JSON.stringify(ob)}`);
  }
  // a logo: a PNG or JPG inside the DataArcus folder (2 MB at most), copied into the report; its box takes the logo's
  // shape and the image is never stretched; a logo taller than wide gets a note; anything else is refused with the reason
  fs.cpSync(path.join(REPO, 'scripts/tests/fixtures/logos'), path.join(ROOT, 'logos'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'logos/logo.gif'), 'GIF89a');
  fs.writeFileSync(path.join(ROOT, 'logos/big.png'), Buffer.concat([fs.readFileSync(path.join(ROOT, 'logos/wide.png')), Buffer.alloc(2 * 1024 * 1024)]));
  fs.writeFileSync(path.join(path.dirname(ROOT), 'dataarcus-outside-logo.png'), fs.readFileSync(path.join(ROOT, 'logos/wide.png')));
  const TALL = 'This logo is tall; a horizontal version will read much better in the header.';
  for (const [file, lang, x, w, tall] of [['tall.png', 'en', 1865, 19, true], ['wide.png', 'ar', 36, 192, false], ['wide.jpg', 'en', 1344, 540, false]]) {
    const res = !made[lang] || made[lang].err ? { err: true, t: 'no plan' } : await tryCall('create_report', { path: 'dax-project', name: 'Logo ' + file, design: made[lang].j.design, lang, logo: 'logos/' + file });
    if (res.err) { check(false, `logo ${file}: ${res.t.slice(0, 200)}`); continue; }
    const dir = path.join(ROOT, 'dax-project', res.j.report), img = readReport(dir)[0].visuals.filter((v) => v.type === 'image');
    const o = img.length ? JSON.parse(img[0].text).visual.objects : {}, stored = fs.readdirSync(path.join(dir, 'StaticResources/RegisteredResources')).filter((f) => /-logo\.(png|jpg)$/.test(f));
    check(img.length === 1 && img[0].x === x && img[0].w === w && img[0].h === 48 && JSON.stringify(o.image || '').includes("'Fit'") && !o.imageScaling && stored.length === 1
      && fs.readFileSync(path.join(dir, 'StaticResources/RegisteredResources', stored[0])).equals(fs.readFileSync(path.join(ROOT, 'logos', file))),
      `logo ${file} (${lang}): ${img.length} image visuals at ${img.map((v) => `${v.x}, ${v.w} x ${v.h}`).join('; ')} (want ${x}, ${w} x 48), scaling ${JSON.stringify(o.image || o.imageScaling)}, stored ${stored}`);
    check((res.j.reportNotes || []).includes(TALL) === tall, `logo ${file}: reportNotes ${JSON.stringify(res.j.reportNotes)}`);
    const lp = layoutProblems(filesOf(dir));
    check(!lp.sizes.length && !lp.phone.length, `logo ${file}: ${lp.sizes[0] || lp.phone[0]}`);
  }
  for (const [file, why] of [['logos/logo.gif', /PNG or JPG/], ['logos/big.png', /2 MB/], ['../dataarcus-outside-logo.png', /outside|inside/i], ['logos/missing.png', /not found|no such|does not exist/i]]) {
    const res = !made.en || made.en.err ? { err: false, t: 'no plan' } : await tryCall('create_report', { path: 'dax-project', name: 'Logo refused', design: made.en.j.design, logo: file });
    check(res.err && why.test(res.t) && !fs.existsSync(path.join(ROOT, 'dax-project', 'Logo refused.Report')), `logo ${file} must be refused (${why}): ${res.t.slice(0, 160)}`);
  }
  fs.rmSync(path.join(path.dirname(ROOT), 'dataarcus-outside-logo.png'), { force: true });
}

// suggest_fields on the same project: the same sensible fields
r = await call('suggest_fields', { path: 'dax-project', kpis: 3 });
{ const f = (x) => (x ? `${x.t}[${x.c}]` : null), sl = r.err ? [] : r.j.slicers.map(f);
  check(!r.err && f(r.j.date) === 'Calendar[Month Name]' && !sl.includes('Sales[Amount]') && !sl.includes('Sales[Date]') && sl.every(Boolean), `suggest_fields on dax-project: ${r.t.slice(0, 300)}`); }

// ---------- round 3: safety before the first beta build ----------
{
  // another server, with its own environment (no DATAARCUS_ROOT unless given) and folder to start in
  const start = async (env, cwd) => {
    const c = new Client({ name: 'test-r3', version: '1' }), e = { ...process.env }; delete e.DATAARCUS_ROOT; Object.assign(e, env);
    try { await c.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(HERE, 'server.mjs')], env: e, cwd, stderr: 'ignore' })); } catch (err) { return { dead: String(err && err.message || err), call: async () => ({ err: true, t: 'the server did not start', j: null }), close: async () => {} }; }
    return { c, close: () => c.close(), call: async (name, args) => { try { const r = await c.callTool({ name, arguments: args }); const t = r.content[0].text; return { err: !!r.isError, t, j: r.isError ? null : JSON.parse(t) }; } catch (err) { return { err: true, t: 'call failed: ' + String(err && err.message || err), j: null }; } } };
  };
  const one = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const plan = await one('plan_layout', {}), design = plan.j && plan.j.design;
  const unlink = (p) => { try { fs.unlinkSync(p); } catch (e) { try { fs.rmdirSync(p); } catch (e2) { /* already gone */ } } };

  // 1. a link (symbolic link or junction) inside the working folder that leads outside it is never followed
  {
    const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-outside-'));
    fs.cpSync(path.join(ROOT, 'tmdl-project'), path.join(OUT, 'tmdl-project'), { recursive: true });
    fs.copyFileSync(path.join(REPO, 'scripts/tests/fixtures/logos/wide.png'), path.join(OUT, 'wide.png'));
    const before = fs.readdirSync(OUT).sort().join();
    fs.symlinkSync(OUT, path.join(ROOT, 'linked'), 'junction');
    fs.mkdirSync(path.join(ROOT, 'link-project'));
    fs.symlinkSync(path.join(OUT, 'tmdl-project', 'Sales.SemanticModel'), path.join(ROOT, 'link-project', 'Sales.SemanticModel'), 'junction');
    const LINK = /leads outside the working folder .* through a link/;
    let x = await one('read_model', { path: 'linked/tmdl-project' });
    check(x.err && LINK.test(x.t), `a link to outside, read_model through it: ${x.err ? x.t.slice(0, 200) : 'the model outside was read: ' + x.j.tables.map((t) => t.table)}`);
    x = await one('read_model', { path: 'link-project' });
    check(x.err && LINK.test(x.t), `a project whose model folder is a link to outside: ${x.err ? x.t.slice(0, 200) : 'the model outside was read: ' + x.j.tables.map((t) => t.table)}`);
    x = await one('generate_theme', { name: 'Linked', folder: 'linked' });
    check(x.err && LINK.test(x.t) && fs.readdirSync(OUT).sort().join() === before, `a link to outside, generate_theme into it: ${x.t.slice(0, 160)}; outside now holds ${fs.readdirSync(OUT)}`);
    x = design ? await one('create_report', { path: 'tmdl-project', name: 'Link logo', design, logo: 'linked/wide.png' }) : { err: false, t: 'no design' };
    check(x.err && LINK.test(x.t) && !fs.existsSync(path.join(ROOT, 'tmdl-project', 'Link logo.Report')), `a logo behind a link to outside: ${x.t.slice(0, 200)}`);
    unlink(path.join(ROOT, 'linked')); unlink(path.join(ROOT, 'link-project', 'Sales.SemanticModel'));
    fs.rmSync(OUT, { recursive: true, force: true });
  }

  // 2. a working folder that is itself a model folder: reading works, nothing above it is read or written
  {
    const s = await start({ DATAARCUS_ROOT: path.join(ROOT, 'tmdl-project', 'Sales.SemanticModel') }, ROOT);
    const rm = await s.call('read_model', { path: '.' });
    check(!rm.err && rm.j.tables.map((t) => t.table).join() === 'Calendar,Customer,Sales' && rm.j.existingReports.length === 0, `the working folder is a model folder, read_model: ${rm.err ? rm.t.slice(0, 200) : 'reports listed from the folder above: ' + JSON.stringify(rm.j.existingReports)}`);
    const cr = design ? await s.call('create_report', { path: '.', name: 'Root model', design }) : { err: false, t: 'no design' };
    check(cr.err && /working folder is the model folder itself/.test(cr.t) && /project folder/.test(cr.t), `the working folder is a model folder, create_report must be refused: ${cr.t.slice(0, 200)}`);
    check(!fs.existsSync(path.join(ROOT, 'tmdl-project', 'Root model.Report')) && !fs.existsSync(path.join(ROOT, 'tmdl-project', 'Root model.pbip')), 'the working folder is a model folder: create_report wrote above the working folder');
    await s.close();
  }

  // 3. the report-design skill asks before a page screenshot and before a DAX query, and says where the result goes
  {
    const skill = fs.readFileSync(path.join(HERE, 'skills/report-design/SKILL.md'), 'utf8').replace(/\r\n/g, '\n');
    const step = (n) => (skill.match(new RegExp('\\n' + n + '\\. \\*\\*[\\s\\S]*?(?=\\n' + (n + 1) + '\\. \\*\\*|\\n## )')) || [''])[0];
    for (const [n, what] of [[7, /screenshot/i], [8, /DAX/]]) {
      const t = step(n);
      check(what.test(t) && /ask the user/i.test(t) && /before|first/i.test(t) && /AI app/.test(t), `skill step ${n} must ask the user first and say that what the report shows goes to the AI app: ${t.slice(0, 200).replace(/\n/g, ' ')}`);
    }
  }

  // 4. no working folder set: the server starts, every tool refuses with the reason, and no file is touched
  {
    const CWD = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-noroot-'));
    const NOT_SET = /No working folder is set/, calls = [['read_model', { path: '.' }], ['suggest_fields', { path: '.' }], ['check_model_health', { path: '.' }], ['generate_theme', { name: 'No root' }], ['plan_layout', {}], ['create_report', { path: '.', name: 'No root', design: design || {} }]];
    const s = await start({}, CWD);
    const listed = s.dead ? [] : (await s.c.listTools()).tools.map((t) => t.name);
    check(!s.dead && listed.length === 6, `no DATAARCUS_ROOT: the server must start and list its 6 tools: ${s.dead || listed}`);
    const answers = []; for (const [n, a] of calls) answers.push([n, await s.call(n, a)]);
    const wrong = answers.filter(([, x]) => !(x.err && NOT_SET.test(x.t) && /DATAARCUS_ROOT/.test(x.t)));
    check(!wrong.length, `no DATAARCUS_ROOT: ${wrong.length} of 6 tools did not refuse with the reason, e.g. ${wrong[0] && wrong[0][0]}: ${wrong[0] && wrong[0][1].t.slice(0, 120)}`);
    check(fs.readdirSync(CWD).length === 0, `no DATAARCUS_ROOT: written in the folder the server started in: ${fs.readdirSync(CWD)}`);
    await s.close();
    const bad = [];
    for (const v of ['', '   ', '${user_config.working_folder}']) {
      const s2 = await start({ DATAARCUS_ROOT: v }, CWD), x = await s2.call('generate_theme', { name: 'No root' });
      if (!(x.err && NOT_SET.test(x.t)) || fs.readdirSync(CWD).length) bad.push(JSON.stringify(v) + ': ' + x.t.slice(0, 100) + ' / files: ' + fs.readdirSync(CWD));
      await s2.close();
    }
    check(!bad.length, `DATAARCUS_ROOT empty, blank or an unfilled placeholder must count as not set: ${bad.join(' | ')}`);
    fs.rmSync(CWD, { recursive: true, force: true });
  }

  // 5. a working folder that doesn't exist yet: made on start when its parent exists, otherwise told; never a raw ENOENT
  {
    const BASE = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-newroot-'));
    const a = await start({ DATAARCUS_ROOT: path.join(BASE, 'new') }, BASE), ra = await a.call('read_model', { path: '.' });
    check(fs.existsSync(path.join(BASE, 'new')) && ra.err && /is empty/.test(ra.t) && /\.pbip/.test(ra.t), `a new working folder: made on start (${fs.existsSync(path.join(BASE, 'new'))}), read_model: ${ra.t.slice(0, 200)}`);
    await a.close();
    const b = await start({ DATAARCUS_ROOT: path.join(BASE, 'a', 'b', 'c') }, BASE), rb = await b.call('read_model', { path: '.' }), tb = await b.call('generate_theme', { name: 'Missing' });
    check(!fs.existsSync(path.join(BASE, 'a')) && rb.err && /doesn't exist yet/.test(rb.t) && /\.pbip/.test(rb.t) && tb.err && /doesn't exist yet/.test(tb.t), `a working folder with no parent: made anyway (${fs.existsSync(path.join(BASE, 'a'))}), read_model: ${rb.t.slice(0, 160)}; generate_theme: ${tb.t.slice(0, 120)}`);
    check(!/ENOENT/.test(ra.t + rb.t + tb.t), `a missing working folder answered with a raw error: ${(ra.t + ' | ' + rb.t).slice(0, 240)}`);
    await b.close();
    fs.rmSync(BASE, { recursive: true, force: true });
  }

  // 6. the version is in one place: mcp/package.json
  {
    const pkg = JSON.parse(fs.readFileSync(path.join(HERE, 'package.json'), 'utf8')), src = fs.readFileSync(path.join(HERE, 'server.mjs'), 'utf8');
    check((client.getServerVersion() || {}).version === pkg.version, `the server's version ${(client.getServerVersion() || {}).version} is not package.json's ${pkg.version}`);
    check(!/version:\s*['"]\d/.test(src) && /package\.json/.test(src), 'server.mjs still holds a version of its own (it must read mcp/package.json)');
  }

  // 7. tool annotations: four tools only read; the two that write only add files
  {
    const ann = Object.fromEntries((await client.listTools()).tools.map((t) => [t.name, t.annotations || {}]));
    const ro = ['read_model', 'suggest_fields', 'check_model_health', 'plan_layout'].filter((n) => ann[n].readOnlyHint !== true);
    check(!ro.length, `readOnlyHint true is missing on: ${ro}`);
    const wr = ['generate_theme', 'create_report'].filter((n) => !(ann[n].readOnlyHint === false && ann[n].destructiveHint === false));
    check(!wr.length, `readOnlyHint false with destructiveHint false is missing on: ${wr} (${JSON.stringify(wr.map((n) => ann[n]))})`);
  }

  // 8. a broken field used only inside a bookmark is told as that bookmark, not as a "report filter"
  {
    fs.cpSync(path.join(ROOT, 'bim-project'), path.join(ROOT, 'bookmark-project'), { recursive: true });
    const rep = fs.readdirSync(path.join(ROOT, 'bookmark-project')).find((n) => /\.Report$/.test(n)), bdir = path.join(ROOT, 'bookmark-project', rep, 'definition', 'bookmarks');
    fs.mkdirSync(bdir, { recursive: true });
    const gone = (prop) => ({ Column: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: prop } });
    fs.writeFileSync(path.join(bdir, 'Bookmark1a2b.bookmark.json'), JSON.stringify({ name: 'Bookmark1a2b', displayName: 'Q1 view', explorationState: { version: '1.3', filters: { byExpr: [{ name: 'f1', type: 'Categorical', expression: gone('Gone In Bookmark') }] } } }));
    fs.writeFileSync(path.join(bdir, 'bookmarks.json'), JSON.stringify({ items: [{ name: 'Bookmark1a2b' }] }));
    const x = await one('check_model_health', { path: 'bookmark-project', maxItems: 200 });
    const it = x.err ? null : ((x.j.findings.find((f) => f.id === 'BROKEN_REF') || {}).items || []).find((i) => i.obj === 'Sales[Gone In Bookmark]');
    check(!!it && it.detail === 'bookmark "Q1 view"', `a broken field in a bookmark: ${x.err ? x.t.slice(0, 200) : JSON.stringify(it)}`);
  }

  // 9 and 10. the fix scripts on a TMDL project saved by Desktop (every object has a lineageTag): the scripts keep each
  // rewritten object's tag (without it Desktop gives the object a new one: measured), and the sort script, which adds
  // columns, says to press "Refresh now" after Apply (measured: every visual shows an error until then)
  {
    const d = path.join(ROOT, 'tag-project', 'Tags.SemanticModel', 'definition');
    fs.mkdirSync(path.join(d, 'tables'), { recursive: true });
    fs.writeFileSync(path.join(d, 'database.tmdl'), 'database\n\tcompatibilityLevel: 1606\n');
    fs.writeFileSync(path.join(d, 'model.tmdl'), 'model Model\n\tculture: en-US\n\nref table Calendar\nref table Sales\n');
    fs.writeFileSync(path.join(d, 'relationships.tmdl'), 'relationship r1\n\tfromColumn: Sales.Date\n\ttoColumn: Calendar.Date\n');
    const part = (n) => `\tpartition ${n} = m\n\t\tmode: import\n\t\tsource =\n\t\t\t\tlet\n\t\t\t\t    Source = #table({"Date"}, {})\n\t\t\t\tin\n\t\t\t\t    Source\n`;
    fs.writeFileSync(path.join(d, 'tables', 'Calendar.tmdl'), "table Calendar\n\tlineageTag: t-cal\n\n\tcolumn Date\n\t\tdataType: dateTime\n\t\tlineageTag: c-date\n\t\tsummarizeBy: none\n\t\tsourceColumn: Date\n\n\tcolumn 'Month Name'\n\t\tdataType: string\n\t\tlineageTag: c-month-name\n\t\tsummarizeBy: none\n\t\tsourceColumn: Month Name\n\n\tcolumn 'Day Name'\n\t\tdataType: string\n\t\tlineageTag: c-day-name\n\t\tsummarizeBy: none\n\t\tsourceColumn: Day Name\n\n" + part('Calendar'));
    fs.writeFileSync(path.join(d, 'tables', 'Sales.tmdl'), "table Sales\n\tlineageTag: t-sales\n\n\tmeasure 'Total Sales' = SUM ( 'Sales'[Amount] )\n\t\tlineageTag: m-total-sales\n\n\tmeasure 'Margin %' = DIVIDE ( 1, 2 )\n\t\tlineageTag: m-margin\n\n\tcolumn Date\n\t\tdataType: dateTime\n\t\tlineageTag: s-date\n\t\tsummarizeBy: none\n\t\tsourceColumn: Date\n\n\tcolumn Amount\n\t\tdataType: double\n\t\tlineageTag: s-amount\n\t\tsummarizeBy: sum\n\t\tsourceColumn: Amount\n\n" + part('Sales'));
    const x = await one('check_model_health', { path: 'tag-project', maxItems: 200 }), fx = x.err ? {} : x.j.fixes || {}, nf = fx.NO_FORMAT || {}, ms = fx.MONTH_SORT || {};
    // the lines of one object in a script: from its header to the next blank line
    const block = (script, head) => { const l = String(script || '').split('\n'), i = l.findIndex((s) => s.trim().startsWith(head)); return i < 0 ? [] : l.slice(i, l.findIndex((s, j) => j > i && !s.trim()) < 0 ? undefined : l.findIndex((s, j) => j > i && !s.trim())).map((s) => s.trim()); };
    check(block(nf.fixScript, "measure 'Total Sales'").includes('lineageTag: m-total-sales') && block(nf.fixScript, "measure 'Margin %'").includes('lineageTag: m-margin'),
      `the format script from a TMDL project must keep each measure's lineageTag: ${x.err ? x.t.slice(0, 200) : String(nf.fixScript).slice(0, 300)}`);
    check(block(ms.fixScript, "column 'Month Name'").includes('lineageTag: c-month-name') && block(ms.fixScript, "column 'Day Name'").includes('lineageTag: c-day-name') && !block(ms.fixScript, "column 'Month Number'").some((s) => /^lineageTag/.test(s)),
      `the sort script from a TMDL project must keep each column's lineageTag (a new column has none): ${String(ms.fixScript).slice(0, 400)}`);
    check((ms.sorts || []).some((s) => s.added) && /TMDL view/.test(String(ms.howToApply)) && /Refresh now/.test(String(ms.howToApply)), `the sort script adds columns: howToApply must say to press "Refresh now" after Apply: ${ms.howToApply}`);
    check(!!nf.howToApply && !/Refresh now/.test(String(nf.howToApply)), `the format script adds no column: howToApply must not ask for a refresh: ${nf.howToApply}`);
  }
}

// ---------- the Gulf calendar beta cut: an unscored gulfCalendar section in check_model_health ----------
{
  const ask = async (args) => { try { return await call('check_model_health', Object.assign({ maxItems: 50 }, args)); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const ASOF = '2026-10-03';
  const ids = (x) => (x.j && x.j.gulfCalendar ? x.j.gulfCalendar.findings.map((f) => f.id) : null), find = (x, id) => (x.j && x.j.gulfCalendar ? x.j.gulfCalendar.findings.find((f) => f.id === id) : null);
  const short = (x) => (x.err ? x.t.slice(0, 200) : JSON.stringify(x.j.gulfCalendar || 'no gulfCalendar section').slice(0, 500));
  // made-up models, written from the repo's own files: the pack's test model; the generator's 2018-2030 calendar from
  // before the pack (no announced dates); imported calendars; no calendar; our calendar with another weekend form
  const dax = (file) => fs.readFileSync(path.join(REPO, 'scripts/gulf-calendar/test-model', file), 'utf8').replace(/\r\n/g, '\n');
  const calc = (name, expr) => ({ name, columns: [], partitions: [{ name, mode: 'import', source: { type: 'calculated', expression: expr } }] });
  const mq = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"Date"}, {}) in Source' } }];
  const col = (name, dataType) => ({ name, dataType, sourceColumn: name });
  const packMeasures = dax('measures.dax').split(/\n(?=    MEASURE 'Sales'\[)/).slice(1).map((b) => { const m = b.match(/MEASURE 'Sales'\[([^\]]+)\] =\n([\s\S]*?)(?=\nEVALUATE|$)/); return { name: m[1], expression: m[2] }; });
  const salesT = (measures) => ({ name: 'Sales', columns: [col('Date', 'dateTime'), col('Amount', 'double')], partitions: mq('Sales'), measures });
  const write = (file, tables) => fs.writeFileSync(path.join(ROOT, file), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships: tables.length > 1 ? [{ name: 'r', fromTable: 'Sales', fromColumn: 'Date', toTable: tables[0].name, toColumn: 'Date' }] : [] } }));
  const packCal = dax('calendar.dax').replace(/^Calendar =\n/, '');
  write('gulf-pack.bim', [calc('Calendar', packCal), salesT(packMeasures)]);
  const base = JSON.parse(fs.readFileSync(path.join(REPO, 'scripts/tests/fixtures/gulf-calendar/baseline.json'), 'utf8')).cg['10'].dax.replace(/^Calendar =\n/, '');
  write('gulf-2018.bim', [calc('Calendar', base), salesT([{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }])]);
  const imported = (cols) => ({ name: 'Calendar', columns: [col('Date', 'dateTime')].concat(cols.map((c) => col(c, /^Is /.test(c) ? 'boolean' : 'int64'))), partitions: mq('Calendar') });
  write('gulf-imported.bim', [imported(['Hijri Year', 'Hijri Month Number', 'Hijri Day', 'Is Ramadan', 'Ramadan Day', 'Is Eid al-Fitr', 'Is Eid al-Adha', 'Is Weekend']), salesT([{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }])]);
  write('gulf-hijri-only.bim', [imported(['Hijri Year', 'Hijri Month Number', 'Hijri Day']), salesT([{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }])]);
  write('gulf-none.bim', [{ name: 'Sales', columns: [col('Amount', 'double'), col('Region', 'string')], partitions: mq('Sales'), measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }]);
  const weekendLine = packCal.split('\n').find((l) => l.trim().startsWith('"Is Weekend", '));
  write('gulf-other-weekend.bim', [calc('Calendar', packCal.replace(weekendLine, '        "Is Weekend", WEEKDAY ( [Date], 2 ) > 5,')), salesT(packMeasures)]);

  // the generator's own calendar 2022-2027 (Umm al-Qura, fixed Saturday-Sunday), with the Ramadan measures
  const uae = await ask({ path: 'dax-project', country: 'uae', asOf: ASOF }), had = !!(uae.j && uae.j.gulfCalendar), g = had ? uae.j.gulfCalendar : { country: {}, calendar: {}, datesComparedWith: {}, fixes: {} }, est = find(uae, 'GC_ESTIMATES') || { items: [], ar: {} };
  check(!uae.err && had && g.scored === false && g.country.code === 'uae' && g.calendar.table === 'Calendar' && g.calendar.kind === 'dataarcus-dax' && JSON.stringify(ids(uae)) === '["GC_ESTIMATES"]' && est.count === 3 && est.items.length === 3
    && est.items.map((i) => i.event).join() === 'Ramadan 1448,Eid al-Fitr 1448,Eid al-Adha 1448' && est.source === 'files' && /[؀-ۿ]/.test(est.ar.title),
    `gulfCalendar, the generator's calendar, UAE: ${short(uae)}`);
  const cgf = g.fixes.calendarGenerator, mbf = g.fixes.measureBuilder;
  check(!!cgf && /dataarcus\.com\/tools\/dax-calendar-table-generator\.html/.test(cgf.tool) && cgf.settings.firstDate === '2022-01-01' && cgf.settings.lastDate === '2027-12-31' && cgf.settings.weekend === 'UAE: Sat + Sun since 2022'
    && cgf.settings.announcedDates === 'on' && !!mbf && /dax-measure-builder\.html/.test(mbf.tool) && mbf.tick.length === 6 && mbf.tick.every((n) => /^Eid al-(Fitr|Adha) Window/.test(n))
    && !/VAR |CALENDAR \(|DEFINE/.test(JSON.stringify(g.fixes)), `gulfCalendar fixes must point to the website tools with the settings, and hold no DAX: ${JSON.stringify(g.fixes).slice(0, 600)}`);
  const ksa = await ask({ path: 'dax-project', country: 'ksa', asOf: ASOF }), wk = find(ksa, 'GC_WEEKEND');
  check(!!wk && wk.count === 626 && wk.items.length > 0 && wk.items.length <= 50 && wk.items[0].date === '2022-01-02' && /Saudi Arabia/.test(wk.title) && /626/.test(wk.why),
    `gulfCalendar, Saudi Arabia on a Saturday-Sunday calendar: ${wk ? wk.count + ' days, first ' + JSON.stringify(wk.items[0]) : short(ksa)}`);
  // (owner 2026-10-03: Saudi Arabia's announced dates 2018-2026 are sourced and match the UAE's, so Saudi Arabia is
  // compared with the announced dates too; before, every country but the UAE was compared with Umm al-Qura)
  check(!ksa.err && !!ksa.j.gulfCalendar && !find(ksa, 'GC_DATES_DIFFER') && !find(ksa, 'GC_DATES_NOTE') && ksa.j.gulfCalendar.datesComparedWith.with === 'uae-announced' && /match Saudi Arabia's for 2018-2026/.test(ksa.j.gulfCalendar.datesComparedWith.note) && g.datesComparedWith.with === 'uae-announced',
    `gulfCalendar, Saudi Arabia's dates are compared with the announced ones: ${short(ksa)}`);
  const none = await ask({ path: 'dax-project', asOf: ASOF });
  check(!none.err && !!none.j.gulfCalendar && none.j.gulfCalendar.country.code === 'uae' && had && JSON.stringify(none.j.gulfCalendar.findings) === JSON.stringify(g.findings), `gulfCalendar without a country, on a model with Hijri columns: ${short(none)}`);
  const late = await ask({ path: 'dax-project', country: 'uae', asOf: '2027-06-01' }), early = find(late, 'GC_ENDS_EARLY');
  check(!!early && early.items[0].calendarEnds === '2027-12-31' && early.items[0].ramadanFrom === '2028-01-28' && early.items[0].hijriYear === 1449 && !find(uae, 'GC_ENDS_EARLY'), `gulfCalendar, a calendar that ends before the next Ramadan: ${short(late)}`);
  // the pack's test model: clean for the UAE; Saudi Arabia: the Fridays and Sundays from 2022 on
  const pack = await ask({ path: 'gulf-pack.bim', country: 'uae', asOf: ASOF });
  check(!pack.err && !!pack.j.gulfCalendar && JSON.stringify(ids(pack)) === '[]' && pack.j.gulfCalendar.calendar.kind === 'dataarcus-dax' && pack.j.gulfCalendar.cantTell.length === 0, `gulfCalendar, the pack's test model, UAE: ${short(pack)}`);
  const packKsa = await ask({ path: 'gulf-pack.bim', country: 'ksa', asOf: ASOF });
  check(!!find(packKsa, 'GC_WEEKEND') && find(packKsa, 'GC_WEEKEND').count === 939, `gulfCalendar, the pack's test model, Saudi Arabia: ${find(packKsa, 'GC_WEEKEND') ? find(packKsa, 'GC_WEEKEND').count : short(packKsa)}`);
  // the dates per country: Saudi Arabia as the UAE (announced); Qatar, Kuwait, Bahrain, Oman have no sourced dates,
  // so a start that differs from Umm al-Qura is only a low note, never a "wrong" finding
  const kAnn = ((packKsa.j && packKsa.j.gulfCalendar && packKsa.j.gulfCalendar.fixes.calendarGenerator) || { settings: {} }).settings.announcedDates;
  check(!packKsa.err && !!packKsa.j.gulfCalendar && JSON.stringify(ids(packKsa)) === '["GC_WEEKEND"]' && /^on\b/.test(String(kAnn)) && /match Saudi Arabia's for 2018-2026/.test(String(kAnn)),
    `gulfCalendar, the pack's test model, Saudi Arabia: only the weekend, and announced dates on with the reason: ${JSON.stringify(ids(packKsa))} / ${kAnn}`);
  const packQat = await ask({ path: 'gulf-pack.bim', country: 'qat', asOf: ASOF }), qn = find(packQat, 'GC_DATES_NOTE');
  const qAnn = ((packQat.j && packQat.j.gulfCalendar && packQat.j.gulfCalendar.fixes.calendarGenerator) || { settings: {} }).settings.announcedDates;
  check(!!qn && qn.level === 'low' && qn.count === 1 && JSON.stringify(qn.items[0]) === JSON.stringify({ event: 'Ramadan 1439', model: '2018-05-17', ummAlQura: '2018-05-16' }) && /official announcement/.test(qn.title + qn.why + qn.fix) && /[\u0600-\u06FF]/.test(qn.ar.title)
    && !find(packQat, 'GC_DATES_DIFFER') && find(packQat, 'GC_WEEKEND').count === 939 && /^your choice/.test(String(qAnn)) && /official announcement/.test(String(qAnn)) && packQat.j.gulfCalendar.datesComparedWith.with === 'umm-al-qura',
    `gulfCalendar, the pack's test model, Qatar: a low note, not a finding: ${short(packQat)} / ${qAnn}`);
  const k18 = await ask({ path: 'gulf-2018.bim', country: 'ksa', asOf: ASOF }), kd = find(k18, 'GC_DATES_DIFFER');
  check(!!kd && kd.count === 1 && JSON.stringify(kd.items[0]) === JSON.stringify({ event: 'Ramadan 1439', model: '2018-05-16', announced: '2018-05-17' }), `gulfCalendar, a calendar without the announced dates, Saudi Arabia: ${kd ? JSON.stringify(kd.items) : short(k18)}`);
  const y18 = await ask({ path: 'gulf-2018.bim', country: 'uae', asOf: ASOF }), dd = find(y18, 'GC_DATES_DIFFER');
  check(!!dd && dd.count === 1 && JSON.stringify(dd.items[0]) === JSON.stringify({ event: 'Ramadan 1439', model: '2018-05-16', announced: '2018-05-17' }), `gulfCalendar, a calendar without the announced dates: ${dd ? JSON.stringify(dd.items) : short(y18)}`);
  // an imported calendar with no Hijri columns: no section unless a country is given
  const bimNo = await ask({ path: 'bim-project', asOf: ASOF }), bimUae = await ask({ path: 'bim-project', country: 'uae', asOf: ASOF });
  check(!bimNo.err && !('gulfCalendar' in bimNo.j), `no gulfCalendar section without a country on a model without Hijri columns: ${short(bimNo)}`);
  check(!!ids(bimUae) && JSON.stringify(ids(bimUae)) === '["GC_NO_HIJRI"]' && bimUae.j.gulfCalendar.calendar.kind === 'imported', `gulfCalendar, an imported calendar without Hijri columns: ${short(bimUae)}`);
  const imp = await ask({ path: 'gulf-imported.bim', asOf: ASOF });
  check(JSON.stringify(ids(imp)) === '["GC_NO_MEASURES"]' && ['weekend', 'dates'].every((c) => imp.j.gulfCalendar.cantTell.some((x) => x.check === c)), `gulfCalendar, an imported calendar with Hijri and weekend columns: ${short(imp)}`);
  const ho = await ask({ path: 'gulf-hijri-only.bim', country: 'uae', asOf: ASOF });
  check(JSON.stringify(ids(ho)) === '["GC_NO_FLAGS","GC_NO_MEASURES"]', `gulfCalendar, Hijri columns only: ${short(ho)}`);
  const nc = await ask({ path: 'gulf-none.bim', country: 'uae', asOf: ASOF });
  check(JSON.stringify(ids(nc)) === '["GC_NO_CALENDAR"]', `gulfCalendar, no calendar: ${short(nc)}`);
  const ow = await ask({ path: 'gulf-other-weekend.bim', country: 'ksa', asOf: ASOF });
  check(!ow.err && !!ow.j.gulfCalendar && !find(ow, 'GC_WEEKEND') && ow.j.gulfCalendar.cantTell.some((x) => x.check === 'weekend'), `gulfCalendar, another form of Is Weekend must be "can't tell", not a finding: ${short(ow)}`);
  const egy = await ask({ path: 'dax-project', country: 'egy' });
  check(egy.err && ['uae', 'ksa', 'qat', 'kwt', 'bhr', 'omn'].every((c) => egy.t.includes(c)), `gulfCalendar, an unknown country must be refused with the list: ${egy.t.slice(0, 200)}`);
  // the country never changes round 2's week start, the score or any finding
  const s0 = await ask({ path: 'sort.bim' }), s1 = await ask({ path: 'sort.bim', country: 'uae', asOf: ASOF });
  check(!s0.err && !s1.err && !!s0.j.fixes.MONTH_SORT.fixScript && JSON.stringify(s0.j.fixes) === JSON.stringify(s1.j.fixes), `gulfCalendar: the country changed the sort or format fixes, or was refused: ${s1.err ? s1.t.slice(0, 120) : ''}`);
  const same = [];
  for (const p of ['dax-project', 'bim-project', 'tmdl-project', 'sample.pbit']) {
    const a = await ask({ path: p }), b = await ask({ path: p, country: 'ksa', asOf: ASOF });
    if (a.err || b.err || JSON.stringify([a.j.score, a.j.stats, a.j.findings, a.j.skipped]) !== JSON.stringify([b.j.score, b.j.stats, b.j.findings, b.j.skipped])) same.push(p);
  }
  check(!same.length, `gulfCalendar: the score or the findings moved with a country on: ${same}`);
}

// ---------- round 4: large models (a summary first, details on request) and fewer measures than KPI cards ----------
{
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + e.message; } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  fs.cpSync(path.join(HERE, 'test-models/large-synthetic/Large Synthetic.SemanticModel'), path.join(ROOT, 'large/Large Synthetic.SemanticModel'), { recursive: true });
  fs.cpSync(path.join(HERE, 'test-models/no-measures'), path.join(ROOT, 'plain'), { recursive: true });
  const cli = path.join(HERE, 'node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js');
  const errors = (dir) => { const p = spawnSync(process.execPath, [cli, 'validate', dir], { encoding: 'utf8' }); try { const d = JSON.parse(p.stdout).data; return d.errorCount + (d.errorCount ? ' (' + Object.keys(d.diagnostics || {}).join(', ') + ')' : ''); } catch (e) { return 'the validator did not run'; } };
  const f = (x) => (x ? `${x.t}[${x.m != null ? x.m : x.c}]` : null);
  const LOGISTICS = ['Shipments[Shipments Total Net Amount]', 'Deliveries[Deliveries Total Tax Amount]', 'Freight Costs[Freight Costs Total Tax Amount]', 'Freight Costs[Freight Costs Units Share %]'];

  // 1. read_model: a large model gets a summary; named tables come in full; small models answer as before
  const big = await ask('read_model', { path: 'large' }), s = big.j || {};
  chk(() => !big.err && big.t.length < 20000 && s.summary === true && s.counts.tables === 300 && s.counts.columns === 3000 && s.counts.measures === 975 && s.counts.relationships === 416 && JSON.stringify(s.dateTables) === '["Calendar"]'
    && s.tablesWithMeasures.length === 65 && s.otherTables.length === 235 && s.areas.some((a) => a.area === 'Logistics' && ['Shipments', 'Shipment Legs', 'Deliveries', 'Freight Costs', 'Returns'].every((t) => a.tables.includes(t))) && /tables/.test(String(s.details)) && !('tables' in s), () => `read_model on a large model must be a summary under 20,000 characters: ${big.err ? big.t.slice(0, 200) : big.t.length + ' characters, keys ' + Object.keys(s)}`);
  const two = await ask('read_model', { path: 'large', tables: ['Shipments', 'carrier', 'Nope'] });
  chk(() => !two.err && two.t.length < 40000 && two.j.tables.map((t) => t.table).join() === 'Shipments,Carrier' && two.j.tables[0].measures.length === 15 && two.j.tables[0].columns.length > 0 && two.j.tables[0].columns.every((c) => /\((string|int64|double|decimal|dateTime|boolean)\)$/.test(c)) && JSON.stringify(two.j.notFound) === '["Nope"]', () => `read_model with tables must return exactly the named tables in full: ${two.err ? two.t.slice(0, 200) : two.j.tables.map((t) => t.table) + ' / notFound ' + JSON.stringify(two.j.notFound)}`);
  const allFacts = big.j && big.j.tablesWithMeasures ? await ask('read_model', { path: 'large', tables: big.j.tablesWithMeasures.map((t) => t.table) }) : { err: true, t: 'no summary' };
  chk(() => !allFacts.err && allFacts.t.length <= 40000 && allFacts.j.tables.length > 10 && allFacts.j.tables.length < 65 && allFacts.j.notShown.length === 65 - allFacts.j.tables.length && /40,000/.test(String(allFacts.j.note)), () => `read_model with more tables than fit must stop at a table and name the rest: ${allFacts.err ? allFacts.t.slice(0, 200) : allFacts.t.length + ' characters, ' + allFacts.j.tables.length + ' tables, notShown ' + (allFacts.j.notShown || []).length}`);
  // read_model's answers on the small fixtures, as main gives them before round 4 (md5 start and length, with the path separator in source as /: Windows writes it as a backslash)
  const SMALL_ANSWERS = { 'tmdl-project': '63cfd0805729:893', 'bim-project': 'ccbcc917fc9e:1344', 'dax-project': '4502344299d5:2099', 'sample.pbit': '7d20d9242374:4518' };
  const small = {};
  for (const p of ['tmdl-project', 'bim-project', 'dax-project', 'sample.pbit']) { const x = await ask('read_model', { path: p }); const t = x.t.split(String.fromCharCode(92, 92)).join('/'); small[p] = x.err ? 'error' : crypto.createHash('md5').update(t).digest('hex').slice(0, 12) + ':' + t.length; }
  chk(() => JSON.stringify(small) === JSON.stringify(SMALL_ANSWERS), () => `read_model on the small fixtures changed: ${JSON.stringify(small)}`);

  // 1b. check_model_health on a large model fits too: a fix script and its list cover maxItems objects, and say so
  const hl = await ask('check_model_health', { path: 'large' }), nf = (hl.j && hl.j.fixes && hl.j.fixes.NO_FORMAT) || {};
  chk(() => !hl.err && hl.t.length < 40000 && nf.suggested.length === 15 && nf.covers && nf.covers.measures === 15 && nf.covers.of > 100 && (nf.fixScript.match(/^\t\tmeasure /gm) || []).length === 15 && /maxItems/.test(String(nf.covers.note)), () => `check_model_health on a large model must stay under 40,000 characters: ${hl.err ? hl.t.slice(0, 200) : hl.t.length + ' characters, covers ' + JSON.stringify(nf.covers)}`);
  const hs = await ask('check_model_health', { path: 'dax-project' });
  chk(() => !hs.err && hs.j.fixes.NO_FORMAT.suggested.length === 5 && !hs.j.fixes.NO_FORMAT.covers, () => `check_model_health on a small model: the fixes must be whole, with no "covers": ${hs.err ? hs.t.slice(0, 200) : JSON.stringify(hs.j.fixes.NO_FORMAT.covers)}`);

  // 2. suggest_fields on a large model: a focus, or nothing is picked
  const noFocus = await ask('suggest_fields', { path: 'large', kpis: 4 });
  chk(() => !noFocus.err && noFocus.j.needsFocus === true && !noFocus.j.kpis && noFocus.j.areas.some((a) => a.area === 'Logistics') && /focus/.test(noFocus.j.why), () => `suggest_fields on a large model without a focus must pick nothing and ask for one: ${noFocus.t.slice(0, 240)}`);
  const lg = await ask('suggest_fields', { path: 'large', kpis: 4, focus: 'logistics' });
  chk(() => !lg.err && JSON.stringify(lg.j.kpis.map(f)) === JSON.stringify(LOGISTICS) && f(lg.j.date) === 'Calendar[Month Name]' && f(lg.j.cats.bar) === 'Carrier[Carrier Group]' && f(lg.j.cats.column) === 'Route[Route Group]'
    && lg.j.slicers.map(f).join() === 'Calendar[Year],Carrier[Carrier Group],Route[Route Group]' && lg.j.scope.tables === 23 && lg.j.scope.focus === 'logistics', () => `suggest_fields with focus "logistics": ${lg.err ? lg.t.slice(0, 200) : JSON.stringify({ kpis: lg.j.kpis.map(f), date: f(lg.j.date), bar: f(lg.j.cats.bar), column: f(lg.j.cats.column), slicers: lg.j.slicers.map(f), scope: lg.j.scope })}`);
  const zz = await ask('suggest_fields', { path: 'large', kpis: 4, focus: 'zzz' });
  chk(() => !zz.err && zz.j.needsFocus === true && !zz.j.kpis && /zzz/.test(zz.j.why) && zz.j.areas.length > 5, () => `suggest_fields with a focus that matches nothing: ${zz.t.slice(0, 240)}`);

  // create_report on a large model follows the same rule
  const th = await ask('generate_theme', { name: 'Round4', preset: 'Corporate', folder: 'themes/r4' }), design = th.j && th.j.design;
  const refused = await ask('create_report', { path: 'large', name: 'Large no focus', design });
  chk(() => refused.err && /focus/.test(refused.t) && !fs.existsSync(path.join(ROOT, 'large', 'Large no focus.Report')), () => `create_report on a large model without a focus must be refused: ${refused.t.slice(0, 200)}`);
  const lr = await ask('create_report', { path: 'large', name: 'Large logistics', design, focus: 'logistics' });
  {
    const dir = lr.err ? null : path.join(ROOT, 'large', lr.j.report), cards = dir ? readReport(dir)[0].visuals.filter((v) => v.type === 'cardVisual').sort((a, b) => a.x - b.x) : [];
    const on = cards.map((v) => { const p = JSON.parse(v.text).visual.query.queryState.Data.projections[0]; return p.queryRef.replace('.', '[') + ']'; });
    chk(() => !lr.err && JSON.stringify(on) === JSON.stringify(LOGISTICS) && errors(dir) === '0' && !(lr.j.modelNotes || []).some((n) => /Margin\]$/.test(n.field)), () => `create_report on a large model with focus "logistics": ${lr.err ? lr.t.slice(0, 200) : 'cards ' + JSON.stringify(on) + ', validator ' + errors(dir)}`);
  }

  // 3. fewer measures than KPI cards: fewer cards, never an empty one
  for (const [n, slots] of [[0, 0], [1, 1], [2, 2]]) {
    const p = await ask('plan_layout', { design, layout: 'exec', kpis: n });
    chk(() => !p.err && p.j.slots.filter((x) => x.kind === 'kpi').length === slots && p.j.slots.every((x) => x.w > 0 && x.h > 0 && x.y + x.h <= p.j.page.h + 1), () => `plan_layout with ${n} KPI cards: ${p.err ? p.t.slice(0, 160) : p.j.slots.filter((x) => x.kind === 'kpi').length + ' KPI slots'}`);
  }
  const seven = await ask('plan_layout', { design, kpis: 7 });
  chk(() => seven.err && /kpis/.test(seven.t), () => `plan_layout with 7 KPI cards must still be refused: ${seven.t.slice(0, 160)}`);
  const cardsOf = (dir) => readReport(dir).map((pg) => pg.visuals.filter((v) => v.type === 'cardVisual'));
  const noField = (dir) => readReport(dir).reduce((l, pg) => l.concat(pg.visuals.filter((v) => /^(cardVisual|card|kpi)$/.test(v.type) && !/"queryState"/.test(v.text)).map((v) => v.type)), []);
  const two4 = await ask('create_report', { path: 'bim-project', name: 'Two cards', design, layout: 'exec', kpis: 4 });
  {
    const dir = two4.err ? null : path.join(ROOT, 'bim-project', two4.j.report), per = dir ? cardsOf(dir).slice(0, 2).map((c) => c.length) : [], k = (two4.j && two4.j.kpiCards) || {};
    chk(() => !two4.err && per.join() === '2,2' && k.asked === 4 && k.built === 2 && k.measures.length === 2 && /2 measures/.test(k.why) && (two4.j.reportNotes || []).some((x) => /KPI/.test(x)), () => `a model with 2 measures and a 4-card design: cards per page ${per}, kpiCards ${JSON.stringify(two4.j ? two4.j.kpiCards : two4.t.slice(0, 200))}`);
    chk(() => !two4.err && noField(dir).length === 0 && errors(dir) === '0', () => `a model with 2 measures: ${dir ? noField(dir).length + ' cards without a field, validator ' + errors(dir) : two4.t.slice(0, 200)}`);
  }
  const zero = await ask('create_report', { path: 'plain', name: 'No measures', design, layout: 'exec', kpis: 4 });
  {
    const dir = zero.err ? null : path.join(ROOT, 'plain', zero.j.report), k = (zero.j && zero.j.kpiCards) || {};
    chk(() => !zero.err && cardsOf(dir).every((c) => c.length === 0) && noField(dir).length === 0 && errors(dir) === '0' && k.asked === 4 && k.built === 0 && /no measures/.test(k.why) && k.leftOutVisuals.length > 0
      && readReport(dir).every((pg) => pg.visuals.every((v) => !/Chart$|^gauge$|^funnel$|^treemap$|^map$/.test(v.type))), () => `a model with no measures: ${zero.err ? zero.t.slice(0, 200) : 'cards ' + cardsOf(dir).map((c) => c.length) + ', validator ' + errors(dir) + ', kpiCards ' + JSON.stringify(zero.j.kpiCards)}`);
  }
  const hand = await ask('create_report', { path: 'bim-project', name: 'Hand cards', pages: [{ name: 'P', slots: [0, 1, 2, 3].map((i) => ({ kind: 'kpi', title: 'K' + (i + 1), x: 24 + i * 300, y: 24, w: 280, h: 120 })).concat([{ kind: 'bar', x: 24, y: 170, w: 900, h: 400 }]) }] });
  {
    const dir = hand.err ? null : path.join(ROOT, 'bim-project', hand.j.report), k = (hand.j && hand.j.kpiCards) || {};
    chk(() => !hand.err && cardsOf(dir)[0].length === 2 && noField(dir).length === 0 && k.asked === 4 && k.built === 2 && JSON.stringify(k.leftOut) === '["K3","K4"]', () => `hand-placed KPI slots beyond the measures: ${hand.err ? hand.t.slice(0, 200) : cardsOf(dir)[0].length + ' cards, kpiCards ' + JSON.stringify(hand.j.kpiCards)}`);
  }

  // 4. a money measure named "Margin" is not a percentage; one that divides, or says %, is
  {
    const mq = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"Date"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
    fs.mkdirSync(path.join(ROOT, 'margin-project/Margin.SemanticModel'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'margin-project/Margin.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
      { name: 'Sales', columns: [col('Region', 'string'), col('Amount', 'double'), col('Margin', 'double')], partitions: mq('Sales'),
        measures: [{ name: 'Total Margin', expression: 'SUM ( Sales[Margin] )' }, { name: 'Net Margin', expression: 'SUM ( Sales[Margin] )', formatString: '#,0' }, { name: 'Gross Margin', expression: 'DIVIDE ( SUM ( Sales[Margin] ), SUM ( Sales[Amount] ) )' },
          { name: 'Margin %', expression: ['DIVIDE (', '    [Total Margin],', '    SUM ( Sales[Amount] )', ')'] }] }] } }));
    const mr = await ask('create_report', { path: 'margin-project', name: 'Margins', design, layout: 'exec', kpis: 4 });
    const flagged = mr.err ? null : (mr.j.modelNotes || []).filter((n) => /percentage/.test(n.issue)).map((n) => n.field).sort();
    chk(() => !mr.err && JSON.stringify(flagged) === JSON.stringify(['Sales[Gross Margin]', 'Sales[Margin %]']), () => `"Margin" as a percentage: flagged ${mr.err ? mr.t.slice(0, 200) : JSON.stringify(flagged)} (want Gross Margin and Margin % only)`);
    const ms = await ask('suggest_fields', { path: 'margin-project', kpis: 3 });
    chk(() => !ms.err && ms.j.kpis.slice(0, 2).map(f).join() === 'Sales[Total Margin],Sales[Net Margin]' && /Gross Margin|Margin %/.test(f(ms.j.kpis[2])) && /Gross Margin|Margin %/.test(f(ms.j.y.gauge)), () => `"Margin" as a percentage, the picks: ${ms.err ? ms.t.slice(0, 200) : JSON.stringify({ kpis: ms.j.kpis.map(f), gauge: f(ms.j.y.gauge) })} (want the two money margins first, a ratio third and on the gauge)`);
  }
}

await client.close();
fs.rmSync(ROOT, { recursive: true, force: true });
console.log(problems.length ? `FAIL  mcp  ${checks} checks\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  mcp  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
