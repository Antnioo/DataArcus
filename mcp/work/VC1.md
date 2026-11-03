# VC1 (0.3.2): the twin says so when it turns a chart that holds a visual calculation (B-305, the safe half)

## Summary
- **Approval:** the owner's brief "VC1" (3 Nov; D-1103-10, one of up to 3 builders tonight), D-1027-12 ("i want the
  twin to be identical that is why it's called a twin"), D-1102-02 (CI on the branch is the gate). Earlier: RD2
  (`rd/0.3.2-number-check`, `mcp/research/RD2-number-check.md`, finding RD2-D2; read only).
- **Base:** `fix/0.3.2-vc1` from `origin/integration/0.3.2` at 71819c3. Push only this branch; never merge, no PR.
- **Scope:** the twin's plan names each visual it turns (its query's order changed by the mirror) that holds a
  visual calculation with RUNNINGSUM, MOVINGAVERAGE, PREVIOUS, NEXT, FIRST, LAST or RANK: page/visual by safe name,
  the functions counted by name, one EN and one AR sentence, the count. Detected by structure only: the expression's
  text is read in memory (strings, comments and [names] removed first) and never returned. Nothing else changes: the
  twin still turns the chart as today. Files: a new `mcp/lib/twin-calcs.mjs`, `mcp/lib/twin-plan.mjs` (one key in
  the answer), a new suite `mcp/test-0.3.2-vc1.mjs` (twin), `mcp/tests.json`, `mcp/CHANGELOG.md`, `mcp/WORK.md`.
  Not touched: the mirror, read-report, twin-pages, twin-text-fit, plan_layout, plan-*.
- **Expected checks:** `vc1` about 12 checks, red on 71819c3 first: P1-P4 (the plan names lineMonth and cardRank, by
  page, with their functions; the count 2; the EN and AR sentences) red; guards green on the base: G1 colRegion (turned,
  a plain measure) not named, G2 no canary literal in any answer (plan, write), G3 the twin's written files: the
  turned visuals' queries as the mirror makes them, every file the plan's build (twinTree) byte for byte, G4 the answer
  under 40,000 characters. Every other twin suite unchanged (no expected number moves); fx1 22 (3 runs).
- **Plan answer size (L-1102-06):** measured on twin-project and the vc1 shape, before and after (below): expected +0
  on a report with no visual calculation, about +450 characters on the vc1 shape.
- **Got:** `vc1` 11 checks, red on 71819c3 first: 4 of 11 (P1-P4); G1, G1b, G2, G3a-c, G4 green there. After: 11 of
  11. The written twin's digest a027c648b88ac031 on the base and after (byte-identical, .platform without its drawn
  logicalId). Plan answer: twin-project 15,847 -> 15,847 (+0); the vc1 shape 16,737 -> 17,536 (+799: the Arabic is
  escaped in the answer), under 40,000. No other suite's expected number moved. twin 34 of 34 suites, arabic 15 of 15, report 56 of 57 (glass-tables, on the base too: Seen); fx1 3 x 22; lint 0.
- **Resume:** CI on the branch (below), then the reviewer; the laptop (RD2-D2).

