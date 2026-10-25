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

## Results, per finding (before -> after)
Commits on `fix/0.3.1-gulf-facts`: b1ced38 plan; d737851 tests first (red); bd59d9a Sharjah (3); 25a99d8 quick setups (4);
116edd5 Oman (2); fb84d7e the false sentences (1); fbb2b7e the working-day scope (5); dd308c8 provenance and the UAE
dates' sources (6, 7); fbe192d the unsupported public sentences (6, 7, 8 on the pages); then the `?v=` stamps and the
add_gulf_calendar tests in `mcp/test.mjs`. Findings 6 and 7 are split by file kind (data and sources file in one
commit, the pages' sentences with finding 8), since the same paragraphs carried several findings.

Red first (d737851): `0.3.0-claims` 347 checks, 51 failed (every audited sentence present, every replacement
missing); `gulf-calendar` crashed at its first Sharjah calendar (no `shj` rule).

1. **False sentences** (6), each now a banned phrase in `test-0.3.0-claims.mjs` GC-1, the replacement required:
   - (a) "If yours differs, pick the fixed weekend that matches it." (article EN, AR, translations) -> Sharjah's
     government has its own option; for a weekend none of the options has, pick the closest and change the days in the
     Is Weekend and Is Working Day columns' DAX.
   - (b) "It updates by itself every day, so nobody has to change a slicer again." (FAQ a5, EN and AR, page and
     translations) -> the offsets are worked out when the table is calculated and move on with each refresh (or
     reopening), not at midnight (Microsoft Learn: TODAY; DAX overview, calculated columns: values are recalculated
     only when the table is processed or the model reloaded). "slicers that never need updating" (EN, AR) -> "move on
     with each refresh".
   - (c) add_gulf_calendar's note "Where X announces another date, it shows in check_model_health's gulfCalendar
     section" -> the dates are the UAE's (for Oman: 11 announced a day later, sourced); the check compares the
     country's calendar with Umm al-Qura and lists a difference only as a note.
2. **Oman: said, and its 11 dates sourced (built in only as data).** Each Omani date has its page in
   `DATES-SOURCES.md` (new Oman table; Khaleej Times, Oman Observer, Gulf News, Times of Oman, each opened and read
   25 Oct) and is `own.omn` in `gulf-dates.js`. Every place a country is chosen says the dates are the UAE's, that
   Oman announced 11 of them a day later (2019-2026), that Saudi Arabia's matched, and that Qatar, Kuwait and Bahrain
   may differ by a day (the generator's note and FAQ a3 and its structured data, the article's steps and "Other
   countries' sightings", add_gulf_calendar's note, the plan's date status, check_model_health's texts). gulf-health
   counts a calendar on one of Oman's sourced days as no difference. Tested: gulf-calendar section 9 (the 11 dates,
   each one day after the UAE's, each with its page; every calendar keeps the UAE's dates; gulf-health), test.mjs.
3. **Sharjah**: `shj` in the shared weekend table (Fri + Sat, then Fri + Sat + Sun from 2022-01-01; source in
   `DATES-SOURCES.md`), the generator's option "Sharjah govt: Fri-Sun since 2022" (AR «حكومة الشارقة: الجمعة-الأحد منذ
   2022»), `add_gulf_calendar` `weekend: "shj"`, gulf-health's `WEEKEND_RULES.shj`. The 9 weekend cases written by hand
   (2021-12-26 Sun working ... 2022-01-02 Sun weekend) pass on the page's DAX.
4. **Quick setups**: UAE -> `uae`, Saudi Arabia -> `ksa` (dated). The one deliberate move of another check: "quick setup
   UAE still picks Saturday + Sunday" became "picks the UAE's dated weekend" (and Saudi Arabia's).
5. **Working-day scope**: one sentence under the Weekend list (EN, AR) and in the article's column list: no public
   holidays, half days (the UAE government's Friday) or an employer's own rest days. Column unchanged.
6. **Provenance**: `gulf-dates.js` `checked` described as the day of the last announced date (the one place);
   `DATES-SOURCES.md` names it there and lost its own "Checked on 2026-10-03". "Regenerate after an announcement" ->
   "once DataArcus has added it" (article EN/AR, gulf-health's fix). The ±1 day -> the usual gap, not a limit, with the
   audit's 11 of 13 (gulf-dates.js, DATES-SOURCES.md, the article p5, the FAQ a3, gulf-health's notes).
7. **The UAE dates**: "We checked every UAE announcement" -> "We compared the UAE's 27 dates ... 24 come from a dated
   announcement; three Eid al-Adha dates (2018, 2019 and 2024) are confirmed by the official celebrations held that
   day" (EN, AR); the three rows in `DATES-SOURCES.md` say so. No dated WAM or UAE Fatwa Council announcement was
   searched for beyond the audit's (open for the reviewer's `dates.csv`).
