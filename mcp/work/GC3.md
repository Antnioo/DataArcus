# GC3 (0.3.1): the Gulf calendar never adds a second active relationship to a fact date column

## Summary
- **Approval:** the reviewer's brief, 27 Oct (the owner's laptop run, the sample's tour step 3: add_gulf_calendar's
  script related Sales[Date] to the new Gulf Calendar[Date] while Sales[Date] already relates to Calendar[Date]; not
  applied there). The reviewer approved fixing it now.
- **Scope:** `mcp/lib/gulf-calendar.mjs` (the relateTo choice and the script's relationship lines),
  `mcp/tools/add_gulf_calendar.mjs` (description, the plan's write line EN and AR), the new suite
  `mcp/test-0.3.1-gc3.mjs` (+ one line in `mcp/tests.json`), the one check in `mcp/test.mjs` (part gulf-calendar) that
  pinned the old relationship, `mcp/CHANGELOG.md`. No website file: the Calendar Generator's engine
  (`assets/js/calendar-generator.js`) is not touched (relationships are the MCP's only). Not TT1's, NC3's or GD1's files.
- **Base:** `fix/0.3.1-gc3` from `origin/integration/0.3.1` (88ee4df). Push only this branch.
- **Rule (evidence: Microsoft Learn, below):** a relateTo column that already has an active relationship to a date
  table is never related to the Gulf calendar a second time. (a) The Gulf calendar is related to that date table's Date
  instead (Calendar[Date] -> Gulf Calendar[Date], many to one, single direction: the shape Desktop applied); (b) only
  where that Date is itself already related onward, the relationship is added inactive (`isActive: false`) and the
  answer says how to use it (USERELATIONSHIP). (c) Replacing the model's calendar is never offered by the script.
  No date table: unchanged.
- **Expected checks:** `gc3` new, 22 checks (red on the base: 15 failed; then PASS); `-- model` 13 -> 14 suites PASS,
  every other count unchanged; `-- core` unchanged counts (`mcp` part gulf-calendar: one check's expectation changed,
  said below; golden byte for byte: no golden holds a Gulf calendar script); lint, check-result-lines,
  changelog-words, check-agent-memory PASS; `--keep-going` once at the end.
- **Got:** see "Results".
- **Resume:** the laptop: "For the laptop" (tour step 3 in TMDL view). Then the reviewer.

## Evidence (Microsoft Learn, read 27 Oct)
- "Model relationships in Power BI Desktop", Make this relationship active: "There can only be one active filter
  propagation path between two model tables ... additional relationship paths ... must set these relationships as
  inactive. Inactive relationships can only be made active during the evaluation of a model calculation ... USERELATIONSHIP."
- "Active vs inactive relationship guidance" and "Understand star schema", Role-playing dimensions: an inactive
  relationship is used only by a measure with USERELATIONSHIP; Model view draws it dashed; RLS never uses it.
- "USERELATIONSHIP": `CALCULATE ( ..., USERELATIONSHIP ( Fact[Col], Dim[Date] ) )`; the relationship must exist, inactive.
- Fabric "TMDL relationships.tmdl": `isActive` is `true` by default; `false` for an inactive relationship (its example
  writes `isActive: false` before the columns).
- Why (a) and not (b) by default: Sales[Date] -> Calendar and Sales[Date] -> Gulf Calendar are two table pairs, so Learn's
  rule alone does not say Desktop refuses it; but two date tables filtering the same column side by side break the
  model's own time intelligence (a DATESYTD on Calendar[Date] ignores a Hijri slicer on Gulf Calendar, since that
  filter reaches Sales, not Calendar). Through Calendar, a Gulf Calendar slicer filters Calendar's rows, so every
  existing measure follows it, and the new relationship has the exact shape the laptop applied (fromColumn, toColumn).
  (b) inactive filters nothing until a measure turns it on, so it is the fallback only. (c) would change the model's
  own table and every measure on it: never from a script.

## Plan (before the code commit)
1. This note, pushed first.
2. Red first: `test-0.3.1-gc3.mjs` on the base (the sample and made-up models: two facts on one Calendar, a Calendar
   whose Date relates onward, no date table, an inactive existing relationship, an automatic LocalDateTable_).
3. The fix at the cause: `addGulfCalendar`'s relateTo loop reads the model's relationships (metadata only); the script
   writes `isActive: false` only for (b); the answer's `relationships` says "inactive" there; `relationshipsWhy` (EN) in
   the answer and the plan's write line, the Arabic on the Arabic approval page (writesAr); a step by hand for (b).
4. `test.mjs` part gulf-calendar: the health fixture's Sales[Date] relates to Calendar[Date], so its expectation
   `fromColumn: Sales.Date` becomes `fromColumn: Calendar.Date` (the bug's own expectation; no count changes).
5. Suites, lint, checks; `--keep-going` once on the last code commit.

## Results
(filled after the runs)

## CHANGELOG line
- **The Gulf calendar never gives a date column a second date table:** when a date column you ask add_gulf_calendar to
  relate already belongs to your model's date table (Sales[Date] to Calendar[Date]), the script relates the Gulf calendar
  to that date table instead, so your measures follow its Hijri and Ramadan columns through your own calendar. Where that
  can't be done, the relationship is added inactive and the plan shows how a measure uses it (USERELATIONSHIP). The plan
  and the approval page say which and why, in English and Arabic, and the step by hand names your date table, not your
  sales table, when you relate it yourself.

## Decisions I made
1. (a) by default, (b) as the fallback, (c) never (the "Why" under Evidence). The redirect follows one hop only: the date
   table's Date must have no active relationship of its own to another table (else (b)), so the script never adds a
   second active relationship from any column, the date table's included.
2. Only active relationships count: a relateTo column whose existing relationship is inactive gets the active one as
   today (one active path per column). Power BI's automatic date tables (LocalDateTable_, DateTableTemplate_) are not
   a date table here: a column related only to one is related as today.
3. Two relateTo columns that lead to the same date table give one relationship (Calendar[Date] once), both said.
4. A date table is "the table at the other end of an active relationship from a date column, whose column is a date
   (or of a type the files don't give)": no name or "marked as date table" guess; metadata only (the model's relationships).
5. `relationshipsWhy` (EN) is a new key of the answer only when a relationship is not the one asked as it is; the Arabic
   goes only to the approval page (writesAr), not into the answer. The answer's `relationships` adds ", inactive" for (b).
6. The USERELATIONSHIP example names `[Your measure]`, never a measure of the model.
7. The tour's step 3 call (no relateTo) still relates nothing, but its step by hand said "drag each date column onto
   Date": the same second relationship, by hand. With no relateTo, the step now names the model's date table's Date
   ("Relate Calendar[Date] to ... never drag those onto ... too") when the model has one; else as before.
8. The script's text changes only for a relateTo column already related (the fromColumn line; `isActive: false` first
   for (b), as Learn's TMDL example). No golden holds a Gulf calendar script, so goldens are unchanged byte for byte.
9. One existing expectation changed: `mcp/test.mjs` part gulf-calendar pinned `fromColumn: Sales.Date` on the health
   fixture, whose Sales[Date] already relates to Calendar[Date]: the bug itself. Now `fromColumn: Calendar.Date` and no
   isActive; same number of checks.

## For the laptop
The sample (`Gulf Retail Sample`), tour step 3 with relateTo: "Add the Gulf calendar to the sample ... and relate it to
Sales[Date]" (add_gulf_calendar `relateTo: ["Sales[Date]"]`):
1. The plan and the approval page (EN, then once with `lang: "ar"`): the write line says Sales[Date] already relates
   to "Calendar", so the script relates "Gulf Calendar" to Calendar[Date] instead; no second relationship to Sales[Date].
2. TMDL view, a new tab, paste the script, Preview: one new table "Gulf Calendar" and 1 new relationship, Calendar.Date
   -> 'Gulf Calendar'.Date; Problems 0; nothing changed or replaced. Apply; Home > Refresh.
3. Model view: Calendar -> Gulf Calendar (solid line, many to one, single direction); Sales -> Calendar unchanged; no
   line from Sales to Gulf Calendar. A slicer on Gulf Calendar[Hijri Month Name] filters a card of [Total Sales].
4. Not seen in any Desktop yet: the (b) shape (`isActive: false`); if the owner wants it proved, the made-up model of
   G3 (`chain`) in `mcp/test-0.3.1-gc3.mjs`: Preview shows the relationship inactive, Model view dashed.

## Seen, not in scope
1. The engine branch `lab/rc031-proof` (RESULTS.md, section 6) is not on this repo's remote: I worked from the brief's
   description of step 3; the tour's own call has no relateTo, so the laptop's agent added Sales[Date] itself.
2. The approval page's input row "Related to the new table's Date: Sales[Date]" still lists the columns as asked; the
   write line under it says what the script relates. Changing the row's label is approval-window work, not done here.
3. check_model_health's gulfCalendar fix (`gulfFixInputs`) proposes no relateTo; unchanged.
