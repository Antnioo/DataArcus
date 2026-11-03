// RD6 scratch prototype (not product code): a phone layout for the pages of an existing PBIR report that have none,
// by the writer's phone rules (assets/js/pbip-page.js:1082-1130): the 323-wide canvas, cards two a row (157.5 x 100),
// everything else full width at the writer's heights, an 8 gap, the writer's order (header, filters, cards, the rest),
// page tabs as rows each as wide as its name (pbip-sizing.js phoneTabWidth), groups wrapping their children with page
// positions, right to left on an Arabic page. Reads metadata only (positions, types, names); writes nothing: returns
// the mobile.json files a patch would add, and why each page or visual was left off.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Sizing = require('../../../assets/js/pbip-sizing.js');
const { SCHEMA } = require('../../../assets/js/pbip-query.js');

export const PW = 323;
const GAP = 8, HALF = 157.5;
// the writer's heights (pbip-page.js:1084 SIZE), by the kind read from the visual's type here
const SIZE = { title: 56, nav: 44, kpi: 100, card: 100, slicer: 64, slicerList: 180, button: 40, text: 120, table: 270, gauge: 180, donut: 220, map: 220, treemap: 220, chart: 190 };
const AR = /[؀-ۿ]/;
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null);
const first = (a) => (Array.isArray(a) && a[0] && a[0].properties) || {};
const textRuns = (j) => ((first((((j.visual || {}).objects) || {}).general).paragraphs) || []).flatMap((p) => (p && p.textRuns) || []).map((r) => String(r.value || '')).join('');
const titleOf = (j) => lit(first(((j.visual || {}).visualContainerObjects || {}).title).text) || '';
const linkOf = (j) => first(((j.visual || {}).visualContainerObjects || {}).visualLink);
const isTab = (j) => j.visual && j.visual.visualType === 'actionButton' && /PageNavigation/i.test(String(lit(linkOf(j).type)));
const tabText = (j) => (((j.visual.objects || {}).text) || []).map((e) => e && e.properties && lit(e.properties.text)).find((x) => x != null) || '';

// the kind on the phone, or why it is left off (null kind)
function kindOf(x, page) {
  const j = x.json, t = (j.visual || {}).visualType || '';
  if (j.visualGroup) return { kind: 'group' };
  if (/^(shape|basicShape)$/.test(t)) return { why: 'a shape: decoration on the page (the writer leaves its bands and panels off the phone too)' };
  if (t === 'image') return lit(linkOf(j).type) ? { kind: 'button' } : { why: 'an image with no link: decoration or a logo (the writer leaves the logo off the phone)' };
  if (isTab(j)) return { kind: 'nav' };
  if (/^(card|cardVisual|multiRowCard|kpi)$/.test(t)) return { kind: 'card' };
  if (t === 'textbox' && !textRuns(j).trim()) return { why: 'an empty text box: a band or a panel behind other visuals' };
  const fields = Object.values(((j.visual.query || {}).queryState) || {}).reduce((n, r) => n + ((r && r.projections) || []).length, 0);
  if (!fields && !/^(textbox|actionButton|bookmarkNavigator|pageNavigator)$/.test(t)) return { why: 'a visual with no field: a panel behind other visuals' };
  if (t === 'textbox') return { kind: x.y < page.h * 0.15 && x.w >= page.w * 0.2 ? 'title' : 'text' };
  if (/^(slicer|advancedSlicerVisual)$/.test(t)) return { kind: x.h <= 90 ? 'slicer' : 'slicerList' };
  if (/^(actionButton|bookmarkNavigator)$/.test(t)) return { kind: 'button' };
  if (t === 'pageNavigator') return { kind: 'nav-visual' };
  if (/^(tableEx|pivotTable)$/.test(t)) return { kind: 'table' };
  if (t === 'gauge') return { kind: 'gauge' };
  if (/^(donutChart|pieChart)$/.test(t)) return { kind: 'donut' };
  if (/^(map|filledMap|shapeMap|azureMap)$/.test(t)) return { kind: 'map' };
  if (t === 'treemap') return { kind: 'treemap' };
  return { kind: 'chart' };   // every other chart and every custom visual: full width, 190 (the writer's default)
}
// the writer's order: the header (title, tabs), the filters, the cards, then the rest; each band in reading order
const BAND = { title: 0, nav: 0, 'nav-visual': 0, slicer: 1, slicerList: 1, card: 2 };

