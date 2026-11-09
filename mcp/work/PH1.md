# PH1 (0.3.2): the last two path compares call path-rules.mjs; tooLongSaid's example follows the platform (B-412, B-416)

## Summary
- **Approval:** the reviewer's brief "PH1" (9 Nov). Owner D-1104-12 (a library of functions, fix at the source) and D-1109-01 (paths said per platform).
- **Base:** `fix/0.3.2-ph1` from `origin/integration/0.3.2` at 0f5d0f79 (FN1J merged). Push only this branch.
- **Scope:** redesign.mjs `same` and report-build.mjs `fsInTree` call path-rules.mjs `sameOnDisk`; `tooLongSaid` example: win32 `C:\PBI`, darwin and linux `~/PBI`. New suite ph1. Not plan_layout.mjs or FN1J's files.
- **Expected checks:** new `ph1` red on 0f5d0f79 first (tooLongSaid darwin and linux, the two source checks); redesign, sp2, sp43, fn1f, wn1 and the pinning split tests unchanged counts; mutation run before and after.
- **Resume:** 2026-11-09T06:49Z: State: plan written, no code yet.

## Plan
1. redesign.mjs: import sameOnDisk, delete local `same`, message unchanged.
2. report-build.mjs fsInTree: sameOnDisk(FS.scriptDir, m.projectDir).
3. path-rules.mjs tooLongSaid: example by platform.
4. Suite test-0.3.2-ph1.mjs, registered in tests.json.

## Risky changes
- redesign.mjs compare: when either path is not on disk, sameOnDisk falls back to samePath, which ignores case on win32 and darwin; the old fallback compared exact strings.
