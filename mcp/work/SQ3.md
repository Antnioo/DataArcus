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
- **Resume:** plan pushed; next: the tests (red), then the fixes.

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
