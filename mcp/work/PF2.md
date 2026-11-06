## Summary
- **Approval:** the brief "PF2 (0.3.2)" (5 Nov), B-383 (PF1's "Seen, not in scope", lab/look032 C; the owner's D-1105-11 "4 whenever you need").
- **Base:** fix/0.3.2-pf2 from origin/integration/0.3.2 (b8063087, PF1 merged). Push only it; integration merged in once before the last CI; no PR.
- **Scope:** plan_layout with kpis 0 and no planFields.kpis still wrote 2 cards showing Total Sales. Measured first (below): they are the two tooltip pages' own cards (one each), on all 4 layouts; no report page gets a card with kpis 0. So not a kpis bug: the plan must name every card it writes, page by page, before Approve. Done in plan-lint.mjs pagesWritten (the one reader of the planned pages) and plan_layout's answer (a new `cardsWritten`, with a plan id).
- **Expected checks:** new suite pf2 (area report) 15 checks, red on b8063087 first (8 of 15); pf1 21 unchanged; sp1, sp3, sp4, sp7, sp13, sp43 keep their checks, 35 recorded plan answers moved on purpose (the new key only, below); every other suite unchanged.
- **Resume:** done. CI green: https://github.com/Antnioo/DataArcus/actions/runs/42130662303 on 74579e27 (integration/0.3.2 still b8063087, the base: nothing to merge).

