## Summary
- **Approval:** the brief "DD1H (0.3.2)" (4 Nov); the owner D-1104-12 (one library, fix at the source), D-1016-01
  (never 100 places), and "check which files are duplicate and one shop is older than the other" (4 Nov).
- **Base:** `feat/0.3.2-dd1h` from `origin/integration/0.3.2` at deff19e. Push only this branch; never merge, no PR.
- **Scope:** one question, "which column sorts this month or day name?", answered in one place:
  `assets/js/sort-column.js` (pure dual module: CommonJS, `window.DASortColumn`): NAME_LIKE, sortKind, SORT_BY,
  FAMILY, family, nameLike (with the Arabic suffix), sortColumnFor(columns, name, typeOf), from field-catalog.js's
  version, with the health check's null-list behaviour (no list: null). Not in this job: any other family.
- **Callers:** field-catalog.js passes its colType; model-health-tmdl.js passes the rule's colType (decision below) and
  keeps `columns || []`. The health worker does not load model-health-tmdl.js (its importScripts list): no worker change.
- **Before -> after:** the health check missed the sort key when the number column had no dataType, and did not read
  "Day Name (Arabic)" as a name; after, it finds what the report writer finds. The writer's answers do not change,
  except that no column list gives null where it threw.
- **Test:** mcp/test.mjs's comparison gets more inputs (its names unchanged); `mcp/test-0.3.2-dd1h.mjs`, suite dd1h:
  both callers on 14 made-up column sets, one answer (35 checks). Red proof: health's old copy back, 10 of 35 fail.
- **Ledger and map:** CONTRACTS.md family 1h ("One place" line, places say who reads it); the probe gets the rule
  as a third place; MODULES.md new row. One CHANGELOG line under 0.3.2.
- **Expected checks:** dd1h passes; the probe's 1h table: one answer per input (11 of 11); sp30 every number as on
  the base (its K2 allows the one pure require); model-health and test.mjs as on the base; contracts check green;
  check-modules --strict green; lint 0; every other suite as on the base.
- **State:** code done; the full checks and CI next.
- **Resume:** run the checks, merge integration once if it moved, CI, the CI line here.

## Two answers -> one (made-up column sets; before: the writer / the health check; after: both)
| input | writer before | health before | after (both) |
|---|---|---|---|
| Month Name, Month Number with no dataType | Month Number | none | Month Number |
| Day Name (Arabic), Day of Week Number int64 | Day of Week Number | none | Day of Week Number |
| Month Name (عربي), Month Number, no types | Month Number | none | Month Number |
| Fiscal Month Name, Fiscal Month No with no dataType | Fiscal Month No | none | Fiscal Month No |
| Month Year, Year Month Number with no dataType | Year Month Number | none | Year Month Number |
| اسم الشهر, رقم الشهر with no dataType | رقم الشهر | none | رقم الشهر |
| Month Name, no column list | throws TypeError | none | none |
| Hijri Month Name, only the Gregorian number; Month Number as text; "Month" untyped | none | none | none |

## Decisions I made
- The health check's type reader: a column with no dataType is unknown, never text, for a data column too (the old
  'string' default is gone). Reasons: RULES-POWERBI.md ("never default a missing type to text, it gives wrong
  findings"); tmdl-model.js already reads a missing TMDL type as unknown, so only a model.bim or .pbit column with no
  dataType met the 'string' default; and unknown counts only when the name says number ("Month Number"), so a text
  "Month" is still never picked (P9). It is therefore the rule's own colType, passed by name: no copy.
- The rule keeps the health check's null list (`(columns || [])`), so the writer's sortColumnFor gives null on no list
  where it threw (the ledger's proposed answer).
- sort-column.js also exports ARABIC_SUFFIX and colType: field-catalog.js reads both (its twin-pairing uses the suffix).
- The probe gets the rule as a third 1h place (as DD1G did); all three answer the same on 11 of 11.
- sort-column.min.js made once with terser (build:min only rebuilds an existing .min.js); every ?v= stamp was written
  by `npm run build:min` (placeholders first).

## For the owner
A made-up model (made-up names, no data): table Calendar, columns Date (dateTime), Month Name (string), Month Number
(no dataType); the finding: Calendar[Month Name] sorts A to Z.
- Before, the fix script added a column and sorted by it: `column 'Month Number 2' = MONTH ( 'Calendar'[Date] )`
  (int64, hidden), then `sortByColumn: 'Month Number 2'` on Month Name.
- After: no column added; `sortByColumn: 'Month Number'` on Month Name (the model's own number, as the writer sorts).
No new Arabic sentence.

## Risky changes
- test-0.3.2-sp30.mjs K2: its allowed requires for field-catalog.js now include `./sort-column.js` (a pure file). No
  number moved (21 checks as before).
- The health check reads a missing dataType as unknown for data columns too (Decisions): a model.bim or .pbit month
  number column with no type is now a sort key.

## Seen, not in scope
- assets/js/health-rules.js MONTH_SORT `monthLike` is a third copy of NAME_LIKE (in the worker) without the Arabic
  suffix: "Day Name (Arabic)" is never a finding, so the health check's new suffix reading is not reached from a model
  yet. A job for the owner's call (it changes findings and scores).
- assets/js/pbip-query.js and field-suggest.js test month or day names with their own small regexes (not this rule).

## Lessons for the reviewer
- sp30 K2 pinned field-catalog.js's requires, as sp42 P2 did in DD1G: a brief that adds a shared file should name
  the tests that pin a caller's imports.
- The brief's "Arabic suffix" gap lives in the health engine's finding too, not only the fix script's rule: a
  parity test of the rule alone cannot show that a finding never reaches it.
