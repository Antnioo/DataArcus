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
- **Resume:** 2026-11-12T02:34Z plan pushed; next: red tests.

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

## Decisions I made
(filled as I go)

## For the owner
(filled as I go)
