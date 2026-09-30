# Current work (the memory between sessions)

Read this first; update it as you go (rules in `mcp/CLAUDE.md`, "Keeping the memory"). Last updated 2026-09-30
by the builder: the `cardVisual` move approved ("go"), being built on `feat/card-visual`.

## Where things stand
- **MCP: 6 tools** (`read_model`, `suggest_fields`, `check_model_health`, `generate_theme`, `plan_layout`,
  `create_report`), 72 checks in `npm test`; all 16 website suites pass.
- **Phase 2 (design engine in the MCP): built, merged and checked in Desktop.** `generate_theme` and `plan_layout`
  reproduce the website byte for byte on all 54 design fixtures; `create_report` builds the website's project
  download from a design (60 project fixtures). Details: `mcp/PHASE2-SPEC.md`.
- **Report fixes merged** (buttons' "show" outside the state, tooltip page sizes, logo placeholder, field choice
  for untyped columns, `modelNotes`), and verified in Power BI Desktop 2.157 on "Gulf Sales AR 2": all 8 checks PASS
  (`scripts/tests/DESKTOP-TESTS.md`).

- **Table fix merged** (owner found it on "Gulf Sales AR 2": the Arabic title "جدول التفاصيل" on
  the far right, the table on the far left): tables now set `columnHeaders.columnAdjustment: growToFit` and
  `autoSizeColumnWidth: true` (Microsoft's table reference: always grow to fit; without it columns shrink to their
  content); in right-to-left reports the table's columns are reversed so the category column sits on the right;
  `modelNotes` also tells day names without a sort-by column (days showed Friday, Monday, ...). 3 new MCP checks
  (75), failing before; all 16 website suites pass. `pbip-export.min.js?v=20260930f`, `theme-generator.min.js?v=20260930h`.
  **Checked in Power BI Desktop 2.157 on "Gulf Sales AR 3": all 6 checks PASS** (both tables fill their width, Day
  Name rightmost, the three `modelNotes`, everything else identical to AR 2, KPI values equal DAX;
  `scripts/tests/DESKTOP-TESTS.md`).
- **Website dropdowns fixed** (merged): the open list was white on white on every tool page; form fields now use
  `color-scheme: dark` with dark option colours (`assets/css/style.css`), checked on every tool page in `tools.mjs`.

## Next step: build the `cardVisual` move (owner's "go" 2026-09-30, with the alignment addition), branch `feat/card-visual`
Steps: (1) tests first, failing on main; (2) code; (3) `.min.js` and `?v=`; (4) full suites; (5) Desktop check.
Done so far: plan `74459ff`, alignment added `6146152`; tests written, failing on the old code (MCP 77 checks, 3 fail:
the tooltip value, "Cards EN", "Cards AR"; website pbip 40 checks, 3 fail: the 54 design fixtures, the local download,
the Arabic download). Code done (`pbip-export.js`: `cardFit`, `cardObjects`, `cardFrame`, phone sizes; tooltip card):
MCP 77 PASS, pbip 40 PASS. `pbip-export.min.js?v=20260930g`, `theme-generator.min.js?v=20260930i` (its minified file
differs from before only in that version). Full run (laptop kept awake): all 16 website suites PASS (pbip 40,
design-engine 585 incl. the 60 project fixtures), `capture-design-fixtures.mjs --check` MATCH on the live and lab pages
(54 cases each), MCP 77 PASS; `scripts/tests/fixtures` and `design-engine.js` identical to main.
**Desktop check stopped on the first report (EN 1080):** titles and numbers whole, sizes as expected, numbers centred,
but the numbers show one more decimal than the legacy card (101.914K, expected 101.91K); details in
`scripts/tests/DESKTOP-TESTS.md`. **Owner's decision (2026-09-30):** keep the card visual's default number format
(automatic units, its own decimals: 101.914K); no `labelPrecision`, because forcing 2 decimals would show counts as
47.00. Expected result 5 changed accordingly (below). **Desktop check continued: all six reports PASS on items 1-6**
(item 4 on the three Arabic ones), DAX 101914 / 74675 / 23635 / 0.3377971 on all six (`scripts/tests/DESKTOP-TESTS.md`).
**Items 7 and 8 checked by the owner (stopped there):** 7 FAIL, the phone layout draws the KPI cards over the header
(page 1) and over the header and slicers (page 2): Desktop reads a grouped visual's phone position as a page position,
while `pbip-export.js` writes it relative to its group (existing phone layout code, not changed by this branch); the
phone card sizes themselves fit. 8 not confirmed: the owner's crop has no KPI card beside the hand-added card to compare
its size with. Details and his screenshots in `scripts/tests/DESKTOP-TESTS.md`. **Waiting for the owner:** whether
to fix the phone positions (here or on its own branch), and a screenshot for item 8 with a KPI card beside the new
card. The steps given to him for items 7 and 8, on "Gulf Sales Cards EN 1080":
- 7: View > Mobile layout. Expected: two cards per row, each title and number whole. Screenshot, then back to the page view.
- 8: click an empty spot of page 1, Visualizations > Card (the new card, not "Card (legacy)"), drag Total Sales into
  it. Expected: its number at the theme's callout size, the same size as the KPI numbers (42). Then File > Close
  **without saving** ("Don't save").
