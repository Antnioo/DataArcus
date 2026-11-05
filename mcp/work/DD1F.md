## Summary
- **Approval:** the brief "DD1F (0.3.2)" (5 Nov); the owner D-1104-12 (one library, fix at the source), D-1104-18 (keep
  building it), D-1104-15 (1f: the ledger's proposal, one test, the reviewer's call), D-1016-01 (never 100 places).
- **Base:** `feat/0.3.2-dd1f` from `origin/integration/0.3.2` at 128285e (DD1A, DD1H in it). Push only this branch; never merged.
- **Scope:** one shared pure dual module `assets/js/arabic-script.js` (CommonJS / `window.DAArabicScript` /
  `self.DAArabicScript`): `ARABIC` (the Arabic block, its supplement U+0750-077F, extended-A U+08A0-08FF, both
  presentation-form blocks U+FB50-FDFF, U+FE70-FEFF; one regex, no g flag) and `hasArabic(t)`. The seven places of
  CONTRACTS.md's 1f read it; text-measure `ARABIC` and pbip-query `AR_LETTERS` stay exported as the SAME object.
- **Plan (one commit each):** 0 this note; 1 the module, .min.js, suite dd1f (unit); 2 the MCP places (dax-functions
  storyLang, report-bind arName, twin-plan arOf); 3 the engines (text-measure, field-catalog, report-rules, pbip-query)
  and their loaders (the three theme generator pages, theme-generator.js BUILDER and loadBind), sp30 K2 admits the file;
  4 the parity test in dd1f; 5 CONTRACTS.md 1f, MODULES.md row, the probe's 1f places, CHANGELOG, WORK.md.
- **Expected:** 7 tests -> 1 module (1 function, 1 regex); the probe's 1f: 3 groups, 4 of 11 disagree -> 1 group, 0;
  dd1f new (about 15 unit + 7 x 15 parity + source checks); sp30 the same number (K2 widened, not added); every other
  suite's number unchanged; mutation 76/76; lint 0; check-contracts, check-modules --strict green.
- **Answers that change (expected):** group B (report-rules) gains U+0750, U+08A0; group C (pbip-query, storyLang,
  report-bind, twin-plan) gains U+FEFB, U+FDF2, U+0750, U+08A0. Digits and the question mark: no change.
- **Got:** (filled at the end)
- **State:** plan pushed.
- **Resume:** the next unchecked step above.
