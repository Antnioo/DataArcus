# SC1 (0.3.2 scout): the 9 best R&D topics for tonight, each with a ready brief

## Summary
- **Approval:** the owner, D-1103-12 (3 Nov night): "Go for 10 r&ds during the night create an agent that gets
  familiar with our code and choose the best r&ds ideas that will best fit our code and make us shine"; D-1103-11:
  "push more tokens to make sure we are building the best schematic". This note is that agent's report.
- **Scope:** docs only: this file (and scratch scripts under `mcp/research/scout/` if something is measured). No
  product file changes. Not RD1's topics (B-275, B-277, B-278, B-246, B-304).
- **Base:** `rd/0.3.2-scout` from `origin/integration/0.3.2`. Push only it; no merge, no PR.
- **Expected checks:** none run by a product suite (no product file changes); `node scripts/check-agent-memory.mjs`
  untouched (this file is not a capped memory file).
- **Got:** 9 topics picked (RD2-RD10, each a ready brief below), 17 candidates dropped with why (3 more merged or kept). Nothing measured
  by a script (every measurement is put in the briefs, for the R&D sessions); counts below are from greps on the base.
- **Resume:** done; the owner picks which briefs go out tonight.

## The plan
1. Learn the code (MODULES, README, tools, lib engines, assets/js, tests.json, recent notes' "Seen", research/).
2. Write the map of the product as it is (strong and weak, file:line).
3. Judge the candidate pool against the code: drop what exists (say where), score the rest 1-5 on fit, shine,
   safety, size, risk.
4. Pick 9, write RD2-RD10 briefs (under 35 lines each), the summary table and the dropped list.

## The map of the product as it is (integration/0.3.2, 3 Nov)

**What DataArcus does well today.** It builds a Power BI report from a model's metadata, checks it before it exists
and writes it only after a click in a local approval window; it turns any PBIR report into a right-to-left Arabic
twin (or one EN-AR copy) that mirrors every visual, phone layouts included; it adds a Gulf calendar (Hijri, Ramadan,
Eid, each country's weekend and its change dates); it checks any report offline with Microsoft's validator plus the
rules measured in Desktop (fit, buttons, phone overlaps, a11y, Arabic lens); it redesigns an existing report as a
lossless copy with allowlisted patches; and it does all of this without reading one data value.

**Where the code is strongest.**
- The one write: plan, click, digest-pinned write (`mcp/lib/plans.mjs:142` gate, `mcp/lib/files.mjs:34` writeTree,
  `mcp/lib/artifact.mjs:108` checkArtifact). Every later idea below reuses it as it is.
- Copy-and-patch: `mcp/lib/redesign.mjs:121` ALLOW (JSON pointers a patch may touch), `:403` buildCopy, `:427`
  danglingOf, `:471` verifyCopy (only the plan's patches differ; every other file byte-identical). A safe way to
  touch a person's own report; it is what turns "new reports" into "your reports".
- Shared engines, browser and Node (`assets/js/`, 19,338 lines without the .min files): the website and the MCP give
  the same answer. The mirror engine (`report-mirror.js`, 947 lines) and the measured rules
  (`report-rules.js:90` MEASURED) are the moat: measured in Desktop, not guessed.
- The untrusted-text screen on the way out (`mcp/lib/answer.mjs:12-19` out/nameOut) and in (`model.mjs` shownName).
- The test registry: 164 suites once each in `mcp/tests.json`, by area, with `--affected`.

**Where it is weakest (each a cost every new feature pays).**
1. No answer contract: 11 tools declare inputs (zod, `mcp/lib/report-inputs.mjs`) but no `outputSchema`; the
   40,000-character cap is applied by hand in 7 modules (`check-report.mjs:545-552` its own cut loop, `read-report.mjs`,
   `twin-plan.mjs`, `scope.mjs`, `plan-headroom.mjs`, `tool-answer.mjs`, `answer.mjs`). HR1 measured a B5 answer at
   42,587 before the cut; `bilingual.texts` order still varies run to run (HR1, HR2 "Seen").
2. The plan_layout handler is the hub of everything (`mcp/tools/plan_layout.mjs:116`, 540 lines, 56 lines over 300
   characters), "Table[Field]" normalised by the same regex in six places (SP1 "Seen"); `reportAnswer` takes 41
   inputs by name (`mcp/lib/report-result.mjs:22`, SP3 "Seen").
3. Measured numbers kept twice: the page sizes (`check-report.mjs:493` beside `design-engine.js:72` PAGES), a
   button's 0.45 em text width (`report-rules.js:72` BTN_TW and again in `pbip-page.js`, OP1 "Seen").
4. The copy-and-patch allowlist is one literal (`redesign.mjs:121`): every new edit kind (a phone layout, a new page,
   alt text) edits the core of the safest module. It needs a registry of patch kinds before it grows.
5. The server's instructions sit at their cap (`mcp/lib/agent-text.mjs:9` INSTRUCTIONS_MAX 2200): a 12th tool costs
   description budget and the owner already chose "an option, not a 12th tool" (C). Most ideas below are options.
6. Existing reports can be read, checked, mirrored, made native and redesigned, but not extended: no new page, no
   phone layout where there is none, no proof that a copy shows the same numbers (the public line says "planned",
   `mcp/plans/NUMBER-CHECK.md`).
7. The SVG preview and DAX disagree in three corners (SP16 "Seen": x/0, numbers of 1e21 or more, -0.0).

## The candidate pool, judged against the code
Scores 1-5 (5 best): **Fit** (reuses engines that exist), **Shine** (a Gulf team shows it to the boss; Arabic first),
**Safe** (no value read or returned, nothing before approval, no silent translation), **Size** (5 = small), **Risk**
(5 = low). Order: total, then Shine.

| Idea | Fit | Shine | Safe | Size | Risk | Total | Verdict |
|---|---|---|---|---|---|---|---|
| The number check, layer 1 (same question) | 5 | 5 | 5 | 3 | 4 | 22 | RD2 |
| document_model, EN and AR (explain_measure inside) | 5 | 4 | 4 | 4 | 4 | 21 | RD3 |
| Seasonal skins on an existing report | 5 | 3 | 5 | 5 | 3 | 21 | RD4 |
| Gulf measures: Hijri period compare, VAT by date, pegs | 5 | 4 | 4 | 4 | 3 | 20 | RD5 |
| A phone layout for an existing report | 5 | 4 | 5 | 3 | 3 | 20 | RD6 |
| Arabic Copilot readiness ("prep data for AI") | 4 | 5 | 4 | 3 | 3 | 19 | RD7 |
| add_page to an existing report (as a copy) | 4 | 5 | 5 | 2 | 2 | 18 | RD8 |
| One answer and plan contract (outputSchema, one cap) | 4 | 2 | 5 | 3 | 3 | 17 | RD9 (D-1103-11) |
| One model, two languages: an Arabic culture | 4 | 4 | 4 | 3 | 2 | 17 | RD10 |

## Decisions I made
1. RD9 (the contract) is kept at 17 over higher-scoring smaller ideas: D-1103-11 asks for a stronger design, and
   weakness 1 is paid by every tool, RD2-RD8 included.
2. Each new capability is briefed as an option of an existing tool where the code allows (weakness 5): RD2 on
   check_report, RD4 and RD6 as redesign patches, RD5 on add_gulf_calendar, RD7 on check_model_health. Only RD3 and
   RD8 ask the R&D to judge "option or 12th tool" and say it.
3. RD4, RD6 and RD8 all grow the copy-and-patch allowlist: each brief asks for the patch-kind registry (weakness 4)
   as its design question, so the three end in one shape, not three edits of `redesign.mjs:121`.
4. design_svg_visual dropped: it exists (`svgCards`, `svgColumns`, `report-inputs.mjs:58-67`, compiled by
   `svg-kpi-compiler.js` in `report-run.mjs:104-111`).
5. Nothing measured by a script tonight: each brief names the measurement for its R&D session. The Microsoft pages
   cited were read on 3 Nov through Microsoft Learn's search.

## Common to every brief (RD2-RD10)
- **Base:** a new branch `rd/0.3.2-<slug>` from `origin/integration/0.3.2`. Push only it; never merge, never a PR.
  Write only `mcp/research/RD<n>-<slug>.md` and scratch scripts under `mcp/research/rd<n>/`; no product file changes.
- **First commit:** the note's `## Summary` and plan, pushed; then the work; push after every commit.
- **Rules:** commits end with `Co-Authored-By: Claude <noreply@anthropic.com>` and the session's line; no model names;
  never the em dash; never "first", "only", "official" as a public claim; made-up data in `os.tmpdir()` only, never
  employer data; never the "MCP Engine for Power BI" connector; metadata only, nothing written before approval, no
  silent translation. Don't stop to ask: "Decisions I made". About 90 minutes.
- **Report in 3 lines:** the commit; the recommendation in one line; the builder brief's size and risk.

## RD2: the number check, layer 1 ("same question")
- **The owner's decision:** D-1103-12 "choose the best r&ds ideas that will best fit our code and make us shine";
  the public line "a number check ... is planned, not built" (`mcp/ROADMAP.md`, `mcp/plans/NUMBER-CHECK.md`).
- **The question:** can check_report, given `before` and `after` (the original and its twin, native copy or redesign),
  prove visual by visual that each asks the model the same question (fields, aggregations, filters, sort, Top N,
  display units), from the files only, never a value, and say exactly which visual differs and how?
- **Read:** `mcp/plans/NUMBER-CHECK.md` (sections 1-2, the layer 1 spec); `mcp/lib/read-report.mjs:342` inventory,
  `:185` diskSource; `mcp/lib/redesign.mjs:471` verifyCopy (its opaque-payload hashes); `mcp/lib/twin-read.mjs`;
  `mcp/lib/twin-visuals.mjs` (what a mirror changes on purpose: order, axis side); `mcp/tools/check_report.mjs`.
- **Measure (os.tmpdir(), made-up):** copy `mcp/fixtures/twin-project`, make its twin, native copy and redesign
  through the tools' handlers; count per pair: visuals matched by name, "same question", differ (by kind), notMatched;
  then plant 6 changes (a measure swapped, a filter added, Top N 5 to 10, display units 0 to K, a sort flipped, a
  visual calculation) and report each found; the time and the answer size for the largest fixture.
- **Deliverable:** `mcp/research/RD2-number-check.md`, a) today's code (what verifyCopy already proves, what it
  cannot: a twin is not byte-identical), b) Microsoft's docs (semanticQuery, visual calculations, PBIR filters; the
  learn page "Power BI Desktop project report folder": filters can hold values, so a filter is compared by hash,
  never returned), c) 2-3 ways (a check_report option `against`; a step inside each copy's own plan; a 12th tool) with
  size and risk, d) the prototype's numbers, e) the recommendation, f) the Desktop checks (layer 2 by Performance
  Analyzer on the laptop, one twin: the same rows), g) a builder brief with expected checks.
