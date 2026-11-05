// (0.3.2 DD2O; the owner, D-1104-12: one job, one place) two boxes on a page, written once: before DD2O the tolerant yes
// or no was in twin-visuals.mjs `overlaps` and redesign-grid.mjs `overlap`, the shared area in twin-geometry.mjs
// `overlapOf` and page-picture.mjs `meets`, each pair answering the same (docs/CONTRACTS.md families overlap and
// overlap-area). Two questions, two functions: a 0.4 px overlap 100 px high is 40 px² of area and no overlap.
// A box is { x, y, width, height } (the twin's PBIR positions) or { x, y, w, h } (the redesign's and the picture's): the
// size is `width`/`height`, or `w`/`h` when `width`/`height` is undefined. Each caller reads the area against its own
// threshold, a named constant there. Pure: nothing kept, nothing read.
const wOf = (b) => (b.width !== undefined ? b.width : b.w), hOf = (b) => (b.height !== undefined ? b.height : b.h);
/** do a and b overlap by more than a rounding (half a pixel each way)? Touching edges and a 0.4 px sliver do not. */
export const overlaps = (a, b) => a.x < b.x + wOf(b) - 0.5 && b.x < a.x + wOf(a) - 0.5 && a.y < b.y + hOf(b) - 0.5 && b.y < a.y + hOf(a) - 0.5;
/** the area a and b share (0 when apart or touching). */
export const overlapArea = (a, b) => Math.max(0, Math.min(a.x + wOf(a), b.x + wOf(b)) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + hOf(a), b.y + hOf(b)) - Math.max(a.y, b.y));
