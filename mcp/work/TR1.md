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
- **Resume:** running since 2026-11-11T03:06Z; CI line below when the run on the last commit is green.

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
