# DataArcus for Power BI: plugin marketplace (prototype, not published)

A separate, third-party plugin that installs next to Microsoft's `powerbi-authoring` plugin (Skills for Fabric) and
adds what it doesn't do: Arabic right-to-left reports and Arabic twins, Gulf calendars with Hijri and Ramadan, the
model health check, an approval click before any file is written, and metadata-only answers. Research and the reasons
for each choice: `mcp/research/SKILL-PACKAGING.md`.

## What is here (the source; one source per thing)
- `.claude-plugin/marketplace.json` (Claude Code) and `.github/plugin/marketplace.json` (GitHub Copilot CLI): the
  marketplace `dataarcus`. The Claude Code entry depends on `powerbi-authoring@fabric-collection`, so one install
  brings Microsoft's plugin too; Copilot CLI has no plugin dependencies.
- `plugins/dataarcus/`: the plugin, in the layout of `microsoft/skills-for-fabric`'s `plugins/powerbi-authoring/`:
  `.claude-plugin/plugin.json`, `.github/plugin/plugin.json`, and `skills/dataarcus/SKILL.md` (the routing skill:
  what DataArcus takes, what it hands to Microsoft's skill).
- `stage.mjs`: writes an installable copy to an empty folder outside the repo. It adds the `report-design` skill
  (from `mcp/skills/`), the server (`mcp/`'s code and schemas plus the shared engines in `assets/` it requires), the
  `package.json` and lockfile at the plugin's root (Claude Code installs the npm packages from there), the licence,
  and `mcp/package.json`'s version in every manifest. The source manifests carry no version.

## Try it (Claude Code)
```
node mcp/skills-packaging/stage.mjs <empty folder outside the repo>
claude plugin validate --strict <folder>/plugins/dataarcus
claude plugin validate --strict <folder>
claude plugin marketplace add microsoft/skills-for-fabric
claude plugin marketplace add <folder>
claude plugin install dataarcus@dataarcus --config working_folder=<your Power BI projects folder>
```
A marketplace added from a local folder loads the plugin in place and does not install its npm packages: run
`node mcp/skills-packaging/stage.mjs <folder> --install` for that. From a git repository Claude Code copies the plugin
and installs them itself.

## Tests
`node mcp/test-skill-packaging.mjs` (in `npm test`): the manifests parse and agree, name only files the staged copy
has, start a server that lists the 11 tools, and claim nothing DataArcus may not claim.
