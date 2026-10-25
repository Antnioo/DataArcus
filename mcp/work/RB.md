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
