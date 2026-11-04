## Summary
- **Approval:** the brief "DD1A (0.3.2)" (4 Nov); the owner D-1104-15 (one time test for all four places), D-1104-12
  (one library, fix at the source), D-1104-18 (keep building it), D-1016-01 (never 100 places).
- **Base:** `feat/0.3.2-dd1a` from `origin/integration/0.3.2` at eb1f284 (DD1B in it). Push only this branch; never merged.
- **Scope:** one shared pure dual module `assets/js/time-names.js` (`window.DATimeNames` / `self.DATimeNames`,
  CommonJS in Node): `wordsOf(name)`, `isTimeName(name)`, `TIME_WORDS` (one list). The four places of CONTRACTS.md's
  1a (mirror-policy `isTime`, page-preview `timeDirOf`, pbip-query `isTime`, layout-check `TIMEY`) call isTimeName
  for the name; what each knows first stays first (a date table; the picker's `time` / `kind` mark). Their own lists go.
- **Plan (one commit each, pushed after each):** 0 this note; 1 the module, .min.js, suite dd1a (tests.json beside
  dd1c); 2 the four places read it, every loader loads time-names.js first (the three theme generator pages' script
  tags, theme-generator.js BUILDER and loadPreview), mirror-policy `strOf` becomes `PV.litText`, sp10 P10's allowed
  list admits `./time-names.js` and `./pbir-values.js`, dd1b's S2 exception goes; 3 the parity test (in dd1a);
  4 CONTRACTS.md 1a "One place", 1b-text row, MODULES.md row, CHANGELOG, WORK.md.
- **Expected:** four lists -> one; the probe's 1a: 12 of 24 disagreements -> 0 (every input one answer); dd1a its own
  number (said in Results); every other suite's number as before; mutation 76/76; lint 0; check-contracts,
  check-modules --strict green. A golden or twin test changing its answer beyond the brief's list: stop, "For the owner".
- **Resume:** see "## Results" and the last commit.
