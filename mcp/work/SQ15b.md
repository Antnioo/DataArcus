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
- **Resume:** see Results.

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

## Baseline (c2a67d6)
(filled after the run)
