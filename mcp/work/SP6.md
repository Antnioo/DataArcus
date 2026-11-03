# SP6 (0.3.2, the split): design-engine.js -> design-colours.js + design-glass.js (behaviour identical, site and MCP)

## Summary
- **Approval:** the reviewer's brief "SP6" (3 Nov); the owner D-1016-01, D-1027-05, D-1102-02, D-1102-04. Backlog
  B-280 / B-286 (the Codex split map: "Extract design-colours.js, design-metrics.js, design-glass.js, then design-state.js.
  Keep the public DAEngine object as facade"). One split only: colours and glass.
- **Base:** `feat/0.3.2-sp6` from `origin/integration/0.3.2` at 04a9922. Pushed only this branch; never merged.
- **Scope:** `assets/js/design-colours.js` (new, global `DAColours`): clampHex, hexToRgb ... calmPalette, CALM,
  Lab, CIEDE2000, colour-vision simulation, logoColours, logoTheme. `assets/js/design-glass.js` (new, global `DAGlass`):
  GLASS, isGlass, glassRgb, GLASS_MARK, isGlassPng, glassTables at the top; `make({ colours, roles, page, toPage,
  encodePng })` returns glassLook, glassFit, glassPixels, withGlassPicture, glassPng, glassCards (their caches inside).
  Stayed: presets, colours()/roles(), BAR_COLORS, DEFAULT_LOOK, layout, metrics (OP1's), the PNG codec, theme, labels,
  state. Every base line is in one of the three files unchanged (sorted-line diff) but logoTheme's head and its `ui`.
- **Loaded:** Node by design-engine.js's literal requires (the MCP and its packaging); the browser: the 3 generator
  pages load design-colours, design-glass, design-engine (after text-measure), one new stamp `?v=20261103sp6` each.
  theme-generator.js's BUILDER list holds no design-engine (the page loads it): unchanged. No worker loads it.
- **Tests (written and recorded on the base first, commit 2):** `sp6` (report, `mcp/test-0.3.2-sp6.mjs`): D1-D10
  (10 made-up designs: glass on/off, 5 palettes, EN/AR, 1920 / 1280 / 960 / custom, a broken saved design): theme JSON,
  glassLook (and at t 20), glassFit, the glass PNG with the JavaScript deflate byte for byte, its pixels, slots, project
  slots, background SVG, contrast checks, icons; C1 the colour functions; B1 the base engine (git show 04a9922) live:
  the zlib PNG and withGlassPicture; F1 the facade. Website `sp6` (`scripts/tests/sp6.mjs`): the generator EN and AR,
  glass and plain, the page as it is vs the base engine served in its place: preview screenshot pixel-identical,
  theme JSON and background PNG byte for byte.
- **Expected checks:** sp6 12 on the base, 13 after: **got 12 on the base (2dc65ee), 13 after** (recording twice gave the
  same file). Mutations: GLASS.t 35 -> 36 fails 11 of 13 and the website sp6 4 of 4 (preview and theme); a hue x 60.0001
  fails C1. Website sp6 4.
- **Before -> after (lines):** design-engine.js 1304 -> 950; design-colours.js 236 (new); design-glass.js 166 (new).
- **Areas** (2bfe822, the last code commit, SP2 merged in): report, arabic, core 71 of 71 suites PASS; every suite
  the base ran (report, arabic: 59) has the same count after. Website: sp6 4, design-engine 600, theme-generator(-lab)
  922 each, theme-logo 753, pbip 111, layout(-lab) 512 each. Lint 0, check:min, csp, ar-pages, sitemap: no change.
- **CI green: https://github.com/Antnioo/DataArcus/actions/runs/41569248030 on 52276d8** (after merging in
  integration/0.3.2 at 7797bf6, SP5 and SP4; Linux, Windows, macOS). The earlier green run: 41564683132 on e437847.
- **State: DONE.**
- **Resume:** none; the reviewer's merge.

## Runs
- 3 Nov, the reviewer's message: merged integration/0.3.2 at 7797bf6 (SP5, SP4) in at 52276d8: run-all.mjs, tests.json and
  the CHANGELOG kept both sides (sp4, sp5, sp6 once each); no .min.js or BUILDER stamp moved (one stamp per path). On
  52276d8: report, arabic, core 73 of 73 PASS; website sp5 3, sp6 4, design-engine 600, theme-generator(-lab) 922,
  theme-logo 753, pbip 111, layout(-lab) 512; lint 0; csp, ar-pages, sitemap: no change.
- Base 04a9922 (worktree): report + arabic 59 suites PASS. After 090d527: report + arabic + core 70 PASS. After the
  merge 2bfe822: 71 PASS (+ sp2). Core was not run on the base locally (its suites pass after, CI green).
- integration/0.3.2 moved to 66f93a0 (SP2) while CI ran: merged in (tests.json's report area: both sides' paths), the
  first CI run cancelled; the second failed only agent-memory (this note's summary labels), fixed in e437847.

## CHANGELOG line
- **Inside the design engine, colours and the glass look:** the colour math and the glass look each have a file of
  their own, shared by the website and the MCP; every theme, picture and layout is exactly what it was before.

## Decisions I made
- colours()/roles() stay in design-engine.js: they bind a design to the default palette (PRESETS.DataArcus), and
  test-0.2.9-design A2-10 pins `mix(u.text, u.card, 0.35)` once in design-engine.js; moving them would mean editing it.
- logoTheme moved with the colour math and takes the repaired page colours as a third argument; DAEngine.logoTheme
  keeps `(brand, o)` and passes `colours({ ui: o.ui }).ui` (no default palette in design-colours.js).
- design-glass.js gets the engine's pieces through `make()` (no cycle: the PNG codec stays in the engine as the brief
  says, and glassPng needs it). Its pure parts are module-level, so DAEngine.GLASS === DAGlass.GLASS (F1).
- DEFAULT_LOOK (a design default, not the look's drawing) stays in the engine, beside the other defaults.
- The website check compares against the base engine served in place, in the same browser, not a recorded hash (fonts
  differ per OS); the Node zlib PNG is compared live for the same reason (zlib's bytes per Node version).
- The website check uses reduced motion and an instant scroll: with smooth scrolling 1 run in 6 differed by 4 edge
  pixels at x 0 whatever the engine (now vs now too); after it, 12 of 12 identical.

## For the owner
none

## Risky changes
none (the 3 pages' script order is the only served change: design-colours, design-glass before design-engine)

## Seen, not in scope
- `scripts/tests/design-engine.mjs` crashed once (capture-design-fixtures.mjs:133 waitForFunction timeout) in a run
  that overlapped my edits; passed 600 on the next run.

## Lessons for the reviewer (design-state's split)
- The engine's tests load it as `new Function(module, exports, self, require)` with require mapped to the .min.js
  (scripts/tests/design-engine.mjs, theme-logo.mjs): a new module must be a literal `require('./x.js')`, and its .min.js
  git-added before `build:min` (check-min only rebuilds tracked .min.js files).
- Source-reading pins on design-engine.js: test-0.2.9-design (A2-10 roles' mix, kpiCards), test-0.3.1-ts1 (FHD_TEXT,
  sizeAt), test-0.3.2-op1 (the default page, text-measure before design-engine on the 3 pages). repairState, upgrade
  and fresh read PRESETS, FONTS, CHART_OPTIONS, LAYOUTS, BAR_COLORS, DEFAULT_PAGE: design-state.js would need them
  passed (make() as here) or the presets moved first.
- test-0.3.1-glass-tables N loads design-engine.js from cba24a5 alone; a base copy needs every file it requires
  (sp6's B1 writes text-measure.js beside it).
- SP6_BASE moves the comparisons' base; a later engine change that changes a theme on purpose makes sp6 (and the
  website sp6) fail by design: re-record on that base, never on the change.
