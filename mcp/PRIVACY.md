# DataArcus MCP: what stays on your machine, and what your AI app sees

Plain English. Checked against 0.3.0 (the release candidate; the build writes its version into the package, and the
source's `mcp/package.json` says 0.1.0 until then): each 0.3 change updated this page for what it changed; the whole page
was last read against the code on 2026-10-11, with Microsoft's validator 0.4.0: `mcp/server.mjs`,
`mcp/lib/`, the report-design skill, and the shared engines it loads from `assets/js/`. If the code changes, this page
is checked again before the next release. What is not true yet is listed under "Known gaps" at the end.

## In one paragraph
The DataArcus MCP runs on your own computer and sends nothing anywhere by itself. But it is a tool for an AI app
(Claude Desktop, Claude Code, or another MCP client), and **everything a DataArcus tool returns is read by that AI
app**. With Claude, that means it goes to Anthropic, under your Claude account's terms. DataArcus returns your model's
**structure** (the names of tables, columns and measures, their types and formats, and similar metadata), never the
data in your tables.

## 1. The MCP runs on your machine and sends nothing itself
- It is a Node.js program your AI app starts on your computer. It talks only to that app, over standard input and
  output (stdio). It connects to nothing outside your computer and has no account, telemetry or analytics of its own.
  One local page: while a plan waits for your approval, it serves its approval window to your own browser at
  `http://127.0.0.1:<port>` (your computer only: nothing outside it can reach that address; the page loads nothing from
  the internet and sends your click only to DataArcus). Each link is for one plan, takes one click, and stops working
  when the plan expires (2 hours) or the app closes.
  (Checked: no network call in `mcp/server.mjs`, `mcp/lib/` or the engines it loads; the packaging's smoke test runs it
  with every outgoing connection and name lookup refused, and any listen but on 127.0.0.1 refused. The `https://` addresses in the
  report files it writes are Microsoft's schema names, which Power BI reads; nothing is downloaded from them.
  `check_report` reads report files on your computer and runs Microsoft's report validator offline, in the same
  process: the schemas the validator would download are read from Microsoft's copies bundled in `mcp/schemas/`.)
  The validator's schema download is switched off (`skipSchema`) and is never called.
- It reads and writes files only inside one working folder that you choose (`DATAARCUS_ROOT`; see section 4).
- It writes one line to the app's local log when it starts ("DataArcus MCP ready. Folder: ..."), which your AI app
  keeps on your computer.

## 2. Whatever a tool returns goes to your AI app (with Claude: to Anthropic)
An MCP tool's answer is read by the AI model so it can decide what to do next. With Claude, the model runs at
Anthropic, so every tool answer is sent there as part of your conversation. That is how every MCP tool works, not a
DataArcus choice; what DataArcus controls is **what it puts in its answers**. Today, per tool:

| Tool | What its answer contains |
|---|---|
| `read_model` | Table names; for each table: hidden or not, date table or not, the visible columns' names and types, how many columns are hidden, the visible measures' names and format strings. The model's file name and the names of the reports already in the project. For a large model, a summary instead: counts, the date tables' names, the names of the measures' display folders with the tables they are in (at most 15 named per folder, the rest counted), each table with measures and its numbers of measures, visible columns and related tables (at most the 100 with the most measures; the rest are counted by display folder), and the other tables' names (as many as fit). With `tables`, the full list for the named tables. |
| `suggest_fields` | Which table, column and measure names it picked for each KPI card, chart, table and slicer, and the names of measures it passed over because they are named old, test, unused, backup or temp. With `focus` or `tables`, also which tables the picks came from. On a large model without a focus: the display folder names and the names of the tables with measures, and no picks. |
| `check_model_health` | The score, counts (tables, columns, measures, relationships, roles...), the model's compatibility level and culture, the kinds of data source used (for example `Sql.Database`, counted, without server or file names), and every finding with the names of the objects it concerns (tables, columns, measures, relationships, Power Query query names, role names) and the source of its rule (a public Microsoft link, or "DataArcus rule" with its reason). A few findings add a short detail: a format string, a display folder, a line or step count, the names of measures that use a relationship, or the report page and visual names where a broken field is used. `reports`: the names of the report folders beside the model, those counted (their `definition.pbir` points at this model) and those not, with why (for a report of another model, that model folder's name). If you pass `columnTypes`, it lists back the column names it could not use. With `country`, or when the model has Hijri or Ramadan columns, a `gulfCalendar` section: the calendar table's name and the names of its Hijri, Ramadan, Eid and weekend columns; for a calendar made by the DataArcus Calendar Generator, the dates written in its own DAX (its first and last date, and where a Ramadan or Eid start differs from the announced one), and how many days its weekend differs from the country's, with a few example dates. These are calendar dates from the model's definition, never values from your data tables. `fixes`: for sort order and number formats, the names of the columns and measures to change, the format or sort column proposed for each, steps to do by hand where a script can't, and the path of the script file it wrote, relative to the working folder (see section 3). Steps by hand can include a formula DataArcus proposes, built from your column names; never one read from your model. `fixes.THOUSANDS`: the names of measures and columns whose number format has no thousand separator, each with its current format string and the one proposed. `pleaseConfirm` (Health Check 3): questions about possible calculation mistakes, each with the name of the measure, or the relationship's table and column names, it concerns; the piece of DAX behind a question is not returned (the website shows it, in your browser). |
| `add_gulf_calendar` | The path of the script file it wrote (relative to the working folder), the new table's name (yours, or "Gulf Calendar"), its number of rows and its column names (the generator's own), the date range (1 January of `firstYear` to 31 December of `lastYear`), the country and weekend chosen, the first day of the week, whether the announced Ramadan and Eid dates are used (up to which date, and from which date they are estimates), the relationships written (the names of the date columns you gave in `relateTo`, as `Table[Column]`), the steps to do by hand, how to apply the script, and a self-check of the new table (the gulfCalendar findings about it, with their counts). A note names the model's table when it already has a calendar made by the DataArcus generator. A refusal names the table, measure or column whose name the new table would take. Never the DAX, never data values. |
| `generate_theme` | The theme's colours, fonts and settings (your inputs; with `path` and no colours asked, the colours of your report's own theme, hex only, with the report's and the theme's names), the contrast checks, and the path of the theme file it wrote (relative to the working folder); without an approved plan id, the file name it would write and a plan id instead. |
| `approve_plan` | The plan id, whether it is approved or still waiting for your click, who approved it (`approvedBy`: `user-in-browser` when you clicked Approve in DataArcus's approval window, `user-in-app` when you answered the app's own prompt through MCP elicitation), which tools it allows and what they will write (file names, the table a calendar script adds). The approval window is a page DataArcus serves on your computer only (127.0.0.1, nothing leaves it) and opens in your default browser; it shows you the plan and the same list of files, and your click goes only to the DataArcus server. Its link holds a one-time secret that is never returned to the AI; it stops working when the plan expires or the server stops. |
| `plan_layout` | Positions and sizes of the visuals, the tools' limits, a plan id; with `path`, the names of the plan's fields that have no right format (and the name of the script file create_report would write), and the problems of the plan's fields (names not in the model, counts over the limits); `colours`: when the design names no colours, the colours taken from your report (its theme's own colours and the colours written on its visuals: hex only, never a value; the report's and the theme's names, your other reports' names, the font, corner radius and shadow of its theme, the contrast checks); `designLint`: the design findings of the planned page (the rule, the visual by its type, title, place and size, the field names, the reason and the fix; no data, nothing written); `exactCheck` (0.3, J14): the check of the report create_report will write, every page: counts, rule ids, file paths inside the report (page and visual ids) and a digest, never a name, title or other text; `aggregation` (0.3): the names of the plan's measures that are not additive, what each is in words (a ratio, an average, a distinct count...) and where it is (a card, a table, a time axis), and a question for a measure whose name reads as a snapshot summed over time; read from the DAX's shape, the format and the name on your machine, never the DAX itself. `redesign` (with `redesignFrom`): the original report's page ids, names and sizes, its visuals by their names, types, places, sizes and short titles, each change (from, to; a new title as given), the theme's new colours, and counts of what is copied as it is (bookmarks, buttons, filters, slicer selections, tooltip links, groups, custom visuals); the files are copied as bytes, so filter values, slicer selections and bookmark states are never read into an answer. |
| `create_report` | How many files it wrote, the path of the new `.pbip` (relative to the working folder), the report and model folder names, the pages and visual counts, and `modelNotes`: the names of the fields it used that will display badly (months or days without a sort column, a percentage without a format). `kpiCards`: when the model has fewer measures than KPI cards, how many cards were built and the names of the measures on them. `boundFields`: for each page, the names of the fields each visual shows. `numberFormats`: the names of the fields it shows as numbers that have no thousand-separator format in the model, and (`cards`) the measures whose KPI card got a number format of its own in the report, with that format. `pageFilters`: for each page filter asked for, the column's name, the values given, their type (and, for a column the files give no type, that the type came from those values), and a note when a filter on a Ramadan flag keeps every Ramadan (naming the model's Hijri-year column); `reportNotes` repeats the filters and their values in words. `svgMeasures` (experimental): for each SVG column, its label, the table its measure belongs to, the page, the length of its DAX in characters and its status; the DAX itself is not returned. `scope`: on a large model, the focus and the names of the tables the picks came from. `displayNames` and, in an Arabic report, `arabicNames`: how many of the names given were used, the fields whose given names were not used, and the fields shown under a model name with no Arabic letter. `ignored`: the names of keys in a design that the tool doesn't know. |
| `read_report` | About the report it reads: the pages (names capped at 60 characters, invisible characters written as code points) and page ids, visual ids and each visual's type, place, size, layer (z), hidden or not, group, its screened title and text box text (shown when short and plain; longer than 120 characters or reading like an instruction: withheld, with its length), the role names of each visual (screened; with Desktop's name for the role and its kind) and the field names in each role with their display names, sort fields, the field and kind of each filter (never its values), a custom visual's type, where it comes from and the names of its formatting objects (never their values), group and bookmark names, the theme's name, colours and label size. Slicer selections and bookmark states are read with the report's files but never returned; it reads no data. It writes nothing. |
| `create_arabic_twin` | The report's page ids and names, its visuals' names and kinds counted, and the texts a reader sees (page names, visual titles, text boxes, button texts, field names as shown, bookmark names, and the fixed texts of a chart title given by one of the report's own measures, with the names of those measures; each capped at 200 characters, invisible characters written as code points, a text that reads like an instruction withheld), so the AI app can draft their Arabic for you to approve. The model's date table and column names when it offers the Arabic month column. After your go: the paths of the files it wrote (relative to the working folder). Never data values, filter values or slicer selections. |
| `check_report` | About the report it checks: page and visual counts, the page names (capped at 60 characters, invisible characters written as code points), the schema versions, the language it read (from counting letters, never the text) and Microsoft's validator's counts. Each finding: the rule, its severity, its kind (`impact`: Desktop opens it, can break it in Desktop, or a DataArcus rule), the file's path inside the report, the visual's name (an id), type and position, the problem in numbers ("the box is 28 high; 2 lines of 14pt need 61"), a fix in words and the rule's source. **Never** the report's own text (titles, text boxes, alt text), filter values, slicer selections or bookmark states: those are counted, not read into the answer (a test plants made-up values in each and checks none comes back). It reads only, writes nothing, and opens no network connection: Microsoft's validator runs offline in the same process, and the schemas it would download are checked against Microsoft's copies bundled in `mcp/schemas`. |

**Also sent, by every tool that reads a model:** when a table, column or measure name holds a character nobody sees (a direction override, a zero-width character), that name, with the character written as its code point (`hiddenCharacters`, up to 20 names). A report name given with such characters is written without them. **And:** error messages. Since round 17 no answer or error holds a full local path: paths are relative to the working folder (for example `Sales Report/Sales Report.pbip`), the working folder is named by its last folder name only, and your home folder is written `~`, so your Windows user name is not sent. The full paths stay in the server's local log on your computer.

## 3. Metadata only: no data values
- **No DataArcus tool reads or returns the data in your tables.** It reads only the model's definition files (TMDL
  files, `model.bim`, or the model schema inside a `.pbit`) and the report's definition files. It never opens Power BI's
  data cache, never connects to Power BI Desktop or to your data sources, and runs no queries. It refuses a `.pbix` (it
  holds Power BI's data cache) and data files (`.csv`, `.tsv`, `.xlsx`, `.xlsm`, `.xls`, `.parquet`) by their name,
  before opening them, and a template whose list of parts shows a data cache before reading the rest of it.
- **Values inside a model's definition.** A model's definition can hold small tables typed into Power BI ("Enter data",
  their rows compressed inside the Power Query text) and DATATABLE values in DAX: DataArcus reads those definition
  files on your machine, but never decodes such values and never returns them.
  (Values you type yourself, such as a page filter's, are written into the new report and repeated in the answer: see
  "What a new report's files hold" below.)
- **What metadata still says.** Names are information too: a table called "Salaries 2026" or a measure called
  "Bonus Pool" tells the AI something about your business. Measure, column and role expressions (DAX, Power Query)
  are read on your machine for the health check, but are **not** returned; only the names of the objects a finding
  concerns are. Descriptions are not returned either.
  One exception, in `create_arabic_twin`: a chart title given by a measure of the report itself (in its
  `reportExtensions.json`, as DataArcus writes "Top N of M" titles) returns the fixed texts of that measure's DAX, the
  words the chart shows ("Top {1} of {2}: Sales by Region", its counted numbers as {1} and {2}), so you can approve
  their Arabic; the rest of its DAX is not returned. A title measure of any other shape is named, never quoted.
- **Fix scripts are files, not answers.** A ready fix (sort order, number formats) is a TMDL script that rewrites
  whole measures or columns, so it holds their expressions and descriptions as they are in your model. The health
  check writes each script to a new `.tmdl` file next to your project and returns only the file's path, the names of
  the objects and how to apply it. The script's text is never in an answer. (Until 2026-10-04 the script was part of
  the answer; an audit found that this contradicted the paragraph above, and it was changed.) An AI app that can read
  files on your computer by itself (Claude Code, for example) could still open that file if you or it chose to; the
  DataArcus instructions tell it not to unless you ask.
