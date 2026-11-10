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
