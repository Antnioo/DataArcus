## Summary
- **Approval:** D-1105-17 (5 Nov, the owner: "2 yea"): the approval page's preview also draws the tooltip pages the
  click writes (A-AP1-2), not only names them. The brief "TP1 (0.3.2)" (5 Nov).
- **Base:** `fix/0.3.2-tp1` from `origin/integration/0.3.2` at 4f8da4a7 (Merge LG1). Push only this branch; never
  merge, no PR.
- **Scope:** the one place the preview's pages are chosen (`assets/js/page-preview.js` fromFiles: an opt-in
  `tooltips` option), its two MCP callers (`mcp/lib/plan-lint.mjs` planPreview, `mcp/lib/twin-preview.mjs`), and the
  approval page that draws them (`mcp/lib/approval-view.mjs`). The website's own preview is not changed (the option is
  off by default). No change to what is written, to the plan digest or to the gate.
- **Plan (one commit each):**
  1. This note.
  2. A failing test first: A11 in `test-0.3.0-approval-complete.mjs` (AP1's made-up Service model, whose click writes
     two tooltip pages): the preview shows one picture per tooltip page, at its own size (320 x 284 page units, drawn
     320 x 284), captioned as a tooltip page, after the report pages, within the cap; plus a unit check of the cap.
  3. The change, then sp23/sp44 re-recorded with SP23_RECORD / SP44_RECORD after a dump of the base's pages and mine.
- **Expected checks:** approval-complete 54 -> 54 + A11's (about 10); preview 71 -> 71 (fromFiles' default as on the
  base); sp23 29 -> 29 and sp44 23 -> 23 (the hashes of the pages with tooltip pages re-recorded, said below); sp1 11,
  sp2 10, sp4 5 unchanged; lint 0; check-agent-memory, check-modules, check-result-lines, changelog-words green.
- **Red first:** A11 red on 4f8da4a7 first (e536a95f: approval-complete 68 checks, 9 failed); green on a8f43156.
- **Changed on purpose:** sp23, sp44 (6 pages' hashes each), preview P-08, preview-match T1, sq13 R1-S3b,
  approval window W-09/W-10, twin-preview, bilingual-report B3e, glass-twin P1/P2 (below).
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/42081553507 on 1c41d6ce644268cefa8aed5a78441ba0f4e6a9a8
- **State:** DONE.
- **Resume:** the reviewer reads and merges.

## How the preview gets its pages today (base 4f8da4a7)
- plan_layout (`mcp/tools/plan_layout.mjs` previewOf) calls `planPreview` (`mcp/lib/plan-lint.mjs`) with the exact
  artifact's files; planPreview calls the shared renderer's `fromFiles` (`assets/js/page-preview.js`), which keeps a
  page only when `type !== 'Tooltip'` and it is not `HiddenInViewMode`: that filter is the one place the pages are
  chosen. planPreview then maps each drawn page to the inventory's shown pages by index for the layout flags.
- The twin and the EN-AR copy: `twinPreview` (`mcp/lib/twin-preview.mjs`) un-hides the copy's hidden pages, then the
  same `fromFiles` drops the tooltip pages ("tooltip pages are not, as on the report's page").
- `approval-view.mjs` askPage draws `previews.pages` (or `pairs` for the copy), at most `PREVIEW_PAGES_MAX` (12)
  pages or pairs, each 800 px wide (`render(p, { width: 800 })`, CSS `width:100%`), the rest counted in one line.
- AP1's `pagesWritten` (plan-lint.mjs) names every page, tooltip pages too, in "What each page holds"; not drawn.
- A tooltip page's size: Power BI's tooltip canvas (the "Tooltip" page size is 320 x 240); DataArcus's writer
  (`assets/js/pbip-tooltip.js` tipPage) writes 320 wide and 284 high or the measured rows' height (187, 287). The
  page.json's width and height are what fromFiles reads, so each tooltip page is drawn at its own size.

## Before -> after
- Before: the preview drew the report's pages only; "What each page holds" named the tooltip pages (AP1).
- After: `fromFiles(files, { tooltips: true })` gives the tooltip pages after the shown pages (page order), each with
  `tooltip: true` and its own width and height; planPreview and twinPreview ask for them (the website does not).
  approval-view.mjs draws them after the report's pages (or the copy's pairs), one by one, captioned "Tooltip page N:
  <name>" / «صفحة تلميح N: «<name>»» (the Arabic approved by the owner, D-1108-07), at its own size: rendered `width` = the
  page's width (376 x 310 and 320 x 314 for the Service model, 320 x 240 in the twin fixture), the figure's own
  `max-width` so the CSS's `width:100%` never stretches it. The page's shared STYLE is not changed.
- The cap (PREVIEW_PAGES_MAX, 12): the report's pages (pairs) win; tooltip pages take the slots left; those left out
  are counted in their own line ("2 more tooltip pages not drawn here (the report's pages come first in the 12 the
  preview draws); the plan above names every tooltip page."). A11-6 (11 + 3: 11 and 1 drawn, 2 counted), A11-7
  (13 + 2: 12 report pages, 1 page and 2 tooltip pages counted).

