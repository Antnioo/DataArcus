## Summary
- **Approval:** the owner, 12 Nov 04:15 Dubai, D-1112-01 ("fix the aud finds that are still open"), relayed by the
  reviewer's hub (session_015Q77oNR7YVFznptSuZoZZ2): job AU1, the night audit's AUD-067 and AUD-068.
- **Base:** `feat/0.3.3-au1` from `origin/integration/0.3.3` at 0dc0ea05. Push only this branch; never merge, no PR.
- **Scope:** assets/js/tmdl-model.js (read, WHY, unreadableSaid's label), assets/js/model-health-worker.js (fromZip,
  NO_MODEL only when nothing was named), assets/js/health-view.js (the two-models sentence before the score), their
  .min.js and ?v= stamps; mcp/lib/model.mjs (the new entry mapped, its name screened); a new suite `au1`
  (tests.json, area model); one block in scripts/tests/model-health.mjs; MODULES.md, CONTRACTS.md rows; CHANGELOG;
  mcp/WORK.md; this note. Not SN4's files. No Health Check rule, weight or score change for a whole model.
- **Expected checks:** au1 red on 0dc0ea05 first (reader, worker, real server), green after; the 7 TMDL projects in
  the repo (the golden inputs and every TMDL fixture mcp/fixtures copies) give 0 new skipped entries and 0 score
  differences; aud047 unchanged; website model-health red first on the new block; build:min; lint 0; CI green.
- **Resume:** 2026-11-12T02:47Z code, tests and docs committed; next: merge origin/integration/0.3.3 once, build:min, CI.

## Measured first, on the base 0dc0ea05 (2026-11-12T02:34Z)
- AUD-067 reproduced with assets/js/tmdl-model.js and model-health-engine.js on mcp/test-models/no-measures
  (model.tmdl: `ref table Orders`, `ref table Dates`; relationships.tmdl: Orders.'Order Date' -> Dates.Date):
  whole: 2 tables, skipped [], score 92 (MONTH_SORT, DATE_NOT_MARKED, SUMMARIZE_KEYS, FK_VISIBLE, DOUBLE, NO_RLS);
  without tables/Dates.tmdl: 1 table, skipped [], score 96 (MONTH_SORT and DATE_NOT_MARKED gone); without both table
  files: 0 tables, skipped [], score 100 (the worker then throws NO_MODEL: nothing named). The brief's numbers hold.

