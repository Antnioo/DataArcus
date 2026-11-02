# LC1 (0.3.1, the owner, 27 Oct): the layout canvas after the writer's fit

## Summary
- **Approval:** the reviewer's brief "Go on LC1"; the owner, 27 Oct, D-1027-19 "Both A" (SQ13-S2 in 0.3.1: the
  website's layout preview draws the slots after the writer's fit); D-1027-12 (the previews match what is written);
  D-1027-20 (TT2's Seen 3 and PF1's Seen 1 fixed here); D-1027-21 (after PF1, merged dd6d7ad).
- **Scope:** `assets/js/theme-generator.js` (the layout canvas and the project input, one block), `design-engine.js`
  (encodePng: node:zlib in Node), the lab page's CSS (room under the WhatsApp button), .min.js and `?v=` (lc1 on the
  three generator pages); new suites `scripts/tests/layout-canvas.mjs` (website) and `mcp/test-0.3.1-lc1.mjs`; two
  test changes on purpose (below); CHANGELOG; this note. None of TW1's or CX1's files.
- **Base:** `fix/0.3.1-layout-canvas` from `origin/integration/0.3.1` (dd6d7ad).
- **Expected numbers (before the work; a node probe of the website's input, sample data, default design):**
  1920 x 1080 EN exec, rail at the start: rail 294 x 951 -> 294 x 312; the column chart under it 336,725 771 wide ->
  24,725 1083 wide. 1280 x 720 AR: rail 196 x 634 -> 196 x 225, the column chart 514 -> 722 wide. No rail: nothing
  moves. Header rows: 0 on the website (its download passes no `grow`; the MCP's does). The fit per move: 0.1-1.6 ms.
- **Expected checks:** layout-canvas about 40 (red first on dd6d7ad); lc1 about 8 (red first); theme-generator,
  theme-generator-lab, design-engine, arabic-names, pbip equal; full run the base's suites + 1.
- **Got:** every expected number above, on the written pages (layout-canvas C1/C2, 22 cases). layout-canvas 31 checks:
  red on dd6d7ad first (8 C1, 8 C2, C3; N1 red on dd6d7ad first with the scroll made instant, 3 of 3 targets
  covered), now 31 PASS. lc1 11 checks: red on dd6d7ad first (4 of 11), now 11 PASS. Per move (a slider, 20 moves):
  median 0.7-0.9 ms before (no fit), 1.5-2.3 ms after with the fit, max 3.6-12.7 ms: the fit runs on every move.
  Website: theme-generator 920, theme-generator-lab 920, design-engine 598, pbip 111, arabic-names 14: all PASS.
  A new 1920 x 1080 glass picture (lc1 T, one call in a fresh process): 0.5 s plain, 0.8 s under coverage (PF1's
  before: 0.6 s, 8.5 s). Full run 111 suites (the base's + lc1); end runs arabic-names, pbip, theme-generator PASS.
- **Resume:** done; integration (TW1, dc3a2c3e) merged in (7b5ad7aa), its suites and the full run again green; CI on
  the branch, then the reviewer.

Full run on 7b5ad7aa: "run-tests: 112 suites passed"
(after the merge of integration with TW1 in, dc3a2c3e; before it: 111 suites passed on f88792d)

## The plan
1. The canvas (lab page, where the project download is): page 1 of the project as the writer places it: the same
   `projectPages` specs, the same input (one function `projectOf` / `inputOf` now builds it for the download, its
   preview and the canvas), `Pbip.fitOptions` and `E.fitSlots` in page units, the writer's own call (pbip-page.js
   `placed`). Drawn on the 720 grid (page units / s). The builder loads once after the first draw.
2. The cost per move measured in the browser. 3. encodePng by node:zlib in Node. 4. Room under the WhatsApp button.

## Before -> after
1. **The canvas** (theme-generator.js): `renderLayoutPreview` drew `computeSlots(c)`, the layout's slots before the
   writer's fit -> on a page with the project card it draws `canvasFit()`: page 1's slots from the download's own input
   (`projectOf(true)`, `inputOf`), `Pbip.fitOptions(input)[0]` and `E.fitSlots` in page units (exactly pbip-page.js's
   `placed`), divided by the page's scale for the 720 grid. The writer's 11 scripts load once after the first draw
   (until then, or if they can not load, the plan as before). It redraws when the card's choices change (second page,
   slide-in panel, data, fields, logo). The size labels on the panels are the written sizes. The table, the PNG and
   the CSV stay the layout's slots (for a report placed by hand); a line under the canvas says so when the fit moved a
   slot (EN and AR). The live page has no project download: nothing changes there.
2. **withProject** split into `projectOf(quiet)` (the checks, the theme, the specs) and `inputOf(q, model)` (pages and
   input), so the download, its preview and the canvas build one input (no copy of the rule).
3. **encodePng** (design-engine.js): in Node, every row but the first filtered Up in a plain loop, deflated by
   `zlib.deflateSync`, the same chunks (`pngOf`: the mark right after IHDR); the browser keeps the per-row filter
   choice and the JavaScript deflate (`opt.deflate: 'js'` forces it in Node, for the test). Encode only, 1920 x 1080:
   about 300 -> 85 ms plain, about 3,000-4,000 -> 110 ms under NODE_V8_COVERAGE (scratchpad bench, this machine).
4. **The lab page at phone width** (under 576): `scroll-padding-bottom` and `scroll-margin-bottom` 80 on the names
   rows, the approve button and the download button, and 80 of room at the page's end: scrolled to or reached by Tab
   they stop above the WhatsApp button (50 x 50, 14 from the corner).

## Tests changed on purpose
- `scripts/tests/theme-generator.mjs` (glass download, 1 check): the browser's PNG was compared byte for byte with
  Node's glassPng -> its pixels, size and glass mark (Node's bytes now come from node:zlib). Same count.
