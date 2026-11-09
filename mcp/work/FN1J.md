# FN1J (0.3.2): plan_layout's `register` into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1J" (9 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines), D-1104-12
  (a library of functions, fixed at the source); D-1027-03, D-1027-04, D-1027-05, D-1027-12, D-1105-16, D-1105-18,
  D-1109-01 bind it (none changes: no text, order or output moves).
- **Base:** `fix/0.3.2-fn1j` from `origin/integration/0.3.2` at 207784c6 (WN1 merged). Pushed only this branch; no PR.
- **Scope:** `mcp/tools/plan_layout.mjs` `register` only: its schema (title, description, inputSchema) stays in
  register word for word; the handler's body moves into file-level steps given one context (`lc`), called in the
  old order. Code moves, it is not rewritten: each moved line byte for byte (its indent too). No new module.
- **Sizes (my measure, `espree`, first to last line, nested functions inside their parent):** register 471 (:52-522,
  the reviewer's number), file 522. Planned: register about 45, every step 80 or fewer (the largest, modelStep, 72),
  plan_layout.mjs about 595 (under 600, so no plan-layout-steps.mjs).
- **Expected checks:** every suite that pins plan_layout green on 207784c6 and on the split with the same check
  counts (sp1, sp2, sp3, sp4, sp7, sp13, sp23, sp41, sp43, sp44 and the part suites below); no fixture re-recorded;
  a new suite fn1j (made-up models, recorded on 207784c6 only) red on 207784c6 under each mutant it is there for;
  the plan's answer size the same on base and head (fn1j pins every answer's length). Source guards that read
  plan_layout.mjs (claims, bd1, sq10, sq13, write-gate, op1, sp43) stay green with the file unchanged in name.
- **Resume:** characterise on the base (the plan below, step 3).

## The handler's parts (old lines) and the steps
- exits, staying in the handler: the redesign (88), the sample (89).
- stateStep 90-96: the plan's lets, the reused terms, the names given checked (writtenName).
- modelStep 97-166: the model read (refuseUnreadable, existingTheme), the plan's keys, the formats, an English
  plan's readable names, counted and switched fields, an Arabic plan's names (confirmed terms, the fixed list,
  proposeYourself, notTranslated, the counted titles).
- layoutStep 167-191: noAxis, planFit, planNoTime, planLayout, the look, the page size.
- limitsStep 192-212: planProblems' limits (cards, table fields, slicers), the area of a large model, the bilingual
  inputs, redesign-only options, slicers without a filter area, planFields against the model.
- gulfDatesStep 213-222; monthOrderStep 223-238; customVisualsStep 239-248; switcherStep 249-254; iconsStep 255-260;
  daxStep 261-267; axesStep 268-269.
- lintStep 284-321: the design lint, the Arabic names of the fields it adds, the aggregation guard.
- exactStep 322-339 (async): the exact artifact, its must-run checks, blocked, WN1's path limit (F05).
- titlesStep 340-368: an Arabic plan's titles in English, the switcher's labels, the bilingual titles, mixed titles.
- previewStep 270-283 and 369-377: previewOf (moved after the lint: it reads planNames, which the lint step sets; in
  the old code the closure read the live name, the same value) and exactCheck.
- kindsStep 378-400, saidStep 401-426, slicersStep 427-445, writesStep 446-457, terminologyStep 458-485,
  planStep 486-512 (the proposal), answerStep 513-520 (the return).

## The plan
1. This note (commit, push).
2. Characterise on 207784c6: the pinning suites green (their PASS lines). Mutants: one or more per part, each alone
   in a git worktree of the base, run against the pinning suites and the part's own suites (gulf-date-questions,
   custom-visuals-lab, metric-switcher, dax-functions, shared-axes, terminology-sheet, tt1, cx1, wn1, fx2...).
3. fn1j: whole-answer pins (sha256 and length, normalised root and plan id, SP1's seeded ids) of made-up plans, one
   per condition a surviving mutant sits on, and the plan's data (writes, writesAr, pins, inputs) through Plans;
   red under each surviving mutant on the base first.
4. The split by a script (scratch split.mjs: eslint-scope gives each step's inputs and outputs; it refuses a closure
   that reads a name a later step sets). Then the pinning suites, fn1j, lint, test-contracts.
5. The note's numbers, the full MCP run, integration merged in once, CI.
