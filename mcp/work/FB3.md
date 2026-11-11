## Summary
- **Approval:** the owner, 11 Nov, D-1111-12: "Start 2 fable sessions and one opus ... the other would be something you
  need fable for to solve": FB1's stage 2 (relayed by the hub; the builder never merges).
- **Base:** `feat/0.3.3-fb3` from `origin/integration/0.3.3` at 69b27179. Push only this branch; never merge, no PR.
- **Scope:** assets/js/design-metrics.js (pageFill, fitSlots) and its .min.js, the fb1 suite and its pins, the fixtures
  the change moves (each by its own recorder), mcp/CHANGELOG.md, mcp/WORK.md, this note. Not stage 3, not stage 4.
- **Expected checks:** fb1 94 -> 108 checks, red on 69b27179 first (20 of 109 then: no `rows` / `balance`, the focus
  boxes, the 80 pins); plans with a hole 10 -> 2 of 80, worst hole 10.6% -> 4.5%, flattest chart 6.8 -> 6.8; sq13 S10
  stays 18 x 5; ts1 T5b stays 312; sp29 23 -> 24; `node scripts/check-modules.mjs --strict`; test-contracts; lint 0; CI green.
- **Resume:** built and recorded (2026-11-11T09:40Z); left: the last CI run and its line below.
- **Result:** the focus page's hole is closed by one rule (the text box under the rail): 8 of the 10 holes gone. The
  junior first row is measured and pinned (`balance`), its cause proven geometric; no rule inside the approved
  arrangement can change it, so those pages stay as they are and three ways out wait for the owner ("For the owner").

## Measured first, on the base 69b27179 (2026-11-11T08:16Z; the 80 plans of fb1 through plan_layout, slots dumped)
- **The hole on the focus page: reproduced.** 10 of 80 plans leave a hole: 8 are focus pages with a side rail (sample
  1920x1080 start and end 8.4% 312x477, 1280x720 7.9%, 960x720 10.6%; "two" and "notime" 6.4% 1100x104 and 8.1% 733x87),
  2 are one-dropdown rails on 1280x720 ("single" analysis 3.7% 208x141, ops 4.5% 208x173).
  The rule: design-metrics.js:474 ends the row beside the rail at the rail's bottom only where every slot keeps
  REFLOW_KEEP (0.45): 312 of 789 is 0.40, so nothing moves; :477 moves a chart under the rail only when it is alone
  in its row, and the focus row holds the chart and the text box.
- **The junior first row: reproduced, and the brief's cause is half right.** First row over the lower row, per plan:
  three slicers 312/459 = 0.68 (exec), 312/477 = 0.65 (analysis, ops); two slicers 228/543 = 0.42, 228/561 = 0.41
  (the brief's "0.52" is 228 of the row's designed 440, not the ratio of the two rows). The designed ratios are
  1.33 (exec), 0.78 (analysis), 1 (ops). The line that sets it is :476 (`h: B - s.y`): after a reflow the row beside
  the rail is exactly as high as the rail. REFLOW_KEEP only decides whether the reflow happens; it never sets the height.
