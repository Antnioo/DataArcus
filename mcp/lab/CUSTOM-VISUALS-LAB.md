# The custom visuals lab (NC1, 0.3.1): the laptop's run sheet

The owner, 26 Oct: "i have a report of 5 pages having custom visuals can dataarcus reads the report replaces all custom
visuals with native ones and clean up the clutter". This lab is that report, made up, and this sheet is its run on the
laptop, unattended up to the screenshots. The plan, decisions and expected results are in [mcp/work/NC1.md](../work/NC1.md).

## What the lab holds
`node lab/custom-visuals-lab.mjs <empty folder>` (from `mcp/`) writes **Gulf Retail** (`Gulf Retail.pbip`): a made-up
Gulf retail model (Sales, Branches, Products, Calendar as typed Power Query rows; 8 branches in 6 Gulf cities, 12
products, every day from 1 Jan 2025 to 31 Oct 2026) and a 5-page report shaped like a hand-made one. No employer data,
no real company. `--list` prints the custom visuals table.

| Page | Custom visuals (13, declared in `report.json` publicCustomVisuals) | Native visuals beside them |
|---|---|---|
| 1 Overview | KPI tile, dial gauge, drill-down bar chart | 2 cards, a line chart |
| 2 Branches | chip slicer, bullet chart, data grid | a column chart, a slicer |
| 3 Products | word cloud, tornado chart, multi-value card | a donut, a table |
| 4 Calendar | calendar heatmap, smooth line chart | a column chart, a slicer |
| 5 Flows | sankey diagram, force graph (networks: no native visual) | a matrix |

Each page also has a text box (its title, in a different size and font per page) and a shape (a band under it). The
clutter: uneven gaps (8 to 31 px), the Orders card 5 px below its row, visual titles in 5 size and font pairs.

**No custom visual package is in the lab.** AppSource packages (.pbiviz) are not ours to ship, so the ids are made up in
AppSource's shape and **the original shows Desktop's "can't display this visual" on all 13 custom visuals**: that is
expected. The checks are on the native copy and on the redesign.

## Before the run
- The plan asks whether two AED measures may share one axis (bullet: Total Sales and Sales Target; tornado and smooth
  line: Total Sales and Sales LY). Without an answer each of those three becomes two charts side by side. The driver
  answers **comparable** for both pairs (`SHARED_AXES` in `lab/custom-visuals-run.mjs`): that is the owner's answer,
  made here before the run; change it there to see the split.
- CS1 (the redesign's consistent option: one title size and font) is **not merged** at this lab's base: the redesign
  step is the grid redesign alone (positions and sizes). When CS1 is merged, add its option to the
  `plan_layout redesignFrom` and `create_report` calls in `custom-visuals-run.mjs` and rerun from step 2.

## The run (unattended up to Desktop)
1. Unzip the `.mcpb` under test as usual (its `server.mjs`). Pick an empty work folder under `C:\DataArcus` (for
   example `C:\DataArcus\tests\nc1`). Keep work models closed.
2. From the repo's `mcp/`: `node lab/custom-visuals-run.mjs <unzipped>\server.mjs C:\DataArcus\tests\nc1`.
   It writes the lab into `nc1\lab`, then through that server over stdio (as rc031's `tools\driver.mjs` does):
   `plan_layout` customVisualsFrom -> `approve_plan` (the tests' browser, `mcp/test-browser.mjs`, clicks Approve on
   the local page; `--click manual` opens the system browser for a person's click instead) -> `create_report`
   ("Gulf Retail native"); then `plan_layout` redesignFrom on the native copy -> `approve_plan` -> `create_report`
   ("Gulf Retail native redesigned"). It prints the two reports and writes `nc1\nc1-results.json` (every call and
   answer) and `nc1\nc1-results.md` (the result table, the plan's columns filled, the validator's counts).
3. With `lab-tools\harness.ps1` (the laptop's, as in earlier runs): open each of the three .pbip files in Desktop in
   turn (`Gulf Retail.pbip`, `Gulf Retail native.pbip`, `Gulf Retail native redesigned.pbip`), Refresh, and screenshot
   every page at 100% (5 pages x 3 reports = 15 screenshots). Close Desktop between reports.
4. Fill the table below (and `nc1-results.md`'s Desktop columns) from full-size crops; list everything visibly wrong
   under "Seen, not in scope".

## What to judge
- **Original:** opens; each custom visual shows "can't display this visual" (expected, no packages); the natives draw.
- **Native copy, per custom visual:** what it became, the plan's confidence, what the plan said is lost, and whether
  the native visual draws the same fields sensibly (the right category, the values, a sensible scale; drill buttons
  on the drill bar; the KPI's trend and goal; the gauge's target). The two networks stay "can't display": expected.
- **Redesign (the clutter, before/after):** the Orders card back on its row; page 1's top row with even gaps; the
  page's other rows' gaps; titles (sizes and fonts unchanged without CS1); the text box and shape kept where they are.

## The result table (to fill)
(NC2: the plan's confidence and losses as NC2 changed them; the bullet's target markers and the heatmap's shaded matrix
are new in Desktop: judge them first.)
| Page | Custom visual | Became (plan) | Confidence | Lost (plan, short) | Desktop: draws the same fields sensibly? | Notes |
|---|---|---|---|---|---|---|
| 1 | KPI tile | kpi | medium, a guess | its format settings, its interactions | | |
| 1 | dial gauge | gauge | medium, a guess | its format settings, its interactions | | |
| 1 | drill-down bar | clusteredBarChart | medium, a guess | its own drill-down (Power BI's drill buttons, 2 levels) | | |
| 2 | chip slicer | slicer | medium, a guess | its look (chips), its interactions | | |
| 2 | bullet chart | lineClusteredColumnComboChart (second: clusteredBarChart) | low, a guess | its horizontal bars (columns), its bands; the target as a long-dash marker on each column | | |
| 2 | data grid | tableEx | medium, a guess | its format settings | | |
| 3 | word cloud | clusteredBarChart | low, a guess | its cloud (words sized by value): the bars rank them by value | | |
| 3 | tornado chart | clusteredBarChart | low, a guess | its two-sided layout: two bars side by side per category | | |
| 3 | multi-value card | cardVisual | medium, a guess | its format settings | | |
| 4 | calendar heatmap | pivotTable (second: lineChart) | low, a guess | its one square per day: one shaded cell per weekday in each month | | |
| 4 | smooth line chart | lineChart | medium, a guess | its format settings (smoothing) | | |
| 5 | sankey diagram | not replaced | - | no native visual draws a network | | |
| 5 | force graph | not replaced | - | no native visual draws a network | | |

| Clutter | Original | Redesigned (Desktop) |
|---|---|---|
| Page 1 top row gaps | 13, 21, 23 px; Orders card 5 px low | (plan: 16, 16, 16; all at y 96) |
| Vertical gaps between rows | uneven per page | (plan: 0 on page 1, 8 to 24 elsewhere: see NC1 "Seen") |
| Title sizes and fonts | 5 pairs (11 to 16, Segoe UI, Arial, Georgia) | (unchanged without CS1) |
| Text box and shape | x 24 / band at y 70 | (kept; the grid's margin is 16) |
