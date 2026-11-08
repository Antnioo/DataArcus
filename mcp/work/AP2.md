## Summary
- **Approval:** D-1108-07 (8 Nov, the owner: "yes to all"): A-TP1-1 Arabic approved; A-PF2-1, A-PF2-2, A-E1R5B-1 fixed
  in AP2, each as the reviewer recommended. The brief "AP2 0.3.2" (8 Nov), B-390.
- **Base:** `fix/0.3.2-ap2` from `origin/integration/0.3.2` at 1fad33a5 (Merge B386). Push only this branch; integration
  merged in once, right before the last CI; never merge into it, no PR.
- **Scope:** 1. A-TP1-1: the DRAFT marks beside the tooltip caption and the count line go (mcp/work/TP1.md; the code
  had none); no text change. 2. A-PF2-1: pagesWritten (plan-lint.mjs) lists each page's visuals in reading order,
  through the shared `readingOrder` (assets/js/report-a11y.js) and each page's language (check-language.mjs
  `filledLanguages`). 3. A-PF2-2: the approval window (approval-disclosure.mjs pagesSection) names the measure each card
  shows and counts the "no data" message boxes on their own line; English and Arabic. 4. A-E1R5B-1: glass whose page
  picture is the plain page colour is said as such by the plan and the approval page (the Arabic a DRAFT).
- **Expected checks:** new suite ap2 (area report) 28 checks, red on 1fad33a5 first (6 of 28); approval-complete 68 ->
  68 (A9-2 changed on purpose); sp23 29, sp44 23, sp3 11, sp7 11, sp13 12 (re-recorded on purpose, below); pf2 15, sp29
  21, sp4 5, sp6 13, fn1e 590, site sp6 4 unchanged; lint 0; repo checks PASS.
- **Red first:** ap2 on 1fad33a5 (c205aa78, the suite alone): 6 of 28 pass (R1-1..6, R2-1..6, R3-4..7 x2, R3-9, R4-2
  fail); now 28 of 28.
- **State:** CI_PLACEHOLDER
- **Resume:** the reviewer reads and merges.

