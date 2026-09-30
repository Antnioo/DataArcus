# Current work (the memory between sessions)

Read this first; update it as you go (rules in `mcp/CLAUDE.md`, "Keeping the memory"). Last updated 2026-09-30
by the builder, main at `9eeb02c`; branch `fix/report-quality` verified in Desktop, waiting for the reviewer's merge.

## Where things stand
- **MCP: 6 tools** (`read_model`, `suggest_fields`, `check_model_health`, `generate_theme`, `plan_layout`,
  `create_report`).
- **Phase 2 (design engine in the MCP): built and merged.** `generate_theme` and `plan_layout` reproduce the website
  byte for byte on all 54 design fixtures; `create_report` builds the website's project download from a design
  (60 project fixtures). Details: `mcp/PHASE2-SPEC.md`.
- **Phase 2 Desktop check (2026-09-30, `scripts/tests/DESKTOP-TESTS.md`):** "Gulf Sales AR" layout on both pages
  PASS, all 4 KPI cards equal DAX. Found: the Reset button drew only its icon; the tooltip page cut off the card
  value and truncated the chart title; the logo placeholder was tiny and faint; charts "by Amount"/"by Date" and a
  slicer on Amount; months A to Z and a % shown as 0.34 (the model's own settings).
- **All of these are fixed on branch `fix/report-quality`** (reviewer, owner's go), tested, not merged yet:
  1. **Buttons** (`assets/js/pbip-export.js`, `def()`): a button's "show" switch now sits on its own and the look in
     the default state, the way Desktop saves buttons (Microsoft's powerbi-report-cli button reference). Before,
     "show" was inside the state and Desktop ignored it: text, fill and outline stayed hidden. Fixes every button
     the writer makes (Reset, Filters, Close, panel Reset), for the MCP and the website's project download.
  2. **Tooltip page**: the card value gets its own size (20) and both titles 10; the theme's sizes are made for the
     full page (42pt callout), too big for 320 x 240.
  3. **Logo placeholder**: sized to the header slot (14pt at 48 high, 10 to 24) and stronger contrast.
  4. **Field choice** (`assets/js/pbip-bind.js`): TMDL columns with no type are 'unknown', never guessed as text;
     categories must be text or an unknown whose name reads as a category (not a number, date or key); with no
     category outside the date table, the date table's named parts (Quarter, Day Name, Month Name). Ramadan Test now
     gets: time axis Month Name, breakdown Quarter, comparison Day Name, slicers Year, Quarter, Day Name.
  5. **Model notes** (`mcp/server.mjs`, `modelNotes`): `create_report` returns `modelNotes` for the fields it uses:
     a month name without a sort-by column, a percentage-looking measure without a format string, each with the fix
     in Desktop. The model is never changed.
  Tests: 8 new MCP checks, all failing on the old code and passing now (72 in total); all 16 website suites pass on
  Linux. Minified files rebuilt; `pbip-export.min.js?v=20260930e`, `pbip-bind.min.js?v=20260930h`,
  `theme-generator.min.js?v=20260930g`.
- **Desktop check of the fixes (builder, 2026-09-30): all 8 checks PASS** on "Gulf Sales AR 2" (Desktop 2.157):
  Reset text/fill/outline, page buttons, tooltip card and titles, logo 14pt, fields (no Amount/Date), `modelNotes`
  (the two expected), positions, KPI values = DAX. Details in `scripts/tests/DESKTOP-TESTS.md`.

## Next step: the reviewer merges `fix/report-quality`
Desktop verification done (below, kept for the record). Then the cardVisual plan ("After that").

### Done: verify the fixes in Power BI Desktop (builder)
Branch `fix/report-quality` (pushed by the reviewer). Don't change code; if something fails, stop and report.
1. `git fetch origin && git checkout fix/report-quality && git pull`. Restart the dataarcus MCP (`/mcp` → dataarcus →
   Restart, or a new session) so the session tools run the fixed code.
2. Rebuild the Arabic report with the fixed code: `generate_theme` (brand #0F4C5C, harmony analogous, name
   "Gulf Sales", lang ar, font Tahoma, folder tests/phase2-try) → `plan_layout` (layout analysis, filters end,
   lang ar) → `create_report` (that design, lang ar, name "Gulf Sales AR 2", on tests/5-tmdl-sample).
   Report its `modelNotes`.
3. Open it in Power BI Desktop, screenshot each page (one at a time, close capture windows), and look.
4. Expected (written before the run):
   - Reset button: text "إعادة ضبط الفلاتر" visible, with its fill and outline (not only the icon).
   - Page buttons: text visible.
   - Tooltip page "تلميح": the card value fully visible (20pt), both titles readable, not cut off.
   - Logo placeholder "شعارك": readable (14pt).
   - Fields: time axis Month Name; breakdown by Quarter; comparison by Day Name; slicers Year, Quarter, Day Name;
     no chart or slicer on Amount or Sales[Date].
   - `modelNotes`: Calendar[Month Name] (no sort-by column) and Sales[Total Sales vs Last Ramadan %] (no format).
   - Positions unchanged from the first check (page 1: KPI 1 1388,105,508,126; filter rail 24,105,294,951; page 2:
     KPI 1 1442,105,454,144; see DESKTOP-TESTS.md).
   - KPI values still equal DAX (Total Sales 101914).
   Report expected / seen / PASS or FAIL for each, and send the screenshots.
5. Add the results to `scripts/tests/DESKTOP-TESTS.md` on the same branch, update this file, commit, push, don't
   merge. Close Desktop without saving.

## After that: move the cards to `cardVisual` (owner approved the move 2026-09-30; plan first, wait for "go")
KPI cards and the tooltip card use the legacy `card` visual, which Microsoft deprecates; move them to `cardVisual`.
Plan only, on a new branch `feat/card-visual` from main after `fix/report-quality` is merged. The plan must cover:
- **Sources to read first:** Microsoft's powerbi-report-cli skill references `card.md` and `card-part-02.md` (on this
  laptop in the powerbi-authoring plugin): data role `Data` (not `Values`), `objects.value/label.fontSize` with the
  `default` selector, the padding recipe and the minimum heights per value size, and how the theme styles
  `cardVisual` (`visualStyles.cardVisual`, `textClasses.callout`).
- **Every place a card is written:** `pbip-export.js` (KPI slots, `card` slots, the tooltip card, and the phone
  layout), and what reads them back (tests, `tmdl`/bind code if any).
- **The theme:** `design-engine.js` `buildTheme` styles `card`; `cardVisual` needs its own styling (value and label
  sizes, padding, borders/shadow as the other visuals). This changes the theme JSON the website gives visitors, so
  the 54 design fixtures and 60 project fixtures change: list exactly which fields change, recapture only with the
  owner's go, and prove nothing else changed.
- **Sizes:** check each layout's KPI heights (e.g. 126 and 144 at 1920 x 1080, and at 640 x 360 and 3840 x 2160)
  against the minimum heights for the value size, and the tooltip card (296 x 76).
- **Tests first** (failing before): MCP and website (pbip) checks that cards are `cardVisual` with role `Data`, value
  and label sizes set, and no legacy `card` left; existing tests that expect legacy `card` are changed only as part
  of this approved move and listed.
- **Desktop check, expected results written before the run:** every KPI card and the tooltip card fully visible
  (value and label, no clipping) on 1920 x 1080, 640 x 360 and 3840 x 2160, English and Arabic; values equal DAX.

## Open items (flagged, need the owner's go before any work)
- **Mixed-language titles** in Arabic reports ("Total Sales حسب Quarter"): measure names come from the model.
- **Flaky tests on a busy laptop:** `consent` ("Berlin: no banner") and `anchors` (home page #contact) failed once
  each under load and pass alone. They don't use `ready()` yet (`scripts/tests/lib.mjs`).
- **Phase 3:** background PNGs from the engine's SVG (first test whether Power BI accepts the SVG itself).
- **Roadmap after that:** Arabic/right-to-left and Gulf DAX in a private repo, then packaging (`mcp/ROADMAP.md`).

## How to work (short)
- Plan first, wait for "go"; tests first; one writer on the repo at a time; branch → push → the reviewer tests and
  merges; never merge yourself. Keep the laptop awake during full runs.
