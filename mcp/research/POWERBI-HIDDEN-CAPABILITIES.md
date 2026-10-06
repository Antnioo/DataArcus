# What Power BI can do that the DataArcus writer does not use yet

Research only (night of 6-7 October 2026, the laptop builder). Nothing here is shipped. It lists settings that Power BI
Desktop and the PBIR files accept and that `assets/js/pbip-export.js` and `assets/js/design-engine.js` never write, so
the next rounds can pick from measured facts instead of guesses.

## How this was found (and its limits)
1. **Microsoft's published data, as already in the repo's `mcp/node_modules`:** `@microsoft/powerbi-core-visual-schema`
   0.1.1 (a dependency of Microsoft's report authoring CLI): `capabilities.json` (59 visual types, each with its data
   roles, formatting objects and properties), `vco-capabilities.json` (the settings every visual's container has) and
   `instance-selectors.json` (which objects have default / hover / selected / disabled states).
2. **Microsoft's public JSON schemas** (`microsoft/json-schemas`, as bundled on `feat/check-report-2` under
   `mcp/schemas/`): report 3.3.0, page 2.1.0, visualContainer 2.12.0; and the public report theme schema 2.157
   (`microsoft/powerbi-desktop-samples`, "Report Theme JSON Schema").
3. **A grep of our writer** for every visual type, object and property name of (1) and (2)
   (`builder-scripts\n1-capabilities.mjs`; a name counts as used when it appears anywhere in the writer's sources, so
   "never named" is certain and "named" is not proof that every visual uses it).
4. **Power BI Desktop 2.158.1177 on made-up reports** (the Ramadan sample; `builder-scripts\n1-gx.mjs`): each candidate
   written by hand into a copy of a generated report exactly as (1) names it, opened, looked at, then **saved by
   Desktop and read back**, so the property and its place are Desktop's own serialisation. The column "In Desktop"
   says what was seen. Where it says "not opened", the row rests on the schema alone.
5. Microsoft Learn was used only to confirm what a setting is for.

**Not done:** Desktop's Options > Preview features list and the format pane were not walked by hand (no person at the
laptop, and the pane's switches are not reachable without many clicks); no preview feature was switched on, so none
had to be switched off. Keyboard shortcuts were not collected. Nothing outside Power BI's public schemas, the files
Desktop wrote for these made-up reports and Desktop's own window was read.

**Words used:** *documented* = on Microsoft Learn or in the format pane; *schema only* = in Microsoft's published
schema or capabilities data, with no Learn page found tonight; *preview* = Microsoft marks it as preview. A schema-only
or preview setting can change or stop working with a Desktop update: anything taken from this file needs a test that
opens it in Desktop, and a fallback that leaves the report readable without it.

## Top 5 (recommended order)
1. **The card's own blank text** (`cardVisual` > `value.showBlankAs`): a KPI card whose measure is blank shows "--"
   today; with this one property it showed "No data" in Desktop. It gives the owner's "No data" idea to the KPI cards
   with no extra visual, no extra measure and no tab stop. High value, low risk (in Microsoft's capabilities data,
   drawn by Desktop 2.158; no Learn page names it). Helps every golden task that can be filtered to nothing.
2. **A subtitle and a divider under a chart's title** (`visualContainerObjects.subTitle`, `.divider`): one line that
   says what the chart is ("This Ramadan against last, by day") without making the title long, which is where long
   Arabic titles are cut today (task 6). High value, low risk (documented format-pane settings).
