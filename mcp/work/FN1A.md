# FN1A (0.3.2): three website functions into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1a" (5 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's
  plan), D-1104-12 (a library of functions, fixed at the source), D-1104-18 (keep building the library).
- **Base:** `fix/0.3.2-fn1a` from `origin/integration/0.3.2` at e56b070. Pushed only this branch; never merged, no PR.
- **Scope:** three functions, each split into named steps in its own file (no new file: each stays under 600 lines):
  `assets/js/health-rules.js` `runRules` (:34, 375 lines), `assets/js/health-view.js` `create` (:26, 455 lines),
  `assets/js/exam-view.js` `mount` (:21, 531 lines). Code moves; no text, order, class name or event changes.
- **State:** PLAN (this commit). Then one commit per file: health-rules.js, health-view.js, exam-view.js.
- **Expected checks:** (each run's output file, its PASS/FAIL line) on the base (measured, e56b070, after
  `npm run build:min`): website `tools 399, model-health 255, sp9 3, sp15 3, sp24 23, sp27 3, sp32 39, sp34 18`;
  `mcp/test-0.3.2-sp27.mjs 25`. After each commit: the same numbers, the records unchanged (sp27-health.json,
  sp32-page.json, sp34-exam.json: no fixture re-recorded). Lint 0.
- **Function sizes (my measure: `espree`, a function's first to last line, nested ones counted in their parent; the
  gate's `ops/gate/funcsize.py` is not in DataArcus):** before: runRules 375, create 455, mount 531. After (target):
  each under 150, every new step 80 lines or fewer.
- **Ratchet:** the baseline (27) lives in the reviewer's engine (`ops/gate/`), not in DataArcus: not touched here.
  Expected new count: 24 (27 - 3), for the reviewer to set.
- **Resume:** the plan below, step 1.

## Plan: each function's jobs (line ranges on e56b070) and the steps they become
### health-rules.js `runRules` (34-408): the findings collector, then one step per rule group, in the same order
- 35-46 the collector (`findings`, `add`, `skipped`, `skip`; `untyped`) -> `collector()`, `untyped` at file level.
- 48-104 relationships (BIDI, BIDI_BRIDGE, M2M, the USERELATIONSHIP sources, INACTIVE_UNUSED, USEREL_ACTIVE,
  BROKEN_REF, STRING_KEYS) -> `relationshipRules(x, out)`.
- 106-110 auto date/time -> `autoDateRules`; 112-125 unused (with a report) -> `unusedRules`.
- 128-211 the DAX shape helpers -> `daxShape(IX)` (isTbl, isOp, call, closeOf, argsOf, measureRef), `textCheck(IX, sh)`
  (isText, returnsText), `daxOnlyColumnOf(IX, sh)`.
- 212-239 columns -> `columnRules`; 241-255 the date table -> `dateTableRules`.
- 257-360 DAX patterns -> `filterKinds(IX, sh)` (predKind, filterOverTable), `measureShape(IX, sh)` (msHidden,
  constVarCode, countRoot), `measureRules`.
- 362-373 identical DAX -> `duplicateRules`; 375-388 naming -> `namingRules`; 390-406 Power Query and NO_RLS ->
  `powerQueryRules`. `runRules` calls them in this order: the findings and the skipped list keep their order.
### health-view.js `create` (26-480): one step per part of the page, each given the view's context `v`
- 27-54, 460-476 the language helpers, the rules' texts and sources, copy and toast, the card text -> `textKit(v)`.
- 57-95 "Please confirm" and the remembered answers -> `confirmPart(v)`.
- 96-153 loading, step, error, render, the partial model, the drop zone -> `panels(v)`.
- 155-195 the ring, the bar, the result and its tabs -> `resultPart(v)` (the tabs looked up on `v` when drawn).
- 197-254 the item list and the Issues tab -> `issuesTab(v)`; 256-281, 425-442 Unused, Tables, Relationships ->
  `listTabs(v)`; 284-370 the Fix plan and its cleanup scripts -> `fixTab(v)`, 330-349 the TMDL panel -> `tmdlPart(v)`;
  372-423 the measure chain and the Measures tab -> `measuresTab(v)`; 444-459 Documentation -> `docsTab(v)`.
- `create` builds `v` and calls the parts in that order, then returns the same interface.
### exam-view.js `mount` (21-551): the page's state in one object `ui` (view, ctx, timer, pset, mset, OUT)
- 22-45, 129-153 helpers, grading names, toast, modal, ring, bar, top -> `kit(v)`.
- 47-127 the question's HTML, its explanation, its clicks, the case -> `questionPart(v)`, `answerPart(v)`.
- 155-182 the outline note, the router -> `outlinePart(v)`, `routerPart(v)` (the screens looked up on `v`).
- 185-225 home; 228-267 practice setup, back; 270-319 the session; 322-353 cases and plan; 356-413 mock setup, renewal
  setup, the draw; 414-476 the mock, its timer, review and submit; 479-525 results; 528-550 the keyboard, reset, the
  language observer, start and outline -> one step each.

## Characterisation
- The suites already pin every part: sp27-health.json (runRules's whole output on 15 made-up inputs, every rule and
  skip), sp32-page.json (every view, tab, click, copy, event and storage value of the health page, EN and AR),
  sp34-exam.json (504 steps of both exams, EN and AR, keyboard, language switch and reset included). Each part is
  red-proven by one mutation on the base (results below); a part no suite turns red gets a new check first.

## Decisions I made
- (filled in as the work goes)

## CHANGELOG line
- (at the end)

## For the owner
none

## Risky changes
none (code moves; checked below)

## For the laptop
none

## Seen, not in scope
- (at the end)

## Lessons for the reviewer
- (at the end)
