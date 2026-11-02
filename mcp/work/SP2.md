# SP2 (0.3.2, the split, step 2): plan_layout.mjs -> lib/plan-variants.mjs (sample / redesign dispatch; behaviour identical)

## Summary
- **Approval:** the reviewer's brief "SP2" (2 Nov); the owner D-1016-01, D-1102-02, D-1102-04. Backlog B-280, B-286
  (the Codex split map: plan-variants.mjs for the sample/redesign dispatch, after SP1's plan-disclosure.mjs).
- **Base:** `feat/0.3.2-sp2` from `origin/integration/0.3.2` at 550cea1 (with SP1). Push only this branch; never merge.
- **Scope:** new `mcp/lib/plan-variants.mjs` with `samplePlan`, `redesignPlan`, `redesignFit` (and `SAMPLE_KEYS`, only
  what they need). Explicit inputs: the request and, for the redesign, the model plan_layout loaded; no server context.
  The approval proposal (`Plans.propose` + `Plans.proposal` + the exact artifact kept with it) stays in plan_layout:
  each variant returns its answer and what to propose (kind, model key, writes, data, artifact); plan_layout proposes.
  Nothing else moves. Out: plan-artifact (exact build/check), report-run.mjs, report-result.mjs, assets/js, wording.
- **The tests that count:** sp1 11 (P1 the sample, P7 the redesign) unchanged, its fixture never re-recorded. New suite
  `sp2` (core), `test-0.3.2-sp2.mjs`: the variants' paths sp1 does not take, recorded on the base before the move
  (sha256 + length, `fixtures/sp2-answers.json`, sp1's seed and normalising): the Arabic sample, the sample with a model
  input (problem), a redesign without path, a redesign with a new report's inputs (problems), a redesign listing one page
  (redesignPages), a redesign with its options (titles, restyle, consistentText, keepPositions), a redesign whose copy
  check refuses (planProblems from lib/redesign.mjs). After the move, cross-entry parity: the module's own
  samplePlan/redesignPlan answers (called in the test process) equal the tool's blocks.
- **Expected checks:** sp1 11; sp2 7 on the base (S1-S2, R1-R5), 9 after the move (+ X1 sample, X2 redesign parity).
  Guards unchanged: j14 30, write-gate 7, bilingual-report 33, mr1, bd1 18, sq10, sq13, 0.3.0-claims.
- **Before -> after (expected):** `tools/plan_layout.mjs` 585 -> about 545 lines; `lib/plan-variants.mjs` about 55 (new).
- **State:** plan pushed; work next.
- **Resume:** record sp2 on the base, then move.
