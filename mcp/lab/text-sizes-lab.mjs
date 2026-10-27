// 0.3.1 TS1 (the owner, 27 Oct, D-1027-16: "no go for 1.25 in 0.3.1"; mcp/work/TS1.md): a test project for the laptop to
// confirm that the theme's text x 1.25 on a 1920 x 1080 page (12.5 body, 15 titles, 35 KPI values) breaks nothing, next
// to the x 1.5 of 0.3.0 (15, 18, 42). The made-up shop model of glass-lab.mjs (typed Power Query rows; no employer or
// client data); two reports written through the tools as a person would (generate_theme -> plan_layout -> approve ->
// create_report): "Text EN" and "Text AR", 1920 x 1080, filters at the start with three dropdowns and the details page
// (0.2.9-writer-S10: the column chart beside the shortened rail ends with it, 168 high, the rows under it move up).
// Each report gets one more page, "Text x 1.25 | x 1.5": the first page's KPI card, dropdown slicer, bar chart and table
// twice, in the same boxes: on the reading-start half as written (the theme's x 1.25), on the other half with every text
// size the visual shows set x 1.2 on the visual itself (= x 1.5 of the 720 sizes; visual.json outranks the theme).
// Microsoft's validator and check_report run on both reports. Nothing outside the folder given is touched.
//   node lab/text-sizes-lab.mjs <empty folder>      (from mcp/; prints the two .pbip files to open in Power BI Desktop)
import '../test-env.mjs';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from '../test-0.2.9.mjs';
import { writeModel, reportDirOf, pbipOf } from './glass-lab.mjs';

const E = createRequire(import.meta.url)('../../assets/js/design-engine.js');
const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Order Count]', 'Sales[Average Order]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]', category2: 'Sales[Category]',
  slicers: ['Sales[Channel]', 'Sales[Region]', 'Sales[Category]'], table: ['Sales[Region]', 'Sales[Total Sales]', 'Sales[Order Count]'] };
