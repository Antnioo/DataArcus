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
