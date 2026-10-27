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
(after the work)

## CHANGELOG line
(after the work)

## Decisions I made
(after the work)

## For the laptop
(after the work)

## Seen, not in scope
(after the work)

## Lessons for the reviewer
(after the work)
