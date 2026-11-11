# SN1 (0.3.3): close the safe, small "Seen, not in scope" items

## Summary
- **Approval:** the owner D-1111-17 (11 Nov): "go you have all night to finish everything we got so far also don't overlook the seen not in scope"; the reviewer hub's brief SN1.
- **Base:** `feat/0.3.3-sn1` from `origin/integration/0.3.3` at 2960587c. Pushed only this branch; never merged, no PR.
- **Scope:** `mcp/tests.json`, `mcp/run-tests.mjs` (the duplicate-key check), `.github/workflows/tests.yml`, `scripts/tests/run-all.mjs`, `mcp/lib/report-inputs.mjs`, plan_layout's text, the docs item 5 lists, `.claude/settings.json` and `scripts/agent-stop-check.mjs` if item 6 needs it, the MICROSOFT-WATCH file, their tests, `mcp/WORK.md`, this note.
- **Expected checks:** `node scripts/check-modules.mjs --strict`; each touched area's run; `npm run lint` 0; tk1 size (cap 61,000) before and after; then CI on the branch.
- **Resume:** the state is the last line of this note.

## Plan
Seven items, each its own commit, red first where code: 1 tests.json duplicates + base (test in scripts/test-result-lines.mjs through registryProblems);
2 website shards: install --with-deps only when needed (measure per shard first); 3 run-all.mjs one line per suite;
4 report-inputs text and planFields text, tools/list not larger; 5 laptop-flow docs; 6 Stop hook cause; 7 the watch line.
- State at 2026-11-11T17:47Z: plan written, pushed.
