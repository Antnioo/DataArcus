## Summary
- **Approval:** the owner, 11 Nov, D-1111-12: "one of the fables will be something really tricky and hidden that will unlock
  future of many possibilities for Dataarcus" (relayed by the hub; the builder finds it with evidence, proves a first stage,
  never merges).
- **Base:** `feat/0.3.3-hx1` from `origin/integration/0.3.3` at 69b27179. Push only this branch; never merge, no PR.
- **Scope:** phase 1, three hidden capabilities ranked by evidence, one chosen (this note, before any code); phase 2, the
  winner's first stage as a new library module with its tests (red first), its MODULES.md row, its tests.json line and one
  small demo on made-up models. Nothing a tool writes or answers changes. Out: FB3's files (design-metrics.js, fitSlots,
  the fb1 suite, the layout fixtures), mcp/CHANGELOG.md.
- **Expected checks:** (written before the code: "about 50 checks", the ten planted changes) **got:** new suite `hx1`
  (`mcp/test-0.3.3-hx1.mjs`, area checker) 59 checks, red on 69b27179 first (59 of 59 failed: no `lib/lineage.mjs`); the
  ten planted changes each on exactly its visuals. checker 13 suites passed, release 5 suites passed, no other suite's
  number moved; `node scripts/check-modules.mjs --strict` PASS 1226 checks (219 files, 219 rows), check-contracts PASS
  858, check-result-lines PASS 244, check-agent-memory PASS 514, lint exit 0.
- **Resume:** stage 1 built and pushed (e96eda91, 2026-11-11T08:25Z); the reviewer: review and merge (nothing user-visible). The
  owner: "For the owner" 1 to 4. Next builder: "Next stages" 2.
