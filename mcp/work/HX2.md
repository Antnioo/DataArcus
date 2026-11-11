## Summary
- **Approval:** the owner, 11 Nov, D-1111-13: "HX2 go, 3 later, 4 after the entry, name Impact check" (relayed by the
  hub, session_015Q77oNR7YVFznptSuZoZZ2): HX1's stages 2 and 3; stage 4 (the print file) and the Desktop runs wait.
- **Base:** `feat/0.3.3-hx2` from `origin/integration/0.3.3` at 193d74be. Push only this branch; never merge, no PR.
- **Scope:** `check_report` option `againstModel` (section `impactCheck`), `read_model` option `reach`; `lib/lineage.mjs`
  reads the health engine's graph (`graphStep`, one export); a new `lib/impact.mjs` (the reading glue: models and
  reports, the two sections); their suite, tests.json line, MODULES.md and CONTRACTS.md rows, TOOLS.md, PRIVACY.md,
  CHANGELOG [Unreleased], WORK.md. Out: stage 4, Desktop runs, FB3's files.
- **Expected checks:** (written before the code: "about 45 checks") **got:** new suite `hx2` (`mcp/test-0.3.3-hx2.mjs`,
  area checker) 43 checks, red on 193d74be first (29 of 42 failed: no option, no export, no words); checker 14 suites
  passed, hx1 59 unchanged, same-question 41 unchanged; `node scripts/check-modules.mjs --strict` PASS 1233,
  check-contracts PASS 858, test-contracts PASS 14, check-agent-memory PASS 515, check-result-lines PASS 245,
  changelog-words PASS 45, `node scripts/test-site-config.mjs` PASS, `scripts/tests/model-health.mjs` exit 0, lint 0;
  model area 31 suites passed; mutation PASS 250 (99 mutants, all killed).
- **Resume:** DONE. Two red CI runs, each fixed at the cause (tk1 K4: tools/list 75,950 of 75,000, the option texts
  shortened to 74,925; the sitemap's lastmod of two pages after merging FB3 once). The reviewer: review and merge.
  The owner: "For the owner" 1 (the Arabic drafts) and 2.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/43008243329 on 7d6a7c631548a5ff723c8cbf5108e7df06096b4c
  (2026-11-11T11:14Z; Linux 5 of 5 shards, Windows 5 of 5, the website success, macOS skipped by the workflow). DONE.
- **Result:** after a model edit, `check_report { path, againstModel }` names exactly the visuals it can move, with the
  chain ("[Total Sales] uses [Base]: measure: its DAX changed"); `read_model { reach: "[Total Sales]" }` answers 7
  visuals on 3 pages of twin-project.

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

## Before -> after (2026-11-11)
- **Before (193d74be).** `check_report` cannot see a model edit: `against` compares two reports' files and refuses two
  models; HX1's lineage is a library no tool loads. Nothing answers "what does [Total Sales] reach". The health
  engine's graph (`graphStep`) is not exported; lineage.mjs normalised the model and read every DAX text a second time.
- **After.** `check_report { path, againstModel[, against] }` adds `impactCheck`; `read_model { path, reach }` answers
  `reach` in place of the model list. `graphStep(model, { edges: true })` is exported from
  `assets/js/model-health-engine.js` (the health check calls it without the option: same graph, same answers; its
  .min.js and the ?v= stamps of the two health pages, the two theme generator pages and the lab rebuilt by
  `npm run build:min`); lineage.mjs's `modelGraph` reads M, IX and the labelled edges from it (one graph, D-1104-12),
  hx1's 59 checks unchanged. New `lib/impact.mjs` (the reading glue, MODULES.md row, pure by check-modules: no fs, no
  env of its own). Each reason has a `chain` sentence (lineage.mjs `whyOf`).
- **The expected numbers:** T1-T3 (6/2/1, 8/0/1, 9/0/0, the same visuals as sameQuestion), T4 (9 of 9), E1-E6 as
  written. One hand number was wrong, by my test's own setup, not the code: R1's `Sales[Region]` is 9 visuals on 3
  pages, not 5 on 1: the suite's canary sits in [Total Sales]'s DAX as a filter on Sales[Region], so every visual of
  [Total Sales] reaches it (that is the rule working). The test pins 9 and adds `'Sales'[Product]`: 3 visuals.
