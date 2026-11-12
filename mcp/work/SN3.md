# SN3 (0.3.3): four small items from the night audit and the "Seen, not in scope" lists

## Summary
- **Approval:** the owner D-1112-01 (12 Nov 04:15 Dubai): fix the open audit finds and the small "Seen" items while he sleeps; the reviewer hub's brief SN3.
- **Base:** `feat/0.3.3-sn3` from `origin/integration/0.3.3` at c21df8d5. Pushed only this branch; never merged, no PR.
- **Scope:** `assets/js/svg-expressions.js` (+ .min.js, 2 ?v= stamps), `scripts/test-svg-kpi.mjs`, `mcp/fixtures/sp16-codegen.json` (E1 record, item 1), `scripts/test-pl300-bank.mjs`, the exam suite, test files and a clock preload (item 4), `mcp/CHANGELOG.md` (item 1), `mcp/WORK.md`, this note.
- **Expected checks:** svg-kpi (939 -> 981 checks), sp12, sp16, dd2z; test-site-config; pl300-bank; the exam suite; the files item 4 finds; CI green on the last code commit; lint 0.
- **Resume:** the state is the last line of this note.

## Plan
1. AUD-063: red first (42 of the new checks fail on c21df8d5, the 80 pinned answers stay green), then `roundDecimal` prints the value's 15 significant digits and zeros from 1e21.
2. DP-600 count check in test-pl300-bank (220 = 208 + 12), bitten once by a changed count.
3. Measure whether any test fails with the exam's options in source order; add one if none.
4. Static list of the clock-reading suites, run under three shifted clocks with a preload, fix each red at its cause.

## Before -> after
1. (in progress)
