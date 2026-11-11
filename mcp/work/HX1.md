## Summary
- **Approval:** the owner, 11 Nov, D-1111-12: "one of the fables will be something really tricky and hidden that will unlock
  future of many possibilities for Dataarcus" (relayed by the hub; the builder finds it with evidence, proves a first stage,
  never merges).
- **Base:** `feat/0.3.3-hx1` from `origin/integration/0.3.3` at 69b27179. Push only this branch; never merge, no PR.
- **Scope:** phase 1, three hidden capabilities ranked by evidence, one chosen (this note, before any code); phase 2, the
  winner's first stage as a new library module with its tests (red first), its MODULES.md row, its tests.json line and one
  small demo on made-up models. Nothing a tool writes or answers changes. Out: FB3's files (design-metrics.js, fitSlots,
  the fb1 suite, the layout fixtures), mcp/CHANGELOG.md.
- **Expected checks:** (written before the code) new suite `hx1` (`mcp/test-0.3.3-hx1.mjs`, area checker), about 50 checks, red
  on 69b27179 first (no `lib/lineage.mjs`): the ten planted changes below each found on exactly its visuals; no other
  suite's number moves; `node scripts/check-modules.mjs --strict`, `scripts/check-contracts.mjs`, lint 0; CI green.
- **Resume:** phase 1 written 2026-11-11T08:17Z (the winner: the number's lineage); next: the suite red, then `lib/lineage.mjs`.

## Phase 1: what is hiding (written 2026-11-11T08:17Z, before any code)
Read end to end: MODULES.md (every row), CONTRACTS.md's families, the 11 tools, the engines, the twin's steps, the gate, the
research folder, NC1, PK1, R1, FB1. Every number below is from a run I made on this branch at 69b27179, on the made-up
fixtures (`mcp/fixtures/twin-project`: 17 visuals, 9 with a query).

### 1. The number's lineage: for each visual, everything its numbers depend on, and one print of it (the winner)
- **What it is.** Join three things DataArcus already computes and never joins: the question a visual asks
  (`questionOf`, lib/same-question.mjs:87), the fields a report references (`collectReportRefs`,
  assets/js/dax-reference-parser.js:53-83) and what a DAX text references in the model (`daxRefs`,
  assets/js/model-index.js:125). Follow each visual's fields through the measures they call, the columns and tables under
  them and the relationships a filter can travel, and hash what was met. Two versions of a model and a report then
  answer, visual by visual: "this number can only have moved because the data moved" or "it can show another number,
  because [Margin %] calls [Margin] calls [Returns Value], whose DAX changed".
- **Why it is hidden.** The pieces sit in three subsystems that never meet. (a) The health check builds the whole
  dependency graph on every run (`graphStep`, assets/js/model-health-engine.js:81-125) and keeps only "used or not" and a
  list for the documentation (:183-217, :274-322); the graph itself is not in its API (:333). It even counts each field's
  visuals and pages (`vis`, :134-146) and then drops which visual. (b) The number check reads the report's files only:
  measured, `sameQuestion` on twin-project and a copy says "9 of 9 visuals ask the same question" before AND after I
  doubled [Total Sales] in the model; it refuses two models (same-question.mjs:171) and its own text says a model changed
  since is not proved (:162). The public plan's layer 2 has the same hole ("with the model as it was then",
  plans/NUMBER-CHECK.md). (c) The gate has one print for the whole model (lib/artifact.mjs:31): measured, the same edit
  changes it, so any edit anywhere voids every approval, and nothing says which visuals it reaches.
- **What it unlocks** (each a product or a feature, none possible today):
  1. `check_report` `against` across a model change: "the model was edited: 2 of 10 visuals can show other numbers, and why".
  2. Before an edit: "what does [Returns Value] reach": the pages and visuals behind a measure, a column, a relationship.
  3. An approval that lasts: the prints kept at approval; later, which visuals are still exactly what the person approved.
  4. A check for a Power BI project in git (a CI step or an Action): a pull request's comment names the visuals its change
     can move. Pure JavaScript on files: no Desktop, no data, any machine.
  5. Layer 2 made cheap: only the visuals whose print changed need their queries run in Desktop.
  6. The Arabic twin and the EN-AR copy told stale: which of their visuals no longer match the original or the model.
  7. The website's health check: "safe to remove" backed by the visuals a field reaches, and a lineage page in its docs.
