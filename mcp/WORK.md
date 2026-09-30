# Current work (the memory between sessions)

Read this first; update it as you go (rules in `mcp/CLAUDE.md`, "Keeping the memory"). Last updated 2026-09-30
by the reviewer: `fix/rtl-table` and `fix/dropdown-colors` merged into main.

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

## Next step: plan the move of the cards to `cardVisual` (owner approved the move 2026-09-30; plan first, wait for "go")
KPI cards and the tooltip card use the legacy `card` visual, which Microsoft deprecates; move them to `cardVisual`.
Plan only, on a new branch `feat/card-visual` from main. Write the plan and its expected results into this file
(commit and push) before any code changes, then report and wait for "go". The plan must cover:
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
