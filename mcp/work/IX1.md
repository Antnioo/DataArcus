## Summary
- **Approval:** the owner, 11 Nov, D-1111-15: "I need two more fable sessions for new ideas that would make this mcp one of
  kind" (relayed by the hub, session_015Q77oNR7YVFznptSuZoZZ2). IX1 is the inside-out half (our own parts combined); OX1
  works outside-in. The builder finds the idea with evidence, proves a first stage, never merges.
- **Base:** `feat/0.3.3-ix1` from `origin/integration/0.3.3` at 2960587c. Push only this branch; never merge, no PR.
- **Scope:** phase 1 (this note, before any code): our unusual parts with evidence, the combinations, 5 ranked ideas, one
  winner. Phase 2: the winner's first stage as a new engine and a new library with tests red first, the tests.json
  line, two MODULES.md rows, one demo on made-up models, the plan for stages 2 to 4, the owner's asks. Nothing a tool
  writes or answers changes. Out: OX1's files, `mcp/CHANGELOG.md`, any edit of an existing module (one `export` word in
  a fixture, `fixtures/hx1-souq.mjs`: `visual`).
- **Expected checks:** (written before the code: "about 50 checks", the table in phase 1) **got:** new suite `ix1`
  (`mcp/test-0.3.3-ix1.mjs`, area checker) 64 checks, red on 2960587c first (61 of 63 failed: no module; the 64th, one
  day said as "1 Ramadan day", red on its own before its fix). Every row of the table as written. checker 15 suites
  passed, hx1 59 and hx2 43 unchanged; `node scripts/check-modules.mjs --strict` PASS 1244 (223 files, 223 rows),
  check-contracts PASS 858, check-result-lines PASS 247, check-agent-memory PASS 518, check-min: all 142 match (no new
  .min.js: no page loads the engine), `node scripts/test-site-config.mjs` PASS, lint exit 0; the 16 suites that list
  `assets/js` run one by one, each PASS with its number unchanged.
