// 0.3.2 SP19 (the split: B-280, B-286; mcp/work/SP19.md): the redesign's geometry and grid fitting, moved out of
// lib/redesign.mjs as they were (behaviour identical: test-0.3.2-sp19.mjs). Pure functions of the page's items: a page
// ({ w, h }) and its top-level visuals ({ v, name, type, z, b: the box, movable }) in, the units (each item's lead and
// overlays, set on the items by unitsOf) and the grid's positions out (gridPage: { plan, why, gap, margins }). No file
// is read or written here; the allowlist, the patches, the copy and its check stay in lib/redesign.mjs.
import { safeName, isCustom } from './read-report.mjs';
const TABLES = ['tableEx', 'pivotTable'];
const box = (v) => ({ x: Math.round(v.x * 10) / 10, y: Math.round(v.y * 10) / 10, w: Math.round(v.w * 10) / 10, h: Math.round(v.h * 10) / 10 });
const shownBox = (b) => ({ x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h) });
const overlap = (a, b) => a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;

// ---- 0.3.0 D4: a visual laid over another is one unit with it (the laptop's rc.1/rc.2 proof on the lab's "Dense Ops":
// the "No data" cards took slots of their own and stood beside their charts, which were squeezed). By geometry and
// z-order only (the report's own positions, never a text): v lies on c when v's box is inside c's (1 of tolerance), and
// the boxes are the same (any z: the writer's "No data" card is one layer below its chart, pbip-page.js) or v is smaller
// and above c. Same box: the data visual hosts (OVER kinds are the overlay), then the lower z, then the name. A visual's
// host is the smallest it lies on, followed to the outermost (the unit's lead). A text box, shape or image hosts only
// when at most one other visual (not one of DECOR) lies on it: a panel behind a chart is a unit, a backdrop or a frame
// behind several charts is not.
const TOL = 1;
const OVER = ['card', 'cardVisual', 'multiRowCard', 'textbox', 'shape', 'basicShape', 'image', 'actionButton'];
const DECOR = ['textbox', 'shape', 'basicShape', 'image'];
const inside = (a, c) => a.x >= c.x - TOL && a.y >= c.y - TOL && a.x + a.w <= c.x + c.w + TOL && a.y + a.h <= c.y + c.h + TOL;
const sameBox = (a, c) => Math.abs(a.x - c.x) <= TOL && Math.abs(a.y - c.y) <= TOL && Math.abs(a.x + a.w - c.x - c.w) <= TOL && Math.abs(a.y + a.h - c.y - c.h) <= TOL;
const rank = (it) => [OVER.includes(it.type) ? 1 : 0, it.z, it.name];
const precedes = (a, b) => { const x = rank(a), y = rank(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i]; return false; };
export function unitsOf(items) {
  const lies = (v, c) => v !== c && inside(v.b, c.b) && (sameBox(v.b, c.b) ? precedes(c, v) : c.z < v.z);
  const hosts = new Set(items.filter((c) => !DECOR.includes(c.type) || items.filter((v) => !DECOR.includes(v.type) && lies(v, c)).length <= 1));
  const hostOf = new Map();
  items.forEach((v) => {
    const cs = items.filter((c) => hosts.has(c) && lies(v, c)).sort((a, b) => a.b.w * a.b.h - b.b.w * b.b.h || (precedes(a, b) ? -1 : 1));
    if (cs.length) hostOf.set(v, cs[0]);
  });
  // (the order above has no cycle: a host is bigger, or the same box and before; the guard is for safety)
  items.forEach((v) => { let h = hostOf.get(v), n = 0; while (h && hostOf.has(h) && n++ < items.length) h = hostOf.get(h); if (h) v.lead = h; });
  items.forEach((v) => { v.overlays = items.filter((o) => o.lead === v); });
}
// an overlay's new box: an edge on its lead's edge stays on it; otherwise it keeps its size and its distance from the
// lead's nearer edge, inside the lead's new box
function follow(o, from, to) {
  const axis = (p, s, P, S, nP, nS) => {
    const a = p - P, e = P + S - (p + s), onA = Math.abs(a) <= TOL, onE = Math.abs(e) <= TOL;
    if (onA && onE) return [nP, nS];
    let w = Math.min(s, nS), q = onA ? nP : onE ? nP + nS - w : a <= e ? nP + a : nP + nS - e - w;
    q = Math.max(nP, Math.min(q, nP + nS - w));
    return [Math.round(q * 10) / 10, Math.round(w * 10) / 10];
  };
  const [x, w] = axis(o.x, o.w, from.x, from.w, to.x, to.w), [y, h] = axis(o.y, o.h, from.y, from.h, to.y, to.h);
  return { x, y, w, h };
}

