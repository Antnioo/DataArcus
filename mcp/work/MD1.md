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
- **Got (named 89 of 157 -> 157 of 157):** commits 07f7e47 (plan), e20d663 (facts), 0c51303 (map), 8bde588
  (pointers), de91c78 (check), 463e102 (the route). `PASS  modules  835 checks (157 module files, 157 rows)`, the same
  with `--strict` (every caller named really loads its file; every pure cell matches the code); `PASS  test-modules
  11 checks` (red: a module with no row, a row whose file is gone, two rows, an unknown caller, a missing page, no
  folder, no section, 4 cells, a bad pure cell, two strict-only misses; green on the repo; the command's PASS and FAIL
  lines); agent-memory 253, ARCHITECTURE.md 5020 of 5200 characters; lint 0. Integration did not move (no merge).
- **Resume:** CI on the branch, then the reviewer's merge.

## The table's shape and why
- Eleven tables under `## Every module`, one per part (the engines, with bold group rows: reader, writer, design,
  health, calendar, rules, right to left, SVG; the pages' own scripts; the MCP by area; the tools). Each table's first
  line `In \`<folder>/\`.` names its folder, so the file cell is the bare file name (short rows) and the check still
  knows the path. Five cells: `file | job | in -> out | used by | pure`; no line counts, no line numbers (D-1016-01).
- "used by" names files in backticks (a module, `server.mjs`, a page's path); plain words ("every page", "every
  tool") are not checked. Tests are left out (the facts script counts them apart).
- "pure": yes, or no and what the file itself touches (from the facts); a pure module may call one that is not.

## Decisions I made
- The MCP's areas as the brief named them, with one more, "create_report and its options" (report-run, report-*,
  the option modules: 23 files that "tool helpers" would have hidden), and "what leaves the server" and "tool
  helpers" in one table (7 files).
- The check is existence only in CI (the brief's four checks plus shape); `--strict` (callers really load the file,
  pure matches the code) is a manual review, not a CI gate, so a split moving an import does not go red (D-1104-06).
  The table passes it today.
- `modules-facts.mjs` reads with a small lexer (comments out, strings blanked, templates' `${}` and regexes skipped);
  an engine with module.exports is required in Node for its keys (the engines are side-effect free there). Known
  limit: a page script's local variable named `root` reads as a global write (model-health.js, dp600-sim.js); their
  pure cell is no either way.
- MODULES.md's "The parts" keeps one entry file per area and links the area's table; "Where to start reading" keeps
  its starting files and links the rest; a row was added there and in ARCHITECTURE.md's routes (f) for a new module.

## For the owner
none

## Risky changes
none

## Seen, not in scope
- `assets/js/calendar-generator.js:236`: the engine and its page's script in one file (the only engine with DOM
  code; the MCP requires it, the page part is guarded by `typeof document`). A split would make the engine pure.
- `mcp/lib/box-diff.mjs:1`, `mcp/lib/shadow-model.mjs:1`: research code ("not loaded by the server") among the
  shipped lib modules; worth a look whether packaging stages them, or a move to `mcp/research/`.
- Import cycles: `mcp/lib/check-language.mjs:7` <-> `check-report.mjs:26` (said in its header), and
  `mcp/lib/model-script.mjs:7` <-> `gulf-calendar.mjs:10` (not said); both work today through ESM live bindings.

## Lessons for the reviewer
- After a split's merge, `node scripts/modules-facts.mjs` gives the new file's facts and `node scripts/check-modules.mjs
  --strict` says which rows' callers moved; CI only asks that every file has its row.
