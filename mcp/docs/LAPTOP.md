# The live loop on the owner's laptop

Moved here unchanged by A1 (0.3.1, 25 Oct) from `mcp/CLAUDE.md` ("The live loop on this laptop").

- **Use only Microsoft's Power BI Authoring MCP for DataArcus work.** The "MCP Engine for Power BI" connector is the owner's tool for his job's dashboards: never use it here, so employer models stay out of DataArcus.
- **Microsoft's Power BI Authoring MCP** (from the `powerbi-authoring` plugin): connect to the model open in Desktop, create tables, measures, relationships, run DAX, refresh. EULA accepted by the owner.
- **Desktop bridge CLI** (`powerbi-desktop`): `status`, `open`, `reload`, `screenshot <page-id>`. Power BI is the Microsoft Store version: set `PBI_DESKTOP_PATH` for `open`. `screenshot-all` fails on generated projects (REPORT_DIR_REQUIRED); take pages one at a time and close any capture window left behind.
- **DataArcus MCP**: this folder. It loads its code **once, when the session starts**: switch to the branch you
  work on first, then start the session. The desktop app has no restart button: start a new session, or run the
  branch's mcp/server.mjs directly over stdio (as mcp/test.mjs does). Otherwise the tools run the old code.
  The repo on this laptop is `C:\DataArcus\DataArcus`.
- **What still needs a person:** applying a TMDL script in TMDL view, Power Query steps that remove columns (Close & Apply), saving files, importing a theme through View > Themes. Say exactly what to click, then wait for "done".
