# DataArcus

**Power BI reports designed right, and checked in Power BI, not just generated. Arabic, right to left and the Gulf calendar, next to Microsoft's tools.**

Website: **[dataarcus.com](https://dataarcus.com)** · Contact: [hello@dataarcus.com](mailto:hello@dataarcus.com)

This repository is the source of dataarcus.com: free Power BI tools that run in your browser (nothing you open in
them is uploaded), articles in English and Arabic, and the public test notes behind DataArcus findings.

## Free tools

| Tool | What it does |
|---|---|
| [Power BI Theme Generator](https://dataarcus.com/tools/power-bi-theme-generator.html) | A theme JSON, a matching background and the position of every visual, from your brand colours (right to left too) |
| [Model Health Check](https://dataarcus.com/tools/power-bi-model-health-check.html) | Checks a `.pbit` or a zipped Power BI project for unused columns, slow DAX, missing formats and more |
| [DAX Calendar Table Generator](https://dataarcus.com/tools/dax-calendar-table-generator.html) | A date table with Hijri dates, announced Ramadan and Eid dates, and each GCC country's weekend |
| [DAX Measure Builder](https://dataarcus.com/tools/dax-measure-builder.html) | YoY, YTD, MTD, rolling and Ramadan / Eid window measures, ready to paste |
| [SVG KPI Designer](https://dataarcus.com/tools/svg-kpi-designer.html) | KPI cards as DAX image measures |
| [Licensing Cost Calculator](https://dataarcus.com/tools/power-bi-licensing-cost-calculator.html) | Pro vs PPU vs Fabric capacity, with Copilot requirements and UAE / Saudi prices |
| [PL-300](https://dataarcus.com/tools/pl-300-practice-exam.html) and [DP-600](https://dataarcus.com/tools/dp-600-practice-exam.html) practice exams | Free practice questions with explanations |

## How we check our work

- **Automated tests on every change:** 17 website test suites (thousands of checks) run on each push.
- **Microsoft's own validator:** every Power BI project the tools write is checked with Microsoft's report validator.
- **Measured in Power BI Desktop:** sizes, layouts and numbers are measured in Power BI Desktop, never estimated, and
  recorded with the version used.
- **Sourced facts:** prices, dates and Microsoft claims are linked to their source and re-checked. The Gulf calendar's
  announced Ramadan and Eid dates for the UAE and Saudi Arabia, each with its source, are in
  [`scripts/gulf-calendar/DATES-SOURCES.md`](scripts/gulf-calendar/DATES-SOURCES.md).

## Findings

Every week DataArcus publishes one finding about AI-built and hand-built Power BI reports: what was tested, on
which version and data, and what we found. The test notes, with a way to reproduce each result, live in
[`findings/`](findings/) as they are published.

## The AI report designer

An AI report designer for Power BI (it works with Claude on your own machine and never overwrites your files) is in
private beta. Interested? Write to [hello@dataarcus.com](mailto:hello@dataarcus.com).

## Licence

Copyright © 2025-2026 Abdelrahman Mohammed, trading as DataArcus. All rights reserved: the code is published for
transparency, not as open source. See [LICENSE](LICENSE).
