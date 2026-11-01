# MX2 (0.3.1): every English-vs-Arabic difference of laptop part 8 left to this job

## Summary
- **Approval:** the reviewer's brief "MX2" (1 Nov, 06:46); the owner's D-1101-03 (every difference of part 8 fixed in
  0.3.1). Another builder (MP1e) has time direction, card order and alignment, buttons, Call Center's cards: not here.
- **Base:** `fix/0.3.1-mx2` from `origin/integration/0.3.1` (7c54e918), then merged, in order: `origin/fix/0.3.1-mr1`
  (clean), `origin/fix/0.3.1-mp1d` (conflict in `mcp/tests.json`: both suite lines kept, mr1 and mp1-shapes),
  `origin/fix/0.3.1-mx1` (conflicts in `mcp/tests.json` and `mcp/CHANGELOG.md`: both sides kept). On the merged base:
  mx1 41, mp1-shapes 10, mr1 26, mp1 100, mirror-parity 62, all PASS.
- **Scope:** (from the real shapes, `evidence/0.3.1-shapes` c9a151d9, read 1 Nov 08:50) 1 the flat-matrix rule
  (`report-mirror.js tableOf`): per-level total entries that show nothing (row subtotals off) no longer keep a matrix;
  the row headers' word wrap no longer keeps one (dropped, said); in the chosen flat form, blank rows are allowed (lost,
  said). 3 tables: a column the original hides (narrower than 10) stays hidden (`twin-pages.mjs fitHeaders` never
  widens it: the watchlist's «القسم» sliver); a table wider than its box whose every column has its own width keeps
  the English view (`twin-pages.mjs` new `keepView`: the columns English shows first, reversed, the key column at the
  box's right edge, the rest behind the scroll; no width changed); one without widths stays named (MX1 D). 2 legends:
  named in the plan (an estimate: Desktop has not measured a legend), with two items that would read the same said
  first; a lab page for the laptop to measure. 4 one plain plan line per kind met (`twin-plan.mjs`).
- **Expected checks:** a new suite `mx2` (area twin), about 24, red on the merged base first, fixtures made up in each
  real shape: M1-M9 the matrices (RepeatIQ p2 lifecycle and AW p1 top 10 already flat: guards; Fintech p3 tasks and
  milestones, RepeatIQ p4 pricing and p5 refund risk: now flat; Fintech p3 team and p1 delivery: offered flat, p1 with
  its blank rows; RepeatIQ p2 cohorts and p5-retention: kept, a Columns field); W1-W5 the tables (the watchlist's hidden
  column stays hidden; a converted wide matrix keeps its key column in view; a plain wide table too; the roadmap named;
  a guard that fits); L1-L4 the legends (Call Center's two items read the same: named first; Consumer Complaints'
  titles named; a legend that fits not named; the lab); N1-N5 one line each. mp1-shapes and MP1d's never-shrink guard
  stay green; mx1 41 may move where its fixtures meet the new rules (said per check).
- **Got:** `mx2` 26 checks, red on the merged base 7e885a2d first: 21 of 26 failed there (guards: M1, M2, M8, M10, W0).
  `mx1` D1 moved on purpose (below). mp1-shapes 10, mp1 100, mirror-parity 62 unchanged; lint 0; build:min.
- **State: DONE.** Areas twin + arabic + report: "run-tests: 80 suites passed". Full run on bccd67a8 (after it only
  this note): "run-tests: 132 suites passed". CI: run 41295149892 started.
- **Resume:** the reviewer's merge; the laptop's part 9 (below).

## What the code shows today (read on the merged base)
- Item 4, what the plan says now per kind (`report-mirror.js kindOf`, `twin-plan.mjs cannot`):
  decomposition tree (`decompositionTreeVisual`) and scatter (`scatterChart`): kind `other`, one cannot line for all
  of them ("other visuals (scatter and kinds without a proven setting): moved only"), the visual type in brackets;
  treemap and maps (`treemap`, `map`, `filledMap`, `azureMap`): kind `plain`, only in `mirrors` ("moved only: nothing
  in them has a side"), no cannot line; Power BI's own waterfall: `waterfallNative` / `waterfallKept`, said. Planned: one
  line per kind met, naming each visual (a treemap's tiles and a map do not mirror; a scatter keeps its axes; a
  decomposition tree grows left to right).
- Item 2: no fitting of a legend's text exists in `twin-pages.mjs` today (buttons, text boxes, headers, phone tabs only).
- Item 3: MX1's D names a wide table and never narrows it; the header fitting (`fitHeaders`) narrows only text
  columns to their own header's need. Planned: narrow a column only down to its header's need and only where the
  original's own width over that need is spare in its English too (no value cut by the twin that the English does not
  cut), else name it.

## Item 1: every matrix of part 8, from its real JSON (before -> after)
| Dashboard, page, visual | Shape | Before (MX1) | After |
|---|---|---|---|
| RepeatIQ p2 lifecycle funnel d0303bdd | 1 row field, no Columns | table | table (guard M1) |
| AdventureWorks p1 top 10 b3b78a11 | 1 row field | table | table (guard M2) |
| Fintech p3 task delivery 73b90b71 | 1 row field, per-level total entries, subtotals off | matrix | table (M3) |
| Fintech p3 milestones af02c108 | 1 row field, a total style entry, subtotals off | matrix | table (M4) |
| RepeatIQ p4 product pricing 05e58ec0 | 1 row field, row headers not wrapped | matrix | table (M5) |
| RepeatIQ p5 refund risk 9985523d | 1 row field, row headers not wrapped | matrix | table (M6) |
| Fintech p3 delivery team f8d48a75 | 2 row levels | matrix, offered | matrix, offered (guard M8) |
| Fintech p1 delivery matrix 59d86887 | 2 row levels, blank rows | matrix, not offered | matrix, offered (M9) |
| RepeatIQ p2 cohorts 129fc50e, retention 775ce346; Call Center heatmap 9d8cf758 | a Columns field | matrix | matrix, said (M10) |
Tables reversed correctly that need nothing: AdventureWorks customer detail 65eb6ebd (fits), Call Center 76aec421 (2
columns). Fintech p3's table 8ab90212 and the roadmap 35878e7f have no widths of their own: named if their Arabic
headers alone are wider than the box. RepeatIQ retention 19f5c974 (a width for each of its 3 columns, 429 in a 192 box) is the shape `keepView` takes: expected
to keep the English view (not in a test: the laptop checks it).

## Item 3: the tables
- Watchlist 66641c48: its first column (Department, 4 wide: hidden in English) came out «القسم» 16 wide at the right
  edge: the twin's row label over it took the 4 and the header fitting widened it -> a column narrower than 10 is never
  widened (W1).
- A table wider than its box with a width for every column keeps the English view (`keepView`, after the header
  fitting): the columns English shows first, reversed, its first column at the box's right edge, the rest behind the
  scroll; listed in the plan's `keptInView` (W3, W5). No width changes, no text cut.
- The roadmap (no widths: Desktop sizes its columns from the data, which the twin never reads): named, as MX1 D (W4).

## Item 2: the legends (named, an estimate)
The plan's `legends that may be cut`, items that would read the same first. Call Center p1's small legend donut
a28b4206: its own names "Answered"/"Unanswered" were approved as «المكالمات المجابة» / «المكالمات غير المجابة»; both
read «المكالمات ...» once cut (L1). Consumer Complaints p3: both titles (L2). The title's room (a quarter of the row) is
measured from part 8's two Desktop renders; an item's room is an estimate (Desktop has not measured a legend).

## Item 4: one line each (N1-N5)
decomposition trees, treemaps, Power BI's own waterfalls (waterfallRtl native), scatter charts, maps: each its own
cannot line naming each visual; "other visuals" now says "kinds without a proven setting" (no longer "scatter").

## Tests changed on purpose
- `mx1` D1: its made-up roadmap has a width for every column, so it keeps the English view (keptInView) instead of
  being named. `mx2` W2 and W3 were corrected while building (my own suite): the real task matrix's two extra widths
  are for fields no longer in it, so its table fits (its key column in view by the reversal alone); the key column is
  found as the reader sees it (the twin's row label over a hidden text column).

## CHANGELOG line
- **More of the Arabic twin like the English:** more matrices that are lists are written as tables, so their first column
  reads on the right; a column the English hides stays hidden; a table wider than its box shows the same columns as
  the English, its first column at the right; the plan names legends whose Arabic may be cut, and says on its own line
  what Power BI cannot mirror (decomposition trees, treemaps, its own waterfall, scatter charts, maps).

## Decisions I made
- The row headers' word wrap is dropped (the values keep theirs): a long row name then wraps as the values do.
- Per-level total entries under row subtotals off show nothing: they no longer keep a matrix.
- Written flat (C), the blank rows between groups are lost too, said.
- Legends: named, never resized or moved by the twin (no Desktop measure of an item's room); no lab page for them: part
  9's real dashboards give the measure (the plan's lines say where to look).
- The roadmap is not narrowed (no widths of its own: its values' widths are data).

## For the owner
- Call Center p1's legend: approve shorter Arabic for that donut's own names (as its English "Answered", "Unanswered").

## Risky changes
- `keepView` reorders a wide table's columns (no width changes): what reads first is what English shows first.

## For the laptop (part 9)
- RepeatIQ p2 lifecycle, p4 pricing, p5 refund risk; AdventureWorks p1 top 10; Fintech p3 tasks and milestones: tables,
  the first column at the right, nothing cut. Fintech p3 team and p1 delivery: matrices (offered flat in the plan).
- Fintech p1 watchlist: no sliver at the right edge; RepeatIQ retention table 19f5c974: the same columns in view as in
  English, its first at the right.
- Call Center p1 and Consumer Complaints p3 legends: named in the plan; with shorter Arabic, are they whole?

## Seen, not in scope
- MP1e's items (time direction, card order and alignment, buttons, Call Center's cards) not touched.
- A row legend's item room is not measured: a Desktop measure would let the twin fit it.

## Lessons for the reviewer
- Evidence in this repo (a branch) is readable here; the engine repo is not: brief evidence that way.
