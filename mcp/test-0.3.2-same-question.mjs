import './test-env.mjs';
// 0.3.2 NC1 (the owner's D-1104-01; mcp/work/NC1.md; written red first on 1e5e3b3). The number check's layer 1, as RD2's
// brief g says (rd/0.3.2-number-check, mcp/research/RD2-number-check.md, read only): check_report { path, against }
// says, visual by visual, whether the copy asks the model the same question as the original, in three tiers
// (question, display, order), from the files only; every filter, slicer selection, visual calculation, report measure
// and bookmark compared by hash and never returned.
// Made up, in os.tmpdir(), from mcp/fixtures/twin-project, through the real server (plan, approve_plan, write):
//   T1-T3  the twin 6 same / 2 order / 1 question; the native copy 8 / 0 / 1; the redesign 9 / 0 / 0 (8 without a query)
//   P1-P8  eight planted changes, each found once on its own visual, with its tier, and nothing else
//   C1     a canary in a page filter, a visual filter, a slicer selection, a visual calculation, a report measure and
//          a bookmark: in no answer
//   S1-S4  1,017 visuals with 300 differing: 60 listed, 300 counted, the whole answer under 40,000 characters and not
//          cut (no truncated), the compare under 2 s
//   R1-R5  refused: another model, PBIR-Legacy, outside the working folder, a link, against without path's model
//   W1     both reports' files byte for byte after every call (read-only)
//   L1-L4  the public line (ROADMAP.md, NUMBER-CHECK.md), the description and TOOLS.md say what layer 1 proves and
//          what it does not; layer 2 stays planned
// Metadata only: no model rows.   node test-0.3.2-same-question.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-nc1-')));
process.env.DATAARCUS_ROOT = ROOT;
const { serverClient } = await import('./test-0.2.9.mjs');

const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n');
const CANARY = 'NC1_CANARY_5521';
const lit = (v) => ({ Literal: { Value: `'${v}'` } });
const colOf = (e, p) => ({ Column: { Expression: { SourceRef: { Entity: e } }, Property: p } });
const inFilter = (e, p, v) => ({ Version: 2, From: [{ Name: 's', Entity: e, Type: 0 }], Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: 's' } }, Property: p } }], Values: [[lit(v)]] } } }] });
const topN = (n) => ({ Version: 2, From: [{ Name: 'subquery', Expression: { Subquery: { Query: { Version: 2, From: [{ Name: 's', Entity: 'Sales', Type: 0 }], Select: [{ Column: { Expression: { SourceRef: { Source: 's' } }, Property: 'Product' }, Name: 'field' }], OrderBy: [{ Direction: 2, Expression: { Measure: { Expression: { SourceRef: { Source: 's' } }, Property: 'Total Sales' } } }], Top: n } } }, Type: 2 }, { Name: 's', Entity: 'Sales', Type: 0 }], Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: 's' } }, Property: 'Product' } }], Table: { SourceRef: { Source: 'subquery' } } } } }] });
const RP = 'Twin Sales.Report', PAGES = (d) => path.join(d, RP, 'definition/pages');
const files = (d) => { const out = {}; const walk = (x) => fs.readdirSync(x, { withFileTypes: true }).forEach((e) => { const f = path.join(x, e.name); if (e.isDirectory()) walk(f); else if (e.isFile()) out[path.relative(d, f)] = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); }); walk(d); return out; };
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

