# FN1F (0.3.2): three engine functions into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1F" (6 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's
  plan), D-1104-12 (a library of functions, fixed at the source), D-1104-18 (keep building the library); D-1104-15
  (SVG KPI math follows the compiled DAX) and D-1027-05 (glass the default) bind it: neither changes.
- **Base:** `fix/0.3.2-fn1f` from `origin/integration/0.3.2` at 4bc74921 (PF2 merged). Push only this branch; never
  merge, no PR.
- **Scope:** three functions split into named steps, each in its own file (no new module): `assets/js/field-suggest.js`
  `rank` (:82, 256 lines), `mcp/lib/report-build.mjs` `reportBuild` (:53, 249), `assets/js/svg-kpi-compiler.js`
  `compile` (:127, 238; its layer callback alone 155). Code moves; no text, order, key or output change. FN1C's and
  FN1D's method: steps are file-level functions given one context object, destructuring what they use and handing
  back what later steps read (`Object.assign(ctx, {...})`).
- **Target:** each function under 150 (the count 15 -> 12), every new step 80 lines or fewer, each file under 600.
- **Expected checks:** the base's totals on 4bc74921 (read from the run files, written here once read): MCP
  `npm test -- report core model`, the website's svg-kpi, sp12, dd2z, tools, pbip, theme-generator(-lab), sp7, sp8,
  sp13, sp14, sp25, sp33, sp36, fn1b, text-align, consent; the same on every split commit, suite by suite, plus a new
  suite `mcp/test-0.3.2-fn1f.mjs` (whole outputs pinned by sha256, its fixture recorded on 4bc74921 only).
- **Resume:** the plan (this commit); next the base runs, the mutants in a worktree of 4bc74921, the fn1f pin, then
  the three splits (one commit each), build:min, CHANGELOG, the merge of integration once, CI.

## The plan: each function's parts and the steps they become
- **field-suggest.js rank** (context `rk`): rankStep 83-120 (the catalog, the stats, why/say, the measures' score,
  time variants and periods, keyOf, the ranked list, net before gross); cardsStep 121-148 (cardable, main, the KPI
  cards, the net notes); dateStep 149-208 (pinned, the reach, the time axis, short months, the year-month span, the
  year slicer); catsStep 209-259 (textLike, catRank, the categories, reach and language, notCat, the date parts,
  catA, catB, the slicers); choicesStep 260-304 (pinned fields, excluded columns, axisFor, the Arabic swaps);
  notesStep 305-336 (every note in the answer's order). rank calls them in that order and returns.
- **report-build.mjs reportBuild** (context `rb`): toolsStep 54-100 (input, the SVG cards and columns, the text and
  value slots, kpisOf, given, named); inputsStep 101-141 (the notes, the counts, the logo, the gallery, unknown keys);
  designStep 142-194 (a design's pages and build); handStep 195-243 (hand-placed pages, the theme's scale, build);
  scriptsStep 244-283 (metric switcher, Arabic calendar, flip cards, icons, DAX functions); finishStep 284-300
  (gallery list, Arabic isolation, the name note, the format script, the answer).
- **svg-kpi-compiler.js compile** (context `ck`): valuesStep 128-155 (sizes, names, R, Z, the values' VARs);
  helpersStep 157-195 (exprOf, dateCol, scale, cond, rules, isRatio, pctFits, parts, lit, hoist); layerStep (the
  callback 197-351: the attribute helpers, the switch, the mirror, tag and show-if); one step per layer kind the switch
  calls (rectLayer, circleLayer, lineLayer, textLayer, ringLayer, arrowLayer, sparkLayer: its two early `return;`
  become `return false;` and the case returns on false, the same skip); svgStep 353-363 (the frame, merge, hideIf,
  the answer).

## Characterisation (to fill)
- Base runs, the mutants (one or more per part, in a worktree of 4bc74921) and which suite caught each, the new pins.

## Decisions I made
- (to fill)
