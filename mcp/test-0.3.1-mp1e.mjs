// 0.3.1 MP1e: laptop part 8's English-beside-Arabic differences on the owner's dashboards (D-1101-03), each check written
// red first from the real visual's shape (DataArcus branch evidence/0.3.1-shapes, read only), with made-up names and
// fields, no data.
//   C1-C2  a new card's values: a vertical list (orientation 1D) keeps its order; a one-row grid (2D) is reversed
//   T1-T4  time right to left: a line and an area chart on a date table's column the model did not type a date
//          (invertAxis too), a line on a 4-level date hierarchy (every level's sort turned), one on 2 levels unsorted
//   S1     a button slicer laid out as a grid, one row high: its buttons read from the right
//   K1-K2  a card grid of agents: the photo and the name to the right; a grid of several rows named in cannot
//   R1     reference label titles padded into a column in English: their Arabic padded to one width (MP1f's table
//          layout cut the contact line in part 10: MX4 put the padding back)
//   A1-A2  a card's text value with its own value entry right-aligned like the numbers; centred values stay centred
//   F1     a field parameter's choices on a slicer: named in cannot, with the step that would make them Arabic
//   node test-0.3.1-mp1e.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';

const require = createRequire(import.meta.url);
const M = require('../assets/js/report-mirror.js'), TM = require('../assets/js/text-measure.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const httpReq = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (d) => { t += d; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const L = (v) => ({ expr: { Literal: { Value: v } } }), S = (t) => L("'" + String(t).replace(/'/g, "''") + "'");
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '') : undefined);
const C = (t, c) => ({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c });
const Me = (t, m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m });
const HL = (t, h, level) => ({ field: { HierarchyLevel: { Expression: { Hierarchy: { Expression: { SourceRef: { Entity: t } }, Hierarchy: h } }, Level: level } }, queryRef: `${t}.${h}.${level}`, nativeQueryRef: `${h} ${level}` });
const vis = (name, type, box, visual) => ({ name, position: { x: box[0], y: box[1], z: 1000, width: box[2], height: box[3], tabOrder: 1000 }, visual: Object.assign({ visualType: type }, visual) });
// (as the twin calls it: the model read, Dates a date table, StartOfMonth not typed a date, no text column among these)
const mir = (v, o) => M.mirrorVisual(v, 1280, Object.assign({ dateTables: ['Dates'], dateColumns: [], textColumns: [] }, o || {})).json;
const refs = (v, role) => v.visual.query.queryState[role].projections.map((p) => p.queryRef);

// ---------- C: a new card's values (Fintech p3: the 4 status lines, layout orientation 1D, rowCount 4) ----------
{
  const four = ['Health Overall', 'Health Schedule', 'Health Cost', 'Health Delivery'].map((m) => Me('Measures', m));
  const v1 = vis('status', 'cardVisual', [30, 445, 718, 220], { query: { queryState: { Data: { projections: four } } }, objects: { layout: [{ properties: { orientation: L('1D'), rowCount: L('4L'), cellPadding: L('0L') } }] } });
  chk(() => JSON.stringify(refs(mir(v1), 'Data')) === JSON.stringify(refs(v1, 'Data')), () => `C1: a vertical list of 4 values (orientation 1D) keeps its order top to bottom: ${JSON.stringify(refs(mir(v1), 'Data'))}`);
  const seven = Array.from({ length: 7 }, (x, i) => Me('Measures', 'Kpi ' + i));
  const v2 = vis('kpis', 'cardVisual', [30, 140, 1860, 120], { query: { queryState: { Data: { projections: seven } } }, objects: { layout: [{ properties: { orientation: L('2D'), columnCount: L('9L'), maxTiles: L('9L') } }] } });
  chk(() => refs(mir(v2), 'Data')[0] === 'Measures.Kpi 6', () => `C2 (guard): a one-row grid of 7 (2D, 9 columns) reads from the right: ${JSON.stringify(refs(mir(v2), 'Data'))}`);
}

