# Changelog: DataArcus for Power BI (the MCP)

What changed in each version, newest first. Each version given to testers also has a release record (the file's size
and SHA-256), sent with the download. The version is written once, by the build, into `mcp/package.json` and the
package's manifest; this file says what is in it.

## [Unreleased]: 0.3.0
The 0.3 drafts together, for beta testers (the owner's decision, 19 Oct); the release candidate is branch
`release/0.3.0`, merged after the laptop's Power BI Desktop proof. Each line is one merged pull request:
- #37 Preview before Approve: the approval window draws the planned pages before the go.
- #38 Check before write: the measured rules and the layout check on the report before it is written or downloaded.
- #63 Preview fidelity: titles, cut tables, slanting labels, button names and the KPI value side as Desktop draws them.
- #48 B-143: "Please confirm" on a date or fact table that no relationship touches.
- #53 B-147: the format review as "Please confirm".
- #51 B-146: the aggregation guard: non-additive values never stacked or summed, snapshots summed over time asked about.
- #52 A theme from a logo in the Theme Generator (read in the browser only).
- #54 The phone layout on every page (`layout.phoneLayout`, on by default).
- #56 B-148: "Please confirm" answers remembered while the metadata is unchanged (an answers file, after a plan).
- #57 Story titles (B-130, B-131): no "(2)" or "KPI n", long Arabic titles shortened by rule, alt text the full title.
- #58 B-152, B-154: only the report's own files read and copied; every plan pins its model.
- #59 B-153: a write that fails half-way leaves nothing half-written and says whether the plan was used.
- #60 Accessibility of written reports, and `check_report`'s "a11y" rules.
- #61 The visual gallery foundation: combo, waterfall and small multiples behind `gallery: true`.
- #68 Redesign step 2: `plan_layout` with `redesignFrom`, every page as a lossless copy with allowlisted changes
  (supersedes #62).
- #64 Column or bar from the label limits measured in Desktop 2.159 (B-140 option B).
- #69 B-168: `plan_layout` checks the exact report `create_report` writes, and the write is those bytes.
- #70, #71 The 0.2.9.1 fixes (below), with main.
- R3 A right-to-left waterfall reads from the right: the Arabic twin now mirrors a waterfall as the writer does (the
  value axis at the right, the steps reversed by the sort: the first category at the right); Power BI has no setting
  to invert a waterfall's category axis, so only its order is reversed.
- R2, the owner's must-fix: an Arabic report from an English-named model shows no English title words; the plan pins the
  fixed list's Arabic names and lists every field kept in English, with why, before the go.

## [Unreleased]: 0.2.9.1
Three fixes after 0.2.9; nothing else changes.
- B-174, the plan says what the chart keeps: a chart planned as "Top 5" keeps its top 5 by its measure, or all of its
  categories when it has 7 or fewer (the report's "Keep:" measure, so a chart never leaves out one or two it could show).
  The plan and `create_report`'s notes now say so for each chart ("Comparison: Top 5, all of them when it has 7 or
  fewer"), from what the writer writes, and a chart the writer does not cut is not said to be cut. What Power BI shows
  is unchanged: the laptop's 6 plan groups under "Top 5" were all shown, as now planned.
- A column chart written as a donut (its category has two values) no longer carries a bar chart's hidden value axis,
  which Microsoft's validator reported (PBIR_FORMATTING_OBJECT_UNKNOWN, a `check_report` "can break"). Found by
  draft PR #69's check of the exact report.
- **B-173, Arabic table headers** (Desktop 2.159 on the laptop: the twin listed a header as cut that Desktop draws
  whole, and `check_report` said nothing about one Desktop cuts): one measure of a header for the twin and
  `check_report` (`headerNeed`). Under 0.7 of it an Arabic header is cut (`fitted.headersCut`, `cut: "cut"`; a
  `check_report` warning, TABLE_HEADER_CUT); from there up to the measure it may be cut (`cut: "may be cut"`, with why;
  a `check_report` note). The twin still widens each column to the full measure.

## [0.2.9]: 2026-10-19 (the version for testers)
Given to testers on 19 Oct 2026, after the Power BI Desktop release proof of rc.24 passed on the laptop (Desktop 2.159):
the approval window names the chart kind that is written, the Arabic twin's title measures, buttons and KPI values,
no network connection. The package is built on Windows with its release record (size and SHA-256), sent with the
download. Known issues for testers: the twin can list a table header as cut when Desktop shows it whole; a chart
planned as "Top 5" can show every category.
- **rc.24, the gaps the Desktop release proof of rc.23 found** (18 Oct, Power BI Desktop 2.159; they finish B-140 and
  the Arabic twin, nothing else changes):
  - B-140: the approval window names each chart field by the kind it is written as, with the reason when it changed
    ("Bar chart by Plan[Plan Group] (planned as a column chart: the names would slant or be cut)"), and lists every
    visual written as another kind; it said "Column chart by".
  - The twin translates chart titles given by the report's own title measures ("Top 9 of 16: ..." titles): each of
    their texts is offered ("Chart title (from a title measure)", the counted numbers as {1} and {2}), and the twin gets
    its own Arabic measures ("Title AR: ...") used by its charts only; the original report and the model are not changed.
    A title measure that builds its text another way is listed as not translated, with why.
  - The twin widens each button to its Arabic text (by `check_report`'s own measure), within its page or group, moving
    the buttons beside it and the page's underline with it; a text with no room is said in the plan (`fitted.buttonsCut`).
  - The twin's KPI cards (one value) have their value right-aligned under their right-aligned titles.
  - The twin widens a table column to its Arabic header within the table's width (text columns give up width; numbers
    never narrowed); what can't fit is said in the plan (`fitted.headersCut`).
  - `PRIVACY.md`: the twin returns the fixed texts of the report's title measures (section 3 and its row).
- **rc.23, three fixes from an outside audit of 0.2.9, so `PRIVACY.md` says exactly what the code does** (18 Oct):
  - F1: a `.pbix` (it holds Power BI's data cache) and data files (`.csv`, `.tsv`, `.xlsx`, `.xlsm`, `.xls`, `.parquet`)
    are refused by their name before they are opened (a `.pbix` was read whole, then refused: "No model in this file").
    A `.pbix` refusal says how to get a `.pbit` or a project. A template (or a file with no extension) is read by its
    list of parts first: one that holds a data cache and no model schema is refused before the rest of it is read.
  - F3: `PRIVACY.md` section 3 no longer says a `.pbit`'s schema "holds no data": a model's definition can hold "Enter
    data" tables and DATATABLE values, which DataArcus reads on your machine but never decodes or returns. `read_report`
    (its row, its description, its note and the README) says slicer selections and bookmark states are read with the
    report's files but never returned.
  - F7b: "No" in the app's own approval prompt refuses the plan, as "Not now" in the approval window does: it can't be
    approved later (it stayed "not approved yet"). A prompt closed without an answer still leaves it to be approved.
- **rc.22, fixes from the owner's own Desktop test of rc.21** (18 Oct; the approval window passed in every case):
  - B-137: the Arabic twin of a report DataArcus wrote mirrors its pages. Their background is DataArcus's own transparent
    placeholder (known by its bytes), not a picture; a page on a real background picture still stays left to right.
  - B-140: the plan shows the kind each visual is written as. A column chart whose category names would slant or be
    cut is written as a bar chart, and the plan's slots now say so (`kindChanges`), so what is approved is what is written.
  - B-132: `colors: { accent }` without a theme or design gives the data colours from the accent (exact, first, its calm
    set, as `generate_theme` makes them), shown in the plan; no more Corporate navy.
  - B-141: every plan lists every file it writes: the report's `.pbip` beside its `.Report` folder.
  - B-142: `check_report`'s `validator.errors` and `warnings` agree with the findings (a known gap is a note);
    `validator.reported` keeps the validator's own counts. No false `TOOLTIP_SCROLL` on a tooltip chart kept to its last
    6 months.
  - B-144: `check_model_health` says plainly when a report of the model can't be read and why (`reportNotRead`,
    `reports.notRead`), and that unused columns were not checked then.
  - B-133: `plan_layout` on a large model with no focus gives no plan id: it asks for an area first.
  - B-134: `create_report` says first that a plan is not approved (with any missing input); after "Not now" a plan is
    refused, not "not approved yet".
  - B-138: in the Arabic twin, a page button takes the approved Arabic name of the page it goes to, shown in the plan.
  - B-135: the approval window shows colours as swatches, with the report's real data colours.
  - B-139: the twin's approval window names each Arabic text by what it is and its own text, never by internal ids.
- **Microsoft's report validator 0.5.0** (was 0.4.0), used offline by `check_report`: our reports still pass with 0 errors and 0 warnings.
- `check_report`'s known notes (the dropdown slicer's rounded box) name the validator that ran, read from the installed package; they still said 0.4.0.
- **Approval inside the tools:** a report, theme, script, calendar or twin is written only after a plan is approved
  (new tool `approve_plan`). You approve it yourself: DataArcus opens its own approval window in your browser, on
  your computer only, with the plan and every file it writes, and only your click on Approve approves it (or your yes
  in the app's own prompt, when the app supports one). What the AI types in the chat approves nothing. Plans have
  limits (cards, slicers, table fields) and expire.
- **Model Health Check, the same engine as the website's:** every finding names its source (a Microsoft Learn page, a
  Microsoft Best Practice Analyzer rule, or a DataArcus rule with its reason), and the checks respect Microsoft's
  documented exceptions (one-to-one relationships, FILTER with a measure, text measures, hidden measures, columns that
  need DAX). Measured on 23 public models: about 140 wrong findings removed, none of the right ones lost.
- **New tools:** `approve_plan`, `read_report` (reads an existing report's pages, visuals and fields), and
  `create_arabic_twin` (an Arabic copy of an existing report, mirrored right to left). 11 tools in all.
- **Reports:** month axes in calendar order with the last 12 months, table column widths, bar labels that fit, no
  blank category, no logo placeholder, amounts in automatic units with 2 decimals and counts as whole numbers,
  tooltips with the top 6 or the last 6 months; the layout fits each page's slots by measured sizes.
- **Theme:** light by default, with the brand colour exact and a calm palette checked at 3:1 contrast.
- **Fairer choices:** KPIs ranked by each measure's formula and format, not by words in its name, in any language; a
  time measure (last year, year to date) never ranked before a base measure; one number-format rule for cards and
  tables, the same on the website's download and in the MCP; an Arabic report shows the calendar's Arabic month and
  day names.
- **Checks:** `check_report` adds a design lint of the report (time axes sorted A to Z, labels likely cut, overlaps);
  `plan_layout` lints the planned page before you approve it.
- **Safety and robustness (the 0.2.9 audits and an outside review of the release candidate):**
  - reading stays inside the working folder, also for the model a `.pbip` points at;
  - one bad or oddly shaped file never stops a tool (tested with thousands of generated broken files);
  - writes are all or nothing, and when a write fails, only the files that same call created are removed;
  - the approval gate refuses when a plan does not cover the tool asked, a report's plan writes the report only, only
    your click in the approval window (or the app's prompt) approves, never a typed reply, a plan is approved once, and its time counts from
    when it was proposed;
  - files you name (a logo, a background, a theme) are read once, within their size limit;
  - every answer shows invisible and control characters as code points and stays under 40,000 characters.
- MCP SDK 1.32.1; the runtime dependencies are pinned to exact versions.

## [0.2.8]: 2026-10-08 (the version testers had before 0.2.9)
- Arabic reports: the "Total" word in Arabic tables, and the report's language follows its columns (English columns
  in English reports, Arabic in Arabic reports).
- Install guide fixes.
- 8 tools: `read_model`, `suggest_fields`, `check_model_health`, `generate_theme`, `plan_layout`, `create_report`,
  `add_gulf_calendar`, `check_report`.

## [0.2.7]: 2026-10-08 (built and install-tested, not given to testers)
- New tool `check_report`: Microsoft's report validator (0.4.0), run offline.
- The "No data for this selection" message on cards by default.
- Names with control characters are refused in the scripts the tools write.

## Earlier
0.2.0 to 0.2.6 (September and early October 2026): private builds, not distributed.
