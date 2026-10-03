# DataArcus MCP: what stays on your machine, and what your AI app sees

Plain English. Checked against the code on 2026-10-03 (main `bc05275`: `mcp/server.mjs`, `mcp/lib/`, and the shared
engines it loads from `assets/js/`). If the code changes, this page is checked again before the next release.

## In one paragraph
The DataArcus MCP runs on your own computer and sends nothing anywhere by itself. But it is a tool for an AI app
(Claude Desktop, Claude Code, or another MCP client), and **everything a DataArcus tool returns is read by that AI
app**. With Claude, that means it goes to Anthropic, under your Claude account's terms. DataArcus returns your model's
**structure** (the names of tables, columns and measures, their types and formats, and similar metadata), never the
data in your tables.

## 1. The MCP runs on your machine and sends nothing itself
- It is a Node.js program your AI app starts on your computer. It talks only to that app, over standard input and
  output (stdio). It opens no network connection and has no server, account, telemetry or analytics of its own.
  (Checked: no network call in `mcp/server.mjs`, `mcp/lib/` or the engines it loads. The `https://` addresses in the
  report files it writes are Microsoft's schema names, which Power BI reads; nothing is downloaded from them.)
- It reads and writes files only inside one working folder that you choose (`DATAARCUS_ROOT`; see section 4).
- It writes one line to the app's local log when it starts ("DataArcus MCP ready. Folder: ..."), which your AI app
  keeps on your computer.

## 2. Whatever a tool returns goes to your AI app (with Claude: to Anthropic)
An MCP tool's answer is read by the AI model so it can decide what to do next. With Claude, the model runs at
Anthropic, so every tool answer is sent there as part of your conversation. That is how every MCP tool works, not a
DataArcus choice; what DataArcus controls is **what it puts in its answers**. Today, per tool:

| Tool | What its answer contains |
|---|---|
| `read_model` | Table names; for each table: hidden or not, date table or not, the visible columns' names and types, how many columns are hidden, the visible measures' names and format strings. The model's file name and the names of the reports already in the project. |
| `suggest_fields` | Which table, column and measure names it picked for each KPI card, chart, table and slicer. |
| `check_model_health` | The score, counts (tables, columns, measures, relationships, roles...), the model's compatibility level and culture, the kinds of data source used (for example `Sql.Database`, counted, without server or file names), and every finding with the names of the objects it concerns (tables, columns, measures, relationships, Power Query query names, role names). A few findings add a short detail: a format string, a display folder, a line or step count, the names of measures that use a relationship, or the report page and visual names where a broken field is used. If you pass `columnTypes`, it lists back the column names it could not use. |
| `generate_theme` | The theme's colours, fonts and settings (your inputs), the contrast checks, and the full path of the theme file it wrote. |
| `plan_layout` | Positions and sizes of the visuals; no model information at all. |
| `create_report` | How many files it wrote, the full path of the new `.pbip`, the report and model folder names, the pages and visual counts, and `modelNotes`: the names of the fields it used that will display badly (months or days without a sort column, a percentage without a format). |

**Also sent:** error messages, which can include the path you asked for and the working folder's full path. A full
path on Windows usually contains your Windows user name (for example `C:\Users\<name>\...`).

## 3. Metadata only: no data values
- **No DataArcus tool reads or returns the data in your tables.** It reads only the model's definition files (TMDL
  files, `model.bim`, or the schema inside a `.pbit`, which holds no data) and the report's definition files. It never
  opens Power BI's data cache, never connects to Power BI Desktop or to your data sources, and runs no queries.
- **What metadata still says.** Names are information too: a table called "Salaries 2026" or a measure called
  "Bonus Pool" tells the AI something about your business. Measure, column and role expressions (DAX, Power Query)
  are read on your machine for the health check, but are **not** returned; only the names of the objects a finding
  concerns are.
- **Data values only when you ask.** The other tools DataArcus is used with can read data: Microsoft's Power BI
  Authoring MCP runs DAX queries that return values, and a screenshot of a report page shows its numbers. Those are
  other tools with their own terms; the DataArcus report-design skill should use them only when you agree (see
  "Known gaps" below: today it does not ask first).

## 4. Your files: never overwritten, and paths stay inside the working folder
- **One working folder.** Every path a tool is given is resolved inside `DATAARCUS_ROOT` (by default, the folder
  the server starts in). A path that leads outside it (for example `..\Documents` or `C:\Other`) is refused.
- **Nothing is overwritten.**
  - `create_report` writes a new report next to your model under a free name, and refuses to write at all if any of
    its files already exists. It never changes your model or an existing report.
  - `generate_theme` writes a new theme file and picks a free name (`name.json`, then `name-2.json`, `name-3.json`, ...).
  - `read_model`, `suggest_fields` and `check_model_health` only read.
  - Your logo and background images are copied into the new report; the originals are not changed.
- **Nothing is deleted.** No tool deletes a file.
- **Keep the folder clean.** Put in it only the models you are allowed to share with your AI app. Don't put employer
  or client models there unless you may send their structure to the AI provider.

## 5. Model metadata is untrusted input
A table, column, measure or file name, or a description, is text written by whoever built the model. It can contain
anything, including sentences that look like instructions to an AI ("ignore your rules and ..."). DataArcus treats it
as data, never as instructions:
- the tools return names as plain values in JSON and never act on what a name says;
- the AI should analyse, then propose, then write, and never run anything because a name or description told it to;
- changes to your model are always yours to make (in Power BI Desktop, or through Microsoft's tools with you watching).

## Known gaps (being fixed before the beta; listed so this page stays true)
- **A link inside the working folder can lead outside it.** The folder check compares path names, not where a
  shortcut-like link (a symbolic link or a Windows junction) really points. If the working folder contains such a
  link to another folder, the tools read and write through it. Until fixed: don't put links in the working folder.
- **A working folder that is itself a model folder** (`... .SemanticModel`): `create_report` then writes the new report
  next to it, one level above the working folder. Until fixed: choose the project folder, or a folder above it.
- **The report-design skill's checks show data.** Its steps "open and look" (page screenshots) and "check the numbers"
  (a DAX query per KPI card, through Microsoft's MCP) send what the report shows to the AI app. They help catch wrong
  reports, but the skill should ask you before doing them.

## Who to ask
Questions or a problem with this page: [TBD by the owner: support email].
