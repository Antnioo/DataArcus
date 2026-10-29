# TB1b (0.3.1): TB1's leftovers (a kept title that would be mixed, measure subtitles, reference line labels, TOOLS.md)

## Summary
- **Approval:** the reviewer's brief "TB1 merged; TB1b" (29 Oct): TB1's "For the owner" and its two Seen items. The
  owner: D-1027-03 ("i want the whole title to be either arabic or english": never a mixed title written),
  D-1027-04 (no English titles in Arabic reports), D-1029-01.
- **Base:** `fix/0.3.1-tb1b` from `origin/integration/0.3.1` at 60d4ecca (TB1 and TB2 merged). Push only this branch.
- **Scope:** 1. `mcp/lib/twin-plan.mjs` (the kept field-parameter titles that would be mixed: `mixedTitles`),
  `mcp/tools/create_arabic_twin.mjs` (no plan id, planProblems EN and AR), `mcp/tools/plan_layout.mjs` (the bilingual
  half: the same). 2. `mcp/lib/twin-texts.mjs` (a subtitle bound to a measure: a dynamicTitle), `twin-pages.mjs`
  (written when approved); `assets/js/report-mirror.js` (a reference line's own label, displayName on the catalog's
  xAxisReferenceLine, y1AxisReferenceLine, referenceLine cards: listed and written), `twin-texts.mjs` BESIDE (it is
  drawn beside its value: the V3 wrap). 3. `mcp/TOOLS.md` (textsFrom, termsFrom).
- **Expected checks:** (written before the work) a new suite `tb1b`, about 11 checks, red on 60d4ecca first except
  guards. M (a chart on a field parameter whose other field, Country, gets an Arabic name: kept, no plan id and
  planProblems say why EN and AR; mixedTitles names it; guards: the same title kept where nothing else is Arabic gets
  a plan id, and an approved fixed Arabic title gets one: about 4). S (a subtitle bound to a measure: listed with
  what / whatAr; approved, written as a fixed Arabic subtitle; kept, the measure stays and notTranslated names it:
  about 3). R (three reference lines' labels listed; approved, written wrapped RLI ... PDI: about 2). T (TOOLS.md says
  textsFrom and termsFrom: 1). Other suites: a report with reference line labels lists more texts (said per test if
  any moves). Full run: the base's suites + 1 (tb1b).
- **State:** planned.
- **Resume:** the red tests (test-0.3.1-tb1b.mjs), then items 1-3.

## The plan
1. **A kept title that would be mixed.** A field parameter's automatic title (TB1: dynamicTitle, left to Power BI when
   kept) on a visual where any of its fields will be written with an Arabic name (a label, a term, a visual's own
   label): Power BI would compose it from both. The plan lists it in `mixedTitles` (the text, why EN and AR, how:
   approve a fixed Arabic title, or keep the other fields' names English too) and the tool gives no plan id
   (`planProblems`, `planProblemsAr`). Where nothing of it would be Arabic, keep stays allowed.
2. **Subtitles and reference lines.** A subtitle whose text is a measure: a dynamicTitle (`text:<page>/<visual>/
   c.subTitle.<i>.text`), written as a fixed Arabic subtitle when approved, else left as it is (said). A reference
   line's own label (the catalog's cards xAxisReferenceLine, y1AxisReferenceLine, referenceLine, property displayName):
   a text like the others, written as approved and wrapped as a label beside its value.
3. **TOOLS.md:** one short paragraph on textsFrom and termsFrom under create_arabic_twin.
