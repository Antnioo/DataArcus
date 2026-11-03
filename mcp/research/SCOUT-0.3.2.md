# SC1 (0.3.2 scout): the 9 best R&D topics for tonight, each with a ready brief

## Summary
- **Approval:** the owner, D-1103-12 (3 Nov night): "Go for 10 r&ds during the night create an agent that gets
  familiar with our code and choose the best r&ds ideas that will best fit our code and make us shine"; D-1103-11:
  "push more tokens to make sure we are building the best schematic". This note is that agent's report.
- **Scope:** docs only: this file (and scratch scripts under `mcp/research/scout/` if something is measured). No
  product file changes. Not RD1's topics (B-275, B-277, B-278, B-246, B-304).
- **Base:** `rd/0.3.2-scout` from `origin/integration/0.3.2`. Push only it; no merge, no PR.
- **Expected checks:** none run by a product suite (no product file changes); `node scripts/check-agent-memory.mjs`
  untouched (this file is not a capped memory file).
- **Resume:** the plan below; then the map, the pool, the scores, RD2-RD10, the table.

## The plan
1. Learn the code (MODULES, README, tools, lib engines, assets/js, tests.json, recent notes' "Seen", research/).
2. Write the map of the product as it is (strong and weak, file:line).
3. Judge the candidate pool against the code: drop what exists (say where), score the rest 1-5 on fit, shine,
   safety, size, risk.
4. Pick 9, write RD2-RD10 briefs (under 35 lines each), the summary table and the dropped list.
