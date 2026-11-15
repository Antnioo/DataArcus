## Summary
- **Approval:** the owner, 10 Nov: "start a session using it to tackle our toughest challenge with dataarcus" (relayed by the hub;
  the builder chooses the challenge with evidence, designs the answer, builds stage 1; never merges).
- **Base:** `feat/0.3.3-fb1` from `origin/integration/0.3.3` at 31f35e4a. Push only this branch; never merge, no PR.
- **Scope:** phase 1, the 3 toughest open problems ranked from the notes, one chosen; phase 2, the root cause as measured
  through the MCP tools on made-up models, the designs, the stages and their measures; phase 3, stage 1 built: a page-fill
  measure in the shared library (how much of a planned page is left empty, how squat its charts are), a suite that pins
  today's numbers on made-up models, and a first improvement the measure proves. Later stages: written plans only.
- **Expected checks:** new suite `fb1` 94 checks (red on 31f35e4a first: no pageFill); sp29 21 -> 22 (K2); every other
  suite unchanged on the tip. With the prepared layout change (38b8ffdb): 242 suites pass, 14 fixtures re-recorded and
  7 checks changed on purpose ("Changed on purpose"). check-modules --strict, test-contracts, lint 0; CI green.
- **Resume:** DONE (2026-11-10T19:13Z): the tip is the measure alone and is ready to merge. The layout change (38b8ffdb, reverted by 3d787177)
  waits for the owner's yes: "For the owner" 1, then "Next stages" 1.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/42880588188 on 9b0f9e66f291e95a087ffe1ced901ea198fa9341 (2026-11-10T19:13Z; Linux and Windows shards and the website success, macOS skipped by the workflow; integration 028c6a9d merged in once). DONE.
- **Result:** 28 of 80 planned pages leave a hole today (worst 13.8% of the body), pinned; with the prepared change 10
  (worst 10.6%), SQ13's four open gaps closed, the Details chart 168 -> 312 high.

## Phase 1: the toughest challenge (written 2026-11-10T16:48Z)
Ranked by (what the person suffers) x (how hard to get right) x (how long open or how often back), from the notes only.

1. **Report layout quality and its gap to what Desktop draws (chosen).** Every report with a filter rail shows it; the engine
   and the predictions are 30+ special cases with no number saying whether a page got better; open since 12 Oct.
   - The room under a short rail came back 5 times and took 3 rounds: 0.2.9-design.md:215-218 (round 8), :235-237 (round 9),
     FX2.md:53 (C03: "the rail's column under it is empty (294 x 620)"), SQ13.md:31-34 (gaps 392, 308, 329, 245, 197 measured,
     then stopped: "Decisions 1"), TS1.md:91-94 (REFLOW_KEEP 0.5 -> 0.45 closed the 197 only; "the other four ... stay").
     SEEN-QUEUE.md:193 (0.2.9-writer-S10).
   - Three of four layouts still ship as "Preview: this layout is still being tuned" (assets/js/design-metrics.js:167, the
     owner's decision of 12 Oct after LAYOUT-SWEEP-RC6).
   - Half-empty table panels: 0.2.9-design.md:169 and :218 ("needs its row count (data): not done").
   - Predictions Desktop then draws differently: text-measure.js:14-17 (219.9 worked out for a room of 220, cut by Desktop);
     B-173, Arabic headers listed cut that Desktop draws whole (DESKTOP-TESTS.md:2477, shipped as a known issue,
     CHANGELOG.md:1012, answered by a band AR_HEADER_WHOLE 0.7, report-rules.js:119, "no calibration"), again in MX3.md:62 and
     TW1.md:111; column room "a GUESS until the laptop proof S5" (design-metrics.js:142); slanted and cut month labels in six
     Desktop runs (DESKTOP-TESTS.md:395, :693, :910, :1795, :2007, :2101).
2. **Nobody has seen Desktop open or draw much of what the tools write.** 58 laptop items wait for one batched run
   (ST1.md:110-122: sizes Desktop draws 19, what Desktop opens 15, twin and mirror 10); WORK.md:24. High harm, but it is not
   hard to get right: it is waiting for one person's time, and no cloud session can shorten it. Not a builder's job.
3. **The Arabic twin's mirror is incomplete** (matrix row headers, SEEN-QUEUE.md:340; the mirrored table's "Total",
   ST1.md:61; number axes, ST1.md:62; Arabic DA measures, WORK.md:17). About 5 weeks open; each needs a Desktop measurement
   or the owner's decision first (D-1109-07), so the hard part is again not in the code.
