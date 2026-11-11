# The modules, one write in full, where to start reading

Moved here unchanged by A1 (0.3.1, 25 Oct) from [ARCHITECTURE.md](../../ARCHITECTURE.md) ("The parts", "One write,
start to end", "Where to start reading"), which keeps the boundaries, the write in five lines, the invariants and the
task routes. [Every module](#every-module) (0.3.2 MD1): one row per file, kept true by `scripts/check-modules.mjs`.

## The parts

- **The website** (dataarcus.com, GitHub Pages): the HTML pages at the root, `tools/`, `articles/`, and their Arabic
  copies in `ar/`. Its Power BI tools run in the browser; nothing a visitor opens is uploaded.
  Every page loads the site-wide scripts in this order: `site-navigation.js` (navigation and effects, the WhatsApp
  button, the live report facades; it sends `dataarcus:embed`), `site-forms.js` (the contact and beta forms, tracking-free;
  it sends `dataarcus:lead`), `site-analytics.js` (the analytics adapter and the cookie banner: the only site file that
  calls gtag or Clarity or touches consent; it hears both events and the clicks), then `main.js` (the bootstrap: it
  calls the three in order).
  Its practice exams (DP-600 and PL-300, `tools/*-practice-exam.html`): `dp600-sim.js` (the exam's settings, the bank's
  index and the wiring: it gives each module its storage, clock and random source); `exam-grade.js` (grading, pure: a
  question and an answer in, a credit out; a submitted mock's score and tallies; a practice session's summary);
  `exam-session.js` (the timed mock's state machine: question ids, choices and clock events in, the saved mock through a
  storage adapter out; its draw of questions by area weight); `exam-progress.js` (the saved progress: answers,
  bookmarks, results, study days, readiness; the study plan, weakest skill first); `exam-view.js` (every screen's HTML,
  its clicks and keys, the routing; the only one that touches the DOM). Each loaded before `dp600-sim.js`, which
  calls them all; `exam-view.js` calls the other three through what `dp600-sim.js` hands it.
- **The engines** (`assets/js/*.js`, each with its `.min.js`): plain JavaScript that runs in the browser and in Node,
  **shared by the website and the MCP on purpose**, so both give the same answers: the model reader and field picker,
  the report writer, the design engine, the model health check, the calendar and the Gulf, the measured rules and the
  check, right to left (the Arabic twin's engine, `report-mirror.js`), the SVG KPI designer, the website's language
  (`lang-manager.js` and its `locale-*.js`). Every file:
  [the engines' rows](#the-website-engines); the pages' own scripts: [their rows](#the-browser-pages-own-scripts).
- **The MCP server** (`mcp/server.mjs`, stdio): the entry only (setup, the instructions, one `register` import per
  tool, in the order tools/list shows them); 11 tools, from `read_model` to `check_report`, each
  `mcp/tools/<tool_name>.mjs` exporting `register(server, ctx)` ([their rows](#the-tools); every tool and option:
  `mcp/TOOLS.md`). Its modules are in `mcp/lib/`, by area:
  [reading](#the-mcp-reading) (the model and the report, read and never changed: `model.mjs`, `read-report.mjs`),
  [**the approval gate**](#the-mcp-the-approval-gate) (`plans.mjs`, `approval-window.mjs`),
  [**the write path**](#the-mcp-the-write-path) (`artifact.mjs`, `files.mjs`, `write-io.mjs`),
  [create_report and its options](#the-mcp-create_report-and-its-options) (one report's whole build: `report-run.mjs`),
  [the redesign](#the-mcp-the-redesign) (copy-and-patch: `redesign.mjs`),
  [**the checkers**](#the-mcp-the-checkers) (`check-report.mjs`, its parts `check-schema.mjs`, `check-impact.mjs`,
  `check-redact.mjs`, `check-language.mjs`),
  [**the Arabic twin**](#the-mcp-the-arabic-twin) (by step, `twin-*.mjs`, through `arabic-twin.mjs`; every Arabic path
  mirrors through `report-mirror.js`), and
  [what leaves the server and the tools' helpers](#the-mcp-what-leaves-the-server-and-the-tools-helpers)
  (`answer.mjs`, `agent-text.mjs`, `tool-answer.mjs`). Tests that read source text go through `mcp/test-source.mjs` (a
  new tool or lib module is found from there).
- **Tests and CI**: the MCP's suites are listed once, by area, in `mcp/tests.json` and run by `mcp/run-tests.mjs`
  (`npm test` in `mcp/`); `mcp/test.mjs` runs every tool end to end and CI splits it in 4 shards. The website's
  suites: `scripts/tests/run-all.mjs`. Repo checks (site config, result lines, CHANGELOG words, ...): `scripts/*.mjs`.
  `.github/workflows/tests.yml` runs them on Linux, Windows and macOS and adds the shards up (`scripts/ci-sum.mjs`).
  What only Power BI Desktop can prove: `scripts/tests/DESKTOP-TESTS.md`.
- **The site's build** (0.3.2 ST1; `npm run build:min`: each `.min.js` from its source, then the stamps):
  - `scripts/stamps.mjs`: the `?v=` stamps, never typed: `--list` measures every reference, `--write` gives each its
    target's content stamp (sha256 of the LF bytes, 12 hex; `stampOf`, the one hash helper) in dependency order, no
    flag checks them (run by `scripts/check-min.mjs`, so by CI); reads and writes the pages and engines.
  - `scripts/test-stamps.mjs`: stamps.mjs red on made-up trees (an old stamp, a typed one, a missing or changed
    target, a loop), green on the real tree, a second build a no-op; made-up files in the temp folder.
- **Bot pull requests** (0.3.3 BA1, D-1109-10): `scripts/bot-pr-files.mjs`: paths of a pull request in (stdin, one per
  line) -> `auto` only when every path is one of the 3 data files (prices, PL-300 and DP-600 outlines), else `owner <path>`;
  the one allowed list, called by `update-powerbi-prices.yml` and `check-exam-outlines.yml`;
  `scripts/test-bot-pr-files.mjs` proves it and both workflows (merge only after `auto`, `--auto` only).
- **Builder stop hook** (0.3.3 LR3): `scripts/agent-stop-check.mjs`, run by the Stop hook in `.claude/settings.json`: on a
  `fix/*` or `feat/*` branch it refuses the end of a turn (exit 2) until the job's note has `CI green: <url> on <sha>` for the
  head, a `STOP:` line or a question under "## For the owner"; allows after 3 refusals in a row, on any other branch, and
  when git or the note cannot be read; `scripts/test-agent-stop-check.mjs` proves it on made-up repos.
- **Packaging**: the one-click extension (`.mcpb`) and its release notes are made by a separate build step from
  `mcp/` as it is here; `mcp/skills-packaging/` is the plugin folder next to Microsoft's.

## One write, start to end

1. **Plan.** `plan_layout` (or `create_arabic_twin`, `generate_theme`, `check_model_health`'s fix scripts,
   `add_gulf_calendar` without a plan id) reads the model's metadata, builds the exact files the write would make with
   the writer's own build, checks them (validator, every field against the model, the measured rules, the layout
   check) and answers with a proposed `planId`. Nothing is written.
2. **Approval page.** The AI calls `approve_plan`; the server opens its approval window: the plan, every file it
   writes and a preview of each page drawn from the plan (`page-preview.js`). Only the person's click on Approve (or
   the app's own elicitation prompt) approves; nothing the AI passes does.
3. **`approve_plan`** records the approval against the plan's digest, its pinned inputs and the model's print (a hash
   of its definition files). Ids expire after 2 hours and live in the server process only.
4. **Write.** The writing tool, called with the `planId`, refuses if anything changed since the click (the model, an
   input file, an option) and writes exactly the approved files, as new files next to the model, through `files.mjs`;
   a failed write removes only what that call created, and only while its content is what
   the call wrote (0.3.1 RB, `write-io.mjs`). create_report and the twin write the files their plan kept,
   byte for byte: `tools/create_report.mjs: writeApproved` compares their digest and binding; `lib/twin-write.mjs:
   writeTwin` (0.3.1 K2) the same, and builds the twin again for comparison only (a different build: nothing written). `mcp/test-0.3.1-write-gate.mjs` lists every file-writing call.
5. **Check.** The report was validated before it was written; `check_report` (any report, read only) and Power BI
   Desktop confirm it after.

## Where to start reading

| Change | Start with |
|---|---|
| A website page or tool | the page's HTML and its `assets/js/` engine; `node scripts/test-site-config.mjs`; `scripts/tests/run-all.mjs` |
| Site-wide behaviour (navigation, effects, forms, analytics, consent) | `assets/js/site-navigation.js`, `site-forms.js`, `site-analytics.js` (consent), `main.js` (the bootstrap); `scripts/tests/run-all.mjs sp35 consent site anchors` |
| The practice exams | `assets/js/dp600-sim.js` (settings, wiring), `exam-grade.js` (scores), `exam-session.js` (the timed mock), `exam-progress.js` (saved progress, study plan), `exam-view.js` (screens); `scripts/tests/sp34.mjs`, `tools.mjs` |
| What a report looks like (layout, sizes, visuals) | `assets/js/pbip-export.js` (it puts the writer together: [the writer's rows](#the-website-engines)), `design-engine.js`; `report-rules.js` for measured limits |
| Themes, page layout and saved designs | `assets/js/design-engine.js` (DAEngine, the facade the generator page, `mcp/lib/design.mjs` and the writer call; its colours, glass, metrics and saved designs: [the design rows](#the-website-engines)) |
| Right to left and Arabic | `assets/js/report-mirror.js`, `mirror-policy.js`, `mirror-charts.js`, `mirror-text.js`, `mirror-units.js`; [the twin by step](#the-mcp-the-arabic-twin), `terminology.mjs`; `assets/data/arabic-report-words.json` |
| Reading models | `assets/js/pbip-bind.js` (the binding; the fields and their ranking: [the reader's rows](#the-website-engines)), `tmdl-model.js` (the website's folder or file: `model-import-browser.js`); `mcp/lib/model.mjs`, `scope.mjs` |
| Model health | `assets/js/model-health-engine.js` ([its modules' rows](#the-website-engines)), the page `model-health.js` |
| A tool's inputs or answer | `mcp/tools/<tool_name>.mjs`, `mcp/lib/agent-text.mjs`, `mcp/TOOLS.md` |
| Approval or writing | `mcp/lib/plans.mjs`, `approval-window.mjs` (its page `approval-view.mjs`, its requests and secret `approval-http.mjs`), `artifact.mjs`, `files.mjs`, `write-io.mjs` |
| Checking reports | `mcp/lib/check-report.mjs`, `check-schema.mjs`, `check-impact.mjs`, `check-redact.mjs`, `check-language.mjs`, `arabic-lens.mjs`, `design-lint.mjs`; `assets/js/layout-check.js` |
| Tests and CI | `mcp/tests.json`, `mcp/run-tests.mjs`, `mcp/test.mjs` (`SHARDS`), `.github/workflows/tests.yml`, `scripts/ci-sum.mjs` |
| Public claims (README, PRIVACY, the MCP page) | `mcp/test-0.3.0-claims.mjs`, `mcp/test-release-text.mjs` |
| A new module (a split's new file) | its row in its part's table, [Every module](#every-module); `node scripts/check-modules.mjs` |

## A new create_report option is pinned in the plan

Moved here unchanged by SQ12 (0.3.1, 26 Oct) from ARCHITECTURE.md's task routes (route c links here).

1. Its schema in `CREATE_REPORT_INPUTS` (plan_layout takes the same entry) and its default in `LOOK_DEFAULTS`.
2. Its name in `REPORT_LOOK`, so `reportPin` pins it: a write with another value is refused by the gate.
3. The plan and the write build it from the same pinned value (`report-run.mjs`), never from a fresh default.
4. The approval page says it (`lookOf`, `summary`) in English and Arabic.
5. A test: the plan with it, the write with another value refused; `mcp/TOOLS.md` says it in the tool's section.

## Every module

One row per module file: every `assets/js/*.js` but the `.min.js` copies, every `mcp/lib/*.mjs`, every
`mcp/tools/*.mjs` (0.3.2 MD1). The row says what the file does; the file says how. **A new module gets its row
here** (`file | job | in -> out | used by | pure`), in its part's table; `node scripts/check-modules.mjs` names a file
without one, a row whose file is gone, a file with two rows and a "used by" name that is not a module or a page. The
evidence for each row (exports, imports, what it touches, who loads it) is read from the code by
`node scripts/modules-facts.mjs`; run it again after a split.
**Before writing a helper, look in [CONTRACTS.md](CONTRACTS.md) and here: one job lives in one place (D-1104-12).**

- **in -> out**: what it takes and what it gives (for a page script: "the page's DOM").
- **used by**: its main callers, by file name (a module, `server.mjs`, or a page by its path; every page has an
  Arabic copy in `ar/` that loads the same files). Tests are not listed.
- **pure**: yes when the file itself touches no DOM, storage, file system, network, worker or process, and writes no
  global but its own export; otherwise what it touches. A pure module may call one that is not.
- An engine in `assets/js/` runs in the browser (it sets one global, `window.X`) and in Node (`module.exports`).

### The website engines

In `assets/js/`. Shared by the website and the MCP on purpose: one engine per job.

| file | job | in -> out | used by | pure |
|---|---|---|---|---|
| **The model reader and field picker** | | | | |
| `tmdl-model.js` | reads a project's TMDL files into the model JSON a model.bim holds | TMDL files `[{ path, text }]` -> model JSON, the files it could not read and why (English and Arabic) | `model.mjs`, `pbip-bind.js`, `model-health-worker.js`, `check-report.mjs` | yes |
| `pbip-bind.js` | "your own model": reads a model (TMDL, model.bim, .pbit) and turns the suggestions into the binding; re-exports the catalog's and the ranking's names | a model and the design's slots -> the fields and the binding, visual by visual | `model.mjs`, `report-bind.mjs`, `report-fields.mjs`, `plan_layout.mjs`, `theme-generator.js` | yes |
| `field-catalog.js` | a model's metadata read and normalised: the fields, the relationships, which tables a field reaches, calendars marked | the readers' tables (or TMSL JSON) -> the fields `{ measures, columns, hiddenMeasures }`, the relationships, the reach | `pbip-bind.js`, `field-suggest.js` | yes |
| `field-suggest.js` | which field goes in each visual, ranked by fixed rules on the metadata (stable order, no random source), English or Arabic | the tables, the number of KPI cards, the options -> `{ choices, notes }` | `pbip-bind.js` | yes |
| `field-meaning.js` | what a field's metadata says it holds (a percent, money, a count, text), one rule for the picker (through the catalog) and the health check | a name, a format string, an expression -> its kind and the evidence | `field-catalog.js`, `model-health-tmdl.js`, `axis-units.js` | yes |
| `field-picker-ui.js` | the field picker's drawing: one row per choice | the catalog, the current binding and the element to draw in -> the rows drawn, the binding the choices make | `pbip-bind.js` | no: DOM (the element it is given) |
| `model-import-browser.js` | the website's model input: a folder or a model file the visitor chose, read in the browser | a folder or a file -> the model's structure (never its data), or why it is refused | `pbip-bind.js` | no: worker |
| `model-nearest.js` | which model folder a chosen folder means (the one rule: the nearest wins, a deeper backup never; two at the nearest depth are given, sorted, never picked between) | model folder paths and their separator -> the nearest one, or the tied ones | `model-import-browser.js`, `lib/model-discovery.mjs` | yes |
| `sort-column.js` | which number column sorts a month or day name (the one rule: a year-month number for "Month Year", a weekday number for a day name, a month number for a month name; Hijri and fiscal by their own; an untyped column only when its name says number) | a table's columns, the name column, a type reader -> the sort column, or null | `field-catalog.js`, `model-health-tmdl.js` | yes |
| `model-file.js` | a Power BI model file's bytes, the parts every reader shares: their text (UTF-16LE or UTF-8, a byte order mark or none) and the sizes over which a model file is refused (one place each) | bytes -> their text; LIMITS: model, entry, total, file, entries | `lib/model.mjs`, `model-health-worker.js`, `model-import-browser.js`, `theme-generator.js` | yes |
| `tmdl-name.js` | a table, column or measure name as TMDL writes it (the one rule: bare when a plain identifier, else in single quotes with ' doubled; a hyphen is quoted) | a name -> its TMDL text | `model-health-tmdl.js`, `tools/dax-measure-builder.html`, `tools/power-bi-model-health-check.html`, `lib/model-culture.mjs`, `lib/sample-project.mjs`, `lib/shadow-model.mjs`, `lib/twin-model.mjs` | yes |
| `contrast.js` | the WCAG contrast of two colours, written once: the relative luminance of a colour (`luminance`) and the ratio of two (`contrast`); the one home of the ledger's contrast family | #rrggbb -> a luminance (0 to 1) or a ratio (1 to 21); NaN for #FFF, a name or an empty text | the engines design-colours.js (which also exports them as lum and contrast), pbip-query.js and svg-kpi-compiler.js (and theme-generator.js, which loads it first; the theme generator and SVG KPI designer pages) | yes |
| **The report writer** | | | | |
| `pbip-export.js` | builds a whole Power BI project (PBIR) from a design and a binding; puts the writer's modules together | a design, the model's fields, the binding, the language -> the project's files and the writer's notes | `report-build.mjs`, `plan-lint.mjs`, `fix-scripts.mjs`, `theme-generator.js` | yes |
| `pbip-query.js` | the PBIR values, a field's projection and title, the one DAX quoter, each visual's query, order and filters, the report's own measures | a bound field, a visual's kind -> its query JSON and DAX names | `pbip-export.js`, `pbip-page.js`, `pbip-visuals.js`, `metric-switcher.mjs`, `twin-measures.mjs` | yes |
| `pbip-sizing.js` | the writer's sizes measured in Desktop: text widths, a table's columns by their room, bar bands, the phone's tabs and titles | a report's font, label size and fields -> sizes in page units | `pbip-export.js`, `pbip-page.js`, `report-rules.js`, `page-preview.js`, `twin-pages.mjs` | yes |
| `pbip-page.js` | one report page: its visuals in reading order (names, z and tab order, groups), its navigation, its phone layout, its tooltip pages | the design, the binding, the slots -> the page's and its visuals' files | `pbip-export.js` | yes |
| `pbip-visuals.js` | each slot's visual: the shared look, the per-slot kind, the "No data" card, the phone look; calls the charts and tables builders | one slot's read-only input -> the visual's JSON and its notes | `pbip-page.js` | yes |
| `pbip-visuals-charts.js` | the charts: their counts and kinds, top N, bar bands, time axes, hover, the mirror of an Arabic chart | the slot builder's input and the step's state -> the chart's JSON, filters, notes | `pbip-visuals.js` | yes |
| `pbip-visuals-tables.js` | the cards, tables and slicers | the slot builder's input and the step's state -> the visual's JSON and notes | `pbip-visuals.js` | yes |
| `pbip-tooltip.js` | the tooltip pages: the card, the Top 6 bar chart by category, the trend by month | the theme, the metrics, the binding, the direction -> the page's JSON and its visuals' JSON | `pbip-page.js` | yes |
| `pbip-navigation.js` | the page buttons and filter panels: the tabs, the header's plan, the filter rail or strip, the slide-in panel | the theme, the metrics, the pages -> the buttons' and panels' visuals | `pbip-page.js` | yes |
| `pbip-notes.js` | the writer's notes: what its caller should tell (tables that hold fewer fields, titles shortened...) | the build's events -> the notes list build returns | `pbip-export.js` | yes |
| `pbip-sample.js` | the sample model, so a report made without a model opens looking finished, in English or Arabic | the language -> the sample table (model.bim) and its binding | `pbip-export.js` | yes |
| `pbip-bidi.js` | the writer's bidi isolation: each Latin run in an Arabic text (an acronym, a code, a name kept in English) isolated where the report shows it | the generated file map, the model's approved names (or every mixed text, an Arabic build) -> the same map isolated, how many texts changed | `pbip-export.js` | yes |
| `pbip-zip.js` | the writer's ZIP (stored, uncompressed) | `[{ path, data }]` -> the ZIP's bytes; crc32 | `pbip-export.js` | yes |
| `story-titles.js` | a visual's title that says what it answers, from metadata only (never a value or a judgement), in English and Arabic | a measure, its axis, its time intelligence, display names -> the title and its fitted variants | `pbip-page.js`, `pbip-visuals.js`, `pbip-query.js`, `visual-gallery.js`, `report-a11y.js` | yes |
| `visual-gallery.js` | three of Power BI's own visuals the writer adds only where the fields' roles fit (combo, waterfall, small multiples) | a slot's fields and their units -> the gallery kind, its query and title, or why not | `pbip-export.js`, `pbip-visuals.js`, `mirror-charts.js`, `tool-inputs.mjs`, `report-build.mjs` | yes |
| `axis-units.js` | which measures may share one value axis (an amount next to a percent, SAR next to AED: never) | the measures' metadata (and an answer remembered) -> same unit or not, the question to ask | `visual-gallery.js`, `visual-meaning.mjs`, `report-fields.mjs` | yes |
| `label-limits.js` | a column chart or a bar chart, from the category labels' measured limits | an axis's known names (or the stand-in) and the slot's width -> the chart kind | `pbip-visuals-charts.js` | yes |
| `aggregation.js` | the aggregation guard: values that must never be stacked or summed | a measure's DAX, format and name -> its class and the evidence (English and Arabic) | `plan-lint.mjs` | yes |
| `text-measure.js` | the measured width of a line of text (Latin by letter, Arabic by measured em), the direction isolates round a Latin run in Arabic, the fonts offered | a text, its size, bold, font -> its width in page units | `pbip-sizing.js`, `report-rules.js`, `design-engine.js`, `story-titles.js`, `twin-pages.mjs` | yes |
| **The design engine** | | | | |
| `design-engine.js` | the Theme & Layout Generator's logic with no page: the theme JSON, page sizes, layout slots, the background picture | a design `{ name, font, data, ui, chart, layout }` and the language -> the theme JSON, the slots, the SVG background | `design.mjs`, `pbip-export.js`, `pbip-page.js`, `report-rules.js`, `tools/power-bi-theme-generator.html` | yes |
| `design-colours.js` | the colour math: hex, contrast (WCAG), HSL, harmonies, the calm palette, CIEDE2000, colour-vision simulation, a logo's colours; `hexToRgb` (#rrggbb -> [r, g, b]) the one home of the ledger's hex-rgb family (0.3.3 SG1) | colours -> colours, contrasts, palettes | `design-engine.js`, `design-glass.js`, `pbip-query.js` (hexToRgb, read when called) | yes |
| `design-glass.js` | the glass look: its numbers, contrast checks, soft background picture (pixels and PNG), cards' and tables' styles | a design's colours and the page's units -> the look's theme parts and its PNG | `design-engine.js` | yes |
| `design-metrics.js` | the layout geometry and text sizes: page sizes, slots, the report's pages, the rail's fit, label and title sizes (0.3.2 SP29); how well a page is filled (`pageFill`: the largest empty hole, the flattest and the lowest chart, 0.3.3) | a saved layout and a language (reading direction and label language only), explicit options -> numbers, boxes and slots as new objects | `design-engine.js`, `design-state.js` | yes |
| `design-state.js` | the saved designs: their schema, the version upgrade and the repair on load; the versioning stays with the state (0.3.2 SP29) | a save and an optional report callback -> the repaired design at the current version and one `{ field, given, used, why }` per value not used | `design-engine.js` | yes |
| `png-bytes.js` | the picture bytes, one copy (0.3.2 DD2P): the CRC-32 (PNG chunks, ZIP entries), the big-endian four bytes written and read, the PNG chunk | bytes, a number, a chunk's type and body -> the CRC-32, 4 bytes, the number at an offset, the chunk's bytes | `design-engine.js`, `pbip-zip.js`, `glass-picture.mjs`, `page-picture.mjs`, `tools/power-bi-theme-generator.html` (its text chunks) | yes |
| **The model health check** | | | | |
| `model-health-engine.js` | the health check's orchestration: the dependency graph, the report's use, the score, the documentation data | model JSON and (optional) report files -> `analyze()`'s result: findings, score, questions, docs | `model-health-worker.js`, `check_model_health.mjs` | yes |
| `dax-reference-parser.js` | the DAX tokens and the fields a report references; an expression given as one text or as its lines -> one text (`exprText`, the one home of the ledger's expr-text family, 0.3.3 SG1) | DAX text -> tokens; report JSON (PBIR or a legacy Layout) -> the fields it references | `model-index.js`, `health-rules.js`, `model-health-engine.js`, and for exprText `confirm-memory.js`, `gulf-health.js`, `model-health-tmdl.js`, `shadow-model.mjs` | yes |
| `model-index.js` | the model's normalised form, its frozen index and a DAX text's dependencies | model JSON -> the normalised model; it -> the index; DAX -> the objects it references | `health-rules.js`, `model-health-engine.js` | yes |
| `health-rules.js` | the 37 rules: findings out | the normalised model, its index, the report's use -> findings | `model-health-engine.js` | yes |
| `health-texts.js` | the rule catalogue: each rule's category, severity, texts in English and Arabic, and its source (data only) | none -> RULES, BPA_URL | `health-rules.js` | yes |
| `health-confirm.js` | "Please confirm": the questions and their evidence, apart from the score | the normalised model and the user's tables -> the questions | `model-health-engine.js` | yes |
| `model-health-tmdl.js` | the fix scripts: model objects back into TMDL as Desktop writes them; formats, sort columns, separators | model objects and the fixes chosen -> TMDL text and what to do by hand | `fix-scripts.mjs`, `check_model_health.mjs`, `flip-cards.mjs`, `status-icons.mjs`, `report-fields.mjs` | yes |
| `health-downloads.js` | the health check's text downloads (the findings CSV, the measures CSV, the docs as HTML and Markdown) | the kind and the analysis -> `{ name, type, text }` | `tools/power-bi-model-health-check.html` | yes |
| `health-worker-client.js` | the health check page's worker: starts it, keeps it between runs, replaces it when a new file comes during a run; it owns the worker's ?v= stamp (0.3.2 SP32) | `{ Worker }`, then a file's buffer and name -> typed messages: progress, result (with the worker's meta), error (`WORKER`, `PARSE`, the worker's code); no analytics | `tools/power-bi-model-health-check.html` | no: worker |
| `health-fix-plan.js` | the fix plan the health check page shows: what is broken, the quick fixes, the TMDL and clean-up scripts, every copy button's text (0.3.2 SP32) | `{ result, ignored, lang, tmdl }` -> `{ broken, quick, tmdl, cleanup, scripts }` | `tools/power-bi-model-health-check.html` | yes |
| `health-view.js` | the health check page's drawing: every tab, the score, loading and errors, in English or Arabic (0.3.2 SP32) | the page's state (the result, metadata only, and the person's selection) and its services -> the DOM inside #mhApp | `tools/power-bi-model-health-check.html` | no: DOM |
| `confirm-memory.js` | a "Please confirm" answer reused while its metadata is unchanged (also the Arabic terms and the date questions' answers) | a question, its evidence, the records -> the answer kept or the question back; records to keep | `answers.mjs`, `terminology.mjs`, `gulf-date-questions.mjs`, `axis-units.js` | no: storage (the website keeps answers in the visitor's browser) |
| `gulf-health.js` | the Gulf calendar check (not in the score): Hijri, Ramadan, Eid and weekend columns and measures, by name | a model -> what its calendars have and lack | `check_model_health.mjs`, `add_gulf_calendar.mjs`, `gulf-date-questions.mjs` | yes |
| **The calendar and the Gulf** | | | | |
| `calendar-generator.js` | the DAX calendar table: Gregorian, fiscal, Hijri (Umm al-Qura), Ramadan and Eid flags, GCC weekends, Arabic columns; and, below it, its page's script | options (range, country, columns) -> the DAX table text; the page: its DOM | `gulf-calendar.mjs`, `tools/dax-calendar-table-generator.html` | no: DOM, storage, browser files (its page part) |
| `gulf-dates.js` | the UAE's announced Ramadan and Eid dates, each GCC country's weekend and its changes, VAT and pegs (data and lookups) | a year, a country -> the dates and weekends | `calendar-generator.js`, `gulf-health.js`, `gulf-calendar.mjs`, `gulf-date-questions.mjs` | yes |
| `gulf-measures.js` | Ramadan and Eid measures (the same Ramadan days last Hijri year, its growth, the Eid windows) | the calendar's table and column names, a base measure -> DAX measures | `gulf-calendar.mjs`, `tools/dax-measure-builder.html` | yes |
| `arabic-calendar.js` | the Arabic twins of a date table's text columns and flags (month and day names, Hijri, quarters) | a date table's columns -> the Arabic columns' DAX | `calendar-generator.js`, `pbip-query.js`, `label-limits.js`, `twin-model.mjs`, `arabic-lens.mjs` | yes |
| **The measured rules and the check** | | | | |
| `report-rules.js` | the measured rules: what Power BI Desktop draws, with its numbers and where measured; Arabic and right to left rules included | a parsed report -> findings in numbers and ids | `check-report.mjs`, `layout-check.js`, `page-preview.js`, `artifact.mjs`, `twin-text-fit.mjs` | yes |
| `layout-check.js` | the check of a project before it is written or downloaded: the measured rules and the design lint on the files in memory | a project's files -> the lint and rule findings | `check-report.mjs`, `design-lint.mjs`, `plan-lint.mjs`, `theme-generator.js` | yes |
| `report-a11y.js` | Power BI's accessibility basics: alt text, tab order in reading order (right to left in an Arabic report), titles, data colours at 3:1 | a page's visuals and theme -> the visuals with them applied; what is missing | `pbip-export.js`, `report-rules.js`, `twin-copy.mjs` | yes |
| `pbir-values.js` | what a Power BI literal holds, read in one place: its text (`litText`), number (`litNumber`), true or false (`litBool`), the value as shown (`litShown`), a table column's set width (`columnWidth`), the raw value as written (`litValue`) and an objects list's entries (`entries`, `plain`, `anyOf`; 0.3.3 SG1); the one home of the ledger's 1b-text, 1b-number, 1b-bool, 1d, lit-value and obj-entries families | a property (`{ expr: { Literal: { Value } } }`) or a columnWidth list -> its text, number, true or false (null for none) | the engines `page-preview.js`, `layout-check.js`, `report-rules.js`, `report-a11y.js`, `pbip-visuals.js`, `visual-replace.js` (and `theme-generator.js`, which loads it first); the MCP's twin (`twin-visuals.mjs`, `twin-geometry.mjs`, `twin-pages.mjs`, `twin-texts.mjs`, `twin-text-fit.mjs`, `twin-plan.mjs`, `twin-copy.mjs`, `twin-pictures.mjs`), `arabic-lens.mjs`, `check-language.mjs`, `dax-functions.mjs`, `flip-cards.mjs`, `redesign.mjs`, `terminology.mjs`, and `visual-meaning.mjs` (which hands it to report-inventory.mjs, as it does visual-types.js); litValue also `mirror-policy.js`, `check-impact.mjs`; entries, plain and anyOf also report-inventory.mjs (a comment there names it; the code reaches it through visual-meaning.mjs) | yes |
| `text-runs.js` | what text a text box's paragraphs hold, read in one place: one text per paragraph, its runs' values joined as written (`paragraphTexts`: 0 -> "0", null -> ""); the one home of the ledger's text-runs family; each caller joins the lines itself | a text box's paragraphs -> one text per paragraph | the engines `layout-check.js` (textOf: " / ", trimmed), `report-a11y.js` (textOf: " "), `page-preview.js` (textOf: " ") (and `theme-generator.js`, which loads it first); the MCP's `visual-meaning.mjs`, which hands it to report-inventory.mjs (textOf: " / ", trimmed), as it does pbir-values.js | yes |
| `html-escape.js` | a text made safe inside an HTML page, in one place (`htmlEsc`: & < > " ' as entities, `'` as `&#39;`, null and undefined as ""); the one home of the ledger's html family | a text -> the same text safe in an element or a quoted attribute | the engines `field-picker-ui.js`, `health-downloads.js`, `page-preview.js`, the pages' `exam-view.js`, `health-view.js`, `theme-generator.js`, svg-kpi-designer.js and measure-builder.js (escapeHtml; the page's window), each as its own esc, loaded first by `tools/dax-measure-builder.html`, `tools/svg-kpi-designer.html`, `tools/pl-300-practice-exam.html`, `tools/dp-600-practice-exam.html`, `tools/power-bi-model-health-check.html`, `tools/power-bi-theme-generator.html` and their Arabic twins (and by `theme-generator.js`'s loaders before the picker and the preview); the MCP's `approval-view.mjs` (esc, the approval window) | yes |
| `arabic-script.js` | is this text Arabic: one character class (`ARABIC`: the Arabic block, its supplement, extended-A, both presentation-form blocks) and `hasArabic`; the one home of the ledger's 1f family | a text -> true or false (null and undefined are no text) | the engines `text-measure.js` (every measured text; its ARABIC is this one), `field-catalog.js` (the field picker's language), `report-rules.js` (check_report's Arabic header), `pbip-query.js` (the writer's titles; its AR_LETTERS is this one); the MCP's `dax-functions.mjs` (the story sentence), `report-bind.mjs` (an Arabic column word), `twin-plan.mjs` (the twin's answer) (and `theme-generator.js`, which loads it first, and the theme generator pages) | yes |
| `time-names.js` | is a column, by its name, a date part: its words (`wordsOf`: camel case, `_`, `-`, digits split, the Arabic article off) and one word list (`TIME_WORDS`), `isTimeName`; the one home of the ledger's 1a family | a column's name -> true or false (names only, never a data value) | the engines `mirror-policy.js` (the twin's time axis), `page-preview.js` (the preview's time arrow), `pbip-query.js` (the writer's sort), `layout-check.js` (check_report's AXIS_TIME rules) (and `theme-generator.js`, which loads it first, and the theme generator pages) | yes |
| `visual-types.js` | which visual types are Power BI's own and which are custom (one list), and which are bar charts (`BAR_TYPES`, `isBar`: the catalog's three; the one home of the ledger's vt-bar family) | a visual type -> native, custom, slicer, bar | `report-rules.js`, `layout-check.js`, `mirror-policy.js`, `visual-meaning.mjs` | yes |
| `page-preview.js` | a picture of a planned page, drawn from the plan only (never data) for the approval window and the lab page | a page's slots or files -> its SVG picture and the notes | `approval-view.mjs`, `plan-lint.mjs`, `twin-preview.mjs`, `theme-generator.js` | yes |
| **Right to left (the Arabic twin's engine)** | | | | |
| `report-mirror.js` | the right-to-left twin's page orchestration: each visual's transforms in their order (place, shadow, the charts, pills, tables and matrices, cards, text, padding, titles), each page with its units, the phone layout mirrored | a page's and visuals' JSON -> the mirrored JSON (never a file) | `twin-pages.mjs`, `twin-copy.mjs`, `twin-text-fit.mjs`, `arabic-lens.mjs`, `pbip-query.js` | yes |
| `mirror-policy.js` | the twin's named rules: which family a visual is, which axis is time, what keeps left to right in a mirrored box | a visual's JSON and the model's facts -> a named answer | `report-mirror.js`, `mirror-charts.js`, `twin-geometry.mjs` | yes |
| `mirror-charts.js` | the twin's chart transforms (axes, sort, legend, a donut's legend order, the right-to-left waterfall, the matrix's lab switch) and the PBIR writers they share | a visual, its kind and the model's facts -> the visual changed in place, its changes, kind, kept values and waterfall measures | `report-mirror.js` | yes |
| `mirror-text.js` | the twin's text runs and literals: what a reader sees that the report says, with stable ids, and the approved Arabic written back, on the page and the phone layout | a visual's (and its phone layout's) JSON -> its texts with ids; with the labels: the texts replaced in place, how many | `report-mirror.js` | yes |
| `mirror-units.js` | the twin's group and badge geometry: which visuals are mirrored as one (a badge on its tile, a bar list and its names), the frame each is placed in (`frameWidth`, the one home of that rule: a valid group's width, else the page's, else unknown), where each member goes | a page's visuals (and its width) -> the units, each visual's frame, each member's x in the twin | `report-mirror.js`, `twin-geometry.mjs`, `twin-text-fit.mjs` | yes |
| `arabic-names.js` | Arabic display names drafted from DataArcus's fixed report words, then approved by the person | the English names and the word list -> drafts; the approved names | `arabic-names.mjs`, `theme-generator.js` | yes |
| `visual-replace.js` | a custom visual's visual.json written as a native Power BI visual, after the person approved it | a visual's JSON and the mapping -> the native visual's JSON | `native-copy.mjs` | yes |
| **The SVG KPI designer** | | | | |
| `svg-kpi-compiler.js` | one design to a DAX measure that returns an SVG image URL, and the same SVG for the preview, from one expression tree | a design (layers, values, bindings) -> the DAX measure and the preview SVG | `report-fields.mjs`, `report-run.mjs`, `tools/svg-kpi-designer.html` | yes |
| `svg-expressions.js` | the expression tree and its closed evaluator (the preview) | a node and sample values -> its value | `svg-kpi-compiler.js`, `svg-codegen.js` | yes |
| `svg-codegen.js` | the tree printed as DAX (strings, numbers, measure names; a control character never written) | a node -> DAX text | `svg-kpi-compiler.js` | yes |
| `svg-escape.js` | the SVG text safety: escaping, colours and numbers the picture may hold | a text, a colour, a number -> the safe text | `svg-kpi-compiler.js`, `flip-cards.mjs` | yes |
| `svg-editor-store.js` | the designer's state, selection and undo history | commands -> the state and change events | `tools/svg-kpi-designer.html` | yes |
| `svg-editor-pointer.js` | the designer's canvas pointer: select, move with snapping, resize; one undo step a drag | the stage element, the store, the viewport -> store commands, render requests, the guides | `tools/svg-kpi-designer.html` | no: DOM (the stage it is given) |
| `svg-editor-panels.js` | the designer's panels: the layer list, the add bar, the properties and the data panel (English and Arabic) | the page's elements, the store, the designer's helpers -> the panels drawn, store commands, render requests | `tools/svg-kpi-designer.html` | no: DOM (the elements it is given) |
| `svg-kpi-templates.js` | the starter designs (data only) | none -> TEMPLATES | `tools/svg-kpi-designer.html` | yes |

### The browser pages' own scripts

In `assets/js/`. Each draws one page (or every page) and holds no engine logic the MCP needs.

| file | job | in -> out | used by | pure |
|---|---|---|---|---|
| `main.js` | every page's bootstrap (0.3.2 SP35): calls the three modules below in the order the one file ran them | none -> `SiteAnalytics.init()`, `SiteNavigation.whatsapp()`, `SiteAnalytics.banner()` at script time; `SiteNavigation.init()`, `SiteForms.init()` on DOMContentLoaded | every page (78 pages: `index.html`, `tools/index.html`, ...) | no: DOM |
| `site-navigation.js` | every page's navigation and effects: particles, AOS, the year, the navbar, the top offsets, a #section arrival, counters, the phone menu, the ripple, Escape, the blog's search and filters, the WhatsApp button, the live report facades (0.3.2 SP35) | the page's DOM, AOS and bootstrap -> DOM changes, and `dataarcus:embed` `{ dashboard }` per live report opened | every page (78 pages) | no: DOM |
| `site-forms.js` | every page's forms, tracking-free: the contact and beta forms sent to Web3Forms, messages in English and Arabic, the validation UX (0.3.2 SP35) | a form and its result box -> a JSON POST, DOM changes, and `dataarcus:lead` `{ formId }` after a sent form | every page (78 pages) | no: DOM, network |
| `site-analytics.js` | the analytics adapter and the cookie banner, the only site file that calls gtag or Clarity or touches `daConsent`; the tools send their events through its `window.dataArcusTrack` (0.3.2 SP35) | clicks, the page's events, `dataarcus:lead` `{ formId }` and `dataarcus:embed` `{ dashboard }` -> GA4 and Clarity events (each only when present), the consent choice | every page (78 pages) | no: DOM, storage, the global dataArcusTrack |
| `lang-manager.js` | the English and Arabic switch, the orchestration: the language from the address (`/ar/`), ?lang=, the saved choice or the browser; an explicit choice saved (storage, ?lang=, history); the switcher; switching to the other language's own address or in place; it calls the three `locale-*.js` below (each method a one-line call), which every page loads before it | the page's DOM and the translations -> the page in its language, the global langManager | every page (`index.html`, `tools/index.html`, ...) | no: DOM, storage, the global langManager |
| `locale-routes.js` | the locales (a descriptor each: language, direction, route availability), the Arabic copy's paths, the page-route table, one link's address on an Arabic copy, the other language's address | a path or address -> a path, an address, a boolean or the page's translation global's name (LocaleRoutes) | every page (`index.html`, `tools/index.html`, ...) | yes |
| `locale-catalog.js` | the dictionaries: the common one and the page's own loaded and merged, a dotted key looked up | the dictionaries and a key -> new dictionaries, or the text or "[Missing: key]" (LocaleCatalog) | every page (`index.html`, `tools/index.html`, ...) | yes |
| `locale-dom.js` | the page's language in the DOM: the translated elements and attributes, the Arabic copy's links, the direction and the Arabic fonts (moved as it was), the title and meta tags | a document, the lookup and the language -> that document changed (LocaleDom: translate, arLinks, direction, meta) | every page (`index.html`, `tools/index.html`, ...) | no: DOM (the document it is given, and this page's for the direction) |
| `theme-generator.js` | the Theme & Layout Generator page's orchestration: the preview cards, contrast, the theme JSON and the glass gate, a theme from a logo, the sample thumbnail, the steps bar, folds and the example; mounts the three modules below; every script it loads on demand, each with its ?v= stamp (the writer, the model reader, the names, the check, the preview, the worker) | the page's DOM -> the page drawn; the store, `L` and the loaders handed to its modules | `tools/power-bi-theme-generator.html`, `tools/power-bi-theme-generator-lab.html` | no: DOM, storage, network, browser files, the global __tgFoldSums |
| `theme-state-ui.js` | the generator's saved design: read back and repaired (the migration, the first visit's look), a store with get, update, replace, subscribe and save, and the page's other saved keys | `createStore({ storage, engine, key })` -> the store | `tools/power-bi-theme-generator.html`, `tools/power-bi-theme-generator-lab.html`, `ar/tools/power-bi-theme-generator.html` | yes |
| `theme-layout-ui.js` | the generator's controls (colours, presets, Generate, name, font, chart styles) and its layout step (page size, layout buttons, sizes, Advanced options, the canvas and the slot table) | `mount({ store, engine, $, L, isAr, track, toast, hooks })` -> the layout api (slots, boxes, page, direction, the renders) | `tools/power-bi-theme-generator.html`, `tools/power-bi-theme-generator-lab.html`, `ar/tools/power-bi-theme-generator.html` | no: DOM |
| `theme-download-ui.js` | the generator's download coordinator: theme JSON, copy, CSV, PNG, the Power BI project (model, logo, the Arabic names to approve, the check, the preview), the visual backgrounds and the reminder when a download is out of date; alone holds what was downloaded and the approved names | `mount({ store, engine, $, L, isAr, track, toast, layout, loaders, hooks })` -> `{ updateStatus, renderVis, layoutChanged, canvasFit }` | `tools/power-bi-theme-generator.html`, `tools/power-bi-theme-generator-lab.html`, `ar/tools/power-bi-theme-generator.html` | no: DOM, browser files |
| `model-health.js` | the Model Health Check page's orchestration: the file dropped or the sample, the state, the services the view calls (its worker, fix plan and drawing: the three rows above) | the page's DOM | `tools/power-bi-model-health-check.html` | no: DOM, storage, network, browser files |
| `model-health-worker.js` | the health check's worker: unzips the file in memory within limits, finds the model and report, runs the engine | a file's bytes (a message) -> the analysis (a message) | `health-worker-client.js`, `theme-generator.js` | no: worker, browser files |
| `measure-builder.js` | the DAX Measure Builder page: time intelligence measures (MTD, YTD, prior year, rolling, Ramadan vs last Ramadan, Eid) as one DAX script, one TMDL script or each measure | the page's DOM | `tools/dax-measure-builder.html` | no: DOM, storage, browser files |
| `licensing-calculator.js` | the licensing cost calculator: Pro, Premium Per User and Fabric for a number of creators and viewers, in USD, AED and SAR | the page's DOM | `tools/power-bi-licensing-cost-calculator.html` | no: DOM, storage, network |
| `dp600-sim.js` | the exam practice page's wiring (DP-600, or PL-300 by `window.EXAM`): the settings, the bank's index, the browser's storage, clock and random source handed to the four exam modules below, then the start by `?mode=` | the page's DOM | `tools/dp-600-practice-exam.html`, `tools/pl-300-practice-exam.html` | no: DOM, storage, network |
| `exam-grade.js` | the exam's grading (0.3.2 SP34) | a question and an answer, a mock's items -> a score 0..1, answered or not, a mock's score by domain, skill and renewal topic, a session's tally | `tools/dp-600-practice-exam.html`, `tools/pl-300-practice-exam.html` | yes |
| `exam-session.js` | the timed mock's state machine and the draw of a mock or a renewal (0.3.2 SP34) | question ids, choices and clock events, a random source and a storage adapter `{ load, store }` -> the session (current, flagged, the clock left, ended); each event saves through the adapter | `tools/dp-600-practice-exam.html`, `tools/pl-300-practice-exam.html` | yes |
| `exam-progress.js` | the saved progress and the study plan: streak, bookmarks, readiness, mistakes, skill accuracy (0.3.2 SP34) | a storage adapter `{ read, write }`, a clock and the bank's questions, domains and skills -> the progress state and the plan's rows (status keys; the words stay in the view) | `tools/dp-600-practice-exam.html`, `tools/pl-300-practice-exam.html` | yes |
| `exam-view.js` | the exam page's drawing and routing: every screen, the practice and mock choices, the timer (0.3.2 SP34) | the root element, the bank and the four modules -> the page's DOM | `tools/dp-600-practice-exam.html`, `tools/pl-300-practice-exam.html` | no: DOM |
| `svg-kpi-designer.js` | the SVG KPI Designer's editor: draw a KPI, bind its parts to measures, copy the DAX | the page's DOM | `tools/svg-kpi-designer.html` | no: DOM, storage, browser files |
| `page-toast.js` | the tool pages' short message and copy, in one place (0.3.2 DD2W): `toast` (the page's `#toast` by opacity, or a box by its class; each page's own time, 1800 or 2200 ms; a second call clears the first timer), `boxToast` (the exam and health check boxes, made once), `copyText` (the clipboard, else the node's text selected), `el` (an element with its class and text) and `saveState` (a page's state in localStorage, refused quietly; both 0.3.3 SG1); the one home of CONTRACTS.md's toast and copy fallback rows and of the page-el and page-save families | a message and the page's time, an id and a class, a text, a node and the page's two messages -> the DOM change (text, opacity or class, a selection) and the clipboard write | the pages' calendar-generator.js, measure-builder.js, theme-generator.js, svg-kpi-designer.js and theme-download-ui.js (the page's window), `exam-view.js` and `health-view.js` (require in Node), each as its own toast or copyText, loaded first by `tools/dax-calendar-table-generator.html`, `tools/dax-measure-builder.html`, `tools/power-bi-theme-generator.html`, `tools/power-bi-theme-generator-lab.html`, `tools/svg-kpi-designer.html`, `tools/pl-300-practice-exam.html`, `tools/dp-600-practice-exam.html`, `tools/power-bi-model-health-check.html` and their Arabic twins; el also `build-page.js` and `build-usage.js` (require in Node; `build/index.html` loads it before them), saveState also licensing-calculator.js (read from the page's window; `tools/power-bi-licensing-cost-calculator.html` and its AR copy load it first) | no: DOM, clipboard, timers |
| `build-helix.js` | the build page's DNA helix (0.3.2 BF1): one strand the integration branch (merges as nodes), the other the builder branches, a rung per job coloured by state; the three library (WebGL), or a still SVG where WebGL is missing | the builders' rows and the merges (`helixModel`), the page's element -> the helix drawn (canvas or SVG), a label on hover or tap | `build/index.html` | no: DOM (`helixModel` is pure; `mount` draws) |
| `build-usage.js` | the build page's Fuel panel (0.3.2 BF2): today's cost and tokens, builders vs workers vs probes, models, a 14-day chart drawn to scale, the last finished jobs, each job's cost for the helix label; every text from usage.json set with textContent | usage.json version 1 from the build-data branch, read through build-page.js's reader (`createClient`) -> the panel's DOM and `costOf(code)` | `build/index.html` | no: DOM, net (its helpers validate, fmtUsd, fmtMillions, dayBars, costById are pure) |
| `build-page.js` | the live build page (0.3.2 BF1): which builders are at work, CI now, the merges into integration, the release line, read from the public repo with an ETag cache and a rate-limit guard; every GitHub text set with textContent | GitHub's public API and raw files (fetch), a clock -> the page's sections | `build/index.html` | no: DOM, net (its helpers ago, jobCode, stateOf, buildersOf, ciRows, mergesOf, releaseLine are pure) |

### The MCP: reading

In `mcp/lib/`. A model and a report are read, never changed; their text is untrusted input.

| file | job | in -> out | used by | pure |
|---|---|---|---|---|
| `model.mjs` | a user's model from disk (TMDL, model.bim, .pbit), every path kept inside the working folder (the containment and the capped byte reads together); re-exports the name screen, the metadata and discovery's ReadError | a path -> the model's metadata (never data), or a coded error | every tool, `read-report.mjs`, `scope.mjs`, `report-run.mjs`, `server.mjs` | no: fs, env |
| `model-discovery.mjs` | which model a path or a plain name means, by listing folders only (no file opened, no link followed); candidate paths, which model.mjs checks (realIn) before any read; the reader's coded error | a folder or a name and the working folder -> the model folder, or ReadError (NO_MODEL_AT, NO_MODEL_NAMED, MANY_MODELS_NAMED, MANY_MODELS) | `model.mjs` | no: fs |
| `model-names.mjs` | the untrusted-text screen and how a name from a model or from disk is shown | a name -> the screened or shown name, and why | `model.mjs`, `model-metadata.mjs` | yes |
| `model-metadata.mjs` | the model's metadata adapted for the tools: the model however it is wrapped, the column types, the KPI targets | the loaded model object -> the adapted metadata | `model.mjs` | yes |
| `tool-names.mjs` | the tools by name, one list (a model's text that names one is flagged) | none -> TOOL_NAMES | `model-names.mjs` | yes |
| `scope.mjs` | large models: a summary first, details on request; the part of a model a request is about | the model and the request -> the scoped model or the summary | `read_model.mjs`, `suggest_fields.mjs`, `check_model_health.mjs`, `plan_layout.mjs`, `report-run.mjs` | yes |
| `hidden-names.mjs` | what a model hides and which of its names read like an instruction (flagged, never altered) | the model -> the hidden objects and the flagged names | `read_model.mjs`, `suggest_fields.mjs`, `check_model_health.mjs`, `report-result.mjs` | yes |
| `read-report.mjs` | what a PBIR report holds, read from its files (or memory) and never changed: its one read boundary (IO, limits, containment, the sources); a link inside the report recorded once by its path in the report (`addLink`) and named, capped, by `linksSaid`, the one list both answers call; re-exports the inventory | a report's folder -> its inventory (pages, visuals, fields, theme) | `read_report.mjs`, `check-report.mjs`, `plan-lint.mjs`, `redesign.mjs`, `twin-read.mjs`, `report-answer.mjs`, `report-inventory.mjs` | no: fs |
| `report-answer.mjs` | read_report's answer, fitted by listing fewer pages or visuals, never cut | an inventory -> the answer (text or JSON) | `read-report.mjs` | yes |
| `report-identity.mjs` | an existing report's theme identity, as a design needs it | the inventory's theme files and pages -> the identity | `read-report.mjs` | yes |
| `report-inventory.mjs` | the semantic inventory of a report: pages, visuals, fields, filters (never their values), texts screened, theme, bookmarks, custom visuals, what could not be read; opens no file | a source `{ dirs, files, has, json, sk }` (read-report.mjs's) -> the inventory | `read-report.mjs` | yes |
| `report-names.mjs` | the report names already in use beside a model, so a new report never takes one | a folder -> the names taken | `report-build.mjs`, `plan-lint.mjs`, `scope.mjs` | no: fs |
| `read-words.mjs` | the tools' words for the reading block's coded errors | an error code and its data (and the tool's `lang`, when given) -> the sentence | `tool-answer.mjs` | yes |
| `visual-meaning.mjs` | what a visual shows, from its data roles (the interpretation), and the orchestration of its native replacement: meaning, then ranking, then disclosure; the plan's entries | one visual of the inventory -> its meaning and its native replacement; an inventory -> the plan's entries | `report-inventory.mjs`, `native-copy.mjs` | yes |
| `visual-vocabulary.mjs` | the words that read a custom visual's role names and id | a role name, an id -> its words, class and hints | `visual-meaning.mjs`, `visual-candidates.mjs`, `replacement-disclosure.mjs` | yes |
| `visual-capabilities.mjs` | whether a native visual takes these fields in these roles, by Microsoft's capabilities and validator; the field-shape helpers | a visual type and its roles -> fits or not, with every problem | `visual-meaning.mjs`, `visual-candidates.mjs`, `replacement-disclosure.mjs` | yes |
| `visual-candidates.mjs` | the native visuals that could replace a custom one, ranked, the closer native and the second option, and the choice's confidence | a meaning (with its confidence and evidence) and the visual -> ranked candidates, the chosen and the second, the confidence | `visual-meaning.mjs`, `replacement-disclosure.mjs` | yes |
| `replacement-disclosure.mjs` | what the plan says about the chosen replacement: what is lost, the native settings, what a map needs, the sentence, the evidence, the plan's line | a meaning, the visual and the ranking -> nativeFor's answer; a plan entry -> its line | `visual-meaning.mjs` | yes |
| `same-question.mjs` | the number check, layer 1: does each visual of a copy ask the model the same question as the original's | two reports on the same model -> each visual's verdict | `check-report.mjs` | no: fs, env |

### The MCP: the approval gate

In `mcp/lib/`. Nothing is written before the person's click.

| file | job | in -> out | used by | pure |
|---|---|---|---|---|
| `plans.mjs` | the gate: plan ids, what each plan pins, the approval and the refusal | a proposal -> a plan id; an approval -> recorded; a write -> allowed or refused | every writing tool, `approve_plan.mjs`, `files.mjs`, `plan-keys.mjs` | no: env |
| `canon.mjs` | the canonical text of a plan, one copy (0.3.2 DD2C): JSON with keys sorted and undefined left out, the text every plan digest and binding is taken of | a value -> its text | `artifact.mjs`, `plans.mjs` | yes |
| `plan-keys.mjs` | what a plan is pinned to: the model's key and print, the inputs, the check right before a write | a model, the inputs -> the keys; a plan id -> same model or refused | `create_report.mjs`, `plan_layout.mjs`, `generate_theme.mjs`, `report-run.mjs` | no: fs |
| `approval-window.mjs` | DataArcus's own approval window: each window's life (open, wait, state, close) and the browser launch with the one-time link the AI never receives | a plan, its disclosure model, the decision callback -> the window opened, the person's click (or none) | `approve_plan.mjs` | no: process, env |
| `approval-http.mjs` | the window's HTTP side on 127.0.0.1: it alone owns the one-time secret, the Host and Origin checks, the headers and the call of the decision callback | a request, the window's hooks (find, seen, decide) -> the answer; a plan id -> its secret and link | `approval-window.mjs` | no: network |
| `approval-disclosure.mjs` | what each approval page says: the disclosure summaries in words (no HTML, no HTTP) | a plan's kind and data -> the disclosure model | `approval-window.mjs`, `approval-view.mjs` | yes |
| `approval-view.mjs` | the approval page's HTML: before the click, after it, and a link no longer valid (no secret, no request, no decision) | a plan's id and writes, the disclosure model (and the decision) -> the page's HTML | `approval-http.mjs`, `approval-window.mjs` | yes |
| `approval-ar.mjs` | the approval page's own words in Arabic, for an Arabic plan's page | an English label -> its Arabic | `approval-view.mjs`, `approval-disclosure.mjs` | yes |
| `answers.mjs` | the "Please confirm" answers file next to the model (`confirm-memory.js`'s records), written only through the gate | a model's path, the answers -> the records read; the file written | `check_model_health.mjs`, `approval-disclosure.mjs`, `approval-view.mjs` | no: fs |

### The MCP: the write path

In `mcp/lib/`. One write, all or nothing, never over anything.

| file | job | in -> out | used by | pure |
|---|---|---|---|---|
| `artifact.mjs` | the exact files a plan builds, checked, and their digest; the model's print | the built files, the model -> the checks and the digest | `report-run.mjs`, `create_report.mjs`, `twin-write.mjs`, `redesign.mjs` | no: fs, env |
| `files.mjs` | the one writer of new file trees (all or nothing, never over anything) and the one reader of a file the user names | a tree of files and a plan id -> written, or nothing | `create_report.mjs`, `twin-write.mjs`, `redesign.mjs`, `fix-scripts.mjs`, `sample-project.mjs` | no: env |
| `write-io.mjs` | one new file, never half-written; a failed write removes only what that call created | a path and bytes -> the file, or nothing | `files.mjs`, `model.mjs`, `answers.mjs`, `twin-write.mjs` | no: fs, env |
| `fix-scripts.mjs` | the TMDL fix scripts next to the model: their names, the write, the formats answer | the fixes, the folder -> the script written and what it says | `check_model_health.mjs`, `add_gulf_calendar.mjs`, `plan_layout.mjs`, `report-run.mjs` | no: fs |
| `model-script.mjs` | one helper for the model additions written as TMDL scripts (names that are free, the script file), a measure written 'T'[M] read (`keyOf`) and a JSON put back into the plan's file (`putJson`) (0.3.3 SG1: the ledger's measure-key and put-json) | the model's names, the lines -> a free name, the script | `flip-cards.mjs`, `metric-switcher.mjs`, `status-icons.mjs`, `dax-functions.mjs`, `gulf-calendar.mjs` | yes |
| `plain-words.mjs` | the words a person reads where they decide: what a script is, the 3 steps to apply it, where a file goes (English and Arabic) | a folder, a script -> the sentence | `approval-view.mjs`, `approval-disclosure.mjs`, `fix-scripts.mjs`, `plans.mjs`, `plan_layout.mjs` | no: fs |

### The MCP: create_report and its options

In `mcp/lib/`. One report's build, the same for the plan and the write.

| file | job | in -> out | used by | pure |
|---|---|---|---|---|
| `report-run.mjs` | one report's whole build, the facade: the inputs checked, the gate, the fields and the binding, the build (`report-build.mjs`), the check, the mode boundary (plan_layout's exact artifact or create_report's refusal) and the write with its answer | the inputs, the model, the plan -> the built files, the checks, the answer | `create_report.mjs`, `plan-artifact.mjs`, `plan_layout.mjs`, `plan-lint.mjs` | yes |
| `report-build.mjs` | one report's build from its binding and design: the pages (designed or hand-placed) written by the shared writer, the SVG columns and cards placed, the scripts it offers (metric switcher, Arabic calendar, flip cards, status icons, DAX functions, formats) joined, an Arabic report's texts isolated | the inputs, the model's metadata, the resolved fields, filters and SVG designs, the binding -> `{ files, warnings, scripts, built }` | `report-run.mjs` | yes |
| `report-inputs.mjs` | create_report's inputs (plan_layout takes them too), their defaults and what a plan pins of them | none -> the schemas, LOOK_DEFAULTS, REPORT_LOOK, reportPin | `create_report.mjs`, `plan_layout.mjs`, `report-run.mjs`, `plan-disclosure.mjs` | yes |
| `report-bind.mjs` | the report's field identities, formats and bindings | the model's metadata and the plan's options -> the binding | `report-run.mjs` | yes |
| `report-fields.mjs` | a report's fields resolved against the model: fields, page filters, SVG columns, cards, chart axes, relationships | the requested fields and the model -> the resolved fields and the problems | `report-run.mjs`, `create_report.mjs`, `plan_layout.mjs`, `suggest_fields.mjs` | yes |
| `report-result.mjs` | create_report's answer and its notes from the build | the build's metadata, the theme, the format script's answer -> the answer | `report-run.mjs` | yes |
| `report-said.mjs` | the sentences the run and plan_layout both answer with (flip cards, top N, card values, phone layout, the Arabic calendar) | the build's facts -> sentences | `report-run.mjs`, `report-result.mjs`, `plan_layout.mjs` | yes |
| `design.mjs` | the design tools' logic: a design from the tools' inputs, with every value not used said; a hand-placed report's font in its theme's primary text classes (`themeFont`, FT1) | the tools' inputs -> a design, the theme JSON, the slots; a theme and a font -> the theme with that font | `generate_theme.mjs`, `plan_layout.mjs`, `report-run.mjs`, `report-build.mjs`, `redesign-patches.mjs` | yes |
| `plan-lint.mjs` | the planned page linted before the plan is shown: built by the shared writer in memory, read back and checked | a design and fields -> the lint, the preview, the checks; the planned files -> what each page holds and every card on it (pagesWritten, cardsWritten) | `plan_layout.mjs`, `report-run.mjs` | yes |
| `plan-disclosure.mjs` | the plan's words: its look, the bilingual report's answer, an Arabic plan's title-language lines, the page size | a built plan -> what plan_layout's answer says | `plan_layout.mjs` | yes |
| `plan-headroom.mjs` | the plan answer's headroom: what it repeats said once before the cap must cut | a plan's answer -> the fitted answer | `plan_layout.mjs` | yes |
| `plan-variants.mjs` | plan_layout's two plans of their own kind: the sample and the redesign | the request (and the model plan) -> the plan | `plan_layout.mjs` | yes |
| `plan-artifact.mjs` | plan_layout's exact artifact: create_report's own build run with the plan's inputs, made one EN-AR report when asked, checked on every page, its digest | the normalized request, the plan's pin, the language -> `{ files, check, pin, modelPrint, digest, binding, ... }` or null | `plan_layout.mjs` | yes |
| `sample-project.mjs` | the sample project: a made-up Gulf retail chain to try DataArcus on, in English or Arabic | a folder, the language -> the sample's files, what is said | `create_report.mjs`, `plan-variants.mjs`, `sample-counts.mjs` | yes |
| `sample-counts.mjs` | the sample project's own distinct counts (made-up data, known from its definition) | the sample's path -> the counts, or none | `report-build.mjs` | no: fs |
| `metric-switcher.mjs` | the metric switcher: a field parameter and one slicer switch a page's charts between 2-5 measures | the measures chosen, the model -> the TMDL script and what is said | `report-build.mjs`, `report-inputs.mjs`, `plan_layout.mjs`, `check-report.mjs` | yes |
| `flip-cards.mjs` | flip cards: a KPI card turns over to a one-line description | the cards and the model -> the three Image visuals and the TMDL script | `report-build.mjs`, `plan_layout.mjs`, `approval-disclosure.mjs` | yes |
| `status-icons.mjs` | status icons before a table's measure by conditional formatting | the option, the model -> the rules and the TMDL script | `report-run.mjs`, `report-inputs.mjs`, `plan_layout.mjs` | yes |
| `dax-functions.mjs` | the DataArcus DAX function library (off by default): four user-defined functions and their measures in one TMDL script | the option, the model -> the script and what is said | `report-run.mjs`, `report-inputs.mjs`, `plan_layout.mjs`, `check-report.mjs` | yes |
| `display-names.mjs` | readable display names for database-style field names, each said in the plan | a field name -> its readable name | `report-bind.mjs`, `twin-texts.mjs`, `plan_layout.mjs` | yes |
| `glass-picture.mjs` | the glass page picture read back in Node: flipped for the Arabic pages, drawn small on the approval page | the engine's PNG -> its pixels, the flipped PNG, a preview URL | `plan-lint.mjs`, `twin-plan.mjs`, `twin-preview.mjs` | yes |
| `gulf-calendar.mjs` | add_gulf_calendar: the Calendar Generator's table (Hijri, Ramadan, Eid, the weekend, Arabic columns) as a TMDL script | the model, the country, the options -> the script and what is said | `add_gulf_calendar.mjs`, `check_model_health.mjs` | yes |
| `gulf-date-questions.mjs` | Gulf business dates and seasonal scope: which date, which grain, one Ramadan or every one, asked in English and Arabic | the model and the request -> the next question, or none | `plan_layout.mjs` | yes |
| `native-copy.mjs` | a report's custom visuals replaced by native ones in a new report "<name> native" | a report and the approved replacements -> the copy's plan, files and write | `create_report.mjs`, `plan_layout.mjs` | yes |

### The MCP: the redesign

In `mcp/lib/`. A lossless copy with allowlisted patches, never a rebuild.

| file | job | in -> out | used by | pure |
|---|---|---|---|---|
| `redesign.mjs` | the redesign's facade: the name, the schema and model checks, the plan put together, the copy, its check (independent of the patch records) and the write with its source-hash checks | a report, the design, the patches asked -> the plan; the copy written | `create_report.mjs`, `plan-variants.mjs` | yes |
| `redesign-grid.mjs` | the redesign's geometry: the units of visuals laid over others and the grid (two boxes overlapping: box-overlap.mjs, since DD2O) | a page and its top-level visuals -> the units and their fitted boxes | `redesign.mjs` | yes |
| `redesign-kinds.mjs` | the patch kinds, one entry each: the allowlist the copy and its check read (the planned ones off); every leaf pointer of a value (`leaves`, the ledger's leaves family, 0.3.3 SG1) | none -> the kinds, their checks and refusals | `redesign.mjs`, `redesign-patches.mjs`, `redesign-text.mjs` | yes |
| `redesign-patches.mjs` | the allowlisted patch records (place and size, static titles, theme tokens, the copy's name and id), each with its pointer, from and to and its kind's reason; why a visual is kept | a page's visual and what is asked -> the patch records, or the refusal | `redesign.mjs`, `redesign-text.mjs` | yes |
| `redesign-text.mjs` | the consistent copy's text: the text set, each visual's own settings removed, the theme's visual styles, the added theme file | the inventory, its theme and report.json, consistentText -> the text block, its patch records, each visual's removals | `redesign.mjs` | yes |
| `text-format.mjs` | each visual's own text formatting (font, size, bold, italic) by the theme's text class it overrides | an inventory and its theme -> the formats and the mixed ones | `check-report.mjs`, `redesign.mjs`, `redesign-text.mjs`, `redesign-kinds.mjs`, `approval-disclosure.mjs` | yes |

### The MCP: the checkers

In `mcp/lib/`. They read a report and never change it.

| file | job | in -> out | used by | pure |
|---|---|---|---|---|
| `check-report.mjs` | check_report's orchestration: Microsoft's validator offline, the schemas, the measured rules, the tool's own notes, the fix routes, the answer (capped); re-exports its parts' names | a report's path (and against, the original) -> `{ findings, notChecked, ... }` with each kind's counts | `check_report.mjs`, `create_report.mjs`, `plan_layout.mjs`, `artifact.mjs`, `arabic-lens.mjs`, `native-copy.mjs` | no: fs |
| `check-schema.mjs` | the bundled schemas (`mcp/schemas/`, offline): each JSON file checked against the schema it names; the validator's installed version | `{ reportDir, files, big }` -> `{ checked, errors, findings, notChecked, big }` | `check-report.mjs`, `check-impact.mjs` | no: fs |
| `check-impact.mjs` | each finding's kind (can break, Desktop opens, opened in Desktop, may look, a DataArcus rule) from the measured codes, the validator's known gaps, and the summary sentence; never a pass for what did not run | a finding -> its kind; the counts and what ran -> one sentence | `check-report.mjs`, `check-language.mjs` | yes |
| `check-redact.mjs` | check_report's one redaction boundary: a validator's or a schema's message without the report's names or values, paths and names cleaned; a path from the working folder, every part cleaned (`relOut`, the ledger's rel-out family) | a finding or a message -> what the answer may carry | `check-report.mjs`, `check-schema.mjs`, `arabic-lens.mjs` (relOut, 0.3.3 SG1) | yes |
| `check-language.mjs` | each page's language (Arabic or English), from its texts counted, never returned | the inventory and the rules' input -> `{ pages: { id: lang } }` | `check-report.mjs` | yes |
| `design-lint.mjs` | the design lint's adapter for the MCP (the lint itself is `layout-check.js`) | the inventory and the model's tables -> lint findings | `check-report.mjs`, `artifact.mjs`, `plan-lint.mjs` | yes |
| `arabic-lens.mjs` | check_report's Arabic lens: is this report ready for Arabic, per page, each finding with its fix in DataArcus's words | a report and its model -> the Arabic findings | `check_report.mjs` | yes |

### The MCP: the Arabic twin

In `mcp/lib/`. The right-to-left twin, the EN-AR copy and the bilingual report's Arabic half, step by step; every
Arabic page mirrors through `report-mirror.js`.

| file | job | in -> out | used by | pure |
|---|---|---|---|---|
| `arabic-twin.mjs` | the twin's entry: re-exports the steps' names others import | none -> the steps' exports | `create_arabic_twin.mjs`, `plan_layout.mjs`, `add_gulf_calendar.mjs`, `report-build.mjs`, `check-report.mjs` | yes |
| `field-key.mjs` | the twin's field key, written once: a field's key from its table and name (`fieldKey`), a typed `'Table'[Field]` read as a key (`keyOfText`), a key read back (`parseFieldKey`, `fieldOfKey`); a quote or bracket in a table name is quoted, a `]` in the field doubled, so two fields never share a key (0.3.3 DQ1, B-434) | table and field names, a key or a typed text -> a key, a pair or a name | `terminology.mjs`, `model-culture.mjs`, `twin-texts.mjs`, `plan_layout.mjs` | yes |
| `twin-read.mjs` | step 1: the original read strictly through the reading block (or from memory for a copy not yet written); the helpers every step uses; a path from the working folder, `..` kept (`pathOut`, the ledger's path-out family) | a report's folder -> its files in memory | `twin-plan.mjs`, `twin-pages.mjs`, `twin-copy.mjs`, `twin-write.mjs`, `native-copy.mjs` (pathOut, 0.3.3 SG1) | yes |
| `twin-texts.mjs` | step 2: the texts a reader sees, the person's Arabic labels and terms, what is not translated | the original's texts and the terms -> the Arabic texts and DAX | `twin-pages.mjs`, `twin-measures.mjs`, `twin-plan.mjs`, `twin-write.mjs` | yes |
| `twin-model.mjs` | step 3: the model next to the report: date tables (time left to right), the Arabic month column's offer, the right-to-left waterfall's facts | the model -> its date tables and offers | `twin-measures.mjs`, `twin-plan.mjs`, `arabic-twin.mjs` | yes |
| `twin-copy.mjs` | step 4: English and Arabic in one report "<name> (EN-AR)": the language buttons, their tab order, the pages, links and bookmarks | the original and its twin pages -> the copy's files | `twin-plan.mjs`, `twin-write.mjs`, `native-copy.mjs`, `redesign.mjs` | yes |
| `twin-pages.mjs` | step 5: the pages mirrored and fitted for the Arabic texts, in one order (buildTwin: the measures, the mirror, the geometry, the fitting, a table's view, the phone's tabs; keepSize last, at 75 % and 60 px) | one page and its visuals -> the Arabic page, its changes and what is said | `twin-plan.mjs` | yes |
| `twin-text-fit.mjs` | step 5a: the text, button and header fitting of one mirrored page for Arabic | one page's twin -> its fitted texts | `twin-pages.mjs` | yes |
| `twin-geometry.mjs` | step 5b: the geometry of one mirrored page (badges, tables, a heatmap's chart, indentation, the icon's room) | one page's twin -> its fixed boxes | `twin-pages.mjs` | yes |
| `twin-measures.mjs` | step 5c: the twin's measures: its own copy of reportExtensions.json, the Arabic title and text measures, the waterfall's and the row labels' (each name free), every visual moved to them | the report's measures, the approved texts -> the twin's measures, each visual rewired, what is said | `twin-pages.mjs` | yes |
| `twin-visuals.mjs` | the PBIR visual helpers the steps share: a box, a type, literals, overlaps (box-overlap.mjs's, re-exported since DD2O), new ids, a text's look | a visual -> its parts | `twin-pages.mjs`, `twin-copy.mjs`, `twin-geometry.mjs`, `twin-text-fit.mjs`, `twin-measures.mjs` | yes |
| `twin-calcs.mjs` | the visual calculations whose result depends on the visual's order (turned in a mirrored visual), found by structure | a visual's projections -> the order calculations and what is said | `twin-plan.mjs`, `approval-disclosure.mjs` | yes |
| `twin-pictures.mjs` | the pages drawn on a picture: each picture flipped for the Arabic page, a picture with words asked first | the pages' pictures -> the flipped pictures, what is said | `twin-plan.mjs`, `twin-write.mjs` | yes |
| `page-picture.mjs` | a page's picture read (PNG or JPEG, by its own readers), flipped left to right and written as a PNG | the picture's bytes -> the flipped PNG; the panels' boxes | `twin-pictures.mjs`, `twin-geometry.mjs` | yes |
| `twin-plan.mjs` | step 6: the plan, the twin or the copy built in memory, the answer's room | the original, the model, the options -> the plan | `arabic-twin.mjs`, `twin-write.mjs` | no: fs |
| `twin-preview.mjs` | step 7: the twin's pages drawn on the approval page from the plan's own build | the plan's build -> the pages' pictures | `arabic-twin.mjs` | yes |
| `twin-write.mjs` | step 8: the write, exactly the files the plan kept, after the person's go | a plan id -> the twin's files written, or nothing | `arabic-twin.mjs` | no: fs |
| `model-culture.mjs` | Arabic names in the model itself: one TMDL script, a `cultureInfo` per Gulf culture from the terms approved | the approved terms -> the culture script | `twin-plan.mjs`, `twin-write.mjs`, `create_arabic_twin.mjs` | yes |
| `terminology.mjs` | the Arabic terminology sheet: one approved English / Arabic alias per field, the same everywhere in the Arabic report | a report and the answers -> the sheet's rows and places | `twin-texts.mjs`, `twin-plan.mjs`, `arabic-lens.mjs`, `create_arabic_twin.mjs`, `plan_layout.mjs` | no: fs |
| `arabic-names.mjs` | proposed Arabic display names, only from a fixed glossary of report words, for the person to approve | the fields' names -> the proposals | `plan_layout.mjs`, `twin-texts.mjs` | no: fs |
| `arabic-terms.mjs` | DataArcus's own Arabic vocabulary: one term per concept, and the check of a text against it | a text -> the terms that differ | `terminology.mjs` | no: fs |

### The MCP: what leaves the server, and the tools' helpers

In `mcp/lib/`. Every answer, the instructions, and what more than one tool uses.

| file | job | in -> out | used by | pure |
|---|---|---|---|---|
| `answer.mjs` | what leaves the server in an answer: every format character of a name written visibly, the answer capped and fitted | an answer -> the answer sent | `tool-answer.mjs`, `scope.mjs`, `report-answer.mjs`, `twin-plan.mjs` | yes |
| `agent-text.mjs` | the server's instructions and the tool descriptions' shared sentences, from the tools' own limits | none -> the instructions and the shared texts | `server.mjs`, every tool | yes |
| `tool-answer.mjs` | how every tool answers: the text scrubbed of local paths and capped, the errors, safe() around each handler (a write tool's own `lang` is told from an absent one once, `langGiven`) | a tool's result or error -> its answer | every tool | no: fs |
| `tool-inputs.mjs` | the input schemas more than one tool takes (zod) and what a tool does to the user's files | none -> the schemas and annotations | every tool, `report-inputs.mjs` | yes |
| `tool-limits.mjs` | the tools' limits and the visual kinds a slot can be: one list | none -> LIMITS, VISUAL_KINDS | `server.mjs`, `tool-inputs.mjs`, `report-inputs.mjs`, `read_model.mjs` | yes |
| `small-cache.mjs` | the MCP's small cache, one copy (0.3.2 DD2P): the last few results kept, the least recently used dropped first | a size -> `{ get, set }` | `glass-picture.mjs`, `page-picture.mjs` | yes |
| `box-overlap.mjs` | two boxes on a page, one copy each (0.3.2 DD2O): do they overlap by more than a rounding (`overlaps`), the area they share (`overlapArea`); the one home of the ledger's overlap and overlap-area families | two boxes (`{ x, y, width, height }` or `{ x, y, w, h }`) -> true or false; an area | `twin-visuals.mjs` (re-exports overlaps, the same function, for the twin's copy and text fit), `redesign-grid.mjs`, `twin-geometry.mjs`, `page-picture.mjs` | yes |
| `path-rules.mjs` | the MCP's path rules, one copy each (0.3.2 WN1, Codex's Windows review): inside or outside a folder (`outsideRel`, `within`: exactly '..', '..' and a separator, or absolute; a folder named "..draft" is inside), the same path or name where the system ignores case (`samePath`, `sameName`, `sameOnDisk`), the longest path a write makes against the system's limit (`pathMax`, `longestPath`, `tooLongSaid`: Windows 259) | paths (and the path module and platform, for a test of Windows on any system) -> true or false; the longest path over the limit, or null | `model.mjs`, `write-io.mjs`, `read-report.mjs`, `plain-words.mjs`, `check-report.mjs`, `artifact.mjs`, `sample-counts.mjs`, `files.mjs` (writeTree), `plan_layout.mjs`, `create_arabic_twin.mjs`, `redesign.mjs` (sameOnDisk), `report-build.mjs` (sameOnDisk) | no: fs (sameOnDisk reads a real path; nothing written) |
| `box-diff.mjs` | research code (not loaded by the server): two drawings of a page compared box by box | two drawings -> their overlap scores | none (a test) | yes |
| `shadow-model.mjs` | research code (not loaded by the server): a shadow of a model, so Desktop draws a report without the model's data | a model's metadata -> the shadow's files | none (a test) | yes |

### The tools

In `mcp/tools/`. Each exports `register(server, ctx)`; `server.mjs` registers them in the order tools/list shows
them. A tool's inputs and answer: [TOOLS.md](../TOOLS.md).

| file | job | in -> out | used by | pure |
|---|---|---|---|---|
| `read_model.mjs` | read_model: a model's tables, columns, measures and relationships (metadata only; large models summarised) | a model's path -> its metadata | `server.mjs` | yes |
| `suggest_fields.mjs` | suggest_fields: which of a model's fields fit each visual | a model's path and the visuals -> the suggestions | `server.mjs` | yes |
| `check_model_health.mjs` | check_model_health: the health check, the Gulf calendar check, the questions and the fix scripts' plan | a model's path -> findings, score, questions; a plan id for the scripts | `server.mjs` | yes |
| `generate_theme.mjs` | generate_theme: a Power BI theme from a design (or an existing report's), written after approval | a design -> the theme JSON; a plan id, then the file | `server.mjs` | yes |
| `plan_layout.mjs` | plan_layout: the report's plan (or the sample's, the redesign's, the native copy's; with languages en+ar, both halves) built with the writer's own build and checked | the request and the model -> the plan and its planId | `server.mjs` | yes |
| `approve_plan.mjs` | approve_plan: opens the approval window; only the person's click approves | a planId -> approved or not | `server.mjs` | no: env |
| `create_report.mjs` | create_report: writes exactly the approved report (or redesign, native copy, sample) | a planId and the inputs -> the files written | `server.mjs` | yes |
| `add_gulf_calendar.mjs` | add_gulf_calendar: the Gulf calendar table as a TMDL script, planned then written | a model's path and options -> a plan id, then the script | `server.mjs` | yes |
| `read_report.mjs` | read_report: what a PBIR report holds | a report's path -> its inventory | `server.mjs` | yes |
| `create_arabic_twin.mjs` | create_arabic_twin: the right-to-left Arabic twin, the EN-AR copy or the bilingual report, planned then written | a report's path and the Arabic options -> a plan id, then the files | `server.mjs` | yes |
| `check_report.mjs` | check_report: the validator, the measured rules, the Arabic lens and the number check on any report | a report's path -> the findings | `server.mjs` | yes |
