# FN1H (0.3.2): three functions into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1H" (8 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's
  plan), D-1104-12 (a library of functions, fixed at the source), D-1104-18 (keep building the library); D-1027-03,
  D-1027-04, D-1027-05, D-1027-12, D-1029-03, D-1101-04, D-1105-16, D-1105-18 bind it (none changes).
- **Base:** `fix/0.3.2-fn1h` from `origin/integration/0.3.2` at 2fc104ce (FN1F merged). Push only this branch; never
  merged, no PR.
- **Scope:** three functions split into named steps, each in its own file (no new module): `mcp/lib/report-result.mjs`
  `reportAnswer` (:22, 180 lines), `mcp/tools/check_model_health.mjs` `register` (:41, 196), `assets/js/pbip-visuals.js`
  `visual` (:189, 155). Code moves; no text, order, key or output change; the tool's name, description and input
  schema byte for byte. FN1C's method: file-level steps given one context object.
- **Expected checks:** the base's suites that pin these files green before and after with the same check counts
  (sp3, sp4, sp9, sp15, sp23, sp27, sp28, sp43, sp44, fn1c, fn1f and the areas report, model, core); a new suite
  fn1h for every part no suite turns red under a mutant (fixture recorded on 2fc104ce only); no fixture re-recorded.
  Functions over 150 (my script, `espree`): 9 -> 6. Each new step 80 lines or fewer, each file under 600.
- **Resume:** the plan below; then characterise (mutants in a worktree of 2fc104ce), the pin, the three splits.

## The plan: each function's parts and the steps they become
- **reportAnswer** (context `ra`, x's names handed in the first step):
  panelsStep 23-37 (x's names, the panels, KPI cards, text boxes, titles, page filters), formatsStep 38-62 (model
  notes, number formats, SVG measures), pageNotesStep 63-76 (SVG sizes, small pages, subtitles, rings), looksStep
  77-107 (KPI values, chart colours, axes, slicers, flip cards, icons, DAX library, waterfalls), axesStep 108-142
  (time axes, Top N, accessibility, tables, row labels), leftOutStep 143-171 (language, renamed, left out, narrow
  slots, table columns), titlesStep 172-192 (tabs, page buttons, KPI and chart titles, display and Arabic names),
  answerStep 193-200 (the answer object, returned).
- **check_model_health register** (the registration stays; the handler's body becomes steps, context `hc`):
  readStep 63-66 (the unreadable model's answer), planStep 67-101 (script place, answers, the gate), fixesStep
  102-141 (the closures put and scriptAnswer, which read planNames, write, howToApply and refreshAfter, are declared
  here after those values are set and before their first call; MONTH_SORT, NO_FORMAT, PCT_FORMAT), moreFixesStep
  142-171 (THOUSANDS, FORMATS, the Gulf calendar, the checks before the first write), writeStep 172-202 (the batch,
  the answers file, the plan's use), answerStep 203-234 (the plan and the answer).
- **visual** (context `vc`): setupStep 190-199 (inputs, the sink, the type), headerStep 200-227 (title, logo, text),
  chartPrepStep 229-268 (prepare, query, story title, Top N, alt text, left out), chartFormatStep 269-302 (the
  visual, subtitles, title fit, cards, tables, fixes, mirror), noDataStep 304-330, panelStep 331-342 (returned).
  An early `return` in a step is handed back by its caller unchanged.
