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
- **Resume:** the plan pushed; next the red test.

## Plan
1. The reader keeps a calendar's DAX years (CALENDAR ( DATE ( y1, .. ), DATE ( y2, .. ) )) as FX4's first cut did
   (5042910); suggest's time-axis rule takes them when no counts say the range: y2 > y1 moves a month name to the same
   table's Year Month, else its date column; `why` says it acted on the calendar's own range. Counts, when given, decide
   first (FX4).
2. The tests that move, changed on purpose and said per test; golden's "why" beside each number.
3. "For the laptop": golden task 1's report in Desktop shows the Year Month axis Jan 2022 .. Dec 2027 in time order.
