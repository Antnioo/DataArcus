// The Arabic twin, step 5b: the geometry of one mirrored page (0.3.2 SP26: moved out of lib/twin-pages.mjs as it was,
// no change of behaviour; twin-pages.mjs's buildTwin calls them, in its order): a small visual on its host
// (badgesWithText), the visuals over or beside a table or matrix (aroundTables), a chart lined up with a heatmap's grid
// (underGrids), a text box's indentation (indentToEnd) and the room of the icon on its end (iconRoom).
// The interface: each function fits one page's twin.
//   in:  pg (the English page as read: { page, visuals: [{ json }] }), r (the mirror's result for that page:
//        { visuals: the twin's visual JSONs, units: Mirror's { on, bars }, moved }), opts (the mirror's options),
//        pageW (the page's width), extra (the names tables the twin adds beside heatmaps: [{ from, json }]);
//        indentToEnd (en, ar): one English text box and its twin copy; iconRoom (visuals, moved): the twin's visuals
//   out: the changes, made in place on the twin's copies (r.visuals' boxes, a chart kept by aroundTables replaces its
//        entry in r.visuals, a text box's runs), and what is said, pushed on r.moved (iconRoom: on `moved`) as
//        { visual, rule[, ruleAr] }; keptAtMirrorLine (hit, shift) returns that entry's words
// No state between calls and no IO: the engines (report-mirror, mirror-policy, text-measure) and the twin's pure
// helpers only. Which kinds keep left to right inside: mirror-policy.js keepsGridLtr (the one home of that rule).
import { safeName } from './read-report.mjs';
import { isObj, pageOf } from './twin-read.mjs';
import { posOf } from './twin-visuals.mjs';
import { pageBoxes } from './page-picture.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Mirror = require('../../assets/js/report-mirror.js');
const Policy = require('../../assets/js/mirror-policy.js');
const Units = require('../../assets/js/mirror-units.js');
const TextMeasure = require('../../assets/js/text-measure.js');
// a literal's text, number and true or false, a column's set width: assets/js/pbir-values.js, their one home (DD1B)
const { litText, litNumber, litBool, columnWidth } = require('../../assets/js/pbir-values.js');
// (0.3.1 MX7, laptop part 12: Call Center's hour chart 52c8e333 starts 27 left of its heatmap's grid and ends 8 right of
// it in English; mirrored about its own box it started 8 left and ended 27 right, its bars still left to right, so they
// stood a cell right of their hours) a matrix keeps its columns in English's left-to-right order (Power BI's matrix has
// no right-to-left setting), so a chart lined up with its grid keeps English's offset from the grid's left edge: the
// grid's left is the box's x, its left padding and its row header strip (the row field's columnWidth: 1 when the twin
// writes its names beside, English's when set, else not counted on either side). Lined up: same parent, a chart with a
// category axis, its span shared with the matrix's box by 0.8 of the narrower, under it (its top below the matrix's
// middle, within 24 of its bottom) or over it (the mirror of that). Kept inside its page or group; named in movedByRule.
// (0.3.1 MX8, laptop part 13: Call Center's hour chart 52c8e333 moved under its grid kept the general mirror inside it:
// its padding swapped put every bar 16-23 px right of its hour; ER's c1e3e190, its Ascending sort turned Descending, put
// hour 23's bar under «00») the grid beside it keeps English's left-to-right order, so the chart keeps English's inside
// too: its container padding, its value and category axis cards (axis side, a time axis's inversion) and its sort, as
// English has them (absent stays absent); only moved. Before the labels are written, so an axis title still takes its Arabic
function keepInside(en, tw) {
  const ev = en.visual, tv = tw.visual; if (!isObj(ev) || !isObj(tv)) return;
  const put = (bag, k, from) => { if (isObj(from) && from[k] !== undefined) bag[k] = JSON.parse(JSON.stringify(from[k])); else delete bag[k]; };
  if (isObj(tv.query)) put(tv.query, 'sortDefinition', ev.query);
  if (!isObj(tv.objects)) tv.objects = {};
  ['valueAxis', 'categoryAxis'].forEach((k) => put(tv.objects, k, ev.objects));
  if (!isObj(tv.visualContainerObjects)) tv.visualContainerObjects = {};
  put(tv.visualContainerObjects, 'padding', ev.visualContainerObjects);
}
const GRID_CHARTS = /^(columnChart|clusteredColumnChart|stackedColumnChart|hundredPercentStackedColumnChart|lineChart|areaChart|stackedAreaChart|hundredPercentStackedAreaChart|lineClusteredColumnComboChart|lineStackedColumnComboChart|ribbonChart)$/;
// the first visual (by name) the chart j would newly cover at x: one it does not overlap in English (boxes on the page,
// groups added; a heatmap's names table, extra, as its matrix)
function landsOn(pg, r, extra, j, x) {
  const ct = r.visuals[j], was = posOf(ct).x; posOf(ct).x = x;
  try {
    // (B2new-8) a group's own box counts too (pageBoxes leaves groups out): its place on the page, its parents added
    const boxes = (vs) => { const m = pageBoxes(vs), by = new Map(vs.filter((v) => isObj(v) && v.name != null).map((v) => [String(v.name), v]));
      by.forEach((v, n) => { if (!isObj(v.visualGroup) || v.isHidden) return; const p = posOf(v); if (!p) return; const b = { x: p.x, y: p.y, w: p.width, h: p.height };
        let g = v.parentGroupName, d = 0; while (g != null && by.has(String(g)) && d++ < 10) { const q = posOf(by.get(String(g))); if (!q) return; b.x += q.x; b.y += q.y; g = by.get(String(g)).parentGroupName; }
        m.set(n, b); }); return m; };
    const en = boxes(pg.visuals.map((v) => v.json)), ar = boxes(r.visuals.concat((extra || []).map((e) => e.json))), me = String(ct.name);
    const fromOf = new Map((extra || []).map((e) => [String(e.json.name), e.from])), a = ar.get(me), e0 = en.get(me);
    if (!a || !e0) return null;
    const meet = (p, q) => Math.max(0, Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x)) * Math.max(0, Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y));
    for (const [n, b] of [...ar].sort((u, v) => (u[0] < v[0] ? -1 : 1))) {
      if (n === me || meet(a, b) <= 4) continue;
      const eb = en.get(fromOf.has(n) ? String(fromOf.get(n)) : n);
      if (!eb || meet(e0, eb) <= 0) return safeName(String(n));
    }
    return null;
  } finally { posOf(ct).x = was; }
}
// (0.3.2 TT1, B-302: HM2's A1-1 kept at its mirror stood 31 px, about one cell, off its grid; the plan said only "kept
// at its mirror") the kept-at-mirror line; over 2 px it says the shift (the mirror less the lined-up place: HM2's) from
// the grid's cells, in English and Arabic; 2 px or less, the line as before
export function keptAtMirrorLine(hit, shift) {
  const rule = 'kept at its mirror, its inside as English (sort, axis side, padding: the grid reads left to right), not lined up with its heatmap\'s grid: there it would cover ' + hit + ', which it does not in English';
  if (!(Math.abs(shift) > 2)) return { rule };
  const n = Math.round(Math.abs(shift)), left = shift < 0;
  return { rule: rule + `; it stands ${n} px ${left ? 'left' : 'right'} of its grid's cells`,
    ruleAr: `أُبقي في موضع انعكاسه، وداخله كما في الإنجليزية (الفرز وجهة المحور والحشو: الشبكة تُقرأ من اليسار إلى اليمين)، ولم يُحاذَ مع شبكة خريطته الحرارية: هناك كان سيغطي ${hit}، وهو لا يغطيه في الإنجليزية؛ ويقف على بُعد ${n} بكسل إلى ${left ? 'يسار' : 'يمين'} خلايا شبكتها` };
}
export function underGrids(pg, r, pageW, extra) {
  const qs = (v) => (isObj(v) && isObj(v.visual) && isObj(v.visual.query) && isObj(v.visual.query.queryState) ? v.visual.query.queryState : {});
  const has = (v, k) => isObj(qs(v)[k]) && Array.isArray(qs(v)[k].projections) && qs(v)[k].projections.length > 0;
  const pad = (v) => { const e = (isObj(v.visual.visualContainerObjects) && Array.isArray(v.visual.visualContainerObjects.padding) ? v.visual.visualContainerObjects.padding : []).find((x) => isObj(x) && !x.selector && isObj(x.properties) && x.properties.left !== undefined); const n = e ? litNumber(e.properties.left) : 0; return Number.isFinite(n) ? n : 0; };
  const strip = (v) => { const rq = qs(v).Rows.projections[0] && qs(v).Rows.projections[0].queryRef, cw = isObj(v.visual.objects) && Array.isArray(v.visual.objects.columnWidth) ? v.visual.objects.columnWidth : [];
    return columnWidth(cw, rq); };
  const parent = (v) => (v.parentGroupName != null ? String(v.parentGroupName) : '');
  // (0.3.2 DD1C2) the frame: mirror-units.js frameWidth, the one rule (unknown: the chart keeps its wanted x, unclamped)
  const byName = Units.byNameOf(r.visuals), widthOf = (v) => Units.frameWidth({ width: pageW }, byName, v);
  pg.visuals.forEach((m, i) => {
    const en = m.json, tw = r.visuals[i];
    if (!isObj(en) || !isObj(tw) || Mirror.kindOf(en) !== 'matrix' || !has(en, 'Rows') || !has(en, 'Columns') || !posOf(en) || !posOf(tw)) return;
    const sEn = strip(en), sTw = strip(tw), both = sEn != null && sTw != null;
    const leftEn = posOf(en).x + pad(en) + (both ? sEn : 0), leftTw = posOf(tw).x + pad(tw) + (both ? sTw : 0), hb = posOf(en);
    pg.visuals.forEach((c, j) => {
      const ce = c.json, ct = r.visuals[j], cb = posOf(ce), q = posOf(ct);
      if (j === i || !cb || !q || parent(ce) !== parent(en) || !GRID_CHARTS.test(String(ce.visual && ce.visual.visualType)) || !has(ce, 'Category')) return;
      const share = Math.min(cb.x + cb.width, hb.x + hb.width) - Math.max(cb.x, hb.x);
      if (share < 0.8 * Math.min(cb.width, hb.width)) return;
      const under = cb.y >= hb.y + hb.height / 2 && cb.y <= hb.y + hb.height + 24, over = cb.y + cb.height <= hb.y + hb.height / 2 && cb.y + cb.height >= hb.y - 24;
      if (!under && !over) return;
      const W = widthOf(ct), want = leftTw + (cb.x - leftEn), x = Mirror.round(Number.isFinite(W) ? Math.max(0, Math.min(W - q.width, want)) : want);
      // (0.3.1 MX8, the night lab's B2new-1..12 on a6000a27: the chart moved with its grid landed on a visual it did not
      // overlap in English) moved there it must cover nothing it did not cover in English (a heatmap's names table
      // counts as its matrix); else it keeps its plain mirror, said
      // (0.3.2 HM2, laptop part 14, B-298; Codex's twin-fuzz-2 A1: kept at its mirror it still took the general mirror's
      // inside, Descending sort, value axis switched, padding swapped: Call Center's hour 9 stood under «10») the grid
      // still reads left to right, so the chart keeps English's inside whether it moves or not
      const hit = landsOn(pg, r, extra, j, x);
      if (hit) { keepInside(ce, ct); (r.moved = r.moved || []).push(Object.assign({ visual: String(ct.name) }, keptAtMirrorLine(hit, q.x - want))); return; }
      q.x = x;
      keepInside(ce, ct);
      (r.moved = r.moved || []).push({ visual: String(ct.name), rule: 'kept lined up with its heatmap\'s grid, as English: its offset, padding, axis side and sort (the grid reads left to right)' + (Math.abs(x - want) > 0.01 ? ', moved to stay inside its page' : '') });
    });
  });
}

