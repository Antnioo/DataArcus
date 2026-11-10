## Summary
- **Approval:** the brief "FT1 0.3.3" (10 Nov), B-430, from the owner's 0.3.2 laptop sitting step 18 ("PASS with the font
  noted"); the owner's D-1104-12 (one place), D-1027-12 (the twin identical in look), D-1027-05 (glass default, kept).
- **Base:** `fix/0.3.3-ft1` from `origin/integration/0.3.3` at a8df06e9. Push only this branch; never merge, no PR.
- **Scope:** a hand-placed report's font (create_report's `font`, pinned by plan_layout) reaches the theme the tools write:
  its 4 primary text classes (callout, title, header, label) carry it, so every visual without its own font resolves to
  it; the Arabic twin copies that theme. Default font (Segoe UI) or a font outside E.FONTS: theme bytes as today.
- **Expected checks:** new suite test-0.3.3-ft1 about 30 checks, red on the base (the theme carries no font); report,
  twin, arabic areas and every suite that writes a theme or reads textClasses unchanged; recorded pins unchanged except
  any hand-placed run with a non-default font (said per fixture under "Changed on purpose").
- **Resume:** none; the reviewer reads and merges.

## Plan (written 2026-11-10T01:12Z)
- Measured on the base (a8df06e9), scratchpad script, plan_layout -> approve_plan -> create_report through the real server,
  hand-placed page with font "Tahoma" (card, text box, slicer, bar chart, table), then create_arabic_twin (separate):
  - the theme file (`fonted-theme.json`) is `{ "name" }` only: no textClasses, no font (EN and twin alike).
  - own font in visual.json: slicer 'Tahoma', the language button 'Tahoma', text box Tahoma; tableEx, cardVisual,
    clusteredBarChart: none, so Desktop's default (Segoe UI / DIN). The twin's visuals and theme: the same.
  - the cause, measured: report-build.mjs handStep writes `theme = a.theme ? themeOf(a.theme) : { name }` and passes
    `a.font` only to the writer (text box, slicer, button, filter pane), never into the theme. The designed path
    (designStep) is not affected: buildTheme writes design.font into the same 4 classes.
  - the brief's pointer "redesign-text.mjs already writes text classes" is disproved: it writes visual styles
    (/visualStyles/<type>/*/<object>), never textClasses. The code that writes text classes is the design engine's
    buildTheme (the 4 primary classes, fontFace = the design's font).
- Fix (one place): `themeFont(theme, font)` in lib/design.mjs (the adapter report-build calls): the 4 primary classes
  get fontFace (their size, weight and colour kept); a secondary class the theme itself sets with a fontFace gets it too,
  but boldLabel and semiboldLabel (their face carries the weight); visual styles untouched. Called once in handStep.
  The twin copies the theme file (measured), so it follows with no twin change.
- Tests: mcp/test-0.3.3-ft1.mjs (registered): every visual of the measured report resolves to Tahoma (own objects,
  else the theme's visual style, else its text class, else its primary class), EN and twin; twin theme bytes = EN;
  Microsoft's validator errors equal to the same report without a font; the classes within the schema's textClass
  (reportThemeSchema-2.149: 14 class names; fontFace, fontSize, fontWeight, color); no font -> theme bytes as the base
  (pins recorded on the base); every non-theme file as the base (visuals keep what they set).
