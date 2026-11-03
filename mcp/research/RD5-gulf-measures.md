# RD5: Gulf measures: the same Hijri period last year, VAT by date and country, currency pegs

## Summary
- **Approval:** the owner, D-1103-12 (3 Nov night): "Go for 10 r&ds during the night ... choose the best r&ds ideas
  that will best fit our code and make us shine"; this brief is RD5 of the scout (`rd/0.3.2-scout`, SCOUT-0.3.2.md).
- **Scope:** docs only: this note and `mcp/research/rd5/rd5-prototype.mjs`. No product file changes.
- **Base:** `rd/0.3.2-gulf-measures` from `origin/integration/0.3.2` (e3f0123). Push only it; no merge, no PR.
- **Checks:** no product suite touched. `node mcp/research/rd5/rd5-prototype.mjs`: `PASS  rd5-prototype  29 checks`;
  made-up data in `os.tmpdir()` only (`rd5-madeup-fact.json`, `rd5-result.json`).
- **Got (measured, 13 Ramadans 1439-1451, the calendar add_gulf_calendar writes by default):** Gregorian
  SAMEPERIODLASTYEAR pairs **0 of 383** Ramadan days with the same day of last Ramadan (241 with another Ramadan day,
  142 with a day outside Ramadan); on made-up flat sales it reports **+28.2 %** (1445) and **+24.7 %** (1446) growth
  where there is none. The Hijri pairing the website's Measure Builder already writes is right on **379 of 383**; the 4
  others are day 30 after a 29-day Ramadan (+4.2 % on flat sales, said, not hidden). VAT: 6 countries, 5 dated changes,
  the generated DAX read back and right on every day 2017-2026 (0 disagreements).
- **Recommendation:** way 1: add_gulf_calendar's script carries the Ramadan and Eid measures (one shared builder taken
  out of measure-builder.js) on the new calendar table, plus a `VAT Standard Rate %` column for the chosen country;
  pegs as an off-by-default 6-row table. Builder brief (g): medium size, medium risk; 6 Desktop checks (f).
- **Resume:** done; the owner picks whether brief g goes out.

## The plan (as pushed first)
1. a) today's code; 2. b) Microsoft's docs and the sources for VAT and pegs, each checked; 3. d) the JS evaluation;
4. c) the ways; e) the recommendation; f) the Desktop checks; g) the builder brief.

## a) Today's code
- **The calendar** (`assets/js/calendar-generator.js:170-186`): Hijri Year, Hijri Month Number, Hijri Day, Is Ramadan,
  `Ramadan Day = IF ( [Hijri Month Number] = 9, [Hijri Day] )`, the Eid flags, Is Estimated Date. Hijri month starts
  are Umm al-Qura (ICU `islamic-umalqura`), Ramadan, Shawwal and Dhu al-Hijjah moved to the UAE's announced dates
  (`hijriMonthStarts`, `:46`). `hijriFor` (exported) gives the exact Hijri date the DAX gives: the prototype uses it.
- **The measures exist, on the website only.** `assets/js/measure-builder.js:108-131`: `Last Ramadan` (TREATAS of
  Hijri Year - 1 and Ramadan Day), `vs Last Ramadan %` (this side kept to Ramadan days), the Eid al-Fitr and Eid al-Adha
  windows (7 days before, 3 or 4 Eid days) and their Last Year and % measures. They live inside a `DOMContentLoaded`
  closure (`:9`): Node can't load them, so the MCP can't offer them without a shared module.
- **The health check already asks for them.** `assets/js/gulf-health.js:39` lists the 8 measure suffixes and `:290`
  says "No Ramadan or Eid measures ... Add them (fixes.measureBuilder)": today the MCP finds the gap and sends the person
  to the website to close it.
- **The dated-rule pattern** (`gulf-dates.js:46-58` weekends, `calendar-generator.js:82-94` weekendDays/weekendDax): a
  list of `{ from, value }` per country, the newest rule first in a nested IF. VAT is the same shape.
- **The one write** (`mcp/tools/add_gulf_calendar.mjs`): one `createOrReplace` script with one new table, a plan with
  `outputs`, the model read again before the write. `gulf-calendar.mjs:47-52` builds the table; names checked against
  every table, measure and column (`takenNames`). **A measure must go on the new table:** a `createOrReplace` of an
  existing fact table that lists only measures would replace that table.
- **Seasonal pages** (`mcp/lib/gulf-date-questions.mjs:18-49`): plan_layout already asks grain (gregorian, hijri,
  seasonDay) and scope (one Hijri year or every season); a "vs last Ramadan" visual fits the seasonDay grain.
- **VAT and pegs:** nothing in the code today (grep of `assets/js` and `mcp/lib`: no VAT rate, no currency table).