// (0.3.1 MP1, the laptop's part 4b: a KPI icon landed on its own title «المكالمات») a small visual on a bigger one is kept
// at its place on it (Mirror's units: what a bigger visual draws inside does not flip). Where text does turn right, the
// small visual goes to the other end with it, as the boxes' own padding does:
// - (MP1b, laptop part 6: Fintech's «فهمت» over its help text) it lies on a text box whose text turns right (that text
//   box its host or not): to the text box's other end;
// - it sits on a text box, or on a visual whose own title turns right (a card's title): to that visual's other end;
// - (MP1b, part 6: Call Center's 4 KPI icons) kept at its place it would lie on another visual it did not touch in
//   English (a title mirrored beside it): mirrored on its own (to the host's other end).
// A text box whose paragraphs are all centred turns nothing.
const textTurns = (v) => (isObj(v) && isObj(v.visual) && isObj(v.visual.objects) && Array.isArray(v.visual.objects.general) ? v.visual.objects.general : [])
  .some((e) => isObj(e) && isObj(e.properties) && Array.isArray(e.properties.paragraphs) && e.properties.paragraphs.some((pa) => isObj(pa) && pa.horizontalTextAlignment !== 'center'));
export const boxOk = (v) => isObj(v) && isObj(v.position) && ['x', 'y', 'width', 'height'].every((k) => Number.isFinite(v.position[k]));
const titleAlign = (v) => { const t = isObj(v) && isObj(v.visual) && isObj(v.visual.visualContainerObjects) && Array.isArray(v.visual.visualContainerObjects.title) ? v.visual.visualContainerObjects.title.find((e) => isObj(e) && !e.selector && isObj(e.properties)) : null;
  return t && litBool(t.properties.show) !== false ? String(litText(t.properties.alignment) || 'left').toLowerCase() : null; };
