## Summary
- **Approval:** owner's go 8 Nov, "yes go ahead with B-400 after 0.3.2" (D-1108-17); mix D-1109-09. Written 2026-11-09T19:32Z.
- **Base:** origin/integration/0.3.3 f3c1b7e1 (0.3.2 shipped). Branch feat/0.3.3-pq1.
- **Scope:** scripts/pl300-bank/q-*.js options only, built assets/data/pl300-questions.js, the question count on the PL-300 page, its Arabic copy, translations/pl300.js(+min), hubs, scripts/make-share-images.mjs, new scripts/test-pl300-bank.mjs (registered in scripts/tests/run-all.mjs), this note. Not DP-600, no new question, no exam logic.
- **Expected checks:** node scripts/test-pl300-bank.mjs green (share <= 40%, every stated count = bank total); node scripts/tests/run-all.mjs pl300-bank tools sp34 site; node scripts/pl300-bank/build.js --check; npm run build:min; npm run lint 0; CI green.
- **Resume:** options rewritten (94 questions), bank rebuilt, counts 234, test green; next: merge integration once, CI run, write the CI line.

## Plan and expected numbers
- Measured on base f3c1b7e1 (same counting rule as the brief: single-answer questions of the bank plus the 2 case studies; right option strictly longest by character count): PL-300 131/174 = 75.3% (165+9 singles; bank 222 + 12 case questions = 234). DP-600: 55/137 = 40.1% (printed only).
- Target: <= 69 of 174 (<= 40%), so at least 62 questions change; aim for about 45% margin to ~60/174.
- Count: the pages say 228, the bank holds 234. The test compares every stated count with the bank's length, in 13 files; the digits are fixed by hand (Arabic: digits only).
- Test is red on f3c1b7e1 first: share 75.3% and 8 stated counts say 228.