- **What each test pins (hx2, 43):** N1-N2 no new key without the options; R1-R4 reach (7 on 3 pages; Sales[Region] 9;
  the Calendar table 1; Calendar[Month Number] order only; Sales[Product] 3; a name the model lacks: found false);
  T1-T4; E1-E7 (E7: a chain through two measures); R2 four reports beside the model; S1-S4 (407 visuals: 60 or fewer
  listed, every one counted, under 40,000, no `truncated`, the same for reach); Q1-Q5 refusals (reach with tables,
  an empty reach by the schema, againstModel outside the folder, a report on byConnection, a path that is not there);
  W1 read-only; C1-C2 no canary, no hash; G1-G2 one graph; D1-D3 the words.
- **Red first, honestly:** Q1-Q5, N1-N2, W1, C1-C2 and S2-S3 passed on 193d74be too, for the old reason (the unknown
  option refused by the strict schema, so nothing was read): they guard the new code's refusals, not proved red by it.
- **Suites that call the two tools (L-1105-32):** 27 test files name `read_model` or `check_report`; the new keys
  appear only with the new options, so none of their recorded answers moves (checker 14 suites and model 31 suites passed).

## CHANGELOG line
- **Impact check: what a model change can move.** `check_report` with `againstModel` ... (mcp/CHANGELOG.md [Unreleased])
- **Impact check before an edit:** `read_model` with `reach` ... Names only, never values.

## Decisions I made
1. **The section is `impactCheck`, not `impact`:** check_report's answer already has `impact` (the findings by kind,
   0.3.1); reusing the key would change every existing answer's shape.
2. **Which report on which model:** before = `against` (else `path`) on `againstModel`; after = `path` on the model its
   definition.pbir names by path. A report on byConnection is refused (no model file to read), with the option named.
3. **No section without `againstModel`:** `against` alone answers exactly as before (the brief: no change without the
   new options), though the lineage could add model-aware words there too.
