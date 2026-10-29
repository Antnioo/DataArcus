# How the DataArcus MCP is built

Moved here unchanged by A1 (0.3.1, 25 Oct) from `mcp/CLAUDE.md` (its opening paragraph and "How it is built").
The parts and one write on one page: [ARCHITECTURE.md](../../ARCHITECTURE.md).

You are continuing work on the DataArcus MCP: the engines behind dataarcus.com's Power BI tools, exposed as an MCP
server so Claude can design and check Power BI reports on the user's own machine. The owner is Abdelrahman
(DataArcus, Dubai). Goal: a tool any Claude user can install (a one-click Desktop Extension for Claude Desktop /
Cowork, and a Claude Code plugin) that designs reports on the user's real model, checks them in Power BI Desktop,
and never damages the user's files.

## How it is built
The parts, the flow of one write and the invariants on one page: `ARCHITECTURE.md` (repo root); every tool's
options: `mcp/TOOLS.md`.
- `mcp/server.mjs`: the MCP server (stdio). 11 tools: `read_model`, `suggest_fields`, `check_model_health`, `generate_theme`,
  `plan_layout`, `approve_plan` (the gate, `mcp/lib/plans.mjs`), `create_report`, `add_gulf_calendar`, `read_report`,
  `create_arabic_twin`, `check_report` (`mcp/lib/check-report.mjs`: Microsoft's validator offline with the schemas
  bundled in `mcp/schemas/`, and the measured rules of `assets/js/report-rules.js`; read-only, no network).
  `mcp/lib/design.mjs`: the design tools' logic on top of `assets/js/design-engine.js`. `mcp/lib/agent-text.mjs`: the
  server's instructions and the shared description sentences, built from `LIMITS` (one source; one cap).
- `mcp/lib/model.mjs`: reads models from disk (project folders with TMDL or model.bim, model.bim files, .pbit zips), keeps every path inside `DATAARCUS_ROOT`.
- **The engines are shared with the website, on purpose.** They live in `assets/js/` and run in the browser and in Node:
  `pbip-export.js` (writes PBIR projects), `pbip-bind.js` (reads models, suggests fields), `model-health-engine.js`
  (the health check), `model-health-tmdl.js` (TMDL fix scripts), `tmdl-model.js` (reads a project's `definition/*.tmdl`
  into model.bim JSON, for the health check), `svg-kpi-compiler.js`. Extend these rather than
  copying them into `mcp/`, so the website and the MCP always give the same answers. A change to a shared engine must
  pass the website's test suites too.
- The theme and layout engine is shared too: `assets/js/design-engine.js` (colours, theme JSON, page sizes, layout slots,
  background SVG), used by the Theme Generator pages and the MCP's design tools. The calendar generator
  (`calendar-generator.js`) is shared too: `add_gulf_calendar` writes its table. Still browser-only: the Measure Builder.