- **Rules:** no value in any answer (a filter literal is hashed, its count said); layer 2 stays a plan.

## RD3: document_model, the model's handbook in English and Arabic
- **The owner's decision:** D-1103-12 (above).
- **The question:** can DataArcus write, after approval, one HTML handbook next to the project (tables, columns,
  measures with their DAX, display folders, dependencies both ways, which report visuals use each measure, the date
  tables, the health score) in English and Arabic, from metadata only, so a team hands its boss a document?
- **Read:** `assets/js/model-index.js` (the dependency index), `assets/js/dax-reference-parser.js:44` collectReportRefs,
  `:110` analyzeReport; `assets/js/model-health-engine.js` (37 rules, the "Measures without a description" text at
  :95); `mcp/lib/terminology.mjs:157` sheetOf (confirmed Arabic terms), `mcp/lib/arabic-names.mjs`; `mcp/lib/files.mjs:177`
  freeFile; `assets/js/page-preview.js` (a small page picture per report page).
- **Measure (made-up):** on `mcp/fixtures/health-project` and the sample project (`sample-project.mjs`): the
  handbook's size in KB, the time, how many Arabic names come from confirmed terms vs "not confirmed" (never a
  machine translation), and how many DAX literals a screen must hide (a hard-coded "Contoso" in a FILTER is a value).
