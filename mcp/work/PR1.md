# PR1 (0.3.1, 26 Oct): what DataArcus needs to be a product we can market

## Summary
- **Approval:** the reviewer's brief "Go on PR1" (26 Oct), from an outside review of the same day checked against
  `integration/0.3.1`; the owner approved the licence line ("Add it") and the support promise ("2 working days").
- **Scope:** `LICENSE` (one "You may" line); `SUPPORT.md` (new, root); `.github/ISSUE_TEMPLATE/` (3 forms and
  `config.yml`, new); `mcp/README.md` (a SUPPORT link); `mcp/PRIVACY.md` (the header's version sentence; a new "On one
  page" section); `power-bi-mcp/index.html` "How it works" and its feedback and privacy lines, through
  `assets/js/translations/beta-page.js` (+ `.min.js`, `?v=` stamps, CSP, `ar/power-bi-mcp/index.html` regenerated,
  sitemap lastmod); `scripts/check-release.mjs` (new), its fixtures `scripts/tests/fixtures/release/` and suite
  `mcp/test-check-release.mjs` (one line in `mcp/tests.json`, area release); this note. Not SQ15b's or SQ15c's files
  (report-run, plan-lint, metric-switcher, pbip-export, test.mjs, CI, TESTS.md); not `mcp/WORK.md` (the reviewer's).
- **Base:** `feat/0.3.1-product-docs` from `origin/integration/0.3.1` (05b5053). Push only this branch; no PR.
- **Items:** 1 licence, 2 support, 3 How it works, 4 PRIVACY's header, 5 the one-page privacy summary, 6 the release
  consistency check (details and before -> after below).
- **Expected checks:** check-release suite about 12 checks, all PASS: the matching fixture set 0 mismatches; the set
  with one wrong hash exactly 1 (that file, that hash); a fixture CHANGELOG still "[Unreleased]" 1; the live mode on a
  fixture Registry answer (no network in the test) 0, and 1 with its hash changed; the CLI prints its result line and
  exits 1 on a mismatch. `node scripts/check-release.mjs --version 0.3.1` on today's tree: FAIL, every download line
  says 0.3.0 (README, mcp/README, both page copies, beta-page.js EN and AR), CHANGELOG still "[Unreleased]", the 0.3.1
  date the placeholder; `--version 0.3.0`: PASS. `run-all site tools` PASS before and after; `npm test -- release`
  (there is no "docs" area: release holds the claims and release-text suites) PASS, one suite more; the suites that
  pin PRIVACY and the page (release-text, 0.3.0-claims, rc23, test.mjs's F-05, whats-new, github-links) PASS by true
  texts; the full `npm test -- --keep-going` one suite more than the base, all PASS.
- **Invariants:** no code of the server changes; every new privacy sentence repeats a line further down PRIVACY.md.
- **Got:** (after the run)
- **Resume:** plan pushed; next the items in order 4, 1, 2, 3, 5, 6, then the website workflow and the suites.

## Plan (before any edit)
1. Item 4: header line 3-4 "(the build writes its version into the package, and the source's `mcp/package.json` says
   0.1.0 until then)" -> "(the version `mcp/package.json` names)". Keeps "Checked against 0.3.1" in the first 8 lines
   (test-release-text).
2. Item 1: one line under "You may" in LICENSE. The plugin README's licence paragraph ("you may use it and what it
   makes for you, but not copy or redistribute it") still agrees: unchanged unless the new line contradicts it.
3. Item 2: SUPPORT.md, the three forms and config.yml; links from mcp/README.md and from the page's feedback line
   (`beta.join.next`, EN and AR).
4. Item 3: `beta.how` s1-s4 (EN, AR); the page's list gets a fourth `<li>`; "approval window" / «نافذة الموافقة» as in
   `beta.tools.approve_plan`.
5. Item 5: "## On one page" after the header paragraph (the header must stay in lines 1-8), at most 12 lines, section
   numbers in brackets; one link from `beta.safe.data` (EN, AR) to `#on-one-page`.
6. Item 6: the check, red first on the wrong-hash fixture, then green; the suite registered in tests.json.
7. Website workflow: build:min, new `?v=` stamps (both copies), csp --write, ar-pages --write, test-site-config,
   sitemap-lastmod --write after the last page commit; the suites; this note's results; commit, push.
