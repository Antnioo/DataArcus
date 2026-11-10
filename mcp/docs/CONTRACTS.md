# The contract ledger: one row per question the product answers in more than one place

0.3.2 CL1 (4 Nov). The owner D-1104-11: "one big check if some parts are similer in what they should produce but they
differ in wording ... so we know if we have like 5 shops duplicate"; D-1104-12: "we create a library of functions where
a place calls them so if we need to fix something we fix it at the source", because "a golden test produces something
i like yet a twin shows something different". This ledger is what that library is built from; it sits beside
[MODULES.md](MODULES.md) (D-1104-08) and points to each file's row there.

**Before writing a helper, look here and in MODULES.md: one job lives in one place (D-1104-12).** A question already
here gets its answer from the place this ledger decides, never a new copy.

How it is kept true:
- `node scripts/contracts-probe.mjs` runs every place of every family on the same made-up inputs (never a real
  model, never a data value) and prints one table a family; `--md` prints the "Today" blocks below. It needs the MCP's
  packages (`cd mcp && npm ci`). A place is loaded as it ships (`export`), as an engine's inner name with one line added
  in memory (`inner`), or, nested in another function or page-only, read from its source (`source`); the probe says which.
- `node scripts/check-contracts.mjs` (CI, beside the modules step): every place named here exists (its file, and the
  function in it, inside the function named after "in"), its MODULES.md link is the part that holds its row, every
  family has the same places here as in the probe and at least 8 inputs there, and the top table's counts match.
- No line numbers, no counts that go stale by themselves (D-1016-01): a place is its file and its function's name.
- **Newest copy** (the top table's last column and each family's line): from the reviewer's Codex history audit
  (stale-twins, on 3a9ad5e8, 4 Nov), checked against the code and the probe here; where the probe disagrees with the
  audit, the family says so. "merge": no copy holds every fix; "equal": no answer differs today.
- **Nothing moved in CL1**: today's answers are what the code answers now. "Decided answer" is a proposal until the
  reviewer and the owner decide; the shared module comes after.

## The families

