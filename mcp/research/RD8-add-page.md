# RD8: add a page to an existing report (as a copy)

## Summary
- **Approval:** the owner, D-1103-12 (3 Nov night), "Go for 10 r&ds during the night ... choose the best r&ds ideas
  that will best fit our code and make us shine"; the scout's brief RD8 (`rd/0.3.2-scout`,
  `mcp/research/SCOUT-0.3.2.md`); the capability map's row 1 (`mcp/plans/CAPABILITY-MAP.md:28`).
- **Scope:** research only: this file and scratch scripts under `mcp/research/rd8/`. No product file changes.
- **Base:** `rd/0.3.2-add-page` from `origin/integration/0.3.2`. Push only it; no merge, no PR.
- **Expected checks:** no product suite runs (no product file changes). The prototype runs on made-up reports in
  `os.tmpdir()` only: the twin fixture and two lab reports built by the repo's own engines.
- **Expected numbers (to beat or explain):** pages after = pages before + 1; files byte-identical = every file
  before, except `pages.json` (one id appended); added files = the page's `page.json` + one `visual.json` per
  visual; validator 0 errors; 0 page-id and 0 visual-name clashes; bookmarks pointing where they did = all.
- **Resume:** the plan below, step 1.

## The plan
1. (a) Today's code: buildCopy, danglingOf, verifyCopy, the ALLOW literal; pbip-page one page; report-run;
   reportTheme/existingTheme; twin-copy newPlatform; pages.json order.
2. (b) Microsoft's docs: PBIR page folder, pages.json (pageOrder, activePageName), page and visual names, bookmarks.
3. (c) 2-3 ways with size and risk; the patch-kind registry as the design.
4. (d) A prototype (`mcp/research/rd8/add-page.mjs`) that copies a made-up report, adds one page with the repo's
   page engine, and measures the numbers above.
5. (e) The recommendation, (f) the Desktop checks, (g) a builder brief.