Also weighed: answers at the 40,000-character cap (HR1.md:29, MX3.md:72, TW1.md:127: came back 6 times, cloud-only, but each
case was fixed at its cause) and flaky website suites (theme-generator "steps bar", WN1.md:15, PH1.md:8, LK1.md:7, DQ1.md:8:
real, cheap, no user harm).
**Why 1:** it is the only one of the three whose hard part is the code's own: the hub's candidate stands. Inside it I take
the page's geometry first (measurable here to the pixel, and what the person sees first), the predictions second (their
truth is on the laptop only).

## Phase 2: the root cause, measured (base 31f35e4a, through plan_layout on made-up models)
- **Reproduced.** The sample project (3 slicers), layout exec, filters start, 1920 x 1080: the rail is 24,105 294 x 312, the
  cards 336,105 to 249, the line chart 336,267 x 440 high, the next row at 725 across the page: the rail's column from 417
  to 725 is empty, 312 x 308 with its gutter (SQ13's "308"). The same model's Details page: the column chart is 1560 x 168
  (9.3 wide for 1 high), the table under it 1083 x 611 for a column of 4 values, the bar chart 771 x 621 for 2.
- **The rule that produces it.** A page is rows of fixed shares (computeSlots, design-metrics.js:225: `free * r.flex /
  flexSum`), then fitSlots (:428) shortens the rail to its dropdowns and repairs the L-shaped room by cases: a chart beside
  the rail ends at the rail's bottom only if it keeps REFLOW_KEEP = 0.45 of its height (:391). The cards' row sits beside
  the rail and takes the first 144 + 18 of the rail's 312, so the chart would keep 150 of 440 (0.34): no reflow, the hole
  stays. On the Details page it keeps 168 of 347 (0.48): reflow, a flat strip. Either a hole or a strip, by 0.03.
- **Why it kept coming back.** No function says how well a page is filled. Each round fixed the one page in front of it
  (rounds 8, 9, 12, FX2 C03 and C23, TS1) and the next sweep found the neighbour. And nothing passes what a visual needs
  (a table's rows, a chart's bars) to the layout, though the writer already has the measured sizes (pbip-sizing.js
  tableHeight, barBand) and, on the sample or with columnStats, the counts.
- **Three designs.**
  A. *More cases in fitSlots* (what was done five times). Cheap each time, never finished, no proof. Rejected.
  B. *A measure, and layouts chosen by it* (chosen). pageFill(slots): the largest empty rectangle of the body, the
     flattest and the lowest chart. fitSlots settles more than one arrangement of the same slots and keeps the one the
     measure prefers; a suite pins the measure on a grid of plans, so a change shows its whole effect before merge. Cost: one
     pure function and one suite, then a day per arrangement or need. Risk: every arrangement moves written positions, so
     recordings move (listed each time) and the look is confirmed on the laptop.
  C. *A constraint solver for the whole page* (rows and columns from needs, minimum sizes, weights). The right end state for
     hand-placed pages too, but weeks, every recording moves at once and nothing ships until it all does. Not now; B's
     measure is what C would be judged by.
- **Stages** (each a builder job of a day at most; "Next stages" below has them ready to brief):
  1. (this job) pageFill, the suite fb1 with today's numbers pinned, and the first arrangement: the cards' row across the
     page with the rail under it. Measure: plans with a hole, the worst hole, the flattest chart, over 80 plans.
  2. The rows under and beside the rail re-shared after a reflow, and the focus page's hole. Measure: the same three.
  3. What a visual needs, where counts are known (the sample, columnStats): a table's rows, a chart's bars, as fitSlots
     options. Measure: the room a table leaves inside its panel (need / height) on the sample's pages.
  4. Predictions against Desktop: one fixture of widths Desktop drew (structure only, made-up names), textWidth and the
     header rule calibrated to it. Measure: header-cut false positives and label cuts predicted vs the fixture.
- **Plan for stage 1, before the code:** new suite `fb1` (area report), red on the base (design-metrics.js has no
  pageFill); the pins recorded on the base's behaviour first (28 of 80 plans with a hole, worst 13.8%, flattest chart 9.3),
  then the arrangement moves them, each said under "Changed on purpose". Ripple, listed before estimating: every suite
  that pins a written page with a side rail and cards: the split guards of design-engine.js (sp29, sp6), golden, the fn1
  pins, layouts, the previews and the twin's fixtures: the full run names them, each re-recorded on purpose or fixed.

## Stage 1: what was built (written 2026-11-10T18:48Z)
**On the branch's tip (safe to merge, nothing a tool writes or answers changes):**
- `pageFill(slots)` in `assets/js/design-metrics.js` (re-exported by `DAEngine`): the largest empty rectangle of a page's
  body (both sides wider than two gutters), its share of the body, the flattest chart (width / height), the lowest chart.
  It reproduces the earlier notes' numbers to the pixel: SQ13's 308, 392, 329, 245 are the holes' heights.
- Suite `fb1` (mcp/test-0.3.3-fb1.mjs, area report, 94 checks, 7 s): 9 checks of the measure on slots made by hand, the
  facade, 80 plans through the real server on four made-up models (the sample; a date and one text column; two text
  columns and no date; one text column), an Arabic plan mirrored, and the sums. Pins: mcp/fixtures/fb1-pins.json.
  Red on the base first (31f35e4a: no pageFill, the suite stops at its first plan).
- **Today's numbers (the base's): 28 of 80 plans leave a hole; the worst is 13.8% of the page's body (733 x 149 on a
  1280 x 720 focus page); the flattest chart is 9.3 wide for 1 high (1560 x 168).** Every plan with the filters on top
  or none has no hole; every plan with a side rail has a hole or a chart under 170 high, except one slicer on 1920 x 1080.