- **Why no re-share inside this arrangement can change it (geometry, not a missing case).** Under the cards' row the
  body is an L: the page less the rail's box in its corner. Rectangles fill an L only if a row ends at the rail's
  bottom, or one slot stands under the rail in the rail's own column. Every built-in layout has at most two chart
  rows, so "the rows under share by flex" has one row to share with; the first row's height is the rail's (312 or
  228), and the rail is already at its dropdowns' measured maximum (76 each). So on a two-row page the only ways to a
  senior first row move something else: the cards (into the rail's column, or as high as the rail) or the rail (taller
  than its dropdowns, against the owner's round-12 rule #18). Each is a look the owner has not chosen: "For the owner".
- **What can be filled by a rule:** a slot that reads well in a narrow column under the rail. One kind does: the text
  box (already 219 wide on a 960x720 focus page). That closes the focus page's hole.

## Plan (before the code)
1. pageFill gains `rows` (the chart rows' heights, top to bottom) and `balance` (the first row's height over the
   highest lower row's, two decimals; null with one row). fb1 pins it per plan ("bal") and sums the pages whose first
   row is lower than the row under it.
2. One rule in fitSlots, by kind, never by page: a text box in the row beside the rail moves under the rail, into the
   rail's column down to its row's bottom, and the row's other slots share the row's whole width in their own
   proportions. Kept only where pageFill measures a smaller hole and the text box keeps half its width and height.
   Tried on both arrangements (cards beside the rail, cards over it); on a full tie the cards' row stays over the rail
   (D-1111-01). Where it does not measure better the page stays as it is.
3. Guards (L-1101-02, L-1102-07): on a grid of every layout x rail side x page x 1 to 3 dropdowns, straight on the
   engine: no slot overlaps another, every slot stays on the page, no slot's width or height drops under half of
   the designed one because of the new rule, edges compared with a 1 px tolerance; the text box under the rail shares
   the rail's left and right edges and its row's bottom.
4. Recorders: every MCP fixture FB1 lists and every website suite with a _RECORD recorder, before the first CI.

## What was built (written 2026-11-11T09:40Z)
- `pageFill` (assets/js/design-metrics.js) also answers `rows` (the heights of the rows of charts and tables, top to
  bottom; cards, the rail and a text box are no row) and `balance` (the first row over the highest row under it).
- `tuckText(slots, rail)` in the same file, called by fitSlots only: the text box of the row beside the rail moves
  under the rail, into the rail's column, a gap below it and down to its row's bottom; the row's other slots share the
  row's whole width. Refused (null) where the text box would keep less than half its width or height (TUCK_KEEP 0.5),
  where the rail's column is not free, or the row is not beside the rail. fitSlots tries it on both arrangements (cards
  beside the rail, cards over it) and keeps a tucked page only where pageFill measures a smaller hole than the settled
  page's. No per-page case, no copy; `column` (the slots below the rail take its column) is the old code, named so both
  paths call it.
- fb1: M10, M11 (the measure), T1 to T5 (every box of the focus page: start, end, Arabic, one dropdown unchanged, no
  cards), G0 to G5 (720 fitted pages straight on the engine: no overlap, on the page, nothing under REFLOW_KEEP of its
  designed width or height and nothing under half on a tucked page, the text box's edges against the rail's and its
  row's bottom within 1 px, inputs unchanged), S2 (the balance sums), every pin with its `bal`.
  Red on 69b27179 first: "FAIL  fb1  20 of 109 checks" (M10, M11, T0 to T3, T5, G0, S2 and the 80 pins; T0 was then
  dropped with the export it tested, so 108).

## Before -> after (fb1's 80 plans; every number from the suite's own run and the dumped slots)
| | base 69b27179 | FB3 |
|---|---|---|
| plans with a hole, of 80 | 10 | 2 |
| the worst hole, % of the body | 10.6 (focus 960x720, 208x301) | 4.5 (one dropdown, ops 1280x720, 208x173) |
| the flattest chart, w / h | 6.8 | 6.8 |
| the lowest chart | 163 | 163 |
| plans whose first row is lower than a row under it | 36 of 60 with two rows (26 of 30 with a side rail) | the same |
| the lowest first row over the row under it | 0.41 (228 over 561) | 0.41 |
| SQ13 S10 gaps | 18 x 5 | 18 x 5 (sq13 passes unchanged) |
| Details chart at 1920 x 1080 | 312 | 312 (ts1 T5b passes unchanged) |
The 8 plans that move, all focus pages with a side rail (hole before -> after | the chart):
| plan | hole | chart | text box |
|---|---|---|---|
| sample focus 1920x1080 start, and end | 8.4% 312x477 -> 0 | 1064x789 -> 1560x789 | 478x789 -> 294x459 |
| sample focus 1280x720 start | 7.9% 208x301 -> 0 | 709x526 -> 1040x526 | 319x526 -> 196x289 |
| sample focus 960x720 start | 10.6% 208x301 -> 0 | 489x526 -> 720x526 | 219x526 -> 196x289 |
| two, notime focus 1920x1080 start | 6.4% 1100x104 -> 0 | 1376x703 -> 1560x789 | 478x789 -> 294x543 |
| two, notime focus 1280x720 start | 8.1% 733x87 -> 0 | 917x451 -> 1040x526 | 319x526 -> 196x351 |
**Worse anywhere, said:** the chart's width / height on those pages goes 1.3 -> 2.0 (it is wider, not lower; the
page's flattest stays under the suite's 6.8), and the text box is narrower (294 for 478; 196 for 219 on 960x720): the
plan's exact check still passes on all of them (rules 23 ran, 0 failed, the text box's lines rule among them). The two
holes left are one-dropdown rails on 1280x720 (102 high beside a 231 or 263 row: 0.44 and 0.39, under REFLOW_KEEP, and
no text box to tuck); they stay as they are.
Runs: `npm test -- --keep-going` on the built tree: 242 of 243 passed, "FAIL  sp29  3 of 23 checks" (G1, L1, B1: the
parity guard, below), then sp29 alone "PASS  sp29  24 checks", fb1 "PASS  fb1  108 checks". Website, every suite
(`node scripts/tests/run-all.mjs`): 49 PASS, design-engine FAIL on one background (below); after the remake, alone:
"PASS  design-engine      600 checks".

