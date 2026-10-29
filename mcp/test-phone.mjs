// 0.3.0 step 6, the phone layout (owner's R&D go, 18 Oct): what the shared writer (assets/js/pbip-page.js) writes in
// mobile.json, checked on every report of the layout matrix (test-0.2.9-layouts.mjs's Latin square: every layout x page
// size x KPI count x filter position, left to right and right to left, on the four synthetic models).
// Each report page, tooltip pages apart:
//   P1 every visual that shows data (a chart, a table, a card, a slicer) and the page's title has a phone position;
//   P2 every phone position is on the 323-wide phone canvas (x >= 0, x + width <= 323, y >= 0, a size > 0);
//   P3 no two phone boxes overlap (groups apart: a group's box holds its children);
//   P4 the charts and tables keep the page's reading order (rows top to bottom, each row from the reading start);
//   P5 right to left (the report in Arabic) is left to right (in English) mirrored on the phone: x -> 323 - x - width,
//      the same y and size, for the charts, tables, cards and slicers;
//   P6 a tooltip page has no phone layout (Power BI shows a tooltip page only on hover);
//   P7 Microsoft's validator: 0 errors (mobile.json included);
//   P8 the design option phoneLayout (default on), said by plan_layout and create_report.
// Measured and printed, not failed (rules the brief proposes that differ from what Desktop was tuned on: a decision):
//   M1 tables and matrices after the charts; M2 the slicers in one row.
//   node test-phone.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { withPlans, keepEnglish } from './test-plan.mjs';
import { validatorCounts } from './test-validator.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-phone-')), t0 = Date.now();
const copy = (from, to) => fs.cpSync(path.join(REPO, from), path.join(ROOT, to), { recursive: true });
copy('scripts/tests/fixtures/model-health/tmdl-ramadan/definition', 'ramadan/Ramadan Test.SemanticModel/definition');
fs.writeFileSync(path.join(ROOT, 'ramadan/Ramadan Test.SemanticModel/definition.pbism'), '{ "version": "4.0", "settings": {} }');
copy('mcp/test-models/arabic-long-names', 'arabic');
copy('mcp/test-models/no-measures', 'plain');
copy('mcp/test-models/large-synthetic/Large Synthetic.SemanticModel', 'large/Large Synthetic.SemanticModel');

const s = await serverClient(ROOT), call = withPlans(s.call);
const problems = [], measured = { tablesLast: [0, 0], slicersOneRow: [0, 0], boxes: 0, shows: 0, charts: 0, mirrored: 0 }; let checks = 0;
const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };

// the same Latin square as test-0.2.9-layouts.mjs
const LAYOUTS = ['exec', 'analysis', 'ops', 'focus'], PAGES = ['1920x1080', '1280x720', '960x720', '640x360'], KPIS = [0, 3, 4, 6], FILTERS = ['none', 'start', 'end', 'top'];
const MODELS = [{ path: 'ramadan' }, { path: 'arabic' }, { path: 'plain' }, { path: 'large', focus: 'logistics' }];
// (0.3.1 CX1, F01: an Arabic plan whose titles would be English gets no plan id) each right-to-left report keeps the fields of
// its English titles English on purpose, as the person says it: these checks are about the phone layout, not the names
const KEPT = {
  ramadan: keepEnglish('Calendar[Month Short]', 'Sales[Total Sales vs Last Ramadan %]', 'Sales[Total Sales Last Ramadan (old)]'),
  // (0.3.1 FX2, A-1: the columns a model with no measures counts or sums are drafted like the other fields)
  plain: keepEnglish('Orders[Order Id]'),
  large: keepEnglish('Calendar[Month Short]', 'Shipments[Shipments Total Net Amount]', 'Deliveries[Deliveries Total Tax Amount]', 'Returns[Returns Total Amount]', 'Hub[Hub Region]', 'Shipments[Shipments Total Discount]',
    'Shipment Legs[Shipment Legs Total Hours]', 'Freight Costs[Freight Costs Total Tax Amount]', 'Lane[Lane Region]', 'Hub[Hub Group]', 'Hub[Hub Category]')
};
const combos = [];
LAYOUTS.forEach((layout, li) => [0, 1, 2, 3].forEach((i) => combos.push({ layout, page: PAGES[i], kpis: KPIS[(i + li) % 4], filters: FILTERS[(i + 2 * li + li % 2) % 4], model: MODELS[(i + li) % 4] })));
const label = (c, dir) => `${c.layout} ${c.page} kpis ${c.kpis} filters ${c.filters} ${dir} (${c.model.path})`;

