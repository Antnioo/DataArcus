// 0.3.1 NC1: the custom visuals lab (mcp/lab/custom-visuals-lab.mjs), the owner's question of 26 Oct ("a report of 5
// pages having custom visuals: can DataArcus replace them all with native ones and clean up the clutter"). The lab is a
// made-up hand-made-looking report; this suite proves what the cloud can before the laptop opens it in Desktop.
//   CL-1  the lab writes 5 pages, 13 custom visuals declared (publicCustomVisuals) and placed, 10 native ones, a text
//         box and a shape on each page, and its clutter (uneven gaps, one visual off its row, mixed title sizes and fonts)
//   CL-2  Microsoft's validator (the version mcp/package.json pins) on the original: 0 errors, 0 warnings
//   CL-3  through the real server over stdio, plan_layout customVisualsFrom: 11 replacements, each with the native the
//         lab expects, its plan line and what it loses; the 2 networks not replaced, with why; a plan id; no field name
//         in the lines; the three charts of two AED values asked about (sharedAxes) and split until answered
//   CL-4  with the person's sharedAxes answers (comparable): the same 11, none split, nothing asked
//   CL-5  the original is not changed by the plans
//   CL-6  approve_plan (the tests' browser clicks Approve, test-env.mjs) and create_report: "<name> native" written; only
//         the 2 networks stay custom and declared; every replaced visual keeps its name; validator 0 errors
//   CL-7  plan_layout redesignFrom on the native copy: a plan id, every page, the clutter's boxes changed (the card off
//         its row back on it, page 1's top row with even gaps); approved and written: "<name> native redesigned"
//   NC2-1 (NC2) confidence from evidence: no package in the report, so none is "high"; each level said once, the lead
//         line counts the guesses; 7 medium (a known id), 4 low (inferred), each with its evidence in words
//   NC2-2 every loss named: the tornado's two sides, the bullet's bars, the word cloud's look (and that the bars rank by
//         value), the calendar's grid; the format settings line says which were kept and which were not
//   NC2-3 closer natives first, the current one second: the bullet a combo with the target as markers on one axis, the
//         calendar heatmap a matrix (year and month by weekday) shaded by conditional formatting; customVisualsSecond
//         gives the second option; the written files carry the markers and the shading
//   NC2-4 the approval page's rows: each replacement's confidence, evidence, losses and second option
//   NC3-1 (NC3) a made-up copy of the lab with a map: what the person must turn on (the tenant settings' exact names), its
//         location column's missing data category, a bar chart second; written, the next steps say it again
//   NC3-2 a text search (a textFilter-like custom visual): a dropdown slicer with its search on, in its own box, its
//         header off when the box is too low; the input slicer second; validator 0 errors
//   NC3-3 the word cloud's bars sorted by their value, largest first
//   NC3-4 the chip slicer: a dropdown in its box, with why (the pills' measured height and their values' widths)
//   CL-8  the laptop's driver (lab/custom-visuals-run.mjs) runs the same chain on its own and fills the result table
// The laptop's run (mcp/lab/CUSTOM-VISUALS-LAB.md) is this chain, then Desktop.
//   node test-0.3.1-custom-visuals-lab.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const HERE = path.dirname(fileURLToPath(import.meta.url)), VT = createRequire(import.meta.url)('../assets/js/visual-types.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const TMP = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-cvlab-')));
const ROOT = path.join(TMP, 'work');
// the modules read DATAARCUS_ROOT when they load: set before they are imported
process.env.DATAARCUS_ROOT = ROOT;
const Lab = await import('./lab/custom-visuals-lab.mjs');

const LAB = path.join(ROOT, 'lab'), RD = path.join(LAB, Lab.NAME + '.Report'), NAT = path.join(LAB, Lab.NAME + ' native.Report');
const tree = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)]));
const hashOf = (d) => tree(d).sort().map((f) => path.relative(d, f) + ':' + fs.readFileSync(f).toString('base64')).join('|');
const visualsOf = (d) => tree(path.join(d, 'definition', 'pages')).filter((f) => /visual\.json$/.test(f)).map((f) => J(f));
const errorsOf = (v) => (v.json && v.json.data ? v.json.data.errorCount : -1), warningsOf = (v) => (v.json && v.json.data ? v.json.data.warningCount : -1);
const FIELDS = /Total Sales|Sales LY|Sales Target|Units Sold|\bOrders\b|Branches|Products|Calendar|Month Start/;
const COMPARABLE = [{ measures: ['Sales[Total Sales]', 'Sales[Sales Target]'], answer: 'comparable' }, { measures: ['Sales[Total Sales]', 'Sales[Sales LY]'], answer: 'comparable' }];
const SPLIT = ['bulletChart', 'tornadoChart', 'smoothLineChart'];
const SECOND = Lab.VISUALS_CUSTOM.filter((c) => c.second);
const keyOfLab = (c) => { const pg = Lab.PAGES[c.page - 1], b = pg.boxes[c.name]; return `${c.page}:${b[0]},${b[1]}`; };

