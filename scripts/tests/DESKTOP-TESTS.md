# Power BI Desktop tests

Some fixes can only be proven in real Power BI. This file keeps what was tested there, how, and what we learned.
Setup: Claude Code on the laptop with Microsoft's `powerbi-authoring` plugin (Power BI Authoring MCP), the Desktop
bridge CLI (`powerbi-desktop`) and the DataArcus MCP (`mcp/`). Test models carry data with known answers, so every
expected number is written down before the run.

## 2026-09-29: Power BI Desktop 2.157 (August 2026)

| Fix | Test | Result |
|---|---|---|
| A1 Last Ramadan measure | Calendar from the calendar generator, Sales = (Hijri year - 1440) x 100 + Ramadan day, 17 values: every year 2022-2027, Ramadan days 1/5/29/30, totals, old vs new measure | PASS, all 17 |
| D1 fix plan keeps refresh working | Model Health fix plan on a model with Month Year, Month Number, Year Month: TMDL quick fixes, review-folder script, Power Query removals, mark date table, refresh | PASS, refresh OK, months in date order |
| D2 measures table keeps its column | Same run: _Measures[Column1] still there | PASS |
| D6 TMDL quoting | Format string `"Yes";"Yes";"No"` through the review-folder TMDL script | PASS, unchanged |
| C2 theme font sizes | Themes from the live generator with custom pages 3840 x 2160 (font 84) and 640 x 360 (font 5), two ways: View > Themes > Browse for themes, and inside a project made with the DataArcus MCP | Menu import: Power BI refuses the whole theme ("must be <= 60", "must be >= 8"). Inside a project: loads silently, text cut off at 84 and unreadable at 5. Fixed for both: sizes kept within 8-60 |
| D5 aggregation tables | Manage aggregations needs a DirectQuery detail table; an Import-only test model cannot have one | Not testable here. Shipped because it can only mark tables as used (worst case: same as before) |
| Health check on TMDL projects (`tmdl-model.js`) | Two models, each saved from one Desktop window as a TMDL project (File > Save as) and as a .pbit (File > Export > Power BI template): Health Test (M tables, relationship, measures table, an unused table) and Ramadan Test (DAX calendar and DAX Sales table). Fixtures in `scripts/tests/fixtures/model-health/tmdl-health` and `tmdl-ramadan`; `node scripts/tests/tmdl-model.mjs` compares the engine's model, stats and findings; `check_model_health` via the MCP on both project folders and both .pbit files, reports included | Health Test: identical (score 92, same 6 findings). Ramadan Test: first run differed, Desktop's TMDL has no `dataType` for the 26 DAX-table columns, read as text gave a wrong STRING_KEYS and MONTH_SORT and missed DATE_NOT_MARKED and SUMMARIZE_KEYS. Fixed: type unknown, type checks skipped and listed. Now identical except those skipped checks; the TMDL finds nothing the .pbit does not (score 91 vs 90 with the report, since DATE_NOT_MARKED is skipped) |
| `columnTypes` from the open model | Ramadan Test project open in Desktop (the only instance), connected with Microsoft's Authoring MCP. `INFO.COLUMNS()` query from `check_model_health`'s `getThem` (36 rows), passed as `columnTypes`; also `column_operations` List. Expected, written before the run: with types = the .pbit (90, same findings, nothing skipped, applied 36 / alreadyTyped 0 / notInModel 0: all 36 columns are untyped in the files); Health Test 92, same 6 findings; no types 91 with the skipped list; an invented name in `notInModel` | PASS, all: with types identical to the .pbit (score, stats, every finding and item), from the query and from List; Health Test 92, same 6; no types 91, skipped STRING_KEYS, DOUBLE, DATE_NOT_MARKED; the invented name listed back |

## 2026-09-30: Phase 2 step (f), "Gulf Sales AR" in Power BI Desktop 2.157

`tests/5-tmdl-sample/Gulf Sales AR.pbip`, built by the MCP on the Ramadan Test model: `generate_theme` (brand
#0F4C5C, analogous, "Gulf Sales", ar, Tahoma) → `plan_layout` (analysis, filters end, ar) → `create_report` (ar,
second page on, slide-in panel off). Positions were already proven in the files (every row equal to the expected
table in `mcp/WORK.md`); this run checks how Desktop draws them. Opened with `powerbi-desktop open`
(`PBI_DESKTOP_PATH` set), one screenshot per page, KPI values with DAX through Microsoft's Authoring MCP on the only
instance (Gulf Sales AR, Ramadan Test model). Closed without saving (no unsaved changes).

