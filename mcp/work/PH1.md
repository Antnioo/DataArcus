# PH1 (0.3.2): the last two path compares call path-rules.mjs; tooLongSaid's example follows the platform (B-412, B-416)

## Summary
- **Approval:** the reviewer's brief "PH1" (9 Nov). Owner D-1104-12 (a library of functions, fix at the source) and D-1109-01 (paths said per platform).
- **Base:** `fix/0.3.2-ph1` from `origin/integration/0.3.2` at 0f5d0f79 (FN1J merged). Push only this branch.
- **Scope:** redesign.mjs `same` and report-build.mjs `fsInTree` call path-rules.mjs `sameOnDisk`; `tooLongSaid` example: win32 `C:\PBI`, darwin and linux `~/PBI`. New suite ph1. Not plan_layout.mjs or FN1J's files.
- **Expected checks:** new `ph1` red on 0f5d0f79 first (tooLongSaid darwin and linux, the two source checks); redesign, sp2, sp43, fn1f, wn1 and the pinning split tests unchanged counts; mutation run before and after.
- **CI:** CI green: https://github.com/Antnioo/DataArcus/actions/runs/42582529670 on b43b3f51 (Linux, Windows, website; macOS skipped on a branch run). Earlier runs: 42578343323 red (Windows fn1j G12, fixed in b43b3f51); 42579777733 red (website theme-generator "steps bar did not open" on a page this job does not touch, the same flake WN1 saw; green on the fresh run).
- **Resume:** 2026-11-09T08:10Z: State: DONE (CI green on b43b3f51); the reviewer merges.

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
- CI run 42578343323: only Windows fn1j G12 red (fixed above).
- Same counts as before: redesign 50, sp2 10, sp43 21, fn1f 6, wn1 38, sp1 11, sp19 13, sp23 29, sp38 50, sp42 22, sp44 23, pk1 50. No split test's allow list needed the new import; no fixture re-recorded.
- `mutation`: base 0f5d0f79 "PASS  mutation  244 checks (97 mutants, all killed, 45 guard suites, 228s...)"; after: same line (369s). No anchor moved.
- lint 0 (removed the now unused `fs` import in redesign.mjs); agent-memory, changelog-words, test-contracts 14 PASS. No ledger place names the two lines.

## Changed on purpose
- redesign.mjs: `same` -> `sameOnDisk(want, model.folder)`; report-build.mjs fsInTree -> `sameOnDisk(FS.scriptDir, m.projectDir)`; tooLongSaid: `~/PBI` on darwin and linux. Nothing else.

- `fixtures/fn1j-pins.json`, only "A1 G12 the path limit" (the reviewer lifted the stay-out for G12): base length 9248, sha256 224c1fb8...eaa1 (text `(for example C:/PBI)`, the separator is normalised) -> length 9247, sha256 98c36a3f...f522 (text `(for example ~/PBI)`). Found with FN1J_DUMP on 0f5d0f79 and on this branch; re-recorded with FN1J_RECORD=1, and `git diff` shows that one pin moved, no other case.

- CI run 42578343323 red on Windows only: fn1j G12 (Windows keeps `C:\PBI`, so one Linux-recorded pin cannot serve both). `test-0.3.2-fn1j.mjs` `norm` now also replaces `(for example C:/PBI)` and `(for example ~/PBI)` with `(for example <a short folder>)` (one line, beside the other platform normalisations; ph1 pins each platform's example), and G12 was re-recorded again: length 9247 -> 9258, sha256 15eceb2f...f01b; the fixture's `about` names the new normalisation. The diff shows only that pin and `about` moved.

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
