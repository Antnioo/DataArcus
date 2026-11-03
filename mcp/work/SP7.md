# SP7 (0.3.2, the split): assets/js/pbip-page.js -> pbip-tooltip.js (the tooltip pages; behaviour identical)

## Summary
- **Approval:** the reviewer's brief "SP7" (3 Nov); the owner D-1016-01, D-1102-02, D-1102-04. Backlog B-280, B-286
  (the Codex split map: "Extract pbip-tooltip.js first, then pbip-navigation.js ..., then pbip-visuals.js").
- **Base:** `feat/0.3.2-sp7` from `origin/integration/0.3.2` at 90eaa7c. Pushed only this branch; never merged.
- **Scope:** new `assets/js/pbip-tooltip.js` (`DAPbipTooltip`): the tooltip pages' builder, explicit read-only inputs
  (the theme, the metrics, the binding, the direction, the look and the measure helpers), one page at a time: the page
  JSON and its visuals' JSON plus diagnostics, no file written, no visual named. pbip-page.js's `tooltips(c)` stays on
  its API as the page assembly: it asks for the pages (tipFor), names each visual (rnd) and adds the files, in the
  same order as before (the random ids and the report measures come out in the same sequence). Nothing else moves.
  Website: pbip-tooltip.min.js in theme-generator.js's BUILDER before pbip-page (lazy; no page loads pbip-page by a
  script tag: checked). MCP: pbip-export.js requires pbip-page.js, which requires pbip-tooltip.js (no MCP file changes).
- **Plan:** (1) characterise on the base: MCP suite `sp7` (area report) and website suite `sp7`, both recorded on the
  base code; (2) move; (3) the same records pass unchanged; min files, stamps, csp, ar-pages, sitemap.
- **MCP suite sp7 (test-0.3.2-sp7.mjs):** 8 runs of plan_layout, approve_plan, create_report (SP3's seed module, the
  random ids fixed): EN and AR, glass and plain, 1920 x 1080 and 1280 x 720, a report with no tooltip card (the empty
  tooltip page), the twin fixture and a tiny made-up model; T1-T8 each run's answer and every written file's bytes
  (sha256); C1 the runs cover the tooltip paths (the Top 6, the 6-month and 12-month trends, the Arabic title, the
  empty page, the mirrored bars, both page sizes). **Expected: 9 checks on the base.** After the move M1 (pbip-page's
  tooltips uses pbip-tooltip, which holds no file writer and no rnd) and M2 (BUILDER: pbip-tooltip once, before
  pbip-page): **sp7 11 after.**
- **Website suite sp7 (scripts/tests/sp7.mjs):** the lab theme generator page ?lang=en and ?lang=ar, the random source
  seeded and the clock fixed (SP5's way), another layout than sp5's (analysis, 1280 x 720): every non-image file
  byte-identical to the record and the ZIP container the writer's ZIP of its entries. **Expected: 2 on the base, 3
  after** (W3: pbip-tooltip loaded before pbip-page).
- **Before -> after:** `assets/js/pbip-page.js` 1631 -> about 1530 lines; `pbip-tooltip.js` about 140 (new).
- **Expected checks:** sp7 9 on the base, 11 after; website sp7 2 on the base, 3 after; every other suite unchanged.
- **State:** the plan (this commit).
- **Resume:** the characterisation suites on the base.
