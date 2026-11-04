## Summary
- **Approval:** the owner, D-1104-01 (4 Nov): "Agree on all r&ds": RD5 (Gulf measures) approved as its recommendation;
  this job is RD5's builder brief (g), word for word (`rd/0.3.2-gulf-measures`, `mcp/research/RD5-gulf-measures.md`).
- **Base:** `feat/0.3.2-gm1` from `origin/integration/0.3.2` at 1691046. Push only this branch; never merge, no PR.
- **Scope:** (1) `assets/js/gulf-measures.js` (new, UMD): the Ramadan and Eid DAX builders out of measure-builder.js;
  the page calls it, its output byte-identical. (2) `assets/js/gulf-dates.js`: `vat` (rules by country, `from`, `rate`)
  and `pegs`, each with its own `checked` date; sources in `scripts/gulf-calendar/DATES-SOURCES.md`. (3)
  `calendar-generator.js`: an off-by-default `vat` option, a `VAT Standard Rate %` column (the weekendDax pattern).
  (4) add_gulf_calendar: inputs `measures` (max 5 "Table[Measure]", each a measure of the model), `vat`, `pegs` (both
  false by default); measures on the new calendar table, names via `freeNamer`; pegs a 6-row table, KWD with no rate.
  (5) a new suite `test-0.3.2-gm1.mjs` (area model), the website suite gulf-calendar (page unchanged).
- **Expected numbers (RD5 section d, measured again here):** the Hijri pairing the script writes right on **379 of
  383** Ramadan days (1439-1451), the 4 others day 30 after a 29-day Ramadan; SAMEPERIODLASTYEAR **0 of 383**; on flat
  made-up sales B +4.2 % (1445) and 0.0 % (1446), A +28.2 % and +24.7 %. VAT: 0 disagreements on every day 2017-2026,
  6 countries, the 10 edges.
- **Expected checks:** `gm1` about 45, red on 1691046 (no engine, no inputs). model area 19 suites / 869 checks ->
  20 / 869 + gm1. gulf-calendar (website) + 6 checks (the 6 page outputs captured on the base, commit 1). fx1 22 x 3.
  No other suite's number changes. Plan answer (L-1102-06), default inputs: 3,778 chars -> 3,778 (+0).
- **Base numbers (1691046):** model 19 suites, 869 checks, all pass; fx1 22 / 22 / 22; plan answer 3,778.
- **Got:** (after the work)
- **Resume:** step 1.

## The plan
1. This note; the base capture of the page's 8 Ramadan and Eid measures (`scripts/tests/capture-gm1-baseline.mjs`,
   `fixtures/gulf-calendar/gm1-measures.json`: 3 settings x EN, AR). Commit, push.
2. `test-0.3.2-gm1.mjs` first, red on the base: P pairing (379/383, 4 day-30s, growth), V VAT (every day, 10 edges),
   N names (an existing measure name renamed, never replaced; references follow), S script (never an existing table,
   reads back), B the shared builder equals the page's capture, K pegs (KWD no rate), R refusals, A answer (names only:
   no DAX, no values; the plan line EN and AR).
3. The engines (gulf-measures.js, gulf-dates.js, calendar-generator.js), measure-builder.js calling the shared one;
   `npm run -s build:min`; new ?v= stamps on the pages that load them; csp; the page loads gulf-measures.min.js.
4. gulf-calendar.mjs (lib) and the tool: the 3 inputs, the plan line, the description; TOOLS.md.
5. Answer sizes, fx1 x3, CHANGELOG line, WORK.md, areas, lint, sitemap, merge in once if moved, CI.

## CHANGELOG line
(after the work)

## Decisions I made
(after the work)

## For the owner
(after the work)

## Risky changes
(after the work)

## Seen, not in scope
(after the work)

## For the laptop
(after the work)

## Lessons for the reviewer
(after the work)