## Tests (each number from the run's own PASS/FAIL line)
| suite | base 4f8da4a7 | after |
|---|---|---|
| approval-complete | 54 | 68 (A11: 5 per language, 4 in process) |
| preview | 71 | 75 (P-08: one check per model, the tooltip pages counted apart) |
| preview-match | 41 | 43 (T1a/T1b: one check each, the tooltip pictures) |
| sq13 | 39 | 39 (R1-S3b: 2 report pages, then the tooltip pages) |
| twin-preview | 23 | 25 (V1-8a/8b: each tooltip picture's boxes are the written tooltip page's, twin and copy) |
| bilingual-report | 33 | 34 (B3f: the tooltip pages after the pairs, captioned) |
| glass-twin | 28 | 28 (P1/P2 read the report pages' pictures; tooltip pages drawn solid, as written) |
| approval window (test-approval) | 31 | 32 (W-09/W-10 count the report pages' pictures; one check: the tooltip pictures after them) |
| sp23 / sp44 | 29 / 23 | 29 / 23 (re-recorded, below) |
| sp1 / sp2 / sp4 | 11 / 10 / 5 | 11 / 10 / 5 (fixtures unchanged) |
Area runs: safety 23 suites, arabic 17 suites, report (keep-going) green after sq13; core 11 (mcp 1595, mutation 86 of 86 killed), twin 51, model 28,
checker 10, platform 3, release 5 suites passed; website pbip 111, pv2 20;
test-site-config, lint 0, modules --strict, result-lines, changelog-words, agent-memory PASS.

## Changed on purpose
- sp23 and sp44: dumps of the base's pages (SP23_DUMP/SP44_DUMP on 4f8da4a7) and mine: of 12 pages (and every HTTP
  answer and life step of sp44), 6 differ: report-en, report-ar, report-hostile (2 tooltip pictures each), twin (1),
  copy (2), report-cap (no picture: the cap is full, one count line). A script removed from each new page only the
  `<figure class="tip" ...>...</figure>` blocks and the tooltip count line: each page is then byte for byte the
  base's (all 6 "same as base once removed: true"; sp44's pages are sp23's bytes). Re-recorded with SP23_RECORD=1 and
  SP44_RECORD=1: in each fixture `pages.report-en`, `report-ar`, `report-cap`, `report-hostile`, `twin`, `copy`
  (sha256 and length); nothing else.
- preview P-08, preview-match T1a/T1b, sq13 R1-S3b, approval window W-09/W-10, twin-preview V1-1/2/4, bilingual-report B3e, glass-twin P1/P2 counted planPreview's or the page's pictures as report pages; they
  now count the report pages as before and check the tooltip pages apart (no expected number changed).

## CHANGELOG line
- **The approval page draws the tooltip pages too:** its preview now shows a picture of each tooltip page the click
  writes, after the report's pages, at its own size, captioned as a tooltip page; at most 12, report pages first.

## Decisions I made
- The option is opt-in (`tooltips: true`): the website's preview and every other fromFiles caller are unchanged.
- "Its own size" = one page unit a pixel (a 376-wide tooltip page drawn 376 wide, at most 800), as a reader sees it
  over the report at 100%, not scaled with the report page (that would draw it about 235 wide).
- Report pages win the cap; tooltip pages fill what is left; each kind left out is counted in its own line.
- The copy's tooltip pages are drawn one by one after the pairs (an English one in English), never as a pair.
- A tooltip page is drawn solid, as its page.json writes it (a card-colour background, no picture), on a glass
  report too; the glass look's picture and see-through cards stay on the report's pages.
- No CSS rule added: a style attribute on the tooltip figure (CSP allows inline styles), so pages without tooltip
  pages keep their exact bytes (a first try with a CSS rule changed all 12 pages by 50 bytes).

## For the owner
- The Arabic caption «صفحة تلميح N» and the count line's Arabic: approved as drafted (D-1108-07, 8 Nov; AP2).

## Risky changes
- The approval step: the page now shows more pictures (drawn from the plan only, by the same renderer, every name
  escaped by it); what is written, the plan digest and the click's checks are unchanged. No other.

## For the laptop
- none (no Desktop behaviour; a look at a real approval page with tooltip pages is welcome on the next batch run).

## Seen, not in scope
- The website's own preview (theme-download-ui.js) still draws report pages only.
- The plan's sizes (320 x 284) were the writer's default; the Service model's tooltip pages measured 376 x 310 and
  320 x 314 (A11-4 reads them from the written page.json).

## Lessons for the reviewer
- `ops/gate/pins.py` and `ops/gate/samejob.py` named in the brief are not on integration/0.3.2 at 4f8da4a7.
- A shared STYLE change moves every approval page's sha256: per-picture inline styles keep the pins to what changed.
- The core area's mutation suite reports test-approval's failure as its baseline's: run test-approval itself first.
- `npm ci` at the repo root is needed before `build:min` in a fresh clone (terser).
