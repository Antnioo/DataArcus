// 0.3, J8: the visual gallery's foundation (assets/js/visual-gallery.js). Three of Power BI's own visuals behind the
// design flag gallery: true: combo (line and clustered column), waterfall, small multiples on a column chart. Written
// red first. On made-up models only, built straight with the shared writer (no server needed):
//   R  when each kind fits, from the fields' roles only (never from data)
//   W  the writer: the flag off writes the plain kind and says why; on, the native visual with only roles and
//      properties Microsoft's capabilities list for its type (@microsoft/powerbi-core-visual-schema, the version
//      mcp/package.json pins)
//   T  titles (English, Arabic, never half and half) and the alt text the writer gives them
//   V  Microsoft's validator: 0 errors on the written samples, English and Arabic (right to left)
//   node test-0.3-gallery.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const req = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e) }; } };

const GPATH = path.join(REPO, 'assets/js/visual-gallery.js');
const G = fs.existsSync(GPATH) ? req(GPATH) : null;
chk(() => !!G, () => 'assets/js/visual-gallery.js exists and loads in Node');
const Px = req('../assets/js/pbip-export.js'), E = req('../assets/js/design-engine.js');
const CAPS = JSON.parse(fs.readFileSync(path.join(HERE, 'node_modules/@microsoft/powerbi-core-visual-schema/data/capabilities.json'), 'utf8'));

// ---------- made-up fields (a retail model; no employer or client data) ----------
const T = 'Sales', M = (m, x) => Object.assign({ t: T, m }, x || {}), C = (c, x, t) => Object.assign({ t: t || T, c }, x || {});
const AED = M('Total Sales', { cardFormat: '"AED" #,0' }), AED2 = M('Total Cost', { cardFormat: '"AED" #,0' }), PCT = M('Margin %', { pct: true, pctFormat: '0.0%' }), PLAIN = M('Units');
const MONTH = C('Month Name', { kind: 'month', sortBy: { t: T, c: 'Month Number' } }), QUARTER = C('Quarter', { kind: 'quarter' }), CITY = C('City'), REGION = C('Region', { kind: 'region', rows: 5 });
const base = (x) => Object.assign({ kpis: [AED, PCT], measure: AED, date: MONTH, cats: { bar: CITY, column: QUARTER, donut: C('Channel'), split: REGION }, y: {},
  table: [CITY, AED], slicers: [CITY, null, null], tip: { card: AED, cat: CITY, y: AED } }, x || {});
const fit = (k, B) => (G ? G.fits(k, B) : { fits: undefined });
// (0.3.0 J19, changed on purpose: two measures in one currency share a combo's axis only when the person confirmed they
// compare; these builds carry that confirmation, a record of the confirmation memory, axis-units.js)
const AXR = req('../assets/js/axis-units.js'), ok2 = (a, b) => ({ axes: { confirmed: [AXR.record(a, b, 'comparable', [])] } });

