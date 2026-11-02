# The weekly Microsoft watch (G1)

`.github/workflows/microsoft-watch.yml` runs `scripts/microsoft-watch.mjs` every Monday at 05:17 UTC and by hand
(Actions > Microsoft Power BI update watch > Run workflow). It reads Microsoft's own sources, compares them with what
DataArcus is built on, and when something is newer opens ONE issue labelled `microsoft-update` (or comments on the
open one with only what it does not list yet). It never changes code, opens no pull request and merges nothing.

## What it checks
| Source (Microsoft's own) | Compared with |
| --- | --- |
| github.com/microsoft/json-schemas, `fabric/item/report`: the newest version of every folder (report, page, visualContainer, visualContainerMobileState, visualConfiguration, reportExtension, bookmark, definitionProperties, ... and any new folder) | the newest bundled version in `mcp/schemas` (what check_report reads); the issue also names the version the writer writes (`assets/js/pbip-query.js` SCHEMA, `assets/js/pbip-export.js`) |
| github.com/microsoft/powerbi-desktop-samples, `Report Theme JSON Schema`: the newest `reportThemeSchema-*.json` | `themeSchema` in `mcp/research/microsoft-watch.json` (the version DataArcus's themes were last checked against) |
| npm: `@microsoft/powerbi-report-authoring-cli` (the validator) and `@microsoft/powerbi-core-visual-schema` (its visual catalog), tag `latest` | the pins in `mcp/package.json` |
| The Power BI blog's feed (`powerbi.microsoft.com/en-us/blog/feed/`): a "Feature Summary" post | `featureSummary` in `mcp/research/microsoft-watch.json` (by post id: Microsoft re-dates old posts) |

`mcp/research/microsoft-watch.json` holds only what is nowhere else in the repo: the theme schema and Feature Summary
last checked, and the report folders not bundled on purpose (`definition/definitionStructure`, `localSettings`) with
the version seen. Everything else is read where it lives (one place for every version).

A Microsoft source that can't be read (network, an HTTP error, an answer it can't read) is a warning in the run's log;
the other sources are still checked and the run passes. A failure to write the issue fails the run (GitHub emails the
owner), so a change is never lost silently.

## Run it by hand
- On GitHub: Actions > "Microsoft Power BI update watch" > Run workflow.
- Locally, writing nothing: `node scripts/microsoft-watch.mjs --dry-run` prints the issue (or the comment) it would
  write. Set `GITHUB_TOKEN` for the two GitHub sources (without it GitHub's rate limit for anonymous reads applies).
- Its tests (fixed answers, no network; in CI's website checks): `node scripts/test-microsoft-watch.mjs`.

## When an issue opens
1. Read each line: what Microsoft published, the link, and what in DataArcus it may touch.
2. It feeds the next "Power BI update" job, like U1 (`mcp/work/U1.md`, `mcp/research/POWERBI-2026-10.md`): research
   from Microsoft's sources, then the owner decides what changes. Typical answers:
   - a newer report schema: copy the folders into `mcp/schemas` (`mcp/schemas/SOURCE.md`, `SCHEMA_COMMIT` in
     `mcp/lib/check-report.mjs`); the writer's own versions change only if Desktop needs it (measured, not guessed);
   - a newer theme schema: check DataArcus's written themes against it, then set `themeSchema` in
     `mcp/research/microsoft-watch.json`;
   - a newer validator or catalog: bump the pin in `mcp/package.json` (`npm install`), rerun `npm test`, review
     check_report's known notes (`VALIDATOR_GAPS`) and `NATIVE_TYPES` in `assets/js/visual-types.js`;
   - a new Feature Summary: read it, then set `featureSummary` in `mcp/research/microsoft-watch.json`;
   - a folder not to bundle: add it to `unbundledReportFolders` with its version and why.
3. Close the issue once every line is handled in the repo (merged). A line still newer than the repo after the issue is
   closed opens a new issue the next Monday.
