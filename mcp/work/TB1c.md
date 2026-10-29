# TB1c (0.3.1): laptop part 5's two twin fails (a field's own name, a title bound to a column), titleMeasures, the validator's fix text

## Summary
- **Approval:** the reviewer's brief "TB1c: the two part 5 fails" (29 Oct): laptop part 5 (rc.4 = integration
  115db29f) on the owner's 6 dashboards: B2 and B4 FAIL. The owner: D-1029-01 (the twin's promises), D-1027-03 (a
  title all Arabic or all English), D-1027-04 (Arabic titles drafted and approved), never translate silently.
- **Base:** `fix/0.3.1-tb1c` from `origin/integration/0.3.1` at 115db29f. Push only this branch.
- **Scope:** 1. `mcp/lib/twin-texts.mjs` (fieldNamesOf: the field's text always the model's own name, from the
  field itself). 2. `twin-texts.mjs` (a title whose text is any expression but a literal or a translatable report
  measure: a column, an aggregation: a dynamicTitle), `twin-plan.mjs` (mixedTitles covers it). 3. `twin-pages.mjs`
  (titleMeasures: a measure whose every title was approved as a fixed Arabic title is no longer "not translated").
  4. `mcp/lib/check-report.mjs` (a validator finding's fix: only what is measured).
- **Expected checks:** (written before the work) a new suite `tb1c`, about 10 checks, red on 115db29f first except
  guards. F (one measure, two cards renamed "Male" / "Female" (the Female card's nativeQueryRef "Female" too, the
  shape that gives the laptop's result), five visuals with no displayName: the field's text the model's name; Male and Female each their own;
  approving the field writes on the five only, each card its own: about 4). C (a line chart whose title is Min of a
  field parameter's column, its date axis approved Arabic: listed EN and AR; kept: no plan id (mixedTitles); approved
  a fixed Arabic title: a plan id and written: about 3). W (the write answer's titleMeasures agrees with notTranslated
  for two measure titles approved as fixed Arabic: 1). V (a validator finding of an openedInDesktop code: its fix says
  only what is measured; no "fixes most structure problems" anywhere: about 2). Other suites: a report whose
  projection's nativeQueryRef differs from its field's name may list one more own name (said per test if any moves).
  Full run: the base's suites + 1 (tb1c).
- **Got:** `tb1c` 10 checks, red on 115db29f first (the code; 0f803554 is the note only): 9 failed there (F1 the
  field's text "Female", as the laptop saw; F2, F4, C1-C3, W1, V1, V2); 1 guard green there (F3 the five visuals).
  Areas: twin 19, arabic 15, checker 7 suites pass; lint 0; check-min 75 match. One other suite changed on purpose:
  arabic-sweep 255 = 255 (see Risky changes). mcp 1594 = 1594; mutation 198 (76 mutants, all killed).
- **State: DONE.** Full run on b7cf34c3: "run-tests: 127 suites passed" (the base's 126 + tb1c). CI started after this line.
- **Resume:** none; the reviewer's merge.

## The plan
1. **The field's text.** The field-level text (`field:<queryRef>`) is always the model's own name: the measure's or
   column's Property (an aggregation's nativeQueryRef, else the queryRef's name), never a visual's displayName nor a
   nativeQueryRef Desktop rewrote. Every projection with a displayName other than that name is its own `fieldAt:` text.
2. **A title bound to a column.** A title whose text is an expression other than a literal or a report measure the twin
   translates (a column, an aggregation of a column, a model measure): a dynamicTitle naming what gives it, approved as
   a fixed Arabic title or kept; kept on a visual where another field gets an Arabic name: mixedTitles, no plan id (as
   TB1b's field parameter titles). A title given by a measure keeps TB1's rule (keep allowed: the reviewer's part 5
   PASS).
3. **titleMeasures.** A title measure whose every title in the twin was replaced by an approved fixed Arabic title is
   said as `fixed` (no longer in notTranslated nor in "cannot"); the plan's and the write's blocks agree.
4. **The validator's fix.** No finding says "opening and saving the report fixes most structure problems" (not
   measured); an openedInDesktop code's fix says the measurement: Desktop 2.159 opened reports with this shape with
   no error, and saving in Desktop may rewrite it.

## Before -> after
| Item | Before | After | Where | Test |
|---|---|---|---|---|
| 1 | the field's text was "the model's name when a visual shows it so, else the most common", the model's name read from nativeQueryRef: a projection whose nativeQueryRef carries its visual's name (the fixture's Female card, which gives the laptop's result) passed as the model's name (the last such visual won) and became the field's text; «إناث» approved for it went on five charts of all patients | the field's text is always the model's own name, read from the field (a measure's or column's Property; an aggregation's nativeQueryRef); every projection with a displayName other than that name is its own fieldAt text | twin-texts.mjs modelName, fieldNamesOf | tb1c F1-F4 |
| 2 | a title whose text is a column or an aggregation of one (Min of a field parameter's column) was not listed: written English beside an Arabic axis | a dynamicTitle ("A title given by the column ... (the value chosen in it)", EN and AR); approved: a fixed Arabic title; kept where another field of the visual is Arabic: mixedTitles, no plan id (`mixOf`, as TB1b's field parameter titles) | twin-texts.mjs textsOf, DYNAMIC.column; twin-plan.mjs mixedTitles | tb1c C1-C3 |
| 3 | the write's titleMeasures said "translated: 0" and listed as not translated a model measure whose titles were all written as approved fixed Arabic; the plan's cannot said the same | a title measure no title of the twin still shows is `titleMeasures.fixed` (with why), not in notTranslated nor cannot | twin-pages.mjs; twin-plan.mjs | tb1c W1 |
| 4 | every validator finding's fix: "opening and saving the report fixes most structure problems" (not measured) | an openedInDesktop code: "Power BI Desktop 2.159 opened reports with this shape with no error (measured 28 Oct 2026); saving the report in Desktop may rewrite it"; any other: Microsoft's reference only | check-report.mjs OPENED_FIX | tb1c V1-V2 |

## CHANGELOG line
(at the end of [Unreleased]) "The Arabic twin keeps each field's meaning: ..." (the field's own name; a title given by
a column; titleMeasures; check_report's fix text).

## Decisions I made
- An aggregation's model name stays its nativeQueryRef ("Sum of X", as the writer names it): it has no Property of its own.
- A title given by a column takes the mixed-title refusal; a title given by a measure keeps TB1's rule (keep allowed),
  as the brief says (part 5: measure titles PASS).
- A validator code outside DESKTOP_OPENED says only "See Microsoft's report authoring reference for this code": nothing
  else is measured for it.

## For the owner
none

## Risky changes
- A report that renames a field the same way on every visual (a displayName other than the model's name) now lists
  one own text per visual instead of one field text (the brief's rule: the field's text is always the model's name).
  The terminology sheet's term is not written over them.
- arabic-sweep (test-0.3.0-arabic-sweep.mjs, 255 checks = 255): it counts the English report's model scripts' texts as
  shown on the Arabic pages; a switcher title measure whose every title the person approved as fixed Arabic is now
  `titleMeasures.fixed` (shown nowhere in the twin) instead of the stale `cannot` line it accepted: the sweep accepts
  `titleMeasures.fixed` too. No check removed.
- What an answer returns: titleMeasures.fixed; check_report's fix text. No test loses checks.

## For the laptop
- ER: the field «Patients» on the five charts and the matrix; "Male" and "Female" each their own Arabic.
- AdventureWorks' line chart 88420081: listed; kept beside its Arabic date axis, the twin refuses and says why; approved,
  a fixed Arabic title.
- RepeatIQ's two measure titles approved as fixed Arabic: the write's titleMeasures says them fixed.

## Seen, not in scope
- none

## Lessons for the reviewer
- A name read from nativeQueryRef is not the model's name: a projection can carry the visual's own name there (the
  fixture's shape for the Female card reproduced the laptop's "Female" exactly; that Desktop writes it so is inferred,
  not measured). Read the field's own Property.
