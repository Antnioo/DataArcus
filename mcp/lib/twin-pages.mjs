// The Arabic twin, step 5: the pages mirrored (assets/js/report-mirror.js, the writer's engine) and fitted for the
// Arabic texts: buttons, text boxes, table headers, phone tabs, the panels a text box must not become.
// (0.3.1 S9: moved out of lib/arabic-twin.mjs as it was, no change of behaviour; arabic-twin.mjs re-exports what others import)
import { safeName } from './read-report.mjs';
import { isObj, pageOf } from './twin-read.mjs';
import { num, posOf, typeOf, litStr, Ls, overlaps, holdsBox, absBox } from './twin-visuals.mjs';
import { arabicDax, titleMeasuresOf, textMeasuresOf } from './twin-texts.mjs';
import { waterfallFacts } from './twin-model.mjs';
import { langButton } from './twin-copy.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Mirror = require('../../assets/js/report-mirror.js');
const Rules = require('../../assets/js/report-rules.js');
const Sizing = require('../../assets/js/pbip-sizing.js');
const TextMeasure = require('../../assets/js/text-measure.js');
const Q = require('../../assets/js/pbip-query.js');

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
        let off = take;
        // the near side first: each visual moves by what is still to give, a slicer then gives its share
        S.list.slice().sort((a, c) => (S.toLeft ? posOf(c).x - posOf(a).x : posOf(a).x - posOf(c).x)).forEach((x) => {
          const d = share.get(x) || 0; shift(x, S.toLeft ? -off : off);
          if (d) { const q = posOf(x); if (S.toLeft) q.x = Mirror.round(q.x + d); q.width = Mirror.round(q.width - d); off -= d; } });
        if (S.toLeft) p.x = Mirror.round(p.x - take);
        p.width = Mirror.round(p.width + take);
        lines.forEach((s) => { const q = posOf(s); if (S.toLeft) q.x = Mirror.round(q.x - take); q.width = Mirror.round(q.width + take); });
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
    // (TW1, M1-S2: the row label stands for the text column it shows, right-aligned as the writer writes it)
    const rowLabel = (x) => isObj(x.field) && isObj(x.field.Measure) && typeof x.field.Measure.Property === 'string' && x.field.Measure.Property.startsWith(Q.ROW_LABEL);
    const isText = (x) => rowLabel(x) || (isObj(x.field) && !!x.field.Column && !/^(Right|Center)$/i.test(String(oAlign(x.queryRef) || '')));
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

