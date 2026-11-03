// RD1 B-304 prototype: tidy an existing dashboard (aligned, evenly spaced, symmetrical, nothing else changed).
// Writes made-up messy pages (a clean layout with seeded jitter of 3 to 20 px, one overlap, one off-page visual, groups
// holding a text box and a shape) as PBIR into a fresh folder under os.tmpdir(), tidies them with a pure function
// (variant A: top-level native visuals only; B: A + groups moved as one unit, a free header text box with its visual),
// compares with the redesign's grid (C: lib/redesign-grid.mjs gridPage, imported), prints a before/after table per page,
// runs Microsoft's validator as mcp/lib/check-report.mjs:362-363 does (runReportValidation with getMetadataProvider,
// skipSchema: true), mirrors B's pages with the repo's twin engine (assets/js/report-mirror.js mirrorPage) and measures
// x' = W - x - width, overlaps and edge counts, and prints the plan's move lines for one page. Never reads data.
// Run: node mcp/research/rd1/b304/prototype.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { unitsOf, gridPage, overlap, follow } from '../../../lib/redesign-grid.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MCP = path.resolve(HERE, '../../..');
const require = createRequire(path.join(MCP, 'package.json'));
const Mirror = require('../assets/js/report-mirror.js');
const { runReportValidation, getMetadataProvider } = await import('@microsoft/powerbi-report-authoring-cli');

// ---- seeded PRNG (mulberry32) ----
function prng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const W = 1280, H = 720, CM = 24, CG = 24;   // the clean pages: margins and gaps of 24 (the author's, not the grid's 16)
const DECOR = ['textbox', 'shape', 'basicShape', 'image'];
const TABLES = ['tableEx', 'pivotTable'];
// a row of visuals between L and R, widths by weight, gap CG
function row(y, h, specs, L = CM, R = W - CM) {
  const sum = specs.reduce((a, s) => a + (s.wt || 1), 0), room = R - L - (specs.length - 1) * CG;
  let x = L;
  return specs.map((s, i) => { const w = i === specs.length - 1 ? R - x : Math.round(room * (s.wt || 1) / sum); const it = Object.assign({}, s, { b: { x, y, w, h } }); x += w + CG; return it; });
}
const V = (name, type, label, wt) => ({ name, type, label, wt });

