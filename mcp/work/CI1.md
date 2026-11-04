## Summary
- **Approval:** the owner's brief "CI1" (4 Nov); D-1104-02 ("lesson 13 approve": macOS runs only on check/*,
  integration and main; builder branches run Linux and Windows); D-1102-02 (CI on the branch is the gate). Earlier:
  L-1103-13 (VC1's macOS shard dropped unqueued three times, SP11's once, about 3 hours of reruns).
- **Base:** `fix/0.3.2-ci1` from `origin/integration/0.3.2` at 1691046. Push only this branch (and
  `check/0.3.2-ci1` for the one proof run); never merge, no PR.
- **Scope:** `.github/workflows/tests.yml` only: `mcp-macos-parts` and `mcp-macos` get one condition (below); the
  `on:` block, Linux and Windows jobs unchanged. There is no website macOS job. Plus this note, one WORK.md line,
  one CHANGELOG line. No product file, no test file.
- **Expected checks:** step 1, the claim: every tests.yml run since 20 Oct whose only failing jobs were macOS with a
  real FAIL line, in a table; expected 0 that Windows or Linux did not also catch. Step 3: the YAML parses
  (actionlint if present, else a parse and a check script in the scratchpad), the 4 kinds of ref read dry
  (builder: no macOS; check/*, integration/*, main: macOS runs); `gh workflow run tests.yml --ref fix/0.3.2-ci1`:
  macOS jobs skipped, website, mcp, mcp-windows green; `--ref check/0.3.2-ci1`: macOS runs, 5 shards plus the
  summary. `npm run lint` 0; `scripts/test-results-adapter.mjs` (reads tests.yml's job names and `on:`) unchanged
  number, green; `scripts/check-agent-memory.mjs` green.
- **Got:** (filled after the runs)
- **State:** planned.
- **Resume:** step 1 (the table), then the workflow edit, then the two runs.

## The plan
1. The claim (gh api: runs since 2026-10-20, their jobs, the macOS jobs' logs for a FAIL line).
2. The condition on `mcp-macos-parts`, and `always() && (the same)` on `mcp-macos`:
   push to main or integration/*; pull_request whose base is main; workflow_dispatch on main, integration/* or check/*.
3. Parse, dry reading, the two runs. 4. The note, WORK.md, CHANGELOG, lint, merge in once if moved, CI.
