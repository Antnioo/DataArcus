## Summary
- **Approval:** the reviewer's brief "CL1" (4 Nov); the owner D-1104-11 (one big check: the same answer in different
  words, family by family), D-1104-12 (one library, fixed at the source: the ledger is what it is built from),
  D-1104-08 (MODULES.md "our biggest asset": the ledger sits beside it and points to its rows), D-1016-01.
- **Base:** `feat/0.3.2-cl1` from `origin/integration/0.3.2` at 762bba0. Push only this branch; never merge, no PR.
- **Scope:** repo scripts and docs only: new `scripts/contracts-probe.mjs`, `mcp/docs/CONTRACTS.md`,
  `scripts/check-contracts.mjs`, `scripts/test-contracts.mjs`, one step in `.github/workflows/tests.yml`, one line each
  in `mcp/docs/MODULES.md` (intro) and `ARCHITECTURE.md` (route f), this note, one line in `mcp/WORK.md`. No code
  moves, no behaviour change, no engine, lib, tool or page touched (read only).
- **Plan, one commit each:** (1) the probe: every place of every family loaded in Node (an engine's or a lib's own
  inner name exposed by one line added in memory, the file never changed; a name nested inside another function, or
  a page-only one, read from its source and said so), run on the same made-up inputs (8 or more a family), one table
  a family, disagreements marked. (2) the ledger `mcp/docs/CONTRACTS.md`: the top table, one section a family, the
  "Not one question" list. (3) the check and its red proofs, one CI step beside the modules step. (4) one line each in
  MODULES.md and ARCHITECTURE.md: before a helper, look in CONTRACTS.md and MODULES.md (D-1104-12).
- **Families planned (18):** 1a time column; 1b text, number and true/false of a literal (three); 1c the frame width;
  1d a table column's set width; 1f Arabic text; the visual type families: table or matrix, slicer, bar chart;
  reading order; the plan digest canon; CRC-32; box overlap; colour contrast; XML escape; HTML escape; file decoding.
- **Expected:** 18 families (12-20), about 80 places, each family 8 or more inputs; most of the 1-group families
  disagree, the Phase 2 copies (canon, CRC, decode) agree. `PASS  contracts-probe  <N> checks`,
  `PASS  contracts  <N> checks` (N = families + places + functions + inputs checked), `PASS  test-contracts  <N>
  checks` (red: a file gone, a function gone, a family with no inputs, a probe place the ledger misses). Unchanged:
  modules (`--strict` too) with three new rows, agent-memory, result-lines, lint 0.
- **Resume:** the probe (commit 2).