## b) Microsoft's docs and the sources (all read 3 Nov 2026)
**Microsoft Learn**
- SAMEPERIODLASTYEAR: the dates "shifted one year back"; the same as `DATEADD ( dates, -1, year )`; "in a lunar year,
  SamePeriodLastYear will produce different results at the date granularity" (learn.microsoft.com/dax/sameperiodlastyear-function-dax).
- TREATAS applies a table's values as filters to columns; values not in the column are ignored (learn.microsoft.com/dax/treatas-function-dax).
  That is why day 30 with no partner gives blank, not an error.
- Calendar-based time intelligence (preview, "Enhanced DAX Time Intelligence"): calendars defined on a table, said to
  work with "Lunar" calendars; at date grain a shift is by position ("Feb 29 2008 ... treated as the 60th day of the
  year"); Learn's workaround is `DATEADD ( Calendar, -<months in a year>, month )`
  (learn.microsoft.com/power-bi/transform-model/desktop-time-intelligence). The Calendar objects need compatibility
  level 1701 (learn.microsoft.com/dotnet/api/microsoft.analysisservices.tabular.calendar). Preview: not for a default.

**VAT, the standard rate by date** (each from the authority's law or its guide as reported; a source to re-read on
the authority's own site before the builder writes the dates, see g):
| Country | Changes | Source |
|---|---|---|
| UAE | 5 % from 2018-01-01 | Federal Decree-Law No. 8 of 2017 (WAM, 27 Aug 2017; FTA, tax.gov.ae) |
| Saudi Arabia | 5 % from 2018-01-01; 15 % from 2020-07-01 | ZATCA; Ministry of Finance announcement, May 2020. Transitional: contracts before 11 May 2020 could keep 5 % to 30 Jun 2021 (EY, PwC summaries of ZATCA's guide) |
| Bahrain | 5 % from 2019-01-01; 10 % from 2022-01-01 | Decree-Law No. 48 of 2018; Law No. 33 of 2021; NBR's transitional guide (24 Dec 2021): contracts before the change could keep 5 % to 31 Dec 2022 |
| Oman | 5 % from 2021-04-16 | Royal Decree 121/2020 (Official Gazette 18 Oct 2020, in force 180 days later); Oman Tax Authority, taxoman.gov.om |
| Qatar, Kuwait | no VAT (checked 3 Nov 2026) | both signed the GCC VAT framework (5 %); no VAT law in force and no date set (Qatar's General Tax Authority; Kuwait's 2026-2030 fiscal plan has none, as reported July 2026). The column must be regenerated when either sets a date |

**Pegs** (units per 1 US dollar; each the central bank's own page):
| Currency | Per USD | Source |
|---|---|---|
| AED | 3.6725 | Central Bank of the UAE (centralbank.ae, domestic market operations: buys 3.672, sells 3.673) |
| SAR | 3.75 | SAMA (sama.gov.sa, "the official rate of 3.75 riyals to the dollar") |
| QAR | 3.64 | Qatar Central Bank (qcb.gov.qa, exchange rate policy; Amiri Decree No. 34 of 2001) |
| BHD | 0.376 | Central Bank of Bahrain (cbb.gov.bh, monetary policy) |
| OMR | 0.3845 | Central Bank of Oman (cbo.gov.om, "USD 2.6008 per RO" since 1986; 1 / 2.6008 = 0.384497) |
| KWD | none | Central Bank of Kuwait (cbk.gov.kw, exchange rate policy): an undisclosed weighted basket since 20 May 2007 |

## c) The ways
| Way | What | Size | Risk |
|---|---|---|---|
| 1. The calendar script carries them | add_gulf_calendar gains `measures` (up to 5 "Table[Measure]" names the person gives) and `vat`, `pegs` flags; the script adds the Ramadan and Eid measures for each named measure **on the new calendar table**, a `VAT Standard Rate %` column for the chosen country, and on `pegs` a 6-row `Gulf Currency Pegs` table. The DAX comes from one shared builder (`assets/js/gulf-measures.js`) that measure-builder.js and the MCP both use | M: one shared module out of measure-builder.js, about 200 lines in gulf-calendar.mjs, 4 inputs, tests | Medium: measure names against the model (takenNames), the base measure only a name; the shape of TMDL measures on a DAX table must be measured in Desktop (f1) |
| 2. A Hijri calendar object | the script defines a calendar-based TI calendar on the new table (Year = Hijri Year, Month = Hijri Year Month Sort, Month of Year = Hijri Month Number, Day of Month = Hijri Day, Date), and measures call `DATEADD ( 'Hijri', -12, MONTH )` | S in code | High: preview feature, compatibility 1701 and a Desktop option; at date grain the shift is by position, which the prototype predicts right on only 233 of 383 days (C below); unmeasured in Desktop |
| 3. Website only | the Calendar Generator gets a VAT column option and a pegs table option; the Measure Builder already has the measures | S | Low; but the MCP keeps sending the person to the website for what its own health check asks for |

## d) The measured prototype (`mcp/research/rd5/rd5-prototype.mjs`, made-up data, 29 checks)
The calendar is the one add_gulf_calendar writes by default (announced dates), 2016-09-01 to 2030-12-31; each
Ramadan 1439-1451 against the Ramadan before (383 Ramadan days). "Right" = paired with the same Ramadan Day of the
Hijri year before.

| Method | Right | Another Ramadan day | Outside Ramadan | No partner |
|---|---|---|---|---|
| A. SAMEPERIODLASTYEAR on Date (what most reports do) | **0** | 241 | 142 | 0 |
| B. TREATAS ( Hijri Year - 1, Ramadan Day ) (Measure Builder's `Last Ramadan`) | **379** | 0 | 0 | 4 |
| C. calendar-based shift by day of the Hijri year (hypothesis) | 233 | 142 | 8 | 0 |
| D. calendar-based DATEADD -12 months, a missing day 30 blank (hypothesis) | 379 | 0 | 0 | 4 |

A is wrong on every one of the 13 Ramadans (29 or 30 of 29 or 30 days each). C is off by one day on 142 days because a
Hijri year has 354 or 355 days and the months before Ramadan differ by a day year to year.

**On made-up flat sales** (3 years by day, 2023-2025: 1,000 a day, Ramadan x1.5, its last ten days x2, Eid days x2.5,
no real growth; `os.tmpdir()/rd5-madeup-fact.json`):
| Ramadan | Days (last) | A: SPLY | B: Hijri pairing | B against all of last Ramadan |
|---|---|---|---|---|
| 1445 vs 1444 | 30 (29) | +28.2 % | +4.2 % (day 30, no partner) | +4.2 % |
| 1446 vs 1445 | 29 (30) | +24.7 % | 0.0 % (last year's day 30 left out) | -4.0 % |

So the right pairing still moves the % by one day's share when the lengths differ (4.2 % on this shape). The measure
must say so in its description, and the plan must say which Hijri years have 29 or 30 days: from the calendar, never
from the data.

**VAT column** (the DAX generated as weekendDax nests rules, read back from its own text, every day 2017-2026):
| Country | DAX | Days at each rate | Disagreements |
|---|---|---|---|
| uae | `IF ( [Date] >= DATE ( 2018, 1, 1 ), 5, 0 )` | 0: 365, 5: 3,287 | 0 |
| ksa | `IF ( [Date] >= DATE ( 2020, 7, 1 ), 15, IF ( [Date] >= DATE ( 2018, 1, 1 ), 5, 0 ) )` | 0: 365, 5: 912, 15: 2,375 | 0 |
| bhr | `IF ( [Date] >= DATE ( 2022, 1, 1 ), 10, IF ( [Date] >= DATE ( 2019, 1, 1 ), 5, 0 ) )` | 0: 730, 5: 1,096, 10: 1,826 | 0 |
| omn | `IF ( [Date] >= DATE ( 2021, 4, 16 ), 5, 0 )` | 0: 1,566, 5: 2,086 | 0 |
| qat, kwt | `0` | 0: 3,652 | 0 |
Each change lands on its date and no other (10 edge checks: the day before and the day of each). Pegs: OMR's 0.3845
agrees with the bank's 2.6008 to the 4th decimal; KWD is never written as a number.

## e) The recommendation
**Way 1**, in two steps:
1. **Measures and VAT** (the shine): add_gulf_calendar's script carries `Last Ramadan`, `vs Last Ramadan %` and the two
   Eid windows (with Last Year and %) for each measure the person names, and `VAT Standard Rate %` for the chosen
   country. The health check's "No Ramadan or Eid measures" is then closed by the same tool that finds it. A Gulf team
   shows "this Ramadan against last, day by day" (A: 0 of 383 right; B: 379) to the boss in the same click as the calendar.
2. **Pegs**, off by default: a 6-row table (Currency, Per USD, Central Bank, Checked; KWD with a blank rate and "a
   basket, no fixed rate"). No conversion measure is written: which column holds which currency is the person's.
Not way 2 now: it rests on a preview and on a date-grain rule the prototype finds wrong on 150 of 383 days; keep it as
a Desktop check (f5) for later. What the column says, and what it never says: "the standard rate in force on the date";
never the rate a sale was charged (zero-rated and exempt supplies, and the transitional contracts of KSA to 30 Jun 2021
and Bahrain to 31 Dec 2022, are not in a date column), never tax advice.

## f) The Desktop checks (one batched laptop run; the sample project, made-up data only)
1. Apply the script in TMDL view on the Gulf Calendar test model (`scripts/gulf-calendar/test-model`) with a made-up
   fact loaded from `rd5-madeup-fact.json`: Preview shows one new table with its measures and nothing replaced.
2. A table visual, Hijri Year 1445 and 1446 x Ramadan Day, base and `Last Ramadan`: day 5 meets day 5; 1445's day 30
   blank on the Last Ramadan side. Cards: `vs Last Ramadan %` = +4.2 % (1445) and 0.0 % (1446); a SAMEPERIODLASTYEAR
   measure beside them = +28.2 % and +24.7 % (the prototype's numbers; a gap of 0.1 or more is a stop).
3. The Eid windows: the Eid al-Fitr window of 1446 covers 2025-03-23 to 2025-04-01 (7 days before 30 Mar, 3 Eid days).
4. `VAT Standard Rate %` with country ksa on 2020-06-30 and 2020-07-01: 5 and 15; bhr on 2021-12-31 and 2022-01-01: 5
   and 10; omn on 2021-04-15 and 2021-04-16: 0 and 5.
5. (For later, way 2) With "Enhanced DAX Time Intelligence" on, a Hijri calendar on the table:
   `SAMEPERIODLASTYEAR ( 'Hijri' )` and `DATEADD ( 'Hijri', -12, MONTH )` at Ramadan Day grain, against C (233/383)
   and D (379/383). Record which reading Desktop takes for a missing day 30 (blank or the month's last day).
6. The pegs table with `pegs: true`: 6 rows, KWD's rate blank; the measures' and table's descriptions show in the
   Data pane.

## g) The builder brief (medium size, medium risk; about 1.5 days)
- **Base:** a new branch from `integration/0.3.2`; plan and expected numbers in `mcp/work/<ID>.md` first, pushed.
- **Shared builder:** move the Ramadan and Eid DAX builders (`measure-builder.js:69-76`, `:108-131`) into
  `assets/js/gulf-measures.js` (UMD like gulf-dates.js); measure-builder.js calls it (its output byte-identical: a test
  compares the page's 8 measures before and after); `npm run build:min`.
- **Dates in one place:** `assets/js/gulf-dates.js` gains `vat` (rules by country, `from` and `rate`) and `pegs`, each
  with its own `checked` date; `scripts/gulf-calendar/DATES-SOURCES.md` gains the two tables of section b, every row
  re-read on the authority's or bank's own page before it is written.
- **The tool:** add_gulf_calendar inputs `measures` (max 5 "Table[Measure]", each must be a measure of the model: refused
  otherwise), `vat` (default false), `pegs` (default false). Measures go on the new calendar table; names via `freeNamer`;
  descriptions say the day-30 rule and "standard rate in force on the date"; the plan line lists them (EN and AR).
  The answer names measures and columns only: no DAX, no values.
- **Tests first by risk:** (1) TREATAS pairing against the prototype (379 of 383, the 4 day-30s); (2) the VAT DAX read
  back on every day and the 10 edges; (3) a measure named like an existing one is renamed, never replaced; (4) the
  script never names an existing table; (5) the page's Measure Builder output unchanged; (6) `pegs` KWD has no rate.
  One line in `mcp/tests.json`.
- **Expected numbers:** the prototype's (section d); TOOLS.md and the tool description within their caps
  (the instructions are at their cap: the new behaviour goes in the tool description).
- **Stop if** Desktop check f1 shows any table replaced, or f2 differs from section d by 0.1 or more.

## Decisions I made
- Measures go on the new calendar table, not the base measure's table: a `createOrReplace` of a fact table would
  replace it (a.). The person can move them in Model view.
- VAT as "the standard rate in force on the date" only; transitional rules and zero-rated supplies are named, not modelled.
- Pegs off by default and without a conversion measure (which amount is in which currency is the person's).
- The VAT and peg sources in b are the laws and the banks' pages as found and summarised on 3 Nov 2026; the brief asks
  the builder to re-read each on the authority's own site before writing it (some came through secondary summaries).
- C and D are my reading of Learn's calendar-based rules, marked as hypotheses for Desktop (f5), not facts.

## Seen, not in scope
- `measure-builder.js` keeps its patterns inside a `DOMContentLoaded` closure, so none of the website's 22 measures can
  be tested from Node today (the Ramadan ones included).
- `gulf-health.js:182` finds the measures by name suffix only: a "Last Ramadan" measure written with SAMEPERIODLASTYEAR
  passes the check while pairing 0 of 383 days right.
- Saudi Arabia's Ramadan dates are the UAE's (`gulf-health.js:158`: they match for 2018-2026); when a Saudi
  announcement differs from the UAE's, `gulf-dates.js` `own` has no `ksa` list to hold it (Oman's is there).
