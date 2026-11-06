## Summary
- **Approval:** the brief "FN1E (0.3.2): three reading and approval functions into named steps, behaviour identical"
  (5 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's plan), D-1104-12 (a library of
  functions, fixed at the source), D-1104-18 (keep building the library).
- **Base:** `fix/0.3.2-fn1e` from `origin/integration/0.3.2` at f6bf9fac (DD2Z merged). Pushed only this branch; never
  merged, no PR.
- **Scope:** three functions split into named steps, each in its own file (no new module):
  `mcp/lib/approval-disclosure.mjs` `summaryOf`, `mcp/lib/check-report.mjs` `checkReport`, `mcp/lib/visual-meaning.mjs`
  `meaningOf`. Code moves; no text, order, key or output change. FN1C's method: file-level steps given one context.
- **Commits:** plan 1cfd3080; pin suite f927c0a8, 725ba5e5, 69fb7a00 (each recorded on f6bf9fac); meaningOf 82fefdfe;
  checkReport 353284e4; summaryOf 88f8566c; CHANGELOG a76686a4; integration merged in once 06d200ff (b8063087: PF1).
- **Function sizes (my measure, `espree`, first to last line, nested functions inside their parent):** summaryOf 302 ->
  24, checkReport 236 -> 16, meaningOf 201 -> 22. Every new step 80 or fewer: the largest are shapeStep 61, redesignStep
  52, chartShape 51, reportTailStep 49, twinStep 49, pendingStep 47. Files: approval-disclosure.mjs 520 -> 566,
  check-report.mjs 346 -> 411, visual-meaning.mjs 407 -> 447 (each under 600).
