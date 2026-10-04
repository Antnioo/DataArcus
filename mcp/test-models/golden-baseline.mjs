// The tool-level part of the golden tasks 1 to 11 (mcp/GOLDEN-TASKS.md): for each, the tool calls an agent is expected to
// make, run over stdio like an agent would, on copies of the input models in a temporary folder (nothing in the repo
// changes). Checks: the expected pages and visuals, nothing overwritten, Microsoft's validator, the measured size rules
// (scripts/tests/report-check.mjs), right to left mirrored where asked, and the size of every answer.
// It does not replace the golden task: the agent's own choices, the Desktop look and the numbers are checked by a person.
//   cd mcp && node test-models/golden-baseline.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { layoutProblems, tableProblems, projectProblems } from '../../scripts/tests/report-check.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), MCP = path.join(HERE, '..'), REPO = path.join(MCP, '..');
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-golden-'));
// the input models, copied as a user would have them
const copy = (from, to) => fs.cpSync(path.join(REPO, from), path.join(ROOT, to), { recursive: true });
copy('scripts/tests/fixtures/model-health/tmdl-ramadan/definition', 'ramadan/Ramadan Test.SemanticModel/definition');
fs.writeFileSync(path.join(ROOT, 'ramadan/Ramadan Test.SemanticModel/definition.pbism'), '{ "version": "4.0", "settings": {} }');
copy('mcp/fixtures/health-project', 'existing');
copy('mcp/test-models/arabic-long-names', 'arabic');
copy('mcp/test-models/no-measures', 'plain');
copy('mcp/test-models/large-synthetic/Large Synthetic.SemanticModel', 'large/Large Synthetic.SemanticModel');

