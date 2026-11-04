# CL1 (0.3.2): the contract ledger, one row per question the product answers in more than one place

## Summary
- **Approval:** the reviewer's brief "CL1" (4 Nov); the owner D-1104-11 (one big check: the same answer in different
  words, family by family), D-1104-12 (one library, fixed at the source: the ledger is what it is built from),
  D-1104-08 (MODULES.md "our biggest asset": the ledger sits beside it and points to its rows), D-1016-01.
- **Base:** `feat/0.3.2-cl1` from `origin/integration/0.3.2` at 762bba0. Pushed only this branch; never merged, no PR.
- **Scope:** repo scripts and docs only: new `scripts/contracts-probe.mjs`, `mcp/docs/CONTRACTS.md`,
  `scripts/check-contracts.mjs`, `scripts/test-contracts.mjs`, one step in `.github/workflows/tests.yml`, one line each
  in `mcp/docs/MODULES.md` (intro) and `ARCHITECTURE.md` (route g), this note, one line in `mcp/WORK.md`. No code
  moved, no behaviour changed, no engine, lib, tool or page touched (read only).
- **Plan, one commit each:** (1) the probe: every place of every family loaded in Node (an engine's inner name exposed
  by one line added in memory, the file never changed; a name nested in another function, page-only, or a lib's
  unexported one read from its source and said so), run on the same made-up inputs (8 or more a family), one table a
  family, disagreements marked. (2) the ledger. (3) the check, its red proofs, one CI step. (4) the two pointers.
- **Expected checks:** 18 families (12-20), about 80 places, 8 or more inputs each; `PASS  contracts-probe`,
  `PASS  contracts`, `PASS  test-contracts` (red: a file gone, a function gone, too few inputs, a place on one side
  only); unchanged: modules (`--strict` too), agent-memory, result-lines, lint 0.
- **Got:** families **18**, places **93** (a function once for each family it answers; 48 files), disagreeing
  families **12** (1a, 1b-text, 1b-number, 1b-bool, 1c, 1d, 1f, vt-slicer, vt-bar, order, overlap, html); agreeing 6
  (vt-table, canon, crc, contrast, xml, decode). `PASS  contracts-probe  1235 checks (18 families, 93 places, 12
  families disagree)`; `PASS  contracts  590 checks (18 families, 93 places)`; `PASS  test-contracts  13 checks`
  (red: a file gone, a function renamed, an outer function gone, a name no longer inside it, a wrong MODULES.md link,
  7 inputs, a place on one side only (both ways), a family on one side only (both ways), the top table's places,
  inputs and a missing row, a "Not one" name gone, no ledger; green on the repo; the command's PASS and FAIL lines).
  modules 1033 (`--strict` the same), test-modules 11, agent-memory green, result-lines 192, lint 0.
- **Commits:** f22d80a (plan), ff1ab81 (probe), 401936a (ledger), b5729f7 (check, CI step), then the pointers.
- **Resume:** the reviewer's read of the proposals; "newest copy" from the stale-twins history job.

## Decisions I made
- 1b as three families (text, number, true/false): each reader answers one type, and the proposals differ.
- The "table and matrix" families as three type questions (table or matrix, slicer, bar): visual-types.js, mirror-
  policy, page-preview, layout-check, page-picture, report-a11y and report-inventory each hold lists. report-rules.js
  only compares `x.type === 'tableEx'` inline: no function to name, not a place.
- A place is a named function or constant. Inline reads (`lit(p) === 'true'` in report-mirror.js, report-rules.js,
  pbip-visuals.js, mirror-units.js, ...) are not places: the shared reader replaces them when the library comes.
- Loading: `inner` adds one line in memory before an engine's export line; `source` reads the definition (and every
  name it needs, found by the ReferenceError it throws) and is told in the probe's table. `within` names the function a
  nested name sits in; `after` picks one of several same-named definitions (twin-plan.mjs `own` in `planTwin`).
- No MODULES.md rows for the three scripts: the map's module files are assets/js, mcp/lib and mcp/tools only (MD1's own
  scripts have none), and a `scripts/` row would fail check-modules as "a file that is not there".
- The check is static and never runs the probe: CI's website job has no MCP packages. It pins the places, the inputs
  and the counts; the "Today" tables are the probe's snapshot (re-run `--md` when a place changes).
- Reading order: each input carries its direction; twin-texts takes none (it lists the English report's texts).

## For the owner
The decided answers that need him (each proposal in CONTRACTS.md; the reviewer first):
- 1a time: one word test for all four (OrderDate, FiscalYear, Qtr, FY, Yr, تاريخ, هجري all time). Changes which twin
  chart's time axis is turned and which chart is sorted by its measure: a Desktop look after.
- 1c frame: a group without a full box: the page's width, or nothing (the twin mirrors and fits in different widths).
- vt-slicer: filterSlicer a slicer in the twin and the preview too (a Desktop check first).
- order: the twin's text list in check_report's reading order (bilingual.texts' order changes).
- 1b, 1d, 1f, vt-bar, overlap, html: one reader each, as proposed (no answer for a real literal changes but `12L`).

## Risky changes
none (no code moved; one CI step added).

## Seen, not in scope
- `mcp/lib/dax-functions.mjs` `fitPictures` `widthOf` throws TypeError on a columnWidth entry with no properties, and
  reads `120L` as NaN (a report from anyone can hold any shape).
- `assets/js/report-a11y.js` `tr` (in `backgroundOf`) reads `12L` as 0: it strips only `D`.
- `mcp/lib/twin-geometry.mjs` `litOf` and `mcp/lib/redesign.mjs` `L` (in `danglingOf`) leave `''` doubled (it''s).
- page-preview.js, layout-check.js and page-picture.mjs list `stackedBarChart`, which is not a Power BI type.
- All three contrast copies answer NaN for a three-digit colour (`#FFF`); measure-builder.js `escapeHtml` leaves `'`.

## Lessons for the reviewer
- The probe needs `cd mcp && npm ci` (the twin's modules load through the MCP's packages); `--md` gives the ledger's
  "Today" blocks, `--json` every answer. Not in CI: a snapshot, re-run when a family's code changes.
- The brief's "about 31 readers": 32 named readers (18 text, 8 number, 6 true/false), plus inline reads not named.
- Golden tests that pin a place are not mapped yet (the "who sees it" cells name tools and pages); "newest copy" is
  left "(to come)" for the stale-twins history.
