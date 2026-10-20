# DataArcus in VS Code: research (V1, B-194, 20 Oct 2026)

What VS Code supports today for an extension that ships an MCP server, and what the Marketplace needs. Microsoft's
own docs first; where they are silent, VS Code's source at tag 1.142.0 (the current stable,
https://update.code.visualstudio.com/api/releases/stable), cited as `src/...` = `https://github.com/microsoft/vscode/blob/1.142.0/src/...`.
**Measured** marks what this prototype ran in a headless VS Code 1.142.0 in the cloud container (`npm run e2e`).
"Unconfirmed" means no source was found.

## 1. The extension API
- An extension declares `contributes.mcpServerDefinitionProviders: [{ id, label }]` and calls
  `vscode.lm.registerMcpServerDefinitionProvider(id, provider)` with the same id.
  https://code.visualstudio.com/api/extension-guides/ai/mcp ;
  https://github.com/microsoft/vscode/blob/main/src/vscode-dts/vscode.d.ts
- The provider: `provideMcpServerDefinitions()` (called without the person doing anything),
  `onDidChangeMcpServerDefinitions` (we fire it when the folders or the `dataarcus.*` settings change), optional
  `resolveMcpServerDefinition()` (called when the server must start; may ask the person; returning undefined stops
  the start). (vscode.d.ts)
- `new McpStdioServerDefinition(label, command, args?, env?, version?)`, positional; `cwd?: Uri` is a property set
  afterwards. The guide's sample passes one options object: the d.ts is right. A changed `version` makes VS Code
  offer to refresh the tools. (vscode.d.ts)
- **Minimum VS Code: 1.101** (June 2025): the API is absent from vscode.d.ts at 1.100.0 and present at 1.101.0;
  release notes: "Extensions can now publish collections of MCP servers", https://code.visualstudio.com/updates/v1_101 .
  MCP support and the MCP gallery became generally available in 1.102, which also added elicitation:
  https://code.visualstudio.com/updates/v1_102 . `engines.vscode: "^1.101.0"`.
- **Activation:** implied. VS Code derives `onMcpCollection:<id>` from the contribution
  (`src/vs/workbench/contrib/mcp/common/mcpConfiguration.ts`); no `*`, no start-up event. `vsce` still needs an
  `activationEvents` property when there is a `main`, so it is an empty list. **Measured:** the extension activated
  and registered in 1.142.0.

## 2. What the person sees and approves
- **No trust prompt for a server an extension provides:** extension collections are registered as trusted by
  default (`isTrustedByDefault: true`, `src/vs/workbench/api/common/extHostMcp.ts`,
  `contrib/mcp/common/mcpTypes.ts`). The trust step is installing the extension: VS Code asks the person to trust a
  new publisher on first install (since 1.97),
  https://code.visualstudio.com/docs/configure/extensions/extension-runtime-security . Servers from `mcp.json`
  follow Workspace Trust and may prompt on first start; **MCP: Reset Trust**,
  https://code.visualstudio.com/docs/agents/run/manage-mcp-servers .
