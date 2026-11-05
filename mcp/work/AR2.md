# AR2 (0.3.2): the two-model message in Arabic takes the dual

## Summary
- Approval: the owner's brief (D-1105-05, D-1105-02). Branch fix/0.3.2-ar2 from origin/integration/0.3.2. Push only it; never merge, no PR.
- Scope: assets/js/theme-download-ui.js (the `many` message, DD1G), its .min.js and stamps, one test, CHANGELOG, WORK.md, this note.
- Plan: (1) this note; (2) N = 2 reads «نموذجين», N of 3 or more stays «N نماذج» word for word; English unchanged;
  `npm run build:min`, sitemap lastmod if a stamp moved; (3) a test in mcp/test-0.3.2-dd1g.mjs pinning N = 2, 3, 12.
- Expected: one string choice in one file; dd1g goes from its present check count to +3; every other suite unchanged; lint 0.
- Done: merge origin/integration/0.3.2 once if moved, `npm run build:min`, all checks, tests.yml on the branch, wait.
- Resume point: step 1.

## Decisions I made
(none yet)
