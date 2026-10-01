# Current work (the memory between sessions)

Read this first; update it as you go (rules in `mcp/CLAUDE.md`, "Keeping the memory"). Last updated 2026-10-01
by the builder: the plans for rounds 0, 1 and 2 (branch `plan/next-rounds`, plan only, no code changed), under
"Next step", with the owner's seven answers applied and round 0 now five changes; they wait for the owner's go and
for the split of `pbip-export.js` to merge.

## Where things stand
- **MCP: 6 tools** (`read_model`, `suggest_fields`, `check_model_health`, `generate_theme`, `plan_layout`,
  `create_report`), 77 checks in `npm test`; all 16 website suites pass.
- **Phase 2 (design engine in the MCP): built, merged and checked in Desktop.** `generate_theme` and `plan_layout`
  reproduce the website byte for byte on all 54 design fixtures; `create_report` builds the website's project
  download from a design (60 project fixtures). Details: `mcp/PHASE2-SPEC.md`.
- **Report fixes merged** (buttons' "show" outside the state, tooltip page sizes, logo placeholder, field choice
  for untyped columns, `modelNotes`), and verified in Power BI Desktop 2.157 on "Gulf Sales AR 2": all 8 checks PASS
  (`scripts/tests/DESKTOP-TESTS.md`).

- **Table fix merged** (owner found it on "Gulf Sales AR 2": the Arabic title "جدول التفاصيل" on
  the far right, the table on the far left): tables now set `columnHeaders.columnAdjustment: growToFit` and
  `autoSizeColumnWidth: true` (Microsoft's table reference: always grow to fit; without it columns shrink to their
  content); in right-to-left reports the table's columns are reversed so the category column sits on the right;
  `modelNotes` also tells day names without a sort-by column (days showed Friday, Monday, ...). 3 new MCP checks
  (75), failing before; all 16 website suites pass. `pbip-export.min.js?v=20260930f`, `theme-generator.min.js?v=20260930h`.
  **Checked in Power BI Desktop 2.157 on "Gulf Sales AR 3": all 6 checks PASS** (both tables fill their width, Day
  Name rightmost, the three `modelNotes`, everything else identical to AR 2, KPI values equal DAX;
  `scripts/tests/DESKTOP-TESTS.md`).
