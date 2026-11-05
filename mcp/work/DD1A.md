## Summary
- **Approval:** the brief "DD1A (0.3.2)" (4 Nov); the owner D-1104-15 (one time test for all four places), D-1104-12
  (one library, fix at the source), D-1104-18 (keep building it), D-1016-01 (never 100 places).
- **Base:** `feat/0.3.2-dd1a` from `origin/integration/0.3.2` at eb1f284 (DD1B in it). Push only this branch; never merged.
- **Scope:** one shared pure dual module `assets/js/time-names.js` (`window.DATimeNames` / `self.DATimeNames`,
  CommonJS in Node): `wordsOf(name)`, `isTimeName(name)`, `TIME_WORDS` (one list). The four places of CONTRACTS.md's
  1a (mirror-policy `isTime`, page-preview `timeDirOf`, pbip-query `isTime`, layout-check `TIMEY`) call isTimeName
  for the name; what each knows first stays first (a date table; the picker's `time` / `kind` mark). Their lists went.
- **Commits:** plan ac91bf9; 1 the module, .min.js, suite dd1a (c98ebf6); 2 the four places and their loaders
  (5f6443a1); 3 the parity test (becaa499); 4 ledger, CHANGELOG, WORK.md, this note (6fe7ca7a).
- **Lists before -> after:** four word lists -> one. The probe's 1a: 12 of 24 inputs disagreed -> 0 (all four answer
  the same on all 24). 26 answers changed on those 12 inputs (table below); every one false -> true.
- **Answers a person sees:** see "## Answers that changed"; sp10 (twin golden) moved on 5 made-up visuals, all
  FiscalYear or StartOfMonth (camel case), written out in sp10, its recorded file untouched (Decisions).
- **Test:** mcp/test-0.3.2-dd1a.mjs (suite dd1a, area twin): 311 checks. Red: with mirror-policy's old TIME_NAME
  back, 20 fail (291 of 311: 19 P, 1 S).
- **Expected checks:** dd1a 311; dd1b 545 -> 546 (its S2 exception went, the brief); sp10 113 as before; every other
  suite's number as before; mutation 76/76; lint 0; check-contracts, check-modules --strict green.
- **Got:** exactly that (Results).
- **Merge:** integration/0.3.2 moved to ae8c1734 (DD2D, DD2P): merged once (see git log), `npm run build:min`.
CI green: https://github.com/Antnioo/DataArcus/actions/runs/41945245578 on b127166e
- **State:** DONE (Linux and Windows; macOS runs where the reviewer merges).
- **Resume:** none once CI is green; the reviewer reads and merges.