// ---------- R: when each kind fits ----------
if (G) {
  chk(() => JSON.stringify(G.KIND_NAMES) === '["combo","waterfall","multiples"]' && G.typeOf('combo') === 'lineClusteredColumnComboChart' && G.typeOf('waterfall') === 'waterfallChart' && G.typeOf('multiples') === 'clusteredColumnChart' && G.typeOf('bar') === null,
    () => `R: three kinds, each Power BI's own visual type: ${JSON.stringify(G.KINDS)}`);
  chk(() => G.KIND_NAMES.every((k) => req('../assets/js/visual-types.js').isNative(G.typeOf(k))), () => 'R: every gallery type is in Microsoft\'s catalog (visual-types.js)');
  // units from metadata only
  chk(() => G.unitOf(AED) === 'currency' && G.unitOf(PCT) === 'percent' && G.unitOf(M('Orders', { wholeFormat: '#,0' })) === 'count' && G.unitOf(Object.assign(C('Id'), { agg: 2 })) === 'count' && G.unitOf(PLAIN) === null && G.unitOf(CITY) === null,
    () => `R: a measure's unit from its format and role: ${[AED, PCT, PLAIN].map(G.unitOf)}`);
  // combo
  let r = fit('combo', base());
  // (0.3.0 D2, the outside audit's C13, changed on purpose: no automatic secondary axis) an amount and a percent are two panels
  chk(() => !r.fits && r.split === true && /different units/.test(r.why) && r.fields.columns === AED && r.fields.line === PCT && r.fields.axis === MONTH, () => `R combo: an amount and a percent over months are two panels, never a second axis: ${JSON.stringify(r)}`);
  r = fit('combo', base(Object.assign({ kpis: [AED, AED2] }, ok2(AED, AED2))));
  chk(() => r.fits && r.secondary === false, () => `R combo: two amounts in one currency share one axis: ${JSON.stringify(r)}`);
  r = fit('combo', base({ kpis: [AED, PLAIN] }));
  chk(() => !r.fits && r.split === true && /not known/.test(r.why), () => `R combo: a unit not known is two panels (D2, C13), never a second axis: ${JSON.stringify(r)}`);
  r = fit('combo', base({ measure: PCT, kpis: [PCT, AED] }));
  chk(() => r.fields.columns === AED && r.fields.line === PCT, () => `R combo: a percent is the line, never the columns: ${JSON.stringify(r.fields)}`);
  r = fit('combo', base({ date: null, cats: { combo: CITY } }));
  chk(() => !r.fits && /not time or ordered/.test(r.why), () => `R combo: a line across unordered categories (City) does not fit: ${JSON.stringify(r)}`);
  r = fit('combo', base({ kpis: [AED] }));
  chk(() => !r.fits && /two measures/.test(r.why), () => `R combo: one measure does not fit: ${JSON.stringify(r)}`);
  r = fit('combo', base({ date: null }));
  chk(() => !r.fits, () => 'R combo: no time axis, no combo');
  // waterfall
  r = fit('waterfall', base({ date: QUARTER }));
  chk(() => r.fits && r.fields.cat === QUARTER && r.fields.y === AED, () => `R waterfall: an amount by quarter fits: ${JSON.stringify(r)}`);
  chk(() => !fit('waterfall', base({ measure: PCT })).fits && !fit('waterfall', base({ measure: M('Average Price') })).fits && !fit('waterfall', base({ measure: Object.assign(C('Customer Id'), { agg: 2 }) })).fits && !fit('waterfall', base({ measure: M('متوسط المبيعات') })).fits,
    () => 'R waterfall: a percent, an average (English or Arabic) or a distinct count does not add up: no waterfall');
  r = fit('waterfall', base({ date: null, cats: { column: CITY } }));
  chk(() => !r.fits && /not known/.test(r.why), () => `R waterfall: a category whose number of members is not known (City) does not fit: ${JSON.stringify(r)}`);
  chk(() => !fit('waterfall', base({ date: C('Week', { kind: 'week', rows: 53 }) })).fits && fit('waterfall', base({ date: C('Stage', { kind: 'stage', rows: 5, ordered: true }) })).fits,
    () => 'R waterfall: 53 weeks are too many; 5 stages fit');
  // multiples
  r = fit('multiples', base());
  chk(() => r.fits && r.fields.cat === QUARTER && r.fields.split === REGION, () => `R multiples: quarters per region (5) fit: ${JSON.stringify(r)}`);
  chk(() => !fit('multiples', base({ cats: { column: QUARTER } })).fits, () => 'R multiples: no second category, no panels');
  chk(() => !fit('multiples', base({ cats: { column: QUARTER, split: QUARTER } })).fits, () => 'R multiples: the axis\'s own category is no split');
  chk(() => !fit('multiples', base({ cats: { column: QUARTER, split: MONTH } })).fits, () => 'R multiples: a time split does not fit');
  chk(() => !fit('multiples', base({ cats: { column: QUARTER, split: C('Store', { rows: 40 }) } })).fits, () => 'R multiples: 40 members are too many panels');
  chk(() => !fit('multiples', base({ cats: { column: QUARTER, split: C('Customer Name') } })).fits && !fit('multiples', base({ cats: { column: QUARTER, split: C('ProductID') } })).fits && !fit('multiples', base({ cats: { column: QUARTER, split: C('اسم العميل') } })).fits,
    () => 'R multiples: a name or an id (English or Arabic) has many members: no panels');
  chk(() => fit('multiples', base({ cats: { column: QUARTER, split: C('Segment') } })).fits, () => 'R multiples: a grouping category without a known count (Segment) fits');
  // (D2: the combo's two measures in one unit)
  chk(() => JSON.stringify(G.pick(base(Object.assign({ kpis: [AED, AED2] }, ok2(AED, AED2)))).map((x) => x.kind)) === '["combo","waterfall","multiples"]' && JSON.stringify(G.pick(base({ ...ok2(AED, AED2), kpis: [AED, AED2], date: C('Order Date', { type: 'dateTime', time: true }), cats: { column: CITY } })).map((x) => x.kind)) === '["combo"]',
    () => `R: pick lists the kinds that fit a report's fields: ${JSON.stringify(G.pick(base({ kpis: [AED, AED2] })))}`);
  // never data: the rules read no rows (the module names no query, no DAX evaluation, no file)
  const src = fs.readFileSync(GPATH, 'utf8');
  chk(() => !/EVALUATE|executeQuery|readFile|fetch\(|XMLHttpRequest/.test(src), () => 'R: the gallery reads no data and no file');
}

// ---------- the writer ----------
const build = (bind, o = {}) => {
  const lang = o.lang || 'en', d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma';
  E.repairState(d);
  const extra = Object.assign({}, o); delete extra.lang; delete extra.slots;
  return Px.build(Object.assign({ name: o.name || 'G', title: 'G', pageName: 'P', lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), sample: false,
    model: { byPath: 'M.SemanticModel' }, bind, texts: E.REPORT_TEXTS[lang], chartAxes: 'mirrored', quietGrid: true,
    pages: [{ name: 'P', page: { w: 1280, h: 720 }, slots: o.slots || SLOTS, panel: null, hand: true, png: new Uint8Array([1]) }] }, extra));
};
const SLOTS = [{ kind: 'combo', x: 20, y: 20, w: 610, h: 330 }, { kind: 'waterfall', x: 650, y: 20, w: 610, h: 330 }, { kind: 'multiples', x: 20, y: 370, w: 1240, h: 330 }];
const visuals = (r) => (r.files || []).filter((f) => /visual\.json$/.test(f.path)).map((f) => JSON.parse(String(f.data))).filter((v) => v.visual);
const S = (p) => { const v = p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value) : undefined; return v == null ? undefined : v.replace(/^'|'$/g, '').replace(/''/g, "'"); };
const titleOf = (v) => S((((v.visual.visualContainerObjects || {}).title || [])[0] || { properties: {} }).properties.text);
const altOf = (v) => S((((v.visual.visualContainerObjects || {}).general || [])[0] || { properties: {} }).properties.altText);
const types = (r) => visuals(r).map((v) => v.visual.visualType);
// (D2: the combo's two measures in one unit, so it is one chart; two units are two panels)
const BW = base({ ...ok2(AED, AED2), kpis: [AED, AED2], date: QUARTER, cats: { bar: CITY, column: C('Channel', { kind: 'channel', rows: 4 }), donut: C('Channel'), split: REGION } });   // the waterfall by quarter; the multiples by channel per region

