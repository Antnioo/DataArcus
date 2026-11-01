import './test-env.mjs';
// 0.3.1 MX1 (the owner, 1 Nov, on the Arabic twins of his dashboards: "the days name it's on the left ... the patient id
// in page 2 in er still shows it on the left"; D-1029-03, D-1027-12; mcp/work/MX1.md; written red first on 7c54e918).
// Made-up fixtures in the real shapes only (the twin project's copy with a made-up patients table): no data, no
// employer or client file.
//   U1-U3  the engine: the ER shape (one Rows field, no Columns field, 8 values) is written as a table
//   K1-K7  the shapes that stay matrices, each with its why (a Columns field; two Rows levels with subtotals; values on
//          rows; a total row at the top; row headers with their own font size; blank rows shown), and the switch off
//   A1-A11 the written twin of a project with the ER shape: a table, Patient ID at the right, every value, label,
//          width, colour, sort and style kept, no matrix-only property
//   P1-P4  the plan names the converted visual and its sentence; the heatmap kept a matrix with MATRIX_SAID; the
//          approval page names it
//   B1-B6  the heatmap lab (mcp/lab/heatmap-names.mjs): an empty folder only, validator 0 errors, B1-B3 as described
//   node test-0.3.1-mx1.mjs
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
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mx1-')));
process.env.DATAARCUS_ROOT = ROOT;
const L = (v) => ({ expr: { Literal: { Value: v } } }), S = (s) => L("'" + s + "'"), fill = (c) => ({ solid: { color: S(c) } });
const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);

// ---------- the made-up shapes ----------
const T = 'Patients';
const col = (c, d) => Object.assign({ field: { Column: { Expression: { SourceRef: { Entity: T } }, Property: c } }, queryRef: T + '.' + c, nativeQueryRef: c }, d ? { displayName: d } : {});
const agg = (fn, c, name, d) => ({ field: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: T } }, Property: c } }, Function: fn } }, queryRef: `${name}(${T}.${c})`, nativeQueryRef: d, displayName: d });
const VALUES = [agg(3, 'Admission Date', 'Min', 'Date'), agg(3, 'Full Name', 'Min', 'Full Name'), agg(3, 'Gender', 'Min', 'Gender'), agg(3, 'Race', 'Min', 'Race'), agg(0, 'Age', 'Sum', 'Age'),
  agg(3, 'Department Referral', 'Min', 'Department Referral'), agg(1, 'Satisfaction Score', 'Avg', 'Satisfaction Score'), agg(1, 'Wait Time', 'Avg', 'Wait Time')];
