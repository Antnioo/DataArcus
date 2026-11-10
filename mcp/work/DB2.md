# DB2 (0.3.3): a plan with no report name asks for one (A-DB1-2)

## Summary
- **Approval:** the owner, 10 Nov, D-1110-05 "1 yes yes yes, 2 yes, 3 yes, 5 yes": A-DB1-2 yes (DB1.md, B5 and "For the owner" 1). D-1109-07 and D-1027-03/04 bind any Arabic text.
- **Base:** `fix/0.3.3-db2` from `origin/integration/0.3.3` at cd4ea0c0. Push only this branch; never merge, no PR.
- **Scope:** `mcp/tools/plan_layout.mjs` (limitsStep: one planProblem line), new `mcp/test-0.3.3-db2.mjs` + its row in `mcp/tests.json`, `mcp/CHANGELOG.md`, `mcp/WORK.md`, this note; plus any test that pins the old answer, each named under "Changed on purpose".
- **Expected checks:** `node scripts/check-modules.mjs --strict`; db2 new, red on cd4ea0c0 first; the report, core, checker and arabic areas green; lint 0; CI green.
- **Plan:** measured on cd4ea0c0 (below): a plan with path, no name gets an id, approve_plan approves it, create_report refuses ("Give create_report a name"). Fix: in limitsStep a planProblem when path is given, no name, and no customVisualsFrom (a native copy needs no name; redesignFrom returns before limitsStep). English sentence, no Arabic text added.
- **Resume:** 2026-11-10T13:49Z: fix, db2 and the pinned suites done and pushed; the reviewer's merge after CI green (below).

## Measured on cd4ea0c0 (test server, made-up tiny model, 2026-11-10T12:18Z)
- plan_layout { path: tiny, layout: exec } (en): plan id given, status proposed, exactCheck "notBuilt", no planProblems.
- approve_plan on it: approved (approvedBy user-in-browser), allows create_report, writes "the report \"<name>.Report\"".
- create_report { path, planId }: error "Give create_report a name for the new report (Report name)."
- Same with lang ar: the same three answers (plan id, approved, refused).

## Before -> after
- plan_layout (path, no name): a plan id, exactCheck "notBuilt" -> no plan id, one planProblem: "Give the report a name (name): create_report writes no report without one, so there is no plan to approve yet." (the same shape as the other planProblems, pushed in limitsStep next to the planFields line). Not for customVisualsFrom (create_report needs no name for a native copy) and not for redesignFrom or sample (they return before limitsStep, and the sample has no model path).
- db2 (new): "PASS  db2  10 checks"; red on cd4ea0c0 first (the same test file against the unfixed plan_layout: "FAIL v... 5 of 10": en and ar have a plan id and no planProblems, 4 checks; the 5th was my own create_report call passing name, fixed in the test, not in the code). A named plan: plan id, exact check pass, approved, create_report writes the .Report and .pbip; the sample plan asks for no name.
- Arabic: the new planProblem is English, like every other planProblem in plan_layout's answer (they are not translated); no Arabic text added or changed, so nothing for the owner's approval (D-1109-07).
- Areas (each read from its run's file): report, core, checker, arabic; then model, safety, twin, platform, release: every suite PASS after the changes below; mutation "250 checks (99 mutants, all killed, 47 guard suites)"; test.mjs "mcp 1595 checks" green.

## Changed on purpose (suites that planned with a model and no name; each now gives the plan a name; no expected number changed)
- test-0.2.9.mjs (L5, G9), test-0.2.9b.mjs (O-13), test-0.2.9d.mjs (R3, T1), test-0.2.9i.mjs (G11, G6), test-0.2.9-sweep.mjs (the preview line loop), test-b146.mjs (the plan helper), test-r.mjs (R-04's good name, and the A-02 theme-and-name check keeps a plan name), test-z.mjs (Z-01), test-0.3.1-aud047.mjs (I3, W3).
- test-0.3.3-db1.mjs V2: it reached previewOf's displayNames through the no-name route, now gone; V2 plans with a name (exactCheck pass, the preview from the exact files shows "Revenue Now"). Measured: no other input gives exact null without planProblems (sample refuses displayNames; a native copy has no preview; odd names do not stop the build), so V2's no-exact-files branch is now unreachable: said under Seen.
- Every other suite that plans without a name is a call that errors earlier or checks only a refusal (read in the grep list), and all passed unchanged.

## CHANGELOG line
- A plan for a new report with no report name is no longer given a plan id: the plan asks for the name first, so a plan that `create_report` would refuse can no longer be approved.

## Decisions I made
- The condition is path, no name, no customVisualsFrom: that is exactly where create_report's name check applies (writeApproved) and where plan_layout builds the exact artifact.
- One line and one comment line added after the planFields line, not on the long Top N line (L-1103-06).
- The test suites above got a name instead of an expected-number change; a name only adds the report's name to the plan.
- No Arabic sentence was drafted: planProblems are English everywhere.

## For the owner
none

## Risky changes
none: no file a report writes changes; only an unnamed plan, which could not be written, now says so before the go.

## For the laptop
none

## Seen, not in scope
- previewOf's `files ? ... : none` (the build-from-the-plan route, V2) looks unreachable now: DB1 kept it as reachable only through a plan with no name. Left; a cleaner can remove it.
- A report name of only spaces ("  ") gives a plan id and passes the exact check: create_report may or may not accept it; not measured.

## Lessons for the reviewer
- A rule that refuses a plan reaches suites in areas the brief did not name (aud047 in model, mutation's baseline v029 and v029d): the grep by `plan_layout` and no `name` found 20 call sites; the mutation suite fails on its baseline before it reports anything, so run it last.
- Run test.mjs once alone: it runs every v029 suite in-process, so one unnamed plan shows as many lines there.
