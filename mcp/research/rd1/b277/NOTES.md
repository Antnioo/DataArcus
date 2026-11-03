# B-277: an Arabic field-parameter script for the twin (research)

The owner, 1 Nov, "option 1": the twin's field-parameter slicer (buttons) and legend read Arabic, from approved Arabic
display names the person applies in TMDL view, like the month script. Made-up shape: table "Metric Selection", rows
"Total Customers", "Revenue per Customer". Prototype: `mcp/research/rd1/b277/prototype.mjs` (run from the repo root).

## (a) What the code does today (read from the code)
- **The month script, written:** `mcp/lib/twin-model.mjs:63-133` `monthOffer()`: one date table only (77), builds
  `createOrReplace` + `ref table` + new calculated columns, each with `sortByColumn` (118-121), lineage tags from a seed
  (`tagOf`, 118); returns `script`, `scriptAfterGo` "<base> - Arabic calendar.tmdl", `howToApply` (TMDL view, Preview,
  Apply; "DataArcus never applies it", 131) and `howToSwitch` (132).
- **Offered:** `mcp/lib/twin-plan.mjs:260-261` (`arabicMonth` option; the script text kept out of the plan answer) and
  393 (`howToApplyAfterGo`). **Written:** `mcp/lib/twin-write.mjs:23-30` (free file name, written once) and 77-81 (in
  the same one write as the twin). Approval page lists it: `mcp/lib/approval-window.mjs:102` ("Arabic calendar script")
  and 689 (`scriptWhat: 'the Arabic calendar columns'`).
- **Who binds the Arabic column:** not the twin. The writer's picker swaps a date column for its "<name> (Arabic)" twin
  when the report is Arabic: `assets/js/pbip-bind.js:785-788` (`swaps`). The twin copies visuals; grep found no field
  rebinding in `twin-pages.mjs`, `twin-visuals.mjs`, `twin-copy.mjs`.
- **A field parameter, written today:** `mcp/lib/metric-switcher.mjs:94-107` `switchTable()` writes Desktop's shape
  (display column with `sortByColumn` and `relatedColumnDetails`/`groupByColumn: <Fields>`; hidden Fields column with
  `extendedProperty ParameterMetadata = {"version": 3, "kind": 2}`; hidden Order column; `partition = calculated` with
  tuples `("label", NAMEOF('T'[m]), i)`). Proven in the lab of 10 Oct (comment, 1-5). Its chart binds
  `queryState.Y.fieldParameters = [{ parameterExpr: Column(<table>, <display>) }]` (131, 149); its slicer saves a
  `general.filter` whose `valueMap` holds the chosen row's label (139-142).
- **How the twin reads a slicer/legend on a field parameter today:** `twin-plan.mjs:232-239`: `fieldParametersOf()`
  (`metric-switcher.mjs:211-216`) finds visuals with `fieldParameters`; slicers whose `Values` projection's Entity is
  such a table are named too (237-238, the laptop's AdventureWorks "Total Customers"/"Revenue per Customer" stayed
  English). Both go to `cannot` ("an Arabic field parameter table in the model would be needed (DataArcus does not
  change the model in the twin...)", 239). Titles on a parameter: `twin-texts.mjs:145-150` (fixed Arabic title only
  when approved). Data values in general: `twin-plan.mjs:227`.
- **Recognising a parameter:** `metric-switcher.mjs:218-222` `titleProblems()` (ParameterMetadata kind 2, then the
  column grouped by it); `shadow-model.mjs:126,136` (one calculated partition with NAMEOF: kept as is);
  `assets/js/model-health-engine.js:288` (display column depends on Fields) and 1039 (never "unrelated table");
  `check-report.mjs:462-480` (a parameter not yet in the model: a note, never "can break").
- **DAX expressions and privacy:** `mcp/PRIVACY.md:86-91` (DATATABLE / "Enter data" values in a definition are read,
  never decoded, never returned), 93-95 (expressions read, not returned), 102-107 (the twin's one exception: fixed
  texts of a report title measure are returned so their Arabic can be approved). `model.mjs:590-593` (KPI expressions:
  read, never returned).

