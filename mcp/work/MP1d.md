# MP1d (0.3.1): laptop part 8's regression and its last three items

## Summary
- **Approval:** the reviewer's brief "MP1d" (1 Nov, 03:50), from laptop part 8 (rc.7; engine lab/rc031-part8 33ca845,
  business/beta/rc031-part8/RESULTS.md blocks B, C1, "Builder's list"; shots call-center-p1-heatmap-p7-vs-p8.png,
  call-center-p1-ratings-zoom-ar-p8.png, call-center-p1-kpi3-zoom-ar-p8.png). Verdict NO: MP1c's matrix rule narrowed
  visuals that only touch a matrix. The owner: D-1029-03, D-1027-12. Time matters: exactly this.
- **Base:** `fix/0.3.1-mp1d` from `origin/integration/0.3.1` at 7c54e918. Push only this branch. Stay out of MR1's
  files (mcp/lib/tool-inputs.mjs, mcp/tools/*.mjs, mcp/lib/model.mjs).
- **Scope:** `mcp/lib/twin-pages.mjs` (a, b, c), `mcp/lib/twin-texts.mjs` (d: rawLabels), `mcp/test-0.3.1-mp1.mjs`.
- **Expected checks:** (written before the work) `mp1` + about 8, red on 7c54e918 first except guards, made-up in the
  real shapes: MD-a1..a3 (the three visuals that only touch a matrix keep their English widths, mirrored: a column
  chart under the heatmap overlapping its bottom 9 px, a bar chart at the heatmap's left, a card behind a matrix of
  the same box; MC-b, ER's shape, still narrowed: a guard); MD-b (a bar chart over a 2-column table keeps its place
  and its bars' direction); MD-c1..c4 (4 KPI titles, tab-indented, their Arabic, an icon on the end their text runs to:
  each text box ends before its icon, 4 px clear); MD-d (a text run " vs PM" approved «شهريًا»: written « شهريًا»).
  Other suites: none expected to move (V1, R5-R7, MC-a still green). Full run: the base's 128 suites.
- **Got:** (after the work)
- **State:** plan pushed; the work next.
- **Resume:** the red checks, then the code.

## The plan
a. MP1c's matrix rule narrows only a visual in the matrix's side margin: its left edge in the matrix's right half, its
   right edge past the matrix's right edge, its overlap a strip (at most a third of its own width and a quarter of
   the matrix's) and most of its height (half or more) beside the matrix's rows. Never a visual that covers the matrix,
   lies under or behind it, or touches only its top or bottom edge.
b. "Stays left to right inside" for a table under a drawn-over bar chart: any column count (part 8 measured Desktop
   keeping a table's columns at its left edge in the twin too), as page-picture.mjs's check already decides it.
c. Where a small visual lies, after the mirror and the text fitting, on the end of a text box its text runs to (a
   right-aligned paragraph's right end), the text box ends 4 px before it: its width reduced on that side, the tabs
   no longer the only keep (an Arabic title wider than the English outgrew its tab stops).
d. A text box run whose English starts or ends with spaces keeps them around its approved Arabic (outside any wrap).

## For the laptop
- Re-run part 8's block C1: Call Center's heatmap row and Fintech's project card at their English widths; the ratings
  bars right of the stars as in English; «متوسط مدة المكالمة (بالثواني)» clear of its clock; «-8.80 % شهريًا».

## Lessons for the reviewer
