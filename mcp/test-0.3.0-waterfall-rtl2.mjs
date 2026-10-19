// D1 (the owner's must-fix 2; measured on the laptop in Desktop 2.159 on release/0.3.0 222c239): an Arabic waterfall
// really reads from the right. Written red first.
// R3 sorted the Arabic waterfall Descending with the value axis at the right; Desktop then drew Dec as the first step at
// the LEFT, the bars climbing left to right to Jan, Total at the far right: Power BI accumulates a waterfall in its sort
// order, left to right, and has no setting to invert its category axis. So a right-to-left waterfall is written as a
// stacked column chart (columnChart) drawn as a waterfall from report-level measures: an invisible base and the steps,
// the running total in the time order, the axis sorted Descending (January at the right), the value axis at the right.
// Power BI's category axis holds only the model's members, so no Total column can be added: said in the notes.
// On made-up fields only:
//   E  English unchanged (a waterfallChart, Ascending by the month number)
//   A  the writer, Arabic (gallery: true, chartAxes mirrored): the stacked chart, its measures, DAX, sort, axis, look
//   G  the golden: the order Desktop draws (the sort) and the DAX evaluated on made-up months give January's step at
//      the right from 0, each step starting where the one at its right ended, the leftmost ending at the year's total
//   F  the fallback (a waterfall the measures can't order): kept a waterfall, left to right in time, and said
//   T  the twin (create_arabic_twin through the server): the same visual as the direct Arabic report; the measures in
//      the twin's own reportExtensions.json; the model's sort-by column used; the plan says exactly what is written
//   V  Microsoft's validator 0 errors and check_report 0 "can break" on every report written here
//   node test-0.3.0-waterfall-rtl2.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

const Px = req('../assets/js/pbip-export.js'), E = req('../assets/js/design-engine.js'), Mirror = req('../assets/js/report-mirror.js');
const CAPS = JSON.parse(fs.readFileSync(path.join(HERE, 'node_modules/@microsoft/powerbi-core-visual-schema/data/capabilities.json'), 'utf8'));

// ---------- made-up fields (a retail model; no employer or client data) ----------
const T = 'Sales', M = (m, x) => Object.assign({ t: T, m }, x || {}), C = (c, x) => Object.assign({ t: T, c }, x || {});
const AED = M('Total Sales', { cardFormat: '"AED" #,0', tableFormat: '#,0' });
const MONTH = C('Month Name', { kind: 'month', sortBy: { t: T, c: 'Month Number' } });
const bindWith = (cat, extra) => Object.assign({ kpis: [AED], measure: AED, date: MONTH, cats: { bar: C('City'), column: cat, donut: C('Channel'), waterfall: cat }, y: {},
  table: [C('City'), AED], slicers: [C('City'), null, null], tip: { card: AED, cat: C('City'), y: AED } }, extra || {});
const build = (lang, B, names) => {
  const d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma';
  E.repairState(d);
  return Px.build({ name: 'WF ' + lang, title: 'WF', pageName: 'P', lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), sample: false,
    model: Object.assign({ byPath: 'M.SemanticModel' }, names ? { names } : {}), bind: B || bindWith(MONTH), texts: E.REPORT_TEXTS[lang], chartAxes: 'mirrored', gallery: true,
    pages: [{ name: 'P', page: { w: 1280, h: 720 }, slots: [{ kind: 'waterfall', x: 20, y: 20, w: 1240, h: 600 }], panel: null, hand: true, png: new Uint8Array([1]) }] });
};
const UI = (() => { const d = E.fresh(); E.repairState(d); return d.ui; })();
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e) }; } };
const visualFiles = (r) => (r.files || []).filter((f) => /visual\.json$/.test(f.path));
const typed = (r, type) => visualFiles(r).map((f) => JSON.parse(String(f.data))).find((v) => v.visual && v.visual.visualType === type);
const extOf = (r) => { const f = (r.files || []).find((x) => /reportExtensions\.json$/.test(x.path)); return f ? JSON.parse(String(f.data)) : null; };
const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
const colourOf = (p) => (p && p.solid && p.solid.color ? lit(p.solid.color) : undefined);
const entriesOf = (v, o) => (((v.visual.objects || {})[o]) || []);
const plainOf = (v, o) => (entriesOf(v, o).find((e) => !e.selector) || { properties: {} }).properties;
const bySel = (v, o, ref) => (entriesOf(v, o).find((e) => e.selector && e.selector.metadata === ref) || { properties: {} }).properties;
const C0 = (c) => ({ Column: { Expression: { SourceRef: { Entity: T } }, Property: c } });
const MIN_MONTH = JSON.stringify({ Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: T } }, Property: 'Month Number' } }, Function: 3 } });
const sort0 = (v) => v.visual.query.sortDefinition && v.visual.query.sortDefinition.sort[0];
const show = (v) => JSON.stringify(v ? { type: v.visual.visualType, query: v.visual.query, objects: v.visual.objects } : null).slice(0, 900);
const PARTS = ['base', 'rise', 'fall', 'rise below 0', 'fall below 0'];
const ys = (v) => v.visual.query.queryState.Y.projections;
const measureOf = (ext, name) => ext && Array.isArray(ext.entities) && ext.entities.flatMap((e) => e.measures.map((m) => Object.assign({ entity: e.name }, m))).find((m) => m.name === name);
const nameOfProj = (p) => p.field.Measure.Property;
// the DAX with its bracketed names, quoted table names and strings taken out (test.mjs's names check): no comparison sign
const bare = (e) => e.replace(/\[(?:[^\]]|\]\])*\]/g, '[]').replace(/"(?:[^"]|"")*"/g, '""').replace(/'(?:[^']|'')*'/g, "''");

