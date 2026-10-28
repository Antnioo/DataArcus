# FX4 (0.3.1): suggest_fields' picks on unknown models (the laptop's part 3, block H, H-3)

## Summary
- **Approval:** the reviewer's brief "Go on FX4" (28 Oct). Binding: D-1028-04 (the owner's "3 yes" to A-P3-3: never a
  one-value or mostly-unique column as a category; a year-month axis over a month name across years; net before gross).
  Domain modelling is 0.3.2, not here. Engine B-221 (a path outside the case folder refused) kept.
- **Scope:** `assets/js/pbip-bind.js` (suggest: the four rules, its `why` lines; + .min.js), `mcp/tools/suggest_fields.mjs`
  (an optional `columnStats` input: counts only, never values). New fixtures `mcp/fixtures/fx4/` (three made-up model.bim
  files shaped like the laptop's datasets, each with a `column-stats.json` of counts), new suite `mcp/test-0.3.1-fx4.mjs`.
  Not FX2's files (design-engine.js, report-mirror.js, artifact.mjs, report-run.mjs, twin-plan.mjs, plan_layout,
  create_report, TOOLS.md).
- **Base:** `fix/0.3.1-fx4` from `origin/integration/0.3.1` (84596b9c). Push only this branch.
- **Measured today on 84596b9 (the fixtures, through the server):** financial: headline KPI Gross Sales, time axis
  Calendar[Month Name] over two years; births: Births[Country] (one value) is the bar, donut and first slicer, Geo Point
  in the slicer pool; retail: Online Retail[Invoice] is the column chart's, the map's, the table's and a slicer's category.
- **Expected checks (written before the work):** new `fx4` about 20 checks, every rule's check red on 84596b9 first, the
  guards (a real category still picked, no counts given: the name rules alone) green there. Existing suites: the same
  counts. Picks may move on purpose where a fixture's calendar spans years by its own DAX and has a month name on the
  axis (golden task 1's Ramadan calendar, possibly others): each such change said per test below, golden-expected.json's
  "why" written beside the number. Suites: base + 1 (fx4).
- **Resume:** the plan pushed; next the red test, then the rules.

## Plan
1. **Categories (rule 1).** Never a category (chart axis, slicer, table group, the slicer pool): a column the counts say
   has ONE value; a text column whose distinct count is 90% of its table's rows or more (tables of over 100 rows: a small
   lookup's unique names stay), or over 5,000 (no axis or slicer reads that many); a text column named as coordinates
   (latitude, longitude, lat, lon, lng, coordinates, geo point, geopoint, location coordinates) or with that data
   category; a text column named invoice or receipt (invoice numbers). No counts given: the name and type rules only,
   and the answer says counts were not available. The year slicer too: a year of one value is no slicer.
2. **Time axis (rule 2).** A month NAME (not a year-month) on the axis while the date range spans more than one year
   (the counts: a year of 2+ values or a year-month of 13+; or the calendar's own DAX: CALENDAR ( DATE ( y1 .. ),
   DATE ( y2 .. ) ) with y2 > y1) -> the same table's year-month column, else its date column. Said in `why`.
3. **Gross before net (rule 3).** Gross X / X, Gross X / Net X, X before Discount(s) / X: the net one goes first (the
   headline and the first card), the gross one may follow.
4. **why (rule 4).** One plain line per rule that acted, each naming the field: `why` [{ field, line }], capped (20),
   `whyNotListed` beyond; `counts` says whether counts were given.
5. **Input.** `columnStats` { rows: { Table: n }, distinct: { 'Table[Column]': n } }, integers only (so no value can be
   passed), from Desktop through Microsoft's Power BI Authoring MCP (COLUMNSTATISTICS()'s Cardinality column only;
   COUNTROWS per table). Capped like the other inputs.