- **The Gulf calendar's script is a file too.** `add_gulf_calendar` reads the model's definition only to refuse a
  name that is already taken, to find the `relateTo` columns and to see whether a DataArcus calendar is already there.
  It writes the Calendar Generator's table (its DAX, made from the years, country and options you give, never from your
  model or data) and one relationship per `relateTo` column as a TMDL script in a new file next to your project, and
  returns only the file's path and the details listed in section 2. You apply it in Power BI Desktop's TMDL view after
  checking Preview; the tool never writes into the model.
- **What a new report's files hold.** `create_report` writes Power BI's own definition files, next to your model, on
  your computer. Besides positions, sizes and styling, they hold the names of the fields the visuals show and, when
  they are asked for:
  - **page filters:** the values given in the request (for example `true` for a Ramadan flag, or a Hijri year),
    written into the filter of every report page (not the tooltip pages). They come from your request, never from
    your data: DataArcus reads no data to find them. They are also in the answer, so the AI app sees them (it already
    had them from the request);
  - **a KPI card's number format:** the measure's own format string with a thousand separator, made from the model's
    format string;
  - **SVG columns (experimental):** a measure that exists only in this report (`definition/reportExtensions.json`),
    compiled from the design: its fixed text and colours, and the names of the measures and columns it uses. Power BI
    computes it on your computer when you open the report; the values it draws never pass through DataArcus or the AI
    app. The model is not changed.
