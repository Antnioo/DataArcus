## Summary
- **Approval:** owner's go 8 Nov, "yes go ahead with B-400 after 0.3.2" (D-1108-17); mix D-1109-09. Written 2026-11-09T19:32Z.
- **Base:** origin/integration/0.3.3 f3c1b7e1 (0.3.2 shipped). Branch feat/0.3.3-pq1.
- **Scope:** scripts/pl300-bank/q-*.js options only, built assets/data/pl300-questions.js, the question count on the PL-300 page, its Arabic copy, translations/pl300.js(+min), hubs, scripts/make-share-images.mjs, new scripts/test-pl300-bank.mjs (registered in scripts/tests/run-all.mjs), this note. Not DP-600, no new question, no exam logic.
- **Expected checks:** node scripts/test-pl300-bank.mjs green (share <= 40%, every stated count = bank total); node scripts/tests/run-all.mjs pl300-bank tools sp34 site; node scripts/pl300-bank/build.js --check; npm run build:min; npm run lint 0; CI green.
- **Resume:** plan committed; test red on f3c1b7e1; next rewrite options file by file (q-a..q-h), rebuild, then counts.

## Plan and expected numbers
- Measured on base f3c1b7e1 (same counting rule as the brief: single-answer questions of the bank plus the 2 case studies; right option strictly longest by character count): PL-300 131/174 = 75.3% (165+9 singles; bank 222 + 12 case questions = 234). DP-600: 55/137 = 40.1% (printed only).
- Target: <= 69 of 174 (<= 40%), so at least 62 questions change; aim for about 45% margin to ~60/174.
- Count: the pages say 228, the bank holds 234. The test compares every stated count with the bank's length, in 13 files; the digits are fixed by hand (Arabic: digits only).
- Test is red on f3c1b7e1 first: share 75.3% and 8 stated counts say 228.