**Prepared, proven, and held one commit back (commit 38b8ffdb, then its revert 3d787177): the cards' row over the rail.**
fitSlots settles a second arrangement of the same slots, the KPI cards across the whole page and the rail (still kept
to its dropdowns, on the side the person chose) under them beside the charts, and keeps it only where pageFill measures
a smaller hole, or the same hole and a higher lowest chart. Every chart still keeps REFLOW_KEEP of its height.
- **28 -> 10 plans with a hole; worst 13.8% -> 10.6%; flattest chart 9.3 -> 6.8.** SQ13's S10, measured by its own check:
  [392, 308, 329, 245, 18] -> [18, 18, 18, 18, 18]. The Details page's main chart: 1560 x 168 -> 1560 x 312 (1280 x 720:
  129 -> 225). Six cards over the rail are 302 wide, not 250, so their titles keep 13pt (were shrunk to 10pt).
- The 30 plans that move (hole before | after | flat | low):

| plan (model layout page filters) | hole before | hole after | flattest chart | lowest chart |
|---|---|---|---|---|
| sample exec 1920x1080 start | 5.4% 312x308 | 0% | 3.3 -> 3.3 | 331 -> 312 |
| sample exec 1280x720 start | 4.9% 208x188 | 0% | 3.3 -> 3.1 | 221 -> 225 |
| sample analysis 1920x1080 start | 0% | 0% | 9.3 -> 5 | 168 -> 312 |
| sample analysis 1280x720 start | 0% | 0% | 8.1 -> 4.6 | 129 -> 225 |
| sample ops 1920x1080 start | 4.3% 312x245 | 0% | 2.1 -> 1.7 | 394 -> 312 |
| sample ops 1280x720 start | 0% | 0% | 2.6 -> 1.8 | 129 -> 225 |
| sample focus 1920x1080 start | 11.6% 1100x188 | 8.4% 312x477 | 2.2 -> 1.3 | 619 -> 789 |
| sample focus 1280x720 start | 13.8% 733x149 | 7.9% 208x301 | 2.4 -> 1.3 | 389 -> 526 |
| two exec 1920x1080 start | 6.9% 312x392 | 0% | 3.3 -> 4.5 | 331 -> 228 |
| two exec 1280x720 start | 6.6% 208x250 | 0% | 3.3 -> 4.2 | 221 -> 163 |
| two analysis 1920x1080 start | 10.6% 1578x120 | 0% | 7.6 -> 6.8 | 245 -> 228 |
| two analysis 1280x720 start | 12.1% 1052x91 | 0% | 8.2 -> 6.4 | 152 -> 163 |
| two ops 1920x1080 start | 5.8% 312x329 | 0% | 2.1 -> 2.2 | 394 -> 228 |
| two ops 1280x720 start | 5.5% 208x208 | 0% | 2.1 -> 2.1 | 263 -> 163 |
| notime exec 1920x1080 start | 6.9% 312x392 | 0% | 1.8 -> 3.4 | 440 -> 228 |
| notime exec 1280x720 start | 6.6% 208x250 | 0% | 1.8 -> 3.2 | 293 -> 163 |
| notime analysis 1920x1080 start | 10.6% 1578x120 | 0% | 7.6 -> 6.8 | 245 -> 228 |
| notime analysis 1280x720 start | 12.1% 1052x91 | 0% | 8.2 -> 6.4 | 152 -> 163 |
| notime ops 1920x1080 start | 5.8% 312x329 | 0% | 2.1 -> 3.4 | 394 -> 228 |
| notime ops 1280x720 start | 5.5% 208x208 | 0% | 2.1 -> 3.2 | 263 -> 163 |
| single analysis 1280x720 start | 4% 1052x30 | 3.7% 208x141 | 5.9 -> 4.5 | 213 -> 231 |
| single ops 1280x720 start | 7.1% 208x269 | 4.5% 208x173 | 2.1 -> 2.1 | 263 -> 263 |
| sample exec 1920x1080 end | 5.4% 312x308 | 0% | 2.4 -> 3.3 | 331 -> 312 |
| sample exec 960x720 start | 6.6% 208x188 | 0% | 2.2 -> 2.1 | 221 -> 225 |
| sample analysis 1920x1080 end | 0% | 0% | 9.3 -> 5 | 168 -> 312 |
| sample analysis 960x720 start | 0% | 0% | 5.6 -> 3.2 | 129 -> 225 |
| sample ops 1920x1080 end | 4.3% 312x245 | 0% | 1.3 -> 1.6 | 394 -> 312 |
| sample ops 960x720 start | 0% | 0% | 1.8 -> 1.4 | 129 -> 225 |
| sample focus 1920x1080 end | 11.2% 312x639 | 8.4% 312x477 | 1.3 -> 1.3 | 789 -> 789 |
| sample focus 960x720 start | 13% 513x149 | 10.6% 208x301 | 1.8 -> 0.9 | 389 -> 526 |
- Why it is not on the tip: (1) SEEN-QUEUE.md:193 keeps S10 "the owner's call" because "every fix moves the written
  layout with no measured rule", and on 26 Oct he chose option (a) of SQ13's three; this is a fourth option with the
  measured rule that was missing, so it is his to see and say yes to. (2) scripts/tests/capture-design-fixtures.mjs:9:
  "Fixtures are only remade with the owner's approval": six of the website's page backgrounds move with it
  (layout-analysis-1920x1080 and its plain twin, layout-ops-1920x1080, layout-focus-3840x2160, page-out-of-range-plain,
  arabic-analysis-filters-plain). Everything else is done and green: see "Next stages" 1.

