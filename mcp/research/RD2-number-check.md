# RD2: the number check, layer 1 ("same question")

## Summary
- **Approval:** the owner, D-1103-12 (3 Nov): "Go for 10 r&ds during the night ... choose the best r&ds ideas that
  will best fit our code and make us shine"; this is the scout's brief RD2 (`mcp/research/SCOUT-0.3.2.md` on
  `rd/0.3.2-scout`). The public line stays "a number check ... is planned, not built" (`mcp/ROADMAP.md`).
- **The question:** can check_report, given `before` and `after` (the original and its twin, native copy or
  redesign), prove visual by visual that each asks the model the same question (fields, aggregations, filters, sort,
  Top N, display units), from the files only, never a value, and name which visual differs and how?
- **Scope:** research only: this note and scratch scripts under `mcp/research/rd2/`. No product file changes.
- **Base:** `rd/0.3.2-number-check` from `origin/integration/0.3.2`. Push only it; no merge, no PR.
- **Expected checks:** no product suite touched; the prototype prints one `PASS  rd2-layer1  <N> checks` line.
- **Expected numbers (written before the run):** on `twin-project` (2 pages with visuals + a tooltip page): every
  visual matched by name in all three pairs; twin and native copy: every query "same question" except what the
  mirror changes on purpose (projection order of a mirrored chart's axis, never a field); redesign: all "same
  question" (positions, titles and theme only). The 6 planted changes: each found once, on the right visual, with the
  right kind; no filter literal in any answer. Time under 1 s, answer under 10,000 characters.
- **Got:** every visual matched by name in all three pairs (17 of 17); redesign 9 of 9 queries the same; twin 6 the
  same, 2 order only (a sort turned or added), 1 differs (the total row's "Row label" measure), 0 left once its
  plan's list is given; native copy 8 the same, 1 type changed on the same measure. 6 of 6 planted changes found once,
  on the right visual. No canary in any answer. 11-15 ms a pair; 1,017 visuals in 514 ms, 16,506 characters.
  One finding for Desktop: the twin turns a chart holding a running-sum visual calculation (RD2-D2).
- **Recommendation:** a check_report option `against` (way 1, about 1 session, low risk), then the step in each copy's
  plan (way 2).
- **Resume:** done; the owner decides on the builder brief (section g).

## The plan
1. Read today's code: inventory, diskSource, verifyCopy's opaque hashes, the twin's read and what the mirror changes.
2. Read Microsoft's docs: semanticQuery, visual calculations, PBIR filters (values in a filter).
3. Prototype `rd2/layer1.mjs`: a canonical "question" per visual (roles and fields, aggregations, sort, Top N,
   filters by hash with their count of literals, visual calculations, display units and decimals), matched by name.
4. Measure on copies in `os.tmpdir()`: twin, native copy, redesign made through the tools' handlers; then the 6 planted
   changes; the time and answer size.
5. Write a) to g): today's code, the docs, 2-3 ways, numbers, recommendation, Desktop checks, a builder brief.

## a) Today's code: what is proved, what is not
- **What verifyCopy proves (the redesign only):** `mcp/lib/redesign.mjs:471` refuses a copy where any file outside
  the allowlist changed, a page is lost, a reference dangles, or an "opaque payload" changed. `opaqueOf` (`:460`) hashes,
  per visual, `filterConfig`, `visual.query` (the bindings), `objects` without the text settings, interactions, links,
  tooltip and drillthrough, and every bookmark whole. So for a redesign, layer 1 is already true by construction:
  the query and every filter hash the same, and display units (in `objects`) too. It is checked at the plan and at
  the write, never said to the user as "same question", and it says nothing per visual.
