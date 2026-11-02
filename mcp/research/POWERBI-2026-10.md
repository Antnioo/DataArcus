# Power BI October 2026 update: what changes for DataArcus (U1, researched 19 Oct 2026)

Microsoft's own sources only. "Not confirmed" means it was not found in a Microsoft source on 19 Oct 2026; nothing
here is a guessed property name: every name is quoted from Microsoft's catalog or schema files.

## The Desktop build
- **Power BI Desktop 2.159.883.0, published 10/15/2026**: Microsoft Download Center,
  https://www.microsoft.com/en-us/download/details.aspx?id=58494 ("Version: 2.159.883.0", "Date Published: 10/15/2026").
- The Desktop change log (https://learn.microsoft.com/en-us/power-bi/fundamentals/desktop-change-log) lists QFE builds
  only up to March 2026 (2.152.1057.0) on 19 Oct; Learn's "What's new" page
  (https://learn.microsoft.com/en-us/power-bi/fundamentals/whats-new) is still the August 2026 update. Not confirmed
  there: the October build.
- Note: D5 (mcp/work/D5.md) already ran on "Desktop 2.159". Which 2.159 build (the October 15 one, 2.159.883.0, or an
  earlier one) is not recorded: Help > About in Desktop tells it (see "For the laptop" in mcp/work/U1.md).

## The October 2026 Feature Summary
https://community.fabric.microsoft.com/blog/fbc_pbiupdatesblog/power-bi-october-2026-feature-summary/5374650 (the
Fabric community blog, Microsoft's Power BI updates blog). The page refused scripted reads (HTTP 403) on 19 Oct; its
contents as indexed by search: Copilot and AI (the Power BI Report Authoring skill now covers custom visuals; GA);
Reporting: **list slicer dropdown mode (preview)**, **a native Gantt visual (preview)**, **a chart plot area background
colour**, **auto-expanding hierarchy axes with field parameter support**, **personal bookmarks keep column widths**;
semantic models: surge protection, continuous CU reporting. Not read word for word: the post's own sentences. The list
slicer details below are from Microsoft Learn, which was read in full.

## The list slicer's dropdown mode (Microsoft Learn)
https://learn.microsoft.com/power-bi/visuals/power-bi-visualization-list-slicer#use-dropdown-mode
- "The list slicer is in preview."
- "Dropdown mode displays the list of items in a drawer that opens below the selection box. You can customize the
  drawer's height and width to fit your report layout. The dropdown retains the formatting you apply to list items,
  including text, images, and conditional formatting."
- "Each selected value appears as a pill in the selection box. A pill shows the item name and a dismiss button."
- "When the selected values don't all fit in the selection box, a count pill shows how many more values are selected."
- "When you use Select all and then clear individual items, each cleared item appears as a Not (item) pill."
- "Format the search box ... These formatting options also apply when you use the list slicer in dropdown mode."
- Show selected first (https://learn.microsoft.com/power-bi/visuals/power-bi-visualization-slicers#show-selected-first):
  "The List slicer and Button slicer support Show selected first ... In a list slicer's dropdown mode, open the dropdown
  to access the Show selected first toggle."
- Not found in Microsoft's sources: a Top N option for the list slicer, a default size of the selection box or the
  drawer, and whether a report with a list slicer opens in a Desktop with the preview switched off.

### Its names in Microsoft's catalog (@microsoft/powerbi-core-visual-schema 0.1.3, npm, published 2026-10-19)
`listSlicer`:
- `data.dropdownMode` ("Dropdown mode", bool): the mode switch.
- `dropdownButton` ("Dropdown button"): backgroundColor, backgroundShow, backgroundTransparency, cornerRadius (+ the four
  corners, individualCorners), horizontalGap, iconColor, iconShow, iconSize, iconTransparency, padding (individual,
  uniform, four sides), position.
- `dropdownMenu` ("Dropdown", the drawer): background, border (colour, show, transparency, width), corners, glow, shadow,
  padding, **maxHeight**, **width**.
- `pills` ("Selection pills"): background, border, corners, padding, font (bold, colour, family, size, transparency,
  italic, underline), dismiss (colour, gap, position, size, transparency), layoutDirection.
- `search` ("Search"): accent bar, background, border, corners, font, icon, padding, verticalGap.
- `selectedOnly` ("Show selected first"): show, buttonColor, buttonTransparency, background, border, corners, font, padding.
- `selectionBox` ("Selection box"): accent bar, background, border, corners, font, padding, placeholderText.
- The button slicer (`advancedSlicerVisual`) gains `search` and `selectedOnly` too.

## Other catalog changes that touch what DataArcus writes (0.1.1 -> 0.1.3)
- `slicer.dropdown` is listed: borderColor, **borderRadius ("Rounded corners", integer)**, borderIndividualCorners,
  the four corner radii, iconColor, iconTransparency, accentBar* (Learn: "Slicer visual dropdown border color, open icon,
  and hierarchy expand and collapse icon colors (Generally Available)", August 2026). DataArcus writes `borderRadius 8D`,
  `borderIndividualCorners false`, `borderColor` on every dropdown slicer (Desktop 2.158 draws them, DESKTOP-TESTS.md
  2026-10-12); until now the validator called the object unknown and check_report marked it a known note. With 0.1.3
  the validator checks it and reports nothing. The catalog types the radius as an integer; the validator accepts `8D`
  (it does not check a literal's kind: `'eight'` passes too). Whether Desktop saves it back as `8L` is a laptop check.
- `slicer.selection.singleDate`, `slicer.slider.handleSize/handleWidth/handleHeight`, `slicer.items.expandCollapseIconColor`:
  new; DataArcus writes none.
- Charts (line, bar, column, combo, waterfall, area, ribbon): new `plotArea.color` ("Background color") and
  `colorTransparency`, `plotArea.sourceType/url/imageData/fit`, `categoryAxis.outerPadding`, `initialScrollPosition`,
  `autoExpand`; axis `start/end` relabelled Minimum/Maximum, `invertAxis` "Invert range". DataArcus writes none of the new
  ones; nothing it writes was renamed (names are unchanged, only display names).
- `cardVisual`: new role `TrendVisualCategory` and objects `trendVisualLibrary`, `lineTrendVisual`,
  `barColumnTrendVisual`, `cartesianTrendVisual`, `shapeMapTrendVisual`, `trendVisualSubtotals`. Not in any Microsoft
  feature text found on 19 Oct: not confirmed what Desktop draws.
- `donutChart` loses `value.*` (valueFontFamily ... valuePrecision), `label.transparency` and the `background` object.
  DataArcus writes none of them.
- `ganttChart` roles change (TaskId out, Columns in). DataArcus writes no Gantt.
- `debugVisual` leaves the type list (58 types).
- Nothing DataArcus writes is removed: U1-3 checks every object and property of the written reports against 0.1.3.

## Schemas
- **Report schemas** (github.com/microsoft/json-schemas, `fabric/item/report`): commit `af7b264` (2026-10-15, "Publish
  SU09 report schemas"), README: "September 2026: Slicer slider handle size, Cartesian category axis initial scroll
  position": visualConfiguration 2.8.0 ("Updates the schema identity for the SU09 visual updates, retaining the schema
  structure introduced in 2.6.0"), visualContainer 2.13.0 ("Updates the embedded visualConfiguration reference from
  2.7.0 to 2.8.0"), visualContainerMobileState 2.8.0 (the same). No change to report, page, definitionProperties,
  pagesMetadata, bookmark or reportExtension. Checked byte for byte: 2.13.0 is 2.12.0 with its identity changed.
  No October (SU10) report schema was published by 19 Oct. DataArcus writes visualContainer 2.1.0, page 2.0.0,
  report 2.1.0, definitionProperties 2.0.0 (version "4.0"): all still current. Bundled in mcp/schemas from af7b264.
- **Report theme schema** (github.com/microsoft/powerbi-desktop-samples, "Report Theme JSON Schema"): commit `34f78db`
  (2026-10-15, "October 2026 report theme schema update") adds `reportThemeSchema-2.159.json`; its only new definition
  is `visual-ganttChart`. DataArcus's written themes (the U1 test's English and Arabic reports) validate against 2.158
  and 2.159 (ajv, measured 19 Oct). Microsoft's 2.159 file itself is not a strict JSON schema (duplicate enum items in
  `actionStates-advancedSlicerVisual`): ajv needs `validateSchema: false` to compile it.

## Microsoft's validator
- `@microsoft/powerbi-report-authoring-cli`: npm versions 0.1.0, 0.1.1, 0.1.4, 0.3.0-beta.0, 0.4.0, 0.5.0 (2026-10-05).
  0.5.0 is still the latest on 19 Oct (the version mcp/package.json pins): no bump.
- It depends on `@microsoft/powerbi-core-visual-schema` `>=0.1.0 <1.0.0` and reads the copy installed beside it, so the
  catalog pin in mcp/package.json decides what the validator knows. Pinned at 0.1.3 since U1.

## What was not confirmed
- The October Feature Summary's own wording (the page refused scripted reads; its topics come from search results).
- Any Top N option for the list slicer (asked for in U1's request): none in Learn or in the catalog.
- What the list slicer's dropdown mode looks like at DataArcus's sizes (selection box height, the drawer, pills at 10pt,
  Arabic): nothing measured; DataArcus does not write it.
- Whether Desktop 2.159.883.0 still opens and draws DataArcus's reports the same: the laptop proof.
