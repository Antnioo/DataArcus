# DataArcus for Power BI

Design and check Power BI reports on your own model from VS Code's chat. This extension adds the DataArcus MCP
server to VS Code's MCP support: in the chat's agent mode, the AI can read your model's structure, suggest fields,
check your model's health, plan a report page by page and write a new Power BI report project (PBIR) next to your
model, after you approve the plan. It is the same server as the DataArcus extension for Claude Desktop, bundled here:
nothing else is downloaded.

## What you need
- **VS Code 1.101 or later**, with a chat that has agent mode and MCP tools (GitHub Copilot Chat, or another AI
  extension that uses VS Code's MCP servers).
- **Power BI projects** (`.pbip`, saved from Power BI Desktop with File > Save as) in a folder you open in VS Code.
  Opening the reports DataArcus writes needs **Power BI Desktop on Windows**, updated to its latest version. Reading
  models and checking reports works on any system.
- If your organisation manages VS Code: its MCP policy must allow servers from extensions (`chat.mcp.access` set
  to `all`; with `registry` VS Code does not start them).
- Nothing else: the server runs on VS Code's own runtime. To use another Node.js (20.10 or later), set
  `dataarcus.nodePath`.

## How to use it
1. Open the folder that holds your `.pbip` projects (File > Open Folder) and trust it: DataArcus runs only in a
   trusted folder.
2. Open the chat, choose agent mode, and check that DataArcus's tools are on in the tools list (VS Code starts the
   DataArcus server itself; **MCP: List Servers** shows it, with Start, Stop and Show Output). Before a tool that
   writes runs, VS Code asks you to allow it; the reading tools run without asking.
3. Ask, for example: "Read the model in Sales and suggest a report".
4. Before anything is written, DataArcus asks **you**: VS Code shows its approval prompt with every file the plan
   writes (in an app without that prompt, DataArcus opens its approval page in your browser instead). The AI's reply
   approves nothing.
5. Open the new `.pbip` in Power BI Desktop. DataArcus never writes over an existing report.

## Settings
- `dataarcus.workingFolder`: the folder DataArcus reads and writes in. Empty: the first folder open in VS Code. With
  no folder open, every tool refuses and says why.
- `dataarcus.nodePath`: the Node.js program that runs the server. Empty: VS Code's own runtime.

## Privacy, in plain words
- **The extension itself has no telemetry and opens no network connection.** It only tells VS Code how to start the
  DataArcus server on your computer.
- **The server runs on your computer and sends nothing anywhere by itself.** It talks only to VS Code, over standard
  input and output. While a plan waits for your approval in a browser, it serves that page at `http://127.0.0.1`
  (your computer only).
- **It reads and writes only inside your working folder**, and writes only after your approval: new files, never
  over yours (the one file it replaces is its own answers file beside a model, as the approved plan says).
- **But whatever a tool returns goes to the AI** your chat uses (with GitHub Copilot, to GitHub and its model
  providers, under your Copilot terms). DataArcus returns your model's **structure** (the names of tables, columns
  and measures, their types and formats), **never the data in your tables**. Names are information too: put in the
  folder only models whose names you may share with that AI. From a report it also returns short texts a person typed
  there (page names, titles, text boxes), screened for instructions and length only.
- VS Code's own telemetry, if you leave it on, can record that an MCP server named DataArcus asked for an approval
  (its name and version, not what it asked); the `telemetry.telemetryLevel` setting controls it.
- The full page, tool by tool: [PRIVACY.md](https://github.com/Antnioo/DataArcus/blob/main/mcp/PRIVACY.md).

## Links
- DataArcus: [dataarcus.com](https://dataarcus.com/power-bi-mcp/)
- Source and issues: [github.com/Antnioo/DataArcus](https://github.com/Antnioo/DataArcus)
- Licence: see `LICENSE` (the tools' output is yours for any use; the code may not be copied or redistributed).
