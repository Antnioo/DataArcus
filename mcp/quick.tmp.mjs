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
// (round 17, the outside review's G-02: answers give paths relative to the working folder, never absolute. The checks
// open the files the answers name, so a relative path that is not a file here is read from the working folder)
fs.__exists = ((e) => (p) => { try { return e(p); } catch (x) { return false; } })(fs.existsSync.bind(fs));
for (const fn of ['readFileSync', 'existsSync', 'statSync', 'lstatSync', 'readdirSync']) {
  const orig = fs[fn].bind(fs);
  fs[fn] = (p, ...rest) => (typeof p === 'string' && !path.isAbsolute(p) && !fs.__exists(p) && fs.__exists(path.join(ROOT, p)) ? orig(path.join(ROOT, p), ...rest) : orig(p, ...rest));
}
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
// every report the main client creates, validated once at the end (round 17, the outside review's G-13)
const createdReports = new Set();
const call = async (name, args) => { const r = await client.callTool({ name, arguments: args }); const t = r.content[0].text; const j = r.isError ? null : JSON.parse(t);
  if (name === 'create_report' && j && j.report && j.open) createdReports.add(path.join(ROOT, path.dirname(j.open), j.report));
  return { err: !!r.isError, t, j }; };
const hash = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');
// round 5: a fix script is in a new file in the working folder, never in the answer; the tests read the file
const scriptOf = (fix) => { try { return fix && fix.fixScriptFile ? fs.readFileSync(fix.fixScriptFile, 'utf8') : ''; } catch (e) { return ''; } };

