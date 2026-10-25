# RB (0.3.1, wave 6): T1's "Seen, not in scope", fixed (25 Oct, builder)

Branch `fix/0.3.1-rollback-identity` from `origin/integration/0.3.1` (ddae546: T1 merged). Push only this branch; no
PR, never merge (the reviewer reviews and merges). The owner, 25 Oct, about T1's "Seen, not in scope": "can we fix seen
not in scope?" This is that fix. Others now: GC, Q1, A1 (stay out of their files: Q1's branch touches
`lib/check-report.mjs` line 298 and `test-models/golden-baseline.mjs`'s imports; this branch edits neither).

## Plan (each red first)
1. **The rollback's identity (T1 Seen 1, safety).** `lib/write-io.mjs`: `createFile` records a sha256 of the bytes it
   wrote (from the data in memory, as the answers file hashes what it read; a write cut off part-way: the hash of the
   bytes that landed, `data[0, size)`, size from fstat of the same handle), and `removeOurs` removes a file only when
   dev, ino, size AND the hash still match. The hash at removal is read through a handle opened without following links,
   whose own dev, ino and size are compared too. A mismatch is "changed": the file is left and named like any other.
   writeFileNew's linked file carries the temporary file's hash. Folders keep the dev/ino rule (no bytes); a folder is
   never removed while not empty (rmdir, and rollBack names what it holds that this call did not create: already so,
   pinned by S2).
   Tests (`test-0.3.0-write-safety.mjs`, red today):
   - S2d: writeTree, a file of the tree is deleted and a file of as many bytes, other content, written at its name (on
     ext4 the inode number is reused: the real case; the check says whether it was) - survives, named, its folders stay.
   - S2e: writeTree, a file of the tree rewritten in place with as many bytes (same dev, ino, size on every OS: the
     identity the reuse gives, without relying on the file system) - survives, named.
   - S2f: writeFileNew, the placed file rewritten in place, same size, before the rollback - survives, named.
   - S2g: a write cut off part-way, its half rewritten in place by another program before the clean-up - survives.
   Mutation suite: mutant W-hash (removeOurs' hash check dropped), guards write-safety, partial-writes.
   Cost: measured (the largest report a suite writes: every file of it hashed, and its largest file), said below.
2. **The golden baseline's 6 "load" differences (T1 Seen 4).** Reproduced before any change: they are not load. They
   are exactly task 11's six fields, and task 11 reads `scripts/gulf-calendar/test-model/*.dax`, which the mutation
   suite's copied tree does not hold (it copies `mcp/`, `assets/js`, `assets/data`, `scripts/tests`): ENOENT. Alone in a
   copy without `scripts/gulf-calendar` it fails the same 6; in the repo it passes. Fix: the copy also holds
   `scripts/gulf-calendar` (read only). Then the golden baseline is a guard again: added to V-rows' guards (after
   test-0.2.9d), and checked to kill V-rows on its own (`DA_MUTATION_ALL=1`). Also checked once beside 3 other suites
   in the real tree, to rule load out.
3. **The known-validator-gap path (T1 Seen 5).** Kept, reached by a fixture: the path is the designed place for the
   next proven catalog lag (`scripts/microsoft-watch.mjs` W6 names `VALIDATOR_GAPS` as what to update when the catalog
   pin moves), so removing it would remove a mechanism, not dead code. A new suite `test-0.3.1-validator-gap.mjs`
   (checker area, one line in `mcp/tests.json`) copies `mcp/` with Microsoft's two packages copied (the rest of
   node_modules linked) and the catalog's `slicer.dropdown` removed (the shape catalog 0.1.1 had), then runs the copy's
   server and calls check_report on the twin fixture with a Dropdown slicer in the proven rounded box: the validator
   reports PBIR_FORMATTING_OBJECT_UNKNOWN, check_report makes it a known note ("Desktop opens it", evidence, counts);
   one more property: it stays the validator's error ("can break"); the real tree: no finding (today's answer, unchanged).
   No product code changes for this item. The suite is a guard of C-known too.
