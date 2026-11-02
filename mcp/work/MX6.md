# MX6 (0.3.1): three geometry bugs the fuzz lab found, and its fastest checks as a suite

## Summary
- **Approval:** the reviewer's brief "MX6" (2 Nov), from Codex's twin-fuzz lab (evidence/0.3.1-fuzz, replayed on
  0f47f4cb); D-1027-12 (the twin identical), D-1101-04 (general rules), D-1102-02 (CI on the branch is the gate).
- **Base:** `fix/0.3.1-mx6` from `origin/integration/0.3.1` at 0f47f4cb (MX5 in). Push only this branch; never merge.
- **Scope:** 1 (B1-1) the button fitting moves or narrows visuals only where every box it changes stays inside its page
  or group, else that step is put back (the button fitted as before without it). 2 (B1-3) the bar-over-table rule's
  kept offset is clamped to the page or group; a bar wider than it is said. 3 (M1-1) every visual the button fitting
  moves or narrows is named by visual name: neighbours in `movedByRule`, the button's own underline in its fitted entry
  (`withLine`). 4 a new suite `twin-fuzz` (area twin): the six reduced cases (`mcp/fixtures/twin-fuzz/`, the lab's
  spec.json, made up), 25 fixed generated seeds (20261102..20261126) and one made-up underline case through the real
  plan / approve / write flow: V1, V2, B1, M1 and N1-N5. B2, B3, D1, P1 out (the brief: not bugs).
  Files: `mcp/lib/twin-pages.mjs` (fitButtons, aroundTables, the caller), `mcp/test-0.3.1-twin-fuzz.mjs`,
  `mcp/fixtures/twin-fuzz/*.json`, `mcp/tests.json`, `mcp/CHANGELOG.md`.
- **Expected checks:** (written first, pushed in c3acc6c) about 159, red on 0f47f4cb in B1-1, B1-3, M1-1 and the seeds
  09, 13, 17, 20, 22, 23, 24, 26 (M1), 17 (B1). Others unchanged.
- **Got:** `twin-fuzz` 165 checks (32 reports, about 2.5 s), red on 0f47f4cb first: 18 of 165 (B1-1 B1, M1; B1-3 B1;
  M1-1 M1; M1 on seeds 09, 13, 17, 20, 22, 23, 24, 26; B1 on 17; line M1; N1, N2, N4, N5). N3 (B1-3 named) was
  green there: the bar was already in movedByRule. Every seed's M1 came from the button fitting: no other source.
  The lab's own replays after: B1-1, B1-3, M1-1 pass B1 and M1 (left: D1, P1 everywhere, B2 on B2-1, B3 on B3-1, as
  the brief says). Unchanged: mx1..mx5, fx1 (5 of 5, 22), terminology-sheet 48 (see Decisions). Areas: twin 29,
  arabic 15, checker 7, report 42 (glass-tables rerun after unshallowing the clone: its N0 reads cba24a5), core 8 suites passed, all on 0d29d51c; see
  State; lint 0.
- **State: DONE.** CI green: https://github.com/Antnioo/DataArcus/actions/runs/41426120419 on 369db4e9 (Linux,
  Windows, macOS). After 369db4e9 only this note changed.
- **Resume:** the reviewer's merge.

## Before -> after, per item
1. B1-1: a button 326 wide beside a slicer (487) and a column chart (608) on a 1280 page; the slicer gave the button 59
   and every visual on that side moved 59, the chart to x -59 -> the step that would put a box outside its page or
   group is put back (the button then takes the next way: its text size, its icon off, or said in buttonsCut). The
   chart stays at its exact mirror, x 0. The same guard covers the first step (the free room beside the button).
2. B1-3: a bar chart (512) over a table (455) whose left edge is 57 left of the table's, the table mirrored to x 0 ->
   the bar at x 0 (clamped), movedByRule says "moved 57 to stay inside its page"; wider than its page or group: said.
3. M1-1: a group 28 off its mirror (fitted.buttons said "moved: 1") -> movedByRule names "p0/v15" ("moved with a button
   beside it"); a slicer that gave width: "gave width to a button beside it"; an underline: the button's `withLine`.

## Tests changed on purpose
- none. (terminology-sheet's TS-2 was red with every neighbour in movedByRule: its plan sits within about 60 characters
  of the answer's cap and one more entry paged its texts; naming the underline inside its button's entry keeps it whole.)

## CHANGELOG line
- **Arabic twin checks on thousands of made-up reports:** a button widened for its Arabic text no longer pushes a chart
  beside it off the page (it takes width from a slicer only where everything it moves stays on the page), a bar chart
  kept over a table stays on the page, and the plan names every visual moved beside a widened button.

## Decisions I made
- "Only where the room exists": checked after each step (the free room, then each side's slicers) on every box the step
  changed; a box already outside in English is not blamed (only changed boxes are checked).
- The clamp keeps the bar on the page rather than mirroring it plainly: it stays on its table (MP1d's reason).
- The underline goes in the button's entry (`withLine`), not movedByRule: the same naming, fewer characters (TS-2 above).
  Rule texts short for the same reason. The `moved` count on a button stays (the names are in movedByRule).
- The suite uses the lab's own Arabic choice (sha-256 of the text, mod 3) so its seeds reproduce the lab's results.

## For the owner
none

## Risky changes
- File writing: only when a button fitting would push a box off its page or group (now put back) or a bar over a table
  would leave its page (now clamped). What an answer returns: more movedByRule entries (visual names, no data values)
  and `withLine` on a fitted button.

## For the laptop
- The cases are made up. The owner's dashboards (evidence/0.3.1-shapes, 18 pages): no part 8 twin has a box outside
  its page, and the one bar over a table (Call Center overview efd0d10030ce18a4e9ac) is kept inside (x 121.4): no
  visual's box changes, so no Desktop item. The plans name more visuals beside a widened button (RepeatIQ, Fintech,
  AdventureWorks Reset and nav buttons), in words only.

## Seen, not in scope
- B2-1, B3-1, D1, P1: the lab's strict properties, as the brief says (left in its evidence).
- movedByRule is capped at 60 entries per plan (twin-plan.mjs); a page with many fitted buttons could reach it.

## Lessons for the reviewer
- The twin plan of a report with about 80 texts sits within tens of characters of its answer cap (TS-2): any new plan
  field can page its texts; measure that suite before adding words to the plan.
