## Summary
- **Approval:** the brief "DD2C (0.3.2)" (5 Nov); the owner D-1104-12 (one library, fix at the source), D-1104-18
  (keep building it), D-1104-15 (the families he did not decide are the reviewer's call, as CONTRACTS.md proposes),
  D-1016-01 (never 100 places).
- **Base:** `feat/0.3.2-dd2c` from `origin/integration/0.3.2` at 128285e. Push only this branch; never merge, no PR.
- **Scope:** CONTRACTS.md family canon, "what is the canonical text of a plan?" (JSON, keys sorted, undefined left
  out): the security path (the binding of a plan to its click, the gate's comparison of a write's inputs with the
  plan's pins). One MCP module `mcp/lib/canon.mjs` exporting `canon`, the same line as today. NO answer changes.
  Not in this job: sha, the plan store, the approval window, any other family.
- **Copies (2 -> 1):** `mcp/lib/artifact.mjs` `canon` (modelPrintOf, bindingOf) and `mcp/lib/plans.mjs` `canon`
  (shown, saidOf, differences: inputDifferences and the gate) import it; their copies go; every exported name stays.
- **Steps (one commit each):** 1 canon.mjs, its MODULES.md row and the unit test dd2c (tests.json beside the dd
  tests); 2 artifact.mjs and plans.mjs import it (the probe's family canon and the ledger's place table move with
  it, so check-contracts stays green); 3 the parity test (both old copies read from the base 128285e's source,
  beside the module: one answer per input); 4 CONTRACTS.md "One place", who reads it.
- **Expected checks:** dd2c passes (the probe's 10 values and more, pinned; the base's digests pinned byte for byte;
  parity); check-contracts and check-modules --strict green at every step; lint 0; every other suite's number
  unchanged (r4a, j14-exact, the twin artifact: no expected answer moves); mutation 76/76; the probe's canon table:
  1 place, 0 of 10 differ (was 2 places, equal); samejob.py is the reviewer's (not in this repo): its same-shape
  groups go DOWN by one, not countable here.
- **State:** step 4 done (CONTRACTS.md One place; WORK.md line). Next: the full run and CI.
- **Resume:** merge integration once if it moved, build:min, every check, CI.

## The answers (before, measured on the base 128285e; after: the same, pinned in dd2c)
The probe's 10 values, canon(v): `{"a":2,"b":1}`, `{"b":1}`, `null` (undefined at the top), `null`, `[3,1,2]`,
`[1,null]`, `{"z":{"x":[{"a":0,"b":1}],"y":1}}`, `{"n":null,"z":0}`, `{"أ":2,"ب":1}`, `{"d":"1970-01-01T00:00:00.000Z"}`.

Made-up plans (dd2c's inputs B1-B3, M1-M4, D1-D3), the base's digests:
| id | call | base |
|---|---|---|
| B1 | bindingOf(64 zeros, { slots: [card Sales[Amount]], theme: dark, x: undefined }, 'print-1') | 2abd90d8094efad9b652a24798edf89146d92c73e9c4dd56b4d4fd896d758168 |
| B2 | bindingOf('ab' x 32, { pages: 2, lang: ar, title: المبيعات }, modelPrintOf(a Sales model)) | bdc64fbc4629f239d0a20c47ebcace81745c876beb778806eacbc4e76fda7e90 |
| B3 | bindingOf(64 zeros, undefined, undefined) | abddc6b08f6a8b36c5b112fddbbd55f18f296780ff019885c20fadb88301fefa |
| M1 | modelPrintOf({ tmsl: a Sales model, culture en-US }) | c37e54d5bd9c331738143f8a6504122748ea34eada5562adf7187549981fa466 |
| M2 | modelPrintOf(M1's model, keys in another order) | the same as M1 |
| M3 | modelPrintOf(null) | 74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b |
| M4 | modelPrintOf({ print: 'kept' }) | `kept` |
| D1 | inputDifferences (slicers and theme differ) | the two sentences, pinned in dd2c |
| D2 | inputDifferences (files.b differs, kpis.y undefined both sides) | `["files (b)"]` |
| D3 | inputDifferences (the same object, keys in another order) | `[]` |

## The red proof (not committed)
1. The one copy: `Object.keys(x).sort().filter` made `Object.keys(x).filter` in mcp/lib/canon.mjs, then
   `node test-0.3.2-dd2c.mjs`: FAIL 31 of 48 (C1, C7, C9, C12, C13 pinned; P1, P7, P9, P12, P13 parity; B1, B2, M1, M2,
   D1 digests; Q1-Q3). Restored: PASS 48.
2. An old copy: a tree object made with `git mktree` (no commit, no branch) holding the base with plans.mjs's sort()
   taken out, passed as `DD2C_BASE=<tree>`: FAIL 40 of 48 (P1, P7, P9, P12, P13, Q1-Q3: plans.mjs (base) alone differs).
