## Summary
- **Approval:** the owner, 25 Oct (SQ0, the night run): every "Seen, not in scope" since 0.2.9 checked and queued.
- **Scope:** docs only: this queue, one back link under each source note's "Seen" heading, one line in `mcp/WORK.md`.
- **Base:** `chore/0.3.1-seen-queue` from `origin/integration/0.3.1` (2bf8bae).
- **Expected checks:** `node scripts/check-agent-memory.mjs` PASS. Planned about 410 items; measured **442** in 75 notes
  (prose items numbered too; 0.2.9-crossreview, 0.2.9-fuzz and R7-claims have no "Seen" section).
- **Resume:** done. Next builders take one batch each, from the top (below).

**Counts (442):** DONE 88 · OPEN 106 · OBSOLETE 115 · OWNER 107 (56 laptop checks, 51 decisions) · DUPLICATE 26.
Planned shares were 35 / 35 / 10 / 15 / 5 %; measured 20 / 24 / 26 / 24 / 6 %: many items were notes, not tasks.

**Batches (all 106 OPEN items, each once; ordered by value; about 45-60 min each):**
- SQ1 written report numbers and text (writer engines, 5) · SQ2 Arabic in the other writes (4)
- SQ3 approval page EN/AR and the gate (8) · SQ4 Arabic twin (7) · SQ5 check_report rules (4)
- SQ6 reader (6) · SQ7 calendar and health (7) · SQ8 website pages EN/AR (6) · SQ9 tool texts and claims (11)
- SQ10 plan and create_report notes (11) · SQ11 tests and CI (8) · SQ12 docs and memory (9)
- SQ13 design engine and previews (8) · SQ14 one Arabic month list, checker internals (5, after SQ1, SQ2, SQ7)
- SQ15 refactors, one item per builder (7, M-L)
- Side by side: SQ1-SQ11 and SQ13 touch disjoint files (SQ7 and SQ9 both edit `mcp/TOOLS.md`, different sections);
  SQ12 after SQ1, SQ4 and SQ13 (it edits their comments); SQ14 after SQ1, SQ2, SQ7; SQ15 after SQ6, SQ10, SQ13.

**How to use:** a builder takes the next free batch, branches `fix/0.3.1-<batch id>` from the integration head, writes
the plan in `mcp/work/<batch id>.md` (summary first), fixes each item with a test first by risk, runs the batch's
suites, and in the same push marks each item here DONE with the commit (Status cell; nothing else in this file).
"Verify first" in a fix: confirm the item first; when it is not true, mark it OBSOLETE with why. Desktop work never
enters a batch: the OWNER list below goes to the batched laptop run and the owner's decisions.

**Urgent (user-visible today, all in batches):** 0.2.9-writer-S14 a quarter chart can show "8.0Kkg" (SQ1); L6-S2 Latin
K/M/B on Arabic KPI card pictures when daxFunctions is on (SQ2); J19-S1 an English axis unit in an Arabic native copy
(SQ2); M1-S4 negative slicer widths in a narrow Arabic slot (SQ1); GC-S1 the Gulf calendar share image's old weekend
line (SQ8). Conditional: W-S4, merge to main only with the 0.3.1 download live.

Evidence: hashes before fab795c (0.3.0) are history squashed there; such items cite the job and today's file:line.

## Batches

### SQ1: written report numbers and text
0.2.9-writer-S14, M1-S4, 0.2.9-writer-S4, S1-S9, 0.2.9-writer-S6. Files: `assets/js/pbip-page.js`,
`assets/js/pbip-query.js`, `assets/js/pbip-sizing.js` (+ `npm run build:min`). Suites: `npm test -- report`,
`npm test -- core` (golden), `scripts/tests/run-all.mjs`. Desktop: no (M1-S4 drops a part, never resizes below a
measured floor).

### SQ2: Arabic in the MCP's other writes
L6-S2, J19-S1, J19-S5, A1-S4. Files: `mcp/lib/dax-functions.mjs`, `mcp/lib/visual-meaning.mjs`,
`assets/js/visual-replace.js`, `mcp/lib/native-copy.mjs`, `mcp/lib/redesign.mjs`. Suites: `npm test -- report`,
`npm test -- arabic`. Desktop: no.

### SQ3: the approval page in English and Arabic, and the gate
T1-S6, T1-S8, T1-S9, T1-S13, D6-S3, A2-S9, V1-S3, A3-S1. Files: `mcp/lib/approval-window.mjs`,
`mcp/tools/create_arabic_twin.mjs`, `mcp/lib/plans.mjs`. Suites: `npm test -- safety`, `npm test -- twin`.
Desktop: no.

### SQ4: the Arabic twin
AF1-S1, X1-S2, X2-S3, D3-S1, J18-S4, Q1-S7, X2-S1. Files: `mcp/lib/twin-write.mjs`, `twin-copy.mjs`,
`twin-texts.mjs`, `twin-read.mjs`, `twin-plan.mjs`, `assets/js/report-mirror.js`. Suites: `npm test -- twin`,
`mcp/test-0.3.1-mirror-parity.mjs` (route b). Desktop: no (D3-S1 reuses the measured title rule).

### SQ5: check_report rules
0.2.9-writer-S12, R1-S2, T1-S7, 0.2.9-writer-S18. Files: `assets/js/report-rules.js`, `assets/js/report-a11y.js`,
`assets/js/layout-check.js`, then `mcp/lib/check-report.mjs: Rules` only if a rule is added (route a). Suites:
`scripts/tests/report-check.mjs`, `mcp/test-0.3.1-checker.mjs`, `npm test -- checker`. Desktop: no (22.2 + 53 is measured).

### SQ6: the reader
0.2.9-checks-S4, 0.2.9-reader-S15, 0.2.9-reader-S12, 0.2.9-custom-visuals-S4, audit-5-reading-S3, 0.2.9-reader-S24.
Files: `mcp/lib/model.mjs`, `mcp/lib/read-report.mjs`, `mcp/lib/scope.mjs`. Suites: `npm test -- model`,
`npm test -- safety`, `mcp/test-platform-paths.mjs`. Desktop: no.

### SQ7: calendar and health
C1-S1, GC-S5, GC-S4, 0.2.9-reader-S14, audit-6-mcp-tools-S3, E-S2, WORK-2026-10-05-09-S8. Files:
`assets/js/calendar-generator.js`, `mcp/lib/gulf-calendar.mjs`, `mcp/tools/add_gulf_calendar.mjs`,
`mcp/tools/check_model_health.mjs`, `assets/js/model-health.js`, `mcp/TOOLS.md` (its two sections). Suites:
`npm test -- model`, `scripts/tests/run-all.mjs`, `node scripts/test-site-config.mjs`. Desktop: no.

### SQ8: website pages, English and Arabic
GC-S1, 0.2.9-design-S4, I-S3, GC2-S4, I-S1, DS1-S3. Files: `scripts/make-share-images.mjs` (+ the image),
`assets/js/theme-generator.js`, `assets/js/dp600-sim.js`, the Gulf calendar and licensing articles EN and AR,
`scripts/sitemap-lastmod.mjs`. Suites: route (d): `node scripts/ar-pages.mjs`, `node scripts/test-site-config.mjs`,
`scripts/tests/run-all.mjs`. Desktop: no.

### SQ9: tool texts and public claims in the package
AF2-S1, C-S1, 0.2.9-checks-S9, 0.2.9-design-S8, Q1-S9, A2-S11, A2-S12, S1-S2, W2-S4, D5-S1, A2-S7. Files:
`mcp/TOOLS.md` (create_report), `mcp/lib/agent-text.mjs` (not the instructions), `mcp/tools/check_report.mjs`,
`mcp/lib/tool-inputs.mjs`, `mcp/tools/read_model.mjs`, `mcp/skills/report-design/SKILL.md` (both copies),
`mcp/README.md`, `mcp/PRODUCT_SPEC.md`, `mcp/skills-packaging/README.md`, `mcp/package.json`. Suites:
`mcp/test-0.3.0-claims.mjs`, `npm test -- release`. Desktop: no.

### SQ10: plan and create_report notes
0.2.9-design-S13, 0.2.9-writer-S19, AF2-S4, J17-S2, audit-3-picker-writer-S2, WORK-2026-10-05-09-S2, K2-S1, AF2-S3,
L6-S4, Q1-S8, S9-S4. Files: `mcp/lib/report-run.mjs`, `mcp/tools/plan_layout.mjs`. Suites: `npm test -- report`,
`mcp/test-0.3.0-claims.mjs`. Desktop: no. About 60-75 min (eleven S items).

### SQ11: tests and CI
0.2.9-writer-S8, A2-S1, A3-S6, G1-S1, M1-S5, DS1-S4, Q1-S2, A2-S10. Files: `mcp/test-models/golden-expected.json`,
`scripts/ci-sum.mjs`, `mcp/test-0.3.0-arabic-sweep.mjs`, `mcp/test-0.3.0-sweep-s1.mjs`,
`mcp/test-0.3.1-mirror-parity.mjs`, a site test for the GitHub anchors, `eslint.config.mjs`,
`mcp/test-0.3.0-approval-disclosure.mjs`. Suites: each changed suite, `node scripts/check-result-lines.mjs`, lint.
Desktop: no. Never loosen an expected number to pass.

### SQ12: docs and memory
A1-agent-memory-S1 to S4, RB-S6, A2-S5, G1-S5, RB-S5, W-S5 (with `mcp/ROADMAP.md:5`'s "16 suites"). Files: four code
comments (after SQ1, SQ4, SQ13), `mcp/PRODUCT_SPEC.md` and the plans' cites, `mcp/ROADMAP.md`, `ARCHITECTURE.md` (make
room first: S4 before RB-S6), `mcp/CHANGELOG.md`, `mcp/schemas/SOURCE.md`, `mcp/work/T1.md`, `content/BLOG-PLAN.md`.
Suites: `node scripts/check-agent-memory.mjs`, `node scripts/changelog-words.mjs`. Desktop: no.

### SQ13: design engine and previews
0.2.9-writer-S1, 0.2.9-writer-S10, R1-see-the-result-S3, V1-S2, V1-S4, L2-S1, 0.2.9-reader-S13, 0.2.9-design-S2.
Files: `mcp/lib/design.mjs`, `assets/js/design-engine.js`, `assets/js/page-preview.js`, `assets/js/pbip-bind.js`,
`mcp/lib/plan-lint.mjs` (+ build:min). Suites: `npm test -- report`, `npm test -- core`, `scripts/tests/run-all.mjs`.
Desktop: no; stop if a layout result moves (what Desktop shows).

### SQ14: one Arabic month list; checker internals
Q1-S3, WORK-2026-10-11-14-S1, L6-S11, S1-S8, S1-S3. Files: `assets/js/arabic-calendar.js`, `pbip-query.js`,
`calendar-generator.js`, `theme-generator.js`, `mcp/lib/shadow-model.mjs`, `mcp/lib/dax-functions.mjs`,
`mcp/lib/check-report.mjs`. After SQ1, SQ2, SQ7. Suites: `npm test -- arabic`, `npm test -- checker`, run-all.

