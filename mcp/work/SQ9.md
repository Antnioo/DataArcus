# SQ9 (0.3.1 night, Seen batch 9): tool texts and public claims in the package

## Summary
- **Approval:** the owner's "Yes, fix now" to every open "Seen, not in scope" item (26 Oct); the reviewer's brief "Go on
  SQ9". Batch "SQ9: tool texts and public claims in the package" in [SEEN-QUEUE.md](SEEN-QUEUE.md).
- **Scope:** `mcp/lib/agent-text.mjs` (SOURCE_OF only, not the instructions), `mcp/tools/check_report.mjs` (lang),
  `mcp/lib/tool-inputs.mjs` (ADDS, tablesInput), `mcp/lib/tool-limits.mjs` (LIMITS.tables), `mcp/tools/read_model.mjs`,
  `mcp/tools/check_model_health.mjs` and `mcp/tools/add_gulf_calendar.mjs` (annotations only), the report-design
  skill (both copies), `mcp/README.md`, `mcp/PRODUCT_SPEC.md`, `mcp/skills-packaging/README.md`, `mcp/package.json`
  (description); tests: `mcp/test-0.3.0-claims.mjs` (public text) and a new suite `mcp/test-0.3.1-sq9.mjs` (schemas,
  hints, the repeat behaviour; one line in `tests.json`); my 11 Status cells in SEEN-QUEUE.md. Not SQ13's or SQ14's files.
- **Base:** `fix/0.3.1-sq9` from `origin/integration/0.3.1` (e1f895d). Push only this branch; the reviewer merges.
- **Items:** 10 confirmed true on e1f895d; AF2-S1 OBSOLETE (create_report does pick a free name, measured below).
- **Expected checks:** (written before the work) claims 643 -> about 660, about 15 red first; new `sq9` suite about 14
  checks, about 9 red on the base (3 pass on the base: behaviour that already holds); then both PASS. `npm test --
  release` 3 suites -> 4 suites, all pass; `npm test -- core` unchanged and passing; `node
  scripts/check-agent-memory.mjs` PASS; no other test's numbers change.
- **Got:** claims 643 -> 672 (red a6a16f6: 29 failed) -> 672 PASS; `sq9` 22 checks (red: 11 failed; H3, I2-I6 held
  on the base) -> 22 PASS; release 3 -> 4 suites pass; core 6 suites pass before and after (mcp 1591); agent-memory PASS;
  lint clean; full run: pending (written in the next push).
- **Resume:** done (c3d8428 plan, a6a16f6 red, 7653789 fixes, 3670659 queue, then this note); the reviewer merges.

