## Summary
- **Approval:** the reviewer's brief "Go on TW1" (27 Oct); the owner, D-1027-12: "i want the twin to be identical that
  is why it's called a twin"; D-1027-20: "if something seen not in scope found that needs to be fixed fix it" (items 8, 9).
- **Base:** `origin/integration/0.3.1` at 13afb3a (GD2, ST1, SF1 merged). Branch `fix/0.3.1-twin-parity`.
- **Scope:** nine items of ST1's STOP-GAP table and FIXED-HERE-NEXT list. Not `design-engine.js` (TS1), not
  `pbip-export.js` nor the generator's download step (TT2). In `theme-generator.js` only the glass table (98-99) and
  the ?v= stamp list.
- **Items:** 1 M1-S1 panels kept, mirrored; 2 M1-S2 the twin's table says «الإجمالي» (the writer's right-to-left table,
  round 23, measured PASS in DESKTOP-TESTS.md 2026-10-08); 3 M1-S3 a number column's continuous axis reversed in the
  twin as in create_report; 4 SQ4-S2 the twin's phone card title takes the writer's wrap rule; 5 GL2-S2 the website's
  glass table clear header, banded odd rows; 6 GL1-S2 the plan's words follow the look; 7 SQ13-S1 plan-lint's build
  mirrors charts; 8 SQ1-S2 a stacked slicer slot drops what does not fit; 9 SQ15a-S2 the bullet bar says an expression
  target.
- **Expected checks:** new suite `tw1` (items 1, 2, 4, 8, 9): about 20 checks; parity +1 (item 3) and its KNOWN.textPanel
  gone; glass-default +2 (item 6); sq13 +1 (item 7); website theme-generator +2 (item 5).
- **Expected changes on purpose:** twin suites that assert `panelsOff` / `textBoxes` (item 1) and a twin table's
  projections (item 2) change, each said below; plain reports otherwise byte for byte.
- **Resume point:** see "Progress" below.

## Plan
1. M1-S1: `textPanelsOff` and the answer's `textBoxes` go; a text box keeps its panel (mirrored like every visual).
   Parity: KNOWN.textPanel and its delete go (C, B and W then compare panels too).
2. M1-S2: in `buildTwin`, after the labels, a mirrored table whose original first projection is a text column (the
   model's type when known) and which holds a number gets the writer's shape: the text column first, width 0; the
   numbers reversed; "Row label: <Column>" last, a report measure in the twin's reportExtensions.json with the
   writer's DAX (`rowLabelDax`, «الإجمالي»), named free as the waterfall's are. The plan says it (`tables`).
3. M1-S3: `continuousColumnsOf` (date columns and number-typed columns, as the writer's CONTINUOUS) passed to the
   mirror as its continuous list; the waterfall's type reading is unchanged (the model's type comes first).
4. SQ4-S2: `labelMobile` on a new card's phone title: the writer's rule (one line where it fits, two lines with
   titleWrap and the two-line card fit where they fit, else one line without titleWrap; the approved text is never cut).
5. GL2-S2: glass header row clear, odd rows `gl.table.band`.
6. GL1-S2: after `lookFor`, a glass look replaces `solidVisuals` with the glass wording.
7. SQ13-S1: plan-lint's build passes `chartAxes: 'mirrored'` for a right-to-left plan, as create_report's default.
8. SQ1-S2: the stacked branch drops the Reset button, then slicers from the last, while they do not fit the height.
9. SQ15a-S2: `kpiSaid` exported; bulletBar's notUsed adds it per measure whose KPI target is an expression.

## Progress
- Plan committed.
