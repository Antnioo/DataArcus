## Summary
- **Approval:** the owner, 11 Nov, D-1111-17: "go you have all night to finish everything we got so far also don't
  overlook the seen not in scope"; D-1104-12 (one job, one place). Relayed by the hub, session_015Q77oNR7YVFznptSuZoZZ2,
  as job LX1 (13 items; item 13 is the reviewer's night audit AUD-069).
- **Base:** `feat/0.3.3-lx1` from `origin/integration/0.3.3` at c21df8d5. Push only this branch; never merge, no PR.
- **Scope:** the 13 items of the brief, in its order of value: 13, 8, 10, 11, 12, 1, 3, 4, 5, 6, 9, 2, 7. Files: a new
  engine `assets/js/relationship-filter.js` (item 13) and its callers `mcp/lib/lineage.mjs` (and through it
  `mcp/lib/brief.mjs`), `assets/js/field-catalog.js`, the theme generator's loader; `dax-reference-parser.js`
  (items 1, 7, 8), `health-confirm.js` (1, 2), `mcp/lib/report-inputs.mjs` (10), `mcp/lib/approval-ar.mjs` (11),
  `mcp/work/LR3.md` (12, one heading), the check_report sections (4, 5, 6), `like-for-like.mjs` (9, 2); MODULES.md and
  CONTRACTS.md rows; the tests named per item; CHANGELOG, WORK.md, this note.
- **Expected checks:** `node scripts/check-modules.mjs --strict` PASS; `node scripts/test-contracts.mjs` PASS;
  `node scripts/check-contracts.mjs` PASS; area runs (report, checker, model) as I go; tk1 under 61,000; lint 0; CI.
- **Resume:** group 1 (items 13, 8, 10, 11, 12, 9) pushed; CI on it; next item 4, then 6, 5; 1, 3, 2, 7 measured.

## The plan (written before the code, 2026-11-12T00:12Z)
Measured on c21df8d5 (file:line, who calls it):
- **13 (AUD-069).** The filter direction of a relationship is decided in two places, both from `crossFilteringBehavior`
  alone: `mcp/lib/lineage.mjs:73` (`modelGraph`, `both: r.cross === 'bothDirections'`; read by `relsFor` in
  lineage.mjs:105 and by `brief.mjs:100` `reachOf`, which gets the graph from `modelGraph`) and
  `assets/js/field-catalog.js:98` (`relsOfTmsl`, read by `reached` :487, the picker and suggest_fields). Microsoft Learn,
  "Model relationships in Power BI Desktop", Cross filter direction
  (https://learn.microsoft.com/power-bi/transform-model/desktop-relationships-understand#relationship-properties):
  "For one-to-one relationships, the cross filter direction is always from both tables." Plan: one pure engine
  `assets/js/relationship-filter.js` `filtersBoth(r)` (TMSL names or the index's `cross`, `fromCard`, `toCard`):
  both ways when `bothDirections` or one-to-one. Called by lineage.mjs (so brief.mjs too) and field-catalog.js; the
  theme generator loads it before field-catalog.min.js. Red first on a made-up Souq: Store to a new Bridge one-to-one
  (no bothDirections), Targets to Bridge many-to-one; "Target by Region": briefCheck says one value (old) and moves
  (new), through the real server; lineageOf + compareLineage with the one-to-one turned off: "can only show other
  numbers if the data changed" (old), can show other numbers (new); field-catalog `relsOfTmsl` both (new).
  Pins expected to move: sp30 K2 (field-catalog's requires) and K3/loader order, said per test.
- **8.** `collectReportRefs` (dax-reference-parser.js:46) drops `SourceRef.Schema`; lineage.mjs `keyOfRef` tells a
  report measure by the report's list only. Plan: keep `schema: 'extension'` on the reference; keyOfRef uses it first.
  Red: a report measure and a model measure of one name, the visual on the model one.
- **10.** `unknownKeys` (report-inputs.mjs:27) names create_report's "fields" input; the input is plan_layout's
  `planFields`. Correct the sentence; re-record fn1j by its own recorder ON PURPOSE (C05, H15 per SN1).
- **11.** approval-ar.mjs:50 says DRAFT; D-1105-16 approved it: the comment says approved.
- **12.** LR3.md:19 is a plan line wrapped so it starts with `## For the owner"`: rewrap that one line.
- **1, 3, 4, 5, 6, 9, 2, 7:** measured when reached; written below or under "Seen, not in scope" with why.
Expected numbers: new suite `lx1` (about 25 checks), red on c21df8d5 first; every other suite's numbers unchanged
except those said per test under "Changed on purpose".

## Before -> after (group 1, 2026-11-12T01:40Z)
New suite `lx1` (mcp/tests.json, area checker): 19 checks, **red on c21df8d5 first** (base files checked out: R1, R2,
R3, R3c, R4, R4b, L8, L8c, L9, L10, L10b, L11, L12 failed; the controls R1b, R1c, R2b, R3b, L8b, L9b passed).
- **13 (AUD-069), closed.** One rule: `assets/js/relationship-filter.js` `filtersBoth` (bothDirections, or one-to-one,
  cited from Learn above). `lineage.mjs` `modelGraph` (each relationship's `both`, read by `relsFor` and by
  brief.mjs's `reachOf`) and `field-catalog.js` `relsOfTmsl` call it; neither reads bothDirections itself (R4b). The
  theme generator loads relationship-filter.min.js before field-catalog.min.js (new stamp a94fd468ba2f). Through the
  real server: "Target by Region" over a one-to-one Store to Bridge was "one value" (R1), now moves; lineage now says
  it can show other numbers when that relationship is turned off (R2); the picker reaches it (R3, R3c). CONTRACTS.md
  family `rel-both` (11 probe inputs), MODULES.md row.
- **8, closed.** `collectReportRefs` keeps `schema: "extension"` (the key only when written); lineage.mjs `keyOfRef`
  reads it first, so a visual on a report measure named like a model measure follows the report's DAX (L8, L8c).
  sp9 (which pins collectReportRefs' output) unchanged: 16 checks pass.
- **10, closed.** `unknownKeys`: "Fields go in plan_layout's own "planFields" input, not inside the design; layout
  choices are its other inputs." No Arabic copy of the sentence exists (grep). fn1j re-recorded ON PURPOSE by its own
  recorder (`FN1J_RECORD=1`): C05 and H15 only; their dumps before and after differ in that sentence only (checked).
- **11, closed.** approval-ar.mjs:50: "approved by the owner, D-1105-16, 5 Nov". Comment only.
- **12, closed.** LR3.md line 19 (a wrapped plan line that began `## For the owner"`) now starts "the owner's heading";
  nothing else in LR3.md changed (`git diff`: one line).
- **9, closed.** like-for-like.mjs `row()`: a base measure's name whole to NAME_OUT (200), as `lacking` (L9; past 200
  the cut is marked, L9b). ix1 64 and ix2 33 unchanged.

## Changed on purpose
- `mcp/fixtures/fn1j-pins.json`: A1 C05 and A1 H15 (the sentence of item 10), and its `about` says so.

## Runs (group 1)
lx1 19, sp30 21, dd1h 35, ox1 57, ox2 29, hx1 59, hx2 43, sp9 16, fn1j 3, ix1 64, ix2 33 PASS; `npm test -- checker`
19 suites and `-- model` 31 suites PASS; website theme-generator, pbip, sp31 PASS (each alone, after build:min);
check-modules --strict 1262, check-contracts 868, test-contracts 14, result-lines 253, changelog-words 73 PASS; lint 0.
