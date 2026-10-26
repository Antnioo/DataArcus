# LR2 (0.3.1, the laptop's run of 26 Oct): the Theme Generator's Arabic "Download project", through the real page

## Summary
- **Approval:** the reviewer's brief "Go on LR2"; the owner, 26 Oct: "Use «حسب»" for the Arabic download's chart titles.
  The laptop (26 Oct) built the download with a local harness (design-engine.js + pbip-export.js as
  test-0.3.1-sq15b.mjs's site() does) and opened it in Desktop 2.159: items a-e below.
- **Scope:** `assets/js/story-titles.js` (join, alternate), `assets/js/pbip-query.js` (byTitle: the same rule), their
  `.min.js`, the `?v=` stamps (theme-generator.js's BUILDER, theme-generator.min.js on its pages), `mcp/test-0.3.1-sq15b.mjs`
  (its site block, now this job's), `scripts/tests/pbip.mjs` (the real page's download), this note. Not LR1's files
  (pbip-query.js lastMonths, approval-window.mjs, the Arabic terms) nor BD1's (dax-functions.mjs, arabic-lens.mjs,
  mcp/lab/bidi-lab.mjs).
- **Base:** `fix/0.3.1-lr2` from `origin/integration/0.3.1` (0f7f6e8). Push only this branch; the reviewer merges.
- **Item 1 (reproduced on the real page, before any fix):** a is real; b, c, d were the harness's; e is the design's.
  Details: "Reproduced through the real page".
- **Expected checks (written before the work):** sq15b 19 -> about 25 checks, the new ones (titles) red first;
  scripts/tests/pbip.mjs gains the Arabic real-page titles (red first) and pins of b, c, d on the real page;
  `npm test -- report`, `-- arabic`, `-- core`, `run-all theme-generator pbip`: the baseline's lines, the same counts
  except the new checks; golden reports: an Arabic one with an English measure or column title changes (each change
  said), the English ones byte for byte; `npm test -- --keep-going` 89 suites, all PASS.
- **Invariants:** metadata only; the isolates come from the writer only (pbip-export.js isolateFiles); one engine
  (story-titles.js) for the site and the MCP; the English download unchanged.
- **Resume:** plan pushed; next the red tests.

## Reproduced through the real page (item 1, on 0f7f6e8)
How: `scripts/tests/lib.mjs` serve + Playwright, `tools/power-bi-theme-generator-lab.html?lang=ar` and `?lang=en`, a new
visitor (the default design), "Your own data" > local project folder with a made-up model (Sales: Total Sales,
Orders `#,0`, Region, Order Date; Calendar: Date, Month sorted by Month Number; one relationship), the picker's own
suggestions, "Download project"; the zip read back.

| Item | Laptop (harness) | Real page | Why |
|---|---|---|---|
| a. titles | "Total Sales (Region)", "(Month)", "(2)", "(Region 2)" | the same: line «Total Sales (Month)», bars «Total Sales (Region)», «(Region 2)», column «Total Sales», «(2)», «(3)» | story-titles.js `join`: an Arabic report never joins an English measure (0.3.0 R2), so the title is the measure alone and pbip-page's "same title" pass adds the brackets. The MCP's create_report in Arabic does the same today («Total Sales (Month)», bar «Total Sales») |
| b. not mirrored | bars from the left, January at the left | mirrored: bars `invertAxis` + category axis at the right, column/line value axis at the right, the line sorted Descending by "Month start (sort)" (January at the right) | the page passes `chartAxes: 'mirrored'` (round 15); the harness did not |
| c. Orders 36.00 | the card shows Desktop's default | the card writes `customFormatString '#,0'`, `labelDisplayUnits -1` | the picker's binding carries the measure's format (cardFormat); the harness's hand-made binding did not |
| d. 2 of 4 KPI slots empty | 2 KPIs bound, 4 slots | 2 cards, none empty (the page's `maxKpis` = the picked KPIs) | the harness skipped the page's maxKpis; with more measures the picker fills every slot (pinned in the suite) |
| e. «شعارك» | header placeholder | the same | the design's logo placeholder (no logo chosen): left as it is |

## Plan
1. This note, pushed first. Baseline runs on 0f7f6e8.
2. Red first: sq15b's site block T1-T6 (the Arabic download's titles in the «حسب» form: bar, line, column, the ranked
   second bar «ترتيب ⁨Region⁩ حسب ⁨Total Sales⁩», no bracket anywhere, the U+200F at the start, the English titles
   unchanged; the site block given the page's own `chartAxes` and binding so it is the real path); pbip.mjs: the real
   page's Arabic download, titles (red), mirroring, card format, KPI slots (pins).
3. Fix at the cause: story-titles.js `join`: in an Arabic report (the report's word is «حسب») two names are always
   joined with «حسب», whatever their script; `alternate`: the Arabic forms in an Arabic report. pbip-query.js
   `byTitle` calls the same `join` (one rule for the gallery's charts). English reports unchanged.
4. build:min, `?v=` stamps, csp --write, ar-pages --write, sitemap-lastmod --write; suites; this note's results.