// inv: layout-check's inventoryOf; opts: { hidden: 'own' | 'stack' }. Returns { pages: [...], add: { rel: json } }
export function phoneLayout(inv, opts) {
  const o = Object.assign({ hidden: 'stack' }, opts || {}), add = {}, pages = [];
  inv.pages.forEach((pg) => {
    const res = { id: pg.id, name: pg.name, placed: 0, left: [], stacked: 0, height: 0, rtl: false };
    pages.push(res);
    if (pg.kind === 'Tooltip') { res.skipped = 'a tooltip page: it has no phone view'; return; }
    if (pg.visuals.some((x) => x.mobile)) { res.skipped = 'it has a phone layout: never touched'; return; }
    // right to left: the page's name, or most of its titles and texts, in Arabic
    const words = pg.visuals.map((x) => (x.json.visual ? titleOf(x.json) || textRuns(x.json) : '')).filter(Boolean);
    res.rtl = AR.test(pg.rawName) || (words.length > 0 && words.filter((w) => AR.test(w)).length * 2 > words.length);
    const rtl = res.rtl;
    const byName = new Map(pg.visuals.map((x) => [x.id, x]));
    const all = pg.visuals.map((x) => Object.assign({ x }, kindOf(x, pg)));
    all.filter((a) => !a.kind).forEach((a) => res.left.push({ visual: a.x.id, type: a.x.type, why: a.why }));
    // groups: their placeable children are kept together, at the place of the group's first child in the order;
    // a nested group counts as its children
    const topOf = (x) => { let g = x.group, seen = new Set(); let top = null; while (g && byName.has(g) && !seen.has(g)) { seen.add(g); top = g; g = byName.get(g).group; } return top; };
    let visible = all.filter((a) => a.kind && a.kind !== 'group' && !a.x.hidden);
    // one visual nine tenths inside another's page box: a card holding others is a backdrop (the writer's "no data"
    // card behind its chart) and is left off; otherwise the smaller is an overlay (a label over a picture, a card over
    // a chart) and is left off, the larger placed: the writer leaves both kinds off its own phone layouts
    const inside = (p, q) => { const ix = Math.max(0, Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x)), iy = Math.max(0, Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y)); return (ix * iy) / (p.w * p.h || 1); };
    const over = new Set();
    visible.forEach((a) => visible.forEach((b) => { if (a === b || a.x.w * a.x.h > b.x.w * b.x.h || inside(a.x, b.x) < 0.9) return;
      if (b.kind === 'card') { if (!over.has(b)) { over.add(b); res.left.push({ visual: b.x.id, type: b.x.type, why: 'a backdrop: a card with other visuals inside its box (a "no data" card behind its chart)' }); } }
      else if (!over.has(a)) { over.add(a); res.left.push({ visual: a.x.id, type: a.x.type, why: 'an overlay: inside another visual\'s box on the page (a label over a picture, a card over a chart)' }); } }));
    visible = visible.filter((a) => !over.has(a));
    const hidden = all.filter((a) => a.kind && a.kind !== 'group' && a.x.hidden);
    const reading = (a, b) => { const rowA = Math.round(a.x.y / 40), rowB = Math.round(b.x.y / 40); return rowA - rowB || (rtl ? (b.x.x + b.x.w) - (a.x.x + a.x.w) : a.x.x - b.x.x); };
    const order = (list) => list.slice().sort((a, b) => ((BAND[a.kind] ?? 3) - (BAND[b.kind] ?? 3)) || reading(a, b));
    let seq = order(visible);
    // a hidden visual that shares its page box with a shown one (a bookmark swaps them): the same phone box ('stack'),
    // or its own place after it ('own'); any other hidden visual: its own place in the order
    const iou = (p, q) => { const ix = Math.max(0, Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x)), iy = Math.max(0, Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y)); const i = ix * iy; return i / (p.w * p.h + q.w * q.h - i || 1); };
    const twinOf = new Map();
    hidden.forEach((h) => { const m = visible.find((v) => iou(v.x, h.x) >= 0.5); if (m && o.hidden === 'stack') twinOf.set(h, m); else seq = order(seq.concat([h])); });
    // keep each top group's children together
    const out = [], done = new Set();
    seq.forEach((a) => { if (done.has(a)) return; const g = topOf(a.x);
      if (!g) { out.push(a); done.add(a); return; }
      seq.filter((b) => topOf(b.x) === g).forEach((b) => { out.push(b); done.add(b); }); });
    const pos = {}, navs = out.filter((a) => a.kind === 'nav');
    let y = 0, col = 0;
    const place = (a) => {
      const k = a.kind, half = k === 'card';
      if (k === 'nav') {
        if (a !== navs[0]) return;
        if (col) { y += SIZE.card + GAP; col = 0; }
        const need = navs.map((b) => Sizing.phoneTabWidth(tabText(b.x.json)));
        let row = [], used = 0; const rows = [row];
        need.forEach((w, j) => { const ad = (row.length ? GAP : 0) + w; if (row.length && used + ad > PW) { row = [j]; rows.push(row); used = w; } else { row.push(j); used += ad; } });
        rows.forEach((r) => { let x = 0; r.forEach((j) => { const w = need[j]; pos[navs[j].x.id] = { x: rtl ? PW - x - w : x, y, w, h: SIZE.nav }; x += w + GAP; }); y += SIZE.nav + GAP; });
        return;
      }
      const h = k === 'nav-visual' ? SIZE.nav : SIZE[k] || SIZE.chart;
      if (half) { const x = col ? PW - HALF : 0; pos[a.x.id] = { x: rtl ? PW - HALF - x : x, y, w: HALF, h }; if (col) { y += h + GAP; col = 0; } else col = 1; }
      else { if (col) { y += SIZE.card + GAP; col = 0; } pos[a.x.id] = { x: 0, y, w: PW, h }; y += h + GAP; }
    };
    out.forEach(place);
    if (col) { y += SIZE.card + GAP; col = 0; }
    twinOf.forEach((m, h) => { if (pos[m.x.id]) { pos[h.x.id] = Object.assign({}, pos[m.x.id]); res.stacked++; } });
    // groups wrap their children (page positions, as the writer: pbip-page.js:1123-1130), innermost first
    const groups = pg.visuals.filter((x) => x.type === 'group');
    const depth = (g) => { let d = 0, p = g.group; const seen = new Set(); while (p && byName.has(p) && !seen.has(p)) { seen.add(p); d++; p = byName.get(p).group; } return d; };
    groups.slice().sort((a, b) => depth(b) - depth(a)).forEach((g) => {
      const kids = pg.visuals.filter((x) => x.group === g.id && pos[x.id]); if (!kids.length) { res.left.push({ visual: g.id, type: 'group', why: 'a group with nothing placed on the phone' }); return; }
      const b = kids.map((k) => pos[k.id]), x0 = Math.min(...b.map((p) => p.x)), y0 = Math.min(...b.map((p) => p.y));
      pos[g.id] = { x: x0, y: y0, w: Math.max(...b.map((p) => p.x + p.w)) - x0, h: Math.max(...b.map((p) => p.y + p.h)) - y0 };
    });
    res.placed = Object.keys(pos).filter((id) => byName.get(id).type !== 'group').length;
    res.height = Math.max(0, y - GAP);
    pg.visuals.forEach((x) => { const p = pos[x.id]; if (!p) return;
      const z = +((x.json.position || {}).z) || 0, tabOrder = (x.json.position || {}).tabOrder;
      add[x.file.replace(/visual\.json$/, 'mobile.json')] = { $schema: SCHEMA.mobile, position: Object.assign({ x: +p.x.toFixed(1), y: +p.y.toFixed(1), z, width: +p.w.toFixed(1), height: +p.h.toFixed(1) }, tabOrder != null ? { tabOrder } : {}) }; });
  });
  return { pages, add };
}
