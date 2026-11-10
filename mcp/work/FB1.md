## Summary
- **Approval:** the owner, 10 Nov: "start a session using it to tackle our toughest challenge with dataarcus" (relayed by the hub;
  the builder chooses the challenge with evidence, designs the answer, builds stage 1; never merges).
- **Base:** `feat/0.3.3-fb1` from `origin/integration/0.3.3` at 31f35e4a. Push only this branch; never merge, no PR.
- **Scope:** phase 1, the 3 toughest open problems ranked from the notes, one chosen; phase 2, the root cause as measured
  through the MCP tools on made-up models, the designs, the stages and their measures; phase 3, stage 1 built: a page-fill
  measure in the shared library (how much of a planned page is left empty, how squat its charts are), a suite that pins
  today's numbers on made-up models, and a first improvement the measure proves. Later stages: written plans only.
- **Expected checks:** a new suite (name and counts in "Plan" below, before the code), red on the base first; the report
  and core areas unchanged except the recordings listed under "Changed on purpose"; `node scripts/check-modules.mjs
  --strict`, `node scripts/test-contracts.mjs`, lint 0; CI green on the branch.
- **Resume:** phase 1 and 2 are being written (started 2026-11-10T16:41Z); nothing built yet.

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
