# RD5: Gulf measures: the same Hijri period last year, VAT by date and country, currency pegs

## Summary
- **Approval:** the owner, D-1103-12 (3 Nov night): "Go for 10 r&ds during the night ... choose the best r&ds ideas
  that will best fit our code and make us shine"; this brief is RD5 of the scout (`rd/0.3.2-scout`, SCOUT-0.3.2.md).
- **Scope:** docs only: this note and scratch scripts under `mcp/research/rd5/`. No product file changes.
- **Base:** `rd/0.3.2-gulf-measures` from `origin/integration/0.3.2` (e3f0123). Push only it; no merge, no PR.
- **Expected checks:** no product suite touched; the prototype script ends with one `PASS  rd5-prototype  <N> checks`
  line; made-up data in `os.tmpdir()` only.
- **Expected numbers (before measuring):** Gregorian SAMEPERIODLASTYEAR pairs most Ramadan days with a non-Ramadan or
  a different Ramadan day (Ramadan moves about 11 days a year, so about 11 of 29-30 days fall outside last Ramadan);
  the Hijri pairing pairs every day but day 30 when last Ramadan had 29. VAT: 5 changes to check (UAE 2018, KSA 2018 and
  July 2020, Bahrain 2019 and 2022, Oman April 2021), Qatar and Kuwait none.
- **Resume:** plan pushed; next the prototype (d), then a-c, e-g.

## The plan
1. a) Read today's code: calendar-generator.js (Hijri columns), measure-builder.js (Ramadan and Eid measures exist on
   the website), gulf-health.js (checks those measures by name), gulf-dates.js (the dated-rule pattern),
   add_gulf_calendar (script, plan, one write), model-script.mjs (functions, names).
2. b) Microsoft's docs (SAMEPERIODLASTYEAR, DATEADD, TREATAS, calculation groups, TMDL scripts) and the official
   sources for VAT dates and pegs, each with a checked date.
3. d) A JS evaluation of the DAX logic on a made-up 3-year daily fact: Gregorian SPLY vs the Hijri pairing, days paired
   wrongly; the VAT column against each dated change.
4. c) 2-3 ways with size and risk; e) the recommendation; f) the Desktop checks; g) the builder brief.
