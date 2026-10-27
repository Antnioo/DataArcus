# TS1 (0.3.1, the owner, 27 Oct): FHD text x 1.25, and the gap beside a shortened rail

## Summary
- **Approval:** the reviewer's brief "Go on TS1"; the owner, 27 Oct (D-1027-16): "no go for 1.25 in 0.3.1" (FHD text
  sizes x 1.25 from the 1280 x 720 sizes, not x 1.5; from Codex's text-sizes review, dataarcus-exchange
  results/2026-10-26-text-sizes/REPORT.md and sizes.csv). And the owner's yes of 26 Oct to 0.2.9-writer-S10 (SQ13-S3),
  SQ13's option (a): REFLOW_KEEP 0.5 -> 0.45.
- **Scope:** `assets/js/design-engine.js` (one constant `FHD_TEXT = 1.25`, `textScale(h)`, `themeScaleOf` gives the
  factor, REFLOW_KEEP 0.45), `assets/js/report-rules.js` (its copy of the old size gone: reads `sizeAt`),
  `mcp/lib/report-run.mjs` + `design.mjs` (create_report rescales by text factors); their .min.js and `?v=`; the new
  suite `mcp/test-0.3.1-ts1.mjs`; `mcp/lab/text-sizes-lab.mjs`; tests moved on purpose (said below); CHANGELOG; this note.
- **Base:** `fix/0.3.1-text-125` from `origin/integration/0.3.1` (d6d3159), merged again after ST1 and SF1 (13afb3a).
- **Expected numbers (before the work):** 1920 x 1080: label, table, slicer 15 -> 12.5; title, header, multi-row card
  title 18 -> 15; callout and card value 42 -> 35; multi-row card values 27 -> 22.5. 1280 x 720 unchanged. 1366 x 768:
  10.5, 12.5, 29, 18.5. 3840 x 2160: 20, 24, 56, 36. Pills at 12.5pt 76 (measured 72 + 4). KPI title gaps 26 / 17
  unchanged. S10: 392, 308, 329, 245 unchanged, 197 -> 18 (the column chart 347 -> 168).
- **Expected checks:** the new suite about 25 checks, red first on d6d3159; design, sq13 S10, golden, layout and phone
  suites: every changed number said below; run-all design-engine, theme-generator, pbip; full run +1 suite, all PASS.
- **Got:** every expected number above, measured (ts1 T2, T4, T5; the lab's written report: column 168 high at y 249,
  the table and bar chart from y 435, EN and AR). ts1 red on d6d3159 first (16 of 24), now 25 PASS. Tests moved on
  purpose: 8 (below). Lab: validator 0, "can break" 0, EN and AR.
- **Resume:** done after the full run line below; waits for the reviewer, then the laptop ("For the laptop").

## The plan
1. `FHD_TEXT = 1.25` (the owner's D-1027-16, Codex's review) in the theme's text block of design-engine.js. The text
   factor of a page h high: `textScale(h) = 1 + (h / 720 - 1) x (FHD_TEXT - 1) / 0.5`, a straight line through 1 at 720
   and 1.25 at 1080 (so 2 at 2160, 0.75 at 360). `sizeAt` reads it; sizes stay half points within 8-60 (as before:
   Power BI takes half points, and rejects a theme with one size outside 8-60).
