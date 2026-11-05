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
- **State:** steps 1-3 pushed (module, callers, parity); step 4 and the full run next.
- **Resume:** step 4 (the probe's --md, the docs), then the full run, the merge and CI.

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

## Parity and the red proof (step 3)
dd2o P1-P26 run the five old copies from ae8c173's source beside box-overlap.mjs (and twin-visuals `overlaps`,
redesign-grid `overlap` now): one answer per pair per question, compared unrounded. Red proof (not committed): a copy
of the test whose base source of redesign-grid.mjs had ` - 0.5` removed (`baseSrc.set(...)` with
`.replace(/ - 0\.5/g, '')` before `old(...)`) fails P5 (0.4 px overlap: base redesign true, every other place false)
and P21 (exactly 0.5 px over): `FAIL  dd2o  87 of 89 checks`.

## Copies before -> after (each place)
| question | before (ae8c173) | after |
|---|---|---|
| overlap | twin-visuals.mjs `overlaps`, redesign-grid.mjs `overlap` (2 copies) | box-overlap.mjs `overlaps` (twin-visuals re-exports it, redesign-grid imports it as `overlap`: the same function) |
| overlap-area | twin-geometry.mjs `overlapOf`, page-picture.mjs `meets`, twin-geometry.mjs `meet` in `landsOn` (3 copies; the ledger listed 2) | box-overlap.mjs `overlapArea` |
5 copies -> 2 functions in 1 module. The answers before and after: the table "Today's answers" above, the same (dd2o U
pins 13 pairs on both shapes; P compares every old copy unrounded).

## Decisions I made
- **The shape in the module, not at the call:** `wOf`/`hOf` read `width`, or `w` when `width` is undefined. Two callers
  ({w, h}: redesign-grid, page-picture, and twin-geometry's `landsOn`) would each have needed an `asBox`: one helper in
  the module is one place. Today's boxes carry one shape or the other, never both, so no answer changes (P1-P26).
- **twin-geometry's `meet` in `landsOn` taken too:** the same line as `meets` on {w, h} boxes, not in the ledger; the
  brief's rule (the area in box-overlap.mjs only, never a copy) covers it. Its 4 px² is `LANDS_ON_MIN`.
- **The ledger and the probe moved in step 2, not step 4,** and MODULES.md's row came in step 1: check-contracts and
  check-modules --strict read the code, so each commit stays green. The re-exports are not places any more (the probe
  lists box-overlap.mjs only; check-contracts finds no definition in a re-export).
- **Constants named for what the caller asks:** `NEW_OVERLAP_MIN` (page-picture), `ON_HOST` and `LANDS_ON_MIN`
  (twin-geometry); `w * h * ON_HOST` is exactly `w * h / 2` in floating point (a halving).

## For the owner
none

## Risky changes
none (the twin's and the redesign's answers: twin 47, arabic 15, report 63 suites green after step 2).

## Seen, not in scope
- `assets/js/mirror-units.js` `unitsOf` `inside`: the shared area divided by a's area, in a browser file (box-overlap.mjs
  is MCP only); a dual module would be its one place.
- `mcp/lib/box-diff.mjs` `iou`: the same intersection inside an IoU (research code the server never loads); dd2o S2
  names it apart.
- `mcp/lib/twin-visuals.mjs` `holdsBox` and twin-text-fit.mjs's `holds`: the same "holds with 0.5 slack" twice (a third
  question, not in the ledger).
- `run-tests.mjs --affected` diffs against `origin/integration/0.3.1`, which a fresh clone of this branch lacks.

## Lessons for the reviewer
- A re-export (`export { x } from`) or an `import { x as y }` is not a place for check-contracts: list the module only.
- check-modules --strict reads backticked names in "used by" as modules: write function names without backticks.
