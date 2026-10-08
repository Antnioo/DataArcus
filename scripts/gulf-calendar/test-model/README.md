# Gulf Calendar test model (made-up data)

A small model to run the Gulf Calendar's DAX in Power BI Desktop: the Calendar Generator's table with the announced
Ramadan and Eid dates and the UAE weekend, a made-up Sales table (two stores, an amount per day from a fixed
formula, 2018-2030), and the Measure Builder's Ramadan and Eid measures. **No real data.** The expected result of
every check was worked out in JavaScript before any run (`make-test-model.mjs`, saved in `expected.json`).

Files (rebuild them with `node scripts/gulf-calendar/test-model/make-test-model.mjs`; the `gulf-calendar` test suite
fails when they differ from what the website's tools write):
- `calendar.dax`: the Calendar Generator's output for 2018-01-01 to 2030-12-31, weekend "UAE", announced dates on.
- `sales.dax`: the made-up Sales table.
- `measures.dax`: the Measure Builder's script: Total Sales, Last Ramadan, vs Last Ramadan %, and the six Eid window
  measures.
- `check.dax`: one query, 43 checks (15 on the calendar, 3 Arabic names, 10 Ramadan, 15 Eid), each with its expected value.

## Steps in Power BI Desktop (builder; about 10 minutes, or through Microsoft's Power BI Authoring MCP)
1. New blank report. **Modeling > New table**: paste `calendar.dax`, Enter. Then again with `sales.dax`.
2. **Model view**: relate `Sales[Date]` to `Calendar[Date]` (many to one, single direction). If Desktop made it
   already, check it is many to one.
3. **DAX query view**: paste `measures.dax`, click **Update model with changes**.
4. **DAX query view**: paste `check.dax`, run. **Expected: 43 rows, every one Pass = TRUE.**
5. Record the result in `scripts/tests/DESKTOP-TESTS.md` (Desktop version, rows passing, any row that fails with
   its Result and Expected). Don't change an expected number to make a row pass: report it.

What a failing row would mean: C rows, the generated calendar (dates, weekends, flags); R rows, the existing Ramadan
measures; E rows, the new Eid window measures.
