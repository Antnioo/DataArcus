# SG2 (0.3.3): the split guards read their allowed pure shared files from CONTRACTS.md (L-1104-19)

## Summary
- **Approval:** the owner D-1105-08 (5 Nov), brief SG2 built from D-1110-03; D-1104-12 (one job, one place).
- **Base:** `fix/0.3.3-sg2` from `origin/integration/0.3.3` at e01832dc. Push only this branch.
- **Scope:** one test helper `mcp/ledger-places.mjs` (reads the ledger's "One place" column); sp10 P10, sp42 P2, sp30 K2 accept any ledger file besides what each allows now. Tests and helper only; no product code, no page text.
- **Expected checks:** sp10, sp30, sp42 pass unchanged in count; red proofs below (planted file off the list fails, on the list passes, row removed fails); check-modules --strict, lint, test-contracts, check-agent-memory PASS; area twin and model; CI green.
- **Resume:** 2026-11-10T05:50Z: built, area runs pass; CI run next (state in the CI line below).

## Plan
1. Helper parses the ledger table rows ending in "one place since X: `assets/js/f.js` `name`" (14 files today).
2. Each guard keeps its present allowance and adds that set. sp30 K2 still needs the three present requires.
3. Red proofs by planting a require in the module, running the guard, reverting; same with a CONTRACTS.md row removed.

## Before -> after
- sp10 P10: PURE_SHARED was 3 typed names; now those 3 plus every `assets/js` file the ledger names (14 today). sp30 K2: the exact 3-require join; now the 3 must all be there and any other require must be a ledger file. sp42 P2: the exact 4-import list; now those 4 must be there and any other import must be a ledger file (`../../assets/js/x.js`). Purity, no file/DOM/network, load order, Interface line: untouched.
- Helper: `mcp/ledger-places.mjs` `pureSharedFiles()` reads the ledger table's last column ("one place since X: `assets/js/f.js`"), plus `asSibling` and `fromLib` spellings. Not a test file, no new MODULES.md row (outside assets/js, mcp/lib, mcp/tools).
- Counts: sp10 113 -> 113, sp30 21 -> 21, sp42 22 -> 22 (`node mcp/test-0.3.2-spN.mjs`, PASS lines). Areas twin (53 suites) and model (31 suites) pass; lint 0; test-contracts 14; check-agent-memory, result-lines, changelog-words PASS.

## Red proofs (planted line appended to the module, guard run, `git checkout` after)
| guard | plant axis-units.js (not on the list) | plant png-bytes.js (on the list) | png-bytes planted, its ledger row removed |
|---|---|---|---|
| sp10 P10 (mirror-policy.js) | FAIL 1 of 113 | PASS 113 | FAIL 1 of 113 |
| sp30 K2 (field-catalog.js) | FAIL K2 | PASS 21 | FAIL K2 |
| sp42 P2 (lib/model-discovery.mjs) | FAIL P2 | PASS 22 | FAIL P2 |
The old code (exact lists) also failed on png-bytes, so the "on the list passes" column is the new behaviour; the off-list and row-removed columns are the kept protection. Note: on the base, the "on the list" plant is red; red on e01832dc first.

## Changed on purpose
- `mcp/docs/MODULES.md` rows pbir-values.js and page-toast.js: `check-modules --strict` was already red on the base (e01832dc, two rows from SG1 named callers the code does not require: report-inventory.mjs, licensing-calculator.js). Fixed in the docs only (names written without backticks with the way they really reach it), since it is an expected check. Rows that change: those two.
- mcp/WORK.md line 10 gets SG2.

## CHANGELOG line
none (tests and docs only).

## Decisions I made
- Helper beside the tests as `mcp/ledger-places.mjs`, not under mcp/lib (no product code).
- Only table rows that say "one place since" count; the per-family sections are not read.
- `npm ci` in mcp/ and the root was needed in the clean clone (not committed).

## For the owner
none

## Risky changes
none (a guard now also accepts ledger files; a file off the ledger still fails, proven above).

## For the laptop
none

## Seen, not in scope
- arabic-script.js and model-nearest.js are not in the ledger table's One place column (they are allowed by the guards' own lists), so a guard that wants them needs a ledger row.

## Lessons for the reviewer
- check-modules --strict was red on the integration base after SG1; SG1's note said it passed.