- `scripts/tests/capture-design-fixtures.mjs` captureAll: the writer's script held back (404) while the design
  fixtures are compared, so the lab page's canvas draws the layout's slots the fixtures freeze; the fitted canvas is
  checked by layout-canvas against the written page. No fixture remade; the same 598 checks.

## CHANGELOG line
"The website's layout preview shows what the download writes: on the Theme Generator page with the Power BI project
download, the layout preview draws page 1 as the project places it (...); the MCP writes each new glass page picture
faster (the same pixels)." Source: layout-canvas C1/C2 and lc1 P/T (this note).

## Decisions I made
- The canvas follows the project download (page 1) only where the page has one (the lab page); the slot table, PNG and
  CSV keep the layout's slots: they are the downloads for placing visuals by hand, where no writer fits the rail.
- Header rows: not drawn because the website's download never grows its header (no `grow` on its pages); the canvas
  follows the download. Whether the website should grow it like the MCP is the owner's (below).
- The fit runs on every move (median 1.5-2.3 ms with it).
- N1's EN half checks the project card's download button (the names list exists only in Arabic).

## For the owner
- The website's project download never grows its header for a second row of page tabs (the MCP's create_report does,
  `grow: true`): keep it so, or give the website's pages `grow` (the download and the canvas would then both grow)?

## Risky changes
- Network: the lab page now loads the writer's 11 scripts (same site, the existing loader) after the first layout
  draw, not on the first download or preview. What a download writes: unchanged.
- File writing: Node's glass pictures are other bytes (the same pixels and mark); a test that compared bytes now
  compares pixels (above). The design fixtures' comparison no longer sees the lab canvas's fitted drawing (layout-canvas does).

## For the laptop
Part 3, the Theme Generator lab page on 1920 x 1080 with sample data, "A second page" ticked; for each, the canvas and
the report opened in Desktop side by side, the same boxes (Format > General > Properties: X, Y, Width, Height):
1. Executive, filters at the start: the rail 24, 105, 294 x 312; the column chart 24, 725, 1083 x 331.
2. Arabic page (?lang=ar), Executive, right to left, filters at the start: the rail at the right, 294 x 312.
3. Analysis, filters at the end: the rail as high as its 3 dropdowns and Reset; the slots under it in its column.
Record each box, and whether Desktop's rail ends where the canvas's does. Header rows: none on the website (above).

## Seen, not in scope
- The canvas draws page 1 only; page 2 (Details/Overview) is seen in "Preview the download".
- `pngBlob` draws the background from `computeSlots` without the logo's ratio, the written page from `projectSlots`
  with it: with a logo the background's logo area may differ by its ratio (no panel is drawn there).
- fitOf's railItems at 1280 x 720: maxH 50.7 under minH 56 (the dropdown's least height wins); harmless, worth a look.

## Lessons for the reviewer
- The site scrolls smoothly: a check of where an element lands must scroll instantly, or it reads the start of the move.
- A fixture that freezes the page's drawing breaks on a change the owner asked for; hold the new layer back there.
