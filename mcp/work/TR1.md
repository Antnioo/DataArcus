# TR1 (0.3.3): the tests we run every time, reviewed; the safe fixes on the DataArcus side

## Summary
- **Approval:** the owner, 11 Nov: D-1111-02 ("A session to check all tests that we run everytime today whether they
  are fully optimized or something is missing or outdated"). The full review is in the engine
  (business/plans/TR1-TESTS-REVIEW.md, branch test/tr1); this note covers only what changes in this repo.
- **Base:** `test/0.3.3-tr1` from `origin/integration/0.3.3` (7960ac78). Push only it; never merge, no PR.
- **Scope:** tests and CI only, no product code: `scripts/tests/lib.mjs` (settle), `scripts/tests/theme-generator.mjs`
  (one call), new `scripts/test-settle.mjs`, `.github/workflows/tests.yml` (3 changes).
- **Expected checks:** `node scripts/test-settle.mjs` 6 checks, red first on 7960ac78 (2 of 6 fail there); the website
  suites theme-generator and theme-generator-lab keep their check counts; every other suite untouched.
- **Resume:** DONE 2026-11-11T03:26Z; this review's CI line is the LAST line of this file (the tools read the last one; the 0.3.2
  job of the same code keeps its own note and CI line below, unchanged).
## Before -> after
1. B-439, the flaky "steps bar did not open and land on Layout {open:true,top:715,bars:551}" (theme-generator-lab,
   website shard 3; 3 fails in 26 runs of that shard on 10 Nov: runs 42797456343, 42812747355 attempt 1, 42866433432
   attempt 1, each green on the same sha afterwards). Measured cause: a probe of the lab page at 1440x900 reads exactly
   top 715, bars 551 at scrollY 0 right after the click, then 650, 335, 210 ... 125 as the smooth scroll runs. So the
   test read the position before the scroll began: `settle()` counted 4 equal readings (about 320 ms) as settled, and
   on a busy runner the scroll starts later than that. Before: `settle(pg)`. After: `settle(pg, { from: y0 })`, where
   readings at the start position do not count until the page has left it (limit: WAIT, then the caller's own check
   fails). The check itself (`land.open && land.top >= bars - 1 && land.top < bars + 60`) is unchanged.
   Red first: `node scripts/test-settle.mjs` on 7960ac78's lib.mjs: "FAIL  settle  2 of 6 checks" (a scroll that
   starts late; a page that never scrolls). With the fix: "PASS  settle  6 checks".
2. L-1110-27, the artifact race (run 42830746700 attempt 1: the mcp summary job began 3 s after the last upload, got
   "shard 0/4: 0 logs" and "shard 1/4: 0 logs" although both shards had passed and uploaded; a rerun of that one job
   passed in 14 s). After: each of the 4 summary jobs counts the shard logs it downloaded; when one is missing it
   waits 30 s and downloads once more. `ci-sum.mjs` runs after it unchanged, so a shard that is really missing fails
   as before.
3. The Arabic copies' render (79 s, median of 13) moves from website shard 1 to shard 2. Over 19 green runs on 10 Nov
   shard 1 took 749 s (median) and shard 2 took 448 s; after the move about 670 s and 527 s. Same step, same script,
   once per run as before.
4. One new CI step in website-checks: `node scripts/test-settle.mjs` (6 checks, under 1 s, no browser).

## CHANGELOG line
none (tests and CI only; nothing a user sees).

## Decisions I made
- Fixed the wait in the shared helper (one place), with an option, so the 2 other callers of `settle` keep their
  behaviour; only the B-439 call passes `from`.
- No retry of a failed test anywhere: the artifact step repeats a download, never a check.
- `mcp/test-times.json` (the seconds CI deals suites by) is from run 40647183003 and knows 113 of today's 243
  suites; refreshing it needs a run's artifacts, which this session could not download. Left as it is, said in the
  engine review.

