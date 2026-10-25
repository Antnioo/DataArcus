// 0.3.1 M1 (the owner, 25 Oct: "make sure the AR and twin are using the same engine"; written red first): every path
// that writes Arabic visuals gives the same visual for the same English one. One English report with every kind a
// report holds, on the made-up model mcp/test-models/service-orders (facility maintenance; no employer or client data):
// the visuals create_report writes (new cards, bar, column, line, combo, waterfall, donut, table, matrix, slicers, pills,
// a text box, the Reset button) and the ones a person adds (a card, a shape, an image, a button, a group, a stacked bar
// with a legend). Made Arabic by:
//   W  create_report's writer in Arabic (pbip-export.js build, the engine create_report calls for designed and
//      hand-placed pages alike) on the mirrored slots;
//   T  create_arabic_twin, a separate twin (through the server, the approval clicked as a person does);
//   C  create_arabic_twin into "same", the EN-AR copy (its Arabic page).
//   B  (0.3.1 X2) create_report with languages "en+ar": one report in English and Arabic from the plan. Its Arabic half
//      must be the EN-AR copy's of the same English report (C on create_report's own report, the same Arabic texts and
//      terms): every file of every page the same, byte for byte, but what INTENDED.bilingual lists.
// Per kind, W against T and C against T: the place, alignment, order, projections, sort and every formatting card
// (objects and container objects), after taking out the differences that are meant, each listed in INTENDED with why.
//   L  the lab writes its project and Microsoft's validator gives 0 errors
//   E  the engine: the chart rules live in report-mirror.js only (the writer calls them); the matrix's lab switch
//      (opts.matrixRtl) is the engine's, set by the lab alone; the default is today's
//   node test-0.3.1-mirror-parity.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), require = createRequire(import.meta.url);
const Px = require('../assets/js/pbip-export.js'), E = require('../assets/js/design-engine.js'), Mirror = require('../assets/js/report-mirror.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const L = (v) => ({ expr: { Literal: { Value: v } } });
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value) : undefined);

// ---------- the English report (W's slots; a person's own visuals added) ----------
const T = 'Work Orders', M = (m, x) => Object.assign({ t: T, m }, x || {}), C = (c, x) => Object.assign({ t: T, c }, x || {});
// (both in AED, so the combo is one chart with one axis: visual-gallery.js fits)
const COST = M('Total Cost', { cardFormat: '"AED" #,0' }), LAB = M('Total Labour', { cardFormat: '"AED" #,0' }), MAT = M('Total Materials');
const MONTH = { t: 'Dim Date', c: 'Month', kind: 'month', sortBy: { t: 'Dim Date', c: 'Month Key' } };
const BIND = { kpis: [COST, LAB, MAT], measure: COST, date: MONTH, cats: { bar: C('Technician'), column: MONTH, donut: C('Status'), line: MONTH }, y: {},
  table: [C('Technician'), COST, LAB], slicers: [C('Department', { few: 3, texts: ['HVAC', 'Electrical', 'Plumbing'] }), C('Status'), null], tip: { card: COST, cat: C('Technician'), y: COST },
  gallery: { combo: { axis: MONTH, columns: COST, line: LAB } } };
// (the person confirmed the two compare, so the combo is one chart: axis-units.js, never a second axis)
BIND.axes = { confirmed: [require('../assets/js/axis-units.js').record(COST, LAB, 'comparable', [])], tables: [] };
const PW = 1280, PH = 720;
const SLOTS = [
  { kind: 'kpi', x: 20, y: 20, w: 600, h: 100 }, { kind: 'slicer', x: 640, y: 20, w: 620, h: 100 },
  { kind: 'bar', x: 20, y: 140, w: 400, h: 180 }, { kind: 'column', x: 440, y: 140, w: 400, h: 180 }, { kind: 'line', x: 860, y: 140, w: 400, h: 180 },
  { kind: 'combo', x: 20, y: 340, w: 400, h: 180 }, { kind: 'waterfall', x: 440, y: 340, w: 400, h: 180 }, { kind: 'donut', x: 860, y: 340, w: 400, h: 180 },
  { kind: 'table', x: 20, y: 540, w: 500, h: 170 }, { kind: 'matrix', x: 540, y: 540, w: 420, h: 170 }, { kind: 'text', x: 980, y: 540, w: 280, h: 60, text: 'Open work orders by month' }];
const mirrored = (s) => Object.assign({}, s, { x: PW - s.x - s.w });
const BLANK = Buffer.from(Mirror.BLANK_PNG, 'base64');   // (the writer's own transparent page image: the twin mirrors such a page)
const build = (name, lang, slots, extra) => {
  const d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma';
  E.repairState(d);
  return Px.build(Object.assign({ name, title: 'Work orders', pageName: 'Overview', lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), sample: false,
    model: { byPath: 'Service Orders.SemanticModel' }, bind: BIND, texts: E.REPORT_TEXTS[lang], chartAxes: 'mirrored', gallery: true,
    pages: [{ name: 'Overview', page: { w: PW, h: PH }, slots, panel: null, hand: true, png: BLANK }] }, extra || {}));
};
const pageVisuals = (r) => { const by = {}; r.files.filter((f) => /\/visual\.json$/.test(f.path)).forEach((f) => { const pid = f.path.split('/pages/')[1].split('/')[0]; (by[pid] = by[pid] || []).push(JSON.parse(String(f.data))); }); return by; };
const firstPage = (r) => { const order = JSON.parse(String(r.files.find((f) => /pages\/pages\.json$/.test(f.path)).data)).pageOrder; return order[0]; };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.stack || e).slice(0, 400) }; } };
const EN = get(() => build('Parity', 'en', SLOTS)), AR = get(() => build('Parity AR', 'ar', SLOTS.map(mirrored)));
const PEN = get(() => build('Pills', 'en', [{ kind: 'slicer', x: 20, y: 20, w: 1240, h: 140 }], { slicerStyle: 'pills' })), PAR = get(() => build('Pills AR', 'ar', [{ kind: 'slicer', x: 20, y: 20, w: 1240, h: 140 }], { slicerStyle: 'pills' }));
chk(() => EN.files && AR.files && PEN.files && PAR.files, () => `S1. the writer builds the English and the Arabic reports: ${EN.threw || AR.threw || PEN.threw || PAR.threw}`);
const pill = (r) => (pageVisuals(r)[firstPage(r)] || []).find((v) => v.visual && v.visual.visualType === 'advancedSlicerVisual');

