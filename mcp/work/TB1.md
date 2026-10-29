# TB1 (0.3.1): the twin's four broken promises from laptop part 4 (paging, a visual's own names, dynamic titles, label + number)

## Summary
- **Approval:** the reviewer's brief "Go on TB1" (29 Oct), the owner's D-1029-01 ("Fix the 4 twin bugs
  (Recommended)"); binding: D-1027-03 (a title all Arabic or all English), D-1027-04 (Arabic titles drafted and
  approved), D-1027-12 (the twin identical), never translate silently.
- **Base:** `fix/0.3.1-tb1` from `origin/integration/0.3.1` at 694aa8a. Push only this branch. Not TB2's files
  (check-report.mjs, tools/check_report.mjs, TOOLS.md, the two power-bi-mcp pages, beta-page.js).
- **Scope:** 1. `mcp/lib/twin-plan.mjs` (twinFit: the terminology sheet paged on its own, `termsFrom`),
  `mcp/tools/create_arabic_twin.mjs` (the input). 2. `assets/js/report-mirror.js` (labelVisual: a visual's own id
  first), `mcp/lib/twin-texts.mjs` (textsOf: a visual's own name its own text), `mcp/lib/terminology.mjs` (placesOf).
  3. `twin-texts.mjs`, `twin-pages.mjs` (titles from a measure or a field parameter: listed, written only when
  approved). 4. `twin-texts.mjs` rawLabels + `terminology.mjs` (the label beside a value wrapped, V3);
  `report-mirror.js` TEXT_PROPS (the KPI's goal text and a data label's own title/detail listed, Microsoft's catalog).
- **Expected checks:** (written before the work) a new suite `tb1`, about 25 checks, red on 694aa8a first except
  the guards named in the note. P (paging, a made-up report of 85 fields and 200 texts: every call lists at least one
  text, the sheet says moreTerms, every term and every text reached by paging, every answer within 40,000; a small
  report's sheet whole: about 7). V (two cards, one measure, displayNames "Male" / "Female": each its own text by
  page, visual and queryRef; approved on its own; the field's term never written over them; kept said by name; the
  EN-AR copy the same: about 6). D (a title bound to a measure; a chart on a field parameter: listed EN and AR, written
  only when approved as a fixed Arabic title (said: no longer changes), else as it is and in notTranslated by name:
  about 6). B (on the written files: a card's reference label title, a KPI's goal text, a data label title and a
  card's label text wrapped RLI ... PDI with Latin runs isolated; a title beside no value unchanged: about 5).
  Other suites: a report whose field shows under two names on two visuals lists one more text per visual's name
  (said per test if any moves). Full run: the base's suites + 1 (tb1).
- **Got:** `tb1` 24 checks, red on 899e666 first (the base's code): 19 failed there ("Only 0 texts (from 0)", both
  cards «المرضى», no dynamic titles, the goal text unlisted, nothing wrapped); 5 guards green there (P5 answers within
  40,000, P7 a small sheet whole, V5 the sheet consistent, D4 a kept title left as it is, B5 a title unchanged).
  Areas: twin 17 suites pass, arabic 15 pass; lint 0; check-min 75 match, stamps new since main; result-lines,
  changelog-words, agent-memory PASS. No other suite's number changed (mcp 1594, large-model-caps 217, mutation 195).
- **State: DONE.** Full run on 388a02cb: "run-tests: 124 suites passed" (the base's 123 + tb1). CI started after this line: run 40805955529 green (Linux, Windows, macOS).
- **Resume:** none; the reviewer's merge.

## The plan
1. **Paging.** twinFit fits the texts first; when fewer than 20 texts (or all there are) fit, the terminology sheet
   is cut to make room for them (`terminology.moreTerms`: listed, from, notListed, how: "call again with termsFrom");
   `termsFrom` (like textsFrom, the plan only: the plan and what is written stay the same) lists the sheet from that
   row on. askNext stays whole-sheet. So every call lists at least one text, and every text and term is reachable.
2. **A visual's own name.** Per queryRef, the field's name is the one most of its projections show (the model's name
   when not renamed; a tie: the first). A projection showing another name is its own text,
   `fieldAt:<page>/<visual>/<queryRef>` (kind visualField), approved on its own; the engine's labelVisual writes its
   own label, else leaves it as it is: the field's label or term never written over it.
3. **Dynamic titles.** A title whose text is a measure the twin can't translate (the model's, or a report measure not
   of fixed texts), and the automatic title of a visual on a field parameter: a text `title:<page>/<visual>` (kind
   dynamicTitle) with what / whatAr saying it plainly. Approved: written as a fixed Arabic title (the plan says it no
   longer changes with the selection). Not approved: left as it is (the measure, or Power BI composing it), in
   notTranslated by name. The field parameter's automatic title is no longer written as fixed English (it would stop
   following the selection).
4. **Label + number.** An approved Arabic text the twin writes beside a value Desktop draws (Microsoft's catalog:
   cardVisual `referenceLabelTitle.titleText`, `label.text`; kpi `goals.goalText`; charts `labels.dynamicLabelTitle`,
   `labels.dynamicLabelDetail`) is wrapped by the V3 rule: isolateLatin's output, and a wholly Arabic one wrapped
   RLI ... PDI too, so the number beside it keeps its order.

## Before -> after
| Item | Before | After | Where | Test |
|---|---|---|---|---|
| 1 | on a report of 85 fields the sheet (~25,000 characters) and notTranslated filled the answer: "Only 0 texts (from 0) fit" on every call, textsFrom never moved | fewer than 20 texts fit: the sheet is cut to make room (and only when it would keep no row at all, notTranslated with it, Q1's rule kept) (`terminology.moreTerms` with `from`, `termsFrom` to page it; notTranslated as before, whole in the approval window). The fixture: 20 texts and 34 sheet rows in 33,613 characters; all 200 texts and 85 terms reached | twin-plan.mjs twinFit; create_arabic_twin.mjs input | tb1 P1-P7 |
| 2 | `field:<queryRef>` took the first visual's name; the field's label or term was written on every visual (both cards «المرضى»), "Male"/"Female" never listed | the field's name is the model's when shown so (else the most common); another name is `fieldAt:<page>/<visual>/<queryRef>` (kind visualField), approved on its own; with no label it stays as it is (said in notTranslated); the sheet's places skip it | report-mirror.js labelVisual; twin-texts.mjs textsOf, rawLabels; terminology.mjs placesOf; twin-plan.mjs | tb1 V1-V6 |
| 3 | a title bound to a model measure (or a report measure not of fixed texts) was never a text; a field-parameter chart's title was written as fixed English (two fields) or never listed (one) | kind dynamicTitle (`title:<page>/<visual>`), what / whatAr: it changes with the selection; approved: written as a fixed Arabic title (`approved` / `approvedAr` say it no longer changes); not approved: left as it is, in notTranslated by name with why and whyAr (shown in the approval page's language) | twin-texts.mjs autoTitlesOf, textsOf, notTranslatedOf; twin-pages.mjs; twin-plan.mjs; approval-window.mjs; approval-ar.mjs | tb1 D1-D6 |
| 4 | an Arabic label beside a value was written bare (isolateLatin leaves a wholly Arabic text as it is): Desktop's paragraph moved the value's signs; a KPI's goal text and a data label's own title were not listed | the beside-a-value properties (catalog: cardVisual referenceLabelTitle.titleText, label.text; kpi goals.goalText; labels.dynamicLabelTitle, dynamicLabelDetail) written RLI ... PDI (isolateBeside: isolateLatin, then a wholly Arabic one wrapped); goalText, dynamicLabelTitle, dynamicLabelDetail added to the engine's TEXT_PROPS | terminology.mjs isolateBeside; twin-texts.mjs rawLabels; report-mirror.js TEXT_PROPS | tb1 B1-B5 |

## CHANGELOG line
(at the end of [Unreleased]) "The Arabic twin of a large hand-built report: ..." (paging, a visual's own names, titles
that change with the selection, an Arabic label beside a number).

## Decisions I made
- The texts' room: 20 (or all there are); below it the sheet alone is cut; only if it would keep no row at all are the
  sheet and notTranslated cut to the same number of rows (Q1: notTranslated whole while the texts can make room). A
  threshold of 10 rows failed large-model-caps C-2 in the mutation suite's copy (a longer folder, a longer answer).
- A field's name: the model's when any visual shows it so; else the name most visuals give it (a tie: the first).
  So a DataArcus report that names a field the same everywhere lists nothing new.
- A dynamic title's text is the measure's name (the title's words are computed: never run, metadata only); no draft.
- A field-parameter visual's automatic title kept: left to Power BI (it follows the selection), not written as fixed
  English as before; its `what` says Power BI composes it from both names if another field of the visual is Arabic.
- The bidi wrap only on the five catalog properties beside a value; titles, alt texts and "no data" texts unchanged
  (measured shapes kept). A wholly Arabic one is wrapped too: the V3 rule's whole-text wrap, measured on every canvas.
- The metric switcher's "cannot" line no longer claims DataArcus's script named a hand-built report's field parameter.

## For the owner
- A kept field-parameter title on a visual whose other field gets an Arabic name: Power BI composes it from both
  (mixed, against D-1027-03). The plan says so and offers a fixed Arabic title; should the twin refuse to keep it then?

## Risky changes
- What an answer returns: create_arabic_twin's plan may now cut its terminology sheet (moreTerms, termsFrom) and, with
  it, notTranslated (moreNotTranslated, as before); new text kinds visualField and dynamicTitle; notTranslated rows may
  carry whyAr. Written files: a visual's own field name no longer takes the field's label; the beside-a-value labels
  are wrapped; a field-parameter chart's title is no longer written as fixed English when not approved.
- The approval step: the approval page shows a notTranslated why in Arabic when the plan gives one. No test loses checks.

## For the laptop
- ER: the two gender cards listed as "Male" and "Female" on their own; approved, each reads its own Arabic; the
  reference labels «مقارنة بالشهر الماضي» read with the value's sign where an Arabic reader expects it ("-7.34%").
- RepeatIQ and Fintech: the first create_arabic_twin call lists texts (no "Only 0 texts"); termsFrom pages the sheet;
  RepeatIQ's KPI label «شهريًا» with its % beside the number, not the word.
- Fintech's matrix title and AdventureWorks' field-parameter chart title: listed, said in Arabic; approved, a fixed
  Arabic title; kept, as before (the measure / Power BI's own).

## Seen, not in scope
- A subtitle bound to a measure is not listed (the brief names titles); the reference lines' labels (displayName on
  xAxisReferenceLine and the like) are not listed: both stay English, as before.
- termsFrom is not in TOOLS.md (TB2's file; textsFrom is not there either).

## Lessons for the reviewer
- The answer's room is shared by three lists (texts, the sheet, notTranslated); a fit that cuts only one starves the
  others: the sheet alone went to 0 rows on the fixture, and cutting notTranslated with it broke Q1's large-model rule
  (large-model-caps C-2, caught by the full run, and again in the mutation suite's copy: a longer folder name makes a
  longer answer, so a fit's margin is path-dependent). A paging test should walk every list to its end.
