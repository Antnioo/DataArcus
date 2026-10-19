// 0.3, J9 step 1: a redesign keeps the original. plan_layout with redesignFrom plans a cleaner page of an existing
// report's fields with the design engine and accounts for every visual of the original (kept, merged, or not carried
// over with why); create_report writes it as a NEW report "<name> redesigned" next to the model; the original is never
// changed. Written red first. Made-up fixture only (mcp/fixtures/twin-project): no employer or client data.
//   R1  every visual of the original is in the mapping, once, with its status; groups are counted, not listed
//   R2  the one-page original: the plan's fields are the original's (no field added), the layout keeps every chart
//   R3  merged: a second card of the same measure; not carried over: text box, navigator, buttons, custom visual, with why
//   R4  the report level: the tooltip page, bookmarks and page filters listed as not carried over; no filter value in
//       the answer
//   R5  the write: approve, create_report with redesignFrom writes "<name> redesigned"; the original's files are byte
//       for byte the same; the new page shows the original's fields
//   R6  the gate: the original changed after the go, redesignFrom left out of the write, the name already taken: refused
//   R7  two report pages: both mapped, no plan id (writing every page is the next step)
//   R8  a report on another model: refused at the plan; the name keeps " redesigned" within 30 characters
//   node test-0.3-redesign.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x.err ? x.t.slice(0, 400) : JSON.stringify(x.j).slice(0, 400));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const print = (d) => tree(d).sort().map((f) => path.relative(d, f) + ':' + crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')).join('\n');

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-redesign-'));
const SENT = 'RD_SENTINEL_FILTER_VALUE_5c1e';
// two copies of the twin fixture: "two" as it is (two report pages and a tooltip page); "one" with the Details page's
// table, bar chart and custom visual moved onto Overview, a second card of Total Sales, and a page filter
fs.cpSync(path.join(HERE, 'fixtures/twin-project'), path.join(ROOT, 'two'), { recursive: true });
fs.cpSync(path.join(HERE, 'fixtures/twin-project'), path.join(ROOT, 'one'), { recursive: true });
const P = path.join(ROOT, 'one/Twin Sales.Report/definition/pages');
for (const v of ['tblProducts', 'barProduct', 'customGauge']) fs.renameSync(path.join(P, 'p2details/visuals', v), path.join(P, 'p1overview/visuals', v));
fs.rmSync(path.join(P, 'p2details'), { recursive: true });
const pj = rd(path.join(P, 'pages.json')); pj.pageOrder = pj.pageOrder.filter((x) => x !== 'p2details'); fs.writeFileSync(path.join(P, 'pages.json'), JSON.stringify(pj, null, 2));
fs.cpSync(path.join(P, 'p1overview/visuals/cardSales'), path.join(P, 'p1overview/visuals/cardSales2'), { recursive: true });
fs.rmSync(path.join(P, 'p1overview/visuals/cardSales2/mobile.json'));
{ const f = path.join(P, 'p1overview/visuals/cardSales2/visual.json'), j = rd(f); j.name = 'cardSales2'; j.position.y = 600; fs.writeFileSync(f, JSON.stringify(j, null, 2)); }
{ const f = path.join(P, 'p1overview/page.json'), j = rd(f);
  j.filterConfig = { filters: [{ name: 'f1', field: { Column: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Region' } }, type: 'Categorical',
    filter: { Version: 2, From: [{ Name: 's', Entity: 'Sales', Type: 0 }], Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: 's' } }, Property: 'Region' } }], Values: [[{ Literal: { Value: `'${SENT}'` } }]] } } }] } }] };
  fs.writeFileSync(f, JSON.stringify(j, null, 2)); }
// another model, for R8
fs.cpSync(path.join(HERE, 'fixtures/health-project'), path.join(ROOT, 'health'), { recursive: true });

