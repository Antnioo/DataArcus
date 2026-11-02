# MX5 (0.3.1): laptop part 11's two general rules (and one estimate)

## Summary
- **Approval:** the reviewer's brief "MX5" (2 Nov), from laptop part 11 (rc.10, quoted in the brief): NO but close;
  D-1016-01, D-1027-12, D-1101-04 (general rules), D-1102-02 (CI on the branch is the gate).
- **Base:** `fix/0.3.1-mx5` from `origin/integration/0.3.1` at e75d4327 (MX4 in). Push only this branch; never merge.
- **Scope:** 1 a reversed table's fill leaves room for Desktop's vertical scrollbar (12 at 1080 high, laptop part 11),
  always; never past English's own total when English's fitted. 2 the heatmap's names table takes English's row-header
  strip as the file sets it; the grid keeps English's grid width exactly; strip not set: B1, said. 3 the heatmap's
  "7 rows may not all fit" estimate recalibrated from Call Center p1 and ER p1. Files: `mcp/lib/twin-pages.mjs`
  (keepView, 1), `assets/js/report-mirror.js` (heatmapBeside, 2-3; its stamp 20261102mx5), new suite `mx5` (twin).
- **Expected checks:** (written first, pushed in 179c605) `mx5` about 16, red on e75d4327 first except the guards.
- **Got:** `mx5` 17 checks, red on e75d4327 first: 15 of 17 failed there (green there: S0 the twin written, R5 the
  short guard; the guards R3, R4, S2, H5 were red there too: R3, H5 by the old name-width rule, R4 by the old number
  218, S2 by the old room). Moved on purpose, per check below: mx1 P2; mx3 H1-H7, K1, K3; mx4 H1-H4, B1, B2, T1, T2,
  K1-K3 (my plan named only mx4's: mx1 and mx3 read the same two rules). mx2 26, rc24 28: unchanged. mx4 V1-V3 (the
  validator on written twins): green. Areas, lint, fx1 x5, CI: "State" below.
- **State:** work committed (fd3aa86); the gates next.
- **Resume:** the area runs, fx1 x5, then CI on the branch.

## Before -> after, per item
1. A table that fits filled to the box less 20 less 1 (Fintech p3 tasks 1076.7 in 1097.7; 10 rows: Desktop's vertical
   bar took 12 and a horizontal bar hid the names' end) -> the room is the box less 20 less the scrollbar's 12, both
   at 1080 high (`BOX_ROOM`, `SCROLLBAR_W`; source: laptop part 11, "about 12 page px" on Fintech p3 at 1920 x 1080),
   always (the row count is data); the hidden columns (under 10) count in it; what English's own columns already take
   is never grown past nor shrunk. Tasks 1064.67, milestones 1064.67 (names last, slack at the left), Fintech p1
   watchlist 457 of all its columns (was 473: its 4 not counted), AdventureWorks p1 top 10 526.09 = English (was
   533.17), p4 customers 425.8 (was 433.8), RepeatIQ retention's names end at 170.67 (was 178.67) (S1-S6).
2. Names 82 wide from the longest weekday name a model could have -> the names take English's row-header strip as the
   file sets it (the row field's `columnWidth`) less the matrix's hidden 1; the grid = the box less its padding less
   the strip, English's exactly. Call Center shape with "Mon".."Sun" and its strip set 36: names 35, matrix 282.5,
   grid 275.5 = 317.5 - 6 - 36, the hour chart within 3 (H1-H3). The real Call Center file sets no width: B1, the plan
   says "its row header's width is not set in English (Desktop sizes it from the data, never read)" (H4). The old
   "set too narrow" refusal goes: the names show the same values (data, never translated) in the strip English gave.
3. A row was ceil(pt x 2) + 2, the margins 10 (ER p1: "about 202" in 188, whole in Desktop) -> a row is 1.887 x pt + 2
   (DESKTOP-TESTS "Item 3, the table": a line of 15.1 at 8pt, scaled with the size; + 2 of padding), the header one
   row, a total one, a title 1.6 rows (kept), the box's margins 6 (ER p1: 8 rows at 11pt are 182 and showed whole in
   188). ER p1 as 11pt untitled: 188.1 (was 202); as 9pt titled: 188.3 (was 202); Call Center p1: 173 (was 186), all
   inside 188 + 0.5 (R1-R3). Guards: 12pt in 188: 203 (was 218), 7 rows in 120: too short (R4, R5).

## Tests changed on purpose
- mx1 P2, mx3 H1-H7, mx4 H1-H3, B2: their written heatmap gets its row-header strip set (82, the longest weekday + 12:
  what the old estimate gave), the case the new rule writes names for; the expected numbers are unchanged.
- mx4 H4, B1: the "row header set too narrow (40)" heatmap is now one whose width is not set (that refusal is gone);
  still B1, its reason matched by /row header/ as before.
- mx3 K1, K3 and mx4 T1, T2, K1-K3: their `room` is the box less (20 + 12) at 1080 high, not 20 (item 1).

## CHANGELOG line
- **A second test run in Power BI Desktop:** a table in the Arabic twin leaves room for Power BI's vertical scrollbar,
  so its first column stays whole at the right edge when there are more rows than fit; a heatmap by weekday shows its
  day names beside a grid exactly as wide as the English one when the English report sets the day column's width
  (otherwise it is kept as it is, and the plan says why); a heatmap whose seven rows fit is no longer called too short.

## Decisions I made
- The scrollbar's 12 is scaled with the page like the 20 (both "page px" at 1080 high, the page part 11 measured on);
  at 720 high both are two thirds. The "less 1" stays.
- The wider case leaves the scrollbar too: its names end the same room (RepeatIQ 178.67 -> 170.67), else a vertical
  bar would cut the names' end there the same way.
- Hidden columns (under 10) now count in the room: Fintech p1's watchlist overflowed by 3 even without a scrollbar.
- "Never past English's total if English's fitted": when English's columns already reach the new room (AdventureWorks
  top 10, 526.09 over 525.17), nothing grows and nothing shrinks; English's own total is the twin's.
