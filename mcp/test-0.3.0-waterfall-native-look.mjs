// D7 (the owner, 20 Oct, after D1's result: "I want to have the same design of waterfall if somehow we can mirror the
// same design rtl then ok if not then just leave it normal"). Written red first. mcp/work/D7.md has the decision: the
// same design cannot be mirrored (no Total column on a column chart, an axis table breaks the chart until its script is
// applied, the legend cannot leave the base out), so the switch waterfallRtl "mirror" | "native" defaults to "native":
// Power BI's own waterfall, left to right, in the Arabic report too. On made-up fields only:
//   K  the constant: one default, "native"
//   C  colours: the Arabic mirror's rise/fall = the English waterfall's increase/decrease in the written files
//   M  "mirror": D1's chart, falls labelled negative like the English, no legend (the base never an entry), said
//   N  "native": the Arabic waterfall is the English one (waterfallChart, its sort, its formatting), and the plan's sentence
//   P  the plan pins it (plan_layout's reportLook, the approval page); create_report with another value refused, nothing written
//   T  the twin: native keeps the waterfall, mirror the stacked chart; another value than the plan's refused
//   V  Microsoft's validator 0 errors and check_report 0 "can break" on EN, AR (both values) and the twin (both)
//   node test-0.3.0-waterfall-native-look.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';

const req = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e) }; } };
const short = (x) => (!x ? 'no answer' : x.err ? String(x.t).slice(0, 500) : JSON.stringify(x.j).slice(0, 500));

const Px = req('../assets/js/pbip-export.js'), E = req('../assets/js/design-engine.js'), G = req('../assets/js/visual-gallery.js'), Mirror = req('../assets/js/report-mirror.js');
const NATIVE_SAID = 'the waterfall reads left to right, as Power BI draws it';

// ---------- made-up fields (a retail model; no employer or client data) ----------
const T = 'Sales', M = (m, x) => Object.assign({ t: T, m }, x || {}), C = (c, x) => Object.assign({ t: T, c }, x || {});
const AED = M('Total Sales', { cardFormat: '"AED" #,0', tableFormat: '#,0' });
const MONTH = C('Month Name', { kind: 'month', sortBy: { t: T, c: 'Month Number' } });
const B0 = { kpis: [AED], measure: AED, date: MONTH, cats: { bar: C('City'), column: MONTH, donut: C('Channel'), waterfall: MONTH }, y: {}, table: [C('City'), AED], slicers: [C('City'), null, null], tip: { card: AED, cat: C('City'), y: AED } };
const build = (lang, wfRtl) => {
  const d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma';
  E.repairState(d);
  return Px.build(Object.assign({ name: 'WF ' + lang, title: 'WF', pageName: 'P', lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), sample: false,
    model: { byPath: 'M.SemanticModel' }, bind: B0, texts: E.REPORT_TEXTS[lang], chartAxes: 'mirrored', gallery: true,
    pages: [{ name: 'P', page: { w: 1280, h: 720 }, slots: [{ kind: 'waterfall', x: 20, y: 20, w: 900, h: 600 }, { kind: 'bar', x: 940, y: 20, w: 320, h: 600 }], panel: null, hand: true, png: new Uint8Array([1]) }] }, wfRtl ? { waterfallRtl: wfRtl } : {}));
};
const visualFiles = (r) => (r.files || []).filter((f) => /visual\.json$/.test(f.path));
const typed = (r, type) => visualFiles(r).map((f) => JSON.parse(String(f.data))).find((v) => v.visual && v.visual.visualType === type);
const themeOf = (r) => { const f = (r.files || []).find((x) => /-theme\.json$/.test(x.path) || /StaticResources\/.*\.json$/.test(x.path) && /dataColors/.test(String(x.data))); return f ? JSON.parse(String(f.data)) : null; };
const extOf = (r) => { const f = (r.files || []).find((x) => /reportExtensions\.json$/.test(x.path)); return f ? JSON.parse(String(f.data)) : null; };
const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
const colourOf = (p) => (p && p.solid && p.solid.color ? String(lit(p.solid.color)).replace(/^'|'$/g, '').toLowerCase() : undefined);
const entriesOf = (v, o) => (((v.visual.objects || {})[o]) || []);
const plainOf = (v, o) => (entriesOf(v, o).find((e) => !e.selector) || { properties: {} }).properties;
const bySel = (v, o, ref) => (entriesOf(v, o).find((e) => e.selector && e.selector.metadata === ref) || { properties: {} }).properties;
const ys = (v) => v.visual.query.queryState.Y.projections;
const show = (v) => JSON.stringify(v ? { type: v.visual.visualType, query: v.visual.query, objects: v.visual.objects } : null).slice(0, 700);
const measureOf = (ext, name) => ext && Array.isArray(ext.entities) && ext.entities.flatMap((e) => e.measures).find((m) => m.name === name);