## The plan
1. Pin the exact input (L-1105-09): pf1's Time Lab model (its `model()` moved to a shared fixture, never a copy), plan_layout { path, layout "exec", kpis 0, name "TL", planFields { measure Sales[Total Sales], timeAxis Sales[FiscalYear], category Sales[Qtr], category2 «المبيعات»[«شهر»] } } (no filters, no planFields.kpis), approve_plan, create_report.
2. Diagnose with file:line (below).
3. Fix in one place: pagesWritten names each card's measures (a "no data" message card apart); plan_layout's answer says them page by page (cardsWritten, with its sayInPlan). Checks for each page kind (the first page's top row, the designed second page, each tooltip page) with kpis 0 and kpis 3, and the written report's cards equal the plan's, page by page.

## Diagnosis (measured on b8063087, the pinned input)
- Written: 9 cardVisual files. 7 are the "no data" message cards laid over each chart (report measure "No data: Total Sales", noDataMessage, already said: designLint COVER_CARDS and reportLook.noDataMessage). The other 2 show Sales[Total Sales]: one on each tooltip page ("Tooltip" and "Tooltip · شهر", 352 x 76 at 12,8). The report pages ("Executive summary", "Details") have no KPI card: kpis 0 is honoured (report-build.mjs:156 askedCards = design.layout.kpis = 0).
- The same on layouts exec, analysis, ops, focus with kpis 0 and 3: each tooltip page brings its own card (pbip-export.js, the tooltip page's design), whatever kpis is.
- The plan: plan_layout's answer lists the first page's slots only (`slots`) and says "4 pages (2 tooltip)" (exactCheck); nowhere does it say a tooltip page holds a card or what it shows. The approval window's page list (plan-lint.mjs pagesWritten -> approval-disclosure.mjs pagesSection) counts "1 card" per tooltip page but not its measure, and counts the "no data" cards as cards (page 1: "4 cards" with kpis 0).

## Before -> after
- plan_layout's answer with a plan id, pinned input: no word of any card -> `cardsWritten` { kpis 0, pages: "Tooltip" (tooltip) ["Sales[Total Sales]"], "Tooltip · شهر" (tooltip) ["Sales[Total Sales]"], sayInPlan: "Say in the plan each card in pages (the measure it shows): kpis 0 writes no KPI card on the report pages; each tooltip page's own card shows the measure at the point a reader hovers, whatever kpis is." }. A page with no card visual is not listed. A step with no plan id yet (planProblems, the bilingual step before the Arabic texts) gets none.
- The approval page's data (pagesWritten, plan-lint.mjs): each page gains `cards` (each card by its model measures, in the page's reading order: y then x) and `messageCards` (the "no data" cards). Its other lists unchanged (the approval page's HTML is byte for byte the base's: sp23 29, sp44 23).
- What is written: unchanged, byte for byte (every written file and create_report answer in sp3, sp4, sp7, sp13, sp43). kpis 0 still writes no report-page card; each tooltip page keeps its own card (its design, whatever kpis).
- Answer sizes: the largest pinned plan (B5, hr1 from a 136-character folder) under AIM 38,000 (hr1 10 PASS); the step before the Arabic texts unchanged (hr2 7 PASS).
- Area runs on 74579e27 (each from its run's last line): report 67 suites passed, core 11; mutation 225 (88 mutants, all killed; run alone); lint exit 0; test-contracts 14, contracts 715, modules 1160, result-lines 219, changelog-words 223, agent-memory 444.
- pf2: red on b8063087 first: 8 of 15 (7 failed: C2 x3 and its two sayInPlan checks, C3 x2); now 15 of 15. pf1 21 (now reading fixtures/time-lab.mjs).

## Changed on purpose
Each re-recorded entry differs from the base only by the new `cardsWritten` key: dumped on b8063087 (a worktree) and on this branch (SP1_DUMP, SP3_DUMP, SP4_DUMP, SP7_DUMP, SP13_DUMP, and a temporary dump line in sp43, reverted), then compared with that key cut out of each text: equal, every one; every written file and create_report answer equal as they are. Re-recorded with each suite's *_RECORD; `git diff` shows only these 35 length and sha256 pairs (base -> branch, characters):
- sp1-answers.json (5 of 10): P3 English on a model 10815 -> 11354; P4 Arabic, names approved 16545 -> 17109; P5 Arabic, no names 20054 -> 20591; P8 hand-placed pages 10670 -> 11074; P9 options and scripts 17023 -> 17428. P1, P2, P7 (no exact files), P6 and P10 (no plan id) unchanged.
- sp3-answers.json (7 plans): R9 12669 -> 13290; R2 10814 -> 11353; R3 13585 -> 14164; R4 16546 -> 17110; R5 bilingual 24008 -> 24830; R6 23488 -> 23888; R8 10688 -> 11134.
- sp4-answers.json (3 plans): P1 15745 -> 15913; P2 14981 -> 15547; P3 12063 -> 12531.
- sp7-reports.json (8 plans): T1 12554 -> 13141; T2 13390 -> 13980; T3 17328 -> 17878; T4 19506 -> 20065; T5 10816 -> 11355; T6 21332 -> 21873; T7 17737 -> 18274; T8 10687 -> 11091.
- sp13-reports.json (9 plans): T1 12555 -> 13142; T2 13742 -> 14332; T3 17322 -> 17872; T4 19507 -> 20066; T5 13067 -> 13615; T6 10690 -> 11094; T7 19810 -> 20213; T8 10968 -> 11372; T9 19556 -> 19959.
- sp43-split.json (3 of 17): P1 (plan, write, files: the plan part only) 62567 -> 62967; P2 (a changed pin refused) 24827 -> 25227; P5 SP43 hand 10684 -> 11133.
- Every other suite that calls plan_layout (126 files) passes unchanged: fn1c 74, approval-complete 68, pf1t, sp2, sp23, sp44, hr1, hr2 among them.

## CHANGELOG line
The plan names every card the report writes, page by page, the card each tooltip page holds too.

## Decisions I made
- Not a kpis bug, so no card was removed: kpis is "KPI cards in the top row" (plan_layout.mjs:59) and no report page gets one with kpis 0 on any of the 4 layouts. The tooltip page's card is that page's design (the value a reader points at). The brief's other branch applies: the plan names it.
- One place: the cards are read from the plan's exact files by plan-lint.mjs pagesWritten, the same list the approval page gets; cardsWritten only words it for the AI app. No second reader.
- A card of report measures only (the "no data" message, report measure "No data: <measure>") is counted as messageCards, not as a card with a value: it is already said (designLint COVER_CARDS, reportLook.noDataMessage).
- The cards are sorted by their own position (y, x). pagesWritten's existing sort (AP1) reads `rx`/`ry`, which report-inventory.mjs:211 deletes, so it keeps the files' order; fixing it reordered the approval page's lists (sp23's pinned HTML moved at equal length), FN1E's page: left as it is, said under "For the owner".
- cardsWritten only with a plan id, and only pages that hold a card, with one short sentence: a first version (every page, messageCards, a longer sentence) took the bilingual step before the Arabic texts (hr2) 790 characters over AIM and B5 (hr1) 23 over. A step with no plan id is not what Approve approves.
- The sentence never says "no KPI card" unless kpis is 0: KPI cards drawn as pictures (flipCards, svgCards) are not card visuals and are said in their own part (B5: kpis 4 with flip cards).
- Caps: 40 pages, 12 cards a page (notListed when more pages).
- Time Lab moved from pf1 into fixtures/time-lab.mjs (pf1 and pf2 import it; no copy).

## For the owner
- pagesWritten (lib/plan-lint.mjs) sorts each page's visuals by `rx`/`ry`, keys the inventory deletes, so the approval page lists slicers, buttons and charts in the files' order, not the page's reading order as its comment says. A one-line fix (y, x) reorders the approval page (sp23 re-recorded); not done here because the page is FN1E's. Fix after FN1E?
- The approval window (lib/approval-disclosure.mjs pagesSection, FN1E's file: not touched) counts cards per page ("1 card" on each tooltip page, "4 cards" on the first page with kpis 0) but does not say the measure a card shows, and counts the "no data" message cards as cards. The data is now there (pagesWritten `cards`, `messageCards`); showing it is a change in that file, after FN1E.

## Risky changes
- What an answer returns: plan_layout's answer with a plan id gains `cardsWritten` (field names only, metadata; capped). The approval page's data gains `cards` and `messageCards` per page (not rendered: the page is unchanged). Nothing written changes. Tests that lose checks: none (35 recorded digests moved, each said above; every check kept).

## For the laptop
- Re-run look032 C's B-383 input from this branch: the 2 cards are the tooltip pages' (hover a chart); the plan's cardsWritten names them.

## Seen, not in scope
- A model with no measures and kpis 4 (sp4 P1): no card anywhere, so cardsWritten lists no page; the plan's other parts say why.

## Lessons for the reviewer
- pagesWritten's sort (AP1) never sorted: it read keys the inventory deletes. A sort over fields should be pinned by a test with two visuals out of file order.
- The mutation suite run beside three other suites lost 4 approval-http mutants (timing under load); alone it kills all 88 on the base and here.
- A new key in plan_layout's answer moves 6 recorded suites (sp1, sp3, sp4, sp7, sp13, sp43) and meets the headroom pins (hr1, hr2): the brief named sp4 and sp43 only. A sweep of every test that calls plan_layout (126 files, 4 at a time, about 25 minutes) found them all.
- The brief named report-build.mjs maxKpis as the likely cause; measuring which page each card sat on (5 minutes) showed none on a report page.
