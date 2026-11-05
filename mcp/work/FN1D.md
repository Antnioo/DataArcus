# FN1D (0.3.2): the model-health functions into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1D" (5 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's
  plan), D-1104-12 (a library of functions, fixed at the source), D-1104-18 (keep building the library).
- **Base:** `fix/0.3.2-fn1d` from `origin/integration/0.3.2` at a16fa727. Pushed only this branch; never merged, no PR.
- **Scope:** three functions split into named steps, each in its own file (no new module): `model-health-engine.js`
  `analyze`, `gulf-health.js` `analyze`, `health-confirm.js` `pleaseConfirm`. Code moves; no text, order, key or
  output change. FN1C's method: steps are file-level functions given one context object.
- **Commits:** plan cb3a339f; pin 1b80e763, 85b6692e, 9b29c7e9 (each recorded on a16fa727); gulf-health.js df42913b;
  health-confirm.js 9ed17883; model-health-engine.js 9a93c59d (with build:min's stamps); CHANGELOG 93def760;
  integration merged in once e3461d08 (edf2951b: FN1C, SM2).
- **Function sizes (my measure, `espree`, first to last line, nested functions inside their parent):** engine analyze
  245 -> 39, gulf analyze 184 -> 26, pleaseConfirm 152 -> 9. Every new step 80 or fewer: the largest are
  measureQuestions 74, unrelatedQuestions 61, rootsStep 53, datesStep 46, graphStep 45, docsStep 45. Files:
  model-health-engine.js 301 -> 337, gulf-health.js 329 -> 366, health-confirm.js 260 -> 281 (each under 600).
- **Ratchet:** the brief's count (the gate's) 18 -> 15 for the reviewer to set. My script over assets/js, mcp/lib,
  mcp/tools and server.mjs (the files' own UMD wrappers left out): 24 on a16fa727, 18 on e3461d08 (FN1C's 3 and these 3).