const WAIT = VALUES[7];
// ER page 2's patient list: Rows = Patient ID, no Columns, 8 values, no subtotals visible
function erMatrix() {
  return { visualType: 'pivotTable',
    query: { queryState: { Rows: { projections: [Object.assign(col('Patient ID'), { active: true })] }, Values: { projections: clone(VALUES) } }, sortDefinition: { sort: [{ field: clone(col('Patient ID').field), direction: 'Ascending' }], isDefaultSort: true } },
    objects: {
      general: [{ properties: { layout: S('Compact') } }],
      rowHeaders: [{ properties: { fontColor: fill('#1F2A44'), backColor: fill('#F4F6FA'), fontSize: L('10D'), stepped: L('true'), showExpandCollapseButtons: L('false') } }],
      columnHeaders: [{ properties: { fontColor: fill('#FFFFFF'), backColor: fill('#1F2A44'), bold: L('true'), fontSize: L('10D'), wordWrap: L('true'), autoExpand: L('false') } }],
      values: [{ properties: { fontSize: L('10D'), fontColorPrimary: fill('#222222'), backColorPrimary: fill('#FFFFFF'), backColorSecondary: fill('#F7F7F7'), bandedRowHeaders: L('false'), valuesOnRow: L('false') } },
        { properties: { backColor: { solid: { color: { expr: { FillRule: { Input: clone(WAIT.field), FillRule: { linearGradient2: { min: { color: { Literal: { Value: "'#FFFFFF'" } } }, max: { color: { Literal: { Value: "'#E07A5F'" } } }, nullColoringStrategy: { strategy: { Literal: { Value: "'asZero'" } } } } } } } } } } },
          selector: { data: [{ dataViewWildcard: { matchingOption: 1 } }], metadata: WAIT.queryRef } }],
      grid: [{ properties: { gridHorizontal: L('true'), gridHorizontalColor: fill('#E5E7EB'), rowPadding: L('3D') } }],
      subTotals: [{ properties: { rowSubtotals: L('false'), columnSubtotals: L('false') } }],
      columnWidth: [{ properties: { value: L('110D') }, selector: { metadata: T + '.Patient ID' } }, { properties: { value: L('150D') }, selector: { metadata: VALUES[1].queryRef } }],
      columnFormatting: [{ properties: { alignment: S('Center'), styleSubtotals: L('true'), styleValues: L('true') }, selector: { metadata: VALUES[6].queryRef } }] },
    visualContainerObjects: { title: [{ properties: { show: L('true'), text: S('Patient list'), fontSize: L('12D') } }], background: [{ properties: { show: L('true'), color: fill('#FFFFFF') } }], border: [{ properties: { show: L('true'), radius: L('8D') } }] } };
}
const er = (name, x, extra) => Object.assign({ name, position: { x, y: 80, z: 1000, width: 1000, height: 560, tabOrder: 1000 }, visual: erMatrix() }, extra || {});
// the heatmap: Rows = weekday, Columns = hour, one value
const heat = () => ({ visualType: 'pivotTable', query: { queryState: { Rows: { projections: [col('Weekday')] }, Columns: { projections: [col('Hour')] }, Values: { projections: [agg(0, 'Calls', 'Sum', 'Calls')] } } }, objects: {}, visualContainerObjects: {} });
const asVisual = (v, name) => ({ name: name || 'm', position: { x: 100, y: 100, z: 1000, width: 600, height: 300 }, visual: v });
const mv = (v, o) => Mirror.mirrorVisual(asVisual(v), 1280, o || {});

