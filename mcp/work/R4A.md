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

## Pins changed (only because the words were made plain)
(filled in as they happen)

## CHANGELOG line
(after the work)

## Decisions I made
(after the work)

## Seen, not in scope
(after the work)