const AR_NAMES = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Order Count]': 'عدد الطلبات', 'Sales[Average Order]': 'متوسط الطلب', 'Sales[Region]': 'المنطقة', 'Sales[Category]': 'الفئة', 'Sales[Channel]': 'القناة', 'Calendar[Month Name]': 'اسم الشهر' };
// x 1.5 / x 1.25: the 0.3.0 size of every text the shipped theme gives on this page
export const OLD = 1.5 / E.FHD_TEXT;
const lit = (v) => ({ expr: { Literal: { Value: v + 'D' } } }), half = (v) => Math.min(60, Math.max(8, Math.round(v * 2) / 2));
// the text sizes a visual shows, by visual type: [objects card, property, the theme's size it takes when it sets none]
const TEXTS = (T) => ({
  cardVisual: [['value', 'fontSize', T.callout], ['label', 'fontSize', T.label]],
  slicer: [['header', 'textSize', T.label], ['items', 'textSize', T.label]],
  clusteredBarChart: [['categoryAxis', 'fontSize', T.label], ['valueAxis', 'fontSize', T.label], ['labels', 'fontSize', T.label]],
  barChart: [['categoryAxis', 'fontSize', T.label], ['valueAxis', 'fontSize', T.label], ['labels', 'fontSize', T.label]],
  tableEx: [['values', 'fontSize', T.label], ['columnHeaders', 'fontSize', T.label], ['total', 'fontSize', T.label]]
});
// a copy of a visual with each of its text sizes x r, on the visual itself (its title too)
export function grown(v, T, r) {
  const out = JSON.parse(JSON.stringify(v)), o = (out.visual.objects = out.visual.objects || {}), vco = (out.visual.visualContainerObjects = out.visual.visualContainerObjects || {});
  const set = (bag, k, prop, base) => {
    const list = bag[k] && bag[k].length ? bag[k] : (bag[k] = [{ properties: {} }]);
    list.forEach((e) => { e.properties = e.properties || {}; const was = e.properties[prop] ? parseFloat(String(e.properties[prop].expr.Literal.Value)) : base; e.properties[prop] = lit(half(was * r)); });
  };
  (TEXTS(T)[out.visual.visualType] || []).forEach(([k, prop, base]) => set(o, k, prop, base));
  set(vco, 'title', 'fontSize', T.title);
  return out;
}
export async function writeLab(out) {
  fs.mkdirSync(out, { recursive: true });
  const ROOT = fs.realpathSync.native(path.resolve(out));
  if (fs.readdirSync(ROOT).length) throw new Error(`${ROOT} is not empty: give an empty folder`);
  writeModel(path.join(ROOT, 'shop'));
  const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
  const req = (url, body) => new Promise((resolve) => { if (!url) { resolve(''); return; } const u = new URL(url), r = http.request(u, { method: body ? 'POST' : 'GET', headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); }); r.on('error', () => resolve('')); if (body) r.write(body); r.end(); });
  const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
  const made = [];
  try {
    for (const lang of ['en', 'ar']) {
      const name = `Text ${lang.toUpperCase()}`;
      const gt = await s.call('generate_theme', { lang });
      if (gt.err) throw new Error('generate_theme: ' + gt.t.slice(0, 300));
      let args = Object.assign({ path: 'shop/Glass Shop.SemanticModel', lang, layout: 'exec', filters: 'start', secondPage: true, name, design: gt.j.design, planFields: FIELDS }, lang === 'ar' ? { displayNames: AR_NAMES } : {});
      let pl = await s.call('plan_layout', args);
      for (let i = 0; i < 4 && !pl.err; i++) {
        const j = pl.j || {}, more = {};
        if (j.gulfDates && j.gulfDates.askNext && !args.gulfDates && ((j.gulfDates.candidates || [])[0] || {}).field) more.gulfDates = { dateRole: j.gulfDates.candidates[0].field, grain: 'gregorian', scope: 'all' };
        if (j.sharedAxes && (j.sharedAxes.ask || []).length && !args.sharedAxes) more.sharedAxes = j.sharedAxes.ask.map((q) => ({ measures: q.measures, answer: 'separate' }));
        if (!Object.keys(more).length) break;
        args = Object.assign(args, more); pl = await s.call('plan_layout', args);
      }
      const id = pl.j && pl.j.plan && pl.j.plan.planId;
      if (!id) throw new Error('no plan: ' + JSON.stringify((pl.j || {}).planProblems || pl.t).slice(0, 600));
      const n = links().length; await s.call('approve_plan', { planId: id });
      for (let k = 0; k < 100 && links().length <= n; k++) await new Promise((r) => setTimeout(r, 50));
      await req(links()[n], 'decision=approve'); await s.call('approve_plan', { planId: id });
      const send = Object.assign({}, args, { planId: id, design: pl.j.design, fields: FIELDS }); delete send.planFields;
      const r = await s.call('create_report', send);
      if (r.err) throw new Error('not written: ' + r.t.slice(0, 400));
      const RD = reportDirOf(ROOT, r.j.open, name), T = E.buildTheme(pl.j.design, lang).textClasses;
      const sizes = { label: T.label.fontSize, title: T.title.fontSize, callout: T.callout.fontSize };
      addCompare(RD, sizes, lang, pl.j.design);
      const c = await s.call('check_report', { path: r.j.open }), cj = c.j || {};
      made.push({ name, pbip: pbipOf(ROOT, r.j.open), sizes, old: { label: half(sizes.label * OLD), title: half(sizes.title * OLD), callout: half(sizes.callout * OLD) },
        validator: c.err ? c.t.slice(0, 200) : cj.validator && cj.validator.errors, canBreak: cj.impact && cj.impact.kinds.canBreak.count });
    }
  } finally { await s.close(); }
  return made;
}
// the page "Text x 1.25 | x 1.5": the first page's card, slicer, bar chart and table, as written and x 1.2 in the same boxes
function addCompare(RD, T, lang, design) {
  const P = path.join(RD, 'definition/pages'), rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8')), wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2)); };
  const order = rd(path.join(P, 'pages.json')), first = order.pageOrder[0], page0 = rd(path.join(P, first, 'page.json'));
  // (the slicers sit in the rail's group: taken from it too, placed on their own here)
  const vis = fs.readdirSync(path.join(P, first, 'visuals')).map((v) => rd(path.join(P, first, 'visuals', v, 'visual.json'))).filter((v) => v.visual);
  const pick = (t) => vis.find((v) => v.visual.visualType === t && !v.parentGroupName) || vis.find((v) => v.visual.visualType === t);
  const card = pick('cardVisual'), slicer = pick('slicer'), bar = pick('clusteredBarChart') || pick('barChart'), table = pick('tableEx');
  if (!card || !slicer || !bar || !table) throw new Error('the report has no card, slicer, bar chart or table to copy: ' + vis.map((v) => v.visual.visualType).join(', '));
  const id = crypto.createHash('sha256').update(RD + 'text').digest('hex').slice(0, 20), PD = path.join(P, id), rtl = lang === 'ar';
  wr(path.join(PD, 'page.json'), Object.assign({}, page0, { name: id, displayName: rtl ? 'النص ×1.25 | ×1.5' : 'Text x 1.25 | x 1.5', filterConfig: undefined, visibility: undefined }));
  let z = 0;
  const box = (x, w) => (rtl ? 1920 - x - w : x);
  const own = (fc, nm) => (fc ? Object.assign({}, fc, { filters: (fc.filters || []).map((f) => Object.assign({}, f, { name: (f.name || 'f') + nm })) }) : undefined);
  const put = (nm, v, x, y, w, h) => wr(path.join(PD, 'visuals', nm, 'visual.json'), Object.assign({}, v, { name: nm, position: { x: box(x, w), y, z: z, width: w, height: h, tabOrder: z++ }, parentGroupName: undefined, filterConfig: own(v.filterConfig, nm) }));
  const say = (nm, text, x) => wr(path.join(PD, 'visuals', nm, 'visual.json'), { $schema: card.$schema, name: nm, position: { x: box(x, 920), y: 16, z: z, width: 920, height: 48, tabOrder: z++ },
    visual: { visualType: 'textbox', objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: text, textStyle: { fontSize: '13pt', color: design.ui.text } }], horizontalTextAlignment: rtl ? 'right' : 'left' }] } }] } } });
  const old = { label: half(T.label * OLD), title: half(T.title * OLD), callout: half(T.callout * OLD) };
  [[`x 1.25 (shipped in 0.3.1): body ${T.label}, titles ${T.title}, KPI ${T.callout}`, 24, null], [`x 1.5 (0.3.0): body ${old.label}, titles ${old.title}, KPI ${old.callout}`, 976, OLD]].forEach(([text, x, r], i) => {
    const g = (v) => (r ? grown(v, Object.assign({}, T), r) : v);
    say(`s${i}`, text, x);
    put(`c${i}`, g(card), x, 80, Math.min(card.position.width, 440), card.position.height);
    put(`f${i}`, g(slicer), x + 460, 80, 460, slicer.position.height);
    put(`b${i}`, g(bar), x, 320, 450, 400);
    put(`t${i}`, g(table), x + 470, 320, 450, 400);
  });
  order.pageOrder.push(id);
  wr(path.join(P, 'pages.json'), order);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2];
  if (!out) { console.error('Give an empty folder: node lab/text-sizes-lab.mjs <folder>'); process.exit(2); }
  writeLab(out).then((made) => {
    made.forEach((m) => {
      console.log(`Open in Power BI Desktop: ${m.pbip}`);
      console.log(`  the theme on 1920 x 1080: body ${m.sizes.label}, titles ${m.sizes.title}, KPI ${m.sizes.callout} (x 1.5 beside it: ${m.old.label}, ${m.old.title}, ${m.old.callout})`);
      console.log(`  Microsoft's validator errors: ${m.validator}; check_report "can break": ${m.canBreak}`);
    });
  }).catch((e) => { console.error('FAIL  ' + (e && e.message || e)); process.exit(1); });
}
