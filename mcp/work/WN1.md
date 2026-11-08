# WN1 (0.3.2): the Windows findings before the laptop session (Codex windows-readiness-032, B-407)

## Summary
- **Approval:** the reviewer's brief "WN1" (8 Nov), from Codex's windows-readiness-032 review (B-407) of integration/0.3.2
  at 5cf96356: F01, F02, F03, F05. The owner D-1104-12 (one job in one shared place), D-1104-19 (Linux + Windows CI).
- **Base:** `fix/0.3.2-wn1` from `origin/integration/0.3.2` at 3e7580d9 (FN1I merged). Push only this branch.
- **Scope:** one new pure module `mcp/lib/path-rules.mjs` (outsideRel, within, samePath, sameName, pathMax,
  longestPath, tooLongSaid) and its MODULES.md row; F01 every copy of the containment test calls it (model.mjs,
  write-io.mjs x2, read-report.mjs x2, plain-words.mjs x3, check-report.mjs x3, artifact.mjs, sample-counts.mjs);
  F02 read-report.mjs existingTheme (opened, rank) and model.mjs's own win32-only compare call samePath/sameName;
  F03 approval-window.mjs: the page not seen in N seconds: a second launcher (Windows: explorer.exe), then a shortcut
  file in the OS temp folder, the link never in an answer; approve_plan.mjs says it; F05 plan_layout and
  create_arabic_twin refuse at plan time a file path over the limit, writeTree refuses it before writing anything.
- **Expected checks:** new suite `mcp/test-0.3.2-wn1.mjs` (~40 checks), red on 3e7580d9 first for each finding with
  Codex's breaking input; every existing guard suite (sp41, test-approval, the security mutants 88) unchanged and
  green; new mutants on the containment rule; no fixture re-recorded (none should move: no answer's shape changes
  except approve_plan's waiting answer when the page is never seen, a case no recorded suite reaches).
- **Resume:** plan pushed (2026-11-08T20:24Z); next: red tests, then the code.

## Plan
1. Test first (`test-0.3.2-wn1.mjs`), each red on 3e7580d9: F01 `C:\\Smoke\\..draft\\Smoke.SemanticModel` inside
   `C:\\Smoke` (path.win32, the guard is string logic) and the same through read_model on a real `..draft` folder
   on disk (any OS); every escape (`..`, `..\\x`, `D:\\x`, `\\\\server\\share`) still outside. F02 `demo.Report`
   named by the .pbip beside `Demo.Report` (samePath with platform win32; through existingTheme on darwin/win32 only).
   F03 a browser that exits 1 without opening the page: approve_plan answers with the shortcut, the link not in it,
   the shortcut's link approves. F05 a plan whose deepest file is over the limit (DATAARCUS_TEST_PATH_MAX, which can
   only lower it) gets no plan id; Windows' 259 checked on path.win32.
2. The module, then each place calls it; mutation: patterns for the new rule.
3. Area runs (core, model, report, checker), test-approval x3, sp41, mutation, lint; CI on the branch.