// W1: the flag off: the plain kinds, each told with its reason
{
  const r = get(() => build(BW));
  chk(() => r.files && !types(r).some((t) => /Combo|waterfall/.test(t)) && types(r).includes('lineChart') && types(r).filter((t) => t === 'clusteredColumnChart').length === 2 && !visuals(r).some((v) => (v.visual.query || {}).queryState && v.visual.query.queryState.Rows),
    () => `W1: without gallery: true the slots are a line chart and two column charts, no small multiples: ${r.threw || JSON.stringify(types(r))}`);
  chk(() => r.gallery && r.gallery.length === 3 && r.gallery.every((g) => /flag is off/.test(g.why)) && JSON.stringify(r.gallery.map((g) => g.from + '>' + g.to)) === '["combo>line","waterfall>column","multiples>column"]',
    () => `W1: each told (gallery: from, to, why): ${JSON.stringify(r.gallery)}`);
  const r0 = get(() => build(BW, { slots: [{ kind: 'bar', x: 20, y: 20, w: 600, h: 300 }] }));
  chk(() => r0.files && !('gallery' in r0), () => 'W1: a report without gallery slots and without the flag has no gallery key (the result is as before)');
}
// W2: the flag on: the native visuals, their roles and properties Microsoft's own
let RW = null;
{
  const r = RW = get(() => build(BW, { gallery: true }));
  const by = (t) => visuals(r).find((v) => v.visual.visualType === t);
  const combo = r.files && by('lineClusteredColumnComboChart'), wf = r.files && by('waterfallChart'), sm = r.files && visuals(r).find((v) => v.visual.query && v.visual.query.queryState.Rows);
  chk(() => combo && wf && sm && sm.visual.visualType === 'clusteredColumnChart' && r.gallery.length === 0, () => `W2: with gallery: true, the three native visuals: ${r.threw || JSON.stringify(types(r))} ${JSON.stringify(r.gallery)}`);
  const qs = (v) => v.visual.query.queryState, name = (v, role) => qs(v)[role].projections.map((p) => p.nativeQueryRef);
  chk(() => JSON.stringify(name(combo, 'Category')) === '["Quarter"]' && JSON.stringify(name(combo, 'Y')) === '["Total Sales"]' && JSON.stringify(name(combo, 'Y2')) === '["Total Cost"]',
    () => `W2 combo: one amount as columns (Y), the other as the line (Y2), by quarter: ${JSON.stringify(qs(combo))}`);
  const va = (v) => (((v.visual.objects || {}).valueAxis || [])[0] || { properties: {} }).properties;
  // (D2, C13, changed on purpose: the secondary axis is never shown; two units are two panels, U below)
  chk(() => S(va(combo).secShow) === 'false', () => `W2 combo: one shared axis (valueAxis.secShow false): ${JSON.stringify(combo.visual.objects)}`);
  const same = get(() => build(base({ ...ok2(AED, AED2), kpis: [AED, AED2], date: QUARTER }), { gallery: true, slots: [SLOTS[0]] })), c2 = same.files && visuals(same).find((v) => v.visual.visualType === 'lineClusteredColumnComboChart');
  chk(() => c2 && S(va(c2).secShow) === 'false', () => `W2 combo: one unit: one shared axis (secShow false): ${same.threw || JSON.stringify(c2 && c2.visual.objects)}`);
  chk(() => JSON.stringify(name(wf, 'Category')) === '["Quarter"]' && JSON.stringify(name(wf, 'Y')) === '["Total Sales"]' && !qs(wf).Breakdown, () => `W2 waterfall: one measure by one category: ${JSON.stringify(qs(wf))}`);
  chk(() => JSON.stringify(name(sm, 'Category')) === '["Channel"]' && JSON.stringify(name(sm, 'Rows')) === '["Region"]', () => `W2 multiples: the column chart by channel, a panel per region (Rows): ${JSON.stringify(qs(sm))}`);
  // every role and property of the three is in Microsoft's capabilities for its type
  const outside = [];
  [combo, wf, sm].filter(Boolean).forEach((v) => {
    const cap = CAPS[v.visual.visualType], roles = cap.dataRoles.map((d) => d.name);
    Object.keys(qs(v)).forEach((ro) => { if (!roles.includes(ro)) outside.push(v.visual.visualType + ' role ' + ro); });
    Object.entries(v.visual.objects || {}).forEach(([o, es]) => es.forEach((e) => Object.keys(e.properties || {}).forEach((p) => { if (!(cap.objects[o] && cap.objects[o].properties[p])) outside.push(v.visual.visualType + ' ' + o + '.' + p); })));
  });
  chk(() => !outside.length, () => `W2: only roles and properties Microsoft's capabilities list: ${JSON.stringify(outside)}`);
  // the module's own list of what it writes is Microsoft's too
  chk(() => G && Object.entries(G.WRITES).every(([t, w]) => w.roles.every((ro) => CAPS[t].dataRoles.some((d) => d.name === ro)) && Object.entries(w.objects).every(([o, ps]) => ps.every((p) => CAPS[t].objects[o] && CAPS[t].objects[o].properties[p]))),
    () => 'W2: every role and property in visual-gallery.js WRITES is in the capabilities of its type');
}
// W3: the flag on, the fields don't fit: the plain kind, the rule named
{
  const r = get(() => build(base({ kpis: [AED], date: C('Order Date', { type: 'dateTime', time: true }), cats: { bar: CITY, column: CITY, donut: CITY } }), { gallery: true }));
  chk(() => r.gallery && r.gallery.length === 3 && /two measures/.test(r.gallery[0].why) && /not known/.test(r.gallery[1].why) && /no second category/.test(r.gallery[2].why) && !types(r).some((t) => /Combo|waterfall/.test(t)),
    () => `W3: gallery slots whose fields don't fit are written plain, each with the rule: ${r.threw || JSON.stringify(r.gallery)}`);
}
// W5 (0.3.0 D2, C13): a combo slot in two units is two panels: two line charts in its box, one measure each, no combo
{
  const r = get(() => build(base({ date: QUARTER }), { gallery: true, slots: [SLOTS[0]] })), ls = r.files ? visuals(r).filter((v) => v.visual.visualType === 'lineChart') : [];
  const pos = ls.map((v) => [v.position.x, v.position.width]).sort((a, b) => a[0] - b[0]);
  chk(() => ls.length === 2 && !types(r).includes('lineClusteredColumnComboChart') && JSON.stringify(ls.map((v) => v.visual.query.queryState.Y.projections[0].nativeQueryRef).sort()) === '["Margin %","Total Sales"]'
    && pos[0][0] === 20 && pos[1][0] + pos[1][1] <= 630 && pos[0][0] + pos[0][1] < pos[1][0] && r.gallery[0].to === 'two panels' && /different units/.test(r.gallery[0].why),
    () => `W5: two panels in the combo's box, told: ${r.threw || JSON.stringify(pos)} ${JSON.stringify(r.gallery)}`);
}
// W4: build's checks: the gallery kinds are known slot kinds; any other is still refused
{
  const bad = get(() => build(BW, { slots: [{ kind: 'sankey', x: 0, y: 0, w: 100, h: 100 }] }));
  chk(() => bad.threw && /combo, waterfall, multiples/.test(bad.threw), () => `W4: an unknown kind is refused, the gallery kinds listed: ${String(bad.threw).slice(0, 300)}`);
}

