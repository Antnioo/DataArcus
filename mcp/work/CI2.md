## Summary
- **Approval:** the owner's brief "CI2" (4 Nov); D-1104-17 ("most importantly we need to fix the maos failing chart");
  D-1104-02 (CI1: macOS only where the reviewer merges, kept exactly); the gate (a green run WITH macOS) never weakened.
- **Base:** `fix/0.3.2-ci2` from `origin/integration/0.3.2` at 240d1796. Push only it and `check/0.3.2-ci2`
  (the macOS proof runs); never merge, no PR.
- **Scope:** `.github/workflows/tests.yml` (the macOS job's shards and label; one B-336 step in website-checks),
  `mcp/docs/TESTS.md` (two lines), this note, one WORK.md line. No product code, no test's expected number.
- **The cause (reviewer, 4 Nov):** check run 126735029252: "The job was not acquired by Runner of type hosted even
  after multiple attempts"; notice "Due to capacity constraints, jobs targeting macOS arm64 runners may experience
  longer queue times". 5 arm64 shards per run, so 5 chances to lose one.
- **Plan:** 5 macOS jobs -> 2, each running its plan shards in turn (job 0: DA_SHARD 0/4, 1/4, 2/4; job 1: 3/4,
  4/4). The plan itself (planShards, mcp/test-times.json, test.mjs's 4 parts) and ci-sum are unchanged: the same
  mcp-shard-<k>.log and manifest per plan shard, so ci-sum checks every shard against the same plan and counts each
  suite once. Label `macos-latest` (macOS 26 arm64, 3 M1 CPU) -> `macos-15-intel` (Intel, 4 CPU, a standard runner).
- **Expected checks:** macOS jobs 5 -> 2 on macos-15-intel; two check/ runs green with both macOS jobs acquired
  (runner_name set); ci-sum's macOS total the same as before (each suite once); fix/ run green (Linux, Windows);
  `npm run lint` 0; test-results-adapter, check-agent-memory, test-stamps green.
- **State:** planned.
- **Resume:** step 1 (measure).

## The plan
1. Measure: the last 3 green macOS runs' shard times; the docs' lines on the labels.
2. The fix: tests.yml's macOS job (2 jobs, macos-15-intel, the why in a comment, CI1's `if:` unchanged).
3. Prove it: `check/0.3.2-ci2` twice (macOS), `fix/0.3.2-ci2` once (Linux, Windows).
4. B-336: `node scripts/test-stamps.mjs` beside "Every .min.js is built from its source".
5. TESTS.md: the macOS shard count, the label and why.

## Step 1: measured (gh api, the last 3 green macOS runs, macos-latest = macOS 26 arm64)
Job = started to completed; tests = the "MCP checks on macOS" step. Seconds.

| Run (ref, attempt) | shard 0 | shard 1 | shard 2 | shard 3 | shard 4 | sum of tests |
|---|---|---|---|---|---|---|
| 41838577244 (check/0.3.2-batch12, 1) | 490 / 469 | 371 / 352 | 411 / 390 | 462 / 443 | 422 / 396 | 2050 (34.2 min) |
| 41844423141 (check/0.3.2-batch-sp43, 1) | 390 / 372 | 411 / 393 | 491 / 468 | 448 / 424 | 487 / 468 | 2125 (35.4 min) |
| 41875882575 (check/0.3.2-batch-st1, 3) | 359 / 339 | 332 / 319 | 570 / 548 | 450 / 424 | 428 / 407 | 2037 (34.0 min) |

(job / tests in each cell.) Run 41875882575 needed 3 attempts: shards 3 and 4 cancelled at 17:31:01, queued
15 min, no runner. Two jobs as planned (0,1,2 | 3,4): 1211-1233 s | 831-892 s of tests on arm64, about 21 and 15 min
with the installs: under the 40-minute limit with 19 minutes to spare, so 2, not 3.

The docs (read 4 Nov):
- docs.github.com, "GitHub-hosted runners" reference: "Use of the standard GitHub-hosted runners is free and
  unlimited on public repositories." Its public-repository table, macOS rows:
  "macOS | 4 | 14 GB | 14 GB | Intel | macos-15-intel, macos-26-intel" and
  "macOS | 3 (M1) | 7 GB | 14 GB | arm64 | macos-latest, macos-15, macos-26, xcode-27".
- actions/runner-images README: "macOS 26 | x64 | `macos-latest-large`, `macos-26-intel`, `macos-26-large`";
  "macOS 26 Arm64 | arm64 | `macos-latest`, `macos-26` or `macos-26-xlarge`"; "macOS 15 | x64 | `macos-15-large`,
  or `macos-15-intel`"; "macOS 15 Arm64 | arm64 | `macos-15`, or `macos-15-xlarge`"; "Important: All macOS 14
  images retired from GitHub Actions on November 2, 2026."
- So: `macos-15-intel` and `macos-26-intel` are standard Intel runners (4 CPU); `macos-15` is standard but arm64
  (3 M1), the pool the capacity notice is about. Neither page gives a retirement date for either Intel label, so the
  brief's preference holds: `macos-15-intel`.
