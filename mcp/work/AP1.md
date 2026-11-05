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
- **State:** step 3 done.
- **Resume:** step 4, (e): planFields.timeAxis "none".

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
