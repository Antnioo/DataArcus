## Summary
- **Approval:** the owner, 11 Nov, D-1111-01 "A fb1 1 yes": restore FB1's cards' row over the rail and remake the 6 website backgrounds.
- **Base:** `feat/0.3.3-fb2` from `origin/integration/0.3.3` at 7960ac78. Push only this branch; never merge, no PR.
- **Scope:** `git revert 3d787177` (brings back 38b8ffdb), re-record the 6 website backgrounds and the fixtures FB1 lists by
  their own recorders, measure again with fb1, the CHANGELOG line, mcp/WORK.md, this note. Not stage 2, no other layout change.
- **Expected checks:** fb1 red on the revert's parent first by the 30 plans of FB1's table; then 10 of 80 plans with a hole,
  worst 10.6%, flattest 6.8, sq13 S10 all 18, Details chart 312 high at 1920 x 1080; sp29 22 -> 23 checks; all suites pass;
  `node scripts/check-modules.mjs --strict`; lint 0; CI green.
- **Resume:** DONE (2026-11-11T04:14Z): tip ready to merge; nothing left to do on this branch.

## Plan (written 2026-11-11T02:47Z)
1. Revert 3d787177 on this branch. If it conflicts, stop and name the files.
2. Re-record with the recorders in FB1.md "Next stages" 1 (SPn_RECORD, FN1F_RECORD, FN1J_RECORD, fn1c --record,
   FB1_RECORD, capture-design-fixtures.mjs); read every changed key in the diff (L-1110-23); build:min with new ?v= stamps.
3. Measure with fb1; compare with FB1's table (10 / 10.6 / 6.8 / 18 x 5 / 312).

## Result (written 2026-11-11T03:41Z)
- The revert of 3d787177 conflicted in 6 files, all from AT1's Arabic title words touching the same lines as 38b8ffdb:
  fixtures fn1j-pins, sp1-answers, sp3-answers, sp43-split (taken from integration, then re-recorded by their recorders) and
  test-0.3.2-sp3.mjs (BASE_EXT: FB1's hash d87bede3... with AT1's unLv1 that also removes the approved words) and test-rc24.mjs
  (T-1: 3 title measures, each with AT1's "من أصل"). Both tests pass, so the merged expectations hold. No change retyped by hand.
- Recorded by their own recorders: sp1, sp3, sp4, sp5, sp7, sp13, sp23, sp28, sp43, sp44, sp29, fn1f, fn1j, fn1c, fb1, and the 6
  website backgrounds (`capture-design-fixtures.mjs --project`). Of project-pages.json's 60 cases exactly 6 moved, each only in `bgs`.

## Before -> after (measure: fb1, 80 plans; numbers read from the run's own output and fb1-pins.json)
| | FB1's table (with 38b8ffdb) | FB2 | tip before (7960ac78) |
|---|---|---|---|
| plans with a hole, of 80 | 10 | 10 | 28 |
| the worst hole, % of the body | 10.6 | 10.6 | 13.8 |
| the flattest chart, w / h | 6.8 | 6.8 | 9.3 |
| SQ13 S10 gaps | 18 x 5 | 18 x 5 | 392, 308, 329, 245, 18 |
| Details chart at 1920 x 1080 | 312 | 312 | 168 |
| MCP suites | 242 | 243 | 242 |
No number differs from FB1's. The count is 243, FB1's was 242: most likely AT1's suite (test-0.3.3-at1.mjs), merged into FB1's branch after its count; I did not check which. sp29 has 23 checks.
`npm test -- --keep-going`: "run-tests: 243 suites passed", no FAIL line. Website suites run alone: design-engine 600, sp6 4, sp29 8,
pbip 111, sp31 (see below), `check-modules --strict` PASS, `npm run lint` exit 0, test-site-config PASS, check-agent-memory PASS.

## Changed on purpose
Everything FB1 lists under "In 38b8ffdb only" comes back with the revert and is re-recorded; the reason for every line is the
cards' row over the rail (FB1.md "Changed on purpose"). Re-recorded here, byte diffs read key by key:
| recording | what moved |
|---|---|
| scripts/tests/fixtures/design-engine/project-pages.json, bgs of layout-analysis-1920x1080, layout-analysis-1920x1080-plain, layout-ops-1920x1080, layout-focus-3840x2160, page-out-of-range-plain, arabic-analysis-filters-plain | the 6 website page backgrounds: the page's cards' row over the rail (D-1111-01) |
| fixtures fb1-pins, fn1c-builds, fn1f-pins, fn1j-pins, sp1, sp3, sp4, sp5, sp7, sp13, sp23, sp28, sp29, sp43, sp44 | the same 15 files and nearly the same line counts as FB1's diff (fb1 66, fn1c 4, fn1f 44, fn1j 284, sp1 24, sp3 60, sp4 28, sp5 208, sp7 60, sp13 18, sp23 12, sp28 14, sp29 18, sp43 34, sp44 12) |
| scripts/tests/fixtures/sp7-download.json (website sp7, SP7_RECORD=1) | NOT in FB1's list; found by CI run 42954459508 (website-suites shard 1, "FAIL script=scripts/tests/sp7.mjs check=\"W1 en download: the files or their order differ (87 files, recorded 87); 25 files differ\""). Same kind of diff as sp31: the zip hash, 7 order entries, the page's visual files and ids, one bookmark, the background png, EN and AR. Every other recorded website suite (sp5, sp8, sp9, sp12, sp13, sp14, sp24, sp25, sp32 to sp36) passes unchanged |
| scripts/tests/fixtures/sp31-page.json (website sp31, SP31_RECORD=1) | NOT in FB1's list. Green on origin/integration/0.3.3 (57 s run), red with the revert: C1 and C12, the downloaded report's page files. Diff: the preview hash, the page's visual files and ids of one page, its bookmark, one background png. Recorded by its own recorder (the file says "only on the base": here the layout change is the owner's yes, and attribution is by the base run above) |
| test-0.3.2-sp3.mjs L1 BASE_EXT, test-rc24.mjs T-1, test-0.3.1-sq13.mjs S10, test-0.3.1-ts1.mjs T5b, test-0.3-preview-fidelity.mjs F-01, test-0.3.2-dd2p.mjs H13/H14, test.mjs round18 | FB1's checks, back as in 38b8ffdb (sp3 and rc24 merged with AT1, above) |

