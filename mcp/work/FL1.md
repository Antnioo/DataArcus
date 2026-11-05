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

## Results
- Cause proved: on edf2951b with `await sleep(500)` before L1's first GET, sp44 printed `FAIL  sp44  22/23 checks` (L1, page sha differs), as in CI. Red on edf2951b first.
- Fix: window 5000 ms, wait until clock > expiry + 50 ms; with a 1500 ms delay before the first GET: `PASS  sp44  23 checks`; normal run 23 checks. test-approval `PASS  approval window  32 checks`.
- Mutation: `PASS  mutation  225 checks (88 mutants, all killed ...)`. The FAIL-line print is not run on a real failing baseline (needs a flake).
- No fixture changed.

## CHANGELOG line
none (tests only)

## Decisions I made
- Kept the real clock (approval-http reads Date.now(), no injected clock); used a long life.

## For the owner
none

## Risky changes
none

## For the laptop
none

## Seen, not in scope
- sp44's other windows already use one hour.

## Lessons for the reviewer
- A short real-time window in a test is a flake on a loaded runner; use seconds.
