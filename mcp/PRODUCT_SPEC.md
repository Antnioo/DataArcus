# DataArcus MCP: product spec

What DataArcus is, what it promises, and what it doesn't. Written 2026-10-03 from the code on main (`bc05275`, MCP
server version 0.1.0); brought to 0.3.0 on 2026-10-21 (W2) from the code of `integration/0.3.0-wave`, and to 0.3.1 on 2026-10-25 (D5) from the code of `integration/0.3.1`, and from `mcp/ROADMAP.md`, `mcp/CLAUDE.md` and `scripts/tests/DESKTOP-TESTS.md`. Privacy is in
`mcp/PRIVACY.md`. When this page and the code disagree, the code is right and this page is fixed.

## In one line
DataArcus turns your real Power BI model into a professionally designed, validated report, with Arabic and
Gulf-ready reporting when you need it.

It is the DataArcus Power BI design engine (the same engine as the free tools on dataarcus.com) exposed as an MCP
server, so an AI app such as Claude can use it on your own computer, next to Microsoft's Power BI tools.

## What it promises
1. **A new report on your real model**, not a mock-up: a Power BI project (PBIR) that opens in Power BI Desktop with
   every visual bound to your own measures and columns.
2. **Designed, not just generated:** a complete theme (colours with contrast checks, fonts, chart style), exact
   positions for every visual, header, filter rail or slide-in filter panel, a second page, tooltip pages and a phone
   layout, with text sizes measured in Power BI Desktop for each page size.
