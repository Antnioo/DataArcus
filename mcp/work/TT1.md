# TT1 (0.3.1): every generated title wholly one language

## Summary
- **Approval:** the reviewer's brief "Go on TT1"; the owner, 27 Oct, after seeing LR2's titles: "regarding the arabic
  word in title i want the whole title to be either arabic or english". This REPLACES his 26 Oct "«حسب» in both" (LR2).
- **The rule (the owner's, 27 Oct):** a title is ALL ARABIC when every name in it has an Arabic text (one the person
  approved: displayNames, the plan's pinned proposals, the twin's labels; or Arabic in the model): «إجمالي المبيعات حسب
  المنطقة». Otherwise ALL ENGLISH, even in an Arabic report: "Total Sales by Region", "Region ranked by Total Sales";
  never an Arabic word joining English names or the other way round, never a bracket unless two charts would share a
  title. An English title in an Arabic report is isolated as a whole (U+200F, then U+2068 ... U+2069).
- **Scope:** `assets/js/story-titles.js` (join, variants, alternate), `pbip-page.js` (the Top-N lead, the «التفاصيل»
  tail and the Top-N title measure follow the title's language), `text-measure.js` + `pbip-export.js` (isolateWhole,
  a title and its alt text), their `.min.js` and `?v=` stamps; `mcp/lib/report-run.mjs` (a count of an English column is
  "Count of X", never «عدد X»), `mcp/lib/dax-functions.mjs` (storyDax: the Arabic sentence only for an Arabic noun),
  `mcp/lib/twin-pages.mjs` (a title the twin leaves English is isolated whole), `mcp/tools/plan_layout.mjs` (the plan
  lists the titles that stay English and how to make them Arabic); the tests LR2 changed, moved to this rule; a new
  suite `mcp/test-0.3.1-tt1.mjs`; `mcp/CHANGELOG.md`; this note. Not R4A's files (approval-window.mjs, plans.mjs,
  label-limits.js, layout-check.js) nor GL2's (design-engine.js). byTitle (the gallery) keeps R2's rule.
- **Base:** `fix/0.3.1-tt1` from `origin/integration/0.3.1` (e2236be). Push only this branch; the reviewer merges.
- **Expected checks (written before the work):** tt1 new, about 25 checks, the engine and build checks red first on
  e2236be; arabic-titles 27 = 27, story-titles 94 = 94, sq15b 25 = 25, round22/v029i same counts, pbip.mjs 109 = 109
  (each moved check says "the owner's new rule, 27 Oct"); `report`, `arabic`, `core` the baseline's suites + tt1;
  golden 12 tasks match (golden-expected.json holds no title text; task 7's Arabic titles change, said);
  theme-generator 898 = 898; full run: the base's suites + 1, all PASS.
- **Resume:** plan pushed; next: tt1 red first, then the fix.

## Plan
1. **story-titles.js.** `join(m, c, by)`: in an Arabic report (an Arabic `by`) two Arabic names take «حسب», two English
   names take "by", a mixed pair gives the measure alone; an English report as before. `variants`: in an Arabic report
   each field is named in ONE language for both: Arabic when both have an Arabic text (the display name given, else the
   model's), else English (an English display name, else the model's English name, kept as the model has it, R2), else
   the measure alone in the language it has. `alternate`: the sentence in the names' language ("Region ranked by Total
   Sales"), none for a mixed pair.
2. **pbip-page.js.** «أعلى N:» / "Top N:", the Top-N title measure's words and the table's «: التفاصيل» / ": detail"
   follow the title's language, not the report's.
3. **Isolation.** `isolateWhole` (text-measure.js): a text with Latin letters and no Arabic gets U+200F U+2068 ... U+2069
   U+200F, the same marks isolateLatin puts at an end run. pbip-export.js isolateFiles (Arabic build) applies it to a
   visual's title text and alt text (page, phone, tooltip pages); the twin to a title or alt text it leaves English.
4. **report-run.mjs.** A model without measures: «عدد X» / «مجموع X» only for an Arabic column, else "Count of X" /
   "Sum of X" (the mixed «عدد Order Id» was a generated mixed name).
5. **dax-functions.mjs storyDax.** lang "ar" only when the noun is Arabic; else the English sentence. The leader is a
   data value: the plan says it may be the other language (the twin's "Not fully Arabic" line already lists the DAX
   titles).
6. **plan_layout.mjs.** An Arabic plan's `arabicNames.titlesInEnglish`: the exact build's titles that stay English, and
   how to make them Arabic (approve Arabic names for their fields, displayNames); the "why" text and sayInPlan follow.
7. Tests LR2 changed, back to this rule: arabic-titles AT-1a/b/c/e, story-titles ST-1i, test.mjs round22 e/h, v029i
   P3-2, sq15b T1-T6, pbip.mjs LR2-a1..a3.
8. tt1: engine (English, approved, half approved, Arabic model measure + English column), the site's Arabic download,
   create_report Arabic (English names; approved; half), the twin and the EN-AR copy: never a mixed title, an English
   one isolated whole.
