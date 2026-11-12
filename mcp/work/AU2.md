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
- **Expected checks:** dd1a 319 -> 516 measured (planned about 400: the tables came out 74 and 68 names), red on the base
  (isDateName / isWeekdayName do not exist). au2: 5 checks (4 + V, the validator) through the real server (stdio, made-up model): A1 the
  English-named untyped date column's chart inverted, A2 the Arabic-named one the same; H1 the English weekday
  heatmap gets names beside, H2 the Arabic one too. Red on the base: A2 and H2 (2 of 4). Every other suite unchanged
  (the 6 dashboards' twin pins, fuzz, recorded twin fixtures: their names are English; a move is a STOP).
- **Resume:** fix and tests pushed (c487c9c5); areas twin, arabic, report, checker, model green locally; CI started 2026-11-12T01:32Z.

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

## Before -> after
- A date table's untyped column named in Arabic (au2 A2, «تاريخ الشحن», a line chart): before (c21df8d5) the twin kept
  its time axis left to right (no invertAxis) while "Ship Date" got it inverted -> after: inverted, as "Ship Date".
- A heatmap by «يوم الأسبوع» (au2 H2): before: kept a matrix, named in cannot ("its rows are not the days of the week")
  -> after: its names written beside the grid (mirrors heatmapNames), as the one by "Weekday".
- English: every name of the pin tables reads as the regexes read it on c21df8d5 (40 + 34 for DATE_LIKE, 37 + 31 for
  WEEKDAY, read from the regexes, odd answers kept: "Restart" and "Date2" a date, "WeekdayName" not a weekday).
- Red on c21df8d5 first: dd1a 196 of 516 failed (U5, U6, S: the functions did not exist, the regexes were there);
  au2 2 of 5 failed (A2, H2; the guards A1, H1 and V passed). After: dd1a PASS 516 (was 319), au2 PASS 5.

## CHANGELOG line
- The Arabic twin now reads a date and a weekday from an Arabic column name as it does from an English one (mcp/CHANGELOG.md).

## Decisions I made
- The English rules moved into time-names.js as the regexes they were, byte for byte (`DATE_EN`, `WEEKDAY_EN`), so no
  English answer can move; the Arabic half reads `wordsOf` (the article off, «أ» as «ا», marks dropped).
- «يوم» before a time word is a part, not a date («يوم الأسبوع», «يوم الشهر»), as "Day of Week" and "Day of Month"
  are refused in English; a weekday name is never a date.
- «بداية العام» is not read as a date: D-1105-04 («عام» time only as a name's first word), applied as written. «بداية
  السنة» is. Said in a test so a later decision moves it on purpose.
- report-mirror.js reads time-names.js directly (as mirror-policy.js does); the theme generator pages load
  time-names.min.js before theme-generator.min.js, which loads report-mirror.
- The ?v= stamps are the build's (R-55): theme-generator.js's BUILDER line (mirror-policy, report-mirror stamps) and
  the 3 pages' time-names and theme-generator stamps changed. LX1 changes other lines of theme-generator.js and the
  theme-generator stamp on the same 2 page lines: a merge conflict there is resolved by `npm run build:min`.
- contracts-probe.mjs unchanged: no definition moved between places of a family (1a's four places unchanged); the
  two new functions have one place each, written in CONTRACTS.md 1a.

## For the owner
none

## Risky changes
- The stamp lines shared with LX1 (above): the reviewer merges one, then runs build:min on the other.

## For the laptop
- Optional: a twin of a report whose date table has an Arabic-named date column the model does not type: its chart
  reads from the right, as the English-named one.

## Seen, not in scope
- twin-model.mjs MONTHISH / YEARISH (AUD-052, B-308) still read only «الشهر/شهر», «السنة/سنة»: a date table named
  only with «عام» words is not found by shape. Not touched (the brief).
- DATE_LIKE's English quirks are pinned, not fixed: "Restart", "Kickstart", "Upstart" read as dates ("X start"),
  "Startdate" does not, "Dates" does ("^date"). Harmless today (only on a date table's untyped column) but a later
  look could narrow it; needs the owner's or reviewer's call since it would move English answers.

## Lessons for the reviewer
- A regex moved into a shared home is safest pinned by a table read from it before the move, odd answers included.
