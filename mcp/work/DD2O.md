## Summary
- **Approval:** the brief "DD2O (0.3.2): one place for two boxes overlapping" (4 Nov); the owner D-1104-12 (one library,
  fix at the source), D-1104-18 (keep building it), D-1104-15 (Phase 2 equal copies: one copy, no answer changes),
  D-1016-01 (never 100 places).
- **Base:** `feat/0.3.2-dd2o` from `origin/integration/0.3.2` at ae8c173 (DD2P in). Push only this branch; never merge, no PR.
- **Scope:** docs/CONTRACTS.md families overlap and overlap-area, each answered the same by both copies today. One MCP
  module `mcp/lib/box-overlap.mjs`: `overlaps(a, b)` (the tolerant yes or no) and `overlapArea(a, b)` (the area).
  Not in this job: the grid's placement rules, the twin's moves, any picture; the other families.
- **Copies before -> after:** overlap 2 (twin-visuals `overlaps`, redesign-grid `overlap`) -> 1; overlap-area 2
  (twin-geometry `overlapOf`, page-picture `meets`) -> 1. 4 copies -> 2 functions in 1 module.
- **Shape:** both functions read a box's size as `width`/`height`, or `w`/`h` when `width` is undefined (one helper in
  the module), so redesign-grid ({w, h}) and page-picture ({w, h}) call them as they are: no adapter copied into two
  callers. twin-visuals.mjs re-exports `overlaps` (the same function); redesign-grid.mjs keeps exporting `overlap` (the
  same function as `overlaps`: sp19 I1 pins the name).
- **Thresholds named in the caller:** page-picture `NEW_OVERLAP_MIN = 4` (px²); twin-geometry `ON_HOST = 0.5` (the
  share of the small visual's box), written `w * h * ON_HOST` (the same float as `w * h / 2`).
- **Expected checks:** dd2o passes (new: units, parity, one place); every other suite's number as on the base (the base
  run, 5 shards locally, in "Numbers"); mutation 76/76; `npm run lint` 0; check-contracts, check-modules --strict,
  check-agent-memory, check-result-lines green; the probe one answer per input for overlap and overlap-area.
- **State:** plan pushed. **Resume:** step 1.

## Plan (one commit each, every suite green between them)
1. `mcp/lib/box-overlap.mjs` and `mcp/test-0.3.2-dd2o.mjs` (one line in tests.json beside dd2p): the probe's 9 pairs
   for both functions, plus a zero-width box apart, a box exactly 0.5 px over, touching corners, two zero-size boxes;
   each answer pinned, on both box shapes.
2. twin-visuals, redesign-grid, twin-geometry, page-picture import it; their copies go; the thresholds named. sp26 M2
   (twin-geometry's import list) allows the one new pure file (no number moves).
3. Parity in dd2o: the four old copies read from the base's source (git show ae8c173, as dd2p and the probe do) and
   the new functions on every input: one answer per input per question.
4. CONTRACTS.md (the two families' "One place" lines and places), the probe's places, MODULES.md (the new row).

## Today's answers (the probe's 9 pairs; both copies of each question agree)
| pair | overlap | area |
|---|---|---|
| apart | false | 0 |
| touching edges | false | 0 |
| 0.4 px overlap | false | 40 |
| 1 px overlap | true | 100 |
| 1 px overlap, 3 px high | true | 3 |
| 3 px both ways | true | 9 |
| one inside the other | true | 400 |
| the same box | true | 10000 |
| a zero-width box inside | true | 0 |
