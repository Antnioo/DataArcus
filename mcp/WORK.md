# Current work (the memory between sessions)

Read this first; update it as you go (rules in `mcp/CLAUDE.md`, "Keeping the memory"). Last updated 2026-10-01
by the builder: round 0 measured in Power BI Desktop 2.158.1177 (seven changes; `scripts/tests/DESKTOP-TESTS.md`) and its
plan rewritten from the measurements under "Next step" (branch `plan/next-rounds`, no code changed). Five decisions
wait for the owner; the build waits for his go and for the split of `pbip-export.js` to merge.

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

#### Round 0: the owner's seven findings (branch `fix/tooltip-logo-table`)
**Measured in Desktop 2.158.1177 on 2026-10-01, before any code** (`scripts/tests/DESKTOP-TESTS.md`, "round 0
measurements": the table of results, the test reports and the scripts `builder-scripts\m0-*`). The plan below uses what
was measured, not the earlier guesses. Property names and values were first read from Microsoft's report CLI
(`powerbi-report-author` 0.4.0, installed on the laptop as a reference: `formatting describe-object`, `validate`).
The seven, in build order: 1 tooltip link, 2 logo, 3 tooltip bar chart, 4 tooltip transparency (**measured: not
possible, see 0.4**), 5 table header alignment, 6 transparent card fill, 7 card title margin.
**One lesson runs through 6 and 7 (and the buttons before): a formatting entry's selector decides whether Desktop
uses it.** The card's container `padding` and `spacing` and `fillCustom.show` are ignored with the `default` selector
and work without one, while the card's `value`, `label` and `outline` need it. Every entry is written the way it was
measured to work, and the tests pin the selector, not only the value.

**The Desktop check for the whole round (after the code, once):** four reports as the website's sample download
(English and Arabic, 1920 x 1080 and 1280 x 720, side accent bar) with the wide logo, the square and the tall logo on
the same four, one dark report, and the same designs through the MCP on our sample model with the `logo` input. On
each: every chart hovered (`m0-hover.ps1`), the tooltip page itself, every table, the KPI cards, the header with its
logo, the phone layout (`phone-check.ps1`). Crops at 1x and 2x. Expected results are listed per change.

**0.1 The tooltip page linked to every chart.** Module: page assembly (the link), visual builders (charts).
- **Measured:** today's `type: 'ReportPage'` shows Power BI's default tooltip; Microsoft's validator rejects the value
  ("valid: Default, Canvas"); with `type: 'Canvas'` our tooltip page shows on every hovered chart, in English and
  Arabic, on 1080 and 720, light and dark.
- **Change:** every chart on every main page (kinds line, bar, column, donut, funnel, treemap, map) gets
  `visualTooltip: { show: true, type: 'Canvas', section: <tooltip page name> }`; today only the first chart of page 1
  gets a link, with the wrong type. Cards, tables, slicers, text and buttons get none. The website's README step
  "Hover the main chart on the first page" becomes "Hover any chart" (both languages, `theme-generator.js`, `?v=`).
- **Tests first (failing):** `scripts/tests/report-check.mjs` gets `tooltipProblems(files)`: every chart has the link
  with `type` `'Canvas'` and a `section` that is a page of `type: 'Tooltip'`; nothing else has one. In `pbip.mjs` (54
  designs x 2 languages, both downloads) and `mcp/test.mjs`. Before: the default two-page report has 4 charts (page 1
  line, bar, column; page 2 column), 1 linked with the wrong type: 4 of 4 fail; the ops layout 5 of 5. After: 0.
- **Expected in Desktop:** hovering each of the 4 charts shows our tooltip page filtered to the hovered point.
- **Fixtures:** none change (`cases.json` and `project-pages.json` hold themes and slots, not `visual.json`).

**0.2 The logo box sized from the logo, and a `logo` input in `create_report`.** Module: the shared design engine
(`assets/js/design-engine.js`), visual builders (image), `mcp/server.mjs`.
- **Measured:** today's `imageScaling.imageScalingType: 'Fit'` stretches the image to its box (the same as
  `image.fit: 'Stretch'`); `image.fit: 'Fit'` keeps the ratio and shows the whole image, centred; `'Fill'` and
  `'Normal'` crop. In a box of the logo's own shape the logo is undistorted. **The tall logo (100 x 250) at 19 x 48
  (13 x 32 on 720) is whole but very thin**; the crop is `shots-m0\c-owner-logo-ratio-boxes.png` for the owner
  (decision 3); nothing is changed for it until he answers.
