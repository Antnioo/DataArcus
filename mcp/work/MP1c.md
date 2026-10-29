# MP1c (0.3.1): laptop part 7's last two front-page collisions

## Summary
- **Approval:** the reviewer's brief "MP1c" (29 Oct, 17:50), from laptop part 7 (engine lab/rc031-part7 3f524c7,
  business/beta/rc031-part7/RESULTS.md block C1; shots call-center-p1-*-p7.png, er-p1-ar-p7.png,
  fintech-p1-help-zoom-ar-p7.png): 24 of 24 pages right to left, Normal/Fit/Fill exact; five things left. The owner:
  D-1029-03 (every page right to left), D-1027-12 (the twin identical).
- **Base:** `fix/0.3.1-mp1c` from `origin/integration/0.3.1` at 4d1aaff8. Push only this branch.
- **Scope:** `mcp/lib/twin-pages.mjs` (a: indentation runs; b, c: a visual over a matrix or a table that stays left to
  right inside), `mcp/lib/page-picture.mjs` (d: the overlap check), `mcp/lib/twin-texts.mjs` (e: rawLabels, a text
  box's Arabic with neutral ends wrapped), `mcp/test-0.3.1-mp1.mjs`, CHANGELOG if a line is needed. Not this job
  (0.3.2): RepeatIQ KPI titles cut at the left, Fintech "..." labels, model values in English.
- **Expected checks:** (written before the work) `mp1` + about 7, each red on 4d1aaff8 first, made-up in the real
  shapes: A1 (a text box ["\t\t\t\t\t", "Calls"] left-aligned under an icon at its left: the twin's paragraph
  [Arabic, tabs], the indentation at the end); B1 (a bar chart overlapping a matrix's right margin by 24: in the twin
  no longer on the matrix's left side, its row headers; within its own mirrored box); C1-C2 (a small bar chart over a
  one-column table: kept at its place on the table, its bars' direction kept (no invertAxis)); D1-D2 (the check names
  an overlap that moved onto a matrix's row-header side, and a bar chart over a table whose bars turned; both on the
  unfixed shapes, as the check's own unit input); E1 (a text box's Arabic line "1 صفّ ... حالته." written wrapped
  RLI ... PDI; one with Arabic letters at both ends unchanged: a guard). Other suites: none expected to move. Full
  run: the base's 128 suites.
- **Got:** (after the work)
- **State:** plan pushed; the work next.
- **Resume:** the red checks in `mcp/test-0.3.1-mp1.mjs`, then the code.

## The plan
a. On a text box paragraph the twin turns right, whole runs of only tabs or spaces at its start (indentation) move to
   its end, after the labels are written (the runs' ids stay those the plan listed).
b. A visual that overlapped a matrix in English on the matrix's right part (away from its row headers): in the twin
   that overlap lies on the matrix's left, where its row headers stay: the visual is narrowed on its side facing the
   matrix by the overlap, inside its own mirrored box (so it stays where it was on the picture).
c. A bar chart drawn over a table or matrix that stays left to right inside (a matrix; a table of one column, which
   the mirror does not reverse): kept at its place on it, its bars' direction kept (as Mirror's units keep a badge on a
   host, and T-6 keeps a bar list's direction).
d. The overlap check also names a pair that overlapped in English when, in the twin, the overlap moved from a matrix's
   right part to its left part (its row headers), or a bar chart over a table or matrix had its bars turned.
e. A text box's approved Arabic whose first or last character is not an Arabic letter (a digit, an emoji, a full
   stop) is wrapped whole in RLI ... PDI (BD2's V3, measured right on text boxes): isolateLatin wraps only a text with
   a Latin letter, so these lines got no mark and their neutral ends took the box's left-to-right order.

## For the laptop
- Re-run part 7's block C1: Call Center's 4 KPI titles clear of their icons; ER's weekday bars off the matrix's row
  headers; Call Center's small bar chart over the ratings table as in English; Fintech's help lines with the full stop
  at the left end and the numbered emoji at the right.
