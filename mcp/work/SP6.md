# SP6 (0.3.2, the split): design-engine.js -> design-colours.js + design-glass.js (behaviour identical, site and MCP)

## Summary
- **Approval:** the reviewer's brief "SP6" (3 Nov); the owner D-1016-01, D-1027-05, D-1102-02, D-1102-04. Backlog
  B-280 / B-286 (the Codex split map: "Extract design-colours.js, design-metrics.js, design-glass.js, then design-state.js.
  Keep the public DAEngine object as facade"). One split only: colours and glass.
- **Base:** `feat/0.3.2-sp6` from `origin/integration/0.3.2` at 04a9922. Push only this branch; never merge.
- **Scope:** new `assets/js/design-colours.js` (global `DAColours`): the colour math (clampHex ... calmPalette, Lab,
  CIEDE2000, colour-vision simulation, logoColours, logoTheme). New `assets/js/design-glass.js` (global `DAGlass`): the
  glass look (GLASS, glassRgb, glassLook, glassFit, glassPixels, glassPng and its cache, GLASS_MARK, isGlassPng,
  withGlassPicture, glassCards, glassTables). Stays in design-engine.js: presets, colours()/roles() (they bind a design
  to the default palette), layout, metrics (OP1's), the PNG codec, theme construction, labels, state. DAEngine keeps every
  name and result (the facade re-exports the moved functions themselves).
- **No cycle, no globals in the moved code:** design-glass.js gets what it needs from the engine explicitly
  (`DAGlass.make({ colours, roles, page, toPage, encodePng })`); design-colours.js reads nothing but its arguments
  (logoTheme gets the repaired page colours as an argument; the engine's wrapper keeps `logoTheme(brand, o)`).
- **Loaded:** Node through design-engine.js's literal `require('./design-colours.js')` / `('./design-glass.js')` (so
  the MCP and its packaging pick them up); the browser: the 3 generator pages load both before design-engine.min.js
  (after text-measure). theme-generator.js's BUILDER list has no design-engine (the page loads it): unchanged.
- **Tests first:** new suite `sp6` (report), `mcp/test-0.3.2-sp6.mjs`, recorded on the base:
  D1-D10: 10 made-up designs (glass on/off, 3 palettes, EN/AR, 1920x1080 / 1280x720 / 960x720): theme JSON, glassLook,
  glassFit, the glass PNG (the JavaScript deflate, byte for byte) and its pixels, slots and project slots, background SVG
  (sha256 in `fixtures/sp6-design.json`); C1: the colour functions on made-up inputs (logo pixels, palettes, CVD);
  B1: a live A/B against the base engine (git show 04a9922) for the Node zlib PNG and withGlassPicture (zlib output
  is per Node version, so not recorded); F1 (after the move): the facade's names identical, the moved ones the modules' own.
  Website suite `sp6` (`scripts/tests/sp6.mjs`): the theme generator EN and AR, current vs the base engine served in its
  place: the preview's screenshot pixel-identical and the downloaded theme identical.
- **Expected:** sp6 12 checks on the base (D1-D10, C1, B1), 13 after (+F1); website sp6 4 checks (EN/AR x preview,
  theme); every other suite's count unchanged. design-engine.js 1304 -> about 960 lines.
- **Got:** (filled after the run)
- **State:** PLAN pushed. **Resume:** write the suite on the base.
