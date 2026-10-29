# R1: see the result (research + prototype; 20 Oct, cloud builder)

Branch `research/see-the-result` from `origin/integration/0.3.0-wave`. No PR, no merge. Not edited here (parallel
builders): mcp/CHANGELOG.md, mcp/WORK.md. No tool added, no default changed.

## CHANGELOG line
- R1 (research, no tool or default changed): `mcp/research/SEE-THE-RESULT.md` compares four ways to let the AI see what
  Power BI Desktop draws (a shadow-data render on the user's machine, a calibrated in-browser renderer, real-data
  screenshots on opt-in, the Power BI service) and designs the look-and-propose loop; two prototypes with tests:
  `mcp/lib/shadow-model.mjs` (a throwaway copy of a model with made-up typed rows) and `mcp/lib/box-diff.mjs` (a
  box-level score between two drawings of a page); `mcp/research/shadow-try.mjs` writes a fixture's shadow project for
  the laptop. Recommendation: (a) as the v1 (S2), (b) as the fast first look grown by measured rules, (c) later as a
  per-run opt-in, not (d).

## Plan (written before any code)
1. **Research** `mcp/research/SEE-THE-RESULT.md`: (a) shadow-data render, (b) higher-fidelity in-browser renderer,
   (c) real-data screenshots on opt-in, (d) the Power BI service / embed. For each: what the AI can judge (cut titles,
   overlaps, empty panels, label slant, density, colour balance, Arabic right to left), privacy (against
   mcp/PRIVACY.md, section by section), platforms, speed, cost, risks, effort. Then the loop (plan -> approve -> write
   -> render -> look -> list visible problems -> a NEW plan the person approves; never a silent rewrite), a
   recommendation, and the plan for S2 (the v1).
2. **Prototype 1, `mcp/lib/shadow-model.mjs`** (not a tool, not wired to the server): `shadowModel(tmsl, opts)` takes
   the model's JSON (what `loadModel` reads from TMDL, model.bim or a .pbit) and returns TMDL files for a copy:
   - every table keeps its name, columns (name, type, format, summarizeBy, sortByColumn, hidden, data category),
     hierarchies and measures (their DAX kept: a measure computes from the made-up rows); every partition is replaced
     by ONE Power Query partition `#table(type table [...], {rows})` with typed made-up rows (the owner's measured rule:
     an untyped row set loads every column as text); a calculated table's partition too (its DATATABLE may hold typed
     values), except a field parameter (NAMEOF: names, not data), kept as DAX;
   - made-up rows per type: dateTime over one year (2025), int64 whole numbers, double/decimal with 2 decimals (0-1
     for a rate or a % format), string from a neutral word list (Arabic words when the column's name is Arabic),
     boolean; deterministic (seeded by the names), so two renders of the same plan are the same picture;
   - relationship keys match: the "one" side unique, every "many" value present on the "one" side (one pool per
     connected key group); a date table (a unique date key) gets contiguous days and its Year / Month / Quarter /
     Day columns derived from the date by name; every sortByColumn pair is a function (one sort value per value);
   - row counts small: a table on a "one" side 6-40 rows (a date table 365), a fact 120;
   - what is dropped and why (roles, perspectives, cultures, shared expressions, data sources, descriptions,
     annotations, lineage tags), in `notes`; a column whose type the model doesn't give (a DAX table's) gets a type by
     its name and is listed in `guessed`;
   - `shadowProject(tmsl, { report })`: the `.pbip`, the SemanticModel folder, and the written report's folder copied
     with its `definition.pbir` pointed at the shadow model: what the laptop opens.
   Nothing is returned to the AI but counts and names already in the model; the rows are written to a temp folder only.
3. **Prototype 2, `mcp/lib/box-diff.mjs`**: `boxesOfSvg(svg)` reads the preview's drawing (each visual's frame, title
   band, placeholder plot, card value); `boxesOfPage(page)` the written report's visual boxes (page-preview's
   fromFiles); `compare(a, b)` matches visuals (kind, then nearest centre, one to one) and scores each part by IoU and
   its largest edge gap, plus a page score (mean frame IoU; missing and extra visuals counted). This is what (b) would
   score against a golden capture's boxes from the laptop.
4. **Tests `mcp/test-r1-see-the-result.mjs`** (added to `npm test`), written before the code (red first):
   - S-1..S-8 on every fixture model (no-measures, arabic-long-names, large-synthetic, health-project, twin-project)
     and on a made-up model with untyped DAX-table columns, a date table with sort-by, a 1:1 relationship and a field
     parameter: the shadow TMDL parses with the repo's reader (`tmdl-model.js`); same tables, columns, measures,
     relationships and hierarchies; every column's type equals the model's (or the guess, listed); no number, date or
     boolean column typed as text in the M `type table`; every row's values parse as their type; every "many" key
     value exists on its "one" side and every "one" side is unique; every sortByColumn pair is a function; date table
     contiguous; same input -> same bytes; no value of the fixtures' own DATATABLE rows appears in the shadow; row
     counts within the caps; `shadowProject` points the report at the shadow model.
   - B-1..B-6: the scorer on hand-made pages (identical = 1, a 4-unit shift, a missing visual, an extra one, a swap);
     the preview's drawing vs the written files on the fixtures' planned reports (every frame IoU 1, 0 missing);
     the design engine's slots (what a plan starts from) vs the written report: scored and printed (a number, not a
     pass mark).
