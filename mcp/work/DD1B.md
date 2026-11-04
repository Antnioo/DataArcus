## Summary
- **Approval:** the brief "DD1B (0.3.2)" (4 Nov); the owner D-1104-12 (one library, fix at the source), D-1104-18 (keep
  building it), D-1104-15 (the ledger's proposals stand as the reviewer's call for 1b and 1d), D-1016-01.
- **Base:** `feat/0.3.2-dd1b` from `origin/integration/0.3.2` at 78f7fc28. Push only this branch; never merge.
- **Scope:** one shared pure dual module `assets/js/pbir-values.js` (`window.DAPbirValues` / `self.DAPbirValues`,
  CommonJS in Node): `litText`, `litNumber`, `litBool`, `litShown`, `columnWidth`. Every place in CONTRACTS.md's
  1b-text (18), 1b-number (8), 1b-bool (6) and 1d (5) tables reads it; their own copies go.
- **Plan (one commit each):** 1 the module, its .min.js, its unit test `mcp/test-0.3.2-dd1b.mjs` (suite dd1b, twin
  area beside dd1c); 2 the MCP readers (mcp/lib); 3 the browser engines (assets/js) and their loaders; 4 the parity
  test (every place on the 15 literals and 12 entries); 5 CONTRACTS.md, MODULES.md, CHANGELOG, WORK.md.
- **Answers that change (the brief's list):** `'it''s'` in twin-geometry litOf and redesign L -> "it's"; `12L` in
  report-a11y tr -> 12 (was 0, B-332); `120L` and an entry with no properties in dax-functions widthOf -> 120 and null
  (was NaN, and a TypeError, B-332). Answers to inputs that are not the question's literal (a number read as text,
  `''` -> nothing) follow the rule: the caller says `?? ''` / `?? 0` where it wanted that.
- **Expected checks:** dd1b about 80 after step 1, about 300 after step 4 (one answer per input per question);
  every other suite's number unchanged; twin area +1 suite; mutation 76/76; lint 0; check-modules --strict and
  check-contracts green; samejob.py: not in the repo (as DD1C found): not run.
- **State:** step 0 (this plan). **Resume:** step 1.