4. **The rest of T1's list.** Seen 2 (defence in depth no tool reaches: G-artifact, W-free-real) and Seen 3 (behaviour
   guarded only by test.mjs parts, already given fast checks by T1) are not product weaknesses: listed for the owner,
   no change. The older T1 (0.3.0) "Seen" lines are wording and layout items, not safety: not this job.

## Expected numbers (written before any run)
- `test-0.3.0-write-safety.mjs`: 41 -> 45 checks (S2d, S2e, S2f, S2g); before the fix: S2d (where the inode is
  reused: this container's ext4 reused it 20 of 20 times), S2e, S2f and S2g fail; after: 45 PASS.
- `test-partial-writes.mjs` 37, `test-0.3.0-answers-safety.mjs` 34, `test-0.3.0-powerbi-2026-10.mjs` 26: unchanged.
- `test-0.3.1-validator-gap.mjs`: new, 5 checks PASS (no red phase: no product change; it is red with C-known).
- golden baseline: PASS alone (12 tasks), and PASS in a copy that holds `scripts/gulf-calendar` (FAIL 6 without).
- mutation suite: 148 -> 152 checks (W-hash: +1 kill, +1 applies once; guard baselines 29 -> 31: golden baseline,
  validator-gap); 59 mutants, all killed; run time about 2.5 -> 3 min.
- `node scripts/check-result-lines.mjs`: 73 -> 74.
- full `npm test -- --keep-going`: 74 suites PASS (73 + validator-gap).
- Cost of the hash: under 10 ms for the largest report a suite writes (a few MB at several hundred MB/s).

## Results (25 Oct)
Commits (`fix/0.3.1-rollback-identity`): dc0e197 plan; 4b05b43 red tests S2d-S2g; 4a40003 the rollback's content hash
(with S2h, W-hash, W-size equivalent); 932f61b the mutation copy holds `scripts/gulf-calendar`, golden baseline a guard
again; fe96c24 the validator-gap suite; then this note.

**1. The rollback's identity.** Red first: `r4-write-safety` 45 checks, 4 failed (S2d with the inode number really
reused on this container's ext4, S2e, S2f, S2g: each time the rollback removed the other program's file and said
"Nothing else was touched"). The fix (`lib/write-io.mjs` only): `createFile` writes the bytes as one Buffer and records
their sha256 (for a write cut off part-way: the hash of the first `size` bytes, size from fstat of the same handle);
writeFileNew's linked file carries the temporary file's hash; `removeOurs` first keeps every check it had, then
`sameBytes` opens the file read-only with `O_NOFOLLOW` (where the system has it), compares that handle's dev, ino and
size with the record and hashes its content; a mismatch, a missing hash or any error is "changed": left and named. Folders
keep dev + ino (no bytes); `rmdir` refuses one that is not empty and rollBack names what it holds (S2 pins it).
After: 41 -> 46 checks PASS (S2d-S2g, and S2h: see Decisions 2). `b153` 37, `r5-answers` 34: unchanged, PASS.
**Cost** (measured on the largest report the golden baseline writes, `Golden Long Names.Report`: 103 files, 343,552
bytes, largest file 23,002 bytes): hashing every file at the write 0.51 ms for the whole report; at a rollback (read +
hash every file) 1.29 ms; the largest file 0.018 ms. A 2 MB background image would add about 4 ms. Only a failed write
reads files back.

**2. The golden baseline's 6 differences.** Not load: reproduced alone, without any parallel work, in a copy built as
the mutation suite builds it: `FAIL golden 12 tasks, 6 differences`, all task 11 (error ENOENT on
`scripts/gulf-calendar/test-model/measures.dax`, then uae, ksa, scored, sameScore, overwritten undefined). Task 11 reads
that folder from the repo, and the copy held only `scripts/tests`. Fix: the copy also holds `scripts/gulf-calendar`
(test-only, `test-0.3.1-mutation.mjs`). Checked: the golden baseline passes on the copy under the four workers (its
baseline in the mutation run), passes in the real tree beside three other suites (fuzz, layouts, twin-complete), and
kills V-rows on its own (`DA_MUTATION_ALL=1 DA_MUTATION_ONLY=V-rows`: killed by test-0.2.9d, golden-baseline). Added to
the suite: yes, as V-rows' last guard (it runs only when the first three let a mutant through, so the default run pays
only its baseline, about 35 s inside the pool).

