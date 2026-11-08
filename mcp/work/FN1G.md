# FN1G (0.3.2): three mcp/lib functions into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1G (0.3.2): three mcp/lib functions into named steps, behaviour identical" (8 Nov); the
  owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's plan), D-1104-12 (a library of functions,
  fixed at the source), D-1104-18 (keep building the library).
- **Base:** `fix/0.3.2-fn1g` from `origin/integration/0.3.2` at 1ee00b30 (PF3 merged). Pushed only this branch; never
  merged, no PR.
- **Scope:** three functions split into named steps, each in its own file (no new module): `mcp/lib/twin-copy.mjs`
  `languageCopy`, `mcp/lib/gulf-date-questions.mjs` `gulfDateQuestions`, `mcp/lib/gulf-calendar.mjs`
  `addGulfCalendar`. Code moves; no text, order, key or output change; Arabic lines moved, never retyped.
- **Commits:** plan ba932f2a; pin suite 2c920d2b; addGulfCalendar 79289af5; gulfDateQuestions b64bfa6d; languageCopy
  1db512ab; edges and CHANGELOG 3181b685, 69674228, b021a88f (each fixture recorded on 1ee00b30 only); integration merged in once f43461fe (2fc104ce: FN1F); WORK.md 3aa04f26 (in the merge: FN1A-FN1G).
- **Function sizes (my measure, `espree`, first to last line, nested functions inside their parent; the reviewer's
  "before" agrees):** languageCopy 182 -> 11, gulfDateQuestions 182 -> 17, addGulfCalendar 176 -> 10. Every new step 80
  or fewer: the largest are relationshipsStep 60, grainScopeStep 41, linksStep 33, usingStep 33, answerStep 32 (Gulf
  calendar), tableStep 30. Files: twin-copy.mjs 312 -> 375, gulf-date-questions.mjs 271 -> 343, gulf-calendar.mjs
  279 -> 321 (each under 600).
