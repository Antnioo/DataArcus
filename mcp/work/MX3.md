# MX3 (0.3.1): laptop part 9's tables and matrices

## Summary
- **Approval:** the reviewer's brief "MX3" (1 Nov, 13:07), from laptop part 9 (rc.8, integration b40cb786: NO but close;
  its RESULTS.md blocks C, D and "For the builders", quoted in the brief). MP1f has the KPI text boxes, the donut
  legend, the agent cards and KPI centring: not here. The real shapes: branch `evidence/0.3.1-shapes` (read, never merged).
- **Base:** `fix/0.3.1-mx3` from `origin/integration/0.3.1` at b40cb786. Push only this branch; never merge.
- **Scope:** 1 `matrixAsTable` end to end (`tools/create_arabic_twin.mjs` input, pin, plan data; the approval page;
  the write). 2, 5 `twin-pages.mjs fitHeaders`: a header grows only into the box's spare room, never by narrowing
  another column (the names keep their English width). 3 `keepView`: the names always the rightmost column; a table
  wider than its box keeps columns behind the scroll only beyond the names, the names widened to the room's edge
  (never narrowed). 4 `twin-plan.mjs`: a table with columns Power BI sizes from the data, whose first column may then
  be out of view, named ("may be wider than its box"). 6 a matrix kept for its row headers' font offered flat too
  (the font becomes the values'; a table has no per-column font size: capabilities' columnFormatting has none). 7 the
  heatmap's names beside it (MX1 B2) the twin's choice when its rows are weekdays and all fit its box (7 rows, from the
  field's name and the box's height; never data): the grid filling its box (`columnHeaders.columnAdjustment`
  "growToFit", capabilities 0.1.3), the names column as wide as the longest weekday name (English or Arabic, a fixed
  list) at its text size; B1 (said) otherwise; the names table written on the Arabic page (twin and copy). 8
  `lib/model.mjs`: a mistyped path lists the named folder's models first.
- **Expected checks:** a new suite `mx3` (area twin), about 26, red on b40cb786 first, fixtures made up in the real
  shapes: T1-T4 the tool (input accepted, plan data and approval page row, a different list refused at the write, the
  flat table written); R1-R4 widths (Fintech p3 tasks 73b90b71 and milestones af02c108: the row label at the row
  field's English width, each value column at its English width or more from spare only; the watchlist's names 187);
  K1-K3 keepView (Fintech p3 team flat, AdventureWorks p1 top 10, RepeatIQ retention 19f5c974: the names rightmost);
  P1-P2 RepeatIQ p4 pricing 05e58ec0 named, a table that fits not; E1-E2 ER p2's font: offered, the loss said; H1-H7
  the heatmap (Call Center p1 9d8cf758: the names table at the grid's right edge, as wide as the longest weekday, the
  grid growing to fit, the weekday bar chart not over the names; one too short for its rows: B1; one not by weekday:
  B1; the copy's Arabic page has its names table); M1 the path. mx1, mx2, mp1-shapes and the never-shrink guard: any
  check that moves said per check.
- **State:** plan written; tests next.
- **Resume:** `mx3` red on b40cb786, then the code in the order 1, 2+5, 3, 4, 6, 8, 7.

## For the laptop (part 10)
To be written per item and page once the work is done.
