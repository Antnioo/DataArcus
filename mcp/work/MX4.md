# MX4 (0.3.1): laptop part 10's general rules (the release's last fixes)

## Summary
- **Approval:** the reviewer's brief "MX4" (2 Nov), from laptop part 10 (rc.9, engine lab/rc031-part10 RESULTS.md,
  quoted in the brief): NO, one blocking regression; D-1101-03 (every difference in 0.3.1), D-1101-04 (general rules).
- **Base:** `fix/0.3.1-mx4` from `origin/integration/0.3.1` at a7d04ad5. Push only this branch; never merge.
- **Scope:** 1 (blocking) the heatmap's names table carries `$schema`; Microsoft's validator runs on a WRITTEN twin
  and its copy. 2 the heatmap's grid keeps its English cells' width. 3 a reordered legend keeps each item's colour. 4
  the agent card: the layout that keeps the contact line whole. 5 a reversed table that fits: its slack at the left. 6
  the names keep their English width, the columns English shows stay in view. 7 every heatmap kept B1 named with its
  reason. 8 flattened tables' text columns right-aligned. Files: `assets/js/report-mirror.js` (1-3, 7, 8),
  `mcp/lib/twin-pages.mjs` (4-6), `twin-texts.mjs` (4), `twin-plan.mjs` (5, 7), new suite `mx4` (area twin).
- **Expected checks:** (written first, pushed in d9d1c7f3) `mx4` about 22, red on a7d04ad5 first except guards; mx1,
  mx2, mx3, mp1f, mp1-shapes, never-shrink: any check that moves said per check. Full list and plan: "Plan" below.
- **Got:** `mx4` 24 checks, red on a7d04ad5 first: 17 of 24 failed there (guards: L2, L3, A2, B2, T0, T3; H3 below);
  H3 passed at 6 px on a7d04ad5, so it was tightened to 3 px, red there (-5.5) and green after (1.0).
  Moved on purpose: mp1f R1, R2; mp1e R1; rc24 T-4 (below). mx1 41, mx2 26, mx3 25, mp1-shapes 10, mp1 100,
  mirror-parity 62, mr1 26, tw1 21: unchanged. Areas: twin 27, arabic 15, report 42, checker 7 suites passed; lint 0;
  check-min: 75 match, stamps new; site config PASS; website theme-generator 922 PASS; fx1 10 of 10 on 7acab002.
- **State:** FULLRUN
- **Resume:** the reviewer's merge; the laptop's part 11 (below).

## Before -> after, per item
1. The names table had no `$schema`: Desktop refused the whole report -> the matrix's own `$schema` (V1-V3: the
   validator on the written twin and the copy shows only the English original's codes; every visual.json has one).
   Visuals the twin creates rather than clones (searched): the heatmap's names table; the copy's language buttons
   (twin-copy.mjs, already with `VC_SCHEMA`). Both covered by V1-V3.
2. Names 95 wide (the longest weekday + 24), the matrix 317.5 -> 222.5 -> the names take the English row header's
   room less 1 (R: its own width when set, else the longest weekday name, English or Arabic, + 12, a cell's padding of
   5-6 a side, DESKTOP-TESTS "Item 3, the table"), no side padding of their own; Call Center: names 82, matrix 235.5,
   its grid exactly English's (H1-H3). A row header set narrower than the names need: B1, said (H4).