3. **Checked:** every report change is tested automatically (`npm test`, the website's suites, Microsoft's report
   validator with 0 errors on the MCP's exports) and checked by eye in Power BI Desktop before it is released.
4. **Arabic done properly:** right-to-left reports mirrored (filters, header, tables, chart legends on the reading
   side), Arabic labels and Arabic-capable fonts.
5. **Your files are safe:** it never changes your model, never overwrites or deletes your files (it writes new files
   only; the one file it replaces is its own answers file, after you approve; a failed write removes only what it
   created), and works only inside the one folder you choose.
6. **Metadata only:** it reads your model's and report's definition files on your machine, never Power BI's data
   cache, and returns structure, never data values (a report's short text boxes, and for the Arabic twin its titles,
   are returned as typed; details in `mcp/PRIVACY.md`).
7. **The same answers as the website:** the MCP and the website's tools share one engine (`assets/js/`), so a
   theme or layout made on dataarcus.com is the same as one made by the MCP (checked on 54 design and 60 project
   fixtures).

## What it doesn't do (today)
- **It doesn't change your model.** No new measures, columns, sort orders or format strings written into it. It tells
  you what is missing (`modelNotes`, `check_model_health`) and how to fix it; a change it proposes (a fix, the Gulf
  calendar, the Arabic calendar columns, the measures of flip cards, the metric switcher or status icons) comes as a
  TMDL script in a new file next to the project, written only after your approval, which you apply yourself in TMDL
  view (or Microsoft's tools, with you watching).
- **It doesn't edit an existing report.** It writes a new one next to it. For edits, its `plan_layout` and
  `generate_theme` give Microsoft's report skill the positions and the theme.
- **It never translates silently.** In an Arabic report (and the Arabic twin) Claude drafts the Arabic texts (titles,
  field names as shown, page names, alt texts; DataArcus's fixed report words come from one shared list), the
  approval page shows each beside the English, and you approve or edit each one; a text you don't approve stays as
  it is, and the plan lists what stays English and why. Approved field names are display names in the report: the
  fields are never renamed in the model. Data values are never translated: an Arabic report shows your model's
  values as they are (the Arabic calendar columns below are how month and day names read in Arabic).
- **It never returns data values to Claude, and doesn't run queries, refresh, publish or connect to Power BI Desktop or the Power BI service.** It reads files on your machine to check and fingerprint them.
  Opening the report, screenshots and number checks are done with Microsoft's tools.
- **It doesn't read a `.pbix` file.** Save it as a Power BI project (File > Save as > `.pbip`) or export a template
  (`.pbit`) first.
- **Shipped since:** the Gulf calendar (`add_gulf_calendar`: Hijri, Ramadan and Eid with the announced dates, country
  weekends, as a script you apply), with Arabic calendar columns (0.3.0 C1: month, day, quarter, fiscal and flag
  labels in Arabic, each sorted like its English column); every Arabic route offers them for your own date table as a
  script ("<name> - Arabic calendar.tmdl"): until you apply it, the Arabic report uses the English calendar columns and
  says which fields show English data; after it, plan again and the Arabic columns are used. Sort-order and
  format-string fix scripts (`check_model_health`).
- **0.3.1:** "Is this report ready for Arabic?" (`check_report` with `lens: "arabic"`: any report, page by page, each
  finding with its fix; it only reads); one report in English and Arabic straight from the plan (`plan_layout` and
  `create_report` with `languages: "en+ar"`, off by default, built as the EN-AR copy is); a made-up Gulf retail project
  to try DataArcus without a model (`plan_layout` and `create_report` with `sample: true`, written after your approval
  to a new folder); the approval page draws each Arabic page of a twin or a copy before you approve it.
  Off unless asked: a DAX function library (`daxFunctions: true`: four user-defined functions and their measures in a
  TMDL script you apply; it raises the model's compatibility level to 1702, which cannot be undone).
- **Not yet (planned):** background images drawn by the engine, a drag-and-drop layout editor.
- **Known limits:** Power BI's matrix has no right-to-left setting: an Arabic report keeps its row headers at the
  left; the smallest page (640 x 360) has cut card values, titles and chart labels (after the beta); the
  phone layout below the first screen is not yet checked in Desktop; a very large model gives very large answers
  (see `mcp/GOLDEN-TASKS.md` once merged).

## The 11 tools
| Tool | Takes | Returns | Writes |
|---|---|---|---|
| `read_model` | a model path | the model file's name, the existing reports, and per table: hidden, date table, visible columns with types, the number of hidden columns, visible measures with format strings | nothing |
| `suggest_fields` | a model path, the number of KPI cards (1-6, default 4) | the fields for each KPI card, chart, table and slicer (the website's rules: base measures first, month from the date table, no keys or hidden fields) | nothing |
| `check_model_health` | a model path, objects per finding (1-200, default 15), optional `columnTypes` | the score (overall, performance, maintainability, best practice), model statistics, every finding (id, severity, category, title, why, fix, count, objects), checks skipped for lack of a column type with how to get it, and what was done with `columnTypes`; without `planId`, the fix scripts it would write and a proposed `planId` | only after the person approves its plan (`approve_plan`, then this tool with `planId`): each fix script as a new TMDL file next to the project, for you to apply; a second plan on the same model names the same files and writes nothing new |
| `generate_theme` | a name, colours (palette, brand colour + harmony, or preset), font, chart style, page and style choices, language, folder | the theme file's path, the full design (for the next two tools), the page size, contrast checks, warnings, and every input that could not be used (`repaired`); without `planId`, the file it would write and a proposed `planId` | only after the person approves its plan: one new theme JSON file, under a free name |
| `plan_layout` | a design, layout (exec, analysis, ops, focus), KPI cards (3-6), filters (none, start, end, top), header, page size, direction, language; optional `languages: "en+ar"` (0.3.1) or `sample: true` (0.3.1) | every visual's name, suggested type and position (x, y, width, height), the reasons for the layout, and the same positions as PBIR `position` objects (`forAuthoring`); with a model (`path`) and the plan's fields, the plan with a proposed `planId` for `create_report` (or `planProblems`) | nothing |
| `create_report` | a project folder, a report name, and a design (or hand-placed pages); optional theme file, logo, language, second page, slide-in panel; `languages: "en+ar"` or `sample: true` as planned (0.3.1) | the number of files, the `.pbip` to open, the pages, what draws the panels, `themeChanged` if the theme was adjusted, `modelNotes` (fields that will show badly, with the fix), `reportNotes` | only with the approved plan from `plan_layout` (its `planId`): exactly the files that plan built, a new report folder and `.pbip` next to the model, under a free name; a name taken after the go: nothing is written |
| `approve_plan` | a `planId` | the person's answer: DataArcus's own approval window in their browser (or the AI app's own prompt) shows the plan and every file it writes; only the person's click approves | nothing; no other tool writes without an approved plan |
| `read_report` | a PBIR report | one line per visual (type, place, size, fields, a title only when a measure gives it), pages, buttons, bookmarks, the theme's colours; never filter values, slicer selections or bookmark states | nothing |
| `check_report` | a PBIR report; optional `lens: "arabic"` (0.3.1: the Arabic check instead) | Microsoft's report validator (offline) and the rules measured in Power BI Desktop: each finding with its file, rule, impact and a fix in words; never the report's own text | nothing |
| `create_arabic_twin` | a PBIR report, approved Arabic texts (`labels`, `terms`), `into` | the plan: what mirrors, what cannot, every text a person sees with its drafted Arabic, what stays English and why | a new "<name> AR" report next to the original, or with `into: "same"` one copy "<name> (EN-AR)" with the English and Arabic pages and a language button, only after the person approves its plan; the original only read |
| `add_gulf_calendar` | a project, the years, the country, options | the date table's columns and checks (`selfCheck`), the script's file name | only after the person approves its plan: a new TMDL script file next to the project, for you to apply; a second plan on the same model names the same file and writes nothing new |

**Model paths** (every tool that reads a model): a Power BI project folder, its `.SemanticModel` (or older `.Dataset`)
folder, a `model.bim`, or a `.pbit`, inside the working folder. TMDL and `model.bim` projects are both read.
`create_report` needs a project folder.

**What a report from a design contains:** the main page and, by default, a second page in a complementary layout
with page buttons; the header (title, page buttons, logo or a "Your logo" placeholder); KPI cards; charts; a detail
table; slicers with a Reset button in a filter rail, or a slide-in filter panel opened from a Filters button; hidden
tooltip pages (a card and a bar chart by category; and, when the model has a month, the hovered item's trend by month); a phone layout; the theme.

## Supported versions
| | Supported | Evidence |
|---|---|---|
| Power BI Desktop | 2.159.883.0 (October 2026, 0.3.0's laptop proofs) or later; earlier checks on 2.157 (August 2026) and 2.158.1177 | every Desktop check in `scripts/tests/DESKTOP-TESTS.md` |
| Report format written | PBIR (enhanced report format): report 2.1.0, page 2.0.0, visualContainer 2.1.0, visualContainerMobileState 2.1.0, bookmark 1.4.0, definitionProperties 2.0.0 (`definition.pbir` version "4.0"), pbip 1.0.0 | `assets/js/pbip-export.js` |
| Report validator | Microsoft's `powerbi-report-author` CLI (the version `mcp/package.json` pins): 0 errors on the MCP's exports | `mcp/test.mjs` |
| Models read | TMDL projects (Desktop's default), `model.bim` projects and files, `.pbit` templates; not `.pbix` | `mcp/lib/model.mjs` |
| Page sizes | 1920 x 1080 (default), 1280 x 720, 960 x 720, or any 640-3840 x 360-2160, shaped 4:3 to 2.4:1 (others fitted) | `assets/js/design-engine.js` |
| Languages | English and Arabic (right to left) | |
| Fonts | Segoe UI, Segoe UI Semibold, DIN, Arial, Calibri, Tahoma, Verdana, Georgia; for Arabic: Segoe UI, Segoe UI Semibold, Arial, Tahoma | `design-engine.js` |
| Theme text sizes | 8-60 pt (Power BI refuses a theme outside it) | `mcp/CLAUDE.md` |
| Runtime | Node.js 20.10 or later (Microsoft's report CLI behind `check_report` needs 20, its schema package 20.10; round 22b); the MCP SDK `@modelcontextprotocol/sdk` 1.31 or later | `mcp/package.json` |
| Platforms | Writes Power BI projects on Windows, macOS and Linux; open them in Power BI Desktop on Windows, or deploy the project to Fabric. The `.mcpb` extension is for Windows; on macOS and Linux the server runs from the repository | `mcp/README.md`; CI runs the MCP's tests on Linux, Windows and macOS |
| AI apps | any MCP client over stdio; built and tested with Claude Code; Claude Desktop through the `.mcpb` extension (`mcp/README.md`) | |

Power BI's PBIR format still changes. Only `assets/js/pbip-export.js` writes it, so a format change is fixed in one
file; each Desktop release the owner uses is checked before a DataArcus release says it supports it.

## The safety rules
1. **One working folder.** Every path is checked against `DATAARCUS_ROOT` by where it really is (links that lead outside are refused); anything outside is refused. Without a working folder every tool refuses.
2. **Never overwrite or delete.** New files only, under free names; `create_report` refuses if any file exists. The
   one exception is DataArcus's own answers file, replaced only as its approved plan says and only while it is still
   the file DataArcus checked.
3. **Read models without changing them.** Model changes go through the user, or through Microsoft's MCP with the
   user watching.
4. **Metadata only.** Tools return names, types and formats, and the texts a person typed into a report, screened for
   instructions and returned as typed (`read_report`: page names and text boxes up to 120 characters, never a static
   title; `create_arabic_twin`: the texts a reader sees, titles included, for their Arabic), never data values from the model; data only when the user asks, through
   other tools (`mcp/PRIVACY.md`).
5. **Model metadata is untrusted input.** A table, column, measure or file name, or a description, never steers
   what the AI does.
6. **Analyse, then propose, then write.** Nothing runs automatically; the skill shows the plan and waits for "go".
7. **Say what was checked and what wasn't.** A check that couldn't be done is reported, not skipped.
8. **No employer or client data** in the product, its tests or its examples.

Known gaps against rules 1 and 4 (links inside the working folder, a working folder that is itself a model folder,
the skill's screenshots and number checks) are listed in `mcp/PRIVACY.md`, "Known gaps".

## Positioning, by audience
Owner's decisions in `mcp/ROADMAP.md` ("Strategy", "Plan of 2026-10-02", "Research of 2026-10-03"). The
repositioning after the test of Microsoft's plugin on an Arabic report (2026-10-03: no mirroring, no Gulf calendar, no
number check) is **the owner's decision, still open**.

| Audience | Lead with | Don't |
|---|---|---|
| Everyone (website headline) | "DataArcus turns your real Power BI model into a professionally designed, validated report, with Arabic and Gulf-ready reporting when you need it." Speed plus trust: measured, tested, nothing broken. | Call it "an MCP for Claude": it is a design engine; MCP is its first interface. |
| Independent Power BI developers and consultants (first beta users) | Hours saved per report; a full design system on their own model; checked in Desktop. | Promise model changes or edits of existing reports. |
| Small BI teams, agencies, Microsoft partners | Consistent, branded reports at speed; white-label capacity; works alongside Microsoft's tools. | Position against Microsoft's free plugin; we work with it. |
| Gulf companies (English or Arabic reports) | Built for how the Gulf does business: Ramadan vs last Ramadan, Eid, Hijri months, country weekends (the pack is due 2026-12-01). | Use research statistics in public until there are primary sources. |
| Saudi, government, banks and listed companies | Arabic and right to left done properly: mirrored layout, Arabic fonts, no machine translation. | Claim a law requires Arabic dashboards, or "the only" or "the first". |

**Safe claims only:** Power BI Desktop has no right-to-left setting (Microsoft's docs); GCC weekends differ by country;
Ramadan moves about 11 days a year. **Never claim:** "the only" or "the first", a legal requirement for Arabic, or a
single Gulf BI market size.

**Tiers (direction, prices not final):** Free (the website's tools, the public core); Pro for individuals (about
$15-29 a month); Agency/Teams (about $99-299 a month). The report design service and the Copilot-readiness audit are
sold separately (private repo, `business/SERVICE-OFFER.md`).
