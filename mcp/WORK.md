# Current work (the memory between sessions)

Read this first; update it as you go (rules in `mcp/CLAUDE.md`, "Keeping the memory"). Last updated 2026-09-30
by the builder: the phone and page-size plan written on `fix/phone-and-sizes`, waiting for the owner's "go".

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

## Next step: build the phone and page-size fix (owner's "go" 2026-10-01 with three additions), branch `fix/phone-and-sizes`
Steps: (1) tests first, failing on main; (2) code, `pbip-export.js` only; (3) `.min.js` and `?v=`; (4) full run;
(5) the six Desktop reports built with this branch's `mcp/server.mjs` over stdio (the session's MCP runs old code and the
desktop app can't restart it), exact numbers written here first; (6) Desktop check; then the two `mcp/CLAUDE.md` notes.
Done so far: plan `6386930`, additions `1cfbbe6`. Tests written (`scripts/tests/report-check.mjs`: `layoutProblems`,
`headerAndRail`, used by `pbip.mjs` and `mcp/test.mjs`), failing on the current code for the expected reasons:
- website `pbip`: 46 checks, 5 fail: phone overlaps on all 140 designs (54 fixtures + 16 default layouts on 640 x 360
  and 3840 x 2160, each with and without the panel); sizes on 138 of 140 (page buttons and buttons have no text size;
  640 x 360 header title 12pt in a 16-high box; 3840 x 2160 slicers 76 high under 30pt text); the 1280 x 720 guard
  (nav 320, slicers 76, Reset 40; want 213, 51, 27; 1920 x 1080 passes); both downloads (phone overlaps, no sizes).
  The fixtures' own 640 x 360 designs use the tallest header (title 36 high), so the default layouts were added to
  the sweep to cover what Desktop showed.
- MCP: 87 checks, 10 fail: phone and sizes on "Sizes EN 1080", "Sizes EN/AR 360", "Sizes EN/AR 2160".

Code (`pbip-export.js` only: `fitText`, `pt`, the header, page buttons, both rails, the slide-in panel, and the phone
step removed): MCP 87 PASS, pbip 46 PASS. `pbip-export.min.js?v=20261001a`, `theme-generator.min.js?v=20261001a` (its
minified file differs from before only in that version).
**Differs from the plan's "1920 x 1080 output" line** (compared with main's `pbip-export.js` on all 30 fixtures at
1920 x 1080, with and without the panel): besides the phone positions and the text sizes (page buttons 14, buttons
15), three buttons grow to fit their 15pt text, by the plan's own rule ("or what its text needs"): Close 96 → 104
wide (slide-in panel), and on the top rail Reset 160 → 190 wide (English) and 160 → 234 (Arabic), so the top rail's
slicers get that much narrower (e.g. 556 → 546). The side rail (the MCP's reports, the Desktop check) is unchanged
at 1080. Everything else at 1080 is identical apart from random ids.
Code commit `945a03e`. Full run (laptop kept awake): all 16 website suites PASS (4965 checks; pbip 46, design-engine
585 incl. the 60 project fixtures), `capture-design-fixtures.mjs --check` MATCH on the live and lab pages (54 cases
each), MCP 87 PASS; `scripts/tests/fixtures` and `design-engine.js` identical to main. Next: the six Desktop reports.

**Owner's additions (2026-10-01):**
1. **1280 x 720 and every other page size.** Scaling with the page height changes every size except 1920 x 1080. From
   the engine's slots (exec layout, header on; page 2's rail for slicers and Reset; theme text sizes), today → planned:

