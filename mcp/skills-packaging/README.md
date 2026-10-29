# DataArcus for Power BI: a plugin for Claude Code and GitHub Copilot CLI

DataArcus designs Power BI reports on your own model and checks them: Arabic right-to-left reports and Arabic twins,
one report in English and Arabic, "is this report ready for Arabic?", Gulf calendars with Hijri, Ramadan and Eid, the
model health check, and an approval click in your browser before any file is written.

It is a separate, third-party plugin by DataArcus (dataarcus.com) that installs next to Microsoft's `powerbi-authoring`
plugin from Microsoft's Skills for Fabric marketplace (`microsoft/skills-for-fabric`). Microsoft's plugin brings the
Power BI Report skill (`powerbi-report-cli`), the `semantic-model-authoring` skill and the `powerbi-modeling-mcp`
server. This plugin adds a routing skill that says which of the two does what, DataArcus's `report-design` skill, and
the DataArcus server (the release `.mcpb` from https://github.com/Antnioo/dataarcus-releases/releases).

You need Node.js 20.10 or later (Microsoft's plugin needs Node.js too), and Power BI Desktop to open the reports. The
DataArcus server is made and tested for Windows.

## Install in Claude Code
```
claude plugin marketplace add microsoft/skills-for-fabric
claude plugin marketplace add Antnioo/dataarcus-skills
claude plugin install dataarcus@dataarcus
```
The install brings Microsoft's `powerbi-authoring@fabric-collection` with it (Claude Code needs Microsoft's marketplace
added first for that). Then, in Claude Code, choose the working folder: `/plugin` > Installed > dataarcus > Configure >
Working folder (the folder that holds your `.pbip` projects). Start a new session: `/mcp` lists `dataarcus` and
`powerbi-modeling-mcp`. Claude Code downloads the DataArcus server from the release when it first starts it.

## Install in GitHub Copilot CLI
```
copilot plugin marketplace add microsoft/skills-for-fabric
copilot plugin marketplace add Antnioo/dataarcus-skills
copilot plugin install powerbi-authoring@fabric-collection
copilot plugin install dataarcus@dataarcus
```
Copilot CLI has no plugin dependencies and can't start an `.mcpb`, so the DataArcus server is added by hand: download
`dataarcus-0.3.1.mcpb` from the release page, check its SHA-256 against the release notes
(`certutil -hashfile dataarcus-0.3.1.mcpb SHA256`), unpack it (it is a zip) into a folder of its own, then:
```
mkdir "%USERPROFILE%\dataarcus-0.3.1"
tar -xf dataarcus-0.3.1.mcpb -C "%USERPROFILE%\dataarcus-0.3.1"
copilot mcp add dataarcus --env DATAARCUS_ROOT="<working folder>" -- node "%USERPROFILE%\dataarcus-0.3.1\mcp\server.mjs"
```
`<working folder>` is the folder that holds your `.pbip` projects.

## What DataArcus hands to Microsoft, and why
| Work | Who | Why |
|---|---|---|
| Arabic and right-to-left reports, English and Arabic in one report, Arabic twins, the Arabic check | DataArcus | Positions mirrored as measured in Power BI Desktop, Arabic display names you approve |
| Gulf calendars (Hijri, Ramadan, Eid, Gulf weekends) and the model health check | DataArcus | Announced dates per country; fix scripts you apply yourself |
| A new report from your model, approved before any file | DataArcus | No approved plan, no file |
| Editing an existing report, rendered screenshots, publishing to a Fabric workspace | Microsoft's Power BI Report skill (`powerbi-report-cli`) | It edits PBIR in place, renders in Desktop or a headless browser and manages Fabric reports; DataArcus writes new reports only and has no Fabric access |
| Tables, measures, relationships, DAX, refresh | Microsoft's `powerbi-modeling-mcp` server (`semantic-model-authoring`) | DataArcus never changes a model; it writes scripts for you to apply |

## Microsoft's terms
Microsoft's plugin and skills are Microsoft's, under their own licence. Microsoft's `powerbi-modeling-mcp` server asks
you to accept Microsoft's End User License Agreement before use
(https://go.microsoft.com/fwlink/?LinkId=2381247). That choice is yours: DataArcus never accepts it for you, and this
plugin sets no flag or variable that would.

## Privacy
DataArcus runs on your computer and reads and writes only inside the working folder you choose. Its tools return
metadata (names, types and formats of your tables, columns and measures) and the texts a person typed into a report,
screened for instructions and returned as typed (page names and text boxes, never a static title; for an Arabic twin,
the texts a reader sees, titles included, so their Arabic can be drafted), never data values, and what they return is sent to your AI app. Put in the working folder only models whose names
you may share with your AI app. Details: https://dataarcus.com/power-bi-mcp/

## Licence
The files in this repository (the manifests and the skills) are under the MIT licence in `LICENSE`. The DataArcus
server that the plugin starts (the release `.mcpb`) is not: it is under DataArcus's own licence, "All rights
reserved" (https://github.com/Antnioo/DataArcus/blob/main/LICENSE): you may use it and what it makes for you, but not
copy or redistribute it. Microsoft's plugin keeps Microsoft's licence and terms.
