# AF2 (0.3.1): the write paths from the critical release audit

## Summary
- **Approval:** the owner, 25 Oct ("Go on AF2"), after an outside audit (25 Oct, on integration/0.3.1 6ff218c; the
  reviewer re-checked each point on 1fdf031): F06-F10 on the write paths. The promise: what is written after the go
  is exactly what the plan showed, or nothing is written.
- **Scope:** F08 the native copy and the redesign (`lib/native-copy.mjs`, `lib/redesign.mjs`, `tools/plan_layout.mjs`,
  `tools/create_report.mjs`); F09 file names chosen at write time (`lib/fix-scripts.mjs`, `lib/report-run.mjs`,
  `tools/check_model_health.mjs`, `tools/add_gulf_calendar.mjs`, `lib/gulf-calendar.mjs`, `tools/generate_theme.mjs`,
  `lib/files.mjs`); F10 the last model check (`check_model_health`, `add_gulf_calendar`); F07 the answers file's temp
  (`lib/answers.mjs`). F06: not fixable in Node's path API (AF1 writes the limit in PRIVACY.md). Not AF1's files
  (read-report.mjs, twin-plan.mjs, dax-functions.mjs, arabic-lens.mjs, PRIVACY.md).
- **Base:** `fix/0.3.1-audit-writes` from `origin/integration/0.3.1` (1fdf031).
- **Expected checks:** a new suite `PASS  audit-writes  30 checks` (red first on 1fdf031); mutation 62 -> 65 mutants,
  all killed; `test-0.3.1-write-gate` 4 -> 4 (its list of write calls updated, as it requires for a changed call);
  every other result line the same name and count (any call a test must change because a refusal now comes earlier:
  said under "Decisions I made").
- **Resume:** built and pushed (Results below); the reviewer reviews and merges. Nothing left for this job; "Seen, not
  in scope" waits for the owner.

## What is wrong (read in the code on 1fdf031)
- **F08.** The main create_report build is pinned (`tools/plan_layout.mjs:50-65` exactArtifact, `tools/create_report.mjs:70-74`
  writeApproved), but neither copy mode goes through it: `plan_layout.mjs:381` gives the native copy no `planPin`, so no
  exact artifact; `plan_layout.mjs:121` proposes the redesign with no `attached`. `writeNative` (`lib/native-copy.mjs:64-99`)
  rebuilds and rereads the source, a new logical id (`:90`) and the .pbip read at the write (`:91`); `writeRedesign`
  (`lib/redesign.mjs:423-442`) the same (`:437` a new id, `:441` the .pbip). The source print sees the .pbip only when
  the path given is the .pbip, so a .pbip next to a `.Report` path changed after the go is written unseen.
- **F09.** `writeScript` (`lib/fix-scripts.mjs:19-24`) picks a free name at the write; check_model_health's plan shows
  the plain name (`tools/check_model_health.mjs:70`), formatsAnswer too (`fix-scripts.mjs:57`); create_report writes the
  format script after the tree, outside the digest (`lib/report-run.mjs:397`); the Gulf calendar names it at the plan but
  writes another name if it is taken (`gulf-calendar.mjs:135`, `add_gulf_calendar.mjs:57,78`); generate_theme picks a
  free name after the gate (`tools/generate_theme.mjs:73`, `lib/files.mjs:173-175`).
- **F10.** `check_model_health` (gate `:86`, writes `:72`, `:159`) and add_gulf_calendar's full calendar (`:48-57`) don't
  read the model again right before the first write, as the Arabic-columns branch does (`:78`, `sameModelBeforeWrite`).
- **F07.** `lib/answers.mjs:62-69`: the temp is unlinked by name on a failure, whatever is at that name by then.

