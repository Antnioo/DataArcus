## Summary
- **Approval:** the owner, D-1104-01 (4 Nov): "Agree on all r&ds": RD5 (Gulf measures) approved as its recommendation;
  this job is RD5's builder brief (g), word for word (`rd/0.3.2-gulf-measures`, `mcp/research/RD5-gulf-measures.md`).
- **Base:** `feat/0.3.2-gm1` from `origin/integration/0.3.2` at 1691046. Push only this branch; never merge, no PR.
- **Scope:** (1) `assets/js/gulf-measures.js` (new, UMD): the Ramadan and Eid DAX builders out of measure-builder.js;
  the page calls it, its output byte-identical. (2) `gulf-dates.js`: `vat` (rules by country) and `pegs`, each with
  its `checked` date; sources in `scripts/gulf-calendar/DATES-SOURCES.md`. (3) `calendar-generator.js`: an
  off-by-default `vat` option, a `VAT Standard Rate %` column. (4) add_gulf_calendar: `measures` (max 5, each a
  measure of the model), `vat`, `pegs` (both off unless given); measures on the new table, free names; pegs 6 rows, KWD
  no rate. (5) the suite `test-0.3.2-gm1.mjs` (area model); the website suite gulf-calendar (page unchanged).
- **Expected (RD5 d):** the pairing right on 379 of 383 Ramadan days 1439-1451, 4 day-30s; SAMEPERIODLASTYEAR 0 of 383;
  flat made-up sales +4.2 / 0.0 % (1445 / 1446), SAMEPERIODLASTYEAR +28.2 / +24.7 %. VAT 0 disagreements 2017-2026.
- **Expected checks:** gm1 about 45, red on 1691046; model 19 suites -> 20; gulf-calendar (website) + 6; fx1 22 x 3;
  no other number moves. Plan answer, default inputs: 3,778 -> 3,778.
- **Base numbers (1691046):** model 19 suites all pass; fx1 22 / 22 / 22; plan answer 3,778; gulf-calendar 907 (base
  worktree, below), dax 51, tools 399.
- **Got:** gm1 **51 checks**, red on the base first: 42 of 51 failed there (commit ce9b1da; the 5 guards green there:
  the pairing on the base calendar, the default script unchanged). After: 51 of 51; every RD5 number measured again
  from the script itself (379 / 383, 4 day-30s, 0 / 383, +4.2 / 0.0, +28.2 / +24.7; VAT day counts and 10 edges).
  model 20 suites, every other suite's number unchanged. Website: gulf-calendar 907 -> 913 (+6, the page's 6
  captures), dax 51, tools 399 unchanged. fx1 22 x 3. Plan answer 3,778 -> 3,778 (+0); with all three options 5,436.
  Lint 0; site config, check-min (stamps), csp, agent-memory, changelog-words pass. integration/0.3.2 did not move
  (1691046): no merge. **CI green: https://github.com/Antnioo/DataArcus/actions/runs/41768316430 on 09fa81a** (first
  run, every job green on Linux, macOS and Windows). **State: DONE.**
- **Resume:** none; the reviewer's review and merge.

## The plan
1. This note; the base capture of the page's 8 Ramadan and Eid measures (`scripts/tests/capture-gm1-baseline.mjs`,
   `fixtures/gulf-calendar/gm1-measures.json`: 3 settings x EN, AR). Commit, push. (done: ec661f2)
2. `test-0.3.2-gm1.mjs` first, red on the base: B shared builder = the page's capture, P pairing, V VAT, N names,
   S script, K pegs, R refusals, A the tool's answer and plan line EN and AR. (done: ce9b1da)
3. The engines; measure-builder.js calling the shared one; build:min; new ?v= stamps; csp. (done: b7a4d8a)
4. gulf-calendar.mjs (lib) and the tool: the 3 inputs, the plan line, the description; TOOLS.md. (done: b7a4d8a, then)
5. Answer sizes, fx1 x3, CHANGELOG, WORK.md, areas, lint, sitemap, merge in once if moved, CI. (done: CI green)

## CHANGELOG line
"**Ramadan and Eid measures with the Gulf calendar:** add_gulf_calendar can add, for up to 5 of your measures, the same
Ramadan days of the Hijri year before (not the Gregorian last year, which pairs no Ramadan day with its own), its growth
and the Eid windows, the website's own measures; on request also a dated standard VAT rate column for your country and
a table of the Gulf currency pegs (the Kuwaiti dinar a basket, with no rate). Every rate and date is sourced; nothing is
tax advice, and your amounts are never read."

## Decisions I made
- `vat` and `pegs` are optional with no default (false when absent), not `.default(false)`: a default would put
  `vat: false, pegs: false` in every calendar plan's pins, so every calendar approval page (and sp23's records) would
  change for nobody's ask. Plans without them pin exactly what they did.
- The VAT column is a calendar-engine option (`st.vat`, a country code), built like weekendDax; the website page never
  sets it and drops unknown saved keys, so its table is byte for byte what it was. The value is in percent (5, not
  0.05), as RD5 measured it; the column's description says "5 means 5 %".
- The measures' display folder is "Ramadan and Eid" (one folder for every base); the value measures keep the base
  measure's format (#,0 when it has none), the % ones 0.0%. Descriptions: the page's English text, plus the day-30
  rule on Last Ramadan and its %.
