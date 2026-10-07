# What Power BI can do that the DataArcus writer does not use yet

Research only (night of 6-7 October 2026, the laptop builder). Nothing here is shipped. It lists settings that Power BI
Desktop and the PBIR files accept and that `assets/js/pbip-export.js` and `assets/js/design-engine.js` never write, so
the next rounds can pick from measured facts instead of guesses.

## Lab 7 Oct: what to adopt
Two hours on the laptop, 7 October 2026 (03:46 to 05:46 UTC), Power BI Desktop 2.158.1177. All 24 settings below were
written by hand into one gallery report on the repo's made-up Ramadan sample, opened in Desktop and judged from
captures of the page at its own size (1280 x 720). Research only: nothing in the writer changed. The verdict of each is
in the table's last column, "Seen 7 Oct". Count: **10 work, 11 work with a catch, 3 could not be seen in Desktop,
0 break a report by themselves** (one, the locale, empties the report when written into our present report.json:
see #16).

"Points" below are golden-report points (10 a task, mean 9.4 in both languages after the night sitting, target 9.5).
They say what a setting **could** win at most; none was re-scored in this lab.

### ADOPT NOW (works, low risk)
1. **#1 The card's blank text.** "No data" / «لا توجد بيانات» instead of "--". One property on a card we already
   write. Two rules measured here: the text one size step under the value (30pt under a 38pt value), and only on cards
   about 300 wide or more (at 240 wide the Arabic text is cut with "…" even at 30pt). Could win: task 10 (no rows,
   8 / 8) up to 1 point in each language, together with the chart message that is already built; and it keeps a point
   on any task a user filters to nothing.
2. **#2 A subtitle under a chart's title** (with **#3**, its divider, if wanted). Shaped right in Arabic. Could win:
   task 7 Arabic (8: three charts with one title) up to 1 point, by saying in the subtitle what each chart is by;
   protects task 6 (long titles) because the long part can move out of the title. The subtitle's text has to come from
   the plan the user approved, like every other text.
3. **#4 A heading level on titles.** Nothing to see, nothing to break; for screen readers. No golden point.
4. **#12 Data bars with the number hidden**, as a table column the user asks for ("show it as a bar"). Clean. With
   the number shown it is hard to read, so the writer should offer only the hidden form, beside a plain number column.
   No golden point today; it is the safe relative of the experimental picture column.
5. **#6 Data labels with a position and units** on column charts with few columns. No golden point.

### ADOPT AS OPTION (needs a number or a choice from the user)
- **#5 A constant line** (a target): needs the user's number and its name. Write `y1AxisReferenceLine` on column
  **and bar** charts (the research file said `xAxisReferenceLine` for bars: it draws nothing). On a bar chart keep the
  label away from the first bar's own label.
- **#14 A reference label on a card** (last Ramadan under this Ramadan): it draws now, with the full selector. Before
  it is offered: the label's own name (today it shows the measure's name, which is honest but long), its number format
  (74.675K), and a second label. One card made by hand in Desktop and saved would show these three.
- **#16 The report's locale** for Arabic and Gulf reports (dates 13/01/2024, Arabic month names on a date axis).
  Worth having, but it needs the writer's report.json moved to schema 3.3.0 first, which touches every report: a round
  of its own, with every golden report opened again.
- **#15 A click filters instead of dims**: a report-wide choice. Good for dashboards read by people who do not know
  the faded bars; a chart by the same field shrinks to one column.
- **#17 A slicer that leaves one card alone**, **#18 a drillthrough page**: both work as written. Each is a thing the
  user has to ask for by name ("this card is always the full year", "click a branch to see its page"). A drillthrough
  page wants a Back button.
- **#21 The button slicer** for a short list (years): works with no formatting; give each button at least 60 of
  height or its text is not drawn.
