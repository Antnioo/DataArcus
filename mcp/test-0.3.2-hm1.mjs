import './test-env.mjs';
// 0.3.2 HM1 (the owner's brief of 3 Nov; mcp/work/HM1.md; written red first on e2cf676). The one visual the twin builds
// rather than clones, the heatmap's names table, on Codex's second fuzz pass (evidence/0.3.1-fuzz twin-fuzz-2, read
// only: N1-25, M1-1, F1-1 rebuilt from their spec.json in mcp/fixtures/hm1, made up) and Call Center p1's shape (laptop
// part 14, made-up names, no data). Through the real plan / approve / write flow (the tool's handler; the click as the
// window gives it). Edges with a stated tolerance, never centres (L-1102-07).
//   W, V1   the twins are written; Microsoft's validator finds no error code a twin has and its original lacks
//   U1-U6   B-296: a page that already has "v0Names" keeps it (a shape, byte-identical to its twin without the names
//           table, its exact mirror); the table is "v0Names2" in its own folder; the writer refuses to write over a
//           visual it did not build (a hard error); the EN-AR copy too; a folder differing only in case is taken
//   P1-P2   B-297: the plan's heatmapNames line and the approval page name the added visual
//   F1-F3   B-299: the fit check counts grid.rowPadding (F1-1: 7 rows of 32.9 do not fit 190: no names, said why);
//           a padded heatmap that fits keeps its names
//   B1-B3   B-300: the names table's box exactly the matrix's height; its column 4 px narrower than its box (and never
//           narrower than English's strip); its header and rows by the row estimate fit its box (0.5 px)
// Metadata only: no model rows, measures are BLANK().   node test-0.3.2-hm1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-hm1-')));
process.env.DATAARCUS_ROOT = ROOT;

