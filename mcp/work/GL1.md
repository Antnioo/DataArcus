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
- **Expected checks (written before the work):** the new suite `glass` about 45 checks, red first (no look, no
  picture); `run-all theme-generator design-engine pbip`: the baseline's counts plus the new checks, every existing
  design's theme byte for byte (the look is off by default: "auto"); `npm test -- report` and `-- core`: the baseline's
  suites PASS plus `glass`; full run: 91 -> 92 suites.
- **Resume:** see "Results" (filled as the work lands).

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
(filled as the work lands)

## CHANGELOG line

## Decisions I made

## For the laptop

## Seen, not in scope
