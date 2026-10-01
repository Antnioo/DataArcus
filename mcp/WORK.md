# Current work (the memory between sessions)

Read this first; update it as you go (rules in `mcp/CLAUDE.md`, "Keeping the memory"). Last updated 2026-10-01
by the builder: `fix/phone-and-sizes` round 3 (Reset, page buttons) approved; see "Next step" and the working notes.

## Where things stand
- **MCP: 6 tools** (`read_model`, `suggest_fields`, `check_model_health`, `generate_theme`, `plan_layout`,
  `create_report`), 77 checks in `npm test`; all 16 website suites pass.
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
- **Cards moved to `cardVisual`** (merged, `e22b346`; the plan and sizes table are in branch commit `6a7ecd3`'s
  WORK.md): KPI cards and the tooltip card use `cardVisual` with role `Data`, value and title sizes fitted to each card
  by `cardFit` in `pbip-export.js`, the number centred, label and inner outline off; phone sizes in `mobile.json`
  (title 10, value 20). The theme is unchanged (it already styles `cardVisual`) and no fixture changed. Microsoft's
  default number format is kept (101.914K; owner's decision, forcing decimals would show counts as 47.00). MCP 77
  checks, all 16 website suites pass. **Desktop 2.157: six reports PASS on items 1-6**; item 7 (phone) FAIL from the
  old phone-position bug (open item); item 8 skipped by the owner (a hand-added card following the theme is Power
  BI's own behaviour). `pbip-export.min.js?v=20260930g`, `theme-generator.min.js?v=20260930i`.
- **Website dropdowns fixed** (merged): the open list was white on white on every tool page; form fields now use
  `color-scheme: dark` with dark option colours (`assets/css/style.css`), checked on every tool page in `tools.mjs`.

## Next step: round 3 of `fix/phone-and-sizes` (Reset and page buttons), then the Desktop check of all eight reports
Branch `fix/phone-and-sizes` (from main `883ca2f`), pushed, not merged. Last updated 2026-10-01 by the builder.

**What the branch does (done, tested):**
- **Phone layout** (`pbip-export.js`): grouped visuals keep page positions in `mobile.json` (Power BI Desktop reads
  them as page positions, not relative to the group as in `visual.json`), so cards no longer land on the header.
- **Sizes made for 1920 x 1080 now follow the page** (`pbip-export.js`): header, page buttons, filter rails, slide-in
  panel scale with k = page height / 1080 (1920 x 1080 keeps its numbers); text 8-60pt; heights from what Power BI
  Desktop showed (measured 2026-10-01 on 2.157, identical on 2.158; `scripts/tests/DESKTOP-TESTS.md`): one-line text
  box 10 + 1.8 x pt, button text 2 + 1.6 x pt, Reset icon 2.25 x pt, dropdown slicer 16 + 4 x pt (`fitText`, `boxFit`).
- **Option (a), header and top-rail minimums** (`design-engine.js` `minOf` in `rangeOf`; `sizes()` passes the
  layout, read on every route; `theme-generator.js` passes the layout to the slider range): header hh >= 24 + 25 / s,
  top rail fh >= (16 + 4 x slicer pt + 20 x s / 1.5) / s (s = page height / 720). 640 x 360: hh 74, fh 110; 1920 x
  1080: hh from 44, fh from 64.
- **Fixtures:** only 6 design and their 6 project fixtures recaptured (`532e496`; `layout-exec/analysis/ops-960x720`,
  `layout-analysis/focus-1366x768`, `page-too-tall`): slot table Y and height, preview, background; the other 48 and 54
  byte for byte the old ones (proved; `meta.recaptured` names them).
- **Tests:** `scripts/tests/report-check.mjs` (`layoutProblems`: phone overlaps and sizes with the measured rules;
  `headerAndRail`: the guard), used by `pbip.mjs` (54 fixtures + 16 default layouts on 640 x 360 / 3840 x 2160, with and
  without the panel; guard 1920 x 1080 title 20, logo 14, page buttons 320, slicers 76, Reset 40; 1280 x 720 title 12,
  logo 10, page buttons 299, slicers 56, Reset 27, owner-confirmed) and `mcp/test.mjs` (5 "Sizes" reports); engine test
  in `design-engine.mjs` (saved hh 44 / fh 56 on 960 x 720 come back 49 / 70).
- **Last full run** (after `532e496`): all 16 website suites PASS (4969 checks), design fixtures MATCH on the live
  and lab pages (54 each), project fixtures MATCH (60), MCP 87 PASS. Versions: `design-engine.min.js?v=20261001a`,
  `theme-generator.min.js?v=20261001b`, `pbip-export.min.js?v=20261001b`.
- **1920 x 1080 differences from main:** phone positions; text sizes on page buttons (14) and buttons (15, the theme's
  label); three buttons grow to fit their 15pt text: Close 96 → 104 (slide-in panel), top-rail Reset 160 → 201 English,
  245 Arabic (top-rail slicers narrower). Everything else at 1080 identical apart from random ids.
- Commits: plan `6386930`, additions `1cfbbe6`, tests `3b11e3b`, code `945a03e`, round-2 tests `4317d46`, round-2 code
  `b1f3df0`, fixtures `532e496`, expected numbers for the eight reports `071faa1`, measurements on 2.158 `77b83fa`.

**Owner's decisions (2026-10-01):**
- Option (a) for header and rail minimums: done.
- **Go on round 3 for the Reset and the page buttons only:**
  - Reset: text on one line always (Power BI never wraps a button's text; measured); height
    `max(40 x page h / 1080, 2 + 1.6 x pt)`; the icon left out (`shapeType` blank) when text and icon don't both fit the
    width (the Arabic Reset in the 91-wide 640 x 360 rail: the icon grows with the height and covers the text).
  - Page buttons: the current page's button gets the same text size as the others (today only the default state is
    sized, so the selected one shows Power BI's smaller text). Confirm the state selector in Microsoft's button /
    page navigator references before coding.
- **No card measurement and no `cardFit` change in this branch:** the 640 x 360 cards are their own round (they are
  already cut on main). In this branch's Desktop check, cards cut at 640 x 360 count as a known open item, not a failure.

**Order from here:**
1. Tests first (failing on the current code): Reset one line (height rule, icon blank when it doesn't fit; the Arabic
   Reset at 640 x 360 has no icon), the selected page button has the text size. Commit, push.
2. Code in `pbip-export.js` only; rebuild `pbip-export.min.js`, bump its `?v=` in `theme-generator.js`, rebuild
   `theme-generator.min.js`, bump its `?v=` on both generator pages.
3. Full run, laptop kept awake: `npm test` in `mcp/`, all 16 website suites, `capture-design-fixtures.mjs --check`
   (live and lab) and `--project --check`. No fixture should change. Commit, push, update this file.
4. Rebuild the eight "Gulf Sales Fit" reports under new names (see the working notes), write their exact expected numbers
   here, commit and push before opening Desktop.
5. Desktop check of all eight (EN/AR 1080, 360, 2160, EN/AR 1080 top), items: header whole; slicers with title and
   dropdown box (2160: the slicer rule's check, 30pt in 152); Reset whole, one line, no icon over text; page buttons
   whole, the current one at the same size; 1080 as in the cards check; cards whole except the known 640 x 360 cut;
   values equal DAX (one query per report: 101914 / 74675 / 23635 / 0.3377971); then View > Mobile layout with the
   owner's clicks (EN and AR 1080, both pages): no overlaps. Every report ends with "Seen, not in scope" (rule 9).
6. Then the two `mcp/CLAUDE.md` notes: "Power BI facts": in `mobile.json`, visuals inside a group use page positions,
   not positions relative to the group as in `visual.json`; "The live loop": replace "(or `/mcp` → dataarcus →
   Restart)" with "The desktop app has no restart button: start a new session, or run the branch's mcp/server.mjs
   directly over stdio (as mcp/test.mjs does)."
Stop and report on any failure; no fix without the owner's go; don't merge.

**Round 3 progress:** state selector confirmed in Microsoft's references (formatting.md: pageNavigator `text` takes "default", "hover", "selected", "disabled"; the current page is "selected"); hover sized too, so a button doesn't change size under the mouse. Button text width for the icon check: 0.45 em per character (measured 0.40-0.41 for both Reset texts at 8pt in the m2 crops; layout widths keep 0.55, so nothing at 1080 moves); the icon taken as wide as the button is high (it reached the English text from about 32 high in 91). Tests written (`report-check.mjs`): button one line (height 2 + 1.6 x pt), text + icon + 6 fit the width, page buttons sized in all three states. Failing on the current code: MCP 87 checks, 5 fail (page buttons on all five reports; the 640 x 360 Reset, 28 high, in both languages); pbip 46 checks, 3 fail (sizes on 126 of 140 designs; both downloads: page buttons, and the top-rail Reset at 1080, 88 high, whose icon would cover its text). Code (`pbip-export.js`: `resetFit` for the side rail, top rail and slide-in panel, the top-rail Reset now one line high and centred in the rail; page buttons sized in default, hover and selected): MCP 87 PASS, pbip 46 PASS. `pbip-export.min.js?v=20261001c`, `theme-generator.min.js?v=20261001c` (its minified file differs only in that version). At 1920 x 1080 this changes: the top-rail Reset 88 high → 40 (centred), the page buttons' hover and selected text sizes; the side rail and Close are unchanged.

## Builder's working notes (for a fresh session)
- **Power BI Desktop is 2.158.1177** (Microsoft Store; it updated itself from 2.157.1354 on 2026-10-01). The bridge
  needs `PBI_DESKTOP_PATH = C:\Program Files\WindowsApps\Microsoft.MicrosoftPowerBIDesktop_2.158.1177.0_x64__8wekyb3d8bbwe\bin\PBIDesktop.exe`
  (if `powerbi-desktop open` says DESKTOP_EXE_NOT_FOUND, check `Get-AppxPackage *PowerBI*` for a newer version).
- **Reports for Desktop checks are built with this branch's `mcp/server.mjs` over stdio, never the session's
  dataarcus MCP** (it loads its code when the session starts and the desktop app can't restart it). Root
  `C:\DataArcus\tests`, project `5-tmdl-sample` (model "Ramadan Test"), same calls as the cards check: `generate_theme`
  (Gulf Sales, #0F4C5C, analogous, Tahoma, en/ar) → `plan_layout` → `create_report`.
- **`create_report` never overwrites:** new reports need new names (e.g. "Gulf Sales Fit2 ..."), and `generate_theme`
  a new folder.
- **Scripts** (outside the repo, `C:\DataArcus\tests\phase2-try\builder-scripts\`):
  - `fit-build.mjs`: builds the eight reports over stdio and prints each page's header, rail, card sizes and
    `layoutProblems` (rename the reports and theme folders inside before rebuilding). `sizes-build.mjs`,
    `cards-build.mjs`: the earlier rounds' builds.
  - `one-fit.ps1 -Report <name> -Tag <tag>`: closes the open Desktop report only if it is one of our test reports and
    has no unsaved changes, opens the report, one screenshot per page at 2x (`<tag>-p<n>.png`). `one-scale.ps1` the same
    with `-Scale`; `shot-only.ps1 -Scale 1` screenshots the report already open. `crops.ps1 -File -Out -Box x0,y0,x1,y1`
    (fractions) crops at full size.
  - `full-run2.ps1`: the full run with the laptop kept awake (`SetThreadExecutionState`). `capture-run.ps1`: captures
    fresh fixtures. `merge-fixtures.mjs`: merges only named cases from a fresh capture into the old fixture files and
    proves the rest byte for byte (it reads the old files from `fx-old\` there; take them from git). `cols.mjs`: which
    slot-table columns changed. `limits.cjs`: which designs can't fit the measured header and rail needs.
    `cmp1080.cjs`, `btn1080.cjs`: what changed at 1920 x 1080 compared with main's `pbip-export.js`.
  - `measure-build.cjs`, `measure2-build.cjs`, `measure3-build.cjs`: the measurement reports "Gulf Sales Measure",
    "Measure 2", "Measure 3" in `C:\DataArcus\tests\5-tmdl-sample\` (text boxes, slicers, Reset; cards, Reset in both
    languages, page buttons; cards on bigger pages).
- **Screenshots:** `C:\DataArcus\tests\phase2-try\shots-sizes\` (this branch; `fit-*`, `m2-*`, `m3-*`, `measure*`),
  `shots-cards\` (the cards check), `shots-ar3\`.
- **Judging:** capture each page at 1x and 2x and judge every PASS from full-size crops of each card, button and slicer,
  never from the scaled-down page (the 2x page view hid the cut 640 x 360 cards). The first capture right after `open`
  can be empty or before the data: retake after 15-20 s.
- **DAX per report:** Microsoft's Power BI Authoring MCP: `connection_operations` ListLocalInstances (check the window
  title is the test report) → Connect → `dax_query_operations` Execute with the connection name.
- **Close test reports without saving**; never close or touch any other Power BI window (work models).

## Open items (flagged, need the owner's go before any work)
- **Next round, after `fix/phone-and-sizes` (owner 2026-10-01; plan only, then "go"):**
  - **Arabic reports show English titles** ("Total Sales حسب Quarter", English KPI names, table headers, slicer titles):
    measure and column names come from the model. Plan: `create_report` takes optional display names per field; in
    an Arabic report, every field without an Arabic name is listed in the notes. No made-up translations.
  - **Days and months sort alphabetically** (Friday, Monday, ...; April, August, ...): `Calendar[Day Name]` and
    `Calendar[Month Name]` have no sort-by column (in `modelNotes` since "Gulf Sales AR 3"). Plan: a model health
    finding with a ready TMDL script that sets the sort column for day and month names, covering a week that starts on
    Saturday or Sunday. The model is still never changed without the user.
  - **Measures without a format string**, as model health findings: the % card shows 0.34 (Sales[Total Sales vs Last
    Ramadan %]); the table shows 101914 while the cards show 101.914K.
- **Small-page round, with the 640 x 360 cards (after the next round):**
  - **KPI cards cut at 640 x 360** (already on main): the numbers in the 42- and 48-high cards are cut at the bottom.
    Measured (2.158, `scripts/tests/DESKTOP-TESTS.md`): 8pt title / value 12 needs 48, value 14 needs 56 on 640 x 360,
    but 44 on 1920 x 1080 and 3840 x 2160; 42pt cards on 1080 need 88 (126 and 144 fine). No single rule fits yet:
    measure 1280 x 720, 960 x 720, 1366 x 768, 700 x 525, 2560 x 1440 and 640 x 360 again (steps of 2, the card as
    `cardFit` writes it there), then a rule by page size or a table; 1080 and up keep 42-60 (owner).
  - **Long KPI titles end in "..."** on 640 x 360 (8pt, Power BI's minimum).
  - **Charts on 640 x 360:** month and day labels slanted and cut ("Wednes..."); "Total Sales by Quarter" hides Q4
    behind a scrollbar.
  - **Detail table on 640 x 360:** shows two rows with scrollbars, and its fourth column is cut.
- **Table header alignment** (seen on "Gulf Sales AR 3"): headers are left aligned while numbers are right aligned,
  so on a wide table each number sits nearer the next column's header than its own. Stays as it is (owner).
- **Flaky tests on a busy laptop:** `consent` ("Berlin: no banner") and `anchors` (home page #contact) failed once
  each under load and pass alone. They don't use `ready()` yet (`scripts/tests/lib.mjs`).
- **Phase 3:** background PNGs from the engine's SVG (first test whether Power BI accepts the SVG itself).
- **Roadmap after that:** Arabic/right-to-left and Gulf DAX in a private repo, then packaging (`mcp/ROADMAP.md`).

## How to work (short)
- Plan first, wait for "go"; tests first; one writer on the repo at a time; branch → push → the reviewer tests and
  merges; never merge yourself. Keep the laptop awake during full runs.
