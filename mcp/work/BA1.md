## Summary
- **Approval:** the owner, 9 Nov, D-1109-10 ("B"): weekly bot PRs that change only the 3 data files merge themselves once CI is green; all else stays his click.
- **Base:** `fix/0.3.3-ba1` from `origin/integration/0.3.3` (f3c1b7e1).
- **Scope:** `scripts/bot-pr-files.mjs` (the one allowed list + check), `scripts/test-bot-pr-files.mjs`, the PR step of `update-powerbi-prices.yml` and `check-exam-outlines.yml`, a tests.yml step, one line in MODULES.md. No data file, no ruleset, no token change.
- **Expected checks:** `PASS  bot-pr-files  <N> checks` (N measured and written below); the workflow test reads both YAML files; lint 0; `check-modules`, `check-agent-memory` PASS.
- **Resume:** step list below; each step is marked done when committed.

## Plan
1. The script: `classify(paths)` returns `{verdict:'auto'}` or `{verdict:'owner', path}`; CLI reads `git diff --name-only origin/main...HEAD`, prints `auto` or `owner <path>`. Exact match only (no trim of case, slashes, `..`).
2. The suite (red first on the missing script): only-json auto; page, sitemap, empty, lookalikes owner.
3. Both workflows call the script right after `gh pr create`; `gh pr merge --auto --squash` only on auto; body says why.
4. A suite proving order, one list, `--auto` only.

## Result (2026-11-09T20:02Z)
- red on f3c1b7e1 first: the suite with no script and the old YAMLs failed (script missing; 15 workflow checks FAIL on the old YAML); green after: `PASS  bot-pr-files  48 checks` (read from the run's output).
- Before -> after: the bot PR step opened the PR and waited for the owner; now `gh pr diff "$BRANCH" --name-only` feeds `scripts/bot-pr-files.mjs`; on `auto`: `gh pr merge --auto --squash` and the body says so; on `owner <path>` the body names the path. tests.yml dispatch kept. `check-modules` 1200, `check-agent-memory` 464 PASS, lint exit 0 (first read was tail's exit code; rerun after npm ci: 0). actionlint is not in the repo (YAML parsed with python yaml).
- tests.yml gets one step for the suite (a website-side repo check, like test-powerbi-prices).

## CHANGELOG line
none (CI and bots only, no product change).

## Decisions I made
- The diff comes from `gh pr diff --name-only` (the exam workflow checks out depth 1, so `git diff origin/main...HEAD` has no base); the script reads stdin, so `git diff --name-only origin/main...HEAD` works too.
- `gh pr merge --auto` failing (e.g. auto-merge off) only warns, so the tests.yml and privacy.yml dispatch still runs.
- The PR body is set with `gh pr edit` after the verdict; same token, no wider permission.
- mcp/WORK.md line skipped (at its cap).

## For the owner
The first auto-merge is expected Monday 16 Nov after 09:00 Dubai; a bot PR that changes a page (or sitemap.xml) still waits for his click.

## Risky changes
Network/process: the two bot workflows may now enable auto-merge on their own PR. Guard: only when every changed path is one of the 3 data files; `--auto` waits for the required checks; no token or permission change.

## For the laptop
none.

## How the hub verifies on Monday 16 Nov
Runs "Update Power BI prices" and "Check exam skills outlines" (05:00 and 05:15 UTC). If a data file changed: step "Propose ..." log shows `gh pr merge --auto --squash`, the PR body ends "Merges itself when CI is green ... D-1109-10", the PR shows "Auto-merge enabled", and it squashes once website, mcp, scan and mcp-windows pass. If no change: "No changes". A PR that touches a page shows "Waits for the owner: <path>" and no auto-merge.

## Seen, not in scope
- Auto-merge on a PR whose checks were dispatched via workflow_dispatch depends on those runs attaching to the PR head; first real Monday proves it.

## Lessons for the reviewer
none.

CI green: https://github.com/Antnioo/DataArcus/actions/runs/42689156655 on fca631cc01a9b242d1b437d45500803d9dca8278 (2026-11-09T20:37Z)