// ---- the clean pages (made up) ----
function cleanPages() {
  const P = [];
  P.push({ id: 'overview', title: 'Sales overview', items: [
    { name: 'gHeader', type: 'group', label: 'Header group', b: { x: CM, y: CM, w: W - 2 * CM, h: 48 }, kids: [
      { name: 'hdrTitle', type: 'textbox', label: 'Header title', b: { x: 0, y: 0, w: 560, h: 40 } },
      { name: 'hdrLine', type: 'shape', label: 'Header line', b: { x: 0, y: 44, w: W - 2 * CM, h: 4 } }] },
    ...row(96, 112, [V('cRevenue', 'card', 'Revenue card'), V('cOrders', 'card', 'Orders card'), V('cMargin', 'card', 'Margin card'), V('cCustomers', 'card', 'Customers card')]),
    ...row(232, 232, [V('chMonth', 'clusteredColumnChart', 'Revenue by month chart', 3), V('chTrend', 'lineChart', 'Orders trend chart', 2)]),
    ...row(488, 208, [V('tTop', 'tableEx', 'Top products table'), V('chRegion', 'clusteredBarChart', 'Revenue by region chart')])], overlap: 'cMargin' });
  P.push({ id: 'trends', title: 'Trends', items: [
    { name: 'tbTitle', type: 'textbox', label: 'Page title', b: { x: CM, y: CM, w: 600, h: 40 } },
    ...row(88, 280, [V('chA', 'lineChart', 'Weekly orders chart'), V('chB', 'areaChart', 'Returns chart'), V('chC', 'columnChart', 'New customers chart')]),
    ...row(392, 304, [V('chD', 'lineClusteredColumnComboChart', 'Revenue and margin chart'), V('chE', 'scatterChart', 'Price and volume chart')])] });
  const sl = (n, l, y) => ({ name: n, type: 'slicer', label: l, b: { x: CM, y, w: 240, h: 120 } });
  P.push({ id: 'panel', title: 'Filters panel', items: [sl('sYear', 'Year slicer', 24), sl('sRegion', 'Region slicer', 168), sl('sChannel', 'Channel slicer', 312),
    { name: 'shDivider', type: 'shape', label: 'Divider line', b: { x: 274, y: CM, w: 4, h: H - 2 * CM } },
    ...row(24, 324, [V('chF', 'lineChart', 'Sales chart'), V('chG', 'donutChart', 'Mix chart')], 288),
    ...row(372, 324, [V('chH', 'clusteredBarChart', 'Stores chart'), V('chI', 'columnChart', 'Units chart')], 288)] });
  P.push({ id: 'kpis', title: 'KPI strip', items: [
    ...row(24, 96, ['k1', 'k2', 'k3', 'k4', 'k5', 'k6'].map((n, i) => V(n, 'card', ['Revenue', 'Orders', 'Margin', 'Returns', 'Units', 'Stores'][i] + ' card'))),
    ...row(144, 552, [V('tDetail', 'tableEx', 'Orders detail table')])], offPage: 'tDetail' });
  P.push({ id: 'regional', title: 'Regional', items: [
    { name: 'gNote', type: 'group', label: 'Note group', b: { x: CM, y: 24, w: 400, h: 200 }, kids: [
      { name: 'noteBack', type: 'shape', label: 'Note backdrop', b: { x: 0, y: 0, w: 400, h: 200 } },
      { name: 'noteText', type: 'textbox', label: 'Note text', b: { x: 16, y: 16, w: 368, h: 40 } },
      { name: 'noteCard', type: 'card', label: 'Note card', b: { x: 16, y: 64, w: 368, h: 120 } }] },
    ...row(24, 200, [V('mMap', 'azureMap', 'Stores map'), V('chDonut', 'donutChart', 'Share chart')], CM + 400 + CG),
    ...row(248, 200, [V('r1', 'columnChart', 'North chart'), V('r2', 'columnChart', 'South chart'), V('r3', 'columnChart', 'East chart')]),
    ...row(472, 224, [V('r4', 'pieChart', 'Segment chart'), V('r5', 'treemap', 'Category chart'), V('r6', 'funnel', 'Pipeline chart')])] });
  P.push({ id: 'detail', title: 'Detail', items: [
    { name: 'sFrom', type: 'slicer', label: 'Date slicer', b: { x: CM, y: 24, w: 300, h: 64 } },
    { name: 'sStore', type: 'slicer', label: 'Store slicer', b: { x: CM + 300 + CG, y: 24, w: 300, h: 64 } },
    ...row(112, 584, [V('mDetail', 'pivotTable', 'Store matrix')])] });
  P.push({ id: 'centred', title: 'Centred KPIs', items: [
    ...row(200, 160, [V('q1', 'card', 'Target card'), V('q2', 'card', 'Actual card'), V('q3', 'card', 'Gap card')], 160, W - 160),
    ...row(384, 240, [V('chQ', 'lineChart', 'Target and actual chart')], 160, W - 160)] });
  return P;
}

// ---- messy: each edge moved 3 to 20 px either way, one overlap,
// one off-page visual; a draw with an overlap other than the one asked for is drawn again (same seed stream) ----
function messy(page, rnd) {
  const j = () => (rnd() < 0.5 ? -1 : 1) * (3 + Math.floor(rnd() * 18));
  for (let t = 0; t < 500; t++) {
    // each edge on its own (a group only moves: its size places its visuals)
    const items = page.items.map((it) => { const b = Object.assign({}, it.b), l = j(), t = j(), r = it.type === 'group' ? l : j(), d = it.type === 'group' ? t : j(); b.x += l; b.y += t; b.w += r - l; b.h += d - t; return Object.assign({}, it, { b }); });
    if (page.overlap) { const k = items.findIndex((x) => x.name === page.overlap); items[k].b.x -= 40; }
    if (page.offPage) { const k = items.findIndex((x) => x.name === page.offPage); items[k].b.x += 80; }
    const bad = items.some((a, i) => items.some((b, k) => k > i && overlap(a.b, b.b) && !overlap(page.items[i].b, page.items[k].b) && !(page.overlap && [a.name, b.name].includes(page.overlap))));
    const off = items.some((x) => x.name !== page.offPage && (x.b.x < 0 || x.b.y < 0 || x.b.x + x.b.w > W || x.b.y + x.b.h > H));
    if (!bad && !off) return items;
  }
  throw new Error('no draw without a stray overlap');
}

