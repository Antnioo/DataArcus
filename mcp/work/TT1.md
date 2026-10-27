# TT1 (0.3.1): every generated title wholly one language; an Arabic report's titles Arabic

## Summary
- **Approval:** the reviewer's brief "Go on TT1"; the owner, 27 Oct: "i want the whole title to be either arabic or
  english" (REPLACES his 26 Oct «حسب» between English names, LR2); then, relayed by the reviewer the same morning: "Also
  in arabic if title is english then translate it don't keep english titles in arabic reports"; and the reviewer's note:
  marks only from the shared rule (text-measure.js), so BD2's V3 reaches titles.
- **The rule:** an Arabic report's titles are Arabic («إجمالي المبيعات حسب المنطقة»): a field with no Arabic name yet is
  listed in the plan (titlesInEnglish.fields, proposeYourself) for a draft the person approves; nothing is translated
  unapproved. Until approved, or for a field the person keeps English on purpose (displayNames: its model name), the
  title is WHOLLY English ("Total Sales by Region", "Region ranked by Total Sales", "Top 6: …", ": detail"), isolated as
  one run by text-measure.js isolateWhole; never an Arabic word between English names or the reverse, never a bracket
  unless two charts would share a title. English reports unchanged.
- **Scope:** where it is written: `story-titles.js` join/variants/alternate, `pbip-page.js` (leads and tails), `text-measure.js`
  isolateWhole + `pbip-export.js` isolateFiles, `twin-pages.mjs`, `report-run.mjs` (counts), `dax-functions.mjs`
  storyDax, `plan_layout.mjs` (titlesInEnglish, the plan's texts).
- **Base:** `fix/0.3.1-tt1` from `origin/integration/0.3.1` (e2236be). Not R4A's or GL2's files.
- **Expected checks:** (written before the work) tt1 new, about 25, red first; arabic-titles 27, story-titles 94, sq15b
  25, pbip 109, round22/v029i the same counts, each moved check saying "the owner's new rule, 27 Oct"; report, arabic,
  core: the baseline's suites + tt1; golden 12 match (titles said); theme-generator = base; full run: base + 1 suite.
- **Got:** tt1 24 (22 red first on e2236be) then 28 with the refinement; arabic-titles 27 = 27, story-titles 94 = 94,
  sq15b 25 = 25, pbip 109 = 109, mcp 1591 = 1591, golden 12 match (4 titles changed); full run: 99 suites passed.
- **Resume:** done; integration/0.3.1 (88ee4df, BD2's V3) merged in, below; waits for the reviewer.

## Plan (written first, f4c836e; the refinement added steps 9-10)
1. story-titles.js: in an Arabic report both fields named in Arabic when both have an Arabic text (given or the model's),
   else both in English (half approved is English), else the measure alone; join: «حسب» only between Arabic names, "by"
   between English names; alternate in the names' language.
2. pbip-page.js: «أعلى»/"Top", the Top-N title measure's words and «التفاصيل»/"detail" follow the title's language.
3. isolateWhole (text-measure.js) on an English title and alt text of an Arabic build (pbip-export.js), the twin's and
   the EN-AR copy's titles left English (twin-pages.mjs), the Top-N title measure (pbip-page.js, through the same function).
4. report-run.mjs: "Count of X"/"Sum of X" for an English column, «عدد X» only for an Arabic one.
5. dax-functions.mjs storyDax: the Arabic sentence only for an Arabic noun; the plan says each story title's language.
6. plan_layout.mjs: titlesInEnglish (from the exact build). 7. The checks LR2 changed, moved. 8. tt1.
9. (refinement) titlesInEnglish.fields: the fields to draft; sayFirst, sayInPlan, the why: draft, approve, plan again.
10. (reviewer) no hand-written marks: pbip-page.js takes them from isolateWhole.

## Results
Commits: plan f4c836e, red first 5670708, the fix 1dfd868, the moved checks 2b2ed22, v029i + CHANGELOG 35a8d22, the
refinement 043be5d, the note e451ff4, the sweeps 9164ec0, this line (next).

| Before (e2236be) | After |
|---|---|
| «Total Sales حسب Region», «ترتيب Region حسب Total Sales» (Arabic download and MCP, English names) | "Total Sales by Region", "Region ranked by Total Sales", each U+200F U+2068 … U+2069 U+200F |
| half approved: «إجمالي المبيعات حسب Region» | "Total Sales by Region" (the plan asks a draft for Region) |
| «أعلى 6: Total Sales …», «Total Sales حسب Region: التفاصيل» | "Top 6: Total Sales …", "Total Sales by Region: detail", whole |
| «عدد Order Id حسب Region» (no measures) | "Count of Order Id by Region" |
| DA.StoryTitle "ar" for an English noun | "en" (the English sentence); "ar" for an Arabic noun |
| twin: an untranslated title raw | isolated whole; EN-AR copy the same |
| plan: "titles keep it alone" / «أعلى 6» "mixes" | titlesInEnglish { titles, fields, how }: draft, approve, plan again |

Tests (red -> green): tt1 E1-E9, S1-S5, R1-R11, D1, T1-T2 (22 of the first 24 red on e2236be; R8 and R11 red there too).
Moved to the new rule, same counts, each comment "changed 27 Oct 2026, 0.3.1 TT1": arabic-titles AT-1a/b/c/e and its
stray-word check (an Arabic text still holds no English word), story-titles ST-1i, sq15b T1-T3/T6, pbip.mjs LR2-a1/a3,
round22 e/h, v029i P3-2 (back to its round-14 condition, stricter than LR2's), test-0.2.9-sweep A2, test-0.2.9w A3-11,
test.mjs's KPI title sweep, test-0.3.0-twin T6 (the navigator's English title isolated whole), twin-complete TC-3g
(a kept name's title isolated whole), arabic-sweep F3/F5 (titlesInEnglish and a kept column's "Count of" count as listed).

Golden (12 tasks match golden-expected.json; it holds no title text), titles diffed base -> branch, task 2 (Arabic,
"Golden Arabic"): bar and line «إجمالي المبيعات حسب Month Short» -> "Total Sales by Month Short" (isolated whole; Month
Short has no Arabic name); the two cards "Total Sales vs Last Ramadan %" isolated whole. No other title changed.

Suites (baseline on e2236be -> after): report 33 -> 33 suites; arabic 12 -> 13 (+ tt1); core 6 -> 6 (mcp 1591 = 1591);
theme-generator 910 -> 910; pbip 109 -> 109; lint 0 problems; check-min, test-site-config, ar-pages, csp,
sitemap-lastmod, check-result-lines, changelog-words, check-agent-memory PASS.
Full run `npm test -- --keep-going` on 9164ec0: "run-tests: 99 suites passed" (the base's 98 + tt1; mutation 73 killed).
The first full run on 043be5d had 2 of 99 red (twin-complete TC-3g, arabic-sweep F3/F5: English runs of whole English
titles the plan did not list); fixed in 9164ec0 (the plan lists a Top-N title's lead form too; the checks moved).

## Merged with integration/0.3.1 (88ee4df: BD2, GL2, CS2, R4A), 27 Oct, the reviewer's ask
Both rules hold. **BD2's V3 is the shared rule** (each Latin run isolated, the whole Arabic text wrapped in U+2067 ...
U+2069); `isolateWhole` is that rule with the whole English title as its one run (`wrap(ends(FSI + title + PDI))`:
U+2067 U+200F U+2068 title U+2069 U+200F U+2069), in text-measure.js beside isolateLatin; every title, alt text, twin
title and Top-N title measure takes its marks from it, none spelled out in code. pbip-export.js keeps BD2's DAX
part/wrap and TT1's whole-title pass (an English Top-N text carries isolateWhole's marks in its first and last literal,
so BD2's run-time wrap does not wrap it twice). **The one-language rule** is unchanged: Arabic titles, drafted and
approved; a kept English name makes that whole title English; never mixed.
Tests both touched, each saying both rules: test-0.2.9w A3-11 (BD2's U+2067 allowed; a title or alt text isolated whole
allowed), sq15b T2 (U+2067 first, then U+200F and the isolate), pbip.mjs LR2-a3 (an English title one run inside BD2's
wrap), bd2 K/D (its Arabic build shows approved Arabic names, one with a Latin run, «إجمالي مبيعات KPI»: the mixed text
TT1 still writes, each V3; English names would now give English titles and no mixed text). tt1 E9, round22 e/h and
test.mjs's KPI sweep compare with isolateWhole instead of spelled-out marks. ?v= `20261027tt2` (text-measure,
story-titles, pbip-page, pbip-export in the builder list; theme-generator.min.js on its three pages); build:min,
ar-pages --write, csp --write; tests.json keeps tt1 and cs2.
Touched suites on the merge: bd2 33, sq15b 25, arabic-titles 27, twin-complete 24, cs2 29, tt1 28, test.mjs shards
33 + 584 + 634 + 339; lint 0 problems. On 53c04d1 (the merge and bd2's fixture): theme-generator 910, pbip 109; full
run `npm test -- --keep-going`: "run-tests: 103 suites passed" (mutation 74 killed).

## CHANGELOG line
- **Arabic reports get Arabic titles, never half Arabic, half English:** in an Arabic report every chart title is Arabic («إجمالي المبيعات حسب المنطقة»). A field with no Arabic name yet is listed in the plan for an Arabic name to be drafted and approved before anything is written; nothing is translated without your approval. A title stays English only for a field you keep in English on purpose, and then the whole title is English ("Total Sales by Region"), shown as one run in the Arabic page (U+200F and isolates); never an Arabic word between English names, never the column in brackets. This holds in the MCP's reports, the Arabic twin and the EN-AR copy (a title you leave untranslated stays wholly English); the website's Arabic download, which has no step to approve names, writes the English title whole. A report on a model without measures says "Count of Order Id", not «عدد Order Id», and the DAX library's story title is an Arabic sentence only for a measure with an Arabic name (its leader is a value from your data, shown as it is).

## Decisions I made
1. **No hard block (proposed, not done).** The MCP never translates by itself (B-88: the fixed list, else the assistant
   drafts), so "the plan drafts" = the fixed list's names pinned (as before) + titlesInEnglish.fields / proposeYourself
   for the assistant. Withholding the plan id until every title field is drafted would change golden task 2 and most
   Arabic suites and needs the owner's go; today the plan says it first and the titles are wholly English until approved.
2. **The website's Arabic download** has no name-approval step: English names give wholly English titles, isolated. An
   approval step on the site would be a new feature (Seen 1).
3. **English names kept as the model has them** in an Arabic report's English title ("Sales PY by Region", R2's rule; no
   "last year" words), so a card and a chart of one report say the same name.
4. **A mixed pair with no English text** (an Arabic model measure, an English column with no Arabic name): the measure
   alone, one language.
5. **isolateWhole** in text-measure.js beside isolateLatin, built on its ends() (the marks isolateLatin puts at an end
   run); twin-pages.mjs and pbip-page.js call it, never marks of their own (the reviewer's note on BD2).
6. **Alt texts:** a title's alt text follows its title; the other alt texts of the checked builds hold no mixed text
   (checked on an Arabic build of an English-named model, none).
7. The public pages: no page or article says titles join English names with «حسب» (the Arabic-readiness article speaks
   of a mixed title in general and the twin's isolates: true, unchanged).

## For the laptop (Power BI Desktop, the batched run)
1. MCP, Arabic, a made-up model with English names: plan_layout, draft the names it lists (titlesInEnglish.fields),
   approve, create_report: every title wholly Arabic, read right to left; no English word in any title.
2. The same with one field kept English (displayNames: its model name): its titles wholly English, one run (no swapped
   words, no boxes where the marks are), alignment as the other titles; "Top 6: …" in the tooltip.
3. The website's Arabic download on English names: "Total Sales by Region", "Region ranked by Total Sales" whole, read as
   one run in the right-aligned title; the English download unchanged.
4. The twin of an English report with the chart titles left untranslated: each wholly English, one run.

## Seen, not in scope
1. The website's Arabic download cannot ask for Arabic names (no approval step): its titles on English names stay wholly
   English (Decision 2).
2. A gallery page whose charts share a title gets "Sales PY per Quarter (Quarter)" (the alternate and the bracket both):
   the same in English reports; the bracket repeats the column already said.
3. The gallery's joins (pbip-query.js byTitle, "and", "per") keep R2's rule (the measure alone for a mixed or English pair
   in an Arabic report): one language, as the brief says; not "by".
4. test.mjs line 4578's comment still says "test-round22.mjs keeps the brackets' case" (comment only, LR2's Seen 2).
5. Golden task 2's "Month Short" has no draft in the fixed list: its two charts are now English until a name is given.
