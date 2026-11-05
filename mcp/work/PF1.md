## Summary
- **Approval:** the brief "PF1 (0.3.2)" (5 Nov), from the owner's D-1105-11 (the Desktop look batched: lab/look032 C, 5 Nov, Power BI Desktop 2.159.1231.0); B-381 (HIGH, before 0.3.2 ships) and B-380.
- **Base:** fix/0.3.2-pf1 from origin/integration/0.3.2 (12d9d30c). Push only it; no merge but integration once before the last CI, no PR.
- **Scope:** B-381: create_report drops planFields.measure when planFields.kpis is an empty list (no KPI cards): every chart and table shows "Sum of Amount". Cause and fix in mcp/lib/report-bind.mjs fieldBinding (its one place). B-380: create_arabic_twin with timeRightToLeft false says "categories right to left" for column and line charts over time it keeps left to right. Cause in assets/js/mirror-charts.js chartsOf (kind "column" kept), sentence in assets/js/report-mirror.js KIND_WHAT (a new kind "columnTime", as "waterfallTime" is for waterfalls).
- **Expected checks:** new suites pf1 (area report, 21 checks, red on 12d9d30c first: 16 of 21) and pf1t (area twin, 13 checks, red on 12d9d30c first: 7 of 13); sp10 113 and sp39 96 unchanged in number, their recorded kind moved on purpose (below); every other suite unchanged.
- **Resume:** code done (ac54711f); next: the area runs, integration merged once, CI on the branch.

## The plan
1. B-381, pinned first (L-1105-09): a made-up model "Time Lab" (Sales: FiscalYear, Qtr, Amount, measure Total Sales; «المبيعات»: «شهر» sorted by «رقم الشهر», «المبلغ», measure «إجمالي المبيعات»; no relationship), the brief's plan_layout input (exec, kpis 0, no filters, planFields measure, timeAxis, category, category2, and the swapped run) with planFields.kpis [] (no cards), plan -> approve -> create_report; every written value projection is Sales[Total Sales] (red on the base: 0 Total Sales, 11 Sum(Sales.Amount), the laptop's count). Each other key (kpis, timeAxis, category, category2, table, slicers) checked written as given.
2. Diagnose with file:line (below), then the fix in fieldBinding only.
3. A chosen field that cannot be used: the plan says so before Approve (a missing field, a column as the measure, a measure as an axis: planProblems, checked).
4. B-380: a failing test of the twin's answer for both choices (timeRightToLeft true and false) on a column and a line chart over time and a column chart by a non-time category; then the new kind and its sentence.

