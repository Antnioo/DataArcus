# The Gulf calendar inside the DataArcus MCP: plan

> **Owner's decisions (2026-10-03):** build the **beta cut** after round 3 (`fix/round-3-safety`), before packaging;
> the full version (D1 shared engine, scripts, the Ramadan and Eid page, D4 the website) is decided after the beta;
> D2 announced dates stay UAE-only for the beta (others against Umm al-Qura; Saudi Arabia sourced next); D3 the Gulf
> section shows only when a country is given or the model has Hijri/Ramadan columns, and the country never changes
> `weekStart`. D5 (a calendar-only query as metadata) is not needed for the beta cut. Correction to "Seen, not in
> scope": round 2's sort script on an imported calendar WAS checked in Desktop on 2026-10-03 (as expected after one
> "Refresh now"); the pack is live (`2e6fc3d`).

**Plan only** (owner's go 2026-10-03). No code, tests or Desktop runs were made for it. Written on
`plan/gulf-calendar-mcp`, from `feat/gulf-calendar-pack` (`a74d050`), after reading round 2 on `fix/round-2-arabic`
(`3de54e3`). The builder owns every engine, test and fixture named below; nothing here changes them.

## What this builds on
- **The pack** (`feat/gulf-calendar-pack`, waiting for the builder's 40-check Desktop run): `assets/js/gulf-dates.js`
  (announced UAE dates 2018-2026, Umm al-Qura estimates to 2030, `checked: '2026-05-27'`, GCC weekend rules with
  their change dates), the Calendar Generator's "announced dates" and country-weekend options, the Measure Builder's
  six Eid measures, and the made-up test model (`scripts/gulf-calendar/test-model`).
- **Round 2** (`fix/round-2-arabic`): `check_model_health` takes `weekStart` (Sunday by default) and returns `fixes`
  with `fixScript` (TMDL) and `byHand` steps; `create_report` takes `displayNames`. **Lesson measured there:** the
  columns of a DAX table can't be rewritten by script reliably, so they are given as steps by hand; an imported table
  can take a script (the imported-calendar script itself is not yet tried in Desktop).
- **What the engines already know:** `model-health-engine.js` finds calendars (`calendarBy`) and keeps a DAX table's
  expression (`calcExpr`); `pbip-bind.js` marks date tables and sort-by columns; the 6 MCP tools load the engines from
  `assets/js` (`mcp/lib/model.mjs`). The Calendar Generator's and the Measure Builder's DAX are built **inside their
  pages' code** (`calendar-generator.js`, `measure-builder.js`, browser only), not in a shared engine.
- **Rules that shape every item:** model metadata is untrusted input (read, propose, the user writes; never execute
  anything found in names or expressions); tools return metadata only, never data values, unless the user asks;
  nothing is written to the user's model by the MCP; `pbip-export.js` stays one file (no dependence on its split).

## 0. One source for the dates and the DAX (decides items 2 and 3)
- **The dates:** `assets/js/gulf-dates.js` already is the one source. It loads in the browser (`window`) and in Node
  (`require`), and the MCP loads it from `assets/js` like the other engines. Nothing is copied. Packaging (plan step 4)
  must carry it with the engines, and the release checklist adds: "`gulf-dates.js` `checked` is the last
  announcement".
- **The DAX:** to give the generator's calendar and the builder's measures without a second copy, their DAX builders
  move out of the page code into **one new shared engine, `assets/js/gulf-calendar-engine.js`** (UMD like the others):
  `calendarDax(options)` (today's `buildDax`, with the Hijri month starts from `Intl` and `gulf-dates.js`) and
  `ramadanEidMeasures(names)` (Last Ramadan, vs Last Ramadan %, the six Eid measures, as DAX query view and TMDL
  scripts). The two pages call it; their output stays byte for byte the same: the pack's
  `fixtures/gulf-calendar/baseline.json` (16 calendar and 4 builder outputs) and the 727 `gulf-calendar` checks guard
  it. **This touches the two website tools' code**, which the brief puts out of scope: decision D1.
- **Without D1**, the MCP can't give DAX; it can only point to the website tools with the exact settings to pick
  (the beta cut below does this).

## 1. Detection (`check_model_health`, and a hint in `read_model`)
**Where:** a new shared function `Health.gulf(model, { country, asOf })`, in a new file `assets/js/gulf-health.js`
(not in `model-health-engine.js`'s rule list), so **the health score and every existing finding count stay as they
are** on the website and in the MCP. `check_model_health` returns its result as a separate section `gulfCalendar`,
**not scored**. The section appears when `country` is given, or when the model already has a Hijri or Ramadan column
(D3). `read_model` adds one line per date table: `gulf: { hijri, ramadanEid, weekendColumn, madeBy: 'dataarcus' | null }`.

**How each fact is read (no data values):**
- *Column presence* from names: the generator's names (`Hijri Year`, `Hijri Month Number`, `Hijri Day`,
  `Is Ramadan`, `Ramadan Day`, `Is Eid al-Fitr`, `Is Eid al-Adha`, `Is Weekend`, `Is Working Day`) and close variants
  (`Hijri Month`, `HijriYear`, `السنة الهجرية`, `رمضان`...). A calendar with other names can be mapped by the caller
  with `calendarColumns: { hijriYear: 'Calendar[HYear]', ... }`, as `columnTypes` works today.
- *A DataArcus DAX calendar* (its expression starts with the generator's comment) is read from its expression: the
  range (`CALENDAR ( DATE (...), DATE (...) )`), the embedded Hijri month starts (the `DATATABLE` rows), and the
  `Is Weekend` expression, evaluated on dates by a small evaluator for the generator's forms only (`WEEKDAY ( [Date],
  1 ) IN { }`, `IF ( [Date] >= DATE ( ) ...)`, `NOT`); anything else is "can't tell from the files", never guessed.
- *Any other calendar* (imported, or someone else's DAX): the dates and the weekend are values, so the files can't say.
  The section lists those checks as skipped and returns `GULF_FACTS_QUERY`: one DAX query that returns **only the
  calendar's own facts** (per Hijri year: the first date of Ramadan, Shawwal and Dhu al-Hijjah 10; per Gregorian year:
  which weekdays are marked weekend), to run with Microsoft's Power BI Authoring MCP **with the user's go**, then
  passed back as `calendarFacts`. It reads the calendar table only, never a fact table. (Same pattern as `columnTypes`.)

**Findings** (ID, when, level, wording EN / AR; the level orders them, nothing is scored):

| ID | When | Level | English: title / why / fix | Arabic: title / why / fix |
|---|---|---|---|---|
| `GC_NO_CALENDAR` | no calendar table found | medium | No calendar table / Without one there is nowhere for Hijri dates, Ramadan and Eid or the weekend, so every comparison falls back to Gregorian months. / Add one from the DataArcus Calendar Generator (Hijri dates, announced Ramadan and Eid, your country's weekend), then mark it as a date table. | لا يوجد جدول تقويم / بدونه لا مكان للتاريخ الهجري ولا لرمضان والعيد ولا لعطلة نهاية الأسبوع، فتعود كل مقارنة إلى الأشهر الميلادية. / أضف جدولًا من مولّد التقويم في داتا أركوس (التاريخ الهجري، ومواعيد رمضان والعيد المعلنة، وعطلة دولتك)، ثم علّمه كجدول تاريخ. |
| `GC_NO_HIJRI` | calendar without Hijri year, month and day | medium | The calendar has no Hijri dates / Ramadan and Eid move about 11 days a year; without the Hijri year, month and day a report can only compare Gregorian months, which mixes Ramadan with ordinary days. / Add Hijri Year, Hijri Month Number and Hijri Day (fixes.GULF_CALENDAR). | التقويم بلا تاريخ هجري / يتحرك رمضان والعيد نحو 11 يومًا كل عام، وبدون السنة والشهر واليوم الهجري لا يقارن التقرير إلا الأشهر الميلادية، فيخلط رمضان بالأيام العادية. / أضف Hijri Year وHijri Month Number وHijri Day (fixes.GULF_CALENDAR). |
| `GC_NO_FLAGS` | Hijri columns, but no Ramadan or Eid columns | low | No Ramadan or Eid columns / Without Is Ramadan, Ramadan Day and the Eid flags, Ramadan can't be compared day by day and Eid can't be filtered. / Add them (fixes.GULF_CALENDAR). | لا توجد أعمدة لرمضان أو العيد / بدون Is Ramadan وRamadan Day وعلامات العيد لا يمكن مقارنة رمضان يومًا بيوم ولا تصفية العيد. / أضفها (fixes.GULF_CALENDAR). |
| `GC_WEEKEND` | the weekend column disagrees with the country's rule on any date in range | high | The weekend doesn't match {country} / Working-day counts and averages are wrong on {n} days, for example Friday 31 December 2021 marked as a working day. / Use the {country} weekend (fixes.GULF_CALENDAR). | عطلة نهاية الأسبوع لا تطابق {الدولة} / عدد أيام العمل ومتوسطاتها خاطئة في {n} يومًا، مثل الجمعة 31 ديسمبر 2021 مسجلة يوم عمل. / استخدم عطلة {الدولة} (fixes.GULF_CALENDAR). |
| `GC_DATES_DIFFER` | a Ramadan, Shawwal or Dhu al-Hijjah start differs from `gulf-dates.js` | medium | Ramadan or Eid dates differ from the announced ones / For example Ramadan 1439 starts on 16 May 2018 in the model; the UAE announced 17 May. Sources: DATES-SOURCES.md. / Use the announced dates (fixes.GULF_CALENDAR). | مواعيد رمضان أو العيد تختلف عن المعلنة / مثلًا يبدأ رمضان 1439 في النموذج يوم 16 مايو 2018، وأعلنت الإمارات 17 مايو. المصادر: DATES-SOURCES.md. / استخدم المواعيد المعلنة (fixes.GULF_CALENDAR). |
| `GC_ESTIMATES` | the calendar covers Ramadan or Eid after `checked` and has no `Is Estimated Date` | info | Future Ramadan and Eid dates are not marked as estimates / Dates after {checked} are not announced yet and can move by a day. / Add Is Estimated Date (fixes.GULF_CALENDAR), and regenerate after each announcement. | مواعيد رمضان والعيد المستقبلية غير مميَّزة كتقديرات / المواعيد بعد {checked} لم تُعلن بعد وقد تتغير يومًا واحدًا. / أضف Is Estimated Date (fixes.GULF_CALENDAR)، وأعد إنشاء التقويم بعد كل إعلان. |
| `GC_ENDS_EARLY` | the calendar ends before the end of the next Ramadan after `asOf` | medium | The calendar ends before the next Ramadan / It ends on {end}; Ramadan {year} is expected from {start}. / Extend the calendar's end date. | التقويم ينتهي قبل رمضان القادم / ينتهي في {end}، ومن المتوقع أن يبدأ رمضان {year} في {start}. / مدّد تاريخ نهاية التقويم. |
| `GC_NO_MEASURES` | Hijri columns, but none of the Ramadan or Eid measures | info | No Ramadan or Eid measures / Last Ramadan, vs Last Ramadan % and the Eid windows compare like with like. / Add them (fixes.GULF_MEASURES). | لا توجد مقاييس لرمضان أو العيد / مقاييس رمضان الماضي ونسبة التغير وفترات العيد تقارن المتماثل بالمتماثل. / أضفها (fixes.GULF_MEASURES). |

Each finding carries `source: 'files' | 'calendarFacts'` and its items (dates, columns, measures), at most `maxItems`.

- **Files:** `assets/js/gulf-health.js` (new), `mcp/server.mjs` (`check_model_health`: `country`, `asOf` (tests
  only), `calendarColumns`, `calendarFacts`, the `gulfCalendar` section; `read_model`: the `gulf` line),
  `mcp/README.md`.
- **Tests first** (`mcp/test.mjs` and a Node suite for `gulf-health.js`), expected numbers written now, `asOf:
  2026-10-03`:
  - `tmdl-ramadan` (existing fixture: the generator's DAX calendar 2022-2027, Umm al-Qura, fixed Saturday-Sunday;
    Last Ramadan and vs Last Ramadan % measures): country UAE gives **no** `GC_WEEKEND` (every date is after the
    2022 change), **no** `GC_DATES_DIFFER` (2022-2026 match), `GC_ESTIMATES` with **3 items** (Ramadan, Eid al-Fitr
    and Eid al-Adha 1448), `GC_NO_MEASURES` **absent** (Ramadan measures exist; the Eid ones are offered in fixes,
    not as a finding), `GC_ENDS_EARLY` absent (Ramadan 1448 ends 2027-03-08, before 2027-12-31). Country Saudi Arabia:
    `GC_WEEKEND` with **626 days** (every Friday and Sunday of 2022-2027). The score and findings: **unchanged**.
  - the pack's test model calendar as a TMDL project (new fixture, saved by the builder from Desktop): UAE clean;
    Saudi Arabia `GC_WEEKEND` **939 days** (Fridays and Sundays 2022-2030; 2018-2021 agree).
  - the same calendar regenerated without "announced dates" and with a 2018 start (new fixture, generator output
    wrapped as a `model.bim`): `GC_DATES_DIFFER` with **1 item**, Ramadan 1439 (model 2018-05-16, announced
    2018-05-17).
  - `health-project` (existing fixture: an imported calendar, Power Query, with Date, Year, Month Number, Month Year
    and Year Month; no Hijri and no weekend column): `GC_NO_HIJRI` only; no `GC_WEEKEND` (there is no weekend column:
    the fix adds one); the score and findings unchanged.
  - an imported calendar with Hijri and weekend columns (new made-up fixture): dates and weekend listed as skipped with
    `GULF_FACTS_QUERY`; with `calendarFacts` from a made-up answer (Friday-Saturday marked in 2023), country UAE:
    `GC_WEEKEND` with **105 days** (the 52 Fridays and 53 Sundays of 2023).
  - a model with no calendar (new made-up fixture): `GC_NO_CALENDAR`.
  - a calendar whose `Is Weekend` uses another form: weekend listed as "can't tell", not a finding.
- **Measure in Desktop first:** M4 (the query runs and returns only calendar facts).
- **Effort:** 1.5 builder sessions for the files path; +1 for `GULF_FACTS_QUERY` and `calendarFacts`.
- **Risks:** foreign calendars with other names (the mapping input covers it); the weekend evaluator must stay
  small and refuse unknown forms; `asOf` defaults to today, so findings like `GC_ENDS_EARLY` change with time (tests
  pin it); names and expressions are read as text only.

## 2. Fixes: `fixes.GULF_CALENDAR`
The fix depends on the calendar's kind (round 2's lesson):

| Calendar | Fix | Why |
|---|---|---|
| None | The generator's DAX for a new table `Calendar` (country weekend, announced dates on; the user gives the first and last year, since the tool reads no dates), with steps: Modeling > New table, paste, mark as date table, relate. | A new table is safe to paste. |
| A DataArcus DAX calendar | The same table regenerated: its options read from its header comment (range, week start, fiscal start, names language), plus announced dates and the country's weekend. **Steps by hand**: select the table, select all in the formula bar, paste, Enter. Columns keep their names, so relationships, sort-by columns and visuals stay (M1). | A DAX table's columns can't be rewritten by script (round 2). Replacing the expression is one paste. |
| Someone else's DAX calendar | A **script** that adds a new table `Hijri Months` (`createOrReplace table`, the month starts with announced dates), then **steps by hand** to add each Gulf column to their calendar (New column, each column's DAX given: a lookup into `Hijri Months`). | New table by script is safe; their table's columns are by hand. |
| An imported calendar | A **script**: the `Hijri Months` table, and under `ref table <Calendar>` calculated columns for the Hijri date, the flags, `Is Estimated Date` and the weekend (M2). | An imported table can take a script (round 2); the script itself must be measured. |

- The DAX comes from `gulf-calendar-engine.js` (D1); the dates from `gulf-dates.js`. Nothing is applied by the tool:
  `howToApply` as in round 2, "Save a copy first".
- **Files:** `assets/js/gulf-calendar-engine.js` (new, D1), `assets/js/calendar-generator.js` (calls it, output
  unchanged), `assets/js/model-health-tmdl.js` (the `Hijri Months` and `ref table` scripts, beside `sortFixes`),
  `mcp/server.mjs`.
- **Tests first:** the 16 calendar outputs of `baseline.json` equal `calendarDax()` for the same options (the page
  and the engine agree); the regenerated DAX for `tmdl-ramadan` equals the generator's output for 2022-2027, week
  Sunday, weekend UAE, announced dates on (compared to the page's output in the browser); the imported-calendar
  script for `health-project`'s calendar, with a 2018-2030 range: one `createOrReplace table 'Hijri Months'` with
  **162 month starts** (1439/4 from 2017-12-19 to 1452/9 from 2030-12-26, the same rows as the pack's test model's
  `calendar.dax`, with the announced 2018 Ramadan), and under `ref table Calendar` one calculated column per Gulf
  column; no script ever for a DAX table's columns.
- **Measure in Desktop first:** M1, M2, M3.
- **Effort:** D1 extraction 1 session; regenerated DAX and steps 0.5; `Hijri Months` + imported script 1 (after M2).
- **Risks:** the header comment of an old or hand-edited calendar may not parse (then: a new table, not a
  replacement); M1 may show that replacing the expression drops "mark as date table" or the sort-by columns (then the
  steps say to set them again).

## 3. Measures: `fixes.GULF_MEASURES`
- **What:** the Measure Builder's Last Ramadan, vs Last Ramadan %, and the six Eid measures, with the user's base
  measure, calendar table and date column names (from `read_model`: the base measure `suggest_fields` picks, the
  date table), only those the model lacks.
- **As what:** both of the builder's forms. **The DAX query view script** (DEFINE MEASURE ..., then "Update model with
  changes") first: it is the path the pack's 40-check Desktop run checks. The TMDL script second, once M3 passes.
  Never applied by the tool.
- **Files:** `assets/js/gulf-calendar-engine.js` (`ramadanEidMeasures`, D1), `assets/js/measure-builder.js` (calls it,
  output unchanged), `mcp/server.mjs`.
- **Tests first:** the builder's 4 outputs in `baseline.json` unchanged; for `tmdl-ramadan` the script holds exactly
  the **6 Eid measures** (Last Ramadan and vs Last Ramadan % exist) with `'Calendar'[Hijri Month Number]`,
  `'Calendar'[Date]` and `[Total Sales]`; for a model with a calendar named `Dates` and date column `Day`: no
  `'Calendar'` and no `[Date]` in the script (as the pack's test); a model without Hijri columns gets no measures,
  only `GC_NO_HIJRI`.
- **Measure in Desktop first:** M3 (the TMDL form only; the DAX query view form is covered by the 40-check run).
- **Effort:** 0.5 session after D1. **Risk:** base measure picked wrongly (the caller can pass `baseMeasure`).

## 4. Reports: a "Ramadan and Eid" page
- **When:** `create_report` with `gulfPage: true` (default false: no existing report changes), and only when the model
  has `Hijri Year`, `Ramadan Day`, `Is Ramadan`, the Ramadan measures and the Eid window measures. `suggest_fields`
  returns `gulf: { ready: true | false, missing: [...] }` with the fields it would use.
- **What the page shows:** a title; a single-select **Hijri Year** slicer, written with the latest Ramadan before the
  report's date selected (1447 today: no data is read); 4 cards: This Ramadan (base measure on Ramadan days), Last
  Ramadan, vs Last Ramadan %, Eid al-Fitr window vs last year %; a **line chart**: base measure and Last Ramadan by
  Ramadan Day (1 to 30, filtered Is Ramadan = TRUE); a **clustered column chart**: Eid al-Fitr and Eid al-Adha windows
  and last year's windows. Display names (round 2) apply; Arabic titles from the report texts; right to left as the
  other pages.
- **When the fields are missing:** the page is **not added** (never a page with broken fields), and `modelNotes` says
  which fields are missing and which fix gives them (`check_model_health` fixes.GULF_CALENDAR / GULF_MEASURES), then
  "call create_report again".
- **Files:** `assets/js/pbip-export.js` (one more page type, written in the file as it is today), `assets/js/
  pbip-bind.js` (`gulf` fields), `assets/js/design-engine.js` (the page's slots for the layouts and page sizes),
  `mcp/server.mjs`. Not the website (D4).
- **Tests first** (`mcp/test.mjs`, `scripts/tests/pbip.mjs` stays as it is): `tmdl-ramadan` with the Eid measures
  added (new fixture) and `gulfPage: true` gives one more page with exactly 1 slicer, 4 cards, 1 line, 1 column
  chart, every field bound to an existing object, the slicer's selected value 1447; without the Eid measures: no page
  and one `modelNotes` entry naming the 6 missing measures; without `gulfPage`: the files are identical to today's
  (apart from random ids); Microsoft's validator 0 errors.
- **Measure in Desktop first:** M5, M6, M7, M8.
- **Effort:** 2.5 builder sessions (measurements, page, Desktop check in English and Arabic, 1920 and 1280).
- **Risks:** a slicer selection written into PBIR may not hold (M6: fall back to no selection and a "pick a year"
  text); 30 Ramadan days on a line axis at 1280 may hide labels (round 1 lesson: measure with real-sized values);
  the page needs the Eid measures, so it depends on item 3.

## 5. A country parameter
`country: 'uae' | 'ksa' | 'qat' | 'kwt' | 'bhr' | 'omn'`, default `'uae'`, on `check_model_health` (the `gulfCalendar`
section), the fixes and the report page. What it changes:
- **The weekend rule** checked and written (`gulf-dates.js` `weekends`, with each change date).
- **The announced dates:** `gulf-dates.js` has the UAE's only. For Saudi Arabia the reports showed the same dates, but
  they are not sourced separately; for Qatar, Kuwait, Bahrain and Oman they are not checked. So for any country but
  the UAE, `GC_DATES_DIFFER` compares with Umm al-Qura and says "announced dates are sourced for the UAE only" (D2).
- **Not the week start.** `weekStart` keeps round 2's own default (Sunday) and meaning; `country` never changes it,
  so no round 2 output moves (D3).
- **Names in the findings:** the country's name in English and Arabic.
- **Files:** `assets/js/gulf-dates.js` (country names; per-country dates only with D2), the tools above.
- **Tests first:** the `GC_WEEKEND` counts above (UAE 0 and Saudi Arabia 626 on `tmdl-ramadan`); an unknown country is
  refused with the list; `weekStart` outputs identical with and without `country`.
- **Effort:** 0.5 session; sourcing the other five countries' announcements 2018-2026: 1 reviewer session (D2).

## Desktop measurements needed (before the code they affect)
| | Measurement | For |
|---|---|---|
| M1 | Replace a DataArcus DAX calendar's expression in the formula bar with the regenerated one (same name, more columns): relationships, sort-by columns, "mark as date table", existing visuals and measures still work? | 2 |
| M2 | TMDL view on an imported calendar: `createOrReplace table 'Hijri Months'` plus `ref table Calendar` calculated columns: accepted, Preview and Apply, values right after refresh? | 2 |
| M3 | TMDL view: new measures under `ref table Sales` (the Measure Builder's TMDL output): accepted, and the same values as the DAX query view path? | 3 |
| M4 | `GULF_FACTS_QUERY` through Microsoft's MCP on a 13-year calendar: runs, returns only the calendar's facts, time taken | 1 |
| M5 | Line chart, 30 Ramadan days on the axis, with real-sized values ("0.4M", "22K"): all labels whole at 1920 and 1280, English and Arabic | 4 |
| M6 | A single-select slicer with a value pre-selected in `visual.json`: does Desktop show and apply it? | 4 |
| M7 | The 4 cards and the column chart at each page size: `cardFit` sizes hold; the chart's legend with 4 series fits | 4 |
| M8 | The page right to left (Arabic): the line chart's axis order and the slicer, as the other mirrored pages | 4 |

All on made-up models (the pack's test model, `tmdl-ramadan`, a new imported one), never a work model.

## The full list with effort (builder sessions)
| Item | Effort | Needs |
|---|---|---|
| 1a Detection from files (presence, our DAX calendars: weekend, dates, estimates, range) | 1.5 | - |
| 1b Detection for other calendars (`GULF_FACTS_QUERY`, `calendarFacts`) | 1 | M4 |
| 0 Shared engine `gulf-calendar-engine.js` (both pages unchanged) | 1 | D1 |
| 2a Fix: new or regenerated DataArcus calendar (DAX and steps) | 0.5 | 0, M1 |
| 2b Fix: `Hijri Months` + imported-calendar script, steps for others' DAX calendars | 1 | 0, M2 |
| 3 Measures as scripts | 0.5 | 0, M3 |
| 4 The "Ramadan and Eid" report page | 2.5 | 3, M5-M8 |
| 5 Country parameter (weekend) | 0.5 | - |
| 5b Other countries' announced dates (sourcing) | 1 reviewer session | D2 |
| **Total** | **about 8.5 builder sessions + 1 reviewer session** | |

## The beta cut (recommended)
**Before the beta: 1a + 5 (weekend only), about 2 builder sessions, no Desktop measurement needed.** The
`gulfCalendar` section of `check_model_health` (unscored), with the findings read from the files, for any calendar's
columns and for our DAX calendars' weekend, dates, estimates and range. Its fix text points to the website tools with
the exact settings to pick (the Calendar Generator: the country's weekend, announced dates on, the same range; the
Measure Builder: which Ramadan and Eid measures to tick), since without D1 the MCP has no DAX to give. Where in the
order: after the privacy and server fixes, before packaging; and one of the 10 golden tasks is "a Gulf model's
calendar checked" on the pack's test model.
**After the beta:** 0 (with D1), 2, 3, 1b, 4, 5b, in that order: the page last, because it needs the measures and
four Desktop measurements, and nothing before 15 November depends on it.
Why: it shows the Gulf edge in every beta user's health check for about two sessions, moves no score, writes nothing,
and leaves the work that needs measurements or touches the website's tools until after the beta goal.

## Decisions needed from the owner
- **D1** Extract the calendar and measure DAX into `assets/js/gulf-calendar-engine.js`, with both website tools
  calling it and their output unchanged (guarded by the pack's baseline)? It touches the website tools' code, which
  this brief kept out of scope. Without it the MCP can only point to the website. *Recommended: yes, after the beta.*
- **D2** Source the announced dates of Saudi Arabia, Qatar, Kuwait, Bahrain and Oman (2018-2026), or keep "announced"
  as UAE only and compare the others with Umm al-Qura? *Recommended: UAE only for the beta; Saudi Arabia next.*
- **D3** When does the `gulfCalendar` section appear: always, only with `country`, or with `country` or when the
  model has Hijri or Ramadan columns? *Recommended: the last.* And `country` never changes `weekStart` (confirm).
- **D4** The website's Model Health Check and Theme Generator: show the Gulf section and the Ramadan page too, later?
  *Recommended: decide after the beta.*
- **D5** Is a DAX query that reads the calendar's own dates (`GULF_FACTS_QUERY`, run only with the user's go) within
  "metadata only"? It reads no business data, but it does read values. *Recommended: yes, said in the privacy note.*

## Seen, not in scope
- `check_model_health`'s `weekStart` says Sunday is the default for "Saudi Arabia and most of the Gulf", while this
  brief makes the UAE the default country; the UAE's working week starts on Monday. Harmless if D3 keeps them apart,
  but the description could name both.
- The round 2 imported-calendar sort script is not yet tried in Desktop; item 2b's script depends on the same kind
  of `ref table` change (M2 covers both).
- `blog.html`'s list said 11 items while it held 12 (fixed in the pack's part 4).
- The pack's article and LinkedIn drafts wait on the 40-check Desktop run; this plan's beta cut does not depend on it,
  but its fixes point to the pack's options, which must be live first.
