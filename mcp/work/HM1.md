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
- **State:** plan pushed; work next.
- **Resume:** the red tests (`test-0.3.2-hm1.mjs`), then items 1-4 in order.

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
