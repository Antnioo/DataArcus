# CX1 (0.3.1): Codex's five safety findings fixed (never silent, all or nothing, never stranded, answers capped)

## Summary
- **Approval:** the reviewer's brief "Go on CX1" (27 Oct): the five code findings of Codex's independent release
  review real on integration (re-checked on 75652532). The owner: D-1027-04 (Arabic titles drafted and approved, never
  silent), D-1027-03 (a title all Arabic or all English), D-1027-13 (nothing written before approval, all or nothing,
  answers capped), D-1027-20 (a Seen item that needs fixing is fixed).
- **Scope:** F01 `mcp/tools/plan_layout.mjs` (its own block, the TT1 titlesInEnglish block only); F08
  `mcp/tools/check_model_health.mjs`, `mcp/lib/files.mjs` (planWrites.batch), `mcp/lib/write-io.mjs` (writeFileNew
  returns what it placed), `mcp/lib/fix-scripts.mjs`, `mcp/lib/model.mjs` (writeNew passes it on); F02
  `mcp/lib/twin-copy.mjs`, `mcp/tools/create_arabic_twin.mjs` (its plan sentence); F11 `mcp/lib/tool-answer.mjs`;
  F10 `scripts/microsoft-watch.mjs`. Tests: the new suite `mcp/test-0.3.1-cx1.mjs` (safety), H1-H3 of
  `test-0.3.0-write-safety.mjs` (changed on purpose, below), `scripts/test-microsoft-watch.mjs` (W12). Not TW1's or
  LC1's files.
- **Base:** `fix/0.3.1-codex-safety` from `origin/integration/0.3.1` (dd6d7ad). Push only this branch.
- **Expected checks:** (written before the work) the new suite `cx1` about 16 checks, red first on dd6d7ad (F01: the
  probe's Arabic plan with two unknown English title fields gets a plan id; F08: of two scripts, the first failing on a
  full disk, one stays on disk and the answer is not an error; F02: a dense page's EN-AR copy has a page with no
  button and its counterpart hidden; F11: a 40,001-character string answer comes back whole); test-microsoft-watch
  + 2 checks (W12: 150 comments, keys on page 2 read; red first); r4-write-safety: H1-H3 changed on purpose (the
  answer is an error now), its count about the same; tt1 28 = 28 (R6/R8 look at the plan's titlesInEnglish, which
  stays); answers-safety, confirm-memory, en-ar-copy, bilingual-report equal; full run: the base's 110 suites + 1 (cx1).
- **Got:** (after the work)
- **Resume:** step 1 (this note).

## Plan
1. This note (commit, push).
2. Red first: `mcp/test-0.3.1-cx1.mjs` (F01, F08, F02, F11) and W12 in `scripts/test-microsoft-watch.mjs` (F10); run on
   dd6d7ad: red.
3. F01: an Arabic plan whose titlesInEnglish.fields is not empty gets a planProblem naming the fields and the two ways
   out (an approved Arabic name in displayNames, or the field kept English on purpose: its model name in displayNames):
   no plan id. titlesInEnglish stays in the answer (the list to draft from).
4. F08: check_model_health writes its scripts as one batch (planWrites.batch in files.mjs): every file this call
   creates is recorded (writeFileNew returns its record); on any failure everything this call created is removed
   (rollBack: only while it is still what this call wrote; a file that was already there holding the same script is
   not ours and stays), the answers file is not written (a prior one is kept as it was), the answer is an error
   (isError) naming what is left, and the plan is not used when nothing stayed. A plan that writes only the answers
   file keeps its answer as today (answersNotWritten).
5. F02: the EN-AR copy: when a page of a pair gets no language button, both pages of that pair stay in the tabs
   (neither hidden), so a reader reaches each; the button's why, the pair (bothShown) and the plan say it.
6. F11: text(string) over 40,000 characters is cut to 40,000 with the cut said in its last line.
7. F10: the watch reads every page of the issue's comments (per_page=100, page=N until a short page), the bot filter kept.
8. CHANGELOG lines; lint; area runs; full run; this note.

## Results
