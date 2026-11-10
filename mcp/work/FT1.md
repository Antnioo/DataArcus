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

## Before -> after (written 2026-11-10T01:51Z; each number from the run's own output file)
- Red on a8df06e9 first: test-0.3.3-ft1 `FAIL  ft1  12 of 28 checks` (the base's code with the suite and its pins): R2-R6,
  T2-T6 (no visual resolves to Tahoma: the theme has no text class), B3 (the theme unchanged), G1-G2, U1, U4, U5.
- After (80fa34d3): `PASS  ft1  29 checks` (U6 added: a theme that is not an object). Validator errors: EN [], no-font EN [],
  twin [], no-font twin [] (equal, L-1102-01).
- Pinned suites the brief named, unchanged, no fixture re-recorded: sp38 50, sp43 21, fn1e 590, fn1j 3, sp1 11, sp2 10,
  sp23 29, sp44 23, fn1f 6 (fn1f's 56 builds hold no hand-placed run with a non-default font) PASS.
- Areas on 80fa34d3: report 74 suites, twin 53, arabic 18, checker 12, core 12 PASS. Mutation before (a8df06e9) and
  after: `PASS  mutation  250 checks (99 mutants, all killed, 47 guard suites)` both.
- Suites that write a theme or read textClasses (grep "textClasses|buildTheme|themeOf|generate_theme|theme:" over
  mcp/test*.mjs): 95 files, every one registered in the areas above (core, report, twin, arabic, checker) or in model /
  safety / release / platform, which the full CI run covers.
- Gates: agent-memory, changelog-words, result-lines, modules (217 rows), contracts PASS; lint exit 0.
- After the merge of origin/integration/0.3.3 (202c9392, DB1; written 2026-11-10T01:59Z): report area 75 suites PASS, lint exit 0,
  agent-memory, changelog-words, result-lines, modules, contracts, test-contracts, site config PASS.

## CHANGELOG line
- A hand-placed report's font (create_report's `font`, for example Tahoma) now reaches its tables, cards and charts too:
  the report's theme carries it in its text classes, in the English report and its Arabic twin. Without a font the theme
  is written as before.

## Decisions I made
- The fix writes the 4 primary text classes only (callout, title, header, label), the same 4 the designed path's
  buildTheme writes; Microsoft Learn: secondary classes inherit from them (a total's bold label inherits the label's face).
  A secondary class a given theme sets with a face of its own takes the font too, but boldLabel and semiboldLabel: their
  face names their weight (N21-LAB: a bold label draws the label's face in bold when the theme does not set it).
- "No font" is create_report's default "Segoe UI" (the plan pins `withLookDefaults`, so an explicit "Segoe UI" and none
  cannot be told apart): both keep the theme byte for byte. A font outside E.FONTS keeps it too (not in this job).
- themeFont lives in mcp/lib/design.mjs (the adapter report-build calls), not in redesign-text.mjs: that module writes
  visual styles, never text classes (measured); nothing is copied from it, and it is not changed. The engine
  (assets/js) is not changed, so the website's bytes are not.
- The twin needs no change: it copies the report's theme file (measured: twin theme bytes = EN, T1).
- The suite runs the real server with sp1's seeded random (fixtures/sp1/seeded-random.mjs) so its files compare with the
  base's by sha256 (fixtures/ft1-pins.json, recorded on a8df06e9 with FT1_RECORD=1).

## For the owner
- none

## Risky changes
- The theme file create_report writes for hand-placed pages (report-build.mjs handStep -> themeFont): with a font from
  the offered list other than Segoe UI, its text classes gain fontFace (the plan's digest pins it, so the approval page
  and the write agree). Why: the owner's step 18. Nothing else in any written file or answer changes (B1-B3).

## For the laptop
- Next sitting: plan_layout with hand-placed pages and font "Tahoma" (a table among them), approve, create_report, open
  the .pbip in Power BI Desktop: the table's headers and values show Tahoma (Format pane > Values > Font: Tahoma,
  not Segoe UI); the same in its Arabic twin.

## Seen, not in scope
- create_report's `font` is ignored when the report is designed (layout / design): its description says "Hand-placed
  pages"; a design takes its font from design.font (generate_theme's), which already reaches the theme (D1). A plan
  with layout and font says nothing about the unused font.
- The website Theme Generator has not this gap: it builds through the engine's buildTheme, which writes the design's
  font in the same 4 classes.
- A given theme's own visual styles that name a font (visualStyles ... fontFamily) still govern over the text classes,
  as Power BI resolves them; FT1 does not change visual styles.
- Microsoft's theme schema is not bundled in mcp/schemas (SOURCE.md: "Not bundled"); the suite carries its 14 text class
  names and the textClass properties from reportThemeSchema-2.149.json.

## Lessons for the reviewer
- The brief's "redesign-text.mjs already writes text classes" was wrong: it writes /visualStyles/<type>/*/<object>; the
  code that writes textClasses is design-engine.js buildTheme (L-1029-06: measure before reuse).
- The brief's "the theme schema in mcp/schemas" is not there (not bundled); say where it is, or bundle it.
- Byte pins over stdio need sp1's seeded random in NODE_OPTIONS; without it every id differs run to run.
