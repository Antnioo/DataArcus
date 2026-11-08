# FN1H (0.3.2): three functions into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1H" (8 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's
  plan), D-1104-12 (a library of functions, fixed at the source), D-1104-18 (keep building the library); D-1027-03,
  D-1027-04, D-1027-05, D-1027-12, D-1029-03, D-1101-04, D-1105-16, D-1105-18 bind it (none changes).
- **Base:** `fix/0.3.2-fn1h` from `origin/integration/0.3.2` at 2fc104ce (FN1F merged). Integration had not moved
  before the last CI run: nothing merged in. Pushed only this branch; no PR.
- **Scope:** three functions split into named steps, each in its own file (no new module): `report-result.mjs`
  `reportAnswer`, `check_model_health.mjs` `register` (its handler's body), `pbip-visuals.js` `visual`. Code moves; no
  text, order, key or output change; the tool's name, title, description and input schema byte for byte (pinned).
- **Commits:** plan 0af3c18b; pin 808d7014, 7d46e83b, 4b50cf63 (each recorded on 2fc104ce); reportAnswer d679f0c7;
  register c1d269a7; visual 596a796d (with build:min's stamps); CHANGELOG 0655dece; note 189c84ca; the security
  mutant's moved line db67ec8c (the last code commit).
- **Function sizes (my measure, `espree`, first to last line, nested functions inside their parent):** reportAnswer
  180 -> 15, register 196 -> 31, visual 155 -> 27. Every new step 80 or fewer: the largest are fixesStep 53,
  chartTitleStep 45, chartFormatStep 40, axesStep 38, answerStep 37. Files: report-result.mjs 201 -> 252,
  check_model_health.mjs 274 -> 314, pbip-visuals.js 418 -> 467 (each under 600).
- **Ratchet (fn_over_150):** my script, named functions over 150 across assets/js, mcp/lib, mcp/tools and server.mjs:
  9 on 2fc104ce (the reviewer's 9: the same list), 6 on 596a796d (the three FN1G is on, and plan_layout register,
  theme-layout-ui mount, pbip-export build). The reviewer sets the gate's number.
- **Expected checks:** the suites that pin these files green before and after with the same check counts, a new suite
  fn1h, no fixture re-recorded. **Got:** the full MCP run "222 of 223 suites" passed, the one red the security
  mutation suite (its AF-health-model mutant names a moved line by its indent: changed on purpose, then "PASS
  mutation 225 checks", as on 2fc104ce); website "All 16 passed"; no fixture of another suite changed.
- **Characterisation, red-proven on 2fc104ce:** 261 one-line mutants (reportAnswer 100, register 87, visual 74), each
  alone in a git worktree of the base: 244 red, 17 equivalent or not reached (below). The new suite fn1h (5 checks:
  141 build states, 41 health calls and writes, 302 reports, pinned case by case) is green on 2fc104ce unmutated and
  on every split commit; its fixture was recorded on 2fc104ce only (a worktree, `git diff 2fc104ce -- assets mcp/lib
  mcp/tools` empty).
- CI: red on 5f02e193 (https://github.com/Antnioo/DataArcus/actions/runs/42472997766): Windows shard 4, fn1h A1 "0 of
  141 the same" (the answer's `open` is path.join, `Project\\R.pbip` there). fn1h now writes it with / on Windows (a
  no-op on Linux; no pin changed). CI green: https://github.com/Antnioo/DataArcus/actions/runs/42473960903 on d3413bdf
  (Linux and Windows; macOS skipped by the workflow on a branch run). After it only this note changed.
- **State: DONE.**
- **Resume:** none; the reviewer's merge (fn_over_150: 9 -> 6).

## The steps (one per job of the old function, called in the old order)
- **reportAnswer** (context `ra`; its one destructure of x stays, then the context): panelsStep, formatsStep,
  pageNotesStep, looksStep, axesStep, leftOutStep, titlesStep, answerStep (returned).
- **check_model_health register:** the registration (name, title, description, input schema, annotations) is as it was;
  the handler's body is readStep (the unreadable model's answer, returned early), planStep, fixesStep, moreFixesStep,
  writeStep, answerStep (returned), context `hc` made from the handler's inputs.
- **visual** (context `vc`; the inputs, sink and lets stay in visual, then the context): the kind's if/else stays in
  visual and each branch's body is a step: titleStep, logoStep (its "no placeholder" skip returned), textStep,
  chartTitleStep (its "left out without fields" skip returned) then chartFormatStep; then noDataStep, panelStep
  (returned).

## The mutants and what caught them
- **Tier 1, the suites that pin these files (all 261):** reportAnswer 57 red (fn1f 49, sp3 37, sp4 36, sp43 26,
  v029i 2); register 21 (sp9 15, sp27 15, sp23 9, sp44 9, sq7 4, sp15 1; v029w, write-gate none); visual 52 (sp28 52,
  sp43 39, fn1f 39, fn1c 38, sp3 34, sp13 33).
- **Tier 2, the safety and model suites that call check_model_health, on the register survivors:** 10 more
  (answers-safety 6, write-safety 2, cx1 2, audit-writes 2, confirm-memory 2, approval-disclosure 1, lg1 1).
- **Tier 3, fn1h (each red on 2fc104ce under its mutant first):** reportAnswer 42, register 53, visual 9.
  - reportAnswer: the titles, the number formats (a dynamic format, a percent), the page notes, the subtitles, blank
    cards, rings, the axes standard, the grid, the time axes, a11y, tooltips, every note of axesStep and leftOutStep,
    the tab rows, page buttons, KPI titles: 141 build states (fixtures/fn1h-cases.mjs), each condition on, off, one.
  - register: the tool list entry (the description), the unreadable model with a plan, a `.Dataset` folder, a sort by
    hand only, the refresh after a column is added, column types, answers not recorded, the gate, maxItems, the
    script cut under 30,000, the hidden sort column, a percent with a number format, the Hijri model with no country,
    the answers file alone, forget and answer at once, a stale answer, a failed answers write (the plan's use), a bad
    answers file, three names with a control character, a model with nothing to fix, the model folder as the
    working folder.
  - visual: the Top N and detail words, the story title's room, subtitles, the alt text, gallery titles, a visual
    left out without a title: 300 seeded builds (fixtures/fn1h-builds.mjs) and two edges a search of 3,000 found.
- **Equivalent or not reached (17):** R66 (KIND.slicer is never read: a slicer is named by its title or "Slicer");
  H7 (put's ".tmdl" default: a script the plan did not name throws before any answer); H48 (the plan names every
  script: a changed model is refused by the gate first, pinned as "changed: refused"); H54 (the batch's label: only
  in a failed batch of scripts, which no test makes); V11, V12, V17, V21 (the writer's texts always carry logo,
  logoHere, textHere and by); V2 (every kind that reaches it has a type); V26 (Top N is used only with a title);
  V47 (told is set only for non-gallery kinds); V8, V36, V38, V49, V55, V66 (not reached by 6,302 builds).

## Decisions I made
- The steps are written by a script from the old line ranges (scratch `split.mjs`): eslint-scope gives each step's
  inputs (names it uses that the function declared elsewhere) and outputs (names it sets that a later step uses); a
  name a step reassigns is a `let` taken from the context and handed back. It refuses a closure that reads a name a
  later step sets. A multiset line diff of each file against 2fc104ce: no old line removed.
- register's two closures `put` and `scriptAnswer` read planNames, write, howToApply and refreshAfter, set later in
  the old order; they are moved to the start of fixesStep, after those are set and before their first call (the one
  change of order; no value they read differs).
- fn1h calls reportAnswer directly (it is pure) with made-up build states, instead of only through create_report:
  every note's condition, its edges, in one file. The health part runs the real server, approves its plans with
  approve_plan (test-env.mjs), and pins every file each call leaves.
- No ledger place names these functions (mcp/docs/CONTRACTS.md, contracts-probe.mjs): nothing moved there.
- fn1h's line in tests.json sits after fn1f's; the CHANGELOG line after FN1F's.

## The runs
- Before the split, on 2fc104ce: sp3 11, sp4 5, sp43 21, fn1f 6, sp28 17, fn1c 74, sp9 16, sp27 25, sp15 19, sp23 29,
  sp44 23, sp13 12, v029i 36, v029w 75, sq7 28, write-gate 7, fn1d 125 (each its own PASS line); after: the same.
- The full MCP run (`npm test -- --keep-going`, every suite of the 5 shards in one process) on 4b50cf63's code:
  "run-tests: 1 of 223 suites failed: test-0.3.1-mutation.mjs" ("AF-health-model: the text to change is found 0
  times": its edit named `    if (write) sameModelBeforeWrite(...)` at the handler's indent; the line is in
  moreFixesStep now, at 2). **Changed on purpose:** test-0.3.1-mutation.mjs line 67, the edit's 4 spaces to 2 (the
  same line, the same guard suite, audit-writes). Then "PASS  mutation  225 checks (88 mutants, all killed)" on
  db67ec8c and on 2fc104ce alike. fn1h "PASS  fn1h  5 checks" in that run.
- Website (`node scripts/tests/run-all.mjs`, after `npm run build:min`) on db67ec8c: "All 16 passed": site 624,
  tools 399, consent 38, theme-generator 922, theme-generator-lab 922, pbip 111, layout 512, design-engine 600,
  sp5 3, sp6 4, sp7 3, sp13 3, sp14 9, sp29 8, fn1b 17, sp31 17 (FN1F's totals where it ran them).
- Lint 0; site config, result-lines 223, changelog-words 233, agent-memory 448, test-contracts 14, check-contracts
  715, check-modules 1160, check-min 1219 pass; csp, ar-pages and sitemap lastmod already up to date.

## CHANGELOG line
- **Inside create_report's answer, check_model_health and the report writer's visuals, in smaller steps:** what
  create_report tells after a write, every answer and fix script of the model health check, and each visual the
  report writer writes are each made by short named steps instead of one long function; all of them are byte for
  byte what they were before, and the tool's name, description and inputs are unchanged.

## For the owner
none

## Risky changes
none: no security policy, approval step, file writing, answer, network or process change (the answers, the writes
and the files are pinned byte for byte); no test loses a check (one suite added, fn1h 5).

## For the laptop
none

## Seen, not in scope
- H54: a failed batch of fix scripts (`the fix scripts` in its error) is reached by no suite; write-safety and cx1 fail
  a batch but do not pin its words.
- The writer's fallbacks for missing texts (`'Logo'`, `'Your logo'`, the placeholder sentence, `'by'`) are never used:
  every caller passes the design engine's REPORT_TEXTS.
- The other functions over 150 lines (B-377): plan_layout register 468, theme-layout-ui mount 231, pbip-export build
  205, and FN1G's three.

## Lessons for the reviewer
- A tool's write path (an approved plan, the answers file, a failed write) is reached only by the safety suites: a
  split of a tool's handler needs them in its mutant run, not only the area's characterisation suites (10 of the
  register's mutants were red only there).
- A function that is pure (reportAnswer) is pinned best directly: one made-up state with every condition on, then one
  variant per condition, caught 42 mutants no create_report run reached.
- Mutant ids must be read from the list, not from memory: three of my first analyses named the wrong mutant.
- A pin of an answer that holds a path.join (create_report's `open`) differs on Windows: normalise the separator in
  the test before CI, or CI's Windows shard finds it after 12 minutes.
