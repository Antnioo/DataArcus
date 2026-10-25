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
- **Resume:** see "Results" (filled as the work lands); the reviewer reviews and merges.

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
