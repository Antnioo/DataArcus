# The 10 golden tasks

Ten permanent, real requests, run before every release (`mcp/ROADMAP.md`, "Packaging": AI evaluations). They test
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

### 8. "Redesign this"
- **Model:** Health Test, with its report. **Request:** "Redesign this report, it looks dated."
- **Expected calls:** `read_model` (sees "Health Test Report") -> the agent explains that DataArcus writes a new report
  next to the old one and never edits it (or offers Microsoft's report skill on a copy the user approves) ->
  `generate_theme` -> `plan_layout` -> plan, "go" -> `create_report` under a new name.
- **Checks:** every file of "Health Test Report" byte for byte the same; the new report under a free name; validator 0.
- **Baseline: FAIL on the validator.** The existing report is untouched (0 files changed) and a request for the same
  name is written as "Health Test Report - New design"; but the new report has **3 validator errors** (the same empty
  KPI cards as task 7: the model has 2 measures for 4 cards).

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

## Baseline summary (2026-10-03, main `bc05275`, tool level)
| # | Task | Tool level | Why not |
|---|---|---|---|
| 1 | English executive | PASS | ("(old)" measure on a card) |
| 2 | Arabic, mirrored | PASS | |
| 3 | Ramadan vs last Ramadan | FAIL | no field input, no page filter |
| 4 | 16:9 and 4:3 | PASS | |
| 5 | Small page | PASS (Desktop expected FAIL) | known 640 x 360 items |
| 6 | Long Arabic names | PASS (Desktop not measured) | |
| 7 | Missing measures | FAIL | empty KPI cards, 11 validator errors |
| 8 | "Redesign this" | FAIL | empty KPI cards, 3 validator errors |
| 9 | Unsupported visual | PASS | |
| 10 | Large model | FAIL | `read_model` 178,302 characters; field picks by name order |

## The large model: what the tools return, and a proposal (no MCP code changed)
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
