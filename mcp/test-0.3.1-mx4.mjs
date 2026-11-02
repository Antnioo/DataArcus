import './test-env.mjs';
// 0.3.1 MX4 (laptop part 10, rc.9: NO, one blocking regression; the reviewer's brief of 2 Nov; mcp/work/MX4.md; written
// red first on a7d04ad5). Each fixture is made up in the shape of a real visual of the owner's public dashboards
// (evidence/0.3.1-shapes: their boxes, cards and entries; made-up names, no data):
//   V1-V3  Microsoft's validator on a WRITTEN twin and its copy (into "same"): no code the English original does not
//          have; every visual.json the twin and the copy write carries $schema (the heatmap's names table had none)
//   H1-H4  Call Center p1's heatmap 9d8cf758: the grid keeps its English cells' width, the names take the hidden row
//          headers' room, the hour chart 52c8e333 under it lines up; a row header whose width is not set (MX5): B1
//   L1-L3  the legend donut a28b4206 in the cards' order: each item keeps its English colour
//   C1-C2  the agent card bae91c53: the layout that keeps its contact line whole (no "tabular"), its titles padded
//   T1-T3  Fintech p3 73b90b71 and af02c108 (narrower than their box): the slack at the left, the names at the right
//   K1-K3  RepeatIQ 19f5c974 (wider than its box): the names at their English width, English's second column in view
//   B1-B2  every heatmap kept B1 named in the plan with its reason
//   A1-A2  a flattened table's text columns (Min of a text column) right-aligned, a number's not
//   node test-0.3.1-mx4.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), require = createRequire(import.meta.url);
const M = require('../assets/js/report-mirror.js'), TM = require('../assets/js/text-measure.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.stack || e).slice(0, 400) }; } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); };
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mx4-')));
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
const fill = (id) => ({ solid: { color: { expr: { ThemeDataColor: { ColorId: id, Percent: 0 } } } } });
const fillOf = (v, ref) => { const e = ((v.visual.objects || {}).dataPoint || []).find((x) => x.selector && x.selector.metadata === ref); return e ? JSON.stringify(e.properties.fill) : null; };
const mir = (v, o) => M.mirrorVisual(v, 1280, Object.assign({ dateTables: [], dateColumns: [], textColumns: [] }, o || {})).json;

// ---------- L: the legend donut (Call Center p1 a28b4206: two measures, no category, legend TopCenter; Answered's own
// fill the theme's first colour, Unanswered none of its own: the theme's second, as its ring 42cddcde's arc) ----------
{
  const two = [mea('Calls Answered'), mea('Calls Unanswered')];
  const strip = { name: 'a28b4206', position: { x: 712, y: 82, z: 19000, width: 196, height: 40 }, visual: { visualType: 'donutChart', query: { queryState: { Y: { projections: two } }, sortDefinition: { sort: [{ field: two[0].field, direction: 'Descending' }], isDefaultSort: true } },
    objects: { labels: [{ properties: { show: L('false') } }], legend: [{ properties: { position: S('TopCenter') } }], dataPoint: [{ properties: { fill: fill(2) }, selector: { metadata: 'Work.Calls Answered' } }] } } };
  const m = mir(strip), order = m.visual.query.queryState.Y.projections.map((p) => p.queryRef);
  chk(() => order[0] === 'Work.Calls Unanswered' && fillOf(m, 'Work.Calls Unanswered') === JSON.stringify(fill(3)), () => `L1. the legend donut reordered: Unanswered keeps its English colour (the theme's second, ColorId 3), written with it: ${JSON.stringify(order)} ${fillOf(m, 'Work.Calls Unanswered')}`);
  chk(() => fillOf(m, 'Work.Calls Answered') === JSON.stringify(fill(2)), () => `L2. Answered keeps its own fill: ${fillOf(m, 'Work.Calls Answered')}`);
  const ring = JSON.parse(JSON.stringify(strip)); ring.visual.objects.legend = [{ properties: { show: L('false') } }];
  const r = mir(ring);
  chk(() => JSON.stringify(r.visual.objects.dataPoint) === JSON.stringify(ring.visual.objects.dataPoint), () => `L3 (guard). a donut whose legend is hidden (not reordered): its fills as they are: ${JSON.stringify(r.visual.objects.dataPoint)}`);
}
// ---------- A: ER p2 flat (Patient ID, then Min of text columns, a number, a measure) ----------
{
  const er = pivot('erFlat', { x: 20, y: 20, width: 1000, height: 560 }, [col('Patient ID')], [], [agg(3, 'Full Name'), agg(3, 'Department'), agg(3, 'Age'), mea('Wait')], { subTotals: [{ properties: { rowSubtotals: L('false') } }] });
  const t = mir(er, { textColumns: ['Work.Patient ID', 'Work.Full Name', 'Work.Department'] }), cf = (ref) => { const e = (t.visual.objects.columnFormatting || []).find((x) => x.selector && x.selector.metadata === ref); return e ? lit(e.properties.alignment) : undefined; };
  chk(() => t.visual.visualType === 'tableEx' && cf('Min(Work.Full Name)') === "'Right'" && cf('Min(Work.Department)') === "'Right'", () => `A1. ER p2 written flat: Full Name and Department (Min of a text column) right-aligned as the plan says: ${t.visual.visualType} ${cf('Min(Work.Full Name)')} ${cf('Min(Work.Department)')}`);
  chk(() => cf('Min(Work.Age)') === undefined, () => `A2 (guard). Min of a number column keeps Power BI's own alignment: ${cf('Min(Work.Age)')}`);
}

try {
  const D = path.join(ROOT, 'p'), DEF = path.join(D, 'Twin Sales.Report/definition');
  fs.cpSync(path.join(HERE, 'fixtures/twin-project'), D, { recursive: true });
  const cols = ['Task Name', 'Task ID', 'Task Status', 'Priority', 'Planned Hours', 'Actual Hours', 'Milestone', 'Status', 'Planned Date', 'Actual Date', 'Customer ID', 'Weekday', 'Call Hour', 'Region', 'Agent', 'Email'];
  const bimF = path.join(D, 'Twin Sales.SemanticModel/model.bim'), bim = rd(bimF);
  bim.model.tables.push({ name: T, columns: cols.map((name) => ({ name, dataType: /Hours|Call Hour/.test(name) ? 'double' : 'string', sourceColumn: name })),
    measures: ['Hours Variance', 'Milestone Icon', 'Days Late', 'Cohort Member', 'Orders in Month', 'Calls', 'Calls Answered', 'Calls Unanswered', 'Answered %', 'Resolution Rate', 'Speed'].map((m) => ({ name: m, expression: '1' })) }); wr(bimF, bim);
  const pj = path.join(DEF, 'pages/pages.json'), pages = rd(pj);
  const VS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
  const page = (id, h) => { pages.pageOrder.push(id); wr(path.join(DEF, 'pages', id, 'page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: id, displayName: id, displayOption: 'FitToPage', width: 1280, height: h || 720 }); };
  const put = (pg, j) => wr(path.join(DEF, 'pages', pg, 'visuals', j.name, 'visual.json'), Object.assign({ $schema: VS }, j, { position: Object.assign({ tabOrder: j.position.z }, j.position) }));
  // Call Center p1 (1280 x 800): the heatmap 9d8cf758 (weekdays down, hours across, text 10, its right padding 6), the
  // hour chart 52c8e333 under its grid; one too short for its 7 rows, one by region, one whose row header's width is not set
  page('p1heat', 800);
  const heat = (name, box, rows, more) => pivot(name, Object.assign({ z: 26000 }, box), rows, [col('Call Hour')], [mea('Calls')], Object.assign({ subTotals: [{ properties: { rowSubtotals: L('false'), columnSubtotals: L('false') } }], columnHeaders: [{ properties: { outlineStyle: L('0D') } }],
    rowHeaders: [{ properties: { outlineStyle: L('0D'), steppedLayoutIndentation: L('10D'), outlineWeight: L('1D') } }], grid: [{ properties: { gridHorizontal: L('true'), gridVertical: L('true'), gridHorizontalWeight: L('5D'), gridVerticalWeight: L('2D'), textSize: L('10D') } }] }, more || {}),
  { stylePreset: [{ properties: { name: S('None') } }], padding: [{ properties: { right: L('6D') } }] });
  const HB = { x: 543.33, y: 434.17, width: 317.5, height: 188.33 }, CB = { x: 557.5, y: 603.75, width: 310, height: 82.5 };
  // (MX5, moved on purpose: names beside only when English sets its row header strip: mxHeat's set at R, mxNarrow's not set)
  put('p1heat', heat('mxHeat', HB, [col('Weekday', ' ')], { columnWidth: widths([col('Weekday', ' ')], [Math.ceil(Math.max(TM.textWidth('Wednesday', 10, false, 'Segoe UI'), TM.textWidth('الأربعاء', 10, false, 'Segoe UI')) + 12)]) }));
  put('p1heat', { name: 'colHours', position: Object.assign({ z: 28000 }, CB), visual: { visualType: 'columnChart', query: { queryState: { Category: { projections: [col('Call Hour')] }, Y: { projections: [mea('Calls')] } } }, objects: { categoryAxis: [{ properties: { show: L('false') } }], valueAxis: [{ properties: { show: L('false') } }] } } });
  put('p1heat', heat('mxShort', { x: 20, y: 20, width: 317.5, height: 120 }, [col('Weekday')]));
  put('p1heat', heat('mxRegion', { x: 400, y: 20, width: 317.5, height: 188 }, [col('Region')]));
  put('p1heat', heat('mxNarrow', { x: 20, y: 220, width: 317.5, height: 188 }, [col('Weekday')]));
  // Fintech p3 (720 high): the tasks 73b90b71 (its real widths, 1002 in 1098, two stale entries) and milestones af02c108
  page('p2fin');
  const TASK_R = [col('Task Name')], TASK_V = [agg(3, 'Task ID'), agg(3, 'Task Status'), agg(3, 'Priority'), agg(0, 'Planned Hours'), agg(0, 'Actual Hours'), mea('Hours Variance')], TASK_W = [327, 94, 130, 107, 114, 104, 126];
  const FIN = { rowHeaders: [{ properties: { fontSize: L('12D') } }], values: [{ properties: { fontSize: L('12D') } }], subTotals: [{ properties: { rowSubtotals: L('false'), columnSubtotals: L('false') } }], columnHeaders: [{ properties: { fontSize: L('12D') } }] };
  const tk = pivot('mxTasks', { x: 20, y: 20, width: 1098, height: 330 }, TASK_R, [], TASK_V, Object.assign({}, FIN, { columnWidth: widths(TASK_R.concat(TASK_V), TASK_W).concat(widths([mea('Old A'), mea('Old B')], [147, 127])) })); put('p2fin', tk);
  const MILE_R = [col('Milestone')], MILE_V = [agg(3, 'Status'), agg(3, 'Planned Date'), agg(3, 'Actual Date'), mea('Milestone Icon'), mea('Days Late')], MILE_W = [238, 120, 157, 142, 162, 181];
  put('p2fin', pivot('mxMiles', { x: 20, y: 370, width: 1098, height: 330 }, MILE_R, [], MILE_V, Object.assign({}, FIN, { columnWidth: widths(MILE_R.concat(MILE_V), MILE_W) })));
  // RepeatIQ retention 19f5c974: 429 of columns in a 192 box (names 93: English shows them and part of the second)
  page('p3ret');
  const RET = [col('Customer ID'), mea('Cohort Member'), mea('Orders in Month')];
  put('p3ret', { name: 'tblRetention', position: { x: 20, y: 370, z: 2000, width: 192, height: 300 }, visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: RET } } }, objects: { columnWidth: widths(RET, [93, 159, 177]), columnHeaders: [{ properties: { autoSizeColumnWidth: L('false') } }] } } });
  // Call Center p1's agent card bae91c53: its titles padded into a column ("space + LRM"), a contact line (its title
  // hidden, its value shown) and the legend donut a28b4206
  page('p4card', 800);
  const pad = (t, n) => t + ' ‎'.repeat(n), titles = [['Calls', 30], ['Answered %', 16], ['Resolution Rate', 11], ['Avg Speed of Answer', 2]];
  const RL = [mea('Calls'), mea('Answered %'), mea('Resolution Rate'), mea('Speed')];
  put('p4card', { name: 'cardDan', position: { x: 881.67, y: 408.33, z: 37000, width: 387.5, height: 391.67 }, visual: { visualType: 'cardVisual', query: { queryState: { Data: { projections: [agg(3, 'Agent')] } } },
    objects: { referenceLabel: RL.concat([agg(3, 'Email')]).map((x, i) => ({ properties: { value: { expr: x.field } }, selector: { data: [{ dataViewWildcard: { matchingOption: 0 } }], metadata: 'Min(Work.Agent)', id: 'field-' + i, order: i } })),
      referenceLabelTitle: titles.map(([t, n], i) => ({ properties: { titleContentType: S('custom'), titleText: S(pad(t, n)) }, selector: { metadata: 'Min(Work.Agent)', id: 'field-' + i } })).concat([{ properties: { show: L('false') }, selector: { metadata: 'Min(Work.Agent)', id: 'field-4' } }]),
      referenceLabelValue: [{ properties: { show: L('true') }, selector: { metadata: 'Min(Work.Agent)', id: 'field-4' } }] } } });
  const two = [mea('Calls Answered'), mea('Calls Unanswered')];
  put('p4card', { name: 'donutLegend', position: { x: 712, y: 82, z: 19000, width: 196, height: 40 }, visual: { visualType: 'donutChart', query: { queryState: { Y: { projections: two } } }, objects: { labels: [{ properties: { show: L('false') } }], legend: [{ properties: { position: S('TopCenter') } }], dataPoint: [{ properties: { fill: fill(2) }, selector: { metadata: 'Work.Calls Answered' } }] } } });
  wr(pj, pages);

  const Plans = await import('./lib/plans.mjs'), { register } = await import('./tools/create_arabic_twin.mjs');
  let handler = null; register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = { h, def }; } }, {});
  const call = async (a) => { let r; try { r = await handler.h(a); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } const t = (r.content || []).map((c) => c.text).join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* words */ } return { err: !!r.isError, t, j }; };
  const AR = ['المكالمات', 'نسبة الرد', 'نسبة الحل', 'متوسط سرعة الرد'];
  const labels = Object.assign({ 'field:Work.Task Name': 'اسم المهمة', 'field:Min(Work.Task ID)': 'رقم المهمة', 'field:Min(Work.Task Status)': 'حالة المهمة', 'field:Min(Work.Priority)': 'الأولوية', 'field:Sum(Work.Planned Hours)': 'الساعات المخططة', 'field:Sum(Work.Actual Hours)': 'الساعات الفعلية', 'field:Work.Hours Variance': 'فرق الساعات' },
    Object.fromEntries(AR.map((t, i) => [`text:p4card/cardDan/o.referenceLabelTitle.${i}.titleText`, t])));
  const write = async (extra) => { const a = Object.assign({ path: 'p/Twin Sales.pbip', arabicMonth: false, labels }, extra || {}); const p = await call(a), id = p.j && p.j.plan && p.j.plan.planId; if (id) Plans.approve(id, 'user-in-browser'); const w = id ? await call(Object.assign({}, a, { planId: id })) : p; return { p, w }; };
  const { p, w } = await write();
  chk(() => !w.err, () => `T0. the twin is written: ${w.t.slice(0, 300)}`);
  const ENR = path.join(D, 'Twin Sales.Report'), ARR = path.join(D, 'Twin Sales AR.Report'), CPR = path.join(D, 'Twin Sales (EN-AR).Report');
  const at = (pg, n) => { const f = path.join(ARR, 'definition/pages', pg, 'visuals', n, 'visual.json'); return fs.existsSync(f) ? rd(f) : null; };
  // ---------- V: the validator on the written twin and copy ----------
  const { runReportValidation, getMetadataProvider } = await import('@microsoft/powerbi-report-authoring-cli');
  const codes = async (dir) => { if (!fs.existsSync(dir)) return null; const s = await runReportValidation({ reportDir: dir, defDir: path.join(dir, 'definition'), provider: await getMetadataProvider(), skipSchema: true });
    return Object.entries(s.diagnostics || {}).filter(([, d]) => (d.items || []).length && d.severity === 'error').map(([c, d]) => c + ' ' + d.items.map((it) => path.basename(path.dirname(String(it.file || '')))).join(',')); };
  const en = await codes(ENR), ar = await codes(ARR), enCodes = new Set((en || []).map((x) => x.split(' ')[0]));
  chk(() => Array.isArray(ar) && ar.every((x) => enCodes.has(x.split(' ')[0])), () => `V1. Microsoft's validator on the written twin: no error code the English original does not have (Desktop refused the whole report for one): English ${JSON.stringify(en)}, twin ${JSON.stringify(ar)}`);
  const cw = await write({ into: 'same' }), cp = await codes(CPR);
  chk(() => !cw.w.err && Array.isArray(cp) && cp.every((x) => enCodes.has(x.split(' ')[0])), () => `V2. the same on the copy holding both languages: ${cw.w.err ? cw.w.t.slice(0, 300) : JSON.stringify(cp)}`);
  const visualsIn = (dir) => { const out = []; const walk = (d) => { if (!fs.existsSync(d)) return; fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name === 'visual.json') out.push(f); }); }; walk(dir); return out; };
  const noSchema = [ARR, CPR].flatMap((d) => visualsIn(d).filter((f) => typeof rd(f).$schema !== 'string').map((f) => path.relative(ROOT, f)));
  chk(() => visualsIn(ARR).length > 0 && noSchema.length === 0, () => `V3. every visual.json the twin and the copy write carries $schema: missing in ${JSON.stringify(noSchema)}`);
  // ---------- H: the heatmap ----------
  const hm = at('p1heat', 'mxHeat'), names = get(() => visualsIn(path.join(ARR, 'definition/pages/p1heat')).map(rd).filter((v) => v.visual.visualType === 'tableEx'));
  const nm = Array.isArray(names) ? names.find((v) => hm && v.position.y === hm.position.y) : null;
  const R = Math.ceil(Math.max(TM.textWidth('Wednesday', 10, false, 'Segoe UI'), TM.textWidth('الأربعاء', 10, false, 'Segoe UI')) + 12);   // the English row header: the longest name + the cell's padding (5-6 a side)
  const pad0 = (v, side) => { const e = ((v.visual.visualContainerObjects || {}).padding || []).find((x) => !x.selector); return e && e.properties[side] ? num(e.properties[side]) : null; };
  chk(() => hm && hm.position.width - 1 >= HB.width - R - 0.5, () => `H1. the grid keeps its English cells' width (the box ${HB.width} less the English row header ${R}; the twin's matrix less its hidden 1): ${hm && hm.position.width}`);
  chk(() => nm && Math.abs(nm.position.width - (R - 1)) < 0.5 && pad0(nm, 'left') === 0 && pad0(nm, 'right') === 0 && Math.abs(nm.position.x - (hm.position.x + hm.position.width)) < 0.5 && Math.abs(hm.position.width + nm.position.width - HB.width) < 0.5,
    () => `H2. the names take the hidden row headers' room (${R - 1}, no padding of their own), the pair in the box: ${JSON.stringify([hm && hm.position, nm && nm.position, nm && nm.visual.visualContainerObjects.padding])}`);
  const ch = at('p1heat', 'colHours'), gridC = (x, w, lead) => x + (lead + w) / 2;
  const off = ch && hm ? (gridC(hm.position.x, hm.position.width, 1) - (ch.position.x + ch.position.width / 2)) + (gridC(HB.x, HB.width, R) - (CB.x + CB.width / 2)) : NaN;
  chk(() => Math.abs(off) <= 3, () => `H3. the hour chart 52c8e333 under the grid lines up as in English (the grid's centre against the chart's, mirrored): ${off}`);
  const nnames = Array.isArray(names) ? names.length : -1;
  chk(() => nnames === 1, () => `H4. a heatmap whose row header's width is not set (MX5), one too short, one by region: no names table (B1): ${nnames} names tables`);
  // ---------- B: the plan names each heatmap kept B1 with its reason ----------
  const mx = get(() => p.j.cannot.find((x) => x.what === 'matrices')), line = (n) => ((mx && mx.where) || []).find((x) => x.includes('/' + n)) || '';
  chk(() => /fit/.test(line('mxShort')) && /days of the week/.test(line('mxRegion')) && /row header/.test(line('mxNarrow')), () => `B1. each heatmap kept B1 named with its reason: ${JSON.stringify(mx && mx.where)}`);
  chk(() => !line('mxHeat') && (p.j.mirrors || []).some((x) => x.kind === 'heatmapNames' && x.where.includes('p1heat/mxHeat')), () => `B2 (guard). Call Center's (names beside it) not among them: ${JSON.stringify(mx && mx.where)}`);
  // ---------- T: the slack at the left ----------
  const cwOf = (v) => (r) => { const e = (v.visual.objects.columnWidth || []).find((x) => x.selector && x.selector.metadata === r && x.properties && x.properties.value); return e ? num(e.properties.value) : null; };
  const lay = (v) => { let x = 0; return v.visual.query.queryState.Values.projections.map((q) => { const w0 = cwOf(v)(q.queryRef) || 0, r = { ref: q.queryRef, x, w: w0 }; x += w0; return r; }).filter((c) => c.w >= 10); };
  const room = (v, sc) => v.position.width - (20 + 12) * sc, SC = 720 / 1080;   // (MX5, moved on purpose: the room less the vertical scrollbar's 12)
  const slack = (v, field, enW) => { const l = lay(v), last = l[l.length - 1], end = last ? last.x + last.w : 0; return v && last && /Row label: |\./.test(last.ref) && last.ref.includes(field) && Math.abs(last.w - enW) < 0.5 && end <= room(v, SC) + 0.5 && end >= room(v, SC) - 1.5; };
  const tt = at('p2fin', 'mxTasks'), ml = at('p2fin', 'mxMiles');
  chk(() => slack(tt, 'Task Name', 327), () => `T1. Fintech p3 tasks (1002 in 1098): the names at the right of the room, the slack at the left: ${tt && JSON.stringify(lay(tt))}`);
  chk(() => slack(ml, 'Milestone', 238), () => `T2. Fintech p3 milestones: the same: ${ml && JSON.stringify(lay(ml))}`);
  chk(() => tt && ml && lay(tt)[0].w >= 126 && lay(ml)[0].w >= 181 && lay(tt).slice(1, -1).every((c, i) => c.w === [104, 114, 107, 130, 94][i]), () => `T3. the slack goes to the leftmost column; the others keep their English widths: ${tt && JSON.stringify(lay(tt))}`);
  // ---------- K: the names at their English width, English's second column in view ----------
  const rt = at('p3ret', 'tblRetention'), rl = rt ? lay(rt) : [], rr = rt ? room(rt, SC) : 0, iN = rl.findIndex((c) => /Customer ID/.test(c.ref));
  chk(() => iN >= 0 && Math.abs(rl[iN].w - 93) < 0.5 && Math.abs(rl[iN].x + rl[iN].w - rr) < 0.5, () => `K1. RepeatIQ retention: the names keep their English 93 and end the view: ${JSON.stringify(rl)} room ${rr}`);
  chk(() => iN === 1 && /Cohort Member/.test(rl[0].ref) && rl[0].x === 0 && Math.abs(rl[0].w - (rr - 93)) < 0.5, () => `K2. English's second column (partly shown there) in view, at the width English showed of it: ${JSON.stringify(rl)}`);
  chk(() => rl.length === 3 && /Orders in Month/.test(rl[2].ref) && rl[2].x >= rr - 0.5 && Math.abs(rl[2].w - 177) < 0.5, () => `K3. only English's third column behind the scroll, at its width: ${JSON.stringify(rl)}`);
  // ---------- C: the agent card ----------
  const dan = at('p4card', 'cardDan'), style = dan && ((dan.visual.objects.referenceLabelLayout || []).find((e) => !e.selector || e.selector.id === 'default') || { properties: {} }).properties.style;
  chk(() => dan && lit(style) !== "'tabular'", () => `C1. the agent card keeps the layout its contact line is whole in (sentence; "tabular" cut it and still put the label at the left): ${JSON.stringify(dan && dan.visual.objects.referenceLabelLayout)}`);
  const tw = dan ? dan.visual.objects.referenceLabelTitle.filter((e) => e.properties.titleText).map((e) => TM.textWidth(String(lit(e.properties.titleText)).replace(/^'|'$/g, ''), 10)) : [];
  chk(() => tw.length === 4 && Math.max(...tw) - Math.min(...tw) <= TM.textWidth(' ', 10) + 0.01, () => `C2. its Arabic titles padded to one width (part 9's column): ${JSON.stringify(tw.map((x) => Math.round(x * 10) / 10))}`);
  const dl = at('p4card', 'donutLegend');
  chk(() => dl && fillOf(dl, 'Work.Calls Unanswered') === JSON.stringify(fill(3)), () => `L4. through the twin: the legend donut's Unanswered keeps its colour: ${dl && JSON.stringify(dl.visual.objects.dataPoint)}`);
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-mx4.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((x) => console.log('  - ' + x)); console.log(`FAIL  mx4  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  mx4  ${checks} checks`);
