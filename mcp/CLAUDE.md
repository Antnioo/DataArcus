# DataArcus MCP: read this first

The engines behind dataarcus.com's Power BI tools as an MCP server: Claude designs and checks Power BI reports on the
user's own machine and never damages the user's files. Goal, parts and engines: [docs/HOW-BUILT.md](docs/HOW-BUILT.md).

## The owner's rules (always; in full: [docs/OWNER-RULES.md](docs/OWNER-RULES.md#the-owners-rules-always))
1. **Do only what he asks.** 2. **Explain the plan before changing anything.** 3. **Fix the cause, not the symptom.**
4. **Every fix gets a test** that fails before the fix and passes after. 5. **Report honestly.** 6. **Never touch
employer data.** 7. **Commits:** Never put a model name or version in commits, code or docs. 8. **Public vs private:**
see "Repo" in ROADMAP.md. 9. **Never record the owner's personal setup in the repo.** 10. **Every Desktop report ends
with "Seen, not in scope".**

## Keeping the memory
`mcp/WORK.md` holds the current release only; a job's plan, results and "Seen" live in its `mcp/work/<ID>.md`, which
starts with `## Summary` (40 lines at most). After each step: update, commit, push
([in full](docs/OWNER-RULES.md#keeping-the-memory-mcpworkmd)).

## The tools
`mcp/server.mjs` registers 11: `read_model`, `suggest_fields`, `check_model_health`, `generate_theme`, `plan_layout`,
`approve_plan`, `create_report`, `add_gulf_calendar`, `read_report`, `create_arabic_twin`, `check_report`; each in
`mcp/tools/<tool_name>.mjs`. Options: [TOOLS.md](TOOLS.md). Engines stay in `assets/js/`, shared with the website.

## Tests
- `cd mcp && npm test` (registry `mcp/tests.json`; `-- <area>`, `-- --keep-going`, `-- --list`). A new suite: one line
  in `tests.json`, never in `package.json`. In full: [docs/TESTS.md](docs/TESTS.md).
- Every script ends with one line, `PASS  <name>  <N> checks` (or FAIL / SKIP), as `scripts/ci-sum.mjs` counts them;
  `scripts/check-result-lines.mjs` names a script without one. A failure: one `FAIL script=... cause=...` line first.
- `npm test -- --affected`: local runs only; CI and the final gate run every suite.
- A new `test.mjs` block is a part listed in one of `SHARDS`. After an `assets/js/` edit: `npm run build:min`.

## Constraints
- **Never use the "MCP Engine for Power BI" connector here**; only Microsoft's Power BI Authoring MCP
  ([the laptop loop](docs/LAPTOP.md)).
- The MCP stays self-contained: only `mcp/package.json`'s packages.
- Power BI rules are measured: [docs/RULES-POWERBI.md](docs/RULES-POWERBI.md), measurements in
  [DESKTOP-TESTS.md](../scripts/tests/DESKTOP-TESTS.md).