## Changed on purpose
| recording | base -> new | why |
|---|---|---|
| mcp/fixtures/fb1-pins.json (FB1_RECORD) | every line gains ` \| bal <n>`; 8 lines move (the table above); sums holes 10 -> 2, worst 10.6 -> 4.5, new `junior` 36 and `lowest` 0.41 | the measure's new number; the rule |
| mcp/test-0.3.2-sp29.mjs + fixtures/sp29-design.json G1 (SP29_RECORD) | a fit with the text box under the rail and the cards not over it is one marker line, as FB1 did for the lift; L2 (new) pins 21 such fits; L1 124 -> 122 (two one-card focus fits: the tucked page without the lift has the smaller hole, 1183x114 beside the quarter-width card for 312x571 under the rail); 23 -> 24 checks; every other layout still the base's byte for byte, B1 live | the rule |
| scripts/tests/fixtures/design-engine/project-pages.json (`capture-design-fixtures.mjs --project`) | 1 of 60 cases, `layout-focus-3840x2160`, only its `bgs` | the downloaded project's focus page background follows fitSlots |
No other recording moved: fn1c, fn1f, fn1j, sp1 to sp44 (MCP) and the website's sp5, sp7, sp8, sp9, sp12, sp13, sp14, sp24,
sp25, sp31 to sp36 pass unchanged (none pins a focus page with a side rail).
Stamps: design-metrics.min.js has a new ?v= on tools/power-bi-theme-generator.html, its /ar/ copy
(ar/tools/power-bi-theme-generator.html) and tools/power-bi-theme-generator-lab.html (`npm run -s build:min`).

## CHANGELOG line
"A single-focus page with two or three filters in a side rail no longer leaves an empty area under the rail: the text
box moves under the rail and the chart takes the whole width beside them (1560 x 789 on a 1920 x 1080 page, was 1064
wide). The page-fill measure now also gives each page's row balance (the first row of charts over the row under it)."

## Decisions I made
1. **The balance is measured and pinned, not "fixed".** The proof above: with the cards across the page and the rail
   kept to its dropdowns, a two-row page's first row is the rail's height, whatever fitSlots shares. A rule that made
   the first row higher would open the hole under the rail again, or hide the same empty room inside taller cards or a
   taller rail, where pageFill does not see it. I did not ship a number that only looks better.
2. **The filler is by kind (a text box), not by page.** It is the one slot that reads in a column 294 wide; a chart or
   a table there would be cut. So exec, analysis and ops pages have nothing to tuck and do not move.
3. **A tucked page is not reflowed again**: its row keeps its full height (the chart 789, not the rail's 312).
4. **Of the two tucked pages the cards' row stays over the rail** (D-1111-01) unless the other measures better (it does
   only with one quarter-width card).
