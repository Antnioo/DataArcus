# P3A (0.3.1): two tools give one verdict on the same files; mode "dark" never dropped silently

## Summary
- **Approval:** the reviewer's brief "Go on P3A" (28 Oct): two defects the laptop's part 3 found on 0.3.1-rc.2
  (block B: Seen 4 and finding B-1). The owner: D-1027-13 ("get 0.3.1 in a shape that you yourself would back up by
  every means"); DataArcus never says something untrue to the person.
- **Scope:** `mcp/lib/check-report.mjs` (the grouping), `mcp/lib/artifact.mjs` (the plan's validator warnings by
  code), `mcp/tools/create_report.mjs` (its check carries them), `mcp/lib/plan-lint.mjs` (no change planned),
  `mcp/lib/design.mjs` (themeDesign: mode), `mcp/tools/generate_theme.mjs` (sayInPlan), `mcp/lib/approval-window.mjs`
  (the theme page's Mode row). Tests: the new suite `mcp/test-0.3.1-p3a.mjs` (checker).
- **Base:** `fix/0.3.1-p3a` from `origin/integration/0.3.1` (0d342773). Push only this branch.
- **Expected checks:** (written before the work) the new suite `p3a` about 14 checks, red first on 0d342773 (the two
  laptop cases written by create_report and checked by check_report: "can break" today; the same verdict in both;
  generate_theme with a full light palette and mode "dark": no line today). check 31 = 31, test-0.3.1-checker 23 = 23,
  validator-gap, look-options, approval-complete equal; mcp (test.mjs) equal (C1-C7 of v029checks keep their numbers;
  KINDS gains a fourth kind only if a check reads it, said per test); full run: the base's suites + 1 (p3a).
- **Resume:** step 2 (red first).

## Plan
1. This note (commit, push).
2. Red first: `test-0.3.1-p3a.mjs`. Reproduced on 0d342773 (a scratch script, the sample project as the laptop ran it):
   the default sample (EN, exec, filters top; AR, exec) gives no validator warning; the same plan with a Tahoma design
   gives 2 PBIR_TEXTBOX_HEIGHT_BELOW_FLOOR (20pt in a 46-high header box, the validator wants 48) and a 1280 x 720 page
   gives 8 (2 text boxes 32 high at 12pt, the validator wants 35; 6 dropdown slicers 59 high, it wants 76). In each,
   create_report's check: "0 problems Power BI Desktop would show"; check_report: "N findings can break the report".
3. (a) Where the rules come from: Microsoft's `@microsoft/powerbi-report-authoring-cli` 0.5.0 (`dist/index.js`,
   validateTextboxScrollbar and validateDropdownSlicerSizing), both `collector.warning` ("may be too small",
   "may be clipped ... verify in Desktop"); the slicer's real clip is a separate error, PBIR_SLICER_HEIGHT_BELOW_FLOOR,
   which our reports never get. The validator's floors: text box max(18, ceil(pt x 25/16)) + 16; slicer 28 + 32 + 16.
   Measured Desktop evidence in the repo says the floors are wrong for our cases (so the writer is not changed):
   DESKTOP-TESTS.md 2026-10-01 (Desktop 2.157, repeated byte for byte on 2.158.1177): 20pt whole from 44, a slicer
   needs 16 + 4 x pt (76 only at 15pt); round 11 item 7 (2.158.1177): the 46-high 20pt Arabic title whole, the 31-32
   high boxes and 56-high slicers whole at 1280 x 720 and 960 x 720; part 3 (2.159.883): every such report opened
   with no error. One case where the validator was right: at 640 x 360 a scroll thumb beside "Your logo" (a look,
   not a break).
4. (b) check_report: a fourth kind, `mayLook`: a validator warning whose code has measured Desktop evidence
   (DESKTOP_DRAWS: these two codes, with their sources) is "Microsoft's validator warns a part may not look as meant;
   Desktop was seen to draw it: check it in Desktop", never "can break". Any other validator warning or error keeps
   today's kind (an unknown visual type or a broken drillthrough are warnings too and can break a page).
5. (c) create_report's check: the plan's exact check (the same bytes, Microsoft's validator offline) counts its
   warnings by code; create_report's `check` carries them in the same kinds (`validator: { canBreak, mayLook }`) and
   its summary says them. A test writes each report and runs both: the same counts in each kind.
6. B-1: themeDesign: a mode asked and a palette whose own page decides otherwise: `repaired` gets
   { field: "mode", given, used, why }, sayInPlan says it ("mode \"dark\" was not used: the palette's own page
   #... is light; the palette's colours are kept as given..."), the approval page's Mode row says it. Colours are
   never changed (the person's palette wins; the owner's rule: a colour is never changed without the user's yes).
7. Area runs, lint, the full run, CI.

## Decisions I made
- The writer is not changed to meet the validator's floors: the repo's measured Desktop evidence (step 3) shows the
  floors are wrong for these cases, and the brief allows that only with that evidence, said here.
- Only the two measured codes move out of "can break"; Microsoft's severity alone does not decide, because some of its
  warnings (PBIR_VISUAL_TYPE_UNKNOWN, PBIR_DRILLTHROUGH_*) can stop a visual or page.
- B-1: say, not honour: the palette names the page, card and text colours exactly; turning them dark would change
  colours the person gave.
