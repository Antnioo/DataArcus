# PC1 0.3.2: the cost calculator's "checked" date in one place (B-413, AUD-059)

## Summary
- **Approval:** D-1104-12 and D-1016-01 (fix at the source); the reviewer's brief "PC1", B-413 (night audit AUD-059).
- **Base:** `fix/0.3.2-pc1` from `origin/integration/0.3.2` (207784c6). Push only this branch; the reviewer merges.
- **Scope:** scripts/update-powerbi-prices.mjs (new exported `syncChecked(root, iso)`), the weekly workflow's `git add`,
  the four places of the date (calculator page span, translations EN and AR spans, the fallback line 18), their .min.js,
  sitemap.xml, scripts/test-powerbi-prices.mjs (the new check), CHANGELOG line. No price, no other word.
- **Expected checks:** test-powerbi-prices.mjs: new checks red on 207784c6 (3 places say 23 September, fallback
  2026-10-03 vs JSON 2026-11-02), then PASS; check:min, sitemap-lastmod, site config PASS; run-all tools, site PASS.
- **Got:** test-powerbi-prices 29/29 (3 red before the sync: page span, translations spans, fallback; red on 207784c6's data first); run-all site 629, tools 399, lang-switcher 1442 PASS; 0.3.0-claims 721 PASS; lint 0. Code: 7cf571ec.
- **Resume:** done; waits for the reviewer (2026-11-09T04:51Z). CI green: https://github.com/Antnioo/DataArcus/actions/runs/42562897929 on 1268e8f8 (first run 42561593473 red only on sitemap lastmod, fixed).

## Plan
1. Red first: add the drift check to scripts/test-powerbi-prices.mjs (already run by tests.yml).
2. syncChecked(root, iso) writes the date into the four places; words from toLocaleDateString with the runtime's own
   options (en-GB, ar-u-nu-latn, UTC, day numeric, month long, year numeric). The script's main run only when it is the
   entry point, so the test can import it without the network.
3. Workflow adds the changed files; min and sitemap rebuilt in the workflow (decision below).
4. Run syncChecked now with 2026-11-02.

## CHANGELOG line
In mcp/CHANGELOG.md [Unreleased]: "The cost calculator's checked date is the date of the weekly price check".

## Decisions I made
- Min rebuild and sitemap lastmod run in the workflow, not the script: they need terser (npm ci) and git history (lastmod reads commit dates, so it needs a second commit after the first).
- The workflow checks out with fetch-depth 0 and installs with --ignore-scripts.
- The script's network run is guarded to run only as the entry point, so the test imports syncChecked without the network.
- The check lives in scripts/test-powerbi-prices.mjs (already a CI step), not a new suite.
- The Arabic span is chosen by Arabic letters in the old text, so the order of the two spans does not matter.
- Also rebuilt by build:min on purpose: the ?v= stamp in ar/tools/power-bi-licensing-cost-calculator.html (the bot's git add includes it).
- Source of the date: assets/data/powerbi-prices.json "checked" 2026-11-02 (written by the weekly workflow).

## For the owner
none

## Risky changes
- .github/workflows/update-powerbi-prices.yml commits more than before: the calculator page, its Arabic page, three scripts and two .min.js (all from the date), then a second commit of sitemap.xml. It adds npm ci --ignore-scripts, build:min and sitemap-lastmod to the bot's run, and full-history checkout. Why: the page's date must follow the data. No new permission, no new network host (npm ci uses the registry as tests.yml does). Not run yet; the first Monday run proves it.

## For the laptop
none

## Seen, not in scope
- mcp/test-0.3.0-claims.mjs:401 pins "checked 26 October 2026" for the licensing guide; it does not follow the weekly date.

## Lessons for the reviewer
- The brief's "four places" are three files; the stamps change a fifth (the Arabic page), which the bot's git add must carry.
- WORK.md has no room (3200 cap): a new job line must be short.
