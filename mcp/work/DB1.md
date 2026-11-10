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
- **Got:** db1 "PASS  db1  12 checks", red on 8f5624e6 first under each of its 4 mutants (V2, TT2a, TT2b, B6); the 11
  pins the same PASS line before and after; report "run-tests: 74 suites passed (report)", arabic "18 suites passed";
  mutation "250 checks (99 mutants, all killed)"; FN1J's 7 mutants survived 7 -> 0; contracts 14, lint 0.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/42728366650 on 457acc0d (Linux and Windows; macOS
  skipped by the workflow on a branch run), read 2026-11-10T00:51Z. After it only this note changed.
- **State: DONE.**
- **Resume:** none; the reviewer's merge.

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

## The commits
- 0fdc8aa3 the plan; dace3396 db1 (+ tests.json, CHANGELOG); da784fef T2; c5e90503 N3; 4293dbc3 B2 (and \`biSaid\` out of
  writesStep's destructure: no other use there); the note and WORK.md after.

## Before -> after (read from each run's own PASS line)
- FN1J's mutants (scratch mutrun.mjs: each alone, in place, on 19 guard suites: the 10 split pins, fn1j, tt1, cx1,
  fx2, sq3, theme-icons, bilingual-report, terminology-sheet, preview): on 8f5624e6 "survived 7, killed 0, gone 0";
  on 4293dbc3 with db1 first "survived 0, killed 4, gone 3" (T2, N3, B2 gone; TT2a, TT2b, V2, B6 killed by db1).
- Red first: db1 alone on 8f5624e6 under each mutant: TT2a, TT2b, V2, B6 killed (T2, N3, B2 survive: no input).
- Pins on 8f5624e6 and on 4293dbc3, the same line each: sp1 11, sp13 12, sp2 10, sp23 29, sp3 11, sp4 5, sp41 24,
  sp43 21, sp44 23, sp7 11, fn1j 3. No fixture re-recorded (fn1j-pins.json, sp1-answers.json, sp2-answers.json).
- On 4293dbc3: report 74 suites, arabic 18 suites; large-model-caps 215; terminology-sheet 48 and bilingual-report 34,
  3 runs each; mutation 250 checks (99 mutants, all killed); test-contracts 14; result-lines 233; changelog-words 9;
  agent-memory 469; site config pass; \`npm run lint\` exit 0.

## CI
- First run https://github.com/Antnioo/DataArcus/actions/runs/42725236519 on 6655d20a: red in website-suites (3),
  sp24 only (D8, D18: "ramadan - documentation.html" 19022 characters, recorded 19026). Red the same on the base
  8f5624e6 locally (not this job's change). Measured cause: sp24's \`undate\` (scripts/tests/sp24.mjs:58-59) masks
  every yesterday/today/tomorrow date; the ramadan model's Hijri calendar starts month 1448/6 on 2026-11-10, so on
  10 Nov that quoted date became \`<DATE>\` (10 characters to 6). Fix (test only, 2026-11-10T00:26Z): a quoted date is not
  masked; "PASS  sp24  23 checks" after. Second run 42728366650 on 457acc0d: green, sp24 included.

## CHANGELOG line
- Inside plan_layout, three checks that could never be reached were removed (no answer or file changes), and tests
  now reach three that could: the preview of a plan with no report name, a field kept in English on purpose, and the
  status icons' script in an Arabic plan.

## Decisions I made
- The 3 deletions remove the dead text only, with no comment line added beside it (L-1028-01: a new line near an
  anchor retargets a mutant); the proof lives here.
- TT2 is reached through a key typed with the table quoted, the one way a kept-English field reaches notTranslated:
  the lint's \`known\` reads displayNames' keys as typed. Not changed (behaviour only); said under For the owner.
- B6's model is fn1j's tiny model (its structure, made-up names) with one measure more, built in db1 from the tiny
  model fn1j writes: no new fixture file, fn1j-cases.mjs unchanged.
- V2 is reached by a plan with no report name: a plan id with a preview but no exact build. Kept as it is; said below.
- The scratch mutant run mutates plan_layout.mjs in place and puts it back (a finally); nothing of it is committed.

- sp24's date mask fixed here (a test line, no product change), not left for another job: every branch's CI was red
  on it until 12 Nov, and DONE needs a green run.

## For the owner
- Two behaviours found while proving the branches reachable; neither changed here (a behaviour change needs your go):
  1. A plan with the model but no report \`name\` gets a plan id although create_report would refuse it (exactCheck
     "notBuilt"): the person can approve a plan that cannot be written. Fix: a planProblem "give the report a name".
  2. On an Arabic plan, a displayNames key typed \`'Sales'[Field]\` (the table quoted) is read as given by the names'
     checks but not by the lint's: the lint drafts or lists that field again (TT2's path). Fix: one key normaliser.

## Risky changes
none: no answer, file or Arabic text changes (the 11 pins byte for byte); no test loses a check (db1 added).

## For the laptop
none

## Seen, not in scope
- previewOf's own \`if (sc.needsFocus) return null\` is unreachable for N3's reason (previewOf returns on planProblems
  first): not named in B-421, left.
- The two behaviours under For the owner.

## Lessons for the reviewer
- A test that masks today's date in a file holding dates (a calendar) fails on the days a held date is today: mask
  the one place the date is written, never every match.
- Two of FN1J's "equivalent" mutants were not equivalent: an input that skips one step (no report name: no exact
  build) or types a key another way (a quoted table) reached them; try the inputs a refusal would skip first.
- B6's "no icon column" was the model's shape, not a bug: the automatic icons need a rate and a measure named
  "<rate> Target"; the made-up "Sales Target" names a measure "Sales" that no model had.
