# TK1 (0.3.2, first batch): fewer tokens in every conversation, and every answer capped

## Summary
- **Approval:** the reviewer's brief "TK1" (1 Nov); the owner D-1101-01 (0.3.2 starts with the rest of the MCP
  review), his 0.3.2 order of 1 Nov (B-272 and B-273 first), D-1027-13 (0.3.1's bar not disturbed), D-1027-17.
- **Base:** `feat/0.3.2-tk1` from `origin/integration/0.3.1` at b40cb78 (integration has since moved to 43bc41b:
  not merged in; the reviewer merges after 0.3.1 ships). Pushed only this branch.
- **Scope:** the tool layer: `tools/create_report.mjs`, `tools/plan_layout.mjs`, `lib/report-inputs.mjs`,
  `lib/tool-inputs.mjs`, `lib/tool-answer.mjs`, `lib/answer.mjs`, `lib/scope.mjs`, `lib/read-report.mjs`,
  `lib/plans.mjs` (a read-only `inputsOf`; the gate unchanged), `lib/agent-text.mjs`, `lib/sample-project.mjs`,
  the skill (and its packaged copies), TOOLS.md, the test helper `test-plan.mjs`, the suites and lab drivers that
  called create_report with plan options. New suite `test-0.3.2-tk1.mjs` (core). No `assets/js/` change.
- **Expected checks:** (written before the work) tk1 about 16, red first where behaviour changes. **Got:** tk1 15
  checks (K1-K8, F1-F3, E1-E2, L1-L2), red on b40cb78 first: 14 of 15 failed there (K2, the plain typo words, is the
  guard). Other suites: each move named below; counts unchanged except where named.
- **Numbers:** tools/list 98,360 -> 70,380 characters (create_report 30,749 -> 1,909); plan_layout's sample answer
  3,640 -> 3,150 (20% -> 10% spaces); check_report and the twin's plan unchanged (already flat).
- **State: DONE.** Full run on 942eba24: "run-tests: 134 suites passed"; CI on the branch started after it. Mutation: 76 mutants, all killed (the gate's included).
- **Resume:** none; the reviewer's merge after 0.3.1 ships.

## Before -> after (measured: `node mcp/scripts-measure-tokens.mjs`, b40cb78 -> 942eba24)
- tools/list: 98,360 -> 70,380. Per tool: create_report 30,749 -> 1,909; plan_layout 32,133 -> 32,993 (+860: the
  three guidance sentences and the B-88 display-name rule moved from create_report, below); the other nine unchanged
  (read_model 1,104, suggest_fields 2,745, check_model_health 5,290, generate_theme 5,650, check_report 3,420,
  read_report 3,025, add_gulf_calendar 5,444, create_arabic_twin 6,462, approve_plan 2,316).
- Answers: plan_layout {sample:true} 3,640 -> 3,150 (spaces 20% -> 10%); check_report on the twin fixture 14,487 ->
  14,487; create_arabic_twin's plan on the twin fixture 17,699 -> 17,699 (both were already flat: compact()). Golden
  task 10: read_model detail 4,826 -> 3,559, suggest_fields 6,059 -> 3,928.
- `create_report {path, planId, design, layout...}` (the old shape): wrote when the values matched the plan ->
  `Nothing was written: 'design', 'layout', ...: the approved plan holds these inputs (plan_layout's), so
  create_report takes only path and planId: call it with those two. To change them, call plan_layout again with the
  new values, show the user the new plan and wait for their go.` A real typo keeps MR1's words.
- An error of 114,021 characters -> capped at 40,000 with the cut said. 500 unknown keys: a 10,087-character error
  -> 20 named "and 480 more".

## The design (B-272)
plan_layout already pinned create_report's inputs (reportPin, compared key by key by the gate). It now also keeps the
exact input object it pinned from (`data.inputs.create_report`: `heldInputs`, report, redesign and sample plans).
create_report takes `path` and `planId`, takes the rest from the plan, and recomputes the pin from them: the model is
read again (its print), the theme, logo, backgrounds and a copy's source are read and hashed again, the gate compares
every pinned key, and the write checks the artifact's digest and the approval's binding, all as before. So what is
written is still exactly what was approved; an input can no longer differ from the plan (there is none to pass).

## CHANGELOG line
- **Shorter tool descriptions and answers:** fewer tokens in every conversation; every answer, errors too, within the
  cap.

## Decisions I made
- create_report's inputs: `path` (the model is read again and compared with the plan's print; the sample's folder)
  and `planId`. Not `sample`, `lang`, `name` or `fields`: the plan holds them. Without a plan it reads the model first
  (a broken model is named first, as before), then gives the gate's own refusal.
- The refusal of an old-shape key: one place, `heldSaid` in report-inputs.mjs, through MR1's `strictInputs` (a new
  optional `said`); it starts "Nothing was written", names each key and says to call plan_layout again.
- The guidance that only applies when planning (a card's true label, page filters, the closest supported visual) and
  displayNames' B-88 rule moved to plan_layout's description and input, where those choices are now made.
- Flat answers: `text()` is `compact()` for every object answer. The tools' own list cuts still measure pretty JSON
  against AIM, so an answer keeps exactly the items it had; only whitespace goes (the cap's value untouched).
- One limit: `ANSWER_MAX` (answer.mjs); scope.mjs `LIMIT = ANSWER_MAX`, `AIM = ANSWER_MAX * 0.85` (34,000);
  read-report.mjs `READ_CAP = ANSWER_MAX`. L1 counts number literals 40000 in lib/ and tools/: answer.mjs, and
  report-fields.mjs's SVG design input limit (what a person may pass, not an answer), named in the check.
- tk1 K4 is "create_report's entry under 3,000 and tools/list under 75,000" (the plan said under 70,000: the list
  ended at 70,380 after the moved guidance; a bound 4 characters away would fail on any later description).
- The suites: a call meant to write sends `{ path, planId }` (rewritten with a parser, each site reviewed); a check
  that refused another value keeps that value (now refused at the inputs, "Nothing was written", the key named).
  Checks of "an input left out is refused" (redesign C7, cs1 T11) became "another value is refused": leaving one out
  no longer exists. Option-schema checks read plan_layout's inputs and assert create_report lacks them.

## For the owner
none

## Risky changes
- **The approval step:** create_report now writes from the inputs the plan kept, not from inputs the assistant passes
  again. The gate (lib/plans.mjs `gate`), the pins, the file prints, the model print, the digest and the approval's
  binding are unchanged and still checked on every write; the mutation suite kills all 76 mutants as before, the
  gate's included. Before, a different value passed at the write was refused by the gate; now it is refused by the
  inputs (and cannot reach the write).
- **What an answer returns:** every answer is flat JSON (same content, no indentation); an error over 40,000
  characters is cut and says so; a schema error names at most 20 keys. create_report refuses plan_layout's options.
- **Tests:** no check removed. Checks that moved meaning, each named: test.mjs (descriptions and displayNames read
  from plan_layout; "neither pages nor design" refused at the inputs; the small fixtures' read_model hashes, flat),
  redesign C7, cs1 T11, sq3 A3-S1a, r4a A1-A3/B4 (the "pass fields.slicers either way" text is gone with the input),
  fx5b S1-S3 and C3 (C3 through the registered schema), sq9 T2 (create_report has no tables input), audit6 A6-16,
  flip-cards S1, theme-icons S1, dax-functions S1, shared-axes M1, look-options S1/S4, gallery-reachable S1,
  waterfall-native-look S1/S2, golden task 9 message and task 10 sizes ("why" in golden-expected.json).

## For the laptop
- The lab drivers (`mcp/lab/*.mjs`, not lab/evidence) now call create_report with path and planId; a laptop run of
  the custom-visuals, glass, text-sizes, pills and bilingual labs uses them.

## Full run
Full run on 942eba24: "run-tests: 134 suites passed"
(tk1 15, mr1 26, mutation 198 checks: 76 mutants, all killed; the base's suites plus tk1.)

## Seen, not in scope
- `test-0.3.1-glass-tables.mjs` N0 reads `git show cba24a5`: it fails on a shallow clone (this container's first
  runs); CI fetches with depth 0.
- `test-rc24.mjs` (another builder's file, fix/0.3.1-mx3): one line changed, its create_report call (line 76), as the
  shape needs; a clash there is that one line.

## Lessons for the reviewer
- An option shared by two tools' schemas was checked "in both" by about 15 suites: a schema change of one tool moves
  them all. A check of "plan_layout takes it" alone would have held.
- Suites that call a handler in-process (fx5b) skip the inputs the server checks: their refusal checks must parse
  through the registered schema.
- The mutation suite caught what the first pass missed: guard suites refused at the schema, so the gate's mutants
  survived; its baseline line names it.
