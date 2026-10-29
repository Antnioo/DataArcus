## Summary
- **Approval:** the reviewer's brief "Go on TB2" (29 Oct): check_report says "can break the report in Power BI Desktop"
  on hand-built reports that open in Desktop and are live on dataarcus.com. The owner: D-1029-01 (29 Oct, "Fix the 4 twin
  bugs (Recommended)": honest wording in 0.3.1), D-1027-13 (the release bar), public claims true.
- **Source of the measurement:** laptop part 4 (engine `lab/rc031-part4` 6caf204, `business/beta/rc031-part4/RESULTS.md`,
  blocks C1, C5, C6; Power BI Desktop 2.159; rc.3 = integration 694aa8a7), as the reviewer's brief relays it: on the
  owner's 6 public dashboards check_report said can-break 67, 21, 4, 5, 1, 8, and each report opened in Desktop with no
  error banner (C5). Per code: PBIR_FORMATTING_PROP_NESTED 76, PBIR_FILTER_NAME_DUPLICATE_GLOBAL 14,
  PBIR_BOOKMARK_ACTION_TARGET_MISSING 6, PBIR_ROLE_REQUIRED_MISSING 3, PBIR_SLICER_HEIGHT_BELOW_FLOOR 2,
  PBIR_ROLE_MAX_EXCEEDED 1, PBIR_SCATTER_NO_GROUPING 1, PBIR_DRILLTHROUGH_BACK_BUTTON_MISSING 1,
  PBIR_VISUAL_TYPE_DEPRECATED 1, PBIR_THEME_VISUAL_UNKNOWN 1.
- **Scope:** `mcp/lib/check-report.mjs` (a fifth kind, one table), `mcp/lib/artifact.mjs` (the plan's count of kinds),
  `mcp/tools/create_report.mjs` (its check carries the kind), `scripts/tests/DESKTOP-TESTS.md` (the measurement
  recorded where every kind's evidence points), `mcp/TOOLS.md`, `mcp/PRIVACY.md`, `mcp/plans/CHECK-REPORT.md`,
  `mcp/CHANGELOG.md` (end of [Unreleased]). The power-bi-mcp pages (EN, AR): checked; changed only if a sentence is untrue.
  Not TB1's files (twin-*.mjs, report-mirror.js, create_arabic_twin.mjs).
- **Base:** `fix/0.3.1-tb2` from `origin/integration/0.3.1` (694aa8a). Push only this branch.
- **Plan:** (1) a new kind `openedInDesktop`: a validator code (error or warning) measured in reports that opened in
  Desktop, `DESKTOP_OPENED` (code -> its count, Desktop version, date, "opened with no error"); its sentence:
  "Microsoft's validator flags this file shape; Power BI Desktop 2.159 opened reports with it with no error (28 Oct 2026);
  saving the report in Desktop may rewrite it." Unmeasured codes stay canBreak (PBIR_VISUAL_TYPE_UNKNOWN, schema errors).
  (2) impactOf stays the one table: the plan's check (artifact.mjs) and create_report's check count the same kinds;
  validatorVerdict says it in EN and AR. (3) the docs, then the CHANGELOG line.
- **Expected checks:** a new suite `tb2` (checker), about 20 checks, red on 694aa8a first: each of the 10 codes on a
  made-up report written for it (check_report end to end): before canBreak, after openedInDesktop with its evidence; an
  unmeasured code (PBIR_VISUAL_TYPE_UNKNOWN) and a schema error still canBreak; the summary no longer says "can break" for
  them; the plan's kinds equal check_report's for the same files. Changed on purpose: p3a 21 = 21 (P2 expects
  PBIR_SLICER_HEIGHT_BELOW_FLOOR as openedInDesktop now); every other checker suite the same numbers (said per test if
  one moves); mutation: one mutant more (the new line, guarded by tb2). Suites: the base's 123 + 1 = 124.
- **Got:** (after the work)
- **Resume:** step 1.