8. **Unsupported sentences** found by grep on the article (EN, AR, translations, head), the generator page (EN, AR,
   translations, structured data), the blog and home cards:
   | Before | After |
   |---|---|
   | "in about a minute" (p2), "Build the calendar in a minute" (h3), "Build your Gulf calendar in a minute" (EN, AR) | the time claim removed |
   | "gets all of it right" (p2, EN, AR) | "handles each of these" |
   | "...Ramadan, Eid and the Right Weekend" (headline: article h1, structured data, image alts, blog card, home card; EN and AR) | "...Ramadan, Eid and Weekends" |
   | "the right weekend for each date" (Is Working Day line) | the weekend you picked; no holidays, half days, employer days |
   | Arabic "والجمعة قبل الاثنين" (false in Arabic: الاثنين sorts first, checked with Intl.Collator('ar')) and EN "Friday before Monday" | "Wednesday before Tuesday" / «والأربعاء قبل الثلاثاء» (true by collation and by code point) |
   | "the first comparison is ready on day one" (p15) | "the day-by-day comparison can start on Ramadan's first day" |
   | "refreshes instantly" (FAQ a2, EN, AR) | "needs no data source and works offline" |
   | "A complete Power BI date table" (subtitle, EN, AR) | "A Power BI date table" |
   | "Ramadan changes everything in your numbers" / "is where the real insight is" (CTA, EN, AR) | "Ramadan moves every year, and your numbers with it" / "Compare this Ramadan with last Ramadan, not March with March." |
   | "the official Saudi Umm al-Qura calendar ... can differ by one day" (FAQ a3 and structured data) | "Saudi Arabia's Umm al-Qura calendar ... usually by a day" |
   Kept, sourced: "no built-in function gives you" (FAQ a2: measured in Desktop 2.158); "only Ramadan 2018 differed"
   (DATES-SOURCES.md). Left: see "Seen, not in scope" 1-3.

## Tests (before -> after)
- `gulf-calendar` 814 -> 905 PASS (the new Sharjah cases, quick setups, section 9); `0.3.0-claims` 202 -> 347 PASS;
  `gulf-date-questions` 63 -> 63 PASS (its texts changed, its checks hold); `arabic-calendar` 31 -> 31 PASS;
  `mcp/test.mjs` shard 3/4 632 PASS (with the 2 new add_gulf_calendar checks); `test-arabic-terms` 87 PASS;
  site config PASS; csp PASS (139 pages); ar-pages PASS (38 copies); check:min PASS with new `?v=` stamps;
  sitemap-lastmod PASS (full clone).

## CHANGELOG line
- **The Gulf calendar says what it knows.** Sharjah's government weekend (Friday to Sunday since 2022) is a weekend
  option on the Calendar Generator and in `add_gulf_calendar`; the UAE and Saudi Arabia quick setups keep each
  country's weekend before its change; the pages say the announced dates are the UAE's, that Oman announced 11 of them
  a day later, that the working-day flag knows no holidays, and that the relative offsets move on with each refresh.

## For the laptop
Nothing needs Desktop: the Sharjah weekend is the same IF ( [Date] >= DATE ( ... ), WEEKDAY ( [Date], 1 ) IN { ... } )
form Desktop already applied for every country (D-GC3), with three days in the list. Optional, with the next batched
run: paste a Sharjah calendar (2021-2022) and check Sunday 2 January 2022 is a weekend day and Sunday 26 December 2021
a working day.

## Decisions I made
1. **Oman's dates are sourced and said, not built into the table.** Tried first (the plan's item 2): a day-later
   Ramadan makes Sha'ban 31 days (1440, 1441, 1442) and moving Eid al-Adha 1440 makes Dhu al-Hijjah 28 days; fixing
   them needs Oman's Sha'ban and Muharram starts, which are not sourced ("never a date without a source"). My own new
   test's expectations moved with this decision before any fix passed (the month starts I had written down in the plan
   are the Omani dates; the table keeps the UAE's). The data stays (`own.omn`) for gulf-health and for a later change
   that sources Oman's other months.
2. The Sharjah option's label is "Sharjah govt: Fri-Sun since 2022": the brief's "UAE: Sharjah government, from
   2022-01-01" (and my first "Sharjah government: Fri-Sun since 2022") is cut in the drop-down below 1024 px (291 px
   for 276 px; the suite's width check). Before 2022 Sharjah's rule is Friday + Saturday, the weekend the 2022 change
   replaced, as for every country (earlier history not checked).
3. The headline "the Right Weekend" changed on the article, the blog and home cards (the audit's "the right weekend" is
   an unsupported claim wherever it stands); the share image was not regenerated (Seen 1).
4. The website picks no Omani or other country's dates by weekend: one label, "(UAE)", stays true for every country.

## For the reviewer
- `claims.csv` (the audit's 84 unsupported sentences): I fixed what the grep above found; please hand me the rows that
  remain, or check them against the table in item 8.
- `dates.csv`: if it holds dated WAM or UAE Fatwa Council announcements for Eid al-Adha 2018, 2019 or 2024, their URLs
  turn those three rows into dated announcements (item 7).

## Seen, not in scope
1. The share image `assets/img/og/gulf-calendar.jpg` still says "the right weekend for each country and year"
   (`scripts/make-share-images.mjs:207`): regenerate it with a new line (proposed: "Hijri dates, announced Ramadan and
   Eid, and each country's dated weekend").
2. "Free" on the generator page (badge "Free tool · No sign-up", meta "Copy, paste, done. Free.", the article's "Open
   the free DAX Calendar Table Generator") and site-wide: the brief's rule says never "free" in public claims; site-wide,
   so the owner decides. "Copy, paste, done" is also a completeness claim.
3. The Egypt quick setup keeps the fixed Friday + Saturday weekend: no sourced history for Egypt.
4. check_model_health has no Sharjah "country": `add_gulf_calendar` with `weekend: "shj"` checks itself against the
   UAE's federal weekend, so its `selfCheck` lists every Sunday since 2022 as GC_WEEKEND (true against the federal
   rule; noisy for a Sharjah model). Proposed: a `weekend` option on check_model_health's Gulf section.
5. The generator writes "Is After UAE Weekend Change" only for the UAE option, not for Sharjah's (also changed on
   2022-01-01).
6. The Arabic notes mix English column names inline (as before on this page); they read in the right order at 390 and
   1280 px, but the «و» before an English name sits next to it visually.