- **#7 Smooth or stepped line, markers, area**; **#11 the thin ring** (without the centre value); **#13 the accent
  bar** at the top or bottom of a card (the left one needs left padding); **#22 matrix subtotals**; **#20 small
  multiples** (half a page at least); **#8 the zoom slider** on a date axis only; **#19 the filter pane's text sizes
  and colours**: all style choices, none wins a golden point.
- **#24 The look in the theme** (text classes): the strongest finding for "the report stays good after the user edits
  it": three text classes restyled every title, axis and total of the gallery at once. Needs its own round: each class
  mapped to what it drives, a known font name for each, and the View > Themes import tried.

### SKIP (and why)
- **#23 Forecast and anomalies**: the switch alone draws nothing, and on seasonal data that moves with the Hijri
  year it would mislead.
- **#9 Header icons**, **#10 Keep layer order**: nothing changes in Desktop; they act in the service's reading view,
  which needs a sign-in this lab does not do. #10 also means: while editing, a selected "No data" card will show over
  its chart whatever we write (it goes back when the selection is dropped).
- **#11 The donut's centre value**: cut to "10…" at every size tried.
- **The list slicer**: a preview visual.
- **The zoom slider on a category axis**: never drawn on categories.

### Surprises
1. `settings.locale` in a report.json of schema 2.1.0: Desktop opens the project with an **empty canvas and no
   message**. The bridge's capture then fails with "Print metadata is not available". With schema 3.3.0 (and the
   theme's `reportVersionAtImport` as an object) the same report opens and the locale works.
2. Reference labels can be hand-written after all: the selector needs the data wildcard, the card value's `metadata`,
   an `id` and an `order`.
3. A bar chart's constant line is `y1AxisReferenceLine`, the same object as a column chart's.
4. A button slicer draws empty buttons when they are short; a category zoom slider only exists on a date axis.
5. Theme text classes we never set drive most of the text in a report; an unknown font name becomes a serif font
   without a word.
6. Desktop's editor lifts any selected visual over the ones above it, so "keep layer order" cannot be judged there.
7. On Save, Desktop kept all 250 hand-written entries of the gallery as written (0 changed, 0 dropped), also the ones
   that draw nothing (reference label with the short selector, the forecast switch): **kept on Save is no proof that
   a setting works**. It moved report.json to schema 3.3.0 and gave the tooltip pages an empty `parameters` list.
8. Microsoft's validator reports two errors on `anomalyDetection` ("Value nested inside show") that are its own
   mistake: the object has a property named `Value`.