- **Deliverable:** `mcp/research/RD3-document-model.md` a-g: a) what read_model and check_model_health already
  return, b) Microsoft's docs (descriptions as tooltips, display folders, TMDL), c) ways: a check_model_health option
  `handbook`, a 12th tool, a website page with the same engine; d) a prototype handbook (made-up model) and its
  numbers; e) recommendation; f) Desktop checks (none for the file; the descriptions it suggests applied by TMDL view);
  g) builder brief. explain_measure is a section of it (a measure's chain, in words, from the index).
- **Rules:** the Arabic is the person's confirmed terms or marked untranslated; DAX string literals are masked.

## RD4: seasonal skins for an existing report (Ramadan, Eid, the National Days)
- **The owner's decision:** D-1103-12 (above).
- **The question:** can a redesign's restyle give an existing report a season's look (a palette, title colours, a
  page background tint; no imagery, no religious symbol) in one approval, and take it off again by the same path,
  with every visual, filter and bookmark byte-identical?
- **Read:** `mcp/lib/redesign.mjs:243` opts.restyle, `:331-335` (no custom theme: CS1's `ADDED_THEME`), `:121` ALLOW
  theme tokens; `assets/js/theme-generator.js:17` PRESETS and its Arabic names; `assets/js/design-engine.js`
  (contrast); `assets/js/report-a11y.js` readable (3:1); `mcp/lib/approval-window.mjs` (the plan page's swatches).
- **Measure (made-up):** 6 palettes (Ramadan, Eid, and the National Days of the UAE, KSA, Qatar, Kuwait as their
  flags' colours), each on the twin fixture's copy: the data colours' contrast on the card, colour-blind distance
  between the first 4 series (the dataviz validator's method), files changed vs byte-identical, the undo (restyle
  back to the original tokens) giving the original's theme file byte for byte.
- **Deliverable:** `mcp/research/RD4-seasonal-skins.md` a-g; c) ways: presets in theme-generator (website and MCP
  alike), a redesign option `season`, a dated suggestion in check_report; the patch-kind registry question (Decision 3).
- **Desktop checks:** one skin on the lab report, light and dark; the undo.
- **Rules:** the owner approves each palette and its Arabic name before any public line; no claim of "official"
  colours; a brand colour is never changed.

## RD5: Gulf measures: the same Hijri period last year, VAT by date and country, currency pegs
- **The owner's decision:** D-1103-12 (above).
- **The question:** can add_gulf_calendar's approved script also carry (1) measures that compare a Hijri period with
  the same one a year before (Ramadan day 1-30 against last Ramadan's day 1-30, Eid weeks), (2) a VAT rate column by
  date and country with each change dated, as the weekend rules are, and (3) a small peg table (AED, SAR, QAR, BHD,
  OMR to USD; KWD said as a basket, never a fixed rate), each sourced like `scripts/gulf-calendar/DATES-SOURCES.md`?
- **Read:** `assets/js/calendar-generator.js:170-182` (Hijri Year, Ramadan Day), `assets/js/gulf-dates.js:46` (the
  weekend rules by date: the pattern for VAT), `assets/js/gulf-health.js` (what it checks: Ramadan and Eid measures),
  `mcp/lib/gulf-date-questions.mjs` (one Hijri year or every season), `mcp/lib/model-script.mjs`, `mcp/tools/add_gulf_calendar.mjs`.
- **Measure (made-up):** a made-up fact of 3 years by day in os.tmpdir() (a JS evaluation of the DAX's logic, as
  `svg-expressions.js` does): Ramadan-to-Ramadan by Ramadan Day against Gregorian SAMEPERIODLASTYEAR, how many days
  each pairs wrongly; the VAT column against each rate change (KSA 5 to 15, July 2020; Bahrain 5 to 10, Jan 2022;
  Oman from April 2021; UAE from 2018; Qatar and Kuwait none), every date to be sourced before it is written.
- **Deliverable:** `mcp/research/RD5-gulf-measures.md` a-g; c) ways: calendar columns, a measure script, a
  website-only generator option; f) Desktop: the script applied in TMDL view on the sample project, the measures shown.
- **Rules:** rates and pegs are public facts with a source each and a "checked" date (as gulf-dates.js `checked`);
  never advice on tax; DataArcus never reads the person's amounts.

## RD6: a phone layout for an existing report
- **The owner's decision:** D-1103-12 (above).
- **The question:** a Gulf manager reads reports on a phone; most reports have no phone layout. Can a redesign patch
  add `mobile.json` to every page that has none (right to left for an Arabic page), placed by the writer's own phone
  rules, with nothing else changed?
- **Read:** `assets/js/pbip-page.js:345` (mob), `:1118-1135` (phone placement, groups as page positions), `:1275`
  (mobile.json); `assets/js/layout-check.js` (phone overlaps), `report-rules.js:90` PHONE_W 323;
  `mcp/lib/twin-pages.mjs:366` fitPhoneTabs (the twin's phone mirroring); `mcp/lib/read-report.mjs:226` (mobile read);
  `mcp/lib/redesign.mjs:121`, `:471`.
- **Measure (made-up):** the lab's reports and 25 twin-fuzz seeds with their mobile.json removed: pages laid out,
  visuals placed vs left off (and why: images, hidden, decorative), phone overlaps (layout-check), the height of each
  phone page, the time; Microsoft's auto-create rules side by side (it reads left to right, cannot handle
  backgrounds): where ours differs on an Arabic page.
- **Deliverable:** `mcp/research/RD6-phone-layout.md` a-g; c) ways: a redesign option `phone`, a twin step, part of
  create_report's native copy; the patch-kind registry (Decision 3).
- **Desktop checks:** one report's phone view, EN and AR, a grouped visual, a bookmark that hides a visual.
- **Rules:** a page that has a phone layout is never touched (said in the plan).

## RD7: Arabic Copilot readiness ("prep data for AI")
- **The owner's decision:** D-1103-12 (above).
- **The question:** Microsoft's "Prep data for AI" (AI data schema, verified answers, AI instructions; Q&A must be
  on) is saved on the model. Can check_model_health say how ready a model is for Copilot, from its files, and draft
  the AI instructions in English and Arabic from what the model says (its Gulf calendar's weekend and Hijri columns,
  the confirmed Arabic terms), for the person to paste, never applied by DataArcus?
