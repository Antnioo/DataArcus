# Changelog: DataArcus for Power BI (the MCP)

What changed in each version, newest first. Each version given to testers also has a release record (the file's size
and SHA-256), sent with the download. The version is written once, by the build, into `mcp/package.json` and the
package's manifest; this file says what is in it.

## [Unreleased]: 0.2.9 (release candidate, in testing)
Not released until it passes the Power BI Desktop proof and the owner's own use.
- **Microsoft's report validator 0.5.0** (was 0.4.0), used offline by `check_report`: our reports still pass with 0 errors and 0 warnings.
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

## [0.2.8]: 2026-10-08 (the version testers would get today)
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
