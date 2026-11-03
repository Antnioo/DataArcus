# ED1 (0.3.2, the site): the last em dashes (B-255) and the Health Check article's layout shift at phone width (B-292)

## Summary
- **Approval:** the reviewer's brief "ED1" (3 Nov); the owner D-1016-01, D-1102-02, D-1103-09, D-1027-15 (no new em
  dashes, the old ones cleaned after 0.3.1). Backlog B-255, B-292 (the night audit's AUD-048).
- **Base:** `fix/0.3.2-ed1` from `origin/integration/0.3.2` at 0c6ad5d. Push only this branch; never merge.
- **Scope:** website only. B-255: `git grep` for U+2014 outside mcp/work/ and mcp/CHANGELOG.md found the brief's 5
  lines plus 2 it did not list (`scripts/tests/lib.mjs:89`, a comment; `mcp/lib/redesign.mjs:59`, MCP code, kept: Seen)
  and Bootstrap's vendor CSS and .map (not ours, skipped). The article's dash (EN and AR, page and translations) is
  inside a word-for-word quote of Microsoft's bi-directional guidance (checked on learn.microsoft.com today): kept
  exact, written `&mdash;` in the sources (the generated AR copy holds the character: ar-pages.mjs saves what the
  browser serialises). arabic-calendar.js's comment says "a dash"; pl300-bank/build.js's own guard names the
  character by its escape (`\u2014`, same test); lib.mjs's comment takes a colon.
  The gate: `scripts/test-site-config.mjs:89-113` (CI tests.yml:83, "site config"): every tracked text file outside
  mcp/work/, mcp/CHANGELOG.md and assets/css/vendor/ has no U+2014 (redesign.mjs: its one allowed), and no page or
  translation writes `&mdash;`/`&#8212;`/`&#x2014;`; the quote (`QUOTED`) is allowed in either form. Base: FAIL, 3 lines.
  B-292, measured on the base (Playwright 1.63, Chromium 1243, 390 x 844, Inter 500 ms late as site.mjs serves it,
  5 runs): CLS 0.103, 0.103, 0.103, 0.103, 0.104 (0 with no web font). One shift at about 700 ms: content.p2's text,
  29 px up. **Cause: the font swap** on one line. The fallback ("Inter Fallback", style.css:36-56) is within 0.07% of
  Inter over the paragraph, but its first line was 365.88 px in Inter in a 366 px column: the fallback (369.27 px)
  wrapped "Check." and the swap pulled the paragraph up a line. No image, no late script.
  Fix, the words: "So we made a free ... on a model that anyone can download ... one of Microsoft's public samples"
  (EN page and translation; the AR text untouched). A sweep of 37 wordings at 15 widths (320 to 1920 px) compared each
  word's line in Inter and in the fallback: the original differed at 390, 393, 414; my first try ("That is why we
  built") moved the problem to 1440-1920 (CLS 0.058 and 0.101 there); the chosen one differs at none.
  The check: `scripts/tests/site.mjs`'s font-swap test (AUD-002) gains the page at 1440 and 390 px, 0.1 or less.
- **Expected checks:** site 622 -> 624; site config PASS with the new check (FAIL on the base); 2 .min.js
  rebuilt, each with ?v=20261103a on its 2 pages; lint 0; changelog-words, 0.3.0-claims green.
- **Got:** after the fix (5 runs each, Inter late): 320 px 0-0.004, 360 0, 390 0, 414 0.001-0.003, 1440 0.002; AR 390 0.
  site config PASS (1373 files); check-min: every changed .min.js has a new stamp; lint 0; changelog-words 439,
  0.3.0-claims 688; site 624 (base 622), anchors 120; ar-pages 38 copies match.
- **CI:** run 41682703224 on 8ce314a: all green but website-suites (1): ar-pages.mjs, the AR copy I had edited by hand
  (`&mdash;`) differs from a fresh render (the character). Fixed: `ar-pages.mjs --write`, QUOTED takes both forms.
- **Resume:** done when CI is green on the branch (the line below).

## CHANGELOG line
- **The website, steadier and plainer:** the Model Health Check article no longer jumps when its font arrives on a
  phone, and the site's own pages and scripts no longer use the long dash (a quote of Microsoft's guidance keeps it).

## Decisions I made
- The Microsoft quote keeps its dash as `&mdash;`: the brief says keep a quote exact; the entity shows the same
  character and the gate allows it only inside that one quote.
- The gate is in site config (every website change runs it, rule 2026-10-06) and covers the whole repository's text
  except the job notes, the changelog's history and vendor files, so MCP code is covered too (one named exception).
- B-292 fixed by the words, not the fallback: no fallback font matches every line to 0.12 px; three words changed,
  chosen by measuring every word's line in both fonts at 15 widths.

## For the owner
- The Health Check article's intro now reads "So we made a free Power BI Model Health Check. To show what it finds on
  a model that anyone can download ... one of Microsoft's public samples" (was "built", no "that", "own"). Meaning
  unchanged; my recommendation: keep it (it is what stops the phone-width jump).

## Risky changes
none

## Seen, not in scope
- `mcp/lib/redesign.mjs:59` holds a literal em dash in a regex (strips a trailing dash from a title): MCP code, another
  builder's area. Writing it `\u2014` would let the gate drop its one exception.
- Any English article can meet the same swap on a line that fits Inter within about 1%: the font-swap test covers 4
  pages; a sweep like this note's over every article would find the others before a visitor does.

## For the laptop
none

## Lessons for the reviewer
- The /ar/ pages are generated (ar-pages.mjs): after an EN page with an AR copy changes, `ar-pages.mjs --write`, never
  a hand edit; CI's website-suites shard 1 runs the check first.
- A layout shift from a font swap is a per-line near-fit, not a bad fallback: measure every word's line in both fonts at
  many widths; fixing one width by rewording can move the problem to another (here 390 to 1440).
