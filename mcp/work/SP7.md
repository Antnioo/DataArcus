# SP7 (0.3.2, the split): assets/js/pbip-page.js -> pbip-tooltip.js (the tooltip pages; behaviour identical)

## Summary
- **Approval:** the reviewer's brief "SP7" (3 Nov); the owner D-1016-01, D-1102-02, D-1102-04. Backlog B-280, B-286
  (the Codex split map: "Extract pbip-tooltip.js first, then pbip-navigation.js ..., then pbip-visuals.js").
- **Base:** `feat/0.3.2-sp7` from `origin/integration/0.3.2` at 90eaa7c. Pushed only this branch; never merged.
- **Scope:** new `assets/js/pbip-tooltip.js` (`DAPbipTooltip.tooltipPages(input)`): the tooltip pages' builder from
  explicit read-only inputs (theme, metrics, binding, direction, look, measures), one page at a time: the page JSON,
  its visuals' JSON and diagnostics; it writes no file and names no visual. pbip-page.js's `tooltips(c)` stays on its
  API as the page assembly (asks for the pages through tipFor, names each visual with rnd, adds the files), page by
  page in the old order. Website: pbip-tooltip.min.js in theme-generator.js's BUILDER before pbip-page (no page loads
  pbip-page by a script tag). MCP: pbip-export.js requires pbip-page.js, which requires pbip-tooltip.js.
- **Plan:** characterise on the base (MCP sp7, website sp7), move, the same records pass unchanged.
- **MCP suite sp7 (test-0.3.2-sp7.mjs, area report):** 8 runs of plan_layout, approve_plan, create_report with SP1's
  seed module: EN and AR, glass and plain, 1920 x 1080 and 1280 x 720, a tiny made-up model and the twin and health
  fixtures; T1-T8 the answer and every written file's sha256; C1 the runs cover the Top 6 with its title measure, the
  6- and 12-month trends, an Arabic page name, a second page of a kind, the empty page, mirrored bars. After the move
  M1 (pbip-page assembles over tooltipPages; pbip-tooltip has no add, rnd, json) and M2 (BUILDER order).
- **Website suite sp7 (scripts/tests/sp7.mjs, shard 1):** the lab page ?lang=en and ?lang=ar, analysis 1280 x 720
  (sp5 has exec 1920 x 1080), seeded and clock fixed: every non-image file (4 pages, 2 of them tooltip pages) and the
  ZIP container as recorded; W3 after the move: pbip-tooltip loaded once, before pbip-page.
- **Before -> after:** `assets/js/pbip-page.js` 1631 -> 1533 lines; `pbip-tooltip.js` 144 (new).
- **Expected checks:** sp7 9 on the base, 11 after; website sp7 2 on the base, 3 after. **Got:** the same: sp7 9 on 9e70915
  (recorded on the base code), 11 on 71378c08, records unchanged; website sp7 2, then 3. A one-number change
  (tipSix + 1) fails sp7 T1-T7 on the base and after the move (then reverted); T8 (the empty page) is unaffected.
- **Areas (on 71378c08):** report 46 of 46 (sp5 12, sp7 11, glass-tables 113, phone 355, dax-functions 92); core 11
  of 11 (mutation 198: 76 mutants, all killed); arabic 15 of 15; website sp7 3, sp5 3, pbip 111, theme-generator 922, theme-generator-lab 922, design-engine 600,
  layout-canvas 31; lint 0; check-min (stamps against main) and test-site-config pass; csp, ar-pages, sitemap clean.
- **CI green: https://github.com/Antnioo/DataArcus/actions/runs/41570057046 on 4c90c01a** (first run, every job green;
  integration/0.3.2 had not moved from 90eaa7c: nothing merged in).