- **Data values only when you ask.** The other tools DataArcus is used with can read data: Microsoft's Power BI
  Authoring MCP runs DAX queries that return values, and a screenshot of a report page shows its numbers. Those are
  other tools with their own terms; the DataArcus report-design skill uses them only after asking you, each time
  telling you that what the report shows goes to the AI app. If you don't agree, those checks are not done and the
  skill says so.

## 4. Your files: never overwritten, and paths stay inside the working folder
- **One working folder.** Every path a tool is given is resolved inside `DATAARCUS_ROOT`, the folder you choose. A
  path that leads outside it (for example `..\Documents` or `C:\Other`) is refused.
- **No working folder, no work.** If no folder was chosen (the setting is missing or empty), every tool refuses and
  says so; the server never falls back to whatever folder it happens to start in. A chosen folder that doesn't exist
  yet is created when the folder above it exists (for example `Documents\DataArcus` on a new computer); otherwise the
  tools tell you to create it.
- **Links are not followed out of the folder.** A shortcut-like link inside the working folder (a symbolic link or a
  Windows junction) that points to a folder outside it is refused, for reading and for writing: the tools check where
  a path really is, not only its name. The same holds for the paths a tool picks itself:
  the model folder a `.pbip` points at, and a model found by its folder's name. When searching a project for its model,
  links are never followed.