// ---- the tidy rules: a pure function of the page and its top-level items ({ name, type, b, kids? }) ----
// N: edges within N of each other are one line (single linkage on sorted edges, a chain longer than 2N split at its
// widest step). 24 at a 720-high page (3 grid steps of 8; the grid's own closeness rule is 2 x 16 = 32,
// redesign-grid.mjs:57-62); distinct lines closer than N are not told apart. S: lines land on the 8 step.
const ok = (b) => b.x >= -1 && b.y >= -1 && b.x + b.w <= W + 1 && b.y + b.h <= H + 1;   // layout-check.js PAGE_SLACK 1
const med = (a) => { const s = a.slice().sort((x, y) => x - y), m = (s.length - 1) / 2; return s.length ? (s[Math.floor(m)] + s[Math.ceil(m)]) / 2 : 0; };
function clusters(vals, N) {
  const s = vals.slice().sort((a, b) => a.v - b.v), out = [];
  s.forEach((e) => { const c = out[out.length - 1]; if (c && e.v - c[c.length - 1].v <= N) c.push(e); else out.push([e]); });
  const split = (c) => { if (c.length < 2 || c[c.length - 1].v - c[0].v <= 2 * N) return [c]; let k = 1; for (let i = 1; i < c.length; i++) if (c[i].v - c[i - 1].v > c[k].v - c[k - 1].v) k = i; return split(c.slice(0, k)).concat(split(c.slice(k))); };
  return out.flatMap(split);
}
function rowsOf(list) {
  const rows = [];
  list.slice().sort((a, b) => a.b.y - b.b.y || a.b.x - b.b.x).forEach((v) => { const r = rows.find((q) => q.every((o) => Math.min(o.b.y + o.b.h, v.b.y + v.b.h) - Math.max(o.b.y, v.b.y) >= 0.6 * Math.max(o.b.h, v.b.h))); if (r) r.push(v); else rows.push([v]); });
  rows.forEach((r) => r.sort((a, b) => a.b.x - b.b.x));
  return rows;
}
// the gap samples of one page: between row neighbours, and between a visual and the nearest one above it, in the
// original (top-level, not laid on another); the report's gap G is their median over every page, on the 8 step: the
// author's spacing is kept, never the grid's 16
export function gapSamples(items, N) {
  const all = items.filter((x) => !DECOR.includes(x.type)), ov = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0) > 0.5;
  return rowsOf(all).flatMap((r) => r.slice(1).map((v, i) => v.b.x - r[i].b.x - r[i].b.w))
    .concat(all.map((B) => { const up = all.filter((A) => A !== B && ov(A.b.x, A.b.x + A.b.w, B.b.x, B.b.x + B.b.w) && A.b.y < B.b.y && A.b.y + A.b.h <= B.b.y + N); return up.length ? B.b.y - Math.max(...up.map((A) => A.b.y + A.b.h)) : null; }).filter((g) => g != null))
    .filter((g) => g > 0 && g <= 4 * N);
}
export function tidyPage(page, items0, opts) {
  const o = Object.assign({ groups: 'stay', decor: 'stay' }, opts);
  const u = page.h / 720, N = Math.round(24 * u), S = Math.max(1, Math.round(8 * u)), snapS = (v) => Math.round(v / S) * S;
  const items = items0.map((x) => Object.assign({}, x, { b: Object.assign({}, x.b), was: Object.assign({}, x.b) }));
  // (D4, redesign-grid.mjs unitsOf) a visual laid on another is one unit with it: it follows its lead
  const gi = items.filter((x) => x.type !== 'group').map((x) => ({ x, name: x.name, type: x.type, z: x.z || 0, b: x.b }));
  unitsOf(gi); gi.forEach((g) => { if (g.lead) g.x.lead = g.lead.x; });
  const native = (x) => x.type !== 'group' && !DECOR.includes(x.type);
  const isUnit = (x) => !x.lead && (native(x) || (x.type === 'group' && o.groups === 'unit'));
  const units = items.filter(isUnit), fixed = items.filter((x) => !x.lead && !isUnit(x)), all = units.concat(fixed);
  const sized = (x) => x.type !== 'group';            // a group is moved, never resized (ScaleMode would scale its text)
  const why = new Map();
  const ov = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0) > 0.5;
  // 0. the report's own gap G (gapSamples over every page, opts.G), or this page's
  const G = o.G || Math.max(S, snapS(med(gapSamples(items0, N)) || 16 * u));
  // 1. off the page: moved in on its own axis, inside the page's own margins (the smallest of what is on the page)
  const inPage = all.filter((x) => ok(x.b)), mL = Math.min(...inPage.map((x) => x.b.x)), mR = Math.min(...inPage.map((x) => W - x.b.x - x.b.w));
  const mT = Math.min(...inPage.map((x) => x.b.y)), mB = Math.min(...inPage.map((x) => H - x.b.y - x.b.h));
  units.filter((x) => !ok(x.b)).forEach((x) => {
    if (x.b.x < -1 || x.b.x + x.b.w > W + 1) x.b.x = Math.max(mL, Math.min(x.b.x, W - mR - x.b.w));
    if (x.b.y < -1 || x.b.y + x.b.h > H + 1) x.b.y = Math.max(mT, Math.min(x.b.y, H - mB - x.b.h));
    why.set(x, 'off the page: moved in');
  });
  // 2. edges within N on one line (what stays is an anchor: its line wins)
  const kinds = { left: (b) => b.x, right: (b) => b.x + b.w, top: (b) => b.y, bottom: (b) => b.y + b.h };
  const line = {};
  Object.entries(kinds).forEach(([k, f]) => {
    line[k] = new Map();
    // the page's margins of G are lines too (anchors): a visual near the page's edge lands G from it
    const edge = { left: G, right: W - G, top: G, bottom: H - G }[k];
    const es = units.map((x) => ({ x, v: f(x.b) })).concat(fixed.map((x) => ({ x, v: f(x.b), fixed: true })), [{ x: null, v: edge, fixed: true }]);
    clusters(es, N).forEach((c) => { const fx = c.filter((e) => e.fixed), t = fx.length ? med(fx.map((e) => e.v)) : snapS(med(c.map((e) => e.v))); c.forEach((e) => { if (!e.fixed) line[k].set(e.x, t); }); });
  });
  units.forEach((x) => {
    const L = line.left.get(x), T = line.top.get(x), R = line.right.get(x), B = line.bottom.get(x);
    if (!sized(x)) { x.b.x = L; x.b.y = T; return; }
    let w = R - L, h = B - T;
    if (TABLES.includes(x.type) && (w < x.b.w - 0.5 || h < x.b.h - 0.5)) { w = Math.max(w, x.b.w); h = Math.max(h, x.b.h); why.set(x, 'a table: never smaller (a scrollbar)'); }
    Object.assign(x.b, { x: L, y: T, w, h });
  });
  // 3. rows: same-kind visuals the same width, gaps of G, the row between its first left edge and last right edge; a
  // row with a gap wider than G + 2N (a space left on purpose) is not refitted, only an overlap in it is pushed apart
  const rows = rowsOf(units);
  rows.filter((r) => r.length > 1).forEach((r) => {
    const gaps = r.slice(1).map((v, i) => v.b.x - r[i].b.x - r[i].b.w), Lr = r[0].b.x, Rr = r[r.length - 1].b.x + r[r.length - 1].b.w;
    if (gaps.some((g) => g > G + 2 * N)) { r.slice(1).forEach((v, i) => { const g = v.b.x - r[i].b.x - r[i].b.w; if (g < 0) v.b.x = r[i].b.x + r[i].b.w + G; }); return; }
    const flexT = new Map(); r.filter(sized).forEach((v) => flexT.set(v.type, (flexT.get(v.type) || []).concat([v.b.w])));
    // same-kind visuals in the row: one top and one height (the kind's medians; a table never shorter)
    const kinds2 = new Map(); r.filter(sized).forEach((v) => kinds2.set(v.type, (kinds2.get(v.type) || []).concat([v])));
    kinds2.forEach((vs) => { if (vs.length < 2) return; const t = snapS(med(vs.map((v) => v.b.y))), bt = snapS(med(vs.map((v) => v.b.y + v.b.h))); vs.forEach((v) => { const nb = TABLES.includes(v.type) ? Math.max(bt, v.b.y + v.b.h) : bt; v.b.y = t; v.b.h = nb - t; }); });
    let want = r.map((v) => (sized(v) ? med(flexT.get(v.type)) : v.b.w));
    const fixedSet = new Set(r.filter((v) => !sized(v)));
    for (let pass = 0; pass < r.length; pass++) {
      const flexSum = r.reduce((a, v, i) => a + (fixedSet.has(v) ? 0 : want[i]), 0), fixSum = r.reduce((a, v, i) => a + (fixedSet.has(v) ? want[i] : 0), 0);
      const k = (Rr - Lr - (r.length - 1) * G - fixSum) / (flexSum || 1);
      const shrink = r.find((v, i) => !fixedSet.has(v) && TABLES.includes(v.type) && want[i] * k < v.b.w - 0.5);
      if (shrink) { fixedSet.add(shrink); want[r.indexOf(shrink)] = shrink.b.w; continue; }
      want = want.map((w, i) => (fixedSet.has(r[i]) ? w : w * k)); break;
    }
    let acc = Lr;
    r.forEach((v, i) => { const left = Math.round(acc), right = i === r.length - 1 && sized(v) ? Rr : Math.round(acc + want[i]); v.b.x = left; if (sized(v)) v.b.w = right - left; acc = left + v.b.w + G; });
  });
  // 4. neighbours not in one row (a side panel beside two rows): the right one's left edge G from its neighbour, its
  // right edge kept; then each visual's top G below the nearest one above it, its bottom kept (a table or a group moves
  // down instead, when the page has room)
  const rowOf = new Map(); rows.forEach((r, i) => r.forEach((v) => rowOf.set(v, i)));
  units.forEach((B) => {
    const left = all.filter((A) => A !== B && rowOf.get(A) !== rowOf.get(B) && ov(A.b.y, A.b.y + A.b.h, B.b.y, B.b.y + B.b.h) && A.b.x + A.b.w <= B.b.x + N && A.b.x < B.b.x);
    if (!left.length || !sized(B)) return; const A = left.reduce((p, q) => (q.b.x + q.b.w > p.b.x + p.b.w ? q : p)), g = B.b.x - A.b.x - A.b.w;
    if (g === G || g > G + 2 * N || g < -N) return;
    const R = B.b.x + B.b.w; B.b.x = A.b.x + A.b.w + G; B.b.w = R - B.b.x;
  });
  // (a row as one: its top G below the lowest bottom above any of its members)
  rows.slice().sort((p, q) => Math.min(...p.map((v) => v.b.y)) - Math.min(...q.map((v) => v.b.y))).forEach((r) => {
    const top = Math.min(...r.map((v) => v.b.y));
    const up = all.filter((A) => !r.includes(A) && r.some((B) => ov(A.b.x, A.b.x + A.b.w, B.b.x, B.b.x + B.b.w)) && A.b.y + A.b.h <= top + N && A.b.y < top);
    if (!up.length) return; const bottom = Math.max(...up.map((A) => A.b.y + A.b.h)), g = top - bottom;
    if (g === G || g > G + 2 * N || g < -N) return;
    r.forEach((B) => {
      if (!sized(B) || (TABLES.includes(B.type) && B.b.y > bottom + G)) { if (bottom + G + B.b.h <= H - mB) B.b.y = bottom + G; return; }
      const Bt = B.b.y + B.b.h; B.b.y = bottom + G; B.b.h = Bt - B.b.y;
    });
  });

  // 5. symmetry about the page's centre, where it nearly is: the block of what is on the page (left and right margins
  // within N of each other) is centred, unless what stays holds one of its sides; a row narrower than the block, its
  // centre within N of the page's, is centred. Not vertical: a page's title band at the top is not mirrored at its bottom
  const span = (l) => ({ L: Math.min(...l.map((x) => x.b.x)), R: Math.max(...l.map((x) => x.b.x + x.b.w)) });
  const blk = span(all), dl = blk.L, dr = W - blk.R, held = fixed.some((x) => Math.abs(x.b.x - blk.L) <= N || Math.abs(x.b.x + x.b.w - blk.R) <= N);
  if (dl !== dr && Math.abs(dl - dr) <= N && !held) { const d = Math.round((dr - dl) / 2); units.forEach((x) => { x.b.x += d; }); }
  rowsOf(units).forEach((r) => { const s = span(r), c = (s.L + s.R) / 2, b2 = span(all); if (s.R - s.L < b2.R - b2.L - 2 * N && Math.abs(c - W / 2) <= N && Math.abs(c - W / 2) >= 1) { const d = Math.round(W / 2 - c); r.forEach((x) => { x.b.x += d; }); } });
  // 6. a free text box or shape just above a unit (its bottom within G + N of the unit's top, over its width) is its
  // header: it moves with it, never off the page (B only); overlays follow their lead (D4)
  if (o.decor === 'attach') fixed.filter((x) => DECOR.includes(x.type)).forEach((d) => {
    const hs = units.filter((h) => h.was.y >= d.was.y + d.was.h - 1 && h.was.y - d.was.y - d.was.h <= G + N && ov(h.was.x, h.was.x + h.was.w, d.was.x, d.was.x + d.was.w));
    if (!hs.length) return; const h = hs.reduce((p, q) => (Math.abs(q.was.x - d.was.x) < Math.abs(p.was.x - d.was.x) ? q : p));
    d.b.x = Math.max(0, d.b.x + h.b.x - h.was.x); d.b.y = Math.max(0, d.b.y + h.b.y - h.was.y); d.attached = h; why.set(d, `a header: moves with ${h.label}`);
  });
  items.filter((x) => x.lead).forEach((x) => { x.b = follow(x.was, x.lead.was, x.lead.b); });
  // 7. never onto another: a pair that overlaps now and did not before, edges compared with 0.5 of tolerance
  // (redesign-grid.mjs overlap), puts the one that moved back (with what follows it); never off the page
  const top = items.filter((x) => !x.lead);
  const back = (x) => { x.b = Object.assign({}, x.was); items.filter((y) => y.lead === x || y.attached === x).forEach((y) => { y.b = Object.assign({}, y.was); }); };
  top.filter((x) => !ok(x.b)).forEach((x) => { back(x); why.set(x, 'kept: tidied it would leave the page'); });
  for (let n = 0; n < 50; n++) {
    let hit = null;
    for (let i = 0; i < top.length && !hit; i++) for (let k = i + 1; k < top.length && !hit; k++) if (overlap(top[i].b, top[k].b) && !overlap(top[i].was, top[k].was)) hit = [top[i], top[k]];
    if (!hit) break;
    const mv = hit.find((x) => JSON.stringify(x.b) !== JSON.stringify(x.was)) || hit[1];
    back(mv); why.set(mv, `kept: tidied it would lie on ${hit.find((x) => x !== mv).label}`);
  }
  return { items, G, N, why };
}