## The fix
1. **F08, as K2 did for the twin.** The logical id is chosen once at the plan; the plan builds the whole tree (the report
   files, the .pbip) with `digestOf`, keeps it (`Plans.attach`) with `bindingOf(digest, pin, modelPrint)`. create_report
   checks the binding against the approval (as the twin's tool does); the writer runs every check of today, then the kept
   files' digest and a rebuild's (the plan's logical id) against the approved digest, then `writeTree` of the KEPT files.
   No kept files: refused. The main path's writeApproved refuses a copy's artifact (it has no `finish`).
2. **F09.** One helper, `writePlannedScript(dir, name, script)`: the name the plan chose and showed, written new, or the
   same script already there (named, nothing written), else "Nothing was written: ... is already there: make the plan
   again"; never another suffix. Every plan names the file with `writeScript(..., plan = true)` (the free name now) and
   keeps it in its data. create_report's format script joins the build's files (inside the digest, written by the one
   `writeTree`). check_model_health checks every planned name before its first write. generate_theme: the free name at
   the plan (no folder made: `freeName`), the write refuses if it is taken (`folderFor` makes the folders).
3. **F10.** `sameModelBeforeWrite` before the first write of check_model_health and the full Gulf calendar.
4. **F07.** The temp written through `createFile` (its identity and hash) and removed by `rollBack`: only while it is
   still the file this call made; another file at that name is left and named.

**Tests first (red on 1fdf031).** New `mcp/test-0.3.1-audit-writes.mjs` (in process, the tools' own handlers, the fixtures
`twin-project` and `health-project`, made up). F08 native and redesign, each: the plan keeps the files and says their
digest; written tree = the plan's digest; the written logical id is the plan's; the .pbip next to the report changed after
the go -> "Nothing was written", nothing written (10). F09: check_model_health, the Gulf calendar (full and Arabic
columns), generate_theme: the plan shows the free name when the plain one is taken; that shown name taken after the go
-> refused, nothing written, the other file untouched (12); create_report's format script is in the plan's digest and
its name taken after the go -> refused (2). F10: the model edited right before the write (`DATAARCUS_TEST_EDIT_BEFORE_WRITE`)
-> refused, nothing written, check_model_health and the full calendar (4). F07: the temp replaced before a forced failure
-> the other file survives (2). Mutants: `AF-copy-digest` (native's digest comparison skipped), `AF-taken-name`
(writePlannedScript writes another suffix), `AF-health-model` (check_model_health's model check skipped).

## Results
**Red first (1fdf031 + the new suite only):** `FAIL  audit-writes  28 of 30 checks`; the two that passed were already
true (AF-G1: the full calendar's plan already named its free name; AF-F2: the answers file kept). After the fix:
`PASS  audit-writes  30 checks`.

**Each finding, before -> after.**
- **F08.** Native copy: no artifact (`tools/plan_layout.mjs:381` planPin null for customVisualsFrom) -> `lib/native-copy.mjs:
  nativeTree` builds every file (logical id given), `nativeArtifact` keeps them at the plan (`plan_layout.mjs` cvArt,
  attached with `bindingOf(digest, proposedPin, modelPrint)`); `writeNative(..., art)` refuses with no kept files, then
  compares the kept digest and a rebuild's with the plan's logical id, and writes the kept files. Redesign: `redesign.mjs:437`
  new id at the write -> `planRedesign` chooses `logicalId` once and builds `tree` (`copyTree`, the .pbip included);
  `plan_layout.mjs: redesignPlan` attaches it; `writeRedesign(..., art)` compares and writes the kept files.
  `tools/create_report.mjs: keptCopy` checks the binding for both; the main path refuses a copy's artifact. Tests AF-N1-5,
  AF-R1-5 (the .pbip next to a `.Report` path edited after the go: "Nothing was written", was written unseen).
- **F09.** `fix-scripts.mjs: writeScript` (a free name at the write) -> `freeScriptName` (the plan's name, writes nothing),
  `plannedTaken`, `writePlannedScript` (the plan's name, the same script already there named again, else "Nothing was
  written: ... is already there ... Make the plan again"). check_model_health: the plan keeps `scriptNames`, the write
  queues every script and checks every name before the first write (AF-H1-3). Gulf calendar, both branches:
  `add_gulf_calendar.mjs: plannedWriter` writes the plan's `outputs[0]` (AF-G1-3, AF-A1-2; `gulf-calendar.mjs:135` passes
  a "Nothing was written" refusal on as it is). create_report's format script: `report-run.mjs` puts it into the build's
  files (inside the digest, the one `writeTree`), the finish only names it (AF-C1-3); `report-run.mjs:399` was outside
  the digest: yes, it was. generate_theme: `files.mjs: freeName` at the plan (no folder made), the plan keeps `file`,
  the write refuses a taken name before `folderFor` makes any folder (AF-T1-3).
- **F10.** check_model_health: `sameModelBeforeWrite(planId, () => loadModel(p).print, print0)` before its first write
  (scripts or answers file); the full calendar: in `plannedWriter`, before the write (AF-H4-5, AF-G4-5).
- **F07.** `answers.mjs` unlinked the temp by name -> written through `createFile` (identity and hash) and removed by
  `rollBack` only while it is still the file this call made; another file at its name is left and named (AF-F1-2).
- **F06:** not attempted (AF1 writes the limit); see Seen 2.

**Mutation:** `AF-copy-digest`, `AF-taken-name`, `AF-health-model`, each killed by audit-writes. Full suite:
`162 checks (62 mutants, all killed, 33 guard suites; equivalent, not run: G-artifact, W-size, W-free-real)`, 65 in
all (was 62: 59 run).

**Touched suites, before -> after:** redesign 49 -> 49, redesign-overlay 29 -> 29, shared-axes 33 -> 33, j14 30 -> 30,
write-gate 4 -> 4, r5-answers 34 -> 34, r4-write-safety 46 -> 46, b153 37 -> 37, approval-hardening 22 -> 22,
approval-complete 25 -> 25, r6-disclosure 37 -> 37, arabic-calendar 31 -> 31, script-names 9 -> 9, sweep-s1 30 -> 30,
b148 28 -> 28, golden 12 tasks, twin-artifact 21 -> 21; audit-writes new, 30. `check-result-lines` 76 checks,
`check-agent-memory` 89 checks.

**The full run** (`cd mcp && npm test -- --keep-going`, Linux, once): 75 of 76 suites PASS; `FAIL  mcp  1591 checks` on
one check of test.mjs (r12b-fmt: "plan_layout with the model must say the formats first, with the health check's own
file"). It expected the plan to name check_model_health's file; the report's script holds its own fields only (0.3.0
F7), so the old write wrote "Fmt - fix formats 2.tmdl" under a name the plan never showed: F09 itself. The check now
expects the free name the plan gives (Decision 4), same check and count; then `node test.mjs` alone: `PASS  mcp  1591 checks`. So 76 of 76, every name and count as before plus audit-writes 30.
`DA_SHARD=1/4 npm test`: `PASS  mcp  33 checks (shard 1/4)`.

## CHANGELOG line
- **Every write is exactly what you approved, names included:** a native copy of a report's custom visuals and a
  redesign now keep every file they will write from the plan and write those same files after your go; a fix script,
  a calendar script or a theme file is written under the name the plan showed, and if that name is taken by then,
  nothing is written and you are asked to plan again; the health check and the Gulf calendar read your model once more
  right before writing.

## Decisions I made
1. As K2: a rebuild at the write is kept for comparison only; the bytes written are the kept ones.
2. The same script already at the planned name counts as the planned outcome: it is named again and nothing is written
   (as before, the file "already holding exactly this script"); any other file there refuses the whole write.
3. check_model_health checks every planned name and the model before its first write, so a refusal writes nothing at all;
   a write that fails part-way still follows planWrites (each failed script said, the others written), as before.
4. Test calls changed, same checks and counts: test.mjs r12b-fmt (above); test-0.3.0-write-safety C1 (the stuck failure
   aimed at the format script inside the tree, file N - 1, where it was the (N+1)th write after the tree: the whole
   tree now rolls back and only the stuck script is left, named); test-0.3.0-answers-safety F04-1/1b/4 (the swap hook
   on the temp's open, as createFile writes through a handle); test-approval-hardening B152-11 (writeNative gets its
   plan's `nativeArtifact`, as K2 did for writeTwin); test-0.3.1-write-gate's list (writePlannedScript, folderFor,
   createFile/rollBack in answers.mjs; each with why).
5. The plan's outputs list names the format script once (it is one of the exact files now; it was added a second time).
6. ARCHITECTURE.md's step 4 says "every report and the twin" (the 5,200-character cap leaves no room to say names too).
7. generate_theme refuses a taken name before making any folder (the check by name, then `writeFileNew`'s 'wx' link).

## Seen, not in scope
Status of these items: [mcp/work/SEEN-QUEUE.md#af2](SEEN-QUEUE.md#af2)
1. `mcp/TOOLS.md` create_report: "picks a free name"; the write refuses a taken report name (writeTree), it picks none.
2. F06: no cheap narrowing found; every new write here goes through 'wx' or a link (a name taken in between fails), so
   what remains is the folder-path race AF1 documents.
3. The format script's sentence "(the same file check_model_health writes)" (plan_layout, fix-scripts FORMAT text) is
   true only when that file holds the same script; after a health check on the whole model the report's is a new file.
4. When a script identical to the plan's is already there, the plan's outputs still list it as written (as before).
