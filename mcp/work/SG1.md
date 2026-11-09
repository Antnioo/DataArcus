# SG1 (0.3.3): the 15 same-shape groups, each into the shared library or written down as different (B-422)

## Summary
- **Approval:** the reviewer's brief "SG1" (9 Nov); the owner D-1109-05 ("yes queue it for 0.3.3 after LK1"), D-1104-12 (one job, one place, the shared library). B-422.
- **Base:** `fix/0.3.3-sg1` from `origin/integration/0.3.3` at 8f5624e6 (LK1 merged). Push only this branch.
- **Scope:** 11 groups SAME JOB moved into an existing shared file (no new module), 4 groups DIFFERENT written down below for the engine's allow list. No behaviour change: every answer, page and written file byte for byte the same.
- **Expected checks:** new suite `sg1` (one parity part per moved group, red on 8f5624e6 first: the shared names do not exist there); every split test that pins the touched files' requires (sp10, sp11, sp20, sp21, sp26, sp30, sp38, sp40, sp42) passes, a new shared require allowed on purpose and said per test; no recorded fixture moves; test-contracts, check-contracts, check-modules, lint PASS; areas report, core, arabic, checker, model; site suites dd2w, theme-generator, build page.
- **Resume:** 2026-11-09T23:31Z: State: plan pushed; next: the sg1 suite (red), then the moves group by group.

## Plan (group, decision, where it goes)
1. `text` x6 (confirm-memory, dax-reference-parser, gulf-health, model-health-tmdl, model-index, mcp shadow-model `textOf`): SAME JOB (an expression given as a string or as lines -> one text). One place: `assets/js/dax-reference-parser.js` `exprText` (its own `text` was the first; it loads first on the health page and in the worker).
2. `lit`/`litOf` x6 (mirror-policy, report-a11y, report-rules, visual-replace, mcp check-impact, mcp arabic-lens): SAME JOB (a property's raw Literal.Value, else undefined). One place: `assets/js/pbir-values.js` `litValue` (all six already load pbir-values).
3. `el` x3 (build-page, build-usage, theme-download-ui): SAME JOB (an element with a class and a text). One place: `assets/js/page-toast.js` `el(doc, tag, cls, text)`; build/index.html loads page-toast.min.js before build-usage.
4. `keyOf` x2 (metric-switcher, status-icons): SAME JOB ("'T'[M]" -> { t, m }). One place: `mcp/lib/model-script.mjs` `keyOf` (both already import it).
5. isDir/isLink/isFile (model.mjs, read-report.mjs): DIFFERENT (below).
6. rank / addGulfCalendar: DIFFERENT (below).
7. `leaves` x2 (redesign-kinds, redesign-patches): SAME JOB. One place: redesign-kinds.mjs exports it; redesign-patches reads `Kinds.leaves`.
8. `pathOut` x2 (native-copy, twin-read): SAME JOB (and native-copy's `relRoot` is twin-read's too). One place: twin-read.mjs (already exported).
9. `save` x3 (calendar-generator, licensing-calculator, measure-builder): SAME JOB (a page's state into localStorage, private mode ignored). One place: page-toast.js `saveState(key, state)`; the licensing page loads page-toast.min.js.
10. `hexToRgb` / pbip-query `p` (in mixHex): SAME JOB (#rrggbb -> [r, g, b]). One place: `assets/js/contrast.js` `hexToRgb` (both already load contrast).
11. toast (exam-view, health-view): DIFFERENT (below).
12. shown / cleanName: DIFFERENT (below).
13. `entries` x2 (layout-check, report-inventory; their `plain` and `anyOf` are the same copies): SAME JOB. One place: pbir-values.js `entries`, `plain`, `anyOf` (both already load it).
14. `relOut` x2 (arabic-lens, check-redact): SAME JOB. One place: check-redact.mjs (already exported).
15. `put` x2 (dax-functions, status-icons): SAME JOB (a JSON written back into the plan's file at that path). One place: model-script.mjs `putJson(files, at, p, j)` (both import it). flip-cards' `put` adds a missing file too: a different answer, left.

## For the reviewer: allow list
- 5. `mcp/lib/model.mjs` `isDir`, `isLink`; `mcp/lib/read-report.mjs` `isFile`, `isDir`: four questions: model.mjs `isDir` follows a link (statSync), read-report's `isDir` and `isFile` never do (lstatSync, the read boundary that refuses links), `isLink` asks for the link itself. Already in CONTRACTS.md "Not one question" (isDir/isLink). (model.mjs is TC1's file tonight: not touched.)
- 6. `assets/js/field-suggest.js` `rank`, `mcp/lib/gulf-calendar.mjs` `addGulfCalendar`: two step pipelines (FN1F, FN1G) with the same shape (a context, five calls, the last returned): field ranking and the calendar table, different jobs.
- 11. `assets/js/exam-view.js` `toast`, `assets/js/health-view.js` `toast`: already one-line calls of the one place (page-toast.js `toast` + `boxToast`, DD2W); each passes its own box id, class and time (2200 / 1800 ms).
- 12. `mcp/lib/plans.mjs` `shown`, `mcp/lib/read-report.mjs` `cleanName`: a plan value's canonical text capped at 200 (the approval's wording) and a report name made visible and capped at 60 (the read boundary): different texts, different caps.

## Lines before (wc -l of every file this job may touch)
- total 7787 over the 34 files (the list: scratch wc-before.txt; after: the same list).
