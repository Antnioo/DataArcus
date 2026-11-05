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
  5f8e87bc, 62b6910b, 430e9588; integration merged in once 5024d134 (LG1); the contract ledger bf8fd809.
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
  New suite fn1c 74 checks (its three fixtures recorded on ca3a1b73 only, then green on every split commit). Lint 0;
  site config, check-min (stamps), csp, check-modules, agent-memory, changelog-words, result-lines pass.
- **Characterisation, red-proven on ca3a1b73:** 111 mutants (shadow 22, twin 45, page 44), one or more per step, each
  in a git worktree of the base; which suite turned red: below. 106 red: 62 on an existing suite, 44 on fn1c only
  (each red on ca3a1b73 under its mutant first). 5 page mutants red nowhere (one equivalent, four not reached).
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/42086400939 on bf8fd809 (Linux and Windows; macOS skipped
  by the workflow on a branch run). After it only this note changed.
- **State: DONE.**
- **Resume:** none; the reviewer's merge (WORK.md's 0.3.2 line: FN1C, left to the merge). The ratchet: 21 -> 18.

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
- **shadow (S1-S22):** r1-see-the-result 3 (S3, S5, S20); the other 19 no suite (nor sq14, dd2n, pb1): fn1c H1-H3
  (all 22 red there).
- **twin (T1-T46, 45):** sp40 24; twin area 4 (vc1 T10, mp1e T14, language-toggle and glass-twin T28, sq4 T36); 17
  no suite (the plan's said lines for shapes no fixture has: a refused flat matrix, labelFrom, mixed titles, picture
  pages kept, bars beside names, kept positions, matrix choices, DAX library, flip faces, field parameter choices,
  hidden-name bars, no model, wide tables, legends, title measures not translated, timeRightToLeft false, the flat
  table's loss): fn1c P1-P3 (all 17 red there).
- **page (P1-P44):** sp28 28; website pbip 1 (P8, the dropped line chart's gave); MCP sp13 1 (P15, noPageButtons);
  report area 1 (P32, story-titles: the Top N alt text); 8 no suite: fn1c W1-W2 (P6 a page's tab rows told once,
  P9 the header grown by, P12 the groups' default names, P17 the fourth colour key, P19 a second "No data" name, P27
  a same title numbered, P33 the Count field's name, P39 a renamed title's shortened entry; each red there).
- **page, red nowhere (5; also test.mjs, the core suite, 1594 checks green under each):** P34 (the phone's positions
  with two decimals) is equivalent today: every phone position is a whole or half number (tab widths are ceil'd,
  cards 157.5). P28 (a same title over two columns, numbered) and P29 (a renamed title's alt text with the full
  names): every chart title now carries its column (story titles), so two equal titles over different columns do
  not occur, and the alt sentence with full names equals the one renamed. P41 (the filter panel needs a logo) and
  P42 (the panel only with its Filters button): the header plan draws the Filters button exactly when there is a
  logo, so neither condition differs today. No check added for these five: no input I could build reaches them.

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
- The contract ledger names the step each probed name lives in now (CONTRACTS.md: `own` in tablesStep, `arOf` in
  labelsStep; contracts-probe.mjs `within` the same): the probe still runs the same code.
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
twin's plan are pinned byte for byte); no test loses a check (one suite added, fn1c 74).

## For the laptop
none

## Seen, not in scope
- The other functions over 150 lines (my measure lists, among others, pbip-export.js build 205, meaningOf 201,
  check_model_health register 196, gulf-health analyze 184): for the next FN jobs.
- sp11/sp26/sp40 pin the twin's plan only for their fixtures: 19 of the plan's said lines had no fixture at all.

## Lessons for the reviewer
- A split that moves code out of a named function updates the contract ledger in the same commit: CONTRACTS.md names
  `own` and `arOf` "in planTwin" and scripts/contracts-probe.mjs runs them `within` it (now tablesStep, labelsStep).
  The area runs do not run test-contracts or check-contracts: every website-checks step runs before CI (CI 42085725536
  was red there on 25dc3785).
- A test file copied into a worktree that is not in its tests.json makes `run-tests.mjs` refuse to start: an area run
  used as a mutant's catch-all then reads red for every mutant. Copy tests.json with the test.
- A background command stops at 30 minutes by default: mutant runs need the 2-hour limit.
- test.mjs (area core, about 11 minutes) also builds reports; it is not in `report`: an area run is not every suite.