- **Read:** `assets/js/model-health-engine.js` (the 37 rules: descriptions, display folders, naming, unused, sort
  columns); `assets/js/gulf-health.js`; `mcp/lib/terminology.mjs`, `mcp/lib/arabic-terms.mjs`; `mcp/tools/check_model_health.mjs`.
  Microsoft Learn: "Prepare your data for AI" (`power-bi/create-reports/copilot-prepare-data-ai`, `-ai-instructions`,
  `-ai-data-schema`), the tutorial's guidance (duplicate field names, sort helpers, descriptions), and Microsoft's own
  "Semantic Model AI Readiness" skill (`power-bi/developer/agentic/semantic-model-authoring-skill-overview`): ours must
  add what it lacks (Arabic, Gulf dates), not copy it.
- **Measure (made-up):** where a PBIP keeps the AI schema, instructions and verified answers (a Desktop save of the
  sample project, its files diffed: the laptop); the lens's findings on `health-models.mjs`'s models; an instruction
  draft's length (Microsoft's limit, to find).
- **Deliverable:** `mcp/research/RD7-copilot-readiness.md` a-g; c) ways: a check_model_health lens `ai`, a section in
  RD3's handbook, a TMDL script; f) Desktop: the draft pasted in "Add AI instructions", three Arabic questions in
  Copilot, its answers compared by eye (by the owner, on made-up data).
