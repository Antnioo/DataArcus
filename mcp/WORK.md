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

## Next step: the owner's "go" on the round 3 plan (below), branch `fix/phone-and-sizes`
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
each), MCP 87 PASS; `scripts/tests/fixtures` and `design-engine.js` identical to main (`b978f4a`).

**Desktop reports built (2026-10-01, before opening Desktop)** with this branch's `mcp/server.mjs` over stdio, root
`C:\DataArcus\tests`, project `5-tmdl-sample` (model "Ramadan Test"), same calls as the cards check: `generate_theme`
(Gulf Sales, #0F4C5C, analogous, Tahoma; `phase2-try/sizes-en`, `sizes-ar`) → `plan_layout` (EN exec, 4 KPIs, no
filters; AR analysis, filters end) → `create_report`. `layoutProblems` finds nothing on all six; modelNotes on all six:
Calendar[Month Name], Sales[Total Sales vs Last Ramadan %], Calendar[Day Name]. From the written files (page units):

| Report | Header (every page): title, logo text, page buttons | Rail page: slicers, Reset | Cards (value) | Tooltip |
|---|---|---|---|---|
| EN 1080 | 20pt in 840x48; 14pt in 225x48; 14pt in 320x48 | 3 × 274x76; "Reset filters" 15pt in 274x40 | 454-455x144 (42), 507-509x126 (42) | 296x76 (20) |
| EN 360 | 8pt in 280x16; 8pt in 75x16; 8pt in 224x16 | 3 × 91x27; 8pt in 91x28 | 151-152x48 (14), 169-170x42 (12) | same |
| EN 2160 | 40pt in 1680x96; 29pt in 450x96; 29pt in 640x96 | 3 × 548x152; 30pt in 548x80 | 909x288 (60), 1014-1017x252 (60) | same |
| AR 1080 | as EN 1080 | 3 × 274x76; "إعادة ضبط الفلاتر" 15pt in 274x40 | as EN 1080 | same |
| AR 360 | 8pt in 280x16; 8pt in 75x16; 8pt in 130x16 | 3 × 91x27; 8pt in 91x28 | as EN 360 | same |
| AR 2160 | as EN 2160 | 3 × 548x152; 30pt in 548x80 | as EN 2160 | same |