let client = null;
try {
  fs.mkdirSync(ROOT, { recursive: true });
  // ---- CL-1 the lab ----
  const w = Lab.writeLab(LAB);
  const rj = J(path.join(RD, 'definition', 'report.json')), vs = visualsOf(RD), pages = J(path.join(RD, 'definition', 'pages', 'pages.json')).pageOrder;
  const custom = vs.filter((v) => rj.publicCustomVisuals.includes(v.visual.visualType));
  chk(() => w.pages === 5 && pages.length === 5 && rj.publicCustomVisuals.length === 13 && custom.length === 13 && new Set(custom.map((v) => v.visual.visualType)).size === 13,
    () => `CL-1a. 5 pages and the 13 custom visuals, each declared once and placed once: ${pages.length} pages, ${rj.publicCustomVisuals.length} declared, ${custom.length} placed`);
  chk(() => pages.every((p) => { const names = fs.readdirSync(path.join(RD, 'definition', 'pages', p, 'visuals')); return names.includes('pageTitle') && names.includes('band'); })
    && vs.filter((v) => v.visual.visualType === 'textbox').length === 5 && vs.filter((v) => v.visual.visualType === 'shape').length === 5,
    () => 'CL-1b. every page has its text box (the page title) and its shape (a band)');
  chk(() => vs.filter((v) => !rj.publicCustomVisuals.includes(v.visual.visualType) && !['textbox', 'shape'].includes(v.visual.visualType)).length === 10 && Lab.VISUALS_CUSTOM.every((c) => Object.keys(c.roles).length >= 1),
    () => 'CL-1c. 10 native visuals beside the custom ones');
  chk(() => !fs.existsSync(path.join(RD, 'CustomVisuals')) && !tree(LAB).some((f) => /\.pbiviz$/i.test(f)), () => 'CL-1d. no custom visual package bytes in the lab');
  const byName = Object.fromEntries(vs.map((v) => [v.name, v]));
  chk(() => byName.cardOrders.position.y - byName.cardSales.position.y === 5, () => 'CL-1e. the clutter: one visual 5 px off its row');
  { const p1 = ['cvKpiTile', 'cardSales', 'cardOrders', 'cvDialGauge'].map((n) => byName[n].position), gaps = p1.slice(1).map((p, i) => p.x - (p1[i].x + p1[i].width));
    chk(() => new Set(gaps).size === 3 && Math.min(...gaps) >= 8 && Math.max(...gaps) <= 31, () => `CL-1f. the clutter: uneven gaps on page 1's top row (8 to 31 px): ${gaps}`); }
  { const ts = vs.map((v) => v.visual.visualContainerObjects && v.visual.visualContainerObjects.title).filter(Boolean).map((t) => t[0].properties);
    const sizes = new Set(ts.map((p) => p.fontSize.expr.Literal.Value)), fonts = new Set(ts.map((p) => p.fontFamily.expr.Literal.Value));
    chk(() => sizes.size >= 3 && fonts.size >= 3, () => `CL-1g. the clutter: titles in at least 3 sizes and 3 fonts: ${[...sizes]} / ${[...fonts]}`); }
  chk(() => (J(path.join(LAB, Lab.NAME + '.SemanticModel', 'model.bim')).model.tables || []).map((t) => t.name).join() === 'Sales,Branches,Products,Calendar'
    && J(path.join(LAB, Lab.NAME + '.SemanticModel', 'model.bim')).model.tables.every((t) => /#table\(type table \[/.test(t.partitions[0].source.expression)),
    () => 'CL-1h. the model: Sales, Branches, Products, Calendar as typed Power Query rows');
  // ---- CL-2 the validator on the original ----
  const v0 = Lab.validate(RD);
  chk(() => errorsOf(v0) === 0 && warningsOf(v0) === 0, () => `CL-2. the validator on the original: 0 errors, 0 warnings: ${v0.text.slice(0, 600)}`);
  const before = hashOf(RD);

  // ---- CL-3 and CL-4 through the real server ----
  client = new Client({ name: 'test-cvlab', version: '1' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(HERE, 'server.mjs')], env: { ...process.env, DATAARCUS_ROOT: ROOT }, stderr: 'ignore' }));
  const call = async (name, args) => { try { const r = await client.callTool({ name, arguments: args }); const t = r.content[0].text; return { err: !!r.isError, t, j: r.isError ? null : JSON.parse(t) }; } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const short = (x) => (x.err ? x.t.slice(0, 500) : JSON.stringify(x.j).slice(0, 700));
  const want = Object.fromEntries(Lab.VISUALS_CUSTOM.map((c) => [c.type, c.expect]));
  const planOf = async (extra) => {
    const pl = await call('plan_layout', Object.assign({ path: 'lab', customVisualsFrom: 'lab/' + Lab.NAME + '.Report' }, extra));
    const cv = (pl.j && pl.j.customVisuals) || {};
    return { pl, cv, reps: cv.replacements || [], not: cv.notReplaced || [] };
  };
  const A = await planOf({});
  chk(() => !A.pl.err && A.reps.length === 11 && A.not.length === 2, () => `CL-3a. 11 replacements, 2 not replaced: ${short(A.pl)}`);
  Lab.VISUALS_CUSTOM.filter((c) => c.expect).forEach((c) => {
    const r = A.reps.find((x) => x.from === c.type);
    chk(() => r && r.native === (r.axes && r.axes.panels && c.split ? c.split : c.expect) && r.page === c.page && /^custom visual \S+ on page \d+ at \d+,\d+ -> /.test(r.line) && r.lost.length >= 1 && /It loses/.test(r.tell) && ['low', 'medium', 'high'].includes(r.confidence),
      () => `CL-3b. ${c.name} (page ${c.page}) becomes ${c.expect}, with its line, confidence and what it loses: ${JSON.stringify(r || null).slice(0, 500)}`);
  });
  chk(() => Lab.VISUALS_CUSTOM.filter((c) => !c.expect).every((c) => A.not.some((x) => x.line.includes(c.type) && /no native visual draws it/.test(x.why) && /network/.test(x.line))),
    () => `CL-3c. the sankey and the force graph are not replaced, with why (a network: no native visual draws it): ${JSON.stringify(A.not).slice(0, 600)}`);
  chk(() => A.pl.j.plan && A.pl.j.plan.planId && (A.pl.j.plan.writesAfterGo || []).some((x) => x.includes(Lab.NAME + ' native')), () => `CL-3d. a plan id, and the plan writes "${Lab.NAME} native": ${short(A.pl)}`);
  chk(() => !FIELDS.test(JSON.stringify(A.reps.map((r) => [r.line, r.why, r.tell, r.lost])) + JSON.stringify(A.not)), () => 'CL-3e. no field or table name in the plan\'s lines (the report\'s names are untrusted)');
  chk(() => SPLIT.every((t) => { const r = A.reps.find((x) => x.from.startsWith(t)); return r && r.axes && r.axes.panels === 2; }) && A.reps.filter((r) => r.axes && r.axes.panels).length === 3
    && A.pl.j.sharedAxes && (A.pl.j.sharedAxes.ask || []).length >= 2,
    () => `CL-3f. the three charts of two AED values: split into 2 panels until the person answers, and asked: ${JSON.stringify([A.reps.map((r) => r.axes || null), A.pl.j && A.pl.j.sharedAxes]).slice(0, 700)}`);
  const B = await planOf({ sharedAxes: COMPARABLE });
  chk(() => !B.pl.err && B.reps.length === 11 && B.not.length === 2 && B.reps.every((r) => !(r.axes && r.axes.panels)) && !((B.pl.j.sharedAxes || {}).ask || []).length && B.pl.j.plan && B.pl.j.plan.planId,
    () => `CL-4. with the person's answers (comparable): 11 replacements, none split, nothing asked, a plan id: ${short(B.pl)}`);
  chk(() => SPLIT.every((t) => { const r = B.reps.find((x) => x.from.startsWith(t)); return r && r.native === want[r.from]; }), () => 'CL-4b. answered, the three charts keep their native type, in one visual each');
  // ---- NC2-1 confidence from evidence ----
  { const C = B.cv.confidence || {}, lv = C.levels || {}, count = (k) => B.reps.filter((r) => r.confidence === k).length;
    chk(() => B.reps.every((r) => r.confidence !== 'high') && count('medium') === 7 && count('low') === 4,
      () => `NC2-1a. no package in the report: none high, 7 medium, 4 low: ${JSON.stringify(B.reps.map((r) => [r.from, r.confidence]))}`);
    chk(() => typeof lv.high === 'string' && typeof lv.medium === 'string' && typeof lv.low === 'string' && /package/.test(lv.high) && /id/.test(lv.medium) && /inferred|kinds/.test(lv.low),
      () => `NC2-1b. each level's meaning said once in the plan: ${JSON.stringify(lv)}`);
    chk(() => typeof C.lead === 'string' && /11 replacements/.test(C.lead) && /0 high, 7 medium, 4 low/.test(C.lead) && /11 of 11 are guesses/.test(C.lead),
      () => `NC2-1c. the plan's lead line counts the levels and the guesses: ${JSON.stringify(C.lead)}`);
    chk(() => B.reps.every((r) => typeof r.evidence === 'string' && r.evidence.length > 10 && !FIELDS.test(r.evidence)) && /no package|package is not/.test(B.reps[0].evidence),
      () => `NC2-1d. each replacement's evidence in words, no field name: ${JSON.stringify(B.reps.map((r) => r.evidence))}`);
    chk(() => B.reps.find((r) => r.from.startsWith('dialGauge')).confidence === 'medium' && B.reps.find((r) => r.from.startsWith('wordCloud')).confidence === 'low',
      () => 'NC2-1e. a known id (the dial gauge) is medium; a word cloud, inferred from its fields, low'); }
  // ---- NC2-2 every loss named ----
  { const L = (t) => ((B.reps.find((r) => r.from.startsWith(t)) || {}).lost || []).join(' | ');
    chk(() => /two-sided/.test(L('tornadoChart')) && /left and right/.test(L('tornadoChart')), () => `NC2-2a. the tornado's two-sided layout is named: ${L('tornadoChart')}`);
    chk(() => /horizontal bars/.test(L('bulletChart')) && /bands/.test(L('bulletChart')) && /target/.test(L('bulletChart')), () => `NC2-2b. the bullet's losses: its horizontal bars and bands; the target said: ${L('bulletChart')}`);
    chk(() => /cloud/.test(L('wordCloud')) && /sized by/.test(L('wordCloud')) && /ranks/.test(L('wordCloud')), () => `NC2-2c. the word cloud's look named, and the bars rank by value: ${L('wordCloud')}`);
    chk(() => /one square per day/.test(L('calendarHeatmap')), () => `NC2-2d. the calendar heatmap's day squares named: ${L('calendarHeatmap')}`);
    chk(() => /kept: labels \(as the native value labels\)/.test(L('tornadoChart')) && /not carried over: none/.test(L('tornadoChart')) && /not carried over: weekStartDay|not carried over: calendar/.test(L('calendarHeatmap')),
      () => `NC2-2e. the format settings line says which were kept and which not: ${L('tornadoChart')} || ${L('calendarHeatmap')}`); }
  // ---- NC2-3 closer natives first, the current one second ----
  chk(() => SECOND.every((c) => { const r = B.reps.find((x) => x.from === c.type); return r && r.native === c.expect && r.second && r.second.native === c.second && r.second.pick === keyOfLab(c) && (r.second.lost || []).length; }),
    () => `NC2-3a. the bullet and the calendar heatmap: the closer native first, today's second (with its key and losses): ${JSON.stringify(B.reps.filter((r) => r.second).map((r) => [r.from, r.native, r.second]))}`);
  chk(() => B.reps.filter((r) => r.second).length === 2, () => 'NC2-3b. only those two have a second option');
  const S2 = await planOf({ sharedAxes: COMPARABLE, customVisualsSecond: SECOND.map(keyOfLab) });
  chk(() => !S2.pl.err && SECOND.every((c) => { const r = S2.reps.find((x) => x.from === c.type); return r && r.native === c.second && r.second && r.second.native === c.expect; }) && S2.reps.length === 11,
    () => `NC2-3c. customVisualsSecond: the second option written, the first offered back: ${short(S2.pl)}`);
  { const bad = await planOf({ sharedAxes: COMPARABLE, customVisualsSecond: ['9:1,1'] });
    chk(() => bad.pl.err || /customVisualsSecond/.test(JSON.stringify(bad.pl.j && bad.pl.j.planProblems || bad.pl.j)), () => `NC2-3d. a key that names no second option is refused: ${short(bad.pl)}`); }
  // (NC2-3g) a date table with no weekday or month column: the line stays first, and the plan says why no matrix
  { const { nativeFor } = await import('./lib/visual-meaning.mjs');
    const v = { type: 'calendarHeatmap1600000000099', fields: { Date: [{ kind: 'column', table: 'D', name: 'Day', queryRef: 'D.Day' }], Values: [{ kind: 'measure', table: 'F', name: 'Amount', queryRef: 'F.Amount' }] } };
    const r = nativeFor(v, { typeOf: (f) => (f.name === 'Day' ? 'dateTime' : undefined), calendarOf: () => null, declared: new Set([v.type]) });
    chk(() => r.native === 'lineChart' && !r.second && r.lost.some((x) => /weekday and a month column/.test(x)) && r.confidence === 'low',
      () => `NC2-3g. no weekday or month column: the line, and why no matrix: ${JSON.stringify([r.native, r.lost, r.confidence])}`); }
  // ---- NC2-4 the approval page's rows ----
  { const { shownOf } = await import('./lib/native-copy.mjs'), { summary } = await import('./lib/approval-window.mjs');
    const sm = summary('report', { customVisualsShown: shownOf(B.cv) }), sec = (sm.sections || []).find((x) => /Custom visuals replaced/.test(x.heading)), flat = JSON.stringify(sec || null);
    chk(() => sec && /0 high, 7 medium, 4 low/.test(flat) && /confidence: medium/.test(flat) && /confidence: low/.test(flat) && /second option/.test(flat) && /loses /.test(flat) && /two-sided/.test(flat),
      () => `NC2-4. the approval page shows the lead line, each confidence with its evidence, the losses and the second option: ${flat.slice(0, 900)}`); }
  // ---- CL-5 ----
  chk(() => hashOf(RD) === before && !fs.existsSync(NAT), () => 'CL-5. the plans change nothing: the original as it was, no native copy written');

  // ---- CL-6 the native copy, approved and written ----
  const id = B.pl.j && B.pl.j.plan && B.pl.j.plan.planId;
  const ok = await call('approve_plan', { planId: id });
  const made = await call('create_report', { path: 'lab', planId: id, customVisualsFrom: 'lab/' + Lab.NAME + '.Report', sharedAxes: COMPARABLE });
  chk(() => !ok.err && !made.err && made.j.written && made.j.replaced === 11 && fs.existsSync(NAT) && fs.existsSync(path.join(LAB, Lab.NAME + ' native.pbip')), () => `CL-6a. approved and written: "${Lab.NAME} native", 11 replaced: ${short(ok)} / ${short(made)}`);
  const nrj = J(path.join(NAT, 'definition', 'report.json')), nvs = visualsOf(NAT), stillCustom = nvs.filter((v) => v.visual.visualType && !VT.isNative(v.visual.visualType));
  chk(() => nrj.publicCustomVisuals.length === 2 && nrj.publicCustomVisuals.every((t) => /^(sankeyDiagram|forceGraph)/.test(t)) && stillCustom.length === 2,
    () => `CL-6b. the native copy keeps only the 2 networks custom and declared: ${JSON.stringify([nrj.publicCustomVisuals, stillCustom.map((v) => v.name)])}`);
  chk(() => nvs.length === vs.length && Lab.VISUALS_CUSTOM.filter((c) => c.expect).every((c) => { const v = nvs.find((x) => x.name === c.name); return v.visual.visualType === c.expect && JSON.stringify(v.position) === JSON.stringify(byName[c.name].position); }),
    () => 'CL-6c. every replaced visual keeps its name and place and has the expected native type');
  const v1 = Lab.validate(NAT);
  chk(() => errorsOf(v1) === 0, () => `CL-6d. the validator on the native copy: 0 errors: ${v1.text.slice(0, 800)}`);
  chk(() => hashOf(RD) === before, () => 'CL-6e. the original is still as it was');
  // (NC2-3) the written files: the bullet's target as markers, the heatmap's matrix shaded
  { const bu = nvs.find((x) => x.name === 'cvBullet').visual, ls = ((bu.objects || {}).lineStyles || [])[0] || {}, P = ls.properties || {}, lit = (p) => p && p.expr && p.expr.Literal && p.expr.Literal.Value;
    chk(() => bu.visualType === 'lineClusteredColumnComboChart' && bu.query.queryState.Y.projections.map((p) => p.queryRef).join() === 'Sales.Total Sales' && bu.query.queryState.Y2.projections.map((p) => p.queryRef).join() === 'Sales.Sales Target'
      && lit(P.strokeShow) === 'false' && lit(P.showMarker) === 'true' && lit(P.markerShape) === "'longDash'" && lit(bu.objects.valueAxis[0].properties.secShow) === 'false',
      () => `NC2-3e. the bullet written: the value as columns, the target as long-dash markers with no line, one axis: ${JSON.stringify(bu).slice(0, 900)}`);
    const hm = nvs.find((x) => x.name === 'cvCalendarHeat').visual, q = hm.query.queryState, bc = (((hm.objects || {}).values || [])[0] || {});
    chk(() => hm.visualType === 'pivotTable' && q.Rows.projections.map((p) => p.queryRef).join() === 'Calendar.Year,Calendar.Month' && q.Columns.projections.map((p) => p.queryRef).join() === 'Calendar.Weekday'
      && q.Values.projections.map((p) => p.queryRef).join() === 'Sales.Total Sales' && bc.properties.backColor.solid.color.expr.FillRule.FillRule.linearGradient2 && bc.selector.metadata === 'Sales.Total Sales',
      () => `NC2-3f. the calendar heatmap written as a matrix, year and month by weekday, the value shaded: ${JSON.stringify(hm).slice(0, 1200)}`); }
  // (NC3-3) the word cloud's bars sorted by their value, largest first (Desktop drew them A to Z with no sort written)
  { const wc = nvs.find((x) => x.name === 'cvWordCloud').visual, sd = wc.query.sortDefinition || {}, s0 = (sd.sort || [])[0] || {};
    chk(() => wc.visualType === 'clusteredBarChart' && (sd.sort || []).length === 1 && s0.direction === 'Descending' && JSON.stringify(s0.field) === JSON.stringify(wc.query.queryState.Y.projections[0].field) && sd.isDefaultSort === true,
      () => `NC3-3. the word cloud's bar chart sorted by its value, largest first: ${JSON.stringify(wc.query).slice(0, 700)}`); }
  // (NC3-4) the chip slicer: a dropdown in its own box (the pills need more height and their values' widths), never a cut row
  { const cs = nvs.find((x) => x.name === 'cvChipSlicer'), d = (((cs.visual.objects || {}).data || [])[0] || {}).properties || {}, hd = (((cs.visual.objects || {}).header || [])[0] || {}).properties || {};
    const L = (B.reps.find((r) => r.from.startsWith('chipSlicer')) || {}).lost || [];
    chk(() => cs.visual.visualType === 'slicer' && d.mode && d.mode.expr.Literal.Value === "'Dropdown'" && !(hd.show && hd.show.expr.Literal.Value === 'false') && JSON.stringify(cs.position) === JSON.stringify(byName.cvChipSlicer.position),
      () => `NC3-4a. the chip slicer written as a dropdown in its own 64-high box, its header kept (56 needed at 10pt): ${JSON.stringify(cs.visual).slice(0, 700)}`);
    chk(() => L.some((x) => /chips/.test(x) && /79/.test(x) && /dropdown/.test(x) && /64/.test(x) && !FIELDS.test(x)),
      () => `NC3-4b. its losses say why a dropdown: the pills need 79 high at 10pt and their values' widths: ${JSON.stringify(L)}`); }
  { const { nativeFor } = await import('./lib/visual-meaning.mjs');
    const v = { type: 'pillButtons1600000000098', h: 40, w: 300, fields: { Category: [{ kind: 'column', table: 'D', name: 'Region', queryRef: 'D.Region' }] } };
    const r = nativeFor(v, { declared: new Set([v.type]) });
    chk(() => r.native === 'slicer' && r.format && r.format.dropdown === true && r.format.headerOff === true && r.format.minHeight === 48, () => `NC3-4c. a chip row in a 40-high box: a dropdown with its header off, grown to 48: ${JSON.stringify([r.native, r.format])}`); }

  // ---- NC3-1, NC3-2 a made-up copy of the lab with a map and a text search added (page 5) ----
  { const LAB2 = path.join(ROOT, 'lab2'), RD2 = path.join(LAB2, Lab.NAME + '.Report'), NAT2 = path.join(LAB2, Lab.NAME + ' native.Report');
    fs.cpSync(LAB, LAB2, { recursive: true, filter: (f) => !/ native/.test(path.basename(f)) && !/ redesigned/.test(f) });
    const MAP = 'geoMapVisual1600000000053', SEARCH = 'textFilter1600000000054', P5 = path.join(RD2, 'definition', 'pages', Lab.PAGES[4].id, 'visuals');
    const C = (t, c) => ({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: `${t}.${c}`, nativeQueryRef: c });
    const M = (m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: m } }, queryRef: `Sales.${m}`, nativeQueryRef: m });
    const vj = (name, type, roles, [x, y, w, h], z) => ({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json', name, position: { x, y, z, height: h, width: w, tabOrder: z },
      visual: { visualType: type, query: { queryState: Object.fromEntries(Object.entries(roles).map(([r, p]) => [r, { projections: p }])) }, drillFilterOtherVisuals: true } });
    const put = (n, o) => { fs.mkdirSync(path.join(P5, n), { recursive: true }); fs.writeFileSync(path.join(P5, n, 'visual.json'), JSON.stringify(o, null, 2) + '\n'); };
    put('cvMap', vj('cvMap', MAP, { Location: [C('Branches', 'City')], Size: [M('Total Sales')] }, [940, 480, 316, 216], 9000));
    put('cvSearch', vj('cvSearch', SEARCH, { field: [C('Products', 'Product')] }, [1100, 16, 156, 40], 9100));
    const rj2f = path.join(RD2, 'definition', 'report.json'), rj2 = J(rj2f); rj2.publicCustomVisuals.push(MAP, SEARCH); fs.writeFileSync(rj2f, JSON.stringify(rj2, null, 2) + '\n');
    const pl2 = await call('plan_layout', { path: 'lab2', customVisualsFrom: 'lab2/' + Lab.NAME + '.Report', sharedAxes: COMPARABLE });
    const cv2 = (pl2.j && pl2.j.customVisuals) || {}, reps2 = cv2.replacements || [], mp = reps2.find((r) => r.from.startsWith('geoMapVisual')) || {}, se = reps2.find((r) => r.from.startsWith('textFilter')) || {};
    const SET1 = /"Users can use the Azure Maps visual"/, SET2 = /"Data sent to Azure Maps can be processed outside your tenant's geographic region, compliance boundary, or national cloud instance"/;
    chk(() => !pl2.err && reps2.length === 13 && mp.native === 'azureMap' && SET1.test((mp.needs || []).join(' ')) && SET2.test((mp.needs || []).join(' ')) && /May 2025/.test((mp.needs || []).join(' ')),
      () => `NC3-1a. the map: azureMap, and what the person must turn on, by the settings' exact names: ${JSON.stringify(mp).slice(0, 900)}`);
    chk(() => Array.isArray(cv2.turnOn) && cv2.turnOn.length >= 1 && SET1.test(cv2.turnOn.join(' ')) && SET2.test(cv2.turnOn.join(' ')) && /no map tiles/.test(cv2.turnOn.join(' ')) && /turnOn/.test(cv2.sayInPlan),
      () => `NC3-1b. the plan lists them once (turnOn), and says to show them: ${JSON.stringify([cv2.turnOn, cv2.sayInPlan]).slice(0, 900)}`);
    chk(() => (mp.needs || []).concat(mp.lost || []).some((x) => /data category/i.test(x) && /Column tools > Data category/.test(x)) && !FIELDS.test(JSON.stringify([mp.needs, mp.lost, mp.line, mp.tell])),
      () => `NC3-1c. its location column has no geographic data category: said, with the step to set it, no field name: ${JSON.stringify([mp.needs, mp.lost])}`);
    chk(() => mp.second && mp.second.native === 'clusteredBarChart' && mp.second.pick === '5:940,480', () => `NC3-1d. a second option that draws without Azure Maps: a bar chart of the value by the place: ${JSON.stringify(mp.second || null)}`);
    { const { shownOf } = await import('./lib/native-copy.mjs'), { summary } = await import('./lib/approval-window.mjs');
      const sm = summary('report', { customVisualsShown: shownOf(cv2) }), flat = JSON.stringify(sm);
      chk(() => SET1.test(flat.replace(/\\"/g, '"')) && /turn on/i.test(flat), () => `NC3-1e. the approval page shows what to turn on: ${flat.slice(0, 900)}`); }
    // (ST1, NC3-S5) the map as the second option (the bar chart chosen): its needs reach the plan and the approval page
    { const pl3 = await call('plan_layout', { path: 'lab2', customVisualsFrom: 'lab2/' + Lab.NAME + '.Report', sharedAxes: COMPARABLE, customVisualsSecond: ['5:940,480'] });
      const cv3 = (pl3.j && pl3.j.customVisuals) || {}, m3 = (cv3.replacements || []).find((r) => r.from.startsWith('geoMapVisual')) || {};
      const { shownOf } = await import('./lib/native-copy.mjs'), { summary } = await import('./lib/approval-window.mjs');
      const flat3 = JSON.stringify(summary('report', { customVisualsShown: shownOf(cv3) })).replace(/\\"/g, '"');
      chk(() => !pl3.err && m3.native === 'clusteredBarChart' && m3.second && m3.second.native === 'azureMap' && SET1.test((m3.second.needs || []).join(' ')) && /second option, to turn on: [^"]*"Users can use the Azure Maps visual"/.test(flat3),
        () => `NC3-1g. the map as the second option: what it needs turned on is in the plan and on the approval page: ${JSON.stringify(m3.second || null).slice(0, 600)} ${flat3.slice(0, 600)}`); }
    chk(() => se.native === 'slicer' && /dropdown/.test(se.tell || '') && /search/.test(se.tell || '') && se.second && se.second.native === 'textSlicer' && (se.lost || []).some((x) => /search box/.test(x)),
      () => `NC3-2a. the text search: a dropdown slicer with its search on, said; the input slicer second: ${JSON.stringify(se).slice(0, 900)}`);
    const id2 = pl2.j && pl2.j.plan && pl2.j.plan.planId;
    await call('approve_plan', { planId: id2 });
    const made2 = await call('create_report', { path: 'lab2', planId: id2, customVisualsFrom: 'lab2/' + Lab.NAME + '.Report', sharedAxes: COMPARABLE });
    const n2 = fs.existsSync(NAT2) ? visualsOf(NAT2) : [], sv = (n2.find((x) => x.name === 'cvSearch') || {}).visual || {}, ob = sv.objects || {}, P = (o) => ((ob[o] || [])[0] || {}).properties || {};
    chk(() => !made2.err && made2.j.replaced === 13 && SET1.test(made2.j.nextSteps) && SET2.test(made2.j.nextSteps), () => `NC3-1f. written: 13 replaced, and the next steps say what to turn on for the map: ${short(made2)}`);
    chk(() => sv.visualType === 'slicer' && P('data').mode.expr.Literal.Value === "'Dropdown'" && P('general').selfFilterEnabled.expr.Literal.Value === 'true' && P('header').show.expr.Literal.Value === 'false'
      && JSON.stringify((n2.find((x) => x.name === 'cvSearch') || {}).position) === JSON.stringify({ x: 1100, y: 16, z: 9100, height: 48, width: 156, tabOrder: 9100 }) && (se.lost || []).some((x) => /grows to 48/.test(x)),
      () => `NC3-2b. written: a dropdown with its search on, its header off, the 40-high box grown to the 48 a dropdown takes (said), in the original's place: ${JSON.stringify(sv).slice(0, 900)}`);
    const v2 = fs.existsSync(NAT2) ? Lab.validate(NAT2) : { json: null, text: 'no native copy' };
    chk(() => errorsOf(v2) === 0, () => `NC3-2c. the validator on the made-up copy's native copy: 0 errors: ${v2.text.slice(0, 900)}`);
    { const { nativeFor } = await import('./lib/visual-meaning.mjs');
      const v = { type: SEARCH, h: 40, w: 156, fields: { field: [{ kind: 'column', table: 'Products', name: 'Product', queryRef: 'Products.Product' }] } };
      const r = nativeFor(v, { declared: new Set([v.type]), second: true });
      chk(() => r.native === 'textSlicer' && r.second && r.second.native === 'slicer' && r.lost.some((x) => /types/.test(x)), () => `NC3-2d. customVisualsSecond: the input slicer written, the dropdown offered back: ${JSON.stringify([r.native, r.second && r.second.native, r.lost])}`); } }

  // ---- CL-7 the redesign of the native copy (the clutter) ----
  const rd = await call('plan_layout', { path: 'lab', redesignFrom: 'lab/' + Lab.NAME + ' native.Report' });
  const R = rd.j && rd.j.redesign, rid = rd.j && rd.j.plan && rd.j.plan.planId;
  chk(() => !rd.err && R && rid && (R.pages || []).length === 5 && R.counts && R.counts.changed > 0, () => `CL-7a. the redesign of the native copy: a plan id, 5 pages, changes: ${short(rd)}`);
  const ch = (R && R.pages || []).flatMap((p) => p.changes || []), to = (n) => (ch.find((c) => c.visual === n) || {}).to;
  chk(() => to('cardOrders') && to('cardSales') && to('cardOrders').y === to('cardSales').y, () => `CL-7b. the card 5 px off its row is put back on it: ${JSON.stringify([to('cardSales'), to('cardOrders')])}`);
  { const row = ['cvKpiTile', 'cardSales', 'cardOrders', 'cvDialGauge'].map(to), gaps = row.every(Boolean) ? row.slice(1).map((p, i) => p.x - (row[i].x + row[i].w)) : [];
    chk(() => gaps.length === 3 && new Set(gaps).size === 1, () => `CL-7c. page 1's top row with even gaps after the redesign: ${JSON.stringify(gaps)}`); }
  await call('approve_plan', { planId: rid });
  const rmade = await call('create_report', { path: 'lab', planId: rid, redesignFrom: 'lab/' + Lab.NAME + ' native.Report' });
  const RED = rmade.j && rmade.j.report ? path.join(LAB, path.basename(String(rmade.j.report))) : null;
  chk(() => !rmade.err && RED && fs.existsSync(RED) && errorsOf(Lab.validate(RED)) === 0, () => `CL-7d. the redesign approved and written, validator 0 errors: ${short(rmade)}`);
  // ---- CL-8 the laptop's driver ----
  const { run } = await import('./lab/custom-visuals-run.mjs');
  const D = path.join(TMP, 'driver'), o = await run(path.join(HERE, 'server.mjs'), D), md = fs.readFileSync(path.join(D, 'nc1-results.md'), 'utf8');
  chk(() => o.native.replaced === 11 && o.redesigned.written !== false && (md.match(/^\| \d \| cv/gm) || []).length === 13 && (md.match(/not replaced/g) || []).length === 2 && /native copy 0 errors/.test(md) && /redesigned 0 errors/.test(md),
    () => `CL-8. the driver's run: 11 replaced, the redesign written, 13 rows in the result table, validator 0 errors: ${md.slice(0, 600)}`);
} catch (e) { problems.push('the suite threw: ' + (e && e.stack || e)); }
finally { if (client) await client.close().catch(() => {}); }
fs.rmSync(TMP, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL script=test-0.3.1-custom-visuals-lab.mjs cause=${problems.length} check(s) failed`); console.log(`FAIL  custom-visuals-lab  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  custom-visuals-lab  ${checks} checks`);
