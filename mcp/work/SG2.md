# SG2 (0.3.3): the split guards read their allowed pure shared files from CONTRACTS.md (L-1104-19)

## Summary
- **Approval:** the owner D-1105-08 (5 Nov), brief SG2 built from D-1110-03; D-1104-12 (one job, one place).
- **Base:** `fix/0.3.3-sg2` from `origin/integration/0.3.3` at e01832dc. Push only this branch.
- **Scope:** one test helper `mcp/ledger-places.mjs` (reads the ledger's "One place" column); sp10 P10, sp42 P2, sp30 K2 accept any ledger file besides what each allows now. Tests and helper only; no product code, no page text.
- **Expected checks:** sp10, sp30, sp42 pass unchanged in count; red proofs below (planted file off the list fails, on the list passes, row removed fails); check-modules --strict, lint, test-contracts, check-agent-memory PASS; area twin and model; CI green.
- **Resume:** 2026-11-10T05:43Z: plan written, helper and guards next.

## Plan
1. Helper parses the ledger table rows ending in "one place since X: `assets/js/f.js` `name`" (14 files today).
2. Each guard keeps its present allowance and adds that set. sp30 K2 still needs the three present requires.
3. Red proofs by planting a require in the module, running the guard, reverting; same with a CONTRACTS.md row removed.
