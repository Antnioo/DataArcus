## Summary
- **Approval:** the brief "DD2Z (0.3.2): the last two families in one place: vt-slicer and blank" (5 Nov); owner D-1104-12
  (one library, fix at the source), D-1104-15 (filterSlicer a slicer only after a Desktop check; SVG KPI math follows the compiled DAX).
- **Base:** `fix/0.3.2-dd2z` from `origin/integration/0.3.2` at edf2951b. Push only this branch; never merge, no PR.
- **Scope:** CONTRACTS.md families vt-slicer (5 places -> 1) and blank (2 places -> 1). Not in this job: other families,
  the SVG KPI compiler's DAX (the truth here), B-380, B-381.
- **Plan, one commit each:** 1 this note; 2 parity tests first (mcp/test-0.3.2-dd2z.mjs: the probe's 18 types, the 7 DAX inputs,
  the 2 ring rows; recorded on the base, red where a place disagrees); 3 vt-slicer: visual-types.js `SLICER_TYPES` = the four
  Desktop makes, `isSlicer` the one place; mirror-policy kindOf, page-preview kindOf, report-a11y and report-inventory call it;
  4 blank: one evaluator in svg-expressions.js (DIVIDE and `/` as measured), svg-editor-panels evalValues calls it;
  5 CONTRACTS.md (both "**One place:**", measured table with source) and the probe lines; 6 build:min, suites, lint, CI.
- **Measured (lab/look032 A and B, Power BI Desktop 2.159.1231.0):** slicers = slicer, advancedSlicerVisual, listSlicer, textSlicer
  (filterSlicer is none of them); DIVIDE(5,BLANK)=BLANK, DIVIDE(BLANK,BLANK)=BLANK, DIVIDE(5,0)=BLANK, 5/BLANK=Infinity,
  BLANK/BLANK=BLANK, 5/0=Infinity, 0/0=NaN.
- **Expected checks:** dd2z new; CONTRACTS.md 28 of 28 families in one place; only filterSlicer's answer changes in
  visual-types/report-inventory (read_report, check_report); sp16's recorded D21 line ("evaluator threw DIV0") changes on purpose;
  every other suite's number unchanged; lint 0.
- **State:** DONE (CI green on Linux and Windows; macOS runs where the reviewer merges).
- **Resume:** none; the reviewer reads and merges.