const s = await serverClient(ROOT, {});
const visualsOf = (dir) => fs.readdirSync(dir).flatMap((pg) => (fs.existsSync(path.join(dir, pg, 'visuals')) ? fs.readdirSync(path.join(dir, pg, 'visuals')).map((v) => ({ pg, v, j: rd(path.join(dir, pg, 'visuals', v, 'visual.json')) })) : []));
const MODEL1 = 'one/Twin Sales.SemanticModel', ORIG1 = 'one/Twin Sales.pbip';

// ---------- R1-R4: the plan of the one-page original ----------
const before = print(path.join(ROOT, 'one/Twin Sales.Report'));
const pl = await s.call('plan_layout', { path: MODEL1, redesignFrom: ORIG1 });
const R = (pl.j && pl.j.redesign) || {}, page = (R.pages && R.pages[0]) || { visuals: [] }, by = (id) => page.visuals.find((x) => x.visual === id) || {};
chk(() => !pl.err && R && pl.j.plan && pl.j.plan.planId, () => `R2. plan_layout with redesignFrom on a one-page report gives the redesign and a plan id: ${short(pl)}`);
const orig = visualsOf(P).filter((x) => x.pg === 'p1overview' && !x.j.visualGroup).map((x) => x.v).sort();
chk(() => JSON.stringify(page.visuals.map((x) => x.visual).sort()) === JSON.stringify(orig), () => `R1. every visual of the original is in the mapping once: ${JSON.stringify((page.visuals || []).map((x) => x.visual))} vs ${JSON.stringify(orig)}`);
chk(() => page.groups === 2 && page.visuals.every((x) => ['kept', 'merged', 'notCarried'].includes(x.status)) && page.visuals.filter((x) => x.status === 'notCarried').every((x) => x.why), () => `R1. groups counted (2), each visual kept, merged or not carried over, every one not carried over says why: ${JSON.stringify(page)}`);
chk(() => R.counts.kept === 7 && R.counts.merged === 1 && R.counts.notCarried === 5, () => `R1. counts 7 kept, 1 merged, 5 not carried over: ${JSON.stringify(R.counts)}`);
const F = pl.j && pl.j.plan && pl.j.plan.fields;
chk(() => JSON.stringify(F) === JSON.stringify({ kpis: ['Sales[Total Sales]', 'Sales[Orders]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Product]', category2: 'Sales[Region]', table: ['Sales[Product]', 'Sales[Amount]', 'Sales[Total Sales]'], slicers: ['Sales[Region]'] }),
  () => `R2. the plan's fields are the original's: ${JSON.stringify(F)}`);
chk(() => !R.added && R.layout === 'exec' && R.filters === 'start', () => `R2. no field added; the exec layout with a filter panel keeps every chart: ${JSON.stringify({ added: R.added, layout: R.layout, filters: R.filters })}`);
chk(() => pl.j.plan.reportLook.name === 'Twin Sales redesigned' && pl.j.plan.reportLook.secondPage === false, () => `R2. the plan's name is "Twin Sales redesigned", one page: ${JSON.stringify(pl.j.plan.reportLook)}`);
chk(() => by('lineMonth').status === 'kept' && by('lineMonth').slot === 'Main trend' && by('barProduct').slot === 'Breakdown' && by('colRegion').slot === 'Comparison' && by('tblProducts').slot === 'Detail' && by('cardSales').slot === 'KPI 1' && by('cardOrders').slot === 'KPI 2' && by('slRegion').slot === 'Filters',
  () => `R2. each kept visual names its slot as plan_layout's slots do: ${JSON.stringify(page.visuals.map((x) => [x.visual, x.slot]))}`);
chk(() => (pl.j.slots || []).some((x) => x.role === 'Main trend') && (pl.j.slots || []).some((x) => x.role === 'Breakdown'), () => 'R2. those slot names are the plan\'s own slots');
chk(() => by('colRegion').loses && by('colRegion').loses.some((x) => /Sales\[Product\].*legend/.test(x)), () => `R2. the column chart's legend (Sales[Product]) is said lost: ${JSON.stringify(by('colRegion'))}`);
chk(() => by('cardSales2').status === 'merged' && by('cardSales2').into === 'KPI 1', () => `R3. a second card of Total Sales is merged into KPI 1: ${JSON.stringify(by('cardSales2'))}`);
chk(() => ['title', 'nav', 'btnDetails', 'btnReset', 'customGauge'].every((id) => by(id).status === 'notCarried') && /custom visual/.test(by('customGauge').why) && /customVisualsFrom/.test(by('customGauge').why) && /header/.test(by('title').why) && /page buttons/.test(by('nav').why),
  () => `R3. the text box, navigator, buttons and custom visual are not carried over, with why: ${JSON.stringify(['title', 'nav', 'btnDetails', 'btnReset', 'customGauge'].map(by))}`);
chk(() => by('tblProducts').note && /Sum\(Sales\[Amount\]\).*column Sales\[Amount\]/.test(by('tblProducts').note), () => `R3. the table's implicit sum is said carried as the column: ${JSON.stringify(by('tblProducts'))}`);
const NC = R.notCarried || [];
chk(() => NC.some((x) => x.page === 'Tooltip' && /tooltip/.test(x.why)) && NC.some((x) => x.bookmarks === 2) && NC.some((x) => x.pageFilters && x.pageFilters.some((f) => /Sales\[Region\]/.test(f))), () => `R4. the tooltip page, 2 bookmarks and the page filter are listed as not carried over: ${JSON.stringify(NC)}`);
chk(() => !pl.t.includes(SENT), () => 'R4. the page filter\'s value is never in the answer');
chk(() => /never changed/.test(R.original) && /kept/.test(R.sayInPlan) && /not carried over/.test(R.sayInPlan), () => `R4. the answer says the original is never changed and what to show: ${JSON.stringify({ o: R.original, s: R.sayInPlan })}`);
chk(() => JSON.stringify(pl.j.plan.writesAfterGo).includes('Twin Sales redesigned.Report'), () => `R4. the plan's writes name the new report: ${JSON.stringify(pl.j.plan.writesAfterGo)}`);

// ---------- R5: the write ----------
const W = { path: MODEL1, redesignFrom: ORIG1, design: pl.j.design, fields: F };
let wr = { err: true, t: 'no plan' };
if (pl.j && pl.j.plan) { await s.call('approve_plan', { planId: pl.j.plan.planId }); wr = await s.call('create_report', Object.assign({ planId: pl.j.plan.planId }, W)); }
chk(() => !wr.err && wr.j.report === 'Twin Sales redesigned.Report', () => `R5. create_report with redesignFrom writes "Twin Sales redesigned.Report": ${short(wr)}`);
chk(() => print(path.join(ROOT, 'one/Twin Sales.Report')) === before && fs.existsSync(path.join(ROOT, 'one/Twin Sales.pbip')), () => 'R5. the original report is byte for byte the same after the write');
{ const out = path.join(ROOT, 'one/Twin Sales redesigned.Report/definition/pages');
  const order = fs.existsSync(out) ? rd(path.join(out, 'pages.json')).pageOrder : [];
  const main = order.length ? visualsOf(out).filter((x) => x.pg === order[0]) : [];
  const refs = new Set(main.flatMap((x) => Object.values(((x.j.visual || {}).query || {}).queryState || {}).flatMap((q) => (q.projections || []).map((p) => p.queryRef))));
  const visible = order.filter((id) => rd(path.join(out, id, 'page.json')).visibility !== 'HiddenInViewMode');
  chk(() => visible.length === 1, () => `R5. the redesign has one report page, as the original: ${visible.length}`);
  chk(() => ['Calendar.Month Name', 'Sales.Region', 'Sales.Product', 'Sales.Total Sales', 'Sales.Orders'].every((r) => refs.has(r)) && [...refs].some((r) => /Amount/.test(r)), () => `R5. the new page shows the original's fields: ${JSON.stringify([...refs])}`); }

// ---------- R6: the gate ----------
{ const p2 = await s.call('plan_layout', { path: MODEL1, redesignFrom: ORIG1 });
  chk(() => p2.j && p2.j.plan == null && p2.j.planProblems.some((x) => /already there/.test(x)), () => `R6. a second redesign while "Twin Sales redesigned" is there: no plan id, the name is taken: ${short(p2)}`); }
for (const x of ['.Report', '.pbip']) if (fs.existsSync(path.join(ROOT, 'one/Twin Sales redesigned' + x))) fs.renameSync(path.join(ROOT, 'one/Twin Sales redesigned' + x), path.join(ROOT, 'one/old-redesign' + x));
{ const p3 = await s.call('plan_layout', { path: MODEL1, redesignFrom: ORIG1 });
  if (p3.j && p3.j.plan) await s.call('approve_plan', { planId: p3.j.plan.planId });
  const noFrom = p3.j && p3.j.plan ? await s.call('create_report', Object.assign({ planId: p3.j.plan.planId }, W, { redesignFrom: undefined })) : { err: false, t: 'no plan' };
  chk(() => noFrom.err && /Nothing was written/.test(noFrom.t), () => `R6. the redesign's plan with redesignFrom left out of create_report: refused: ${short(noFrom)}`);
  const f = path.join(P, 'p1overview/visuals/lineMonth/visual.json'), j = rd(f); j.position.x += 1; fs.writeFileSync(f, JSON.stringify(j, null, 2));
  const changed = p3.j && p3.j.plan ? await s.call('create_report', Object.assign({ planId: p3.j.plan.planId }, W)) : { err: false, t: 'no plan' };
  chk(() => changed.err && /Nothing was written/.test(changed.t) && !fs.existsSync(path.join(ROOT, 'one/Twin Sales redesigned.Report')), () => `R6. the original changed after the go: refused, nothing written: ${short(changed)}`); }

// ---------- R7: two report pages ----------
{ const p4 = await s.call('plan_layout', { path: 'two/Twin Sales.SemanticModel', redesignFrom: 'two/Twin Sales.pbip' });
  const R4 = p4.j && p4.j.redesign;
  chk(() => R4 && R4.pages.length === 2 && R4.pages[1].visuals.length === 5 && R4.pages[0].visuals.length === 9, () => `R7. both report pages mapped (9 and 5 visuals): ${short(p4)}`);
  chk(() => p4.j.plan == null && p4.j.planProblems.some((x) => /2 report pages/.test(x)), () => `R7. no plan id for two report pages, and why: ${short(p4)}`);
  chk(() => R4.pages[1].visuals.find((x) => x.visual === 'customGauge').status === 'notCarried', () => 'R7. the second page\'s custom visual is not carried over');
  chk(() => R4.pages[1].layout === 'analysis' && R4.pages[1].visuals.find((x) => x.visual === 'barProduct').slot === 'Main chart' && R4.pages[1].visuals.find((x) => x.visual === 'tblProducts').slot === 'Detail table',
    () => `R7. the second page (a table and a bar chart, no trend) gets its own layout, analysis, its bar chart on the main chart: ${JSON.stringify(R4.pages[1])}`); }

// ---------- R8: another model; the name ----------
{ const p5 = await s.call('plan_layout', { path: 'health/Health Test.SemanticModel', redesignFrom: 'two/Twin Sales.pbip' });
  chk(() => p5.j && p5.j.plan == null && p5.j.planProblems.some((x) => /another model/.test(x)), () => `R8. a report on another model: no plan id: ${short(p5)}`); }
{ const { nameFor } = await import('./lib/redesign.mjs');
  const names = ['Twin Sales', 'Quarterly Sales Performance Overview', 'Abcdefghijklmnopqrstuvwxyz0123'].map(nameFor);
  chk(() => names.every((n) => Array.from(n).length <= 30 && / redesigned$/.test(n)) && names[1] === 'Quarterly Sales redesigned', () => `R8. a long name is cut at a whole word so " redesigned" stays within 30 characters: ${JSON.stringify(names)}`); }

await s.close();
fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL  redesign  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  redesign  ${checks} checks`);