Not merged.
KPI cards, `card` slots and the tooltip card use the legacy `card` visual, which Microsoft deprecates; they move to
`cardVisual`. Plan written 2026-09-30 by the builder from Microsoft's powerbi-report-cli references `card.md`,
`card-part-02.md`, `card-part-03.md` (powerbi-authoring plugin 0.3.18) and the code on main `b925821`.

**What Microsoft's references say (and what the plan takes from them)**
- Role `Data` (`Fields`/`Values` leave the card empty). `value` and `label` sizes go in `objects` with
  `selector: { id: 'default' }`, or they are silently ignored.
- Compact recipe: `objects.padding.paddingUniform` 8, `objects.layout.paddingUniform` 0, container padding 8,
  `spacing.verticalSpacing` 2, `outline.show` false (the inner rectangle; it doesn't come from the theme).
- Height needed = container padding (top + bottom) + title (`ceil(1.5 × title size)`, when shown) + inner padding
  (top + bottom) + `ceil(1.5 × value)` (+ 2 + `ceil(1.5 × max(label, 12))` when the label is shown). Their
  minimum-height table (value 20 → 82 ... 45 → 120) assumes a label and no title.
- Theme: a `cardVisual` value takes `textClasses.callout.fontSize` and its label `textClasses.label.fontSize`; the
  container's border and shadow come from `visualStyles.cardVisual`. `outline`, `layout`, inner `padding` and
  `accentBar` don't cascade from a theme. If a visual sets any container property, it must set `padding` too, or
  Power BI resets it to about 5.
- Alignment: the card references only say `value` and `label` formatting covers "font, size, color, alignment"
  (card-part-03.md) and don't name the property. Microsoft's theme schema 2.157 (`visual-cardVisual`) names it:
  `value.horizontalAlignment` (and `label.horizontalAlignment`), one of `left` / `center` / `right`.
- Their font rule (value 12-28 by page height, fixed 8px paddings) is not used as it is: our theme already scales
  the callout with the page (42 at 1080, 60 at 2160), and fixed 8px paddings don't fit on 640 x 360 (see Sizes).

**Our cards keep their look:** the KPI name stays the bold container title (as today); the card's own label under the
number stays hidden (`label.show` false, today `categoryLabels.show` false), so no label height is budgeted. Every
card in a row hides it, so the row stays even (Microsoft's reason to always reserve it).

**Every place a card is written or read**
- `assets/js/pbip-export.js`: `TYPES` (`kpi` and `card` → `cardVisual`); `bindQuery` (`kpi`, `card`: role `Values` →
  `Data`); the slot visual (today `categoryLabels` off) → the card objects below; the tooltip card (today
  `labels.fontSize` 20 on `card`); the phone layout (`mobile.json`: KPI and card slots 157.5 x 100). `bindTitle`,
  groups, z and tab order are unchanged.
- One new helper in `pbip-export.js`, `cardFit(w, h, s, title, callout)`, used by all three. P = round(8 × s / 1.5)
  for the container and inner padding (s = page height / 720, so 8 at 1080 as in Microsoft's recipe);
  value = min(callout, the largest size whose height fits, the largest size where 7 characters ("101.91K") fit the
  width); if that is under 8, inner padding goes to 0 and it is worked out again. Title and callout sizes are read
  from the theme passed to `build` (`textClasses.title` / `callout`), falling back to Power BI's 12 / 28.
- What a card writes: `query` role `Data`; `objects`: `value` (fontSize, `horizontalAlignment` 'center', so the number stays centred as on the legacy card, in
  English and Arabic), `label` (show false; no alignment needed while hidden), `padding` (P or 0),
  `layout` (0), `outline` (show false), each with the `default` selector; `visualContainerObjects`: the same title,
  background, border, shadow and alt text as today, plus the title's `fontSize` (the theme's size, written so the
  height math doesn't depend on the theme), `padding` top/bottom/left/right P, `spacing` (`customizeSpacing` true,
  `spaceBelowTitleArea` 0, `verticalSpacing` 2).
- Phone: `mobile.json` 2.1.0 takes `objects` and `visualContainerObjects` overrides (checked in Microsoft's schema).
  The KPI cards get phone sizes there (title 10, value 20, padding 5), the same as the tooltip card, because 42
  doesn't fit in 157.5 x 100.
- Readers: `model-health-engine.js` finds report fields anywhere in the visual JSON and already names `cardVisual`
  "Card"; `pbip-bind.js` only uses `tip.card` as a key name; the MCP (`server.mjs`, `lib/`) passes slot kinds
  through. No change there.

**The theme: no change.** `buildTheme` already writes `visualStyles.cardVisual` (border and shadow, like every visual
type) and the text classes Microsoft's cascade uses for `cardVisual`'s value and label (callout `fs(28)`, label
`fs(10)`). The legacy `card` and `multiRowCard` entries stay, for visitors who still have legacy cards in their own
reports. So the theme JSON the website gives visitors is byte for byte the same, and **none of the 54 design fixtures
or 60 project fixtures change** (the project fixtures hold what the page gives `build()`: pages, slots, theme and
labels, none of which change). No recapture is needed. The proof: `design-engine`, `theme-generator` and
`capture-design-fixtures.mjs --check` pass unchanged. If the Desktop check shows that a hand-added `cardVisual`
doesn't follow the callout size, that gets reported and a theme change is planned separately.

**Sizes** (worked out with the rule above; page units; "need" is the height needed, at most the slot height)

| Page | Slot (layout) | Title | Callout | Padding | Value | Need |
|---|---|---|---|---|---|---|
| 1920 x 1080 | 454 x 144 (exec), 612 x 144 (focus) | 18 | 42 | 8 | 42 | 122 ≤ 144 |
| 1920 x 1080 | 507 x 126 (analysis), 297 x 126 (ops) | 18 | 42 | 8 | 42 | 122 ≤ 126 |
| 1920 x 1080 | height 96 (smallest `kpiH`, 64) | 18 | 42 | 8 | 24 | 95 ≤ 96 |
| 1280 x 720 | 96 (exec, focus) / 84 (analysis, ops) | 12 | 28 | 5 | 28 | 80 |
| 640 x 360 | 151 x 48 (exec), 204 x 48 (focus) | 8 | 14 | 3 | 14 | 45 ≤ 48 |
| 640 x 360 | 169 x 42 (analysis), 99 x 42 (ops) | 8 | 14 | 3 | 12 | 42 ≤ 42 |
| 640 x 360 | height 32 (smallest `kpiH`) | 8 | 14 | 3, inner 0 | 9 | 32 ≤ 32 |
| 3840 x 2160 | 909 x 288 (exec), 1014 x 252 (analysis) | 36 | 60 | 16 | 60 | 208 |
| 3840 x 2160 | height 192 (smallest `kpiH`) | 36 | 60 | 16 | 49 | 192 ≤ 192 |
| Tooltip page 320 x 240 | 296 x 76 | 10 | 20 (as today) | 5 | 20 | 65 ≤ 76 |
| Phone | 157.5 x 100 | 10 | 20 | 5 | 20 | 65 ≤ 100 |

At the default sizes the value keeps the size it has today (42 at 1080, 28 at 720); it only shrinks where the slot is
too short. All 391 KPI cards in the 54 design fixtures' project pages fit (9 page sizes, 640 x 360 to 3840 x 2160).

**Tests first (they fail on main, pass after)**
- MCP (`mcp/test.mjs`): every card in "Quality", "Table EN" and "Table AR" is `cardVisual` with role `Data`, value
  and label set with the `default` selector, `outline` off and container padding set, the value centred (`horizontalAlignment` 'center'), and no card is a
  legacy `card` or uses `Values`. The tooltip card: value 20 and both titles 10 (the existing check 2 changes from `labels` to
  `value`, as part of this move). 75 checks → about 78.
- Website (`scripts/tests/pbip.mjs`): the same checks on the downloaded project, plus a sweep over the 54 design
  fixtures: every card's height needed is at most its slot height, and its value is at least 8. Phone: every card's
  `mobile.json` has value 20 and title 10.
- Existing tests that expect legacy `card`: only the tooltip check above (`labels` 20D). `pbip.mjs` check 7 finds KPI
  cards by their bold title, which stays. No expected numbers change.
- Rebuild `pbip-export.min.js` and bump its `?v=` on both generator pages; all 16 website suites and `npm test` pass.

**Desktop check (Power BI Desktop 2.157; expected results written now, before the run)**
Six reports on the same model as "Gulf Sales AR 3", built by the MCP on this branch's code with `generate_theme`
(brand #0F4C5C, analogous, Tahoma), `plan_layout` and `create_report`: English exec (4 KPIs) and Arabic analysis
(3 KPIs, filters end), each at 1920 x 1080, 640 x 360 and 3840 x 2160 ("Gulf Sales Cards EN/AR 1080/360/2160").
Expected, on every page and the tooltip page:
1. Every KPI card and the tooltip card shows its title and its whole number: nothing cut at the top, bottom or
   sides, no "..." on the number.
2. The value sizes match the table: 42 (1080), 14 (EN 360) / 12 (AR 360), 60 (2160), 20 on the tooltip page.
3. No label under the number, no inner rectangle, and no card background over the page's panel (the panel comes
   from the background PNG, as today).
4. Arabic: the title is on the right and KPI 1 is the rightmost card (unchanged).
5. Values equal DAX (as on AR 3: 101914 / 74675 / 23635 / 0.33780); format = cardVisual's default (e.g. 101.914K).
   Changed by the owner after the first run (it expected the legacy card's 101.91K): the card visual's own format is
   kept, because forcing 2 decimals (`labelPrecision`) would show counts as 47.00.
6. The number is centred in every card, as in Gulf Sales AR 3 (English and Arabic); the KPI title keeps today's
   alignment (left in English, right in Arabic).
7. Phone layout (View > Mobile layout, EN 1080): two cards per row, title and number whole.
8. A `cardVisual` added by hand in Desktop to the EN 1080 page shows its value at 42 (the theme's callout), which
   proves the theme needs no change. It gets removed and the report closed without saving.
Screenshots of every page; results go into `scripts/tests/DESKTOP-TESTS.md`. Any failure: stop and report, no fix
without the owner's go.

**Built for the check (2026-09-30, before opening Desktop).** This session's `dataarcus` MCP started on
`fix/rtl-table`, so it still runs the old code; the reports were built by starting this branch's `mcp/server.mjs` over
stdio (as `mcp/test.mjs` does), root `C:\DataArcus\tests`, project `5-tmdl-sample` (model "Ramadan Test", as AR 3), with
`generate_theme` (Gulf Sales, #0F4C5C, analogous, Tahoma, ar/en; `phase2-try/cards-ar`, `cards-en`) → `plan_layout` →
`create_report`. EN: exec, 4 KPIs, no filters (page 2 "Details", analysis). AR: analysis, filters end (page 2
"نظرة عامة", exec). modelNotes on all six: Calendar[Month Name], Sales[Total Sales vs Last Ramadan %], Calendar[Day Name].
Expected per page, from the written files (every value centred; title left in EN, right in AR):

| Report | Page 1 cards: box, value, title | Page 2 cards | Tooltip |
|---|---|---|---|
| EN 1080 | 4 × 454 x 144, 42, 18 | 3 × 508 x 126, 42, 18 | 296 x 76, 20, 10 |
| EN 360 | 4 × 151 x 48, 14, 8 | 3 × 169 x 42, 12, 8 | same |
| EN 2160 | 4 × 909 x 288, 60, 36 | 3 × 1014 x 252, 60, 36 | same |
| AR 1080 | 3 × 508 x 126, 42, 18 | 4 × 454 x 144, 42, 18 | same |
| AR 360 | 3 × 169 x 42, 12, 8 | 4 × 151 x 48, 14, 8 | same |
| AR 2160 | 3 × 1014 x 252, 60, 36 | 4 × 909 x 288, 60, 36 | same |

KPI order in reading order: Total Sales, Total Sales Last Ramadan, Total Sales Last Ramadan (old), Total Sales vs Last
Ramadan % (the 4th on exec pages only); AR pages start on the right.

## Open items (flagged, need the owner's go before any work)
- **Phone layout overlaps** (found in the cards Desktop check, item 7): visuals inside a group (KPI cards, slicers,
  header) are written to `mobile.json` relative to their group, but Desktop's phone layout reads them as page
  positions, so the KPI cards land on the header and the slicers. Existing code in `pbip-export.js` (phone layout).
- **Small and large custom pages** (seen in the cards Desktop check, not cards): on 640 x 360 long KPI titles end in
  "...", the header title is cut at the bottom, slicer titles and Reset wrap; on 3840 x 2160 the rail's slicers are
  squashed to thin lines, the header's title, page buttons and logo text are small, Reset is cut. Screenshots in
  `tests/phase2-try/shots-cards/`.
- **Table header alignment** (seen on "Gulf Sales AR 3"): headers are left aligned while numbers are right aligned,
  so on a wide table each number sits nearer the next column's header than its own.
- **Mixed-language titles** in Arabic reports ("Total Sales حسب Quarter"): measure names come from the model.
- **Flaky tests on a busy laptop:** `consent` ("Berlin: no banner") and `anchors` (home page #contact) failed once
  each under load and pass alone. They don't use `ready()` yet (`scripts/tests/lib.mjs`).
- **Phase 3:** background PNGs from the engine's SVG (first test whether Power BI accepts the SVG itself).
- **Roadmap after that:** Arabic/right-to-left and Gulf DAX in a private repo, then packaging (`mcp/ROADMAP.md`).

## How to work (short)
- Plan first, wait for "go"; tests first; one writer on the repo at a time; branch → push → the reviewer tests and
  merges; never merge yourself. Keep the laptop awake during full runs.
