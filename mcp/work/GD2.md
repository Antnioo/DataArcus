# GD2 (0.3.1, the owner, 27 Oct): the twin identical in glass, the approval page and the website draw glass

## Summary
- **Approval:** the reviewer's scheduled brief "Go on GD2"; the owner on GD1's report, 27 Oct: "i want the twin to be
  identical that is why it's called a twin why on earth would i have one english glassy and one arabic not glassy also
  in the approval page it should not be solid cards also the live website theme generator should also be updated".
  GD1's "Seen, not in scope" 1-4 are in scope.
- **Scope:** `mcp/lib/glass-picture.mjs` (new: a glass PNG read, flipped, made small, in Node); the twin's build
  (`twin-pages.mjs`, `twin-write.mjs`, `twin-copy.mjs`, `twin-preview.mjs`): the Arabic pages' picture mirrored;
  `assets/js/page-preview.js` (+ .min.js): a glass page drawn as written; its callers (`plan-lint.mjs`,
  `approval-window.mjs` if needed, `theme-generator.js`); `assets/js/design-engine.js` (the theme's page picture for a
  theme used alone); `mcp/tools/generate_theme.mjs`; the new suite `mcp/test-0.3.1-glass-twin.mjs`; the website's
  theme-generator suite; TOOLS.md, CHANGELOG, WORK.md, this note.
