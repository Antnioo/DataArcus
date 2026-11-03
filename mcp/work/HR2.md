## Summary
- **Approval:** the reviewer's brief "HR2" (3 Nov, B-295, HR1's "For the owner" 2); D-1016-01, D-1102-02, D-1103-06.
- **Base:** `fix/0.3.2-hr2` from `origin/integration/0.3.2` at 10aa0f2. Push only this branch.
- **Scope:** plan_layout's ANSWER only, in HR1's `lib/plan-headroom.mjs` fitRepeats (past AIM = 95% of ANSWER_MAX,
  38,000, only): the plan's data, its binding and the approval page untouched (they read their own copies).
- **The step:** bilingual-report's B5 (every 0.3.0 option, the large fixture) after the Gulf date answer, before
  the Arabic names and texts are given (no plan id). Measured (a local probe, not committed; the 120-character
  folder): 42,710 before the cap, cut by capAnswer: `bilingual.notTranslated` 25 of 50.
- **Plan (each red first on 10aa0f2):**
  1. Guard `test-0.3.2-hr2.mjs` (area report): that step from the long folder: notTranslated whole (all 50 texts,
     each with its where and why), no `truncated`, at most 38,000. U checks of the reshape on made-up answers.
  2. fitRepeats, past AIM only: `bilingual.notTranslated` grouped by its reason (each why, and whyAr, once; its
     texts, each text and where, under it). Measured saving 3,582.
  3. The next repeats in that answer, measured: `bilingual.terminology.sheet[].why` the same for every row of a
     status -> once in `whyByStatus` (713); `forAuthoring[].position` repeats its slot's x, y, width, height (by
     role) and tabOrder equals z -> each `{ role, kind, z }` and the rule once (about 900).
- **Expected numbers:** the step 42,710 -> about 37,9xx, uncut, notTranslated 50 of 50; B5's plan with an id stays
  about 37,7xx (it reshapes forAuthoring too: a little smaller). Every answer under 38,000: byte for byte as before
  (no suite's expected number changes).
- **State:** plan pushed; the work next.
