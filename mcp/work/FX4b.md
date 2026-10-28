# FX4b (0.3.1): a calendar's own DAX range moves a month-name axis to Year Month (the owner's D-1028-07)

## Summary
- **Approval:** the reviewer's brief "FX4b" (28 Oct): the owner's D-1028-07, "afx41 yes" to A-FX4-1 (FX4's question:
  should a calendar's own DAX range switch the axis without counts). Binding: D-1028-04 (FX4's rules).
- **Scope:** `assets/js/pbip-bind.js`, inside suggest's time-axis rule only (not FX5b's exported statsOf) and the
  reader's `tableExprCols` (the calendar's years); + .min.js. `mcp/test-0.3.1-fx4.mjs` (T4 back to its first meaning, new
  O checks: the written order). Tests whose picks move on purpose: test.mjs (the Ramadan rounds), golden-expected.json
  (tasks 1, 2, 12). Not FX5b's or FX3b's files (pbip-page.js, pbip-notes.js, theme-generator.js, report-inputs.mjs,
  report-run.mjs, report-said.mjs, sample-counts.mjs, tool-inputs.mjs, TOOLS.md, twin-texts.mjs, twin-plan.mjs,
  twin-pages.mjs, approval-window.mjs, plan_layout.mjs, report-rules.js).
- **Base:** `fix/0.3.1-fx4b` from `origin/integration/0.3.1` (dd25902). Push only this branch. FX5b merged in before the
  full run when the reviewer says it landed.
- **Expected checks:** fx4 25 -> about 31: T4 back to "a calendar whose own DAX runs 2013 to 2014: the year-month axis"
  (red on dd25902 first), new O1-O5 (a report written on a two-year made-up calendar whose labels read "Jan 2022": the
  line chart is by Year Month, sorted by the measure "Month start (sort)" = MIN of the calendar's date, ascending; that
  measure over the calendar's dates gives Jan 2022 .. Dec 2023 in time order, where the labels' A to Z order does not),
  red on dd25902 first (its axis is Month Name). test.mjs 1593 = 1593, the assertions on Month Short in the Ramadan
  rounds changed on purpose, each said below. golden: tasks 1, 2, 12 modelNotes Month Short -> Year Month; task 10's
  suggestChars may move by the why line's wording (said if it does); nothing else. Suites: base (no new suite).
- **Got:** fx4 25 -> 46 (T4 back; O1-O6 on four two-year made-up calendars: typed, untyped, with a Year Month Sort
  number, sorted in the model). Red on dd25902 first: 16 of 46; on 37a0de1 (Date only, before the order precedence) 3.
  test.mjs 1594 = 1594, 10 assertions changed on purpose; golden tasks 1, 2, 12 modelNotes and task 10 suggestChars
  6022 -> 6059, their whys written; arabic-titles 27, fidelity 40, metric-switcher 60, terminology-sheet 48: the same
  counts, assertions changed on purpose (below). FX5b not in integration yet (dd25902 still its head): not merged.
- Full run on 32bc7f9: "run-tests: 121 suites passed"
- **Resume:** CI on the branch (tests.yml); merge FX5b and run again when the reviewer says it landed.

## Plan
1. The reader keeps a calendar's DAX years (CALENDAR ( DATE ( y1, .. ), DATE ( y2, .. ) )) as FX4's first cut did
   (5042910); suggest's time-axis rule takes them when no counts say the range: y2 > y1 moves a month name to the same
   table's Year Month, else its date column; `why` says it acted on the calendar's own range. Counts, when given, decide
   first (FX4).
2. The tests that move, changed on purpose and said per test; golden's "why" beside each number.
3. "For the laptop": golden task 1's report in Desktop shows the Year Month axis Jan 2022 .. Dec 2027 in time order.

