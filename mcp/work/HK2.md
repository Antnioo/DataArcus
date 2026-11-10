## Summary
B-414 rest: the two website suites that still read an off-main commit from git now read pinned saved files.
- **Approval:** reviewer brief HK2 (0.3.3); owner D-1110-05 "1 yes yes yes, 2 yes, 3 yes, 5 yes" (B-414 now), D-1104-12 (one shared place).
- **Base:** origin/integration/0.3.3 at ad50f1d7; branch fix/0.3.3-hk2.
- **Scope:** scripts/tests/sp6.mjs, scripts/tests/sp29.mjs, one shared helper scripts/tests/base-engine.mjs, two pinned files under mcp/fixtures/hk1/, mcp/WORK.md, this note.
- **Expected checks:** sp6 4 checks and sp29 8 checks (run-all output, unchanged); `node scripts/check-modules.mjs --strict`.
- **Resume:** plan committed; next measure the table below, add the fixtures and the helper, prove red then green in a main-only clone, CI.

## Plan and measured start
- Measured on ad50f1d7 + npm ci: `node scripts/tests/run-all.mjs sp6 sp29` -> PASS sp6 4 checks, PASS sp29 8 checks.
- Each suite reads one file from git: `assets/js/design-engine.min.js` at 04a9922 (sp6) and 39c46bb (sp29).
- HK1's copies hold the unminified design-engine.js, not the .min.js (the pages load the .min.js): different bytes, so new pinned copies are needed (table to follow).
- Plan: save both .min.js files as bytes beside HK1's, one helper reads them (the env override reads git only when set), proof in a main-only clone.
Written: 2026-11-10T13:47Z