### The gallery (open it yourself)
`mcp/research/capabilities-gallery/` on the branch `research/capabilities-lab` (on the laptop:
`C:\DataArcus\lab-wt\mcp\research\capabilities-gallery\`). Open **`Capabilities Gallery.pbip`** in Power BI Desktop;
the yellow "Refresh now" bar is the sample's own (its tables are DAX tables) and can be left. Made-up data only.

| Page | Shows |
|---|---|
| 1 KPI cards | row 1: #13 accent bar left, top, bottom; row 2: #1 blank text, default, English and Arabic at 38 and 30pt on cards 240 wide; row 3: #14 reference labels, four hand-written forms (A draws nothing, C, E and F draw); row 4: #1 Arabic at 38, 30, 24, 20pt on cards 304 wide |
| 2 Chart titles | #2 subtitle, #3 divider, #4 heading: plain, small grey, long wrapped title, blue centred |
| 3 Charts | top: #5 constant line and #6 labels on a column and a bar chart, #7 smooth line, #11 thin ring; bottom: #7 stepped line, #5 on a bar chart with `y1AxisReferenceLine`, #8 zoom, #20 small multiples |
| 4 Tables | #12 data bars with the number shown and hidden; #22 matrix as the writer leaves it and with subtotals, totals and blank rows |
| 5 Interaction | #17 the Year slicer and the card it does not filter; #15 click a column (the gallery has "click filters" on); #18 right-click a column > Drill through; #9 the left chart's header switches; #10 two cards under charts |
| 6 Slicers | #21 classic slicer, button slicer short (empty buttons) and tall, list slicer; #11 the ring at 612 x 290 |
| 7 Report-wide and theme | #16 dates and numbers; #19 the filter pane's look |
| 8 Line analytics | #23 daily line: plain, forecast switch, zoom on the date axis (#8), anomalies switch |
| Quarter detail (drillthrough) | #18's target page, hidden |

**`Capabilities Gallery AR.pbip`**: pages 1, 2, 3 and 7 again with the Arabic texts and `settings.locale: ar-AE`
(#16). Its layout is left to right and its field names English on purpose: no Arabic names were given, and the lab
never translates a field.
**#24, the theme:** `themes/lab-24-text-classes.json` is the gallery's theme plus the text classes, structural
colours and one icon, in loud colours. To see it: View > Themes > Browse for themes, pick that file (this also tries
the menu import, which the lab did not).

Crops (on the laptop only, not committed): `C:\DataArcus\tests\lab-1007\`: `en1-p1..9.png` (first build), `en2-*`
(second), `en3-*` and `final-*` (last build), `en3t-*` and `en3t2-p3.png` (with the lab theme), `ar2-p1..4.png`
(Arabic), `ar1-window.png` (the empty canvas), `p5-*.png` and `p6-button-2023.png` (the click tests, screen captures
of the canvas at the screen's own size, 0.86 of the page). What each page was expected to show, written before the
first open: `EXPECTED-en.txt`, `EXPECTED-ar.txt`. Scripts: `builder-scripts\lab-1007-*`.

### How it was done, and its limits
- The report is `create_report`'s own (main's server) on the Ramadan sample; each capability was then written into
  copies of its visuals (`lab-1007-base.mjs`, `lab-1007-patch.mjs`). Three builds; the committed one is the last.
- Opening Desktop from a script must not be waited on through a pipe: Desktop inherits it and the caller waits until
  Desktop closes (8 minutes lost twice; `lab-1007-run.ps1` starts the script in a process of its own with a log file).
  After "ready" the page tabs take up to a minute more to exist for UI Automation.
- Pages were captured through the Desktop bridge at scale 1; clicks (slicer, column, drill through, card under a
  chart) through the mouse while the laptop was idle. No preview feature was switched on, nobody signed in.
- Not seen for lack of a reading view: #9, #10. Not tried: the View > Themes import (#24), icons in a rule (#24),
  a phone layout or PDF of any of it, a dark theme, a 1920 x 1080 page.
- The model-side features were reached at the end: see "Model-side features" below. **Not reached:** nothing of the list; left open inside it: #14's label name, #23's `transform` block, #24's menu import.

### Model-side features (field parameter, calculation group, visual calculation)
Tried on a COPY of the Ramadan sample in the tests folder (`<tests folder>lab-1007	mdl-try`, not committed;
`builder-scriptslab-1007-tmdl.mjs`), written by hand, opened in Desktop 2.158. **All three opened and drew at the first try**
(`tmdl1-p1.png`, `tmdl2-dayname.png`); Microsoft's validator: 0 errors.

| Feature | What was written | Seen |
|---|---|---|
| Calculation group | a table file with `calculationGroup`, `precedence`, two `calculationItem`s (`SELECTEDMEASURE()` and it inside `CALCULATE` for Ramadan days), its name column (`sourceColumn: Name`, sorted by a hidden `Ordinal`), `ref table` and **`discourageImplicitMeasures`** in model.tmdl. In the report: the group's column as a matrix's Columns | the matrix has a "Value" and a "Ramadan only" column with the right numbers (101,914 and 99,900) |
| Field parameter | a DAX table `{ ("Quarter", NAMEOF(...), 0), ("Day Name", NAMEOF(...), 1) }` with three columns: the name (with `relatedColumnDetails` > `groupByColumn`), the hidden field column carrying `extendedProperty ParameterMetadata = { "version": 3, "kind": 2 }`, the hidden order. In the report: the chart's Category keeps a real field and gets `fieldParameters: [{ parameterExpr: <the name column>, index: 0, length: 1 }]`; a slicer on the name column | picking "Day Name" in the slicer switched the chart from quarters to day names |
| Visual calculation | one more projection in the table: `field: { NativeVisualCalculation: { Language: "dax", Expression: "RUNNINGSUM([Total Sales])", Name: "Running total" } }`, `queryRef: "select"` | a "Running total" column: 77,734.00, 100,810.00, 101,362.00, 101,914.00 (it has no format: two decimals) |

**What our tools would need to write them.** A visual calculation is report-only (one projection): `create_report`
could write it today, for a running total or a share of total, with a format. A field parameter and a calculation
group are **model** objects: the tools read models and never write them, so they would come as a TMDL script the user
applies (as the fix scripts do), never as a silent edit; then `create_report` binds to them. Two cautions, neither
tested here: a calculation group switches the model to `discourageImplicitMeasures`, and the writer's own charts use
implicit aggregates ("Min of Month Number" to sort month names), which such a model refuses; and the day names came
sorted by value, not by weekday, when the axis came from the parameter.

### Seen, not in scope
- Every open shows "One or more calculated objects need to be manually refreshed" (the sample's DAX tables).
- At 304 wide: the line charts by Month Short have a horizontal scrollbar and December is behind it; the bar chart
  cuts the day names ("Mond…", "Wedn…"); a two-line title takes a fifth of the chart.
- The lab's own long card titles are cut with "…" (they are the lab's, not the writer's).
- The Arabic gallery's first page showed an empty header box in its capture (`ar2-p1.png`); the other pages show
  the report's name.
- Microsoft's validator warns on every page that the writer's 40-high header text box "may be too small for 16pt"
  (9 warnings), and that the drillthrough page has no Back button.
- `create_report`'s notes on this sample: Calendar[Month Short] and Calendar[Day Name] have no sort-by column in the
  model; three slicer titles were shortened to "…" in the 220-wide filter rail (the rail was then removed by the lab).
- The matrix's row-subtotal label is repeated on the grand total row; the reference label's value shows three
  decimals; the left accent bar touches the value.
- The bridge's capture includes the Filters pane and the refresh bar beside the page (no title bar, no account).

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

**Not done:** Desktop's Options > Preview features list could not be read: UI Automation opens File > Options and
settings > Options, but the dialog's contents are not exposed to it (one try, `builder-scripts\n1-preview.ps1`; the
dialog was closed with the test report, nothing in it was touched). The format pane was not walked by hand (no person
at the laptop). No preview feature was switched on, so none had to be switched off. The visual gallery did show two
entries marked "(Preview)" in Desktop 2.158: "List slicer (Preview)" and "Goals (Preview)". Keyboard shortcuts were not collected. Nothing outside Power BI's public schemas, the files
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
3. **A constant line with its label** (`y1AxisReferenceLine` on column, line and, as the lab of 7 Oct found, bar
   charts too; `xAxisReferenceLine` drew nothing on a bar chart): a target or last year's average drawn on the chart, named. High value for the Ramadan task (3) and any
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

| # | What it does | The exact property (as written, opened and saved back by Desktop 2.158 unless said) | Status | Risk | Value for DataArcus (golden task) | In Desktop tonight | Seen 7 Oct (verdict; crop in `<tests folder>\lab-1007\`) |
|---|---|---|---|---|---|---|---|
| 1 | Text for a blank KPI value instead of "--" | `visual.objects.value[0].properties.showBlankAs` = text literal, selector `{ id: "default" }` (the entry that already holds the card's font size) | schema only (capabilities: "Show blank as") | low: one optional text | **high**: every report filtered to nothing; the "No data" idea for cards (all tasks) | drawn: both cards read "No data" on a page filtered to an empty selection (`gx-pair.png`); with «لا توجد بيانات» the text is shaped and whole, but at the value's own size its dots touch the card's bottom edge (`gx-blank-ar-crop.png`): a blank text wants to be short or the value a size smaller; not saved back | **WORKS WITH A CATCH** (`en2-p1.png`): "--" becomes "No data" at 38pt and 30pt. The Arabic text is whole at 30, 24 and 20pt in a card 304 wide; at 38pt its lowest strokes are cut by the card's bottom; in a card 240 wide it is cut with "…" at 38pt and at 30pt. Rule to take: the blank text one step under the value size, and never on a card under about 300 wide |
| 2 | A subtitle under the title | `visualContainerObjects.subTitle[0].properties`: `show`, `text`, `fontSize`, also `fontColor`, `alignment`, `bold`, `fontFamily`, `titleWrap`, `heading`; no selector | documented (format pane, Title > Subtitle) | low | **high**: long titles (6), context lines (3) | drawn in small text under the title; kept as written on Save | **WORKS** (`en1-p2.png`, Arabic `ar2-p2.png`): one small line under the title, shaped right in Arabic; colour, bold, size and centring all obeyed. A long title wraps to three lines above it and the plot loses that height |
| 3 | A divider line under the title area | `visualContainerObjects.divider[0].properties`: `show`, `color`, `width`, `style` (solid, dashed, dotted), `ignorePadding` | documented (format pane, Title > Divider) | low | medium | drawn (a dotted line); kept | **WORKS** (`en1-p2.png`): solid, dotted (edge to edge with `ignorePadding`) and dashed 3px blue, between the title area and the plot |
| 4 | A heading level for the title (screen readers) | `visualContainerObjects.title[0].properties.heading` = `'Heading2'` ... `'Heading6'` | documented (accessibility) | low | medium: accessibility, nothing to see | accepted and kept (nothing visible, as meant) | **WORKS** as meant (`en1-p2.png`): nothing to see; chart 2 differs from chart 1 by its subtitle and divider only. Kept on Save |
| 5 | A constant line with a label | `visual.objects.y1AxisReferenceLine[]` with selector `{ id: "<any id>" }`: `show`, `displayName`, `value` (number), `lineColor`, `style`, `dataLabelShow`, `dataLabelText` (`Value`, `Name`, `ValueAndName`), `dataLabelColor`, `dataLabelHorizontalPosition`, `dataLabelVerticalPosition`; shading: `shadeShow`, `shadeRegion` | documented (Analytics pane) | low | **high**: targets (3, 1) | drawn: a dashed line "Target: 40000" across the column chart; kept | **WORKS WITH A CATCH** (`en2-p3.png`, Arabic label `ar2-p3.png`): the dashed line and "Target: 20000" on the column chart. **On a bar chart the object is `y1AxisReferenceLine` too** (a vertical line at 8,000): `xAxisReferenceLine` drew nothing there. The label shows the bare number (20000, no separator) and on the bar chart it sits over the first bar's own label |
| 6 | Data labels with position and units | `visual.objects.labels[0].properties`: `show`, `labelPosition` (`OutsideEnd` ...), `labelDisplayUnits` (1000 = thousands), `labelPrecision`; also `showBlankAs` on chart labels | documented | low | medium (the writer uses `labels.show` only on the tooltip charts and, since tonight, the day chart) | drawn (77.7K above the columns); kept | **WORKS** (`en2-p3.png`): 77.7K above the columns (thousands, one decimal); on bars `OutsideEnd` with units 1 gives the full number without a separator (14178), no position gives 15K. `InsideEnd` drew no labels on the bar chart (`en1-p3.png`) |
| 7 | A smooth or stepped line, markers, a filled area | `visual.objects.lineStyles[0].properties`: `lineChartType` (`linear`, `smooth`, `step`), `showMarker`, `markerSize`, `areaShow`, `strokeWidth` | documented | low | medium: the line charts (1, 3, 4) | drawn: a smooth line, a dot per month, a tinted area; kept | **WORKS** (`en1-p3.png`): the smooth line with a dot per month and a tinted area; the stepped 3px line without dots |
| 8 | A zoom slider on an axis | `visual.objects.zoom[0].properties`: `show`, `showOnCategoryAxis`, `showOnValueAxis`, `showLabels`, `showTooltip` | documented | low; takes room | low | drawn (a slider beside the value axis, although only the category one was asked: the switches need a second look); kept | **WORKS WITH A CATCH** (`en2-p3.png`, `en2-p8.png`): the value-axis slider draws (also when only `show` is written). The category slider draws only on a continuous (date) axis, never on the four quarters; on a chart 155 high it takes about 45 and squeezes the plot |
| 9 | Which header icons a visual shows | `visualContainerObjects.visualHeader[0].properties`: `show` and 21 `show...Button` switches (`showFocusModeButton`, `showOptionsMenu`, `showPinButton`, `showVisualInformationButton` ...); report-wide: `report.json` `settings.hideVisualContainerHeader` | documented (reading view only) | low | medium: a cleaner reading view (all) | kept on Save; the header only shows in reading view, which was not opened | **NOT SEEN** (`p5-header-hover-A.png`): Desktop's editor shows the filter, focus and "…" icons on the chart whatever is written; the switches act in the reading view of the Power BI service, which this lab cannot open (no sign-in). Kept on Save |
| 10 | Keep a visual's layer when it is clicked | `visualContainerObjects.general[0].properties.keepLayerOrder` = true | documented ("Maintain layer order") | low | medium: the "No data" card under a chart, the panels | kept; the effect was not tested | **NOT SEEN** (`p5-layer-notkept-2.png`, `p5-layer-kept-2.png`): in Desktop's editor a clicked card comes over its chart while it is selected, **with and without** `keepLayerOrder`, and goes back when the selection is dropped. The setting is for the reading view; it changes nothing while editing |
| 11 | The donut's ring width and a value in its middle | `visual.objects.slices[0].properties.innerRadiusRatio` (integer, 75 = a thin ring), `startAngle`; `visual.objects.centerValue[0].properties.show`; `labels.labelStyle` (`'Category, percent of total'` ...) | `slices`, `labels`: documented; `centerValue`: schema only | `centerValue`: medium (new, and its text was cut) | medium (the operations layout's donut) | drawn: a thin ring, labels with percents; the centre value appears but is cut to "1…" at its default size | **WORKS WITH A CATCH** (`en2-p3.png`, `en3-p6.png`): the thin ring and percent labels draw; the centre value is cut to "10…" for 101,914, in a 312 x 316 box and in a 612 x 290 one alike (the centre has no size setting). Take the ring, leave the centre value |
| 12 | Data bars in a table column | `visual.objects.columnFormatting[]`, selector `{ metadata: "<queryRef>" }`: `dataBars: { positiveColor, negativeColor, axisColor, reverseDirection, hideText }` | documented (conditional formatting) | low | **medium to high** (1, 2, 4, 8) | drawn: a bar in every row of the measure's column; the number sits over the bar's end; kept (the table's file was not rewritten by Desktop, it still opened) | **WORKS** (`en1-p4.png`): with `hideText: true` the column is a clean bar per row; with the number shown, the number sits on the bar's dark end and is hard to read. The total row has no bar |
| 13 | An accent bar and a divider inside the card | `visual.objects.accentBar[0]` (`show`, `position` Left/Right/Top/Bottom, `color`, `width`) and `visual.objects.divider[0]` (`show`, `dividerColor`, `dividerWidth`), selector `{ id: "default" }` | documented (card format pane) | low | low to medium (the writer draws its own accent in the page background) | accent bar drawn at the value's left; the divider did not show (it separates the callout from reference labels, and none showed) | **WORKS WITH A CATCH** (`en2-p1.png`): the bar draws at the left, top and bottom. At the left it touches the first digit (the writer's cards have no left padding); top and bottom are clean. The divider shows only on a card that has a reference label |
| 14 | Reference labels on a card (a second number under the value: last year, target) | `visual.objects.referenceLabel[]` with selector `{ id: "<id>" }` and `value` = a measure expression; `referenceLabelTitle`, `referenceLabelValue`, `referenceLabelDetail`, `referenceLabelLayout` | documented (Learn: "Create a card visual", reference labels) | medium: the hand-written form did **not** draw | **high** if it can be written: "this Ramadan / last Ramadan" in one card (1, 3) | **not drawn**: Desktop kept the entry but showed no label, so the form is incomplete (the label's field probably has to be in the query too). Needs one report made by hand in Desktop and its saved JSON | **WORKS WITH A CATCH** (`en2-p1.png`): **the label draws** under a divider ("Total Sales Last Ramadan", 74.675K) when its selector is `{ data: [{ dataViewWildcard: { matchingOption: 0 } }], metadata: "<the card value's queryRef>", id, order }`; with `{ metadata, id, order }` alone the label shows "--" (`en1-p1.png`), with `{ id }` alone nothing (last night's form). Still open: the label's own title text (`titleText`, also with `titleContentType: 'custom'`) was ignored, so the label is named by its measure; a second label did not show; the value has three decimals |
| 15 | A click filters the other visuals instead of dimming them | `report.json` `settings.defaultFilterActionIsDataFilter` = true | documented (report settings, "cross filtering") | low | medium (all) | accepted and kept on Save; the click itself was not tried | **WORKS** (`p5-click-dims.png` off, `p5-click-filters.png` on): off, a click on Q1 leaves the other chart's bars faded with a darker part; on, every other visual is redrawn for Q1 only. The catch is by design: a chart by the same field shrinks to one column |
| 16 | The report's own locale for number and date formats | `report.json` `settings.locale` (and `defaultDisplayUnitsToNone`) | documented (Learn: "Default format string locale", generally available May 2026) | low | medium for Arabic and Gulf reports: dates and numbers the same for every viewer. It does **not** change Power BI's own words ("All", "Select all"): those follow the viewer | written (`GX locale AR`), the report opened without a message; its page was not captured (the bridge returned no picture), so nothing was seen | **WORKS WITH A CATCH** (`ar2-p4.png` against `en1-p7.png`): with `ar-AE` the dates read 13/01/2024 (they read 1/13/2024 without it) and the date axis has Arabic month names; digits stay Western, numbers do not change. **It must be written in a report.json of schema 3.3.0: in our 2.1.0 file Desktop opened the project as an empty canvas, no pages and no message** (`ar1-window.png`); that is what "opened without a message" was last night |
| 17 | Edit interactions (which visual filters which) | `page.json` `visualInteractions[]` | documented | low | medium: slicers that should not filter a KPI, a table that should not dim the charts | not opened (schema only tonight) | **WORKS** (`p5-slicer-2023.png`): 2023 picked, the first card reads 12,371 and the card named as the exception keeps 101,914. `{ source, target, type: "NoFilter" }`, kept on Save |
| 18 | Drillthrough and field-bound tooltip pages | `page.json` `pageBinding.parameters[]` (`boundFilter`, `fieldExpr`), `visualContainerObjects.visualLink.drillthroughSection` | documented | medium (more files must agree) | medium: "click a branch, see its page" | not opened | **WORKS** (`p5-drillthrough.png`): right-click on the Q1 column > Drill through > "Quarter detail (drillthrough)" opens the page for Q1 (77,734). Microsoft's validator asks for a Back button on such a page (a warning) |
| 19 | The filter pane's look | `page.json` / theme `outspacePane` and `filterCard` (`searchTextSize`, `headerSize`, `inputBoxColor`, `checkboxAndApplyColor`; states Available / Applied) | documented (theme docs) | low | low to medium on dark designs | not opened | **WORKS** (`en1-p7.png`): the pane 300 wide, larger "Filters" and section headers, card text 13pt, pale amber search box; only on the page that carries it |
| 20 | Small multiples | chart role `Rows` plus `visual.objects.smallMultiplesLayout` (`rowCount`, `columnCount`, `gridPadding` ...) and `subheader`; on the card: role `Rows` and the `smallMultiples*` objects | documented | low to medium (needs room) | medium: one small chart per branch or year | not opened | **WORKS WITH A CATCH** (`en1-p3.png`): one small chart per year in a 2 x 2 grid with the year above each; in 312 x 312 the axis text is tiny and the fifth and sixth year are behind a scrollbar. It wants half a page |
| 21 | The button slicer and the list slicer | visual types `advancedSlicerVisual` (generally available) and `listSlicer` (preview), with states default / hover / selected in `instance-selectors` | documented; `listSlicer` preview | `listSlicer`: preview | medium: years or branches as buttons instead of a dropdown | not opened | **WORKS WITH A CATCH** (`en3-p6.png`, `p6-button-2023.png`): the button slicer filters (2023 pressed: 12,371) and needs no formatting written. **Buttons under about 60 high drew empty, without their text.** The list slicer drew its list of years with no preview feature switched on by this lab; whether this Desktop already had it on could not be read, so it stays a preview visual |
| 22 | Subtotals, blank rows and totals in a matrix | `pivotTable` `subTotals`, `rowTotal`, `columnTotal`, `blankRows` | documented | low | low (the writer's matrix is flat) | not opened | **WORKS WITH A CATCH** (`en1-p4.png`): subtotals at the bottom of each year, the coloured total column named "All days", an empty row between years. The row subtotal label ("Year total") is also put on the grand total row |
| 23 | Forecast and anomalies on a line | `lineChart` `forecast`, `anomalyDetection` | documented (Analytics pane; need a date axis) | medium: models differ | low: easy to mislead with | not opened | **NOT SEEN** (`en2-p8.png`): `forecast.show` and `anomalyDetection.show` alone draw nothing and give no message (Desktop keeps them on Save); Desktop's own form carries a `transform` block that has to be read from a chart made by hand. On this sample a forecast would mislead anyway: the line is flat at 1 with one block a year that moves about 11 days earlier each year |
| 24 | Theme: icons, more text classes, structural colours | theme `icons`, `textClasses.largeTitle/dataTitle/boldLabel/...`, `firstLevelElements` ... `accent`, `null` | documented (theme schema) | medium: one unknown property and the menu import refuses the theme | medium (see top 5, item 4) | not opened | **WORKS WITH A CATCH** (`en3t-p1.png` … `en3t-p8.png`, `en3t2-p3.png`; every page differs from the captures before by 29,038 to 106,496 pixels): loaded from inside the project, the unused text classes restyle every visual at once: `largeTitle` colours the chart and card titles, `smallLightLabel` the axis text and the constant line's label, `boldLabel` the table and matrix totals. A font name Power BI does not know ("Segoe UI Bold") turned the totals into a serif font, silently. The structural colours changed nothing that could be told apart; the icon was not seen (no icon rule in the gallery). Microsoft's validator passed the theme. **The View > Themes import was not tried** |

**From TMDL, not looked at on the night (tried on 7 Oct: see "Model-side features" in the lab section above):** field parameters, calculation groups and visual calculations (generally
available since May 2026 per Microsoft Learn) are model or query features; the tools read models and never write them,
so they are left for a round of their own.

**What "saved back" proved:** Desktop upgraded the changed visuals' schema from visualContainer 2.1.0 to 2.13.0 and
the report's to 3.3.0 and wrote every object above exactly as it was hand-written (`builder-scripts\n1-gx-diff.mjs`),
so the names, the value forms (`'text'`, `40000D`, `75L`, `true`) and the selectors are Desktop's own. It did not prove
that a setting has an effect: the column "In Desktop" says where the effect was seen.
