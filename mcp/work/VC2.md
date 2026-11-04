# VC2 (0.3.2): the approval page shows the twin's order warning, and the warning knows all its functions (B-306)

## Summary
- **Approval:** the owner's brief "VC2" (3 Nov; D-1103-10, one of up to 3 builders tonight), D-1027-12 ("i want the
  twin to be identical that is why it's called a twin"), D6 (every approval page says what its click writes).
  Earlier: VC1 (`orderCalculations` in the twin's plan), SP23 (approval-disclosure.mjs).
- **Base:** `fix/0.3.2-vc2` from `origin/integration/0.3.2` at 82c11e1. Push only this branch; never merge, no PR.
- **Scope:** (1) the twin's approval page gets a section "Turned visuals with an order calculation (N)" when the
  plan carries `orderCalculations`: one row per visual (its safe page/visual name and its functions, then VC1's
  sentence), EN and AR cells, the heading in HEAD_AR (the twin's page is Arabic, wholly). (2) OFFSET, INDEX, WINDOW,
  RANGE, ROWNUMBER join `ORDER_FUNCTIONS` in `mcp/lib/twin-calcs.mjs`. That is the one list: the page imports
  it and never copies it. Files: twin-calcs.mjs, approval-disclosure.mjs (the section), approval-window.mjs (one HEAD_AR pair
  only), tools/create_arabic_twin.mjs (the plan's data carries `orderCalculations`, only when present), a new
  suite `test-0.3.2-vc2.mjs` (area safety), tests.json, CHANGELOG.md, WORK.md.
- **Expected checks:** `vc2` about 14, red on 82c11e1 first. Expected red there: the page's section and rows (R1-R3),
  the 5 new functions in the plan and on the page (N1-N5), the one list (L1). Expected green there (guards):
  colRegion not named (R4), a plain twin's page has no section (R6), no expression text in any answer, page or
  prompt (G1), a hostile visual name escaped and an unknown function dropped (G2), the answer under its cap (G3).
  Unchanged: vc1 11, sp23 29 (all 12 recorded pages and prompts: none of sp23's plans holds a visual calculation,
  so no record moves), fx1 22 (3 runs), every other suite's number.
- **Base numbers (82c11e1):** fx1 22 / 22 / 22; vc1 11 (plan answer: plain 15,847, vc1 shape 17,536); sp23 29.
- **Got:** `vc2` 14 checks; red on 82c11e1 first: 10 of 14 (R1-R3, N1-N5, L1, G2), R4, R6, G1, G3 green there
  (commit a7ef1e3). After: 14 of 14. vc1 11, sp23 29 (every record unchanged), fx1 22 x 3. safety, twin, arabic:
  70 of 70 suites. Lint 0; agent-memory, changelog-words pass.
- **Plan answer (L-1102-06):** plain 15,847 -> 15,847 (+0); vc1 shape 17,536 -> 17,578 (+42: sayInPlan names the
  5 functions); vc2 shape 18,174; all under 40,000. Page: plain 21,739 (byte-identical: sp23 H1 twin and copy),
  vc1 23,041.
- **sp23's records:** none changes. The brief expected one fixture with the calculations, but none of sp23's 12
  plans has one (its twin and copy are `fixtures/twin-project` as it is).
- **State:** code done, CI next.
- **Resume:** the CI run on this branch (`gh workflow run tests.yml --ref fix/0.3.2-vc2`), then the reviewer's merge.

## The plan
1. The test first (`vc2`), red on the base.
2. twin-calcs: the 5 names join the list; sayInPlan names them too (only a plan with such a visual grows).
3. create_arabic_twin: `orderCalculations: { count, visuals, notListed? }` in the plan's data when the answer has it.
4. approval-disclosure: the section after "Visuals the twin adds"; function names filtered by `ORDER_FUNCTIONS`.
5. approval-window: the heading's Arabic in HEAD_AR (rendering only).
6. Answer sizes (L-1102-06) and fx1 x3 after; CHANGELOG, WORK.md, areas, lint, merge in once if moved, CI.

## What the page says (vc1's shape, the Arabic page)
«مرئيات معكوسة فيها حساب يعتمد على الترتيب (2)»; each row: `المرئي «p1overview/lineMonth» (RUNNINGSUM)` | VC1's
Arabic sentence. Its English cells: `Visual "p1overview/lineMonth" (RUNNINGSUM)` | VC1's English sentence. Over 30
visuals: one more row "N more, not listed here; the plan counts them".

## CHANGELOG line
- **The twin's approval page shows the turned charts to check:** each visual the twin turns right to left that holds
  a running or neighbour calculation is listed on the page you approve, with what to check in Desktop; offset, index,
  window, range and row number calculations are now named too.

## Decisions I made
- Area `safety` ("Safety and approval: ... the approval page"): tests.json has no area "approval".
- The one list stays `ORDER_FUNCTIONS` in `mcp/lib/twin-calcs.mjs`. approval-disclosure.mjs imports it and VC1's
  sentence (`ORDER_CALC_SAID`), and the page names only functions on that list: a name the plan's data carries
  that is not on the list is dropped (G2). twin-calcs.mjs is pure (no I/O), so the disclosure stays pure (sp23 P2).
- The plan's data carries `orderCalculations` as `{ count, visuals, notListed? }` (no sentences, no sayInPlan); the
  page writes the sentence from twin-calcs. A plan without the key is byte-identical to before.
- The page shows a visual's functions after its name ("(OFFSET, INDEX)", "RANK x2" when more than one). These are
  names from the fixed list, never expression text.
- The test reads the page as approve_plan builds it (Approval.summary of the plan's own data, approvalHtml), in
  process; the real server's page for a plain twin is sp23's H1 (unchanged).
- The app's own prompt (promptText) lists the writes and the files only, for every section, so it gets no new
  lines. R6 and G1 still check it.

## For the owner
none (the approval page says more; what Desktop shows does not change).

## Risky changes
The approval page has one more section (read-only text). No approval authority, secret or check changed: in
approval-window.mjs only one HEAD_AR pair (the heading's Arabic) was added, and the HTML rendering, the secret, the
Host and Origin checks, the click and the window's life are byte for byte the same. approve_plan.mjs and plans.mjs
are untouched. Nothing is written before the click in DataArcus's own window, as before.

## Seen, not in scope
- The app's own prompt (elicitation) does not name the turned visuals; it lists only writes and files, for every
  plan.
- INDEX, WINDOW and RANGE are also ordinary DAX functions (outside visual calculations). They are counted here
  only inside a NativeVisualCalculation, so that is no false alarm.

## For the laptop
none (RD2-D2 from VC1 stays; the page's section can be seen at that run's approval step).

## Lessons for the reviewer
- The twin's approval page wraps Latin in `<bdi dir="ltr">` and names in «»: a check on the page compares its text
  with the tags removed, not raw HTML.
- Both package installs are needed locally (`npm ci` at the root and in mcp/). Without the root one, a global
  eslint runs and fails on `globals`.
