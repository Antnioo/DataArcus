# Current work (the memory between sessions)

Read this first; update it as you go (rules in `mcp/CLAUDE.md`, "Keeping the memory"). Last updated 2026-09-30
by the reviewer: `feat/card-visual` merged into main.

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

## Next step: the fix round for the phone layout and small/large pages (plan first, wait for "go")
New branch `fix/phone-and-sizes` from main. Write the plan and its expected results into this file (commit and push)
before any code changes, then report and wait for "go". It covers the first two open items below:
- **Phone layout overlaps:** find where `pbip-export.js` writes `mobile.json` for visuals inside a group, and how
  Desktop reads it (Microsoft's `mobile.json` schema and the powerbi-authoring references; Desktop showed it reads a
  grouped visual's phone position as a page position). Test first (failing on main): no two visuals' phone boxes
  overlap, in page positions, on every page of the MCP reports and the website download.
- **640 x 360 and 3840 x 2160:** the header title cut at the bottom, slicer titles and Reset wrapping (360); slicers
  squashed, small header title, page buttons and logo text, Reset cut (2160). Find the cause in shared code (sizes
  fixed in page units instead of scaled with the page, as `cardFit` does for cards) and fix it there. Tests first.
- **Desktop check, expected results written before the run:** the EN and AR reports at 1080, 360 and 2160 (as for the
  cards), plus View > Mobile layout: no overlaps, every title, slicer and button whole.
- The engine's fixtures (54 design, 60 project) must not change unless the plan says which fields change and why.

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
