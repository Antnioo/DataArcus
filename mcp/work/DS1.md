# DS1 (0.3.1): four public sentences stronger than the truth

## Summary
- **Approval:** the reviewer's brief, 25 Oct: an outside fact-check of dataarcus.com and the docs found 4 sentences
  stronger than the truth; the reviewer verified each. Public text only.
- **Scope:** the licensing guide (list2_2), the homepage FAQ (faq.items.7.a), the MCP page (beta.safe.data, beta.new.l1,
  beta.req: one new line for the other clients) in EN and AR (HTML, translations, ar/ copies re-rendered);
  `mcp/test-0.3.0-claims.mjs` (DS1 block). Not mcp/lib, mcp/tools, PRIVACY.md or ARCHITECTURE.md (AF1, AF2).
- **Base:** `fix/0.3.1-public-wording` from `origin/integration/0.3.1` (64bce5b). Push only this branch.
- **Expected checks:** `0.3.0-claims` 480 -> about 500 (red first, then PASS); `test-arabic-terms` 87 PASS; site
  config, csp, ar-pages, check:min, sitemap-lastmod PASS; run-all site, spacing, text-align, lang-switcher PASS;
  test-whats-new PASS; check-agent-memory PASS.
- **Resume:** plan pushed; next the red test, then the sentences.

## Plan (before any edit)
1. This note, pushed first.
2. Red first: a DS1 block in the claims test: each old sentence banned (EN and AR) from the files that carry it, each
   new sentence and its link required (EN half and AR half of each translations file, and both HTML copies).
3. The sentences:
   1. Licensing list2_2 "PPU or capacity removes both limits." -> "PPU or capacity raises both limits: PPU allows models
      up to 100 GB and 48 scheduled refreshes a day; on a Fabric capacity the model size depends on its SKU, with 48
      scheduled refreshes a day", linked to Microsoft Learn (service-premium-per-user-faq: "Model size limit 100 GB",
      "Refresh rate limit per semantic model 48/day"; powerbi-implementation-planning-subscriptions-licenses-trials:
      "Varies by capacity SKU", "48 per day"; read 25 Oct).
   2. Homepage FAQ 7 and the MCP page's beta.safe.data: "never returns data values" / "structure, not the rows" made
      exact as PRIVACY.md section 3 says: names and structure, the short texts typed on report pages (which can hold a
      figure or a name); never table rows, filter or slicer values, or bookmark states; PRIVACY.md section 3 linked.
   3. beta.new.l1 "Arabic reports with no English titles." -> "Arabic titles in Arabic reports, even from an
      English-named model", and "anything kept in English is listed, with why, before you approve".
   4. beta.req: one line: Claude Code, VS Code (agent mode) and Cursor from a clone, on Windows, macOS or Linux, linked
      to mcp/README.md "Other MCP clients and platforms"; tried as the README says (Claude Code on Linux; VS Code and
      Cursor not yet); the one-click .mcpb stays Windows.
4. build:min, check:min (new ?v= stamps), csp --write, ar-pages --write, the checks above, sitemap-lastmod after commit.
