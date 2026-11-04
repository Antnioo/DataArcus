# MD1 (0.3.2): mcp/docs/MODULES.md, the whole map of every module, and the check that keeps it true

## Summary
- **Approval:** the reviewer's brief "MD1" (4 Nov); the owner D-1104-08 (MODULES.md, the highest priority: the
  complete, true map), D-1016-01 (one place per fact; nothing that goes stale by itself: no line counts or numbers),
  D-1104-06 (the split runs today: the map and its check make the next module easy, never block it).
- **Base:** `feat/0.3.2-md1` from `origin/integration/0.3.2` at 2f02348. Pushed only this branch; never merged, no PR.
- **Scope:** docs and repo scripts only: `mcp/docs/MODULES.md`, new `scripts/modules-facts.mjs`,
  `scripts/check-modules.mjs`, `scripts/test-modules.mjs`, one step in `.github/workflows/tests.yml`, one line in
  `ARCHITECTURE.md`, this note, one line in `mcp/WORK.md`. No code moves, no behaviour change, no engine touched.
- **Plan, one commit each:** (1) `scripts/modules-facts.mjs`: every module file (assets/js/*.js without .min.js,
  mcp/lib/*.mjs, mcp/tools/*.mjs), read from the code: exports (or the global set: window.X / self.X / root.X),
  imports and requires, DOM / file system / network / worker use, and who loads it (HTML script tags, importScripts,
  require/import from modules, server.mjs and tools); a table, the evidence for every row. (2) `## Every module` in
  MODULES.md: one table per part, one row per file: `file | job | in -> out | used by | pure`. (3) "The parts" and
  "Where to start reading": file lists the table holds become pointers to it; stale facts fixed from the code.
  (4) `scripts/check-modules.mjs` + `scripts/test-modules.mjs` (red on a missing row, a row whose file is gone, a file
  with two rows, an unknown "used by" name), one CI step beside the startup pack. (5) one route line in ARCHITECTURE.md.
- **Measured before:** 157 module files (assets/js 64, mcp/lib 82, mcp/tools 11: `scripts/modules-facts.mjs`);
  MODULES.md names 89 of them, 68 not named (the brief's count).
- **Expected checks:** check-modules: 157 files (more if integration adds modules before the merge), each one row;
  `PASS  modules  <N> checks` with N = files + rows + used-by names checked. test-modules: 4 red proofs + the real
  file green, `PASS  test-modules  <N> checks`. Unchanged: agent-memory (its caps kept), result-lines, lint 0.
- **Resume:** step 2 (the map).

## Decisions I made
- (filled as the work goes)

## For the owner
none

## Risky changes
none

## Seen, not in scope
- (filled as the work goes)

## Lessons for the reviewer
- (filled at the end)
