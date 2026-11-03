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
- **Loaded before the engine:** the worker's importScripts, both tool pages (EN and AR), and every Node loader that
  runs the engine's file in a sandbox (scripts/tests/model-health.mjs and tmdl-model.mjs get a `require`).
- **Plan:** characterise on the base (MCP sp9, website sp9), move, the same records pass unchanged.
- **MCP suite sp9 (test-0.3.2-sp9.mjs, area model):** A1-A11 `analyze()`'s whole output (findings, unused fields,
  score, skipped, questions, tables, measures) as JSON for 11 made-up models: the health and twin projects, the TMDL
  fixtures (folder and .pbit), the Ramadan TMDL, legacy.pbit, and five written here (DAX comments of all three kinds,
  strings holding brackets and quotes, quoted table names with spaces and apostrophes, VARs, an Arabic table, virtual
  columns, a calculation group, roles, aggregations; PBIR and legacy reports with bookmarks, hierarchy levels and report
  measures), one an incomplete TMDL model (its warning kept); T1 the tokens and report references of 14 inputs; Q1
  check_model_health's answer (health project and the incomplete model); C1 the cases cover each of those. After the
  move: P1 the parser holds no model state and the engine's functions are the parser's; P2 the load order.
- **Website suite sp9 (scripts/tests/sp9.mjs, shard 2):** the Model Health Check page ?lang=en and ?lang=ar through
  the worker: the sample, a made-up .pbit with the tricky DAX and an Arabic table, and an incomplete TMDL project; every
  tab's text as recorded. W3 after the move: the worker loads the parser before the engine, each page once.
- **Expected checks:** sp9 14 on the base, 16 after; website sp9 2 on the base, 3 after. Records unchanged.
- **Before -> after (expected):** model-health-engine.js 1436 -> about 1260 lines; dax-reference-parser.js about 200.
- **State:** plan pushed. **Resume:** write the two suites on the base.
