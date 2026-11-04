## Summary
- **Approval:** the brief "DD2N (0.3.2)" (4 Nov); the owner D-1104-12 (one library, fix at the source), D-1104-18
  (keep building it), D-1104-15 (the families he did not decide are the reviewer's call, as CONTRACTS.md proposes),
  D-1016-01 (never 100 places).
- **Base:** `feat/0.3.2-dd2n` from `origin/integration/0.3.2` at 70e6136. Push only this branch; never merge, no PR.
- **Scope:** one question (CONTRACTS.md family tmdl-name), "how is a table or column name written in TMDL?", answered
  in one place: `assets/js/tmdl-name.js` (pure dual module: CommonJS, `window.DATmdlName`; the shape of
  mirror-policy.js) `tmdlName(n)`: `String(n)` first; bare when `^[A-Za-z_][A-Za-z0-9_]*$`, else in single quotes
  with `'` doubled. Not in this job: DAX names, M quoting, the TMDL reader (tmdl-model.js), sample-project.mjs's `q`
  (a DAX/M string in double quotes).
- **The rule:** B's answer, a hyphen is quoted. Quoting a name that needs none is always read the same by TMDL; a bare
  hyphen is the risky side. So no Desktop look is needed for this reason.
- **Callers (6 copies -> 1):** model-culture.mjs `q`, sample-project.mjs `name`, shadow-model.mjs `q`, twin-model.mjs
  `tmdlName` (createRequire, as twin-geometry.mjs requires mirror-policy.js); model-health-tmdl.js `name` (require in
  Node, `root.DATmdlName` in the browser) and measure-builder.js `tName` (`window.DATmdlName`). Each keeps its local
  name as a one-line alias of the module's function (no copy). Both pages (English and Arabic, 4 files) load
  tmdl-name.min.js before the caller. The health worker does not load model-health-tmdl.js: no worker change.
- **Steps (one commit each):** 1 the module, .min.js, unit test dd2n; 2 the MCP places; 3 the browser places;
  4 the parity test; 5 CONTRACTS.md (One place), MODULES.md row, CHANGELOG line, WORK.md line.
- **Expected checks:** dd2n passes (13 inputs pinned, then every place on them: one answer); the probe's tmdl-name
  table: one answer per input (9 of 9 agree, was 8 of 9); check-contracts green at every step; check-modules --strict
  green; lint 0; every other suite's number unchanged (model-health, sp30, sp32, sp42 and the golden tests: no
  expected answer moves; their made-up names have no hyphen); mutation 76/76; samejob.py is not in the repo (as DD1C,
  DD2D found): its same-shape groups cannot be counted here.
- **State:** step 1 next.
- **Resume:** the next unchecked step above.

## The answers that change (made-up inputs)
| input | A before (health fix scripts, measure builder) | B before (MCP) | after (all) |
|---|---|---|---|
| table `Sales-2024` | `Sales-2024` | `'Sales-2024'` | `'Sales-2024'` |
| column `-x` | `'-x'` | `'-x'` | `'-x'` |
| 12 (a number) | `'12'` | `'12'` (sample-project.mjs `name`: threw, `s.replace`) | `'12'` |
Every other probe input (Sales, Sales Amount, O'Brien, المبيعات, _x, 1st, '', Date) answers as before in every place.
Who sees it: a table or column with a hyphen in the Model Health Check's fix scripts and the DAX measure builder's
TMDL is now written in quotes (`'Sales-2024'`). The MCP's answers do not change.

## Decisions I made
- (filled as the work goes)

## For the owner
none yet.

## Risky changes
none yet.

## Seen, not in scope

## Lessons for the reviewer
