# ST1 (0.3.1, the owner, 26-27 Oct): the "Seen, not in scope" sweep of 0.3.1

## Summary
- **Approval:** the reviewer's brief "Go on ST1" (line 2 of the 0.3.1 release bar); the owner, 26 Oct: "don't freeze
  .3.1 fix the seen not in scope in it"; 27 Oct: "get 0.3.1 in a shape that you yourself would back up by every means".
- **Scope:** this register (one row per item, a verdict checked in today's code); up to 25 small fixes, one commit each
  with its red-first test; the old notes are not edited. Not GD2's files (the glass twin, the previews), not SF1's
  (README's install section, CHANGELOG's 0.3.1 section, the hard rules: verdict "SF1").
- **Base:** `fix/0.3.1-seen-sweep` from `origin/integration/0.3.1` (44d1f32). Push only this branch.
- **Expected checks:** (written before the work) the count: **595 items in 108 notes** (method below; the brief's 451
  in 94 used another rule). Expected verdicts: FIXED-SINCE about 45 %, NOT-A-PROBLEM about 25 %, NEEDS-DESKTOP about
  12 %, 0.3.2 about 12 %, FIXED-HERE 10-25, GAP 0-5. Tests: the baseline full run (105 suites) + 0 or 1 suite; each
  fix's suite +1 or more checks, red first; `npm run lint` exit 0; check-agent-memory, changelog-words PASS.
- **Resume:** step 1 (the plan); next: the register, 0.3.1's own notes first.

## The count (how)
- Every note in `mcp/work/` (and `archive/WORK-*`, as the queue did) with a "Seen, not in scope" part.
- The 73 notes the queue covers (`SEEN-QUEUE.md`, 25 Oct): its ids, `<NOTE>-S<n>`, 442 items (prose numbered too).
- The 35 notes written since (0.3.1's jobs and the SQ batches): every line starting with "- " or "N. " in a section
  whose heading holds "Seen, not in scope", up to the next heading: 153 items. Total 595.
- The brief's rule over every note gives 524 in 102 notes (J19, L2, L4 and the WORK files keep "Seen" as prose).

## The plan
1. This note, the count and the plan; commit, push.
2. The register, in the brief's order: GD1, GL2, TT1, BD2, CS2, NC3, GC3, R4A, then 0.3.1's other notes, then the
   older ones. Every verdict checked in today's code (file:line or a command's output); the queue's evidence is a lead,
   never the verdict. Push every 50 items.
3. Fixes: FIXED-HERE (about 20 lines with the test) and GAP (about 60) in this branch, test red first, one commit each;
   at most 25; past that FIXED-HERE-NEXT.
4. The summary on top: counts, GAPs, the 0.3.2 list (30 lines at most), the NEEDS-DESKTOP list.
5. lint, touched suites, build:min and stamps if `assets/js/` changes; the full run after the last code commit.
