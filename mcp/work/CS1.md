# CS1 (0.3.1): one text set for a hand-made report (the redesign's `consistentText`)

## Summary
- **Approval:** the owner, 26 Oct: "Add ... to the current 0.3.1 plan": "I have a report manually created and i want to
  optimize it clean it restructure the page in its current format not in our default way but taking same layout and
  making sure all are identical not one visual have a font and the other not". The reviewer's brief "Go on CS1".
- **Scope:** a new `mcp/lib/text-format.mjs` (the text roles, the inventory, the mixed counts, the text set);
  `mcp/lib/redesign.mjs` (consistentText, keepPositions, the new allowlist pointers, remove patches, a theme added when
  the report has none, verifyCopy); `plan_layout`, `create_report`, `report-inputs.mjs` (the two inputs, pinned);
  `approval-window.mjs` (the removed overrides and the text set); `check-report.mjs` (FORMAT_MIXED); a new suite
  `mcp/test-0.3.1-cs1.mjs` (one line in `tests.json`); one mutant in `test-0.3.1-mutation.mjs`; the lab
  `mcp/lab/consistency-lab.mjs`; TOOLS.md, README.md, CHANGELOG. Not BD1's files (dax-functions.mjs, arabic-lens.mjs,
  mcp/lab/bidi-lab.mjs). No website file (no shared engine changes).
- **Base:** `feat/0.3.1-cs1` from `origin/integration/0.3.1` (0cbb017). Push only this branch; the reviewer merges.
- **The option:** `consistentText: "report" | "theme"` with `redesignFrom` (default off). "report": for each text class
  the font and size most visuals already show (the report keeps its look); "theme": the theme's own. Every listed
  visual's own font family, size, bold and italic for those roles is removed so the theme governs, and the theme's
  textClasses get the chosen font and size. `keepPositions: true` leaves every position as it is (default: the grid,
  as today). Decisions below.
- **Expected checks:** (written before the work) cs1 about 35 checks, red first on 0cbb017 (no inventory, no option,
  no FORMAT_MIXED); `npm test -- report`, `-- checker`, `-- core` the base counts plus cs1 (one more report suite);
  redesign and redesign-overlay unchanged (no consistentText: the same patches, byte for byte); mutation 72 -> 73
  killed; full run: the base's 91 suites + 1 = 92 passed.
- **Invariants:** metadata only (property names, sizes, font names; never a text or a value); nothing written before
  the click; the original never changed; verifyCopy proves only the patches differ.
- **Got:** cs1 44 checks (red first on 0cbb017: FAIL 12 of 17, stopped at the plan); report 29 -> 30 suites PASS (the
  29 the same counts), checker 5 = 5, core 6 = 6 (mcp 1591 = 1591, golden 12 match), mutation 72 -> 73 killed
  (CS-allow, by cs1); redesign 50 and redesign-overlay 29 unchanged, and without consistentText the copy's digest is
  the base's on three plans. The first full run failed fuzz (case 161: a visual's properties not an object crashed
  visualText; fixed, cs1 T1 red first). Full run on 22185b3: "run-tests: 93 suites passed" (my 92 miscounted the
  base: its registry has 92, + cs1).
- **Resume:** done; waits for the reviewer, then the laptop's side by side ("For the laptop").

## The plan
1. `text-format.mjs`: ROLES, the visual objects each Power BI text class formats, by visual type and property name
   (table below). `textInventory(inv, theme)` lists each eligible visual's own overrides (an object entry without a
   selector, a Literal value): page, visual, type, class, object, property, value (a font name, a size in pt, true or
   false). A value from an expression or an entry with a selector (one series, one field) is kept and listed.
   `mixedOf` counts per class and property the values the visuals show ("the theme's" for a visual without its own).
2. check_report (the `theme` check): FORMAT_MIXED, a note per page and one for the report, when a class shows more
   than one font or size: "visual titles: 7 at 14pt, 2 at the theme's; 8 in Segoe UI, 1 in Segoe UI Bold".
   read_report is not changed; the redesign plan says the same (`text.mixed`).
