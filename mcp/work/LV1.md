## Summary
- **Approval:** the reviewer's brief "LV1" (3 Nov, B-276 first half); D-1016-01, D-1102-02, D-1103-09.
- **Base:** `fix/0.3.2-lv1` from `origin/integration/0.3.2` at 4418828. Pushed only this branch. MCP only.
- **The cause (confirmed on the base):** `mcp/lib/twin-texts.mjs:82` arabicDax() splits the approved label on {n}
  and pushes each branch variable bare between the label's string pieces: «الأكثر ازدحامًا: اليوم:" & _d & "...»,
  no isolate, so a Latin value ("Thursday", "11:00 PM") is reordered against the Arabic around it.
- **Every place the twin joins an approved Arabic text with a model value (step 1, before any change):**
  1. `lib/twin-texts.mjs:82-86` arabicDax(): the only joiner. Its callers:
     `lib/twin-pages.mjs:623` (title measures, "Title AR: ..."), `lib/twin-pages.mjs:640` (measure texts, the
     bilingual report's "... AR" copy), `lib/twin-pages.mjs:642` (measure texts rewritten in the twin's copy).
  2. Read, not joined (no change): dynamic titles (`twin-pages.mjs:679` autos and `:685` subtitle measures write
     the approved label as a fixed text, or the English sentence of field NAMES, never a value); the row labels
     (`twin-pages.mjs:437`, assets/js/pbip-query.js rowLabelDax: SELECTEDVALUE or «الإجمالي», one or the other,
     never joined); a title measure of the model (never changed, listed as not translated); twin-visuals.mjs
     writes no text. The twin preview (`twin-preview.mjs`, assets/js/page-preview.js shownBy) draws only the
     plain branch of a "Top N" title ("IF ( _s = _n, "..." "), never a branch with a value.
- **The plan (step 2):** one helper in twin-texts.mjs, `isoValue()`, used by arabicDax for every branch whose label
  holds an Arabic letter: each value as `UNICHAR ( 8296 ) & <var> & UNICHAR ( 8297 )` (FSI value PDI), and
  `UNICHAR ( 8207 )` (RLM) first when the text begins with a value, last when it ends with one (ends(), text-
  measure.js:50). The label's string pieces stay byte for byte as approved. A label with no Arabic letter (an
  English fallback branch) and a branch with no value are written as before.
- **Why UNICHAR, not literal marks inside the strings:** the label's literals stay exactly the approved text (tests
  and the approval binding compare them), the DAX stays visible ASCII around the label (no invisible character in
  reportExtensions.json for a reader or a diff), the same form as the site's DAX (dax-functions.mjs DA.StoryTitle,
  pbip-query.js isoNum), and Microsoft's validator sees a plain DAX string either way (measured: check_report's
  validator 0 errors on the twin, rc24 T-1).
- **Expected checks (written first):** new suite `lv1` (area twin), about 12 checks: red on 4418828 (the isolate
  checks), green after. rc24 T-1's regex «أعلى " & _s & " من "» changes on purpose to the isolated form (one
  check, the same count). No other suite's line moves; hr1 10, hr2 7 green; English-only report and the English
  page of a bilingual report byte-identical (in lv1). dt1 is not on the base (DT1 runs): not run.
- **Answer size (L-1102-06):** the twin's plan answer holds no DAX; measured before and after in lv1.
- **State:** plan pushed. **Resume:** the red test.

## CHANGELOG line
(when done)

## Decisions I made
(when done)

## For the owner
(when done)

## Risky changes
(when done)

## Seen, not in scope
(when done)

## For the laptop
(when done)

## Lessons for the reviewer
(when done)
