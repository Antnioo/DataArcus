# FN1A (0.3.2): three website functions into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1a" (5 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's
  plan), D-1104-12 (a library of functions, fixed at the source), D-1104-18 (keep building the library).
- **Base:** `fix/0.3.2-fn1a` from `origin/integration/0.3.2` at e56b070. Pushed only this branch; never merged, no PR.
- **Scope:** three functions split into named steps, each in its own file (no new module): `health-rules.js`
  `runRules`, `health-view.js` `create`, `exam-view.js` `mount`. Code moves; no text, order, class or event changes.
- **Commits:** plan 56d1aa5; health-rules.js 2b52580; health-view.js 8473d31; exam-view.js 0e0a778; the MCP check
  f2c3809; CHANGELOG 13cfbe3; integration merged in once f30debd (d0cabe5: AP1); the website check 68563c1.
- **Function sizes (my measure, `espree`: first to last line, nested functions inside their parent; the gate's
  `ops/gate/funcsize.py` is not in DataArcus):** runRules 375 -> 13, create 455 -> 8, mount 531 -> 15. Every new step
  80 or fewer: the largest are fixTab 69, mockPart 67, issuesTab 62, mockSetupPart 62, relationshipRules 60. Files:
  health-rules.js 413 -> 477, health-view.js 483 -> 535, exam-view.js 556 -> 586 (each under 600).
- **Ratchet:** the baseline (27) lives in the reviewer's engine (`ops/gate/`), not in DataArcus: not touched. New count
  for the reviewer to set: 24 (27 - 3).
- **Expected checks:** (each run's output file, its PASS/FAIL line) the base e56b070, after `npm run build:min`: website
  tools 399, model-health 255, sp9 3, sp15 3, sp24 23, sp27 3, sp32 39, sp34 18; MCP sp27 25. Planned: the same after
  each commit, no fixture re-recorded. **Got:** the same after each commit and on the merged head 68563c1 (also
  text-align 474, theme-generator 922); MCP `npm test -- model` 28 suites pass (sp27 25, new fn1a 4); new website fn1a 2.
  sp27-health.json, sp32-page.json, sp34-exam.json unchanged. Lint 0; check-min, site config, csp, ar-pages,
  agent-memory, changelog-words, result-lines pass; sitemap dates already current.
- **Characterisation, red-proven on e56b070:** 47 mutants, one or more per step (a class, an event name, a threshold, a
  helper's answer), each run in a separate worktree of the base: 41 red on the step's pinning suite (R: sp27, V: sp32,
  E: sp34); R6, R7, R11 red on the website model-health suite. Not red anywhere: R3 (the auto date table's owner), V15
  (the Documentation buttons' events), E17 (home drawn again when the outline file comes). New checks, each red on
  e56b070 first: `mcp/test-0.3.2-fn1a.mjs` A1-A4 (red under R3, R7, R11, R6) and `scripts/tests/fn1a.mjs` D1, O1 (red
  under V15, E17; green on the base and on the split).
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/42028709100 on 68563c1 (Linux and Windows; macOS skipped
  by the workflow on a branch run, CI1). After it only this note changed.
- **State: DONE.**
- **Resume:** none; the reviewer's merge (WORK.md's 0.3.2 line: FN1A, left to the merge, the file is at its cap).

## The steps (one per job of the old function, called in the old order)
- **health-rules.js:** runRules -> collector, relationshipRules, autoDateRules, unusedRules, columnRules,
  dateTableRules, measureRules, duplicateRules, namingRules, powerQueryRules; helpers daxShape (once per run, as
  before), textCheck, daxOnlyColumnOf, filterKinds, measureShape. `untyped` is file-level.
- **health-view.js:** create -> textKit, confirmPart, panels, resultPart, issuesTab, listTabs (Unused, Tables,
  Relationships), tmdlPart, fixTab, measuresTab, docsTab, each given the view's context `v` (app, host, S, $) and
  adding its functions to it. CAT, SEVL, BPA_L, QUICK, EXPERT are file-level data.
- **exam-view.js:** mount -> kit, questionPart, answerPart, routerPart (the outline note too), sessionPart, homePart,
  practicePart, casesPart, mockSetupPart, mockPart, resultsPart, listenersPart, each given the page's context `vw`.

## Decisions I made
- Each step is a file-level function taking the context and destructuring only the names it uses; a call between steps
  goes through what an earlier step added. The only forward references are looked up when called: the tab table
  (`v.tIssues`, ...), the screen table (`vw.home`, ...) and panels' `renderResult` shim. Steps are built in an order
  where every destructured name already exists.
- exam-view.js's six mutable `let`s (view, ctx, timer, pset, mset, OUT) are one object `ui` on the context, renamed in
  code only (a script that leaves strings and comments alone); the line diff of each file is in the commits.
- The moves were made by scripts from the old line ranges (every moved line byte-identical), then checked by a
  multiset line diff: only the dispatch lines, the `ui.` renames and the steps' heads and tails differ.
- No new module: each file stays under 600 lines, so MODULES.md is unchanged (the interfaces are the same).
- `ops/gate/samejob.py` is not in DataArcus: no shared helper was written, only the steps of each function.
- The stamp clash at the merge (the theme generator's pages, theme-generator.min.js) was taken from integration, then
  `npm run build:min` wrote the build's stamps, as the brief says.

## CHANGELOG line
- **Inside the Model Health Check and the practice exams, in smaller steps:** the health check's rules, its page's views
  and the exams' screens are each made by short named steps instead of one long function; every finding, screen, score
  and click is what it was before.

## For the owner
none

## Risky changes
none: no security policy, approval step, file writing, answer, network or process changes; no test loses a check (two
suites added: MCP fn1a 4, website fn1a 2).

## For the laptop
none

## Seen, not in scope
- autoDateRules names as the owner of every LocalDateTable_ the first table with any column carrying
  relatedColumnDetails, whatever table it relates to (health-rules.js, the owner's `find`); A1 pins today's behaviour.
- The other functions over 150 lines (my measure lists, among others, shadowModel 212, pbip-export.js build 205,
  meaningOf 201, check_model_health register 196, gulf-health analyze 184): for the next FN jobs.
- sp27-health.json alone did not catch four rule parts; sp32 does not click the Documentation buttons; sp34 does not
  serve an outline with other weights (now D1, O1).
- B-321, B-324 (theme-generator.js's copy of the worker stamp): not this job.

## Lessons for the reviewer
- funcsize.py and samejob.py are only in the reviewer's engine: a builder measures with its own script and cannot lower
  the baseline; one copy in DataArcus (or the numbers in the brief) would make the note's numbers checkable.
- Red-proving a split: mutants in a `git worktree` of the base in the scratchpad (node_modules symlinked) run in parallel
  with the work; three suites pinned 41 of 47 parts, the rest needed new checks.
- Any health engine file change moves the worker's, the client's and theme-generator.js's stamps through build:min.
- A shallow clone cannot run sitemap-lastmod: `git fetch --unshallow` first.
