# DataArcus MCP

The engines behind dataarcus.com's Power BI tools, as an MCP server for Claude Code (or any MCP client).
It works next to Microsoft's Power BI Authoring MCP server (model edits, DAX queries) and the Power BI Desktop bridge (reload, screenshots).

| Tool | What it does |
|---|---|
| `read_model` | Tables, visible columns with types, measures with formats, date tables. Reads a project folder (TMDL or model.bim), a model.bim or a .pbit. Changes nothing. |
| `suggest_fields` | Which measures and columns go in each KPI card, chart, table and slicer (same rules as the theme generator). |
| `check_model_health` | The Model Health Check: score and every finding with its objects. Reads a project folder (TMDL or model.bim), a model.bim or a .pbit. On a TMDL project, checks that need the type of a DAX table's column are listed as skipped (the files don't have it), with how to get them. |
| `create_report` | A new report (PBIR) next to the user's model, every visual placed and bound to their fields. Never touches the model or an existing report; picks a free name. |

## Safety
- Every path must be inside one folder: `DATAARCUS_ROOT` (default: the folder the server starts in). Anything outside is refused.
- Nothing is overwritten: `create_report` refuses to write if any file already exists.
- Keep employer or client files you may not share out of that folder.

## Install (Windows, in the DataArcus folder)
```
cd C:\DataArcus\DataArcus\mcp
npm install
claude mcp add dataarcus --env DATAARCUS_ROOT=C:\DataArcus -- node C:\DataArcus\DataArcus\mcp\server.mjs
```
Then in Claude Code: `/mcp` should list `dataarcus` with 4 tools.

## Test
`npm test` starts the server like an agent would and calls every tool on copies of the fixtures.