const client = new Client({ name: 'golden', version: '1' });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(MCP, 'server.mjs')], env: { ...process.env, DATAARCUS_ROOT: ROOT }, stderr: 'ignore' }));
const sizes = [];
// An answer's size, the same on Windows and Linux: a path in an answer has a backslash on Windows, which JSON writes
// as two characters, and a slash on Linux (round 7: read_model on the large model was 10,380 here and 10,379 there).
// Every backslash pair is counted as one character. (An answer that holds the temporary folder's own path, like
// check_model_health's script files, still varies with that folder's name.)
const chars = (t) => t.split('\\\\').join('/').length;
const call = async (name, args) => {
  const r = await client.callTool({ name, arguments: args }), t = r.content[0].text;
  sizes.push({ tool: name, chars: chars(t) });
  return { err: !!r.isError, t, j: r.isError ? null : JSON.parse(t) };
};
const hashes = (dir) => { const out = {}; const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else out[f] = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); }); walk(dir); return out; };
const unchanged = (before) => Object.entries(before).filter(([f, h]) => !fs.existsSync(f) || hashes(path.dirname(f))[f] !== h).map(([f]) => path.relative(ROOT, f));
const filesOf = (dir, rel) => { const out = {}; const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else out[path.relative(rel, f).split(path.sep).join('/')] = fs.readFileSync(f); }); walk(dir); return out; };
const validate = (dir) => {
  const p = spawnSync(process.execPath, [path.join(MCP, 'node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js'), 'validate', dir], { encoding: 'utf8' });
  try {
    const d = JSON.parse(p.stdout).data, diag = d.diagnostics || {};
    return d.errorCount ? `${d.errorCount} (${Object.keys(diag).filter((k) => diag[k].severity === 'error').map((k) => `${k} x${diag[k].items.length}: ${String(diag[k].items[0].message).slice(0, 90)}`).join('; ')})` : 0;
  } catch (e) { return 'not run'; }
};
// a written report: pages (without tooltip pages), visuals, validator errors, measured size and phone problems
const reportFacts = (project, report, rtl) => {
  const dir = path.join(ROOT, project, report), files = filesOf(dir, path.dirname(dir));
  const pages = Object.keys(files).filter((f) => /\/pages\/[^/]+\/page\.json$/.test(f)).map((f) => JSON.parse(String(files[f])));
  const lp = layoutProblems(filesOf(dir, dir));
  return { pages: pages.filter((p) => p.visibility !== 'HiddenInViewMode' && !/tooltip/i.test(p.type || '')).map((p) => `${p.displayName} ${p.width}x${p.height}`),
    hidden: pages.filter((p) => p.visibility === 'HiddenInViewMode' || /tooltip/i.test(p.type || '')).length,
    visuals: Object.keys(files).filter((f) => /\/visuals\/[^/]+\/visual\.json$/.test(f)).length,
    validator: validate(dir), sizeProblems: lp.sizes.length, phoneProblems: lp.phone.length, project: projectProblems(files).length, tableHeaders: tableProblems(files, rtl).bad.length,
    firstProblems: lp.sizes.concat(lp.phone).slice(0, 2) };
};
// right to left: every slot of the Arabic plan is the English slot mirrored on the page (x -> width - x - w); the engine
// rounds edges, not sizes, so a width may differ by 1
const mirrored = (en, ar) => {
  const W = en.j.page.w, near = (a, b) => Math.abs(a - b) <= 1;
  const bad = en.j.slots.filter((s, i) => { const a = ar.j.slots[i]; return !a || a.kind !== s.kind || a.y !== s.y || a.h !== s.h || !near(a.w, s.w) || !near(a.x, W - s.x - s.w); });
  return `${en.j.slots.length - bad.length}/${en.j.slots.length} slots mirrored`;
};
const results = [];
// round 6: the fields an approved plan names are passed to create_report (fields), as an agent now does; the cards of
// the first page are read back from the answer (boundFields)
const RAMADAN_KPIS = ['Sales[Total Sales]', 'Sales[Total Sales Last Ramadan]', 'Sales[Total Sales vs Last Ramadan %]'];
const cardsOf = (b) => ((((b.r || {}).j || {}).boundFields || [])[0] || { visuals: [] }).visuals.filter((v) => v.visual === 'KPI card').map((v) => v.fields.join()).join(' | ');
const slicersOf = (b) => ((((b.r || {}).j || {}).boundFields || [])[0] || { visuals: [] }).visuals.filter((v) => v.visual === 'Slicer').map((v) => v.fields.join()).join(' | ');
const task = async (id, title, fn) => { const out = { id, title }; try { Object.assign(out, await fn()); } catch (e) { out.error = String(e.message || e).slice(0, 200); } results.push(out); console.log(JSON.stringify(out)); };
const build = async (project, name, theme, layoutArgs, extra = {}) => {
  const before = hashes(path.join(ROOT, project));
  const plan = await call('plan_layout', { design: theme.j.design, ...layoutArgs });
  if (plan.err) return { plan: plan.t.slice(0, 200) };
  const r = await call('create_report', { path: project, name, design: plan.j.design, lang: layoutArgs.lang || 'en', ...extra });
  if (r.err) return { create: r.t.slice(0, 200) };
  return { plan, r, facts: reportFacts(project, r.j.report, (layoutArgs.lang || 'en') === 'ar'), report: r.j.report, overwritten: unchanged(before).length, modelNotes: (r.j.modelNotes || []).map((n) => n.field) };
};

