## Summary
STOP (B-417 only, not done): mcp/test-0.3.0-claims.mjs still pins "checked 26 October 2026"; the fix needs the owner (see "For the owner"). The six base-commit suites are done.
- **Approval:** reviewer brief HK1 (0.3.3, Haiku job), 9 Nov; the owner's D-1109-09 (run every check, record what is unsure).
- **Base:** origin/integration/0.3.3 at f3c1b7e1; branch fix/0.3.3-hk1.
- **Scope:** six suites (glass-tables, dd2c, dd2o, dd2p, sp29, sp6) read saved copies of their base commits from mcp/fixtures/hk1/<suite>/ instead of git show or git ls-tree. Not done: B-417 (claims date).
- **Expected checks:** glass-tables 113, dd2c 48, dd2o 89, dd2p 112, sp29 21, sp6 13: unchanged. claims 721 (not touched).
- **Resume:** owner answers the B-417 question; then one commit to the claims date check (test + guide, if he agrees).

Written: 2026-11-09T19:37Z