## Plan
1. `read` adds, after the per-file problems, one entry per table the model refers to and no file defines: a
   `ref table` name with no table definition among the files (code `missingTable`), else a relationship end on a
   table not read (code `missingEnd`); one entry per table (names compared as Power BI does, case-insensitive);
   the entry is `{ table, code }`, the name as the parse read it (readName, the reader's one unquoting place).
2. WHY gets the two reasons; the Arabic side carries the English sentence (FB4's way); drafts below for the owner.
3. The worker: NO_MODEL only when nothing was named; the page then shows "No score" and the names (AU47's road).
4. model.mjs maps `{ table }` to `{ table: shownName(..), why }`; read_model and check_model_health list it first.
5. AUD-068: fromZip finds every model (each model.bim / DataModelSchema folder, each definition root with .tmdl),
   reads the first by folder path (zip order never decides), and with more than one says which it read and which
   not (folder paths only), before the score; report parts: the reports whose definition.pbir points at the model
   read, else those in the same parent folder when no other model is there; otherwise no report is read, said.
   One model: unchanged.

## Before -> after (measured 2026-11-12T02:47Z)
- no-measures without tables/Dates.tmdl: reader 1 table, skipped [] -> skipped [Dates missingTable]; website 96 -> "No score",
  Dates named (EN, AR); read_model nothing said -> `unreadable` first; check_model_health 96 -> no score, Dates named;
  plan_layout planned -> refused with the same message.
- every table file missing: website NO_MODEL -> "No score", Orders and Dates named; check_model_health 100 -> no score.
- no ref lines and Dates.tmdl missing: nothing -> Dates missingEnd. No ref lines, whole files: nothing (unchanged).
- two models in one zip (health-project's model.bim + report, no-measures TMDL, a decoy report of the second): the page
  read Health Test with both reports (5 pages) and said nothing -> reads Health Test with its own report (2 pages, score
  87 as when zipped alone), says which it read and which not, the same in both zip orders.

## Tests
- au1 (new, area model): 40 checks, red on 0dc0ea05 first (24 of the first 38 failed, each for the bug: no entry,
  NO_MODEL, 5 pages read, score 96 and 100 on the server; W10, W11 added with the shared rule) and green now.
- website model-health: 259 -> 265 checks (6 new: 2 missing-table cases x EN, AR; 2 two-models checks), red on the base
  code first (5 failures: score 96 shown twice, NO_MODEL twice, no note; the other-order check passed there), green now.
- aud047 106 unchanged; `npm test -- model` 32 suites pass; dd2d 48, sp9 16, sp14 20, sp27 25, dd1g 39; website sp9 3,
  sp24 23, sp32 39, tmdl-model 72; lint 0; tsc (TC1) 0; contracts 868; modules --strict 1264; stamps 1286; site config.
- R-81: the 7 TMDL projects in the repo (the golden inputs ramadan, arabic-long-names, no-measures, large-synthetic;
  service-orders, bridge-project, tmdl-health, which mcp/fixtures/health-models.mjs copies) give 0 new skipped entries
  and 0 score differences (au1 G1, G2). health-project is a model.bim: not read by this code.

## CHANGELOG line
"The Model Health Check, on the website and in read_model and check_model_health, now says what it did not read. ..."
(mcp/CHANGELOG.md, [Unreleased]).

## Decisions I made
1. The entry is `{ table, code }` (no `path`): the brief's "named by the table's name". The approved message frame stays
   ("N model file(s) could not be read: Dates (why)"): changing it would be a new Arabic sentence too.
2. Unquoting: the parse's readName, the reader's one unquoting place (tmdl-name.js holds only the writing side,
   tmdlName); R8 pins `'Date ''Table'''` read as `Date 'Table'`. Names compared case-insensitively, as Power BI does.
3. A table whose own file (tables/<name>.tmdl) is there but already named unreadable gets no second entry (R11): aud047's
   one-entry answers stay as they were (R-10).
4. One entry per table: a `ref table` name gives missingTable; a relationship end not already named gives missingEnd.
5. AUD-068: which folder is read is model-nearest.js `nearest` (CONTRACTS.md 1g, D-1104-12), never a sort of the worker's
   own; on a tie (where the MCP and the folder import refuse) the first of the tied in the rule's order is read and said,
   as the brief asks (no picker). A prose line in 1g, not a new place row (the probe would need a zip harness).
6. Reports with more than one model: a report folder belongs to a model by its definition.pbir byPath, else by being the
   only model in its parent folder; the reports of the model read are read, the rest are not; none: said. One model in
   the zip: unchanged (no filter, no note).
7. Arabic (D-1109-07): the three new sentences carry English on the Arabic side; drafts below.

## For the owner
Three Arabic drafts (D-1109-07, checked against content/ARABIC-STYLE.md), held; the Arabic page shows the English until you approve:
1. missingTable, EN "model.tmdl names this table; no file in the project defines it":
   «يذكر model.tmdl هذا الجدول، ولا يوجد في المشروع ملف يعرّفه»
   terms: يذكر (names; not «يسمّي», which also reads "calls", rule 4), الجدول (table, Power BI's word, rule 2), المشروع
   (project), ملف (file), يعرّفه (defines it); model.tmdl stays English (a file name, the bidi rule).
2. missingEnd, EN "a relationship uses this table; no file in the project defines it":
   «تستخدم إحدى العلاقات هذا الجدول، ولا يوجد في المشروع ملف يعرّفه»
   terms: العلاقات (relationships, Power BI's word, rule 2); «إحدى العلاقات» for "a relationship" (natural, rule 3).
3. two models, EN "This zip holds 2 semantic models: the check below read A; not read: B. The report read is the one of A
   (R); the other models' reports were not read. To check another model, zip its project folder alone.":
   «يحتوي هذا الملف المضغوط على نموذجين دلاليين: قرأ الفحص أدناه A؛ ولم يقرأ B. التقرير المقروء هو تقرير A (R)، ولم تُقرأ
   تقارير النموذج الآخر. لفحص نموذج آخر، ضع مجلد مشروعه وحده في ملف مضغوط.»
   (3 models and up: «على 3 نماذج دلالية» / «النماذج الأخرى»; no report: «لم يُقرأ أي تقرير: لا يمكن أن يُعرف أي تقرير في
   الملف المضغوط يخص A.») terms: النموذج الدلالي (semantic model, rule 2), «على نموذجين» (your term for two), الملف المضغوط
   (zip, as the page's drop zone says «مضغوط»), «ضع ... في ملف مضغوط» not «اضغط» (which also reads "press", rule 4).

## Risky changes
none (a model with every table defined reads exactly as before: 0 differences on the 7 TMDL projects).

## For the laptop
Optional evidence: open mcp/test-models/no-measures with tables/Dates.tmdl removed in Power BI Desktop: it should refuse
to open (the reason the score is withheld).

## Seen, not in scope
1. The MCP: a TMDL project with no definition/tables folder at all gets NO_MODEL_FILES naming the folder (mcp/lib/model.mjs,
   before the read), not the tables model.tmdl names; an empty tables folder is named table by table (au1 S1-none).
2. The approved frame says "N model file(s) could not be read" also when the entry is a table with no file: a new frame
   ("could not be read or is missing") is a new Arabic sentence, for the owner.
3. A picker for a zip with more than one model (the brief's later job).

## Lessons for the reviewer
- A choice the product makes in more than one place (here: which model folder) has a CONTRACTS.md family: grep the
  ledger for the question before writing the rule, not after.