**3. The known-validator-gap path.** Kept, reached through a fixture (Decisions 3). `test-0.3.1-validator-gap.mjs`:
`PASS validator-gap 5 checks` in 2 s; C-known killed by it and by test-0.2.9-a4. check_report's answers today:
unchanged (no product code touched; VG-2 checks the real tree's answer).

**Mutation suite:** `PASS mutation 151 checks (58 mutants, all killed, 31 guard suites, 144s; equivalent, not run:
G-artifact, W-size, W-free-real)`. 151 = 58 kills + 58 applies-once + 31 guard baselines + 1 unique ids + 3 equivalent
texts. Expected 152 with 59 mutants: W-size became equivalent (Decisions 1), so 58 mutants run (W-hash in, W-size out).
**Other checks:** `check` 31, `test-0.3.1-checker` 23, `powerbi-2026-10` 26: PASS, unchanged. `node
scripts/check-result-lines.mjs`: PASS 74 (73 -> 74).

**5. check_report's summary (the reviewer's item 5, 25 Oct 14:36, from an outside architecture review).** check_report
never opens Power BI Desktop, yet its summary said "The report opens in Power BI Desktop: it is not broken." and "Nothing
found: the report opens in Power BI Desktop and passes the checks that ran." Grep of the repo for the claim: it is said
as a check's result only in `lib/check-report.mjs` (`impactSummary`, and the answer's `tellUser`); `agent-text.mjs`,
TOOLS.md, the READMEs, the MCP page EN/AR, the lens, the twin's and create_report's answers do not say it (TOOLS.md and
the `desktopOpens` kind's own sentence state the measured Desktop fact, "Power BI Desktop opens the report with these
(seen on a working hand-built report)": kept, as are "can break" and "only strict validation or Fabric would refuse").
Red first: `0.3.0-claims` 232 checks, 6 failed (the new RB-5 block: 5 sources x 6 old sentences, 202 -> 232);
`v029a4` 40, 1 failed (A4-3). The fix (`impactSummary` only): every "nothing found" line is now "Nothing found that
Power BI Desktop is known to refuse (Microsoft's validator, the schemas and DataArcus's measured rules ran; Power BI
Desktop itself was not opened)." with the list built from the groups that ran (`checks` passed in; e.g. "Microsoft's
validator and DataArcus's measured rules ran" with `checks: ['validator', 'sizes']`); "; Desktop opens the report with
them" became "; Power BI Desktop was seen to open reports with them"; "Not judged whether Power BI Desktop opens the
report" became "Not judged against what Power BI Desktop is known to refuse"; `tellUser` says check_report never opens
Desktop. **Deliberate moves (wording only):** A4-3's nothing-found check (test-0.2.9-a4), C6 (test-0.2.9-checks: the
summary with only strict errors), P2c (test-0.2.9-checks: `!/known/` became `!/known note/`, since "known to refuse"
now holds the word), VG-2 (this branch's validator-gap suite, the same). After: claims 232, v029a4 40, v029checks 37,
check 31, checker 23, validator-gap 5, powerbi-2026-10 26, arabic-lens 31, smooth-lines 29, approval window 31: PASS.

## CHANGELOG line
- A write that fails half-way now never removes a file that another program put in the same place, even one of the
  same size that the disk gave the same file number: DataArcus checks the file's content against what it wrote first.
- check_report no longer says a report "opens in Power BI Desktop" or "is not broken": it never opens Desktop, so it
  now says what it found, which checks ran, and that Power BI Desktop itself was not opened.

## Decisions I made
1. **W-size is now an equivalent mutant** (listed in the suite with why, its text still checked). A file is removed only
   while its content has the sha256 of the bytes this call wrote, read through a handle whose size is compared too, so a
   file of another size never passes with the size check dropped. S2c stays (it still pins the behaviour). Hence 58
   mutants run, not the 59 planned, and 151 checks, not 152.
2. **S2h added (a deliberate addition):** with the hash, a file's dev + ino are compared again through the handle the
   hash is read from, so W-identity survived the file tests; S2h (an empty folder another program made at the name of a
   folder of the tree) pins the folders' identity check alone, and kills W-identity. It passed before the fix too (it
   pins behaviour that was already right). So write-safety is 41 -> 46, not 45.