const Plans = await import('./lib/plans.mjs');
const Approval = await import('./lib/approval-window.mjs');
const { planTwin } = await import('./lib/twin-plan.mjs');
const { twinTree } = await import('./lib/twin-write.mjs');
const { register } = await import('./tools/create_arabic_twin.mjs');
const { runReportValidation, getMetadataProvider } = await import('@microsoft/powerbi-report-authoring-cli');
const provider = await getMetadataProvider();
let handler = null;
register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = h; } }, {});
const call = async (a) => { const r = await handler(a), t = (r.content || []).map((c) => c.text || '').join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* a refusal's words */ } return { err: !!r.isError, t, j }; };

// ---- a made-up report from a spec (as twin-fuzz's materialize) ----
const put = (f, x) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof x === 'string' ? x : JSON.stringify(x, null, 2) + '\n'); };
const schema = (s) => 'https://developer.microsoft.com/json-schemas/fabric/' + s + '/schema.json';
const L = (v) => ({ expr: { Literal: { Value: String(v) } } });
const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
const num = (p) => parseFloat(String(lit(p)).replace(/D$/, ''));
const clone = (x) => JSON.parse(JSON.stringify(x));
function modelFor(spec) {
  const fields = new Map([['Weekday', 'string'], ['Hour', 'int64']]), measures = new Set(['Metric']);
  const walk = (x) => { if (!x || typeof x !== 'object') return; if (x.Column && x.Column.Property) fields.set(x.Column.Property, 'string'); if (x.Measure && x.Measure.Property) measures.add(x.Measure.Property); Object.values(x).forEach(walk); };
  walk(spec);
  return { compatibilityLevel: 1567, model: { culture: 'en-US', tables: [{ name: 'Synthetic', columns: [...fields].map(([name, dataType]) => ({ name, dataType, sourceColumn: name })), measures: [...measures].map((name) => ({ name, expression: 'BLANK()' })), partitions: [{ name: 'Synthetic', mode: 'import', source: { type: 'm', expression: 'let Source = #table({}, {}) in Source' } }] }] } };
}
function materialize(spec, dir) {
  const wr = (f, x) => put(path.join(dir, f), x), D = 'Synthetic.Report/definition';
  wr('Synthetic.pbip', { $schema: schema('pbip/pbipProperties/1.0.0'), version: '1.0', artifacts: [{ report: { path: 'Synthetic.Report' } }], settings: { enableAutoRecovery: true } });
  wr('Synthetic.Report/.platform', { $schema: schema('gitIntegration/platformProperties/2.0.0'), metadata: { type: 'Report', displayName: 'Synthetic' }, config: { version: '2.0', logicalId: '11111111-2222-4333-8444-555555555555' } });
  wr('Synthetic.Report/definition.pbir', { $schema: schema('item/report/definitionProperties/2.0.0'), version: '4.0', datasetReference: { byPath: { path: '../Synthetic.SemanticModel' } } });
  wr('Synthetic.SemanticModel/definition.pbism', { $schema: schema('item/semanticModel/definitionProperties/1.0.0'), version: '4.0', settings: {} });
  wr('Synthetic.SemanticModel/model.bim', modelFor(spec));
  wr(D + '/version.json', { $schema: schema('item/report/definition/versionMetadata/1.0.0'), version: '2.0.0' });
  wr(D + '/report.json', { $schema: schema('item/report/definition/report/2.1.0'), settings: { useStylableVisualContainerHeader: true } });
  const ids = spec.pages.map((p) => p.id);
  wr(D + '/pages/pages.json', { $schema: schema('item/report/definition/pagesMetadata/1.0.0'), pageOrder: ids, activePageName: ids[0] });
  spec.pages.forEach((p, i) => {
    wr(D + '/pages/' + ids[i] + '/page.json', { $schema: schema('item/report/definition/page/2.0.0'), name: ids[i], displayName: 'Synthetic page', displayOption: 'FitToPage', width: p.width, height: p.height });
    for (const v of p.visuals) wr(D + '/pages/' + ids[i] + '/visuals/' + (v.folder || v.name) + '/visual.json', Object.assign({}, v, { folder: undefined }));
  });
}
async function twinOf(spec, name, more) {
  const dir = path.join(ROOT, name); fs.mkdirSync(dir); materialize(spec, dir);
  const base = Object.assign({ path: name + '/Synthetic.pbip', arabicMonth: false }, more || {});
  const p = await call(base), id = p.j && p.j.plan && p.j.plan.planId;
  if (!id) return { dir, plan: p.j, err: 'no plan id: ' + p.t.slice(0, 300) };
  Plans.approve(id, 'user-in-browser');
  const data = (Plans.planOf(id) || {}).data;
  const w = await call(Object.assign({}, base, { planId: id }));
  return { dir, plan: p.j, data, w, err: w.err || !w.j || !w.j.written ? w.t.slice(0, 300) : null };
}
async function validate(reportDir, pbipPath) {
  const r = await runReportValidation({ reportDir, defDir: path.join(reportDir, 'definition'), provider, skipSchema: true, pbipPath });
  return Object.entries(r.diagnostics || {}).filter(([, d]) => d.severity === 'error' && d.items && d.items.length).map(([code]) => code);
}
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const visualsIn = (rep) => tree(path.join(rep, 'definition/pages')).filter((f) => f.endsWith('visual.json')).map((f) => ({ rel: path.relative(path.join(rep, 'definition/pages'), f).split(path.sep).join('/'), bytes: fs.readFileSync(f), json: JSON.parse(fs.readFileSync(f, 'utf8')) }));
const at = (vs, rel) => vs.find((x) => x.rel === rel);
const J = (x) => JSON.stringify(x);
// the row estimate (report-mirror.js heatmapBeside: a line of 1.887 x pt, 2 of padding, 2 x rowPadding; margins 6)
const need = (pt, rp, rows) => rows * (15.1 / 8 * pt + 2 + 2 * rp) + 6;
const EDGES = 4;

const spec = (f) => JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures/hm1', f + '.json'), 'utf8'));
const heatOf = (s) => s.pages[0].visuals.find((v) => v.name === 'v0');
// Call Center p1's shape (laptop part 14: matrix 188.33 high, strip 38.06, its padding right 6, 10pt)
const CC = { pages: [{ id: 'p0', width: 1280, height: 800, visuals: [Object.assign(clone(heatOf(spec('F1-1'))), { position: { x: 543.33, y: 434.17, width: 317.5, height: 188.33, z: 0 } })] }] };
{ const v = CC.pages[0].visuals[0].visual; v.objects.grid = [{ properties: { textSize: L('10D') } }]; v.objects.columnWidth[0].properties.value = L('38.06D'); v.visualContainerObjects.padding[0].properties.right = L('6D'); v.query.queryState.Values = { projections: [{ field: { Measure: { Expression: { SourceRef: { Entity: 'Synthetic' } }, Property: 'Metric' } }, queryRef: 'Synthetic.Metric', nativeQueryRef: 'Metric' }] }; }
// a padded heatmap that fits: rowPadding 2 at 10pt (8 rows of 24.9 + 6 = 205) in a box 220 high
const FITS = clone(spec('F1-1')); { const v = heatOf(FITS); v.position.height = 220; v.visual.objects.grid[0].properties.rowPadding = L('2D'); }
// N1-25 with its names table left out (the strip not set: B1), for the shape's bytes as the twin writes them without it
const CONTROL = clone(spec('N1-25')); delete heatOf(CONTROL).visual.objects.columnWidth;
// the shape named in lower case (another folder on Linux, the same folder on Windows and macOS)
const LOWER = clone(spec('N1-25')); LOWER.pages[0].visuals[1].name = 'v0names';