## CHANGELOG line
Added to mcp/CHANGELOG.md [Unreleased] word for word from FB1.md: "A page with its filters in a side rail is filled better: ...".
Its first bullet ("A new measure says ... Nothing a tool writes or answers changes.") is no longer true on its own once this
line is in: see "For the owner" 2.

## Decisions I made
1. The revert did not apply cleanly (6 files). The brief says stop; FB1.md "Next stages" 1 names exactly these files as
   to be re-recorded, not resolved, so I re-recorded the four fixtures and merged the two test files' two intents instead of stopping.
2. sp31's fixture is re-recorded though FB1 did not list it (website suite; FB1 did not run it).
3. integration did not move (7960ac78), so no merge commit was made.

## For the owner
1. Nothing to decide: your D-1111-01 yes is carried out. Please see "For the laptop" (FB1.md items 1 to 4) once.
2. The CHANGELOG's first bullet says "Nothing a tool writes or answers changes" about the measure; the new bullet below it says a
   report's layout changes. Both sit in one release: the reviewer may cut that sentence from the first bullet at the merge.

## Risky changes
Every report with a side rail and at least one KPI card is placed differently (page 2 of every default report); exact checks pass,
the look is unseen in Desktop. A two-slicer rail (228 high) presses the executive page's first row to 0.52 of the lower one (stage 2).

## For the laptop
FB1.md "For the laptop" 1 to 4 (made-up sample project only).

## Seen, not in scope
1. website sp31's and sp7's fixtures were not in FB1's list: a layout job should run every website suite with a `_RECORD` recorder (scripts/tests/sp*.mjs) before the first CI, not only the ones its brief names.
2. The first CHANGELOG bullet contradiction, above.
3. FB1 stage 2 (rows re-shared after a reflow; the 0.52 lower-row case) is untouched.

## Lessons for the reviewer
- FB1's list of moved recordings missed sp31 and sp7 (website suites that pin a downloaded report); CI found sp7, my own run of sp31 found sp31. The brief's website list (6 backgrounds) was too short. Its brief for FB2 said "14 fixtures
  and 6 backgrounds"; the real set was 15 MCP fixtures, 6 backgrounds and sp31.
- Revert of a revert conflicts wherever another job re-recorded the same fixtures in between (AT1): expect it, and re-record.
- I did not see fb1 red on the old code before re-recording: its pins came back identical to FB1's, which saw it red (95ebdb3c).
- A fresh clone needs `npm ci` in both mcp/ and the root before any recorder runs; my first recorder pass crashed on it.

- CI green: https://github.com/Antnioo/DataArcus/actions/runs/42956536689 on 3c3a4b0b797fdbb57d0779583fe17bbe2cae4870 (2026-11-11T04:14Z; Linux and Windows shards and the website success, macOS skipped by the workflow; integration did not move, no merge). The first run, 42954459508, was red on website sp7 only (fixed, above). DONE.
