// 0.3.0 R3 (the owner's must-fix): a waterfall in a right-to-left report reads from the right. Written red first.
// Microsoft's capabilities for waterfallChart (@microsoft/powerbi-core-visual-schema, the version mcp/package.json pins,
// data/capabilities.json) give its categoryAxis no invertAxis, and its valueAxis switchAxisPosition (and invertAxis,
// which turns the values upside down: not a mirror). So the only honest mirror is the order: the steps follow the
// category order (the running total starts at the first category), and the sort by the axis's own order, Descending,
// puts the first category at the right; the value axis goes to the right. On made-up fields only:
//   W  the writer (gallery: true): an Arabic waterfall by month is sorted Descending by Min of the month number (in
//      Tooltips), its value axis at the right, no categoryAxis.invertAxis; the English one unchanged (Ascending)
//   M  the Arabic twin (report-mirror.js): a waterfall copied from the English report gets the same, by its own rules
// (D1, changed on purpose: Desktop 2.159 showed that the Descending sort reversed TIME, not the direction: Power BI
// accumulates a waterfall left to right. A right-to-left waterfall is now a stacked column chart drawn as a waterfall
// (test-0.3.0-waterfall-rtl2.mjs checks its measures, DAX and the order Desktop draws); the checks below say what still
// holds of R3: the sort Descending with the first month at the right, the value axis at the right, no invertAxis)
//   V  Microsoft's validator offline: 0 errors on the Arabic report and on the twin's page
//   node test-0.3.0-waterfall-rtl.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

const Px = req('../assets/js/pbip-export.js'), E = req('../assets/js/design-engine.js'), Mirror = req('../assets/js/report-mirror.js');
const CAPS = JSON.parse(fs.readFileSync(path.join(HERE, 'node_modules/@microsoft/powerbi-core-visual-schema/data/capabilities.json'), 'utf8'));

// ---------- made-up fields (a retail model; no employer or client data) ----------
const T = 'Sales', M = (m, x) => Object.assign({ t: T, m }, x || {}), C = (c, x) => Object.assign({ t: T, c }, x || {});
const AED = M('Total Sales', { cardFormat: '"AED" #,0' });
const MONTH = C('Month Name', { kind: 'month', sortBy: { t: T, c: 'Month Number' } });
const B = { kpis: [AED], measure: AED, date: MONTH, cats: { bar: C('City'), column: MONTH, donut: C('Channel') }, y: {},
  table: [C('City'), AED], slicers: [C('City'), null, null], tip: { card: AED, cat: C('City'), y: AED } };
const build = (lang) => {
  const d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma';
  E.repairState(d);
  return Px.build({ name: 'WF ' + lang, title: 'WF', pageName: 'P', lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), sample: false,
    model: { byPath: 'M.SemanticModel' }, bind: B, texts: E.REPORT_TEXTS[lang], chartAxes: 'mirrored', gallery: true,
    pages: [{ name: 'P', page: { w: 1280, h: 720 }, slots: [{ kind: 'waterfall', x: 20, y: 20, w: 1240, h: 600 }], panel: null, hand: true, png: new Uint8Array([1]) }] });
};
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e) }; } };
const visualFiles = (r) => (r.files || []).filter((f) => /visual\.json$/.test(f.path));
const wfOf = (r, type) => visualFiles(r).map((f) => JSON.parse(String(f.data))).find((v) => v.visual && v.visual.visualType === (type || 'waterfallChart'));
const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
const props = (v, o) => ((((v.visual.objects || {})[o]) || [])[0] || { properties: {} }).properties;
const MIN_MONTH = JSON.stringify({ Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: T } }, Property: 'Month Number' } }, Function: 3 } });
const sort0 = (v) => v.visual.query.sortDefinition && v.visual.query.sortDefinition.sort[0];
const show = (v) => JSON.stringify(v ? { sort: v.visual.query.sortDefinition, objects: v.visual.objects } : null).slice(0, 600);

