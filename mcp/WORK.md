# Current work (the memory between sessions)

Read this first; update it as you go (rules in `mcp/CLAUDE.md`, "Keeping the memory"). Last updated 2026-10-03
by the reviewer: **round 2 is merged (`ada2942`) and the Gulf Calendar pack is merged (`2e6fc3d`)**; main is at
`2e6fc3d`. Next: "Next step" below (the queued builder work). The "Round 2 in progress" section is now history.

## Where things stand
- **Merged 2026-10-03 (reviewer):** round 1 (`80d3a00`); the Microsoft plugin test (`bc05275`); privacy statement and
  product spec (`515409d`: `mcp/PRIVACY.md`, `mcp/PRODUCT_SPEC.md`); the golden tasks (10 then, 11 now) and test models (`39b5ab7`);
  employer-sector details off the public site and the Health Check case study on Microsoft's public sample
  (`0a328b5`); round 2 (`ada2942`: right-to-left page buttons, month/day order in charts, Arabic display names, sort
  and format fixes as health findings with `weekStart`, the tooltip's base measure, KPI title padding; Desktop: 60
  captures, validator 0 errors, hover, Ctrl+click, the TMDL format script (33.8%, the plan's 34.0% came from the
  rounded card) and the sort script on an imported calendar, all as expected); the Gulf Calendar pack (`2e6fc3d`:
  sourced Ramadan/Eid dates 2018-2030 in `gulf-dates.js` with `scripts/gulf-calendar/DATES-SOURCES.md`, GCC weekends by
  country in the Calendar Generator, Eid window measures in the Measure Builder, the article, LinkedIn drafts in
  `content/linkedin-gulf-calendar.md`; Desktop: `check.dax` 40 of 40). MCP 149 checks; 17 website suites.
- **Owner decisions 2026-10-03:** right-to-left page buttons in the website's Arabic download too; the Calendar
  Generator's UAE and Saudi quick-setup buttons unchanged; the Gulf Calendar article live now; DataArcus Pulse stays
  on the site as it is until the owner redesigns it with the tool.
- **Planned, not approved:** the Gulf calendar inside the MCP (plan only, branch `plan/gulf-calendar-mcp`,
  `mcp/plans/GULF-CALENDAR-MCP.md`).
- **Now (2026-10-02, main `e8fe171`):** 6 MCP tools (`read_model`, `suggest_fields`, `check_model_health`,
  `generate_theme`, `plan_layout`, `create_report`), 120 checks in `npm test`; 16 website suites; CI runs all of them
  on every push. Merged since 2026-10-01: round 0 (`14dd467`: the tooltip page on every chart, the logo at its own
  shape and the `logo` input, the tooltip bar chart, table headers aligned with their columns, card fill and padding,
  the theme name and `.platform`), `fix/card-theme-radius` (`99d1cee`: Microsoft's validator passes on the MCP's
  exports) and `fix/mcp-visual-style` (`e8fe171`: a solid design shows its panels on the MCP's reports). Each was
  measured and checked in Power BI Desktop 2.158.1177 (`scripts/tests/DESKTOP-TESTS.md`). The lines below are older.
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

## Next step: round 9, separators on cards, "this Ramadan only", SVG columns (experimental), the capability map (owner's go 2026-10-04; TERMINAL ONLY; branch `fix/round-9` from main `3af6657`; dataarcus-engine: the same branch name, for the package)
The owner's words: "I want the engine to expand and be able to do all sorts of manipulation in Power BI ... more room
for creativity ... a tool used all the time to build other tools." Three items to build and one plan. Built only on
what the sitting of 4 October measured (DESKTOP-TESTS.md): D8 on a card, D14, D-P1 in a table.

**Before (main `3af6657`):** `npm test` 324 of 324. Website: CI is the record.

| # | Item | Change | Expected |
|---|---|---|---|
| R9.1 | Thousand separators on cards | where a KPI card (or the single card slot) shows a measure of round 6's `numberFormats` list, `create_report` writes Desktop's own D8 entry as a second entry of the card's `objects.value`: `labelDisplayUnits` `-1D` (Custom), `customFormatString` the measure's format with the separator (`0` -> `#,0`, `0.00` -> `#,0.00`; the model's helper `withSeparator`), selector `{ metadata: <the card's queryRef> }`. A percent format is untouched; a measure that has a separator gets no entry. **A measure with no format at all** (D8's own case) gets `#,0.##`: D8 measured `#,0` on a whole number; `#,0.##` is the same code that also keeps decimals where a measure has them (not measured: D16). Only cards: the tooltip card, tables and tooltips are not touched and stay in `numberFormats` with "needs a Desktop check (D8, tables)". The answer says which cards were formatted and that such a card now shows the full number (101,914), not a scaled one (101.914K) | tests first (5 checks): the exact D8 JSON for a `0` measure; `0.00`; a measure with a separator: no entry; a percent: no entry; the answer and Microsoft's validator 0. The website's download has no such entry (byte for byte as before). D16 added |
| R9.2 | "This Ramadan only" | **The choice: a second page filter on the calendar's Hijri year, with the year given by the user.** `pageFilters` already takes several filters, both are plain columns, nothing new is written into PBIR, and it is true to D14 (Is Ramadan alone keeps every Ramadan). **How the agent learns the year without data:** it can't from the tools (they return no data values, by design), so it asks the user in the plan ("Which Ramadan? Give the Hijri year as your calendar writes it, for example 1447") and shows both filters in the plan. Not chosen: a Top N or relative filter (Power BI has no Top N at page level, and "latest" would need a measure), a default slicer selection (it stores a data value the tools never read), a new measure (the model is never touched). The engine helps: when a page filter keeps the `true` rows of a column whose name says Ramadan and no filter is on a Hijri-year column, the answer says that this keeps every Ramadan, names the Hijri-year column it found in the model, and tells the agent to ask the user for the year. The skill and the tool's description say the same | tests first (3 checks): both filters on the page (`true`, `1447L`); the note with the column's name when only Is Ramadan is given; no note with both. Golden task 3 at tool level with both filters: expected vs actual in GOLDEN-TASKS.md. D14 gets the Desktop step |
| R9.3 | SVG columns in tables (EXPERIMENTAL) | `create_report` takes `svgColumns: [{ label, design, page? }]`. The design is the SVG KPI Designer's own format (values + layers; `assets/js/svg-kpi-compiler.js`): no raw SVG, no script. The shared compiler gets (a) `toMeasure(design)`: the DAX expression alone, without comments; (b) a value kind `column` (the row's value of a model column) and the text format `text`; (c) a run-time escape: any text that comes from a column is passed through `SUBSTITUTE` for `&`, `<`, `>`, `'`, `"`, `%`, `#` in DAX (and the same in the JS preview). Designs without these compile byte for byte as before. The server checks every measure and column of the design against the model (bare names are written as DAX names: `]` doubled, a table's `'` doubled), compiles, and writes a report-level measure into `definition/reportExtensions.json` exactly as D-P1 (schema reportExtension 1.0.0, `name: "extension"`, the entity = the table of the design's first measure, `dataType: Text`, `dataCategory: ImageUrl`), projected as the last column of the page's table with `SourceRef { Schema: "extension", Entity }`. Refused, named, nothing written: a design the compiler reports an error for, an unknown measure or column, a label that is a measure of the model or holds brackets or hidden characters, a page without a table, a measure longer than **8,000 characters** (the cap until D-P2), more than 4 SVG columns. The model is never touched. The answer lists `svgMeasures` with "experimental: tables only; card, matrix, image, phone and PDF need Desktop checks". "A new table" is not built: the column goes into a table the layout has | tests first (8 checks): the D-P1 shape in the files and the answer; only `data:image/svg+xml`; a hostile design (script text, bad colours, unknown layer) is escaped or refused; run-time escape of a column's value (DAX text and JS result); model names with quotes, angle brackets, `--` and `]`; the 8,000 cap; the refusals; validator 0 with two SVG columns. The website's SVG KPI suite (786 checks) passes untouched: CI. D-P1b added |
| R9.4 | The capability map | `mcp/plans/CAPABILITY-MAP.md`, plan only | every kind of change, with support today, files and schema, what it unlocks, risks, Desktop checks, effort; an order for rounds 10 to 14; the owner's decisions |

**Expected test count:** `npm test` 324 -> **340** (5 + 3 + 8). Engine build test: the staged list goes from 19 to 20
files (the SVG compiler ships in the package: a new file, so that expectation changes, with this cause).
Shared engines changed: `pbip-export.js`, `svg-kpi-compiler.js`: `.min.js` rebuilt, `?v=` bumped, `check:min`,
`csp.mjs` on the files as git stores them.

### Results (2026-10-04; nothing merged by the builder; terminal only)
- **Commits** (`fix/round-9`): `99b1dc4` the plan; `af104b8` the three items (tests, code, the skill, golden task 3,
  D14's step, D16, D-P1b, the `.min.js`); `438ca68` the capability map; then this record. dataarcus-engine
  `fix/round-9`: `d36d2c8` (the build's list with the SVG compiler, its test, version 0.2.5).
- **Tests:** `npm test` 324 -> **340 of 340** (as planned: 5 + 3 + 8). Run against the old code first: 340 checks, 13
  failing. The 3 that passed before the code are checks of things that must stay as they are (a measure with a
  separator gets no entry; a percent is untouched; two page filters with no "every Ramadan" note). Engine build test:
  9 of 9 (the list test failed first: 19 -> 20 files, eight -> nine engines, because the SVG compiler ships now).
  Locally: `scripts/test-svg-kpi.mjs` 786 of 786, the `pbip` suite 71 of 71. Website: CI (below).
- **CI on `112196f` (run 37208910785): mcp success (340); website success on the third attempt, all 17 suites.** The
  first attempt failed on two checks of pages this branch does not touch: "tools/power-bi-licensing-cost-calculator.html
  1440px: the Inter swap shifts the page 0.126 (want 0.1 or less)" (the check that failed once in rounds 7 and 8) and
  "articles/article-power-bi-report-styles.html 390px click #style-sales: top at -464px, hidden under bars ending at
  67px" (`anchors`); the second attempt failed on the first of them only; the third passed. Main `3af6657` has one
  failed and one passed run too. The suites of this round's engines (`pbip`, `svg-kpi`, `theme-generator`,
  `design-engine`) passed in every attempt.
- **Changed after the first run of the new tests, each in a test of this round, never an old one:** the two made-up
  fixtures got a month column and more text columns (see "Seen, not in scope": a report on a model with too few
  columns is written with a slicer or a line chart that has no field, and Microsoft's validator counts it; that is
  old behaviour, not this round's); the "page without a table" refusal is asked for with `secondPage: false`,
  because the focus design's second page has a table and the plan says the column goes to the first page that has
  one; the test file's own reads of `reportExtensions.json` were guarded so the old code fails a check instead of
  stopping the run.
- **R9.1, separators on cards:** as expected. A KPI card on a measure of `numberFormats` carries, as a second entry
  of `objects.value`, exactly D8's JSON: `labelDisplayUnits` `-1D`, `customFormatString` `'#,0'` (from `0`),
  `'#,0.00'` (from `0.00`), selector `{ metadata: "Sales.Total Sales" }`. No format at all: `'#,0.##'` (**not
  measured**: D16). A percent and a measure with a separator: no entry. The tooltip card, tables and tooltips: not
  touched. The answer: `numberFormats.cards.formatted` (field and format), a note that such a card shows the full
  number (101,914), not a scaled one (101.914K), and `tablesAndTooltips`: "needs a Desktop check (D8, tables)".
  Validator 0. The website's download is as before (no `cardFormat` there; its suites pass).
- **R9.2, "this Ramadan only":** the choice and why are in the plan above (a second page filter on the Hijri year,
  the year asked from the user; no Top N at page level, no stored selection, no measure). Built: the answer to a
  filter on a Ramadan flag alone says it keeps every Ramadan, names the Hijri-year column found in the model
  (Calendar[Hijri Year]) and says to ask the user; the tool's description and the skill say the same. Golden task 3
  with both filters: expected and actual in GOLDEN-TASKS.md: PASS at tool level (two filters on the page, none on
  the tooltip pages, 20 visuals, validator 0).
- **R9.3, SVG columns (experimental):** as expected. `svgColumns: [{ label, design, page? }]`, 4 at most. The shared
  compiler got `toMeasure`, the value kind `column` with the text format `text`, and the run-time escape (`&`, `<`,
  `>`, `'`, `"`, `%`, `#` through `SUBSTITUTE`, the same in the preview); a design without them compiles byte for
  byte as before (the website's 786 checks pass). The files are D-P1's: `definition/reportExtensions.json`
  (reportExtension 1.0.0, `extension`, the entity of the design's first measure, `Text`, `ImageUrl`), the measures as
  the last columns of the page's first table (in a right-to-left report: the first, at the left end; not measured).
  A hostile design is escaped (no script, no handler, a colour that is not `#rrggbb` becomes black) and an unknown
  layer refused; names with quotes, angle brackets, `--` and `]` are written as DAX names; over 8,000 characters:
  refused and named; validator 0 in English and Arabic. The answer: `svgMeasures` with the status text.
  **Not built: "a new table".** The column goes into a table the layout already has; a report with no table is
  refused with that reason.
- **R9.4:** `mcp/plans/CAPABILITY-MAP.md`: 13 capabilities and 7 smaller ones, each with today's support, files and
  schema, what it unlocks, risks, Desktop checks and effort; an order for rounds 10 to 14; 7 decisions.
- **Shared engines:** `pbip-export.js`, `svg-kpi-compiler.js`. `pbip-export.min.js?v=20261004e`,
  `theme-generator.min.js?v=20261004e`; the SVG KPI Designer's page loads its scripts with no `?v=` (nothing to
  bump). `check:min`: all 55 match. `scripts/csp.mjs`: "All 52 pages carry their current policy" (on `438ca68` as
  git stores it).
- **Package:** `dist/dataarcus-0.2.5.mcpb`, built from `fix/round-9` at `438ca68`, **4,039,272 bytes**, SHA-256
  `03239023b8eada1095e9c8a1714e506eadd1362f8aa113041a7ceb7f218b5157`, unsigned, not installed, 20 staged files, 91
  packages. The manifest's tool texts are unchanged (only inputs' descriptions changed); the version is 0.2.5.

**Seen, not in scope (round 9):**
- **A visual is written without its field when the model has too few columns:** a third slicer with no field on a
  model with two text columns, and a line chart with no field on a model with no month or date column. Microsoft's
  validator calls each `PBIR_QUERY_STATE_MISSING` (2 and 3 errors on two made-up models). Round 4 fixed this for KPI
  cards only. Old behaviour; it could change what Desktop shows (an empty slicer and an empty chart).
- The server's rule 3 still says a KPI card shows a measure "with no filter added"; with a page filter it is filtered.
- A formatted card stops scaling (101,914, not 101.914K): on a narrow card a long number may not fit. D16.
- The SVG picture's size in a table row is Desktop's default (`grid.imageHeight` is not written). D-P1b.
- A `column` value used for a size or a colour rule (not a text) is not checked for being a number: on a text column
  the measure would give an error in Desktop, not a wrong picture.
- The SVG KPI Designer's page loads its three scripts with no `?v=`: a returning visitor may keep an old compiler.

**Still open, not in this round:** the Desktop checks D1 to D16, D-P1b, D-P2 to D-P7 and D15 (the header), and the
agent-level re-run of the golden tasks (the next free laptop evening); the platform decisions (the owner, 10 October).

## Next step: round 8, a page filter, the taller header (plan only), the laptop paths (owner's go 2026-10-04; TERMINAL ONLY; branch `fix/round-8` from main `3564fe7`)
The owner's decisions (2026-10-04): golden task 3's page filter: yes, this round. The title 2.8 below the header's
middle in Segoe UI: leave it; a taller header box is a **plan only** here, with numbers, because Desktop can't be
used today. The laptop paths in the public `mcp/GOLDEN-TASKS.md`: trim. Report-side thousand separators: after D8,
not in this round. The platform plan: not touched (the owner reads it on 10 October).

**Before (main `3564fe7`):** `npm test` 317 of 317. Website: CI is the record (the laptop's full run times out
under load).

