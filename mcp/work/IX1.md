## Summary
- **Approval:** the owner, 11 Nov, D-1111-15: "I need two more fable sessions for new ideas that would make this mcp one of
  kind" (relayed by the hub, session_015Q77oNR7YVFznptSuZoZZ2). IX1 is the inside-out half (our own parts combined); OX1
  works outside-in. The builder finds the idea with evidence, proves a first stage, never merges.
- **Base:** `feat/0.3.3-ix1` from `origin/integration/0.3.3` at 2960587c. Push only this branch; never merge, no PR.
- **Scope:** phase 1 (this note, before any code): our unusual parts with evidence, the combinations, 5 ranked ideas, one
  winner. Phase 2: the winner's first stage as a new library module (or `lab/ix1-*`) with tests red first, its tests.json
  line, its MODULES.md row, one demo on made-up models, the plan for stages 2 to 4, the owner's asks. Nothing a tool
  writes or answers changes. Out: OX1's files, `mcp/CHANGELOG.md`, any edit of an existing module beyond one export line.
- **Expected checks:** `node scripts/check-modules.mjs --strict`; the new suite's own number (written in "The first stage"
  before the code); every existing suite untouched; lint 0; CI on this branch.
- **Resume:** phase 1 written and pushed (the winner: like for like in the Gulf). Next: the fixture and the suite (red), then the two modules.

## Phase 1: our parts, the combinations, the ranking (written 2026-11-11, before any code)
Read end to end: MODULES.md (every row), HX1.md and HX2.md, the Gulf engines, the gate, the lineage, ARABIC-STYLE.md.
Every number is from a run I made on this branch at 2960587c, on made-up fixtures only.

