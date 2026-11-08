# BF1 (0.3.2): the live build page, dataarcus.com/build/ (unlisted)

## Summary
- **Approval:** the owner, 8 Nov (D-1108-14, B-397): "i actually wanted something like a page in dataarcus"; chose "Unlisted first" and "Now, ships with 0.3.2".
- **Base:** `fix/0.3.2-bf1` from `origin/integration/0.3.2` (e621426b).
- **Scope:** website files only: `build/index.html`, `assets/js/build-page.js` (+ .min.js), the per-page connect-src rule in `scripts/csp.mjs`, `scripts/tests/build-page.mjs` and its fixtures, the suite lists, MODULES.md row, this note, one WORK.md line. No MCP code.
- **Expected checks:** new suite `build-page` (red on e6214 first, then green); `node scripts/test-site-config.mjs`, `csp.mjs`, `check-min.mjs`, `sitemap-lastmod.mjs` pass; lint exits 0; CI green.
- **Resume:** started 2026-11-08T13:17Z; plan below, nothing built yet.

## Plan
1. Red first: suite `build-page` serves the page with recorded GitHub answers (made-up fixtures, routed in Playwright, no live calls).
2. `assets/js/build-page.js`: a pure `BuildPage` core (parse, ETag cache, rate-limit state, "ago") and the DOM part (textContent only).
3. `build/index.html`: site header and footer, no language scripts (English only, like go/*), noindex, not in menu or sitemap.
4. `scripts/csp.mjs`: connect-src api.github.com + raw.githubusercontent.com only on pages that load build-page.js.
5. `scripts/test-site-config.mjs`: the Arabic-copy rule already leaves out 404 and -lab pages; /build/ joins them.

## Decisions I made
(filled as I go)
