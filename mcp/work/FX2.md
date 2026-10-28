# FX2 (0.3.1): the laptop part 3's finds in blocks A, C and H on 0.3.1-rc.2

## Summary
- **Approval:** the reviewer's brief "Go on FX2" (28 Oct); the owner, D-1027-03 (a title all Arabic or all English),
  D-1027-04 (an Arabic report's titles drafted in Arabic and approved), D-1027-12 (the twin identical), D-1027-13.
- **Base:** `fix/0.3.1-fx2` from `origin/integration/0.3.1` at 5690ea8 (SPD, P3A merged). Push only this branch.
  Not FX1's files (mcp/lib/twin-pages.mjs's Reset, the website Health Check page, approval-window.mjs's Arabic labels).
- **Scope:** H-1 (the twin's legend positions and every enum it swaps, against Microsoft's catalog), C23 (a bar chart
  over the table: the rail's reflow, and the exact check that let it pass), A-1 (Arabic titles of counted and summed
  columns on a model with no measures), C03 (the band above the focus chart beside the rail), C Seen 2 (TOOLS.md).
- **Expected checks:** (written before the work) a new suite `fx2`, about 25 checks, each red on 5690ea8 first:
  H (every legend position in, a catalog value out; the shadow presets; the alignments and icon values the mirror
  writes; Microsoft's validator 0 errors on a twin of a line chart at each legend position), C (C23's slots: no two
  data visuals overlap; the exact check blocks an overlap of two data visuals), A (no-measures, ar: the counted and
  summed columns are drafted, the plan gives no plan id until they are, their titles «عدد ...», «مجموع ...»), F (C03:
  the chart starts at the rail's top), T (TOOLS.md names the four options). `0.3.1-cx2` S1 and S5 change on purpose
  (Left/Right are not catalog presets: CenterLeft/CenterRight turn instead; said per check). Goldens, `0.2.9-layouts`,
  `0.3.1-ts1`-like layout suites: any page with a rail beside a row of two charts may change (said per test).
  Full run: the base's 114 suites + 1 (fx2) = 115.
- **Got:** (after the work)
- **State:** plan pushed; the work next.
- **Resume:** item 1 (H-1) first.

## The plan
1. **H-1** `assets/js/report-mirror.js` LEGEND: Microsoft's catalog (@microsoft/powerbi-core-visual-schema 0.1.3,
   every chart's `legend.position`) has Top (top left), TopCenter, TopRight, Bottom, BottomCenter, BottomRight, Left,
   LeftCenter, Right, RightCenter; no TopLeft or BottomLeft. Mirror: Top <-> TopRight, Bottom <-> BottomRight,
   Left <-> Right, LeftCenter <-> RightCenter; TopCenter, BottomCenter stay; a value outside the catalog is kept and
   said (the twin plan's kept list). SHADOW_SIDE: the catalog's dropShadow.preset has CenterLeft/CenterRight, not
   Left/Right: those turn instead. Every other value the mirror writes checked against the catalog in the test.
2. **C23** `assets/js/design-engine.js` fitSlots: the rail's reflow ends the slots beside the rail at its bottom and
   moves the slots under them up; the bar chart in the same row (not beside the rail) kept its height, so the table
   moved up under it. The fix: the whole row ends there (each keeping REFLOW_KEEP), else nothing moves. The check:
   `mcp/lib/artifact.mjs` blocks an OVERLAP of two data visuals (not a panel, not a card behind its own table).
3. **A-1** `tools/plan_layout.mjs`: the columns counted or summed (Bind.counts) are fields the Arabic plan names
   (suggested or proposeYourself, titlesInEnglish.fields, no plan id until drafted); `lib/report-run.mjs` named(): a
   counted or summed column with an approved name is «عدد <name>» / «مجموع <name>» (English: Count of / Sum of).
4. **C03** fitSlots' second branch (the chart under the rail): only when the band it leaves above it is no larger
   than the rail's column it fills; else the chart stays beside the rail, at its top.
5. **C Seen 2** `mcp/TOOLS.md`: flipCards, statusIcons, metricSwitcher, gallery: what each writes and its limits.
