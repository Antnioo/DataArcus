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
- **Added 27 Oct (the reviewer's scheduled task, from the laptop's run of GL1's lab, Desktop 2.159: the shipped values
  hold: 35%, corners 8, soft shadow):** (a) `glass-lab.mjs` failed on Windows: create_report answers `open` with the
  platform's separators (`glass\Glass EN light.pbip`), the lab split it on `/` only, so the report folder lost
  `glass`; now `reportDirOf`/`pbipOf` split on both, tested with `path.win32` and a drive letter. (b) On dark pages the
  soft shadow barely shows: the dark shadow made stronger (GLASS.shadow.dark 55/18/4 -> 30/24/6 at 1080), and the dark
  reports of the lab get a fourth page "Variants: shadow on dark" (GL1's soft, the shipped dark, a light halo) to be
  measured on the next laptop run. Expected: `glass-tables` + D1-D3, L1-L2, N4; `glass` 50 = 50.
- **Resume:** done; waits for the reviewer, then the laptop run (GLASS-LAB.md items 4 and 6).

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

## Results
Commits: plan cba24a5, red first 110aa41 (69 of 107 checks failed), the fix 01a898b8, notes 0cc64276, the lab on
Windows and the dark shadow (the next commit), this note's final numbers (after the full run).

| Before | After |
|---|---|
| A glass table or matrix: no back colours written, so Power BI's default style filled every cell solid (the theme's `background`, alternate rows `backgroundLight`), headers and totals too | every back colour clear (the card at alpha 00): the picture shows through every cell |
| Chart style table "banded" with glass: no band | every other row the accent at 8% alpha, lowered until text and grid lines stand on it (Corporate 4%, DataArcus 6%) |
| The grid lines: Power BI's pale default on the glass (1.02-1.08:1 worst case) | the look's own colour, at least what the line stands on the solid card (Corporate #bcbfc2 1.42:1, DataArcus #5d616c 1.80:1) |
| The lab on Windows: failed (the report folder without `glass\`) | the folder from `open` split on `\` and `/` |
| The dark look's shadow: 55% transparent, blur 18, distance 4 (barely shows) | 30%, blur 24, distance 6 (at 1080); the lab's dark page compares it with GL1's and a light halo |
| generate_theme's glass line: cards, rim, shadow, picture | + "Tables and matrices have no fill of their own ..." and `glass.tables` |

**Every property set (glass only), and its source** (capabilities 0.1.3 `tableEx`/`pivotTable` objects; the theme
schema 2.159 `visual-tableEx`/`visual-pivotTable`): `values.backColor`, `values.backColorPrimary`,
`values.backColorSecondary` (banded: the tint), `columnHeaders.backColor`, `total.backColor` on both;
`rowHeaders.backColor`, `subTotals.backColor`, `rowTotal.backColor`, `columnTotal.backColor` on pivotTable;
`grid.gridHorizontalColor`, `grid.gridVerticalColor` on both. No style preset (none exists as a property; the writer
sets none). The checks `gridOnGlass` and (banded) `textOnBand`, `gridOnBand` join `glassLook(...).checks`.

The lab (cloud run, 27 Oct): four reports, Microsoft's validator 0 errors and check_report 0 "can break" on each;
EN light / AR dark clear cells, EN dark band #00d4ff0f (6%), AR light band #1f4e790a (4%); variant rows 9 (light)
and 12 (dark: + "Variants: shadow on dark").

Suites (baseline on cba24a5 in a separate worktree -> after):
- `run-all theme-generator design-engine`: 910 = 910, 598 = 598.
- `glass-tables`: 69 of 107 failed -> 107 PASS; with the scheduled task's items 113 PASS (L1 fails on the old split:
  `C:\DataArcus\tests\glass-lab\Glass EN light.Report`); `glass` 50 = 50 (T4 now asserts the clear fills).
- `npm test -- report`: 33 -> 34 suites passed (the base registers 33, not the 30 my plan took from GL1).
- `npm test -- core`: its suites inside the full run on d8fd6a5e: mcp 1591, golden 12 tasks match, mutation 73 mutants all
  killed (a separate core run was stopped: the tree changed under it with the scheduled task's items).
- lint clean; check-min PASS (every changed .min.js a new stamp against main); changelog-words PASS; check-result-lines
  PASS (99); check-agent-memory PASS (169); test-site-config PASS.
- Full run `npm test -- --keep-going` on d8fd6a5e: "run-tests: 99 suites passed" (the base registers 98, not the 93 my
  plan took from GL1; + glass-tables).
- `run-all theme-generator design-engine` again on d8fd6a5e (the dark shadow): 910, 598.

## CHANGELOG line
- (added to the glass look's entry) Tables and matrices in the glass look have no fill of their own: no solid rows,
  headers or totals, the picture shows through every cell, and a banded table's every other row is a faint tint; the
  grid lines stay as visible as on solid cards.

## Decisions I made
1. The fill is a colour with alpha (#RRGGBBAA, alpha 00) in the card's own colour: the cards have no transparency
   property; the theme schema's colour pattern and Microsoft's validator take 8 digits. Desktop's drawing of it is the
   laptop's check (below).
2. No band unless the person chose Chart style table "banded" (the default style's alternate rows were the bug);
   banded: the solid look's 8% of the accent, as a tint.
3. The grid lines' minimum is what the same line stands on the solid card (no fixed ratio: a 3:1 line would make the
   table heavy, and the brief asks "still pass", not "stronger"); the band yields to the grid lines (its alpha goes down
   first), so a light theme's band is 4%.
4. The grid colours are written with the look even for table "auto" (Power BI's own grid colour fell to ~1.05:1 on
   the glass); their show and width stay the table style's.
5. GL1's T4 ("no back colours") asserted the cause of the bug; rewritten to the new rule, same count, said here.
6. `blankRows.blankRowColor` (a matrix's blank rows, off by default) and `columnFormatting.backColor` (per column, set by
   a person) are not written.
7. The lab already had a table and a matrix on every variant page; two of its reports now ask banded tables.
8. The dark shadow is changed now (30/24/6), a first guess like GL1's: black stays the shadow's colour (a shadow, as
   the schema's name says); a light halo (white, preset Center, distance 0, 80% transparent) is only a lab row, since a
   light glow on every visual would change the look more than "a shadow that reads". The laptop picks among the three.
9. The lab's path fix is tested as a function with `path.win32` (the cloud has no Windows); the Windows CI job does not
   run the lab (it is not a suite), so the next laptop run is its real test.

## For the laptop
`node lab/glass-lab.mjs <empty folder>` (mcp/lab/GLASS-LAB.md, item 6), Refresh, full-size screenshots of every page:
the tables and matrices (report pages and every variant row) in EN and AR, light and dark: no solid row, header or
total anywhere; the text readable; the grid lines visible; on "Glass EN dark" and "Glass AR light" every other row a
faint tint, not a solid colour. On the dark reports' page "Variants: shadow on dark": which of GL1's soft, the
shipped dark (30/24/6) and the light halo reads on the dark page (GLASS-LAB.md item 4). The lab itself: run on Windows
from `mcp/` with a drive-letter folder (`node lab/glass-lab.mjs C:\DataArcus\tests\glass-lab-2`). If Desktop draws alpha 00 as solid or black: report it with a crop; the fallback is
the card's colour without alpha (solid, as before) and the decision goes to the owner.

## Seen, not in scope
1. A matrix's blank rows (`blankRows`, off by default) would draw their own colour if a person turns them on.
2. The Theme Generator's preview (theme-generator.js) draws a glass table's rows clear but its header row in the
   accent colour and no band; the theme now makes the header clear and, banded, tints every other row. Not changed
   (the page's file, outside the engine).
3. The approval page's preview (page-preview.js) still draws glass pages without the picture (GL1 Seen 1).
4. A person's own column formatting (`columnFormatting.backColor`) or conditional formatting stays solid by design.
