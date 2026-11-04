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
| [1a Is this column time?](#1a-is-this-column-time) | 4 | 12 of 24 | the twin, the preview, the writer, check_report | merge (pbip-query.js splits camel case, layout-check.js takes the Arabic article off, page-preview.js has the most words) |
| [1b-text What text does a literal hold?](#1b-text-what-text-does-a-literal-hold) | 18 | 11 of 15 | check_report, read_report, the writer, the twin, the preview, the redesign | merge (tagged decoder) |
| [1b-number What number does a literal hold?](#1b-number-what-number-does-a-literal-hold) | 8 | 12 of 15 | check_report, read_report, the twin, the preview | merge (tagged decoder) |
| [1b-bool What true or false does a literal hold?](#1b-bool-what-true-or-false-does-a-literal-hold) | 6 | 13 of 15 | check_report, read_report, the twin, the preview, the native copy | merge (tagged decoder) |
| [1c How wide is the frame a visual is mirrored inside?](#1c-how-wide-is-the-frame-a-visual-is-mirrored-inside) | 4 | 0 of 10 | the twin | one place since DD1C2: `assets/js/mirror-units.js` `frameWidth` |
| [1d What width did the report set for this table column?](#1d-what-width-did-the-report-set-for-this-table-column) | 5 | 3 of 12 | check_report, the twin, create_report | merge (tagged decoder) |
| [1f Is this text Arabic?](#1f-is-this-text-arabic) | 7 | 4 of 11 | every measured text, check_report, create_report, the twin | `text-measure.js` / `field-catalog.js` (the broad test) |
| [1g Which model folder is read?](#1g-which-model-folder-is-read) | 3 | 0 of 8 | the website's model import, every MCP tool that reads a model | equal (one place: `model-nearest.js`) |
| [1h Which column sorts this one?](#1h-which-column-sorts-this-one) | 3 | 0 of 11 | the website's field picker, check_model_health's fix script | equal (one place: `sort-column.js`) |
| [grid Does this visual keep its grid left to right?](#grid-does-this-visual-keep-its-grid-left-to-right) | 2 | 0 of 18 | the twin | equal |
| [vt-slicer Is this visual a slicer?](#vt-slicer-is-this-visual-a-slicer) | 5 | 1 of 18 | read_report, check_report, the twin, the preview | (not in the audit) |
| [vt-bar Is this visual a bar chart?](#vt-bar-is-this-visual-a-bar-chart) | 4 | 1 of 18 | the twin, the preview, check_report | (not in the audit) |
| [canon What is the canonical text of a plan?](#canon-what-is-the-canonical-text-of-a-plan) | 2 | 0 of 10 | every write (the approval's digest) | equal |
| [crc What is the CRC-32 of these bytes?](#crc-what-is-the-crc-32-of-these-bytes) | 5 | 0 of 8 | every PNG and ZIP written | equal |
| [png-chunk What bytes make a PNG chunk?](#png-chunk-what-bytes-make-a-png-chunk) | 3 | 0 of 8 | every PNG written | equal |
| [u32 What number do four bytes hold?](#u32-what-number-do-four-bytes-hold) | 2 | 0 of 8 | the twin's and the glass's PNG reads | equal |
| [lru What does a small cache keep?](#lru-what-does-a-small-cache-keep) | 2 | 0 of 8 | the twin's pictures, the glass | equal |
| [overlap Do these two boxes overlap?](#overlap-do-these-two-boxes-overlap) | 2 | 0 of 9 | the twin, the redesign | equal |
| [overlap-area How much do two boxes overlap?](#overlap-area-how-much-do-two-boxes-overlap) | 2 | 0 of 9 | the twin | equal |
| [contrast What is the contrast of two colours?](#contrast-what-is-the-contrast-of-two-colours) | 3 | 0 of 9 | generate_theme, the writer, the SVG KPIs | equal |
| [xml How is a text escaped for XML (SVG)?](#xml-how-is-a-text-escaped-for-xml-svg) | 2 | 0 of 10 | the SVG KPIs, the flip cards | equal |
| [html How is a text escaped for HTML?](#html-how-is-a-text-escaped-for-html) | 9 | 3 of 10 | the website's pages, the approval window | equal by the audit; the probe differs (null, `'`) |
| [tmdl-name How is a name written in TMDL?](#tmdl-name-how-is-a-name-written-in-tmdl) | 6 | 1 of 9 | check_model_health's fix scripts, the measure builder page, the twin's model, create_report's sample | equal by the audit; the probe differs (`Sales-2024`) |
| [decode What text do the bytes of a Power BI file hold?](#decode-what-text-do-the-bytes-of-a-power-bi-file-hold) | 3 | 0 of 10 | every model read (the MCP and the website) | equal |
| [limits How large may a model file be?](#limits-how-large-may-a-model-file-be) | 3 | 1 of 8 | every model read (the MCP and the website) | equal by the audit; the import has no `entries` limit |
| [text-runs What text does a text box hold?](#text-runs-what-text-does-a-text-box-hold) | 4 | 4 of 9 | check_report, read_report, the preview | equal by the audit for two; the probe splits them in two pairs |
| [blank What is BLANK minus or divided by a number?](#blank-what-is-blank-minus-or-divided-by-a-number) | 2 | 3 of 10 | the SVG KPI designer page, create_report's SVG KPIs | equal by the audit; the probe differs (a division by BLANK or 0) |

"places" counts a function once for each family it answers (`mirror-policy.js` `kindOf` answers two). Who sees it:
the MCP tool whose answer or written file carries the place's answer, or the website page. Golden tests that pin a
place are not mapped yet (see the note's "Lessons").

## 1a Is this column time?

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

## 1b-text What text does a literal hold?

**Question:** a property's Literal (`{ expr: { Literal: { Value } } }`): the text it holds (`'Sales'` -> Sales, `''`
undone to `'`), or nothing.

**Newest copy:** merge (tagged decoder). Verified: twin-geometry.mjs `litOf` lacks the `''` undo the older readers have (1b-text, group E).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/mirror-policy.js` `strOf` | [engines](MODULES.md#the-website-engines) | the twin (report-mirror.js reads with it) |
| `assets/js/page-preview.js` `lit` | [engines](MODULES.md#the-website-engines) | the preview (a link's type, a flip card's title) |
| `assets/js/page-preview.js` `strOf` | [engines](MODULES.md#the-website-engines) | the preview (titles, fonts, colours) |
| `assets/js/layout-check.js` `litStr` | [engines](MODULES.md#the-website-engines) | check_report and plan lint |
| `assets/js/pbip-query.js` `S0` | [engines](MODULES.md#the-website-engines) | the writer (create_report, the website's download) |
| `assets/js/report-a11y.js` `strOf` | [engines](MODULES.md#the-website-engines) | check_report (alt text, accessibility), the writer |
| `assets/js/report-rules.js` `str` | [engines](MODULES.md#the-website-engines) | check_report's measured rules, the twin's text fit |
| `mcp/lib/arabic-lens.mjs` `strOf` | [checkers](MODULES.md#the-mcp-the-checkers) | check_report (its Arabic lens) |
| `mcp/lib/check-language.mjs` `litOfS` | [checkers](MODULES.md#the-mcp-the-checkers) | check_report (the language check) |
| `mcp/lib/dax-functions.mjs` `textOf` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | create_report (the DAX functions option), check_report |
| `mcp/lib/flip-cards.mjs` `textOf` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | create_report (flip cards) |
| `mcp/lib/report-inventory.mjs` `litStr` | [reading](MODULES.md#the-mcp-reading) | read_report's answer |
| `mcp/lib/terminology.mjs` `litText` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's terms, plan_layout |
| `mcp/lib/twin-geometry.mjs` `litOf` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (its geometry) |
| `mcp/lib/twin-pages.mjs` `lit` (in `fitPhoneTabs`) | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (its phone tabs) |
| `mcp/lib/twin-pictures.mjs` `lit` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (pages drawn on a picture) |
| `mcp/lib/twin-visuals.mjs` `litStr` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (every step's literals) |
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

## 1b-number What number does a literal hold?

**Question:** a property's Literal: the number it holds (`12D` -> 12, `12L` -> 12), or nothing.

**Newest copy:** merge (tagged decoder). Verified: twin-geometry.mjs `litOf` lacks the `''` undo the older readers have (1b-text, group E).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/page-preview.js` `numOf` | [engines](MODULES.md#the-website-engines) | the preview (sizes, widths) |
| `assets/js/layout-check.js` `litNum` | [engines](MODULES.md#the-website-engines) | check_report and plan lint |
| `assets/js/report-rules.js` `num` | [engines](MODULES.md#the-website-engines) | check_report's measured rules, the twin's text fit |
| `mcp/lib/flip-cards.mjs` `numOf` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | create_report (flip cards) |
| `mcp/lib/report-inventory.mjs` `litNum` | [reading](MODULES.md#the-mcp-reading) | read_report's answer |
| `mcp/lib/twin-visuals.mjs` `num` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (header and button fitting) |
| `mcp/lib/twin-geometry.mjs` `lit0` (in `underGrids`) | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (a chart under a heatmap's grid) |
| `assets/js/report-a11y.js` `tr` (in `backgroundOf`) | [engines](MODULES.md#the-website-engines) | check_report (contrast: a background's transparency) |

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

## 1b-bool What true or false does a literal hold?

**Question:** a property's Literal: true, false, or nothing.

**Newest copy:** merge (tagged decoder). Verified: twin-geometry.mjs `litOf` lacks the `''` undo the older readers have (1b-text, group E).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/page-preview.js` `boolOf` | [engines](MODULES.md#the-website-engines) | the preview (shown or hidden parts) |
| `assets/js/layout-check.js` `litBool` | [engines](MODULES.md#the-website-engines) | check_report and plan lint |
| `mcp/lib/report-inventory.mjs` `litBool` | [reading](MODULES.md#the-mcp-reading) | read_report's answer |
| `mcp/lib/twin-texts.mjs` `isOn` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's texts (a title or label that is on) |
| `assets/js/visual-replace.js` `isTrue` (in `formatFacts`) | [engines](MODULES.md#the-website-engines) | the native copy (native-copy.mjs) |
| `assets/js/report-a11y.js` `show` | [engines](MODULES.md#the-website-engines) | check_report (is a title or a card shown) |

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

**Question:** a table's `columnWidth` entry for a column (by its queryRef): its width, or none.

**Newest copy:** merge (tagged decoder). Verified: dax-functions.mjs `widthOf` reads `120L` as NaN, the others 120.

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/report-rules.js` `widthOf` (in `tableHeaders`) | [engines](MODULES.md#the-website-engines) | check_report (a header cut), the twin's header fitting |
| `mcp/lib/dax-functions.mjs` `widthOf` (in `fitPictures`) | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | create_report (a table's picture columns) |
| `mcp/lib/twin-text-fit.mjs` `widthOf` (in `fitHeaders`) | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (a header widened) |
| `mcp/lib/twin-plan.mjs` `own` (in `planTwin`) | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's answer (a wide table named) |
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

## 1f Is this text Arabic?

**Question:** a text: does it hold an Arabic letter (the test that sends it the Arabic way)?

**Newest copy:** the broad test (text-measure.js `ARABIC`, field-catalog.js `AR_SCRIPT`); dax-functions.mjs `storyLang` is a later, narrower copy. Verified: a presentation form (U+FEFB, U+FDF2; the audit's U+FE8E is the same block) reads English there.

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/text-measure.js` `ARABIC` | [engines](MODULES.md#the-website-engines) | every measured text width (the writer, the rules, the twin) |
| `assets/js/field-catalog.js` `AR_SCRIPT` | [engines](MODULES.md#the-website-engines) | the field picker (the website, suggest_fields) |
| `assets/js/report-rules.js` `AR_LETTER` | [engines](MODULES.md#the-website-engines) | check_report (an Arabic header's share), the twin's header fitting |
| `assets/js/pbip-query.js` `AR_LETTERS` | [engines](MODULES.md#the-website-engines) | the writer (titles in Arabic) |
| `mcp/lib/dax-functions.mjs` `storyLang` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | create_report (the story sentence's language) |
| `mcp/lib/report-bind.mjs` `AR_COL` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | create_report (an Arabic column name) |
| `mcp/lib/twin-plan.mjs` `arOf` (in `planTwin`) | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's answer (labels already in Arabic) |

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

## grid Does this visual keep its grid left to right?

**Question:** a visual type: a table or a matrix, whose columns Desktop keeps left to right in the twin.

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/mirror-policy.js` `keepsGridLtr` | [engines](MODULES.md#the-website-engines) | the twin (the one home of the rule, twin-geometry.mjs says) |
| `mcp/lib/page-picture.mjs` `TABLES` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's answer (new overlaps beside a table or a matrix) |

**Today:** both answer the same on all 18 types (tableEx and pivotTable; the catalog's `table`, `matrix` and
`accessibleTable` neither).

**Decided answer:** today's; one list (mirror-policy.js `keepsGridLtr`).

**The test that will pin it:** the probe's 18 types (family `grid`; the same 18 pin vt-slicer and vt-bar).

## vt-slicer Is this visual a slicer?

**Question:** a visual type: is it a slicer (a visual that filters the page by its field)?

**Newest copy:** not in the audit.

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/visual-types.js` `isSlicer` | [engines](MODULES.md#the-website-engines) | read_report, check_report |
| `assets/js/mirror-policy.js` `kindOf` | [engines](MODULES.md#the-website-engines) | the twin |
| `assets/js/page-preview.js` `kindOf` | [engines](MODULES.md#the-website-engines) | the preview |
| `assets/js/report-a11y.js` `SLICERS` | [engines](MODULES.md#the-website-engines) | check_report (accessibility), the writer |
| `mcp/lib/report-inventory.mjs` `SLICERS` | [reading](MODULES.md#the-mcp-reading) | read_report's answer |

**Today** (A: visual-types isSlicer, report-inventory SLICERS; B: mirror-policy kindOf; C: page-preview kindOf; D:
report-a11y SLICERS):

| input | A | B | C | D |
|---|---|---|---|---|
| filterSlicer | true | false (other) | false (other) | false |

**Decided answer:** proposed: visual-types.js `isSlicer` (the catalog's slicers, filterSlicer included) for all five.
The reviewer and the owner decide (a filterSlicer would then be mirrored as a slicer: a Desktop check first).

**The test that will pin it:** the probe's 18 types (family `vt-slicer`).

## vt-bar Is this visual a bar chart?

**Question:** a visual type: a chart of horizontal bars?

**Newest copy:** not in the audit.

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/mirror-policy.js` `kindOf` | [engines](MODULES.md#the-website-engines) | the twin |
| `assets/js/page-preview.js` `kindOf` | [engines](MODULES.md#the-website-engines) | the preview |
| `assets/js/layout-check.js` `BARS` | [engines](MODULES.md#the-website-engines) | check_report and plan lint |
| `mcp/lib/page-picture.mjs` `BARS` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (new overlaps) |

**Today** (A: mirror-policy kindOf; B: page-preview kindOf; C: layout-check BARS, page-picture BARS):

| input | A | B | C |
|---|---|---|---|
| stackedBarChart | false (custom) | true (bar) | true |

`stackedBarChart` is not in Microsoft's catalog (visual-types.js `NATIVE_TYPES`: Power BI's stacked bar is
`barChart`), so mirror-policy calls it custom; the other three list a type Power BI does not write.

**Decided answer:** proposed: the catalog's bar types only (barChart, clusteredBarChart,
hundredPercentStackedBarChart) in one list; the same for `stackedColumnChart`. The reviewer and the owner decide.

**The test that will pin it:** the probe's 18 types (family `vt-bar`).

## canon What is the canonical text of a plan?

**Question:** a value: its JSON with keys sorted and undefined left out (the text a plan's digest is taken of).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `mcp/lib/artifact.mjs` `canon` | [write](MODULES.md#the-mcp-the-write-path) | every write (the binding of a plan to its click) |
| `mcp/lib/plans.mjs` `canon` | [gate](MODULES.md#the-mcp-the-approval-gate) | every approval (the plan's digest, a changed plan named) |

**Today:** both answer the same on all 10 values (the same line, copied).

**Decided answer:** today's; one copy (Phase 2: same code, should be one).

**The test that will pin it:** the probe's 10 values (family `canon`).

## crc What is the CRC-32 of these bytes?

**Question:** bytes: their CRC-32 (the PNG chunk and ZIP entry checksum).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/design-engine.js` `crc32` | [engines](MODULES.md#the-website-engines) | generate_theme and the theme generator page (the background PNG) |
| `assets/js/pbip-zip.js` `crc32` | [engines](MODULES.md#the-website-engines) | the website's .pbip download (the ZIP) |
| `mcp/lib/glass-picture.mjs` `crc32` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | the glass background (create_report, the twin's flipped picture) |
| `mcp/lib/page-picture.mjs` `crc32` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's page pictures |
| `assets/js/theme-download-ui.js` `crc32` | [pages](MODULES.md#the-browser-pages-own-scripts) | the theme generator page (its PNG's text chunks) |

**Today:** all 5 answer the same on all 8 inputs (the check value 0xCBF43926 for '123456789' included).

**Decided answer:** today's; one copy (Phase 2). The PNG chunk writers around it (design-engine `pngOf`, glass-picture
and page-picture `chunk`, theme-download-ui `textChunk`) are the same job and move with it.

**The test that will pin it:** the probe's 8 byte strings (family `crc`).

## overlap Do these two boxes overlap?

**Question:** two boxes on a page: do they overlap by more than a rounding (half a pixel each way)?

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `mcp/lib/twin-visuals.mjs` `overlaps` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (a button widened over no visual) |
| `mcp/lib/redesign-grid.mjs` `overlap` | [redesign](MODULES.md#the-mcp-the-redesign) | create_report's redesign (the grid) |

**Today:** both answer the same on all 9 pairs.

**Decided answer:** today's; one copy.

**The test that will pin it:** the probe's 9 pairs (family `overlap`; the same 9 pin `overlap-area`).

## overlap-area How much do two boxes overlap?

**Question:** two boxes on a page: the area they share. Each caller reads it its own way: twin-geometry.mjs as more
than 0 (or half the box), page-picture.mjs `newOverlaps` as more than 4 px².

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `mcp/lib/twin-geometry.mjs` `overlapOf` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin (a small visual kept on its host) |
| `mcp/lib/page-picture.mjs` `meets` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's answer (new overlaps) |

**Today:** both answer the same on all 9 pairs. A 0.4 px overlap 100 px high is 40 px² here and no overlap for
`overlap`; a zero-width box is 0 here and an overlap there: the two are different questions (see "Not one question").

**Decided answer:** today's; one copy, each caller's threshold a named constant.

**The test that will pin it:** the probe's 9 pairs (family `overlap-area`).

## contrast What is the contrast of two colours?

**Question:** two colours: their WCAG contrast ratio (1 to 21).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/design-colours.js` `contrast` | [engines](MODULES.md#the-website-engines) | generate_theme, the theme generator page, check_report's contrast (through design-engine.js) |
| `assets/js/pbip-query.js` `contrast` | [engines](MODULES.md#the-website-engines) | the writer (a gradient's two ends, 3:1 off the card) |
| `assets/js/svg-kpi-compiler.js` `contrastOf` | [engines](MODULES.md#the-website-engines) | the SVG KPI designer page, create_report's SVG KPIs |

**Today:** all 3 answer the same on all 9 pairs (each gives NaN for `#FFF`, a colour name and an empty text).

**Decided answer:** today's; one copy (Phase 2).

**The test that will pin it:** the probe's 9 pairs (family `contrast`).

## xml How is a text escaped for XML (SVG)?

**Question:** a text: the same text safe inside an XML attribute or element (`&`, `<`, `>`, `'`, `"`).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/svg-escape.js` `xmlEsc` | [engines](MODULES.md#the-website-engines) | the SVG KPIs (the designer page, create_report) |
| `mcp/lib/flip-cards.mjs` `xml` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | create_report (flip cards) |

**Today:** both answer the same on all 10 texts (`'` as `&apos;`; null and undefined as their words).

**Decided answer:** today's; one copy (Phase 2).

**The test that will pin it:** the probe's 10 texts (family `xml`; the same 10 pin `html`).

## html How is a text escaped for HTML?

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

## decode What text do the bytes of a Power BI file hold?

**Question:** a file's bytes: its text (UTF-16LE or UTF-8, with a BOM or none).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/model-health-worker.js` `decodeText` | [pages](MODULES.md#the-browser-pages-own-scripts) | the model health check page (its worker) |
| `assets/js/model-import-browser.js` `decodeText` | [engines](MODULES.md#the-website-engines) | the website's model import (the field picker) |
| `mcp/lib/model.mjs` `decode` | [reading](MODULES.md#the-mcp-reading) | every MCP tool that reads a model or a report |

**Today:** all 3 answer the same on all 10 byte strings.

**Decided answer:** today's; one copy for the website (the worker and the import), the MCP's own (self-contained).

**The test that will pin it:** the probe's 10 byte strings (family `decode`).

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

**Question:** a chunk's type and body: its bytes (length, type, body, CRC-32).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/design-engine.js` `chunk` (in `pngOf`) | [engines](MODULES.md#the-website-engines) | generate_theme and the theme generator page (the background PNG) |
| `mcp/lib/glass-picture.mjs` `chunk` (in `encode`) | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | the glass background |
| `mcp/lib/page-picture.mjs` `chunk` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's page pictures |

**Today:** all 3 answer the same bytes on all 8 chunks.

**Decided answer:** today's; one copy, with `crc` and the PNG writers' big-endian `be` / `u32` (a write).

**The test that will pin it:** the probe's 8 chunks (family `png-chunk`).

## u32 What number do four bytes hold?

**Question:** bytes and an offset: the big-endian unsigned 32-bit number there (a PNG read).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `mcp/lib/glass-picture.mjs` `u32` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | the glass picture read back (the twin flips it) |
| `mcp/lib/page-picture.mjs` `u32` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's page pictures read |

**Today:** both answer the same on all 8 reads (past the end too: 16908288 for `01 02`, both).

**Decided answer:** today's; one copy.

**The test that will pin it:** the probe's 8 reads (family `u32`).

## lru What does a small cache keep?

**Question:** a cache of N entries: what its gets answer after these sets (the least recently used goes first).

**Newest copy:** equal (the audit and the probe).

| place | MODULES.md | who sees it |
|---|---|---|
| `mcp/lib/glass-picture.mjs` `lru` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | the glass pictures kept between calls |
| `mcp/lib/page-picture.mjs` `lru` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's pictures kept between calls |

**Today:** both answer the same on all 8 step lists.

**Decided answer:** today's; one copy.

**The test that will pin it:** the probe's 8 step lists (family `lru`).

## tmdl-name How is a name written in TMDL?

**Question:** a table or column name: as TMDL writes it (bare, or in single quotes with `'` doubled).

**Newest copy:** equal by the audit; **the probe disagrees** on a name with a hyphen.

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/model-health-tmdl.js` `name` | [engines](MODULES.md#the-website-engines) | check_model_health's fix scripts, the health check page |
| `assets/js/measure-builder.js` `tName` | [pages](MODULES.md#the-browser-pages-own-scripts) | the DAX measure builder page |
| `mcp/lib/model-culture.mjs` `q` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's Arabic names in the model (create_arabic_twin) |
| `mcp/lib/sample-project.mjs` `name` | [create_report](MODULES.md#the-mcp-create_report-and-its-options) | create_report's sample project |
| `mcp/lib/shadow-model.mjs` `q` | [helpers](MODULES.md#the-mcp-what-leaves-the-server-and-the-tools-helpers) | a test only (MODULES.md: used by none) |
| `mcp/lib/twin-model.mjs` `tmdlName` | [twin](MODULES.md#the-mcp-the-arabic-twin) | the twin's measures |

**Today** (A: model-health-tmdl name, measure-builder tName; B: model-culture q, sample-project name, shadow-model q,
twin-model tmdlName):

| input | A | B |
|---|---|---|
| Sales-2024 | "Sales-2024" | "'Sales-2024'" |

**Decided answer:** proposed: B's (a hyphen is quoted; quoting a name that needs none is always read the same), unless a
Desktop look shows TMDL takes `Sales-2024` bare. The reviewer and the owner decide.

**The test that will pin it:** the probe's 9 names (family `tmdl-name`).

## limits How large may a model file be?

**Question:** a kind of model file or entry: the size (or count) over which it is refused before it is read.

**Newest copy:** equal by the audit; the probe: the same four sizes, and the website's import has no `entries` count
(it never opens a ZIP itself: the .pbit goes to the worker, which has it).

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/model-health-worker.js` `LIMITS` | [pages](MODULES.md#the-browser-pages-own-scripts) | the health check page and the website's .pbit import (the worker) |
| `assets/js/model-import-browser.js` `LIMITS` | [engines](MODULES.md#the-website-engines) | the website's model import |
| `mcp/lib/model.mjs` `PBIT_LIMITS` | [reading](MODULES.md#the-mcp-reading) | every MCP tool that reads a model |

**Today** (A: model-health-worker LIMITS, model PBIT_LIMITS; B: model-import-browser LIMITS):

| input | A | B |
|---|---|---|
| entries | 20000 | undefined |

**Decided answer:** today's numbers, one object (B never needs `entries`, so the difference changes no answer).

**The test that will pin it:** the probe's 8 kinds (family `limits`).

## text-runs What text does a text box hold?

**Question:** a text box's paragraphs: their runs' text, as one line.

**Newest copy:** equal by the audit; the probe: two pairs (layout-check and report-inventory; report-a11y and
page-preview), each pair equal.

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/layout-check.js` `textOf` | [engines](MODULES.md#the-website-engines) | check_report and plan lint (placeholder text, empty boxes) |
| `mcp/lib/report-inventory.mjs` `textOf` | [reading](MODULES.md#the-mcp-reading) | read_report's answer (a text box's text) |
| `assets/js/report-a11y.js` `textOf` | [engines](MODULES.md#the-website-engines) | check_report (an empty text box is no Tab stop), the writer |
| `assets/js/page-preview.js` `textOf` | [engines](MODULES.md#the-website-engines) | the preview (the text drawn in a box) |

**Today** (A: layout-check textOf, report-inventory textOf; B: report-a11y textOf, page-preview textOf):

| input | A | B |
|---|---|---|
| two paragraphs | "Top / Bottom" | "Top Bottom" |
| a run with a number value | "0" | "" |
| an empty paragraph between two | "A /  / B" | "A  B" |
| spaces around | "Sales" | "  Sales  " |

**Decided answer:** proposed: one reader of the runs, `0` kept (a run's value as written), and the join each caller's
own (" / " to show a box's lines on one line, " " to test for text). The reviewer and the owner decide.

**The test that will pin it:** the probe's 9 text boxes (family `text-runs`).

## blank What is BLANK minus or divided by a number?

**Question:** a - b and a / b with BLANK (null), as DAX answers them.

**Newest copy:** equal by the audit; **the probe disagrees** on a division by BLANK or by 0.

| place | MODULES.md | who sees it |
|---|---|---|
| `assets/js/svg-expressions.js` `evalNode` | [engines](MODULES.md#the-website-engines) | the SVG KPI's preview values (the designer page, create_report's SVG KPIs) |
| `assets/js/svg-editor-panels.js` `evalValues` | [engines](MODULES.md#the-website-engines) | the SVG KPI designer page (the results beside the inputs) |

**Today** (A: svg-expressions evalNode, B: svg-editor-panels evalValues):

| input | A | B |
|---|---|---|
| 5 / BLANK | throws Error | null |
| BLANK / BLANK | throws Error | null |
| 5 / 0 | throws Error | null |

A throws DIV0 for its caller to show; B shows nothing. DAX's `/` gives an error for 5 / 0 and BLANK for BLANK / BLANK
and 5 / BLANK; `DIVIDE` gives BLANK for all three.

**Decided answer:** proposed: which DAX each one mirrors (the compiled measure's `/` or `DIVIDE`) decides it; then one
evaluator. The reviewer and the owner decide.

**The test that will pin it:** the probe's 10 sums (family `blank`).

## Equal copies, not probed (the audit's Phase 2 list)

Page code that needs a page to run (a toast, a copy, a worker's address) or a table of labels: not probed. "same
text: yes" is pinned by the check: the definitions must stay the same text (spaces aside), or it fails.

| copy | places | same text | newest copy |
|---|---|---|---|
| toast (the page's `#toast`) | `assets/js/calendar-generator.js` `toast`; `assets/js/measure-builder.js` `toast`; `assets/js/theme-generator.js` `toast` | yes | equal |
| toast (the page's `#toast`, longer) | `assets/js/svg-kpi-designer.js` `toast`; `assets/js/calendar-generator.js` `toast` | no: 2200 ms against the others' 1800 ms (found by this check) | equal by the audit; the time differs |
| toast (a box it makes) | `assets/js/exam-view.js` `toast`; `assets/js/health-view.js` `toast` | no: 2200 ms and 1800 ms, each its own id | equal by the audit; the times differ |
| copy fallback (select the text) | `assets/js/calendar-generator.js` `fallback`; `assets/js/measure-builder.js` `fallback`; `assets/js/svg-kpi-designer.js` `fallback`; `assets/js/theme-download-ui.js` `fallback`; `assets/js/health-view.js` `fallback` | no: each selects its own element; health-view copies through a textarea | equal by the audit (the four that select) |
| the health worker's address | `assets/js/health-worker-client.js` `WORKER_URL`; `assets/js/theme-generator.js` `MODEL_WORKER` | yes | equal |
| the health check's area labels | `assets/js/health-downloads.js` `AREA`; `assets/js/health-view.js` `CAT` | no: CAT holds the Arabic and the icons too; the English words are the same | equal |

## Not one question

A shape two places share is not a family when they answer different questions. Each is named here so the next
ledger does not add it again.

- `mcp/lib/model.mjs` `isDir`: isDir and `isLink` share a shape (a stat and one test), not a question (Codex, 4 Nov).
- `assets/js/page-preview.js` `kindOf`: one shape drawn for a table and a matrix (the preview), not which one it is or
  whether its grid stays left to right (`grid`; mirror-policy.js `kindOf` names them apart) (the audit).
- `assets/js/report-a11y.js` `readingOrder` and `mcp/lib/twin-texts.mjs` `readingOrder`: the Tab order a reader meets
  (rows, right to left in a right-to-left report) and the order the twin lists the English report's texts in; CL1's
  first probe had them as one family ("order", 5 of 8 inputs apart): two questions (the audit).
- `mcp/lib/twin-geometry.mjs` `overlapOf` and `mcp/lib/twin-visuals.mjs` `overlaps`: an area and a tolerant yes or no,
  two questions (`overlap-area`, `overlap`) (the audit).
- `mcp/lib/glass-picture.mjs` `u32` and `mcp/lib/page-picture.mjs` `be`: reading four bytes and writing them (the audit).
- `assets/js/pbip-export.js` `PBI_LITERAL`: a quoted token kept as written, like terminology.mjs's and text-format.mjs's
  `lit` below; a keeper, not a decoder (the audit).
- B-326 (the audit): one resolver with a path check that depends on the system; one question, one place.
- `mcp/lib/twin-texts.mjs` `ARABIC_END`: whether a text's last character is Arabic (where a neutral end goes), not
  whether the text is Arabic (1f).
- `mcp/lib/plan-disclosure.mjs` `isEn`: "English and no Arabic", for the approval page's wording, not 1f's opposite.
- `assets/js/pbip-bidi.js` `lit` and `mcp/lib/terminology.mjs` `lit`: the quoted literal itself (`'Sales'` with its
  quotes) or null, for a writer that puts it back as it was; not the text it holds (1b-text).
- `mcp/lib/text-format.mjs` `lit`: any text value as written, for a format check; not the text of a literal.
- `assets/js/svg-expressions.js` `ESCAPES` and `mcp/lib/dax-functions.mjs` `esc`: XML and a data URL's `%` and `#`
  inside DAX text, a different escape from `xml`.
- `mcp/lib/metric-switcher.mjs` `esc` and `mcp/lib/text-format.mjs` `esc`: a regular expression's escape, not a markup one.
- `assets/js/pbip-query.js` `lit`, `str`, `bool`, `num` (and their copies in `dax-functions.mjs`, `flip-cards.mjs`,
  `status-icons.mjs`, `visual-replace.js`): literal writers. One question ("write this value as a literal"), but a
  writer, not a reader: a family of its own for the next ledger, not probed here.
