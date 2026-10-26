# SQ6 (0.3.1 night, Seen batch 6): the reader

## Summary
- **Approval:** the owner's night run, 25-26 Oct (the reviewer's brief "Go on SQ6"): every "Seen, not in scope" item
  fixed, carefully. Batch "SQ6: the reader" in [SEEN-QUEUE.md](SEEN-QUEUE.md).
- **Scope:** `mcp/lib/model.mjs`, `mcp/lib/read-report.mjs`, `mcp/lib/scope.mjs`; a new suite
  `mcp/test-0.3.1-reader-seen.mjs` (one line in `tests.json`); new mutants in `mcp/test-0.3.1-mutation.mjs`; the six
  Status cells in SEEN-QUEUE.md. Not SQ5's files (report-rules.js, report-a11y.js, layout-check.js, check-report.mjs).
- **Base:** `fix/0.3.1-sq6` from `origin/integration/0.3.1` (d2328ae). Push only this branch; the reviewer merges.
- **Items:** 0.2.9-checks-S4, 0.2.9-reader-S15, 0.2.9-reader-S12, 0.2.9-custom-visuals-S4, audit-5-reading-S3,
  0.2.9-reader-S24. All six confirmed true on d2328ae (below); none obsolete.
- **Expected checks:** the new suite about 16 checks, about 12 red before the fixes; the mutation suite 70 -> 73
  mutants, all killed; `npm test -- --keep-going` 80 -> 81 suites, all PASS; `DA_SHARD=1/4 npm test` PASS;
  `npm test -- model`, `npm test -- safety`, `node test-platform-paths.mjs` PASS; check-agent-memory PASS.
- **Invariants:** metadata only (no new field returns a value; the base theme gives hex colours only, as the custom
  theme does); paths: every new read goes through the same guards (diskSource for the base theme; the .pbit opened
  once, without following links); no check loosened.
- **Got:** (after the run)
- **Resume:** (after the run)

## The items, confirmed (d2328ae)
1. **0.2.9-checks-S4** `loadModel` (model.mjs:399): `dirs.sort` by depth, then `dirs[0]`: two model folders at the
   same top depth (two projects in the working folder, read as ".") -> the first the folder lists, silently.
2. **0.2.9-reader-S15** `partJson` (model.mjs:208-209): `new Error(...)` for "not valid JSON" and "nested too deep";
   no code, so the tool layer and `skippedOf` match the message's words.
3. **0.2.9-reader-S12** the `.pbit` route (model.mjs:381): `readCapped(full, 300 MB)` reads the whole file into one
   buffer before `unzipNeeded` picks its parts.
4. **0.2.9-custom-visuals-S4** `fieldOf` (read-report.mjs:263): a `HierarchyLevel` over a `PropertyVariationSource`
   (Power BI's auto date hierarchy) has no `SourceRef` on the hierarchy: table "" and name "Date Hierarchy".
5. **audit-5-reading-S3** `inventory` (read-report.mjs:336-340): colours from the custom theme only; a report with
   no custom theme (or a custom theme without dataColors) shows none, though Power BI draws the base theme's.
6. **0.2.9-reader-S24** `largeSummary` (scope.mjs:55-56, and `largeBody`'s `rel.get(t.table)`): the area map and the
   related-tables map are keyed by the raw table name and read by the shown (cut, cleaned) one.

## Plan (before any edit)
1. This note, pushed first.
2. Red first: `mcp/test-0.3.1-reader-seen.mjs` (made-up names only; temp working folders; in process):
   - S4: a working folder with two projects side by side: loadModel(".") refuses with `MANY_MODELS` naming both;
     one project, or a backup deeper down, still reads the nearest one (pin).
   - S15: a .pbit whose model part is not JSON: `ReadError` code `BAD_JSON`; nested 300 deep: `TOO_DEEP`; the
     message never quotes the part's text (pin); a PBIR report part that is not JSON is still `skipped` "not valid JSON".
   - S12: a .pbit with a 24 MB stored image beside its model: no single read of the file over 2 MB (fs.readSync
     watched in process), the model read as before, `print` equals the SHA-256 of the whole file (the plan's pin);
     the limits still hold (a part above its cap refused; a .pbix by another name refused).
   - S4 (custom visuals): a visual whose field is a HierarchyLevel over a PropertyVariationSource reads
     `Table[Column]` of the date column itself, with its level.
   - S3: a report with no custom theme and a base theme file: read_report's theme has the base's data colours; a custom
     theme with its own colours still wins (pin); reportIdentity unchanged (pin: the base's colours are never "own").
   - S24: a large model with a table name over the cut length, with measures in a display folder and a relationship:
     its row in `tablesWithMeasures` has relatedTables 1, and its area is counted (notListed byArea), not "(no display
     folder)".
3. Fixes at the cause:
   - S4: when two folders share the top depth, `ReadError('MANY_MODELS', { models })`, worded by read-words.mjs like
     MANY_MODELS_NAMED ("give the path of the one you mean").
   - S15: `partJson` throws `ReadError('BAD_JSON', { what })` / `ReadError('TOO_DEEP', { what, max })`, same words;
     `skippedOf` reads the code first.
   - S12: the .pbit opened once (no link followed, a regular file, measured by fstat); hashed in 1 MB chunks (the
     same print); the directory and each needed part read at their offsets through the same `unzipNeeded` logic over a
     reader (a buffer or the descriptor); the size checked again after (a file that changed while read is refused).
   - S4 (custom visuals): `fieldOf` takes Entity and Property from `PropertyVariationSource` when the hierarchy has no
     SourceRef.
   - S3: `inventory` reads `SharedResources/BaseThemes/<name>.json` through the same source (diskSource's guards) and
     takes its data colours when the custom theme gives none; reportIdentity reuses that one read.
   - S24: largeSummary and largeBody key by each row's raw table name (the summary row's index in `m.tables`).
4. Mutants: M-tie (the tie check skipped), M-pbit-cap (the descriptor's size cap skipped), M-pbit-changed (the
   check after reading skipped); each killed by the new suite.
5. Suites as above, results below; SEEN-QUEUE.md Status cells in the same push.
