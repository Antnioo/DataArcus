# FN1C (0.3.2): three writer and twin functions into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1c" (5 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's
  plan), D-1104-12 (a library of functions, fixed at the source), D-1104-18 (keep building the library).
- **Base:** `fix/0.3.2-fn1c` from `origin/integration/0.3.2` at ca3a1b73. Pushed only this branch; never merged, no PR.
- **Scope:** three functions split into named steps, each in its own file (no new module): `assets/js/pbip-page.js`
  `write`, `mcp/lib/twin-plan.mjs` `planTwin`, `mcp/lib/shadow-model.mjs` `shadowModel`. Code moves; no text, order,
  key or file byte changes. FN1A's method: steps are file-level functions given one context object.
- **Commits:** plan e5a064b4; shadow pin cc24b392; shadowModel 389bde79; planTwin 11bd7006; write ba9f84a7 (with its
  build:min stamps); CHANGELOG 28429a64; the twin pin 9fc91ee3, 79855dab, ff134b83, 648312f0; the writer pin 9bf4ffe7,
  5f8e87bc.
- **Function sizes (my measure, `espree`, first to last line, nested functions inside their parent; the gate's
  `ops/gate/funcsize.py` is not in DataArcus):** write 327 -> 14, planTwin 321 -> 17, shadowModel 212 -> 12. Every new
  step 80 or fewer: the largest are tablesStep 73, phonePart 57, rowsStep 57, labelsStep 52, visualsPart 51,
  sameTitlesPart 51. Files: pbip-page.js 426 -> 501, twin-plan.mjs 433 -> 522, shadow-model.mjs 364 -> 407 (each under
  600). Over 150 in these files now: only pbip-page.js's own wrapper (as on the base).
- **Ratchet:** the brief's count (the gate's) 21 -> 18 for the reviewer to set. My script over assets/js, mcp/lib,
  mcp/tools and server.mjs, the files' own UMD wrappers left out: 39 -> 36 (it counts more files than the gate does).
- **Expected checks:** (each run's output file, its PASS/FAIL total line) the base ca3a1b73 after `npm run build:min`:
  MCP `npm test -- report twin model` "144 suites passed"; website pbip 111, sp7 3, sp13 3. **Got** on the split:
  MCP "145 suites passed" (the 144 with the same check counts, suite by suite, plus the new fn1c), website pbip 111,
  sp7 3, sp13 3. No fixture re-recorded (sp7-reports.json, sp11/sp26/sp40-twins.json, sp28-builds.json unchanged).
  New suite fn1c 69 checks (its three fixtures recorded on ca3a1b73 only, then green on every split commit). Lint 0;
  site config, check-min (stamps), csp, check-modules, agent-memory, changelog-words, result-lines pass.
- **Characterisation, red-proven on ca3a1b73:** 111 mutants (shadow 22, twin 45, page 44), one or more per step, each
  in a git worktree of the base; which suite turned red: below. Every part no suite turned red got a check in fn1c,
  red on ca3a1b73 under that mutant first.
- **State:** CI_PENDING (see "CI" below).
- **Resume:** CI on the branch; then DONE.

## The steps (one per job of the old function, called in the old order)
- **pbip-page.js write**, context `pc` (the page; the report's names destructured from `c` in each step as before):
  pagePart (page.json), kitPart (take, container, placeNav), slotsPart (fitSlots, kinds, reading order, groups'
  boxes, KPI row, slicers), groupsPart, headPart, visualsPart, tipsPart (the filter panel, chart tooltips),
  phonePart, sameTitlesPart, topTitlesPart, filesPart. The `let z` several steps write is `pc.z`.
- **twin-plan.mjs planTwin**, context `ctx`: placeStep, picturesStep, labelsStep, pagesStep, mirrorsStep,
  cannotStep, checksStep, builtStep, tablesStep, legendsStep, glassStep, copyStep, listsStep, answerStep (planTwin
  returns it). `addedVisuals` (set twice) goes back to the context where it changes.
- **shadow-model.mjs shadowModel**, context `sm`: planStep, keysStep, sizesStep, poolsStep, rowsStep, tablesStep,
  modelStep; the answer is built in shadowModel.

## The mutants and what caught them (ids in mcp/work's scratch lists, one change each)
- **shadow (S1-S22):** r1-see-the-result 3 (S3, S5, S20); the other 19 no suite: fn1c H1-H3 (all 22 red there).
- **twin (T1-T46, 45):** sp40 22; twin area 4 (vc1 T10, mp1e T14, language-toggle and glass-twin T28, sq4 T36); 19
  no suite (the plan's said lines for shapes no fixture has: a refused flat matrix, labelFrom, mixed titles, picture
  pages kept, bars beside names, kept positions, matrix choices, DAX library, flip faces, field parameter choices,
  hidden-name bars, no model, wide tables, legends, title measures not translated, timeRightToLeft false, the flat
  table's loss): fn1c P1-P3 (all 19 red there).
- **page (P1-P44):** see "Page mutants" below.

## Decisions I made
- The steps are written by a script from the old line ranges (each moved line byte-identical); each step's inputs
  are read from its own syntax tree (eslint-scope: the names it uses that the old function declared), its outputs
  are the names it declares or writes that a later step uses; lint's no-undef and no-unused-vars as the proof.
- `z` (write) is renamed on the syntax tree to `pc.z` (identifiers only; `{ z }` becomes `{ z: pc.z }`, the same
  key in the same place). write's block `{ ... }` of the titles is opened into two steps (its names were block-local:
  TOPPED goes to topTitlesPart through `pc`).
- The pins are digests of whole outputs recorded on the base (`node test-0.3.2-fn1c.mjs --record`, run in a worktree
  of ca3a1b73 only), not text checks: a mutant anywhere in what the three functions return turns them red.
- fn1c's twin project is built by a helper, `mcp/fixtures/fn1c-twin.mjs` (twin-project plus two pages of shapes and
  three picture pages, PNGs made with zlib), as fixtures/twin-runs.mjs is for sp11; the writer's builds follow sp28's.
- No new module: MODULES.md unchanged (the interfaces are the same). `ops/gate/samejob.py` is not in DataArcus: no
  helper was written, only the steps of each function.

## CHANGELOG line
- **Inside the report page writer, the Arabic twin's plan and the shadow model, in smaller steps:** each is made by
  short named steps instead of one long function; every file written, every line of the twin's plan and every shadow
  model file is byte for byte what it was before.

## For the owner
none

## Risky changes
none: no security policy, approval step, file writing, answer, network or process change (the writer's files and the
twin's plan are pinned byte for byte); no test loses a check (one suite added, fn1c 69).

## For the laptop
none

## Seen, not in scope
- The other functions over 150 lines (my measure lists, among others, pbip-export.js build 205, meaningOf 201,
  check_model_health register 196, gulf-health analyze 184): for the next FN jobs.
- sp11/sp26/sp40 pin the twin's plan only for their fixtures: 19 of the plan's said lines had no fixture at all.

## Lessons for the reviewer
- A test file copied into a worktree that is not in its tests.json makes `run-tests.mjs` refuse to start: an area run
  used as a mutant's catch-all then reads red for every mutant. Copy tests.json with the test.
- A background command stops at 30 minutes by default: mutant runs need the 2-hour limit.
- test.mjs (area core, about 11 minutes) also builds reports; it is not in `report`: an area run is not every suite.
