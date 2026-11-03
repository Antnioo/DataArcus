# NC2 (0.3.1): the native copy's plan made honest (NC1's lab, "Seen" 1, 3, 4, 5, 9)

## Summary
- **Approval:** the owner's question of 26 Oct ("a report of 5 pages having custom visuals: can DataArcus replace them
  all with native ones and clean up the clutter"); NC1's lab showed the plan is not honest enough; the reviewer approved
  fixing NC1 "Seen" 1, 3, 4, 5, 9 now. The brief "Go on NC2". Builder; the reviewer reviews and merges.
- **Scope:** `mcp/lib/visual-meaning.mjs` (confidence, losses, the closer natives), `mcp/lib/native-copy.mjs` (the lead
  line, the second option), `assets/js/visual-replace.js` (+ `.min.js`: target markers, the heat shading, added
  fields), `mcp/tools/plan_layout.mjs` and `mcp/lib/approval-window.mjs` (the approval page's rows), the input
  `customVisualsSecond` (`report-inputs.mjs`, `create_report.mjs`, TOOLS.md), the lab (`expect` of two visuals) and its
  suite. Not CS1's (`redesign.mjs`, `text-format.mjs`, check-report FORMAT_MIXED) nor GL1's (glass look, design engine).
  NC1 Seen 6 and 7 wait for CS1 (the reviewer sends them).
- **Base:** `fix/0.3.1-nc2` from `origin/integration/0.3.1` 646947f. Push only it; no merge, no PR.
- **Expected checks:** custom-visuals-lab 38 -> about 50 checks (the new ones red on 646947f first); the lab's plan: 11
  replaced, 0 high, 7 medium, 4 low, 11 of 11 guesses; bullet -> lineClusteredColumnComboChart (was clusteredBarChart),
  calendar heatmap -> pivotTable (was lineChart), the other 9 unchanged; validator 0 errors on the native copy;
  `npm test -- report` 30 suites, `-- core` golden byte for byte, the full run 93 suites; check-result-lines,
  changelog-words, check-agent-memory PASS.
- **Got:** custom-visuals-lab 38 -> 56 checks PASS (18 red on 646947f first, then NC2-3g added); 11 replaced, 0 high,
  7 medium, 4 low, 11 of 11 guesses; the bullet a combo, the heatmap a matrix, the rest unchanged; validator 0 errors on
  the native copy; `npm test -- report` "run-tests: 30 suites passed (report)"; `-- core` "6 suites passed", golden 12
  tasks match; v029visuals, shared-axes, r6-disclosure, write-gate, approval-hardening, audit-writes, sq15a PASS; full run
  "run-tests: 95 suites passed" (the registry is 95 at this base); check-result-lines 95, changelog-words 150,
  check-agent-memory, test-site-config PASS.
- **Resume:** done; waits for the reviewer, then the laptop ("For the laptop").

## The plan (before the work)
1. **Confidence from evidence** (Seen 5). In `nativeFor` (the meaning's own `confidence` stays: test-0.2.9v reads it):
   high = the package's own roles (dataRoles) AND a known visual id (the id's words name the kind written); medium =
   one of the two (or the package's roles with every role named); low = inferred from the fields' kinds alone. Each
   replacement carries `evidence` (in words); the plan says each level's meaning once (`confidence.levels`) and its
   lead line (`lead`) how many are guesses. Expected on the lab: 0 high, 7 medium, 4 low; "11 of 11 are guesses".
2. **Every loss named** (Seen 4, 9). A short table of forms by the id's words (tornado, bullet, word cloud, calendar
   heatmap): each replacement's `lost` says in words what the reader no longer sees. "its own format settings (1:
   labels)" becomes which were kept (as what) and which were not carried over.
