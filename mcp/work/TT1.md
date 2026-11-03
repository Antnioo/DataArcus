## Summary
- **Approval:** the brief "TT1 (0.3.2)" (3 Nov): B-289 (SP11's and MX4's Seen), B-290 (MX5's Seen), B-302 (HM2's
  Seen); the owner D-1027-12 (the twin identical), D-1103-10 (up to 3 builders), D-1102-02 (CI on the branch is the gate).
- **Base:** `fix/0.3.2-tt1` from `origin/integration/0.3.2` at 3914b36; integration (SP10) merged in once after the
  last code commit (clean). Push only this branch; never merge, no PR.
- **Scope:** `mcp/lib/twin-text-fit.mjs` (fitHeaders), `mcp/lib/twin-pages.mjs` (keepView; underGrids' line, now
  `keptAtMirrorLine`; ruleMoves carries `ruleAr`). twin-plan.mjs not touched: the line is written in twin-pages.mjs.
  New suite `twin-tt1` (`test-0.3.2-tt1.mjs`, area twin), `tests.json`, `CHANGELOG.md`, WORK.md, this note; sp11's
  records and one made-up table, mx4 T3 (each below).
- **Plan:**
  1. B-289: fitHeaders' spare counts only the columnWidth entries of the visual's current fields (its queryState's
     projections); a stale entry stays in the file as it is, not counted.
  2. B-290: a reversed table that fits (keepView's fits branch) puts its hidden columns (under HIDDEN_W, 10) first, at
     the left end, as the wide branch already did. Where and why: Power BI lays a table from its box's left, so there
     the 4 sits against the box's edge as English's sits at its left; the names end at the room's edge (MX4's rule).
  3. B-302: the kept-at-mirror line says the shift (the mirror less the lined-up place, HM2's) when over 2 px, in
     English (`rule`) and Arabic (`ruleAr`, on that entry only); 2 px or less: the line as before.
- **Expected checks:** `twin-tt1` 15, red on 3914b36: 10 (A1, A2, A4, B1, B4, C1-C5). **Got:** 10 red on 3914b36
  (5 of 15), 15 after. Edges (L-1102-07): every visible column's left and right edge = MX2's + 4 within 0.5 px, the
  names' right edge at the room's edge (490 - 32 x 720/1080 - 1 = 467.67) within 0.5 px.
- **Moved on purpose (each one this job's change):** sp11 records T7, T9 (twin-fuzz B2new-1, B2new-8: their
  kept-at-mirror line gains the shift, 343 px right and 135 px left, and its Arabic), T15, T16 (tblFit: the header
  127 -> 351, no longer cut; tblHid: its hidden 4 first). sp11's C1 lost "a table header cut" (tblFit was cut only by
  B-289), so sp11's made-up project gets tblCut (120 wide, no spare room). Checked on the base code with tblCut added:
  the base and the fix differ only in those four runs' plan/write and in tblFit and tblHid's files. sp11 stays 21.
  mx4 T3: Fintech p3's tasks (two stale entries) now give their 72 spare px to the headers: Actual Hours 104 -> 164
  (its need), Planned Hours 114 -> 126 (still "may be cut"); expected [104, 114, ...] -> [164, 126, ...]; mx4 stays 24.
- **Answer size (L-1102-06):** create_arabic_twin's plan answer, A1-1 with HM2's block 8527 -> 8821 characters, the
  Call Center shape 10110 -> 10405, A1-1 lined up 8311 -> 8311. fx1 3 of 3 before (22) and 3 of 3 after (22).
- **Areas:** twin on the merged tree: every suite passes (sp11 21, mx4 24, hm2 15, twin-tt1 15, twin-fuzz 185, ...);
  lint 0; changelog-words, agent-memory PASS. The local full run hung in test.mjs in this container (stopped); CI ran all.
- **CI green: https://github.com/Antnioo/DataArcus/actions/runs/41733601552 on 2b48c288** (first run, 23 jobs: Linux,
  Windows, macOS). After 2b48c288 only this note changed. **State: DONE.**
- **Resume:** the reviewer's merge; the laptop items below.

## Decisions I made
- The suite is named `twin-tt1`: `tt1` is 0.3.1's TT1 (`test-0.3.1-tt1.mjs`, area arabic); names are unique (G1).
- Hidden means under HIDDEN_W (10), the twin's one definition (keepView, fitHeaders), not a second 8 (the 4 is under both).
- The shift is rounded to whole px, its direction from the chart to its cells; `ruleAr` only where the shift is said.
- sp11's coverage kept with a new made-up table rather than a longer Arabic on tblFit (tblFit keeps showing B-289's fix).

## CHANGELOG line
- **Three small Arabic twin fixes:** a table header grows into its table's free room even when the table keeps widths
  for fields it no longer shows (those settings stay as they are); a column the English hides stays hidden at the
  table's left end, never as a thin strip after the names; a chart kept where the plain mirror puts it under a heatmap
  says, in English and Arabic, how many pixels it stands off the grid's cells.

## For the owner
- B-302 shows how far some kept charts stand: twin-fuzz's B2new-1 343 px, B2new-8 135 px, A1-1 31, Call Center 16.
  The plan now says it; whether a chart that far off should be moved some other way is a later decision (recommendation:
  leave it said, as now, until a laptop case shows one).

## Risky changes
- Hidden columns first in a table that fits: every reversed table with a hidden column now has its visible columns 4
  (its hidden width) further right; the names end at the room's edge. Seen in sp11's tblHid and MX2's watchlist only.

## Seen, not in scope
- In a twin with stale entries, the original's own entry for the row field stays at 0 beside the row label's (SP11's
  note): harmless, unchanged.
- The kept-at-mirror Arabic names the blocking visual by its id (Latin), as the English line does.

## For the laptop
- Fintech p1 watchlist 66641c48: no sliver after the names at the right; a 4-wide column at the table's left edge.
- Fintech p3 tasks 73b90b71: the Actual Hours header whole, Planned Hours as said.
- Call Center p1 hour chart 52c8e333 (if kept at its mirror): the plan's line says its px from the grid.

## Lessons for the reviewer
- A characterisation suite's coverage check can rest on a bug (sp11's "a table header cut" was B-289): fixing the bug
  needs a new honest case, checked on the base code, not a re-record alone.
