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
- **Expected checks:** (first round) 18 families (12-20), about 80 places, 8 or more inputs each; `PASS  contracts-probe`,
  `PASS  contracts`, `PASS  test-contracts` (red: a file gone, a function gone, too few inputs, a place on one side
  only); unchanged: modules (`--strict` too), agent-memory, result-lines, lint 0.
- **Got (first round):** 18 families, 93 places, 12 disagreeing; CI green on 893565f3 (run 41851946104).
- **The reviewer's input (the Codex history audit, 3a9ad5e8, a scheduled message, 14:34):** the "newest copy" column
  filled and checked against the code and the probe; 1g and 1h added; the audit's Phase 2 copies added (u32, lru,
  png-chunk, limits, text-runs, blank, tmdl-name probed; toast, the copy fallback, the worker's address, the area labels
  in an "Equal copies" table the check pins by text); grid replaces vt-table; overlap split (overlap, overlap-area);
  order out (two questions); the audit's "Not one question" added. Where the probe disagrees: "## Where I disagree".
- **Got:** families **27**, places **117** (56 files), disagreeing families **16** (1a, 1b-text, 1b-number, 1b-bool,
  1c, 1d, 1f, 1g, 1h, vt-slicer, vt-bar, html, tmdl-name, limits, text-runs, blank); 11 agree. `PASS  contracts-probe
  1442 checks (27 families, 117 places, 16 families disagree)`; `PASS  contracts  803 checks (27 families, 117
  places)`; `PASS  test-contracts  14 checks` (the 13 before, and an equal copy that drifts, a copy of one place, a "no"
  row not compared). modules 1033 (`--strict` too), agent-memory 419, result-lines 192, lint 0.
- **Commits:** f22d80a (plan), ff1ab81 (probe), 401936a (ledger), b5729f7 (check, CI step), 893565f (pointers),
  a53742d (CI line), 9c3039c (probe: the audit), 207b2df (ledger: the audit), a95e816 (check: equal copies).
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/41855679631 on a684ee57. **State: DONE.**
- **Resume:** the reviewer's read of the proposals and of "Where I disagree".

## Where I disagree with the audit (the probe and the code, 4 Nov)
- **1c:** the audit's newest copy is right (`aroundTables` `widthOf`, fe62655b), but twin-geometry.mjs holds a second
  reader, `underGrids` `widthIn`, that answers undefined where `aroundTables` gives the page's width (no box, a box with
  no height, a text width). One file, two answers.
- **html** ("XML/HTML escapes equal"): XML is equal; HTML is not: null and undefined give `""` in six copies and
  "null" / "undefined" in three, and measure-builder.js `escapeHtml` leaves `'`.
- **TMDL names** ("equal"): model-health-tmdl.js and measure-builder.js write `Sales-2024` bare, the four MCP copies
  quote it.
- **import limits** ("equal"): the four sizes are equal; model-import-browser.js has no `entries` (it never opens a ZIP:
  no answer changes).
- **paragraph text runs** ("equal"): two pairs, each equal (layout-check and report-inventory: " / " joined, trimmed,
  0 kept; report-a11y and page-preview: " " joined, untrimmed, 0 dropped).
- **BLANK arithmetic** ("equal"): equal for minus; for a division by BLANK or by 0 svg-expressions.js throws DIV0 and
  svg-editor-panels.js gives BLANK.
- **toast** ("equal"): svg-kpi-designer.js's lasts 2200 ms, the other three 1800 ms (found by the check's text pin);
  exam-view.js 2200 and health-view.js 1800. **Copy fallback:** four select their own element; health-view.js copies
  through a textarea. **Area labels:** the English words are equal.
- **B-326:** named in the "Not one" list as the audit gives it; no file or note in the repo names B-326, so no place.
- Agreed after checking: 1a (merge), 1b and 1d (merge, tagged decoder; dax-functions 24L NaN), 1f, 1g, 1h (and
  mcp/test.mjs's parity test gives types and no suffix), canon, crc, png-chunk, u32, lru, contrast, xml, decode, grid,
  overlap; the not-one list.

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
- 1g: the website refuses two equally near models, as the MCP does (a message on the page).
- 1h: the health check's fix script finds a sort column for an untyped "Month Number" and "Day Name (Arabic)".
- blank: which DAX the SVG KPI's division mirrors (`/` or DIVIDE).
- 1b, 1d, 1f, vt-bar, html, tmdl-name, text-runs: one reader each, as proposed.

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
- The text pin of "Equal copies" found a drift the audit called equal (a toast's time): a copy that cannot be probed
  can still be pinned by its text.
- The brief's "about 31 readers": 32 named readers (18 text, 8 number, 6 true/false), plus inline reads not named.
- Golden tests that pin a place are not mapped yet (the "who sees it" cells name tools and pages); "newest copy" is
  left "(to come)" for the stale-twins history.
