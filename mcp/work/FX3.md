# FX3 (0.3.1): Arabic titles the laptop part 3 found (block A, A1), the sample's Arabic name, two more

## Summary
- **Approval:** the reviewer's brief "Go on FX3" (28 Oct): laptop part 3 (integration 0d342773, Desktop 2.159.883.0),
  block A item A1 and C09; FX2's Seen 1; Codex's delta finding D03. The owner: D-1027-03 (a title all Arabic or all
  English), D-1027-04 (drafted in Arabic and approved, never silent), D-1027-12 (the twin identical), D-1028-05
  («بيانات تجريبية» replaces «بيانات مختلَقة» everywhere).
- **Base:** `fix/0.3.1-fx3` from `origin/integration/0.3.1` at 667b938 (SPD, P3A, FX1, FX2 merged). Push only this
  branch. None of FX4's or FX5's files touched.
- **Scope:** 1. `mcp/lib/twin-texts.mjs` (autoTitlesOf, autoSentence), `twin-plan.mjs`, `twin-pages.mjs`;
  `assets/js/report-rules.js` (AUTO_TITLE), `scripts/tests/DESKTOP-TESTS.md`. 2. and 4. `mcp/tools/plan_layout.mjs`.
  3. the beta pages, two articles, `approval-window.mjs`, `sample-project.mjs`. 5. `mcp/test.mjs` (Round0).
- **Expected checks:** (written before the work) new `fx3` about 18 checks, red on 667b938 first except guards; `mcp`
  + 1 (D03); suites that plan a bilingual report without approving its titles changed on purpose; full run base + 1.
- **Got:** `fx3` 17 checks: 12 red on 667b938 first (A1-A6, B1, C1, C2, D1-D3), 5 guards green there (A0 the fixture
  is built, A7 an English page is no finding, B2 and B3 the approved and kept-English plans, D4 a kept-English label).
  `mcp` (test.mjs) + 1: D03, red on the old predicate first (shard 2: 585 checks, only it failed), shard 2 then 585 PASS.
  Changed on purpose: `sq10` 29 = 29, `0.3.0-claims` 688 = 688, `sq3` 31 = 31 (below). Areas: arabic 15,
  checker 6, report 40 pass; bilingual-report 33, dax-functions 92, glass-twin 28, mirror-parity 63, sample-project
  23, sf1 55, write-gate 7, metric-switcher 60, sq15b 25, flip-cards 62, look-options 55, arabic-sweep 255,
  large-model-caps 217, skill-packaging 25 unchanged. Website run-all 23 suites pass (design-engine 598,
  layout-canvas 31); test-site-config, ar-pages, check-min (75 match, stamps new) pass; lint 0.
