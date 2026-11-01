import './test-env.mjs';
// 0.3.1 MX2 (the owner's D-1101-03: every difference of laptop part 8 fixed in 0.3.1; mcp/work/MX2.md; written red
// first on the merged base, 7e885a2d). Each fixture is made up in the shape of a real visual of the owner's public
// dashboards (the evidence branch evidence/0.3.1-shapes, c9a151d9: its cards and entries as the real files have them,
// made-up names, no data):
//   M1-M10 the matrices: RepeatIQ p2 lifecycle and AdventureWorks p1 top 10 (flat already: guards); Fintech p3 tasks
//          and milestones (per-level total entries with the row subtotals off), RepeatIQ p4 pricing and p5 refund risk
//          (row headers not wrapped): now flat; Fintech p3 team and p1 delivery (row levels): kept, offered flat (p1
//          with its blank rows, said lost); RepeatIQ p2 cohorts (a Columns field): kept
//   W1-W5  the tables: Fintech p1 watchlist's hidden column stays hidden; Fintech p3's converted task matrix (its
//          widths over its box only by two for fields no longer in it) has its key column in view; a plain wide table keeps
//          the English view (the key column at the box's right edge); the roadmap (no widths) named; one that fits as before
//   L1-L4  the legends: Call Center p1's two items that read the same once cut named first; Consumer Complaints p3's
//          legend titles named; a hidden legend not named; said as an estimate
//   N1-N5  one plain plan line each: decomposition tree, treemap, Power BI's own waterfall, scatter, map
//   node test-0.3.1-mx2.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), require = createRequire(import.meta.url);
const Mirror = require('../assets/js/report-mirror.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.stack || e).slice(0, 400) }; } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); };
const clone = (o) => JSON.parse(JSON.stringify(o));
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mx2-')));
process.env.DATAARCUS_ROOT = ROOT;
const L = (v) => ({ expr: { Literal: { Value: v } } }), S = (s) => L("'" + s + "'"), fill = (c) => ({ solid: { color: S(c) } });
const theme = (id) => ({ solid: { color: { expr: { ThemeDataColor: { ColorId: id, Percent: 0.1 } } } } });
const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);

// ---------- made-up fields ----------
const T = 'Work';
const col = (c, d) => Object.assign({ field: { Column: { Expression: { SourceRef: { Entity: T } }, Property: c } }, queryRef: T + '.' + c, nativeQueryRef: c }, d ? { displayName: d } : {});
const mea = (m, d) => Object.assign({ field: { Measure: { Expression: { SourceRef: { Entity: T } }, Property: m } }, queryRef: T + '.' + m, nativeQueryRef: m }, d ? { displayName: d } : {});
const agg = (fn, c) => ({ field: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: T } }, Property: c } }, Function: fn } }, queryRef: `${['Sum', 'Avg', 'CountNonNull', 'Min', 'Max'][fn]}(${T}.${c})`, nativeQueryRef: c });
const onData = (ref, props) => ({ properties: props, selector: { data: [{ dataViewWildcard: { matchingOption: 1 } }], metadata: ref } });
const widths = (ps, ws) => ps.map((p, i) => ({ properties: { value: L(ws[i] + 'D') }, selector: { metadata: p.queryRef } }));
const pivot = (rows, cols, vals, objects, extra) => Object.assign({ visualType: 'pivotTable', query: Object.assign({ queryState: Object.assign({ Rows: { projections: rows } }, cols.length ? { Columns: { projections: cols } } : {}, { Values: { projections: vals } }) }, { sortDefinition: { sort: [{ field: clone(rows[0].field), direction: 'Ascending' }] } }), objects }, extra || {});
const asJson = (v, name, box) => ({ name: name || 'm', position: Object.assign({ x: 20, y: 20, z: 1000, width: 600, height: 300 }, box || {}), visual: v });
// Fintech's matrices: stepped row headers, a 12-point font, the values' first card, totals off with per-level entries
const FIN_ROW = [{ properties: { steppedLayoutIndentation: L('10D'), fontSize: L('12D'), outlineStyle: L('0D') } }];
const FIN_VALUES = (ref) => [{ properties: { fontSize: L('12D'), bandedRowHeaders: L('false') } }, onData(ref, { backColor: fill('#CAC4D9') })];
const FIN_OFF = (level) => [{ properties: { rowSubtotals: L('false'), columnSubtotals: L('false'), perRowLevel: L('true'), rowSubtotalsPosition: S('Top') } }]
  .concat(level ? [{ properties: { levelSubtotalEnabled: L('true') }, selector: { metadata: level } }] : [], [{ properties: { fontColor: theme(1) }, selector: { id: 'Row' } }]);
