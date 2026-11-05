## Summary
- **Approval:** the brief "FN1E (0.3.2): three reading and approval functions into named steps, behaviour identical"
  (5 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's plan), D-1104-12 (a library of
  functions, fixed at the source), D-1104-18 (keep building the library).
- **Base:** `fix/0.3.2-fn1e` from `origin/integration/0.3.2` at f6bf9fac (DD2Z merged). Push only this branch; never
  merge, no PR.
- **Scope:** three functions split into named steps, each in its own file (no new module):
  `mcp/lib/approval-disclosure.mjs` `summaryOf` (:219, 302 lines), `mcp/lib/check-report.mjs` `checkReport` (:109,
  236), `mcp/lib/visual-meaning.mjs` `meaningOf` (:110, 201). Code moves; no text, order, key or output change. FN1C's
  method: steps are file-level functions given one context object. Not in this job: plan_layout and the binding (PF1),
  the other functions over 150 (B-377), any other file.
- **Plan, one commit each:** 1 this note; 2 the pin suite `mcp/test-0.3.2-fn1e.mjs` (whole outputs, recorded on
  f6bf9fac only) and the mutants in a git worktree of the base; 3 meaningOf; 4 checkReport; 5 summaryOf; 6 CHANGELOG;
  7 integration merged in once, area runs, lint, contracts, CI.
- **Function sizes (my measure, `espree`, first to last line, nested functions inside their parent):** summaryOf 302,
  checkReport 236, meaningOf 201 -> each under 150, every new step 80 or fewer; files 520, 346, 407 -> each under 600.
- **Ratchet:** the brief's count (the gate's) 15 -> 12. My script (assets/js, mcp/lib, mcp/tools, server.mjs; a file's
  own wrapper left out) 17 on f6bf9fac (it also counts calendar-generator.js's wrapper and compile's inner function).
- **Expected checks:** the base f6bf9fac and the split give the same check counts suite by suite in `npm test --
  checker report twin` and the approval suites (sp23, sp44, test-0.3.0-approval-disclosure, approval-complete), sp18,
  sp37, sp41, sp42; no fixture re-recorded; one suite added (fn1e). Lint 0; test-contracts, check-modules, result-lines,
  changelog-words, agent-memory pass.
- **State:** PLAN.
- **Resume:** the pin suite (step 2).

## The parts and the steps (line ranges on f6bf9fac)
- **summaryOf** (approval-disclosure.mjs 219-520), context `sc` ({ kind, d, pins, sections, val, files }):
  220-227 the context (val, blank and glass pictures, the files); report 228-376 in five steps: reportHeadStep 229-246
  (the name written, the title, the DAX library's first line, "Report"), reportFieldsStep 247-279 (kinds changed,
  Layout, Fields, What each page holds, Pages, Names shown, terminology), reportExtrasStep 280-308 (dates, Shown in
  English, waterfalls, flip cards, status icons, DAX function library), reportLookStep 309-329 (Look and options),
  reportTailStep 330-375 (metric switcher, thinner bars, gallery, More, both languages, not fully Arabic, already
  there, custom visuals, not checked; the answer); redesignStep 380-430; sampleStep 433-445; twinStep 446-493;
  themeColoursStep 496-502; inputsStep 503-519 (inputs, raw inputs, answers, the answer).
- **checkReport** (check-report.mjs 109-344), context `cr`: readStep 110-141 (options, the files walked, the inventory,
  language and direction, built by, routes); validatorStep 142-167 (async: Microsoft's validator); rulesStep 168-183
  (schemas, measured rules); pendingStep 184-227 (image, icon and DAX measures not in the model yet); formatStep
  228-240 (FORMAT_MIXED); instructionStep 241-254 (instruction texts, suspicious names); fieldParametersStep 255-274;
  notCheckedStep 275-287; findingsStep 288-299 (impact, routes, order, cap); lintStep 300-316; answerStep 317-343
  (the answer, cut to fit).
- **meaningOf** (visual-meaning.mjs 110-310), context `mc`: meaningOf keeps 111-123 (the readers, a group, a Power BI
  visual); rolesStep 125-142 (roles, hint, the live roles and their helpers); shapeStep 144-262 (the shape's if-chain,
  with the map's part as mapShape 159-176 and the chart's as chartShape 216-261); hintStep 264-300 (confidence, the
  id's hint); answerStep 301-309 (the last losses, the answer).

## Characterisation (red-proven on f6bf9fac)
- The suites per file, green on the base: approval-disclosure (sp23, sp44, approval-disclosure, approval-complete and
  the other suites that import it), check-report (sp41, checker area, same-question), visual-meaning (sp18, sp37,
  custom-visuals-lab, sp42).
- Mutants: one or more per step, each in a git worktree of f6bf9fac; a part no suite turns red gets a case in fn1e
  (whole output pinned by sha256 and length, small edge inputs per condition, L-1105-30), red on f6bf9fac under that
  mutant first.
