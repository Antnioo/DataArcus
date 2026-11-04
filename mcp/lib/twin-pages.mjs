// The Arabic twin, step 5: the pages mirrored (assets/js/report-mirror.js, the writer's engine) and fitted for the
// Arabic texts: buttons, text boxes, table headers, phone tabs, the panels a text box must not become.
// (0.3.2 SP11: the text fitting in twin-text-fit.mjs; SP26: the geometry, badges, tables, grids, indentation and the
// icon's room, in twin-geometry.mjs; SP40: the measure rewiring, in twin-measures.mjs; buildTwin keeps the order,
// keepSize last)
// (0.3.1 S9: moved out of lib/arabic-twin.mjs as it was, no change of behaviour; arabic-twin.mjs re-exports what others import)
import { safeName } from './read-report.mjs';
import { isObj, pageOf } from './twin-read.mjs';
import { num, posOf, typeOf, litStr, Ls, absBox } from './twin-visuals.mjs';
import { autoTitlesOf, autoSentence, subtitleMeasuresOf } from './twin-texts.mjs';
import { langButton } from './twin-copy.mjs';
import { HIDDEN_W, fitButtons, fitTextboxes, fitHeaders } from './twin-text-fit.mjs';
import { boxOk, badgesWithText, aroundTables, underGrids, indentToEnd, iconRoom } from './twin-geometry.mjs';
import { twinMeasures } from './twin-measures.mjs';
export { keptAtMirrorLine } from './twin-geometry.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Mirror = require('../../assets/js/report-mirror.js');
const Sizing = require('../../assets/js/pbip-sizing.js');
const TextMeasure = require('../../assets/js/text-measure.js');

// (0.3.1 TT1, the owner, 27 Oct: a title is wholly Arabic or wholly English) a visual's title and alt text the person left
// English, isolated as a whole as the writer isolates an Arabic report's English title (text-measure.js isolateWhole)
const WHOLE = { title: 'text', general: 'altText' };
function wholeTitles(vco) {
  let n = 0;
  if (!isObj(vco)) return n;
  Object.keys(WHOLE).forEach((k) => (Array.isArray(vco[k]) ? vco[k] : []).forEach((e) => {
    const p = isObj(e) && isObj(e.properties) ? e.properties[WHOLE[k]] : null, v = p && isObj(p.expr) && isObj(p.expr.Literal) ? p.expr.Literal.Value : null;
    if (typeof v !== 'string' || !/^'.*'$/s.test(v)) return;
    const t = litStr(p), w = TextMeasure.isolateWhole(t);
    if (w !== t) { e.properties[WHOLE[k]] = Ls(w); n++; }
  }));
  return n;
}

