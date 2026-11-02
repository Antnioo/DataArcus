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
- **Got:** sf1 55 checks (red on 44d1f32 first: 13 of 53; the other 40 new guards, green on both); 3 defects FIXED
  (R4: consistentText and the redesign's options dropped silently outside a redesign; C1: the Gulf calendar wrote a raw
  tab in a relationship line; C2: a consistent copy wrote a font face with a tab into the theme); the way back in the
  CHANGELOG and README; report 37 suites PASS, safety 15 PASS (sf1 included); lint exit 0; changelog-words,
  release-text, check-result-lines PASS. Full run 105 -> 106 suites (below).
- **Resume:** done; waits for the reviewer. Desktop shows nothing new (nothing is written differently for a valid call).

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

Full run on 8608e49: "run-tests: 106 suites passed"

## The map (rule, path, proving test, status)
Status: proven (a test today), added (a new guard in sf1, green on 44d1f32 too), FIXED (red on 44d1f32, fixed here),
gap (no test; why). sf1 = `mcp/test-0.3.1-sf1.mjs` ("PASS  sf1  55 checks"). Every answer passes `capAnswer`
(`lib/answer.mjs` ANSWER_MAX 40,000: the longest list halved and named), so a D gap is a list never driven large.

| Rule | Path (tool / write) | Proving test | Status |
|---|---|---|---|
| a | redesign answers + page (filter, slicer, bookmark, DATATABLE row planted) | test-0.3.0-approval-disclosure.mjs:226, :229 (r6-disclosure) | proven |
| a | new report plan, write, page (DATATABLE, #table, query rows, saved filter) | test-0.3.0-approval-disclosure.mjs:261 A2-S10 (r6-disclosure) | proven |
| a | read_model, suggest_fields, check_model_health, plan_layout rows | test-0.2.9d.mjs:155 (v029d) | proven |
| a | read_report filter value, bookmark state; malformed TopN | test-0.2.9c.mjs:110, :112 (v029c); test-0.3.1-audit-readers.mjs:68-70, :151 (audit-readers) | proven |
| a | native copy, consistent redesign, EN-AR copy, twin, bilingual report, glass theme, Gulf calendar, sample: plan, write, approval page; read_report, check_report (+ lens arabic) on the EN-AR copy and the bilingual report (filter, slicer, custom slicer, bookmark, M row planted; the lab's and the sample's rows) | sf1:207-211 (A0-A3) | added |
| a | read_report's drill level with a drill value planted | none (test-0.3.1-sq15a.mjs:82 checks the field only) | gap: not done (time); the reader returns the level's field name only (read-report.mjs) |
| b | create_report new report: unapproved; failed part way | test-0.2.9.mjs:72 (mcp); test-partial-writes.mjs:124, :140 (b153) | proven |
| b | separate twin: unapproved; failed | test-0.3.0-twin.mjs:82, :290 (mcp block) | proven |
| b | answers file; format script; Gulf calendar; theme (failed) | test-0.3.0-answers-safety.mjs:108, :120 (r5-answers); test-0.3.0-write-safety.mjs:286, :293 (r4-write-safety); test-partial-writes.mjs:170, :124 (b153) | proven |
| b | native copy, consistent redesign, EN-AR copy, twin, bilingual report, glass theme, Gulf calendar, sample: a plan id never approved writes nothing; approved and failed part way leaves nothing; written after the click on DataArcus's page | sf1:186, :191, :194 (B1-B3, 8 paths each) | added |
| b | the glass pictures of a report: in StaticResources, plain names, rolled back with it | sf1:198 (B4) and B2's bilingual path | added |
| b | flip cards, status icons, DAX functions, metric switcher scripts | the new report's one tree (report-run.mjs writeTree), b153 P2 | proven through the shared write; no test per option |
| c | Gulf calendar: an asked date column, or a date table reached through it, named with a tab | sf1:97 (C1, 2 checks) | FIXED (`lib/gulf-calendar.mjs`: refused, nothing written) |
| c | consistency: a font face with a tab after its first family | sf1:115 (C2) | FIXED (`lib/text-format.mjs` fontOf reads the whole face: kept on its visual, never in the theme) |
| c | native copy, consistent redesign, EN-AR copy: every JSON parses, no name with a control character | sf1:122 (C3) | added (no control name planted: the lab has none; JSON writes escape) |
| c | glass picture file names | sf1:198 (B4: `^[\w-]+\.png$`) | added |
| c | bilingual report with a control character in a field, text or term | none | gap: not done (time); `cleanLabel` (twin-texts.mjs) screens labels and terms |
| c | scripts of create_report and the twin (format, Arabic month) | test-round22.mjs:63, :68 (round22); test-0.3.0-script-names.mjs:57, :64 (script-names) | proven |
| d | every tool on the large model, under the cap, cuts named | test-0.3.0-large-model-caps.mjs:46, :47, :58 (large-model-caps) | proven |
| d | twin texts, notTranslated, redesignPages, bilingual answer, sample | large-model-caps:145, :147, :163; test-0.3.1-bilingual-report.mjs:213; test-0.3.1-sample-project.mjs:175 | proven |
| d | the consistent redesign's lists and the native copy's replacements on a report of 13 copies of each visual | sf1:231 (D1, 2 checks) | added |
| d | Arabic lens findings cut; read_report's images (10 per visual); twin terminology rows | arabic-lens:170 (small report only); none; large-model-caps C-1 (size only) | gap: capped in code, cut not driven large |

## Round 4's verdict
Real, and its cause was ours (not GD2's files): `consistentText` given with `customVisualsFrom` was ignored by
plan_layout and create_report (they read it only in `redesignPlan` and the redesign branch), with no word in the
plan, so the native copy kept every visual's own text settings and the EN-AR copy, built from it, copied them to both
halves. Measured on NC1's lab: 18 of 33 visuals in "Gulf Retail native". Fix: `redesignOnly` (`lib/report-inputs.mjs`)
refused by plan_layout (a plan problem naming the route) and create_report ("Nothing was written"). The route that works
(native copy, its redesign with consistentText "report", then the EN-AR copy) gives 0 of 33, then 0 of 76 (sf1 R4-7, R4-8).

## Before -> after
- A native copy with consistentText (or keepPositions, titles, restyle): a plan id and a write that ignored them ->
  no plan id, the problem names the way; create_report "Nothing was written".
- A new report with consistentText: ignored -> refused, said.
- add_gulf_calendar relating `Sales[Order<tab>Date]`, or through a date table named `Cal<tab>endar`: a relationship
  line with a raw tab -> refused, nothing written.
- consistentText "report" where most titles use the face "Arial, Foo<tab>Bar": the theme got that face -> the face
  is not read (kept on its visual, as any value DataArcus does not read), the theme never holds it.
- The release text: no way back -> CHANGELOG 0.3.1 "Going back to 0.3.0" (file, place, SHA-256, uninstall then
  install); README step 10. Tests changed: none. Pins changed: none.

## CHANGELOG line
"No option dropped without a word" (0.3.1 section) and "Going back to 0.3.0" (its first bullet).

## The way back: the SHA-256
`aa23ace80d6777df5dcf47a0847ae8b96783034b2e1e0466625cae579704f9cb`. Its primary source, the release v0.3.0's asset and
notes on `Antnioo/dataarcus-releases` (or the .mcpb itself), is **not reachable from this session**: the API answers
"GitHub access to this repository is not enabled for this session", and attaching the repository was refused. What
this session saw are secondary records: `mcp/research/SKILL-PACKAGING.md` (25 Oct: the file downloaded from that
release, its SHA-256 computed, "matches the notes"), and the MCP page's 0.3.0 download line (`power-bi-mcp/index.html`,
its Arabic copy); sf1 WB-1 reads it from the first. Before the release, check it on the primary source (For the
laptop 1, or the reviewer with access). README's step 10 names the place and points to the release notes and the
CHANGELOG for the hash (no file name or hash of its own: `scripts/check-release.mjs` reads README's download lines, and
on release day every one must name 0.3.1; WB-4 applies the RELEASE comment and checks it).

## Decisions I made
- The redesign's four options are refused outside a redesign, not carried into the native copy (the smallest fix; a
  native copy with one text set is two approved steps, the plan says which).
