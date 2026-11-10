# DB2 (0.3.3): a plan with no report name asks for one (A-DB1-2)

## Summary
- **Approval:** the owner, 10 Nov, D-1110-05 "1 yes yes yes, 2 yes, 3 yes, 5 yes": A-DB1-2 yes (DB1.md, B5 and "For the owner" 1). D-1109-07 and D-1027-03/04 bind any Arabic text.
- **Base:** `fix/0.3.3-db2` from `origin/integration/0.3.3` at cd4ea0c0. Push only this branch; never merge, no PR.
- **Scope:** `mcp/tools/plan_layout.mjs` (limitsStep: one planProblem line), new `mcp/test-0.3.3-db2.mjs` + its row in `mcp/tests.json`, `mcp/CHANGELOG.md`, `mcp/WORK.md`, this note; plus any test that pins the old answer, each named under "Changed on purpose".
- **Expected checks:** `node scripts/check-modules.mjs --strict`; db2 new, red on cd4ea0c0 first; the report, core, checker and arabic areas green; lint 0; CI green.
- **Plan:** measured on cd4ea0c0 (below): a plan with path, no name gets an id, approve_plan approves it, create_report refuses ("Give create_report a name"). Fix: in limitsStep a planProblem when path is given, no name, and no customVisualsFrom (a native copy needs no name; redesignFrom returns before limitsStep). English sentence, no Arabic text added.
- **Resume:** 2026-11-10T12:18Z: note written; measuring done; next the fix and db2.

## Measured on cd4ea0c0 (test server, made-up tiny model, 2026-11-10T12:18Z)
- plan_layout { path: tiny, layout: exec } (en): plan id given, status proposed, exactCheck "notBuilt", no planProblems.
- approve_plan on it: approved (approvedBy user-in-browser), allows create_report, writes "the report \"<name>.Report\"".
- create_report { path, planId }: error "Give create_report a name for the new report (Report name)."
- Same with lang ar: the same three answers (plan id, approved, refused).