// a person's own visuals on the English page (as Desktop saves them); the pill from the pills report, moved below
const ref = (t, c) => ({ Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }), mref = (t, m) => ({ Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } });
const proj = (f, q, n) => ({ field: f, queryRef: q, nativeQueryRef: n });
const S_VIS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
const vc = (name, x, y, w, h, visual, extra) => Object.assign({ $schema: S_VIS, name, position: { x, y, z: 50000 + x, height: h, width: w, tabOrder: 90000 + x }, visual }, extra || {});
const OWN = [
  vc('ownCard', 20, 730, 200, 100, { visualType: 'card', query: { queryState: { Values: { projections: [proj(mref(T, 'Total Cost'), T + '.Total Cost', 'Total Cost')] } } }, visualContainerObjects: { title: [{ properties: { show: L('true'), text: L("'Cost'") } }] } }),
  vc('ownShape', 240, 730, 120, 100, { visualType: 'shape', objects: { shape: [{ properties: { tileShape: L("'rectangleRounded'") } }] } }),
  vc('ownStack', 380, 730, 400, 200, { visualType: 'barChart', query: { queryState: { Category: { projections: [proj(ref(T, 'Technician'), T + '.Technician', 'Technician')] }, Series: { projections: [proj(ref(T, 'Department'), T + '.Department', 'Department')] }, Y: { projections: [proj(mref(T, 'Total Cost'), T + '.Total Cost', 'Total Cost')] } } },
    objects: { legend: [{ properties: { show: L('true'), position: L("'Top'") } }] }, visualContainerObjects: { title: [{ properties: { show: L('true'), text: L("'Cost by technician and department'"), alignment: L("'left'") } }] } }),
  vc('ownButton', 800, 730, 160, 40, { visualType: 'actionButton', objects: { icon: [{ properties: { shapeType: L("'back'"), placement: L("'left'") }, selector: { id: 'default' } }], text: [{ properties: { show: L('true') } }, { properties: { text: L("'Back'"), horizontalAlignment: L("'left'") }, selector: { id: 'default' } }] },
    visualContainerObjects: { visualLink: [{ properties: { show: L('true'), type: L("'Back'") } }], padding: [{ properties: { left: L('20D'), right: L('4D') } }] } }),
  { $schema: S_VIS, name: 'ownGroup', position: { x: 980, y: 730, z: 51000, height: 120, width: 280 }, visualGroup: { displayName: 'Note', groupMode: 'ScaleMode' } },
  vc('ownGroupText', 10, 10, 200, 40, { visualType: 'textbox', objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: 'A note' }], horizontalTextAlignment: 'left' }] } }] } }, { parentGroupName: 'ownGroup' }),
  vc('ownGroupCard', 10, 60, 120, 50, { visualType: 'card', query: { queryState: { Values: { projections: [proj(mref(T, 'Open Orders'), T + '.Open Orders', 'Open Orders')] } } } }, { parentGroupName: 'ownGroup' }),
  vc('ownImage', 20, 850, 120, 60, { visualType: 'image', objects: { general: [{ properties: { imageUrl: { expr: { ResourcePackageItem: { PackageName: 'RegisteredResources', PackageType: 1, ItemName: 'parity-background.png' } } } } }] } })];

// ---------- what is meant to differ, with why (taken out before comparing) ----------
const INTENDED = {
  names: 'visual names, filter names and the tooltip page\'s id: each path makes its own (the copy names its Arabic pages\' visuals anew)',
  texts: 'texts: the writer writes its own Arabic words (design-engine REPORT_TEXTS, the field names it gives), the twins the approved labels',
  tabOrder: 'Tab stops: both read right to left (report-a11y.js), numbered by each path; compared as an order, not as numbers',
  emptyText: 'an empty text box (the writer\'s panel behind a row): the twin right-aligns its empty paragraph; nothing is drawn',
  hiddenTitle: 'a hidden title (show false): the twin right-aligns it too; not drawn, so it reads the same',
  textSize: 'text sizes, column widths and the title\'s heading: the writer fits them to its Arabic font (Tahoma, measured); the twins keep the original\'s (R1: never a size)',
  table: 'tables: the writer builds its right-to-left table from the fields (the first text column first so the total row says "Total", round 10; a hidden name column, round 23); the twins reverse the original\'s columns. Same columns, a different order',
  matrix: 'matrices: no new matrix behaviour reaches users before the laptop proves a variant (M1); create_report keeps its measures in order, the twins reverse them (today\'s, R1\'s sentence). When the variant is chosen it is one engine value for every path',
  slicerBar: 'the slicer row and its Reset button: the writer lays them out for the Arabic texts\' widths (the Reset icon only with room); the twins mirror the English row',
  copyFit: 'the copy keeps the language button\'s box free (R1); its Arabic pages are otherwise the twin\'s',
  copyIds: 'the copy\'s own references: its bookmarks, each Arabic slicer synced with its English one (a sync group, R1/X1), and an Arabic copy of each text measure ("No data AR: ...") so the English pages keep theirs',
  noDataCard: 'the "No data" card over a table names the table\'s first measure: the writer\'s table order (INTENDED.table)',
  zOrder: 'z: each path numbers the layers; compared as an order',
  bilingual: 'the bilingual report (B) against the copy (C) of the same English report: the report\'s own name (its .platform\'s displayName, and a new logicalId as every report gets; the folder and the .pbip named without " (EN-AR)": it is a new report, not a copy). Nothing else: the same engine builds both'
};
// a difference found, not meant: two decisions of the owner meet; taken out here, said in M1.md for the owner to decide
const KNOWN = {
  textPanel: 'a text box with text on a theme that draws panels: create_report writes its text slot as a panel on purpose (round 13: a panel with a title), the twins switch the panel off on the Arabic pages (R1, item 4: a text box with text is a heading). The owner decides which one both follow'
};

