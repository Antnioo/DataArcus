# SP1 (0.3.2, the split, step 1): plan_layout.mjs -> lib/plan-disclosure.mjs (pure wording; behaviour identical)

## Summary
- **Approval:** the reviewer's brief "SP1" (2 Nov); the owner D-1016-01, D-1101-01, D-1102-02, D-1102-04. Backlog
  B-280 (hubs), B-286 (the split map: the Codex design audit, 1 Nov, plan_layout.mjs first, wording only).
- **Base:** `feat/0.3.2-sp1` from `origin/integration/0.3.2` at a234f06 (0.3.1's a6000a27 + TK1). Pushed only this
  branch; never merged. integration/0.3.2 merged in before CI if it moved (DP1, OP1).
- **Scope:** new `mcp/lib/plan-disclosure.mjs` with the pure functions that turn a built plan into its words; plan_layout
  imports them; nothing else moves. Out: plan-variants (SP2), plan-artifact, any wording change, report-run.mjs, assets/js.
- **What moves:** `lookOf` (the plan's look, A-02), `bilingualSaid` and `BILINGUAL_LAST` (the bilingual answer, X2),
  `NOT_TRANSLATED_WHY`, `englishTitles` and `sayArabicPlan` (the title-language lines, R2, TT1), and the page-size
  line (O-8, the page description, from the handler's inline code into `pageSizeSaid(asked, page)`). Stays: the build
  (`exactArtifact`, `bilingualOf`), the sample and redesign branches and `redesignFit` (SP2), registration, the handler.
- **Test first (the one that counts):** new suite `sp1` (core), `test-0.3.2-sp1.mjs`: plan_layout's whole answer for
  10 made-up plans (the sample, a layout alone with a page size asked, English, Arabic with approved names, Arabic with
  none, a field no list names, bilingual, a redesign, hand-placed pages, options with scripts), sha256 + length of each
  recorded on the base in `fixtures/sp1-answers.json`; the server's random ids from one fixed seed
  (`fixtures/sp1/seeded-random.mjs`, loaded only by this test), normalised: the plan id and the working folder.
- **Expected checks:** sp1 11 (P1-P10, C1: every moved piece's words are in the answers), passing on the base AND after
  the move. Every other suite unchanged (no expected number changed). plan_layout.mjs 635 lines -> about 590.
- **State:** plan pushed; next the test on the base, then the move.
- **Resume:** run `node mcp/test-0.3.2-sp1.mjs` on this branch; then the move as listed above.

## Plan
1. This note (commit, push).
2. The suite on the base code, recorded and passing (commit, push: sha named below).
3. The move: lib/plan-disclosure.mjs, plan_layout imports it; ARCHITECTURE.md's route (c) names the new file; tests.json's
   affected "report" list adds it. sp1 passes unchanged (sha named below). Areas core and report, lint.
4. CI on the branch (`gh workflow run tests.yml --ref feat/0.3.2-sp1`), waited for; the result here.