// ---------- E: English unchanged ----------
const EN = get(() => build('en')), AR = get(() => build('ar'));
const we = EN.files && typed(EN, 'waterfallChart');
chk(() => we && sort0(we).direction === 'Ascending' && JSON.stringify(sort0(we).field) === MIN_MONTH && !(we.visual.objects || {}).valueAxis && !typed(EN, 'columnChart'),
  () => `E1: the English waterfall unchanged (waterfallChart, Ascending by Min of Month Number, the value axis left to Power BI): ${EN.threw || show(we)}`);

// ---------- A: the writer, Arabic ----------
const wa = AR.files && typed(AR, 'columnChart'), ext = AR.files && extOf(AR);
chk(() => wa && !typed(AR, 'waterfallChart'), () => `A1: the Arabic waterfall is written as a stacked column chart (columnChart), no waterfallChart: ${AR.threw || visualFiles(AR).map((f) => JSON.parse(String(f.data)).visual.visualType).join()}`);
chk(() => ys(wa).length === 5 && ys(wa).every((p, i) => p.field.Measure && p.field.Measure.Expression.SourceRef.Schema === 'extension' && p.field.Measure.Expression.SourceRef.Entity === T && nameOfProj(p) === 'Waterfall ' + PARTS[i] + ': Total Sales'),
  () => `A2: Y = the report's measures base, rise, fall, rise below 0, fall below 0 (stacked in that order): ${show(wa)}`);
chk(() => ys(wa).map((p) => p.displayName).join('|') === 'القاعدة|ارتفاع|انخفاض|ارتفاع تحت الصفر|انخفاض تحت الصفر', () => `A2b: the series are named in Arabic (shown in tooltips): ${ys(wa).map((p) => p.displayName).join('|')}`);
chk(() => { const tt = wa.visual.query.queryState.Tooltips.projections; return tt.some((p) => JSON.stringify(p.field) === MIN_MONTH) && tt.some((p) => p.field.Measure && nameOfProj(p) === 'Waterfall running total: Total Sales' && p.displayName === 'الإجمالي الجاري'); },
  () => `A3: Tooltips hold Min of Month Number (the sort) and the running total: ${show(wa)}`);
chk(() => sort0(wa).direction === 'Descending' && JSON.stringify(sort0(wa).field) === MIN_MONTH, () => `A4: sorted Descending by Min of Month Number: January at the RIGHT: ${show(wa)}`);
const exts = ext ? ext.entities.flatMap((e) => e.measures.filter((m) => /^Waterfall /.test(m.name)).map((m) => Object.assign({ entity: e.name }, m))) : [];
chk(() => exts.length === 7 && exts.filter((m) => !/^Waterfall total label/.test(m.name)).every((m) => m.entity === T && m.dataType === 'Double' && m.formatString === '#,0') && exts.some((m) => m.name === 'Waterfall total label: Total Sales' && m.dataType === 'Text'), () => `A5: seven measures in reportExtensions.json, under Sales: six Double with the measure's format, the total's label Text: ${JSON.stringify(exts).slice(0, 600)}`);
const runDax = (measureOf(ext, 'Waterfall running total: Total Sales') || {}).expression || '';
chk(() => /VAR _o = MAX \( 'Sales'\[Month Number\] \)/.test(runDax) && runDax.includes("CALCULATE ( 'Sales'[Total Sales], REMOVEFILTERS ( 'Sales'[Month Name] ), FILTER ( ALL ( 'Sales'[Month Number] ), MAX ( 'Sales'[Month Number], _o ) = _o ) )"),
  () => `A6: the running total is in the TIME order (every month up to this one by Month Number, the month name's filter removed): ${runDax}`);