3. Unanswered (no fill of its own: the theme's 2nd colour by place) became the 1st after the reorder -> each measure
   without a fill gets its English place's colour written (ThemeDataColor ColorId 2 + place) before the order turns (L1-L4).
4. "tabular" cut the contact line and kept the label at the left -> Power BI's sentence layout with MP1e's padding
   (part 9: the line whole). Capabilities 0.1.3 `cardVisual.referenceLabelLayout`: style sentence|tabular, arrangement
   rows|columns, position, horizontalAlignment, valueArea, paddings; nothing puts the title after the value (C1, C2).
5. A reversed table that fits: blank at the right -> its slack in its leftmost column, up to the room less 1 (T1-T3).
6. RepeatIQ's names 93 -> 178.67 -> the names keep 93; English's partly shown column in view at the width English
   shows of it (85.67); only English's third column behind (K1-K3).
7. ER p1-like heatmaps kept with no reason -> the plan's "matrices" line says why per heatmap (B1, B2).
8. ER p2 flat: Full Name, Department left-aligned -> a Min or Max of a model text column is right-aligned (A1, A2).

## Tests changed on purpose
- `mp1f` R1, R2 and `mp1e` R1: the agent card is no longer "tabular" and its Arabic titles are padded to one width
  again (item 4: MP1e's check as it was before MP1f).
- `rc24` T-4 ("columns within the table's width less 36"): a table that fits is now filled to the measured room
  (the box less 20, keepView, laptop part 4) less 1; the check reads the measured 20, not the writer's estimate 36.
- The plan's "tables wider than their box" (its own 36 estimate) skips the tables keepView laid out (`laidOut`).

## CHANGELOG line
- **The last fixes from a test run in Power BI Desktop:** an Arabic twin with a heatmap by weekday opens again in
  Desktop and keeps its grid as wide as in English; a legend keeps each item's colour; an agent card's contact line
  stays whole; a table narrower than its box keeps its first column at the right edge, and one wider keeps the columns
  English shows.

## Decisions I made
- Item 2: the names' width is an estimate from text-measure.js and a measured cell padding; the weekday values are
  data, never read, so a model with short names ("Mon") gets a grid narrower than English's by the difference.
- Item 4: the sentence layout (measured whole in part 9) over "tabular" + value textWrap (not measured): the values are
  in a near column (padding), the label at the left as Power BI draws it.
- Item 6: English's partly shown column is in view at its shown width (narrowed from 159 to 85.67 on RepeatIQ): the
  only way to keep it in view with the names at their English width at the right.
- Item 5: the slack goes to the leftmost column (not the names: item 6 keeps their width).
- Item 3: colours written for the first 8 measures only (the theme picker's data colours).

## For the owner
- Item 4: Power BI has no setting for a card's label at the right. Part 11 can show whether "tabular" with the value
  set to wrap keeps the contact line whole (then the values make a true column, labels still at the left).

## Risky changes
- What an answer returns: the plan's "matrices" lines now say each heatmap's reason (a few words, no data values).
- File writing: the names table gains `$schema` and side padding 0; tables laid out by keepView change widths (the
  leftmost column grows to fill; a partly shown column takes its shown width); no test loses checks.

## For the laptop (part 11)
- Call Center p1 9d8cf758: the twin opens; the grid shows hours 0-23 with no scroll, no vertical bar between grid and
  names; the names (mxHeatNames) beside it; the hour chart 52c8e333 under the grid's hours, as in English.
- Call Center p1 donut legend a28b4206: «غير مُجابة»'s dot orange, as its arc in 42cddcde.
- Call Center p1 Dan (bae91c53) and p2's four agents (c47dbc53): the contact line whole on two lines; values in a near
  column; labels at the left (Power BI's, said).
- Fintech p3 73b90b71 and af02c108: the names at the box's right edge, the blank at the left.
- RepeatIQ 19f5c974: names 93 at the right, the cohort column beside them, orders by scrolling.
- ER p1 f2c68e52: if kept, the plan says why; ER p2 flat: Full Name, Race, Department right-aligned.

## Seen, not in scope
- MX3 changed report-mirror.js and kept MP1f's ?v= stamp (20261101mp1f); this job's new stamp covers both.
- The twin's header fitting (`fitHeaders`) counts stale columnWidth entries (fields no longer in the visual) in its
  spare room (Fintech p3 tasks: two), so a header there never grows.

## Lessons for the reviewer
- A visual the twin builds rather than clones needs the validator on the written files: MX3's checks read the JSON only.

## Plan (written before the work)
Expected checks in `mx4`: V1 validator codes on the written twin within the English original's; V2 the same on the
copy; V3 every visual.json written has `$schema`. H1 Call Center's grid at least its English cells' width; H2 the names
in the hidden row headers' room, the pair in the box; H3 the hour chart lines up; H4 a row header set too narrow: B1.
L1 Unanswered keeps its English colour after the reorder; L2 Answered keeps its fill; L3 guard: a donut not reordered.
C1 no "tabular"; C2 titles padded to one width. T1, T2 Fintech's slack at the left, names at the room's edge; T3 the
names keep 327 and 238. K1 RepeatIQ's names keep 93; K2 English's second column in view; K3 only the third behind.
B1 the plan names each heatmap kept B1 with its reason; B2 guard. A1 Min of text columns right-aligned; A2 guard.