// ---- the redesign's grid (C), as redesign.mjs:267-282 calls it ----
function gridOf(page, items0) {
  const items = items0.map((x) => ({ x, v: x, name: x.name, type: x.type, z: x.z || 0, b: Object.assign({}, x.b), movable: x.type !== 'group' && !DECOR.includes(x.type) }));
  unitsOf(items.filter((x) => x.type !== 'group'));
  const g = gridPage({ w: W, h: H }, items);
  return items0.map((x, i) => Object.assign({}, x, { b: g.plan.get(items[i]) || x.b }));
}

// ---- the measures ----
function measure(items, was) {
  const tops = items.filter((x) => !x.lead && (x.type === 'group' || !DECOR.includes(x.type)));
  const r1 = (v) => Math.round(v);
  const lefts = new Set(tops.map((x) => r1(x.b.x))).size, topsN = new Set(tops.map((x) => r1(x.b.y))).size, rights = new Set(tops.map((x) => r1(x.b.x + x.b.w))).size;
  const gaps = rowsOf(tops).flatMap((r) => r.slice(1).map((v, i) => v.b.x - r[i].b.x - r[i].b.w));
  let ovl = 0; tops.forEach((a, i) => tops.forEach((b, k) => { if (k > i && overlap(a.b, b.b)) ovl++; }));
  const off = items.filter((x) => !x.lead && !ok(x.b)).length;
  const mv = (x, y) => Math.max(Math.abs(x.b.x - y.b.x), Math.abs(x.b.y - y.b.y), Math.abs(x.b.x + x.b.w - y.b.x - y.b.w), Math.abs(x.b.y + x.b.h - y.b.y - y.b.h));
  const moves = was ? items.map((x, i) => (ok(was[i].b) ? mv(x, was[i]) : 0)) : [0];
  return { lefts, tops: topsN, rights, spread: gaps.length ? r1(Math.max(...gaps) - Math.min(...gaps)) : 0, overlaps: ovl, off, maxMove: r1(Math.max(...moves)) };
}

