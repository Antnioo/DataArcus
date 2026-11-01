import './test-env.mjs';
// 0.3.1 MX3 (laptop part 9, rc.8: "NO but close"; the reviewer's brief of 1 Nov 13:07; mcp/work/MX3.md; written red first
// on b40cb786). Each fixture is made up in the shape of a real visual of the owner's public dashboards (evidence/0.3.1-
// shapes: their widths, cards and entries; made-up names, no data):
//   T1-T4  matrixAsTable through the tool: accepted, in the plan's data and on the approval page, a different list
//          refused at the write, the flat table written
//   R1-R4  widths: Fintech p3 tasks and milestones written as tables keep the row field's English width on their
//          names and every value column's (a header grows only into spare room); the watchlist keeps its names' 187
//   K1-K3  the names the rightmost column: Fintech p3 team flat (wider than its box: the names at the room's edge, nothing
//          after them in view), AdventureWorks p1 top 10 (fits: plainly reversed), RepeatIQ retention (wider)
//   P1-P2  RepeatIQ p4 pricing (columns Power BI sizes from the data) named; a small table with no widths not
//   E1-E2  ER p2's matrix kept for its row headers' font size: offered flat, the font said
//   H1-H7  the heatmap (Call Center p1): its weekday names beside its grid in the twin (a names table at its right edge,
//          as wide as the longest weekday, the grid growing to fit its box), the weekday bars not over them; one too
//          short for its rows and one not by weekday stay as they are (said); the copy's Arabic page has the names
//   S1     a button's approved Arabic shared with a button of the same text
//   M1     a mistyped model path lists the named folder's models first
//   node test-0.3.1-mx3.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), require = createRequire(import.meta.url);
const TM = require('../assets/js/text-measure.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.stack || e).slice(0, 400) }; } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mx3-')));
process.env.DATAARCUS_ROOT = ROOT;
const L = (v) => ({ expr: { Literal: { Value: v } } }), S = (s) => L("'" + s + "'");
const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
const num = (p) => parseFloat(String(lit(p)));

const T = 'Work';
const col = (c, d) => Object.assign({ field: { Column: { Expression: { SourceRef: { Entity: T } }, Property: c } }, queryRef: T + '.' + c, nativeQueryRef: c }, d ? { displayName: d } : {});
const mea = (m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: T } }, Property: m } }, queryRef: T + '.' + m, nativeQueryRef: m });
const agg = (fn, c) => ({ field: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: T } }, Property: c } }, Function: fn } }, queryRef: `${['Sum', 'Avg', 'CountNonNull', 'Min', 'Max'][fn]}(${T}.${c})`, nativeQueryRef: c });
const widths = (ps, ws) => ps.map((p, i) => ({ properties: ws[i] == null ? {} : { value: L(ws[i] + 'D') }, selector: { metadata: p.queryRef } }));
const OFF = [{ properties: { rowSubtotals: L('false'), columnSubtotals: L('false'), perRowLevel: L('true'), rowSubtotalsPosition: S('Top') } }, { properties: { fontColor: { solid: { color: { expr: { ThemeDataColor: { ColorId: 1, Percent: 0.1 } } } } } }, selector: { id: 'Row' } }];
const FIN = (rows) => ({ rowHeaders: [{ properties: { steppedLayoutIndentation: L('10D'), fontSize: L('12D'), outlineStyle: L('0D') } }], values: [{ properties: { fontSize: L('12D'), bandedRowHeaders: L('false') } }],
  subTotals: OFF.concat(rows.length > 1 ? [{ properties: { levelSubtotalEnabled: L('false') }, selector: { metadata: rows[1].queryRef } }] : []), blankRows: [{ properties: { showBlankRows: L('false') } }], general: [{ properties: { layout: S('Compact') } }], columnHeaders: [{ properties: { fontSize: L('12D') } }] });
