# PC1 0.3.2: the cost calculator's "checked" date in one place (B-413, AUD-059)

## Summary
- **Approval:** D-1104-12 and D-1016-01 (fix at the source); the reviewer's brief "PC1", B-413 (night audit AUD-059).
- **Base:** `fix/0.3.2-pc1` from `origin/integration/0.3.2` (207784c6). Push only this branch; the reviewer merges.
- **Scope:** scripts/update-powerbi-prices.mjs (new exported `syncChecked(root, iso)`), the weekly workflow's `git add`,
  the four places of the date (calculator page span, translations EN and AR spans, the fallback line 18), their .min.js,
  sitemap.xml, scripts/test-powerbi-prices.mjs (the new check), CHANGELOG line. No price, no other word.
- **Expected checks:** test-powerbi-prices.mjs: new checks red on 207784c6 (3 places say 23 September, fallback
  2026-10-03 vs JSON 2026-11-02), then PASS; check:min, sitemap-lastmod, site config PASS; run-all tools, site PASS.
- **Resume:** plan written (2026-11-09T04:08Z); next the red check, then syncChecked, the workflow, the sync run, CI.

## Plan
1. Red first: add the drift check to scripts/test-powerbi-prices.mjs (already run by tests.yml).
2. syncChecked(root, iso) writes the date into the four places; words from toLocaleDateString with the runtime's own
   options (en-GB, ar-u-nu-latn, UTC, day numeric, month long, year numeric). The script's main run only when it is the
   entry point, so the test can import it without the network.
3. Workflow adds the changed files; min and sitemap rebuilt in the workflow (decision below).
4. Run syncChecked now with 2026-11-02.

## Decisions I made
(filled at the end)
