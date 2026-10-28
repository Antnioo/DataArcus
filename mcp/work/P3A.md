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
- **Got:** p3a 21 (15 of 21 red on 0d34277 first; the other 6 are guards, green there by design: the three cases
  reproduce the laptop's warnings, the other kinds keep theirs, the colours kept, a mode that agrees said nothing) ->
  21 PASS. Every other suite: RESULTS_LINE.
- FULL_RUN_LINE
- **Resume:** done; CI on the branch (tests.yml), then the reviewer.

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

## Results
Before -> after (the laptop's cases, the sample project; check_report on the files create_report wrote):
- EN exec, filters top, Tahoma: check_report "2 findings can break the report" / create_report "0 problems" ->
  both: 0 can break, 2 "may not look as meant" (PBIR_TEXTBOX_HEIGHT_BELOW_FLOOR, the 20pt header title in 46).
- EN exec, filters top, 1280 x 720: "8 findings can break" / "0 problems" -> both: 0 can break, 8 may look (2 text
  boxes 32 high at 12pt, 6 dropdown slicers 59 high).
- AR exec, Tahoma: "2 can break" / "لا مشاكل" -> both: 0 can break, 2 may look (create_report's sentence in Arabic).
- The default sample (EN exec, filters top; AR exec): no validator warning before or after (the laptop's warnings
  came with a Tahoma design or a smaller page).
- generate_theme, full light palette, look auto, mode "dark": a light theme, mode dropped with no line -> the same
  light theme (the person's colours), `repaired` { field: "mode", given: "dark", used: "light", why }, sayInPlan
  "mode \"dark\" was not used: the palette's own page colour #... is light ...", `colours.modeAsked`, and the approval
  page's Mode row "light: the palette's own colours decide; \"dark\" was asked and not used"; the written file the same.

## What changed where
- `lib/check-report.mjs`: `DESKTOP_DRAWS` (the two codes, each with its measurement); `impactOf`: a validator
  warning with one of those codes is `mayLook`; `IMPACT.mayLook`, `kinds.mayLook.measured`, `counts.byImpact.mayLook`;
  `impactSummary` appends `mayLookLine`; `validatorVerdict(kinds, lang)` (EN and AR), one sentence for both tools.
- `lib/artifact.mjs`: the plan's validator findings counted by kind with `impactOf` (one copy) and by code
  (`checks.validator.kinds`, `byRule`).
- `tools/create_report.mjs`: the check carries `validator { ran, canBreak, mayLook, desktopOpens, byRule }` and its
  summary the verdict sentence; tellUser names the validator. `tools/plan_layout.mjs`: exactCheck's sayInPlan too.
- `lib/design.mjs` (themeDesign), `tools/generate_theme.mjs`, `lib/approval-window.mjs`: B-1.
- `mcp/CHANGELOG.md` two lines; `TOOLS.md`, `plans/CHECK-REPORT.md`: the fourth kind.

## CHANGELOG line
Two lines in `mcp/CHANGELOG.md` [Unreleased]: "One verdict on the same report", "A dark mode with a light palette is
said, not dropped".

## For the owner
- none (the writer keeps its measured heights; if he wants reports that also pass Microsoft's validator with no
  warning, that is a choice of his: the header box 48 high with Tahoma, slicers 76 high at 1280 x 720, measured first).

## Risky changes
- What an answer returns: check_report's `impact.kinds` and `counts.byImpact` gain `mayLook` (a fourth kind); two
  validator codes move there from `canBreak`, only as warnings, each with its measurement in the answer
  (`kinds.mayLook.measured`). Fewer "can break" lines: a validator error, the slicer's real clip
  (PBIR_SLICER_HEIGHT_BELOW_FLOOR) and every unmeasured warning stay `canBreak`. create_report's `check` and
  plan_layout's exactCheck gain the validator's counts (numbers and codes only, never a name or a value).
- No test loses a check; no security policy, approval step, file writing, network or process change.

## For the laptop
- Open the 1280 x 720 EN sample report (exec, filters top) and the Tahoma EN and AR ones at 100%: the header title and
  the three slicers whole, no scroll thumb (what `mayLook` says Desktop draws); 640 x 360 once (round 11 saw a thumb).
- generate_theme with a full light palette and mode "dark": the approval page's Mode row reads the line above.

## Seen, not in scope
- create_report's own measured-rule summary ("0 problems Power BI Desktop would show") and check_report's
  `dataarcusRule` count come from the same rules but are worded differently (problems vs worth a look); not changed.
- The theme approval page's row labels (Mode, Page, ...) stay English on an Arabic theme plan.

## Lessons for the reviewer
- The laptop's case did not reproduce on the default sample: the warnings come only with a Tahoma design or a page
  smaller than 1920 x 1080. A brief that names the design and page size saves a search.
- I started the full run before writing the CHANGELOG lines (CX1's notes put them in the file): stopped after one
  suite and restarted. "CHANGELOG lines in the file before the run" belongs in the builder rules' DONE line.