- **Base:** `feat/0.3.1-glass-twin` from `origin/integration/0.3.1` (44d1f32a). Push only this branch.
- **Expected checks:** (written before the work) the new suite `glass-twin` about 40 checks, red first on 44d1f32a
  (the twin's pictures not mirrored; the preview solid; the theme without its picture); `twin` 8 = 8 suites, every
  plain twin byte for byte (no check changed); `report` +1 suite; `look-options`, `glass`, `glass-default` equal;
  `run-all theme-generator design-engine pbip`: + the website's glass preview checks (EN, AR), design-engine and pbip
  equal; `core` 6 = 6 (golden unchanged: no field reads the picture); full run +1 suite.
- **Resume:** the plan (this commit); then the work.

## The plan
1. **The twin identical, mirrored** (create_arabic_twin, into "same", create_report languages "en+ar": all three
   build through buildTwin): the theme file is copied as it is (glass, GL2's tables, light or dark); every visual's
   container styles kept as the English visual's (checked visual by visual); each Arabic page whose background is
   DataArcus's glass picture gets that picture FLIPPED left to right, pixel by pixel. Why flipped and not redrawn: the
   twin reads a report, not a design (no colours, strength or page size to redraw from), and a flip is exactly the
   English page mirrored, at any size. The separate twin replaces the picture's bytes under the same name (all its
   pages are Arabic); the copy holding both languages writes a new picture for the Arabic pages ("<name>-ar.png") and
   registers it. A plain report's twin is byte for byte as today; any other picture is as today (kept left to right).
2. **The approval page draws glass** (page-preview.js, one renderer): a page whose background is the glass picture is
   drawn with that picture behind it (a small copy, 480 wide, made from the written bytes: the Arabic page's flipped),
   its cards at the theme's own transparency and rim (the numbers the report is written with), tables see-through; a
   plain page as today. The picture never reaches an answer to Claude (the approval page only).
3. **The website:** the Theme Generator's project preview (page-preview.js) draws glass the same way, EN and AR; the
   layout canvas already does (GL1). It reaches dataarcus.com when the owner merges PR #104; never said to be live.
4. **A theme used alone** (with hand-placed pages): Microsoft's report theme schema (powerbi-desktop-samples,
   `reportThemeSchema-2.159.json`: `visualStyles.page["*"].background[].image { name, url, scaling Normal|Fit|Fill }`)
   lets a theme carry a page picture; generate_theme's glass theme carries its picture (a data URI, the theme's page
   size, scaling "Fit", the writer's page.json setting). Whether Desktop draws a picture from a theme: for the laptop;
   if it does not, the fallback (the picture file and where to set it) is said there.

## Results
Commits: plan 2d7fcc6, the work 4727936; this note and the docs (next).

| Before | After |
|---|---|
| The twin of a glass report: the same theme and container styles, but every Arabic page on the English page's picture, unflipped | each Arabic page on the English page's picture flipped left to right, pixel by pixel (twin, copy, bilingual report) |
| The copy in both languages: its Arabic pages share the English pictures | each Arabic page has its own flipped picture ("<name>-ar.png"), registered in report.json |
| The approval page: solid cards on the page colour for a glass report | the soft picture behind each page (a 320-wide copy of the written bytes) and every card at the written transparency, with the rim |
| The website's project preview: solid cards | the download's own picture behind each page, the cards at the written transparency, EN and AR |
| generate_theme's glass theme: no picture | the picture as the theme's page background image (a data URI at the page size, scaling Fit) |

Suites (red first on 44d1f32a, the base, in a separate worktree):
- New `glass-twin`: red on 44d1f32a first, 13 of 28 failed (the pictures, the previews, the theme's picture); now 28 PASS.
  T1 and T2 (the twin's theme and every visual's container styles equal the English report's) passed on the base
  already: the twin was glass; only its pictures were not mirrored.
- `pbip` (the website's project preview): 109 -> 111, the two new glass checks red on 44d1f32a first.
- `twin` 9 suites -> 10 (+ glass-twin); `report` 37 passed; `core` 6 = 6 (golden 12 tasks match, unchanged);
  `arabic` 14 = 14; `run-all theme-generator design-engine`: 920 = 920, 598 = 598.

**Tests changed on purpose (each said):**
1. `mcp/test-0.3.0-language-toggle.mjs` L2c, L9b, L2d: its report is glass (the default since GD1), so its copy in
   both languages now holds the Arabic pages' own flipped pictures: 180 -> 182 files (L2c), 182 -> 184 on the approval
   page (L9b), and report.json differs from the original's by exactly the 2 registered "-ar.png" items (L2d checks
   that, the rest of report.json still byte for byte).
2. `mcp/test-approval.mjs` W-11: the approval window's policy gains `img-src data:` (decision 7); the check keeps every
   other guarantee (no script, frame, link, fetched image) and allows one image only: the preview's glass picture, a
   PNG data URL. Measured in Chromium (a scratch check, not kept): under the old policy the picture is blocked (the
   page stays white, 1 policy violation); with `img-src data:` it draws, no violation.

## CHANGELOG line
- **The Arabic twin is identical to its English report, glass included:** in the twin, the copy in both languages and
  the bilingual report, each Arabic page sits on its English page's soft picture mirrored left to right, with the same
  see-through cards, tables and colours. The approval page and the Theme Generator's preview now draw a glass report as
  it is written: the soft picture behind each page and the see-through cards. A glass theme made on its own carries
  its soft picture as the page background, for reports DataArcus does not write.

## Decisions I made
1. **Flipped, not redrawn:** the twin reads a report, not a design (no colours, strength or page size to redraw from);
   flipping the written picture pixel by pixel is exactly the English page mirrored, at any size. Only DataArcus's own
   glass pictures (the engine's mark, GD1) are read and flipped (`mcp/lib/glass-picture.mjs`, Node's zlib to read,
   the engine's encodePng to write, marked again); any other picture is as before.
2. **The separate twin** writes the flipped picture under the same name (all its pages are Arabic); **the copy and the
   bilingual report** write "<name>-ar.png" (a free name) for the Arabic pages and register it in report.json; the
   English pages keep theirs.
3. **The approval page's picture** is a 320-wide copy made from the written bytes (the soft picture loses nothing; about
   15-25 KB a page in the page's HTML); it is in the plan's data for the approval window only, never in an answer to
   Claude (checked: no "data:image" in plan_layout's or generate_theme's answers).
4. **The preview's renderer** (page-preview.js) takes `glass { url, t, rim }` per page; `fromFiles` finds it itself when
   the caller gives `picture(bytes)` (the MCP: the small copy; the website: the download's own bytes as a data URL; the
   page's policy allows data: images).
5. **A theme used alone:** Microsoft's report theme schema (powerbi-desktop-samples, `reportThemeSchema-2.159.json`:
   `visualStyles.page["*"].background[]` with `image { name, url, scaling }`) lets a theme carry a page picture, so
   generate_theme's glass theme carries it (`withGlassPicture`, the engine's); the theme a report gets from
   create_report does not (its pages set the picture themselves; no 200 KB twice). The website's theme JSON download is
   unchanged (its background download gives the picture; the JSON shown on the page would carry 200 KB of base64).
6. The website change reaches dataarcus.com when the owner merges PR #104; it is not live before.
7. **The approval window's policy** gains `img-src data:` and nothing else: the preview's picture is inline in the page
   (no request, nowhere to send anything), so the window still fetches nothing. The other way, redrawing the picture as
   SVG gradients, would not be the bytes the report is written with (the brief: the same numbers).

## For the laptop
On the next batched run (Desktop, harness.ps1, full-size crops, numbers recorded in the note):
1. A glass report and its twin side by side, EN and AR, light and dark: the AR page's picture mirrored (its colour
   fields where the English page has them, left and right swapped), cards, tables and matrices identical (the same
   see-through, rim, shadow); the copy in both languages (into "same") the same, page by page.
2. The approval page's preview of a glass report next to Desktop's screenshot of the same page: the picture and the
   see-through cards alike (the preview is a drawing: positions and look, never values).
3. A theme from generate_theme (glass) applied to a report with hand-placed pages (View, Themes, Browse): does Desktop
   draw the page background picture from the theme? Record yes/no and the Desktop version. If no: say so in TOOLS.md
   and generate_theme's line already tells where to set it (Format page, Canvas background, Image).
4. The website's Theme Generator previews, EN and AR (Preview before download): the picture behind each page.

## Seen, not in scope
1. A page drawn on a picture that is not DataArcus's (an image someone set) is still kept left to right in the twin
   (T-1, unchanged).
2. The approval page's preview of a create_report Arabic report (lang "ar", no English page) draws its picture as
   written (not mirrored: there is no English page to mirror).

## Lessons for the reviewer
1. The owner's "the Arabic is not glassy" was the picture, not the theme: the twin already copied the theme and the
   container styles (T1, T2 green on the base); a pixel compare of the pictures found it.
2. The website's page policy blocks fetch of blob: URLs (connect-src): a test that reads a preview's picture back
   must decode its data URL, not fetch it.
3. The approval window's own policy (`default-src 'none'`) would have hidden the picture in every browser while every
   string test passed: a picture added to a page with a policy needs one rendered check under that policy.
