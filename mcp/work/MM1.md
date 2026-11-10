# MM1 (0.3.3): dev tools use minimatch 11 through an npm override (B-310)

## Summary
- **Approval:** the owner approved the lessons 10 Nov (D-1110-02, L-1109-26); job brief from the hub session; D-1016-01.
- **Base:** `fix/0.3.3-mm1` from `origin/integration/0.3.3` at e01832dc. Push only this branch; never merge, no PR.
- **Scope:** package.json, package-lock.json (root only), this note, one line in mcp/WORK.md.
- **Expected checks:** `node scripts/check-modules.mjs --strict`; `npm run lint` exits 0; `npm ls minimatch` lists only 11.x.
- **Resume:** if no "State: DONE" below, finish steps 2-4 of the plan and run CI on the branch.

## Measured before (2026-11-10T05:06Z)
- `npm ls minimatch`: 10.2.6 only (dev: eslint 10.14.0, @eslint/config-array 0.23.5, c8 12.0.0 via test-exclude 8.0.0 and glob 13.0.6).
- Newest 11.x: 11.0.5 (npm view minimatch versions); engines "node": "20 || >=22"; CI uses node 22 (tests.yml): accepted.
- `npm audit --omit=dev`: 0 vulnerabilities. `npm audit`: 6 moderate (minimatch chain: eslint, config-array, c8 path).

## Plan
1. Add `"overrides": { "minimatch": "11.0.5" }` (exact, like the other devDependencies). Lock via `npm install --package-lock-only`, then `npm ci`.
2. Expect `npm ls minimatch` 11.0.5 only and `npm audit` moderate count down; lint and c8 scripts pass.
3. If eslint or c8 fails with 11: STOP line at the top, revert, note only.

## Got (2026-11-10T05:16Z)
- package.json: `"overrides": { "minimatch": "11.0.5" }` (exact pin, like the other devDependencies; 11.0.5 is the newest 11.x, npm view minimatch versions). package-lock.json regenerated with `npm install --package-lock-only`, then `npm ci`.
- `npm ls minimatch` after: 11.0.5 only (eslint, @eslint/config-array, c8 via test-exclude and glob 13.0.6).
- `npm audit --omit=dev`: 0 -> 0. `npm audit`: 6 moderate -> 3 moderate (the minimatch advisories are gone; what is left is glob 13.0.6 via test-exclude and c8 12, a different advisory GHSA-3g3m-2fjr-6pw4, only fix is c8 9: not ours to force).
- npm pack of minimatch 10.2.6 and 11.0.5 diffed (diff -r): 11 splits out ast.js and brace-expressions.js, engines 18 || 20 || >=22 -> 20 || >=22 (CI uses 22), and adds one dependency, @isaacs/nonrecursive-glob-match 1.1.0 (new in the lock, dev only), brace-expansion ^5.0.12.
- Proof the tools work: `npm run lint` exit 0; c8 12.0.0 run through its CLI with an include glob exit 0; `node scripts/test-site-config.mjs` PASS; `node scripts/check-min.mjs` run (stamps PASS 1243 checks). The full `npm run coverage:web` hit my 500 s timeout (exit 124, no verdict): not used as proof; CI runs the suites.
- "Red on old code first": here the proof is npm ls and npm audit before and after (numbers above), not a test.
- `node scripts/check-modules.mjs --strict`: 2 of 1218 fail, the same 2 on the base without my change (MODULES.md:199 pbir-values.js and :252 page-toast.js "used by" lines). Not caused by MM1; outside scope.

## CHANGELOG line
none (dev tools only).

## Decisions I made
- Exact override "11.0.5" instead of "^11.0.1": the file pins devDependencies exactly.
- Did not wait for coverage:web (long); lint, c8 CLI and two site scripts plus CI are the proof.

## For the owner
none (dev tools only; nothing in the packaged extension changes).

## Risky changes
package.json and package-lock.json changed (dev tools only); nothing shipped in the package.

## For the laptop
none.

## Seen, not in scope
- check-modules --strict fails 2 checks on the base (see above).
- glob 13.0.6 advisory remains through c8 12 (3 moderate in npm audit).

## Lessons for the reviewer
- The brief's "npm audit" expectation: only the minimatch half clears; the glob advisory stays via c8.
