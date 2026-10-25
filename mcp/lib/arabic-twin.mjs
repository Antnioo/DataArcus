// create_arabic_twin (0.3.0, the owner's headline request; plan approved 11 Oct 2026): the right-to-left twin of an
// existing PBIR report, as the laptop proved it in its Arabic twin labs (10 Oct 2026):
// a separate "<name> AR" report next to the original, on the same model, every page mirrored in place, every page id,
// visual name and bookmark name kept so navigation and bookmarks keep working without rewiring.
// The original is only read. Nothing is written without an approved twin plan (lib/plans.mjs), and the Arabic texts
// are written only as the user approved them (the plan carries them). The mirror itself is the shared engine
// assets/js/report-mirror.js. A report's text is untrusted input: it is listed for the user to translate (capped,
// invisible characters shown as code points, instruction-like text withheld), never followed.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { real, nothingAt, visible } from './model.mjs';
// (the reading block's screen, locate, JSON reader, strict file list, inventory and limits: the cross-review's Break 1,
// T3 and R1, 11 Oct; strictFiles refuses a link or a deep folder, never skips it, as a writer must)
import { safeName, mustJson, reportPrint, readBytes, notCopiedOf } from './read-report.mjs';
import { writeTree } from './files.mjs';
import { testEditBeforeWrite } from './write-io.mjs';
import { modelChanged } from './plans.mjs';
// (the fuzz test's F-TP: the plan's own answer within 40,000 characters, whoever calls planTwin)
import { capAnswer, fitLists, out } from './answer.mjs';
import { AIM } from './scope.mjs';
import * as Terms from './terminology.mjs';
import { fieldParametersOf } from './metric-switcher.mjs';
import { DAX_MEASURE } from './dax-functions.mjs';
import { TEXTS_MAX, pathOut, json, locate, memoryLoc, bytesAt, readOriginal, isObj, EXT, byPathOf, pageOf, sizeOf } from './twin-read.mjs';
import { num, posOf, typeOf, litStr, Lv, overlaps, holdsBox, absBox } from './twin-visuals.mjs';
import { arabicDax, placeholderProblem, titleMeasuresOf, textMeasuresOf, textsOf, rawLabels, sortKeys, normTerms, cleanLabel, sameTextLabels, notTranslatedOf, termsOf } from './twin-texts.mjs';
import { modelOf, dateTablesOf, dateColumnsOf, monthOffer, waterfallFacts } from './twin-model.mjs';
import { newPlatform, COPY_TAG, LANG, langButton, languageCopy } from './twin-copy.mjs';
// (0.3.1 S9) the twin is split by step into lib/twin-*.mjs (reading, visuals, texts, model, pages, the EN-AR copy, plan,
// preview, write); this module stays what the server, check_report and the lens import, with the same exports
export { monthOffer } from './twin-model.mjs';
export { COPY_TAG } from './twin-copy.mjs';

