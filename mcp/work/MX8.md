# MX8 (0.3.1): laptop part 13's two rules (a chart under a heatmap grid keeps its inside; the names table fits its box)

## Summary
- **Approval:** the reviewer's brief "MX8" (2 Nov), from laptop part 13 (rc.13, quoted in the brief): verdict NO, two
  general rules wrong, both on heatmaps; D-1027-12 (the twin identical), D-1101-04 (general rules), D-1102-02 (CI on the
  branch is the gate), D-1102-03 (Call Center's heatmap: the weekday width set once in English, names beside).
- **Base:** `fix/0.3.1-mx8` from `origin/integration/0.3.1` at a6000a27 (MX7 in). Push only this branch; never merge.
- **Scope:** 1 a chart lined up with a heatmap's grid (MX7's underGrids: every matrix with Rows and Columns, names beside
  or B1) keeps English's inside: its container padding, its value and category axis cards (axis side, time inversion)
  and its sort as English has them; only moved (MX7's offset). Named in movedByRule with why. 2 heatmapNames: the names
  table's blank header takes the matrix's column header outline (Call Center: none) and its values the row headers'
  outline; its box one row of the matrix's text taller than the matrix (same top, so its rows stay level with the
  grid's), kept inside its page; no scrollbars. Files: `assets/js/report-mirror.js` (heatmapNames; stamp),
  `mcp/lib/twin-pages.mjs` (underGrids; the page height to heatmapNames), new suite `mx8` (twin), `mcp/tests.json`,
  `mcp/CHANGELOG.md`.
- **Expected checks:** `mx8` about 18: G1-G10 (charts), N1-N8 (names). Red on a6000a27 first: G1-G3, G5-G7, G8, G9, N1,
  N3, N4, N6, N7 (about 13); guards G4 (a chart under no grid keeps the general mirror), G10, N2, N5, N8. Moving on
  purpose: mx7 H4 (the names table's height: the matrix's -> one row more), mx4/mx5 if they compare the names' height
  (said per check when run). twin-fuzz M1 must stay green (the chart already named). Others unchanged.
- **Got:** `mx8` 18 checks, red on a6000a27 first: 13 of 18 (G1, G2, G3, G5, G6, G7, G8, G9, N1, N3, N4, N6, N7; G2
  red too: the padding swap moved bar 23 by 20, not under 1 as I guessed); guards G4, G10, N2, N5, N8 green there.
  Moved on purpose: mx3 H1, mx7 H4 (the names table's height: the matrix's -> at least the matrix's, same top). mx4, mx5,
  mx1, mx2, twin-fuzz (M1 green: the charts were already named) unchanged. Areas, fx1, lint, CI: see State.
- **Areas on 9cce148:** twin 31, arabic 15, report 42 (glass-tables rerun after unshallowing the clone: its N0 reads
  cba24a5; 113 PASS), checker 7, core 8 suites passed; fx1 5 of 5 (22); lint 0; site config PASS.
- **Item 3 (the reviewer's follow-up, 2 Nov 21:34, the night lab's B2new on a6000a27):** the chart moved with its grid
  never lands on a visual or group it did not overlap in English (kept at its mirror, said); every mirrored page's new
  overlaps reach pictureChecks.newOverlaps. twin-fuzz 165 -> 185 (B2new-1, B2new-8, B2new-2 + N6-N10), red on a6000a27
  first: N6-N10 (5 of 185). The lab's replays (evidence/0.3.1-fuzz/fuzz.mjs; the night copy is not on a branch, its B2
  "new overlap introduced" is B2new): B2new-1, 6, 8, 9, 10, 11, 12 each 1 new overlap on this branch before the fix,
  0 after (left: P1, D1, lab-only, as on eb09d194).
- **Areas on fa20395b (item 3):** twin 31, arabic 15, report 42, checker 7, core 8 suites passed; fx1 5 of 5 (22); lint 0.
- **State:** item 3 in fa20395b; CI again next (CI 41530448902 was green on 8613eebe, before it).
- **Resume:** CI's result.

## Plan, per item
1. The pinned capabilities (powerbi-core-visual-schema through the validator's provider, 0.5.0): a column chart's inside
   that the general mirror changes: `visualContainerObjects.padding` (left/right swapped), `objects.valueAxis`
   (switchAxisPosition true), `objects.categoryAxis` (invertAxis true on a time axis), `query.sortDefinition` (turned, or
   Descending added). For a chart lined up with a heatmap's grid (MX7's test, unchanged), these four are written back as
   English has them (absent stays absent), before the labels are written (so an axis title still takes its Arabic).
   The legend and the title alignment keep the general rule (the legend is a named limit; a title is not on the grid).
   Edges, not centres: Call Center 52c8e333 (padding left 0, right 20 made up; x 557.5 w 310; grid left 581.39): bar k's
   left edge = plot left + k x plot width / 24; its offset from hour k's cell's left edge = English's for k 0 and 23.
   ER c1e3e190 under f2c68e52 (sort Ascending by hour): the twin's sort Ascending (was Descending: 23 under «00»).
2. tableEx capabilities: `columnHeaders` has no `show` (a table's header cannot be hidden) and no row height property:
   a row is the text (grid.textSize) and `grid.rowPadding`. So: the header blank, its outline the matrix's column
   header's (outlineStyle/Weight/Color when set: Call Center's 0, none; today the table's default bottom line), the
   values' outline the matrix's row headers' (the names stand for them); the box's height the matrix's plus one row of
   its text (ROW_LINE x pt + ROW_PAD + 2 x rowPadding set: 20.88 at 10pt, 22.76 at 11pt), clamped to its page or group
   bottom. Its rows keep the matrix's top and row height, so they stay level; the room below is for the few px Desktop
   draws more than the estimate (part 13), so no vertical scrollbar and so no horizontal one (the column stays the
   box's width).

## Before -> after, per item
1. Call Center 52c8e333 under 9d8cf758 (width-set copy; made-up chart padding left 0, right 20): padding 20/0 (swapped),
   valueAxis.switchAxisPosition true, a Descending sort added; bar 0's left edge -3.89 from hour 0's cell (English
   -23.89), bar 23's 11.98 (English -8.02) -> padding 0/20, value axis and sort as English (none), -23.89 and -8.02 (G1-G3).
   The unchanged English (B1): 34.17, 13.57 -> 14.17, -6.43 as English (G5, G6). ER c1e3e190 (sort Ascending):
   Descending -> Ascending, axis and padding as English (G7, G8). movedByRule: "kept lined up with its heatmap's grid,
   as English: its offset, padding, axis side and sort (the grid reads left to right)" (G9). A chart under no grid: the
   general mirror, as before (G4).
2. The names table (Call Center, 10pt): header outline the table's default (a line under it), values' none set, height
   188.33 = the matrix's -> header and values outlineStyle 0 (the matrix's column and row headers'), height 209.21
   (188.33 + one row 20.88), same top (N1, N3, N4); ER at 11pt +22.76 (N6); at a page's bottom kept inside (N7).

3. Night lab B2new-1: v8 (English x 149 w 577) moved to x 851 onto v15 (x 598 w 444) -> v8 at its mirror (x 1194 on the 1920 page; v15 at 598..1042),
   movedByRule "kept at its mirror, not lined up with its heatmap's grid: there it would cover v15, which it does not in
   English". B2new-8: v17 moved onto the group v5 (pageBoxes leaves groups out, so the guard adds group boxes) -> kept at
   its mirror, said. B2new-2 (an older overlap from the button fitting): pictureChecks absent -> newOverlaps "p0: v5, v6".

## Tests changed on purpose
- mx3 H1 and mx7 H4: the names table's height was checked equal to the matrix's; now the same top and at least the
  matrix's height (MX8 gives it one row more room below; its rows still start where the grid's do).

## CHANGELOG line
- **A fourth test run in Power BI Desktop:** a chart lined up under a heatmap's grid keeps its English padding, value
  axis and sort as well as its place, so each bar stands under its own hour, and the day names beside a heatmap get room
  for their last row, so no scrollbar covers them.

## Decisions I made
- The inside kept is four things, the ones the general mirror changes on a column, line or area chart: container
  padding, valueAxis, categoryAxis (its time inversion too) and the sort. The legend and the title alignment keep the
  general rule (the legend is a named limit; a title is not on the grid). The chart is named every time it is lined up,
  even when its box needs no move (its inside differs from the general mirror, so the plan says so).
- No header switch exists for a table (pinned capabilities: tableEx columnHeaders has outline, font, wordWrap,
  autoSizeColumnWidth, columnAdjustment, column widths; no show; no row height, only grid.rowPadding and textSize). So
  the header stays (blank) at the matrix's header height (same text size, and now the same outline), and the box gets
  one row of the matrix's text more room below (20.88 at 10pt), which covers "a few px" with a margin. A box that grows
  downward keeps every row level with the grid's (same top); the extra room is white below the grid's last row. Kept
  inside its page or group (clamped, not B1: a clamped box still has the room it had before).
- Item 3: a chart that would land on something new is kept at its plain mirror (padding, axis and sort the general rule's
  too: it is not lined up, so its inside need not match the grid), said in movedByRule (the field the plan already reads
  for this rule; no new plan field, the answer stays within its cap). A heatmap's names table counts as its matrix (the
  chart overlapped the matrix's box in English). Groups count as boxes, as the lab counts them.
- pictureChecks.newOverlaps now covers every mirrored page, not only pages drawn on a picture; only the plain "new" kind
  there (the rowHeaders and barsTurned kinds stay picture pages' own, as MP1c set them). twin-fuzz takes a third case,
  B2new-2 (an older overlap, on both heads), as the only fixture that shows a new overlap reaching the plan.
- The night lab's own fuzz.mjs (with B2new, D1n, X1) is not on either branch; I replayed with evidence/0.3.1-fuzz's,
  whose B2 "new overlap introduced" is the same test.
- CI: run 41524209043 passed everything but two macOS shards, cancelled while queued (no runner, no steps, no FAIL
  line); its one rerun ran shard 2 green, and shard 1 again sat queued until it was cancelled. No code change, so I started
  one fresh run on the same commit (41530448902): green on all three systems.
- The chart's padding in the fixture is made up (left 0, right 20): the real file's is not in the evidence branch (only
  its position); the check compares edges, so any one-sided padding shows the swap.

## For the owner
none

## Risky changes
- File writing: a chart lined up with a heatmap's grid now keeps English's padding, axis cards and sort (was mirrored);
  a heatmap's names table is one row taller than its matrix and takes the matrix's header outlines.
- What an answer returns: the movedByRule text for those charts is longer (visual names, no data values).

## For the laptop (part 14)
- Call Center p1 from the width-set copy: the hour chart 52c8e333's bars each under its own hour's cell (0 under «0»),
  value axis where English has it; «Mon».. «Sun» level with the grid's rows, no vertical or horizontal scrollbar in the
  names table, «Sun» whole.
- Call Center p1 from the unchanged English: the hour chart's bars under their hours as in English.
- ER p1: hour chart c1e3e190's hour 0 under «00», hour 23 under «23»; the names beside f2c68e52 with no scrollbar.

## Seen, not in scope
- The night lab's OLD B2new cases (2, 3, 4, 5, 7: the button fitting, twin-pages:36 and :463) still overlap; they now reach
  pictureChecks.newOverlaps (said), not fixed. X1-1..6 (a chart's category order against the grid) are what item 1 fixes
  for charts that move; not replayed (the night copy's X1 property is not on a branch).
- pictureChecks.newOverlaps (pageBoxes) leaves groups out, so a new overlap with a group is not said there.
- The names table's room below is white: over a visual drawn under the heatmap's bottom edge with a lower z it would
  cover its top 21 px (none on the six dashboards: Call Center's hour chart is drawn above it).
- Named limits from the brief stand (donut centre, AdventureWorks' 10th row, RepeatIQ p6's strip, agent cards, legend).

## Lessons for the reviewer
- MX7 moved the chart but checked only its box; a chart's bars sit in its plot area (box less its padding), so a check
  on "under its hours" must take the padding and the sort into account, edge by edge (mx8's edgeOff).