chk(() => exts.every((m) => !/<|>|--/.test(bare(m.expression)) && m.expression.includes("'Sales'[Total Sales]")), () => `A7: no comparison sign in the DAX (names and strings aside), the measure by its DAX name: ${exts.map((m) => bare(m.expression)).join(' | ').slice(0, 500)}`);
const refOf = (i) => ys(wa)[i].queryRef;
chk(() => lit(plainOf(wa, 'valueAxis').switchAxisPosition) === 'true' && !(wa.visual.objects || {}).categoryAxis, () => `A8: the value axis at the right, no categoryAxis.invertAxis: ${show(wa)}`);
chk(() => lit(plainOf(wa, 'legend').show) === 'false', () => `A9: no legend (no item for the base): ${show(wa)}`);
chk(() => lit(bySel(wa, 'dataPoint', refOf(0)).fillTransparency) === '100D' && colourOf(bySel(wa, 'dataPoint', refOf(1)).fill) === "'" + UI.good + "'" && colourOf(bySel(wa, 'dataPoint', refOf(2)).fill) === "'" + UI.bad + "'"
  && colourOf(bySel(wa, 'dataPoint', refOf(3)).fill) === "'" + UI.good + "'" && colourOf(bySel(wa, 'dataPoint', refOf(4)).fill) === "'" + UI.bad + "'",
  () => `A10: the base invisible (transparency 100), rises in the theme's good colour ${UI.good}, falls in its bad colour ${UI.bad}: ${JSON.stringify(entriesOf(wa, 'dataPoint'))}`);
chk(() => lit(plainOf(wa, 'labels').show) === 'true' && [0, 3, 4].every((i) => lit(bySel(wa, 'labels', refOf(i)).showSeries) === 'false') && [1, 2].every((i) => bySel(wa, 'labels', refOf(i)).showSeries === undefined),
  () => `A11: labels on the steps (rise, fall), none on the base or the parts below 0: ${JSON.stringify(entriesOf(wa, 'labels'))}`);
const CC = CAPS.columnChart.objects;
chk(() => Object.entries(wa.visual.objects || {}).every(([o, es]) => CC[o] && es.every((e) => Object.keys(e.properties || {}).every((p) => p in CC[o].properties))) && Object.keys(wa.visual.query.queryState).every((r) => CAPS.columnChart.dataRoles.some((d) => d.name === r)),
  () => `A12: every role and property written is in columnChart's capabilities: ${show(wa)}`);
// the result says what was written
chk(() => Array.isArray(AR.waterfallRtl) && AR.waterfallRtl.length === 1 && AR.waterfallRtl[0].written === 'columnChart' && /no Total column/i.test(AR.waterfallRtl[0].what) && /right/.test(AR.waterfallRtl[0].what),
  () => `A13: the build's notes say what was written (a stacked column chart read from the right, no Total column): ${JSON.stringify(AR.waterfallRtl)}`);
// (the reviewer's decision of 19 Oct) the total readable on the leftmost step: a detail label on the rise and fall
// series, a Text measure with a value on the last step only; the wording in the person's terms
const totDax = (measureOf(ext, 'Waterfall total label: Total Sales') || {}).expression || '';
chk(() => totDax.includes("VAR _last = CALCULATE ( MAXX ( FILTER ( ALL ( 'Sales'[Month Number] ), NOT ISBLANK ( 'Sales'[Total Sales] ) ), 'Sales'[Month Number] ), REMOVEFILTERS ( 'Sales'[Month Name] ) ) RETURN IF ( NOT ISBLANK ( _y ) && _o = _last, \"الإجمالي \" & FORMAT ( _e, \"#,0\" ) )"),
  () => `A17: the total's label: the running total, as text after «الإجمالي», on the last month with a value only: ${totDax}`);
chk(() => [1, 2].every((i) => { const l = bySel(wa, 'labels', refOf(i)); return lit(l.enableDetailDataLabel) === 'true' && lit(l.detailContentType) === "'Custom'" && l.dynamicLabelDetail.expr.Measure.Property === 'Waterfall total label: Total Sales' && l.dynamicLabelDetail.expr.Measure.Expression.SourceRef.Schema === 'extension'; }),
  () => `A18: the rise and fall labels carry the total's label as their detail line: ${JSON.stringify(entriesOf(wa, 'labels'))}`);
chk(() => [AR.waterfallRtl[0].what, Mirror.KIND_WHAT.waterfall].every((t) => /^(waterfall charts: )?no Total column in Arabic: the last step on the left ends at the total/.test(t)),
  () => `A19: the notes and the twin's mirrors say it in the person's terms first: ${AR.waterfallRtl[0].what} / ${Mirror.KIND_WHAT.waterfall}`);