## Changed on purpose
**On the tip (the measure):**
| recording | base | new | why |
|---|---|---|---|
| mcp/test-0.3.2-sp29.mjs K1 | the facade's names equal the base's | equal without `pageFill`; K2 (new) pins that it is the engine's and the metrics' own; 21 -> 22 checks | a name added on purpose |
| mcp/test-0.3.2-sp6.mjs B1 | the facade's names equal the base's | equal without `pageFill` | the same |
No other suite moved: the 23 that the layout change fails all pass on the measure alone (run on the tree of e9da907d).

**In 38b8ffdb only (reverted on the tip; every one comes back with it):** by attribution, each passes on the measure alone
and fails with liftCards, so every moved byte is the arrangement's.
| recording | base -> new |
|---|---|
| fixtures/fb1-pins.json | 30 of 80 plans, the table above; sums 28 / 13.8 / 9.3 -> 10 / 10.6 / 6.8 |
| fixtures/fn1j-pins.json (FN1J_RECORD) | 43 of 90 plan_layout answers (every plan with a side rail, and every two-page plan: its Details page) |
| fixtures/fn1f-pins.json (FN1F_RECORD) | 22 of 56 builds |
| fixtures/fn1c-builds.json (--record) | 1 build (W2 w3) |
| fixtures/sp1-answers.json, sp3-answers.json, sp4-answers.json, sp7-reports.json, sp13-reports.json (SPn_RECORD) | 6, 7, 3, 6, 3 plans or reports: the sample's and the models' two-page reports and the rail cases |
| fixtures/sp5-zips.json, sp28-builds.json, sp43-split.json (SPn_RECORD) | the website writer's two-page builds (sp5 4 checks, sp28 3, sp43 10) |
| fixtures/sp23-approval.json, sp44-approval.json (SPn_RECORD) | 3 approval pages each (the report plans' previews) |
| fixtures/sp29-design.json G1 (SP29_RECORD) + test-0.3.2-sp29.mjs | a fit with the cards over the rail is one marker line in G1 for the engine and for the base (124 of the suite's fits, pinned by L1, new); every other layout still the base's byte for byte, B1 live; 22 -> 23 checks |
| test-0.3.2-sp3.mjs L1 BASE_EXT | e3986dff... -> d87bede3...: the Details chart, 312 high, holds as many categories as the other chart by the same column, so the two share one Keep and one Title measure; "... (2)" and its Arabic one are no longer written (the two files diffed: nothing else) |
| test-rc24.mjs T-1 | 4 -> 3 Arabic title measures: the same reason |
| test-0.3.1-sq13.mjs S10 | [392, 308, 329, 245, 18] -> [18, 18, 18, 18, 18] |
| test-0.3.1-ts1.mjs T5b | the column chart beside the rail 168 -> 312 high |
| test-0.3-preview-fidelity.mjs F-01 | a card title 13.3 (10pt) -> 17.3 (13pt): the six cards are wider |
| test-0.3.2-dd2p.mjs H13, H14 | the zipped made-up report is one page, was two (its second page has a rail): the two hashes are the base's bytes for that input, B13 and B14 prove the base's engines still write them |
| test.mjs round18 (the ring in a table) | the small table's page: filters 'end' -> 'top' (the table beside a rail at the end is 306 high now, its ring 54, no longer "small") |
| mutation | fails only while sp44 does (its baseline); passes after the re-record |
Not remade (the owner's approval needed): scripts/tests/fixtures/design-engine/project-pages.json, 6 backgrounds.

## Before -> after
| | base 31f35e4a | tip (the measure) | with 38b8ffdb |
|---|---|---|---|
| plans with a hole, of 80 | 28 (not measured before) | 28, pinned | 10 |
| the worst hole, % of the body | 13.8 | 13.8, pinned | 10.6 |
| the flattest chart, w / h | 9.3 | 9.3, pinned | 6.8 |
| SQ13 S10 gaps | 392, 308, 329, 245, 18 | the same | 18 x 5 |
| MCP suites | 241 | 242 (fb1 94 checks; sp29 21 -> 22) | 242 (sp29 23) |
Full local runs (npm test -- --keep-going): with 38b8ffdb's tree, "run-tests: 242 suites passed"; the tip's tree is e9da907d's, whose CI is green (below) and whose 23 once-failing suites all pass locally.

## CHANGELOG line
On the tip, in mcp/CHANGELOG.md [Unreleased]: "A new measure says how well each planned page is filled: the largest
empty area, the flattest and the lowest chart. A new test pins it on 80 plans of made-up models, so a layout change now
shows its whole effect as numbers before it ships. Nothing a tool writes or answers changes."
With 38b8ffdb (not added yet): "A page with its filters in a side rail is filled better: the KPI cards run across the whole
page above the rail and the charts beside the rail take the rail's height, so the room under the rail is no longer left
empty and the Details page's main chart is 312 high on a 1920 x 1080 page, not 168. Pages without a side rail are unchanged."

## Decisions I made
1. **The challenge:** the hub's candidate stands (phase 1). Inside it, geometry before predictions: geometry is measurable
   here to the pixel; a prediction's truth is only on the laptop.
2. **A measure before any fix,** in design-metrics.js itself, not a new file: it is layout geometry (that file's job,
   MODULES.md), fitSlots reads it, and a new script would have to be loaded by three website pages before the engine.
3. **A hole is the largest empty rectangle with both sides over two gutters,** inside the box around the body's slots. Not
   "uncovered area": gutters are not waste, and one rectangle is what a person sees and what a note can quote (312 x 308).
4. **The first arrangement is the cards' row over the rail,** chosen by the measure, never by a new case: where it does
   not measure better (one slicer on 1920 x 1080; two slicers on a focus page) the page stays as it is.
5. **Held back, not merged into the tip** (the two reasons above). I did not stop at "blocked": the whole MCP side is
   done and green in 38b8ffdb, so the owner's yes costs one revert of a revert, six website fixtures and a CI run.
6. **The parity guards stay true rather than re-based:** sp29 masks only the fits the arrangement moves (counted, pinned);
   dd2p zips a page both engines place the same. Neither lost a check.
7. Suite models: four made-up models, 80 plans, 7 s: every layout x side rail / top on two page sizes, plus end, none and
   960 x 720 on the sample. Page 2 (Details) is covered by the `analysis` plans (the same rail geometry) and, in 38b8ffdb, by
   ts1 T5 and sq13 S10 through the writer's own fit options.

## For the owner
1. **Yes or no to the cards' row over the rail** (it replaces your 26 Oct option (a) result on the second page: the main
   chart 312 high beside the rail instead of the 168 "trend strip"; and closes the four gaps left open then). What you
   would see is in "For the laptop". Your yes also covers remaking the website's 6 page backgrounds.
2. No new Arabic sentence, no new plan words (D-1109-07, TS-2: nothing to measure).

## Risky changes
- On the tip: none (no written file, answer or page changes; CI green, run 42880588188 on 9b0f9e66; the report area 78 suites passed locally after the merge).
- In 38b8ffdb: every report with a side rail and at least one KPI card is placed differently (page 2 of every default
  report). Exact checks pass (Microsoft's validator, the measured rules, the layout check: 0 problems on the sample's
  reports), but the look is unseen in Desktop. A two-slicer rail (228 high) presses the executive page's first row to
  228 of 440 (0.52, over REFLOW_KEEP): no hole, but the main trend is the lower row's junior: stage 2 re-shares it.

## For the laptop (made-up data only: the sample project; after 38b8ffdb is restored)
1. plan_layout sample true, then create_report on it with layout exec, filters start, 1920 x 1080. Page 1: four cards
   across the page from 24 to 1896 at y 105; the rail 24,267 294 x 312 with three dropdowns and Reset; the line chart
   336,267 1034 x 312; the bar chart 1388,267 508 x 312; the row under at y 597, 459 high, from x 24. Nothing empty under
   the rail. PASS if Desktop draws these boxes and no title, axis label or legend is cut in the 312-high charts.
2. The same report's page 2 (Details): three cards 612 wide; the chart 336,249 1560 x 312 (a bar chart by Country: 4
   bars, none thicker than 45); the table 24,579 1083 x 461 and the bar chart 1125,579 771 x 477. PASS if the chart reads
   as a chart, not a strip, and the table shows its 4 rows and Total with no scrollbar.
3. The same with lang ar (approve the Arabic names it asks for): the mirror of 1 and 2, the rail at the right.
4. layout ops, kpis 6, filters start: six cards 302 wide; PASS if each card's title is whole at 13pt on one or two lines.
5. Open decision carried from TS1 ("168 ... acceptable as a trend strip, the laptop confirms"): no longer needed if 2 passes.

## Seen, not in scope
1. On the sample, where every count is known, the Details table keeps a 461-high panel for 4 rows and Total, and the bar
   chart beside it 477 for 2 bars: the layout never hears what a visual needs (stage 3).
2. The focus page with a rail keeps a hole (8.4% at 1920 x 1080, 312 x 477 under the rail): its one row cannot end at the
   rail's bottom (312 of 789 is under REFLOW_KEEP) (stage 2).
3. With 38b8ffdb, a rail page's first row can be lower than its second (312 over 459 on the executive page): rows are not
   re-shared after a reflow (stage 2).
4. The Details page's main chart is written as a bar chart at 312 high and as a column chart at 168 (pbip-visuals-charts.js,
   the text-category rule): the chart's kind follows its height. Right or not, it is said nowhere in the plan.
