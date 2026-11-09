# TC1 0.3.3: the type-checking pilot (B-396, D-1108-13)

## Summary
- **Approval:** D-1108-13 (8 Nov, "yes queue the type checking pilot after 0.3.2"); 0.3.2 shipped 9 Nov; tonight's mix D-1109-09.
- **Base:** `feat/0.3.3-tc1` from `origin/integration/0.3.3` (d8551081). Push only it; no merge, no PR.
- **Scope:** `mcp/lib/model.mjs` (comments only), mcp/package.json + package-lock.json (typescript devDependency, exact pin),
  new `mcp/tsconfig.tc1.json` (checks that one file), one step in tests.yml (mcp job, Linux), this note.
- **Expected checks:** comment-stripped model.mjs byte-identical to the base's; `npm pack` file list before/after identical
  (1325 files before); `npx tsc -p tsconfig.tc1.json` exits 0 after; area runs (model, core) PASS; lint 0; CI green.
- **Resume:** plan committed; next: JSDoc on model.mjs, typescript dev pin, tsconfig, CI step, report.

## Plan and numbers (measured 2026-11-09)
Busiest module: count of distinct mcp/lib and mcp/tools files importing each mcp/lib file (112 files scanned):
1. lib/model.mjs 45; 2. lib/read-report.mjs 31; 3. lib/files.mjs 15; 4. lib/plain-words.mjs 14; 5. lib/plans.mjs 12
(agent-text, path-rules, tool-answer also 12). Pilot: lib/model.mjs (435 lines).
Checker: typescript 7.0.2 (npm latest; published 2026-07-08, over 4 months old). Run: `npx tsc -p tsconfig.tc1.json`.
