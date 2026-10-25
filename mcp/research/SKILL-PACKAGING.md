# DataArcus next to Microsoft's Power BI Report skill: packaging research (K1; 20 Oct 2026, brought up to date 25 Oct 2026)

The owner's decision of 20 Oct: build on Microsoft, not beside it. Use their layers (validator, preview and screenshots,
visual catalog, custom visuals, Fabric publishing) and ship only what they don't do, installed where their users
already are. This file answers the five questions of the K1 brief from Microsoft's and the tools' own sources. First written
for draft PR #85 (20 Oct, a prototype with a staging script); on 25 Oct (the owner, 22 Oct: "Yes, after 0.3.0 ships")
`mcp/skills-packaging/` became the folder the owner copies as-is into a new public repo. The work log is
`mcp/work/K1.md`.

## What changed since #85 (25 Oct 2026)
- **The plugin carries no DataArcus code.** #85's `stage.mjs` copied `mcp/` and the engines into the plugin and let
  Claude Code install the npm packages. Claude Code's plugin reference now documents an `.mcpb` bundle URL as an
  `mcpServers` value ("Downloads the bundle into `.mcpb-cache/`, then reads it"), so Claude Code's manifest points at
  the release bundle, `https://github.com/Antnioo/dataarcus-releases/releases/download/v<version>/dataarcus-<version>.mcpb`.
  Tried in this container on Claude Code 2.1.310 with the 0.3.0 bundle (the 0.3.1 one isn't released yet): the
  install added Microsoft's plugin with it, Claude Code downloaded the bundle at the first start, cached it by its
  SHA-256 (`.mcpb-cache/aa23ace80d6777df`, the hash the 0.3.0 release notes publish), and `claude mcp list` showed
  `plugin:dataarcus:dataarcus` and `plugin:powerbi-authoring:powerbi-modeling-mcp` both **Connected**. The bundle
  says `platforms: ["win32"]`; Claude Code on Linux started it anyway.
- **The working folder is the bundle's own setting.** The bundle's `user_config.working_folder` is asked by Claude
  Code at `/plugin` > Installed > dataarcus > Configure ("1 bundled server is fetched from a URL at session start and
  can only be configured in Claude Code"); `claude plugin install --config` does not fill it. Until it is set, Claude
  Code does not start the server ("requires user configuration; MCP server "dataarcus" not started"). The plugin
  declares no `userConfig` of its own (#85 did).
- **Copilot CLI gets the skills; the server is added by hand.** Copilot's plugin reference names stdio
  `command`/`args` servers only (no bundles), and DataArcus has no npm package (`dataarcus-mcp` is `private`; npm
  answers "Not found"). So Copilot's manifest names the two skills and no server, and the README adds the unpacked
  bundle with `copilot mcp add dataarcus --env DATAARCUS_ROOT=... -- node .../mcp/server.mjs` (Copilot CLI 1.0.103 in
  this container: both plugins installed, "Installed 2 skills" each; `copilot mcp list` shows the user server
  `dataarcus` and the plugin server `powerbi-modeling-mcp`; the unpacked 0.3.0 server lists the 11 tools; a Copilot
  chat needs a GitHub sign-in and was not run). Copilot also documents a new "Agent Plugins 1.0" format (a root
  `plugin.json` with `$schema` `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`, servers in a root
  `mcp.json`); legacy manifests "load as before". The folder keeps the legacy `.github/plugin/plugin.json`, the layout
  Microsoft's plugin uses.
- **One install line more in Claude Code than #85 said.** The cross-marketplace dependency resolves only when
  Microsoft's marketplace is already added: without it the install fails ("Dependency
  "powerbi-authoring@fabric-collection" ... not found. Is the "fabric-collection" marketplace added?"). Three
  commands in Claude Code, four plus the hand-added server in Copilot CLI.
- **The routing skill** covers today's 11 tools and 0.3.1's options: `check_report` `lens: "arabic"` (L1), one report
  in both languages with `languages: "en+ar"` and `tabsShown` (X2), `create_arabic_twin` `into: "same"`; and a rule
  never to accept Microsoft's EULA for the user (`accept_eula`). C's sample project is not in it: its branch had not
  landed (and it is an option of `plan_layout`/`create_report`, not a 12th tool).
- **`report-design`** ships as a copy, byte-identical to `mcp/skills/report-design/SKILL.md` (the test checks it).
- **Licence:** the folder's files are MIT (its own `LICENSE`); the bundle stays under DataArcus's licence ("All rights
  reserved"; its manifest says "Proprietary"). #85 put `LicenseRef-DataArcus` on the plugin; the plugin's files are
  now MIT and the README says the server is not.

## Sources read
Read again on 25 Oct 2026:
- `microsoft/skills-for-fabric` cloned on 25 Oct: still commit `bc42aaf` (5 Oct 2026, release v0.3.19), so the names
  below hold: marketplace `fabric-collection` (owner "Microsoft"), plugin `powerbi-authoring` (version 0.3.19,
  licence MIT, skills `semantic-model-authoring` and `powerbi-report-cli`, server `powerbi-modeling-mcp` started as
  `npx -y @microsoft/powerbi-modeling-mcp@latest --start`).
- Power BI Report skill overview (Microsoft Learn, fetched 25 Oct): "The **Power BI Report skill**
  (`powerbi-report-cli`) ... is distributed through the Power BI authoring plugin in the Skills for Fabric
  marketplace"; "For semantic-model development ... use the Power BI MCP servers".
- npm `@microsoft/powerbi-modeling-mcp` 1.0.0 (modified 25 Sep 2026), its README read 25 Oct: "Before use, you must
  accept the Power BI Authoring MCP End User License Agreement at https://go.microsoft.com/fwlink/?LinkId=2381247"
  (by `--accept-eula`, `PBI_MODELING_MCP_ACCEPT_EULA=true`, or its `accept_eula` tool); its `LICENSE` is MIT.
- Claude Code plugin manifest reference (https://code.claude.com/docs/en/plugins-reference, 25 Oct): `mcpServers`
  takes "an MCP bundle path or URL" ending `.mcpb` or `.dxt`; dependencies
  (https://code.claude.com/docs/en/plugins/dependencies, 25 Oct): `allowCrossMarketplaceDependenciesOn`;
  settings reference (`pluginConfigs`, "an optional `mcpServers` field holding per-server user configuration values").
  Claude Code 2.1.310's own `claude plugin validate --strict` and install in this container.
- GitHub Copilot CLI plugin reference
  (https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference, 25 Oct; no date on the
  page): legacy and Agent Plugins manifests, `${PLUGIN_ROOT}`/`${PLUGIN_DATA}` the only placeholders, no plugin
  dependencies. GitHub Copilot CLI 1.0.103 (npm `@github/copilot`) in this container.
- The DataArcus release `v0.3.0` on `Antnioo/dataarcus-releases` (21 Oct 2026): `dataarcus-0.3.0.mcpb`, SHA-256
  `aa23ace80d6777df5dcf47a0847ae8b96783034b2e1e0466625cae579704f9cb` (downloaded 25 Oct; matches the notes).

First read on 20 Oct 2026 (for #85):
- Power BI Report skill overview (Microsoft Learn):
  https://learn.microsoft.com/power-bi/developer/agentic/power-bi-report-skill-overview
- Power BI MCP servers overview (Microsoft Learn): https://learn.microsoft.com/power-bi/developer/mcp/mcp-servers-overview
- Skills for Fabric, the marketplace: https://github.com/microsoft/skills-for-fabric (read at commit `bc42aaf`, 5 Oct
  2026, version 0.3.19): `README.md`, `LICENSE`, `.claude-plugin/marketplace.json`, `.github/plugin/marketplace.json`,
  `apm.yml`, `plugins/powerbi-authoring/` (both `plugin.json` files, `.mcp.json`, the two skills' frontmatter),
  `.github/ISSUE_TEMPLATE/`.
- npm packages: `@microsoft/powerbi-report-authoring-cli` 0.5.0 (its `LICENSE`, `README.md`),
  `@microsoft/powerbi-modeling-mcp` 1.0.0 (its `LICENSE`, `README.md`, `NOTICE.txt`).
- Claude Code plugin docs: manifest https://code.claude.com/docs/en/plugins-reference, dependencies
  https://code.claude.com/docs/en/plugins/dependencies, loading and npm packages
  https://code.claude.com/docs/en/plugins/loading; Claude Code 2.1.304's own `claude plugin validate`.
- GitHub Copilot CLI plugin reference:
  https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference; GitHub Copilot CLI 1.0.100
  run in this container.
- Agent Skills format: the `SKILL.md` frontmatter both Microsoft's skills and ours use (`name`: lowercase, hyphens,
  up to 64 characters, the folder's name; `description`: up to 1,024 characters, what the skill does and when to use
  it; the body loads only when the skill is picked, and files it links load only when read: "progressive loading").

## What Microsoft ships (facts)
- **The Power BI Report skill** (`powerbi-report-cli`) is one skill with four modules (planning, design, authoring,
  management). Authoring validates and screenshots through the `powerbi-report-author` CLI (npm
  `@microsoft/powerbi-report-authoring-cli`, MIT), preferring Power BI Desktop and falling back to a headless browser.
  Management publishes, downloads, updates and deletes reports in Fabric workspaces. Model changes are for the Power BI
  MCP servers (Learn: "For semantic-model development ... use the Power BI MCP servers").
- **The marketplace** `microsoft/skills-for-fabric` is named `fabric-collection`, owner "Microsoft". Each plugin is
  a folder under `plugins/` with two manifests, `.claude-plugin/plugin.json` (Claude Code) and `.github/plugin/plugin.json`
  (Copilot CLI, with `$schema` and `tools: ["*"]` on each MCP server), plus `.mcp.json` and `skills/<name>/SKILL.md`.
  The marketplace file exists twice too (`.claude-plugin/marketplace.json`, `.github/plugin/marketplace.json`; the
  first is written by a repo workflow: "DO NOT TOUCH THIS FOLDER").
- **`powerbi-authoring`** carries two skills (`semantic-model-authoring`, `powerbi-report-cli`) and one MCP server,
  `powerbi-modeling-mcp`, started as `npx -y @microsoft/powerbi-modeling-mcp@latest --start` (unpinned: whatever is
  latest at each start). That server needs its EULA accepted first (its README: "Before use, you must accept the Power
  BI Authoring MCP End User License Agreement").
- **Install lines** (their README): Copilot CLI `/plugin marketplace add microsoft/skills-for-fabric`, then
  `/plugin install powerbi-authoring@fabric-collection`; one skill into other tools with APM
  (`apm install microsoft/skills-for-fabric --skill <name> --target copilot|claude|cursor|codex`); Claude Code calls
  it "a third-party marketplace" (auto-update off until the user turns it on); Cursor, Windsurf and Codex otherwise read
  the repo's root `.cursorrules`, `.windsurfrules`, `AGENTS.md` when it is cloned.
- **The MCP servers** (Learn): the Power BI Authoring MCP server (hosted preview at
  `https://api.fabric.microsoft.com/v1/mcp/powerbi/authoring`, or local over stdio, GA) creates and changes models and
  runs DAX; Fabric IQ answers data questions. Learn on data: "Metadata, schemas, and query results go to the MCP
  client, and the client might forward them to the configured large language model (LLM) provider".

## 1. Can DataArcus install as a plugin in the same format, next to Microsoft's, with one command?
**Yes in Claude Code (one install after the two marketplaces), two installs plus the server by hand in Copilot CLI;
tried in this container on 25 Oct.** The folder is a marketplace in the layout Microsoft uses (`.claude-plugin/` and
`.github/plugin/` marketplace files, `plugins/dataarcus/` with both manifests and `skills/`). Results (`mcp/work/K1.md`):
- `claude plugin validate --strict` (2.1.310): the plugin and the marketplace both "Validation passed".
- **Claude Code:** with both marketplaces added, `claude plugin install dataarcus@dataarcus` installed DataArcus **and
  Microsoft's `powerbi-authoring` with it** ("+ 1 dependency: powerbi-authoring"; Claude Code's plugin `dependencies`
  with the marketplace allowing `fabric-collection`). The server is the release `.mcpb` from its URL; with the working
  folder set, both servers Connected. Without Microsoft's marketplace added first the install is refused.
- **Copilot CLI 1.0.103:** `copilot plugin install dataarcus@dataarcus` installed the two skills; Microsoft's plugin
  is a second install (no dependencies in Copilot); the DataArcus server is added with `copilot mcp add` from the
  unpacked bundle (it can't start a bundle, and there is no npm package).
- **Cursor, Windsurf, Codex, VS Code:** not in the folder. The route Microsoft uses for them is APM (an `apm.yml` at
  the marketplace root) or the server added by hand plus the skill file (mcp/README.md has the VS Code and Cursor
  snippets). Not built or tested.
- **What a user needs:** Node 20.10 or later on PATH (Microsoft's plugin needs Node for `npx` too), and to choose the
  working folder (Claude Code: /plugin > Configure; Copilot: `--env DATAARCUS_ROOT=` in `copilot mcp add`).

## 2. Which DataArcus tools duplicate Microsoft's today, which are only ours
Compared with the Power BI Report skill (PRS), its `powerbi-report-author` CLI, and the Power BI Authoring MCP server
(PBI-MCP), as documented on 20 Oct 2026.

| DataArcus tool | Microsoft's equivalent | Verdict |
|---|---|---|
| `read_model` | PBI-MCP reads the model (tables, columns, measures, relationships) from Desktop, PBIP/TMDL or Fabric | **Duplicate** in what it lists. Ours: files only, inside one folder, metadata only with caps for large models |
| `suggest_fields` | PRS planning picks KPIs and fields with the user | **Partly duplicate** (theirs is the agent's judgement; ours is the Theme Generator's fixed rules) |
| `check_model_health` | PBI-MCP "Evaluate a model against modeling best practices and apply the fixes"; `semantic-model-authoring` has "Analyze Best Practices" and "AI Readiness" workflows | **Partly duplicate.** Ours only: the Gulf calendar section (Hijri, Ramadan, Eid, weekend per country), each finding with its rule's source, fixes as scripts the user applies (never applied) |
| `generate_theme` | PRS design: themes, colours, typography, brand | **Duplicate** in purpose. Ours: the website's Theme Generator, readability checks, Arabic fonts |
| `plan_layout` | PRS design: layout, visual hierarchy | **Partly duplicate.** Ours only: measured positions from Desktop (not estimates), right-to-left mirroring, Arabic display names the user approves |
| `approve_plan` | PRS planning "records approval"; an instruction ("GREENFIELD APPROVAL BARRIER ... never build or publish until the user explicitly approves") | **Ours only as an enforced gate:** the server refuses every write without a plan approved by the user's click in a browser window; theirs is a rule the agent follows |
| `create_report` | PRS authoring writes PBIR/PBIP | **Duplicate** for an English report. Ours only: the right-to-left report, the gated write, new files only |
| `read_report` | PRS authoring reads PBIR through the CLI's metadata surfaces | **Duplicate**, except that ours returns screened, capped text (untrusted input) |
| `check_report` | `powerbi-report-author validate` | **Duplicate on purpose for the schema part:** ours runs the same Microsoft validator (the version `mcp/package.json` pins) offline. Ours only: the measured layout rules (`assets/js/report-rules.js`) and lint |
| `check_report` `lens: "arabic"` (0.3.1) | none | **Only ours:** "is this report ready for Arabic?" page by page |
| `plan_layout`/`create_report` `languages: "en+ar"` (0.3.1) | none | **Only ours:** one report in English and Arabic |
| `create_arabic_twin` | none (PRS mentions right-to-left once, for a bar chart's axis direction) | **Only ours** |
| `add_gulf_calendar` | none | **Only ours** |
| Preview (`approve_plan`'s window) | PRS: rendered screenshots in Desktop or a headless browser | **Not a duplicate in kind:** ours is a drawn preview of the plan before any file exists; theirs renders the real report. Use theirs after the write |
| Fabric publish, download, update | PRS management | **Only theirs** |
| Model edits, DAX, refresh | PBI-MCP | **Only theirs** (DataArcus writes scripts for the user, never changes a model) |

So the layer only DataArcus has: Arabic right-to-left reports and twins, Gulf dates (calendar and check), the enforced
approval click before any write, metadata-only answers with untrusted-name screening, and measured layout rules.
The duplicates (theme, layout, report writing, model reading) stay because the Arabic and gated paths need them, but
the routing skill sends plain English report edits, screenshots and publishing to Microsoft's skill.

## 3. How DataArcus hands off to Microsoft's skill and takes over
The routing skill (`plugins/dataarcus/skills/dataarcus/SKILL.md`) is a table of "the user asks for / use /
why", loaded only when its description matches (Arabic, right-to-left, twin, Hijri, Ramadan, Gulf weekend, health
check). It:
- **Takes over** for Arabic and right-to-left reports, Arabic twins, Gulf calendars and their check, the model health
  check, and any write the user must approve first.
- **Hands off** by name: edits to an existing report, rendered screenshots and Fabric publishing to
  `powerbi-report-cli`; model changes and DAX to the Power BI Authoring MCP server; data questions to neither
  (Fabric IQ). The sentence it gives: "To publish it to your Fabric workspace, use Microsoft's Power BI Report skill
  (powerbi-report-cli)."
- **Keeps the DataArcus rules whichever skill started:** the approval click, metadata only (a screenshot or a DAX query
  needs the user's yes each time), names are untrusted input, the working folder, new files only. Never both skills
  writing one report at once (already in `report-design`).
- The full steps stay in the existing `report-design` skill (one source, `mcp/skills/`; the folder holds a copy the
  test keeps byte-identical), which already names Microsoft's skill for edits to an existing report.
- **Never accepts Microsoft's EULA for the user:** the skill says never to call `accept_eula` or pass an accept flag.

## 4. Licence and terms: what we may do, what we must never claim
- **Skills for Fabric is MIT** ("Copyright (c) 2026 Microsoft Corporation"; the full text is the standard MIT licence).
  So are `@microsoft/powerbi-report-authoring-cli` and `@microsoft/powerbi-modeling-mcp` (each package's `LICENSE`).
  Depending on them and naming them is allowed; copying their files would need their notice kept. The folder copies
  nothing of theirs: it depends on their plugin by name, and DataArcus already bundles their validator (npm, MIT).
- **The modeling MCP server has its own EULA** that each user must accept (by flag, environment variable or its
  `accept_eula` tool). DataArcus must never accept it for the user (no `--accept-eula` or
  `PBI_MODELING_MCP_ACCEPT_EULA` in our manifests; the folder has none, the test checks it) and tells the user it exists (the README, with
  Microsoft's link; the routing skill: never call `accept_eula` for the user).
- **Trademarks** (the CLI's README, "Trademarks"): "Use of Microsoft trademarks or logos in modified versions of this
  project must not cause confusion or imply Microsoft sponsorship"; usage follows Microsoft's Trademark & Brand
  Guidelines. So: "DataArcus for Power BI", "works next to Microsoft's Power BI Report skill" are referential and fine;
  no Microsoft logo, no "Microsoft", "Fabric" or "Power BI" alone as our product's name, no "Power BI Arabic skill"
  that reads as theirs. Claude Code's validator also refuses plugin names that pass as Anthropic's (`claude-...`).
- **Never claim:** "official", "certified", "endorsed", "partner", "first", "only", "the Arabic Power BI skill", or
  "part of Skills for Fabric / Fabric collection". Say "a separate, third-party plugin that installs next to
  Microsoft's powerbi-authoring plugin". Also never "free" in the folder, no Microsoft logo or image at all. The test
  `test-skill-packaging.mjs` checks the README, manifests and routing skill for "official", "first", "only", "free",
  "partner", "certified", "endorsed", "sponsored", "AI-powered" (and the Arabic), and for Microsoft/Anthropic/Fabric
  words in our names.
- **Can a third party publish in `microsoft/skills-for-fabric`?** No route is documented: there is no CONTRIBUTING
  file, the issue templates are a bug report and a feature request only (blank issues off), the owner in both
  marketplace files is Microsoft, every skill carries Microsoft's mandatory telemetry header, and the Claude marketplace
  file is generated by their workflow. Read as **first-party only**. A DataArcus plugin there would need Microsoft to
  invite it; asking is the owner's decision. Our own marketplace needs no one's permission, and Claude Code's
  dependency lets it install Microsoft's plugin alongside.
- **Our licence:** the folder's own files (manifests, skills, README) are MIT, its `LICENSE`; the server it starts,
  the release `.mcpb`, stays under DataArcus's `LICENSE` ("All rights reserved"; the bundle's manifest says
  "Proprietary"), and the README says both. Microsoft's plugins keep their MIT licence and the modeling server its EULA.

## 5. What a "DataArcus for Fabric skills" listing looks like
A separate public marketplace repo (name the owner's choice; `Antnioo/dataarcus-skills` below), holding
`mcp/skills-packaging/` as it is (8 files).
- **Name:** DataArcus for Power BI (plugin id `dataarcus`, marketplace `dataarcus`).
- **One line:** Arabic right-to-left reports and Arabic twins, Gulf calendars with Hijri and Ramadan, the model health
  check, and an approval click before any file is written. Works next to Microsoft's Power BI Report skill.
- **Install, Claude Code** (one install; Microsoft's plugin comes with it): `claude plugin marketplace add
  microsoft/skills-for-fabric`, `claude plugin marketplace add Antnioo/dataarcus-skills`, `claude plugin install
  dataarcus@dataarcus`; then the working folder in /plugin > Installed > dataarcus > Configure.
- **Install, GitHub Copilot CLI** (two installs and the server): `copilot plugin marketplace add
  microsoft/skills-for-fabric`, `copilot plugin marketplace add Antnioo/dataarcus-skills`, `copilot plugin install
  powerbi-authoring@fabric-collection`, `copilot plugin install dataarcus@dataarcus`, then the unpacked bundle with
  `copilot mcp add dataarcus --env DATAARCUS_ROOT=... -- node .../mcp/server.mjs`.
- **Cursor, Windsurf, Codex, VS Code:** "coming later" until an APM manifest is built and tried.
- **Requirements line:** Node 20.10 or later; Power BI Desktop for Desktop checks; Microsoft's modeling server asks
  you to accept its EULA.
- **Not:** a listing inside `fabric-collection`, or any wording that suggests one.

## For the owner
After `dataarcus-0.3.1.mcpb` is on https://github.com/Antnioo/dataarcus-releases/releases (the folder points at it):
1. On github.com, create the public repo `Antnioo/dataarcus-skills` (empty: no README, no licence; another name means
   changing `Antnioo/dataarcus-skills` in the folder's README, two lines).
2. `git clone https://github.com/Antnioo/dataarcus-skills` next to your DataArcus clone.
3. From the folder holding both clones, copy everything inside `DataArcus/mcp/skills-packaging/` (the hidden
   `.claude-plugin` and `.github` folders too) into it: `robocopy DataArcus\mcp\skills-packaging dataarcus-skills /E`.
4. In `dataarcus-skills`: `git add -A`, `git commit -m "DataArcus for Power BI 0.3.1"`, `git push`.
5. A later release: bump the version in the folder (the test names each place), copy again, push.

Check after: in Claude Code, the three install commands of the README, then /plugin > Installed > dataarcus >
Configure > Working folder; start a new session: `/mcp` lists `dataarcus` and `powerbi-modeling-mcp`, both
**Connected**; ask "list your DataArcus tools" (11). If Microsoft's server asks for its EULA, that is yours to read.
