# CI3 (0.3.3): the flaky CI checks that slow every release

## Summary
- **Approval:** the owner D-1112-06 (12 Nov, "okk i agree ..."): CI3 after RL33; the reviewer hub's brief "CI3"
  (I-1112-1700, I-1112-1703). D-1104-19 (macOS off the integration path, required before main) kept exactly.
- **Base:** `fix/0.3.3-ci3` from `origin/integration/0.3.3` at 9ee1b0ce. Push it, and `check/0.3.3-ci3` (the same
  commits, only for the macOS proof runs: a manual run on fix/* skips macOS, as CI2 did); never merge, no PR.
- **Scope:** `scripts/tests/sp35.mjs` (its fixed waits), `scripts/tests/lib.mjs` (a shared wait, if one is needed
  twice), `.github/workflows/tests.yml` (the macOS jobs' grouping; a retried log upload; the "What's new" step's
  name), `mcp/docs/TESTS.md` if it states the grouping, this note, one `mcp/WORK.md` line. No product code; no
  recorded value of sp35's fixture changes (R-10).
- **Expected checks:** (written before the fix)
  - sp35 under load (CPU throttled 16x plus 8 busy loops): red on 9ee1b0ce first ("E1/A1 ... ripples: 1 -> 0",
    CI's line), then green 5 of 5 under the same load after; green unloaded; 38 checks before and after.
  - macOS: no job near 40 minutes. Before (from the logs): job "0 2" 2405 s, cancelled (run 43267699060 att. 1),
    1188 s on a normal runner (run 43316573737). After: each job one plan shard, the longest about 1100 s normal.
  - The missing shard: its cause named from job 131249962878's log; the upload retried once.
  - `node scripts/check-modules.mjs --strict` PASS; lint 0; check-agent-memory, check-result-lines PASS; tests.yml
    green on Linux, Windows (fix/) and macOS (check/), each job read.
- **Resume:** the plan is pushed; next is the sp35 fix (step 2).

## Plan
1. This note, pushed.
2. sp35: every fixed wait replaced by a wait for the state the step's check reads (the ripple counted by a
   MutationObserver, the page's scroll ended through lib.mjs's `settle`, the menu's collapse ended, the counters
   at their targets); red under load on the base first, then 5 of 5 green under the same load.
3. tests.yml: macOS one job per plan shard (5 jobs); the parts' log upload tried a second time after a failed one;
   the "What's new in 0.3.0" step renamed to what it checks.
4. Checks, merge origin/integration/0.3.3 once, the last runs (fix/ and check/), the green line.

## Progress
- 2026-11-12T23:07Z: plan written; base reproduced red under load (sp35, 16x throttled: E1 and A1 "ripples: 1 -> 0").
- 2026-11-12T23:34Z: code pushed (9a8676de): sp35's waits, lib.mjs's shared wait, macOS 5 jobs, the upload's second try, the step's name; the load proof and CI running.
