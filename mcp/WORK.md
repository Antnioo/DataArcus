# Current work (the memory between sessions)

Read this first; update it as you go (rules in `mcp/CLAUDE.md`, "Keeping the memory"). Last updated 2026-10-03
by the builder: **round 2 (Arabic accuracy) is in progress on `fix/round-2-arabic`** (owner's go in advance). State, plan
and expected results: "Round 2 in progress". Round 1 is merged as `80d3a00`; main is at `bc05275`.

## Where things stand
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
   **10 golden tasks** (permanent real requests, including a large model of hundreds of tables), run before every release.
5. **Private beta and free before/after case studies** (owner's outreach starts the week of 4 October).
- **The split of `pbip-export.js` is deferred until after the beta**, unless the overnight plan (branch
  `plan/split-pbip-export`) shows it takes about one evening; the owner decides when he reads it.
- **The validator:** a representative set of exports on every push, the full matrix nightly (reviewer, after round 2).
- **Dated:** the Gulf Calendar pack and its free lead-magnet download, ready by 2026-12-01.

## Round 2 in progress (owner's go 2026-10-03, in advance for every step; branch `fix/round-2-arabic`, from main `bc05275`)
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
`scripts/tests/DESKTOP-TESTS.md`; only our own sample model (`C:\DataArcus\tests\5-tmdl-sample`) and the website's
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

## How to work (short)
- Plan first, wait for "go"; tests first; one writer on the repo at a time; branch → push → the reviewer tests and
  merges; never merge yourself. Keep the laptop awake during full runs.
