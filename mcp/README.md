# DataArcus MCP

The engines behind dataarcus.com's Power BI tools, as an MCP server for Claude Code (or any MCP client).
It works next to Microsoft's Power BI Authoring MCP server (model edits, DAX queries) and the Power BI Desktop bridge (reload, screenshots).

| Tool | What it does |
|---|---|
| `read_model` | Tables, visible columns with types, measures with formats, date tables. Reads a project folder (TMDL or model.bim), a model.bim or a .pbit. Changes nothing. |
| `suggest_fields` | Which measures and columns go in each KPI card, chart, table and slicer (same rules as the theme generator). |
| `check_model_health` | The Model Health Check: score and every finding with its objects. Reads a project folder (TMDL or model.bim), a model.bim or a .pbit. On a TMDL project, checks that need the type of a DAX table's column are listed as skipped (the files don't have it), with how to get them. Optional `columnTypes` (`{ "Table[Column]": type }`, read from the same model open in Desktop) fills those types, so every check runs; types the files give are never replaced, and names or types that can't be used are listed back. Returns `fixes` for three findings (`MONTH_SORT`, `NO_FORMAT`, `PCT_FORMAT`): a TMDL script to paste into Desktop's TMDL view, the suggested format and its reason per measure, and steps by hand for what a script can't change safely; nothing is ever applied. Optional `weekStart` (`sunday` by default, `monday`, `saturday`) for a weekday number the sort script adds. |
| `generate_theme` | A Power BI report theme (JSON), exactly as the DataArcus Theme Generator makes it: from a full palette, a brand colour and a harmony, or a preset; with the font, chart style and page. Written to a new file inside the DataArcus folder (never over an existing one). Returns the design for the next two tools, the readability checks and every input that could not be used. |
| `plan_layout` | The exact position of every visual on a page (exec, analysis, ops or focus layout; KPI cards; filters; header; page size), mirrored for right to left, also as PBIR positions for editing an existing report. Writes nothing. |
| `create_report` | A new report (PBIR) next to the user's model, every visual placed and bound to their fields, from a design (`generate_theme` or `plan_layout`) or hand-placed pages. Never touches the model or an existing report; picks a free name. Optional `displayNames` (`{ "Table[Field]": "name" }`) shows fields under other names (Arabic names for an Arabic report) without renaming the model; an Arabic report lists the shown fields still under English names (`arabicNames.missing`). Charts by month or weekday names are put in order by the report when the model has the number column. In a right-to-left report the page buttons run right to left. |

## Safety
What stays on the machine and what the AI app sees: `PRIVACY.md`. What DataArcus promises: `PRODUCT_SPEC.md`.
- Every path must be inside one folder: `DATAARCUS_ROOT` (default: the folder the server starts in). Anything outside is refused.
- Nothing is overwritten: `create_report` refuses to write if any file already exists.
- Keep employer or client files you may not share out of that folder.

## Install (Windows, in the DataArcus folder)
```
cd C:\DataArcus\DataArcus\mcp
npm install
claude mcp add dataarcus --env DATAARCUS_ROOT=C:\DataArcus -- node C:\DataArcus\DataArcus\mcp\server.mjs
```
Then in Claude Code: `/mcp` should list `dataarcus` with 6 tools.

## Test
`npm test` starts the server like an agent would and calls every tool on copies of the fixtures.
