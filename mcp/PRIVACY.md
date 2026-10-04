# DataArcus MCP: what stays on your machine, and what your AI app sees

Plain English. Checked against the code on 2026-10-04 (branch `fix/round-7-audit`: `mcp/server.mjs`, `mcp/lib/`, the
report-design skill, and the shared engines it loads from `assets/js/`). If the code changes, this page is checked again before the next release.

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
| `read_model` | Table names; for each table: hidden or not, date table or not, the visible columns' names and types, how many columns are hidden, the visible measures' names and format strings. The model's file name and the names of the reports already in the project. For a large model, a summary instead: counts, the date tables' names, the names of the measures' display folders with the tables they are in, each table with measures and its numbers of measures, visible columns and related tables (at most the 100 with the most measures; the rest are counted by display folder), and the other tables' names (as many as fit). With `tables`, the full list for the named tables. |
| `suggest_fields` | Which table, column and measure names it picked for each KPI card, chart, table and slicer, and the names of measures it passed over because they are named old, test, unused, backup or temp. With `focus` or `tables`, also which tables the picks came from. On a large model without a focus: the display folder names and the names of the tables with measures, and no picks. |
| `check_model_health` | The score, counts (tables, columns, measures, relationships, roles...), the model's compatibility level and culture, the kinds of data source used (for example `Sql.Database`, counted, without server or file names), and every finding with the names of the objects it concerns (tables, columns, measures, relationships, Power Query query names, role names). A few findings add a short detail: a format string, a display folder, a line or step count, the names of measures that use a relationship, or the report page and visual names where a broken field is used. If you pass `columnTypes`, it lists back the column names it could not use. With `country`, or when the model has Hijri or Ramadan columns, a `gulfCalendar` section: the calendar table's name and the names of its Hijri, Ramadan, Eid and weekend columns; for a calendar made by the DataArcus Calendar Generator, the dates written in its own DAX (its first and last date, and where a Ramadan or Eid start differs from the announced one), and how many days its weekend differs from the country's, with a few example dates. These are calendar dates from the model's definition, never values from your data tables. `fixes`: for sort order and number formats, the names of the columns and measures to change, the format or sort column proposed for each, steps to do by hand where a script can't, and the full path of the script file it wrote (see section 3). Steps by hand can include a formula DataArcus proposes, built from your column names; never one read from your model. `fixes.THOUSANDS`: the names of measures and columns whose number format has no thousand separator, each with its current format string and the one proposed. |
| `generate_theme` | The theme's colours, fonts and settings (your inputs), the contrast checks, and the full path of the theme file it wrote. |
| `plan_layout` | Positions and sizes of the visuals; no model information at all. |
| `create_report` | How many files it wrote, the full path of the new `.pbip`, the report and model folder names, the pages and visual counts, and `modelNotes`: the names of the fields it used that will display badly (months or days without a sort column, a percentage without a format). `kpiCards`: when the model has fewer measures than KPI cards, how many cards were built and the names of the measures on them. `boundFields`: for each page, the names of the fields each visual shows. `numberFormats`: the names of the fields it shows as numbers that have no thousand-separator format in the model. `ignored`: the names of keys in a design that the tool doesn't know. |

**Also sent, by every tool that reads a model:** when a table, column or measure name holds a character nobody sees (a direction override, a zero-width character), that name, with the character written as its code point (`hiddenCharacters`). **And:** error messages, which can include the path you asked for and the working folder's full path. A full
path on Windows usually contains your Windows user name (for example `C:\Users\<name>\...`).

## 3. Metadata only: no data values
- **No DataArcus tool reads or returns the data in your tables.** It reads only the model's definition files (TMDL
  files, `model.bim`, or the schema inside a `.pbit`, which holds no data) and the report's definition files. It never
  opens Power BI's data cache, never connects to Power BI Desktop or to your data sources, and runs no queries.
- **What metadata still says.** Names are information too: a table called "Salaries 2026" or a measure called
  "Bonus Pool" tells the AI something about your business. Measure, column and role expressions (DAX, Power Query)
  are read on your machine for the health check, but are **not** returned; only the names of the objects a finding
  concerns are. Descriptions are not returned either.
- **Fix scripts are files, not answers.** A ready fix (sort order, number formats) is a TMDL script that rewrites
  whole measures or columns, so it holds their expressions and descriptions as they are in your model. The health
  check writes each script to a new `.tmdl` file next to your project and returns only the file's path, the names of
  the objects and how to apply it. The script's text is never in an answer. (Until 2026-10-04 the script was part of
  the answer; an audit found that this contradicted the paragraph above, and it was changed.) An AI app that can read
  files on your computer by itself (Claude Code, for example) could still open that file if you or it chose to; the
  DataArcus instructions tell it not to unless you ask.
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
  a path really is, not only its name. When searching a project for its model, links are never followed.
- **A working folder that is itself a model folder** (`... .SemanticModel`): the reading tools work on it, and read
  nothing above it. `create_report` refuses, because a report is written next to its model, which would be outside
  the working folder; choose the project folder instead.
- **Nothing is overwritten.**
  - `create_report` writes a new report next to your model under a free name, and refuses to write at all if any of
    its files already exists. It never changes your model or an existing report.
  - `generate_theme` writes a new theme file and picks a free name (`name.json`, then `name-2.json`, `name-3.json`, ...).
  - `check_model_health` writes its fix scripts as new files next to the project, under free names; asked again, it
    names the file that already holds exactly that script instead of writing a second copy. When the working folder
    is the model folder itself it writes no script (nothing is ever written inside a model folder) and says so.
  - A name counts as taken when anything at all is there, including a link whose target is missing, and every new
    file is created in a way that fails if the name exists: nothing is written over a file or through a link.
  - `read_model`, `suggest_fields` and `plan_layout` only read.
  - Your logo and background images are copied into the new report; the originals are not changed.
- **Nothing is deleted.** No tool deletes a file.
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

## Known gaps
None open. Closed on 2026-10-04 (round 5, from the audit of 2026-10-04), each with tests that failed before the fix:
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
