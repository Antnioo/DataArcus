# BF3 (0.3.2): the build page says exactly what it sends

## Summary
**State:** IN PROGRESS
- **Approval:** the owner, 8 Nov (D-1108-14, B-397): the /build/ page ships with 0.3.2; Codex release-delta-032 section 3 asks for the one promise to be exact.
- **Base:** `fix/0.3.2-bf3` from `origin/integration/0.3.2`.
- **Scope:** `build/index.html` (one sentence, and its policy line), `scripts/csp.mjs` (this page's connect-src only), `scripts/tests/build-page.mjs`, this note, one WORK.md line.
- **Expected checks:** suite `build-page` stays green with new checks: connect-src lists exactly the two GitHub hosts (red first on the base), the sentence is exact, and a real-browser run sees no same-origin fetch/XHR by script. Lint exit 0, csp.mjs, test-site-config pass; CI green.
- **Resume:** start at "Plan".

## Plan
1. Record in Chromium which script-initiated requests (fetch, xhr) the page makes: expected only api.github.com and raw.githubusercontent.com. If so drop 'self' from this page's connect-src.
2. Sentence becomes: "Your browser reads the public GitHub repository directly. DataArcus stores nothing and receives nothing from this page."
3. Test first (red), then change csp.mjs, run csp.mjs --write, change the sentence.
