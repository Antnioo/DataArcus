# FN1J (0.3.2): plan_layout's `register` into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1J" (9 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines), D-1104-12
  (a library of functions, fixed at the source); D-1027-03, D-1027-04, D-1027-05, D-1027-12, D-1105-16, D-1105-18,
  D-1109-01 bind it (none changes: no text, order or output moves).
- **Base:** `fix/0.3.2-fn1j` from `origin/integration/0.3.2` at 207784c6 (WN1 merged). Pushed only this branch; no PR.
- **Scope:** `mcp/tools/plan_layout.mjs` `register` only: the schema (title, description, inputSchema) stays in
  register word for word; the handler's body moves into 22 file-level steps given one context (`lc`), called in the
  old order. Every moved line byte for byte, its indent too (a multiset line diff against 207784c6: 0 lines lost,
  73 added: the steps' lines, comments and calls). No new module: MODULES.md unchanged.
- **Commits:** plan 4007fe44; fn1j 88253f60 (recorded on 207784c6); the split 09e39792 (with CHANGELOG and WORK.md);
  fn1j's added plans 7cff7ff1, 9079baef (each recorded with the base's plan_layout.mjs); the note (this file) after.
- **Sizes (my measure, `espree`, first to last line, nested functions inside their parent):** register 471 -> 46
  (the reviewer's 471, :52-522). Every step 80 or fewer: modelStep 72, lintStep 40, titlesStep 31, terminologyStep
  30, planStep 29, saidStep 28, layoutStep 27, the rest 25 or fewer. plan_layout.mjs 522 -> 595 (under 600, so no
  plan-layout-steps.mjs). Named functions over 150 lines (assets/js, mcp/lib, mcp/tools, server.mjs): 1 -> 0.
- **Expected checks:** the suites that pin plan_layout green before and after with the same check counts; no
  fixture re-recorded; fn1j new. **Got:** the 47 suites of tier 1 (below) "PASS" on 207784c6 and on 09e39792 with the
  same PASS line each; all 128 suites that call plan_layout green on 207784c6; the full MCP run on 9079baef "run-tests: 229
  suites passed" (test.mjs "PASS  mcp  1595 checks", as on the base).
- **Characterisation, red-proven on 207784c6:** 153 one-change mutants, each alone in a git worktree of the base:
  57 red on an existing suite, 120 red on fn1j (each red there under its mutant on the base first), together 127;
  26 red nowhere (below: 18 equivalent or unreachable, 8 not reached by any input I built). fn1j: 90 made-up plans,
  their answers (148 pins with the plans' data), 3 checks.
- **The plan's answer size:** fn1j pins each of the 90 answers' length and sha256 (normalised: the working folder,
  the plan id, the path limit's numbers): the same on 207784c6 and on the split, so at one path every answer has the
  same size (the largest: the custom visuals plan F02, 31,772 normalised characters).
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/42570318212 on 5afa63f7 (Linux and Windows; macOS
  skipped by the workflow on a branch run), read 2026-11-09T06:12Z. After it only this note changed.
- **State: DONE.**
- **Resume:** none; the reviewer's merge (the ratchet's fn_over_150: plan_layout register leaves it).

## The steps (one per part of the old handler, called in the old order)
- the exits stay in the handler: the redesign (its refusal or its plan) and the sample.
- stateStep (old 90-96), modelStep (97-166), layoutStep (167-191), limitsStep (192-212), gulfDatesStep (213-222),
  monthOrderStep (223-238), customVisualsStep (239-248), switcherStep (249-254), iconsStep (255-260), daxStep
  (261-267), axesStep (268-269), lintStep (284-321), exactStep (322-339, async: the exact artifact, its checks,
  WN1's path limit, F05), titlesStep (340-368), previewStep (270-283 and 369-377), kindsStep (378-400), saidStep
  (401-426), slicersStep (427-445), writesStep (446-457), terminologyStep (458-485), planStep (486-512, the
  proposal), answerStep (513-520, returned).
- The one change of order: previewOf (a closure) is defined in previewStep, after the lint step, instead of before
  it. It reads planNames, which the lint step sets; the old closure read the live name at its call (after the lint),
  so it reads the same value. The split script refuses any other closure that reads a name a later step sets: none.
- The order of every planProblems push is the old one (the steps run in the lines' order; the pushes are moved lines).

## The mutants and what caught them (scratch mutants.mjs; ids by step)
- **Tier A, all 153:** the split pins (sp1, sp2, sp3, sp4, sp7, sp13, sp23, sp41, sp43, sp44) and fn1j. Red on a pin:
  sp43 35, sp1 34, sp3 34, sp7 28, sp13 28, sp4 24, sp23 11, sp44 11, sp2 4.
- **Tier B, the part's own suites** (gulf-date-questions, custom-visuals-lab, metric-switcher, dax-functions,
  shared-axes, terminology-sheet, tt1, cx1, wn1, fx2, sq10, j14, b146, ...: scratch mutrun.mjs's list per step), on
  every mutant both the pins and fn1j missed: sq13 L2 (the page's tab rows' grow), dax-functions D3 (the model's DAX
  problems), sq10 E1 and F17 (the Hijri year in the exact build; the format script already there), j14 E2 (a capped
  check).
- **Tier C, the 47 suites of tier 1 on the 28 left:** sq10 G3 (the Hijri year the date questions give, the same
  value E1 drops), j14 F7 (the checks that did not run, in the plan's data); 26 red on none.
- **fn1j only (each red on 207784c6 under its mutant):** exits 0, stateStep 2, modelStep 5, layoutStep 2, limitsStep
  8, gulfDatesStep 2, monthOrderStep 2, customVisualsStep 6, switcherStep 3, iconsStep 2, daxStep 3, axesStep 2,
  lintStep 1, exactStep 2, titlesStep 2, previewStep 2, kindsStep 5, saidStep 4, slicersStep 1, writesStep 6,
  terminologyStep 2, planStep 5, answerStep 3.
- **Equivalent or unreachable (18):** M4 (planNames' key order: the given names and the readable proposals never
  share a key, and the pins read them in the same order downstream); M7, M9 (a reused term dropped in the model
  step: the lint step's own confirmedOf adds the same names back, so the plan is the same); T2 (timeAxisPlan returns
  null only for a field with no column, which the field check refuses first); N3 (the lint's "large model" skip comes
  after the area problem, which skips it first); N9 (the aggregation guard's problems: the writer writes no
  non-additive value in a stacked kind today, "a guard for later"); TT2 (a field kept English on purpose is never in
  notTranslated: given names are not drafted); V2 (the preview always draws the exact files, so its displayNames are
  not read); B2 (writesAr's bilingual part: writesAr needs lang "ar", and en+ar with lang "ar" is refused before);
  G4 (the Gulf questions' axis from planFields or the picker: the same date table on every model with questions);
  Y3 (the format line's count is the same sentence either way when the counts agree, as on every model built);
  V5, E3 (a capped check that did not run, or a blocked exact build: no made-up input I found makes a must-run
  check capped, or the exact build fail its check; j14 reaches a check not run, F7); TT7 (a mixed field parameter title on an Arabic
  page: no model with a field parameter here); TT1, TT9 (more than 30 English titles on one Arabic plan: hand-placed
  pages take their own titles); Y5, Y6 (a calendar that cannot get Arabic columns: none of the models).
- **Not reached by the inputs I built (8):** L4 (the table's share of a narrow row by planFields.table: exec, ops,
  focus and analysis with 1 to 8 fields gave the same layout); N4, N6, N7 (the lint step's own names for the fields only the lint adds, a term confirmed for
  one of them); K3 (a kind change that drops a Top N); B6 (the status icons' script in Arabic: no input gave icon
  columns); TT3 (a title "<field>:"); F14 (the bilingual report's measures list).

## fn1j (new, mcp/test-0.3.2-fn1j.mjs, area report)
- 90 made-up plans (fixtures/fn1j-cases.mjs) on 13 made-up models (sp1's tiny model and variants: no measures, no date,
  140 tables with display folders, a measure no fixed list names, a month-year label, a Hijri calendar; the twin and
  health fixtures, a second report beside the twin's; the sample project's files; the custom visuals lab twice;
  Time Lab), one per condition: A1 every answer, A2 every proposed plan's data (writes, data, the exact files' digest,
  the native copy's pin and binding), C1 every part's key reached. Called in process through the registered tool, its
  inputs parsed by the tool's own schema; SP1's fixed seed. Pins recorded with the base's plan_layout.mjs only
  (FN1J_RECORD=1); the same pins in a folder with a longer path (TMPDIR) and 3 runs in a row.

## Decisions I made
- The steps stay in plan_layout.mjs (595 lines, under 600): no new file, so the source guards that read
  plan_layout.mjs (claims, bd1, sq10, sq13, write-gate's formatsAnswer x2, op1, sp43's M3) need no change.
- Moved lines keep their 4-space indent (byte for byte, as FN1C): a step's own lines are its first (the destructure
  of the context on the function's line) and last (`Object.assign(lc, {...})`).
- A step takes from the context every name it uses that another step set (`let { ... } = lc`) and hands back each
  name a later step uses; eslint-scope gives both (scratch split.mjs), lint's no-undef and no-unused-vars the proof.
- Tier B runs only on the mutants the pins and fn1j both missed (the first 6 ran it on all): 2 minutes a mutant would
  have been 5 hours; tier C (all 47) then ran on the 28 left.
- fn1j's added plans go at the end of its list, so the seeded ids of the earlier plans (and their pins) stay as they
  were; each addition was recorded with the base's plan_layout.mjs put back for the recording only, the old pins
  checked unchanged.
- No ledger place names plan_layout (mcp/docs/CONTRACTS.md, contracts-probe.mjs): nothing moved there.

## The runs
- Base 207784c6: tier 1's 47 suites PASS (each its own line, e.g. sp1 11, sp2 10, sp3 11, sp4 5, sp7 11, sp13 12,
  sp23 29, sp41 24, sp43 21, sp44 23, gulf-date-questions 68, custom-visuals-lab 72, metric-switcher 60,
  dax-functions 92, shared-axes 37, terminology-sheet 48, wn1 38, large-model-caps 215, fn1g 222, sq10 29, bd1 18,
  sq13 39, claims 721, write-gate 7, op1 16); all 128 suites that call plan_layout green (test.mjs "PASS mcp 1595
  checks"; the split file was copied into the checkout 7 seconds before that run's end, so test.mjs is counted again
  in the full run below).
- Split 09e39792: the same 47, each the same PASS line. fn1j "PASS  fn1j  3 checks" on every commit after it.
- The full MCP run (`npm test -- --keep-going`, every suite of the 5 shards in one process) on 9079baef, the last
  code commit: "run-tests: 229 suites passed" (fn1j 3, sp1 11, sp43 21, mutation 244: 97 mutants, all killed).
  Lint 0; site config, result-lines 229, changelog-words 250, agent-memory 461, test-contracts 14, check-contracts
  717, check-modules 1198 pass. No website file changed (no website suite, no build:min, no sitemap change).
- Integration had not moved before the CI run (origin/integration/0.3.2 still 207784c6): nothing merged in.

## CHANGELOG line
- **Inside plan_layout, in smaller steps:** the plan's model read, its names, layout, checks against the limits, date
  questions, options, exact report, titles, preview and answer are each made by short named steps instead of one long
  function; every answer, problem and plan held for the approval page is byte for byte what it was before, and the
  tool's name, description and inputs are unchanged.

## For the owner
none

## Risky changes
none: no security policy, approval step, file writing, answer, network or process change (every answer and plan
held for the approval page is pinned byte for byte: fn1j's 148 pins, sp1's 10); no test loses a check (fn1j added).

## For the laptop
none

## Seen, not in scope
- B381, B383 (open plan_layout bugs, named in the brief): not touched.
- Dead or unreachable branches in plan_layout's handler today (the equivalent mutants above): T2's `|| { order:
  'own' }`, N3's large-model skip in the lint, TT2's keptOnPurpose filter (it never meets a notTranslated field), V2's
  displayNames in previewOf, writesAr's bilingual part (B2). Each could go in a later clean-up; not here (behaviour
  only).
- The status icons on the made-up models: `statusIcons: true` with a measure and its "Target" gave no icon column
  (columns []), so the Arabic script line (B6) is reached by no suite.

## Lessons for the reviewer
- A mutant run of 47 suites costs about 2 minutes a mutant here (4 cores): a fast whole-answer pin (fn1j, 5 s) first,
  the part's suites only on what it misses, keeps 153 mutants near 1 hour.
- Two mutants can be equivalent only together: M7 and M9 (a reused term dropped in the model step) are put back by
  the lint step's own confirmedOf; a mutant's survival is not always a missing input.
- A pin added to a seeded suite goes at the end of its list: a case inserted earlier moves every later seeded id.