// ---- PBIR ----
const VS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
const col = (p) => ({ field: { Column: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: p } }, queryRef: 'Sales.' + p, nativeQueryRef: p });
const mea = (p) => ({ field: { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: p } }, queryRef: 'Sales.' + p, nativeQueryRef: p });
function queryOf(t) {
  const cat = [col('Region')], val = [mea('Revenue')];
  const q = t === 'card' ? { Values: { projections: val } } : t === 'pivotTable' ? { Rows: { projections: cat }, Values: { projections: val } } : TABLES.includes(t) ? { Values: { projections: cat.concat(val) } } : t === 'slicer' ? { Values: { projections: cat } }
    : t === 'azureMap' ? { Category: { projections: cat }, Size: { projections: val } } : t === 'treemap' ? { Group: { projections: cat }, Values: { projections: val } }
      : t === 'scatterChart' ? { Category: { projections: cat }, X: { projections: [mea('Units')] }, Y: { projections: val } }
        : t === 'lineClusteredColumnComboChart' ? { Category: { projections: cat }, Y: { projections: val }, Y2: { projections: [mea('Units')] } } : { Category: { projections: cat }, Y: { projections: val } };
  return { queryState: q };
}
const L = (v) => ({ expr: { Literal: { Value: v } } });
function visualJson(x, z, parent) {
  const pos = { x: x.b.x, y: x.b.y, z, height: x.b.h, width: x.b.w, tabOrder: z };
  if (x.type === 'group') return { $schema: VS, name: x.name, position: pos, visualGroup: { displayName: x.label, groupMode: 'ScaleMode' } };
  const v = { visualType: x.type };
  if (!DECOR.includes(x.type)) v.query = queryOf(x.type);
  if (x.type === 'textbox') v.objects = { general: [{ properties: { paragraphs: [{ textRuns: [{ value: x.label }] }] } }] };
  if (x.type === 'shape') v.objects = { shape: [{ properties: { tileShape: L("'rectangle'") } }] };
  return Object.assign({ $schema: VS, name: x.name, position: pos, visual: v }, parent ? { parentGroupName: parent } : {});
}
const wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2)); };
const SCH = 'https://developer.microsoft.com/json-schemas/fabric/';
function writeReport(root, name, pages) {
  const R = path.join(root, name, 'B304.Report'), D = path.join(R, 'definition'), M = path.join(root, name, 'B304.SemanticModel');
  wr(path.join(root, name, 'B304.pbip'), { $schema: SCH + 'pbip/pbipProperties/1.0.0/schema.json', version: '1.0', artifacts: [{ report: { path: 'B304.Report' } }], settings: { enableAutoRecovery: true } });
  wr(path.join(M, 'definition.pbism'), { $schema: SCH + 'item/semanticModel/definitionProperties/1.0.0/schema.json', version: '4.0', settings: {} });
  wr(path.join(M, 'model.bim'), { compatibilityLevel: 1567, model: { culture: 'en-US', tables: [{ name: 'Sales',
    partitions: [{ name: 'Sales', mode: 'import', source: { type: 'm', expression: 'let Source = #table(type table [Region = text, Amount = number, Qty = number], {}) in Source' } }],
    columns: [{ name: 'Region', dataType: 'string', sourceColumn: 'Region' }, { name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }, { name: 'Qty', dataType: 'double', sourceColumn: 'Qty' }],
    measures: [{ name: 'Revenue', expression: 'SUM(Sales[Amount])' }, { name: 'Units', expression: 'SUM(Sales[Qty])' }] }] } });
  const plat = (type) => ({ $schema: SCH + 'gitIntegration/platformProperties/2.0.0/schema.json', metadata: { type, displayName: 'B304' }, config: { version: '2.0', logicalId: type === 'Report' ? '00000000-0000-4000-8000-000000000304' : '00000000-0000-4000-8000-000000000305' } });
  wr(path.join(R, '.platform'), plat('Report')); wr(path.join(M, '.platform'), plat('SemanticModel'));
  wr(path.join(R, 'definition.pbir'), { $schema: SCH + 'item/report/definitionProperties/2.0.0/schema.json', version: '4.0', datasetReference: { byPath: { path: '../B304.SemanticModel' } } });
  wr(path.join(D, 'version.json'), { $schema: SCH + 'item/report/definition/versionMetadata/1.0.0/schema.json', version: '2.0.0' });
  wr(path.join(D, 'report.json'), { $schema: SCH + 'item/report/definition/report/2.1.0/schema.json', themeCollection: {}, settings: { useStylableVisualContainerHeader: true } });
  wr(path.join(D, 'pages/pages.json'), { $schema: SCH + 'item/report/definition/pagesMetadata/1.0.0/schema.json', pageOrder: pages.map((p) => p.id), activePageName: pages[0].id });
  pages.forEach((p) => {
    wr(path.join(D, 'pages', p.id, 'page.json'), { $schema: SCH + 'item/report/definition/page/2.0.0/schema.json', name: p.id, displayName: p.title, displayOption: 'FitToPage', width: W, height: H });
    let z = 0;
    p.items.forEach((x) => { z += 1000; wr(path.join(D, 'pages', p.id, 'visuals', x.name, 'visual.json'), visualJson(x, z));
      (x.kids || []).forEach((k) => { z += 1000; wr(path.join(D, 'pages', p.id, 'visuals', k.name, 'visual.json'), visualJson(k, z, x.name)); }); });
  });
  return R;
}
const pageJsonOf = (p) => ({ name: p.id, width: W, height: H });
const visualsOf = (p) => { let z = 0; return p.items.flatMap((x) => { z += 1000; const a = [visualJson(x, z)]; (x.kids || []).forEach((k) => { z += 1000; a.push(visualJson(k, z, x.name)); }); return a; }); };

