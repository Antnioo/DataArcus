## Summary
- **Approval:** the brief "AP1 (0.3.2)" (5 Nov): the product promise (nothing written before approval; the approval page
  says exactly what its click writes, 0.3.0 D6/SQ3) and D-1104-10. E1 round 5's top finding (DataArcus 6b419ef3).
- **Base:** `fix/0.3.2-ap1` from `origin/integration/0.3.2` at 6b419ef (the brief's 2d5bbe4f is not an object in this
  clone; 6b419ef is the head the testers ran). Push only this branch; never merge, no PR.
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
- **State:** step 2 done.
- **Resume:** step 3 (the failing test in test-0.3.0-approval-complete.mjs).

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