try {
  // ---------- U: the engine ----------
  {
    const r = get(() => mv(erMatrix())), v = r.json && r.json.visual, ps = get(() => v.query.queryState.Values.projections);
    chk(() => typeof Mirror.flatMatrix === 'function' && Mirror.flatMatrix(asVisual(erMatrix())).ok === true, () => `U1. Mirror.flatMatrix says the ER shape is flat: ${JSON.stringify(typeof Mirror.flatMatrix === 'function' ? Mirror.flatMatrix(asVisual(erMatrix())) : 'no flatMatrix')}`);
    chk(() => r.kind === 'matrixAsTable' && v.visualType === 'tableEx' && !v.query.queryState.Rows && Array.isArray(ps) && ps.length === 9 && ps[8].queryRef === T + '.Patient ID' && ps[8].active === undefined,
      () => `U2. mirrorVisual writes it as a table: kind ${r.kind}, ${v && v.visualType}, Values ${JSON.stringify(Array.isArray(ps) ? ps.map((p) => p.queryRef) : ps)}`);
    chk(() => ps.slice(0, 8).map((p) => p.queryRef).join() === VALUES.map((p) => p.queryRef).reverse().join() && Mirror.KIND_WHAT.matrixAsTable && /written as a table so its first column reads on the right: Power BI's matrix has no right-to-left setting/.test(Mirror.KIND_WHAT.matrixAsTable),
      () => `U3. the 8 values reversed before Patient ID; KIND_WHAT says the sentence: ${JSON.stringify(Mirror.KIND_WHAT.matrixAsTable)}`);
  }

  // ---------- K: the shapes that stay matrices ----------
  {
    const kept = (label, v, re) => { const f = get(() => Mirror.flatMatrix(asVisual(v))), r = get(() => mv(v));
      chk(() => f.ok === false && re.test(String(f.why)) && r.kind === 'matrix' && r.json.visual.visualType === 'pivotTable', () => `${label}: kept a matrix with its why (${re}): ${JSON.stringify(f)} kind ${r.kind}`); };
    kept('K1. a Columns field (the heatmap)', heat(), /Columns field|columns/i);
    const two = erMatrix(); two.query.queryState.Rows.projections.unshift(col('Department Referral')); two.objects.subTotals = [{ properties: { rowSubtotals: L('true') } }];
    kept('K2. two Rows levels with subtotals', two, /row levels/);
    const onRows = erMatrix(); onRows.objects.values[0].properties.valuesOnRow = L('true');
    kept('K3. values on rows', onRows, /values.*rows/i);
    const top = erMatrix(); top.objects.subTotals = [{ properties: { rowSubtotals: L('true'), rowSubtotalsPosition: S('Top') } }];
    kept('K4. a total row at the top', top, /top/);
    const font = erMatrix(); font.objects.rowHeaders[0].properties.fontSize = L('14D');
    kept('K5. row headers with their own font size', font, /row headers/);
    const blank = erMatrix(); blank.objects.blankRows = [{ properties: { showBlankRows: L('true') } }];
    kept('K6. blank rows shown', blank, /blank rows/);
    const off = get(() => mv(erMatrix(), { matrixAsTable: false }));
    chk(() => off.kind === 'matrix' && off.json.visual.visualType === 'pivotTable', () => `K7. guard: opts.matrixAsTable false keeps it a matrix: ${off.kind}`);
  }

  // ---------- A, P: the twin of a project with the ER shape ----------
  {
    const D = path.join(ROOT, 'a'), DEF = path.join(D, 'Twin Sales.Report/definition'), PG = path.join(DEF, 'pages/p4patients');
    fs.cpSync(path.join(HERE, 'fixtures/twin-project'), D, { recursive: true });
    const bimF = path.join(D, 'Twin Sales.SemanticModel/model.bim'), bim = rd(bimF);
    bim.model.tables.push({ name: T, columns: [['Patient ID', 'string'], ['Admission Date', 'dateTime'], ['Full Name', 'string'], ['Gender', 'string'], ['Race', 'string'], ['Age', 'int64'], ['Department Referral', 'string'], ['Satisfaction Score', 'int64'], ['Wait Time', 'int64'], ['Weekday', 'string'], ['Hour', 'int64'], ['Calls', 'int64']].map(([name, dataType]) => ({ name, dataType, sourceColumn: name })) });
    wr(bimF, bim);
    const pj = path.join(DEF, 'pages/pages.json'), pages = rd(pj); pages.pageOrder.push('p4patients'); wr(pj, pages);
    wr(path.join(PG, 'page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: 'p4patients', displayName: 'Patients', displayOption: 'FitToPage', width: 1280, height: 720 });
    const VS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
    const orig = Object.assign({ $schema: VS }, er('mxPatients', 40));
    wr(path.join(PG, 'visuals/mxPatients/visual.json'), orig);
    wr(path.join(PG, 'visuals/mxHeat/visual.json'), { $schema: VS, name: 'mxHeat', position: { x: 1060, y: 80, z: 2000, width: 200, height: 300, tabOrder: 2000 }, visual: heat() });
    const Plans = await import('./lib/plans.mjs'), { register } = await import('./tools/create_arabic_twin.mjs'), W = await import('./lib/approval-window.mjs');
    let handler = null; register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = h; } }, {});
    const call = async (a) => { const r = await handler(a), t = (r.content || []).map((c) => c.text).join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* a refusal's words */ } return { err: !!r.isError, t, j }; };
    const labels = { 'field:Patients.Patient ID': 'رقم المريض', ['field:' + VALUES[1].queryRef]: 'الاسم الكامل', ['field:' + WAIT.queryRef]: 'وقت الانتظار', 'title:p4patients/mxPatients': 'قائمة المرضى' };
    const a = { path: 'a/Twin Sales.pbip', arabicMonth: false, labels };
    const p = await call(a), id = p.j && p.j.plan && p.j.plan.planId;
    // P: the plan and the approval page
    const m = get(() => p.j.mirrors.find((x) => x.kind === 'matrixAsTable'));
    chk(() => m && m.count === 1 && /written as a table so its first column reads on the right/.test(m.what) && Array.isArray(m.where) && m.where.join() === 'p4patients/mxPatients',
      () => `P1. the plan's mirrors name the converted matrix and say why: ${JSON.stringify(m)}${p.err ? ' ' + p.t.slice(0, 300) : ''}`);
    const cm = get(() => p.j.cannot.find((x) => x.what === 'matrices'));
    chk(() => cm && /has no right-to-left setting/.test(cm.why) && cm.where.length === 1 && /^p4patients\/mxHeat \(.*Columns field/.test(cm.where[0]),
      () => `P2. the heatmap (a Columns field) stays a matrix, said with MATRIX_SAID and its own why; the converted one not listed there: ${JSON.stringify(cm)}`);
    const html = get(() => { const pl = Plans.planOf(id); return W.approvalHtml({ id, kind: pl.kind, writes: pl.writes }, W.summary(pl.kind, pl.data)); });
    const un = (s) => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    chk(() => typeof html === 'string' && /Matrices written as tables|المصفوفات المكتوبة جداول/.test(un(html)) && /mxPatients/.test(un(html)) && /قائمة المرضى|Patient list/.test(un(html)),
      () => `P3. the approval page names the converted matrix (its page, its name and title): ${typeof html === 'string' ? (un(html).match(/.{0,200}(as tables|جداول).{0,300}/) || ['not found'])[0] : JSON.stringify(html)}`);
    chk(() => /كُتبت جدولًا ليُقرأ عمودها الأول من اليمين/.test(un(html)), () => 'P4. the approval page says it in Arabic too');
    if (id) Plans.approve(id, 'user-in-browser');
    const w = id ? await call(Object.assign({}, a, { planId: id })) : p;
    const AR = path.join(D, 'Twin Sales AR.Report/definition/pages/p4patients/visuals');
    const tw = get(() => rd(path.join(AR, 'mxPatients/visual.json'))), v = tw && tw.visual, ps = get(() => v.query.queryState.Values.projections);
    chk(() => !w.err && v && v.visualType === 'tableEx', () => `A1. the written twin's patient list is a table: ${w.err ? w.t.slice(0, 400) : v && v.visualType}`);
    // the visible last column: Patient ID itself, or the twin's "Row label" measure over it (a table led by a text column)
    const last = Array.isArray(ps) ? ps[ps.length - 1] : null, rl = last && last.field && last.field.Measure && /Patient ID/.test(last.field.Measure.Property);
    chk(() => last && (last.queryRef === T + '.Patient ID' || rl) && last.displayName === 'رقم المريض', () => `A2. Patient ID is the last column (at the right once reversed), named رقم المريض: ${JSON.stringify(last)}`);
    const refs = Array.isArray(ps) ? ps.map((x) => x.queryRef) : [];
    chk(() => VALUES.every((x) => refs.includes(x.queryRef)) && refs.filter((r) => VALUES.some((x) => x.queryRef === r)).join() === VALUES.map((x) => x.queryRef).reverse().join(),
      () => `A3. every value field kept, in reverse order: ${JSON.stringify(refs)}`);
    const dn = (r) => (ps.find((x) => x.queryRef === r) || {}).displayName;
    chk(() => dn(VALUES[1].queryRef) === 'الاسم الكامل' && dn(WAIT.queryRef) === 'وقت الانتظار' && dn(VALUES[2].queryRef) === 'Gender', () => `A4. the approved labels kept per field (an unlabelled one as in English): ${JSON.stringify(ps && ps.map((x) => x.displayName))}`);
    const cw = get(() => v.objects.columnWidth), wOf = (r) => { const e = (cw || []).find((x) => x.selector && x.selector.metadata === r); return e ? lit(e.properties.value) : undefined; };
    chk(() => wOf(VALUES[1].queryRef) === '150D' && (wOf(T + '.Patient ID') === '110D' || (rl && wOf(last.queryRef) === '110D')), () => `A5. the column widths carried (the visible Patient ID keeps its 110): ${JSON.stringify(cw)}`);
    const cond = get(() => v.objects.values.find((e) => e.selector && e.selector.metadata === WAIT.queryRef));
    chk(() => cond && cond.properties.backColor.solid.color.expr.FillRule && JSON.stringify(cond.selector.data) === JSON.stringify([{ dataViewWildcard: { matchingOption: 1 } }]), () => `A6. the conditional colour on Wait Time carried: ${JSON.stringify(v && v.objects && v.objects.values)}`);
    chk(() => JSON.stringify(v.query.sortDefinition) === JSON.stringify(orig.visual.query.sortDefinition), () => `A7. the sort carried: ${JSON.stringify(v && v.query.sortDefinition)}`);
    const pr = (card) => ((v.objects[card] || []).find((e) => !e.selector) || {}).properties || {};
    chk(() => lit(pr('columnHeaders').bold) === 'true' && lit(pr('columnHeaders').fontColor.solid.color) === "'#FFFFFF'" && lit(pr('values').fontSize) === '10D' && lit(pr('values').backColorSecondary.solid.color) === "'#F7F7F7'"
      && lit(pr('grid').rowPadding) === '3D' && lit(v.visualContainerObjects.border[0].properties.radius) === '8D' && lit(v.visualContainerObjects.title[0].properties.text) === "'قائمة المرضى'" && lit(v.visualContainerObjects.title[0].properties.alignment) === "'right'",
      () => `A8. header, value, grid, border and title styles carried; the title in Arabic, right-aligned: ${JSON.stringify(v && { o: v.objects, c: v.visualContainerObjects }).slice(0, 900)}`);
    const pidRef = rl ? last.queryRef : T + '.Patient ID', pf = get(() => v.objects.columnFormatting.find((e) => e.selector && e.selector.metadata === pidRef));
    chk(() => pf && lit(pf.properties.fontColor.solid.color) === "'#1F2A44'" && lit(pf.properties.backColor.solid.color) === "'#F4F6FA'" && lit(pf.properties.styleValues) === 'true' && lit(pf.properties.styleHeader) === 'false',
      () => `A9. the row headers' colours on the Patient ID column (its values, not its header): ${JSON.stringify(v && v.objects.columnFormatting)}`);
    chk(() => lit(pr('total').totals) === 'false', () => `A10. row subtotals off: the table's total off: ${JSON.stringify(v && v.objects.total)}`);
    const bad = v ? ['rowHeaders', 'subTotals', 'rowTotal', 'columnTotal', 'blankRows'].filter((k) => v.objects[k]).concat(pr('general').layout ? ['general.layout'] : [], pr('values').valuesOnRow || pr('values').bandedRowHeaders ? ['values.matrix-only'] : [], pr('columnHeaders').autoExpand ? ['columnHeaders.autoExpand'] : [],
      (v.objects.columnFormatting || []).some((e) => e.properties && e.properties.styleSubtotals) ? ['columnFormatting.styleSubtotals'] : [], v.expansionStates ? ['expansionStates'] : []) : ['no visual'];
    chk(() => bad.length === 0, () => `A11. no matrix-only property left on the table (the write's validator passed): ${bad.join(', ')}`);
  }

  // ---------- B: the heatmap lab ----------
  {
    let Lab = null; try { Lab = await import('./lab/heatmap-names.mjs'); } catch (e) { Lab = null; }
    chk(() => Lab && typeof Lab.writeLab === 'function', () => 'B1. mcp/lab/heatmap-names.mjs exports writeLab');
    if (Lab) {
      fs.mkdirSync(path.join(ROOT, 'full')); fs.writeFileSync(path.join(ROOT, 'full', 'x.txt'), 'x');
      let refused = false; try { Lab.writeLab(path.join(ROOT, 'full')); } catch (e) { refused = /empty folder/.test(String(e.message)); }
      chk(() => refused && fs.readdirSync(path.join(ROOT, 'full')).join() === 'x.txt', () => 'B2. a folder that is not empty is refused, nothing written');
      const r = Lab.writeLab(path.join(ROOT, 'lab'));
      chk(() => r.validator.exit === 0 && /"errorCount":0/.test(r.validator.text), () => `B3. Microsoft's validator: 0 errors: ${r.validator.text.slice(0, 400)}`);
      const DEF = path.join(path.dirname(r.pbip), 'Heatmap Names Lab.Report/definition'), order = rd(path.join(DEF, 'pages/pages.json')).pageOrder;
      const vis = (pg) => fs.readdirSync(path.join(DEF, 'pages', pg, 'visuals')).map((n) => rd(path.join(DEF, 'pages', pg, 'visuals', n, 'visual.json')));
      const all = order.map((pg) => ({ pg, page: rd(path.join(DEF, 'pages', pg, 'page.json')), vs: vis(pg) }));
      chk(() => all.length === 2 && all.map((x) => x.page.width).join() === '1280,1920', () => `B4. two pages, 1280 and 1920 wide: ${all.map((x) => x.page.width)}`);
      const by = (x, id) => x.vs.filter((v) => v.name.startsWith(id.toLowerCase()));
      const okB2 = all.every((x) => { const [mx] = by(x, 'b2m'), [tb] = by(x, 'b2t'); if (!mx || !tb) return false;
        const rh = mx.visual.objects.rowHeaders[0].properties, rowRef = mx.visual.query.queryState.Rows.projections[0].queryRef, w = (mx.visual.objects.columnWidth || []).find((e) => e.selector && e.selector.metadata === rowRef);
        const tps = tb.visual.query.queryState.Values.projections, tf = (tb.visual.objects.values || [])[0].properties, mf = (mx.visual.objects.values || [])[0].properties;
        return JSON.stringify(rh.fontColor) === JSON.stringify(rh.backColor) && w && tb.visual.visualType === 'tableEx' && tps.length === 1 && tps[0].queryRef === rowRef
          && tb.position.x === mx.position.x + mx.position.width && tb.position.y === mx.position.y && tb.position.height === mx.position.height
          && lit(tf.fontSize) === lit(mf.fontSize) && lit(tb.visual.objects.grid[0].properties.rowPadding) === lit(mx.visual.objects.grid[0].properties.rowPadding); });
      chk(() => okB2, () => `B5. B2 on each page: the matrix's row header text the colour of its background, its row header column given a width by its Rows field's queryRef, a one-column table of that field at its right edge, same top, height, font size and row padding: ${JSON.stringify(all.map((x) => by(x, 'b2').map((v) => v.name)))}`);
      const okB3 = all.every((x) => { const [b3] = by(x, 'b3'), [b1] = by(x, 'b1'); if (!b3 || !b1) return false; const q = b3.visual.query;
        return q.queryState.Rows.projections[0].queryRef === b1.visual.query.queryState.Columns.projections[0].queryRef && q.queryState.Columns.projections[0].queryRef === b1.visual.query.queryState.Rows.projections[0].queryRef
          && q.sortDefinition.sort.some((s) => s.direction === 'Descending' && JSON.stringify(s.field) === JSON.stringify(q.queryState.Columns.projections[0].field)); });
      chk(() => okB3, () => 'B6. B3 transposed: hours as Rows, days as Columns sorted Descending; B1 the twin today (days as Rows, hours as Columns)');
    }
  }
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-mx1.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  mx1  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  mx1  ${checks} checks`);
