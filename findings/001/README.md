# Finding 001: Microsoft's Power BI authoring plugin on an Arabic report

Test notes for a public finding by Abdelrahman (DataArcus). Tested **2026-10-03**. These notes say what was tested,
how, what we saw and where the test stops. They are written to be checked: the parts that don't need Power BI
Desktop can be re-run with [`repro.sh`](repro.sh) in about two minutes.

## What was tested
| | |
|---|---|
| Tool | Microsoft's **`powerbi-authoring` plugin 0.3.18** ([microsoft/skills-for-fabric](https://github.com/microsoft/skills-for-fabric/tree/main/plugins/powerbi-authoring), release commit `ec8d7ec`, 2026-09-24, MIT licence): the skills `powerbi-report-cli` and `semantic-model-authoring` and the Power BI modelling MCP server |
| Its CLI | **`powerbi-report-author` 0.4.0** (npm `@microsoft/powerbi-report-authoring-cli`, published 2026-09-22, described as "Public preview") |
| Status | Microsoft marks the Report Authoring skill **"This feature is in preview"** ([Microsoft Learn](https://learn.microsoft.com/power-bi/developer/agentic/power-bi-report-authoring-skill-overview), updated 2026-09-17) |
| Power BI | Power BI Desktop **2.158.1177** (Microsoft Store), Windows |
| Request | "build an Arabic sales report from this model" |
| Data | A **made-up** test model, "Ramadan Test" ([`scripts/tests/fixtures/model-health/tmdl-ramadan`](../../scripts/tests/fixtures/model-health/tmdl-ramadan)). It has a Calendar with Gregorian and Hijri columns and a Sales table. On a normal day the amount is 1; on day *d* of Ramadan in Hijri year *h* it is (*h* − 1440) × 100 + *d*. So the totals are known before any run: Total Sales 101,914; Total Sales Last Ramadan 74,675; Total Sales vs Last Ramadan % 0.3378 |
| Who ran it | An AI agent (Claude Code) that works with DataArcus, on a Windows laptop. It followed the plugin's procedure step by step (planning, design, authoring: the plugin's 1920 × 1080 canvas, 32 margins, 24 gutters, base theme, Segoe UI, the CLI scaffold, validation, Desktop preview, screenshot) and added nothing from DataArcus |
| Full record | [`scripts/tests/DESKTOP-TESTS.md`](../../scripts/tests/DESKTOP-TESTS.md), section "2026-10-03: Microsoft's `powerbi-authoring` plugin on an Arabic report" |

## The method
1. A copy of the made-up model was opened in Power BI Desktop. The agent was given the request above, with the plugin
   installed.
2. The plugin asks its questions one at a time and stops for approval. No one else was in the session, so each
   question got the option the plugin marks as recommended, and the tester approved the plan.
3. The plugin built one page. The page was validated with the plugin's CLI, then opened and captured with the plugin's
   own preview command. Desktop was closed without saving.
4. The tester compared the numbers on the page with the model's known answers (DAX query on the open model).
5. All 111 files of the installed plugin were searched for Arabic, right to left, Hijri, Ramadan and Umm al-Qura.
6. **Re-checked on 2026-10-03 without Desktop**, from the public release: [`repro.sh`](repro.sh) clones the plugin at
   `ec8d7ec`, searches its 107 files (the public folder; the installed copy counted 111) and validates its starter
   theme with CLI 0.4.0. Same results as on the laptop.

## What it did well
- **A clean page on the first pass:** a title, three dropdown slicers, three KPI cards, a monthly trend, sales by Hijri
  month, sales by weekday and a table by Hijri year. Every visual drew, with data.
- **A sound process:** a planning step that asks before building, a one-command scaffold with valid schema versions, a
  validator, a preview command that opens Desktop and captures each page, and a long design guide (page archetypes,
  chart choice, layout arithmetic, accessibility). It is free and official.
- **It noticed the model's gaps** in planning: month and weekday names with no sort column, and a percentage with no
  format, listed as "likely missing model work". It had no permission to edit the model, so these stayed: months and
  weekdays show in A–Z order, and the percentage shows as 0.34.
- **Every number on the page was right:** 101.914K, 74.675K and 0.34, against the known 101,914, 74,675 and 0.3378.

## What it missed
1. **No right-to-left layout.** The title is at the top left and the slicers at the top right. Chart titles and KPI
   values are left aligned, the table's first column is on the left, and value axes are on the left. The Arabic text
   is drawn correctly, but it starts at the left edge. The plugin's layout rules are written for a left-to-right
   reader: "Top-left carries the heaviest message" (`references/design/layout.md`); "the page title remains the left
   anchor and slicers sit to the right" (`references/design.md`). Its only right-to-left line is about a bar chart's
   value axis (`invertAxis`).
   - *Context:* Power BI itself doesn't mirror a report. "Desktop doesn't support right-to-left languages" and "Inside
     reports, the layout of visuals doesn't change if you're using a right-to-left language"
     ([Microsoft Learn](https://learn.microsoft.com/power-bi/fundamentals/supported-languages-countries-regions),
     updated 2026-02-24). So whoever writes the report files has to mirror the layout: page positions, alignment,
     column order and the order of the page buttons.
2. **No Hijri, Ramadan or Gulf weekend logic of its own.** It used the Hijri columns and Ramadan measures the model
   already had. Its modelling server can mark existing columns as a calendar (`calendar_operations`), but it creates
   no Hijri dates. Its text never mentions Hijri, Ramadan, Eid, Umm al-Qura or a Gulf weekend.
3. **It doesn't check the numbers on the page.** After a report change, its checks are the schema validator and a
   screenshot review against a checklist (clipped text, empty visuals, error icons, overlaps, contrast, theme). It
   asks for a DAX check of values only after it changes the model: its model-reload workflow "verifies expected values
   with DAX" (`references/authoring/powerbi-desktop.md`), and the model skill says to test new measures. Here the
   numbers were right, but the tester checked them, not the plugin.
4. **Its starter theme fails its own validator.** The plugin's `references/design/assets/base.json` ("Skill Base
   Defaults"), registered as the report's theme and validated with CLI 0.4.0, gives result "failed" with **6 errors**,
   all `PBIR_THEME_VISUAL_PROP_UNKNOWN` on `cardVisual`: `border.radius`, `spacing.customizeSpacing`, and
   `padding.top`, `padding.bottom`, `padding.left`, `padding.right`. The empty scaffold alone validates with 0 errors.
   Removing the six entries clears it. Our earlier Desktop measurement (2026-10-01, `DESKTOP-TESTS.md`,
   "fix/card-theme-radius") showed that a card looks the same without `border.radius`. The effect of the other five
   in Desktop was not measured, so only the validator result is claimed.

## Not counted against it
- **The slicers' "All":** this is Power BI's own word and follows the viewer's language. No report property changes
  it (measured 2026-10-03, `DESKTOP-TESTS.md`, round 2).
- **English month and day names:** these are the model's data.
- **Western digits and Segoe UI:** not faults (Segoe UI draws Arabic).
- **The Arabic titles and display names:** the agent wrote these because the request was in Arabic, using documented
  properties. The plugin has no step for it, and no warning about field names left untranslated.
- **Also seen:**
  - The preview command didn't find the Microsoft Store install of Desktop until `PBI_DESKTOP_PATH` was set.
  - The monthly trend got a scrollbar (60 months on the axis); the plugin's own checklist would send that back for a
    fix in a second pass.

## The limits of this test
- **One page, one pass.** The plugin's fix loop after the screenshot review wasn't run a second time. The result shows
  what its defaults give, not the best it can reach.
- **The tester isn't neutral.** The agent works with DataArcus and knows our rules, even though it followed only the
  plugin's. A fresh agent that had never seen our work would be a cleaner test.
- **Every question got the plugin's recommended answer.** A user who asks for right to left, or who checks the
  numbers, would get a different result.
- **What this shows:** the gaps exist in the plugin's text and in its default result. **What it doesn't show:** how a
  careful user with a good prompt would do.
- **The plugin changes often** (weekly releases in September 2026). These notes describe 0.3.18. Re-run `repro.sh`
  with a newer release commit to check a later version.

## Reproduce
```bash
bash findings/001/repro.sh    # needs git, Node 20+, python3; no Power BI, no account
```
Expected output (2026-10-03): 107 files; one match, the bar chart's `invertAxis` line in `cartesian-part-02.md`; the
three left-to-right layout lines; then the validator's `"result": "failed"`, `"errorCount": 6` and the six
`Unknown theme property ... for "cardVisual"` messages.

The Desktop part (building the page, the screenshot, the DAX check) needs Power BI Desktop on Windows and an AI agent
with the plugin installed. The model is in this repo (link above).

## Sources (read 2026-10-03)
- The plugin: https://github.com/microsoft/skills-for-fabric/tree/main/plugins/powerbi-authoring (release commit
  `ec8d7ec`, 2026-09-24)
- Microsoft Learn, Power BI Report Authoring skill (preview), updated 2026-09-17:
  https://learn.microsoft.com/power-bi/developer/agentic/power-bi-report-authoring-skill-overview
- Microsoft Learn, Supported languages, updated 2026-02-24:
  https://learn.microsoft.com/power-bi/fundamentals/supported-languages-countries-regions
- npm, `@microsoft/powerbi-report-authoring-cli` 0.4.0, published 2026-09-22
