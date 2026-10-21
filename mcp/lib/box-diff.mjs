// R1 prototype (20 Oct 2026, mcp/research/SEE-THE-RESULT.md, option (b)): a box-level comparison of two drawings of a
// report page. Not a tool and not loaded by the server: research code. A calibrated renderer would be scored this way
// against Desktop's captures (golden boxes measured on the laptop): each visual's frame, its title band, the part under
// the title (the plot, the rows, the slicer's box) and a card's value, compared by overlap (IoU) and by the largest
// edge gap in page units. Boxes only: a drawing is read for where things are, never for a value.
// A box list: [{ i, kind (page-preview's kindOf), frame: { x, y, w, h }, title?, content?, value? }].

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const P = require('../../assets/js/page-preview.js');

const r1 = (v) => Math.round(v * 10) / 10;
const box = (x, y, w, h) => ({ x: r1(x), y: r1(y), w: r1(Math.max(0, w)), h: r1(Math.max(0, h)) });

/** The boxes of a page as page-preview takes it (fromFiles: the written report; fromSlots: the plan's slots): frames
 *  only (the files say where a visual is, not where Desktop draws its title). Panels left out (they draw nothing). */
export function boxesOfPage(page) {
  return ((page && page.visuals) || []).map((v, i) => ({ i, kind: P.kindOf(v), frame: box(+v.x || 0, +v.y || 0, +v.w || 0, +v.h || 0) })).filter((b) => b.kind !== 'panel');
}

const attr = (s, k) => { const m = new RegExp('\\s' + k + '="([-\\d.]+)"').exec(s); return m ? +m[1] : null; };
/** The boxes of page-preview's drawing (its SVG): each visual's frame, its title band (the lines it draws, by their
 *  font size), the part under the title (the frame below the band) and a card's value box. */
export function boxesOfSvg(svg) {
  const out = [];
  for (const m of String(svg).matchAll(/<g class="v" data-i="(\d+)" data-kind="([a-z]+)"[^>]*>([\s\S]*?)<!--\/v-->/g)) {
    const kind = m[2]; if (kind === 'panel') continue;
    const body = m[3], fr = /<rect class="box"([^>]*)>/.exec(body); if (!fr) continue;
    const frame = box(attr(fr[1], 'x'), attr(fr[1], 'y'), attr(fr[1], 'width'), attr(fr[1], 'height'));
    const b = { i: +m[1], kind, frame };
    const lines = [...body.matchAll(/<text class="t"([^>]*)>/g)].map((t) => ({ y: attr(t[1], 'y'), px: attr(t[1], 'font-size') })).filter((t) => t.y != null && t.px);
    if (lines.length && !/^(text|button)$/.test(kind)) {
      // (a line's ink: from about 0.8 em above its baseline to 0.25 em below it)
      const top = Math.min(...lines.map((t) => t.y - 0.8 * t.px)), bottom = Math.max(...lines.map((t) => t.y + 0.25 * t.px));
      b.title = box(frame.x, top, frame.w, bottom - top);
      b.content = box(frame.x, bottom, frame.w, frame.y + frame.h - bottom);
    } else if (!/^(text|button|image|shape)$/.test(kind)) b.content = { ...frame };
    const kv = /<rect class="kv"([^>]*)>/.exec(body);
    if (kv) b.value = box(attr(kv[1], 'x'), attr(kv[1], 'y'), attr(kv[1], 'width'), attr(kv[1], 'height'));
    out.push(b);
  }
  return out;
}

/** Overlap of two boxes over their union (1: the same box; 0: apart). */
export function iou(a, b) {
  if (!a || !b) return 0;
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = ix * iy, uni = a.w * a.h + b.w * b.h - inter;
  return uni > 0 ? inter / uni : a.w === b.w && a.h === b.h && a.x === b.x && a.y === b.y ? 1 : 0;
}
/** The largest gap between the matching edges of two boxes (page units). */
export const gap = (a, b) => r1(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.x + a.w - b.x - b.w), Math.abs(a.y + a.h - b.y - b.h)));
const part = (a, b) => (a && b ? { iou: Math.round(iou(a, b) * 1e4) / 1e4, gap: gap(a, b) } : null);

/** Compare drawing a (say, the renderer's) with drawing b (say, the golden capture's): visuals matched one to one, kind
 *  by kind, by overlap (then by the nearest centre for boxes that don't overlap, within maxGap). Returns { pairs: [{ a, b,
 *  kind, frame, title?, content?, value? }] (each { iou, gap }), extra (a's index with no match), missing (b's index with
 *  no match), score (the mean frame IoU over pairs, missing and extra visuals counted as 0), within(t) (pairs whose frame
 *  is within t units) }. opts: { maxGap (default 40) }. */
export function compare(a, b, opts) {
  const o = opts || {}, maxGap = o.maxGap != null ? +o.maxGap : 40, A = a || [], Bx = b || [];
  const cand = [];
  A.forEach((x, ia) => Bx.forEach((y, ib) => {
    if (x.kind !== y.kind) return;
    const ov = iou(x.frame, y.frame), g = gap(x.frame, y.frame);
    if (ov > 0 || g <= maxGap) cand.push({ ia, ib, ov, g });
  }));
  cand.sort((p, q) => q.ov - p.ov || p.g - q.g || p.ia - q.ia || p.ib - q.ib);
  const ua = new Set(), ub = new Set(), pairs = [];
  cand.forEach((c) => {
    if (ua.has(c.ia) || ub.has(c.ib)) return;
    ua.add(c.ia); ub.add(c.ib);
    const x = A[c.ia], y = Bx[c.ib], pr = { a: x.i != null ? x.i : c.ia, b: y.i != null ? y.i : c.ib, kind: x.kind, frame: part(x.frame, y.frame) };
    ['title', 'content', 'value'].forEach((k) => { const v = part(x[k], y[k]); if (v) pr[k] = v; });
    pairs.push(pr);
  });
  pairs.sort((p, q) => p.a - q.a);
  const extra = A.map((x, k) => (ua.has(k) ? null : x.i != null ? x.i : k)).filter((v) => v != null);
  const missing = Bx.map((y, k) => (ub.has(k) ? null : y.i != null ? y.i : k)).filter((v) => v != null);
  const n = pairs.length + extra.length + missing.length;
  const score = n ? pairs.reduce((s, p) => s + p.frame.iou, 0) / n : 1;
  return { pairs, extra, missing, score, within: (t) => pairs.filter((p) => p.frame.gap <= t).length };
}
