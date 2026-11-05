## Summary
- **Approval:** the brief "PF2 (0.3.2)" (5 Nov), B-383 (PF1's "Seen, not in scope", lab/look032 C; the owner's D-1105-11 "4 whenever you need").
- **Base:** fix/0.3.2-pf2 from origin/integration/0.3.2 (b8063087, PF1 merged). Push only it; integration merged in once before the last CI; no PR.
- **Scope:** plan_layout with kpis 0 and no planFields.kpis still wrote 2 cards showing Total Sales. Measured first (below): they are the two tooltip pages' own cards (one each), on all 4 layouts; no report page gets a card with kpis 0. So not a kpis bug: the plan must name every card it writes, page by page, before Approve. Done in plan-lint.mjs pagesWritten (the one reader of the planned pages) and plan_layout's answer (a new `cardsWritten`).
- **Expected checks:** new suite pf2 (area report), about 14 checks, red on b8063087 first (the plan names no card); pf1 21 unchanged; sp1 and sp2 (plan_layout's recorded answers) move on purpose for each case with a model (the new key), re-recorded field by field below; every other suite unchanged.
- **Resume:** step 1 (the note). Next: pf2 red on the base, then the fix.

## The plan
1. Pin the exact input (L-1105-09): pf1's Time Lab model (its `model()` moved to a shared fixture, never a copy), plan_layout { path, layout "exec", kpis 0, name "TL", planFields { measure Sales[Total Sales], timeAxis Sales[FiscalYear], category Sales[Qtr], category2 «المبيعات»[«شهر»] } } (no filters, no planFields.kpis), approve_plan, create_report.
2. Diagnose with file:line (below).
3. Fix in one place: pagesWritten names each card's measures (a "no data" message card apart); plan_layout's answer says them page by page (cardsWritten, with its sayInPlan). Checks for each page kind (the first page's top row, the designed second page, each tooltip page) with kpis 0 and kpis 3, and the written report's cards equal the plan's, page by page.

## Diagnosis (measured on b8063087, the pinned input)
- Written: 9 cardVisual files. 7 are the "no data" message cards laid over each chart (report measure "No data: Total Sales", noDataMessage, already said: designLint COVER_CARDS and reportLook.noDataMessage). The other 2 show Sales[Total Sales]: one on each tooltip page ("Tooltip" and "Tooltip · شهر", 352 x 76 at 12,8). The report pages ("Executive summary", "Details") have no KPI card: kpis 0 is honoured (report-build.mjs:156 askedCards = design.layout.kpis = 0).
- The same on layouts exec, analysis, ops, focus with kpis 0 and 3: each tooltip page brings its own card (pbip-export.js, the tooltip page's design), whatever kpis is.
- The plan: plan_layout's answer lists the first page's slots only (`slots`) and says "4 pages (2 tooltip)" (exactCheck); nowhere does it say a tooltip page holds a card or what it shows. The approval window's page list (plan-lint.mjs pagesWritten -> approval-disclosure.mjs pagesSection) counts "1 card" per tooltip page but not its measure, and counts the "no data" cards as cards (page 1: "4 cards" with kpis 0).