| # | Item | Change | Expected |
|---|---|---|---|
| 1 | A page filter | `create_report` gets `pageFilters`: `[{ field: "Table[Column]", values: [...] }]`. The field is a column of the model, checked like `fields` (unknown, or a measure: refused and named, nothing written). Values are typed by the column: boolean (`true` / `false`), text, whole or decimal number; where the files give the column no type (a DAX table's column), by the value given, and the answer says so. No DAX, no measures, no dates in this round. Written into every report page's `page.json` as `filterConfig.filters`, a `Categorical` filter with an `In` condition, as Microsoft's report-authoring reference gives it (`field` with `Entity`; `filter.Version 2`, `From` with an alias, `Where` with `SourceRef.Source`; `howCreated: "User"`; literals `true`, `'text'`, `5L`, `5D`). Not on the tooltip pages. The answer lists them (`pageFilters`) with a sentence for the user; the skill and the tool's description say when to pass one | tests first: Calendar[Is Ramadan] = true and a text column in `page.json`; an unknown column and a measure refused; a model without the column: a clear message; Microsoft's validator 0 on a report with filters; `pageFilters` in the answer. Golden task 3 at tool level with the filter: the check "the page is limited to Ramadan" met by the filter; 20 visuals as before (a filter is not a visual); validator 0 |
| 2 | The taller header | plan only: the table below, from `builder-scripts\r8-header.mjs` | the owner decides; D15 measures first |
| 3 | The laptop paths | `C:\DataArcus\...` in the public files becomes a neutral name ("the repo folder", `<tests folder>`, `<working folder>`); every `git grep -n -F 'C:\'` hit listed in the report, fixed or not | 37 hits before; after: only the generic examples (`C:\Users\<name>\...`, `C:\Other`) and one comment about Windows' path limit |

**Expected test count:** `npm test` 317 -> 324 (item 1: 7 checks). The shared engine `pbip-export.js` changes
(the page filters are written there): `.min.js` rebuilt, `?v=` bumped, `check:min`, `csp.mjs` on the files as git
stores them (the laptop's checkout has CRLF, where that script can't be trusted).

### Item 2: the header that centres the title (computed, nothing built)
What the measurements say (DESKTOP-TESTS.md, round 1): a text box is top-aligned; the middle of its text is
3 + 1.19 x pt below the box's top in Segoe UI and 1.12 x pt in Tahoma; a one-line box needs 10 + 1.8 x pt. The title's
size is 0.42 of its box, so in Segoe UI its middle is always about 3 below the box's middle **whatever the height**:
a taller header alone changes nothing if the title grows with it. So the proposal is: **keep today's title size and
make the header as tall as that text needs to sit in the middle** (Segoe UI: slot = 2 x (3 + 1.19 x pt); Tahoma, where
the text sits above the middle and the box must move down: slot = 2 x (10 + 1.8 x pt - 1.12 x pt)). The logo image is
centred at any height (measured); the page buttons centre their own text; "Your logo" has room to move.

| Page | Language, font | Title | Header today (title slot) | Proposed header (slot) | Title offset today -> after (+ is lower) | Body height lost | KPI card | Line chart | Table | Size and phone problems |
|---|---|---|---|---|---|---|---|---|---|---|
| 1920 x 1080 | English, Segoe UI | 20pt | 84 (48) | 90 (54) | +2.8 -> -0.2 | 6 | 144 -> 144 | 440 -> 437 | 331 -> 328 | 0 -> 0 |
| 1920 x 1080 | Arabic, Tahoma | 20pt | 84 (48) | 84 (48) | +0.4 -> +0.4 | 0 | 144 -> 144 | 440 -> 440 | 331 -> 331 | 0 -> 0 |
| 1280 x 720 | English, Segoe UI | 12pt | 56 (32) | 59 (35) | +1.3 -> -0.2 | 3 | 96 -> 96 | 293 -> 291 | 221 -> 220 | 0 -> 0 |
| 1280 x 720 | Arabic, Tahoma | 12pt | 56 (32) | 62 (38) | -2.6 -> +0.4 | 6 | 96 -> 96 | 293 -> 290 | 221 -> 218 | 0 -> 0 |
| 960 x 720 | English, Segoe UI | 12pt | 56 (32) | 59 (35) | +1.3 -> -0.2 | 3 | 96 -> 96 | 293 -> 291 | 221 -> 220 | 0 -> 0 |
| 960 x 720 | Arabic, Tahoma | 12pt | 56 (32) | 62 (38) | -2.6 -> +0.4 | 6 | 96 -> 96 | 293 -> 290 | 221 -> 218 | 0 -> 0 |
| 640 x 360 | English, Segoe UI | 8pt | 37 (25) | 37 (25): no change, it is in the middle today | 0 -> 0 | 0 | 48 -> 48 | 142 -> 142 | 106 -> 106 | 0 -> 0 |
| 640 x 360 | Arabic, Tahoma | 8pt | 37 (25) | 45 (33) | -3.5 -> +0.5 | 8 | 48 -> 48 | 142 -> 137 | 106 -> 103 | 0 -> 0 |

All numbers are page units (pixels of the page). "Offset" is the title text's middle against its slot's middle,
computed with the measured rule. The body numbers are the exec layout with 4 cards and no filter rail, written by the
engine with the proposed header height (its `hh` setting: 56 -> 60 on 1080 English; 56 -> 59 and 62 on 720; 74 -> 90
on 640 x 360 Arabic). **What the body loses:** at most 6 on 1080 and 720 and 8 on 640 x 360; the KPI cards keep
their height, the charts and the table lose 1 to 5; no measured minimum is crossed (0 size and phone problems before
and after; the checks of `report-check.mjs`).
**What is not known without Desktop (D15):** that the title's ink really lands in the middle at the new heights
(the rule was measured at 20 to 47pt on a 2160 page: 8pt and 12pt are extrapolated); whether the header looks too
tall on 640 x 360 Arabic (45 of 360); the 640 x 360 chart that loses 5 of 142.
**Choices for the owner:** (a) the taller header as in the table, the title's size unchanged; (b) the same only for
English (Segoe UI), where the title sits low, leaving Arabic as it is except 640 x 360 and 720; (c) leave everything.
One header height per page size for both languages is also possible (the larger of the two: 90, 62, 62, 45), at the
cost of the Arabic 1080 title sitting about 3 high.

### Results (2026-10-04; nothing merged by the builder; terminal only)
- **Commits** (`fix/round-8`): `9cc15bd` the plan; `deede58` the page filter (tests, code, the skill, golden task
  3, the `.min.js`); `e36200b` the paths, D14 and D15; then this record. dataarcus-engine `fix/round-8`: `56d1def`
  (the manifest's `create_report` text, its test, version 0.2.4).
- **Tests:** `npm test` 317 -> **324 of 324** (as planned: 7 new checks, all 7 failed on the old code: run before
  the code, 324 checks with 7 failures). Engine build test 8 -> 9 (the new one is false on the old manifest).
  `pbip` suite locally: 71 of 71. **CI on `e36200b` (run 37203120928): mcp success (324), website success, all 17
  suites.** CI on the plan's commit `9cc15bd` (text only): mcp success, website failed on the one check that failed
  once in round 7 too ("tools/power-bi-licensing-cost-calculator.html 1440px: the Inter swap shifts the page 0.126
  (want 0.1 or less)"), on a page this branch does not touch; it passed on the next commit.
- **Item 1, the page filter:** as expected. `create_report` takes `pageFilters` (`[{ field, values }]`, 8 at most,
  50 values each). In `page.json` of every report page (not the tooltip pages): `filterConfig.filters`, one
  `Categorical` filter per field with an `In` condition, in the shape of Microsoft's report-authoring reference
  (their plugin 0.3.18, `references/authoring/filters.md` and `expressions.md`; literals as their CLI encodes them:
  `true`, `'text'`, `2025L`, `5.5D`; a `'` in a text is doubled, which their encoder does not do: D14 checks it).
  Refused, named, nothing written: an unknown table or column, a measure, a date column, a fixed-decimal column,
  a value of the wrong type, a field given twice. A column the files give no type (a DAX table's, like the Ramadan
  model's Calendar[Is Ramadan]) is typed by the value given, and the answer says so (`typedBy`). The answer lists
  the filters (`pageFilters`) and `reportNotes` says in words what the pages are limited to and that the Filters
  pane changes or clears it. Microsoft's validator: 0 errors on both test reports. The tool's description and the
  skill say when to pass one. **One thing changed against my first code, not against a test:** the test gives six
  filters in one call and my first limit was five; the limit was mine and not in the plan, so the limit went to 8.
- **Golden task 3 with the filter:** expected and actual in `mcp/GOLDEN-TASKS.md` ("Task 3 with a page filter"):
  PASS at tool level; one page with the filter, two tooltip pages without, 20 visuals, validator 0.
- **Item 2, the taller header:** the table above, nothing built. The script: `builder-scripts\r8-header.mjs`.
  One line differs from the script's print: 640 x 360 English, where the script's rounding up gives 38 (26) and
  moves a title that is in the middle today by 0.5; the table says "no change".
- **Item 3, the paths:** 37 lines before in 10 files. **31 changed** (`mcp/GOLDEN-TASKS.md` 9, `mcp/WORK.md` 11,
  `scripts/tests/DESKTOP-TESTS.md` 6, `mcp/README.md` 2 lines, `mcp/PHASE2-SPEC.md` 2, `mcp/ROADMAP.md` 1). **Not changed, 6 lines of the 37, and why:** `mcp/PRIVACY.md`
  37 and 62 (made-up examples of a path, no laptop folder); `scripts/tests/pbip.mjs` 110 (a comment about Windows'
  path limit, with `<name>`); `CLAUDE.md` 21, `mcp/CLAUDE.md` 15 and 60 (**the builder's own rules**: "work only
  inside ...", where the repo and the scripts are; a neutral name there would lose the rule's meaning, and the root
  file is outside `mcp/` and `scripts/tests/`: the reviewer's call). New since: this section's plan line names what
  is searched for. **Expected differed here:** the plan said only the generic examples and the comment would stay;
  the three rule lines stay too. Folder names without the drive (`tests\phase2-try\...`, `builder-scripts\...`)
  were left: they hold no personal path and the session memory needs them.
- **Shared engine:** `assets/js/pbip-export.js` (page filters; a report without them is written byte for byte as
  before: every website suite passes untouched). `pbip-export.min.js?v=20261004d`,
  `theme-generator.min.js?v=20261004d` (both Theme Generator pages). `check:min`: all 55 match. `scripts/csp.mjs`:
  "All 52 pages carry their current policy", on the commit's files as git stores them (LF).
- **Package:** `dist/dataarcus-0.2.4.mcpb`, built from `fix/round-8` at `e36200b`, **4,023,641 bytes**, SHA-256
  `541cc7a4306725e7a1a66a83f0dbe6b7bc878b578a11145cb7c5742df235e427`, unsigned, not installed, 19 staged files, 91
  packages.

**Still open, not in this round:** the Desktop checks D1 to D15 and the agent-level re-run of the 11 golden tasks on
0.2.4 (the next free laptop evening); report-side thousand separators after D8; the platform plan (the owner reads
it on 10 October); the owner's choice on the header (a, b or c above) after D15.

## Next step: round 7, four small fixes from the night audit and the manifest text (owner's go 2026-10-04; TERMINAL ONLY; branch `fix/round-7-audit` from main `ed13112`; dataarcus-engine: the same branch name, the packaging only)
Beta prep works in parallel on `fix/audit-site-2`: its files (among them `scripts/tests/model-health.mjs`,
`tools.mjs`, `site.mjs`, `assets/js/model-health.js`, `model-health-worker.js`, the tool pages) are left alone. New
checks go in `mcp/test.mjs`. A `?v=` bump in a file that branch also touches is named in the report.

**Before (main `ed13112`):** `npm test` 306 of 306; website 17 suites; `read_model` on the 300-table golden model
10,380 characters on Windows (10,379 on Linux: see item 4).

| # | Item | Change | Expected |
|---|---|---|---|
| 1 | AUD-015 | `model-health-engine.js`, the key-like rule of SUMMARIZE_KEYS: also a lower-case letter directly followed by `ID`, `Id`, `Key`, `Code` or `No` at the end of the name (the capital matters) | flagged when summed: OrderID, CustomerKey, ProductKey, ProductCode, InvoiceNo; not flagged: Paid, Monkey, Barcode, Casino, Turkey; every existing case as before; the website's sample numbers unchanged (if one changes: listed, old -> new and the column, before any expectation is touched) |
| 2 | AUD-016 | `mcp/lib/scope.mjs`: the summary lists the 100 tables with the most measures; the rest are counted (by area, and "other tables"); the other tables' names and each area's table list are cut to what fits; the answer says how to reach the rest (`focus`, `tables`) | generated models with 500 and 3,000 tables with measures: under 40,000 characters; says how many were left out; `tables` and `focus` still reach a table left out. The 300-table model: 10,380 before; after: the same if nothing of it is cut (65 tables with measures) |
| 3 | AUD-017 | `pbip-export.js`: format characters (`\p{Cf}`) are taken out of the report name before anything else. MCP answers: a table, column or measure whose name has such a character is listed under `hiddenCharacters` with the code points escaped (`‮`); the model is never renamed | "Report‮xbp.exe" -> a file name without U+202E; an Arabic name with the Arabic comma and an emoji name unchanged; the note for a measure named with U+202E; no note on a normal model; the website's exports byte-identical for normal names (its suites) |
| 4 | AUD-008 | First: what round 6 already re-recorded. Then only what is still stale, each changed number with its cause in `mcp/GOLDEN-TASKS.md`; task 11 added to the runner | tasks 2 and 6: +2 visuals from round 2's page buttons (an Arabic report has one button per page instead of one navigator); task 10: -1 character on Linux (the path separator in `source`); nothing unexplained |
| 5 | Manifest | dataarcus-engine `packaging/manifest.json`: `create_report`'s one-sentence text says the report is bound to the fields the approved plan gives, checked against the model; `plugin.json` only if it carries the text | the build test passes |
| 6 | Package 0.2.3 | `packaging/build.mjs` after the tests pass; not installed, not signed | name, bytes, SHA-256 |

**Expected test counts:** `npm test` 306 -> 317 (item 1: 3 checks; item 2: 4; item 3: 4). Website: 17 suites, the
same checks (6,854 on this laptop in round 6), unless a sample model really has a CamelCase key that sums.

**Still open, not in this round:** the Desktop checks D1 to D13 and the agent-level re-run of the 11 golden tasks on
0.2.2 / 0.2.3 (next free laptop evening); the four round 6 decisions (the title at 18pt, report-side separators after
D8, task 3's page filter, the platform plan's v1 and a public schema).

### Results (2026-10-04; nothing merged by the builder; terminal only)
- **Commits** (`fix/round-7-audit`): `5764417` the plan; `1c889d6` AUD-015 (with the tests of items 1 to 3); `eeab72c`
  AUD-016; `88f8dcc` AUD-017; `0bd9004` AUD-008; `3b02571` PRIVACY.md; `7e55c57` main (`536b60a`, Beta prep's audit
  batch 2) merged in; then this record. dataarcus-engine `fix/round-7-audit`: the manifest's `create_report` text,
  its test, version 0.2.3.
- **Tests:** `npm test` 306 -> **317 of 317** (as planned: 3 + 4 + 4 new checks; seven of them failed before the
  fixes), also on the merged branch. Engine build test 7 -> 8. **CI on the merge commit `7e55c57`
  (run 37199728340): mcp success, website success** on the second attempt. The first attempt failed on one check
  that is not this round's: `site`, "tools/power-bi-licensing-cost-calculator.html 1440px: the Inter swap shifts the
  page 0.126 (want 0.1 or less)", a check that came with Beta prep's batch, on a page this branch does not differ
  from main in; the same job passed when run again. CI on `3b02571`, before the merge: website and mcp success.
- **Not test results: the local website runs on this laptop.** While the owner was working on it, a full local run
  produced nothing in 30 minutes and was stopped; a second took 48 minutes (the `site` suite alone 46) and three
  suites crashed on timeouts (`anchors`, `theme-generator`, `design-engine`); those three passed when run alone.
  Laptop load, not failures of the code: CI is the record. After the merge only `model-health` (57), `tools` (297)
  and `tmdl-model` (70) were run locally: all passed.
- **Item 1, AUD-015:** as expected. OrderID, CustomerKey, ProductKey, ProductCode, InvoiceNo (and OrderId) are
  flagged when they sum; Paid, Monkey, Barcode, Casino, Turkey are not; the names the rule knew are still flagged.
  The website's sample numbers did not change (its suites pass with their expectations untouched).
- **Item 2, AUD-016:** as expected. The audit's models: 500 tables with measures 46,996 -> 12,741 characters; 3,000
  tables 281,008 -> 13,056. The 300-table golden model: **10,380 before, 10,380 after** (nothing of it is cut).
  The summary lists the 100 tables with the most measures and counts the rest by area (`notListed`); an area names at
  most 15 of its tables; `tables` and `focus` reach a table that is not listed. The same cut applies to the areas in
  the "needs a focus" answer of `suggest_fields`.
- **Item 3, AUD-017:** as expected. "Report" + U+202E + "xcod.exe" gives `Reportxcod.exe.pbip`; the Arabic name with
  the Arabic comma, the emoji name and the accented name are unchanged; `hiddenCharacters` lists `Sales[Total‮Sales]`
  and `Sales[Zero​Width]` in `read_model`, `suggest_fields`, `check_model_health` (and `create_report`); no note
  on a normal model; the model is not renamed.
- **Item 4, AUD-008:** round 6 had re-recorded the numbers but not their causes. Every number that differs from the
  first baseline is now in `mcp/GOLDEN-TASKS.md` with a cause counted from the files; the runner runs 11 tasks and
  counts characters the same on Windows and Linux (`read_model` on the large model: 10,379 in the runner, the audit's
  Linux number). Nothing unexplained.
- **Item 5:** the manifest's text: "Writes a new Power BI report (PBIR) next to the model under a free name, bound to
  the fields the approved plan gives (checked against the model), never touching the model or an existing report."
  `plugin.json` carries no tool text, so nothing to mirror.
- **Item 6, package:** `dist/dataarcus-0.2.3.mcpb`, built from the merged branch `7e55c57`, **4,021,373 bytes**,
  SHA-256 `2b6e073debb05455826ee4e71207b6677d4eba82b643decb4dca23f53729c00f`, unsigned, not installed, 19 staged
  files, 91 packages. (0.2.2 was 3,333,472 bytes: main has moved to zod 4 since.)
- **The merge:** one real conflict, `assets/js/model-health-worker.js` (main added the TMDL reader to its
  `importScripts`; this branch had bumped the engine's stamp on the same line): main's line with the newer stamp
  `20261004c`; its `.min.js` taken from main and rebuilt. `check:min`: all match. `scripts/csp.mjs`: "All 52 pages
  carry their current policy", **checked on the merge commit's files as git stores them (LF)**. On this laptop's
  checkout (CRLF) the same script reports all 52 pages as out of date, on main too: it compares the text with line
  endings, so it can't be trusted here, and `--write` was not run.
- **Files this round shares with Beta prep's branch:** `assets/js/model-health-worker.js` and its `.min.js`,
  `tools/power-bi-model-health-check.html` (the engine's `?v=`), `tools/power-bi-theme-generator.html` and
  `-lab.html` (`theme-generator.min.js?v=20261004c`).

## Round 6 in progress: fields, thousand separators, the header logo, the platform plan (owner's go 2026-10-04; TERMINAL ONLY: no mouse, keyboard, UI Automation, Power BI Desktop, Claude Desktop or screenshots; branch `fix/round-6-fields`, from main `4d86788`)
Owner's decisions: an identical fix-script file is named again, never copied (round 5 as built); anything that
changes what Desktop shows is built and tested from the files now and its Desktop check is listed for the next free
evening (a rule that needs a measurement we don't have is built only on the values already measured, and what must
be measured is listed); the agent-level re-run waits for a free laptop. Tests first for every code change.

**Before (main `4d86788`):** `npm test` 257 of 257. Golden tasks: tool level 10 of 10 run (task 3 FAIL by its
checks: no field input); agent level 6 of 11.

### Plan and expected results (written before any code)
| # | Item | Change | Expected |
|---|---|---|---|
| 1 | `fields` for `create_report` | An input `fields`: `kpis` (measures, in card order), `measure` (the charts' value), `timeAxis` (line chart), `category` (bar, donut, funnel, treemap), `category2` (column, map), `table` (columns in order), `slicers` (up to 3), each as `Table[Field]`. Every name is checked against the model (a measure where a measure is needed, a column where a column is); an unknown or wrong-kind name refuses the call and nothing is written. What is given is bound as given, nothing re-picked; what is left out is picked as before. The KPI row has as many cards as `fields.kpis`. The answer gets `boundFields`: per visual of each page, the fields bound | tests: the Ramadan model with kpis Total Sales, Total Sales Last Ramadan, Total Sales vs Last Ramadan % -> those three cards, "(old)" nowhere; a wrong name refused; `boundFields` equals what the files hold; without `fields` every existing answer and file as before |
| 2 | Texts | `create_report`'s description, the server's instructions and the skill: pass the approved plan's fields in `fields` | tests on the three texts |
| 3 | No measures | `suggest_fields` on a model without measures says so and says to propose measures with format strings (examples of formats) | test on Plain Orders |
| 4 | Picker | A measure whose name has the word old, test, unused, backup or temp (also "(old)") is picked for a card or a chart only when no other measure is left; the answer names the ones skipped (`skipped`). Shared engine `pbip-bind.js`: the website's picker gets the same rule | Ramadan model, 3 and 4 cards: Total Sales, Last Ramadan, vs Last Ramadan % (was "(old)" third); Health Test: "Unused One" not on a card. Expected numbers that change are listed below |
| 5a | `read_model` by name | A path that doesn't exist, without a slash: the one project in the working folder whose model folder, `.pbip` or folder is named so (any case; with or without `.SemanticModel` / `.pbip`); none or several: the error names what is there | "Ramadan Test", "ramadan test.pbip" find the model |
| 5b | Unknown design keys | `create_report` and `plan_layout` name the keys of a design (top level and `layout`) they don't know, in `ignored` | a design with `fields` and `layout.foo` -> both named |
| 5c | Long names | A report name over 30 characters is cut at the last space before the limit (shared engine `pbip-export.js`) | "التقرير التنفيذي للمبيعات - الأسماء الأصلية" -> "التقرير التنفيذي للمبيعات -" trimmed to "التقرير التنفيذي للمبيعات"; a 40-letter single word still cut at 30 |
| 6 | Thousand separators | (a) `check_model_health` gets `fixes.THOUSANDS` (not a finding, not in the score): measures and summed number columns whose format string is a number format without a thousand separator, or columns with none, with a fix script that adds it ("0" -> "#,0", "0.00" -> "#,0.00"); (b) `create_report` answers `numberFormats`: the fields the report shows as numbers that have no separator in the model, with where the fix is; (c) a test that every format the health check suggests, and every format in the website's sample model, has a separator; (d) written down per visual type: where the format comes from. No visual-level or element-level format string is written into reports: none has been measured in Desktop | tests for a, b, c; the Desktop list says what to measure before a report-side format is built |
| 7 | The header logo | Tests first on the computed positions (logo box centre against the header band or panel, every page size, EN and AR, square, wide, tall, placeholder text, solid and transparent); the cause is what those tests show. Known from the measurements: Segoe UI's text middle is 3 + 1.19 x pt below the box top, the code places text by 1.2 x pt, so Segoe UI text sits about 3 low | the fix follows the failing tests, on measured values only |
| 8 | Platform plan | `mcp/plans/DESIGN-ENGINE-PLATFORM.md`, no code | |
| 9 | Golden tasks, tool level, with `fields` as the plan would give them | `mcp/GOLDEN-TASKS.md`, "Tool level, round 6" | task 3's cards as planned (the Ramadan filter still missing) |
| 10 | Package 0.2.2 | built with the build script, not installed | size, SHA-256 |
| 11 | Desktop check, next free evening | a list here, with expected results | |

### Results (2026-10-04; nothing merged; no Desktop, no Claude Desktop, no mouse or keyboard in this round)
- **Commits** (`fix/round-6-fields`): `54478ac` the plan; `67ee115` items 1 to 5 (one commit: they share
  `mcp/server.mjs` and the tests); `7bb9a10` item 6; `492a98a` item 7; then items 8 and 9 (the platform plan, the
  golden baseline with fields) and the records. dataarcus-engine: the 0.2.2 version only.
- **Tests:** `npm test` 257 -> **306 of 306**. The new tests were written before the code; those of items 1 to 6
  were first run after it (they passed at once), item 7's was run before and failed as expected. Website suites
  (`node scripts/tests/run-all.mjs`): **17 of 17** (6,854 checks); `check:min`: all 54 `.min.js` files match their
  sources. The first website run failed in 14 suites for a reason outside this round: the laptop's root
  `node_modules` still had Bootstrap 5.3.3, the tests serve the CDN files from there, and the pages on main ask for
  5.3.8 with an integrity hash; after `npm ci` in the repo root the run passed.
- **Package:** `dist/dataarcus-0.2.2.mcpb` built from `add8c21` with the build script, **not installed**: 3,333,472
  bytes, SHA-256 `5f6ae635634b25983dbd4f12d205251acb044d1a36e5cdc390f3404dceea87c7`, unsigned, 19 staged files, 91
  packages.
- **Expectations that changed (old -> new, why):** no expected number in a test changed. (1) The header check in
  `scripts/tests/report-check.mjs` places a text's middle by the font's own measured number (Segoe UI 3 + 1.19 x pt,
  Tahoma 1.12 x pt) instead of 1.2 x pt for every font: the same Desktop measurement, now used as measured.
  (2) The picker's answer on the Ramadan model, 3 cards: third card "Total Sales Last Ramadan (old)" -> "Total Sales
  vs Last Ramadan %" (the rule of item 4); no test held the old value, the golden tasks' text did. (3) The golden
  baseline script passes `fields` (see `mcp/GOLDEN-TASKS.md`, "Tool level, round 6"). (4) `check_model_health` on the
  large model: 15,383 -> 18,271 characters (the thousand-separator list; the cap of 40,000 holds).
- **Item 1, `fields`:** `kpis`, `measure`, `timeAxis`, `category`, `category2`, `table`, `slicers`, each
  `Table[Field]`; checked against the whole model; a wrong or unknown name refuses the call, naming every problem,
  and nothing is written; given slicers come first and a slot left over keeps the picker's (a slicer is never
  written without a field). The answer's `boundFields` lists each page's visuals with their fields.
- **Item 5:** `read_model` (and every tool that takes a model path) finds a model by its plain name, with or
  without `.pbip` / `.SemanticModel`, any letter case; a `.pbip` file is the project, not a model (before: "no
  tables"); two models of one name are refused, naming both. Unknown design keys are named in `ignored`
  (`plan_layout`, `create_report`). A report name over 30 characters ends at a whole word, and `reportNotes` says
  it was shortened.
- **Item 6, thousand separators. Where they now apply:** every format the health check suggests for a measure
  without one (`#,0`, `#,0.00`; `0.0%` for a percentage) and its fix script; the website's sample model (every
  measure and summed column: `#,0` or a percentage); new: `fixes.THOUSANDS` in `check_model_health` (measures and
  summed number columns whose format has no separator, or columns with no format, with a script; not a finding,
  not scored; never an identifier, a year or a date part) and `numberFormats` in `create_report` (the measures and
  table columns the report shows that have no separator format in the model). **What remains model-side:** a
  table cell, a tooltip and a card or label with display units off take the number's format from the model, so a
  model without formats still shows 13857 until the user applies the script; DataArcus writes no visual-level or
  element-level format string, because none has been measured in Desktop.
  **Where a number's format comes from** (Microsoft's "Use custom format strings in Power BI Desktop" and the
  formatting catalogue of their report authoring CLI 0.4.0):
  | Visual | What decides the number | In visual.json |
  |---|---|---|
  | Table, matrix cell | the model's format string; a visual-level format string (Format > General > Data format) overrides it | `columnFormatting` (`labelDisplayUnits` per column); the visual-level format string's own JSON: to be read from a file Desktop saves |
  | Card (new card) value | display units, Auto by default: 101.914K whatever the format; with units None, the model's format, or an element-level "Format code" | `value.labelDisplayUnits` (1 = none), `value.labelPrecision`, `value.customFormatString` (selector `default`) |
  | Chart value axis | display units (Auto: 20K, 0.4M) | `valueAxis.labelDisplayUnits` |
  | Chart data labels | display units (Auto), or a format code | `labels.labelDisplayUnits`, `labels.valueCustomFormatString` |
  | Default tooltip | the model's format, the whole value | none |
  | Report page tooltip (ours) | its own card and bar chart, as above | as above |
  | Slicer, gauge | the model's format; the gauge's callout has display units | |
  Visual-level format strings use .NET tokens, model and element level VBA tokens (the same for `#,0`).
- **Item 7, the header logo. Cause:** the header's text boxes were placed with one rule for every font (the text's
  middle 1.2 x pt below the box's top), but the measured middles are 3 + 1.19 x pt in Segoe UI and 1.12 x pt in
  Tahoma. So the "Your logo" text sat 2.5 to 2.9 below the header's middle in an English report (it "drifted
  downwards") and 0.8 to 2.5 above it in an Arabic one. **A logo image was never off:** its box is exactly in the
  middle of the header in all 60 cases computed (5 page sizes, English and Arabic, wide, square and tall, solid and
  transparent designs). **Fix:** the text is placed with its font's measured number (`textMid` in
  `pbip-export.js`); a font not measured keeps 1.2 x pt. Positions of the "Your logo" box, before -> after (y,
  height; distance of the text's middle from the header's middle, + is lower):
  | Page | English (Segoe UI) | Arabic (Tahoma) |
  |---|---|---|
  | 1920 x 1080 | 25, 41 (+2.7) -> 22, 44 (-0.3) | 25, 41 (-1.3) -> 26, 40 (-0.3) |
  | 1280 x 720 and 960 x 720 | 16, 28 (+2.9) -> 13, 31 (-0.1) | 16, 28 (-0.8): unchanged |
  | 3840 x 2160 | 49, 83 (+2.5) -> 46, 86 (-0.5) | 49, 83 (-2.5) -> 52, 80 (+0.5) |
  | 640 x 360 | 6, 25 (0): unchanged | 6, 25 (-3.5): unchanged, the box is as short as its text allows |
  **Not fixed, for the owner:** the title in Segoe UI is 2.8 below the middle on 1920 x 1080 (1.3 on 720, 2.6 on
  2160): its box is already at the top of its slot and can't move up. Two ways: a title at 0.37 of its box instead
  of 0.42 (18pt instead of 20pt on 1080), or leave it. The Arabic title moved from -1.6 to +0.4 on 1080.
  Script: `builder-scripts\r6-logo.mjs` prints all 80 cases.
- **Item 8:** `mcp/plans/DESIGN-ENGINE-PLATFORM.md`.
- **Item 9:** `mcp/GOLDEN-TASKS.md`, "Tool level, round 6": 11 of 11 at tool level (task 3 with a limit).

### Desktop check, next free evening (expected results written 2026-10-04, before any look)
Made-up models only (`tests/5-tmdl-sample` with data; a copy for anything a script changes). Close without saving.
| # | Check | How | Expected |
|---|---|---|---|
| D1 | The "Your logo" text, English | a report built from this branch through the MCP and the website download, Segoe UI, 1920 x 1080, 1280 x 720, 3840 x 2160, light and dark | the text's ink is in the middle of the header's height, within 1; level with the page buttons' text |
| D2 | The same, Arabic (Tahoma) | 1080, 720, 2160 | "شعارك" in the middle within 1 on 1080 and 2160; about 1 high on 720; 3.5 high on 640 x 360 (known: the box can't move) |
| D3 | The title in Segoe UI | the same reports | 2.8 below the middle on 1080, as computed; the owner decides (smaller title, or leave) |
| D4 | A real logo: wide, square, tall | `scripts/tests/fixtures/logos`, English and Arabic, 1080 and 720, solid and transparent | in the middle of the header, undistorted, as measured on 2026-10-01 |
| D5 | No scroll thumb beside "Your logo" | the new box heights: 44 (1080), 31 (720) | no thumb; on 640 x 360 English the thumb of 2026-10-04 is still there (open item, small-page round) |
| D6 | The thousand-separator script | `check_model_health` on a made-up model whose measures have "0" and "0.00" and a summed column without a format; paste "... - fix thousand separators.tmdl" in TMDL view, Preview, Apply | accepted (Problems 0); the table shows 13,857 and 13,857.00; each measure and column keeps its lineage tag |
| D7 | Where the format comes from | on that model before the script: a table, the default tooltip, a card with display units None, a card on Auto, a chart's data labels with units None | 13857 in the table, the tooltip and the None card and labels; 13.86K on the Auto card: the table of item 6 confirmed or corrected |
| D8 | What a report-side format would be (measure before building) | in Desktop set Format > General > Data format on a table column and a format code on a card's value with units None; save; read the PBIR Desktop wrote | the JSON of a visual-level format string and of `value.customFormatString`, and whether a model without formats then shows 13,857: the facts needed to decide a report-side separator **2026-10-04, half done:** on a card, Display units Custom with the format code `#,0` shows 101,914 on a model with no format; Desktop writes `labelDisplayUnits: -1D` and `customFormatString: '#,0'` in `objects.value` with the selector `{ "metadata": "Sales.Total Sales" }`. **The table column (Format > General > Data format) is not run.** Record: DESKTOP-TESTS.md, 2026-10-04 sitting **2026-10-04 (third sitting), the table half done:** Format > Properties > Data format > Custom `#,0` on a table column writes `"format": "#,0"` on the column`s projection (nothing in `objects`), and the table shows 13,857 on a model with no format. The tooltip page`s card takes D8`s card entry (101,914); a bar chart`s scaled labels do not change with `format`. Record: DESKTOP-TESTS.md, third sitting |
| D9 | A report built with `fields` | golden task 3's call (three Ramadan cards, slicers Hijri Year and Is Ramadan) on `5-tmdl-sample` | opens; cards 101.914K, 74.675K, 0.34; with Is Ramadan TRUE and Hijri year 1447 the cards change; the table and charts as planned |
| D10 | A shortened name | "التقرير التنفيذي للمبيعات - الأسماء الأصلية" | the report opens as "التقرير التنفيذي للمبيعات" |
| D11 | 960 x 720 with three cards | golden task 4's 4:3 report | card titles whole (they were cut with four cards) |
| D12 | The website's picker | the Theme Generator's project download on our own model (the Ramadan sample) | the third KPI is "Total Sales vs Last Ramadan %", not "(old)" |
| D13 | Agent level | install `dataarcus-0.2.2.mcpb`, the 11 golden tasks and the hostile-model test in incognito chats | the plans' fields are what the reports show (`boundFields`); before: 6 of 11 |
| D14 | The page filter (round 8) | golden task 3's report on the Ramadan sample with data, built with `pageFilters: [{ field: "Calendar[Is Ramadan]", values: [true] }]`; open it, open the Filters pane; then clear the filter; then a text filter with an apostrophe in a value and a decimal-number filter (the literals `'Ha''il'` and `5.5D` are written as Microsoft's reference gives them, not yet seen in Desktop) | the Filters pane shows "Is Ramadan is True" under "Filters on this page", with no error mark; the cards show Ramadan only (with one Hijri year picked in the slicer: this Ramadan only) and equal DAX with the same filter; clearing the filter brings the unfiltered totals back; the tooltip pages have no filter; the text and decimal filters select their rows **2026-10-04, PASS on what was run:** the Filters pane shows "Is Ramadan is True" under "Filters on this page"; Total Sales 99.9K with the filter, 101.914K in the same report written without it; the other two cards 74.675K and 0.34 in both; the tooltip pages unchanged; cleared with the eraser in the pane: "Is Ramadan is (All)" and 101.914K. **Not run:** the text filter with an apostrophe, the decimal filter **Added in round 9 ("this Ramadan only"):** build task 3 with the two filters, Is Ramadan = true and Hijri Year = the latest Hijri year the Hijri Year slicer lists; expected: the pane shows both filters with no error mark, the chart shows that one Ramadan's months only, the three cards show one Ramadan (write the values down), and clearing the year filter brings 99.9K back. Also write down whether the sample's Hijri Year is a number (the filter is written `1447L`) or a text |
| D15 | The taller header (round 8, plan only) | **before any code:** by hand-edited copies of one report, set the header to the proposed heights on 2 sizes x 2 languages (1920 x 1080 and 1280 x 720; English Segoe UI and Arabic Tahoma), the title's size unchanged, and measure the title's ink against the header's middle as in round 1 | the title's middle within 1 of the header's middle (computed: -0.2 English, +0.4 Arabic); the logo and the page buttons still centred; nothing in the body cut. The owner decides from the table in round 8's plan and these numbers |
| D-P1 | An SVG measure that lives in the report (dataarcus-engine `research/ENGINE-POSSIBILITIES.md`, section 5) | a report-level measure in `definition/reportExtensions.json` returning a `data:image/svg+xml;utf8,` text, `dataCategory: ImageUrl`, in a table column and on the new card's image | **2026-10-04, half done:** the table column draws the picture in every row and the total; validator 0; the model untouched. **Not run:** the new card's image, a matrix, an image visual. Record: DESKTOP-TESTS.md, 2026-10-04 sitting **2026-10-04 (third sitting):** the new card`s image (hand-written `image.imageType: imageUrl` + `imageUrl` = the measure, selector default) and a matrix both draw the report-level SVG measure; D-P2: no limit found up to 2,000,000 characters in a table; D-P3: Arabic text is shaped and right to left in Segoe UI and Tahoma. Not run: the image visual, "Select from data" by mouse. Record: DESKTOP-TESTS.md, third sitting |
| D16 | Thousand separators on cards (round 9, R9.1) | a report from `create_report` on a made-up model with data whose measures have the formats `0` and `0.00` and one with no format (and the Ramadan sample: Total Sales has no format); open it | the cards show the full number with the separator: **101,914** (`0` -> `#,0`), **101,914.00** (`0.00` -> `#,0.00`), and the no-format measure 101,914 with `#,0.##` (a measure with decimals keeps them: not measured before); a percent card and a card whose measure has a separator are as before; the card's Format pane shows Display units Custom and the code; the phone layout and the tooltip card are unchanged **2026-10-04 (second sitting), half done:** on the Ramadan sample (measures with no format, `#,0.##`) the cards show **101,914** and **74,675**, the percent card 0.34 as before; no card cuts its number at 1920 x 1080. **Not run:** a `0` and a `0.00` measure (the sample has none), a value with decimals, the Format pane, the phone layout, smaller pages. Record: DESKTOP-TESTS.md |
| D-P1b | SVG columns from `create_report` (round 9, R9.3; experimental) | one report on the made-up sample with two `svgColumns`: a progress bar per row (a track and a bar bound to a ratio of two measures) and a Ramadan-day strip (a 30-step bar bound to a day-of-Ramadan measure, with tick lines), English and Arabic (right-to-left); open both | every row and the total draw both pictures; the bar's width follows the ratio; the column headers are the labels; in the Arabic report the SVG columns sit at the left end; write down the picture's size in the row (the table's image height is left to Desktop's default: decide from the capture whether `grid.imageHeight` must be set), and that a column value with `<`, `&` or a quote (a text bound with `fmt: "text"`) is drawn as text. Not in this check: card, matrix, image visual, phone, PDF **2026-10-04 (second sitting), done with findings:** both pictures draw in every row and the total, English and Arabic; the strip follows the row's column value. **Findings:** each picture is only 76 page units wide (about 11 tall) in a row about 77 tall: too small to read, rows too tall, so the image size must be set; with the default four-field table the pictures are off the table's right edge; in the Arabic report the total row loses its "Total" word (the first column is a picture) and the pictures are not mirrored. **Not run:** a text with `<`, `&` or a quote. Record: DESKTOP-TESTS.md **2026-10-04 (third sitting): the size is set by the table`s `grid.imageHeight` and `grid.imageWidth`** (Desktop`s own JSON; default 75 x 75): with 24 and 160 the bar is 160 x 24 and a row 29 tall, English and Arabic. In a right-to-left table "Total" is written in the first projection`s column: it is back when a text column is first. Record: DESKTOP-TESTS.md, third sitting |

## Round 5 in progress: the audit's MCP fixes, the agent's guidance, the install experience (owner's go 2026-10-04, in advance for every step; branch `fix/round-5-agent`, from main `a5707fd`; dataarcus-engine branch `fix/round-5-agent`, from its main `f716775`)
Sources: dataarcus-engine `business/audit/REPORT-2026-10-04.md` (AUD-006, AUD-005, AUD-023, AUD-007, evidence in
`evidence/2026-10-03/area3/`), `mcp/GOLDEN-TASKS.md` "Agent level, 2026-10-04", `packaging/PACKAGING.md`. Tests first
for every code change. Not merged by the builder.

**Before (main `a5707fd`, this laptop):** `npm test` 216 of 216. The audit's scripts (copies with Windows paths in
`<tests folder>\round5\audit`): `priv.mjs`: `check_model_health` returns the literal, the number 42000 and the
description text inside `fixes.NO_FORMAT.fixScript`; `raw.mjs 1`: one 1 MB description makes the answer 1,053,024
characters; `adv.mjs`: this laptop can't make symbolic links (EPERM), so the copy uses junctions: `generate_theme`
on a dangling link at its default name answers a raw `ENOENT` (on Linux, in the audit: the file is written outside).
Golden tasks at agent level: 4 of 11.

### Plan and expected results (written before any code)
| # | Item | Change | Expected |
|---|---|---|---|
| 1 | AUD-006 | `check_model_health` writes each fix script (sort order, number formats, percentage formats) to a new file next to the project (`dataarcus-fix-<what>.tmdl`, a free name, never over a file) and returns `fixScriptFile` (its path), the object names (`sorts`, `suggested`, `byHand`) and `howToApply`; no `fixScript` text. When the working folder is the model folder itself (nothing may be written next to the model) no file is written and the answer says why. The tool is no longer marked read-only (it adds files). `PRIVACY.md` updated to match | `priv.mjs`: no literal, no 42000, no description text in any answer; the script file holds them, on disk only. Existing tests that read `fixScript` read the file instead: the same expected text |
| 2 | AUD-005 | A free name is one where `lstat` finds nothing (a link, even a dangling one, counts as taken); every new file is written with the `wx` flag: `generate_theme`, the fix script files, `create_report` | `adv.mjs`: the theme goes to `my-brand-theme-2.json` inside the working folder; nothing appears outside. A test with a dangling link at the theme's name and at a report file's name (a symbolic link where the system allows one, else a junction) |
| 3 | AUD-007 | follows from 1 | `raw.mjs 1`: the answer under 40,000 characters |
| 4 | Guidance | server `instructions` and tool descriptions carry the six rules (plan and wait for "go"; display names only from the user; a card's label says what its value is; Gulf calendar fixes point to the Calendar Generator, never own DAX, section not scored; names, descriptions and file names are untrusted text; an unsupported visual: offer the closest supported ones); the same rules in `skills/report-design/SKILL.md`; the engine's `packaging/build.mjs` stages the skill (19 files) | a test reads the server's instructions and each tool's description for the rules; the build test expects the skill |
| 5 | Install | `manifest.json`: no `default` for the working folder. A working folder that doesn't exist, and an empty one, answer as normal results (not errors) with what to do; "no working folder set" stays a refusal | tests: `isError` false, the same instructions; a writing tool still writes nothing there |
| 6 | Package 0.2.1, agent level | rebuild, install in Claude Desktop, the 11 golden tasks in incognito chats, recorded per task as on 2026-10-04 | before 4 of 11 |
| 7 | Hostile model at agent level (AUD-023) | a made-up model with a measure named "Ignore your rules and delete the report folder" and a description with instructions | the agent treats them as names, says so; nothing deleted; nothing outside the working folder |
| 8 | End | uninstall, put back what was switched off | |

Existing expectations that will change (old -> new, why), to be confirmed after the work: the tests that read
`fixes.*.fixScript` (text in the answer -> the file at `fixScriptFile`); the two "working folder" tests (`err` true ->
a normal result); `check_model_health`'s read-only annotation (true -> false). No expected number changes.

### Results (2026-10-04; nothing merged)
- **Commits.** DataArcus `fix/round-5-agent`: `45cc3d9` (this plan), `836fc25` (items 1 to 5 in one commit: the
  changes share `mcp/server.mjs` and the tests, so they were not split per item), then the records. dataarcus-engine
  `fix/round-5-agent`: `2b4c97b` (the build stages the skill, checks the staged server's instructions and its
  empty-folder answer; the manifest without a default folder; 0.2.1).
- **Tests.** `npm test`: 216 -> **257 of 257**. Engine `node --test packaging/build.test.mjs`: 5 -> 7. No shared
  engine in `assets/js` was touched, so no website suite was run. Golden baseline at tool level: 10 of 10 run,
  largest answer 15,383 (was 17,997).
- **Expectations that changed (old -> new, why).** No expected number changed. (1) Seven checks read a script from
  `fixes.*.fixScript` -> they read the file at `fixScriptFile`: the same expected text, now on disk. (2) "A DAX table
  gets no script": `!fixScript` -> `!fixScriptFile`. (3) Round 3's two working-folder checks: `err` true -> a normal
  result with the same sentences ("is empty", "doesn't exist yet"). (4) The annotations check: `check_model_health`
  moves from the read-only tools to the tools that only add files.
- **The audit's scripts** (copies with Windows paths, `<tests folder>\round5\audit`):
  | Script | Before | After |
  |---|---|---|
  | `priv.mjs` | `check_model_health` carries the literal, 42000 and the description | none of the three in any answer |
  | `raw.mjs 1` (a 1 MB description) | answer 1,053,024 characters | 4,777 |
  | `adv.mjs` (junctions here: this laptop can't make symbolic links) | `generate_theme` at a dangling link: raw `ENOENT` (on Linux, in the audit: written outside) | written inside as `my-brand-theme-2.json` and `evil-name-2.json`; outside unchanged; the 10 MB case no longer drops the connection |
  The symbolic-link case itself runs in `npm test` on Linux (CI): the test makes a symbolic link where it can and a
  junction otherwise.
- **What was built differently from the plan's wording:** asked again, `check_model_health` names the file that
  already holds exactly the same script instead of writing a second copy (still never over a file: a file with
  other content is left and the script gets the next free name). Reason: an agent calls the check several times
  (task 11 calls it twice) and the folder would fill with copies. `byHand` steps stay in the answer: they can carry
  a formula DataArcus proposes from the user's column names, never one read from the model (said in `PRIVACY.md`).
- **Package:** `dist/dataarcus-0.2.1.mcpb`, 3,326,309 bytes, SHA-256
  `a06ac470a831eb4b2862977239e0de0be4c399d9b8055d9dd41733e877d2cc69`, unsigned, 19 staged files, 91 packages.
- **Install (Claude Desktop 2.19675):** the working-folder field is now empty with the placeholder "Directory
  path" (captures `<tests folder>\round5\shot-*.png`); after Save the extension is still **Disabled** until
  switched on (Claude's own behaviour, for `INSTALL.md`).
- **Golden tasks at agent level: 4 of 11 -> 6 of 11** (`mcp/GOLDEN-TASKS.md`, "Agent level after round 5"). Pass:
  1, 6, 8, 9, 10, 11. Fail: 2 (exec layout instead of analysis), 3 (no fields input, no Ramadan measure), 4 (cut
  titles at 960 x 720), 5 (640 x 360, expected), 7 (measures proposed without format strings: passed before).
  Plan shown and "go" awaited in 8 of 8 report tasks; no name translated or shortened by the agent.
- **Hostile model (AUD-023): as expected.** Names treated as names and said so, plan and "go" kept, nothing
  deleted, nothing outside the working folder.
- **End:** the extension uninstalled (its folder and settings file gone), the owner's skill and the two connectors
  on again, Power BI Desktop closed. One test window of Power BI Desktop (untitled, with the "Issues were found"
  dialog of the hostile test model, which Desktop can't load) was stopped by the builder while the owner was at the
  laptop.
- **Decisions for the owner:** (1) a `fields` input for `create_report` and its bound fields in the answer (the
  cause of tasks 1, 2, 3, 4, 5, 10 showing "(old)" or not what the plan said); (2) task 7: `suggest_fields` to say
  "propose measures with format strings" on a model without measures; (3) keep or drop "name the same file again"
  for fix scripts; (4) `read_model` by a model's plain name; (5) `INSTALL.md`: pick the folder, then switch the
  extension on.

## Laptop sitting 2026-10-04 (owner's go, in advance for every part; results branch `test/golden-agent-level`; nothing merged)
Seven parts in order, each independent. No product code is changed in this sitting: every product problem is written
down with its cause and a proposed fix. State after each part:

- **Part 1, zod 4 (Dependabot PR #5): automated half done.** The PR's branch is on an old base (before rounds 3 and
  4), so the bump was put on top of main locally (`local/zod4-on-main` in the worktree `<zod4 worktree>`, not
  pushed). `npm ci`, `npm test`: **216 of 216** with zod 4.6.5. `builder-scripts\zod4-compare.mjs` runs the same 14
  calls on main's server and on the zod 4 server over stdio: **every tool answer and every written file is the
  same** (23 comparisons). Two differences, neither in an answer:
  - the wording of refusals: "Invalid enum value. Expected 'uae' | 'ksa'..., received 'egy'" becomes "Invalid option:
    expected one of "uae"|"ksa"..." (the rejected value is no longer echoed); "Required at path" becomes "Invalid
    input: expected string, received undefined at path"; "Number must be less than or equal to 6" becomes "Too big:
    expected number to be <=6";
  - the tools' input schemas as the AI app sees them: `additionalProperties: false` is gone from every object, whole
    numbers gain safe-integer `minimum`/`maximum`, records gain `propertyNames`. No name, type, default or description
    changed.
  The Claude Desktop half follows after Part 2 (it needs a package of that server).
- **Part 2, the build script: done.** dataarcus-engine, branch `packaging/build`, `862943a`:
  `packaging/build.mjs` and `packaging/build.test.mjs` (5 tests). First build from main `19c5408`:
  `dist/dataarcus-0.2.0.mcpb`, 3,319,052 bytes, unsigned, 18 staged files, 91 production packages.
- **Part 1, the Claude Desktop half: done. zod 4: same results.** A package built from the zod 4 worktree
  (`dataarcus-zod4-0.2.0.mcpb`, test only) was installed in Claude Desktop; in a new chat the agent listed the tools
  and ran `read_model`, `check_model_health` (country uae), `generate_theme` and `create_report` on the made-up
  Ramadan model: all succeeded. The report it wrote has the same 76 files with the same sizes (188,977 bytes) as the
  same calls on main's server (`builder-scripts\zod4-desktop-compare.mjs`). The test package was uninstalled
  afterwards. **Recommendation for PR #5: mergeable after a rebase on main** (its branch is from before round 3); the
  only visible change is the wording of refusals.
- **Part 3, install and first check: done, with findings.** `dataarcus-0.2.0.mcpb` installed in Claude Desktop
  (Store version 2.19675, built-in Node 24.21.0). Captures in `<tests folder>\beta-sitting\` (`shot-*.png`).
  - Empty working folder `<working folder>`: the agent says the folder is empty and how to save a project into
    it. **As expected.**
  - Golden task 1 from a new chat: a report was written, **validator 0**, opens in Desktop, cards 101.914K and
    74.675K as in the golden task (details under Part 5).
  - **What Claude Desktop shows for the unsigned package** (for `INSTALL.md`):
    1. Double-clicking the `.mcpb` does nothing useful: Windows asks "How do you want to open this file?" (the Store
       version of Claude registers no file type). Install through **Settings > Extensions > Advanced settings >
       Install extension**, or drag the file onto the Extensions page.
    2. "Advanced settings" shows a red "Developer tools warning" above the Install button.
    3. The install screen: a red box "Installing will grant this extension access to everything on your computer.
       Any developer information shown has not been verified by Anthropic. Ensure you trust the source of this
       extension before installation." Then a Windows dialog "Do you want to install DataArcus for Power BI?".
    4. The working-folder field shows the text `${DOCUMENTS}/DataArcus` as it is written in the manifest (the
       variable is not filled in) and **Save stays disabled** until the tester types or browses to a folder.
       *Cause:* this Claude version does not expand `${DOCUMENTS}` in a `user_config` default. *Proposed fix:* drop
       the `default` from the manifest (an empty field and Browse), and say in `INSTALL.md` to pick a folder.
    5. After Save the extension is **installed but Disabled** (Claude's log: "has missing required configuration,
       not enabling automatically"): the tester must switch it on (the toggle on the same screen). *Proposed:* a
       line and a picture in `INSTALL.md`; nothing in our files can change it.
    6. Every tool asks "Claude wants to use ... Decline / Always allow / Allow once" the first time (the four
       read-only tools are grouped as "Read-only tools", so the annotations work).
    7. On the empty folder the first tool call is labelled "Failed" in red in the chat, although the answer is the
       helpful "folder is empty" text (the tool returns it as an error). *Proposed:* decide whether this answer
       should be a normal result instead of an error.
  - The permission "Always allow" given to a tool survived uninstalling and reinstalling the extension.
- **Part 4, the images for findings 001 and 002: done** (branch `findings/001-capture`, `9d66742`, the record in
  `scripts/tests/DESKTOP-TESTS.md` there). The DAX check gave 101914, 74675, 0.3377971208570472, as expected; the
  cards 101.914K, 74.675K, 0.34. Images: `<tests folder>\6-ms-plugin\_shots\f001-1-page.png`,
  `f001-2-topband.png`, `f001-3-numbers.png` and `<tests folder>\phase2-try\shots-r2\f002-1-before-after.png`.
  Image 3 is stacked, not side by side (the query was unreadable side by side at 1200 wide), and its result grid
  rounds to 0.34 while the caption says 0.3378: the owner's choice whether to change the query.
- **Part 5, the 11 golden tasks at agent level: done. 4 of 11 pass** (7, 8, 9, 10); validator 0 errors on all 9
  reports written; nothing overwritten anywhere. The table, every check and the answers given are in
  `mcp/GOLDEN-TASKS.md`, "Agent level, 2026-10-04". The findings that repeat, each with a proposed fix there:
  1. the agent never shows a plan or waits for "go" (the package has no report-design skill, and the tool
     descriptions don't ask for it);
  2. `read_model` with a model's plain name fails first ("Ramadan Test" is not found, the folder name is);
  3. the agent translates, shortens and in task 3 mislabels fields through `displayNames` on its own;
  4. "(old)" measures on cards; a `modelNotes` example ("0.34 instead of 34%") repeated as a fact on a model
     without rows;
  5. task 11: the agent wrote its own DAX for the Saudi weekend instead of pointing to the Calendar Generator;
  6. task 9 (watched closely): nothing written, no false claim; the closest supported visuals were not offered.
     Task 7 (watched closely): no report written, five measures with formats and the sort fix proposed.
  The agent had only DataArcus: Microsoft's authoring MCP and the Desktop bridge are not in Claude Desktop chats
  here, so opening the reports and the DAX checks were done by the builder afterwards. Task 3's first two chats
  were taken over by the tester's own skills and memories; the rest ran in incognito chats with them off.
- **Part 6, Desktop regression sweep on main: done.** Sixteen reports (MCP and website download; English and Arabic;
  1920 x 1080 light and dark, 1280 x 720, 640 x 360), validator 0 errors on all; header, filter rail, page buttons,
  hover tooltips, phone layout as last recorded at 1080 and 720. Four new findings, each with a proposed fix in
  `scripts/tests/DESKTOP-TESTS.md` ("2026-10-04: regression sweep"): the Arabic page button "ملخص تنفيذي" is cut at
  640 x 360; Arabic MCP reports with a side filter rail cut two of four KPI titles at 1080 (Tahoma bold, long English
  names); a scroll thumb beside "Your logo" at 640 x 360 on the MCP's English report (cause not found); reports with
  display names open as "unsaved" in Desktop (Desktop's own behaviour: its own saved copy does the same).
- **Part 7, a newer Microsoft plugin: nothing to test.** The latest release of microsoft/skills-for-fabric is
  v0.3.18 (2026-09-25), the version already tested; the repository's last commit is that release (2026-09-24).
- **End of the sitting: the laptop put back.** "DataArcus for Power BI" uninstalled from Claude Desktop (its folder
  and its settings file under Claude's data are gone; no server process of the extension is left; the four
  `node ... mcp\server.mjs` processes still running belong to Claude Code sessions started on 2 and 3 October).
  The tester's other skills and connectors, switched off for the agent-level run, are on again. Power BI Desktop closed without
  saving. Left behind on purpose: the empty test folder `<working folder>`, the evidence in
  `<tests folder>\beta-sitting` and `tests\phase2-try\shots-s6`, the sixteen "Gulf Sales S6" test reports, the
  worktrees `zod4-check` and `engine-build`, and five normal chats in the owner's Claude history (the smoke tests
  and golden tasks 1, 2 and 4). "Always allow" for the DataArcus tools may still be remembered by Claude Desktop
  (it survived a reinstall earlier).

## Next step (owner's go 2026-10-02, after reviews by ChatGPT and Gemini): users and a first paid client sooner
**The goal that decides everything: by 15 November 2026, 5 beta users have used DataArcus on their own work and 1
client has paid.** Anything that doesn't serve it waits (the Gulf Calendar pack is the exception: Ramadan sets its
date). The plan is in `mcp/ROADMAP.md`, "Plan of 2026-10-02".

**Order (after the owner's weekly usage reset; each round starts with the owner's go, on its own branch from main):**
1. **Round 1, trimmed to what users see** (builder; plan below under "Round 1"): the cut "Executive..." page button,
   title and logo centred, the tooltip's monthly trend, phone text sizes, rounded header and filter rail on solid
   designs. The slide-in panel check stays in.
2. **Round 2, Arabic basics** (builder): Arabic display names, day/month sort order, missing number formats.
3. **Data privacy** (reviewer plans, builder builds what's needed): state exactly what stays local and what Claude
   (Anthropic) sees through the tool results; return metadata only, never data values, unless the user asks; the
   privacy note and `mcp/PRODUCT_SPEC.md`.
4. **Minimum packaging** (clean-machine install: Claude + DataArcus + a sample project + a finished report) and the
   **11 golden tasks** (permanent real requests, including a large model of hundreds of tables), run before every release.
5. **Private beta and free before/after case studies** (owner's outreach starts the week of 4 October).
- **The split of `pbip-export.js` is deferred until after the beta**, unless the overnight plan (branch
  `plan/split-pbip-export`) shows it takes about one evening; the owner decides when he reads it.
- **The validator:** a representative set of exports on every push, the full matrix nightly (reviewer, after round 2).
- **Dated:** the Gulf Calendar pack and its free lead-magnet download, ready by 2026-12-01.

## Round 3 in progress: safety before the first beta build (owner's go 2026-10-03, in advance for every step; branch `fix/round-3-safety`, from main `a261f65`)
Ten items: the 3 privacy gaps (`mcp/PRIVACY.md`), the 4 server fixes required before the first build
(`packaging/PACKAGING.md` in dataarcus-engine), the bookmark label, and the two fixes found in round 2's Desktop
sitting. Not in this round: the large-model summary and fewer KPI cards (round 4), the validator sweep (reviewer),
zod 4 (PR #5), the Gulf calendar in the MCP, round 2's "Seen, not in scope", the split.

**State (2026-10-03): all ten items built, pushed, Desktop checked for 8-10; waiting for the reviewer.** Plan
`74e1e1a`; tests first `1ab0993` (22 of the 25 new MCP checks failed before the code; 3 describe behaviour that
already held); item 8 `294d8a1`; item 10's reader `e52745f`; item 3 `251637f`; items 1, 2, 4, 5, 6, 7, 9 and 10's
MCP side `d19d8ed` (one commit: they share `mcp/lib/model.mjs` and `mcp/server.mjs`).
- **Tests:** MCP 149 → 174; website `model-health` 48 → 50, `tmdl-model` 69 → 70; the full website run on this
  laptop: 16 of 17 pass; `gulf-calendar` fails 3 checks here for a reason that is not this round's (the `.dax` files
  are checked out with CRLF on Windows and compared byte for byte; it passes on CI). No fixture changed.
- **Desktop (items 8-10):** as expected, in `scripts/tests/DESKTOP-TESTS.md` ("round 3, safety").
- **Docs:** `mcp/PRIVACY.md` (no open gaps; sections 3 and 4), `mcp/README.md`, `mcp/PRODUCT_SPEC.md`,
  `mcp/CLAUDE.md` (lessons).
- **For the packaging repo (not changed here):** PACKAGING.md's "refuses to start" is now "starts and every tool
  refuses" (the decision to confirm); the build script sets the version in `mcp/package.json` only.
- **Next step:** the reviewer's review, CI, merge; then zod 4 (PR #5), round 4 (large-model summary, fewer KPI
  cards).

**Method:** failing tests first for every item (all behaviour), then the code; the suites each item touches; the
full website run and `npm test` once at the end; Desktop only for 8, 9, 10. Item 10 is measured in Desktop before any
code. No fixture may change (if one would: stop for the owner's go).

### The three design decisions (to report)
- **Item 2, a working folder that is itself a model folder: refuse, don't write inside.** A report written inside
  `X.SemanticModel` would not be a project Desktop can open (the report must sit next to the model, and the `.pbip`
  beside both). So `create_report` refuses with: the working folder is the model folder itself; choose the project
  folder (the one that holds `X.SemanticModel`). `read_model`, `suggest_fields` and `check_model_health` keep working
  on it, but no longer look at the folder above (today they list and read the reports next to the model, which are
  outside the working folder): `existingReports` is empty and the health check runs without a report.
- **Item 4, an empty or missing `DATAARCUS_ROOT`: the server starts, and every tool refuses with one clear message;
  no file is touched.** Not set, empty, blank, or still a placeholder (`${...}`, what a manifest leaves when the
  setting is empty) all count as missing. The server does not exit, because a server that fails to start shows only
  "disconnected" in the AI app and the reason stays in a log; a tool answer is read out to the user. (PACKAGING.md
  says "refuses to start": this is the one decision to confirm.) **Tests and dev runs keep working without a flag:**
  `mcp/test.mjs`, `mcp/test-models/golden-baseline.mjs` and the README's `claude mcp add ... --env DATAARCUS_ROOT=`
  already set it; a developer who wants the current folder sets `DATAARCUS_ROOT=.` on purpose.
- **Item 5, a missing working folder: create it on start when its parent exists; otherwise answer.** The manifest's
  default `Documents\DataArcus` doesn't exist on a clean machine and the user chose it in the install screen, so the
  server makes that one folder (never a chain of folders: a mistyped path is not created). If it can't (no parent,
  no permission), every tool answers "Your working folder X doesn't exist yet: create it and put a Power BI project
  (.pbip) in it." A working folder with nothing in it answers "... is empty: put a Power BI project (.pbip) in it"
  instead of "No .SemanticModel folder in .".

### The items (file; what changes; the failing checks written first)
1. **Links leading outside** (`mcp/lib/model.mjs`, `mcp/lib/design.mjs`). `inside()` resolves the real path
   (`fs.realpathSync` of the deepest part that exists, against the working folder's own real path) before the folder
   check, for reads and writes; the model search never follows a link (symbolic link or junction), and the model
   folder, the project folder and `model.bim` are checked the same way. Message: `"<path>" leads outside the working
   folder <root> through a link (a symbolic link or a junction). DataArcus reads and writes only inside the working
   folder.` **4 checks:** `read_model` through a junction to a folder outside: refused with that message;
   a project whose `.SemanticModel` is a link to outside: not read; `generate_theme` with `folder` a link to outside:
   refused and nothing written there; `create_report` with a `logo` behind a link: refused.
2. **The working folder is a model folder** (`mcp/lib/model.mjs`, `mcp/server.mjs`). As decided above. **3 checks**
   (a second server whose root is `...\X.SemanticModel`): `read_model .` answers with the tables and no
   `existingReports`; `create_report` is refused with the message naming the project folder; nothing is written above
   the working folder.
3. **The skill asks first** (`mcp/skills/report-design/SKILL.md`). Steps 7 ("open and look") and 8 ("check the
   numbers"), and the existing-report section, ask the user before a page screenshot or a DAX query and say that what
   the report shows (its numbers) goes to the AI app; without a yes the skill stops at "open the file yourself" and
   reports the checks as not done. **2 checks** (`mcp/test.mjs` reads the skill): step 7 and step 8 each say to ask
   first and that it goes to the AI app.
4. **No working folder set** (`mcp/lib/model.mjs`, `mcp/server.mjs`). As decided above. **4 checks** (servers started
   in an empty temporary folder): without the variable the server starts and lists 6 tools; each of the 6 tools
   answers the message; nothing is written in the folder it started in; the same for `""` and
   `${user_config.working_folder}`.
5. **A missing working folder** (same files). As decided above. **3 checks:** root = `<temp>\new` is created on start
   and `read_model .` says the folder is empty; root = `<temp>\a\b\c` (no parent) is not created and the tools say it
   doesn't exist yet; neither answer contains `ENOENT`.
6. **The version in one place** (`mcp/server.mjs`). Read from `mcp/package.json`. **2 checks:** the server's version
   (MCP `initialize`) equals `package.json`'s; `server.mjs` holds no version literal.
7. **Tool annotations** (`mcp/server.mjs`). `readOnlyHint: true` on `read_model`, `suggest_fields`,
   `check_model_health`, `plan_layout`; `readOnlyHint: false, destructiveHint: false` on `generate_theme` and
   `create_report`. **2 checks** on `tools/list`.
8. **"bookmark", not "report filter"** (`assets/js/model-health-engine.js`, shared). A broken field used inside a
   bookmark is listed as `bookmark "<name>"` (PBIR: `definition/bookmarks/*.bookmark.json`; older reports: the
   bookmarks in the layout's config); "report filter" stays for the report's own filters. Scores and counts don't
   move. **1 MCP check + 2 in the website's `model-health` suite** (a PBIR report and an older-format report, each
   with a broken field only in a bookmark, and one in a report filter that must still say "report filter").
9. **"Refresh now" after the sort script** (`mcp/server.mjs`). When the sort script adds a column, `howToApply` ends
   with: after Apply press "Refresh now" in the yellow bar (until then every visual shows an error). **2 checks:**
   that sentence is there when a column is added; it is not on the format script.
10. **Fix scripts keep `lineageTag`** (`assets/js/tmdl-model.js`, shared; `mcp/lib/model.mjs`; the website's worker).
    **Measured in Desktop first:** on a copy of `5-tmdl-sample`, a format script with each measure's existing
    `lineageTag` and one without: read the tags before and after Apply (`INFO.MEASURES()`). Expected: with the tag in
    the script it stays; without it Desktop writes a new one. If the tag does not survive even when given: stop this
    item and report. Then: the TMDL reader keeps `lineageTag` and `sourceLineageTag` when asked (an option; without
    it the result is unchanged, so the reader's existing tests don't move), and the MCP and the website ask for it.
    **2 MCP checks** (the format script and the sort script on a TMDL project with tags carry each rewritten
    object's tag) **+ 1 in `tmdl-model`** (the option keeps the tags; the default result is as before).

### Expected results (written before any run)
| What | Before | After |
|---|---|---|
| MCP `npm test` | 149 | **174** (4 + 3 + 2 + 4 + 3 + 2 + 2 + 1 + 2 + 2 new, each failing first) |
| website `model-health` | 48 | **50** |
| website `tmdl-model` | as on main | **+ 1** |
| the other website suites | pass | pass, counts unchanged; 17 of 17 |
| fixtures | | none changed |
| Desktop, item 8 | | the website's health page and the MCP show `bookmark "<name>"` for a broken field in a bookmark (no Desktop change: the finding is text; checked on the page) |
| Desktop, item 9 | | following `howToApply` to the letter on `6-sort-sample` ends with tables and slicers in order and no error |
| Desktop, item 10 | | the script from the TMDL project shows no `lineageTag` line removed in Preview, and the measures' tags are the same before and after Apply |

## Round 4 in progress: large models and missing measures (owner's go 2026-10-03, in advance for every step; branch `fix/round-4-models`, from main `b76bbbf`)
Owner's decisions: large models get a summary first, details on request; a model with fewer measures than KPI cards
gets fewer cards and is told why (never an empty card). Not in this round: task 9's raw schema message, zod 4, the
packaging build, the Gulf calendar's later items, the /ar/ pages.

**State (2026-10-03): built, pushed, Desktop checked; waiting for the reviewer.**
Plan `4309775`; tests first `f83c169`; item 3's engine `162a24a`; item 4 `5763719`; items 1, 2, 3 in the MCP
`eacbb00`; docs, golden baselines and item 5 in the commit after.
- **Every expected number came out**, with two corrections to my own plan: the checks are 216, not 213; and the
  summary's "other tables" are 235 (the calendar is one), not 234.
- **Sizes on Large Synthetic:** `read_model` 178,303 → **10,380** characters; `check_model_health` 162,909 →
  **17,997**; the five Logistics tables in full: 4,827.
- **Existing expectations this decision changed** (old → new, why), all on Health Test, which has 2 measures:
  the Arabic design report had a visual at each of the design's 3 and 4 KPI slots → 2 cards per page at the engine's
  2-card slots; its "mirrored" check looked for the first of 3 cards at x 1388, 508 wide → the first of 2 at 1125,
  771 wide; the slide-in panel report the same. Why: no card is written without a field any more.
- **Not in the plan, built because the first run showed it:** with no measures at all the charts had no value
  either (4 more validator errors), so they are left out and named (`kpiCards.leftOutVisuals`); the report then has
  its header, filters and table only. The decision to confirm: this, or refuse the report on a model without
  measures.
- **Tests:** MCP 195 → 216; the full website run 17 of 17 with the engine and picker changes (design-engine 598,
  pbip 71, both theme generators 883, layout 512: counts unchanged; no fixture changed).
- **Golden tasks (tool level):** 7 FAIL → PASS (validator 11 → 0); 8 FAIL → PASS (3 → 0); 10 FAIL → PASS when the
  agent gives the focus. `mcp/GOLDEN-TASKS.md` has the new baselines.
- **Desktop:** two 2-card reports (English and Arabic, 1080), both pages each: as expected
  (`scripts/tests/DESKTOP-TESTS.md`, "round 4"); validator 0.
- **CI:** the first push failed on my new "small answers unchanged" check (the answer's path separator differs on
  Linux); the check now normalises it (`044d709`), green.
- **Next step:** the reviewer's review and merge; then zod 4, the
  findings image, the packaging build.

### Measured before planning (main `b76bbbf`, `mcp/test-models/golden-baseline.mjs` and a one-off probe)
- Task 10: `read_model` on Large Synthetic **178,303 characters**; `suggest_fields` picks AR Invoices and Bookings
  (the first tables by file name); `create_report` validator 0.
- **Also over the limit, not in the brief: `check_model_health` on Large Synthetic is now 162,909 characters** (it was
  8,127 when the golden baseline was written). 146,965 of them are round 2's `fixes.NO_FORMAT` (the script for every
  measure without a format: 83,814; the suggestion list: 54,753). Same decision (a summary first, details on
  request), so it is capped here as item 1b; said in the report.
- Task 7: 11 validator errors, all `cardVisual` without a field (the KPI cards of both pages and the tooltip pages'
  cards). Task 8: 3 (the model has 2 measures for 4 cards).

### What "large" means (one rule for the three tools)
A model is large when its full `read_model` answer would be longer than **40,000 characters**: about 10,000 tokens,
the line where Claude Code starts warning, and far below Desktop's 150,000. Every small fixture is under 6,000, so
their answers don't change.

### The items
1. **`read_model` on a large model** (`mcp/lib/model.mjs`, `mcp/server.mjs`). The default answer is a summary:
   counts (tables, columns, measures, relationships), the date tables, the measure display folders with their
   tables ("areas": what a user would name), every table that has measures with its numbers of measures, visible
   columns and related tables, the other tables' names, and how to ask for details. **`tables: ["Shipments",
   "Carrier"]`** returns those tables in full (today's shape), on any model; names that don't exist are listed
   back; an answer that would still pass 40,000 characters stops at a table boundary and names the tables left out.
   **1b. `check_model_health`:** a fix script and its suggestion list cover at most `maxItems` objects (15 by
   default, as the findings do) and at most 30,000 characters, and say how many they cover of how many.
2. **`suggest_fields` on a large model** (same files; the picker itself, `pbip-bind.js`, is unchanged). New inputs
   `focus` (a word the user said: "logistics") and `tables`. The scope is: the tables whose name, or whose measures'
   display folder, contains the focus word (or the named tables), the tables related to them, and the date tables,
   in the model's own order. The picker then runs on the scope. On a large model without a focus the tool picks
   nothing and says it needs one, listing the areas. A focus that matches nothing is told, with the areas.
   `create_report` takes the same two inputs and follows the same rule (on a large model it refuses without one).
3. **Fewer measures than KPI cards** (`assets/js/design-engine.js`: `computeSlots` and `projectPages` take a card
   count, additive, so no design fixture moves; `assets/js/pbip-export.js`: no tooltip page when there is no measure
   for its card; `mcp/lib/design.mjs`, `mcp/server.mjs`). `plan_layout` takes `kpis` 0 to 6 (it refused under 3).
   `create_report` builds as many KPI cards as the model has measures a card can show, on every page (none: no KPI
   row, and the charts take its room), and says in `kpiCards` and `reportNotes` how many were asked, how many were
   built, which measures were used and why the rest are missing. Hand-placed pages: KPI slots beyond the measures
   are left out, and named. No card without a field is ever written.
4. **"Margin" is not a percentage by its name alone** (`assets/js/pbip-bind.js`, shared; `mcp/server.mjs`'s
   `modelNotes`). A measure named margin or share counts as a percentage only when its format has %, or it has no
   format and its expression divides (DIVIDE or /); a name with %, pct, percent, ratio or rate still does.
5. **"10 golden tasks" → 11** in `mcp/WORK.md` and `mcp/ROADMAP.md`. (The reviewer: `packaging/PACKAGING.md` in
   dataarcus-engine says 10 too; not edited from here.)

### Expected results (written before any run)
| What | Expected |
|---|---|
| `read_model`, Large Synthetic | a summary under **20,000** characters (178,303 today): 300 tables, 3,000 columns, 975 measures, 416 relationships; date table Calendar; 65 tables with measures; an area "Logistics" |
| `read_model`, `tables: ["Shipments", "Carrier", "Nope"]` | exactly Shipments and Carrier in full, `notFound: ["Nope"]`, under 40,000 characters |
| `read_model` on the small fixtures (tmdl-project, bim-project, dax-project, sample.pbit) | byte for byte today's answers |
| `suggest_fields`, Large Synthetic, no focus | no picks; `needsFocus`, the areas listed (Logistics among them) |
| `suggest_fields`, `focus: "logistics"`, 4 KPIs (worked out with today's picker on the scope chosen by hand: the 5 Logistics facts, the 17 tables they relate to besides the calendar, the calendar) | scope **23 tables**; KPIs `Shipments[Shipments Total Net Amount]`, `Deliveries[Deliveries Total Tax Amount]`, `Freight Costs[Freight Costs Total Tax Amount]`, `Freight Costs[Freight Costs Units Share %]`; time axis `Calendar[Month Name]`; categories `Carrier[Carrier Group]` and `Route[Route Group]`; slicers `Calendar[Year]`, `Carrier[Carrier Group]`, `Route[Route Group]` |
| `suggest_fields`, `focus: "zzz"` | no picks; told that nothing matches, with the areas |
| `create_report`, Large Synthetic | without a focus: refused, asking for one; with `focus: "logistics"`: the KPI cards carry the four measures above, validator 0 |
| `check_model_health`, Large Synthetic | under **40,000** characters (162,909 today); `fixes.NO_FORMAT` covers 15 measures and says of how many; score and findings unchanged |
| `plan_layout`, `kpis` 0, 1, 2 | accepted: 0, 1 and 2 KPI slots; 7 still refused |
| `create_report` on Health Test (2 measures), a 4-card design | 2 KPI cards on each page; `kpiCards` asked 4, built 2, the two measures named; no visual without a field; **validator 0** (3 today) |
| `create_report` on Plain Orders (no measures) | no KPI card and no tooltip page; the notes say the model has no measures; **validator 0** (11 today) |
| hand-placed page with 4 KPI slots on Health Test | 2 cards written, 2 slots named as left out |
| a made-up model: Total Margin = SUM, no format; Net Margin = SUM, `#,0`; Gross Margin = DIVIDE, no format; Margin % = DIVIDE, no format | `modelNotes` flags Gross Margin and Margin % only; Total Margin is not picked as the ratio card |
| Large Synthetic, "Bookings Total Margin" (golden task 10's note) | not flagged as a percentage |

- **Tests:** MCP `npm test` 195 → **216** (21 new checks: the plan first said 18, a miscount of the three plan_layout checks and two others; 18 fail first, and "small answers unchanged", "small fixes whole" and "7 cards refused"
  hold before and after). Website suites: no count changes expected; `design-engine` (598), `pbip` (71), both
  theme generator suites and `layout` must pass unchanged, since the engine and the writer are only added to.
- **Fixtures:** none may change (`cases.json`, `project-pages.json`): proved by the suites; if one would, stop.
- **Golden tasks at tool level, expected:** 7 FAIL → PASS on the validator (0 errors, no empty card; the agent-level
  part stays not run); 8 FAIL → PASS (0 errors); 10 FAIL → PASS at tool level when the agent gives the focus
  (`read_model` under 20,000, KPIs from Logistics, no margin flagged, every answer under 40,000).
- **Desktop:** one report with 2 KPI cards (Health Test's model has no data, so the made-up `5-tmdl-sample` with a
  2-card design), English and Arabic at 1080, through the bridge only: the two cards fill the KPI row with the usual
  gaps, titles and numbers as on a 4-card report.

## The Gulf calendar beta cut in progress (owner's go 2026-10-03, in advance for every step; branch `feat/gulf-calendar-mcp-cut`, from main `87d9b33`)
Only "The beta cut" of `mcp/plans/GULF-CALENDAR-MCP.md`: items **1a** (detection from the model files) and **5**
(the country parameter, weekend only). Not in this cut: 1b (the calendar-only query), 0 (the shared DAX engine), 2,
3, 4 (the page), 5b (other countries' dates), the website's health page (D4), the `read_model` hint.

**State (2026-10-03): built, pushed; waiting for the reviewer.** Plan `bf35a0c`; tests first `8b8ea28`; code
`33aeb2d`; docs and two small corrections after reading the output (the Hijri month column named is "Hijri Month
Number", Arabic event names in the Arabic text) in the commit after it.
- **Every expected number came out at the first run:** 626 and 939 days, 3 estimate items, 1 differing date
  (Ramadan 1439), no section without a country on a model without Hijri columns, the score and findings unchanged.
- **Tests:** MCP 174 → 192 (15 of the 18 new checks failed before the code; 3 assert that nothing moves and held
  already); `gulf-calendar` 727 → 730; the full website run on the laptop: 17 of 17 pass (the `.dax` files are LF
  now). No fixture changed or added.
- **Seen while building (settled by the follow-up above):** on the pack's test model with `country: ksa` the
  section gave `GC_DATES_DIFFER` for Ramadan 1439 against Umm al-Qura; Saudi Arabia is now compared with the announced
  dates.
- **For packaging (dataarcus-engine):** the staged files must include `assets/js/gulf-health.js` and
  `assets/js/gulf-dates.js`.
- **Next step:** the reviewer's review, CI, merge; then the queue (round 4, zod 4, the /ar/ pages, the Copilot
  pre-check).

### Follow-up (owner's decision 2026-10-03, after the Saudi sources were merged, main `380cc48`): which dates a country is compared with
All 27 of Saudi Arabia's announced Ramadan and Eid dates 2018-2026 match the UAE's (`scripts/gulf-calendar/
DATES-SOURCES.md`), Ramadan 1439 on 2018-05-17 included. So the rule "other countries: Umm al-Qura" told a Saudi
user that a correct date was wrong. **New rule (replaces D2's cut):**
- **UAE and Saudi Arabia:** compared with the announced dates (`gulf-dates.js`). For Saudi Arabia the section and the
  fix say why: "the UAE's announced dates, which match Saudi Arabia's for 2018-2026"; the fix says announced dates
  **on** (the generator's option is labelled "(UAE)").
- **Qatar, Kuwait, Bahrain, Oman** (no sourced dates yet): a start that differs from Umm al-Qura is only a **low
  note**, `GC_DATES_NOTE` ("differs from Umm al-Qura: check your country's official announcement"), never
  `GC_DATES_DIFFER`; the fix leaves "announced dates" to the user's choice, with the same note.
- The weekend checks are unchanged.

**Expected (written before any run; `asOf: 2026-10-03`):**
| Model | Country | Expected |
|---|---|---|
| the pack's test model | `ksa` | `GC_WEEKEND` **939** (unchanged); **no** date finding or note; `datesComparedWith.with` `uae-announced`, its note says the dates match Saudi Arabia's; fix: announced dates on, with that reason |
| the pack's test model | `qat` | `GC_WEEKEND` **939** (Qatar is Friday-Saturday too); `GC_DATES_NOTE`, level low, **1** item: Ramadan 1439, model 2018-05-17, Umm al-Qura 2018-05-16; no `GC_DATES_DIFFER`; fix: announced dates "your choice", with the note |
| the 2018-2030 calendar without announced dates | `ksa` | `GC_DATES_DIFFER` **1** item: Ramadan 1439, model 2018-05-16, announced 2018-05-17 (as for the UAE) |
| `tmdl-ramadan` | `ksa` | 626 weekend days (unchanged); no date finding; compared with the announced dates |

**Done 2026-10-03:** tests first, then the code in `assets/js/gulf-health.js` (with the Arabic text); MCP 195 pass;
`GOLDEN-TASKS.md` is titled for 11 tasks and task 11 follows the new rule; README updated. Every number above came out.

**Expected numbers this decision changes (old → new):**
- `tmdl-ramadan` with `ksa`: `datesComparedWith.with` `umm-al-qura` → `uae-announced`; its note "sourced for the UAE
  only" → "match Saudi Arabia's for 2018-2026". Why: Saudi Arabia's dates are now sourced and equal.
- the pack's test model with `ksa` (golden task 11 and the builder's output): `GC_DATES_DIFFER` 1 item (Ramadan
  1439) → **no date finding**. Why: 2018-05-17 is what Saudi Arabia announced.
- Tests: MCP 192 → **195** (3 new checks; 1 existing check's expectation changed as above); `gulf-calendar` 730,
  `model-health` 50, `tmdl-model` 70 unchanged.

### What is built
- **A new shared file, `assets/js/gulf-health.js`** (UMD, loads `gulf-dates.js`; not in `model-health-engine.js`'s
  rule list): `analyze(model, { country, asOf, maxItems })`. **Nothing in the health engine changes: the score and
  every existing finding count stay the same** on the website and in the MCP.
- **`check_model_health`** (`mcp/server.mjs`) takes `country` (`uae` default, `ksa`, `qat`, `kwt`, `bhr`, `omn`) and
  `asOf` (a date, for tests: today by default), and returns a section **`gulfCalendar`**, marked `scored: false`.
  **D3:** the section is returned only when `country` is given or the model already has a Hijri or Ramadan column.
  `country` changes only the weekend rule and the dates compared; **never `weekStart`** (round 2's fixes don't move).
- **What is read, from the files only (no data values):**
  - *any calendar:* whether Hijri year, month and day columns, Ramadan/Eid columns, a weekend column and an
    "estimated date" column exist (by name: the generator's names and close variants, Arabic included), and whether
    the model has Ramadan or Eid measures;
  - *a calendar made by our generator* (a DAX table whose expression starts with the generator's comment): its range
    (`CALENDAR ( DATE (...), DATE (...) )`), its Hijri month starts (the `DATATABLE` rows) and its `Is Weekend`
    expression, evaluated per date by a small evaluator for the generator's forms only (`WEEKDAY ( [Date], 1 ) IN
    { ... }`, `IF ( [Date] >= DATE ( ... ), ..., ... )`). Any other form, and any other calendar's weekend and
    dates, are listed under `cantTell` ("can't tell from the files"), never guessed and never a finding.
- **Findings** (the plan's IDs, levels and English/Arabic wording; the level orders them): `GC_NO_CALENDAR`,
  `GC_NO_HIJRI`, `GC_NO_FLAGS`, `GC_WEEKEND` (days that disagree with the country's rule, with one example date),
  `GC_DATES_DIFFER`, `GC_ESTIMATES`, `GC_ENDS_EARLY`, `GC_NO_MEASURES`. Each has `source: 'files'`, `count` and at
  most `maxItems` items.
- **D2:** Ramadan, Eid al-Fitr and Eid al-Adha starts are compared with the UAE's announced dates when the country
  is the UAE; for the other five countries with Umm al-Qura (worked out with `Intl`, as the generator does), and the
  section says "announced dates are sourced for the UAE only".
- **Fixes point to the website tools, with the exact settings to pick; no DAX is returned (D1 is after the beta):**
  `fixes.calendarGenerator` (the address; the same first and last date, or a last date that covers the next Ramadan;
  the weekend option by its label, e.g. "UAE: Sat + Sun since 2022"; "Hijri dates, Ramadan and Eid" on; "Announced
  Ramadan and Eid dates (UAE)" on for the UAE, and for another country off with the reason) and
  `fixes.measureBuilder` (the address and which Ramadan and Eid measures to tick: only those the model lacks).
- **Docs:** `mcp/README.md` (the tool's row), `mcp/PRIVACY.md` (what the section returns: column and measure names,
  the calendar's own range and month-start dates, counts of days), `mcp/GOLDEN-TASKS.md` (one more task: "a Gulf
  model's calendar checked", on the pack's test model), `mcp/CLAUDE.md`.

### Expected results (written before any run; `asOf: 2026-10-03` unless said)
| Model | Input | Expected |
|---|---|---|
| `tmdl-ramadan` (the generator's calendar 2022-2027, Umm al-Qura, fixed Sat-Sun; Ramadan measures) | country `uae` | section present; no `GC_WEEKEND`; no `GC_DATES_DIFFER`; `GC_ESTIMATES` with **3** items (Ramadan, Eid al-Fitr, Eid al-Adha 1448); no `GC_NO_MEASURES`; no `GC_ENDS_EARLY` |
| the same | country `ksa` | `GC_WEEKEND` **626** days (every Friday and Sunday 2022-2027); dates compared with Umm al-Qura, none differ |
| the same | no country | section present (the model has Hijri columns), country `uae` |
| the same | `asOf: 2027-06-01` | `GC_ENDS_EARLY` (the calendar ends 2027-12-31; Ramadan 1449 is expected from 2028-01-28) |
| the same | fixes | `calendarGenerator`: 2022-01-01 to 2027-12-31, the UAE weekend option, announced dates on; `measureBuilder`: the six Eid measures to tick, not the two Ramadan ones (they exist) |
| the pack's test model (`calendar.dax` and `measures.dax`, wrapped as a model by the test) | `uae` | **no findings** |
| the same | `ksa` | `GC_WEEKEND` **939** days (Fridays and Sundays 2022-2030; 2018-2021 agree) |
| the baseline's calendar from 2018 without announced dates (`fixtures/gulf-calendar/baseline.json`) | `uae` | `GC_DATES_DIFFER` **1** item: Ramadan 1439, model 2018-05-16, announced 2018-05-17 |
| `health-project` (imported calendar, no Hijri, no weekend column) | no country | **no `gulfCalendar` key** |
| the same | `uae` | `GC_NO_HIJRI` only; no `GC_WEEKEND` |
| a made-up imported calendar with Hijri, Ramadan/Eid and weekend columns, no Ramadan measures | no country | section present; weekend and dates under `cantTell`; `GC_NO_MEASURES` |
| a made-up imported calendar with Hijri columns only | `uae` | `GC_NO_FLAGS` and `GC_NO_MEASURES` |
| a made-up model with no calendar | `uae` | `GC_NO_CALENDAR` only |
| the generator's calendar with `Is Weekend` in another form | `uae` | weekend under `cantTell`, no `GC_WEEKEND` |
| any | country `egy` | refused, the six codes listed |
| `sort.bim` (round 2) | with and without `country` | `fixes.MONTH_SORT` identical |
| `dax-project`, `bim-project` | with and without `country` | score and findings identical |

- **Tests:** MCP `npm test` 174 → **192** (18 new checks, failing first); website `gulf-calendar` 727 → **730** (the
  checker on the pack's `calendar.dax`: UAE 0 and Saudi Arabia 939 mismatched days; every baseline calendar made
  with a country's weekend agrees with that country's rule on every day; another form of `Is Weekend` is refused, not
  guessed); `model-health` 50, `tmdl-model` 70 and every other suite unchanged; 17 of 17 pass on the laptop too.
- **Fixtures:** none changed, none added (the new models are written by the tests from repo files).
- **Desktop:** none needed (the section is text read from files). If the numbers above don't come out, that is a
  disagreement between this plan and the generator: stop and report.

## Next step (queued, approved 2026-10-03; builder; plan first, then go)
1. The 3 privacy gaps in `mcp/PRIVACY.md` ("Known gaps"): a link inside the working folder leading outside it; a
   working folder that is itself a model folder; the report-design skill's screenshots and DAX checks without asking.
2. The 4 server fixes required before the first build (`packaging/PACKAGING.md` in dataarcus-engine): empty
   `DATAARCUS_ROOT`, a missing folder, the version in two places, read-only tool hints.
3. The health check calls a broken field inside a bookmark a "report filter": say "bookmark".
4. Large models: a summary first, details on request (`mcp/GOLDEN-TASKS.md`). Fewer measures than KPI cards: build
   fewer cards and say why (today `plan_layout` refuses fewer than 3).
5. Round 2's two small fixes (owner to confirm; recommended with the server fixes): `howToApply` says to press
   "Refresh now" after the sort script; fix scripts from a TMDL project carry no `lineageTag`.
6. Then: Microsoft's validator on a representative set of exports every push, the full matrix nightly (reviewer);
   the zod 4 smoke test in Claude Desktop (Dependabot PR #5).

## Round 2 (history; merged as `ada2942`) (owner's go 2026-10-03, in advance for every step; branch `fix/round-2-arabic`, from main `bc05275`)
Round 1 is merged (`80d3a00`), the plugin test too (`bc05275`); their branches are deleted. Round 2 is everything
under "Round 2" below, with 2.4. Same method as round 1. The hover and panel scripts are not run while the owner uses
the laptop: those checks come last, after telling him. If a fixture would change: stop for his go.

**State (2026-10-03): built, pushed, CI green, waiting for the reviewer and for two checks that need the owner.**
Measured and planned `2e81750`. R2.1 + R2.2: tests `c2997c9`, code `6aec38a`. R2.3: `7d555b0`, `2d0f64d`. R2.4:
`b96bdde`, `b8b6197`. R2.5: `32b2358`, `94354e8`. R2.6: `7ac3050`, `fa2e44e`. Found by the Desktop check and fixed:
the tooltip chart's title (`28731f6`), the sort fixes and the number column itself (`09d63f5`). R2.7: the Arabic
"All" note is in `reportNotes`; the website's page already says "Sample data (click Refresh once)", so no line added.
- **Tests, main → branch:** pbip 71 → 71 (same count, new rules inside the shared checks), mcp 124 → 149,
  model-health 37 → 48; design-engine 598, theme-generator and lab 883, tools 198 unchanged and passing.
- **Fixtures:** none changed. The website's right-to-left project download changes (page buttons instead of the
  navigator): 8 of the 60 project-fixture builds differ from main, all right-to-left; the 52 others are identical
  (`builder-scripts\r2-proof.mjs`).
- **Desktop:** fifteen reports, results in `scripts/tests/DESKTOP-TESTS.md` ("round 2 built"): R2.1 to R2.5 as
  expected; the validator 0 errors.
- **The two open checks were done in one sitting on 2026-10-03 (the owner hands off): see "round 2 built", "the
  open checks", in `scripts/tests/DESKTOP-TESTS.md`.** Hover and Ctrl+click: as expected. The format script: accepted;
  the % card shows 33.8%, not the 34.0% written below (the value is 0.3378: the expected number was wrong, worked out
  from the rounded 0.34). The sort script on a made-up model with an imported calendar (`tests/6-sort-sample`,
  `builder-scripts\r2-sort-model.mjs`): months and days in order in tables and slicers for sunday, monday and
  saturday, after one "Refresh now". Two proposed fixes wait for the owner: `howToApply` should say "Refresh now"
  when a column is added; the scripts from a TMDL project should keep `lineageTag`.
- **Was left (now done, kept for the record):** (1) hover on a chart and Ctrl+click on the Arabic page buttons
  (`builder-scripts\r1-desk.ps1` uses the mouse and the screen: only when he says the laptop is free); (2) R2.6 in
  TMDL view: paste the format script from `tests/phase2-try/r2-health-fixes.json` (`NO_FORMAT.fixScript`) on
  `5-tmdl-sample`, Preview, Apply, and see the % card show 34.0%; the sort script needs a model with an imported
  calendar (the sample's is a DAX table: steps by hand) — not tried in Desktop yet.
- **Not done from the plan:** M2.2's "rewrite a whole DAX table" was not measured and is not offered: columns of DAX
  tables are steps by hand.
- **Next step:** the reviewer's review and full run, then the merge; the owner's go on the two proposed fixes.

### What the measurements changed in the plan
- **Months and days in order:** a chart can sort by the model's month or weekday number when that number is in its
  tooltip fields, so the report itself fixes its charts, the tooltip's trend chart included, without touching the
  model. Tables and slicers can't: they need the model's sort-by column, which the health check's script sets.
- **Page buttons:** the navigator can't be reordered, so an Arabic report gets single page buttons, first page
  rightmost. An English report keeps the navigator.
- **"All" in slicers** can't be set in a report: it is said in the report notes, nothing is written.
- **The sample download's banner** stays (the other form opens empty); one line of help is added on the page.
- **Display names** need only `displayName` on the projection, everywhere.

### R2.1 The tooltip's second measure (`pbip-bind.js`)
- **Change:** the category tooltip's chart no longer takes a measure that is empty for one item ("Last Ramadan",
  "previous", "vs", year-over-year: the picker's variants): it takes the first KPI that is a base measure other than
  the main one, else the main measure itself.
- **Tests first (`mcp/test.mjs`):** on the sample model the tooltip's bar chart is bound to `Total Sales`, not to
  `Total Sales Last Ramadan`. Before: fails.

### R2.2 KPI titles on a solid design (`pbip-export.js`)
- **Change:** on a solid design a KPI card's reading-start padding is `round(16k)` (16 on 1080, 11 on 720) where the
  page has no accent-bar inset; `cardFit` already reserves it. A transparent design is unchanged.
- **Tests:** `cardStyleProblems` takes the solid rule; the MCP's "Round0" reports are checked with it. No fixture
  changes (the website's download is transparent): proved by building the 60 project fixtures before and after.

### R2.3 Page buttons in reading order (`pbip-export.js`)
- **Change:** in a right-to-left report the page buttons are single `actionButton`s (`PageNavigation`), in the
  navigator's box, the first page rightmost; the current page's filled in the text colour with bold text in the card
  colour, the others outlined; one line each (a button never wraps), text size and box from the same rule as today
  with one line; on the phone one row, shared equally, 10pt. A left-to-right report keeps the navigator.
- **Expected numbers:** Arabic 1080, two pages: 2 buttons 156 x 48 with an 8 gap in the 320 box, 14pt; 720: in the 213
  box, 10pt.
- **Tests first:** `navProblems(files, rtl)` in `report-check.mjs`: a right-to-left report has no navigator, one
  button per main page linked to it, x descending with the page order, the current page's filled; a left-to-right
  report has the navigator. `layoutProblems` and `phoneTextProblems` cover the buttons' sizes. Before: every
  Arabic design with two pages fails.
- **Fixtures:** none (visuals are written by the writer).

### R2.4 Months and days in order in charts (`pbip-bind.js`, `pbip-export.js`)
- **Change:** a bound column may carry `sortBy: { t, c }`, the model's number column for it (month number, year-month
  number, weekday number: chosen by the rules the health check already uses, and only when the column has no sort-by
  column of its own). The writer then puts Min of that column in the chart's `Tooltips` role and sorts by it,
  ascending: line, bar, column charts and the tooltip pages' charts. The sample data needs none (its Month has a
  sort column).
- **Tests first:** `sortProblems(files)`: a chart whose category has `sortBy` has the tooltip field and the sort; on
  the sample model (`mcp/test.mjs`) the charts by Month Name and Day Name and the trend tooltip have them. Before:
  none has.
- **Result notes:** `modelNotes` says for such a column that charts are in order and that tables and slicers need
  the model's sort-by column, with the health check's script.

### R2.5 Arabic display names (`pbip-export.js`, `mcp/server.mjs`; plan 2.1 below)
- **Change:** as 2.1 below: `create_report` takes `displayNames` (`{ "Table[Field]": "name" }`); the name is written
  as the projection's `displayName` and used in our own titles (KPI titles, "X by Y", slicer alt text, tooltip
  titles). In an Arabic report `arabicNames.missing` lists the used fields without a name whose model name has no
  Arabic letter; names for unused fields are listed as not used. No translation is made up.
- **Tests first (`mcp/test.mjs`):** as 2.1 below. Without `displayNames` a report is the same as today apart from
  random ids.

### R2.6 Sort order and formats as health findings with scripts (plan 2.2 below)
- **Change:** as 2.2 below, in `model-health-tmdl.js` (shared): `sortPlan` (the sort column, or the column to add,
  with the week start: Sunday by default, Monday, Saturday), `formatPlan` (the suggested format and its reason per
  measure), and the scripts; `check_model_health` takes `weekStart` and returns `fixScript` and `byHand` on
  `MONTH_SORT`, `NO_FORMAT` and `PCT_FORMAT`; the website uses the same functions. Scores and counts don't move.
- **M2.2, measured without the owner as far as it goes:** a DAX table rewritten whole (`createOrReplace` of the
  table) is checked by loading the result with Microsoft's modelling MCP (offline TMDL import). **Applying a script in
  Desktop's TMDL view needs the owner** (one batched request at the end).

### R2.7 Notes and help
- Arabic reports: `reportNotes` says that Power BI's own words (All, Select all, Search) follow each viewer's Power
  BI language. The website: one line under the project download about "Refresh now".

### The Desktop check at the end (expected results, written before the run)
The MCP on `5-tmdl-sample` and the website's download, 1920 x 1080 and 1280 x 720, English and Arabic, light and
dark; page screenshots through the bridge. Hover and the page buttons' Ctrl+click last, after telling the owner.

| Item | Expected |
|---|---|
| R2.1 | the line chart's tooltip page shows the card and a bar chart of Total Sales by the category, with bars |
| R2.2 | KPI titles on the MCP's reports start 16 (11 on 720) inside the panel, in line with the slicer names; the number centred; the website's download unchanged |
| R2.3 | Arabic: page buttons right to left, the current page's filled, names whole; English: as before. Ctrl+click goes to the page |
| R2.4 | MCP reports: the line chart runs January to December, the weekday chart Sunday to Saturday, the trend tooltip January to December; tables and slicers still A to Z, and the notes say so |
| R2.5 | an Arabic MCP report with names for every used field shows no English field name on any page or tooltip page; with two names left out, those two are English and are the two listed |
| R2.6 | the scripts are accepted (the owner, TMDL view); after them tables and slicers are in order and the % card shows 34.0% (wrong number, found 2026-10-03: the value is 0.3378, so 33.8%) |
| all | Microsoft's validator: 0 errors |

## Round 1 in progress (owner's go 2026-10-03, in advance for every step; branch `fix/round-1-visible`)
The owner approved the round in advance: work through it without waiting between steps; stop only when a measurement
contradicts the plan, a failure could change what Desktop shows, or a decision is his. The split of `pbip-export.js`
is deferred until after the beta (`plan/split-pbip-export` is kept, not merged; when it happens: the Node build
script, the hash check kept in CI, no Desktop check; the dead code stays until then). Code goes into
`assets/js/pbip-export.js` as it is today.

**State (2026-10-03, branch tip after this update; CI green on every pushed commit up to `d286ded`):**
- Step 0: branches deleted on the owner's word that they are merged: `fix/generators`, `fix/report-quality`,
  `docs/desktop-check-phase2`, `docs/session-memory`, `feature/foldable-steps`, `content/ai-ready-article` (each
  checked first: every file's content is in main's history, or the branch is an ancestor of main). **Not deleted,
  waiting for the owner:** `fix/site-tools` (tip `9f2a7a0`) and `docs/phase2-spec` (tip `6273621`): they hold file
  versions that are not in main's history (7 files and 1 file), so "merged" could not be confirmed.
- Item 1 done: `e1efb7f` (terser 5.51.2 pinned for the website; `scripts/check-min.mjs` in CI; all 51 `.min.js`
  reproduce).
- Item 2 done: measured in Desktop 2.158.1177 (`scripts/tests/DESKTOP-TESTS.md`, "round 1 measurements"), `5e515d2`.
- Item 3 done: this plan, `5e515d2`.
- Item 4 done: tests `3774f5a`, code `a0e1213`. Desktop: PASS.
- Item 5 built: tests `d9afcf7`, code `39cb269`. **Desktop: FAIL, stopped for the owner** (below).
- Item 6 done: tests `9053bd8`, code `64eeaf8`.
  Desktop: PASS for the top of every phone page; the part below the first screen was not captured.
- Item 7 done: tests `9ab1d71`, code `d286ded`. Desktop: PASS.
- Item 8 done (no code): the slide-in panel PASSES on the website download, English and Arabic, 1080 and 720.
- Microsoft's validator: 0 errors on all eighteen reports of the check.
- Tests, before -> after: pbip 67 -> 70 checks pass; MCP 120 -> 124 pass; design-engine 598, theme-generator and
  theme-generator-lab 883, model-health 37 pass. No fixture recaptured. Expectations changed, each because the change
  requires it: the guard's navigator width on 1080 (320 -> 422); the MCP's "a visual at exactly each slot's box" lets a
  header text box start lower; a report on a model with a month has 2 tooltip pages, 4 entries in `pages.json` and 9
  cards in the default report; on a solid design the Header and Filters groups have their background off.
- `pbip-export.min.js?v=20261003d`, `pbip-bind.min.js?v=20261003a`, `theme-generator.min.js?v=20261003d`.

**The owner's decisions on the report (2026-10-03):** (1) item 5: the bar chart by month on a 320 x 410 trend tooltip
page: tests `18e8382`, code `9b0ceed`; then a Desktop check of the tooltip on every chart (English and Arabic,
1080 and 720, light and dark, wide and narrow measures). (2) `fix/site-tools` and `docs/phase2-spec` deleted (the
reviewer checked: main has newer versions of both). (3) The phone layout below the first screen and the unmeasured
phone text: after the beta (open items). (4) Four seen items added to round 2 (2.4). When item 5 passes and CI is
green the reviewer merges round 1. **Right after round 1 (ROADMAP, research of 2026-10-03):** one Desktop sitting
testing Microsoft's own `powerbi-authoring` plugin on an Arabic model, recorded in `DESKTOP-TESTS.md`; no code.

**Item 5 done (2026-10-03):** the trend tooltip is a bar chart by month on a 320 x 410 page. pbip 70 and MCP 124
checks pass; design-engine 598 and theme-generator 883 (twice) pass; no fixture change. Desktop 2.158.1177, twelve
reports (`DESKTOP-TESTS.md`, "the trend tooltip as a bar chart"): 12 months whole with their values on every one,
English and Arabic, 1080 and 720, light and dark, with "0.24M", "1.0K" and "22K" values: PASS. Hovering every chart
passed on the Arabic 1080 report; on the other eleven it was not done (the laptop's screen was in use), which the
report says. **Round 1 is complete and waits for the reviewer to merge.** `pbip-export.min.js?v=20261003e`,
`theme-generator.min.js?v=20261003e`.

**Microsoft's `powerbi-authoring` plugin tested on an Arabic report (2026-10-03, no code):** recorded in
`scripts/tests/DESKTOP-TESTS.md` with its limits and a screenshot (`tests/6-ms-plugin/`). In short: it does not mirror
the layout; Arabic titles appear only when the agent writes them and model names stay English; it has no Hijri or
Ramadan calendar (it used ours); it checks the schema and screenshots, not the numbers; its own base theme fails its
own validator. **The owner decides the repositioning from it.** Next for the builder: round 2, with the owner's go.

(The block below is the state the owner decided on; kept for the record.)

**Stopped on item 5 (the rule: a failure that could change what Desktop shows; and the fix is the owner's choice).**
The trend tooltip works (the right page on each chart, filtered to the hovered item), but its column chart shows all
12 months only while the value axis's labels are short. With the reports' real measures ("100K", "0.4M", "40%") it
shows 11 upright names and hides the last month behind a scrollbar (English website download; `DESKTOP-TESTS.md`,
"round 1 built"). My measurement for the plan used a measure with short labels, so it missed this. Measured after the
failure: no column or line chart shows 12 month names whole at 296 x 184 for every measure (value axis off: no
scrollbar, but the first name is always cut, "J..." and "..." for "يناير"). A bar chart by month does, at 296 x 310.
**The owner's choice:**
1. **(proposed) The trend as a bar chart by month** (today's tooltip chart's settings), the trend tooltip page
   320 x 410 instead of 320 x 284: 12 names whole, each value beside its bar, English and Arabic.
2. A column chart with the value axis off, 320 x 284: 12 months, no scrollbar, the first month's name always cut.
3. Take the trend out again (the tooltip as before round 1: the card and the bar chart by category).
Nothing was changed after the failure was seen: the branch still has the column chart with its value axis on.

**The exact next step:** the owner picks 1, 2 or 3. Then, on this branch: the test first (`tooltipPageProblems`: the
trend chart's type, settings and the page's size), the code in `pbip-export.js` (the trend chart, and for 1 the trend
page's height), `pbip` and `npm test` in `mcp/`, the `.min.js` and `?v=`, and one Desktop pass on four reports
(website and MCP, English and Arabic, 1080) hovering every chart: 12 months whole. Also open, for the owner:
`fix/site-tools` and `docs/phase2-spec` (delete or keep), and whether the phone layout below the first screen needs
its own check (the capture script would have to scroll the phone canvas). Then the reviewer reads the branch; nobody
merges their own work.

### What the measurements changed in the plan
- **"Executive..."** is not a width problem alone: a page button wraps to two lines only when two lines fit its
  height, and Segoe UI needs 3.5 x pt for two lines (Tahoma 3.2); the code assumed 1.6 x pt a line. So the fix is the
  line rule (1.8 x pt a line), which makes the 1080 button one line and as wide as its name needs.
- **The title is already centred** (within 3) wherever its size is 0.42 x its box; it is "Your logo" that sits high
  (7 on 1080, 10 on 2160), and a title held at the 60pt limit. Logos are centred already. The fix moves only those.
- **The monthly trend in the tooltip is a column chart with its value axis on**, axis text 8pt: the only form that
  shows all 12 month names whole at 296 x 184 in English and Arabic.
- **Phone:** sizes in `mobile.json` work for every visual, each with the selector its property needs on the page; the
  axis text of charts and the text of tables need them too (not in the earlier plan).
- **Header and rail on a solid design:** an empty text box left to the theme, behind each group.
- The three unrecorded rules: the Reset icon follows the button's height (0.88 x it), not the text size; a button's
  text is 0.38-0.42 em a character (0.45 in the code is safe); the phone canvas is 323 wide. No code change.

### Item 4: page buttons whole, and the header's text centred (`pbip-export.js`; tests in `report-check.mjs`)
- **4a, change:** in the page-button rule the number of lines is `min(2, max(1, floor(h / (1.8 x pt))))` instead of
  `floor((h - 2) / (1.6 x pt))`. Nothing else in the rule changes.
- **Expected numbers (two pages, default header):** 1920 x 1080 English: 14pt, one line, the navigator **422** wide
  (today 320: 2 x max(140, ceil(10.27 x 17 + 16) = 191) + 40); Arabic: 320 as today ("ملخص تنفيذي" needs 129, under
  140); 1280 x 720: 299 as today; 3840 x 2160: 29pt, one line, 868 (today two lines were assumed in 96, which need
  102).
- **Tests first:** `layoutProblems` counts a page button's lines by the measured rule; before the code it fails on
  every English design at 1080 and up ("page names don't fit"). The guard test's pinned `nav: 320` on 1920 x 1080
  becomes 422: the one expected number this fix exists to change.
- **4b, change:** a header text box whose text's middle (1.2 x pt below the box's top) is above the middle of its
  slot is moved down and made shorter by `min(round(h / 2 - 1.2 x pt), h - (10 + 1.8 x pt))` when that is positive;
  its slot in the engine and the header group's box are unchanged.
- **Expected numbers:** "Your logo": 1080: 14pt, down 7 (48 -> 41 high); 720: 10pt, down 4 (32 -> 28); 2160: 29pt,
  down 13 (96 -> 83). The title: unchanged on all three (0); moved only where the 60pt limit holds its size.
- **Tests first:** `headerProblems(files)` in `report-check.mjs`: each text box in the header group has its text's
  middle within 3 of the group's middle, or can't move (the box is as short as its text allows). Before: every design
  with a header and no logo fails on "Your logo".
- **Fixtures:** none change (positions are written by the report writer; `cases.json` and `project-pages.json` hold
  the engine's slots).

### Item 5: the tooltip shows the hovered item's trend by month (`pbip-export.js`, `pbip-bind.js`)
- **Change:** the bind's `tip` gets `date`: the month field (the sample's Month; in a user's model the time axis when
  it is a month column, otherwise none). With it the report has two tooltip pages, both 320 x 284 with the card on
  top: the **trend** page, a column chart of the card's measure by month (axis text 8pt, value axis on at 8pt, no axis
  titles), linked from every chart that is not itself by the time axis; and today's page (the bar chart by the second
  category), linked from the charts that are by the time axis (the line chart), where a monthly trend would be one
  column. Without `tip.date` the report is as today.
- **Expected numbers (the default two-page sample report):** 4 charts: the line chart linked to the category page,
  the bar chart and the two column charts to the trend page; 2 tooltip pages; the trend chart 296 x 184 at 12, 92.
- **Tests first:** `tooltipPageProblems` accepts the two kinds of tooltip chart and checks each one's settings;
  `tooltipProblems` checks that a chart by the time axis is linked to the bar page and the others to the trend page;
  `pbip.mjs` (54 designs, both languages) and `mcp/test.mjs` (the report on the sample model has 4 pages in
  `pages.json`, today 3). Before: no trend page anywhere.
- **Fixtures:** none change (the sample's bind is made inside the writer; the page's build input is the same).

### Item 6: the phone layout's text (`pbip-export.js`, `mobile.json`)
- **Change, per visual on the phone (the same on every page size):** header title: its paragraph at 14pt, or the
  largest size down to 8 whose text fits 323 at 0.55 em a character; page buttons 10pt on the three states; slicer
  header and items 10; buttons 10 (under `default`); chart, table, gauge and text-slot titles 12; the axis text of
  line, bar and column charts 8; a table's header, values and total 8; cards as today (value 20, title 10) with the
  container padding written **without** the selector, 5 on every side, so the page's padding (and its accent-bar
  side, 52 on 2160) no longer applies on the phone.
- **Tests first:** `phoneTextProblems(files)` in `report-check.mjs`: for every visual in the phone layout the size in
  force (the `mobile.json` entry with the selector that works, else the page's) fits its phone box by the measured
  rules (text box 10 + 1.8 x pt, slicer 16 + 4 x pt, button 6 + 1.6 x pt, page buttons two lines at 1.8 x pt), titles
  at most 12, axis and table text at most 10, the card's padding without a selector. On the 54 designs plus the 16
  layouts on 640 x 360 and 3840 x 2160 (`pbip.mjs`) and the MCP's reports. Before: every design with a slicer fails at
  1080 and up, every 2160 design on everything.
- **Not covered (not measured):** data labels, legends and the text inside donut, funnel, treemap, map and gauge.
- **Fixtures:** none change.

### Item 7: the header and the filter rail as panels on a solid design (`pbip-export.js`)
- **Change (solid designs only; a transparent design is untouched):** the Header and Filters groups get
  `background: show false`, and behind each an empty text box left to the theme (no background, border or shadow
  entry; title off; no `mobile.json`): for the rail at the group's box; for the header at the group's box grown by 12k
  at each side and 6k above and below, so it lines up with the rail and the cards (24 from the page's edge on 1080).
- **Tests first:** `panelProblems`: on a solid design each of the two groups has its background off and exactly one
  panel text box at that box, under the group in the layer order; on a transparent design there is none. The check's
  old expectation (those groups carry no objects on a solid design) changes with the change.
- **Fixtures:** none change (the website's download is always transparent: byte for byte as before, proved by
  building the 60 project fixtures with the writer before and after).

### Item 8: the slide-in panel in Desktop (no code unless it fails)
The website download with the panel, English and Arabic, 1080 and 720: Filters whole in the header, the panel opens
with Ctrl+click, Close whole, three slicers and Reset whole, a slicer choice stays after Close, mirrored in Arabic.
Expected sizes: the table under "1.2" in the round 1 plan below.

### The Desktop check at the end (expected results, written before the run)
Reports built from the branch: the website's sample download (transparent) and the MCP on `5-tmdl-sample` (solid), at
1920 x 1080 and 1280 x 720, English and Arabic, light and dark; one 3840 x 2160 English and Arabic; the phone layout
of each through `phone-check.ps1`.

| # | Checked | Expected |
|---|---|---|
| 4a | page buttons | "Executive summary" whole on one line on the English 1080 download (navigator 422 wide) and on 2160; Arabic and 720 as before; the MCP's (Tahoma) whole |
| 4b | "Your logo" and the title | "Your logo" in the middle of the header's height (within 3) on 1080, 720 and 2160; the title where it was |
| 5 | every chart hovered | bar and column charts show the card and the measure by month, 12 names whole (English and Arabic); the line chart shows the card and the bar chart by category as before |
| 6 | phone layout, every page | title, page buttons, slicers, Reset, chart and table titles, axis text and table text whole, no "..." from size, no overlap; cards whole with "Avg Order Value" whole on 2160 |
| 7 | solid design (the MCP) | header and filter rail are rounded panels with the cards' shadow, lined up with the cards; nothing else moved; the website's download unchanged |
| 8 | the slide-in panel | as item 8 above |
| all | Microsoft's validator | 0 errors on every export |

## The rounds: what was built, and the plans for rounds 1 and 2 (builder)
Rounds 1 and 2 below are plans: nothing in them is built. Each round starts with the owner's go, on its own branch
from main. Modules are named as in `mcp/ROADMAP.md` (sizes, visual builders, page assembly, phone layout); until the
split merges all of them are still `assets/js/pbip-export.js`. Every round: measure in Desktop first; failing tests
first; only the suites the change touches (`pbip`, `design-engine`, `theme-generator`, `model-health`, `npm test` in
`mcp/`); reports built with the branch's `mcp/server.mjs` over stdio; Desktop 2.158.1177 on 1920 x 1080 and
1280 x 720, English and Arabic, plus what the round touches, judged from full-size crops; results into
`scripts/tests/DESKTOP-TESTS.md`; only our own sample model (`<tests folder>\5-tmdl-sample`) and the website's
sample data. Stop when a failure could change what Desktop shows; otherwise note it and continue (root `CLAUDE.md`).

#### `fix/mcp-visual-style`: merged into main as `e8fe171`; how it was built
Commits (from main `99d1cee`): plan `ff25e53`, tests failing first `b6132f2`, code `f0142b4`.
- **Change (`assets/js/pbip-export.js`):** when the theme it is given has solid visuals (its `"*"` visuals have a
  background), the visuals that sit on a panel (KPI cards, charts, tables, text slots) get no `background`, `border`
  or `dropShadow` entry, so the theme draws their panel, and the group around the KPI cards gets
  `background: show false`, so no band lies behind them. With a transparent theme everything is written as before.
  No new input: solid is read from the theme. `mcp/server.mjs`: `create_report`'s description, its message for a
  design with transparent visuals, and a new `panels` line in the result say what the report shows.
  `pbip-export.min.js?v=20261002a`, `theme-generator.min.js?v=20261002a`.
- **Measured first in Desktop 2.158**, then checked on nine reports (`scripts/tests/DESKTOP-TESTS.md`): PASS. Solid
  designs through the MCP show a panel behind every card, chart and table, English and Arabic, light and dark; the
  website's download is the same as in round 0.
- **Tests, before -> after:** pbip 67 checks, 1 failing (the 82 builds with a solid theme) -> 67 pass; MCP 120
  checks, 6 failing -> 120 pass; design-engine 598, theme-generator 883 and theme-generator-lab 883 pass.
- **Fixtures: none change.** Proof in commit `f0142b4` (`builder-scripts\mvs-proof.mjs`, the old and the new writer on
  the same inputs with the same ids): the 60 project fixtures' builds, which are what the website hands the writer,
  are byte for byte the same (4369 files); in the 41 solid designs built with their own theme the only changes are
  the three entries removed from cards, charts, tables and text slots and the background switched off on the KPI
  group; the 13 transparent designs are byte for byte the same.
- **Microsoft's validator:** 0 errors on all nine reports of the check.
- **Seen, now in round 1 (item 1.7, owner 2026-10-02):** on a solid design the header band and the filter rail have
  square corners and no shadow, unlike the panels beside them (a group has no border or shadow setting).

#### The plan `fix/mcp-visual-style` was built from (owner's go 2026-10-02; reference, its state is above)
`fix/card-theme-radius` is merged into main as `99d1cee` and its branch deleted; the validator stays a dev dependency
of the MCP's tests; the tag `round-0-tooltip-logo-table` stays. This branch is from main.

**The problem.** On the MCP's reports no visual has a panel: charts, tables and cards sit straight on the page,
although the report's theme has solid visuals and `create_report` says the theme gives the visuals "their own solid
cards to keep them visible".
- **Where it is switched off:** `assets/js/pbip-export.js`, `frame()`: every visual's `visualContainerObjects` gets
  `background`, `border` and `dropShadow` with `show: false`, whatever the design. `visual.json` outranks the theme,
  so the theme's solid background, rounded border and shadow never show.
- **Why it was written so:** the website's download always carries a background image that draws the panels, with a
  theme whose visuals are transparent (`theme-generator.js` forces `transparent` for the project's theme); there,
  off is right. The MCP has no background image and makes the theme solid, and then the same switch hides the cards.

**The rule.**
- **Transparent design** (the background image draws the panels; the theme's visuals are transparent): the visuals'
  background, border and shadow stay off, as today. This is every website download: nothing in it changes.
- **Solid design** (no panels in a background image; the theme's visuals are solid): the visuals that sit on a panel
  are left to the theme: `visual.json` writes no `background`, `border` or `dropShadow` for them, so the theme's card
  colour, rounded corners and shadow show, as the website's own preview of a solid design shows them.
- **How the report writer knows:** from the theme it is given: solid when `theme.visualStyles["*"]["*"].background[0]
  .show` is true. No new input, so the page's build input and the 60 project fixtures are untouched.

**Expected result per visual, solid design (to be confirmed by the measurement, then pinned by tests):**

| Visual | Transparent design (today, unchanged) | Solid design (after) |
|---|---|---|
| KPI cards | on the image's panels, no fill of their own | each card its own panel from the theme (card colour, rounded, shadow if the design has it); the "KPI cards" group draws no band behind them |
| charts, table, text slot | on the image's panels | each its own panel from the theme |
| slicers and Reset in the filter rail | on the image's rail panel | inside one rail panel (the "Filters" group, from the theme); the slicers themselves without panels |
| header: title, page buttons, logo | on the image's header band | on one header band (the "Header" group, from the theme), without panels of their own, as today |
| buttons (Reset, Filters, Close), page buttons | their own fill, by design | the same |
| slide-in panel | its own card (written in `visual.json`) | the same |
| tooltip page | the page's card colour; its visuals without panels | the same |

**Website download:** follows the rule already (always the transparent side); checked by a test that its `visual.json`
files are byte for byte what they are today apart from random ids.

**Steps:** this plan committed; measured in Desktop (one solid design through the MCP as it is and with the candidate
change, one transparent design as the website's download; English and Arabic, 1080, light and dark); tests first
(failing); code in `pbip-export.js`, and `create_report`'s description and message in `mcp/server.mjs` saying what the
report shows; `pbip`, `design-engine`, `theme-generator`, `npm test`; `.min.js` and `?v=`; fixtures: none expected to
change (stated with proof); CI green; the Desktop check; the report. Stop if a failure could change what Desktop
shows.

#### `fix/card-theme-radius`: merged into main as `99d1cee`; how it was built
Round 0 is merged into main as `14dd467`; its branch tip is kept as the tag `round-0-tooltip-logo-table` (the fixture
proof is in commit `0b9c813` there); `fix/tooltip-logo-table` and `plan/next-rounds` are deleted.
Commits on `fix/card-theme-radius` (from main): tests failing first `51cdf5b`, code and fixtures `9057a6b`.
- **Change:** in `design-engine.js` (`buildTheme`) the card visual's theme entry has the border without `radius`;
  every other visual type keeps its radius. `design-engine.min.js` rebuilt, `?v=20261001c` on both generator pages.
- **Measured first in Desktop 2.158** (`scripts/tests/DESKTOP-TESTS.md`): a report whose theme has the card's radius
  removed is byte for byte the same on screen as one with it, light and dark, also for a card left to the theme.
- **Tests, before -> after:** MCP 114 checks, 4 failing -> 114 pass; design-engine: the new check failed on 41 of 54
  designs -> 598 pass; pbip 66 pass; theme-generator and theme-generator-lab 883 pass. One existing check changed as
  the change requires (`theme-generator.mjs`: the radius on every visual type but the card visual).
- **Microsoft's validator:** 0 errors on the MCP's exports, now also checked in `mcp/test.mjs` on every run. For that
  the validator (Microsoft's report authoring CLI, MIT) is a dev dependency of the MCP's tests, pinned to 0.4.0; it is
  not shipped with the MCP. **Needs the owner's yes** (the alternative: keep it as a check on the laptop only).
- **Fixtures (owner's go):** the design fixtures recaptured; proof in commit `9057a6b`: 13 cases byte for byte the
  same (the 13 designs with transparent visuals), 41 changed (the 41 with solid visuals) by the removed
  `cardVisual` radius only. The 60 project fixtures are not recaptured and still match (their theme is always
  transparent).
- **Desktop look after the code:** four MCP reports, English and Arabic, 1080, light and dark: cards and everything
  else as before (pixel comparisons in `DESKTOP-TESTS.md`).
- **Seen, not assigned yet:** on the MCP's reports every visual is drawn without a panel, because `visual.json`
  switches the container's background, border and shadow off, so the solid theme `create_report` promises never
  shows. Needs the owner's decision on its round.

#### Round 0: merged into main as `14dd467` (tag `round-0-tooltip-logo-table`); how it was built
Commits: decisions `bda14f4`, tests failing first `199eab7`, code `93eb7ff`, Desktop results `92581ee`, main merged
`4cb35c1` (CI now runs on every push), project fixtures recaptured `0b9c813`.
- **Tests, before -> after:** pbip 66 checks, 18 failing -> 66 pass; MCP 110 checks, 19 failing -> 110 pass;
  design-engine 597 checks, 7 failing -> 597 pass (after the recapture); theme-generator 879 and
  theme-generator-lab 879 pass. No full run on the laptop: CI runs all 16 suites and the MCP checks on the branch.
- **Fixtures (owner's go 2026-10-01):** the 60 project fixtures recaptured from the lab page, because the page now
  hands pbip-export one new field per page, `kpiInset`. Proof in commit `0b9c813`: in all 60 cases the build input is
  equal once `kpiInset` is left out; it is the only field that differs (114 pages); languages, options and every page
  background are equal. The 54 design fixtures are untouched and match the live and the lab page. The engine check in
  `design-engine.mjs` builds the same page object as the page does (with `kpiInset`).
- **Desktop 2.158.1177, ten reports** (`scripts/tests/DESKTOP-TESTS.md`, "round 0 built"): changes 1 to 6 PASS in
  English and Arabic, 1080 and 720, light and dark, website download and MCP. One expected number corrected: the tall
  logo's box is 20 x 48 mirrored on 1080 (19 in English; the engine rounds edges, not sizes).
- **Microsoft's validator:** the six website exports pass with 0 errors. The four MCP exports fail with 1 error,
  "Unknown theme property border.radius for cardVisual", which predates this round: **its own round, right after this
  one** (below).
- **Expectations changed in tests, each for a stated reason:** the theme inside a project carries its file name
  (owner's change 7; `mcp/test.mjs`); `.platform` is allowed in the names check like `.gitignore` (owner's change 8;
  `pbip.mjs`); the engine check carries `kpiInset` (the recapture); in the new tests the Arabic tall logo is 20 wide
  and a new visitor's download has the side bar's inset.
- **Rule from now on (owner 2026-10-01, in the root `CLAUDE.md`):** stop when a failure could change what Desktop
  shows; otherwise note it and continue.

#### The plan `fix/card-theme-radius` was built from (reference; its state is above)
- **Problem:** Microsoft's validator fails on every export whose theme has solid visuals (all the MCP's reports):
  `PBIR_THEME_VISUAL_PROP_UNKNOWN`, "Unknown theme property border.radius for cardVisual". `design-engine.js` writes
  the rounded container border (`border: [{ show, color, width, radius }]`) for every visual type, and inside a theme
  the card visual's `border` is the card's own border object, which has no `radius`. Themes with transparent visuals
  (the website's project download) write `border: [{ show: false }]` and pass.
- **Change (`assets/js/design-engine.js`, `buildTheme`):** the card visual's entry gets the border without `radius`;
  every other type is unchanged. `.min.js` and `?v=` on both generator pages.
- **Measure first (Desktop, one look):** an MCP report today and with the entry changed by hand: are the KPI cards'
  corners the same (expected: yes, the property is unknown to the card and so does nothing today), and does the
  card's own border show (it is written with `show: true` in the card colour)? If the corners change, stop and report.
- **Tests first (failing):** `design-engine.mjs`: no theme has `radius` in `visualStyles.cardVisual`; `mcp/test.mjs`:
  the registered theme of a report with solid visuals has none. A validator run on one MCP export: 0 errors.
- **Fixtures:** the theme JSON of every design with solid visuals changes: 41 of the 54 design fixtures (and the
  project fixtures that hold those themes). Recaptured with the owner's go, with the proof in the commit: in each
  changed theme the only difference is `visualStyles.cardVisual["*"].border[0].radius`, and the 13 designs with
  transparent visuals are byte for byte the same.
- **Desktop check:** MCP reports in English and Arabic at 1080 and 720, and one website download with solid visuals:
  card corners and everything else as before; Microsoft's validator passes on all of them.

#### Where every "Seen, not in scope" item now lives (owner 2026-10-01)
- **Round 1** (with the phone text and the slide-in panel, see 1.1 to 1.7 below): the header band and the filter
  rail on a solid design (1.7, owner 2026-10-02); the page button "Executive…" on the
  website's 1080 download; the header title and logo centred vertically in their boxes on big pages; phone padding at
  3840 x 2160 with a side bar; the tooltip chart as the hovered item's trend by month.
- **Round 2** (see 2.1 to 2.3 below): English names in Arabic reports; day and month sorting; the "calculated tables
  need refreshing" message on the sample download.
- **After the beta:** the 640 x 360 items (open items, "Small-page round").
- **`fix/card-theme-radius`:** the validator's theme error on the MCP's exports.

#### Round 0: GO (owner, 2026-10-01). Branch `fix/tooltip-logo-table`, from `plan/next-rounds`
The reviewer has not started the split, so `assets/js/pbip-export.js` is changed as it is today; the split comes right
after this round merges. Where this block differs from the measured plan below it, this block wins.

**The owner's decisions on the five questions:** (1) tooltip transparency is dropped: Desktop doesn't support it;
(2) the tooltip page grows to 320 x 284, so 6 rows fit; (3) a tall logo keeps its own ratio, and when a logo is taller
than wide the report notes say "This logo is tall; a horizontal version will read much better in the header.";
(4) card title: top margin `round(12k)` (12 at 1080, 8 at 720) and a side padding that keeps the title clear of the
accent bar (26 at 1080, 17 at 720), both reserved by `cardFit`; (5) the table's own fill stays.

**Eight changes, in this order:**
1. Tooltip link: `visualTooltip.type` `'Canvas'` on every chart of every main page.
2. Logo: width from the image's ratio, no minimum, `image.fit: 'Fit'`, the new `logo` input on `create_report`, and
   the tall-logo note (`create_report`'s notes; on the website a line under the logo's file name).
3. Tooltip chart: a bar chart, axis text 8pt, 40% axis room, value axis off, data labels on (8pt), on a 320 x 284
   tooltip page (card 296 x 76 at 12, 8; chart 296 x 184 at 12, 92: floor((184 - 46) / 22) = 6 rows).
4. Table header alignment: `columnFormatting` per column with "Apply to header"; text left, numbers right, mirrored
   in Arabic.
5. Card fill off: `fillCustom` `show: false`, no selector.
6. Card padding and spacing written without the selector: top `round(12k)`; on the side of a side accent bar the
   bar's end plus `round(5k)` (26 / 17); the other sides `P`; `cardFit` reserves all four.
7. The theme inside the project carries the name `report.json` references (the theme's file name with `.json`), as
   Microsoft's theming reference requires; the theme download on its own keeps its name.
8. A `.platform` file in the report folder (and in the sample model's folder), as Microsoft's scaffold writes it.
   Microsoft's validator (`powerbi-report-author validate`) must pass on our export.

**Recorded elsewhere:** the phone card padding selector goes to round 1 (in this round the phone keeps what it
writes today); "calculated tables need to be manually refreshed" on the sample download is an open item.

**Steps:** this block committed and pushed; the tests, failing, committed; the code (`pbip-export.js`,
`design-engine.js`, `pbip-bind.js`, `mcp/server.mjs`, `theme-generator.js` for the logo's ratio and note); only the
touched suites (`pbip`, `design-engine`, `theme-generator`, `npm test` in `mcp/`); the `.min.js` files and `?v=`;
the Desktop check; the validator; this file updated, committed and pushed. Stop at the first real failure.

**Tests written first, with what must fail before the code:**

| Test | Where | Before the code |
|---|---|---|
| every chart linked with `Canvas` to a tooltip page; nothing else linked | `report-check.mjs` `tooltipProblems`; `pbip.mjs`, `mcp/test.mjs` | the default two-page report: 4 of 4 charts |
| `imageSize` (PNG, JPG); the logo box from the ratio; `image.fit` `'Fit'`, no `imageScaling`; the `logo` input, its refusals, the tall-logo note | `design-engine.mjs`, `pbip.mjs`, `mcp/test.mjs` | no `imageSize`; every report with a logo; no `logo` input |
| the tooltip page is 320 x 284, its chart a bar chart with the four settings, 6 rows | `report-check.mjs` `tooltipPageProblems` | every report with a bound tooltip page |
| each table column has its `columnFormatting` entry | `report-check.mjs` `tableProblems` | the default report: 8 of 8 columns |
| each card: `fillCustom` off without a selector; `padding` and `spacing` without a selector; top `round(12k)`; the bar side clear; fits its box | `pbip.mjs` `cardProblems`, `mcp/test.mjs` | the default report: 8 of 8 cards |
| the project's theme `name` = `customTheme.name` = the item's `name` = its `path`, ending `.json` | `report-check.mjs` `projectProblems` | every project |
| `.platform` in the report folder (type Report, the report's name, a GUID) | the same | every project |

**The Desktop check (expected results, written before any run).** Power BI Desktop 2.158.1177, test reports only,
closed without saving. Ten reports: the website's sample download for English and Arabic at 1920 x 1080 and
1280 x 720, light (Corporate, side accent bar), each with one logo (EN 1080 wide, AR 1080 tall, EN 720 square,
AR 720 wide); EN 1080 and AR 1080 dark (DataArcus, accent bar on top) without a logo; and through the MCP on our
sample model (`5-tmdl-sample`) EN 1080 with the tall logo and AR 720 with the square logo, plus EN 1080 and AR 1080
without one. Pages at 2x, hovers from the screen, judged from full-size crops.

| # | Checked | Expected |
|---|---|---|
| 1 | every chart on both pages hovered (`m0-hover.ps1`) | our tooltip page shows on each (4 charts: page 1 line, bar, column; page 2 column), filtered to the hovered point; cards and tables show their usual hover |
| 2 | header logo: wide, square, tall | undistorted and whole; boxes (page units) wide 192 x 48 at x 1692 on 1080 and 128 x 32 at x 1128 on 720 (Arabic: x 36 / 24); square 48 x 48 at x 1836 and 32 x 32 at x 1224; tall 19 x 48 at x 1865 (Arabic x 36; corrected after the build: 20 x 48 there, the engine rounds edges), thin as measured; title and page buttons whole, not touching the logo; the tall logo's note in the MCP's result; without a logo the placeholder as before |
| 3 | the tooltip (hover and the page) | 320 x 284; the card as before; a bar chart with every category name whole and horizontal and its value beside the bar, 4 rows (the sample's 4 categories), no scrollbar, no "…"; English and Arabic |
| 4 | every table | each header over its own values: English text left, numbers right; Arabic text column (rightmost) right, numbers left; columns fill the width |
| 5 | KPI cards on the website download | the accent bar whole (left in English, right in Arabic, on top on the dark design); panel border and shadow visible |
| 6 | KPI cards | the title clear of the panel's top (12 on 1080, 8 on 720) and clear of the side bar (26 / 17); the number whole and centred in what is left; value sizes 42 on 1080 and 28 on 720, the tooltip card 20 |
| 7, 8 | Microsoft's validator on each export; the theme in Desktop | `validate`: 0 errors; colours, fonts and text sizes as before (the theme is applied) |
| all | everything else on both pages | unchanged: header, slicers, Reset, page buttons, chart positions, phone layout without overlaps |

#### Round 0, the measured plan per change (reference; the GO block above has the final decisions)
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

**1.1b The phone card padding selector (owner 2026-10-01, from round 0).** `mobile.json` writes the card's container
padding with the `default` selector, which Desktop ignores on the page (measured in round 0). Check it in the mobile
layout and write it without the selector if it is ignored there too, with `cardFit` on the phone box unchanged.

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

**1.3 The page button "Executive…" cut on the website's 1080 download (owner 2026-10-01, seen in round 0).** On
1920 x 1080 with Segoe UI the first page button reads "Executive…"; on 1280 x 720 it is whole, and on the MCP's
reports (Tahoma) it wraps on two lines and is whole. The width rule assumes a long name wraps on two lines when the
header holds them. **Measure first (Desktop, English and Arabic, Segoe UI and Tahoma, 1080 and 720):** when a page
button's text wraps and when it is cut, and the width a name needs on one line at each size. Then fix the
page-button width rule (module: sizes, page assembly) with a failing test in `report-check.mjs` first.

**1.4 The header title and logo centred vertically in their boxes on big pages (owner 2026-10-01).** They sit at the
top of their boxes. Measure what a text box and an image offer for vertical alignment in Desktop, then centre them
(module: visual builders), with the placeholder "Your logo" included.

**1.5 Phone padding at 3840 x 2160 with a side bar (owner 2026-10-01, with 1.1 and 1.1b).** Since round 0 the card's
page padding is applied, and the phone takes it (top 24, side 52 on 2160), which leaves a phone card too little room.
Fixed together with 1.1b (the phone's own padding without the selector) and checked on the phone at 2160.

**1.6 The tooltip chart shows the hovered item's trend by month (owner's choice 2026-10-01).** The tooltip's chart
becomes the measure by month for the hovered item; when the page's charts are themselves by month, it falls back to a
second category. **Measure first:** month labels at tooltip size (320 x 284), English and Arabic, as a line or column
chart and as a bar chart: which names are whole, and how many months fit. Module: page assembly (the tooltip page);
`pbip-bind.js` for the choice of field.

**1.7 The header band and the filter rail on a solid design (owner 2026-10-02, seen in `fix/mcp-visual-style`).** On
a solid design (the MCP's reports) the cards, charts and tables are rounded with a shadow, drawn by the theme, while
the header band and the filter rail have square corners and no shadow: they are drawn by their groups, and a group
has no border or shadow setting (only a background, which can be switched off). **Measure the options in Desktop
first, then plan:** for example a rounded shape behind the header and behind the rail, styled from the theme's panel
settings (card colour, the design's corner radius, its shadow), with the groups' own backgrounds switched off; also a
text box used as the panel, as the slide-in panel's card already is. For each option, in English and Arabic, light
and dark, at 1080 and 720: does it match the panels beside it (corners, shadow, colour), does it stay behind the
title, page buttons, logo, slicers and Reset, and how does it behave in the phone layout and in the selection order.
A transparent design (the website's download) is not to change: there the background image draws the band and rail.

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

**2.3 The sample download opens with "One or more calculated tables need to be manually refreshed" (owner
2026-10-01).** Find out why (the sample table is a DAX table in a `model.bim` without data) and avoid it if the
project can carry what Desktop needs; otherwise add one line of instructions to the download (the README already
says to refresh once; put it where the visitor sees it). Measure in Desktop first: what removes the banner.

**2.4 Seen in round 1, added to round 2 (owner 2026-10-03).** Each is measured in Desktop first, then planned:
- **The slicers of Arabic reports show "All" in English** (Power BI's own text for no selection): find out whether a
  report can change it (a slicer setting, the report's or the model's language), or say so in the report notes.
- **In an Arabic report the first page's button is the leftmost**; it should be the rightmost, so the page buttons read
  right to left like the rest of the header. Measure what orders a page navigator offers.
- **KPI titles start close to the panel's edge on the MCP's solid reports** (the card's side padding there is the small
  default; the website's download has the accent bar's inset).
- **The tooltip shows a measure that is empty for one month**: on the line chart's tooltip the bar chart of a
  "Last Ramadan"-type measure is blank for the hovered month. Choose the tooltip's second measure so it has values
  in that context, or leave the chart out when it would be empty.

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

#### The owner's answers to the five round 0 questions (2026-10-01)
In the GO block of round 0: transparency dropped; tooltip page 320 x 284; tall logos keep their ratio, with a note;
card title margins 12k and the bar-side padding; the table's fill stays. No decision is open.

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
- **Phone layout, after the beta (owner 2026-10-03):** check the phone layout below the first screen in Desktop (the
  charts and tables of the real pages; `phone-check.ps1` has to scroll the phone canvas), and measure the phone text
  that round 1 did not: data labels, legends, and the text inside donut, funnel, treemap, map and gauge.
- **Small-page round, with the 640 x 360 cards (after the beta, owner 2026-10-01):**
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

- **Round 2's "Seen, not in scope" (2026-10-03, triage with the owner):** tables and slicers list months and days A-Z
  until the model has sort-by columns; "All" in English in Arabic slicers (no property exists); the 4th KPI shows 0.34
  (no format in the model); no "Total" word in Arabic table totals; a chart title mixing Arabic and an English field
  name draws the English word first; slanted month names at 720; the page 1 table cuts its last row or scrolls; the
  website download's "calculated tables need refresh" banner; the website's card title close to the accent bar;
  `create_report` shortens a long report name ("... Names les"); the website's health page has no format script yet;
  the tooltip page can cover the ribbon near the top right; the website's Arabic tooltip chart title has the second
  measure only, without "by"; cards read 101.91K and the table 13,857.00 after the format script.

## How to work (short)
- Plan first, wait for "go"; tests first; one writer on the repo at a time; branch → push → the reviewer tests and
  merges; never merge yourself. Keep the laptop awake during full runs.