- **What it cannot prove:** a twin or a native copy is not byte-identical by design. The mirror (`assets/js/report-mirror.js`)
  turns sort directions (`:171`, `:183`, `:318`), reverses a table's or a matrix's values (`:331`, `:441`), a donut's
  legend (`:277`), rebuilds a column chart over time as a waterfall with new report measures (`:291-305`) and writes a
  matrix as a flat table on request (`:524`); the twin adds a "Row label: ..." report measure to a table led by a text
  column (`:546`, `twin-pages.mjs` rowLabelTable). The native copy changes a custom visual's type and roles
  (`mcp/lib/native-copy.mjs`). opaqueOf would fail on all of these, so the twin and the native copy have no
  "same question" check today.
- **What already exists to build on:** the reading block (`read-report.mjs:160` locate, `:185` diskSource with its
  link and limit checks, `:342` inventory: every page, visual JSON, filters, sort, fields per role); `refOf`/`keyOf`
  for field names; `safeName` for every name out; the mirror's own per-visual `changes` list (`report-mirror.js:249`
  returns `{ json, kind, changes }`): the twin already knows, visual by visual, what it changed on purpose.

## b) Microsoft's docs (read 2026-11-03, Learn)
- **Filters hold values.** "Power BI Desktop project report folder", PBIR format: "Some report metadata files, such as
  visual.json or bookmarks.json, can be saved with data values from your semantic model. For instance, if you apply a
  filter to a visual for the field 'Company' = 'Contoso', the value 'Contoso' will persist as part of the metadata.
  This also applies to other configurations like slicer selections, matrix custom columns width, and formatting for
  specific series." So: a filter, a slicer selection and a per-series format are compared by hash, never returned;
  the answer gives the field, the filter type and the count of literals.
- **Visual calculations follow the visual's structure.** "Visual calculations": they "can refer to the visual
  structure" (Axis ROWS / COLUMNS, Reset); "Prefer Axis and Reset when you want field-agnostic behavior that follows
  the visual structure". So a change of order (a sort turned, columns reversed) on a visual holding one can change
  its numbers: the prototype raises that to a question. They are not available in custom visuals or slicers, and
  "Filtering, sorting, or changing aggregations" of a visual calculation is not supported.
- **Order can change which rows are fetched.** "Apply data point limits and strategies by visual type": a bar or column
  chart's series "Top 60", a donut's legend "Top 1000", a waterfall's breakdown "Top 200", 3,500 points for most
  visuals. A sort turned on a visual near those limits may show other categories; a Top N filter has its own order
  inside its subquery, so it is not moved by the visual's sort. Said as "worth a layer 2 run", not as a difference.
- **semanticQuery:** a projection's field is a Column, a Measure, an Aggregation (Function 0 Sum, 1 Avg, 2 Count,
  3 Min, 4 Max, 5 CountNonNull, 6 Median, 7 StandardDeviation, 8 Variance), a HierarchyLevel or a
  NativeVisualCalculation (Language, Expression, Name); the visualContainer 2.1.0 schema carries `filterConfig` and
  `query.sortDefinition` (schemas bundled in `@microsoft/powerbi-*` packages, as `research/ENGINE-POSSIBILITIES.md` says).

## c) Three ways, with size and risk
| Way | What | Size | Risk |
|---|---|---|---|
| **1. check_report option `against`** | `check_report { path: after, against: before }`: a `sameQuestion` section beside the findings, any two PBIR reports on the same model | about 1 builder session: one module `mcp/lib/same-question.mjs` (the prototype is 162 lines), the option, a test suite | low: read-only, no new tool, no instructions budget (the description grows by about 300 characters); the twin's on-purpose changes show as "order" or "differs" unless the plan's list is given |
| **2. a step inside each copy's own plan** | the twin, native copy and redesign plans run the compare between the original and the files they built, with the mirror's `changes` as `expected`; the plan and the approval page say "N of M visuals ask the same question; K changed on purpose: ..." | about 1.5 sessions on top of way 1: three plan builders, the approval page line, their answers' size | medium: touches three write paths' plans (not their writes); a plan answer grows by about 200 characters |
| **3. a 12th tool `check_numbers`** | the plan's original design (`mcp/plans/NUMBER-CHECK.md`) | about 2 sessions for layer 1 | higher in cost: the owner chose "an option, not a 12th tool" (C), the instructions sit at their cap (INSTRUCTIONS_MAX 2200) |

