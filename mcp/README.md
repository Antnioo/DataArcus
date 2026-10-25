# DataArcus MCP

## Claude Desktop (beta)

For testers on Windows, no command line needed.

1. **Power BI Desktop 2.159.883.0 (October 2026) or later**, the lowest version the 0.3.0 laptop proofs ran on
   (Help > About shows yours; the Microsoft Store version updates itself), and save your reports as Power BI projects
   (File > Save as > `.pbip`).
2. **Get the extension:** download the latest `.mcpb` file (for 0.3.0, `dataarcus-0.3.0.mcpb`) from
   https://github.com/Antnioo/dataarcus-releases/releases into your Downloads folder. **Check it** against the SHA-256
   in that release's notes: open a Command Prompt in the Downloads folder and run
   `certutil -hashfile "dataarcus-0.3.0.mcpb" SHA256` (or in PowerShell, `Get-FileHash "dataarcus-0.3.0.mcpb"`). The two
   must match before you install; if they don't, delete the file and download it again.
3. **Install it:** with Claude Desktop installed, double-click the `.mcpb` file and choose Install (if Windows asks
   which app opens the `.mcpb`, choose Claude). Or, in Claude Desktop: Settings > Extensions > Advanced settings >
   Install Extension..., then pick the `.mcpb` file. Settings > Extensions then shows "DataArcus for Power BI".
   **To update**, open the new `.mcpb` the same way: the button says Update, then Windows asks Install.
4. **Choose the working folder** when asked (the setting is called **Working folder**): the folder that holds your
   `.pbip` projects. DataArcus reads and writes only inside it; put in it only models whose names, types and formats
   you may share with Claude.
5. **Check it:** in a new chat, ask "list your DataArcus tools". Claude lists 11 tools (`read_model`, `suggest_fields`,
   `check_model_health`, `plan_layout`, `approve_plan`, `create_report`, `create_arabic_twin`, `read_report`, `check_report`, `generate_theme`, `add_gulf_calendar`).
6. **Try the sample** (no model needed): ask "show me what DataArcus can do". Claude plans a made-up Gulf retail
   project (a model with 18 months of made-up sales, a date table and an empty report), you approve it in DataArcus's
   approval window, and it is written to a new folder `Gulf Retail Sample` in the working folder. Open its
   `Gulf Retail.pbip` in Power BI Desktop and click Refresh; Claude then offers 4 next steps on it (a first report, the
   same report in English and Arabic, the Gulf calendar, "is it ready for Arabic?").
7. **First prompt on your own model:** "Read the model in <folder> and suggest a report", with `<folder>` the name of a
   project folder inside the working folder.
8. **Where reports go:** a new report is written next to its model, inside the working folder, as `<name>.pbip` plus
   `<name>.Report`; it never writes over an existing report. Open the `.pbip` in Power BI Desktop.
9. **Remove it:** Settings > Extensions > DataArcus for Power BI > Uninstall. Your reports stay where they were written.

## Claude Code and other MCP clients (developers)

The commands below are for developers using Claude Code or another MCP client.

The engines behind dataarcus.com's Power BI tools, as an MCP server for Claude Code (or any MCP client).
It works next to Microsoft's Power BI Authoring MCP server (model edits, DAX queries) and the Power BI Desktop bridge (reload, screenshots).