3. **A constant line with its label** (`y1AxisReferenceLine` on column and line charts, `xAxisReferenceLine` on bar
   charts): a target or last year's average drawn on the chart, named. High value for the Ramadan task (3) and any
   "against target" request; needs a number from the user or a measure, so it is a `create_report` option, never a
   default. Low risk (the Analytics pane's constant line).
4. **The look in the theme instead of in each visual** (`visualStyles.<type>.*` for gridlines, axis text, legends,
   labels, slicers, table grid, cards; the ten unused `textClasses`): a visual the user adds by hand after
   `create_report` then matches the report. High value for "the report stays good after I edit it"; medium risk: the
   theme import refuses a whole theme on one unknown property, so each card needs the validator and a Desktop open.
5. **Data bars in a table column** (`tableEx` > `columnFormatting.dataBars`, per column): a bar behind each number,
   Desktop's own, where the SVG picture column is experimental today. Medium to high value (tasks 1, 2, 4, 8);
   low risk, with one thing to settle first: the number is drawn over the bar's end (hide the text or shorten the
   bar's range).

Close behind: `title.heading` (a real heading level for screen readers, no visible change), `lineStyles`
(a smooth line, markers, a filled area), the donut's `slices.innerRadiusRatio`, the report setting
`defaultFilterActionIsDataFilter` (a click filters the page instead of dimming it), and the button slicer
(`advancedSlicerVisual`) for a short list of choices such as years.

## 1. What the writer emits today, against what exists
- **Visual types:** Microsoft's data names 59. The writer emits 14 kinds of visual (card, line, bar, column, donut,
  table, matrix, gauge, funnel, treemap, map, slicer, text box, image) plus buttons, shapes and groups. The theme code
  names 50 types (to style them all). Never named anywhere: `animatedNumber`, `basicShape`, `ganttChart`,
  `realTimeLineChart`, `accessibleTable`, `filterSlicer`, `heatMap`, `dataQueryVisual`, `debugVisual` (most are
  internal or legacy). **Worth a look among the ones only styled, never created:** `advancedSlicerVisual` (the button
  slicer, generally available since October 2025), `listSlicer` and `textSlicer` (preview), `areaChart`,
  `lineClusteredColumnComboChart` (a measure against a target), `waterfallChart`, `scatterChart`, `kpi`,
  `multiRowCard`, `decompositionTreeVisual`, `keyDriversVisual`.
- **Formatting objects per visual we do create** (objects never named in the writer; the number is how many
  properties the object has):

| Visual | Objects in Microsoft's data | Never named by the writer |
|---|---|---|
| `cardVisual` (the KPI cards) | 33 objects, 406 properties | `referenceLabel` (17) with `referenceLabelTitle`, `referenceLabelValue`, `referenceLabelDetail`, `referenceLabelLayout`; `divider` (6); `cardCalloutArea` (15); `cardImage` (30); `shadowCustom`, `glowCustom`, `shapeCustomRectangle`, `rotation`, `overFlow`; the eight `smallMultiples*` objects (one card per category) |
| `clusteredBarChart`, `clusteredColumnChart` | 18 objects, 307 properties | `y1AxisReferenceLine` / `xAxisReferenceLine` / `referenceLine` (constant lines, 23 each), `zoom` (11), `smallMultiplesLayout` (17) and `subheader`, `plotArea` |
| `lineChart` | 25 objects, 450 properties | `lineStyles` (24: smooth or stepped line, markers, area fill), `seriesLabels` (27), `y2Axis` (23), `forecast` (28), `anomalyDetection` (27), the reference lines, `zoom`, small multiples |
| `donutChart` | 11 objects, 75 properties | `slices` (`innerRadiusRatio`, `startAngle`), `centerValue` |
| `tableEx` | 10 objects, 80 properties | `accessibility` (2); and inside `columnFormatting`, which the writer uses for alignment only: `dataBars`, `fontColor`, `backColor`; `sparklines`; `values.urlIcon`, `values.icon` |
| `pivotTable` | 15 objects, 150 properties | `subTotals` (17), `rowTotal`, `columnTotal`, `blankRows` (8) |
| `slicer` | 15 objects, 112 properties | `searchBox`, `slider`, `numericInputStyle`, `dateRange`, `calendarButton`, `relativeText`, `pendingChangesIcon`, `selectionIcon` |
| `actionButton` | 8 objects, 70 properties | `glow`, `rotation` |
| `gauge` | 6 objects, 34 properties | `calloutValue` (10) |
| `funnel` | 5 objects, 34 properties | `percentBarLabel` (7) |
| `map` | 8 objects, 46 properties | `bubbles`, `mapControls`, `mapStyles`, `heatMap` |

