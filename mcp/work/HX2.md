## Summary
- **Approval:** the owner, 11 Nov, D-1111-13: "HX2 go, 3 later, 4 after the entry, name Impact check" (relayed by the
  hub, session_015Q77oNR7YVFznptSuZoZZ2): HX1's stages 2 and 3; stage 4 (the print file) and the Desktop runs wait.
- **Base:** `feat/0.3.3-hx2` from `origin/integration/0.3.3` at 193d74be. Push only this branch; never merge, no PR.
- **Scope:** `check_report` option `againstModel` (section `impactCheck`), `read_model` option `reach`; `lib/lineage.mjs`
  reads the health engine's graph (`graphStep`, one export); a new `lib/impact.mjs` (the reading glue: models and
  reports, the two sections); their suite, tests.json line, MODULES.md and CONTRACTS.md rows, TOOLS.md, PRIVACY.md,
  CHANGELOG [Unreleased], WORK.md. Out: stage 4, Desktop runs, FB3's files.
- **Expected checks:** new suite `hx2` (area checker) about 45 checks, red on 193d74be first; hx1's 59 unchanged;
  `node scripts/check-modules.mjs --strict` PASS; `node scripts/test-site-config.mjs` PASS; lint 0; CI green.
- **Resume:** plan pushed (this note); next: the red suite, then the engine export, then the two options.

## Plan (written 2026-11-11, before any code)
### What each option answers
- `check_report { path, againstModel }`: the same report read on two models. Before: `againstModel` (a backup's or a
  git checkout's model path, inside the working folder) with the report `against` when given, else `path`; after: the
  model `path`'s definition.pbir names (byPath) with `path`. Section `impactCheck` (the key `impact` is taken: it is
  check_report's summary of findings by kind) beside `sameQuestion`: HX1's `compareLineage` words, each reason with a
  `chain` ("[Margin %] uses [Net Revenue] uses [Returns Value]: measure: its DAX changed"), `proves`, `notProved`.
  Capped like sameQuestion (60 listed, 16,000 characters, the cut counted in `notListed`), and cut again inside the
  answer's 40,000 if needed. No option, no section: every existing call answers as before.
- `read_model { path, reach }`: `"[Measure]"`, `"Table[Column]"` or `"Table"` (or `'Table name'[Column]`); for every
  report beside the model that names it (loadModel's own `report.files`, already read and capped), the visuals it
  reaches by tier, grouped by report and page; at most 60 visuals listed in all, the rest counted; a name not in the
  model answered `found: false`. The reach answer replaces the model list on that call.
- One graph: `graphStep` exported from `assets/js/model-health-engine.js`, with `{ edges: true }` labelling each edge
  (dax, format, sort, table, ...); `lineage.mjs`'s `modelGraph` reads M, IX and the edges from it instead of calling
  `normalizeModel`, `buildIndex` and `daxRefs` itself. The website calls it without the option: no change there.

### Expected numbers (by hand, from twin-project: 17 visuals, 9 with a query, before any code)
| # | test | expected |
|---|---|---|
| T1-T3 | twin, native copy, redesign of twin-project, `against` the original and `againstModel` a copy of the same model | impactCheck agrees with sameQuestion: twin 6 same / 2 order / 1 question, native 8 / 0 / 1, redesign 9 / 0 / 0 |
| T4 | the original alone, `againstModel` an unchanged copy | 9 of 9 same |
| E1 | [Total Sales]'s DAX | 7 question: cardSales, colRegion, lineMonth, barProduct, customGauge, tblProducts, tipCard |
| E2 | [Orders]'s DAX | 1 question: cardOrders |
| E3 | [Total Sales]'s format string | 7 display, 0 question |
| E4 | Calendar[Month Name]'s sort-by column | 1 order: lineMonth |
| E5 | the Sales to Calendar relationship removed | 1 question: lineMonth |
| E6 | a new measure nobody shows | 0: 9 of 9 same |
| C1 | a canary in [Total Sales]'s DAX (both models) and in a page filter | in no answer |
| R1 | `reach: "[Total Sales]"` on twin-project | 7 visuals on 3 pages, 1 report; `Sales[Region]` 5 on 1 page; `Calendar` 1; `[Nope]` found false |
| R2 | reach with the three copies beside the model | 4 reports; [Total Sales] in each |
| S1 | 400 visuals all on an edited measure | 60 listed, 400 counted, answer under 40,000, no `truncated` |
| Q1-Q4 | refusals through the schema: reach and tables together, againstModel outside the folder, a report with no byPath, an empty reach | refused, nothing read on |
| G1 | the engine: `graphStep` exported; hx1's 59 unchanged; the health check's answer on twin-project byte for byte | same |
