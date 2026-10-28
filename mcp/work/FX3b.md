# FX3b (0.3.1): Power BI's default title (no title card) in Arabic, its check, the phone layout; the padded charts in the plan

## Summary
- **Approval:** the reviewer's brief "FX3 merged; FX3b" (28 Oct): FX3's Seen 1 and 2 are the owner's most common
  case (his 7 hand-made dashboards, each with an Arabic twin: charts with no title card, Power BI's default title
  «الشريحة by إجمالي الربح»). The owner: D-1027-03, D-1027-04, D-1027-12; item 4: D-1028-06 (FX5b's item 3).
- **Base:** `fix/0.3.1-fx3b` from `origin/integration/0.3.1` at f6e1e45 (FX3 merged, its stamp). Push only this
  branch. Not FX6's files (pbip-bind.js, report-mirror.js, tool-answer.mjs, microsoft-watch.mjs, test-0.3.1-cx2.mjs,
  test-0.3.1-tw1.mjs, golden-expected.json) nor FX5b's (pbip-page.js, pbip-notes.js, theme-generator.js,
  report-inputs.mjs, report-run.mjs, report-said.mjs, sample-counts.mjs, tool-inputs.mjs, TOOLS.md, test-0.3.1-fx5b.mjs,
  the Theme Generator pages).
