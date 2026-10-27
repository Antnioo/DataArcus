## Summary
- **Approval:** the reviewer's brief "Go on TW1" (27 Oct); the owner, D-1027-12: "i want the twin to be identical that
  is why it's called a twin"; D-1027-20: "if something seen not in scope found that needs to be fixed fix it" (items 8, 9).
- **Base:** `origin/integration/0.3.1` at 13afb3a (GD2, ST1, SF1 merged). Branch `fix/0.3.1-twin-parity`.
- **Scope:** nine items of ST1's STOP-GAP table and FIXED-HERE-NEXT list. Not `design-engine.js` (TS1), not
  `pbip-export.js` nor the generator's download step (TT2). In `theme-generator.js` only the glass table (98-99) and
  the ?v= stamp list.
- **State: DONE** (all nine items, every test red first). Full run line at the end of "Results".
- **Items:** 1 M1-S1 panels kept, mirrored; 2 M1-S2 the twin's table says «الإجمالي» (the writer's right-to-left table,
  round 23, proven in Desktop, DESKTOP-TESTS.md 2026-10-08); 3 M1-S3 a number column's continuous axis reversed in the
  twin as in create_report; 4 SQ4-S2 the twin's phone card title takes the writer's wrap rule (one function now,
  `pbip-sizing.js phoneCardFit`); 5 GL2-S2 the website's glass table: header clear, banded rows the engine's band;
  6 GL1-S2 the plan's words follow the look (`design.mjs lookWords`); 7 SQ13-S1 plan-lint's build mirrors charts;
  8 SQ1-S2 a stacked slicer slot drops what does not fit (told "too short"); 9 SQ15a-S2 the bullet bar says an
  expression target.
