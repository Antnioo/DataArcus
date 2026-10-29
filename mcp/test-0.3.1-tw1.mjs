import './test-env.mjs';
// 0.3.1 TW1 (the owner, 27 Oct: "i want the twin to be identical that is why it's called a twin"; mcp/work/TW1.md;
// written red first): the ways the Arabic twin still differed from create_report's Arabic, and two Seen items.
//   T  M1-S2   the twin's table keeps Power BI's total row word: the writer's right-to-left table (round 23)
//   A  M1-S3   a number column's continuous axis runs right to left in the twin as in create_report
//   P  SQ4-S2  the twin's phone card title wraps (or not) for its Arabic by the writer's rule
//   S  SQ1-S2  a stacked slicer slot (higher than wide) never puts a slicer below its bottom
//   K  SQ15a-S2 the bullet bar's notUsed says a table measure's KPI target is an expression
// (M1-S1, the panels kept: test-0.3.1-en-ar-copy.mjs X1 and the parity suite.) Made-up models only: mcp/fixtures/twin-project.
//   node test-0.3.1-tw1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url)), require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.stack || e).slice(0, 400) }; } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); };
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value) : undefined);
const Lv = (v) => ({ expr: { Literal: { Value: v } } });

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-tw1-')));
process.env.DATAARCUS_ROOT = ROOT;
const DEF = 'Twin Sales.Report/definition';
const fresh = (name) => { fs.rmSync(path.join(ROOT, name), { recursive: true, force: true }); fs.cpSync(path.join(HERE, 'fixtures/twin-project'), path.join(ROOT, name), { recursive: true }); return path.join(ROOT, name); };
const Plans = await import('./lib/plans.mjs');
const { planTwin } = await import('./lib/arabic-twin.mjs');
const { register } = await import('./tools/create_arabic_twin.mjs');
const Mirror = require('../assets/js/report-mirror.js'), Sizing = require('../assets/js/pbip-sizing.js');
let handler = null;
register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = h; } }, {});
const call = async (a) => { const r = await handler(a), t = (r.content || []).map((c) => c.text).join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* a refusal's words */ } return { err: !!r.isError, t, j }; };
const short = (x) => (x.err ? x.t.slice(0, 400) : JSON.stringify(x.j).slice(0, 400));
const writeOf = async (a) => { const p = await call(a), id = p.j && p.j.plan && p.j.plan.planId; if (!id) return { p, w: { err: true, t: 'no plan id: ' + short(p), j: null } }; Plans.approve(id, 'user-in-browser'); return { p, w: await call(Object.assign({}, a, { planId: id })) }; };
const builtVisual = (P, page, name) => P.built.pages.find((x) => x.pg.id === page).visuals.find((v) => v.name === name);

try {
  // ---------- T: M1-S2, the table's total row ----------
  {
    const D = fresh('t');
    const { p, w } = await writeOf({ path: 't/Twin Sales.pbip', arabicMonth: false, labels: { 'title:p2details/tblProducts': 'المنتجات' } });
    const tw = get(() => rd(path.join(D, 'Twin Sales AR.Report/definition/pages/p2details/visuals/tblProducts/visual.json')));
    const ps = get(() => tw.visual.query.queryState.Values.projections), refs = Array.isArray(ps) ? ps.map((x) => x.queryRef) : ps;
    chk(() => !w.err && JSON.stringify(refs) === JSON.stringify(['Sales.Product', 'Sales.Total Sales', 'Sum(Sales.Amount)', 'Sales.Row label: Product']),
      () => `T1. the twin's table is the writer's right-to-left table: the text column first (Power BI's total word goes there), the numbers mirrored, the row label at the right (was the columns reversed, a number first): ${w.err ? w.t.slice(0, 300) : JSON.stringify(refs)}`);
    const cw = get(() => tw.visual.objects.columnWidth), cf = get(() => tw.visual.objects.columnFormatting);
    chk(() => cw.some((e) => e.selector.metadata === 'Sales.Product' && lit(e.properties.value) === '0D') && cf.some((e) => e.selector.metadata === 'Sales.Row label: Product' && lit(e.properties.alignment) === "'Right'") && ps[3].field.Measure.Expression.SourceRef.Schema === 'extension' && ps[3].displayName === 'Product',
      () => `T2. the text column hidden (width 0), the row label right-aligned under the column's header, a report measure: ${JSON.stringify([cw, cf, ps && ps[3]]).slice(0, 600)}`);
    const ext = get(() => rd(path.join(D, 'Twin Sales AR.Report/definition/reportExtensions.json'))), m = get(() => ext.entities.find((e) => e.name === 'Sales').measures.find((x) => x.name === 'Row label: Product'));
    chk(() => m && m.dataType === 'Text' && /ISINSCOPE \( 'Sales'\[Product\] \)/.test(m.expression) && m.expression.includes('"الإجمالي"') && /NOT ISBLANK \( 'Sales'\[Total Sales\] \) \|\| NOT ISBLANK \( SUM \( 'Sales'\[Amount\] \) \)/.test(m.expression),
      () => `T3. the twin's reportExtensions.json holds the row label, the writer's DAX (rowLabelDax: «الإجمالي» on the total row, blank where the numbers are): ${JSON.stringify(m || ext).slice(0, 500)}`);
    chk(() => !fs.existsSync(path.join(D, DEF, 'reportExtensions.json')), () => 'T4. the original report is not changed (no reportExtensions.json written there)');
    const said = ((p.j && p.j.mirrors) || []).find((x) => x.kind === 'table') || {};
    chk(() => /«الإجمالي» on its total row/.test(said.what) && /Row label/.test(said.what), () => `T5. the plan says the table's total row word and the measure (mirrors): ${JSON.stringify(said).slice(0, 400)}`);
    // a guard: a table whose first column is a number of the model (Year, int64) keeps the mirrored columns, no row label
    const D2 = fresh('t2'), f = path.join(D2, DEF, 'pages/p2details/visuals/tblProducts/visual.json'), j = rd(f);
    j.visual.query.queryState.Values.projections[0] = { field: { Column: { Expression: { SourceRef: { Entity: 'Calendar' } }, Property: 'Year' } }, queryRef: 'Calendar.Year', nativeQueryRef: 'Year' }; wr(f, j);
    const P2 = planTwin({ path: 't2/Twin Sales.pbip', arabicMonth: false }), r2 = get(() => builtVisual(P2, 'p2details', 'tblProducts').visual.query.queryState.Values.projections.map((x) => x.queryRef));
    chk(() => JSON.stringify(r2) === JSON.stringify(['Sales.Total Sales', 'Sum(Sales.Amount)', 'Calendar.Year']) && !P2.built.tables.length, () => `T6. guard: a number first keeps the mirrored columns and no row label: ${JSON.stringify(r2)}`);
  }

  // ---------- A: M1-S3, a whole-number continuous axis ----------
  {
    const D = fresh('a'), v0 = rd(path.join(D, DEF, 'pages/p1overview/visuals/colRegion/visual.json'));
    const v = JSON.parse(JSON.stringify(v0)); v.name = 'colYear'; v.position = Object.assign({}, v.position, { x: 660, y: 250, z: 11000, tabOrder: 11000 });
    v.visual.query = { queryState: { Category: { projections: [{ field: { Column: { Expression: { SourceRef: { Entity: 'Calendar' } }, Property: 'Year' } }, queryRef: 'Calendar.Year', nativeQueryRef: 'Year', active: true }] }, Y: v0.visual.query.queryState.Y } };
    wr(path.join(D, DEF, 'pages/p1overview/visuals/colYear/visual.json'), v);
    const P = planTwin({ path: 'a/Twin Sales.pbip', arabicMonth: false }), t = get(() => builtVisual(P, 'p1overview', 'colYear').visual);
    // create_report's rule for the same chart: the shared mirror with the writer's continuous columns (pbip-export.js
    // CONTINUOUS: every date or number column of the model; Calendar[Year] is int64)
    const wv = JSON.parse(JSON.stringify(v.visual)); Mirror.mirrorChart(wv, { dateColumns: ['Calendar.Year'] });
    const ax = (x) => JSON.stringify([((x.objects || {}).categoryAxis || []).map((e) => lit(e.properties.invertAxis)), ((x.objects || {}).valueAxis || []).map((e) => lit(e.properties.switchAxisPosition)), x.query.sortDefinition || null]);
    chk(() => t && ((t.objects || {}).categoryAxis || []).some((e) => lit(e.properties.invertAxis) === 'true'), () => `A1. the twin's column chart by Calendar[Year] (a whole number, continuous) runs right to left (categoryAxis.invertAxis), as create_report's: ${JSON.stringify(t && t.objects)}`);
    chk(() => t && ax(t) === ax(wv), () => `A2. parity: the twin's axes and sort are create_report's for the same chart: ${t && ax(t)} / ${ax(wv)}`);
  }

  // ---------- P: SQ4-S2, the phone card title ----------
  {
    const D = fresh('p'), V = path.join(D, DEF, 'pages/p1overview/visuals/cardSales/'), j = rd(V + 'visual.json');
    j.visual.visualType = 'cardVisual'; j.visual.query.queryState = { Data: j.visual.query.queryState.Values }; wr(V + 'visual.json', j);
    // the writer's phone card (pbip-page.js phoneLook): 157.5 x 100, the title at 10pt on one line, the value its fit
    const W = 157.5, H = 100, Z = Sizing.make({ font: 'Segoe UI', LABEL: 10 }), one = Z.cardFit(W, H, 1, 10, 20), two = Z.cardFit(W, H, 1, 10, 20, null, undefined, 2);
    wr(V + 'mobile.json', { position: { x: 0, y: 0, z: 1000, width: W, height: H, tabOrder: 1000 }, objects: { value: [{ properties: { fontSize: Lv(one.V + 'D') }, selector: { id: 'default' } }], padding: [{ properties: { paddingUniform: Lv(one.I + 'D') }, selector: { id: 'default' } }] },
      visualContainerObjects: { title: [{ properties: { fontSize: Lv('10D') } }], padding: [{ properties: { top: Lv(one.P + 'D'), bottom: Lv(one.P + 'D'), left: Lv(one.P + 'D'), right: Lv(one.P + 'D') } }] } });
    const AR = 'إجمالي المبيعات في جميع المناطق', room = W - 2 * one.P, lines = Z.wrapLines(AR, 10, room);
    // the writer's rule, as it is written in pbip-page.js (round 12, #1): wider than the room at 10pt, two lines that fit
    chk(() => Sizing.textWidth(AR, 10, true, 'Segoe UI') > room && lines.length === 2 && lines.every((l) => Sizing.textWidth(l, 10, true, 'Segoe UI') <= room) && two.V >= 8, () => `P0. set-up: the Arabic title wraps to two lines in the writer's rule: ${JSON.stringify(lines)} ${room}`);
    const { w } = await writeOf({ path: 'p/Twin Sales.pbip', arabicMonth: false, labels: { 'title:p1overview/cardSales': AR } });
    const m = get(() => rd(path.join(D, 'Twin Sales AR.Report/definition/pages/p1overview/visuals/cardSales/mobile.json'))), tl = get(() => m.visualContainerObjects.title[0].properties);
    chk(() => !w.err && lit(tl.titleWrap) === 'true' && lit(tl.text) === "'" + AR + "'", () => `P1. the twin's phone card title wraps its Arabic to two lines (titleWrap), as the writer's: ${w.err ? w.t.slice(0, 300) : JSON.stringify(tl)}`);
    chk(() => lit(m.objects.value[0].properties.fontSize) === two.V + 'D' && lit(m.objects.padding[0].properties.paddingUniform) === two.I + 'D', () => `P2. its value takes the two-line card fit (${two.V}, inner ${two.I}): ${JSON.stringify(m && m.objects)}`);
    // a short Arabic title stays on one line: no wrap, the one-line fit kept
    const D2 = fresh('p2'), V2 = path.join(D2, DEF, 'pages/p1overview/visuals/cardSales/'); wr(V2 + 'visual.json', j); fs.copyFileSync(V + 'mobile.json', V2 + 'mobile.json');
    const { w: w2 } = await writeOf({ path: 'p2/Twin Sales.pbip', arabicMonth: false, labels: { 'title:p1overview/cardSales': 'المبيعات' } });
    const m2 = get(() => rd(path.join(D2, 'Twin Sales AR.Report/definition/pages/p1overview/visuals/cardSales/mobile.json')));
    chk(() => !w2.err && lit(m2.visualContainerObjects.title[0].properties.titleWrap) === undefined && lit(m2.objects.value[0].properties.fontSize) === one.V + 'D', () => `P3. guard: a short Arabic title keeps one line and the one-line fit: ${w2.err ? w2.t.slice(0, 300) : JSON.stringify(m2)}`);
    // (0.3.1 FX6, Codex's D01) the phone layout with a title of its own ('Sales'), approved apart from the desktop's
    const withPhoneTitle = (name) => { const Dx = fresh(name), Vx = path.join(Dx, DEF, 'pages/p1overview/visuals/cardSales/'), mj = rd(V + 'mobile.json'); wr(Vx + 'visual.json', j);
      mj.visualContainerObjects.title[0].properties.text = Lv("'Sales'"); wr(Vx + 'mobile.json', mj); return Dx; };
    const phoneOf = (Dx) => get(() => rd(path.join(Dx, 'Twin Sales AR.Report/definition/pages/p1overview/visuals/cardSales/mobile.json')));
    const D4 = withPhoneTitle('p4'), { w: w4 } = await writeOf({ path: 'p4/Twin Sales.pbip', arabicMonth: false, labels: { 'title:p1overview/cardSales': AR, 'phone:title:p1overview/cardSales': 'المبيعات' } });
    const m4 = phoneOf(D4), t4 = get(() => m4.visualContainerObjects.title[0].properties);
    chk(() => !w4.err && lit(t4.text) === "'المبيعات'" && lit(t4.titleWrap) === undefined && lit(m4.objects.value[0].properties.fontSize) === one.V + 'D',
      () => `P4. a phone title approved apart from the desktop's (a long desktop Arabic title that wraps) is kept as approved, on one line with the one-line fit: ${w4.err ? w4.t.slice(0, 300) : JSON.stringify(m4)}`);
    const D5 = withPhoneTitle('p5'), { w: w5 } = await writeOf({ path: 'p5/Twin Sales.pbip', arabicMonth: false, labels: { 'title:p1overview/cardSales': 'المبيعات', 'phone:title:p1overview/cardSales': AR } });
    const m5 = phoneOf(D5), t5 = get(() => m5.visualContainerObjects.title[0].properties);
    chk(() => !w5.err && lit(t5.text) === "'" + AR + "'" && lit(t5.titleWrap) === 'true' && lit(m5.objects.value[0].properties.fontSize) === two.V + 'D',
      () => `P5. the approved phone title is the one fitted: a long one wraps with the two-line fit, though the desktop title is short: ${w5.err ? w5.t.slice(0, 300) : JSON.stringify(m5)}`);
    const D6 = fresh('p6'), V6 = path.join(D6, DEF, 'pages/p1overview/visuals/cardSales/'); wr(V6 + 'visual.json', j); fs.copyFileSync(V + 'mobile.json', V6 + 'mobile.json');
    const { w: w6 } = await writeOf({ path: 'p6/Twin Sales.pbip', arabicMonth: false, labels: { 'title:p1overview/cardSales': AR } }), t6 = get(() => phoneOf(D6).visualContainerObjects.title[0].properties);
    chk(() => !w6.err && lit(t6.text) === "'" + AR + "'" && lit(t6.titleWrap) === 'true', () => `P6. guard: a phone layout with no title of its own takes the desktop's Arabic, wrapped: ${w6.err ? w6.t.slice(0, 300) : JSON.stringify(t6)}`);
  }
} catch (e) {
  problems.push('the suite stopped: ' + String(e && e.stack || e).slice(0, 600));
} finally {
  fs.rmSync(ROOT, { recursive: true, force: true });
}

// ---------- S: SQ1-S2, a stacked slicer slot ----------
{
  const Px = require('../assets/js/pbip-export.js'), E = require('../assets/js/design-engine.js');
  const T = 'Work Orders', C = (c) => ({ t: T, c }), y = { t: T, m: 'Total Cost' };
  const bind = { kpis: [y], measure: y, cats: {}, y: {}, table: [C('Technician'), y], slicers: [C('Department'), C('Status'), null] };
  const build = (lang, w, h) => { const d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma'; E.repairState(d);
    return Px.build({ name: 'TW1', title: 'Work orders', pageName: 'Overview', lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), sample: false,
      model: { byPath: 'Service Orders.SemanticModel' }, bind, texts: E.REPORT_TEXTS[lang], pages: [{ name: 'Overview', page: { w: 1280, h: 720 }, slots: [{ kind: 'slicer', x: 20, y: 20, w, h }], panel: null, hand: true }] }); };
  const boxes = (r) => r.files.filter((f) => /\/visual\.json$/.test(f.path)).map((f) => JSON.parse(String(f.data))).filter((v) => v.visual && /^(slicer|actionButton)$/.test(v.visual.visualType)).map((v) => v.position);
  ['en', 'ar'].forEach((lang) => {
    const r = get(() => build(lang, 60, 80)), bs = get(() => boxes(r));
    chk(() => Array.isArray(bs) && bs.length >= 1 && bs.every((p) => p.y >= 0 && p.y + p.height <= 80 + 0.5), () => `S1 (${lang}). a 60 x 80 slot (higher than wide: stacked) puts nothing below its bottom (positions in its group; was the second slicer at y 88): ${JSON.stringify(bs)}`);
    chk(() => (r.leftOut || []).some((x) => x.kind === 'slicer' && x.narrow && x.short) && (r.leftOut || []).some((x) => x.kind === 'reset' && x.short), () => `S2 (${lang}). what does not fit is told (the Reset, then slicers from the last): ${JSON.stringify(r.leftOut)}`);
  });
  const ok = get(() => boxes(build('en', 300, 400)));
  chk(() => Array.isArray(ok) && ok.length === 3, () => `S3. guard: a 300 x 400 slot keeps its two slicers and the Reset: ${JSON.stringify(ok)}`);
}

