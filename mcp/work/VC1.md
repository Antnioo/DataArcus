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
- **Got:** (after the run)
- **Resume:** step 1 of the plan.

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
