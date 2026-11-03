# SP9 (0.3.2, the split): assets/js/model-health-engine.js -> dax-reference-parser.js (DAX tokens and report references; behaviour identical)

## Summary
- **Approval:** the reviewer's brief "SP9" (3 Nov); the owner D-1016-01, D-1102-02, D-1102-04, D-1103-02. Backlog
  B-280, B-286 (the Codex split map: "Extract dax-reference-parser.js, model-index.js, health-rules.js,
  health-confirm.js in that order").
- **Base:** `feat/0.3.2-sp9` from `origin/integration/0.3.2` at a57e094. Pushed only this branch; never merged.
- **Scope:** new `assets/js/dax-reference-parser.js` (`DADaxParser`): pure functions, text or report JSON in, tokens and
  references out, no model state: `tokenizeDax`, `daxCode`, `collectReportRefs`, `visualLabel` (with its visual type
  names) and `analyzeReport`. model-health-engine.js requires it (Node) or reads `self.DADaxParser` (worker, page) and
  re-exports the same functions on its API. Stays in the engine: normalising, `buildIndex`, `daxRefs` and `aggBase`
  (they resolve names against the model's index: model-index.js's job), rules, analysis, confirmation.
- **Loaded before the engine:** the worker's importScripts, both tool pages (EN and AR), and the two Node loaders that
  run the engine's file in a sandbox (scripts/tests/model-health.mjs and tmdl-model.mjs now pass a `require`).
- **MCP suite sp9 (test-0.3.2-sp9.mjs, area model):** A1-A11 `analyze()`'s whole output as JSON (findings, unused
  fields, score, skipped, questions, tables, measures) for 11 made-up models: the health and twin projects, the TMDL
  fixture (folder and .pbit), the Ramadan TMDL, legacy.pbit, and five written here (DAX comments of three kinds,
  strings holding brackets and quotes, quoted names with spaces and apostrophes, VARs, an Arabic table, virtual
  columns, a calculation group, a role, aggregations, a function; PBIR and legacy reports with bookmarks, a hierarchy
  level, a variation source and report measures), A11 the incomplete TMDL model with its warning; T1 the tokens and
  report references of 14 inputs; Q1 check_model_health's answer (health project, incomplete model); C1 coverage.
  After the move: P1 (the parser holds no model state; the engine's functions are the parser's), P2 (load order).
- **Website suite sp9 (scripts/tests/sp9.mjs, shard 2):** the Model Health Check page ?lang=en and ?lang=ar through
  the worker: the sample, a made-up .pbit (the tricky DAX, an Arabic table, a legacy report) and an incomplete TMDL
  project; the result's text and every tab's text (findings opened). W3 after the move: parser asked before engine.
- **Before -> after:** `assets/js/model-health-engine.js` 1436 -> 1265 lines; `dax-reference-parser.js` 192 (new).
- **Expected checks:** sp9 14 on the base, 16 after; website sp9 2 on the base, 3 after. **Got:** the same: sp9 14 on
  0c97587 (recorded on the base code, 3 runs identical), 16 after the move, records unchanged; website sp9 2, then 3.
  Two one-line mutations of the parser (no `--` comments; no variation source) fail T1, and A8 and T1; reverted.
- **Areas:** see "Results" below. **State:** the move done; CI next.
- **Resume:** if CI is not green, read its FAIL line; else the reviewer's merge.

## Results
- MCP: model 15/15 (sp9 16), safety and release (36 suites with model) pass; `--affected` below.
- Website: sp9 3, model-health 255, tmdl-model 70, pbip 111; lint 0; check-min (stamps against main) and
  test-site-config pass; check-literal-requires passes; changelog-words passes.

## CHANGELOG line
- **Inside the Model Health Check:** reading DAX and the fields a report uses is in a file of its own; every check, on
  the website and from the MCP, gives the same findings, unused fields, score and questions as before.

## Decisions I made
- `daxRefs` and `aggBase` stay in the engine: they resolve names against the model's index (IX), which is model state;
  the brief asks for pure functions with no model state. They belong with buildIndex in model-index.js (the next split).
- The report reading (`collectReportRefs`, `visualLabel`, `VISUAL_TYPES`, `analyzeReport`) moves with the tokenizer: it
  is JSON in, references out, and the split map's "reads report references (:211)" is the parser's half.
- The parser keeps its own one-line `text` helper (the engine still needs it for normalising): a private helper, not a
  fact; sharing it would make the engine's normaliser depend on the parser for a join.
- The engine's API is unchanged (tokenizeDax, collectReportRefs, analyzeReport re-exported: the same function objects).
- Stamps: one new stamp `20261103sp9` for the parser, the engine, the worker (in model-health.js and theme-generator.js,
  the two places that start it), model-health.min.js (both tool pages) and theme-generator.min.js (three generator pages).
- The website suite records sha256 of each tab's text (no text in the fixture); the MCP suite records sha256 of the
  whole JSON. SP9_DUMP=<file> writes the texts for a diff.
- The MCP suite's Q1 normalises the plan id (check_model_health proposes a plan with a random id).

## For the owner
none

## Risky changes
none (the page and worker load one more small file; the order is checked by P2 and W3).

## Seen, not in scope
- `daxRefs`'s qualified-reference test re-derives a token's source length (`tk.v.replace(/'/g, "''")`); fine today,
  but it depends on how the tokenizer unescapes; model-index.js should keep the token's end position instead.
- The engine's section numbers repeat ("5." twice: rule catalogue and Please confirm); left as is.

## Lessons for the reviewer
- model-index.js (next): move normalizeModel, buildIndex, K, daxRefs and aggBase together; daxRefs needs the parser's
  tokenizeDax only. Keep `entityExprs` a Set (analyze reads it) and the API's normalizeModel and daxRefs exports.
- Any file run in a `new Function` sandbox needs a `require` as soon as the engine requires a neighbour: the two
  website loaders now map a require to the same .min or source file as the loader's.
- The worker is started from two places (model-health.js and theme-generator.js): its stamp changes in both.
- sp9's records hold the whole analyze() output: a later split that changes any order of findings or items fails them.
