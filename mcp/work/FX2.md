# FX2 (0.3.1): the laptop part 3's finds in blocks A, C and H on 0.3.1-rc.2

## Summary
- **Approval:** the reviewer's brief "Go on FX2" (28 Oct); the owner, D-1027-03 (a title all Arabic or all English),
  D-1027-04 (an Arabic report's titles drafted in Arabic and approved), D-1027-12 (the twin identical), D-1027-13.
- **Base:** `fix/0.3.1-fx2` from `origin/integration/0.3.1` at 5690ea8 (SPD, P3A merged). Push only this branch.
  Not FX1's files (mcp/lib/twin-pages.mjs's Reset, the website Health Check page, approval-window.mjs's Arabic labels).
- **Scope:** H-1 (the twin's legend positions and every enum it swaps, against Microsoft's catalog), C23 (a bar chart
  over the table: the rail's reflow, and the exact check that let it pass), A-1 (Arabic titles of counted and summed
  columns on a model with no measures), C03 (the band above the focus chart beside the rail), C Seen 2 (TOOLS.md).
- **Expected checks:** (written before the work) a new suite `fx2`, about 25 checks, each red on 5690ea8 first:
  H (every legend position in, a catalog value out; the shadow presets; the alignments and icon values the mirror
  writes; Microsoft's validator 0 errors on a twin of a line chart at each legend position), C (C23's slots: no two
  data visuals overlap; the exact check blocks an overlap of two data visuals), A (no-measures, ar: the counted and
  summed columns are drafted, the plan gives no plan id until they are, their titles «عدد ...», «مجموع ...»), F (C03:
  the chart starts at the rail's top), T (TOOLS.md names the four options). `0.3.1-cx2` S1 and S5 change on purpose
  (Left/Right are not catalog presets: CenterLeft/CenterRight turn instead; said per check). Goldens, `0.2.9-layouts`,
  `0.3.1-ts1`-like layout suites: any page with a rail beside a row of two charts may change (said per test).
  Full run: the base's 114 suites + 1 (fx2) = 115.
- **Got:** `fx2` 20 checks, 18 red on 5690ea8 first (the other 2 read the catalog and build the fixture);
  `0.3.1-cx2` 16 = 16 (S1's two middle pairs changed on purpose: CenterLeft/CenterRight); `phone` 355 = 355 (its
  no-measures Arabic case keeps Order Id English on purpose, as CX1 did for the other models); areas twin 12, arabic
  15, checker 6, report 40 suites pass; no golden changed; website run-all, site config pass.
- **State:** the work committed; the full run next.
- **Resume:** the full run, then CI.

## The plan
1. **H-1** `assets/js/report-mirror.js` LEGEND: Microsoft's catalog (@microsoft/powerbi-core-visual-schema 0.1.3,
   every chart's `legend.position`) has Top (top left), TopCenter, TopRight, Bottom, BottomCenter, BottomRight, Left,
   LeftCenter, Right, RightCenter; no TopLeft or BottomLeft. Mirror: Top <-> TopRight, Bottom <-> BottomRight,
   Left <-> Right, LeftCenter <-> RightCenter; TopCenter, BottomCenter stay; a value outside the catalog is kept and
   said (the twin plan's kept list). SHADOW_SIDE: the catalog's dropShadow.preset has CenterLeft/CenterRight, not
   Left/Right: those turn instead. Every other value the mirror writes checked against the catalog in the test.
2. **C23** `assets/js/design-engine.js` fitSlots: the rail's reflow ends the slots beside the rail at its bottom and
   moves the slots under them up; the bar chart in the same row (not beside the rail) kept its height, so the table
   moved up under it. The fix: the whole row ends there (each keeping REFLOW_KEEP), else nothing moves. The check:
   `mcp/lib/artifact.mjs` blocks an OVERLAP of two data visuals (not a panel, not a card behind its own table).
3. **A-1** `tools/plan_layout.mjs`: the columns counted or summed (Bind.counts) are fields the Arabic plan names
   (suggested or proposeYourself, titlesInEnglish.fields, no plan id until drafted); `lib/report-run.mjs` named(): a
   counted or summed column with an approved name is «عدد <name>» / «مجموع <name>» (English: Count of / Sum of).
4. **C03** fitSlots' second branch (the chart under the rail): a chart at the rail's own top only when the band it
   leaves above it is no larger than the rail's column it fills; else it stays beside the rail, at its top.
5. **C Seen 2** `mcp/TOOLS.md`: flipCards, statusIcons, metricSwitcher, gallery: what each writes and its limits.

## Results (before -> after)
| Find | Before | After | Where | Test |
|---|---|---|---|---|
| H-1 legend | TopRight -> TopLeft, BottomRight -> BottomLeft (not in Microsoft's catalog: PBIR_FORMATTING_ENUM_INVALID); Top -> TopRight | Top <-> TopRight, Bottom <-> BottomRight, Left <-> Right, LeftCenter <-> RightCenter, TopCenter and BottomCenter stay; a value outside the catalog kept and named in the twin plan's `cannot` ("positions with no mirrored value") | report-mirror.js LEGEND, chartRtl `kept`; mirrorPage `kept`; twin-plan.mjs | fx2 H1-H3, H6 |
| H-1 shadow | Left/Right swapped (not catalog values); CenterLeft/CenterRight left unturned | CenterLeft <-> CenterRight; a value outside the catalog kept and said | report-mirror.js SHADOW_SIDE | fx2 H4; cx2 S1 |
| H-1 every enum | not checked | every enumerated property the twin writes (the writer's own report of every kind and the 11 legend cases) is a catalog member; Microsoft's validator 0 errors | the catalog's capabilities and vco-capabilities | fx2 H5, H7 |
| C23 | a rail beside a row: only the chart touching the rail ended at its bottom; the row's other chart kept its height and the row under moved up beneath it (bar 70-425 over the table from 307). The sweep: 40 of 384 plans (exec, 0 KPIs, rail start or end, every size; ops 960 x 720), each with exactCheck "pass" | the whole row ends at the rail's bottom (each keeping REFLOW_KEEP), else nothing moves; an OVERLAP of two data visuals in the exact build blocks the plan. The sweep after: 0 of 384 | design-engine.js fitSlots; artifact.mjs checkArtifact | fx2 C1-C4 |
| C03 | the focus chart moved under the 312-high rail, a 1069 x 320 band empty above it | a chart that starts at the rail's own top moves only when the room it fills under the rail is at least the band it leaves (one under a KPI row moves as before: round 9, S7); here it stays beside the rail from its top (y 105, 1063 x 951); the rail's column under it is empty (294 x 620) | design-engine.js fitSlots | fx2 F1 |
| A-1 | no measures, lang ar: the counted and summed columns were not in the Arabic names list, so the plan said "kept English on purpose" and gave a plan id: "Count of Order Id", "Sum of Amount"; with a name approved the count lost its word («رقم الطلب») | they are drafted like every field (the fixed list's «المبلغ», «الكمية»; Order Id in proposeYourself), no plan id until each has a name; `arabicNames.countedTitles` lists each title's English and its Arabic draft; the titles «عدد رقم الطلب»، «مجموع المبلغ»، «عدد رقم الطلب حسب اسم الشهر» | plan_layout.mjs (counted), report-run.mjs named() | fx2 A1-A5; phone |
| C Seen 2 | TOOLS.md named none of the four | a table: what each writes and its limits, from the code (flip-cards.mjs, status-icons.mjs, metric-switcher.mjs, report-inputs.mjs) | mcp/TOOLS.md | fx2 T1 |

Changed on purpose: `0.3.1-cx2` S1 (two pairs: CenterRight/CenterLeft for Right/Left; 16 = 16 checks); `phone`'s
no-measures Arabic case keeps `Orders[Order Id]` English on purpose (its checks are about the phone layout; 355 = 355).

## CHANGELOG line
"What a test run in Power BI Desktop found": the twin's legend and shadow positions only into ones Power BI has; a
rail's row ends together and the check refuses two charts overlapping; the focus chart with no KPI cards at the top;
an Arabic report's counts and sums named in Arabic and listed for approval; the tool reference's four options.

## Decisions I made
- The legend map is written in the engine (the website reads it too, and cannot load the npm package); the test reads
  Microsoft's catalog and checks every value the mirror writes against it, so a new catalog value or a wrong map fails.
- A value outside the catalog (TopLeft, an old file's) is kept as the file has it and said, as the brief asks, rather
  than "fixed" to a valid one.
- The rail's reflow ends the whole row (not only the chart touching the rail): the row stays one line, which the
  owner's grid asks; the alternative (the table not moved up) left a gap under the column chart only.
- An OVERLAP finding in the exact build blocks the plan (every OVERLAP the sweep found was this defect; covers and a
  card behind its own table are not OVERLAP).
- C03: the area rule (fill at least what it empties) holds only for a chart at the rail's own top. My first version
  applied it to every chart beside a short rail and the website's `design-engine` lab fixture (the second page under a
  KPI row, round 9 S7's own case) changed: narrowed, the fixture is unchanged.
- A-1: «عدد <name>» and «مجموع <name>» exactly as the brief words them, built from the field's approved name.

## For the owner
- «عدد رقم الطلب» reads literally ("count of order number"); a natural «عدد الطلبات» would need a title approved on its
  own, not a field name: say if you want that (a new option, not in this job).
- C03: the chart now fills the page's height beside the rail, and the rail's column under it stays empty (294 x 620).

## Risky changes
- What a plan answer returns: `arabicNames.countedTitles` (at most 30 titles; names only, never a value).
- The approval step: a plan whose exact build has two overlapping data visuals now gets no plan id (OVERLAP blocks).
- The twin plan's `cannot` can name "positions with no mirrored value" (at most 30).

## For the laptop
- Re-run C23 and C03 as quoted; any exec page with 0 KPIs and a filter rail (start or end), and ops on 960 x 720.
- Twin of Microsoft's dataset 1 report: the line chart's legend at the top left of the Arabic page; validator 0 errors.
- C10, C12, C27 in Arabic: approve the Arabic for Order Id (and the drafts for Amount, Quantity): every title Arabic.

## Seen, not in scope
- 1. The metric switcher's labels in an Arabic report on the sample: "Order Count", "Units Sold" stay English (the
  plan's display names; no draft for them is asked). Owner's rule D-1027-04 may want them drafted: for him.
- 2. Focus, 3 KPI cards, a rail (1920 x 1080): the chart moves under the rail, a 176-high band beside the cards stays
  empty (the area rule keeps today's layout there).

## Lessons for the reviewer
- A map of Power BI values belongs next to a test that reads Microsoft's catalog: the guessed "TopLeft" passed review twice.
