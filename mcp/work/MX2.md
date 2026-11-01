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
- **State:** unblocked 08:44 (the evidence on this repo's branch `evidence/0.3.1-shapes`, read, never merged); plan
  written from it; tests next.
- **Resume:** `mx2` red on the merged base, then 1, 3, 4, 2.

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

## For the laptop (part 9)
To be written with each item's page once the work is done.

## Seen, not in scope
- none yet.
