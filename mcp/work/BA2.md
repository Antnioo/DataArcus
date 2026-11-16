STOP: the code is done and green locally (232 checks, gate PASS), but git push to Antnioo/DataArcus is refused by the git proxy (403, repository not in this session's authorized set); the brief says never ask to attach it and the owner's add_repo permission names reviewer worker sessions, so I did not call add_repo; no push, no CI run, no PR (2026-11-16T15:01Z). The hub decides.

## Summary
- **Approval:** the owner, 16 Nov, D-1116-06 ("i wanna grant an option to automatically approve the checks for both weekly price and exam checks"); replaces D-1109-10.
- **Base:** `feat/ba2` from `origin/main` (cbab5f96).
- **Scope:** `scripts/bot-pr-files.mjs` (a list per bot, the price content guard), `scripts/test-bot-pr-files.mjs`, the check call in `update-powerbi-prices.yml` and `check-exam-outlines.yml`, `mcp/docs/MODULES.md`, `mcp/work/BA1.md`. No data file, no ruleset, no token change.
- **Expected checks:** `PASS  bot-pr-files  <N> checks` (N written below); `node scripts/check-modules.mjs --strict` PASS; lint exit 0; `check-agent-memory` PASS.
- **Resume:** step list below; each step is marked done when committed.

## Plan
1. `classify(paths, bot)`: one list per bot (`prices`: price file + the 7 generated files; `outlines`: the 2 outline files); exact match, no wildcard; the other bot's file and look-alikes answer `owner <path>`; the CLI takes the bot's name (no name: usage error, exit 2).
2. The content guard for `prices`: when a generated file is in the PR, a temporary tree of the base gets the head's price file, `syncChecked` and `build:min` run (what the workflow runs), the 6 files must equal the head's byte for byte; `sitemap.xml` may differ only in `<lastmod>` dates; a guard that fails to run answers `owner`.
3. Both workflows call it with their bot name; the price one with `--base origin/main --head HEAD`.
4. Tests (red on cbab5f96 first): lists, look-alikes, cross-bot refusal, a made-up price PR in a temp clone (auto), one extra word in each generated file (owner), the sitemap rule, the CLI, the workflow assertions.

## Result (2026-11-16T14:59Z)
- red on cbab5f96 first: the new suite crashed on the old script (`ALLOWED.prices is not iterable`); green after: see the line at the end of this note.
- PR #130 (16 Nov, head 033ee6b6, 8 files): before `owner ar/tools/power-bi-licensing-cost-calculator.html`; after `auto`; the same PR with one extra word in tools/power-bi-licensing-cost-calculator.html: `owner tools/power-bi-licensing-cost-calculator.html`.

## CHANGELOG line
none (CI and bots only, no product change).

## Decisions I made
- The guard re-runs the generator in a temporary git worktree of the base (so the base's own scripts run), never in the PR's tree: a PR cannot change the code that judges it (and any script change is `owner` by the list anyway).
- A PR with no generated file and no sitemap needs no regeneration (the price file alone is the old rule, the required checks catch stale pages).
- No `--base`/`--head` default risk: the price guard is always on, defaults `origin/main` and `HEAD`.
- `build:min` also rewrites `?v=` stamps on other pages that load the calculator's min.js; the workflow only adds the 7 files, so those stay uncommitted (as before this job). Not changed here.

## For the owner
none.

## For the reviewer
The repository ruleset is not in this job. #131 (exam outlines) stays blocked until the owner turns off "Require approval of the most recent reviewable push / extra approval for unattributed changes" on GitHub.

## Risky changes
Process: the price workflow may now enable auto-merge on a PR that touches the calculator pages and sitemap.xml. Guard: every path is on the price bot's list, the generated files equal a fresh regeneration byte for byte, sitemap.xml differs only in lastmod dates, `--auto` waits for the required checks; no token or permission change.

## For the laptop
none.

## Seen, not in scope
- The price workflow leaves other pages' `?v=` stamps (from `build:min`) uncommitted | route: backlog | size: S | why: only matters if another page loads the calculator's min.js; stamps check in CI would show it.

## Lessons for the reviewer
none.
