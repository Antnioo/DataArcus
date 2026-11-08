# FN1G (0.3.2): three mcp/lib functions into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1G (0.3.2): three mcp/lib functions into named steps, behaviour identical" (8 Nov); the
  owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's plan), D-1104-12 (a library of functions,
  fixed at the source), D-1104-18 (keep building the library).
- **Base:** `fix/0.3.2-fn1g` from `origin/integration/0.3.2` at 1ee00b30 (PF3 merged). Push only this branch; never
  merge, no PR.
- **Scope:** three functions split into named steps, each in its own file (no new module): `mcp/lib/twin-copy.mjs`
  `languageCopy`, `mcp/lib/gulf-date-questions.mjs` `gulfDateQuestions`, `mcp/lib/gulf-calendar.mjs`
  `addGulfCalendar`. Code moves; no text, order, key or output change; Arabic lines moved, never retyped. FN1C's
  method: file-level steps given one context object.
- **Function sizes before (my measure, `espree`, first to last line, nested functions inside their parent; the
  reviewer's numbers agree):** languageCopy 182, gulfDateQuestions 182, addGulfCalendar 176. Files: twin-copy.mjs 312,
  gulf-date-questions.mjs 271, gulf-calendar.mjs 279.
- **Target:** each under 150 (the gate's count 12 -> 9, or 9 -> 6 once FN1F lands), every new step 80 or fewer, each
  file under 600.
- **Expected checks:** areas model, twin, report, safety, arabic, checker, release and core on the base 1ee00b30: every
  suite PASS (numbers from the run's own output file, filled in below); the same suites with the same check counts on
  the split, plus the new fn1g. Website `scripts/tests/gulf-calendar.mjs` the same total. No fixture re-recorded.
  Lint 0; test-contracts, check-contracts, check-modules, result-lines, changelog-words, agent-memory pass.
- **State:** plan.
- **Resume:** characterise on the base (worktree of 1ee00b30), then the mutants, then the splits.

## The plan: each function's parts and the steps they become
- **languageCopy** (twin-copy.mjs :131-312), context `lc`:
  - idsStep (:132-139): tabsShown, the new ids (pages, visuals, bookmarks), the lists the copy fills.
  - linksStep (:140-168): renameFilters, remap, the Arabic pictures (arPicOf, withArPicture), as closures on `lc`.
  - the page loop (:169-248), one call a page, with a page context `pc`: pageStep (:171-186, the English and Arabic
    page, their visuals), syncStep (:187-202, the slicer sync groups; the counter `n` on `lc`), buttonsStep
    (:203-221, the language buttons and a pair with both shown), pageFilesStep (:222-235, the English files changed,
    the Arabic page's files), extraStep (:236-244, the visuals the twin adds), then the pair (:245-247).
  - bookmarksStep (:249-270), pagesJsonStep (:271-280, activePage), resourcesStep (:281-295, extensions and pictures),
    answerStep (:296-311, .platform, files, notes, tabs, the answer).
- **gulfDateQuestions** (gulf-date-questions.mjs :56-237), context `gq`:
  - modelStep (:57-68), candidatesStep (:70-79), seasonalStep (:81-87; the early `return null` stays in the
    function), calendarColumnsStep (:89-99), answersStep (:101-120, the memory and take), questionsStep (:122-135),
    usingStep (:137-164), grainScopeStep (:166-201: the grain and the scope share needCal and its offer),
    problemsStep (:202-209), rememberStep (:211-219, the status and the memory), answerStep (:221-236).
- **addGulfCalendar** (gulf-calendar.mjs :79-254), context `gc`:
  - inputsStep (:80-99, country, name, years), relationshipsStep (:101-155, relateTo and what each says in EN and
    AR), basesStep (:157-173, the base measures), tableStep (:175-199, the generator's table, the self check, the
    notes), scriptStep (:201-224, the measures, VAT, the pegs, the script and its file: the one writeScript call),
    answerStep (:226-253). The order of the refusals is the old order (each step called in the old line order).

## Characterisation (before any move)
- The suites on the base, then mutants in a git worktree of 1ee00b30, one change each, parsed before running, at least
  one per part above; each mutant run against the suites that read the file. A part no suite turns red gets a case
  in the new `mcp/test-0.3.2-fn1g.mjs` (fixture `mcp/fixtures/fn1g-pins.json`, recorded on 1ee00b30 only), whole
  outputs by sha256 and length plus small edge inputs, red on 1ee00b30 under that mutant first.
