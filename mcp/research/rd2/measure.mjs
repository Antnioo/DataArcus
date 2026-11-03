// RD2 scratch (research only): makes the twin, the native copy and the redesign of a copy of mcp/fixtures/twin-project
// through the real server's tools (plan, approve_plan, write), then runs layer 1 on each pair and on 6 planted changes.
// Made-up data in os.tmpdir() only. node mcp/research/rd2/measure.mjs  [--json out.json]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), MCP = path.join(HERE, '..', '..');
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-rd2-'));
process.env.DATAARCUS_ROOT = ROOT;
const { serverClient } = await import(path.join(MCP, 'test-0.2.9.mjs'));
const { compare } = await import('./layer1.mjs');

let checks = 0; const problems = [];
const chk = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8')), wr = (f, j) => fs.writeFileSync(f, JSON.stringify(j, null, 2));
// a made-up value planted in every filter: it must never reach an answer
const CANARY = 'RD2_CANARY_FILTER_7319';
const lit = (v) => ({ Literal: { Value: `'${v}'` } });
const colOf = (e, p) => ({ Column: { Expression: { SourceRef: { Entity: e } }, Property: p } });
const inFilter = (e, p, v) => ({ Version: 2, From: [{ Name: 's', Entity: e, Type: 0 }], Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: 's' } }, Property: p } }], Values: [[lit(v)]] } } }] });
const topN = (n) => ({ Version: 2, From: [{ Name: 'subquery', Expression: { Subquery: { Query: { Version: 2, From: [{ Name: 's', Entity: 'Sales', Type: 0 }], Select: [{ Column: { Expression: { SourceRef: { Source: 's' } }, Property: 'Product' }, Name: 'field' }], OrderBy: [{ Direction: 2, Expression: { Measure: { Expression: { SourceRef: { Source: 's' } }, Property: 'Total Sales' } } }], Top: n } } }, Type: 2 }, { Name: 's', Entity: 'Sales', Type: 0 }], Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: 's' } }, Property: 'Product' } }], Table: { SourceRef: { Source: 'subquery' } } } } }] });

// the original: twin-project plus a page filter (the canary), a Top N 5 on the bar chart and display units on a card
const P = path.join(ROOT, 'p'); fs.cpSync(path.join(MCP, 'fixtures/twin-project'), P, { recursive: true });
const DEF = path.join(P, 'Twin Sales.Report/definition/pages');
{ const f = path.join(DEF, 'p1overview/page.json'), j = rd(f); j.filterConfig = { filters: [{ name: 'pf1', field: colOf('Sales', 'Region'), type: 'Categorical', filter: inFilter('Sales', 'Region', CANARY) }] }; wr(f, j); }
{ const f = path.join(DEF, 'p2details/visuals/barProduct/visual.json'), j = rd(f); j.filterConfig = { filters: [{ name: 'vf1', field: colOf('Sales', 'Product'), type: 'TopN', filter: topN(5) }] }; wr(f, j); }
{ const f = path.join(DEF, 'p1overview/visuals/cardSales/visual.json'), j = rd(f); j.visual.objects = Object.assign({}, j.visual.objects, { labels: [{ properties: { labelDisplayUnits: { expr: { Literal: { Value: '0D' } } } } }] }); wr(f, j); }

const s = await serverClient(ROOT, {});
const made = {}, timings = {};
const MODEL = 'p/Twin Sales.SemanticModel', FROM = 'p/Twin Sales.pbip';
const run = async (label, planTool, planArgs, writeTool, writeArgs) => {
  const pl = await s.call(planTool, planArgs), id = pl.j && pl.j.plan && pl.j.plan.planId;
  if (!id) { made[label] = { error: pl.t.slice(0, 300) }; return; }
  await s.call('approve_plan', { planId: id });
  const w = await s.call(writeTool, Object.assign({}, writeArgs, { planId: id }));
  made[label] = w.err ? { error: w.t.slice(0, 300) } : { report: w.j.report || w.j.twin || null };
};
try {
  await run('twin', 'create_arabic_twin', { path: FROM }, 'create_arabic_twin', { path: FROM });
  await run('native', 'plan_layout', { path: MODEL, customVisualsFrom: FROM }, 'create_report', { path: MODEL });
  await run('redesign', 'plan_layout', { path: MODEL, redesignFrom: FROM }, 'create_report', { path: MODEL });
  // a second project: the line chart over months holds a visual calculation (a running sum along its axis); its twin
  const Q = path.join(ROOT, 'q'); fs.cpSync(path.join(MCP, 'fixtures/twin-project'), Q, { recursive: true });
  { const f = path.join(Q, 'Twin Sales.Report/definition/pages/p1overview/visuals/lineMonth/visual.json'), j = rd(f); j.visual.query.queryState.Y.projections.push({ field: { NativeVisualCalculation: { Language: 'dax', Expression: 'RUNNINGSUM([Total Sales])', Name: 'Running total' } }, queryRef: 'Running total', nativeQueryRef: 'Running total' }); wr(f, j); }
  await run('twinCalc', 'create_arabic_twin', { path: 'q/Twin Sales.pbip' }, 'create_arabic_twin', { path: 'q/Twin Sales.pbip' });
} finally { await s.close(); }
const reports = fs.readdirSync(P).filter((n) => /\.Report$/.test(n));
const by = { twin: reports.find((n) => / AR\.Report$/.test(n)), native: reports.find((n) => / native\.Report$/.test(n)), redesign: reports.find((n) => / redesigned\.Report$/.test(n)) };
const ORIG = path.join(P, 'Twin Sales.Report');
{ const q = path.join(ROOT, 'q'), n = fs.readdirSync(q).find((x) => / AR\.Report$/.test(x)); chk(!!n, 'the twin of the visual-calculation copy was written: ' + JSON.stringify(made.twinCalc));
  if (n) { const r = compare(path.join(q, 'Twin Sales.Report'), path.join(q, n)); made.twinCalcResult = r.differ.filter((x) => x.visual === 'lineMonth');
    chk(made.twinCalcResult.some((x) => x.differ.some((y) => /visual calculation: its numbers can change/.test(y.what))), 'the twin flips the order of a chart holding a visual calculation: said as a question: ' + JSON.stringify(made.twinCalcResult)); } }