- **Scope:** 1. `mcp/lib/twin-texts.mjs` (autoTitlesOf: a missing title card on a type whose default title is on),
  `twin-pages.mjs` (writes the text only, never "show"). 2. `assets/js/report-rules.js` (AUTO_TITLE; each type's
  default from Microsoft's catalog). 3. `twin-pages.mjs` (the phone layout's own title formatting takes the same text).
  4. (after FX5b is on integration, the reviewer's word) `mcp/tools/plan_layout.mjs`, `mcp/lib/approval-window.mjs`.
- **Each type's default title:** Microsoft's catalog (@microsoft/powerbi-core-visual-schema 0.1.3, capabilities.json)
  marks 23 types `suppressDefaultTitle: true` (cards, slicer, tables, matrix, buttons, shapes, text box, navigators,
  Q&A, decomposition tree...): their default title is off. Every other catalog type has no such flag: its default
  title is on. A type outside the catalog (a custom visual): not known, never flagged nor written.
- **Expected checks:** (written before the work) a new suite `fx3b`, about 13 checks, red on f6e1e45 first except
  guards: K (the rules' list of types is the catalog's, 1), T (a clustered bar chart and a line chart with no title
  object: listed with an Arabic draft, written as the approved Arabic with no "show", English when none is approved
  and said, a card of two fields with no title card neither listed nor written, the EN-AR copy's English pages
  untouched: about 6), P (the phone: a title formatting entry of its own takes the same text; none: none added, 2),
  R (AUTO_TITLE on an Arabic page: the two charts, not the card nor a custom visual, not on an English page, the twin
  none: 4). Item 4: about 3 checks after FX5b (the plan and the approval page list the padded charts EN and AR, never
  a category's name or value). Any suite whose twin reads a hand-made report with charts that have no title card
  (Microsoft's samples) may list more texts: said per test. Full run: the base's suites + 1 (fx3b).
- **Got (items 1-3):** `fx3b` 13 checks: 7 red on f6e1e45 first (K1, T1, T3, T5, T6, P1, R1), 6 guards green there
  (T2, T4: the card and the custom visual neither listed nor written; P2 no phone title added; R2, R3, R4). fx3 17 = 17.
  Areas: twin 15, arabic 15, checker 6, report 41 suites pass; website run-all 23 pass; lint 0; check-min (75 match).
  No other suite changed (Microsoft's sample reports' twins included).
- **State:** items 1-3 done. Full run on 432c64b (last code commit b032a2c): "run-tests: 121 suites passed" (mcp 1594, fx3b 13; the base's 120 + fx3b). CI started after this line. Item 4 waits: integration did not carry FX5b when items 1-3 were done (still f6e1e45).
- **Resume:** item 4 once the reviewer says integration carries FX5b: merge origin/integration/0.3.1, then the plan.

## The plan
1. A data visual of two fields or more whose title has no text of its own and whose title shows (its card's "show"
   on, or no "show" set and its type's default title on) is listed and written as FX3's automatic titles: its own
   text, the approved Arabic sentence, else the English the twin writes (notTranslated). Only the text property is
   written: a missing card becomes `title: [{ properties: { text } }]`; "show" is never written nor changed.
2. AUTO_TITLE: the same test on a right-to-left page; each type's default from the catalog's suppressDefaultTitle
   (copied into report-rules.js as a list, a test compares it with the catalog: the browser has no npm package).
3. A visual whose mobile.json sets its own title formatting (a title entry with no text) takes the same text there.
4. The padded charts (FX5b's barThickness) in plan_layout's answer and on the approval page, EN and AR.
5. For the laptop: the twin of a report whose charts have no title card.

## Before -> after (items 1-3)
| Item | Before | After | Where | Test |
|---|---|---|---|---|
| 1 | a chart with no title card (Power BI's default title, composed from the field names with its English "by") was not listed in the twin, the EN-AR copy or the bilingual half: the twin left Power BI to compose it from the approved Arabic names with its English "by" (as the laptop saw for A1) | listed with FX3's automatic titles (`automatic: "title"`, its English, an Arabic draft from the approved field names); written as the visual's own text, the approved Arabic, else its English (notTranslated, its own reason first); only `text` is written: a missing card becomes `{ properties: { text } }`, the mirror's `alignment` entry takes the text; "show" never written. A type whose default title is off (a card, a slicer, a table...) or a custom visual: not listed, nothing written | twin-texts.mjs autoTitlesOf, notTranslatedOf; twin-pages.mjs | fx3b T1-T6 |
| 2 | AUTO_TITLE flagged only a title switched on with no text | also a title with no "show" set and no text on a type whose default title is on; each type's default from Microsoft's catalog (`suppressDefaultTitle`, 23 types off; every other catalog type on; a custom visual "not known", never flagged); the list copied into report-rules.js (`DEFAULT_TITLE_OFF`, `defaultTitle`) for the browser, compared with the catalog by K1 | report-rules.js (+ .min.js) | fx3b K1, R1-R4 |
| 3 | a phone layout that sets its own title formatting (a `title` entry, no text) kept no text | that entry takes the text written for the visual's automatic title (mobile.json's container objects are the same schema as visual.json's: `visualContainerMobileState` -> `VisualContainerFormattingObjects`, title.text included); no title entry of its own: nothing added | twin-pages.mjs | fx3b P1-P2 |

## CHANGELOG line
(for the end of [Unreleased], the reviewer's: "What a test run in Power BI Desktop found") A chart with no title of
its own gets its approved Arabic title in the Arabic twin, on the phone too, instead of Power BI's English "by"; the
check names one on an Arabic page.

## Decisions I made
- "Default title on" is the catalog's: no `suppressDefaultTitle` flag. The catalog's type list in visual-types.js is
  the same 58 types as capabilities.json (checked), so the browser needs no npm package.
- A title entry with formatting only (no "show", no text) counts as a missing card: Power BI uses the type's default.
- The mirror adds `title: [{ alignment: right }]` to every twin chart; the text goes into that entry (still no "show").
- The twin lists a no-title-card chart only when its type's default title is on, and only with two fields or more:
  a card or a table with no title card gets no text (item 5: no new title).

## For the owner
none

## Risky changes
- AUTO_TITLE now flags hand-made charts with no title card on an Arabic page: an existing Arabic report built by hand
  will show more findings (warnings), each a real «A by B» title.

## For the reviewer
- `assets/js/report-rules.min.js` changed again: its ?v= stamp lives in theme-generator.js (FX5b's file): left for you.

## For the laptop
1. A twin of a report whose charts have no title card: every chart's title the approved Arabic sentence, no "by".
2. A card or a slicer with no title card in that report: no new title in the twin.
3. The phone layout of that twin: a chart whose phone layout sets its own title size shows the same Arabic title.
4. check_report on the hand-made Arabic report: AUTO_TITLE on each chart with no title card.

## Seen, not in scope
1. The twin's default title (now its own text) keeps the mirror's right alignment; Power BI's default title had no
   alignment set: look at it on the laptop (item 1).

## Lessons for the reviewer
- mcp/WORK.md on integration is at 3,195 of 3,200 characters: a builder can't add a line; its "Running" line already
  names FX3b, so FX3b leaves it as it is.
