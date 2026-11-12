# AU2 (0.3.3): the Arabic twin reads a date and a weekday from an Arabic column name too (AUD-051, B-307, B-402 weekday half)

## Summary
- **Approval:** the reviewer's hub (session_015Q77oNR7YVFznptSuZoZZ2), job AU2, under the owner's D-1112-01 (12 Nov
  04:15 Dubai: fix the open audit finds). Binding: D-1104-15, D-1104-12 (time-names.js the one home), D-1105-04
  («عام» time only as a name's first word), D-1027-12, D-1029-03 (the twin identical, mirrored).
- **Base:** `feat/0.3.3-au2` from `origin/integration/0.3.3` (c21df8d5). Push only it; never merge, no PR.
- **Scope:** `assets/js/time-names.js` (2 new pure exports: `isDateName`, `isWeekdayName`), `mirror-policy.js`
  (DATE_LIKE gone, reads isDateName), `report-mirror.js` (WEEKDAY gone, reads isWeekdayName), their .min.js and
  ?v= stamps (R-55), `mcp/test-0.3.2-dd1a.mjs` (U5, U6), new `mcp/test-0.3.3-au2.mjs` (+ tests.json), CONTRACTS.md
  1a, contracts-probe if a definition moves, MODULES.md, CHANGELOG, WORK.md, this note. Not touched: ONE_ROW_H,
  health-rules.js, sort-column.js, twin-model.mjs MONTHISH/YEARISH, LX1's, AU1's and SN3's files.
- **Expected checks:** dd1a 319 -> about 319 + 2 x 30 English pins + about 20 Arabic = about 400, red on the base
  (isDateName / isWeekdayName do not exist). au2: 4 checks through the real server (stdio, made-up model): A1 the
  English-named untyped date column's chart inverted, A2 the Arabic-named one the same; H1 the English weekday
  heatmap gets names beside, H2 the Arabic one too. Red on the base: A2 and H2 (2 of 4). Every other suite unchanged
  (the 6 dashboards' twin pins, fuzz, recorded twin fixtures: their names are English; a move is a STOP).
- **Resume:** started 2026-11-12T00:53Z. Next: red tests.

## Plan
1. Pin the two regexes as they are: a table of at least 30 names each way per regex, its answers read from the regex
   on the base (RepeatIQ's StartOfMonth, "Start of Month", "Order Date", "Month Start", "Day" among them).
2. Red: au2 through create_arabic_twin on the real server (a Calendar date table with an untyped "Ship Date" and an
   untyped «تاريخ الشحن», a line chart on each; a heatmap by "Weekday" and one by «يوم الأسبوع»).
3. time-names.js: `isDateName(name)` = the English regex, unchanged, or the Arabic rule (first word «تاريخ»; or «يوم»
   alone or before a word that is not a time word; or «بداية» before a time word, «عام» only as the first word);
   `isWeekdayName(name)` = the English regex, unchanged, or the words «يوم أسبوع», «اسم يوم», «اسم يوم أسبوع».
   The mirror reads them; the regexes go.
4. build:min, new ?v= stamps, area runs (twin, report, arabic, core, checker, model), contracts, lint, merge the base
   once, CI.
