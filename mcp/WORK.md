# Current work (the memory between sessions)

Read this first; update it as you go (rules in `mcp/CLAUDE.md`, "Keeping the memory"). Last updated 2026-09-30
by the reviewer, main at `84cc794`.

## Where things stand
- **MCP: 6 tools** (`read_model`, `suggest_fields`, `check_model_health`, `generate_theme`, `plan_layout`,
  `create_report`), 64 checks in `npm test`.
- **Phase 2 (design engine in the MCP): built and merged.** `generate_theme` and `plan_layout` reproduce the website
  byte for byte on all 54 design fixtures; `create_report` builds the website's project download from a design
  (60 project fixtures). Live on the laptop: "Gulf Sales" (English, exec) and "Gulf Sales AR" (Arabic, right to left,
  analysis) put every visual on both pages exactly where planned. Details: `mcp/PHASE2-SPEC.md`.
- **Website:** Theme Generator runs on the shared engine (`assets/js/design-engine.js`); bug notes #1-#8 from the
  engine move are all closed. All 16 suites pass (~5,800 checks).
- **Not done yet:** the Phase 2 Desktop check (next step below).

## Next step: Phase 2 step (f), the Desktop check (approved, not started)
Branch `docs/desktop-check-phase2` from main. Don't change code. Work models closed.
1. Open `tests/5-tmdl-sample/Gulf Sales AR.pbip` in Power BI Desktop (bridge `powerbi-desktop open`; the Store
   version needs `PBI_DESKTOP_PATH`). If the file isn't there, rebuild it first with the same calls:
   `generate_theme` (brand #0F4C5C, harmony analogous, name "Gulf Sales", lang ar, font Tahoma,
   folder tests/phase2-try) → `plan_layout` (layout analysis, filters end, lang ar) → `create_report`
   (that design, lang ar, name "Gulf Sales AR", on tests/5-tmdl-sample).
2. Screenshot each page, one at a time; close any capture window left behind.
3. Look at every screenshot and report page by page: cut-off text, overlaps, empty or error visuals, unreadable
   colours, Arabic text direction.
4. Connect with Microsoft's Power BI Authoring MCP (only the Ramadan Test instance) and check each KPI card with DAX:
   expected (DAX) / shown / PASS or FAIL.
5. Add the results to `scripts/tests/DESKTOP-TESTS.md`, commit, push the branch, don't merge. Close Desktop without saving.

Expected positions (already proven in the files; the check is how Desktop draws them), x, y, w, h:
- Page 1 "تحليل": title 1044,18,840,48 · logo 36,18,225,48 ("شعارك") · filter rail 24,105,294,951 (3 slicers and
  Reset "إعادة ضبط الفلاتر" inside) · KPI 1 1388,105,508,126 · KPI 2 861,105,509,126 · KPI 3 336,105,507,126 ·
  main chart 336,249,1560,347 · detail table 336,614,1560,442.
- Page 2 "نظرة عامة": title 1044,18,840,48 · logo 36,18,225,48 · KPI 1 1442,105,454,144 · KPI 2 969,105,455,144 ·
  KPI 3 497,105,454,144 · KPI 4 24,105,455,144 · main trend 654,267,1242,440 · breakdown 24,267,612,440 ·
  comparison 969,725,927,331 · detail 24,725,927,331. Plus a hidden tooltip page "تلميح".
- Theme "Gulf Sales": text sizes 15/18/27/42; known warning: data colour 7 (#14327b) almost disappears on the
  visual background (below 1.6:1).

## Open items (flagged, need the owner's go before any work)
- **Field suggestions** (`suggest_fields`, `assets/js/pbip-bind.js`): on the Ramadan Test model it put a slicer on
  Amount (a number) and made a chart "Total Sales by Amount". A real quality issue for users.
- **Mixed-language titles** in Arabic reports ("Total Sales حسب Amount"): measure names come from the model.
- **Flaky tests on a busy laptop:** `consent` ("Berlin: no banner") and `anchors` (home page #contact) failed once
  each under load and pass alone. They don't use `ready()` yet (`scripts/tests/lib.mjs`).
- **Phase 3:** background PNGs from the engine's SVG (first test whether Power BI accepts the SVG itself).
- **Roadmap after that:** Arabic/right-to-left and Gulf DAX in a private repo, then packaging (`mcp/ROADMAP.md`).

## How to work (short)
- Plan first, wait for "go"; tests first; one writer on the repo at a time; branch → push → the reviewer tests and
  merges; never merge yourself. Keep the laptop awake during full runs.
