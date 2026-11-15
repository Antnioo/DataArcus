# GC4 (0.3.3): take the Call Center dashboard off the public website (D-1115-05)

## Summary
- **Approval:** D-1115-05 (15 Nov) "yes remove the call center shots and from the gallery"; D-1103-08 (3 Nov) "i am done with this call center dashboard take it off the test".
- **Base:** `fix/0.3.3-gc4` from `origin/integration/0.3.3` at 103097b2. Push only this branch; never merge, no PR.
- **Scope:** website files only. Remove the two pages, callcenter translations, og image and three portfolio images; remove the card, JSON-LD item, texts, route, sitemap entries and share image; the two old addresses become small redirect pages to the portfolio (go/ pattern: meta refresh, canonical to the portfolio, noindex, plain link), not in sitemap.xml; tests changed on purpose and one new check added. Not touched: mcp/, other dashboards, code comments in assets/js/mirror-*.js and report-mirror.js that name Call Center as a measured case.
- **Expected checks:** `node scripts/check-modules.mjs --strict`, site suites via run-all, `node scripts/csp.mjs`, `node scripts/ar-pages.mjs`, `node scripts/test-site-config.mjs`, `node scripts/test-sitemap-lastmod.mjs`.
- **Resume:** see the end of this note.

## Plan and expected numbers
- Portfolio grid: 7 cards now, 6 after (two full rows of 3 on desktop; 2 columns on tablet, 3 rows; one column on phone), English and Arabic.
- sitemap.xml: 79 `<url>` entries now, 77 after (both Call Center pages out).
- scripts/tests/site.mjs: REPORTS list loses the Call Center entry on purpose; scripts/test-sitemap-lastmod.mjs: UNCHANGED list loses it on purpose (its page no longer exists to date).
- New check (red on 103097b2 first): no page links to the removed dashboard; the two old addresses reach the portfolio.

## Status
Planned at 2026-11-15T10:20Z. Work not started.