## The items, confirmed on e1f895d (a scratch probe in process: the tools' handlers and the gate, made-up fixtures)
1. **AF2-S1** (TOOLS.md "picks a free name"): NOT true as an item. `plan_layout` + `create_report` named "Sales Report"
   twice on `fixtures/twin-project`: the second report is written as "Sales Report - New design"
   (`assets/js/pbip-export.js:319`, the taken names from `mcp/lib/report-names.mjs` `takenNames`). The refusal the item
   cites (`report-run.mjs:384`, writeTree's 'wx') is for a name taken after the go. -> OBSOLETE.
2. **C-S1**: `planSources()` prints "create_report (from redesign)": `SOURCE_OF` (`agent-text.mjs:33`) has no
   `redesign`, a kind of `ALLOWS` (`plans.mjs:26`).
3. **0.2.9-checks-S9**: `check_report.mjs:17` lang enum auto/en/ar; `check-report.mjs:324-326` takes 'he' (rtl).
4. **0.2.9-design-S8**: measured: a second full flow (new plan, approve, write) of `check_model_health` and
   `add_gulf_calendar` on an unchanged model names the same files and leaves the disk unchanged (same files, same
   mtimes); the same planId again is refused ("a plan writes once"). `generate_theme` repeated writes `brand-2.json`
   (a new file): it stays false, as do create_report (a "- New design" copy) and create_arabic_twin.
5. **Q1-S9**: `tool-inputs.mjs:18` tablesInput max 60 (suggest_fields, plan_layout, create_report); `read_model.mjs:15`
   max 100. No reason recorded for 60. Measured on large-synthetic (300 tables): suggest_fields with 60 / 100 tables
   answers 9,704 / 10,546 characters, plan_layout 14,177 / 14,177: far under the 40,000 cap.
6. **A2-S11**: the skill names no `metricSwitcher`, no terminology sheet (`arabicTerms`, the twin's `terms`), no
   `gulfDates`.
7. **A2-S12**: the skill says "few members"; the code: waterfall <= 12 members and a known count
   (`visual-gallery.js:41,115-116`), small multiples <= 9 panels (`:126`), combo a time or ordered axis (`:100-101`).
8. **S1-S2**: rule 7 (`NO_DIRECT_EDITS`, `agent-text.mjs:22`) is not in the skill nor in `mcp/README.md`.
9. **W2-S4**: PRODUCT_SPEC's rows: check_model_health "Writes: nothing" (it writes its fix scripts after approval),
   generate_theme / create_report / add_gulf_calendar name no approved plan, plan_layout names no planId,
   suggest_fields "1-8" (LIMITS.kpiCards is 6); rule 4 "short titles and texts as typed".
10. **D5-S1**: `skills-packaging/README.md:61` "a report's short titles, screened and returned as typed".
11. **A2-S7**: `package.json:4` lists four tools.

## Plan
1. This note (commit, push).
2. Red first: claims (C-S1, A2-S11, A2-S12, S1-S2, W2-S4, D5-S1, A2-S7) and `test-0.3.1-sq9.mjs` (checks-S9 enum and
   description, design-S8 hints and the repeat behaviour, Q1-S9 one limit and the 100-table answers under the cap).
3. Fixes at the cause, one commit; the queue's Status cells; this note's results; one push.

## Each item, before -> after (the code each new sentence rests on)
1. **AF2-S1** OBSOLETE: TOOLS.md's "picks a free name" is true (`assets/js/pbip-export.js:319`); unchanged.
2. **C-S1** "create_report (from redesign)" -> "create_report (from plan_layout with redesignFrom)"
   (`lib/agent-text.mjs:33`; the kind `lib/plans.mjs:26`). Claims: no kind is ever named by its key.
3. **0.2.9-checks-S9** lang auto/en/ar -> auto/en/ar/he, the description says ar and he run the right-to-left rules
   (`tools/check_report.mjs:17`; `lib/check-report.mjs:324-326`; sq9 H3 runs it).
4. **0.2.9-design-S8** check_model_health and add_gulf_calendar `idempotentHint` false -> true (`ADDS_SAME`,
   `lib/tool-inputs.mjs:19`; `tools/check_model_health.mjs:61`, `tools/add_gulf_calendar.mjs:54`): a second plan names
   the file that already holds the same script (`lib/fix-scripts.mjs:15`), the disk stays as it was (sq9 I5), the same
   planId again is refused (I4). generate_theme, create_report, create_arabic_twin stay false: a repeat writes another
   file (I6: `brand-2.json`; "- New design"). The README's annotations line says it.
5. **Q1-S9** 60 (picker) and 100 (read_model) -> `LIMITS.tables` 100 for all four (`lib/tool-limits.mjs:17`,
   `lib/tool-inputs.mjs:18`, `tools/read_model.mjs:16`); sq9 T3 measures 100 tables under 36,000 characters.
6. **A2-S11** the skill gains three Rules lines: metricSwitcher (`lib/report-inputs.mjs:96`, `tools/plan_layout.mjs:523`),
   the terminology sheet (`lib/terminology.mjs:220`, `tools/plan_layout.mjs:482,502`, `tools/create_arabic_twin.mjs:39`,
   `lib/report-inputs.mjs:89`), gulfDates (`lib/gulf-date-questions.mjs:48`, `tools/plan_layout.mjs:171-174`).
7. **A2-S12** "few members" -> waterfall a known count, at most 12 members; small multiples at most 9 panels, never an
   id/code/name split; combo a time or ordered axis (`assets/js/visual-gallery.js:41,100-101,115-116,126-127`; the test
   reads MAX_STEPS and MAX_PANELS).
8. **S1-S2** rule 7 (`NO_DIRECT_EDITS`, `lib/agent-text.mjs:22`) word for word in the skill's Rules and the README's Safety.
9. **W2-S4** PRODUCT_SPEC: every writing tool's Writes cell names its approval (`lib/plans.mjs:17-28`);
   check_model_health "nothing" -> its fix scripts after approval; generate_theme and check_model_health return a
   proposed planId without one; plan_layout returns the plan's planId (or planProblems); create_report writes exactly
   the plan's files, a name taken after the go writes nothing (`lib/report-run.mjs:384-406`); suggest_fields 1-8 -> 1-6
   (`LIMITS.kpiCards`); rule 4 as PRIVACY section 3 (read_report: page names and text boxes up to 120 characters, never
   a static title; the twin: the texts a reader sees, titles included).
10. **D5-S1** the plugin README's "short titles, screened" -> text boxes, never a static title, the twin's texts for
   their Arabic (PRIVACY.md section 3); the skill's own privacy line said the same and got the same fix (Decision 3).
11. **A2-S7** "read a model, suggest fields, check model health, create a report project" -> reads and checks models
   and reports, writes new reports, themes and scripts after your approval (no list).

## CHANGELOG line
- The tool texts say what the tools do: check_report takes Hebrew (`lang: "he"`), every tool that takes tables takes
  up to 100, and the two scripts tools that write nothing new on a repeat say so (`idempotentHint`).

## Decisions I made
1. **A new suite `test-0.3.1-sq9.mjs`** (area release) for the schemas, hints and the repeat behaviour: no suite checks
   tool schemas in process; the public text stays in the claims test.
2. **100, not 60, for every tool**: measured far under the cap; a lower read_model limit would take away what Q1 measured.
3. **The skill's privacy line** (the same stale claim as D5-S1, read_report's titles) fixed with D5-S1, at its cause.
4. **A new `ADDS_SAME`** beside `ADDS` rather than per-tool literals: one reason, said once.

## Seen, not in scope
1. `mcp/test-0.3.0-large-model-caps.mjs` still calls suggest_fields with "(60, the most it takes)": the label is stale
   now (the most is 100); its numbers untouched (not my test).
2. PRODUCT_SPEC's plan_layout "Takes" says "KPI cards (3-6)" (the schema takes 0-6, `tools/plan_layout.mjs:157`) and lists no `path`/`planFields`; its create_report
   "Takes" names few of the 0.3.0 options (gallery, flip cards, status icons...): the rows' Writes are now right, their
   Takes still short.
3. PRIVACY's "In one paragraph" (`PRIVACY.md:17-19`) says a report's "titles" are returned, with no word that read_report
   returns none (section 3 says it); not this batch's file.
