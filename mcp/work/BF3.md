# BF3 (0.3.2): the build page says exactly what it sends

## Summary
**State:** CI running
- **Approval:** the owner, 8 Nov (D-1108-14, B-397): the /build/ page ships with 0.3.2; Codex release-delta-032 section 3 asks for the one promise to be exact.
- **Base:** `fix/0.3.2-bf3` from `origin/integration/0.3.2`.
- **Scope:** `build/index.html` (one sentence, and its policy line), `scripts/csp.mjs` (this page's connect-src only), `scripts/tests/build-page.mjs`, this note, one WORK.md line.
- **Expected checks:** suite `build-page` stays green with new checks: connect-src lists exactly the two GitHub hosts (red first on the base), the sentence is exact, and a real-browser run sees no same-origin fetch/XHR by script. Lint exit 0, csp.mjs, test-site-config pass; CI green.
- **Resume:** start at "Plan".

## Plan
1. Record in Chromium which script-initiated requests (fetch, xhr) the page makes: expected only api.github.com and raw.githubusercontent.com. If so drop 'self' from this page's connect-src.
2. Sentence becomes: "Your browser reads the public GitHub repository directly. DataArcus stores nothing and receives nothing from this page."
3. Test first (red), then change csp.mjs, run csp.mjs --write, change the sentence.

## Before -> after
- Before: page sentence "Nothing is stored, nothing is sent."; connect-src 'self' + GitHub. After: "Your browser reads the public GitHub repository directly. DataArcus stores nothing and receives nothing from this page."; connect-src lists exactly api.github.com and raw.githubusercontent.com.
- Check 1 (real Chromium, Playwright): F3 records every fetch/xhr/ping/websocket/eventsource request of a full page load: all went to api.github.com or raw.githubusercontent.com, none same-origin. So 'self' was dropped (csp.mjs, this page only, via the existing `gh` flag).
- Tests: build-page 80 -> 83 checks (F1, F2, F3 added; P1's connect-src regex changed on purpose: no 'self'). F1 and F2 red on the base (28073f3c) first; F3 passed on the base (it proves the fact, not a fix). Run alone: PASS 83 checks. csp.mjs, test-site-config, sitemap-lastmod pass; root `npm run lint` exit 0.

## CHANGELOG line
None: website only.

## Decisions I made
- Only the sentence's own text changed; the page stays English only.
- The fonts and three.js are loaded by tags (font-src, style-src, script-src), not by script requests, so they are not in connect-src; the sentence says "this page" sends nothing to DataArcus (font and script hosts see ordinary page loads, as the policy lists).

## For the owner
- none

## Risky changes
- Network/security policy: /build/'s connect-src loses 'self' (narrower, only this page; every other page's policy unchanged, csp.mjs reports all 140 pages current). Why: the page's scripts fetch only from GitHub (F3).

## For the laptop
- none

## Seen, not in scope
- Google Fonts and jsDelivr still see the visitor's IP on a page load (the sentence is about DataArcus, as the brief asks).

## Lessons for the reviewer
- The brief's test count: P1's old regex pinned 'self'; a csp change on one page needs that pin updated on purpose.
