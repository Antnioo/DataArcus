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
- **State:** step 1.
- **Resume:** step 2.

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