// ---------- T: titles and alt text ----------
if (RW && RW.files) {
  const ts = visuals(RW).filter((v) => /Combo|waterfall/.test(v.visual.visualType) || (v.visual.query && v.visual.query.queryState.Rows)).map(titleOf);
  chk(() => JSON.stringify(ts) === JSON.stringify(['Total Sales and Total Cost by Quarter', 'Total Sales by Quarter', 'Total Sales by Channel, per Region']),
    () => `T: the titles say what each shows: ${JSON.stringify(ts)}`);
  chk(() => visuals(RW).filter((v) => /Combo|waterfall/.test(v.visual.visualType)).every((v) => altOf(v) === titleOf(v)), () => 'T: the alt text is the full title, as the writer\'s other charts');
}
const ARB = { kpis: [M('إجمالي المبيعات', { cardFormat: '"AED" #,0' }), M('إجمالي التكلفة', { cardFormat: '"AED" #,0' })], measure: M('إجمالي المبيعات', { cardFormat: '"AED" #,0' }),
  date: C('الربع', { kind: 'quarter' }), cats: { bar: C('المدينة'), column: C('القناة', { kind: 'channel', rows: 4 }), donut: C('القناة'), split: C('المنطقة', { kind: 'region', rows: 5 }) }, y: {},
  table: [C('المدينة'), M('إجمالي المبيعات')], slicers: [C('المدينة'), null, null], tip: { card: M('إجمالي المبيعات'), cat: C('المدينة'), y: M('إجمالي المبيعات') }, ...ok2(M('إجمالي المبيعات'), M('إجمالي التكلفة')) };