- **Expected checks:** (each run's output file, its PASS/FAIL total line) the base a16fa727 after `npm run build:min`:
  MCP `npm test -- model checker` "38 suites passed"; website model-health 255, gulf-calendar 916, sp9 3, sp15 3,
  sp24 23, sp27 3, sp32 39. **Got** on the split 9a93c59d: MCP "39 suites passed" (the 38 with the same check counts,
  suite by suite, plus the new fn1d), website the same seven totals. On the merged head e3461d08: MCP "40 suites passed" (with FN1C's fn1c), website the same.
  No fixture re-recorded (sp9-health.json, sp15-index.json, sp27-health.json unchanged). New suite fn1d 125 checks
  (its fixture recorded on a16fa727 only, green on every split commit). Lint 0; contracts (test 14, check 715),
  check-modules, check-min (stamps), site config, result-lines, changelog-words, agent-memory pass.
- **Characterisation, red-proven on a16fa727:** 152 mutants (engine 64, Gulf 47, questions 41), one or more per part,
  each in a git worktree of the base: 147 red (sp27 56, sq7 3, fn1d 88: each fn1d case red on a16fa727 under its
  mutant first, fn1d green on a16fa727 unmutated); 5 equivalent (below).
- **Resume:** CI on the merged head, then DONE.

## The steps (one per job of the old function, called in the old order)
- **model-health-engine.js analyze**, context `ah`: graphStep (normalise, index, auto date tables, the dependency
  graph), rootsStep (the report's use, broken references, roots), reachStep (reachable, used-by, depth, the measures),
  rulesStep (M queries, sources, runRules), scoreStep (penalties, scores, the findings' order), docsStep (the
  measures' and tables' documentation); analyze builds the answer.
- **gulf-health.js analyze**, context `gh`: setupStep (options, country, weekend rule, texts, the answer's frame),
  readCalendarStep (next Ramadan, the calendar, the measures), then analyze's no-calendar answer, columnsStep,
  weekendStep, datesStep, rangeStep (range and measures), the order and gulfFixes (was the nested `fixes`).
- **health-confirm.js pleaseConfirm**, context `pc` ({ M, ctx, out }): measureQuestions, relationshipQuestions,
  unrelatedQuestions; `flat` and `GENERIC` (pure, used by the last two) are file-level.

## The mutants and what caught them (ids as in my scratch list, one change each)
- **engine (A graph 13, B roots 13, C reach 5, D rules 5, F score 11, H docs 12, J answer 5; 64):** sp27 46; fn1d 3
  at first (B4 a bookmark's place, B6 a hierarchy level of a missing table, F9 the cap); 15 red nowhere: 11 now fn1d's
  model (E18: auto date tables of both kinds marked as dates and not hidden, a function reading a column, two shared M
  expressions, sources seen in another order than their counts, a row-number column, a 45-step query, an auto date
  hierarchy's level and a hierarchy named as a column in the report, and the model without its wrapper): A1, A2, B7,
  B10, D2, D3, D4, F5, J2, J3, J4 red there; 4 equivalent (A6, F4, H1, H10, below).
- **Gulf (G1-G48, 47):** sq7 3 (G2, G9 the weekend rule, G48 the fix's weekend option), fn1d 43: the first cases
  caught 29 (the item cap, the count, the dates compared, Oman's own count, the country's name, the note, the next
  Ramadan, no calendar's fixes, the columns, the weekend's items and texts, the dates' months, the estimates, the
  range, the order, every fix setting); 1 equivalent (G21); added (each red on a16fa727 first): only a "vs Last Ramadan" measure (G13), months
  moved from Umm al-Qura by two and five days and Dhu al-Hijja a day early (G29, G31, G32, G34), Oman's own Ramadan
  1440 from 17 May 2018 (G6, G28, G30), a range that can't be read (G22), a calendar ending in Ramadan (G37), an Eid
  measure only (G14), a DAX calendar the generator did not make (G16), Hijri and an Eid column (G20).
- **questions (Q1-Q41, 41):** sp27 10 (Q2, Q3, Q5, Q10, Q11, Q17, Q21, Q25, Q26, Q41); the other 31 at the edges no model sat on: 9 small models (B1-B9 in fn1d: a lower-case table, 100 *,
  a column's amount, / 1000 *, all, an empty text, MIN, two concepts; lag, day in lower case, MAX of a number, a ratio
  said as a margin, * 100 shown plain, bytes; one-to-one, a key not named as a key, a candidate in another
  relationship, two candidates; a measures table with hidden columns, a field parameter, a DATATABLE calendar; one
  regular table; a calendar read by a calculated table, by a calculation group, only in a time-intelligence call, a
  period table marked as dates; facts with two columns, a key named after Branches, a key marked as the key, a key DAX
  reads, an untyped key): all 31 red there (Q34 on the first model).
- **Equivalent (5):** A6 (a calculated table's columns needing their table: the same edge is added for every column a
  few lines later); H1 (a measure's own table dropped from dependsOn: the next filter drops it again); H10 (a table used
  through its columns: every column already depends on its table, so reaching a column reaches the table); F4 (LONG_M
  out of the queries scope: an info rule has cap 0, so it takes the same branch); G21 (the weekend's cantTell first:
  it is always the first cantTell pushed).

## Decisions I made
- Steps are file-level functions given one context, destructuring only what they use; lint's no-undef and
  no-unused-vars are the proof (both on in eslint.config.mjs). A multiset line diff of each file against a16fa727:
  every old line kept except the two `fixes(` calls (now `gulfFixes(gh, `), one `return out;` that is `return;` in
  unrelatedQuestions (pleaseConfirm returns out), and the comment "documentation data" reworded on docsStep.
- The nested `fixes` (hoisted, called before its definition) became the file-level `gulfFixes(gh, c, missing)`;
  making a function has no effect an answer can see.
- fn1d pins whole outputs by sha256 and length (as sp27 does): analyze for sp27's inputs, the Gulf models and FN1D's
  model; pleaseConfirm for every model, with no ctx, an empty ctx and the user tables; the Gulf analyze per calendar
  over 144 option sets (8 countries with one unknown, Sharjah's weekend or not, three dates, three item caps). The
  fixture was recorded three times, each time on a16fa727 in a worktree (wt5, `git diff a16fa727 -- assets` empty),
  as cases were added; never on the split. C1 and C2 check that the cases raise every Gulf finding, each cantTell and
  every question kind.
- The calendars with moved months are the Calendar Generator's own DAX with one month row's first day rewritten
  (made-up data; a generator setting cannot write them).
- The stamps: build:min re-stamped the health worker (model-health-worker.min.js), which is one line in
  theme-generator.js (on the brief's stay-out list, check/0.3.2-batch-d3eb2306, now merged); the build's, as the brief
  says. At the merge, the theme generator's pages and .min.js conflicted on stamps only: integration's side taken,
  then build:min wrote ours again (check-min 1219 pass).
- No new module, so MODULES.md is unchanged (the interfaces are the same); no helper written, so the same-job finder
  has nothing new. No ledger place names these functions (CONTRACTS.md, contracts-probe.mjs grep): nothing moved.
- tests.json and the CHANGELOG lines are placed away from FN1C's (after sp9; between FN1B's and FN1C's lines), and both
  merged without a conflict.

## The runs
- On e3461d08 (after `npm run build:min`): MCP `npm test -- model checker` "40 suites passed" (the 39 above plus
  FN1C's fn1c 74; fn1d 125); website model-health 255, gulf-calendar 916, sp9 3, sp15 3, sp24 23, sp27 3, sp32 39
  ("All 7 passed"). Lint 0; test-contracts 14, check-contracts 715, check-modules 1160, result-lines 215,
  changelog-words 29, site config, check-min 1219, agent-memory pass.

## CHANGELOG line
- **Inside the Model Health Check's engine, its "Please confirm" questions and the Gulf calendar check, in smaller
  steps:** each is made by short named steps instead of one long function; every finding, question, score, text and
  fix is what it was before, on the website and from the MCP.

## For the owner
none

## Risky changes
none: no security policy, approval step, file writing, answer, network or process changes; no test loses a check (a
suite added: MCP fn1d 125).

## For the laptop
none

## Seen, not in scope
- gulf-health.js's "This machine can't work out the Umm al-Qura calendar" branch (no full ICU) is reached by no suite:
  Node here has full ICU; moved as it is.
- The other functions over 150 lines (B-377; my measure on e3461d08 lists 18 with these gone).
- The confirm questions had few edge cases in the shared fixtures (sp27 pinned the whole answer, but its models sat
  away from 31 of the 41 edges); fn1d now holds them.

## Lessons for the reviewer
- A survivors list written with `echo` ends in a newline, and `split(' ')` then misses its last id (H10, Q40 skipped
  once, run again alone): read such lists with `.trim()`.
- `cat > file` with no input in a compound command waits for stdin until the timeout: a stray one cost a run.
- Mutants of a function whose outputs a suite pins by hash (sp27) still survive when the fixtures sit away from the
  edges: 31 of 41 question mutants needed new small models. A brief could ask for edge models per condition first.
