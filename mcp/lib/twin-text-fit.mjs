// The Arabic twin, step 5a: the text, button and header fitting of one mirrored page (0.3.2 SP11: moved out of
// lib/twin-pages.mjs as it was, no change of behaviour; twin-pages.mjs's buildTwin calls them, in its order).
// The interface: each function fits one page's twin.
//   in:  page (the page's JSON: its width and height), visuals (the twin's visual JSONs of that page, the mirrored
//        copies), ctx ({ text: { labelSize, font }, theme, rtl }), at (the page id, for what is said); fitTextboxes also
//        reserved (page boxes kept free: the language button's) and skip (names a text box keeps its place beside);
//        fitHeaders also origByName (the original's visuals by name; not read today)
//   out: the changes, made in place on `visuals` (boxes, a button's font size or icon, a table's column widths), and
//        what is said: fitButtons { buttons, buttonsCut, moves }, fitTextboxes { textboxes, textboxesCut },
//        fitHeaders { headers, headersCut }
// No state between calls and no IO: the engines' measures (report-rules.js) and the twin's pure helpers only.
import { safeName } from './read-report.mjs';
import { isObj } from './twin-read.mjs';
import { num, posOf, typeOf, litStr, Ls, overlaps, holdsBox, absBox } from './twin-visuals.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Mirror = require('../../assets/js/report-mirror.js');
const Rules = require('../../assets/js/report-rules.js');

