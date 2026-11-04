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
- **Got:** step 1: 156 non-green tests.yml runs since 20 Oct (of 434) read, every attempt's jobs; 4 failed on macOS
  only, 2 with a real FAIL line, neither a macOS defect (the table below; For the owner). The YAML parses (actionlint
  could not be fetched here), the check script 11 of 11, 8 cases read dry. Builder run 41766393116: macOS skipped.
  results-adapter 42 checks before and after; agent-memory 226; changelog-words 89; lint 0.
- **State:** the work done; the CI lines below.
- **Resume:** the reviewer: read the two runs, then the merge.

## The plan
1. The claim (gh api: runs since 2026-10-20, their jobs, the macOS jobs' logs for a FAIL line).
2. The condition on `mcp-macos-parts`, and `always() && (the same)` on `mcp-macos`:
   push to main or integration/*; pull_request whose base is main; workflow_dispatch on main, integration/* or check/*.
3. Parse, dry reading, the two runs. 4. The note, WORK.md, CHANGELOG, lint, merge in once if moved, CI.

## Step 1: tests.yml runs since 20 Oct whose only failing jobs were macOS
Read with `gh api`: `actions/workflows/tests.yml/runs?created=>=2026-10-20` (434 runs), `runs/<id>/jobs?filter=all`
for each of the 156 not green (every attempt), a run kept when every failed shard job is `mcp-macos-parts`; each
such shard's log searched for a `FAIL` line.

| Run | Commit, ref | macOS failure | Real FAIL line | Linux / Windows on that commit |
|---|---|---|---|---|
| 40191205642 | 21d1d48, PR from integration/0.3.1 | shard 1: setup-node could not reach codeload.github.com | no (runner network) | green (the only run of it) |
| 40680831671 | bfb894e, fix/0.3.1-fx5 | shard 3: `bilingual-report` B5h, the largest answer 40000 (`< 40000`) | yes | green (the only run of it) |
| 40718543463 | f6e1e45, PR from integration/0.3.1 | shard 2: `custom-visuals-lab` CL-2, 8 warnings `PBIR_SCHEMA_UNREACHABLE` | yes | green (the only run of it) |
| 41524209043 | 8613eeb, fix/0.3.1-mx8 | shards 1 and 2 cancelled (no runner), the summary failed | no | green; the next run 41530448902 all green |

## The condition (tests.yml)
`mcp-macos-parts`:
```
if: >-
  (github.event_name == 'push' && (github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/heads/integration/')))
  || (github.event_name == 'pull_request' && github.base_ref == 'main')
  || (github.event_name == 'workflow_dispatch' && (github.ref == 'refs/heads/main'
  || startsWith(github.ref, 'refs/heads/integration/') || startsWith(github.ref, 'refs/heads/check/')))
```
`mcp-macos` (the summary that requires "every shard passed"): `if: always() && (<the same expression>)`. Where the
expression is true it is `always()` as before, and a failed, cancelled or skipped shard still fails it. On a builder
branch the expression is false, so the summary is skipped with its shards and never runs its `test ... = success`
step: macOS is not required there. A skipped job is not a failure, so the run's conclusion is decided by Linux,
Windows and the website.

Dry reading (`check-ci1.py` in the session's scratchpad: parses the YAML, checks the `on:` block and every other
job's `if` unchanged, the summary's expression is `always() && (` the shards' `)`, evaluates both):
| Ref | Event | macOS |
|---|---|---|
| fix/*, rd/* (a builder branch) | workflow_dispatch | skipped |
| check/* | workflow_dispatch | runs |
| integration/* | workflow_dispatch (or push, if one is ever added) | runs |
| main | push, workflow_dispatch | runs |
| a PR to main / to integration/* | pull_request | runs / skipped |

## The runs
- Builder: `gh workflow run tests.yml --ref fix/0.3.2-ci1` on ff8dce0:
  https://github.com/Antnioo/DataArcus/actions/runs/41766393116: `mcp-macos-parts` and `mcp-macos` skipped.
- The reviewer's kind: `check/0.3.2-ci1` pushed at ff8dce0, `gh workflow run tests.yml --ref check/0.3.2-ci1`:
  https://github.com/Antnioo/DataArcus/actions/runs/41766395768: the 5 macOS shards and the summary run.
  The reviewer's own check/* runs after this keep macOS the same way (the `check/` prefix).

## CHANGELOG line
- **The macOS tests run where changes are merged:** the full test run on macOS now runs on the main and release
  branches, on pull requests to main and on the check before each merge, no longer on every work branch; Linux and
  Windows still run everywhere, as before.

## Decisions I made
- No new `push` trigger for integration/*: the brief also says Linux and Windows unchanged everywhere, and a push
  trigger would start them on every merge (results-adapter checks the `on:` block too). The expression covers a push
  to integration/* anyway; today integration is tested by a manual run, which the expression covers.
- The summary is skipped, not passed: `always() && (...)` rather than a step that accepts "skipped", so the
  ci-sum step does not run on missing macOS logs. mcp-macos is not a required check (tests.yml's comment).
- The expression is written twice (a job's `if` cannot read the workflow's `env`); the check script asserts the two
  are the same. No gate job added (one job more on every run).
- A PR to an integration branch skips macOS (the brief: pull requests to main).
- actionlint: its download was refused in this session, so the brief's fallback (YAML parse and a check script).

## For the owner
Two macOS-only runs with a real FAIL line that Windows did not catch; neither is a macOS defect:
1. 40680831671 (fx5 branch, 28 Oct): bilingual-report B5h, an answer cut at exactly 40,000 against `< 40000`, the
   flicker HR1 describes (the texts' order varies run to run); it can land on any OS.
2. 40718543463 (PR from integration/0.3.1, 28 Oct): custom-visuals-lab CL-2, the runner could not reach Microsoft's
   PBIR schema (`PBIR_SCHEMA_UNREACHABLE`, a network warning; HR2's Seen). Under CI1 this PR still runs macOS.
So the claim holds: no macOS-specific failure since 20 Oct that Linux and Windows missed.

## Risky changes
This job runs fewer checks on builder branches. What still runs where:
- A builder's `gh workflow run --ref fix/*` (or any ref not below): website-checks, website-suites 1-3, website,
  mcp-parts 0-4, mcp, mcp-windows-parts 0-4, mcp-windows (Linux and Windows, every suite). No macOS.
- `check/*`, `integration/*` and `main` (manual), a push to main, a PR to main: all of the above plus
  mcp-macos-parts 0-4 and mcp-macos. So the reviewer's check/* run is still the full gate on three OSes; a
  macOS-only break shows there first, not on the builder's run.

## Seen, not in scope
- B5h's `< 40000` against a cut at exactly 40,000 still can flicker on any OS (HR1).
- custom-visuals-lab CL-2 counts the validator's network warning as a warning (HR2's Seen).
- `npm run lint` needs a fresh `npm ci` in a new session (`globals` missing before it).
- `--paginate` on the runs list fails through this session's proxy (numeric-id paths): page by hand.

## For the laptop
none

## Lessons for the reviewer
- A check/* run is now the only place macOS runs before a merge: read its macOS lines, not the builder's.
- To list runs and jobs here: `actions/workflows/tests.yml/runs?page=N` and `runs/<id>/jobs?filter=all` (every attempt).
