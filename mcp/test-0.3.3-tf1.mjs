// TF1 (0.3.3): what the whole-0.3.3 laptop run found (test033, 15 Nov; the owner's D-1115-01).
//   Z  (test033 D10, BLOCKER) check_model_health and read_model on a zip of two semantic models, on the real server:
//      the model read is the website's choice (zip-models.js, shared), named before the score with the one not read;
//      only its own report is read; zip order never changes the answer; a zip of one model is unchanged
//   H  (test033 D9) the Arabic twin's weekday names beside a heatmap: their rows the grid's (text size and row padding the
//      matrix's: its own, else its theme's for matrices, else none written); a theme that cannot be matched: said
//   N  (test033 C) plan_layout's writesAfterGo names the report as it is written (its name, or the free name), no "<name>"
// Made-up projects only (mcp/fixtures/health-project, twin-project; mcp/test-models/no-measures).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { zipOf } from './fixtures/stored-zip.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..'), JS = path.join(REPO, 'assets/js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const J = (x) => JSON.stringify(x === undefined ? null : x).slice(0, 500);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const project = (dir, under = '') => walk(dir).map((f) => [under + path.relative(dir, f).split(path.sep).join('/'), fs.readFileSync(f)]);

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-tf1-')));
const s = await serverClient(ROOT, undefined, { timeoutMs: 30000 });
try {
  // ---------- Z. two semantic models in one zip ----------
  {
    const health = project(path.join(HERE, 'fixtures/health-project')), twin = project(path.join(HERE, 'fixtures/twin-project'));
    const put = (name, entries) => { fs.writeFileSync(path.join(ROOT, name), zipOf(entries)); return name; };
    const zips = { health: put('health.zip', health), twin: put('twin.zip', twin), twinFirst: put('twin-first.zip', [...twin, ...health]), healthFirst: put('health-first.zip', [...health, ...twin]) };
    const H = {}, R = {};
    for (const [k, z] of Object.entries(zips)) { H[k] = await s.call('check_model_health', { path: z }); R[k] = await s.call('read_model', { path: z }); }
    const ok = (x) => x && !x.err && x.j;
    chk(() => ok(H.health) && H.health.j.score.overall === 87 && H.health.j.stats.pages === 2 && !('models' in H.health.j) && ok(H.twin) && H.twin.j.score.overall === 94 && !('models' in H.twin.j),
      () => `Z0. guard: each project zipped alone, as before (87 with 2 pages, 94), no models note: ${J([H.health.j && H.health.j.score, H.twin.j && H.twin.j.score])}`);
    for (const k of ['twinFirst', 'healthFirst']) {
      const h = H[k].j, m = h && h.models;
      chk(() => ok(H[k]) && J(Object.keys(h).slice(0, 3)) === '["source","models","score"]', () => `Z1-${k}. check_model_health names the models before the score (keys source, models, score): ${J(h ? Object.keys(h) : H[k].t)}`);
      chk(() => m.read === 'Health Test.SemanticModel' && J(m.notRead) === '["Twin Sales.SemanticModel"]' && m.report === 'read' && J(m.reports) === '["Health Test Report.Report"]',
        () => `Z2-${k}. the model read (the first by folder path, zip-models.js) and the one not read; only its own report: ${J(m)}`);
      chk(() => /^This zip holds 2 semantic models: the check below read Health Test\.SemanticModel; not read: Twin Sales\.SemanticModel\. The report read is the one of Health Test\.SemanticModel \(Health Test Report\.Report\); the other models' reports were not read\. To check another model, zip its project folder alone\.$/.test(m.message),
        () => `Z3-${k}. the website's sentence, word for word: ${J(m && m.message)}`);
      chk(() => h.score.overall === H.health.j.score.overall && h.stats.tables === H.health.j.stats.tables && h.stats.pages === 2 && J(h.stats) === J(H.health.j.stats),
        () => `Z4-${k}. scored with its own tables and its own report only (87, 4 tables, 2 pages, as zipped alone): ${h && h.score.overall}, ${J(h && h.stats)}`);
      const r = R[k].j;
      chk(() => ok(R[k]) && Object.keys(r)[0] === 'models' && J(r.models) === J(m), () => `Z5-${k}. read_model names the models first, the same note: ${J(r ? Object.keys(r) : R[k].t)}`);
    }
    // (the zip's own file name is in source, the plan and the script names: the rest is compared)
    const core = (j) => JSON.stringify(j && { models: j.models, score: j.score, stats: j.stats, reportRead: j.reportRead, findings: j.findings });
    chk(() => core(H.twinFirst.j) === core(H.healthFirst.j), () => 'Z6. zip order never changes the answer: models, score, stats, reportRead and findings the same in both orders');
    // a model.bim project and a TMDL project, and a decoy report of the second (its definition.pbir points at it): the
    // server reads what the website reads (au1's zip), in both orders
    const plain = project(path.join(HERE, 'test-models/no-measures')), REP = 'Health Test Report.Report';
    const decoy = health.filter(([n]) => n.startsWith(REP + '/')).map(([n, b]) => [n.replace(REP, 'Plain Report.Report'), /definition\.pbir$/.test(n) ? Buffer.from(b.toString('utf8').replace('../Health Test.SemanticModel', '../Plain Orders.SemanticModel')) : b])
      .concat([['Plain Report.Report/definition/pages/zz/page.json', Buffer.from('{"name":"zz","displayName":"Extra","width":1280,"height":720}')]]);
    const mixed = [...health, ...plain, ...decoy];
    const a = await s.call('check_model_health', { path: put('mixed.zip', mixed) }), b = await s.call('check_model_health', { path: put('mixed-rev.zip', mixed.slice().reverse()) });
    chk(() => ok(a) && a.j.models.read === 'Health Test.SemanticModel' && J(a.j.models.notRead) === '["Plain Orders.SemanticModel"]' && J(a.j.models.reports) === '["Health Test Report.Report"]' && a.j.stats.pages === 2 && a.j.score.overall === 87 && ok(b) && core(b.j) === core(a.j),
      () => `Z7. a model.bim and a TMDL project with a decoy report: Health Test read with its own report only, both orders: ${J(a.j ? a.j.models : a.t)} ${J(b.j ? b.j.models : b.t)}`);
    // the TMDL model alone in a zip is read (zip-models.js chooses it, as on the website), never "No model in this file"
    const t = await s.call('check_model_health', { path: put('plain.zip', plain) });
    chk(() => ok(t) && t.j.score.overall === 92 && !('models' in t.j), () => `Z8. a TMDL project zipped alone is read as on the website (92): ${J(t.j ? t.j.score : t.t)}`);
    // one place: the worker and the MCP's reader both call zip-models.js; neither keeps a choice of its own
    const worker = fs.readFileSync(path.join(JS, 'model-health-worker.js'), 'utf8'), reader = fs.readFileSync(path.join(HERE, 'lib/model.mjs'), 'utf8');
    chk(() => /DAZipModels\.choose\(/.test(worker) && /ZipModels\.choose\(/.test(reader) && !/new Map\(\)[^\n]*folders|folders\.set\(/.test(worker + reader) && !/find\(\(\[n\]\) => \/\(\^\|\\\/\)model\\\.bim\$\/i\.test\(n\)\)/.test(reader),
      () => 'Z9. one place (D-1104-12): model-health-worker.js and mcp/lib/model.mjs both call zip-models.js choose; no folder map or first-model.bim pick of their own');
  }
  // ---------- N. plan_layout's writesAfterGo names the report (test033 C: name "Gulf Views", the line said "<name>") ----------
  {
    fs.cpSync(path.join(HERE, 'fixtures/health-project'), path.join(ROOT, 'views'), { recursive: true });
    const p = await s.call('plan_layout', { path: 'views', layout: 'exec', name: 'Gulf Views', lang: 'en' }), w = p.j && p.j.plan ? p.j.plan.writesAfterGo : null;
    chk(() => w && /^the report "Gulf Views\.Report" and its "Gulf Views\.pbip" /.test(w[0]) && !w.some((x) => x.includes('<name>')), () => `N1. writesAfterGo names the report as it is written ("Gulf Views.Report", "Gulf Views.pbip"), no "<name>": ${J(w || p.t)}`);
    // the name taken: the free name the write uses (the plan's own .pbip), as the approval page says
    fs.mkdirSync(path.join(ROOT, 'views', 'Gulf Views.Report'));
    const t = await s.call('plan_layout', { path: 'views', layout: 'exec', name: 'Gulf Views', lang: 'en' }), tw = t.j && t.j.plan ? t.j.plan.writesAfterGo : null;
    chk(() => tw && !tw.some((x) => x.includes('<name>')) && /^the report "Gulf Views - [^"]+\.Report" and its "Gulf Views - [^"]+\.pbip" /.test(tw[0]), () => `N2. the name taken: the free name the write uses (the plan's own .pbip, as the approval page says): ${J(tw || t.t)}`);
  }
} finally { await s.close(); }
fs.rmSync(ROOT, { recursive: true, force: true });

// ---------- H. the Arabic twin's weekday names beside a heatmap: the names' rows the grid's (test033 D9) ----------
// test033 D9's matrix (made up): Rows a weekday, Columns Hour, Values Sum of Calls, no text size or row padding of its
// own (Power BI's default row height), English's row header strip 82. Each visual's rows are drawn at the text size and
// row padding it is given, else its theme's for its type (pivotTable, tableEx), else Power BI's default, the same for
// both (DESKTOP-TESTS round 11: a row is 1.887 x pt + 2 + 2 x rowPadding; nothing written draws as 8pt and padding 1)
{
  const { createRequire } = await import('node:module'), require = createRequire(import.meta.url), Mirror = require('../assets/js/report-mirror.js');
  const L = (v) => ({ expr: { Literal: { Value: v } } }), lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value) : undefined);
  const col = (c) => ({ field: { Column: { Expression: { SourceRef: { Entity: 'Calendar' } }, Property: c } }, queryRef: 'Calendar.' + c, nativeQueryRef: c });
  const calls = { field: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: 'Calendar' } }, Property: 'Calls' } }, Function: 0 } }, queryRef: 'Sum(Calendar.Calls)', nativeQueryRef: 'Calls' };
  // the twin's (mirrored) matrix: the padding English had at its right is at its left
  const heat = (objects) => ({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json', name: 'heat', position: { x: 40, y: 360, z: 2000, width: 300, height: 300, tabOrder: 2000 },
    visual: { visualType: 'pivotTable', query: { queryState: { Rows: { projections: [col('يوم الأسبوع')] }, Columns: { projections: [col('Hour')] }, Values: { projections: [calls] } } },
      objects: Object.assign({ columnWidth: [{ properties: { value: L('82D') }, selector: { metadata: 'Calendar.يوم الأسبوع' } }] }, objects || {}), visualContainerObjects: { padding: [{ properties: { left: L('6D') } }] } } });
  const num = (v) => (v === undefined ? undefined : parseFloat(String(v).replace(/D$/, '')));
  const card = (o, c, k) => { const e = ((o || {})[c] || []).find((x) => x && !x.selector && x.properties && x.properties[k] !== undefined); return e ? num(lit(e.properties[k])) : undefined; };
  const themed = (theme, type, c, k) => { const e = ((((theme || {}).visualStyles || {})[type] || {})['*'] || {})[c]; const x = Array.isArray(e) ? e.find((y) => y && y[k] !== undefined) : null; return x ? num(x[k]) : undefined; };
  // what a visual draws with: its own, else its theme's for its type, else Power BI's default (the same for both types)
  const drawn = (v, theme) => { const o = v.visual.objects, t = v.visual.visualType;
    const size = card(o, 'grid', 'textSize') ?? card(o, 'values', 'fontSize') ?? card(o, 'rowHeaders', 'fontSize') ?? themed(theme, t, 'grid', 'textSize') ?? themed(theme, t, 'values', 'fontSize') ?? themed(theme, t, 'rowHeaders', 'fontSize') ?? 8;
    const pad = card(o, 'grid', 'rowPadding') ?? themed(theme, t, 'grid', 'rowPadding') ?? 1; return { size, pad }; };
  // the top edge of the matrix's Total row (the header and 7 days above it) and the names table's 8th row, in px
  const edge8 = (d) => 8 * (1.887 * d.size + 2 + 2 * d.pad);
  const cases = { 'no size, no theme style (test033 D9)': [{}, null], 'the theme sizes matrices (a DataArcus theme at 1920)': [{}, { visualStyles: { pivotTable: { '*': { values: [{ fontSize: 15 }], rowHeaders: [{ fontSize: 15 }] } }, tableEx: { '*': { values: [{ fontSize: 15 }] } } } }],
    'the theme pads matrices': [{}, { visualStyles: { pivotTable: { '*': { grid: [{ rowPadding: 4 }] } } } }], 'its own size and padding (guard)': [{ grid: [{ properties: { textSize: L('9D'), rowPadding: L('3D') } }] }, null] };
  for (const [k, [objects, theme]] of Object.entries(cases)) {
    const m = heat(objects), r = Mirror.heatmapNames(m, { theme }), dm = drawn(r ? r.matrix : m, theme), dt = r ? drawn(r.table, theme) : null;
    chk(() => r && Math.abs(edge8(dm) - edge8(dt)) <= 0.5, () => `H1 (${k}). the names table's 8th row and the matrix's Total row start within 0.5 px (the names' rows are the grid's): matrix ${J(dm)} ${r && edge8(dm).toFixed(1)}, names ${J(dt)} ${r && dt && edge8(dt).toFixed(1)}; the names' grid ${J(r && r.table.visual.objects.grid)}`);
  }
  // test033 D9 itself: nothing is written on the names table (both at Power BI's default), never a size of DataArcus's own
  const d9 = Mirror.heatmapNames(heat(), {});
  chk(() => d9 && card(d9.table.visual.objects, 'grid', 'textSize') === undefined && card(d9.table.visual.objects, 'values', 'fontSize') === undefined, () => `H2. D9's matrix sets no text size: the names table gets none (it got 10): ${J(d9 && d9.table.visual.objects.grid)}`);
  // the theme gives tables a size and matrices none: the rows cannot be matched, so no names beside it, and why (the plan says it)
  const odd = { visualStyles: { tableEx: { '*': { values: [{ fontSize: 12 }] } } } }, hb = Mirror.heatmapBeside(heat(), { mirrored: true, theme: odd });
  chk(() => !hb.ok && /theme gives tables a text size and matrices none/.test(hb.why) && Mirror.heatmapNames(heat(), { theme: odd }) === null, () => `H3. a theme that sizes tables and not matrices: no names beside it, said: ${J(hb)}`);
}

if (problems.length) { console.log(`FAIL script=test-0.3.3-tf1.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((x) => console.log('  - ' + x)); console.log(`FAIL  tf1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  tf1  ${checks} checks`);