- **First stage:** one pure module on exported helpers, a suite, a demo: a day. **Risk:** soundness. "Cannot have moved"
  must never be said wrongly, so every doubt goes to "can show another number", and what is outside the files (data, row
  level security, a custom visual's logic) is said, as same-question does. The relationship rule is from Microsoft's
  documented filter propagation, not measured in Desktop: it is stated as a rule and is a laptop item before any public claim.

### 2. One change ledger for every copy (the redesign's allowlist grown to the twin and the native copy)
- **What it is.** The redesign is "a lossless copy with allowlisted patches" checked independently
  (lib/redesign-kinds.mjs:1-16, `verifyCopy` lib/redesign.mjs:344). The twin and the native copy write whole trees with
  their own checks. One ledger for all three would unlock: (a) an edit in place with an undo file, (b) "what changed"
  between any two versions of a report, (c) the twin synced again after the original changed.
- **Evidence.** One mirror of twin-project's 17 visuals changes 58 leaf pointers; the 5 enabled kinds can name 16 of them
  (the place and size), the 4 planned kinds (redesign-kinds.mjs:78-107) 0 more.
- **Why it loses.** It is the next item of a known track (PK1's planned kinds), not hidden; 42 of 58 pointers need new
  kinds, each a Desktop measurement; and its biggest prize, the edit in place, needs an invariant lifted ("as new
  files", ARCHITECTURE.md), which is the owner's rule, not a builder's stage.

### 3. The mirror run backwards (an English twin of an Arabic report)
- **What it is.** If mirroring twice gave the original back, the same engine would make a left-to-right twin of a report
  built Arabic first, check any twin by a round trip, and give the fuzz suites an oracle for free.
- **Evidence.** `mirrorVisual` twice on twin-project (assets/js/report-mirror.js:110): 16 of 17 visuals change once, 7 of
  17 come back; the 10 that do not: 3 buttons, 2 column charts, a bar chart, a table, a navigator, a text box, a plain one.
- **Why it loses.** 10 of 17 do not come back, each for its own measured reason (padding, alignment, sort, axis side), so
  the first stage is ten Desktop questions, not a module; and it serves one product, not many.

Also weighed: the shadow model and the box comparison (lib/shadow-model.mjs, lib/box-diff.mjs: real, but known since R1 and
waiting for the laptop, not for code); the 80-plan corpus (FB3's ground now); the "Please confirm" answers kept beside a
model (assets/js/confirm-memory.js) as a reviewed dictionary (one feature, and it needs the owner's Arabic).

**Why 1.** It is the only one whose missing part is a join, not a measurement; it serves the direction's own sentence
("makes AI-built Power BI trustworthy": an AI edits measures far more often than layouts, and today nothing says what a
measure's edit reaches); and it turns the number check, the approval and the health check from three islands into one
platform that works on files alone.

### The first stage, and its expected numbers (before the code)
`mcp/lib/lineage.mjs`, pure: `lineageOf(model, report)` (each visual's nodes and three prints: question, display, order),
`compareLineage(before, after)` (which visuals can show other numbers, the tier, the chain of names that says why; no
hash, no value), `reachOf(lineage, name)` (the visuals a measure, column or table reaches). A made-up model, "Souq"
(`mcp/fixtures/hx1-souq.mjs`: 8 tables, 12 measures, 6 relationships, 2 pages, 11 visuals of which 10 ask a question),
and ten planted changes; the visuals each must name, worked out by hand:
| # | the change | must name |
|---|---|---|
| 1 | [Returns Value]'s DAX | 2 question (the Margin % card through 3 measures, the Net Revenue bar), 8 same |
| 2 | [Margin %]'s format string | 1 display |
| 3 | Calendar[Month] sorted by another column | 2 order (the two charts by month) |
| 4 | the relationship Returns to Store removed | 2 question (the bar by region, the table by city) |
| 5 | a new measure nobody shows, and [Headcount] edited | 0: 10 of 10 same |
| 6 | the calculated column Sales[Line Margin]'s DAX | 1 question |
| 7 | the Sales table's source query | 8 question |
| 8 | in the report: a table's Category swapped for Brand | 1 question (as same-question says today) |
| 9 | Calendar[Year]'s source column | 6 question (the page's slicer is on it) |
| 10 | [Revenue]'s DAX | 6 question |
Reach: [Returns Value] 2 visuals on 1 page; Sales[Cost] 2 visuals; [Headcount] none. Parity: each measure's direct
references equal the health check's own `dependsOn` (so the two can never drift). No hash and no planted literal in any
compared answer. The demo (`mcp/lab/lineage-demo.mjs`) prints changes 1, 4 and 5 beside what `sameQuestion` says today.
