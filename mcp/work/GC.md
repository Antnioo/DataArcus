# GC (0.3.1, wave 6): the Gulf calendar's facts, from the outside audit of 25 Oct

Cloud builder, 25 Oct. Branch `fix/0.3.1-gulf-facts` from `origin/integration/0.3.1` (df778b6). Push only this
branch; no PR, no merge. Running at the same time: T1 (a mutation test file), Q1 (lint and coverage, told to stay out
of this job's files: calendar-generator.js, gulf-dates.js, gulf-health.js, measure-builder.js,
mcp/lib/gulf-calendar.mjs, the Gulf article and the generator page).

The audit (read-only, public code at main d76703c) checked the Gulf calendar's dates, weekends and public claims
against official sources. Every public claim must be true before 0.3.1 ships.

## Plan, one commit per finding (tests first, red, then the fix)

1. **The false sentences.**
   - (a) "If yours differs, pick the fixed weekend that matches it." (article EN and AR, translations): false for its
     own example, Sharjah (Friday, Saturday and Sunday off since 2022-01-01). New: Sharjah has its own option (item 3);
     for any other weekend pick the fixed one that matches it if there is one, otherwise change the days in the Is
     Weekend column's DAX.
   - (b) "It updates by itself every day" (generator FAQ a5, EN and AR) and "slicers that never need updating" (the
     relative offsets' note, EN and AR): TODAY in a calculated table is read when the table is recalculated (a
     refresh), not at midnight (Microsoft Learn, Calculated tables; TODAY). New: the offsets move on with each refresh.
   - (c) `mcp/lib/gulf-calendar.mjs` "Where X announces another date, it shows in check_model_health's gulfCalendar
     section": gulf-health has no table of another country's dates. New: says what is used for that country and that
     the check lists a difference from Umm al-Qura only as a note.
   - Test: `mcp/test-0.3.0-claims.mjs` GC-1: each false sentence is a banned phrase on the files that carried it, and
     each new sentence is required (EN and AR).
2. **Oman: said and built in (i + ii).** `gulf-dates.js` gets `own.omn`: the 11 Omani announcements that differ from
   the UAE's (each one day later), each with its source in `DATES-SOURCES.md` (a new Oman table: Khaleej Times, Oman
   Observer, Gulf News, Times of Oman, every page opened and read on 25 Oct). The generator uses them when the
   calendar is for Oman (the website: Oman's weekend picked; the MCP: `country: "omn"`); every other date is the
   UAE's. Every place a country is chosen says whose dates they are: the UAE's, Oman's own where it announced another
   day, and that Qatar, Kuwait and Bahrain may announce a day apart (none sourced). gulf-health: for Oman, a date that
   is Oman's sourced date is not a difference.
   Expected in an Oman calendar with the announced dates on (month starts in the DAX): 1440 Ramadan 2019-05-07,
   Shawwal 2019-06-05, Dhu al-Hijjah 2019-08-03 (Eid al-Adha 2019-08-12); 1441 Ramadan 2020-04-25; 1442 Ramadan
   2021-04-14; 1443 Ramadan 2022-04-03; 1444 Shawwal 2023-04-22; 1445 Ramadan 2024-03-12, Dhu al-Hijjah 2024-06-08
   (Eid 2024-06-17); 1446 Shawwal 2025-03-31; 1447 Ramadan 2026-02-19. Every other month start as the UAE calendar's;
   every month 29 or 30 days. A UAE calendar: byte for byte as before.
3. **Sharjah.** A weekend rule `shj` in the shared weekend table: Friday + Saturday until 2021-12-31 (the weekend the
   2022 change replaced; earlier history not checked, as for every country), Friday + Saturday + Sunday from
   2022-01-01 (Sharjah Executive Council, 9 Dec 2021). The website's option "UAE, Sharjah government: Fri to Sun
   since 2022" (EN and AR), the MCP's `weekend: "shj"`. Expected: 2021-12-26 (Sun) working day, 2021-12-31 (Fri)
   weekend, 2022-01-02 (Sun) weekend, 2022-01-06 (Thu) working day, 2022-01-07 (Fri) weekend.
4. **The quick setups follow the weekend's history.** UAE picks `uae` (Fri + Sat before 2022), Saudi Arabia `ksa`.
   Deliberate move: the gulf-calendar suite's check "quick setup UAE still picks Saturday + Sunday" becomes "picks the
   UAE's dated weekend" (and Saudi Arabia's). Egypt and Global stay fixed (no sourced history).
5. **The working-day flag's scope**, one sentence where the weekend is picked (EN and AR): Is Weekend and Is Working
   Day know only the weekend: not public holidays, not short days (the UAE government's Friday ends at noon), not an
   employer's own rest days (set by contract). The column is unchanged.
6. **Provenance.** One date in one place: `gulf-dates.js` `checked` is the day of the last announced date in the table
   (later dates are estimates); `DATES-SOURCES.md` names it there instead of its own "Checked on" date. "Regenerate
   after an announcement" says it helps once DataArcus's table has the new date. The ±1 day comment becomes the
   forecast's usual gap (the audit: 13 estimates 2027-2030 against a published forecast, 11 the same, 2 one day apart),
   not a guarantee; the public "can move by a day" sentences the same.
7. **The UAE dates.** "We checked every UAE announcement" becomes what is true: 24 of the 27 dates match a dated
   announcement; the three Eid al-Adha dates of 2018, 2019 and 2024 are confirmed by the day's official celebrations,
   not a dated announcement (marked so in `DATES-SOURCES.md`).
8. **Unsupported claims** on the article (EN, AR, translations) and the generator page (EN, AR, translations): speed,
   completeness, always/never; each fixed or sourced, listed below. The reviewer's `claims.csv` is welcome for a second
   pass (asked under "For the reviewer").

Tests first: `scripts/tests/gulf-calendar.mjs` (Oman's dates, Sharjah, the quick setups, the working-day note,
provenance), `mcp/test-0.3.0-claims.mjs` (GC-1), `mcp/test-0.3.0-gulf-date-questions.mjs` (Sharjah modelled now),
`scripts/test-arabic-terms.mjs` on the new Arabic lines. Then `build:min`, `check:min`, csp, ar-pages, site config,
sitemap-lastmod, `run-all.mjs`, `cd mcp && npm test`.

## Before (df778b6, run 25 Oct)
- `gulf-calendar` 814 checks PASS, `tools` 391 PASS; `0.3.0-claims` 202 PASS; `gulf-date-questions` 63 PASS;
  `arabic-calendar` 31 PASS.

## Expected
- Red before each fix: GC-1 (every false sentence present), the Oman month starts (UAE's dates today), the Sharjah
  option (missing), the quick setups (fixed weekends), the working-day note (missing), the provenance line.
- After: every suite PASS; counts rise only by the new checks; no other suite's expected number changes, except the one
  quick-setup check said in item 4.
