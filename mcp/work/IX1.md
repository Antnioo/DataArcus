## Summary
- **Approval:** the owner, 11 Nov, D-1111-15: "I need two more fable sessions for new ideas that would make this mcp one of
  kind" (relayed by the hub, session_015Q77oNR7YVFznptSuZoZZ2). IX1 is the inside-out half (our own parts combined); OX1
  works outside-in. The builder finds the idea with evidence, proves a first stage, never merges.
- **Base:** `feat/0.3.3-ix1` from `origin/integration/0.3.3` at 2960587c. Push only this branch; never merge, no PR.
- **Scope:** phase 1 (this note, before any code): our unusual parts with evidence, the combinations, 5 ranked ideas, one
  winner. Phase 2: the winner's first stage as a new library module (or `lab/ix1-*`) with tests red first, its tests.json
  line, its MODULES.md row, one demo on made-up models, the plan for stages 2 to 4, the owner's asks. Nothing a tool
  writes or answers changes. Out: OX1's files, `mcp/CHANGELOG.md`, any edit of an existing module beyond one export line.
- **Expected checks:** `node scripts/check-modules.mjs --strict`; the new suite's own number (written in "The first stage"
  before the code); every existing suite untouched; lint 0; CI on this branch.
- **Resume:** phase 1 in progress (started 2026-11-11). Next: the parts list with file:line, then the ranking.
