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
- **Resume:** plan written; next: item 13's red tests.

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
