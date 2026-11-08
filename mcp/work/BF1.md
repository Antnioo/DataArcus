# BF1 (0.3.2): the live build page, dataarcus.com/build/ (unlisted)

## Summary
**State:** IN PROGRESS (review fixes, CI running)
- **Approval:** the owner, 8 Nov (D-1108-14, B-397): "i actually wanted something like a page in dataarcus"; chose "Unlisted first" and "Now, ships with 0.3.2".
- **Base:** `fix/0.3.2-bf1` from `origin/integration/0.3.2` (e621426b).
- **Scope:** website files only: `build/index.html`, `assets/js/build-page.js` (+ .min.js), the per-page connect-src rule in `scripts/csp.mjs`, `assets/js/build-helix.js` (+ .min.js), `scripts/tests/build-page.mjs` and its fixtures, `three@0.160.0` as a pinned devDependency (package.json, lock), the suite lists, MODULES.md row, this note, one WORK.md line. No MCP code.
- **Expected checks:** new suite `build-page` 0 -> 46 checks (red on e621426b first: the page did not exist, 0 checks, crashed); `node scripts/test-site-config.mjs`, `csp.mjs`, `check-min.mjs`, `sitemap-lastmod.mjs` pass; lint exits 0; CI green.
- **Resume:** built and tested locally 2026-11-08T13:40Z; CI run and its line below. Nothing else left but the reviewer's merge.

## Before -> after
- Before: no /build/ page. After: dataarcus.com/build/ (unlisted): a live 3D DNA helix of the builders (three.js, SVG fallback), telemetry tiles, builder cards, CI now, integration today as a timeline, the release line. Read from the public repo in the visitor's browser.
- Tests: `build-page` 0 -> 46 checks, PASS (2026-11-08T13:40Z, run alone). `test-site-config`, `csp`, `cdn`, `check-min` (stamps), `ar-pages`, `sitemap-lastmod`, `check-modules`, `check-agent-memory`: PASS. `npm run lint`: exit 0.
- The `site`, `consent` suites took more than 10 minutes alone here and were cut by my own timeout (not a failure of the page): they run in CI.

## CHANGELOG line
None: the website only, no MCP change (mcp/CHANGELOG.md untouched).

