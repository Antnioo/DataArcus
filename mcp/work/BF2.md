# BF2 (0.3.2): the usage panel ("Fuel") on /build/ (D-1108-15, B-399)

## Summary
**State:** PLAN pushed, building (2026-11-08T15:08Z)
- **Approval:** the owner, 8 Nov (D-1108-15): "yes move it earlier also i want the website to show this" (after "i also wanted to check the usage it needed for all builders and every session and how many tokens").
- **Base:** `fix/0.3.2-bf2` from `origin/integration/0.3.2` (446ebd8a).
- **Scope:** `build/index.html` (the Fuel panel, below the existing sections), new `assets/js/build-usage.js` (+ .min.js), small hooks in `assets/js/build-page.js` (call the usage reader once per refresh cycle through the existing `createClient`) and `assets/js/build-helix.js` (a rung label shows that job's cost), `scripts/tests/build-page.mjs` + fixture `scripts/tests/fixtures/build-usage.json` (made-up numbers), MODULES.md row, this note, one WORK.md line. No MCP code.
- **Expected checks:** suite `build-page` 52 -> about 70 (new U-checks: renders, schema mismatch, missing file, 390 px no sideways scroll, textContent, ETag/304, rung cost, no extra API call); every old check unchanged; `test-site-config`, `csp`, `check-min`, `stamps`, `check-modules`, `check-agent-memory`, `sitemap-lastmod` pass; lint exit 0; CI green.
- **CI:** not run yet.
- **Resume:** step 3 of the plan below.

## Plan
1. This note (pushed first).
2. Red first: the new U-checks in `build-page.mjs` with the fixture, run on the old code (no panel): they must fail.
3. `build-usage.js`: pure core (`validate`, `fmtUsd`, `fmtTokens` in millions, `dayBars` scaled chart geometry, `costById`) + `mount(doc, client, win)`. Reads `raw.githubusercontent.com/Antnioo/DataArcus/build-data/usage.json` with `client.get(url, {raw:true})` (BF1's ETag cache, 304 handling, rate-limit state): no second fetch helper. A version other than 1: "This page reads usage version 1; the file says <n>" and the panel stops. 404/other failure: "Usage numbers are not available right now." and the rest of the page works.
4. `build-page.js`: after `createClient`, if `window.BuildUsage` exists, mount it and call its refresh once per cycle; the sats get `cost` from usage by job code; `build-helix.js` label shows "cost $x.xx" when present.
5. `build/index.html`: the panel markup (every value via textContent), styles in the page's glass look, 14-day inline SVG bars drawn to scale. No CSP change expected (raw.githubusercontent.com is already allowed on pages that load build-page.js; the new script is same-origin).
6. `npm run -s build:min`, `csp.mjs`, `sitemap-lastmod.mjs`, suite, lint, CI.

## Before -> after
(to fill)