await task(1, 'English executive report', async () => {
  const m = await call('read_model', { path: 'ramadan' }), f = await call('suggest_fields', { path: 'ramadan', kpis: 4 });
  const th = await call('generate_theme', { name: 'Golden Exec', brand: '#0F6CBD', lang: 'en', folder: 'themes' });
  const b = await build('ramadan', 'Golden Exec', th, { layout: 'exec', kpis: 4, filters: 'end', page: '1920x1080', lang: 'en' }, { fields: { kpis: RAMADAN_KPIS } });
  return { cards: cardsOf(b), tables: m.j.tables.map((t) => t.table).join(), kpis: f.j.kpis.map((k) => k.m).join(' | '), contrastWarnings: th.j.warnings.length, ...b.facts, overwritten: b.overwritten, modelNotes: b.modelNotes };
});
await task(2, 'Arabic report, mirrored', async () => {
  const th = await call('generate_theme', { name: 'Golden Arabic', brand: '#0F6CBD', font: 'Tahoma', lang: 'ar', folder: 'themes' });
  const en = await call('plan_layout', { design: th.j.design, layout: 'analysis', kpis: 4, filters: 'end', page: '1920x1080', lang: 'en', dir: 'ltr' });
  const ar = await call('plan_layout', { design: th.j.design, layout: 'analysis', kpis: 4, filters: 'end', page: '1920x1080', lang: 'ar' });
  const b = await build('ramadan', 'Golden Arabic', th, { layout: 'analysis', kpis: 4, filters: 'end', page: '1920x1080', lang: 'ar' }, { fields: { kpis: RAMADAN_KPIS } });
  return { cards: cardsOf(b), fontWarnings: th.j.warnings.filter((w) => /Arabic/.test(w)).length, mirror: mirrored(en, ar), ...b.facts, overwritten: b.overwritten, modelNotes: b.modelNotes };
});
await task(3, 'Ramadan vs last Ramadan', async () => {
  const f = await call('suggest_fields', { path: 'ramadan', kpis: 3 });
  const th = await call('generate_theme', { name: 'Golden Ramadan', preset: 'Desert Gulf', lang: 'en', folder: 'themes' });
  // the plan: the three Ramadan measures on the cards, and slicers on the Hijri year and Is Ramadan so the page can be set to one Ramadan
  const b = await build('ramadan', 'Golden Ramadan', th, { layout: 'focus', kpis: 3, filters: 'top', lang: 'en' }, { secondPage: false, fields: { kpis: RAMADAN_KPIS, slicers: ['Calendar[Hijri Year]', 'Calendar[Is Ramadan]'] },
    // round 8: the page is limited to Ramadan by a page filter (the owner's decision 2026-10-04)
    // round 9: 'this Ramadan only' is the flag and the Hijri year the user gives (here 1447 stands for the user's answer)
    pageFilters: [{ field: 'Calendar[Is Ramadan]', values: [true] }, { field: 'Calendar[Hijri Year]', values: [1447] }] });
  const pagesDir = path.join(ROOT, 'ramadan', b.report, 'definition', 'pages');
  const filtersOnPages = fs.readdirSync(pagesDir).filter((n) => fs.existsSync(path.join(pagesDir, n, 'page.json'))).map((n) => JSON.parse(fs.readFileSync(path.join(pagesDir, n, 'page.json'), 'utf8')))
    .map((pg) => `${pg.type === 'Tooltip' ? 'tooltip' : 'page'} ${((pg.filterConfig || {}).filters || []).map((x) => x.field.Column.Expression.SourceRef.Entity + '[' + x.field.Column.Property + '] In ' + x.filter.Where[0].Condition.In.Values.map((v) => v[0].Literal.Value).join()).join('; ') || 'none'}`).sort().join(' | ');
  const ramadanOnCards = f.j.kpis.filter((k) => /ramadan/i.test(k.m)).length;
  return { cards: cardsOf(b), slicers: slicersOf(b), pageFilters: JSON.stringify(b.r.j.pageFilters), filtersOnPages, filterNote: (b.r.j.reportNotes || []).filter((n) => /page filter/i.test(n)).length, everyRamadanNote: (b.r.j.reportNotes || []).filter((n) => /every Ramadan/i.test(n)).length, cardFormats: JSON.stringify(((b.r.j.numberFormats || {}).cards || {}).formatted), kpis: f.j.kpis.map((k) => k.m).join(' | '), ramadanMeasuresOnCards: `${ramadanOnCards}/3`, ...b.facts, overwritten: b.overwritten, modelNotes: b.modelNotes };
});
await task(4, '16:9 and 4:3 pages', async () => {
  const th = await call('generate_theme', { name: 'Golden Ratio', preset: 'Corporate', folder: 'themes' });
  const wide = await build('ramadan', 'Golden 16x9', th, { layout: 'exec', page: '1280x720', lang: 'en' }, { fields: { kpis: RAMADAN_KPIS } });
  const square = await build('ramadan', 'Golden 4x3', th, { layout: 'exec', page: '960x720', lang: 'en' }, { fields: { kpis: RAMADAN_KPIS } });
  return { cards: cardsOf(wide), wide: wide.facts, square: square.facts, overwritten: wide.overwritten + square.overwritten };
});
await task(5, 'A small page (640 x 360)', async () => {
  const th = await call('generate_theme', { name: 'Golden Small', preset: 'DataArcus', folder: 'themes' });
  const b = await build('ramadan', 'Golden Small', th, { layout: 'exec', kpis: 3, filters: 'none', page: { w: 640, h: 360 }, lang: 'en' }, { fields: { kpis: RAMADAN_KPIS } });
  return { cards: cardsOf(b), ...b.facts, overwritten: b.overwritten };
});
await task(6, 'Long Arabic names', async () => {
  const m = await call('read_model', { path: 'arabic' }), f = await call('suggest_fields', { path: 'arabic', kpis: 4 });
  const th = await call('generate_theme', { name: 'Golden Long Names', preset: 'Midnight', font: 'Segoe UI', lang: 'ar', folder: 'themes' });
  const b = await build('arabic', 'Golden Long Names', th, { layout: 'exec', kpis: 4, filters: 'end', page: '1920x1080', lang: 'ar' });
  const titles = Object.values(filesOf(path.join(ROOT, 'arabic', b.r.j.report), ROOT)).map(String).join('').match(/إجمالي صافي المبيعات بعد الخصومات والمرتجعات/g) || [];
  return { measures: m.j.tables.reduce((n, t) => n + t.measures.length, 0), kpis: f.j.kpis.map((k) => k.m).join(' | '), longTitleUses: titles.length, ...b.facts, overwritten: b.overwritten };
});
await task(7, 'A model missing measures and formats', async () => {
  const m = await call('read_model', { path: 'plain' }), f = await call('suggest_fields', { path: 'plain', kpis: 4 });
  const h = await call('check_model_health', { path: 'plain' });
  const th = await call('generate_theme', { name: 'Golden Plain', preset: 'DataArcus', folder: 'themes' });
  const b = await build('plain', 'Golden Plain', th, { layout: 'exec', kpis: 4, lang: 'en' });
  return { measures: m.j.tables.reduce((n, t) => n + t.measures.length, 0), dateTables: m.j.tables.filter((t) => t.dateTable).length, kpis: f.err ? f.t.slice(0, 120) : (f.j.kpis || []).map((k) => k && (k.m || k.c)).join(' | '),
    health: h.j && `${h.j.score.overall}: ${h.j.findings.map((x) => x.id).join(' ')}`, ...(b.facts || b), overwritten: b.overwritten, modelNotes: b.modelNotes, kpiCards: b.r && b.r.j.kpiCards };
});
await task(8, '"Redesign this" (an existing report)', async () => {
  const m = await call('read_model', { path: 'existing' });
  const th = await call('generate_theme', { name: 'Golden Redesign', preset: 'Corporate', folder: 'themes' });
  const b = await build('existing', m.j.existingReports[0], th, { layout: 'exec', lang: 'en' });
  const b2 = await build('existing', `${m.j.existingReports[0]} redesign`, th, { layout: 'exec', lang: 'en' });
  return { existing: m.j.existingReports.join(), sameName: b.create || `written as ${b.report}, ${b.facts.validator} validator errors`, newName: b2.facts ? `${b2.r.j.report}, ${b2.facts.validator} validator errors` : b2.create, overwritten: (b.overwritten || 0) + (b2.overwritten || 0), kpiCards: b2.r && b2.r.j.kpiCards && { asked: b2.r.j.kpiCards.asked, built: b2.r.j.kpiCards.built, measures: b2.r.j.kpiCards.measures } };
});
await task(9, 'An unsupported visual', async () => {
  const before = hashes(path.join(ROOT, 'ramadan'));
  const r = await call('create_report', { path: 'ramadan', name: 'Golden Sankey', pages: [{ name: 'Flows', slots: [{ kind: 'sankey', x: 0, y: 0, w: 600, h: 400 }, { kind: 'decompositionTree', x: 640, y: 0, w: 600, h: 400 }] }] });
  return { refused: r.err, message: r.t.slice(0, 160).replace(/\s+/g, ' '), written: fs.existsSync(path.join(ROOT, 'ramadan', 'Golden Sankey.pbip')), overwritten: unchanged(before).length };
});
await task(10, 'A large model (300 tables, 3,000 columns)', async () => {
  // (round 4) the summary first; without a focus nothing is picked; then the user's words, "logistics", as the focus
  const m = await call('read_model', { path: 'large' }), none = await call('suggest_fields', { path: 'large', kpis: 4 }), h = await call('check_model_health', { path: 'large' });
  const area = ((m.j.areas || []).find((a) => a.area === 'Logistics') || { tables: [] }).tables, d = await call('read_model', { path: 'large', tables: area });
  const f = await call('suggest_fields', { path: 'large', kpis: 4, focus: 'logistics' });
  const th = await call('generate_theme', { name: 'Golden Large', preset: 'Corporate', folder: 'themes' });
  const noFocus = await build('large', 'Golden Large no focus', th, { layout: 'exec', kpis: 4, lang: 'en' });
  const b = await build('large', 'Golden Large', th, { layout: 'exec', kpis: 4, lang: 'en' }, { focus: 'logistics' });
  return { readModelChars: chars(m.t), summary: !!m.j.summary, detailChars: chars(d.t), detailTables: (d.j.tables || []).length, noFocus: none.j.needsFocus ? 'asks for a focus' : 'picked ' + (none.j.kpis || []).length, createNoFocus: noFocus.create ? 'refused' : 'written',
    suggestChars: chars(f.t), healthChars: chars(h.t), kpis: f.j.kpis.map((k) => `${k.t}[${k.m}]`).join(' | '), category: `${f.j.cats.bar.t}[${f.j.cats.bar.c}]`, ...b.facts, overwritten: b.overwritten, modelNotes: b.modelNotes };
});

