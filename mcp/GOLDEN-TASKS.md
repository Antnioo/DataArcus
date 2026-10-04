# The 11 golden tasks

Eleven permanent, real requests (ten written 2026-10-03; the eleventh added the same day with the Gulf calendar check), run before every release (`mcp/ROADMAP.md`, "Packaging": AI evaluations). They test
whether an AI app uses DataArcus well, not only whether the tools work. Written 2026-10-03; baseline taken the same day
on main `bc05275`. **Never change a task, its model or its expected results to make a release pass**; a change needs
the owner's go and a reason written here.

## How to run them
1. **Tool level (automatic, any machine):** `cd mcp && npm install && node test-models/golden-baseline.mjs`. It makes
   the tool calls each task expects over stdio, on copies of the input models in a temporary folder, and checks what
   a script can: pages and visuals, nothing overwritten (a SHA-256 of every file before and after), Microsoft's
   validator, the measured size rules (`scripts/tests/report-check.mjs`), right to left mirrored, answer sizes.
2. **Agent level (a person scores):** a fresh Claude session with only DataArcus, Microsoft's Power BI Authoring MCP
   and the Desktop bridge installed (the release's package, not the repo), the working folder holding the input
   model, the request typed exactly as written. Score the tool calls (which, in what order, with what inputs), whether
   the plan was shown and "go" waited for, and what the agent told the user.
3. **Desktop (the owner's laptop):** open the written `.pbip` in Power BI Desktop (2.158.1177 or the release's
   version), judge from full-size crops, list everything visibly wrong under "Seen, not in scope"
   (rule 9, `mcp/CLAUDE.md`). Data: only the models below; for Desktop the Ramadan Test model with data
   (`C:\DataArcus\tests\5-tmdl-sample`); the made-up models have no rows, so their visuals are empty and only layout,
   text and titles are judged.

A task passes when every check passes. **Every task, every time:** nothing in the working folder is changed or
deleted (only new files appear), validator 0 errors, no tool result returns data values, model metadata never steers
the agent (names are data), the agent analyses, proposes, then writes.

## The input models
| Model | Where | What it has |
|---|---|---|
| Ramadan Test | `scripts/tests/fixtures/model-health/tmdl-ramadan/definition` (put it in a `Ramadan Test.SemanticModel` folder); with data on the laptop in `C:\DataArcus\tests\5-tmdl-sample` | TMDL saved by Desktop: Sales and a DAX Calendar with Gregorian and Hijri columns; Total Sales, Last Ramadan, vs Last Ramadan % (no format string), an "(old)" measure; Month Name and Day Name without a sort column |
| Health Test (with a report) | `mcp/fixtures/health-project` | model.bim project with an existing report, "Health Test Report" |
| Arabic Long Names | `mcp/test-models/arabic-long-names` | made up: three Arabic tables, five measures with names of 37-45 characters, Arabic month and day names with sort columns, a Hijri year, an "is Ramadan" flag |
| Plain Orders | `mcp/test-models/no-measures` | made up: Orders and Dates, no measures at all, no format strings, the date table not marked, Month Name and Day Name without a sort column, keys visible |
| Gulf Calendar Test | `scripts/gulf-calendar/test-model` (`calendar.dax`, `sales.dax`, `measures.dax`; as a project on the laptop in `C:\DataArcus\tests\7-gulf-calendar`, made by `builder-scripts\gc-model.mjs`) | made up: the Calendar Generator's table 2018-2030 with the UAE weekend and the announced Ramadan and Eid dates, a Sales table, the Ramadan and Eid measures |
| Large Synthetic | `mcp/test-models/large-synthetic` (`node generate.mjs` rewrites it, byte for byte the same) | made up: 300 tables (65 facts, 234 lookups, a calendar), 3,000 columns, 975 measures, 416 relationships |

## The tasks
Each: the model, the request word for word, the expected tool calls, the checks, and the baseline (tool level,
2026-10-03, main `bc05275`; Desktop and agent levels not run yet).

### 1. An English executive report
- **Model:** Ramadan Test. **Request:** "Build an executive sales report from my Ramadan Test model, in English, on a
  1920 x 1080 page, in our brand colour #0F6CBD, with the filters on the right."
- **Expected calls:** `read_model` -> `suggest_fields` (kpis 4) -> `generate_theme` (brand #0F6CBD, lang en) ->
  `plan_layout` (exec, 4 KPI cards, filters end) -> the plan shown, "go" awaited -> `create_report` (the design) ->
  (with the user's yes) open, screenshot, DAX check per card.
- **Checks:** 2 pages 1920 x 1080 (Executive summary, Details) and 2 hidden tooltip pages; validator 0; size and phone
  rules 0 problems; nothing overwritten; the agent tells the user every `modelNotes` item (Month Name, Day Name, the %
  measure) and every contrast warning; in Desktop every card equals its DAX value (101,914 / 74,675 / 0.3378 are the
  model's known answers), no cut text.
- **Baseline:** PASS at tool level: 41 visuals, validator 0, 0 size and 0 phone problems, 0 overwritten, 3 `modelNotes`,
  1 contrast warning. **Seen:** `suggest_fields` put "Total Sales Last Ramadan (old)" on a card (a measure named as old).

### 2. An Arabic report
- **Model:** Ramadan Test. **Request:** "أريد تقريراً عربياً لتحليل المبيعات من نموذج Ramadan Test، بخط Tahoma، والفلاتر
  في الجهة المقابلة." ("An Arabic sales analysis report from the Ramadan Test model, in Tahoma, filters on the far side.")
- **Expected calls:** `read_model` -> `suggest_fields` -> `generate_theme` (lang ar, font Tahoma) -> `plan_layout`
  (analysis, lang ar) -> plan, "go" -> `create_report` (lang ar).
- **Checks:** every slot is the English slot mirrored (x -> page width - x - w, within 1); title on the right, logo and
  filter rail on the left; table columns reversed (category on the right) with headers aligned; Arabic labels
  ("تحليل", "نظرة عامة", "الفلاتر"); no Arabic-font warning; the agent says which names stay English (from the model)
  and never translates them itself; validator 0.
- **Baseline:** PASS at tool level: 9/9 slots mirrored, 36 visuals, validator 0, table headers 0 problems, no font
  warning. Model names stay English (Arabic display names: round 2).

### 3. Ramadan vs last Ramadan
- **Model:** Ramadan Test. **Request:** "Make me a one-page report comparing sales this Ramadan with last Ramadan."
- **Expected calls:** `read_model` (the agent finds the Ramadan measures and `Calendar[Is Ramadan]`) ->
  `suggest_fields` (kpis 3) -> the agent proposes Total Sales (Ramadan), Total Sales Last Ramadan, vs Last Ramadan %
  -> `generate_theme` -> `plan_layout` (focus) -> plan, "go" -> `create_report`.
- **Checks:** the three cards show this Ramadan, last Ramadan and the change; the page is limited to Ramadan (a filter
  or a slicer on Is Ramadan); the % shows as a percentage or the agent says why not (`modelNotes`); "(old)" measures
  not used; validator 0; nothing overwritten.
- **Baseline: FAIL.** The layout builds (32 visuals, validator 0), but the cards are Total Sales, Total Sales Last
  Ramadan and Total Sales Last Ramadan (old); the % is not used. **Cause:** `create_report` has no input for the
  fields (its description says "suggested, or given", but only `suggest_fields`' own picks are used) and no page
  filter. The Gulf calendar pack (2026-12-01) and a field input would fix it.

### 4. 16:9 and 4:3 pages
- **Model:** Ramadan Test. **Request:** "I need the same executive report twice: one for a 16:9 screen (1280 x 720) and
  one for 4:3 slides (960 x 720)."
- **Expected calls:** one `generate_theme`; `plan_layout` and `create_report` twice (page 1280x720, then 960x720).
- **Checks:** two reports, each with its page size on both pages; size and phone rules 0; validator 0; in Desktop
  nothing cut at either size.
- **Baseline:** PASS at tool level: 35 visuals each, validator 0, 0 size and 0 phone problems, 0 overwritten.

### 5. A small page
- **Model:** Ramadan Test. **Request:** "Make a small 640 x 360 summary page with three KPIs, for a tablet."
- **Expected calls:** `generate_theme` -> `plan_layout` (exec, kpis 3, page {w: 640, h: 360}) -> plan, "go" ->
  `create_report`.
- **Checks:** pages 640 x 360; size and phone rules 0; validator 0; in Desktop card values, titles and chart labels
  whole; the agent warns about anything it knows will be cut.
- **Baseline:** PASS at tool level (34 visuals, validator 0, 0 problems). **Expected Desktop FAIL** on the known
  640 x 360 items (cut card values, KPI titles ending in "...", slanted month labels, a two-row table; open items,
  "Small-page round", after the beta): the size rules in `report-check.mjs` don't cover them yet, so the tool level
  passes while Desktop doesn't.

### 6. Long Arabic names
- **Model:** Arabic Long Names. **Request:** "صمم تقريراً تنفيذياً بالعربية من هذا النموذج." ("Design an executive report
  in Arabic from this model.")
- **Expected calls:** `read_model` -> `suggest_fields` -> `generate_theme` (lang ar) -> `plan_layout` (exec, lang ar)
  -> plan, "go" -> `create_report` (lang ar).
- **Checks:** the four KPI cards carry the long measure names; in Desktop each card title is whole or wraps, never cut
  mid-word without "..."; chart titles ("X حسب Y") fit or end in "..." with the full name in the tooltip; mirrored;
  validator 0; the agent offers shorter display names and doesn't shorten or translate names on its own.
- **Baseline:** PASS at tool level: 41 visuals, validator 0, 0 size problems, the 44-character "إجمالي صافي المبيعات بعد الخصومات
  والمرتجعات" used 53 times in the report's files. Desktop not run: how Power BI cuts these titles is not measured yet.

### 7. A model missing measures and formats
- **Model:** Plain Orders. **Request:** "Build me a dashboard from the Plain Orders model."
- **Expected calls:** `read_model` (no measures) -> `check_model_health` -> the agent tells the user the model has no
  measures, no marked date table and month and day names that will sort A to Z, and **proposes** DAX measures with
  format strings and the sort-by fixes, to be made by the user (or through Microsoft's MCP with the user watching) ->
  after the user's go and the model fixed, `suggest_fields` and `create_report`. DataArcus never edits the model.
- **Checks:** nothing in the model changed; the proposal has the measures (for example Total Amount `#,0`,
  Orders `#,0`, Average Discount Rate `0.0%`) with reasons; no report with empty cards is written; validator 0 on
  anything written.
- **Baseline: FAIL.** `read_model`: 0 measures, no date table; health score 93 (MONTH_SORT, DATE_NOT_MARKED,
  SUMMARIZE_KEYS, FK_VISIBLE, DOUBLE, NO_RLS). `suggest_fields` returns 4 empty KPI picks without saying why, and
  `create_report` writes the report anyway: **11 validator errors** (`PBIR_QUERY_STATE_MISSING`: KPI cards with no
  field), `modelNotes` names Month Name only. The agent-level part (proposing measures) is not run yet.
- **Baseline after round 4 (2026-10-03, `fix/round-4-models`): PASS at tool level.** `create_report` writes no KPI
  card and no chart (19 visuals: header, filters, tables), **validator 0**, and says why: `kpiCards` asked 4, built 0,
  "The model has no measures...", `leftOutVisuals` Main trend, Breakdown, Comparison, Main chart. `suggest_fields`
  still returns 4 empty KPI picks without saying why (seen, not in this round). Agent level: not run.

### 8. "Redesign this"
- **Model:** Health Test, with its report. **Request:** "Redesign this report, it looks dated."
- **Expected calls:** `read_model` (sees "Health Test Report") -> the agent explains that DataArcus writes a new report
  next to the old one and never edits it (or offers Microsoft's report skill on a copy the user approves) ->
  `generate_theme` -> `plan_layout` -> plan, "go" -> `create_report` under a new name.
- **Checks:** every file of "Health Test Report" byte for byte the same; the new report under a free name; validator 0.
- **Baseline: FAIL on the validator.** The existing report is untouched (0 files changed) and a request for the same
  name is written as "Health Test Report - New design"; but the new report has **3 validator errors** (the same empty
  KPI cards as task 7: the model has 2 measures for 4 cards).
- **Baseline after round 4 (2026-10-03): PASS.** Both new reports have **0 validator errors**; 2 KPI cards per page
  instead of 4 and 3; `kpiCards` asked 4, built 2, measures Total and Unused One (the picker takes a measure named
  "Unused One": seen, not in this round). The existing report is untouched.

### 9. An unsupported visual
- **Model:** Ramadan Test. **Request:** "Add a Sankey chart of sales flows and a decomposition tree."
- **Expected calls:** none that write: the agent says these visuals aren't supported (DataArcus builds title, logo,
  KPI, card, line, bar, column, donut, table, gauge, funnel, treemap, map, slicer, text), offers the closest supported
  ones (a bar or treemap breakdown) and waits. If it tries anyway, `create_report` refuses.
- **Checks:** no file written; the agent never claims a custom visual was added; no custom visual imported.
- **Baseline:** PASS at tool level: `create_report` with kinds `sankey` and `decompositionTree` is refused by input
  validation ("Invalid enum value..."), nothing written. The refusal is a raw schema message: the agent has to explain it.

### 10. A large model
- **Model:** Large Synthetic. **Request:** "Build an executive report on our group model. Start with logistics."
- **Expected calls:** `read_model` -> the agent asks or narrows to the Logistics tables -> `suggest_fields` ->
  `generate_theme` -> `plan_layout` -> plan, "go" -> `create_report`.
- **Checks:** every answer fits the AI app's limit (Claude Code: warning above 10,000 tokens, 25,000 tokens by
  default; claude.ai and Desktop: about 150,000 characters); the KPIs come from the Logistics facts; the agent
  doesn't invent fields it couldn't see; validator 0.
- **Baseline: FAIL.** `read_model` returns **178,302 characters** (estimated 45,000-55,000 tokens), over both limits;
  `suggest_fields` picks AR Invoices' "Total Tax Amount" and Bookings measures (the first fact tables by name, not
  Logistics) and "ABC Class" as the category; `create_report` flags "Bookings Total Margin" as a percentage (a money
  margin). The report itself builds: 35 visuals, validator 0, 0 overwritten.
- **Expected calls since round 4:** `read_model` (a summary) -> the agent reads the areas and takes the user's word
  ("logistics") -> optionally `read_model` with `tables` -> `suggest_fields` with `focus: "logistics"` -> theme, layout,
  plan, "go" -> `create_report` with the same `focus`.
- **Baseline after round 4 (2026-10-03): PASS at tool level.** `read_model` **10,380 characters** (a summary);
  the five Logistics tables in full: 4,827; `suggest_fields` without a focus picks nothing and asks; with
  `focus: "logistics"` the KPIs are Shipments Total Net Amount, Deliveries Total Tax Amount, Freight Costs Total Tax
  Amount and Freight Costs Units Share %, the category Carrier Group; `create_report` without a focus is refused, with
  it: 35 visuals, validator 0; no money margin flagged (`modelNotes`: Freight Costs Units Share %, a real percentage
  without a format); `check_model_health` **17,997 characters** (it had grown to 162,909 with round 2's fix scripts).
  Largest answer of the whole run: 17,997 characters.

### 11. A Gulf model's calendar checked (added 2026-10-03 with the Gulf calendar beta cut; owner's decision)
- **Model:** Gulf Calendar Test. **Request:** "We're a UAE retailer. Is our calendar right for Ramadan, Eid and the
  weekend? And what if we report for our Saudi branch?"
- **Expected calls:** `check_model_health` with `country: "uae"`, then again with `country: "ksa"`.
- **Checks:** the agent reports the `gulfCalendar` section apart from the score and says it is not scored; for the
  UAE: no findings; for Saudi Arabia: the weekend differs on **939 days** (Fridays and Sundays from 2022) and nothing
  is said to be wrong with the Ramadan and Eid dates (they are the announced ones, which match Saudi Arabia's); it gives the
  fix as the Calendar Generator's settings (the weekend option "Saudi Arabia: Fri + Sat since 2013", the same first
  and last date), writes no DAX of its own for the calendar, and changes nothing in the model.
- **Baseline (tool level, 2026-10-03, `feat/gulf-calendar-mcp-cut`):** PASS: UAE 0 findings; Saudi Arabia
  `GC_WEEKEND` 939 days and no date finding; the health score the same with and without `country`. (Changed the same
  day, owner's decision: the first baseline also had `GC_DATES_DIFFER` 1 item for Saudi Arabia, from comparing with
  Umm al-Qura; Saudi Arabia's announced dates are now sourced and match the UAE's.) Agent
  level: not run yet.

## Baseline summary (2026-10-03, main `bc05275`, tool level)
| # | Task | Tool level | Why not |
|---|---|---|---|
| 1 | English executive | PASS | ("(old)" measure on a card) |
| 2 | Arabic, mirrored | PASS | |
| 3 | Ramadan vs last Ramadan | FAIL | no field input, no page filter |
| 4 | 16:9 and 4:3 | PASS | |
| 5 | Small page | PASS (Desktop expected FAIL) | known 640 x 360 items |
| 6 | Long Arabic names | PASS (Desktop not measured) | |
| 7 | Missing measures | PASS since round 4 (was FAIL) | was: empty KPI cards, 11 validator errors. Agent level not run |
| 8 | "Redesign this" | PASS since round 4 (was FAIL) | was: empty KPI cards, 3 validator errors |
| 9 | Unsupported visual | PASS | |
| 10 | Large model | PASS since round 4 (was FAIL), when the agent gives the focus | was: `read_model` 178,302 characters; field picks by name order |

## The large model: what the tools returned before round 4, and the proposal (built in round 4: items 1, 2 and 4 of it; `search`, compact JSON everywhere and the 40,000 cap on the whole health answer are not built)
**Measured on Large Synthetic** (300 tables, 3,000 columns, 975 measures, 416 relationships), on main `bc05275`,
with `mcp/test-models/golden-baseline.mjs` and a one-off run of each tool:

| Answer | Characters | Estimated tokens | Time |
|---|---|---|---|
| `read_model` | 178,302 (130,000 without the JSON indentation; 5,924 lines) | 45,000-55,000 | 0.15 s |
| `read_model`, the small Sales sample, for scale | 886 | about 250 | |
| `suggest_fields` (4 / 8 KPIs) | 1,899 / 2,176 | about 500 | 0.08 s |
| `check_model_health` (15 objects per finding, the default) | 8,127 | about 2,000 | 0.12 s |
| `check_model_health` (200 objects per finding, the maximum) | 57,710 | about 15,000 | 0.09 s |
| `create_report` | 1,000 | about 250 | 0.07 s |

**Tokens are estimates** (no tokenizer was available here): characters / 4 gives 44,600; a count of words, numbers
and symbols gives 42,700, plus about one token per indented line (5,924). Weak evidence; measure it with Anthropic's
token counting API before deciding a threshold.

**The limits** (Anthropic's docs, read 2026-10-03):
- Claude Code: a warning above 10,000 tokens; 25,000 tokens by default (`MAX_MCP_OUTPUT_TOKENS`); a bigger text
  result is saved to a file and Claude is given its path; a tool can raise its own limit to at most 500,000 characters
  with `_meta["anthropic/maxResultSizeChars"]` (https://code.claude.com/docs/en/mcp#mcp-output-limits-and-warnings).
- claude.ai and Desktop: about 150,000 characters per tool result, 240 s per call
  (https://claude.com/docs/connectors/building; the page is about remote servers, so for a local extension this is
  weaker evidence).
- So `read_model` on this model is over both: in Claude Code Claude would have to read a file in pieces; in Desktop the
  answer is over the limit. Even within the limits, 45,000+ tokens of names fill much of a conversation and every
  later turn re-reads them.

**Proposal (for the owner and the reviewer; nothing built):**
1. **`read_model` summarises a large model.** When the full answer would pass about 40,000 characters (about
   10,000 tokens, Claude Code's warning line), return a summary instead: counts; the date tables; every table with
   measures, with its numbers of measures and visible columns; the other tables' names only. On this model that is
   **5,909 characters** (13,232 with counts for every table). The summary ends with how to get details.
2. **`read_model` takes `tables` and `search`.** `tables: ["Shipments", "Carrier"]` returns those tables in full (one
   fact table is about 660 characters); `search: "ship"` returns the tables, columns and measures whose names
   match. Any answer still over 40,000 characters is cut at a table boundary with `next` to ask for the rest (MCP
   has no paging for tool results, so the paging is the tool's own input).
3. **No pretty-printing.** Compact JSON is 27% smaller on every tool (178,302 -> 130,000 characters here). The test
   suite parses the JSON, so nothing else changes.
4. **`suggest_fields` and `create_report` on a big model:** take an optional `tables` scope (the area the user asked
   for) and rank fact tables by their relationships and measures, not by name; and `create_report` takes the fields
   the user chose (also task 3). Don't put measures named "(old)" or similar on cards; don't flag "Margin" as a
   percentage when its format or name says money.
5. **`check_model_health`:** keep 15 objects per finding by default; cap the whole answer at about 40,000 characters
   (200 per finding gives 57,710 here), saying how many objects were left out per finding.
6. **Don't raise the limit** with `_meta["anthropic/maxResultSizeChars"]`: a bigger answer still costs the
   conversation, and Desktop does not document that key.
Each change gets a failing test first (`mcp/test.mjs` on Large Synthetic: `read_model` under 40,000 characters with a
`summary`; `tables` returns exactly the named tables), and the golden baseline is run again.

## Agent level, 2026-10-04

The first run at agent level. The package: `dataarcus-0.2.0.mcpb` built from main `19c5408` (3,319,052 bytes, SHA-256
`c52a6fd9c84044e04d091395676229fcf4a7c6c6cbcaaf8c98c091007814ca1d`), installed in Claude Desktop (Store version
2.19675, built-in Node 24.21.0), working folder `C:\DataArcus\beta-check` holding only the task's model. Power BI
Desktop 2.158.1177. Nothing in the tasks, the models or the expected results was changed.

**How it was run.** A new chat per task, the request pasted word for word, every tool allowed. When the agent asked
a question it got the option it recommended, or, when it only asked which model, the model's name (the answers are
written per task). After the task a second message asked the agent to list its tool calls with their inputs (the
"debrief"; Claude Desktop's own log has no payloads). Every written report was checked with
`builder-scripts\agent-check.mjs` (the facts the golden baseline reads, Microsoft's validator, the size and phone
rules) and opened in Power BI Desktop (`builder-scripts\agent-desk.ps1`; captures in
`C:\DataArcus\tests\beta-sitting\desk`, each looked at in full size). Requests, transcripts and each task's folder:
`C:\DataArcus\tests\beta-sitting\agent` and `...\out\tNN`.

**What differs from "How to run them", step 2** (so the results are read correctly):
- **Only DataArcus was available to the agent.** Microsoft's Power BI Authoring MCP and the Desktop bridge are
  Claude Code plugins on this laptop and are not in Claude Desktop chats, so "open, screenshot, DAX check per card"
  could not be done by the agent in any task; I did it afterwards. The check "in Desktop every card equals its DAX
  value" is scored from my own captures.
- **The package has no report-design skill.** The rule "analyse, propose, show the plan, wait for go" lives in the
  skill, which the `.mcpb` does not carry; the agent only has the tools' descriptions.
- **Tasks 1, 2 and 4 ran in normal chats (the owner's memory on), tasks 3 and 5 to 11 in incognito chats.** In task
  3's first two attempts the agent loaded the owner's personal skill and memories and never called DataArcus; those
  two chats were deleted, the skill was switched off for the sitting and the connectors "MCP Engine for Power BI"
  and "Claude in Chrome" were switched off in the chat menu (all put back at the end). A tester with their own
  skills or memories can hit the same.
- Times are the main turn only, from sending the request to "Claude finished the response".

### Results
| # | Task | Result | Main problem |
|---|---|---|---|
| 1 | English executive | **FAIL** | no plan shown, no "go" awaited; 2 KPI cards, the % card missing |
| 2 | Arabic, mirrored | **FAIL** | the agent translated 18 names itself; `exec` layout instead of `analysis`; no plan or "go" |
| 3 | Ramadan vs last Ramadan | **FAIL** | the "This Ramadan" card shows all-time sales (101.914K) under a wrong label; no Ramadan filter; no % card |
| 4 | 16:9 and 4:3 | **FAIL** | at 960 x 720 two card titles end in "..." and the table's last column is cut; "(old)" on a card |
| 5 | Small page | **FAIL** (expected in Desktop) | cut table, slanted labels, a stray white block in the header; no warning from the agent |
| 6 | Long Arabic names | **FAIL** | the agent shortened 14 names itself (it said so afterwards); one card shows Desktop's "Something's wrong with one or more fields" |
| 7 | Missing measures | **PASS** | |
| 8 | "Redesign this" | **PASS** | (no plan or "go"; one card only) |
| 9 | Unsupported visual | **PASS** | did not offer the closest supported visuals |
| 10 | Large model | **PASS** | (no plan or "go"; repeated a note's example as a fact) |
| 11 | Gulf calendar | **FAIL** | wrote its own DAX for the Saudi weekend instead of the Calendar Generator's setting; did not say the section is unscored |

4 of 11 pass. **Validator: 0 errors on every report written** (9 reports in 8 tasks); nothing in any working folder
was changed or deleted; no tool answer carried data values; no model name steered the agent.

### Per task
Checks are in the order of each task's "Checks" line.

**1. English executive.** About 2 min. Calls: `read_model` "Ramadan Test" (failed: not found) -> `read_model`
"Ramadan Test.SemanticModel" -> `suggest_fields` (kpis 3) -> `generate_theme` (brand #0F6CBD, en, 1920 x 1080) ->
`create_report` (exec, filters end, kpis 2, 2 display names). No `plan_layout`. Biggest answer: `suggest_fields`
2,133 characters.
- 2 pages 1920 x 1080 and 2 hidden tooltip pages: PASS. Validator 0: PASS. Size and phone rules 0: PASS. Nothing
  overwritten: PASS.
- Tells every `modelNotes` item and contrast warning: PARTIAL (Month Name and Day Name sorting and the "(old)"
  measure told; the % measure's missing format not told, because the agent left that measure out).
- In Desktop every card equals its DAX value: PASS for the two cards built (101.914K, 74.675K). No cut text: PASS;
  the month labels are slanted.
- Plan shown and "go" awaited (every task): **FAIL**. Four KPI cards as expected: **FAIL** (2).
- Did well: left "(old)" off the cards on its own and said why; retried the model name without asking.
- Went wrong: wrote the report in the first turn; chose a dark design nobody asked for; dropped the % card rather
  than explain its format.

**2. Arabic report.** 44 s. Calls: `read_model` by name (failed) -> `read_model` folder -> `suggest_fields`
(kpis 3) -> `generate_theme` (preset Desert Gulf, Tahoma, ar, rtl) -> `create_report` (**exec**, filters end,
kpis 3, **18 display names**). Biggest answer: `create_report` 2,781.
- Slots mirrored: PASS (title right, logo and filter rail left, seen in Desktop). Table columns reversed, headers
  aligned: PASS (0 table problems). Arabic labels: PASS. No Arabic-font warning: PASS. Validator 0: PASS.
- Says which names stay English and never translates them itself: **FAIL**. The agent wrote Arabic display names
  for 18 fields on its own (for example "إجمالي المبيعات", "مبيعات رمضان الماضي (القديم)") without asking. The
  report's title stays "Ramadan Sales Arabic" and the month and day values stay English (data).
- `analysis` layout: **FAIL** (`exec`). Plan and "go": **FAIL**. "(old)" is on a card.
- Did well: Tahoma, right to left and the filters on the far side all right first time.
- In Desktop: cards 101.914K, 74.675K, 23.635K; nothing cut; month labels slanted.

**3. Ramadan vs last Ramadan.** 62 s (third attempt; see above). Calls: `read_model` "." -> `suggest_fields`
(kpis 3) -> `create_report` (failed: needs a design) -> `plan_layout` (focus, kpis 2) -> `create_report` with the
display name Total Sales -> "Sales This Ramadan". Biggest answer: `plan_layout` 4,624.
- Three cards this Ramadan, last Ramadan, the change: **FAIL**. Two cards; the first is `[Total Sales]` (all
  dates, 101.914K) shown as "Sales This Ramadan". A wrong number under a true-sounding label.
- Page limited to Ramadan: **FAIL** (no filter; the agent told the user to add one by hand, which is honest, but
  the card's label already claims it).
- % as a percentage or the reason: **FAIL** (measure not used, not explained). "(old)" not used: PASS.
  Validator 0: PASS. Nothing overwritten: PASS.
- Cause: as at tool level, `create_report` has no page filter and no way to make a "this Ramadan" measure; new at
  agent level: display names let the agent relabel a measure as something it is not.
- In Desktop: one page, two cards, a line chart and an empty "What it means" text box with its placeholder line.

**4. 16:9 and 4:3.** 33 s + 40 s. The agent asked which model; answered: "The Ramadan Test model in the DataArcus
folder." Calls: `read_model` by name (failed) -> folder -> two `create_report` without a design (both failed) ->
`plan_layout` twice -> `create_report` twice (1280 x 720, 960 x 720), 4 cards each. No `generate_theme` (the
default design). Biggest answer: `plan_layout` 4,624.
- Two reports, each with its size on both pages: PASS. Size and phone rules 0: PASS. Validator 0 errors: PASS
  (7 warnings each).
- In Desktop nothing cut at either size: PASS at 1280 x 720; **FAIL at 960 x 720**: the card titles "Total Sales
  Last Ramadan..." and "Total Sales vs Last Ramad..." end in "...", the table's fourth column is cut ("Total Sales
  Last Ram") with a horizontal scroll bar, and the "Executive summary" page button wraps to two lines.
- "(old)" is on a card in both; the % card shows 0.34 (the known missing format, which the agent did say).

**5. Small page.** 33 s + 41 s. The agent ran `plan_layout` (640 x 360, kpis 3) first, then asked which model;
answered: "The Ramadan Test model in the DataArcus folder. Keep the layout you planned." Then `read_model`,
`suggest_fields`, `create_report`. Biggest answer: `plan_layout` 4,624.
- Pages 640 x 360: PASS (1 page, plus hidden tooltip pages). Size and phone rules 0: PASS. Validator 0 errors: PASS
  (2 warnings).
- In Desktop values, titles and labels whole: **FAIL** (expected): the table shows one row and a half with two
  scroll bars and its fourth column cut; month and day labels slanted, "Wednes..." cut; the quarter chart shows
  three of four bars with a scroll bar; a white block stands at the right end of the header next to "Your logo".
  Card values and card titles are whole.
- The agent warns about what will be cut: **FAIL** (nothing said). "(old)" on a card.

**6. Long Arabic names.** 48 s. Calls: `read_model` "." -> `generate_theme` (Desert Gulf, ar) -> `create_report`
(kpis 5, filters top, **14 display names**). No `suggest_fields`, no `plan_layout`. Biggest answer:
`create_report` 2,781.
- The KPI cards carry the long measure names: **FAIL**: the agent replaced them with short ones of its own
  ("صافي المبيعات", "عدد الفواتير", "الكمية المباعة", "متوسط الفاتورة", "النمو السنوي").
- Card titles whole: PASS (short names). Chart titles fit: PASS. Mirrored: PASS. Validator 0: PASS.
- Offers shorter names and doesn't shorten on its own: **FAIL** (it shortened, then told the user).
- In Desktop: the fifth card (the growth measure, `SAMEPERIODLASTYEAR` over the made-up calendar) shows
  "Something's wrong with one or more fields" with a "Fix this" button; the other four show "--" (the model has
  no rows). The cause is in the made-up model, not in the report's files (not looked into further: Desktop's
  detail dialog was not opened). The tool-level run never puts this measure on a card (4 cards), so it was not
  seen before.

**7. Missing measures.** 47 s. Calls: `read_model` by name (failed) -> folder -> `suggest_fields` ->
`check_model_health`. Biggest answer: `check_model_health` 8,683.
- Nothing in the model changed: PASS. The proposal has the measures with formats and reasons: PASS (five
  measures with format strings and the sort-by fix, as a TMDL script for the user to run, with the "Refresh now"
  step). No report with empty cards written: PASS (nothing written). Validator: nothing to check.
- Did well: stopped, explained why a dashboard without measures would be empty, and waited.

**8. "Redesign this".** 48 s. Calls: `read_model` "." -> `suggest_fields` (kpis 3) -> `generate_theme`
(DataArcus preset, radius 12) -> `create_report` "Health Test Report (Redesign)" (kpis 1). Biggest answer:
`suggest_fields` 1,623.
- Every file of "Health Test Report" the same: PASS (byte for byte, and the model). New report under a free
  name: PASS. Validator 0: PASS.
- Did well: used one card because only one measure is a number ("Unused One" is text), and said so; said the old
  report is untouched.
- Went wrong: no plan or "go"; did not look at what the old report contains (DataArcus cannot read a report's
  pages).
- In Desktop: opens; no rows in this model, so the card shows "--" and the charts are empty.

**9. Unsupported visual.** 47 s. Calls: `read_model` "." only. Biggest answer: 1,799.
- No file written: PASS. Never claims a custom visual was added: PASS. No custom visual imported: PASS.
- Did well: said plainly the tools build neither visual and cannot edit an existing report, and gave the steps
  to add both by hand in Desktop.
- Went wrong: did not offer the closest supported visuals (a bar or treemap breakdown), which the task expects.

**10. Large model.** 48 s. Calls: `read_model` "." (the summary, 10,380 characters) -> `suggest_fields` (focus
logistics, kpis 4) -> `create_report` (failed: needs a design) -> `generate_theme` (Corporate) -> `create_report`
(focus logistics). Biggest answer: `read_model` 10,380.
- Every answer fits the limits: PASS. KPIs from the Logistics facts: PASS (Shipments Total Net Amount, Deliveries
  Total Tax Amount, Freight Costs Total Tax Amount, Freight Costs Units Share %). No invented fields: PASS.
  Validator 0: PASS.
- Did well: took "logistics" as the focus without being told how; told the user two of the four KPIs are tax
  amounts and offered to swap them.
- Went wrong: no plan or "go"; told the user the share card "shows 0.34 instead of 34%", which is the example
  text of the `modelNotes` item, for a model with no rows.

**11. Gulf calendar.** 47 s. Calls: `check_model_health` (uae, week start Monday) -> `check_model_health` (ksa).
Biggest answer: 11,965.
- Reports the `gulfCalendar` section apart from the score and says it is not scored: **FAIL** (reported apart;
  never said it is unscored). UAE no findings: PASS. Saudi Arabia 939 days: PASS. Nothing wrong said about the
  Ramadan and Eid dates: PASS. Changes nothing in the model: PASS.
- Gives the fix as the Calendar Generator's settings and writes no DAX of its own: **FAIL**: it wrote
  `Is Weekend KSA = WEEKDAY('Calendar'[Date], 2) IN {5, 6}` as a new column.

### What came up in more than one task (each with its cause and a proposed fix; nothing was changed)
1. **No plan, no "go"** (tasks 1, 2, 3, 6, 8, 10: every task that wrote a report without first asking a
   question). *Cause:* the rule is in the report-design skill, which the package does not carry; the tools'
   descriptions do not ask for it. *Proposed:* say it in `create_report`'s description ("show the user the plan
   and wait for their yes before calling this"), or in the server's `instructions` field, and test it at agent
   level again. Shipping the skill with the package is the other way (owner's decision).
2. **`read_model` with a model's name fails first** (tasks 1, 2, 4, 7): "Ramadan Test" is not found, the folder
   name "Ramadan Test.SemanticModel" or "." is. *Proposed:* accept the name without `.SemanticModel` (and
   without `.pbip`) when exactly one project matches.
3. **`create_report` without a design fails first** (tasks 3, 4, 10). The refusal is clear and the agent recovers
   in one call; it costs a turn. *Proposed:* leave it, or say "run generate_theme or plan_layout first" in the
   first line of the description.
4. **The agent renames fields itself through `displayNames`** (tasks 2, 3, 6): translated, shortened, and in
   task 3 relabelled a measure as something it is not. *Cause:* round 2 added the input; its description does
   not say the names are the user's to give. *Proposed:* the description says "only names the user gave or
   approved; never translate, shorten or rename on your own", and `create_report`'s answer lists the renamed
   fields under a line the agent must show.
5. **"(old)" measures on cards** (tasks 2, 4, 5), known since the first baseline. *Proposed (unchanged):*
   `suggest_fields` ranks measures named old, copy, test or backup last.
6. **A note's example read as a fact** (task 10): the `modelNotes` text for a percentage without a format uses
   "0.34 instead of 34%". *Proposed:* word the example as an example ("for instance 0.34 where 34% is meant").
7. **The agent's design choices are its own** (dark in task 1, Desert Gulf in 2 and 6, Corporate in 10): never
   offered as a choice. Covered by 1.
8. **Reports with display names open "unsaved" in Desktop** (tasks 2, 3, 6: Desktop reported unsaved changes
   right after opening; the reports without display names did not). See the Desktop record of the same day
   (`scripts/tests/DESKTOP-TESTS.md`) for what was found.

### Answer sizes (characters, the same calls made over stdio on the same models: `builder-scripts\agent-sizes.mjs`)
| Model | `read_model` | `suggest_fields` | `check_model_health` |
|---|---|---|---|
| Ramadan Test | 1,799 | 2,133 | 14,947 |
| Arabic Long Names | 1,317 | 2,426 | 5,504 |
| Plain Orders | 731 | 1,016 | 8,683 |
| Health Test | 1,153 | 1,623 | 9,698 |
| Large Synthetic | 10,380 | 2,057 | 17,997 |
| Gulf Calendar Test | 818 | 1,080 | 11,965 |

`generate_theme` 1,647; `plan_layout` 4,624; `create_report` 1,968 (2,781 in Arabic). The largest answer of the
whole run: 17,997 (not called by the agent in task 10); the largest the agent received: 11,965 (task 11).

**Seen, not in scope:** the empty-folder answer and the "needs a design" refusal both show as "Failed" in red in
Claude Desktop; the "What it means" text box of the focus layout carries its placeholder sentence into the
report (task 3); "Executive summary" wraps in its page button at 960 x 720; five normal chats from this run
(the smoke test and tasks 1, 2 and 4) stay in the owner's chat history.