5. **TUCK_KEEP 0.5 is not exported**: the facade's names stay the base's, so sp29 K1 and sp6 B1 did not move.
6. The rule also closes a hole the 80 plans do not hold: one dropdown at the END of a focus page (the text box, next
   to the rail, never took the rail's column: 312 x 789 empty). Covered by the grid (G0: 132 of 720 pages tucked).
7. I ran the whole MCP registry once locally (the brief asks for every recorder before the first CI), not only the
   report area.

## For the owner
1. **The first row lower than the second on a rail page (0.68 with three filters, 0.42 with two) cannot be shared away;
   it needs one of three looks, your choice** (sizes for the executive page on 1920 x 1080, worked out from the
   layout's own numbers, not built):
   a. the KPI cards stacked under the rail in its column (four cards 294 x 163 with two filters, 294 x 142 with three);
      the charts take the page beside: rows 527 and 406 (1.3 to 1, as designed), and the focus page fills too. Six
      cards under three filters would be 88 high, under the cards' minimum, so that page would stay as today.
   b. the cards beside the rail and as high as it (228 or 312 for 144): rows 388 and 299, or 331 and 254; the empty
      room moves inside the cards.
   c. the rail as high as the first row (436), its dropdowns at the top and 124 or 208 of empty panel under Reset:
      against your round-12 rule (the rail only as high as its dropdowns).
   Or leave it: today's 312 over 459 has no hole and the Details chart is 312 high.
2. No new Arabic sentence, no new plan words.

## Risky changes
Every single-focus report page with a side rail (two or three filters; one filter at the end) is placed differently:
the text box "What it means" stands under the rail, 294 wide on 1920 x 1080 (196 on 1280 x 720 and 960 x 720), and the
chart is 1560 wide. Why: the empty area under the rail (up to 10.6% of the page). Exact checks pass; the look is unseen
in Desktop. Pages of the other three layouts, pages with the filters on top or none, and hand-placed pages do not move.

## For the laptop (made-up data only: the sample project)
1. plan_layout sample true, then create_report on it with layout focus, filters start, 1920 x 1080. Page 1: three
   cards 612 wide across the page at y 105; the rail 24,267 294 x 312 with three dropdowns and Reset; the text box
   24,597 294 x 459 under it; the line chart 336,267 1560 x 789. PASS if Desktop draws these boxes, the text box's
   sentence is whole (no cut line, no scrollbar) and nothing is empty under the rail.
2. The same with filters end: the rail 1602,267 and the text box 1602,597, the chart 24,267 1560 x 789. PASS as 1.
3. The same as 1 with lang ar (approve the Arabic names it asks for): the mirror, the rail and the text box at the right.
4. The same as 1 on 1280 x 720: the text box 196 wide, 289 high. PASS if its sentence is whole at that width.
5. Stage 1's items still wait: FB1.md "For the laptop" 1 to 4.

## Seen, not in scope
1. On a rail page the first row is the rail's height (0.41 to 0.78 of the row under it on 26 of 30 two-row rail plans):
   geometry, "For the owner" 1.
2. One dropdown on 1280 x 720 (analysis, ops) leaves a hole of 3.7% and 4.5%: the rail is 102 high and the row beside it
   would keep 0.44 or 0.39, just under REFLOW_KEEP 0.45. A lower REFLOW_KEEP would close them and flatten other pages;
   not tried here.
3. A slot's `topN` is worked out by computeSlots from the designed size and not again after fitSlots changes the size
   (before this job too: a bar chart 312 high after the reflow still carries the count of 440).
4. `filters: 'none'` on the sample still answers 3 written slicers (plan_layout's `slicers.written`); not looked into.
5. website `run-all.mjs` prints nothing until every suite ends (over half an hour here): a hung run and a slow one look alike.
6. The full local MCP run took over an hour on this container (not timed).

## Lessons for the reviewer
- "Re-share the rows by flex" was a guess in FB1's note and in the brief: every built-in layout has two chart rows at
  most, so under a rail there is one row to share with. Ask a stage's author for the geometry, not only the wish.
- The brief's "0.52 of the lower one (312 over 459)" mixed two numbers (228 of the designed 440; 312 / 459 = 0.68).
- This rule moved 3 recordings, not FB2's 22: almost nothing pins a focus page with a rail. The fb1 grid (720 pages
  straight on the engine, 0.3 s) is the cheap place to see a layout rule's whole effect before the slow suites.
- sp29's parity guard needs one marker and one pinned count per arrangement added on purpose; say so in a layout brief.