3. The redesign with `consistentText`: the text set (per class: font, size, how many visuals already show it), every
   removed override (page, visual, class, property, from -> the set's value), every visual not changed with why. The
   patches: `remove` at `/visual/(objects|visualContainerObjects)/<object>/<i>/properties/<property>` (only ROLES'
   pairs), and `/textClasses/<class>/(fontFace|fontSize)` in the theme. Without a custom theme in the report, the copy
   adds one (`StaticResources/RegisteredResources/DataArcusText.json`, `{ name, textClasses }`) and registers it in
   report.json (`/themeCollection/customTheme`, a `resourcePackages` item): additions only. A built-in theme
   (customTheme of another type): no plan id, with how to make it a file.
4. verifyCopy: the new pointers in the allowlist; `objects`' hash ignores only the removed text properties; the
   added theme file only when the plan adds it; report.json changes only as additions.
5. Approval page: "Text set" and "Removed overrides" sections; every one listed.
6. The lab: `node mcp/lab/consistency-lab.mjs <empty folder>`: a made-up "Store Ops" project (typed Power Query rows),
   2 pages, visuals mixing fonts and sizes as hand reports do, a text box, a shape, a group.

## The text roles (Microsoft's sources)
Which class formats what: learn.microsoft.com "Create custom report themes", "Set formatted text defaults" (table).
The objects and property names: Microsoft's report theme schema `reportThemeSchema-2.149.json` (every pair below was
checked present there for every type listed, 26 Oct). A textClass holds `fontFace`, `fontSize`, `fontWeight`,
`color` (same schema, `textClass`): no bold or italic, so those overrides are removed and the theme's default governs.

| Class | What | Visual types | Object (properties) |
|---|---|---|---|
| largeTitle | visual title | every type below | visualContainerObjects.title (fontFamily, fontSize, bold, italic) |
| title | axis titles; multi-row card title; slicer header | axis charts, scatter; multiRowCard; slicer | categoryAxis, valueAxis (titleFontFamily, titleFontSize, titleBold, titleItalic); cardTitle; header (fontFamily, textSize, bold, italic) |
| label | table and matrix headers and values | tableEx, pivotTable | columnHeaders, values, rowHeaders (pivotTable) |
| boldLabel | totals | tableEx, pivotTable | total; subTotals, columnTotal, rowTotal (pivotTable) |
| lightLabel | legend, category axis labels, funnel labels, gauge target, scatter category labels, slicer items | axis charts, pie, donut, scatter, treemap, map, filledMap; funnel; gauge; slicer | legend; categoryAxis (fontFamily, fontSize, bold, italic); labels (funnel); target; categoryLabels (scatter); items (textSize) |
| largeLightLabel | card and multi-row card category labels, gauge labels | card, multiRowCard, gauge | categoryLabels; labels (gauge) |
| smallLightLabel | data labels, value axis labels | axis charts, pie, donut, treemap | labels; valueAxis (fontFamily, fontSize, bold, italic) |
| callout | card value, KPI indicator | card, kpi | labels (card); indicator |
| largeLabel | multi-row card values | multiRowCard | dataLabels |

Axis charts: clusteredColumnChart, clusteredBarChart, columnChart, barChart, hundredPercentStackedColumnChart,
hundredPercentStackedBarChart, lineChart, areaChart, stackedAreaChart, lineClusteredColumnComboChart,
lineStackedColumnComboChart, ribbonChart, waterfallChart. Any other type (cardVisual, advancedSlicerVisual, a custom
visual...) is a type CS1 does not know: untouched and listed.

## Before -> after
| | Before (0cbb017) | After |
|---|---|---|
| A visual's own fonts and sizes | not read | read by text class (text-format.mjs); a selector or an expression kept |
| check_report | nothing about fonts | FORMAT_MIXED per page and report: "visual titles: 4 at 14pt, 3 at the theme's, 2 at 11pt, 1 at 12pt; 8 in the theme's, 2 in Segoe UI Semibold" (the lab) |
| The redesign | grid, titles, theme colours | + `consistentText` (the lab: 37 settings removed, titles 14pt and table text 10pt in the theme, a theme file added) and `keepPositions` |
| verifyCopy | positions, titles, colour tokens, .platform | + the text pointers (removals), textClasses font and size, report.json additions, one planned added file |
| Approval page | changes, not changed, kept | + "Text set" and each removal under its visual |