// ---------- K: the one constant ----------
chk(() => G.WATERFALL_RTL_DEFAULT === 'native' && Array.isArray(G.WATERFALL_RTL) && G.WATERFALL_RTL.join() === 'mirror,native', () => `K1: visual-gallery.js holds the one default, "native", and the two values: ${G.WATERFALL_RTL_DEFAULT} ${JSON.stringify(G.WATERFALL_RTL)}`);

const EN = get(() => build('en')), ARd = get(() => build('ar')), ARn = get(() => build('ar', 'native')), ARm = get(() => build('ar', 'mirror'));
const we = EN.files && typed(EN, 'waterfallChart');

// ---------- N: "native" (and the default) ----------
for (const [what, r] of [['default', ARd], ['native', ARn]]) {
  const wa = r.files && typed(r, 'waterfallChart'), ext = r.files && extOf(r);
  chk(() => wa && we && !typed(r, 'columnChart') && JSON.stringify(wa.visual.query.sortDefinition) === JSON.stringify(we.visual.query.sortDefinition) && JSON.stringify(wa.visual.objects || {}) === JSON.stringify(we.visual.objects || {}),
    () => `N1 ${what}: the Arabic waterfall is Power BI's waterfallChart, its sort and formatting the English one's (left to right, no switchAxisPosition): ${r.threw || show(wa)} vs ${show(we)}`);
  chk(() => !ext || !ext.entities.some((e) => e.measures.some((m) => /^Waterfall /.test(m.name))), () => `N2 ${what}: no waterfall report measures written: ${JSON.stringify(ext).slice(0, 300)}`);
  chk(() => Array.isArray(r.waterfallRtl) && r.waterfallRtl.length === 1 && r.waterfallRtl[0].written === 'waterfallChart' && r.waterfallRtl[0].what === NATIVE_SAID,
    () => `N3 ${what}: the build's note says "${NATIVE_SAID}": ${JSON.stringify(r.waterfallRtl)}`);
}
const barAxes = (r) => { const b = r.files && typed(r, 'clusteredBarChart'); return b ? JSON.stringify([plainOf(b, 'valueAxis'), plainOf(b, 'categoryAxis')]) : null; };
chk(() => barAxes(ARn) && barAxes(ARn) === barAxes(ARm) && lit(JSON.parse(barAxes(ARn))[0].invertAxis) === 'true', () => `N4: the rest of the Arabic report stays mirrored either way (the bar chart's axes mirrored, the same in native and mirror): ${barAxes(ARn)} / ${barAxes(ARm)}`);