// a name the model already has: the free name
const AR2 = get(() => build('ar', null, { Sales: ['Waterfall base: Total Sales', 'Total Sales'] })), wa2 = AR2.files && typed(AR2, 'columnChart');
chk(() => nameOfProj(ys(wa2)[0]) === 'Waterfall base: Total Sales (2)' && measureOf(extOf(AR2), 'Waterfall base: Total Sales (2)') && !measureOf(extOf(AR2), 'Waterfall base: Total Sales'),
  () => `A14: a measure name the model has is never reused ("(2)"): ${AR2.threw || show(wa2)}`);

// a quarter as text with no sort-by column: its A to Z order (the writer's own rule for such an axis), compared as text
{
  const QTR = C('Quarter', { kind: 'quarter' }), r = get(() => build('ar', bindWith(QTR, { date: QTR }))), v = r.files && typed(r, 'columnChart');
  const run = r.files ? (measureOf(extOf(r), 'Waterfall running total: Total Sales') || {}).expression || '' : '';
  chk(() => v && JSON.stringify(sort0(v).field) === JSON.stringify(C0('Quarter')) && sort0(v).direction === 'Descending' && run.includes("FILTER ( ALL ( 'Sales'[Quarter] ), 'Sales'[Quarter] <= _o )") && !run.includes('REMOVEFILTERS'),
    () => `A15: a waterfall by a quarter text: Descending by the quarter itself (Q1 at the right), the running total over the quarters up to this one A to Z: ${r.threw || show(v)} ${run}`);
}
// a month name the MODEL sorts by its number (no sortBy on the field; the MCP passes the model's columns): by that column
{
  const ORD = C('Month Name', { kind: 'month', ordered: true }), d = E.fresh(); d.font = 'Tahoma'; E.repairState(d);
  const r = get(() => Px.build({ name: 'WF ord', title: 'WF', pageName: 'P', lang: 'ar', rtl: true, font: d.font, ui: d.ui, theme: E.buildTheme(d, 'ar'), sample: false,
    model: { byPath: 'M.SemanticModel', columns: { Sales: { 'Month Name': { type: 'string', sortBy: 'Month Number' }, 'Month Number': { type: 'int64' } } } }, bind: bindWith(ORD, { date: ORD }), texts: E.REPORT_TEXTS.ar, chartAxes: 'mirrored', gallery: true,
    pages: [{ name: 'P', page: { w: 1280, h: 720 }, slots: [{ kind: 'waterfall', x: 20, y: 20, w: 1240, h: 600 }], panel: null, hand: true, png: new Uint8Array([1]) }] }));
  const v = r.files && typed(r, 'columnChart'), run = r.files ? (measureOf(extOf(r), 'Waterfall running total: Total Sales') || {}).expression || '' : '';
  chk(() => v && JSON.stringify(sort0(v).field) === JSON.stringify(C0('Month Name')) && sort0(v).direction === 'Descending' && run.includes("REMOVEFILTERS ( 'Sales'[Month Name] ), FILTER ( ALL ( 'Sales'[Month Number] ), MAX ( 'Sales'[Month Number], _o ) = _o )"),
    () => `A16: a month the model sorts by Month Number: Descending by the month (Desktop orders it by its number), the running total by Month Number: ${r.threw || show(v)} ${run}`);
}

