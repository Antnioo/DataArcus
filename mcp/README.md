# DataArcus MCP

DataArcus designs and checks Power BI reports on your own model, from Claude: it reads your model's names, types and
formats (never its data values), plans each page with you, and writes a new report only after you approve the plan in
its approval window. It works next to Microsoft's Power BI Authoring MCP server (model edits, DAX queries) and the
Power BI Desktop bridge (reload, screenshots).

This page is the user guide. Every tool's options and answers in detail: [TOOLS.md](TOOLS.md). How DataArcus is
built: [ARCHITECTURE.md](../ARCHITECTURE.md). Help, bug reports and how fast we answer: [SUPPORT.md](../SUPPORT.md).

## Claude Desktop (beta)

For testers on Windows: download the file, check it with one command, then install it with a double-click.

1. **Power BI Desktop 2.159.883.0 (October 2026) or later**, the lowest version the 0.3.0 laptop proofs ran on
   (Help > About shows yours; the Microsoft Store version updates itself), and save your reports as Power BI projects
   (File > Save as > `.pbip`).
<!-- RELEASE 0.3.1: when dataarcus-0.3.1.mcpb is released, change 0.3.0 to 0.3.1 in step 2 (three places). -->
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

## What each tool does

| Tool | In plain words |
|---|---|
| `read_model` | Reads your model's tables, columns, measures and date tables: names, types and formats, never data values. Changes nothing. |
| `suggest_fields` | Suggests which measures and columns go in each KPI card, chart, table and slicer. Changes nothing. |
| `check_model_health` | The Model Health Check, the same engine as the website's: a score and every finding with where its rule comes from. Fix scripts for you to apply yourself, written only after you approve. |
| `add_gulf_calendar` | A Gulf date table (Hijri dates, Ramadan and Eid, the country's weekend) as a TMDL script you apply yourself in Power BI Desktop, written only after you approve. |
| `generate_theme` | A Power BI report theme from your colours or a preset, as the website's Theme Generator makes it, in the glass look by default (the plain look when you ask, or where glass can't keep the text readable); saved as a file only after you approve. |
| `plan_layout` | Plans the report with you: every page, where each visual goes, its fields, names and look, checked against your model. Writes nothing; the plan is what you approve. With `sample: true` it plans the sample project. With `redesignFrom` it plans a copy of a report you already have; `consistentText` gives that copy one font and size per kind of text (`keepPositions` keeps every visual where it is). |
| `approve_plan` | Opens DataArcus's approval window so you can approve a plan (below). Writes no file. |
| `create_report` | Writes the approved report as a new `.pbip` next to your model. It never touches the model or an existing report. New reports are in the glass look by default (see-through cards over a soft page picture made from your theme's own colours), where it keeps every text readable; ask for the plain look (`chart.look: "auto"`) and you get Power BI's own cards. |
| `create_arabic_twin` | Writes the right-to-left Arabic copy of an existing report ("<name> AR"), or one report holding both languages; the Arabic texts are drafts you approve. |
| `read_report` | Reads an existing report's pages and visuals (place, size, fields); returns no filter values, slicer selections or data values. Changes nothing. |
| `check_report` | Checks any existing report with Microsoft's validator, offline, and the rules DataArcus measured in Power BI Desktop; `lens: "arabic"` answers "is this report ready for Arabic?"; it says where visuals mix fonts or sizes. Changes nothing. |

**How approval works.** No tool writes a file without a plan you approved. `approve_plan` opens DataArcus's approval
window in your default browser, served on your computer only; it shows the plan and every file it writes, and only
your click on **Approve** approves (`approvedBy: "user-in-browser"`). In an app that supports MCP elicitation, the
app's own prompt asks instead. What the window can't stop: another program on your computer that controls your
browser or mouse could click it too. Details: `approve_plan` in [TOOLS.md](TOOLS.md) and [PRIVACY.md](PRIVACY.md).

## Layouts

`plan_layout` and `create_report` lay out a page in one of four layouts. Executive summary (`exec`) and Single focus
(`focus`) are the tested ones. Operations monitor (`ops`, preview), Analysis as the first page (`analysis`, preview)
and a page under 1920 wide with the filters on top (preview) work, and the plan says so in one line:

"Preview: this layout is still being tuned on real dashboards; the executive and single-focus layouts are the tested ones."

## Safety
What stays on the machine and what the AI app sees: `PRIVACY.md`. What DataArcus promises: `PRODUCT_SPEC.md`.
- Every path must be inside one folder, the working folder: `DATAARCUS_ROOT`. Anything outside is refused, also when a link (symbolic link or junction) inside the folder leads outside it, and also for the paths a tool picks itself (the model folder a `.pbip` points at).
- `DATAARCUS_ROOT` must be set: without it (or empty) the server starts but every tool refuses and says why; it never uses the folder it starts in. For the current folder set `DATAARCUS_ROOT=.` on purpose. A folder that doesn't exist yet is created on start when its parent exists.
- The version is read from `mcp/package.json`. Tools declare what they do to files: five only read (`readOnlyHint`: `read_model`, `suggest_fields`, `plan_layout`, `read_report`, `check_report`); `generate_theme`, `create_report`, `create_arabic_twin`, `check_model_health` (its fix scripts) and `add_gulf_calendar` add files (`destructiveHint: false`), and only with an approved plan id; `check_model_health` also replaces or empties its own answers file (below), only as its approved plan says; `approve_plan` writes no file. `check_model_health` and `add_gulf_calendar` are also `idempotentHint: true`: a second plan on the same model names the same files and writes nothing new (the others write another file under a free name).
- Never edit a report's or model's files yourself (no script or file tool): ask DataArcus for a plan (check_report's fixWith names it), show it, wait for approval. (The server's instructions give the AI app this rule too.)
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

## The plugin for Claude Code and GitHub Copilot CLI (not published yet)
`mcp/skills-packaging/` is DataArcus as a plugin next to Microsoft's Power BI authoring plugin (`powerbi-authoring`):
a routing skill that says which of the two does what (Arabic and right-to-left work, Gulf dates, the health check and
approved writes stay with DataArcus; editing an existing report, screenshots, publishing and model changes go to
Microsoft's), the `report-design` skill, and the DataArcus server as the same `.mcpb` the release page gives (Claude
Code starts it from the release's address; GitHub Copilot CLI gets it by hand). Not published yet: the folder becomes
its own public repository after the 0.3.1 release; until then, install DataArcus as above. Its install steps are in
`skills-packaging/README.md`.

## Test
`npm test` starts the server like an agent would and calls every tool on copies of the fixtures. The suites are
listed by area in `tests.json`: `npm test -- --list` shows them, `npm test -- <area>` runs one area.