let RA = null;
{
  // (D7: the default became waterfallRtl "native"; this build asks for "mirror", D1's chart, as written)
  const r = RA = get(() => build(ARB, { lang: 'ar', gallery: true, name: 'GA', waterfallRtl: 'mirror' }));
  // (in the order of the slots: a right-to-left page writes its visuals in its own reading order)
  // (D1, changed on purpose: the right-to-left waterfall is a stacked column chart, columnChart, drawn as a waterfall)
  const ts = r.files ? [(v) => v.visual.visualType === 'lineClusteredColumnComboChart', (v) => v.visual.visualType === 'columnChart', (v) => !!(v.visual.query && v.visual.query.queryState.Rows)].map((f) => titleOf(visuals(r).find(f) || { visual: {} })) : [];
  chk(() => JSON.stringify(ts) === JSON.stringify(['إجمالي المبيعات وإجمالي التكلفة حسب الربع', 'إجمالي المبيعات حسب الربع', 'إجمالي المبيعات حسب القناة، لكل المنطقة']),
    () => `T: Arabic titles («و», «، لكل»): ${r.threw || JSON.stringify(ts)}`);
  const mixed = G ? G.title('combo', Object.assign({}, ARB, ok2(ARB.measure, AED2), { kpis: [ARB.measure, AED2] }), 'حسب') : null;
  chk(() => mixed === 'إجمالي المبيعات حسب الربع', () => `T: never half Arabic, half English: an English line measure is left out of an Arabic title: ${mixed}`);
  // right to left: mirrored as the other charts (value axis right, categories reversed); the waterfall by its sort
  // (D1, changed on purpose: Desktop 2.159 showed R3's Descending waterfall reverse time, not the direction; the waterfall
  // is now the stacked column chart that reads from the right, sorted Descending by the quarter itself, A to Z being its
  // order (test-0.3.0-waterfall-rtl2.mjs checks its measures and the order Desktop draws))
  const vs = r.files ? visuals(r) : [], wf = vs.find((v) => v.visual.visualType === 'columnChart'), cb = vs.find((v) => v.visual.visualType === 'lineClusteredColumnComboChart');
  const va = (v) => (((v.visual.objects || {}).valueAxis || [])[0] || { properties: {} }).properties, ca = (v) => (((v.visual.objects || {}).categoryAxis || [])[0] || { properties: {} }).properties;
  chk(() => cb && S(va(cb).switchAxisPosition) === 'true' && S(ca(cb).invertAxis) === 'true' && wf && S(va(wf).switchAxisPosition) === 'true' && !(wf.visual.objects || {}).categoryAxis && wf.visual.query.sortDefinition.sort[0].direction === 'Descending' && wf.visual.query.sortDefinition.sort[0].field.Column.Property === 'الربع',
    () => `T: a right-to-left report mirrors the gallery charts (the waterfall by its sort: its category axis has no invertAxis): ${JSON.stringify(cb && cb.visual.objects)} ${JSON.stringify(wf && [wf.visual.objects, wf.visual.query.sortDefinition])}`);
}

