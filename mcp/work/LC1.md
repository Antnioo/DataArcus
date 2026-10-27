# LC1 (0.3.1, the owner, 27 Oct): the layout canvas after the writer's fit

## Summary
- **Approval:** the reviewer's brief "Go on LC1"; the owner, 27 Oct, D-1027-19 "Both A" (SQ13-S2 in 0.3.1: the
  website's layout preview draws the slots after the writer's fit); D-1027-12 (the previews match what is written);
  D-1027-20 (TT2's Seen 3 and PF1's Seen 1 fixed here); D-1027-21 (after PF1, merged dd6d7ad).
- **Scope:** `assets/js/theme-generator.js` (the layout canvas block only, its own block), `assets/js/design-engine.js`
  (encodePng: node:zlib in Node), the lab page's CSS (the names list's bottom room), their .min.js and `?v=`; the new
  website suite `scripts/tests/layout-canvas.mjs` (registered in run-all.mjs); the new MCP suite
  `mcp/test-0.3.1-lc1.mjs` (one line in tests.json); this note. Not TW1's or CX1's files.
- **Base:** `fix/0.3.1-layout-canvas` from `origin/integration/0.3.1` (dd6d7ad).
- **Expected numbers (before the work; a node probe of the website's input with the sample data, the default design):**
  1920 x 1080 EN exec, rail at the start: the rail 294 x 951 -> 294 x 312 (3 dropdowns 66 + Reset 40, pad 10, gap 8);
  the column chart under it 336,725 771 wide -> 24,725 1083 wide (it takes the rail's column). 1280 x 720 AR exec: rail
  196 x 634 -> 196 x 225, the column chart 514 -> 722 wide. Without the rail: nothing moves. Header rows: 0 on the
  website (its download passes no `grow`, so its header never grows; the MCP's does). The fit per move: fitOptions
  0.1-1.6 ms in Node, so it runs on every move (measured in the browser below).
- **Expected checks:** layout-canvas about 40 checks (EN, AR; 1280 x 720 and 1920 x 1080; rail at the start, top and
  none; plain and glass: every panel the canvas draws equals a box in the written page 1; the cost per move; the
  WhatsApp button clear of the names list's last row and button at 390), red first on dd6d7ad; lc1 about 8 checks
  (node:zlib used in Node; pixels identical to the JavaScript encoder's; the mark kept), red first on dd6d7ad;
  theme-generator, theme-generator-lab, design-engine, arabic-names, pbip equal; full run 109 -> 110 suites.
- **Resume:** the plan is pushed; next the tests red first, then the code.

## The plan
1. The canvas (lab page, where the project download is): page 1 of the project as the writer places it: the same
   `projectPages` specs, the same input (one function `projectOf` now builds it for the download, its preview and the
   canvas), `Pbip.fitOptions` and `E.fitSlots` in page units, the writer's own call (pbip-page.js `placed`). Drawn on
   the 720 grid (page units / s). The builder loads once after the first draw; until then the canvas shows the plan.
   The table, the PNG and the CSV stay the layout's slots (for a report placed by hand); a note under the canvas says
   so when the fit moved a slot. The live page has no project download: its canvas already equals its downloads.
2. The cost per move measured in the browser (a slider drag: the redraw with and without the fit).
3. encodePng: in Node, `zlib.deflateSync` on the same filtered rows and the same chunks (the mark right after IHDR);
   the browser keeps the JavaScript deflate.
4. The names list (and the project card) at 390: bottom room, so the WhatsApp button never covers its last row or its
   button when it is scrolled to the screen's bottom or reached by Tab.