- **Merged integration/0.3.2 in (956c4d80: SP4, SP6)** at eb08b20c: both sides kept (run-all.mjs: sp6 in shard 2,
  sp7 in shard 1; tests.json, the CHANGELOG lines, the BUILDER list and every ?v= stamp, one per script path; WORK.md
  3,180 characters). After it: report 48/48 (sp5 12, sp7 11, sp3 10, sp4 5, sp6 13), core 11/11 (mutation 198),
  arabic 15/15; website sp7 3, sp6 4, sp5 3, pbip 111, both generators 922; lint 0; check-min and site config pass.
  **CI green: https://github.com/Antnioo/DataArcus/actions/runs/41576555869 on eb08b20c.**
- **State: DONE.**
- **Resume:** none; the reviewer's merge.

## CHANGELOG line
- **Inside the report writer:** the tooltip pages (the card and the bars shown when a chart is hovered) are made in a
  file of their own; every report, on the website and from the MCP, is byte for byte what it was before.

## Decisions I made
- One page at a time, not all pages at once: the visuals' filters (notBlank, topN, lastMonths, topSet) draw random
  ids and add report measures while a page is built, and the page assembly draws each visual's name right after. To
  keep the random sequence (and the bytes) the assembly builds a page and writes it before the next one is built.
- The measure helpers stay pbip-query's (`Query.measures(c)`): they add the report's own measures (timeExt) and name
  their filters. They are passed in as `measures`, named; moving them is not this job (the split map: pbip-visuals).
- `tipFor` (the binding's page names) stays in pbip-export.js; the builder's `wanted()` says which always-there pages
  the report still lacks and the assembly asks tipFor for them.
- `isoTop` (the Arabic Top-N title's isolation) is shared with the page's own chart titles: it stays in pbip-page.js
  and is passed in `direction`; one copy.
- The inputs are shallow frozen copies of the sections; the shared objects inside (the theme's colours, the binding)
  are not frozen, as the rest of the writer reads them after.
- Diagnostics per page: `{ kind: 'cat' | 'trend' | 'empty', top: 6 | null, months: 6 | 12 | null }`; nothing reads them
  yet (pbip-export's tooltipLimits keeps its own rule over tipPages: unchanged behaviour).
- The website suite uses another layout than sp5's so the two records are not the same download; W3 was added with the
  move (on the base it would fail by design), as SP5 did.
- New stamps `20261103sp7` for pbip-tooltip, pbip-page and theme-generator.min.js (three generator pages; the Arabic
  copy checked by ar-pages).

## For the owner
none

## Risky changes
none (every written file proven byte-identical in 8 MCP runs and in the rendered download, EN and AR).

## Seen, not in scope
- `docs/MODULES.md` line 75 still lists the writer as one row; pbip-navigation and pbip-visuals will need their own.
- pbip-export.js's `tooltipLimits` repeats the Top 6 rule (a text category, not a time one) that pbip-tooltip.js's
  `topped` holds; it could read the builder's diagnostics. A later job (it changes pbip-export.js).
- This clone was shallow: check-min compared the stamps with main only after `git fetch --unshallow`.

## Lessons for the reviewer
- pbip-navigation (next): the page buttons and filter panels (pbip-page.js `tabsFor`, the header, the rail, the Reset
  bookmarks) draw rnd ids and push to `bookmarks` while the page is built; keep the build-then-write order per page,
  or the ids move. sp7, sp5 and sp3 are its byte gates (sp7 T1-T7 have page tabs, rails at the start and on top).
- Source-reading tests pin pbip-page.js text: 0.2.9i (`'التفاصيل'`, two `tableHeight(... .fontFace || font)`),
  0.2.9w (no absorb/dropLines/grown/railFit, `fitSlots`, two `tableHeight(`), sq1 E2 ("320 x 284 tooltip page", in
  kit), arabic-terms AT-4 (the Reset tooltip's Arabic ternary), fx5 (`BAND_TYPES`), mirror-parity E1 and matrixRtl.
  None needed a change here; navigation will move the Reset text (AT-4) and the tabs.
- A new browser module: `git add` the source and a placeholder .min.js, then `npm run build:min` writes it.
