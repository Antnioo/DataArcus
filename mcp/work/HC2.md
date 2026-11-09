## Summary
- **Approval:** the brief "HC2 0.3.3" (9 Nov), B-425 (CP1's Seen 2); the owner D-1104-12 (one library), D-1109-07 (Arabic standard).
- **Base:** `fix/0.3.3-hc2` from `origin/integration/0.3.3` at d8551081. Push only this branch; never merge, no PR.
- **Scope:** the month-sort rule (`MONTH_SORT`, `columnRules` in assets/js/health-rules.js) also flags a Hijri month column
  named in Arabic. The month-name test becomes one named constant in health-rules.js. No new Arabic sentence.
- **Expected checks:** (base) golden models' MONTH_SORT counts, per model: A1 1, A6 1, every other case 0 (E1's 8 inputs 0);
  after: the same (no golden model has an Arabic Hijri column). Website model-health, sp27 (website and MCP), dd1h unchanged.
- **Resume:** plan committed; next: red tests on the base, then the fix.

## Plan (written 2026-11-09T21:30Z)
- Measure (base d8551081, health-rules.js:275): the rule's `monthLike` regex: English Gregorian and English Hijri
  names by the suffix "(month|day|weekday) [_]name|short" (so "Hijri Month Name" matches), bare English names, "short month",
  "month-year", and Arabic only «الشهر», «اليوم», «اسم الشهر», «اسم اليوم»; plus a calculated column whose FORMAT uses
  mmm/mmmm/ddd/dddd. sort-column.js:12 holds a copy of the same regex (DD1H); not touched (see Decisions).
- Fix: a Hijri Arabic pattern, tested on the name with Arabic marks and tatweel removed: optional «اسم», optional «ال», «شهر»,
  optional spacing or "_", optional «ال», «هجري», whole name. The finding text is not changed.
- Tests (red on the base first): Arabic Hijri names flagged like the English one; 3 near-misses not.
