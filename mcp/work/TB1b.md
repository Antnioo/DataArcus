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
- **Got:** `tb1b` 10 checks (one fewer than the estimate: R took 2), red on 60d4ecca first (the code; 73e1f938 is the
  note only): 8 failed there (M1, M2, S1-S3, R1, R2, T1); 2 guards green there (M3 kept where nothing is Arabic, M4 an
  approved fixed title: both a plan id). Areas: twin 18 suites pass (tb1 24 = 24), arabic 15 pass; lint 0; check-min
  75 match, stamps new since main; result-lines, changelog-words, agent-memory PASS. No other suite's number changed
  (mcp 1594; mutation 198: 76 mutants, all killed).
- **State: DONE.** Full run on 8f538855: "run-tests: 126 suites passed" (the base's 125 + tb1b). CI started after this line: run 40817812539 green (Linux, Windows, macOS).
- **Resume:** none; the reviewer's merge.

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

## Before -> after
| Item | Before | After | Where | Test |
|---|---|---|---|---|
| 1 | a field parameter's title kept (left to Power BI) on a visual whose other field gets an Arabic name: a plan id; Power BI composes it mixed | `mixedTitles` (id, text, fields, why / whyAr, how / howAr); create_arabic_twin gives no plan id (`planProblems`, `planProblemsAr`, sayFirst); plan_layout's bilingual half the same (planProblems). Kept where nothing on it is Arabic, or approved as a fixed Arabic title: a plan id as before | twin-plan.mjs; create_arabic_twin.mjs; plan_layout.mjs | tb1b M1-M4 |
| 2a | a subtitle whose text is a measure: not listed, stayed English | a dynamicTitle (`text:<page>/<visual>/c.subTitle.<i>.text`, what / whatAr "A subtitle given by the measure ..."); approved: a fixed Arabic subtitle; kept: the measure, in notTranslated | twin-texts.mjs subtitleMeasuresOf, textsOf; twin-pages.mjs | tb1b S1-S3 |
| 2b | a reference line's own label (displayName) was not listed | listed (`text:<page>/<visual>/o.<card>.<i>.displayName`, only on the reference line cards: xAxisReferenceLine, y1AxisReferenceLine, referenceLine, any *AxisReferenceLine) and written as approved, wrapped RLI ... PDI (drawn beside its value) | report-mirror.js TEXT_PROPS, REF_LINE; twin-texts.mjs besideOf | tb1b R1-R2 |
| 3 | TOOLS.md said neither textsFrom nor termsFrom | one paragraph, "Long reports (0.3.1)", under create_arabic_twin | TOOLS.md | tb1b T1 |

## CHANGELOG line
(at the end of [Unreleased]) "No mixed titles in the Arabic twin: ..." (a kept field parameter title that would be
mixed gets no plan; a measure subtitle and a reference line's label listed).

## Decisions I made
- "Would be Arabic": any field of the visual (the parameter's own fields included) whose written name has an Arabic
  letter: a field label, a term or the visual's own label (TB1's fieldAt).
- The refusal is the plan answered without a plan id (as plan_layout's planProblems), with planProblemsAr for the
  Arabic; the bilingual half's line is English only, as all of plan_layout's planProblems are.
- The bilingual guard is not driven by a test: DataArcus's own metric switcher charts carry a title measure, not
  Power BI's composed title, so no report it builds was found to reach it; kept as a guard.
- A subtitle given by any measure is a dynamicTitle (the twin translates no subtitle measure's DAX, report's or model's).
- displayName is listed only on the reference line cards (REF_LINE), not on trend, forecast or anomaly cards.

## For the owner
none

## Risky changes
- What an answer returns: create_arabic_twin may now answer a plan without a plan id (mixedTitles, planProblems,
  planProblemsAr); new texts (measure subtitles, reference line labels). Written files: an approved measure subtitle
  becomes a fixed text; reference line labels take their approved Arabic. No test loses checks.

## For the laptop
- AdventureWorks' field parameter chart: with Country named in Arabic and the title kept, the twin refuses and says
  why in Arabic; approved, the fixed Arabic title shows.
- A chart with a target reference line: its label reads in Arabic, the value beside it in order.

## Seen, not in scope
- The trend, forecast, anomaly and ratio lines' own labels (displayName on those cards) are not listed: they stay English.
- plan_layout's bilingual gate on titles (FX3) does not count TB1's dynamicTitle kind (a title given by a model
  measure on an Arabic page, such as the metric switcher's own title measure, which reads the parameter's choices):
  such a title stays as the measure gives it, not blocked. Not checked on a bilingual report with metricSwitcher.

## Lessons for the reviewer
- A new text kind (dynamicTitle) has to be added to every gate that lists title kinds: plan_layout's bilingual title
  gate still names only title, titleMeasure and subtitle ids.