| Check | Expected | Result |
|---|---|---|
| Opens in Desktop | no errors | PASS, 3 pages: تحليل, نظرة عامة, تلميح (tooltip, hidden) |
| Page 1 "تحليل" layout | right to left: title right, logo left, filter rail left (filters "end"), KPI 1 at the right, chart and table right of the rail | PASS, all drawn where planned, no overlaps |
| Page 2 "نظرة عامة" layout | KPI 1 right … KPI 4 left, main trend right, breakdown left, comparison right, detail left | PASS, no overlaps |
| Arabic texts | page names, page buttons, titles "جدول التفاصيل"/"التفاصيل", logo "شعارك", Reset "إعادة ضبط الفلاتر" | Page names, buttons and titles PASS, right aligned. **Reset: FAIL**, the button shows only its icon: its text, fill and outline (all in `visual.json`) are not drawn. **Logo placeholder:** shown, but tiny and faint (10pt grey) |
| Theme "Gulf Sales" | colours readable on dark | PASS; colour 7 (weak) not used on these pages |
| KPI Total Sales | DAX 101914 | shows 101.91K (both pages, tooltip) PASS |
| KPI Total Sales Last Ramadan | DAX 74675 | 74.68K PASS |
| KPI Total Sales Last Ramadan (old) | DAX 23635 | 23.64K PASS |
| KPI Total Sales vs Last Ramadan % | DAX 0.33780 | 0.34 PASS (value); shown as a number, not 34%: the model's measure has no format string |
| Tooltip page "تلميح" (320 x 240) | card and chart readable | **FAIL:** the card's value is cut off at the bottom (callout text too big for a 76-high card) and the chart title is truncated ("Total Sales Last Ram…") |

Seen, not layout faults (field choice or model): the main chart and comparison are "Total Sales حسب Amount" (a
number on the axis) and there is a slicer on Amount; the breakdown by Date draws hair-thin bars on a continuous date
axis; Month Name in the trend is sorted alphabetically (no sort-by column in the model); charts, tables and slicers
keep left-to-right axes and column order (Power BI does not mirror them); titles mix English measure names with "حسب".

## 2026-09-30: report fixes (branch `fix/report-quality`), "Gulf Sales AR 2" in Power BI Desktop 2.157