- **Ratchet:** the brief's count (the gate's) 15 -> 12 for the reviewer to set. My script (assets/js, mcp/lib,
  mcp/tools, server.mjs; a file's own wrapper left out) 17 -> 14 (it also counts calendar-generator.js's wrapper and
  compile's inner function).
- **Expected checks:** RESULTS
- **Characterisation, red-proven on f6bf9fac:** 320 mutants (approval 160, check_report 82, meaning 78), one or more
  per step, each in a git worktree of f6bf9fac: 307 red (fn1e 301, each fn1e case red on f6bf9fac under its mutant
  first; 6 only on an existing suite), 13 equivalent or not reached by any input (below). fn1e green on f6bf9fac unmutated.
- **State:** split, pins and mutants done; integration merged in once (06d200ff); area runs and CI running.
- **Resume:** the area runs' results and CI into this note, then DONE.

## The steps (one per job of the old function, called in the old order)
- **summaryOf**, context `sc` ({ kind, d, pins, sections, val, files }; a report adds p, L, T, DF): reportHeadStep (the
  name written, the title, the DAX library's first line, "Report"), reportFieldsStep (kinds changed, Layout, Fields,
  What each page holds, Pages, Names shown, terminology), reportExtrasStep (dates, Shown in English, waterfalls, flip
  cards, status icons, the DAX function library), reportLookStep (Look and options), reportTailStep (metric switcher,
  thinner bars, gallery, More, both languages, not fully Arabic, already there, custom visuals, not checked; the
  page); redesignStep; sampleStep; twinStep; themeColoursStep; inputsStep (inputs, raw inputs, answers; the page).
- **checkReport**, context `cr`: readStep (options, the files walked once, the inventory, language and direction, built
  by, routes), validatorStep (async), rulesStep (schemas, measured rules), pendingStep (image, icon and DAX measures not
  in the model yet), formatStep (FORMAT_MIXED), instructionStep (instruction texts, suspicious names),
  fieldParametersStep, notCheckedStep, findingsStep (impact, routes, order, cap), lintStep, answerStep (cut to fit).
- **meaningOf**, context `mc`: meaningOf keeps the readers, a group and a Power BI visual; rolesStep (roles, hint, the
  live roles and their helpers; a visual with none answered there), shapeStep (the shape's if-chain, with mapShape and
  chartShape), hintStep (confidence, the id's hint), answerStep (the last losses, the answer).

## The mutants and what caught them (ids in the scratch list, one change each, parsed before running)
- **summaryOf (D01-D160):** fn1e 160 of 160. The existing approval suites (sp23, sp44, approval-disclosure,
  approval-complete) were run on 38 of them: 17 red (sp23 17, sp44 14, approval-complete 3), 21 on fn1e only; the other
  122 were run on fn1e only (the four suites cost about 30 CPU seconds a mutant: stopped for time).
- **checkReport (C01-C82):** fn1e 72; the existing suites (sp41, checker, same-question) on all 82: 27 red (sp41 29
  hits, checker 6); 46 red on fn1e only. Red only on an existing suite (6): C13 (a known validator gap's error count:
  validator-gap, mutation), C17 (the validator not available: round22), C51 (the tables' right-to-left line on a mixed
  report), C61 (fixWith on a non-rule finding), C81 (sameQuestion), C82 (fixRoutes): sp41, checker, same-question.
  Not reached (4, also green on all 76 suites that use check_report): C15 (a validator note: validation gives only
  error or warning; "info" is the CLI's preview), C21 (a rule that fails on a file: Rules.normalize reads every shape a
  file can have; only a4's synthetic R reaches it), C62 (fixWith without its route: every key fixWithOf gives is in
  fixRoutesOf's answer), C64 (notChecked's why made visible again: every why is written from counts and already
  cleaned paths).
- **meaningOf (M01-M78):** fn1e 69; the existing suites (sp18, sp37, sp42, custom-visuals-lab) on all 78: 27 red (sp18
  24, sp37 15, custom-visuals-lab 3, sp42 1). Equivalent (9, also green on all 44 suites that use visual-meaning.mjs):
  M04 (out()'s htmlNeeded default: its early answers are never a network), M17 (a start without an end is made a time
  or value first), M18 (a node already makes the first test true), M48 (roles.Y of one equals bars and main of one on
  a combo), M57 (a chart's roles.Y is never empty), M58 ('combo' is not in the list it searches), M63 (a combo hint
  with no Y2 has two Y values, so no series was set), M73 (every kind with drill levels drills), M74 (idFit is the
  kind or null).
- **fn1e's edges added after the first pass** (57 survivors; each red on f6bf9fac under its mutant): a kind with a
  said and a why and a said arOf knows, falsy and other option values, the old custom visuals list alone, redesign
  text settings, a matrix with an Arabic title only, theme colours as text, two tools' pins; Arabic texts with Hebrew
  titles, titles that read like an instruction (own and a selector's), DAX measures declared and one name in two
  tables, a file named like an instruction, a long field parameter name, two unreadable files, the lint over its cap
  and unable to read, one link, an answer cut to the bone; date levels in a category, a native matrix's rows, format
  objects, a tooltip column, unnamed roles, two latitudes, a latitude alone, lines only, a percentage with an unknown
  format, a breakdown under a pie hint, a time hint on a card.

## Decisions I made
- Each step is written by a script from the old line ranges (scratch `compose.py`): every moved line is byte for byte
  the old one. A multiset line diff of each file against f6bf9fac: every old line kept except summaryOf's three
  `if (kind === ...) {` openers and their closing braces (now dispatch lines in summaryOf), and one blank line in
  meaningOf. A step's inputs are destructured from the context, its outputs assigned back; lint's no-undef and
  no-unused-vars are the proof (both on in eslint.config.mjs). The `let`s a later step changes (meaningOf's kind, why,
  series, idFit; checkReport's schemas, fieldParameters, lintSection) are a step's own and go back to the context.
- meaningOf's map and chart branches became mapShape and chartShape returning the names they set
  (`({ roles, aggregate, why } = mapShape(mc))`); their initial values are the ones the old `let` gave.
- The theme's colours part keeps its own `if (kind === 'theme' && ...)` inside themeColoursStep (summaryOf calls it,
  then inputsStep, as the old code fell through).
- fn1e pins whole outputs by sha256 and length (as sp41 and fn1d do), recorded on f6bf9fac only (worktree wt4, its
  mcp/lib clean), never on the split: summary() with promptText and promptBox for 362 plans (every key of a full report
  plan left out once, in English and Arabic, and value edits), checkReport for 54 reports (copies of the twin project),
  meaningOf for 107 visuals. The approval outputs hold the temp folder (folderSaid): written out as `<root>`, a Windows
  path's separators as "/".
- The links case uses a junction (no rights needed on Windows); where none can be made it is left out and said (S1).
- No ledger place names these functions (CONTRACTS.md, contracts-probe.mjs grep): nothing moved there; test-contracts
  run. No new module (MODULES.md unchanged); no helper written, so the same-job finder has nothing new.
- The new suite is in area `checker` (it is fast, about 3 seconds).

## CHANGELOG line
- **Inside the approval page, check_report and the reading of each visual, in smaller steps:** what the approval page
  says each click writes, check_report's answer and what each visual is read as are each made by short named steps
  instead of one long function; every page, finding and reading is byte for byte what it was before.

## For the owner
none

## Risky changes
none: the approval page's disclosure is unchanged byte for byte (fn1e's 362 plans, sp23, sp44, approval-disclosure,
approval-complete); no security policy, file writing, answer, network or process change; no test loses a check (one
suite added, fn1e 590).

## For the laptop
none

## Seen, not in scope
- check_report's answer has an uncapped list: `fieldParameters.parameters` (and its note naming every missing table)
  grows with the field parameter tables the visuals name. fn1e's "cut to the bone" case (700 made-up tables) answers
  72,285 characters, over the tools' 40,000: the cut loop cuts findings, lint, names and notChecked, never this list.
  A cap is a behaviour change: for a later job (pinned in fn1e as it is today).
- meaningOf's `out()` default `htmlNeeded: kind === 'network'` is never reached with a network (the early answers are
  a group, a Power BI visual or no fields); harmless.
- The other functions over 150 lines (B-377; my measure on this branch lists 14).

## Lessons for the reviewer
- `folderSaid` writes the absolute working folder into the approval page: a pin of the page must write the temp folder
  out (and a Windows path's separators), or it differs run to run.
- A mutant that deletes a whole `if (...) x;` line before an `else` is a syntax error, not a mutant (4 of mine at
  first): parse every mutant before running it.
- `pkill -f "node test-"` to stop one runner killed another's suites mid-run (two false reds, rerun): stop a runner by
  its own command line.
- Mutants against whole-output pins still survive at the edges: 57 of 320 needed new inputs after the first pass, and
  changing an input to reach one edge can drop another (D102): rerun every mutant after the last re-record.