const PW = 323, EPS = 0.51;
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
// a report's pages in order: each visual with its page box (group offset added) and its phone box (mobile.json)
const readReport = (dir) => {
  const D = path.join(dir, 'definition', 'pages'), order = J(path.join(D, 'pages.json')).pageOrder;
  return order.map((id) => { const pj = J(path.join(D, id, 'page.json')), vd = path.join(D, id, 'visuals');
    const vs = fs.existsSync(vd) ? fs.readdirSync(vd).map((n) => { const v = J(path.join(vd, n, 'visual.json')), m = path.join(vd, n, 'mobile.json'); v.mobile = fs.existsSync(m) ? J(m) : null; return v; }) : [];
    const by = Object.fromEntries(vs.map((v) => [v.name, v]));
    vs.forEach((v) => { const g = v.parentGroupName && by[v.parentGroupName] ? by[v.parentGroupName].position : { x: 0, y: 0 }; v.at = { x: v.position.x + g.x, y: v.position.y + g.y, w: v.position.width, h: v.position.height }; });
    return { page: pj, tooltip: pj.type === 'Tooltip', visuals: vs }; });
};
const type = (v) => (v.visual ? v.visual.visualType : v.visualGroup ? 'group' : 'other');
const fields = (v) => Object.values(((v.visual && v.visual.query) || {}).queryState || {}).reduce((a, r) => a + ((r && r.projections) || []).length, 0);
const CHART = /Chart$|^tableEx$|^pivotTable$|^gauge$|^map$|^treemap$|^donutChart$|^funnel$/;
const isTitle = (v) => type(v) === 'textbox' && v.parentGroupName && /title/i.test(JSON.stringify(((v.visual.visualContainerObjects || {}).general || [])[0] || '')) ;
// the page's reading order: rows (boxes whose tops are within 8 of the row's first), each from the reading start
const readingOrder = (list, rtl) => {
  const sorted = list.slice().sort((a, b) => a.at.y - b.at.y), rows = [];
  sorted.forEach((v) => { const r = rows.find((row) => Math.abs(row[0].at.y - v.at.y) <= 8); if (r) r.push(v); else rows.push([v]); });
  return rows.flatMap((r) => r.sort((a, b) => (rtl ? b.at.x + b.at.w - (a.at.x + a.at.w) : a.at.x - b.at.x)));
};

