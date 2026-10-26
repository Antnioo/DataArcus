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
- **Got:** (after the work, below)
- **Resume:** (after the work)

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

## Decisions I made
(after the work)
