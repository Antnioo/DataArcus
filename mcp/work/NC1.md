# NC1 (0.3.1, the owner's most important question of 26 Oct): the custom visuals lab

## Summary
- **Approval:** the owner, 26 Oct: "i have a report of 5 pages having custom visuals can dataarcus reads the report
  replaces all custom visuals with native ones and clean up the clutter"; he chose to prove it on the laptop run. The
  brief "Go on NC1". Builder; the reviewer reviews and merges.
- **Scope:** a lab and its suite only: `mcp/lab/custom-visuals-lab.mjs` (the report), `mcp/lab/custom-visuals-run.mjs`
  (the laptop's driver), `mcp/lab/CUSTOM-VISUALS-LAB.md` (the run sheet), `mcp/test-0.3.1-custom-visuals-lab.mjs` (one
  line in `mcp/tests.json`), this note. No product code changed (no test found a defect). BD1, CS1 (`redesign.mjs`, the
  formatting inventory) and GL1 (the glass look) run beside it: none of their files touched.
- **Base:** `feat/0.3.1-custom-visuals-lab` from `origin/integration/0.3.1` 0cbb017. Push only it; no merge, no PR.
- **Expected checks:** the new suite PASS (about 40 checks); 13 custom visuals, 11 replaced, 2 not replaced (the
  networks); validator 0 errors on the original, the native copy and the redesign; `npm test -- report` and the full
  run unchanged plus one suite; `check-result-lines`, `check-agent-memory` PASS.
- **Got:** custom-visuals-lab PASS 38 checks (one expectation flipped on purpose: 2 red, then restored); 11 replaced
  exactly as planned below, 2 not replaced; validator 0 errors, 0 warnings on all three reports; report: "run-tests: 30 suites passed (report)";
  full run "run-tests: 93 suites passed" (the base registry plus this suite); check-result-lines PASS 93; check-agent-memory PASS.
- **CS1:** not merged at 0cbb017: the lab's redesign is the grid redesign alone (said in the run sheet, with the step
  to add when CS1 lands).
- **Resume:** done; waits for the reviewer, then the laptop ("For the laptop" below).

## What the lab holds
`node lab/custom-visuals-lab.mjs <empty folder>` writes "Gulf Retail": a made-up model (Sales about 1,000 rows, 8
branches in 6 Gulf cities, 12 products, a daily Calendar 2025-01-01 to 2026-10-31, typed Power Query rows,
relationships; measures Total Sales, Sales LY, Sales Target, Sales Max in AED, Units Sold, Orders) and 5 pages at
1280x720 with 13 custom visuals (declared in `report.json` publicCustomVisuals, no package bytes), 10 native ones, a
text box and a shape per page, and the clutter (page 1's top row gaps 13, 21, 23 px; the Orders card 5 px low; titles
in 5 size and font pairs; page titles in 5 sizes and fonts). Validator: 0 errors, 0 warnings.