const written = {};
for (const c of combos) for (const dir of ['ltr', 'rtl']) {
  const tag = label(c, dir), name = `P ${c.layout} ${c.page} ${c.kpis} ${c.filters} ${dir}`, rtl = dir === 'rtl';
  const pageArg = c.page === '640x360' ? { w: 640, h: 360 } : c.page;
  const args = Object.assign({ path: c.model.path, layout: c.layout, page: pageArg, kpis: c.kpis, filters: c.filters, lang: rtl ? 'ar' : 'en', dir }, c.model.focus ? { focus: c.model.focus } : {});
  const pl = await call('plan_layout', args);
  if (pl.err || !pl.j.design) { check(false, `${tag}: plan_layout refused: ${(pl.t || '').slice(0, 200)}`); continue; }
  const r = await call('create_report', Object.assign({ path: c.model.path, name, design: pl.j.design, lang: rtl ? 'ar' : 'en', dir }, c.model.focus ? { focus: c.model.focus } : {}, rtl && KEPT[c.model.path] ? { displayNames: KEPT[c.model.path] } : {}));
  if (r.err) { check(false, `${tag}: create_report refused: ${r.t.slice(0, 200)}`); continue; }
  const dir0 = path.join(ROOT, c.model.path, r.j.report), pages = readReport(dir0);
  // P7
  const vr = validatorCounts(dir0); check(vr.ran && !vr.errors.length, `${tag}: Microsoft's validator: ${vr.ran ? vr.errors.map((e) => e.code).join(', ') : 'did not run'}`);
  // P6
  pages.filter((p) => p.tooltip).forEach((p) => check(p.visuals.every((v) => !v.mobile), `${tag}, tooltip page ${p.page.displayName}: has a phone layout`));
  const main = pages.filter((p) => !p.tooltip); written[tag.replace(/ (ltr|rtl) /, ' ')] = written[tag.replace(/ (ltr|rtl) /, ' ')] || {};
  written[tag.replace(/ (ltr|rtl) /, ' ')][dir] = main;
  main.forEach((p, pi) => {
    const at = `${tag}, page ${pi + 1}`;
    // P1: what shows data, and the title
    const shows = p.visuals.filter((v) => (v.visual && fields(v) && (CHART.test(type(v)) || type(v) === 'slicer' || (type(v) === 'cardVisual' && v.parentGroupName))) || isTitle(v));
    const none = shows.filter((v) => !v.mobile); measured.shows += shows.length;
    check(!none.length, `${at}: no phone position for ${none.map((v) => type(v) + ' ' + v.name).slice(0, 4).join(', ')}`);
    // P2
    const ph = p.visuals.filter((v) => v.mobile).map((v) => Object.assign(v.mobile.position, { v })); measured.boxes += ph.length;
    const off = ph.filter((q) => !(q.x >= -EPS && q.x + q.width <= PW + EPS && q.y >= -EPS && q.width > 0 && q.height > 0));
    check(!off.length, `${at}: off the phone canvas: ${off.slice(0, 3).map((q) => `${type(q.v)} x ${q.x} w ${q.width} y ${q.y}`).join(', ')}`);
    // P3 (a group's box holds its children; a 2-high tab underline sits in the gap under its button)
    const leaf = ph.filter((q) => type(q.v) !== 'group');
    const over = [];
    leaf.forEach((a, i) => leaf.slice(i + 1).forEach((b) => { if (Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > EPS && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > EPS) over.push(`${type(a.v)} and ${type(b.v)}`); }));
    check(!over.length, `${at}: phone boxes overlap: ${over.slice(0, 3).join(', ')}`);
    // P4: the charts and tables, by their phone tops, in the page's reading order
    const charts = p.visuals.filter((v) => v.mobile && CHART.test(type(v)) && fields(v)); measured.charts += charts.length;
    const want = readingOrder(charts, rtl).map((v) => v.name), got = charts.slice().sort((a, b) => a.mobile.position.y - b.mobile.position.y).map((v) => v.name);
    check(JSON.stringify(want) === JSON.stringify(got), `${at}: the phone order of charts and tables is not the page's reading order: ${got.map((n) => type(charts.find((v) => v.name === n))).join(' > ')} (page: ${want.map((n) => type(charts.find((v) => v.name === n))).join(' > ')})`);
    // M1: tables after the charts; M2: the slicers in one row
    const kinds = got.map((n) => type(charts.find((v) => v.name === n)));
    if (kinds.some((k) => /^(tableEx|pivotTable)$/.test(k)) && kinds.some((k) => /Chart$/.test(k))) { measured.tablesLast[1]++; const last = kinds.map((k) => /^(tableEx|pivotTable)$/.test(k)); if (last.indexOf(true) > last.lastIndexOf(false)) measured.tablesLast[0]++; }
    const sl = ph.filter((q) => type(q.v) === 'slicer');
    if (sl.length > 1) { measured.slicersOneRow[1]++; if (new Set(sl.map((q) => Math.round(q.y))).size === 1) measured.slicersOneRow[0]++; }
  });
}
// P5: the right-to-left report's phone boxes are the left-to-right ones mirrored (charts, tables, cards, slicers, the title)
for (const [tag, w] of Object.entries(written)) {
  if (!w.ltr || !w.rtl) continue;
  w.ltr.forEach((pl0, i) => { const pr = w.rtl[i]; if (!pr) return check(false, `${tag} rtl: page ${i + 1} missing`);
    const pick = (p) => p.visuals.filter((v) => v.mobile && v.visual && (CHART.test(type(v)) || /^(slicer|cardVisual)$/.test(type(v))) && fields(v)).map((v) => ({ t: type(v), ...v.mobile.position }));
    const key = (q) => `${q.t}@${Math.round(q.y)}:${Math.round(q.width)}x${Math.round(q.height)}`;
    const L = pick(pl0), R = pick(pr); measured.mirrored += L.length;
    const miss = L.filter((q) => !R.some((o) => key(o) === key(q) && Math.abs(o.x - (PW - q.x - q.width)) <= 1));
    check(L.length === R.length && !miss.length, `${tag} rtl, page ${i + 1}: the phone layout is not the left-to-right one mirrored: ${miss.slice(0, 3).map((q) => key(q) + ' at x ' + q.x).join(', ')} (${L.length} vs ${R.length})`); });
}
// P8 the design option phoneLayout (default on): plan_layout says whether the phone layout is written; false writes no
// mobile.json at all and the report still validates; a value that is not true or false is dropped and said
{
  const base = { path: 'ramadan', layout: 'exec', page: '1280x720', kpis: 4, filters: 'none', lang: 'en' };
  const on = await call('plan_layout', base);
  check(!on.err && on.j.phone && on.j.phone.written === true && on.j.phone.canvas === PW && typeof on.j.phone.about === 'string', `P8: plan_layout must say the phone layout is written: ${JSON.stringify(on.j && on.j.phone)}`);
  const design = Object.assign({}, on.j.design, { layout: Object.assign({}, on.j.design.layout, { phoneLayout: false }) });
  const off = await call('plan_layout', Object.assign({}, base, { design }));
  check(!off.err && off.j.phone && off.j.phone.written === false, `P8: plan_layout with phoneLayout false must say no phone layout: ${JSON.stringify(off.j && off.j.phone)}`);
  const r = await call('create_report', { path: 'ramadan', name: 'P8 no phone', design, lang: 'en' });
  if (r.err) check(false, `P8: create_report refused phoneLayout false: ${r.t.slice(0, 200)}`);
  else {
    const dir0 = path.join(ROOT, 'ramadan', r.j.report), pages = readReport(dir0);
    check(pages.every((p) => p.visuals.every((v) => !v.mobile)), 'P8: phoneLayout false still wrote mobile.json');
    const vr = validatorCounts(dir0); check(vr.ran && !vr.errors.length, `P8: the report without a phone layout must validate: ${vr.ran ? vr.errors.map((e) => e.code).join(', ') : 'did not run'}`);
    check(r.j.phone && r.j.phone.written === false, `P8: create_report must say no phone layout was written: ${JSON.stringify(r.j.phone)}`);
  }
  const r2 = await call('create_report', { path: 'ramadan', name: 'P8 phone', design: on.j.design, lang: 'en' });
  check(!r2.err && r2.j.phone && r2.j.phone.written === true && readReport(path.join(ROOT, 'ramadan', r2.j.report)).some((p) => p.visuals.some((v) => v.mobile)), `P8: by default create_report writes and says the phone layout: ${r2.err ? r2.t.slice(0, 150) : JSON.stringify(r2.j.phone)}`);
  const bad = await call('plan_layout', Object.assign({}, base, { design: Object.assign({}, on.j.design, { layout: Object.assign({}, on.j.design.layout, { phoneLayout: 'no' }) }) }));
  check(!bad.err && bad.j.phone && bad.j.phone.written === true && /phoneLayout/.test(JSON.stringify(bad.j)), `P8: phoneLayout "no" must be dropped (default on) and said: ${bad.err ? bad.t.slice(0, 150) : JSON.stringify(bad.j.phone)}`);
}
await s.close(); fs.rmSync(ROOT, { recursive: true, force: true });
const secs = Math.round((Date.now() - t0) / 1000), pct = ([a, b]) => `${a} of ${b}`;
console.log(`COVERED   phone: ${measured.boxes} phone boxes on the canvas and without overlap, ${measured.shows} data visuals and titles with a phone position, ${measured.charts} charts and tables in reading order, ${measured.mirrored} boxes mirrored`);
console.log(`MEASURED  phone: tables after the charts on ${pct(measured.tablesLast)} pages that have both; slicers in one row on ${pct(measured.slicersOneRow)} pages with two or more`);
console.log(problems.length ? `FAIL  phone  ${combos.length * 2} reports, ${checks} checks, ${problems.length} failed, ${secs}s\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  phone  ${combos.length * 2} reports, ${checks} checks, ${secs}s`);
process.exit(problems.length ? 1 : 0);