try {
  const runs = {};
  for (const [k, s, more] of [['n125', spec('N1-25')], ['m11', spec('M1-1')], ['f11', spec('F1-1')], ['cc', CC], ['fits', FITS], ['control', CONTROL], ['lower', LOWER], ['same', spec('N1-25'), { into: 'same' }]]) {
    try { runs[k] = await twinOf(s, k, more); } catch (e) { runs[k] = { err: String(e && e.message || e) }; }
  }
  const failed = Object.entries(runs).filter(([, r]) => r.err);
  chk(() => !failed.length, () => `W. every twin is written: ${failed.map(([k, r]) => k + ': ' + r.err).join('; ')}`);
  const rep = (k) => path.join(runs[k].dir, k === 'same' ? 'Synthetic (EN-AR).Report' : 'Synthetic AR.Report');
  const newCodes = [];
  for (const k of Object.keys(runs)) { if (runs[k].err) continue; const en = await validate(path.join(runs[k].dir, 'Synthetic.Report'), path.join(runs[k].dir, 'Synthetic.pbip')), ar = await validate(rep(k), path.join(runs[k].dir, path.basename(rep(k)).replace(/\.Report$/, '.pbip'))); ar.filter((c) => !en.includes(c)).forEach((c) => newCodes.push(k + ': ' + c)); }
  chk(() => !newCodes.length, () => `V1. Microsoft's validator: no error code a twin has and its original lacks: ${newCodes.join(', ')}`);

  // ---- B-296 ----
  const nv = visualsIn(rep('n125')), cv = visualsIn(rep('control'));
  const shape = at(nv, 'p0/visuals/v0Names/visual.json'), shapeC = at(cv, 'p0/visuals/v0Names/visual.json');
  chk(() => shape && shapeC && shape.json.visual.visualType === 'shape' && shape.bytes.equals(shapeC.bytes), () => `U1. N1-25: the report's own v0Names (a shape) is kept, byte-identical to its twin without the names table: ${shape && J(shape.json.visual)}`);
  const added = at(nv, 'p0/visuals/v0Names2/visual.json');
  chk(() => added && added.json.name === 'v0Names2' && added.json.visual.visualType === 'tableEx', () => `U2. the names table takes the free name v0Names2, in its own folder: ${nv.map((x) => x.rel).join(', ')}`);
  const m = at(visualsIn(rep('m11')), 'p0/visuals/v0Names/visual.json'), mp = m && m.json.position;
  chk(() => mp && Math.abs(mp.x - (1280 - 20 - 30)) < 0.5 && Math.abs(mp.y - 20) < 0.5 && mp.width === 30 && mp.height === 30, () => `U3. M1-1: v0Names is its exact mirror (x 1230, y 20, 30 x 30): ${J(mp)}`);
  // the writer: a visual the twin adds under a name the page already has is refused, never written over
  let refused = '';
  try { const P = planTwin({ path: path.join(ROOT, 'n125/Synthetic.pbip'), labels: {}, memory: false, arabicMonth: false }); const pg = P.built.pages.find((x) => (x.extra || []).length); pg.extra[0].json.name = 'v0Names'; twinTree(P); } catch (e) { refused = String(e && e.message || e); }
  chk(() => /^Nothing was written/.test(refused) && /v0Names/.test(refused), () => `U4. the writer refuses to write the added table over the report's own v0Names (a hard error): ${refused || 'written over, silently'}`);
  const sv = visualsIn(rep('same')), tables = sv.filter((x) => x.json.visual && x.json.visual.visualType === 'tableEx'), shapes = sv.filter((x) => x.json.visual && x.json.visual.visualType === 'shape');
  const names = (pg) => sv.filter((x) => x.rel.startsWith(pg + '/')).map((x) => x.json.name.toLowerCase());
  chk(() => tables.length === 1 && shapes.length === 2 && at(sv, 'p0/visuals/v0Names/visual.json').json.visual.visualType === 'shape' && names(tables[0].rel.split('/')[0]).filter((n) => n === tables[0].json.name.toLowerCase()).length === 1
    && J(((runs.same.plan || {}).mirrors || []).find((x) => x && x.kind === 'heatmapNames')).includes(tables[0].rel.split('/')[0] + '/' + tables[0].json.name), () => `U5. the EN-AR copy: both shapes kept, one names table under a name of its own, the plan naming it as written: ${sv.map((x) => x.rel + ' ' + x.json.visual.visualType).join(', ')} ${J(((runs.same.plan || {}).mirrors || []).find((x) => x && x.kind === 'heatmapNames'))}`);
  const lv = visualsIn(rep('lower'));
  chk(() => at(lv, 'p0/visuals/v0names/visual.json') && at(lv, 'p0/visuals/v0names/visual.json').json.visual.visualType === 'shape' && at(lv, 'p0/visuals/v0Names2/visual.json') && !at(lv, 'p0/visuals/v0Names/visual.json'), () => `U6. a folder that differs only in case is taken (one folder on Windows and macOS): ${lv.map((x) => x.rel).join(', ')}`);

  // ---- B-297 ----
  const line = ((runs.n125.plan || {}).mirrors || []).find((x) => x && x.kind === 'heatmapNames');
  chk(() => line && Array.isArray(line.added) && line.added.includes('p0/v0Names2'), () => `P1. the plan names the visual the twin adds (mirrors heatmapNames added): ${J(line)}`);
  let S = null; try { S = Approval.summary('twin', runs.n125.data); } catch (e) { S = null; }
  const sec = S && S.sections.find((x) => /adds/i.test(x.heading));
  chk(() => sec && J(sec.rows).includes('v0Names2') && J(sec.rows).includes('v0'), () => `P2. the approval page lists the added visual by its name, beside its heatmap: ${S && J(S.sections.map((x) => x.heading))}`);

  // ---- B-299 ----
  const fv = visualsIn(rep('f11'));
  chk(() => !fv.some((x) => x.json.visual && x.json.visual.visualType === 'tableEx'), () => `F1. F1-1 (rowPadding 6, 10pt, box 190: need ${need(10, 6, 8)}): no names table beside it: ${fv.map((x) => x.rel).join(', ')}`);
  chk(() => /p0\/v0/.test(J(runs.f11.plan && runs.f11.plan.cannot)) && /may not all fit/.test(J(runs.f11.plan && runs.f11.plan.cannot)), () => `F2. the plan says why F1-1's heatmap keeps no names (its rows may not all fit): ${J(runs.f11.plan && runs.f11.plan.cannot)}`);
  const ft = visualsIn(rep('fits')).find((x) => x.json.visual && x.json.visual.visualType === 'tableEx');
  chk(() => ft && Math.abs(ft.json.position.height - 220) < 0.01 && lit(ft.json.visual.objects.grid[0].properties.rowPadding) === '2D', () => `F3. a padded heatmap that fits (rowPadding 2, need ${need(10, 2, 8)} in 220) keeps its names, its box the matrix's, the matrix's rowPadding written on it (was mx7 H5): ${ft && J(ft.json.position)} ${ft && J(ft.json.visual.objects.grid)}`);

  // ---- B-300 ----
  const ccv = visualsIn(rep('cc')), ct = ccv.find((x) => x.json.visual.visualType === 'tableEx'), cm = ccv.find((x) => x.json.visual.visualType === 'pivotTable');
  chk(() => ct && cm && Math.abs(ct.json.position.height - cm.json.position.height) < 0.01 && Math.abs(ct.json.position.y - cm.json.position.y) < 0.01 && Math.abs(cm.json.position.height - 188.33) < 0.01, () => `B1. Call Center: the names table's box exactly the matrix's (y and height, 188.33): ${ct && J(ct.json.position)} beside ${cm && J(cm.json.position)}`);
  const colW = (t) => num(((t.json.visual.objects.columnWidth || [])[0] || { properties: {} }).properties.value);
  chk(() => ct && colW(ct) + EDGES <= ct.json.position.width + 0.01 && colW(ct) >= 38.06 - 0.01, () => `B2. its column ${EDGES} px narrower than its box (no horizontal scrollbar), never narrower than English's strip 38.06: column ${ct && colW(ct)} in ${ct && ct.json.position.width}`);
  const tables2 = ['cc', 'fits', 'n125', 'f11'].flatMap((k) => (runs[k].err ? [] : visualsIn(rep(k)).filter((x) => x.json.visual.visualType === 'tableEx').map((x) => ({ k, x }))));
  const over = tables2.filter(({ x }) => { const g = x.json.visual.objects.grid[0].properties, pt = num(g.textSize) || 10, rp = g.rowPadding ? num(g.rowPadding) : 0; return need(pt, rp, 8) > x.json.position.height + 0.5; });
  chk(() => tables2.length >= 3 && !over.length, () => `B3. every names table's header and 7 rows (the row estimate, rowPadding counted) fit its box (0.5): ${over.map(({ k, x }) => k + ' ' + J(x.json.position)).join('; ') || 'only ' + tables2.length + ' tables'}`);
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.2-hm1.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((x) => console.log('  - ' + x)); console.log(`FAIL  hm1  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  hm1  ${checks} checks`);
