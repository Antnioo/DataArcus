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
  **Got:** sp2 8 on the base (R6 added, see Decisions) at a1ba227, recorded there; after the move (ab8a204) sp1 11 and
  sp2 10, the recorded files unchanged. A one-character wording change in the module: sp2 FAIL 2 of 10 (R1, R2).
  Guards after the move, counts unchanged: j14 30, write-gate 7, bilingual-report 33, mr1 26, bd1 18, sq10 29, sq13 39,
  0.3.0-claims 688. Lint 0.
- **Before -> after:** `tools/plan_layout.mjs` 585 -> 538 lines; `lib/plan-variants.mjs` 69 lines (new).
- **State:** the work committed; area runs and CI next.
- **Resume:** areas core, report, checker; then CI.

## What moved
`samplePlan` and `SAMPLE_KEYS`; `redesignPlan`, split in two: `redesignProblems(a)` (the request's own problems, before
the model is read) and `redesignPlan(a, m)` (the model plan_layout read, passed in); `redesignFit`. Each returns
`{ answer }` and, for a plan within the limits, `propose: { kind, model, writes, data, artifact }`. plan_layout keeps
`attached` and a new `proposed(v)`: `Plans.propose`, `Plans.proposal` and the exact copy kept with the plan, the plan
block added as the answer's last key (the key order as before). Imports gone from plan_layout: sample-project.mjs,
redesign.mjs, `AIM`, `fitLists`, `out`, `pretty`, `samplePin`, `redesignPin`, `inside`, `node:path`.

## CHANGELOG line
- **Inside the MCP:** the sample project's plan and a redesign's plan are made in a file of their own; each plan says
  and does exactly what it did before.

## Decisions I made
- The proposal stays in plan_layout (the brief, Codex's "one orchestrator"): the variants return what to propose. The
  order of the calls is unchanged where it matters: the random plan id (`Plans.propose`) is still drawn after the
  redesign's own random logical id, so the seeded answers compare byte for byte.
- The model for the redesign is read by plan_layout (`refuseUnreadable(loadModel(a.path))`) and passed in: "model
  metadata explicitly"; the problems are still said before the model is read, as before.
- sp2 has R6 (a title for a visual that is not there: lib/redesign.mjs's problems with the redesign block), one more
  than the plan's 7: one path of `R.problems` without a write-over. R4's preset is a real one (Midnight), so R4 plans.
- X2 compares with the redesign copy's digest normalised: the test's own process is not seeded, so the logical id is
  new; R3 compares the same answer byte for byte through the seeded server.
- tests.json's affected "report" list adds lib/plan-variants.mjs. ARCHITECTURE.md and docs/MODULES.md name none of the
  moved functions: unchanged.

## For the owner
none

## Risky changes
none (no wording or behaviour change; sp1 and sp2 prove the answers identical).

## Seen, not in scope
- `redesignFit`'s cut (listsCut) is taken by no suite with a small fixture: the twin's answer is under the cap. A
  redesign of a report with many pages would prove it; Q1's own suite tests it on its fixture.
- plan_layout's "Table[Field]" regex in six places (SP1's Seen) still there.

## Lessons for the reviewer
- plan-artifact (`exactArtifact`, `bilingualOf`) is the next split: sp1 P3-P6, P8-P10 are its gate (every one builds the
  exact artifact); sp2 does not cover it. Keep `attached` and `proposed` in plan_layout: they are the one place a plan
  is proposed and its exact artifact kept.
- sq13 pins `previewOf(exact ? exact.files : null)`, write-gate `formatsAnswer` x2 in plan_layout: neither moved here.
- A test calling a lib function in its own process is not seeded: normalise only the ids it draws (here the digest).
