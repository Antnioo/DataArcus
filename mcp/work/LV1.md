## Summary
- **Approval:** the reviewer's brief "LV1" (3 Nov, B-276 first half); D-1016-01, D-1102-02, D-1103-09.
- **Base:** `fix/0.3.2-lv1` from `origin/integration/0.3.2` at 4418828. Pushed only this branch. MCP only.
- **Scope:** `lib/twin-texts.mjs` arabicDax() and its new helper isoValues(); no other lib file (twin-pages.mjs not
  edited); rc24's one regex; sp3's R5 hashes and its check L1; the new suite lv1. Not the labels' words, the approval binding, model values in English.
- **The cause (confirmed red on the base):** arabicDax() split the approved label on {n} and pushed each branch
  variable bare between the label's string pieces: «اليوم:" & _d & " الساعة:" & _h», no isolate.
- **Every place the twin joins an approved Arabic text with a model value (step 1, listed before any change):**
  1. `lib/twin-texts.mjs:82` arabicDax(), the only joiner, called at `lib/twin-pages.mjs:623` (title measures,
     "Title AR: ..."), `:640` (measure texts, the EN-AR copy's "... AR") and `:642` (measure texts in the twin).
  2. Read, not joined: dynamic titles (`twin-pages.mjs:679`, `:685`: a fixed approved text, or the English sentence
     of field names, never a value); row labels (`twin-pages.mjs:437`, pbip-query.js rowLabelDax: SELECTEDVALUE or
     «الإجمالي», one or the other); a model's title measure (never changed); twin-visuals.mjs writes no text; the
     preview (twin-preview.mjs, page-preview.js shownBy) draws only a "Top N" title's plain branch, never a value.
- **The change:** in a label with an Arabic letter, each value as `UNICHAR ( 8296 ) & <var> & UNICHAR ( 8297 )`
  (FSI value PDI) and `UNICHAR ( 8207 )` (RLM) first when the text begins with a value, last when it ends with one
  (text-measure.js ends()). The label's string pieces byte for byte as approved. A label with no Arabic letter
  (an English fallback branch), a branch with no value and the empty text: written exactly as before.
- **Why UNICHAR, not the marks inside the strings:** the label's literals stay exactly the approved text; no
  invisible character in reportExtensions.json; the site's own DAX form (dax-functions.mjs DA.StoryTitle,
  pbip-query.js isoNum); Microsoft's validator: 0 errors on a twin with it (rc24 T-1, check_report).
- **Expected checks:** (written first) lv1 red on 4418828, green after; rc24 T-1's regex changes on purpose (same
  count); no other suite's line moves; hr1 10, hr2 7. dt1 is not on the base (DT1 runs): not run.
  **Got:** lv1 red on 4418828, 11 of 18 (the 7 isolate checks), 18 green after. One line I did not expect: sp3's R5
  (the bilingual report: its Arabic title measures are this job's), 10 -> 11 checks (see Results).
- **Answer size (L-1102-06):** the twin's plan answer holds no DAX: 31,360 on the base, 31,316-31,397 over four
  runs after (the spread is the run's random ids); fx1 three times: see Results.
- **State: DONE.** CI green: https://github.com/Antnioo/DataArcus/actions/runs/41698862581 on 3d1c53a5 (after the merge of e3f01231).
- **Resume:** none; the reviewer's merge.

## Results
- Commits: 0174eb75 (the plan), 2d0f436 (the red test, in `ignored`), 5564abf (the code, lv1 in `suites`,
  rc24, CHANGELOG, WORK.md), then sp3's R5 (this note's commit). origin/integration/0.3.2 did not move (4418828): no merge.
- Areas (base -> after): twin 32 -> 33 suites passed (lv1 18 checks; bilingual-report 33, fx1 22); arabic 15 passed
  (tt1 28); report 56: rc24 28 and hr1 10, hr2 7 green; glass-tables failed only as this clone was shallow
  (`git show cba24a5`), after `git fetch --unshallow` 113 checks PASS (as HR2 found); sp3 failed R5, see next.
- sp3 R5 (changed on purpose, each one said): the bilingual report's `reportExtensions.json` differs (its "Title AR"
  measures now isolate _s and _n), and so the plan's and the answer's `digest` of the files. Measured: with the base's
  twin-texts.mjs, sp3 passes; the diff of the two runs' answers is the digest alone, of the files one file. R5's three
  recorded sha256 (plan, report, files) set by hand to the new values (not SP3_RECORD), and a new check L1: that file,
  LV1's isolates taken out, hashes to the base's recorded e3986dff...: 11 checks PASS.
