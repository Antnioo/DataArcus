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
- **Resume:** plan pushed; next the tests, then the fixes.

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