// ---------- the comparison ----------
const KIND = (v) => {
  if (v.visualGroup) return 'group';
  const t = v.visual && v.visual.visualType;
  return { cardVisual: 'newCard', card: 'card', clusteredBarChart: 'bar', barChart: 'stackedBar', clusteredColumnChart: 'column', columnChart: 'column', lineChart: 'line', lineClusteredColumnComboChart: 'combo', waterfallChart: 'waterfall',
    donutChart: 'donut', tableEx: 'table', pivotTable: 'matrix', slicer: 'slicer', advancedSlicerVisual: 'pills', textbox: 'textbox', actionButton: 'button', image: 'image', shape: 'shape' }[t] || 'other:' + t;
};
const TEXT_KEYS = new Set(['text', 'displayName', 'altText', 'value', 'titleText', 'enabledTooltip', 'disabledTooltip', 'tooltip', 'showBlankAs', 'subTitleText', 'labelText', 'placeholderText']);
const canon = (o) => (Array.isArray(o) ? o.map(canon) : o && typeof o === 'object' ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, canon(o[k])])) : o);
// the shape compared: everything a reader sees but the meant differences
function shape(v, opts) {
  const o = opts || {}, j = JSON.parse(JSON.stringify(v));
  // (INTENDED.copyIds) the copy's own references
  if (j.visual) delete j.visual.syncGroup;
  const ids = (x) => { if (Array.isArray(x)) return x.forEach(ids); if (x && typeof x === 'object') Object.keys(x).forEach((k) => { if (k === 'bookmark') delete x[k]; else if (k === 'Property' || k === 'queryRef' || k === 'nativeQueryRef') { if (typeof x[k] === 'string') x[k] = x[k].replace(/No data AR: /, 'No data: '); } else ids(x[k]); }); };
  ids(j);
  delete j.name; delete j.parentGroupName; delete j.$schema; delete j.howCreated;
  if (j.position) { delete j.position.tabOrder; delete j.position.z; }
  if (j.filterConfig && Array.isArray(j.filterConfig.filters)) j.filterConfig.filters.forEach((f) => { delete f.name; });
  const walk = (x) => { if (Array.isArray(x)) return x.forEach(walk); if (x && typeof x === 'object') Object.keys(x).forEach((k) => { if (TEXT_KEYS.has(k) || (o.sizes && ['fontSize', 'heading', 'titleWrap', 'fontFamily'].includes(k))) delete x[k]; else walk(x[k]); }); };
  const vis = j.visual || {};
  walk(vis.objects || {}); walk(vis.visualContainerObjects || {}); walk(j.visualGroup || {});
  if (vis.objects && o.sizes) delete vis.objects.columnWidth;
  if (vis.query) walk(vis.query);
  const vco = vis.visualContainerObjects || {};
  (vco.visualTooltip || []).forEach((e) => { if (e.properties) delete e.properties.section; });
  // a hidden title: its alignment is not drawn
  (vco.title || []).forEach((e) => { if (e.properties && lit(e.properties.show) === 'false') delete e.properties.alignment; });
  // (INTENDED.emptyText) an empty paragraph's alignment is not drawn
  (vis.objects && vis.objects.general || []).forEach((e) => { (e.properties && e.properties.paragraphs || []).forEach((p) => { if (!(p.textRuns || []).some((r) => String(r.value || '').trim())) delete p.horizontalTextAlignment; delete p.textRuns; }); });
  return canon(j);
}
const diff = (a, b, p = '', out = []) => {
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b) && (!Array.isArray(a) || a.length === b.length)) { new Set([...Object.keys(a), ...Object.keys(b)]).forEach((k) => diff(a[k], b[k], p + '.' + k, out)); }
  else out.push(p + ': ' + JSON.stringify(a === undefined ? '(none)' : a).slice(0, 160) + ' | ' + JSON.stringify(b === undefined ? '(none)' : b).slice(0, 160));
  return out;
};
// a page's visuals with their box on the page (a visual in a group: the group's place added)
const placed = (vs) => { const by = Object.fromEntries(vs.map((v) => [v.name, v])); return vs.map((v) => { const g = v.parentGroupName ? by[v.parentGroupName] : null, p = v.position || {};
  return { v, kind: KIND(v), group: g ? KIND(g) : '', x: p.x + (g ? g.position.x : 0), y: p.y + (g ? g.position.y : 0), w: p.width, h: p.height }; }); };
// each visual of a, met with the visual of b of its kind at the same box
const pair = (a, b, tol) => a.map((x) => ({ a: x, b: b.find((y) => y.kind === x.kind && y.group === x.group && Math.abs(y.x - x.x) <= tol && Math.abs(y.y - x.y) <= tol && Math.abs(y.w - x.w) <= tol && Math.abs(y.h - x.h) <= tol) || null }));

