## Summary
- **Approval:** the brief "PF1 (0.3.2)" (5 Nov), from the owner's D-1105-11 (the Desktop look batched: lab/look032 C, 5 Nov, Power BI Desktop 2.159.1231.0); B-381 (HIGH, before 0.3.2 ships) and B-380.
- **Base:** fix/0.3.2-pf1 from origin/integration/0.3.2 (12d9d30c). Push only it; no merge but integration once before the last CI, no PR.
- **Scope:** B-381: create_report drops planFields.measure when planFields.kpis is an empty list (no KPI cards): every chart and table shows "Sum of Amount". Cause and fix in mcp/lib/report-bind.mjs fieldBinding (its one place). B-380: create_arabic_twin with timeRightToLeft false says "categories right to left" for column and line charts over time it keeps left to right. Cause in assets/js/mirror-charts.js chartsOf (kind "column" kept), sentence in assets/js/report-mirror.js KIND_WHAT (a new kind "columnTime", as "waterfallTime" is for waterfalls).
- **Expected checks:** new suites pf1 (area report, about 20 checks) and pf1t (area twin, about 12 checks), each red on 12d9d30c first; sp10 and sp39 (the mirror's characterisation suites) re-recorded on purpose for the new kind only (lines said under "Changed on purpose"); every other suite unchanged.
- **Resume:** step 1 (the plan). Next: the tests red, the fixes, the area runs, CI.

## The plan
1. B-381, pinned first (L-1105-09): a made-up model "Time Lab" (Sales: FiscalYear, Qtr, Amount, measure Total Sales; «المبيعات»: «شهر» sorted by «رقم الشهر», «المبلغ», measure «إجمالي المبيعات»; no relationship), the brief's plan_layout input (exec, kpis 0, no filters, planFields measure, timeAxis, category, category2, and the swapped run) with planFields.kpis [] (no cards), plan -> approve -> create_report; every written value projection is Sales[Total Sales] (red on the base: 0 Total Sales, 11 Sum(Sales.Amount), the laptop's count). Each other key (kpis, timeAxis, category, category2, table, slicers) checked written as given.
2. Diagnose with file:line (below), then the fix in fieldBinding only.
3. A chosen field that cannot be used: the plan says so before Approve (a missing field, a column as the measure, a measure as an axis: planProblems, checked).
4. B-380: a failing test of the twin's answer for both choices (timeRightToLeft true and false) on a column and a line chart over time and a column chart by a non-time category; then the new kind and its sentence.

## Diagnosis
(filled in step 2)

## Before -> after
(filled in at the end)

## CHANGELOG line
(filled in at the end)

## Decisions I made
(filled in as I go)

## For the owner
(filled in at the end)

## Risky changes
(filled in at the end)

## For the laptop
(filled in at the end)

## Seen, not in scope
(filled in at the end)

## Lessons for the reviewer
(filled in at the end)