const pivot = (name, box, rows, cols, vals, objects) => ({ name, position: Object.assign({ z: 1000 }, box), visual: { visualType: 'pivotTable', query: { queryState: Object.assign({ Rows: { projections: rows } }, cols.length ? { Columns: { projections: cols } } : {}, { Values: { projections: vals } }) }, objects } });
const table = (name, box, ps, ws, more) => ({ name, position: Object.assign({ z: 2000 }, box), visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: ps } } }, objects: Object.assign({ columnWidth: widths(ps, ws) }, more || {}) } });
// Fintech p3 "Project Task Delivery" 73b90b71: its real widths (two for fields no longer in it)
const TASK_R = [col('Task Name')], TASK_V = [agg(3, 'Task ID'), agg(3, 'Task Status'), agg(3, 'Priority'), agg(0, 'Planned Hours'), agg(0, 'Actual Hours'), mea('Hours Variance')];
const TASK_W = { 'Work.Task Name': 327, 'Min(Work.Task ID)': 94, 'Min(Work.Task Status)': 130, 'Min(Work.Priority)': 107, 'Sum(Work.Planned Hours)': 114, 'Sum(Work.Actual Hours)': 104, 'Work.Hours Variance': 126 };
const tasks = () => { const v = pivot('mxTasks', { x: 20, y: 20, width: 1098, height: 330 }, TASK_R, [], TASK_V, FIN(TASK_R)); v.visual.objects.columnWidth = widths(TASK_R.concat(TASK_V), TASK_R.concat(TASK_V).map((p) => TASK_W[p.queryRef])).concat(widths([mea('Old A'), mea('Old B')], [147, 127])); return v; };
const MILE_R = [col('Milestone')], MILE_V = [agg(3, 'Status'), agg(3, 'Planned Date'), agg(3, 'Actual Date'), mea('Milestone Icon'), mea('Days Late')], MILE_W = [238, 120, 157, 142, 162, 181];
const miles = () => { const v = pivot('mxMiles', { x: 20, y: 370, width: 1098, height: 330 }, MILE_R, [], MILE_V, FIN(MILE_R)); v.visual.objects.columnWidth = widths(MILE_R.concat(MILE_V), MILE_W); return v; };
// Fintech p3 "Project Delivery Team" f8d48a75 (two row levels): its real widths, in a 714 box
const TEAM_R = [col('Role Type'), col('Person Name')], TEAM_V = [agg(3, 'Employee ID'), agg(3, 'Employee Role'), agg(3, 'Experience Level'), agg(0, 'Hourly Rate')];
const team = () => { const v = pivot('mxTeam', { x: 20, y: 20, width: 714, height: 330 }, TEAM_R, [], TEAM_V, FIN(TEAM_R)); v.visual.objects.columnWidth = widths(TEAM_R.concat(TEAM_V), [211.22, 167, 45.27, 189.59, 132.06, 116.07]); return v; };