- **Ratchet:** the gate's count 12 -> 9 on 1ee00b30; with FN1F merged in (f43461fe) 9 -> 6, for the reviewer to set. My script over assets/js, mcp/lib,
  mcp/tools and server.mjs (the files' own wrappers counted too) 65 -> 62: exactly these three gone.
- **Expected checks:** (each run's own output file, its PASS/FAIL lines) areas model, twin, report, safety, arabic,
  checker, release and core on the base 1ee00b30: 218 suites, all PASS (sweep-s1 failed once only because my unregistered
  fn1g sat in that worktree; 30 of 30 run clean). **Got** on the split b021a88f (the last code commit): 219 suites, all PASS: the 218 with the same check count each, suite by suite, plus fn1g 222. On the merged head f43461fe: 220, all PASS (the same plus FN1F's fn1f 6). Website gulf-calendar 916 on the base and
  the split. No fixture re-recorded (fn1e-pins, sp1, sp2, sp9, sp15, sp23, sp27, sp38, sp44 unchanged). New suite fn1g
  222 checks (216 pins). Lint 0; test-contracts 14, check-contracts 715, check-modules 1160, result-lines,
  changelog-words, agent-memory pass.
- **Characterisation, red-proven on 1ee00b30:** 913 mutants (Gulf calendar 269, date questions 310, copy 334), one change
  each, parsed first, in git worktrees of 1ee00b30: 851 red, 62 equivalent or not reached by any suite (below).
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/42470065730 on 8e20af03. After it only this note changed.
- **State: DONE.**
- **Resume:** none; the reviewer's merge. The ratchet: 9 -> 6 (with FN1F).

## The steps (one per job of the old function, called in the old order)
- **addGulfCalendar**, context `gc` ({ m, a, env }): inputsStep (country, name, years), relationshipsStep (relateTo and
  what each says in English and Arabic), basesStep (the base measures), tableStep (the generator's table, the self
  check, the notes), scriptStep (the measures, VAT, the pegs, the script; the one writeScript call), answerStep.
- **gulfDateQuestions**, context `gq` ({ m, a, opts }): modelStep, candidatesStep, seasonalStep, then the old early
  `return null` (in the function, its line unchanged), calendarColumnsStep (the season's names and the calendar's
  fields), answersStep (the memory and take), questionsStep, usingStep, grainScopeStep (needCal and its offer kept
  together), problemsStep, rememberStep (the status and the memory), answerStep.
- **languageCopy**, context `lc` ({ P, built, labels, n }): idsStep, linksStep (renameFilters, remap, the Arabic
  pictures), then pageStep for each page (page context `pc`: syncStep, buttonsStep, pageFilesStep, extraStep, then the
  pair), bookmarksStep, pagesJsonStep, resourcesStep, answerStep.

## The mutants and what caught them (ids in the scratch lists mG, mQ, mT)
- **addGulfCalendar (G1-G269):** fn1g 262 (gc3 also caught G56). Not reached or equivalent (7): G116, G193 (an empty
  array added to a concat), G168, G171 (selfCheck and the "before" check keep a finding's id, title and full count; the
  cap trims items only, gulf-health.js:180), G207, G208 (the second TMDL attempt cannot fail: the base name with a
  control character is refused earlier, the rest is DataArcus's own), G214 (every Gulf country has a VAT rule in
  gulf-dates.js, so the column is built whenever VAT is asked).
- **gulfDateQuestions (Q1-Q310):** fn1g 299. Equivalent (11): Q68 (no calendar gives no field either way), Q79 (an empty
  concat), Q88, Q89, Q92, Q95 (take's return value is never read), Q94 (a remembered answer was valid when recorded, so
  it is valid on recall), Q105 (a 5-digit year is never recorded: dateRecord refuses it), Q174 (blocked is empty there),
  Q190 (`(x && active) || active` is active), Q287 (a splice of zero at exactly MAX).
- **languageCopy (T1-T334):** fn1g 283; the existing suites on fn1g's survivors: glass-twin 29, sp40 5, hm1 5, mp1 3,
  language-toggle 2, sq4 1 (7 only there: glass pictures and their registration, twin measures, heatmap names).
  Equivalent (24): T6, T192, T253, T261, T316 (an empty concat); T22, T25, T26, T44 (twin-read drops a visual with no
  name; a link with no bookmark is null); T132, T138 (any direction but "rtl" reads left to right, report-a11y.js:169);
  T104, T145, T146, T148, T149, T160, T162, T214 (every page and visual read is an object; a visibility set undefined
  is dropped by JSON); T189, T205, T245, T297, T299 (the order of the copy's file list: every file written and every
  answer the same). Not reached by any suite (20): T49, T50, T53, T56, T62, T65, T66, T284, T288, T294, T295 (glass
  picture names taken, a glass wallpaper, image url shapes, report.json's packages of other shapes: only one glass page
  is flipped in fn1g's T20), T191, T195, T197, T201, T203, T204, T206 (an added visual's name taken: no suite has one),
  T247 (bookmarks.json of another shape is copied in the catch either way), T319 (a bookmark group with no Arabic name:
  the twin's flow drafts every group).

## The new checks (mcp/test-0.3.2-fn1g.mjs, fixtures/fn1g-pins.json, area model)
- G1-G110: addGulfCalendar's whole answer and the script the writer is given, for every refusal, country, weekend and
  option, relateTo and measures shape, the writer's refusals, two columns held to one date table, exactly 5 measures, a
  format string TMDL can't hold, no Umm al-Qura calendar, the first estimate on each event's edge (gulf-dates.js's
  checked date moved for the case, then restored).
- Q1-Q77: gulfDateQuestions for made-up models (a generated, a named and no calendar), every question, answer, problem,
  the memory between calls and its cap (2,600 calls), then the edges after the cap.
- T1-T29: the copy through create_arabic_twin into "same" (plan, write, every file) on copies of the twin project:
  tabs shown, pages.json and bookmarks.json shapes, sync groups, buttons with no room on one or both sides, links,
  filters, bookmarks and groups, glass pictures, hm1's heatmap, other files in a page's folder.
- Each case recorded on 1ee00b30 (worktree, mcp/lib clean), red there under its mutant first; green on every split
  commit. Outputs hold the temp folder written out as `<ROOT>`.

## Decisions I made
- Each step is built by a script from the old line ranges (scratch compose.py): every moved line is the old one. A
  multiset diff of each file against 1ee00b30 (trimmed lines): every old line kept except addGulfCalendar's env
  destructuring, and languageCopy's `let n = 0;`, its loop's opening and closing lines (now `lc.n` and one call a page);
  the loop's lines lost two spaces of indentation. Inputs are destructured from the context, outputs assigned back;
  lint's no-undef and no-unused-vars prove both.
- gulfDateQuestions' `if (!ambiguous && !seasonal && !a.gulfDates) return null;` stays in the function, unchanged, after
  its first three steps; the season's two lines after it open calendarColumnsStep.
- No ledger place names these functions (CONTRACTS.md and contracts-probe.mjs grep): nothing moved there; test-contracts
  run. No new module (MODULES.md unchanged), no helper written. write-gate: gulf-calendar.mjs still has one
  writeScript call.
- fn1g changes two shared engine values for single cases (calendar-generator.js's hijriFmt, gulf-dates.js's checked)
  and restores them in `finally`, as made-up inputs for edges the data never reaches.

## CHANGELOG line
- **Inside add_gulf_calendar, the Gulf date questions and the English and Arabic copy, in smaller steps:** the Gulf
  calendar's script and answer, plan_layout's date questions and the copy holding both languages are each made by short
  named steps instead of one long function; every script, question, text and file is byte for byte what it was before.

## For the owner
none

## Risky changes
none: file writing is unchanged (addGulfCalendar's one writeScript call, write-gate 7; the copy's files byte for byte in
fn1g, sp11, sp26, sp40, twin-artifact); no security policy, approval, answer, network or process change; no test loses
a check (one suite added, fn1g 222).

## For the laptop
none

## Seen, not in scope
- languageCopy's `notes` line for a bookmark group without an approved Arabic name is never seen in the twin's own flow
  (every group is drafted); a later job could pin it from create_arabic_twin with a label left out.
- The other functions over 150 lines (B-377); my script lists 62 with the files' wrappers.

## Lessons for the reviewer
- A worktree used for mutants must never record a fixture: I recorded once in one while a mutant sat in its lib (caught
  by the pin failing on the split, recorded again in a clean worktree, every earlier pin compared equal).
- Killing a mutant runner (SIGTERM) skips its restore: check `git status` of every mutant worktree before reusing it.
- The language buttons need obstacles that never hold the button's box: one visual over the whole page is no obstacle
  (holdsBox), narrow strips are; and the page's size and its page button's row decide where it looks.
- Added cases go after the memory's cap block so no recorded case's memory changes (gulfDateQuestions keeps module state).
