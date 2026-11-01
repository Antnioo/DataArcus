# MX1 (0.3.1): a matrix's row headers on the right in the Arabic twin

## Summary
- **Approval:** the reviewer's brief "MX1" (1 Nov). The owner: D-1029-03 (every page right to left), D-1027-12 (the twin
  identical), 1 Nov ("the days name it's on the left ... the patient id in page 2 in er still shows it on the left").
- **Base:** `fix/0.3.1-mx1` from `origin/integration/0.3.1` at 7c54e918. Push only this branch; never merge.
- **Scope:** A: `assets/js/report-mirror.js` (a flat matrix written as a table in the twin: `flatMatrix`,
  `matrixAsTable`, kind `matrixAsTable`), `mcp/lib/twin-plan.mjs` (the plan names each converted visual; a matrix kept
  says why), `mcp/lib/twin-preview.mjs` + `mcp/lib/approval-window.mjs` (the approval page names them), one line in
  `mcp/lib/twin-pages.mjs` (`staysLtr`: a converted matrix is a reversed table, not a left-to-right one).
  B: `mcp/lab/heatmap-names.mjs` (B1-B3 for the laptop) and the engine's `rowNamesBeside` builder (not wired to any path).
  Out: MR1's files (`tool-inputs.mjs`, `tools/*.mjs`, `model.mjs`), MP1d's (`aroundTables`, `badgesWithText`,
  `page-picture.mjs`).
- **Expected checks:** a new suite `mx1` (area twin), about 26 checks, red on 7c54e918 first: A1-A9 the ER shape
  (tableEx out; Values = Patient ID then the 8 values, reversed so Patient ID is last; every value kept with its
  queryRef, displayName, width, conditional colour and sort; header, value, grid and title styles carried; row
  subtotals off -> total off; labels kept through the twin's build; Patient ID at the right in the written twin);
  K1-K6 the shapes kept matrices (a Columns field; two Rows levels with subtotals; values on rows; a total row at the
  top; row headers with their own font size; blank rows shown), each with its why; P1-P4 the plan's and the approval
  page's text; B1-B4 the lab writes into an empty folder only, validator 0 errors, B1/B2/B3 as described.
  Other suites: `mirror-parity` and the M1 lab may move where they run a matrix with no Columns field through the
  twin (create_report's English matrix has none): each said per test below. Full run: the base's suites + 1.
- **State:** plan written; tests next.
- **Resume:** the tests red on 7c54e918, then the engine.

## The plan

### A. A flat matrix is written as a table (the default)
A matrix is flat when: one Rows field, no Columns field, values not on rows, no blank rows shown, no total row at the
top, no subtotal label of its own, no per-level total settings, its row headers not styled apart from its values in
what a table styles alike (font family, size, bold, italic, underline, word wrap), no row header setting per field,
no matrix-only card (annotationTemplate). Two or more Rows levels stay a matrix in this job: whether Desktop shows
them flat depends on its stepped layout, expand state and repeated headers, none measured (said in the plan).
The conversion (Microsoft's capabilities, `@microsoft/powerbi-core-visual-schema` 0.1.3 `data/capabilities.json`,
`pivotTable` vs `tableEx` objects compared property by property):
- `visualType` tableEx; `Values` = the Rows projection then the Values projections (each as it is, `active` dropped);
  `sortDefinition` kept; `expansionStates` dropped.
- `subTotals.rowSubtotals` -> `total.totals`; the style of `total`, `subTotals`, `rowTotal` (in that order, the last
  wins) -> `total`; `columnTotal` dropped (no Columns field).
- `rowHeaders` fontColor / backColor / alignment -> a `columnFormatting` entry for the Rows field (values only); its
  layout properties (stepped, indentation, expand buttons, frozen, repeat) dropped.
- matrix-only properties dropped: general.layout, columnHeaders.titleAlignment / urlIcon / customColumnWidthGranularView
  / expand buttons / autoExpand, values.bandedRowHeaders / valuesOnRow (false), total.applyToHeaders,
  columnFormatting.styleSubtotals, blankRows (off).
- everything else as it is (columnHeaders, values incl. conditional formatting, grid, columnWidth, columnFormatting,
  the container: title, background, border, shadow), then the table's own mirror (columns reversed, text right-aligned).
- the twin's own table steps follow as for any table (the labels by queryRef; `rowLabelTable` when its last column is text).
The plan's sentence: "written as a table so its first column reads on the right: Power BI's matrix has no
right-to-left setting"; each converted visual named (page/visual) in the plan's `mirrors` and on the approval page.

### B. A matrix with a Columns field (the heatmap): a lab only
`mcp/lab/heatmap-names.mjs`: a made-up model (calls by weekday and hour: 7 weekday rows, 10 hour columns, one measure,
a colour scale on its cells), two pages (1280x720, 1920x1080), each with B1 the twin today, B2 the matrix's row header
text the colour of its background, its row header column narrow (`columnWidth` with the Rows field's queryRef), and a
one-column table of the weekday at its right edge (same font, size, row padding; blank header so its rows start under
the matrix's header row: a table's header cannot be turned off, tableEx has no columnHeaders.show), B3 transposed
(hours as Rows, days as Columns sorted Descending). The twin's default for B is not changed. B2's builder is the
engine's `rowNamesBeside`; it is not wired behind an option in this job (it adds a visual to a page, and the twin's
build pairs visuals by index): wired after the laptop's yes.

## For the laptop
- ER p2 twin: Patient ID at the right, every column and header as in English reversed, nothing cut.
- The lab B1-B3 in Desktop at 1280 and 1920: does B2 line up row by row; how narrow the row header column gets.