// the original: twin-project plus a page filter and a bookmark state holding the canary, a Top N 5 on the bar chart,
// display units on a card (RD2's shape)
const P = path.join(ROOT, 'p'); fs.cpSync(path.join(HERE, 'fixtures/twin-project'), P, { recursive: true });
{ const f = path.join(PAGES(P), 'p1overview/page.json'), j = rd(f); j.filterConfig = { filters: [{ name: 'pf1', field: colOf('Sales', 'Region'), type: 'Categorical', filter: inFilter('Sales', 'Region', CANARY) }] }; wr(f, j); }
{ const f = path.join(PAGES(P), 'p2details/visuals/barProduct/visual.json'), j = rd(f); j.filterConfig = { filters: [{ name: 'vf1', field: colOf('Sales', 'Product'), type: 'TopN', filter: topN(5) }] }; wr(f, j); }
{ const f = path.join(PAGES(P), 'p1overview/visuals/cardSales/visual.json'), j = rd(f); j.visual.objects = Object.assign({}, j.visual.objects, { labels: [{ properties: { labelDisplayUnits: { expr: { Literal: { Value: '0D' } } } } }] }); wr(f, j); }
{ const f = path.join(P, RP, 'definition/bookmarks/bmDetails.bookmark.json'), j = rd(f); j.explorationState.filters = { byExpr: [{ name: 'bf', type: 'Categorical', expression: colOf('Sales', 'Region'), filter: inFilter('Sales', 'Region', CANARY) }] }; wr(f, j); }
const ORIG = rel(path.join(P, RP));
// a copy of a report folder beside the others, its definition.pbir naming the original's model (the same model)
const MODEL = path.join(P, 'Twin Sales.SemanticModel');
const copyReport = (fromDir, to) => { fs.mkdirSync(to, { recursive: true }); fs.cpSync(path.join(fromDir, RP), path.join(to, RP), { recursive: true });
  const pb = path.join(to, RP, 'definition.pbir'), pj = rd(pb); pj.datasetReference.byPath.path = path.relative(path.join(to, RP), MODEL).split(path.sep).join('/'); wr(pb, pj); return to; };

