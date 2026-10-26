## Summary
- **Job:** NC1 (0.3.1, the owner, 26 Oct, his most important question: "i have a report of 5 pages having custom visuals
  can dataarcus reads the report replaces all custom visuals with native ones and clean up the clutter"). He chose to
  prove it on the laptop run. Builder; the reviewer reviews and merges.
- **Branch:** `feat/0.3.1-custom-visuals-lab` from `origin/integration/0.3.1` 0cbb017. Push only it; no merge, no PR.
- **Scope:** a lab and its test only: `mcp/lab/custom-visuals-lab.mjs`, `mcp/lab/CUSTOM-VISUALS-LAB.md`,
  `mcp/test-0.3.1-custom-visuals-lab.mjs` (one line in `mcp/tests.json`), this note. No product code change unless a
  test finds a real defect (then its own commit, failing test first, said here). Out: BD1, CS1 (`redesign.mjs`, the
  formatting inventory) and GL1 (the glass look) run beside this job: their files are not touched.
- **CS1:** not on `integration/0.3.1` at 0cbb017 (no consistent option in `plan_layout` redesignFrom): the laptop run
  uses the grid redesign alone (`restyle`), and says so; the run sheet names the CS1 step to add when it is merged.
- **Expected checks:** the new suite PASS (about 40 checks); `npm test -- report` unchanged; `npm test -- --keep-going`
  once (result line below); `scripts/check-result-lines.mjs`, `scripts/check-agent-memory.mjs` pass.
- **Resume point:** see "Status" at the end.

## Plan (written before the code)
### What the lab holds
A made-up Gulf retail project, "Gulf Retail Review" (no real company, no employer data), shaped like a hand-made report:
- Model (`model.bim`, typed Power Query rows): Sales (Date, Branch ID, Product ID, Units, Amount, Amount LY, Target),
  Branches (8: Branch ID, Branch, City, Country), Products (12: Product ID, Product, Category), Calendar (daily,
  2025-01-01 to 2026-10-31: Date, Year, Month, Month Number, Weekday, Weekday Number); relationships Sales to each.
  Measures: Total Sales, Sales LY, Sales Target, Sales Max (the gauge's scale), Units Sold, Orders.
- 5 pages, each mixing native visuals and custom visuals declared as a hand report declares them (report.json
  `publicCustomVisuals`; visual.json `visualType` the id), role names as the public visual names them where known,
  else plausible. Ids made up in AppSource's shape (a name and a 13-digit number): no vendor's id or name.

| Page | Custom visual (id word) | Roles filled | Expected native (from visual-meaning.mjs) |
|---|---|---|---|
| 1 Overview | kpiTile | Indicator, TrendAxis (date), Goal | KPI (kpi) |
| 1 Overview | dialGauge | Value, TargetValue, Minimum, Maximum (no category) | gauge |
| 1 Overview | drillBarChart | Category (City, Branch), Values | clustered bar, 2 drill levels |
| 2 Branches | chipSlicer (chiclet-like) | Category | slicer |
| 2 Branches | bulletChart | Category, Value, TargetValue | clustered bar of 2 values (the gauge hint set aside: weak) |
| 2 Branches | dataGrid | Values (2 columns, 2 measures) | table (tableEx) |
| 3 Products | wordCloud | Category, Values | clustered bar (weak: no cloud) |
| 3 Products | tornadoChart | Category, Values (2 measures) | clustered bar of 2 values |
| 3 Products | multiKpiCard | Values (3 measures) | card (cardVisual) |
| 4 Calendar | calendarHeatmap | Date (daily), Values | line chart over dates (weak: no calendar grid) |
| 4 Calendar | smoothLineChart | Axis (month start), Values (2 measures) | line chart |
| 5 Flows | sankeyDiagram | Source, Destination, Weight | not replaced (a network: no native visual) |
| 5 Flows | forceGraph | Source, Target, Weight | not replaced (a network) |

Expected: 13 custom visuals, 11 replaced, 2 not replaced. Natives beside them: card, line, column, donut, table,
matrix, slicer, a text box and a shape. The clutter: uneven gaps (8 to 31 px), one visual 5 px off its row, titles in 3
sizes and 3 fonts, a text box, a shape.
- No .pbiviz bytes: the original shows Desktop's "can't display this visual" on each custom visual (said in the run
  sheet); the checks are on the native copy and on the redesign.
- Microsoft's validator on the original: 0 errors expected apart from what it says about the custom visuals (counted
  and listed separately).

### The test (`test-0.3.1-custom-visuals-lab.mjs`, area report)
CL-1 the lab writes 5 pages, the 13 custom visuals declared and placed, the natives, the text box and shape, the
clutter; CL-2 the validator on the original (0 errors apart from the custom visuals'); CL-3 through the real server over
stdio: `plan_layout customVisualsFrom` lists 11 replacements with the expected native per visual and 2 not replaced
with why (no native visual: a network); each has its lost list; a planId; no field name in the lines; CL-4 the native
copy built from the plan (`nativeTree`, written to a temp folder) has no custom visual left but the two networks, and
the validator gives 0 errors on it apart from those; CL-5 the original is not changed by the plan.

## Status
- Plan committed and pushed; the work follows.
