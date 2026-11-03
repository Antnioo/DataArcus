# SP4 (0.3.2, the split, step 4): report-run.mjs -> lib/report-bind.mjs (field identities, formats, bindings; behaviour identical)

## Summary
- **Approval:** the reviewer's brief "SP4" (3 Nov); the owner D-1016-01, D-1102-02, D-1102-04. Backlog B-280, B-286
  (the Codex split map: "report-bind.mjs: metadata plus options to resolved field identities, formats and bindings").
- **Base:** `feat/0.3.2-sp4` from `origin/integration/0.3.2` at 04a9922 (SP3 merged). Pushed only this branch.
- **Scope:** new `mcp/lib/report-bind.mjs`, explicit inputs, no IO: `fieldsDesign`, `planBinding` (moved as they are;
  report-run.mjs re-exports both, plan-lint's import unchanged), `fieldBinding(o)` (usable measures, the columns counted
  without measures, bindFor, cardNote, listFormats with cardFormats/tableFormats, the picker's notes slicersDropped,
  byFlagDay, englishNames), `givenNames` (displayNames checked), `namedFields`, `fieldsOf`, `keyOf`, `arName`.
  report-run.mjs calls each at the point it ran before, so every refusal keeps its order. Out: the build (report-build),
  the theme, the gallery, the write, plan-lint and plan_layout (SP2).
- **What moved:** report-run.mjs lines 45-61, 138-185 (not 186, `let kpiCards`), 187, 216-224, 227-232 at 04a9922, the
  text unchanged but for: `a.lang` -> `lang`, `full: FULL` -> `full`, `a.displayNames` -> `displayNames`, the function
  heads, `AR_COL`/`arName` lifted to module scope, one comment ("planBinding above").
- **Tests:** new suite `sp4` (report): 3 parity runs sp3 does not reach (P1 a model without measures, Arabic, a display
  name on a counted column; P2 kpiValues "full" and a Ramadan page filter on the season's days; P3 hand-placed pages
  with 4 KPI slots on 2 measures and a text slot without text), recorded on the base in `fixtures/sp4-answers.json`
  (commit 5d752c1, before the move); B1 re-exports, B2 no IO. Two mutations in the moved code ("Count of" spelled
  differently; card formats not listed): sp4 FAIL, sp3 still PASS (so sp4 adds reach).
- **Expected checks:** sp3 10 -> 10 (fixture untouched); sp4 3 of 5 on the base (B1, B2 by design) -> 5 of 5;
  sq15b 25 -> 25 (S2 reads planBinding in report-bind.mjs: the file name moved, not the check); every other the same.
- **Got:** as expected (Areas below).
- **Before -> after:** `lib/report-run.mjs` 455 -> 383 lines; `lib/report-bind.mjs` 119 lines (new).
- **Areas (base 04a9922 in a worktree -> after 144a838):** report 44 -> 45 suites (sp4 added; every other count the
  same: glass-default 43, sq13 39, sq15b 25, sp3 10); core 10 -> 10 (mutation 198, 76 mutants killed); checker 7 -> 7;
  j14 30 -> 30 (safety, run alone); lint 0.
- **CI:** (below)
- **State:** CI running.
- **Resume:** CI on the branch; then only this note.

## CHANGELOG line
- **Inside the MCP, the report's fields:** how a report picks and names its fields and their number formats is in one
  file of its own; every plan, answer and written file is exactly what it was before.

## Decisions I made
- planBinding moved with the binding; report-run.mjs keeps `export { fieldsDesign, planBinding } from './report-bind.mjs'`
  (the facade), so plan-lint.mjs (SP2's file) is untouched. sq15b's S2 now reads `export function planBinding(` in
  report-bind.mjs and the re-export in report-run.mjs: same check count, the brief's "or move the file names".
- displayNames are still checked where they were (after the projectDir refusal): `givenNames` is a separate call, not
  part of `fieldBinding`, so a call with two problems is refused for the same one as before.
- `fieldsOf(bind).filter((f) => f.agg == null).map(keyOf)` (three times: FS, the write, formatKeys) left as written: the
  write's line is pinned by write-gate (formatsAnswer() 1) and folding it is a change, not a move.
- `themeColors`, `themeOf`, `modelNames`, `modelColumns`, `withSplit`, `galleryOf` stay: they are the theme, the writer's
  model view and the gallery (report-build's).
- The clone was shallow, so glass-tables could not read its base engine (cba24a5): `git fetch --unshallow`, then ran
  the base in a worktree for a clean before.

## For the owner
none

## Risky changes
none (every moved piece is reached by sp3 or sp4 byte for byte; plan-lint's import unchanged)

## Seen, not in scope
- `fieldBinding` returns 12 values that report-run destructures; reportAnswer still takes 41 by name. report-build could
  pass one `bound` object to both.
- In a shallow clone glass-tables fails N0 (`git show cba24a5`): CI fetches full history; local runs need `--unshallow`.

## Lessons for the reviewer
- report-build's split: what it takes from here is `bindFor`, `listFormats`, `named` (namedFields with given), `nValues`,
  `nCards`, `cardNote`, `COUNTS`, `usable`; `kpiCards` is set by the build (both branches) and read by the answer.
- sp3 and sp4 are the gates for SP5: both unchanged, never re-recorded on a split branch.
- `englishNames`, `slicersDropped`, `byFlagDay` are filled only when bindFor runs (noted): read them after the build.
- Source-reading pins now on report-bind.mjs: sq15b S2 (`export function planBinding(`), sp4 B2 (no fs/path/writes).