- **What these checks are not:** DataArcus checks every path inside the working folder and never follows links, but
  it is not a defence against another program on the same computer changing the folder while DataArcus is working.
- **A working folder that is itself a model folder** (`... .SemanticModel`): the reading tools work on it, and read
  nothing above it. `create_report` refuses, because a report is written next to its model, which would be outside
  the working folder; choose the project folder instead.
- **Nothing is overwritten.**
  - `create_report` writes a new report next to your model under a free name, and refuses to write at all if any of
    its files already exists. It never changes your model or an existing report.
  - `generate_theme` writes a new theme file and picks a free name (`name.json`, then `name-2.json`, `name-3.json`, ...).
  - `create_arabic_twin` writes a new "<name> AR" report folder and `.pbip` next to the original report, refusing
    when either name is taken; the original report is only read. The twin's Arabic chart titles are new measures
    ("Title AR: ...") in the twin's own `reportExtensions.json`; the model is never changed. Its Arabic month script (when you ask for it) is a
    new `.tmdl` file next to the project under a free name, as the scripts below.
  - The twin and the native copy (`create_report` with `customVisualsFrom`) copy only the report's own files: its
    definition JSON, `definition.pbir`, `.platform`, the StaticResources' images and themes, a private custom visual's
    files. Any other file in the `.Report` folder (a `.csv` or `.xlsx` left there, `.pbi/localSettings.json`) is never
    read, hashed or copied; the plan names it.
  - `check_model_health` and `add_gulf_calendar` write their scripts as new files next to the project, under free names; asked again, it
    names the file that already holds exactly that script instead of writing a second copy. When the working folder
    is the model folder itself it writes no script (nothing is ever written inside a model folder) and says so.
  - (0.3) `check_model_health` keeps your answers to its "Please confirm" questions, when you ask it to, in
    `<model>.dataarcus-answers.json` next to the project, written only after you approve a plan that lists it. It
    holds hashes and your answers. For each answer: a hash of the question (its id), a hash of the object it is about, a hash of the metadata
    it was based on (a measure's DAX text and format string, a relationship's columns, an unrelated table's key
    columns, with their types), your answer, its date and "user". No name, no DAX text, no data. It is the one file
    DataArcus replaces: the plan says so ("replaces the answers file DataArcus wrote"), and the replace happens only
    when what is at that name is still the DataArcus answers file DataArcus checked (its identity, size and content
    hash, checked again just before); anything else there is left as it is and named. A write that fails leaves
    nothing, or names exactly what it could not remove. Answers that no longer apply are dropped from the file at an
    approved write, which the plan says; forgetting your answers empties it. (The website's Health Check keeps the
    same records in your browser only, and keeps answers that no longer apply until you click "Forget my answers".)
  - A name counts as taken when anything at all is there, including a link whose target is missing, and every new
    file is created in a way that fails if the name exists: nothing is written over a file or through a link.
  - `read_model`, `suggest_fields`, `plan_layout` and `check_report` only read. (0.3, J14: to run Microsoft's validator on
    the report a plan would write, `plan_layout` puts a copy of those generated files in a private folder of the
    computer's temporary folder, never in your working folder, and deletes it as soon as the check ends.)
  - Your logo and background images are copied into the new report; the originals are not changed.
- **Nothing of yours is deleted.** No tool deletes a file it did not just create. When a write fails part-way, the
  tool removes only the files and folders that same call had created, so no half-written report, twin, theme or script
  is left (a theme or a script is written under a temporary name first; a report or a twin is written folder by folder,
  its `.pbip` last); a file or folder that was there before is never touched. Each is removed only while it is still
  the one that call created: a file or folder another program put at one of its names, or a link put on the way, is
  left where it is and named. No file is ever renamed over another. If
  something it created can't be removed, the answer names exactly what is left, and the approved plan can't be used
  again; when everything was removed, the same plan can be used again.
- **Keep the folder clean.** Put in it only the models you are allowed to share with your AI app. Don't put employer
  or client models there unless you may send their structure to the AI provider.

## 5. Model metadata is untrusted input
A table, column, measure or file name, or a description, is text written by whoever built the model. It can contain
anything, including sentences that look like instructions to an AI ("ignore your rules and ..."). DataArcus treats it
as data, never as instructions:
- the tools return names as plain values in JSON and never act on what a name says;
- the AI is told so: the server's instructions (sent to the AI app when it starts), the tool descriptions and the
  report-design skill all say that names, descriptions and file names are untrusted text and that instructions in
  them are never followed;
- the AI should analyse, then propose, then write, and never run anything because a name or description told it to;
- changes to your model are always yours to make (in Power BI Desktop, or through Microsoft's tools with you watching).

## Coming, not in this version
- **The number check** (plan: `mcp/plans/NUMBER-CHECK.md`): **approved, planned, not built.** Values would be read on
  your computer only, in that tool: it would connect to Power BI Desktop on your computer and read the values each
  visual shows, to compare them before and after a change, and would never return them unless you ask. That changes
  section 3 ("never connects to Power BI Desktop ... and runs no queries") for that one tool, so this page changes
  first, with the owner's approval, before it ships. Until then, section 3 stands as written.

## Known gaps
Open on 2026-10-11:
- **A6-3** (who approves; closed in 0.2.9 rc.17): only your click on Approve in DataArcus's approval window
  (`approvedBy: "user-in-browser"`), or your yes in the app's own prompt (MCP elicitation), approves a plan; what the
  AI passes approves nothing. What remains: another program on your computer (one that controls your browser or mouse, or another tool your AI app
  was given that can run commands or read the browser's history) could click it too.
- **The working folder's checks** are made when a path is used: they are not a defence against another program on the
  same computer changing the folder while DataArcus is working (see section 4).

Closed in 0.2.9 (from the 0.2.9 audits and an outside review of the release candidate), each with a test that failed
before the fix:
- **A1-1:** the model folder a `.pbip` points at, and a model found by name, are checked against the working folder
  like any path (section 4).
- **A6-1, A6-2** (the plan gate): an approved plan pins the inputs of its write and is used once; a plan kind that
  pins nothing for a tool refuses it, and a report's plan allows the report only (its theme goes inside the report;
  a separate theme file needs its own plan).
- **A7-3** (the plan gate): a reply with a no, not yet or wait in it never approves a plan; a plan is approved once,
  and its 2 hours count from its proposal.
- **A6-4:** a write is all or nothing; when one fails part-way, only what that call created is removed.
- **A5-1, A5-5** (`read_report`): field roles are screened, and the instruction screen runs on cleaned text.
- **A6-6:** every answer writes invisible format and control characters as code points, and no answer of any shape
  passes 40,000 characters.
- **A4-7** (`check_report`): the design lint's findings carry their `impact` kind like the others.
- Files you name (a logo, a background, a theme) are measured and read through one capped read, never past their size
  limit.

Closed on 2026-10-04 (round 5, from the audit of 2026-10-04), each with tests that failed before the fix:
- fix scripts in the health check's answer carried expressions and descriptions (now files; see section 3);
- a new theme file could be written through a link whose target was missing, to a place outside the working folder
  (now such a name counts as taken; see section 4);
- nothing shipped told the AI that model text is untrusted (now in the server's instructions, the tool descriptions
  and the skill; see section 5).

The three gaps listed here on 2026-10-03 were closed the same day (round 3), each with tests that failed
before the fix:
- a link inside the working folder leading outside it (now refused; see section 4);
- a working folder that is itself a model folder (`create_report` now refuses instead of writing one level above);
- the report-design skill's screenshots and DAX checks (the skill now asks first; see section 3).

What a skill tells the AI to do is an instruction, not a lock: the AI app's own permission prompts for Microsoft's
tools and for screenshots remain your control over what is run.

## Who to ask
Questions or a problem with this page: [hello@dataarcus.com](mailto:hello@dataarcus.com).