// ---------- T: time runs right to left whatever the chart and its axis ----------
{
  const inv = (v) => lit(((v.visual.objects || {}).categoryAxis || []).map((e) => e.properties && e.properties.invertAxis).find(Boolean));
  const line = (type, cat, sort) => vis('t', type, [20, 20, 600, 300], { query: Object.assign({ queryState: { Category: { projections: cat }, Y: { projections: [Me('Measures', 'Sales')] } } }, sort ? { sortDefinition: { sort, isDefaultSort: true } } : {}) });
  // (RepeatIQ: StartOfMonth of the date table, sorted ascending; the model read did not type it a date: no dateColumns)
  const t1 = mir(line('lineChart', [C('Dates', 'StartOfMonth')], [{ field: C('Dates', 'StartOfMonth').field, direction: 'Ascending' }]));
  chk(() => inv(t1) === 'true' && t1.visual.query.sortDefinition.sort[0].direction === 'Descending', () => `T1: a line on a date table's month column the model did not type: invertAxis (a continuous axis ignores the sort) and the sort turned: ${JSON.stringify(t1.visual.objects)}`);
  const t2 = mir(line('areaChart', [C('Dates', 'StartOfMonth')], [{ field: C('Dates', 'StartOfMonth').field, direction: 'Ascending' }]));
  chk(() => inv(t2) === 'true', () => `T2: an area chart likewise: ${JSON.stringify(t2.visual.objects)}`);
  // (AdventureWorks: a 4-level hierarchy, each level sorted ascending)
  const lv = ['Start of Year', 'Start of Month', 'Start of Week', 'Date'].map((l) => HL('Dates', 'Year Hierarchy', l));
  const t3 = mir(line('lineChart', lv, lv.map((p) => ({ field: p.field, direction: 'Ascending' }))));
  chk(() => t3.visual.query.sortDefinition.sort.length === 4 && t3.visual.query.sortDefinition.sort.every((s) => s.direction === 'Descending'), () => `T3: on a 4-level date hierarchy every level's sort is turned (the months inside a year too): ${JSON.stringify(t3.visual.query.sortDefinition.sort.map((s) => s.direction))}`);
  // (Consumer Complaints: Year and Month, no sort)
  const ym = ['Year', 'Month'].map((l) => HL('Dates', 'Date Hierarchy', l));
  const t4 = mir(line('lineChart', ym, null));
  chk(() => t4.visual.query.sortDefinition.sort.length === 2 && t4.visual.query.sortDefinition.sort.every((s) => s.direction === 'Descending'), () => `T4: on a 2-level hierarchy with no sort, each level sorted descending (not the year alone): ${JSON.stringify(t4.visual.query.sortDefinition)}`);
}

// ---------- S: a button slicer laid out as a grid one row high (Call Center's months: 2D, 3 x 3, 50 px) ----------
{
  const s = mir(vis('months', 'advancedSlicerVisual', [920, 24, 338, 50], { query: { queryState: { Values: { projections: [C('Dates', 'Month')] } } }, objects: { layout: [{ properties: { orientation: L('2D'), rowCount: L('3L'), columnCount: L('3L'), cellPadding: L('8L') } }] } }));
  chk(() => s.visual.query.sortDefinition && s.visual.query.sortDefinition.sort[0].direction === 'Descending', () => `S1: a button slicer one row high (a 3 x 3 grid, 50 px) reads from the right (Jan at the right): ${JSON.stringify(s.visual.query.sortDefinition)}`);
}

// ---------- K: a card grid of agents (Call Center p2: one cardVisual, Rows: Agent, 2 x 2, photo and name at the left) ----------
const agents = (rows) => vis('agents', 'cardVisual', [149, 83, 1090, 690], { query: { queryState: { Data: { projections: [Object.assign(Me('Agents', 'First Agent'), { queryRef: 'Min(Agents.Agent)' })] }, Rows: { projections: [C('Agents', 'Agent')] } } },
  objects: { image: [{ properties: { show: L('true'), size: L('100L'), position: S('Left') }, selector: { metadata: 'Min(Agents.Agent)' } }], smallMultiplesLayout: [{ properties: { rowCount: L(rows + 'L'), columnCount: L('2L'), headerPosition: S('Left') } }] } });
{
  const k = mir(agents(2)), img = lit(k.visual.objects.image[0].properties.position), head = lit(k.visual.objects.smallMultiplesLayout[0].properties.headerPosition);
  chk(() => img === 'Right' && head === 'Right', () => `K1: the agents' photo and name header go to the right of each card: ${img}, ${head}`);
}

