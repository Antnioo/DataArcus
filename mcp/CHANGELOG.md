# Changelog: DataArcus for Power BI (the MCP)

What changed in each version, newest first. Each version given to testers also has a release record (the file's size
and SHA-256), sent with the download. The version is written once, by the build, into `mcp/package.json` and the
package's manifest; this file says what is in it.

## [Unreleased]: 0.2.9 (release candidate, in testing)
Work in progress on the integration branch; nothing here is released until it passes the block-by-block audit, the
Power BI Desktop proof and the owner's own use.
- **Microsoft's report validator 0.5.0** (was 0.4.0), used offline by `check_report`: our reports still pass with 0 errors and 0 warnings.
- **Approval inside the tools:** a report, theme, script, calendar or twin is written only after a plan is approved
  (new tool `approve_plan`); plans have limits (cards, slicers, table fields) and expire.
- **New tools:** `approve_plan`, `read_report` (reads an existing report's pages, visuals and fields), and
  `create_arabic_twin` (an Arabic copy of an existing report, mirrored right to left). 11 tools in all.
- **Reports:** month axes in calendar order with the last 12 months, table column widths, bar labels that fit, no
  blank category, no logo placeholder, amounts in automatic units with 2 decimals and counts as whole numbers,
  tooltips with the top 6 or the last 6 months.
- **Theme:** light by default, with the brand colour exact and a calm palette checked at 3:1 contrast.
- **Fairer choices:** KPIs ranked by each measure's formula and format, not by words in its name.
- **Custom visuals (in progress):** a custom visual (for example ZoomCharts) is understood from its fields and can be
  replaced with a native visual, shown in the plan for approval first.
- **Safety and robustness (audit fixes, in progress):** reading stays inside the working folder, one bad file never
  stops a tool, writes are all-or-nothing.
- MCP SDK 1.32.1.

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
