# DataArcus MCP

The engines behind dataarcus.com's Power BI tools, as an MCP server for Claude Code (or any MCP client).
It works next to Microsoft's Power BI Authoring MCP server (model edits, DAX queries) and the Power BI Desktop bridge (reload, screenshots).

| Tool | What it does |
|---|---|
| `read_model` | Tables, visible columns with types, measures with formats, date tables. Reads a project folder (TMDL or model.bim), a model.bim or a .pbit. Changes nothing. A large model (a full answer over 40,000 characters) gets a summary first: counts, the date tables, the areas (measure display folders), the tables with measures and the other tables' names. `tables: [...]` returns named tables in full, on any model. |
| `suggest_fields` | Which measures and columns go in each KPI card, chart, table and slicer (same rules as the theme generator). Optional `focus` (a word the user said, such as "logistics") or `tables`: the picks then come from that part of the model (the matching tables with measures, the tables related to them, the date tables). A large model needs one: without it nothing is picked and the areas are listed. |
| `check_model_health` | The Model Health Check: score and every finding with its objects. Reads a project folder (TMDL or model.bim), a model.bim or a .pbit. On a TMDL project, checks that need the type of a DAX table's column are listed as skipped (the files don't have it), with how to get them. Optional `columnTypes` (`{ "Table[Column]": type }`, read from the same model open in Desktop) fills those types, so every check runs; types the files give are never replaced, and names or types that can't be used are listed back. Returns `fixes` for three findings (`MONTH_SORT`, `NO_FORMAT`, `PCT_FORMAT`): a TMDL script to paste into Desktop's TMDL view, the suggested format and its reason per measure, and steps by hand for what a script can't change safely; nothing is ever applied. Optional `weekStart` (`sunday` by default, `monday`, `saturday`) for a weekday number the sort script adds. For a Gulf model: optional `country` (`uae`, `ksa`, `qat`, `kwt`, `bhr`, `omn`) adds a `gulfCalendar` section, **not part of the score**: whether the calendar has Hijri, Ramadan and Eid columns and the model has Ramadan and Eid measures; for a calendar made by the DataArcus Calendar Generator also its weekend against the country's official weekend, its Ramadan and Eid dates against the announced ones (the UAE and Saudi Arabia, whose announced dates match for 2018-2026; for Qatar, Kuwait, Bahrain and Oman a date that differs from Umm al-Qura is only a low note to check the official announcement), unmarked estimates and a range that ends before the next Ramadan. What the files can't say is listed under `cantTell`. Its fixes name the website tools and the settings to pick (no DAX). Without `country` the section appears only when the model already has Hijri or Ramadan columns. `country` never changes `weekStart`. |
| `generate_theme` | A Power BI report theme (JSON), exactly as the DataArcus Theme Generator makes it: from a full palette, a brand colour and a harmony, or a preset; with the font, chart style and page. Written to a new file inside the DataArcus folder (never over an existing one). Returns the design for the next two tools, the readability checks and every input that could not be used. |
| `plan_layout` | The exact position of every visual on a page (exec, analysis, ops or focus layout; KPI cards; filters; header; page size), mirrored for right to left, also as PBIR positions for editing an existing report. Writes nothing. `kpis` 0 to 6: fewer than 3 cards share the KPI row, 0 leaves it out. |
| `create_report` | A new report (PBIR) next to the user's model, every visual placed and bound to their fields, from a design (`generate_theme` or `plan_layout`) or hand-placed pages. Never touches the model or an existing report; picks a free name. Optional `displayNames` (`{ "Table[Field]": "name" }`) shows fields under other names (Arabic names for an Arabic report) without renaming the model; an Arabic report lists the shown fields still under English names (`arabicNames.missing`). Charts by month or weekday names are put in order by the report when the model has the number column. In a right-to-left report the page buttons run right to left. Never more KPI cards than the model has measures: fewer cards are built and `kpiCards` says how many and why; with no measures the charts are left out too and named. On a large model it takes `focus` or `tables` like `suggest_fields`, and refuses without one. |

## Safety
What stays on the machine and what the AI app sees: `PRIVACY.md`. What DataArcus promises: `PRODUCT_SPEC.md`.
- Every path must be inside one folder, the working folder: `DATAARCUS_ROOT`. Anything outside is refused, also when a link (symbolic link or junction) inside the folder leads outside it.
- `DATAARCUS_ROOT` must be set: without it (or empty) the server starts but every tool refuses and says why; it never uses the folder it starts in. For the current folder set `DATAARCUS_ROOT=.` on purpose. A folder that doesn't exist yet is created on start when its parent exists.
- The version is read from `mcp/package.json`. Tools declare what they do to files: three only read (`readOnlyHint`: `read_model`, `suggest_fields`, `plan_layout`); `generate_theme`, `create_report` and `check_model_health` (its fix scripts) only add files (`destructiveHint: false`).
- Nothing is overwritten: `create_report` refuses to write if any file already exists.
- Keep employer or client files you may not share out of that folder.

## Install (Windows, in the DataArcus folder)
```
cd <repo folder>\mcp
npm install
claude mcp add dataarcus --env DATAARCUS_ROOT=<working folder> -- node <repo folder>\mcp\server.mjs
```
`<repo folder>` is where this repository is cloned; `<working folder>` is the folder that holds your Power BI projects.
Then in Claude Code: `/mcp` should list `dataarcus` with 6 tools.

## Test
`npm test` starts the server like an agent would and calls every tool on copies of the fixtures.
