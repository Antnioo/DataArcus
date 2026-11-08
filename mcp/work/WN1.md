# WN1 (0.3.2): the Windows findings before the laptop session (Codex windows-readiness-032, B-407)

## Summary
- **Approval:** the reviewer's brief "WN1" (8 Nov), from Codex's windows-readiness-032 review (B-407) of integration/0.3.2
  at 5cf96356: F01, F02, F03, F05. The owner D-1104-12 (one job in one shared place), D-1104-19 (Linux + Windows CI).
- **Base:** `fix/0.3.2-wn1` from `origin/integration/0.3.2` at 3e7580d9 (FN1I merged). Push only this branch.
- **Scope:** new module `mcp/lib/path-rules.mjs` (outsideRel, within, caseless, sameName, samePath, sameOnDisk, pathMax,
  longestPath, tooLongSaid) and its MODULES.md row. F01: all 13 copies of the containment test call it (model.mjs,
  write-io.mjs x2, read-report.mjs x2, plain-words.mjs x3, check-report.mjs x3, artifact.mjs, sample-counts.mjs; the
  last 4 files were not in the brief's list). F02: read-report.mjs existingTheme (opened, rank) and model.mjs's
  win32-only compare. F03: approval-window.mjs (launchers, the watch, the shortcut), approve_plan.mjs. F05:
  plan_layout.mjs and create_arabic_twin.mjs (no plan id), files.mjs writeTree (writes nothing).
- **Commits:** plan bc9b9b7f; code, tests, CHANGELOG, WORK.md 45e7e928; note 328b2ceb; the write gate's list 1b418f2e; the shorter refusal and platform-paths' Windows branch (next commit).
- **Expected checks:** wn1 33 checks, red on 3e7580d9 first (27 of 33 failed there; the 6 that passed are the
  escape still refused, F02 on a case-sensitive disk, R3's "shortcut removed" (vacuous there), R4, L2's plan within the
  limit). Every pinned suite green with its base count, no fixture re-recorded.
- **Got (local, Linux):** see "Tests before -> after" below.
- **Resume:** 2026-11-08T20:37Z: code pushed; area runs, then CI on the branch.

## Tests before -> after
- new: `wn1` 0 -> 33 (red on 3e7580d9 first: "FAIL  wn1  27 of 33 checks", path-rules.mjs moved aside).
- `mutation` (the security mutants): 91 -> 98 mutants (dry run "98 mutants checked, 0 not found once"); D-within
  retargeted to path-rules.mjs (its old line is gone), new D-within-prefix, D-within-parent, D-within-drive,
  D-within-winsep, D-samename, D-pathmax, A-shortcut: "PASS  mutation  23 checks (8 mutants, all killed)".
- MCP split suites (the brief's list), all PASS with the same counts: sp1 11, sp10 113, sp11 21, sp12 21, sp13 12,
  sp14 20, sp15 19, sp19 13, sp2 10, sp20 7, sp21 11, sp22 24, sp23 29, sp26 26, sp27 25, sp28 17, sp29 21, sp3 11,
  sp30 21, sp37 11, sp38 50, sp39 96, sp4 5, sp40 28, sp41 24, sp42 22, sp43 21, sp44 23, sp5 12, sp7 11, sp8 19, sp9 16.
- Website split suites: "All 15 passed" (sp5 3, sp6 4, sp7 3, sp8 3, sp9 3, sp13 3, sp14 9, sp15 3, sp24 23, sp27 3,
  sp29 8, sp31 17, sp32 39, sp34 18, sp35 38).
- Guards: approval 32, approval-hardening 22, test-platform-paths 30, v029d 22, audit6 47, r4-write-safety 47,
  b153 37, r4a 32 (all PASS). Lint 0; modules 1198 (218 rows), result-lines 228, contracts 717, changelog-words,
  agent-memory PASS.
- Areas (`npm test -- <area> --keep-going`, on 45e7e928): core "12 suites passed" (mutation "95 mutants, all killed";
  3 equivalent not run), checker "12 suites passed", model "31 suites passed"; safety "1 of 24 suites failed":
  test-0.3.1-write-gate W1 (the shortcut's 4 temp-folder writes not listed): listed with why in 1b418f2e, "PASS
  test-0.3.1-write-gate  7 checks"; safety run again on 1b418f2e: "24 suites passed (safety)". approval x3: 32, 32, 32.

## Changed on purpose
- `test-0.3.2-sp42.mjs` P2: `within` is "defined in model.mjs" OR imported there from `./path-rules.mjs` (it moved to
  the one shared place, D-1104-12); still one check, the same count (22).
- `test-0.3.2-sp44.mjs` V2: approval-window.mjs keeps `launchers` (was `browserCommand`: the list of programs, F03);
  the same check and count (23). No fixture changed: `state()` adds `shortcut` only when one was written.

- `test-platform-paths.mjs` "long" (0.3.1 P1: a project path over 300 characters, written on every system): on Windows
  plan_layout and create_arabic_twin now refuse it at plan time with the plain message and nothing is written (the
  same 3 checks, their Windows branch reversed: CI run 42522986775 was red there, "3 of 30"); Linux and macOS unchanged.
  Source: Microsoft Learn, "Power BI Desktop projects", Considerations and limitations 4: "the maximum path length for
  project files is limited to 260 characters by default on Windows ... resulting in errors during save operations".
  The Windows branch was run here with the limit forced to 259 on Linux: "PASS  test-platform-paths  30 checks".
- `test-0.3.2-hr2.mjs` G1 (the answer at most 38,000): on Windows its 171-character folder makes the project too deep,
  so the plan now carries the refusal; the first message (with the folder's whole path) gave 38,167 (CI run
  42522986775). The message no longer repeats the folder: with it forced here, 37,994 on Linux; on Windows 38,167 -
  564 (the old message) + 225 = about 37,830.

## CHANGELOG line
- "**Four fixes for Windows:** a project in a folder whose name begins with two dots ... instead of failing half-way
  after the approval." Source of "260-character path limit": Microsoft's "Maximum Path Length Limitation" (MAX_PATH is
  260 including the closing NUL, so 259 characters), the value in path-rules.mjs pathMax.

## Decisions I made
- One module, `path-rules.mjs`, for F01, F02 and F05 (all three are "what a path is"); the functions take the path
  module and platform, so the Windows answers are proved on Linux with path.win32 (the CI's Windows run proves the rest).
- F01 rule: outside = exactly '..', or '..' plus a separator (both separators on Windows, '/' only on POSIX, where a
  backslash is a letter of a name), or absolute. Also applied to the copies the brief did not list (check-report.mjs
  x3, artifact.mjs, sample-counts.mjs) and to read-report.mjs:265 (a report folder named "..X.Report" was dropped).
- F02: `sameOnDisk` compares real paths (Windows and macOS return the on-disk case; Linux keeps two names two folders),
  else `samePath` by platform; the name rank uses `sameName`. model.mjs's own win32-only copy now calls it too
  (macOS gains the case-insensitive compare).
- F03: the page is watched for 10 s (DATAARCUS_SEEN_WAIT_MS can only shorten it), cut short when the launcher exits
  with an error; on Windows explorer.exe with the link is tried next (its exit code is ignored: explorer returns 1 on
  success); then a shortcut. How the person gets it: an HTML file "DataArcus approval.html" (a meta refresh and a link)
  in a new folder of the OS temp folder (mode 700 / 600), its folder shown in a window on Windows; the answer names the
  file and folder, never the link. Why HTML over a .url file: any browser on any system opens it, and it can be dragged
  into a browser that is not the default. It is removed when the plan is decided, its window closed, or the server ends.
  approve_plan answers as soon as the shortcut is written (window "not seen"), not after its 45 s wait. The approval
  page's own checks (secret, Host, Origin) are unchanged: sp44 and approval pass with the same counts.
- F05: limit 259 on Windows, 1023 macOS, 4095 others (DATAARCUS_TEST_PATH_MAX can only lower it, for the tests).
  Checked at plan time on create_report's exact files (plan_layout) and the twin's files; writeTree refuses it before
  anything is written for every writer (the redesign and the native copy get only this write-time check).
- No new contract-ledger family: the rule now has one place (path-rules.mjs); a family can be added when the reviewer wants
  it probed.

## For the owner
- none (approve_plan answers in English only, so no Arabic draft is needed for F03's message).

## Risky changes
- The containment rule (security policy, file writing): a folder whose name begins with ".." is now inside; every
  escape is still refused (wn1 P2-P4, platform-paths, v029d, audit6, write-safety, the D-within mutants).
- The approval step / processes: on Windows a second program (explorer.exe) may be started with the approval link
  when the first did not open the page; a file holding the one-time link is written to the OS temp folder (this user
  only) and removed after the decision. Accepted risk, as already written in approval-window.mjs: another program of
  the person's computer (an AI app's command tool) can read it, as it can read the browser's history today.
- A test that guards writes: `test-0.3.1-write-gate.mjs` lists approval-window.mjs's fs.mkdtempSync, chmodSync,
  writeFileSync and rmSync (the shortcut, OS temp folder only) and its spawn's why names explorer.exe (F03).
- What an answer returns: approve_plan's "waiting" answer gains window "not seen" and `shortcut: { file, folder }` in
  that case only; plan_layout and create_arabic_twin refuse a plan over the path limit.

## For the laptop
- On Windows: a project in "C:\Smoke\..draft" read and written; a .pbip naming "demo.Report" beside "Demo.Report";
  approve_plan with a broken default browser (the shortcut appears, its folder opens, the page approves).

## Seen, not in scope
- redesign.mjs `same` (realpath compare) and report-build.mjs's `fsInTree` (path.resolve compare) are path compares
  that could call sameOnDisk; both compare paths built from the same string today, so no case can differ.
- check-redact.mjs `rel` and plain-words' path forms are not containment tests (left as they are).

## Lessons for the reviewer
- F05 reversed a 0.3.1 promise pinned by test-platform-paths (a 300-character project written on Windows); only the
  Windows CI showed it. A rule that refuses on one platform: grep the tests for long paths before the first CI run.
- A rename of a pinned name (browserCommand) and a moved definition (within) each broke a split guard (sp44 V2,
  sp42 P2): the split guards pin names, so a fix in the shared place moves them.
- state() gaining a key with a null value moved 5 sp44 recordings; a key only when it has a value kept them.