// ---------- M: "mirror" ----------
const wm = ARm.files && typed(ARm, 'columnChart'), extm = ARm.files && extOf(ARm);
chk(() => wm && !typed(ARm, 'waterfallChart') && ys(wm).length === 5 && /^Waterfall base: /.test(ys(wm)[0].field.Measure.Property), () => `M1: "mirror" writes D1's stacked column chart: ${ARm.threw || show(wm)}`);
const fallMs = wm ? [2, 4].map((i) => measureOf(extm, ys(wm)[i].field.Measure.Property)) : [], riseMs = wm ? [1, 3].map((i) => measureOf(extm, ys(wm)[i].field.Measure.Property)) : [];
chk(() => fallMs.length === 2 && fallMs.every((m) => m && m.formatString === '-#,0') && riseMs.every((m) => m && m.formatString === '#,0'),
  () => `M2: a fall is labelled negative like the English waterfall (its measures' format "-#,0"), a rise as the measure's format: ${JSON.stringify(fallMs.concat(riseMs))}`);
chk(() => G.fallFormat('#,0') === '-#,0' && G.fallFormat('"AED" #,0') === '-"AED" #,0' && G.fallFormat('#,0;(#,0)') === '(#,0)' && G.fallFormat(null) === '-#,0' && G.fallFormat('0.0%') === '-0.0%',
  () => `M3: the fall's format from the measure's: its negative section, else "-" before it, else "-#,0": ${['#,0', '"AED" #,0', '#,0;(#,0)', null, '0.0%'].map((f) => get(() => G.fallFormat(f))).join(' | ')}`);
chk(() => lit(plainOf(wm, 'legend').show) === 'false' && !entriesOf(wm, 'legend').some((e) => e.selector), () => `M4: no legend in "mirror" (a stacked column chart's legend would list the invisible base): ${show(wm)}`);
chk(() => ARm.waterfallRtl && ARm.waterfallRtl[0].written === 'columnChart' && /no Total column/.test(ARm.waterfallRtl[0].what) && /no legend/.test(ARm.waterfallRtl[0].what) && /tooltip/.test(ARm.waterfallRtl[0].what) && /«القاعدة»|القاعدة/.test(ARm.waterfallRtl[0].what) && /negative/.test(ARm.waterfallRtl[0].what),
  () => `M5: "mirror" says exactly what differs from Power BI's waterfall (no Total column, no legend, the base in the tooltip, falls negative): ${JSON.stringify(ARm.waterfallRtl)}`);

// ---------- C: the colours are the English waterfall's ----------
{
  const th = EN.files && themeOf(EN), thm = ARm.files && themeOf(ARm), sc = we ? (entriesOf(we, 'sentimentColors')[0] || { properties: {} }).properties : {};
  const inc = colourOf(sc.increaseFill) || (th && String(th.good).toLowerCase()), dec = colourOf(sc.decreaseFill) || (th && String(th.bad).toLowerCase());
  const refOf = (i) => ys(wm)[i].queryRef;
  chk(() => th && thm && th.good && th.bad && String(thm.good).toLowerCase() === String(th.good).toLowerCase() && String(thm.bad).toLowerCase() === String(th.bad).toLowerCase() && String(thm.neutral).toLowerCase() === String(th.neutral).toLowerCase(),
    () => `C1: the English and Arabic themes write the same good, bad and neutral (the waterfall's increase, decrease and the third sentiment colour): ${JSON.stringify(th && [th.good, th.bad, th.neutral])} ${JSON.stringify(thm && [thm.good, thm.bad, thm.neutral])}`);
  chk(() => wm && [1, 3].every((i) => colourOf(bySel(wm, 'dataPoint', refOf(i)).fill) === inc) && [2, 4].every((i) => colourOf(bySel(wm, 'dataPoint', refOf(i)).fill) === dec),
    () => `C2: the mirror's rises are the English waterfall's increase colour ${inc}, its falls the decrease colour ${dec}: ${JSON.stringify(wm && entriesOf(wm, 'dataPoint'))}`);
  chk(() => JSON.stringify(entriesOf(typed(ARn, 'waterfallChart'), 'sentimentColors')) === JSON.stringify(entriesOf(we, 'sentimentColors')), () => 'C3: "native" writes the English waterfall\'s own sentiment colours (identical entries)');
}

