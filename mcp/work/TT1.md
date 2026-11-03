## Summary
- **Approval:** the brief "TT1 (0.3.2)" (3 Nov): B-289 (SP11's and MX4's Seen), B-290 (MX5's Seen), B-302 (HM2's
  Seen); the owner D-1027-12 (the twin identical), D-1103-10 (up to 3 builders), D-1102-02 (CI on the branch is the gate).
- **Base:** `fix/0.3.2-tt1` from `origin/integration/0.3.2` at 3914b36. Push only this branch; never merge, no PR.
- **Scope:** `mcp/lib/twin-text-fit.mjs` (fitHeaders, item 1), `mcp/lib/twin-pages.mjs` (keepView, item 2; underGrids'
  kept-at-mirror line, item 3: the line is written there, not in twin-plan.mjs, which this job does not touch), the new
  suite `twin-tt1` (`test-0.3.2-tt1.mjs`, area twin), `mcp/tests.json`, `mcp/CHANGELOG.md` (one line), this note,
  WORK.md (one line). The sp11 records of the two tables this job changes (named below, each said).
- **Plan:**
  1. B-289: fitHeaders' spare counts only the columnWidth entries of the visual's current fields (its queryState's
     projections); a stale entry stays in the file as it is, not counted.
  2. B-290: a reversed table that fits (keepView's fits branch) puts its hidden columns (under HIDDEN_W, 10, the one
     definition the twin has: the brief's "under 8" holds for the 4 too) first, at the left end, as the wide branch
     already does: Power BI lays a table from the box's left, so there the 4 sits against the box's edge as English's
     does at its left; never after the names (MX4's rule: the names end at the room's edge). Widths unchanged.
  3. B-302: the kept-at-mirror line says the shift (mirror less the lined-up place, HM2's) when over 2 px, in English
     (`rule`) and Arabic (`ruleAr`, new on that entry only); 2 px or less: the line as today.
- **Expected checks:** `twin-tt1` 15: A1-A4 (a stale-entry table against its clean copy: the header's width equal,
  not cut, the stale entries kept as they are, the files equal but for them), B1-B5 (MX2's watchlist: the hidden ones
  first, their 0 and 4 kept, the visible widths as MX2 wrote them, every visible edge MX2's + 4 within 0.5 px and the
  names' right edge at the room's edge within 0.5 px, the total unchanged), C1-C6 (A1-1 with HM2's block: "31 px
  left", its Arabic; HM2's Call Center shape "16 px right", its Arabic; the 2 px boundary; the lined-up line unchanged).
  Red on 3914b36: 10 (A1, A2, A4, B1, B4, C1-C5); guards A3, B2, B3, B5, C6.
- **Moving on purpose:** sp11's records for tblFit (B-289) and tblHid (B-290) in T15/T16, and the plan text of any
  run with a chart kept at its mirror over 2 px; every other suite's number unchanged (measured below).
- **Answer size (L-1102-06):** the A1-1 plan measured before and after; fx1 run 3 times before and after.
- **Got:** (filled after the work)
- **Resume:** write the suite red on the base, then items 1-3.

## Decisions I made
- The suite is named `twin-tt1`: `tt1` is 0.3.1's TT1 (`test-0.3.1-tt1.mjs`, area arabic); names are unique (G1).
- Hidden means under HIDDEN_W (10), the twin's one definition (keepView, fitHeaders), not a second 8.
- The shift is rounded to whole px in the line; its direction from the chart to its cells (left / right).

## CHANGELOG line
(after the work)

## For the owner
(after the work)

## Risky changes
(after the work)

## Seen, not in scope
(after the work)

## For the laptop
(after the work)

## Lessons for the reviewer
(after the work)