// ---------- the capabilities this rests on (never a property they don't list) ----------
const WC = CAPS.waterfallChart.objects;
chk(() => !('invertAxis' in WC.categoryAxis.properties) && 'switchAxisPosition' in WC.valueAxis.properties,
  () => 'C: Microsoft\'s capabilities: waterfallChart categoryAxis has no invertAxis, valueAxis has switchAxisPosition');

// ---------- W: the writer ----------
const AR = get(() => build('ar')), EN = get(() => build('en'));
const wa = AR.files && wfOf(AR, 'columnChart'), we = EN.files && wfOf(EN);
chk(() => wa && we && !wfOf(AR), () => `W: the English report has a waterfall, the Arabic one its stacked column chart (D1): ${AR.threw || EN.threw || ''}`);
chk(() => sort0(wa).direction === 'Descending' && JSON.stringify(sort0(wa).field) === MIN_MONTH && wa.visual.query.queryState.Tooltips.projections.some((p) => JSON.stringify(p.field) === MIN_MONTH),   /* (D1: the running total is in Tooltips too, first) */
  () => `W1 Arabic: sorted Descending by Min of Month Number, which is in Tooltips (the first month at the right): ${show(wa)}`);
chk(() => lit(props(wa, 'valueAxis').switchAxisPosition) === 'true', () => `W2 Arabic: the value axis at the right: ${show(wa)}`);
chk(() => !(wa.visual.objects || {}).categoryAxis, () => `W3 Arabic: no categoryAxis.invertAxis (not a waterfall property): ${show(wa)}`);
chk(() => sort0(we).direction === 'Ascending' && JSON.stringify(sort0(we).field) === MIN_MONTH && !(we.visual.objects || {}).valueAxis && !(we.visual.objects || {}).categoryAxis,
  () => `W4 English unchanged: Ascending by the month number, the value axis left to Power BI: ${show(we)}`);
// every object property written on the waterfall is one Microsoft lists for it
chk(() => [[wa, CAPS.columnChart.objects], [we, WC]].every(([v, K]) => Object.entries(v.visual.objects || {}).every(([o, es]) => K[o] && es.every((e) => Object.keys(e.properties || {}).every((p) => p in K[o].properties)))),
  () => `W5: every property written is in its visual's capabilities (waterfallChart, columnChart): ${show(wa)}`);

// ---------- M: the Arabic twin of the English report ----------
chk(() => Mirror.kindOf(we) === 'waterfall', () => `M1: the twin knows a waterfall (kind ${Mirror.kindOf(we)}), not "other: moved only"`);
const tw = we && Mirror.mirrorVisual(we, 1280, { timeRightToLeft: true, dateTables: [], dateColumns: [] });
chk(() => tw.json.visual.visualType === 'columnChart' && sort0(tw.json).direction === 'Descending' && JSON.stringify(sort0(tw.json).field) === MIN_MONTH && lit(props(tw.json, 'valueAxis').switchAxisPosition) === 'true' && !(tw.json.visual.objects || {}).categoryAxis,
  () => `M2: the twin's waterfall by month: the stacked chart (D1), Descending by Min of Month Number, value axis at the right, no categoryAxis: ${show(tw && tw.json)}`);
// a waterfall by a date column the model calls a date (a continuous axis for a column chart): still no invertAxis
const byDate = JSON.parse(JSON.stringify(we)); byDate.visual.query.queryState.Category.projections[0].field.Column.Property = 'Order Date'; delete byDate.visual.query.sortDefinition;
const td = Mirror.mirrorVisual(byDate, 1280, { timeRightToLeft: true, dateTables: [], dateColumns: [T + '.Order Date'] });
chk(() => props(td.json, 'categoryAxis').invertAxis === undefined && lit(props(td.json, 'categoryAxis').axisType) === "'Categorical'" && sort0(td.json).direction === 'Descending',
  () => `M3: a waterfall by a date column: Descending by it, its axis Categorical (one column a date, the sort honoured; D1), never categoryAxis.invertAxis: ${show(td.json)}`);
