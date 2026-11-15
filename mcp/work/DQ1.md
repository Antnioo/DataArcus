# DQ1 (0.3.3): the DAX name quoter, functionLines' TMDL rule and the twin's field key, each one place (B-437, B-438, B-434)

## Summary
- **Approval:** the owner D-1110-04 (10 Nov, "Go 1 and 2 they have to be finished anyways"); D-1104-12 (one job, one place).
- **Base:** `fix/0.3.3-dq1` from `origin/integration/0.3.3` at 00f7f702. Push only this branch.
- **Scope:** mcp/lib files that quote DAX names or build the field key, mcp/lib/model-script.mjs, CONTRACTS.md, MODULES.md, contracts-probe.mjs, new tests, tests.json, CHANGELOG.md, WORK.md, this note. No Arabic text, no answer change for a normal name.
- **Expected checks:** check-modules --strict, test-contracts, check-contracts, the split guards sp10 sp11 sp23 sp39 sp40 sp44, area runs model and arabic and report, lint 0, CI.
- **Resume:** 2026-11-10T10:58Z: State: DONE. CI green: https://github.com/Antnioo/DataArcus/actions/runs/42801796229 on 84bef241 (integration/0.3.3 at 9924824b merged in, FT2 included). The two earlier red runs on 43320a68 (theme-generator scroll check; custom-visuals-lab CL-2, PBIR_SCHEMA_UNREACHABLE: schema host unreachable from the runner) were environmental: neither suite reads a file this diff changes, both passed in the other run and locally, and both passed on this run.

## Recount (measured, not the audit's 9 and 8)
The quoter already exists with the refusal: `daxNames` in assets/js/pbip-query.js (`daxSafe` throws on a control character); the writer, the SVG KPIs, flip-cards, status-icons, dax-functions call it. mcp/lib copies that quote `'T'[C]` by hand, none with the refusal: metric-switcher.mjs:138 (nameText), metric-switcher.mjs:226 (tq and ref, a regex), report-fields.mjs:127 (daxColumn), twin-model.mjs:66 (daxCol). That is 4 places (5 pieces) in mcp/lib against the audit's 9 across the repo; the other copies sit in assets/js engines and pages (model-health-tmdl cref, gulf-measures, measure-builder, svg-kpi-compiler:123, health-view:331, field-catalog fieldKey), outside this job's scope: listed under Seen, not in scope.

## Plan
1. Item 1: the 4 mcp/lib places call `daxNames` (one place). A family row `dax-name` in CONTRACTS.md and the probe. Red proof: a name with a quote or a bracket through each former place.
2. Item 2: functionLines calls tmdl-name.js `tmdlName`; a test: the 9 probe names agree, and the drift case.
3. Item 3: one shared `fieldKey(table, field)` in a new pure mcp/lib/field-key.mjs (bare table and column text as today for a normal name; a table with a quote or bracket in quotes, a column's `]` doubled), and its reader; terminology.mjs, model-culture.mjs, twin-texts.mjs, twin-measures.mjs call it. Red proof: tables `A` column `B][C` and `A[B]` column `C` get two keys and two approval lines.

## Before -> after
- B-437: 4 hand-written `'T'[C]` quoters in mcp/lib (report-fields, twin-model, metric-switcher x2 pieces) -> all call `daxNames` (refuses a control character). Same text for every normal, quote and bracket name. report-fields tells a refused name as a problem; metric-switcher's title check skips such a name. Red: test dq1 D1-D5 on eb1a3019 failed 7 of 16 (D2 passes on the base: the SVG compiler already refused; twin-model and addSwitch sit behind earlier control checks, so their proof is the static D5).
- B-438: functionLines had its own copy of the TMDL name rule -> `tmdlName`. Equal on the 9 probe names and a dotted and a hyphenated one: no case the old copy got wrong today (same regex), so the proof is that the rule is no longer copied (red: 2 of 28 on the item 1 commit). The family `tmdl-name` gains the place (8, 0 of 9 disagree).
- B-434: new `mcp/lib/field-key.mjs` (`fieldKey`, `keyOfText`, `parseFieldKey`, `fieldOfKey`). Key = `Table[Field]` as before; a table with a quote or bracket is quoted, a `]` in the field doubled. Table `A` column `B][C` is `A[B]][C]` and table `A[B]` column `C` is `'A[B]'[C]`. Callers: terminology.mjs (fieldKeyOf, placesOf, sheetOf), model-culture.mjs, twin-texts.mjs (termsOf, normTerms), plan_layout.mjs call sites, plan-lint.mjs. Red: D7-D9 failed 5 of 35 on the item 2 commit (two keys; two sheet rows; the culture script gives the caption to one table). Round23's escaped-names check caught plan_layout and plan-lint building keys by hand: fixed (found by the full run).
- Lint (eslint mcp assets/js html, run from the repo root) found a missed `daxColumn` in report-fields' sparkline path (a ReferenceError the first full run did not reach): fixed, D1b/D2b red on df7f0419 first (2 of 38). Full `npm test -- --keep-going`: 236 of 237 suites passed, the one red (script-names F2: a line-break name read as a key now) fixed in a1e64994 and passing; after the last two fixes areas report+arabic 93 suites, model+core 45 suites pass; lint 0.
- Counts: dq1 38 checks (was 16 at item 1); areas arabic, report, model 124 suites (before item 3); split guards sp10 113, sp11 21, sp23 29, sp39 96, sp40 28, sp44 23 unchanged; check-modules --strict 1223, check-contracts 858, test-contracts 14.

## CHANGELOG line
The Arabic twin no longer gives two fields one Arabic name when their names look alike (a table `A` with a column `B][C` and a table `A[B]` with a column `C`): each has its own line in the terminology sheet and its own approval. Names without a quote or a bracket are keyed as before.

## Decisions I made
- Item 1's one place is the existing `daxNames` (assets/js/pbip-query.js), not a new module: it already refuses (AUD-032). The ledger family `dax-name` records it.
- The key form for item 3 is the bare text for a normal name and a quoted table only when its name holds a quote or bracket, so no recorded suite moves; the quoted-everywhere DAX form would have changed every key text.
- plan_layout.mjs is FT2's file: only the key-parse and key-build call sites changed, nothing else.

## For the owner
none

## Risky changes
Typed `terms` and `displayNames` keys now go through `keyOfText`: a normal `Table[Field]` or `'Table'[Field]` gives the same key as before. A typed key with brackets inside a table name is read as before (the first `[` splits it).

## For the laptop
none

## Seen, not in scope
- Other hand-written DAX quoters in assets/js (not mcp/lib): model-health-tmdl `cref`, gulf-measures `colRef`, measure-builder `colRef`, svg-kpi-compiler:123, health-view:331, field-catalog `fieldKey`.
- `Bind.fieldKey` (assets/js/pbip-bind.js) is a second field key (the report writer's, `]` doubled, table unquoted): `A[B]]` + `C` and `A` + `B][C` collide there too (report-said.mjs:95 notes it). Not the twin's key.
- gulf-calendar.mjs:58 and :63 write `sourceColumn: [c]` by hand (TMDL, not a DAX name).

## Lessons for the reviewer
- The brief's 9 and 8 were the audit's across the repo; mcp/lib has 4 hand quoters. Counting was needed before the plan.
- Typed-key parsers and key builders are spread over plan_layout and plan-lint: a key change needs the full `npm test` (round23 found them), not only the twin area.