const tools = (await client.listTools()).tools.map((t) => t.name).sort();
check(tools.join() === 'add_gulf_calendar,check_model_health,create_report,generate_theme,plan_layout,read_model,suggest_fields', `tools: ${tools}`);

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
  check(!plainRun.err && /sortByColumn: 'Month Number'/.test(scriptOf(ms)) && /WEEKDAY \( 'Calendar'\[Date\], 1 \)/.test(scriptOf(ms)) && ms.weekStart === 'sunday' && /TMDL view/.test(String(ms.howToApply))
    && (ms.byHand || []).length === 1 && ms.byHand[0].column === 'Calendar[Hijri Month Name]', `health fixes, sort: ${plainRun.err ? plainRun.t.slice(0, 200) : JSON.stringify(ms).slice(0, 500)}`);
  check(JSON.stringify((nf.suggested || []).map((x) => [x.measure, x.format])) === JSON.stringify([['[Total Sales]', '#,0'], ['[Units]', '#,0'], ['[Orders]', '#,0'], ['[Margin %]', '0.0%']]) /* (round 14, the laptop's proof on 6 Oct: an unformatted SUM shows no decimals, #,0; it was #,0.00 since 12b, which put 14,178.00 in the sample's tables) */ && (nf.suggested || []).every((x) => x.reason)
    && !!scriptOf(nf) && !/Has Format|Return Rate/.test(scriptOf(nf)) && /never applied/i.test(String(nf.howToApply)), `health fixes, formats: ${JSON.stringify(nf).slice(0, 500)}`);
  check((pf.suggested || []).length === 1 && pf.suggested[0].measure === '[Return Rate]' && pf.suggested[0].format === '0.0%', `health fixes, a rate formatted as a number: ${JSON.stringify(pf).slice(0, 300)}`);
  // the week start is a choice: Monday (the UAE's Saturday-Sunday weekend) and Saturday change the weekday expression only
  for (const [ws, want] of [['monday', "WEEKDAY ( 'Calendar'[Date], 2 )"], ['saturday', "MOD ( WEEKDAY ( 'Calendar'[Date], 1 ), 7 ) + 1"]]) {
    const o = await call('check_model_health', { path: 'sort.bim', weekStart: ws });
    const a = scriptOf(((o.j || {}).fixes || {}).MONTH_SORT).split('\n'), b = scriptOf(ms).split('\n'), diff = a.filter((l, i) => l !== b[i]);
    check(!o.err && a.length === b.length && diff.length === 1 && diff[0].trim() === want && o.j.fixes.MONTH_SORT.weekStart === ws, `health fixes, week starting ${ws}: ${o.err ? o.t.slice(0, 200) : JSON.stringify(diff).slice(0, 200)}`);
    check(!o.err && JSON.stringify([o.j.score, o.j.findings]) === JSON.stringify([plainRun.j.score, plainRun.j.findings]), `health fixes, week starting ${ws}: the score or the findings moved`);
  }
  // a DAX table's columns are never rewritten by a script: steps by hand, naming the sort column
  const dx = await call('check_model_health', { path: 'dax-project', maxItems: 200 });
  const dms = dx.err ? {} : (dx.j.fixes || {}).MONTH_SORT || {};
  const skippedSort = dx.err ? [] : (((dx.j.skipped || {}).checks || []).find((c) => c.id === 'MONTH_SORT') || {}).items || [];
  check(!dx.err && !dms.fixScriptFile && (dms.byHand || []).some((h) => h.column === 'Calendar[Month Name]' && /Sort by column > Month Number/.test(h.steps)) && (dms.byHand || []).some((h) => h.column === 'Calendar[Day Name]' && /Sort by column > Day of Week/.test(h.steps)),
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
  // (round 19: report-level measures, Schema "extension", are skipped below: they are the report's, not the model's)
  const has = (k, t, n) => model.some((x) => x.name === t && (k === 'Measure' ? x.measures || [] : x.columns).some((c) => c.name === n));
  const refs = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name === 'visual.json') JSON.stringify(JSON.parse(fs.readFileSync(f, 'utf8')), (k, v) => { if (v && (v.Column || v.Measure) && (v.Column || v.Measure).Expression && (v.Column || v.Measure).Expression.SourceRef.Schema !== 'extension') refs.push([v.Column ? 'Column' : 'Measure', (v.Column || v.Measure).Expression.SourceRef.Entity, (v.Column || v.Measure).Property]); return v; }); });
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
// ---------- round 18 (6 Oct night, the laptop): three things Desktop showed in the rounds 15-17 proof ----------
{
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"Day"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
  const mk = (dir, cols) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double')].concat(cols.map((n) => col(n, 'string'))),
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }, { name: 'Margin %', expression: 'DIVIDE ( 1, 2 )', formatString: '0.0%' }] }] } })); };
  const vis = (dir, x) => { if (x.err) return []; const def = path.join(ROOT, dir, x.j.report, 'definition', 'pages'), o = JSON.parse(fs.readFileSync(path.join(def, 'pages.json'), 'utf8')).pageOrder[0];
    return fs.readdirSync(path.join(def, o, 'visuals')).map((v) => JSON.parse(fs.readFileSync(path.join(def, o, 'visuals', v, 'visual.json'), 'utf8'))).filter((v) => v.visual); };
  const catOf = (v) => v.visual.query.queryState.Category.projections[0].queryRef, ty = (v) => v.visual.visualType;
  // 1. (check 9, FAIL in Desktop: on a model with Region, Channel and Product the operations layout's two bar charts were
  //    both by Region, the donut by Channel and the column chart by Product: the column chart took the third column
  //    before the second bar chart had its turn.) The bar charts and the donut come first, in reading order, each by
  //    a category the page has not used; the column chart takes what is left and repeats only when nothing is.
  {
    mk('r18-three', ['Region', 'Channel', 'Product']); mk('r18-two', ['Region', 'Channel']);
    const ops = async (dir) => ask('create_report', { path: dir, name: 'R18 ops', secondPage: false, design: (await ask('plan_layout', { layout: 'ops', kpis: 3, filters: 'top' })).j.design });
    const three = vis('r18-three', await ops('r18-three')), two = vis('r18-two', await ops('r18-two'));
    const pick = (vs) => ({ bars: vs.filter((v) => ty(v) === 'clusteredBarChart').sort((p, q) => p.position.y - q.position.y).map(catOf), donut: vs.filter((v) => ty(v) === 'donutChart').map(catOf), column: vs.filter((v) => ty(v) === 'clusteredColumnChart').map(catOf) });
    chk(() => { const p = pick(three); return p.bars.length === 2 && new Set(p.bars.concat(p.donut)).size === 3 && p.bars[0] === 'Sales.Region' && p.donut[0] === 'Sales.Channel' && p.bars[1] === 'Sales.Product' && p.column.length === 1; },
      () => `three text columns: the two bar charts and the donut must each take a different one (Region, Channel, Product): ${JSON.stringify(pick(three))}`);
    chk(() => { const p = pick(two); return p.bars[0] === 'Sales.Region' && p.donut[0] === 'Sales.Channel' && p.bars.length === 2; }, () => `two text columns: bar by Region, donut by Channel, as before: ${JSON.stringify(pick(two))}`);
  }
  // 2. (seen in Desktop: the Arabic slide-in panel's Filters button read "الفلاتر ☰" with the ☰ at the left of the word, the
  //    reading end.) In a right-to-left report the ☰ is written after the word, so the left-to-right button draws it at
  //    the right, the reading start; English keeps "☰  Filters".
  {
    mk('r18-panel', ['Region', 'Channel']);
    const btn = async (lang) => { const x = await ask('create_report', { path: 'r18-panel', name: 'R18 panel ' + lang, lang, slidePanel: true, secondPage: false, design: (await ask('plan_layout', { layout: 'exec', kpis: 3, filters: 'end', lang })).j.design });
      return vis('r18-panel', x).filter((v) => ty(v) === 'actionButton').map((v) => JSON.stringify(v.visual.objects.text)).map((s) => (s.match(/'([^']*\u2630[^']*)'/) || [])[1]).filter(Boolean); };
    const en = await btn('en'), ar = await btn('ar');
    chk(() => en.length === 1 && /^\u2630\s+Filters$/.test(en[0]) && ar.length === 1 && /^[\u0600-\u06FF]+\s+\u2630$/.test(ar[0]), () => `the Filters button: "☰  Filters" in English, the word then ☰ in Arabic: ${JSON.stringify([en, ar])}`);
  }
  // 3. (seen in Desktop, "P4 ring EN": a 64 x 64 ring as a table picture in a 221-high table at 1280 x 720: the rows
  //    came 66 apart (the picture + 2), the first 68 under the table's top, so one and a half rows showed.) A table
  //    picture is no taller than lets four rows and the total show: (the table's height - 68 x the page's scale) / 5 - 2,
  //    24 at least.
  {
    mk('r18-pic', ['Region', 'Channel']);
    const ring = { w: 64, h: 64, values: [{ id: 'p', label: 'Margin', kind: 'measure', measure: 'Sales[Margin %]' }], layers: [{ type: 'ring', cx: 32, cy: 32, r: 24, sw: 8, bind: { p: { v: 'p', d0: 0, d1: 1 } } }] };
    const x = await ask('create_report', { path: 'r18-pic', name: 'R18 pic', secondPage: false, design: (await ask('plan_layout', { layout: 'exec', kpis: 3, filters: 'end', page: '1280x720' })).j.design, fields: { table: ['Sales[Region]', 'Sales[Total Sales]'] }, svgColumns: [{ label: 'Ring col', design: ring }] });
    const t = vis('r18-pic', x).find((v) => ty(v) === 'tableEx'), H = t ? parseFloat(t.visual.objects.grid[0].properties.imageHeight.expr.Literal.Value) : NaN;
    chk(() => H >= 24 && 68 + 5 * (H + 2) <= t.position.height, () => `a table picture must leave room for four rows and the total: imageHeight ${H} in a table ${t && t.position.height} high (68 + 5 x (H + 2) = ${68 + 5 * (H + 2)}) ${x.err ? x.t.slice(0, 200) : ''}`);
  }
  // 2b. The owner's answer (6 Oct ~20:51 Dubai, "yes drop the number under 40"; S2 in Desktop: the number inside a 28-high
  //     ring could not be read): a ring drawn under 40 high in a table has no number inside; at 40 or more it keeps it.
  //     (KPI-card rings have had none since round 15: their checks stand unchanged.)
  {
    mk('r18-ring', ['Region', 'Channel']);
    const ring = { w: 64, h: 64, values: [{ id: 'p', label: 'Margin', kind: 'measure', measure: 'Sales[Margin %]' }], layers: [{ type: 'ring', cx: 32, cy: 32, r: 24, sw: 8, bind: { p: { v: 'p', d0: 0, d1: 1 } } },
      { type: 'text', x: 32, y: 36, size: 12, anchor: 'middle', bind: { text: { v: 'p' } } }] };
    const ext = (x) => x.err ? '' : fs.readFileSync(path.join(ROOT, 'r18-ring', x.j.report, 'definition', 'reportExtensions.json'), 'utf8');
    const small = await ask('create_report', { path: 'r18-ring', name: 'R18 ring small', secondPage: false, design: (await ask('plan_layout', { layout: 'exec', kpis: 3, filters: 'end', page: '1280x720' })).j.design, fields: { table: ['Sales[Region]', 'Sales[Total Sales]', 'Sales[Margin %]'] }, svgColumns: [{ label: 'Ring col', design: ring }] });
    const big = await ask('create_report', { path: 'r18-ring', name: 'R18 ring big', fields: { kpis: ['Sales[Total Sales]'], table: ['Sales[Region]', 'Sales[Total Sales]', 'Sales[Margin %]'] }, svgColumns: [{ label: 'Ring col', design: ring }],
      pages: [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'title', x: 36, y: 18, w: 840, h: 48 }, { kind: 'table', x: 36, y: 100, w: 800, h: 560, title: 'T' }] }] });
    const hOf = (x, dir) => { if (x.err) return NaN; const t = vis(dir, x).find((v) => ty(v) === 'tableEx'); return t ? parseFloat(t.visual.objects.grid[0].properties.imageHeight.expr.Literal.Value) : NaN; };
    const hs = hOf(small, 'r18-ring'), hb = hOf(big, 'r18-ring');
    chk(() => hs < 40 && !/<text/.test(ext(small)) && /<circle/.test(ext(small)) && /no number inside/.test(JSON.stringify(small.j)), () => `a ring drawn ${hs} high in a table must have no number inside (and be told): ${ext(small).slice(0, 200)} ${small.err ? small.t.slice(0, 300) : ''}`);
    chk(() => hb >= 40 && /<text/.test(ext(big)), () => `a ring drawn ${hb} high in a table keeps its number: ${big.err ? big.t.slice(0, 300) : ext(big).slice(0, 200)}`);
  }
  // S3 (the owner's yes, 6 Oct ~21:38 Dubai: "add the short day name column"; seen in Desktop: day names slant on the
  //     1920 x 1080 column charts): the Gulf calendar has "Day Short" (Sun ... Sat, sorted by Day of Week); a column chart
  //     by Day Name takes it where the model has it and the full names would slant; a table keeps Day Name; a model
  //     without it is unchanged
  {
    const sdir = 'r18-short', calOf = (short) => ({ name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime'), col('Day of Week', 'int64'), Object.assign(col('Day Name', 'string'), { sortByColumn: 'Day of Week' })]
      .concat(short ? [Object.assign(col('Day Short', 'string'), { sortByColumn: 'Day of Week' })] : []) });
    for (const [dir, short] of [[sdir, true], [sdir + '-none', false]]) { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true });
      fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [calOf(short), { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Date', 'dateTime')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }] } })); }
    const mkRep = (dir) => ask('create_report', { path: dir, name: 'R18 days', fields: { kpis: ['Sales[Total Sales]'], measure: 'Sales[Total Sales]', category: 'Calendar[Day Name]', table: ['Calendar[Day Name]', 'Sales[Total Sales]'] },
      pages: [{ name: 'P', slots: [{ kind: 'title', x: 36, y: 18, w: 840, h: 48 }, { kind: 'column', x: 36, y: 100, w: 600, h: 400, title: 'C' }, { kind: 'table', x: 700, y: 100, w: 600, h: 400, title: 'T' }] }] });
    const a = await mkRep(sdir), b = await mkRep(sdir + '-none');
    const look = (dir, x) => { if (x.err) return {}; const vs = vis(dir, x), c = vs.find((v) => ty(v) === 'clusteredColumnChart' || ty(v) === 'clusteredBarChart'), t = vs.find((v) => ty(v) === 'tableEx');
      return { col: c && catOf(c), type: c && ty(c), sort: c && JSON.stringify(c.visual.query.sortDefinition || null), table: t && t.visual.query.queryState.Values.projections.map((p) => p.queryRef), note: /Day Short \(Sun/.test(JSON.stringify(x.j)) }; };
    const la = look(sdir, a), lb = look(sdir + '-none', b);
    chk(() => la.col === 'Calendar.Day Short' && la.type === 'clusteredColumnChart' && la.table.includes('Calendar.Day Name') && !la.table.includes('Calendar.Day Short') && la.note, () => `with Day Short: the column chart by Day Short, the table by Day Name, told: ${JSON.stringify(la)} ${a.err ? a.t.slice(0, 300) : ''}`);
    // (round 19, item 2: without Day Short the slanting chart is now a bar chart by Day Name; before, a column chart)
    chk(() => lb.col === 'Calendar.Day Name' && lb.type === 'clusteredBarChart' && !lb.note, () => `without Day Short: by Day Name, as a bar chart since round 19: ${JSON.stringify(lb)} ${b.err ? b.t.slice(0, 300) : ''}`);
  }
  // Round 19, item 2 (seen in Desktop, golden tasks 1 and 4:3: day names slant on the column charts of models without a
  //     "Day Short"): where a column chart's day or month names would slant (the widest name at the label size wider
  //     than a seventh/twelfth of the plot) and the slot is tall enough for one bar per name (22 + 46 at 1280 x 720,
  //     measured in round 0), the chart is drawn as a bar chart, whose names are level; told in reportNotes
  {
    const run = async (dir, short, h) => { const x = await ask('create_report', { path: dir, name: 'R19 bars ' + h, fields: { kpis: ['Sales[Total Sales]'], measure: 'Sales[Total Sales]', category: 'Calendar[Day Name]', table: ['Calendar[Day Name]', 'Sales[Total Sales]'] },
      pages: [{ name: 'P', slots: [{ kind: 'title', x: 36, y: 18, w: 840, h: 48 }, { kind: 'column', x: 36, y: 100, w: 600, h, title: 'C' }] }] });
      const vs = vis(dir, x); return { types: vs.map(ty).filter((t) => /Chart$/.test(t)), cat: (vs.find((v) => /Chart$/.test(ty(v))) || null), note: /bar chart/.test(JSON.stringify(x.err ? '' : x.j.reportNotes || '')), err: x.err ? x.t.slice(0, 200) : '' }; };
    const tall = await run('r18-short-none', false, 500), low = await run('r18-short-none', false, 150), withShort = await run('r18-short', true, 500);
    chk(() => tall.types.join() === 'clusteredBarChart' && catOf(tall.cat) === 'Calendar.Day Name' && tall.note, () => `no Day Short, a tall slot: a bar chart by Day Name, told: ${JSON.stringify(tall.types)} ${tall.note} ${tall.err}`);
    chk(() => low.types.join() === 'clusteredColumnChart', () => `no Day Short, a slot too low for seven bars (150): the column chart stays: ${JSON.stringify(low.types)} ${low.err}`);
    chk(() => withShort.types.join() === 'clusteredColumnChart' && catOf(withShort.cat) === 'Calendar.Day Short', () => `with Day Short: the column chart by Day Short (round 18): ${JSON.stringify(withShort.types)} ${withShort.err}`);
  }
  // Round 19, item 3 (the owner's choice B, 6 Oct; golden task 5 at 640 x 360: cut card values, "Wednes...", a scrolling
  //     table): below 800 wide the executive layout is not used: the plan takes the single-focus layout (one large
  //     chart, no table) and says so; at 800 or more nothing changes
  {
    const small = await ask('plan_layout', { layout: 'exec', kpis: 3, filters: 'none', page: { w: 640, h: 360 } }), wide = await ask('plan_layout', { layout: 'exec', kpis: 3, filters: 'none', page: { w: 960, h: 720 } });
    const kinds = (x) => x.err ? [] : x.j.slots.map((s) => s.kind);
    chk(() => !small.err && small.j.design.layout.preset === 'focus' && !kinds(small).includes('table') && /under 800/.test(JSON.stringify(small.j.smallPage || '')), () => `640 x 360: the single-focus layout, told: ${JSON.stringify(kinds(small))} ${small.err ? small.t.slice(0, 200) : JSON.stringify(small.j.smallPage || null)}`);
    chk(() => !wide.err && wide.j.design.layout.preset === 'exec' && kinds(wide).includes('table') && !wide.j.smallPage, () => `960 x 720: the executive layout as asked: ${JSON.stringify(kinds(wide))}`);
  }
  // Round 19, item 7 (the owner's idea, 6 Oct): "No data for this selection" where a chart's or table's measure is blank:
  //     a report-level measure (reportExtensions, the model untouched) IF ( ISBLANK ( [m] ), text, "" ) on a card in the
  //     same box one layer below the chart (lower z), its tooltip off, not on the phone; the chart above it see-through
  //     (no background, border or shadow of its own) so the card's panel shows; Arabic text in Arabic; noDataMessage: false
  //     writes none (round 19: opt-in, noDataMessage: true, until proven in Desktop; without it none is written)
  {
    mk('r19-nodata', ['Region', 'Channel']);
    const one = async (lang, on) => { const x = await ask('create_report', { path: 'r19-nodata', name: `R19 nodata ${lang} ${on}`, lang, secondPage: false, ...(on ? { noDataMessage: true } : {}), design: (await ask('plan_layout', { layout: 'exec', kpis: 3, filters: 'end', lang })).j.design });
      if (x.err) return { err: x.t.slice(0, 300) };
      const vs = vis('r19-nodata', x), ext = (() => { try { return fs.readFileSync(path.join(ROOT, 'r19-nodata', x.j.report, 'definition', 'reportExtensions.json'), 'utf8'); } catch (e) { return ''; } })();
      const charts = vs.filter((v) => ['clusteredBarChart', 'clusteredColumnChart', 'lineChart', 'donutChart', 'tableEx'].includes(ty(v)));
      const pos = (v) => v.position, under = (c) => vs.find((v) => v !== c && ty(v) === 'cardVisual' && JSON.stringify(v.visual.query || '').includes('"Schema":"extension"') && pos(v).x === pos(c).x && pos(v).y === pos(c).y && pos(v).width === pos(c).width && pos(v).height === pos(c).height && pos(v).z < pos(c).z);
      const pairs = charts.map((c) => ({ c, m: under(c) }));
      const seeThrough = (c) => JSON.stringify((c.visual.visualContainerObjects || {}).background || '').includes('false');
      const tipOff = (m) => m && JSON.stringify((m.visual.visualContainerObjects || {}).visualTooltip || '').includes('false');
      const def = path.join(ROOT, 'r19-nodata', x.j.report, 'definition', 'pages'), pg = JSON.parse(fs.readFileSync(path.join(def, 'pages.json'), 'utf8')).pageOrder[0];
      const mobile = fs.readdirSync(path.join(def, pg, 'visuals')).filter((d) => fs.existsSync(path.join(def, pg, 'visuals', d, 'mobile.json')));
      return { charts: charts.length, paired: pairs.filter((p) => p.m).length, seeThrough: pairs.filter((p) => p.m && seeThrough(p.c)).length, tipOff: pairs.filter((p) => tipOff(p.m)).length,
        ext: /IF \( ISBLANK \(/.test(ext), en: ext.includes('No data for this selection'), ar: ext.includes('لا توجد بيانات لهذا الاختيار'), phone: pairs.filter((p) => p.m && mobile.includes(p.m.name)).length }; };
    const en = await one('en', true), ar = await one('ar', true), off = await one('en', false);
    chk(() => en.charts >= 3 && en.paired === en.charts && en.seeThrough === en.charts && en.tipOff === en.charts && en.ext && en.en && en.phone === 0, () => `English: every chart and table has its "No data" card below it: ${JSON.stringify(en)}`);
    chk(() => ar.paired === ar.charts && ar.charts >= 3 && ar.ar, () => `Arabic: the message in Arabic: ${JSON.stringify(ar)}`);
    chk(() => off.charts >= 3 && off.paired === 0, () => `without noDataMessage: true no message cards: ${JSON.stringify(off)}`);
  }
  // 4. (check 12, FAIL in Desktop: "P7 hand EN", a hand-placed matrix of Day Name and four long measures in a 420 x 220
  //    slot, had a horizontal scrollbar, the third header cut, and showed three of the seven days and the total.) Cause:
  //    the fit chose a smaller text to keep more measures and counted the rows at that size, but wrote the size only on a
  //    table, so the matrix drew at the theme's size: wider than its box, and its rows taller than counted. The matrix
  //    now gets the table's rules in full: the size the fit chose on its values, headers, row headers and total; only the
  //    measures its width holds (the others named in tableColumns); tight rows where seven rows and the total need them;
  //    and the answer says so when even that does not fit. At 1280 x 720 and 1920 x 1080, English and Arabic.
  {
    const req = (await import('node:module')).createRequire(import.meta.url), Px = req('../assets/js/pbip-export.js');
    const visuals = (p, report) => { const out = []; const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((f) => { const q = path.join(d, f.name); if (f.isDirectory()) walk(q); else if (f.name === 'visual.json') out.push(JSON.parse(fs.readFileSync(q, 'utf8'))); }); walk(path.join(ROOT, p, report, 'definition', 'pages')); return out; };
    const dir = 'r18-matrix', base = path.join(ROOT, dir, 'M.SemanticModel');
    fs.mkdirSync(base, { recursive: true });
    fs.writeFileSync(path.join(base, 'model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
      { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime'), col('Day Name', 'string'), col('Day of Week', 'int64')] },
      { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Date', 'dateTime')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' },
        { name: 'Total Sales Last Ramadan', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Total Sales This Ramadan To Date', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' },
        { name: 'Average Daily Sales In Ramadan', expression: 'DIVIDE ( 1, 2 )', formatString: '#,0.00' }] }] } }));
    const lit = (o, k) => { const e = ((o || {})[k] || [])[0]; return e && e.properties.fontSize ? parseFloat(e.properties.fontSize.expr.Literal.Value) : null; };
    const themeOf = (rep) => { let th = null; const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((f) => { const q = path.join(d, f.name); if (f.isDirectory()) walk(q); else if (!th && /\.json$/.test(f.name)) { const j = JSON.parse(fs.readFileSync(q, 'utf8')); if (j && j.textClasses && j.visualStyles) th = j; } }); walk(rep); return th; };
    // the theme's sizes for each page, as the design engine writes them (x 1.5 on 1920 x 1080: tables 15, titles 18);
    // "P7 hand EN" drew 15pt rows: three days and the total in 220 is 36 + 16 + 37 + a scrollbar + 4 x 30
    const sz = (k) => { const g = { values: [{ fontSize: 10 * k }], columnHeaders: [{ fontSize: 10 * k }], total: [{ fontSize: 10 * k }] };
      return { textClasses: { title: { fontSize: 12 * k }, label: { fontSize: 10 * k }, callout: { fontSize: 28 * k } }, visualStyles: { tableEx: { '*': g }, pivotTable: { '*': Object.assign({ rowHeaders: [{ fontSize: 10 * k }] }, g) } } }; };
    for (const k of [1, 1.5]) fs.writeFileSync(path.join(ROOT, dir, `theme-${k}.json`), JSON.stringify(Object.assign({ name: `theme-${k}.json` }, sz(k))));
    // (round 19, item 9: a second set of four shorter measure names, where the drawn size holds more than the width's)
    const SETS = [['Sales[Total Sales]', 'Sales[Total Sales Last Ramadan]', 'Sales[Total Sales This Ramadan To Date]', 'Sales[Average Daily Sales In Ramadan]'], ['Sales[Total Sales]', 'Sales[Sales LY]', 'Sales[Sales Growth]', 'Sales[Sales Target]']];
    const mdl = JSON.parse(fs.readFileSync(path.join(base, 'model.bim'), 'utf8')); mdl.model.tables[1].measures.push(...['Sales LY', 'Sales Growth', 'Sales Target'].map((n) => ({ name: n, expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }))); fs.writeFileSync(path.join(base, 'model.bim'), JSON.stringify(mdl));
    for (const [si, set] of SETS.entries()) for (const [W, H, lang] of [[1280, 720, 'en'], [1280, 720, 'ar'], [1920, 1080, 'en'], [1920, 1080, 'ar']]) {
      const x = await ask('create_report', { path: dir, name: `R18 matrix ${lang} ${W} ${si}`, lang, rtl: lang === 'ar', theme: `${dir}/theme-${W === 1920 ? 1.5 : 1}.json`, fields: { kpis: ['Sales[Total Sales]'], table: ['Calendar[Day Name]'].concat(set) },
        pages: [{ name: 'P', width: W, height: H, slots: [{ kind: 'title', x: 36, y: 18, w: 840, h: 48 }, { kind: 'matrix', x: 36, y: 100, w: 420, h: 220, title: 'M' }] }] });
      const m = x.err ? null : visuals(dir, x.j.report).find((v) => v.visual && v.visual.visualType === 'pivotTable'), o = (m && m.visual.objects) || {};
      const th = x.err ? null : themeOf(path.join(ROOT, dir, x.j.report)), T0 = th ? +(((th.visualStyles.pivotTable || {})['*'] || {}).values || [{}])[0].fontSize || 10 : 10, TITLE = th ? +(th.textClasses.title || {}).fontSize || 12 : 12;
      const sizes = ['values', 'columnHeaders', 'rowHeaders', 'total'].map((k) => lit(o, k)), T = sizes[0] || T0;
      const ps = m ? m.visual.query.queryState.Rows.projections.concat(m.visual.query.queryState.Values.projections).filter((p) => !/^Min\(/.test(p.queryRef)) : [];
      const wide = ps.reduce((a, p) => a + Px.columnRoom(p, T, 'Segoe UI'), 0);
      const pad = ((o.grid || [])[0] || {}).properties && o.grid[0].properties.rowPadding ? 0 : 1, pitch = 1.415 * T * 4 / 3 + 2 * pad, need = 1.5 * TITLE * 4 / 3 + pitch + 7 + 8 * pitch + 16;
      const at8 = 1.5 * TITLE * 4 / 3 + 9 * (1.415 * 8 * 4 / 3) + 7 + 16;   // the rows at Power BI's smallest text, tight
      const notes = x.err ? '' : JSON.stringify(x.j), told = /needs about \d+ to show its 7 rows/.test(notes), named = x.err ? [] : ((x.j.tableColumns || [])[0] || {}).leftOut || [];
      // (round 19, item 9: the measures are picked at the size the rows are drawn at: no left-out measure would have fit)
      const leftRoom = named.length ? Px.columnRoom({ displayName: named[0].replace(/^.*\[|\]$/g, ''), field: { Measure: {} } }, T, 'Segoe UI') : 0;
      chk(() => !named.length || wide + leftRoom > 420, () => `${lang} ${W} x ${H}: the first left-out measure (${named[0]}, ${Math.round(leftRoom)}) would fit beside the kept ones (${Math.round(wide)}) at the drawn ${T}pt`);
      chk(() => m && sizes.every((s) => s === sizes[0]) && (sizes[0] == null || sizes[0] < T0) && wide <= 420 && (need <= 220 || (told && at8 > 220)) && ps.length - 1 + named.length === 4,
        () => `${lang} ${W} x ${H}: the matrix must draw at the size its fit chose (values, headers, row headers, total: ${JSON.stringify(sizes)}, the theme's ${T0}), its kept columns within 420 (${Math.round(wide)}), seven rows and the total within 220, or told when even 8pt does not hold them (need ${Math.round(need)}, at 8pt ${Math.round(at8)}, told ${told}), the left-out measures named (${JSON.stringify(named)}, kept ${ps.length - 1}) ${x.err ? x.t.slice(0, 300) : ''}`);
    }
  }
  // Round 19, item 10: a table takes the matrix's row rule (round 18): where seven rows and the total do not fit even with
  //     tight rows at the theme's size, the largest smaller text down to 8pt that holds them, on its values, headers and
  //     total; the header keeps its grow-to-fit
  {
    const dir = 'r18-matrix';
    const x = await ask('create_report', { path: dir, name: 'R19 table rows', theme: `${dir}/theme-1.5.json`, fields: { kpis: ['Sales[Total Sales]'], table: ['Calendar[Day Name]', 'Sales[Total Sales]'] },
      pages: [{ name: 'P', width: 1920, height: 1080, slots: [{ kind: 'title', x: 36, y: 18, w: 840, h: 48 }, { kind: 'table', x: 36, y: 100, w: 420, h: 220, title: 'T' }] }] });
    const vs = x.err ? [] : (() => { const def = path.join(ROOT, dir, x.j.report, 'definition', 'pages'), pg = JSON.parse(fs.readFileSync(path.join(def, 'pages.json'), 'utf8')).pageOrder[0]; return fs.readdirSync(path.join(def, pg, 'visuals')).map((v) => JSON.parse(fs.readFileSync(path.join(def, pg, 'visuals', v, 'visual.json'), 'utf8'))); })();
    const t = vs.find((v) => v.visual && v.visual.visualType === 'tableEx'), o = (t && t.visual.objects) || {};
    const fz = (k) => { const e = (o[k] || [])[0]; return e && e.properties.fontSize ? parseFloat(e.properties.fontSize.expr.Literal.Value) : null; };
    const T = fz('values'), pitch = 1.415 * T * 4 / 3, need = 1.5 * 18 * 4 / 3 + pitch + 7 + 8 * pitch + 16;
    chk(() => T && T < 15 && fz('columnHeaders') === T && fz('total') === T && need <= 220 && JSON.stringify(o.columnHeaders).includes('growToFit') && !/needs about \d+ to show its 7 rows/.test(JSON.stringify(x.j)),
      () => `a 420 x 220 table of Day Name at 15pt must take a smaller text so seven rows and the total fit: values ${T}, headers ${fz('columnHeaders')}, total ${fz('total')}, need ${Math.round(need)} ${x.err ? x.t.slice(0, 200) : ''}`);
  }
}
await client.close();
fs.rmSync(ROOT, { recursive: true, force: true });
console.log(problems.length ? `FAIL  mcp  ${checks} checks\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  mcp  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
