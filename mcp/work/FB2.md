## Summary
- **Approval:** the owner, 11 Nov, D-1111-01 "A fb1 1 yes": restore FB1's cards' row over the rail and remake the 6 website backgrounds.
- **Base:** `feat/0.3.3-fb2` from `origin/integration/0.3.3` at 7960ac78. Push only this branch; never merge, no PR.
- **Scope:** `git revert 3d787177` (brings back 38b8ffdb), re-record the 6 website backgrounds and the fixtures FB1 lists by
  their own recorders, measure again with fb1, the CHANGELOG line, mcp/WORK.md, this note. Not stage 2, no other layout change.
- **Expected checks:** fb1 red on the revert's parent first by the 30 plans of FB1's table; then 10 of 80 plans with a hole,
  worst 10.6%, flattest 6.8, sq13 S10 all 18, Details chart 312 high at 1920 x 1080; sp29 22 -> 23 checks; all suites pass;
  `node scripts/check-modules.mjs --strict`; lint 0; CI green.
- **Resume:** (2026-11-11T02:47Z) started; revert next.

## Plan (written 2026-11-11T02:47Z)
1. Revert 3d787177 on this branch. If it conflicts, stop and name the files.
2. Re-record with the recorders in FB1.md "Next stages" 1 (SPn_RECORD, FN1F_RECORD, FN1J_RECORD, fn1c --record,
   FB1_RECORD, capture-design-fixtures.mjs); read every changed key in the diff (L-1110-23); build:min with new ?v= stamps.
3. Measure with fb1; compare with FB1's table (10 / 10.6 / 6.8 / 18 x 5 / 312).
