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
- **Got:** tb2 17 checks, red on cbdbbc7 (= 694aa8a's code) first: 15 of 17 (B1 and B13 are guards, green there by design)
  -> 17 PASS. checker area the same numbers as on cbdbbc7: check 31, test-0.3.1-checker 23, arabic-lens 31, p3a 21 (P2
  changed on purpose, below), validator-gap 5, sq5 22. Mutation: 78 -> 79 mutants (C-opened, guarded by tb2 and p3a).
- MUTATION_LINE
- FULL_RUN_LINE
- **Resume:** done after the full run and CI; then the reviewer.

## Before -> after
- check_report on a report with only the ten measured codes (the made-up fixture, B14): "10 findings can break the
  report in Power BI Desktop: fix these first." -> "Nothing found that Power BI Desktop is known to refuse (...). 10
  findings of Microsoft's validator are file shapes it flags that Power BI Desktop 2.159 opened reports with, with no
  error (measured 28 Oct 2026); saving the report in Desktop may rewrite them; look at the parts in Desktop."
  `impact.kinds.openedInDesktop` { count, means, measured: each code -> its count and the measurement }.
- The same with an unmeasured code (PBIR_VISUAL_TYPE_UNKNOWN): "11 findings can break" -> "1 finding can break ..." and
  the ten said apart.
- The plan's check (checkArtifact, read by create_report's `check.validator` and plan_layout's exactCheck): kinds
  { canBreak 10 } -> { canBreak 0, openedInDesktop 10 }, one table (impactOf), the same counts as check_report (B16).
- On the owner's six reports (by the laptop's counts, not rerun here): can-break 67, 21, 4, 5, 1, 8 -> 0 from these
  ten codes (every can-break the laptop counted is one of the ten: 76+14+6+3+2+1+1+1+1+1 = 106 = 67+21+4+5+1+8).

## What changed where
- `lib/check-report.mjs`: `DESKTOP_OPENED` (the ten codes, each with its count and the measurement); `impactOf`: one
  line first in the validator branch; `IMPACT.openedInDesktop`; `openedLine`; impactSummary and validatorVerdict (EN, AR)
  say it; `kinds.openedInDesktop.measured`; `counts.byImpact.openedInDesktop`; tellUser names it.
- `lib/artifact.mjs` (the plan's kinds), `tools/create_report.mjs` (`check.validator.openedInDesktop`).
- `scripts/tests/DESKTOP-TESTS.md`: the 2026-10-28 section the evidence points to. `TOOLS.md`, `PRIVACY.md`,
  `plans/CHECK-REPORT.md`: five kinds. `CHANGELOG.md`: one line, the end of [Unreleased].
- Tests: `test-0.3.1-tb2.mjs` (new, checker), `test-0.3.1-p3a.mjs` P2 (on purpose: it asserted the slicer floor stays
  canBreak; now openedInDesktop, same count 21), `test-0.3.1-mutation.mjs` (C-opened).

## CHANGELOG line
"**\"Can break\" only for what was not seen to open:** check_report no longer says that ten kinds of finding of
Microsoft's validator \"can break the report in Power BI Desktop\" (...): Power BI Desktop opened hand-built reports
with each of them, with no error. ..." (`mcp/CHANGELOG.md`, the last line of [Unreleased]). Its primary source: the
laptop part 4 results (engine 6caf204, RESULTS.md C1, C5, C6), recorded in DESKTOP-TESTS.md 2026-10-28.

## Decisions I made
- A fifth kind, `openedInDesktop`, not `mayLook`: mayLook says Desktop was measured to draw the part; this measurement
  is of the report opening (no error banner), not of each part drawing, and five of the ten are validator errors
  about file shape, not looks. Not `desktopOpens` either: that kind also says Fabric would refuse, not measured here.
- Every code moves whatever its severity (errors and warnings alike): the measurement is per code, and each code has
  one severity in the validator.
- PBIR_SLICER_HEIGHT_BELOW_FLOOR: this measurement wins over P3A. P3A's reason was the validator's own text ("the
  selector will be clipped") and that our reports never get it, not a Desktop observation; part 4 saw two in reports
  that opened with no error. The sentence still says to look at the part (it may look clipped).
- PBIR_ROLE_REQUIRED_MISSING moves, but its evidence also names the 11 Oct proof (0.2.9-custom-visuals.md, Z1: a donut
  written with no value drew empty): the report opens, the visual may show nothing. The kind's sentence says a part
  may still not draw as meant.
- Unmeasured codes stay canBreak (PBIR_VISUAL_TYPE_UNKNOWN, the drillthrough filter codes, schema errors): B13.
- The power-bi-mcp pages (EN and AR) say nothing about "can break" (they name check_report and Microsoft's validator
  only): every sentence stays true, nothing changed there, so no build:min, ?v= stamp or ar-pages write was needed
  (`node scripts/ar-pages.mjs` and `test-site-config.mjs` PASS).
- I could not read the engine repo's RESULTS.md from here: the counts are the reviewer's brief's, cited to it.

## For the owner
- none

## Risky changes
- What an answer returns: check_report's `impact.kinds` and `counts.byImpact` gain `openedInDesktop` (a fifth kind);
  ten validator codes move there from `canBreak`, each with its measurement in `kinds.openedInDesktop.measured`.
  create_report's `check.validator` gains `openedInDesktop`; its summary and plan_layout's sayInPlan say the new
  sentence instead of "can break" for them. A plan with one of these validator errors still has the error counted as
  before (the plan's blocking is unchanged: it reads errors, not kinds). Numbers and codes only, never a name or value.

## For the laptop
- On one of the six reports, check_report: the ten codes under openedInDesktop, "can break" 0 from them; open one visual
  with PBIR_ROLE_REQUIRED_MISSING and one slicer with PBIR_SLICER_HEIGHT_BELOW_FLOOR and say what they draw.

## Seen, not in scope
- create_report's measured-rule summary and check_report's `dataarcusRule` count are worded differently (P3A's Seen 1,
  still open).

## Lessons for the reviewer
- The ten codes were reproduced on a made-up fixture in one pass from the validator's own source
  (`node_modules/@microsoft/powerbi-report-authoring-cli/dist/index.js`, each `collector.error/warning`): a brief's codes
  are cheap to rebuild there, so a red test needs no copy of a real report.
- The 11 Oct Z1 proof (an empty visual for a missing role) was only in a job note; worth a line in DESKTOP-TESTS.md, so a
  future move of a code finds it where the evidence lives (done here, in the 2026-10-28 section).
