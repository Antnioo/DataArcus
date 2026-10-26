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
- **Resume:** the plan below, then the work.

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
