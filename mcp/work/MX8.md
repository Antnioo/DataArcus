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
- **Got:** (filled after the work)
- **State:** plan pushed; work next.
- **Resume:** write `mcp/test-0.3.1-mx8.mjs`, see it red on a6000a27, then the code.

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

## Decisions I made
- (filled during the work)