### 1. The parts nobody else has together (evidence)
| part | where | what a run or the file says |
|---|---|---|
| the approval window and its plan | `lib/plans.mjs:15` (ids live 2 h), `:30` (a Map in the process), `:75-78` (the click recorded against the binding); `lib/artifact.mjs:28` (the files' digest), `:31` (the model's print), `:33` (the binding of the three) | an approval is exact and is gone when the process ends: nothing on disk says "this is what the person approved" |
| the twin | `assets/js/report-mirror.js:110` (`mirrorVisual`), `lib/same-question.mjs:168` (the copy asks the same question) | HX1 measured: the mirror twice gives 7 of 17 visuals back |
| the design engine and the page-fill measure | `assets/js/design-metrics.js:368` (`pageFill`: the largest hole, the flattest chart, the rows' balance) | FB3's ground; not touched here |
| the Gulf calendar | `assets/js/gulf-dates.js:15-30` (Ramadan and both Eids for 13 Hijri years, 1439 to 1451, each sourced; `checked` at `:13`, later dates marked `estimate`), `:47-56` (each GCC country's weekend and the day it changed), `:66-73` (the VAT rate by date); `assets/js/gulf-measures.js:5-7` | the file's own measurement: its Hijri pairing is right on 379 of 383 Ramadan days and "SAMEPERIODLASTYEAR pairs 0 of 383 right". My run on the table: in 41 of the 144 months of 2019 to 2030, a month and the same month a year before hold different numbers of Ramadan or Eid days |
| the Arabic layer | `content/ARABIC-STYLE.md:6-16` (five rules, the owner's), `lib/terminology.mjs:158` (one approved term a field), `lib/model-culture.mjs:18` (six Gulf cultures), `:8` (no linguistic metadata, on purpose) | never translated silently: every Arabic line is approved |
| the model reader and the health check | `assets/js/model-health-engine.js:86` (`graphStep`, the one dependency graph), 37 rules (`health-rules.js`), `assets/js/health-confirm.js:231` (a list of 30 time-intelligence functions, used only to ask about an unrelated table), `:72` (`calls`, a reader of a DAX call's arguments, not exported: `:278`) | the health check knows which DAX is time intelligence and never says which visual shows it |
| Impact check's lineage | `lib/lineage.mjs:126` (`lineageOf`: each visual's nodes with the path that reached them), `:237` (`reachOf`); `lib/impact.mjs:36`, `:68` | run: `reachOf(Souq, [Revenue LY])` = 1 visual (the line by month, through [Growth %]) |
| the validator and the schemas | `lib/check-schema.mjs:29` (the pinned schema commit), `:55` | offline, every file against the schema it names |
| never data values | `lib/answer.mjs:15`, `:27` (the one way out, 40,000 characters); `lib/lineage.mjs:43` (what is not proved, said every time) | 14 suites plant a value or a canary and look for it in the answers |
| the made-up corpus and the suites | `mcp/tests.json` (run: 246 suites listed), `mcp/test-0.3.1-mutation.mjs:26` (the mutants), `mcp/test-models/` (4 models), `mcp/fixtures/hx1-souq.mjs` | every claim can be planted and counted without anyone's data |
One more fact the list turned up: DataArcus itself writes the Gregorian comparison (`lib/flip-cards.mjs:103`,
`lib/dax-functions.mjs:163`, `:181`: `SAMEPERIODLASTYEAR`), and asks about the Hijri grain only while a NEW report is
planned (`lib/gulf-date-questions.mjs:33`). `gulf-health.js:329` says a model lacks Ramadan measures; nothing says
which visuals of an existing report compare Ramadan days with ordinary days.

### 2. The five combinations, ranked
**1. Like for like in the Gulf (the winner).** *What:* for each visual, by the lineage, whether its number passes
through a comparison with the same Gregorian dates of another period (a year, a quarter, a month back); then, from
DataArcus's own sourced dates, month by month, what makes those two periods different in the Gulf: Ramadan days, Eid
days, a weekend that changed, a VAT rate that changed. *Parts:* the lineage (`lineage.mjs:126`) + the DAX reader
(`dax-reference-parser.js:16`) + the dates table (`gulf-dates.js:15-73`) + the fix that already exists
(`gulf-measures.js:68`, written through `add_gulf_calendar` and the approval window) + the Arabic layer for the
sentence. *What a user sees:* "2 of 12 visuals compare with the same dates a year back, through [Revenue LY]. In 2026
against 2025, 5 of 12 months are not like for like: February has 11 Ramadan days against 0, March 19 against 29 ...
The model has no measure that compares the same Ramadan days; DataArcus can write it, after your approval." *Why hard
to copy:* it needs four things at once: a report-to-measure lineage on files, a sourced table of announced Gulf dates
kept current, the like-for-like measures (measured on 383 days), and a rule that lets the answer be trusted (no value
is read, so the sentence is about the calendar, never about the person's numbers). An AI writing DAX reaches for
`SAMEPERIODLASTYEAR` by default; this is the check that says what that costs here. *It compounds:* stage 2 is a lens
of `check_report` (the Arabic lens's sibling), stage 3 turns each finding into the plan of the exact measures, stage 4
is a free page on the website from the same engine, and the weekend and VAT rows come at no extra cost. *First stage:*
one engine, one library, a suite, a demo: a day. *Risk:* wording. It says "are not like for like", never "is wrong";
dates after `checked` are estimates and are said so; it cannot know which years the person's data holds, so the years
are asked or all are summarised.
**2. The picture of an edit before it happens.** A TMDL script (ours or another tool's) applied to the model in
memory, compared by the lineage, and the approval page draws each page with the visuals it can move outlined
(`lineage.mjs:209` + `page-preview.js` + `approval-view.mjs:125`). *Loses because:* it is the Impact check's next step
(HX1's stage 4 neighbour), not a new part; a script applied in memory needs a TMDL-script reader we do not have
(`tmdl-model.js` reads a project's files, not a `createOrReplace` script); and the approval page is user-visible in
two languages, so a day proves little.
**3. The promise checked on the way out.** The values a model's and a report's files hold (DAX string literals,
filter and slicer values, M literals) collected at read time and looked for in every answer before it leaves
(`answer.mjs:15`), plus a local record of what was read, sent, approved and written. *Loses because:* the promise is
already kept by 14 suites; a person sees nothing new until something goes wrong; a value that is also a name is a
false alarm; and its effect needs an edit of `answer.mjs`, which this job may not make.
**4. One approved Arabic glossary, every place.** The terminology sheet feeding the twin, the model's translations
and what Copilot is told about the model. *Loses because:* the first two exist (`terminology.mjs:158`,
`model-culture.mjs:54`) and the third rests on Microsoft's formats and retirements (`model-culture.mjs:8`), which is
outside-in work (OX1's), needs Desktop or the service to measure, and needs the owner's Arabic.
**5. The exam for AI-built reports.** The golden tasks, `check_report` and the mutants as a public score for a report
any tool wrote. *Loses because:* it is a product about other tools, not a capability a person meets in the MCP; its
value is in how it is published, which is the owner's and OX1's ground.
HX1's candidates 2 (one change ledger) and 3 (the mirror backwards) are not built on: no new angle found that a day
could prove.

### 3. The first stage, and its expected numbers (before the code)
Two new files, nothing existing changed but two `export` words in `fixtures/hx1-souq.mjs` (`visual`, `page`):
- `assets/js/gulf-compare.js` (an engine, so the website can share it): `monthsCompared({ year, back, country })`:
  each month of `year` beside the month `back` months earlier (12 = a year): Ramadan days, Eid al-Fitr days (3), Eid
  al-Adha days (4), the weekend and the VAT rate when a country is given; `estimated` when a date is after `checked`;
  `rangeCompared` for the summary by year. From `gulf-dates.js` only.
- `mcp/lib/like-for-like.mjs`: `comparisonsIn(dax)` (the Gregorian period comparisons a DAX text makes: the function,
  the unit, how far), `likeForLike(model, report, { year, country })` (each visual that reaches one, with the chain of
  names from the lineage; each comparison measure and how many visuals show it; whether the model has the measure that
  compares the same Ramadan days; the months; one sentence; what is not proved).
The fixture, designed first (`fixtures/ix1-souq-gulf.mjs`, Souq plus 7 measures, one report measure and 6 visuals: 17
visuals, 16 with a query), and the numbers worked out by hand from it and from the dates table:
| # | check | expected |
|---|---|---|
| G1 | 2026 against 2025 (UAE dates) | 5 months differ: Feb Ramadan 11/0; Mar Ramadan 19/29, Fitr 3/2; Apr Fitr 0/1; May Adha 4/0; Jun Adha 0/4; none estimated |
| G2 | 2025 against 2024 | 2 months: Mar Ramadan 29/21, Fitr 2/0; Apr Ramadan 0/9, Fitr 1/3 |
| G3 | 2019 to 2030, a year back | 41 of 144 months (my scratch count above, by its own loop) |
| G4 | 2027 against 2026 | 2 months, both estimated |
| G5 | the weekend: UAE 2022 against 2021; KSA the same years | UAE 12 months (Sat + Sun against Fri + Sat); KSA 2 (Ramadan only) |
| G6 | VAT: KSA 2020 against 2019; Oman 2021 against 2020; Bahrain 2022 against 2021 | Jul to Dec 15 against 5; Apr (0 and 5 against 0) to Dec: 9 months; 12 months 10 against 5 |
| G7 | Oman's own announcement, Feb 2026 | 10 Ramadan days (the UAE's 11) |
| G8 | a month back, 2026 | 5 months differ (Feb to Jun); Mar Ramadan 19 against Feb's 11 |
| G9 | outside the table (2018 against 2017, 2031) | not known, said, no number |
| B1 | Souq Gulf: the visuals that reach a comparison | 4 of 16: line-growth-by-month, card-growth, card-units-ly-report, table-month-compare; 5 comparisons |
| B2 | the comparison measures | 6: [Revenue LY] 2 visuals, [Revenue PM] 1, [Units PY] 1, [Units LY (report)] 1, [Cost LY] 0, [Revenue Prev Day] 0 |
| B3 | not a comparison | [Revenue YTD], [Revenue Last Ramadan], a string and a comment that hold the function's name; gulf-measures' own 8 measures: 0 |
| B4 | the base and the like-for-like measure | [Revenue LY]: base [Revenue], has [Revenue Last Ramadan]; [Units PY]: base [Units], none |
| S | safety | a planted literal in a comparison's DAX and in a filter is in no answer; no hash; inputs and the dates table unchanged; a missing model or report: no throw |
About 50 checks, suite `ix1`, area `checker`; red first on 2960587c (no module). The demo (`lab/ix1-like-for-like-demo.mjs`)
prints Souq Gulf for 2026.
