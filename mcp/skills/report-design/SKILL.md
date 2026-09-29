---
name: report-design
description: Design or restyle a Power BI report on the user's own model with the DataArcus MCP, then check it in Power BI Desktop. Use when the user asks for a report design, a new report on their model, a theme or layout applied to a report, or a check that a report looks right.
---

# Power BI report design with DataArcus

Tools: the DataArcus MCP (`read_model`, `suggest_fields`, `check_model_health`, `create_report`), Microsoft's Power BI
Authoring MCP (connect to the model in Desktop, run DAX), and the `powerbi-desktop` bridge CLI (open, reload, screenshot).

## Workflow
1. **Understand the model.** `read_model` on the user's project folder. Tell the user in two lines what you see: the
   main measures, the date table, the obvious categories. Ask what the report is for if they didn't say (who reads it,
   which decision it supports).
2. **Pick fields.** `suggest_fields` with the number of KPI cards. Show the picks in a short table and let the user
   change any of them before building.
3. **Plan the page.** Title and logo along the top, KPI cards in one row, one main chart that answers the report's
   question, supporting charts, a detail table last. Keep a 24 px margin and equal gaps. For Arabic, set `rtl` and
   `lang: "ar"`. Explain the plan in a few lines and wait for "go".
4. **Build.** `create_report` with the theme file if the user has one (the report takes the theme's colours). It
   writes a new report next to their model and never changes the model or an existing report.
5. **Open and look.** `powerbi-desktop open` on the new .pbip (Store installs need `PBI_DESKTOP_PATH`), then
   `powerbi-desktop screenshot` one page at a time. Look at every screenshot yourself: cut-off text, overlaps, empty
   visuals, unreadable colours.
6. **Check the numbers.** Connect with the Power BI Authoring MCP and run a DAX query for each KPI; compare with what the
   card shows.
7. **Fix and repeat** from step 4 with a new name until the page is clean, then tell the user which file to open and
   what you checked.

## Health check: skipped checks on a TMDL project
If `check_model_health` returns `skipped`, the project has DAX tables whose column types are not in its files. Get
them from the same model open in Power BI Desktop:
1. The model must be the same project, saved (unsaved edits can change a type). With Microsoft's Power BI Authoring
   MCP: `ListLocalInstances`, connect only to the instance whose window title is this project, and check its tables match
   what `read_model` shows. Anything else open: stop and ask the user to close it.
2. Run the DAX query in `skipped.getThem[1]` (`dax_query_operations`, Execute). Or `column_operations` List, whose
   `dataType` per column (`DateTime`, `Int64`...) works the same.
3. Call `check_model_health` again with `columnTypes`: `{ "Table[Column]": type }` for every row, the type as returned.
4. Read `columnTypes` in the answer: `notInModel` and `badType` must be empty, and `skipped` gone. If not, tell the
   user which columns and why; never guess a type.

## Rules
- Work only inside the DataArcus folder; never connect to another model open in Desktop.
- Never overwrite, delete or save over the user's files. Close test windows without saving.
- Say exactly what you checked and what you could not check. A step you couldn't do is reported, not skipped.
- If something needs the user (TMDL view, Power Query, saving, the theme import dialog), give the exact clicks and wait for "done".
