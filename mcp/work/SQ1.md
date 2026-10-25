## Summary
- **Approval:** the owner, 25 Oct (the night run, 0.3.1): every "Seen, not in scope" item fixed, carefully. Batch SQ1
  of [SEEN-QUEUE.md](SEEN-QUEUE.md#sq1-written-report-numbers-and-text): written report numbers and text.
- **Scope:** five items: 0.2.9-writer-S14 (urgent), M1-S4 (urgent), 0.2.9-writer-S4, S1-S9, 0.2.9-writer-S6.
  Files: `assets/js/pbip-page.js`, `pbip-query.js`, `pbip-sizing.js` (+ their .min.js, the pages' `?v=` stamps),
  `mcp/lib/report-run.mjs` (M1-S4's note only, not SQ10's lines), a new suite `mcp/test-0.3.1-sq1.mjs`.
  Out: SQ2's files (dax-functions, visual-meaning, visual-replace, native-copy, redesign).
- **Base:** `fix/0.3.1-sq1` from `origin/integration/0.3.1` (639c42b). Push only this branch; no PR, no merge.
- **Expected checks:** `sq1` 18 checks, 12 red before the fixes (A1, B1-B3, B5-B6, C1-C2, D1, D3, E1-E2; the
  guards A2-A3, B4, C3-C4, D2 green before and after). The batch's suites and the full run: no other suite's number moves.
- **Resume:** see "Where it stands" at the end.

## Plan (each item at its cause, in the shared engine)
1. **0.2.9-writer-S14** (`pbip-page.js`, the quarter column labels): a measure the cards show whole (`wholeFormat`: a
   unit, a count) gets display units None (1) and no forced decimal, as its tooltip values (T10's `tipLook`) and its
   card; the rest keep automatic units with one decimal; a percent keeps its own format.
2. **M1-S4** (`pbip-page.js`, the slicer row): a strip whose slicers would be narrower than 24 px (the narrowest Desktop
   was seen to draw, as a sliver; a negative width is not drawn: DESKTOP-TESTS.md, round 23 facts) leaves out the
   Reset button first, then slicers from the last, until each slicer gets 24 at least; each part left out goes in
   `leftOut` with `narrow: true`, and `report-run.mjs` says it in its own note (the plan and the write say the same).
   No size below a measured floor is written; nothing that fits today moves.
3. **0.2.9-writer-S4** (`pbip-query.js` `shown`): a run of control characters (`\p{Cc}`: a tab, a line break) in a
   shown name becomes one space ("Total\tSales" -> "Total Sales"); format characters are dropped as before, the
   joiners kept. The model's names, the DAX and field references are untouched.
4. **S1-S9** (`pbip-query.js` `lastMonths`): the hidden "Last N months: <measure>" helper is in one script: with the
   measure's name when it is all Latin, else "Last N months" (the decision of B-181's "Keep:", plain English).
5. **0.2.9-writer-S6** (`pbip-sizing.js`, `pbip-page.js`): `iconH` (never called) removed; the comment's tooltip page
   is 320 x 284, as written.

## Tests: `mcp/test-0.3.1-sq1.mjs` (area report), `PASS  sq1  18 checks`; written before the fixes
- A (S14): A1 a quarter chart of `#,0 "kg"`: labelDisplayUnits 1, no labelPrecision; A2 guard: a plain measure keeps
  0 and 1 decimal; A3 guard: a percent keeps 0, no decimal.
- B (M1-S4): B1 Arabic 240 x 80 with two slicers: each slicer 24 wide or more, no two at one x; B2 the Reset left out,
  told (`narrow`); B3 English, same slot: the same; B4 guard: a 620 x 100 slot keeps Reset and today's widths; B5 a
  60 x 80 slot: one slicer kept, the second left out and told; B6 plan_layout (Arabic, the 240 x 80 slot): the note
  says the Reset was left out because the slot is too narrow.
- C (S4): C1 `shown("Total\tSales")` is "Total Sales"; C2 a report on a measure named with a tab writes no control
  character in a title or display name; C3 guard: U+200C kept; C4 guard: U+202E dropped.
- D (S1-S9): D1 an Arabic measure: "Last 12 months", one script (the date-table path); D2 guard: "Last 12 months:
  Total Sales" unchanged; D3 the month-label path (no date table): one script too.
- E (S6): E1 no `iconH` in pbip-sizing.js or pbip-page.js; E2 pbip-page.js says 320 x 284, never 320 x 240.

## Suites (measured before the work, then after)
`cd mcp && npm test -- report`, `npm test -- core` (golden), `node scripts/tests/run-all.mjs`, then
`npm test -- --keep-going` once, `node scripts/check-agent-memory.mjs`. Expected: every count as before, plus `sq1`.