3. **The validator-gap path is kept, not removed.** It is the designed place for the next proven catalog lag
   (`VALIDATOR_GAPS`, which `scripts/microsoft-watch.mjs` W6 tells the reviewer to update when the catalog pin moves), and
   it worked until catalog 0.1.3; removing it would remove that mechanism and the known-note wording with it. It is now
   reached end to end by a fixture on a copy whose catalog has catalog 0.1.1's shape, with no hook in product code (the
   T1 way: a copied tree). Its own suite, because it builds its own copy (2 s).
4. **The partial write's hash** is the hash of the bytes that landed: the first `size` bytes of the data (a new file is
   written from its start through one handle), size from fstat of that handle. So a file the disk cut off is still
   removed (b153 unchanged) and is protected the same way (S2g). When even fstat fails, there is no hash: the file is
   left and named (fail closed).
5. **The hash at removal is read through a new read-only handle opened with O_NOFOLLOW** (Windows has no such flag: the
   lstat before it already refuses a link, and the handle's dev + ino must still match), so the bytes hashed are the
   very file that is then removed by name. The window between that check and the unlink is the one removeOurs always had.
6. **`mcp/WORK.md` is not edited here:** it is A1's file in this wave (the brief); this job's memory is this file. The
   reviewer adds the wave line on merge.
8. **Item 5 changes only `impactSummary` and `tellUser`.** The `desktopOpens` kind's sentence and TOOLS.md's description
   of it are the measured Desktop fact (DESKTOP-TESTS.md, a working hand-built report), not a check's result: kept, as
   the reviewer said. The claims ban covers check_report's sources, the lens, agent-text and TOOLS.md; "; Desktop opens
   the report with" is banned with its semicolon (the summary's form), so the measured sentence is not caught.
7. The golden baseline is V-rows' last guard, not the first: it takes about 35 s, and the first three kill V-rows in a
   few seconds; with `DA_MUTATION_ALL=1` it is shown to kill it on its own.

## Seen, not in scope
1. **T1 Seen 2** (defence in depth no tool reaches: G-artifact, W-free-real): not a weakness, kept; no change proposed.
   W-size joins them as equivalent (Decisions 1).
2. **T1 Seen 3** (behaviour guarded only by test.mjs parts): T1 gave each of its four a fast check; nothing open.
3. The older T1 (0.3.0, 21 Oct) "Seen" lines are wording and layout items of the beta testers (English lines on an
   Arabic plan page, lint names, the twin's "0 Arabic texts as approved", the count words, an unplanned slicer not
   reproduced, E1 F-4's terms, suggest_fields on large-synthetic): none is a product weakness of this kind; for the owner.
4. The rollback's window between its last check and the unlink remains (another program could swap the file in those
   microseconds). Closing it needs an unlink by handle, which Node has no call for; the hash narrows it to that instant.
5. `mcp/work/T1.md`'s mutant table still says W-size is killed by S2c and the golden baseline is "not a guard"; T1's
   file, not edited here: the reviewer may add a line pointing to this file.
6. ARCHITECTURE.md's "the write path" line (A1's file) could add "a file is removed only while its content is what this
   call wrote"; not edited here.
