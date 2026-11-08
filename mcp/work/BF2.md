# BF2 (0.3.2): the usage panel ("Fuel") on /build/ (D-1108-15, B-399)

## Summary
**State:** DONE
- **Approval:** the owner, 8 Nov (D-1108-15): "yes move it earlier also i want the website to show this" (after "i also wanted to check the usage it needed for all builders and every session and how many tokens").
- **Base:** `fix/0.3.2-bf2` from `origin/integration/0.3.2` (446ebd8a).
- **Scope:** `build/index.html` (the Fuel panel, below the existing sections), new `assets/js/build-usage.js` (+ .min.js), small hooks in `assets/js/build-page.js` (call the usage reader once per refresh cycle through the existing `createClient`) and `assets/js/build-helix.js` (a rung label shows that job's cost), `scripts/tests/build-page.mjs` + fixture `scripts/tests/fixtures/build-usage.json` (made-up numbers), MODULES.md row, this note, one WORK.md line. No MCP code.
- **Expected checks:** suite `build-page` 52 -> about 70 (new U-checks: renders, schema mismatch, missing file, 390 px no sideways scroll, textContent, ETag/304, rung cost, no extra API call); every old check unchanged; `test-site-config`, `csp`, `check-min`, `stamps`, `check-modules`, `check-agent-memory`, `sitemap-lastmod` pass; lint exit 0; CI green.
- **CI:** CI green: https://github.com/Antnioo/DataArcus/actions/runs/42493818423 on 9fc99228 (2026-11-08T15:28Z).
- **Resume:** CI on the last commit, then the reviewer merges.

## Plan
1. This note (pushed first).
2. Red first: the new U-checks in `build-page.mjs` with the fixture, run on the old code (no panel): they must fail.
3. `build-usage.js`: pure core (`validate`, `fmtUsd`, `fmtTokens` in millions, `dayBars` scaled chart geometry, `costById`) + `mount(doc, client, win)`. Reads `raw.githubusercontent.com/Antnioo/DataArcus/build-data/usage.json` with `client.get(url, {raw:true})` (BF1's ETag cache, 304 handling, rate-limit state): no second fetch helper. A version other than 1: "This page reads usage version 1; the file says <n>" and the panel stops. 404/other failure: "Usage numbers are not available right now." and the rest of the page works.
4. `build-page.js`: after `createClient`, if `window.BuildUsage` exists, mount it and call its refresh once per cycle; the sats get `cost` from usage by job code; `build-helix.js` label shows "cost $x.xx" when present.
5. `build/index.html`: the panel markup (every value via textContent), styles in the page's glass look, 14-day inline SVG bars drawn to scale. No CSP change expected (raw.githubusercontent.com is already allowed on pages that load build-page.js; the new script is same-origin).
6. `npm run -s build:min`, `csp.mjs`, `sitemap-lastmod.mjs`, suite, lint, CI.

## Before -> after
- Before: /build/ had no usage numbers. After: a "Fuel" panel below Release: today's cost ($) and tokens (millions), builders/workers/probes (cost, count), by model, a 14-day inline SVG bar chart to scale (a track per day, empty days empty, a title per bar), the last 8 finished jobs (cost, minutes, tokens, model), the 5 costliest sessions today, "Updated HH:MM" (visitor's time). A helix rung's label adds "cost $x.xx" when usage.json has that job.
- Tests (2026-11-08T15:14Z, run alone, `node scripts/tests/run-all.mjs build-page`, its own PASS line): `build-page` 52 -> 80 checks PASS. Red first: with the 28 new checks and the fixture on 847a2afd (no panel, no build-usage.js) the suite crashed (0 checks). Pass: `check-modules` 1173, `check-agent-memory` 455, `test-site-config`, `csp` (all 140 pages), `ar-pages`, `sitemap-lastmod`, `stamps`/`check-min` (build:min), `npm run lint` exit 0. The `site`, `lang-switcher` suites (over 10 min alone here) run in CI.

## CHANGELOG line
None: the website only, no MCP change.

## Decisions I made
- usage.json is read with `client.get(url, {raw:true})` (BF1's reader: ETag, 304 keeps the text, rate-limit state); `createClient` was already exported, so no change to the reader. build-page.js mounts `BuildUsage` when present and calls its refresh alongside its own reads each cycle (awaited before the rung data so costs are there); a usage failure never reaches the page's banner.
- Job cost joins the helix by job code (`id` upper-cased); the label gets `cost $x.xx` only when the file has the job (the last 40).
- Messages: version other than 1 -> "This page reads usage version 1; the file says <n>." (the panel stops, numbers cleared); missing file (404), bad JSON or no body -> "Usage numbers are not available right now." A 304 or a failed later read keeps the last numbers. A rate limit keeps them and the page's own note says so.
- `workers.costliest` is not drawn (the top-5 list and the builders/workers/probes split cover it); only version 1's fields are read, so a session id or prompt in the file could never show (checked with a planted one in the fixture).
- Numbers use the visitor's locale (Intl.NumberFormat), money as "$12.34"; the chart's axis labels are the first, middle and last dates only.
- No CSP change: the new script is same-origin and raw.githubusercontent.com is already in connect-src on pages that load build-page.js (csp.mjs: all 140 pages pass).
- Sources of public numbers: none in public text; the fixture numbers are made up (the live copy was read only for its shape).

## For the owner
- none

## Risky changes
- Network: one more GET per refresh, to raw.githubusercontent.com (already allowed, no token, no API rate limit). No new host, no policy change.
- A new script on /build/ (`build-usage.min.js`, same origin). Nothing written anywhere; no storage.
- Tests losing checks: none (build-page gained 28; no expected number of another test changed).

## For the laptop
- Nothing for Desktop. After merge, open dataarcus.com/build/ once usage.json is on build-data.

## Seen, not in scope
- The panel's chart labels are small on a phone (viewBox scaling); readable, not changed.
- Raw 403/429 from raw.githubusercontent.com would put the whole reader in its wait state (shared state by design in BF1).

## Lessons for the reviewer
- A fresh clone has no node_modules: `npm ci --ignore-scripts` before any site suite.
- check-min.mjs only lists tracked .min.js: a NEW script needs one `npx terser` + `git add` before `build:min` can stamp its tag.
- WORK.md was 16 characters over its cap with a descriptive line: the brief's "one line" must be a few words.

