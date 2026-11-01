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
- **Got:** `mp1` 97 checks (87 + 10: MD-a1..a3, b, c1..c4, d, O6; the estimate said about 8: c took 4), red on
  7c54e918 first: 9 of 97 failed there (MD-a1..a3, b, c1..c4, d); MC-b (ER's shape, still narrowed) and O6 guards.
  MD-a2 and a3 first passed on the old code: my first shapes were not the real ones (see Lessons); reshaped from the
  real cut widths, they reproduced the cuts at half size (3, 27, 1 against 6.67, 53.72, 0.92) before the fix. AREAS_LINE
- **State:** FULL_RUN_LINE
- **Resume:** none; the reviewer's merge.

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

## Decisions I made
- a: the margin rule without a z test: the three real shapes are excluded by geometry alone (the bottom-edge chart by
  its height beside the rows, the bar chart and the card by their overlap: 74 % and all of their width, not a strip),
  and ER's z against its matrix is not known here; a z test could have dropped ER's case.
- b: staysLtr is now any table (and a matrix) for the drawn-over bar chart rule; MP1c's matrix-margin rule stays
  matrix only (a table has no row headers).
- c: only an icon centred in the text box's last quarter on the side its text runs to (right-aligned paragraphs: the
  right), 1/3 of its width at most, lying half on it; a centred text box, or an icon at the other end (V1, R7), is left
  as it is. The text box keeps a width of 10 or more. Done after the text fitting, so the fitting can't undo it; the
  tabs are still moved (MP1c), now a second keep.
- d: the run's own spaces (or tabs) kept exactly, outside the V3 wrap; text box runs only (the brief's case).

## For the laptop
- Re-run part 8's block C1: Call Center's heatmap row and Fintech's project card at their English widths; the ratings
  bars right of the stars as in English; «متوسط مدة المكالمة (بالثواني)» clear of its clock; «-8.80 % شهريًا».

## Lessons for the reviewer
- Why MP1c's tests did not catch (a): MC-b tested only the shape the rule was made for (a margin chart), and no test
  put a visual that merely touches or covers a matrix next to it: the rule's condition (the overlap's centre in the
  matrix's right half in English, its left half in the twin) is also met by those. A narrowing or moving rule needs
  guards on the neighbours it must NOT touch, from the real report's other visuals near the same shape.
- The brief's word for a shape is not its geometry: "a bar chart at the heatmap's left" is at the left in the twin; in
  English it lies over the heatmap's right part. Working back from the measured cut widths (53.72, 0.92) gave the real
  geometry; my first made-up shapes passed on the old code and taught nothing.
