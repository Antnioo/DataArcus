## Summary
- **Approval:** the brief "DD2Z (0.3.2): the last two families in one place: vt-slicer and blank" (5 Nov); owner D-1104-12
  (one library, fix at the source), D-1104-15 (filterSlicer a slicer only after a Desktop check; SVG KPI math follows the compiled DAX).
- **Base:** `fix/0.3.2-dd2z` from `origin/integration/0.3.2` at edf2951b. Push only this branch; never merge, no PR.
- **Scope:** CONTRACTS.md families vt-slicer (5 places -> 1) and blank (2 places -> 1). Not in this job: other families,
  the SVG KPI compiler's DAX (the truth here), B-380, B-381.
- **Plan, one commit each:** 1 this note; 2 parity tests first (mcp/test-0.3.2-dd2z.mjs: the probe's 18 types, the 7 DAX inputs,
  the 2 ring rows; recorded on the base, red where a place disagrees); 3 vt-slicer: visual-types.js `SLICER_TYPES` = the four
  Desktop makes, `isSlicer` the one place; mirror-policy kindOf, page-preview kindOf, report-a11y and report-inventory call it;
  4 blank: one evaluator in svg-expressions.js (DIVIDE and `/` as measured), svg-editor-panels evalValues calls it;
  5 CONTRACTS.md (both "**One place:**", measured table with source) and the probe lines; 6 build:min, suites, lint, CI.
- **Measured (lab/look032 A and B, Power BI Desktop 2.159.1231.0):** slicers = slicer, advancedSlicerVisual, listSlicer, textSlicer
  (filterSlicer is none of them); DIVIDE(5,BLANK)=BLANK, DIVIDE(BLANK,BLANK)=BLANK, DIVIDE(5,0)=BLANK, 5/BLANK=Infinity,
  BLANK/BLANK=BLANK, 5/0=Infinity, 0/0=NaN.
- **Expected checks:** dd2z new; CONTRACTS.md 28 of 28 families in one place; only filterSlicer's answer changes in
  visual-types/report-inventory (read_report, check_report); sp16's recorded D21 line ("evaluator threw DIV0") changes on purpose;
  every other suite's number unchanged; lint 0.
- **State:** started.
- **Resume:** continue at the next unchecked commit of the plan.

## Decisions I made
- (filled in as the work goes)
