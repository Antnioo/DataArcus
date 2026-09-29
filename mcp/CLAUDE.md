# DataArcus MCP: read this first

You are continuing work on the DataArcus MCP: the engines behind dataarcus.com's Power BI tools, exposed as an MCP
server so Claude can design and check Power BI reports on the user's own machine. The owner is Abdelrahman
(DataArcus, Dubai). Goal: a tool any Claude user can install (a one-click Desktop Extension for Claude Desktop /
Cowork, and a Claude Code plugin) that designs reports on the user's real model, checks them in Power BI Desktop,
and never damages the user's files.

## The owner's rules (always)
1. **Do only what he asks.** Flag other findings; never fix them without his approval.
2. **Explain the plan before changing anything.** Say what you will do and why, then wait for "go" unless he already said it.
3. **Fix the cause, not the symptom.** If a problem comes from shared code, fix it there so every place gets it.
4. **Every fix gets a test** that fails before the fix and passes after. Run the tests before saying something works.
5. **Report honestly.** If a test fails or a step was skipped, say so with the output. Don't adjust tests or expected values to make them pass.
6. **Never touch employer data.** No company files, models, screenshots, sheet IDs, SharePoint links or customer data from his job, ever, in this repo, in tests or in examples. Keep work models closed in Power BI while you run. Work only inside `C:\DataArcus`.
7. **Commits:** clear message saying what changed and why; end with the attribution lines your environment gives you. Never put a model name or version in commits, code or docs.
8. **Public vs private:** see "Repo" in ROADMAP.md, and remind him when the trigger is reached.

## How it is built
- `mcp/server.mjs`: the MCP server (stdio). Tools: `read_model`, `suggest_fields`, `check_model_health`, `create_report`.
- `mcp/lib/model.mjs`: reads models from disk (project folders with TMDL or model.bim, model.bim files, .pbit zips), keeps every path inside `DATAARCUS_ROOT`.
- **The engines are shared with the website, on purpose.** They live in `assets/js/` and run in the browser and in Node:
  `pbip-export.js` (writes PBIR projects), `pbip-bind.js` (reads models, suggests fields), `model-health-engine.js`
  (the health check), `model-health-tmdl.js` (TMDL fix scripts), `tmdl-model.js` (reads a project's `definition/*.tmdl`
  into model.bim JSON, for the health check), `svg-kpi-compiler.js`. Extend these rather than
  copying them into `mcp/`, so the website and the MCP always give the same answers. A change to a shared engine must
  pass the website's test suites too.
- The theme and layout engine is shared too: `assets/js/design-engine.js` (colours, theme JSON, page sizes, layout slots,
  background SVG), used by the Theme Generator pages and meant for the MCP's design tools. Still browser-only: the
  Measure Builder, the calendar generator.

## Tests
- MCP: `cd mcp && npm install && npm test` (starts the server over stdio and calls every tool on copies of the fixtures). The MCP must stay self-contained: its code and tests use only its own `mcp/package.json` packages, never the website's `node_modules`, so it can be packaged on its own.
- Website: `node scripts/tests/run-all.mjs` from the repo root (13 suites, 3 at a time; `tmdl-model` runs in Node alone too: `node scripts/tests/tmdl-model.mjs`). Needs `npm install` in the repo root and Chromium (`npx playwright-core install chromium` if Chrome isn't found).
- After editing a file in `assets/js/`, rebuild its `.min.js` (`npx terser file.js -c -m -o file.min.js`); for `assets/css/style.css` use `npx lightningcss-cli --minify style.css -o style.min.css`. Where a page loads a file with `?v=...`, bump that version.
- Power BI Desktop checks: `scripts/tests/DESKTOP-TESTS.md` has what was proven in Desktop, how, and the quirks. Add every new Desktop result there.

## The live loop on this laptop
- **Use only Microsoft's Power BI Authoring MCP for DataArcus work.** The "MCP Engine for Power BI" connector is the owner's tool for his job's dashboards: never use it here, so employer models stay out of DataArcus.
- **Microsoft's Power BI Authoring MCP** (from the `powerbi-authoring` plugin): connect to the model open in Desktop, create tables, measures, relationships, run DAX, refresh. EULA accepted by the owner.
- **Desktop bridge CLI** (`powerbi-desktop`): `status`, `open`, `reload`, `screenshot <page-id>`. Power BI is the Microsoft Store version: set `PBI_DESKTOP_PATH` for `open`. `screenshot-all` fails on generated projects (REPORT_DIR_REQUIRED); take pages one at a time and close any capture window left behind.
- **DataArcus MCP**: this folder.
- **What still needs a person:** applying a TMDL script in TMDL view, Power Query steps that remove columns (Close & Apply), saving files, importing a theme through View > Themes. Say exactly what to click, then wait for "done".

## Power BI facts learned the hard way
- PBIR: positions of visuals inside a group are relative to the group. Schemas used: report 2.1.0, page 2.0.0, visualContainer 2.1.0, definitionProperties 2.0.0 (version "4.0").
- Theme font sizes must stay within 8-60. The menu import refuses the whole theme otherwise; a theme inside a project loads silently with broken text.
- Power BI Desktop saves projects as TMDL by default (no model.bim). `tmdl-model.js` reads them for the health check.
- TMDL has no `dataType` for columns whose type Power BI infers from DAX (columns of DAX tables, like the calendar
  generator's). A .pbit has it. The reader marks them `unknown`, and the engine skips (and lists) the checks that need
  a type for them: never default a missing type to text, it gives wrong findings.
- A relationship created through the API needs a Calculate refresh before queries work.
- TMDL `createOrReplace` gives objects new lineage tags when the script has none (hand-written test models have none; Desktop exports do).
- Aggregations need a DirectQuery detail table; Import-only test models can't have them.
- A theme's colours should drive the report's colours (`create_report` does this).

## Writing prompts for another agent or session
Start with the request itself ("Run this test now"). Name every file. List the steps. Add the rules: scope folder, don't
change test files or expected numbers, stop and report on failure. Give the exact report format. Compare with expected
numbers written down before the run, never with the agent's own reasoning.
