## Summary
- **Approval:** the brief "HM2 (0.3.2)" (3 Nov), from laptop part 14 (B-298) and Codex's twin-fuzz-2 A1; D-1016-01,
  D-1102-02 (CI on the branch is the gate), D-1103-09 (one of the 0.3.2 builders).
- **Base:** `fix/0.3.2-hm2` from `origin/integration/0.3.2` at e2cf676. Push only this branch; never merge.
- **Scope:** a chart English lines up under a heatmap's grid keeps English's inside (sort, axis cards, padding: MX8's
  keepInside) in every branch, the kept-at-mirror fallback too; the fallback's movedByRule line says both. One file:
  `mcp/lib/twin-pages.mjs` (underGrids; the line is written there, not in twin-plan.mjs). New suite `hm2` (twin),
  fixture `mcp/fixtures/hm2/A1-1.json` (Codex's spec.json as it is, its `lab` block left out), `mcp/tests.json`,
  `mcp/CHANGELOG.md`. Not assets/, twin-write.mjs, twin-plan.mjs.
- **Expected checks:** `hm2` 12: A1-A6 (A1-1), C1-C6 (mx8's Call Center shape with a made-up shape where the lined-up
  chart would land). Red on e2cf676 first (measured): A2, A3, A4, C2, C3, C4 (6); guards A1, A5, A6, C1, C5, C6.
  Moving on purpose: none expected (twin-fuzz N7/N9 match /kept at its mirror/, still true; mx8 G4 is a chart under no
  grid). The plan's answer gets about 70 characters per fallback chart: fx1 run 3 times before and after (L-1102-06).
- **Got:** `hm2` 12 checks, red on e2cf676: 6 of 12 (A2, A3, A4, C2, C3, C4), as planned; green on f105a0f. No other
  test's number changed. fx1 3 of 3 before (22) and 3 of 3 after (22). twin-fuzz 185, mx8 18 unchanged.
- **Areas on f105a0f:** twin 32 suites passed (31 + hm2); lint 0; changelog-words PASS. Integration did not move (no merge).
- **State:** CI (below).
- **Resume:** the reviewer's merge; the laptop's next part (below).

## Plan
1. underGrids' fallback (`if (hit)`) calls keepInside(ce, ct) before it returns, as the moved branch does; the line:
   "kept at its mirror, its inside as English (sort, axis side, padding: the grid reads left to right), not lined up
   with its heatmap's grid: there it would cover X, which it does not in English".
2. Edges, never centres (L-1102-07): for every hour k, bar k's left and right edges (24 even slots of the box less its
   padding) against hour k's cell's (24 even cells of the grid: the box less padding and row-header strip; the twin's
   strip 1). Kept at its mirror, the chart stands a stated shift from the lined-up place (A1-1: -31.34 px; Call Center
   shape: 16.22 px); each edge offset = English's + shift, within 0.5 px. Before: A1-1 hour 0's left edge 642.5 px off
   (the Descending sort and inverted axis lay hour 0 at the far end), Call Center 290.25.
3. "## For the owner": how many of the twin-fuzz and Codex cases keep a chart at its mirror over an overlap under 3 px.

## Before -> after
- A1-1 v1 (under v0, kept at its mirror for v0Names): padding left {} -> right {} as English; valueAxis
  switchAxisPosition, categoryAxis invertAxis, a Descending sort -> none (as English); every edge English + -31.34.
- Call Center shape `hours` (kept for `block`): padding 20/0 -> 0/20, switch/invert gone, Descending -> Ascending;
  hour 0's left edge 290.25 off its cell -> -7.67 (English -23.89 + 16.22).

## CHANGELOG line
- **A chart under a heatmap that cannot move:** when lining it up under the heatmap's grid would cover another visual,
  it stays where the plain mirror puts it but keeps its English sort, value axis and padding, so its hours still read
  left to right like the grid above it.

## Decisions I made
- The "mx8 suite's fallback case": mx8 has none (the fallback's cases are twin-fuzz N6-N9, B2new-1/8, 1920 pages with
  no hour axis). So hm2 builds mx8's Call Center shape (same boxes, strip, padding) with a made-up 15-wide shape beside
  the chart in English (x 870) that the lined-up place would cover and the mirror does not: the fallback on that shape.
- The edge check states each case's shift (mirror less lined-up place) and compares every edge to English's plus it,
  within 0.5 px: kept at its mirror, a bar cannot sit at English's offset; what this job fixes is the order and the
  plot area (a reversed order is hundreds of px off). A6 and C6 pin the shifts (-31.34, 16.22).
- The plan line is written in twin-pages.mjs (r.moved), not twin-plan.mjs: HM1's file is untouched.
- A1-1's fixture is Codex's spec.json as it is (synthetic names, no data) without its `lab` block (the generator's
  settings, not a report).

## For the owner
- Whether to move the chart anyway when the overlap is a 2 px box edge (part 14's named limit): measured on the 40
  inputs the twin-fuzz suite runs plus Codex's 5 cases (9 lab fixtures, 25 seeds, 1 made-up, A1-1, F1-1, M1-1, N1-1,
  N1-25), with a temporary hook in landsOn (not committed): 7 charts kept at their mirror, the overlap that stops each
  (width x height of the boxes' meeting): B2new-1 71x66, B2new-8 38x330, A1-1 14.17x12.88, seed20261113 v11 5x105 and
  88x105 (two grids), v3 72x134, seed20261126 v17 79x14, v19 45x124. **None under 3 px** (the smallest side 5 px).
- Recommendation: no 3 px allowance now. No made-up case needs it, and with this job the kept chart reads in English's
  order anyway (only shifted, the shift said). If the laptop's Call Center still meets it (a 2 px edge on the real file),
  a test from that file's boxes decides it, as its own job.

## Risky changes
- File writing: a chart kept at its mirror under a heatmap's grid now keeps English's padding, axis cards and sort (was
  the general mirror's). What an answer returns: its movedByRule line is about 70 characters longer (no data values).

## For the laptop
- Call Center p1 (part 14's case, where the hour chart 52c8e333 is kept at its mirror): every bar under its own hour
  in English's order, hour 0 at the left, each bar off its own hour's cell by English's offset plus the box's shift
  from its lined-up place (no longer one hour off from a reversed sort); the value axis on English's side; movedByRule says "kept at its mirror, its inside as English".

## Seen, not in scope
- Codex's N1/M1 (twin-fuzz-2 M1-1, N1-25): the names table `v0Names` overwrites a visual of that name in the twin;
  the probe's M1 check fails on both (report-mirror.js:594, twin-write.mjs: HM1's files).
- Codex's F1 (rowPadding left out of the heatmap names' fit) and the B2 overlaps from other rules stand as reported.
- A kept chart's shift from its grid (A1-1: 31 px, one cell) is said in the plan only as "kept at its mirror".

## Lessons for the reviewer
- A fallback that returns early skips everything after it: MX8 put keepInside after the guard, so the guard's branch
  never got it. A rule that must hold "in every branch" goes before the branch, or in each.