- Item 2: only the row field's own `columnWidth` counts as the strip (the brief's "from the column widths when set");
  the hours' widths are per data value, not in the file. Not set: B1, as the brief said.
- Item 3: ER p1's file is not in the evidence, so its text size is not known: "about 202" is either 11pt untitled
  (8 x 24 + 10) or 9pt with a title (8 x 20 + 32 + 10); both are tested (R1, R2) and both now fit.

## For the owner
- Call Center p1's heatmap 9d8cf758: its English file sets no width for the weekday column (Desktop sizes it from the
  data), so the twin now keeps it as English (names at the left, B1, said in the plan). To get the names beside the
  grid: drag the weekday column's edge once in English (Desktop writes its width) and make the twin again.

## Risky changes
- File writing: reversed tables laid out by keepView are 12 x (page height / 1080) narrower (and the hidden columns'
  widths less) than in rc.10; a heatmap by weekday with no row-header width set is no longer given names beside it.
- What an answer returns: the plan's "matrices" line has one new reason (no data values).

## For the laptop (part 12)
- Fintech p3 tasks 73b90b71: the names «...المهمة» whole at the box's right edge with the vertical scrollbar showing,
  no horizontal scrollbar; milestones af02c108: the same, no bar, the blank (12) at the right of the names at most.
- Fintech p1 watchlist 66641c48: «P054 - SEPA Plus...» as English shows it, no horizontal scrollbar.
- AdventureWorks p1 top 10 b3b78a11: 10 rows, «Water Bottle - 30 oz.» whole, columns 526.1 as English.
- AdventureWorks p4 customers 65eb6ebd: the last row whole, the names at the right, no horizontal scrollbar.
- Call Center p1 9d8cf758: as is, B1 (said). On a copy with the weekday column's width dragged in English: hours
  0-23 with no scroll, no bar between grid and names, the hour chart 52c8e333 under its hours.
- ER p1 f2c68e52: now names beside (if its weekday width is set) or B1 "width not set"; no "may not all fit".

## Seen, not in scope
- The twin's reversed tables carry a "Row label: <field>" column for the names; a hidden English first column (the
  watchlist's Department, 4) ends up as a 4-wide sliver at the right end after the names (MX2's layout).
- MX4's Seen (fitHeaders counts stale columnWidth entries in its spare room) is still there.

## Lessons for the reviewer
- A rule in `report-mirror.js` is read by three older suites' fixtures (mx1, mx3, mx4): grep the function's name in
  `mcp/test-*.mjs` before writing the plan's "unchanged" list.
