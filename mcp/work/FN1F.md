# FN1F (0.3.2): three engine functions into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1F" (6 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's
  plan), D-1104-12 (a library of functions, fixed at the source), D-1104-18 (keep building the library); D-1104-15
  and D-1027-05 bind it (neither changes); D-1108-01 (8 Nov, the reviewer's resume: "the same pace").
- **Base:** `fix/0.3.2-fn1f` from `origin/integration/0.3.2` at 4bc74921; integration merged in once, at a548495d
  (FN1E), on the reviewer's resume message (843975b3). Pushed only this branch; never merged into it again, no PR.
- **Scope:** three functions split into named steps, each in its own file (no new module): `field-suggest.js` `rank`,
  `report-build.mjs` `reportBuild`, `svg-kpi-compiler.js` `compile`. Code moves; no text, order, key or output
  change. FN1C's and FN1D's method: file-level steps given one context object.
- **Commits:** plan d9bb626a; integration 843975b3; pin b5eac250 (recorded on 4bc74921); reportBuild 4844bd91;
  compile 575e412f; rank ed9d4bdd (both with build:min's stamps); CHANGELOG ef92a6fb.
- **Function sizes (my measure, `espree`, first to last line, nested functions inside their parent):** rank 256 -> 9,
  reportBuild 249 -> 9, compile 238 -> 7 (its layer callback 155 -> layerStep 48). Every new step 80 or fewer: the
  largest are dateStep 64, designStep 57, catsStep 55, handStep 52, toolsStep 51. Files: field-suggest.js 364 -> 403,
  svg-kpi-compiler.js 425 -> 474, report-build.mjs 301 -> 346 (each under 600).
- **Ratchet (fn_over_150):** the gate's count 12 -> 9 for the reviewer to set (no funcsize baseline file in
  DataArcus; the gate's own). My script, named functions over 150 across assets/js, mcp/lib, mcp/tools and
  server.mjs: 15 on 4bc74921, 12 on a548495d, 9 on ed9d4bdd.
- **Expected checks:** the base 4bc74921: MCP `npm test -- report core model` "108 suites passed"; website svg-kpi,
  sp12, dd2z, tools, pbip, theme-generator(-lab), sp7, sp8, sp13, sp14, sp25, sp33, sp36, fn1b, text-align, consent
  "All 17 passed". **Got** on ed9d4bdd: MCP "109 suites passed" (the 108 with the same check counts, suite by suite,
  plus fn1f 6), website "All 17 passed" with the same 17 totals. No fixture re-recorded. Lint 0; test-contracts 14,
  check-contracts 715, check-modules 1160, check-min 1219, site config, result-lines 221, changelog-words 29,
  agent-memory 446 pass; sitemap lastmod already matched.
- **Characterisation, red-proven on 4bc74921:** 288 mutants (rank 100, compile 108, reportBuild 80), one or more per
  part, each in a git worktree of the base: 277 red, 11 equivalent or unreachable (below). The new suite fn1f
  (6 checks; 426 designs, 260 + 19 models, 56 builds pinned case by case) is green on 4bc74921 unmutated and on every
  split commit; its fixture was recorded on 4bc74921 only (a worktree, `git diff 4bc74921 -- assets mcp/lib` empty).
- CI: not yet run (after the area runs).
- **State:** CI running on the head.
- **Resume:** the CI result; then DONE. Integration moved to 1ee00b30 (PF3) after my one merge: not merged again
  (L-1103-04); PF3 touches none of the three files (tests.json gets a line from each).

## The steps (one per job of the old function, called in the old order)
- **rank** (context `rk`): rankStep (catalog, counts, score, time variants, periods, net before gross), cardsStep
  (cardable, main, the KPI cards), dateStep (reach, time axis, year-month span, year slicer), catsStep (categories,
  catA, catB, slicers), choicesStep (pins, excluded columns, axisFor, Arabic swaps), notesStep (the notes, in order).
- **reportBuild** (context `rb`): toolsStep, inputsStep, then designStep or handStep (the old if/else), scriptsStep,
  finishStep (the answer).
- **compile** (context `ck`): valuesStep, helpersStep, layerStep per layer (the attribute helpers, the switch, the
  mirror, tag and show-if) calling rectLayer, circleLayer, lineLayer, textLayer, ringLayer, arrowLayer, sparkLayer;
  svgStep. sparkLayer's two early `return;` are `return false;` and its case returns on false: the same skip.

## The mutants and what caught them
- **Tier 1 (the suites that pin these files), all 288:** rank 54 red (sp30 54, sp8 24, sp14 18); compile 73 (sp12
  71, sp16 61, svg-kpi 9, dd2z 2); reportBuild 19 (sp43 17, sp4 11).
- **The rest, fn1f (each red on 4bc74921 under its mutant first):** rank 46, compile 31, reportBuild 54.
  - rank: the generated models (seed 1106) caught 20; 26 sat at edges no model of 4,000 generated reached, so 19 small
    edge models (one per condition): a core sum against every tie-break word, a variant and a measure that only
    reads it, a name with ] and a cycle, an alias of an alias, a measure over itself, two widened forms of a hidden
    value, a self difference through a measure, a gap measure ranked first, a hidden label sorted by a month code,
    years 2 and year-months 13 by the counts, a text column of distinct 0 and one of exactly 5,000, two quarter
    columns, a pinned slicer named like a pool column, a flag not always true, Arabic twins ("(Arabic)", a day
    name's twin, a Hijri one before a Gregorian one, a pinned table), six calendars and six tables out of reach, a
    card left behind, 21 columns the counts rule out, a net with two gross forms.
  - compile: 426 designs (seed 20261106: every layer kind bound or not, mirrored, tagged, the value kinds, columns,
    bad inputs) plus three edges: a sparkline of a value worked out from a refused measure, a bold percent that fits
    its ring only at 1.05 of its width, a name of control characters only.
  - reportBuild: 56 runs through reportRun's build and its finish (the write's answer with every note, and every
    written file): edges at each condition (a card one past the cards, a logo 100 x 150, .jpeg, a theme made for 1456
    high, a name of 31 characters, a model with one ID column and two card slots, a model with nothing to count, the
    sample project in Arabic with and without its calendar script, a hand-placed combo of mixed units, ...).
- **Equivalent or unreachable (11):** S29, S92, S100, S101 (merging neighbouring strings before `N.cat`, which merges
  them itself); B1 (reportBuild's "Also:" with notReady: the gate, report-run.mjs:62, runs first and passes only
  with notReady null); B13 (withValues on a KPI slot: with no value to show the slots are cut to zero cards first);
  B14 (no projectDir: reportRun refuses such a model before the build); B29 (a second page on a small page: the
  single-focus layout every small page takes has none); B45 (the hand theme's default name: the writer renames the
  theme file); B60 (splicing before the .pbip: the writer's first file); B71 (the format script's folder: a model
  read from a folder always has its project as that folder).

## Decisions I made
- Steps destructure only what they use and hand back what later steps read (`Object.assign(ctx, {...})`); a value a
  step reassigns is a local `let` taken from the context and handed back. Lint's no-undef and no-unused-vars are the
  proof. A multiset line diff of each file against 4bc74921: no old code line removed except the structure lines
  (the case labels and braces, the two `return;` of the sparkline, reportBuild's `if (a.design) {` / `} else {`).
- fn1f pins create_report's write and answer by calling the build's own `finish` in process (reportRun's build hands
  reportBuild's notes only to it), in a temporary folder; the clock and random ids fixed as sp43 does.
- The rank edges were found by a search: each surviving mutant against 4,000 generated models first, then a small
  model per condition only where none told it apart; fn1f pins the 260 generated and the 19 edges.
- Integration was merged at the start, on the reviewer's resume message, instead of before the last CI run
  (L-1103-04 says once: it is once). The three files and everything they read were the same on a548495d, so the
  fixture recorded on 4bc74921 holds for both.
- The tests.json line sits after fn1e's; the CHANGELOG line before the Theme Generator's.

## The runs
- On ed9d4bdd (after `npm run build:min`): MCP `npm test -- report core model` "109 suites passed" in 27 min (fn1f 6;
  the mutation suite's line differs only in its seconds); website "All 17 passed" (tools 399, consent 38,
  theme-generator 922, theme-generator-lab 922, pbip 111, svg-kpi 854, text-align 474, sp7 3, sp8 3, sp13 3, sp12 3,
  sp14 9, sp25 22, sp33 34, fn1b 17, sp36 18, dd2z 8), the base's totals.

## CHANGELOG line
- **Inside the field picker, create_report's build and the SVG KPI Designer's DAX, in smaller steps:** which fields
  are picked and in what order, every file create_report writes and every DAX measure the designer compiles are each
  made by short named steps instead of one long function; all of them are byte for byte what they were before.

## For the owner
none

## Risky changes
none: no security policy, approval step, file writing, answer, network or process changes; no test loses a check (a
suite added: MCP fn1f).

## For the laptop
none

## Seen, not in scope
- B14's refusal in reportBuild ("the working folder is the model folder itself") cannot be reached through
  create_report: reportRun refuses a model without a project folder first. Moved as it is.
- reportBuild's `input()` with notReady (the "Also:" form) cannot be reached either: the gate runs before the build.
- The other functions over 150 lines (B-377; my measure on ed9d4bdd lists 9 named).

## Lessons for the reviewer
- reportRun's build returns create_report's notes only through `finish`: a pin of the build's values alone missed 26
  of reportBuild's mutants; calling `finish` in a temporary folder pins them.
- A seeded generator caught most mutants, but the count limits and tie-breaks needed one model per edge (26 of 100
  for rank); a search of each survivor over a larger generated stream tells quickly which need a hand-made one.
- Stopping a mutant runner mid-mutant leaves that mutant in the worktree; restore the files before the next run.