// (0.3.1 MX2, laptop part 8: Fintech's task matrix, written as a table, and its roadmap) a reversed table wider than its
// box: Power BI lays a table from its left edge and scrolls to the right, so the English first columns (now the last)
// were behind the scroll. When every column has its own width, the columns English shows are put first (at the left),
// still reversed, and the ones English hides behind its own scroll go after them; a hidden column (narrower than
// HIDDEN_W) stays first. (MX3, laptop part 9: Fintech's team showed a column after its names, half cut; RepeatIQ's
// retention its ids at the left) the names (the last column shown) are widened to the room's edge, so what follows them
// starts out of view: the names are always the rightmost column in view.
// (0.3.1 MX4, laptop part 10: RepeatIQ's names widened 93 -> 178.67, so English's second column went out of view;
// Fintech p3's tables, 1002 of columns in 1098, left their blank at the right of the names) the names keep their English
// width. A wider table: the columns English shows whole stay in view, the names last at the room's edge, and the column
// English shows in part stays in view at the width English shows of it (the room less the whole ones; under HIDDEN_W it
// goes behind and its room to the leftmost column); only what English keeps behind the scroll goes behind. A table that
// fits: its slack goes to its leftmost column (the room less 1), never between the names and the box's right edge. The
// room is the box less 20 (measured: laptop part 4's AdventureWorks p1 top 10 shows its 526 of columns whole in a 547
// box). Returns [{ page, visual, shown, behind }] for each table it laid out (behind 0: it fits, its slack at the left)
// (0.3.1 MX5, laptop part 11: Fintech p3's tasks filled to 1076.7 in a 1097.7 box, 10 rows of 9 shown: Desktop's
// vertical scrollbar took its width and a horizontal one hid the names' end) a table's row count is data, so the twin
// never knows whether that bar shows: the room always leaves it (SCROLLBAR_W, 12 at 1080 high, measured "about 12 page
// px" in part 11 on Fintech p3 at 1920 x 1080; scaled as the 20). What English's own columns already take (its hidden
// ones counted) is never grown past nor shrunk: AdventureWorks p1's top 10, 526.1 in 547.5, keeps its 526.1.
const BOX_ROOM = 20, SCROLLBAR_W = 12;
function keepView(page, visuals, at) {
  const out = [], sc = isObj(page) && Number.isFinite(page.height) ? page.height / 1080 : 1;
  visuals.forEach((v) => {
    const p = posOf(v); if (typeOf(v) !== 'tableEx' || !p || !isObj(v.visual.objects) || !Array.isArray(v.visual.objects.columnWidth)) return;
    const qs = isObj(v.visual.query) && isObj(v.visual.query.queryState) && isObj(v.visual.query.queryState.Values) ? v.visual.query.queryState.Values : null, ps = qs && Array.isArray(qs.projections) ? qs.projections : null;
    if (!ps || ps.length < 2 || !ps.every((x) => isObj(x) && typeof x.queryRef === 'string')) return;
    const entry = (x) => v.visual.objects.columnWidth.find((y) => isObj(y) && isObj(y.selector) && y.selector.metadata === x.queryRef && isObj(y.properties));
    const w = (x) => { const e = entry(x); return e ? num(e.properties.value) : null; };
    const setW = (x, n) => { entry(x).properties.value = { expr: { Literal: { Value: Mirror.round(n) + 'D' } } }; };
    if (!ps.every((x) => Number.isFinite(w(x)))) return;
    const hidden = ps.filter((x) => w(x) < HIDDEN_W), vis = ps.filter((x) => w(x) >= HIDDEN_W);
    const room = p.width - (BOX_ROOM + SCROLLBAR_W) * sc - hidden.reduce((a, x) => a + Math.max(0, w(x)), 0);
    if (!vis.length) return;
    // (English's order is the reversed one read from its end: its first column, the names, is the last)
    let i = vis.length, used = 0; while (i > 0 && used + w(vis[i - 1]) <= room + 0.5) { used += w(vis[i - 1]); i--; }
    const whole = vis.slice(i);
    if (!whole.length) return;
    // (0.3.2 TT1, B-290: MX2's watchlist, its 4-wide Department, ended as a sliver after the names) a table that fits puts
    // its hidden columns first too, as a wider one does: at the left end, where Power BI starts the table against the
    // box's edge, as English's sits at its left; the names end at the room's edge. Widths unchanged
    if (i === 0 && hidden.length && ps.slice(0, hidden.length).some((x) => !hidden.includes(x))) qs.projections = hidden.concat(vis);
    if (i === 0) { const slack = room - 1 - used; if (slack >= 0.5) { setW(vis[0], w(vis[0]) + slack); out.push({ page: safeName(at), visual: safeName(String(v.name)), shown: vis.length, behind: 0 }); } return; }
    const part = vis[i - 1], slice = room - used;
    let shown, behind;
    if (slice >= HIDDEN_W) { setW(part, slice); shown = [part].concat(whole); behind = vis.slice(0, i - 1); } else { setW(whole[0], w(whole[0]) + slice); shown = whole; behind = vis.slice(0, i); }
    qs.projections = hidden.concat(shown, behind);
    out.push({ page: safeName(at), visual: safeName(String(v.name)), shown: shown.length, behind: behind.length });
  });
  return out;
}
// (0.3.2 TR1, B-275: the owner, 1 Nov, "in matrices we could switch columns but in tables it's not yet done why?") Power BI
// lays a table from its left edge: a reversed table narrower than its box kept its blank at the right, so its first
// English column (now the last) did not reach the box's right edge. keepView lays out a table that has a width for
// every column; a table Power BI sizes itself (English gives no width, or some only) and that has no auto-size behaviour of its own
// gets "grow to fit" (columnHeaders.columnAdjustment, Microsoft: "Columns automatically expand to fill the visual
// container"), in its unselected columnHeaders entry, every other property kept. Only a table English drew as a table
// (a matrix written as one keeps its own route). No width is computed and no data read (RD1 b275, choice A).
// Returns [{ page, visual }] for the plan
const GROW = { expr: { Literal: { Value: "'growToFit'" } } };
function growTables(visuals, origByName, at) {
  const out = [];
  visuals.forEach((v) => {
    const o = isObj(v) ? origByName[v.name] : null;
    if (typeOf(v) !== 'tableEx' || !o || typeOf(o) !== 'tableEx') return;
    const qs = isObj(v.visual.query) && isObj(v.visual.query.queryState) && isObj(v.visual.query.queryState.Values) ? v.visual.query.queryState.Values : null, ps = qs && Array.isArray(qs.projections) ? qs.projections : null;
    if (!ps || ps.length < 2 || !ps.every((x) => isObj(x) && typeof x.queryRef === 'string')) return;
    // (sized column by column: keepView's. Read on English's table: the twin's own row label route gives English's text
    // column a width of 0, hidden, which is not the person's sizing)
    const oq = isObj(o.visual.query) && isObj(o.visual.query.queryState) && isObj(o.visual.query.queryState.Values) && Array.isArray(o.visual.query.queryState.Values.projections) ? o.visual.query.queryState.Values.projections : [];
    const ocw = isObj(o.visual.objects) && Array.isArray(o.visual.objects.columnWidth) ? o.visual.objects.columnWidth : [];
    const hasW = (x) => ocw.some((y) => isObj(y) && isObj(y.selector) && isObj(x) && y.selector.metadata === x.queryRef && isObj(y.properties) && Number.isFinite(num(y.properties.value)));
    if (!oq.length || oq.every(hasW)) return;
    const obj = isObj(v.visual.objects) ? v.visual.objects : null;
    const ch = obj && Array.isArray(obj.columnHeaders) ? obj.columnHeaders : null;
    if (ch && ch.some((e) => isObj(e) && isObj(e.properties) && e.properties.columnAdjustment !== undefined)) return;   // (its own adjustment: kept)
    if (obj && obj.columnHeaders !== undefined && !ch) return;   // (a shape not expected: left as it is)
    const objects = v.visual.objects = obj || {}, list = objects.columnHeaders = ch || [];
    let e = list.find((x) => isObj(x) && !x.selector && isObj(x.properties));
    if (!e) { e = { properties: {} }; list.push(e); }
    e.properties.columnAdjustment = GROW;
    out.push({ page: safeName(at), visual: safeName(String(v.name)) });
  });
  return out;
}
// (0.3.0 D3, the laptop's proof of rc.2: «التفاصيل» kept the English tab's 55 wide on the phone and wrapped, "التفاصيـ / ل")
// The page tabs of a phone row (page buttons with the same phone top), already mirrored: each as wide as its Arabic name
// by the writer's phone rule (pbip-sizing.js phoneTabWidth: one line, bold, at the phone's 10pt), laid from the row's
// right end (the mirror of where the original's row started) with the writer's gap, the first page at the right; the
// line under a tab (a shape under it, 3 high at most) follows it with its own margins; a group holding them grows to
// hold them. A row whose names can't all fit is shared in proportion, and said (tabsCut).
function fitPhoneTabs(pg, visuals, mobiles, ctx, out) {
  const W = Mirror.PHONE_W, G = Sizing.PHONE_TAB.gap, box = (m) => (m && isObj(m.position) && ['x', 'y', 'width', 'height'].every((k) => Number.isFinite(m.position[k])) ? m.position : null);
  const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null);
  const isTab = (v) => typeOf(v) === 'actionButton' && /PageNavigation/i.test(String(lit((((v.visual.visualContainerObjects || {}).visualLink || []).find((e) => isObj(e) && isObj(e.properties)) || { properties: {} }).properties.type)));
  const textOf = (v) => { const es = isObj(v.visual.objects) && Array.isArray(v.visual.objects.text) ? v.visual.objects.text.filter((e) => isObj(e) && isObj(e.properties)) : [], t = es.map((e) => lit(e.properties.text)).find((x) => x != null), f = es.map((e) => lit(e.properties.fontFamily)).find((x) => x != null); return { text: t, font: f || ctx.text.font }; };
  const tabs = visuals.map((v, i) => ({ v, m: mobiles[i], i })).filter((x) => isObj(x.v) && isObj(x.v.visual) && isTab(x.v) && box(x.m) && textOf(x.v).text != null);
  const orig = (x) => box(pg.visuals[x.i].mobile.json);
  const rows = [];
  tabs.forEach((x) => { const row = rows.find((r) => Math.abs(orig(r[0]).y - orig(x).y) < 0.5); if (row) row.push(x); else rows.push([x]); });
  rows.forEach((row) => {
    row.sort((a, b) => orig(a).x - orig(b).x);   // the original's reading order: from its row's start
    // the lines under the tabs, found on the original's phone layout
    const lines = row.map((x) => { const o = orig(x); const j = pg.visuals.findIndex((v, k) => { const q = box(v.mobile && v.mobile.json); return q && k !== x.i && /^(shape|basicShape)$/.test(typeOf(v.json)) && q.height <= 3 && Math.abs(q.y - (o.y + o.height)) <= 1 && q.x >= o.x - 0.5 && q.x + q.width <= o.x + o.width + 0.5; }); return j < 0 ? null : { j, l: box(pg.visuals[j].mobile.json).x - orig(x).x, r: orig(x).x + orig(x).width - (box(pg.visuals[j].mobile.json).x + box(pg.visuals[j].mobile.json).width) }; });
    const end = W - Math.min(...row.map((x) => orig(x).x)), need = row.map((x) => Sizing.phoneTabWidth(textOf(x.v).text, textOf(x.v).font));
    const room = end - G * (row.length - 1), sum = need.reduce((a, b) => a + b, 0), k = sum > room ? room / sum : 1;
    let at = end;
    row.forEach((x, n) => {
      const p = box(x.m), w = k < 1 ? Math.floor(need[n] * k) : need[n];
      p.width = w; p.x = Mirror.round(Math.max(0, at - w)); at = p.x - G;
      const ln = lines[n]; if (ln && mobiles[ln.j] && box(mobiles[ln.j])) { const q = box(mobiles[ln.j]); q.x = Mirror.round(p.x + ln.r); q.width = Mirror.round(Math.max(4, w - ln.l - ln.r)); }
      const what = { page: safeName(pg.id), visual: safeName(String(x.v.name)), needs: need[n], width: w };
      out.tabs.push(what);
      if (w < need[n]) out.tabsCut.push(Object.assign({}, what, { why: `its Arabic name needs ${need[n]} wide on the phone; the row's ${row.length} tabs share ${Math.floor(end)}: give shorter Arabic page names, or the phone wraps or cuts it` }));
    });
  });
  // a group's phone box holds its children (in mobile.json a grouped visual's position is a page position)
  visuals.forEach((g, i) => { const gb = box(mobiles[i]); if (!gb || typeOf(g) !== 'group') return;
    const kids = visuals.map((v, k) => (isObj(v) && v.parentGroupName != null && String(v.parentGroupName) === String(g.name) ? box(mobiles[k]) : null)).filter(Boolean); if (!kids.length) return;
    const x0 = Math.min(gb.x, ...kids.map((q) => q.x)), x1 = Math.max(gb.x + gb.width, ...kids.map((q) => q.x + q.width));
    gb.x = Mirror.round(x0); gb.width = Mirror.round(x1 - x0); });
}

