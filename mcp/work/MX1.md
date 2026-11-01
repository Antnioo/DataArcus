# MX1 (0.3.1): a matrix's row headers on the right in the Arabic twin

## Summary
- **Approval:** the reviewer's brief "MX1" (1 Nov) and its add-on C and D (1 Nov, 04:08, Fintech p1). The owner:
  D-1029-03 (every page right to left), D-1027-12 (the twin identical), 1 Nov ("the patient id in page 2 in er still
  shows it on the left"; "the days name it's on the left"; Fintech: "Same thing here").
- **Base:** `fix/0.3.1-mx1` from `origin/integration/0.3.1` at 7c54e918. Push only this branch; never merge.
- **Scope:** `assets/js/report-mirror.js` (`tableOf`, `flatMatrix`, `flatTable`, `rowLabelStyle`, `rowNamesBeside`;
  kinds `matrixAsTable`, `matrixFlattened`), `mcp/lib/twin-plan.mjs` (names, whys, the offer `matrixChoices`, the wide
  tables), `mcp/lib/twin-write.mjs` (`matrixAsTable` is the plan's), `mcp/lib/twin-preview.mjs` +
  `mcp/lib/approval-window.mjs` (the approval page), ONE line in `mcp/lib/twin-pages.mjs` (after `rowLabelTable`:
  `Mirror.rowLabelStyle(vj)`), `mcp/lab/heatmap-names.mjs`, `mcp/test-0.3.1-mx1.mjs`, `mcp/test-0.3.1-mirror-parity.mjs`.
  Not touched: MR1's files, MP1d's functions. The tool's `matrixAsTable` input is 3 lines for the reviewer (below).
- **Expected checks:** (written first) a new suite `mx1`, about 26 checks, then C and D about 8 more; `mirror-parity` may move.
- **Got:** `mx1` 41 checks (A1-A11, U1-U3, K1-K7, P1-P4, C1-C6, D1-D3, B1-B7), red on 7c54e918 first: 28 of the 35
  that run there failed (the lab's B2-B7 need the lab); guards passing there: A3-A8, K7. `mirror-parity` 63 -> 62 on
  purpose (below). Lint 0; build:min (report-mirror.min.js); changelog-words PASS.
- **State:** AREAS and FULL RUN below.
- **Resume:** the reviewer: the 3 tool lines after MR1; merge after MP1d; the laptop's part 9.

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

### C. A grouped matrix (Rows hierarchy, stepped, scrolls): written as a flat table only when the user picks it
(The reviewer's add-on of 1 Nov, 04:08, from the owner's Fintech p1 twin: "project delivery task matrix", Rows
Department then Project, 7 values, a vertical scrollbar.) Default: kept a matrix (A would lose the grouping; B2 cannot
follow a scroll), said in the plan with why. The plan offers a per-visual choice, `matrixAsTable: [visual ids]`
(`planTwin` reads it): the chosen matrix is written as a flat table, one column per Rows level (Department repeated on
each row, then Project), then the values, reversed by the table's mirror so the names read at the right; the plan says
what is lost: the +/- grouping and the group subtotal rows (the grand total stays as the matrix shows it). The engine:
`tableOf` with `{ levels: true }` (per-level subtotal settings dropped). The conversion is made on the twin's in-memory
copy of the English visual before mirroring (the plan and the write build the same; the copy's English page keeps the
file on disk, a matrix). Wiring: the tool's input (zod) and its pin are in `mcp/tools/create_arabic_twin.mjs`, MR1's file:
not touched here; the reviewer adds the two lines after MR1 merges (said in "For the reviewer").
Expected: C1-C5 in `mx1` red on 7c54e918 first (kept by default with the offer; chosen: a tableEx, Department then
Project last after the reversal, the 7 values reversed before them, the loss said; the copy's English page a matrix).

### D. A reversed table wider than its box: named in the plan
(Fintech p1 "project roadmap": a horizontal scrollbar, a Total row; after the reversal the English first column is cut
at the right edge, behind the scroll.) The plan sums each Arabic table's columns: its own column widths (columnWidth by
queryRef) or, without one, the Arabic header's width (report-rules.js headerNeed, never data) as a lower bound; the room
is the box less 36 (the scrollbar and margins, as fitHeaders counts it). Wider: named in the plan's cannot, "this table
is wider than its box: in Arabic its first column is reached by scrolling right". Not narrowed: how wide its values are
is data, which the twin never reads, so narrowing could cut them (no safe check); the lab's D2 (widths scaled to the box)
lets the laptop judge. Expected: D1-D3 in `mx1` red first (named when wider by its widths; by its headers alone; a table
that fits not named).

Lab page 3 (1280): C1 the grouped matrix as the twin writes it today, C2 written as the flat table; D1 the wide table as
the twin writes it, D2 its widths scaled to the box. `mx1`'s B4 then counts 3 pages (my own suite: said).

## For the laptop
- ER p2 twin: Patient ID at the right, every column and header as in English reversed, nothing cut.
- The lab B1-B3 in Desktop at 1280 and 1920: does B2 line up row by row; how narrow the row header column gets.
- Fintech p1 twin: the grouped matrix (C, kept a matrix by default) and the roadmap table (D) as written; the lab's C1-C2
  (does the flat table read as the matrix did, names at the right) and D1-D2 (D2: is any value cut).

## Before -> after
- ER p2 patient list (one Rows field, no Columns, 8 values): the twin reversed the values but kept Patient ID at the
  left (a matrix) -> written as a table, Patient ID the last column (at the right), every value, name, width, colour,
  sort, total and style carried; the plan and the approval page name it with the sentence.
- A heatmap (a Columns field): unchanged (row headers at the left), now said with why per visual in the plan.
- Fintech's grouped matrix: unchanged by default, now with the offer and what it loses; written flat when chosen.
- A reversed table wider than its box: nothing said -> named in the plan with its width and its box.

## Tests changed on purpose
- `test-0.3.1-mirror-parity.mjs` 63 -> 62: create_report's English matrix (one row field, no Columns) is now a table in
  the twins (INTENDED.matrixAsTable). `W matrix` (the writer's Arabic matrix against the twin's) and `W matrix order`
  replaced by one check, `W matrix as table` (a table at the writer's matrix's place, measures reversed before the row
  field); `W table` leaves that table out (the writer has a matrix there). A person's own heatmap `ownMatrix` (a Columns
  field) added to the English page so `S4` and `C matrix` still compare a matrix the twins keep.
- `mx1` B4: three pages (B at 1280 and 1920, page 3 for C and D): my own suite, after the add-on.

## For the reviewer: the tool's matrixAsTable (3 lines in `mcp/tools/create_arabic_twin.mjs`, MR1's file)
1. Input: `matrixAsTable: z.array(z.string().max(200)).max(200).optional().describe('Matrices to write as a flat table
   in the twin, by visual name (the plan lists them in matrixChoices): one column per row level, the names at the
   right; their +/- grouping and group subtotal rows are lost. Only with the user\'s go.'),`
2. The pin: `matrixAsTable: [...new Set((a.matrixAsTable || []).map(String))].sort(),`
3. The plan's data (the write rebuilds from it, `twin-write.mjs`; the approval page shows it): `matrixAsTable: pin.matrixAsTable,`
Until then `planTwin` honours `a.matrixAsTable` (the suite's C3-C5 call it), but an MCP call drops the unknown key.

## CHANGELOG line
- **A matrix's first column at the right in the Arabic twin:** a matrix with one row field and no column field (a list
  such as patients by ID) is written in the twin as a table, so its first column reads on the right, with its fields,
  names, widths, colours, sort, totals and styles; a matrix with a column field keeps its row headers at the left, as
  the plan says, because Power BI's matrix has no right-to-left setting.

## Decisions I made
- Two or more row levels stay a matrix by default (A): whether Desktop shows them flat (stepped layout, expand state,
  repeated headers) is not measured; the add-on's C makes flat a choice the user approves instead.
- Strict flatness: row headers with a font of their own (family, size, bold, italic, underline, wrap), values on rows,
  blank rows, a total at the top, a total label, per-field row header or per-level total settings keep the matrix,
  each said with why. The row headers' outline is dropped (a table has none per column): Seen.
- The row headers' colours go to the row field's column on its values only (styleHeader false: its header is a column
  header in the matrix too); the twin's "Row label" column takes them (`rowLabelStyle`, my one twin-pages line).
- `staysLtr` (inside MP1d's aroundTables area) not changed: a bar chart drawn over a converted matrix keeps MP1c's
  rule (its place and direction kept): Seen; my one twin-pages line went to the colours (more common in real reports).
- The approval page's list of converted matrices travels in the twin's preview data (`twinPreview` -> `asTables`): the
  tool's data object is MR1's file.
- B2 (row names beside) is a builder only, `rowNamesBeside`, not behind an option: it adds a visual to a page and the
  twin's build pairs visuals by index; wired after the laptop's yes. A table's header cannot be turned off (tableEx has
  no columnHeaders.show): B2's table has a blank header and the matrix's title height (its title text the background's
  colour), so its rows start under the matrix's header row.
- D: named, never narrowed: the values' widths are data, which the twin never reads; the lab's D2 (scaled) is a candidate.
  A column with no width counts its Arabic header's width (a lower bound): a table wide by its values alone is not seen.
- No `?v=` stamp: no website page loads report-mirror.js (the stamp check cannot compare in this shallow clone).

## For the owner
none (the choice for Fintech's grouped matrix is asked in the plan, per visual, once the tool line is in).

## Risky changes
- Every flat matrix in every twin is now a table (the default). The laptop's ER p2 proves the look; anything a table
  shows differently from that matrix (a theme style for matrices only, the row headers' outline) would show there.

## For the laptop (part 9)
- ER p2 twin: Patient ID at the right, every column and header as in English reversed, nothing cut.
- The lab (`node lab/heatmap-names.mjs <empty folder>`), pages 1 and 2: does B2 line up row by row at 1280 and 1920;
  how narrow the row header column gets (columnWidth 1); does any scroll.
- Fintech p1 twin: the grouped matrix (C, a matrix by default) and the roadmap table (D: named in the plan) as written;
  lab page 3: C1-C2 (the flat table reads as the matrix did, names at the right) and D1-D2 (D2: is any value cut).

## Seen, not in scope
- create_report's own Arabic matrix (lang "ar") keeps its row headers at the left: the same table form would fit (0.3.2).
- A bar chart over a converted matrix keeps its place and direction (`staysLtr`, MP1d's area): one line after MP1d.
- The Arabic lens (check_report) still says a flat matrix keeps its row headers at the left: true of the report as it
  is; it could add that the twin writes it as a table.
- A flat matrix's row header outline is dropped in the table.

## Lessons for the reviewer
- Plan data the write rebuilds from lives in the tool file: a new twin option always touches `tools/create_arabic_twin.mjs`
  (input, pin, data) besides lib; brief such an option with that file in scope, or after its owner merges.

