# FW1 (0.3.3): the folder window: "opened" only when certain, and a test-only folder opener (B-431 b and c)

## Summary
- **Approval:** the reviewer's brief "FW1" (10 Nov), from the owner's 0.3.2 laptop sitting (9 Nov, F03); D-1109-01 (no path
  on Windows, the folder window opens), D-1104-12 (one shared place), D-1109-07 (no silent Arabic).
- **Base:** `fix/0.3.3-fw1` from `origin/integration/0.3.3` at 8f5624e6. Push only this branch.
- **Scope:** mcp/lib/approval-window.mjs (folderOpener, notSeenAnswer, one shared wording), its test (new
  mcp/test-0.3.3-fw1.mjs), the DATAARCUS_BROWSER comment block (its doc line), mcp/test-0.3.2-wn1.mjs R5/R6 wording only.
- **Expected checks:** fw1 new, red on 8f5624e6 first; wn1 33 (3 wording checks changed on purpose); sp23 29, sp44 23, approval 32.
- **Resume:** 2026-11-10T00:06Z: plan written; next: red tests, then the fix.

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

## Risky changes
none yet
