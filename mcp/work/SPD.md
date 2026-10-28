# SPD (0.3.1): the test rounds faster, not one check fewer (Codex's test-speed audit, #10 #1 #7 #8 #9)

## Summary
- **Approval:** the reviewer's brief "Go on SPD" (28 Oct). The owner: D-1027-22 (faster, never weaker; no door for
  bugs or manual editing), D-1028-02 (Codex's suggestions first). Input: Codex's audit (dataarcus-exchange PR #13,
  results/2026-10-27-test-speed), its essentials in the brief.
- **Scope:** `mcp/run-tests.mjs`, `mcp/test-results.mjs` (the plan, the manifest), `scripts/ci-sum.mjs`,
  `scripts/test-results-adapter.mjs` (the tests), new `scripts/test-times.mjs` and `mcp/test-times.json`,
  `mcp/test-0.3.1-mutation.mjs` (its baseline only), `.github/workflows/tests.yml`, new `.github/workflows/coverage.yml`,
  `mcp/CLAUDE.md`, `mcp/docs/TESTS.md`. No product code (a check proves it). The five gate names stay.
- **Base:** `fix/0.3.1-test-speed` from `origin/integration/0.3.1` (0d34277). Push only this branch.
- **Before (base run 40629588425 on 0d34277):** the longest MCP shard Linux 12.1 min, Windows 25.1, macOS 11.8 (shard 0:
  every tests.json suite in a row); wall from run start 12.2 / 25.3 / 11.9. Checks Linux 15,604, Windows 15,629, macOS
  15,600; test.mjs 1593; G-13 249 reports, 0 with errors; 114 suites.
- **Expected checks:** (written first) every OS's checks, suites and counts equal the base's; results-adapter about +8,
  red first; every other suite's count unchanged. MCP wall about Linux 6-7, Windows 11-12, macOS 7-8 min (an estimate).
- **Got (run 40650729879 on b6422ba):** the longest MCP shard Linux 12.1 -> 5.8 min, Windows 25.1 -> 12.1, macOS 11.8
  -> 7.9; each shard's own suites 222-337 s / 500-691 / 286-454. Wall from run start 13.8 / 19.2 / 16.7: that run
  queued for runners beside P3A's (its shards started 3-10 min late); the final run below measures it again. Checks
  15,604 = 15,604, 15,629 = 15,629, 15,600 = 15,600; the 114 result lines per OS (name and count) identical to the
  base's; test.mjs 1593; G-13 249, 0 with errors; mutation 74 of 74 killed (Linux; 73 / 72 by platform, as the base).
  results-adapter 22 -> 42 checks (18 of the 20 new red on the commit before them first; the 2 others are guards).
- Full run on b6422ba: "run-tests: 114 suites passed"
- **Resume:** done once the final CI run is in the note; then the reviewer.

## Plan (one commit each, red first where a test applies)
1. (Codex #10) The manifest and the result contract (run-tests, ci-sum); mutation's baseline rejects a timeout.
2. (Codex #1) The plan: `planShards` deals the tests.json suites over the five shards per OS by `mcp/test-times.json`.
3. (Codex #7) coverage and coverage-web into `.github/workflows/coverage.yml`: nightly and workflow_dispatch.
4. (Codex #8) Playwright's Chromium cached by its revisions, per OS and arch; a launch after the install.
5. (Codex #9) The local loop in `mcp/docs/TESTS.md` and `mcp/CLAUDE.md`.
6. The full run, then CI on the branch: before -> after per OS.

## Results
- Commits: 479f915 (1), 93ca5e3 (2), 9eba62b (3), 339a85b (4), b6422ba (5).
- 1: run-tests writes `manifest.json` in its log folder (each suite's seconds, status, checks, cause; the shard, the
  OS, the commit, the run; `finished`). ci-sum reads each shard's manifest beside its log and rejects: a missing or
  unreadable manifest (`missing-manifest`), an unfinished one (`crash`), one of another shard or OS (`missing-shard`), a
  suite the manifest says timed out or crashed (its cause), a suite in two shards (`duplicate-suite`), a PASS with 0
  checks (`zero-checks`, the MCP side had none before), the log and the manifest disagreeing (`manifest-mismatch`). It
  prints the total per OS (`PASS  mcp  15604 checks in all shards (linux: 114 suites, 5 shards)`) and each shard's
  seconds. Mutation: a guard whose baseline timed out was counted as a pass (`failed` is false on SIGKILL); now it
  fails the run (`DA_MUTATION_GUARD_TIMEOUT`, seconds, lets the test prove it).
- 2: `planShards` (mcp/test-results.mjs): test.mjs in every shard (its part k in shard k, SHARDS and TOGETHER
  untouched, a SKIP in shard 0); every other suite in exactly one shard, longest first onto the lightest (a tie: the
  lower shard); a suite without a time weighs the OS's median; an OS without times uses linux's. run-tests
  (DA_SHARD=k/N) runs shard k's suites, each other suite with DA_SHARD=0/N as in the base's shard 0; ci-sum checks every
  shard against the same plan. `mcp/test-times.json` is run 40647183003's seconds (479f915, the base's layout; its 15
  manifests), written by `node scripts/test-times.mjs <gh run download folder>`. `npm test -- --plan [--os x]` prints it.
- 3: the two jobs moved unchanged; tests.yml says where they went. 4: website-suites and coverage-web; first run a
  miss (saved), the launch step "Chromium 156.0.8078.4 launches". 5: three lines, both files.
- Product code: `git diff 0d34277 -- mcp/lib mcp/tools mcp/server.mjs assets '*.html'` is empty; the check "SPD changed
  no product code" (results-adapter) reads every SPD commit's files.

## Tests changed on purpose
- results-adapter: its ci-sum fixtures now write each shard's manifest beside its log (made from the log's own result
  lines), as CI's artifacts have it; no existing assertion changed.
- mutation: the baseline check `ok(!r.failed)` -> `ok(!r.failed && !r.timedOut)` (stricter); its count is unchanged.

## CHANGELOG line
None: nothing users see changes (CI and the test runner only).

## Decisions I made
- The times come from a CI run's manifests through a script, with the run and commit recorded; a check holds their
  shape (seconds only, tests.json's suites only, every OS deals every suite once). They change balance, never which
  suites run: a missing or stale file still runs every suite once (ci-sum and the runner read the same file).
- Every suite but test.mjs keeps DA_SHARD=0/N, whichever shard it lands in: its environment stays the base's.
- test.mjs's SHARDS untouched: its parts are already 2.4-7.8 min; the gain was shard 0.
- The coverage schedule 01:23 UTC; scheduled runs use the default branch's file, so it runs nightly once on main.
- actions/cache pinned by commit (caa2961, v5.1.0, from `git ls-remote`), as the other actions.
- Wall time measured both from the run's start and from the first shard's start, as runner queues differ per run.

## For the owner
none

## Risky changes
- ci-sum (the merge gate's sum) now rejects more (listed in 1); a real run passed it on all OSes twice.
- Which shard runs which suite changed (2); every suite still once per OS, identical result lines per OS.
- coverage and coverage-web no longer on pushes or PRs (3): never gates; they run nightly and by hand.
- No test loses a check; mutation's baseline is stricter (1).

## For the laptop
none (CI and the runner only; `npm test` without DA_SHARD runs every suite in order, as before).

## Seen, not in scope
- Codex #2-#6 (persistent validator, shared fixtures, browser waits, shared navigation, mutation workers): later.
- The shards' own seconds vary per runner (Windows 500-691 s against 483 planned): one run's times; refresh them with
  `scripts/test-times.mjs` from a later green run when suites move.

## Lessons for the reviewer
- A check through `| tail` hid a failing check-agent-memory before my first push (fixed one commit later, 34662aa).
- Two runs on one branch cancel each other (the concurrency group): the second dispatch cancelled 40650211695.
