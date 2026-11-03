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
  grid). The plan's answer gets about 40 characters per fallback chart: fx1 run 3 times before and after (L-1102-06).
- **Got:** (after the work)
- **State:** plan pushed. **Resume:** the fix in underGrids.

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
  switchAxisPosition, categoryAxis invertAxis, a Descending sort -> none (as English); edges English + -31.34.
- Call Center shape `hours` (kept for `block`): padding 20/0 -> 0/20, switch/invert gone, Descending -> Ascending.