4. **One graph by labelled edges, not by a second walk:** `graphStep(model, { edges: true })` also records each edge's
   kind; the lineage keeps dax, table, agg, group as the question, format as display, sort as order, and leaves out what
   the health check keeps for a clean-up (a measure's home table, detail rows, KPI expressions, a measures table's
   placeholder column). With the option the engine reads a measure's DAX and its format expression apart once more
   (the health check's own call reads them joined, unchanged); without it, nothing more is done.
5. **reach replaces the model list on that call** (an answer about visuals, not tables), and `reach` with `tables` is
   refused in the handler (two inputs' combination; the schema checks each alone: `min(1)`, `max(300)`).
6. **A measure written with its table** (`Sales[Total Sales]`) falls back to the measure when no such column exists.
7. **reach reads the reports loadModel already read** for the health check (`report.files`, measured, links never
   followed): no new reading code; a report elsewhere is not seen and `notProved` says so.
8. **In doubt, more, at the model's edge too:** a model definition file not read fully on either side moves every
   "same" visual to "can show another number" with its own sentence.
9. **Caps:** each section 16,000 characters (sameQuestion's), at most 60 visuals listed, the cut counted in
   `notListed`; check_report's own cut loop trims impactCheck's list before notChecked, never its counts.
10. **WORK.md:** HX1's entry shortened to its note's path to fit HX2's line (3,148 characters).

## For the owner
1. **Arabic drafts (D-1109-07: the answers stay English until you approve):**
   - "N of M visuals can only show other numbers if the data changed; Q can show other numbers (listed); D only in
     display; O only in order." -> «‏N من M مرئيات لا يمكن أن تعرض أرقامًا أخرى إلا إذا تغيّرت البيانات؛ Q يمكن أن تعرض
     أرقامًا أخرى (مذكورة)؛ D في العرض فقط؛ O في الترتيب فقط.»
   - "Not every definition file of the two models could be read fully (n), so no visual is counted as unchanged: Q of
     M visuals can show other numbers (L listed)." -> «تعذّرت قراءة بعض ملفات تعريف النموذجين كاملةً (n)، لذلك لا يُعدّ
     أي مرئي دون تغيير: Q من M مرئيات يمكن أن تعرض أرقامًا أخرى (L مذكورة).»
   - "[X] reaches N visuals on P pages of R reports beside the model (L listed)." -> «[X] يصل إلى N مرئيات في P صفحات
     من R تقارير بجانب النموذج (L مذكورة).»
   - "This measure (column, table) is not in the model: no measure of that name, so it reaches no visual." -> «هذا
     المقياس (العمود، الجدول) غير موجود في النموذج: لا يوجد مقياس بهذا الاسم، لذلك لا يصل إلى أي مرئي.»
   - the chain's word "uses" -> «يستخدم» ("[Margin %] uses [Net Revenue]" -> «[Margin %] يستخدم [Net Revenue]»).
   - "read_model takes reach or tables, not both: ..." -> «تأخذ read_model الخيار reach أو tables، لا الاثنين: reach يجيب
     عن المرئيات التي يصل إليها مقياس أو عمود أو جدول؛ tables يعرض الجداول كاملة. استدعِها مرة لكل منهما.»
   - "check_report's againstModel reads "X" on two models, and its definition.pbir names no model folder (byPath): give
     a report saved with its model (a .pbip project). Nothing was compared." -> «يقرأ الخيار againstModel في
     check_report التقرير "X" على نموذجين، وملف definition.pbir الخاص به لا يسمّي مجلد نموذج (byPath): أعطِ تقريرًا
     محفوظًا مع نموذجه (مشروع .pbip). لم تتم أي مقارنة.»
   - reach's `notProved` ("From the files only: the reports saved beside the model ...") -> «من الملفات فقط: التقارير
     المحفوظة بجانب النموذج (التي يسمّي ملف definition.pbir فيها مجلد هذا النموذج). لا يُرى تقرير في مكان آخر يستخدم
     النموذج (مجلد آخر أو خدمة Power BI)؛ والبيانات وأمان مستوى الصف ومنطق المرئي المخصص وما يبنيه نص DAX وقت التشغيل
     خارجه. أي العلاقات تُحتسب لمرئي قاعدةٌ من انتشار الفلاتر الموثّق لدى Microsoft، لم تُقَس في Power BI Desktop.»
   Yes / no for each, or your wording.
2. **Yes / no:** the public word stays "Impact check" in TOOLS.md, PRIVACY.md and the CHANGELOG (the code keeps
   "lineage"); a website page or article about it is not in this job.

## Risky changes
- **Two new options on two tools.** `check_report`'s `againstModel` can answer: which visuals (page id, visual name,
  type) can show another number after a model edit, the names on the way (measures, columns, tables, relationships by
  their columns), words for what changed, counts; never a DAX text, a source query, a filter, a hash or a value. Its
  strongest sentence, "can only show other numbers if the data changed", stays beside `notProved` (the data, row-level
  security per person, a custom visual's logic, run-time DAX; the relationship rule by Microsoft's documentation, not
  measured in Desktop). `read_model`'s `reach` can answer: the name as the model writes it, each report beside the
  model, its page ids and the visuals reached with their tier and counts.
- **A website engine changed:** `graphStep` exported and given an option; the health check's own call is unchanged
  (no option), the website's model-health suite passes, and its stamps were rebuilt.

## For the laptop
- Nothing new to run: stage 4's six Desktop runs (HX1 "Next stages" 4) still turn "by rule" into "measured" and wait
  for after the Dataviz entry (D-1111-13). A quick look when convenient: the health check page still loads (its
  worker's new ?v= stamp).

## Seen, not in scope
- `tools/list` is at 74,925 of tk1's 75,000 characters after HX2 (it was 75,950 with my first, longer option texts):
  the next option on any tool will not fit without cutting elsewhere. The hub may want a budget per tool.
- `sameQuestion` still reads a report through its own `read` (same-question.mjs) and impact.mjs reads it again through
  `inventory`: two reads of the same files in one check_report call with both options (correct, a little slower). One
  shared read would touch NC1's file.
- check_report's answer `truncated` means "findings cut"; a section cut (sameQuestion, impactCheck, lint) says so in
  its own `notListed` or `truncated`: two words for one idea.
- `reachOf` (lineage.mjs) caps its own list at 60 per report; impact.mjs counts again over the visuals to cap the whole
  answer at 60: reachOf's cap could take a budget.
- The health check's "unused" findings could now say the visuals behind a used field (HX1 "Next stages" 3, second
  half): not built.

## Lessons for the reviewer
- After the one merge of integration, run `node scripts/sitemap-lastmod.mjs` again: a page both branches re-stamped
  gets today's date only on the merged history (my pre-merge run said "match").
- A new option's description counts against tk1's 75,000-character tools/list cap: run `test-0.3.2-tk1.mjs` (core
  area) with any description change; my checker and model runs did not include it and CI caught it.
- An answer key the brief names (`impact`) was already taken in the same answer: a brief that names a new key could ask
  the builder to grep the answer's keys first.
- "Red first" for refusal tests of a new option is vacuous on the old code (the strict schema refuses any unknown key
  for the old reason); the note says which checks were red only by absence.