| family | places | disagree on N of M inputs | who sees it | newest copy |
|---|---|---|---|---|
| [1a Is this column time?](#1a-is-this-column-time) | 4 | 0 of 24 | the twin, the preview, the writer, check_report | one place since DD1A: `assets/js/time-names.js` `isTimeName` |
| [1b-text What text does a literal hold?](#1b-text-what-text-does-a-literal-hold) | 11 | 0 of 15 | check_report, the writer, the twin, the preview, the redesign | one place since DD1B: `assets/js/pbir-values.js` `litText` |
| [1b-shown What does a literal show?](#1b-shown-what-does-a-literal-show) | 2 | 0 of 15 | check_report, read_report | one place since DD1B: `assets/js/pbir-values.js` `litShown` |
| [1b-number What number does a literal hold?](#1b-number-what-number-does-a-literal-hold) | 5 | 0 of 15 | check_report, read_report, the twin, the preview | one place since DD1B: `assets/js/pbir-values.js` `litNumber` |
| [1b-bool What true or false does a literal hold?](#1b-bool-what-true-or-false-does-a-literal-hold) | 3 | 0 of 15 | check_report, read_report, the twin, the preview, the native copy | one place since DD1B: `assets/js/pbir-values.js` `litBool` |
| [1c How wide is the frame a visual is mirrored inside?](#1c-how-wide-is-the-frame-a-visual-is-mirrored-inside) | 4 | 0 of 10 | the twin | one place since DD1C2: `assets/js/mirror-units.js` `frameWidth` |
| [1d What width did the report set for this table column?](#1d-what-width-did-the-report-set-for-this-table-column) | 5 | 0 of 12 | check_report, the twin, create_report | one place since DD1B: `assets/js/pbir-values.js` `columnWidth` |
| [1f Is this text Arabic?](#1f-is-this-text-arabic) | 7 | 4 of 11 | every measured text, check_report, create_report, the twin | `text-measure.js` / `field-catalog.js` (the broad test) |
| [1g Which model folder is read?](#1g-which-model-folder-is-read) | 3 | 0 of 8 | the website's model import, every MCP tool that reads a model | equal (one place: `model-nearest.js`) |
| [1h Which column sorts this one?](#1h-which-column-sorts-this-one) | 3 | 0 of 11 | the website's field picker, check_model_health's fix script | equal (one place: `sort-column.js`) |
| [grid Does this visual keep its grid left to right?](#grid-does-this-visual-keep-its-grid-left-to-right) | 2 | 0 of 18 | the twin | one place since DD2V: `assets/js/mirror-policy.js` `keepsGridLtr` |
| [vt-slicer Is this visual a slicer?](#vt-slicer-is-this-visual-a-slicer) | 5 | 0 of 18 | read_report, check_report, the twin, the preview | one place since DD2Z: `assets/js/visual-types.js` `SLICER_TYPES`, `isSlicer` |
| [vt-bar Is this visual a bar chart?](#vt-bar-is-this-visual-a-bar-chart) | 5 | 0 of 18 | the twin, the preview, check_report | one place since DD2V: `assets/js/visual-types.js` `BAR_TYPES`, `isBar` |
| [canon What is the canonical text of a plan?](#canon-what-is-the-canonical-text-of-a-plan) | 1 | 0 of 10 | every write (the approval's digest) | one place since DD2C: `mcp/lib/canon.mjs` `canon` |
| [crc What is the CRC-32 of these bytes?](#crc-what-is-the-crc-32-of-these-bytes) | 2 | 0 of 8 | every PNG and ZIP written | one place since DD2P: `assets/js/png-bytes.js` `crc32` |
| [png-chunk What bytes make a PNG chunk?](#png-chunk-what-bytes-make-a-png-chunk) | 1 | 0 of 8 | every PNG written | one place since DD2P: `assets/js/png-bytes.js` `pngChunk` |
| [u32 What number do four bytes hold?](#u32-what-number-do-four-bytes-hold) | 1 | 0 of 8 | the twin's and the glass's PNG reads | one place since DD2P: `assets/js/png-bytes.js` `u32` |
| [lru What does a small cache keep?](#lru-what-does-a-small-cache-keep) | 1 | 0 of 8 | the twin's pictures, the glass | one place since DD2P: `mcp/lib/small-cache.mjs` `lru` |
| [overlap Do these two boxes overlap?](#overlap-do-these-two-boxes-overlap) | 1 | 0 of 9 | the twin, the redesign | one place since DD2O: `mcp/lib/box-overlap.mjs` `overlaps` |
| [overlap-area How much do two boxes overlap?](#overlap-area-how-much-do-two-boxes-overlap) | 1 | 0 of 9 | the twin | one place since DD2O: `mcp/lib/box-overlap.mjs` `overlapArea` |
| [contrast What is the contrast of two colours?](#contrast-what-is-the-contrast-of-two-colours) | 4 | 0 of 9 | generate_theme, the writer, the SVG KPIs | one place since DD2K: `assets/js/contrast.js` `contrast` |
| [xml How is a text escaped for XML (SVG)?](#xml-how-is-a-text-escaped-for-xml-svg) | 2 | 0 of 10 | the SVG KPIs, the flip cards | equal |
| [html How is a text escaped for HTML?](#html-how-is-a-text-escaped-for-html) | 9 | 0 of 10 | the website's pages, the approval window | one place since DD2H: `assets/js/html-escape.js` `htmlEsc` |
| [tmdl-name How is a name written in TMDL?](#tmdl-name-how-is-a-name-written-in-tmdl) | 7 | 0 of 9 | check_model_health's fix scripts, the measure builder page, the twin's model, create_report's sample | equal (one place: `tmdl-name.js`) |
| [decode What text do the bytes of a Power BI file hold?](#decode-what-text-do-the-bytes-of-a-power-bi-file-hold) | 4 | 0 of 10 | every model read (the MCP and the website) | one place since DD2D: `assets/js/model-file.js` `decodeText` |
| [limits How large may a model file be?](#limits-how-large-may-a-model-file-be) | 4 | 0 of 8 | every model read (the MCP and the website) | one place since DD2D: `assets/js/model-file.js` `LIMITS` |
| [text-runs What text does a text box hold?](#text-runs-what-text-does-a-text-box-hold) | 1 | 0 of 9 | check_report, read_report, the preview | one place since DD2T: `assets/js/text-runs.js` `paragraphTexts` |
| [blank What is BLANK minus or divided by a number?](#blank-what-is-blank-minus-or-divided-by-a-number) | 2 | 0 of 14 | the SVG KPI designer page, create_report's SVG KPIs | one place since DD2Z: `assets/js/svg-expressions.js` `evalNode`, `evalValueKind` |

| [expr-text What text does an expression given as lines hold?](#expr-text-what-text-does-an-expression-given-as-lines-hold) | 1 | 0 of 12 | the Model Health Check (its index, fix scripts, remembered answers), check_model_health, add_gulf_calendar, the twin's model | one place since SG1: `assets/js/dax-reference-parser.js` `exprText` |
| [lit-value What value is a literal written as?](#lit-value-what-value-is-a-literal-written-as) | 1 | 0 of 14 | check_report, the twin, the writer's visual replacement, the Arabic lens | one place since SG1: `assets/js/pbir-values.js` `litValue` |
| [obj-entries Which entries does an objects list hold?](#obj-entries-which-entries-does-an-objects-list-hold) | 1 | 0 of 9 | read_report, check_report, the layout check | one place since SG1: `assets/js/pbir-values.js` `entries` |
| [hex-rgb What red, green and blue does a hex colour hold?](#hex-rgb-what-red-green-and-blue-does-a-hex-colour-hold) | 1 | 0 of 10 | generate_theme and the theme generator (colour mixes), the PBIP writer's colour mix | one place since SG1: `assets/js/design-colours.js` `hexToRgb` |
| [page-el What element does a page make for a class and a text?](#page-el-what-element-does-a-page-make-for-a-class-and-a-text) | 1 | 0 of 9 | the build page (its cards, the Fuel panel), the theme generator's names box | one place since SG1: `assets/js/page-toast.js` `el` |
| [page-save What does a page keep of its state?](#page-save-what-does-a-page-keep-of-its-state) | 1 | 0 of 8 | the calendar, measure builder and licensing calculator pages (the visitor's browser only) | one place since SG1: `assets/js/page-toast.js` `saveState` |
| [measure-key Which table and measure does 'T'[M] name?](#measure-key-which-table-and-measure-does-tm-name) | 1 | 0 of 11 | create_report (the metric switcher, the status icons) | one place since SG1: `mcp/lib/model-script.mjs` `keyOf` |
| [put-json What does a plan's file hold after a JSON is put in it?](#put-json-what-does-a-plans-file-hold-after-a-json-is-put-in-it) | 1 | 0 of 8 | create_report (the DAX functions, the status icons) | one place since SG1: `mcp/lib/model-script.mjs` `putJson` |
| [leaves Which leaf pointers does a value hold?](#leaves-which-leaf-pointers-does-a-value-hold) | 1 | 0 of 11 | create_report's redesign (the copy's check, each patch's reason) | one place since SG1: `mcp/lib/redesign-kinds.mjs` `leaves` |
| [path-out How is a path inside the working folder said, dots kept?](#path-out-how-is-a-path-inside-the-working-folder-said-dots-kept) | 1 | 0 of 8 | the twin, the native copy | one place since SG1: `mcp/lib/twin-read.mjs` `pathOut` |
| [rel-out How is a path inside the working folder said, every part cleaned?](#rel-out-how-is-a-path-inside-the-working-folder-said-every-part-cleaned) | 1 | 0 of 8 | check_report (its redaction, the Arabic lens) | one place since SG1: `mcp/lib/check-redact.mjs` `relOut` |
"places" counts a function once for each family it answers (`mirror-policy.js` `kindOf` answers two). Who sees it:
the MCP tool whose answer or written file carries the place's answer, or the website page. Golden tests that pin a
place are not mapped yet (see the note's "Lessons").

## 1a Is this column time?

**One place:** assets/js/time-names.js isTimeName (test mcp/test-0.3.2-dd1a.mjs).

**Question:** a column named like this: is it a date part (a day, month, quarter, year, a date)?

**Newest copy:** merge (the audit: diverged both ways, no winner). Verified: pbip-query.js `wordsOf` splits camel case, layout-check.js `wordsOf` takes «ال» off, page-preview.js `TIME_NAME` has qtr, yr, fy, عام, فترة.

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/mirror-policy.js` `isTime` | [engines](MODULES.md#the-website-engines) | the twin (create_arabic_twin: which chart's time axis is turned) |
| `assets/js/page-preview.js` `timeDirOf` | [engines](MODULES.md#the-website-engines) | the preview (approve_plan's window, plan lint, the twin's preview, the theme generator page): the time arrow |
| `assets/js/pbip-query.js` `isTime` | [engines](MODULES.md#the-website-engines) | the writer (create_report and the website's download): a time category keeps its order, a text one is sorted by its measure |
| `assets/js/layout-check.js` `TIMEY` | [engines](MODULES.md#the-website-engines) | check_report and plan lint (AXIS_TIME rules), the theme generator page |

**Today** (the probe; the disagreeing inputs only. A: mirror-policy isTime, B: page-preview timeDirOf, C: pbip-query
isTime, D: layout-check TIMEY):

| input | A | B | C | D |
|---|---|---|---|---|
| OrderDate | false | false | true | true |
| FiscalYear | false | false | true | true |
| MonthName | false | false | true | true |
| Month_Name | false | false | true | true |
| Qtr | false | true | false | true |
| FY | false | true | false | false |
| Yr | false | true | false | false |
| التاريخ | true | true | false | true |
| تاريخ | false | true | false | true |
| شهر | false | true | false | true |
| هجري | false | false | true | false |
| Weekday | true | false | true | false |

**Decided answer:** proposed: one test for all four: the name split into its words (camel case, `_`, `-`, digits, as
pbip-query and layout-check do), the Arabic article taken off (as layout-check), one word list: date, day, weekday,
week, month, quarter, qtr, year, yr, fy, period, hijri and تاريخ، يوم، أسبوع، شهر، ربع، سنة، عام، فترة، هجري (each
plural too); the picker's mark (pbip-query's `time` and `kind`) and a date table (mirror-policy) still come first
where a place has them. Every input above then answers true. The reviewer and the owner decide (B-282 is the same
question for mirror-policy).

**The test that will pin it:** the probe's 24 names (family `1a`).

**Since DD1A (4 Nov; the owner D-1104-15):** the decided answer above, in one place: `assets/js/time-names.js`
(`wordsOf`, `isTimeName`, `TIME_WORDS`; plurals of every word, «أ إ آ» read as «ا», short vowels dropped). The four places
call `isTimeName` for the name; what each knows first stays in its own code (a date table or a hierarchy level in
mirror-policy.js, the picker's `time` or `kind` mark in pbip-query.js). Their own lists (mirror-policy `TIME_NAME`,
page-preview `TIME_NAME`, pbip-query `TIME_WORDS` and `wordsOf`, layout-check `TIME_WORDS` and its `wordsOf`) are gone;
dd1a's P runs the four on the 24 names and 26 more: one answer each. The probe: one answer on all 24 inputs. The
"Today" table above is the ledger's snapshot before DD1A.

**Since TN2 (5 Nov; the owner D-1105-04):** «عام» / «العام» is a time word only as the first word of a name («العام», «عام 2024»), never after another word («المدير العام», «القطاع العام»); every other word as before.

## 1b-text What text does a literal hold?

**One place:** assets/js/pbir-values.js litText (test mcp/test-0.3.2-dd1b.mjs).

**Question:** a property's Literal (`{ expr: { Literal: { Value } } }`): the text it holds (`'Sales'` -> Sales, `''`
undone to `'`), or nothing.

**Newest copy:** merge (tagged decoder). Verified: twin-geometry.mjs `litOf` lacks the `''` undo the older readers have (1b-text, group E).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/mirror-policy.js` `strOf` | [engines](MODULES.md#the-website-engines) | the twin (report-mirror.js reads with it); reads litText (`PV.litText`, since DD1A) |
| `assets/js/page-preview.js` `lit` | [engines](MODULES.md#the-website-engines) | the preview (a link's type, a flip card's title) |
| `assets/js/page-preview.js` `strOf` | [engines](MODULES.md#the-website-engines) | the preview (titles, fonts, colours) |
| `assets/js/report-a11y.js` `strOf` | [engines](MODULES.md#the-website-engines) | check_report (alt text, accessibility), the writer |
| `assets/js/report-rules.js` `str` | [engines](MODULES.md#the-website-engines) | check_report's measured rules, the twin's text fit |
| `mcp/lib/arabic-lens.mjs` `strOf` | [checkers](MODULES.md#the-mcp-the-checkers) | check_report (its Arabic lens) |
| `mcp/lib/check-language.mjs` `litOfS` | [checkers](MODULES.md#the-mcp-the-checkers) | check_report (the language check) |
| `mcp/lib/dax-functions.mjs` `textOf` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | create_report (the DAX functions option), check_report |
| `mcp/lib/flip-cards.mjs` `textOf` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | create_report (flip cards) |
| `mcp/lib/twin-pictures.mjs` `lit` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (pages drawn on a picture) |
| `mcp/lib/redesign.mjs` `L` (in `danglingOf`) | [redesign](MODULES.md#the-mcp-the-redesign) | create_report's redesign (a link left pointing nowhere) |

**Today** (A: mirror-policy strOf, page-preview lit and strOf, terminology litText; B: layout-check litStr,
report-inventory litStr; C: pbip-query S0, report-a11y strOf, report-rules str, dax-functions textOf, flip-cards
textOf; D: arabic-lens strOf, check-language litOfS, twin-pages lit, twin-visuals litStr; E: twin-geometry litOf,
redesign L; F: twin-pictures lit):

| input | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| missing (no property) | null | null | "" | null | null | null |
| an expr with no Literal | null | null | "" | null | null | null |
| 'it''s' (a quote inside) | "it's" | "it's" | "it's" | "it's" | "it''s" | "it's" |
| 'a (broken: no closing quote) | null | "'a" | "a" | "a" | "a" | "a" |
| 12D | null | "12" | "12D" | "12D" | "12D" | "12D" |
| 12L | null | "12" | "12L" | "12L" | "12L" | "12L" |
| -3.5D | null | "-3.5" | "-3.5D" | "-3.5D" | "-3.5D" | "-3.5D" |
| true | null | "true" | "true" | "true" | "true" | "true" |
| false | null | "false" | "false" | "false" | "false" | "false" |
| null | null | "null" | "null" | "null" | "null" | "null" |
| 12 (a number, not text) | null | "12" | "12" | "12" | "12" | null |

Six answers to one question. Group B reads every literal as text (its callers ask "the value as shown"); group C
gives `""` for nothing, so "no title" and "an empty title" are one; group E leaves `''` doubled.

**Decided answer:** proposed: group A's: the text of a quoted literal (`'...'`, `''` undone), `null` for anything
else (missing, a number, true, a broken quote). "The value as shown" (group B: 12D -> "12") is a second, named
reader over the same parse, and `""` where a caller wants it is the caller's `|| ''`. The reviewer and the owner decide.

**The test that will pin it:** the probe's 15 literals (family `1b-text`; the same 15 pin 1b-number and 1b-bool).

**Since DD1B (4 Nov):** every place above reads `assets/js/pbir-values.js` `litText` (an alias of it, or a call with
`?? ''` where the caller wanted an empty text for nothing); `mirror-policy.js` `strOf` too since DD1A (`PV.litText`:
sp10's P10 admits the pure shared files, the reviewer's call). Gone, their calls read litText (or the question they asked: a font size
by litNumber, a show or bold by litBool): `pbip-query.js` `S0` (pbip-visuals.js), `terminology.mjs` `litText`,
`twin-geometry.mjs` `litOf`, `twin-pages.mjs` `lit` (in `fitPhoneTabs`), `twin-visuals.mjs` `litStr` (twin-copy, twin-pages,
twin-plan, twin-text-fit). Group B moved to [1b-shown](#1b-shown-what-does-a-literal-show). Changed: `'it''s'` in
twin-geometry and redesign is "it's". The probe: one answer on all 15 inputs. The "Today" table above is the ledger's
snapshot before DD1B.

## 1b-shown What does a literal show?

**One place:** assets/js/pbir-values.js litShown (test mcp/test-0.3.2-dd1b.mjs).

**Question:** a property's Literal as a read-only report shows it: a quoted text's text, else the value as written
without its type letter (`12D` -> "12", `true` -> "true"), or nothing. Read-only (read_report, the layout check); never
the text a writer copies (1b-text).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/layout-check.js` `litStr` | [engines](MODULES.md#the-website-engines) | check_report and plan lint |
| `mcp/lib/report-inventory.mjs` `litStr` | [reading](MODULES.md#the-mcp-reading) | read_report's answer |

**Since DD1B (4 Nov):** split from 1b-text (its group B, the ledger's "second, named reader over the same parse"). The
probe: one answer on all 15 inputs.

## 1b-number What number does a literal hold?

**One place:** assets/js/pbir-values.js litNumber (test mcp/test-0.3.2-dd1b.mjs).

**Question:** a property's Literal: the number it holds (`12D` -> 12, `12L` -> 12), or nothing.

**Newest copy:** merge (tagged decoder). Verified: twin-geometry.mjs `litOf` lacks the `''` undo the older readers have (1b-text, group E).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/page-preview.js` `numOf` | [engines](MODULES.md#the-website-engines) | the preview (sizes, widths) |
| `assets/js/layout-check.js` `litNum` | [engines](MODULES.md#the-website-engines) | check_report and plan lint |
| `assets/js/report-rules.js` `num` | [engines](MODULES.md#the-website-engines) | check_report's measured rules, the twin's text fit |
| `mcp/lib/flip-cards.mjs` `numOf` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | create_report (flip cards) |
| `mcp/lib/report-inventory.mjs` `litNum` | [reading](MODULES.md#the-mcp-reading) | read_report's answer |

**Today** (A: page-preview numOf, layout-check litNum, report-inventory litNum; B: report-rules num, flip-cards numOf,
twin-visuals num, twin-geometry lit0; C: report-a11y tr):

| input | A | B | C |
|---|---|---|---|
| missing (no property) | null | NaN | 0 |
| an expr with no Literal | null | NaN | 0 |
| 'Sales' | null | NaN | 0 |
| 'it''s' (a quote inside) | null | NaN | 0 |
| 'المبيعات' (Arabic) | null | NaN | 0 |
| '' (empty text) | null | NaN | 0 |
| 'a (broken: no closing quote) | null | NaN | 0 |
| 12L | 12 | 12 | 0 |
| true | null | NaN | 0 |
| false | null | NaN | 0 |
| null | null | NaN | 0 |
| '12D' (a number in quotes) | null | NaN | 0 |

**Decided answer:** proposed: group A's: the number of `nD`, `nL`, `nM` or a bare number, `null` for anything else;
a caller that wants 0 for "none" says `?? 0`. report-a11y's `tr` reads `12L` as 0 (it strips only D): the one wrong
answer for a real literal. The reviewer and the owner decide.

**The test that will pin it:** the probe's 15 literals (family `1b-number`).

**Since DD1B (4 Nov):** every place above reads `assets/js/pbir-values.js` `litNumber`; a caller that wanted 0 or NaN
for nothing says `?? 0` or `?? NaN` where it calls. Gone: `twin-visuals.mjs` `num`, `twin-geometry.mjs` `lit0` (in
`underGrids`), `report-a11y.js` `tr` (in `backgroundOf`: `12L` is 12, it was 0, B-332). The probe: one answer on all 15
inputs. The "Today" table above is the ledger's snapshot before DD1B.

## 1b-bool What true or false does a literal hold?

**One place:** assets/js/pbir-values.js litBool (test mcp/test-0.3.2-dd1b.mjs).

**Question:** a property's Literal: true, false, or nothing.

**Newest copy:** merge (tagged decoder). Verified: twin-geometry.mjs `litOf` lacks the `''` undo the older readers have (1b-text, group E).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/page-preview.js` `boolOf` | [engines](MODULES.md#the-website-engines) | the preview (shown or hidden parts) |
| `assets/js/layout-check.js` `litBool` | [engines](MODULES.md#the-website-engines) | check_report and plan lint |
| `mcp/lib/report-inventory.mjs` `litBool` | [reading](MODULES.md#the-mcp-reading) | read_report's answer |

**Today** (A: page-preview boolOf, layout-check litBool, report-inventory litBool; B: twin-texts isOn, visual-replace
isTrue; C: report-a11y show, given `{ show: <the literal> }`):

| input | A | B | C |
|---|---|---|---|
| missing (no property) | null | false | undefined |
| an expr with no Literal | null | false | undefined |
| 'Sales' | null | false | true |
| 'it''s' (a quote inside) | null | false | true |
| 'المبيعات' (Arabic) | null | false | true |
| '' (empty text) | null | false | true |
| 'a (broken: no closing quote) | null | false | true |
| 12D | null | false | true |
| 12L | null | false | true |
| -3.5D | null | false | true |
| null | null | false | true |
| 12 (a number, not text) | null | false | true |
| '12D' (a number in quotes) | null | false | true |

They agree on `true` and `false`; they differ on everything else, by design in part: B asks "is it on" (nothing ->
false), C asks "is it shown" (anything but false -> shown, as Desktop shows a part unless told not to).

**Decided answer:** proposed: one reader, group A's (true, false, or `null`), and the two questions over it: "on"
`=== true`, "shown" `!== false`. The reviewer and the owner decide.

**The test that will pin it:** the probe's 15 literals (family `1b-bool`).

**Since DD1B (4 Nov):** every place above reads `assets/js/pbir-values.js` `litBool`. The two questions over it, at
the call: "on" is `=== true` (`twin-texts.mjs`, its `isOn` gone; `visual-replace.js` `formatFacts`, its `isTrue` gone),
"shown" is `!== false` (`report-a11y.js` `show`, undefined when the card does not say; dd1b pins it). The probe: one
answer on all 15 inputs. The "Today" table above is the ledger's snapshot before DD1B.

## 1c How wide is the frame a visual is mirrored inside?

**One place:** assets/js/mirror-units.js frameWidth (test mcp/test-0.3.2-dd1c.mjs).

**Question:** the width a visual's x is mirrored in: its parent group's, else the page's.

**Newest copy:** `twin-geometry.mjs` `widthOf` (in `aroundTables`: the validated-group fallback, fe62655b, 29 Oct). Verified, with one more: the audit's malformed width (`'400'`) gives a text in the mirror, the page's width in `aroundTables`, undefined in the fitting **and in `underGrids` `widthIn`** (the same file, B).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/mirror-units.js` `frameWidth` | [engines](MODULES.md#the-website-engines) | the twin (every visual's mirrored x, through report-mirror.js) |
| `mcp/lib/twin-geometry.mjs` `widthOf` (in `underGrids`) | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (a chart kept under a heatmap's grid) |
| `mcp/lib/twin-text-fit.mjs` `widthOf` (in `fitButtons`) | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (a button widened for its Arabic text) |
| `mcp/lib/twin-geometry.mjs` `widthOf` (in `aroundTables`) | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (a visual kept off a table's or matrix's grid) |

**Today** (A: mirror-units widthOf, B: twin-geometry widthIn, C: twin-text-fit widthOf, D: twin-geometry widthOf):

| input | A | B | C | D |
|---|---|---|---|---|
| in a group with no box | 1280 | undefined | undefined | 1280 |
| in a group whose box has no height | 400 | undefined | undefined | 1280 |
| no page at all | undefined | undefined | NaN | undefined |
| a group whose width is a text ('400') | "400" | undefined | undefined | 1280 |
| a group named an empty text | 400 | 1280 | 400 | 400 |

A grouped visual is mirrored in one width and fitted in another when its group has no full box: the twin's x and
its button fitting disagree on the same visual. twin-geometry.mjs holds two readers that differ (B and D).

**Decided answer:** proposed: D's (the audit's newest copy): the parent group's width when the group is on the page
and its box is whole (four finite numbers), else the page's width, else `null`; a group's name is any string, `''`
included. The reviewer and the owner decide.

**The test that will pin it:** the probe's 10 frames (family `1c`).

**Since DD1C (4 Nov) and DD1C2 (4 Nov):** all four read `assets/js/mirror-units.js` `frameWidth` (test
`mcp/test-0.3.2-dd1c.mjs`): mirror-units, twin-text-fit `fitButtons`, twin-geometry `aroundTables` (DD1C) and
twin-geometry `underGrids` (DD1C2, its own `widthIn` gone). The owner's answer (D-1104-15): a group with a broken box
gives the page's width, else unknown. The probe: one answer on all 10 inputs. The "Today" table above is the ledger's
snapshot before DD1C.

## 1d What width did the report set for this table column?

**One place:** assets/js/pbir-values.js columnWidth (test mcp/test-0.3.2-dd1b.mjs).

**Question:** a table's `columnWidth` entry for a column (by its queryRef): its width, or none.

**Newest copy:** merge (tagged decoder). Verified: dax-functions.mjs `widthOf` reads `120L` as NaN, the others 120.

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/report-rules.js` `widthOf` (in `tableHeaders`) | [engines](MODULES.md#the-website-engines) | check_report (a header cut), the twin's header fitting |
| `mcp/lib/dax-functions.mjs` `widthOf` (in `fitPictures`) | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | create_report (a table's picture columns) |
| `mcp/lib/twin-text-fit.mjs` `widthOf` (in `fitHeaders`) | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (a header widened) |
| `mcp/lib/twin-plan.mjs` `own` (in `tablesStep`) | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's answer (a wide table named) |
| `mcp/lib/twin-geometry.mjs` `strip` (in `underGrids`) | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (a matrix's row headers) |

**Today** (A: report-rules widthOf, twin-text-fit widthOf, twin-plan own, twin-geometry strip; B: dax-functions
widthOf):

| input | A | B |
|---|---|---|
| 120L | 120 | NaN |
| abc | null | NaN |
| an entry with no properties | null | throws TypeError |

**Decided answer:** proposed: group A's: the first entry for that queryRef whose value is a number (1b-number's
reader), else `null`. The reviewer and the owner decide.

**The test that will pin it:** the probe's 12 entries (family `1d`).

**Since DD1B (4 Nov):** every place above is a call of `assets/js/pbir-values.js` `columnWidth` (the entries, the
column's queryRef). Changed: dax-functions.mjs `widthOf` reads `120L` as 120 (it was NaN) and an entry with no
properties as none (it threw a TypeError), B-332. The probe: one answer on all 12 inputs. The "Today" table above is the
ledger's snapshot before DD1B.

## 1f Is this text Arabic?

**One place:** assets/js/arabic-script.js hasArabic (test mcp/test-0.3.2-dd1f.mjs).

**Question:** a text: does it hold an Arabic letter (the test that sends it the Arabic way)?

**Newest copy:** the broad test (text-measure.js `ARABIC`, field-catalog.js `AR_SCRIPT`); dax-functions.mjs `storyLang` is a later, narrower copy. Verified: a presentation form (U+FEFB, U+FDF2; the audit's U+FE8E is the same block) reads English there.

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/text-measure.js` `ARABIC` | [engines](MODULES.md#the-website-engines) | every measured text width (the writer, the rules, the twin); since DD1F arabic-script.js's `ARABIC` itself, exported |
| `assets/js/field-catalog.js` `langOf` | [engines](MODULES.md#the-website-engines) | the field picker (the website, suggest_fields); since DD1F calls `hasArabic`; `AR_SCRIPT` went |
| `assets/js/report-rules.js` `headerNeed` | [engines](MODULES.md#the-website-engines) | check_report (an Arabic header's share), the twin's header fitting (calls `hasArabic`; `AR_LETTER` went) |
| `assets/js/pbip-query.js` `AR_LETTERS` | [engines](MODULES.md#the-website-engines) | the writer (titles in Arabic); since DD1F arabic-script.js's `ARABIC` itself, exported |
| `mcp/lib/dax-functions.mjs` `storyLang` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | create_report (the story sentence's language); since DD1F calls `hasArabic`; its `lang === 'ar'` half stays |
| `mcp/lib/report-bind.mjs` `arName` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | create_report (an Arabic column name); since DD1F calls `hasArabic`; `AR_COL` went |
| `mcp/lib/twin-plan.mjs` `arOf` (in `labelsStep`) | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's answer (labels already in Arabic); since DD1F is `hasArabic` |

**Today** (A: text-measure ARABIC, field-catalog AR_SCRIPT; B: report-rules AR_LETTER; C: pbip-query AR_LETTERS,
dax-functions storyLang, report-bind AR_COL, twin-plan arOf):

| input | A | B | C |
|---|---|---|---|
| U+FEFB (a presentation form B: lam alef) | true | true | false |
| U+FDF2 (a presentation form A: Allah) | true | true | false |
| U+0750 (the Arabic supplement) | true | false | false |
| U+08A0 (Arabic extended-A) | true | false | false |

All seven count Arabic-Indic digits and the Arabic question mark as Arabic, and none a direction mark alone.

**Decided answer:** proposed: group A's: the Arabic block, its supplement, extended-A and both presentation-form blocks.
Whether digits and punctuation alone make a text Arabic is a second question the reviewer and the owner decide.

**The test that will pin it:** the probe's 11 texts (family `1f`).

**Since DD1F (5 Nov; the reviewer's call under D-1104-15):** the decided answer above, in one place:
`assets/js/arabic-script.js` (`ARABIC`, group A's class, one regex, no g flag; `hasArabic`, null and undefined are no
text). text-measure.js `ARABIC` and pbip-query.js `AR_LETTERS` are its `ARABIC` itself, still exported (pbip-bidi,
pbip-tooltip, pbip-page and visual-gallery read them); field-catalog `langOf`, report-rules `headerNeed`, dax-functions
`storyLang` (its `lang === 'ar'` half stays), report-bind `arName` and twin-plan's `arOf` call `hasArabic` (and so does
planTwin's auto sentence label, the same function). `AR_SCRIPT`, `AR_LETTER` and `AR_COL` are gone. Changed: report-rules
reads U+0750 and U+08A0 as Arabic; pbip-query, storyLang, report-bind and twin-plan read U+FEFB, U+FDF2, U+0750 and
U+08A0 as Arabic. Digits, the question mark and a direction mark alone: as before. The probe: all 7 answer the same on
all 11 texts; mcp/test-0.3.2-dd1f.mjs pins them and null, undefined and a number. The "Today" table above is the
ledger's snapshot before DD1F.

## grid Does this visual keep its grid left to right?

**One place:** assets/js/mirror-policy.js keepsGridLtr (test mcp/test-0.3.2-dd2v.mjs).

**Question:** a visual type: a table or a matrix, whose columns Desktop keeps left to right in the twin.

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/mirror-policy.js` `keepsGridLtr` | [engines](MODULES.md#the-website-engines) | the twin (the one home of the rule, twin-geometry.mjs says) |
| `mcp/lib/page-picture.mjs` `newOverlaps` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's answer (new overlaps beside a table or a matrix): reads `keepsGridLtr` since DD2V; its `TABLES` copy is gone |

**Today:** both answer the same on all 18 types (tableEx and pivotTable; the catalog's `table`, `matrix` and
`accessibleTable` neither).

**Decided answer:** today's; one list (mirror-policy.js `keepsGridLtr`).

**The test that pins it:** `mcp/test-0.3.2-dd2v.mjs` (the probe's 18 types through `keepsGridLtr`, each answer pinned; both places on the 18 types: one answer each) and the probe's 18 types (family `grid`; the same 18 pin vt-slicer and vt-bar).

**Since DD2V (5 Nov):** page-picture.mjs reads mirror-policy.js `keepsGridLtr`; its `TABLES` is gone. No answer changed.

## vt-slicer Is this visual a slicer?

**One place:** assets/js/visual-types.js SLICER_TYPES and isSlicer (test mcp/test-0.3.2-dd2z.mjs).

**Question:** a visual type: is it a slicer (a visual that filters the page by its field)?

**Newest copy:** not in the audit.

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/visual-types.js` `isSlicer` | [engines](MODULES.md#the-website-engines) | the one place (DD2Z, with `SLICER_TYPES`): the four below read it |
| `assets/js/mirror-policy.js` `kindOf` | [engines](MODULES.md#the-website-engines) | the twin; its `SLICER` list is gone |
| `assets/js/page-preview.js` `kindOf` | [engines](MODULES.md#the-website-engines) | the preview |
| `assets/js/report-a11y.js` `describe` | [engines](MODULES.md#the-website-engines) | check_report (accessibility), the writer; its `SLICERS` is gone |
| `mcp/lib/report-inventory.mjs` `inventory` | [reading](MODULES.md#the-mcp-reading) | read_report's answer (a visual's `slicer` flag); its `SLICERS` is gone |

**What Desktop makes** (measured on 5 Nov, Power BI Desktop 2.159.1231.0, engine branch lab/look032 A): the pane's
Slicer saves as `slicer`, the Button slicer as `advancedSlicerVisual`, the Input slicer as `textSlicer`, the List
slicer (Preview) as `listSlicer`. None saves as `filterSlicer`.

**Today** (before DD2Z; A: visual-types isSlicer, report-inventory SLICERS; B: mirror-policy kindOf, page-preview
kindOf, report-a11y SLICERS): `filterSlicer` was a slicer for A, "other" for B. Now all five answer the same on all 18
types.

**Decided answer:** the four Desktop makes; `filterSlicer` (a catalog type Desktop never writes as a slicer) is "other"
everywhere (D-1104-15, with the Desktop check of 5 Nov).

**The test that pins it:** `mcp/test-0.3.2-dd2z.mjs` (the probe's 18 types through `isSlicer`, source and .min.js; the
five places on the 18 types: one answer each; no place keeps a list of its own) and the probe's 18 types (family
`vt-slicer`).

**Since DD2Z (5 Nov):** one list, `SLICER_TYPES` in visual-types.js (the four), with `isSlicer`; the four places read it.
The one answer that changed: `filterSlicer` is no longer a slicer for read_report (a visual's `slicer` flag, the
SLICER marker in its answer) and check_report; the twin and the preview already said "other".

## vt-bar Is this visual a bar chart?

**One place:** assets/js/visual-types.js BAR_TYPES and isBar (test mcp/test-0.3.2-dd2v.mjs).

**Question:** a visual type: a chart of horizontal bars?

**Newest copy:** not in the audit.

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/visual-types.js` `isBar` | [engines](MODULES.md#the-website-engines) | the one place (DD2V, with `BAR_TYPES`): the four below read it |
| `assets/js/mirror-policy.js` `kindOf` | [engines](MODULES.md#the-website-engines) | the twin |
| `assets/js/page-preview.js` `kindOf` | [engines](MODULES.md#the-website-engines) | the preview (and its bars' padding band) |
| `assets/js/layout-check.js` `placeOf` | [engines](MODULES.md#the-website-engines) | check_report and plan lint (and its bar-label rule); its `BARS` is gone |
| `mcp/lib/page-picture.mjs` `newOverlaps` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (new overlaps); its `BARS` is gone |

**Today** (A: mirror-policy kindOf; B: page-preview kindOf; C: layout-check BARS, page-picture BARS):

| input | A | B | C |
|---|---|---|---|
| stackedBarChart | false (custom) | true (bar) | true |

`stackedBarChart` is not in Microsoft's catalog (visual-types.js `NATIVE_TYPES`: Power BI's stacked bar is
`barChart`), so mirror-policy calls it custom; the other three list a type Power BI does not write.

**Decided answer:** proposed: the catalog's bar types only (barChart, clusteredBarChart,
hundredPercentStackedBarChart) in one list; the same for `stackedColumnChart`. The reviewer and the owner decide.

**The test that pins it:** `mcp/test-0.3.2-dd2v.mjs` (the probe's 18 types through `isBar`, source and .min.js; the five places on the 18 types: one answer each; no place keeps a list of its own) and the probe's 18 types (family `vt-bar`).

**Since DD2V (5 Nov):** one list, `BAR_TYPES` in visual-types.js (the catalog's three bar types) with `isBar`; the four places read it. The one answer that changed: `stackedBarChart` (not a Power BI type) is no longer a bar in the preview, check_report and the twin's picture. `stackedColumnChart` left the column kind lists of page-preview.js (the shape, the bars' padding band, the category) and layout-check.js `KINDS`. The "Today" table above is the ledger's snapshot before DD2V.

## canon What is the canonical text of a plan?

**One place:** mcp/lib/canon.mjs canon (test mcp/test-0.3.2-dd2c.mjs).

**Question:** a value: its JSON with keys sorted and undefined left out (the text a plan's digest is taken of).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `mcp/lib/canon.mjs` `canon` | [gate](MODULES.md#the-mcp-the-approval-gate) | the one place (DD2C): every write reads it through artifact.mjs `modelPrintOf` and `bindingOf` (the binding of a plan to its click: create_report, the twin's write, the redesign) and every approval through plans.mjs `inputDifferences` and `gate` (the plan's pins against a write's inputs, a changed plan named) |

**Today:** both answer the same on all 10 values (the same line, copied).

**Decided answer:** today's; one copy (Phase 2: same code, should be one).

**The test that pins it:** `mcp/test-0.3.2-dd2c.mjs` (the probe's 10 values and 6 more pinned; the base's bindings,
model prints and gate differences of made-up plans byte for byte; both old copies, from the base's source, beside the one
place: one answer each) and the probe's 10 values (family `canon`).

**Since DD2C (5 Nov):** one canonical text: canon.mjs `canon`. artifact.mjs (`modelPrintOf`, `bindingOf`) and plans.mjs
(`inputDifferences`, the gate) import it; their copies are gone. No answer and no digest changed. The "Today" line
above is the ledger's snapshot before DD2C (2 places).

## crc What is the CRC-32 of these bytes?

**One place:** assets/js/png-bytes.js crc32 (test mcp/test-0.3.2-dd2p.mjs).

**Question:** bytes: their CRC-32 (the PNG chunk and ZIP entry checksum).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/png-bytes.js` `crc32` | [engines](MODULES.md#the-website-engines) | the one place (DD2P): every PNG and ZIP written reads it: design-engine.js `pngOf` (generate_theme and the theme generator page's background PNG), theme-download-ui.js `textChunk` (the theme generator page's text chunks, through `pngChunk`), glass-picture.mjs (the glass background, create_report, the twin's flipped picture), page-picture.mjs (the twin's page pictures), pbip-zip.js `zip` |
| `assets/js/pbip-zip.js` `crc32` | [engines](MODULES.md#the-website-engines) | the website's .pbip download (the ZIP): png-bytes.js `crc32` itself, exported here for pbip-export.js (the same function, not a copy) |

**Today:** all 5 answer the same on all 8 inputs (the check value 0xCBF43926 for '123456789' included).

**Decided answer:** today's; one copy (Phase 2). The PNG chunk writers around it (design-engine `pngOf`, glass-picture
and page-picture `chunk`, theme-download-ui `textChunk`) are the same job and move with it.

**The test that pins it:** `mcp/test-0.3.2-dd2p.mjs` (the 8 byte strings pinned; every old copy, from the base's source,
beside the one place: one answer each) and the probe's 8 byte strings (family `crc`).

**Since DD2P (4 Nov):** one CRC-32 and one table: png-bytes.js `crc32`. design-engine.js, theme-download-ui.js,
glass-picture.mjs and page-picture.mjs read it (their copies and tables gone); pbip-zip.js exports it as the same
function. The "Today" line above is the ledger's snapshot before DD2P (5 places).

## overlap Do these two boxes overlap?

**One place:** mcp/lib/box-overlap.mjs overlaps (test mcp/test-0.3.2-dd2o.mjs).

**Question:** two boxes on a page: do they overlap by more than a rounding (half a pixel each way)?

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `mcp/lib/box-overlap.mjs` `overlaps` | [helpers](MODULES.md#the-mcp-what-leaves-the-server-and-the-tools-helpers) | the one place (DD2O): the twin (twin-copy.mjs, twin-text-fit.mjs through twin-visuals.mjs: a button widened over no visual) and create_report's redesign (redesign-grid.mjs: the grid, never a new overlap) |

**Today:** both old copies answered the same on all 9 pairs.

**Decided answer:** today's; one copy (Phase 2).

**The test that pins it:** `mcp/test-0.3.2-dd2o.mjs` (13 pairs pinned on both box shapes; the old copies, from the base's
source, beside the one place: one answer each; twin-visuals.mjs `overlaps` and redesign-grid.mjs `overlap` are the
same function) and the probe's 9 pairs (family `overlap`; the same 9 pin `overlap-area`).

**Since DD2O (5 Nov):** one test: box-overlap.mjs `overlaps`, on `{ x, y, width, height }` or `{ x, y, w, h }` (the size
read as `width`, or `w` when `width` is undefined). twin-visuals.mjs re-exports it; redesign-grid.mjs imports it as
`overlap` (its copy gone, the name still exported). Neither is a place any more: both are box-overlap.mjs `overlaps`.

## overlap-area How much do two boxes overlap?

**One place:** mcp/lib/box-overlap.mjs overlapArea (test mcp/test-0.3.2-dd2o.mjs).

**Question:** two boxes on a page: the area they share. Each caller reads it against its own threshold, a named
constant there: twin-geometry.mjs as more than 0, `ON_HOST` (half the small visual's box) or `LANDS_ON_MIN` (4 px²),
page-picture.mjs `newOverlaps` as more than `NEW_OVERLAP_MIN` (4 px²).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `mcp/lib/box-overlap.mjs` `overlapArea` | [helpers](MODULES.md#the-mcp-what-leaves-the-server-and-the-tools-helpers) | the one place (DD2O): the twin (twin-geometry.mjs: a small visual kept on its host, a chart that would land on another, a visual in a matrix's margin) and the twin's answer (page-picture.mjs `newOverlaps`: new overlaps) |

**Today:** both old copies answered the same on all 9 pairs. A 0.4 px overlap 100 px high is 40 px² here and no
overlap for `overlap`; a zero-width box is 0 here and an overlap there: the two are different questions (see "Not one
question").

**Decided answer:** today's; one copy, each caller's threshold a named constant.

**The test that pins it:** `mcp/test-0.3.2-dd2o.mjs` (13 pairs pinned on both box shapes; the old copies, from the base's
source, beside the one place: one answer each) and the probe's 9 pairs (family `overlap-area`).

**Since DD2O (5 Nov):** one area: box-overlap.mjs `overlapArea`. twin-geometry.mjs `overlapOf` and page-picture.mjs
`meets` are gone, and so is a third copy the ledger did not list (twin-geometry.mjs `meet`, inside `landsOn`, the same
line on `{ w, h }` boxes); their callers read `overlapArea`.

## contrast What is the contrast of two colours?

**One place:** assets/js/contrast.js contrast (test mcp/test-0.3.2-dd2k.mjs).

**Question:** two colours: their WCAG contrast ratio (1 to 21).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/contrast.js` `contrast` | [engines](MODULES.md#the-website-engines) | the one place (DD2K): every reader below reads it |
| `assets/js/design-colours.js` `contrast` | [engines](MODULES.md#the-website-engines) | generate_theme, the theme generator page, check_report's contrast (through design-engine.js); the same function, exported as before |
| `assets/js/pbip-query.js` `contrast` | [engines](MODULES.md#the-website-engines) | the writer (a gradient's two ends, 3:1 off the card); the same function, exported as before |
| `assets/js/svg-kpi-compiler.js` `contrastOf` | [engines](MODULES.md#the-website-engines) | the SVG KPI designer page, create_report's SVG KPIs; the same function |

**Today:** all 4 answer the same on all 9 pairs (each gives NaN for `#FFF`, a colour name and an empty text).

**Decided answer:** today's; one copy (Phase 2).

**The test that will pin it:** the probe's 9 pairs (family `contrast`).

**Since DD2K (5 Nov):** one copy: `assets/js/contrast.js` `luminance` and `contrast` (test
mcp/test-0.3.2-dd2k.mjs: the 9 pairs and 6 colours pinned as the base gave them, and the three places give that one
answer). The three places read it (design-colours.js `lum` and `contrast`, pbip-query.js `lum` and `contrast`,
svg-kpi-compiler.js `contrastOf`); their own copies are gone. The 3:1 and 4.5:1 thresholds stay each caller's own.

## xml How is a text escaped for XML (SVG)?

**Question:** a text: the same text safe inside an XML attribute or element (`&`, `<`, `>`, `'`, `"`).

**One place:** assets/js/svg-escape.js xmlEsc (test mcp/test-0.3.2-dd2x.mjs).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/svg-escape.js` `xmlEsc` | [engines](MODULES.md#the-website-engines) | the SVG KPIs (the designer page, create_report) |
| `mcp/lib/flip-cards.mjs` `xml` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | create_report (flip cards) |

**Today:** both answer the same on all 10 texts (`'` as `&apos;`; null and undefined as their words).

**Decided answer:** today's; one copy (Phase 2).

**The test that will pin it:** the probe's 10 texts (family `xml`; the same 10 pin `html`).

## html How is a text escaped for HTML?

**One place:** assets/js/html-escape.js htmlEsc (test mcp/test-0.3.2-dd2h.mjs).

**Question:** a text: the same text safe inside an HTML page (`&`, `<`, `>`, `"`, `'`).

**Newest copy:** equal by the audit; **the probe disagrees**: null and undefined give `""` in six copies and their words in three, and measure-builder.js leaves `'`.

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/exam-view.js` `esc` | [pages](MODULES.md#the-browser-pages-own-scripts) | the practice exam pages |
| `assets/js/field-picker-ui.js` `esc` | [engines](MODULES.md#the-website-engines) | the field picker on the website |
| `assets/js/health-downloads.js` `esc` | [engines](MODULES.md#the-website-engines) | the model health check page (its downloads) |
| `assets/js/health-view.js` `esc` | [engines](MODULES.md#the-website-engines) | the model health check page |
| `assets/js/page-preview.js` `esc` | [engines](MODULES.md#the-website-engines) | the preview (the approval window, the theme generator page) |
| `assets/js/svg-kpi-designer.js` `esc` | [pages](MODULES.md#the-browser-pages-own-scripts) | the SVG KPI designer page |
| `assets/js/theme-generator.js` `esc` | [pages](MODULES.md#the-browser-pages-own-scripts) | the theme generator page |
| `assets/js/measure-builder.js` `escapeHtml` | [pages](MODULES.md#the-browser-pages-own-scripts) | the DAX measure builder page |
| `mcp/lib/approval-view.mjs` `esc` | [gate](MODULES.md#the-mcp-the-approval-gate) | the approval window (every plan's page) |

**Today** (A: exam-view esc, theme-generator esc; B: field-picker-ui, health-downloads, health-view, page-preview,
svg-kpi-designer esc, approval-view esc; C: measure-builder escapeHtml):

| input | A | B | C |
|---|---|---|---|
| it's | "it&#39;s" | "it&#39;s" | "it's" |
| null | "null" | "" | "null" |
| undefined | "undefined" | "" | "undefined" |

**Decided answer:** proposed: group B's (null and undefined as nothing, all five characters escaped); one copy for the
pages and one for the MCP (the MCP stays self-contained, so approval-view keeps its own until the engines hold it).
The reviewer and the owner decide.

**The test that will pin it:** the probe's 10 texts (family `html`).

**Since DD2H (5 Nov):** one copy, group B's answer: `assets/js/html-escape.js` `htmlEsc` (& < > " ' as entities, `'` as
`&#39;`, null and undefined as ""). Every place above reads it and keeps its own name as a one-line alias (the pages'
own scripts from the page's window, the engines and approval-view.mjs by require; the MCP has required assets/js
modules since DD1C, so the note above that it stays self-contained no longer holds). Answers that changed: null and
undefined give "" in exam-view, theme-generator and measure-builder (they gave "null" / "undefined"); measure-builder
escapes `'` (the browser reads `&#39;` as `'`). The probe: 9 places, 0 of 10 disagree; dd2h runs every place on 14 texts.

## decode What text do the bytes of a Power BI file hold?

**One place:** assets/js/model-file.js decodeText (test mcp/test-0.3.2-dd2d.mjs).

**Question:** a file's bytes: its text (UTF-16LE or UTF-8, with a BOM or none).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/model-file.js` `decodeText` | [engines](MODULES.md#the-website-engines) | the one place (DD2D): every reader below reads it |
| `assets/js/model-health-worker.js` `decodeText` | [pages](MODULES.md#the-browser-pages-own-scripts) | the model health check page (its worker; reads model-file.js through importScripts, first) |
| `assets/js/model-import-browser.js` `decodeText` | [engines](MODULES.md#the-website-engines) | the website's model import (the field picker; reads model-file.js) |
| `mcp/lib/model.mjs` `decode` | [reading](MODULES.md#the-mcp-reading) | every MCP tool that reads a model or a report (reads model-file.js) |

**Today:** all 3 answer the same on all 10 byte strings.

**Decided answer:** today's; one copy for the website (the worker and the import), the MCP's own (self-contained).

**The test that will pin it:** the probe's 10 byte strings (family `decode`).

**Since DD2D (4 Nov):** one copy everywhere, the MCP too (the reviewer's call, D-1104-15: since DD1C the MCP requires
assets/js modules and packaging stages every literal require): `assets/js/model-file.js` `decodeText` (test
`mcp/test-0.3.2-dd2d.mjs`: the probe's 10 byte strings and 3 more, every caller as source and .min.js). No answer
changed. The probe: one answer on all 10 inputs.

## 1g Which model folder is read?

**One place:** assets/js/model-nearest.js (test mcp/test-0.3.2-dd1g.mjs).

**Question:** a chosen folder holding model folders: the one read, or a refusal.

**Newest copy:** equal since DD1G (4 Nov): the rule is `model-nearest.js` `nearest` (MANY_MODELS since 41bd0daa, 26 Oct,
built from `model-discovery.mjs`); the browser's own sort is gone.

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/model-nearest.js` `nearest` | [engines](MODULES.md#the-website-engines) | the rule itself: both callers below read it |
| `assets/js/model-import-browser.js` `fromFolder` | [engines](MODULES.md#the-website-engines) | the website's model import (the field picker on the pages); it refuses two tied models before any file is read, and the page names both |
| `mcp/lib/model-discovery.mjs` `nearestModel` | [reading](MODULES.md#the-mcp-reading) | every MCP tool that reads a model (read_model first); it keeps its ReadError and message |

**Today** (the probe: the rule, model-import-browser fromFolder stopped at its first read, model-discovery nearestModel
on made-up paths): all three answer the same on all 8 inputs. Before DD1G the browser took the alphabetically first of
two side by side ("uses A.SemanticModel") where the MCP refused (MANY_MODELS): 4 of 8 inputs.

| input | all three |
|---|---|
| two side by side; two in a project folder; names that differ by letter case; three at the top | "refuses MANY_MODELS" |
| one at the top, one deeper; a backup of the same name deeper | "uses" the top one |

**The test that pins it:** `mcp/test-0.3.2-dd1g.mjs` (12 made-up folder lists; the MCP and the website give one answer)
and the probe's 8 folders (family `1g`).

## 1h Which column sorts this one?

**One place:** assets/js/sort-column.js sortColumnFor (test mcp/test-0.3.2-dd1h.mjs).

**Question:** a month or day name column: the number column of its table that sorts it, or none.

**Newest copy:** equal since DD1H (4 Nov): the rule is `sort-column.js` `sortColumnFor`, built from `field-catalog.js`'s
(the Arabic suffix, 873a7a00, 6 Oct; a missing dataType read as unknown, 1ebff206, 26 Oct) with the health check's
null-list behaviour (no list: null). The health check's own copy is gone.

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/sort-column.js` `sortColumnFor` | [engines](MODULES.md#the-website-engines) | the rule itself: both callers below read it |
| `assets/js/field-catalog.js` `sortColumnFor` | [engines](MODULES.md#the-website-engines) | the field picker (the website, suggest_fields, create_report's sort); it passes its colType |
| `assets/js/model-health-tmdl.js` `sortColumnFor` | [engines](MODULES.md#the-website-engines) | check_model_health's fix script, the health check page; a missing dataType is unknown, never text; no list gives null |

**Today** (the probe: the rule, field-catalog sortColumnFor, model-health-tmdl sortColumnFor): all three answer the
same on all 11 inputs. Before DD1H the health check answered null where the writer found the number column (a month
number with no dataType; "Day Name (Arabic)"), and the writer threw on no column list: 3 of 11 inputs.

| input | all three |
|---|---|
| Month Name, Month Number with no dataType | "Month Number" |
| Day Name (Arabic), Day of Week Number int64 | "Day of Week Number" |
| Month Name, no column list at all | null |

**The test that pins it:** `mcp/test-0.3.2-dd1h.mjs` (14 made-up column sets; the writer and the health check give
one answer), mcp/test.mjs's comparison, and the probe's 11 tables (family `1h`).

## png-chunk What bytes make a PNG chunk?

**One place:** assets/js/png-bytes.js pngChunk (test mcp/test-0.3.2-dd2p.mjs).

**Question:** a chunk's type and body: its bytes (length, type, body, CRC-32).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/png-bytes.js` `pngChunk` | [engines](MODULES.md#the-website-engines) | the one place (DD2P): design-engine.js `pngOf` (generate_theme and the theme generator page's background PNG), theme-download-ui.js `textChunk` (the page's text chunks), glass-picture.mjs `encode` (the glass background) and page-picture.mjs `writePng` and `testPng` (the twin's page pictures) read it |

**Today:** all 3 answer the same bytes on all 8 chunks.

**Decided answer:** today's; one copy, with `crc` and the PNG writers' big-endian `be` / `u32` (a write).

**The test that pins it:** `mcp/test-0.3.2-dd2p.mjs` (8 chunks pinned; the old copies beside the one place; every PNG
written byte for byte the base's) and the probe's 8 chunks (family `png-chunk`).

**Since DD2P (4 Nov):** one chunk writer, png-bytes.js `pngChunk`, with `be32` (the big-endian write): design-engine.js
`pngOf`, glass-picture.mjs `encode`, page-picture.mjs `writePng` and `testPng`, and theme-download-ui.js `textChunk` (its
DataView writer gone) read it.

## u32 What number do four bytes hold?

**One place:** assets/js/png-bytes.js u32 (test mcp/test-0.3.2-dd2p.mjs).

**Question:** bytes and an offset: the big-endian unsigned 32-bit number there (a PNG read).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/png-bytes.js` `u32` | [engines](MODULES.md#the-website-engines) | the one place (DD2P): glass-picture.mjs (the glass picture read back, the twin flips it), page-picture.mjs (the twin's page pictures read) and, since DD2U, design-metrics.js `imageSize` (an attached logo's size) read it |

**Today:** both answer the same on all 8 reads (past the end too: 16908288 for `01 02`, both).

**Decided answer:** today's; one copy.

**The test that pins it:** `mcp/test-0.3.2-dd2p.mjs` (8 reads pinned, the old two beside it) and the probe's 8 reads
(family `u32`).

**Since DD2P (4 Nov):** glass-picture.mjs and page-picture.mjs read png-bytes.js `u32`.

## lru What does a small cache keep?

**One place:** mcp/lib/small-cache.mjs lru (test mcp/test-0.3.2-dd2p.mjs).

**Question:** a cache of N entries: what its gets answer after these sets (the least recently used goes first).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `mcp/lib/small-cache.mjs` `lru` | [helpers](MODULES.md#the-mcp-what-leaves-the-server-and-the-tools-helpers) | the one place (DD2P): glass-picture.mjs (the glass pictures kept between calls) and page-picture.mjs (the twin's pictures kept between calls) read it |

**Today:** both answer the same on all 8 step lists.

**Decided answer:** today's; one copy.

**The test that pins it:** `mcp/test-0.3.2-dd2p.mjs` (8 step lists pinned, the old two beside it) and the probe's 8
step lists (family `lru`).

**Since DD2P (4 Nov):** glass-picture.mjs and page-picture.mjs import small-cache.mjs `lru` (an MCP file: both
places are MCP only).

## tmdl-name How is a name written in TMDL?

**One place:** assets/js/tmdl-name.js tmdlName (test mcp/test-0.3.2-dd2n.mjs).

**Question:** a table or column name: as TMDL writes it (bare, or in single quotes with `'` doubled).

**Newest copy:** equal by the audit; the probe disagreed on a name with a hyphen (until DD2N).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/tmdl-name.js` `tmdlName` | [engines](MODULES.md#the-website-engines) | the one place (DD2N): every place below reads it |
| `assets/js/model-health-tmdl.js` `name` | [engines](MODULES.md#the-website-engines) | check_model_health's fix scripts, the health check page (reads tmdl-name.js: require, or the page loads it first) |
| `assets/js/measure-builder.js` `tName` | [pages](MODULES.md#the-browser-pages-own-scripts) | the DAX measure builder page (reads window.DATmdlName; the page loads it first) |
| `mcp/lib/model-culture.mjs` `q` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's Arabic names in the model (create_arabic_twin; reads tmdl-name.js) |
| `mcp/lib/sample-project.mjs` `name` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | create_report's sample project (reads tmdl-name.js) |
| `mcp/lib/shadow-model.mjs` `q` | [helpers](MODULES.md#the-mcp-what-leaves-the-server-and-the-tools-helpers) | a test only (MODULES.md: used by none; reads tmdl-name.js) |
| `mcp/lib/twin-model.mjs` `tmdlName` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's measures (reads tmdl-name.js) |

**Today:** all 7 answer the same on all 9 inputs.

**Before DD2N** (A: model-health-tmdl name, measure-builder tName; B: model-culture q, sample-project name,
shadow-model q, twin-model tmdlName):

| input | A | B |
|---|---|---|
| Sales-2024 | "Sales-2024" | "'Sales-2024'" |

**Decided answer:** B's (a hyphen is quoted; quoting a name that needs none is always read the same by TMDL, a bare
hyphen is the risky side, so no Desktop look is needed): the reviewer's call under D-1104-15.

**The test that will pin it:** the probe's 9 names (family `tmdl-name`); `mcp/test-0.3.2-dd2n.mjs` pins them and 4 more.

**Since DD2N (5 Nov):** one copy everywhere: `assets/js/tmdl-name.js` `tmdlName` (`String(n)` first, so a number is
safe). Changed: a table or column name with a hyphen in the health check's fix scripts and the measure builder's TMDL
is now quoted (`'Sales-2024'`). The probe: one answer on all 9 inputs.

## limits How large may a model file be?

**One place:** assets/js/model-file.js LIMITS (test mcp/test-0.3.2-dd2d.mjs).

**Question:** a kind of model file or entry: the size (or count) over which it is refused before it is read.

**Newest copy:** equal by the audit; the probe: the same four sizes, and the website's import has no `entries` count
(it never opens a ZIP itself: the .pbit goes to the worker, which has it).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/model-file.js` `LIMITS` | [engines](MODULES.md#the-website-engines) | the one place (DD2D): every reader below reads it |
| `assets/js/model-health-worker.js` `LIMITS` | [pages](MODULES.md#the-browser-pages-own-scripts) | the health check page and the website's .pbit import (the worker; reads model-file.js) |
| `assets/js/model-import-browser.js` `LIMITS` | [engines](MODULES.md#the-website-engines) | the website's model import (reads model-file.js) |
| `mcp/lib/model.mjs` `PBIT_LIMITS` | [reading](MODULES.md#the-mcp-reading) | every MCP tool that reads a model (the same object as model-file.js LIMITS) |

**Today** (A: model-health-worker LIMITS, model PBIT_LIMITS; B: model-import-browser LIMITS):

| input | A | B |
|---|---|---|
| entries | 20000 | undefined |

**Decided answer:** today's numbers, one object (B never needs `entries`, so the difference changes no answer).

**The test that will pin it:** the probe's 8 kinds (family `limits`).

**Since DD2D (4 Nov):** one frozen object, `assets/js/model-file.js` `LIMITS` (test `mcp/test-0.3.2-dd2d.mjs`); model.mjs
`PBIT_LIMITS` is that same object. The import's object now has `entries` too (it never reads it: no answer changed). The
probe: one answer on all 8 kinds. The "Today" table above is the ledger's snapshot before DD2D.

## text-runs What text does a text box hold?

**One place:** assets/js/text-runs.js paragraphTexts (test mcp/test-0.3.2-dd2t.mjs).

**Question:** a text box's paragraphs: one text per paragraph, its runs' values joined as written (0 -> "0", true ->
"true", no value -> ""). How the lines are joined is each caller's own question, answered at its call.

**Newest copy:** equal by the audit; the probe split the four old copies in two pairs (layout-check and
report-inventory; report-a11y and page-preview), each pair equal.

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/text-runs.js` `paragraphTexts` | [engines](MODULES.md#the-website-engines) | the one place (DD2T), read by four callers, each with its own join: layout-check.js `textOf` (" / ", trimmed: check_report and plan lint, placeholder text and empty boxes), report-inventory.mjs `textOf` through visual-meaning.mjs (" / ", trimmed: read_report's answer), report-a11y.js `textOf` (" ": check_report and the writer, an empty text box is no Tab stop, its alt text), page-preview.js `textOf` (" ": the preview, the text drawn in a box) |

**Before DD2T** (A: layout-check textOf, report-inventory textOf; B: report-a11y textOf, page-preview textOf):

| input | A | B |
|---|---|---|
| two paragraphs | "Top / Bottom" | "Top Bottom" |
| a run with a number value | "0" | "" |
| an empty paragraph between two | "A /  / B" | "A  B" |
| spaces around | "Sales" | "  Sales  " |

**Decided answer:** one reader of the runs, `0` kept (a run's value as written), and the join each caller's own (" / "
and trimmed to show a box's lines on one line, " " to test for text and to draw it). The reviewer's call under
D-1104-15.

**The test that pins it:** `mcp/test-0.3.2-dd2t.mjs` (the probe's 9 text boxes and 7 more: paragraphTexts pinned, each
caller's join pinned, every caller run as the probe runs it gives paragraphTexts with its join; no caller reads the runs
itself) and the probe's 9 text boxes (family `text-runs`).

**Since DD2T (5 Nov):** the four copies are gone; each `textOf` is a call of `paragraphTexts` with its join. What
changed: a run whose value is 0 (or false) is text for report-a11y (a Tab stop, given alt text) and is drawn by
page-preview; before, B read it as "". Two paragraphs, an empty paragraph and spaces around keep each caller's answer.
Where the paragraphs sit stays each caller's (`plain(general)` in three, the first general entry in page-preview).

## blank What is BLANK minus or divided by a number?

**One place:** assets/js/svg-expressions.js evalNode and evalValueKind (test mcp/test-0.3.2-dd2z.mjs).

**Question:** DIVIDE ( a, b ), a / b and a - b with BLANK (null), as Power BI Desktop answers them.

**Newest copy:** equal by the audit; the probe disagreed on `/` before DD2Z (evalNode threw).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/svg-expressions.js` `evalNode` | [engines](MODULES.md#the-website-engines) | the one place (DD2Z): the SVG KPI's preview values (the designer page, create_report's SVG KPIs) |
| `assets/js/svg-editor-panels.js` `evalValues` | [engines](MODULES.md#the-website-engines) | the SVG KPI designer page (the results beside the inputs): calls `evalValueKind`, which runs the compiler's own tree through `evalNode` |

**What Desktop answers** (measured on 5 Nov, Power BI Desktop 2.159.1231.0, DAX query view, ISBLANK and the value as
text; engine branch lab/look032 B). No expression raises an error:

| expression | Desktop |
|---|---|
| `DIVIDE ( 5, BLANK () )` | BLANK |
| `DIVIDE ( BLANK (), BLANK () )` | BLANK |
| `DIVIDE ( 5, 0 )` | BLANK |
| `5 / BLANK ()` | Infinity |
| `BLANK () / BLANK ()` | BLANK |
| `5 / 0` | Infinity |
| `0 / 0` | NaN |

**Before DD2Z:** `evalNode` threw DIV0 for a `/` by BLANK or by 0 (the old text here said "DAX's `/` gives an error for
5 / 0": wrong, Desktop gives Infinity); `evalValues` showed nothing (BLANK) for them.

**Decided answer:** one evaluator (`evalNode`), exactly the table above (BLANK is null; Infinity and NaN are JavaScript's),
`DIVIDE` where the expression is DIVIDE and `/` where it is `/`; what the compiled measure does after (the `COALESCE ( ..., 0 )`
of a drawn value) is applied as the compiled DAX writes it. The SVG KPI "Progress ring" with a BLANK or a 0 target
draws an empty ring reading "0%" (never an error). The compiler's DAX is the truth and is unchanged.

**The test that pins it:** `mcp/test-0.3.2-dd2z.mjs` (the probe's 14 BLANK inputs through both places; the ring with a
BLANK, a 0 and a missing target) and the probe's 14 inputs (family `blank`); the designer page's ring cases in
`scripts/tests/dd2z.mjs`.

**Since DD2Z (5 Nov):** `evalValues` calls `evalValueKind` (svg-expressions.js), which builds the compiler's value tree
(`VALUE_NODES`, also read by svg-kpi-compiler.js) and evaluates it; its own ratio, diff and % rules are gone. `/` by BLANK
or 0 no longer throws.

## expr-text What text does an expression given as lines hold?

**One place:** assets/js/dax-reference-parser.js exprText (test mcp/test-0.3.3-sg1.mjs).

**Question:** an expression (a measure's, a partition's, a description) written as one text or as its lines, as a model's JSON writes both: one text, the lines joined by a newline; nothing (null, undefined) is ""; anything else its String.

**Newest copy:** equal (0.3.3 SG1: the reviewer's same-job finder, 9 Nov; every copy was the same text).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/dax-reference-parser.js` `exprText` | [engines](MODULES.md#the-website-engines) | the Model Health Check (its index, fix scripts, remembered answers), check_model_health, add_gulf_calendar, the twin's model |

**Since SG1 (9 Nov):** gone, their calls read the one place: `assets/js/confirm-memory.js` `text`, `assets/js/gulf-health.js` `text`, `assets/js/model-health-tmdl.js` `text`, `assets/js/model-index.js` `text`, `mcp/lib/shadow-model.mjs` `textOf` (each now a name for exprText), and dax-reference-parser.js's own `text` (the first: it loads first on the tool page and in the worker). The parity: mcp/test-0.3.3-sg1.mjs (each old copy, as the base wrote it, and the one place on the same made-up inputs); the probe's 12 inputs (family `expr-text`).

## lit-value What value is a literal written as?

**One place:** assets/js/pbir-values.js litValue (test mcp/test-0.3.3-sg1.mjs).

**Question:** a property's Literal (`{ expr: { Literal: { Value } } }`): its Value exactly as written (`'Sales'` with its quotes, `12D` with its letter, `false`), else undefined. Not what the literal holds (1b-text, 1b-number, 1b-bool): the raw token, for a caller that compares it as written.

**Newest copy:** equal (0.3.3 SG1: the reviewer's same-job finder, 9 Nov; every copy was the same text).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/pbir-values.js` `litValue` | [engines](MODULES.md#the-website-engines) | check_report, the twin, the writer's visual replacement, the Arabic lens |

**Since SG1 (9 Nov):** gone, their calls read the one place: `assets/js/mirror-policy.js` `lit`, `assets/js/report-a11y.js` `lit`, `assets/js/report-rules.js` `lit`, `assets/js/visual-replace.js` `litOf`, `mcp/lib/check-impact.mjs` `litOf` (still exported, now litValue itself), `mcp/lib/arabic-lens.mjs` `litOf`. The parity: mcp/test-0.3.3-sg1.mjs (each old copy, as the base wrote it, and the one place on the same made-up inputs); the probe's 14 inputs (family `lit-value`).

## obj-entries Which entries does an objects list hold?

**One place:** assets/js/pbir-values.js entries (test mcp/test-0.3.3-sg1.mjs).

**Question:** a visual's objects list (`objects.<name>`): its object entries (`entries`; a list that is not an array has none, a null entry is skipped), the properties of the entries with no selector merged (`plain`), the properties of all merged (`anyOf`). The probe answers the three as one.

**Newest copy:** equal (0.3.3 SG1: the reviewer's same-job finder, 9 Nov; every copy was the same text).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/pbir-values.js` `entries` | [engines](MODULES.md#the-website-engines) | read_report, check_report, the layout check |

**Since SG1 (9 Nov):** gone, their calls read the one place: `assets/js/layout-check.js` `entries`, `plain`, `anyOf`; `mcp/lib/report-inventory.mjs` `entries`, `plain`, `anyOf` (each now a name for pbir-values.js's). The parity: mcp/test-0.3.3-sg1.mjs (each old copy, as the base wrote it, and the one place on the same made-up inputs); the probe's 9 inputs (family `obj-entries`).

## hex-rgb What red, green and blue does a hex colour hold?

**One place:** assets/js/design-colours.js hexToRgb (test mcp/test-0.3.3-sg1.mjs).

**Question:** a colour `#rrggbb`: `[r, g, b]`, each 0 to 255 read from its two hex digits; a pair that is not hex is NaN (the callers pass `#rrggbb` they made).

**Newest copy:** equal (0.3.3 SG1: the reviewer's same-job finder, 9 Nov; every copy was the same text).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/design-colours.js` `hexToRgb` | [engines](MODULES.md#the-website-engines) | generate_theme and the theme generator (colour mixes), the PBIP writer's colour mix |

**Since SG1 (9 Nov):** gone, their calls read the one place: `assets/js/pbip-query.js` `p` (in `mixHex`, now design-colours.js's, read when called: the theme pages load design-colours.js before it). design-colours.js's own was the first and stays (contrast.js holds luminance and contrast only, as mcp/test-0.3.2-dd2k.mjs M2 pins). The parity: mcp/test-0.3.3-sg1.mjs (each old copy, as the base wrote it, and the one place on the same made-up inputs); the probe's 10 inputs (family `hex-rgb`).

## page-el What element does a page make for a class and a text?

**One place:** assets/js/page-toast.js el (test mcp/test-0.3.3-sg1.mjs).

**Question:** a document, a tag, a class and a text: a new element of that document, its class set when the class is not empty, its text set when the text is not null or undefined (0 and false are set).

**Newest copy:** equal (0.3.3 SG1: the reviewer's same-job finder, 9 Nov; every copy was the same text).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/page-toast.js` `el` | [pages](MODULES.md#the-browser-pages-own-scripts) | the build page (its cards, the Fuel panel), the theme generator's names box |

**Since SG1 (9 Nov):** gone, their calls read the one place: `assets/js/build-page.js` `el`, `assets/js/build-usage.js` `el`, `assets/js/theme-download-ui.js` `el` (each now a one-line call with its document). build/index.html loads page-toast.min.js before build-usage.min.js. The parity: mcp/test-0.3.3-sg1.mjs (each old copy, as the base wrote it, and the one place on the same made-up inputs); the probe's 9 inputs (family `page-el`).

## page-save What does a page keep of its state?

**One place:** assets/js/page-toast.js saveState (test mcp/test-0.3.3-sg1.mjs).

**Question:** a page's key and state: the state as JSON in localStorage under the key; a refusal (private mode, full) or no localStorage: nothing, never an error.

**Newest copy:** equal (0.3.3 SG1: the reviewer's same-job finder, 9 Nov; every copy was the same text).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/page-toast.js` `saveState` | [pages](MODULES.md#the-browser-pages-own-scripts) | the calendar, measure builder and licensing calculator pages (the visitor's browser only) |

**Since SG1 (9 Nov):** gone, their calls read the one place: `assets/js/calendar-generator.js` `save`, `assets/js/licensing-calculator.js` `save`, `assets/js/measure-builder.js` `save` (each now a one-line call with its key and state). The licensing pages (EN and AR) load page-toast.min.js before licensing-calculator.min.js. The parity: mcp/test-0.3.3-sg1.mjs (each old copy, as the base wrote it, and the one place on the same made-up inputs); the probe's 8 inputs (family `page-save`).

## measure-key Which table and measure does 'T'[M] name?

**One place:** mcp/lib/model-script.mjs keyOf (test mcp/test-0.3.3-sg1.mjs).

**Question:** a measure written `'Table'[Measure]` or `Table[Measure]` (spaces around trimmed): `{ t, m }`, else null.

**Newest copy:** equal (0.3.3 SG1: the reviewer's same-job finder, 9 Nov; every copy was the same text).

| place | MODULES.md | who sees it |
|---|---|---|
| `mcp/lib/model-script.mjs` `keyOf` | [write path](MODULES.md#the-mcp-the-write-path) | create_report (the metric switcher, the status icons) |

**Since SG1 (9 Nov):** gone, their calls read the one place: `mcp/lib/metric-switcher.mjs` `keyOf`, `mcp/lib/status-icons.mjs` `keyOf` (both import it). The parity: mcp/test-0.3.3-sg1.mjs (each old copy, as the base wrote it, and the one place on the same made-up inputs); the probe's 11 inputs (family `measure-key`).

## put-json What does a plan's file hold after a JSON is put in it?

**One place:** mcp/lib/model-script.mjs putJson (test mcp/test-0.3.3-sg1.mjs).

**Question:** the plan's files, an index of their paths, a path and a JSON: that file's data becomes the JSON with two spaces, as the writer writes it; a path the plan lacks throws (a TypeError, as before). flip-cards.mjs's `put` also adds a file the plan lacks: a different answer, left there.

**Newest copy:** equal (0.3.3 SG1: the reviewer's same-job finder, 9 Nov; every copy was the same text).

| place | MODULES.md | who sees it |
|---|---|---|
| `mcp/lib/model-script.mjs` `putJson` | [write path](MODULES.md#the-mcp-the-write-path) | create_report (the DAX functions, the status icons) |

**Since SG1 (9 Nov):** gone, their calls read the one place: `mcp/lib/dax-functions.mjs` `put`, `mcp/lib/status-icons.mjs` `put` (each now a one-line call). The parity: mcp/test-0.3.3-sg1.mjs (each old copy, as the base wrote it, and the one place on the same made-up inputs); the probe's 8 inputs (family `put-json`).

## leaves Which leaf pointers does a value hold?

**One place:** mcp/lib/redesign-kinds.mjs leaves (test mcp/test-0.3.3-sg1.mjs).

**Question:** a value and a start ("" unless given): every leaf pointer (`/a/b` for `{ a: { b: 1 } }`, a list's items by index); an empty object or list has none; a value that is not an object is the start itself.

**Newest copy:** equal (0.3.3 SG1: the reviewer's same-job finder, 9 Nov; every copy was the same text).

| place | MODULES.md | who sees it |
|---|---|---|
| `mcp/lib/redesign-kinds.mjs` `leaves` | [redesign](MODULES.md#the-mcp-the-redesign) | create_report's redesign (the copy's check, each patch's reason) |

**Since SG1 (9 Nov):** gone, their calls read the one place: `mcp/lib/redesign-patches.mjs` `leaves` (now `Kinds.leaves`, always given its record's pointer). The parity: mcp/test-0.3.3-sg1.mjs (each old copy, as the base wrote it, and the one place on the same made-up inputs); the probe's 11 inputs (family `leaves`).

## path-out How is a path inside the working folder said, dots kept?

**One place:** mcp/lib/twin-read.mjs pathOut (test mcp/test-0.3.3-sg1.mjs).

**Question:** a file: its path from the working folder with `/` between parts, each part cleaned (safeName), `..` and `.` kept as they are. The probe needs DATAARCUS_ROOT.

**Newest copy:** equal (0.3.3 SG1: the reviewer's same-job finder, 9 Nov; every copy was the same text).

| place | MODULES.md | who sees it |
|---|---|---|
| `mcp/lib/twin-read.mjs` `pathOut` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin, the native copy |

**Since SG1 (9 Nov):** gone, their calls read the one place: `mcp/lib/native-copy.mjs` `pathOut` and its `relRoot` (twin-read.mjs's, imported). The parity: mcp/test-0.3.3-sg1.mjs (each old copy, as the base wrote it, and the one place on the same made-up inputs); the probe's 8 inputs (family `path-out`).

## rel-out How is a path inside the working folder said, every part cleaned?

**One place:** mcp/lib/check-redact.mjs relOut (test mcp/test-0.3.3-sg1.mjs).

**Question:** a file: its path from the working folder with `/` between parts, every part cleaned (safeName). Not path-out: a `..` goes through safeName here. The probe needs DATAARCUS_ROOT.

**Newest copy:** equal (0.3.3 SG1: the reviewer's same-job finder, 9 Nov; every copy was the same text).

| place | MODULES.md | who sees it |
|---|---|---|
| `mcp/lib/check-redact.mjs` `relOut` | [checkers](MODULES.md#the-mcp-the-checkers) | check_report (its redaction, the Arabic lens) |

**Since SG1 (9 Nov):** gone, their calls read the one place: `mcp/lib/arabic-lens.mjs` `relOut` (imported). The parity: mcp/test-0.3.3-sg1.mjs (each old copy, as the base wrote it, and the one place on the same made-up inputs); the probe's 8 inputs (family `rel-out`).

## Equal copies, not probed (the audit's Phase 2 list)

Page code that needs a page to run (a toast, a copy, a worker's address) or a table of labels: not probed. "same
text: yes" is pinned by the check: the definitions must stay the same text (spaces aside), or it fails.

| copy | places | same text | newest copy |
|---|---|---|---|
| toast (the page's `#toast`) | `assets/js/calendar-generator.js` `toast`; `assets/js/measure-builder.js` `toast`; `assets/js/theme-generator.js` `toast` | yes | one place since DD2W: `assets/js/page-toast.js` `toast` (each place a one-line alias, 1800 ms) |
| toast (the page's `#toast`, longer) | `assets/js/svg-kpi-designer.js` `toast`; `assets/js/calendar-generator.js` `toast` | no: 2200 ms against the others' 1800 ms (found by this check) | one place since DD2W: `assets/js/page-toast.js` `toast` (the time is the page's, kept) |
| toast (a box it makes) | `assets/js/exam-view.js` `toast`; `assets/js/health-view.js` `toast` | no: 2200 ms and 1800 ms, each its own id and class | one place since DD2W: `assets/js/page-toast.js` `boxToast` and `toast` (shown by the class `show`; the box's markup byte for byte the base's, scripts/tests/dd2w.mjs X1-X3) |
| copy fallback (select the text) | `assets/js/calendar-generator.js` `copyText`; `assets/js/measure-builder.js` `copyText`; `assets/js/svg-kpi-designer.js` `copyText`; `assets/js/theme-download-ui.js` `copyText` | yes | one place since DD2W: `assets/js/page-toast.js` `copyText` (each page passes its element and its two messages; before DD2W each place's own `fallback`) |
| the health worker's address | `assets/js/health-worker-client.js` `WORKER_URL`; `assets/js/theme-generator.js` `MODEL_WORKER` | yes | equal |
| the health check's area labels | `assets/js/health-downloads.js` `AREA`; `assets/js/health-view.js` `CAT` | no: CAT holds the Arabic and the icons too; the English words are the same | equal |

## Not one question

A shape two places share is not a family when they answer different questions. Each is named here so the next
ledger does not add it again.

- `mcp/lib/model.mjs` `isDir`: isDir and `isLink` share a shape (a stat and one test), not a question (Codex, 4 Nov).
- `mcp/lib/read-report.mjs` `isFile` and `mcp/lib/read-report.mjs` `isDir`: never follow a link (lstat, the read boundary), where model.mjs's `isDir` follows one (stat): four questions (0.3.3 SG1, group 5).
- `assets/js/field-suggest.js` `rank` and `mcp/lib/gulf-calendar.mjs` `addGulfCalendar`: two step pipelines (a context, five calls, the last one's answer), field ranking and the calendar table (0.3.3 SG1, group 6).
- `assets/js/exam-view.js` `toast` and `assets/js/health-view.js` `toast`: one-line calls of page-toast.js's `toast` and `boxToast`, each its own box, class and time (2200, 1800 ms) (0.3.3 SG1, group 11; the copies went in DD2W).
- `mcp/lib/plans.mjs` `shown` and `mcp/lib/read-report.mjs` `cleanName`: a plan value's canonical text capped at 200 for the approval's words, and a report name made visible and capped at 60 at the read boundary (0.3.3 SG1, group 12).
- `assets/js/page-preview.js` `kindOf`: one shape drawn for a table and a matrix (the preview), not which one it is or
  whether its grid stays left to right (`grid`; mirror-policy.js `kindOf` names them apart) (the audit).
- `assets/js/report-a11y.js` `readingOrder` and `mcp/lib/twin-texts.mjs` `readingOrder`: the Tab order a reader meets
  (rows, right to left in a right-to-left report) and the order the twin lists the English report's texts in; CL1's
  first probe had them as one family ("order", 5 of 8 inputs apart): two questions (the audit).
- `mcp/lib/box-overlap.mjs` `overlapArea` and `mcp/lib/box-overlap.mjs` `overlaps`: an area and a tolerant yes or no,
  two questions (`overlap-area`, `overlap`) (the audit; before DD2O twin-geometry.mjs `overlapOf` and twin-visuals.mjs
  `overlaps`; one file since DD2O, two functions).
- `assets/js/png-bytes.js` `u32` and `assets/js/png-bytes.js` `be32`: reading four bytes and writing them (the audit; one
  file since DD2P, two functions).
- `assets/js/pbip-export.js` `PBI_LITERAL`: a quoted token kept as written, like terminology.mjs's and text-format.mjs's
  `lit` below; a keeper, not a decoder (the audit).
- B-326 (the audit): one resolver with a path check that depends on the system; one question, one place.
- `mcp/lib/twin-texts.mjs` `ARABIC_END`: whether a text's last character is Arabic (where a neutral end goes), not
  whether the text is Arabic (1f).
- `mcp/lib/plan-disclosure.mjs` `isEn`: "English and no Arabic", for the approval page's wording, not 1f's opposite.
- `assets/js/pbip-bidi.js` `lit`: the quoted literal itself (`'Sales'` with its
  quotes) or null, for a writer that puts it back as it was; not the text it holds (1b-text).
- `mcp/lib/text-format.mjs` `lit`: any text value as written, for a format check; not the text of a literal.
- `assets/js/health-view.js` `fallback` (in `copy`): a list copied through a textarea and `execCommand('copy')` when the
  clipboard refuses, saying "Copied"; not the tool pages' select-the-text fallback (page-toast.js `copyText`) (DD2W).
- `assets/js/svg-expressions.js` `ESCAPES` and `mcp/lib/dax-functions.mjs` `esc`: XML and a data URL's `%` and `#`
  inside DAX text, a different escape from `xml`.
- `mcp/lib/metric-switcher.mjs` `esc` and `mcp/lib/text-format.mjs` `esc`: a regular expression's escape, not a markup one.
- `assets/js/pbip-query.js` `lit`, `str`, `bool`, `num` (and their copies in `dax-functions.mjs`, `flip-cards.mjs`,
  `status-icons.mjs`, `visual-replace.js`): literal writers. One question ("write this value as a literal"), but a
  writer, not a reader: a family of its own for the next ledger, not probed here.
