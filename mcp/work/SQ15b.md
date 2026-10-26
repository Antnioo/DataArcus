# SQ15b (0.3.1 Seen, the owner's "Yes, fix now", 26 Oct): Latin runs in website downloads, switcher relationships, plan-lint's binding

## Summary
- **Approval:** the owner, 26 Oct: "Yes, fix now" to every open "Seen, not in scope" item, the bigger ones included;
  the reviewer's brief "Go on SQ15b". Items from [SEEN-QUEUE.md](SEEN-QUEUE.md): J18-S2, L3-S2, 0.2.9-reader-S8.
- **Scope:** `assets/js/text-measure.js` (the isolate rule), `assets/js/pbip-export.js` (isolateFiles, called for an
  Arabic build), their `.min.js`, the `?v=` stamps of the pages that load them, `mcp/lib/terminology.mjs` (re-exports),
  `mcp/lib/metric-switcher.mjs`, `mcp/lib/report-run.mjs` (the shared binding), `mcp/lib/plan-lint.mjs`; a new suite
  `mcp/test-0.3.1-sq15b.mjs` (one line in `tests.json`); three Status cells. Not SQ14's files (arabic-calendar.js,
  pbip-query.js, report-mirror.js, check-report internals) nor SQ15c's (test.mjs's own reader, CI coverage).
- **Base:** `fix/0.3.1-sq15b` from `origin/integration/0.3.1` (c2a67d6). Push only this branch; the reviewer merges.
- **Expected checks:** (written before the work) sq15b about 18 checks, about 13 red first; `npm test -- report`,
  `-- core`, `-- arabic` and `scripts/tests/run-all.mjs`: the baseline's result lines (below), the same counts, plus
  sq15b in report; the golden reports byte for byte (no golden report is an Arabic build with a Latin run: if one
  changes, each change said); plan-lint's planned reports for 8 plans (EN/AR, fields or none, second page, gallery)
  the same bytes before and after; `npm test -- --keep-going` 88 -> 89 suites, all PASS; check-agent-memory PASS.
- **Invariants:** metadata only (the switcher reads relationships and DAX names, never a value); the isolates come
  from the writer only; one engine shared with the website (extend `assets/js/`, never copy into `mcp/`).
- **Got:** sq15b 19 checks (13 red first on c2a67d6); report 27 -> 28 suites PASS; core 6 PASS (test.mjs 1591 = 1591,
  golden 12 tasks match: no golden report changed; mutation 72 mutants all killed); arabic 9 PASS, the same counts;
  website run-all 21 PASS, the same counts (below); plan-lint's planned reports: 24 plans (8 shapes x 2 models,
  EN and AR, I planned 8 and hashed 24) the same bytes after the refactor; full run and check-agent-memory below.
- **Resume:** done; waits for the reviewer. Nothing needs Desktop but "For the laptop" 1-3 (the batched run).

## The items, confirmed on c2a67d6
1. **J18-S2**: `isolateLatin` / `isolateFiles` live in `mcp/lib/terminology.mjs` only; `report-run.mjs:381` isolates an
   Arabic report after the build. `pbip-export.js` (the website's Theme Generator download, the same build) has no
   isolate: an Arabic download on the person's own model writes «Total Revenue حسب الشهر» raw.
2. **L3-S2**: `resolveSwitch` checks names only; `addSwitch` binds the bar chart to `cats.bar` and the line to `date`
   without asking whether each measure reaches their tables. A measure of an unrelated fact table repeats one value.
3. **0.2.9-reader-S8**: `plan-lint.mjs` build() copies report-run's pinned map, its own `relsOf`, the pick options
   and `Bind.suggest`, and the fields' kpis cap and table share.

## Plan
1. This note, pushed first. Baseline runs on c2a67d6 (below); plan-lint's planned reports hashed (scratch script).
2. Red first, `mcp/test-0.3.1-sq15b.mjs` (made-up models, a temp working folder, in process):
   - J1-J6: the isolate rule is the shared engine's (`DataArcusTextMeasure.isolateLatin`, J18's TS-4 cases);
     terminology's `isolateLatin`/`isolateFiles` are the engine's; `Pbip.build` lang "ar" on an own model with English
     names: every visible text with Arabic and a Latin run is isolated (page names, titles, alt texts, projections,
     Text measures); an English build has no isolate; the Theme Generator loads text-measure before pbip-export.
   - L1-L6: a switch with a measure of an unrelated table: left out, `leftOut` [{ field, why }] in switchSaid (the
     plan), the script and slicer without it; related measures all kept; fewer than 2 left: a plan problem, nothing
     built; a model without relationships: nothing left out (as before); a measure in a measures table reading Sales:
     kept.
   - S1-S3: plan-lint has no `Bind.suggest` and no `relsOf` of its own; it calls report-run's exported binding;
     the planned report the same as report-run's binding gives for the same fields.
3. Fixes at the cause, as above; build:min, `?v=` stamps (text-measure and pbip-export in the Theme Generator's
   BUILDER, both copies served from one .js), csp --write, ar-pages --write, sitemap-lastmod --write.
4. Suites, results below; SEEN-QUEUE.md Status cells in the same push.

## Baseline (c2a67d6) -> after
- `npm test -- report`: 27 suites passed -> 28 (sq15b 19 checks added; metric-switcher 60 -> 60, every other line the same).
- `npm test -- core`: 6 passed -> 6 (mcp 1591 -> 1591 checks, golden 12 tasks match -> the same, mutation 186 checks,
  72 mutants -> the same). test.mjs's A3-11 (ar) failed once on the fix, by design: see Decisions 3.