| Tool | What it does |
|---|---|
| `read_model` | Tables, visible columns with types, measures with formats, date tables. Reads a project folder (TMDL or model.bim), a model.bim or a .pbit. `existingReports`: the names of the reports already beside the model (a new report never takes one). Changes nothing. A large model (a full answer over 40,000 characters) gets a summary first: counts, the date tables, the areas (measure display folders), the tables with measures and the other tables' names. `tables: [...]` returns named tables in full, on any model. |
| `suggest_fields` | Which measures and columns go in each KPI card, chart, table and slicer (same rules as the theme generator). Optional `focus` (a word the user said, such as "logistics") or `tables`: the picks then come from that part of the model (the matching tables with measures, the tables related to them, the date tables). A large model needs one: without it nothing is picked and the areas are listed. |
| `check_model_health` | The Model Health Check (the same engine as the website's): score and every finding with its objects and its rule's source (a Microsoft Learn page, a Microsoft Best Practice Analyzer rule, or a DataArcus rule with its reason). Only the reports whose `definition.pbir` points at the checked model are read (`reports.counted`); another project's reports in the same folder, and reports connected to a published model, are named with why under `reports.notCounted` and never read. Reads a project folder (TMDL or model.bim), a model.bim or a .pbit. On a TMDL project, checks that need the type of a DAX table's column are listed as skipped (the files don't have it), with how to get them. Optional `columnTypes` (`{ "Table[Column]": type }`, read from the same model open in Desktop) fills those types, so every check runs; types the files give are never replaced, and names or types that can't be used are listed back. Fix scripts are written only with an approved `planId` (without one the findings come back, the script files are named and a `planId` is proposed). Returns `fixes` for three findings (`MONTH_SORT`, `NO_FORMAT`, `PCT_FORMAT`): a TMDL script to paste into Desktop's TMDL view, the suggested format and its reason per measure, and steps by hand for what a script can't change safely; nothing is ever applied. Optional `weekStart` (`sunday` by default, `monday`, `saturday`) for a weekday number the sort script adds. For a Gulf model: optional `country` (`uae`, `ksa`, `qat`, `kwt`, `bhr`, `omn`) adds a `gulfCalendar` section, **not part of the score**: whether the calendar has Hijri, Ramadan and Eid columns and the model has Ramadan and Eid measures; for a calendar made by the DataArcus Calendar Generator also its weekend against the country's official weekend, its Ramadan and Eid dates against the announced ones (the UAE and Saudi Arabia, whose announced dates match for 2018-2026; for Qatar, Kuwait, Bahrain and Oman a date that differs from Umm al-Qura is only a low note to check the official announcement), unmarked estimates and a range that ends before the next Ramadan. What the files can't say is listed under `cantTell`. Its fixes name the website tools and the settings to pick (no DAX), and `fixes.addGulfCalendar` gives the same settings as `add_gulf_calendar`'s inputs. Without `country` the section appears only when the model already has Hijri or Ramadan columns. `country` never changes `weekStart`. `fixes.FORMATS`: every measure and column whose number or date format is not the right one by one rule (a ratio 0.0%, a count or whole number #,0, money its own currency format, other numbers #,0.00, a date dd mmm yyyy; good formats left alone), with one script file. |
| `add_gulf_calendar` | The DataArcus Calendar Generator's date table for a Gulf model (the website's own generator, `assets/js/calendar-generator.js`): Hijri year, month and day, Ramadan and Eid flags and Ramadan Day, the UAE's announced Ramadan and Eid dates (later ones Umm al-Qura estimates, flagged in `Is Estimated Date`) and the country's official weekend with its change dates. Written (only with an approved `planId`; without one it checks everything and names the file) as a TMDL script to a new file next to the project, for the user to apply in TMDL view after checking Preview; nothing is written into the model and the DAX is never in the answer. `firstYear` and `lastYear` are required (the AI asks the user); `country` (`uae` by default), `weekend` (`country` or a fixed one), `announced`, `lang`, `arabicNames` (Day Name (Arabic), Month Name (Arabic) and Hijri Month Name (Arabic), on by default), `name` (`Gulf Calendar` by default), `weekStart`, `fiscalStart`, `relateTo` (date columns to relate; only those the user names). Refuses, writing nothing, on a table, measure or column of the same name, a missing or non-date `relateTo` column, or years outside Power BI's dates or over 60. Month Name, Day Name and Hijri Month Name (and their (Arabic) columns) are sorted by their numbers in the script (`sortByColumn`, accepted by Desktop in D-GC3); marking the date table is a step by hand in the answer until a person has seen the ribbon with it in a script (D-GC2). A `relateTo` column whose type the files don't give (a DAX table's) is accepted with a note. `selfCheck` is the `gulfCalendar` check of the table the script makes. |
| `generate_theme` | A Power BI report theme (JSON), exactly as the DataArcus Theme Generator makes it: from a full palette, a brand colour and a harmony, or a preset; with the font, chart style and page. Light by default (`mode: "dark"` only when asked); a brand colour is used exactly as given (the first data colour and the accent), never changed for contrast: a failing check is said in `sayInPlan`. Without an approved `planId` it writes nothing and returns the design, the colours and a proposed `planId`; with one, the theme goes to a new file inside the DataArcus folder (never over an existing one). Returns the design for the next two tools, the readability checks and every input that could not be used. |
| `plan_layout` | The exact position of every visual on a page (exec, analysis, ops or focus layout; KPI cards; filters; header; page size), mirrored for right to left, also as PBIR positions for editing an existing report. Writes nothing. The plan step: `limits` (slicers 3, KPI cards 6, table fields 8, page filters 8, page sizes...), and with `path` and `planFields` (create_report's `fields` shape) the plan is checked against them and the model; a plan within them gets a proposed `planId`, otherwise `planProblems` says what to change. (0.3, J14) With the model and a complete plan it builds the report `create_report` will write, with `create_report`'s own build, and checks every page of those files (`exactCheck`: Microsoft's validator offline, every field against the model, the measured rules, the layout check): `pass`, `incomplete` when a check could not run, or `blocked` (no `planId`). `pageSize.chosenBy` says whether the size is the default 1920 x 1080 or asked. `kpis` 0 to 6: fewer than 3 cards share the KPI row, 0 leaves it out. With `path` (and the plan's `fields`), the fields that lack their right format come first in the answer (`formats`), with the script file `create_report` writes after the go (the same file as `check_model_health`). With `lang: "ar"`, `arabicNames.suggestedDisplayNames` proposes an Arabic display name for each field without one from a fixed list of report words, and `proposeYourself` lists the rest for the assistant to propose in plain, short business Arabic; every suggestion is shown beside the model's name for the user to approve or edit before `create_report`, and only approved names are written (the model is never renamed). With `redesignFrom` (0.3, draft) an existing report on this model is redesigned as a copy: every page, bookmark, button, filter, tooltip page and custom visual copied file for file, with only the allowlisted changes (the top-level native visuals placed on the grid, the titles in `titles`, the custom theme's colours in `restyle`); `redesign` lists every change (page, visual, from, to), every visual not changed with why, and what is kept as it is; `create_report` with the same `redesignFrom` checks the copy (only those changes, no dangling reference, the bookmarks and filters unchanged) and writes it as "<name> redesigned" next to it; the original is never changed. |
| `approve_plan` | **The gate (0.2.9).** No tool writes a file without an approved plan id: `plan_layout` gives one for a report (`create_report`, with the theme inside the report), and `generate_theme` (a separate theme file), `check_model_health` (its fix scripts) and `add_gulf_calendar`, called without one, write nothing and answer with what they would write and a proposed `planId`. After the user's go, the AI calls `approve_plan` with the `planId`, then the writing tool with `planId`. **Who approves (0.2.9 rc.17):** the person, never the AI. `approve_plan` opens DataArcus's own approval window in the person's default browser, served on their computer only (127.0.0.1, a one-time secret link the AI never receives); it shows the plan (name, title, layout, fields, names, options) and every file it writes, and only their click on **Approve** approves (`approvedBy: "user-in-browser"`); **Not now** refuses. `approve_plan` waits up to 45 seconds for the click, then answers `status: "waiting"`, and the writing tools refuse until the click. When the AI app supports MCP elicitation, the app's own prompt asks instead (`approvedBy: "user-in-app"`). Nothing the AI passes approves a plan. What the window can't stop: another program on the person's computer (one that controls their browser or mouse, or another tool the AI app was given that can run commands or read the browser's history) could click it too. Unknown, expired (2 hours) or unapproved ids are refused, nothing written. A plan made from a model pins the model too (a hash of its definition files: `model.bim` or the TMDL files, a `.pbit`'s own bytes; never Power BI's data cache): a write after the model changed is refused, and the plan must be made again. The plans live in the server process only. Writes nothing. |
| `create_report` | Only with an approved `planId` from `plan_layout` for the same model, and only with the plan's inputs: the pages, fields, names and texts, and the report's name, title, theme, logo, colours and options (`plan_layout` takes them and shows them as `reportLook`; one left out of `create_report` is the plan's, another value is refused). The files it is made from (the theme, logo and background images, and for a native copy its source report) are approved by their contents: a file changed after the go is refused. (0.3, J14) It writes exactly the files the approved plan built and checked (`exact.digest` is the plan's); a model changed since the go is refused, and the plan is made again. A new report (PBIR) next to the user's model, every visual placed and bound to their fields, from a design (`generate_theme` or `plan_layout`) or hand-placed pages. Never touches the model or an existing report; picks a free name. Optional `displayNames` (`{ "Table[Field]": "name" }`) shows fields under other names (Arabic names for an Arabic report) without renaming the model; an Arabic report lists the shown fields still under English names (`arabicNames.missing`). Charts by month or weekday names are put in order by the report when the model has the number column. In a right-to-left report the page buttons run right to left. Never more KPI cards than the model has measures: fewer cards are built and `kpiCards` says how many and why; with no measures the charts are left out too and named. On a large model it takes `focus` or `tables` like `suggest_fields`, and refuses without one. `formats` (first in the answer): the report's fields that lack their right format, with the same script file; the report already shows them in that format (cards, the tooltip's card, tables). |
| `check_report` | Checks a PBIR report that already exists, whoever built it, and never changes it: Microsoft's report validator, run offline (the JSON schemas it would download are checked against Microsoft's own copies bundled in `mcp/schemas/`, MIT licence; no network connection is opened), and the rules DataArcus measured in Power BI Desktop (will a text fit its box, will a button cut its label, will Desktop ignore a formatting entry, do phone boxes overlap, will a tooltip chart need a scrollbar, a page navigator in a right-to-left report). Each finding names the file, the rule, its severity, where the rule comes from (the validator's code, or the measurement with its date and Desktop version) and a fix in words, never a patch. Each finding also has its `impact`, one of three kinds, and `impact` in the answer gives a summary and one sentence per kind: `desktopOpens` (Power BI Desktop opens the report with it; only strict validation or Fabric would refuse it: the five validator codes a working hand-built report showed, in the files where it showed them), `canBreak` (any other validator code and any schema error: it can break the report in Desktop) and `dataarcusRule` (DataArcus's measured rules); the codes stay verbatim. Findings never quote the report's own text; `notChecked` lists what could not be judged. Optional `checks` (only some groups), `lang` and `maxFindings`. Reads a .pbip file, a .Report folder or a folder holding `definition/`; files over 8 MB and folders deeper than 12 levels are listed as not checked. The `lint` check (0.2.9) adds a design lint in its own section, read with the model the report names: a time axis sorted A to Z, bar labels likely cut, tables that grow past their width, missing titles, placeholder text, overlaps, visuals off the page; a finding that rests on a guess from names and types (not data) is marked `guess`. **0.3.1:** `lens: "arabic"` answers "Is this report ready for Arabic?" page by page instead (reading direction, texts, charts, tables, calendar names, slicers, navigation), a short summary first, each finding with its fix: a DataArcus call through approval, a setting in Power BI Desktop, or a line Power BI has no setting for. |
| `read_report` | **0.2.9.** Reads a PBIR report that already exists and never changes it: one line per visual (type, place and size on the page, a title only when a measure gives it (a static title is never returned: "static title"), fields per role with display names, sort, visual filters by field and kind, group, hidden, action or tooltip page), pages in order, slicers, buttons and their targets, bookmarks, the theme's colours and label size, custom visuals. Read before a redesign, with `read_model` beside it. Text by default (`format: "json"` for data); over 40,000 characters, pages are listed without their visuals and `pages` reads them. Filter values, slicer selections and bookmark states are read with the report's files but never returned; it reads none of your tables' data. Text boxes are screened for instructions and length only: long or instruction-like text is withheld, and a short one is returned as typed (a figure or a name in it included). |
| `create_arabic_twin` | **The Arabic twin (0.3.0).** The right-to-left twin of an existing PBIR report: a new "<name> AR" report and `.pbip` next to the original (or, with `into: "same"`, one copy "<name> (EN-AR)" holding the English pages as they are and their Arabic pages mirrored, with a small language button («العربية» / "English") to its counterpart page, desktop and phone, where the header has room (the plan names a page left without one), the Arabic pages hidden from the tabs (`tabsShown: "ar"` hides the English instead) and each slicer pair in sync; the original untouched), on the same model, every page mirrored in place (positions, groups included; bar charts from the right; column, line and area charts with the value axis at the right and their order reversed by the sort; legends, titles, text boxes and table columns to the right; the phone layout mirrored too, each phone page tab as wide as its Arabic name), page ids, visual names and bookmarks kept so navigation keeps working. The original is only read. Without an approved `planId` it writes nothing and answers the plan: what mirrors, what cannot (custom visuals, the navigator's order, Power BI's own words, data values) and every text a person can see with an id (pages, the phone layout, alt texts, the empty state, tooltips, buttons, field names), the report's fixed words drafted from a fixed list; the Arabic texts are drafts the user approves and passes as `labels`, and `notTranslated` says before the go what stays English and why. Offers the Arabic calendar columns (0.3.0 C1: month, day, quarter, fiscal and flag labels in Arabic, each sorted like its English column) for the model's own date table as a TMDL script the user applies, "<name> - Arabic calendar.tmdl", approved with the plan and never applied by DataArcus (`arabicMonth: false`: none); every Arabic route offers it (`plan_layout` and `create_report` with `lang: "ar"`, the twin, the EN-AR copy). Until the script is applied the Arabic report binds the English calendar columns and says which fields show English data and how to switch (apply the script, then plan again); after it, the Arabic columns are bound. Engine: `assets/js/report-mirror.js`. |

**The sample project (0.3.1):** `plan_layout` with `sample: true` (and `lang`) plans a made-up Gulf retail project for a user with no model, a plan of its own; after the approval, `create_report` with `sample: true`, `path` (the plan's `sample.folder`), `lang` and the `planId` writes it to a new folder (`Gulf Retail Sample`, then `Gulf Retail Sample 2`...; never over anything): a TMDL model (Sales, Branches, Products and a Calendar marked as the date table; typed rows that load on Refresh; no row is ever in an answer) and an empty report. Its answer has `tour`: 4 next requests, each a real call on the sample.

## Layouts

`plan_layout` and `create_report` lay out a page in one of four layouts. Executive summary (`exec`) and Single focus
(`focus`) are the tested ones. Operations monitor (`ops`, preview), Analysis as the first page (`analysis`, preview)
and a page under 1920 wide with the filters on top (preview) work, and the plan says so in one line:

"Preview: this layout is still being tuned on real dashboards; the executive and single-focus layouts are the tested ones."

## Safety
What stays on the machine and what the AI app sees: `PRIVACY.md`. What DataArcus promises: `PRODUCT_SPEC.md`.
- Every path must be inside one folder, the working folder: `DATAARCUS_ROOT`. Anything outside is refused, also when a link (symbolic link or junction) inside the folder leads outside it, and also for the paths a tool picks itself (the model folder a `.pbip` points at).
- `DATAARCUS_ROOT` must be set: without it (or empty) the server starts but every tool refuses and says why; it never uses the folder it starts in. For the current folder set `DATAARCUS_ROOT=.` on purpose. A folder that doesn't exist yet is created on start when its parent exists.
- The version is read from `mcp/package.json`. Tools declare what they do to files: five only read (`readOnlyHint`: `read_model`, `suggest_fields`, `plan_layout`, `read_report`, `check_report`); `generate_theme`, `create_report`, `create_arabic_twin`, `check_model_health` (its fix scripts) and `add_gulf_calendar` add files (`destructiveHint: false`), and only with an approved plan id; `check_model_health` also replaces or empties its own answers file (below), only as its approved plan says; `approve_plan` writes no file.
- Nothing is overwritten: every write is a new file (`create_report` refuses to write if any file already exists); the one exception is DataArcus's own answers file next to a model, replaced only as its approved plan says and only if it is still the file DataArcus checked. A write that fails part-way removes what that call created and names anything it could not remove.
- DataArcus reads files on your machine to check and fingerprint them (whole files, hashed; a model's definition can hold "Enter data" or DATATABLE rows, and a report's files hold saved filter, slicer and bookmark values); it never returns data values from them to Claude. A report's short text boxes (`read_report`) and its titles and texts (`create_arabic_twin`, for their Arabic) are returned as typed: a person may have typed a figure or a name there.
- Keep employer or client files you may not share out of that folder.

## Install (Windows, in the DataArcus folder)
**Prerequisites:** Node.js 20.10 or later (`node --version`), git (to clone this repository), Claude Code, and Power
BI Desktop 2.159.883.0 (October 2026) or later, the lowest version the 0.3.0 laptop proofs ran on. The reports DataArcus writes use recent Power BI
features (the new card visual, the PBIR report format) that older versions lack, and older versions have the old
file picker: from October 2026, Desktop from March 2026 or earlier can no longer save or
share to OneDrive or SharePoint (Microsoft's Power BI September 2026 Feature Summary). The Microsoft Store version
updates itself; the download version shows its version under Help > About, and the newest is on Microsoft's Power BI
Desktop download page.

```
cd <repo folder>\mcp
npm install
claude mcp add dataarcus --env DATAARCUS_ROOT=<working folder> -- node <repo folder>\mcp\server.mjs
```
`<repo folder>` is where this repository is cloned; `<working folder>` is the folder that holds your Power BI projects.
A path with spaces goes in double quotes, after `DATAARCUS_ROOT=` too:
`claude mcp add dataarcus --env DATAARCUS_ROOT="C:\Users\me\Power BI" -- node "C:\My Repos\DataArcus\mcp\server.mjs"`.
Then in Claude Code: `/mcp` should list `dataarcus` with 11 tools.

## Other MCP clients and platforms (developers)
Writes Power BI projects on Windows, macOS and Linux; open them in Power BI Desktop on Windows, or deploy the project to
Fabric. Power BI Desktop itself runs only on Windows. The one-click extension (`.mcpb`) is for Windows for now; on macOS
and Linux, clone this repository and run `npm install` in `mcp/` (Node.js 20.10 or later), then add the server to your
client as below. CI runs the MCP's tests on Linux, Windows and macOS.

In each snippet `<repo folder>` is where this repository is cloned and `<working folder>` the folder that holds your
Power BI projects (DataArcus reads and writes only inside it). Example paths: Windows `C:\Users\me\Power BI`, macOS
`/Users/me/Documents/Power BI`, Linux `/home/me/power-bi`. In a JSON file write a Windows path with forward slashes
(`C:/Users/me/Power BI`) or doubled backslashes.

**Claude Code** (tried on Linux in a cloud container on 25 Oct 2026: `claude mcp list` showed `dataarcus` Connected,
with a working folder whose name has a space; not yet tried on macOS; on Windows, the command in "Install" above):
```
claude mcp add dataarcus --env DATAARCUS_ROOT="<working folder>" -- node "<repo folder>/mcp/server.mjs"
```
`claude mcp add` without `-s` adds it for the current folder only; `-s user` for every folder.

**VS Code, agent mode** (not yet tried): Command Palette > **MCP: Add Server** > **Command (stdio)**, the command
`node "<repo folder>/mcp/server.mjs"`, the name `dataarcus`; then add the working folder to the entry VS Code writes
(`.vscode/mcp.json` for the workspace, or the user's `mcp.json`):
```json
{
  "servers": {
    "dataarcus": {
      "type": "stdio",
      "command": "node",
      "args": ["<repo folder>/mcp/server.mjs"],
      "env": { "DATAARCUS_ROOT": "<working folder>" }
    }
  }
}
```

**Cursor** (not yet tried): `~/.cursor/mcp.json` (every project; on Windows `%USERPROFILE%\.cursor\mcp.json`), or
`.cursor/mcp.json` in one project:
```json
{
  "mcpServers": {
    "dataarcus": {
      "command": "node",
      "args": ["<repo folder>/mcp/server.mjs"],
      "env": { "DATAARCUS_ROOT": "<working folder>" }
    }
  }
}
```
In each client the tools list should then show `dataarcus` with 11 tools. Approving a plan opens DataArcus's approval
window in your default browser on the same computer, whichever client you use.

## Test
`npm test` starts the server like an agent would and calls every tool on copies of the fixtures.
