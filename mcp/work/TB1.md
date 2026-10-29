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
- **State:** planned.
- **Resume:** the red tests (test-0.3.1-tb1.mjs), then items 1-4.

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
