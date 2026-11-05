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