5. `LAYOUT_PREVIEW` still tells the person three of four layouts are "still being tuned" (design-metrics.js:167); with a
   measure, the line could name what is not tuned, or go, per layout: the owner's words.
6. scripts/tests/sp29.mjs and sp6.mjs (website) pass with 38b8ffdb: the generator page's own canvas draws computeSlots, not
   the fitted page; only the project download's backgrounds follow fitSlots.
7. The full local MCP run takes about 50 minutes on this container, CI 15: the pins' re-record loop is the slow part.

## Lessons for the reviewer
- A layout change's cost is not its code (about 40 lines) but its recordings: 20 suites pin whole plans or reports by hash,
  so one moved box re-records 14 fixtures and edits 7 checks. Attribution made it safe: run the failing suites once with
  the measure alone (all pass), then every moved byte belongs to the one rule. Ask each layout job for that run.
- A hash pin cannot say what moved. Where I had to know (sp3 L1), I dumped the file under both engines and diffed it. A
  pin that also stored a short readable digest (boxes, counts) would have saved that.
- Two rules in the repo gate layout work on the owner (SEEN-QUEUE.md:193, capture-design-fixtures.mjs:9). A brief for
  layout work should say whether his yes for those is given, or the builder should prepare-and-hold as here.
- AT1's Arabic title change and 38b8ffdb re-record the same fixtures (sp3, sp4, sp7, sp13, sp23, sp44, fn1f, fn1j): whichever
  merges second re-records after the merge, never resolves the hashes by hand. The commands are in "Next stages" 1.
