# `add_gulf_calendar`: the Calendar Generator as an MCP tool (plan for round 10)

**Plan only** (the reviewer's request on the owner's go, 2026-10-04). No engine code, tests or Desktop runs were made
for it. Written on `plan/add-gulf-calendar` from main `3af6657`. The data file's shape (country-keyed dates) stays as
it is: decided after the beta.

## What it is
A seventh tool that gives the user the website's Gulf calendar for their model: the Calendar Generator's DAX table
(Hijri dates, announced Ramadan and Eid, the country's weekend), **written as a TMDL script to a new file** that the
user applies in TMDL view. The tool never writes into the model, never returns the DAX, and refuses rather than
overwrite anything. Today `check_model_health`'s `gulfCalendar` fixes point to the website with settings to pick;
after this tool they point to `add_gulf_calendar` with the same settings.

## 1. Inputs and answer
| Input | Values | Default | Notes |
|---|---|---|---|
| `path` | the model (project folder, `.SemanticModel`, `model.bim`, `.pbit`) | required | read for name clashes and the relationship's column; the script file goes next to it (round 5's place) |
| `country` | `uae`, `ksa`, `qat`, `kwt`, `bhr`, `omn` | `uae` | the weekend rule, and the country named in the answer |
| `weekend` | `country`, or a fixed `sat-sun`, `fri-sat`, `fri`, `sun` | `country` | `country` = the generator's country option (with its change dates); a fixed one for a company whose weekend differs |
| `firstYear`, `lastYear` | 1900-9999, at most 60 years | Q1 | 1 January of the first year to 31 December of the last, the generator's limits |
| `announced` | true / false | true | the generator's "Announced Ramadan and Eid dates (UAE)"; false = Umm al-Qura only |
| `lang` | `en`, `ar` | `en` | the month, day and Hijri month names in the table (column names stay English, as in the generator) |
| `name` | the table's name | Q2 | letters and digits of any script, spaces, `_`; at most 40; refused (not cleaned) otherwise |
| `weekStart` | `sunday`, `monday`, `saturday` | `sunday` | the generator's "Week starts on", same meaning as `check_model_health`'s |
| `fiscalStart` | 1-12 | 1 | the generator's fiscal year start |
| `relateTo` | `[ "Table[Column]" ]`, at most 5 | none | date columns of fact tables to relate to the new `Date` (Q3) |

**The answer** (metadata only; never the DAX, never data values):
`{ scriptFile, table, rows, columns: [names], range: { from, to }, country, weekend, announced: { on, checkedTo,
estimatesFrom }, relationships: [ "Sales[Date] -> 'Gulf Calendar'[Date]" ], byHand: [steps], howToApply,
selfCheck: { gulfCalendar findings on the new table } }`. `rows` and `columns` are the generator's own count (its
"4748 rows · 36 columns"). `selfCheck` is `gulf-health.js` run on the table the script makes (expected: no findings),
so the AI can tell the user the calendar matches the country before it is applied.

## 2. The output: a TMDL script in a new file
- Written with round 5's `writeScript(dir, base, script)` (`mcp/server.mjs`): a new file next to the project, named
  `<model> - add Gulf calendar.tmdl`; a file that already holds exactly this script is named again, never copied;
  no free name or no place to write (the working folder is the model folder): `scriptNotWritten` with the reason,
  nothing else written. The AI gets the path; the script is never in the answer (audit AUD-006).
