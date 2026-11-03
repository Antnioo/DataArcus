import './test-env.mjs';
// 0.3.2 HM2 (laptop part 14, B-298; Codex's twin-fuzz-2 A1; mcp/work/HM2.md; written red first on e2cf676). A chart
// English lines up under a heatmap's grid keeps English's inside (sort, axis cards, padding) in every branch, including
// the fallback that keeps it at its mirror because moving it would land on another visual (MX8 item 3). Made up only.
//   A1-A6  Codex's A1-1 (mcp/fixtures/hm2/A1-1.json, its spec.json as it is: a synthetic matrix and column chart) with a
//          made-up 15-wide shape beside the chart in English that the lined-up chart would cover in the twin (not its
//          mirror): kept at its mirror. (0.3.2 HM1 after the merge: on A1-1 alone the names table, now the matrix's height
//          (B-300, bottom 420), no longer reaches the chart (top 428, 8 px below): nothing blocks the move)
//   L1-L3  A1-1 as it is: the chart lined up with the grid (English's offset, shift 0), its inside as English, no overlap
//   C1-C6  mx8's Call Center shape (heatmap 9d8cf758, hour chart 52c8e333, made-up padding left 0 right 20, sorted
//          Ascending) with a made-up 15-wide shape where the lined-up chart would land: kept at its mirror
// Edges, never centres (L-1102-07): for every hour k, bar k's left and right edges (its slot in the plot area: the box
// less its padding, 24 even slots) against hour k's cell's left and right edges (the grid: the box less its padding and
// row-header strip, 24 even cells). Kept at its mirror, the chart stands `shift` px from where lined up would put it
// (stated per case); each edge's offset is English's plus that shift, within TOL px. A reversed inside (the general
// mirror's Descending sort) puts bar k under cell 23-k: hundreds of px off.   node test-0.3.2-hm2.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-hm2-')));
process.env.DATAARCUS_ROOT = ROOT;
const TOL = 0.5;

const Plans = await import('./lib/plans.mjs');
const { register } = await import('./tools/create_arabic_twin.mjs');
let handler = null;
register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = h; } }, {});
const call = async (a) => { const r = await handler(a), t = (r.content || []).map((c) => c.text || '').join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* words */ } return { err: !!r.isError, t, j }; };