// ---------- the twins, through the server ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-m1-')));
fs.cpSync(path.join(HERE, 'test-models/service-orders/Service Orders.SemanticModel'), path.join(ROOT, 'so/Service Orders.SemanticModel'), { recursive: true });
let T_V = [], C_V = [], W_V = [];
if (EN.files) {
  const pid = firstPage(EN), pe = pill(PEN);
  EN.files.forEach((f) => { const p = path.join(ROOT, 'so', f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
  const vdir = path.join(ROOT, 'so/Parity.Report/definition/pages', pid, 'visuals');
  const add = (v) => { fs.mkdirSync(path.join(vdir, v.name), { recursive: true }); fs.writeFileSync(path.join(vdir, v.name, 'visual.json'), JSON.stringify(v, null, 2)); };
  OWN.forEach(add);
  if (pe) add(Object.assign(JSON.parse(JSON.stringify(pe)), { name: 'ownPills', position: Object.assign({}, pe.position, { x: 20, y: 940, z: 52000, tabOrder: 99000 }) }));
  // the page grows to hold the person's visuals
  const pj = path.join(ROOT, 'so/Parity.Report/definition/pages', pid, 'page.json'), page = rd(pj); page.height = 1080; fs.writeFileSync(pj, JSON.stringify(page, null, 2));
  W_V = (pageVisuals(AR)[firstPage(AR)] || []).concat(pill(PAR) ? [Object.assign(JSON.parse(JSON.stringify(pill(PAR))), { position: Object.assign({}, pill(PAR).position, { x: PW - 20 - pill(PAR).position.width, y: 940 }) })] : []);
}
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const approve = async (pid) => { const n = links().length; await w.call('approve_plan', { planId: pid }); const url = await linkAt(n); if (url) { await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId: pid }); } return url; };
const visualsOf = (dir, pid) => { const d = path.join(dir, 'definition/pages', pid, 'visuals'); return fs.existsSync(d) ? fs.readdirSync(d).map((n) => rd(path.join(d, n, 'visual.json'))) : []; };
const pagesOf = (dir) => (fs.existsSync(path.join(dir, 'definition/pages/pages.json')) ? rd(path.join(dir, 'definition/pages/pages.json')).pageOrder : []);
try {
  const PBIP = 'so/Parity.pbip';
  const twin = async (into) => {
    const a0 = Object.assign({ path: PBIP }, into ? { into } : {});
    const p0 = await w.call('create_arabic_twin', a0), labels = {}; let k = 0;
    ((p0.j && p0.j.texts) || []).filter((t) => t.text != null).forEach((t) => { labels[t.id] = t.draftArabic || `نص ${++k}`; });
    const p1 = await w.call('create_arabic_twin', Object.assign({ labels }, a0)), id = p1.j && p1.j.plan && p1.j.plan.planId;
    if (!id) return { err: 'no plan: ' + String(p1.t).slice(0, 300) };
    await approve(id);
    const wr = await w.call('create_arabic_twin', Object.assign({ planId: id }, a0));
    return wr.err ? { err: String(wr.t).slice(0, 300) } : { ok: true };
  };
  const t1 = await twin(null), t2 = await twin('same');
  chk(() => t1.ok && t2.ok, () => `S2. the twin and the copy are written: ${t1.err || ''} ${t2.err || ''}`);
  const TW = path.join(ROOT, 'so/Parity AR.Report'), CO = path.join(ROOT, 'so/Parity (EN-AR).Report');
  T_V = (pagesOf(TW)[0] && visualsOf(TW, pagesOf(TW)[0])) || [];
  // (the copy's Arabic page: the copy of the English page, by the copy's own page names)
  const cp = pagesOf(CO), en0 = pagesOf(path.join(ROOT, 'so/Parity.Report'));
  const arPage = cp.filter((p) => !en0.includes(p)).map((p) => ({ p, n: visualsOf(CO, p).length })).sort((a, b) => b.n - a.n)[0];
  C_V = arPage ? visualsOf(CO, arPage.p) : [];
  chk(() => T_V.length >= OWN.length && C_V.length >= T_V.length, () => `S3. the twin's page and the copy's Arabic page hold the visuals: ${T_V.length}, ${C_V.length}`);
} finally { await w.close(); }

const PT = placed(T_V), PC = placed(C_V), PWr = placed(W_V);
const kindsT = [...new Set(PT.map((x) => x.kind))].sort();
const ALL = ['button', 'card', 'column', 'combo', 'donut', 'group', 'image', 'line', 'matrix', 'newCard', 'pills', 'shape', 'slicer', 'stackedBar', 'table', 'textbox', 'waterfall', 'bar'].sort();
chk(() => ALL.every((k) => kindsT.includes(k)), () => `S4. the twin's page holds every kind: missing ${ALL.filter((k) => !kindsT.includes(k)).join(', ')} (has ${kindsT.join(', ')})`);

// ---------- C against T: every kind, the same visual ----------
// (the copy keeps the language button's box free and adds the button: INTENDED.copyFit; the twin's fitting widens
// buttons and headers to their Arabic in both)
const rank = (list, key) => { const s = list.slice().sort((a, b) => key(a) - key(b)); return (x) => s.indexOf(x); };
ALL.forEach((kind) => {
  const ps = pair(PT.filter((x) => x.kind === kind), PC, 0.5), d = ps.flatMap((p) => (p.b ? diff(shape(p.a.v), shape(p.b.v)).map((x) => p.a.v.name + x) : [p.a.v.name + ': not on the copy\'s page at the same place']));
  chk(() => ps.length && d.length === 0, () => `C ${kind}: the copy's Arabic visual differs from the twin's (${ps.length} compared): ${d.slice(0, 6).join(' ; ')}`);
});
// the order of Tab stops and layers is the same on both
chk(() => { const ps = pair(PT, PC, 0.5).filter((p) => p.b && p.a.v.position.tabOrder != null && p.b.v.position.tabOrder != null), ra = rank(ps, (p) => p.a.v.position.tabOrder), rb = rank(ps, (p) => p.b.v.position.tabOrder); return ps.length > 5 && ps.every((p) => ra(p) === rb(p)); },
  () => 'C order: the copy\'s Tab stops on the Arabic page are in the twin\'s order (INTENDED.tabOrder)');

// ---------- W against T: what create_report writes in Arabic is what the twin makes of its English ----------
// (the person's own visuals are not the writer's: the stacked bar, the card, the shape, the image, the button and the
// group are compared C against T above, and against the engine's rule below)
const W_KINDS = ['bar', 'column', 'combo', 'donut', 'line', 'matrix', 'newCard', 'pills', 'slicer', 'table', 'textbox', 'waterfall'];
W_KINDS.forEach((kind) => {
  // pills: one each, compared without the place (the writer's pill and the person's copy of it sit apart)
  // (the person's own visuals are not the writer's; the pills: the person's copy of the writer's English pill)
  const tables = PT.filter((x) => x.kind === 'table'), onTable = (x) => tables.some((t) => Math.abs(t.x - x.x) <= 1 && Math.abs(t.y - x.y) <= 1 && Math.abs(t.w - x.w) <= 1);
  const tl = PT.filter((x) => x.kind === kind && (kind === 'pills' ? x.v.name === 'ownPills' : x.v.name.indexOf('own') !== 0) && !(kind === 'newCard' && onTable(x))), wl = PWr.filter((x) => x.kind === kind);
  const fieldOf = (x) => JSON.stringify((((((x.v.visual || {}).query || {}).queryState || {}).Values || {}).projections || []).map((p) => p.field));
  // pills and slicers: by their field, without the place (INTENDED.slicerBar); a table: its height fitted (INTENDED.textSize)
  const ps = kind === 'pills' || kind === 'slicer' ? tl.map((a) => ({ a, b: wl.find((b) => fieldOf(b) === fieldOf(a)) || null }))
    : kind === 'table' ? tl.map((a) => ({ a, b: wl.find((b) => Math.abs(b.x - a.x) <= 1 && Math.abs(b.y - a.y) <= 1 && Math.abs(b.w - a.w) <= 1) || null }))
    : pair(tl, wl, 1);
  const d = ps.flatMap((p) => {
    if (!p.b) return [p.a.v.name + ': the writer has no ' + kind + ' at the same place (' + [p.a.x, p.a.y, p.a.w, p.a.h].join(',') + ')'];
    const a = shape(p.a.v, { sizes: true }), b = shape(p.b.v, { sizes: true });
    if (kind === 'pills' || kind === 'slicer' || kind === 'table') { delete a.position; delete b.position; }
    // (KNOWN.textPanel) the twins' panel switched off on a text box with text
    if (kind === 'textbox') [a, b].forEach((x) => { const c = x.visual.visualContainerObjects || {}; ['background', 'border', 'dropShadow'].forEach((k) => delete c[k]); });
    // (INTENDED.table, INTENDED.matrix: the same projections, in another order; a table's alignment follows its columns)
    if (kind === 'table' || kind === 'matrix') [a, b].forEach((x) => { x.visual.query.queryState.Values.projections.sort((m, n) => JSON.stringify(m).localeCompare(JSON.stringify(n))); if (x.visual.objects) delete x.visual.objects.columnFormatting; });
    if (kind === 'table') [a, b].forEach((x) => { x.visual.query.queryState.Values.projections = x.visual.query.queryState.Values.projections.filter((q) => !/Row label: /.test(JSON.stringify(q))); });
    return diff(b, a).map((x) => p.a.v.name + x);
  });
  chk(() => ps.length && d.length === 0, () => `W ${kind}: create_report's Arabic ${kind} differs from the twin's (${ps.length} compared; first the writer's, then the twin's): ${d.slice(0, 6).join(' ; ')}`);
});
// the meant differences, said where they show: the table's column order and the matrix's measures
{
  const t = PT.filter((x) => x.kind === 'table').map((a) => ({ a, b: PWr.find((b) => b.kind === 'table' && Math.abs(b.x - a.x) <= 1 && Math.abs(b.y - a.y) <= 1) })).find((p) => p.b), m = pair(PT.filter((x) => x.kind === 'matrix'), PWr, 1).find((p) => p.b);
  const refs = (v, r) => v.visual.query.queryState[r].projections.map((p) => p.queryRef);
  chk(() => t && refs(t.b.v, 'Values')[0] === T + '.Technician' && refs(t.a.v, 'Values').slice(-1)[0] === T + '.Technician', () => `W table order: the writer keeps the name column first (INTENDED.table), the twin reverses: ${t && JSON.stringify([refs(t.b.v, 'Values'), refs(t.a.v, 'Values')])}`);
  chk(() => m && JSON.stringify(refs(m.b.v, 'Values')) === JSON.stringify(refs(m.a.v, 'Values').slice().reverse()), () => `W matrix order: the twin reverses the measures, the writer keeps them (INTENDED.matrix): ${m && JSON.stringify([refs(m.b.v, 'Values'), refs(m.a.v, 'Values')])}`);
}

// ---------- the person's own visuals: the engine's rules, as the twin wrote them ----------
const byName = (list, n) => (list.find((x) => x.v.name === n) || {}).v;
{
  const s = byName(PT, 'ownStack'), b = byName(PT, 'ownButton');
  const p0 = (v, o) => ((v.visual.objects || {})[o] || []).find((e) => !e.selector) || { properties: {} };
  chk(() => s && lit(p0(s, 'legend').properties.position) === "'TopRight'" && lit(p0(s, 'categoryAxis').properties.switchAxisPosition) === 'true' && lit(p0(s, 'valueAxis').properties.invertAxis) === 'true',
    () => `O1 the stacked bar: names at the right, bars from the right, the legend at the top right: ${JSON.stringify(s && s.visual.objects)}`);
  chk(() => b && lit((b.visual.objects.text.find((e) => e.selector) || { properties: {} }).properties.horizontalAlignment) === "'right'" && lit(b.visual.objects.icon[0].properties.placement) === "'right'" && lit(b.visual.visualContainerObjects.padding[0].properties.left) === '4D',
    () => `O2 the button: text and icon at the right, its padding swapped: ${JSON.stringify(b && b.visual)}`.slice(0, 600));
  const g = byName(PT, 'ownGroup'), gt = T_V.find((v) => v.name === 'ownGroupText');
  chk(() => g && gt && g.position.x === PW - 980 - 280 && gt.position.x === 280 - 10 - 200, () => `O3 the group mirrored on the page, its visuals inside it: ${JSON.stringify([g && g.position, gt && gt.position])}`);
}

// a column chart over a date column (a continuous axis ignores the sort and honours invertAxis: round 13, the writer's
// comment): the writer keeps reversing it once the engine writes it, and the twin of its English does the same
{
  const CREATED = C('Created', { type: 'dateTime' }), b0 = Object.assign({}, BIND, { cats: Object.assign({}, BIND.cats, { column: CREATED }) });
  const one = (lang, x) => { const d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma'; E.repairState(d); const r = Px.build({ name: 'D ' + lang, title: 'D', pageName: 'D', lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), sample: false,
    model: { byPath: 'Service Orders.SemanticModel' }, bind: b0, texts: E.REPORT_TEXTS[lang], chartAxes: 'mirrored', pages: [{ name: 'D', page: { w: PW, h: PH }, slots: [{ kind: 'column', x, y: 20, w: 600, h: 300 }], panel: null, hand: true, png: BLANK }] });
    return (pageVisuals(r)[firstPage(r)] || []).find((v) => v.visual && v.visual.visualType === 'clusteredColumnChart'); };
  const de = get(() => one('en', 20)), da = get(() => one('ar', PW - 620)), dt = de && de.visual && Mirror.mirrorVisual(de, PW, { dateColumns: [T + '.Created'] }).json;
  const inv = (v) => v && v.visual && lit((((v.visual.objects || {}).categoryAxis || []).find((e) => !e.selector) || { properties: {} }).properties.invertAxis);
  chk(() => inv(da) === 'true' && inv(dt) === 'true' && JSON.stringify(shape(da, { sizes: true })) === JSON.stringify(shape(dt, { sizes: true })), () => `W date: a column chart over a date column is reversed by invertAxis by the writer and the twin alike: ${JSON.stringify([da && da.visual && da.visual.objects, dt && dt.visual.objects])}`.slice(0, 900));
}

