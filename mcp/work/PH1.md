# PH1 (0.3.2): the last two path compares call path-rules.mjs; tooLongSaid's example follows the platform (B-412, B-416)

## Summary
- **Approval:** the reviewer's brief "PH1" (9 Nov). Owner D-1104-12 (a library of functions, fix at the source) and D-1109-01 (paths said per platform).
- **Base:** `fix/0.3.2-ph1` from `origin/integration/0.3.2` at 0f5d0f79 (FN1J merged). Push only this branch.
- **Scope:** redesign.mjs `same` and report-build.mjs `fsInTree` call path-rules.mjs `sameOnDisk`; `tooLongSaid` example: win32 `C:\PBI`, darwin and linux `~/PBI`. New suite ph1. Not plan_layout.mjs or FN1J's files.
- **Expected checks:** new `ph1` red on 0f5d0f79 first (tooLongSaid darwin and linux, the two source checks); redesign, sp2, sp43, fn1f, wn1 and the pinning split tests unchanged counts; mutation run before and after.
- **Resume:** 2026-11-09T07:03Z: State: code and note done, area run and CI next.

## Plan
1. redesign.mjs: import sameOnDisk, delete local `same`, message unchanged.
2. report-build.mjs fsInTree: sameOnDisk(FS.scriptDir, m.projectDir).
3. path-rules.mjs tooLongSaid: example by platform.
4. Suite test-0.3.2-ph1.mjs, registered in tests.json.

## Risky changes
- redesign.mjs compare: when either path is not on disk, sameOnDisk falls back to samePath, which ignores case on win32 and darwin; the old fallback compared exact strings.

## Tests before -> after
- new `ph1` 0 -> 9 checks. Red on 0f5d0f79 first: "FAIL  ph1  5 of 9 checks" (T2, T3, T4 tooLongSaid darwin/linux; S1, S2 the local compares). Green after: "PASS  ph1  9 checks".
- What it can and cannot prove: T1-T4 are string logic (path.win32 / path.posix), so the Windows words are proved on Linux; D1 uses a real link (junction/symlink) on this system only. The Windows and macOS disk behaviour of sameOnDisk is pinned by wn1/CI, not here.
- Same counts as before: redesign 50, sp2 10, sp43 21, fn1f 6, wn1 38, sp1 11, sp19 13, sp23 29, sp38 50, sp42 22, sp44 23, pk1 50. No split test's allow list needed the new import; no fixture re-recorded.
- `mutation`: base 0f5d0f79 "PASS  mutation  244 checks (97 mutants, all killed, 45 guard suites, 228s...)"; after: same line (369s). No anchor moved.
- lint 0 (removed the now unused `fs` import in redesign.mjs); agent-memory, changelog-words, test-contracts 14 PASS. No ledger place names the two lines.

## Changed on purpose
- redesign.mjs: `same` -> `sameOnDisk(want, model.folder)`; report-build.mjs fsInTree -> `sameOnDisk(FS.scriptDir, m.projectDir)`; tooLongSaid: `~/PBI` on darwin and linux. Nothing else.

## MODULES.md row for the reviewer (path-rules.mjs, callers gain two)
Callers: `model.mjs`, `write-io.mjs`, `read-report.mjs`, `plain-words.mjs`, `check-report.mjs`, `artifact.mjs`, `sample-counts.mjs`, `files.mjs` (writeTree), `plan_layout.mjs`, `create_arabic_twin.mjs`, `redesign.mjs` (sameOnDisk), `report-build.mjs` (sameOnDisk). Rest of the row unchanged.

## CHANGELOG line
Folder compares and the "shorter folder" example follow the system (see mcp/CHANGELOG.md [Unreleased] 0.3.2).

## Decisions I made
- The behaviour test for redesign/report-build is a source check plus the existing suites (modelProblem is not exported); no export added.
- tooLongSaid test uses 1100 and 4100 character names, since the darwin and linux limits are 1023 and 4095.

## For the owner
none

## Risky changes
- redesign.mjs model compare: when either path is not on disk, sameOnDisk falls back to samePath, which ignores case on win32 and darwin; the old fallback compared exact strings. report-build.mjs fsInTree: same fallback difference (old: path.resolve exact). No security policy, approval, write or answer-shape change; the tooLongSaid sentence differs only in its example folder on macOS and Linux.

## For the laptop
none

## Seen, not in scope
- none beyond the brief (no other compare looked at).

## Lessons for the reviewer
- A fresh clone needs `npm ci` in mcp/ and in the repo root before mutation and lint; without it mutation reports every baseline failing ("97 not killed").
- mutation takes 228-369s: run it in the background, not in the 120s foreground.
