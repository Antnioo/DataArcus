# MX5 (0.3.1): laptop part 11's two general rules (and one estimate)

## Summary
- **Approval:** the reviewer's brief "MX5" (2 Nov), from laptop part 11 (rc.10, quoted in the brief): NO but close;
  D-1016-01, D-1027-12, D-1101-04 (general rules), D-1102-02 (CI on the branch is the gate).
- **Base:** `fix/0.3.1-mx5` from `origin/integration/0.3.1` at e75d4327 (MX4 in). Push only this branch; never merge.
- **Scope:** 1 a reversed table's fill leaves room for Desktop's vertical scrollbar (12 page px at 1080 high, laptop
  part 11), always; never past English's own total when English's fitted. 2 the heatmap's names table takes English's
  row-header strip as the file sets it; the grid keeps English's grid width exactly; strip not set in the file: B1,
  said. 3 the heatmap's "7 rows may not all fit" estimate recalibrated from Call Center p1 and ER p1.
  Files: `mcp/lib/twin-pages.mjs` (keepView, 1), `assets/js/report-mirror.js` (heatmapBeside, 2-3), new suite `mx5`.
- **Expected checks:** `mx5` about 16, red on e75d4327 first except the guards; moved on purpose (said per check):
  mx4 H1-H4, B1 (the fixtures: Call Center's heatmap gets its strip set; the "too narrow" one now "not set"), mx4 K1,
  K2 (the names end the room less the scrollbar). mx1, mx2, mx3, rc24, never-shrink: unchanged expected.
- **Got:** (after the work)
- **State:** plan pushed; work next.
- **Resume:** write `test-0.3.1-mx5.mjs`, see it red on e75d4327, then the code.

## Plan (written before the work)
1. keepView: the room is the box less 20 (part 4) less the vertical scrollbar, 12 at 1080 high (part 11: "about 12
   page px", Fintech p3 at 1920 x 1080), scaled like the 20. A table that fits fills its leftmost column up to the room
   less 1; when English's own total already reaches that, nothing grows and nothing shrinks. Hidden columns (under 10)
   count in what is used (the watchlist's 4). A wider table: the names end at the same room.
   Expected: Fintech p3 tasks 1097.7 box: 1064.7 (was 1076.7); milestones (guard: names last, slack at the left)
   1064.7; Fintech p1 watchlist 490: 457 of all columns; AdventureWorks p1 top 10: 526.1, English's (was 533.1);
   AdventureWorks p4 customers 448.1 at 720 high: 425.8 (was 433.8); RepeatIQ retention: names end at 170.7 (was 178.7).
2. heatmapBeside: R is the row field's own columnWidth in English (the strip); the names table is R - 1 wide (the
   matrix keeps 1 of hidden row headers), the matrix the box less R - 1, so its grid is English's: box less padding
   less R. No width set: B1, "its row header's width is not set in English". The longest-weekday estimate (82) goes.
   Expected: Call Center 9d8cf758 shape, strip set 36 ("Mon".."Sun"): names 35, matrix 282.5, grid 275.5 = English's
   317.5 - 6 - 36; the hour chart 52c8e333 lines up within 3. The real shape (nothing set): B1, said.
3. The row estimate: a row is 1.887 x pt + 2 (DESKTOP-TESTS "Item 3, the table": 15.1 of line at 8pt + 2 of padding,
   scaled with the text size), the header one row, a total one, a title 1.6 rows, the box's margins 6 (ER p1: 8 rows of
   11pt are 182 and showed whole in 188, so the margins are at most 6). ER p1's "about 202" was 8 rows of 24 + 10 (11pt
   untitled) or 8 of 20 + a title of 32 + 10 (9pt titled); both now 188, inside 188. Call Center p1: 173 in 188.
   Guards: 12pt in 188 (203) and 7 rows in 120 still "may not all fit".

Checks in `mx5`: S1-S6 (tables), H1-H5 (heatmap), R1-R5 (rows).