2. Every reader of the 1.5: list each place (`rg "1\.5"`, `/ 720`), say what follows the theme (most of the writer
   reads the theme's own sizes: pbip-page.js themeSizes) and what stays measured.
3. Saved designs: the website stores no text-size version (layout `v` is the layout's own migration), so a saved
   design takes 1.25 when its theme is built again; said in the CHANGELOG line. The MCP: generate_theme, plan_layout and
   create_report take the new sizes; redesign and the twin copy the original theme's text classes as they are.
4. Tests red first; then the lab page (x 1.25 next to x 1.5) and "For the laptop".
5. S10: REFLOW_KEEP 0.45, sq13 S10's target [392, 308, 329, 245, 18].

## Before -> after
1. **The constant** (design-engine.js, the text block): `sizeAt` was `n x h / 720` -> `n x textScale(h)`, `textScale`
   from `FHD_TEXT = 1.25` (named, with D-1027-16 and Codex's review). Half points within 8-60, as before. Test: ts1 T1, T2.
2. **Every reader of the 1.5 for text** (searched `1\.5`, `/ 1.5`, `h / 720`, `/ 720` in assets/js and mcp/lib):
   - follow the constant through the theme: the writer's card, title, table, slicer, pill, tab and header-row sizes
     (pbip-page.js `themeSizes` reads the theme's sizes; pbip-sizing.js's measured rules take the size given);
     design-engine `minOf('fh')` (the measured 16 + 4 x pt at the theme's slicer size: the top rail's least height on
     1080 64 -> 58, inside the measured 8-15pt range); the website's Theme Generator (E.buildTheme only, T2h-i).
   - was a second copy, now reads the engine: report-rules.js TABLE_ROWS_SHOWN ("Power BI's label size for its page",
     `10 x H / 720`) -> `sizeAt(10, H)`; report-run.mjs's rescale (`hs / themeH` -> `textScale(hs) / f`) and its note
     (`720 x t10 / 10` -> the theme's page from themeScaleOf).
   - kept as measured (never scaled down): the pills (72 from 10pt; 76 at 12.5); the KPI title gap 26 / 17 (page,
     round(5k)); the bar chart's 22.2 a row, 45 / 8 / 38 (measured at 10pt on 720, kept on the 720 grid: at 12.5 on 1080
     a row has room to spare, so a few fewer bars than could fit, never a cut one); pbip-page.js's `s.rows x 23 + 92`
     (the same rule); the header's `24 + 25 / s` (the 8pt line measured); every `/ 1.5` in pbip-sizing.js cardFit (a
     line is 1.5 x its size, Microsoft's card sizing, not the page factor); `8 x s / 1.5` padding (page).
   - not text: the background PNG drawn at 1.5x; TABLE_NEED's weight 1.5; layout-check's PIVOT_SCROLL; twin-copy's
     `14 x ph / 1080` (the twin's own button text, from the original's page).
3. **Saved designs:** the website stores no text-size version (layout `v` 3 is the layout keys' migration): a design
   saved before 0.3.1 takes the new sizes when its theme is built again (CHANGELOG). The MCP: generate_theme, plan_layout
   and create_report on 1080 write 12.5 / 15 / 35; redesign copies the original theme's text classes (restyle changes
   colour tokens only), the twin reads the original's theme. A 0.3.0 theme for 1080 has exactly the sizes of a new
   theme for about 1440, so create_report reads it as such and scales it to its pages (x 0.83 on 1080), and says so.
4. **Tests:** ts1 (new, 25 checks, red first on d6d3159: 16 of 24; T6 added after, for the lab). Moved on purpose:
   - scripts/tests/design-engine.mjs: the top rail from 64 -> 58 on 1080 (above); its fixtures cases.json and
     project-pages.json remade: compared leaf by leaf, only fontSize/textSize change (15 -> 12.5, 18 -> 15, 27 -> 22.5,
     42 -> 35), and one background (page-out-of-range-plain, 3840 x 2160: the S10 reflow applies, its chart 231 -> 113
     on the grid, the row under it 295 -> 413).
   - scripts/tests/pbip.mjs: the default cards' value 42 -> 35 on 1080 (720's 28 and the tooltip's 20 unchanged).
   - test-0.2.9-design.mjs A6-10: the 1080 card value 42 -> 35, half of it 21 -> 17.5.
   - test.mjs: generate_theme's default sizes '15,18,27,42' -> '12.5,15,22.5,35'; create_report design: the details
     page's slots matched when reflowed (the chart beside the rail ends with it, >= REFLOW_KEEP; the rows under move up,
     bottoms kept).
   - test-round23.mjs 5: the 1080 theme's table text 15 -> 12.5 (still 10 on 720: x 0.80 now, was x 0.67).
   - test-0.2.9i.mjs P3-3: the measured rows (134.2 / 130.2 + 30N, at 15pt) checked on 2560 x 1440, whose text is
     15 / 18 as 1080's was (the numbers unchanged).
   - test-0.3.1-sq13.mjs S10: [392, 308, 329, 245, 197] -> [..., 18].
   - golden: tasks 1, 2, 7, 10, 12 tableText (the theme's 15 -> 12.5; a table fitted to its rows 13 -> fits at 12.5),
     task 6 longTitleUses 120 -> 124 (the long Arabic name whole in 4 more places at 15pt titles); each in "why".
5. **S10** REFLOW_KEEP 0.5 -> 0.45: the second page's 197 gap -> 18 (one row gap); the column chart 347 -> 168 high
   (0.48 of it), the table and bar chart under it start at 435 and grow by 197. 168 on a 1080 page at 12.5pt: a title
   line and the month labels leave a plot about 100 high: acceptable as a trend strip, the laptop confirms (below).
   The other four gaps (rows beside the rail on page 1: 392, 308, 329, 245) stay: option (a) does not reach them.

## CHANGELOG line
"Calmer text on 1920 x 1080 pages": x 1.25 (12.5 / 15 / 35, was 15 / 18 / 42), 720 unchanged; new themes everywhere
and saved website designs when downloaded again; redesign and twin keep the original's; a 0.3.0 theme in create_report
takes the new sizes, said; the details page's chart ends with a short filter panel. Sources: design-engine.js FHD_TEXT,
ts1 T2 (the numbers), the lab's written report (168, 435).

## Decisions I made
1. **The curve:** a straight line through (720, 1) and (1080, FHD_TEXT): one constant, 720 untouched, and the brief's
   1080 numbers exact. Larger pages grow less than before (4K: x 2, was x 3; the callout 56, under the cap of 60).
2. **Rounding:** half points, as before (`Math.round(x 2) / 2`): Power BI takes them, the theme already wrote 13.5 etc.
3. **A 0.3.0 1080 theme** in create_report: read as made for ~1440 and scaled to the pages (the new sizes), with a
   clause in the note saying it may be a pre-0.3.1 1080 theme. Keeping its old sizes would need a mark in the theme,
   which Desktop may refuse (round 23 part 6).
4. **No version for saved designs:** none exists for text; adding one would be a new key in a saved design (repairState).
5. **report-rules.js:** reads the engine (lazy, like Sizing); the rule is skipped where the engine is not loaded (the
   only page that loads it, the Theme Generator, loads the engine).
6. **P3-3:** moved to a 2560 x 1440 page to keep checking the measured 15pt numbers, rather than invent 12.5pt ones.
7. **The lab** copies the first page's card, slicer, bar chart and table twice into one page: as written, and with each
   text size x 1.2 on the visual (x 1.5 of 720), same boxes: the look side by side, and whether x 1.5 cut anything.

## For the owner
- none (D-1027-16 and the yes to S10 decided both; the four other S10 gaps stay, as option (a) said).

## Risky changes
- What an answer returns: create_report's note on a rescaled theme gains one clause for a ~1440 theme (a pre-0.3.1
  1080 theme); no data values. Tests that lose checks: none (P3-3 moved page, same numbers; the matcher gained one
  allowance for the reflow, bounded by REFLOW_KEEP and the bottoms kept). Nothing else (no security, approval, writing,
  network or process change).

## For the laptop
1. `node lab/text-sizes-lab.mjs <empty folder>` (from mcp/), open "Text EN.pbip" and "Text AR.pbip" in Desktop on a
   1080p laptop at 125% scaling, View > Fit to page. Each page: every title, label, KPI value, pill, tab and table header
   whole, nothing cut or overlapping (EN and AR). Record per page: OK / what is cut.
2. The page "Text x 1.25 | x 1.5": the same card, dropdown slicer, bar chart and table at 12.5 / 15 / 35 (shipped)
   and at 15 / 18 / 42 (0.3.0). Record which reads better at Fit to page and whether the x 1.5 side cuts anything.
3. The details page (filters at the start, three dropdowns): the column chart beside the filter panel ends with it
   (168 high): its title, month labels and columns readable? The table and bar chart under it start at 435 (no empty
   band under the panel). If 168 is too low, record the least height that reads well.
4. The Theme Generator (website, 1920 x 1080): the theme JSON shows 12.5 / 15 / 35 / 22.5.

## Seen, not in scope
- The other four S10 gaps (rows beside the rail on page 1, 245-392): a row there can only widen into the rail's
  column under its bottom; needs a rule the owner decides (SQ13 Decisions 1).
- report-rules.js's TABLE_ROWS_SHOWN calls the engine's size "Power BI's label size for its page": it is DataArcus's
  theme's size; the words are older than this job.

## Lessons for the reviewer
- `pkill -f run-tests.mjs` matched my own shell's command line and killed it: stop a background run by its task id.
- theme-generator's "new visitor: page size" check failed once while a full run ran beside it, passed alone (base and
  branch): the site suites are flaky under load; run them alone.
- The design engine's fixtures say "remade only with the owner's approval": D-1027-16 is that approval here; the
  leaf-by-leaf diff (only text sizes and one reflowed background) is the evidence.