// ---------- B: create_report with languages "en+ar" (X2) against the copy of the same English report ----------
// the same plan made twice through the server, in two folders: (B) with languages "en+ar", every text and field given
// Arabic; (Cb) the plain English report of the same plan, then create_arabic_twin into "same" with the same Arabic (each
// text's id given the Arabic of its words, the same terms, no month script, as the bilingual plan has none)
{
  ['b', 'c'].forEach((d) => fs.cpSync(path.join(HERE, 'test-models/service-orders/Service Orders.SemanticModel'), path.join(ROOT, d, 'Service Orders.SemanticModel'), { recursive: true }));
  const wb = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
  const ok = (r) => !r.err && r.j;
  const approveB = async (pid) => { const n = links().length; await wb.call('approve_plan', { planId: pid }); const url = await linkAt(n); if (url) { await req(url, 'POST', 'decision=approve'); await wb.call('approve_plan', { planId: pid }); } };
  const BASE = { lang: 'en', layout: 'exec', name: 'Parity B', title: 'Work orders', secondPage: true, gallery: true };
  const at = {}, terms = {}; let k = 0, written = { b: false, c: false }, why = '';
  try {
    // (B) the plan: terms for every field, then an Arabic text for every text left (two rounds, as a person approves)
    let a = Object.assign({ path: 'b/Service Orders.SemanticModel', languages: 'en+ar' }, BASE), pl = await wb.call('plan_layout', a);
    for (let round = 0; round < 4 && ok(pl) && pl.j.bilingual; round++) {
      const J = pl.j.bilingual; let more = false;
      ((J.terminology || {}).sheet || []).forEach((r) => { if (r.field && terms[r.field] == null) { terms[r.field] = r.ar && r.status !== 'kept' ? r.ar : `حقل ${++k}`; more = true; } });
      (J.texts || []).forEach((t) => { if (t.text != null && !t.field && t.arabic == null && at[t.text] == null) { at[t.text] = t.draftArabic || (/\{1\}/.test(t.text) ? `أعلى {1} من {2}: نص ${++k}` : `نص ${++k}`); more = true; } });
      if (!more) break;
      a = Object.assign({}, a, { arabicTerms: Object.assign({}, terms), arabicTexts: Object.assign({}, at) }); pl = await wb.call('plan_layout', a);
    }
    const idB = ok(pl) && pl.j.plan && pl.j.plan.planId;
    if (idB) { await approveB(idB); const cr = await wb.call('create_report', Object.assign({}, a, { planId: idB, design: pl.j.design })); written.b = !cr.err; if (cr.err) why += ' B: ' + String(cr.t).slice(0, 300); } else why += ' B: no plan: ' + String(pl.t).slice(0, 300);
    // (Cb) the English report of the same plan, then its copy into "same" with the same Arabic
    const ac = Object.assign({ path: 'c/Service Orders.SemanticModel' }, BASE), pc = await wb.call('plan_layout', ac), idC = ok(pc) && pc.j.plan && pc.j.plan.planId;
    if (idC) { await approveB(idC); await wb.call('create_report', Object.assign({}, ac, { planId: idC, design: pc.j.design })); }
    const t0 = { path: 'c/Parity B.pbip', into: 'same', terms, arabicMonth: false }, labels = {};
    let p0 = await wb.call('create_arabic_twin', t0);
    for (let from = 0, n = 0; ok(p0) && n < 10; n++) { (p0.j.texts || []).forEach((t) => { if (t.text != null && at[t.text] != null) labels[t.id] = at[t.text]; }); if (!p0.j.moreTexts) break; from = p0.j.moreTexts.from; p0 = await wb.call('create_arabic_twin', Object.assign({ textsFrom: from }, t0)); }
    const p1 = await wb.call('create_arabic_twin', Object.assign({ labels }, t0)), idT = ok(p1) && p1.j.plan && p1.j.plan.planId;
    if (idT) { await approveB(idT); const tw = await wb.call('create_arabic_twin', Object.assign({ labels, planId: idT }, t0)); written.c = !tw.err; if (tw.err) why += ' C: ' + String(tw.t).slice(0, 300); } else why += ' C: no plan: ' + String(p1.t).slice(0, 300);
  } catch (e) { why += ' threw: ' + String(e && e.stack || e).slice(0, 400); } finally { await wb.close(); }
  const RB = path.join(ROOT, 'b/Parity B.Report'), RC = path.join(ROOT, 'c/Parity B (EN-AR).Report');
  chk(() => written.b && written.c && fs.existsSync(RB) && fs.existsSync(RC) && !fs.existsSync(path.join(ROOT, 'b/Parity B (EN-AR).Report')), () => `B1 the bilingual report (its own name) and the copy of the same English report are written:${why}`);
  // (create_report draws new random ids for its pages, visuals, bookmarks and filters, so two builds of one plan differ in
  // them, and the copy's own ids are hashes of them) each report read with its ids named by their place: the n-th page
  // in pages.json, its visuals by layer, the bookmarks in bookmarks.json's order, every other id in the order it is met
  // (files in that order): then the two are compared byte for byte, path by path
  const filesUnder = (dir) => { const out = []; const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else out.push(path.relative(dir, f).split(path.sep).join('/')); }); if (fs.existsSync(dir)) rec(dir); return out.sort(); };
  const canonOf = (dir) => {
    const files = filesUnder(dir).filter((f) => f !== '.platform'), text = Object.fromEntries(files.map((f) => [f, fs.readFileSync(path.join(dir, f), 'utf8')])), names = new Map();
    pagesOf(dir).forEach((pid, i) => { names.set(pid, `PAGE${i}`);
      visualsOf(dir, pid).sort((m, n) => (m.position.z || 0) - (n.position.z || 0) || (m.position.y || 0) - (n.position.y || 0) || (m.position.x || 0) - (n.position.x || 0)).forEach((v, j) => names.set(String(v.name), `P${i}V${j}`)); });
    const bm = text['definition/bookmarks/bookmarks.json'] ? JSON.parse(text['definition/bookmarks/bookmarks.json']).items || [] : [];
    bm.flatMap((it) => [it.name].concat(it.children || [])).forEach((n, k) => { if (!names.has(String(n))) names.set(String(n), `BM${k}`); });
    const known = (t) => t.replace(/[0-9a-f]{20,}/g, (x) => (names.has(x) ? names.get(x) : x));
    const order = files.map((f) => ({ f, c: known(f) })).sort((m, n) => (m.c < n.c ? -1 : m.c > n.c ? 1 : 0));
    let n = 0; order.forEach(({ f }) => (known(f) + '\n' + text[f]).replace(/[0-9a-f]{20,}/g, (x) => { if (!names.has(x)) names.set(x, `ID${n++}`); return x; }));
    const all = (t) => t.replace(/[0-9a-f]{20,}/g, (x) => names.get(x) || x);
    return { map: Object.fromEntries(order.map(({ f }) => [all(f), all(text[f])])), page: (i) => `definition/pages/PAGE${i}/` };
  };
  const CB = canonOf(RB), CC = canonOf(RC), KB = Object.keys(CB.map), KC = Object.keys(CC.map);
  const ordB = pagesOf(RB), ordC = pagesOf(RC), half = ordC.length / 2, same = ordB.length >= 4 && ordB.length === ordC.length;
  chk(() => ordB.length >= 4 && ordB.length === ordC.length && ordB.every((p, i) => (rd(path.join(RB, 'definition/pages', p, 'page.json')).displayName === rd(path.join(RC, 'definition/pages', ordC[i], 'page.json')).displayName)),
    () => `B2 the same pages in the same order (the English, then their Arabic pages): ${JSON.stringify([ordB.length, ordC.length])}`);
  // a set of files compared; a difference said by its place in the JSON (shape() of the visual for a visual)
  const filesDiff = (keep) => { const kb = KB.filter(keep), kc = KC.filter(keep);
    if (JSON.stringify(kb) !== JSON.stringify(kc)) return [`files: ${JSON.stringify(kb.filter((f) => !kc.includes(f)).concat(kc.filter((f) => !kb.includes(f)).map((f) => 'copy only: ' + f))).slice(0, 400)}`];
    return kb.filter((f) => CB.map[f] !== CC.map[f]).flatMap((f) => { let x, y; try { x = JSON.parse(CB.map[f]); y = JSON.parse(CC.map[f]); } catch (e) { return [f + ': differs (not JSON)']; }
      const d = diff(x, y); return (d.length ? d : ['(whitespace)']).slice(0, 3).map((t) => f + t); }); };
  for (let i = half; i < ordC.length; i++) { const d = filesDiff((f) => f.startsWith(CB.page(i))); chk(() => same && d.length === 0, () => `B3 Arabic page ${i - half + 1}: the bilingual report's differs from the copy's (positions, alignment, order, projections, sort, formatting, phone layout): ${d.slice(0, 6).join(' ; ')}`); }
  // the order of Tab stops on each Arabic page (inside the files above; said apart so a failure names it)
  const tabs = (C, i) => JSON.stringify(Object.keys(C.map).filter((f) => f.startsWith(C.page(i)) && f.endsWith('/visual.json')).map((f) => ({ f, t: (JSON.parse(C.map[f]).position || {}).tabOrder })).filter((x) => x.t != null).sort((m, n) => m.t - n.t).map((x) => x.f));
  chk(() => same && Array.from({ length: half }, (x, k) => half + k).every((i) => tabs(CB, i) === tabs(CC, i)), () => 'B4 each Arabic page\'s Tab stops are in the copy\'s order (the visuals named by their layer)');
  { const d = filesDiff((f) => Array.from({ length: half }, (x, i) => CB.page(i)).some((p) => f.startsWith(p))); chk(() => same && d.length === 0, () => `B5 the English half is the copy's English pages (each page's own files, the language buttons and the slicers' sync groups): ${d.slice(0, 6).join(' ; ')}`); }
  // every other file of the report: the same, but the report's own name (INTENDED.bilingual)
  { const d = filesDiff((f) => !/^definition\/pages\/PAGE\d+\//.test(f));
    const plB = fs.existsSync(path.join(RB, '.platform')) ? rd(path.join(RB, '.platform')) : {}, plC = fs.existsSync(path.join(RC, '.platform')) ? rd(path.join(RC, '.platform')) : {};
    chk(() => KB.length > 3 && d.length === 0 && plB.metadata && plB.metadata.displayName === 'Parity B' && plC.metadata.displayName === 'Parity B (EN-AR)' && JSON.stringify(Object.assign({}, plB, { metadata: null, config: null })) === JSON.stringify(Object.assign({}, plC, { metadata: null, config: null })),
      () => `B6 the report's other files (pages.json, bookmarks, report measures, theme, report.json, definition.pbir) are the copy's, the name aside (INTENDED.bilingual): ${d.slice(0, 6).join(' ; ')} ${JSON.stringify([plB.metadata, plC.metadata])}`); }
}