The plan on it (`plan_layout customVisualsFrom`, with the owner's sharedAxes answers "comparable"):

| Page | Custom visual (roles) | Became | Confidence |
|---|---|---|---|
| 1 | kpiTile (Indicator, TrendAxis date, Goal) | kpi | high, a guess |
| 1 | dialGauge (Value, TargetValue, Minimum, Maximum) | gauge | high, a guess |
| 1 | drillBarChart (Category: City, Branch; Values) | clusteredBarChart, 2 drill levels | high, a guess |
| 2 | chipSlicer (Category) | slicer | high, a guess |
| 2 | bulletChart (Category, Value, TargetValue) | clusteredBarChart, 2 bars per branch | low, a guess |
| 2 | dataGrid (Values: 2 columns, 2 measures) | tableEx | high, a guess |
| 3 | wordCloud (Category, Values) | clusteredBarChart | medium, a guess |
| 3 | tornadoChart (Category, Values x2) | clusteredBarChart, 2 bars per category | medium, a guess |
| 3 | multiInfoCard (Values x3) | cardVisual | high, a guess |
| 4 | calendarHeatmap (Date daily, Values) | lineChart over 669 days | medium, a guess |
| 4 | smoothLineChart (Axis month start, Values x2) | lineChart | high, a guess |
| 5 | sankeyDiagram (Source, Destination, Weight) | not replaced: a network, no native visual draws it | - |
| 5 | forceGraph (Source, Target, Weight) | not replaced: a network | - |

Without the sharedAxes answers the bullet, tornado and smooth line each become 2 charts side by side (one axis each)
and the plan asks; the suite checks both. The redesign of the native copy: 21 visuals moved or resized, 12 kept (5
text boxes, 5 shapes, the 2 networks); the Orders card back on its row (y 96 with the others); page 1's top row gaps
16, 16, 16.

## Decisions I made
1. Ids made up in AppSource's shape (a name and a 13-digit number), no vendor's id or name; role names as Microsoft's
   public visuals name them where I know them (sankey Source/Destination/Weight, force graph Source/Target/Weight,
   word cloud and chip slicer Category/Values, tornado Category/Values, bullet Category/Value/TargetValue), else
   plausible (KPI tile, dial gauge, data grid, calendar heatmap, smooth line, multi card).
2. The chip slicer holds only its Category (as most hand reports fill it): with a value it reads as a chart.
3. The report is named "Gulf Retail", not a longer name: the redesign's name is capped at 30 characters
   (`redesign.mjs` nameFor), and "Gulf Retail Review native" lost its "native" there (see Seen 6).
4. The sharedAxes answers (comparable for Total Sales with Sales Target and with Sales LY) are written in the driver
   (`SHARED_AXES`) as the owner's answer made before the run; the run sheet says so and how to see the split.
5. Unattended approval: the driver uses the tests' browser (`mcp/test-browser.mjs`) to click Approve on the local
   page, on the lab's made-up report only; `--click manual` keeps a person's click.
6. The suite runs the real chain (plan, approve, write, redesign plan, approve, write) through the server over
   stdio, plus the driver once, so the laptop's script cannot go stale unseen.

## For the laptop (the lab's run, step by step; in full: `mcp/lab/CUSTOM-VISUALS-LAB.md`)
1. Unzip the .mcpb under test; an empty work folder, e.g. `C:\DataArcus\tests\nc1`; work models closed.
2. From `mcp/`: `node lab/custom-visuals-run.mjs <unzipped>\server.mjs C:\DataArcus\tests\nc1` (plan -> approve ->
   "Gulf Retail native" -> redesign plan -> approve -> "Gulf Retail native redesigned"; `nc1-results.md` and `.json`).
3. `lab-tools\harness.ps1`: open the original, the native copy and the redesign in Desktop in turn, Refresh, screenshot
   every page at 100% (15 screenshots).
4. Fill the result table (per custom visual: what it became, confidence, what the plan said is lost, whether the native
   visual draws the same fields sensibly; the clutter before/after), then "Seen, not in scope".
   Expected in Desktop: the original's 13 custom visuals show "can't display this visual" (no packages: expected); the
   native copy draws 11 native visuals in their places, the 2 networks still "can't display"; the redesign as planned.

## Seen, not in scope
1. Bullet chart -> clustered bar of value and target as two bars (confidence low): the target marker is lost; a native
   bar with the target as an error bar or a constant line is not offered.
2. Word cloud -> clustered bar of 12 products: right fields, nothing of the cloud; said only as "its own look".
3. Calendar heatmap -> line chart of 669 daily points: the calendar grid is gone; a matrix (weekday by week, shaded
   by conditional formatting) would be closer; not offered.
4. Tornado -> clustered bar with two bars per category: the two-sided layout is lost and not named in `lost`.
5. Every replacement is "a guess" (no package, so no role definitions) yet 7 say confidence "high": the two read
   oddly together in the plan.
6. The redesign's name cap (30 characters, `redesign.mjs` nameFor) drops " native" from a long name: "Gulf Retail
   Review native" -> "Gulf Retail Review redesigned", which then collides with a redesign of the original (CS1's file).
7. The grid redesign leaves the vertical gaps uneven: page 1's rows touch (row 1 ends at y 248, row 2 starts at 248),
   others 8 to 24 px; the text boxes stay at x 24 while the grid's margin is 16 (CS1's file).
8. Title sizes and fonts stay mixed without CS1's consistent option (expected).
9. The `lost` lines say "its own format settings (1: labels)" for the bullet and tornado although their value labels
   are carried over (`format.valueLabels`): the line does not say which settings were kept.
