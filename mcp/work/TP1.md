## Summary
- **Approval:** D-1105-17 (5 Nov, the owner: "2 yea"): the approval page's preview also draws the tooltip pages the
  click writes (A-AP1-2), not only names them. The brief "TP1 (0.3.2)" (5 Nov).
- **Base:** `fix/0.3.2-tp1` from `origin/integration/0.3.2` at 4f8da4a7 (Merge LG1). Push only this branch; never
  merge, no PR.
- **Scope:** the one place the preview's pages are chosen (`assets/js/page-preview.js` fromFiles: an opt-in
  `tooltips` option), its two MCP callers (`mcp/lib/plan-lint.mjs` planPreview, `mcp/lib/twin-preview.mjs`), and the
  approval page that draws them (`mcp/lib/approval-view.mjs`). The website's own preview is not changed (the option is
  off by default). No change to what is written, to the plan digest or to the gate.
- **Plan (one commit each):**
  1. This note.
  2. A failing test first: A11 in `test-0.3.0-approval-complete.mjs` (AP1's made-up Service model, whose click writes
     two tooltip pages): the preview shows one picture per tooltip page, at its own size (320 x 284 page units, drawn
     320 x 284), captioned as a tooltip page, after the report pages, within the cap; plus a unit check of the cap.
  3. The change, then sp23/sp44 re-recorded with SP23_RECORD / SP44_RECORD after a dump of the base's pages and mine.
- **Expected checks:** approval-complete 54 -> 54 + A11's (about 10); preview 71 -> 71 (fromFiles' default as on the
  base); sp23 29 -> 29 and sp44 23 -> 23 (the hashes of the pages with tooltip pages re-recorded, said below); sp1 11,
  sp2 10, sp4 5 unchanged; lint 0; check-agent-memory, check-modules, check-result-lines, changelog-words green.
- **Resume:** step 1 committed; next the red test.

## How the preview gets its pages today (base 4f8da4a7)
- plan_layout (`mcp/tools/plan_layout.mjs` previewOf) calls `planPreview` (`mcp/lib/plan-lint.mjs`) with the exact
  artifact's files; planPreview calls the shared renderer's `fromFiles` (`assets/js/page-preview.js`), which keeps a
  page only when `type !== 'Tooltip'` and it is not `HiddenInViewMode`: that filter is the one place the pages are
  chosen. planPreview then maps each drawn page to the inventory's shown pages by index for the layout flags.
- The twin and the EN-AR copy: `twinPreview` (`mcp/lib/twin-preview.mjs`) un-hides the copy's hidden pages, then the
  same `fromFiles` drops the tooltip pages ("tooltip pages are not, as on the report's page").
- `approval-view.mjs` askPage draws `previews.pages` (or `pairs` for the copy), at most `PREVIEW_PAGES_MAX` (12)
  pages or pairs, each 800 px wide (`render(p, { width: 800 })`, CSS `width:100%`), the rest counted in one line.
- AP1's `pagesWritten` (plan-lint.mjs) names every page, tooltip pages too, in "What each page holds"; not drawn.
- A tooltip page's size: Power BI's tooltip canvas (the "Tooltip" page size is 320 x 240); DataArcus's writer
  (`assets/js/pbip-tooltip.js` tipPage) writes 320 wide and 284 high or the measured rows' height (187, 287). The
  page.json's width and height are what fromFiles reads, so each tooltip page is drawn at its own size.
