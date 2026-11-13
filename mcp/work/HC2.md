## Summary
- **Approval:** the brief "HC2 0.3.3" (9 Nov), B-425 (CP1's Seen 2); the owner D-1104-12 (one library), D-1109-07 (Arabic standard).
- **Base:** `fix/0.3.3-hc2` from `origin/integration/0.3.3` at d8551081. Push only this branch; never merge, no PR.
- **Scope:** the month-sort rule (`MONTH_SORT`, `columnRules` in assets/js/health-rules.js) also flags a Hijri month column
  named in Arabic. The month-name test becomes one named constant in health-rules.js. No new Arabic sentence.
- **Expected checks:** (base) golden models' MONTH_SORT counts, per model: A1 1, A6 1, every other case 0 (E1's 8 inputs 0);
  after: the same (no golden model has an Arabic Hijri column). Website model-health, sp27 (website and MCP), dd1h unchanged.
- **Resume:** none; the reviewer reads and merges.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/42704295908 on 19981cdac7fb3b83425a537e08a5c19047227428 (2026-11-09T21:56Z)

## Plan (written 2026-11-09T21:30Z)
- Measure (base d8551081, health-rules.js:275): the rule's `monthLike` regex: English Gregorian and English Hijri
  names by the suffix "(month|day|weekday) [_]name|short" (so "Hijri Month Name" matches), bare English names, "short month",
  "month-year", and Arabic only «الشهر», «اليوم», «اسم الشهر», «اسم اليوم»; plus a calculated column whose FORMAT uses
  mmm/mmmm/ddd/dddd. sort-column.js:12 holds a copy of the same regex (DD1H); not touched (see Decisions).
- Fix: a Hijri Arabic pattern, tested on the name with Arabic marks and tatweel removed: optional «اسم», optional «ال», «شهر»,
  optional spacing or "_", optional «ال», «هجري», whole name. The finding text is not changed.
- Tests (red on the base first): Arabic Hijri names flagged like the English one; 3 near-misses not.

## Before -> after (2026-11-09T21:37Z)
- Red on b8428902 (the base's code with the new checks): model-health 255 -> 259 checks, "Arabic Hijri month names without a
  sort column: found []" failed (the English, near-miss and sort-column checks passed on the base, as they must).
- After the fix: model-health 259 PASS; website sp27 3, pbip 111, sp31 17, theme-generator 922 PASS; `npm test -- model` 31
  suites PASS (MCP sp27 25, dd1h 35, fn1d 125, fn1a 4); lint 0; site config, agent-memory PASS. Each from its own output file.
- Golden models (the 11 cases, B1, B2, E1's inputs; script `golden-count.mjs` in the scratchpad), MONTH_SORT items before ->
  after: A1 1 -> 1, A6 1 -> 1, A2-A5, A7-A11, B1, B2 and all 8 E1 inputs 0 -> 0. No golden model has an Arabic Hijri column.
- No fixture re-recorded. The finding's text is unchanged (it names the column as spelled: `Table[column]`).
- The measure (health-rules.js, base): English names by suffix at :275 (Hijri included); Arabic only «الشهر / اليوم»
  with optional «اسم». No Arabic normaliser in the file.

## Arabic lines
None new (no sentence written). The pattern's words are Power BI's own: «شهر» month, «هجري» Hijri (as in time-names.js),
«اسم» name, «ال» the article.

## CHANGELOG line
- The Model Health Check's month-sort rule also finds a Hijri month column named in Arabic («الشهر الهجري», «اسم الشهر الهجري»). (mcp/CHANGELOG.md has no 0.3.3 section yet: not edited.)

## Decisions I made
- The pattern lives in health-rules.js (a named constant beside the English one), not in sort-column.js's NAME_LIKE: sp27 pins
  that health-rules.js requires only the parser and the index, and the worker and pages' load order; a require would need loader changes outside this job.
- Marks and tatweel are stripped inline (one replace), not through time-names.js (same reason); alef and taa marbuta need
  no folding: «شهر», «هجري» hold neither.
- Only the Hijri name is added; «الشهر الميلادي» and «اليوم الهجري» are not (not asked).

## For the owner
none

## Risky changes
none

## For the laptop
none (a rule's match list only; no Desktop look changes).

## Seen, not in scope
- sort-column.js:12 NAME_LIKE is a same-shape copy of the rule's English regex (DD1H); two places answer "is this a month name". Merging them needs the loader and sp27 pins changed.
- sort-column.js does not find the number column for an Arabic Hijri name (its FAMILY strip leaves «الشهر ال»): the fix script adds no sort for it.

## Lessons for the reviewer
- Website suites need `npm ci` in a fresh clone (playwright-core).
- The brief's "golden models" are not named in the repo: I used health-models.mjs's 11 cases, B1, B2 and E1's inputs.
