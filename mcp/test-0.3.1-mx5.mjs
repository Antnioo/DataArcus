import './test-env.mjs';
// 0.3.1 MX5 (laptop part 11, rc.10: NO but close; the reviewer's brief of 2 Nov; mcp/work/MX5.md; written red first on
// e75d4327). Each fixture is made up in the shape of a real visual of the owner's public dashboards
// (evidence/0.3.1-shapes: their pages, boxes and column widths; made-up names, no data). A table's row count is data:
// the twin never knows whether Desktop draws a vertical scrollbar, so it always leaves its room.
//   S1-S6  a reversed table's room: the box less 20 less the vertical scrollbar (12 at 1080 high, part 11), less 1;
//          Fintech p3 tasks 73b90b71 and milestones af02c108 (guard), Fintech p1 watchlist 66641c48, AdventureWorks p1
//          top 10 b3b78a11 (English's own total kept), p4 customers 65eb6ebd, RepeatIQ retention 19f5c974 (wider)
//   H1-H5  Call Center p1's heatmap 9d8cf758: the names table takes English's row-header strip as the file sets it
//          ("Mon".."Sun", 36), the grid English's width, the hour chart 52c8e333 under its hours; nothing set: B1, said
//   R1-R5  the "7 rows may not all fit" estimate: ER p1 f2c68e52 (whole in 188 in Desktop) and Call Center p1 fit
//   node test-0.3.1-mx5.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), require = createRequire(import.meta.url);
const M = require('../assets/js/report-mirror.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mx5-')));
process.env.DATAARCUS_ROOT = ROOT;
const L = (v) => ({ expr: { Literal: { Value: v } } }), S = (s) => L("'" + s + "'");
const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
const num = (p) => parseFloat(String(lit(p)));
const T = 'Work';
const col = (c, d) => Object.assign({ field: { Column: { Expression: { SourceRef: { Entity: T } }, Property: c } }, queryRef: T + '.' + c, nativeQueryRef: c }, d ? { displayName: d } : {});
const mea = (m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: T } }, Property: m } }, queryRef: T + '.' + m, nativeQueryRef: m });
const agg = (fn, c) => ({ field: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: T } }, Property: c } }, Function: fn } }, queryRef: `${['Sum', 'Avg', 'CountNonNull', 'Min', 'Max'][fn]}(${T}.${c})`, nativeQueryRef: c });
const widths = (ps, ws) => ps.map((p, i) => ({ properties: ws[i] == null ? {} : { value: L(ws[i] + 'D') }, selector: { metadata: p.queryRef } }));
const pivot = (name, box, rows, cols, vals, objects, vco) => ({ name, position: Object.assign({ z: 1000 }, box), visual: Object.assign({ visualType: 'pivotTable', query: { queryState: Object.assign({ Rows: { projections: rows } }, cols.length ? { Columns: { projections: cols } } : {}, { Values: { projections: vals } }) }, objects }, vco ? { visualContainerObjects: vco } : {}) });
const table = (name, box, ps, ws) => ({ name, position: Object.assign({ z: 2000 }, box), visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: ps } } }, objects: { columnWidth: widths(ps, ws), columnHeaders: [{ properties: { autoSizeColumnWidth: L('false') } }] } } });
const SB = 12, ROOM = 20;   // the vertical scrollbar (laptop part 11, at 1080 high) and the box's own room (part 4)

