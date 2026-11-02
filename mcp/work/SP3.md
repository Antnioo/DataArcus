# SP3 (0.3.2, the split, step 3): report-run.mjs -> lib/report-result.mjs (the answer and its notes; behaviour identical)

## Summary
- **Approval:** the reviewer's brief "SP3" (2 Nov); the owner D-1016-01, D-1102-02, D-1102-04. Backlog B-280, B-286
  (the Codex design audit's split map: report-run.mjs, "Extract report-result.mjs first: build metadata to answer/notes, no IO").
- **Base:** `feat/0.3.2-sp3` from `origin/integration/0.3.2` at 771e279; it had not moved when CI started (nothing
  merged in). SP1 is not in integration yet: its seed module is taken byte for byte (Decisions). Pushed only this branch.
- **Scope:** new `mcp/lib/report-result.mjs`, `reportAnswer(x)`: create_report's answer and its notes from the build's
  metadata (report-run.mjs's `finish` after the write: the panels line, the report notes, numberFormats, svgMeasures,
  kpiValues, chartColors, chartAxes, looks, the left-out lists, titles, names, formats, the answer object). Pure: no fs,
  no plan state, 41 named inputs. `finish` keeps the write (withPlan, sameModelBeforeWrite, writeTree, formatsAnswer)
  and calls it. Out: binding (SP4), the build (SP5), plan_layout and plan-disclosure (SP2), any wording change.
- **What moved:** report-run.mjs lines 449-625 at 771e279, the text unchanged (diffed: identical but for the new
  function's head). Imports used only there moved with it (flipHow, iconsHow, daxHow, hiddenOf, SVG_STATUS, boundOf,
  topSaid, CARD_RULE, modelNotes, phoneAnswer, calendarSaid, tableSmallerSaid, rowLabel(Skipped)Said, extRenamedSaid,
  uniqueFields, Fix).
- **The test that counts:** new suite `sp3` (report), `test-0.3.2-sp3.mjs`: 9 runs of plan_layout, approve_plan and
  create_report on made-up models; each run's plan answer, create_report answer and written files (path + sha256)
  recorded on the base in `fixtures/sp3-answers.json`; SP1's seed; normalised: plan id, working folder, path separator.
- **Expected checks:** sp3 10 on the base and after the move; every other suite's count unchanged.
- **Got:** sp3 10 (R1-R9, C1) on the base at d6a193e AND after the move at 87b1fbb, the recorded file unchanged.
  A one-character change in a moved note: sp3 FAIL 7 of 10. Two runs on the base: identical dumps.
- **Before -> after:** `lib/report-run.mjs` 631 -> 455 lines; `lib/report-result.mjs` 201 lines (new).
- **Areas (base d6a193e -> after 87b1fbb):** report 44 -> 44 suites passed, every count the same (glass-default 43,
  sq13 39, j14 30, sp3 10); core 9 -> 9 (mutation 198, 76 mutants killed); checker 7 -> 7; lint 0.
- **CI green: https://github.com/Antnioo/DataArcus/actions/runs/41542798432 on 87b1fbb** (attempt 1; Linux,
  Windows and macOS shards). integration/0.3.2 still 771e279 after the run.
- **State: DONE.**
- **Resume:** none; the reviewer's merge.

## The runs in sp3
R1 the sample project; R9 a report on it (exec); R2 glass, the default look (twin, analysis); R3 the plain look asked,
a subtitle used and one not (tiny, exec, formats and numberFormats); R4 Arabic, approved names, a page filter, a second
page; R5 bilingual en+ar (the drafted Arabic titles approved); R6 scripts offered (Arabic, flip cards, the metric
switcher); R7 a refused field (Sales[Nope]: planProblems, nothing written); R8 hand-placed pages (health-project).
C1: the answers hold every moved piece (reportNotes, kpiValues, chartColors, chartAxes, flipCards, metricSwitcher,
arabicNames, displayNames, pageFilters, formats, numberFormats, modelNotes, phone, check), 8 written, 1 refused.

## CHANGELOG line
- **Inside the MCP, the report's answer:** what create_report says after writing a report is put together in one file
  of its own; every answer and every written file is exactly what it was before.

## Decisions I made
- SP1's `fixtures/sp1/seeded-random.mjs` copied byte for byte from `feat/0.3.2-sp1` (not yet merged): the same blob on
  both branches merges with no conflict and stays one file (D-1016-01). sp3 loads it as sp1 does.
- The answers name files by path (`open`): on Windows with backslashes, so sp3 turns every JSON-escaped backslash into
  `/` before hashing, on every OS (the same transform everywhere, so the hashes hold on Linux, Windows and macOS).
- The inputs are passed at the call (inside `finish`, after the write), so a value the caller changes between the
  build and the write is seen as before (the closure read them at call time too). reportNotes is the build's own array.
- `fieldsOf` (the build's local helper) passed in as an input rather than moved: it is the binding's, SP4's to place.
- `test-source.mjs` SERVER_LIBS lists `lib/report-result.mjs`, so source-reading tests still find the moved text.
- `docs/MODULES.md` names the new module; tests.json's affected "report" list (`report-*.mjs`) already covers it.
- WORK.md left as it is (3,185 of 3,200 characters): the reviewer's merge line covers SP3.
- CI started on 87b1fbb while the local core and checker areas ran on the same commit (no code after it).

## For the owner
none

## Risky changes
none (no wording or behaviour change; sp3 proves the answers and the written files identical).

## Seen, not in scope
- reportAnswer takes 41 inputs: the build's values by name. SP4/SP5 can shrink it as the binding and the build move
  (a `bind` result object, a `build` result object).
- `fieldsOf(bind).filter((f) => f.agg == null).map(keyOf)` is computed three times in report-run.mjs (FS, the write,
  formatKeys): a candidate for one binding helper in SP4.
- tests.json and CHANGELOG: SP1 and SP3 each add a line in a different place, so their merges should not conflict.

## Lessons for the reviewer
- sp3 is the gate for SP4 (report-bind) and SP5 (report-build): both must pass it unchanged; never re-record
  `fixtures/sp3-answers.json` on a split branch.
- Merge SP1 first or second: the seed module is identical on both; if SP1 changes it later, sp3 must be re-checked.
- create_report's answer depends on the random ids (written files' ids, digests): a new random source shows in sp3 on
  base and branch alike; seed it in `fixtures/sp1/seeded-random.mjs`, never normalise it away.
- Source-reading tests pin report-run.mjs text: write-gate (writeTree() 1, formatsAnswer() 1 in report-run.mjs), sq10
  (each import once), fx2, ts1, sq15b, tt1, bd2. SP4 must keep those calls where the tests look, or move the file names.
