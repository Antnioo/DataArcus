# VC2 (0.3.2): the approval page shows the twin's order warning, and the warning knows all its functions (B-306)

## Summary
- **Approval:** the owner's brief "VC2" (3 Nov; D-1103-10, one of up to 3 builders tonight), D-1027-12 ("i want the
  twin to be identical that is why it's called a twin"), D6 (every approval page says what its click writes).
  Earlier: VC1 (`orderCalculations` in the twin's plan), SP23 (approval-disclosure.mjs).
- **Base:** `fix/0.3.2-vc2` from `origin/integration/0.3.2` at 82c11e1. Push only this branch; never merge, no PR.
- **Scope:** (1) the twin's approval page gets a section "Turned visuals with an order calculation (N)" when the
  plan carries `orderCalculations`: one row per visual (its safe page/visual name and its functions, then VC1's
  sentence), EN and AR cells, the heading in HEAD_AR (the twin's page is Arabic, wholly). (2) OFFSET, INDEX, WINDOW,
  RANGE, ROWNUMBER join `ORDER_FUNCTIONS` in `mcp/lib/twin-calcs.mjs` (the one list; the page imports it, never
  a copy). Files: twin-calcs.mjs, approval-disclosure.mjs (the section), approval-window.mjs (one HEAD_AR pair
  only), tools/create_arabic_twin.mjs (the plan's data carries `orderCalculations`, only when present), a new
  suite `test-0.3.2-vc2.mjs` (area safety), tests.json, CHANGELOG.md, WORK.md.
- **Expected checks:** `vc2` about 14, red on 82c11e1 first: the page's section and rows (R1-R3), the 5 new
  functions in the plan and on the page (N1-N5), the one list (L1) red; guards green on the base: colRegion not
  named (R4), a plain twin's page has no section (R6), no expression text in any answer, page or prompt (G1),
  a hostile visual name escaped / an unknown function dropped (G2), the answer under its cap (G3).
  Unchanged: vc1 11, sp23 29 (all 12 recorded pages and prompts: none of sp23's plans holds a visual calculation,
  so no record moves), fx1 22 (3 runs), every other suite's number.
- **Base numbers (82c11e1):** fx1 22 / 22 / 22; vc1 11 (plan answer: plain 15,847, vc1 shape 17,536); sp23 29.
- **State:** plan pushed; work next.

## The plan
1. The test first (`vc2`), red on the base.
2. twin-calcs: the 5 names join the list; sayInPlan names them too (only a plan with such a visual grows).
3. create_arabic_twin: `orderCalculations: { count, visuals, notListed? }` in the plan's data when the answer has it.
4. approval-disclosure: the section after "Visuals the twin adds"; function names filtered by `ORDER_FUNCTIONS`.
5. approval-window: the heading's Arabic in HEAD_AR (rendering only).
6. Answer sizes (L-1102-06) and fx1 x3 after; CHANGELOG, WORK.md, areas, lint, merge in once if moved, CI.

## CHANGELOG line
(after the work)

## Decisions I made
- Area `safety` ("Safety and approval: ... the approval page"): tests.json has no area "approval".

## For the owner
none

## Risky changes
(after the work)

## Seen, not in scope

## For the laptop
none

## Lessons for the reviewer