const pairs = {};
for (const [k, n] of Object.entries(by)) {
  chk(!!n, `${k} was written: ${JSON.stringify(made[k])}`);
  if (!n) continue;
  const t0 = process.hrtime.bigint(); const r = compare(ORIG, path.join(P, n)); timings[k] = Number(process.hrtime.bigint() - t0) / 1e6;
  pairs[k] = r;
}
// the twin again, with what its own plan says the mirror changes on purpose (the mirror's changes per visual: sort on a
// chart, the Row label measure of a table led by a text column)
if (by.twin) pairs.twinWithPlan = compare(ORIG, path.join(P, by.twin), { expected: [
  { visual: 'colRegion', what: /^sort / }, { visual: 'lineMonth', what: /^sort / },
  { visual: 'tblProducts', what: /Values: field added|report measure changed/, field: 'Row label: ' }] });
// the native copy again, with its plan's replacement (the custom visual becomes a native card on the same measure)
if (by.native) pairs.nativeWithPlan = compare(ORIG, path.join(P, by.native), { expected: [{ visual: 'customGauge', what: /visual type changed, the same fields/ }] });
// scale: 40 pages of 25 visuals (the twin-project's charts copied), against a copy with 300 visuals changed
{ const big = path.join(ROOT, 'big'); fs.cpSync(P, big, { recursive: true, filter: (src) => !/ (AR|native|redesigned)\.Report/.test(src) });
  const pages = path.join(big, 'Twin Sales.Report/definition/pages'), tpl = ['barProduct', 'tblProducts'].map((v) => rd(path.join(pages, 'p2details/visuals', v, 'visual.json'))).concat(['colRegion', 'lineMonth', 'cardSales'].map((v) => rd(path.join(pages, 'p1overview/visuals', v, 'visual.json'))));
  const order = rd(path.join(pages, 'pages.json'));
  for (let p = 0; p < 40; p++) { const id = 'big' + p; fs.mkdirSync(path.join(pages, id, 'visuals'), { recursive: true }); wr(path.join(pages, id, 'page.json'), Object.assign(rd(path.join(pages, 'p1overview/page.json')), { name: id, displayName: 'Big ' + p }));
    for (let v = 0; v < 25; v++) { const j = JSON.parse(JSON.stringify(tpl[v % tpl.length])); j.name = `v${p}_${v}`; delete j.parentGroupName; fs.mkdirSync(path.join(pages, id, 'visuals', j.name)); wr(path.join(pages, id, 'visuals', j.name, 'visual.json'), j); }
    order.pageOrder.push(id); }
  wr(path.join(pages, 'pages.json'), order);
  const big2 = path.join(ROOT, 'big2'); fs.cpSync(big, big2, { recursive: true }); let changed = 0;
  for (let p = 0; p < 40 && changed < 300; p++) for (let v = 0; v < 25 && changed < 300; v += 3) { const f = path.join(big2, 'Twin Sales.Report/definition/pages', 'big' + p, 'visuals', `v${p}_${v}`, 'visual.json'), j = rd(f); j.visual.visualType = 'donutChart'; wr(f, j); changed++; }
  const t0 = process.hrtime.bigint(); const r = compare(path.join(big, 'Twin Sales.Report'), path.join(big2, 'Twin Sales.Report')); timings.big1017 = Number(process.hrtime.bigint() - t0) / 1e6;
  pairs.big = r; chk(r.visuals === 1017 && r.differCount === 300 && r.differ.length === 60, `scale: 1017 visuals, 300 differ, 60 listed: ${JSON.stringify({ v: r.visuals, d: r.differCount, l: r.differ.length })}`);
  chk(JSON.stringify(r).length < 40000, 'scale: the answer under 40,000 characters: ' + JSON.stringify(r).length); }

