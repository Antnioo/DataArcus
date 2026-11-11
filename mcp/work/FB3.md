## Summary
- **Approval:** the owner, 11 Nov, D-1111-12: "Start 2 fable sessions and one opus ... the other would be something you
  need fable for to solve": FB1's stage 2 (relayed by the hub; the builder never merges).
- **Base:** `feat/0.3.3-fb3` from `origin/integration/0.3.3` at 69b27179. Push only this branch; never merge, no PR.
- **Scope:** assets/js/design-metrics.js (pageFill, fitSlots) and its .min.js, the fb1 suite and its pins, the fixtures
  the change moves (each by its own recorder), mcp/CHANGELOG.md, mcp/WORK.md, this note. Not stage 3, not stage 4.
- **Expected checks:** fb1 94 -> more checks, red on 69b27179 first (no `rows` / `balance` in pageFill, 8 focus
  pins); plans with a hole 10 -> 2 of 80, worst hole 10.6% -> 4.5%, flattest chart 6.8 -> 6.8; sq13 S10 stays 18 x 5;
  ts1 T5b stays 312; `node scripts/check-modules.mjs --strict`; test-contracts; lint 0; CI green.
- **Resume:** plan written (2026-11-11T08:16Z); next: the measure's row balance, then the rule, then the recorders.

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