// ---------- E: one engine ----------
const SRC = (f) => fs.readFileSync(path.join(HERE, '..', 'assets/js', f), 'utf8');
// the writer's chart code holds no right-to-left axis setting of its own (each one is report-mirror.js's)
chk(() => typeof Mirror.mirrorChart === 'function' && !/invertAxis: bool|switchAxisPosition: bool/.test(SRC('pbip-query.js')) && !/c\.mirror/.test(SRC('visual-gallery.js')) && /Mirror\(\)\.mirrorChart|Mirror\.mirrorChart/.test(SRC('pbip-page.js') + SRC('pbip-query.js')),
  () => 'E1 the writer\'s right-to-left charts come from report-mirror.js (mirrorChart): no axis setting of its own in pbip-query.js (mirrorChart), visual-gallery.js (objects\' mirror) or pbip-page.js');
// the website shares the engine: the Theme Generator's Arabic download with the person's model asks for mirrored charts
// (theme-generator.js chartAxes), so its writer's scripts load report-mirror.js (after the visual catalog it reads) before
// pbip-query.js (found by the website's pbip suite: no download at all without it)
chk(() => { const tg = SRC('theme-generator.js'), at = (f) => tg.indexOf('/assets/js/' + f); return at('visual-types.min.js') > 0 && at('visual-types.min.js') < at('report-mirror.min.js') && at('report-mirror.min.js') < at('pbip-query.min.js') && fs.existsSync(path.join(HERE, '..', 'assets/js/report-mirror.min.js')); },
  () => 'E6 the website loads the shared engine (report-mirror.min.js, after visual-types.min.js) before the writer that calls it');
