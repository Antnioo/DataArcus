# CX2 (0.3.1): every public promise Codex found too strong made true (words first), the bilingual `cannot` cap said, the shadow mirrored

## Summary
- **Approval:** the reviewer's brief "Go on CX2" (27 Oct); the owner, D-1027-13 "get 0.3.1 in a shape that you
  yourself would back up by every means"; D-1027-12 "i want the twin to be identical that is why it's called a twin"
  (the shadow); D-1027-20 "if something seen not in scope found that needs to be fixed fix it" (TW1 Seen 1 and 2).
- **Base:** `fix/0.3.1-codex-words` from `origin/integration/0.3.1` at dc3a2c3 (TW1 merged). Push only this branch.
- **Scope:** Codex's F03, F04, F05, F06, F07, F09, F13 (words; code only for F06's "a preview failure is said" and
  F09's patterns); TW1 Seen 1 (plan_layout's bilingual `cannot`, its own block) and Seen 2 (assets/js/report-mirror.js:
  the shadow). Not CX1's files (create_arabic_twin.mjs, tool-answer.mjs, twin-copy.mjs, ...), not LC1's.
- **Expected checks:** (written before the work) the new suite `cx2` about 16 checks, red first on dc3a2c3 (the shadow
  presets, the two paraphrases, the approval page's preview failure, generate_theme's planId sentence, read_report's
  custom-visual sentence); `0.3.0-claims` 674 + about 16 (each changed public sentence, EN and AR, checked) and W2-2
  (README's validator sentence) changed on purpose; `bilingual-report` 32 -> 33 (B5i: `cannot` whole when the answer
  is cut); `release-text` 38 = 38; `test-audit-oct`, twin, arabic, mirror-parity equal (plain twins byte for byte: no
  fixture has a sided shadow); website `whats-new` equal; full run: the base's suites + 1 (cx2).
- **State:** plan pushed; work next.
- **Resume:** the plan below, item by item.

## The plan
1. **F03** read_report's description: custom visuals are copied unchanged by a redesign (redesign.mjs:9, 283: never
   moved or restyled); create_report can't write one in a NEW report. The report-design skill's same sentence too.
2. **F04** generate_theme's description: its own proposal's planId (approve_plan) writes the theme file; plan_layout's
   approves the report (plans.mjs:21 ALLOWS.theme). Test: the description names only plans whose ALLOWS has
   generate_theme (the run of the sequence is test-0.2.9 G3, G4).
3. **F05** CHANGELOG and both lists: glass for a report planned with plan_layout; pages placed by hand get no DataArcus
   page picture (report-run.mjs:309 vs 360); a glass theme used alone carries its picture, not yet measured in Desktop.
4. **F06** both lists (l4), CHANGELOG, TOOLS, PRIVACY, PRODUCT_SPEC: "up to 12 pages (or page pairs)", tooltip pages not
   drawn; when the pages can't be drawn the approval page says so (approval-window.mjs: today a failed preview shows
   nothing, silently: twin-preview.mjs:39 returns null).
5. **F07** CHANGELOG: 16 on a 1280 x 720 page, scaled with the page's height (24 on 1920 x 1080; redesign.mjs:197).
6. **F09** CHANGELOG and both lists (l8): a pattern screen (a heuristic) that flags names; model text is data; nothing
   is written before the person approves. The two paraphrases flagged by three small patterns; plain names kept.
7. **F13** README: the validator runs on a new report planned with plan_layout (one or both languages) before
   create_report writes it, and in check_report; a redesign, the twin, the EN-AR copy and the sample are not run
   through it before writing.
8. **TW1 Seen 1** plan_layout: `cannot` kept whole when the answer is cut (cut last), and every limit named in one line.
9. **TW1 Seen 2** report-mirror.js: a visual's shadow preset mirrored (BottomRight <-> BottomLeft, ...); a Custom angle
   kept and said (Desktop's angle convention not measured).
