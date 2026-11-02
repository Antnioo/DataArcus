# MX7 (0.3.1): laptop part 12's last rule (the heatmap's names table wraps) and two small ones

## Summary
- **Approval:** the reviewer's brief "MX7" (2 Nov), from laptop part 12 (rc.12, quoted in the brief): "No, but by one
  rule"; D-1027-12 (the twin identical), D-1101-04 (general rules), D-1102-02 (CI on the branch is the gate),
  D-1102-03 (Call Center's heatmap: the weekday width set once in English, the twin puts the names beside).
- **Base:** `fix/0.3.1-mx7` from `origin/integration/0.3.1` at eb09d194 (MX5, MX6 in). Push only this branch; never merge.
- **Scope:** 1 the heatmap's names table never wraps: its column set to its width, word wrap off (values, header), the
  matrix's text size and row padding, its rows the matrix's; the 6 a table cell's padding needs beyond the strip taken
  from the box's slack (the matrix's padding beside its grid), else B1 said. 2 a chart lined up under or over a
  heatmap's grid keeps English's offset from the grid's left edge (moved with the grid), named in movedByRule.
  3 the hidden column of 0 at the left end (see plan: it already is on eb09d194). Files: `assets/js/report-mirror.js`
  (heatmapBeside, heatmapNames; stamp), `mcp/lib/twin-pages.mjs` (a new step after the heatmap's names), new suite
  `mx7` (twin), `mcp/tests.json`, `mcp/CHANGELOG.md`.
- **Expected checks:** `mx7` about 14: H1-H6, C1-C5, T1-T3. Red on eb09d194 first: H1, H2, H3, H6, C1, C3, C5 (seen:
  7 of 11 written so far); H4, H5, C2, C4 guards; T1-T3 guards (green there, see item 3). Moving on purpose: mx5 H2
  (names 35 -> 41), mx4 H2 (the same rule), mx1's heatmap with no padding (B1 now, said), any twin-fuzz seed with a
  chart under a matrix (named in movedByRule, so M1 stays green). Others unchanged.
- **Got:** (after the work)
- **State:** plan pushed; the work next.
- **Resume:** the work, then the areas, fx1 x5, lint, CI on the branch.

## Plan, per item
1. Names table (Call Center 9d8cf758 from the width-set copy, strip 38.06, right padding 6): today 37.06 wide, no
   `columnWidth`, no word wrap setting: Desktop wraps «Mon». After: `columnWidth` for its field = its width, values and
   columnHeaders `wordWrap` false (both in the pinned tableEx capabilities), `autoSizeColumnWidth` false, grid's
   textSize and rowPadding as the matrix sets them (copied; none set: none, both Desktop's default). Width: the strip
   less 1 plus 6 (a table cell's padding is 5 to 6 a side, DESKTOP-TESTS "Item 3, the table"; the matrix row header's is
   narrower, laptop part 12; 6 is the room taken), from the matrix's padding beside its grid (6 -> 0): names 43.06, the
   matrix 274.44, the grid 273.44 = English's 317.5 - 6 - 38.06. Padding beside the grid under 6: B1, said.
2. Chart under a grid (52c8e333, English 557.5..867.5, grid left 543.33 + 38.06 = 581.39, offset -23.89): mirrored about
   its own box it lands at 412.5 (13.67 left of the twin's grid). After: x = the twin's grid left (matrix x + its left
   padding + its row header: 1 with names, English's strip if set, else 0 on both sides) + English's offset = 402.28;
   clamped to its page or group; named "kept under its heatmap's grid". Lined up: same parent, a chart with a category
   axis (column, line, area, combo, ribbon), its span shared with the matrix's box by 0.8 of the narrower, under
   (top below the matrix's middle, within 24 of its bottom) or over (the mirror of that). Every matrix with Rows and
   Columns (the grid keeps English's left-to-right order in all of them).
3. RepeatIQ retention 19f5c974 on eb09d194: the twin's columns are [customer_id 0, Cohort 77.67, Row label 93, Orders
   177 behind]: the hidden column is already first (left end) and counts 0 in both branches (T1-T3 guards). No change;
   what the laptop saw is said under "For the owner".
