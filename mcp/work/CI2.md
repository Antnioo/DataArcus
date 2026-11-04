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
- **Expected:** macOS jobs 5 -> 2 on macos-15-intel; two check/ runs green with both macOS jobs acquired
  (runner_name set); ci-sum's macOS total the same as before (each suite once); fix/ run green (Linux, Windows);
  `npm run lint` 0; test-results-adapter, check-agent-memory, test-stamps green.
- **State:** planned. **Resume:** step 1 (measure).

## The plan
1. Measure: the last 3 green macOS runs' shard times; the docs' lines on the labels.
2. The fix: tests.yml's macOS job (2 jobs, macos-15-intel, the why in a comment, CI1's `if:` unchanged).
3. Prove it: `check/0.3.2-ci2` twice (macOS), `fix/0.3.2-ci2` once (Linux, Windows).
4. B-336: `node scripts/test-stamps.mjs` beside "Every .min.js is built from its source".
5. TESTS.md: the macOS shard count, the label and why.