// ---------- P, T, V: through the server (plan_layout -> approve_plan -> create_report; create_arabic_twin; check_report) ----------
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-d7-'));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
fs.mkdirSync(path.join(ROOT, 'g/Shop.SemanticModel'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'g/Shop.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Cost', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Date', 'dateTime')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '"AED" #,0' }, { name: 'Total Cost', expression: 'SUM ( Sales[Cost] )', formatString: '"AED" #,0' }] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime', { isKey: true }), col('Month Name', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Quarter', 'string')] }],
  relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } }));
fs.writeFileSync(path.join(ROOT, 'g/Shop.pbip'), JSON.stringify({ version: '1.0', artifacts: [] }));
const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Total Cost]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]', category2: 'Sales[Channel]' };
const HAND = [{ name: 'Bridge', width: 1280, height: 720, slots: [{ kind: 'waterfall', x: 20, y: 20, w: 900, h: 600 }, { kind: 'bar', x: 940, y: 20, w: 320, h: 600 }] }];
const AR_NAMES = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Calendar[Month Name]': 'الشهر', 'Sales[Region]': 'المنطقة' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const unesc = (h) => String(h).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const httpReq = (url, method, body) => new Promise((resolve) => {
  if (!url) { resolve(''); return; }
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const call = async (name, args) => { try { return await w.call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
const approve = async (planId) => { const n = links().length; await call('approve_plan', { planId }); const url = await linkAt(n), html = await httpReq(url, 'GET'); if (url) await httpReq(url, 'POST', 'decision=approve'); await call('approve_plan', { planId }); return unesc(html); };
const visualsOf = (dir) => { const P = path.join(dir, 'definition/pages'); if (!fs.existsSync(P)) return [];
  return rd(path.join(P, 'pages.json')).pageOrder.flatMap((id) => (fs.existsSync(path.join(P, id, 'visuals')) ? fs.readdirSync(path.join(P, id, 'visuals')).map((v) => rd(path.join(P, id, 'visuals', v, 'visual.json'))).filter((v) => v.visual) : [])); };
const plan = (args) => call('plan_layout', Object.assign({ path: 'g', planFields: FIELDS }, args));
const create = (args, id) => { const a = Object.assign({ path: 'g', planId: id, fields: FIELDS }, args); delete a.planFields; return call('create_report', a); };
const checked = async (pbip) => call('check_report', { path: pbip });
const clean = (r) => r && !r.err && r.j.validator && r.j.validator.ran && r.j.validator.errors === 0 && r.j.impact && (r.j.impact.kinds.canBreak || { count: 0 }).count === 0;
const wfOf = (dir) => visualsOf(dir).find((v) => v.visual.visualType === 'waterfallChart' || (v.visual.visualType === 'columnChart' && /^Waterfall /.test((((v.visual.query.queryState.Y || {}).projections || [])[0] || { field: {} }).field.Measure ? v.visual.query.queryState.Y.projections[0].field.Measure.Property : '')));
try {
  // P: the plan's default and its sentence; the mirror pinned; another value refused
  const AR_ARGS = { name: 'Bridge AR', lang: 'ar', pages: HAND, displayNames: AR_NAMES };
  const pn = await plan(AR_ARGS), idn = pn.j && pn.j.plan && pn.j.plan.planId;
  chk(() => idn && pn.j.plan.reportLook.waterfallRtl === 'native' && pn.j.waterfallRtl && pn.j.waterfallRtl.charts[0].what === NATIVE_SAID && /reads left to right, as Power BI draws it/.test(pn.j.waterfallRtl.sayInPlan),
    () => `P1: the plan's default: reportLook.waterfallRtl "native", the waterfall said "${NATIVE_SAID}": ${short(pn)} ${JSON.stringify(pn.j && [pn.j.reportLook, pn.j.waterfallRtl])}`);
  const htmlN = idn ? await approve(idn) : '';
  chk(() => /Waterfall, right to left<\/td><td[^>]*>[^<]*native[^<]*reads left to right, as Power BI draws it/.test(htmlN), () => `P2: the approval page shows the switch: ${(htmlN.match(/<h2>Look and options[\s\S]*?<\/table>/) || [htmlN.slice(0, 300)])[0].slice(0, 700)}`);
  const refused = idn ? await create(Object.assign({}, AR_ARGS, { waterfallRtl: 'mirror' }), idn) : null;
  chk(() => refused && refused.err && !fs.existsSync(path.join(ROOT, 'g/Bridge AR.Report')), () => `P3: create_report with another waterfallRtl than the plan's is refused, nothing written: ${short(refused)}`);
  const rn = idn ? await create(AR_ARGS, idn) : null, wn = wfOf(path.join(ROOT, 'g/Bridge AR.Report'));
  chk(() => rn && !rn.err && wn && wn.visual.visualType === 'waterfallChart' && !lit(plainOf(wn, 'valueAxis').switchAxisPosition) && (rn.j.reportNotes || []).some((x) => x.includes(NATIVE_SAID)),
    () => `P4: the approved "native" plan writes Power BI's waterfall in the Arabic report, and the notes say so: ${short(rn)} ${show(wn)}`);
  const vn = rn && !rn.err ? await checked('g/Bridge AR.pbip') : null;
  chk(() => clean(vn), () => `V AR native: validator 0 errors, check_report 0 "can break": ${short(vn)}`);

  const MIR = Object.assign({}, AR_ARGS, { name: 'Bridge AR M', waterfallRtl: 'mirror' });
  const pm = await plan(MIR), idm = pm.j && pm.j.plan && pm.j.plan.planId;
  chk(() => idm && pm.j.plan.reportLook.waterfallRtl === 'mirror' && pm.j.waterfallRtl.charts[0].written === 'stacked column chart drawn as a waterfall', () => `P5: waterfallRtl "mirror" is pinned and said: ${short(pm)}`);
  if (idm) await approve(idm);
  const rm = idm ? await create({ name: 'Bridge AR M', lang: 'ar', pages: HAND, displayNames: AR_NAMES }, idm) : null, wm2 = wfOf(path.join(ROOT, 'g/Bridge AR M.Report'));
  chk(() => rm && !rm.err && wm2 && wm2.visual.visualType === 'columnChart', () => `P6: create_report without the option takes the plan's "mirror": the stacked chart: ${short(rm)} ${show(wm2)}`);
  const vm = rm && !rm.err ? await checked('g/Bridge AR M.pbip') : null;
  chk(() => clean(vm), () => `V AR mirror: validator 0 errors, check_report 0 "can break": ${short(vm)}`);

  // the English report (the twin's original)
  const pe = await plan({ name: 'Bridge EN', lang: 'en', pages: HAND }), ide = pe.j && pe.j.plan && pe.j.plan.planId;
  if (ide) await approve(ide);
  const re = ide ? await create({ name: 'Bridge EN', lang: 'en', pages: HAND }, ide) : null, wen = wfOf(path.join(ROOT, 'g/Bridge EN.Report'));
  chk(() => re && !re.err && wen && wen.visual.visualType === 'waterfallChart' && JSON.stringify(wen.visual.query.sortDefinition) === JSON.stringify(wn.visual.query.sortDefinition) && JSON.stringify(wen.visual.objects || {}) === JSON.stringify(wn.visual.objects || {}),
    () => `N5: through the tools, the Arabic "native" waterfall equals the English one (sort and formatting): ${show(wen)} vs ${show(wn)}`);
  const ve = re && !re.err ? await checked('g/Bridge EN.pbip') : null;
  chk(() => clean(ve), () => `V EN: validator 0 errors, check_report 0 "can break": ${short(ve)}`);

  // T: the twin, both values
  // (reviewer, J18 merge) the twin's own waterfall keeps the English query, its fields shown with Arabic display names
  // (J18's terminology labels every field the twin shows; before it, the native waterfall kept English names, against
  // the owner's must-fix "no English in Arabic reports")
  const noNames = (q) => JSON.parse(JSON.stringify(q || {}, (k, v) => (k === 'displayName' ? undefined : v)));
  const arabicNamed = (q) => { const n = []; JSON.stringify(q || {}, (k, v) => { if (k === 'displayName') n.push(v); return v; }); return n.length > 0 && n.every((s) => /[\u0600-\u06FF]/.test(s)); };
  for (const [val, outName] of [[null, 'Bridge EN AR'], ['mirror', 'Bridge EN AR']]) {
    const tag = val || 'default';
    const tp = await call('create_arabic_twin', Object.assign({ path: 'g/Bridge EN.pbip' }, val ? { waterfallRtl: val } : {})), tid = tp.j && tp.j.plan && tp.j.plan.planId;
    const mirrors = (tp.j && tp.j.mirrors) || [];
    chk(() => tid && (val === 'mirror' ? mirrors.some((m) => m.kind === 'waterfall' && /stacked column chart/.test(m.what)) : mirrors.some((m) => m.kind === 'waterfallNative' && m.what === 'waterfall charts: ' + NATIVE_SAID)),
      () => `T1 ${tag}: the twin's plan says what its waterfall becomes: ${short(tp)} ${JSON.stringify(mirrors).slice(0, 500)}`);
    const html = tid ? await approve(tid) : '';
    chk(() => new RegExp(`Waterfall, right to left</td><td[^>]*>[^<]*${val === 'mirror' ? 'mirror' : 'native'}`).test(html), () => `T2 ${tag}: the twin's approval page shows the switch: ${(html.match(/<h2>Options[\s\S]*?<\/table>/) || [html.slice(0, 300)])[0].slice(0, 500)}`);
    const other = tid ? await call('create_arabic_twin', { path: 'g/Bridge EN.pbip', planId: tid, waterfallRtl: val === 'mirror' ? 'native' : 'mirror' }) : null;
    chk(() => other && other.err && /Nothing was written/.test(other.t) && !fs.existsSync(path.join(ROOT, 'g', outName + '.Report')), () => `T3 ${tag}: the twin with another waterfallRtl than its plan's is refused, nothing written: ${short(other)}`);
    const tw = tid ? await call('create_arabic_twin', { path: 'g/Bridge EN.pbip', planId: tid }) : null, wt = wfOf(path.join(ROOT, 'g', outName + '.Report'));
    chk(() => tw && !tw.err && wt && (val === 'mirror' ? wt.visual.visualType === 'columnChart' : wt.visual.visualType === 'waterfallChart' && JSON.stringify(noNames(wt.visual.query)) === JSON.stringify(noNames(wen.visual.query)) && arabicNamed(wt.visual.query) && JSON.stringify(wt.visual.objects || {}) === JSON.stringify(wen.visual.objects || {})),
      () => `T4 ${tag}: the twin writes ${val === 'mirror' ? 'the stacked chart' : 'the original waterfall as it is (left to right), its fields shown with Arabic names'}: ${short(tw)} ${show(wt)}`);
    const vt = tw && !tw.err ? await checked('g/' + outName + '.pbip') : null;
    chk(() => clean(vt), () => `V twin ${tag}: validator 0 errors, check_report 0 "can break": ${short(vt)}`);
    if (val === 'mirror' && wt) {
      // C4: the twin's mirror takes the original waterfall's colours (the written theme's good / bad: the original writes none)
      const th = (() => { const d = path.join(ROOT, 'g/Bridge EN.Report/StaticResources'); const f = fs.existsSync(d) ? fs.readdirSync(d, { recursive: true }).map(String).find((x) => /\.json$/.test(x)) : null; return f ? rd(path.join(d, f)) : null; })();
      // (a hand-placed report's theme names no good or bad: the English waterfall draws Power BI's default theme's)
      const good = String(th && th.good || '#1AAB40').toLowerCase(), bad = String(th && th.bad || '#D64554').toLowerCase();
      chk(() => th && [1, 3].every((i) => colourOf(bySel(wt, 'dataPoint', ys(wt)[i].queryRef).fill) === good) && [2, 4].every((i) => colourOf(bySel(wt, 'dataPoint', ys(wt)[i].queryRef).fill) === bad),
        () => `C4: the twin's mirror: rises in the original's increase colour (its theme's good, else Power BI's default ${good}), falls in its decrease colour (${bad}): ${JSON.stringify(th && [th.good, th.bad])} ${JSON.stringify(entriesOf(wt, 'dataPoint'))}`);
      // C5: the same through create_report: the hand-placed Arabic mirror's colours are the English waterfall's
      const wm3 = wfOf(path.join(ROOT, 'g/Bridge AR M.Report'));
      chk(() => wm3 && [1, 3].every((i) => colourOf(bySel(wm3, 'dataPoint', ys(wm3)[i].queryRef).fill) === good) && [2, 4].every((i) => colourOf(bySel(wm3, 'dataPoint', ys(wm3)[i].queryRef).fill) === bad),
        () => `C5: create_report's hand-placed Arabic mirror: rises ${good}, falls ${bad}, as the English waterfall draws them: ${JSON.stringify(wm3 && entriesOf(wm3, 'dataPoint'))}`);
    }
    fs.rmSync(path.join(ROOT, 'g', outName + '.Report'), { recursive: true, force: true }); fs.rmSync(path.join(ROOT, 'g', outName + '.pbip'), { force: true });
  }
  const tools = (await w.c.listTools()).tools, en = (n) => { const t = tools.find((x) => x.name === n); return JSON.stringify((((t || {}).inputSchema || {}).properties || {}).waterfallRtl || {}); };
  chk(() => ['plan_layout', 'create_report', 'create_arabic_twin'].every((n) => /"enum":\["mirror","native"\]/.test(en(n)) && /left to right, as Power BI draws it/.test(en(n))),
    () => `S1: plan_layout, create_report and create_arabic_twin take waterfallRtl "mirror" | "native", described: ${en('create_report').slice(0, 400)}`);
  // S2 (F1, the owner's decision of 20 Oct after the laptop proof: Desktop 2.159 draws no total label on the mirror)
  chk(() => ['plan_layout', 'create_report', 'create_arabic_twin'].every((n) => /no Total column/.test(en(n)) && /no total label/.test(en(n)) && !/labelled with the total/.test(en(n))),
    () => `S2: the description says "mirror" has no Total column and no total label: ${en('create_report').slice(0, 600)}`);
  {
    const pm = await plan({ name: 'Bridge AR S2', lang: 'ar', pages: HAND, displayNames: AR_NAMES, waterfallRtl: 'mirror' }), W = pm.j && pm.j.waterfallRtl;
    const pn2 = await plan({ name: 'Bridge AR S2n', lang: 'ar', pages: HAND, displayNames: AR_NAMES }), Wn = pn2.j && pn2.j.waterfallRtl;
    chk(() => W && /no total label/.test(W.sayInPlan) && /no total label/.test(W.charts[0].what) && !/labelled/.test(W.sayInPlan + W.charts[0].what) && Wn && /no total label/.test(Wn.sayInPlan) && /no total label/.test(Mirror.KIND_WHAT.waterfall),
      () => `S3: the mirror's plan text, its chart line, the native plan's "other choice" and the twin's line say no total label: ${JSON.stringify([W, Wn && Wn.sayInPlan]).slice(0, 900)}`);
  }
} finally { await w.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

if (problems.length) { console.log(`FAIL  waterfall-native-look  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  waterfall-native-look  ${checks} checks`);
