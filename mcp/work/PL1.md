## Summary
- **Approval:** the brief "PL1 (0.3.2)" (5 Nov), D-1105-15 (the owner, 5 Nov: "Go", E1 round 5 fixes). E1 round 5
  findings 6-7: the approval page's option labels read as jargon (3 episodes); two Arabic lines stiff.
- **Base:** `fix/0.3.2-pl1` from `origin/integration/0.3.2` at d0cabe5b (AP1 and PV2 in). Push only this branch.
- **Scope:** the words the approval page shows for options (`mcp/lib/approval-disclosure.mjs`, its Arabic
  `mcp/lib/approval-ar.mjs`). No plan, digest, gate or written file changes. AP1's Arabic (A-AP1-1) left as it is.
- **Plan (one commit each):**
  1. This note: every option label the page shows, as it reads today (below), and which carry code.
  2. Red first: A10 in `test-0.3.0-approval-complete.mjs` (in process, made-up plan data): no code word in an option
     label or value on the report page (EN and AR) or the redesign page.
  3. The fix, in the one place each text lives; sp23/sp44 re-recorded only after a dump of base and branch pages.
  4. The two Arabic lines: drafts in this note only (For the owner), no code change.
- **Expected checks:** approval-complete 45 -> 45 + A10's checks (red on the base); sp23 29 and sp44 23 the same
  numbers with the redesign and report pages' hashes re-recorded (Changed on purpose, below); every other suite's
  number as on the base; lint 0; agent-memory, check-modules --strict, check-result-lines, changelog-words,
  test-site-config green. CHANGELOG: one plain line.
- **Found:** code in labels: the card look's chart.look, 5 "More" rows by input key, a redesign's visual type and
  theme keys. Fixed: approval-complete 45 -> 54 (A10, red on the base: 9 failed); sp23/sp44 4 pages each, on purpose.
- **Local:** integration/0.3.2 did not move (d0cabe5b), no merge; build:min no change; `npm test -- --keep-going`: 210
  of 211 passed, glass-default R2 pinned the old card look line (fixed in eff34702, 43 of 43); lint 0; agent-memory,
  modules --strict, result-lines, contracts, changelog-words, test-site-config green.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/42029826587 on eff34702abde5039ed54daabe46747f3fcb60345
- **State:** DONE. **Resume:** the reviewer reads and merges; the owner's Arabic drafts (For the owner).