// (0.3.1 TW1, M1-S2: the twin's mirrored table had no "Total": Power BI writes it only in the first projection's column,
// and only when that is a column of text (measured, round 10), and the reversed columns put a number first) A table whose
// original starts with a column of text and shows a number takes the writer's right-to-left table (pbip-query.js
// rowLabelOf, round 23, proven in Desktop 2.158 on 8 Oct): that column first at width 0 (hidden; it keeps the rows, their
// order and what a click filters), the numbers as mirrored, and at the right the report measure "Row label: <Column>"
// (rowLabelDax: the row's name, «الإجمالي» on the total row) under the column's header, with the column's width. A name
// with a control character, or a number Power BI sums in a way DAX can't name, keeps the table as mirrored (AUD-032).
// isText(t, c): the model's type allows text; extMeasure(t, want, expression): the measure's free name. Returns
// "Table[Row label: ...]" or null
const fieldOk = (f) => isObj(f) && isObj(f.Expression) && isObj(f.Expression.SourceRef) && !f.Expression.SourceRef.Schema && typeof f.Expression.SourceRef.Entity === 'string' && typeof f.Property === 'string';
function rowLabelTable(vj, isText, extMeasure) {
  const qs = typeOf(vj) === 'tableEx' && isObj(vj.visual.query) && isObj(vj.visual.query.queryState) ? vj.visual.query.queryState : null, ps = qs && isObj(qs.Values) && Array.isArray(qs.Values.projections) ? qs.Values.projections : null;
  if (!ps || ps.length < 2 || !ps.every((p) => isObj(p) && isObj(p.field) && typeof p.queryRef === 'string')) return null;
  const last = ps[ps.length - 1], col = last.field.Column;
  if (!fieldOk(col) || !isText(col.Expression.SourceRef.Entity, col.Property)) return null;
  const f = { t: col.Expression.SourceRef.Entity, c: col.Property }, rest = ps.slice(0, -1);
  const vals = rest.filter((p) => (isObj(p.field.Measure) && !(isObj(p.field.Measure.Expression) && isObj(p.field.Measure.Expression.SourceRef) && p.field.Measure.Expression.SourceRef.Schema)) || (isObj(p.field.Aggregation) && p.displayName !== ' '));
  const okVal = (p) => (p.field.Measure ? fieldOk(p.field.Measure) : isObj(p.field.Aggregation.Expression) && fieldOk(p.field.Aggregation.Expression.Column) && Q.AGG_DAX[p.field.Aggregation.Function] != null);
  const names = (p) => (p.field.Measure ? [p.field.Measure.Expression.SourceRef.Entity, p.field.Measure.Property] : [p.field.Aggregation.Expression.Column.Expression.SourceRef.Entity, p.field.Aggregation.Expression.Column.Property]);
  if (!vals.length || !vals.every(okVal) || [f.t, f.c].concat(...vals.map(names)).some((n) => Q.hasControl(n))) return null;
  const name = extMeasure(f.t, Q.ROW_LABEL + Q.shown(f.c), Q.rowLabelDax(f, 'الإجمالي', vals)), ref = f.t + '.' + name;
  qs.Values.projections = [last].concat(rest, [{ field: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: f.t } }, Property: name } }, queryRef: ref, nativeQueryRef: name, displayName: last.displayName != null ? last.displayName : (last.nativeQueryRef || f.c) }]);
  const o = vj.visual.objects = isObj(vj.visual.objects) ? vj.visual.objects : {}, cw = o.columnWidth = Array.isArray(o.columnWidth) ? o.columnWidth : [];
  const w = cw.find((e) => isObj(e) && isObj(e.selector) && e.selector.metadata === last.queryRef && isObj(e.properties));
  if (w) cw.push({ properties: { value: w.properties.value }, selector: { metadata: ref } });
  if (w) w.properties.value = { expr: { Literal: { Value: '0D' } } }; else cw.push({ properties: { value: { expr: { Literal: { Value: '0D' } } } }, selector: { metadata: last.queryRef } });
  const cf = o.columnFormatting = Array.isArray(o.columnFormatting) ? o.columnFormatting : [];
  cf.push({ properties: { alignment: Ls('Right'), styleHeader: { expr: { Literal: { Value: 'true' } } }, styleValues: { expr: { Literal: { Value: 'true' } } }, styleTotal: { expr: { Literal: { Value: 'true' } } } }, selector: { metadata: ref } });
  return f.t + '[' + name + ']';
}