- **Rules:** nothing written to the model; Arabic only from confirmed terms; no claim about Copilot's answers.

## RD8: add a page to an existing report (as a copy)
- **The owner's decision:** D-1103-12 (above); the capability map's row 1 (`mcp/plans/CAPABILITY-MAP.md:28`).
- **The question:** can plan_layout plan one new page (the writer's own design: KPI cards, a chart, a table) into a
  copy of an existing report, with the copy's every other file byte-identical, the new page using the report's own
  theme, and its Arabic version when the report is Arabic?
- **Read:** `mcp/lib/redesign.mjs:403` buildCopy, `:427` danglingOf, `:471` verifyCopy; `assets/js/pbip-page.js:322`
  (one page); `mcp/lib/report-run.mjs` (a report's whole build); `mcp/lib/read-report.mjs:483` reportTheme, `:532`
  existingTheme; `mcp/lib/twin-copy.mjs` newPlatform; `pages.json` order.
- **Measure (made-up):** on the twin fixture and two lab reports: pages before/after, files byte-identical, the new
  page's validator and rules findings, its preview against the report's own page size, name clashes (page ids,
  visual names) and the bookmarks that still point where they did.
- **Deliverable:** `mcp/research/RD8-add-page.md` a-g; c) ways: a plan_layout input `into` (an existing report),
  a redesign patch kind "page", a 12th tool; the patch-kind registry (Decision 3) as the design.
- **Desktop checks:** the copy opens, the new page draws with the old theme, the old pages unchanged, Arabic page RTL.
- **Rules:** never the original; a copy "<name> plus" (name to propose) next to it.

## RD9: one answer and plan contract
- **The owner's decision:** D-1103-11 "push more tokens to make sure we are building the best schematic".
- **The question:** can every tool's answer and every plan be described by one schema module (an `outputSchema` per
  tool, MCP's structured output), with one cap and one cut rule (what is cut first, how the rest is reached) instead
  of 7 hand-made loops, and the plan's pinned inputs read from the same schema?
- **Read:** `mcp/lib/answer.mjs`, `mcp/lib/tool-answer.mjs`, `mcp/lib/scope.mjs`, `mcp/lib/check-report.mjs:545-552`,
  `mcp/lib/plan-headroom.mjs`, `mcp/lib/twin-plan.mjs`, `mcp/lib/read-report.mjs`; `mcp/lib/plans.mjs:44` propose,
  `mcp/lib/report-inputs.mjs:151` REPORT_PINNED; `mcp/lib/report-result.mjs:22` (41 inputs); the MCP SDK's
  outputSchema and structuredContent in `mcp/node_modules/@modelcontextprotocol/sdk`.
- **Measure:** each tool's answer on the fixtures: its size with and without structuredContent (does the SDK send the
  JSON twice? tokens by `mcp/scripts-measure-tokens.mjs`), how many fields each answer has that no description names,
  the cut order today per module; optional: each tool's time on the largest fixture (a performance budget line).
