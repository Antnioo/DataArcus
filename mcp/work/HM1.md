# HM1 (0.3.2): the heatmap names table: a unique name, said in the plan, its fit and its box (B-296, B-297, B-299, B-300)

## Summary
- **Approval:** the owner's brief "HM1" (3 Nov; D-1103-09, one of the 8 builders of the 0.3.2 checklist), D-1016-01 (one
  place per fact), D-1102-02 (CI on the branch is the gate). Earlier: MX3, MX4, MX5, MX7, MX8; Codex's second fuzz pass
  (`evidence/0.3.1-fuzz` `twin-fuzz-2/`, read only: N1-1, N1-25, M1-1, F1-1).
- **Base:** `fix/0.3.2-hm1` from `origin/integration/0.3.2` at e2cf676 (HR2 in). Push only this branch; never merge.
- **Scope:** the one visual the twin builds (the heatmap's names table): 1 B-296 a unique name on its page (`Names`,
  else `Names2`, `Names3`...; folders compared without case, as Windows does), the writer refuses (hard error) to
  write over any file of a visual it did not build, the report's own visuals byte-identical; 2 B-297 the plan names
  each added visual (`mirrors[heatmapNames].added`, page/visual) and the approval page lists them; 3 B-299 the fit
  check counts `grid.rowPadding`; 4 B-300 the box exactly the matrix's height, its column 4 px narrower than its box.
  Files: `assets/js/report-mirror.js` (heatmapBeside, heatmapNames, stamp), `mcp/lib/twin-plan.mjs` (the unique name
  and the plan's line), `mcp/lib/twin-write.mjs` and `mcp/lib/twin-copy.mjs` (the refusal; the copy's name),
  `mcp/lib/approval-window.mjs` (one row), `tools/create_arabic_twin.mjs` (the plan data), new suite `hm1` (twin),
  fixtures `mcp/fixtures/hm1/` (N1-25, M1-1, F1-1 from their spec.json), `mcp/tests.json`, `mcp/CHANGELOG.md`.
  Not touched: `mcp/lib/twin-pages.mjs` (HM2's; the rename runs after its build, in twin-plan).
- **Expected checks:** `hm1` about 16 checks, red on e2cf676 first: U1-U5 (N1-25/M1-1: the shape kept, its bytes as
  without the names table, the table `v0Names2`, its own folder, the refusal, the EN-AR copy), P1-P2 (plan, approval
  page), F1-F2 (F1-1 not beside, why said), B1-B3 (box height, column + 4 <= box, rows fit) = about 12 red; guards W,
  V1 (Microsoft's validator: no new code), F3 (a padded heatmap that fits keeps its names) green on the base.
  Moving on purpose (B-300): mx8 N4, N6 (one row more -> exactly the matrix's), N5 (column = box -> box less 4), N7
  (clamped to the page -> the matrix's own box, inside it); mx3 H1 and mx7 H4 only if they demand more than the
  matrix's height. mx4, mx5, twin-fuzz (185), fx1 (22) unchanged. Base: mx3 25, mx4 24, mx5 17, mx7 14, mx8 18,
  twin-fuzz 185, fx1 22 (all PASS on e2cf676).
- **Plan answer size (L-1102-06):** measured on the twin fixtures before and after (below); fx1 run 3 times after.
- **Got:** `hm1` 16 checks, red on e2cf676 first: 13 of 16 (U1-U4, U6, P1, P2, F1-F3, B1-B3; F3 red there too: the
  box grew to 244.88); W, V1, U5 green there. Moved on purpose: mx8 N4-N7, mx7 H1 (B-300), mx7 H5-H6 (B-299; the
  rowPadding copy check moved to hm1 F3). mx3 25, mx4 24, mx5 17, twin-fuzz 185, en-ar-copy 27 unchanged; fx1 3 x 22.
  Plan answer +23 to +60 characters, F1-1 +335 (its heatmap's why); all under 11,000 of 40,000.
- **State:** code in at 12464b9; areas and CI below.
- **Resume:** the reviewer's merge; the laptop (below).

## Plan, per item
1. B-296 (FIRST). twin-plan, right after buildTwin: each page's added visual gets the first free name of
   `<matrix>Names`, `<matrix>Names2`... against every visual name and every visual folder of that page (lower-cased) and
   the names already added there. twinTree: an added visual whose folder holds any file of the original, or a path
   already set, throws "Nothing was written: ..." (never silent). The copy (into same): the Arabic matrix's new name +
   the same suffix, free against the Arabic page's names, the same refusal. The report's visuals: untouched by this.
2. B-297. `mirrors` entry `heatmapNames` gains `added: ["<page>/<added name>"]`; the twin's approval data `added`
   (page, name, beside) and one approval row "Visuals the twin adds (n)".
3. B-299. heatmapBeside's row = 1.887 x pt + 2 + 2 x rowPadding (was without the padding); the growth by one padded
   row is gone with item 4. F1-1 (rowPadding 6, 10pt, box 190): need 269 -> B1, said.
4. B-300. The box: the matrix's (same y, same height: 188.33 for Call Center, was 209.21). Its column: the box less
   TABLE_EDGES = 4 px (2 a side: the table's own 1 px edge line each side, plus 1 each side for Desktop's rounding of
   43.06 to device pixels; part 14 drew a horizontal scrollbar for a 0.04 px gap), so 39.06 in a 43.06 box, still
   wider than English's strip 38.06 that held the names whole. Check on the written numbers: column + 4 <= box width
   (0.01), header + 7 rows (+ total) by the row estimate <= box height (0.5, the fit check's own tolerance).

## Before -> after (filled as measured)
- Plan answer size (characters, the plan without labels; cap 40,000): N1-25 8,133 -> 8,158; F1-1 7,986 -> 8,321 (the
  heatmap kept, its why in cannot); Call Center 8,508 -> 8,531; padded fit 7,990 -> 8,013; EN-AR copy 10,512 -> 10,572.
- Call Center p1's shape (box 317.5 x 188.33, strip 38.06, padding 6, 10pt): the names table 43.06 x 209.21, column
  43.06 -> 43.06 x 188.33 (the matrix's), column 39.06. ER p1 (11pt): 188.33 + 22.76 -> 188.33.
- F1-1 (rowPadding 6, 10pt, box 190): a names table 222.88 high for rows needing 269 -> no names table; the plan says
  "its 7 rows may not all fit its box (about 269 high, its box 190)".
- N1-25 / M1-1 (a shape already named v0Names): the shape replaced by the table (x 1017, 43 x 210.88) -> the shape kept at
  its mirror (1230, 20, 30 x 30), byte-identical to its twin without the names table; the table `v0Names2`.

## Tests changed on purpose
- mx8 N4, N6 (one row more than the matrix -> exactly the matrix's height), N5 (column = box -> box less 4), N7 (room
  below clamped to the page -> the matrix's own box, inside the page): B-300.
- mx7 H1 (column = box -> box less 4): B-300. mx7 H5 (rowPadding 3 at 10pt in 188.33 written on the names table -> no
  names table: 221 needed, said why) and H6 (one names table on that page -> none): B-299. The copy of rowPadding onto
  the names table is checked in hm1 F3 (rowPadding 2 in a box 220).

## CHANGELOG line
- **The day names beside a heatmap never replace a visual of the report:** they take a free name on their page, the
  plan and the approval page name them, a heatmap whose padded rows may not all fit keeps its own row names, and their
  box is the heatmap's own height with no scrollbar.

## Decisions I made
- The column narrower, not the box wider: a wider box takes 4 more from the matrix's padding beside its grid, and Call
  Center's is exactly the 6 the cell padding takes (MX7), so it would fall to B1. TABLE_EDGES = 4 (1 px edge line a
  side, 1 a side for Desktop's rounding to device px; part 14's gap was 0.04): column 39.06, still above English's
  strip 38.06 that held the names whole. Word wrap stays off, so the worst case is the last px of a name, never a wrap.
- The unique name is given in twin-plan right after buildTwin (twin-pages is HM2's): `Names`, `Names2`...; compared
  lower-cased against every visual name and folder of the page (Windows and macOS folders ignore case).
- The copy (into same): the Arabic matrix's new name + the same suffix (`_2`... if taken there); the plan's `added`
  then names the Arabic page's visual, as written.
- The refusal text: "Nothing was written: the visual the twin adds ... never writes over a visual it did not build"
  (twinTree and the copy), as the other write refusals start.
- heatmapNames no longer reads `o.bottom` (the box is the matrix's, already inside its page or group); twin-pages still
  passes it (not mine to edit).
- The approval row in both languages ("Visuals the twin adds", Arabic heading in the page's list).

## For the owner
- B-300's exact height brings back the case part 13 saw (the table at exactly the matrix's height drew a few px taller
  than its box). Since then MX8 took the matrix's header outline (none) for the table's header, which may be those px.
  The estimate's room: Call Center 10pt 173 in 188.33 (15 spare), ER 11pt 188.1 in 188.33 (0.2 spare). My
  recommendation: keep the exact height as asked and let part 15 decide; if ER shows a vertical scrollbar, ER-like
  heatmaps (11pt in 188) go to B1 by raising ROW_MARGINS, one number. Went on with the recommendation.

## Risky changes
- `assets/js/report-mirror.js` is shared with the website (the theme generator's builder list): heatmapBeside now
  refuses padded heatmaps that fitted before (rowPadding counted); heatmapNames' box and column changed. New ?v= stamps.

## For the laptop
- Call Center p1, the names table `9d8cf758Names` beside 9d8cf758 (width-set copy): box 43.06 x 188.33 at the matrix's
  top, column 39.06: no horizontal scrollbar thumb under «Sun», no vertical scrollbar, rows level with the grid's,
  «Mon».. whole (not cut at the right).
- ER p1, `f2c68e52Names` beside f2c68e52 (11pt): the same, the tightest (0.2 px of estimated room).
- A report with a visual already named `<heatmap>Names`: it stays; the table is `<heatmap>Names2`.

## Seen, not in scope
- twin-plan's `mirrors heatmapNames where` lists every heatmap heatmapBeside accepts, also one rowNamesBeside then
  refuses (a box no wider than twice the names); `added` is exact. Left as it was.
- twin-pages (HM2's) still computes `bottom` for heatmapNames (unused now) and keys landsOn's boxes by name before the
  rename (a collided name maps the table onto the original's box in that one check).
- twin-fuzz-2's A1-1 (not this brief's).

## Lessons for the reviewer
- A name the twin makes up is a write target: give it on the plan's side (free on its page, without case) and make the
  writer refuse a taken path, so a miss is a hard error, never a silent replace.
- Check a fit on the written numbers (column + edges <= box; rows by the same estimate <= box), not on an intention.