- **Owner's decisions:** the box takes the logo's shape (designed height, width from the ratio, **no 100 minimum for
  an attached logo**, the 360 maximum stays); the title and page buttons use what's left; `create_report` gets `logo`.
- **Change, engine:** `imageSize(bytes)` (PNG: IHDR; JPG: the SOF marker; null when it can't); `computeSlots`,
  `projectSlots` and `projectPages` take an optional `logoRatio`: logo height `hh - 24`, width
  `min(360, round(height x ratio))`, its far edge where it is today. Without it every result is identical to today.
- **Change, report:** the image is written with `image.fit: 'Fit'` (the old `imageScaling` entry goes).
- **Change, callers:** `theme-generator.js` passes the attached logo's ratio; `create_report` gets an optional `logo`
  (a PNG or JPG inside the working folder, 2 MB at most; copied into the new report, never changed; another type, a
  bigger file or one outside the folder is refused with the reason). Hand-placed pages keep their box, get the scaling.
- **Tests first (failing):** `design-engine.mjs`: `imageSize` on four logos of ours
  (`scripts/tests/fixtures/logos/`: `wide.png` 400 x 100, `square.png` 200 x 200, `tall.png` 100 x 250, `wide.jpg`
  600 x 50) and the boxes below; `pbip.mjs` and `mcp/test.mjs` (the `logo` input and its three refusals): the image's
  box, `image.fit` `'Fit'` and no `imageScaling`, page buttons ending 24k before the logo, no overlap in the header,
  `layoutProblems` clean, both languages. Before: every report with a logo fails on the scaling and the box.
- **Expected boxes (default header 56, page units; today 225 x 48 at x 1659 on 1080, 150 x 32 at x 1106 on 720; in
  Arabic the logo starts at x 36 / 24):**

  | Logo | Ratio | 1920 x 1080 (x, w x h) | 1280 x 720 (x, w x h) | Drawn |
  |---|---|---|---|---|
  | wide 400 x 100 | 4 | 1692, 192 x 48 | 1128, 128 x 32 | fills its box |
  | square 200 x 200 | 1 | 1836, 48 x 48 | 1224, 32 x 32 | fills its box |
  | tall 100 x 250 | 0.4 | 1865, 19 x 48 | 1243, 13 x 32 | fills its box (thin: decision 3) |
  | very wide 600 x 50 | 12 | 1344, 540 x 48 (the 360 maximum) | 896, 360 x 32 | 540 x 45 / 360 x 30, whole |

  The title stays 840 x 48 (560 x 32); the logo's far edge stays at 1884 (1256).
- **Expected in Desktop:** each logo undistorted (ratio in the crop within 2%), whole, at the header's far edge; title
  and page buttons whole and not touching it; without a logo the placeholder as before.
- **Fixtures:** none change (no fixture has a logo; the input is optional). If one differs, stop and report.

**0.3 The tooltip chart as a bar chart whose labels fit** (owner's yes to the bar chart). Module: page assembly (the
tooltip page), sizes (the measured tooltip rule).
- **Measured (296 x 140, English and Arabic):** today's column chart with the theme's 15pt axis text shows "El…",
  "F…". A bar chart writes names horizontally; with axis text 8pt and axis room 40% (`categoryAxis.maxMarginFactor`)
  a 20-character name is whole ("Ras Al Khaimah North", "رأس الخيمة الشمالية"); at 9pt and 10pt it needs 50%. **A bar
  chart of this size shows only 3 rows, then a scrollbar** (which can't be used inside a tooltip); with the value axis
  off and data labels on it shows 4, each bar with its value. One row takes 22:
  rows = floor((height - 46) / 22) without the value axis.
- **Change:** the tooltip chart becomes `clusteredBarChart`: `categoryAxis` `fontSize` 8, `maxMarginFactor` 40, axis
  title off; `valueAxis` off; `labels` on at 8pt; its title as today (10pt). The card above it unchanged.
- **Open point (decision 2):** 4 rows at today's size. A category with more values hides the rest behind the
  scrollbar. Proposed: the tooltip page grows from 320 x 240 to 320 x 284 and the chart from 140 to 184 high, which
  shows 6 rows; the report can't know how many values a field has, so beyond that the scrollbar stays.
- **Tests first (failing):** `report-check.mjs` gets `tooltipPageProblems(files)`: the tooltip chart is a bar chart
  with these four settings, and its height gives the rows the rule promises (4, or 6 after decision 2). In `pbip.mjs`
  (sample data, both languages) and `mcp/test.mjs`. Before: every report with a bound tooltip page fails; after: 0.
- **Expected in Desktop (hover and the page itself):** every category name whole and horizontal with its value,
  "Abu Dhabi" and the Arabic names included, no "…"; 4 rows (6) without a scrollbar; the card as before.
- **Fixtures:** none change.

**0.4 Tooltip transparency: measured, not possible in Power BI Desktop.**
- **Measured:** the tooltip is opaque at 0, 10, 15 and 20 alike (pixels inside it are exactly the card colour, light
  and dark, also where a dark bar is behind it). Still opaque with the page background at 100, the wallpaper at 100
  or removed, and with the hovered visual's own tooltip transparency or background colour set. Desktop draws a report
  page tooltip on an opaque box; no setting tried shows the page through it.
- **Plan:** nothing is built. **Decision 1:** drop it (proposed), or the owner checks one published report in the
  Power BI service, which the builder can't do from here.

**0.5 Table header alignment** (closes the open item). Module: visual builders (table); `assets/js/pbip-bind.js` (a
bound field says whether it is a number).
- **Measured:** one `columnFormatting` entry per column, selector `{ metadata: <the column's queryRef> }`, with
  `alignment` and `styleHeader`, `styleValues`, `styleTotal` on, puts each header over its own values: text `Left` and
  numbers `Right` in English; text `Right` and numbers `Left` in Arabic, where the text column is the rightmost. The
  columns still fill the width.
- **Change:** every table column gets that entry: measures and columns of a number type on the number side, other
  columns on the text side; a column whose type the files don't give (DAX tables) follows how it was picked (as a
  category: text). The sample data's table the same way.
- **Tests first (failing):** `report-check.mjs` gets `tableProblems(files)`: each column of every table has exactly
  one entry with its queryRef, the alignment its type and the report's direction ask for, and the three switches on.
  `pbip.mjs` (54 designs x 2 languages, both downloads), `mcp/test.mjs`. Before: the default report has 2 tables of 4
  columns: 8 of 8 fail; after: 0.
- **Expected in Desktop:** each header over its own values; English: Region left, three number columns right;
  Arabic: المنطقة right, numbers left.
- **Fixtures:** none change.

**0.6 Transparent card fill, so the panel and its accent bar show.** Module: visual builders (card).
- **Measured:** the solid fill is the card visual's own default (`fillCustom`, on in the theme's background colour),
  not the theme and not `visualContainerObjects.background`; it covers the card below its title, so the accent bar
  shows only as a sliver. `fillCustom: [{ properties: { show: false } }]` **with no selector** removes it and the bar
  shows whole (side bar and top bar, English and Arabic, light and dark); the same entry with the `default` selector
  is ignored. **Other types:** charts, slicers and text boxes have no fill; the table's header and rows have their own
  (the theme's colours, the same as the panel, so nothing is hidden: decision 5); buttons are filled by design.
- **Change:** every card (KPI cards, the tooltip card, the phone) gets that entry. Reports without a background image
  (the MCP's) look the same as today: there the panel is the theme's visual background in the same colour.
- **Tests first (failing):** `cardProblems` (`pbip.mjs`) and the card checks in `mcp/test.mjs`: each card has
  `fillCustom` with `show` false and no selector. Before: every card on the 54 designs and both downloads fails (the
  default report: 7 KPI cards and the tooltip card, 8 of 8); after: 0.
- **Expected in Desktop:** on the website download every KPI card shows its accent bar whole (left in English, right
  in Arabic, on top on the dark design) and the panel's border and shadow; numbers and titles unchanged.
- **Fixtures:** none change.

**0.7 The card title's margin.** Module: visual builders (card), sizes (`cardFit`).
- **Measured:** the title touches the top because **the card's container padding is ignored**: we write `padding`
  and `spacing` with the `default` selector, and the card is the same with them, without them and with top 30. With no
  selector both apply. So today the title sits 0 from the top and from the side, and **with a side accent bar the
  title is drawn over the bar**. On the real panels: top 8 on 1080 (5 on 720) is clear but tight, **12 (8) is the
  smallest that looks right**, 16 and up looks loose; on the bar's side 22 (15) just touches the bar, **26 (17) leaves
  a clear gap**. The number stays whole at every step.
- **Change:** `padding` and `spacing` are written with no selector (on the page and in `mobile.json`); the top
  padding becomes `round(12k)` (k = page height / 1080: 12 on 1080, 8 on 720), scaled like the other paddings; the
  other sides stay `P` (8 on 1080, 5 on 720). Where the page has a side accent bar the padding on that side is the
  bar's end plus `round(5k)` (26 on 1080, 17 on 720; **needs the owner's yes, decision 4**): a new engine function
  gives it and the callers pass it per page, so `projectPages` and its fixtures stay as they are. The tooltip card and
  the phone cards keep `P` on every side. `cardFit` takes the four paddings and reserves them:
  value = min(callout, floor((h - top - bottom - 2I - title line) / 1.5), floor((w - start - end - 2I) / 5.13)).
- **Expected numbers:** default cards keep their value size (1080: 454 x 144, room for 54, value 42; 720: 96 high,
  room for 36, value 28; tooltip card 20; phone card 20). The lowest KPI height on 1080 (96) goes from 24 to 22. Any
  pinned value size that moves (small pages) is listed with its reason for the reviewer before the code; none is
  edited to pass. The 640 x 360 cards stay an open item: there the padding now really takes room.
- **Tests first (failing):** `cardProblems`: `padding` and `spacing` have no selector; the top padding is
  `round(12k)` on main pages; with a side bar the start-side padding clears it; the height and the width the card
  needs (from the written paddings) fit its box. Before: every card fails on the selector; after: 0.
- **Expected in Desktop:** the title clear of the panel's top (12 on 1080, 8 on 720), not over the accent bar, the
  number whole and centred, on both pages, the tooltip and the phone; English and Arabic.
- **Fixtures:** none change (they hold no card sizes).

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
8. The tooltip chart becomes a bar chart; tooltip transparency starts at 15 within 10-20 (measured since: not
   possible, decision 1 below).

#### Decisions needed from the owner before round 0 is built (from the measurements)
1. **Tooltip transparency can't be done in Desktop** (the tooltip is always opaque). Drop it from round 0 (proposed),
   or check one published report in the service first?
2. **The tooltip bar chart shows 4 rows** at today's tooltip size. Grow the tooltip page to 320 x 284 for 6 rows
   (proposed), or keep 320 x 240 with 4?
3. **The tall logo is 19 wide on 1080** (13 on 720): whole and undistorted, but thin (crop
   `shots-m0\c-owner-logo-ratio-boxes.png`). Accept it as the logo's own shape (proposed), or give tall logos more
   height or a smallest width?
4. **Card title:** top margin 12 on 1080 and 8 on 720 (crops `c-en1080-pad-p4.png`, `c-en720-pad-p4.png`)? And, found
   while measuring: with a side accent bar the title is drawn over the bar; move the title clear of it (26 on 1080,
   17 on 720, crop `c-en1080-pad-p6.png`) in this round (proposed)?
5. **The table's header and rows have their own fill** (the panel's colour, so nothing is hidden today). Leave it
   (proposed), or make it transparent like the cards?

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