`tests/5-tmdl-sample/Gulf Sales AR 2.pbip`, rebuilt by the MCP running the branch's code (`da414d0`), same steps as
above: `generate_theme` (brand #0F4C5C, analogous, "Gulf Sales", ar, Tahoma, `tests/phase2-try/gulf-sales-4.json`) →
`plan_layout` (analysis, filters end, ar) → `create_report` (ar). Opened with `powerbi-desktop open`, one screenshot
per page (`tests/phase2-try/shots-ar2/`, outside the repo), KPI values with DAX through Microsoft's Authoring MCP on the
only instance. Expected results from `mcp/WORK.md`, written before the run. Closed without saving (no unsaved changes).

| Check | Expected | Seen | Result |
|---|---|---|---|
| Reset button | text "إعادة ضبط الفلاتر" with fill and outline, not only the icon | text, icon, lighter fill and outline all drawn | PASS |
| Page buttons | text visible | "تحليل" / "نظرة عامة" visible on both pages, current page filled | PASS |
| Tooltip page "تلميح" | card value fully visible (20pt), both titles readable | 101.91K fully visible, "Total Sales" and "Total Sales Last Ramadan" whole (no "…") | PASS |
| Logo placeholder "شعارك" | readable (14pt) | readable, written 14pt #b5b8be; grey and at the top of its slot | PASS |
| Fields | time axis Month Name; breakdown Quarter; comparison Day Name; slicers Year, Quarter, Day Name; nothing on Amount or Sales[Date] | page 2: line by Month Name, bar by Quarter, column by Day Name, table by Day Name; page 1: column and table by Day Name, slicers Year, Quarter, Day Name; tooltip chart by Quarter. No Amount or Date anywhere | PASS |
| `modelNotes` | Calendar[Month Name] (no sort-by column), Sales[Total Sales vs Last Ramadan %] (no format) | exactly these two, each with its fix in Desktop | PASS |
| Positions | page 1 KPI 1 1388,105,508,126, filter rail 24,105,294,951; page 2 KPI 1 1442,105,454,144 | same (group 336 + 1052; rail group 24,105,294,951; group 24 + 1418) | PASS |
| KPI values | equal DAX (Total Sales 101914) | DAX 101914 / 74675 / 23635 / 0.33780; cards 101.91K / 74.68K / 23.64K / 0.34 | PASS |

Seen, as the model notes say: months on page 2 run A to Z, and the % card shows 0.34 (the model has no sort-by column
or format string). Titles still mix English measure names with "حسب" (open item).

## 2026-09-30: table fix (branch `fix/rtl-table`), "Gulf Sales AR 3" in Power BI Desktop 2.157

`tests/5-tmdl-sample/Gulf Sales AR 3.pbip`, rebuilt by the MCP running the branch's code (`4ce4e59`), same calls as
"Gulf Sales AR 2": `generate_theme` (brand #0F4C5C, analogous, "Gulf Sales", ar, Tahoma,
`tests/phase2-try/gulf-sales-5.json`, byte-identical to `gulf-sales-4.json`) → `plan_layout` (analysis, filters end,
ar) → `create_report` (ar). Opened with `powerbi-desktop open`, one screenshot per page
(`tests/phase2-try/shots-ar3/`, outside the repo; the first capture right after `open` failed with "Print metadata is
not available", the retry 20 s later worked), KPI values with DAX through Microsoft's Authoring MCP on the only
instance. Expected results from `mcp/WORK.md`, written before the run. Closed without saving (no unsaved changes).

| Check | Expected | Seen | Result |
|---|---|---|---|
| Table width, page 1 "جدول التفاصيل" | the table fills its whole visual width | 4 columns spread over the full 1560 width, no empty area beside it | PASS |
| Table width, page 2 "التفاصيل" | the table fills its whole visual width | 4 columns spread over the full 927 width, no empty area beside it | PASS |
| Column order (both tables) | Day Name rightmost, the measures to its left | right to left: Day Name, Total Sales, Total Sales Last Ramadan, Total Sales Last Ramadan (old) | PASS |
| `modelNotes` | Calendar[Month Name], Calendar[Day Name] (no sort-by column), Sales[Total Sales vs Last Ramadan %] (no format) | exactly these three, each with its fix in Desktop | PASS |
| Everything else as in "Gulf Sales AR 2" | Reset text, tooltip, logo, positions, KPI values unchanged | files: every page.json and every visual except the two tables identical to AR 2 once ids are left out; theme and both backgrounds byte-identical. Desktop: Reset text, icon, fill, outline drawn; logo "شعارك" readable; tooltip card 101.91K whole, both titles whole | PASS |
| KPI values | equal DAX | DAX 101914 / 74675 / 23635 / 0.33780; cards 101.91K / 74.68K / 23.64K / 0.34; table totals 101914 / 74675 / 23635 | PASS |

Seen, not in the expected list: table headers are left aligned in their columns while the numbers are right aligned,
so on the wide page 1 table each number sits nearer the next column's header than its own. Days still run A to Z and
the % card shows 0.34, as the model notes say.

## 2026-09-30: cards moved to `cardVisual` (branch `feat/card-visual`, `feb8516`), Power BI Desktop 2.157: stopped on the first report

Six reports built by this branch's `mcp/server.mjs` over stdio (the session's MCP still ran the old code), same calls as
"Gulf Sales AR 3", in `tests/5-tmdl-sample/` ("Gulf Sales Cards EN/AR 1080/360/2160"); expected results in `mcp/WORK.md`,
committed before the run (`5dd2059`). Opened "Gulf Sales Cards EN 1080" with `powerbi-desktop open`; screenshots in
`tests/phase2-try/shots-cards/` (outside the repo; page 1's first capture right after `open` was empty, the retry 15 s
later worked, as on AR 3). The run stopped at the first difference, per the plan; the other five reports weren't opened.

| Check (EN 1080) | Expected | Seen | Result |
|---|---|---|---|
| 1. Title and whole number, nothing cut | every KPI card and the tooltip card whole | page 1: 4 cards, page 2: 3 cards, tooltip card: titles and numbers whole, no "..." | PASS |
| 2. Value sizes | 42 on both pages, 20 on the tooltip page | numbers at the same size as AR 3's legacy cards (42); tooltip number as before (20) | PASS |
| 3. No label, no inner box, no card background | as today | no label under the numbers, no inner rectangle; the KPI row's panel looks as on AR 3 | PASS |
| 5. Values equal DAX, shown as 101.91K / 74.68K / 23.64K / 0.34 | 101.91K / 74.68K / 23.64K / 0.34 | **101.914K / 74.675K / 23.635K / 0.34** (the numbers equal the table totals 101914 / 74675 / 23635; the card shows one more decimal than the legacy card) | **FAIL** |
| 6. Number centred, title in the reading direction | centred as on AR 3; title left (EN) | each number centred under its card; titles left | PASS |
| 4, 7, 8 (Arabic, phone layout, hand-added card) and the other five reports | | not run (stopped) | not run |

Cause: with the same automatic display units, the legacy card showed 2 decimals (101.91K) and the card visual shows 3
(101.914K). The card visual's `value` has `labelDisplayUnits` and `labelPrecision` (Microsoft's theme schema 2.157).
**Owner's decision:** keep the card visual's default format; no `labelPrecision`, because forcing 2 decimals would show
counts as 47.00. Expected result 5 is now "values equal DAX; format = cardVisual's default (e.g. 101.914K)"; the run
continues below with that expectation. The report was left open in Desktop, not saved.