## Before -> after
- A calendar whose own DAX runs over more than one year (CALENDAR ( DATE ( 2022 .. ), DATE ( 2027 .. ) )), with no
  counts: the time axis Month Short / Month Name -> the same table's Year Month (else its Date); why: "The time axis is
  Year Month, not Month Short: the dates span more than one year (2022 to 2027 by the calendar's own DAX) ...".
- Its order, by the writer's own precedence: sorted by the model (the large model: Year Month by Year Month Number) ->
  the model's order; a Year Month Sort number (the Ramadan calendar) -> Min of it in the chart (round 2's measured way);
  neither -> "Month start (sort)" = MIN of the calendar's Date, also where the files give the Date no type (a table
  built by CALENDAR always has it), never the label read as a date (DATEVALUE).
- Golden tasks 1, 2, 12 and the Ramadan rounds of test.mjs: Year Month in time order by Year Month Sort. The large
  model's reports (arabic-titles, terminology, metric-switcher, preview-fidelity): Year Month in the model's order;
  the metric switcher keeps its line chart (with only the Date route it lost it: "no month order the chart can use").

## Tests changed on purpose (each said in the test, "FX4b, D-1028-07")
- fx4: T4 "a calendar whose own DAX runs 2013 to 2014: the year-month axis" (its first meaning, FX4's 5042910).
- test.mjs: fields and modelNotes (Year Month for Month Short); the months' order (Year Month by Calendar.Year Month
  Sort, its tooltip too); Round0 AR without displayNames (Month Short no longer shown; Year Month has its Arabic plan
  name); display names (the month's given name to Calendar[Year Month]; titles never "by Year Month" in English);
  suggest_fields on dax-project and with focus logistics (date Calendar[Year Month]); svgColumns (the extensions file
  may hold the Calendar entity of a time-order measure beside Sales; no picture measure on it).
- golden-expected.json: tasks 1, 2, 12 modelNotes Month Short -> Year Month; task 10 suggestChars 6022 -> 6059.
- arabic-titles: KEPT keeps Calendar[Year Month] English (was Month Short); test-models/arabic-titles-en.json, the
  English title "Web Orders Total Score by Year Month" (was by Month Short), with a "changed" line.
- metric-switcher: AR_DN keeps Calendar[Year Month] English (was Month Short).
- terminology-sheet: the axis's term on Calendar[Year Month] (DN, TERMS, the sheet's earlier row, the English-kept tab).
- preview-fidelity F-04: the dense page's line by Year Month gets the "labels from your data" note, no slant note (its
  label count is the data's); the slant rule on 12 short months stays checked beside it.

## CHANGELOG line
- "A trend over several years is no longer added up by month name" under [Unreleased].

## Decisions I made
- **The order follows the writer's precedence** (model sort-by, then a year-month number, then the month's first
  date), set on the switched field only: the name rule (nameLike) that orders month and day names does not read "Year
  Month", and widening it would move the Health Check's MONTH_SORT finding too (model-health-tmdl.js keeps it alike).
- **A CALENDAR table's own Date orders the label even untyped**: CALENDAR always makes [Date], a date; DATEVALUE of a
  label depends on how Desktop reads the text.
- The brief named "Month start (sort)" as the order; on golden task 1 the calendar has Year Month Sort, so the order is
  Min of it (the round 2 shape, measured), which the writer prefers to the month start. Both proven in fx4 (O3, O4).

## For the owner
- none

## Risky changes
- What Desktop shows: every model whose calendar is built by CALENDAR over several years now trends by Year Month
  (golden tasks 1, 2, 12; the large model). A wrong order there sends it back before the release (For the laptop).

## For the laptop
- Golden task 1's report in Desktop: the line chart's axis runs Jan 2022 .. Dec 2027 in time order (Year Month, by
  Year Month Sort); its trend tooltip too. And one report on the large model: Year Month in the model's order, the
  metric switcher's line chart in time order.

## Seen, not in scope
- nameLike (shared with model-health-tmdl.js) reads "Month Year" but not "Year Month": a model-sorted Year Month is
  not "ordered" elsewhere in the picker. Kept out on purpose (the Health Check would move).

## Lessons for the reviewer
- A rule on the time axis reaches the metric switcher, which orders a month only by a model or number column: test it.
