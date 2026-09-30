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
