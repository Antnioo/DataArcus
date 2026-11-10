# DQ1 (0.3.3): the DAX name quoter, functionLines' TMDL rule and the twin's field key, each one place (B-437, B-438, B-434)

## Summary
- **Approval:** the owner D-1110-04 (10 Nov, "Go 1 and 2 they have to be finished anyways"); D-1104-12 (one job, one place).
- **Base:** `fix/0.3.3-dq1` from `origin/integration/0.3.3` at 00f7f702. Push only this branch.
- **Scope:** mcp/lib files that quote DAX names or build the field key, mcp/lib/model-script.mjs, CONTRACTS.md, MODULES.md, contracts-probe.mjs, new tests, tests.json, CHANGELOG.md, WORK.md, this note. No Arabic text, no answer change for a normal name.
- **Expected checks:** check-modules --strict, test-contracts, check-contracts, the split guards sp10 sp11 sp23 sp39 sp40 sp44, area runs model and arabic and report, lint 0, CI.
- **Resume:** 2026-11-10T08:25Z: plan written, nothing built yet. Next: commit 1 (item 1).

## Recount (measured, not the audit's 9 and 8)
The quoter already exists with the refusal: `daxNames` in assets/js/pbip-query.js (`daxSafe` throws on a control character); the writer, the SVG KPIs, flip-cards, status-icons, dax-functions call it. mcp/lib copies that quote `'T'[C]` by hand, none with the refusal: metric-switcher.mjs:138 (nameText), metric-switcher.mjs:226 (tq and ref, a regex), report-fields.mjs:127 (daxColumn), twin-model.mjs:66 (daxCol). That is 4 places (5 pieces) in mcp/lib against the audit's 9 across the repo; the other copies sit in assets/js engines and pages (model-health-tmdl cref, gulf-measures, measure-builder, svg-kpi-compiler:123, health-view:331, field-catalog fieldKey), outside this job's scope: listed under Seen, not in scope.

## Plan
1. Item 1: the 4 mcp/lib places call `daxNames` (one place). A family row `dax-name` in CONTRACTS.md and the probe. Red proof: a name with a quote or a bracket through each former place.
2. Item 2: functionLines calls tmdl-name.js `tmdlName`; a test: the 9 probe names agree, and the drift case.
3. Item 3: one shared `fieldKey(table, field)` in a new pure mcp/lib/field-key.mjs (bare table and column text as today for a normal name; a table with a quote or bracket in quotes, a column's `]` doubled), and its reader; terminology.mjs, model-culture.mjs, twin-texts.mjs, twin-measures.mjs call it. Red proof: tables `A` column `B][C` and `A[B]` column `C` get two keys and two approval lines.

## Before -> after
(filled as the work lands)