// (0.3.1 MP1d, the owner, 1 Nov, on part 7 vs part 8: Call Center's heatmap row cut to a sliver and nothing caught it)
// the twin never shrinks a visual. Run last on each page, after every rule (the mirror, the badges, the tables, the
// fitting): a visual narrower or lower than KEEP_MIN of its English size, or a bar or column chart under CHART_MIN px
// wide or high that was not (part 8: Desktop drew no bars there), goes back to its plain mirrored box (W - x - w, its
// English size) and is named. enVisuals, arVisuals: the page's English and Arabic visuals (arVisuals changed in place);
// W: the page's width; shared: the names of visuals that share their English box with a visual the twin adds (MX3: a
// heatmap and its names), skipped. Returns [{ visual, what }]
export const KEEP_MIN = 0.75, CHART_MIN = 60;
export function keepSize(enVisuals, arVisuals, W, shared) {
  const en = new Map((enVisuals || []).filter((v) => boxOk(v) && !v.visualGroup).map((v) => [String(v.name), v])), by = new Map((enVisuals || []).filter((v) => isObj(v) && v.name != null).map((v) => [String(v.name), v])), out = [];
  const chart = (v) => ['bar', 'column'].includes(Mirror.kindOf(v));
  (arVisuals || []).forEach((v) => {
    const e = isObj(v) ? en.get(String(v.name)) : null; if (!e || !boxOk(v) || (shared && shared.has(String(v.name)))) return;
    const a = v.position, b = e.position, small = (k) => a[k] < b[k] * KEEP_MIN || (chart(e) && a[k] < CHART_MIN && b[k] >= CHART_MIN);
    if (!small('width') && !small('height')) return;
    const g = e.parentGroupName != null ? by.get(String(e.parentGroupName)) : null, Wp = g && boxOk(g) ? g.position.width : W;
    out.push({ visual: String(v.name), what: `kept its English size: a rule would have shrunk it to ${Mirror.round(a.width)} px wide and ${Mirror.round(a.height)} px high (English ${Mirror.round(b.width)} x ${Mirror.round(b.height)})` });
    Object.assign(a, { x: Mirror.round(Wp - b.x - b.width), y: b.y, width: b.width, height: b.height });
  });
  return out;
}
// ---- the twin's pages, built in memory (the plan shows what they fit; the write writes exactly them) ----
// labels: by the mirror engine's ids (the report's own names). Returns { pages: [{ rel, page, visuals: [json] }],
// applied, ext (the twin's reportExtensions.json or null), titleMeasures, fitted }
export function buildTwin(P, labels) {
  const { R } = P, opts = { timeRightToLeft: P.timeRightToLeft !== false, waterfallRtl: P.waterfallRtl, dateTables: P.dateTables, dateColumns: P.dateColumns, textColumns: P.textColumns };
  // (0.3.2 SP40) the twin's measures (twin-measures.mjs): its own copy of reportExtensions.json, the title, text,
  // waterfall and row label measures, each name free; the mirror's waterfall takes its measures from it
  const M = twinMeasures(P, labels);
  opts.waterfall = M.waterfall;
  const TC = P.R.theme && isObj(P.R.theme.textClasses) ? P.R.theme.textClasses : {}, lab = isObj(TC.label) ? TC.label : {};
  const ctx = { text: { labelSize: +lab.fontSize || 10, font: lab.fontFace || 'Segoe UI' }, theme: R.theme };
  let applied = M.applied;
  const tables = [];
  const keptInView = [], laidOut = [], grown = [], fitted = { buttons: [], buttonsCut: [], headers: [], headersCut: [], textboxes: [], textboxesCut: [] }, phone = { tabs: [], tabsCut: [], pages: 0 }, sizeKept = [], ruleMoves = [];
  const pages = R.pages.map((pg) => {
    let page = pg.page;
    if (isObj(pg.page)) { page = JSON.parse(JSON.stringify(pg.page)); if (labels['page:' + pg.id] != null) { page.displayName = labels['page:' + pg.id]; applied++; } }
    // (T-1: a page drawn on a picture is copied left to right unless asked; its texts still take the approved labels)
    const r = P.keepLtr(pg) ? { visuals: pg.visuals.map((v) => JSON.parse(JSON.stringify(v.json))) } : Mirror.mirrorPage(pg.page, pg.visuals.map((v) => v.json), opts);
    if (!P.keepLtr(pg)) { badgesWithText(pg, r); aroundTables(pg, r, opts); }
    // (0.3.1 MX3) a heatmap by weekday whose rows all fit: its names beside its grid, a table of their own (extra)
    const extra = [];
    if (!P.keepLtr(pg)) r.visuals.forEach((vj, i) => { const o = pg.visuals[i] && pg.visuals[i].json; if (!o || !Mirror.heatmapBeside(o).ok) return;
      // (MX8) the room the names table may take below the matrix's top: its page's height, or its group's
      const gp = vj.parentGroupName != null ? r.visuals.find((x) => isObj(x) && String(x.name) === String(vj.parentGroupName)) : null, bottom = gp ? (posOf(gp) || {}).height : pageOf(pg).height;
      let hn = null; try { hn = Mirror.heatmapNames(vj, Number.isFinite(bottom) ? { bottom } : {}); } catch (e) { hn = null; } if (!hn) return; r.visuals[i] = hn.matrix; extra.push({ from: String(o.name), json: hn.table }); });
    // (0.3.1 MX7) a chart lined up under or over a heatmap's grid keeps English's offset from the grid's left edge
    if (!P.keepLtr(pg)) { try { underGrids(pg, r, pageOf(pg).width, extra); } catch (e) { /* a shape not expected: left as it is */ } }
    const autoTitled = new Map();   // (FX3b) visual name -> the title text written for Power BI's automatic title
    r.visuals.forEach((vj) => {
      const autos = autoTitlesOf(pg.id, vj);
      applied += Mirror.labelVisual(pg.id, vj, labels);
      // (0.3.1 FX3) Power BI's automatic title or subtitle: written as the visual's own text, its approved Arabic, else
      // its English as Power BI composes it from the original's names (wholly English, isolated), never left to compose
      // (FX3b) a missing title card: a new entry holding the text alone, never "show"
      // (TB1) a title on a field parameter follows the field chosen: written only as an approved Arabic (a fixed title)
      autos.forEach((a) => { if (a.param != null && labels[a.id] == null) return; const ar = labels[a.id] != null ? String(labels[a.id]) : null, text = Ls(ar != null && ar.trim() ? ar : TextMeasure.isolateWhole(autoSentence(a, (x) => x.name)));
        if (a.i < 0) { const vco = vj.visual.visualContainerObjects = isObj(vj.visual.visualContainerObjects) ? vj.visual.visualContainerObjects : {}; vco[a.key] = (Array.isArray(vco[a.key]) ? vco[a.key] : []).concat([{ properties: { text } }]); }
        else vj.visual.visualContainerObjects[a.key][a.i].properties.text = text;
        if (a.key === 'title') autoTitled.set(String(vj.name), text);
        if (ar != null) applied++; });
      // (TB1b) a subtitle given by a measure: written only as its approved Arabic (a fixed subtitle)
      subtitleMeasuresOf(vj).forEach(({ i }) => { const ar = labels[`text:${pg.id}/${vj.name}/c.subTitle.${i}.text`]; if (ar != null && String(ar).trim()) { vj.visual.visualContainerObjects.subTitle[i].properties.text = Ls(String(ar)); applied++; } });
      if (isObj(vj) && isObj(vj.visual)) wholeTitles(vj.visual.visualContainerObjects);
      // (0.3.0 X1, TW1, MX1, the title measures) its measures: the Arabic copies, the table's row label, the title's own
      { const m = M.rewire(vj, pg.id, !P.keepLtr(pg)); applied += m.applied; if (m.table) tables.push(m.table); }
    });
    if (!P.keepLtr(pg)) r.visuals.forEach((vj, i) => { if (pg.visuals[i] && Mirror.kindOf(vj) === 'textbox') indentToEnd(pg.visuals[i].json, vj); });
    // (the fitting reads and changes only the twin's copies)
    if (isObj(page)) {
      const c = Object.assign({}, ctx, { rtl: !P.keepLtr(pg), noButton: (x) => pageOf(x).type === 'Tooltip' || (isObj(pageOf(x).pageBinding) && /drillthrough/i.test(String(pageOf(x).pageBinding.type || ''))) }), origByName = Object.fromEntries(pg.visuals.map((v) => [v.json.name, v.json]));
      try { const b = fitButtons(page, r.visuals, c, pg.id); fitted.buttons.push(...b.buttons); fitted.buttonsCut.push(...b.buttonsCut); (r.moved = r.moved || []).push(...b.moves); } catch (e) { /* a shape not expected: left as it is */ }
      try { const h = fitHeaders(page, r.visuals, origByName, c, pg.id); fitted.headers.push(...h.headers); fitted.headersCut.push(...h.headersCut); } catch (e) { /* a shape not expected: left as it is */ }
      // (0.3.1 MX2) after the headers' widths: a wide table keeps the English view
      if (c.rtl) { try { keepView(page, r.visuals, pg.id).forEach((k) => { laidOut.push(k.page + '/' + k.visual); if (k.behind) keptInView.push(k); }); } catch (e) { /* a shape not expected: left as it is */ } }
      // (0.3.2 TR1) a table Power BI sizes itself: its columns fill its box
      if (c.rtl) { try { grown.push(...growTables(r.visuals, origByName, pg.id)); } catch (e) { /* a shape not expected: left as it is */ } }
      // (0.3.1 R1) the text boxes; in one report with both languages, the box the language button will take is kept free
      try { const lb = P.same && !c.noButton(pg) ? langButton(page, r.visuals, [], 'ar', '', 'reserved', R.theme) : null, keep = lb && lb.json ? [absBox(r.visuals.concat([lb.json]), lb.json)] : [];
        const u = r.units || { on: [], bars: [] }, kept = new Set(u.on.map((x) => String(x.visual)).concat(u.bars.map((x) => String(x.names))));
        const t = fitTextboxes(page, r.visuals, c, pg.id, keep, kept); fitted.textboxes.push(...t.textboxes); fitted.textboxesCut.push(...t.textboxesCut); } catch (e) { /* a shape not expected: left as it is */ }
      if (!P.keepLtr(pg)) iconRoom(r.visuals, (r.moved = r.moved || []));
    }
    // (MP1d) last, on every mirrored page: no visual comes out smaller than the guard allows
    (r.moved || []).forEach((m) => ruleMoves.push(Object.assign({ where: safeName(pg.id) + '/' + safeName(m.visual), rule: m.rule }, m.ruleAr ? { ruleAr: m.ruleAr } : {})));
    if (!P.keepLtr(pg)) { try { keepSize(pg.visuals.map((v) => v.json), r.visuals, pageOf(pg).width, new Set(extra.map((x) => x.from))).forEach((k) => sizeKept.push({ where: safeName(pg.id) + '/' + safeName(k.visual), what: k.what })); } catch (e) { /* a shape not expected: left as it is */ } }
    // (0.3.0 D3) the phone layout: mirrored as the page is (a page kept left to right keeps its phone layout too), its
    // texts as approved, each page tab as wide as its Arabic name by the writer's own rule
    const mobiles = pg.visuals.map((v, i) => { if (!v.mobile) return null;
      const m = P.keepLtr(pg) ? JSON.parse(JSON.stringify(v.mobile.json)) : Mirror.mirrorMobile(v.json, v.mobile.json);
      applied += Mirror.labelMobile(pg.id, r.visuals[i], m, labels, { font: ctx.text.font, was: v.json });
      if (!P.keepLtr(pg) && Mirror.kindOf(v.json) === 'textbox') indentToEnd(v.mobile.json, m);
      // (0.3.1 FX3b, FX3's Seen 2) a phone layout that sets its own title formatting (an entry with no text) takes the text
      // written for the visual's automatic title, so the phone shows the same; none of its own: nothing is added
      const tx = isObj(r.visuals[i]) ? autoTitled.get(String(r.visuals[i].name)) : null;
      if (tx && isObj(m) && isObj(m.visualContainerObjects) && Array.isArray(m.visualContainerObjects.title)) m.visualContainerObjects.title.forEach((e) => { if (isObj(e) && !e.selector && isObj(e.properties) && e.properties.text === undefined) e.properties.text = tx; });
      if (isObj(m)) wholeTitles(m.visualContainerObjects); return m; });
    if (mobiles.some(Boolean)) { phone.pages++; if (!P.keepLtr(pg)) { try { fitPhoneTabs(pg, r.visuals, mobiles, ctx, phone); } catch (e) { /* a shape not expected: left as it is */ } } }
    return { pg, page, visuals: r.visuals, mobiles, extra };
  });
  // (the measures: what is said of them, from the twin's pages as built)
  const S = M.said(pages);
  return { pages, applied, phone, notShown: S.notShown, sizeKept, ruleMoves, keptInView, laidOut, grown, ext: S.ext, tables, fitted, titleMeasures: S.titleMeasures, waterfallMeasures: S.waterfallMeasures, textMeasures: S.textMeasures };
}
