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
- **State:** steps 1-5 committed and pushed; the full run and CI next.
- **Resume:** the merge of origin/integration/0.3.2 (once), build:min, every check, tests.yml.

## The answers that change (made-up inputs)
| input | A before (health fix scripts, measure builder) | B before (MCP) | after (all) |
|---|---|---|---|
| table `Sales-2024` | `Sales-2024` | `'Sales-2024'` | `'Sales-2024'` |
| column `-x` | `'-x'` | `'-x'` | `'-x'` |
| 12 (a number) | `'12'` | `'12'` (sample-project.mjs `name`: threw, `s.replace`) | `'12'` |
Every other probe input (Sales, Sales Amount, O'Brien, المبيعات, _x, 1st, '', Date) answers as before in every place.
Who sees it: a table or column with a hyphen in the Model Health Check's fix scripts and the DAX measure builder's
TMDL is now written in quotes (`'Sales-2024'`). The MCP's answers do not change.

## Copies before -> after (6 -> 1)
| place | before | after |
|---|---|---|
| `assets/js/model-health-tmdl.js` `name` | its own regex (A) | `const name = TN.tmdlName` (require in Node, `root.DATmdlName` in the browser) |
| `assets/js/measure-builder.js` `tName` | its own regex (A) | `const tName = window.DATmdlName.tmdlName` |
| `mcp/lib/model-culture.mjs` `q` | its own regex (B) | `require('../../assets/js/tmdl-name.js').tmdlName` |
| `mcp/lib/sample-project.mjs` `name` | its own regex (B, no String first) | the same require |
| `mcp/lib/shadow-model.mjs` `q` | its own regex (B, String first) | the same require |
| `mcp/lib/twin-model.mjs` `tmdlName` | its own regex (B) | the same require |
| `assets/js/tmdl-name.js` `tmdlName` | none | the one copy |

## The parity test (step 4)
- dd2n P1-P13: every place of the probe's family tmdl-name (the module, the health check's inner name, each caller's
  line read from its source, as the probe runs it) and both pages' shipped .min.js on the 13 names: one answer each.
- Red proof (not committed): put model-health-tmdl.js's old line back (`const name = (n) => (/^[A-Za-z_][A-Za-z0-9_-]*$/
  .test(n) ? n : "'" + String(n).replace(/'/g, "''") + "'");`) and run `node mcp/test-0.3.2-dd2n.mjs`: FAIL 29 of 32,
  P3 (N3) "Sales-2024": model-health-tmdl.js name "Sales-2024" (pinned "'Sales-2024'"), and S1, S2 (a copy held).

## Decisions I made
- Each caller keeps its local name as a one-line alias of the module's function (`const q = require(...).tmdlName`),
  so no call site changes and the probe and check-contracts still find each place by its name (DD2D did the same).
- sample-project.mjs and shadow-model.mjs get `const require = createRequire(import.meta.url)` (model-culture.mjs and
  twin-model.mjs had one): the probe reads a place's source with `require` given, never `import.meta`.
- The probe runs measure-builder.js's `tName` with a page window (`{ DATmdlName: tmdl-name.js }`) as a local; the
  module is the family's first place (7 places, as DD2D listed model-file.js first).
- The unit test's 13 inputs: the probe's 9 (with '' and O'Brien among them), then 12 (a number), `it''s`, `-x`,
  `Sales_2024`.
- tmdl-name.min.js made once with the build's own minifier (`minOf`, scripts/check-min.mjs; build:min only rebuilds an
  existing .min.js); every ?v= stamp written by `npm run build:min` (placeholders first).
- WORK.md: my line fits the cap only with "SP43 (the split is done, SP1-SP44)" cut to "SP43 (the split done)".

## For the owner
none (the one changed answer, a hyphen quoted, is the side TMDL always reads the same; no Desktop look needed).

## Risky changes
- The health check's fix scripts and the measure builder now quote a name with a hyphen (`'Sales-2024'`): the text
  of a downloaded script changes for such a model. No golden or Desktop-measured test changed its expected answer.
- sample-project.mjs `name` on a number gives `'12'` where it threw (only reachable from a test: its names are fixed).

## Seen, not in scope
- Other TMDL name writers outside the family (the brief's "Not in this job"): DAX names (`'Table'[Column]`, e.g.
  twin-model.mjs `daxCol`), M quoting, and the reader tmdl-model.js.

## Lessons for the reviewer
