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
- **Base:** `fix/0.3.1-gc3` from `origin/integration/0.3.1` (b94f2b5). Push only this branch.
- **Rule (evidence: Microsoft Learn, below):** a relateTo column that already has an active relationship to a date
  table is never related to the Gulf calendar a second time. (a) The Gulf calendar is related to that date table's Date
  instead (Calendar[Date] -> Gulf Calendar[Date], many to one, single direction: the shape Desktop applied); (b) only
  where that Date is itself already related onward, the relationship is added inactive (`isActive: false`) and the
  answer says how to use it (USERELATIONSHIP). (c) Replacing the model's calendar is never offered by the script.
  No date table: unchanged.
- **Expected checks:** `gc3` new, 18 checks (red on the base: 13 failed; then PASS); `-- model` 13 -> 14 suites PASS,
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
(filled with the code commit)

## Decisions I made

## For the laptop

## Seen, not in scope