// ---------- A: a card's values aligned (Consumer Complaints p2; RepeatIQ's centred KPI cards) ----------
{
  const five = ['Total', 'Favorable', 'Response', 'Top Product', 'Top Issue'].map((m) => Me('Measures', m));
  const a1 = mir(vis('cc', 'cardVisual', [110, 80, 1170, 111], { query: { queryState: { Data: { projections: five } } },
    objects: { value: [{ properties: { fontSize: L('25D') }, selector: { id: 'default' } }, { properties: { textWrap: L('true'), fontSize: L('15D') }, selector: { metadata: 'Measures.Top Issue' } }, { properties: { fontSize: L('15D') }, selector: { metadata: 'Measures.Top Product' } }] } }));
  chk(() => a1.visual.objects.value.every((e) => lit(e.properties.horizontalAlignment) === 'right'), () => `A1: every value entry of the card right-aligned, the text values' own entries too: ${JSON.stringify(a1.visual.objects.value.map((e) => [e.selector, lit(e.properties.horizontalAlignment)]))}`);
  const a2 = mir(vis('kpi', 'cardVisual', [340, 55, 900, 90], { query: { queryState: { Data: { projections: five.slice(0, 3) } } }, objects: { value: [{ properties: { fontSize: L('25D'), horizontalAlignment: S('center') }, selector: { id: 'default' } }] } }));
  chk(() => lit(a2.visual.objects.value[0].properties.horizontalAlignment) === 'center', () => `A2: centred KPI values stay centred (their first letter no longer cut at the edge): ${lit(a2.visual.objects.value[0].properties.horizontalAlignment)}`);
}

