# FX5b (0.3.1): the bars' thickness for a plain text column (counts given, the sample's own counts), said in the plan

## Summary
- **Approval:** the reviewer's brief "FX5b" (28 Oct, after FX5's merge 396aaab2): the rest of the owner's D-1028-06
  ("why would i have a bar chart with three bars same length ... not make the bars that wide"): his chart is on a plain
  text column, whose count FX5 did not know. Binding: D-1027-12 (the twin identical), FX5's rule unchanged.
- **Scope:** `mcp/lib/tool-inputs.mjs` (one `columnStatsInput`: suggest_fields' shape and words), `mcp/lib/report-inputs.mjs`
  (create_report's `columnStats`, pinned with the report's options, so plan_layout takes it with create_report's own
  definition), new `mcp/lib/sample-counts.mjs` (the sample's counts from its exported `sampleFiles`), `mcp/lib/report-run.mjs`
  (the counts to the writer; the padded charts said EN and AR), `assets/js/pbip-page.js` (+ .min.js, `?v=`; the writer
  reads the counts and lists each padded chart), `assets/js/pbip-notes.js` (the list in the build's result),
  `mcp/TOOLS.md`, CHANGELOG, new suite `mcp/test-0.3.1-fx5b.mjs`. Not FX3's or FX6's files (plan_layout.mjs,
  suggest_fields.mjs, sample-project.mjs, approval-window.mjs, report-mirror.js, ...).
- **Base:** `fix/0.3.1-fx5b` from `origin/integration/0.3.1` (396aaab2). Push only this branch.
- **The plan:** a chart's count n = the fewest of its Top N, the count known from the model's metadata (FX5), and
  `columnStats.distinct["Table[Column]"]` (create_report's and plan_layout's new input, counts only: the same schema
  as suggest_fields', proved equal by test since suggest_fields' is not exported and is FX6's to change). For the
  sample project, the counts come from DataArcus's own definition (`sampleFiles`), only when the model on disk is
  byte for byte the sample it writes (an edited sample gets none). The build lists each padded chart: page, visual
  kind, count, padding, thickness, maximum; never a category's name or value; in plain words EN and AR.
- **Expected numbers (before the work):** a bar chart on a 3-value text column, 277 high at 1280 x 720, columnStats
  distinct 3 -> padding 36 (bars 35.4); without columnStats -> nothing (its Top N, 8, fits: 18.6 each). The sample at
  1920 x 1080 (exec, filters top, second page): Details' 1,872-wide column chart by Country (4) -> 88 (44.3); the
  Channel bar charts (2): 927 x 372 -> padding from n 2 at span 235.5; 612 x 368 likewise; Country's 277-high bar chart
  (4, span 140.5, 28.1 each) -> nothing. Exact values in the test.
- **Expected checks:** new `fx5b` about 20 checks, red on 396aaab first except guards (no columnStats unchanged, an
  edited sample gets no counts, no value in the answer); schema parity with suggest_fields; validator 0 errors.
  Other suites: no number changed unless a golden's chart sits on the sample or passes columnStats (said per test).
  Full run: base + 1 (fx5b).
- **Got:** (to fill)
- **Resume:** the plan pushed; next the red test.

## Decisions I made
- (to fill)

## Seen, not in scope
- (to fill)
