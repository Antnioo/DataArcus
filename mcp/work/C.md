# C (0.3.1, wave 3): time to first value, the sample project

Builder, 25 Oct. Branch `feat/0.3.1-sample-project` from `origin/integration/0.3.1` 11df69b (everything through X2 and E
merged). Push only this branch; no merge, no PR (the reviewer reviews and merges into the integration branch).

The ask: a new user who has installed DataArcus and has no model asks "show me what DataArcus can do" (or "try the
sample"). One request gives them a made-up Gulf retail project in their working folder, written only after the usual
approval, and then a guided first tour of 4 real DataArcus calls on it.

## The shape: an option of plan_layout and create_report, not a 12th tool (decided; why)
`plan_layout` with `sample: true` proposes a plan of its own kind (`sample`, allowing create_report); after approve_plan,
`create_report` with `sample: true`, `path` (the folder the plan named) and the planId writes it. This is the shape
`redesignFrom` already has (a plan_layout mode with its own plan kind, written by create_report with the same inputs), so:
- rule 1 of the instructions stays true as written ("create_report's comes from plan_layout"), and the gate is not
  changed: the plan pins the folder as its "model" key (the folder's path, no print: nothing is there yet) and
  `{ sample, path, lang }` as create_report's inputs;
- "11 tools" stays true where it is said today (mcp/README.md 3 times, PRODUCT_SPEC.md, mcp/CLAUDE.md, the home page and
  the MCP page in English and Arabic, the beta page's translations, and 4 tests: test.mjs, test-round22 X-03,
  test-0.3.0-claims W2-3, scripts/test-whats-new). A 12th tool would make each of them untrue until changed, several in
  W's website files, and the skill's tool list (K1's folder) would have to change too;
- create_report already writes PBIP projects next to a model; the sample is one more project it writes.
Rejected: a new `create_sample_project` tool (the cascade above), an option of read_model (read-only, READS annotation),
an option of generate_theme (a theme file, not a project).

## What the sample holds (made up; no real company, mall, person or vehicle trade)
Folder `Gulf Retail Sample` in the working folder (a second sample: `Gulf Retail Sample 2`, then 3...; DataArcus never
writes over anything: a folder taken between the plan and the write refuses the write). Inside, 16 files (9 model, 6 report, 1 project file; first counted 18 by mistake, corrected before any run):
- `Gulf Retail.pbip` (opens the empty report);
- `Gulf Retail.SemanticModel/`: `.platform`, `definition.pbism`, `definition/database.tmdl`, `model.tmdl`,
  `relationships.tmdl`, `tables/Sales.tmdl`, `Branches.tmdl`, `Products.tmdl`, `Calendar.tmdl` (TMDL, as Desktop saves);
- `Gulf Retail.Report/` (empty: one blank page, no visuals): `.platform`, `definition.pbir`, `definition/version.json`,
  `report.json`, `pages/pages.json`, `pages/<id>/page.json`.
Tables, every one an import partition of typed rows (`#table(type table [...], {...})`, the labs' way: Desktop shows data
after one Refresh; X2's demo model reused and widened):
- `Sales` 648 rows: 18 months (January 2025 to June 2026) x 6 branches x 6 products a month (rotating through the 12),
  columns Date, Branch, Product, Channel (Store, Online), Amount (AED), Units, Orders; measures Total Sales ("AED" #,0),
  Order Count, Units Sold, Average Basket;
- `Branches` 6 rows: Branch, City, Country (Dubai, Abu Dhabi, Sharjah, Riyadh, Doha, Muscat), each branch a made-up
  place name;
- `Products` 12 rows: Product, Category (Grocery, Home, Fashion, Beauty, Electronics), generic product words, no brand;
- `Calendar` 546 rows (every day 2025-01-01 to 2026-06-30): Date (key), Year, Quarter, Month Number, Month Name (sorted
  by Month Number), Year Month (sorted by Year Month Key), Year Month Key; marked as the date table (`dataCategory: Time`).
- 3 relationships: Sales[Date] -> Calendar[Date], Sales[Branch] -> Branches[Branch], Sales[Product] -> Products[Product].
The rows are written into the files only: no answer holds a row, a branch or a product name (the MCP never returns data
values); the answers name tables, columns, measures and row counts.

## The flow
1. `plan_layout { sample: true, lang }` (lang "ar" when the request is Arabic): writes nothing; answers `sample` (the
   folder, the tables with their row counts, the date table, what is made up) and a plan whose writes name the folder
   and whose `outputs` list all 16 files. Any model input with it (path, planFields, design, pages, redesignFrom,
   customVisualsFrom...) is a plan problem.
2. approve_plan: the approval page "Sample project (made-up data)": what it holds, the files grouped (Model (TMDL),
   Empty report, Project file), the overwrite sentence; no preview (the report is empty: said), no "About the script"
   (the model's .tmdl files are the model itself, not a script the person applies: the page's script detection learns
   that a .tmdl inside a `.SemanticModel` folder is a model file, one fix in approval-window.mjs).
3. `create_report { sample: true, path: "<folder>", lang, planId }`: writes the 16 files (one writeTree into the working
   folder, `lib/sample-project.mjs` `writeSample`), then answers `open` (the .pbip), "open it in Power BI Desktop 2.159
   or later and click Refresh", and `tour`.
4. The tour (in the answer after the write; Arabic when lang "ar"): 4 steps, each `{ ask, call: { tool, args } }`:
   1. a first report: plan_layout `{ path: <model>, layout: "exec", name: "Gulf Retail Sales", planFields }` (then
      approve_plan and create_report);
   2. the same report in English and Arabic: plan_layout with `languages: "en+ar"`;
   3. the Gulf calendar for its dates: add_gulf_calendar `{ path: <model>, firstYear: 2025, lastYear: 2026 }` (a script
      the user applies; no relateTo, since the sample's Calendar already holds Sales[Date]'s relationship);
   4. "is it ready for Arabic?": check_report `{ path: "Gulf Retail Sample/Gulf Retail Sales.pbip", lens: "arabic" }`.
5. Where the agent learns of it: the server's instructions are at 2,195 of 2,200 characters, and the shortest line that
   says it ("9. No model? Offer the sample: plan_layout sample true.", 55) needs room that only rewording approved rules
   would make. So it goes in plan_layout's description (one sentence), the `sample` input's own text, and the answer a
   tool gives on an empty working folder (the first thing a new user meets: "No project yet? DataArcus can write a
   made-up sample to try: plan_layout with sample true."). The instructions are not changed.
6. mcp/README.md: one line under the tools table (the option), and "Try the sample" as the first thing after installing.
   The beta task list is in the private engine repo: its line is written under "For the reviewer".

## Files touched
New: `mcp/lib/sample-project.mjs` (the files, the answer, the tour), `mcp/test-0.3.1-sample-project.mjs`, this file.
Changed: `mcp/server.mjs` (the input, plan_layout's and create_report's sample branches), `mcp/lib/approval-window.mjs`
(the sample's page; model .tmdl files are not scripts), `mcp/lib/model.mjs` (the empty-folder notice's sentence),
`mcp/test-0.3.1-write-gate.mjs` (the new write listed with why: a deliberate change of that suite's list),
`mcp/package.json` (the suite in npm test), `mcp/README.md`, `mcp/CHANGELOG.md`, `mcp/WORK.md`. Not touched: the website
(W), the skills/plugin folders (K1), `assets/js` (no engine change: no build:min).

## Tests first: `mcp/test-0.3.1-sample-project.mjs` (in npm test, one result line), expected numbers
Checks (written before any run; on 11df69b every one red except where said):
- C1 the plan: `plan_layout { sample: true }` answers a planId and `sample` (4 tables, 648/6/12/546 rows, 3
  relationships, the Calendar marked), writes nothing (the working folder's files the same).
- C2 the plan lists the 16 files (`outputs`), its writes name the folder; no answer holds a branch, a product or a row.
- C3 a model input with sample is a plan problem, no planId.
- C4 create_report with the planId before approval: refused, nothing written (green before too: create_report refuses
  any unapproved call).
- C5 the approval page: "Sample project", the 16 files grouped (model, report, project file), no "About the script".
- C6 after approval: written; exactly the 16 files, all under `Gulf Retail Sample/`; nothing else in the working folder
  changed; the same planId again refused (one click, one write).
- C7 another folder than the approved one: refused, nothing written.
- C8 read_model reads it: 4 tables, 4 measures, 3 relationships, Calendar `dateTable: true`, every column typed.
- C9 the TMDL partitions are typed `#table`s with 648, 6, 12 and 546 rows; every Calendar day once, no gap.
- C10 check_report on the sample's own (empty) report: Microsoft's validator 0 errors.
- C11 tour step 1 (plan_layout + approve + create_report) writes a report; Microsoft's validator 0 errors on it.
- C12 tour step 2 (languages "en+ar") plans without a problem.
- C13 create_arabic_twin's plan on that report succeeds (no planId: nothing written).
- C14 tour step 3: add_gulf_calendar's plan succeeds.
- C15 tour step 4: check_report lens "arabic" answers.
- C16 a second sample: `Gulf Retail Sample 2`, the first untouched.
- C17 a folder taken between the plan and the write: refused, nothing written over.
- C18 no real company: the written files hold none of the deny list (well-known Gulf retailers and malls, each with
  why) and no vehicle-trade word; with DENY_TERMS set (CI's privacy job), the employer-data scan's `scanText` finds 0.
- C19 every answer of the sample (plan, approval, write) under 40,000 characters.
- C20 the tour: 4 steps; each tool is in the server's tool list and each arg is one of that tool's inputs (enum values
  valid), read from listTools.
- C21 an Arabic request (lang "ar"): the tour's asks are in Arabic; in English otherwise.
- C22 the empty working folder's answer offers the sample; plan_layout's description says it.
- C23 README: "Try the sample" before the tools list, and the option's line under it.
Expected: 23 checks, 22 red on 11df69b (C4 green), 23/23 after.
- write-gate: 4 checks, W1 red after the build until the list has `writeSample` (lib/sample-project.mjs writeTree x1,
  server.mjs writeSample x1); 4/4 after.
- Touched suites, counts unchanged: approval-complete, approval-disclosure, approval-hardening, bilingual-report, claims,
  release-text, answers-safety, 0.2.9-agent (in test.mjs), large-model-caps. test.mjs's empty-folder checks still pass
  (the notice keeps "is empty" and ".pbip").
- Full `cd mcp && npm test` once at the end: every line PASS, 68 lines (X2's 67 + this suite).

## Results
Commits: fe8f8b5 plan (pushed first); dcc7ad7 red tests; 0f61c5d the build; then this file and WORK.md.

Tests before (11df69b + the new tests) -> after:
- `test-0.3.1-sample-project.mjs` (new, in `npm test`): 20 of 23 red -> 23/23. Expected 22 red: C7 (another folder
  refused: create_report refused any call without a plan before) and C19 (the answers' size) passed before too, beside C4.
  Corrected in the test during the build, said here: C2's "no row in the answer" looked for `{"` (it matched the JSON's
  own syntax; now it looks for M's row syntax, `#date` and `#table`); C2 and C6 read the file list from the answer's
  `sample.files` (a plan's own `outputs` stay in the plan's data, for the approval page, as for every plan kind); C11's
  first tour step needed `filters: "top"` (its plan has slicers: the layout's plan problem said so), a change of the tour,
  not of the test. File count 16, not 18 (a miscount in the first plan, corrected before any run).
- `test-0.3.1-write-gate.mjs`: 4 -> 4, W1 red after the build (`lib/sample-project.mjs: writeTree() x1 (not listed)`), then
  the list gained `writeSample` (a wrapper; server.mjs x1, inside create_report's withPlan after the gate) and
  sample-project.mjs's writeTree x1, each with why: a deliberate change of that suite's list, the brief's ask.
- Touched suites, all PASS, counts unchanged: approval-complete 25, r6-disclosure 37, approval-hardening 22, claims 117,
  release-text 36, r5-answers 33, v029agent 23, checker 22, arabic-terms 84, audit-oct 11, large-model-caps 215,
  changelog-words 52.
- The full `cd mcp && npm test` once, at the end (on 0f61c5d's code): exit 0, 70 result lines, every one PASS, none FAIL or
  SKIP (`mcp` 1,581; write-gate 4; sample-project 23); check-result-lines passes on 70. Expected 68: E's merged suites
  added lines I had not counted (the same miscount as X2's).
- No `assets/js` or website file changed: no build:min, no ?v= stamp, no website suite needed.

What it measured on the way (C10, C11): Microsoft's validator gives 0 errors on the sample's empty report
(`themeCollection: {}`, one blank 1280 x 720 page) and on the tour's first report (exec, 4 KPI cards, slicers on top,
the sample's fields); create_arabic_twin's plan, add_gulf_calendar's plan (2025-2026) and check_report's Arabic lens all
answer on it. read_model reads every column typed and the Calendar as the date table.

## CHANGELOG line
- **Try DataArcus without a model of your own:** ask "show me what DataArcus can do" and DataArcus offers a made-up
  Gulf retail project (a model with 18 months of made-up sales, a date table and an empty report). After you approve it,
  it is written to a new folder in your working folder, never over anything; open it in Power BI Desktop and click
  Refresh. The answer then suggests four next steps on it: a first report, the same report in English and Arabic, the
  Gulf calendar, and "is it ready for Arabic?". Every name and number in it is made up.

## For the laptop (Claude Desktop with the built package later; Power BI Desktop 2.159 or later, at 100%)
1. In a new chat with an EMPTY working folder: "show me what DataArcus can do". Expected: Claude offers the sample (the
   empty folder's answer and plan_layout's description say it), plans it, shows what it holds and the files; approve
   in the window (the page "Sample project (made-up data)": 16 files: Model (TMDL) 9, Empty report 6, Project file 1; no
   "About the script"). The folder `Gulf Retail Sample` appears with 16 files.
2. Open `Gulf Retail Sample/Gulf Retail.pbip` in Power BI Desktop. Expected: it opens with no error (the report has no
   theme of its own: `themeCollection: {}`, a schema-valid form never opened in Desktop before; if Desktop refuses it,
   that is the fix to make: a theme file as create_report writes); the Data pane shows Sales, Branches, Products,
   Calendar; the Calendar is marked as the date table (Table tools > Mark as date table shows it on, Date).
3. Click Refresh. Expected: no error; Sales 648 rows, Branches 6, Products 12, Calendar 546 (Table view's row count);
   Sales[Date] and Calendar[Date] shown as dates without a time (`formatString: Short Date`, first time in a sample);
   the 3 relationships in Model view (one to many, single direction); Total Sales 3,010,236 and Units Sold 12,462 (worked out from the files for this check; no value is in an answer:
   read it in Desktop) and Month Name sorted January to December.
4. Run the tour in the same chat, step by step: (1) "Design my first report on the sample" -> plan, approve,
   create_report: `Gulf Retail Sales.pbip` opens with data; (2) the same in English and Arabic (languages "en+ar");
   (3) the Gulf calendar: the script is written, applied in TMDL view (the usual 3 steps); (4) "Is the report ready
   for Arabic?" answers page by page.
5. The same in Arabic ("أرني ما يستطيع DataArcus فعله"): the tour's asks in Arabic; the approval page's title Arabic.
6. Screenshots: the approval page, the Data pane after Refresh, the tour's first report; every page under "Seen, not in
   scope".

## For the reviewer
- The shape (an option, not a 12th tool) and the instructions (unchanged, 2,195 of 2,200; the line is in plan_layout's
  description, the `sample` input and the empty folder's answer) are the two choices to look at first.
- The gate is not changed: the sample's plan uses the folder's path as its "model" key with no print; `ALLOWS.sample` is
  `['create_report']`; agent-text's `SOURCE_OF.sample` names it in approve_plan's description ("create_report (from
  plan_layout with sample)").
- The approval page's one fix outside the sample: `isScript` (a `.tmdl` inside a `.SemanticModel/` folder is a model
  file, not a script): mainFiles, kindsLine and scriptHtml. No other plan writes such a file today.
- Merge: `mcp/package.json`'s test line (append), `mcp/CHANGELOG.md` [Unreleased] (appended at its end), `mcp/README.md`
  (install steps renumbered 6-9, one paragraph after the tools table), `mcp/WORK.md` (one entry on top).
- The beta task list (the private engine repo) should get, as its first task after installing: "Try the sample: in an
  empty working folder ask 'show me what DataArcus can do'; approve; open Gulf Retail Sample/Gulf Retail.pbip in Power
  BI Desktop and click Refresh; then follow the 4 steps Claude offers. Tell us where you got stuck."
- C18's employer-data scan runs on the written files with `DENY_TERMS` when it is set (CI's privacy job has the secret;
  `npm test` in the mcp jobs does not, so there it checks the deny list and the vehicle-trade words only and prints a NOTE).

## Decisions I made
1. **An option, not a tool** (the brief's "decide from the tool list's shape"): `sample` on plan_layout and create_report,
   as `redesignFrom` is. Why: above ("The shape").
2. **The instructions are not changed**: 5 characters of room; the shortest line is 55. Said in plan_layout's
   description (one sentence), the `sample` input's text and the empty working folder's answer (where a user with no
   model is met first).
3. **The folder**: `Gulf Retail Sample` (then 2, 3...), with `Gulf Retail.pbip`, `.SemanticModel` and `.Report` inside;
   the folder is pinned with the plan, and a folder taken between the plan and the write refuses the write.
4. **The data**: X2's demo model widened (it had only 1-28 of each month in its calendar, no product table and no marked
   date table): 6 branches in 6 Gulf cities (3 in the UAE), 12 generic products, 18 months; M `#table` typed rows (the
   labs' way), not DAX tables; amounts in AED said in the measures' descriptions (the format strings stay `#,0`: a
   quoted currency in a TMDL format string is not tried in Desktop yet).
5. **The empty report** has one blank page and no theme: the smallest report Desktop should open on the model;
   create_report's first report gets the theme.
6. **The tour's Gulf calendar** is add_gulf_calendar's table for 2025-2026 without relateTo (the sample's Calendar already
   holds Sales[Date]'s relationship; relating a second date table would be an inactive one to explain).
7. **The tour's report path** is named in step 4 (`<folder>/Gulf Retail Sales.pbip`), the name step 1 gives; the `then`
   line of each step tells the agent the plan and approval come first.
8. **The deny list** (C18) is in the test with why per name: 44 well-known Gulf retailers, chains, online shops and malls,
   matched as whole words, and a vehicle-trade word list.

## Seen, not in scope
1. `approve_plan`'s description names plan sources from the kinds: the redesign's reads "create_report (from redesign)"
   (an older wording); the sample's now reads "(from plan_layout with sample)". Not changed for the redesign.
2. The tour's first report and its EN-AR plan each ask the Gulf date and shared-axes questions on the sample (it has a
   date table and 4 measures); the test answers them like a person; the laptop will see them asked.
3. read_model on the sample lists no relationships (it never does: check_model_health counts them); the test reads them
   with the shared TMDL reader.
