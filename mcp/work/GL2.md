# GL2 (0.3.1, the owner, 27 Oct): the glass look's tables and matrices get no solid fill

## Summary
- **Approval:** the reviewer's brief "Go on GL2"; the owner, 27 Oct, on the laptop run of GL1's lab: "the glass shots
  are amazing only thing ... tables are not cleared of alternate rows formating so the whole background still has a
  solid background".
- **Cause:** GL1 wrote no back colours on tables with the look, so Power BI's own default style filled every cell
  (the theme's `background` and `backgroundLight`): solid rows over the see-through card.
- **Scope:** `assets/js/design-engine.js` (the look's table and matrix cards, their contrast) and `.min.js`; the ?v=
  stamps of the generator's pages (EN, lab; AR by `ar-pages --write`); `mcp/test-0.3.1-glass.mjs` (T4 follows the new
  rule); the new suite `mcp/test-0.3.1-glass-tables.mjs` and its line in `mcp/tests.json`; `mcp/lab/glass-lab.mjs`,
  `mcp/lab/GLASS-LAB.md`; this note, CHANGELOG, WORK.md. Not R4A's (approval-window.mjs, plans.mjs, label-limits.js,
  layout-check.js) nor TT1's (story-titles.js, the titles' join rule).
- **Base:** `fix/0.3.1-gl2` from `origin/integration/0.3.1`. Push only this branch; the reviewer merges.
- **Expected checks:** (written before the work) the new suite `glass-tables` about 40 checks, red first (every
  table and matrix fill missing); `glass` 50 = 50 (T4 rewritten to the new rule, same count); `run-all theme-generator
  design-engine`: the baseline's counts (910, 598) unchanged; every non-glass theme byte for byte (checked on every
  preset x light/dark x chart.table auto/minimal/banded against the base's engine); `npm test -- report`: 30 -> 31
  suites; `-- core` 6 = 6; full run 93 -> 94 suites.
- **Resume:** the plan is pushed; next: the red suite, then the engine.

## Each property and its source
Microsoft's capabilities (`@microsoft/powerbi-core-visual-schema` 0.1.3, the version `mcp/package.json` pins,
`data/capabilities.json`, objects of `tableEx` and `pivotTable`) and the report theme schema (Microsoft's
`reportThemeSchema-2.159.json`, `visual-tableEx`, `visual-pivotTable`):

| Visual | Card | Property (fill) | With glass |
|---|---|---|---|
| tableEx, pivotTable | `values` | `backColorPrimary` ("Background color of the odd rows") | clear: the card colour, alpha 00 |
| tableEx, pivotTable | `values` | `backColorSecondary` (the alternate rows) | clear; with Chart style table "banded": a tint, below |
| tableEx, pivotTable | `values` | `backColor` | clear |
| tableEx, pivotTable | `columnHeaders` | `backColor` | clear |
| pivotTable | `rowHeaders` | `backColor` | clear |
| tableEx, pivotTable | `total` | `backColor` | clear |
| pivotTable | `subTotals`, `rowTotal`, `columnTotal` | `backColor` | clear |
| tableEx, pivotTable | `grid` | `gridHorizontalColor`, `gridVerticalColor` (lines, no fill) | the look's grid colour (below) |

- **A see-through fill:** these cards have no transparency property (capabilities: none on any table or matrix card;
  only `blankRows.blankRowTransparency`, off by default). A colour with alpha is how: the theme schema's `color` and
  `colorOrThemeColor` take `^#[0-9a-fA-F]{8}$` (#RRGGBBAA), and Microsoft's validator reads a quoted 8-digit hex as a
  colour (`decodeLiteralValue`, `isHexColor` in powerbi-report-authoring-cli). Whether Desktop draws alpha 00 as
  clear is for the laptop (below); if it does not, the fallback is said there.
- **Style presets:** a table's built-in presets (Default, Alternating rows, ...) are not a property of `tableEx` or
  `pivotTable` (none in the capabilities); the container's `stylePreset { name }` (vco-capabilities) names a preset the
  theme defines (the theme schema: `visualStyles.<type>.<name>` is a "Custom style preset", `*` the "Default style").
  The writer sets no preset and no back colour in any visual.json (grep: none), so the theme's `*` governs: nothing to set.
- **The band** (only with Chart style table "banded", as without the look): the accent at alpha 8% (the solid look's
  `mix(card, accent, 0.08)`), over the glass card. Its transparency rises (alpha lowered one point) until the text
  stands 4.5:1 and the grid lines their own minimum on it, worst case (the darkest and the lightest pixel).
- **The grid lines:** on the glass they must stand at least what they stand on the solid card (`roles.grid` on the
  card: 1.33-1.58 for the presets); measured on the glass they fall to 1.02-1.08, so the line is darkened towards the
  text (steps of 0.05) until it does, over the clear cells and the band, worst case.
- **Contrast:** clear cells are the glass card itself (GL1's checks: text, labels 4.5:1); the new checks
  `gridOnGlass` and (banded) `textOnBand`, `gridOnBand` join `glassLook(...).checks`.

## The plan
1. The red suite `glass-tables` (EN/AR, light/dark, chart.table auto/minimal/banded): every fill above present on both
   types and alpha 00 (banded: the tint's alpha 1-20, never opaque); no 6-digit fill on any table or matrix card; the
   grid colours present and passing; every new check passes on every preset; the theme's colours match Microsoft's
   colour pattern; the non-glass themes byte for byte the base engine's (a copy of the base design-engine.js from
   `git show`); a glass report through the tools: Microsoft's validator 0 errors, check_report 0 "can break".
2. The engine: `glassTables(d, g)` in the look, written by chartStyles with the look; GL1's T4 to the new rule.
3. The lab: the tables and matrices are already on every variant page (checked); "Glass EN dark" and "Glass AR light"
   ask Chart style table "banded" so the laptop sees the tint too. GLASS-LAB.md: what to judge.
4. build:min, the stamps, csp, ar-pages, sitemap-lastmod; the suites; the full run once.