**Continued (same day), all six reports.** Each opened alone with `powerbi-desktop open` (the previous one closed first,
nothing saved; a script refuses to close anything that isn't a "Gulf Sales Cards" report), one screenshot per page
(`tests/phase2-try/shots-cards/<en|ar><1080|360|2160>-p1..p3.png`), then one DAX query on the open model through
Microsoft's Authoring MCP: `EVALUATE ROW(...)` of the four KPI measures. DAX gave 101914 / 74675 / 23635 / 0.3377971
on all six.

| Check | EN 1080 | EN 360 | EN 2160 | AR 1080 | AR 360 | AR 2160 |
|---|---|---|---|---|---|---|
| 1. Title and whole number, nothing cut, no "..." on the number | PASS | PASS (long titles end in "...", see below) | PASS | PASS | PASS (same) | PASS |
| 2. Value sizes as in the table (page 1 / page 2 / tooltip) | PASS 42 / 42 / 20 | PASS 14 / 12 / 20 | PASS 60 / 60 / 20 | PASS 42 / 42 / 20 | PASS 12 / 14 / 20 | PASS 60 / 60 / 20 |
| 3. No label under the number, no inner box, panel as today | PASS | PASS | PASS | PASS | PASS | PASS |
| 4. Arabic: title on the right, KPI 1 (Total Sales) rightmost | – | – | – | PASS | PASS | PASS |
| 5. Values equal DAX; format = cardVisual's default | PASS 101.914K / 74.675K / 23.635K / 0.34 | PASS | PASS | PASS | PASS | PASS |
| 6. Number centred in every card, as in AR 3; title in the reading direction | PASS (left) | PASS (left) | PASS (left) | PASS (right) | PASS (right) | PASS (right) |
| 7. Phone layout (EN 1080): two cards per row, title and number whole | **FAIL** (owner, see below) | | | | | |
| 8. Hand-added `cardVisual` shows 42 (EN 1080) | not confirmed (owner, see below) | | | | | |

**Items 7 and 8, checked by the owner in Desktop** (View > Mobile layout; a new Card added by hand, closed without
saving); his screenshots: `tests/phase2-try/shots-cards/en1080-phone-p1.png`, `en1080-phone-p2.png`,
`en1080-handadded-card.png`.
- **7. FAIL.** Two cards per row and every number whole (the phone sizes, value 20 and title 10, fit), but: long titles
  end in "..." ("Total Sales Last Ra..."), and the cards sit on top of other visuals: on page 1 over the header ("Gulf
  Sales" and the page buttons), on page 2 over the header and the slicers. The files don't overlap: page 1's KPI group
  is at y 116 on the phone and its cards at y 0 and 108 inside it (`mobile.json`, relative to the group, the way the
  desktop positions are written). Desktop drew the cards at page y 0 and 108, so in the phone layout it reads a grouped
  visual's position as a page position. The header's children look right only because the header group is at y 0.
  The phone positions come from the existing phone layout code; this branch didn't change them (only the cards' phone
  sizes). Not fixed: needs the owner's go.
- **8. Not confirmed.** The hand-added card shows "Total Sales" as a small label above a left-aligned 101.914K (the new
  card's own defaults: label on, value not centred), in the theme's font. The crop has no KPI card beside it, so its
  size can't be compared with the KPI numbers (42) from the screenshot.

Sizes are read against each page's size in the screenshots (Desktop fits the page to the window), and the card files
hold the exact values listed in WORK.md.

Seen, not in the expected list (not cards; flagged, not fixed):
- **640 x 360:** KPI titles longer than the card end in "..." ("Total Sales Last Ramada...", 8pt titles in 151-169 wide
  cards); the header's page title "Gulf Sales" is cut at the bottom; slicer titles and the Reset button text wrap.
- **3840 x 2160:** the slicers in the filter rail are squashed to thin lines (their dropdowns don't show), the header's
  title, page buttons ("Executiv e...") and logo text are small, and the Reset button text is cut at the bottom.
None of these is written by the card code (theme and fixtures unchanged); the page sizes 640 x 360 and 3840 x 2160 had
not been checked in Desktop before.

## 2026-10-01: phone and page sizes (branch `fix/phone-and-sizes`, `d24c5c1`), Power BI Desktop 2.157: stopped on the second report

Six reports "Gulf Sales Sizes EN/AR 1080/360/2160" built by this branch's `mcp/server.mjs` over stdio (same calls as the
cards check), in `tests/5-tmdl-sample/`; expected sizes in `mcp/WORK.md`, committed before the run (`d24c5c1`). Each
opened alone with `powerbi-desktop open`, one screenshot per page in `tests/phase2-try/shots-sizes/`, one DAX query per
report (Microsoft's Authoring MCP). Stopped at the first failure (EN 360); AR 1080, AR 360, EN 2160, AR 2160 and the
phone layout (item 6) not run.

| Check | EN 1080 (`en1080-p1..p3.png`) | EN 360 (`en360-p1..p3.png`) |
|---|---|---|
| 1. Header: title one line whole, page buttons whole, logo text whole | PASS (as in the cards check) | **FAIL**: page buttons whole ("Executive summary", "Details", 8pt, one line), but the title "Gulf Sales" and "Your logo" (8pt in 16-high boxes) are cut at the bottom, each with a small scroll thumb beside it (the text box overflows) |
| 2. Rail: slicers show title and dropdown; Reset whole | PASS (3 × 274x76, "Reset filters" one line) | **FAIL**: Reset whole on one line (91x28), but the slicers (91x27) show only their titles; the dropdown boxes are squashed to a line |
| 3. 1080 as in the cards check | PASS (page 1, page 2 and tooltip look the same) | – |
| 4. Cards | PASS | PASS (numbers whole and centred; long titles end in "...", the known limit) |
| 5. Values equal DAX | PASS (101914 / 74675 / 23635 / 0.3377971; 101.914K ...) | PASS (same) |

Cause (not fixed, needs the owner's go): the fit rules in `fitText` and the slicer minimum are estimates that Desktop
doesn't bear out on the smallest page: a text box needs more than 1.5 x its text size in height (8pt text doesn't fit
16), and a dropdown slicer needs more than two lines of its text (27 is too little for an 8pt title and its box). The
tests use the same estimates, so they passed. The report was left open in Desktop, not saved.

## 2026-10-01: measured in Power BI Desktop 2.157, the heights text boxes, dropdown slicers and Reset need

A test report only, "Gulf Sales Measure" (`tests/5-tmdl-sample/`, closed without saving): ladders of the exported
header text box, dropdown slicer (Calendar[Year]) and Reset button, copied from "Gulf Sales Sizes EN 360" so the
formatting is what `pbip-export.js` writes, each with a visible background, at growing heights on a 640 x 360 page and
a 1920 x 1080 page. Screenshots `tests/phase2-try/shots-sizes/measure-p1.png`, `measure-p2.png` (crops
`measure-p1-rows12.png`, `measure-p1-rows345.png`, `measure-p2-text.png`, `measure-p2-slicer-reset.png`). Heights in page
units; the same on both pages (a point size takes the same page units on any page).

| Visual | Text | Smallest height that shows it whole | Not whole at |
|---|---|---|---|
| Text box, one line ("Gulf 24") | 8pt | 24 (640 x 360 and 1920 x 1080) | 22: text whole but a scroll thumb (overflow); 18 and less: cut |
| Text box ("Gulf Sales 42") | 18pt (the theme's title on 1080) | 42 | 38 (scroll thumb) |
| Text box ("Gulf Sales 44") | 20pt (the header title on 1080) | 44 | 40 (scroll thumb) |
| Dropdown slicer, title and box | 8pt | 48 (640 x 360 and 1920 x 1080) | 44: the box's bottom edge cut; 24 and less: title only |
| Dropdown slicer | 15pt (the theme's slicer text on 1080) | 76 | 68: box touching the bottom; 60: cut |
| Reset, icon and text on one line, 91 and 140 wide | 8pt | 18 (icon whole); text whole from 14 | 12 |
| Reset, 250 wide | 15pt | text whole from 24, icon full from 28 | 20 |

Rules that fit every row: a one-line text box needs 10 + 1.8 x the point size (points to pixels 4/3, a line about 1.35
of that, about 5 of padding at the top and at the bottom): 8pt 25, 18pt 43, 20pt 46. A dropdown slicer needs
16 + 4 x the point size: 8pt 48, 15pt 76. The Reset button fits inside the text-box rule. The 91-wide Reset showed
"Reset filters" on one line at 8pt, so the 0.55 em per character width estimate is on the safe side. A 10pt row in
58-wide boxes wrapped its label, so it gave no height and is left out.

**Repeated on Power BI Desktop 2.158.1177** (2026-10-01, the Store app updated itself overnight): the same report,
opened with `powerbi-desktop open` (`PBI_DESKTOP_PATH` pointed at the 2.158.1177 install), one screenshot per page
(`measure158-p1.png`, `measure158-p2.png`). Both are byte for byte the 2.157 screenshots (SHA-256 `01009a6f6065ffdf…`
page 1, `3155cce97a8b3811…` page 2), so every row reads the same: text box 8pt 24, 18pt 42, 20pt 44; dropdown slicer
8pt 48, 15pt 76; Reset 8pt 18, 15pt text from 24. Closed without saving.

## 2026-10-01: round 2 of the phone and size fix (`fix/phone-and-sizes`, `071faa1`), Power BI Desktop 2.158.1177: stopped on the second report

The eight "Gulf Sales Fit" reports (built with this branch's `mcp/server.mjs` over stdio, expected sizes in
`mcp/WORK.md`, committed before the run in `071faa1`). Run on 2.158.1177, after the measurements were repeated on it
and matched 2.157 exactly. One screenshot per page in `tests/phase2-try/shots-sizes/fit-*.png`, one DAX query per
report. Stopped at the first failure (AR 360); EN 1080, EN 2160, AR 1080, AR 2160, EN/AR 1080 top and the phone
layout not run.

| Check | EN 360 (`fit-en360-p1..p3.png`) | AR 360 (`fit-ar360-p1..p3.png`) |
|---|---|---|
| 1. Header: title, page buttons, logo text whole | PASS ("Gulf Sales", "Executive summary", "Details", "Your logo"; no scroll thumb) | PASS ("Gulf Sales", "تحليل", "نظرة عامة", "شعارك") |
| 2. Rail: slicers show title and dropdown; Reset whole | PASS (3 × 91x48 with "All" boxes; "Reset filters" one line) | **FAIL**: slicers PASS (3 × 91x48), but Reset (91x28, 8pt) shows "إعادة ضبط الفلاتر" on one line with the icon drawn over its last letters (`fit-ar360-reset-crop.png`); the plan sized it for two lines, Desktop didn't wrap it |
| 4. Cards | PASS (whole, centred; long titles "...", the known limit) | PASS (titles on the right, Total Sales rightmost) |
| 5. Values equal DAX | PASS (101914 / 74675 / 23635 / 0.3377971) | PASS (same) |

Cause (not fixed, needs the owner's go): the Reset rule assumes Desktop wraps a button's text when its height holds two
lines (2 + 1.6 x 8 x 2 = 28); on the 91-wide Arabic Reset it kept one line under the icon. In the cards check the same
button 40 high wrapped onto two lines (`shots-cards/ar360-p1.png`); the measurement report only had the English text,
which fits one line in 91. So button text wrapping wasn't measured. The report was left open in Desktop, not saved.

**Correction, from the owner's screenshot of the same AR 360 page:** the card numbers are cut at the bottom ("23.635K",
"74.675K", "101.914K" in the 169x42 cards: title 8pt, value 12pt). Item 4 on EN 360 and AR 360 is therefore **FAIL**,
not PASS: I judged the cards from the bridge's screenshots, rendered at 2x, where the digits only just clear the
card's bottom edge (`crop-ar360-cards42.png`); at the owner's window zoom they are cut. The same cards were marked PASS
on 640 x 360 in the cards check (2026-09-30) and in round 1 here; that was wrong for the same reason. Cause: `cardFit`
still counts a line as 1.5 x pt (points taken as pixels), while the measured text box line is about 1.8 x pt plus
padding: a 42-high card needs about 48 by the measured rule, a 48-high card (14pt value) about 52. Not fixed: the owner
had left `cardFit` alone unless the measurements showed it too tight; they now do, so it needs his go.

## 2026-10-01: measured on Power BI Desktop 2.158.1177: KPI cards, Reset buttons, page buttons

Two test reports, closed without saving: "Gulf Sales Measure 2" (cards on 640 x 360 and 1920 x 1080, Reset 8pt on
640 x 360 and 15pt on 1080, page buttons 14pt) and "Gulf Sales Measure 3" (the 640 x 360 cards on 1920 x 1080 and
3840 x 2160 pages, and 42pt cards at 60-100 on 1080). Every visual copied from the "Gulf Sales Fit" reports, so the
formatting is what `pbip-export.js` writes, with a visible background. Each page captured at the bridge's 1x and 2x
scale; every reading below from a full-size crop (`tests/phase2-try/shots-sizes/m2-*`, `m3-*`), not the page view.
Heights in page units; "whole" = the number's bottom clear of the card's inner (callout) box.

| Card (title, padding, value) | Page | Cut | Touching the edge | Whole from |
|---|---|---|---|---|
| 8pt title, padding 3, value 12 (the 169x42 cards) | 640 x 360 | 36, 40 | 44 | 48 |
| 8pt, padding 3, value 14 (the 151x48 cards) | 640 x 360 | 40, 44, 48 | 52 | 56 |
| 8pt, padding 3, value 12 | 1920 x 1080 and 3840 x 2160 | 36, 40 | | 44 |
| 8pt, padding 3, value 14 | 1920 x 1080 and 3840 x 2160 | 40 | | 44 |
| 18pt title, padding 8, value 42 (the 126 / 144 cards) | 1920 x 1080 | 60-80 | 84 | 88 (and every height 88-144) |

So on 640 x 360 the exported cards (42 and 48 high) are cut, as the owner saw, and the same cards need less on the
bigger pages. Neither a rule in points (text box 10 + 1.8 x pt) nor any one per-point line height fits all rows: the
42pt card needs 88 (about 2.1 x its value), the small cards 44-56 (3.1-4 x theirs), and the same small card needs more
on the 640 x 360 page than on 1080 or 2160. More page sizes are needed to find the rule (see `mcp/WORK.md`).

| Reset (91 wide on 640 x 360, 260 on 1080) | Seen |
|---|---|
| "Reset filters" 8pt, heights 18-44 | never wraps; the icon grows with the height and reaches the text from about 32 |
| "إعادة ضبط الفلاتر" 8pt, heights 18-44 | never wraps; the text is wider than the space beside the icon, so the icon covers its end at every height |
| Both 15pt, 260 wide, heights 18-48 | cut at 18-22, whole from 24; the icon never reaches the text |

Page buttons 14pt, about 200 each, heights 30-56: whole at every height; a page button's text does wrap when it is
narrow (e.g. "Executive summary" on two lines in the 1080 reports). The current page's button uses Power BI's own
smaller text: the export sets the text size for the default state only, not the selected one.

## 2026-10-01: round 3 of `fix/phone-and-sizes` (`982fbbb`, Reset and page buttons), Power BI Desktop 2.158.1177: stopped on the first report

The eight "Gulf Sales Fit2" reports (expected sizes in `mcp/WORK.md`, committed before the run in `6d29ac3`). Started
with AR 360 (last round's failure), captured at 2x and 1x (`tests/phase2-try/shots-sizes/fit2-ar360-s1/s2-p*.png`),
judged from full-size crops (`fit2-ar360-s1/s2-p1-header.png`, `-rail.png`, `-cards.png`). Stopped at its failure; the
other seven reports and the phone layout not run. AR 360 left open in Desktop, not saved.

| Check (AR 360, page "تحليل") | Expected | Seen | Result |
|---|---|---|---|
| Header: title, page buttons, logo text | whole | "Gulf Sales", "تحليل", "نظرة عامة", "شعارك" whole | PASS |
| Current page's button text | the same size as the others | "تحليل" (current) the same size as "نظرة عامة" | PASS |
| Slicers | title and dropdown box | Year, Quarter, Day Name each with its "All" box | PASS |
| Reset: one line, no icon over the text | "إعادة ضبط الفلاتر" whole, no icon (91x15, 8pt) | no icon, one line, but the text is **cut at the bottom** at 1x and 2x | **FAIL** |
| Cards | known 640 x 360 cut (open item) | digits touch the bottom edge | known, not judged |
| Values equal DAX | 101914 / 74675 / 23635 / 0.3377971 | same | PASS |

Cause: the owner's height rule for a one-line button, max(40 x page h / 1080, 2 + 1.6 x pt), gives 15 at 8pt on
640 x 360; the measurement (2026-10-01) showed English 8pt text whole from 14 and the icon from 18, but the Arabic text
(taller letters) needs more than 15. Not fixed: needs the owner's go.

**Seen, not in scope** (rule 9; AR 360): KPI titles, chart titles ("Total Sales حسب Day Name"), table headers and
slicer titles in English (open item: Arabic display names); days in alphabetical order in the chart and table (open
item: sort columns); the KPI numbers touch or cross the cards' bottom edge (open item: 640 x 360 cards); "Total Sales
Last Ramadan (..." cut with "..." (8pt minimum); the table shows five rows with a scroll bar; modelNotes:
Calendar[Month Name] and Calendar[Day Name] without a sort-by column, Sales[Total Sales vs Last Ramadan %] without a
format string (the % card shows 0.34).

## 2026-10-01: measured on Power BI Desktop 2.158.1177: the Reset button's height, Arabic and English

"Gulf Sales Measure 4" (`tests/5-tmdl-sample/`, closed without saving): the exported Reset buttons copied from the
"Gulf Sales Fit2" reports (Arabic without its icon, English with it, as exported on 640 x 360), with a visible
background, at growing heights; captured at 1x and 2x, read from full-size crops (`tests/phase2-try/shots-sizes/
m4-s1/s2-ar8.png`, `-en8.png`, `-ar15.png`, `m4-s2-ar8-17-18.png`). Page units.

| Reset | Cut | Touching the edge | Whole from |
|---|---|---|---|
| "إعادة ضبط الفلاتر" 8pt, 91 wide, 640 x 360 | 14, 15, 16 | 17, 18 (the tail of "ر" on the button's edge) | 19 |
| "Reset filters" 8pt, 91 wide, with icon, 640 x 360 | | | 14 (the icon clear of the text at every height 14-24) |
| "إعادة ضبط الفلاتر" 15pt, 274 wide, with icon, 1920 x 1080 | 24, 26 | 28 | 30 |

Rule from the larger of the two (Arabic): a Reset button needs 6 + 1.6 x pt (8pt 19, 15pt 30), 4 more than the
button rule it used (2 + 1.6 x pt).

## Lessons
- **Prompts for the laptop agent:** start with the request itself, name every file, forbid changing the test files or the expected numbers, and say "stop and report on failure". Give the exact report format.
- **What the agent can do alone:** create tables, relationships and measures, run DAX, mark date tables, refresh, screenshot one page at a time.
- **What still needs a person:** applying TMDL scripts in TMDL view (no tool for it), Power Query edits that remove columns (the MCP updates the M but not the column mappings; Desktop's Close & Apply does), saving files.
- **Quirks:** a relationship created through the API needs a Calculate refresh before queries work. `powerbi-desktop screenshot-all` failed with REPORT_DIR_REQUIRED on a generated project (per page works). A screenshot can leave a borderless capture window open. The first screenshot right after `open` can come back as an empty page (visuals not drawn yet); take it again before judging. The Modeling MCP can show a stale copy after changes made in Desktop until it reconnects.
- **Theme checks differ by path:** the menu import validates the theme (8-60 font sizes) and refuses it; a theme inside a project is applied as written without any message. Test both.
- **`powerbi-desktop open`** fails with DESKTOP_EXE_NOT_FOUND when Power BI comes from the Microsoft Store; set `PBI_DESKTOP_PATH` to the running Power BI's path.
- **Test models written by hand** have no lineage tags, so TMDL createOrReplace scripts generated from them give objects new tags. Models exported from Desktop carry the tags.
- Power BI Desktop saves projects as TMDL by default; `check_model_health` reads them (`tmdl-model.js`).
- **TMDL leaves out inferred types:** columns of a DAX table (Power BI works the type out from the DAX) have no `dataType` in the TMDL files, but the .pbit export has it (`isDataTypeInferred: true`). Only the open model or a .pbit knows these types.
- **Desktop's TMDL, as seen in 2.157:** `database` has no name; model annotations and `ref table` lines sit at the top level of `model.tmdl`, and `ref` gives the table order (the .pbit uses the same order); columns carry `changedProperty = IsHidden` when hidden by hand; format strings with quotes are written as `"""Yes"";""No"""`.
- **Types of DAX-table columns in the open model:** `INFO.COLUMNS()` gives them `ExplicitName` = blank and `ExplicitDataType` = 1 (Automatic); the name is in `InferredName` and the type in `InferredDataType` (Tabular DataType numbers: 2 String, 6 Int64, 8 Double, 9 DateTime, 10 Decimal, 11 Boolean). `INFO.VIEW.COLUMNS()` has only display names for types, not documented, so it is not used. Microsoft's `column_operations` List returns the same types as TOM names (`DateTime`, `Int64`, `String`, `Boolean`).
- **`assets/data/model-health-sample.pbit` is not a valid Power BI file.** Desktop refuses it ("can't be opened. Either the file is encrypted or corrupted", missing part /Version). It was built by hand for the website's demo; use it only there, never for Desktop tests.

## To do (DataArcus MCP)
- A tool to apply a TMDL script to the open model, or a clear hand-off step.
- Find why `screenshot-all` fails on generated projects.
- Share the theme and layout engine with the website so the MCP can design full pages.
