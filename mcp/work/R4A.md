# R4A (0.3.1): round 4's findings (19 simulated testers on e2236be7), the builder's items

## Summary
- **Approval:** the owner's E1 round 4 (27 Oct night, the final 0.3.1 build e2236be7; engine branch `evals/e1-harness`,
  `evals/results/2026-10-27-round4.md`, not reachable from this session: the brief's essentials used); the owner
  approved round 4 and its findings for builders; the reviewer verified item 1 in the code. The brief "Go on R4A".
- **Scope:** item 1 (problems 3, 10): `mcp/tools/create_report.mjs` (the asked slicers, or the asked plus exactly the
  plan's `slicersAdded`), `mcp/tools/plan_layout.mjs` (the plan says which list to pass); item 2 (problem 3):
  `mcp/lib/plans.mjs` `differences()` (each kind names the values and the input to pass); item 3 (problems 1, 5, 8, 9;
  T-3, T-9): `assets/js/label-limits.js` and `pbip-page.js` (a plain `said` beside the measured `why`),
  `assets/js/layout-check.js` (the cards over a chart, the date column with no type; the cards left out of the
  planned report's "worth a look"), `mcp/lib/approval-window.mjs` (CS1's text lines, the kinds row, every item worth a
  look, the folders), `mcp/lib/visual-meaning.mjs` (a custom visual's own settings), `mcp/lib/plan-lint.mjs` (no cap
  on the items), `mcp/lib/plain-words.mjs` (the working folder by its path); item 4 (problem 2): the approval page's
  first line. A new suite `mcp/test-0.3.1-r4a.mjs` (one line in `tests.json`); CHANGELOG.
- **Base:** `fix/0.3.1-r4a` from `origin/integration/0.3.1` e2236be. Push only this branch; never merge, never a PR.
- **Not in this job:** the length of plan_layout's and check_report's answers (problems 4, 6: the reviewer's proposal).
- **Expected checks** (before the work): r4a about 30 checks, about 26 red on e2236be (A 6, B 4, C 14, D 3; the
  guards green); `npm test -- report` one more suite than the base, the rest the same counts except the pins named
  under "Pins changed"; `-- arabic`, `-- core` the same counts; run-all (label-limits, layout-check, pbip-page touched)
  the same; full run the base registry + 1.
- **Invariants:** nothing unapproved is written (the added slicers are the ones the approved page listed; the files are
  the plan's, byte for byte); metadata only (a refusal names inputs the agent passed and the plan pinned, never a
  value read from data); every path inside the working folder.
- **Got:** (after the run)
- **Resume:** the plan pushed; next: the red suite, then the fixes.

## Plan
1. This note, pushed first. Base suites in a separate worktree on e2236be.
2. Red first: `mcp/test-0.3.1-r4a.mjs` (the sample project, made-up data; temp folders under `os.tmpdir()`):
   - A (item 1): plan_layout on the sample with the tour's 2 slicers (the design has 3 slots): the plan's text says which
     list to pass (en, ar); approved, create_report with the 2 asked writes; a second plan, create_report with the 3
     listed writes; both write exactly their plan's files (the answer's digest is the plan's) and both reports bind the
     same 3 slicers; refused: the asked plus another field, the 3 plus a fourth, the added one alone.
   - B (item 2): the refusal names what differs and the input to pass: a slicer passed that the plan doesn't hold, one
     it holds and not passed, a scalar (name), a map (displayNames); every kind ends with "pass ...".
   - C (item 3): label-limits `said` with no "px"/"letters" ("A bar chart, not columns: 12 months would be cut or slanted
     under columns.") and its Arabic; the plan's kindChanges and the approval page's kinds row use it; COVER_CARDS
     says it is meant and the planned report's check leaves it out of "worth a look"; the date column with no type
     says what happens and what to do; CS1's lines: no "X -> X", "visual titles" not "largeTitle", "set to" or
     "removed"; visual-meaning's "(1: needle)" in plain words; every item worth a look listed (14 items: 14 lines);
     the working folder by its path (whereSaid, the sample's Folder row, en and ar).
   - D (item 4): the approval page starts with one plain line ("1 new report: N pages, next to your model, in the
     folder ...") before the lead; the counts folded under it; Arabic too.
3. The fixes at the cause (above), `npm run build:min`, the `?v=` stamps, csp/ar-pages/sitemap-lastmod `--write`.
4. Suites, the full run once, the checks (result lines, changelog words, agent memory); this note's Got; push.

## Pins changed (only because the words were made plain or moved where round 4 asked)
- `test-0.3.1-cs1.mjs` T10: "largeTitle fontSize 11pt -> 14pt" -> "visual titles: size set to 14pt (was 11pt)" (problem 9).
- `test-0.3.0-testers.mjs` T1-1, T1-6, C1-2: the counts by kind were the files part's first line; round 4's problem 2
  puts a plain line first ("1 new report: 4 pages, next to your model, in the folder ...") with the counts folded under
  it, so the three checks read the page's head (the plain line, the counts inside a `<details>`). Their counts unchanged.
- `test-0.3.1-r4a.mjs` A5 (my own, before the fix): a fourth slicer is refused by the schema's limit of 3 first.
- Not changed: rc24 B-140's pattern ("Comparison: Bar chart (planned as a column chart") still holds: the row keeps its
  head and gives the plain words after it.

## CHANGELOG line
- **Clearer plans and approval pages:** create_report takes the slicers you asked for or the full list the plan showed
  (the same approved report); a refused write names what differs and what to pass; the approval page starts with one
  plain line (what is new and where, the folder's full path), the counts folded under it; plainer words where you
  decide (why a chart is a bar chart, the "no data" cards, a date column without a type, a redesign's text changes, a
  custom visual's own settings, every item worth a look, the working folder by its path).

## Decisions I made
1. Item 1 in create_report (`listedSlicers`), not in the gate: the asked list plus exactly the plan's `slicersAdded`, in
   any order, each once, is read as the asked list the plan pinned; the gate then compares as before and the plan's
   kept files are written byte for byte. Any other list reaches the gate unchanged and is refused.
2. Item 2: each difference keeps its input's name first ("fields (slicers: ...)", "displayNames (...)", "name: ...") so
   the existing patterns and the G-inputs mutant hold; `files` keeps its own message (a file changed). Values shown are
   the agent's inputs and the plan's pins, cut at 200 characters, never data.
3. label-limits keeps `why` (the measured numbers, pinned by J11 and read by the agent) and adds `said`/`saidAr`; the
   approval page and the plan's `kindChanges` show `said`; the slots themselves gain nothing (the answer's length is
   problem 4, not this job).
4. The "no data" cards: both: said as meant, and left out of "worth a look" in `checkProject` (DataArcus's own built
   report, the plan's check and the website's download); `check_report` on a person's report still notes them.
5. T-3: every item worth a look is listed (no cap of 12), so the summary's N is always the list's N.
6. T-9: `folderSaid` (the folder's name and its full path) and `besideSaid` (scripts: "next to the project, in the
   folder ... (path)"); `whereSaid` names the working folder by its path. A plan's outputs carry `outputsAt` (their
   folder, relative to the working folder) for the page's first line; without it the line names no folder rather than
   a wrong one.
7. Arabic: the approval page's new first line, its fold, the kinds row (`saidAr`), the plan's slicer sentence and
   whereSaid have their Arabic. Not given Arabic: the layout check's findings (the check has no Arabic findings today:
   every item worth a look is English on an Arabic page too) and the redesign's page (English only today): see Seen.

## Seen, not in scope
(after the work)