const s = await serverClient(ROOT, {});
const answers = [];
const check = async (p, against, more) => { const r = await s.call('check_report', Object.assign({ path: p }, against === undefined ? {} : { against }, more || {})); answers.push(r.t); return r; };
const made = {};
const run = async (label, planTool, planArgs, writeTool, writeArgs) => {
  const pl = await s.call(planTool, planArgs), id = pl.j && pl.j.plan && pl.j.plan.planId;
  if (!id) { made[label] = { error: pl.t.slice(0, 300) }; return; }
  await s.call('approve_plan', { planId: id });
  const w = await s.call(writeTool, Object.assign({}, writeArgs, { planId: id }));
  made[label] = w.err ? { error: w.t.slice(0, 300) } : { ok: true };
};
const sq = (r) => (r && r.j && r.j.sameQuestion) || null;
const nums = (x) => (x ? [x.sameQuestion, x.orderOnly, x.questionDiffers, x.displayOnly, x.noQuery, x.notMatched] : null);
const digest = {};
try {
  await run('twin', 'create_arabic_twin', { path: 'p/Twin Sales.pbip' }, 'create_arabic_twin', { path: 'p/Twin Sales.pbip' });
  await run('native', 'plan_layout', { path: 'p/Twin Sales.SemanticModel', customVisualsFrom: 'p/Twin Sales.pbip' }, 'create_report', { path: 'p/Twin Sales.SemanticModel' });
  await run('redesign', 'plan_layout', { path: 'p/Twin Sales.SemanticModel', redesignFrom: 'p/Twin Sales.pbip' }, 'create_report', { path: 'p/Twin Sales.SemanticModel' });
  const reports = fs.readdirSync(P).filter((n) => /\.Report$/.test(n));
  const by = { twin: reports.find((n) => / AR\.Report$/.test(n)), native: reports.find((n) => / native\.Report$/.test(n)), redesign: reports.find((n) => / redesigned\.Report$/.test(n)) };
  chk(() => by.twin && by.native && by.redesign, () => `the three copies were written: ${JSON.stringify({ by, made })}`);
  fs.readdirSync(P).filter((n) => /\.Report$/.test(n)).forEach((n) => { digest[n] = files(path.join(P, n)); });

  // T1-T3: the three pairs
  const want = { twin: [6, 2, 1, 0, 8, 0], native: [8, 0, 1, 0, 8, 0], redesign: [9, 0, 0, 0, 8, 0] };
  for (const k of Object.keys(want)) {
    if (!by[k]) continue;
    const r = await check(rel(path.join(P, by[k])), ORIG), x = sq(r);
    chk(() => x && x.visuals === 17 && x.matched === 17, () => `T ${k}: 17 of 17 visuals matched by name: ${r.t.slice(0, 600)}`);
    chk(() => JSON.stringify(nums(x)) === JSON.stringify(want[k]), () => `T ${k}: same / order / question / display / no query / not matched ${JSON.stringify(want[k])}, got ${JSON.stringify(nums(x))}: ${JSON.stringify(x && x.differ)}`);
    chk(() => x.differ.length === want[k][1] + want[k][2] + want[k][3] && x.differ.every((d) => d.page && d.visual && d.tier && d.changes.length), () => `T ${k}: each differing visual listed by page and visual, with its tier and changes: ${JSON.stringify(x && x.differ)}`);
    chk(() => typeof x.said === 'string' && x.said.startsWith(`${want[k][0]} of 9 visuals ask the same question;`) && !/numbers are verified/i.test(r.t), () => `T ${k}: said as "N of M visuals ask the same question; ..." and never "the numbers are verified": ${x && x.said}`);
    if (k === 'twin') {
      const at = (v) => x.differ.find((d) => d.visual === v);
      chk(() => at('colRegion').tier === 'order' && at('lineMonth').tier === 'order' && at('tblProducts').tier === 'question', () => `T twin: colRegion and lineMonth only in order (the turned sort), tblProducts a question (the Row label measure): ${JSON.stringify(x.differ)}`);
    }
    if (k === 'native') chk(() => x.differ[0].visual === 'customGauge' && /visual type changed/.test(x.differ[0].changes[0].what), () => `T native: customGauge, its type changed on the same field: ${JSON.stringify(x.differ)}`);
  }
  // without against: no section, the answer as before
  { const r = await check(ORIG); chk(() => r.j && !('sameQuestion' in r.j), () => 'T without against: no sameQuestion section'); }

  // P1-P8: planted changes, each on its own copy of the original (beside it, so on the same model)
  const PLANTS = [
    ['measure swapped', 'p2details/visuals/barProduct', (j) => { j.visual.query.queryState.Y.projections[0].field.Measure.Property = 'Orders'; }, /Y: field swapped/, 'question'],
    ['filter added', 'p1overview/visuals/colRegion', (j) => { j.filterConfig = { filters: [{ name: 'nf', field: colOf('Sales', 'Product'), type: 'Categorical', filter: inFilter('Sales', 'Product', CANARY) }] }; }, /visual filter added/, 'question'],
    ['Top N 5 to 10', 'p2details/visuals/barProduct', (j) => { j.filterConfig.filters[0].filter = topN(10); }, /visual Top N changed/, 'question'],
    ['display units auto to K', 'p1overview/visuals/cardSales', (j) => { j.visual.objects.labels[0].properties.labelDisplayUnits.expr.Literal.Value = '1000D'; }, /display units changed/, 'display'],
    ['sort turned (with a Top N)', 'p2details/visuals/barProduct', (j) => { const s0 = j.visual.query.sortDefinition.sort[0]; s0.direction = /desc/i.test(s0.direction) ? 'Ascending' : 'Descending'; }, /sort direction changed/, 'question'],
    ['visual calculation added', 'p2details/visuals/tblProducts', (j) => { j.visual.query.queryState.Values.projections.push({ field: { NativeVisualCalculation: { Language: 'dax', Expression: `RUNNINGSUM([Total Sales]) + 0 * LEN("${CANARY}")`, Name: 'Running' } }, queryRef: 'Running', nativeQueryRef: 'Running' }); }, /field added \(a visual calculation\)/, 'question'],
    ['slicer selection saved', 'p1overview/visuals/slRegion', (j) => { j.visual.objects.general = [{ properties: { filter: { filter: inFilter('Sales', 'Region', CANARY) } } }]; }, /slicer selection changed/, 'question'],
    ['sort turned (no Top N)', 'p1overview/visuals/colRegion', (j) => { j.visual.query.sortDefinition = { sort: [{ field: { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Total Sales' } }, direction: 'Ascending' }] }; }, /sort (added|direction changed)/, 'order']
  ];
  for (const [i, [name, vrel, edit, re, tier]] of PLANTS.entries()) {
    const d = copyReport(P, path.join(ROOT, 'plant' + i));
    const f = path.join(PAGES(d), vrel, 'visual.json'), j = rd(f); edit(j); wr(f, j);
    const r = await check(rel(path.join(d, RP)), ORIG), x = sq(r);
    const hits = x ? x.differ.filter((v) => v.changes.some((c) => re.test(c.what))) : [];
    chk(() => hits.length === 1 && vrel.endsWith('/' + hits[0].visual) && x.differ.length === 1 && hits[0].tier === tier, () => `P${i + 1} "${name}": found once on ${vrel} as ${tier}, nothing else: ${r.t.slice(0, 900)}`);
  }
  // a report measure the visual shows, its expression changed (reportExtensions.json; the canary in it)
  { const d = copyReport(P, path.join(ROOT, 'rm', 'a'));
    const ext = (expr) => ({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/reportExtension/1.0.0/schema.json', name: 'extension', entities: [{ name: 'Sales', measures: [{ name: 'Share', dataType: 'Double', expression: expr, formatString: '0.0%' }] }] });
    const d2 = copyReport(d, path.join(ROOT, 'rm', 'b'));
    wr(path.join(d, RP, 'definition/reportExtensions.json'), ext('DIVIDE([Total Sales], 100)'));
    wr(path.join(d2, RP, 'definition/reportExtensions.json'), ext(`DIVIDE([Total Sales], 100) + 0 * LEN("${CANARY}")`));
    for (const dd of [d, d2]) { const f = path.join(PAGES(dd), 'p1overview/visuals/cardOrders/visual.json'), j = rd(f); const q = j.visual.query.queryState; const role = Object.keys(q)[0]; q[role].projections.push({ field: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: 'Sales' } }, Property: 'Share' } }, queryRef: 'Sales.Share', nativeQueryRef: 'Share' }); wr(f, j); }
    const r = await check(rel(path.join(d2, RP)), rel(path.join(d, RP))), x = sq(r);
    chk(() => x && x.differ.length === 1 && x.differ[0].visual === 'cardOrders' && x.differ[0].changes.some((c) => /report measure changed/.test(c.what)), () => `P9 a report measure's expression changed: said on cardOrders, nothing else: ${r.t.slice(0, 900)}`);
    // the bookmark holding the canary changed: counted in its own line, never its state
    const bf = path.join(d2, RP, 'definition/bookmarks/bmDetails.bookmark.json'), bj = rd(bf); bj.explorationState.filters.byExpr[0].filter = inFilter('Sales', 'Region', CANARY + 'B'); wr(bf, bj);
    const r2 = await check(rel(path.join(d2, RP)), rel(path.join(d, RP))), x2 = sq(r2);
    chk(() => x2 && x2.bookmarks && x2.bookmarks.changed === 1 && x2.bookmarks.before === 2 && x2.bookmarks.after === 2, () => `P10 a bookmark's state changed: counted (2, 2, 1 changed): ${JSON.stringify(x2 && x2.bookmarks)}`); }

  // S1-S4: scale, 40 pages of 25 visuals added, against a copy with 300 changed
  { const big = copyReport(P, path.join(ROOT, 'big'));
    const pages = PAGES(big), tpl = ['barProduct', 'tblProducts'].map((v) => rd(path.join(pages, 'p2details/visuals', v, 'visual.json'))).concat(['colRegion', 'lineMonth', 'cardSales'].map((v) => rd(path.join(pages, 'p1overview/visuals', v, 'visual.json'))));
    const order = rd(path.join(pages, 'pages.json'));
    for (let p = 0; p < 40; p++) { const id = 'big' + p; fs.mkdirSync(path.join(pages, id, 'visuals'), { recursive: true }); wr(path.join(pages, id, 'page.json'), Object.assign(rd(path.join(pages, 'p1overview/page.json')), { name: id, displayName: 'Big ' + p }));
      for (let v = 0; v < 25; v++) { const j = JSON.parse(JSON.stringify(tpl[v % tpl.length])); j.name = `v${p}_${v}`; delete j.parentGroupName; fs.mkdirSync(path.join(pages, id, 'visuals', j.name)); wr(path.join(pages, id, 'visuals', j.name, 'visual.json'), j); }
      order.pageOrder.push(id); }
    wr(path.join(pages, 'pages.json'), order);
    const big2 = copyReport(big, path.join(ROOT, 'big2')); let changed = 0;
    for (let p = 0; p < 40 && changed < 300; p++) for (let v = 0; v < 25 && changed < 300; v += 3) { const f = path.join(PAGES(big2), 'big' + p, 'visuals', `v${p}_${v}`, 'visual.json'), j = rd(f); j.visual.visualType = 'donutChart'; wr(f, j); changed++; }
    const r = await check(rel(path.join(big2, RP)), rel(path.join(big, RP)), { checks: ['schemas'] }), x = sq(r);
    chk(() => x && x.visuals === 1017 && x.questionDiffers === 300 && x.differ.length === 60 && x.notListed === 240, () => `S1 1,017 visuals, 300 differ, 60 listed, 240 counted: ${JSON.stringify(x && { v: x.visuals, d: x.questionDiffers, l: x.differ.length, n: x.notListed })}`);
    chk(() => r.t.length < 40000, () => `S2 the whole answer under 40,000 characters: ${r.t.length}`);
    chk(() => !/"truncated":(true|\{)/.test(r.t), () => 'S3 the answer is not cut (no truncated): ' + (r.t.match(/"truncated":[^,]{0,80}/g) || []).join(' '));
    let ms = Infinity; try { const { sameQuestion } = await import('./lib/same-question.mjs');
      const t0 = process.hrtime.bigint(); sameQuestion(rel(path.join(big2, RP)), rel(path.join(big, RP))); ms = Number(process.hrtime.bigint() - t0) / 1e6; } catch (e) { ms = Infinity; }
    // B-312 (L-1104-02): 2 s on Linux; Windows and macOS runners took 2,118-2,135 ms on 4 Nov, so 5 s there (headroom)
    const budget = process.platform === 'linux' ? 2000 : 5000;
    chk(() => ms < budget, () => `S4 the compare of 1,017 visuals under ${budget / 1000} s on ${process.platform}: ${Math.round(ms)} ms`);
    console.log(`  scale: 1,017 visuals in ${Math.round(ms)} ms, answer ${r.t.length} characters (checks: schemas)`); }

  // R1-R5: refusals
  { const o = path.join(ROOT, 'other'); fs.mkdirSync(o); fs.cpSync(path.join(P, RP), path.join(o, RP), { recursive: true }); fs.cpSync(path.join(P, 'Twin Sales.SemanticModel'), path.join(o, 'Other.SemanticModel'), { recursive: true });
    const pb = path.join(o, RP, 'definition.pbir'), pj = rd(pb); pj.datasetReference.byPath.path = '../Other.SemanticModel'; wr(pb, pj);
    const r = await check(rel(path.join(o, RP)), ORIG);
    chk(() => r.err && /same model/i.test(r.t) && !r.t.includes(CANARY), () => `R1 another model: refused, said: ${r.t.slice(0, 300)}`); }
  { const l = path.join(ROOT, 'legacy', 'Old.Report'); fs.mkdirSync(l, { recursive: true }); wr(path.join(l, 'report.json'), { config: '{}', sections: [] }); wr(path.join(l, 'definition.pbir'), { version: '1.0', datasetReference: { byPath: { path: '../../p/Twin Sales.SemanticModel' } } });
    const r = await check(ORIG, rel(l));
    chk(() => r.err && /PBIR-Legacy/.test(r.t), () => `R2 a PBIR-Legacy original: refused: ${r.t.slice(0, 300)}`); }
  // R3 and R4: an original outside the working folder, given by its path and through a link inside the folder
  { const out = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-nc1-out-')); fs.cpSync(path.join(P, RP), path.join(out, RP), { recursive: true });
    const r = await check(ORIG, path.relative(ROOT, path.join(out, RP)));
    chk(() => r.err && !r.t.includes(CANARY), () => `R3 an original outside the working folder: refused: ${r.t.slice(0, 300)}`);
    const ln = path.join(ROOT, 'linked'); let linked = false; try { fs.mkdirSync(ln); fs.symlinkSync(path.join(out, RP), path.join(ln, RP), 'junction'); linked = true; } catch (e) { linked = false; }
    if (linked) { const r4 = await check(ORIG, rel(path.join(ln, RP))); chk(() => r4.err && /link/i.test(r4.t) && !r4.t.includes(CANARY), () => `R4 a linked original: refused: ${r4.t.slice(0, 300)}`); }
    else console.log('  R4: this machine cannot make a link here; the link refusal is the reading block\'s (locate), tested in its own suites');
    fs.rmSync(out, { recursive: true, force: true }); }
  { const n = path.join(ROOT, 'nomodel'); fs.mkdirSync(n); fs.cpSync(path.join(P, RP), path.join(n, RP), { recursive: true }); fs.rmSync(path.join(n, RP, 'definition.pbir'));
    const r = await check(rel(path.join(n, RP)), ORIG);
    chk(() => r.err && /model/i.test(r.t), () => `R5 a copy that names no model: refused: ${r.t.slice(0, 300)}`); }

  // W1: read-only
  chk(() => fs.readdirSync(P).filter((n) => /\.Report$/.test(n)).every((n) => JSON.stringify(files(path.join(P, n))) === JSON.stringify(digest[n])), () => 'W1 check_report with against changed a file of the original or a copy');
} finally { await s.close(); }

// C1: no canary in any answer
chk(() => answers.length > 15 && answers.every((t) => !t.includes(CANARY)), () => `C1 a canary reached an answer: ${answers.findIndex((t) => t.includes(CANARY))}`);

// L1-L4: the public line and the description
const roadmap = fs.readFileSync(path.join(HERE, 'ROADMAP.md'), 'utf8').replace(/\s+/g, ' ');
const plan = fs.readFileSync(path.join(HERE, 'plans/NUMBER-CHECK.md'), 'utf8').replace(/\s+/g, ' ');
const said = (t) => /`check_report` with `against`/.test(t) && /does not run the queries/.test(t) && /does not prove (that )?the values/.test(t) && /[Ll]ayer 2[^.]* is planned, not built/.test(t) && !/proves every visual's values before and after a change is planned, not built/.test(t);
chk(() => said(roadmap), () => 'L1 ROADMAP.md: layer 1 said exactly (check_report with against; does not run the queries; does not prove the values), layer 2 planned');
chk(() => said(plan), () => 'L2 plans/NUMBER-CHECK.md: the same sentence as ROADMAP.md');
const tool = fs.readFileSync(path.join(HERE, 'tools/check_report.mjs'), 'utf8');
chk(() => /against: z\.string\(\)/.test(tool) && /same question/.test(tool) && /not that the numbers are the same|never that the numbers are the same/.test(tool), () => 'L3 check_report\'s description: against, the same question, never that the numbers are the same');
chk(() => /`against`/.test(fs.readFileSync(path.join(HERE, 'TOOLS.md'), 'utf8')), () => 'L4 TOOLS.md names the option against');

fs.rmSync(ROOT, { recursive: true, force: true });
problems.forEach((p) => console.log('problem: ' + String(p).slice(0, 900)));
if (problems.length) console.log(`FAIL script=same-question cause=${problems.length} problem(s)`);
console.log(`${problems.length ? 'FAIL' : 'PASS'}  same-question  ${checks} checks`);
process.exitCode = problems.length ? 1 : 0;
