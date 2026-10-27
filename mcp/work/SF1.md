# SF1 (0.3.1): the hard rules proven, the way back to 0.3.0, round 4's text finding

## Summary
- **Approval:** the reviewer's brief "Go on SF1" (27 Oct): lines 3 and 11 of the 0.3.1 release bar; the owner, 27 Oct:
  "get 0.3.1 in a shape that you yourself would back up by every means". Builder; the reviewer reviews and merges.
- **Scope:** 1. the four hard rules (metadata only; nothing written before the approval click, all or nothing; no
  control character written raw by the 0.3.1 writers; every answer and list capped): the map below (rule, path,
  proving test, status), every NEW or CHANGED write path or answer since 0.3.0 that no test covers gets a test, red
  first where a defect is real, then the smallest fix. 2. the way back: two plain lines in `mcp/CHANGELOG.md`'s 0.3.1
  section and `mcp/README.md`'s install section (where the 0.3.0 .mcpb is, its SHA-256, how to install it over 0.3.1).
  3. round 4's unverified finding (18 of 36 visuals kept their own text settings after the bilingual cleanup).
  A new suite `mcp/test-0.3.1-sf1.mjs` (one line in `mcp/tests.json`, area safety). Not the glass twin's files (the
  brief's list), not ST1's items.
- **Base:** `fix/0.3.1-safety-proof` from `origin/integration/0.3.1` 44d1f32. Push only it; never merge, never a PR.
- **Expected checks:** (written before the work) sf1 about 25 checks, red first on 44d1f32 on: R4 (the refusal of
  consistentText and the other redesign-only options outside a redesign, about 6 red), WB (the way-back lines, about 4
  red), and each gap test the map finds (red only where a defect is real; a gap with no defect is a new guard, green
  on 44d1f32 and said so). `npm test -- safety` the base's suites + 1; `-- report`, `-- twin` the same counts;
  check-release, release-text, 0.3.0-claims the same counts and PASS; full run the base's 105 + 1 = 106 suites;
  check-result-lines, changelog-words, check-agent-memory PASS; lint exit 0.
- **Resume:** step 1 (this note) pushed; next the map and the red tests.

## Round 4's finding, reproduced first (before this note)
`.sf1/repro2.mjs` (a scratch script, not committed) on NC1's custom visuals lab (`lab/custom-visuals-lab.mjs`, made up):
plan_layout `{ customVisualsFrom, consistentText: "report" }` gives a plan id with no word about consistentText;
approve_plan; create_report with the same writes "Gulf Retail native" and 18 of its 33 visuals keep their own text
settings (`text-format.mjs` visualText). consistentText works only with redesignFrom (its description says so) and is
dropped silently with customVisualsFrom (and with a new report). The same lab through the route that works (native
copy, then its redesign with consistentText "report", then create_arabic_twin into "same"): 0 of 33, then 0 of 76.
The tester's own report (36 visuals) is not reachable here; the cause matches "a native copy with consistent text".

## Plan
1. This note, pushed first. The base's full run in a separate worktree on 44d1f32.
2. The map (below): each rule's proving tests today (file:line, the suite's PASS line), then the 0.3.1 paths
   (`git diff origin/main origin/integration/0.3.1 -- mcp/server.mjs mcp/tools mcp/lib`) no test covers.
3. Red first in `mcp/test-0.3.1-sf1.mjs` (made-up data only, temp folders under `os.tmpdir()`):
   - R4: plan_layout refuses consistentText, keepPositions, titles and restyle without redesignFrom (a native copy, a
     new report), naming the route (the native copy first, then its redesign with consistentText); create_report with
     a native copy's plan id and consistentText writes nothing; the route end to end leaves 0 visuals of a known type
     with their own text settings in the EN-AR copy.
   - WB: the CHANGELOG's 0.3.1 section names `dataarcus-0.3.0.mcpb`, the releases page and the SHA-256 the MCP page
     publishes for it (one value); mcp/README.md's install section says how to go back; `scripts/check-release.mjs`
     on a release-day copy of the tree (step 2 flipped to 0.3.1) finds no mismatch from the way-back line.
   - one block per gap the map finds.
4. The smallest fixes (`mcp/tools/plan_layout.mjs`, `mcp/tools/create_report.mjs` for R4).
5. CHANGELOG, this note, the full run.