- **Deliverable:** `mcp/research/RD9-answer-contract.md` a-g; c) ways: schemas only in tests (no wire change), outputSchema
  on the wire, one `capAnswer` with per-tool cut lists; f) Desktop: none; Claude Desktop's tool view of one answer.
- **Rules:** no answer gains a field that carries a value; the instructions' cap unchanged.

## RD10: one model, two languages: an Arabic culture for the model
- **The owner's decision:** D-1103-12 (above); WORK.md's open item "Arabic DA measures for the twin" stays the owner's.
- **The question:** the twin makes the report Arabic; the model stays English (the field list, tooltips, Copilot).
  Can DataArcus write, after approval, a TMDL culture (ar-AE, ar-SA...) script from the confirmed terminology sheet:
  captions, descriptions, display folders, and Arabic synonyms for Q&A, so the service shows Arabic names?
- **Read:** `mcp/lib/terminology.mjs:157` sheetOf, `:138` remember; `mcp/lib/twin-texts.mjs`, `mcp/lib/arabic-names.mjs`;
  `mcp/lib/model-script.mjs`; `assets/js/tmdl-model.js` (cultures read today?). Microsoft Learn: "Plan translation
  for multiple-language reports" (metadata translation: caption, description, display folder; page tabs and text boxes
  cannot be translated), "Use locale values" (Desktop does not load metadata translations; tables and columns need an
  exact culture match, measures the closest), "Work with TMDL view" (translations scripted in TMDL).
- **Measure (made-up):** the sample project's culture file: objects covered by confirmed terms vs left English; the
  file's validity (TMDL parse in `tmdl-model.js`); which culture names a Gulf audience needs (ar-AE, ar-SA, ar-KW,
  ar-QA, ar-BH, ar-OM: one file each or one shared).