// sorted by its measure (largest first): mirrored by Ascending, the largest at the right (as the column charts)
const byY = JSON.parse(JSON.stringify(we)); byY.visual.query.sortDefinition = { sort: [{ field: JSON.parse(JSON.stringify(we.visual.query.queryState.Y.projections[0].field)), direction: 'Descending' }], isDefaultSort: true };
// (D1: kept a waterfall with its own order: the running total would follow the ranking, and a waterfall reads left to right)
chk(() => { const r = Mirror.mirrorVisual(byY, 1280, {}); return r.kind === 'waterfallKept' && sort0(r.json).direction === 'Descending' && r.json.visual.visualType === 'waterfallChart'; }, () => 'M4: a waterfall sorted by its measure is kept a waterfall, left to right (D1)');
// time kept left to right on request (timeRightToLeft: false): the waterfall follows the column charts' rule exactly
// (written first as "the sort stays Ascending"; the twin keeps only a sort by the category itself, and a column chart
// sorted by Min of the month number is flipped too: listed in the PR under "Seen, not in scope", not changed here)
const kept = Mirror.mirrorVisual(we, 1280, { timeRightToLeft: false, dateTables: [T] });
const asCol = JSON.parse(JSON.stringify(we)); asCol.visual.visualType = 'clusteredColumnChart';
const keptCol = Mirror.mirrorVisual(asCol, 1280, { timeRightToLeft: false, dateTables: [T] });
void keptCol;   // (D1: time kept left to right on request: the waterfall stays one, its query as it is, the value axis at the right)
chk(() => kept.kind === 'waterfallTime' && kept.json.visual.visualType === 'waterfallChart' && JSON.stringify(kept.json.visual.query) === JSON.stringify(we.visual.query) && lit(props(kept.json, 'valueAxis').switchAxisPosition) === 'true', () => `M5: timeRightToLeft false: the waterfall kept left to right as asked: ${show(kept.json)}`);
chk(() => /waterfall/i.test(Mirror.KIND_WHAT.waterfall || '') && /stacked column chart/.test(Mirror.KIND_WHAT.waterfall) && /left to right only/i.test(Mirror.KIND_WHAT.waterfall),
  () => `M6: the plan says what is written (D1: a stacked column chart) and why (Power BI draws a waterfall left to right only): ${Mirror.KIND_WHAT.waterfall}`);

// ---------- V: Microsoft's validator offline ----------
{
  const cli = path.join(HERE, 'node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js'), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-wf-'));
  // the twin: the English report with its page mirrored by the twin's engine
  const twin = EN.files && { files: EN.files.map((f) => {
    if (!/visual\.json$/.test(f.path)) return f;
    const v = JSON.parse(String(f.data)); return Object.assign({}, f, { data: JSON.stringify(Mirror.mirrorVisual(v, 1280, { timeRightToLeft: true }).json, null, 2) });
  }) };
  [['ar', AR], ['twin', twin]].forEach(([what, r]) => {
    if (!r || !r.files) { chk(() => false, () => `V ${what}: no report was written`); return; }
    const dir = path.join(TMP, what);
    r.files.forEach((f) => { const p = path.join(dir, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
    const rd = path.join(dir, fs.readdirSync(dir).find((d) => /\.Report$/.test(d)) || ''), pv = spawnSync(process.execPath, [cli, 'validate', rd], { encoding: 'utf8' });
    let vd = null; try { vd = JSON.parse(pv.stdout).data; } catch (e) { vd = null; }
    chk(() => vd && vd.errorCount === 0, () => `V ${what}: Microsoft's validator: 0 errors: ${vd ? JSON.stringify(Object.entries(vd.diagnostics || {}).filter(([, d]) => d.severity === 'error').map(([k, d]) => k + ': ' + String(d.items[0].message).slice(0, 200))) : String(pv.stdout || pv.stderr).slice(0, 300)}`);
  });
  fs.rmSync(TMP, { recursive: true, force: true });
}

if (problems.length) { console.log(`FAIL  waterfall-rtl  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  waterfall-rtl  ${checks} checks`);
