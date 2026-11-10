# CL2 (0.3.3, the site): the Copilot-ready article's title jumps when Inter loads (B-435, AUD-062)

## Summary
- **Approval:** the reviewer's brief "CL2" (10 Nov); the owner D-1110-04 ("keep everything going"), D-1104-12 (fix at the
  source), D-1027-03, D-1027-12, D-1029-03 (Arabic untouched). Backlog B-435 (night audit AUD-062).
- **Base:** `fix/0.3.3-cl2` from `origin/integration/0.3.3` at 00f7f702. Push only this branch; never merge, no PR.
- **Scope:** `assets/css/style.css` (the one stylesheet that defines `Inter Fallback` and `.article-header h1`) and
  its `.min.css`, a new case in `scripts/tests/site.mjs` (the AUD-002 font-swap block), the `?v=` stamps, sitemap.xml
  lastmod lines, this note, one WORK.md line. No page words, no Arabic text, no font file.
- **Expected checks:** `node scripts/check-modules.mjs --strict`; site suite (new case red on the base first);
  `npm run lint` 0; check-min; `node scripts/test-site-config.mjs`.
- **Resume:** step 1 measured (below); step 2 fix and step 3 test in progress.

## Plan
1. Measure on the base (Playwright 1.63 Chromium 153, Inter from @fontsource served 500 ms late, as site.mjs does).
2. Try the metrics fix first (L-1109-03); reserve the title's height only if metrics cannot reach under 0.05.
3. Test: the title's shift at 1400 px, 0.1 or less, the Arabic page 0.

## Measured on the base (step 1)
Note: this machine has Inter installed as a system font, so "Inter blocked" falls through to the system Inter. The
measure declares an `Inter` @font-face (as the real Google CSS does) so the system font cannot stand in.
