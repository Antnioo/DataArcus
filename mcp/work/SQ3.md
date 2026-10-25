## Summary
- **Approval:** the owner, 25 Oct (the 0.3.1 night run): every "Seen, not in scope" item fixed, carefully. Batch SQ3 of
  [SEEN-QUEUE.md](SEEN-QUEUE.md#sq3-the-approval-page-in-english-and-arabic-and-the-gate): T1-S6, T1-S8, T1-S9,
  T1-S13, D6-S3, A2-S9, V1-S3, A3-S1.
- **Scope:** `mcp/lib/approval-window.mjs`, `mcp/tools/create_arabic_twin.mjs`, `mcp/lib/plain-words.mjs` (the Arabic
  "where" and "never applied" words, beside the English), the `writesAr` line of the Arabic plans (`plan_layout.mjs`
  report and sample, `add_gulf_calendar.mjs`, `sample-project.mjs`); new suite `mcp/test-0.3.1-sq3.mjs`; four mutants in
  `mcp/test-0.3.1-mutation.mjs`. `plans.mjs` and the gate: not changed (A3-S1 is fixed already). Not SQ1's files.
  SEEN-QUEUE.md: my eight Status cells only.
- **Base:** `fix/0.3.1-sq3` from `origin/integration/0.3.1` (0095622).
- **Expected checks:** new `sq3` about 23; mutation +4 mutants (+4 checks), all killed; every other suite unchanged.
  **Measured:** sq3 28 (22 red on 0095622); mutation MUTLINE; safety and twin unchanged.
- **Resume:** fixes pushed (a6130f7); the full run, DA_SHARD=1/4 and the mutation numbers go in "Tests" next.

## Each item, confirmed on 0095622
- **T1-S6** true: an Arabic page lists `plan.writes` as given, English (`approval-window.mjs` askPage; the twin's line
  `create_arabic_twin.mjs:61-63`, plan_layout's report line, add_gulf_calendar's, the sample's).
- **T1-S8** true: the twin's plan with no labels says "(3 pages mirrored, 0 Arabic texts as approved)".
- **T1-S9** true: `headingOf` gives «تظهر بالإنجليزية · Shown in English (21, no Arabic text)»: the count and its words
  only in English; Flip cards, Status icons, Waterfalls, Metric switcher, Visual gallery headings not Arabic at all.
- **T1-S13** true: the twin's Options rows (labels and values) English, with (see "About the script") in English quotes.
- **D6-S3** true: `groupFiles(['X.Report/StaticResources/SharedResources/BaseThemes/CY24SU10.json'])` → Report settings.
- **A2-S9** true: `promptSummary` never names `exact.notChecked`.
- **V1-S3** true: every figure is drawn with `previews.lang` ('ar'), the copy's English pages too.
- **A3-S1** NOT true today (probe on health-project, lang ar, a fixed-list name pinned: create_report with the same
  approved displayNames writes): `writeApproved` and `reportRun` merge the pinned names under the given ones before the
  gate (`Object.assign({}, pn, a.displayNames)`, since the night audit #92). OBSOLETE; a regression check added (the
  same names write; another value for a pinned name is still refused).

## Plan (tests first: each red on 0095622, then the fix at its cause)
1. **T1-S6** each Arabic plan carries `data.writesAr`, one Arabic line per `writes` line, made by the tool from the
   same facts; the Arabic page shows the Arabic line and the English line under it (the English stays the plan's
   words); a `writesAr` that does not match `writes` line for line is ignored (English only: fails safe). Escaped as
   every other text («...» isolated). An English page is unchanged.
2. **T1-S8** with no label: "no Arabic text approved yet: every text stays as it is" (and the Arabic line).
3. **T1-S9** headingOf: the Arabic half takes the count with its words in Arabic where the words are known (no Arabic
   text / name; functions, measures); the missing headings get their Arabic. A bare count stays as today.
4. **T1-S13** the twin's Options rows in Arabic with the English beside («انظر «عن السكربت»»).
5. **D6-S3** one theme pattern (RegisteredResources, SharedResources/BaseThemes) for the groups, the redesign's
   copied theme and kindsLine's count.
6. **A2-S9** promptSummary: "Not checked before writing: <check> (<why>)" after the compatibility line, within the cap.
7. **V1-S3** a pair's English page drawn with lang "en", its Arabic page with the plan's.
8. **A3-S1** OBSOLETE in the queue; the regression check.
Mutants: writesAr's line-for-line guard, writesAr's escaping, the prompt's notChecked line, the pair's English lang.

## Expected (before any run)
- `node test-0.3.1-sq3.mjs`: FAIL on 0095622 on every check but A3-S1's two; PASS after (about 23 checks).
- `npm test -- safety`, `npm test -- twin`: PASS, counts unchanged. Mutation: 4 more mutants, all killed.
- `npm test -- --keep-going`, `DA_SHARD=1/4 npm test`, `node scripts/check-agent-memory.mjs`: PASS.

## Results (25 Oct)
Commits: 08de75a the plan; a6130f7 the fixes, the suite and the mutants; then this note and the queue's Status cells.

| Item | Before (0095622) | After | Test |
|---|---|---|---|
| T1-S6 | an Arabic page listed every write in English | each write in Arabic (the tool's `writesAr`, line for line), the plan's English line under it; twin, EN-AR copy, Arabic report, both calendar plans, the sample; a mismatched `writesAr` is not shown; escaped | sq3 T1-S6a-k |
| T1-S8 | "(3 pages mirrored, 0 Arabic texts as approved)" | "no Arabic text approved yet: every text stays as it is" (and «لم يُوافق بعد على أي نص عربي») | sq3 T1-S8a-c |
| T1-S9 | «تظهر بالإنجليزية · Shown in English (21, no Arabic text)»; Flip cards, Status icons, Waterfalls, Metric switcher, Visual gallery, Custom visuals replaced English only | «تظهر بالإنجليزية (21، دون نص عربي) · ...», «مكتبة دوال DAX (الدوال: 2، المقاييس: 1) · ...»; those headings Arabic · English | sq3 T1-S9a-c |
| T1-S13 | the twin's Options rows English, (see "About the script") | each row Arabic · English, «انظر «عن السكربت»» | sq3 T1-S13a-b |
| D6-S3 | SharedResources/BaseThemes/*.json under "Report settings" | under Theme, counted as a theme (groups, kindsLine, the redesign's copied theme: one pattern) | sq3 D6-S3a-c |
| A2-S9 | the app's prompt never named an unchecked part | "Not checked before writing: Microsoft's validator (not run: why)." after the compatibility line, at most 150 characters, the prompt within its 600 | sq3 A2-S9a-b |
| V1-S3 | «معاينة» on the copy's English pages | a pair's English page drawn with lang "en" ("preview"), its Arabic page as before | sq3 V1-S3a-b |
| A3-S1 | OBSOLETE: already fixed (the pinned names merged under the given ones before the gate) | unchanged | sq3 A3-S1a-b (regression) |

### Tests (before -> after)
- `node test-0.3.1-sq3.mjs`: FAIL 22 of 28 -> PASS 28 (registered in tests.json, area safety).
- `npm test -- safety`: 13 suites PASS -> 14 (the 13 with the same counts, + sq3 28).
- `npm test -- twin`: 7 suites PASS, counts unchanged (twin-complete 24, language-toggle 27, en-ar-copy 27,
  twin-preview 23, twin-artifact 21, mirror-parity 58, bilingual-report 32).
- Mutation: 165 checks, 63 mutants -> MUTLINE. New: A-writesAr-match, A-writesAr-esc,
  A-prompt-notChecked, A-pair-lang, each killed by sq3.
- FULLLINE
- `node scripts/check-agent-memory.mjs`: PASS.

## CHANGELOG line
- The approval page in Arabic says what each plan writes in Arabic (the English line under it), the Arabic twin's
  options and counted headings in Arabic, and a plan with no approved Arabic text says so; the app's own approval
  prompt names any check not run before writing; Power BI's base theme is listed as a theme.

## Decisions I made
- `writesAr` is display only: the plan's English `writes` stay what the assistant is told and what approve_plan
  answers; the Arabic page shows both (Arabic first, the English line under it, smaller). A `writesAr` not one line
  per write is ignored as a whole (English only), never half shown: it fails safe.
- The report's Arabic line is built beside the English one in `plan_layout.mjs` from the same values (a new line after
  the English writes, one key added to the plan's data); a native copy's page (customVisualsFrom) stays English.
- `whereSaid(dir, base, ar)`: one function, the Arabic form from the same folder facts (no parsing of the English).
- T1-S9: only a count with words gets Arabic words (a known list); a bare count stays in the English half, as before.
- T1-S6's "row texts" (the report page's row labels and values) are not translated here: the queue's fix for T1-S6 is
  the writes line; the twin's Options rows are T1-S13 (done). Listed under Seen.
- A3-S1: confirmed false, so OBSOLETE; kept two checks so it stays fixed (the gate still refuses another name).
- `plans.mjs` and the gate are unchanged: no check was loosened.

## For the laptop (what the approval page looks like; a person judges)
1. create_arabic_twin (separate and into "same") on a made-up report: «الملفات التي ستُكتب»: each line Arabic, the
   English line under it in grey; the names in «» read in order; the Options rows «... · ...».
2. plan_layout lang "ar": the report line in Arabic (with the calendar script), «تظهر بالإنجليزية (N، دون اسم عربي)».
3. The EN-AR copy's preview: "preview" on each English page, «معاينة» on each Arabic page.
4. add_gulf_calendar lang "ar" (arabicColumnsOnly too) and plan_layout sample lang "ar": the Arabic writes line.

## Seen, not in scope
- The report page's own rows (Name, Title, Layout, Look and options...) stay English on an Arabic report's page (T1-S6's
  rows part: a bigger change, every tool's row words; the queue's fix was the writes line).
- A quoted name «...» isolated left to right (`<bdi>`) shows its guillemets in left-to-right order inside Arabic
  lines (as every Arabic row since T2); worth the owner's look on the laptop.
- `add_gulf_calendar.mjs` (SQ7) and `plan_layout.mjs` (SQ10) are edited here too, on their propose lines: a merge
  with those batches may meet these lines.