// the matrix: the lab switch is the engine's, its default today's (the measures reversed), set by nothing but the lab
const MX = { $schema: S_VIS, name: 'mx', position: { x: 20, y: 20, z: 1, width: 600, height: 300 }, visual: { visualType: 'pivotTable', query: { queryState: {
  Rows: { projections: [proj(ref(T, 'Technician'), T + '.Technician', 'Technician')] }, Columns: { projections: [proj(ref('Dim Date', 'Month'), 'Dim Date.Month', 'Month')] },
  Values: { projections: [proj(mref(T, 'Total Cost'), T + '.Total Cost', 'Total Cost'), proj(mref(T, 'Total Labour'), T + '.Total Labour', 'Total Labour')] } } } } };
chk(() => Array.isArray(Mirror.MATRIX_RTL) && Mirror.MATRIX_RTL_DEFAULT === 'values' && Mirror.MATRIX_RTL.includes('values') && Mirror.MATRIX_RTL.includes('columnsDescending'),
  () => `E2 the engine lists its matrix variants (MATRIX_RTL) with today's as the default: ${JSON.stringify([Mirror.MATRIX_RTL, Mirror.MATRIX_RTL_DEFAULT])}`);
chk(() => { const a = Mirror.mirrorVisual(MX, PW, {}).json, b = Mirror.mirrorVisual(MX, PW, { matrixRtl: 'values' }).json; return JSON.stringify(a) === JSON.stringify(b) && !a.visual.query.sortDefinition && a.visual.query.queryState.Values.projections[0].queryRef === T + '.Total Labour'; },
  () => 'E3 by default a matrix is mirrored as today: its measures reversed, no sort written');