- **Container settings every visual has** (`visualContainerObjects`): never named: `subTitle` (11 properties),
  `divider` (5), `visualHeader` (24 switches, one per header icon), `visualHeaderTooltip`, `lockAspect`, `stylePreset`;
  inside objects we do use: `title.heading` (Heading2 to Heading6, for screen readers), `title.italic/underline`,
  the five `spacing.*` distances, `general.keepLayerOrder`, the four `dropShadow` shape numbers, and most of
  `visualTooltip` (colours, `showTooltipFieldsOnly`, `showValuesInBold`) and `visualLink` (`drillthroughSection`,
  `webUrl`, `tooltipPlaceholderText`).
- **Report settings** (`report.json`, `settings`): the writer writes none. In the schema: `hideVisualContainerHeader`,
  `defaultFilterActionIsDataFilter` (a click filters the other visuals instead of dimming them), `useEnhancedTooltips`,
  `useScaledTooltips`, `locale` (the report's own format locale), `defaultDisplayUnitsToNone`, `pagesPosition`,
  `disableFilterPaneSearch`, `allowInlineExploration` (personalise visuals), `useCrossReportDrillthrough`,
  `pauseQueries`, the slow-source "Apply" buttons, `queryLimitOption`.
- **Page settings** (`page.json`): never named: `visualInteractions` (Edit interactions: which visual filters,
  highlights or ignores which), `pageBinding.parameters` (drillthrough and tooltip pages that take a field),
  the filter pane's look (`outspacePane`, `filterCard`: text sizes, input and apply colours), `pageRefresh`.
- **The theme** (`report theme schema 2.157`): the writer's theme sets `name`, `dataColors`, nine colour roles, four
  `textClasses` and, per visual type, only `border`, `dropShadow` (and text sizes for tables, slicers and legacy
  cards). In the schema and never set: `icons` (the icon sets of conditional formatting), ten more `textClasses`
  (`largeTitle`, `dataTitle`, `boldLabel`, `largeLabel`, `smallLabel` and their light and semibold forms),
  the structural colours (`firstLevelElements` to `fourthLevelElements`, `secondaryBackground`, `accent`, `null`,
  `foregroundSelected`, `foregroundButton`, `disabledText`, `shapeStroke`, `mapPushpin`), and **every per-visual
  formatting card inside `visualStyles`**: the gridlines, axis text, legends, data labels, slicer boxes, table grid and
  card look that the writer writes into each `visual.json` could live in the theme instead, so that a visual the user
  adds by hand afterwards takes the same look.

## 2. Capability by capability
"In Desktop" is filled from tonight's hand-written report (`GX try`, `GX blank`, `GX locale AR`); see the note at the
end of the table for anything that did not get its turn.

| # | What it does | The exact property (as written, opened and saved back by Desktop 2.158 unless said) | Status | Risk | Value for DataArcus (golden task) | In Desktop tonight |
|---|---|---|---|---|---|---|
| 1 | Text for a blank KPI value instead of "--" | `visual.objects.value[0].properties.showBlankAs` = text literal, selector `{ id: "default" }` (the entry that already holds the card's font size) | schema only (capabilities: "Show blank as") | low: one optional text | **high**: every report filtered to nothing; the "No data" idea for cards (all tasks) | drawn: both cards read "No data" on a page filtered to an empty selection (`gx-pair.png`); not saved back |
| 2 | A subtitle under the title | `visualContainerObjects.subTitle[0].properties`: `show`, `text`, `fontSize`, also `fontColor`, `alignment`, `bold`, `fontFamily`, `titleWrap`, `heading`; no selector | documented (format pane, Title > Subtitle) | low | **high**: long titles (6), context lines (3) | drawn in small text under the title; kept as written on Save |
| 3 | A divider line under the title area | `visualContainerObjects.divider[0].properties`: `show`, `color`, `width`, `style` (solid, dashed, dotted), `ignorePadding` | documented (format pane, Title > Divider) | low | medium | drawn (a dotted line); kept |
| 4 | A heading level for the title (screen readers) | `visualContainerObjects.title[0].properties.heading` = `'Heading2'` ... `'Heading6'` | documented (accessibility) | low | medium: accessibility, nothing to see | accepted and kept (nothing visible, as meant) |
| 5 | A constant line with a label | `visual.objects.y1AxisReferenceLine[]` with selector `{ id: "<any id>" }`: `show`, `displayName`, `value` (number), `lineColor`, `style`, `dataLabelShow`, `dataLabelText` (`Value`, `Name`, `ValueAndName`), `dataLabelColor`, `dataLabelHorizontalPosition`, `dataLabelVerticalPosition`; shading: `shadeShow`, `shadeRegion` | documented (Analytics pane) | low | **high**: targets (3, 1) | drawn: a dashed line "Target: 40000" across the column chart; kept |
| 6 | Data labels with position and units | `visual.objects.labels[0].properties`: `show`, `labelPosition` (`OutsideEnd` ...), `labelDisplayUnits` (1000 = thousands), `labelPrecision`; also `showBlankAs` on chart labels | documented | low | medium (the writer uses `labels.show` only on the tooltip charts and, since tonight, the day chart) | drawn (77.7K above the columns); kept |
| 7 | A smooth or stepped line, markers, a filled area | `visual.objects.lineStyles[0].properties`: `lineChartType` (`linear`, `smooth`, `step`), `showMarker`, `markerSize`, `areaShow`, `strokeWidth` | documented | low | medium: the line charts (1, 3, 4) | drawn: a smooth line, a dot per month, a tinted area; kept |
| 8 | A zoom slider on an axis | `visual.objects.zoom[0].properties`: `show`, `showOnCategoryAxis`, `showOnValueAxis`, `showLabels`, `showTooltip` | documented | low; takes room | low | drawn (a slider beside the value axis, although only the category one was asked: the switches need a second look); kept |
| 9 | Which header icons a visual shows | `visualContainerObjects.visualHeader[0].properties`: `show` and 21 `show...Button` switches (`showFocusModeButton`, `showOptionsMenu`, `showPinButton`, `showVisualInformationButton` ...); report-wide: `report.json` `settings.hideVisualContainerHeader` | documented (reading view only) | low | medium: a cleaner reading view (all) | kept on Save; the header only shows in reading view, which was not opened |
| 10 | Keep a visual's layer when it is clicked | `visualContainerObjects.general[0].properties.keepLayerOrder` = true | documented ("Maintain layer order") | low | medium: the "No data" card under a chart, the panels | kept; the effect was not tested |
| 11 | The donut's ring width and a value in its middle | `visual.objects.slices[0].properties.innerRadiusRatio` (integer, 75 = a thin ring), `startAngle`; `visual.objects.centerValue[0].properties.show`; `labels.labelStyle` (`'Category, percent of total'` ...) | `slices`, `labels`: documented; `centerValue`: schema only | `centerValue`: medium (new, and its text was cut) | medium (the operations layout's donut) | drawn: a thin ring, labels with percents; the centre value appears but is cut to "1…" at its default size |
| 12 | Data bars in a table column | `visual.objects.columnFormatting[]`, selector `{ metadata: "<queryRef>" }`: `dataBars: { positiveColor, negativeColor, axisColor, reverseDirection, hideText }` | documented (conditional formatting) | low | **medium to high** (1, 2, 4, 8) | drawn: a bar in every row of the measure's column; the number sits over the bar's end; kept (the table's file was not rewritten by Desktop, it still opened) |
| 13 | An accent bar and a divider inside the card | `visual.objects.accentBar[0]` (`show`, `position` Left/Right/Top/Bottom, `color`, `width`) and `visual.objects.divider[0]` (`show`, `dividerColor`, `dividerWidth`), selector `{ id: "default" }` | documented (card format pane) | low | low to medium (the writer draws its own accent in the page background) | accent bar drawn at the value's left; the divider did not show (it separates the callout from reference labels, and none showed) |
| 14 | Reference labels on a card (a second number under the value: last year, target) | `visual.objects.referenceLabel[]` with selector `{ id: "<id>" }` and `value` = a measure expression; `referenceLabelTitle`, `referenceLabelValue`, `referenceLabelDetail`, `referenceLabelLayout` | documented (Learn: "Create a card visual", reference labels) | medium: the hand-written form did **not** draw | **high** if it can be written: "this Ramadan / last Ramadan" in one card (1, 3) | **not drawn**: Desktop kept the entry but showed no label, so the form is incomplete (the label's field probably has to be in the query too). Needs one report made by hand in Desktop and its saved JSON |
| 15 | A click filters the other visuals instead of dimming them | `report.json` `settings.defaultFilterActionIsDataFilter` = true | documented (report settings, "cross filtering") | low | medium (all) | accepted and kept on Save; the click itself was not tried |
| 16 | The report's own locale for number and date formats | `report.json` `settings.locale` (and `defaultDisplayUnitsToNone`) | documented (Learn: "Default format string locale", generally available May 2026) | low | medium for Arabic and Gulf reports: dates and numbers the same for every viewer. It does **not** change Power BI's own words ("All", "Select all"): those follow the viewer | written (`GX locale AR`), the report opened without a message; its page was not captured (the bridge returned no picture), so nothing was seen |
| 17 | Edit interactions (which visual filters which) | `page.json` `visualInteractions[]` | documented | low | medium: slicers that should not filter a KPI, a table that should not dim the charts | not opened (schema only tonight) |
| 18 | Drillthrough and field-bound tooltip pages | `page.json` `pageBinding.parameters[]` (`boundFilter`, `fieldExpr`), `visualContainerObjects.visualLink.drillthroughSection` | documented | medium (more files must agree) | medium: "click a branch, see its page" | not opened |
| 19 | The filter pane's look | `page.json` / theme `outspacePane` and `filterCard` (`searchTextSize`, `headerSize`, `inputBoxColor`, `checkboxAndApplyColor`; states Available / Applied) | documented (theme docs) | low | low to medium on dark designs | not opened |
| 20 | Small multiples | chart role `Rows` plus `visual.objects.smallMultiplesLayout` (`rowCount`, `columnCount`, `gridPadding` ...) and `subheader`; on the card: role `Rows` and the `smallMultiples*` objects | documented | low to medium (needs room) | medium: one small chart per branch or year | not opened |
| 21 | The button slicer and the list slicer | visual types `advancedSlicerVisual` (generally available) and `listSlicer` (preview), with states default / hover / selected in `instance-selectors` | documented; `listSlicer` preview | `listSlicer`: preview | medium: years or branches as buttons instead of a dropdown | not opened |
| 22 | Subtotals, blank rows and totals in a matrix | `pivotTable` `subTotals`, `rowTotal`, `columnTotal`, `blankRows` | documented | low | low (the writer's matrix is flat) | not opened |
| 23 | Forecast and anomalies on a line | `lineChart` `forecast`, `anomalyDetection` | documented (Analytics pane; need a date axis) | medium: models differ | low: easy to mislead with | not opened |
| 24 | Theme: icons, more text classes, structural colours | theme `icons`, `textClasses.largeTitle/dataTitle/boldLabel/...`, `firstLevelElements` ... `accent`, `null` | documented (theme schema) | medium: one unknown property and the menu import refuses the theme | medium (see top 5, item 4) | not opened |

**From TMDL, not looked at tonight:** field parameters, calculation groups and visual calculations (generally
available since May 2026 per Microsoft Learn) are model or query features; the tools read models and never write them,
so they are left for a round of their own.

**What "saved back" proved:** Desktop upgraded the changed visuals' schema from visualContainer 2.1.0 to 2.13.0 and
the report's to 3.3.0 and wrote every object above exactly as it was hand-written (`builder-scripts\n1-gx-diff.mjs`),
so the names, the value forms (`'text'`, `40000D`, `75L`, `true`) and the selectors are Desktop's own. It did not prove
that a setting has an effect: the column "In Desktop" says where the effect was seen.