await task(11, 'A Gulf model\'s calendar checked', async () => {
  // the Gulf calendar pack's test model, written from the repo's own files (scripts/gulf-calendar/test-model), as
  // mcp/test.mjs builds it: the generator's calendar 2018-2030 with the UAE weekend and the announced dates
  const dax = (file) => fs.readFileSync(path.join(REPO, 'scripts/gulf-calendar/test-model', file), 'utf8').replace(/\r\n/g, '\n');
  const measures = dax('measures.dax').split(/\n(?=    MEASURE 'Sales'\[)/).slice(1).map((b) => { const m = b.match(/MEASURE 'Sales'\[([^\]]+)\] =\n([\s\S]*?)(?=\nEVALUATE|$)/); return { name: m[1], expression: m[2] }; });
  fs.mkdirSync(path.join(ROOT, 'gulf'));
  fs.writeFileSync(path.join(ROOT, 'gulf/gulf-pack.bim'), JSON.stringify({ compatibilityLevel: 1567, model: {
    tables: [{ name: 'Calendar', columns: [], partitions: [{ name: 'Calendar', mode: 'import', source: { type: 'calculated', expression: dax('calendar.dax').replace(/^Calendar =\n/, '') } }] },
      { name: 'Sales', columns: [{ name: 'Date', dataType: 'dateTime', sourceColumn: 'Date' }, { name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }], partitions: [{ name: 'Sales', mode: 'import', source: { type: 'm', expression: 'let Source = #table({"Date"}, {}) in Source' } }], measures }],
    relationships: [{ name: 'r', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } }));
  const before = hashes(path.join(ROOT, 'gulf'));
  const uae = await call('check_model_health', { path: 'gulf/gulf-pack.bim', country: 'uae', asOf: '2026-10-04' }), ksa = await call('check_model_health', { path: 'gulf/gulf-pack.bim', country: 'ksa', asOf: '2026-10-04' });
  const found = (x) => x.j.gulfCalendar.findings.map((f) => `${f.id} ${f.count}`).join(', ') || 'none';
  return { uae: found(uae), ksa: found(ksa), scored: uae.j.gulfCalendar.scored, sameScore: uae.j.score.overall === ksa.j.score.overall, overwritten: unchanged(before).length };
});

await client.close();
fs.rmSync(ROOT, { recursive: true, force: true });
const big = sizes.reduce((a, s) => (s.chars > a.chars ? s : a), { chars: 0 });
console.log(`\n${results.length} golden tasks run (tool level). Largest answer: ${big.tool}, ${big.chars} characters.`);
