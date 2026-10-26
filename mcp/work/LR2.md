# LR2 (0.3.1, the laptop's run of 26 Oct): the Theme Generator's Arabic "Download project", through the real page

## Summary
- **Approval:** the reviewer's brief "Go on LR2"; the owner, 26 Oct: "Use «حسب»" for the Arabic download's chart titles.
  The laptop (26 Oct) built the download with a local harness (design-engine.js + pbip-export.js as
  test-0.3.1-sq15b.mjs's site() does) and opened it in Desktop 2.159: items a-e below.
- **Scope:** `assets/js/story-titles.js` (join, alternate) and its `.min.js`; `?v=` stamps (story-titles in
  theme-generator.js's BUILDER, theme-generator.min.js on its three pages); `mcp/test-0.3.1-sq15b.mjs` (its site block,
  now this job's), `scripts/tests/pbip.mjs` (the real page's download); four older tests that pinned the replaced rule
  (Decisions 2); this note. Not LR1's files (pbip-query.js, approval-window.mjs, the Arabic terms) nor BD1's.
- **Base:** `fix/0.3.1-lr2` from `origin/integration/0.3.1` (0f7f6e8). Push only this branch; the reviewer merges.
- **Item 1 (on the real page, before any fix):** a is real; b, c, d were the harness's; e is the design's (below).
- **Expected checks:** (written before the work) sq15b 19 -> about 25, the title checks red first; pbip.mjs gains the
  Arabic real-page titles (red first) and pins of b, c, d; `report`, `arabic`, `core`, `run-all theme-generator pbip`:
  the baseline's counts plus the new checks; golden: an Arabic report on English names changes (said); English
  reports byte for byte; full run 89 suites PASS.
- **Got:** sq15b 19 -> 25 (5 red first: T1-T4, T6); pbip 100 -> 109 (LR2-a1..a3 red first, a4 and b, c, d pins green
  on 0f7f6e8); report 28 PASS, arabic 10 PASS, theme-generator 898 = 898, core 6 PASS (mcp 1591 = 1591, golden 12
  tasks match, mutation 72 killed), each after 4 older checks were moved to the owner's rule (Decisions 2); full run:
  "run-tests: 91 suites passed" (no suite added; my 89 was SQ15b's count, the base has 91).
- **Invariants:** metadata only; the isolates from the writer only (pbip-export.js isolateFiles, unchanged); one engine
  (story-titles.js) for the site and the MCP; the English download's titles unchanged (LR2-a4, T5 pins).
- **Resume:** done; waits for the reviewer, and the owner's word on Decisions 1 (the MCP gets «حسب» too).

## Reproduced through the real page (item 1, on 0f7f6e8)
How: `scripts/tests/lib.mjs` serve + Playwright, `tools/power-bi-theme-generator-lab.html?lang=ar` and `?lang=en`, a new
visitor (the default design), "Your own data" > local project folder with a made-up model (Sales: Total Sales,
Orders `#,0`, Region, Order Date; Calendar: Date, Month sorted by Month Number; one relationship), the picker's own
suggestions, "Download project"; the zip read back.

| Item | Laptop (harness) | Real page | Why |
|---|---|---|---|
| a. titles | "Total Sales (Region)", "(Month)", "(2)", "(Region 2)" | the same: line «Total Sales (Month)», bars «Total Sales (Region)», «(Region 2)», column «Total Sales», «(2)» | story-titles.js `join`: an Arabic report never joined an English measure (0.3.0 R2), so the title was the measure alone and pbip-page's "same title" pass added brackets. The MCP's Arabic create_report did the same («Total Sales (Month)») |
| b. not mirrored | bars from the left, January at the left | mirrored: bars `invertAxis` + category axis right, column/line value axis right, the line sorted Descending by "Month start (sort)" (January at the right) | the page passes `chartAxes: 'mirrored'` (round 15); the harness did not |
| c. Orders 36.00 | Desktop's default display | the card writes `customFormatString '#,0'`, `labelDisplayUnits -1` | the picker's binding carries the measure's format; the harness's hand-made binding had none |
| d. 2 of 4 KPI slots empty | 2 KPIs bound, 4 slots | 2 cards, none empty (the page's `maxKpis` = the picked KPIs); 5 measures: 4 cards, all bound | the harness skipped the page's maxKpis |
| e. «شعارك» | header placeholder | the same | the design's logo placeholder when no logo is chosen: left as it is |

## Results
Commits: plan e41c8452, red first c5291f3f, the fix f2d20caf, arabic-titles/story-titles 5398eb22, round22/v029i
eb65b051, this note b6021acd, the full run's line (this commit).

| Item | Before | After | Test (red -> green) |
|---|---|---|---|
| a | Arabic download on English names: «Total Sales (Month)», «Total Sales (Region)», «Total Sales (Region 2)», «Total Sales», table «Total Sales: التفاصيل» | «‏⁨Total Sales⁩ حسب ⁨Month⁩‏», «… حسب ⁨Region⁩‏», the ranked second bar «ترتيب ⁨Region⁩ حسب ⁨Total Sales⁩‏», table «‏⁨Total Sales⁩ حسب ⁨Region⁩: التفاصيل»; alt texts the same; no bracket; English unchanged | sq15b T1-T4, T6 red -> green, T5 pin; pbip LR2-a1..a3 red -> green, a4 pin |
| b, c, d | (the harness's only) | unchanged | pbip LR2-b, LR2-c (en, ar), LR2-d (en, ar) pins, green before and after |
| e | the design's | unchanged | none |

Suites (baseline on 0f7f6e8 -> after):
- `run-all theme-generator pbip`: theme-generator 898 -> 898, pbip 100 -> 109.
- `npm test -- report`: 28 suites passed -> 28 (sq15b 19 -> 25; story-titles 94 = 94 after ST-1i moved).
- `npm test -- arabic`: 10 passed -> 10 (arabic-titles 27 = 27 after AT-1a/b/c moved).
- `npm test -- core`: 6 passed -> 6 (mcp 1591 = 1591 after round22 e/h and v029i P3-2 moved; golden 12 tasks match:
  golden-expected.json records no chart title text, so task 7's Arabic titles (a model without measures) change
  without a golden line changing: «عدد Order Id حسب Region» where they read «عدد Order Id (Region)»; mutation 72 killed).
- check-min PASS (every changed .min.js has a new stamp), test-site-config PASS, check-result-lines PASS,
  changelog-words PASS, check-agent-memory PASS (153 checks).
- Full run `npm test -- --keep-going` on b6021acd: "run-tests: 91 suites passed" (tests.json unchanged: the base's 91).

## CHANGELOG line
- Arabic reports on a model with English names title their charts with «حسب» («Total Sales حسب Region», «ترتيب Region حسب Total Sales»), in the website's download and the MCP alike, instead of the measure's name alone with the column in brackets.

## Decisions I made
1. **One engine, so the MCP's Arabic reports change too.** The brief says "as the MCP's Arabic reports"; measured on
   0f7f6e8, the MCP's Arabic create_report on English names gave the same «Total Sales (Month)». The rule lives in
   story-titles.js `join`, shared, so both now say «حسب». If the owner wants the MCP kept on R2 (the measure alone),
   it is one option on `join`; I did not add it.
2. **Four older checks moved to the owner's rule, same counts:** arabic-titles AT-1a/b/c and story-titles ST-1i (they
   pinned R2's "measure alone" and round 14's "one script per title" for an Arabic report), test.mjs round22 e/h (two
   charts told apart by «حسب Region» / «حسب Channel», not "(Region)"), v029i P3-2 (the writer's «التفاصيل» tail counts
   as its own word, as "detail": the hand page's bar and table no longer share a title). Each comment says so.
3. **Every script:** an Arabic report joins any two names with «حسب» (an Arabic measure with an English column too:
   «عدد Order Id حسب Region»), "never a bracket" holding there as well. An English report is exactly as before (an
   Arabic column with an English measure: the measure alone).
4. **The gallery's own joins** (pbip-query.js byTitle, "and", "per" in visual-gallery.js) are unchanged: byTitle is in
   LR1's file and no gallery visual is in the download (Seen 1).
5. `?v=` stamps `20261026lr2`: story-titles.min.js (BUILDER) and theme-generator.min.js on its three pages
   (ar-pages --write made the Arabic copy's). csp --write, sitemap-lastmod --write: nothing to change.

## For the laptop (Power BI Desktop, the batched run)
1. The real page, not the harness: `tools/power-bi-theme-generator-lab.html?lang=ar`, "Your own data" > the project
   folder of a made-up model with English names (Total Sales, Orders, Region, Month), "Download project"; open it.
   Titles: «Total Sales حسب Region», «Total Sales حسب Month», «ترتيب Region حسب Total Sales», read right to left with
   the English names whole, no boxes where the isolates are, no bracket.
2. Mirroring: bars grow from the right, the value axis at the right, January at the right of the line chart.
3. The Orders card: «36» style (`#,0`), not 36.00; every KPI card has a measure.
4. The same download in English: titles unchanged ("Total Sales by Region", "Region ranked by Total Sales").

## Seen, not in scope
1. The gallery's chart titles (combo, waterfall, small multiples: pbip-query.js byTitle, visual-gallery.js "and"/"per")
   keep R2's rule in an Arabic report on English names (the measure alone): one rule for two kinds of chart.
2. test.mjs line 4578's comment says "test-round22.mjs keeps the brackets' case": round22 now expects «حسب» (comment only).
3. The English download's titles repeat across pages ("Total Sales by Region" on the bar, the Details page's column and
   the tooltip page's bar), each page's own title kept; the report measures behind them are numbered "(2)", "(3)" in
   their names only (not shown).
4. The laptop's harness (sq15b's site() before this job) skipped the page's chartAxes, the binding's formats and
   maxKpis: a harness built that way shows b, c, d; the real page does not.
