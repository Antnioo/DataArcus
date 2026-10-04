# Finding 004: Power BI opened our report without an error, and silently ignored our tooltips

Test notes for a public finding by Abdelrahman (DataArcus). Measured in Power BI Desktop on **2026-10-01**; the
validator part re-checked without Power BI on **2026-10-04** with [`repro.sh`](repro.sh). The mistake was in our own
report exporter. Microsoft's free validator is what named it.

## What was tested
| | |
|---|---|
| What | Report files (PBIR) written by our own exporter, `assets/js/pbip-export.js` in this repo, which serves both the website's Theme Generator download and the DataArcus MCP. Charts were linked to a report page tooltip with `visualTooltip.type: 'ReportPage'` |
| Power BI | Power BI Desktop **2.158.1177**, Windows (round 0 measurements, 2026-10-01) |
| Validator | Microsoft's `powerbi-report-author` **0.4.0** (npm `@microsoft/powerbi-report-authoring-cli`, published 2026-09-22, MIT, "Public preview"), `validate` on the report folder |
| Data | The website's made-up sample data ("Gulf Sales") and our made-up test model |
| Full record | [`scripts/tests/DESKTOP-TESTS.md`](../../scripts/tests/DESKTOP-TESTS.md): "2026-10-01: round 0 measurements", row 1, and "round 0 built", item 1 |

## What happened
1. **In Desktop:** the report opened with no error and no warning. Hovering a chart showed **Power BI's default
   tooltip** ("Jul, Total Revenue 283,200"), not our tooltip page.
2. **Microsoft's validator** on the same file:
   `Invalid enum value "ReportPage" for "visualTooltip.type" (valid: Default, Canvas)`.
3. **Why the wrong value looked right:**
   - Desktop's format pane calls the option "Report page" (Tooltips > Options > Type: "Default" or "Report page").
     In the file, the value is `Canvas`.
   - Microsoft Learn says: "If you select Report page but no report page tooltip is available, the visual uses the
     default tooltip". So Desktop falls back quietly.
   - We don't know why our code first wrote `'ReportPage'`. The UI label is the likely source, not a proven one.
4. **The fix:** `type: 'Canvas'`, with `section` set to the tooltip page. Our tooltip page then showed on every chart
   hovered: English and Arabic, 1920 × 1080 and 1280 × 720, light and dark, line, bar and column charts. The fix was
   re-checked on ten reports after the build (round 0 built, item 1: PASS).
5. **Since then:** our tests run Microsoft's validator on our exports (`mcp/CLAUDE.md`, "Tests").

## Reproduce the validator part (no Power BI needed)
```bash
bash findings/004/repro.sh    # needs Node 20+; installs the CLI 0.4.0 in a temporary folder
```
It builds a one-page project with a column chart and validates it twice: first with `'ReportPage'`, then with
`'Canvas'`. Output, 2026-10-04:

```
== type 'ReportPage'
result: failed | errors: 2
  PBIR_QUERY_STATE_MISSING -> Visual has no queryState but visualType "columnChart" requires roles [Category, Y]
  PBIR_FORMATTING_ENUM_INVALID -> Invalid enum value "ReportPage" for "visualTooltip.type" (valid: Default, Canvas)
== type 'Canvas'
result: failed | errors: 1
  PBIR_QUERY_STATE_MISSING -> Visual has no queryState but visualType "columnChart" requires roles [Category, Y]
```

`PBIR_QUERY_STATE_MISSING` is expected in both runs: the stub chart binds no field. Only `'ReportPage'` gets the
tooltip error.

The Desktop part (the default tooltip on hover) needs Power BI Desktop on Windows and a report with a tooltip page.
Link a chart to it with each value and hover the chart.

## What it does not show
- **A Power BI bug.** The fallback is documented, and it's sensible for someone clicking in the menu.
- **The Power BI service.** Only Desktop 2.157-2.158 was tested.
- **Other properties.** This is one property, with CLI 0.4.0. A later CLI may word the message differently.

## Sources (read 2026-10-04)
- Microsoft Learn, Visual tooltips in Power BI (updated 2026-07-23):
  https://learn.microsoft.com/power-bi/visuals/power-bi-visualization-visual-tooltips
- Microsoft Learn, Create report tooltips (updated 2026-07-30):
  https://learn.microsoft.com/power-bi/create-reports/desktop-tooltips
- This repo: `scripts/tests/DESKTOP-TESTS.md` (round 0), `mcp/CLAUDE.md` ("Power BI facts learned the hard way",
  round 0).