// ---------- R: the row estimate, on the matrix alone (the strip set, so only the rows decide) ----------
const heat = (name, box, rows, more, vco, pt) => pivot(name, Object.assign({ z: 26000 }, box), rows, [col('Call Hour')], [mea('Calls')], Object.assign({ subTotals: [{ properties: { rowSubtotals: L('false'), columnSubtotals: L('false') } }], columnHeaders: [{ properties: { outlineStyle: L('0D') } }],
  rowHeaders: [{ properties: { outlineStyle: L('0D'), steppedLayoutIndentation: L('10D'), outlineWeight: L('1D') } }], grid: [{ properties: { gridHorizontal: L('true'), gridVertical: L('true'), gridHorizontalWeight: L('5D'), gridVerticalWeight: L('2D'), textSize: L((pt || 10) + 'D') } }] }, more || {}),
Object.assign({ stylePreset: [{ properties: { name: S('None') } }], padding: [{ properties: { right: L('6D') } }] }, vco || {}));
const DAY = [col('Weekday', ' ')], STRIP = { columnWidth: widths(DAY, [36]) };
{
  const box = { x: 20, y: 20, width: 317.5, height: 188.33 }, titled = { title: [{ properties: { show: L('true'), text: S('Calls by hour') } }] };
  const fits = (j) => M.heatmapBeside(j);
  const r1 = fits(heat('er11', box, DAY, STRIP, null, 11)), r2 = fits(heat('er9t', box, DAY, STRIP, titled, 9)), r3 = fits(heat('cc10', box, DAY, STRIP, null, 10));
  chk(() => r1.ok, () => `R1. ER p1 f2c68e52 as 11pt with no title (the old "about 202"): 7 rows whole in 188 in Desktop, so names beside: ${JSON.stringify(r1)}`);
  chk(() => r2.ok, () => `R2. ER p1 as 9pt with a title (the other shape the old "about 202" could be): names beside: ${JSON.stringify(r2)}`);
  chk(() => r3.ok, () => `R3 (guard). Call Center p1 at 10pt in 188 (7 rows and a header whole in Desktop): ${JSON.stringify(r3)}`);
  const r4 = fits(heat('big12', box, DAY, STRIP, null, 12)), r5 = fits(heat('short', Object.assign({}, box, { height: 120 }), DAY, STRIP, null, 10));
  chk(() => !r4.ok && /about 203 high/.test(r4.why), () => `R4 (guard). 12pt in 188 (8 rows of 24.6 + 6 = 203): may not all fit, said with the new number: ${JSON.stringify(r4)}`);
  chk(() => !r5.ok && /may not all fit/.test(r5.why), () => `R5 (guard). 7 rows in 120: may not all fit: ${JSON.stringify(r5)}`);
}