## d) The prototype's numbers (`mcp/research/rd2/measure.mjs`, run 2026-11-03, Linux, Node 22)
Made in `os.tmpdir()` from `mcp/fixtures/twin-project` (made up), with a page filter holding a canary, a Top N 5 on
the bar chart and display units on a card added; the twin, the native copy and the redesign made by the real server's
tools (plan, approve_plan, write). 17 visuals each: 9 with a query, 8 without (title, navigator, 3 buttons, 2 groups,
a text box).

| Pair | Matched by name | Same question | Order only | Expected (with the plan's list) | Question differs | noQuery | notMatched | Time | Answer |
|---|---|---|---|---|---|---|---|---|---|
| twin | 17 / 17 | 6 | 2 (colRegion: sort added; lineMonth: sort turned) | none given | 1 (tblProducts: "Row label" measure added) | 8 | 0 | 14 ms | 789 chars |
| twin + its list | 17 / 17 | 6 | 0 | 3 | 0 | 8 | 0 | | 812 |
| native copy | 17 / 17 | 8 | 0 | none given | 1 (customGauge: type changed, the same field, Values -> Data) | 8 | 0 | 15 ms | 469 |
| native + its list | 17 / 17 | 8 | 0 | 1 | 0 | 8 | 0 | | 486 |
| redesign | 17 / 17 | 9 | 0 | | 0 | 8 | 0 | 11 ms | 166 |

**The 6 planted changes,** each on its own copy, each found once on the right visual and nothing else:
| Planted | Said |
|---|---|
| a measure swapped (bar chart, Total Sales -> Orders) | question: "Y: field swapped" |
| a filter added (column chart, holding the canary) | question: "visual filter added" (field, type, 1 literal) |
| Top N 5 to 10 | question: "visual Top N changed" (counts of literals only) |
| display units 0 to K (card) | display: "display units changed", auto -> K |
| a sort turned (bar chart) | order: "sort direction changed", and question: "order changed on a visual with a Top N filter: worth a layer 2 run" |
| a visual calculation added (table, its expression holding the canary) | question: "Values: field added (a visual calculation)", by hash |

**Scale:** 40 pages of 25 visuals added (1,017 visuals), against a copy with 300 changed: 514 ms, 300 counted,
60 listed, answer 16,506 characters (under the 40,000 cap). **No canary** in any answer (14 checks, `PASS  rd2-layer1  14 checks`).

**A finding (needs Desktop):** a line chart over months holding a visual calculation `RUNNINGSUM([Total Sales])`: the
twin turns its sort (Month Name descending, right to left), and the prototype says "order changed on a visual with a
visual calculation: its numbers can change". If Desktop runs the running sum along the turned axis, the twin's line
shows other numbers than the original's (December's running total would be December alone). The twin's plan does not
say so today. Desktop check RD2-D2 below.

## e) The recommendation
**Way 1 now, way 2 next.** Ship layer 1 as a `check_report` option `against` (read-only, no new tool, the owner's "an
option, not a 12th tool"), answering in three tiers: **question** (the numbers can differ), **display** (the same
numbers shown otherwise: units, decimals), **order** (the same numbers in another order), plus `expected` for what a
copy's own plan changed on purpose. Then (way 2) the twin, the native copy and the redesign call it on their built
files at the plan with the mirror's `changes` as `expected`, so the approval page says "9 of 9 visuals ask the same
question; 3 changed on purpose: sort (2), the total row's label (1)". The redesign's verifyCopy stays the gate; this
adds the sentence. The public line stays "planned" until layer 2; layer 1 may be said as "checks that every visual asks
the model the same question, from the files" once shipped and measured.

