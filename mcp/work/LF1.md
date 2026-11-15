## Summary
- **Approval:** the reviewer's hub (session_015Q77oNR7YVFznptSuZoZZ2) routing the night audit's AUD-074 and AUD-075 under D-1112-03 (G1, G2); D-1111-17 (the page ships in English, its Arabic held); D-1112-05 (no Arabic sentence added); D-1104-12 (one place for the held list).
- **Base:** origin/integration/0.3.3 be7d39cd (branch fix/0.3.3-lf1).
- **Scope:** tools/gulf-like-for-like.html only jumps no more on load (AUD-074: reserve the filled size, a CLS check of the tool pages at 1440 and 992); a page in AR_HELD stays English left to right whatever the saved language, /tools/?lang=ar hides a held page's card, /ar/tools/'s ItemList counts its visible cards (AUD-075). No new Arabic words.
- **Expected checks:** `node scripts/check-modules.mjs --strict`; `node scripts/csp.mjs`; `node scripts/ar-pages.mjs`; `node scripts/test-site-config.mjs`; site suites tools, gulf-like-for-like, lang-switcher, sp36, site.
- **Resume:** done but for CI; the state is under "For the reviewer".

## Plan (2026-11-13T04:13Z, before any code)
1. AUD-074. Measured on be7d39cd (scratch script, lib.mjs's visitor, 5 loads per width, page at ?lang=en, worst load): CLS 1920 0.113, 1440 0.201, 1280 0.217, 992 0.313, 768 0.131/0.132, 390 0. The shift entry names #lfDetail (y 428 -> 454), #lfYearWrap (487 -> 802) and the notes. No pre-render step exists in the site's scripts (grep "prerender", "pre-render": none), and the default month is the visitor's current month, so a build-time render would go stale: reserve the size instead. Filled heights measured for every month of 2026 and 2027 (UAE, the default country): #lfDetail 332 px at 576 px and wider in 20 of 24 months (355 or 400 in 4); #lfYearWrap 550 px from 577 to 1920; #lfVerdict 81 to 132 px (2 to 4 lines). Reserve: #lfDetail min-height 332 px, #lfYearWrap 550 px (both 577 px and up), the verdict 3 lines at 1200 px and up and 4 below. Expected after: CLS at most 0.1 at every width above, worst near 0.01.
2. Test: tools.mjs's CLS check (AUD-001) gains the page and 992 px, seen red on be7d39cd first. Other tool pages at 992 measured on the base: svg-kpi-designer 0.125 (above 0.1), the rest 0.068 or less; a check at 992 for every tool page is red there too, so that page is fixed in this job (R-28) or the reason is written.
3. AUD-075. lang-manager.js: a page in LocaleRoutes.AR_HELD is English (no saved choice changed, no switcher); the held page carries no Arabic head guard, and ar-pages.mjs's check says a page has the guard exactly when it is not held (the list read from AR_HELD only). /tools/?lang=ar: `html[lang="ar"] [data-ar-held]` hidden in the shared stylesheet; ar-pages.mjs's render drops a held page's ListItem from the copy's JSON-LD (9 -> 8). Rendered checks at 390 and 1440 for ?lang=ar and a saved Arabic.

## Before -> after (2026-11-13T05:08Z)
CLS on load, tools/gulf-like-for-like.html?lang=en, 5 loads per width, worst load (scratch script on lib.mjs's visitor, the audit's method; be7d39cd -> this branch):
- 1920: 0.113 -> 0. 1440: 0.201 -> 0.001. 1280: 0.217 -> 0.001. 992: 0.313 -> 0.001. 768: 0.131 (worst 0.132) -> 0. 390: 0 -> 0.
- Every default month (clock set to the 15th of each month of 2026 and 2027, 1 load each): worst 0.008 at 1440, 0.007 at 1280, 0.009 at 992 (March 2027), 0 at 768.
- svg-kpi-designer at 992 (found by the new 992 check): 0.125 -> 0.02 (2 loads); every width 390 to 1440 now 0.074 or less.
- tools.mjs's printed list on this branch, worst first: dax-measure-builder en 992 0.068 (unchanged; was 0.068 on the base).
- /ar/tools/ ItemList: 9 -> 8 items (the 8 cards it shows). /tools/?lang=ar: the held card shown -> hidden.
- A held page with Arabic asked for (?lang=ar or saved): lang="ar" dir="rtl", Arabic menu and footer, a switcher -> lang="en" dir="ltr", English, no switcher, the saved choice untouched.

## CHANGELOG line
none: the like-for-like page is new in 0.3.3 and unreleased (its line is IX4's); the svg-kpi-designer fix is a smaller jump on load at 768 to 1199 px, if the reviewer wants a line: "The SVG KPI Designer no longer jumps on load at tablet and small laptop widths."

## Decisions I made
- Reserve, not pre-render: the site has no pre-render step, and the page opens on the visitor's current month, so a build-time render goes stale within a month. Each box is reserved at its measured filled size (child boxes, not the container: a container reserve left the dates and the year table moving inside it, CLS 0.036 to 0.122 measured).
- `#lfDetail[hidden]` gets `display: none !important`: Bootstrap's `d-flex` (!important) had kept the "hidden" empty box on screen for a month not known; with a reserve it would have been 266 px of nothing (L1 checks it).
- The held page has no language switch (nothing to switch to); lang-switcher.mjs exempts AR_HELD pages like build/, read from locale-routes.js (R-10: this test's set of pages changes on purpose: 1482 -> 1479 checks, the held page's 3). gulf-like-for-like.mjs A1 checks there is none.
- The held list stays in AR_HELD only: lang-manager reads it; the held page simply carries no Arabic head guard, and A1 checks a page carries the guard exactly when it is not held (so un-holding a page turns A1 red until its guard is back).
- ?lang=ar on a held page is not saved (the visitor's choice for other pages is left as it was).
- The hub's rule is in its own inline style (only page with data-ar-held), not style.css (which would restamp every page).
- svg-kpi-designer fixed in this job (R-28): the new 992 check was red on it.

## For the owner
none

## For the reviewer
- Commits: be5657f2 (plan, first), af6e86bf (code), then the note/WORK.md/lang-switcher commit with this line.
- Red on be7d39cd first: tools.mjs (gulf 0.201 at 1440, 0.313 at 992; svg-kpi 0.125 at 992), gulf-like-for-like.mjs L1 (2026-11 0.201/0.313), A1 (lang ar, rtl, switcher, guard present), A2 (card shown 1), A3 (9 items for 8 cards); the test commit alone on the base, the fixes stashed.
- Local, this branch: gulf-like-for-like PASS 111; tools PASS 417; lang-switcher PASS 1479; sp36 PASS 18; site PASS 655; anchors PASS 120; test-site-config PASS; ar-pages PASS (39 copies); csp PASS (143 pages); check-modules --strict PASS 1267; check-contracts PASS 868; check-agent-memory PASS 544.
- Rendered: ?lang=ar on the page at 390 and 1440 seen (English, left to right, no switch); A1/A2 run the same at 390 and 1440 under the page's policy.
- /ar/ copies: ar/tools/index.html (ItemList, the hub style) and ar/tools/svg-kpi-designer.html (the style) rerendered; every /ar/ page restamped for lang-manager.min.js. The held page has no /ar/ copy (R-61).
- R-33: origin/integration/0.3.3 had nothing beyond be7d39cd at 2026-11-13T05:08Z: no merge.

## Risky changes
- lang-manager.js runs on every page; the new branch only acts when the page is in AR_HELD (sp36's 14 recorded sessions pass unchanged).

## For the laptop
none

## Seen, not in scope
- tools/index.html's ItemList order differs from its card order (svg-kpi-designer 8th in the list, 2nd on the page) | route: backlog | size: S | why: not asked; the count was
- dax-measure-builder 0.068 and the theme generators 0.053 to 0.056 at 992: under 0.1, the largest left | route: backlog | size: M | why: under the line
- svg-kpi-designer 768: 0.074 (reserve of 2 lines; the starters wrap differently at 768 to 991) | route: backlog | size: S | why: under the line

## Lessons for the reviewer
- A container min-height does not stop CLS: the children inside still move. Reserve each box the script fills.
- A check over "every tool page" at a new width found a second page (svg-kpi-designer) the audit did not list.

CI green: https://github.com/Antnioo/DataArcus/actions/runs/43370104868 on 8d7e9f52 (Linux and Windows, every website and MCP job green; mcp-macos and mcp-macos-parts are skipped by the workflow itself, as on SW1, so macOS did not run)
