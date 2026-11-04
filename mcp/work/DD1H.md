## Summary
- **Approval:** the brief "DD1H (0.3.2)" (4 Nov); the owner D-1104-12 (one library, fix at the source), D-1016-01
  (never 100 places), and "check which files are duplicate and one shop is older than the other" (4 Nov).
- **Base:** `feat/0.3.2-dd1h` from `origin/integration/0.3.2` at deff19e. Push only this branch; never merge, no PR.
- **Scope:** one question, "which column sorts this month or day name?", answered in one place:
  `assets/js/sort-column.js` (pure dual module: CommonJS, `window.DASortColumn`): NAME_LIKE, sortKind, SORT_BY,
  FAMILY, family, nameLike (with the Arabic suffix), sortColumnFor(columns, name, typeOf), from field-catalog.js's
  version, with the health check's null-list behaviour (no list: null). Not in this job: any other family.
- **Callers:** field-catalog.js passes its colType; model-health-tmdl.js passes its own type reader (an adapter). The
  health worker does not load model-health-tmdl.js (its importScripts list), so no worker change.
- **Before -> after:** the health check missed the sort key when the number column had no dataType, and did not read
  "Day Name (Arabic)" as a name; after, it finds what the report writer finds. The writer's answers do not change,
  except that no column list gives null where it threw.
- **Test:** mcp/test.mjs's comparison gets more inputs (its names unchanged); `mcp/test-0.3.2-dd1h.mjs`, suite dd1h:
  both callers on >= 12 made-up column sets, one answer. Red proof: health's old copy back, it fails.
- **Ledger and map:** CONTRACTS.md family 1h ("One place" line, places say who reads it); the probe gets the rule
  as a third place; MODULES.md new row. One CHANGELOG line under 0.3.2.
- **Expected checks:** dd1h passes; the probe's 1h table: one answer per input (11 of 11); sp30 every number as on
  the base (its K2 allows the one pure require); model-health and test.mjs as on the base; contracts check green;
  check-modules --strict green; lint 0; every other suite as on the base.
- **State:** plan.
- **Resume:** commit 1 (sort-column.js).