- **Result:** a model edit that the number check cannot see today (measured: "10 of 10 visuals ask the same question"
  after a measure's DAX changed) is named on exactly its 2 visuals with the chain of names; `node lab/lineage-demo.mjs`.

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
| 1 | [Returns Value]'s DAX | 2 question (the Margin % card through 3 measures, the Net Revenue bar), 8 same (got: through 2, see Before -> after) |
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

## Before -> after (stage 1, 2026-11-11T08:25Z)
- **Before (69b27179).** A model edit is invisible to the number check: on Souq, after [Returns Value]'s DAX changed, a
  relationship was removed, or a measure was added, `sameQuestion` says each time "10 of 10 visuals ask the same
  question; 0 differ" (the demo prints it). The gate's one model print changes for all three alike.
- **After.** `lib/lineage.mjs` (pure, 4 exports and their words; MODULES.md row: `lineage.mjs | ... | none (a test) | yes`,
  purity from `check-modules --strict`: it imports no `fs` and reads no `process.env`; it loads same-question.mjs, which
  does). The same three edits: 2 visuals named with "[Returns Value] measure: its DAX changed, reached through
  [Margin %] > [Net Revenue]"; 2 visuals named with "Returns[StoreKey] to Store[StoreKey] relationship removed"; "10 of
  10 visuals can only show other numbers if the data changed". Reach: [Returns Value] 2 visuals on 1 page, Sales[Cost] 2
  on 2 pages, [Headcount] 0.
- **The ten planted changes: all as written before the code.** One number in my table was wrong by hand, not in the
  code: change 1's chain is 2 measures ([Margin %] > [Net Revenue]), not 3, because [Margin %] calls [Net Revenue]
  directly and the shortest chain is said. The test pins 2.
- **Nothing a tool does changed:** no file of `mcp/tools/`, `server.mjs` or `assets/js/` is touched; no suite's
  expected number moved; CHANGELOG untouched.
- **What the rule covers (tested, X1 to X12):** a report's own measures, a hierarchy level, a calculation group reached
  by a filter, a colour set by a measure (display only), a field the model lacks ("not in the model"), USERELATIONSHIP
  and CROSSFILTER (every path counts), a both-directions relationship, roles (said once for the model, never their
  filter), a visual gone or new, a missing model or report (no throw).
- **What it does not prove** (`NOT_PROVED`, in every compared answer): the data, row-level security per person, a slicer
  synced from another page, bookmarks, a custom visual's own logic, DAX that builds its references at run time. The
  relationship rule (lineage.mjs `relsFor`) is from Microsoft's documented filter propagation, not measured in Desktop.

## Decisions I made
1. **The relationship rule errs to "more".** A relationship counts for a visual when a filter can travel it between two
   of the visual's tables, or when its one side is one of them (an unmatched key adds a blank row there). So a
   relationship's change can name a visual whose number would not move (change 4 names the table by city); it never
   leaves one out by this rule. A tighter rule needs Desktop runs (stage 4).
2. **Built on the index's exported helpers (`daxRefs`, `normalizeModel`, `buildIndex`), not on the health check's
   `graphStep`,** which is not exported; exporting it changes `model-health-engine.js`, its `.min.js` and the health
   page's stamps: a website change, outside this job's scope. The two graphs answer different questions (the health
   check: what must stay so nothing breaks; the lineage: what can move a number), and P1 pins that every measure's
   direct references are equal in both, so they cannot drift unseen.
3. **A measure's home table is not a dependency** (the health check adds it so a clean-up keeps the table); a measure in
   `_Measures` does not depend on `_Measures`' query.
4. **Names leave through `safeName`** already (read-report.mjs's), so stage 2 adds no screening of its own; S4 pins it.
5. **The prints are returned by `lineageOf` only**, never by `compareLineage` or `reachOf` (S3). Where a print may be
   kept on disk is the owner's (ask 3): a print of a filter with one short value could be guessed by trying values.
6. **WORK.md's cap:** the file was at 3,197 of 3,200 characters; to add HX1's line I shortened FB1's and MH1's entries
   to their note's path (the words are in their notes). 3,180 now.
7. **The demo writes Souq's report to a temporary folder** (`os.tmpdir()`, removed after) only so that same-question,
   which reads from disk, can be shown beside the lineage. The lineage itself reads nothing.

## Next stages (each a builder's job of a day at most)
2. **`check_report`'s `against` across a model change** (ask 1). The tool reads the model beside each report
   (`loadModel(...).tmsl`), and a second model when `againstModel` (a backup's or a git checkout's path) is given; the
   section `lineage` beside `sameQuestion`, inside check_report's cap (the 60 listed and 6 reasons are already capped).
   Tests: the twin, the native copy and the redesign of twin-project stay "same"; the planted model edits; a canary in a
   DAX string and in a filter; TOOLS.md, PRIVACY.md's row. User-visible: CHANGELOG.
3. **"What does this reach" before an edit** (ask 2): `read_model` (or `check_model_health`) with `reach: "[Measure]"`
   answers the pages and visuals of every report beside the model, by tier. The health check's "unused" findings can then
   say the visuals behind a used field. One export from the health engine (`graphStep`) so both read one graph: a website
   change with its stamps and `node scripts/test-site-config.mjs`.
4. **The approval that lasts** (ask 3) and the laptop proof (ask 4): at a write, the prints of every visual kept in the
   plan's record beside the report; `check_report` later says which visuals are still exactly what was approved and
   names what moved. Laptop: 6 of the planted changes run in Desktop on a shadow of Souq (lib/shadow-model.mjs), the
   numbers before and after compared by the owner: does a visual the lineage calls "same" ever move? Then the public line.
Later, each its own decision: a check for a project in git (a CI step that comments a pull request), the twin told
stale, layer 2 run only on the visuals whose print changed.

## For the owner
1. **Yes / no:** stage 2: `check_report` also says which visuals a MODEL change can move (an option, not a 12th tool).
2. **Yes / no:** stage 3: "what does this measure reach" as an option of `read_model`.
3. **Yes / no:** may DataArcus keep each visual's print in a small file beside a report it wrote (hashes of definitions
   and filters, no names of values, no values), so a later check can say "still as approved"? It is a new file kind in
   the person's project, so it would be in the plan and the approval page.
4. **Laptop, when you batch:** the six Desktop runs of stage 4 (about 30 minutes): they turn "by rule" into "measured".
5. **A name:** I call it "the number's lineage" in the code and the note. Public wording (never "first" or "only") is yours.

## Risky changes
None in what ships: a new library no tool loads, a suite, a fixture, a demo. The risk is in the next stage's claim: "can
only show other numbers if the data changed" is a strong sentence. It must stay next to `NOT_PROVED` and stay "by rule"
until ask 4's runs.

## Seen, not in scope
- The health check's `graphStep` (assets/js/model-health-engine.js:81) is the only builder of the full graph and is not
  exported; its `vis` map (:134) knows per visual and keeps only counts. Stage 3 would export it.
- `sameQuestion` cannot take a report in memory (it reads through `locate` and `diskSource` only): stage 2 would give it
  the files once and share the read with the lineage.
- `collectReportRefs` (dax-reference-parser.js:53) drops `Schema: "extension"`: a report measure and a model measure of
  one name are told apart in lineage.mjs by the report's own list, not by the reference.
- `typeName('clusteredBarChart')` answers the raw type; read_report's friendlier names for types live in
  dax-reference-parser.js's `VISUAL_TYPES` (:86): two lists of visual type names.
- The mirror applied twice gives 7 of 17 visuals back (phase 1, candidate 3): a property nobody pins; it would be a
  cheap guard for the twin's fuzz suite where it holds.

## Lessons for the reviewer
- A brief that asks for "expected numbers before the code" on a new capability works when the fixture is designed first:
  the ten rows were worked out by hand from the fixture's file, and the one hand error (the chain of 3) was mine, caught
  by the run. Say in such a brief: "design the fixture, then the table, then the code".
- WORK.md sits a few characters under its cap: a builder that must add its line (L-1108-07) has to shorten someone
  else's. The hub could keep 150 characters free, or say which entry may be cut.
- "Never a copy" (D-1104-12) met "scope: a new module only" here: the one graph lives unexported in a website engine.
  A brief for a discovery job could allow one export line in an engine when the reuse needs it.
