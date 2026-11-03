# ED1 (0.3.2, the site): the last em dashes (B-255) and the Health Check article's layout shift at phone width (B-292)

## Summary
- **Approval:** the reviewer's brief "ED1" (3 Nov); the owner D-1016-01, D-1102-02, D-1103-09, D-1027-15 (no new em
  dashes, the old ones cleaned after 0.3.1). Backlog B-255, B-292 (the night audit's AUD-048).
- **Base:** `fix/0.3.2-ed1` from `origin/integration/0.3.2` at 0c6ad5d. Push only this branch; never merge. Website only.
- **B-255, found on the base** (`git grep` for U+2014 outside mcp/work/ and mcp/CHANGELOG.md): the 5 lines of the brief
  plus 2 it did not list: `scripts/tests/lib.mjs:89` (a comment) and `mcp/lib/redesign.mjs:59` (a regex that strips a
  trailing dash from a title: MCP code, another builder's; kept, listed in the gate as the one allowed file, Seen).
  Bootstrap's vendor CSS and its .map hold one each (not ours; the gate skips `assets/css/vendor/`).
  - The article's dash (EN and AR, page and translations) is inside a word-for-word quote of Microsoft's
    bi-directional guidance ("All one-to-one relationships must be bi-directional", an em dash, "it isn't possible to configure otherwise", checked on
    learn.microsoft.com today). The quote stays exact: written `&mdash;` (the same character on screen), and the gate
    allows the entity only inside that quote.
  - arabic-calendar.js (a comment): the quoted dash becomes "a dash"; pl300-bank/build.js (the bank's own guard):
    its regex names the character by its escape (`\u2014`, the same test, no literal character); lib.mjs's comment: a colon.
- **The gate:** `scripts/test-site-config.mjs` (runs in CI, tests.yml "site config") gains one check: every tracked text
  file (pages, translations, scripts, CSS, JSON, Markdown, YAML) outside mcp/work/, mcp/CHANGELOG.md and
  assets/css/vendor/ has no U+2014, and no page or translation writes it as `&mdash;`/`&#8212;`/`&#x2014;` outside
  the quote above. Its PASS line names the files it read.
- **B-292, measured on the base** (Playwright 1.63, Chromium 1243, 390 x 844, Inter served 500 ms late as site.mjs
  does, 5 runs): CLS 0.103, 0.103, 0.103, 0.103, 0.104 (5 of 5; 0 with no web font). One shift at about 700 ms: the
  intro's second paragraph (content.p2), its text moving 29 px up. **Cause: the font swap**, on one line. The fallback
  ("Inter Fallback", style.css:36-56) is within 0.07% of Inter over the whole paragraph (3,028.92 vs 3,026.89 px), but
  the first line "So we built a free Power BI Model Health Check." is 365.88 px in Inter in a 366 px column: it fits by
  0.12 px, so the fallback (369.27 px) wraps "Check." and the swap pulls the paragraph up one line. No image or script.
- **Fix:** the words, not the fallback (any fallback misses 0.12 px): the first sentence starts "That is why we built a
  free ..." (EN page and translation; the AR text is not touched, AR measured too), so line 1 breaks in the same place in
  both fonts. To check at 360, 375, 390, 414 px: no line of the article's body re-wraps on the swap.
- **The check:** `scripts/tests/site.mjs`'s web-font swap test (AUD-002) gains the page: CLS 0.1 or less at 1440 and
  390 px (+2 checks), the same measure as its other pages.
- **Expected:** site suite +2 checks, green; site config PASS with the new check (fails on the base: 7 lines);
  `npm run -s build:min` changes 2 .min.js (best-practice-exceptions and health-check translations) with a new ?v=
  on every page that loads each; lint 0; claims and changelog-words green; sitemap-lastmod --write after the last commit.

## Plan
1. This note (commit, push). 2. B-255 edits + the gate. 3. B-292 words + the site.mjs check. 4. build:min, ?v= stamps,
suites, lint. 5. Merge the integration branch once if it moved, CI, the note's result, sitemap-lastmod.

## Got
(after the work)

## CHANGELOG line

## Decisions I made

## For the owner
none

## Risky changes
none

## Seen, not in scope

## For the laptop
none

## Lessons for the reviewer