## Diagnosis
- B-381: `mcp/lib/report-bind.mjs:84` (base 12d9d30c), fieldBinding: `usable = F && F.kpis ? F.kpis.map(...) : Bind.suggest(...)`. planFields.kpis [] (the person's "no KPI cards") is truthy, so usable was [] and `COUNTS` (line 88, Bind.counts: the path for a model with no measures) took every value: each chart and the table summed Amount and counted FiscalYear. planFields.measure reached the picker (planBinding's `main`) but countBind replaced it (`main: C[0]`). Measured on the base with the Time Lab input: 0 projections Total Sales, 11 `Sum(Sales.Amount)` (the laptop's 11) plus 2 `Count(Sales.FiscalYear)` in the tables. The same happened when every planFields.kpis entry was a text measure (report-run.mjs:65 empties the list). Without planFields.kpis (top-level kpis 0) the base already wrote Total Sales: that is why my first reproductions passed.
- The other keys, measured on the same input (R2, R3): timeAxis, category, category2, kpis, table and slicers are each written as given; plan_layout already refuses (planProblems, no planId) a field not in the model, a column as the measure and a measure as an axis (report-fields.mjs fieldsAndProblems, R4).
- B-380: `assets/js/mirror-charts.js` chartRtl keeps a time category's order with timeRightToLeft false (no sort turned, no axis inverted: `keepTime`, the one time test mirror-policy.js categoryIsTime -> time-names.js isTimeName), but chartsOf returned kind "column", so twin-plan.mjs:244 said `KIND_WHAT.column` ("categories right to left by the sort"). A chart over time sorted by its value is still turned right to left: it stays "column".

## Before -> after
- B-381: create_report with planFields.kpis [] and planFields.measure: every chart and table `Sum of Amount` -> `Total Sales` (9 value projections, 0 summed or counted, both runs). fieldBinding's usable measures: the plan's cards, else the picker's, else the plan's measure; the number of cards stays the plan's (report-build.mjs maxKpis).
- B-380: chartRtl returns `{ timeKept }`; chartsOf passes it on; mirrorVisual reports kind "columnTime" (inside, its rules stay the column family's, so mirror-policy.js `titled` still right-aligns its title); `KIND_WHAT.columnTime`: "column, line, area and combo charts over time, kept left to right as asked (timeRightToLeft false): value axis at the right, their periods in the original's order from the left". Written files byte for byte the base's for both choices (pf1t T3: digests recorded on the base).
- Time Lab twin plan answer: 21,664 (default) and 21,686 characters (time kept) of 40,000; fx1 PASS 22 three runs of three.

## Changed on purpose
- mcp/fixtures/sp39-mirror.json: 8 run entries (lineMonth, xColumn, xLineDate, xCombo; runs B and E, the two with timeRightToLeft false): `"kind": "column"` -> `"kind": "columnTime"` and their `sha` (each 4 characters longer: the word "Time" in the digested output); `api.KIND_WHAT` 4dead3bc4cfd5540595ca76d:3923 -> 9c51555d8d5056948ac004db:4115 (the new sentence).
- mcp/fixtures/sp10-policy.json: 20 run entries (lineMonth, mDateHier, mDateHierLine, mFiscalYearDim, mStartOfMonth, mOrderDateCat, mMonthName, mArabicMonth, mComboMonth, mYearCol; runs B and E): the same kind and sha. mcp/test-0.3.2-sp10.mjs's DD1A overlay: mFiscalYear runs B and E kind "column" -> "columnTime" (it pins them in the test, not the file).
- Done by a script that copies only those two fields from a fresh recording and stops if anything else in the run differs; a full re-record was refused (it would also move entries DD1A pinned in its overlay). Nothing else in either file changed (git diff: 28 kinds, 28 shas, 1 digest).

## CHANGELOG line
A report planned with no KPI cards now shows the chosen measure on every chart and table (it showed a sum of a column), and the Arabic twin says that charts over time stay left to right when you keep time left to right.

## Decisions I made
- Two suites, not one: pf1 (report) and pf1t (twin), each in its area.
- The kind "columnTime" is said by mirrorVisual only; chartsOf's working kind stays "column" so every later rule (the title, in mirror-policy.js, outside my scope) is unchanged. A first try that renamed the working kind changed the files (pf1t T3 caught it).
- The plan's measure is the last fallback, not the first: with planFields.measure but no planFields.kpis the cards keep the picker's measures (as before).
- No Arabic text changed (KIND_WHAT is English, for the AI app): nothing to draft.

## For the owner
none

## Risky changes
- What an answer returns: create_arabic_twin's mirrors gains a kind "columnTime" (with timeRightToLeft false only) instead of "column" for charts over time; same files written.
- What a report writes: with planFields.kpis [] (or text measures only) the charts and the table now bind the model's measures instead of summed columns. Tests that lose checks: none.
- build:min restamped two `?v=` values in assets/js/theme-generator.js (a fenced file: check/0.3.2-batch-3e1e78ec) and the theme generator pages: stamps only, made by the build (ST1), never typed; a clash there is settled by running build:min again.

## For the laptop
- Re-run look032 C's B-381 input from this branch: every chart and the table should show Total Sales. B-380 needs no new look (the files are unchanged; only the sentence).

## Seen, not in scope
- With kpis 0 at the top level and no planFields.kpis, the written report still holds 2 card visuals showing Total Sales (counted in visual.json files on the Time Lab run; which pages they sit on not checked): whether top-level kpis 0 should mean no card there is worth a look. Not changed here.
- The answer for a text measure as the only planFields.kpis still says it after the write (create_report's note), not in the plan.

## Lessons for the reviewer
- The brief's "kpis: 0" hid the trigger: the bug needs planFields.kpis [] (or all text measures); top-level kpis 0 alone writes Total Sales. A brief that pins an eval input should copy the lab driver's exact JSON.
- sp10's fixture predates DD1A; a re-record moves DD1A's overlay entries too, so a kind change must be patched field by field.