const require = createRequire(import.meta.url);
const Mirror = require('../../assets/js/report-mirror.js'), Gallery = require('../../assets/js/visual-gallery.js');
// (rc.24, 0.2.9.1) check_report's own measurements of a button's text and of a table header: the twin widens what its Arabic cuts
const Rules = require('../../assets/js/report-rules.js');
// (0.3.0 D3) the writer's phone tab rule (one copy, the writer's own), for the twin's phone page tabs
const Sizing = require('../../assets/js/pbip-sizing.js');
// A button narrower than its Arabic text (check_report's buttonNeed) is widened: first toward its end (its left in the
// twin), the visuals beside it in its row moving with it, then toward its start; inside its page or group, never over a
// visual it did not overlap. A shape just under or over it (the page's underline) follows it. What can't fit is said.
function fitButtons(page, visuals, ctx, at) {
  const out = { buttons: [], buttonsCut: [] }, byName = {};
  visuals.forEach((v) => { if (isObj(v) && v.name != null) byName[v.name] = v; });
  const parentOf = (v) => (v.parentGroupName != null ? String(v.parentGroupName) : '');
  const widthOf = (v) => { const g = v.parentGroupName != null ? byName[v.parentGroupName] : null; return g ? (posOf(g) || {}).width : isObj(page) ? page.width : NaN; };
  const vOver = (a, b) => a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;
  const attachedTo = (v) => { const p = posOf(v); return visuals.filter((s) => s !== v && /^(shape|basicShape)$/.test(typeOf(s)) && parentOf(s) === parentOf(v) && posOf(s)).filter((s) => { const q = posOf(s);
    return !vOver(p, q) && q.x >= p.x - 2 && q.x + q.width <= p.x + p.width + 2 && q.width <= p.width && Math.min(Math.abs(q.y - (p.y + p.height)), Math.abs(p.y - (q.y + q.height))) <= 8; }); };
  const shift = (v, d) => { posOf(v).x = Mirror.round(posOf(v).x + d); attachedTo(v).forEach((s) => { posOf(s).x = Mirror.round(posOf(s).x + d); }); };
  visuals.forEach((v) => {
    const p = posOf(v); if (typeOf(v) !== 'actionButton' || !p) return;
    let b; try { b = Rules.buttonNeed({ json: v, type: 'actionButton', h: p.height, w: p.width }, ctx.text); } catch (e) { b = null; }
    if (!b || p.width + 0.5 >= b.needW) return;
    const W = widthOf(v); if (!Number.isFinite(W)) return;
    const grow = Math.ceil(b.needW - p.width), lines = attachedTo(v);
    // the room: the container, or a panel it sits on (a sibling holding it whole); the row: siblings beside it
    const sibs = visuals.filter((x) => x !== v && posOf(x) && parentOf(x) === parentOf(v) && !lines.includes(x));
    const holds = sibs.filter((x) => { const q = posOf(x); return q.x <= p.x + 0.5 && q.x + q.width >= p.x + p.width - 0.5 && q.y <= p.y + 0.5 && q.y + q.height >= p.y + p.height - 0.5; });
    const lo = Math.max(0, ...holds.map((x) => posOf(x).x)), hi = Math.min(W, ...holds.map((x) => posOf(x).x + posOf(x).width));
    const row = sibs.filter((x) => !holds.includes(x) && vOver(p, posOf(x)));
    const left = row.filter((x) => posOf(x).x + posOf(x).width <= p.x + 0.5), right = row.filter((x) => posOf(x).x >= p.x + p.width - 0.5);
    const roomL = Math.max(0, (left.length ? Math.min(...left.map((x) => posOf(x).x)) : p.x) - lo), roomR = Math.max(0, hi - (right.length ? Math.max(...right.map((x) => posOf(x).x + posOf(x).width)) : p.x + p.width));
    const firstL = ctx.rtl, a1 = Math.min(grow, Math.floor(firstL ? roomL : roomR)), a2 = Math.min(grow - a1, Math.floor(firstL ? roomR : roomL));
    const dl = firstL ? a1 : a2, dr = firstL ? a2 : a1;
    left.forEach((x) => shift(x, -dl)); right.forEach((x) => shift(x, dr));
    p.x = Mirror.round(p.x - dl); p.width = Mirror.round(p.width + dl + dr);
    lines.forEach((s) => { const q = posOf(s); q.x = Mirror.round(q.x - dl); q.width = Mirror.round(q.width + dl + dr); });
    const what = { page: safeName(at), visual: safeName(String(v.name)), kind: b.page ? 'page button' : 'button', needs: b.needW, width: p.width };
    const moved = (dl ? left.length : 0) + (dr ? right.length : 0);
    if (dl + dr > 0) out.buttons.push(Object.assign({}, what, moved ? { moved } : {}));
    if (p.width + 0.5 < b.needW) out.buttonsCut.push(Object.assign({}, what, { room: p.width, why: `its Arabic text needs ${b.needW} wide; its ${v.parentGroupName != null ? 'group' : 'page'} and the visuals beside it leave ${p.width}: give a shorter Arabic text, or Power BI cuts it` }));
  });
  return out;
}
// (0.3.1 R1: a real user's Arabic title kept its English box, 54 high, and wrapped: about 97 needed) A text box whose
// Arabic needs more lines than its height holds (check_report's TEXTBOX_FITS: 10 + 1.8 x pt a line, the lines wrapped at
// 0.55 em a character) is widened toward its end first (the left on an Arabic page), then toward its start, into the free
// room of its page or group; then, if it still needs more, made taller into the free room under it. It is never laid
// over another visual (one holding it whole, its panel, aside) nor over the box kept for the language button (reserved);
// the visuals beside it don't move. A text box the mirror kept with the visual it sits on or names (a badge on a tile, the
// names beside a bar list: report-mirror.js unitsOf) keeps its place there (skip). What still can't fit is said (textboxesCut)
function fitTextboxes(page, visuals, ctx, at, reserved, skip) {
  const out = { textboxes: [], textboxesCut: [] }, byName = {};
  visuals.forEach((v) => { if (isObj(v) && v.name != null) byName[v.name] = v; });
  const runsOf = (v) => { const g = isObj(v.visual.objects) && Array.isArray(v.visual.objects.general) ? v.visual.objects.general.find((e) => isObj(e) && isObj(e.properties) && Array.isArray(e.properties.paragraphs)) : null;
    return g ? g.properties.paragraphs.filter(isObj).map((pa) => (Array.isArray(pa.textRuns) ? pa.textRuns.filter(isObj) : [])) : []; };
  visuals.forEach((v) => {
    const p = posOf(v); if (typeOf(v) !== 'textbox' || !p || (skip && skip.has(String(v.name)))) return;
    const paras = runsOf(v), size = (r) => parseFloat(isObj(r.textStyle) ? r.textStyle.fontSize : '') || ctx.text.labelSize;
    const lens = paras.map((rs) => rs.reduce((a, r) => a + String(r.value == null ? '' : r.value).length, 0)), sizes = paras.map((rs) => Math.max(0, ...rs.map(size)));
    if (!lens.some(Boolean)) return;
    const top = Math.max(...sizes), lines = (w) => paras.reduce((n, rs, i) => n + Math.max(1, Math.ceil(lens[i] * Rules.MEASURED.CH(sizes[i] || top) / Math.max(1, w - 10))), 0), need = (w) => Rules.MEASURED.BOX(top, lines(w));
    if (p.height + 0.5 >= need(p.width)) return;
    const g = v.parentGroupName != null ? byName[v.parentGroupName] : null, A = absBox(visuals, v), off = { x: A.x - p.x, y: A.y - p.y };
    const box = g ? absBox(visuals, g) : { x: 0, y: 0, width: isObj(page) ? page.width : NaN, height: isObj(page) ? page.height : NaN };
    if (!box || !Number.isFinite(box.width) || !Number.isFinite(box.height)) return;
    const obst = visuals.filter((x) => x !== v && isObj(x) && !isObj(x.visualGroup) && posOf(x)).map((x) => absBox(visuals, x)).filter((b) => b && !holdsBox(b, A)).concat(reserved || []);
    const free = (b) => b.x >= box.x - 0.5 && b.x + b.width <= box.x + box.width + 0.5 && b.y >= box.y - 0.5 && b.y + b.height <= box.y + box.height + 0.5 && !obst.some((o) => overlaps(o, b));
    const room = (side) => { let d = 0; while (d < 4000 && free(side < 0 ? { x: A.x - d - 1, y: A.y, width: A.width + d + 1, height: A.height } : { x: A.x, y: A.y, width: A.width + d + 1, height: A.height })) d++; return d; };
    const first = ctx.rtl ? -1 : 1, r1 = room(first), r2 = room(-first);
    let g1 = 0, g2 = 0;
    while (need(A.width + g1 + g2) > A.height + 0.5 && (g1 < r1 || g2 < r2)) { if (g1 < r1) g1++; else g2++; }
    // (as little as needed: it stops growing as soon as its lines fit)
    const dl = first < 0 ? g1 : g2, dr = first < 0 ? g2 : g1, before = { width: p.width, height: p.height };
    A.x -= dl; A.width += dl + dr;
    let h = A.height; const want = need(A.width);
    if (want > h + 0.5) { let d = 0; while (h + d < want && free({ x: A.x, y: A.y, width: A.width, height: h + d + 1 })) d++; h += d; }
    p.x = Mirror.round(A.x - off.x); p.width = Mirror.round(A.width); p.height = Mirror.round(Math.max(p.height, Math.min(h, Math.ceil(want))));
    const what = { page: safeName(at), visual: safeName(String(v.name)), needs: { width: Math.ceil(A.width), height: Math.ceil(need(p.width)) }, was: before, now: { width: p.width, height: p.height } };
    if (p.width !== before.width || p.height !== before.height) out.textboxes.push(what);
    if (p.height + 0.5 < need(p.width)) out.textboxesCut.push(Object.assign({}, what, { why: `its Arabic text needs ${lines(p.width)} line${lines(p.width) === 1 ? '' : 's'} of ${top}pt, ${Math.ceil(need(p.width))} high, in ${p.width} wide; the room beside and under it holds ${p.height}: give a shorter Arabic text, or Power BI shows a scrollbar or cuts it` }));
  });
  return out;
}
// A table column with a set width (DataArcus's tables) narrower than its Arabic header (check_report's own measure,
// report-rules.js headerNeed: bold, + 24 a page of 1080 high, the writer's cellRoom) takes the table's spare width, then
// width from its text columns down to their own need; a number column is never narrowed. What can't fit is said in
// headersCut: cut: 'cut' under the share of the measure Desktop has drawn an Arabic header whole in, else 'may be cut'
// (0.2.9.1, B-173: Desktop 2.159 drew one whole that the measure called cut). Headers set to wrap: none.
function fitHeaders(page, visuals, origByName, ctx, at) {
  const out = { headers: [], headersCut: [] }, sc = isObj(page) && Number.isFinite(page.height) ? page.height / 1080 : 1;
  visuals.forEach((v) => {
    const p = posOf(v); if (typeOf(v) !== 'tableEx' || !p || !isObj(v.visual.objects) || !Array.isArray(v.visual.objects.columnWidth)) return;
    const o = v.visual.objects, H = Rules.tableHeaders(v, ctx.theme, ctx.text.font, sc), T = H.t, font = H.font;
    if (!H.cols.length) return;
    const entry = (ref) => o.columnWidth.find((e) => isObj(e) && isObj(e.selector) && e.selector.metadata === ref && isObj(e.properties) && Number.isFinite(num(e.properties.value)));
    const widthOf = (ref) => { const e = entry(ref); return e ? num(e.properties.value) : null; };
    const setW = (ref, w) => { entry(ref).properties.value = { expr: { Literal: { Value: w + 'D' } } }; };
    const head = (x) => String(x.displayName != null ? x.displayName : x.nativeQueryRef || '');
    const m = (x) => Rules.headerNeed(head(x), T, font, sc), need = (x) => m(x).needW;
    // a text column: a column of the model left-aligned in the original (DataArcus aligns its numbers right)
    const ov = origByName[v.name], oAlign = (ref) => { const cf = ov && isObj(ov.visual) && isObj(ov.visual.objects) && Array.isArray(ov.visual.objects.columnFormatting) ? ov.visual.objects.columnFormatting : [], e = cf.find((y) => isObj(y) && isObj(y.selector) && y.selector.metadata === ref && isObj(y.properties));
      return e && e.properties.alignment && e.properties.alignment.expr ? String(e.properties.alignment.expr.Literal.Value).replace(/^'|'$/g, '') : null; };
    const isText = (x) => isObj(x.field) && !!x.field.Column && !/^(Right|Center)$/i.test(String(oAlign(x.queryRef) || ''));
    const cols = H.cols.map((c) => c.p);
    const ownNeed = (x) => Math.max(need(x), Math.ceil(12 * 0.55 * T * 4 / 3 + 24 * sc));
    let spare = Math.floor(p.width - 36 * sc - o.columnWidth.filter((e) => isObj(e) && isObj(e.properties)).reduce((a, e) => a + (num(e.properties.value) || 0), 0));
    cols.filter((x) => widthOf(x.queryRef) + 0.5 < need(x)).forEach((x) => {
      let short = need(x) - Math.floor(widthOf(x.queryRef)), got = 0;
      const take = Math.min(short, Math.max(0, spare)); spare -= take; got += take; short -= take;
      cols.filter((d) => d !== x && isText(d)).forEach((d) => { if (short <= 0) return; const give = Math.min(short, Math.floor(widthOf(d.queryRef) - ownNeed(d))); if (give > 0) { setW(d.queryRef, Math.floor(widthOf(d.queryRef)) - give); got += give; short -= give; } });
      if (got) setW(x.queryRef, Math.floor(widthOf(x.queryRef)) + got);
      const w = widthOf(x.queryRef), what = { page: safeName(at), visual: safeName(String(v.name)), column: safeName(x.queryRef), needs: need(x), width: w };
      if (got) out.headers.push(what);
      if (short <= 0) return;
      if (w + 0.5 >= m(x).lowW) out.headersCut.push(Object.assign({}, what, { cut: 'may be cut', lowW: m(x).lowW, why: `its Arabic header needs ${need(x)} wide by our measure, and the table's other columns can give no more (numbers are never narrowed); Desktop 2.159 drew Arabic headers whole in about 0.7 of our measure (from ${m(x).lowW} here), so Power BI may cut it: look at it in Desktop, or give a shorter Arabic name` }));
      else out.headersCut.push(Object.assign({}, what, { cut: 'cut', lowW: m(x).lowW, why: `its Arabic header needs ${need(x)} wide; the table's other columns can give no more (numbers are never narrowed): give a shorter Arabic name, or Power BI cuts the header` }));
    });
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
const EXT_SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/reportExtension/1.0.0/schema.json';

// (0.3.0 X1) a visual of the Arabic pages moved to the Arabic copy of a report measure (rename: "Entity\0name" -> the
// copy's name): the field, its queryRef and every selector naming it, and its nativeQueryRef, as Power BI names a
// measure's projection ("Entity.Name", "Name")
function rewireMeasures(vj, rename) {
  const refs = new Map();
  rename.forEach((to, k) => { const [entity, from] = k.split('\u0000'); refs.set(entity + '.' + from, { ref: entity + '.' + to, from, to }); });
  const walk = (o) => {
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (!isObj(o)) return;
    const ms = isObj(o.Measure) ? o.Measure : null, src = ms && isObj(ms.Expression) && isObj(ms.Expression.SourceRef) ? ms.Expression.SourceRef : null;
    if (src && src.Schema === 'extension' && rename.has(src.Entity + '\u0000' + ms.Property)) ms.Property = rename.get(src.Entity + '\u0000' + ms.Property);
    const r = typeof o.queryRef === 'string' ? refs.get(o.queryRef) : null;
    if (r && o.nativeQueryRef === r.from) o.nativeQueryRef = r.to;
    Object.keys(o).forEach((k) => { if (typeof o[k] === 'string' && refs.has(o[k])) o[k] = refs.get(o[k]).ref; else walk(o[k]); });
  };
  walk(vj);
}

// (0.3.1 R1: a real user's title and subtitle text boxes drew as bordered white panels) A text box left to a theme whose
// visuals have a background (visualStyles "*" or "textbox", "*") is drawn as the theme's panel: its colour, border,
// corners and shadow (mcp/CLAUDE.md, Round 1). A text box WITH text is a heading or a note, and every such text box
// DataArcus writes has the three off (create_report's header title: pbip-page.js frame); so on the Arabic pages the twin
// switches off the background, border and shadow of a text box with text that leaves all three to such a theme. One that
// sets any of them itself keeps its own (its author chose); an empty text box keeps its panel (that is what it is for).
// The English pages are the original's. Returns how many were switched off
const themeCard0 = (theme, type, card) => { const vs = isObj(theme) && isObj(theme.visualStyles) ? theme.visualStyles : {}, one = (t) => (isObj(vs[t]) && isObj(vs[t]['*']) && Array.isArray(vs[t]['*'][card]) ? vs[t]['*'][card][0] : undefined); const x = one(type); return x !== undefined ? x : one('*'); };
const PANEL = ['background', 'border', 'dropShadow'];
function textPanelsOff(visuals, theme) {
  const shows = (e) => isObj(e) && (e.show === true || (isObj(e.show) && litStr(e.show) === 'true'));
  if (!PANEL.some((k) => shows(themeCard0(theme, 'textbox', k)))) return 0;
  let n = 0;
  visuals.forEach((v) => {
    if (typeOf(v) !== 'textbox') return;
    const g = isObj(v.visual.objects) && Array.isArray(v.visual.objects.general) ? v.visual.objects.general : [];
    const text = g.some((e) => isObj(e) && isObj(e.properties) && Array.isArray(e.properties.paragraphs) && e.properties.paragraphs.some((pa) => isObj(pa) && Array.isArray(pa.textRuns) && pa.textRuns.some((r) => isObj(r) && String(r.value == null ? '' : r.value).trim())));
    const vco = isObj(v.visual.visualContainerObjects) ? v.visual.visualContainerObjects : null;
    if (!text || (vco && PANEL.some((k) => k in vco))) return;
    v.visual.visualContainerObjects = Object.assign(vco || {}, Object.fromEntries(PANEL.map((k) => [k, [{ properties: { show: Lv('false') } }]])));
    n++;
  });
  return n;
}

// ---- the twin's pages, built in memory (the plan shows what they fit; the write writes exactly them) ----
// labels: by the mirror engine's ids (the report's own names). Returns { pages: [{ rel, page, visuals: [json] }],
// applied, ext (the twin's reportExtensions.json or null), titleMeasures, fitted }
function buildTwin(P, labels) {
  const { R } = P, opts = { timeRightToLeft: P.timeRightToLeft !== false, waterfallRtl: P.waterfallRtl, dateTables: P.dateTables, dateColumns: P.dateColumns };
  // (D1) a waterfall's measures go into the twin's own reportExtensions.json (the original's copied, or a new one), each
  // name free of the model's and the report's; the same DAX in the same table is one measure
  const wfWritten = [];
  opts.waterfall = Object.assign(waterfallFacts(P.model), { theme: R.theme, extMeasure: (t, want, expression, dataType, formatString) => {
    if (!ext) ext = { $schema: EXT_SCHEMA, name: 'extension', entities: [] };
    let e = ext.entities.find((x) => isObj(x) && x.name === t); if (!e) ext.entities.push(e = { name: t, measures: [] }); if (!Array.isArray(e.measures)) e.measures = [];
    const had = wfWritten.find((x) => x.t === t && x.expression === expression); if (had) return had.m;
    const names = takenAnywhere(); let m = want; for (let k = 2; names.has(m.toLowerCase()); k++) m = want + ' (' + k + ')';
    e.measures.push(Object.assign({ name: m, dataType, expression }, formatString ? { formatString } : {})); wfWritten.push({ t, m, expression }); return m; } });
  const TC = P.R.theme && isObj(P.R.theme.textClasses) ? P.R.theme.textClasses : {}, lab = isObj(TC.label) ? TC.label : {};
  const ctx = { text: { labelSize: +lab.fontSize || 10, font: lab.fontFace || 'Segoe UI' }, theme: R.theme };
  let applied = 0;
  // the title measures: the twin's own Arabic ones, named "Title AR: ...", beside the original's (which stay as they are)
  const tms = titleMeasuresOf(R), rename = new Map(), written = [];
  let ext = R.ext ? JSON.parse(JSON.stringify(R.ext)) : null;
  // (D1: a measure's name is unique across the whole model, report measures included, without case (writer P3): the
  // waterfall's names are checked against every table's and every report measure's)
  const takenAnywhere = () => new Set([].concat(...((ext && ext.entities) || []).map((e) => (isObj(e) && Array.isArray(e.measures) ? e.measures.map((x) => (isObj(x) ? x.name : '')) : [])),
    ...((P.model && P.model.tables) || []).map((t) => (t.columns || []).map((c) => c.name).concat((t.measures || []).map((c) => c.name)))).map((n) => String(n).toLowerCase()));
  const taken = (entity) => { const e = ext.entities.find((x) => isObj(x) && x.name === entity), t = P.model && (P.model.tables || []).find((x) => x.name === entity);
    return new Set([].concat((e && Array.isArray(e.measures) ? e.measures : []).map((x) => isObj(x) ? x.name : ''), t ? (t.columns || []).map((c) => c.name).concat((t.measures || []).map((c) => c.name)) : []).map((n) => String(n).toLowerCase())); };
  tms.filter((x) => x.pd.branches && ext).forEach((x) => {
    const ls = x.pd.branches.map((b) => (labels['titleText:' + b.template] != null ? labels['titleText:' + b.template] : null));
    if (ls.every((l) => l == null)) return;
    const e = ext.entities.find((y) => isObj(y) && y.name === x.entity), base = /^Title: /.test(x.name) ? 'Title AR: ' + x.name.slice(7) : 'Title AR: ' + x.name, names = taken(x.entity);
    let name = base; for (let k = 2; names.has(name.toLowerCase()); k++) name = base + ' (' + k + ')';
    e.measures.push(Object.assign(JSON.parse(JSON.stringify(x.measure)), { name, expression: arabicDax(x.pd, ls) }));
    rename.set(x.entity + '\u0000' + x.name, name); written.push(safeName(x.entity + '[' + name + ']'));
  });
  // (0.3.0 D3) the report's other text measures a visual shows (the empty state): rewritten in the twin's own copy of
  // reportExtensions.json (the original's file is only read), each text as approved
  let rewritten = 0;
  // (0.3.0 X1) both languages in one report: the English pages keep the measure as it is, the Arabic pages get their own
  // ("No data AR: ..."), each name free as the waterfall's are, and their visuals are moved to it (textRename)
  const textRename = new Map();
  if (ext) textMeasuresOf(R).filter((x) => x.pd.branches).forEach((x) => {
    const ls = x.pd.branches.map((b) => (b.template && labels['measureText:' + b.template] != null ? labels['measureText:' + b.template] : null));
    if (ls.every((l) => l == null)) return;
    const e = ext.entities.find((y) => isObj(y) && y.name === x.entity), m = e && Array.isArray(e.measures) ? e.measures.find((y) => isObj(y) && y.name === x.name) : null;
    if (!m) return;
    if (P.same) {
      const base = /^No data: /.test(x.name) ? 'No data AR: ' + x.name.slice(9) : x.name + ' AR', names = takenAnywhere();
      let name = base; for (let k = 2; names.has(name.toLowerCase()); k++) name = base + ' (' + k + ')';
      e.measures.push(Object.assign(JSON.parse(JSON.stringify(m)), { name, expression: arabicDax(x.pd, ls) }));
      textRename.set(x.entity + '\u0000' + x.name, name);
    } else m.expression = arabicDax(x.pd, ls);
    rewritten++; applied++;
  });
  let panelsOff = 0;
  const fitted = { buttons: [], buttonsCut: [], headers: [], headersCut: [], textboxes: [], textboxesCut: [] }, phone = { tabs: [], tabsCut: [], pages: 0 };
  const pages = R.pages.map((pg) => {
    let page = pg.page;
    if (isObj(pg.page)) { page = JSON.parse(JSON.stringify(pg.page)); if (labels['page:' + pg.id] != null) { page.displayName = labels['page:' + pg.id]; applied++; } }
    // (T-1: a page drawn on a picture is copied left to right unless asked; its texts still take the approved labels)
    const r = P.keepLtr(pg) ? { visuals: pg.visuals.map((v) => JSON.parse(JSON.stringify(v.json))) } : Mirror.mirrorPage(pg.page, pg.visuals.map((v) => v.json), opts);
    r.visuals.forEach((vj) => {
      applied += Mirror.labelVisual(pg.id, vj, labels);
      if (textRename.size) rewireMeasures(vj, textRename);
      const t = isObj(vj) && isObj(vj.visual) && isObj(vj.visual.visualContainerObjects) && Array.isArray(vj.visual.visualContainerObjects.title) ? vj.visual.visualContainerObjects.title : [];
      t.forEach((e) => { const ms = isObj(e) && isObj(e.properties) && isObj(e.properties.text) && isObj(e.properties.text.expr) && isObj(e.properties.text.expr.Measure) ? e.properties.text.expr.Measure : null, src = ms && isObj(ms.Expression) && isObj(ms.Expression.SourceRef) ? ms.Expression.SourceRef : null;
        if (src && src.Schema === 'extension' && rename.has(src.Entity + '\u0000' + ms.Property)) { ms.Property = rename.get(src.Entity + '\u0000' + ms.Property); applied++; } });
    });
    panelsOff += textPanelsOff(r.visuals, R.theme);
    // (the fitting reads and changes only the twin's copies)
    if (isObj(page)) {
      const c = Object.assign({}, ctx, { rtl: !P.keepLtr(pg), noButton: (x) => pageOf(x).type === 'Tooltip' || (isObj(pageOf(x).pageBinding) && /drillthrough/i.test(String(pageOf(x).pageBinding.type || ''))) }), origByName = Object.fromEntries(pg.visuals.map((v) => [v.json.name, v.json]));
      try { const b = fitButtons(page, r.visuals, c, pg.id); fitted.buttons.push(...b.buttons); fitted.buttonsCut.push(...b.buttonsCut); } catch (e) { /* a shape not expected: left as it is */ }
      try { const h = fitHeaders(page, r.visuals, origByName, c, pg.id); fitted.headers.push(...h.headers); fitted.headersCut.push(...h.headersCut); } catch (e) { /* a shape not expected: left as it is */ }
      // (0.3.1 R1) the text boxes; in one report with both languages, the box the language button will take is kept free
      try { const lb = P.same && !c.noButton(pg) ? langButton(page, r.visuals, [], 'ar', '', 'reserved', R.theme) : null, keep = lb && lb.json ? [absBox(r.visuals.concat([lb.json]), lb.json)] : [];
        const u = r.units || { on: [], bars: [] }, kept = new Set(u.on.map((x) => String(x.visual)).concat(u.bars.map((x) => String(x.names))));
        const t = fitTextboxes(page, r.visuals, c, pg.id, keep, kept); fitted.textboxes.push(...t.textboxes); fitted.textboxesCut.push(...t.textboxesCut); } catch (e) { /* a shape not expected: left as it is */ }
    }
    // (0.3.0 D3) the phone layout: mirrored as the page is (a page kept left to right keeps its phone layout too), its
    // texts as approved, each page tab as wide as its Arabic name by the writer's own rule
    const mobiles = pg.visuals.map((v, i) => { if (!v.mobile) return null;
      const m = P.keepLtr(pg) ? JSON.parse(JSON.stringify(v.mobile.json)) : Mirror.mirrorMobile(v.json, v.mobile.json);
      applied += Mirror.labelMobile(pg.id, r.visuals[i], m, labels); return m; });
    if (mobiles.some(Boolean)) { phone.pages++; if (!P.keepLtr(pg)) { try { fitPhoneTabs(pg, r.visuals, mobiles, ctx, phone); } catch (e) { /* a shape not expected: left as it is */ } } }
    return { pg, page, visuals: r.visuals, mobiles };
  });
  const notTranslated = tms.filter((x) => !x.pd.branches).map((x) => ({ what: 'Chart title (from a title measure)', measure: safeName(x.entity + '[' + x.name + ']'), why: x.pd.why }));
  // (0.3.0 D3) the original's own title measures the twin's charts no longer use: left in the twin's file as they are
  // (X1: in one report the English pages still show them)
  const notShown = P.same ? [] : [...rename.keys()].map((k) => { const [entity, name] = k.split('\u0000'); return { measure: safeName(entity + '[' + name + ']'), now: safeName(entity + '[' + rename.get(k) + ']'), why: 'the original\'s title measure: the twin\'s charts use their own Arabic one instead; left in the twin\'s reportExtensions.json as it is, and no visual of the twin shows it' }; });
  return { pages, applied, phone, notShown, panelsOff, ext: written.length || rewritten || wfWritten.length ? ext : null, fitted, titleMeasures: tms.length ? { measures: tms.length, translated: written.length, written, notTranslated } : null, waterfallMeasures: wfWritten.map((x) => safeName(x.t + '[' + x.m + ']')), textMeasures: [...textRename].map(([k, to]) => ({ measure: safeName(k.split('\u0000')[0] + '[' + k.split('\u0000')[1] + ']'), arabic: safeName(k.split('\u0000')[0] + '[' + to + ']') })) };
}
// (0.3.1 R1) what the plan, the write and the approval page say of a matrix in the twin
export const MATRIX_SAID = 'Power BI\'s matrix has no right-to-left setting: its row headers stay at the left and its columns (such as months) run left to right. The twin moves it to its mirrored place and reverses the order of its measures only; it fakes nothing. To read it from the right, show the same numbers as a table or a chart, which the twin mirrors; or keep it as it is.';
export function twinKey(p) { const { dir } = locate(p); try { return fs.realpathSync.native(dir); } catch (e) { return dir; } }

// (0.3.0 Q1) the twin's plan on a large report: 46,660 characters (52,412 into "same") for a two-page report with every
// option on, and the backstop halved its texts with no way to get the rest. The texts are cut to fit, from textsFrom, with
// where the rest starts (moreTexts); notTranslated (said in the plan before the go) is cut only when the texts alone can't
// make room, with its count (the approval window always shows it whole). The room left for the plan the server adds: PLAN_ROOM
const PLAN_ROOM = 2500;
function twinFit(a, from) {
  const size = (x) => JSON.stringify(out(x)).length, before = { texts: a.textsNotListed || 0, notTranslated: a.notTranslatedNotListed || 0 }, all = a.texts;
  const t = fitLists(a, () => [[a, 'texts']], size, AIM - PLAN_ROOM), t2 = t && t.k === 0 ? (a.texts = all, fitLists(a, () => [[a, 'texts'], [a, 'notTranslated']], size, AIM - PLAN_ROOM)) : null;
  // (the lists the twin's plan already stopped at TEXTS_MAX keep that count too)
  const keep = (k, n) => { const v = (a[k + 'NotListed'] || 0) + n; if (v) a[k + 'NotListed'] = v; else delete a[k + 'NotListed']; };
  if (t) keep('texts', before.texts);
  if (t2) keep('notTranslated', before.notTranslated);
  const left = (a.texts || []).length, rest = a.textsNotListed || 0;
  if (rest) a.moreTexts = { listed: left, from: from + left, notListed: rest, how: `Only ${left} texts (from ${from}) fit in one answer. Call create_arabic_twin again with the same inputs and textsFrom: ${from + left} for the next ones, and draft them too; then give all the approved labels together in one call, which proposes the plan to approve. Nothing is written without the approved plan.` };
  if (a.notTranslatedNotListed) a.moreNotTranslated = { listed: (a.notTranslated || []).length, notListed: a.notTranslatedNotListed, how: 'The rest of the texts that stay English are shown in DataArcus\'s approval window, with the plan, before the person approves: tell the user that this list is shortened. A label for one makes it Arabic.' };
  return a;
}

export function planTwin(a) {
  // (0.3.1 X2) inMemory: { files, base, projectDir }: the English report create_report's plan builds, made one report
  // with its Arabic pages under its own name (into "same"); nothing of it is on disk yet
  const loc = a.inMemory ? memoryLoc(a.inMemory) : locate(a.path), R = readOriginal(loc), textsFrom = Math.max(0, Math.floor(Number(a.textsFrom) || 0));
  // (0.3.0 X1) into "same": one report holding both languages, "<name> (EN-AR)"; the default, the separate twin "<name> AR"
  const same = a.into === 'same' || !!a.inMemory, outBase = a.inMemory ? loc.base : loc.base + (same ? COPY_TAG : ' AR');
  const twinDir = path.join(loc.project, outBase + '.Report'), twinPbip = path.join(loc.project, outBase + '.pbip');
  const free = a.inMemory ? true : nothingAt(twinDir) && nothingAt(twinPbip);
  const texts = textsOf(R), ids = new Set(texts.map((t) => t.id)), model = modelOf(R, loc), dateTables = dateTablesOf(model.m), dateColumns = dateColumnsOf(model.m);
  // (T-1: Power BI has no setting that mirrors a page's background picture, so a page drawn on one stays left to right
  // unless the user asks to mirror it anyway: its visuals would leave the picture's panels)
  // (rc.22, B-137: an image that is DataArcus's own transparent placeholder, byte for byte, is no picture)
  const blankBytes = Buffer.from(Mirror.BLANK_PNG, 'base64');
  const blank = (n) => { const rel = 'StaticResources/RegisteredResources/' + n; if (!R.files.includes(rel)) return false; try { return bytesAt(loc, rel).equals(blankBytes); } catch (e) { return false; } };
  const pictureIds = new Set(R.pages.filter((pg) => Mirror.pageHasPicture(pg.page, { blank })).map((pg) => pg.id)), mirrorPictures = a.mirrorPicturePages === true;
  const keepLtr = (pg) => pictureIds.has(pg.id) && !mirrorPictures;
  const given = a.labels || {}, labels = {}, unknown = [];
  Object.keys(given).forEach((k) => { if (ids.has(k)) labels[k] = cleanLabel(given[k], k); else unknown.push(visible(k).slice(0, 160)); });
  // (0.3.1 X2) the Arabic of a text by the text itself, as the plan shows it (a report built again draws new ids): every
  // text of those words takes it, unless a label was given for its id
  const byText = isObj(a.textLabels) ? a.textLabels : {}, textsUsed = new Set();
  texts.forEach((t) => { if (t.text != null && labels[t.id] == null && Object.prototype.hasOwnProperty.call(byText, t.text)) { labels[t.id] = cleanLabel(byText[t.text], t.id); textsUsed.add(t.text); } });
  const textsUnknown = Object.keys(byText).filter((k) => !textsUsed.has(k) && !texts.some((t) => t.text === k)).map((k) => visible(k).slice(0, 160));
  const T = termsOf(R, texts, labels, a, model.m);
  // (rc.22, B-138) a page button with no label of its own takes the approved Arabic name of the page it goes to, shown in
  // the plan (labelFrom) and written with it; a label given for the button wins
  texts.forEach((t) => { if (t.kind === 'button' && t.goesTo && labels[t.id] == null && labels[t.goesTo] != null) { labels[t.id] = labels[t.goesTo]; t.labelFrom = 'the approved Arabic name of the page it goes to'; } });
  // (rc.24) a title measure's text keeps each {n} it has, once: else it is not taken, and the plan says why
  const problems = [];
  texts.forEach((t) => { if ((t.kind === 'titleMeasure' || t.kind === 'measureText') && labels[t.id] != null) { const why = placeholderProblem(String(t.rawId).replace(/^(titleText|measureText):/, ''), labels[t.id]); if (why) { delete labels[t.id]; problems.push({ id: t.id, why }); } } });
  sameTextLabels(texts, labels);
  T.statuses();
  texts.forEach((t) => { if (labels[t.id] != null) t.label = labels[t.id]; });
  // what mirrors, counted per kind, and what cannot
  const kinds = {}, where = { custom: [], navigator: [], slicer: [], matrix: [], other: [], waterfallKept: [] }, together = { on: [], bars: [] };
  const pages = R.pages.map((pg) => {
    if (keepLtr(pg)) return { id: safeName(pg.id), name: safeName(typeof pageOf(pg).displayName === 'string' ? pageOf(pg).displayName : ''), size: sizeOf(pg), tooltip: pageOf(pg).type === 'Tooltip', visuals: pg.visuals.length, leftToRight: 'drawn on a background picture: kept left to right' };
    const r = Mirror.mirrorPage(pg.page, pg.visuals.map((v) => v.json), { timeRightToLeft: a.timeRightToLeft !== false, waterfallRtl: a.waterfallRtl, dateTables, dateColumns, waterfall: Object.assign(waterfallFacts(model.m), { theme: R.theme }) });
    Object.entries(r.kinds).forEach(([k, n]) => { kinds[k] = (kinds[k] || 0) + n; });
    (r.waterfallsKept || []).forEach((x) => where.waterfallKept.push(safeName(pg.id) + '/' + safeName(x.name) + ' (' + x.why + ')'));
    // (T-3, T-6 of rc.5: the pairs mirrored as one)
    const u = r.units || { on: [], bars: [] }, at = (n) => safeName(pg.id) + '/' + safeName(n);
    u.on.forEach((x) => together.on.push(at(x.visual) + ' on ' + safeName(x.host)));
    u.bars.forEach((x) => together.bars.push(at(x.bars) + ' with ' + safeName(x.names)));
    pg.visuals.forEach((v) => { const k = Mirror.kindOf(v.json); if (where[k]) where[k].push(safeName(pg.id) + '/' + safeName(v.json.name) + (k === 'other' ? ' (' + safeName(v.json.visual.visualType) + ')' : '')); });
    return { id: safeName(pg.id), name: safeName(typeof pageOf(pg).displayName === 'string' ? pageOf(pg).displayName : ''), size: sizeOf(pg), tooltip: pageOf(pg).type === 'Tooltip', visuals: pg.visuals.length };
  });
  const mirrors = Object.keys(kinds).map((k) => ({ kind: k, what: Mirror.KIND_WHAT[k], count: kinds[k] }));
  const cannot = [];
  if (where.custom.length) cannot.push({ what: 'custom visuals', why: 'moved only: no report setting reaches inside a custom visual (its labels, sides and menus stay as they are; a licensed one may ask for a sign-in when its page opens)', where: where.custom.slice(0, 30) });
  if (where.navigator.length) cannot.push({ what: 'the page navigator\'s order', why: 'Power BI has no order setting: the first page stays at the left. It lists the twin\'s own pages by their (Arabic) names and keeps working', where: where.navigator.slice(0, 30) });
  if (where.slicer.length) cannot.push({ what: 'slicer items', why: 'moved only: the items keep Power BI\'s own alignment (no setting was proven)', where: where.slicer.slice(0, 30) });
  if (where.other.length) cannot.push({ what: 'other visuals (scatter and kinds without a proven setting)', why: 'moved only: no right-to-left setting is proven for these, so nothing inside them is changed; look at them in the twin', where: where.other.slice(0, 30) });
  if (where.waterfallKept.length) cannot.push({ what: 'waterfall charts the running total can\'t follow', why: Mirror.KIND_WHAT.waterfallKept, where: where.waterfallKept.slice(0, 30) });
  // (0.3.1 R1: a real user's Arabic matrix read left to right, its first column at the left) said plainly, nothing faked
  if (where.matrix.length) cannot.push({ what: 'matrices', why: MATRIX_SAID, where: where.matrix.slice(0, 30) });
  if (pictureIds.size) cannot.push({ what: 'pages drawn on a background picture', why: mirrorPictures ? 'mirrored as asked (mirrorPicturePages), but the picture is not: its panels stay where they are, so the visuals no longer sit on them' : 'kept left to right: Power BI has no setting that mirrors a page picture, and the visuals would leave its panels. To mirror them anyway (the picture stays as it is), ask again with mirrorPicturePages true', where: [...pictureIds].map((x) => safeName(x)).slice(0, 30) });
  // (T-4: data bars inside a table or a matrix have no proven direction setting)
  if (R.pages.some((pg) => pg.visuals.some((v) => ['table', 'matrix'].includes(Mirror.kindOf(v.json))))) cannot.push({ what: 'data bars inside tables and matrices', why: 'they keep their direction (no right-to-left setting is proven for them); the columns themselves are reversed' });
  cannot.push({ what: 'Power BI\'s own words', why: '"All", "Select all", "Total", "(Blank)", the visual header menu, the filter pane, date and number formats follow the viewer\'s Power BI language and regional settings, not the report: an Arabic viewer sees them in Arabic' });
  cannot.push({ what: 'data values', why: 'category names, legend entries, slicer items and month names come from the model: Arabic columns are a model step (see arabicMonth)' });
  // (0.3.0 L4) a flip card's faces are picture measures of the model (its flip cards script): mirrored as one box, still
  // turning by their bookmarks, and drawn as those measures draw them
  const flipFaces = R.pages.flatMap((pg) => pg.visuals.filter((v) => { const vis = isObj(v.json) && isObj(v.json.visual) ? v.json.visual : {}, vco = isObj(vis.visualContainerObjects) ? vis.visualContainerObjects : {};
    return vis.visualType === 'image' && Array.isArray(vco.visualLink) && vco.visualLink.some((e) => isObj(e) && isObj(e.properties) && litStr(e.properties.type) === 'Bookmark'); }).map((v) => safeName(pg.id) + '/' + safeName(v.json.name)));
  // (0.3.0 A3) the metric switcher's choices are the rows of a field parameter table of the model (its script, made for
  // the English report, names them): the twin's slicer still switches, and its choices read as that table names them
  const switchers = fieldParametersOf(R.pages.flatMap((pg) => pg.visuals.map((v) => ({ file: safeName(pg.id) + '/' + safeName(isObj(v.json) ? v.json.name : ''), json: v.json }))));
  if (switchers.length) cannot.push({ what: 'the metric switcher\'s choices', why: `they are the rows of the field parameter table ${[...new Set(switchers.map((x) => JSON.stringify(safeName(x.table))))].join(', ')} of the model (the metric switcher script made for the English report names them in English): the twin's slicer and charts still switch, but the choices read as that table names them; for Arabic choices, make the report in Arabic with create_report and metricSwitcher`, where: [...new Set(switchers.map((x) => x.file))].slice(0, 30) });
  // (0.3.1 L6) the DAX function library's pictures and titles are measures of the model (its DAX functions script, made
  // for the English report): the twin shows them as those measures draw them
  const daxShown = R.pages.flatMap((pg) => pg.visuals.filter((v) => { const hit = []; const seek = (o) => { if (!isObj(o) && !Array.isArray(o)) return; if (isObj(o) && isObj(o.Measure) && typeof o.Measure.Property === 'string' && DAX_MEASURE.test(o.Measure.Property)) hit.push(1); Object.values(o).forEach(seek); };
    seek(isObj(v.json) ? v.json.visual : null); return hit.length; }).map((v) => safeName(pg.id) + '/' + safeName(v.json.name)));
  if (daxShown.length) cannot.push({ what: 'the DAX function library\'s pictures and titles', why: 'the KPI card pictures, the table\'s trend and target columns and the story titles are drawn by measures of the model (the DAX functions script made for the English report, in English): the twin shows them as those measures draw them; for Arabic ones, make the report in Arabic with create_report and daxFunctions', where: daxShown.slice(0, 30) });
  if (flipFaces.length) cannot.push({ what: 'flip cards\' faces', why: 'their text is drawn by picture measures of the model (the flip cards script made for the English report): the twin\'s cards are mirrored as one box and still turn, but their faces read as those measures draw them; for Arabic faces, make the report in Arabic with create_report and flipCards', where: flipFaces.slice(0, 30) });
  const checkInTwin = [];
  const offAxis = (v) => { const vis = isObj(v.json) && isObj(v.json.visual) ? v.json.visual : {}, es = isObj(vis.objects) && Array.isArray(vis.objects.categoryAxis) ? vis.objects.categoryAxis : []; return es.some((e) => isObj(e) && isObj(e.properties) && isObj(e.properties.show) && isObj(e.properties.show.expr) && isObj(e.properties.show.expr.Literal) && e.properties.show.expr.Literal.Value === 'false'); };
  const paired = new Set(together.bars.map((w) => w.split(' with ')[0]));
  const pairs = R.pages.filter((pg) => !keepLtr(pg)).flatMap((pg) => pg.visuals.filter((v) => Mirror.kindOf(v.json) === 'bar' && offAxis(v)).map((v) => safeName(pg.id) + '/' + safeName(v.json.name))).filter((w) => !paired.has(w));
  if (pairs.length) checkInTwin.push({ what: 'bar lists with their names hidden, no names found beside them', why: 'the names may be another visual further away; the bars are mirrored on their own and grow from the right: look that each list still reads with its names in the twin', where: pairs.slice(0, 30) });
  const keptTogether = [];
  if (together.bars.length) keptTogether.push({ what: 'bar lists with their names beside them', why: 'mirrored as one block in their original order, the bars still growing toward their names (mirrored one by one, the bars and names came apart)', where: together.bars.slice(0, 30) });
  if (together.on.length) keptTogether.push({ what: 'small visuals on a bigger visual (badges, icons)', why: 'they move with the visual they sit on, at the same place on it (what that visual draws inside does not flip, so mirrored on their own they covered its icon or text)', where: together.on.slice(0, 30) });
  if (!model.m) { const t = R.pages.filter((pg) => !keepLtr(pg)).flatMap((pg) => pg.visuals.filter((v) => Mirror.kindOf(v.json) === 'column').map((v) => safeName(pg.id) + '/' + safeName(v.json.name))); if (t.length) checkInTwin.push({ what: 'charts whose axis may be a date', why: 'the model could not be read, so a continuous date axis can\'t be told from a category: such a chart may stay left to right', where: t.slice(0, 30) }); }
  const month = a.arabicMonth === false ? { offered: false, why: 'not asked (arabicMonth false)' } : monthOffer(model, loc, outBase);
  const { script, howToApply, ...monthShown } = month;
  const ref = byPathOf(R.pbir);
  // (rc.24) the twin built in memory with the labels: its title measures and what its Arabic texts need
  const built = buildTwin({ R, model: model.m, keepLtr, dateTables, dateColumns, timeRightToLeft: a.timeRightToLeft, waterfallRtl: a.waterfallRtl, same }, rawLabels(texts, labels));
  // (X1) the copy, built in memory from the twin's pages: the plan shows it, the write writes exactly it
  const copy = same ? languageCopy({ R, loc, tabsShown: a.tabsShown, keepLtr, name: a.inMemory ? loc.base : null }, built, rawLabels(texts, labels)) : null;
  const languages = copy ? { copy: { report: path.basename(twinDir), pbip: path.basename(twinPbip), folder: pathOut(loc.project) || '.' },
    how: 'One report holding both languages: the original\'s English pages as they are, and after them each page\'s Arabic page, mirrored as the twin is (the same Arabic texts, phone layout, waterfalls and empty state). Every page has a small language button to its counterpart; the slicers of each page pair are kept in sync; the Arabic pages\' links (page tabs, tooltip pages, bookmarks) go to Arabic pages.',
    pairs: copy.pairs, buttons: copy.buttons, syncGroups: copy.syncGroups, tabs: copy.tabs, activePage: copy.activePage,
    bookmarks: copy.bookmarks ? `${copy.bookmarks} bookmark${copy.bookmarks === 1 ? '' : 's'} copied for the Arabic pages (their pages and visuals the Arabic ones, their names as approved); the English ones as they are` : 'none',
    ...(built.textMeasures.length ? { measures: built.textMeasures.map((x) => Object.assign({}, x, { why: 'the English pages keep the original measure; the Arabic pages use this copy with the approved Arabic text' })) } : {}),
    ...(copy.notes.length ? { notes: copy.notes } : {}),
    sayInPlan: 'Show the user the copy\'s name, every page pair, the language buttons (and any not placed, with why), the slicers kept in sync and which tabs are shown (tabs.service: what a reader in the Power BI service sees). tabsShown "ar" shows the Arabic pages instead.' } : null;
  if (built.titleMeasures && built.titleMeasures.notTranslated.length) cannot.push({ what: 'chart titles from title measures that build their text another way', why: 'their DAX is not only fixed texts and the numbers the report counts, so DataArcus can\'t translate it without guessing: the title stays as it is (titleMeasures.notTranslated says why for each)', where: built.titleMeasures.notTranslated.map((x) => x.measure).slice(0, 30) });
  // (0.3.0 D3) what stays English in the twin, and why, said before the go (as create_report's plan does: R2, #75)
  const notTranslated = notTranslatedOf(texts, labels, problems);
  // (0.3.0 A3) the copy's language button on each Arabic page reads "English": listed with why, as every kept text is
  const toEnglish = copy ? copy.buttons.filter((b) => b.placed && b.on === LANG.ar.on).length : 0;
  if (toEnglish) notTranslated.push({ text: LANG.ar.text, where: `language button (${toEnglish})`, why: 'the button on each Arabic page that opens its English page: a language switch names the language it opens in that language, as the English pages\' button reads «العربية»', ids: [] });
  // (0.3.0 J18) the terminology sheet: each field's places on the twin's own pages, as built
  const termRows = Terms.sheetOf(T.keys, T.term, Terms.placesOf({ pages: built.pages.filter((x) => isObj(x.page)).map((x) => ({ name: Terms.plain(typeof x.page.displayName === 'string' ? x.page.displayName : x.pg.id), type: x.page.type, visuals: x.visuals })), ext: Terms.measuresOf(built.ext || R.ext) }), Terms.isolateLatin);
  const PH = built.phone, phone = R.phone ? { mirrored: pictureIds.size && !mirrorPictures ? 'mirrored like its page (a page kept left to right keeps its phone layout as it is)' : true, pages: PH.pages,
    how: 'The phone layout (mobile.json) is mirrored like the pages: every box on the 323-wide phone canvas, the KPI cards\' order reversed, text boxes to the right, and its texts are the approved Arabic. Each page tab there is as wide as its Arabic name on one line (the writer\'s phone rule), the first page at the right.',
    ...(PH.tabs.length ? { tabs: PH.tabs.slice(0, 60) } : {}), ...(PH.tabsCut.length ? { tabsCut: PH.tabsCut.slice(0, 60) } : {}) } : { mirrored: false, why: 'the report has none' };
  const FK = ['buttons', 'buttonsCut', 'headers', 'headersCut', 'textboxes', 'textboxesCut'];
  const F = built.fitted, fitted = FK.some((k) => F[k].length) ? { fitted: Object.assign({}, ...FK.filter((k) => F[k].length).map((k) => ({ [k]: F[k].slice(0, 60) })), { sayInPlan: 'The Arabic texts are longer than the English: the twin widens each button to its text (the visuals beside it in its row move with it), each table column to its Arabic header, within the page and the table, and each text box to its Arabic lines (wider into the free room beside it, then taller into the free room under it; nothing beside it moves). Say each one in the plan, and every buttonsCut, headersCut and textboxesCut: their Arabic text needs a shorter version, or Power BI cuts it (a headersCut with cut "may be cut": Power BI may cut it, to be looked at in Desktop).' }) } : {};
  // (0.3, B-154) the model's fingerprint, pinned by the plan (null: no model read)
  return { loc, R, labels, texts, textsUnknown, notTranslated, month, dateTables, dateColumns, pictureIds, keepLtr, built, copy, same, outBase, modelPrint: model.m ? model.m.print : null, model: model.m, terms: T.given, termRows, answer: capAnswer(twinFit({
    written: false,
    original: { report: pathOut(loc.dir), pbip: loc.pbip ? pathOut(loc.pbip) : null, readOnly: 'only read: never changed' },
    twin: { report: path.basename(twinDir), pbip: path.basename(twinPbip), folder: pathOut(loc.project) || '.', model: ref && ref.path ? pathOut(path.resolve(loc.dir, String(ref.path))) : 'the same model as the original (definition.pbir copied as it is)', nameFree: free },
    pages, mirrors, cannot, phone, ...(keptTogether.length ? { keptTogether } : {}), ...(checkInTwin.length ? { checkInTwin } : {}), ...fitted,
    // (0.3.1 R1) the text boxes that drew as the theme's panels
    ...(built.panelsOff ? { textBoxes: { panelsOff: built.panelsOff, how: 'The report\'s theme draws every visual on a panel (a background, a border, a shadow), text boxes too: on the Arabic pages the twin switches the panel off for each text box with text that left it to the theme, so a title or a note reads as text on the page (one that sets its own panel keeps it; an empty text box keeps its panel).',
      ...(same ? { englishPages: 'The English pages are the original\'s: their text boxes still draw as panels. To match, select a text box in Power BI Desktop, Format > General > Effects: switch Background, Visual border and Shadow off.' } : {}), sayInPlan: 'Say it in the plan, and what the English pages keep (englishPages).' } } : {}),
    ...(built.titleMeasures ? { titleMeasures: Object.assign({}, built.titleMeasures, { notTranslated: built.titleMeasures.notTranslated.slice(0, 30), written: built.titleMeasures.written.slice(0, 30), how: 'A chart title given by a measure of the report: each of its texts is listed above (kind titleMeasure). The twin writes its own measures "Title AR: ..." with the approved Arabic texts, in its own reportExtensions.json, and its charts use them; the original report and the model are not changed.' }) } : {}),
    ...(pictureIds.size ? { picturePages: [...pictureIds].map((x) => ({ page: safeName(x), what: mirrorPictures ? 'mirrored as asked; its picture is not' : 'kept left to right (its background picture can\'t be mirrored); mirrorPicturePages true mirrors it anyway' })) } : {}),
    keptForNavigation: same ? 'The English pages keep their page ids, visual names and bookmarks; the Arabic pages get their own (new ids), and their page, tooltip and bookmark links go to the Arabic pages.' : 'Page ids, visual names, bookmark names, page and bookmark links are kept: navigation and bookmarks work in the twin without rewiring.',
    timeRightToLeft: a.timeRightToLeft !== false ? 'yes: charts over time run right to left like the rest of the page (the user can choose false: time stays left to right)' : 'no: charts over time keep left to right (the user\'s choice)',
    // (D7) the waterfalls: Power BI's own, left to right ("native", the default), or the look-alike read from the right
    waterfallRtl: Gallery.waterfallRtlOf(a.waterfallRtl) === 'native' ? `native: ${Gallery.WF_WHAT.native} (the user can choose "mirror": a stacked column chart read from the right, with no Total column and no legend)` : 'mirror: each waterfall is a stacked column chart drawn as a waterfall, read from the right; no Total column, no legend (the user can choose "native": Power BI\'s own waterfall, left to right)',
    // (0.3.0 Q1) from textsFrom on: the server cuts the list to fit one answer and says where the rest starts (moreTexts)
    texts: texts.slice(textsFrom, textsFrom + TEXTS_MAX).map(({ rawId, raw, fieldKey, ...t }) => t), ...(texts.length > textsFrom + TEXTS_MAX ? { textsNotListed: texts.length - textsFrom - TEXTS_MAX } : {}),
    ...(textsFrom ? { textsFrom: Math.min(textsFrom, texts.length) } : {}),
    labels: Object.assign({ given: Object.keys(labels).length, unknown, withoutLabel: texts.filter((t) => labels[t.id] == null).length }, problems.length ? { problems } : {}),
    notTranslated: notTranslated.slice(0, TEXTS_MAX).map(({ ids, ...r }) => r), ...(notTranslated.length > TEXTS_MAX ? { notTranslatedNotListed: notTranslated.length - TEXTS_MAX } : {}),
    ...(built.notShown.length ? { notShown: built.notShown.slice(0, 60) } : {}),
    ...(languages ? { languages } : {}),
    terminology: Object.assign({ sheet: termRows }, Terms.askNextOf(termRows), { how: Terms.HOW_TWIN }, T.unknown.length ? { unknownTerms: T.unknown } : {}, T.notUsing.length ? { labelsNotUsingTerm: T.notUsing.slice(0, 60) } : {}),
    sayInPlan: 'Before the go, show the user notTranslated: every text that stays English in the twin, with why (each text the user approved no Arabic for, such as a field name kept as the model names it). A text with labelFrom takes the approved Arabic of the same text (a page button its page\'s name, an alt text or a phone copy the visual\'s title): show those too. notShown: the original\'s title measures the twin\'s charts no longer use (kept in its file, shown nowhere).',
    arabicMonth: month.offered ? Object.assign(monthShown, { howToApplyAfterGo: howToApply }) : monthShown,
    ...notCopiedOf(R.left),
    ...(R.unreadable.length ? { unreadable: { count: R.unreadable.length, note: 'files that are not JSON: copied as they are, not mirrored' } } : {}),
    sayFirst: 'Nothing was written. Show the user this plan: the twin\'s name and place, the pages, what mirrors, what cannot, and the Arabic texts. draftArabic comes from a fixed glossary; for every other text draft the Arabic yourself in modern, simple Standard Arabic (Western digits, product names in Latin letters, short and natural, not a word-for-word translation) and show each one to the user as a DRAFT. Never translate silently and never write a text the user has not approved: a text without an approved label stays as it is. Call this tool again with the approved texts as labels ({ id: text }) to get a plan id for exactly those, show it, and after the user\'s go call approve_plan, then this tool with planId.'
  }, textsFrom), (x) => JSON.stringify(x).length, { last: ['texts'] }) };   // (A3: the texts cut last)
}

// ---- the write ----
// the month script's name: the first free one, or the file that already holds exactly this script (written once)
function scriptName(dir, base, text) {
  for (let n = 1; n < 1000; n++) {
    const f = path.join(dir, base + (n > 1 ? ' ' + n : '') + '.tmdl');
    if (nothingAt(f)) return { file: f, free: true };
    try { if (fs.lstatSync(f).isFile() && readBytes(f).toString('utf8') === text) return { file: f, free: false }; } catch (e) { /* the next name */ }
  }
  throw new Error('no free file name for the month script');
}
/** (D6, the laptop proof of rc.2: the twin's approval page said one sentence) every file the twin writes, by its path in
 *  the folder it is written in, as writeTwin writes them: the copied report's files, its own reportExtensions.json when
 *  the original has none, the month script when offered and not already there, and the .pbip */
export function twinOutputs(P) {
  const { loc, R } = P, dir = P.outBase + '.Report', out = P.copy ? P.copy.files.map((f) => dir + '/' + f.rel) : R.files.map((rel) => dir + '/' + rel);
  if (!P.copy && P.built.ext && !R.files.includes(EXT)) out.push(dir + '/' + EXT);
  if (!P.copy && !R.hasPlatform) out.push(dir + '/.platform');
  if (P.month.offered) { const f = scriptName(loc.project, `${P.outBase} - Arabic calendar`, P.month.script); if (f.free) out.push(path.basename(f.file)); }
  return out.concat([P.outBase + '.pbip']);
}
/** (0.3.1 V1, the owner, 25 Oct: "in the approval page I couldn't find the preview sketch") the twin's pages as the
 *  approval page draws them: the shared renderer's pages (assets/js/page-preview.js fromFiles, as the report's preview),
 *  read from the plan's own build, the files writeTwin writes (P.built's pages, or the copy's files P.copy). A page hidden
 *  in the tabs is drawn too (the copy hides one language); tooltip pages are not, as on the report's page. Each Arabic
 *  page is drawn right to left (a page kept left to right for its picture stays so), the copy's English pages left to
 *  right. From the plan only: types, positions, sizes, titles, field names, the theme's colours; never a value.
 *  Returns { lang: 'ar', pages, pairs? ([[english, arabic]] indexes into pages, the copy's) } or null. */
export function twinPreview(P) {
  // (the renderer is loaded here, not at the top, to keep this block apart from the lines the twin's writers change)
  const Preview = require('../../assets/js/page-preview.js');
  try {
    const { R, loc } = P, PJ = 'definition/pages/pages.json', files = [];
    const src = (rel) => bytesAt(loc, rel);
    const shown = (rel, data) => { if (!/\/page\.json$/.test(rel)) return data; try { const j = JSON.parse(typeof data === 'string' ? data : data.toString('utf8')); if (isObj(j) && j.visibility === 'HiddenInViewMode') { delete j.visibility; return json(j); } } catch (e) { /* not JSON: as it is */ } return data; };
    if (P.copy) P.copy.files.filter((f) => /^definition\/(pages\/|reportExtensions\.json$)/.test(f.rel)).forEach((f) => files.push({ path: f.rel, data: shown(f.rel, f.data != null ? f.data : src(f.from)) }));
    else {
      P.built.pages.forEach(({ pg, page, visuals }) => { if (isObj(page)) files.push({ path: pg.rel, data: shown(pg.rel, json(page)) }); visuals.forEach((vj, i) => files.push({ path: pg.visuals[i].rel, data: json(vj) })); });
      files.push({ path: PJ, data: R.files.includes(PJ) ? src(PJ) : json({ pageOrder: R.pages.map((pg) => String(pg.id)) }) });
      if (P.built.ext || R.ext) files.push({ path: EXT, data: json(P.built.ext || R.ext) });
    }
    if (R.theme) files.push({ path: 'StaticResources/RegisteredResources/theme.json', data: json(R.theme) });
    const T = R.theme || {}, pg0 = isObj(T.visualStyles) && isObj(T.visualStyles.page) && isObj(T.visualStyles.page['*']) && Array.isArray(T.visualStyles.page['*'].background) ? T.visualStyles.page['*'].background[0] : null;
    const colors = { background: pg0 && pg0.color && pg0.color.solid ? pg0.color.solid.color : undefined, card: T.background, ink: T.foreground, accent: Array.isArray(T.dataColors) ? T.dataColors[0] : undefined };
    const pages = Preview.fromFiles(files, { colors });
    // which pages are Arabic: the twin's all (but those kept left to right), the copy's its pairs' Arabic pages
    const ltrIds = new Set(R.pages.filter((pg) => P.keepLtr(pg)).map((pg) => String(pg.id)));
    const arIds = P.copy ? new Map(P.copy.pairs.map((x) => [String(x.arabic.id), String(x.english.id)])) : null;
    pages.forEach((p) => { p.rtl = arIds ? arIds.has(p.id) && !ltrIds.has(arIds.get(p.id)) : !ltrIds.has(p.id); });
    if (!P.copy) return { lang: 'ar', pages };
    const at = new Map(pages.map((p, i) => [p.id, i]));
    const pairs = P.copy.pairs.filter((x) => at.has(String(x.english.id)) && at.has(String(x.arabic.id))).map((x) => [at.get(String(x.english.id)), at.get(String(x.arabic.id))]);
    return { lang: 'ar', pages, pairs };
  } catch (e) { return null; }   // (a shape not expected: the approval page shows the plan without its pictures)
}
export function writeTwin(a, plan) {
  const d = plan.data || {};
  // (B-02) the original as it was when the plan was approved: changed since, nothing is written
  if (d.source && reportPrint(a.path) !== d.source) throw new Error('Nothing was written: the original report changed after the plan was approved. Make the plan again (call this tool without planId), show it to the user and wait for their go.');
  const asked = a.labels ? sortKeys(planTwin(Object.assign({}, a, { labels: a.labels })).labels) : null;
  if (asked && JSON.stringify(asked) !== JSON.stringify(sortKeys(d.labels))) throw new Error('Nothing was written: these labels differ from the labels of the approved plan. Show the user the new labels, get a new plan id for them (call this tool without planId), and wait for the user\'s go.');
  // (X1) the plan's own options: a call with planId that names other ones is refused, never written another way
  if ((a.into != null && (a.into === 'same') !== (d.into === 'same')) || (a.tabsShown != null && d.into === 'same' && a.tabsShown !== (d.tabsShown || 'en'))) throw new Error('Nothing was written: into or tabsShown differ from the approved plan\'s. Make the plan again with the options the user wants, show it and wait for their go.');
  // (D7) the waterfall's choice is the plan's too
  if (a.waterfallRtl != null && Gallery.waterfallRtlOf(a.waterfallRtl) !== Gallery.waterfallRtlOf(d.waterfallRtl)) throw new Error('Nothing was written: waterfallRtl differs from the approved plan\'s. Make the plan again with the waterfall the user wants, show it and wait for their go.');
  // (0.3.0 J18) the plan's terms: a call with planId that gives other ones is refused
  if (a.terms && JSON.stringify(normTerms(a.terms)) !== JSON.stringify(d.terms || {})) throw new Error('Nothing was written: these terms differ from the terms of the approved plan. Show the user the new terminology sheet, get a new plan id for it (call this tool without planId), and wait for the user\'s go.');
  const P = planTwin({ path: a.path, labels: d.labels || {}, terms: d.terms || {}, memory: false, timeRightToLeft: d.timeRightToLeft, waterfallRtl: d.waterfallRtl, arabicMonth: d.arabicMonth, mirrorPicturePages: d.mirrorPicturePages, into: d.into, tabsShown: d.tabsShown });
  // (B-154) the model the plan read (for the month column and the dates), as it was at the go
  if ('modelPrint' in d && (P.modelPrint || null) !== (d.modelPrint || null)) throw new Error(modelChanged(plan.id));
  const { loc, R } = P;
  const twinDir = path.join(loc.project, P.outBase + '.Report'), twinPbip = path.join(loc.project, P.outBase + '.pbip');
  if (!nothingAt(twinDir) || !nothingAt(twinPbip)) throw new Error(`Nothing was written: "${path.basename(nothingAt(twinDir) ? twinPbip : twinDir)}" is already there. DataArcus never writes over a file: rename or move the old ${P.same ? 'copy' : 'twin'}, then ask again.`);
  real(twinDir); real(twinPbip);
  // everything is built in memory first (the plan's own build: buildTwin); then written, each file new
  const out = new Map(), labels = rawLabels(P.texts, P.labels);
  let applied = P.built.applied;
  P.built.pages.forEach(({ pg, page, visuals, mobiles }) => {
    // (a page.json that is not an object is copied as it is: there is nothing to label or mirror in it)
    if (isObj(page)) out.set(pg.rel, json(page));
    visuals.forEach((vj, i) => out.set(pg.visuals[i].rel, json(vj)));
    (mobiles || []).forEach((m, i) => { if (m) out.set(pg.visuals[i].mobile.rel, json(m)); });
  });
  if (P.built.ext) out.set(EXT, json(P.built.ext));
  R.bookmarks.forEach((b) => { if (labels['bookmark:' + b.json.name] != null) { out.set(b.rel, json(Object.assign({}, b.json, { displayName: labels['bookmark:' + b.json.name] }))); applied++; } });
  if (R.hasPlatform) { const pl = mustJson(path.join(loc.dir, '.platform'), '.platform'); pl.metadata = Object.assign({}, pl.metadata, { displayName: loc.base + ' AR' }); pl.config = Object.assign({}, pl.config, { logicalId: crypto.randomUUID() }); out.set('.platform', json(pl)); }
  // (0.3.0 A1) a report without .platform (the validator's PBIR_PLATFORM_MISSING, a "can break"): the twin writes its own, as create_report does
  else out.set('.platform', newPlatform(loc.base + ' AR'));
  let pbip = { $schema: 'https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json', version: '1.0', artifacts: [{ report: { path: path.basename(twinDir) } }], settings: { enableAutoRecovery: true } };
  if (loc.pbip) { const o = mustJson(loc.pbip, path.basename(loc.pbip)); o.artifacts = (o.artifacts || []).map((x) => (x && x.report ? Object.assign({}, x, { report: Object.assign({}, x.report, { path: path.basename(twinDir) }) }) : x)); if (!o.artifacts.some((x) => x && x.report)) o.artifacts.push({ report: { path: path.basename(twinDir) } }); pbip = o; }
  // the cross-review's T8 and audit 6's A6-4: the one writer (lib/files.mjs), all or nothing: the twin's folder, the month
  // script (when offered and not already there with the same text) and the .pbip last; on any failure nothing is left
  // (X1) the copy holding both languages: its files as the plan built them (the original's copied as they are)
  const tree = P.copy ? P.copy.files.map((f) => ({ path: path.basename(twinDir) + '/' + f.rel, data: f.data != null ? f.data : readBytes(path.join(loc.dir, ...f.from.split('/'))) }))
    : R.files.map((rel) => ({ path: path.basename(twinDir) + '/' + rel, data: out.has(rel) ? out.get(rel) : readBytes(path.join(loc.dir, ...rel.split('/'))) }));
  // (D1: the waterfall's measures, in a reportExtensions.json of the twin's own when the original has none)
  if (!P.copy && out.has(EXT) && !R.files.includes(EXT)) tree.push({ path: path.basename(twinDir) + '/' + EXT, data: out.get(EXT) });
  if (!P.copy && !R.hasPlatform) tree.push({ path: path.basename(twinDir) + '/.platform', data: out.get('.platform') });
  let month = { written: false, why: P.month.why };
  if (P.month.offered) {
    const f = scriptName(loc.project, `${P.outBase} - Arabic calendar`, P.month.script);
    if (f.free) tree.push({ path: path.basename(f.file), data: P.month.script });
    month = { scriptFile: pathOut(f.file), column: P.month.column, table: P.month.table, howToApply: P.month.howToApply };
  }
  tree.push({ path: path.basename(twinPbip), data: json(pbip) });
  // (0.3.0 S1, B-182, as R6's F07 for create_report) the model read again right before the first write (no folder is made
  // yet): its print the approved one, or nothing is written (the read above can be seconds older than the write)
  if ('modelPrint' in d) { testEditBeforeWrite(); const now = modelOf(R, loc).m; if (((now && now.print) || null) !== (d.modelPrint || null)) throw new Error(modelChanged(plan.id)); }
  writeTree(loc.project, tree);
  // (0.3.0 J18) the terms of the written plan are confirmed for this model (this session only)
  if (Array.isArray(d.terminology)) Terms.remember(P.model, d.terminology);
  return { written: true, report: pathOut(twinDir), pbip: pathOut(twinPbip), files: P.copy ? P.copy.files.length + 1 : R.files.length + 1 + (out.has(EXT) && !R.files.includes(EXT) ? 1 : 0) + (R.hasPlatform ? 0 : 1), pages: P.copy ? P.copy.pairs.length * 2 : P.answer.pages.length,
    ...(P.answer.languages ? { languages: P.answer.languages } : {}), mirrors: P.answer.mirrors, cannot: P.answer.cannot,
    labelsApplied: applied, textsWithoutLabel: P.answer.labels.withoutLabel, notTranslated: P.answer.notTranslated, phone: P.answer.phone, original: 'only read: not changed', arabicMonth: month,
    ...(P.answer.fitted ? { fitted: P.answer.fitted } : {}), ...(P.answer.titleMeasures ? { titleMeasures: P.answer.titleMeasures } : {}),
    nextSteps: `Open "${path.basename(twinPbip)}" in Power BI Desktop (the original stays as it was), look at every page, and check it with check_report. Tell the user what cannot be mirrored (cannot)${P.month.offered ? ' and how to apply the month script' : ''}.` };
}
