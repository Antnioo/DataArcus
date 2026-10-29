## Summary
- **Approval:** the owner, 25 Oct (the 0.3.1 night run): every "Seen, not in scope" item fixed, carefully. Batch SQ5 of
  [SEEN-QUEUE.md](SEEN-QUEUE.md#sq5-check_report-rules): 0.2.9-writer-S12, R1-S2, T1-S7, 0.2.9-writer-S18.
- **Scope:** `assets/js/report-rules.js` (TIP_ROWS, TOOLTIP_SCROLL), `assets/js/report-a11y.js` (inversions),
  `assets/js/layout-check.js` (a plain place for each finding), their `.min.js`; one line of `mcp/lib/plan-lint.mjs`
  (checkSummary's worth-a-look line takes the place); new suite `mcp/test-0.3.1-sq5.mjs` (one line in `mcp/tests.json`).
  Not SQ4's files (`mcp/lib/twin-*.mjs`, `report-mirror.js`). SEEN-QUEUE.md: my four Status cells only.
- **Base:** `fix/0.3.1-sq5` from `origin/integration/0.3.1` (3bda227).
- **Expected checks:** new `sq5` about 12, about 7 red on 3bda227; checker suites unchanged (check 31,
  test-0.3.1-checker 23, arabic-lens 31, validator-gap 5); every other suite unchanged.
  **Measured:** sq5 22 (15 red on 3bda227: 16a2df1); checker 31 / 23 / 31 / 5, a11y 121, twin
  area 7 suites, testers 74, v029a4 40: unchanged. Full run: see "Suites".
- **Resume:** done: S12, R1-S2, T1-S7 DONE (11a85ab); S18 OWNER (no measurement: "For the laptop"). The reviewer reviews.

## Each item, confirmed on 3bda227
- **0.2.9-writer-S12** true: `report-rules.js:69` TIP_ROWS = floor((h - 46) / 22), TOOLTIP_SCROLL's texts say "22 a row
  + 46" and "measured at 8pt". The measurement in force (DESKTOP-TESTS.md, "2026-10-06 night, the laptop sitting" and its
  Lessons; RULES-POWERBI.md "Night of 6-7 October"): a bar chart at the theme's 10pt needs 22.2 a row, 45 above the first
  row, 8 under the last, 38 more for its value axis. Round 0's "22 + 46" was that tooltip chart without its axis.
- **R1-S2** true: boxes A (0,0 400x200), T (420,0 400x500), B (0,220 400x200): `readingOrder` gives A, T, B (T joins
  A's row) and `inversions([A, T, B])` counts 1 (B beside T, before it): the writer's own order is a finding.
- **T1-S7** true: `layout-check.js:304` names a rule finding's visual "clusteredBarChart at 12,92 296x320", and
  `plan-lint.mjs` checkSummary puts it in each worth-a-look line on the approval page and in plan_layout's answer.
- **0.2.9-writer-S18** true (no rule in report-rules.js or check-report.mjs reads reportExtensions.json's names). But no
  measurement in DESKTOP-TESTS.md or RULES-POWERBI.md says what Desktop does with a duplicate measure name (P3's
  "Something's wrong with one or more filters" is a laptop sweep, not recorded): not added, "For the laptop".

## Plan (tests first: each red on 3bda227, then the fix at its cause)
1. **S12** TIP_ROWS(h, axis) = floor((h - 53 - (axis ? 38 : 0)) / 22.2), its source a new SRC entry (the 6 Oct night
   section); TOOLTIP_SCROLL uses it: the value axis measured (no longer an estimate), a label size other than the
   measured 10pt an estimate; texts say 22.2 a row + 45 + 8 (+ 38). report-check.mjs's trend: TIP_ROWS(320) is 12 before
   and after. Tests: TIP_ROWS(230) 7 (was 8); a 230-high tooltip bar chart kept to a Top 8 gets the note; the source.
2. **R1-S2** inversions counts a pair only when it is against the reading order both ways: the pairwise test as now AND
   readingOrder of the same boxes puts the later stop first. So the writer's order is never a finding, and nothing is
   counted that was not before. Tests: A, T, B 0 (was 1), A, B, T 0; B above A still 1; A11Y_TAB_ORDER on that page 0;
   right to left mirrored the same.
3. **T1-S7** checkProject gives each finding `place`: the kind in words ("the bar chart", custom and unknown types "a
   visual") and its third of the page ("top left", "middle", "bottom right"), never a title or a text (R5); `visual`
   stays as it is (plan-lint finds the flags by its "at x,y wxh"). checkSummary's line uses place. Tests: the place of a
   rule and a lint finding; the worth-a-look lines carry no "at x,y wxh"; the flags still found.
4. **S18** not added; "For the laptop" below; the queue cell says so.
Then `npm run build:min`, the ?v= stamps of the pages that load a changed .min.js, `node scripts/csp.mjs --write`; the
suites; `npm test -- --keep-going` once; `node scripts/check-agent-memory.mjs`.

## Commits
- `6a72981` the plan; `16a2df1` the tests first (sq5 15 of 22 red on 3bda227); `11a85ab` the fixes; this note and the
  queue's four Status cells after it.

## Each item, before -> after
- **0.2.9-writer-S12** before: TOOLTIP_SCROLL counted floor((h - 46) / 22) and called the value axis and any label size
  but 8pt an estimate; 230 high held "8 rows". After: floor((h - 45 - 8 - (axis ? 38 : 0)) / 22.2), source
  `SRC.barRows` (DESKTOP-TESTS.md "2026-10-06 night, the laptop sitting", its Lessons line; RULES-POWERBI.md "Night of
  6-7 October"); 230 high holds 7; the axis measured (38), a label size other than the measured 10pt an estimate.
  `scripts/tests/report-check.mjs`'s trend: TIP_ROWS(320) 12 before and after. Test S12-1..8.
- **R1-S2** before: A, T (tall, right), B (below A) in the writer's order counted 1 pair (A11Y_TAB_ORDER warning on a
  page DataArcus wrote). After: a pair counts only when readingOrder also puts it the other way: 0; A, B, T 0; a stop
  wholly below met first still counts (B, A, T 1); right to left the same. Never counts more than before. The twin's
  language button placement (twin-copy.mjs, the least inversions) uses it: every twin suite unchanged. Test R2-1..6.
- **T1-S7** before: "Page 2: clusteredBarChart at 0,5 320x230: about 8 rows fit..." (and a title in quotes on the lint's
  lines). After: "Page 2: the bar chart, in the middle of the page: ...": the kind in words (custom or unknown: "a
  visual") and the third of the page, never a title or text (R5). `visual` (type and box) kept: plan-lint's preview flags
  match it. check_report's own lint answer unchanged (places only on the check before a write). Test T7-1..7.
- **0.2.9-writer-S18** not added: Microsoft documents it (DAX syntax, "Naming requirements": "Each measure name must be
  unique within a model", names case-insensitive), but no Desktop measurement in DESKTOP-TESTS.md or RULES-POWERBI.md
  says what Desktop shows, so check_report could not say what it checked against Desktop. Status OWNER (laptop).

## Suites
- Before (3bda227): `npm test -- --keep-going` 79 suites passed, 5603 checks.
- After, the full run on 11a85ab: 79 of 80 passed, 5625 checks; `mcp` (test.mjs) failed 1 check: part 7 of check_report's
  rules pinned round 0's formula (a 112-high tooltip chart "3 rows"). Changed with its cause beside it (below), as
  the item asks: by the measurement in force 112 holds 2. Then `node test.mjs` alone: PASS 1591 checks (the other 79 suites passed in the full run; the full run was not repeated).
- `node scripts/test-site-config.mjs` PASS, `node scripts/ar-pages.mjs` PASS (38), `node scripts/csp.mjs` 139 pages,
  `node scripts/check-min.mjs` 74 match, stamps new; website `scripts/tests/run-all.mjs` all 20 passed (11,373 checks).

## CHANGELOG line
- check_report counts a tooltip bar chart's rows by the measured row height, no longer flags the Tab order DataArcus
  writes beside a tall visual, and the check before a write names each item worth a look by its place on the page.

## Decisions I made
- S12: the item's number (22.2 a row + 45 + 8) and the same night's 38 for the value axis, so an axis on is measured, not
  an estimate; "measured at 10pt" replaces "8pt" (the 22.2 was the theme's 10pt). The tooltip lab's 27 a bar + 40 at 8pt
  (TIP_ROWS_6) left to its own use: which one a tooltip at 8pt follows is a laptop question (below).
- R1-S2: the checker follows the writer, not the other way: changing readingOrder would change the tab order every
  report and twin writes; counting only pairs against both orders accepts both readings of that layout and adds none.
- T1-S7: thirds of the page in English words (the item lines are English, as their what and fix); the place goes only
  into the check before a write (its lines are for a person); `visual` kept for plan-lint and Claude.
- S18: by the brief's rule (no measurement, no rule) not added, though Microsoft documents uniqueness; status OWNER, not
  OBSOLETE (the item is true). Where it would go: group "navigation" (where the model-measure notes live), file
  `definition/reportExtensions.json`, the measure's name never quoted.
- One line outside the batch's files: `mcp/lib/plan-lint.mjs` checkSummary (it builds the worth-a-look lines).
- One older check changed, its cause beside it: `mcp/test.mjs` part 7 (TOOLTIP_SCROLL) expected round 0's
  floor((h - 46) / 22), 3 rows at 112; the item replaces that number, so the check now expects the measured 2. For the
  reviewer to confirm (the brief: no expected number changed to pass; this one is the number the item changes).

## For the laptop
1. S18: a report with two report measures of one name (different case) on two tables, and a report measure named like
   a model measure of another table: what Desktop shows (P3 saw "Something's wrong with one or more filters"; record
   it in DESKTOP-TESTS.md). Then the rule: DUPLICATE_MEASURE_NAME, warning or error by what Desktop shows.
2. A tooltip bar chart at 8pt labels: the tooltip lab (10 Oct) says 27 a bar + 40 (310 high holds about 10), the
   writer's 12-month trend chart is 320 high by 22.2 + 53: look whether all 12 months show with no scrollbar.

## Seen, not in scope
- The approval page's "problems" list (approval-window.mjs, `checkSummary`'s `problems`) still names a visual by type
  and box; only the worth-a-look lines take the place.
- The worth-a-look lines are English on an Arabic page (their what and fix too; as T1-S6 for the rows).
- `layout-check.js` lint without `titles: false` (the check before a write, plan-lint's checkFiles) still quotes a
  visual's title in `visual`; the worth-a-look lines no longer show it, but the problems list (approval page and
  plan_layout's answer) still does (R5 decided type and place for check_report only).
- Two visuals in the same third of a page get the same place words.