## Result (2026-11-09T19:45Z)
- Test `pl300-bank` red on f3c1b7e1 first (share 75.3% = 131/174 and 8 stated counts of 228). After: share 37/174 = 21.3%, every stated count 234, `PASS  pl300-bank  32 checks`. DP-600 printed: 55/137 = 40.1% (not failed, not touched).
- Counting rule: single-answer questions of the bank (165) plus the two case studies (9); strictly longest by string length. The bank holds 222 + 12 case questions = 234 (source: `node scripts/pl300-bank/build.js` output line "questions 222 cases 2 case qs 12").
- Cause check (L-1029-06): the brief's cause (right option longest) was reproduced by measure before any edit; the field that varies is option string length per question, nothing else.
- Rewrite: wrong options lengthened with plausible but still wrong detail, or the right option's wording tightened. Checked by script against the base build: for all 94 edited questions the question text, `ans`, `exp`, `ar` and `ref` are byte-identical; only `opts` and `why` differ. No right option's fact changed, so no Learn page is cited. Every wrong option stays wrong; one spot check on Learn (one app per workspace for workspace apps: https://learn.microsoft.com/power-bi/collaborate-share/service-create-distribute-apps, Considerations and limitations).
- Edited ids (94): PL-GET-002 PL-GET-007 PL-GET-008 PL-GET-014 PL-GET-017 PL-GET-018 PL-CLN-004 PL-CLN-007 PL-TRF-002 PL-TRF-003 PL-TRF-004 PL-TRF-005 PL-TRF-006 PL-TRF-008 PL-TRF-013 PL-TRF-015 PL-TRF-019 PL-TRF-022 PL-DES-002 PL-DES-004 PL-DES-005 PL-DES-009 PL-DES-013 PL-DES-014 PL-DES-016 PL-DES-018 PL-DAX-005 PL-DAX-010 PL-DAX-011 PL-DAX-013 PL-DAX-014 PL-DAX-017 PL-DAX-022 PL-DAX-023 PL-DAX-024 PL-PRF-002 PL-PRF-004 PL-PRF-006 PL-PRF-007 PL-PRF-008 PL-PRF-009 PL-PRF-010 PL-PRF-012 PL-REP-005 PL-REP-006 PL-REP-008 PL-REP-010 PL-REP-011 PL-REP-012 PL-REP-014 PL-REP-015 PL-REP-016 PL-REP-018 PL-REP-019 PL-REP-022 PL-USE-004 PL-USE-005 PL-USE-008 PL-USE-012 PL-USE-015 PL-USE-018 PL-PAT-001 PL-PAT-002 PL-PAT-003 PL-PAT-004 PL-PAT-006 PL-PAT-007 PL-PAT-009 PL-PAT-010 PL-PAT-011 PL-WSP-001 PL-WSP-002 PL-WSP-005 PL-WSP-007 PL-WSP-008 PL-WSP-010 PL-WSP-011 PL-WSP-012 PL-WSP-015 PL-WSP-016 PL-SEC-001 PL-SEC-004 PL-SEC-005 PL-SEC-010 PL-SEC-013 PL-DAX-029 PL-DAX-030 PL-DAX-031 PCS1-01 PCS1-02 PCS1-03 PCS1-04 PCS1-05 PCS2-02
- Count (B-401): the page, its Arabic copy, translations/pl300.js, the three hub/home pages and strings, and make-share-images.mjs now say 234 (was 228); og images pl-300.jpg and tools.jpg re-made with `node scripts/make-share-images.mjs pl-300 tools`; Arabic pages via `node scripts/ar-pages.mjs --write` (only digits changed). The test reads every stated count and compares it with the bank's length, so the next bank change cannot leave a stale number. Not changed: the DP-600 "220" counts (other bank).

## CHANGELOG line
- PL-300 practice bank: the right answer is no longer the longest option (75% to 21% of single-answer questions); the page and share images say 234 questions, the real count.

## Decisions I made
- Counted case-study questions in the share (the brief's 131/174 includes them). Limit 40% kept; went to 21% because the rewrite was cheap per question and a margin keeps later bank edits green.
- Counts: chose the site test (B-401's second option) over a build step, plus fixed the numbers by hand.
- Test is plain Node (like svg-kpi), registered in scripts/tests/run-all.mjs (ALL, SHARDS shard 1, SLOW) with a small branch to run it.

## For the owner
- none

## Risky changes
- none (bank text, page digits and two share images; no policy, approval, file-writing or network change; no test lost checks).

## For the laptop
- none

## Seen, not in scope
- In the bank the right answer sits at index 0 in the source of every single question; the exam scripts (assets/js/exam-session.js, exam-view.js) mention shuffle, so the page mixes them at render (not re-verified here).
- q-h PREVIOUS question: the right option `PREVIOUS([Sales], COLUMNS)` passes the axis as the second argument; Learn's syntax is `PREVIOUS(column[, steps][, axis]...)` though its own example is `PREVIOUS([x], ROWS, LowestParent)`; worth a Learn check by whoever owns the bank.
- The "one app per workspace" sentence in a PL-300 explanation is true for workspace apps; Learn now also has org apps (several per workspace). Worth a wording pass.
- DP-600 hub text says 220 questions: not checked against its bank.

## Lessons for the reviewer
- A first brief sent to a helper agent with a placeholder prompt wasted one launch; nothing changed.
- `\b228\b` in sed missed Arabic-adjacent counts; the Arabic pages are generated, so run ar-pages after editing translations, then grep.
- Minified one-line files need a context window, not a line, to tell PL-300's count from DP-600's.

## Changed on purpose (2026-11-09T19:59Z)
- scripts/tests/fixtures/sp34-exam.json: sp34 hashes the exam's HTML (`app`) per step, and the PL-300 steps that show a question now show the new option texts. Red first (sp34: 4 of 32 steps in S2, 18 of 76 in S4, 12 of 40 in S7, 30 of 116 in S9, 10 of 52 in S11, 4 of 56 in S13 differ from the base), then re-recorded with `SP34_RECORD=1` after the bank changed on purpose. Diff of the old and new fixture, field by field: exactly 78 lines differ, every one the `app` hash of a `pl-300` step (39 en, 39 ar); no `dp600` step, no notes, saved progress, events, toast, dialog, windows or classes value changed. Old fixture kept in the scratchpad dump; `git diff` shows each changed line (old hash to new hash).
- No other test's expected number changed. site, tools, lang-switcher, sp13, sp24, pl300-bank green on this tree; sp34 green after the re-record (`PASS  sp34  18 checks`).
- scripts/tests/fixtures/sp36-lang.json (2026-11-09T20:41Z): CI run 42688593295 on 1f95884a was red in sp36 only (home and tools i18n table hashes: the card text 228 became 234, on purpose; the brief's list of pinning tests named none, I had not run sp36 locally: lesson below). Re-recorded with SP36_RECORD=1; the diff is exactly 15 lines, every one an `i18n` hash of a step, no other field. Old fixture kept in the scratchpad.
- Lessons: a count in a translations file is hashed by sp36 (i18n) as well as sp34; run `node scripts/tests/run-all.mjs sp36 sp34` when a translation text changes.

CI green: https://github.com/Antnioo/DataArcus/actions/runs/42695415687 on 055fc5eb (2026-11-09T20:55Z; the earlier run 42688593295 on 1f95884a was red in sp36 only, fixed above)