3. **Closer natives first, the current one second** (Seen 1, 3). From Microsoft's capabilities
   (@microsoft/powerbi-core-visual-schema): the bar chart has error bars (`error`, markers incl. longDash; Learn: "Add
   error bars", by field), but `error.errorRange` is `{"errorRange":{}}` in the schema: its JSON is not described and
   not measured, so it is not written (measure, don't estimate; for the laptop). A constant line
   (`y1AxisReferenceLine.value`) is one numeric value per chart, not a target per bar; a card's or KPI's target is one
   value. So the bullet's first option: the line and clustered column combo, the value as columns and the target as
   markers only on the same axis (`lineStyles.strokeShow` false, `showMarker` true, `markerShape` longDash; secShow
   false as today); second: today's bars. The calendar heatmap's first option: a matrix (pivotTable), year and month
   by weekday (columns from the date's own table that the model sorts), the value shaded by conditional formatting
   (`values.backColor` as a FillRule linearGradient2, the writer's measured form for `dataPoint.fill`); second:
   today's line; no weekday or month column: the line, said why. The word cloud: a bar ranked by value, said.
   `customVisualsSecond` (["page:x,y"]) picks the second option, only the user's choice.
4. **The approval page** shows each replacement's confidence and evidence, its losses and its second option.

## Before -> after (the lab's plan, sharedAxes answered "comparable")
1. **Confidence** (Seen 5): before 7 high, 3 medium, 1 low, every one "a guess"; after 0 high, 7 medium (the id's
   words name the kind written: KPI tile, dial gauge, drill bar, chip slicer, data grid, multi card, smooth line), 4 low
   (inferred: bullet, word cloud, tornado, calendar heatmap). Lead line: "11 replacements: 0 high, 7 medium, 4 low; 11 of
   11 are guesses (the report holds no package for them: ...)". `confidence.levels` says each level once; each
   replacement has `evidence`. Test: NC2-1a to e.
2. **Losses** (Seen 4, 9): before "its own format settings (1: labels): the report's theme formats the native
   visual" for every form; after the tornado "its two-sided layout (its two values drawn left and right of one centre
   line, per category): the native chart draws both bars side by side from the same axis"; the bullet its horizontal
   bars and its bands (the second option: its target marker); the word cloud "its cloud (each word sized by its value
   ...): the native bar chart ranks the same words by the same value, longest bar first"; the calendar heatmap "its
   calendar grid of one square per day: ...". The format line: "its own format settings (1: labels): kept: labels (as
   the native value labels); not carried over: none; the report's theme formats the rest". Test: NC2-2a to e.
3. **Closer natives** (Seen 1, 3): the bullet clusteredBarChart -> lineClusteredColumnComboChart (Total Sales as
   columns, Sales Target as long-dash markers, no line, one axis), second option clusteredBarChart; the calendar
   heatmap lineChart -> pivotTable (Rows Calendar Year, Month; Columns Weekday; Total Sales shaded), second option
   lineChart; the word cloud stays a bar, its loss says the bars rank by value. `customVisualsSecond ["2:24,172",
   "4:24,160"]` writes the second options; an unknown key refuses the plan. Validator 0 errors on the native copy.
   Unanswered axes: the bullet still splits into 2 panels (now clustered bar charts, its own bars). Test: NC2-3a to f,
   CL-3b, CL-6c.
4. **The approval page** (customVisualsShown, `shownOf`): "In short" with the lead line and the three levels, then per
   replacement "confidence: low (no package in the report: ...)", every "loses ...", and "second option: ..." with its
   key and its losses. Test: NC2-4.

## CHANGELOG line
"Custom visuals replaced, said honestly" in `mcp/CHANGELOG.md` [Unreleased]: the lead line and the levels (high only with
the package and a naming id), each loss in words and the settings kept, the bullet's markers and the heatmap's matrix,
the earlier replacement offered second (`customVisualsSecond`).

## Decisions I made
1. The meaning's own `confidence` (meaningOf, read by test-0.2.9v) is unchanged; the evidence-based one is nativeFor's,
   which the plan, read_report (`meaningInReport`) and the approval page show. "A known id" = the id's words (FAMILY_HINTS)
   named the kind written and the fields could show it; a hint from the format objects does not count. Without a
   package a network keeps the meaning's level, capped at medium.
2. The bullet's target: error bars are the closest on a bar (Microsoft's capabilities: `error`, markers shortDash and
   longDash; Learn "Add error bars": by field, absolute), but `error.errorRange` is `{"errorRange":{}}` in the schema, its
   JSON not described or measured: not written (measure, don't estimate). A constant line (`y1AxisReferenceLine.value`,
   numeric) is one value per chart; a card's or KPI's target one value. So the combo with markers only: every property
   is a plain literal of `lineStyles` in the capabilities (strokeShow, showMarker, markerShape longDash, markerSize 12).
3. The heatmap's matrix: Rows the year (a whole-number "Year") then the month (a sorted name, or its number), Columns the
   weekday (a sorted name, or its number), all from the date column's own table, matched by their names' words only
   (never shown, never followed). The shading is the round-13 FillRule (linearGradient2, nullColoringStrategy asZero)
   on `values.backColor`, selector all data points plus the value's queryRef; ends #f3f8fe to #8cc2f5, light enough
   for dark text (a dark theme's light text would read poorly on them: for the laptop).
4. The second option is a create_report input (`customVisualsSecond`, keys "page:x,y", no names), in REPORT_LOOK so it
   is pinned and create_report takes the plan's when left out; an unknown key refuses the plan.
5. `visual-replace.js` has no `.min.js` and no website page loads it (MCP-only): `build:min` reports all 74 match; no
   `?v=`, CSP, ar-pages or sitemap change; `test-site-config` PASS.
6. The panels split (unanswered shared axes) of the bullet's combo uses clustered bar charts (the custom visual's own
   bars); the target markers are written only on the combo, never on a panel.

## For the laptop (the lab's native copy in Desktop, with `mcp/lab/CUSTOM-VISUALS-LAB.md`)
1. Page 2, the bullet: columns of Total Sales per branch with a long dash at each branch's Sales Target, no line between
   the dashes, one value axis. If the line still draws or the dashes are missing: screenshot and the visual.json.
2. Page 4, the calendar heatmap: a matrix, rows 2025 and 2026 (then their months: does it open at years? "Expand all
   down one level"), columns Sun to Sat in order, cells shaded pale to mid blue by Total Sales, the text readable.
3. The plan's words: the lead line, each confidence with its evidence, the losses and the two second options as the
   approval page shows them (full-size crop of that section).
4. Optional, for a later item: save a bar chart with error bars (by field, upper and lower bound the target) in Desktop
   and keep its visual.json: it would measure `error.errorRange`, the closer target on a bar.

## Seen, not in scope
1. NC1 Seen 6 (the redesign's name cap collision) and 7 (the grid's touching rows): CS1's file, the reviewer sends them.
2. NC1 Seen 8: title sizes and fonts stay mixed without CS1's consistent option.
3. The heat shading's ends are fixed light blues, not the report's theme: on a dark theme with light text the cells may
   read poorly (for the laptop; a theme-aware end would need the report's theme read by the native copy).
4. The matrix's year rows may open collapsed (no measured `expansionStates` for a matrix): the plan says how to expand.
5. Error bars (`error.errorRange`) would give a bar its own target marker; their JSON needs one Desktop-saved example.
6. The plan line's `why` still begins with the meaning's words ("the id's words hint at a gauge, set aside") before the
   closer native's: correct, but long for the bullet.
