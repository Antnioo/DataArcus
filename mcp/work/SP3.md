# SP3 (0.3.2, the split, step 3): report-run.mjs -> lib/report-result.mjs (the answer and its notes; behaviour identical)

## Summary
- **Approval:** the reviewer's brief "SP3" (2 Nov); the owner D-1016-01, D-1102-02, D-1102-04. Backlog B-280, B-286
  (the Codex design audit's split map: report-run.mjs, "Extract report-result.mjs first: build metadata to answer/notes, no IO").
- **Base:** `feat/0.3.2-sp3` from `origin/integration/0.3.2` at 771e279. Pushed only this branch; never merged.
  SP1 (`feat/0.3.2-sp1`) is not in integration yet: its seed module is taken byte for byte (see Decisions).
- **Scope:** new `mcp/lib/report-result.mjs`: the pure function that turns a build's metadata into create_report's answer
  and its notes (report-run.mjs's `finish` after the write: the panels line, the report notes, numberFormats, svgMeasures,
  kpiValues, chartColors, chartAxes, looks, the left-out lists, titles, names, formats, the answer object). report-run.mjs
  imports it; the write (withPlan, writeTree, formatsAnswer) and the build stay. Out: binding (SP4), the build (SP5),
  plan_layout and plan-disclosure (SP2), any wording or behaviour change.
- **The test that counts:** new suite `sp3` (area report), `test-0.3.2-sp3.mjs`: 9 runs of plan_layout, approve_plan and
  create_report (the sample project and a report on it, glass by default, plain asked with subtitles, Arabic with names
  and a page filter, bilingual, scripts offered (flip cards, metric switcher), a refused field, hand-placed pages);
  each run's plan answer, create_report answer and written files (path + sha256) recorded on the base in
  `fixtures/sp3-answers.json`; SP1's seed for the server's random ids; normalised: plan id, working folder, path separator.
- **Expected checks:** sp3 10 (R1-R9, C1) on the base AND after the move, the recorded file unchanged between them.
  Guards (Codex's list) unchanged: glass-default, sq13, j14 (counts recorded below from the base run).
- **Expected before -> after:** `lib/report-run.mjs` 631 -> about 460 lines; `lib/report-result.mjs` about 200 (new).
- **State:** plan pushed; next the base run, then the move.
- **Resume:** from this note's last filled section.

## The plan
1. sp3 recorded and passing on the base (this commit). 2. The move: `finish` keeps the write; everything after the
   write that builds the answer becomes `reportAnswer(x)` in lib/report-result.mjs with explicit inputs (no closure,
   no fs, no plan state); the notes array passed in is the same array (the build's notes first, the answer's after).
3. sp3, the report and core areas, the checker area, lint; then CI on the branch.