### SQ15: refactors (one item per builder slot, M-L)
0.2.9-reader-S8 (L, after SQ10 and SQ13), 0.2.9-reader-S21 (test.mjs's own reader, M), Q1-S5 (website coverage, L),
L5-S1 (model KPI targets, M), J18-S2 (Latin runs in website downloads, M), L3-S2 (switcher relationships, M),
0.2.9-reader-S4 (the lab's unread items, M). Each its own job note and plan.

## The owner's list (never in a batch)

### For the laptop (one batched run, with the "For the laptop" lists in WORK.md)
0.2.9-checks-S2, 0.2.9-checks-S3, 0.2.9-checks-S8, 0.2.9-checks-S10, 0.2.9-design-S1, 0.2.9-writer-S9, 0.2.9-writer-S13, 0.2.9-writer-S16, 0.2.9-writer-S17, 0.2.9-reader-S3, 0.2.9-reader-S19, 0.2.9-reader-S26, 0.3.0-arabic-twin-S2, 0.3.0-arabic-twin-S5, 0.3.0-arabic-twin-S6, audit-summary-S3, audit-2-design-engine-S1, audit-4-checks-S1, audit-8-packaging-S1, audit-8-packaging-S2, WORK-2026-10-05-09-S4, WORK-2026-10-11-14-S9, WORK-2026-10-11-14-S23, A1-S2, A1-S3, A3-S5, C1-S2, C1-S3, D1-S3, D5-S10, D7-S2, F1-S1, F2-S1, J19-S3, J19-S6, K1-S3, K1-S9, L2-S3, L3-S4, L4-S5, L5-S3, L5-S5, L6-S8, L6-S12, L6-S13, M1-S3, Q1-S6, R1-see-the-result-S1, R1-S6, R1-S7, T1-S10, T1-S15, U1-S4, V1-S1, W-S2, X1-S1.

### Decisions
0.2.9-checks-S1, 0.2.9-custom-visuals-S1, 0.2.9-custom-visuals-S2, 0.2.9-design-S9, 0.2.9-design-S11, 0.2.9-writer-S7, 0.2.9-reader-S1, 0.2.9-reader-S5, 0.2.9-reader-S25, 0.3.0-arabic-twin-S4, audit-summary-S4, audit-8-packaging-S3, WORK-2026-10-05-09-S11, WORK-2026-10-11-14-S10, WORK-2026-10-11-14-S22, A1-agent-memory-S5, A3-S2, A3-S3, AF1-S2, D5-S2, D5-S7, DS1-S1, E-S3, E2-S3, F2-S2, G1-S2, GC-S2, GC-S6, GC2-S5, I-S2, J18-S5, J19-S2, K1-S1, K1-S4, K1-S6, K1-S7, L2-S2, L3-S1, L3-S3, L5-S2, L5-S4, L6-S1, M1-S1, M1-S2, R1-see-the-result-S4, RB-S3, RB-S4, S9-S3, W-S3, W-S4, W2-S1.

Each item's question is in its row below (last cell).

## Per note
Item ids: `<NOTE>-S<n>`, the note's top-level items in file order across all its "Seen" sections.

### 0.2.9-checks

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| 0.2.9-checks-S1 | THEME_NAME fix says Desktop "may not load" the theme | OWNER | `assets/js/report-rules.js:337` still "Desktop may not load it" | decide the rewording "validator and Fabric reject it; Desktop opens it" (shared website rule) |
| 0.2.9-checks-S2 | THEME_NAME "no .platform file" half never measured | OWNER | `assets/js/report-rules.js:336` unmeasured; not in DESKTOP_OPENS | laptop: open a project without .platform in Desktop, record result |
| 0.2.9-checks-S3 | FORMATTING_OBJECT_UNKNOWN in a visual is canBreak | OWNER | `mcp/lib/check-report.mjs:115` Desktop-opens only for RegisteredResources files | laptop: open a visual with an unknown object; if it opens, widen DESKTOP_OPENS |
| 0.2.9-checks-S4 | loadModel picks first of two models at same depth silently | OPEN (SQ6: the refusal breaks v029g's fixture, the owner's call: SQ6.md Decisions 1) | `mcp/lib/model.mjs:399` sort then dirs[0], no tie check | refuse with MANY_MODELS listing both when two share the top depth · S · low · reader → **SQ6** |
| 0.2.9-checks-S5 | engine repo attach needed owner's go | OBSOLETE | informational, no action (session permission event) | — |
| 0.2.9-checks-S6 | test-0.2.9b.mjs not run by test.mjs | DONE | `mcp/test.mjs:16` imports v029b; `mcp/tests.json:112` | fixed before fab795c (history starts there) |
| 0.2.9-checks-S7 | last-6-months tooltip trend still gets TOOLTIP_SCROLL | DONE | `assets/js/report-rules.js:313-318` "Last N months" filter counted (rc.22 B-142) | fixed before fab795c; TIP_ROWS_6 27/40 at :70 |
| 0.2.9-checks-S8 | packaging hand list must carry text-measure.js, field-meaning.js | OWNER | packaging lives in engine repo; `mcp/docs/MODULES.md:45` | in dataarcus-engine (not in this repo): check the build list carries text-measure.js and field-meaning.js |
| 0.2.9-checks-S9 | check_report lang lacks Hebrew; only auto detects it | OPEN | `mcp/tools/check_report.mjs:17` enum auto/en/ar | add 'he' to enum and description (check-report.mjs:210 already detects) · S · low · tools-docs → **SQ9** |
| 0.2.9-checks-S10 | FILTER_NAME_DUPLICATE_GLOBAL still canBreak | OWNER | `mcp/lib/check-report.mjs:111-117` not in DESKTOP_OPENS | laptop: confirm Desktop opens a report with it; then add to DESKTOP_OPENS |
| 0.2.9-checks-S11 | lint's 0.57 em and thresholds unsourced | DONE | `assets/js/layout-check.js:60` CHAR_EM with measured source | builder 6's R7, 045b056 (before fab795c) |

### 0.2.9-custom-visuals

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| 0.2.9-custom-visuals-S1 | catalog lists ganttChart/heatMap/table/matrix as native | OWNER | `assets/js/visual-types.js:18-23` keeps all four (catalog 0.1.3) | decide: keep Microsoft's catalog as is, or subtract those four |
| 0.2.9-custom-visuals-S2 | text-filter custom visual becomes classic slicer, not textSlicer | OWNER | `mcp/lib/visual-meaning.mjs:97` slicer -> 'slicer' | decide on textSlicer; laptop: prove a written textSlicer opens and filters |
| 0.2.9-custom-visuals-S3 | donut hole total and bubble map place names told lost | OBSOLETE | informational, no action: by design, `visual-meaning.mjs:235-236` tells it | — |
| 0.2.9-custom-visuals-S4 | fieldOf loses date column under auto date hierarchy | DONE 08493ad (SQ6) | `mcp/lib/read-report.mjs:263` no PropertyVariationSource branch | take Entity/Property from PropertyVariationSource when no SourceRef · S · low · reader → **SQ6** |
| 0.2.9-custom-visuals-S5 | custom visual named by whole id; plan wants shorter | DONE | `mcp/lib/visual-meaning.mjs:535,568` shortType strips 32-char code | fixed before fab795c (answerOf text still full id, by design) |

### 0.2.9-design

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| 0.2.9-design-S1 | unused tooltip page; two RTL mirrors; rowH +4 unmeasured | OWNER | mirrors one engine f1216d6; tips on demand `pbip-export.js:455`; `pbip-page.js:48` +4 | laptop: measure a tab row in a non-Segoe font; set the +4 from it |
| 0.2.9-design-S2 | plan-lint builds pages without tableFields (5-field table) | OPEN | `mcp/lib/plan-lint.mjs:37` projectPages without tableFields | pass tableFields (plan's table field count) to projectPages · S · low · checker → **SQ13** |
| 0.2.9-design-S3 | LIMITS.kpiCards is a limit name, not layout key | OBSOLETE | informational, no action (`mcp/lib/tool-limits.mjs:14`) | — |
| 0.2.9-design-S4 | website layout label names chosen layout, preview shows single focus | DONE 0c69f686 (SQ8) | `assets/js/theme-generator.js:820` uses LAYOUTS[c.preset].name | name single focus when E.smallPage(c), EN and AR · S · low · website → **SQ8** |
| 0.2.9-design-S5 | packaging needs new mcp/lib/files.mjs | DUPLICATE | same check as packaging list | of 0.2.9-checks-S8 |
| 0.2.9-design-S6 | A2-3 one pure fitSlots | DONE | `assets/js/design-engine.js:803-813` one pure fitSlots | fixed before fab795c (builder 11) |
| 0.2.9-design-S7 | approve_plan text claims refusal and 2 hours falsely | DONE | `mcp/lib/plans.mjs:14,49` TTL enforced; `mcp/PRIVACY.md:258` A7-3 fixed | fixed before fab795c (gate rc.17) |
| 0.2.9-design-S8 | idempotentHint false though repeat names same file | OPEN | `mcp/lib/tool-inputs.mjs:15` ADDS idempotentHint false | verify first a repeat writes the same file; then give those two idempotentHint true · S · low · tools-docs → **SQ9** |
| 0.2.9-design-S9 | desktop extension lacks skill's screenshot/DAX consent rules | OWNER | `mcp/lib/agent-text.mjs:9` cap 2200; instructions 2195, no "screenshot" | decide what to drop or raise the cap for the screenshot/DAX consent rule |
| 0.2.9-design-S10 | A4-7, A5-1/A5-5, A6-4, A6-6 open | DONE | `mcp/PRIVACY.md:260-264` listed fixed; `check-report.mjs:483` lint impact | fixed before fab795c |
| 0.2.9-design-S11 | beta page "A real run" is the 0.2.8 run | OWNER | `power-bi-mcp/index.html:188` 8 Oct, 0.2.8, page ships 0.3.0 | decide whether to replace with a 0.3.x run (true as dated) |
| 0.2.9-design-S12 | ARABIC-VOICE.md unreadable from engine repo | OBSOLETE | informational, no action (session access note) | — |
| 0.2.9-design-S13 | table smaller and short of field: two "left out" notes | OPEN | `mcp/lib/report-run.mjs:508` always ends "a field is left out only..." | drop that clause when the same table has a field-left-out note · S · low · writer → **SQ10** |
| 0.2.9-design-S14 | picker's chart category choice is builder 5's | OBSOLETE | informational, no action (routing note) | — |
| 0.2.9-design-S15 | v029c L2 failed unreliably; run whole chain before "pass" | OBSOLETE | informational, no action; fixed by bfd2904 per note | — |

### 0.2.9-writer

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| 0.2.9-writer-S1 | plan's slots miss header growth for two tab rows | OPEN | `mcp/lib/design.mjs:268` computeSlots without headerRows | verify first; pass headerRows to the plan's slots when pages and names need two rows · M · low · design → **SQ13** |
| 0.2.9-writer-S2 | theme-generator stamp merge conflicts | OBSOLETE | merges done; informational | — |
| 0.2.9-writer-S3 | mirrorChart writes invertAxis | DONE | `assets/js/pbip-export.js:359-361` uses report-mirror rules | f1216d6 (M1: one mirror engine) |
| 0.2.9-writer-S4 | control character (tab) in model name reaches a title | DONE f026240 | `assets/js/pbip-query.js:76` drops \p{Cf} only | also replace \p{Cc} with a space in shown() · S · low · writer → **SQ1** |
| 0.2.9-writer-S5 | page names keep format characters | OBSOLETE | informational, no action (caller's names, by design) | — |
| 0.2.9-writer-S6 | iconH never called; comment says 320 x 240 | DONE f026240 | `pbip-sizing.js:103` no iconH( call; `pbip-page.js:169` "320 x 240" | drop iconH, fix comment to 320 x 284 · S · none · writer → **SQ1** |
| 0.2.9-writer-S7 | B-06/B-23 text not in repo; readings may be partial | OWNER | B-list absent from repo (grep) | confirm B-06 = text column room 12 letters, B-23 = table grid entry |
| 0.2.9-writer-S8 | golden pins no table text size | OPEN | `mcp/test-models/golden-expected.json` no table size key | pin the table text size per task in golden-expected · S · low · tests-ci → **SQ11** |
| 0.2.9-writer-S9 | column top N uses 12-letter label guess | OWNER | `scripts/tests/DESKTOP-TESTS.md:2493` S5 still to measure | laptop: run DESKTOP-TESTS S5 (columns per width), set categoryFit from it |
| 0.2.9-writer-S10 | row beside short rail keeps width; ~200 gap | OPEN | `assets/js/design-engine.js:811-812` only slots wholly below take column | verify first; widen rows beside a shortened rail · M · low · design → **SQ13** |
| 0.2.9-writer-S11 | S3, S6, D9-D12 not the writer's | OBSOLETE | informational, no action (routing) | — |
| 0.2.9-writer-S12 | TIP_ROWS still 22 a row + 46; measured 22.2 + 53 | DONE (SQ5 11a85ab) | `assets/js/report-rules.js:69,306` 22/46 | set TIP_ROWS to 22.2 + 53 with its source; update texts · S · low · checker → **SQ5** |
| 0.2.9-writer-S13 | table panel one row shorter on solid theme | OWNER | note's S3 change; edge alignment is visual | laptop: look whether the table's bottom edge misaligns on a solid theme |
| 0.2.9-writer-S14 | quarter column labels automatic units ("8.0Kkg") | DONE f026240 | `assets/js/pbip-page.js:825` labelDisplayUnits 0 always | use num(1) when yf.wholeFormat and not pct, as tooltips at :1511 · S · low · writer → **SQ1** |
| 0.2.9-writer-S15 | T3, T4, T5, T7, A2 picker or design | OBSOLETE | informational, no action (routing) | — |
| 0.2.9-writer-S16 | multi-line header 26.9, title-off/subtitle/960x720 unmeasured, 8pt header | OWNER | prose at `mcp/work/0.2.9-writer.md:225` | laptop: measure title-off, subtitle, 960 x 720; find page 1 header's 8pt source |
| 0.2.9-writer-S17 | table shadow/grey border inside panel | OWNER | prose at `mcp/work/0.2.9-writer.md:238` | laptop: look at solid and light themes' table edges |
| 0.2.9-writer-S18 | check_report passes duplicate measure names across tables | OWNER (SQ5: no Desktop measurement yet; laptop first, `mcp/work/SQ5.md`) | no such rule in `report-rules.js` / `check-report.mjs` (grep) | add a rule: report measure names unique across model, no case · M · low · checker → **SQ5** |
| 0.2.9-writer-S19 | extRenamed note says the table has the name | OPEN | `mcp/lib/report-run.mjs:534` "T already has X" for any cause | say "the model or another report measure has" when other table · S · low · writer → **SQ10** |
| 0.2.9-writer-S20 | SVG measure names named by server, not gate | OBSOLETE | informational, no action | — |
| 0.2.9-writer-S21 | picker: two charts by same-name columns of two tables | DONE | `assets/js/pbip-bind.js:688-692` otherName excludes same name | D7, before fab795c |

### 0.2.9-reader

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| 0.2.9-reader-S1 | AXIS_HAS_BLANK never fires: blank count needs consented query | OWNER | every lint call passes facts null: `mcp/lib/plan-lint.mjs:83,132`, `artifact.mjs:140` | decide whether to add a consented blank-count read (laptop-only); else keep as notChecked |
| 0.2.9-reader-S2 | plan-lint passes logoPlaceholder false; name may differ | OBSOLETE | name matches writer: `assets/js/pbip-page.js:702`, `plan-lint.mjs:68` | informational, no action |
| 0.2.9-reader-S3 | Desktop Extension manifest must list read_report | OWNER | no manifest in this repo (packaging is private) | on the laptop: check the extension manifest lists all 11 tools incl. read_report |
| 0.2.9-reader-S4 | not read: drill level, image names, z, decoration, custom names | OPEN | z read now `mcp/lib/read-report.mjs:363,548`; others absent | verify first which lab-list items remain; read them in inventory · M · low · reader → **SQ15** |
| 0.2.9-reader-S5 | server instructions near their character cap | OWNER | 2,195 of INSTRUCTIONS_MAX 2,200 `mcp/lib/agent-text.mjs:9` | decide: raise the 2,200 cap (`mcp/lib/agent-text.mjs:9`) or move a rule into tool descriptions; unblocks 0.2.9-design-S9 |
| 0.2.9-reader-S6 | merge conflicts with builder 5; npm test should run 0.2.9b | OBSOLETE | merged; 0.2.9b runs inside test.mjs `mcp/tests.json:112` | merge past; suite registered |
| 0.2.9-reader-S7 | browser suites not run locally | OBSOLETE | CI runs them | informational, no action |
| 0.2.9-reader-S8 | plan-lint binding is a hand copy of create_report's bindFor | OPEN | `plan-lint.mjs:38` Bind.suggest vs `report-run.mjs:158` bindFor+countBind | one page-and-binding function in report-run.mjs shared by plan-lint · L · low · writer → **SQ15** |
| 0.2.9-reader-S9 | lint is a second rule engine beside report-rules.js | OBSOLETE | lint moved to shared `assets/js/layout-check.js`; `design-lint.mjs:22` wraps it | engine now shared with the website |
| 0.2.9-reader-S10 | R5 done by builder 5 (lint names visual by type and place) | OBSOLETE | layout-check.js names by type/place; e8bf832 squashed away | informational, no action |
| 0.2.9-reader-S11 | audit A1-4/5/6/8/9/10/11/14, website bim cap, byName readdirSync | DONE | fab795c: `pbip-bind.js:57` unknown, `:103` cap, `model.mjs:295` readdirSafe, field-meaning.js | - |
| 0.2.9-reader-S12 | .pbit route reads the zip whole up to 300 MB | DONE 08493ad (SQ6) | `mcp/lib/model.mjs:378` readCapped(full, 300 MB) before unzipNeeded | read only the needed entries by fd from the central directory · M · low · reader → **SQ6** |
| 0.2.9-reader-S13 | pbip-bind picker keeps its own 'string' type fallbacks | OPEN | `assets/js/pbip-bind.js:334,412,430,505` `c.dataType or 'string'` | drop the fallbacks (reader gives a type) with min rebuild · S · low · reader → **SQ13** |
| 0.2.9-reader-S14 | gulf-calendar.mjs unwraps m.tmsl itself twice | OPEN | `mcp/lib/gulf-calendar.mjs:62,85` | use model.mjs's one unwrap helper (`model.mjs:92`) · S · low · calendar → **SQ7** |
| 0.2.9-reader-S15 | JSON-part errors (not valid JSON, too deep) lack codes | DONE 08493ad (SQ6) | `mcp/lib/model.mjs:208` plain Error; ReadError codes list has none | throw ReadError('BAD_JSON') / ('TOO_DEEP') · S · low · reader → **SQ6** |
| 0.2.9-reader-S16 | .pbit route reads the file whole before unpacking | DUPLICATE | same as S12 | 0.2.9-reader-S12 |
| 0.2.9-reader-S17 | A1-11 percent rule not touched | DONE | fab795c: shared `assets/js/field-meaning.js`, used `pbip-bind.js:10` | - |
| 0.2.9-reader-S18 | check_report measured rules throw on null projection/paragraphs | DONE | fab795c: entries() guards `assets/js/report-rules.js:115,141`; per-rule try `:386` | - |
| 0.2.9-reader-S19 | private-visual package not read; layout must be measured | OWNER | private source detected only `read-report.mjs:409-413` | on the laptop: save a report with a private visual, measure its package layout |
| 0.2.9-reader-S20 | base theme (SharedResources) never read | DONE | fab795c: `mcp/lib/read-report.mjs:477` reads BaseThemes | - |
| 0.2.9-reader-S21 | test.mjs keeps its own report reader | OPEN | `mcp/test.mjs:412` readReport walks visual.json itself | use lib/read-report.mjs inventory in its checks · M · low · tests-ci → **SQ15** |
| 0.2.9-reader-S22 | shared catalog to replace reader's hand list BUILTIN | DONE | fab795c: `read-report.mjs:304-306` uses visual-types.js (58 native) | - |
| 0.2.9-reader-S23 | fuzz KNOWN lists still hold other blocks' findings | DONE | fab795c: `mcp/test-fuzz.mjs:139,143,146` all empty | - |
| 0.2.9-reader-S24 | largeSummary keys area map by cut name, not raw | DONE 08493ad (SQ6) | `mcp/lib/scope.mjs:55-56` set by t.name, read by t.table | key both by the raw table name · S · low · reader → **SQ6** |
| 0.2.9-reader-S25 | page background pictures never read; dark-by-picture reads light | OWNER | no picture read in `read-report.mjs:439-453` theme identity | decide whether to read a page picture (metadata only) or keep "ask for dark" |
| 0.2.9-reader-S26 | report saved without base theme file counts leftovers as own | OWNER | `read-report.mjs:477` base null when file missing | on the laptop: check whether Desktop ever saves PBIR without BaseThemes file |
| 0.2.9-reader-S27 | theme colour reference colour not counted | OBSOLETE | by design `read-report.mjs:459-460` (literal hex only) | informational, no action |

### 0.3.0-arabic-twin

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| 0.3.0-arabic-twin-S1 | create_report writes invertAxis on categorical axes | DONE | f1216d6 (M1): only continuous `assets/js/report-mirror.js:167`, `pbip-export.js:362` | - |
| 0.3.0-arabic-twin-S2 | bookmark with display state on mirrored chart untested | OWNER | laptop check 10 never recorded (`mcp/work/0.3.0-arabic-twin.md:148`) | on the laptop: apply a display-state bookmark on a mirrored chart, see sort kept |
| 0.3.0-arabic-twin-S3 | phone layout copied, not mirrored | DONE | fab795c (0.3.0 D3): `assets/js/report-mirror.js:496-500` mirrors mobile.json | - |
| 0.3.0-arabic-twin-S4 | charts not rebound to Arabic month column after script | OWNER | no rebind input in `mcp/tools/create_arabic_twin.mjs` schema | decide whether to add a follow-up that rebinds month axes once the script is applied |
| 0.3.0-arabic-twin-S5 | extension must carry assets/js/report-mirror.js | OWNER | packaging is private, not in this repo | on the laptop: check the built extension bundle holds report-mirror.js |
| 0.3.0-arabic-twin-S6 | button text and icon rule not from the labs | OWNER | laptop check 9 never recorded (`0.3.0-arabic-twin.md:155`) | on the laptop: verify the twin's button text and icon rule in Desktop |
| 0.3.0-arabic-twin-S7 | mcp/WORK.md not updated by this branch | OBSOLETE | branch merged; WORK.md now holds 0.3.1 only | informational, no action |

### audit-summary

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| audit-summary-S1 | each block file ends with its own list | OBSOLETE | pointer only | informational, no action |
| audit-summary-S2 | website model readers have no model.bim size cap | DONE | fab795c: `assets/js/pbip-bind.js:103,125` LIMITS.model checks (also in reader-S11) | - |
| audit-summary-S3 | packaging build tests rewrite committed files, restore in finally | OWNER | private packaging, build.test.mjs not in repo (`audit-8-packaging.md:82`) | on the laptop: decide to stage to a temp folder instead of rewriting files |
| audit-summary-S4 | plans live in memory; a restart forgets them | OWNER | by design `mcp/lib/plans.mjs:4,61` | decide whether plans must survive a restart, or keep in-memory as designed |

### audit-1-model-reading

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| audit-1-model-reading-S1 | website fromFile/fromFolder parse model.bim with no size cap | DONE | `assets/js/pbip-bind.js:88,103,125` LIMITS, tooBig before reading (pre-0.3.0, fab795c) |  |
| audit-1-model-reading-S2 | byName readdirSync unwrapped; one bad subfolder fails search | DONE | `mcp/lib/model.mjs:295` readdirSafe try/catch (fab795c) |  |
| audit-1-model-reading-S3 | server DIVIDES_OR_AVERAGES is a 4th DIVIDES regex | DONE | moved to `assets/js/field-meaning.js:134`, beside DIVIDES :18; picker uses FM.divides |  |

### audit-2-design-engine

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| audit-2-design-engine-S1 | separate RTL mirrors; rowH +4 for non-Segoe font unmeasured | OWNER | mirrors joined in M1 (ed23620); `assets/js/pbip-page.js:48` +4 still unmeasured | laptop: measure page-button row height for Tahoma and another font in Desktop; keep or replace the +4 |
| audit-2-design-engine-S2 | layoutFrom fix no-op in planLayout; bad dir reset silently | DONE | `mcp/lib/design.mjs:265` repairState(design, fix); `design-engine.js` one('dir') reports it |  |
| audit-2-design-engine-S3 | server runs E.page() on raw unrepaired design | DONE | `mcp/tools/plan_layout.mjs:250` pageOf(r.design.layout), the repaired design |  |
| audit-2-design-engine-S4 | theme-generator thumbnails fixed rx="18", not the radius | DONE | `assets/js/theme-generator.js:331` rx from c.radius |  |

### audit-3-picker-writer

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| audit-3-picker-writer-S1 | connection() workspace name not URL-encoded (safe) | OBSOLETE | informational: `pbip-bind.js:886` doubles quotes; Microsoft's form takes the raw name |  |
| audit-3-picker-writer-S2 | T[c] keys ambiguous for names containing ] | OPEN | picker fixed (`pbip-bind.js:897` fieldKey doubles ]); `mcp/lib/report-run.mjs:201` keyOf unescaped | use Bind.fieldKey in report-run keyOf · S · low · writer → **SQ10** |
| audit-3-picker-writer-S3 | named mutates shared field objects | DONE | `mcp/lib/report-run.mjs:202-206` copies via Bind.mapFields, Object.assign({}, f) |  |
| audit-3-picker-writer-S4 | pointer list: B-03..B-23, A1-11, A2-3 known elsewhere | DUPLICATE | pointer only; B-14/T1 invertAxis gone (`report-mirror.js:11`) | B-03, B-04, B-05, B-06, B-14, B-20, B-22, B-23, A1-11, A2-3 |

### audit-4-checks

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| audit-4-checks-S1 | textSize 12 unmeasured; pageNames uncapped; schema walk 2000; version at import | OWNER | `assets/js/layout-check.js:260` textSize 12; `check-report.mjs:73,487,34` unchanged | laptop: measure the text box default size in Desktop; rest informational (answers capped at 40,000 by capAnswer) |

### audit-5-reading

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| audit-5-reading-S1 | test.mjs has a fourth report reader of its own | DUPLICATE | `mcp/test.mjs:412` own readReport, used at :454-1097 | of 0.2.9-reader-S21 |
| audit-5-reading-S2 | check_report lint section does not catch errors | DONE | `mcp/lib/check-report.mjs:478-480` try around lint (A4-2) |  |
| audit-5-reading-S3 | base theme never read; no custom theme gives no colours | DONE 08493ad (SQ6) | `mcp/lib/read-report.mjs:336-340` custom only; base read only in reportIdentity :477 | read BaseThemes json in inventory as reportIdentity does · S · low · reader → **SQ6** |

### audit-6-mcp-tools

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| audit-6-mcp-tools-S1 | report plan lets generate_theme write any folder | DONE | `mcp/lib/plans.mjs:21-22` report allows create_report only; theme has its own plan (Z-01) |  |
| audit-6-mcp-tools-S2 | CARD_RULE used before defined | DONE | `mcp/lib/report-said.mjs:19` exported const, imported `report-run.mjs:26` (S9 split) |  |
| audit-6-mcp-tools-S3 | add_gulf_calendar plan path passes a fake writeScript | OPEN | `mcp/tools/add_gulf_calendar.mjs:24,66` scriptNameNow as writeScript; `gulf-calendar.mjs:57` undocumented | name the env key nameOnly or document it in gulf-calendar.mjs:57 · S · none · calendar → **SQ7** |

### audit-7-instructions

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| audit-7-instructions-S1 | idempotentHint false though repeat names same file | OBSOLETE | each write once per plan, new free name (AF2); `tool-inputs.mjs:15` ADDS false is right |  |
| audit-7-instructions-S2 | Desktop extension has no skill; screenshot/DAX consent missing | DUPLICATE | `mcp/lib/agent-text.mjs:38-53` no consent line; SKILL.md:66-74 only | of 0.2.9-design-S9 (the consent rule waits on the instructions cap) |
| audit-7-instructions-S3 | SKILL says gulfCalendar only "with a country" | DONE | `mcp/skills/report-design/SKILL.md:155` "or on a model that already has Hijri" |  |

### audit-8-packaging

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| audit-8-packaging-S1 | build.mjs header and test plan say 8 tools | OWNER | private repo (packaging/build.mjs, PACKAGING.md) not in this checkout | laptop: check build.mjs:13-14 and PACKAGING.md:232 say 11 tools |
| audit-8-packaging-S2 | build tests rewrite committed files, restore in finally | OWNER | private build.test.mjs:347-366, not in this checkout | laptop or owner: keep the pattern or move the build tests to a temp copy |
| audit-8-packaging-S3 | no privacy-policy field in the manifest | OWNER | private packaging/manifest.json, not in this checkout | decide: add privacy_policies (dataarcus.com/privacy.html) to the .mcpb manifest |
| audit-8-packaging-S4 | approvals in memory; a restart forgets them | OBSOLETE | by design, said: `mcp/lib/plans.mjs:4,61,127` |  |

### WORK-2026-10-01-04

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| WORK-2026-10-01-04-S1 | Round 1 items: header band, Executive button, centring, padding, tooltip | DONE | round 1 merged 80d3a00 (archive note :7; items 1.3-1.7 at :1961-1982) |  |
| WORK-2026-10-01-04-S2 | Round 2: English names in Arabic, sorting, refresh banner | DONE | round 2 ada2942 (note :10); "click Refresh once" `translations/theme-generator.js:36` |  |
| WORK-2026-10-01-04-S3 | after the beta: the 640 x 360 items | DONE | rounds 19/22 small-page focus layout, `mcp/lib/design.mjs:256-263`; no logo placeholder `pbip-page.js:700` |  |
| WORK-2026-10-01-04-S4 | fix/card-theme-radius: validator theme error on MCP exports | DONE | merged 99d1cee (archive note :1572) |  |

### WORK-2026-10-05-09

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| WORK-2026-10-05-09-S1 | hand-placed Arabic page right to left only with rtl true | DONE | round 23: `mcp/lib/report-run.mjs:93-94` rtl defaults to lang ar |  |
| WORK-2026-10-05-09-S2 | English RTL report writes "Total"; note still says «الإجمالي» | OPEN | `report-run.mjs:510` always says «الإجمالي»; `pbip-page.js:953` writes Total in English | say the word by lang (and "table", not "Arabic table") at report-run.mjs:510 · S · low · writer → **SQ10** |
| WORK-2026-10-05-09-S3 | model name "Row label: <Column>" collides with report measure | DONE | `assets/js/pbip-page.js:954` freeExt checks model names (`pbip-notes.js:34`) |  |
| WORK-2026-10-05-09-S4 | matrices unchanged; row header not reversed in Arabic | OWNER | `assets/js/report-mirror.js:309-320` values only; lab candidates await laptop | laptop: run the M1 matrix lab in Desktop, pick a MATRIX_RTL mode |
| WORK-2026-10-05-09-S5 | All in slicers, English names, task 10 totals, Your logo | DONE | "All" said `report-run.mjs:209`; table reach PASS (note :403); `pbip-page.js:700` |  |
| WORK-2026-10-05-09-S6 | mcp/quick.tmp.mjs committed on main | DONE | file absent; `git log -- mcp/quick.tmp.mjs` empty (removed before fab795c) |  |
| WORK-2026-10-05-09-S7 | ring note wording for a table without value column | DONE | "fixed tonight" in the note's table (:1132) |  |
| WORK-2026-10-05-09-S8 | health check cannot tell a measure's DAX does not parse | OPEN | `mcp/tools/check_model_health.mjs:44` description names no limit | add "DAX is not parsed: a broken measure is not found" to description and TOOLS.md · S · none · tools-docs → **SQ7** |
| WORK-2026-10-05-09-S9 | Arabic table has no "Total" word | DONE | round 23 row label «الإجمالي», `assets/js/pbip-query.js:243-251` |  |
| WORK-2026-10-05-09-S10 | Arabic Reset arrow touches last letter | DONE | round 22 gap on the arrow side, `assets/js/pbip-page.js:189-192` |  |
| WORK-2026-10-05-09-S11 | 18pt table title above 9pt rows in small slot | OWNER | open, taste (note :1136); no rule in pbip-page.js | decide: scale the title with the table text in small hand-placed slots, or keep |
| WORK-2026-10-05-09-S12 | generate_theme theme keeps 1080 sizes on smaller hand page | DONE | round 23 themeScaleOf rescale, `mcp/lib/report-run.mjs:306-318` |  |
| WORK-2026-10-05-09-S13 | English day/month/KPI names on the sample (no Arabic columns) | OBSOLETE | informational: the sample's own columns, told in notes |  |
| WORK-2026-10-05-09-S14 | task 8 "Total by Note" one bar; table scrolls | OBSOLETE | informational: the test model's own columns |  |
| WORK-2026-10-05-09-S15 | Gulf model bar chart has number-like names | OBSOLETE | informational: the test model's data |  |
| WORK-2026-10-05-09-S16 | No data message cards were tab stops | DONE | fixed that night; `pbip-page.js:353` nodata gets no tabOrder |  |
| WORK-2026-10-05-09-S17 | full npm test 13-30 min; no way to run one block | DONE | G1 (df778b6): `mcp/run-tests.mjs:8,17` areas and DA_SHARD k/N |  |
| WORK-2026-10-05-09-S18 | rounds 18 and 19's own lists | DONE | every row marked done or no change in the note (:1143) |  |

### WORK-2026-10-11-14

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| WORK-2026-10-11-14-S1 | own isCustom in report-mirror; two Arabic month lists | OPEN | isCustom now VT's (`report-mirror.js:51`); months `calendar-generator.js:18`, `theme-generator.js:51` | load arabic-calendar.js months on both pages · S · low · website → **SQ14** |
| WORK-2026-10-11-14-S2 | G1 third KPI computed Predicted Cost by name tiebreak | OBSOLETE | informational: shape cannot tell two computed measures; no fix defined |  |
| WORK-2026-10-11-14-S3 | O-2, R1-R9, T2-T8 are their blocks' | OBSOLETE | pointer only; O-2 done in 0.2.9 (note :540, :563) |  |
| WORK-2026-10-11-14-S4 | T1 invertAxis is the laptop's tonight | DONE | `assets/js/report-mirror.js:11` categoryAxis.invertAxis never written (T1, M1) |  |
| WORK-2026-10-11-14-S5 | parseTmdl appends formatStringDefinition lines to DAX | DONE | tree parser `tmdl-model.js:135`; run here: expression and format kept apart |  |
| WORK-2026-10-11-14-S6 | counted binding's funnel/tooltip now second KPI count | OBSOLETE | informational: behaviour change recorded, no action |  |
| WORK-2026-10-11-14-S7 | display names now shown on category-pool charts | OBSOLETE | informational: behaviour change recorded, no action |  |
| WORK-2026-10-11-14-S8 | packaging must carry field-meaning.js | DONE | 0.2.9 and 0.3.0 shipped; pbip-bind.js needs FM, the packed smoke test loads it |  |
| WORK-2026-10-11-14-S9 | "is not blank" filter shape only validator-proven | OWNER | `assets/js/pbip-query.js:426` notBlank; no proof in DESKTOP-TESTS.md | laptop: open one report with the not-blank filter in Desktop; record the result |
| WORK-2026-10-11-14-S10 | no date hierarchy; plain Date axis one point per day | OWNER | `assets/js/pbip-query.js:275` date type gives order own | decide: plain Date axis by month start; prove in Desktop |
| WORK-2026-10-11-14-S11 | month order measure in a hidden calendar table | OBSOLETE | informational: works as designed, no open risk named |  |
| WORK-2026-10-11-14-S12 | table widths from average letters, no data lengths | OBSOLETE | data values never read (owner, 25 Oct; CLAUDE.md "never") |  |
| WORK-2026-10-11-14-S13 | template keeps "Your logo"; sample's revenue card whole | OBSOLETE | informational: a template by design |  |
| WORK-2026-10-11-14-S14 | brand harmony's other 7 colours loud | DONE | 0.2.9 O-11 calm set by default, `mcp/lib/design.mjs:163` (CHANGELOG 0.2.9 Theme) |  |
| WORK-2026-10-11-14-S15 | approved plan does not pin create_report's fields | DONE | `mcp/lib/report-inputs.mjs:123` REPORT_PINNED includes fields (A6-1, AF1) |  |
| WORK-2026-10-11-14-S16 | see how Claude Desktop shows approve_plan on beta laptop | DONE | owner's rc.21-rc.24 Desktop tests, `mcp/CHANGELOG.md:401` F7b app prompt |  |
| WORK-2026-10-11-14-S17 | open from before: O-2..O-16 | DONE | 0.2.9 layers (archive note :563); CHANGELOG 0.2.9 :371-455 |  |
| WORK-2026-10-11-14-S18 | website pbip suite race: picker read before filled | DONE | `scripts/tests/pbip.mjs:383-384` waits for selects and no "Reading the model" |  |
| WORK-2026-10-11-14-S19 | text cardinality, Power Query WeekType unknown (no values) | OBSOLETE | metadata only by the product promise; D11 reads DAX only |  |
| WORK-2026-10-11-14-S20 | one category: column chart repeats bar chart's field | OBSOLETE | informational: the chosen behaviour, recorded |  |
| WORK-2026-10-11-14-S21 | S1-S3, S6, S7, D1... are writer's or design's | OBSOLETE | pointer to other blocks' items |  |
| WORK-2026-10-11-14-S22 | decision: category pool with fields or page filters | OWNER | `mcp/lib/report-run.mjs:151` and `plan-lint.mjs:44` still delete catPool | decide: keep no pool with fields/page filters, or give each chart an unused category |
| WORK-2026-10-11-14-S23 | laptop items P1-P6 and blocks' laptop lists | OWNER | archive note :495-503, Desktop checks only | laptop: confirm P1-P5 were seen in the rc.24 proof; P6 is the writer's |
| WORK-2026-10-11-14-S24 | report validator in dependencies, not devDependencies | OBSOLETE | check_report runs it at run time (`check-report.mjs:34`); `mcp/package.json` by design |  |

### A1-agent-memory

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| A1-agent-memory-S1 | code comments cite mcp/CLAUDE.md for rounds now in RULES-POWERBI | OPEN | `assets/js/pbip-page.js:513`, `mcp/lib/twin-pages.mjs:190`, `twin-visuals.mjs:29`, `design-engine.js:390` | point the four comments at mcp/docs/RULES-POWERBI.md (and .min.js rebuild if needed) · S · none · docs-memory → **SQ12** |
| A1-agent-memory-S2 | plans, PRODUCT_SPEC, GOLDEN-TASKS, SEE-THE-RESULT cite mcp/CLAUDE.md | OPEN | `mcp/PRODUCT_SPEC.md:105`, `mcp/GOLDEN-TASKS.md:23`, `mcp/plans/CHECK-REPORT.md:168` | repoint each cite to its mcp/docs/ file · S · none · docs-memory → **SQ12** |
| A1-agent-memory-S3 | ROADMAP private-repo list omits mcp/docs/ | OPEN | `mcp/ROADMAP.md:216` lists WORK, ROADMAP, CLAUDE, no mcp/docs/ | add `mcp/docs/` (and `mcp/work/`) to the moves list · S · none · docs-memory → **SQ12** |
| A1-agent-memory-S4 | ARCHITECTURE.md near its 5,200 cap | OPEN | 5,196 of 5,200 chars; cap `scripts/check-agent-memory.mjs:24` | move one section to MODULES.md before the next addition · S · none · docs-memory → **SQ12** |
| A1-agent-memory-S5 | TOOLS.md rows are 400-2,900 char single lines | OWNER | longest line 3,186 chars `mcp/TOOLS.md`; suites parse rows | decide: keep table rows, or paragraphs plus updating the four parsing suites |

### A1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| A1-S1 | pills fall back to dropdown on large model | OBSOLETE | by design, said in plan `mcp/lib/approval-window.mjs:400` | informational, no action |
| A1-S2 | Arabic twin without labels keeps English page names | OWNER | by design (D3, notTranslated) | laptop: twin without labels, check notTranslated lists every English page name |
| A1-S3 | build made from 1e07ad5, rebuild after merge | OWNER | builds are not in the repo; release now 0.3.1 (`e165bdb`) | laptop: confirm the .mcpb in use is built from the current integration head |
| A1-S4 | native copy and redesign keep a missing .platform missing | DONE ed7d53e | `mcp/lib/native-copy.mjs:86`, `mcp/lib/redesign.mjs:297` only if present | write newPlatform (twin-copy.mjs:26) when absent, as twin-copy.mjs:243 · M · low · writer → **SQ2** |

### A2

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| A2-S1 | website run-all/ci-sum does not fail "PASS 0 checks" | OPEN | `scripts/ci-sum.mjs:70-75` website path has no zero-checks | add zero-checks problem when count(r.rest)===0 in website branch · S · low · tests-ci → **SQ11** |
| A2-S2 | test.mjs alone prints every problem, capped via npm test | OBSOLETE | informational, works as designed | informational, no action |
| A2-S3 | fuzz check count differs Windows vs Linux | OBSOLETE | ci-sum checks identities not counts (`mcp/docs/TESTS.md:26`) | informational, no action |
| A2-S4 | TESTS.md says website has 13 suites | DONE | `mcp/docs/TESTS.md:35` "20 suites: ALL there" | - |
| A2-S5 | CHANGELOG R3 "twin mirrors a waterfall" reads current | OPEN | `mcp/CHANGELOG.md:131` unmarked; D7 made native default | add "(superseded by D7: native is the default)" · S · none · docs-memory → **SQ12** |
| A2-S6 | README "19 website test suites" vs 20 | DONE | `README.md:24` now names `ALL` in run-all.mjs, no count | - |
| A2-S7 | mcp/package.json description lists 4 tools | OPEN | `mcp/package.json:4` four tools only | describe all tools generically (no list) · S · none · packaging → **SQ9** |
| A2-S8 | beta page "A real run" is 0.2.8 | DUPLICATE | `power-bi-mcp/index.html:188` "DataArcus 0.2.8" | of 0.2.9-design-S11 |
| A2-S9 | app prompt (elicitation) lacks "Not checked before writing" | DONE (SQ3 a6130f7) | `mcp/lib/approval-window.mjs:101` promptSummary ignores exact.notChecked | add a notChecked line in promptSummary within the cap · S · low · approval → **SQ3** |
| A2-S10 | page's "never returns data values" pinned only as text | OPEN | `mcp/test-0.3.0-approval-disclosure.mjs:175` text; T1 pin covers reads only | verify first: assert a fixture data value never appears on the page · S · low · approval → **SQ11** |
| A2-S11 | SKILL.md omits metric switcher, terms, gulfDates | OPEN | no match in `mcp/skills/report-design/SKILL.md` | add one line each to SKILL.md (both copies) · S · none · tools-docs → **SQ9** |
| A2-S12 | SKILL.md gallery limits vaguer than code | OPEN | `mcp/skills/report-design/SKILL.md:164-168` "few members" | state waterfall <=12, small multiples <=9, combo time or ordered · S · none · tools-docs → **SQ9** |

### A3

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| A3-S1 | create_report refuses repeated displayNames when plan pinned fixed-list name | OBSOLETE (SQ3: fixed before; create_report merges the pinned names under the given ones; sq3 A3-S1a-b) | `mcp/lib/plans.mjs:150-154` full differences(want, pin); no later fix found | verify first; compare only given displayNames keys to pinned map · M · low · approval → **SQ3** |
| A3-S2 | kept English names raw inside Arabic titles | OWNER | J18 left isolation to the owner | decide whether to isolate kept Latin names in Arabic titles; laptop check reading order |
| A3-S3 | twin/EN-AR keep English flip-card faces and switcher choices | OWNER | listed under cannot (by design) | decide whether a second Arabic script per report is worth building |
| A3-S4 | twin plan answer near 40,000 cap; textsFrom proposed | DONE | Q1: `mcp/lib/twin-plan.mjs:44-58`, `create_arabic_twin.mjs:46` textsFrom | - |
| A3-S5 | switcher chart projections carry no displayName | OWNER | `mcp/lib/metric-switcher.mjs:121` proj(first), no name | laptop: check the switcher's charts show the field parameter's labels |
| A3-S6 | health-project's own report not twinned in sweep | OPEN | `mcp/test-0.3.0-arabic-sweep.mjs:51` F3 has no `own` | add own: health pbip to F3 · S · low · tests-ci → **SQ11** |

### AF1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| AF1-S1 | twin write nextSteps names pbip unscreened | DONE (SQ4 082860a) | `mcp/lib/twin-write.mjs:115` raw path.basename(twinPbip) | use the screened name (pathOut) in nextSteps · S · low · twin → **SQ4** |
| AF1-S2 | L6 plan returns typed KPI/chart static titles; PRIVACY silent | OWNER | `mcp/PRIVACY.md:242` names twin only; `dax-functions.mjs:265` | decide: keep and say it in PRIVACY section 3, or drop typed titles from daxSaid |
| AF1-S3 | lens calendar names now cut with ellipsis past 40 | OBSOLETE | informational change note | informational, no action |

### AF2

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| AF2-S1 | TOOLS.md says create_report "picks a free name" | OPEN | `mcp/TOOLS.md:62`; write refuses taken names `report-run.mjs:381` | say it refuses a taken report name · S · none · tools-docs → **SQ9** |
| AF2-S2 | F06: folder-path race remains | OBSOLETE | documented race, no cheap narrowing (AF1) | informational, no action |
| AF2-S3 | "(the same file check_model_health writes)" not always true | OPEN | `mcp/tools/plan_layout.mjs:183`, `:195` | drop or qualify the parenthesis ("the same script") · S · low · tools-docs → **SQ10** |
| AF2-S4 | identical existing script still listed as written in plan outputs | OPEN | `mcp/lib/report-run.mjs:389` named again, not written | verify first; list it as "already there" in the plan outputs · S · low · writer → **SQ10** |

### C

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| C-S1 | approve_plan says "create_report (from redesign)" | OPEN | `mcp/lib/agent-text.mjs:33` SOURCE_OF has no redesign | add redesign: 'plan_layout with redesignFrom' · S · low · tools-docs → **SQ9** |
| C-S2 | tour asks Gulf date and shared-axes questions on sample | OBSOLETE | informational, works as designed | informational, no action |
| C-S3 | read_model lists no relationships on the sample | OBSOLETE | by design (health counts them) | informational, no action |

### C1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| C1-S1 | Arabic Calendar Generator keeps Q1, FY, FQ, true/false | OPEN | `assets/js/calendar-generator.js:73` arabicOn needs lang!=ar; `:107`, `:128` | write Arabic labels when lang ar (same builder), EN/AR tests · M · low · calendar → **SQ7** |
| C1-S2 | calc columns on a DAX date table via TMDL unproven | OWNER | no row in `scripts/tests/DESKTOP-TESTS.md` | laptop: apply the twin's month script on a calculated date table, Problems 0? |
| C1-S3 | Day Name (Arabic) sorted by Weekday Number | OWNER | DESKTOP-TESTS:2137 proves gulf calendar only | laptop: apply the twin's calendar script, confirm Problems 0 and day order |
| C1-S4 | headers show display names; field list shows "(Arabic)" | OBSOLETE | informational, works as designed | informational, no action |

### D1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| D1-S1 | plan_layout cannot reach the waterfall yet (D2) | DONE | D2 landed (fab795c): `mcp/tools/plan_layout.mjs:432` plan.waterfallRtl; `approval-window.mjs:374`; `test-0.3.0-gallery-reachable.mjs:128` | - |
| D1-S2 | waterfall series names are fixed Arabic words | OBSOLETE | informational, by design: `assets/js/visual-gallery.js:227` WF_WORDS, said in mirrors | - |
| D1-S3 | English quarter-text waterfall unsorted; Arabic sorted A to Z | OWNER | `assets/js/pbip-query.js:130` time text, no sortBy: no sort written | laptop: English waterfall by a quarter text; does Desktop's default order match A to Z? |

### D2

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| D2-S1 | hand-placed pages: preview draws default design, not slots | DONE | 0.3.0 D5 (in fab795c): `mcp/tools/plan_layout.mjs:401` previewOf(exact.files) | - |
| D2-S2 | second page planned only via exact build; slots = page 1 | OBSOLETE | informational, by design: second page in gallery.slots and approval page | - |
| D2-S3 | waterfall's own writer not touched | OBSOLETE | informational, no action | - |

### D3

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| D3-S1 | phone header keeps 14pt; long Arabic title not shrunk | DONE (SQ4 082860a) | `assets/js/report-mirror.js:513` mirrorMobile moves boxes only, no size rule | apply pbip-page.js title size rule to phone texts in labelMobile · M · low · twin → **SQ4** |
| D3-S2 | original "Title:" measures stay unused in reportExtensions.json | OBSOLETE | informational, as the brief said; no risk recorded | - |
| D3-S3 | tab font: button's or theme's; writer measures report font | OBSOLETE | informational, same font in practice | - |
| D3-S4 | 3 PBIR_FORMATTING_OBJECT_UNKNOWN notes, 8 "labelled by title" | DONE | U1 catalog 0.1.3: `mcp/test-0.2.9-checks.mjs:110-121` no finding, no known note | - |

### D4

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| D4-S1 | redesign never moves grouped, custom, tooltip-page visuals | OBSOLETE | informational, as designed | - |
| D4-S2 | overlay's tabOrder and z copied as they are | OBSOLETE | informational, original order kept | - |
| D4-S3 | text-box-led unit: text box named changed, chart in overlays | OBSOLETE | informational, describes the approval wording | - |

### D5

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| D5-S1 | packaging README Privacy: "short titles, screened" stale since S1 | OPEN | `mcp/skills-packaging/README.md:61` still says short titles | say text boxes as typed, no static titles, as PRIVACY.md · S · low · packaging → **SQ9** |
| D5-S2 | plugin.json description names Microsoft's Power BI Report skill | OWNER | `mcp/skills-packaging/plugins/dataarcus/.claude-plugin/plugin.json:5` | owner: keep Microsoft's skill name in public plugin text, or reword |
| D5-S3 | beta page Requirements: Windows only, Claude Desktop; no other clients | DONE | DS1 17f78ff: `power-bi-mcp/index.html:212,215` one-click wording, clients linked | - |
| D5-S4 | home stat "11 tools" and FAQ silent on 0.3.1 | OBSOLETE | informational, true as they are: `index.html:515` | - |
| D5-S5 | V1 tab cut and C tour date questions still open | DUPLICATE | restates two other notes' items | V1-S1 and C-S2 |
| D5-S6 | lens fix texts name unread Desktop labels | DUPLICATE | `mcp/lib/arabic-lens.mjs:143,170` still say them | W-S2 (L1 laptop 3) |
| D5-S7 | PRODUCT_SPEC Positioning and Tiers unchanged | OWNER | `mcp/PRODUCT_SPEC.md:132,149` | owner: decide positioning by audience and tiers text |
| D5-S8 | table projects Plan Group twice, one at width 0 | OBSOLETE | by design: `assets/js/pbip-query.js:245` RTL total row label, name column at width 0 | - |
| D5-S9 | English measure titles in Arabic reports (R2 rule) | OBSOLETE | informational: R2's rule, listed in the plan as kept in English | - |
| D5-S10 | ops line chart labels may slant in Desktop | OWNER | `assets/js/page-preview.js:144` slant note | laptop: does T1b's month axis slant? decides whether the note stays |

### D6

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| D6-S1 | theme page shows raw Inputs table above Colours | DONE | 0.3.0 T1 (fab795c): `mcp/lib/approval-window.mjs:503,516-517` Colours first, raw folded | - |
| D6-S2 | taken theme name: freeFile picks "x 2", page silent | DONE | AF2 20c888a: `mcp/tools/generate_theme.mjs:65,74` name fixed at plan, else nothing | - |
| D6-S3 | StaticResources/SharedResources themes grouped as Report settings | DONE (SQ3 a6130f7) | `mcp/lib/approval-window.mjs:85` Theme regex RegisteredResources only | widen Theme group regex to StaticResources/SharedResources · S · low · approval → **SQ3** |

### D7

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| D7-S1 | report-design SKILL.md silent on waterfallRtl choice | DONE | fab795c: `mcp/skills/report-design/SKILL.md:115-117` names waterfallRtl native/mirror | - |
| D7-S2 | mirror waterfall gaps and "-" format display units unmeasured | OWNER | `assets/js/visual-gallery.js:230` mirror path unchanged | laptop: compare column gaps with Power BI's waterfall; labels with "-" format |

### DS1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| DS1-S1 | MCP page hero, meta, facts say only "Claude Desktop" | OWNER | `power-bi-mcp/index.html:17,116,121`; AR `ar/power-bi-mcp/index.html:16` | owner: name other MCP clients in hero/meta, or keep one-click wording |
| DS1-S2 | homepage FAQ 7 says "in Claude Desktop" | DUPLICATE | `index.html:679` kept: the one-click path | DS1-S1 |
| DS1-S3 | licensing guide: rest not re-checked against Learn | DONE 0c69f686 (SQ8) | `articles/article-power-bi-licensing-guide.html:196` only Pro limits checked | verify first: re-check every figure against Learn, EN and AR · M · low · website → **SQ8** |
| DS1-S4 | GitHub main links need public repo; anchor checked by eye | OPEN | repo public today; anchors match `mcp/README.md:102`, `mcp/PRIVACY.md:62` | site test: each blob link's anchor matches a local heading · S · low · tests-ci → **SQ11** |

### E

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| E-S1 | sitemap-lastmod --write moved stale earlier dates | OBSOLETE | informational, no action | - |
| E-S2 | Health Check size line: one Arabic plural for every count | OPEN | `assets/js/model-health.js:712-713` many() one Arabic form | count-aware Arabic (1, 2, 3-10, 11+) for tables, measures, visuals · S · low · health → **SQ7** |
| E-S3 | Calendar Generator EN "Calendar Table" vs AR «جدول التاريخ» | OWNER | `tools/dax-calendar-table-generator.html:14` vs `ar/...:13` | owner: one name for the tool in both languages (SEO vs Microsoft's "date table") |
| E-S4 | Desktop Arabic menus to confirm three "to choose" terms | DONE | E2 9861e51: owner chose the terms, `mcp/work/E2.md:21-29` | - |

### E2

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| E2-S1 | Shopify AR title «لوحة تحكم» differs from listing card | OBSOLETE | no card quotes the title today: grep finds it only in article-shopify | - |
| E2-S2 | Arabic count agreement «1 مرئيات», «و45 مرئيًا» | DUPLICATE | same plural rule as the Health Check size line | E-S2 |
| E2-S3 | Desktop's Arabic UI says «مقسم طريقة العرض», «تلميح الأدوات» | OWNER | site uses «مقسم» / «تلميح» (E2 terms); MCP adds "(Slicers)" `approval-window.mjs:184` | owner: gloss Desktop's longer names once on the site pages, or not |

### F1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| F1-S1 | proof's own list of unproven items (tooltip scroll, header cut, ...) | OWNER | laptop proof list, `mcp/work/F1.md:143`; only Desktop can show them | laptop: run each listed proof item in Desktop, record pass/fail per item |
| F1-S2 | smallest pages: pill slot slicerH is 1 short of pillH | DONE | F2 (in fab795c): `assets/js/pbip-page.js:544` max(sh, pillH) for stacked pills | F2 gave stacked pill slots their measured pillH |
| F1-S3 | phone pills keep phone text 10, no header size | OBSOLETE | informational, no action: `assets/js/pbip-page.js:1328` by design | phone layout kept as the brief said |
| F1-S4 | variants script needs data in Shop model slicer columns | DONE | F2 (in fab795c): `mcp/lab/pills-variants.mjs:11,32` typed rows table | rows added so tiles have values |
| F1-S5 | twin's mixed texts already isolated; isolateLatin on labels only | OBSOLETE | informational, no action: `mcp/lib/twin-texts.mjs:195` |  |

### F2

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| F2-S1 | L5 Arabic icon at far left of wide right-aligned cell | OWNER | `mcp/lib/status-icons.mjs:93` rtl still 'Before' | laptop: Arabic table with statusIcons; is the icon beside its value or at the cell's far left? |
| F2-S2 | pills in top strip draw at 9pt, smaller than dropdowns' 15pt | OWNER | `assets/js/pbip-page.js:497` pt shrinks to strip height | decide: taller top strip for pills (layout change) or keep 9pt pills |
| F2-S3 | phone pills keep phone text 10 and heights | DUPLICATE | same as F1-S3, `assets/js/pbip-page.js:1328` | F1-S3 |

### F4

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| F4-S1 | columnPadding 0 may make pills touch | DONE | F5 (in fab795c): `assets/js/pbip-page.js:526` columnPadding int(6) | gap of 6 between pills |
| F4-S2 | variants page V0-V3 kept, second in order | OBSOLETE | informational, no action: `mcp/lab/pills-variants.mjs:12` lab script only |  |

### F6

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| F6-S1 | pillH at 9pt (65) lower than at 8pt (66) | OBSOLETE | informational, no action: `assets/js/pbip-sizing.js:116-118` measured values |  |
| F6-S2 | nothing measured below 56 / 72 | OBSOLETE | informational, no action: pillH floor `assets/js/pbip-sizing.js:118` |  |

### F7

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| F7-S1 | over 50 report fields: plan lists 50 and says "more" | OBSOLETE | informational, no action: cap by design, rest via check_model_health script |  |
| F7-S2 | health plan lists maxItems while script covers whole model | OBSOLETE | informational: reviewer "stays as it is" (`mcp/work/F7.md:57`) |  |

### G1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| G1-S1 | sweep-s1 H1 message says "every script of package.json's test" | OPEN | `mcp/test-0.3.0-sweep-s1.mjs:173` old wording | reword H1 to "every script in mcp/tests.json" · S · none · tests-ci → **SQ11** |
| G1-S2 | 1-3 Oct archive open items never closed one by one | OWNER | `mcp/work/archive/WORK-2026-10-01-04.md:2091` Open items list | owner: one pass, close or carry each item |
| G1-S3 | archive README index long (154 lines) | OBSOLETE | informational: `mcp/work/archive/README.md` 155 lines, fine with search |  |
| G1-S4 | SOURCE.md bundle af7b264 vs json-schemas head be65eaa | OBSOLETE | informational, no update needed (`mcp/schemas/SOURCE.md:4`) |  |
| G1-S5 | localSettings/1.0.0 neither bundled nor named in SOURCE.md | OPEN | `mcp/schemas/SOURCE.md:14-17` no localSettings | add localSettings to SOURCE.md's "Not bundled" list · S · none · docs-memory → **SQ12** |

### GC

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| GC-S1 | share image says "the right weekend for each country and year" | DONE 0c69f686 (SQ8) | `scripts/make-share-images.mjs:207` old line (+ "Free tool") | new sub line, regenerate `assets/img/og/gulf-calendar.jpg` · S · low · website → **SQ8** |
| GC-S2 | "Free" and "Copy, paste, done" on generator page, site-wide | OWNER | `tools/dax-calendar-table-generator.html:15,185` | owner: keep or drop "free" site-wide; drop "Copy, paste, done"? |
| GC-S3 | Egypt quick setup keeps fixed Fri + Sat weekend | OBSOLETE | informational: no sourced Egypt history, by design |  |
| GC-S4 | Sharjah calendar self-check flags every Sunday as GC_WEEKEND | OPEN | `mcp/lib/gulf-calendar.mjs:119` analyze by country only; `mcp/tools/check_model_health.mjs:48` | weekend option (shj) on Gulf.analyze and check_model_health · M · low · calendar → **SQ7** |
| GC-S5 | "Is After UAE Weekend Change" only for UAE, not Sharjah | OPEN | `assets/js/calendar-generator.js:126` weekend === 'uae' only | also write it (or a Sharjah column) for 'shj' · S · low · calendar → **SQ7** |
| GC-S6 | Arabic notes: «و» sits next to inline English names | OWNER | generator AR notes, visual reading only | owner reads AR page at 390/1280 px: isolate English names or accept |

### GC2

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| GC2-S1 | article dateModified still 2026-10-03; published_time 09:00Z | DONE | 63cd0b2: `articles/article-gulf-calendar-power-bi.html:98` 2026-10-25 (AR :97) | published_time 09:00Z left as is: owner's call |
| GC2-S2 | article GitHub links work only while repo is public | OBSOLETE | `gh api repos/Antnioo/DataArcus` public; sources link HTTP 200 today |  |
| GC2-S3 | "Book a Free Call" and "the free ... Generator" | DUPLICATE | `articles/article-gulf-calendar-power-bi.html:124,155` | GC-S2 |
| GC2-S4 | AR p3 calls Umm al-Qura official, no source linked | DONE 0c69f686 (SQ8) | `ar/articles/article-gulf-calendar-power-bi.html:151` p3 no href | link a source for Umm al-Qura's status in p3 (EN and AR) · S · low · website → **SQ8** |
| GC2-S5 | Eid columns 1-3 Shawwal / 10-13 Dhu al-Hijjah vs u.ae | OWNER | column definitions unchanged; u.ae differs | owner: align Is Eid columns with u.ae's holiday spans or keep |

### I

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| I-S1 | sitemap-lastmod --write in shallow clone gives wrong dates silently | DONE 0c69f686 (SQ8) | `scripts/sitemap-lastmod.mjs` no "shallow" check | refuse/warn when git rev-parse --is-shallow-repository is true · S · low · website → **SQ8** |
| I-S2 | Arabic results: "25–30%" percent placed by bidi rules | OWNER | `assets/js/dp600-sim.js:103,327` `<small>` weight, no dir | owner looks at AR results: want ltr-isolated weight or as is? |
| I-S3 | practice summary skill table bars blue, area rows green/amber | DONE 0c69f686 (SQ8) | `assets/js/dp600-sim.js:454` bar() without class | pass good/warn class as at line 688, rebuild .min.js · S · none · website → **SQ8** |
| I-S4 | deny-scan.mjs needs DENY_TERMS secret | OBSOLETE | informational: runs in CI, `.github/workflows/privacy.yml:37` |  |

### J17

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| J17-S1 | generator has no Sharjah weekend, no Friday half-day | DONE | bd59d9a: `tools/dax-calendar-table-generator.html:209` shj option | half day stays out, said at html:210 |
| J17-S2 | create_report Ramadan note finds Hijri-year column by name | OPEN | `mcp/lib/report-run.mjs:84-87` regex by name | use gulfDates.hijriYearColumn when the plan has it · S · low · writer → **SQ10** |
| J17-S3 | Hijri month visual needs model sort-by column | OBSOLETE | informational: said in gulfDates.grain.order |  |
| J17-S4 | Gulf date answers forgotten when session ends | DUPLICATE | `mcp/lib/gulf-date-questions.mjs:32` in-memory CONFIRMED | J18-S5 |
| J17-S5 | full npm test took over 30 minutes in one process | OBSOLETE | informational, no action (run-time note) |  |

### J18

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| J18-S1 | twin plan answer 37,018 chars near 40,000 cap | OBSOLETE | informational: cap works as designed |  |
| J18-S2 | website Arabic download does not isolate Latin runs | OPEN | `assets/js/pbip-export.js` no isolate; only `mcp/lib/twin-texts.mjs:195` | move isolateLatin to a shared engine, call in pbip-export · M · low · website → **SQ15** |
| J18-S3 | check_report/read_report show isolates as code points | OBSOLETE | informational: screening rule by design |  |
| J18-S4 | Arabic month column swap lists it, not English term's column | OBSOLETE (SQ4: the twin never swaps a column; its sheet names what its pages bind, sq4 J18-S4a; create_report's swap: SQ4.md Seen 1) | `mcp/lib/twin-plan.mjs:174` sheetOf by T.keys | verify first: which column the sheet should name · S · low · twin → **SQ4** |
| J18-S5 | terms forgotten when session ends | OWNER | `mcp/lib/terminology.mjs:159` in-memory CONFIRMED | decide: persist terms/date answers in the answers file via approved write |

### J19

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| J19-S1 | native copy panel axis unit English in Arabic report | DONE dc73503 | `mcp/lib/visual-meaning.mjs:559` always labels .en | use labels .ar when the report is Arabic (AR_DUR exists) · S · low · writer → **SQ2** |
| J19-S2 | sharedAxes answers not kept in answers file | OWNER | `mcp/lib/report-fields.mjs:185` per plan only | decide with J18-S5: record confirmed pairs via answers file's approved write |
| J19-S3 | packaging must carry axis-units, field-meaning, confirm-memory | OWNER | private packaging; literal requires checked `.github/workflows/tests.yml:48` | reviewer/owner: confirm the built .mcpb holds the three engines |
| J19-S4 | twin and redesign copy user's visuals, secondary axis included | OBSOLETE | informational, no action |  |
| J19-S5 | native copy panels each keep the visual's title | DONE dc73503 | `assets/js/visual-replace.js:137` title copied per panel | add the panel's unit to each panel title · S · low · writer → **SQ2** |
| J19-S6 | FSI/PDI around ISO code in axis title not seen in Desktop | OWNER | `assets/js/axis-units.js:108` isolate | laptop: Arabic report with AED axis title, check it reads right |

### K1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| K1-S1 | plugin details shows 0 servers; Configure only via /plugin: website line | OWNER | no site page names the plugin; `mcp/skills-packaging/README.md:23` says Configure | decide when the public marketplace repo goes live, then add the website line (EN and AR) |
| K1-S2 | local-folder marketplace writes untracked `.mcpb-cache/` | OBSOLETE | informational, no action: 8-file rule keeps no .gitignore in `mcp/skills-packaging/` |  |
| K1-S3 | bundle is win32; macOS untried | OWNER | `mcp/WORK.md:33` keeps win32 until one real Mac run | run the bundle once on a Mac, then decide the manifest's platforms |
| K1-S4 | Microsoft's plugin starts its MCP unpinned (@latest) | OWNER | `mcp/skills-packaging/.claude-plugin/marketplace.json` hard dependency powerbi-authoring | accept the unpinned dependency, or make it optional; Microsoft's plugin is not ours to pin |
| K1-S5 | mcp/package.json says 0.1.0 | DONE | e165bdb; `mcp/package.json:3` "0.3.1" |  |
| K1-S6 | Copilot "Agent Plugins 1.0" format not used | OWNER | `mcp/skills-packaging/plugins/dataarcus/.github/plugin/plugin.json` legacy only | decide whether to add root plugin.json/mcp.json now or wait (legacy loads) |
| K1-S7 | no APM manifest for Cursor, Windsurf, Codex, VS Code | OWNER | `mcp/skills-packaging/` holds Claude and Copilot manifests only | decide which other clients get a manifest, if any |
| K1-S8 | draft #85 to close once K1 merges | DONE | PR #85 state closed, not merged (gh api); K1 merged e8ccecc |  |
| K1-S9 | engine build may pack skills-packaging into the .mcpb | OWNER | engine repo not in this session | in dataarcus-engine, check the .mcpb file list excludes `mcp/skills-packaging/` |

### K2

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| K2-S1 | bilingual plan lacks "Not fully Arabic" line | OPEN | `mcp/tools/plan_layout.mjs:83` bilingualSaid has no notFullyArabic key | add notFullyArabic to bilingualSaid and the bilingual propose data; page section exists (`approval-window.mjs:495`) · S · low · approval → **SQ10** |
| K2-S2 | twin-write.mjs imports unused `out` | DONE | 75bfd6e (Q1); `mcp/lib/twin-write.mjs:3-11` no answer.mjs import |  |

### L1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| L1-S1 | lens's Desktop setting names not read off Format pane | DUPLICATE | `mcp/work/L1.md` "For the laptop" 3; `WORK.md:22` batched laptop run | of W-S2 |
| L1-S2 | twin of (a) shows Month in English; lens says so | OBSOLETE | informational, no action: lens CALENDAR_VALUES `mcp/lib/arabic-lens.mjs:156` |  |
| L1-S3 | RTL_MIRROR counts slicer headers as titles | OBSOLETE | informational, no action: a slicer header is its PBIR title |  |
| L1-S4 | matrix on twin is "no setting" until M1's variant | OBSOLETE | informational: lens imports MATRIX_SAID `mcp/lib/arabic-lens.mjs:21`; variant is M1's decision |  |
| L1-S5 | English pages listed "to be twinned" even if staying English | OBSOLETE | informational: summary says "No Arabic pages yet" first, `arabic-lens.mjs:196` |  |
| L1-S6 | instructions at 2,195 of 2,200 | DUPLICATE | measured today 2,195 (`agent-text.mjs` instructions); cap `agent-text.mjs:9` | of 0.2.9-reader-S5 |
| L1-S7 | check_report and lens repeat RTL_MIRROR titles | OBSOLETE | informational, no action: one source, two answers |  |

### L2

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| L2-S1 | `few` count over-counts SWITCH compared texts | OPEN | `assets/js/pbip-bind.js:472` counts every quoted text | count only SWITCH result arguments (and IF branches), rebuild .min · M · low · design → **SQ13** |
| L2-S2 | axis-label grey option not built | OWNER | no axis grey option in `assets/js/` or `mcp/lib/` | decide whether to add an axis-label grey option (lab 4.7-6.0:1) |
| L2-S3 | Desktop's button-slicer title size not measured | OWNER | pills title cut at slicer text size; no Desktop measure | on the laptop, measure Desktop's button-slicer title size |

### L3

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| L3-S1 | Metric bar chart may cut names; no Top N | OWNER | `mcp/lib/metric-switcher.mjs:121` bar has no TopN filter | decide on a Top N for a field-parameter chart; prove it on the laptop first |
| L3-S2 | switch measures may be unrelated to category/month | OPEN | `mcp/lib/metric-switcher.mjs` reads no relationships; plan says nothing | check model relationships (metadata) per measure and say it in the plan · M · low · writer → **SQ15** |
| L3-S3 | no nav button to Metric page; no phone layout | OWNER | `mcp/lib/metric-switcher.mjs` no button or mobile.json | decide whether the Metric page gets navigation and a phone layout |
| L3-S4 | L2 grid and slicerStyle not on Metric page | OWNER | grid done (fab795c, `metric-switcher.mjs:133`); slicer still list `:116-117` | laptop: prove pill slicerStyle on the Metric page in Desktop, then the writer change |
| L3-S5 | create_report description long; agent-text, SKILL.md unchanged | OBSOLETE | informational, no action |  |

### L4

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| L4-S1 | validator findings quote report names in `what` | DONE | 0.3.0 S1 B-211 (fab795c); `mcp/lib/check-report.mjs:43,346` scrub |  |
| L4-S2 | separate twin's flip faces stay English | DUPLICATE | `mcp/lib/twin-plan.mjs:137` cannot: flip faces | of L6-S1 |
| L4-S3 | flip front uses K/M/B in Arabic | DONE | 0.3.0 A3 (fab795c); `mcp/lib/flip-cards.mjs:35,56` Arabic units |  |
| L4-S4 | back's YoY needs measure table related to date table | OBSOLETE | informational, no action: told in the answer |  |
| L4-S5 | image.fit Fit, dataCategory ImageUrl not in lab JSON | OWNER | not in lab JSON (L4 note) | on the laptop, confirm the flip card with Fit and ImageUrl |

### L5

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| L5-S1 | model KPI (TMSL kpi) not read as a target | OPEN | `assets/js/tmdl-model.js` no kpi; `mcp/lib/status-icons.mjs:39` names only | read a measure's kpi targetExpression in the reader, use in targetOf · M · low · reader → **SQ15** |
| L5-S2 | Way C has two states, no warning band | OWNER | `mcp/lib/status-icons.mjs:8` target only, no threshold | decide whether Way C takes a user-given threshold for a warning band |
| L5-S3 | Arabic icon placement 'Before' not proven | OWNER | laptop item (L5 note) | on the laptop, check the other placement in an Arabic table |
| L5-S4 | new card, slicers, KPI cards get no icon | OWNER | not tried in the lab | decide whether to lab icons on these visuals on the laptop |
| L5-S5 | View > Themes import of a theme with icons unproven | OWNER | lab used it inside a project only | on the laptop, import a website theme via View > Themes |
| L5-S6 | validator findings quote report names | DUPLICATE | done by 0.3.0 S1 B-211 | L4-S1 |

### L6

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| L6-S1 | twin/bilingual Arabic half show DA pictures in English | OWNER | `mcp/WORK.md:28` open decision L6 Seen 1 | decide: a second, Arabic set of DA measures (a model script) |
| L6-S2 | KPI card picture keeps Latin K/M/B in Arabic | DONE 486d97d | `mcp/lib/dax-functions.mjs:159,163` frontValue without units | pass Arabic units (flip-cards WORDS.ar.units) when lang ar, append .u · S · low · writer → **SQ2** |
| L6-S3 | #82's Seen 2-8 still stand | DUPLICATE | restated as L6.md:319 items 2-8 | L6-S7..L6-S13 |
| L6-S4 | daxFunctions with sample or redesignFrom ignored silently | OPEN | `mcp/tools/plan_layout.mjs:114` other list lacks daxFunctions; `:181` sample | add report options to the planProblems lists (redesign, sample) · S · low · writer → **SQ10** |
| L6-S5 | Learn glossary calls UDFs a preview | OBSOLETE | external page; our texts guarded `mcp/test-0.3.1-dax-functions.mjs:263` |  |
| L6-S6 | Arabic twin keeps DA measures English | DUPLICATE | same decision | L6-S1 |
| L6-S7 | story title replaces "Top N of M:" title | OBSOLETE | informational, no action: static title kept as alt text |  |
| L6-S8 | picture rows (32 high) may leave a part row | OWNER | writer's whole-rows rule excludes picture tables (L6 note) | on the laptop, check a table with pictures for a part row above the total |
| L6-S9 | bullet bar scale per row | OBSOLETE | informational, by design: progress against each row's target |  |
| L6-S10 | approval preview draws pictures as placeholders | OBSOLETE | informational, no action: preview has no DAX values (metadata only) |  |
| L6-S11 | DAX_MEASURE_PENDING matches by name suffix | OPEN | `mcp/lib/dax-functions.mjs:33` suffix regex | note only when the DA script file is next to the project, verify first · S · low · checker → **SQ14** |
| L6-S12 | KPI card font sizes not measured in Desktop | OWNER | rule by height, not measured | on the laptop, measure the KPI card's fonts at two heights |
| L6-S13 | one image size for sparkline and bullet bar | OWNER | bullet 120x20 in 120x30 box (Fit) | on the laptop, check the bullet bar reads well in the shared box |

### M1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| M1-S1 | text-box panels: twin drops, create_report keeps | OWNER | `mcp/WORK.md:27` open decision M1 Seen 1 | decide which rule both follow: panel kept or switched off on Arabic pages |
| M1-S2 | twin's mirrored table loses "Total" | OWNER | `mcp/WORK.md:27` open decision M1 Seen 2 | decide the writer's table design for the twin, after a laptop check |
| M1-S3 | twin keeps number continuous axes left to right | OWNER | `mcp/lib/twin-model.mjs:25` isDateCol dates only | measure a reversed number axis on the laptop, then pass number columns |
| M1-S4 | narrow Arabic slicer slot gives negative widths | DONE f026240 | `assets/js/pbip-page.js:657-658` sw has no minimum | drop Reset (or a slicer) when sw < minimum, say it in the plan · M · low · writer → **SQ1** |
| M1-S5 | parity suite skips mobile.json and Reset formatting | OPEN | `mcp/test-0.3.1-mirror-parity.mjs:104` slicerBar known; no mobile check | compare mobile.json and Reset objects in the parity suite · M · none · tests-ci → **SQ11** |
| M1-S6 | matrix columns cut at top 100 | OBSOLETE | informational: Power BI's own limit, nothing to change |  |
| M1-S7 | R1's matrix sentence stays | OBSOLETE | informational, no action: MATRIX_SAID `mcp/lib/twin-plan.mjs:25` |  |

### P1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| P1-S1 | npm test one && chain hides later results | DONE | a9436b3 (G1) `mcp/run-tests.mjs:9` --keep-going; CI `tests.yml:204` uses it |  |
| P1-S2 | 0.3.0 CHANGELOG section has 38 coded lines | OBSOLETE | informational, no action: `scripts/changelog-words.mjs:1` checks [Unreleased] only, by design |  |
| P1-S3 | NFC/NFD branch macOS took missing from run log | DONE | 5ed4758 `mcp/test-platform-paths.mjs:78,128` result line prints fsSays |  |

### P7

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| P7-S1 | Size Band values stay English in Arabic report | OBSOLETE | informational, no action: data values; only calendar has Arabic twins (C1) |  |
| P7-S2 | Latin product name in a pill cannot be isolated | OBSOLETE | informational, no action: model's data value, not a DataArcus text |  |

### Q1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| Q1-S1 | T1's mutation test is linted, 0 findings | OBSOLETE | informational, no action (`package.json:11` lints mcp) |  |
| Q1-S2 | HTML pages' inline scripts are not linted | OPEN | `package.json:11` "eslint mcp assets/js"; `eslint.config.mjs` no html files | add eslint-plugin-html (or extract scripts) for tools/*.html, articles · M · low · tests-ci → **SQ11** |
| Q1-S3 | Two Arabic month lists (arabic-calendar MONTHS, pbip-query AR_MONTHS) | OPEN | `assets/js/arabic-calendar.js:13`, `pbip-query.js:217`; third in `mcp/lib/shadow-model.mjs:22` | pbip-query reads arabic-calendar's MONTHS (T-5 keeps them equal meanwhile) · M · low · calendar → **SQ14** |
| Q1-S4 | R5's planted titles never reach the report | DONE | 05f55b0 (T-4) `mcp/test-0.2.9i.mjs:145-150` checks the report's real titles |  |
| Q1-S5 | calendar-generator.js 40% unrun; website suites lack coverage | OPEN | c8 job `tests.yml:244-279` covers the MCP npm test only | Chromium coverage (page.coverage) over website suites, report only · L · low · tests-ci → **SQ15** |
| Q1-S6 | Tahoma header title 20pt in 46-high box trips validator floor | OWNER | `assets/js/pbip-page.js:691` size from header height; no Tahoma case | laptop: measure Tahoma header in Desktop, then pick 48-high box or 18pt title |
| Q1-S7 | twin plan needs 2-3 calls; 42 alt texts repeat titles | DONE (SQ4 082860a, f564362) | `mcp/lib/twin-plan.mjs:197` texts listed singly, no alt/title grouping | list an alt text that equals its title under that title · M · low · twin → **SQ4** |
| Q1-S8 | plan_layout flipCards.cards repeats each card per page | OPEN | `mcp/tools/plan_layout.mjs:493` flipPlan.cards passed whole, one per page | group cards by measure with a pages list · S · low · design → **SQ10** |
| Q1-S9 | suggest_fields accepts 60 tables, read_model 100 | OPEN | `mcp/lib/tool-inputs.mjs:18` max(60); `mcp/tools/read_model.mjs:15` max(100) | one shared constant (or say why 60) in tool-limits · S · low · reader → **SQ9** |

### R1-see-the-result

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| R1-see-the-result-S1 | planned report shadow has no .platform file | OWNER | `mcp/research/shadow-try.mjs:35` plannedReport; no .platform in plan-lint.mjs | laptop: open a planned-report shadow in Desktop; add .platform only if it fails |
| R1-see-the-result-S2 | health fixture _Measures gets 120 made-up rows | OBSOLETE | informational, no action (harmless, research prototype only) |  |
| R1-see-the-result-S3 | plan slots score 0.15-0.50 vs written pages | OPEN | `assets/js/theme-generator.js:258,331` website preview draws computeSlots | verify first: which website previews still draw slots, not the writer · M · low · design → **SQ13** |
| R1-see-the-result-S4 | Power Query shadow needs refresh; bridge has no refresh | OWNER | research only: `mcp/research/SEE-THE-RESULT.md:29,80`; no tool uses shadow-model | decide shadow form for S2 (DAX form opens with data) or refresh route |

### R1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| R1-S1 | check_report reads whole EN-AR copy as one language | DONE | 24c8387 (S1 item 1) `mcp/lib/check-report.mjs:319-323` pageLanguages per page |  |
| R1-S2 | writer readingOrder and check_report inversions disagree | DONE (SQ5 11a85ab) | measured: A, tall T right, B below: readingOrder A,T,B gives 1 inversion | align rules (row join for tall box) + test of this layout · M · low · checker → **SQ5** |
| R1-S3 | Arabic Detail title 45 chars at 24pt cannot fit | OBSOLETE | informational: plan already asks for a shorter Arabic text (as designed) |  |
| R1-S4 | matrix/table at 14pt show fewer rows | OBSOLETE | informational, no action: now a note; English pages keep user's sizes |  |
| R1-S5 | fixture visuals have no alt text | OBSOLETE | informational, no action: user's own report, not the twin's to add |  |
| R1-S6 | validator slicer/textbox floors differ from SLICER_FITS, TEXTBOX_FITS | OWNER | `assets/js/report-rules.js:137,201` unchanged (10+1.8pt; 16+4pt) | laptop: measure in Desktop which floor is true (60-high slicer, 32-high text box) |
| R1-S7 | Power BI default table/matrix word wrap not measured | OWNER | no measurement recorded since; note still claims wrap only when set | laptop: new table/matrix in Desktop, read word wrap default |

### RB

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| RB-S1 | T1 Seen 2 defence in depth kept | OBSOLETE | informational, no action (RB Decisions 1) |  |
| RB-S2 | T1 Seen 3: four parts got fast checks | OBSOLETE | informational: nothing open (T1 gave each a fast check) |  |
| RB-S3 | older T1 0.3.0 Seen lines are wording items | OWNER | `mcp/work/RB.md:163` "for the owner" | decide whether any older T1 (21 Oct) wording item gets a job |
| RB-S4 | rollback window between last check and unlink | OWNER | Node has no unlink by handle; hash narrows it (RB.md:164) | accept the residual microsecond window as known risk, or not |
| RB-S5 | T1.md mutant table still says W-size killed by S2c | OPEN | `mcp/work/T1.md:174`, `:226-228` unchanged | add one line in T1.md pointing to RB.md · S · none · docs-memory → **SQ12** |
| RB-S6 | ARCHITECTURE write path could say content-checked removal | OPEN | `ARCHITECTURE.md:25` "removes only what it created" | append "while its content is what this call wrote" · S · none · docs-memory → **SQ12** |

### S1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| S1-S1 | server instructions near 2,200 cap | DUPLICATE | measured 2,195 of 2,200 (`mcp/lib/agent-text.mjs:9`) | of 0.2.9-reader-S5 |
| S1-S2 | report-design skill and README lack rule 7 | OPEN | rule at `mcp/lib/agent-text.mjs:17`; absent in `mcp/skills/report-design/SKILL.md`, README | one line in skill Rules (both copies) and README · S · none · tools-docs → **SQ9** |
| S1-S3 | Microsoft validator's own writes not read by write gate | OPEN | `mcp/test-0.3.1-write-gate.mjs:2-3` scans mcp code only | verify first: read validator's fs writes, record in gate notes · M · low · checker → **SQ14** |
| S1-S4 | golden EN-AR tooltip pages get TOOLTIP_SCROLL note | OBSOLETE | informational, no action: there before S1 |  |
| S1-S5 | arabicCopy remakes whole copy, hand edits lost | OBSOLETE | informational: said in its how; in-place fix not proposed |  |
| S1-S6 | no Desktop step needed | OBSOLETE | informational, no action |  |
| S1-S7 | read_report returns short text box as typed | DUPLICATE | `mcp/lib/read-report.mjs:23,377` safeText screens only; PRIVACY.md:240 known gap | R7-claims N1 |
| S1-S8 | SCHEMA finding pointer() keeps plain-word segments | OPEN | `mcp/lib/check-report.mjs:78` any [A-Za-z0-9_$] segment kept | verify first: keep only schema property names, others "…" · S · low · checker → **SQ14** |
| S1-S9 | "Last N months: measure" helper can mix scripts | DONE f026240 | `assets/js/pbip-query.js:410` no latinOnly; Keep uses it at :455 | same latinOnly fallback as Keep (e.g. "Last N months") · S · low · writer → **SQ1** |
| S1-S10 | fuzz 8199 checks Linux vs 8226 Windows | OBSOLETE | informational, no action |  |

### S9

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| S9-S1 | MONTHS_AR unused; month test passes on that line | DONE | 05f55b0 (Q1 T-5) `mcp/test-0.2.9i.mjs:171`; line kept `twin-model.mjs:14-15` |  |
| S9-S2 | unused imports in original files | DONE | dropped by S9's move (e.g. 654d409); none in server.mjs, lib/twin-*.mjs |  |
| S9-S3 | approval-window.mjs, check-report.mjs over/near 60 KB | OWNER | now 68,918 and 57,356 bytes; line at `mcp/work/S9.md:157` | decide whether to split approval-window.mjs (owner's "don't rewrite working engines") |
| S9-S4 | same module imported in two statements | OPEN | `mcp/lib/report-run.mjs:7,20` files.mjs; plan_layout.mjs arabic-twin.mjs twice | merge each pair into one import · S · none · writer → **SQ10** |

### T1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| T1-S1 | rollback identity fooled by inode reuse | DONE | RB 4a40003 (merged 2a70d72); `mcp/lib/write-io.mjs:132` sameBytes sha256 check |  |
| T1-S2 | defence in depth no tool reaches (G-artifact, W-free-real) | OBSOLETE | informational, no action; RB.md Seen 1 confirms kept, equivalent |  |
| T1-S3 | some behaviour guarded only by test.mjs parts | OBSOLETE | informational; T1 gave each a fast check (RB.md Seen 2) |  |
| T1-S4 | golden baseline differs under parallel workers | DONE | RB 932f61b: copy holds gulf-calendar; `mcp/test-0.3.1-mutation.mjs:140` |  |
| T1-S5 | known-gap path dead with today's catalog | DONE | RB fe96c24: `mcp/test-0.3.1-validator-gap.mjs`, `mcp/tests.json:104` |  |
| T1-S6 | Arabic page: writes lines and row texts stay English | DONE (SQ3 a6130f7) | `mcp/lib/approval-window.mjs:210` writes printed as given; `create_arabic_twin.mjs:61` English | Arabic writes line per tool (writesAr) shown when ar · M · low · approval → **SQ3** |
| T1-S7 | worth-a-look names visual by type and box | DONE (SQ5 11a85ab) | `assets/js/layout-check.js:304` rule findings `${type} at x,y wxh` | plain place words (top left, second row) not titles (R5) · M · low · checker → **SQ5** |
| T1-S8 | twin plan says "0 Arabic texts as approved" before approval | DONE (SQ3 a6130f7) | `mcp/tools/create_arabic_twin.mjs:62` prints labels.given even when 0 | when 0 say "no Arabic texts approved yet" · S · low · approval → **SQ3** |
| T1-S9 | Arabic heading keeps English count words | DONE (SQ3 a6130f7) | `mcp/lib/approval-window.mjs:492` "Shown in English (n, no Arabic text)" | count words via the ar table (as line 183) · S · low · approval → **SQ3** |
| T1-S10 | judge's unplanned slicer not reproduced | OWNER | needs a tester's model; not reproducible on fixtures | if a tester sees it, get that model's layout to find the visual |
| T1-S11 | one Arabic term per concept (E1 F-4) | DONE | job E 7893922 (merged 11df69b); no عوامل التصفية in engines or MCP |  |
| T1-S12 | suggest_fields off target on large-synthetic | OBSOLETE | informational: the fixture model has no revenue or cost measures |  |
| T1-S13 | twin Options row: English "About the script" quote, English rows | DONE (SQ3 a6130f7) | `mcp/lib/approval-window.mjs:487` Options rows English only | Arabic Options rows and quote when ar · S · low · approval → **SQ3** |
| T1-S14 | Saudi Ramadan/Eid dates missing from gulf-dates.js | OBSOLETE | `scripts/gulf-calendar/DATES-SOURCES.md:58` KSA sourced, every year same as UAE |  |
| T1-S15 | laptop items: aea6d74, clean-up script, stash, items 8, 10 | OWNER | laptop-only state, not in this tree | on the laptop: drop or push aea6d74, run clean-up, drop stale stash, finish items 8 and 10 |

### U1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| U1-S1 | Microsoft validator ignores literal kind ('eight') | OBSOLETE | informational, Microsoft's limit; pinned `mcp/test-0.2.9-checks.mjs:147` radiusText |  |
| U1-S2 | reportThemeSchema-2.159 not strict JSON schema | OBSOLETE | informational: DataArcus does not validate themes against it |  |
| U1-S3 | Microsoft's What's new and change log lag | OBSOLETE | informational, Microsoft's pages |  |
| U1-S4 | D5 ran on Desktop 2.159 without build number | OWNER | `scripts/tests/DESKTOP-TESTS.md:2468` says "2.159"; README:15 claims 2.159.883.0 | on the laptop confirm the build D5 and 0.3.0 proofs ran on, record it |
| U1-S5 | new card trend objects and Gantt not researched | OBSOLETE | informational, not used by DataArcus |  |

### V1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| V1-S1 | Arabic "Details" tab drawn cut in preview | OWNER | only Desktop shows whether the twin's tab is really cut | on the laptop open the twin's Details page, check the tab text fits |
| V1-S2 | line placeholder shows "label length unknown" note | OPEN | `assets/js/page-preview.js:151` labels: 'طول التسميات غير معروف' | hide the labels note on approval previews or reword plainly · S · low · design → **SQ13** |
| V1-S3 | preview tag Arabic on the copy's English pages | DONE (SQ3 a6130f7) | `mcp/lib/approval-window.mjs:198` lang from previews.lang ('ar') for all pages | pass lang per page (p.rtl ? 'ar' : 'en') · S · low · design → **SQ3** |
| V1-S4 | time-chart placeholder gives no time direction cue | OPEN | `assets/js/page-preview.js:166` mirrors glyph by page.rtl only, no direction cue | verify first: draw an axis arrow showing time direction (timeRightToLeft) · S · low · design → **SQ13** |

### W

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| W-S1 | W and E stamps and min files to reconcile on merge | DONE | merged 11df69b, 2b36f64, E2 4b5337e; all 78 pages `lang-manager.min.js?v=20261025a` |  |
| W-S2 | lens fix texts unread off Desktop's Format pane | OWNER | `mcp/lib/arabic-lens.mjs:143` names the Format pane options | on the laptop read the exact option names in the Format pane |
| W-S3 | Arabic captions say left/right over unmirrored pictures | OWNER | content choice in the Arabic article | decide: keep captions, or mirror pictures for the Arabic page |
| W-S4 | article says lens from 0.3.1, beta download still 0.3.0 | OWNER | `power-bi-mcp/index.html:223` dataarcus-0.3.0.mcpb; article p10 says 0.3.1 | merge integration/0.3.1 to main only with the 0.3.1 release and download |
| W-S5 | BLOG-PLAN says 16 website suites, run-all has 20 | OPEN | `content/BLOG-PLAN.md:98` "All 16 website suites" | say "every website suite" (no count) · S · none · docs-memory → **SQ12** |
| W-S6 | English quote ends inside quotation marks as Learn does | OBSOLETE | informational, no action |  |

### W1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| W1-S1 | "A real run" is 0.2.8 of 8 Oct | DUPLICATE | `assets/js/translations/beta-page.js:82` "with DataArcus 0.2.8" | of 0.2.9-design-S11 |
| W1-S2 | privacy line "short titles as typed" not sharp | DONE | `assets/js/translations/beta-page.js:92` "short text boxes, and for the Arabic twin its titles" |  |
| W1-S3 | read_report "one line per visual" still true | OBSOLETE | informational; `mcp/tools/read_report.mjs:12` |  |
| W1-S4 | llms.txt describes MCP without a version | OBSOLETE | informational, no action (`llms.txt` has no version) |  |

### W2

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| W2-S1 | homepage "validated against the source system" consulting claim | OWNER | `assets/js/translations/homepage.js:79` | decide whether the consulting sentence stays as written |
| W2-S2 | ROADMAP "AI report generation now free and official" | DONE | removed in efe8669; no hit in `mcp/ROADMAP.md` |  |
| W2-S3 | DESKTOP-TESTS should record 2.159.883.0 | DUPLICATE | `scripts/tests/DESKTOP-TESTS.md:2468` still "2.159" | U1-S4 |
| W2-S4 | PRODUCT_SPEC rows predate plan gate; rule 4 titles as typed | OPEN | `mcp/PRODUCT_SPEC.md:79` no approval/planId; `:120` "short titles and texts as typed" | add approved-plan step to write rows; rule 4 as PRIVACY.md section 3 · M · low · tools-docs → **SQ9** |
| W2-S5 | mcp/CLAUDE.md says website has 13 suites | DONE | A1 93f9219; no "13 suites" in `mcp/CLAUDE.md` |  |

### X1

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| X1-S1 | button look, hidden-page sync, No data AR card, bookmark Reset | OWNER | Desktop-only proofs | on the laptop: one run of the EN-AR copy checking these four |
| X1-S2 | bookmark group name not in twin texts | DONE (SQ4 082860a) | `mcp/lib/twin-copy.mjs:227` group cloned with English displayName; `twin-texts.mjs:145` bookmarks only | add bookmarkGroup text ids, apply approved label · M · low · twin → **SQ4** |
| X1-S3 | page navigator lists English pages; bookmark navigator both | OBSOLETE | informational: said in plan notes `mcp/lib/twin-copy.mjs:246` |  |
| X1-S4 | language button last in tab order | DONE | R1 3e03ab9: `mcp/lib/twin-copy.mjs:108` tabInOrder |  |
| X1-S5 | validator dropdown notes, labelled-by-title, D3 phone header | DUPLICATE | dropdown notes gone since U1 catalog 0.1.3 (RB VG-2); phone header unchecked | of D3-S1 (dropdown notes done since U1; the phone header is D3-S1) |

### X2

| Id | Item | Status | Evidence | Fix · size · risk · area → batch (OPEN) / decision (OWNER) / of (DUPLICATE) |
|---|---|---|---|---|
| X2-S1 | demo Arabic Reset button BUTTON_ONE_LINE, not widened | DONE (SQ4 082860a) | `assets/js/report-rules.js:155` rule; copy's button not widened (X2.md:194) | verify first: apply twin's button fit to copy's own buttons · M · low · twin → **SQ4** |
| X2-S2 | TOOLTIP_SCROLL note on tooltip pages | OBSOLETE | informational: note stays by design (no data read) |  |
| X2-S3 | sync groups numbered in random file-name order | DONE (SQ4 082860a) | `mcp/lib/twin-read.mjs:51` sort by file; `twin-copy.mjs:176` ++n | number by page order then position (y, x) · S · low · twin → **SQ4** |
| X2-S4 | inherited X1 items (group name, navigator, flip cards) | DUPLICATE | same as X1-S2, X1-S3 | X1-S2 |
| X2-S5 | M1/R1 open items: panels, lost "Total", matrix variant | DUPLICATE | `mcp/WORK.md:27` lists M1 Seen 1-2 and the matrix variant | M1-S1, M1-S2 |
