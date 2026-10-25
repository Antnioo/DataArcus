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
- **Resume:** done (f026240 the fixes, the queue marked). Next: the reviewer reviews and merges; one laptop check below.

## Plan (each item at its cause, in the shared engine)
1. **0.2.9-writer-S14** (`pbip-page.js`, the quarter column labels): a measure the cards show whole (`wholeFormat`: a
   unit, a count) gets display units None (1) and no forced decimal, as its tooltip values (T10's `tipLook`) and its
   card; the rest keep automatic units with one decimal; a percent keeps its own format.
2. **M1-S4** (`pbip-page.js`, the slicer row): a strip whose slicers would be narrower than 24 px (the narrowest Desktop
   was seen to draw, as a sliver; a negative width is not drawn: DESKTOP-TESTS.md, round 23 facts) leaves out the
   Reset button first, then slicers from the last, until each slicer gets 24 at least; each part left out goes in
   `leftOut` with `narrow: true`, and `report-run.mjs` says it in its own note of the write's answer, as every visual left out is told today.
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
  60 x 40 slot: one slicer kept, the second left out and told; B6 create_report after the plan and the click (a 160 x
  80 slot): its notes and leftOutVisuals say the Reset was left out because the slot is too narrow.
- C (S4): C1 `shown("Total\tSales")` is "Total Sales"; C2 a report on a measure named with a tab writes no control
  character in a title or display name; C3 guard: U+200C kept; C4 guard: U+202E dropped.
- D (S1-S9): D1 an Arabic measure: "Last 12 months", one script (the date-table path); D2 guard: "Last 12 months:
  Total Sales" unchanged; D3 the month-label path (no date table): one script too.
- E (S6): E1 no `iconH` in pbip-sizing.js or pbip-page.js; E2 pbip-page.js says 320 x 284, never 320 x 240.

## Suites (measured before the work, then after)
`cd mcp && npm test -- report`, `npm test -- core` (golden), `node scripts/tests/run-all.mjs`, then
`npm test -- --keep-going` once, `node scripts/check-agent-memory.mjs`. Expected: every count as before, plus `sq1`.

## Where it stands (done)
Commits: bedf032 the plan, aa48d96 the suite red first (12 of 18 failed on the base, run there), f026240 the fixes.

| Item | Before | After | Test |
|---|---|---|---|
| 0.2.9-writer-S14 | a quarter chart of `#,0 "kg"`: labels in automatic units with 1 decimal ("8.0Kkg") | display units None, no added decimal: the measure's own format, as its card | A1-A3 |
| M1-S4 | Arabic 240 x 80, two slicers: -5 wide, both at one x, beside a 227 Reset; English 22 each | Reset left out (told), two slicers 106 wide; a 60 x 40 strip keeps one slicer | B1-B6 |
| 0.2.9-writer-S4 | "Total\tSales" in titles and display names | "Total Sales" (a run of Cc is one space) | C1-C4 |
| S1-S9 | "Last 12 months: إجمالي المبيعات" (two scripts) | "Last 12 months" (Latin names unchanged) | D1-D3 |
| 0.2.9-writer-S6 | `iconH` unused; comment "320 x 240" | removed; "320 x 284" | E1-E2 |

Suites, base (a worktree at 639c42b) -> this branch: `npm test -- report` 24 suites PASS -> 25 (+ sq1 18 checks),
every other count equal; `npm test -- core` 6 PASS -> 6 PASS, equal (mcp 1591, golden 12 tasks, mutation 165);
`scripts/tests/run-all.mjs` 20 PASS -> 20 PASS, equal; site config, CSP, the 38 Arabic copies PASS. The full run and
`check-agent-memory`: in the report (end of the night run).

## CHANGELOG line
- Reports: a quarter chart's labels keep a whole-number measure's own format (no more "8.0Kkg"); a slicer slot too narrow for its slicers leaves out the Reset button (and then slicers), told in the answer, instead of writing slicers Power BI cannot draw.

## Decisions I made
- The slicer floor is 24 px, the narrowest width Desktop was seen to draw (a sliver; DESKTOP-TESTS.md round 23's facts),
  not a new estimate; the Reset goes before any slicer (the slicers are the filters). Only strips (wider than high) are
  affected; a slot that holds its slicers writes the same bytes (B4, golden and every suite equal).
- English is fixed too: the same 240 x 80 strip gave 22-wide slivers (same cause).
- The note is in create_report's answer (reportNotes, leftOutVisuals), as every visual left out is told today; the
  touch in `report-run.mjs` is the left-out note only (SQ10 edits its line 508, not these).
- The quarter labels drop the forced decimal with display units None ("60,000.0 kg" would be as wrong).
- The "Last N months" helper falls back to plain English without the measure, as B-181's "Keep:" (S1).

## For the laptop (one batched run)
- A quarter column chart of a `#,0 "kg"` measure (English and Arabic): the labels show the whole number with "kg", as the card.
- A 240 x 80 hand-placed slicer slot (Arabic): two slicers drawn whole, no Reset.

## Seen, not in scope
1. plan_layout's answer does not list the visuals the writer leaves out (no field, or now too narrow): only
   create_report's answer does; the approval page's preview shows the page without them.
2. A stacked slicer slot (higher than wide) can overflow its height: a 60 x 80 slot with two slicers wrote them 76
   high at y 7 and 88, the second below the slot (the stacked branch has no height floor).
3. The slide-in filter panel's slicers have no width floor either (designed width, not hand-placed; not reached).
4. `npm test -- report`, `core` and the website's run-all together take over 30 minutes here.