## Decisions I made
- The look: the reviewer's second message (the owner, 8 Nov: "something modern as if like 3d dna ... didn't mean nasa") replaced the first (mission control). Nothing of mission control remains.
- The helix maps the data: strand A = integration/X.Y.Z, its merges of the last 24 h are nodes along it (teal); strand B = the builder branches; one rung per builder branch with a push in the last 24 h (cap 24 branches, 60 rungs drawn), newest at the top. Rung colour = the builder's light: running CI amber (bigger, glowing, with particles flowing along it), red coral (a red run or a note whose State says wait/owner/stop/block), done teal (green run or a State starting DONE), no push for 2 hours violet, otherwise blue. Hover or tap shows a glass label: job code, commit line, CI state, note state (all textContent).
- The tab hidden or the helix off screen: the loop stops. Reduced motion: drawn once, still (data-motion=still). No WebGL (probed with getContext('webgl2') first, so three.js logs no error): a still SVG helix, native title and the same label. The canvas is aria-hidden; the cards hold the same data.
- No post-processing: emissive materials, additive glow sprites and Fog. Pixel ratio capped at 2.
- three.js: `three@0.160.0` (Dec 2023), the classic build/three.min.js (global THREE) so the site's own pin system works: package.json devDependencies (exact), scripts/cdn.mjs writes the SRI hash, csp.mjs allows that package folder on this page only. This is a new devDependency (the original brief said no new dependency; the reviewer's look needs it): the tests serve it from node_modules like the other CDN files.
- Fonts: Manrope and JetBrains Mono from Google Fonts (already allowed by the policy); the site's header, footer and Inter stay.
- The page loads no language, analytics or consent scripts (English only, like go/*): so no cookie banner or tracking on it. /build/ joins 404 and -lab pages as a page without an Arabic copy (test-site-config's rule, one regex); locale-routes.js untouched.
- API calls (changed after the reviewer's live check, 8 Nov 14:10Z): the Events feed lags by hours and missed AP2, BF1 and RV1, so it is gone. A refresh reads 4 addresses (branches, tests.yml runs, integration commits, the latest release from Antnioo/dataarcus-releases) plus ONE latest-commit lookup per job branch (fix/ or feat/ of the newest integration version) whose head sha is new to the page: a commit never changes, so each sha is read once and the repeats are 304s of the branches list. First look: 4 + one per job branch (at most 40 lookups; none while fewer than 12 requests are left). This goes past the brief's "at most 6" on a first look, on the reviewer's instruction; later refreshes are 4 calls (304s cost nothing). Notes and package.json from raw. The commits address has no `since` (a changing address would never get a 304).
- A missing note file (404) shows `note: -`, a missing release (404) is "no release found": neither raises the banner; only a failed API read or the rate limit does.
- A branch whose latest tests.yml run is queued or in progress is running (rung, telemetry, stripe).
- "First-parent Merge commits": the commits API cannot say first-parent; I take two-parent commits whose message starts with "Merge" and is not a builder's own "Merge origin/..." / "Merge branch". 
- Light and dark: the site is dark only; this page is one deliberate dark look (the reviewer's last message), no light variant.
- Rungs sit at (i+0.5)/n inside the strand so one or two jobs are still readable.

## For the owner
- none

## Risky changes
- Network: this page's CSP gets connect-src https://api.github.com https://raw.githubusercontent.com (GET only, public repo, no token), only on pages that load build-page.js (scripts/csp.mjs); privacy.html's policy is unchanged (checked in the suite).
- Scripts: this page's script-src names the folder cdn.jsdelivr.net/npm/three@0.160.0/ (exact version, SRI hash on the tag), nothing site-wide.
- A new devDependency, three@0.160.0 (package.json and package-lock.json).
- Tests losing checks: site and lang-switcher skip build/ for the language checks (see Changed on purpose).
- Test rule: test-site-config's "every page but 404, -lab" rule gained build/ (a page that is not in the sitemap on purpose); it loses no check.
- The page writes nothing (no storage, no cookies, no forms).

## For the laptop
- Open dataarcus.com/build/ after the owner merges to main; nothing for Desktop.

## Screenshots (made-up fixtures, Chromium, the real page)
- /tmp/claude-0/-home-user-DataArcus/f1f943a4-1491-5738-98ae-b4e9db334dd4/scratchpad/shots/build-desktop-dark.png and build-desktop-dark-label.png (1440 wide)
- /tmp/claude-0/-home-user-DataArcus/f1f943a4-1491-5738-98ae-b4e9db334dd4/scratchpad/shots/build-phone-dark.png and build-phone-dark-label.png (390 wide)

## Changed on purpose
- CI run 42486268590 (on 48e073e5) was red: `site` (ar copy of build/ missing) and `lang-switcher` (no switcher on build/), shard 1 only, both about build/ being English only. Fixed 2026-11-08T13:57Z: `langsOf` in scripts/tests/lib.mjs says ['en'] for build/, and lang-switcher.mjs skips build/ in its two page loops. No expected number of another test changed; those two suites no longer check this one page for a switcher or an Arabic copy (it has neither by design).

- Review fixes (2026-11-08T14:12Z): red first on 9b20c247 (the new fixtures, in GitHub's real shapes, crashed the old code: no builder without an events entry), then 52 checks green. New checks: D1 (a branch with no push event shows), D2 (message and note State on each card, "-" without a note), D3 (queued and in-progress both count as running: 2,0,1,1,4), D4 (a missing note and a 404 release raise no banner), the release read from its own repo, B8 (buildersOf). Changed on purpose in the suite: S4 (4 reads + 5 lookups), E1 (4 sent), S2 (4 builders), H3 (4 rungs), fixtures `pushes` replaced by `heads`.
- I could not open Antnioo/dataarcus-releases from this session (not attached): the repo name is the reviewer's.

## Seen, not in scope
- scripts/tests/site.mjs runs more than 10 minutes alone on this machine (one job); not changed.
- npm audit reports advisories in the dev tree (existing).

## Lessons for the reviewer
- check-min.mjs and csp.mjs read `git ls-files`: `git add` the new .js/.min.js/page first (the lesson was right).
- A reviewer message that replaces the look mid-job costs a rebuild: send the final look in the brief.
- A `since=<now minus 24h>` in an API address defeats ETags; keep addresses constant.

## Plan (as first committed)
1. Red first: suite `build-page` with recorded made-up GitHub answers.
2. `assets/js/build-page.js` reader; `build/index.html`; per-page CSP rule; site-config rule for /build/.
