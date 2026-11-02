# MX4 (0.3.1): laptop part 10's general rules (the release's last fixes)

## Summary
- **Approval:** the reviewer's brief "MX4" (2 Nov), from laptop part 10 (rc.9, engine lab/rc031-part10 RESULTS.md,
  quoted in the brief): NO, one blocking regression; D-1101-03 (every difference in 0.3.1), D-1101-04 (general rules).
- **Base:** `fix/0.3.1-mx4` from `origin/integration/0.3.1` at a7d04ad5. Push only this branch; never merge.
- **Scope:** 1 (blocking) the heatmap's names table carries `$schema`; a guard runs Microsoft's validator on a WRITTEN
  twin and its copy. 2 the heatmap's grid keeps its English cells' width (the names take the hidden row headers' room).
  3 a reordered legend keeps each item's colour. 4 the agent cards: the layout that keeps the contact line whole. 5 a
  reversed table that fits: its slack at the left. 6 keepView: the names keep their English width, the columns English
  shows stay in view. 7 every heatmap kept B1 named in the plan with its reason. 8 flattened tables' text columns
  right-aligned (the write matches the plan).
- **Files:** `assets/js/report-mirror.js` (1, 2, 3, 7, 8; build:min, new ?v= stamps), `mcp/lib/twin-pages.mjs` (4,
  5, 6), `mcp/lib/twin-texts.mjs` (4), `mcp/lib/twin-plan.mjs` (7), a new suite `mx4` (area twin).
- **Expected checks** (written before the work): `mx4`, about 22, red on a7d04ad5 first except guards; fixtures made
  up in the real shapes (evidence/0.3.1-shapes; made-up names, no data):
  V1 the written twin (heatmap 9d8cf758, flat tables, cards, legend donut): validator codes on the twin are the
  English original's (no new code); V2 the same for the copy (into "same"); V3 every visual.json the twin and the copy
  write carries `$schema`. H1 Call Center's grid at least its English cells' width (box less the English row header:
  longest weekday + 12, the measured cell padding 5-6 a side); H2 the names in the hidden row headers' room, the pair
  in the box; H3 the grid's span the mirror of English's (the hour chart 52c8e333 lines up), ±1; H4 a matrix whose own
  row header width is too narrow for the names: B1, said. L1 the legend donut a28b4206: Unanswered keeps its English
  colour (theme colour 2, ColorId 3) after the reorder; L2 Answered keeps its own fill; L3 guard: a donut not reordered
  unchanged. C1 the agent card (bae91c53, c47dbc53): no "tabular" style; C2 its Arabic titles padded into a column as in
  part 9 (sentence layout). T1, T2 Fintech p3 73b90b71 and af02c108 (fit): the slack goes to the leftmost column, the
  names end at the room's edge; T3 the names keep 327 and 238. K1 RepeatIQ 19f5c974: the names keep 93; K2 English's
  second column (partly shown) in view, at its shown width; K3 only English's third column behind. B1 the plan names a
  heatmap kept B1 (too short; not weekdays) with its reason; B2 guard: Call Center's not among them. A1 ER p2 flat: Full
  Name, Department (Min of a text column) right-aligned; A2 guard: Min of a number column not.
- **Moves on purpose (said per check when seen):** mx3 H1/H2 (names width now the English row header's room, the
  matrix's right padding 0), K3 (names 93, not widened); mp1f R1/R2 (no tabular; padding back); mp1e R1 maybe.
- **Got / State / Resume:** below, filled after the work.

## The causes and the plan
1. `rowNamesBeside` builds the names table from scratch with no `$schema`; every other visual is a clone. Fix: the
   matrix's own `$schema`. Guard: the twin written through the tool, `runReportValidation` (the CLI mcp/package.json
   pins) on the English report and the twin, codes compared; the copy too; every written visual.json has `$schema`.
   Visuals the twin creates rather than clones (searched): the heatmap's names table (report-mirror.js), the copy's
   language buttons (twin-copy.mjs, already with `VC_SCHEMA`). Both covered by V1-V3.
2. The names were max(longest weekday) + 24 (95 at 10pt) and the matrix narrowed by that, while English's row header
   is about the longest name + 12 (measured: a cell's padding 5 to 6 a side, DESKTOP-TESTS "Item 3, the table"). Rule:
   the names take R - 1 (R = the English row header: its own width when set, else longest weekday + 12; the matrix's
   hidden header keeps 1); the matrix's right padding goes to 0 and the names table's left padding 0 (its right is the
   matrix's English right padding), so the grid keeps exactly its English width. Names wider than R - 1 (a set row
   header width too small): B1, said (heatmapBeside's why), never a scroll.
3. The legend donut's Unanswered had no fill (it took the theme's 2nd colour by position); the reorder gave it the 1st.
   Rule: when the measures are reversed, each without a fill of its own gets its English position's theme colour
   written (ThemeDataColor ColorId 2 + index: 0 and 1 are the background and foreground in Power BI's picker).
4. Capabilities 0.1.3 (cardVisual.referenceLabelLayout): style sentence|tabular, arrangement rows|columns,
   position, horizontalAlignment, valueArea, paddings: nothing puts the title after the value, so "tabular" cannot put
   the label at the right. The contact line was whole in part 9 (sentence) and cut in part 10 (tabular). Choice: back to
   the sentence layout (part 9's, with the Arabic titles padded "space + RLM" to one measured width, MP1e), which keeps
   the line whole; the label side is said in the plan as Power BI's (no setting).
5, 6. keepView now: all widths known, reversed. A table that fits: the slack (room less 1 less the columns) goes to the
   leftmost column shown, never to the right of the names. A wider one: the columns English shows whole stay in view,
   the names at their English width ending at the room's edge; English's partly shown column stays in view at the width
   English showed of it (the room less the whole ones; under 10, it goes behind and its room to the leftmost column).
7. The plan's "matrices" line gives a heatmap's reason (heatmapBeside's why) for each heatmap kept B1.
8. The text column alignment ran only on Column projections; a flat matrix's Min/Max of a text column (the model's text
   columns, opts.textColumns) is right-aligned too.
