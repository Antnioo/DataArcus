## Summary
- **Approval:** the brief "TR1 (0.3.2)" (4 Nov): B-275, RD1's brief for b275 (`rd/0.3.2-ideas`,
  `mcp/research/rd1/b275/NOTES.md` (g)), approved with its own choices by D-1104-01 ("Agree on all r&ds"); the owner,
  1 Nov: "in matrices we could switch columns but in tables it's not yet done why?"; D-1027-12 (the twin identical).
- **Base:** `fix/0.3.2-tr1` from `origin/integration/0.3.2` at 1e5e3b3. Push only this branch; never merge, no PR.
- **Scope:** `mcp/lib/twin-pages.mjs` (`growTables`, beside `keepView`), `mcp/lib/twin-plan.mjs` (one plan key), new
  suite `tr1` (`test-0.3.2-tr1.mjs`, area twin), `tests.json`, sp11's and sp26's records (below), `CHANGELOG.md`,
  WORK.md, this note. No `assets/js/` change (so no build:min, no ?v= stamps, no website suites).
- **Plan (RD1's choice A):**
  1. On the twin's right-to-left pages only, after `keepView`: a `tableEx` that English drew as a table, with 2 or more
     projections, for which English does not give every projection a `columnWidth`, and with no
     `columnHeaders.columnAdjustment` on any entry, gets `columnAdjustment 'growToFit'` in its unselected
     `columnHeaders` entry (made when absent; every other property kept, `autoSizeColumnWidth` as English).
     Power BI then spreads the blank over the columns, so the last (English's first) ends at the box's right edge.
  2. **Never changed:** a table the person sized column by column (every column has its width: `keepView`'s, as
     today), and a table with its own adjustment (`fixedWidth`, `fitToContent` or `growToFit` set by English).
  3. The plan says it per table: `tablesFillBox: [{ table, what: "its columns fill its box (grow to fit) so its first
     column ends at the right" }]`; "wider than their box" and "may be wider" unchanged.
  4. Matrices (a flat matrix written as a table too), widths from headers (B), a spacer column (C): not in this job.
- **Expected checks:** `tr1` 19, red on 1e5e3b3: 7 (G1a, G1d, G1e, G4, G5a, G6a, G6b); the 12 guards pass on the
  base. **Got:** 7 red of 19 on 1e5e3b3, 19 after.
- **Moved on purpose (each one this job's change):** sp11 T1, T2, T15, T16 and sp26 T1, T2, T15, T16, T22, T23: in
  each, one table English sizes itself (twin-project's `p2details/tblProducts`; sp26's geometry project `p0/tbl`)
  gains `growToFit`: one visual.json, the plan's `tablesFillBox` and its `exact.digest` (the files' digest). Checked
  by dumping both sides (SP11_DUMP, SP26_DUMP): with `tablesFillBox` removed, every plan and write text is the base's
  but the digest, and no other file differs. sp11 stays 21, sp26 26 (recorded again on this branch: see Decisions).
- **Answer size (L-1102-06):** create_arabic_twin's plan +138 characters per grown table (T1 12739 -> 12877, the
  largest T16 26067 -> 26205; cap 40000). fx1 3 of 3 before (22) and 3 of 3 after (22).
- **Areas:** twin, 39 suites on the base; 40 after (tr1 added). Lint 0.
- **CI:** (after the last code commit)
- **Resume:** the laptop's check (below), then the reviewer.

## CHANGELOG line
(written with the code)

## Decisions I made
(written with the code)

## For the owner
(written with the code)

## Risky changes
(written with the code)

## Seen, not in scope
(written with the code)

## For the laptop
(written with the code)

## Lessons for the reviewer
(written with the code)
