# DB1 (0.3.3): plan_layout's dead and unreachable branches, behaviour only (B-421)

## Summary
- **Approval:** the brief "DB1" (9 Nov, tonight's mix D-1109-09), the finding B-421 (FN1J's note, Seen: its
  equivalent mutants T2, N3, TT2, V2, B2 and the unreached B6). D-1104-12, D-1104-18, D-1105-17, D-1027-04 bind it:
  no answer, file or Arabic text changes.
- **Base:** `fix/0.3.3-db1` from `origin/integration/0.3.3` at 8f5624e6. Push only this branch; never merge, no PR.
- **Scope:** `mcp/tools/plan_layout.mjs` only (no helper it alone calls is touched: status-icons.mjs is SG1's,
  untouched); new `mcp/test-0.3.3-db1.mjs` (+ its row in `mcp/tests.json`); `mcp/CHANGELOG.md` (one line),
  `mcp/WORK.md` (one line if it fits), this note. No new module (MODULES.md unchanged), no fixture re-recorded.
- **Plan (measured on 8f5624e6, the proofs below):** unreachable, deleted one commit each: T2 (`|| { order: 'own' }`),
  N3 (the lint's large-model skip), B2 (writesAr's bilingual part). Reachable, kept, a test reaches each: TT2 (both
  keptOnPurpose filters), V2 (previewOf's displayNames), B6 (the status icons' Arabic script line).
- **Expected checks:** db1 new, about 12 checks, each red on 8f5624e6 under its mutant first; sp1 11, sp13 12, sp2 10,
  sp23 29, sp3 11, sp4 5, sp41 24, sp43 21, sp44 23, sp7 11, fn1j 3 the same PASS line before and after (no pin
  moves); the report and arabic areas green; mutation (the repo's) all killed before and after; my scratch run of
  FN1J's 7 mutants: survived 7 before, 0 after (3 gone with their code, 4 killed by db1); terminology-sheet and
  bilingual-report 3 runs each; test-contracts pass; lint 0.
- **Resume:** the plan is pushed (2026-11-09T23:36Z); next: the 3 deletions, then db1.

## The proofs (each read from the code on 8f5624e6; inputs run through the registered tool)
- **T2, unreachable.** monthOrderStep's `tf` is either `fieldsAndProblems(...).out.timeAxis` (report-fields.mjs: a
  timeAxis is looked up as a column, wanted 'c'; a measure or a missing name is a planProblem, and the step runs only
  with none) or the picker's `date` (pbip-bind.js `f(ch.date)`: field-suggest.js picks it from the model's columns,
  so it has `c`). `timeAxisPlan` (pbip-query.js:277) returns null only for `!f || f.c == null`: never here.
- **N3, unreachable.** The lint returns on `planProblems.length` before its `sc.needsFocus` skip; limitsStep pushed
  "name an area first" whenever `scopeOf(m0, { focus, tables })` says needsFocus (the same arguments; scopeOf is a
  pure function of them, and nothing between changes m0, focus or tables; planProblems only grows).
- **B2, unreachable.** writesAr needs `a.lang === 'ar'`; its bilingual part needs `biSaid`, from `exact.bilingual`,
  built only with languages "en+ar" and no planProblems; limitsStep refuses languages "en+ar" with lang "ar". So
  `biSaid` is null whenever writesAr is built.
- **TT2, reachable.** The lint's `known` set holds displayNames' keys as typed; modelStep's `given` and keptOnPurpose
  read them normalised. A key typed `'Sales'[Qzx Flux]` (kept English: its model name), with Qzx Flux in planFields:
  the lint adds Sales[Qzx Flux] to notTranslated, and keptOnPurpose keeps it out of titlesInEnglish.fields (and out of
  switcherLabels with a metric switcher). Without the filter: planProblems, no plan id.
- **V2, reachable.** previewOf reads displayNames only when it builds the page itself (no exact files). A plan with
  path and no report name: create_report would refuse it (no name), so exact is null (exactCheck "notBuilt") and the
  plan still gets an id; its preview (the plan's data) shows the given name. Without it: the model's name, 15 titles.
- **B6, reachable; not a bug.** On the made-up tiny model `statusIcons: true` with Margin % in the table gives
  columns []: status-icons.mjs `applyIcons` (auto) skips Margin % because `targetOf` finds no "Margin % Target",
  "Target Margin %" or "Margin % - Target" (the model's "Sales Target" names a measure "Sales", which is not there).
  The same model with one measure "Margin % Target" (a percent): 2 icon columns, the script, and writesAr's Arabic
  script line. The made-up models lacked the shape: db1 adds that model (the tiny model's structure plus one measure).
