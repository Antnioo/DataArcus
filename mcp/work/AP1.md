## Summary
- **Approval:** the brief "AP1 (0.3.2)" (5 Nov): the product promise (nothing written before approval; the approval page
  says exactly what its click writes, 0.3.0 D6/SQ3) and D-1104-10. E1 round 5's top finding (DataArcus 6b419ef3).
- **Base:** `fix/0.3.2-ap1` from `origin/integration/0.3.2` at 6b419ef (2d5bbe4f or later: 2d5bbe4f is its ancestor,
  seen once the shallow clone's history was fetched). Push only this branch; never merge, no PR.
- **Scope:** the report's approval page (`mcp/lib/approval-disclosure.mjs`, its Arabic `mcp/lib/approval-ar.mjs`) and
  plan_layout's time axis (e). The plan digest and the gate stay as they are.
- **Plan (one commit each):**
  1. This note.
  2. Reproduce on a made-up service model (Work Orders: Department, Status, Date Key, 2 measures; Dim Date), never
     real data: plan with 3 slicers, approve, create_report, count what was written per page against what the page
     (EN and AR HTML, as the window serves it) names. Then plan, re-plan, approve the second, write: whose report?
  3. The page names every visual, slicer, button and page the click writes (a count line per page); (b) the empty
     heading gets its list or goes; (c), (d) say what is written. Red first in `test-0.3.0-approval-complete.mjs`.
  4. (e) "no time axis": the plan has none and its text drops the trend's instructions. Red first.
- **Expected checks:** approval-complete 25 -> more; the suite that owns plan_layout's time axis grows; every other
  suite's number as on the base unless this job's text changes exactly it (named below); lint 0; mutation 86/86;
  check-agent-memory, check-modules --strict, check-result-lines green. CHANGELOG: one plain line.
- **Found (step 2):** (a) is a REAL page gap, not two plans. Made-up "Service" model, 3 slicers asked, filters "top":
  the click wrote 4 pages, 48 visuals; the page named 3 slicers once, 2 chart fields and "Other visuals: chosen by
  DataArcus from the model". A re-plan's write is the approved plan's own (below).
- **Step 3:** the page lists every page the click writes, page by page ("What each page holds"). approval-complete
  25 -> 45 (A9, red on the base: 45 checks, 14 failed). Changed on purpose: sp23 and sp44 (4 report pages' hashes),
  rc24 (2 regexes): below.
- **Step 4:** planFields.timeAxis "none" (create_report's fields.timeAxis too): no time axis in the plan, its text,
  the page or the report. gulf-date-questions 63 -> 68 (GD-12, red on the base: 3 of 66 failed).
- **Local:** merged origin/integration/0.3.2 once (cdc09a88), build:min (no change), `npm test -- --keep-going`:
  211 suites passed; lint 0; mutation 86 of 86 killed; modules --strict, result-lines, contracts, agent-memory,
  test-site-config, changelog-words green; the website's run-all 42 of 42.
- **State:** CI next.
- **Resume:** the CI line below; then the reviewer.

## Step 2: what was written and what the page named (made-up model, 5 Nov)
Model: `Service.SemanticModel` (model.bim): Work Orders (Order ID, Date Key, Department, Status, Hours; measures Work
Order Count, Total Hours), Dim Date (Date, Year, Month, Month Number), Date Key -> Date. plan_layout { path, name,
filters "top", planFields { slicers: Dim Date[Year], Work Orders[Department], Work Orders[Status]; category
Department, category2 Status } }, approve_plan (the test click), create_report { path, planId }, then read back.

| Page (as written) | visuals | slicers | buttons | charts | other |
|---|---|---|---|---|---|
| 1 Executive summary | 23 | 3 (Year, Department, Status) | 3: reset (bookmark), 2 page | 2 bar (Status, Department), 1 line (Dim Date[Month]) | 6 cards, 1 table, 3 text boxes, 1 shape, 3 groups |
| 2 Details | 21 | 3 (the same) | 3: reset, 2 page | 1 bar (Department), 1 column (Status) | 5 cards, 1 table, 3 text boxes, 1 shape, 3 groups |
| 3 Tooltip (tooltip, hidden) | 2 | 0 | 0 | 1 bar (Department) | 1 card |
| 4 Tooltip · Month (tooltip, hidden) | 2 | 0 | 0 | 1 bar (Dim Date[Month]) | 1 card |

What the approval page named for the same plan (English and Arabic pages alike, the HTML the window serves): the
file count ("1 report: 4 pages, 48 visuals, 2 bookmarks, 33 phone layouts"), a preview of pages 1 and 2 only, Slicers
3 (one list, no page: 6 written), "Bar chart by Work Orders[Department]", "Bar chart by Work Orders[Status] (planned as
a column chart ...)" (true of page 1 only: page 2's Status chart is a column chart), "Written as another kind:
Comparison: Bar chart" (page 1 only), "Other visuals: chosen by DataArcus from the model" (b: nothing listed), no
button, no card, no table, no tooltip page by name (d: only its page.json path in the folded file list).

Re-plan: plan A (3 slicers) and plan B (1 slicer, Status) of the same model; B approved and written: B's report (3
slicers a page: Status asked, Year and Department "added by DataArcus to fill the design's slicer slots", as B's page
said); create_report with A's id: "Nothing was written: plan ... is not approved yet". create_report takes only path
and planId and writes the approved plan's own files by digest, so a write can't come from another plan than the one
approved: the round's 9 slicers and 3 reset buttons (3 pages) were on the approved plan, not shown by its page.

## Step 3: the page names what the click writes
- `lib/plan-lint.mjs` pagesWritten(files): the exact artifact's report read back by the reading layer, from memory
  (inventory, memorySource): every page in order, a tooltip page with the pages that show it, and on it every visual
  counted by kind, the slicers by field, the buttons by where they go, the charts by the field they group by. Field
  names only, never a value. plan_layout keeps it in the plan's data (`pagesWritten`); the digest, the gate and the
  files are untouched (the data is what the page shows, not what is written).
- `lib/approval-disclosure.mjs`: the section "What each page holds (N)", one row a page ("Page 1: Executive summary":
  "23 visuals", "3 slicers: ...", "3 buttons: to page ...; "Reset filters · ..." (a bookmark)", "2 bar charts: by ...",
  "6 cards", ...; a tooltip page: "a tooltip page, hidden in the tabs: shown when a reader points at a chart that uses
  it (on ...)"). (b) "Other visuals" / "All visuals": "chosen by DataArcus from the model: every one is named below,
  page by page (What each page holds)". (c) a kind changed says its page: "Comparison on page 1 "Executive summary":
  Bar chart (planned as a column chart) ...", and the Fields row "(on page 1 "...": planned as ...)". (d) every tooltip
  page by name, its visuals and where it shows. `lib/approval-view.mjs`: the heading's Arabic.
- Red first: A9 in test-0.3.0-approval-complete.mjs on the base: `FAIL  approval-complete  45 checks, 14 failed`
  (A9-1..4, English and Arabic); with the fix 45 of 45.
- Changed on purpose (this job's text, exactly): sp23 and sp44 pin each approval page's sha256: the 4 report pages
  (report-en, report-ar, report-cap, report-hostile) re-recorded with SP23_RECORD / SP44_RECORD after a dump of the
  base's and the branch's pages: removed lines only the 2 rewritten ones ("Comparison: Bar chart ..." and "chosen by
  DataArcus from the model"), the rest the new section; the fixtures' other 16 entries each unchanged. rc24 B-140
  (2 regexes): the row now says "on page 1 "<name>"".
- Arabic the page shows, draft for the owner: «ما تحويه كل صفحة» (the heading), «المرئيات: 23», «المقسمات: 3 (...)»,
  «الأزرار: 3 (إلى الصفحة «...»؛ «...» (إشارة مرجعية))», «مخططات شريطية: 2 (حسب «...»)», «بطاقات»، «جداول»، «مربعات
  نص»، «أشكال»، «مجموعات مرئيات»، «مخططات خطية»، «مخططات عمودية» (and the other kinds in VT_WORDS), «صفحة تلميح، مخفية
  من علامات التبويب: تظهر عندما يشير القارئ إلى مخطط يستخدمها (في «...»)», «في الصفحة 1 «...»», «يختارها DataArcus
  من النموذج: كلها مذكورة أدناه، صفحة صفحة (ما تحويه كل صفحة)».
- Checks on this step: safety and report + core areas green but sp6 and glass-tables (the shallow clone's missing
  base commits; green once the history was fetched); lint 0; mutation 86 of 86 killed.

## Step 4: "no time axis" (e)
- plan_layout had no way to say it: planFields.timeAxis is a field or nothing, and nothing meant "the picker takes
  one" (every new plan: a month axis, gulf-date-questions.mjs:61's axis from the picker). The smallest option on the
  existing input: `timeAxis: "none"` (`report-fields.mjs` isNoTime, NO_TIME_AXIS). It resolves to `noTime` (no field),
  `report-bind.mjs` pins `noDate`, and `assets/js/field-suggest.js` then picks no time axis and no year slicer of its
  own (a slicer the person names stays). The rest follows from no date: the writer's no-time layout (D16), no line
  chart, no month tooltip page. plan_layout: the layout made for no time, no axis to the Gulf date questions, and the
  answer's timeAxis says only `{ none: true, sayInPlan: "no time axis, as the person asked ..." }` (no trend
  instruction). The plan pins the fields, so create_report builds the same files (the digest as before).
- Red first: GD-12 in test-0.3.0-gulf-date-questions.mjs: on the base `FAIL  gulf-date-questions  3 of 66 checks
  failed` (planProblems: "fields.timeAxis: "none" is not written as Table[Field]"); with the fix 68 of 68 (GD-12a-e:
  a plan id, the answer's timeAxis none, no trend text and no Dim Date / Date Key in the plan, the page, the report).
- The suites that pin the edited files (field-suggest, report-fields, report-bind, report-inputs, plan_layout): 18
  suites, all green, their numbers unchanged (sp1 and sp2, plan_layout's answers byte for byte, too). build:min wrote
  field-suggest.min.js and the ?v= stamps (theme-generator.js and its pages); test-site-config green; the website's
  scripts/tests/run-all.mjs 42 of 42 (run alone: run beside 3 MCP suites its shared browser crashed, 26 "crash").
- CHANGELOG [Unreleased]: two plain lines (the page names everything; no time axis when asked).

## Decisions I made
- (a) is a page gap: the evidence is the gate (create_report takes path and planId only, writes the approved plan's
  files by digest; an unapproved plan's id is refused), the re-plan test, and the counts above.
- The list is read back from the exact files (the reading layer), not rebuilt from the plan's slots: it can't say
  something other than what is written. Kept in the plan's data (`pagesWritten`), outside the digest.
- One row a page with one item per kind (the brief's "a count line per page"); the slicers and the charts' fields
  are named, cards, text boxes, shapes and groups only counted. Buttons by where they go; a bookmark button by its
  name "(a bookmark)", no claim on what the bookmark restores (the file says only which bookmark).
- (b) the row stays and points to the list (it is true: DataArcus chose them); without a read-back (no path) it
  is as before.
- (c) the plan's kind changes are the first page's (plan_layout's slots): said "on page 1 "<name>"". The other
  pages' kinds are in the list.
- (d) every tooltip page is named, with its visuals and the pages that show it; not drawn in the preview.
- (e) `timeAxis: "none"` on the existing planFields (and create_report's fields), not a new input: the smallest
  option, pinned with the plan like every field. It also leaves out the year slicer the picker would add; a slicer
  the person names (Dim Date[Year]) stays, as asked.
- sp23, sp44 and rc24 changed: this job's text exactly (Step 3).

## For the owner
- The Arabic of the new section (Step 3): a draft for you to approve or change.
- Whether the preview should also draw the tooltip pages (named now, not drawn).

## Risky changes
- `assets/js/field-suggest.js` (shared with the website): `pinned.noDate` only; the website never pins it, so its
  picks are the same (run-all 42 of 42, sp30 and the field-suggest suites unchanged).

## Seen, not in scope
- The Layout row shows "Filters: true" for filters "top" (the raw value, not "top").
- plan_layout's kindChanges, like the page, covers the first page only; a kind changed on page 2 is said only by
  the new list.
- The website's run-all crashes its shared browser when run beside other suites in this container (26 "crash");
  alone, 42 of 42.

## Lessons for the reviewer
- To see the gap: plan a design report with path (any made-up model) and count the written pages' visual.json
  against the page: the old page named only the Fields rows. A9 does it on its own made-up service model.
- sp23/sp44 were re-recorded only after a dump of the base's and the branch's pages (SP23_DUMP): 2 lines rewritten,
  the rest the new section; the 16 other entries unchanged. Check that before accepting any re-record.
- This container's clone was shallow: sp6 and glass-tables need the base commits (`git fetch --unshallow`).
