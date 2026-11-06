## Summary
- **Approval:** the brief "PF3 (0.3.2): check_report's field-parameter list gets its cap (B-384)" (6 Nov); owner D-1105-03 and the standing rule "every list an answer returns has a cap".
- **Base:** `fix/0.3.2-pf3` from `origin/integration/0.3.2` at a548495d (FN1E merged). Push only this branch; never merged, no PR.
- **Scope:** `mcp/lib/check-report.mjs` only: `fieldParameters.parameters` and its note are capped like suspiciousNames (first N kept, `more: <count>`), and the cut loop may cut this list too. fn1e's "cut to the bone" pin re-recorded for that one case. No other list, finding or text.
- **Expected checks:** new test pf3 red on a548495d first, then green; fn1e: all cases but "cut to the bone" unchanged; checker area, lint, test-contracts, tests.yml green.
- **Resume:** see "Progress" below.

## Plan and expected numbers
- Base: the 700-table case answers 72,285 characters (over 40,000), parameters list uncapped.
- Fix: parameters keep the first 50 plus `more: 650`; the note names at most 5 missing tables then "and N more"; the cut loop halves the list (`more` updated) if still over the cap.
- Expected: the case answers under 40,000, no `truncated` from this list alone (the lint/findings cut loop is unchanged).

## Progress
- (filled in as I go)