## CHANGELOG line
- **One text set for a report you built by hand:** check_report now says where visuals mix fonts or sizes ("visual
  titles: 7 at 14pt, 2 at 11pt"), page by page. A redesign with `consistentText` makes them one: each visual's own font,
  size, bold and italic is removed so the theme governs, and the theme gets the font and size most of your visuals
  already show (or keeps its own). The layout stays yours (`keepPositions` leaves every visual where it is); text boxes,
  shapes, buttons, groups and custom visuals are not touched. The plan lists every setting removed before you approve.

## Decisions I made
1. **The option's name:** `consistentText: "report" | "theme"` (left out: off). One input for both of the brief's
   choices ("the value most visuals already use", "or the theme's if asked"), so there is no second flag to pin.
2. **Text classes, as the brief says, not visual styles:** the class that governs each object is Microsoft's table
   (above). A text class has no bold or italic (theme schema `textClass`), so a visual's own bold and italic are
   removed and the theme's default governs; the plan says so (`text.boldItalic`).
3. **The text set:** per class, the font and the size shown by the most places (a visual's object: a table's headers
   and its values are two places of `label`); a visual without its own counts as "the theme's" (the custom theme's
   class or visual style when it sets one, else Power BI's base theme, not read). Ties: the theme's first, then the
   smaller size, then the font's name A to Z. A class whose winner is the theme's is not written.
4. **Which visuals:** the ones the grid places (top-level, native, a known type, not hidden, not named twice), not on a
   tooltip page. Every other visual keeps its text and is listed in `text.untouched` with why: text boxes (their runs
   are their author's text), shapes, images, buttons, navigators, groups' visuals, hidden ones, custom visuals and
   types DataArcus does not know (cardVisual, advancedSlicerVisual: Microsoft's table names neither).
5. **A setting for one series or field (a selector) or from an expression:** kept and listed (`text.kept`).
6. **No theme file:** the copy adds `StaticResources/RegisteredResources/DataArcusText.json` (`name` = the file's name,
   as Desktop and pbip-export write it, else the validator's PBIR_THEME_FILE_NAME_MISMATCH; only `textClasses`) and
   names it in report.json (`themeCollection.customTheme`, a RegisteredResources item, `reportVersionAtImport` the base
   theme's or "5.61" as pbip-export writes). verifyCopy accepts report.json additions only, and an added file only as
   the plan adds it. A built-in theme that is not a file: no plan id, with how to make it a file in Desktop.
7. **Positions:** the grid by default, as every redesign ("the grid step as today"): rows and order stay the report's
   own, snapped to equal margins and gaps. `keepPositions: true` moves nothing. Which one the owner's report wants is
   the laptop's side by side (below).
8. **FORMAT_MIXED:** in the `theme` check, a note (impact dataarcusRule), one per mixed page and one for the report;
   top-level visuals of known types, tooltip pages left out. read_report is not changed: the redesign plan says the
   same counts (`text.mixed`), and check_report says it for any report.
9. **The theme's own visual styles** for a type (which govern over its class): listed in `text.themeStyles`, never
   changed (outside the allowlist).
10. **The answer's size:** `text.removed` is a count; each removal is listed under its visual's change
    (`pages[].changes[].text`), so the plan's existing cut (listsCut, redesignPages) covers them; the approval page lists
    every one.

## For the laptop
1. `node mcp/lab/consistency-lab.mjs <empty folder>` (and `--theme` into a second folder: the report with its own
   theme file). Open `Store Ops.pbip`, Refresh: titles at 14, 12 and 11pt, one bold Semibold, one italic; card values
   28 and 24pt (one Segoe UI Bold); the line chart's axis in Arial; the slicer header Segoe UI Bold 12; table headers
   bold 11. The text box "Store operations" (Semibold 20pt), the band shape and the group "Units note" (its card's title
   18pt) stay as they are.
2. With DATAARCUS_ROOT on that folder: plan_layout `{ path: "Gulf Retail.SemanticModel", redesignFrom: "Store Ops.pbip",
   consistentText: "report" }`; approve_plan: the page shows "Text set", "Settings removed 37" and each removal under
   its visual; create_report with the same and the planId.
3. Open `Store Ops redesigned.pbip` beside the original, page by page (full-size crops): every visual title one font,
   14pt, not bold or italic; card values one size; table and matrix text 10pt, headers not bold; axis labels one font
   (no Arial); the slicer header like the axis titles; the text box, the shape and the grouped card unchanged; nothing
   moved but the grid's snap. Again with `keepPositions: true` (nothing moves).
4. **The measurement:** the added theme sets only `textClasses` (largeTitle 14, label 10) over Power BI's base theme. If
   the titles do not show 14pt (the base theme's own visual style winning over the class), stop and report: the fix
   would write the text set as the theme's visual styles instead (a change to the allowlist).
5. The `--theme` folder: the same, with `store-ops-theme.json` changed at its text classes only; Desktop opens both
   without a theme error.

## Seen, not in scope
1. read_report does not list formatting (the brief allowed "read_report or plan_layout"; the plan carries it).
2. A text box's own runs (fonts per run) are not counted or changed: the author's text.
3. Hidden visuals and tooltip pages keep their own fonts (listed), as the redesign keeps them.
4. Text colour (fontColor) is not part of the set; the owner named fonts and sizes.
5. The new card (cardVisual) and the button slicer (advancedSlicerVisual) are not known: Microsoft's text class table
   names neither; they are untouched and listed.