- `npm test -- arabic`: 9 passed -> 9 (terminology-sheet 48, arabic-sweep 255, arabic-titles 27: the same).
- `scripts/tests/run-all.mjs`: All 21 passed -> All 21 passed (every line the same count: site 483, theme-generator 898, theme-generator-lab 898, pbip 100, layout 512, design-engine 598...).

## Results
Commits: plan 103fb9d, red first d78047b, the three fixes 850593d, A3-11 4b5cb72, this note and the Status cells NOTE_COMMIT.

| Item | Before | After | Test (red -> green) |
|---|---|---|---|
| J18-S2 | `isolateLatin`, `isolateNames`, `isolateFiles` in `mcp/lib/terminology.mjs` only; report-run isolated the MCP's Arabic report; the website's Arabic download (pbip-export.js) wrote «Total Sales: التفاصيل» raw | the rule in `assets/js/text-measure.js` (`isolateLatin`, `isolateNames`, `ARABIC`, `ISOLATED`), `isolateFiles` in `assets/js/pbip-export.js`, which runs it on every Arabic build after the alt texts (F1's `all`); terminology.mjs re-exports them; report-run's pass after its own additions kept (a no-op on what the writer isolated) | sq15b J1-J5 red -> green; J6 (English: no isolate), J7 (the page loads text-measure first), J8 (the MCP's Arabic report) pins pass |
| L3-S2 | `resolveSwitch` by names only; a measure of an unrelated fact table switched in, one value on every bar | `switchReach` (metric-switcher.mjs): each measure must reach the bar chart's category and the line chart's month (the picker's `reachTable`); else `leftOut` [{ field, why }] in the plan, the approval page ("Measures left out") and the answer; fewer than 2 left: refused, nothing written; no relationships in the model, or a measure that reads no table (a constant): kept | sq15b L1-L4, L7 red -> green; L5, L6, L8 pins pass; metric-switcher 60 -> 60 |
| 0.2.9-reader-S8 | plan-lint's `build` copied the pinned map, `relsOf`, the pick options, `Bind.suggest`, the card cap and table share | `report-run.mjs` exports `planBinding` (pinned fields, pick options, `bindFor`) and `fieldsDesign` (card count, table share); reportRun and plan-lint both call them | sq15b S1-S3 red -> green; 24 plans the same bytes (files and lint answers) before J18-S2; after it the 12 English plans the same, the 12 Arabic ones isolated (as create_report's exact build was) |

## CHANGELOG line
- The website's Arabic project download keeps English words and codes inside Arabic titles in their reading order, as the MCP's Arabic reports do; the metric switcher leaves out a measure its charts can't break down by their category or month, and the plan says which and why.

## Decisions I made
1. **Where the rule lives:** the string rule in `text-measure.js` (already the text engine both sides load, and the one
   that counts the isolates 0 wide), the files walk in `pbip-export.js` (the writer that makes the files): no new
   engine, no new script on the page. `plain` and the sheet stay in terminology.mjs (the MCP's only).
2. **The writer isolates an Arabic build with F1's `all`** (every mixed text, the owner's decision of 20 Oct for the
   MCP), at the end of `build`, after the alt texts. The MCP's report-run pass stays for what it adds after the build
   (the metric switcher, flip cards, icons, DAX library): on the writer's texts it changes nothing.
3. **test.mjs's A3-11 (ar) changed on purpose** (test-0.2.9w.mjs, commit 4b5cb72): it refused every direction mark in
   an Arabic build; it now takes the writer's own FSI, PDI and RLM off first, still refuses a name's RLO and LRI, and
   requires each text to be exactly `isolateLatin`'s output. Same 75 checks; it now also fails if the writer stops
   isolating.
4. **A constant measure stays in the switch** (its DAX reads no table: `= 1000`): the same value on every bar is what it
   means. This kept the metric-switcher suite's hostile fixture (constant measures in an unrelated table) as it was. To
   tell it, pbip-bind.js gains `readTables` (the picker's own DAX reader, no relationship followed).
5. **Both chart axes count:** one field parameter drives both charts, so a measure the month can't break down is left
   out even when the category can (and the other way).
6. **reader-S8's shape:** two exported functions (`fieldsDesign`, `planBinding`), not one, because report-run binds
   before its design is final (the noTime layout) and plan-lint after; create_report's own extras (kpiValues "full",
   page filters) go in as `full` and `more`, so plan-lint's options are exactly what they were.
7. `?v=` stamps: `20261026sq15b` on text-measure, pbip-export, pbip-bind (theme-generator.js) and theme-generator.min.js
   on its three pages; check-min confirms every changed .min.js has a new stamp.

## For the laptop (Power BI Desktop, the batched run)
1. The website's Theme Generator, Arabic, "Download project" on a made-up model with English names (Total Sales,
   Region, Month): open it; titles such as «Total Sales: التفاصيل» and «... حسب Region» read with the English words
   at the right place, "KPI 2024"-style runs in their own order; no boxes or gaps where the isolates are (J18's item 5).
2. The same download in English: unchanged.
3. The metric switcher on a model with an unrelated fact table: the plan lists the measure left out; the Metric page
   switches the others.

## Seen, not in scope
- On a model.bim whose Calendar[Month] is sorted by Month Number, the Metric page leaves its line chart out with "a
  month name without a sort column" (the bound month carries no sortBy), while the report's own line chart orders the
  same column by its "Month start (sort)" measure. The note's words are wrong and the page could switch a line too.
- check_report and read_report still show the isolates as code points (J18-S3, unchanged).
- plan-lint's Arabic lint answers now hold the isolates in their titles (the plan's view of its first page), as the
  exact build already did.
- J18's laptop item 5 (do the isolates draw as boxes anywhere) is still open and now covers the website download too.
