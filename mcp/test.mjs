// End-to-end test of the DataArcus MCP server: starts it over stdio like an agent would and calls every tool.
// Runs on copies of the fixtures in a temporary folder, so nothing in the repo changes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mcp-'));
fs.cpSync(path.join(REPO, 'scripts/tests/fixtures/bridge-project'), path.join(ROOT, 'tmdl-project'), { recursive: true });
fs.cpSync(path.join(HERE, 'fixtures/health-project'), path.join(ROOT, 'bim-project'), { recursive: true });
fs.copyFileSync(path.join(REPO, 'assets/data/model-health-sample.pbit'), path.join(ROOT, 'sample.pbit'));

const problems = []; let checks = 0;
const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
const client = new Client({ name: 'test', version: '1' });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(HERE, 'server.mjs')], env: { ...process.env, DATAARCUS_ROOT: ROOT }, stderr: 'ignore' }));
const call = async (name, args) => { const r = await client.callTool({ name, arguments: args }); const t = r.content[0].text; return { err: !!r.isError, t, j: r.isError ? null : JSON.parse(t) }; };
const hash = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');

const tools = (await client.listTools()).tools.map((t) => t.name).sort();
check(tools.join() === 'check_model_health,create_report,read_model,suggest_fields', `tools: ${tools}`);

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

// check_model_health: a .pbit gives a score and findings; a TMDL project asks for a .pbit
r = await call('check_model_health', { path: 'sample.pbit' });
check(!r.err && r.j.score.overall > 0 && r.j.findings.length > 3 && r.j.reportRead, `health on .pbit: ${r.t.slice(0, 200)}`);
r = await call('check_model_health', { path: 'tmdl-project' });
check(r.err && /Export > Power BI template/.test(r.t), `health on TMDL: ${r.t.slice(0, 120)}`);

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

await client.close();
fs.rmSync(ROOT, { recursive: true, force: true });
console.log(problems.length ? `FAIL  mcp  ${checks} checks\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  mcp  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