- **Deliverable:** `mcp/research/RD10-arabic-culture.md` a-g; c) ways: a twin option, an add_gulf_calendar-like script
  tool step, the RD3 handbook's appendix; f) the service check (a published made-up model, browser in Arabic).
- **Rules:** never a machine translation written silently: an unconfirmed name stays English and is listed.

## The table
| RD | Idea | Why it shines | Engines it reuses | Size | Risk |
|---|---|---|---|---|---|
| RD2 | The number check, layer 1 | proof that a twin or redesign shows the same numbers, without reading one | read-report inventory, redesign verifyCopy, twin-read, NUMBER-CHECK plan | M | L |
| RD3 | document_model EN/AR | a handbook a team gives its boss | model-index, dax-reference-parser, health engine, terminology, page-preview | M | L |
| RD4 | Seasonal skins | Ramadan or National Day look on any report, one click, undone the same way | redesign restyle, theme-generator PRESETS, design-engine, report-a11y | S | M |
| RD5 | Gulf measures | Ramadan vs last Ramadan, VAT by date: Gulf-native | calendar-generator, gulf-dates, gulf-health, model-script | S-M | M |
| RD6 | Phone layout for existing reports | managers read on phones, RTL done right | pbip-page phone rules, layout-check, twin-pages, redesign | M | M |
| RD7 | Arabic Copilot readiness | Copilot-ready in Arabic, Gulf context drafted | health engine, gulf-health, terminology, arabic-terms | M | M |
| RD8 | add_page into a copy | "your reports too": extend, not only check | redesign copy, pbip-page, report-run, read-report theme | L | M-H |
| RD9 | One answer contract | the design every tool pays for (D-1103-11) | answer, tool-answer, scope, plans, report-inputs | M | M |
| RD10 | Arabic model culture | the field list and the service in Arabic | terminology, twin-texts, arabic-names, model-script, tmdl-model | M | M-H |

## Dropped (17; then what was merged)
- compare_reports: it is RD2 (the same comparison, by question).
- accessibility_check: exists (`assets/js/report-a11y.js`, check_report's family "a11y", the writer's alt text).
- arabic_check: exists (`mcp/lib/arabic-lens.mjs`, `check-language.mjs`).
- add_story_titles: exists for new reports (`assets/js/story-titles.js`); existing reports take titles through the
  redesign's title patch (`redesign.mjs:121`); a one-line insight needs values (DA.StoryTitle computes it in DAX).
- design_svg_visual: exists (`svgCards`, `svgColumns`, `report-inputs.mjs:58-67`); named templates are a small job.
- DAX UDF library: exists, off by default (`mcp/lib/dax-functions.mjs`, L6).
- icon sets in the theme: exist (`mcp/lib/status-icons.mjs`, `test-0.3.0-theme-icons.mjs`).
- brand_kit: generate_theme takes a brand colour and the report a logo already; nothing new to research.
- template_from_report: `read-report.mjs:483` reportTheme and `:532` existingTheme cover the theme; the rest is RD8.
- explain_measure: inside RD3 (a measure's chain from the index).
- naming_cleanup: a rename breaks every report bound to it; the health rules already name the problems; high risk.
- report_from_screenshot / sketch: Claude reads the picture itself; plan_layout's hand-placed slots take the result
  (a skill line, not R&D).
- dashboard_to_deck: previews have no values by design and a .pptx writer is outside `mcp/package.json`.
- school and summer calendars: no single source, dates change yearly by emirate and school type; wrong dates likely.
- Deneb / Vega-Lite: a custom visual (capability map row 12, the owner's decision), against the native-first line.
- nightly fuzz of the twin: `test-0.3.1-twin-fuzz.mjs` runs 25 fixed seeds; rotating seeds nightly is a chore job
  (a workflow line, the seed from the date, a reduced case written on failure), not R&D.
- a performance budget per tool: folded into RD9's optional measurement.
- Merged or kept, not dropped: Hijri period compare, VAT and currency pegs (RD5); add_mobile_layout (RD6); one report
  two languages (RD10).