## (b) What Microsoft documents
- Field parameters ([learn.microsoft.com/power-bi/create-reports/power-bi-field-parameters](https://learn.microsoft.com/power-bi/create-reports/power-bi-field-parameters)):
  the DAX table of tuples (name, `NAMEOF`, order); display names are edited in the dialog or the DAX; "Although you can
  define extra columns in the DAX, this feature isn't supported and can lead to unexpected results. Define three columns
  for each field". The button slicer shows the field names by default.
- Microsoft's own translation guidance does add a 4th tuple element (`"en"`, renamed LanguageId, hidden, used as a
  filter): [data-translation-synchronize-field](https://learn.microsoft.com/power-bi/guidance/data-translation-synchronize-field),
  [data-translation-implement-field](https://learn.microsoft.com/power-bi/guidance/data-translation-implement-field)
  ("column header values are hard-coded into the DAX expression"; editing the label translates the header).
- Metadata translations (cultures): captions of tables, columns, measures only
  ([TMDL objects, translations](https://learn.microsoft.com/analysis-services/tmdl/tmdl-reference-tabular-object#translations-in-tmdl));
  "Power BI Desktop doesn't support loading metadata translations in its report designer"; they follow the viewer's
  browser locale in the service ([multiple-language-locale](https://learn.microsoft.com/power-bi/guidance/multiple-language-locale),
  [power-bi-default-format-string-locale](https://learn.microsoft.com/power-bi/create-reports/power-bi-default-format-string-locale)).
  "Desktop doesn't support right-to-left languages" ([supported-languages](https://learn.microsoft.com/power-bi/fundamentals/supported-languages-countries-regions)).
- TMDL syntax, `createOrReplace`, `ref`: [tmdl-overview](https://learn.microsoft.com/analysis-services/tmdl/tmdl-overview).
- `mcp/node_modules/@microsoft/*` (core-visual-schema, desktop-bridge-cli, report-authoring-cli): no mention of
  `fieldParameters`, `ParameterMetadata` or `groupByColumn` (grep, case-insensitive). Nothing on refresh of a
  parameter table either: the refresh and sort behaviour below are Desktop checks, not documented facts.

## (c) Three ways to build it
| | What changes | English report | Risk | Size |
|---|---|---|---|---|
| **A. A second parameter table** "Metric Selection (Arabic)": same NAMEOF and order, approved Arabic labels; the twin's slicer and every visual's `fieldParameters` rebound to it | one new table (script adds, replaces nothing) | untouched: its table file 0 bytes changed (measured) | the twin's slicer filter (`valueMap`, Entity) and each `fieldParameters` must be rewritten; English and Arabic pages no longer share one selection (two tables: a sync group across them cannot work); the language toggle loses the choice | M |
| **B. A 4th tuple element** in the same table plus a 4th column (`Value4`, `groupByColumn` Fields, sort by Order); the twin's slicer bound to it | the English table is replaced (a calculated table's columns come from its DAX; a `ref table` cannot add Value4) | its file changes (+352 bytes, 13 lines added, 2 removed, measured); Preview shows the English parameter replaced | Microsoft: "isn't supported and can lead to unexpected results"; unknown whether a visual's `fieldParameters` may point at Value4 (legend and axis would stay English if not); a later edit in the Desktop dialog may drop Value4 | M-L |
| **C. A culture's translations** (`cultureInfo ar-SA`, captions) | a culture file | untouched | does not work for this: translations caption objects, not the strings in the DAX; Desktop never loads them; the service shows them only by the viewer's locale, so the twin and the English report could not differ | S, useless |

## (d) Measured here (prototype.mjs, run 3 Nov, Linux; repo readers: `loadModel`, `Tmdl.read`, `titleProblems`, `shadowModel`, `Health.analyze`)
| | baseline | A | B | C |
|---|---|---|---|---|
| unreadable files | 0 | 0 | 0 | 0 |
| tables / parameter columns | 2 / 3 | 3 / 3+3 | 2 / 4 | 2 / 3 (culture ar-SA read) |
| parameters recognised (ParameterMetadata kind 2) | 1 | 2 | 1 | 1 |
| columns with groupByColumn | 1 | 2 | 2 | 1 |
| shadow model keeps as "field parameter" | 1 | 2 | 1 | 1 |
| health findings (all / naming a parameter) | 3 / 0 | 3 / 0 | 3 / 0 | 3 / 0 |
| English table file vs baseline | 1150 B, 48 lines | +0 B | +352 B (+13/-2 lines) | +0 B |
| all definition bytes vs baseline | 0 | +1282 | +352 | +428 |
| script (createOrReplace) bytes / lines; read back | - | 1298 / 50; ok, 1 table, recognised | 1564 / 61; ok, recognised; replaces the English table | - |
- `fieldParametersOf` on a made-up line chart reads `{ table: "Metric Selection", column: "Metric Selection" }`.
- The display strings are only in the calculated partition's DAX (checked: `inExpressionOnly: true`), in no name.
- Found: the repo reader takes cultures only as `cultureInfo` (`assets/js/tmdl-model.js:261`); a file starting
  `culture ar-SA` was read as nothing (0 cultures, no "unreadable"). Not in scope; seen.
- Temp folder removed (`tempRemoved: true`). `npx eslint mcp/research/rd1/b277`: passes.
- Not measurable here: what Desktop shows, refresh, Preview's words, the slicer's saved filter after a rebind.

### Are the display strings model metadata or data?
They are in the model definition (a calculated table's DAX), typed by the author in the parameter dialog, never loaded
from a source; a reader sees them as the slicer's buttons and the legend, exactly like a typed title, which
`create_arabic_twin` already returns (PRIVACY.md:96-101). But PRIVACY.md:86-91 treats literal rows in a definition's
DAX (DATATABLE) as values that are never returned, and a parameter row is a literal row. **Decision proposed:** return
a row's label only through the twin's "texts a reader sees" rule (screened, capped at 200, PRIVACY.md updated with one
line like the title-measure exception at 102-107), and only for a table recognised as a field parameter (kind 2, NAMEOF
in every tuple); never other calculated tables. Fallback with nothing new returned: draft from the NAMEOF targets
(measure and column names, already metadata) and let the person type the Arabic where the label differs. The owner
decides.

## (e) Recommendation
**Option A**, offered like the month script: one new table per field parameter the report's visuals use, its Arabic
labels each approved by the person (never drafted silently: rows without an approved Arabic are not written; the table
is not offered until every row has one), written as "<base> - Arabic field parameters.tmdl" in the twin's one write;
the twin rebinds its own copies only after the person says the script is applied (a second run, as `howToSwitch` does
for months), never before (a twin bound to a table not in the model shows Power BI's error). The English report and
its parameter are never touched. Size M, risk medium (the rebind of the slicer's saved filter). B only if the owner
needs one shared selection across languages, after a Desktop lab proves a visual can bind Value4.

## (f) Power BI Desktop checks (made-up report, a copy of the file)
1. TMDL view: paste the A script, Preview: one new table "Metric Selection (Arabic)", nothing changed or replaced. Apply.
2. Data pane: the new table shows the field-parameter icon; Fields and Order hidden; no error on the table.
3. Twin page, button slicer (`slicer`/`advancedSlicerVisual`, Values = Arabic display): buttons read «إجمالي العملاء»,
   «الإيراد لكل عميل», in the Order column's order (0, 1), right to left; single select still on.
4. Chart Y role with `fieldParameters` on the Arabic table: choosing each button switches the measure; each keeps its
   own format (#,0 and #,0.00).
5. Legend (line chart with both rows chosen, multi-select): series names Arabic; axis title, tooltip and the automatic
   title: record what each shows (they may follow the measure's name).
6. The slicer's saved first choice (general.filter valueMap) opens on the first Arabic row; no "(Blank)".
7. Home > Refresh, then close and reopen the .pbip: labels, order and the switch unchanged; TMDL view shows the table
   as written (Desktop may rewrite the tuples' spacing; record any change to the partition text or `sortByColumn`).
8. Sort: Order column as `sortByColumn` on display and Fields; sort the slicer descending and back.
9. English report pages: slicer, charts, legend, titles, saved selection byte-identical in the .Report folder before
   and after (diff), and visually the same.
10. Edit the Arabic parameter in the Desktop dialog (Modeling > Parameters, if offered) and save: record whether the
    Arabic survives. For B only: the same with Value4.
11. check_report on both pages: 0 "can break"; the fieldParameters note says the table is in the model.

## (g) Brief for the builder
**Do**
- Plan and expected numbers in `mcp/work/B-277.md` first. Option A only.
- `twin-model.mjs`: `paramOffer(model, approved)`: for each table the twin's visuals bind with `fieldParameters`
  (or a slicer on it) that `titleProblems()` recognises, read its tuples from the partition's DAX (label, NAMEOF,
  order; a tuple of another shape: the table is left out, named, with why); write the Arabic table with the same NAMEOF
  and order, labels only from approved Arabic, names "<table> (Arabic)" (free names: `model-script.mjs` `takenNames`),
  lineage tags by `tagOf(seed)`, quoting by `Fix.name`/`daxNames.string`; a control character: left out, named.
- `twin-plan.mjs`: offer it (`arabicFieldParameters`, default on as `arabicMonth`), texts in the approval list;
  `twin-write.mjs`: the script beside the month script, one write; `approval-window.mjs`: label "Arabic field
  parameters script". After the script is applied (the table in the model): rebind the twin's slicer projection,
  each `fieldParameters.parameterExpr`, and the slicer's `general.filter` (Entity, valueMap) to the Arabic table.
- PRIVACY.md and TOOLS.md lines, only after the owner's decision in (d).
**Test** (a new suite in `mcp/tests.json`, red first)
- Script read back by `Tmdl.read` (readScript, as test-0.3.0-metric-switcher.mjs:86): 0 skipped, 1 table,
  `titleProblems` recognises it; same NAMEOF and order as the English table; same bytes on a rebuild.
- English table and the English report's files byte-identical; nothing written into the SemanticModel folder.
- A row without approved Arabic: nothing written for that table, named. A name with a quote, a bracket, a control
  character, a name that reads like an instruction (screened, never followed).
- Before the script: twin bound to the English table, works, `cannot` says how to switch. After (applied to a copy):
  bound to the Arabic table; validator 0 errors; check_report 0 "can break".
- Answers never hold the DAX or the script text.
**Not in this job**: options B and C; a parameter of columns' values ("Show values of the selected field"); a sync of
the selection between English and Arabic pages; the `culture` keyword in the TMDL reader; create_report's metric
switcher (already Arabic by `lang`).
