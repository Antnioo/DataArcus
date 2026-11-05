## Summary
- **Approval:** the brief "DD1F (0.3.2)" (5 Nov); the owner D-1104-12 (one library, fix at the source), D-1104-18 (keep
  building it), D-1104-15 (1f: the ledger's proposal, one test, the reviewer's call), D-1016-01 (never 100 places).
- **Base:** `feat/0.3.2-dd1f` from `origin/integration/0.3.2` at 128285e (DD1A, DD1H in it). Push only this branch; never merged.
- **Scope:** one shared pure dual module `assets/js/arabic-script.js` (CommonJS / `window.DAArabicScript` /
  `self.DAArabicScript`): `ARABIC` (the Arabic block, its supplement U+0750-077F, extended-A U+08A0-08FF, both
  presentation-form blocks U+FB50-FDFF, U+FE70-FEFF; one regex, no g flag) and `hasArabic(t)`. The seven places of
  CONTRACTS.md's 1f read it; text-measure `ARABIC` and pbip-query `AR_LETTERS` stay exported as the SAME object.
- **Commits:** plan fb05d1f; 1 module, suite dd1f (4cb9f6f), 1b its MODULES.md row; 2 the MCP places (84624a94);
  3 the engines and their loaders; 4 the parity test, the probe's and the ledger's place names (4a3d33d1); 4b planTwin's
  auto label (28235f74); 5 CONTRACTS.md, MODULES.md, CHANGELOG, WORK.md, this note.
- **Expected checks:** 7 tests -> 1 module (1 function, 1 regex); the probe's 1f: 3 groups, 4 of 11 disagree -> 1 group, 0;
  dd1f new (about 15 unit + 7 x 15 parity + source checks); sp30 the same number (K2 widened, not added); every other
  suite's number unchanged; mutation 76/76; lint 0; check-contracts, check-modules --strict green.
- **Got:** 7 tests -> 1 module; probe 1f: 1 group, 0 of 11 disagree; dd1f 137 checks (16 unit, 1 + 105 parity, 15
  source); sp30 21 as before. Full run, 5 shards side by side: base 204 suites -> 205 (dd1f added), every other
  suite's number the same; mutation 76/76 killed; website suites 42/42; lint 0; contracts, modules --strict green.
- **Red proof:** report-bind's old `AR_COL` put back (the line and its call): dd1f 132 of 137 (4 P, 1 S). Not committed.
- **State:** code done; integration/0.3.2 did not move (128285e): no merge; CI below.
- **Resume:** the DONE steps (merge once if integration moved, build:min, every check, tests.yml).

## Tests before -> after (each place; the probe's 11 texts)
| place | before | after | answers false -> true |
|---|---|---|---|
| text-measure `ARABIC` | own class (group A) | arabic-script `ARABIC` itself | none |
| field-catalog `AR_SCRIPT` -> `langOf` | own class (group A) | `AS.hasArabic` | none |
| report-rules `AR_LETTER` -> `headerNeed` | block + presentation forms (B) | `AS.hasArabic` | U+0750, U+08A0 |
| pbip-query `AR_LETTERS` | block only (C) | arabic-script `ARABIC` itself | U+FEFB, U+FDF2, U+0750, U+08A0 |
| dax-functions `storyLang` | block only (C) | `hasArabic` (lang === 'ar' stays) | the same four |
| report-bind `AR_COL` -> `arName` | block only (C) | `hasArabic` | the same four |
| twin-plan `arOf` (planTwin) | block only (C) | `hasArabic` | the same four |
No answer went true -> false. Digits, «؟» and a direction mark alone: unchanged in all seven.

## Answers that changed (made-up inputs)
- The writer (create_report and the website download): a chart title of «ﻻ» (U+FEFB) by «المنطقة» is «ﻻ حسب المنطقة»
  (before: «ﻻ» alone, the two names read as different scripts). Seen on the three theme generator pages (Playwright).
- create_report: the story sentence of a measure named «ﷲ» (U+FDF2) in an Arabic report is Arabic (storyTitles
  `sentence: 'Arabic'`; before English); a count of a column named «ݐ» (U+0750) is «عدد ݐ» (before «Count of ݐ»).
- check_report: an Arabic header written with U+0750 or U+08A0 letters gets the Arabic band (lowW below needW).
- The twin: a label already typed with presentation forms counts as Arabic (arOf, and planTwin's auto sentence label).
- No golden, twin or Desktop-measured test changed its expected answer (the 48 twin suites and the full run pass with
  their numbers).

## Decisions I made
- The probe names each place by the caller now that the old names went: field-catalog `langOf` (=== 'ar'),
  report-rules `headerNeed` (lowW < needW, Segoe UI 12, scale 1), report-bind `arName` (its Arabic word chosen);
  text-measure and pbip-query run as exports (they are exported). check-contracts needs the ledger's rows to match.
- planTwin's second inline test (twin-plan.mjs, the auto sentence's label) moved too: the brief opens a function already
  in the job; the other files' inline tests are "Seen".
- The MODULES.md row went in as 1b (the checker refuses a callers list the code does not have yet: "none yet" first).
- theme-generator.js: arabic-script first in BUILDER and before field-catalog in loadBind; the pages load it before
  text-measure. No worker loads any of the four engines (importScripts only in model-health-worker.js).

## For the owner
none

## Risky changes
none (every changed answer is false -> true on letters outside the basic block; no test's expected answer moved).

## Seen, not in scope (the next brief: inline U+0600-U+06FF tests that are not a 1f place)
assets/js/pbip-query.js:227 (a field's language), arabic-names.js:16, label-limits.js:31, pbip-tooltip.js:104,
story-titles.js:13; mcp/lib/report-result.mjs:190, twin-texts.mjs:348 and 350, plan-disclosure.mjs:43 (`isEn`, not
1f's opposite), arabic-lens.mjs:42, shadow-model.mjs:27, arabic-names.mjs:29, check-language.mjs:17;
mcp/tools/plan_layout.mjs:136, 158, 302, 313. 13 files (tests in mcp/test.mjs left out).

## Lessons for the reviewer
- Steps 2 and 3 left check-contracts red (3 of 735: AR_COL, AR_LETTER renamed before the ledger moved); step 4 made it
  green. Move the probe and the ledger in the same commit as the rename.
- Step 1's .min.js was staged before `npm run build:min` wrote it (check-min reads `git ls-files`): it carried a
  placeholder until step 2; nothing loaded it in between. Stage a new .min.js, then build, then stage again.
