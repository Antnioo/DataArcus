# FW1 (0.3.3): the folder window: "opened" only when certain, and a test-only folder opener (B-431 b and c)

## Summary
- **Approval:** the reviewer's brief "FW1" (10 Nov), from the owner's 0.3.2 laptop sitting (9 Nov, F03); D-1109-01 (no path
  on Windows, the folder window opens), D-1104-12 (one shared place), D-1109-07 (no silent Arabic).
- **Base:** `fix/0.3.3-fw1` from `origin/integration/0.3.3` at 8f5624e6. Push only this branch.
- **Scope:** mcp/lib/approval-window.mjs (folderOpener, notSeenAnswer, one shared wording), its test (new
  mcp/test-0.3.3-fw1.mjs), the DATAARCUS_BROWSER comment block (its doc line), mcp/test-0.3.2-wn1.mjs R5/R6 wording only.
- **Expected checks:** fw1 13 (red on 7b6cf9a0 first: 9 of 13 failed), wn1 38 (was 38; 3 wording lines changed on purpose), sp23 29, sp44 23, approval 32. Plan was: fw1 new, red on 8f5624e6 first; wn1 33 (3 wording checks changed on purpose); sp23 29, sp44 23, approval 32.
- **Resume:** 2026-11-10T02:11Z: DONE. CI green: https://github.com/Antnioo/DataArcus/actions/runs/42739386706 on 04698e92 (integration merged once; sp24 green there). The reviewer merges.

## Measured (step 1)
- Says the folder window opened: approval-window.mjs:144 (`folderWindow: 'opened'`), :145 (sayFirst "opened a folder
  window"), :85 (showFolder returns true when the program only started); read at approve_plan.mjs:57. No Arabic copy.
- Readers of DATAARCUS_BROWSER: approval-window.mjs:28 (launchers), :81 (folderOpener, the folder too); tests set it:
  test-env.mjs:5, wn1, approval, lab/custom-visuals-run.mjs.
- Plan: starting explorer.exe proves no window; the answer says "asked Windows to open" (folderWindow: 'asked'); one
  constant pair in approval-window.mjs; DATAARCUS_FOLDER_OPENER (same JSON/path format) wins for the folder only,
  DATAARCUS_BROWSER no longer opens the folder.

## For the owner
none (no Arabic text)

## Before -> after
- Windows, page not seen: `folderWindow: "opened"` and "DataArcus opened a folder window" -> `"asked"` and "DataArcus asked
  Windows to open a folder window ... (Windows may not have shown it: ask the user whether they see it)". Failure wording unchanged.
- DATAARCUS_BROWSER no longer opens the folder; DATAARCUS_FOLDER_OPENER does (test-only, same format, read only when set).
  Both formats are parsed by one function, ownProgram (D-1104-12). Documented in approval-window.mjs's comments (launchers, folderOpener).

## Tests before -> after
- fw1 0 -> 13 (red on 7b6cf9a0 first: "FAIL  fw1  9 of 13 checks"). wn1 38 -> 38 (R5/R6 now expect "asked"; R6 sets DATAARCUS_FOLDER_OPENER).
- sp23 29, sp44 23, approval 32, approval-complete 68, safety area 26 suites passed; lint 0; result-lines, changelog-words, agent-memory PASS.

## Changed on purpose
- test-0.3.2-wn1.mjs R5 (x1), R6 (x1): `folderWindow === 'opened'` -> `'asked'`; R6's server also gets DATAARCUS_FOLDER_OPENER. Same count.

## CHANGELOG line
In mcp/CHANGELOG.md [Unreleased]: the Windows answer says DataArcus asked Windows to open the folder window.

## Decisions I made
- Never "opened" for the folder window: explorer.exe starting is the best signal there is, so the word is always "asked".

## Risky changes
- approve_plan's Windows not-seen answer: key `folderWindow` value 'opened' -> 'asked', and the sayFirst sentence. Why: B-431 b.

## For the laptop
Check on Windows that the answer says "asked Windows to open" and that the folder window shows.

## Seen, not in scope
- (earlier red, gone after the merge of integration, which fixed it) website sp24 D8/D18 (ramadan.zip html/md download 4 bytes shorter than recorded) is red on CI both times; not in FW1's files (mcp only); passes no output locally (needs the CI browser). Likely a base/PR #121 download-lines change; not touched.
- B-431 (a), the laptop-only R3 failure: passes 38/38 here on Linux.

## Lessons for the reviewer
- The brief's line numbers (about 81) were right; the cause (explorer start = opened) was confirmed by showFolder returning true on start.