- The pegs table: a table constructor in SELECTCOLUMNS (KWD's rate `BLANK ()`), columns Currency, Per USD, Regime,
  Central Bank, Source, Checked (a date); no conversion measure (RD5 e).
- A note in the answer when measures are written: they follow the new table's dates (its Hijri Year and Ramadan Day
  on the visual; related to the facts); a filter on another date table is not moved back a Hijri year.
- The tool's Arabic country name is gulf-health.js's `nameAr` (one list).
- Each source re-read on 4 Nov, as far as the sites allowed from the cloud: DATES-SOURCES.md says row by row what was
  read where (below, "For the owner").

## For the owner
- **7 public facts not re-read on the authority's or bank's own page** (their sites refused requests from the cloud
  on 4 Nov): the UAE's VAT start date (1 Jan 2018), Bahrain's 10 % date (1 Jan 2022), and the AED, SAR, QAR, BHD and
  OMR pegs. They keep RD5's reading (3 Nov) and the rows say so; Saudi Arabia, Oman, Qatar and Kuwait VAT are
  confirmed by PwC's tax summaries (reviewed 2026), the KWD basket on the Central Bank of Kuwait's own page.
  **Recommendation:** the laptop reads the 7 on the official pages before the release (step 7 below); the job goes on
  with them as they are.

## Risky changes
- measure-builder.js now needs `window.DataArcusGulfMeasures`: both pages (EN, AR) load gulf-measures.min.js before
  it, each with the new stamp `20261104gm1`; the gulf-calendar suite reads the page's output in EN and AR.
- `mcp/lib/gulf-calendar.mjs` imports `freeNamer` from model-script.mjs, which imports gulf-calendar.mjs: an ES module
  cycle of function declarations only (hoisted), used at call time.

## Seen, not in scope
- `gulf-health.js` finds the Ramadan measures by name suffix only (RD5's Seen): a measure renamed "... 2" here is not
  counted by the check either.
- The approval page's "Inputs" table has no plain-words row for `measures`, `vat`, `pegs` (approval-disclosure.mjs's
  INPUT_WORDS; out of scope): they show in the raw fold, and the plan's line says them in plain words, EN and AR.
- `npm test -- --affected` fails in this cloud checkout (git: "Use '--' to separate paths from revisions").
- The local `npm test -- --keep-going` was stopped part way once CI was green (CI runs every suite on 3 systems;
  no FAIL line in the part that ran).
- `npm run build:min` rebuilds tracked .min.js files only: a new engine's .min.js must be `git add`-ed first.

## For the laptop
One batched run, made-up data only (the Gulf Calendar test model, `scripts/gulf-calendar/test-model`, and the sample
project). Never the "MCP Engine for Power BI" connector.
1. (f1) Build the test model as its README steps 1-2. Call add_gulf_calendar on it with `measures: ["Sales[Total
   Sales]"]`, `vat: true`, `country: "ksa"`, `pegs: true`, 2016-2030, `name: "GM1 Calendar"`; approve; open the script
   in TMDL view, **Preview: two new tables (GM1 Calendar with 8 measures, Gulf Currency Pegs), nothing changed or
   replaced.** Any replaced table: stop. Apply, refresh.
2. (f2) Relate Sales[Date] to GM1 Calendar[Date]. A table visual: Hijri Year 1445 and 1446 x Ramadan Day, Total Sales
   and Total Sales Last Ramadan: day 5 meets day 5; 1445's day 30 blank on the Last Ramadan side. Cards: vs Last
   Ramadan % for 1445 and 1446, and a measure `CALCULATE ( [Total Sales], SAMEPERIODLASTYEAR ( 'GM1 Calendar'[Date] ) )`
   beside them. The test model's sales are not RD5's flat ones: record the numbers; the check is the pairing (day N
   with day N). A day paired otherwise: stop.
3. (f3) Eid al-Fitr window of 1446 (Hijri Year 1446 filter, Total Sales Eid al-Fitr Window): it covers 2025-03-23 to
   2025-04-01 (a table of Date with the measure: 10 days with values).
4. (f4) VAT Standard Rate % (ksa) on 2020-06-30 and 2020-07-01: 5 and 15. Again with `country: "bhr"`: 2021-12-31 and
   2022-01-01: 5 and 10; `omn`: 2021-04-15 and 2021-04-16: 0 and 5.
5. (f5, for later, way 2) With "Enhanced DAX Time Intelligence" on, a Hijri calendar on the table:
   `SAMEPERIODLASTYEAR` and `DATEADD ( -12, MONTH )` at Ramadan Day grain against RD5's C (233 / 383) and D
   (379 / 383); record what Desktop gives for a missing day 30.
6. (f6) The pegs table: 6 rows, KWD's Per USD blank; the descriptions of the measures, the VAT column and the pegs
   table show in the Data pane on hover.
7. Read on the official pages: tax.gov.ae (VAT 5 % from 1 Jan 2018), nbr.gov.bh (10 % from 1 Jan 2022), centralbank.ae
   (3.6725), sama.gov.sa (3.75), qcb.gov.qa (3.64), cbb.gov.bh (0.376), cbo.gov.om (2.6008 per rial). Record each
   sentence in DATES-SOURCES.md; any figure that differs: stop and report.

## Lessons for the reviewer
- The base capture (commit 1) is what proves "byte-identical": the page's own output read in a browser on the base,
  compared on this branch by the website suite, and the shared builder compared with it in Node (B2).
- P checks evaluate the pairing from the script's own DATATABLE of Hijri month starts, not from the engine's
  functions, so they test what the person applies.