// ---------- K: SQ15a-S2, the bullet bar's KPI target that is an expression ----------
{
  const { applyDax } = await import('./lib/dax-functions.mjs');
  // a report with one table of one measure whose KPI target is an expression (made up), and nothing else
  const tmsl = { model: { tables: [{ name: 'Sales', columns: [{ name: 'Region', dataType: 'string', sourceColumn: 'Region' }], measures: [{ name: 'Margin Rate', expression: 'DIVIDE ( 2, 3 )', formatString: '0.0%', kpi: { targetExpression: '0.95 * 1', statusGraphic: 'Traffic Light - Single' } }] }] } };
  const vis = { name: 't1', position: { x: 0, y: 0, z: 0, width: 600, height: 300 }, visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: [
    { field: { Column: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Region' } }, queryRef: 'Sales.Region', nativeQueryRef: 'Region' },
    { field: { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Margin Rate' } }, queryRef: 'Sales.Margin Rate', nativeQueryRef: 'Margin Rate' }] } } } } };
  const files = [{ path: 'R.Report/definition/report.json', data: JSON.stringify({}) }, { path: 'R.Report/definition/pages/p1/page.json', data: JSON.stringify({ name: 'p1', displayName: 'Overview', width: 1280, height: 720 }) },
    { path: 'R.Report/definition/pages/p1/visuals/t1/visual.json', data: JSON.stringify(vis) }];
  const r = get(() => applyDax(files, { opt: ['bulletBar'], tmsl, lang: 'en', ui: {}, base: 'R', seed: 's' })), nu = (r && r.notUsed || []).find((x) => x.use === 'bulletBar');
  chk(() => nu && /Sales\[Margin Rate\]/.test(nu.why) && /its KPI in the model has a target, but it is an expression/.test(nu.why), () => `K1. the bullet bar's notUsed says the table measure's KPI target is an expression (was the names only): ${JSON.stringify(r && r.notUsed || r)}`);
}

if (problems.length) {
  console.log(`FAIL script=test-0.3.1-tw1.mjs cause=${JSON.stringify(problems[0]).slice(0, 300)}`);
  problems.forEach((p) => console.log('  - ' + p));
  console.log(`FAIL  tw1  ${checks} checks, ${problems.length} failed`);
  process.exit(1);
}
console.log(`PASS  tw1  ${checks} checks`);
process.exit(0);