// ---------- R, K2, F: through the server (a plan and its twin on the sample's model) ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mp1e-root-')));
const LOGS = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mp1e-log-'))), log = path.join(LOGS, 'links.txt');
process.env.DATAARCUS_ROOT = ROOT;
const { sampleFiles } = await import('./lib/sample-project.mjs');
sampleFiles('S').forEach((f) => { const p = path.join(ROOT, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
const MODEL = fs.readdirSync(path.join(ROOT, 'S')).find((x) => /\.SemanticModel$/.test(x));
const SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/';
const dir = path.join(ROOT, 'S', 'Agents.Report'), put = (rel, o) => { const p = path.join(dir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(o, null, 2)); };
fs.writeFileSync(path.join(ROOT, 'S', 'Agents.pbip'), JSON.stringify({ version: '1.0', artifacts: [{ report: { path: 'Agents.Report' } }], settings: { enableAutoRecovery: true } }));
put('definition.pbir', { version: '4.0', datasetReference: { byPath: { path: '../' + MODEL } } });
put('definition/version.json', { $schema: SCHEMA + 'versionMetadata/1.0.0/schema.json', version: '2.0.0' });
put('definition/report.json', { $schema: SCHEMA + 'report/2.1.0/schema.json', themeCollection: {} });
put('definition/pages/pages.json', { $schema: SCHEMA + 'pagesMetadata/1.0.0/schema.json', pageOrder: ['agentsPage'], activePageName: 'agentsPage' });
put('definition/pages/agentsPage/page.json', { $schema: SCHEMA + 'page/2.0.0/schema.json', name: 'agentsPage', displayName: 'Agents', displayOption: 'FitToPage', width: 1280, height: 720 });
// (Call Center p1: Dan's card, its reference label titles padded with "space + LRM" so the values make a column)
const pad = (t, n) => t + ' ‎'.repeat(n);
const titles = [['Calls', 30], ['Answered %', 16], ['Resolution Rate', 11], ['Avg Speed of Answer', 2]];
const dan = vis('dan', 'cardVisual', [880, 408, 387, 391], { query: { queryState: { Data: { projections: [Me('All Measures', 'Visits')] } } },
  objects: { referenceLabelTitle: titles.map(([t, n], i) => ({ properties: { titleContentType: S('custom'), titleText: S(pad(t, n)) }, selector: { metadata: 'All Measures.Visits', id: 'field-' + i } })) } });
// (AdventureWorks p4: a slicer on a field parameter table, and the line chart it switches)
const FP = { Column: { Expression: { SourceRef: { Entity: 'Metric Choice' } }, Property: 'Metric Choice' } };
const choice = vis('choice', 'slicer', [386, 20, 400, 37], { query: { queryState: { Values: { projections: [{ field: FP, queryRef: 'Metric Choice.Metric Choice', nativeQueryRef: 'Metric Choice' }] } } } });
const switched = vis('switched', 'lineChart', [371, 57, 450, 208], { query: { queryState: { Category: { projections: [C('Branches', 'Country')] }, Y: { projections: [Me('All Measures', 'Visits')], fieldParameters: [{ parameterExpr: FP, index: 0, length: 1 }] } } } });
[agents(2), dan, choice, switched].forEach((v) => put(`definition/pages/agentsPage/visuals/${v.name}/visual.json`, Object.assign({ $schema: SCHEMA + 'visualContainer/2.1.0/schema.json' }, v)));
const links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' }), call = s.call;
const AR = ['المكالمات', 'نسبة الرد', 'نسبة الحل', 'متوسط سرعة الرد'];
const labels = Object.fromEntries(AR.map((t, i) => [`text:agentsPage/dan/o.referenceLabelTitle.${i}.titleText`, t]));
const a = { path: path.join('S', 'Agents.pbip'), arabicMonth: false, labels };
const plan = await call('create_arabic_twin', a), j = plan.j || {}, id = j.plan && j.plan.planId, cannot = j.cannot || [];
chk(() => cannot.some((c) => /grid of several rows/.test(c.what) && (c.where || []).some((w) => /agents/.test(w))), () => `K2: a card grid of several rows is named in cannot (Power BI has no right-to-left order for it): ${JSON.stringify(cannot.map((c) => c.what))}`);
chk(() => cannot.some((c) => /switcher|field parameter/.test(c.what) && (c.where || []).some((w) => /choice/.test(w)) && /Arabic field parameter table/.test(c.why)), () => `F1: a field parameter's choices on a slicer are named, with the step that would make them Arabic: ${JSON.stringify(cannot.filter((c) => /switcher|parameter/.test(c.what)))}`);
let w = { err: true, t: 'no plan: ' + short(plan) };
if (id) { const n = links().length; await call('approve_plan', { planId: id }); for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50); const url = links()[n] || ''; if (url) { await httpReq(url, 'POST', 'decision=approve'); await call('approve_plan', { planId: id }); } w = await call('create_arabic_twin', Object.assign({}, a, { planId: id })); }
// (MX4, laptop part 10: the table layout MP1f chose cut the contact line; the padding is back) R1 as MP1e wrote it
let widths = [], style;
try { const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'S', 'Agents AR.Report/definition/pages/agentsPage/visuals/dan/visual.json'), 'utf8')); widths = d.visual.objects.referenceLabelTitle.map((e) => TM.textWidth(lit(e.properties.titleText), 10)); style = lit(((d.visual.objects.referenceLabelLayout || [])[0] || { properties: {} }).properties.style); } catch (e) { widths = []; }
chk(() => !w.err && widths.length === 4 && Math.max(...widths) - Math.min(...widths) <= TM.textWidth(' ', 10) + 0.01 && style !== 'tabular', () => `R1 (MX4, as MP1e): the Arabic reference label titles padded to one width, so their values make a column as in English: ${JSON.stringify(widths.map((x) => Math.round(x * 10) / 10))} ${style} ${w.err ? short(w) : ''}`);

await s.close();
[ROOT, LOGS].forEach((d) => { try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) { /* left for the OS */ } });
if (problems.length) { console.log(`FAIL script=test-0.3.1-mp1e.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('      - ' + p)); console.log(`FAIL  mp1e  ${checks} checks, ${problems.length} failed`); process.exit(1); }
console.log(`PASS  mp1e  ${checks} checks`);
