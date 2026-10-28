# SPD (0.3.1): the test rounds faster, not one check fewer (Codex's test-speed audit, #10 #1 #7 #8 #9)

## Summary
- **Approval:** the reviewer's brief "Go on SPD" (28 Oct). The owner: D-1027-22 (faster, never weaker; no door for
  bugs or manual editing), D-1028-02 (Codex's suggestions first). Input: Codex's audit (dataarcus-exchange PR #13,
  results/2026-10-27-test-speed), its essentials in the brief.
- **Scope:** `mcp/run-tests.mjs`, `mcp/test-results.mjs` (the plan and the manifest), `scripts/ci-sum.mjs`,
  `scripts/test-results-adapter.mjs` (the tests), a new `scripts/test-times.mjs` and `mcp/test-times.json` (the
  measured seconds), `.github/workflows/tests.yml`, a new `.github/workflows/coverage.yml`, `mcp/CLAUDE.md` /
  `mcp/docs/TESTS.md` (the local loop). No product code: nothing under mcp/lib, mcp/tools, mcp/server.mjs, assets/ or
  the site pages (a check proves it). The five gate names stay: website-checks, website, mcp, mcp-windows, mcp-macos.
- **Base:** `fix/0.3.1-test-speed` from `origin/integration/0.3.1` (0d34277). Push only this branch.
- **Before (measured, base run 40629588425 on 0d34277):** MCP wall (run start -> the aggregate job's end) Linux 12.4
  min, Windows 25.4, macOS 12.1. Shard 0 (every tests.json suite in a row) 12.1 / 25.1 / 11.8 min; shards 1-4 2.4-7.8.
  Total checks: Linux 15,604, Windows 15,629, macOS 15,600 (they differ by OS on the base too: platform-only checks);
  mcp (test.mjs) 1593 on each; G-13 249 reports, 0 with errors; 112 suites.
- **Expected after (an estimate from the base's step-log times; re-measured on the branch's CI):** each OS's five
  shards within about 1 min of each other; MCP wall Linux about 6-7 min, Windows about 11-12, macOS about 7-8 (the
  longest single suite, mutation, 169 / 366 / 180 s, is under the per-shard average). Checks per OS equal: 15,604 /
  15,629 / 15,600; test.mjs 1593; G-13 249; mutation 74 of 74 killed; the suite list per OS the base's.
- **Expected tests:** results-adapter grows by the manifest and plan checks (about +8), red first on 0d34277; every
  other suite's count unchanged.
- **Resume:** step 1.

## Plan (one commit each, red first where a test applies)
1. (Codex #10) The manifest and the result contract: run-tests writes `<log dir>/manifest.json` (per suite: file,
   name, seconds, status, checks, cause; the shard, the OS, the commit, finished). ci-sum reads every shard's log and
   manifest and rejects a run where a shard log or manifest is missing, a suite is missing or ran twice (in any two
   shards), crashed, timed out, or printed 0 checks, or where the log and the manifest disagree; it prints the total
   checks per OS. Tests inject each. Mutation's baseline: a guard that timed out is rejected (today it is not: a
   SIGKILL baseline has failed=false).
2. (Codex #1) The plan: `mcp/test-times.json` holds each suite's seconds per OS, written by `scripts/test-times.mjs`
   from a CI run's manifests (its run id and commit recorded), never typed. One function (test-results.mjs) deals the
   tests.json suites over the five shards per OS, longest first onto the lightest shard (test.mjs's part k fixed in
   shard k; SHARDS and TOGETHER untouched). run-tests (DA_SHARD=k/N) and ci-sum read the same function, so each suite
   runs exactly once per OS; a suite without a time still runs (the median's weight). Times change speed only, never
   which suites run.
3. (Codex #7) coverage and coverage-web move to `.github/workflows/coverage.yml`: nightly and workflow_dispatch.
   Mutation stays on every push.
4. (Codex #8) Playwright's Chromium cached by its revision (browsers.json), per OS and arch; a launch after the install.
5. (Codex #9) The local loop in `mcp/docs/TESTS.md` and `mcp/CLAUDE.md`.
6. The full run, then CI on the branch: before -> after per OS.