// ---- the twin's pages, built in memory (the plan shows what they fit; the write writes exactly them) ----
// labels: by the mirror engine's ids (the report's own names). Returns { pages: [{ rel, page, visuals: [json] }],
// applied, ext (the twin's reportExtensions.json or null), titleMeasures, fitted }
export function buildTwin(P, labels) {
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
  // (TW1, M1-S2) the tables' row labels: each in the twin's reportExtensions.json, named free as the waterfall's are; the
  // same DAX in the same table is one measure
  const rlWritten = [], tables = [];
  const typeIn = (t, c) => { const tb = P.model && (P.model.tables || []).find((x) => x.name === t), cl = tb && (tb.columns || []).find((x) => x.name === c); return cl ? String(cl.dataType || '') : ''; };
  const isText = (t, c) => /^(|string|text|unknown)$/i.test(typeIn(t, c));
  const rowLabelMeasure = (t, want, expression) => {
    if (!ext) ext = { $schema: EXT_SCHEMA, name: 'extension', entities: [] };
    let e = ext.entities.find((x) => isObj(x) && x.name === t); if (!e) ext.entities.push(e = { name: t, measures: [] }); if (!Array.isArray(e.measures)) e.measures = [];
    const had = rlWritten.find((x) => x.t === t && x.expression === expression); if (had) return had.m;
    const names = takenAnywhere(); let m = want; for (let k = 2; names.has(m.toLowerCase()); k++) m = want + ' (' + k + ')';
    e.measures.push({ name: m, dataType: 'Text', expression }); rlWritten.push({ t, m, expression }); return m; };
  const fitted = { buttons: [], buttonsCut: [], headers: [], headersCut: [], textboxes: [], textboxesCut: [] }, phone = { tabs: [], tabsCut: [], pages: 0 };
  const pages = R.pages.map((pg) => {
    let page = pg.page;
    if (isObj(pg.page)) { page = JSON.parse(JSON.stringify(pg.page)); if (labels['page:' + pg.id] != null) { page.displayName = labels['page:' + pg.id]; applied++; } }
    // (T-1: a page drawn on a picture is copied left to right unless asked; its texts still take the approved labels)
    const r = P.keepLtr(pg) ? { visuals: pg.visuals.map((v) => JSON.parse(JSON.stringify(v.json))) } : Mirror.mirrorPage(pg.page, pg.visuals.map((v) => v.json), opts);
    r.visuals.forEach((vj) => {
      applied += Mirror.labelVisual(pg.id, vj, labels);
      if (isObj(vj) && isObj(vj.visual)) wholeTitles(vj.visual.visualContainerObjects);
      if (textRename.size) rewireMeasures(vj, textRename);
      if (!P.keepLtr(pg)) { const rl = rowLabelTable(vj, isText, rowLabelMeasure); if (rl) tables.push({ page: safeName(pg.id), visual: safeName(String(vj.name)), measure: safeName(rl) }); }
      const t = isObj(vj) && isObj(vj.visual) && isObj(vj.visual.visualContainerObjects) && Array.isArray(vj.visual.visualContainerObjects.title) ? vj.visual.visualContainerObjects.title : [];
      t.forEach((e) => { const ms = isObj(e) && isObj(e.properties) && isObj(e.properties.text) && isObj(e.properties.text.expr) && isObj(e.properties.text.expr.Measure) ? e.properties.text.expr.Measure : null, src = ms && isObj(ms.Expression) && isObj(ms.Expression.SourceRef) ? ms.Expression.SourceRef : null;
        if (src && src.Schema === 'extension' && rename.has(src.Entity + '\u0000' + ms.Property)) { ms.Property = rename.get(src.Entity + '\u0000' + ms.Property); applied++; } });
    });
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
      applied += Mirror.labelMobile(pg.id, r.visuals[i], m, labels, { font: ctx.text.font, was: v.json }); if (isObj(m)) wholeTitles(m.visualContainerObjects); return m; });
    if (mobiles.some(Boolean)) { phone.pages++; if (!P.keepLtr(pg)) { try { fitPhoneTabs(pg, r.visuals, mobiles, ctx, phone); } catch (e) { /* a shape not expected: left as it is */ } } }
    return { pg, page, visuals: r.visuals, mobiles };
  });
  const notTranslated = tms.filter((x) => !x.pd.branches).map((x) => ({ what: 'Chart title (from a title measure)', measure: safeName(x.entity + '[' + x.name + ']'), why: x.pd.why }));
  // (0.3.0 D3) the original's own title measures the twin's charts no longer use: left in the twin's file as they are
  // (X1: in one report the English pages still show them)
  const notShown = P.same ? [] : [...rename.keys()].map((k) => { const [entity, name] = k.split('\u0000'); return { measure: safeName(entity + '[' + name + ']'), now: safeName(entity + '[' + rename.get(k) + ']'), why: 'the original\'s title measure: the twin\'s charts use their own Arabic one instead; left in the twin\'s reportExtensions.json as it is, and no visual of the twin shows it' }; });
  return { pages, applied, phone, notShown, ext: written.length || rewritten || wfWritten.length || rlWritten.length ? ext : null, tables, fitted, titleMeasures: tms.length ? { measures: tms.length, translated: written.length, written, notTranslated } : null, waterfallMeasures: wfWritten.map((x) => safeName(x.t + '[' + x.m + ']')), textMeasures: [...textRename].map(([k, to]) => ({ measure: safeName(k.split('\u0000')[0] + '[' + k.split('\u0000')[1] + ']'), arabic: safeName(k.split('\u0000')[0] + '[' + to + ']') })) };
}