- CI's full job list through the GitHub tool is about 60 KB of JSON: ask for the run's conclusion, not its jobs.

## Next stages
1. **FB2: the cards' row over the rail, merged (half a day; needs the owner's yes, "For the owner" 1).**
   Goal: 38b8ffdb on integration. Scope: `git revert 3d787177` on a branch from integration (it restores liftCards, settle,
   14 fixtures and 7 checks); if integration moved the pinned bytes meanwhile, re-record instead of resolving: `for f in
   sp1 sp3 sp4 sp5 sp7 sp13 sp23 sp28 sp43 sp44 sp29; SPn_RECORD=1 node test-0.3.2-$f.mjs`, `FN1F_RECORD=1`,
   `FN1J_RECORD=1`, `node test-0.3.2-fn1c.mjs --record`, `FB1_RECORD=1 node test-0.3.3-fb1.mjs`; remake the 6 website
   backgrounds (`node scripts/tests/capture-design-fixtures.mjs`, check that only those 6 cases of project-pages.json
   move); `npm run build:min`; the CHANGELOG line above. Red-first: fb1 on the tip with 38b8ffdb's code is red by exactly the
   30 plans of the table (seen on 95ebdb3c). Measure: 10 of 80, 10.6%, 6.8; sq13 S10 all 18.