- fx1 three times: 22 checks each. The twin's plan answer: 31,360 -> 31,316 / 31,330 / 31,363 / 31,397 (noise).
- Lint: exit 0 (after the repo root's `npm ci`).
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/41685926766 on b26b0bde (the first attempt: macOS
  shard 4 cancelled with no FAIL line; `gh run rerun --failed` once: green).
- **After the merge (the reviewer's follow-up, 3 Nov 18:55):** the one conflict, `fixtures/sp3-answers.json` R5,
  re-measured on the merged tree, never one side: with integration's twin-texts.mjs (e3f01231) sp3's R5 matches DT1's
  recorded values (plan 24,008 characters); with mine, the plan and the answer differ only in the files' `digest`
  (equal with it masked), and the files only in `SP3 both.Report/definition/reportExtensions.json`, which, LV1's
  isolates taken out, is the base's e3986dff... (L1; DT1 did not change that file). R5 now holds both: plan 24,008
  afe21a41..., report 9,010 ab368695..., files 204 9bba676c... (the answer and the files as on LV1's branch, the plan's
  length DT1's). WORK.md: integration's line (DT1, HM1-HM2, Running: ED1, LV1) with LV1's note named.
  On 3d1c53a5: lv1 18, sp3 11, sp1 11, dt1 7, hm1 16, hm2 15, hr1 10, hr2 7, bilingual-report 33, fx1 22 checks PASS;
  lint 0. CI green: https://github.com/Antnioo/DataArcus/actions/runs/41698862581 on 3d1c53a5 (first attempt).

## CHANGELOG line
"An Arabic label beside a value reads in order: in the Arabic twin, a card or title that joins your approved Arabic
words with a value of the model (a day, an hour, a count) keeps each value in its place, so "Thursday" or "11:00 PM"
no longer swaps with the Arabic around it; your words are written exactly as you approved them."

## Decisions I made
- UNICHAR in the DAX rather than literal marks in the strings (why above).
- Every value is isolated, digits too (rc24's "Top {1} of {2}" counts): the twin cannot know at write time what a
  value will hold (a day name, "11:00 PM", "1,234"), and an isolate around a number reads the same.
- RLM at both ends (ends()), not only the start the brief names: a text that ends with a Latin value («الساعة:11:00 PM»)
  is the BD1 case at the other end.
- Only labels with an Arabic letter: an English fallback branch (a branch the person did not label) stays byte for
  byte, so an English page of the EN-AR copy and every English measure are unchanged.
- The ER fixture is the shape the twin reads, `VAR _d = [..] VAR _h = [..] RETURN "Busiest: Day: " & _d & ...`; the
  brief's direct form `"..." & [Day] & ...` is listed as not translated on the base and still is (V4): reading it would
  change what the twin translates (not this job).

## For the owner
1. A label piece that ends at ":" with no space before a value («اليوم:{1}») is written as approved. With the isolate
   the value no longer touches the wrong word, but it still sits against the colon. My recommendation: the approval
   page suggests «اليوم: {1}» (a space after a colon before {n}), never changing it on its own.
2. Not done: the whole Arabic text wrapped in U+2067 ... U+2069 (BD2's V3, which drew a cut card's "..." at the right
   end). The brief names FSI/PDI and RLM; a card text this long is cut in a narrow card. Recommendation: the laptop
   run below first; if a cut card shows "..." at the wrong end, a follow-up adds the wrap.

## Risky changes
none (one function's output, for Arabic labels with a value only; every other text byte for byte).

## Seen, not in scope
- An approved label's own Latin runs («أعلى {1} من {2}: KPI») are not isolated by arabicDax (the label's words).
- The model values in English on Arabic pages (B-276's second half): the owner's, later.

## For the laptop
The ER report's twin: the "Busiest" card (the card whose measure is "Busiest AR" in the EN-AR copy, "Busiest" in the
twin) must read «الأكثر ازدحامًا: اليوم:Thursday الساعة:11:00 PM» right to left with "Thursday" and "11:00 PM" each
after its own label; the "Top N" chart titles «أعلى 6 من 10: ...» with 6 and 10 in place; a cut card's "..." end.

## Lessons for the reviewer
- The ER card's text was a measure text (textMeasuresOf), not a title: both go through arabicDax, one fix.
- A characterisation suite (sp3) records the bilingual report's files: a change to the twin's Arabic DAX moves it.
  I updated only R5's three hashes by hand and proved with L1 that the one changed file is the base's but for LV1.
- `npm run lint` needs the repo root's `npm ci` too, not only mcp's (it failed with a missing module before).