5. **For the laptop:** the exact steps to try (a) by hand on one fixture.

## Expected (before any run)
- New test file: about 120 checks (5 fixture models x ~18 + the made-up model ~15 + box-diff ~20), all red before the
  libs exist (the file says "missing lib" and fails), all green after.
- Unchanged: every other suite (no shared engine touched: the two libs are new files in `mcp/lib/`, not loaded by
  `server.mjs`). The full `cd mcp && npm test` all PASS as on the base branch.
- Slots vs written: frame IoU below 1 on some visuals (the writer moves and sizes some slots: groups, the wide table,
  panels): printed, not asserted.

## Results
- **Commits:** `768718f` plan; `13aaf41` tests first (red: the libs missing); `41ffb09` the two libs (shadow model, box
  diff) + the DAX form's test; the research doc, the laptop script and these results in the last commit.
- **Tests:** `test-r1-see-the-result.mjs` 0 -> 172 checks (red first: "missing lib", committed red in 13aaf41; the DAX form's 6 checks were red locally before
  its code); full `cd mcp && npm test` (Linux) all PASS, exit 0 (mcp 1581, golden 12 unchanged, fuzz 8199, layouts 226, preview 71, fidelity 38, r1 172).
- **Measured:** shadow generation 34-45 ms on the small fixtures, 125 ms on the 300-table model (2.3 MB of TMDL; 15,525
  made-up rows); Microsoft's validator (offline, `--no-schema`) 0 errors on the shadow projects of twin, arabic, health
  (form 'dax'). Box score, preview drawing vs written files: 1.00 on all 8 fixture pages; plan slots vs written report:
  0.15-0.50 (printed by `R1_PRINT=1`).
- **Expected vs got:** expected about 120 checks, got 172 (the DAX form added 9 and the made-up model's extra checks);
  every other suite unchanged (no shared file touched).

## Decisions I made
1. Every table becomes made-up rows, calculated tables too (their DATATABLE can hold typed values; a CALENDAR's range
   can't be matched to made-up fact dates in general), except field parameters (NAMEOF: names, not data) and
   calculation groups (DAX items, no rows): kept as written.
2. Measures and calculated columns keep their DAX (the visuals must compute as in the real report). A calculated column a
   relationship or a sort-by uses becomes made-up rows (keys and sort values must be ours to match), said in `notes`.
   The DAX-literal risk (constants in DAX show in an image) is written down for S2, not solved here.
3. Two forms: the owner's typed `#table` (default) and a `DATATABLE` (`form: 'dax'`), because the repo's Desktop notes
   say a Power Query table in a project opens empty until a refresh and a DAX table opens with data: the laptop picks.
4. Sizes chosen, not measured: a "one" side 8 rows, a fact 120, a date table 365 days of 2025, a table alone 120.
5. A column with no type gets a type by its name (date, true/false, name, quarter, number words, amount words, else
   text), listed in `guessed`, never silently.
6. The box comparison lives in `mcp/lib/` (not a shared engine), so no website file, `.min.js` or `?v=` changes; the
   preview's sub-boxes are read from its SVG, not added to page-preview.js.
7. My own test had one wrong assumption fixed before it ever passed: the TMDL reader gives an extendedProperty as
   `{ name, type, value }`, the test compared key order; it now compares the fields.
8. The research doc names no Desktop or validator version as current: dated measurements keep theirs.

## Seen, not in scope
Status of these items: [mcp/work/SEEN-QUEUE.md#r1-see-the-result](SEEN-QUEUE.md#r1-see-the-result)
- `plannedReport`'s in-memory report has no `.platform` file (create_report adds it on write); the validator passed
  offline without it; a shadow of a planned report may need one for Desktop (step 1 for the laptop will tell).
- The health fixture's `_Measures` table has a data column, so its shadow gets 120 made-up rows (harmless; a
  measures-only table with no column would get none).
- The plan's slots score 0.15-0.50 against the written pages: anything that still draws from slots (the website's
  slot preview when a model has no measure) shows a layout the writer doesn't write.
- Desktop must refresh a Power Query shadow before it shows numbers; the bridge has no refresh command (the Authoring
  MCP's refresh or a click).

## For the laptop
The steps are in `mcp/research/SEE-THE-RESULT.md`, "For the laptop": write the twin (both forms) and the Arabic (DAX)
shadow projects with `node research/shadow-try.mjs`, open each with the bridge, record the pid, time the open and the
load, Refresh the Power Query form, capture each page one at a time after 20 s, look for error icons, month order,
"(Blank)", Arabic right to left, cut titles, slant and scrollbars; close only that window; report with "Seen, not in scope".