- **Cards moved to `cardVisual`** (merged, `e22b346`; the plan and sizes table are in branch commit `6a7ecd3`'s
  WORK.md): KPI cards and the tooltip card use `cardVisual` with role `Data`, value and title sizes fitted to each card
  by `cardFit` in `pbip-export.js`, the number centred, label and inner outline off; phone sizes in `mobile.json`
  (title 10, value 20). The theme is unchanged (it already styles `cardVisual`) and no fixture changed. Microsoft's
  default number format is kept (101.914K; owner's decision, forcing decimals would show counts as 47.00). MCP 77
  checks, all 16 website suites pass. **Desktop 2.157: six reports PASS on items 1-6**; item 7 (phone) FAIL from the
  old phone-position bug (open item); item 8 skipped by the owner (a hand-added card following the theme is Power
  BI's own behaviour). `pbip-export.min.js?v=20260930g`, `theme-generator.min.js?v=20260930i`.
- **Website dropdowns fixed** (merged): the open list was white on white on every tool page; form fields now use
  `color-scheme: dark` with dark option colours (`assets/css/style.css`), checked on every tool page in `tools.mjs`.

## Next step (reviewer, 2026-10-01): `fix/phone-and-sizes` merged into main as `f8d911f`
Full run on Linux before the merge: 15 of 16 suites pass, `anchors` failed once under load (known flake, open item)
and passes alone; MCP 87 pass; tree identical to the branch. The branch's plan, measurements and Desktop results are
in its history (`b931ecd`) and `scripts/tests/DESKTOP-TESTS.md`.

**Order from here (owner's go; details in `mcp/ROADMAP.md`):**
1. **Reviewer:** split `assets/js/pbip-export.js` into small modules (output byte for byte identical), then CI (every
   suite on every push). **Nobody else touches `pbip-export.js` until that merges.**
2. **Builder, at the same time, plan only** (branch `plan/next-rounds`), three rounds in this order. **(0) First,
   found by the owner (most valuable):** (i) the tooltip page is not attached to the main page's visuals: link each
   chart to it explicitly (the visual's "Tooltip: Report page" setting; confirm the PBIR property in Microsoft's
   references, then check in Desktop that hovering shows it); (ii) an attached logo is stretched to its box: read the
   logo's aspect ratio from the image file, keep the designed height, set the logo box's width from it (within the
   logo width range) in the shared design engine (website and MCP), let the header's other parts use what's left, and
   use an image scaling that never distorts. Then (a) phone text sizes per visual in
   `mobile.json` (slicer boxes cut on the phone at 1080, page-sized text too big at 2160; measure first) plus a
   Desktop check of the slide-in panel (Close and Filters, EN and AR); (b) Arabic accuracy (Arabic display names in
   `create_report`; day and month sort order and measures without a format string as health findings with TMDL
   fix scripts, weeks starting Saturday or Sunday).
3. Builder builds (a) and (b) after the split merges; then the design summary, packaging, private-repo move, beta,
   launch. **Dated:** the Gulf Calendar pack ready by 2026-12-01.

**Testing speed (owner 2026-10-01):** the builder runs only the failing tests and the suites a change touches; the
reviewer runs the full run on Linux before every merge (and CI on every push once added). No 15-minute full runs on
the laptop unless the reviewer asks.

### Plans for rounds 0, 1 and 2 (builder, 2026-10-01, branch `plan/next-rounds`; plan only, waiting for "go")
Nothing below is built. Each round starts after the split merges and the owner says go, on its own branch from main.
Modules are named as in `mcp/ROADMAP.md` (sizes, visual builders, page assembly, phone layout); today all of them are
still `assets/js/pbip-export.js`. Every round: failing tests first; only the suites the change touches (`pbip`,
`design-engine`, `theme-generator`, `model-health`, `npm test` in `mcp/`); reports built with the branch's
`mcp/server.mjs` over stdio; Desktop 2.158.1177 on 1920 x 1080 and 1280 x 720, English and Arabic, plus what the round
touches, judged from full-size crops; results into `scripts/tests/DESKTOP-TESTS.md`; only our own sample model
(`C:\DataArcus\tests\5-tmdl-sample`). Stop and report at the first failure.

#### Round 0: the owner's five findings (branch `fix/tooltip-logo-table`)
The order: 0.1 tooltip link, 0.2 logo, 0.3 tooltip labels, 0.4 tooltip transparency, 0.5 table header alignment.
Every Desktop check below runs on 1920 x 1080 and 1280 x 720, in English and Arabic, and includes the tooltip page.
**Microsoft's report CLI is installed on the laptop as a reference** (owner's yes; `powerbi-report-author` 0.4.0,
`npm install -g @microsoft/powerbi-report-authoring-cli`): `formatting describe-object <visual> <object>` lists every
property and allowed value. It replaces guessing; Desktop stays the final check. What it says is quoted per item.

**0.1 The tooltip page linked to every chart.**
- **What the code does today:** one chart only (the first line, column or bar chart of page 1) gets
  `visualContainerObjects.visualTooltip = { show: true, type: 'ReportPage', section: <tooltip page name> }`; the
  tooltip page has `type: 'Tooltip'`, `pageBinding: { name, type: 'Tooltip' }`, hidden in view mode. Earlier Desktop
  checks only looked at the tooltip page itself, never at a hover.
- **Cause, confirmed in Microsoft's references:** the CLI (`describe-object lineChart visualTooltip`) gives `type` as
  an enum with exactly two values, **`Default` and `Canvas`** ("Allows report pages to be used as tooltips for this
  visual"), and `section` as the page. `'ReportPage'` is not a value, so Desktop falls back to the default tooltip.
  The object and its place are right (`visualTooltip` is one of the 15 `visualContainerObjects`; a tooltip page is
  `pageBinding.type: "Tooltip"`, authoring skill `formatting.md` and `authoring-workflows.md`).
- **Measurement M0.1 (Desktop, before any code), English and Arabic:** on a copy of a generated report set Format >
  General > Tooltips > Options > Type "Report page", Page "Tooltip" / "تلميح" on one chart, save, and read that
  `visual.json`: expected `type` `'Canvas'`, `section` the tooltip page's name. Note which of our visual kinds have the
  Tooltips card at all (gauge, card and table expected not to).
- **Change (page assembly: the tooltip link; visual builders: charts):** every chart on every main page (kinds line,
  bar, column, donut, funnel, treemap, map; plus any other kind M0.1 shows the card on) gets
  `{ show: true, type: 'Canvas', section: <tooltip page name> }`. Cards, tables, slicers, text and buttons get none.
  The website's README step "Hover the main chart on the first page" becomes "Hover any chart" (both languages,
  `assets/js/theme-generator.js`, `.min.js`, `?v=`).
- **Tests first (failing):** `scripts/tests/report-check.mjs` gets `tooltipProblems(files)`: every chart has
  `visualTooltip` with `show` true, `type` `'Canvas'`, `section` = the name of a page that exists with
  `type: 'Tooltip'`; nothing else has it. Used by `pbip.mjs` (54 designs x 2 languages, both downloads) and
  `mcp/test.mjs`. Expected before the fix: the default two-page report has 4 charts (page 1 line, bar, column; page 2
  column) and 1 linked with the wrong type, so 4 of 4 fail; the ops layout has 5 charts. After: 0 problems.
- **Fixtures:** none change (`cases.json` and `project-pages.json` hold themes and slots, not `visual.json`).
- **Desktop check:** new script `builder-scripts\hover-check.ps1` (only on a "Gulf Sales ..." window): moves the mouse
  onto a data point of each chart (positions from the report's own files), waits 2 s, captures the screen, moves away.
  Four reports: EN 1080, AR 1080, EN 720, AR 720. **Expected:** on each of the 4 charts the hover shows our 320 x 240
  page (the card and the small chart, filtered to the hovered point), not Power BI's default list; the cards and the
  tables show their usual hover. If the script can't hover reliably, one batched request to the owner: hover the 4
  charts on each of the 4 reports.

**0.2 The logo box sized from the logo, and a `logo` input in `create_report`.**
- **What the code does today:** the logo slot is `logoW` wide (default 150 on the 720 grid, range 100-360) and
  `hh - 24` high whatever the image; the image visual is written with `imageScaling.imageScalingType: 'Fit'`. The MCP
  never attaches a logo (`create_report` always passes `logo: null`); only the website does.
- **Microsoft's references:** the CLI lists two scaling properties on the image visual: the old
  `imageScaling.imageScalingType` (`Normal`, `Fit`, `Fill`) and the current `image.fit` ("Image fit": `Fit`,
  `Stretch`, `Fill`, `Normal`). Learn's image visual article: Fit and Fill keep the aspect ratio, Stretch distorts.
  We write only the old one.
- **Measurement M0.2 (Desktop, before any code), English and Arabic, 1080 and 720:** an image visual in a box of
  another shape than the image; what our current file renders as; then `image.fit` set to each of its four values by
  hand, saved and read back. Crops of a wide, a square and a tall logo in each.
- **Owner's decisions (2026-10-01):** the box takes the logo's shape: the designed height stays and the width comes
  from the image's ratio; **no 100 minimum for an attached logo** (the 360 maximum stays); the title and the page
  buttons use the space that's left; `create_report` gets a `logo` input.
- **Change, shared engine (`assets/js/design-engine.js`, so the website and the MCP both get it):**
  `imageSize(bytes)` reads width and height from the file (PNG: the IHDR chunk; JPG: the SOF marker), null when it
  can't; `computeSlots`, `projectSlots` and `projectPages` take an optional `logoRatio` (width / height): the logo's
  height is `hh - 24` and its width `min(360, round(height x ratio))`, its far edge where it is today. The title keeps
  its own rule (it ends 24 before the logo, 560 at most) and the page buttons already fill from the title to the logo.
  Without `logoRatio` (no logo, or a file whose size can't be read) every result is identical to today.
- **Change, report (visual builders: image):** `image.fit: 'Fit'`, or what M0.2 shows never distorts.
- **Change, callers:** `assets/js/theme-generator.js` passes the attached logo's ratio to `projectPages`;
  `mcp/server.mjs` `create_report` gets an optional `logo`: a PNG or JPG file inside the working folder, 2 MB at
  most, as on the website; it is copied into the new report, never changed; a file that isn't one of the two types,
  is too big or is outside the folder is refused with the reason. Hand-placed pages keep their own logo box and only
  get the scaling.
- **Tests first (failing):** `scripts/tests/design-engine.mjs`: `imageSize` on four small logos made by us
  (`scripts/tests/fixtures/logos/`: `wide.png` 400 x 100, `square.png` 200 x 200, `tall.png` 100 x 250, `wide.jpg`
  600 x 50) and the header boxes below; `pbip.mjs` and `mcp/test.mjs` (the new `logo` input, and its refusals): the
  image visual's box and scaling, the page buttons ending 24k before the logo, no overlap in the header,
  `layoutProblems` clean, in English and Arabic.
- **Expected boxes (default header 56, page units; today's logo box is 225 x 48 at x 1659 on 1080, 150 x 32 at x 1106
  on 720; in Arabic the logo starts at x 36 / 24 with the same sizes):**

  | Logo | Ratio | 1920 x 1080 (x, w x h) | 1280 x 720 (x, w x h) | Drawn |
  |---|---|---|---|---|
  | wide 400 x 100 | 4 | 1692, 192 x 48 | 1128, 128 x 32 | fills its box |
  | square 200 x 200 | 1 | 1836, 48 x 48 | 1224, 32 x 32 | fills its box |
  | tall 100 x 250 | 0.4 | 1865, 19 x 48 | 1243, 13 x 32 | fills its box |
  | very wide 600 x 50 | 12 | 1344, 540 x 48 (kept at the 360 maximum) | 896, 360 x 32 | 540 x 45 / 360 x 30, whole, not stretched |

  The title stays 840 x 48 (560 x 32) in all four; the logo's far edge stays at 1884 (1256); the page buttons end 24
  (16) before the logo.
- **Fixtures:** none change, because no fixture has a logo and the new input is optional: the 54 design fixtures, the
  60 project fixtures, both downloads and the MCP reports without a logo stay byte for byte the same. If one differs,
  stop and report. Reports with a logo change (box, page buttons' position, scaling): that is the fix.
- **Desktop check:** the three logo cases (wide, square, tall) on all four reports (EN and AR, 1080 and 720), built
  through the MCP's new `logo` input, plus one website download with the wide logo (EN 1080): each logo undistorted
  (its ratio measured in the crop within 2%), whole, at the header's far edge, title and page buttons whole and not
  touching it. One report without a logo: the placeholder as before.

**0.3 Tooltip chart labels cut ("El…", "F…" on the 320 x 240 tooltip page).**
- **Cause:** on the tooltip page only the card and the titles have their own sizes (value 20, title 10); the small
  chart (a column chart, 296 x 140) keeps the theme's axis text, which is sized for the report's page (15pt on
  1920 x 1080), and a column chart's category labels have about 70 per column to fit in.
- **Microsoft's references (CLI):** `categoryAxis` and `valueAxis` have `fontSize`, `showAxisTitle`,
  `maxMarginFactor` ("the maximum percent of the visual allowed for the axis") and `preferredCategoryWidth`. **There is
  no property that sets the angle of a column chart's category labels** (the only orientation is for data labels), so
  horizontal names can't be forced on a column chart: Power BI slants or cuts them when they don't fit. A bar chart
  writes its categories on the vertical axis, always horizontal.
- **Measurement M0.3 (Desktop, before any code), English and Arabic, on the 320 x 240 page:** with category names
  "Abu Dhabi", "Electronics", "Wednesday", "أبوظبي", "إلكترونيات", "الأربعاء" and a 20-character name: (a) the column
  chart at 8, 9 and 10pt; (b) a bar chart at 8, 9 and 10pt with `maxMarginFactor` 25, 40 and 50. For each: which names
  are whole, the width a name needs per character, the height one category row needs, and how many categories fit in
  140 high before Power BI adds a scrollbar.
- **Change (page assembly: the tooltip page; sizes: the measured tooltip rule):** the tooltip chart becomes a
  clustered bar chart with its own sizes, as the card has: category and value axis text 8pt (or the size M0.3 shows),
  axis titles off, `maxMarginFactor` as measured (start 40). **The switch from a column to a bar chart needs the
  owner's yes** (decision 1); without it the plan is the column chart at 8pt, where long names may still be cut.
- **Tests first (failing):** `report-check.mjs` gets `tooltipPageProblems(files)`: the tooltip chart has its own axis
  sizes (both axes, within 8-60) and axis titles off, and by the measured rule its longest category label fits the
  axis room; `pbip.mjs` (sample data, both languages) and `mcp/test.mjs` (the sample model). Expected before the fix:
  every report with a bound tooltip page fails (no axis size on the chart); after: 0.
- **Expected in Desktop (the hover from 0.1 and the tooltip page itself):** every category name whole and horizontal,
  in English and Arabic, "Abu Dhabi" and the Arabic names included; value axis numbers whole; no "…"; up to 7
  categories without a scrollbar (to be confirmed by M0.3); the card unchanged (101.91K whole, title whole).
- **Fixtures:** none change.

**0.4 Tooltip transparency.**
- **What the code does today:** the tooltip page's background is the card colour with `transparency: 0`; the visuals
  on it have no background of their own, so the page background is the only fill.
- **Microsoft's references:** a page's `background` has `color` and `transparency` (and no `show`): CLI and
  `formatting.md`. Text has no transparency of its own, so it stays solid.
- **Measurement M0.4 (Desktop, before any code), English and Arabic:** the tooltip page's background at 0, 10, 15 and
  20, hovered over the busiest places of the main page (the table, the line chart, a KPI card), with a light and a
  dark preset: full-size crops; is every text on the tooltip readable; does Desktop honour the value in the hover (and
  not only on the page itself).
- **Change (page assembly: the tooltip page):** `background.transparency` 15 (the owner's range is 10-20; the measured
  number is used if 15 doesn't read well over the table: 10 then). Card value, titles and axis text keep their solid
  colours; nothing on the tooltip page gets a background.
- **Tests first (failing):** `tooltipPageProblems`: the tooltip page's background transparency is the chosen number,
  its colour the card colour, and no text on the page has a transparency. Before: 0 where 15 is expected, every
  report fails; after: 0 problems.
- **Expected in Desktop:** the page behind shows faintly through the tooltip; every text on it is fully solid and
  readable over the table, the line chart and a card, in English and Arabic, light and dark. If no value in 10-20
  reads well, stop and report with the crops.
- **Fixtures:** none change.

**0.5 Table header alignment (closes the long-standing open item).**
- **Seen:** headers are left aligned while numbers are right aligned, so on a wide table a number sits nearer the next
  column's header than its own.
- **Microsoft's references (CLI, `describe-object tableEx ...`):** per column it is **`columnFormatting`**, one entry
  per column with the selector `{ metadata: '<the column's queryRef>' }`: `alignment` (`Auto`, `Left`, `Center`,
  `Right`) with `styleHeader` ("Apply to header"), `styleValues` and `styleTotal`. `columnHeaders.alignment` (same
  four values) sets all headers at once and can't follow each column. The authoring skill says the same:
  `columnFormatting` is for static styling such as alignment, with a metadata-only selector.
- **Measurement M0.5 (Desktop, before any code), English and Arabic:** set one text column and one number column by
  hand (Format > Specific column > Alignment, Apply to header on), save and read the entries (selector and values);
  check that header and values then line up, and that nothing flips by itself in a right-to-left report.
- **Change (visual builders: table; `assets/js/pbip-bind.js` so a bound field says whether it is a number):** every
  table column gets a `columnFormatting` entry with `styleHeader` and `styleValues` on: text columns `Left` and number
  columns (measures, and columns of a number type) `Right`; in a right-to-left report mirrored, text `Right` and
  numbers `Left`. A column whose type the files don't give (DAX tables) follows how it was picked: as a category, so
  text. The sample data's table the same way.
- **Tests first (failing):** `report-check.mjs` gets `tableProblems(files)`: each column of every table has exactly
  one entry, its selector the column's queryRef, the alignment its type and the report's direction ask for, header and
  values both on. `pbip.mjs` (54 designs x 2 languages, both downloads) and `mcp/test.mjs`. Expected before the fix:
  the default report has 2 tables of 4 columns, 8 of 8 columns fail; after: 0.
- **Expected in Desktop:** in every table each header sits over its own values. English: the category column left
  (header and values), the three number columns right. Arabic: the category column (rightmost) right, the number
  columns left. Columns still fill the table's width (`growToFit` unchanged).
- **Fixtures:** none change.

**Round 0 as a whole.** One branch, five pairs of commits (tests, then code), in the order above; the measurements M0.1
to M0.5 are done first in one Desktop sitting and written into `scripts/tests/DESKTOP-TESTS.md` before any code. One
Desktop check at the end covers all five: EN 1080, AR 1080, EN 720, AR 720 with the wide logo; the square and the
tall logo on the same four; a hover on every chart of each (the tooltip page with its link, labels and transparency);
the tooltip page itself; every table. `mcp/CLAUDE.md` gets the facts learned (tooltip type `Canvas`, `image.fit`,
`columnFormatting`, the CLI as a reference).

#### Round 1: phone text, and the slide-in panel in Desktop (branch `fix/phone-text`)
**1.1 Phone text sizes (module: phone layout, with the sizes module's rules).**
- **Cause (seen in Desktop 2.158, `DESKTOP-TESTS.md`):** phone slots are fixed (title 56, page buttons 44, slicer 64,
  button 40, charts 190-270 on the 323-wide canvas) but only cards have phone sizes in `mobile.json`; the rest keeps
  the page's text (15pt on 1080: slicer boxes cut, 76 needed in 64; 30-40pt on 2160: nothing fits).
- **Measurement M1 (before any code), English and Arabic, on a 1080 and a 2160 report:** for each visual type,
  whether a size written in `mobile.json` is used in the mobile layout, and the height the text then needs on the
  phone canvas: slicer (header and items), Reset and other buttons, page buttons (default, hover, selected), chart and
  table titles, and the header title (can a text box's `general.paragraphs` be overridden in `mobile.json`?). Read
  the properties from a report where the owner (or UI Automation) changed one size in the mobile layout and saved.
- **Change:** each visual's `mobile.json` gets sizes that fit its phone slot, the same on every page size, as cards
  have: slicer header and items 10pt (rule 16 + 4 x pt = 56 <= 64); buttons 10pt (6 + 1.6 x pt = 22 <= 40), the Reset
  icon by `resetFit` on the phone width; page buttons 10pt in all three states; chart and table titles 12pt; the
  header title 14pt if a text box can be overridden, otherwise its slot grows to what the page's size needs. The
  numbers are the plan's starting point: where M1 shows another need, the measured one is used and written down.
- **Tests first (failing):** `report-check.mjs` reads each visual's phone size (the `mobile.json` override, else the
  page's) and checks it against its phone box with the measured rules; `pbip.mjs` on the 54 designs plus the 16
  layouts at 640 x 360 and 3840 x 2160, `mcp/test.mjs` on the five "Sizes" reports. Expected before the fix: every
  design with a slicer fails at 1080 and up (76 > 64), every 2160 design fails on title, page buttons, slicers and
  Reset; after: 0. Cards and phone positions unchanged; no fixture changes.
- **Desktop check:** `phone-check.ps1` (extended to scroll the phone canvas, so the whole page is captured, not only
  its top) on EN and AR at 1080, 720 and 2160. **Expected:** every title, slicer box, button and page button whole
  on every phone page, no "...", no overlap; cards as before (title 10, value 20).

**1.2 Slide-in panel checked in Desktop (never done; no code planned unless it fails).**
- Reports: the design with `slidePanel: true`, EN and AR at 1080 and 720, built over stdio, and one website download
  (EN 1080) to cover that path. New script `builder-scripts\panel-check.ps1`: Ctrl+click on Filters, capture, pick a
  slicer value, Ctrl+click Close, capture (only on a "Gulf Sales ..." window; otherwise one batched request to the
  owner: 3 clicks per report).
- **Expected sizes (page units; label text 15pt on 1080, 10pt on 720):**

  | | 1920 x 1080 | 1280 x 720 |
  |---|---|---|
  | Filters button ("☰  Filters" / "☰  الفلاتر") | 144 x 48 | 96 x 32 |
  | Panel | 360 x 951 at x 1536 (Arabic: x 24), y 105 | 240 x 634 at x 1024 (Arabic: x 16), y 70 |
  | Close ("✕  Close" / "✕  إغلاق") | 104 x 32 | 69 x 22 |
  | Slicers | 3, each 76 high | 3, each 56 high |
  | Reset | 40 high, with its icon | 27 high |

- **Expected in Desktop:** Filters whole in the header, on the logo's side; the panel opens over the page under it
  with its card, "Filters" / "الفلاتر", Close whole, three slicers whole, Reset whole; a chosen slicer value stays
  after Close; the panel is hidden again; Arabic mirrored (panel on the left, Close at its left). A failure is
  reported with its measurement and a proposed fix, not fixed in the same step.

#### Round 2: Arabic accuracy (branch `feature/arabic-accuracy`)
**2.1 Arabic display names in `create_report`.**
- **Change:** `create_report` takes optional `displayNames`: `{ "Table[Field]": "name to show" }`. The report shows
  that name wherever it shows the field: KPI card titles, chart titles ("X حسب Y" built from the given names), slicer
  headers, table column headers, axis and legend, the tooltip page. The model is never renamed. In an Arabic report
  the result lists, under `arabicNames.missing`, every field the report uses that has no display name and whose model
  name has no Arabic letters, with one line on how to pass them; names given for fields the report doesn't use are
  listed as not used. **No translation is ever made up**: a field without a name keeps its model name.
- **Modules:** visual builders (a bound field carries an optional name: titles through `label`, the query projection's
  display name), page assembly (tooltip page titles); `mcp/server.mjs` (input, the missing list). The website's field
  picker is not changed in this round.
- **Measurement M2.1 (before any code):** in Desktop rename a field "for this visual" on a chart, a table, a slicer
  and a card, in an English and an Arabic report, save, and read what is written (expected: `displayName` on the
  projection; the slicer's header may need `header.text`, as Microsoft's `slicers.md` says).
- **Tests first (failing), `mcp/test.mjs`:** an Arabic report on the sample model with names for some fields: every
  title, header and projection of a named field shows the given name; `arabicNames.missing` is exactly the used
  fields without one; an English report has no such list; without `displayNames` a report is the same as today apart
  from random ids. `pbip.mjs`: the engine with and without names. No fixture changes.
- **Desktop check:** Gulf Sales in Arabic at 1080 and 720 with names for every used field: no English field name on
  any page, phone page or the tooltip; the same report with two names left out: those two show in English and are
  the two listed. English 1080 and 720: unchanged.

**2.2 Sort order and format strings as health findings with ready TMDL scripts.**
- **What exists today:** the engine already finds `MONTH_SORT` (month and day names without a sort column, English
  names only), `NO_FORMAT` (info) and `PCT_FORMAT` (a format that isn't a percentage); the website builds a TMDL
  script for the sort (`model-health.js` picks the sort column, `model-health-tmdl.js` writes it); the MCP's
  `check_model_health` returns findings without scripts; `create_report` has its own three `modelNotes` rules.
- **Change (`model-health-engine.js`, `model-health-tmdl.js`, `model-health.js`, `mcp/server.mjs`):**
  - the choice of the sort column and the fix edits move from the website's page code into the shared engine, so the
    website and the MCP give the same script; `check_model_health` returns `fixScript` (TMDL) and `byHand` per
    finding; `modelNotes` in `create_report` uses the same rules and points to the health check;
  - day names: sorted by the model's weekday number column when there is one; when there is none, the script adds
    one. The week start is a choice by country (owner 2026-10-01): `check_model_health` takes
    `weekStart: 'sunday' | 'monday' | 'saturday'`, **Sunday by default** (Saudi Arabia and most of the Gulf:
    `WEEKDAY(date, 1)`), Monday for UAE companies on the Saturday-Sunday weekend (`WEEKDAY(date, 2)`), Saturday as an
    option (`MOD(WEEKDAY(date, 1), 7) + 1`); the finding says which start the script uses and how to ask for another;
  - month names: by the month number column, or the script adds `MONTH(date)`; "Month Year" by a year-month number;
  - Arabic column names (اسم الشهر, اسم اليوم, الشهر, اليوم) are recognised too;
  - measures without a format string: a **suggested** script that sets one on each measure the builder can rewrite
    safely, with the reason shown beside each measure, never applied automatically (owner 2026-10-01): a name that
    reads as a percentage (%, pct, rate, ratio, share, margin, نسبة, هامش) gets `0.0%`; a count (COUNT, COUNTROWS,
    DISTINCTCOUNT) or a sum of a whole-number column gets `#,0`; every other measure `#,0.00`; measures the builder
    must not rewrite are listed "by hand".
- **Known limit to measure first (M2.2):** the columns of a DAX table (the calendar generator's calendars, our Gulf
  Sales sample) can't be rewritten under `ref table` (TMDL rejects it, confirmed in Desktop earlier), so today they
  go to "by hand". Measure in TMDL view on the sample model whether a `createOrReplace` of the whole DAX table (its
  expression with the new number column, and `sortByColumn`) is accepted and keeps the relationships and the report
  working; if not, these stay as exact by-hand steps and the plan says so. Also measured: the script from an imported
  calendar; scripts carry the files' lineage tags.
- **Scores must not move by accident:** the new details ride on the existing findings (`MONTH_SORT`, `NO_FORMAT`), so
  the scores and finding counts the tests expect stay as they are. Before coding, every expected number that a change
  would move (for example Arabic names newly found) is listed with its reason for the reviewer; no expected number is
  edited without that.
- **Tests first (failing):** `scripts/tests/model-health.mjs` (the website) and `mcp/test.mjs`: on the `tmdl-ramadan`
  and `health-project` fixtures and a small model of our own with a day name, a month name and a ratio measure: the
  finding carries a script; the script names the right sort column; the Sunday (default), Monday and Saturday
  versions differ only in the weekday expression; each suggested format has its reason; a DAX table goes where M2.2 says; a measure with a format string is never in the script; the
  website's script equals the MCP's.
- **Desktop check (owner applies each script in TMDL view: one batched request), on a copy of the sample model, with
  an English and an Arabic report at 1080 and 720. Expected:** days in the column chart, table and slicer run
  Sunday to Saturday (the default script), Monday to Sunday or Saturday to Friday (the other two), months January to
  December; the % card
  shows 34.0% instead of 0.34; the table shows 101,914 where the card shows 101.91K; running the health check again
  finds neither issue; nothing else in the model changed (TMDL diff: only the named columns and measures).

#### The owner's answers (2026-10-01), applied above
1. `b931ecd` is tagged `round-phone-and-sizes` (pushed); `fix/phone-and-sizes` is deleted, locally and on GitHub.
2. `create_report` gets a `logo` input (a file inside the working folder): round 0.2.
3. The logo box takes the logo's shape; no 100 minimum for an attached logo: round 0.2.
4. Microsoft's report CLI is installed as a reference (0.4.0); Desktop stays the final check.
5. Week start by country: Sunday by default, Monday for UAE companies on the Saturday-Sunday weekend, Saturday as an
   option: round 2.2.
6. Formats: `#,0` for counts and whole-number sums, `#,0.00` otherwise, as suggested scripts with the reason shown,
   never applied automatically: round 2.2.
7. Display names as `{ "Table[Field]": "name" }`: round 2.1.

#### Decisions needed from the owner before round 0 starts
1. **Tooltip chart:** a bar chart instead of the column chart, so category names are always horizontal (Power BI has
   no setting for a column chart's label angle)? Proposed: yes.
2. **Tooltip transparency:** 15 as the starting number inside 10-20, replaced by what the measurement shows reads
   best? Proposed: yes.

## Open items (flagged, need the owner's go before any work)
- **Next round, after `fix/phone-and-sizes` (owner 2026-10-01; plan only, then "go"):**
  - **Arabic reports show English titles** ("Total Sales حسب Quarter", English KPI names, table headers, slicer titles):
    measure and column names come from the model. Plan: `create_report` takes optional display names per field; in
    an Arabic report, every field without an Arabic name is listed in the notes. No made-up translations.
  - **Days and months sort alphabetically** (Friday, Monday, ...; April, August, ...): `Calendar[Day Name]` and
    `Calendar[Month Name]` have no sort-by column (in `modelNotes` since "Gulf Sales AR 3"). Plan: a model health
    finding with a ready TMDL script that sets the sort column for day and month names, covering a week that starts on
    Saturday or Sunday. The model is still never changed without the user.
  - **Measures without a format string**, as model health findings: the % card shows 0.34 (Sales[Total Sales vs Last
    Ramadan %]); the table shows 101914 while the cards show 101.914K.
- **Small-page round, with the 640 x 360 cards (after the next round):**
  - **KPI cards cut at 640 x 360** (already on main): the numbers in the 42- and 48-high cards are cut at the bottom.
    Measured (2.158, `scripts/tests/DESKTOP-TESTS.md`): 8pt title / value 12 needs 48, value 14 needs 56 on 640 x 360,
    but 44 on 1920 x 1080 and 3840 x 2160; 42pt cards on 1080 need 88 (126 and 144 fine). No single rule fits yet:
    measure 1280 x 720, 960 x 720, 1366 x 768, 700 x 525, 2560 x 1440 and 640 x 360 again (steps of 2, the card as
    `cardFit` writes it there), then a rule by page size or a table; 1080 and up keep 42-60 (owner).
  - **Long KPI titles end in "..."** on 640 x 360 (8pt, Power BI's minimum).
  - **Charts on 640 x 360:** month and day labels slanted and cut ("Wednes..."); "Total Sales by Quarter" hides Q4
    behind a scrollbar.
  - **Detail table on 640 x 360:** shows two rows with scrollbars, and its fourth column is cut.
- **Table header alignment** (seen on "Gulf Sales AR 3"): headers are left aligned while numbers are right aligned,
  so on a wide table each number sits nearer the next column's header than its own. **Now in scope: round 0.5**
  (owner 2026-10-01), see "Next step".
- **Flaky tests on a busy laptop:** `consent` ("Berlin: no banner") and `anchors` (home page #contact) failed once
  each under load and pass alone. They don't use `ready()` yet (`scripts/tests/lib.mjs`).
- **Phase 3:** background PNGs from the engine's SVG (first test whether Power BI accepts the SVG itself).
- **Roadmap after that:** Arabic/right-to-left and Gulf DAX in a private repo, then packaging (`mcp/ROADMAP.md`).

## How to work (short)
- Plan first, wait for "go"; tests first; one writer on the repo at a time; branch → push → the reviewer tests and
  merges; never merge yourself. Keep the laptop awake during full runs.
