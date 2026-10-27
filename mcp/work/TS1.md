# TS1 (0.3.1, the owner, 27 Oct): FHD text x 1.25, and the gap beside a shortened rail

## Summary
- **Approval:** the reviewer's brief "Go on TS1"; the owner, 27 Oct (D-1027-16): "no go for 1.25 in 0.3.1" (FHD text
  sizes x 1.25 from the 1280 x 720 sizes, not x 1.5; from Codex's text-sizes review, dataarcus-exchange
  results/2026-10-26-text-sizes/REPORT.md and sizes.csv). And the owner's yes of 26 Oct to 0.2.9-writer-S10 (SQ13-S3),
  SQ13's option (a): REFLOW_KEEP 0.5 -> 0.45.
- **Scope:** `assets/js/design-engine.js` (+ .min.js; new `?v=` on every page that loads it and in theme-generator.js's
  builder list): one constant `FHD_TEXT = 1.25` and the page's text factor `textScale(h)` that `sizeAt` reads;
  `themeScaleOf` gives the theme's factor; REFLOW_KEEP 0.45. `mcp/lib/report-run.mjs`: create_report rescales one of
  our themes by the text factors, not by the page heights. A new suite `mcp/test-0.3.1-ts1.mjs` (+ tests.json), the
  tests that pin a 1.5 size or the 197 gap (each said below), a lab page for the laptop, CHANGELOG, WORK.md, this note.
- **Base:** `fix/0.3.1-text-125` from `origin/integration/0.3.1` (d6d3159). Push only this branch.
- **Expected numbers (before the work):** the theme on 1920 x 1080: label, table, slicer 15 -> 12.5; title, header,
  multi-row card title 18 -> 15; callout and card value 42 -> 35; multi-row card values 27 -> 22.5. 1280 x 720 unchanged
  (10, 12, 28, 18). 1366 x 768 (factor 1.033): 10.5, 12.5, 29, 18.5. 3840 x 2160 (factor 2): 20, 24, 56, 36. Pills at
  12.5pt: 76 high (the measured 72 + 4), never below the measured 72. The KPI title gaps 26 / 17 unchanged (page, not
  text). S10's gaps: 392, 308, 329, 245 unchanged; the second page's 197 -> 18 (one row gap; the column chart 347 ->
  168 high, the rows under it up 197).
- **Expected checks:** the new suite about 25 checks, red first on d6d3159; `design`, `sq13` S10, golden, layout and
  phone suites: every changed number said below, task by task; `run-all` design-engine, theme-generator, pbip; full run
  +1 suite, all PASS.
- **Resume:** the plan below; then the work.

## The plan
1. `FHD_TEXT = 1.25` (the owner's D-1027-16, Codex's review) in the theme's text block of design-engine.js. The text
   factor of a page h high: `textScale(h) = 1 + (h / 720 - 1) x (FHD_TEXT - 1) / 0.5`, a straight line through 1 at 720
   and 1.25 at 1080 (so 2 at 2160, 0.75 at 360). `sizeAt` reads it; sizes stay half points within 8-60 (as before:
   Power BI takes half points, and rejects a theme with one size outside 8-60).
2. Every reader of the 1.5: list each place (`rg "1\.5"`, `/ 720`), say what follows the theme (most of the writer
   reads the theme's own sizes: pbip-page.js themeSizes) and what stays measured.
3. Saved designs: the website stores no text-size version (layout `v` is the layout's own migration), so a saved
   design takes 1.25 when its theme is built again; said in the CHANGELOG line. The MCP: generate_theme, plan_layout and
   create_report take the new sizes; redesign and the twin copy the original theme's text classes as they are.
4. Tests red first; then the lab page (x 1.25 next to x 1.5) and "For the laptop".
5. S10: REFLOW_KEEP 0.45, sq13 S10's target [392, 308, 329, 245, 18].
