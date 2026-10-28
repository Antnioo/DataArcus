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
- **Expected checks:** (written before the work) new `fx4` about 20 checks, every rule's check red on 84596b9 first, the
  guards (a real category still picked, no counts given: the name rules alone) green there. Existing suites: the same
  counts. Picks may move on purpose where a fixture's calendar spans years by its own DAX and has a month name on the
  axis (golden task 1's Ramadan calendar, possibly others): each such change said per test below, golden-expected.json's
  "why" written beside the number. Suites: base + 1 (fx4).
- **Got:** fx4 25 checks (21 red on 5b60a4e first; the guards C8, T3, T5 green there; T4 changed and T7 added after the
  DAX route was taken out, "Tests changed on purpose") -> 25 PASS. test.mjs 1593 = 1593; golden: task 10 suggestChars
  6105 -> 6604 on purpose, nothing else moved. Website site-config PASS. Suites: base + 1 (fx4).
- **Resume:** the full run on the last code commit, then CI on the branch (tests.yml), then the reviewer.

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

## Before -> after (the fixtures, through the server; counts given unless said)
- financial (Financial Sample's shape): headline KPI Gross Sales -> Sales (Gross Sales the second card); time axis
  Calendar[Month Name] over two years (Calendar[Year]: 2 by the counts) -> Calendar[Year Month]; without counts the axis
  stays Month Name and why says the range is not known; Sales is still the headline (a name rule).
- births (Bayanat's shape): bar, donut, funnel, treemap by Births[Country] (one value) -> Births[Emirate]; slicers
  Country, Emirate -> Emirate, Nationality; Geo Point and Unit out of the slicer pool (Geo Point also without counts).
- retail (Online Retail II's shape): column chart, map, table and a slicer by Online Retail[Invoice] -> Country (the
  only category left: the column chart takes the bar's, as the picker did before for one category); Basket Label and
  Description out of the pool.
- Every answer: `why` [{ field, line }] (capped 20, `whyNotListed`), `countsNote` without columnStats,
  `statsNotInModel` (capped 20) for a count naming a column the model lacks.

## For the reviewer: the TOOLS.md line (FX2 owns TOOLS.md today; add at the merge, `suggest_fields` row)
`columnStats` (0.3.1, FX4): counts only, `{ rows: { "Table": n }, distinct: { "Table[Column]": n } }` (whole numbers;
COLUMNSTATISTICS()'s Cardinality, never its Min or Max). With them no category is a column of one value or of mostly
unique values (90% of its rows, over 100 rows; or over 5,000 values), and a month name gives way to a year-month axis
(or the date) when the years are more than one; without them `countsNote` says only the name rules applied. Always: no
coordinate or invoice column as a category, net before gross, and `why` says each rule that acted.

## Tests changed on purpose
- golden task 10 `suggestChars` 6105 -> 6604 (countsNote and the "range not known" line; the picks the same), its
  "why" written in golden-expected.json. No other golden number moved.
- fx4 T4 (my own suite, before any merge): "a calendar whose own DAX runs 2013 to 2014: the year-month axis" (red on
  5b60a4e, green on 5042910) -> "no counts: the month name stays and why says the range is not known" (the DAX route
  taken out, below). T7 added (one year by the counts: the month name stays, the year no slicer).

## CHANGELOG line
- One line under [Unreleased]: "Safer picks on a model DataArcus has not seen before" (the four rules, columnStats
  counts only, countsNote).

## Decisions I made
- **The counts come in as an input, `columnStats`** (whole numbers only, `.strict()`): no model file holds distinct
  counts (model.bim, a .pbit's DataModelSchema and TMDL have none), so the AI app reads them in Desktop (Microsoft's
  Authoring MCP: COLUMNSTATISTICS()'s Cardinality, COUNTROWS) and passes them, as check_model_health's `columnTypes`.
  A name or a count that does not fit is named (`statsNotInModel`), never used.
- **"Close to the row count"**: 90% of the table's rows or more, only in a table of over 100 rows (a small lookup's
  unique names, 12 regions in 12 rows, stay a category). Plus **over 5,000 distinct values**: Online Retail's Invoice
  is 5% of its rows, not close, yet no axis or slicer reads 53,628 items.
- **Invoice by its name** (a text column whose name ends in invoice or receipt) and **coordinates by name or data
  category** apply without counts too: they need no data.
- **The time axis switches by the counts only.** The first cut also read a calendar's own DAX years (CALENDAR ( DATE (
  2022 .. ), DATE ( 2027 .. ) )): it moved golden tasks 1, 2 and 12 and test.mjs's Ramadan rounds to Year Month,
  which the writer then orders by a report measure ("Month start (sort)") never checked in Desktop. By the rule "stop
  when a failure could change what Desktop shows" it was taken out; the question is the owner's (below).
- **Gross before net never moves a variant or a percent ahead of a base amount**, and only pairs by name (Gross X / X,
  Gross X / Net X, X before Discount(s) / X).
- `why` is in the answer only when a rule acted (so other answers keep their shape); suggest_fields always says
  `countsNote` without counts.

## For the owner
- **D-FX4-1:** should a calendar's own DAX range (CALENDAR ( DATE ( 2022, 1, 1 ), DATE ( 2027, 12, 31 ) )) switch the
  axis to Year Month without counts? Today such a model keeps Month Short on the axis, which adds up the same month of
  six years (golden tasks 1, 2, 12). Yes needs one laptop check of a Year Month axis ordered by the report.

## Risky changes
- What suggest_fields returns: new keys `why`, `whyNotListed`, `countsNote`, `statsNotInModel`; new input `columnStats`.
- The picks change for every caller of the picker (create_report, plan_layout, the website's theme generator): no
  coordinate or invoice column as a category, net before gross. Counts reach only suggest_fields.

## For the laptop
- On the three public datasets (Financial Sample, Bayanat births, Online Retail II): suggest_fields with columnStats
  from COLUMNSTATISTICS() (Cardinality only) and COUNTROWS: the picks above; a report from them in Desktop, the Year
  Month axis in time order.

## Seen, not in scope
- `NOT_CAT_OLD` reads its words case-sensitively: "Description", "Notes", "Comments" with a capital pass as categories
  (Description is caught here only by its count). A one-line fix with its own test, for a Seen batch.
- golden's "Largest answer per tool" for plan_layout differs between two runs of the same commit (29559, 29720): not a
  compared number, so nothing fails; a stable one would need its cause found.
- Births' Year (whole numbers, no date) gives no time axis: a years-only trend is 0.3.2's domain modelling.

## Lessons for the reviewer
- A rule keyed on the model's definition (a calendar's DAX) reaches every DAX-calendar fixture; try it on golden first.
