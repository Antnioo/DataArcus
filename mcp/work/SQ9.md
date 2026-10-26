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
- **Expected checks** (written before the work): claims 643 -> about 660, about 15 red first; new `sq9` suite about 14
  checks, about 9 red on the base (3 pass on the base: behaviour that already holds); then both PASS. `npm test --
  release` 3 suites -> 4 suites, all pass; `npm test -- core` unchanged and passing; `node
  scripts/check-agent-memory.mjs` PASS; no other test's numbers change.
- **Got:** (filled after the run)
- **Resume:** plan pushed; next the red tests, then the fixes.

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