## Step 1: every option label the page shows today (base d0cabe5b)
Report page, "Look and options" (`LK`, approval-disclosure.mjs): Visual gallery, Theme file, Logo, Colours, Bar
colours, Chart axes, KPI values, Message when there is no data, Filters in a slide-in panel, Smooth lines, Slicer
style, Gridlines, Flip cards, Waterfall, right to left, Status icons, DAX function library, Shared axes (the user's
answers), Font, Right to left, Reading direction; then Card look, Data colours, The first data colour, made readable.
- Card look's value: "Glass look (default): ... ; plain: chart.look "auto"" (a CODE WORD: the engine's key).
- "More" section: each row by its raw input key: `pageFilters`, `text`, `subtitles`, `svgColumns`, `svgCards` (KEYS).
- Report, Layout, Fields, What each page holds (AP1), Thinner bars, Metric switcher, Flip cards, Status icons, DAX
  function library, Visual gallery sections: plain words (AP1's own rows: its draft A-AP1-1, untouched).
Twin page, "Options": Charts over time, Arabic calendar columns, Page on a picture "...", Pages drawn on a background
picture, Waterfall, right to left, Matrices written flat, Matrices: plain words, Arabic beside each.
Redesign page: Report (Original, New report, Method), Text set, Changes, Not changed, Kept as it is.
- Each visual's row: `Overview: btnDetails (actionButton at ...)`, `colRegion (clusteredColumnChart of ...)`,
  `tblProducts (tableEx of ...)`, `nav (pageNavigator ...)`, `title (textbox ...)`, `customGauge (custom <id> ...)`:
  Power BI's VISUAL TYPE KEYS (the visual's own name, btnDetails, is the person's and stays).
- A theme change's row: `Theme <file>: dataColors` / `foreground` / `background` / `tableAccent` / `good` /
  `neutral` / `bad`: the THEME FILE'S KEYS.
- "What each page holds" (AP1): a visual type VT_WORDS lacks (a page navigator) falls back to its key.
Theme, calendar, scripts, sample pages: plain words; their "All inputs, as given (raw)" fold is the raw plan on
purpose (code, left to right) and stays.

## Steps 2-3: what changed (before -> after)
- Red first: A10 in `test-0.3.0-approval-complete.mjs` on the base: `FAIL  approval-complete  54 checks, 9 failed`
  (A10-1..3 English and Arabic, A10-4..6 the redesign); with the fix `PASS  approval-complete  54 checks`.
- Card look (report page): "...; plain: chart.look "auto"" -> "...; plain cards: ask for the plain look".
  Arabic, DRAFT for the owner: «...؛ وللشكل العادي: «chart.look = auto»» -> «...؛ وللبطاقات العادية: اطلب الشكل العادي».
- "More" (report page), each row's name, before -> after, with its Arabic DRAFT for the owner:
  `pageFilters` -> "Page filters" «فلاتر الصفحات»; `text` -> "Sentence in the text box" «الجملة في مربع النص»;
  `subtitles` -> "Chart subtitles" «العناوين الفرعية للمخططات»; `svgColumns` -> "Small pictures in table rows"
  «صور صغيرة في صفوف الجدول»; `svgCards` -> "Small pictures beside KPI cards" «صور صغيرة بجانب بطاقات المؤشرات».
- Redesign rows (Text set, Changes, Not changed): the visual's kind from VT_WORDS (the one list, AP1's), e.g.
  "btnDetails (actionButton ...)" -> "btnDetails (button ...)"; clusteredColumnChart -> column chart, lineChart -> line
  chart, clusteredBarChart -> bar chart, tableEx -> table, pageNavigator -> page navigator, textbox -> text box,
  "custom <id>" -> "custom visual <id>". VT_WORDS gains slicer, advancedSlicerVisual, actionButton, pageNavigator,
  bookmarkNavigator (their Arabic, DRAFT for the owner: «مقسمات»، «أزرار»، «أدوات التنقل بين الصفحات»، «أدوات التنقل بين
  الإشارات المرجعية»; shown only on AP1's Arabic page list when a page holds a navigator).
- Redesign theme rows: "Theme <file>: dataColors / foreground / background / tableAccent / good / neutral / bad" ->
  "data colours / text colour / background colour / table accent colour / colour for good results / colour for neutral
  results / colour for bad results" (the redesign's page is English: its summary sets no Arabic).
- Changed on purpose: sp23 and sp44 (`fixtures/sp23-approval.json`, `sp44-approval.json`), 4 pages each, re-recorded
  with SP23_RECORD / SP44_RECORD after SP23_DUMP / SP44_DUMP of the base's and the branch's pages: report-en,
  report-ar, report-hostile: 1 line each (the card look); redesign: 18 lines (the visual rows' kinds); nothing else
  differs; every other entry (sp23 16 pages and prompts, the unit ones; sp44 the answers and life) unchanged; sp23 29
  and sp44 23 checks as on the base. The sp23 and sp44 dumps of each page are the same bytes.
- glass-default R2 (`test-0.3.1-glass-default.mjs:118`) pinned "chart.look "auto"" on the page: now the new words
  and no chart.look, 43 checks as before (found by the full run after the fix's commit).
- CHANGELOG [Unreleased]: one plain line. WORK.md: "PL1 (options in words)" (3,197 of 3,200 characters).

## Decisions I made
- A label is changed only where it shows code (a key, a type key, an engine option). Labels already in words stay,
  among them Flip cards, Status icons, DAX function library (Power BI's own word), Visual gallery, Shared axes:
  E1 round 5's transcripts are not in this clone, so I did not guess past what the code shows.
- The redesign's kinds come from VT_WORDS (the one list), not a second map (D-1104-12); a type it lacks shows as is.
- `lib/design.mjs`'s sayInPlan (what Claude reads, pinned by glass-default L1) keeps chart.look "auto": the agent
  needs the key; only the person's page changed.
- The "All inputs, as given (raw)" fold stays raw: it is the plan as given, on purpose (FX1).
- My first A10-4 flagged "(slicer" (the key and the word are the same): fixed in the test before the fix's commit.

## For the owner
- Approve or change the Arabic DRAFTs above (the card look, the 5 "More" rows, 4 visual kinds).
- E1 round 5 finding 7, two lines, DRAFT for you, not changed in code:
  1. «التقويم بلا تاريخ هجري» -> «التقويم لا يحتوي على تواريخ هجرية» (English: "the calendar has no Hijri dates").
  2. «وبدون السنة والشهر واليوم الهجري لا يقارن التقرير إلا الأشهر الميلادية» -> «ومن دون السنة الهجرية والشهر
     الهجري واليوم الهجري، لا يستطيع التقرير إلا مقارنة الأشهر الميلادية» (English: "and without the Hijri year, month
     and day, the report can only compare Gregorian months").

## Risky changes
none (words on the approval page only; nothing written, planned or gated changes).

## Seen, not in scope
- The Layout row shows "Filters: true" for filters "top" (a raw value; AP1's Seen too).
- The "More" rows' values are the raw JSON (val), e.g. pageFilters' [{ field, values }].
- Custom visuals replaced: "second option: ... key "<pick>"" names the input key to choose it; and a replacement's
  line carries the type key beside its words ("clustered column charts (clusteredColumnChart)", 0.2.9v pins it).

## Lessons for the reviewer
- To check the re-record: SP23_DUMP the base and the branch and diff by `<tr>`: 21 lines, each a label named above.
- A key that equals its plain word (slicer) is not jargon: a test of "no key" must leave those out.