// ---- the grid: each page's top-level native visuals in rows, on equal margins and gaps (the design engine's 720-tall
// grid: 16 between visuals and at the page's edges, 8 a step, in page units h/720), heights equal in a row, never
// smaller for a table (a shorter table draws a scrollbar: the laptop's PROOF-rc24 block 2 (d)), never a new overlap
// with anything that stays, never off the page. A row that can't be placed so keeps its place, and says why.
// (0.3.1 RD1: NC1's lab found rows touching, y 248 and 248, and gaps of 8 to 24: each row was placed on its own) The rows
// are placed top to bottom: a row sits 16 below what lies above it (a row placed before it, or a visual that stays: a
// text box, shape, image, custom visual, group, or a row that keeps its place) when it was within 32 of it, else on
// its own top (on the 8 step, never closer than 16); the same at its sides and, for a row with nothing below it, at the
// page's bottom (16 above it when it ended within 32). A row's height is its own (equal in the row), cut only at the
// page's bottom or above what stays below it. A row that fails (a table smaller, off the page, a new overlap) keeps
// its place and the page is placed again with it as one more visual that stays. When what stays keeps a row from the
// page's margin of 16, the plan says so (margins).
function gridPage(page, items) {
  const u = page.h / 720, M = Math.round(16 * u), G = Math.round(16 * u), S = Math.max(1, Math.round(8 * u));
  const snap = (v) => Math.round(v / S) * S;
  // (D4) a unit is one row member, placed by its lead's box; its overlays follow the lead and never take a slot
  const movable = items.filter((x) => x.movable && !x.lead).sort((a, b) => a.b.y - b.b.y || a.b.x - b.b.x);
  const withOverlays = (placed) => placed.concat(...placed.map(([v, b]) => (v.overlays || []).map((o) => [o, follow(o.b, v.b, b)])));
  // rows: a visual joins a row when it shares most of its height with every visual already in it
  const rows = [];
  movable.forEach((v) => {
    const row = rows.find((r) => r.every((o) => Math.min(o.b.y + o.b.h, v.b.y + v.b.h) - Math.max(o.b.y, v.b.y) >= 0.6 * Math.max(o.b.h, v.b.h)));
    if (row) row.push(v); else rows.push([v]);
  });
  rows.forEach((r) => r.sort((a, b) => a.b.x - b.b.x));
  const span = rows.map((r) => ({ left: Math.min(...r.map((v) => v.b.x)), right: Math.max(...r.map((v) => v.b.x + v.b.w)), top: Math.min(...r.map((v) => v.b.y)), bottom: Math.max(...r.map((v) => v.b.y + v.b.h)) }));
  const order = rows.map((r, i) => i).sort((i, j) => span[i].top - span[j].top || span[i].left - span[j].left);
  const members = rows.map((r) => r.concat(...r.map((v) => v.overlays || [])));
  const rowOf = new Map(); members.forEach((all, i) => all.forEach((v) => rowOf.set(v, i)));
  const xs = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5, ys = (a, b) => Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5;
  const edges = (b) => ({ left: b.x, right: b.x + b.w, top: b.y, bottom: b.y + b.h });
  const kept = new Set(), why = new Map();
  let plan = new Map(), margins = [];
  for (let pass = 0; pass <= rows.length; pass++) {
    plan = new Map(); margins = [];
    // what stays: every visual in no row (and not an overlay of a placed row), and the rows that keep their place
    const stays = items.filter((x) => !rowOf.has(x) || kept.has(rowOf.get(x)));
    const place = new Map(), failed = [];
    // the obstacles of row i: what stays, except what it already overlapped in the original (a backdrop behind it)
    const obstaclesOf = (i) => stays.filter((o) => !members[i].some((v) => overlap(v.b, o.b)));
    const said = (i, side, o, at) => margins.push(`the grid's margin of ${M} is not kept at the ${side} of ${rows[i].map((v) => safeName(v.name)).join(', ')}: ${safeName(o.name)} (${isCustom(o.type) ? 'a custom visual' : safeName(o.type)}) stays where it is ${side === 'top' ? 'above' : 'beside'} it, so the row keeps ${G} from it, ${Math.round(at)} from the page's edge`);
    order.filter((i) => !kept.has(i)).forEach((i) => {
      const s = span[i], obs = obstaclesOf(i).map((o) => [o, edges(o.b)]);
      // the sides: the page's margin, or 16 from what stays beside the row
      let L = s.left < 2 * M ? M : snap(s.left), R = s.right > page.w - 2 * M ? page.w - M : snap(s.right);
      obs.filter(([, e]) => ys(e, s) && e.right <= s.left + TOL).forEach(([o, e]) => { const want = s.left - e.right < 2 * G ? e.right + G : Math.max(L, e.right + G); if (want > L) { if (s.left < 2 * M) said(i, 'left', o, want); L = want; } else if (s.left - e.right < 2 * G) L = want; });
      obs.filter(([, e]) => ys(e, s) && e.left >= s.right - TOL).forEach(([o, e]) => { const want = e.left - s.right < 2 * G ? e.left - G : Math.min(R, e.left - G); if (want < R) { if (s.right > page.w - 2 * M) said(i, 'right', o, page.w - want); R = want; } else if (e.left - s.right < 2 * G) R = want; });
      const sx = { left: Math.min(L, s.left), right: Math.max(R, s.right) };
      // the top: 16 below what lies above (a row placed before it, by its new place; what stays), or the page's margin
      const above = obs.filter(([, e]) => xs(e, sx) && e.bottom <= s.top + TOL).map(([o, e]) => ({ o, was: e.bottom, now: e.bottom }))
        .concat([...place.entries()].filter(([j, p]) => span[j].top < s.top && xs({ left: p.L, right: p.R }, sx)).map(([j, p]) => ({ o: null, was: span[j].bottom, now: p.B })));
      let T = s.top < 2 * M ? M : snap(s.top);
      if (above.length) {
        // (what it sat close to sets its top; what was far above only keeps it 16 away)
        T = Math.max(...above.map((a) => a.now + G));
        if (!above.some((a) => s.top - a.was < 2 * G)) T = Math.max(T, snap(s.top));
        const first = above.find((a) => a.o && a.now + G === T);
        if (s.top < 2 * M && T > M && first) said(i, 'top', first.o, T);
      }
      // the bottom: its own height; 16 above what stays below it when it was within 32; the page's margin when nothing is below
      let B = T + (s.bottom - s.top);
      const below = obs.filter(([, e]) => xs(e, sx) && e.top >= s.bottom - TOL);
      const rowsBelow = order.some((j) => j !== i && !kept.has(j) && span[j].top > s.top && xs(span[j], sx));
      below.forEach(([, e]) => { B = e.top - s.bottom < 2 * G ? e.top - G : Math.min(B, e.top - G); });
      if (!below.length && !rowsBelow) B = page.h - s.bottom < 2 * M ? page.h - M : Math.min(B, page.h - M);
      else if (!below.length) B = Math.min(B, page.h - M);
      place.set(i, { L, R, T, B });
      const sum = rows[i].reduce((a, v) => a + v.b.w, 0), avail = R - L - (rows[i].length - 1) * G;
      let x = L; const leads = rows[i].map((v, k) => { const w = k === rows[i].length - 1 ? R - x : Math.round(avail * v.b.w / sum); const b = { x, y: T, w, h: B - T }; x += w + G; return [v, b]; });
      const placed = withOverlays(leads);
      const tableSmaller = placed.find(([v, b]) => TABLES.includes(v.type) && (b.w < v.b.w - 0.01 || b.h < v.b.h - 0.01));
      const off = placed.find(([, b]) => b.x < 0 || b.y < 0 || b.w < 8 || b.h < 8 || b.x + b.w > page.w + 0.01 || b.y + b.h > page.h + 0.01);
      if (tableSmaller) failed.push([i, `its row keeps its place: ${safeName(tableSmaller[0].name)} (a table) would get smaller and could draw a scrollbar`]);
      else if (off) failed.push([i, 'its row keeps its place: on the grid it would leave the page']);
      else placed.forEach(([v, b]) => plan.set(v, b));
    });
    // never a new overlap: a row whose place overlaps anything it did not overlap before keeps its place
    if (!failed.length) {
      const at = (v) => plan.get(v) || v.b;
      for (let a = 0; a < items.length && !failed.length; a++) for (let b = a + 1; b < items.length && !failed.length; b++) {
        const p = items[a], q = items[b];
        if ((plan.has(p) || plan.has(q)) && overlap(at(p), at(q)) && !overlap(p.b, q.b)) { const mv = plan.has(p) ? p : q, other = mv === p ? q : p; failed.push([rowOf.get(mv), `its row keeps its place: on the grid it would overlap ${safeName(other.name)}`]); }
      }
    }
    if (!failed.length) break;
    // one row at a time (the first in the page's order), then the page again; after 20 passes every row that fails at
    // once (a page of many rows stays quick)
    failed.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
    (pass < 20 ? failed.slice(0, 1) : failed).forEach(([i, w]) => { kept.add(i); members[i].forEach((v) => why.set(v, w)); });
  }
  kept.forEach((i) => members[i].forEach((v) => plan.delete(v)));
  return { plan, why, gap: G, margins };
}
export { TABLES, box, shownBox, overlap, TOL, inside, sameBox, precedes, follow, gridPage };
