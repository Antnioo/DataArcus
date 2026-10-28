# FX3 (0.3.1): Arabic titles the laptop part 3 found (block A, A1), the sample's Arabic name, two more

## Summary
- **Approval:** the reviewer's brief "Go on FX3" (28 Oct): laptop part 3 (integration 0d342773, Desktop 2.159.883.0),
  block A item A1 and C09; FX2's Seen 1; Codex's delta finding D03. The owner: D-1027-03 (a title all Arabic or all
  English), D-1027-04 (drafted in Arabic and approved, never silent), D-1027-12 (the twin identical), D-1028-05
  («بيانات تجريبية» replaces «بيانات مختلَقة» everywhere).
- **Base:** `fix/0.3.1-fx3` from `origin/integration/0.3.1` at 667b938 (SPD, P3A, FX1, FX2 merged). Push only this
  branch. Not FX4's or FX5's files (page-preview.js, pbip-bind.js, pbip-page.js, pbip-sizing.js, theme-generator.js,
  suggest_fields.mjs, golden-expected.json, fixtures/fx4/, test-0.3.1-fx4.mjs, test-0.3.1-fx5.mjs).
- **Scope:** 1. the twin, the EN-AR copy and the bilingual Arabic half: an automatic title or subtitle gets an explicit
  text (`mcp/lib/twin-texts.mjs`, `twin-plan.mjs`, `twin-pages.mjs`); a check_report rule for it
  (`assets/js/report-rules.js`). 2. the bilingual Arabic half's gate (`mcp/tools/plan_layout.mjs`). 3. «بيانات تجريبية».
  4. the metric switcher's labels drafted and gated (`plan_layout.mjs`). 5. `test.mjs` Round0 predicate narrowed.
- **Expected checks:** (written before the work) a new suite `fx3`, about 18 checks, each red on 667b938 first except
  guards: A (item 1, about 7), B (item 2, 3), C (item 3, 2), D (item 4, 4); `mcp` (test.mjs) + 1 check (D03: the
  narrowed predicate rejects a translated field shown in English; red on the old predicate). Changed on purpose, said
  per test: `0.3.0-claims` and `0.3.1-sq3` (the Arabic sample words); every suite that plans a bilingual report without
  approving its titles (arabicTexts) gets them approved or kept English on purpose (bilingual-report, sample-project,
  glass-twin, mirror-parity, sf1, sq10, dax-functions, claims: whichever the run names), same counts; the website's
  report-check / test-site-config the same counts unless a rules list is counted (said). Full run: the base's suites + 1.
- **Got:** (filled at the end)
- **State:** plan pushed; the work next.
- **Resume:** item 1, then 2, 4, 3, 5.

## The plan
1. **Automatic titles (A1).** Power BI composes a title or subtitle that is switched on with no text of its own from
   the field names, with its own English "by": «الشريحة by إجمالي الربح». textsOf lists each such title and subtitle on
   a data visual as a text (`title:` / `text:...subTitle` ids, as an explicit one), its English the composition
   ("Total Profit by Segment"), its draft one Arabic sentence from the approved Arabic field names («إجمالي الربح حسب
   الشريحة»). buildTwin writes the approved Arabic as the visual's own text; with none approved it writes the English
   text itself (wholly English, said in notTranslated), so Desktop never composes a mixed one. The EN-AR copy and the
   bilingual half use the same build. check_report: a new rule (rtl group) on a right-to-left page: a visual whose
   title or subtitle is switched on with no text of its own.
2. **C09.** The bilingual plan's Arabic half: no plan id while a title on an Arabic page (a visual's title or subtitle,
   a title measure's text) has no approved Arabic and is not kept English on purpose (arabicTexts: its English back).
3. **«بيانات تجريبية».** Every «مختلَقة / مختلقة / مختلَق» of the sample data and the made-up models in product files
   (the beta pages, the two articles, approval-window.mjs, sample-project.mjs, the tests reading them); .min.js rebuilt,
   `ar-pages.mjs --write`. Note: `git grep "مختل"` alone also finds «مختلف» (different) and «مختلط» (mixed): the
   check greps «مختلق / مختلَق».
4. **The metric switcher's labels.** An Arabic plan's switcher measures join the fields it drafts; no plan id while a
   label would be English without an approved Arabic name or a keep-English.
5. **D03.** test.mjs Round0: a field's model name as its displayName passes only for a field kept English on purpose
   (Month Short); a check proves a translated field shown in English fails.

## Before -> after
(filled with the work)