| Page | Header title | Logo text | Page buttons (each, text) | Slicers (high, text) | Reset (high, text, lines) |
|---|---|---|---|---|---|
| 1920 x 1080 | 20 → 20 | 14 → 14 | 140 → 140, 14 | 76 → 76, 15 | 40 → 40, 15, 1 |
| 1280 x 720 | 13 → 13 | 10 → 10 | 140 → 93, 10 | 76 → 51, 10 | 40 → 27, 10, 1 |
| 700 x 525 | 12 → 10 | 10 → 8 | 140 → 108, 8 | 76 → 37, 8 | 40 → 19, 8, 1 |
| 2560 x 1440 | 27 → 27 | 19 → 19 | 140 → 187, 19 | 76 → 101, 20 | 40 → 53, 20, 1 |
| 640 x 360 | 12 → 8 | 10 → 8 | 140 → 105, 8 | 76 → 27, 8 | 40 → 28, 8, 2 |
| 3840 x 2160 | 28 → 40 | 24 → 29 | 140 → 280, 29 | 76 → 152, 30 | 40 → 80, 30, 1 |

   (Page and button text "today" is Power BI's own default, not set in the file.) Also scaled by k on every page but
   1920 x 1080: the gaps and paddings of the header, rail and slide-in panel, the top rail's Reset width, the Close and
   Filters buttons, the panel's header, padding and radius. Titles are whole numbers of points, like today. The size
   guard test checks 1280 x 720 as well as 1920 x 1080. Correction to section 2: Reset on 3840 x 2160 is 80 high
   (40 x 2), not 120.
2. **Phone fact**, after the Desktop check confirms the fix: add to `mcp/CLAUDE.md`, "Power BI facts learned the hard
   way": in `mobile.json`, visuals inside a group use page positions, not positions relative to the group as in
   `visual.json`.
3. **MCP restart note** in `mcp/CLAUDE.md`, "The live loop on this laptop": replace "(or `/mcp` → dataarcus → Restart)"
   with "The desktop app has no restart button: start a new session, or run the branch's mcp/server.mjs directly over
   stdio (as mcp/test.mjs does)."

Plan written 2026-10-01 by the builder from the code on main `883ca2f`, the cards Desktop check's screenshots
(`tests/phase2-try/shots-cards/`), Microsoft's `mobile.json` and `visualContainer` schemas (2.1.0) and Microsoft Learn's
mobile layout pages. The powerbi-authoring references say nothing about `mobile.json` or groups; the schemas describe
`position` the same way in both files ("between 0 and width of the containing page") and don't say whether a
grouped visual's phone position is relative to its group.

### 1. Phone layout overlaps
- **Cause:** `pbip-export.js`, phone layout (`// groups wrap their children on the phone as well`): after placing every
  visual on the 323-wide phone canvas in page positions, it moves each group's children to positions relative to the
  group (`p.x -= x0; p.y -= y0`), as the desktop `visual.json` does. Desktop's phone layout reads a grouped visual's
  `mobile.json` position as a page position (item 7 of the cards check: page 1's KPI cards, at y 0 and 108 inside a
  group at y 116, were drawn at page y 0 and 108, over the header).
- **Fix:** drop that step. Children keep their page positions on the phone; each group's own `mobile.json` stays the
  box around its children, in page positions. Nothing else in the phone layout changes (order, sizes, two cards per row).
- **If Desktop proves otherwise** (it reads the group's position and adds it: cards pushed down twice): stop and report;
  the other way (no `mobile.json` for groups) is then the next thing to try, with the owner's go.

### 2. Sizes on small and large pages (640 x 360, 3840 x 2160)
- **Cause:** in `pbip-export.js` the header, the page buttons, the filter rail and the slide-in panel use sizes fixed in
  page units, made on 1920 x 1080: gaps and paddings (24, 16, 10, 8), the slicer height cap 76, the Reset button 40,
  the top rail's Reset width cap 160, the page buttons 140 each, the Close button 96, the Filters button 120-180, the
  panel's header 44, padding 14/16 and radius 12; and font clamps that don't follow the page: header title 12-28
  (`Math.max(12, Math.min(28, h * 0.42))`), logo text 10-24, panel title 14. On 3840 x 2160 the slicers stay 76 high
  under 30pt theme text (squashed) and the title stops at 28; on 640 x 360 the title stays 12pt in a 16-high box (cut)
  and Reset keeps Power BI's own button text size (wraps). Buttons and page buttons have no text size of their own.
- **Fix, in shared code (`pbip-export.js`), the same rule as `cardFit`:** every fixed page-unit size is scaled by
  k = page height / 1080 (so 1920 x 1080 keeps today's numbers), and every text size follows the page with Power
  BI's limits 8-60 instead of fixed clamps; where the 8pt minimum makes text bigger than the scaled box (small
  pages), the box grows to fit the text inside its slot. Text fit uses Microsoft's card rule (a line takes 1.5 x the
  size) and 0.55 em per character for width, as `cardFit` does. One helper for all of it (`fitText`).
  - Header title: size = round(h x 0.42) within 8-60 (1080: 20, unchanged; 360: 8; 2160: 40). Logo text: round(h x 0.3)
    within 8-60 (1080: 14; 360: 8; 2160: 29).
  - Page buttons: text size round(h x 0.3) within 8-60, set on the navigator (1080: 14, today Power BI's default);
    each button max(140k, the width its longest page name needs: one line if the height holds one, else two);
    shown when they fit between title and logo (today: when 220 page units are free).
  - Filter rail (side): padding 10k, gap 8k; slicer height min(76k cap, room) but at least 2 lines of the theme's
    slicer text + 8k (1080: 76, unchanged; 360: 27; 2160: 152). Reset: text at the theme's label size (1080: 15,
    today Power BI's default), height max(40k, the lines its text needs + 12k) (1080: 40; 360: 28, two lines; 2160: 80).
  - Top rail: the same, Reset width min(160k, 14% of the rail) or what its text needs.
  - Slide-in panel (website download): padding 16k, header 44k, gap 10k, Close max(96k, its text), Filters button
    min(180k, max(120k, 3h)) or its text, panel title 14k within 8-60, radius 12k, panel padding 14/16/16/12 x k.
- **Not fixed, a limit of Power BI:** on 640 x 360 the theme's text is at Power BI's minimum 8pt, bigger than the
  layout scaled down, so KPI titles longer than their card (e.g. "Total Sales Last Ramadan (old)" in a 169-wide
  card) still end in "...". Numbers stay whole (`cardFit`).
- **Fixtures:** none change. They hold what the page gives `build()` (design, pages, slots, theme, labels); this
  changes only what `build()` writes. Proof: `design-engine`, `theme-generator` and `capture-design-fixtures.mjs --check`
  pass unchanged on both pages. The theme JSON doesn't change.
- **1920 x 1080 output:** the same as today except three added text sizes, each the size already shown: page buttons 14,
  Reset and Close 15 (the theme's label size), and the phone positions of grouped visuals.

### 3. Tests first (failing on main, passing after)
- **Phone** (MCP `mcp/test.mjs` on "Cards EN" / "Cards AR"; website `pbip.mjs` on the 54 design fixtures and both
  downloads): on every page, no two visuals' phone boxes overlap (groups left out; positions read as page positions,
  the way Desktop reads them), every box inside the 323-wide canvas, each group's phone box around its children.
  Fails on main: the KPI cards sit on the header.
- **Sizes** (`pbip.mjs` sweep over the 54 design fixtures, which include 640 x 360, 3840 x 2160, 700 x 525, 2560 x 1440;
  MCP reports at 360 and 2160): every text size within 8-60; the header title, logo text, page buttons, Reset, Close
  and Filters buttons: their text fits their box (lines x 1.5 x size in height, 0.55 em per character in width); slicers
  at least 2 lines of their text high; page buttons between title and logo. Fails on main on 640 x 360 (title 12 in a
  16-high box) and 3840 x 2160 (slicers 76 under 30pt text).
- **1920 x 1080 and 1280 x 720 guard:** 1080: header title 20, logo 14, slicers 76, Reset 40, page buttons 140 each, as today; 720: title 13, logo 10, slicers 51, Reset 27, page buttons 93 each (addition 1).
- Existing tests: none expect the old numbers except by building at 1920 x 1080; none change.
- Rebuild `pbip-export.min.js`, bump `?v=` (`theme-generator.js` and both generator pages); all 16 website suites,
  the fixture check on both pages and `npm test` pass, laptop kept awake.

### 4. Desktop check (Power BI Desktop 2.157; expected results written now, exact numbers added from the built files
before opening Desktop)
Six reports built by this branch's `mcp/server.mjs` over stdio (as for the cards check), same calls as the cards check:
"Gulf Sales Sizes EN/AR 1080/360/2160" (EN exec 4 KPIs, AR analysis filters end). One screenshot per page, one DAX
query per report. Expected:
1. **Header, every page:** the title "Gulf Sales" whole on one line; the page buttons whole (each page name readable,
   no "..." or cut letters); the logo text whole. 2160: title and buttons in proportion to the page (not small).
2. **Filter rail:** each slicer shows its title and its dropdown box (not squashed to a line); Reset shows its icon and
   its whole text (one line at 1080 and 2160, up to two at 360).
3. **1920 x 1080:** looks as in the cards check (`shots-cards/en1080-*`, `ar1080-*`), apart from the page button and
   Reset text sizes (at most a point different).
4. **Cards:** as in the cards check (numbers whole and centred; on 360 long KPI titles may end in "...", the known limit).
5. **Values equal DAX** (101914 / 74675 / 23635 / 0.3377971), cardVisual's default format.
6. **Phone layout** (View > Mobile layout; needs the owner's clicks), EN 1080 and AR 1080, both pages: no visual on
   top of another; header, slicers, Reset and cards in reading order, each title, slicer and button whole.
Any failure: stop and report, no fix without the owner's go.

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
