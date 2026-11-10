## Summary
- **Approval:** the owner, 10 Nov: "start a session using it to tackle our toughest challenge with dataarcus" (relayed by the hub;
  the builder chooses the challenge with evidence, designs the answer, builds stage 1; never merges).
- **Base:** `feat/0.3.3-fb1` from `origin/integration/0.3.3` at 31f35e4a. Push only this branch; never merge, no PR.
- **Scope:** phase 1, the 3 toughest open problems ranked from the notes, one chosen; phase 2, the root cause as measured
  through the MCP tools on made-up models, the designs, the stages and their measures; phase 3, stage 1 built: a page-fill
  measure in the shared library (how much of a planned page is left empty, how squat its charts are), a suite that pins
  today's numbers on made-up models, and a first improvement the measure proves. Later stages: written plans only.
- **Expected checks:** a new suite (name and counts in "Plan" below, before the code), red on the base first; the report
  and core areas unchanged except the recordings listed under "Changed on purpose"; `node scripts/check-modules.mjs
  --strict`, `node scripts/test-contracts.mjs`, lint 0; CI green on the branch.
- **Resume:** phase 1 and 2 are being written (started 2026-11-10T16:41Z); nothing built yet.
