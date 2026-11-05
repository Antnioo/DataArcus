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
- **State:** steps 1-4 done. integration/0.3.2 did not move (no merge); build:min: nothing to change. Local: MCP 205
  of 205 (5 shards side by side; mutation 76/76; dd2c 48), site 42 of 42, lint 0. CI: below.
- **Resume:** none; the reviewer reads and merges.

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

## Copies before -> after (2 -> 1)
| place | before | after |
|---|---|---|
| `mcp/lib/artifact.mjs` `canon` | its own line | `import { canon } from './canon.mjs'` (modelPrintOf, bindingOf) |
| `mcp/lib/plans.mjs` `canon` | the same line | `import { canon } from './canon.mjs'` (shown, saidOf, differences: inputDifferences, the gate) |
| `mcp/lib/canon.mjs` `canon` | none | the one place |
Answers before and after: the same on every input (the table above); the probe's family canon: 1 place, 0 of 10 differ.

## Decisions I made
- canon.mjs is MCP only (no browser place has it): an ES module of one export, the shape of small-cache.mjs.
- The probe's family canon and the ledger's place table moved in step 2 (the copies went there, so check-contracts
  would fail otherwise); step 4 is the ledger's prose (One place, the test, Since DD2C).
- MODULES.md: the row sits in "the approval gate" (the security path); its "used by" was "none (a test)" in step 1,
  as check-modules --strict reads callers from the code.
- tests.json: dd2c in area "safety" (beside j14), placed before dd2d.
- The parity test reads the old copy as the one line `const canon = ` of each file at the base (DD2C_BASE to name
  another revision), not the probe's source reader: one line, nothing it names.
- WORK.md: two family names shortened ("nearest", "sort-col") to stay under 3,200 characters.

## For the owner
none

## Risky changes
none: the security path's text is one line moved, every digest pinned byte for byte against the base and by both
old copies; the gate's mutants still all killed (76/76).

## Seen, not in scope
- My step 4 commit went 7 characters over WORK.md's cap: `check-agent-memory | tail -1` hid the exit code (a
  pipe before a commit); the next commit fixed it. WORK.md's list line is near its cap: the next DD job will need to
  fold it (for example "DD1A-DD2C").
- A local `npm test` run while the 5 MCP shards ran: the 5 site suites still open when my time limit stopped the run
  failed with "browser has been closed"; run again alone, all 5 passed (sp31-sp36).
- mcp/lib/redesign.mjs has its own local `canon` (a patch list's text, another question): not this family.

## Lessons for the reviewer
- A family whose places are a lib's private names: the probe's place moves to the new module in the same commit as
  the import (check-contracts reads the definitions).
- A parity test of a lib's private line can read just that line from `git show <base>:<file>`; a `git mktree` tree
  with one copy changed makes the red proof of an old copy without a commit.
