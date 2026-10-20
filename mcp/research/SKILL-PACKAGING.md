# DataArcus next to Microsoft's Power BI Report skill: packaging research (K1, 20 Oct 2026)

The owner's decision of 20 Oct: build on Microsoft, not beside it. Use their layers (validator, preview and screenshots,
visual catalog, custom visuals, Fabric publishing) and ship only what they don't do, installed where their users
already are. This file answers the five questions of the K1 brief from Microsoft's and the tools' own sources. The
prototype is `mcp/skills-packaging/` (its README says how to try it); the work log is `mcp/work/K1.md`.

## Sources read (20 Oct 2026)
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
**Yes, proven in this container for Claude Code and Copilot CLI.** The prototype is a marketplace in the same layout
(`.claude-plugin/` and `.github/plugin/` marketplace files, `plugins/dataarcus/` with both manifests and
`skills/`). Results (`mcp/work/K1.md`):
- `claude plugin validate --strict`: the staged plugin and the marketplace both pass.
- **Claude Code, one command:** with both marketplaces added, `claude plugin install dataarcus@dataarcus` installed
  DataArcus **and Microsoft's `powerbi-authoring` with it** ("+ 1 dependency: powerbi-authoring"). That is Claude
  Code's plugin `dependencies` with the marketplace allowing `fabric-collection`
  (`allowCrossMarketplaceDependenciesOn`). From a git source Claude Code copied the plugin to its cache, installed its
  npm packages itself (from the `package.json` and lockfile at the plugin's root), and `claude mcp get` showed the
  DataArcus server **Connected**; started from the cache it lists the 11 tools.
- **Copilot CLI 1.0.100:** `copilot plugin install dataarcus@dataarcus` installed it ("Installed 2 skills") and
  `copilot mcp list` shows both plugin servers, `powerbi-modeling-mcp` and `dataarcus`. Copilot has no plugin
  dependencies (its reference documents none, and the install added only ours), so it is **two commands** there. A
  Copilot chat session (needs a GitHub sign-in) was not run here: the server connecting in Copilot is for the laptop.
- **Cursor, Windsurf, Codex, VS Code:** not in this prototype. The route Microsoft uses for them is APM (an `apm.yml`
  at the marketplace root, `apm install <repo> --skill dataarcus --target cursor`) or the MCP server added by hand
  plus the skill file. Not built or tested; a later step if the owner wants those tools.
- **What a user needs:** Node 20.10 or later on PATH (Microsoft's plugin needs Node for `npx` too), and to choose the
  working folder (Claude Code asks: the plugin's `userConfig`; Copilot has no such prompt: see Seen, not in scope).

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
The prototype's routing skill (`plugins/dataarcus/skills/dataarcus/SKILL.md`) is a table of "the user asks for / use /
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
- The full steps stay in the existing `report-design` skill (one source; the stage copies it in), which already names
  Microsoft's skill for edits to an existing report.

## 4. Licence and terms: what we may do, what we must never claim
- **Skills for Fabric is MIT** ("Copyright (c) 2026 Microsoft Corporation"; the full text is the standard MIT licence).
  So are `@microsoft/powerbi-report-authoring-cli` and `@microsoft/powerbi-modeling-mcp` (each package's `LICENSE`).
  Depending on them and naming them is allowed; copying their files would need their notice kept. The prototype copies
  nothing of theirs: it depends on their plugin by name, and DataArcus already bundles their validator (npm, MIT).
- **The modeling MCP server has its own EULA** that each user must accept (by flag, environment variable or its
  `accept_eula` tool). DataArcus must never accept it for the user (no `--accept-eula` or
  `PBI_MODELING_MCP_ACCEPT_EULA` in our manifests; the prototype has none) and should tell the user it exists.
- **Trademarks** (the CLI's README, "Trademarks"): "Use of Microsoft trademarks or logos in modified versions of this
  project must not cause confusion or imply Microsoft sponsorship"; usage follows Microsoft's Trademark & Brand
  Guidelines. So: "DataArcus for Power BI", "works next to Microsoft's Power BI Report skill" are referential and fine;
  no Microsoft logo, no "Microsoft", "Fabric" or "Power BI" alone as our product's name, no "Power BI Arabic skill"
  that reads as theirs. Claude Code's validator also refuses plugin names that pass as Anthropic's (`claude-...`).
- **Never claim:** "official", "certified", "endorsed", "partner", "first", "only", "the Arabic Power BI skill", or
  "part of Skills for Fabric / Fabric collection". Say "a separate, third-party plugin that installs next to
  Microsoft's powerbi-authoring plugin". The test `test-skill-packaging.mjs` checks the manifests and skills for
  "official", "the first", "first ever", "the only", "only tool" and for Microsoft/Anthropic/Fabric names in ours.
- **Can a third party publish in `microsoft/skills-for-fabric`?** No route is documented: there is no CONTRIBUTING
  file, the issue templates are a bug report and a feature request only (blank issues off), the owner in both
  marketplace files is Microsoft, every skill carries Microsoft's mandatory telemetry header, and the Claude marketplace
  file is generated by their workflow. Read as **first-party only**. A DataArcus plugin there would need Microsoft to
  invite it; asking is the owner's decision. Our own marketplace needs no one's permission, and Claude Code's
  dependency lets it install Microsoft's plugin alongside.
- **Our licence:** the repo's `LICENSE` is "All rights reserved" (not open source); the manifests say
  `LicenseRef-DataArcus` and the stage copies `LICENSE` into the plugin. Microsoft's plugins are MIT; nothing requires
  ours to be.

## 5. What a "DataArcus for Fabric skills" listing looks like
A separate public marketplace repo (name the owner's choice; `Antnioo/dataarcus-skills` below), holding what
`stage.mjs` writes.
- **Name:** DataArcus for Power BI (plugin id `dataarcus`, marketplace `dataarcus`).
- **One line:** Arabic right-to-left reports and Arabic twins, Gulf calendars with Hijri and Ramadan, the model health
  check, and an approval click before any file is written. Works next to Microsoft's Power BI Report skill.
- **Install, Claude Code** (one install; Microsoft's plugin comes with it):
  `/plugin marketplace add microsoft/skills-for-fabric`, `/plugin marketplace add Antnioo/dataarcus-skills`,
  `/plugin install dataarcus@dataarcus`. Then choose the working folder when asked.
- **Install, GitHub Copilot CLI** (two installs): `/plugin marketplace add microsoft/skills-for-fabric`,
  `/plugin marketplace add Antnioo/dataarcus-skills`, `/plugin install powerbi-authoring@fabric-collection`,
  `/plugin install dataarcus@dataarcus`.
- **Cursor, Windsurf, Codex, VS Code:** "coming later" until an APM manifest is built and tried.
- **Requirements line:** Node 20.10 or later; Power BI Desktop for Desktop checks; Microsoft's modeling server asks
  you to accept its EULA.
- **Not:** a listing inside `fabric-collection`, or any wording that suggests one.
