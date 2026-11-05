## Summary
- **Approval:** the brief "DD2T (0.3.2): one reader of a text box's runs (family text-runs)" (5 Nov); the owner
  D-1104-12 (one library, fix at the source), D-1104-18 (keep building it), D-1104-15 (text-runs is the reviewer's
  call, as CONTRACTS.md proposes), D-1016-01.
- **Base:** `feat/0.3.2-dd2t` from `origin/integration/0.3.2` at e1015660 (DD1A, DD1B, DD2O in). Push only this branch.
- **Scope:** one shared pure dual module `assets/js/text-runs.js` (CommonJS in Node, `window.DATextRuns` /
  `self.DATextRuns`): `paragraphTexts(paragraphs)`, one text per paragraph. The four `textOf` of CONTRACTS.md's
  text-runs read it; each keeps its own join and trim at the call (A " / " and trim, B " ").
- **Plan, one commit each:** 1 the module, its .min.js, suite dd2t (tests.json, beside the dd suites); 2
  report-inventory.mjs reads it (through visual-meaning.mjs, as PV); 3 layout-check.js, report-a11y.js,
  page-preview.js read it, loaded first in theme-generator.js (BUILDER, loadPreview), `npm run build:min`; 4 the parity
  test (every place, every input); 5 CONTRACTS.md, MODULES.md, CHANGELOG, WORK.md. Then merge integration once if it
  moved, `npm run build:min`, every check, `gh workflow run tests.yml`, wait.
- **Expected checks:** 4 readers -> 1 (2 joins, each named at its caller). dd2t about 50 checks after step 1, about 110
  after step 4 (exact numbers in Results). Every other suite's number unchanged; mutation 76/76; lint 0;
  check-contracts, check-modules --strict green; same-shape groups go down (4 copies of the runs reader -> 0).
- **Answers that change (only these):** a run whose value is a number (0, 12) or a boolean is text for report-a11y (a
  Tab stop, the alt-text note) and is drawn by page-preview. Two paragraphs, an empty paragraph, spaces around: each
  caller's answer as before. Anything else in a golden, twin or Desktop-measured test: stop, "## For the owner".
- **State:** step 3 (the three engines read it; theme-generator.js loads it first).
- **Resume:** step 4.

## The rule
`paragraphTexts(paragraphs)`: a list, one text per paragraph that is an object (a paragraph that is not one is
skipped, as A and report-a11y skipped it); a paragraph's text is its runs' values joined as written (a run that is not
an object skipped); a value that is a string as it is, null or undefined as "", anything else as its String (0 ->
"0", true -> "true"). Never throws (paragraphs not an array: []; textRuns not an array: ""), never changes its input.
Where the paragraphs sit (`plain(general)` in three callers, `general[0]` in page-preview) stays the caller's.
