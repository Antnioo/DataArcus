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
- **Got:** cx1 24 (15 of 24 red on dd6d7ad first; the other 9 are set-up and guards, green there by design) -> 24 PASS;
  test-microsoft-watch 63 -> 65 (W12: 1 of 2 red on dd6d7ad first, the other the stranger guard); r4-write-safety 46 ->
  47 (H1-H3 changed on purpose, H3's retry added); write-gate 7 = 7 (its list said on purpose); mcp (test.mjs) 1593 =
  1593, golden 12 tasks = 12 (no result moved), phone 355 = 355, arabic-titles 27 = 27, terminology-sheet 48 = 48,
  arabic-calendar 31 = 31, story-titles 94 = 94, preview-match 41 = 41, metric-switcher 60 = 60, lr1 18 = 18, r4a 32 =
  32, large-model-caps 215 = 215, twin-complete 24 = 24, powerbi-2026-10 26 = 26 (each measured on dd6d7ad too); each
  names its fields by hand (Tests changed on purpose); tt1 28 = 28; lint 0; merged integration c77b295 (TW1 in): 111 ->
  112 suites (+ cx1).
- Full run on 33df971: "run-tests: 112 suites passed"
- **Resume:** done; CI started on the branch (tests.yml, through the GitHub tools), then the reviewer.

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
Before -> after:
- F01: an Arabic plan whose titles would be English for fields with no Arabic name: plan id given, a "how" only ->
  no plan id; planProblems names the fields and both ways out (approved Arabic names, or each kept English on purpose:
  its model name in displayNames). titlesInEnglish stays in the answer as the list to draft from.
- F08: two approved scripts, the first fails (ENOSPC): the other written, isError false, plan used -> neither on disk,
  isError true ("Nothing was written ... The plan ... was not used"), the same planId writes both once the cause is gone.
  A script that was there before (same content, not created by this call) stays. With scripts, the answers file is
  written last in the same batch: a failure before it leaves a prior answers file as it was.
- F02: a dense page with no free place for its language button: no button, its counterpart hidden in the tabs -> both
  pages of that pair shown in the tabs; the button's why, pairs[].bothShown, tabs.bothShown and the plan's sentence say
  it (the approval page lists the button's why: "not placed: ... both pages of this pair stay in the tabs").
- F11: text(string) of 40,001 characters returned whole -> cut to 40,000 with the cut said in its last lines.
- F10: the watch read the first 100 comments -> every page (per_page 100, until a page that is not full; at most 100
  pages), the github-actions[bot] filter kept.

## Tests changed on purpose
Each: what it now gives, and why (F01: an Arabic plan whose titles would be English gets no plan id); no expected
number changed unless said.
- `test-0.3.0-write-safety.mjs` H1-H3 (F08): a failed script batch is an error, not a normal answer; H3 neither script
  stays and the plan is not used (was: one written, plan used); H3's retry added: 46 -> 47.
- `test-0.3.1-write-gate.mjs`: the list of writing calls says the batch's rollBack (files.mjs 2 -> 3) and the answers file
  written in the batch (check_model_health 1 -> 2); 7 = 7.
- `test-models/golden-baseline.mjs` task 2: approved Arabic names for Month Short and Total Sales vs Last Ramadan %, as
  the agent-level task does; its "why" in golden-expected.json says it; no result moved (no --update).
- Kept English on purpose (the check is about layout, phone, slicers, calendars, story titles, caps or texts, not the
  names), each listing its fields: test.mjs (Gulf Sales, Table AR, Names AR (below), R9
  SVG AR, R10 fit, D5 titles, R13 Long, R12 AR2, R12 Six, R14 sample, N1), test-round23 (R23 esc, R23 cc), test-0.2.9b
  (B29 ar), test-0.2.9i (I ar en: this check is about English names, kept on purpose), test-phone (ramadan, large),
  story-titles (ramadan ar), arabic-calendar (before and after the script), twin-complete (TC-2d), large-model-caps (AR all
  on: the 2 fields DN leaves), lr1, r4a, metric-switcher (AR_DN), powerbi-2026-10 (ar), preview-match (T1a all, T1b the 4
  with no fixed word), terminology-sheet TS-8 (the hostile measure; TW1's file, 1 call).
- test.mjs "Round0 AR: without displayNames" (33df971; red on d0eaa9e, CI run 40617821387): before: Month Short listed in
  arabicNames.missing, every displayName the plan's pinned one; after: Month Short is either listed as missing or shown
  under its model name, the term kept English on purpose by "Table AR" earlier on the same model (the plan reuses a choice
  the person confirmed); any other displayName is still the plan's pinned one; Total Sales still never missing. F01
  itself is unchanged: an Arabic plan with an unnamed title field and no names given is still refused (cx1 A1, A2).
- test.mjs "display names" (Names AR): before: displayNames used 6, vs Last Ramadan % missing; after: its 2 fields with
  no Arabic name kept English on purpose (keepEnglish), shown under their model names: used 8.
- arabic-titles AT-3: its subject is the English-names case: the first plan (no id) gives the lists checked; the person
  then keeps the 11 fields English on purpose and the report is written; AT-3f allows their names.

## CHANGELOG line
Five lines in `mcp/CHANGELOG.md` [Unreleased]: "No English titles slip into an Arabic report", "Fix scripts written all
or none", "No page out of reach in the English and Arabic report", "Long answers capped", "The weekly Microsoft watch
reads every comment".

## Decisions I made
- F01 refuses only for fields named in titles (titlesInEnglish.fields), as the brief says; a field shown in English
  only as a header (notTranslated, no title) keeps today's answer (said in the plan, no refusal).
- F01's ripple: 13 older suites planned Arabic reports on English models without naming those fields. Their set-ups
  now keep the fields English on purpose (test-plan.mjs keptEnglish / keepingEnglish: the person's choice stood in for,
  the old output exactly); no expected number changed; two checks of test.mjs (display names) accept the kept model name
  as a given name (said in comments there).
- F08: the answers file is part of the batch only when there are scripts (written last); a plan that writes only the
  answers file keeps its own answer (answersNotWritten, not an error), as answers-safety F05 tests.
- F08: the batch's error is one error (isError); the per-script `scriptNotWritten` fields are no longer used by
  check_model_health (fix-scripts.mjs's notWrittenWhy stays for create_report's format script).
- F02: keep both pages shown rather than refuse the plan: the copy stays writable, nothing is stranded, and the plan
  says it; a page the original author hid stays hidden (its own visibility kept).
- F11: the cut marks a cut surrogate pair by cutting one character less (no broken character).
- No gh CLI here: CI on the branch was started through the GitHub tools (tests.yml, the same manual run).

## For the owner
none

## Risky changes
- check_model_health's write (on purpose): its approved scripts and answers file are one batch, all or none
  (files.mjs planWrites.batch, write-io's rollBack: only what this call created, while it is still that file); a failed
  batch is an error now, not a normal answer with scriptNotWritten. writeFileNew now returns the record of what it
  placed (no caller used its return before).
- The approval step (on purpose): an Arabic plan with English titles for unnamed fields gets no plan id.
- The EN-AR copy (on purpose): a pair whose button is not placed has both pages in the tabs.
- `test-0.3.0-terminology-sheet.mjs` is TW1's file: TS-8's one plan_layout call gives the hostile measure kept English on
  purpose (merged with TW1's version on c77b295, no conflict).

## For the laptop
- F02: open an EN-AR copy of a report with a crowded header in Power BI Desktop: both pages of that pair show in the page
  tabs (reading view), no language button on them, nothing else changed.
- F01 changes no file Desktop opens; F08 and F11 none.

## Seen, not in scope
- plan_layout's bilingual write sentence (tools/plan_layout.mjs, "the Arabic pages hidden in the tabs") does not yet
  name a pair kept in both tabs (create_arabic_twin's does); its buttons list and the approval page do. Outside F01's
  block, which is the only part of plan_layout this job may change; one line for TW1 or the reviewer.
- Codex's repository (dataarcus-exchange) was not reachable from this session; the probes were rebuilt from the brief's
  file:line summaries (cx1 A and W, W12).

## Lessons for the reviewer
- A rule that refuses a plan ripples into every suite that planned that case silently: list the suites that call the
  tool with that input before estimating (here 14 suites).
- A test helper that keeps English by default weakens the rule it works around; each check names its own choice.