- **Resume:** DONE. Stage 1 built and pushed (7c4daaa0). The reviewer: review and merge (nothing user-visible). The
  owner: "For the owner" 1 to 5. Next builder: "Next stages" 2.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/43051896471 on 7c4daaa0e20ad540c29ffffc18e25ddfa7d9eb51
  (2026-11-11T17:17Z; Linux 5 of 5 shards, Windows 5 of 5, the website 3 of 3, macOS skipped by the workflow;
  origin/integration/0.3.3 had not moved from 2960587c, so nothing to merge in). Green on the fifth attempt: four
  times the website shards stopped in "Install Chromium" ("Temporary failure resolving 'azure.archive.ubuntu.com'",
  the runners' DNS; no suite had started), each rerun with "rerun failed jobs", no commit between; meanwhile the 50
  website suites passed here on the same commit. DONE, CI green on 7c4daaa0 (run 43051896471).
- **Result:** on a made-up report, 4 of 16 visuals are named as comparing with the same Gregorian dates of another
  period, each with its chain ("[Growth %] uses [Revenue LY]"), and for 2026 against 2025 the 5 months that are not
  like for like in the Gulf are listed with their Ramadan and Eid days; `node lab/ix1-like-for-like-demo.mjs`.

## Phase 1: our parts, the combinations, the ranking (written 2026-11-11, before any code)
Read end to end: MODULES.md (every row), HX1.md and HX2.md, the Gulf engines, the gate, the lineage, ARABIC-STYLE.md.
Every number is from a run I made on this branch at 2960587c, on made-up fixtures only.

### 1. The parts nobody else has together (evidence)
| part | where | what a run or the file says |
|---|---|---|
| the approval window and its plan | `lib/plans.mjs:15` (ids live 2 h), `:30` (a Map in the process), `:75-78` (the click recorded against the binding); `lib/artifact.mjs:28` (the files' digest), `:31` (the model's print), `:33` (the binding of the three) | an approval is exact and is gone when the process ends: nothing on disk says "this is what the person approved" |
| the twin | `assets/js/report-mirror.js:110` (`mirrorVisual`), `lib/same-question.mjs:168` (the copy asks the same question) | HX1 measured: the mirror twice gives 7 of 17 visuals back |
| the design engine and the page-fill measure | `assets/js/design-metrics.js:368` (`pageFill`: the largest hole, the flattest chart, the rows' balance) | FB3's ground; not touched here |
| the Gulf calendar | `assets/js/gulf-dates.js:16-30` (Ramadan and both Eids for 13 Hijri years, 1439 to 1451, each sourced; `checked` at `:14`, later dates marked `estimate`), `:50-58` (each GCC country's weekend and the day it changed), `:70-75` (the VAT rate by date); `assets/js/gulf-measures.js:5-7` | the file's own measurement: its Hijri pairing is right on 379 of 383 Ramadan days and "SAMEPERIODLASTYEAR pairs 0 of 383 right". My run on the table: in 41 of the 144 months of 2019 to 2030, a month and the same month a year before hold different numbers of Ramadan or Eid days |
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
(`dax-reference-parser.js:16`) + the dates table (`gulf-dates.js:16-75`) + the fix that already exists
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

## Before -> after (stage 1, 2026-11-11T15:46Z)
- **Before (2960587c).** On Souq Gulf (17 visuals, 4 of them on a comparison by Gregorian dates) the health check gives
  5 findings (keys summarised, keys visible, a calculated column, no descriptions, no row-level security) and the Gulf
  calendar check one (`GC_NO_HIJRI`): none names a visual or a comparison. `check_report` has no word for it. The Gulf
  date questions are asked only for a new plan (`gulf-date-questions.mjs:33`).
- **After.** `assets/js/gulf-compare.js` (an engine, pure, no page loads it; MODULES.md row beside `gulf-measures.js`)
  and `mcp/lib/like-for-like.mjs` (pure by `check-modules --strict`: no `fs`, no `process.env`; row: used by "none (a
  test)"). The demo's first sentence, from the run: "4 of 16 visuals compare with the same Gregorian dates of another
  period (through [Revenue LY], [Revenue PM], [Units LY (report)], [Units PY]). One year back, 2026 against 2025: 5 of
  12 months are not like for like in the Gulf (February: 11 Ramadan days against 0; March: 19 Ramadan days against 29,
  3 Eid al-Fitr days against 2; April: 0 Eid al-Fitr days against 1; May: 4 Eid al-Adha days against 0; June: 0 Eid
  al-Adha days against 4)." It lists 6 comparison measures (2 of them shown by no visual), says [Revenue] has its
  [Revenue Last Ramadan] and that [Cost Last Ramadan] and [Units Last Ramadan] are missing. With `uae` and 2022: 12 of
  12 months, "the weekend changed (Saturday + Sunday against Friday + Saturday)". With `ksa` and 2020: "The standard VAT
  rate differs in 6 of the 12 months". Without a year: "2019 to 2030: 41 of 144 months".
- **The table: every row as written before the code** (G1 to G9, B1 to B4, S). Added while writing the suite, each
  worked out from the dates table first: G10 (December 2030 holds 6 days of Ramadan 1452), G11 (a year ahead), G12 (an
  unknown country), D1 to D14 (one DAX text), A1 to A9 (the answer), S5 and S6.
- **Nothing a tool does changed:** no file of `mcp/tools/`, `server.mjs`, `mcp/lib/` (but the new one) or an existing
  engine is touched; no suite's number moved; CHANGELOG untouched; no page, no stamp, no `.min.js` changed.
- **What it does not prove** (`NOT_PROVED`, in every answer): no data is read, so which years the data holds and
  whether this business moves with Ramadan are the person's; a comparison written without a time-intelligence function
  and a calculation group's items are not seen; dates after 2026-05-27 are estimates; a private company's weekend can
  differ.

## Decisions I made
1. **The calendar half is an engine** (`assets/js/`), by the invariant "one engine per job, shared with the website":
   stage 4's page reads the same file. No page loads it yet, so it has no `.min.js` and no stamp (as `gulf-health.js`
   and `aggregation.js` have none).
2. **A 12-line reader of a DAX call's arguments (`callsOf`) on the engine's exported tokenizer, not an export of
   `health-confirm.js`'s `CF`.** I tried the export: one line, then `npm run build:min` changed 13 files (5 pages, 4
   engines and their `.min.js`), a website change outside this job's scope; I reverted it. Stage 2 makes
   the one reader ("Seen" 2).
3. **"Not like for like", never "wrong".** Whether a business's numbers move with Ramadan is not in the files.
4. **The year is the caller's.** Without one the answer is a summary by year and no month; never "the current year"
   (the Gulf date questions' own rule, `gulf-date-questions.mjs:48`).
5. **PREVIOUSYEAR and its family count as one period back; a shift by days is named and no month is compared; an
   amount set at run time is said so.** DATESYTD and the totals are not comparisons.
6. **The Ramadan partner is told by the Measure Builder's name** ("<base> Last Ramadan"), as the Gulf check does
   (`gulf-health.js:39`), and only for a comparison a whole number of years away.
7. **A Ramadan whose Eid is not in the table yet counts its first 29 days** (it has 29 or 30): December 2030 has 6.
8. **A month is "estimated" when a day it counts comes from a date marked `estimate`** in `gulf-dates.js`.
9. **tests.json: the suite's line only.** The new files are in no `affected` list, so a local `--affected` run picks
   every suite for them, the safe side.
10. **WORK.md's cap:** the file was at 3,190 of 3,200; I shortened HX2's entry to its note's path to add IX1's. 3,200 now.
11. **The demo writes nothing** (the model and the report are in memory).
12. **One `export` word, not the two phase 1 planned:** `visual` in `fixtures/hx1-souq.mjs`; `page` was not needed.

## Next stages (each a builder's job of a day at most)
2. **A lens of `check_report`** (ask 1): option `likeForLike: { year, country }`, section `likeForLike` beside
   `impactCheck`, read through `impact.mjs`'s reading, capped as it is (60 listed). The one DAX call reader: `CF`
   exported from `health-confirm.js` (a website change: stamps, `node scripts/test-site-config.mjs`), `callsOf` gone;
   a calculation group's items read. TOOLS.md, PRIVACY.md's row, CHANGELOG; the Arabic sentence after ask 4.
3. **The fix, through the approval window** (ask 2): from `lacking` to the plan of exactly those measures
   (`gulf-calendar.mjs`'s own measures path), the approval page saying which visuals compare today; no visual is
   rewired. DataArcus's own comparisons (`flip-cards.mjs:103`, `dax-functions.mjs:163`) say the sentence in their plan.
4. **The website and the laptop** (ask 3, ask 5): a free page from `gulf-compare.js` (a year, a country, the 12
   months), English and Arabic; one Desktop run on a shadow of Souq Gulf with made-up rows, [Revenue LY] beside
   [Revenue Last Ramadan] for March 2026.
Later, each its own decision: the year read from a DataArcus calendar's own range (`gulf-health.js:80`), a title that
says which comparison a visual makes, the Arabic twin carrying the sentence.

## For the owner
1. **Yes / no:** stage 2: `check_report` also says which visuals compare with the same Gregorian dates and in which
   months that is not like for like in the Gulf (an option, not a 12th tool).
2. **Yes / no:** stage 3: DataArcus offers the missing like-for-like measures as a plan, written after approval.
3. **Yes / no:** stage 4: a free page on dataarcus.com from the same engine ("is this month like last year's?").
4. **The words, yours to approve** (drafts, nothing ships with them): the name "like for like" in English. Arabic:
   «مقارنة غير متكافئة» for "not like for like" (why: «متكافئة» is what Arabic business writing says for "on equal
   terms"; the literal «المثل بالمثل» reads as "tit for tat"); «11 يومًا من رمضان مقابل 0» for "11 Ramadan days
   against 0" (why: «مقابل» is the everyday word in a comparison; «ضد» reads as "versus" in a contest).
5. **Laptop, when you batch:** the one Desktop run of stage 4 (about 15 minutes).
A proposed public sentence, true and plain: "DataArcus shows which visuals compare this period with the same dates a
year earlier, and in which months Ramadan or an Eid makes that comparison uneven."

## Risky changes
None in what ships: an engine no page loads, a library no tool loads, a suite, a fixture, a demo, one `export` word in
a fixture. The risk is in the next stage's sentence: it must keep "not like for like" (never "wrong"), keep the
estimates marked, and stay next to `NOT_PROVED`.

## Seen, not in scope
1. `mcp/tests.json`'s `affected` object holds duplicate keys at 2960587c ("everything" on lines 18 and 19; "checker",
   "model" and "report" twice under `areas`) and its `base` is `origin/integration/0.3.2`: a JSON reader keeps the last
   of each; only the local `--affected` run reads them.
2. Two DAX lexers and now three readers of a call: `tokenizeDax` (`dax-reference-parser.js:16`, exported), `CF.lex` and
   `CF.calls` (`health-confirm.js:25`, `:72`, not exported: `:278`), and my `callsOf`. One would do (stage 2).
3. Three lists of time-intelligence functions, each for its own question: `health-confirm.js:231` (30 names),
   `field-catalog.js:197` (`TIME_DAX`), `like-for-like.mjs` (`FIXED`, `BY_ARGS`: 11 names).
4. DataArcus writes `SAMEPERIODLASTYEAR` itself (`flip-cards.mjs:103`, `dax-functions.mjs:163`, `:181`) whether or not
   the model has the DataArcus calendar's Hijri columns.
5. `gulf-dates.js` ends at Ramadan 1452's first day (`:30`): 2031 cannot be compared until that year's row is added.
6. The brief says 243 suites; `mcp/tests.json` listed 246 before this job (247 with `ix1`).
7. `safeName` cuts a name at 60 characters (`read-report.mjs:36`): a long base measure's "<base> Last Ramadan" in
   `lacking` is cut too.

## Lessons for the reviewer
- "One export line" is not one line for an engine a page loads: the stamps made it 13 files here. A brief that allows an
  export could say "library modules only; an engine's export is a website change, name it in Seen".
- The fixture first, then the table, then the suite red, then the code (HX1's lesson) held again: every row of the
  table came out as written, and the run found only my English ("1 Ramadan days").
- WORK.md is at its cap to the character (3,200 of 3,200): the next builder's line needs an entry cut first.
- CI's website shards install Chromium from Ubuntu's mirror on every run: a DNS failure there cost four reruns
  (about 75 minutes). A cached browser, or a retry inside the step, would have hidden it.
- A discovery brief that lists the parts gets a parts list back; the fact that decided the ranking was not in the list
  (DataArcus's own measurement in `gulf-measures.js:5-7`, and that DataArcus writes the Gregorian comparison itself).
  Ask for "one fact the list did not hold".