## f) The Desktop checks (layer 2 by Performance Analyzer, on the laptop, one twin)
Made-up model only ("Ramadan Test" or twin-project's own). Expected written now:
| Check | Test | Expected |
|---|---|---|
| RD2-D1 the same rows | the original and its twin open in turn; Performance Analyzer: Start recording, Refresh visuals, Copy query on each visual of page 1; run each query in DAX query view | every visual with a query returns the same rows (the order aside); the KPI values equal the model's known answers |
| RD2-D2 a visual calculation turned | the line chart with `RUNNINGSUM([Total Sales])`, original and twin | either the same running totals per month (the calculation follows the month order, not the sort: then the prototype's "can change" is too strict) or other totals (then the twin must not turn it, or must say so: a fix for the mirror) |
| RD2-D3 a sort near a data limit | a column chart with more than 60 series, sorted, then turned | whether the same 60 series are shown; if not, "order" on such a visual becomes a question |
| RD2-D4 the export | Performance Analyzer's Export of one page | whether the JSON names each visual (its `name`, to match `visual.json`) and holds the full DAX: decides NC-1 of the plan |

## g) The builder brief (way 1)
- **Job:** NC1, layer 1 as `check_report { path, against }`. Base `integration/0.3.2` (or the next), its own branch.
- **Files:** a new `mcp/lib/same-question.mjs` (from `mcp/research/rd2/layer1.mjs`: the reading block only, names out
  through `safeName`, every field through the same screen as `read_report`); `mcp/tools/check_report.mjs` (the option,
  its description); `mcp/lib/check-report.mjs` (the section beside `findings`, its share of the 40,000 cap); the
  option in `mcp/TOOLS.md`; `mcp/CHANGELOG.md` [Unreleased] in plain words.
- **Rules:** both reports inside the working folder and on the same model (`definition.pbir`), else refused; no value
  in any answer: a filter, slicer selection, visual calculation or report measure by hash, said by its field, type
  and count of literals; at most 60 visuals listed, the rest counted; the wording "N of M visuals ask the same
  question; K differ (listed); L only in order; D only in display", never "the numbers are verified".
- **Expected checks (tests first, a new suite `mcp/test-0.3.2-same-question.mjs`, one line in `tests.json`):** the
  three pairs and the six planted changes above with the same numbers (twin 6 / 2 / 1, native 8 / 0 / 1, redesign 9 /
  0 / 0; 6 of 6 found once); a canary in every filter, slicer, visual calculation and bookmark, never in an answer;
  1,017 visuals with 300 differing: 60 listed, under 40,000 characters, under 2 s; refusals: another model, a
  PBIR-Legacy report, a path outside the folder, a link. Then `npm test -- checker` and the full run.
- **Size and risk:** about 1 builder session, about 250 lines with the test; low risk (read-only, one option, no
  write path touched). Way 2 is its own brief after it.

## Decisions I made
- Visuals are matched by page id and visual name: the twin, the native copy and the redesign keep both (measured: 17
  of 17). The EN-AR copy (`into: "same"`) gives its Arabic pages new ids: matching it needs the plan's page pairs
  (not measured here, a way 2 item).
- A field's display name and a title are not part of the question (the twin translates them on purpose).
- Top N counts and filter literals are never said, only "changed" and their counts of literals; display units are
  said (auto, K, M), as they are a format, not a value.
- The sort is an "order" change, not a question, unless the visual holds a Top N filter or a visual calculation.
- Page interactions and a slicer's saved selection are compared by hash and said as a question for the page.

## Seen, not in scope
- The twin turns the sort of a chart holding a visual calculation and says nothing (RD2-D2 decides if it is a bug).
- verifyCopy's opaque hashes are computed but never shown per visual: the redesign's approval page could say "every
  visual's query and filters unchanged" today at no cost.
- The waterfall rebuild (`report-mirror.js:291`) changes the query and adds report measures: layer 1 will say
  "question differs" for it unless the twin passes `expected`; its numbers need RD2-D1 on a waterfall too.
