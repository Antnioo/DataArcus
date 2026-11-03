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
- **Got:** cx2 16 (10 red on 2e912e2 first); 0.3.0-claims 674 -> 688 (13 of 14 new red first; W2-2, D5-P4 changed on
  purpose, red first); bilingual-report 32 -> 33 (B5i red first); release-text 38 = 38; twin 12, release 5, safety and
  arabic 30 suites pass; website site 622, theme-generator 922, pbip 111, whats-new 167, site config pass.
- **State: DONE.** Full run on c2d673c: 112 suites passed (the base's 111 + cx2); CI started on the branch.
- **Resume:** none; the reviewer's merge.

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

## Results (before -> after)
Commits: plan 2e912e2; the work 8755644; the screen patterns moved c2d673c (the last code commit); this note.

The first full run, on 8755644: 111 of 112 passed; `mutation` failed (S-approval survived: the mutant finds the
approval pattern by the line after it, and my consent pattern sat there, so it disabled mine). c2d673c moves my three
patterns above the AUD-039 block (no pattern changed): mutation 74 of 74 killed, cx2 16, test-audit-oct 12.

| Finding | Before | After | Source of the fact | Test |
|---|---|---|---|---|
| F03 | read_report: "a redesign would drop them" | a redesign copies custom visuals unchanged, never moved, resized or restyled, each listed as not changed (the skill too, both copies) | redesign.mjs:9, 283 | cx2 R1, R2 |
| F04 | generate_theme: "this answer's, or plan_layout's" planId writes the theme file | its own plan only; plan_layout's approves the report | plans.mjs:21 ALLOWS (report: create_report) | cx2 G1; the run of the sequence: test-0.2.9 G3, G4 |
| F05 | "every new report create_report writes has it" | reports planned with plan_layout; pages placed by hand take the theme, no DataArcus page picture; a theme alone carries the picture, Desktop not yet measured | report-run.mjs:309 vs 364; GD2.md plan item 4 | claims CX2-F05 x3 |
| F06 | "draws each Arabic page"; a failed preview showed nothing | "up to 12 pages or page pairs (the rest counted), tooltip pages not drawn"; the approval page says when the pages (or the Arabic half) could not be drawn, EN and AR | approval-window.mjs:111 PREVIEW_PAGES_MAX; twin-preview.mjs:12, 41 | cx2 A1-A4; claims CX2-F06 x3, D5-P4 |
| F07 | "exactly 16" | 16 on 1280 x 720, scaled with the page's height (24 on 1920 x 1080) | redesign.mjs:197 (u = h/720, round(16u)) | claims CX2-F07 |
| F09 | "flagged and never followed" | a pattern screen, a heuristic that can miss a paraphrase; names are data; nothing written before the person approves. Three patterns flag both paraphrases | model.mjs SCREEN; plans.mjs (the gate) | cx2 F1-F3; claims CX2-F09 x3 |
| F13 | README: "on each report before it is written" | on each new report planned with plan_layout before create_report writes it, and in check_report; redesign, twin, EN-AR copy and sample not | plan_layout.mjs:62 (checkArtifact's only caller: `grep -rn "checkArtifact(" mcp/lib mcp/tools`) | claims W2-2 |
| TW1 Seen 1 | an answer past 40,000: `bilingual.cannot` halved like any list (7 -> 1 in B5i, the flip faces gone) | cut last (`BILINGUAL_LAST`, its own block), and then named in truncated.cut | answer.mjs capAnswer opts.last | bilingual-report B5i |
| TW1 Seen 2 | a shadow's side preset kept on the Arabic page | Left/Right swapped in the preset (BottomRight -> BottomLeft ...), any visual's container (custom too) and the phone layout; Top, Bottom, Center and a Custom angle kept | report-mirror.js mirrorShadow | cx2 S1-S6 |

Tests (red first on 2e912e2, in a worktree of it with the new tests):
- New suite `cx2`: 10 of 16 red on 2e912e2 (S1, S4, S5, F1, F2, A1, A3, G1, R1, R2); S2, S3, S6, F3, A2, A4 are guards
  (they pass on both). -> 16 PASS.
- `0.3.0-claims` 674 -> 688: 14 new checks (CX2-*), 13 red on 2e912e2 (the headline guard passes on both); W2-2 and D5-P4
  changed on purpose (the README's validator sentence names its routes; PRIVACY says "up to 12"): both red on 2e912e2.
- `bilingual-report` 32 -> 33: B5i red on the old plan_layout (cut 7 -> 1), PASS after.
- `test-0.3.1-arabic-terms` 85 = 85: AT-5 failed once on my first Arabic l4 (the page's first «التلميح» lacked
  "(Tooltip)"); fixed in the words: (Tooltip) moved to the first use, the later "(Tooltips)" in new.l1 dropped.
- Equal: twin area 12 suites (11 = 11 + cx2; plain twins byte for byte: no fixture has a sided shadow), release 5,
  safety and arabic 30 (test-audit-oct 12 = 12: the plain-name corpus over every fixture and test model), whats-new 167.

Full run on c2d673c: "run-tests: 112 suites passed"

## CHANGELOG line
mcp/CHANGELOG.md [Unreleased], changed on purpose: the twin's line gains "A visual's shadow cast to one side (bottom
right, say) is cast to the other side on the Arabic page"; the redesign's grid (F07), glass by default (F05), the glass
theme alone (F05), "See the Arabic pages" (F06) and "Safety" (F09) said as they are. No new bullet.

## Decisions I made
- F06 "a preview failure is said": code was the true fix (today a failed preview is silent). Both callers of
  twinPreview are CX1's files (create_arabic_twin.mjs) or outside my plan_layout block, so the approval page infers it:
  a twin plan whose `preview` is null (twinPreview returns null only on a failure), a bilingual plan whose preview has
  no `pairs` (its Arabic half failed: the English pages are still drawn, and the page says the Arabic ones are not).
- F09: three patterns, each needing its object ("invoke/call/use ... the tool", "export ... every record", "has
  consented", "proceed with the write"): 18 plain names that share the words stay unflagged (cx2 F3), and the plain-name
  corpus of test-audit-oct (every fixture's names) still passes. The public text says the screen is a heuristic either way.
- TW1 Seen 1: `cannot` added to the lists cut last (with the texts and the terminology sheet), not given its own cap: it
  is a short fixed list of kinds; when nothing else is left to cut it is cut and named in truncated.cut like every cut.
  The plan's "every limit named in one line" was not needed once it is cut last: left out.
- TW1 Seen 2: a Custom shadow angle is kept as it is (which way Desktop measures the angle is not measured): for the
  laptop. The twin's theme is copied as it is (CX1's twin-copy.mjs): a theme-wide shadow preset to one side stays.
- F05: "New reports DataArcus plans" in the list (plan_layout's reports, the bilingual one and the sample included).
- report-mirror.min.js changed: its ?v= stamp lives in theme-generator.js:549 (LC1's file): not touched. It already
  differs from main's (20261027tw1), so the stamp check passes and the live site gets a new one at the release; the
  reviewer may bump it at merge. beta-page.min.js: ?v=20261027cx2 on both pages.
- PRIVACY.md and PRODUCT_SPEC.md said "draws each Arabic page" too (D-1027-20): "up to 12". TOOLS.md already said "at
  most 12": unchanged.

## For the owner
none

## Risky changes
- What an answer returns: generate_theme's and read_report's descriptions (tools/list); plan_layout's bilingual answer
  past 40,000 characters keeps `cannot` whole and cuts other lists further instead; check_report and read_model's
  `suspiciousNames` can flag three more kinds of name (cx2 F3 and test-audit-oct guard plain ones).
- The approval page: a new line when the pages could not be drawn (EN, and AR with the English).
- Tests that lose checks: none (W2-2 and D5-P4 check the new sentences instead of the old).

## For the laptop
1. A report with a visual whose shadow is BottomRight: its twin's Arabic page casts it BottomLeft, as on screen mirrored.
2. A Custom shadow angle (say 45): which way Desktop measures it, so the twin can mirror it (today kept).
3. A glass theme from generate_theme used alone on a hand-made report: does Desktop draw the theme's page picture?

## Seen, not in scope
1. CX1: create_arabic_twin could run Microsoft's validator on the twin's exact files before the plan (as plan_layout
   does through checkArtifact): the README would then name it. Not done here (CX1's file).
2. PRODUCT_SPEC.md "Not yet (planned): background images drawn by the engine": the engine now draws the glass page
   picture. Which images the line means is the owner's spec: left as it is.
3. plan_layout's bilingual answer with every option (bilingual-report B5) measured 39,946 to 40,000 characters in 7
   runs before my change: at its cap, so any new field cuts lists (said in truncated). Worth a smaller answer there.

## Lessons for the reviewer
- The mutation suite finds its targets by the text around them: a new line placed next to one (the screen's approval
  pattern) silently retargets the mutant. Add new patterns away from a mutation's anchor, or run `mutation` first.
- A public sentence fixed in beta-page.js must be copied into both power-bi-mcp pages by hand: ar-pages.mjs --write
  does not render them (it said "up to date"); claims checks both pages.
- The Arabic terms suite (AT-5) wants the owner's term glossed once, at its first use on the page: a new sentence that
  uses a term earlier than before moves the gloss.