(EN pages: "Executive summary", "Details"; AR: "تحليل", "نظرة عامة". On the EN reports the rail is on page 2, on the
AR ones on page 1.) Screenshots go to `C:\DataArcus\tests\phase2-try\shots-sizes\`.

**Desktop check stopped on the second report (EN 360):** EN 1080 PASS on items 1-5. EN 360 FAIL on item 1 (the title
"Gulf Sales" and "Your logo", 8pt in 16-high text boxes, are cut at the bottom and show a scroll thumb; the page buttons
are whole) and item 2 (the 27-high slicers show only their titles, no dropdown box; Reset is whole); cards and DAX
pass. Cause: `fitText`'s 1.5 x line height and the two-line slicer minimum are estimates that are too small for a text
box and a dropdown slicer on the smallest page; the tests use the same estimates. Details in
`scripts/tests/DESKTOP-TESTS.md`. The CLAUDE.md notes (additions 2 and 3) wait for a passing phone check. Not merged.

### Round 2 plan (owner 2026-10-01: measure first, plan only; waiting for "go")
**Measured in Desktop 2.157** (test report "Gulf Sales Measure", closed without saving; `scripts/tests/DESKTOP-TESTS.md`,
2026-10-01), smallest heights that show the visual whole, page units, the same on 640 x 360 and 1920 x 1080:
one-line text box 8pt 24, 18pt 42, 20pt 44; dropdown slicer (title and box) 8pt 48, 15pt 76; Reset (icon and text,
one line) 8pt 18 (text alone from 14), 15pt text from 24. Page buttons (no icon) were whole at 8pt in 16 (EN 360)
and two lines of 14pt in 48 (EN 1080).

**1. Units and the fit rules** (`pbip-export.js`, `fitText`): `lineOf` takes the point size as page pixels (1.5 x pt),
while `charW` converts points (4/3). The heights become the measured rules, in page units:
- text box (header title, logo text, panel title): 10 + 1.8 x pt per line (4/3 to pixels x a line of about 1.35,
  plus about 5 of padding top and bottom): 8pt 25, 18pt 43, 20pt 46;
- button text (page buttons, Filters, Close; no icon): 2 + 1.6 x pt per line (8pt 15, two lines of 14pt 47);
- Reset (with its icon): at least 2.25 x pt as well (8pt 18, 15pt 34);
- dropdown slicer: 16 + 4 x pt (8pt 48, 15pt 76).
Width stays 0.55 em per character, converted (on the safe side: "Reset filters" fitted 91 at 8pt). `cardFit` stays
as it is: every card passed in Desktop on all six cards-check reports and on EN 360 here. The tests
(`scripts/tests/report-check.mjs`) take the same measured rules, so they fail on the current code first (640 x 360:
title 8pt in 16 < 25, slicers 27 < 48).
- **Expected numbers that change** (the guard, owner please confirm): 1920 x 1080 stays title 20, logo 14, page
  buttons 320, slicers 76, Reset 40. 1280 x 720 becomes title 12 (was planned 13: 13pt needs 34 > 32), logo 10, page
  buttons 299 (two lines of 10pt need 34 > 32, so one line, 136 each; was planned 213), slicers 56 (10pt needs 56;
  was 51), Reset 27.

**2. Header and rail limits** (from `design-engine.js`, not `pbip-export.js`): the header title box is (hh - 24) x s
high, the top rail fh x s, the side rail what is left under the header. With the measured rules, the smallest that
fit (design units; engine ranges hh 44-96, default 56; fh 56-120, default 72):

| Page | hh at least | fh at least (slicer text) |
|---|---|---|
| 1920 x 1080 | 41 | 64 (15pt) |
| 1280 x 720, 960 x 720 | 49 | 70 (10pt) |
| 1366 x 768 | 48 | 68 (10.5pt) |
| 700 x 525 | 59 | 80 (8pt) |
| 640 x 360 | 74 | 110 (8pt) |
| 2560 x 1440 / 3840 x 2160 / 3840 x 1600 | 37 / 33 / 36 | 62 / 59 / 61 |

The side rail fits on every page size. So today's layout can't fit the header text on 640 x 360 and 700 x 525 with
the default header (56), nor on any page up to 1366 x 768 with the smallest header (44); the top rail doesn't fit
on pages up to 1366 x 768 with its smallest height (56), nor on 640 x 360 / 700 x 525 with the default (72), nor on
1920 x 1080 below 64. In the fixtures: 6 of 54 designs don't fit (`layout-exec-960x720`, `layout-analysis-960x720`,
`layout-ops-960x720`: header 20 < 25; `layout-analysis-1366x768`, `layout-focus-1366x768`: header 21 < 25 and top
rail 60 < 73; `page-too-tall` (700 x 525): header 23 < 25).
- **Option (a): minimum header and rail heights in the design engine.** `sizes()` raises hh and fh to the page's
  minimum above (hh >= 24 + 25 / s; fh >= (16 + 4 x slicer pt + 20 x page h / 1080) / s), and the generator's sliders
  start there (`rangeOf`). Cost: a change to the shared engine the website runs; the 6 design fixtures above and the
  same 6 project fixtures change (their slots: the header or rail taller, the rows below shorter), recaptured with
  the owner's go, the other 48 + 54 stay byte for byte; the slot table and preview change on those pages; a new
  engine test. Every report then fits on every page size.
- **Option (b): a warning below the limits.** The Theme Generator shows a note under the layout controls, and
  `plan_layout` returns a `warnings` entry, when the page, header or rail is below the minimum above. Cost: smaller (no
  fixture changes, a text in both languages, two tests), but the reports on those pages stay cut: text can't go below
  8pt, so nothing in `pbip-export.js` can make it fit.
- **Recommendation: (a)**, because it fixes the cause where it is (the engine's slot sizes), keeps 48 of 54 designs
  and 54 of 60 projects identical, and leaves no page size that gives a broken report. (b) only names the problem.

**3. Top rail at 1920 x 1080** (Reset grew from 160 to 190 English / 234 Arabic for its 15pt text): two more Desktop
reports, "Gulf Sales Sizes EN 1080 top" and "AR 1080 top" (analysis, filters top). Expected: Reset whole on one line
(190 / 234 wide, 15pt), the three slicers whole (rail 108 high, slicers 88 >= 76), page and cards as in the cards check.

**Owner's "go" on round 2 with option (a) (2026-10-01)**, the 1280 x 720 guard confirmed (title 12, page buttons 299 on
one line, slicers 56, Reset 27), with three additions: the 3840 x 2160 reports (30pt slicers, 136 needed in 152) are
the slicer rule's check (if they fail: stop and measure again, don't adjust the rule); every route goes through
`sizes()` (sliders, saved designs, shared links, `plan_layout`), with an engine test; recapture only the 6 design and
6 project fixtures, on both pages, prove the other 48 and 54 unchanged and list the changed fields.
- Routes checked: the slots, slot table, preview, background SVG, slide-in panel, `projectPages`, and the MCP's
  `plan_layout` / `create_report` all read hh and fh through `sizes()`; saved designs keep the raw value
  (`repairState`) and `sizes()` clamps it on every read; the generator has no share links. The slider's range
  (`rangeOf`) is the one place without the page: `theme-generator.js` passes only the page width, so it gets the layout
  too (one line in `theme-generator.js`, beyond the two files named, needed for "the sliders start there").
- Round 2 tests (failing on the current code): `report-check.mjs` takes the measured rules; the 1280 x 720 guard the
  confirmed numbers; `design-engine.mjs` a new engine test (saved hh 44 / fh 56 on 960 x 720 come back 49 / 70 through
  `sizes`, the slots and the slider range; 1920 x 1080 from 44 / 64; 640 x 360 defaults 74 / 110). Results: pbip 46
  checks, 2 fail (sizes on 52 of 140 designs, the 1280 x 720 guard); design-engine 589 checks, 4 fail (the new test);
  MCP 87 checks, 2 fail ("Sizes EN 360", "Sizes AR 360": 8pt header text in 16, slicers 27 < 48).

- Code `b1f3df0`: `pbip-export.js` (measured rules in `fitText`, `boxFit`, slicer and Reset heights),
  `design-engine.js` (`minOf` in `rangeOf`, `sizes` passes the layout), `theme-generator.js` (the slider range gets
  the layout). `design-engine.min.js?v=20261001a`, `theme-generator.min.js?v=20261001b`, `pbip-export.min.js?v=20261001b`.
  After the code: pbip 46 PASS, MCP fails only "plan_layout parity: 48 of 54" (the six), design-engine fails only the
  six cases (slot table, background, project pages) and the page comparisons for them; the new engine test passes.
- Fixtures: the six recaptured (designs from the live page, projects from the lab page), merged into the old files so
  only they change (`meta.recaptured` names them). Proof: the other 48 design cases and 54 project cases are byte for
  byte the old entries and blobs; the fresh capture of those others equals the old; the merged files equal the fresh
  capture case by case. What changed in the six: the slot table's Y and height columns only (title and logo 20/21/23 →
  25; the rows below move down by 5/4/2, the side rail 5 shorter, the 1366 x 768 top rail 60 → 73), the preview and the
  background SVG drawn from them, and in the project fixtures the pages' slot y/h and the slide-in panel's y/h and the
  background PNGs; theme, saved design and file name unchanged.

- Full run after the recapture (laptop kept awake): all 16 website suites PASS (4969 checks; design-engine 589),
  `capture-design-fixtures.mjs --check` MATCH on the live and lab pages (54 each), `--project --check` MATCH (60),
  MCP 87 PASS.

**Desktop reports, round 2 (built 2026-10-01, before opening Desktop)** with this branch's `mcp/server.mjs` over stdio,
same calls as before, named "Gulf Sales Fit ..." (the round-1 "Gulf Sales Sizes" reports stay as they were; the MCP
never overwrites): EN exec / AR analysis (filters end) at 1080, 360, 2160, and "EN/AR 1080 top" (analysis, filters
top). `layoutProblems` finds nothing on all eight; modelNotes the same three on all. From the written files:

| Report | Header: title, logo text, page buttons | Rail: slicers, Reset | Cards (value) |
|---|---|---|---|
| EN 1080 / AR 1080 | 20pt in 840x48; 14pt in 225x48; 14pt in 320x48 | 3 × 274x76; 15pt in 274x40 | 454-455x144, 507-509x126 (42) |
| EN 360 / AR 360 | 8pt in 280x25; 8pt in 75x25; 8pt in 225x25 (AR 131x25) | 3 × 91x48; 8pt in 91x28 | 151-152x48 (14), 169-170x42 (12) |
| EN 2160 / AR 2160 | 40pt in 1680x96; 29pt in 450x96; 29pt in 640x96 | 3 × 548x152 (30pt, 136 needed); 30pt in 548x80 | 909x288, 1014-1017x252 (60) |
| EN 1080 top | as EN 1080 | top rail: 3 × 542x88; "Reset filters" 15pt in 201x88 | 612x126 (42), page 2 454-455x144 |
| AR 1080 top | as EN 1080 | top rail: 3 × 528x88; "إعادة ضبط الفلاتر" 15pt in 245x88 | as EN 1080 top |

Tooltip card 296x76 (20) on all. The top rail's Reset is 201 / 245 wide (not 190 / 234 as in the round-1 plan): its
icon now takes the measured 2.25 x pt. Expected in Desktop (items 1-6 of the plan, plus the top rail): header title,
logo text and page buttons whole; slicers show title and dropdown box (on 2160 the slicer rule's check: 30pt in 152);
Reset whole; 1080 as in the cards check; cards whole; values equal DAX; phone layout without overlaps (owner's clicks).
Screenshots in `C:\DataArcus\tests\phase2-try\shots-sizes\` (`fit-*.png`).
**Desktop check not started (2026-10-01):** Power BI Desktop updated itself from 2.157.1354 to 2.158.1177 (Microsoft
Store) since the last run, so `powerbi-desktop open` stopped with DESKTOP_EXE_NOT_FOUND at the old path; nothing was
opened or captured. The measurements and every earlier Desktop check were on 2.157.
**Owner: re-measure on 2.158 first.** Done: the measurement report's screenshots on 2.158.1177 are byte for byte the
2.157 ones, so the check went on, on 2.158. **Stopped on the second report:** EN 360 PASS (header, slicers with
their boxes, Reset, cards, DAX); AR 360 FAIL on item 2: the Arabic Reset "إعادة ضبط الفلاتر" (91x28, 8pt) is drawn on one
line with the icon over its last letters; the plan's rule sized it for two lines, but Desktop didn't wrap it (at 40
high in the cards check it did). Button text wrapping wasn't measured (the measurement report had only the English
Reset). Header, slicers and DAX on AR 360 pass. **Cards on 640 x 360 also FAIL** (owner's screenshot: the numbers in
the 169x42 cards are cut at the bottom; the bridge's 2x screenshots hid it, so my PASS on 360 cards here, in round 1
and in the cards check was wrong): `cardFit` counts a line as 1.5 x pt, the measured line is about 1.8 x pt plus
padding. Details in `scripts/tests/DESKTOP-TESTS.md`. **Waiting for the owner:** (1) measure button text wrapping
(the Arabic Reset at heights 28-44) and fix the Reset rule; (2) give `cardFit` the measured line rule (cost: on 1920 x
1080 the 126-high KPI cards' value would drop from 42 to 33 (the 144-high ones keep 42), unless the card heights grow). The CLAUDE.md notes
wait for a passing phone check. Not merged.

### Round 3 (owner 2026-10-01: neither option; one measurement pass on 2.158, plan only, waiting for "go")
Owner: the 126-high cards at 1080 showed 42pt whole, so the text-box rule doesn't describe `cardVisual`; don't shrink
them. Measure cards, Reset and page buttons; derive rules that match every Desktop result; judge every PASS from
full-size crops, never from the scaled-down page. AR 360 closed without saving first.

**Measured** (Power BI Desktop 2.158.1177; "Gulf Sales Measure 2" and "Measure 3", closed without saving; 1x and 2x
captures, full-size crops; `scripts/tests/DESKTOP-TESTS.md`, 2026-10-01, page units):
- Cards, the number whole from: 8pt title / padding 3 / value 12: 48 on 640 x 360 (44 touching), 44 on 1920 x 1080 and
  3840 x 2160; same with value 14: 56 on 640 x 360 (52 touching, 48 cut), 44 on 1080 and 2160; 18pt title / padding
  8 / value 42 on 1080: 88 (84 touching; whole at every height 88-144). So: the exported 640 x 360 cards (42 and 48
  high) are cut, as the owner saw; the 1080 cards (126, 144) are whole with room.
- Reset: the text never wraps; the icon grows with the button's height and is drawn at the start. English 8pt in 91:
  the icon reaches the text from about 32 high; Arabic 8pt in 91: the text is wider than the room beside the icon, so
  the icon covers its end at every height (18-44). 15pt in 260: cut at 18-22, whole from 24, icon clear up to 48.
- Page buttons: whole at every height 30-56 (14pt, about 200 each); the text wraps when a button is narrow. The current
  page's button shows Power BI's smaller default text: the export sizes the default state only.

**What the measurements settle:**
1. **Reset** (`pbip-export.js`, no fixtures): one line always (Power BI doesn't wrap a button's text), so the height is
   one line, not two: max(40k, 2 + 1.6 x pt), which keeps today's 40 at 1080 and makes the icon small on small pages
   (8pt: 18 at least, measured whole). Width: text + icon must fit; where they don't (the Arabic Reset in a 91-wide rail),
   the icon is left out (`shapeType` blank) rather than drawn over the text. The test checks one line, not wrapping.
2. **Page buttons** (`pbip-export.js`, no fixtures): the same text size also for the selected state (the page you're
   on), so it doesn't fall back to Power BI's default. (The selector for that state to be confirmed in Microsoft's
   button references before coding.)
3. **Header text boxes and slicers**: the round-2 rules stand (measured, and EN/AR 360 headers and slicers passed).

**What they don't settle yet: a card rule.** No single rule in points fits every row: a 42pt card needs 88 (2.1 x its
value), the small cards 44-56 (3.1-4 x theirs), and the same small card needs more on the 640 x 360 page than on 1080 or
2160. With only three page sizes measured, a rule fitted now would be a guess on 1280 x 720, 960 x 720, 1366 x 768,
700 x 525 and 2560 x 1440. **Proposed next step (one more measurement report, plan only):** on each of those pages and
640 x 360 again, a ladder in steps of 2 around the KPI heights the engine gives there, with the card exactly as
`cardFit` writes it for that page (the theme's title, the page's padding, the callout value). From that: either a rule
by page scale, or a table of the smallest card height per page size and value, used by `cardFit` to lower the value
only where the card is too short (1080 and up keep 42-60, as the owner asked). Which sizes and fixtures change is known
only after that measurement: `cardFit` changes no fixture; raising the engine's KPI height on small pages instead would
(as with the header).

**Order after "go":** tests first with the measured rules (and option (a)'s engine test if chosen), failing; code
(`pbip-export.js`, and `design-engine.js` only under (a)); fixtures recaptured only under (a) and only the six listed;
full run; the eight Desktop reports built over stdio, expected numbers written first; Desktop check, phone layout with
the owner's clicks; then the two CLAUDE.md notes.

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
- **Next round after `fix/phone-and-sizes`, before the cards at 640 x 360 (owner 2026-10-01; plan only, then "go"):**
  - **Arabic reports show English titles** ("Total Sales حسب Quarter", English KPI names, table headers, slicer titles):
    measure and column names come from the model. Plan: `create_report` takes optional display names per field; in
    an Arabic report, every field without an Arabic name is listed in the notes. No made-up translations.
  - **Days sort alphabetically in tables** (Friday, Monday, ...: `Calendar[Day Name]` has no sort-by column; in
    `modelNotes` since "Gulf Sales AR 3"; months too: `Calendar[Month Name]`). Plan: a model health finding with a
    ready TMDL script that sets the sort column for day and month names, covering a week that starts on Saturday or
    Sunday. The model is still never changed without the user.
- **Flaky tests on a busy laptop:** `consent` ("Berlin: no banner") and `anchors` (home page #contact) failed once
  each under load and pass alone. They don't use `ready()` yet (`scripts/tests/lib.mjs`).
- **Phase 3:** background PNGs from the engine's SVG (first test whether Power BI accepts the SVG itself).
- **Roadmap after that:** Arabic/right-to-left and Gulf DAX in a private repo, then packaging (`mcp/ROADMAP.md`).

## How to work (short)
- Plan first, wait for "go"; tests first; one writer on the repo at a time; branch → push → the reviewer tests and
  merges; never merge yourself. Keep the laptop awake during full runs.