const titleTurns = (en, ar) => { const a = titleAlign(en), b = titleAlign(ar); return a != null && b === 'right' && a !== 'right'; };
const overlapOf = (a, b) => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
export function badgesWithText(pg, r) {
  const en = new Map(pg.visuals.filter((v) => isObj(v.json)).map((v) => [String(v.json.name), v.json])), ar = new Map((r.visuals || []).filter(isObj).map((v) => [String(v.name), v]));
  const within = (b0, t0, t1) => Mirror.round(t1.position.x + t0.position.width - (b0.position.x - t0.position.x) - b0.position.width);
  ((r.units && r.units.on) || []).forEach((u) => {
    const h0 = en.get(String(u.host)), b0 = en.get(String(u.visual)), h1 = ar.get(String(u.host)), b1 = ar.get(String(u.visual));
    if (![h0, b0, h1, b1].every(boxOk)) return;
    const sib = [...en.entries()].filter(([n, v]) => n !== String(u.visual) && n !== String(u.host) && boxOk(v) && boxOk(ar.get(n)) && String(v.parentGroupName || '') === String(b0.parentGroupName || '') && !v.visualGroup);
    // a text box under it whose text turns right
    const t = sib.find(([, v]) => Mirror.kindOf(v) === 'textbox' && textTurns(v) && overlapOf(v.position, b0.position) >= b0.position.width * b0.position.height / 2);
    const moved = (x, rule) => { if (x !== b1.position.x) { b1.position.x = x; (r.moved = r.moved || []).push({ visual: String(u.visual), rule }); } };
    if (t) { moved(within(b0, t[1], ar.get(t[0])), 'a small visual on a text box: to its other end with the text'); return; }
    // its host's text or title turns right
    if ((Mirror.kindOf(h0) === 'textbox' && textTurns(h0)) || titleTurns(h0, h1)) { moved(within(b0, h0, h1), 'a small visual on a visual whose text or title turns right: to its other end'); return; }
    // kept, it would lie on another visual it did not touch in English
    if (sib.some(([n, v]) => overlapOf(ar.get(n).position, b1.position) > 0 && overlapOf(v.position, b0.position) <= 0)) moved(within(b0, h0, h1), 'a small visual kept on its host would cover another: mirrored on its own');
  });
}
// (0.3.1 MP1c, laptop part 7: ER's weekday bars over the heatmap's row headers; Call Center's small bar chart over the
// ratings table, its count labels on the stars) a matrix keeps its row headers at its left, and a table of one column is
// not reversed: both stay left to right inside. A bar chart drawn over one of them keeps its place on it and its bars'
// direction (as Mirror keeps a badge on its host, and T-6 a bar list's direction); a visual that overlapped a matrix on
// its right part (away from its row headers) is narrowed on its side facing the matrix by the overlap in the twin, so
// it does not lie on the row headers (inside its own mirrored box: it stays on its panel)
// (0.3.1 MP1d, laptop part 8: Desktop keeps a table's columns at its left edge in the twin too, whatever their number)
// a matrix, or a table of any number of columns, as page-picture.mjs's check decides it (SP26: mirror-policy.js keepsGridLtr)
export function aroundTables(pg, r, opts) {
  const list = pg.visuals.map((v) => v.json), arAt = new Map((r.visuals || []).map((v, i) => [isObj(v) ? String(v.name) : '', i]));
  // (0.3.2 DD1C) the frame: mirror-units.js frameWidth, the one rule
  const byName = Units.byNameOf(list), widthOf = (v) => Units.frameWidth(pageOf(pg), byName, v);
  list.filter((m) => boxOk(m) && Policy.keepsGridLtr(m) && arAt.has(String(m.name))).forEach((m0) => {
    const m1 = r.visuals[arAt.get(String(m0.name))];
    list.filter((v) => v !== m0 && boxOk(v) && !v.visualGroup && String(v.parentGroupName || '') === String(m0.parentGroupName || '') && arAt.has(String(v.name))).forEach((v0) => {
      const i = arAt.get(String(v0.name)), v1 = r.visuals[i], a = v0.position, b = m0.position, ov = overlapOf(a, b); if (!ov || !boxOk(v1) || !boxOk(m1)) return;
      if (Mirror.kindOf(v0) === 'bar' && ov >= a.width * a.height * 0.75 && Number.isFinite(a.z) && Number.isFinite(b.z) && a.z > b.z) {
        // (DD1C) an unknown frame (no valid group, a page width not a number): never kept with a guess, left as mirrored
        if (!Number.isFinite(widthOf(v0))) return;
        let k; try { k = Mirror.mirrorVisual(v0, widthOf(v0), Object.assign({}, opts, { keepDirection: true })).json; } catch (e) { return; }
        if (!isObj(k) || !isObj(k.position)) return;
        // (0.3.1 MX6, the fuzz lab's B1-3: a bar 57 left of its table's left edge, the table mirrored to x 0, went to x -57)
        // the kept offset is clamped to its page or group; a bar wider than its page or group can't be kept inside: said
        const W = widthOf(v0), want = Mirror.round(m1.position.x + a.x - b.x), x = Mirror.round(Math.max(0, Math.min(want, W - k.position.width)));
        k.position.x = x; r.visuals[i] = k;
        (r.moved = r.moved || []).push({ visual: String(v0.name), rule: 'a bar chart over a table or matrix that stays left to right: kept on it, its bars\' direction kept' + (k.position.width > W + 0.5 ? `; wider (${a.width}) than its ${v0.parentGroupName != null ? 'group' : 'page'} (${W}): it cannot fit inside` : x !== want ? `; moved ${Mirror.round(Math.abs(x - want))} to stay inside its ${v0.parentGroupName != null ? 'group' : 'page'}` : '') }); return;
      }
      // (a matrix only: its row headers are at its left in both languages)
      if (Mirror.kindOf(m0) !== 'matrix') return;
      // (0.3.1 MP1d, laptop part 8: a column chart under the heatmap, overlapping only its bottom, was cut to 6.67 wide, a
      // card behind a matrix of its own box to 0.92) only a visual in the matrix's side margin: its left edge in the
      // matrix's right half, its right edge past the matrix's, its overlap a strip (a third of its own width at most, a
      // quarter of the matrix's) beside the matrix's rows for half its height or more; never one that covers the
      // matrix, lies under or behind it, or touches only its top or bottom edge
      const p1 = v1.position, q1 = m1.position, ow = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x), oh = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      const margin = a.x > b.x + b.width / 2 && a.x + a.width > b.x + b.width && ow > 0 && ow <= a.width / 3 && ow <= b.width / 4 && oh >= a.height / 2;
      if (margin && overlapOf(p1, q1) > 0 && p1.x < q1.x) { p1.width = Mirror.round(q1.x - p1.x); (r.moved = r.moved || []).push({ visual: String(v0.name), rule: 'in a matrix\'s side margin: narrowed off its row headers' }); }
    });
  });
}
// (0.3.1 MP1c, laptop part 7: Call Center's KPI titles ["\t\t\t\t\t", "Calls"], the word under the mirrored icon) on a text
// box paragraph the twin turns right, the runs of only tabs or spaces at its start (indentation) move to its end, so
// the room they kept stays on the side of the icon; after the labels (the runs' ids are those the plan listed)
const paragraphsIn = (o) => { const g = isObj(o) && isObj(o.visual) && isObj(o.visual.objects) ? o.visual.objects.general : isObj(o) && isObj(o.objects) ? o.objects.general : null;
  return (Array.isArray(g) ? g : []).flatMap((e) => (isObj(e) && isObj(e.properties) && Array.isArray(e.properties.paragraphs) ? e.properties.paragraphs : [])); };
