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
- **Got:** `mx7` 14 checks, red on eb09d194 first: 7 of 14 (H1, H2, H3, H6, C1, C3, C5), as planned; guards H4, H5,
  C2, C4, T1-T3 green there too. Moved on purpose (below): mx1 (its heatmap fixture), mx4 H1-H3, mx5 H2-H3. Unchanged:
  mx2, mx3, mx6's twin-fuzz 165 (M1, B1 green), fx1. Areas on f342e1f: twin 30, arabic
  15, report 42 (glass-tables rerun after unshallowing the clone: its N0 reads cba24a5), checker 7, core 8 suites passed;
  fx1 5 of 5 (22); lint 0; site config PASS.
- **State:** DONE. CI green: https://github.com/Antnioo/DataArcus/actions/runs/41480109784 on f342e1f4 (Linux,
  Windows, macOS). After f342e1f4 only this note changed.
- **Resume:** the reviewer's merge; laptop part 13 (below).

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

## Before -> after, per item
1. Call Center 9d8cf758 (width-set copy, strip 38.06, right padding 6): names table 37.06, no columnWidth, no word wrap
   setting (Desktop wrapped «Mon», rows grew, a scrollbar) -> 43.06 wide, `columnWidth` 43.06 for its field, values and
   columnHeaders `wordWrap` false, `autoSizeColumnWidth` false, grid textSize 10 and the matrix's rowPadding (3 when set;
   none when none); the matrix 274.44 with its left padding 6 -> 0, the grid 273.44 = English's (H1-H5). No padding
   beside the grid: B1, "its box has no room beside its grid for the names table's cell padding" (H6).
2. Hour chart 52c8e333: x 412.5 (its own mirror, 13.67 left of the twin's grid; English 23.89 left) -> 402.28, English's
   offset from the grid's left edge, width 310, inside the page, movedByRule "kept lined up with its heatmap's grid"
   (C1-C3). The unchanged English (strip not set, B1): the chart moves with the box, offset from box + padding kept
   (C5). A column chart under no grid: its exact mirror (C4).
3. RepeatIQ retention: no change. On eb09d194 the twin already writes [customer_id 0, Cohort 77.67, Row label 93,
   Orders 177 behind] (and the fitting shape [customer_id 0, ...]): the hidden column is first and counts 0 (T1-T3).

## Tests changed on purpose
- mx1: its weekday heatmap fixture gets 6 of right padding (Call Center's shape): with none it is B1 now (item 1).
- mx4 H1, mx5 (none): the grid measured less the twin matrix's left padding (that padding now goes to the names table);
  mx4 H2, mx5 H2: the names 6 wider; mx4 H3, mx5 H3: the hour chart's check is MX7's rule (English's offset from the
  grid's left edge, within 0.5) in place of the old centre against centre (which the old mirror passed).

## CHANGELOG line
- **A third test run in Power BI Desktop:** the day names beside a heatmap by weekday no longer wrap onto two lines, so
  they stay level with the grid's rows without a scrollbar of their own, and a chart lined up under a heatmap's grid
  stays under the same hours as in English.

## Decisions I made
- The table's extra room is 6 (`TABLE_PAD_MORE`): a table cell's padding is 5 to 6 a side (DESKTOP-TESTS "Item 3"),
  the matrix row header's is not measured (part 12: narrower). The names are data, so the twin cannot test whether
  they fit; it gives the room every time. Taken from the matrix's own padding beside its grid (English's right, the
  twin's left), so the grid keeps English's width; under 6 there: B1. Unset padding counts 0, as MX5's grid rule.
- Word wrap off on the header too (its text is blank, but a wrapped blank header would make its row taller).
- Item 2 covers every matrix with Rows and Columns, names beside or not (the grid is left to right in all); charts with
  a category axis only (a bar chart's categories run down, not under the hours).
- Item 3 left as it is: the brief's rule already holds (T1-T3 green on eb09d194, so not counted as red first).

## For the owner
- RepeatIQ retention 19f5c974: the hidden customer_id is already the first (leftmost) column in the twin. What shows
  in the 12 at the right, a few px wide with a sort arrow, is most likely the next column behind the scroll: «Orders in
  Target Month», the column the English table is sorted by (177 wide, after the names), which starts in the room left
  for a vertical scrollbar when the table has too few rows for one. Filling that room would cut the names whenever a
  scrollbar does show (MX5). Part 13 can tell which column it is (its header); a rule for it is a new job.

## Risky changes
- File writing: a heatmap's names table is 6 wider and its matrix's left padding 6 less; a heatmap with under 6 of
  padding beside its grid no longer gets names beside (B1, said); a chart lined up with a matrix's grid moves (named).
- What an answer returns: one new B1 reason, movedByRule entries (visual names, no data values).

## For the laptop (part 13)
- Call Center p1 from the width-set copy: «Mon».. «Sun» one line each, level with the grid's 7 rows, no scrollbar in the
  names table, no gap between grid and names; the hour chart 52c8e333's bars under their hours (0 under 0).
- Call Center p1 from the unchanged English: the heatmap as is (B1, said); the hour chart under the grid as in English.
- RepeatIQ p6 retention 19f5c974: which column shows in the 12 at the right of the names (its header text).

## Seen, not in scope
- The column behind a reversed table's scroll shows in the scrollbar's room when Desktop draws none (For the owner).
- MX5's Seen (a hidden English first column as a sliver after the names) and MX4's (fitHeaders' stale widths) stand.

## Lessons for the reviewer
- MX5's H3 checked the hour chart centre against centre, which a plain mirror passes; a check for "under its hours"
  must compare the chart to the grid's left edge (the bars do not reverse).