## Copies before -> after
| place | before | after |
|---|---|---|
| visual-types.js `SLICER_TYPES` / `isSlicer` | 5 types (filterSlicer in) | the 4 Desktop makes; the one place |
| mirror-policy.js `SLICER` list in `kindOf` | own frozen list of 4 (exported as `SLICER`) | `VT.isSlicer` (export gone; nothing read it) |
| page-preview.js `KIND` slicer entry | own regex of 4 | `{ test: VT.isSlicer }` |
| report-a11y.js `SLICERS` | own regex of 4 | `VT.isSlicer` (reads visual-types.js; the writer's builder list already loads it first) |
| report-inventory.mjs `SLICERS` | regex built from `VT.SLICER_TYPES` | `VT.isSlicer` |
| svg-expressions.js `/` | threw DIV0 for b = 0 or BLANK | `a == null ? null : a / z(b)`: Infinity, NaN as Desktop |
| svg-editor-panels.js `evalValues` | own ratio, diff, % rules | `SVGKPIExpr.evalValueKind` (svg-expressions.js `VALUE_NODES`, also read by svg-kpi-compiler.js: same DAX out) |
Lists: vt-slicer 5 places over 4 lists -> 1; blank 2 rules -> 1. Same-shape groups go down.

## Answers before and after
- `filterSlicer`: a slicer in read_report (`slicer` flag, SLICER marker) and check_report (alt text "Filters the page by ...") -> "other" (the twin and preview already said so).
- `/` by BLANK or 0 in the SVG KPI evaluator: threw DIV0 -> Infinity (NaN for 0 / 0); BLANK / BLANK stays BLANK. DIVIDE unchanged (BLANK).
- The 16 other of the 18 types and the compiled DAX: unchanged. The ring with a BLANK or 0 target read "0%" before and after.

## Checks (read from each run's own output)
- red on cc65ed55 first: dd2z 134 of 153 (19 problems: filterSlicer in two places, `/` throws in four rows, the places and the lists of S1-S4). After: PASS dd2z 153 checks.
- Area runs: twin 52 suites, report 65, safety 23, checker 10 passed. Website: svg-kpi 854, sp12 3, sp25 22, sp33 34, dd2z 8 (new; R1-R3 are regression pins, green on the base too: the compiled COALESCE already gave 0%), pbip 111, layout 512, sp31 17, sp32 39, sp35 38, sp36 18, pv2 20.
- lint 0; check-contracts PASS 715 checks (28 families, 100 places); test-contracts 14; check-modules --strict, check-agent-memory, check-result-lines, check-min (stamps), changelog-words, test-site-config PASS.

## Changed on purpose
- `mcp/fixtures/sp16-codegen.json` (sp16 E1): the base's output listed "D21 _x: evaluator threw DIV0, DAX Infinity" as a disagreement; now the evaluator says Infinity too. Lines that differ: `"agree": 139` -> `140`, and the D21 line removed (3 disagreements -> 2; D25 and D26 are number-format ones, untouched). Edited by hand, not re-recorded, so nothing else moved.
- `mcp/test-0.2.9v.mjs` (v029visuals, still 105 checks; CI shard 4 found it, red on the first CI run): two expectations said filterSlicer is a slicer; now they say it is not: `by.c.slicer === true` -> `!by.c.slicer` (read_report on a made-up filterSlicer visual), and `VT.SLICER_TYPES.includes('filterSlicer')` -> `!...includes(...)`. Same checks, opposite answer for the one type, as the brief decides.
- Source of the measured table: lab/look032 A and B, Power BI Desktop 2.159.1231.0 (the brief, 5 Nov).

## CHANGELOG line
read_report and check_report no longer call a filterSlicer a slicer (Power BI Desktop never saves one); the SVG KPI designer's preview divides by a BLANK or 0 the way Desktop does.

## Decisions I made
- `BLANK / 0` is not in the measured table; kept as BLANK (a BLANK dividend stays BLANK in `/`), as before.
- The probe's report-a11y place is `describe` (alt text "Filters the page by ...") and report-inventory's is `inventory` (the `slicer` flag), since their old `SLICERS` names are gone; the probe's blank family now has 14 inputs (DIVIDE, `/`, `-` rows; the editor has no `/`, so `applies` leaves it out of those rows) and `show` prints Infinity.
- The kind-to-tree map of the three formula kinds moved to svg-expressions.js `VALUE_NODES` so the compiler and the panel share it; the compiler's DAX is byte-identical (svg-kpi 854 checks, sp16 32).
- Build stamps: the build rewrote 4 stamp lines in assets/js/theme-generator.js (its BUILDER, CHECK and loadPreview lists); stamp-only, needed because report-a11y, visual-types and page-preview .min.js changed. fn1d also edits that file: expect a trivial merge there.

## For the owner
none

## Risky changes
none (filterSlicer changes what read_report and check_report return for a type Desktop never writes; no approval, write or network change)

## For the laptop
none

## Seen, not in scope
- page-preview.js still names `advancedSlicerVisual` for the button slicer's pills (a different question: how a slicer draws).
- layout-check.js and report-rules.js have their own slicer-height rules (not type tests).

## Lessons for the reviewer
- The brief's "red where today's places disagree": the blank family disagreed only on `/`; DIVIDE and the editor already matched, and the ring was already "0%", so those cases are pins.
- A new probe input shape needed three small probe changes (`applies`, Infinity in `show`, a place loader per kind): the probe's 8-input minimum made 14 inputs the natural size.
CI green: https://github.com/Antnioo/DataArcus/actions/runs/42105671302 on 21ddb7e2643407891db75195258bffdae1804f3e
