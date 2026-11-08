## Summary
- **Approval:** D-1108-07 (8 Nov, the owner: "yes to all"): A-TP1-1 Arabic approved; A-PF2-1, A-PF2-2, A-E1R5B-1 fixed
  in AP2, each as the reviewer recommended. The brief "AP2 0.3.2" (8 Nov), B-390.
- **Base:** `fix/0.3.2-ap2` from `origin/integration/0.3.2` at 1fad33a5 (Merge B386). Push only this branch; integration
  merged in once, right before the last CI; never merge into it, no PR.
- **Scope:** 1. A-TP1-1: the DRAFT marks next to the tooltip caption and the count line (approval-view.mjs) go; no text
  change. 2. A-PF2-1: pagesWritten (plan-lint.mjs) lists each page's visuals in reading order, through the shared
  `readingOrder` (assets/js/report-a11y.js: rows top to bottom, each row left to right, right to left on a right-to-left
  page) and each page's language (check-language.mjs `filledLanguages`), never a copy. 3. A-PF2-2: the approval window
  (approval-disclosure.mjs pagesSection) names the measure each card shows and counts the "no data" message boxes on
  their own line, never as cards; English and Arabic. 4. A-E1R5B-1: the glass look whose picture is plain (below):
  the plan and the approval page say so for that case, English and Arabic (the Arabic a DRAFT for the owner).
- **Expected checks:** new suite ap2 (area report) about 30 checks, red on 1fad33a5 first; approval-complete 68 -> 68
  (A9-2 changed on purpose: cards by measure, message boxes apart); sp23 29 -> 29 and sp44 23 -> 23 (the hashes of the
  pages whose order or card lines move, re-recorded on purpose and named); pf2 15, sp29 21, sp4 5, sp6 13, site sp6
  unchanged; lint 0; agent-memory, modules, contracts, result-lines, changelog-words PASS.
- **Resume:** plan pushed; next the red suite, then one commit per item.

## The plan (one commit each)
1. This note.
2. Red first: `mcp/test-0.3.2-ap2.mjs` (registered in tests.json, area report), every part red on 1fad33a5:
   R1 (A-PF2-1) made-up files, an English page and an Arabic page, visuals written out of reading order: slicers,
   buttons and cards listed as a person reads them. R2 (A-PF2-2) the report page (summary + approval-view) with cards
   and message boxes, English and Arabic. R3 (A-E1R5B-1) the two episodes' inputs (below) through plan_layout,
   approve_plan (the page as the browser gets it), create_report: what the page says of the picture is what is written;
   the default input keeps its soft picture and its line. R4 (A-TP1-1) no DRAFT mark beside the approved lines.
3. A-TP1-1, A-PF2-1 (sp23 re-recorded), A-PF2-2, A-E1R5B-1; then area runs, CI.

## A-E1R5B-1: why the picture was missing (measured on 1fad33a5, scratch probe, not committed)
- The glass look's picture (assets/js/design-glass.js glassLook) is the page colour with four colour fields at a
  strength lowered, 0.02 at a time, until the page's own text stands 4.5:1 on every pixel. When the text does not stand
  4.5:1 on the plain page colour itself, the strength goes to 0: the picture is one flat colour. glassFit, the gate,
  lets that pass on purpose ("the page's own text on its own colour once the picture is plain (strength 0), which the
  plain look fails the same way"), so lookFor says glass and its line promises "a soft page picture".
- Inputs that reach the writer that way (plan, approve, write, the PNG decoded): (a) the model's own report theme with
  a mid-grey page (an Old.Report beside the model, foreground #333333, page #8a8a8a: the "first own" route,
  reportTheme): plan look glass, 2 glass PNGs of 1 colour each; (b) a design with its own colours (generate_theme's or
  given: ui page #8a8a8a, text #333333): the same. The default input: 2,274 colours a picture. 9 other inputs (Arabic,
  kpis 0, slide-in panel, small page, no second page, dark and light report themes, a theme file, generate_theme's
  design, flip cards, gallery) all kept their picture. `colors.background` alone does not change the page colour.
- Can such a case carry the picture? Any colour field darker than the page lowers the text's contrast further on a page
  where it already fails; none can be drawn without making the page's text harder to read. So the page says so.