2. **FB3: rows re-shared after a reflow, and the focus page (a day).** Goal: after a row ends at the rail's bottom, the
   rows under it share the room by the layout's own flex (the executive page's trend no lower than its second row);
   the focus page's hole closed by a third arrangement (the rail beside the text box's column, or the row split at the
   rail's bottom), each kept only where pageFill prefers it. Scope: fitSlots only. Red-first: new fb1 pins for "low" on
   the exec rail plans and the focus holes. Measure: 10 -> at most 4 plans with a hole, worst under 5%, and no rail page
   whose first row is lower than its second.
3. **FB4: what a visual needs (a day).** Goal: where counts are known (the sample, columnStats), fitSlots takes
   `needs` (a table's rows through pbip-sizing.js tableHeight, a bar chart's bars through barBand) and gives spare
   height to the charts. Scope: pbip-page.js fitOf, design-metrics.js fitSlots, pageFill gains `inner` (the room a
   visual leaves inside its own box). Red-first: on the sample's Details page the table's panel is 461 for a need of
   about 230. Measure: inner empty share of the sample's pages, before -> after; no change where counts are unknown.
4. **FB5: predictions against Desktop (a day here, after one laptop session).** Goal: one fixture of what Desktop drew
   (widths of 40 made-up titles and headers in Segoe UI and Tahoma, English and Arabic, at 3 sizes; which month labels
   slanted at which width), then textWidth, AR_HEADER_WHOLE and the slant rule checked against it. Scope: text-measure.js,
   report-rules.js headerNeed, page-preview.js; the laptop script that prints the fixture (structure and made-up names
   only). Red-first: the fixture's rows the rules get wrong today (B-173's 0.71 to 0.73, text-measure.js:14-17's 219.9).
   Measure: header-cut false positives and missed cuts against the fixture, label slants predicted vs seen.

## After the merge of integration (written 2026-11-10T19:13Z)
- origin/integration/0.3.3 (028c6a9d, AT1 merged) merged in once, 9b0f9e66: one conflict, mcp/CHANGELOG.md, both lines
  kept. Then: `npm test -- report --keep-going` "78 suites passed (report)"; check-modules --strict, test-contracts,
  check-contracts, check-min, check-result-lines, test-site-config PASS; lint 0.
- AT1 re-recorded sp1, sp3, sp23, sp43 and fn1j for its Arabic title words: 38b8ffdb's copies of those fixtures are
  older than integration's now, so "Next stages" 1 re-records them after reverting 3d787177, as written there.
- mcp/WORK.md has no FB1 line: it stands at its cap; the reviewer writes it at the merge.
