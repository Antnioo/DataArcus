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
- **Got:** (filled at the end)
- **State:** plan pushed; items 1-3 next; item 4 waits for the reviewer's word.
- **Resume:** item 1.

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
