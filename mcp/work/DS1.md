# DS1 (0.3.1): four public sentences stronger than the truth

## Summary
- **Approval:** the reviewer's brief, 25 Oct: an outside fact-check (25 Oct) found 4 sentences stronger than the truth;
  the reviewer verified each. Public text only.
- **Scope:** licensing guide list2_2; homepage faq.items.7.a; MCP page beta.safe.data, beta.new.l1, beta.req (EN, AR,
  translations, ar/ copies); `mcp/test-0.3.0-claims.mjs` (DS1 block). Not mcp/lib, mcp/tools, PRIVACY.md, ARCHITECTURE.md.
- **Base:** `fix/0.3.1-public-wording` from `origin/integration/0.3.1` (64bce5b). Push only this branch.
- **Expected checks:** claims 480 -> about 500, red then PASS. **Got:** 480 -> 576 (red 56b4932: 64 failed) -> 576 PASS;
  every other check PASS (see "Results").
- **Resume:** done; waits for the reviewer. Nothing needs Desktop.
- 1 Licensing: "PPU or capacity removes both limits." -> "PPU or capacity raises both limits: PPU allows models up to
  100 GB and 48 scheduled refreshes a day; on a Fabric capacity the model size depends on its SKU, with 48 scheduled
  refreshes a day (Microsoft Learn: Premium Per User, Pro, PPU and Fabric capacity compared)." AR «ويزيد PPU أو السعة
  كلا الحدّين: ...». Source: learn.microsoft.com service-premium-per-user-faq (100 GB, 48/day) and
  powerbi-implementation-planning-subscriptions-licenses-trials ("Varies by capacity SKU", 48 per day), read 25 Oct.
- 2 Metadata: homepage "It reads your model's structure, not the rows in it ... (tables, columns, measures, formats), not
  the rows in it" and MCP page "never returns data values from your model to Claude" -> "Claude gets your model's
  structure, never the rows in it ... your model's and report's names and structure ..., and the short texts typed on
  report pages (titles, text boxes), which can hold a figure or a name; never table rows, filter or slicer values, or
  bookmark states", PRIVACY.md linked (MCP page: section 3, `#3-metadata-only-no-data-values`). Source: PRIVACY.md 2-3.
- 3 MCP page l1: "Arabic reports with no English titles." / "the plan lists any field kept in English" -> "Arabic titles in
  Arabic reports, even from an English-named model." / "Anything kept in English is listed, with why, before you
  approve." AR «عناوين عربية في التقارير العربية، حتى من نموذج بأسماء إنجليزية». Source: PRIVACY.md (twin
  `notTranslated`, plan `terminology`).
- 4 MCP page: new line beta.req.clients: Claude Code, VS Code (agent mode) or Cursor from a clone, Windows, macOS or
  Linux, "setup notes" linked to mcp/README.md "Other MCP clients and platforms (developers)", "(Claude Code tried on
  Linux; VS Code and Cursor not yet tried). The one-click .mcpb is for Windows." Source: mcp/README.md lines 102-150.

## Results
Commits: 254d261 plan; 56b4932 red; 17f78ff the sentences (pages, translations, .min.js, ar/ copies, stamps); then sitemap and this note.
test-arabic-terms 87 PASS; whats-new 167 PASS; ar-pages 38 copies PASS; csp PASS; site config 78 pages PASS; check:min
74 files PASS (stamps `20261025ds1` on the three changed translations, both copies of each page).
run-all: site 483 PASS (after the homepage link fix, decision 6; 4 failed before it), spacing 1074, lang-switcher 1442,
text-align 474 PASS (run before that one-attribute fix). sitemap-lastmod --write after 17f78ff: 6 URLs (the three pages, EN and AR) to 2026-10-26
(Dubai date). check-agent-memory PASS.

## CHANGELOG line
None: the website's text, not the MCP.

## Decisions I made
1. "Windows only." (beta.req.windows) would contradict the new clients line: now "Windows for the one-click install;
   Power BI Desktop, which opens the reports, runs only on Windows." (the README's own words), EN and AR.
2. The homepage's bold lead changed to "Claude gets ..., never the rows" so the promise reads as what is sent, not read.
3. AR homepage: «المقسمات (Slicers)» at its first use, as E2's rule asks (test-arabic-terms failed without it).
4. The licensing article's translations script had no ?v= stamp: given one (`20261025ds1`), both copies.
6. The homepage keeps its plain PRIVACY.md link (no `#3-...` anchor): `scripts/tests/site.mjs` reads the FAQ link as
   ending in `mcp/PRIVACY.md` and failed with the anchor (4 checks); the test was not changed. The MCP page links section 3.
5. The AR Learn links use `ar-sa`, as GC2 did; the claims check counts 96 new checks, not ~20 (each sentence is checked
   on the HTML and the translations half, EN and AR).

## Seen, not in scope
Status of these items: [mcp/work/SEEN-QUEUE.md#ds1](SEEN-QUEUE.md#ds1)
1. MCP page hero, meta descriptions and beta.hero.facts still say "in Claude Desktop" / "Windows, with Power BI Desktop
   and Claude Desktop": true of the one-click path, but read as the only client.
2. Homepage FAQ 7 also says "in Claude Desktop" (kept: the one-click path).
3. The licensing guide's other Pro limits (1 GB, 8 a day) match Learn; the rest of the article was not re-checked.
4. The MCP page's PRIVACY.md and README links point at `main` on github.com/Antnioo/DataArcus: they work only while the
   repo is public (K1), and the README section anchor is checked only by eye.