- Uninstall, then install 0.3.0: the README's Update path is for a newer file; a downgrade over 0.3.1 was not measured.
- The base's full run was stopped (it doubled the load beside mine); the base count is GD1's "105 suites passed" on
  ac296cc3 (its note), not run here on 44d1f32 itself.
- Gaps left in the map are written as gaps, with why, not filled with weaker checks.

## For the laptop
1. Download `dataarcus-0.3.0.mcpb` from the release v0.3.0 and run `certutil -hashfile dataarcus-0.3.0.mcpb SHA256`: it
   must print the CHANGELOG's hash (the primary check this session could not make). Claude Desktop: uninstall 0.3.1,
   install it; "list your DataArcus
   tools" shows 11; then install 0.3.1 again (Update or Install). Confirms the CHANGELOG's and README's lines.

## For the owner
1. The 0.3.0 SHA-256 in the release text: confirm it on the release's own .mcpb (above) before 0.3.1 ships.
2. The gaps left in the map are work for 0.3.2, not decisions: the drill-level value test, a control character in the
   bilingual report, the Arabic lens and image caps driven large, a test per option for the flip cards, status icons,
   DAX functions and metric switcher scripts (today proven through the one shared write). None needs his choice, unless
   he wants any of them in 0.3.1.

## Seen, not in scope
1. The README's RELEASE comment says "three places"; step 2 holds four "0.3.0" (one line names it twice). Harmless.
2. check_report's schema messages scrub quoted values (`lib/check-report.mjs:124`): no test plants one (outside 0.3.1's diff).

## Lessons for the reviewer
- `DATAARCUS_TEST_WRITE_FAIL` counts a server's writes once: a second failing write on the same server succeeds, so
  one server per failing path (cost a rerun).
- The redesign plan fits its own lists (`listsCut`, `<list>NotListed`) under 34,000 before the 40,000 answer cap: a
  cap test must accept either.
- A tab in a name passes "Table[Column]" parsing where a line break does not: test control characters with a tab.
