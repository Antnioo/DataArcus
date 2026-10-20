# DRAFT: the privacy page's changes for render_report (S2, 20 Oct 2026; not applied)

For the owner to approve, edit or refuse. `mcp/PRIVACY.md` is **not** changed by S2: these sentences go in only with
the owner's go, when `render_report` leaves its switch (`DATAARCUS_EXPERIMENTAL_RENDER=1`). Until then the tool is not
listed and the page stays true as it is. Each change below names the sentence it replaces or the place it goes.

## Section 3, "Metadata only: no data values"

**Replace** "It never opens Power BI's data cache, never connects to Power BI Desktop or to your data sources, and runs
no queries." **with:**

> It never opens Power BI's data cache, never connects to your Power BI Desktop, your model or your data sources, and
> runs no queries. One tool, `render_report`, **starts** Power BI Desktop, on your computer only and only when you ask:
> it opens a throwaway copy (see "Seeing what Desktop draws" below), never your model or your report.

**Add a new bullet after "What a new report's files hold":**

> - **Seeing what Desktop draws (`render_report`, Windows only).** To let the AI see a written report as Power BI
>   Desktop draws it, DataArcus writes a throwaway copy of the report's model: the same tables, columns, types,
>   formats, sort-by columns, hierarchies, relationships and measures (their DAX), with **made-up rows** in place of
>   every row (DataArcus reads the model's definition only; the model's own rows, sources, "Enter data" and DATATABLE
>   values are never read into the copy). It opens that copy with a copy of the report in Power BI Desktop, in its own
>   window, captures each page as an image, closes that window by its process id and deletes the copies. The images go
>   to your AI app. What they show:
>   - **No value of your data:** every number, date and label inside the visuals is made up.
>   - **Names:** page names, titles, text boxes, field and measure names, as the report shows them: the same names the
>     AI already gets as metadata, and the report's own texts (a title someone typed a figure or a name into shows as
>     typed).
>   - **Constants in your DAX, if you keep them.** A measure such as `Target = 5000000`, or a calculated column such as
>     `SWITCH([Code], 1, "Customer X", ...)`, computes on the made-up rows, but its constants are your model's and can
>     show in an image. Before anything is drawn, `render_report` lists every measure, calculated column and
>     calculation item whose DAX holds a constant (a number other than 0 and 1, or a text that is not a format
>     pattern), **by name and count only, never the values**, and asks you: replace them with made-up constants for
>     the render (`literals: "stub"`; your model is not changed), or keep them. It never chooses for you, and nothing is
>     drawn until you have chosen.
>   - **Field parameters' display names** (they are names, kept as they are).
>   Power BI Desktop is Microsoft's program, with Microsoft's own telemetry; what it sees here is the copy with made-up
>   rows. `render_report` refuses to start while your own Desktop window is in front, and stops (clicking nothing) if
>   Desktop opens a dialog (sign-in, an update, a privacy level), closing its own window.

**Change** the last bullet, "Data values only when you ask", by adding at its end:

> `render_report` is not such a check: its images hold made-up values only (the constants you chose to keep aside,
> above).

## Section 4, "Your files"

**Add to the list under "Nothing is overwritten"** (after the `plan_layout` J14 sentence, which is the same kind of
private temporary copy):

> - `render_report` writes nothing in your working folder. Its copy of the model (made-up rows) and of the report go
>   into a new private folder of the computer's temporary folder, opened there by Power BI Desktop and deleted when the
>   render ends, whether it worked or not; if the folder can't be deleted (a file still held by Windows), the answer
>   says so and names the folder (not its path) so you can delete it. It never writes next to your model.

**Change** "`read_model`, `suggest_fields`, `plan_layout`, `read_report` and `check_report` only read." **to:**

> `read_model`, `suggest_fields`, `plan_layout`, `read_report`, `check_report` and `render_report` only read your files
> (`render_report` starts Power BI Desktop on its temporary copy, above).

## Section 2's table (what each tool returns)

**Add a row** (the row's shape as the other tools'):

> | `render_report` | Experimental, Windows with Power BI Desktop. Reads the report's files and its model's definition; writes a temporary copy with made-up rows outside the working folder, opens it in Desktop, returns one image a page (made-up values; names and titles; DAX constants only if you keep them) and the page's boxes; deletes the copy. |

## "Known gaps" (add)

> - `render_report`'s images are of the whole Desktop window (ribbon, panes and page tabs included). The copy keeps
>   your model's names, so a table or measure name shown in the Fields pane is in the image, as it is already in the
>   metadata the AI gets.

## Decisions the owner makes before this goes in
1. The temporary folder: the OS temporary folder (this draft and the code), or inside the working folder.
2. The DAX-constant question's wording, English and Arabic (`mcp/lib/render-text.mjs`, LITERALS_ASK; the Arabic is not
   written yet).
3. Whether "keep" is offered at all, or constants are always replaced.