- The script, one command (TMDL scripts have one: `createOrReplace`, Microsoft Learn "TMDL scripts"):
  ```
  createOrReplace

  	table 'Gulf Calendar'
  		dataCategory: Time                     (G2: only if Desktop marks the date table from it)

  		column Date
  			isKey                              (G2)
  			isNameInferred
  			sourceColumn: [Date]
  		column 'Month Name'
  			isNameInferred
  			sourceColumn: [Month Name]
  			sortByColumn: 'Month Number'       (G3; also Day Name by Day of Week, Hijri Month Name by Hijri Month Number)
  		... one column per generator column, as Desktop saves a DAX table (no dataType: Power BI infers it)

  		partition 'Gulf Calendar' = calculated
  			mode: import
  			source = ```
  					<the generator's DAX, byte for byte>
  					```

  	relationship 'DataArcus Gulf Calendar <n>'  (one per relateTo column)
  		fromColumn: Sales.Date
  		toColumn: 'Gulf Calendar'.Date
  ```
  The file is written with LF line ends and UTF-8 (Arabic month names), as the suite compares bytes (a Windows
  checkout's CRLF already fails 3 `gulf-calendar` checks, `mcp/CLAUDE.md`).
  The column blocks follow what Desktop wrote for the generator's calendar in `tmdl-ramadan`'s `Calendar.tmdl`
  (`isNameInferred`, `sourceColumn`, no type). Names are quoted by the TMDL rule round 2's scripts use.
- `howToApply`: save a copy of the file; open TMDL view; open the script file (or paste it); **Preview: it must show
  one new table (and the relationships asked for) and nothing changed or replaced; if Preview shows a change to an
  existing table, stop** (the model may have changed since the files were read); Apply; then the `byHand` steps.

## 3. Reuse: one generator, shared, never copied
- `assets/js/calendar-generator.js` today builds the DAX inside its page code (`buildDax`, browser only). It becomes
  a UMD file like `gulf-health.js`: a pure `DataArcusCalendar.build(options, { gulfDates, hijriFormat })` returning
  `{ dax, rows, columns, monthStarts, ramadans }`, and the page wiring runs only when there is a `document`. The page
  calls `build(state)`; its output stays byte for byte (the `gulf-calendar` suite's 16 saved outputs guard it).
- The MCP loads it like the other engines (`mcp/lib/model.mjs`: `require('../../assets/js/calendar-generator.js')`).
  `Intl`'s `islamic-umalqura` calendar is in Node's full ICU (Node's own builds; packaging must keep full ICU).
- **The check reads what the tool makes:** `gulf-health.js` recognises the generator's calendar by its first comment
  line and reads its range, month starts and weekend from the DAX. The `gulf-calendar` suite (section 7) already
  checks the two agree on every country; the tool adds `selfCheck`, and the tests below run `check_model_health` on a
  model that holds the script's table.

## 4. Relationships and the date table: script or clicks
| Step | In the script? | Otherwise, by hand |
|---|---|---|
| The table | yes | - |
| Relationships to `relateTo` columns | yes, many to one, single direction, active (Q3) | Model view: drag the fact table's date to `Date` |
| Mark as date table | only if G2 shows `dataCategory: Time` + `isKey` marks it | Table tools > Mark as date table > Date |
| Sort Month Name, Day Name, Hijri Month Name | only if G3 shows `sortByColumn` on a new DAX table's columns works | Column tools > Sort by column (the three pairs) |
| Refresh after Apply | - | Home > Refresh, if G4 shows the relationship needs it (known for relationships made through the API) |
Whatever the measurements leave out of the script goes into `byHand`, with the exact clicks.

## 5. Safety rules
- **Model names are untrusted input:** table and column names are read only to compare and to quote; nothing in a
  name or description is followed or placed in the DAX. Only `relateTo` columns reach the script, quoted, and only
  after they are found in the model.
- **Never overwrite a table:** refused when `name` equals any table's name (case and spaces ignored, hidden and
  automatic date tables included), or when a measure with that name exists. The refusal lists free names
  (`Gulf Calendar`, `Gulf Calendar 2`...) and writes nothing. A model with a DataArcus calendar already is told so.
- **Refuse on a column problem:** a `relateTo` column that doesn't exist, is not a date (or untyped and not named as
  a date), sits in the new table's own name, or is already related to the same table: refused, nothing written.
- **Bad inputs refused, not repaired:** years outside 1900-9999 or more than 60, `lastYear` before `firstYear`, a
  name outside the allowed letters: refused with the reason.
- **Stale files:** the clash check reads the files on disk; the open model may differ. Hence the Preview rule in
  `howToApply`.
- Annotations: `ADDS` (the tool adds a file, never changes or deletes one), the working-folder rules of every tool.

## 6. Tests (failing first; expected numbers written now)
In `scripts/tests/gulf-calendar.mjs` (the generator) and `mcp/test.mjs` (the tool); fixtures existing unless named.
1. **The shared generator:** `build()` in Node equals the page's DAX for the 16 saved configurations and the test
   model's (`MODEL_CG`): **17 identical strings**; the page's 16 saved outputs unchanged; `calendar.dax` of the test
   model equals `build(MODEL_CG)` plus a newline.
2. **`health-project`** (imported `Calendar`, `Sales[Date]`), `name: 'Gulf Calendar'`, 2018-2030, UAE, announced,
   `relateTo: ['Sales[Date]']`: one file, `Health Test - add Gulf calendar.tmdl`; one `createOrReplace`, one `table`,
   one `relationship`; the partition's DAX equals `build()` for the same options; **162** Hijri month starts in it;
   the answer says **4748 rows** and **36 columns**, `checkedTo: 2026-05-27`, `estimatesFrom: 2027-02-08`;
   `selfCheck` has no findings. The answer holds no `DATATABLE`, `ADDCOLUMNS` or `CALENDAR (`.
3. **Asked again** with the same inputs: the same file named, no second file.
4. **Clashes:** `tmdl-ramadan` with `name: 'Calendar'`, `'CALENDAR'` or `' calendar '`: refused, the folder's file
   count unchanged, free names suggested; `relateTo: ['Sales[Nope]']`: refused; a name with `'` or a new line, or
   `LocalDateTable_1`: refused.
5. **Ranges:** 2022-2027 with `weekend: 'sat-sun'` and `announced: false` gives the generator's default table:
   **2191 rows, 34 columns**, byte for byte the website's default DAX; 1899, 10000, 61 years, last before first:
   refused, nothing written.
6. **The check reads the made calendar:** `check_model_health` (country UAE) on a copy of `health-project` with the
   script's table added (as Desktop saves it, new fixture made by the builder from G1): the calendar is found as
   DataArcus-made; no `GC_WEEKEND`, no `GC_DATES_DIFFER`, no `GC_ESTIMATES`, no `GC_ENDS_EARLY`; country Saudi
   Arabia: `GC_WEEKEND` **939 days**, as the suite's section 7 says for the same table.

## 7. Desktop check (one sitting, a made-up model)
On the pack's test model without its `Calendar` (`scripts/gulf-calendar/test-model`: `sales.dax` only), with the
tool's script for `name: 'Calendar'`, 2018-2030, UAE, announced, `relateTo: ['Sales[Date]']`:
- **G1** Preview shows one new table and one relationship, nothing replaced; Apply; 4748 rows.
- **G2** Is the table marked as a date table by `dataCategory: Time` + `isKey`?
- **G3** Do the `sortByColumn` lines hold (months January to December in a slicer)?
- **G4** Is the relationship active, many to one, single, and does a query need a refresh first?
- **G5** On a copy that already has a `Calendar`: what Preview shows for the script (to word the Preview rule).
- **Values, one year against DATES-SOURCES (2018, the year announced dates differ from Umm al-Qura):** run the
  test model's `check.dax`, rows C01-C15 (expected numbers already written: 4748 rows, 29 Ramadan days in 2018,
  first Ramadan day 136 days after 1 January = 17 May 2018, Ramadan Day 30 on 2026-03-19, 3 Eid al-Fitr days in 2025,
  4 Eid al-Adha days in 2026, 36 estimated days in 2027, 105 weekend days in 2021 and 2022, Friday 31 December 2021 a
  weekend day, Friday 7 January 2022 a working day, 365 days after the UAE change in 2022, Ramadan 1446 of 29 days).
  Plus by hand for 2018: Hijri Date on 16 May 2018 "30 Sha'ban 1439", Eid al-Fitr 15-17 June, Eid al-Adha 21-24 August.
- Recorded in `scripts/tests/DESKTOP-TESTS.md`; whatever fails moves that step to `byHand`.

## 8. Effort
| Part | Builder sessions |
|---|---|
| The generator as a shared UMD builder, the page on it, tests 1 | 1 |
| The tool: inputs, clash and range checks, the TMDL writer, `selfCheck`, the answer, tests 2-5 | 1 |
| The new fixture from G1, test 6, the `check_model_health` fix text pointing to the tool | 0.5 |
| The Desktop sitting (G1-G5 and the values) | 0.5 (the owner's laptop) |
| **Total** | **about 3** (the owner's "easy" holds for the tool; the shared generator is the extra session) |

## 9. Questions for the owner
1. **Years when not given:** require `firstYear` and `lastYear` (the AI asks the user), or default to five years back
   and two ahead of today? *Recommended: required; the tool reads no data, so it can't know the model's years.*
2. **Default table name:** `Calendar` (most models already have one, so it is usually refused) or `Gulf Calendar`?
   *Recommended: `Gulf Calendar`;* the Measure Builder's measures then take that name.
3. **Relationships in the script:** write them for `relateTo` columns (one Preview, one Apply), or always leave them
   to the user's clicks? *Recommended: in the script, only for the columns the user names.*