// ---------- V: Microsoft's validator on the written samples ----------
{
  const cli = path.join(HERE, 'node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js'), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-gallery-'));
  [['en', RW], ['ar', RA]].forEach(([lang, r]) => {
    if (!r || !r.files) { chk(() => false, () => `V ${lang}: no report was written`); return; }
    const dir = path.join(TMP, lang);
    r.files.forEach((f) => { const p = path.join(dir, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
    const rd = path.join(dir, fs.readdirSync(dir).find((d) => /\.Report$/.test(d)) || ''), pv = spawnSync(process.execPath, [cli, 'validate', rd], { encoding: 'utf8' });
    let vd = null; try { vd = JSON.parse(pv.stdout).data; } catch (e) { vd = null; }
    chk(() => vd && vd.errorCount === 0, () => `V ${lang}: Microsoft's validator: 0 errors on the gallery sample: ${vd ? JSON.stringify(Object.entries(vd.diagnostics || {}).filter(([, d]) => d.severity === 'error').map(([k, d]) => k + ': ' + String(d.items[0].message).slice(0, 200))) : String(pv.stdout || pv.stderr).slice(0, 300)}`);
  });
  fs.rmSync(TMP, { recursive: true, force: true });
}

if (problems.length) { console.log(`FAIL  gallery  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  gallery  ${checks} checks`);