// A button narrower than its Arabic text (check_report's buttonNeed) is widened: first toward its end (its left in the
// twin), the visuals beside it in its row moving with it, then toward its start; inside its page or group, never over a
// visual it did not overlap. A shape just under or over it (the page's underline) follows it. What can't fit is said.
export function fitButtons(page, visuals, ctx, at) {
  const out = { buttons: [], buttonsCut: [] }, byName = {};
  visuals.forEach((v) => { if (isObj(v) && v.name != null) byName[v.name] = v; });
  const parentOf = (v) => (v.parentGroupName != null ? String(v.parentGroupName) : '');
  const widthOf = (v) => { const g = v.parentGroupName != null ? byName[v.parentGroupName] : null; return g ? (posOf(g) || {}).width : isObj(page) ? page.width : NaN; };
  const vOver = (a, b) => a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;
  const attachedTo = (v) => { const p = posOf(v); return visuals.filter((s) => s !== v && /^(shape|basicShape)$/.test(typeOf(s)) && parentOf(s) === parentOf(v) && posOf(s)).filter((s) => { const q = posOf(s);
    return !vOver(p, q) && q.x >= p.x - 2 && q.x + q.width <= p.x + p.width + 2 && q.width <= p.width && Math.min(Math.abs(q.y - (p.y + p.height)), Math.abs(p.y - (q.y + q.height))) <= 8; }); };
  const shift = (v, d) => { posOf(v).x = Mirror.round(posOf(v).x + d); attachedTo(v).forEach((s) => { posOf(s).x = Mirror.round(posOf(s).x + d); }); };
  // (0.3.1 MX6, the fuzz lab's B1-1: a chart beside a slicer that gave a button its width was pushed to x -59) the boxes
  // as they were, and whether every box the fitting changed is still inside its page or group: else it is put back
  const snap = () => new Map(visuals.filter((x) => posOf(x)).map((x) => [x, { x: posOf(x).x, width: posOf(x).width }]));
  const fits = (was) => [...was].every(([x, o]) => { const q = posOf(x); if (q.x === o.x && q.width === o.width) return true; const W = widthOf(x); return !Number.isFinite(W) || (q.x >= -0.5 && q.x + q.width <= W + 0.5); });
  const back = (was) => was.forEach((o, x) => { posOf(x).x = o.x; posOf(x).width = o.width; });
  // (MX6, the lab's M1-1: a group beside a button moved 28 and the plan only counted it) every visual the fitting moved
  // or narrowed, by name, for the plan's movedByRule
  const moved = (was, but) => [...was].filter(([x, o]) => x !== but && (posOf(x).x !== o.x || posOf(x).width !== o.width)).map(([x, o]) => ({ visual: String(x.name),
    rule: posOf(x).width !== o.width && typeOf(x) === 'slicer' ? 'gave width to a button beside it' : 'moved with a button beside it' }));
  out.moves = [];
  visuals.forEach((v) => {
    const p = posOf(v); if (typeOf(v) !== 'actionButton' || !p) return;
    let b; try { b = Rules.buttonNeed({ json: v, type: 'actionButton', h: p.height, w: p.width }, ctx.text); } catch (e) { b = null; }
    if (!b || p.width + 0.5 >= b.needW) return;
    const start = snap();
    try { fitOne(v, p, b); } finally {
      // (its underline, widened with it, is named in its own entry: withLine; the others in movedByRule)
      const m = moved(start, v), own = new Set(attachedTo(v).map((s) => String(s.name))), e = out.buttons.concat(out.buttonsCut).filter((x) => x.visual === safeName(String(v.name)) && x.page === safeName(at));
      const lines = e.length ? m.filter((x) => own.has(x.visual)) : [];
      if (lines.length) e.forEach((x) => { x.withLine = lines.map((l) => safeName(l.visual)); });
      out.moves.push(...m.filter((x) => !lines.includes(x)));
    }
  });
  return out;
  function fitOne(v, p, b) {
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
    let dl = firstL ? a1 : a2, dr = firstL ? a2 : a1;
    const was0 = snap();
    left.forEach((x) => shift(x, -dl)); right.forEach((x) => shift(x, dr));
    p.x = Mirror.round(p.x - dl); p.width = Mirror.round(p.width + dl + dr);
    lines.forEach((s) => { const q = posOf(s); q.x = Mirror.round(q.x - dl); q.width = Mirror.round(q.width + dl + dr); });
    if (!fits(was0)) { back(was0); dl = 0; dr = 0; }
    // (0.3.1 FX1, D-1028-02: the twin is identical, so the Reset keeps its icon; the laptop's part 3: the sample's Reset,
    // 159 wide beside three dropdown slicers in the top strip, got 20 of free room and lost its icon) still too narrow:
    // (a) as the writer lays a strip out (pbip-page.js: the Reset as wide as its text and icon need, the dropdown slicers
    // sharing the rest), the slicers beside it in its row give the width, equally, each kept at least 160 x k (the
    // writer's strip minimum, k = the page's height / 1080), the visuals between them moving with them
    let narrowed = 0, sized = null;
    const kk = isObj(page) && Number.isFinite(page.height) && page.height > 0 ? page.height / 1080 : 1;
    if (!b.page && p.width + 0.5 < b.needW) {
      const slack = (x) => (typeOf(x) === 'slicer' ? Math.max(0, Math.floor(posOf(x).width - 160 * kk)) : 0);
      const sides = (firstL ? [left, right] : [right, left]).map((list) => ({ list, toLeft: list === left }));
      for (const S of sides) {
        let want = Math.ceil(b.needW - p.width);
        const sl = S.list.filter((x) => slack(x) > 0); if (want <= 0 || !sl.length) continue;
        const share = new Map(sl.map((x) => [x, 0]));
        // (each takes an equal share, up to what it can give; what one can't give, the others share)
        while (want > 0) { const open = sl.filter((x) => share.get(x) < slack(x)); if (!open.length) break; const each = Math.max(1, Math.floor(want / open.length));
          for (const x of open) { if (want <= 0) break; const d = Math.min(each, slack(x) - share.get(x), want); share.set(x, share.get(x) + d); want -= d; } }
        const take = [...share.values()].reduce((a, d) => a + d, 0); if (!take) continue;
        let off = take; const was = snap();
        // the near side first: each visual moves by what is still to give, a slicer then gives its share
        S.list.slice().sort((a, c) => (S.toLeft ? posOf(c).x - posOf(a).x : posOf(a).x - posOf(c).x)).forEach((x) => {
          const d = share.get(x) || 0; shift(x, S.toLeft ? -off : off);
          if (d) { const q = posOf(x); if (S.toLeft) q.x = Mirror.round(q.x + d); q.width = Mirror.round(q.width - d); off -= d; } });
        if (S.toLeft) p.x = Mirror.round(p.x - take);
        p.width = Mirror.round(p.width + take);
        lines.forEach((s) => { const q = posOf(s); if (S.toLeft) q.x = Mirror.round(q.x - take); q.width = Mirror.round(q.width + take); });
        // (MX6) only where the room exists: a visual it moves would leave its page or group, nothing is borrowed this side
        if (!fits(was)) { back(was); continue; }
        narrowed += sl.filter((x) => share.get(x)).length;
      }
    }
    // (b) else its text at the largest size, down to 8pt, at which its Arabic and its icon fit side by side (the writer's
    // rule for a slicer's header and a KPI card's title: the largest size, down to 8, at which it is whole)
    if (!b.page && b.icon && p.width + 0.5 < b.needW && Array.isArray(v.visual.objects.text)) {
      const te = v.visual.objects.text.find((e) => isObj(e) && isObj(e.properties) && e.properties.text), tx = te ? litStr(te.properties.text) : '', font = b.font;
      let t = Math.floor(b.t) - 1; while (t >= 8 && Math.ceil(Rules.MEASURED.BTN_ICON_TW(tx, t, font) + p.height) > p.width + 0.5) t--;
      if (t >= 8) { v.visual.objects.text.forEach((e) => { if (isObj(e) && isObj(e.properties) && 'fontSize' in e.properties) e.properties.fontSize = { expr: { Literal: { Value: t + 'D' } } }; }); sized = { from: b.t, to: t }; }
    }
    if (narrowed || sized) {
      const b3 = Rules.buttonNeed({ json: v, type: 'actionButton', h: p.height, w: p.width }, ctx.text);
      if (b3 && p.width + 0.5 >= b3.needW) {
        const moved0 = (dl ? left.length : 0) + (dr ? right.length : 0);
        out.buttons.push(Object.assign({ page: safeName(at), visual: safeName(String(v.name)), kind: 'button', needs: b3.needW, width: p.width }, moved0 ? { moved: moved0 } : {},
          narrowed ? { slicersNarrowed: narrowed } : {}, sized ? { textSize: sized } : {},
          { iconKept: `its icon and its Arabic text side by side, on one line: ${[narrowed ? `the ${narrowed === 1 ? 'slicer' : `${narrowed} slicers`} beside it in its row gave the width (as the writer lays out a strip)` : '', sized ? `its text at ${sized.to}pt (was ${sized.from}pt), the largest size at which both fit` : ''].filter(Boolean).join('; ')}` }));
        return;
      }
    }
    const what = Object.assign({ page: safeName(at), visual: safeName(String(v.name)), kind: b.page ? 'page button' : 'button', needs: b.needW, width: p.width }, narrowed ? { slicersNarrowed: narrowed } : {});
    const moved = (dl ? left.length : 0) + (dr ? right.length : 0);
    // (SQ4, X2-S1: the bilingual demo's Arabic Reset button, 201 wide in its 201-wide rail, was cut) still too narrow with
    // its icon, but wide enough for its text alone: its icon is switched off, as the writer does where the icon and the
    // text don't fit side by side (pbip-sizing.js resetFit: shapeType blank, no icon size). (FX1: only where neither the
    // slicers beside it nor a smaller text, down to 8pt, give it room)
    const icons = isObj(v.visual.objects) && Array.isArray(v.visual.objects.icon) ? v.visual.objects.icon.filter((e) => isObj(e) && isObj(e.properties) && 'shapeType' in e.properties) : [];
    if (!b.page && b.icon && icons.length && p.width + 0.5 < b.needW && p.width + 0.5 >= Math.ceil(Rules.MEASURED.BTN_TW(b.t, b.n))) {
      icons.forEach((e) => { e.properties.shapeType = Ls('blank'); delete e.properties.iconSize; });
      const b2 = Rules.buttonNeed({ json: v, type: 'actionButton', h: p.height, w: p.width }, ctx.text);
      out.buttons.push(Object.assign({}, what, { needs: b2 ? b2.needW : what.needs, iconOff: 'its icon and its Arabic text do not fit side by side here: the icon is switched off (as the writer does in a narrow place), the text on one line' }, moved ? { moved } : {}));
      return;
    }
    if (dl + dr > 0 || narrowed) out.buttons.push(Object.assign({}, what, moved ? { moved } : {}));
    if (p.width + 0.5 < b.needW) out.buttonsCut.push(Object.assign({}, what, { room: p.width, why: `its Arabic text needs ${b.needW} wide; its ${v.parentGroupName != null ? 'group' : 'page'} and the visuals beside it leave ${p.width}: give a shorter Arabic text, or Power BI cuts it` }));
  }
}
// (0.3.1 R1: a real user's Arabic title kept its English box, 54 high, and wrapped: about 97 needed) A text box whose
// Arabic needs more lines than its height holds (check_report's TEXTBOX_FITS: 10 + 1.8 x pt a line, the lines wrapped at
// 0.55 em a character) is widened toward its end first (the left on an Arabic page), then toward its start, into the free
// room of its page or group; then, if it still needs more, made taller into the free room under it. It is never laid
// over another visual (one holding it whole, its panel, aside) nor over the box kept for the language button (reserved);
// the visuals beside it don't move. A text box the mirror kept with the visual it sits on or names (a badge on a tile, the
// names beside a bar list: report-mirror.js unitsOf) keeps its place there (skip). What still can't fit is said (textboxesCut)
export function fitTextboxes(page, visuals, ctx, at, reserved, skip) {
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
export const HIDDEN_W = 10;
export function fitHeaders(page, visuals, origByName, ctx, at) {
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
    // (MX3: no column gives its width for another's header any more, so which are text columns no longer matters here)
    const cols = H.cols.map((c) => c.p);
    // (0.3.2 TT1, B-289: Fintech p3's tasks keep two entries for fields no longer in it; counted, a header there never grew)
    // only the visual's current fields count in its spare room; a stale entry stays in the file as it is (the twin never
    // deletes the person's settings), not counted
    const qs = isObj(v.visual.query) && isObj(v.visual.query.queryState) ? v.visual.query.queryState : {}, current = new Set();
    Object.values(qs).forEach((r) => { if (isObj(r) && Array.isArray(r.projections)) r.projections.forEach((x) => { if (isObj(x) && typeof x.queryRef === 'string') current.add(x.queryRef); }); });
    const stale = (e) => isObj(e.selector) && typeof e.selector.metadata === 'string' && !current.has(e.selector.metadata);
    let spare = Math.floor(p.width - 36 * sc - o.columnWidth.filter((e) => isObj(e) && isObj(e.properties) && !stale(e)).reduce((a, e) => a + (num(e.properties.value) || 0), 0));
    // (0.3.1 MX2, Fintech p1's watchlist: its first column, 4 wide in English, came out a cut sliver «القسم») a column
    // the original hides (narrower than HIDDEN_W) stays hidden: never widened for its header
    cols.filter((x) => widthOf(x.queryRef) >= HIDDEN_W && widthOf(x.queryRef) + 0.5 < need(x)).forEach((x) => {
      let short = need(x) - Math.floor(widthOf(x.queryRef)), got = 0;
      const take = Math.min(short, Math.max(0, spare)); spare -= take; got += take; short -= take;
      // (0.3.1 MX3, laptop part 9: Fintech's task names narrowed 327 -> 134 and wrapped on three lines, the watchlist's
      // project names cut "P054 - SEPA Pl...") no column is narrowed for another's header: each keeps its English width,
      // a header grows only into the box's spare room; what still does not fit is said (headersCut)
      if (got) setW(x.queryRef, Math.floor(widthOf(x.queryRef)) + got);
      const w = widthOf(x.queryRef), what = { page: safeName(at), visual: safeName(String(v.name)), column: safeName(x.queryRef), needs: need(x), width: w };
      if (got) out.headers.push(what);
      if (short <= 0) return;
      // (MX3: one short why per column, the measure said once in the plan's sayInPlan: the plan's texts keep their room)
      if (w + 0.5 >= m(x).lowW) out.headersCut.push(Object.assign({}, what, { cut: 'may be cut', lowW: m(x).lowW, why: 'Power BI may cut it: look in Desktop' }));
      else out.headersCut.push(Object.assign({}, what, { cut: 'cut', lowW: m(x).lowW, why: 'Power BI cuts it: a shorter Arabic name' }));
    });
  });
  return out;
}
