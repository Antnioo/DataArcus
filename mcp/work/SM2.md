## Summary
- **Approval:** the brief "SM2 (0.3.2)" (5 Nov); the owner D-1104-14 ("add the security mutants to DD1 too", B-330 is
  that step's last item; SM1 did B-329), D-1105-03 (tests only, the reviewer reads the whole diff).
- **Base:** `feat/0.3.2-sm2` from `origin/integration/0.3.2` at a16fa727 (TP1 merged). Push only this branch; never merge, no PR.
- **Scope:** 2 mutants of `mcp/lib/plan-artifact.mjs` (exactArtifact) in `mcp/test-0.3.1-mutation.mjs`, each with a case:
  PA-overlap (:37, `ab.design && !ab.pages ? { blockOverlap: true } : {}` mutated to `{}`) and PA-month (:50,
  `arabicMonth: false` mutated to `true`). Tests, `mcp/fixtures/sm2-artifact.mjs` and this note only; no product code.
  Not in this job: FN1, the other mutants.
- **Expected checks:** mutation 86 -> 88 mutants, all killed (its check count up by 2); test-0.3.1-fx2 only goes up;
  every other suite's number as on the base; lint 0; check-agent-memory, check-result-lines, changelog-words green.
  No CHANGELOG line (nothing a person sees changes).
- **Resume:** step 1 (this note) done; next the two mutants on the harness's copy, then the cases.

## Plan (one commit each)
1. This note.
2. Both mutants applied on the harness's scratch copy (`DA_MUTATION_ALL=1 DA_MUTATION_ONLY=PA-overlap,PA-month`, guards:
   sp43, fx2, en-ar-copy, bilingual-report, twin-artifact, x2-style suites): none kills; the command and result below.
3. PA-overlap: the engine no longer lays out an overlap (a 3,456-run sweep of layouts, pages, rails, slicer styles, flip
   cards, switcher, gallery, en and ar found none; FX2 fixed C23), so the case changes the page list in a clean child
   process (`fixtures/sm2-artifact.mjs overlap`) so a chart sits over a table's first rows; fx2 S1: blocked with
   OVERLAP; S2: the same design unchanged is not blocked.
4. PA-month: a made-up model (Sales, Calendar with Month Name and Month Number): the plain twin's plan offers the Arabic
   month script, the EN-AR copy's plan offers none (fx2 S3, S4). Kept in fx2 beside S1, S2: one helper, one process.
5. Both mutants in test-0.3.1-mutation.mjs (comment: D-1104-14, B-330): PASS with 88 mutants.
6. Touched suites, `npm test -- --keep-going`, tests.yml on the branch, result lines.

## Step 2: each mutant on the harness's copy (base a16fa727, guards run with the mutant, no new case yet)
`DA_MUTATION_ALL=1 DA_MUTATION_ONLY=PA-overlap,PA-month node test-0.3.1-mutation.mjs` (guards: fx2, sp43, en-ar-copy,
bilingual-report, twin-artifact): both SURVIVED: every guard passed (fx2 21 checks, sp43 21, en-ar-copy 27,
bilingual-report 34, twin-artifact 21). Red on a16fa727 first: the mutants, not the cases, were what survived.

## Steps 3-5: the cases (test-0.3.1-fx2.mjs S1-S4, `fixtures/sm2-artifact.mjs`)
- The engine no longer lays out an overlap (FX2 fixed C23): a 3,456-run sweep (layout x page x KPIs x rail x slicer style
  x flip cards / switcher / gallery x en, ar) of exactArtifact found 0 OVERLAP. So S1 changes the engine's page list in a
  clean child process (the chart moved over the table's first rows, as C23 drew it), then calls exactArtifact itself.
- S1 blocked, every blocking rule OVERLAP; S2 the same design unchanged: status pass, no OVERLAP; S3 the plain twin of the
  made-up Tiny model (Calendar with Month Name, Month Number) offers the Arabic month script; S4 the EN-AR copy's plan
  of the same report offers none. fx2 21 -> 25 checks.
- With the mutants: `DA_MUTATION_ALL=1 DA_MUTATION_ONLY=PA-overlap,PA-month`: both killed by fx2 (S1 and S4). The guard
  list is fx2 alone: the other four pass with either mutant.
- test-0.3.1-mutation.mjs: 86 -> 88 mutants (comment: D-1104-14, B-330).

## Decisions I made
- Cases in fx2 (it holds C4/C5, the OVERLAP checks), both, not one in en-ar-copy: the month case needs the same
  clean-process helper, and a model whose date table gets the offer is not in the en-ar-copy fixture (service-orders has one,
  but its report is written once by make-report; the tiny model needs no fixture write).
- The fixture was committed with the note (the first commit): it is a tests-only file.
- PA-month: the code says the copy offers none (`arabicMonth: false`, "no Arabic month script offered in the copy"); no note says it should: no STOP.

## CHANGELOG line
None (tests only).

## For the owner
none

## Risky changes
none (tests, a fixture and this note; no product code; no test loses a check).

## For the laptop
Nothing.

## Seen, not in scope
- `npm run lint` needs `npm ci` at the repo root too (a fresh clone fails with ERR_MODULE_NOT_FOUND until then).
- A design with an overlap cannot be made through the tools any more; PA-overlap's guard changes the engine's page list in a child process.

## Lessons for the reviewer
- A mutant whose branch no run reaches needs a made-up defect: the helper changes the page list in a child process before the libraries load (they bind `projectPages` at import).