- **Tool confirmation:** VS Code asks before each tool call unless the tool declares `readOnlyHint` (DataArcus's five
  reading tools do; the writing tools and `approve_plan` don't, so they are confirmed). Approve once, for the
  session, the workspace or always; `chat.tools.eligibleForAutoApproval`, `chat.tools.global.autoApprove`.
  https://code.visualstudio.com/api/extension-guides/ai/mcp ; https://code.visualstudio.com/docs/agents/run/approvals
- **Where it shows:** **MCP: List Servers** (Start, Stop, Restart, Show Output), the Agent Customizations editor,
  the chat's tools list. Whether an extension's server is listed under the Extensions view's "MCP SERVERS -
  INSTALLED": unconfirmed. https://code.visualstudio.com/docs/agents/run/manage-mcp-servers
- **The gallery and `mcp.json`:** `@mcp` in the Extensions view, MCP: Add Server > Browse MCP Servers
  (https://code.visualstudio.com/docs/agent-customization/mcp-servers); `.vscode/mcp.json` and the profile's
  `mcp.json` (now labelled deprecated in the Add Server flow), the portable `.mcp.json`, `${workspaceFolder}`,
  `code --add-mcp '<json>'` (https://code.visualstudio.com/docs/agents/reference/mcp-configuration). An install
  link has the form `vscode:mcp/install?<URL-encoded JSON>` (`contrib/mcp/browser/mcpWorkbenchService.ts`; no doc page
  found). The extension makes none of this necessary: the person installs one extension.
- **Organisation policy:** `chat.mcp.access` (`none` | `registry` | `all`, default `all`; policy `ChatMCP`). **With
  `registry`, servers provided by extensions are not started** (`contrib/mcp/browser/mcpDiscovery.ts`,
  `discovery/extensionMcpDiscovery.ts`). Admins also have `chat.mcp.allowedServers`. Said in the README.

## 3. How VS Code runs the server
- Spawned by the extension host, no shell (`src/vs/workbench/api/node/extHostMcpNode.ts`): the environment is a
  copy of the extension host's, then the definition's `env` (`null` removes a variable; `PATH` is appended); the
  working folder is the definition's `cwd`, else the person's home folder (an extension's server gets no workspace
  default). stderr goes to the server's Output channel; a non-zero exit shows as an error.
- `DATAARCUS_ROOT`: the prototype passes the `dataarcus.workingFolder` setting (absolute, or inside the first
  folder), else the first workspace folder, else an empty value (the server then refuses every tool and says why).
  **Measured:** the server got `DATAARCUS_ROOT=<the opened folder>` and `cwd=<extension>/server/mcp`, and
  `read_model` read the made-up project `twin-project/Twin Sales.SemanticModel` there.
- VS Code also sends the window's folders as MCP **roots** (`roots/list`, with change notifications); the server
  could read its folder from there one day (not used: the server's rule is one explicit folder).

## 4. Shipping Node and the server
- **Node:** the d.ts says Node servers "may use `process.execPath` to use the editor's version of Node.js"; the
  extension host sets `ELECTRON_RUN_AS_NODE=1` for exactly this (`src/vs/workbench/api/node/extensionHostProcess.ts`).
  The prototype runs the server with `process.execPath` and `ELECTRON_RUN_AS_NODE=1` (set explicitly), so the person
  installs nothing; `dataarcus.nodePath` (machine scope: a workspace can't choose it) names another Node. Node inside
  VS Code: 1.101 = 22.15.1, 1.105 = 22.19.0, 1.115 = 22.22.1, 1.142 = 24.21.0 (VS Code's `.npmrc` per tag and
  https://releases.electronjs.org/releases.json); the server needs 20.10 or later. **Measured:** in 1.142.0 the
  server ran on VS Code's runtime (`ELECTRON_RUN_AS_NODE=1`) and listed its 11 tools.
- **The server, bundled (decision):** the `.vsix` carries the server from this repo (`npm run stage` copies
  `mcp/server.mjs`, `mcp/lib/`, `mcp/schemas/`, `mcp/package*.json` and the 30 files of `assets/` its import graph
  reaches into `vscode/server/`, then `npm ci --omit=dev --ignore-scripts`). Not the installed `.mcpb`'s folder:
  that folder belongs to Claude Desktop (absent without it, moved or removed by its updates, its version not ours to
  pin), and a Marketplace extension must work on its own. Not a download: the extension opens no connection, and the
  Marketplace signs and scans what it ships
  (https://code.visualstudio.com/docs/configure/extensions/extension-runtime-security).
- **Size:** 10,816,227 bytes (`vsce package`, 3,715 files; the validator's production packages are 36.5 MB of the
  unpacked 58 MB, as in the `.mcpb`, audit A8-6).

## 5. The approval (elicitation, and the browser window)
- **VS Code declares MCP elicitation, form and URL modes.** **Measured** (the initialize request VS Code 1.142.0
  sent the server): protocol `2025-11-25`, capabilities `roots`, `sampling`, `elicitation: { form: {}, url: {} }`,
  `tasks`, MCP Apps. Elicitation since 1.102 (https://code.visualstudio.com/updates/v1_102); URL mode is in the
  2025-11-25 spec (https://modelcontextprotocol.io/specification/2025-11-25/changelog); the first VS Code with URL
  mode is unconfirmed.
- So in VS Code, `approve_plan` takes **VS Code's own prompt** (`approvedBy: "user-in-app"`), not the browser window:
  the server's rule (`mcp/server.mjs`, A6-3) uses the app's prompt whenever the app declares elicitation. The prompt
  shows in the chat as a question form with the plan's files (`contrib/mcp/browser/mcpElicitationService.ts`);
  the assistant cannot answer it.
- **A skipped form is an "accept" with the defaults** (`chatQuestionCarouselPart.ts`, `chatListRenderer.ts`): the
  person sends a new chat message while it is open, or turns on the experimental `chat.autoReply`. DataArcus's form
  has `approve` with `default: false`, so a skip answers "not approved" and the server **refuses** the plan (safe:
  never an approval; but the plan can't be approved later). Global auto-approve does not answer questions (its
  setting text). Whether Autopilot answers MCP forms: unconfirmed. See "Seen, not in scope" in `mcp/work/V1.md`.
- **The browser window:** only for apps without elicitation, so not used in VS Code. Had it been: `vscode.env.openExternal`
  opens a link on the person's machine and forwards localhost ports; the server spawning a browser itself may open
  on the wrong machine in a remote window (https://code.visualstudio.com/api/advanced-topics/remote-extensions).
  The server has no VS Code API (it is a separate process), so `openExternal` would need URL-mode elicitation (VS Code
  opens the link through its own opener) or the extension's help.
- Remote windows (WSL, SSH, Codespaces): the prototype is `extensionKind: ["workspace"]` (the server runs where the
  files are); not tested.

## 6. The Marketplace
- **Publisher:** create it at https://marketplace.visualstudio.com/manage (the ID is permanent: `dataarcus` in the
  prototype's `package.json`). Publishing: `vsce publish` with an Azure DevOps token, but **"On December 1, 2026,
  global Personal Access Tokens (PATs) in Azure DevOps are retired"**; Microsoft recommends Entra ID workload
  identity with a managed identity and `vsce publish --azure-credential`. The manage page also takes a `.vsix`
  uploaded by hand (no token). https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **Verified publisher (the blue tick, dataarcus.com):** the publisher's extension on the Marketplace for at least 6
  months and the domain registered for at least 6 months; a DNS TXT record on dataarcus.com (not a subdomain), the
  site on HTTPS answering 200 to HEAD; review up to 5 business days; renaming the display name later removes it.
  (same page)
- **Signing and scanning:** the Marketplace signs every extension on publish, VS Code checks the signature on
  install, and it scans for malware and secrets before it is public.
  https://code.visualstudio.com/docs/configure/extensions/extension-runtime-security
- **Manifest fields** (https://code.visualstudio.com/api/references/extension-manifest): `publisher`, `license`
  (`SEE LICENSE IN LICENSE`: the repo's licence, which allows using the output and forbids copying the code),
  `repository`, `icon` (PNG, at least 128 px: the site's 192 px icon), `galleryBanner`, `categories` (VS Code's own
  list has `AI` and `Chat` though the docs page doesn't yet: `src/vs/platform/extensions/common/extensions.ts`),
  `keywords` (30 at most), `pricing` (Free by default), `qna`. **No privacy-policy field:** the privacy text is in
  the README, linking `mcp/PRIVACY.md`. `vsce` warns when LICENSE or `repository` is missing.
- **Telemetry:** nothing to declare for an extension that collects none
  (https://code.visualstudio.com/api/extension-guides/telemetry). VS Code's own telemetry can log
  `mcp.elicitationRequested` with the server's name and version (`contrib/mcp/common/mcpServer.ts`), under the
  person's VS Code setting: said in the README.
- **The install count (B-193):** the listing shows the Marketplace's `install` statistic (the query API returns it
  as `statistics.install`); the publisher's Reports page shows acquisition. What exactly one install counts (each
  machine, updates or not): unconfirmed, no Microsoft definition found. Quote it as "installs shown on the
  Marketplace", with the date.
- **Open VSX** (Cursor, VSCodium, other forks): an Eclipse account, the Publisher Agreement, a token, `npx ovsx
  publish`. https://github.com/eclipse/openvsx/wiki/Publishing-Extensions ; Cursor installs from Open VSX
  (https://cursor.com/docs/configuration/extensions). A later step, the owner's.

## 7. Power BI extensions on the Marketplace (installs as the Marketplace API returned them on 20 Oct 2026)
Names and counts only. Source: https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery (searches:
power bi, powerbi, tmdl, dax, pbip, fabric mcp, semantic model).

| Installs | Extension | Publisher |
|---:|---|---|
| 252,639 | Power BI Authoring MCP Server (was "Power BI Modeling MCP") | Microsoft |
| 95,455 | DAX for Power BI | jianfajun |
| 94,047 | Power BI Studio | Gerhard Brueckl |
| 88,349 | Microsoft Fabric | Microsoft |
| 68,116 | TMDL | Microsoft |
| 42,822 | Fabric Studio | Gerhard Brueckl |
| 42,156 | Microsoft Fabric MCP Server | Microsoft |
| 37,196 | Power BI VSCode Extension Pack | Gerhard Brueckl |
| 25,299 | DAX Language Support | huyza |
| 6,772 | Bravo Template Editor | SQLBI |
| 5,083 | Power Bi Themes Extension | Alex Glushko |
| 3,262 | Power BI MCP | Syscobyte AB |
| 1,581 | PBI Document | Data Analyst Tools |
| 1,495 | SemanticOps MCP - Power BI MCP Server | Maxim Anatsko |
| 1,439 | pbi-tools | Nesrunas |
| 980 | Fabric & Power BI Toolkit for Claude | Jason Nicolini |
| 578 | PBI Lens (Power BI Viewer + MCP) | duckduck_beps |
| 564 | Power BI Translation Workspace | Jason Nicolini |
| 289 | PBIP Lens | Nara Technologies |
| 181 | PBIR Design Analyzer | bcrowell |
| 48 | Power Viz - Power BI Projects | Afzal Khan |
