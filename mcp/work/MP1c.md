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
- **Got:** `mp1` 87 checks (78 + 9: MC-a, b, c1, c2, d1, d2, e1, e2, O5; the estimate said about 7: c and d took 2
  each, plus the e2 guard and O5), red on 4d1aaff8 first: 7 of 87 failed there (MC-a, b, c1, c2, d1, d2, e1); e2 and
  O5 guards. Areas on fe62655b: twin 20, arabic 15, report 42; lint 0; changelog-words, agent-memory PASS. No
  other suite's number moved; no `assets/js/` change.
- **State: DONE.** Full run on fe62655b: "run-tests: 128 suites passed" (mp1 87, mcp 1594, mutation 198, 76 mutants all
  killed). CI: below.
- **Resume:** none; the reviewer's merge.

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

## Decisions I made
- e: the cause was the rule, not a missing call: rawLabels already runs every text box's Arabic through isolateLatin,
  which wraps only a text holding a Latin letter. The wrap is now also given to a text box's Arabic (the
  page's text boxes and the phone's) whose first or last character is not an Arabic letter. Other kinds of text keep V3 as it
  was (their neutral ends were not seen wrong).
- b: the visual is narrowed (its far edge kept), not moved: moved, it would leave the box it had on the picture.
- c: "stays left to right inside" is a matrix, or a table of one column (the mirror reverses a table of two or more,
  so its columns follow the bars). The bar chart must lie three quarters or more on it and above it.
- d: the check now names three kinds (why: new, rowHeaders, barsTurned), each said in English and Arabic; after b and c
  the twin no longer makes the last two, so on the owner's pages they should read none.
- a: only whole runs of tabs or spaces at a paragraph's start move, and only where the twin turned it right (a
  centred or right-aligned paragraph is left alone); the phone layout's text boxes too.

## Seen, not in scope
- Not this job (the brief): RepeatIQ KPI titles cut at their left edge, Fintech "..." labels, model values in English.

## For the laptop
- Re-run part 7's block C1: Call Center's 4 KPI titles clear of their icons; ER's weekday bars off the matrix's row
  headers; Call Center's small bar chart over the ratings table as in English; Fintech's help lines with the full stop
  at the left end and the numbered emoji at the right.
