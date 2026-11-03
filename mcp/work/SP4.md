# SP4 (0.3.2, the split, step 4): report-run.mjs -> lib/report-bind.mjs (field identities, formats, bindings; behaviour identical)

## Summary
- **Approval:** the reviewer's brief "SP4" (3 Nov); the owner D-1016-01, D-1102-02, D-1102-04. Backlog B-280, B-286
  (the Codex split map: "report-bind.mjs: metadata plus options to resolved field identities, formats and bindings").
- **Base:** `feat/0.3.2-sp4` from `origin/integration/0.3.2` at 04a9922 (SP3 merged). Pushed only this branch.
- **Scope:** new `mcp/lib/report-bind.mjs`, explicit inputs, no IO (no fs, no plan state, no file read):
  `fieldsDesign`, `planBinding` (moved as they are; report-run.mjs re-exports both, so plan-lint's import is unchanged),
  `fieldBinding(o)` (the picker's binding for n KPI cards: usable measures, the columns counted when a model has no
  measures, bindFor, cardNote, the format lists, the picker's notes for page filters and the Arabic calendar),
  `givenNames` (displayNames checked, keyed by field), `namedFields` (the names put on copies of the bound fields),
  `fieldsOf`, `keyOf`, `arName`. report-run.mjs calls them at the same points, so every refusal keeps its order.
  Out: the build (report-build, a later step), the theme, the gallery, the write, plan-lint and plan_layout (SP2).
- **The tests that count:** sp3 unchanged (10 checks, `fixtures/sp3-answers.json` never re-recorded). sp3 does not reach
  a model without measures (the counted columns and their Arabic names), kpiValues "full" (the cards' formats) or KPI
  slots left out of hand-placed pages: new suite `sp4` (report), `test-0.3.2-sp4.mjs`, the same harness: 3 parity runs
  recorded on the base (`fixtures/sp4-answers.json`, first commit, before the move), plus B1 (report-run's re-exports
  are report-bind's functions) and B2 (report-bind.mjs reads no file and writes nothing).
- **Expected checks:** sp3 10 -> 10; sp4 5 on the base for P1-P3 (B1, B2 fail there by design until the module exists)
  and 5 after; sq15b's count unchanged (its S2 reads planBinding's text in report-bind.mjs: the file name moves, not the
  check); every other suite's count unchanged.
- **Expected lines:** `lib/report-run.mjs` 455 -> about 375; `lib/report-bind.mjs` about 120 (new).
- **Got:** (after the work)
- **State:** plan.
- **Resume:** record sp4 on the base, then the move.

## Plan
1. This note (commit, push).
2. `test-0.3.2-sp4.mjs` + `fixtures/sp4-answers.json` recorded on the base (commit, push).
3. The move; sp3, sp4, the areas report, core, checker; lint (commit, push).
4. CI on the branch; the note's results.
