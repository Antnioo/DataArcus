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
- **State:** step 1.
- **Resume:** step 2.