- **State: DONE.** Full run on 2aed859: "run-tests: 118 suites passed" (mcp 1594 = the base's 1593 + D03; fx3 17;
  the base's 117 suites + fx3). CI started on the branch after this line.
- **Resume:** none; the reviewer's merge. One stamp left for the reviewer (below, "For the reviewer").

## Before -> after
| Item | Before | After | Where | Test |
|---|---|---|---|---|
| 1 A1 | a chart's title or subtitle switched on with no text stayed so in the twin, the EN-AR copy and the bilingual Arabic half: Desktop composed «الشريحة by إجمالي الربح» from the approved Arabic names; the file check could not see it | each is a text of the twin (`automatic: "title"` or `"subtitle"`, its English as Power BI composes it, "Total Sales by Month Name"), its draft one Arabic sentence from the approved Arabic field names («إجمالي المبيعات حسب اسم الشهر»); written as the visual's own text: the approved Arabic, else its English (wholly English, isolated, in notTranslated with why). Only a visual of two fields or more (one field: its own name, no "by"). The copy's English pages keep theirs. check_report `AUTO_TITLE` (rtl group, right-to-left pages only) names one, never quoting its text | twin-texts.mjs, twin-plan.mjs, twin-pages.mjs; report-rules.js | fx3 A1-A7 |
| 2 C09 | en+ar, plain, dark, 1280 x 720, ops, no KPIs, top filters, pills, waterfall, the sample: a plan id with "Total Sales per Month Name" (no draft, nothing approved) to be written English on its Arabic page | no plan id while a title on an Arabic page (a visual's title or subtitle, a title measure's text) has no approved Arabic (arabicTexts or the terminology sheet) nor its English given back to keep it; planProblems lists them | plan_layout.mjs | fx3 B1-B3 |
| 3 | «بيانات مختلَقة», «مختلقة», «مختلَق» in 12 product files | «بيانات تجريبية», «تجريبية», «تجريبي»; two beta sentences reworded so the word is not said three times («مشروعًا تجريبيًا لسلسلة متاجر خليجية (نموذج فيه بيانات مبيعات تجريبية...»، «ومشروع ببيانات تجريبية لتجربة DataArcus»); sample-project «كل الأسماء والأرقام فيه تجريبية: ...» | beta-page.js, two article translations, the 3 Arabic pages (ar-pages --write), approval-window.mjs, sample-project.mjs; .min.js rebuilt; ?v= 20261028fx3 on the 6 pages | fx3 C1-C2 |
| 4 | focus, 0 KPIs, lang ar, metricSwitcher: a plan id, labels "Order Count", "Units Sold" | the switcher's measures are drafted with the report's fields (the fixed list's or proposeYourself); no plan id while a label would be English (`arabicNames.switcherLabels`); kept English on purpose: its model name in displayNames | plan_layout.mjs | fx3 D1-D4 |
| 5 D03 | Round0's display-name check took ANY field under its model name | only the three fields "Table AR" kept English on purpose on this model (Month Short and the two Last Ramadan measures: the remembered choice); Total Sales under "Total Sales" fails (a new check); the message names the fields it fails | test.mjs | mcp +1 |

## Tests changed on purpose (before -> after)
- `sq10` K2-S1c: its bilingual plan now approves every drafted text and keeps the rest English on purpose
  (arabicTexts) before reading the approval page: a plan with unapproved titles has no id now (item 2). 29 = 29.
- `0.3.0-claims` W-2: reads «أربعة تقارير تجريبية» (was «مختلقة»), the article's new words. 688 = 688.
- `sq3` T1-S6k, T1-S6l: read «بيانات تجريبية» (was «بيانات مختلَقة»). 31 = 31.
- `mcp` (test.mjs, quality, Round0 AR): the predicate narrowed (D03) and one check added. No expected number changed.

## CHANGELOG line
"What a test run in Power BI Desktop found": an Arabic twin writes Power BI's automatic chart titles as approved
Arabic text, and the check names one on an Arabic page; an English and Arabic report and an Arabic metric switcher
wait for their Arabic titles and labels to be approved; the sample data is called «بيانات تجريبية».

## Decisions I made
- "Automatic" is what the brief says: show on, no text of its own (or a blank one). A chart with no title card at all
  (Power BI's default title) is not treated as automatic: not measured (Seen 1).
- Only a visual of two fields or more: one field's automatic title is that field's own name, never half and half.
- No Arabic approved for an automatic title: the twin writes its English as the visual's own text and says so
  (notTranslated), so Desktop can't mix it; the twin has no plan gate for texts, as before. The bilingual half's gate
  (item 2) covers automatic titles too.
- The English the twin writes is DataArcus's reading of Power BI's words (values "and", then "by" the categories); the
  laptop checks it against Desktop's (For the laptop).
- `git grep "مختل"` also finds «مختلف» (different), «مختلط» (mixed) and «يختل»: the check greps «مختلق / مختلَق».
  The gulf calendar article's «نموذج مختلَق» changed too (same meaning, "everywhere").
- D03: the brief named Month Short; the real output shows two more fields kept English on purpose by "Table AR" on the
  same model (the remembered choice), so the set is those three; any other field shown in English fails.

## For the owner
none

## Risky changes
- A bilingual plan (languages "en+ar") now gives no plan id until its Arabic titles are approved or kept English: the
  first plan of every bilingual report asks for them, as an Arabic report's does.

## For the reviewer
- `assets/js/report-rules.min.js` changed: its ?v= stamp lives in theme-generator.js's builder list
  (`report-rules.min.js?v=20261027ts1`), left for you as briefed (FX5's file). check-min passes today only because
  main's report-rules.min.js differs anyway.

## For the laptop
1. A twin of a report with automatic subtitles (dataset 1, 2): every chart's subtitle Arabic as approved, no "by".
2. The English the twin writes for an automatic title with no Arabic approved: the same words Desktop showed.
3. check_report on the old twin of dataset 1: AUTO_TITLE on each chart with an automatic subtitle.
4. C09 again: no plan id until "Total Sales per Month Name" is approved or kept; then the Arabic page all Arabic.
5. The beta pages and the two articles at phone width: «بيانات تجريبية» reads right.

## Seen, not in scope
1. A chart with no title card at all shows Power BI's default title (on by default): if it is also composed with an
   English "by" on an Arabic page, the twin and AUTO_TITLE should treat it too (measure first on the laptop).
2. A phone layout (mobile.json) with its own automatic title: not handled (none of DataArcus's writes one).
3. The twin (create_arabic_twin) still writes untranslated texts English with a plan id, said in notTranslated; only
   the bilingual half is gated (item 2's scope).

## Lessons for the reviewer
- After a commit, a test that greps the repo finds its own words: exclude the test file (fx3 C1 did, after the twin
  area run showed it).