## Diagnosis (A-E1R5B-1, measured on 1fad33a5 with scratch probes, not committed)
- The glass look's picture (assets/js/design-glass.js glassLook) is the page colour with four colour fields at a
  strength lowered, 0.02 at a time, until the page's own text stands 4.5:1 on every pixel. When the text does not stand
  4.5:1 on the plain page colour itself, the strength goes to 0: the picture is one flat colour. glassFit, the gate,
  lets that pass on purpose ("the page's own text on its own colour once the picture is plain (strength 0), which the
  plain look fails the same way"), so lookFor said glass and its line promised "a soft page picture".
- The inputs that reach the writer so (plan, approve, write, the PNG decoded): (a) the model's own report theme with a
  mid-grey page (an Old.Report beside the model, foreground #333333, page #8a8a8a: the "first own report" route,
  plan_layout's reportTheme): plan look glass, 2 glass PNGs of 1 colour each; (b) a design with its own colours
  (generate_theme's or given: page #8a8a8a, text #333333): the same. The default input: 2,274 colours a picture. 9
  other inputs (Arabic, kpis 0, slide-in panel, 640 x 360, no second page, dark and light report themes, a theme file,
  generate_theme's design, flip cards, gallery) kept their picture. `colors.background` alone does not move the page.
- Can such a case carry a picture? A colour field darker than the page lowers the text's contrast further on a page
  where it already fails; the engine draws none for that reason. So the page says so (the brief's other branch).
- The two episodes' transcripts are not in DataArcus: R3 pins (a) and (b) as made-up fixtures (L-1105-09).

## Before -> after
- A-PF2-1: pagesWritten's lists (slicers, buttons, cards, the kinds' order) were the files' order (AP1's sort read
  `rx`/`ry`, which report-inventory.mjs deletes) -> rows top to bottom, each row left to right, right to left on a page
  whose language is Arabic or Hebrew. The same order the writer gives Tab stops (report-a11y.js readingOrder). PF2's own
  (y, x) card sort is gone: the cards follow the one order. plan_layout's cardsWritten (it reads pagesWritten) now lists
  an Arabic page's cards right to left.
- A-PF2-2: "7 cards" (3 cards with a measure and 4 "no data" boxes) -> `3 cards: Total Sales, Orders, Avg Price` and
  `4 "no data" message boxes: each over a chart, shown when it has no data`; Arabic «البطاقات: 3 («Total Sales»، ...)»
  and «مربعات رسالة «لا توجد بيانات»: 4 (كل منها فوق مخطط، يظهر عندما لا تكون لديه بيانات)» (DRAFT). A card with no
  measure: `N cards with no measure` / «بطاقات دون مقياس: N» (DRAFT). A card shows its measure's name alone (a model's
  measure names are unique).
- A-E1R5B-1: glassFit gains `picture: false, textOnPage` only for a glass that fits at strength 0 (every other result
  as on the base: sp6); lookFor gains `noPicture { textOnPage, min }` and says in sayInPlan "see-through cards over the
  page's own colour, with no page picture: the page's text stands 3.6:1 on that colour (the grey page), under 4.5:1, and a picture
  would lower it"; the approval page's Card look says the same, and the page background files are "Page backgrounds
  (the glass look's page colour, plain: no picture with these colours)"; the Arabic line and label a DRAFT. What is
  written: unchanged, byte for byte (sp3, sp7, sp13's written files equal).
- A-TP1-1: TP1.md's two DRAFT marks -> "approved by the owner, D-1108-07"; approval-complete A11-8's message the same.

## Tests (each number from the run's own PASS/FAIL line)
| suite | base 1fad33a5 | after |
|---|---|---|
| ap2 (new) | 6 of 28 | 28 |
| approval-complete | 68 | 68 (A9-2 changed on purpose) |
| sp23, sp44 | 29, 23 | 29, 23 (re-recorded) |
| sp3, sp7, sp13 | 11, 11, 12 | 11, 11, 12 (re-recorded) |
| pf2, sp29, sp4, sp6, fn1e | 15, 21, 5, 13, 590 | the same |
| site: sp6, sp29, sp31, design-engine, theme-generator, theme-logo, pbip | sp6 4 | 4, 8, 17, 600, 922, 753, 111 PASS |
AREAS_PLACEHOLDER

## Changed on purpose
- sp23-approval.json and sp44-approval.json (the same 4 pages each): the base's pages (worktree at 1fad33a5) and this
  branch's dumped (SP23_DUMP, SP44_DUMP) and compared tag by tag; every other page and prompt byte for byte. report-en
  101152 -> 101444, report-ar 103499 -> 103933, report-cap 53159 -> 54207, report-hostile 101362 -> 101654. The only
  lines that differ: page 1 "7 cards" -> "3 cards: Total Sales, Orders, Avg Price" + "4 "no data" message boxes: ...";
  page 2 "6 cards" -> the same 3 cards + 3 message boxes; each tooltip page "1 card" -> "1 card: Total Sales"; "2
  groups" / "3 groups" one line later (the kinds in reading order); the Arabic page the same in Arabic; report-cap's 14
  pages "1 card" -> "1 "no data" message box: ..." and its 2 tooltip pages "1 card: Total Sales".
- sp3-answers.json (R4, R5), sp7-reports.json (T3, T4, T6, T7), sp13-reports.json (T3, T4): dumped on both (SP3_DUMP,
  SP7_DUMP, SP13_DUMP) and compared: in each, plan_layout's answer differs only in cardsWritten, the same cards on the
  same pages, reordered right to left on the Arabic report pages («تحليل», «نظرة عامة», «ملخص تنفيذي», «التفاصيل»,
  «مراقبة العمليات», «رسالة واحدة»), the same length; every written file and create_report answer equal.
- approval-complete A9-2: the written cards read back by measure and the "no data" boxes apart (was: every card visual
  counted as "cards", 6 on page 1 = 2 cards + 4 boxes). Stricter: each card's measure names are now checked too.

## CHANGELOG line
The approval page says exactly what is written: lists in reading order, cards by measure, "no data" boxes apart, and
no soft page picture promised where the colours leave no room for one.

## Decisions I made
- Reading order by the shared readingOrder (rows, as the Tab order), not a plain (y, x) sort: two cards a few units
  apart in height on one row read left to right (R1-3), as the writer's Tab order and check_report's A11Y_TAB_ORDER do.
- A page's direction from filledLanguages (the native copy's reading: language buttons, linking pages, its own texts),
  called through check-report.mjs's rulesInput, never a copy; no import cycle (checked: plan-lint is not under it).
- The cards line goes where the first card kind was; pagesWritten's data keeps its kinds (only the page words change).
- A-E1R5B-1: the page says it (no picture can be drawn without lowering the page's text); the writer still writes the
  flat glass PNG (the twin and the preview know it by its mark). lib/design.mjs lookFor changed (not in "Owns", in no
  other job's list): it is the one place the plan's look line is made. glassFit's new keys only for a glass that fits.
- The ratio said rounded down to one decimal, as glassFailed's.

## For the owner
- The Arabic drafts (approve or edit): «مربعات رسالة «لا توجد بيانات»: N (كل منها فوق مخطط، يظهر عندما لا تكون لديه
  بيانات)»; «بطاقات دون مقياس: N»; the card look «الشكل الزجاجي (الافتراضي): بطاقات شفافة فوق لون الصفحة نفسه، دون صورة
  للصفحة: تباين نص الصفحة مع هذا اللون 3.6:1، أي أقل من 4.5:1، وأي صورة ستخفضه؛ وللبطاقات العادية: اطلب الشكل العادي»
  (and «، كما طلبت» when asked); the files «خلفيات الصفحات (لون الصفحة في الشكل الزجاجي، دون صورة مع هذه الألوان)».

## Risky changes
- The approval step (what the page says): the page list's card lines and the card look line in the no-picture case;
  nothing about what is approved or written. What an answer returns: plan_layout's look gains `noPicture` (that case
  only); cardsWritten's order on Arabic pages. The website engine's glassFit gains two keys in that case (the Theme
  Generator reads `fits` only). Tests that lose checks: none.

## For the laptop
- Plan a report on a made-up model whose own report's theme has a mid-grey page (#8a8a8a, text #333333): the approval
  page says no page picture; Desktop shows the cards on the plain page colour.

## Seen, not in scope
- The website's Theme Generator (theme-generator.js, FN1H's file) shows glass in the same no-picture case without a word.
- approval-ar.mjs:50 "(DRAFT for the owner, mcp/work/PL1.md)" and approval-disclosure.mjs:180 "(the Arabic: a draft for
  the owner, mcp/work/AP1.md)": both approved by D-1105-16; the marks stay.
- A pale page text gives a faint picture (text #6b6b6b on white: strength 0.10), still a picture; not said.
- "The name inside Table[...]" is parsed inline in about 8 places (plan_layout, terminology, twin-texts, plan-headroom,
  check_model_health, approval-disclosure measureName): a family for CONTRACTS.md.

## Lessons for the reviewer
- A change to pagesWritten's order moves plan_layout's cardsWritten too (sp3, sp7, sp13 on Arabic plans): the brief
  named sp23 only; the report area run found them.
- sp6 pins glassFit's exact result: a new key for every design moved it; added only where it means something.