## For the owner
none here (the asks are in the engine review's "For the owner").

## Risky changes
- Tests: `scripts/tests/lib.mjs` settle gains an option (default behaviour unchanged, pinned by test-settle check 2);
  `scripts/tests/theme-generator.mjs` one call passes it. No check removed, no expected value changed.
- CI: tests.yml gains one step in website-checks and two steps in each summary job; the Arabic render step runs in
  shard 2 instead of shard 1. No job, shard or timeout removed or changed.

## Lessons for the reviewer
- A flake's failure message can name its own cause: the values in "top 715, bars 551" are the page at rest before the
  scroll, which one probe showed in a minute. B-439 had been rerun 3 times in a day.
- `settle` has 2 more callers after a click on `#exampleBtn` (theme-generator.mjs); they have not failed in the 24
  runs read, and were left alone.

---

# Earlier job with the same code: TR1 (0.3.2, 4 Nov, B-275: the twin grows its tables). Its note, unchanged

(The hub gave this review the code TR1 on 11 Nov; the 0.3.2 job TR1 already had this file. Nothing below was edited.)

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
     projections, for which English does not give every projection a `columnWidth` (read on English's table: the
     twin's row label route gives English's text column a hidden 0, not the person's sizing), and with no
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
- **Areas:** twin 39 suites on the base, 40 after (tr1 added); safety 18, arabic 15, checker 8 pass. Lint 0.
- **Merge:** integration/0.3.2 (PK1) merged in once after the last code commit (WORK.md: both lines kept); after it
  twin 40 and report 58 pass (glass-tables needed the base commit cba24a5: a deeper fetch here), lint 0.
- **CI green: https://github.com/Antnioo/DataArcus/actions/runs/41783106048 on abffaf03** (17 jobs green, 2 skipped:
  macOS, CI1's rule). After abffaf03 only this note changed. **State: DONE.**
- **Resume:** the laptop's check (below), then the reviewer.

## CHANGELOG line
- **Arabic twin tables reach the right edge:** a table whose column widths Power BI works out itself now has its
  columns fill its box on the Arabic pages, so its first English column ends at the box's right edge, as a matrix's
  does; a table with a width for every column, or with its own column sizing setting, is left exactly as it was.

## Decisions I made
- "Sized column by column" is read on English's table, not the twin's: the twin's row label route (MX1) gives
  English's text column a width of 0 (hidden) and copies its width, if any, to the row label; counting the twin's
  widths would call a table with no width "partly sized". A table with every width in English keeps keepView's.
- "Its own adjustment" is a `columnAdjustment` on any columnHeaders entry, selected or not: a per-column one is the
  person's sizing too. An unexpected shape (columnHeaders not a list) is left as it is.
- Mixed widths (some set) get growToFit, the set widths kept as they are: RD1's recommendation (e), its check 3 for
  the laptop. A flat matrix written as a table is left out (RD1: "not in this job", matrices keep their route).
- `TABLE_GROW_TO_FIT` (assets/js/layout-check.js) left as it is: RD1 ties the choice to Desktop check 4, which has not
  run; so no assets/js change (and no website steps). See "For the owner".
- The plan's key is `tablesFillBox`, one entry per table with RD1's words (keptInView's shape), cut at 30 like it.
- sp11's and sp26's records were recorded again on this branch (SP11_RECORD, SP26_RECORD), not on the base: their
  header says "only on the base, never to make a run pass"; here the moves are this job's on purpose and each is
  proven above (TT1 did the same for sp11). The other runs' records are unchanged (git diff: only those entries).

## For the owner
- **check_report can now say `TABLE_GROW_TO_FIT` (high) on the twin's Arabic tables** that have a text column and no
  word wrap (the twin's tables now say "grow to fit"). RD1 left the choice to Desktop check 4 (O-14: does a long text
  column push the others out worse under grow to fit than under English's fit to content?). My recommendation, and
  what is built: no change until the laptop runs check 4; if Desktop shows it no worse, exempt the twin's tables in
  layout-check.js; if worse, add values word wrap on those tables only (RD1 (e)), said in the plan.

## Risky changes
- **A table with a text first column (most tables):** the twin already hides English's text column at width 0 and
  shows its row label (MX1). Microsoft documents that "grow to fit" spreads the leftover "evenly to each column" and
  that custom widths coexist with the auto-size mode, but not whether a 0 width stays 0 under grow to fit. If it does
  not, a second copy of the names shows at the table's left. The laptop's step 3 below checks exactly this.

## Seen, not in scope
- The validator does not check a `columnWidth` selector against the query (RD1 X2); tr1 G6f checks it on the twin.
- The approval page (twin preview) draws tables from their box only; it does not say "grow to fit".

## For the laptop
Made-up report only, Power BI Desktop, a 1280 x 720 page, Segoe UI 10pt. Measure in Desktop's own px with the
selection box (Format > General > Properties) or a screenshot at 100% zoom; edges, never centres (L-1102-07).
1. Build the English table `tblNone` (Region text, Revenue, Customers; made-up rows, 5 of them), box x 20, width 600,
   no column widths, no auto-size setting. Run create_arabic_twin (approve), open the twin's page.
2. **Check 4 (RD1 (f) 4, O-14).** Add a second table `tblLong` (box 600 wide): a text column of made-up 60-character
   values, Revenue, Customers, no word wrap, no widths. Twin it. For `tblNone` and `tblLong` on the Arabic page:
   - measure the right edge of the last (rightmost) column's header cell and the box's right edge (x + width);
   - **pass:** the gap is at most 24 px (the 20 room measured in MX3 plus 4), or at most 36 px when a vertical
     scrollbar shows (its 12); **before (the base):** about 300 px or more of blank at the right for `tblNone`;
   - for `tblLong`, say also whether Revenue and Customers stay in view in English (fit to content) and in the twin
     (grow to fit): both in view, both pushed out, or only the twin's; then set values word wrap on in the twin and
     count the rows in view and their height. This decides `TABLE_GROW_TO_FIT` ("For the owner").
3. **The hidden column (Risky changes).** On `tblNone` in the twin: the leftmost column is English's Region at width 0.
   Pass: no column shows at the table's left before the numbers (the left edge of the first visible column within
   24 px of the box's left edge, and no second "Region" header anywhere). Fail: a Region copy at the left.
4. **Mixed (RD1 (f) 3):** give `tblNone`'s Revenue a width of 120 in English, twin again: Revenue stays 120 (within
   1 px) and the last column's right edge passes step 2's rule.
5. Report: each number measured, pass or fail, and "Seen, not in scope".

## Lessons for the reviewer
- The golden suites (sp11, sp26) hold hashes only: to see what moved, dump both sides (SP11_DUMP, SP26_DUMP) and
  compare texts with the job's own addition removed; that proves the move is the job's alone.
- The twin's tables are rarely "no widths" after the mirror: the row label route adds a 0. Rules about the person's
  sizing read English's visual.

---

## TR1 (0.3.3, the tests review): CI
DONE 2026-11-11T03:26Z. Linux and Windows, macOS skipped by the workflow on a builder branch; 955 s.
CI green: https://github.com/Antnioo/DataArcus/actions/runs/42950664465 on f5e8ae672798bd91a13d2efc7684afc503efc183