const FIN_MORE = { blankRows: [{ properties: { showBlankRows: L('false') } }], general: [{ properties: { layout: S('Compact') } }], grid: [{ properties: { rowPadding: L('4D') } }], columnHeaders: [{ properties: { fontSize: L('12D'), bold: L('true') } }] };
function tasks(box) {   // Fintech p3 "Project Task Delivery": 1 row field, 6 values, 9 widths (2 for fields no longer there)
  const rows = [col('Task Name')], vals = [agg(3, 'Task Status'), agg(3, 'Priority'), agg(3, 'Owner'), agg(0, 'Hours'), agg(0, 'Budget'), mea('Completion')];
  return asJson(pivot(rows, [], vals, Object.assign({ rowHeaders: clone(FIN_ROW), values: FIN_VALUES(vals[0].queryRef).concat([onData(vals[1].queryRef, { fontColor: fill('#7D57DD') })]), subTotals: FIN_OFF(rows[0].queryRef),
    columnWidth: widths(rows.concat(vals), [180, 150, 120, 160, 110, 120, 160]).concat(widths([col('Old A'), col('Old B')], [138, 138])), columnFormatting: [{ properties: { alignment: S('Center') }, selector: { metadata: vals[0].queryRef } }] }, clone(FIN_MORE)),
  { expansionStates: [{ roles: ['Rows'], levels: [{ queryRefs: [rows[0].queryRef], isCollapsed: true }], root: {} }] }), 'mxTasks', box || { width: 1098, height: 360 });
}
function milestones() {   // Fintech p3 "Project Milestones": no per-level entry
  const rows = [col('Milestone')], vals = [agg(3, 'Phase'), agg(3, 'Owner'), agg(3, 'Status'), mea('Planned'), mea('Actual')];
  return asJson(pivot(rows, [], vals, Object.assign({ rowHeaders: clone(FIN_ROW), values: FIN_VALUES(vals[2].queryRef), subTotals: FIN_OFF(null), columnWidth: widths(rows.concat(vals), [220, 180, 180, 160, 200, 206]) }, clone(FIN_MORE))), 'mxMiles', { width: 1098 });
}
const repeatiq = (name, icon) => {   // RepeatIQ p4 pricing / p5 refund risk: row headers not wrapped, a colour scale and icons
  const rows = [col('Product')], vals = [mea('Net Revenue'), mea('Units'), mea('Refund Rate'), mea('Margin')];
  return asJson(pivot(rows, [], vals, { rowHeaders: [{ properties: { wordWrap: L('false') } }], subTotals: [{ properties: { rowSubtotals: L('false'), columnSubtotals: L('false') } }],
    values: [onData(vals[0].queryRef, { backColor: fill('#3DB6B2') })].concat(icon ? [onData(vals[2].queryRef, { icon: { kind: 'Icon', layout: L("'Before'"), verticalAlignment: L("'Top'"), value: S('CircleRed') } })] : [], icon === 'wrap' ? [{ properties: { wordWrap: L('true') } }] : []),
    columnWidth: widths(rows.concat(vals.slice(0, 3)), [140, 120, 110, 105]), grid: [{ properties: { rowPadding: L('2D') } }] }), name, { width: 544 });
};
function grouped(blank) {   // Fintech p3 team (blank false) / p1 delivery (blank rows shown, a grand total at the top)
  const rows = [col('Department'), col('Project')], vals = [agg(3, 'Status'), agg(3, 'Risk Level'), mea('Planned Budget'), mea('Budget Variance')];
  return asJson(pivot(rows, [], vals, Object.assign({ rowHeaders: clone(FIN_ROW), values: FIN_VALUES(vals[0].queryRef),
    subTotals: blank ? [{ properties: { rowSubtotals: L('true'), columnSubtotals: L('false'), perRowLevel: L('true'), rowSubtotalsPosition: S('Top') } }, { properties: { levelSubtotalEnabled: L('false') }, selector: { metadata: rows[1].queryRef } }, { properties: { levelSubtotalEnabled: L('false') }, selector: { metadata: rows[0].queryRef } }, { properties: { fontColor: theme(1) }, selector: { id: 'Row' } }] : FIN_OFF(rows[1].queryRef),
    columnWidth: widths(rows.concat(vals), [160, 200, 150, 140, 160, 160]) }, clone(FIN_MORE), { blankRows: [{ properties: { showBlankRows: L(blank ? 'true' : 'false') } }] })), blank ? 'mxDelivery' : 'mxTeam', { width: blank ? 1035 : 714 });
}

