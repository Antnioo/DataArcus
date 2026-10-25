# Power BI facts learned the hard way

Moved here unchanged by A1 (0.3.1, 25 Oct) from `mcp/CLAUDE.md` ("Power BI facts learned the hard way"). What was
measured in Desktop, how, and the quirks: [scripts/tests/DESKTOP-TESTS.md](../../scripts/tests/DESKTOP-TESTS.md).
Code comments that say "round 0, mcp/CLAUDE.md" or "mcp/CLAUDE.md, Round 1" mean the rounds below.

- PBIR: positions of visuals inside a group are relative to the group. Schemas used: report 2.1.0, page 2.0.0, visualContainer 2.1.0, definitionProperties 2.0.0 (version "4.0").
- Theme font sizes must stay within 8-60. The menu import refuses the whole theme otherwise; a theme inside a project loads silently with broken text.
- Power BI Desktop saves projects as TMDL by default (no model.bim). `tmdl-model.js` reads them for the health check.
- TMDL has no `dataType` for columns whose type Power BI infers from DAX (columns of DAX tables, like the calendar
  generator's). A .pbit has it. The reader marks them `unknown`, and the engine skips (and lists) the checks that need
  a type for them: never default a missing type to text, it gives wrong findings.
- A relationship created through the API needs a Calculate refresh before queries work.
- TMDL `createOrReplace` gives objects new lineage tags when the script has none (hand-written test models have none; Desktop exports do).
- Aggregations need a DirectQuery detail table; Import-only test models can't have them.
- A theme's colours should drive the report's colours (`create_report` does this).
- Buttons (`actionButton`): each formatting card's `show` switch goes in its own entry with no selector; the look
  (text, colours, font) goes in the entry with `selector: { id: 'default' }`. A `show` inside the state selector is
  ignored, and the text, fill or outline stay hidden (found in Desktop 2.157; matches Microsoft's button reference).
- A theme's text sizes are made for the report's page. A much smaller page (the 320 x 240 tooltip page) needs its
  own sizes on the visuals, or a 42pt card value is cut off.
- Columns of DAX tables have no type in TMDL: the field picker must not guess them as text either (it made charts
  "by Amount"); `pbip-bind.js` marks them `unknown` and picks categories by name.
- In `mobile.json`, visuals inside a group use page positions, not positions relative to the group as in
  `visual.json` (checked in Desktop 2.158: with relative positions the KPI cards landed on the header).
- Round 0, measured in Desktop 2.158 (`scripts/tests/DESKTOP-TESTS.md`):
  - A report page tooltip is linked with `visualTooltip.type: 'Canvas'` (`'ReportPage'` is not a value: Desktop shows
    its default tooltip). The tooltip is always opaque, whatever the tooltip page's background says.
  - **A formatting entry's selector decides whether Desktop uses it.** The card's container `padding` and `spacing`
    and its `fillCustom.show` are ignored with the `default` selector and work without one; the card's `value`,
    `label` and `outline` need it. Try a new entry both ways on a flat-coloured page before trusting it.
  - The card visual has its own fill, on by default: `fillCustom: [{ properties: { show: false } }]` turns it off.
  - An image keeps its ratio with `image.fit: 'Fit'`; the old `imageScaling.imageScalingType: 'Fit'` stretches it.
  - A table header follows its column with `columnFormatting` (selector `{ metadata: queryRef }`): `alignment` plus
    `styleHeader`, `styleValues`, `styleTotal`.
  - A bar chart needs about 22 per row plus 46 (title, padding) without its value axis; rows past its height go
    behind a scrollbar, which can't be used in a tooltip.
  - Inside a project the theme's own `name` must be the file name `report.json` references (with `.json`), and the
    report folder needs a `.platform` file: Microsoft's validator (`powerbi-report-author validate`) checks both.
  - Inside a theme the card visual's `border` is the card's own border, which has no `radius` (the validator rejects
    it); Desktop draws the card's corners the same without it. `npm test` runs Microsoft's validator on two exports
    (their report authoring CLI, pinned in `mcp/package.json`, the one place its version is set).
- `visual.json` outranks the theme: a container `background`, `border` or `dropShadow` written there with
  `show: false` hides what a solid theme would draw. The report writer leaves those three out for the visuals that
  sit on a panel when the theme has solid visuals, and switches them off when the theme is transparent (the page's
  background image draws the panels then). A group can have its background switched off
  (`visualGroup.objects.background`), but has no border or shadow.

- Round 1, measured in Desktop 2.158 (`scripts/tests/DESKTOP-TESTS.md`):
  - `mobile.json` follows the same selector rules as `visual.json`: a size or padding written there is used only with
    the selector that property needs on the page (none for a text box, a slicer, titles, axes, table text and the
    card's container padding; `default` for a button's text; each state for page buttons).
  - A page button wraps a long name only when two lines fit its height (3.5 x pt in Segoe UI, 3.2 x pt in Tahoma);
    otherwise it cuts it with "...". A text box is top-aligned (its text's middle is about 1.2 x pt below its top).
  - The Reset icon follows the button's height (it ends at 0.88 x the height), not the text size.
  - An empty text box left to the theme is a panel (the theme's card colour, corners and shadow); a group has
    neither border nor shadow, and a shape with its own rounded fill is not drawn rounded.
  - Measure a chart with the measure it will show: the value axis's label width changes the plot, and a column
    chart that fits 12 month names with "1K" labels loses one behind a scrollbar with "0.4M".

- Round 2, measured in Desktop 2.158 (`scripts/tests/DESKTOP-TESTS.md`):
  - A chart sorts by a field only when that field is in the visual: Min of the model's month or weekday number in the
    `Tooltips` role plus a `sortDefinition` by it puts month and day names in order without touching the model. A
    table and a slicer can't: they need the model's sort-by column.
  - A projection's `displayName` is shown everywhere Power BI shows the field (axis, legend, table header, slicer
    header); the model is not renamed.
  - The page navigator has no order setting (first page always left). A right-to-left report gets single
    `actionButton`s with `visualLink` `type: 'PageNavigation'`, `navigationSection: <page id>`; a one-line button
    needs about 0.45 em per character.
  - A slicer's "All" is Power BI's own word and follows the viewer's language: no report property changes it.
  - A sample table as a Power Query partition opens empty; as a DAX table it opens with data and a refresh banner.
  - On a DAX calendar every column is untyped in TMDL, so a number column named like a name ("Day of Week") is listed
    by the sort check too: the fix builder drops a column that another listed name is sorted by.

- Round 3 (safety), measured in Desktop 2.158 and on Windows:
  - A measure or column rewritten by a TMDL script keeps its `lineageTag` only when the script carries it; without
    it Desktop writes a new tag. The fix scripts carry it (the TMDL reader keeps tags with `{ lineageTags: true }`).
  - TMDL view's editor can't be filled through UI Automation's ValuePattern (the text arrives mangled: "Problems 2");
    it needs a real paste, so `tmdl-apply.ps1` uses the keyboard and the clipboard: only when the laptop is free
    (`idle.ps1` tells the seconds since the last input).
  - A Windows junction shows as a symbolic link to Node (`Dirent.isSymbolicLink()`, `lstat`), and
    `fs.realpathSync.native` resolves it; compare real paths of both the path and the working folder (a temp folder's
    short name, `ABDELR~1`, is expanded by `.native` on both).
  - The `gulf-calendar` suite fails on a Windows checkout (3 checks): Git writes the `.dax` files with CRLF and the
    suite compares bytes. It passes on CI (Linux).

- The Gulf calendar check (`assets/js/gulf-health.js`, beta cut): its own section in `check_model_health`, never
  scored, read from the files only. It can read the dates and the weekend only of a calendar our generator made (from
  the comment, the `CALENDAR` range, the `DATATABLE` month starts and the `Is Weekend` forms the generator writes);
  everything else is `cantTell`. When the generator's DAX changes shape (`calendar-generator.js`), this reader must
  follow: the `gulf-calendar` suite generates a calendar per country and checks the two agree on every day, and that
  the weekend option labels the fixes name are the page's own. Packaging must carry `gulf-health.js` and
  `gulf-dates.js` with the engines.

- Large models (round 4): a model is large when `read_model`'s full answer would pass 40,000 characters
  (`mcp/lib/scope.mjs`). Then `read_model` returns a summary, and `suggest_fields` and `create_report` need `focus` or
  `tables`. Every answer that lists objects must have a cap: round 2's fix script made `check_model_health` 162,909
  characters on the 300-table model without anyone noticing, because only `read_model` was measured. The golden
  baseline prints the largest answer of the run: read it.
- Fewer measures than KPI cards (round 4; 0.2.9 design block A2-4): `layout.kpis` is the number of cards, 0-6 (0 leaves
  the KPI row out), and the report's measures cap every page through `projectPages`' `maxKpis` (the old `kpiCards` is
  gone; an older design's is read as its kpis). A visual is never written without its fields: Microsoft's validator
  calls it `PBIR_QUERY_STATE_MISSING`.

- Night of 6-7 October, measured in Desktop 2.158 (`scripts/tests/DESKTOP-TESTS.md`, "2026-10-06 night"):
  - A test model's Power Query rows must be a typed table (`#table(type table [#"A" = datetime, #"B" = number], rows)`):
    untyped, every column loads as text on Refresh and every SUM fails. DAX needs quotes around a table name that
    is not plain Latin letters.
  - A visual whose border is switched off in `visual.json` draws about 5 nearer its box's edges than one that leaves
    the border to a solid theme: to let something below show through, switch off only the background.
  - A visual written without `tabOrder` is not a Tab stop (Desktop's Tab from the chart before it goes where the page
    without that visual goes); with one, a card under a chart was an unnamed stop.
  - A bar chart at the theme's 10pt needs 22.2 a row, 45 above the first row and 8 under the last, and 38 more for
    its value axis (1280 x 720; scaled with the page).
  - The new card's `value.showBlankAs` (default selector) replaces "--" with a text of ours; `subTitle`, `divider`,
    constant lines, `lineStyles`, data bars and the donut's `slices` all draw as Microsoft's capabilities data names
    them (`mcp/research/POWERBI-HIDDEN-CAPABILITIES.md`: research, nothing of it is used yet).
  - `layout.wideTable` is on by default in the design engine, for the website and the MCP alike (false keeps equal
    shares); the table's share of a narrow row is by its fields (`tableFields`, `E.TABLE_NEED`; 0.2.9 A2-5). The
    website's `design-engine` suite compares its layouts with recorded fixtures.
  - Run the full `npm test` with Desktop and the browser suites idle: beside them a request passed its 60 s limit.