export function indentToEnd(en, ar) {
  const ep = paragraphsIn(en), ap = paragraphsIn(ar);
  ap.forEach((pa, i) => {
    const was = isObj(ep[i]) ? ep[i].horizontalTextAlignment : undefined;
    if (!isObj(pa) || pa.horizontalTextAlignment !== 'right' || was === 'right' || was === 'center' || !Array.isArray(pa.textRuns)) return;
    let k = 0; while (k < pa.textRuns.length - 1 && isObj(pa.textRuns[k]) && typeof pa.textRuns[k].value === 'string' && /^[ \t\u00A0]+$/.test(pa.textRuns[k].value)) k++;
    if (k && pa.textRuns.slice(k).some((x) => isObj(x) && typeof x.value === 'string' && x.value.trim())) pa.textRuns = pa.textRuns.slice(k).concat(pa.textRuns.slice(0, k));
  });
}
// (0.3.1 MP1d, laptop part 8: «متوسط مدة المكالمة (بالثواني)» touched its clock icon: the Arabic, wider than the
// English, outgrew the tab stops that kept the icon's room) where a small visual lies, after the mirror and the text
// fitting, on the end of a text box its text runs to (its paragraphs right-aligned: its right end), the text box ends
// ICON_GAP before it: its width reduced on that side, whatever the text's width
// (0.3.1 MP1f, laptop part 9: Call Center's four KPI boxes narrowed by the icon's width, 52.6 px, so every right-aligned
// line, not only the title, moved left: Talk Time's sparkline crossed «3m 46s», two comparison lines wrapped and the box
// scrolled) the narrowing is checked against the box's other paragraphs: a box with any other line keeps its width, and
// the icon's room goes to the title's paragraph only (the one English indented, else the first with text): its end
// spaces or tabs become one run of no-break spaces as wide as the room, measured (text-measure.js, the run's size),
// where tab stops gave a room the wider Arabic outgrew (part 8). A box of one paragraph still ends before the icon
const ICON_GAP = 4, NBSP = '\u00A0', BLANK = /^[ \t\u00A0]+$/;
const runText = (pa) => (isObj(pa) && Array.isArray(pa.textRuns) ? pa.textRuns.map((r) => (isObj(r) && typeof r.value === 'string' ? r.value : '')).join('') : '');
function titleRoom(ps, room) {
  let k = ps.findIndex((pa) => Array.isArray(pa.textRuns) && pa.textRuns.length > 1 && BLANK.test(String((pa.textRuns[pa.textRuns.length - 1] || {}).value || '')) && runText(pa).trim());
  if (k < 0) k = ps.findIndex((pa) => runText(pa).trim());
  if (k < 0) return;
  const rs = ps[k].textRuns; let n = rs.length; while (n > 1 && isObj(rs[n - 1]) && BLANK.test(String(rs[n - 1].value || ''))) n--;
  const like = rs[n] || [...rs.slice(0, n)].reverse().find((r) => isObj(r) && String(r.value || '').trim()) || {};
  const pt = parseFloat(isObj(like.textStyle) ? like.textStyle.fontSize : '') || 12, space = TextMeasure.textWidth(' ', pt);
  const run = Object.assign(JSON.parse(JSON.stringify(like)), { value: NBSP.repeat(Math.max(1, Math.ceil(room / space - 1e-9))) });
  ps[k].textRuns = rs.slice(0, n).concat([run]);
}
export function iconRoom(visuals, moved) {
  const list = (visuals || []).filter((v) => boxOk(v) && !v.visualGroup);
  list.filter((t) => Mirror.kindOf(t) === 'textbox').forEach((t) => {
    const ps = paragraphsIn(t);
    if (!ps.length || !ps.every((pa) => isObj(pa) && pa.horizontalTextAlignment === 'right')) return;
    const tp = t.position;
    list.forEach((i) => {
      const ip = i.position; if (i === t || String(i.parentGroupName || '') !== String(t.parentGroupName || '') || ip.width > tp.width / 3 || ip.height > tp.height * 1.5 || overlapOf(ip, tp) < ip.width * ip.height / 2) return;
      const w = ip.x - ICON_GAP - tp.x;
      if (!(ip.x + ip.width / 2 > tp.x + tp.width * 3 / 4 && w >= 10 && w < tp.width)) return;
      if (ps.filter((pa) => runText(pa).trim()).length > 1) { titleRoom(ps, tp.width - w); return; }
      tp.width = Mirror.round(w); if (moved) moved.push({ visual: String(t.name), rule: 'a text box ends before the icon on its end' });
    });
  });
}
