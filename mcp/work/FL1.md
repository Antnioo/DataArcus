## Summary
- **Approval:** the owner's brief FL1 (5 Nov, B-379): tests only, fenced to mcp/test-0.3.2-sp44.mjs, mcp/test-0.3.1-mutation.mjs and this note.
- **Scope:** sp44's L1 window gets a life of 5 s (was 400 ms) and the test waits until the clock passes it before "after"; the mutation run prints a failing baseline guard's own FAIL lines (at most 5, 200 characters each).
- **Base:** fix/0.3.2-fl1 from origin/integration/0.3.2 (edf2951b). Push only it; no merge, no PR.
- **Expected checks:** sp44 23 checks unchanged; mutation 88 killed unchanged; fixture sp44-approval.json byte for byte unchanged; lint 0.
- **Resume:** plan written; next: prove the cause (slow open on the base), fix, mutation print, CI twice.

## Plan
1. Prove: add a temporary 500 ms delay before the first GET in L1 on the base; expect sp44 22/23 (the l1 line differs).
2. Fix in the test: `openAt('plan-l1', Date.now() + 5000)`, then wait until `Date.now() > expiry + 50` before "after".
3. Mutation: on a bad baseline print up to 5 FAIL lines of the guard.