// ---- a synthetic project from a spec (as test-0.3.1-twin-fuzz.mjs materializes the lab's specs) ----
const put = (f, x) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(x, null, 2) + '\n'); };
const schema = (s) => 'https://developer.microsoft.com/json-schemas/fabric/' + s + '/schema.json';
const VS = schema('item/report/definition/visualContainer/2.1.0');
const L = (v) => ({ expr: { Literal: { Value: String(v) } } });
function materialize(spec, dir) {
  const wr = (f, x) => put(path.join(dir, f), x), D = 'Synthetic.Report/definition';
  const fields = new Map(), measures = new Set(['Metric']);
  const walk = (x) => { if (!x || typeof x !== 'object') return; if (x.Column && x.Column.Property) fields.set(x.Column.Property, /Hour/.test(x.Column.Property) ? 'int64' : 'string'); if (x.Measure && x.Measure.Property) measures.add(x.Measure.Property); Object.values(x).forEach(walk); };
  walk(spec);
  wr('Synthetic.pbip', { $schema: schema('pbip/pbipProperties/1.0.0'), version: '1.0', artifacts: [{ report: { path: 'Synthetic.Report' } }], settings: { enableAutoRecovery: true } });
  wr('Synthetic.Report/.platform', { $schema: schema('gitIntegration/platformProperties/2.0.0'), metadata: { type: 'Report', displayName: 'Synthetic' }, config: { version: '2.0', logicalId: '11111111-2222-4333-8444-555555555555' } });
  wr('Synthetic.Report/definition.pbir', { $schema: schema('item/report/definitionProperties/2.0.0'), version: '4.0', datasetReference: { byPath: { path: '../Synthetic.SemanticModel' } } });
  wr('Synthetic.SemanticModel/definition.pbism', { $schema: schema('item/semanticModel/definitionProperties/1.0.0'), version: '4.0', settings: {} });
  wr('Synthetic.SemanticModel/model.bim', { compatibilityLevel: 1567, model: { culture: 'en-US', tables: [{ name: 'Synthetic', columns: [...fields].map(([name, dataType]) => ({ name, dataType, sourceColumn: name })), measures: [...measures].map((name) => ({ name, expression: 'BLANK()' })), partitions: [{ name: 'Synthetic', mode: 'import', source: { type: 'm', expression: 'let Source = #table({}, {}) in Source' } }] }] } });
  wr(D + '/version.json', { $schema: schema('item/report/definition/versionMetadata/1.0.0'), version: '2.0.0' });
  wr(D + '/report.json', { $schema: schema('item/report/definition/report/2.1.0'), settings: { useStylableVisualContainerHeader: true } });
  const ids = spec.pages.map((p) => p.id);
  wr(D + '/pages/pages.json', { $schema: schema('item/report/definition/pagesMetadata/1.0.0'), pageOrder: ids, activePageName: ids[0] });
  spec.pages.forEach((p) => {
    wr(D + '/pages/' + p.id + '/page.json', { $schema: schema('item/report/definition/page/2.0.0'), name: p.id, displayName: 'Synthetic page', displayOption: 'FitToPage', width: p.width, height: p.height });
    for (const v of p.visuals) wr(D + '/pages/' + p.id + '/visuals/' + v.name + '/visual.json', v);
  });
}
async function twinOf(spec, name) {
  const dir = path.join(ROOT, name); fs.mkdirSync(dir); materialize(spec, dir);
  const base = { path: name + '/Synthetic.pbip', arabicMonth: false };
  const p = await call(base), id = p.j && p.j.plan && p.j.plan.planId;
  if (!id) throw new Error('no plan id: ' + p.t.slice(0, 300));
  Plans.approve(id, 'user-in-browser');
  const w = await call(Object.assign({}, base, { planId: id }));
  if (w.err) throw new Error('not written: ' + w.t.slice(0, 300));
  const at = (pg, v) => { const f = path.join(dir, 'Synthetic AR.Report/definition/pages', pg, 'visuals', v, 'visual.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; };
  return { plan: p.j, at };
}

// ---- edges ----
const lit = (p) => (p && p.expr && p.expr.Literal ? parseFloat(String(p.expr.Literal.Value)) : NaN);
const padOf = (v, side) => { const e = ((v.visual.visualContainerObjects || {}).padding || []).find((x) => !x.selector && x.properties); const n = e ? lit(e.properties[side]) : NaN; return Number.isFinite(n) ? n : 0; };
const stripOf = (m) => { const rq = m.visual.query.queryState.Rows.projections[0].queryRef, e = ((m.visual.objects || {}).columnWidth || []).find((x) => x.selector && x.selector.metadata === rq); return e ? lit(e.properties.value) : 0; };
const span = (v, strip) => { const l = v.position.x + padOf(v, 'left') + (strip || 0), r = v.position.x + v.position.width - padOf(v, 'right'); return { l, w: r - l }; };
// [left edge offset, right edge offset] of bar k from hour k's cell (the chart's category order is English's when its
// sort is English's: a Descending sort lays hour k in slot 23-k)
const edges = (c, m, strip, k) => { const g = span(m, strip), b = span(c), desc = /Descending/.test(JSON.stringify(c.visual.query.sortDefinition || {})) && !/Descending/.test(JSON.stringify(c.en.visual.query.sortDefinition || {})), s = desc ? 23 - k : k;
  return [(b.l + s * b.w / 24) - (g.l + k * g.w / 24), (b.l + (s + 1) * b.w / 24) - (g.l + (k + 1) * g.w / 24)]; };
const J = (x) => JSON.stringify(x === undefined ? null : x), r2 = (n) => Math.round(n * 100) / 100;
const inside = (tw, en) => J((tw.visual.visualContainerObjects || {}).padding) === J((en.visual.visualContainerObjects || {}).padding) && J((tw.visual.objects || {}).valueAxis) === J((en.visual.objects || {}).valueAxis)
  && J((tw.visual.objects || {}).categoryAxis) === J((en.visual.objects || {}).categoryAxis) && J(tw.visual.query.sortDefinition) === J(en.visual.query.sortDefinition);
const showIn = (v) => v && J([(v.visual.visualContainerObjects || {}).padding, (v.visual.objects || {}).valueAxis, (v.visual.objects || {}).categoryAxis, v.visual.query.sortDefinition]);

// one case: English's heatmap m and chart c on page pg; the twin's strip is 1 (the names beside it, MX7)
async function fallbackCase(tag, spec, pg, m, c) {
  const W = spec.pages[0].width, E = new Map(spec.pages[0].visuals.map((v) => [v.name, v]));
  let t = null; try { t = await twinOf(spec, tag); } catch (e) { problems.push(`${tag}. the twin is written: ${e.message}`); checks += 6; return; }
  const em = E.get(m), ec = E.get(c), tm = t.at(pg, m), tc = t.at(pg, c), rule = ((t.plan.movedByRule || []).find((x) => x.where === pg + '/' + c) || {}).rule || '';
  if (tc) tc.en = ec;
  ec.en = ec;
  const mirrorX = W - ec.position.x - ec.position.width;
  // where lined up would put it: English's offset from the grid's left edge (MX7)
  const want = span(tm, 1).l - span(em, stripOf(em)).l + ec.position.x, shift = tc ? tc.position.x - want : NaN;
  chk(() => tc && Math.abs(tc.position.x - mirrorX) < 0.01 && /kept at its mirror/.test(rule), () => `${tag}1. the chart is kept at its mirror (x ${r2(mirrorX)}), said in movedByRule: ${tc && J(tc.position)} ${J(rule)}`);
  chk(() => /inside as English/.test(rule), () => `${tag}2. the plan's line says both: kept at its mirror, its inside as English: ${J(rule)}`);
  chk(() => tc && inside(tc, ec), () => `${tag}3. its padding, axis cards and sort as English's: ${showIn(tc)} (English ${showIn(ec)})`);
  const bad = []; if (tc && tm) for (let k = 0; k < 24; k++) { const a = edges(tc, tm, 1, k), b = edges(ec, em, stripOf(em), k); [0, 1].forEach((i) => { if (Math.abs(a[i] - (b[i] + shift)) > TOL) bad.push(`hour ${k} ${i ? 'right' : 'left'} ${r2(a[i])} (English ${r2(b[i])} + shift ${r2(shift)})`); }); }
  chk(() => tc && tm && !bad.length, () => `${tag}4. every bar's left and right edges stand off its own hour's cell as English's plus the stated shift ${r2(shift)}, within ${TOL} px: ${bad.slice(0, 4).join('; ')}${bad.length > 4 ? ` (+${bad.length - 4})` : ''}`);
  chk(() => tc && Math.abs(tc.position.width - ec.position.width) < 0.01 && Math.abs(tc.position.y - ec.position.y) < 0.01, () => `${tag}5 (guard). its box English's size and top: ${tc && J(tc.position)}`);
  return { shift, rule };
}

try {
  // A: Codex's A1-1 as it is (its synthetic matrix v0 and column chart v1, 1280 x 720)
  const a1 = JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures/hm2/A1-1.json'), 'utf8'));
  // (HM1 after the merge) A1-1 as it is: the names table ends at the matrix's bottom (420), the chart starts at 428, so the
  // chart lines up with the grid; edges, within TOL px
  { const E = new Map(a1.pages[0].visuals.map((v) => [v.name, v])), em = E.get('v0'), ec = E.get('v1');
    let t = null; try { t = await twinOf(a1, 'L'); } catch (e) { problems.push(`L. the twin is written: ${e.message}`); }
    const tm = t && t.at('p0', 'v0'), tc = t && t.at('p0', 'v1'), tn = t && t.at('p0', 'v0Names'), rule = t ? ((t.plan.movedByRule || []).find((x) => x.where === 'p0/v1') || {}).rule || '' : '';
    if (tc) tc.en = ec; ec.en = ec;
    const want = tm ? span(tm, 1).l - span(em, stripOf(em)).l + ec.position.x : NaN;
    chk(() => tc && Math.abs(tc.position.x - want) < 0.01 && Math.abs(want - 351.17) < 0.01 && /kept lined up/.test(rule), () => `L1. A1-1: the chart lined up with the grid (x 351.17), said in movedByRule: ${tc && J(tc.position)} ${J(rule)}`);
    const bad = []; if (tc && tm) for (let k = 0; k < 24; k++) { const a = edges(tc, tm, 1, k), b = edges(ec, em, stripOf(em), k); [0, 1].forEach((i) => { if (Math.abs(a[i] - b[i]) > TOL) bad.push(`hour ${k} ${i ? 'right' : 'left'} ${r2(a[i])} (English ${r2(b[i])})`); }); }
    chk(() => tc && inside(tc, ec) && tm && !bad.length, () => `L2. its inside as English and every bar's left and right edges off its own hour's cell as English's, within ${TOL} px: ${showIn(tc)} ${bad.slice(0, 4).join('; ')}`);
    chk(() => tc && tn && tm && tc.position.y - (tn.position.y + tn.position.height) >= -TOL && tc.position.y - (tm.position.y + tm.position.height) >= -TOL, () => `L3. the names table (the matrix's height, B-300) and the matrix end above the chart's top: ${tn && J(tn.position)} ${tc && J(tc.position)}`); }
  // A: A1-1 with a made-up shape where the lined-up chart would land (Arabic x 1010-1025, its mirror ends at 999.83):
  // English x 255, 10.17 left of the chart, overlapping nothing there
  const a1b = JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures/hm2/A1-1.json'), 'utf8'));
  a1b.pages[0].visuals.push({ $schema: VS, name: 'block', position: { x: 255, y: 440, width: 15, height: 60, z: 3000, tabOrder: 3000 }, visual: { visualType: 'shape', objects: { shape: [{ properties: { tileShape: L("'rectangle'") } }] } } });
  const ra = await fallbackCase('A', a1b, 'p0', 'v0', 'v1');
  chk(() => ra && Math.abs(ra.shift - -31.34) < 0.01, () => `A6 (guard). the stated shift, mirror less lined-up place: -31.34 px: ${ra && r2(ra.shift)}`);

  // C: mx8's Call Center shape (1280 x 800): heatmap 9d8cf758's box and strip, the hour chart 52c8e333 under its grid
  // (made-up padding left 0, right 20, sorted Ascending), and a made-up 15-wide shape beside the chart in English that
  // the lined-up chart would cover in the twin (not its mirror)
  const col = (n) => ({ field: { Column: { Expression: { SourceRef: { Entity: 'Synthetic' } }, Property: n } }, queryRef: 'Synthetic.' + n, nativeQueryRef: n });
  const mea = (n) => ({ field: { Measure: { Expression: { SourceRef: { Entity: 'Synthetic' } }, Property: n } }, queryRef: 'Synthetic.' + n, nativeQueryRef: n });
  const heat = { $schema: VS, name: 'heat', position: { x: 543.33, y: 434.17, width: 317.5, height: 188.33, z: 26000, tabOrder: 26000 }, visual: { visualType: 'pivotTable',
    query: { queryState: { Rows: { projections: [Object.assign(col('Weekday'), { displayName: ' ' })] }, Columns: { projections: [col('Call Hour')] }, Values: { projections: [mea('Calls')] } } },
    objects: { subTotals: [{ properties: { rowSubtotals: L('false'), columnSubtotals: L('false') } }], grid: [{ properties: { textSize: L('10D') } }], columnWidth: [{ properties: { value: L('38.06D') }, selector: { metadata: 'Synthetic.Weekday' } }] },
    visualContainerObjects: { padding: [{ properties: { right: L('6D') } }] } } };
  const hours = { $schema: VS, name: 'hours', position: { x: 557.5, y: 603.75, width: 310, height: 82.5, z: 28000, tabOrder: 28000 }, visual: { visualType: 'columnChart',
    query: { queryState: { Category: { projections: [col('Call Hour')] }, Y: { projections: [mea('Calls')] } }, sortDefinition: { sort: [{ field: col('Call Hour').field, direction: 'Ascending' }] } },
    objects: { categoryAxis: [{ properties: { show: L('false') } }], valueAxis: [{ properties: { show: L('false') } }] },
    visualContainerObjects: { padding: [{ properties: { left: L('0D'), right: L('20D') } }] } } };
  const block = { $schema: VS, name: 'block', position: { x: 870, y: 610, width: 15, height: 60, z: 29000, tabOrder: 29000 }, visual: { visualType: 'shape', objects: { shape: [{ properties: { tileShape: L("'rectangle'") } }] } } };
  const rc = await fallbackCase('C', { pages: [{ id: 'cc', width: 1280, height: 800, visuals: [heat, hours, block] }] }, 'cc', 'heat', 'hours');
  chk(() => rc && Math.abs(rc.shift - 16.22) < 0.01, () => `C6 (guard). the stated shift, mirror less lined-up place: 16.22 px: ${rc && r2(rc.shift)}`);
  if (process.env.HM2_SHOW) console.log(JSON.stringify({ A: ra, C: rc }));
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.2-hm2.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((x) => console.log('  - ' + x)); console.log(`FAIL  hm2  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  hm2  ${checks} checks`);