try {
  const D = path.join(ROOT, 'p'), DEF = path.join(D, 'Twin Sales.Report/definition');
  fs.cpSync(path.join(HERE, 'fixtures/twin-project'), D, { recursive: true });
  const cols = ['Task Name', 'Task ID', 'Task Status', 'Priority', 'Planned Hours', 'Actual Hours', 'Milestone', 'Status', 'Planned Date', 'Actual Date', 'Department', 'Project', 'Risk Level', 'Product Name', 'Customer Key', 'Full Name', 'Customer ID', 'Weekday', 'Call Hour', 'Region'];
  const bimF = path.join(D, 'Twin Sales.SemanticModel/model.bim'), bim = rd(bimF);
  bim.model.tables.push({ name: T, columns: cols.map((name) => ({ name, dataType: /Hours|Call Hour|Key/.test(name) ? 'double' : 'string', sourceColumn: name })),
    measures: ['Hours Variance', 'Milestone Icon', 'Days Late', 'Days Projected', 'Total Orders', 'Total Revenue', 'Return Rate', 'Cohort Member', 'Orders in Month', 'Calls'].map((m) => ({ name: m, expression: '1' })) }); wr(bimF, bim);
  const pj = path.join(DEF, 'pages/pages.json'), pages = rd(pj);
  const VS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
  const page = (id, w, h) => { pages.pageOrder.push(id); wr(path.join(DEF, 'pages', id, 'page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: id, displayName: id, displayOption: 'FitToPage', width: w, height: h }); };
  const put = (pg, j) => wr(path.join(DEF, 'pages', pg, 'visuals', j.name, 'visual.json'), Object.assign({ $schema: VS }, j, { position: Object.assign({ tabOrder: j.position.z }, j.position) }));
  // Fintech p3 (1920 x 1080): tasks 73b90b71 (10 rows, 9 shown in Desktop; two stale widths) and milestones af02c108 (4 rows)
  page('finP3', 1920, 1080);
  const FIN = { rowHeaders: [{ properties: { fontSize: L('12D') } }], values: [{ properties: { fontSize: L('12D') } }], subTotals: [{ properties: { rowSubtotals: L('false'), columnSubtotals: L('false') } }], columnHeaders: [{ properties: { fontSize: L('12D') } }] };
  const TASK_R = [col('Task Name')], TASK_V = [agg(3, 'Task ID'), agg(3, 'Task Status'), agg(3, 'Priority'), agg(0, 'Planned Hours'), agg(0, 'Actual Hours'), mea('Hours Variance')], TASK_W = [326.82, 94.29, 130.37, 107, 114, 104.05, 125.7];
  put('finP3', pivot('tasks', { x: 400, y: 600, width: 1097.67, height: 375.33 }, TASK_R, [], TASK_V, Object.assign({}, FIN, { columnWidth: widths(TASK_R.concat(TASK_V), TASK_W).concat(widths([mea('Old A'), mea('Old B')], [147, 127])) })));
  const MILE_R = [col('Milestone')], MILE_V = [agg(3, 'Status'), agg(3, 'Planned Date'), agg(3, 'Actual Date'), mea('Milestone Icon'), mea('Days Late')], MILE_W = [237.82, 120.21, 156.61, 142, 162, 180.65];
  put('finP3', pivot('miles', { x: 400, y: 340, width: 1097.67, height: 219.33 }, MILE_R, [], MILE_V, Object.assign({}, FIN, { columnWidth: widths(MILE_R.concat(MILE_V), MILE_W).concat(widths([mea('Old A')], [147])) })));
  // Fintech p1 (1920 x 1080): the watchlist 66641c48 (a hidden first column of 4)
  page('finP1', 1920, 1080);
  const WATCH = [col('Department'), col('Project'), mea('Days Projected'), col('Risk Level')];
  put('finP1', table('watch', { x: 1400, y: 600, width: 490, height: 360 }, WATCH, [4, 187, 155.32, 106.62]));
  // AdventureWorks p1 and p4 (1280 x 720): top 10 b3b78a11 (526.1 of columns in 547.5, English's own fitted) and
  // customers 65eb6ebd (389.9 in 448.1)
  page('awP1', 1280, 720);
  const TOP_R = [col('Product Name')], TOP_V = [mea('Total Orders'), mea('Total Revenue'), mea('Return Rate')];
  put('awP1', pivot('top10', { x: 20, y: 480, width: 547.5, height: 210.6 }, TOP_R, [], TOP_V, { subTotals: [{ properties: { rowSubtotals: L('false') } }], columnWidth: widths(TOP_R.concat(TOP_V), [232.6, 96.22, 105.6, 91.67]) }));
  page('awP4', 1280, 720);
  put('awP4', table('customers', { x: 800, y: 280, width: 448.13, height: 415.3 }, [col('Customer Key'), col('Full Name'), mea('Total Orders'), mea('Total Revenue')], [98.98, 155.13, 64.04, 71.69]));
  // RepeatIQ retention 19f5c974 (720 high): 429 of columns in a 192 box, the wider case
  page('rqRet', 1280, 720);
  put('rqRet', table('retention', { x: 20, y: 370, width: 192, height: 300 }, [col('Customer ID'), mea('Cohort Member'), mea('Orders in Month')], [93, 159, 177]));
  // Call Center p1 (1280 x 800): the heatmap 9d8cf758 with "Mon".."Sun" (its strip set 36 in English), the hour chart
  // 52c8e333 under its grid; the same heatmap as the real file has it (no width set) on its own page; one by region
  page('ccP1', 1280, 800);
  const HB = { x: 543.33, y: 434.17, width: 317.5, height: 188.33 }, CB = { x: 557.5, y: 603.75, width: 310, height: 82.5 }, STRIP_W = 36;
  put('ccP1', heat('heatShort', HB, DAY, { columnWidth: widths(DAY, [STRIP_W]) }));
  put('ccP1', { name: 'colHours', position: Object.assign({ z: 28000 }, CB), visual: { visualType: 'columnChart', query: { queryState: { Category: { projections: [col('Call Hour')] }, Y: { projections: [mea('Calls')] } } }, objects: { categoryAxis: [{ properties: { show: L('false') } }], valueAxis: [{ properties: { show: L('false') } }] } } });
  page('ccReal', 1280, 800);
  put('ccReal', heat('heatReal', HB, DAY));
  put('ccReal', heat('heatRegion', { x: 20, y: 20, width: 317.5, height: 188.33 }, [col('Region')], { columnWidth: widths([col('Region')], [60]) }));
  wr(pj, pages);

  const Plans = await import('./lib/plans.mjs'), { register } = await import('./tools/create_arabic_twin.mjs');
  let handler = null; register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = { h, def }; } }, {});
  const call = async (a) => { let r; try { r = await handler.h(a); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } const t = (r.content || []).map((c) => c.text).join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* words */ } return { err: !!r.isError, t, j }; };
  const a = { path: 'p/Twin Sales.pbip', arabicMonth: false };
  const p = await call(a), id = p.j && p.j.plan && p.j.plan.planId; if (id) Plans.approve(id, 'user-in-browser');
  const w = id ? await call(Object.assign({}, a, { planId: id })) : p;
  chk(() => !w.err, () => `S0. the twin is written: ${w.t.slice(0, 300)}`);
  const ARR = path.join(D, 'Twin Sales AR.Report');
  const at = (pg, n) => { const f = path.join(ARR, 'definition/pages', pg, 'visuals', n, 'visual.json'); return fs.existsSync(f) ? rd(f) : null; };
  // ---------- S: the tables' room ----------
  const cwOf = (v) => (r) => { const e = (v.visual.objects.columnWidth || []).find((x) => x.selector && x.selector.metadata === r && x.properties && x.properties.value); return e ? num(e.properties.value) : null; };
  const lay = (v) => { let x = 0; return v.visual.query.queryState.Values.projections.map((q) => { const w0 = cwOf(v)(q.queryRef) || 0, r = { ref: q.queryRef, x, w: w0 }; x += w0; return r; }); };
  const total = (v) => lay(v).reduce((s, c) => s + c.w, 0), r2 = (n) => Math.round(n * 100) / 100;
  const view = (v, sc) => v.position.width - (ROOM + SB) * sc;
  const last = (v) => { const l = lay(v).filter((c) => c.w >= 10); return l[l.length - 1]; };
  const tk = at('finP3', 'tasks'), ml = at('finP3', 'miles'), wl = at('finP1', 'watch'), tp = at('awP1', 'top10'), cu = at('awP4', 'customers'), rt = at('rqRet', 'retention');
  chk(() => tk && Math.abs(total(tk) - (view(tk, 1) - 1)) < 0.5 && /Task Name/.test(last(tk).ref) && Math.abs(last(tk).w - 326.82) < 0.5, () => `S1. Fintech p3 tasks (10 rows, 9 shown): its columns fill the room less the vertical scrollbar (1097.67 - 20 - 12 - 1 = 1064.67), the names last at 326.82: ${tk && r2(total(tk))} ${tk && JSON.stringify(lay(tk))}`);
  chk(() => ml && Math.abs(total(ml) - (view(ml, 1) - 1)) < 0.5 && /Milestone/.test(last(ml).ref) && Math.abs(last(ml).w - 237.82) < 0.5 && lay(ml).filter((c) => c.w >= 10)[0].w > 180.65, () => `S2 (guard: part 11's right one). Fintech p3 milestones: the names last at their English width, the slack in the leftmost column, the room the same: ${ml && r2(total(ml))} ${ml && JSON.stringify(lay(ml))}`);
  chk(() => wl && total(wl) <= view(wl, 1) - 1 + 0.5 && total(wl) >= view(wl, 1) - 1.5 && /Project/.test(last(wl).ref) && lay(wl)[0].w < 10, () => `S3. Fintech p1 watchlist: all its columns, the hidden 4 counted, within 490 - 20 - 12 - 1 = 457, the names last: ${wl && r2(total(wl))} ${wl && JSON.stringify(lay(wl))}`);
  chk(() => tp && Math.abs(total(tp) - 526.09) < 0.5 && /Product Name/.test(last(tp).ref), () => `S4. AdventureWorks p1 top 10: English's own 526.09 fitted (over the room less the scrollbar, 547.5 - 21.33 - 1 = 525.17): never grown past it, never shrunk: ${tp && r2(total(tp))} ${tp && JSON.stringify(lay(tp))}`);
  chk(() => cu && Math.abs(total(cu) - (view(cu, 720 / 1080) - 1)) < 0.5 && /Customer Key/.test(last(cu).ref), () => `S5. AdventureWorks p4 customers: 448.13 - (20 + 12) x 2/3 - 1 = 425.8: ${cu && r2(total(cu))} ${cu && JSON.stringify(lay(cu))}`);
  const rl = rt ? lay(rt).filter((c) => c.w >= 10) : [], iN = rl.findIndex((c) => /Customer ID/.test(c.ref)), rv = rt ? view(rt, 720 / 1080) : 0;
  chk(() => iN === 1 && /Cohort Member/.test(rl[0].ref) && Math.abs(rl[iN].w - 93) < 0.5 && Math.abs(rl[iN].x + rl[iN].w - rv) < 0.5 && Math.abs(rl[0].w - (rv - 93)) < 0.5, () => `S6. RepeatIQ retention (wider): the names at their 93 end the room less the scrollbar (${r2(rv)}), English's second column in view before them: ${JSON.stringify(rl)}`);
  // ---------- H: the heatmap ----------
  const tablesOn = (pg) => { const dir = path.join(ARR, 'definition/pages', pg, 'visuals'); return fs.existsSync(dir) ? fs.readdirSync(dir).map((n) => rd(path.join(dir, n, 'visual.json'))).filter((v) => v.visual.visualType === 'tableEx') : []; };
  const hm = at('ccP1', 'heatShort'), nm = tablesOn('ccP1').find((v) => hm && Math.abs(v.position.y - hm.position.y) < 0.5);
  const padOf = (v, side) => { const e = ((v.visual.visualContainerObjects || {}).padding || []).find((x) => !x.selector); return e && e.properties[side] ? num(e.properties[side]) : 0; };
  const enGrid = HB.width - 6 - STRIP_W, arGrid = hm ? hm.position.width - 1 - padOf(hm, 'left') - padOf(hm, 'right') : NaN;
  chk(() => nm && Math.abs(arGrid - enGrid) < 0.5, () => `H1. Call Center "Mon".."Sun" (English's strip set 36): the grid keeps English's width exactly (317.5 - 6 - 36 = ${enGrid}): ${arGrid} ${nm ? '' : '(no names table)'}`);
  chk(() => nm && Math.abs(nm.position.width + 1 - STRIP_W) < 0.5 && Math.abs(nm.position.x - (hm.position.x + hm.position.width)) < 0.5 && padOf(nm, 'left') === 0 && padOf(nm, 'right') === 0, () => `H2. the names table takes the strip (35, and the matrix's hidden 1), at the grid's right, no padding of its own: ${JSON.stringify([hm && hm.position, nm && nm.position])}`);
  const ch = at('ccP1', 'colHours'), gridC = (x, w, lead) => x + (lead + w) / 2;
  const off = ch && hm ? (gridC(hm.position.x, hm.position.width, 1) - (ch.position.x + ch.position.width / 2)) + (gridC(HB.x, HB.width, STRIP_W) - (CB.x + CB.width / 2)) : NaN;
  chk(() => nm && Math.abs(off) <= 3, () => `H3. the hour chart 52c8e333 under the grid's hours as in English (the grid's centre against the chart's, mirrored): ${off}`);
  const mx = (p.j && Array.isArray(p.j.cannot) ? p.j.cannot : []).find((x) => x.what === 'matrices'), line = (n) => ((mx && mx.where) || []).find((x) => x.includes('/' + n)) || '';
  chk(() => tablesOn('ccReal').length === 0 && /width is not set/.test(line('heatReal')), () => `H4. the real Call Center file (its strip not set, sized by Desktop from the data): B1, the plan says why: ${tablesOn('ccReal').length} names tables, ${JSON.stringify(mx && mx.where)}`);
  chk(() => /days of the week/.test(line('heatRegion')) && !line('heatShort') && (p.j.mirrors || []).some((x) => x.kind === 'heatmapNames' && x.where.includes('ccP1/heatShort')), () => `H5 (guard). a heatmap by region (set) stays B1 for its rows; the one beside its names is not among the kept: ${JSON.stringify(mx && mx.where)}`);
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-mx5.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((x) => console.log('  - ' + x)); console.log(`FAIL  mx5  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  mx5  ${checks} checks`);