- **Expected checks:** as planned (tw1 about 20, parity +0, glass-default +2, sq13 +1, website +2); measured:
  **Tests before -> after:** new suite `tw1` 0 -> 18 (12 red on 7131b72 first: T1-T3, T5, A1-A2, P1, S1-S2 x2, K1);
  glass-default 41 -> 43 (L7 red on 7131b72, L8 a guard); sq13 38 -> 39 (SQ13-S1 red); website theme-generator: 2 new
  checks (EN, AR glass table, red on 13afb3a's theme-generator.min.js, 922 checks either way: the run counts each);
  en-ar-copy X1 turned round on purpose (red on 7c874bd); parity 63 = 63 (KNOWN.textPanel gone, the W table order
  check now "the writer's order"); rc24 T-4 skips hidden width-0 columns.
- **Changed on purpose (twin suites, plain reports):** a twin's text boxes keep their panel (item 1); a table starting
  with a text column takes the row label shape (item 2); a number axis reversed (item 3); a writer-shaped phone card's
  title fit (item 4). Nothing else in a plain twin moves (twin 10 suites, arabic 14, model 14 pass).
- **Golden / written positions that move (item 8):** none in the golden set (report area passes unchanged); only a
  stacked slot too short for its slicers: a 60 x 80 slot keeps one slicer 67 high (in its group, 7 to 74), the Reset and
  the second slicer left out and told.
- **Resume:** none; the reviewer's merge.

## Plan (as committed first, 7c874bd)
1. M1-S1: `textPanelsOff` and the answer's `textBoxes` go. 2. M1-S2: the writer's row-label table in `buildTwin`.
3. M1-S3: `continuousColumnsOf`. 4. SQ4-S2: the writer's phone card rule in `labelMobile`. 5. GL2-S2. 6. GL1-S2.
7. SQ13-S1. 8. SQ1-S2: the drop loop. 9. SQ15a-S2: `kpiSaid` exported.

## Results (before -> after)
| Item | Before | After | Test |
|---|---|---|---|
| M1-S1 | the twin's Arabic text boxes had background, border, shadow off; the English kept the theme's panel | the same panel both sides (mirrored like every visual); parity compares panels too | en-ar-copy X1, parity W textbox |
| M1-S2 | columns reversed, a number first: no total word | the text column first and hidden, numbers mirrored, `Row label: <Column>` at the right (the writer's DAX, «الإجمالي»), in the twin's own reportExtensions.json; the plan says it (`tables`; the bilingual answer one line, `totalRows`); fitHeaders treats the row label as the text column; the Arabic lens does not flag the shape | tw1 T1-T6, parity W table order, rc24 T-4, arabic-lens C1 |
| M1-S3 | Calendar[Year] (int64) axis left to right in the twin | `categoryAxis.invertAxis` as create_report (continuous columns: dates and numbers) | tw1 A1-A2 |
| SQ4-S2 | the English phone title's wrap kept | the writer's rule (`phoneCardFit`): two lines with titleWrap and the two-line fit, else one line; the approved text never cut | tw1 P0-P3 |
| GL2-S2 | header filled with the accent, no band | header clear in the text colour, odd rows `gl.table.band` | theme-generator (EN, AR) |
| GL1-S2 | glass, yet "the new visuals are solid" | `glassVisuals` under glass; plain keeps `solidVisuals` (plan_layout and generate_theme) | glass-default L7-L8 |
| SQ13-S1 | plan-lint's Arabic preview: time charts left to right | `chartAxes` as create_report's default | sq13 SQ13-S1 |
| SQ1-S2 | 60 x 80 stacked: second slicer at y 88 | Reset, then slicers from the last, left out and told (`short`: "too short"); the first stays as high as the slot gives | tw1 S1-S3 |
| SQ15a-S2 | notUsed named only the "Target/Goal/Budget" rule | adds "<t>[<m>]: its KPI in the model has a target, but it is an expression..." (at most 10) | tw1 K1 |

Full run: see the line below (after the last code commit).

## CHANGELOG line
"The Arabic twin matches the English report more closely" (mcp/CHANGELOG.md [Unreleased]); no number in it.

## Decisions I made
- Item 2 applies when the original's first column is a column of text by the model's type, or untyped, or the model is
  not readable (a published model): a number or date column first keeps the mirrored columns (tw1 T6).
- The total word is the writer's fixed «الإجمالي» (`pbip-page.js`), not a translation of a user's text: said in the plan.
- Item 4: a title too long for two lines is not shortened in the twin (the writer shortens its own English): it stays on
  one line and Power BI ends it with "…"; the approved Arabic is never cut by DataArcus. Only a card whose name changed.
- Item 4's rule moved into `pbip-sizing.js` (`phoneCardFit`); `pbip-page.js` calls it: golden unchanged.
- Item 8 keeps the first slicer even when the slot is shorter than a dropdown needs (as the strip keeps one 24 wide).
- The bilingual (EN-AR) answer gets one line (`totalRows`), not the full `tables` entry: the full one pushed that
  answer over its cap and dropped its `cannot` list (bilingual-report B5f went red); see Seen 1.

## For the owner
none

## Risky changes
- What an answer returns: the twin's plan gains `tables` (the row labels, at most 60); the bilingual answer `totalRows`;
  plan_layout and generate_theme give `glassVisuals` instead of `solidVisuals` under glass; create_report's
  `leftOutVisuals` can say "too short"; the bullet bar's notUsed can name a measure. The twin's plan loses `textBoxes`.
- File writing: the twin's own reportExtensions.json can now hold `Row label: ...` measures (it already held title,
  text and waterfall measures); built at plan time, so the approved plan's files are exactly what is written
  (twin-artifact passes). The original report and the model are never changed (tw1 T4).
- Tests that lose checks: none lose a check; rc24 T-4 no longer counts a hidden (width 0) column (no header to fit);
  en-ar-copy X1 now asserts the opposite of R1's item 4 (the owner's "identical").

## For the laptop
Part 3 of 0.3.1, one sitting: one glass report and its twin side by side, EN and AR, every page.
1. Text boxes: the same panel on both pages, in the mirrored place.
2. The table: «الإجمالي» at the right of the total row, the name column hidden (Focus mode, a resize, Fit to width),
   a row click filters the page (the writer's shape, proven 8 Oct; record that the twin's file draws the same).
3. A column chart on a whole-number column (Year, continuous): the latest year at the left in the twin, as in
   create_report's Arabic. Record the axis's first and last label.
4. View > Mobile: a new card whose Arabic title is longer than the English: two lines, the value whole; record its
   value size (the writer's fit) and whether any letter is cut.
5. A hand-placed filter slot 60 x 80 on a 1280 x 720 page: one slicer, its header and dropdown whole? Record what Desktop
   draws at 67 high (under the dropdown's measured 76).

## Seen, not in scope
1. plan_layout's bilingual answer drops its `cannot` list without saying when a field pushes it past its size (found
   when a `tables` entry was added): a cap that cuts silently.
2. The mirror does not mirror a visual's shadow direction (any visual, not only text boxes): a shadow cast to the
   bottom right stays there on the Arabic page.
3. The twin's row-label header can be listed "may be cut" (rc24: 171 needed, 161 given): the same as the text column's
   before; a shorter Arabic name fixes it.

## Lessons for the reviewer
- `git stash push -- <file>` after a commit compares with HEAD, not the base: to prove red on the base, stash before the
  code commit or check out the base file.
- A new field in a capped answer can drop another field silently (Seen 1): run the bilingual suite after any twin
  answer change.
