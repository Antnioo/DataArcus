# SW2 (0.3.4): job sweep, six small items (D-1112-03)

## Summary
- **Approval:** the owner, 12 Nov, D-1112-03 "For wf1 1 to 5 yes" (WF1-DESIGN.md section 2), relayed by the reviewer's brief.
- **Base:** `fix/0.3.4-sw2` from `origin/integration/0.3.4` at 87fd7896. Push only this branch; never merge, no PR.
- **Scope:** only the files the six items name and their tests: mcp/work/IX2.md, OX1.md, TF1.md, AR7.md; scripts/tests/run-all.mjs; scripts/check-modules.mjs (+ scripts/test-modules.mjs); the Gulf like-for-like page (tools/gulf-like-for-like.html, assets/js/gulf-like-for-like.js and its .min.js) and its suite.
- **Expected checks:** `node scripts/check-modules.mjs --strict`; `node scripts/test-modules.mjs`; `node scripts/tests/run-all.mjs gulf-like-for-like` (alone); csp, ar-pages, sitemap-lastmod, test-site-config; lint.
- **Resume:** plan written; items 1 to 6 not started (see "Plan").

## Plan
1. I-1113-04: IX2.md draft «مرئية» -> «مرئي». A note, no code: red = grep finds «مرئية» on 87fd7896.
2. I-1113-05: OX1.md's For the owner 3 points to OX2's table as the one draft (OX2 gave its reasons); OX1's examples dropped.
3. I-1113-25: run-all.mjs honours `--list` (prints the suites, exit 0) and refuses an unknown `--flag` (exit 2); check-modules says `not a file: <name>` with the fix when a "used by" cell names a function. Red first in scripts/test-modules.mjs and a run-all check.
4. I-1115-01 (AUD-076): the Year select offers only years that can answer (RANGE.first+1 to RANGE.last: 2019 to 2030, 13 options -> 12), and the unknown verdict does not say "yet". Test red first.
5. I-1115-02 (AUD-077): at 390 px the overview's last column ("like for like") is wholly inside its box. Test red first on the page.
6. I-1115-06 (TF1 note line): measure first (read each Learn page in Arabic); an item no longer true says "not so on <sha>".
Expected numbers are filled in as measured.
