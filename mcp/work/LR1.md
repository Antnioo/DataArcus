# LR1 (0.3.1, the owner's laptop run of 26 Oct): five items found on integration/0.3.1 0f7f6e83

## Summary
- **Approval:** the owner's laptop run (26 Oct, Power BI Desktop 2.159.883.0) on `integration/0.3.1` 0f7f6e83; the
  reviewer verified item 1 in the code and approved all five; the brief "Go on LR1".
- **Scope:** `assets/js/pbip-query.js` (lastMonths, the date-column branch; + `.min.js`, new `?v=` stamps: the theme
  generator's builder list, then theme-generator.min.js on its 3 pages); `mcp/lib/arabic-names.mjs` (date compounds);
  `mcp/lib/report-run.mjs`, `mcp/tools/plan_layout.mjs` (the slicers the plan writes, named); `mcp/lib/approval-window.mjs`
  and `mcp/lib/sample-project.mjs` (the sample section in Arabic); `mcp/test-0.3.1-arabic-lens.mjs` (L1_DUMP's folder);
  `mcp/test-0.2.9b.mjs` (its two EDATE pins, the rule changed); a new suite `mcp/test-0.3.1-lr1.mjs`; `mcp/test-0.3.1-sq3.mjs`
  (the Arabic approval page suite, item 4's checks); CHANGELOG.
- **Base:** `fix/0.3.1-lr1` from `origin/integration/0.3.1` 0f7f6e8. Push only this branch; never merge, never a PR.
- **Expected checks:** lr1 about 22 checks, about 15 red on 0f7f6e8 (item 1: 3 of 8 red, the date branch; item 2: 4
  red; item 3: about 8 red); sq3 + 3 checks (3 red); 0.2.9b unchanged in count (two patterns read EOMONTH); arabic-lens
  with L1_DUMP in a missing folder: ENOENT before, PASS after; every suite named in the brief PASS before and after;
  the full run one more suite than the base.
- **Invariants:** no new write; metadata only (the plan names fields, never a value); the DAX keeps no comparison
  sign beyond the one it has.
- **Got:** lr1 18 checks (13 red on 0f7f6e8: A 3, B 6, C 4); sq3 28 -> 31 (LR1-4a, 4b red before); 0.2.9b 33 PASS;
  arabic-lens with L1_DUMP in a missing folder ENOENT -> PASS 31; report 28 -> 29 suites, arabic 10, core 6 PASS; run-all
  pbip + theme-generator 2 -> 2 PASS; full run "run-tests: 92 suites passed" (base registry 91 + lr1).
- **Resume:** done; waits for the reviewer, then the laptop ("For the laptop" below).

## The items, confirmed on 0f7f6e8
1. `pbip-query.js:422` (date branch): `IF ( MAX ( d ) > EDATE ( _last, -n ), 1 )`. A month's MAX date is its last day;
   EDATE(15 Jun 2026, -12) = 15 Jun 2025 < 30 Jun 2025, so June 2025 is kept: 13 months. It also keeps n+1 when the data
   ends on a month's last day and the month n back is longer (30 Jun 2026, n = 3: EDATE = 30 Mar < 31 Mar). The label
   branch (`:416`) compares the month's FIRST day with EDATE of the last month's first day: exactly n.
2. `pbip-bind.js:730`: the given slicers first, "a slot left over keeps the picker's"; the plan answer and the approval
   page's Fields row list only planFields.slicers, so Branches[Country] was bound unsaid.
3. `arabic-names.mjs` `phrase`: a name whose every word is in the glossary is joined word for word: "Year Month" ->
   «السنة الشهر», "Hijri Year" -> «الهجري السنة», and every other pair of date words alike (measured: 42 pairs).
4. `approval-window.mjs:519-520`: the sample's rows and its Tables rows are English keys and English values on the Arabic
   page (only the heading has its Arabic in HEAD_AR).
5. `test-0.3.1-arabic-lens.mjs:113`: `fs.writeFileSync(L1_DUMP)` without its folder.

## Plan
1. This note, pushed first; the base suites (report, arabic, core, run-all pbip theme-generator) on 0f7f6e8 in a
   separate worktree.
2. Red first, `mcp/test-0.3.1-lr1.mjs` (made-up models only, temp folders under `os.tmpdir()`):
   - A (item 1): `measures().lastMonths` for both branches, n = 12 and 3, two made-up data sets (ending 15 Jun 2026 and
     30 Jun 2026): the RETURN clause read from the DAX and evaluated in JS (EDATE / EOMONTH as DAX defines them, MAX of a
     month = its last day, the label's month = its first day) over 36 months: exactly n kept, the last month with data
     counted. 8 checks; red before: the date branch mid-month n = 12 and n = 3, last-day n = 3.
   - B (item 2): plan_layout on the sample model with the tour's planFields (2 slicers) on a design with 3 slots: the
     answer's `slicers` names all three as written, says Branches[Country] was added to fill the design's slot, in
     English and in Arabic (an Arabic plan); the approval page's Fields row names it too.
   - C (item 3): "Year Month", "Month Year" -> «الشهر والسنة»; "Year Quarter" -> «الربع والسنة»; "Year Week" ->
     «الأسبوع والسنة»; "Month Day" -> «اليوم والشهر»; "Hijri Year" -> «السنة الهجرية», "Hijri Month" -> «الشهر الهجري»;
     "Year Month Name" -> «اسم الشهر والسنة»; draftText("Total Sales by Year Month") -> «إجمالي المبيعات حسب الشهر والسنة»;
     any other run of date words gets no draft (never word for word); guards "Total Sales", "Month Name" unchanged.
   - D (item 4) in sq3: the Arabic sample page shows each row's Arabic with the English line under it; the English page unchanged.
3. Fixes at the cause:
   1. the date branch compares with `EOMONTH ( _last, -n )` (the end of the month n before the last month with data);
      the label branch unchanged (the test shows it right). test-0.2.9b's two patterns `EDATE \( [^,]+, -12 \)` and
      `-6` read EOMONTH: the rule changed, said here.
   2. Decision: keep the slot filled (the design's look is what was approved; an empty slot changes what Desktop draws)
      and say it: report-run returns the slicers written (from the writer's own bound list), the plan answer gets
      `slicers { written, asked, added, sayInPlan, sayInPlanAr }`, and the approval page's Fields row names the added.
   3. a run of date words is joined by fixed compounds in `arabic-names.mjs` (smaller unit first with «و», «الهجري» after its noun);
      any other run of two or more date words: no draft (the assistant proposes, as for any unknown name).
   4. the sample's rows: an Arabic key table in approval-window.mjs, the values' Arabic from sample-project.mjs
      (`sampleSaidAr`, beside `sampleWritesAr`), passed in the plan's data; each cell Arabic, the English under it.
   5. `fs.mkdirSync(path.dirname(L1_DUMP), { recursive: true })` before the write.
4. build:min; `?v=20261026lr1` on pbip-query in theme-generator.js's builder list and on theme-generator.min.js on its
   3 pages; csp --write, ar-pages --write; suites; the full run; check-result-lines, changelog-words,
   check-agent-memory; sitemap-lastmod --write after the last commit.

## Results
| Item | Before (0f7f6e8) | After | Test |
|---|---|---|---|
| 1. last n months | date branch: 13 of "last 12" (data to 15 Jun), 4 of "last 3" (15 Jun and 30 Jun); label branch: n | both branches exactly n, the last month with data counted (`EOMONTH ( _last, -n )`) | lr1 A (8 checks, 3 red before) |
| 2. slicers in the plan | the plan and the approval page named the 2 asked; Branches[Country] said only by boundFields | `slicers { written, asked, added, sayInPlan, sayInPlanAr }`; the approval page's Slicers row adds "Branches[Country] (added by DataArcus to fill the design's slicer slots)", in Arabic on an Arabic page | lr1 B1-B4 (6 checks, all red before) |
| 3. date words in Arabic | "Year Month" -> «السنة الشهر» (every pair of date words word for word) | «الشهر والسنة»; 14 fixed compounds; any other run of date words: no draft | lr1 C1-C4 (4 checks, all red before; C4's «الهجري التاريخ» too) |
| 4. Arabic sample page | rows and Tables rows in English | each row's name and value in Arabic, the English line under it; the English page unchanged | sq3 LR1-4a-c (3 checks, 4a and 4b red before) |
| 5. L1_DUMP | ENOENT on a missing folder | the folder made; PASS 31 checks, the file written | run by hand (below) |

DAX text a test pins, changed because the rule changed: `mcp/test-0.2.9b.mjs` lines 65 and 138 (`EDATE \( [^,]+, -12 \)`
and `-6`) now read `EOMONTH`. No golden report holds the DAX (grep: EDATE only in pbip-query.js, its .min.js and 0.2.9b).

## CHANGELOG line
- **Fixes from a Power BI Desktop run:** a line chart's "last 12 months" on a date table showed 13 months when the
  data ended mid-month; it now shows exactly 12, the last month with data counted as one. The plan names every slicer
  the report will have, in English and Arabic, and says when one was added to fill the design's slicer places. An
  Arabic name drafted for a field such as "Year Month" now reads «الشهر والسنة», never word for word. The Arabic approval
  page of the sample project shows its details in Arabic, the English under each.

## Decisions I made
1. Item 1: `EOMONTH ( _last, -n )` in the date branch only; the label branch left (lr1 A shows it right in all four cases).
   The date branch's month MAX is taken as its last day (a full date table, as the tour's Calendar); a fact date column
   whose month holds only some days is kept the same way (any date in a month after the cut keeps it).
2. Item 2: the slot stays filled (pbip-bind's "a slot left over keeps the picker's" unchanged) and is said, because an
   empty slot changes what Desktop draws and the design's look is what the person approved; the plan says how to choose
   another field (name 3 slicers). The written slicers come from the writer's own bound list (report-fields `slicersOf`).
   The approval page's row in Arabic too, beyond the brief's "plan text", since the same cell support served item 4.
3. Item 3: the compounds live in `arabic-names.mjs` beside its PATTERNS (the glossary file keeps single words); 14 pairs
   (Year/Month, Year/Quarter, Year/Week either order, Month/Day either order, Hijri + Year/Month/Quarter/Week/Day/Date);
   «السنة الهجرية» agrees with its noun. Pairs with no clear reading ("Week Day", "Date Year", "Year Hijri") and runs of 3
   date words get no draft: the assistant proposes, as for any name outside the list.
4. Item 4: the values' Arabic is made in `sample-project.mjs` (`sampleSaidAr`, beside `sampleWritesAr`) and passed as the
   plan's `sampleAr` for an Arabic plan only; the row names in `approval-window.mjs` (SAMPLE_AR); a cell `{ en, ar }`
   renders Arabic then the English line (the writes' shape). The Tables rows too (the same section's facts).
5. Item 4's checks went into `test-0.3.1-sq3.mjs` (the Arabic approval page suite, which already opens the Arabic sample page).

## For the laptop
- Item 1: the tour's "Total Sales by Year Month" line chart shows 12 points, July 2025 to June 2026 (data to mid-June
  2026); the tooltip page's month bars show 6.
- Item 4: the Arabic sample approval page (`plan_layout` with `sample: true, lang: "ar"`, then approve_plan): each row
  of «مشروع المثال» and «الجداول» in Arabic with the English line under it, read right to left.
- Item 2: the tour's plan names three slicers and says Branches[Country] was added (English and Arabic plan).

## Suites (before on 0f7f6e8 -> after)
`npm test -- report` 28 -> 29 passed (lr1); `arabic` 10 -> 10; `core` 6 -> 6; `scripts/tests/run-all.mjs pbip
theme-generator` 2 -> 2 (898 and 100 checks); `npm test -- --keep-going`: "run-tests: 92 suites passed";
check-result-lines 92 PASS, changelog-words 137 PASS, check-agent-memory 153 PASS, test-site-config PASS, eslint clean.

## Seen, not in scope
1. The date branch of lastMonths still has no `ISBLANK ( _last )` guard (the label branch keeps every month when no month
   has a value; the date branch then compares with EOMONTH of a blank): unchanged, as before this job.
2. The Fields rows of the approval page (KPI cards, Trend axis, ...) stay English on an Arabic page; only the Slicers
   row's added field has Arabic (item 2). The sample page's "To open" English line is the bare path.
3. Draft compounds beyond the 14 (e.g. "Fiscal Year", "Week Day", "Year Month Number") give no draft: the assistant
   proposes; a fixed list entry for them would need the owner's terms.