// ---------- G: the golden, as Desktop will draw it ----------
// Desktop draws a column chart's categories left to right in its sort order: Descending by Min of Month Number. Each
// measure's DAX is evaluated here on made-up months (one fall, one crossing below zero and back) by reading its
// expression: the running total over the months whose number is at most this one's (FILTER ( ALL ( Month Number ),
// MAX ( Month Number, _o ) = _o )), then its RETURN with IF, MIN, MAX, SIGN, NOT, ISBLANK, BLANK and &&.
{
  const VALS = [120, 80, -50, -260, 90, 140, 60, -30, 100, 70, 40, 110], NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const daxOf = (i) => (measureOf(ext, nameOfProj(ys(wa)[i])) || {}).expression || '';
  const evalDax = (dax, monthNo) => {
    // _y: this month's value; _o: its number; _e: the sum over the months with a number at most _o
    const ok = /^VAR _y = 'Sales'\[Total Sales\] VAR _o = MAX \( 'Sales'\[Month Number\] \) VAR _e = CALCULATE \( 'Sales'\[Total Sales\], REMOVEFILTERS \( 'Sales'\[Month Name\] \), FILTER \( ALL \( 'Sales'\[Month Number\] \), MAX \( 'Sales'\[Month Number\], _o \) = _o \) \) VAR _s = _e - _y VAR _lo = MIN \( _s, _e \) VAR _hi = MAX \( _s, _e \) RETURN (.*)$/.exec(dax);
    if (!ok) throw new Error('unexpected DAX: ' + dax.slice(0, 300));
    const _y = VALS[monthNo - 1], _e = VALS.slice(0, monthNo).reduce((a, b) => a + b, 0), _s = _e - _y, _lo = Math.min(_s, _e), _hi = Math.max(_s, _e);
    const js = ok[1].replace(/BLANK \(\)/g, 'null').replace(/ISBLANK \(/g, 'ISBLANK(').replace(/\bIF \(/g, 'IF(').replace(/\bMIN \(/g, 'Math.min(').replace(/\bMAX \(/g, 'Math.max(').replace(/\bSIGN \(/g, 'Math.sign(').replace(/\bNOT \(/g, '!(').replace(/ = /g, ' === ');
    if (/[A-Za-z]{3,}/.test(js.replace(/Math\.(min|max|sign)|ISBLANK|IF|null|_lo|_hi|_e|_s|_y/g, ''))) throw new Error('a DAX word the golden does not know: ' + js);
    const IF = (c, a, b) => (c ? a : b === undefined ? null : b), ISBLANK = (x) => x == null;
    return new Function('IF', 'ISBLANK', '_y', '_e', '_s', '_lo', '_hi', 'return (' + js + ');')(IF, ISBLANK, _y, _e, _s, _lo, _hi);   // eslint-disable-line no-new-func
  };
  let drawn = null, err = '';
  try {
    // the sort: Descending by the month number -> left to right
    const order = NAMES.map((n, i) => ({ n, no: i + 1 })).sort((a, b) => (sort0(wa).direction === 'Descending' ? b.no - a.no : a.no - b.no));
    // each column: the stacked series in their order, positives up from 0 and negatives down from 0, as Power BI stacks
    drawn = order.map(({ n, no }) => {
      let up = 0, down = 0; const segs = [];
      [0, 1, 2, 3, 4].forEach((i) => { const v = evalDax(daxOf(i), no); if (v == null || v === 0) return; if (v > 0) { segs.push({ part: PARTS[i], from: up, to: up + v }); up += v; } else { segs.push({ part: PARTS[i], from: down, to: down + v }); down += v; } });
      const shown = segs.filter((s) => s.part !== 'base'), lo = Math.min(...shown.map((s) => Math.min(s.from, s.to))), hi = Math.max(...shown.map((s) => Math.max(s.from, s.to)));
      return { n, lo, hi, rise: shown.every((s) => /rise/.test(s.part)), fall: shown.every((s) => /fall/.test(s.part)), run: evalDax(runDax, no) };
    });
  } catch (e) { err = String(e && e.message || e); }
  const sum = (k) => VALS.slice(0, k).reduce((a, b) => a + b, 0);
  chk(() => drawn && drawn.map((d) => d.n).join() === 'Dec,Nov,Oct,Sep,Aug,Jul,Jun,May,Apr,Mar,Feb,Jan', () => `G1: Desktop's order left to right: Dec ... Jan (January at the RIGHT): ${err || JSON.stringify(drawn && drawn.map((d) => d.n))}`);
  chk(() => drawn[11].lo === 0 && drawn[11].hi === 120 && drawn[11].rise, () => `G2: January's step, at the right end, rises from 0 to its value: ${err || JSON.stringify(drawn && drawn[11])}`);
  // every step spans from the running total before it (the column at its right) to its own running total, coloured by its sign
  chk(() => drawn.every((d, i) => { const k = 12 - i, a = sum(k - 1), b = sum(k); return d.lo === Math.min(a, b) && d.hi === Math.max(a, b) && (VALS[k - 1] > 0 ? d.rise : d.fall) && d.run === b; }),
    () => `G3: each step starts where the one at its right ended (crossing below zero and back too), rises and falls coloured as such, its tooltip's running total: ${err || JSON.stringify(drawn)}`);
  chk(() => Math.max(drawn[0].lo, drawn[0].hi) === sum(12) || Math.min(drawn[0].lo, drawn[0].hi) === sum(12), () => `G4: December, the leftmost step, ends at the year's total ${sum(12)}: ${err || JSON.stringify(drawn && drawn[0])}`);
}

// ---------- F: the fallback: a waterfall by a text category with no order of its own (sorted by its measure) ----------
{
  const STAGE = C('Stage', { kind: 'stage', rows: 5 });
  const B = bindWith(STAGE, { date: null }), en = get(() => build('en', B)), ar = get(() => build('ar', B));
  const ve = en.files && typed(en, 'waterfallChart'), va = ar.files && typed(ar, 'waterfallChart');
  chk(() => ve && va && JSON.stringify(va.visual.query.sortDefinition) === JSON.stringify(ve.visual.query.sortDefinition) && lit(plainOf(va, 'valueAxis').switchAxisPosition) === 'true' && !typed(ar, 'columnChart'),
    () => `F1: a waterfall the measures can't order stays a waterfall, its order as in English (left to right), the value axis at the right: ${ar.threw || show(va)} vs ${show(ve)}`);
  chk(() => ar.waterfallRtl && ar.waterfallRtl[0] && ar.waterfallRtl[0].written === 'waterfallChart' && /reads left to right in Power BI: its order is not mirrored/.test(ar.waterfallRtl[0].what),
    () => `F2: and the notes say so: ${JSON.stringify(ar.waterfallRtl)}`);
}

// ---------- the twin of the writer's English report: the same visual as the direct Arabic one ----------
const twinOfEn = (r) => {
  const out = []; let wfm = []; const mine = (t, want, expression, dataType, formatString) => { const had = wfm.find((x) => x.t === t && x.expression === expression); if (had) return had.m; wfm.push({ t, m: want, expression, dataType, formatString }); return want; };
  const files = (r.files || []).map((f) => {
    if (!/visual\.json$/.test(f.path)) return f;
    const pj = r.files.find((x) => x.path === f.path.replace(/visuals\/[^/]+\/visual\.json$/, 'page.json')), W = pj ? JSON.parse(String(pj.data)).width : 1280;   // (each page's own width: the tooltip page is 320)
    const v = JSON.parse(String(f.data)), m = Mirror.mirrorVisual(v, W, { timeRightToLeft: true, waterfall: { extMeasure: mine, theme: JSON.parse(String((r.files.find((x) => /-theme\.json$/.test(x.path)) || {}).data || '{}')) } });
    out.push(m); return Object.assign({}, f, { data: JSON.stringify(m.json, null, 2) });
  });
  return { files, results: out, measures: wfm };
};
const TW = EN.files ? get(() => twinOfEn(EN)) : null, wt = TW && TW.files && typed(TW, 'columnChart');
chk(() => wt && JSON.stringify(wt.visual.query) === JSON.stringify(wa.visual.query) && JSON.stringify(wt.visual.objects) === JSON.stringify(Object.assign({}, wa.visual.objects)),
  () => `T0: the twin of the English report writes the same visual as the direct Arabic report (query and formatting): ${TW && TW.threw || show(wt)} vs ${show(wa)}`);
chk(() => TW.measures.length === 7 && TW.measures.every((m) => (measureOf(ext, m.m) || {}).expression === m.expression), () => `T0b: and the same measures, the same DAX: ${JSON.stringify(TW && TW.measures).slice(0, 400)}`);
chk(() => /stacked column chart/.test(Mirror.KIND_WHAT.waterfall) && /no Total column/i.test(Mirror.KIND_WHAT.waterfall) && /right/.test(Mirror.KIND_WHAT.waterfall) && /left to right in Power BI: its order is not mirrored/.test(Mirror.KIND_WHAT.waterfallKept || ''),
  () => `T0c: the twin's "mirrors" says exactly what is written: ${Mirror.KIND_WHAT.waterfall} / ${Mirror.KIND_WHAT.waterfallKept}`);

// ---------- the approval page: a plan's waterfalls said before the click (plan_layout's waterfallRtl, the plan's data) ----------
{
  const AW = await import('./lib/approval-window.mjs');
  const page = get(() => AW.summary('report', { waterfallRtl: [{ page: 'Overview', title: 'Sales bridge', written: 'stacked column chart drawn as a waterfall', what: AR.waterfallRtl[0].what }], pins: { create_report: { name: 'R', lang: 'ar' } } }));
  const sec = page && page.sections ? page.sections.find((x) => /^Waterfalls, right to left \(1\)$/.test(x.heading)) : null;
  chk(() => sec && /Overview: Sales bridge/.test(sec.rows[0][0]) && /stacked column chart/.test(sec.rows[0][1]) && /no Total column/.test(sec.rows[0][1]),
    () => `P1: the approval page lists each waterfall and what it is written as: ${JSON.stringify(page).slice(0, 600)}`);
  const sv = fs.readFileSync(path.join(HERE, 'server.mjs'), 'utf8');
  chk(() => /waterfall \(gallery\) is written as a stacked column chart drawn as a waterfall, read from the right/.test(sv) && /no Total column in Arabic: the last step on the left ends at the total/.test(sv) && /reportNotes\.push\(`The waterfall/.test(sv),
    () => 'P2: create_report\'s chartAxes note, its report notes and plan_layout\'s waterfallRtl say what is written');
}

// ---------- T and V: through the server: check_report on the writer's reports; the twin of a report with waterfalls ----------
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-wf2-'));
const s = await serverClient(ROOT);
const ask = async (name, args) => { try { return await s.call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
const short = (x) => (x.err ? x.t.slice(0, 400) : JSON.stringify(x.j).slice(0, 400));
try {
  // V: the writer's reports (Arabic, English, the fallback) through Microsoft's validator (offline) and check_report
  const cli = path.join(HERE, 'node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js');
  const STAGE = C('Stage', { kind: 'stage', rows: 5 }), FB = get(() => build('ar', bindWith(STAGE, { date: null })));
  for (const [what, r] of [['ar', AR], ['en', EN], ['twin of en', TW], ['fallback ar', FB]]) {
    if (!r || !r.files) { chk(() => false, () => `V ${what}: no report was written`); continue; }
    const dir = path.join(ROOT, 'w-' + what.replace(/\W+/g, '-'));
    r.files.forEach((f) => { const p = path.join(dir, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
    if (what === 'twin of en') { const e = { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/reportExtension/1.0.0/schema.json', name: 'extension', entities: [] };
      const prev = extOf(EN); if (prev) e.entities = prev.entities; TW.measures.forEach((m) => { let en = e.entities.find((x) => x.name === m.t); if (!en) e.entities.push(en = { name: m.t, measures: [] }); en.measures.push(Object.assign({ name: m.m, dataType: m.dataType, expression: m.expression }, m.formatString ? { formatString: m.formatString } : {})); });
      const rd = fs.readdirSync(dir).find((d) => /\.Report$/.test(d)); fs.writeFileSync(path.join(dir, rd, 'definition/reportExtensions.json'), JSON.stringify(e, null, 2)); }
    const rd = path.join(dir, fs.readdirSync(dir).find((d) => /\.Report$/.test(d)) || ''), pv = spawnSync(process.execPath, [cli, 'validate', rd], { encoding: 'utf8' });
    let vd = null; try { vd = JSON.parse(pv.stdout).data; } catch (e) { vd = null; }
    chk(() => vd && vd.errorCount === 0, () => `V ${what}: Microsoft's validator: 0 errors: ${vd ? JSON.stringify(Object.entries(vd.diagnostics || {}).filter(([, d]) => d.severity === 'error').map(([k, d]) => k + ': ' + String(d.items[0].message).slice(0, 200))) : String(pv.stdout || pv.stderr).slice(0, 300)}`);
    const pbip = fs.readdirSync(dir).find((d) => /\.pbip$/.test(d)), cr = await ask('check_report', { path: path.relative(ROOT, path.join(dir, pbip)), lang: what === 'en' ? 'en' : 'ar' });
    chk(() => !cr.err && cr.j.impact.kinds.canBreak.count === 0, () => `V ${what}: check_report: 0 "can break": ${short(cr)} ${cr.j ? JSON.stringify((cr.j.findings || []).filter((f) => f.impact === 'canBreak')).slice(0, 400) : ''}`);
  }

  // T: the twin, on a copy of the made-up twin project with two waterfalls added: by month (the model sorts Month Name by
  // Month Number) and by region sorted by its measure (the fallback)
  const P = path.join(ROOT, 'wft');
  fs.cpSync(path.join(HERE, 'fixtures/twin-project'), P, { recursive: true });
  const VIS = path.join(P, 'Twin Sales.Report/definition/pages/p2details/visuals');
  const col = (t, c) => ({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c });
  const mea = (t, m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m });
  const wf = (name, x, cat, sort) => ({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json', name, position: { x, y: 700, z: 20000 + x, height: 300, width: 800, tabOrder: 20000 + x },
    visual: { visualType: 'waterfallChart', query: Object.assign({ queryState: { Category: { projections: [cat] }, Y: { projections: [mea('Sales', 'Total Sales')] } } }, sort ? { sortDefinition: sort } : {}),
      visualContainerObjects: { title: [{ properties: { show: { expr: { Literal: { Value: 'true' } } }, text: { expr: { Literal: { Value: "'Sales bridge'" } } } } }] } } });
  [['wfMonth', wf('wfMonth', 40, col('Calendar', 'Month Name'))], ['wfRegion', wf('wfRegion', 1000, col('Sales', 'Region'), { sort: [{ field: mea('Sales', 'Total Sales').field, direction: 'Descending' }], isDefaultSort: true })]]
    .forEach(([n, v]) => { fs.mkdirSync(path.join(VIS, n), { recursive: true }); fs.writeFileSync(path.join(VIS, n, 'visual.json'), JSON.stringify(v, null, 2)); });
  const plan = await ask('create_arabic_twin', { path: 'wft/Twin Sales.pbip' });
  const mirrors = JSON.stringify((plan.j || {}).mirrors || []), cannot = JSON.stringify((plan.j || {}).cannot || []);
  chk(() => !plan.err && (plan.j.mirrors || []).some((m) => m.kind === 'waterfall' && m.count === 1 && /stacked column chart/.test(m.what) && /no Total column/i.test(m.what)),
    () => `T1: the plan's "mirrors" says the waterfall is written as a stacked column chart read from the right, with no Total column: ${short(plan)} ${mirrors.slice(0, 600)}`);
  chk(() => /wfRegion/.test(cannot) && /reads left to right in Power BI: its order is not mirrored/.test(cannot), () => `T2: the kept waterfall is listed under "cannot", with why: ${cannot.slice(0, 900)}`);
  const pid = plan.j && plan.j.plan && plan.j.plan.planId;
  await ask('approve_plan', { planId: pid });
  const w = await ask('create_arabic_twin', { path: 'wft/Twin Sales.pbip', planId: pid });
  chk(() => !w.err && w.j.written === true, () => `T3: the approved twin is written: ${short(w)}`);
  const TWD = path.join(P, 'Twin Sales AR.Report'), rdj = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
  const vm = get(() => rdj(path.join(TWD, 'definition/pages/p2details/visuals/wfMonth/visual.json'))), vr = get(() => rdj(path.join(TWD, 'definition/pages/p2details/visuals/wfRegion/visual.json')));
  const te = get(() => rdj(path.join(TWD, 'definition/reportExtensions.json')));
  const cal = JSON.stringify(col('Calendar', 'Month Name').field);
  chk(() => vm.visual.visualType === 'columnChart' && ys(vm).length === 5 && ys(vm).every((p, i) => p.field.Measure.Expression.SourceRef.Schema === 'extension' && p.field.Measure.Expression.SourceRef.Entity === 'Sales' && nameOfProj(p) === 'Waterfall ' + PARTS[i] + ': Total Sales')
    && sort0(vm).direction === 'Descending' && JSON.stringify(sort0(vm).field) === cal && lit(plainOf(vm, 'valueAxis').switchAxisPosition) === 'true' && lit(plainOf(vm, 'legend').show) === 'false' && vm.position.x === 1920 - 40 - 800,
    () => `T4: the twin's waterfall by month: a stacked column chart, the 5 report measures, sorted Descending by Month Name (the model orders it by Month Number), value axis right, no legend, mirrored place: ${show(vm)}`);
  const trun = te && measureOf(te, 'Waterfall running total: Total Sales');
  chk(() => trun && trun.entity === 'Sales' && trun.expression.includes("CALCULATE ( 'Sales'[Total Sales], REMOVEFILTERS ( 'Calendar'[Month Name] ), FILTER ( ALL ( 'Calendar'[Month Number] ), MAX ( 'Calendar'[Month Number], _o ) = _o ) )") && trun.formatString === '#,0'
    && te.entities.flatMap((e) => e.measures).filter((m) => /^Waterfall /.test(m.name)).length === 7,
    () => `T5: the twin's own reportExtensions.json holds the seven measures, the running total by the model's sort-by column (Month Number), the measure's format: ${JSON.stringify(te).slice(0, 700)}`);
  chk(() => vr.visual.visualType === 'waterfallChart' && sort0(vr).direction === 'Descending' && JSON.stringify(sort0(vr).field) === JSON.stringify(mea('Sales', 'Total Sales').field) && lit(plainOf(vr, 'valueAxis').switchAxisPosition) === 'true',
    () => `T6: the waterfall sorted by its measure is kept a waterfall, its order as the original's (left to right), the value axis at the right: ${show(vr)}`);
  chk(() => !fs.existsSync(path.join(P, 'Twin Sales.Report/definition/reportExtensions.json')), () => 'T7: the original report is not given measures (the twin only)');
  const cr = await ask('check_report', { path: 'wft/Twin Sales AR.pbip', lang: 'ar' });
  chk(() => !cr.err && cr.j.validator.ran && cr.j.validator.errors === 0 && cr.j.impact.kinds.canBreak.count === 0, () => `V twin: Microsoft's validator 0 errors and check_report 0 "can break" on the twin: ${short(cr)}`);
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

if (problems.length) { console.log(`FAIL  waterfall-rtl2  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  waterfall-rtl2  ${checks} checks`);