## The plan
1. Sources (below), the base numbers (answer sizes, fx1 x3, the twin's written bytes on the vc1 shape).
2. The test first (`vc1`), red on the base.
3. `twin-calcs.mjs`: `orderCalcsOf(json)` (function counts, by structure), `turnedBy(orig, mirrored)`.
4. twin-plan: `orderCalculations: { count, visuals: [{ visual, functions }], en, ar }` beside `cannot`, only when
   one or more; capped at 30 listed.
5. CHANGELOG line, WORK.md line, areas, lint, merge in once if moved, CI.

## Sources (read 2026-11-03)
- PBIR: a projection's field `NativeVisualCalculation { Language: "dax", Expression, Name, DataType? }`,
  `mcp/schemas/fabric/item/report/definition/semanticQuery/1.4.0/schema.json` (`QueryNativeVisualCalc`, referenced from
  `QueryExpressionContainer`); `@microsoft/powerbi-core-visual-schema` `data/capabilities.json` (`visualCalculationAxis`,
  `disallowedWithVisualCalculations`, `suppressVisualCalc`).
- Microsoft Learn "Visual calculations" (learn.microsoft.com/power-bi/transform-model/desktop-visual-calculations-overview):
  "Because visual calculations are part of the visual, they can refer to its structure"; templates Running sum
  (RUNNINGSUM), Moving average, Versus previous / next / first / last (PREVIOUS, NEXT, FIRST, LAST); Axis and Reset.
- DAX reference RUNNINGSUM (learn.microsoft.com/dax/runningsum-function-dax): `RUNNINGSUM(<column>[, <axis>][, <orderBy>]
  [, <blanks>][, <reset>])`; "If `orderBy` is not provided, the data is sorted by the grouping columns on the default
  `axis` in ascending order by default." MOVINGAVERAGE, PREVIOUS the same arguments; RANK (learn.microsoft.com/dax/rank-function-dax).
  So the running sum may follow the month's own order, not the visual's sort: that is what RD2-D2 settles in Desktop.

## What the plan says now (the vc1 shape)
`orderCalculations: { count: 2, visuals: [{ visual: "p1overview/lineMonth", functions: { RUNNINGSUM: 1 } },
{ visual: "p1overview/cardOrders", functions: { RANK: 1 } }], en: "2 visuals turned right to left; it holds ...",
ar: "...", sayInPlan }`, beside `cannot`; only when one or more (30 listed, the rest counted as `notListed`).
"Turned": the mirror changed the visual's query (a sort turned or added, values or a legend reversed) or its category
axis (invertAxis). A visual on a page kept left to right is not turned and not named.

## CHANGELOG line
- **The twin says when a turned chart holds a running calculation:** its plan names each visual it turns right to
  left that holds a running sum, moving average, previous, next, first, last or rank calculation, in English and
  Arabic, so its numbers can be checked against the original in Desktop; the twin itself is written as before.

## Decisions I made
- The function names are counted after DAX strings, comments, 'table' and [column] names are removed, so a literal
  or a name that says "RUNNINGSUM(" is no call (colRegion in the test). Only the seven names of the brief; a call
  needs its "(" (FIRST and LAST as the blanks argument are not calls).
- The fixture is RD2's shape built in os.tmpdir() from `mcp/fixtures/twin-project` at the test's start (as RD2's
  prototype did), not a new fixture folder: no file to keep LF, one source of the report.
- The card with RANK is a new card (cardVisual, its role Data) of two values: the mirror reverses its values (turned);
  an old card of one value is never turned, so it is never named.
- G3 compares the written files with the plan's own build (twinTree) and the digest before and after; .platform is
  compared without its logicalId (drawn per plan).
- The key is a new `orderCalculations` beside `cannot` (not inside `cannot`, which is "what cannot mirror"), so the
  answer says it once with its count. Not on the approval page (the brief: the plan).

## For the owner
none (the plan says more; what Desktop shows does not change).

## Risky changes
none (read-only addition to the plan's answer; the write path unchanged, byte-identical).

## Seen, not in scope
- OFFSET, INDEX, WINDOW, RANGE and ROWNUMBER in a visual calculation also follow the
  axis order; not in the brief's list, so not named.
- The approval window does not show `orderCalculations` (it shows what the plan's data carries for the twin).
- `glass-tables` (report area) fails locally on the base too: N0 needs commit cba24a5, absent from a shallow clone.
- Microsoft's RUNNINGSUM reference: "If orderBy is not provided, the data is sorted by the grouping columns on the
  default axis in ascending order": the running sum may not follow the sort at all (RD2-D2 decides).

## For the laptop
RD2-D2, the running sum turned (made-up model only: `mcp/fixtures/twin-project`):
1. Copy `mcp/fixtures/twin-project` to a folder of its own. Open `Twin Sales.pbip` in Desktop.
2. Page "Overview" (p1overview), visual lineMonth (Sales by Month): add a visual calculation `Running total =
   RUNNINGSUM([Total Sales])`; on cardOrders, change it to a new card and add `Order rank = RANK(DENSE, ROWS)`. Save.
3. Close Desktop. Make the twin through the MCP (create_arabic_twin, approve in DataArcus's window). Its plan must
   list both under `orderCalculations` (count 2).
4. Open the original and `Twin Sales AR.pbip` in turn. On lineMonth, note the "Running total" value of each month
   (hover, or Show as a table): January to December in the original, December to January in the twin.
5. Compare per month: the same running total per month (the sum follows the months' own order: the plan's line is
   then too careful, and the twin may keep it) or other totals (December alone in the twin: the twin must keep its
   order, a fix for the mirror, SP10's file). Same for cardOrders' rank. Write the 12 pairs, never the values of a
   real model.

## Lessons for the reviewer
- A new card's values sit in the role `Data`, not `Values`: a fixture with Values is never reversed by the mirror.
- The plan's answer escapes Arabic: an Arabic sentence costs about 6 characters a letter in the answer's size.