// ---- run ----
const rnd = prng(304);
const clean = cleanPages(), pages = clean.map((p) => Object.assign({}, p, { items: messy(p, rnd) }));
const G = Math.max(8, Math.round(med(pages.flatMap((p) => gapSamples(p.items, 24))) / 8) * 8);
const A = pages.map((p) => Object.assign({}, p, { t: tidyPage({ w: W, h: H }, p.items, { G, groups: 'stay', decor: 'stay' }) }));
const B = pages.map((p) => Object.assign({}, p, { t: tidyPage({ w: W, h: H }, p.items, { G, groups: 'unit', decor: 'attach' }) }));
const C = pages.map((p) => Object.assign({}, p, { items: gridOf(p, p.items) }));
const asPages = (T) => T.map((p) => Object.assign({}, p, { items: p.t ? p.t.items.map((x) => Object.assign({}, x)) : p.items }));
const rep = { clean, before: pages, A: asPages(A), B: asPages(B), C };

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'b304-'));
try {
  const provider = await getMetadataProvider(), val = {};
  for (const [k, ps] of Object.entries(rep)) {
    const R = writeReport(root, k, ps), s = await runReportValidation({ reportDir: R, defDir: path.join(R, 'definition'), provider, skipSchema: true });
    val[k] = { total: [s.errorCount, s.warningCount], per: {}, codes: new Set() };
    for (const [code, d] of Object.entries(s.diagnostics || {})) for (const it of (d.items || [])) {
      const m = /pages[\\/]([^\\/]+)[\\/]/.exec(String(it.file || '')), pid = m ? m[1] : '(report)';
      val[k].per[pid] = val[k].per[pid] || [0, 0]; val[k].per[pid][d.severity === 'error' ? 0 : 1]++; val[k].codes.add(`${code}(${d.severity})`);
    }
  }
  console.log(`N = ${A[0].t.N} px (edges within N are one line), lines on the 8 step; the report's gap G = ${G} (median of ${pages.flatMap((p) => gapSamples(p.items, 24)).length} gaps in the messy pages; clean: 24)`);
  console.log('\n## Before / after per page (top-level native visuals and groups; free text boxes and shapes not counted)');
  console.log('| page | layout | distinct left | distinct top | gap spread | overlaps | off-page | max move | validator err/warn |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  pages.forEach((p, i) => {
    const rowsOut = [['clean', clean[i].items, null], ['before', p.items, null], ['A', A[i].t.items, p.items], ['B', B[i].t.items, p.items], ['C grid', C[i].items, p.items]];
    rowsOut.forEach(([n, its, was]) => { const m = measure(its, was), key = n.split(' ')[0], v = (val[key] || val.clean).per[p.id] || [0, 0];
      console.log(`| ${p.id} | ${n} | ${m.lefts} | ${m.tops} | ${m.spread} | ${m.overlaps} | ${m.off} | ${was ? m.maxMove : '-'} | ${v[0]}/${v[1]} |`); });
  });
  Object.entries(val).forEach(([k, v]) => console.log(`validator ${k}: errors ${v.total[0]}, warnings ${v.total[1]}: ${[...v.codes].join(' ') || '-'}`));
  ['A', 'B'].forEach((k) => { const T = k === 'A' ? A : B; const ws = T.flatMap((p) => [...p.t.why.entries()].map(([x, w]) => `${p.id}/${x.label}: ${w}`)); console.log(`${k} notes: ${ws.join('; ') || '-'}`); });

  // the twin of B's tidied pages
  console.log('\n## The Arabic twin of B (report-mirror.js mirrorPage)');
  console.log('| page | top-level x\' = W - x - w (max error) | in-group x\' = gW - x - w (max error) | overlaps | distinct left after = right before | distinct right after = left before | distinct top |');
  console.log('|---|---|---|---|---|---|---|');
  rep.B.forEach((p) => {
    const vs = visualsOf(p), out = Mirror.mirrorPage(pageJsonOf(p), vs).visuals, by = new Map(vs.map((v) => [v.name, v]));
    let eTop = 0, eKid = 0;
    out.forEach((m) => { const v = by.get(m.name), gW = v.parentGroupName ? by.get(v.parentGroupName).position.width : W, e = Math.abs(m.position.x - (gW - v.position.x - v.position.width)); if (v.parentGroupName) eKid = Math.max(eKid, e); else eTop = Math.max(eTop, e); });
    const tops = (l) => l.filter((v) => !v.parentGroupName && (v.visualGroup || !DECOR.includes(v.visual.visualType))).map((v) => ({ b: { x: v.position.x, y: v.position.y, w: v.position.width, h: v.position.height } }));
    const t0 = tops(vs), t1 = tops(out), cnt = (l, f) => new Set(l.map((x) => Math.round(f(x.b)))).size;
    let ovl = 0; t1.forEach((a, i) => t1.forEach((b, k) => { if (k > i && overlap(a.b, b.b)) ovl++; }));
    console.log(`| ${p.id} | ${eTop.toFixed(2)} | ${eKid.toFixed(2)} | ${ovl} | ${cnt(t1, (b) => b.x)} = ${cnt(t0, (b) => b.x + b.w)} | ${cnt(t1, (b) => b.x + b.w)} = ${cnt(t0, (b) => b.x)} | ${cnt(t1, (b) => b.y)} = ${cnt(t0, (b) => b.y)} |`);
  });

  // the plan's move lines, one page
  const said = (p) => p.t.items.map((x, i) => { const a = p.items[i].b, b = x.b, f = [['x', 'x'], ['y', 'y'], ['w', 'width'], ['h', 'height']].filter(([k]) => Math.abs(a[k] - b[k]) >= 0.5).map(([k, n]) => `${n} ${Math.round(a[k])} -> ${Math.round(b[k])}`); return f.length ? `${x.label}: ${f.join(', ')}${p.t.why.get(x) ? ` (${p.t.why.get(x)})` : ''}` : `${x.label}: stays${p.t.why.get(x) ? ` (${p.t.why.get(x)})` : ''}`; });
  console.log('\n## The plan\'s lines, page "Sales overview", B');
  said(B[0]).forEach((s) => console.log("- " + s));
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