// the 6 planted changes, each on its own copy of the original
const PLANTS = [
  ['measure swapped', 'p2details/visuals/barProduct', (j) => { j.visual.query.queryState.Y.projections[0].field.Measure.Property = 'Orders'; }, /Y: field swapped/],
  ['filter added', 'p1overview/visuals/colRegion', (j) => { j.filterConfig = { filters: [{ name: 'nf', field: colOf('Sales', 'Product'), type: 'Categorical', filter: inFilter('Sales', 'Product', CANARY) }] }; }, /visual filter added/],
  ['Top N 5 to 10', 'p2details/visuals/barProduct', (j) => { j.filterConfig.filters[0].filter = topN(10); }, /visual Top N changed/],
  ['display units 0 to K', 'p1overview/visuals/cardSales', (j) => { j.visual.objects.labels[0].properties.labelDisplayUnits.expr.Literal.Value = '1000D'; }, /display units changed/],
  ['sort flipped', 'p2details/visuals/barProduct', (j) => { const s0 = j.visual.query.sortDefinition.sort[0]; s0.direction = /desc/i.test(s0.direction) ? 'Ascending' : 'Descending'; }, /sort direction changed/],
  ['visual calculation', 'p2details/visuals/tblProducts', (j) => { j.visual.query.queryState.Values.projections.push({ field: { NativeVisualCalculation: { Language: 'dax', Expression: `RUNNINGSUM([Total Sales]) + 0 * LEN("${CANARY}")`, Name: 'Running' } }, queryRef: 'Running', nativeQueryRef: 'Running' }); }, /field added/]
];
const planted = [];
PLANTS.forEach(([name, rel, edit, want], i) => {
  const d = path.join(ROOT, 'plant' + i); fs.cpSync(P, d, { recursive: true, filter: (src) => !/ (AR|native|redesigned)\.Report/.test(src) });
  const f = path.join(d, 'Twin Sales.Report/definition/pages', rel, 'visual.json'), j = rd(f); edit(j); wr(f, j);
  const r = compare(ORIG, path.join(d, 'Twin Sales.Report'));
  const hits = r.differ.filter((x) => x.differ.some((y) => want.test(y.what)));
  planted.push({ name, found: hits.length === 1 && rel.endsWith(hits[0].visual), visual: hits.map((h) => h.visual), kinds: hits.flatMap((h) => h.differ.map((y) => y.tier + ': ' + y.what)), others: r.differCount - hits.length });
  chk(hits.length === 1 && rel.endsWith(hits[0].visual) && r.differCount === 1, `planted "${name}": found once on ${rel}: ${JSON.stringify(r.differ)}`);
});

const all = JSON.stringify({ pairs, planted });
chk(!all.includes(CANARY), 'no canary value in any answer');
const summary = (r) => ({ visuals: r.visuals, matched: r.matched, sameQuestion: r.sameQuestion, orderOnly: r.orderOnly, displayOnly: r.displayOnly, expectedOnly: r.expectedOnly || 0, questionDiffers: r.differCount - r.orderOnly - r.displayOnly - (r.expectedOnly || 0), noQuery: r.noQuery, notMatched: r.notMatched.length, pageContext: r.pageContext.length, answerChars: JSON.stringify(r).length });
const out = { made, timingsMs: timings, pairs: Object.fromEntries(Object.entries(pairs).map(([k, r]) => [k, summary(r)])), detail: Object.fromEntries(Object.entries(pairs).map(([k, r]) => [k, { differ: r.differ, notMatched: r.notMatched, pageContext: r.pageContext }])), planted };
const jf = process.argv.indexOf('--json'); if (jf > 0) fs.writeFileSync(process.argv[jf + 1], JSON.stringify(out, null, 2));
console.log(JSON.stringify({ twinCalc: made.twinCalcResult, made: Object.keys(out.made), timingsMs: out.timingsMs, pairs: out.pairs, planted: planted.map((p) => [p.name, p.found, p.kinds]) }, null, 1));
fs.rmSync(ROOT, { recursive: true, force: true });
problems.forEach((p) => console.log('problem: ' + p.slice(0, 600)));
console.log(problems.length ? `FAIL script=rd2-layer1 cause=${problems.length} problem(s)` : '');
console.log(`${problems.length ? 'FAIL' : 'PASS'}  rd2-layer1  ${checks} checks`);