## Lists before -> after (each place; the probe's 24 names)
| place | own list before | after | answers that went false -> true |
|---|---|---|---|
| mirror-policy `isTime` (the twin) | `TIME_NAME`, raw name, no split, Arabic only with «ال» | `TN.isTimeName`; date table, hierarchy level first | OrderDate, FiscalYear, MonthName, Month_Name, Qtr, FY, Yr, تاريخ, شهر, هجري (10) |
| page-preview `timeDirOf` (the preview's arrow) | `TIME_NAME`, no split, Arabic as a substring | `TN.isTimeName` | OrderDate, FiscalYear, MonthName, Month_Name, هجري, Weekday (6) |
| pbip-query `isTime` (the writer's sort) | `TIME_WORDS` + `wordsOf`, no qtr/yr/fy, Arabic only as whole «ال» forms | `TN.isTimeName`; the picker's `time` / `kind` first (`TIME_KINDS` stays: the mark, not the name) | Qtr, FY, Yr, التاريخ, تاريخ, شهر (6) |
| layout-check `TIMEY` (check_report AXIS_TIME) | `TIME_WORDS` + `wordsOf` | `{ test: TN.isTimeName }`, `wordsOf = TN.wordsOf` (its `many` reads it) | FY, Yr, هجري, Weekday (4) |

## Answers that changed (made-up inputs)
- The twin (create_arabic_twin), only with time kept left to right (`timeRightToLeft: false`): a line or column chart by
  `Sales[FiscalYear]`, `Sales[Qtr]` or a bare `المبيعات[شهر]` is no longer sorted descending (it was read as text and
  turned); it keeps its order, oldest at the left. A waterfall by `Sales[FiscalYear]` is said as "kept left to right as
  asked" (`waterfallTime`) instead of `waterfallKept` (same visual, same changes). With the default (time right to
  left) the written visuals are byte for byte the same (sp10 runs A, C, D, K).
- The preview's time arrow: now drawn for OrderDate, FiscalYear, MonthName, Weekday, هجري.
- The writer (create_report and the website download): a bar or column chart by Qtr, FY, Yr or an Arabic date part
  without «ال» (تاريخ، شهر) keeps its own order instead of being sorted by its measure.
- check_report's AXIS_TIME rules now see FY, Yr, Weekday and هجري.

## For the laptop
After it merges (B-334), the twin with "time left to right" (the option `timeRightToLeft: false`), made-up model:
1. A line chart, axis `Sales[FiscalYear]` (a plain column, not a date table), values `Sum of Total`: Desktop shows the
   years oldest at the left, no descending sort set (before: newest at the left).
2. A clustered column chart, axis `Sales[Qtr]` (Q1-Q4): Q1 at the left, no sort set (before: Q4 at the left).
3. A clustered column chart, axis «المبيعات[شهر]» (a bare Arabic month column): the months in the order Desktop gives
   the column (its sort-by column, else A to Z), first at the left, no sort set (before: that order reversed).
In each: the value axis at the right and the title on the right as before.

## Decisions I made
- **sp10's golden:** the recorded file (fixtures/sp10-policy.json) is untouched; sp10 writes out the DD1A delta for
  the 5 visuals it moved (the time answers, and the kind and changes of runs B and E of mFiscalYear and run E of
  mWaterfallFiscal; those runs' sha is not pinned). No check added or removed: 113 as before. All 5 are the brief's
  FiscalYear class (camel case: FiscalYear, StartOfMonth); 3 of them change only `isTime(field, [])`, no output.
- sp10 P10's allowed list: visual-types.js plus the pure shared files pbir-values.js and time-names.js (a list, the
  reviewer's call); mirror-policy `strOf` is `PV.litText`; dd1b's S2 exception went (dd1b +1 check: 546).
- The Arabic forms: «أ إ آ» read as «ا» (a name typed اسبوع is time), short vowels and the tatweel dropped; هجرية
  (feminine) counts with هجري; plurals: dates ... periods, qtrs, yrs, fys; تواريخ، أيام، أسابيع، شهور، أشهر،
  أرباع، سنوات، سنين، أعوام، فترات.
- **"Holiday", "Today", "Birthday", "Dateline": not time** (whole words only, as pbip-query's round 23 rule); pinned.
- `mirror-policy.TIME_NAME` and `pbip-query.TIME_WORDS` / `wordsOf` left the exports (no caller); `TIME_KINDS` stays.
- time-names.min.js loads on the 3 theme generator pages before pbip-query.min.js, first after pbir-values in
  `BUILDER`, and before page-preview in `loadPreview` (unless already there). The check's `CHECK` list runs after
  `loadBuilder`, so it has it.
- samejob.py is not in the repo (as DD1B and DD1C found): not run.

## For the owner
none beyond the brief's list (the 5 sp10 visuals are FiscalYear and StartOfMonth: the brief's camel-case case; said
here so you can see them: StartOfMonth was not one of the brief's three examples, and only its bare answer moved).

## Risky changes
- «عام» is in the owner's list: an Arabic name like «المدير العام» or «الرصيد العام» now reads as time (a whole word).
  The writer then keeps such a category's order instead of sorting it by its measure.
- page-preview read Arabic words as substrings before (طعام held عام); now whole words only: such a name loses the arrow.

## Results
- After the merge (d15d2857): MCP 5 shards side by side, all exit 0, 202 suites PASS (dd2d 48 and dd2p 112 new from
  integration); dd1a 311, dd1b 546, sp10 113, twin-fuzz 185, mutation 76/76 killed. Website `npm test`: all 42 passed
  in one run. Lint 0; check-contracts PASS 730 (28 families, 103 places); probe 1a: 0 of 24; check-modules --strict PASS
  1098; stamps 1516; agent-memory (WORK.md 3200 of 3200: integration's line grew, DD1B and DD1A share one entry).
- Before the merge, on 6fe7ca7a (code as of 5f6443a1; later commits: the dd1a test file and docs): MCP as CI's 5 shards side by side
  (`DA_SHARD=k/4 node run-tests.mjs --keep-going`, after `git fetch --unshallow`): all 5 exit 0, 200 suites PASS;
  dd1a 311, dd1b 546, sp10 113, mutation 76/76 killed, twin-fuzz 185, sp39 96, sp42 22, dd1c 75, glass-tables 113,
  sp6 13 (the numbers DD1B reported, dd1b +1). No base run here (two full runs at once pass the time limit).
- Website `npm test`: 42 of 42. The first run's shared browser closed after 17 (every later suite "crashed" in 0 s,
  then my 20-minute timeout); the 25 run again: all PASS. theme-generator 922, theme-generator-lab 922, pbip 111,
  layout 512 passed in the first run.
- Lint 0; check-contracts PASS 757 (28 families, 108 places); contracts-probe 1a: all 4 answer the same on all 24;
  check-modules --strict PASS 1078; test-site-config, changelog-words, result-lines, agent-memory, literal requires,
  stamps 1169, check:min (128 match), sitemap-lastmod PASS.

## Seen, not in scope
- DATE_LIKE (mirror-policy: a date column by its shape) is its own question; not this job.
- layout-check `many` (a date or month-and-year axis) keeps its own small regex over the shared words.
- pbip-query `TIME_KINDS` (the picker's kinds) and field-catalog's kinds could share one list of kinds later.

## Lessons for the reviewer
- A golden that pins a decided change (sp10) can carry the delta in the test, named, with the recorded file left as
  recorded: the reader sees exactly what moved and why.
- The red proof ran in a separate worktree, so the full run in the main checkout was not disturbed.