try {
  const D = path.join(ROOT, 'p'), DEF = path.join(D, 'Twin Sales.Report/definition');
  fs.cpSync(path.join(HERE, 'fixtures/twin-project'), D, { recursive: true });
  const cols = ['Task Name', 'Task ID', 'Task Status', 'Priority', 'Planned Hours', 'Actual Hours', 'Milestone', 'Status', 'Planned Date', 'Actual Date', 'Role Type', 'Person Name', 'Employee ID', 'Employee Role', 'Experience Level', 'Hourly Rate',
    'Product Name', 'Department', 'Project', 'Customer ID', 'Patient ID', 'Full Name', 'Gender', 'Weekday', 'Call Hour', 'Region', 'Owner'];
  const bimF = path.join(D, 'Twin Sales.SemanticModel/model.bim'), bim = rd(bimF);
  bim.model.tables.push({ name: T, columns: cols.map((name) => ({ name, dataType: /Hours|Rate|ID$/.test(name) && !/Task ID|Employee ID|Customer ID|Patient ID/.test(name) ? 'double' : 'string', sourceColumn: name })),
    measures: ['Hours Variance', 'Milestone Icon', 'Days Late', 'Orders', 'Revenue', 'Return Rate', 'Net Revenue', 'ASP Local', 'ASP USD', 'ASP vs Global', 'Cohort Member', 'Orders in Month', 'Days Projected Late', 'Risk Label', 'Calls', 'Wait'].map((m) => ({ name: m, expression: '1' })) }); wr(bimF, bim);
  const pj = path.join(DEF, 'pages/pages.json'), pages = rd(pj);
  const VS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
  const page = (id, h) => { pages.pageOrder.push(id); wr(path.join(DEF, 'pages', id, 'page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: id, displayName: id, displayOption: 'FitToPage', width: 1280, height: h || 720 }); };
  const put = (pg, j) => wr(path.join(DEF, 'pages', pg, 'visuals', j.name, 'visual.json'), Object.assign({ $schema: VS }, j, { position: Object.assign({ tabOrder: j.position.z }, j.position) }));
  page('p1fin'); put('p1fin', tasks()); put('p1fin', miles());
  page('p2team'); put('p2team', team());
  const TOP = [col('Product Name'), mea('Orders'), mea('Revenue'), mea('Return Rate')];
  put('p2team', pivot('mxTop', { x: 740, y: 20, width: 547 * 0.95, height: 330 }, [TOP[0]], [], TOP.slice(1), { subTotals: [{ properties: { columnSubtotals: L('false'), rowSubtotals: L('false') } }], columnWidth: widths(TOP, [232.6 * 0.95, 96.22 * 0.95, 105.6 * 0.95, 91.67 * 0.95]) }));
  const RET = [col('Customer ID'), mea('Cohort Member'), mea('Orders in Month')];
  put('p2team', table('tblRetention', { x: 20, y: 370, width: 192, height: 300 }, RET, [93, 159, 177], { columnHeaders: [{ properties: { autoSizeColumnWidth: L('false') } }] }));
  const WATCH = [col('Department'), col('Project'), mea('Days Projected Late'), mea('Risk Label')];
  put('p2team', table('tblWatch', { x: 760, y: 370, width: 490, height: 300 }, WATCH, [4, 187, 155.32, 106.62], { values: [{ properties: { wordWrap: L('false') } }], total: [{ properties: { totals: L('false') } }] }));
  // RepeatIQ p4 pricing 05e58ec0: its name column 239 wide, its four measures sized by Power BI (entries with no value)
  page('p3pricing');
  const PR = [col('Product Name'), mea('Net Revenue'), mea('ASP Local'), mea('ASP USD'), mea('ASP vs Global')];
  const pricing = pivot('mxPricing', { x: 20, y: 20, width: 600, height: 300 }, [PR[0]], [], PR.slice(1), { rowHeaders: [{ properties: { wordWrap: L('false') } }], subTotals: [{ properties: { rowSubtotals: L('false'), columnSubtotals: L('false') } }],
    columnHeaders: [{ properties: { autoSizeColumnWidth: L('true'), wordWrap: L('true') } }], columnWidth: widths([mea('Old ASP'), mea('Old USD')], [84.7, 100.9]).concat(widths(PR, [239, null, null, null, null])) });
  put('p3pricing', pricing);
  put('p3pricing', { name: 'tblSmall', position: { x: 700, y: 20, z: 3000, width: 339, height: 300 }, visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: [col('Region'), mea('Calls')] } } } } });
  // ER p2: its row headers at 14 while its values are 10
  page('p4er');
  const ER = [col('Patient ID'), agg(3, 'Full Name'), agg(3, 'Gender'), mea('Wait')];
  put('p4er', pivot('mxPatients', { x: 20, y: 20, width: 1000, height: 560 }, [ER[0]], [], ER.slice(1), { rowHeaders: [{ properties: { fontSize: L('14D') } }], values: [{ properties: { fontSize: L('10D') } }], subTotals: [{ properties: { rowSubtotals: L('false') } }] }));
  // Call Center p1's heatmap 9d8cf758 (weekdays down, hours across, 317 x 188, text 10) with its weekday bars at its
  // right (125e0cc5); a heatmap too short for its 7 rows; one by region
  page('p5heat', 800);
  const heat = (name, box, rows) => ({ name, position: Object.assign({ z: 26000 }, box), visual: { visualType: 'pivotTable', query: { queryState: { Rows: { projections: rows }, Columns: { projections: [col('Call Hour')] }, Values: { projections: [mea('Calls')] } } },
    objects: { subTotals: [{ properties: { rowSubtotals: L('false'), columnSubtotals: L('false') } }], columnHeaders: [{ properties: { outlineStyle: L('0D') } }], rowHeaders: [{ properties: { outlineStyle: L('0D'), steppedLayoutIndentation: L('10D'), outlineWeight: L('1D') } }],
      grid: [{ properties: { gridHorizontal: L('true'), gridVertical: L('true'), gridHorizontalWeight: L('5D'), gridVerticalWeight: L('2D'), textSize: L('10D') } }] },
    visualContainerObjects: { stylePreset: [{ properties: { name: S('None') } }], padding: [{ properties: { right: L('6D') } }] } } });
  put('p5heat', heat('mxHeat', { x: 543.33, y: 434.17, width: 317.5, height: 188.33 }, [col('Weekday')]));
  put('p5heat', { name: 'barDays', position: { x: 852.73, y: 451.82, z: 27000, width: 61.82, height: 166.36 }, visual: { visualType: 'clusteredBarChart', query: { queryState: { Category: { projections: [col('Weekday')] }, Y: { projections: [mea('Calls')] } } }, objects: { categoryAxis: [{ properties: { show: L('false') } }] } } });
  put('p5heat', heat('mxShort', { x: 20, y: 20, width: 317.5, height: 120 }, [col('Weekday')]));
  put('p5heat', heat('mxRegion', { x: 400, y: 20, width: 317.5, height: 188 }, [col('Region')]));
  wr(pj, pages);

  const Plans = await import('./lib/plans.mjs'), { register } = await import('./tools/create_arabic_twin.mjs'), W = await import('./lib/approval-window.mjs'), { planTwin } = await import('./lib/arabic-twin.mjs');
  let handler = null; register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = { h, def }; } }, {});
  const call = async (a) => { let r; try { r = await handler.h(a); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } const t = (r.content || []).map((c) => c.text).join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* words */ } return { err: !!r.isError, t, j }; };
  const labels = { 'field:Work.Task Name': 'اسم المهمة', 'field:Min(Work.Task ID)': 'رقم المهمة', 'field:Min(Work.Task Status)': 'حالة المهمة', 'field:Min(Work.Priority)': 'الأولوية', 'field:Sum(Work.Planned Hours)': 'الساعات المخططة', 'field:Sum(Work.Actual Hours)': 'الساعات الفعلية', 'field:Work.Hours Variance': 'فرق الساعات',
    'field:Work.Project': 'المشروع', 'field:Work.Department': 'القسم', 'field:Work.Days Projected Late': 'أيام التأخير المتوقعة', 'field:Work.Risk Label': 'مستوى المخاطر' };
  // ---------- T: matrixAsTable through the tool ----------
  const schemaHas = get(() => { const s = handler.def.inputSchema; return !!(s && (s.matrixAsTable || (s.shape && s.shape.matrixAsTable))); });
  chk(() => schemaHas === true, () => `T1. create_arabic_twin takes matrixAsTable (its input schema): ${JSON.stringify(schemaHas)}`);
  // (T on a copy of the project; the rest on the plain twin, written without the choice)
  fs.cpSync(D, path.join(ROOT, 'q'), { recursive: true });
  const a = { path: 'q/Twin Sales.pbip', arabicMonth: false, labels, matrixAsTable: ['mxTeam'] };
  const pq = await call(a), id = pq.j && pq.j.plan && pq.j.plan.planId, pl = id ? Plans.planOf(id) : null;
  const html = get(() => W.approvalHtml({ id, kind: pl.kind, writes: pl.writes }, W.summary(pl.kind, pl.data)));
  chk(() => pl && JSON.stringify(pl.data.matrixAsTable) === '["mxTeam"]' && /Matrices written flat|مصفوفات تُكتب جداول مسطحة/.test(String(html)) && /mxTeam/.test(String(html)), () => `T2. the plan's data holds the choice and the approval page names it: ${pq.err ? pq.t.slice(0, 300) : JSON.stringify(pl && pl.data && pl.data.matrixAsTable)}`);
  if (id) Plans.approve(id, 'user-in-browser');
  const bad = id ? await call(Object.assign({}, a, { planId: id, matrixAsTable: ['mxTop'] })) : { err: false, t: 'no plan' };
  chk(() => bad.err && /matrixAsTable differs/.test(bad.t), () => `T3. a write with another list is refused: ${bad.t.slice(0, 300)}`);
  const w = id ? await call(Object.assign({}, a, { planId: id })) : { err: true, t: 'no plan' };
  const atIn = (dir) => (pg, n) => { const f = path.join(ROOT, dir, 'Twin Sales AR.Report/definition/pages', pg, 'visuals', n, 'visual.json'); return fs.existsSync(f) ? rd(f) : null; };
  const atQ = atIn('q'), tq = atQ('p2team', 'mxTeam');
  chk(() => !w.err && tq && tq.visual.visualType === 'tableEx', () => `T4. written through the tool, the chosen matrix is a flat table: ${w.err ? w.t.slice(0, 300) : JSON.stringify(tq && tq.visual.visualType)}`);
  const p = await call({ path: 'p/Twin Sales.pbip', arabicMonth: false, labels }), pid = p.j && p.j.plan && p.j.plan.planId; if (pid) Plans.approve(pid, 'user-in-browser');
  const w2 = pid ? await call({ path: 'p/Twin Sales.pbip', arabicMonth: false, labels, planId: pid }) : p;
  chk(() => !w2.err, () => `T0. the plain twin is written: ${w2.t.slice(0, 300)}`);
  const AR = path.join(D, 'Twin Sales AR.Report/definition/pages'), at = atIn('p');
  // ---------- R: widths ----------
  const cw = (v) => (r) => { const e = (v.visual.objects.columnWidth || []).find((x) => x.selector && x.selector.metadata === r && x.properties && x.properties.value); return e ? num(e.properties.value) : null; };
  const names = (v, field) => { const ps = v.visual.query.queryState.Values.projections; return ps.find((x) => x.field.Measure && x.field.Measure.Property === 'Row label: ' + field) || ps.find((x) => x.queryRef === T + '.' + field && (cw(v)(x.queryRef) || 0) >= 10); };
  const tk = at('p1fin', 'mxTasks'), tn = tk && tk.visual ? names(tk, 'Task Name') : null;
  chk(() => tn && cw(tk)(tn.queryRef) === 327, () => `R1. Fintech p3 tasks: its names (the row label) keep the row field's English width 327: ${tn && cw(tk)(tn.queryRef)}`);
  const room = (v) => v.position.width - 20 * 720 / 1080,   // (the box less 20 at 1080 high, as the twin scales it: these pages are 720)
   sum = (v) => v.visual.query.queryState.Values.projections.reduce((n, x) => n + (cw(v)(x.queryRef) || 0), 0);
  chk(() => tk && TASK_V.every((x) => cw(tk)(x.queryRef) >= TASK_W[x.queryRef]) && sum(tk) <= room(tk) + 0.5, () => `R2. Fintech p3 tasks: no value column narrower than in English, the table within its box (a header grows into spare room only): ${tk && JSON.stringify(tk.visual.query.queryState.Values.projections.map((x) => [x.queryRef, cw(tk)(x.queryRef)]))}`);
  const ml = at('p1fin', 'mxMiles'), mn = ml && ml.visual ? names(ml, 'Milestone') : null;
  chk(() => mn && cw(ml)(mn.queryRef) === 238 && MILE_V.every((x, i) => cw(ml)(x.queryRef) >= MILE_W[i + 1]), () => `R3. Fintech p3 milestones: its names 238, each value as wide as in English or more: ${ml && JSON.stringify(ml.visual.query.queryState.Values.projections.map((x) => [x.queryRef, cw(ml)(x.queryRef)]))}`);
  const wt = at('p2team', 'tblWatch');
  chk(() => wt && cw(wt)(T + '.Project') === 187, () => `R4. the watchlist: its project names keep their 187 (not narrowed for a header): ${wt && JSON.stringify(wt.visual.objects.columnWidth)}`);
  // ---------- K: the names the rightmost column ----------
  const layout = (v) => { let x = 0; return v.visual.query.queryState.Values.projections.map((q) => { const w0 = cw(v)(q.queryRef) || 0, r = { ref: q.queryRef, x, w: w0 }; x += w0; return r; }); };
  const rightmost = (v, field) => { const L0 = layout(v), n = names(v, field), i = L0.findIndex((c) => n && c.ref === n.queryRef), R0 = room(v); return i >= 0 && L0[i].x + L0[i].w <= R0 + 0.5 && L0.slice(i + 1).every((c) => c.x >= R0 - 0.5 || c.w < 10); };
  const tm = tq;
  chk(() => tm && rightmost(tm, 'Role Type'), () => `K1. Fintech p3 team, flat and wider than its box: its names end the view (nothing after them in it): ${tm && JSON.stringify(layout(tm))}`);
  const tp = at('p2team', 'mxTop');
  chk(() => tp && rightmost(tp, 'Product Name') && layout(tp).slice(-1)[0].ref.includes('Product Name'), () => `K2. AdventureWorks p1 top 10 (all its columns fit): plainly reversed, its names last: ${tp && JSON.stringify(layout(tp))}`);
  const rt = at('p2team', 'tblRetention');
  chk(() => rt && rightmost(rt, 'Customer ID'), () => `K3. RepeatIQ retention (429 wide in 192): its ids end the view: ${rt && JSON.stringify(layout(rt))}`);
  // ---------- P: columns Power BI sizes from the data ----------
  const may = get(() => p.j.cannot.find((x) => x.what === 'tables that may be wider than their box'));
  chk(() => may && may.where.some((x) => /^p3pricing\/mxPricing/.test(x)) && /sized by Power BI/.test(may.why), () => `P1. RepeatIQ p4 pricing: named, its first column may be out of view: ${JSON.stringify(may)}`);
  chk(() => !may || !may.where.some((x) => /tblSmall/.test(x)), () => `P2. a small table with no widths of its own is not named: ${JSON.stringify(may && may.where)}`);
  // ---------- E: ER's font ----------
  const mc = get(() => p.j.matrixChoices);
  chk(() => mc && mc.visuals.includes('mxPatients'), () => `E1. ER p2 (kept for its row headers' font size): offered flat: ${JSON.stringify(mc)}`);
  chk(() => mc && /font/.test(mc.lost), () => `E2. the plan says its row headers' font becomes the values': ${JSON.stringify(mc && mc.lost)}`);
  // ---------- H: the heatmap ----------
  const hm = at('p5heat', 'mxHeat') || { position: {}, visual: { objects: {} } }, dir = path.join(AR, 'p5heat', 'visuals'), all = get(() => fs.readdirSync(dir).map((n) => rd(path.join(dir, n, 'visual.json'))));
  const nm = Array.isArray(all) ? all.find((v) => v.visual && v.visual.visualType === 'tableEx' && /Weekday/.test(JSON.stringify(v.visual.query)) && v.position.y === hm.position.y) : null;
  chk(() => hm && nm && Math.abs(nm.position.x - (hm.position.x + hm.position.width)) < 0.5 && nm.position.height === hm.position.height, () => `H1. Call Center p1's heatmap: a names table at its grid's right edge, its height: ${JSON.stringify([hm && hm.position, nm && nm.position])}`);
  const longest = Math.max(TM.textWidth('Wednesday', 10, false, 'Segoe UI'), TM.textWidth('الأربعاء', 10, false, 'Segoe UI'));
  chk(() => nm && nm.position.width >= longest && nm.position.width <= longest + 40 && Math.abs(hm.position.width + nm.position.width - 317.5) < 0.5, () => `H2. the names column as wide as the longest weekday name at 10 (${Math.ceil(longest)}), the pair in the heatmap's box: ${nm && nm.position.width}`);
  const ch = hm && ((hm.visual.objects.columnHeaders || []).find((e) => !e.selector) || { properties: {} }).properties;
  chk(() => ch && lit(ch.columnAdjustment) === "'growToFit'", () => `H3. the grid grows to fill its box (columnHeaders.columnAdjustment "growToFit"): ${JSON.stringify(ch)}`);
  const bar = at('p5heat', 'barDays'), over = (a0, b) => Math.max(0, Math.min(a0.x + a0.width, b.x + b.width) - Math.max(a0.x, b.x));
  chk(() => bar && nm && over(bar.position, nm.position) === 0, () => `H4. the weekday bars are not over the names: ${JSON.stringify([bar && bar.position, nm && nm.position])}`);
  const others = Array.isArray(all) ? all.filter((v) => v.visual && v.visual.visualType === 'tableEx') : [];
  chk(() => others.length === 1, () => `H5. the heatmap too short for its 7 rows and the one by region get no names table: ${others.length} names tables`);
  const hcm = get(() => p.j.cannot.find((x) => x.what === 'matrices'));
  chk(() => hcm && hcm.where.some((x) => /mxShort/.test(x)) && hcm.where.some((x) => /mxRegion/.test(x)) && !hcm.where.some((x) => /mxHeat/.test(x)) && (p.j.mirrors || []).some((x) => x.kind === 'heatmapNames' && x.where.includes('p5heat/mxHeat')),
    () => `H6. the plan: the heatmap with its names beside it in mirrors, the other two kept (said): ${JSON.stringify([hcm && hcm.where, (p.j.mirrors || []).find((x) => x.kind === 'heatmapNames')])}`);
  const P2 = get(() => planTwin({ path: 'p/Twin Sales.pbip', arabicMonth: false, into: 'same' })), cf = get(() => P2.copy.files.filter((f) => f.data != null && /\/visual\.json$/.test(f.rel)).map((f) => JSON.parse(String(f.data))));
  chk(() => Array.isArray(cf) && cf.filter((v) => v.visual && v.visual.visualType === 'tableEx' && /Weekday/.test(JSON.stringify(v.visual.query))).length === 1, () => `H7. in one report with both languages the Arabic page has the names table: ${JSON.stringify(P2 && P2.threw || cf && cf.threw || '').slice(0, 300)}`);
  // ---------- S: a button's approved Arabic shared with a button of the same text (fx1's copy: a second Reset past
  // the plan's first answer stayed English) ----------
  const { sameTextLabels } = await import('./lib/twin-texts.mjs');
  const st = [{ id: 'button:p1/r1', rawId: 'button:p1/r1', kind: 'button', text: '  Reset filters', raw: '  Reset filters' }, { id: 'button:p2/r2', rawId: 'button:p2/r2', kind: 'button', text: '  Reset filters', raw: '  Reset filters' }], sl = { 'button:p1/r1': 'إعادة ضبط الفلاتر' };
  get(() => sameTextLabels(st, sl));
  chk(() => sl['button:p2/r2'] === 'إعادة ضبط الفلاتر', () => `S1. a button with the same text takes the approved Arabic of the other: ${JSON.stringify(sl)}`);
  // ---------- M: the path ----------
  fs.mkdirSync(path.join(ROOT, 'aa/Other.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'aa/Other.SemanticModel/model.bim'), JSON.stringify({ model: { tables: [] } }));
  const { loadModel } = await import('./lib/model.mjs');
  let msg = ''; try { await loadModel('p/Twin Sale.SemanticModel'); } catch (e) { msg = String(e && e.message || e); }
  const there = msg.slice(msg.indexOf('Models there:')), iP = there.indexOf(' p/'), iA = there.indexOf(' aa/');
  chk(() => /Models there/.test(msg) && iP > 0 && (iA < 0 || iP < iA), () => `M1. a mistyped path in folder p lists p's models first: ${msg.slice(0, 300)}`);
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-mx3.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((x) => console.log('  - ' + x)); console.log(`FAIL  mx3  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  mx3  ${checks} checks`);