chk(() => { const a = Mirror.mirrorVisual(MX, PW, { matrixRtl: 'columnsDescending' }).json, s = a.visual.query.sortDefinition; return s && s.sort.length === 1 && JSON.stringify(s.sort[0].field) === JSON.stringify(ref('Dim Date', 'Month')) && s.sort[0].direction === 'Descending'; },
  () => 'E4 the lab\'s variant "columnsDescending": the matrix sorted Descending by its column field');
{
  const users = ['mcp/server.mjs', 'mcp/lib/arabic-twin.mjs', 'assets/js/pbip-page.js', 'assets/js/pbip-export.js', 'assets/js/pbip-query.js'].filter((f) => /matrixRtl:\s*['"](?!none)/.test(fs.readFileSync(path.join(HERE, '..', f), 'utf8')));
  chk(() => users.length === 0, () => `E5 no path sets a matrix variant before the laptop proves one (only the lab does): ${users.join(', ')}`);
}

// ---------- L: the lab (mcp/lab/matrix-mirror.mjs) writes its project, and Microsoft's validator finds no error ----------
{
  const { writeLab, variantsTable } = await import('./lab/matrix-mirror.mjs');
  const r = get(() => writeLab(path.join(ROOT, 'lab')));
  chk(() => r.pages === 11 && r.visuals === 41 && r.validator.exit === 0 && /"errorCount":0/.test(r.validator.text), () => `L1 the lab: 11 pages, 41 matrices and tables, validator 0 errors: ${r.threw || JSON.stringify([r.pages, r.visuals, r.validator && r.validator.text.slice(0, 400)])}`);
  chk(() => variantsTable().split('\n').length === 2 + 41, () => 'L2 the variants table names every variant (mcp/work/M1.md)');
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL  test-0.3.1-mirror-parity  ${problems.length} of ${checks} checks failed:\n` + problems.map((p) => '      - ' + p).join('\n')); process.exitCode = 1; }
else console.log(`PASS  test-0.3.1-mirror-parity  ${checks} checks`);