try {
  // ---------- M: the matrices ----------
  {
    const lifecycle = asJson(pivot([col('Stage')], [], [mea('Customers'), mea('Share'), agg(3, 'Segment'), agg(3, 'Channel'), mea('Conversion')], { subTotals: [{ properties: { rowSubtotals: L('false'), columnSubtotals: L('false') } }], general: [{ properties: { layout: S('Compact') } }], columnWidth: widths([col('Stage')], [96]) }));
    const top10 = asJson(pivot([col('Product Name')], [], [mea('Sales'), mea('Orders'), mea('Return Rate')], { subTotals: [{ properties: { columnSubtotals: L('false'), rowSubtotals: L('false') } }], values: [onData(T + '.Sales', { backColor: fill('#9BC2E6') })], columnHeaders: [{ properties: { bold: L('true') } }] }, { expansionStates: [{ roles: ['Rows'], levels: [{ queryRefs: [T + '.Product Name'], isCollapsed: true }], root: {} }] }));
    const flat = (label, j) => { const f = get(() => Mirror.flatMatrix(j)); chk(() => f.ok === true, () => `${label}: written as a table (flat): ${JSON.stringify(f)}`); };
    flat('M1. RepeatIQ p2 lifecycle funnel (guard)', lifecycle);
    flat('M2. AdventureWorks p1 top 10 products (guard)', top10);
    flat('M3. Fintech p3 project task delivery (per-level total entries, the row subtotals off)', tasks());
    flat('M4. Fintech p3 project milestones (a style entry for the rows\' totals, the row subtotals off)', milestones());
    flat('M5. RepeatIQ p4 product pricing (row headers not wrapped)', repeatiq('mxPricing', false));
    flat('M6. RepeatIQ p5 refund risk (row headers not wrapped, its values set to wrap)', repeatiq('mxRefund', 'wrap'));
    const t3 = get(() => Mirror.mirrorVisual(tasks(), 1280, {}).json.visual), keys = t3 && t3.objects ? Object.keys(t3.objects) : [];
    chk(() => t3.visualType === 'tableEx' && !keys.some((k) => ['subTotals', 'rowHeaders', 'blankRows'].includes(k)) && lit(((t3.objects.total || [])[0] || { properties: {} }).properties.totals) === 'false',
      () => `M7. the tasks matrix as a table: no matrix-only card, its total off as the matrix showed it: ${JSON.stringify([t3 && t3.visualType, keys, t3 && t3.objects && t3.objects.total])}`);
    const off = (label, j, re) => { const f = get(() => Mirror.flatMatrix(j)), g = get(() => Mirror.flatTable(j)); chk(() => f.ok === false && re.test(String(f.why)) && g.ok === true, () => `${label}: kept a matrix (${re}), offered flat: ${JSON.stringify([f, g.ok, g.why])}`); };
    off('M8. Fintech p3 project delivery team (two row levels)', grouped(false), /row levels/);
    off('M9. Fintech p1 delivery task matrix (two row levels, blank rows shown)', grouped(true), /row levels/);
    chk(() => /blank rows/.test(Mirror.FLAT_LOST) && /blank rows/.test(Mirror.KIND_WHAT.matrixFlattened), () => `M9b. written flat, its blank rows between groups are said lost: ${Mirror.FLAT_LOST}`);
    const cohorts = asJson(pivot([col('Cohort Month')], [col('Months Since')], [mea('Retention'), mea('Customers')], { columnWidth: widths([col('Cohort Month')], [90]) }));
    const c = get(() => Mirror.flatMatrix(cohorts));
    chk(() => c.ok === false && /Columns field/.test(c.why), () => `M10. RepeatIQ p2 monthly cohorts (a Columns field): kept a matrix, said why (guard): ${JSON.stringify(c)}`);
  }

  // ---------- W, L, N: a twin project with the real shapes ----------
  {
    const D = path.join(ROOT, 'w'), DEF = path.join(D, 'Twin Sales.Report/definition');
    fs.cpSync(path.join(HERE, 'fixtures/twin-project'), D, { recursive: true });
    const cols = [['Department', 'string'], ['Project', 'string'], ['Task Name', 'string'], ['Task Status', 'string'], ['Priority', 'string'], ['Owner', 'string'], ['Hours', 'double'], ['Budget', 'double'], ['Phase', 'string'], ['Status', 'string'],
      ['Planned Start', 'dateTime'], ['Planned End', 'dateTime'], ['Actual Start', 'dateTime'], ['Actual End', 'dateTime'], ['Project ID', 'string'], ['Risk Level', 'string'], ['Segment', 'string'], ['Size Tier', 'string'], ['History', 'string'], ['Region', 'string'], ['Category', 'string'], ['Lat', 'double'], ['Lon', 'double'], ['City', 'string']];
    const bimF = path.join(D, 'Twin Sales.SemanticModel/model.bim'), bim = rd(bimF);
    bim.model.tables.push({ name: T, columns: cols.map(([name, dataType]) => ({ name, dataType, sourceColumn: name })), measures: ['Completion', 'Days Late', 'Risk Score', 'Calls Answered', 'Calls Unanswered', 'Complaints', 'Revenue', 'Profit'].map((m) => ({ name: m, expression: '1' })) }); wr(bimF, bim);
    const pj = path.join(DEF, 'pages/pages.json'), pages = rd(pj);
    const VS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
    const page = (id, name) => { pages.pageOrder.push(id); wr(path.join(DEF, 'pages', id, 'page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: id, displayName: name, displayOption: 'FitToPage', width: 1280, height: 720 }); };
    const put = (pg, j) => wr(path.join(DEF, 'pages', pg, 'visuals', j.name, 'visual.json'), Object.assign({ $schema: VS }, j, { position: Object.assign({ tabOrder: j.position.z || 1000 }, j.position) }));
    // the tables: the watchlist (a hidden first column, 4 wide), the converted wide matrix, a plain wide table, the roadmap, one that fits
    page('p6tables', 'Tables');
    const wl = [col('Department'), col('Project'), mea('Days Late'), mea('Risk Score')];
    put('p6tables', { name: 'tblWatch', position: { x: 760, y: 20, z: 1000, width: 490, height: 300 }, visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: wl } } },
      objects: { columnWidth: widths(wl, [4, 187, 155.31992554168414, 106.62224457068305]), values: [{ properties: { wordWrap: L('false') } }], total: [{ properties: { totals: L('false') } }], columnHeaders: [{ properties: { backColor: theme(2), fontColor: theme(0), alignment: S('Center') } }] } } });
    put('p6tables', Object.assign(tasks({ x: 20, y: 340, z: 2000, width: 1098, height: 360 }), {}));
    const wide = [col('Project ID'), col('Phase'), col('Owner'), col('Status'), mea('Budget'), mea('Completion')];
    put('p6tables', { name: 'tblWide', position: { x: 20, y: 20, z: 3000, width: 700, height: 300 }, visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: wide } } }, objects: { columnWidth: widths(wide, [200, 200, 200, 200, 120, 120]) } } });
    page('p7roadmap', 'Roadmap');
    const road = [col('Planned Start'), agg(4, 'Planned End'), mea('Completion'), col('Actual Start'), col('Actual End'), col('Project ID'), col('Status')];
    put('p7roadmap', { name: 'tblRoad', position: { x: 30, y: 300, z: 1000, width: 765, height: 360 }, visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: road } } }, objects: {} } });
    const fits = [col('Phase'), col('Owner')];
    put('p7roadmap', { name: 'tblFits', position: { x: 900, y: 300, z: 2000, width: 320, height: 200 }, visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: fits } } }, objects: { columnWidth: widths(fits, [120, 100]) } } });
    // the legends: Call Center p1's small legend donut (two measures under their own short names), its hidden-legend
    // donut, Consumer Complaints p3's donuts (a category legend with its title)
    page('p8legends', 'Legends');
    put('p8legends', { name: 'dnLegend', position: { x: 548, y: 20, z: 1000, width: 196, height: 40 }, visual: { visualType: 'donutChart', query: { queryState: { Y: { projections: [mea('Calls Answered', 'Answered'), mea('Calls Unanswered', 'Unanswered')] } } },
      objects: { legend: [{ properties: { position: S('TopCenter') } }], labels: [{ properties: { show: L('false') } }], dataPoint: [{ properties: {} }] } } });
    put('p8legends', { name: 'dnHidden', position: { x: 548, y: 80, z: 2000, width: 151, height: 129 }, visual: { visualType: 'donutChart', query: { queryState: { Y: { projections: [mea('Calls Answered'), mea('Calls Unanswered')] } } },
      objects: { legend: [{ properties: { show: L('false') } }], labels: [{ properties: { show: L('false') } }] } } });
    put('p8legends', { name: 'dnHistory', position: { x: 977, y: 498, z: 3000, width: 291, height: 201 }, visual: { visualType: 'donutChart', query: { queryState: { Category: { projections: [col('History')] }, Y: { projections: [mea('Complaints')] } } }, objects: { labels: [{ properties: { show: L('true') } }] } } });
    put('p8legends', { name: 'dnTier', position: { x: 660, y: 498, z: 4000, width: 309, height: 201 }, visual: { visualType: 'donutChart', query: { queryState: { Category: { projections: [col('Size Tier')] }, Y: { projections: [mea('Complaints')] } } }, objects: { labels: [{ properties: { show: L('true') } }] } } });
    // what Power BI cannot mirror (RepeatIQ p3, p4; AdventureWorks p5): a decomposition tree, a treemap, Power BI's own
    // waterfall, a scatter chart, a map
    page('p9kinds', 'Kinds');
    put('p9kinds', { name: 'decoTree', position: { x: 20, y: 20, z: 1000, width: 600, height: 300 }, visual: { visualType: 'decompositionTreeVisual', query: { queryState: { Analyze: { projections: [mea('Revenue')] }, ExplainBy: { projections: [col('Category'), col('Region')] } } } } });
    put('p9kinds', { name: 'treeMap', position: { x: 640, y: 20, z: 2000, width: 600, height: 300 }, visual: { visualType: 'treemap', query: { queryState: { Group: { projections: [col('Category')] }, Values: { projections: [mea('Revenue')] } } } } });
    put('p9kinds', { name: 'wfNative', position: { x: 20, y: 340, z: 3000, width: 400, height: 300 }, visual: { visualType: 'waterfallChart', query: { queryState: { Category: { projections: [col('Category')] }, Y: { projections: [mea('Profit')] } } } } });
    put('p9kinds', { name: 'scatter', position: { x: 440, y: 340, z: 4000, width: 400, height: 300 }, visual: { visualType: 'scatterChart', query: { queryState: { Category: { projections: [col('City')] }, X: { projections: [mea('Revenue')] }, Y: { projections: [mea('Profit')] } } } } });
    put('p9kinds', { name: 'cityMap', position: { x: 860, y: 340, z: 5000, width: 400, height: 300 }, visual: { visualType: 'map', query: { queryState: { Category: { projections: [col('City')] }, Size: { projections: [mea('Revenue')] } } } } });
    wr(pj, pages);

    const { planTwin, twinTree } = await import('./lib/arabic-twin.mjs');
    const labels = { 'field:Work.Department': 'القسم', 'field:Work.Project': 'المشروع', 'field:Work.Days Late': 'أيام التأخير المتوقعة', 'field:Work.Risk Score': 'مستوى المخاطر',
      'field:Work.History': 'سجل الإجراءات التنظيمية', 'field:Work.Size Tier': 'فئة حجم الشركة', 'field:Work.Complaints': 'إجمالي الشكاوى',
      'fieldAt:p8legends/dnLegend/Work.Calls Answered': 'المكالمات المجابة', 'fieldAt:p8legends/dnLegend/Work.Calls Unanswered': 'المكالمات غير المجابة',
      'field:Work.Planned Start': 'تاريخ البدء المخطط', 'Max(Work.Planned End)': 'x', 'field:Max(Work.Planned End)': 'تاريخ الانتهاء المخطط', 'field:Work.Completion': 'نسبة الإنجاز', 'field:Work.Actual Start': 'تاريخ البدء الفعلي', 'field:Work.Actual End': 'تاريخ الانتهاء الفعلي', 'field:Work.Project ID': 'رقم المشروع', 'field:Work.Status': 'حالة المشروع' };
    delete labels['Max(Work.Planned End)'];
    const P = get(() => planTwin({ path: 'w/Twin Sales.pbip', arabicMonth: false, labels })), files = get(() => twinTree(P).files);
    const at = (pg, n) => get(() => JSON.parse(String(files.find((f) => f.path.endsWith(`/pages/${pg}/visuals/${n}/visual.json`)).data)));
    const cwOf = (v) => (r) => { const e = (v.visual.objects.columnWidth || []).find((x) => x.selector && x.selector.metadata === r); return e ? parseFloat(lit(e.properties.value)) : null; };
    chk(() => Array.isArray(files) && files.length > 10, () => `W0. the twin builds: ${JSON.stringify(P && P.threw || files && files.threw).slice(0, 400)}`);
    // W1 the watchlist: no column narrower than 10 in the original is widened in the twin
    const w1 = at('p6tables', 'tblWatch'), w1w = w1 && w1.visual ? w1.visual.query.queryState.Values.projections.map((p) => [p.queryRef, cwOf(w1)(p.queryRef)]) : [];
    chk(() => w1w.length >= 4 && w1w.filter(([r]) => /Department/.test(r)).every(([, x]) => x != null && x < 10),
      () => `W1. Fintech p1 watchlist: the column the English hides (4 wide) stays hidden in the twin (no sliver «القسم» at its edge): ${JSON.stringify(w1w)}`);
    // W2, W3 the wide ones keep the English view: from the left, the English visible columns reversed, the key column in the box
    // (the key column as the reader sees it: the column itself, or the twin's row label over it; a hidden one, narrower than 10, skipped)
    const inView = (v, key) => { const ps = v.visual.query.queryState.Values.projections, w = cwOf(v); let x = 0; for (const p of ps) { const pw = w(p.queryRef) || 0; if (pw >= 10 && (p.queryRef === key || (p.field.Measure && p.field.Measure.Property === 'Row label: ' + key.split('.')[1]))) return x + pw <= v.position.width - 36; x += pw; } return false; };
    const w2 = at('p6tables', 'mxTasks');
    chk(() => w2 && w2.visual.visualType === 'tableEx' && inView(w2, T + '.Task Name'), () => `W2. Fintech p3 task delivery (a matrix whose widths sum over its box, two of them for fields no longer in it; now a table that fits): its key column Task Name in view at the box's right edge: ${JSON.stringify(w2 && w2.visual && w2.visual.query.queryState.Values.projections.map((p) => [p.queryRef, cwOf(w2)(p.queryRef)]))}`);
    const w3 = at('p6tables', 'tblWide');
    chk(() => w3 && inView(w3, T + '.Project ID'), () => `W3. a table wider than its box by its own widths: its key column in view: ${JSON.stringify(w3 && w3.visual.query.queryState.Values.projections.map((p) => p.queryRef))}`);
    const wide2 = get(() => P.answer.cannot.find((x) => x.what === 'tables wider than their box'));
    chk(() => wide2 && wide2.where.some((w) => /^p7roadmap\/tblRoad/.test(w)) && !wide2.where.some((w) => /tblWide|mxTasks|tblFits/.test(w)), () => `W4. the roadmap (no widths of its own) named; the ones kept in view and the one that fits not: ${JSON.stringify(wide2)}`);
    const kept = get(() => (P.answer.keptInView || []).map((x) => x.visual));
    chk(() => Array.isArray(kept) && kept.join() === 'tblWide' && at('p7roadmap', 'tblFits').visual.query.queryState.Values.projections.map((p) => p.queryRef).join() === [T + '.Owner', T + '.Phase'].join(),
      () => `W5. the plan says which tables keep the English view (keptInView); a table that fits is reversed as before: ${JSON.stringify(kept)}`);
    // L the legends
    const lg = get(() => P.answer.cannot.find((x) => x.what === 'legends that may be cut'));
    chk(() => lg && /read the same/.test(lg.where.find((w) => /dnLegend/.test(w)) || '') && /المكالمات المجابة/.test(lg.where.find((w) => /dnLegend/.test(w))), () => `L1. Call Center p1: the legend's two items that read the same once cut are named, with their texts: ${JSON.stringify(lg)}`);
    chk(() => lg && lg.where.some((w) => /dnHistory/.test(w) && /title/.test(w)) && lg.where.some((w) => /dnTier/.test(w) && /title/.test(w)), () => `L2. Consumer Complaints p3: both legend titles named: ${JSON.stringify(lg && lg.where)}`);
    chk(() => lg && !lg.where.some((w) => /dnHidden/.test(w)), () => `L3. a donut with its legend off is not named: ${JSON.stringify(lg && lg.where)}`);
    chk(() => lg && /estimate/.test(lg.why) && /shorter/.test(lg.why) && lg.where.indexOf(lg.where.find((w) => /read the same/.test(w))) === 0, () => `L4. said as an estimate with what to do, the items that read the same first: ${JSON.stringify(lg)}`);
    // N one line each
    const line = (re) => get(() => P.answer.cannot.find((x) => re.test(x.what)));
    [['N1. a decomposition tree', /decomposition tree/, 'decoTree', /left to right/], ['N2. a treemap', /treemap/, 'treeMap', /tiles/], ['N3. Power BI\'s own waterfall', /waterfall/, 'wfNative', /left to right/],
      ['N4. a scatter chart', /scatter/, 'scatter', /axes/], ['N5. a map', /^maps?\b/, 'cityMap', /moved only/]].forEach(([label, re, name, why]) => {
      const x = line(re); chk(() => x && x.where.some((w) => w === 'p9kinds/' + name) && why.test(x.why) && !/other visuals/.test(x.what), () => `${label}: one plain line naming it: ${JSON.stringify(x)}`); });
  }
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-mx2.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  mx2  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  mx2  ${checks} checks`);
