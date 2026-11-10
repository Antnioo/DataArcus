# AT1 (0.3.3): two approved Arabic texts (B-429, B-449)

## Summary
- **Approval:** the owner, 10 Nov, D-1110-07 "Yes to B-429 wording and LG2's 3 Arabic drafts". D-1109-07, D-1027-03/04 bind any Arabic text; the approved lines ship byte for byte.
- **Base:** `fix/0.3.3-at1` from `origin/integration/0.3.3` at 00ed5d63, integration merged in (31f35e4a, LG2 and MH1 included). Push only this branch; never merge, no PR.
- **Scope:** `mcp/lib/arabic-names.mjs`, `mcp/lib/plain-words.mjs`, `mcp/lib/read-words.mjs`, `mcp/lib/model-discovery.mjs` (the working folder on NO_MODEL_AT's error object), new `mcp/test-0.3.3-at1.mjs` + `tests.json`, the tests and 4 fixtures that pin the old words, `CHANGELOG.md`, `WORK.md`, this note.
- **Expected checks:** `node scripts/check-modules.mjs --strict` (PASS 1223 checks); area run arabic, report, core, checker (123 suites passed); lint exit 0; CI.
- **State:** built and pushed; CI line below.
- **Resume:** only the CI result line; nothing else is open.

## Red first
- test-0.3.3-at1 (22 checks) FAIL on 00ed5d63 (code stashed, test kept), PASS after the change.

## Before -> after
- Title template (one source, lib/arabic-names.mjs; twin-texts.mjs calls draftText): «أعلى {1} من {2}: X» -> «أعلى {1} من أصل {2}: X».
- Approval header (lib/plain-words.mjs folderSaid): measured on 00ed5d63, the bracket after «مجلد العمل» held the full path, or "." (no working folder set), or the name just said («المجلد «Sales» (Sales)»). The repeated generic words did NOT reproduce here. Now the bracket is left out when it holds no name of its own; with a working folder set it keeps the path (unchanged). English unchanged.
- Three errors (lib/read-words.mjs, with lang "ar"): NO_MODEL_NAMED, NO_MODEL_AT, MANY_MODELS_NAMED answer in the approved Arabic in every reading and write tool; English unchanged. Y is the folder's own name, as the English says it.

## CHANGELOG line
Three lines in [Unreleased]: the title template, the header, the three Arabic errors.

## Arabic shipped (typed in the test from the owner's approval; the test compares the tools' answers byte for byte)
- «أعلى {1} من أصل {2}: X»
- «لا يوجد نموذج باسم "X" في مجلد العمل Y. أعطِ read_model أحد هذه المسارات، أو "." لمجلد العمل نفسه.»
- «لا يوجد شيء في "X" داخل مجلد العمل Y. أعد استدعاء الأداة بأحد هذه المسارات (نسبةً إلى مجلد العمل)، أو "." لمجلد العمل نفسه.»
- «يوجد أكثر من نموذج في مجلد العمل باسم "X": a; b. أعطِ read_model مسار النموذج الذي تقصده.»

## Changed on purpose
- 16 tests named in the brief: the old words in their own expectations (arabic-sweep, language-toggle, terminology-sheet, twin-complete, bd2, bilingual-report, checker, glass-twin, mirror-parity, sf1, twin-preview, dt1, hr1, lv1, pf1t, rc24). Two forms the first replace missed, found by the run: rc24's page regex and the composed DAX (`" من أصل "`) in rc24 and lv1.
- test-0.3.3-lg2 (LG2's, after it was on integration): its N check pinned "English until the owner approves a line" for NO_MODEL_NAMED; it now pins the approved Arabic start and end.
- sp23's fixture (fixtures/sp23-approval.json), the hostile plan's page: 8367 -> 8161 characters, the header bracket (the path) left out because that run has no working folder; with lib/plain-words.mjs reverted it passed unchanged, so only the header moved it. Only that one key changed.
- Four recorded plan-answer pins moved: sp43, fn1j, sp3, sp1 fixtures (re-recorded). Proof only the template moved them: with the template reverted they passed unchanged; every recorded length grew by exactly 8 (two «أصل »). sp3's L1 check removes the new words before comparing with the base's file hash.

## Decisions I made
- The list of models: the approved NO_MODEL_* lines say "one of these paths", so the paths follow the first sentence with no word of their own ("; …" when more than 12); with no model to list the English stays (no approved line).
- The Arabic applies on lang "ar" only (not AR4's letter rule), as the brief says.
- Brief's header cause did not reproduce (above): I fixed the no-name case, and say so.

## For the owner
- Is the empty-list case (a wrong name in a folder with no model) to get its own Arabic line? Today it answers in English.
- The laptop sitting should look at the header again: if «(مجلد العمل)» still shows, tell me the working folder's path.

## Risky changes
none (words only). The first version put `root` in NO_MODEL_AT's error data: CI's sp42 pins that data and failed, so the root now rides on the error object (`e.root`), the data are unchanged.

## For the laptop
Open an Arabic plan's approval page: the first line has no repeated bracket; check at phone width that «المجلد «Sales»» and the path are isolated.

## Seen, not in scope
- The website's own pbip tools (assets/js/pbip-tooltip.js, pbip-visuals.js) still measure room with the width probe 'أعلى 999 من 999: ' (and fixtures/hk1 copies): the real title is now 4 characters longer; not touched (website, not this job).
- mcp/work/LV1.md quotes the old «أعلى 6 من 10»; a note, left as history.
- The «لم يُكتب شيء:» batch is not approved: untouched.
- Local `npm run lint` needs `npm ci` at the repo root first.

## Measured (2026-11-10T16:51Z, all read from the runs' own output)
- at1 22 checks; lg2 29; sp3 11; sp1 11; sp43 21; fn1j 3; rc24 28; lv1 18.
- fx1 22 checks, terminology-sheet 48, bilingual-report 34: each run 3 times, all PASS.
- approval window 32, approval-hardening 22, mutation 250 (99 mutants, all killed), modules 1223.
- area run (arabic report core checker, keep-going): 123 suites passed.

## Lessons for the reviewer
- CI run 42858838168 (red) found sp23 and sp42, which are in areas I had not run (the 4 areas of the brief do not hold every suite that pins a page or a library answer): run the suites that pin the changed files' output (git grep the file name in fixtures and tests) before the first CI.
- A brief that names the old words by one spelling misses other spellings (a regex with escapes, the DAX composed form): grep the words with and without escapes.
- A pin file holds lengths: +8 per two inserted words is a quick proof only the words moved.
- The note's cap (WORK.md 3200) was already exceeded on integration (3215); I trimmed it.

CI: pending (run 42858838168 was red on sp23 and sp42; both fixed, next run below)
