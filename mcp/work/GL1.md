# GL1 (0.3.1, the owner, 26 Oct): the glass look for Power BI, in the design engine, the website and the MCP

## Summary
- **Approval:** the reviewer's brief "Go on GL1"; the owner, 26 Oct: "Actually add all ideas i gave you now" (a
  "Glassy Dashboard" look: see-through cards over a soft room picture).
- **The truth every text says:** Power BI has no blur behind a visual. The look is made of what it has: a visual's
  background colour with transparency, its border (colour, radius), its shadow, and the page's background image. The
  softness is a picture DataArcus draws already soft (colour fields of the theme's own palette, no photo), seen through
  the see-through cards. Never "blur", never "first", "only", "official" or "free" in a headline.
- **Scope:** `assets/js/design-engine.js` (the look, the picture, its PNG, the contrast) and `.min.js`;
  `assets/js/theme-generator.js` (the choice, the preview, the downloads) and `.min.js`; the generator's EN page (AR by
  `ar-pages --write`) and its translations; `mcp/lib/report-run.mjs` (the picture into StaticResources),
  `mcp/lib/design.mjs` (only the contrast names of the look), `mcp/tools/generate_theme.mjs` (chart.look, the answer's
  glass block); the new suite `mcp/test-0.3.1-glass.mjs`; `mcp/lab/glass-lab.mjs`, `mcp/lab/GLASS-LAB.md`; this note,
  CHANGELOG, WORK.md, TOOLS.md. Not BD1's (dax-functions.mjs, arabic-lens.mjs, bidi-lab.mjs) nor CS1's (redesign.mjs,
  read-report/check-report formatting inventory, the redesign's text classes).
- **Base:** `feat/0.3.1-gl1` from `origin/integration/0.3.1` (0cbb017). Push only this branch; the reviewer merges.
- **Expected checks:** (written before the work) the new suite `glass` about 45 checks, red first (no look, no
  picture); `run-all theme-generator design-engine pbip`: the baseline's counts plus the new checks, every existing
  design's theme byte for byte (the look is off by default: "auto"); `npm test -- report` and `-- core`: the baseline's
  suites PASS plus `glass`; full run: 91 -> 92 suites.
- **Got:** glass 33 of 50 red -> 50 PASS; theme-generator 898 -> 910; design-engine 598 = 598, pbip 109 = 109 (every
  existing theme byte for byte); report 29 -> 30 suites PASS; core 6 = 6 (mcp 1591, golden 12, mutation 72 killed);
  the lab: 4 reports, validator 0 errors, 0 "can break". Full run: 93 suites passed.
- **Resume:** done; waits for the reviewer, then the laptop run of `mcp/lab/GLASS-LAB.md` picks the shipped values.

## The plan
1. **Where it sits:** a sixth chart style, `chart.look`: `auto` (Power BI's default cards, nothing written, as every
   chart style) or `glass`. The Theme Generator's "Chart style" row gets "Card look"; `generate_theme` takes it in
   `chart` (its zod and CHART_OPTIONS); the design carries it to `plan_layout` and `create_report` (pinned with the
   design, no new create_report input).
2. **The theme (buildTheme):** with `glass`, every visual type the theme sets (VISUAL_TYPES and "*"):
   - `background`: `show true`, `color` the design's card colour, `transparency` T (below);
   - `border`: `show true`, `color` the glass rim, `width 1`, `radius` the design's corners in page units (not on
     `cardVisual`: the validator's "Unknown theme property border.radius", as today);
   - `dropShadow` (with the design's shadow on): `show true`, `color #000000`, `position Outer`, `preset Bottom`,
     `transparency`, `shadowBlur`, `shadowDistance`, `shadowSpread 0` (off: `show false`);
   - tables keep their cells see-through (no `backColorPrimary`/`Secondary` with the look).
3. **Schema sources** (Microsoft's report theme schema, powerbi-desktop-samples `reportThemeSchema-2.159.json`,
   `definitions.commonCards`; the validator's VCO catalog, `@microsoft/powerbi-core-visual-schema` data/vco-capabilities.json):
   `background {show, color, transparency}`, `border {show, color, radius, width}`, `dropShadow {show, color, position
   (Outer|Inner), preset (Bottom|...|Custom), transparency, shadowBlur, shadowDistance, shadowSpread, angle}`: every one
   `"type": "number"` with no range in the schema; transparency is a percentage (0-100, the format pane's). Page
   `background {color, image {name, url, scaling Normal|Fit|Fill}, transparency}`; the writer's page.json already sets
   the image with scaling "Fit" (the schema's title: Stretch) and transparency 0.
4. **The soft picture:** made in code at the page's own size (1280 x 720, 1920 x 1080, any page): the page colour with
   four soft colour fields (data colours 1-3 and the accent, Gaussian falloff), light or dark as the design's page; no
   photo, no font. PNG (RGB, 8 bits) with the engine's own deflate, so the site and the MCP make the same bytes from the
   same theme. Expected: under 300 KB at 1920 x 1080 (measured, then written here).
5. **Contrast kept:** T starts at the look's value (35%, to be picked from the lab) and is lowered one point at a time
   until, over the darkest and the lightest pixel of the picture, the card blended over it gives: text 4.5:1, labels
   (secondary) 4.5:1, colour 1 3:1. The picture's own strength is lowered until the text on the page (the header title,
   the slicers) stands 4.5:1 on its darkest and lightest pixel. The numbers in the answer, the generator's check and below.
6. **The writer:** `create_report` (report-run) and the site's "Download project" write the picture as each page's
   background in StaticResources when the look is glass; otherwise as today (the blank pixel / the panels).
7. **The lab:** `mcp/lab/glass-lab.mjs <empty folder>`: a made-up model (typed Power Query rows), four reports through
   the tools (EN light, EN dark, AR light, AR dark), each with a variants page (transparency 20/35/50, radius 0/8/16,
   shadow off/soft/strong), labelled outside the visuals. `GLASS-LAB.md`: how to run it, the result table.

## Results
Commits: plan 828e26d, red first 3094fbe, the look f6f1fb1, the lab and docs bceeda2, this note (the next commit).

| Before | After |
|---|---|
| Chart styles: labels, grid, legend, axis, table | + `look`: `auto` (nothing written) or `glass` |
| A design's cards: solid, or transparent over panels drawn in the PNG | glass: card colour at T% transparency, a 1-px rim, the design's corners, a soft shadow, over a soft picture |
| MCP report background: a blank pixel | glass: the engine's picture at each page's size in StaticResources (website: the same bytes) |

**What the theme sets (glass), on `*` and every VISUAL_TYPES entry:** `background [{ show: true, color: card,
transparency: T }]` (on `*`); `border [{ show: true, color: rim, width: 1, radius: corners in page units }]` (no radius on
cardVisual); `dropShadow [{ show: true, color: #000000, position: Outer, preset: Bottom, transparency, shadowBlur,
shadowDistance, shadowSpread: 0 }]` (design's shadow off: `show: false`); the labels (`foregroundNeutralSecondary`,
`textClasses.label`, axis label colours) darkened towards the text only as far as 4.5:1 needs; tables' cells left without
back colours. Rim: `#ffffff` on light, the card mixed 25% towards white on dark. Shadow at 1080: light 85% transparent,
blur 18, distance 4; dark 55%, 18, 4 (scaled with the page: 12 and 3 at 720).

**The picture:** the page colour with four Gaussian colour fields (data colours 1-3, the accent; strength 0.42 light,
0.55 dark, lowered for the page's text), drawn in 2 x 2 squares, PNG (RGB, 8 bits) with the engine's own filters and
deflate (dynamic Huffman); pngjs reads it back to the engine's pixels. Sizes at 1920 x 1080 / 1280 x 720: Corporate
158 / 91 KB, DataArcus 181 / 101 KB, Desert Gulf 161 / 92 KB, Midnight 175 / 100 KB, Earthy 150 / 85 KB, Colorblind safe
164 / 95 KB. About 0.4-0.6 s at 1920 x 1080 in Node.

**Contrast, worst case (T asked 35%; the card over the darkest / lightest pixel):**

| Preset | T | Text | Labels | Colour 1 | Text on picture |
|---|---|---|---|---|---|
| Corporate (light) | 35 | 11.37 | 5.01 | 6.68 | 6.46 |
| DataArcus (dark) | 35 | 10.64 | 4.95 | 6.29 | 4.61 |
| Colorblind safe | 35 | 12.65 | 4.71 | 4.12 | 7.95 |
| Desert Gulf | 35 | 12.09 | 5.29 | 7.30 | 6.75 |
| Midnight | 35 | 10.41 | 4.85 | 6.48 | 4.69 |
| Earthy | 35 | 10.90 | 4.84 | 3.91 | 6.06 |

A grey text of 4.6:1 on white (#757575) gets T 25% and a plain picture, and its own failing page check is said (C4).

Suites (baseline on 0cbb017 in a separate worktree -> after):
- `run-all theme-generator design-engine pbip`: 898 -> 910 (12 new glass checks, EN and AR, written after the code),
  598 = 598, 109 = 109.
- `npm test -- report`: 29 -> 30 suites passed (glass 50; red first: 33 of 50 failed on 3094fbe).
- `npm test -- core`: 6 = 6 (mcp 1591, golden 12 tasks match, mutation 72 killed).
- lint clean; check-min PASS; changelog-words PASS; check-result-lines PASS (93); check-agent-memory PASS (157).
- Full run `npm test -- --keep-going` on 2c88cab: "run-tests: 93 suites passed" (the base registers 92, not the 91 my
  plan said: one suite landed since LR2; + glass). The first full run on a5b2b93 failed one suite, arabic-terms AT-3: the
  preview's Arabic note said «العنصر المرئي», fixed to the owner's «المرئيات» in 2c88cab.

## CHANGELOG line
- **A glass look for your reports:** a new card look, "Glass", in the Theme Generator (Chart style, Card look) and in
  generate_theme (`chart.look: "glass"`). Power BI has no blur behind a visual, so the look is made of what Power BI
  has: see-through cards, a thin light border, a soft shadow, and a soft page picture DataArcus draws from your theme's
  own colours (no photo), which the report gets behind every page. Text stays readable (4.5:1, colour 1 3:1, worst case).

## Decisions I made
1. The look is a chart style (`chart.look`), not a layout key: generate_theme, plan_layout and create_report carry it in
   the design (pinned with it), and "auto" writes nothing, as every chart style.
2. The theme carries no picture (an embedded data URI would make every theme ~200 KB); the picture goes in the report
   (create_report, the site's project) or the site's background download. generate_theme's line says so.
3. The engine writes the PNG itself (filters + deflate in plain JavaScript): the same bytes in the browser and Node, no
   canvas, no zlib; the picture in 2 x 2 squares to halve the file (neighbours stay within 2 levels).
4. The labels darken towards the text colour (in 0.05 steps) before the cards lose transparency: with Corporate the
   labels alone would have forced T down to 6%.
5. With glass, no header band, panels or KPI accent bars are drawn (the picture replaces them); slicers and buttons sit
   on the picture, their text checked as "text on the picture".
6. Glass wins over `transparent`; a table's back colours (minimal/banded) are not written with glass (solid cells).
7. The shipped values (T 35, rim, shadow) are first guesses until the laptop's lab; one place: `GLASS`.

## For the laptop
`node lab/glass-lab.mjs <empty folder>` (mcp/lab/GLASS-LAB.md): four reports (EN/AR, light/dark), Refresh, screenshot
every page at full size with harness.ps1. Pick: transparency 20/35/50, corners 0/8/16, shadow none/soft/strong; check
every text whole and readable, the rim, whether the card visual, table and matrix keep an inner fill of their own, the
slicers and buttons on the picture, Arabic mirrored. Fill the table in GLASS-LAB.md.

## Seen, not in scope
1. The approval page's preview (page-preview.js) draws a glass report's pages without the picture (solid cards on the
   page colour); the website's preview is exact. Not changed (another engine).
2. A new report that keeps an existing glass theme (themeColours: `cardTransparent`) gets solid cards and no picture,
   as for any see-through theme today.
3. generate_theme writes the theme file only; a user of the theme alone needs the site's background download.
4. The writer has no matrix (pivotTable) of its own; the lab builds one from the table to see the look on it.
5. The picture adds about 1-2 s to a glass create_report (the plan and the write each draw it, two pages).
6. (none further: check-min compared the ?v= stamps against main after a full fetch: every changed .min.js has a new
   stamp; sitemap-lastmod: every date matches.)
