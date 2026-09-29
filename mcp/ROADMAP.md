# DataArcus MCP roadmap

## Where it is (v0.1, 2026-09-29)
4 tools (`read_model`, `suggest_fields`, `check_model_health`, `create_report`), 21 checks in `npm test`.
Tested on the owner's laptop next to Power BI Desktop 2.157 with Microsoft's Power BI Authoring MCP and the Desktop bridge.

## Done
- **Health check on TMDL projects** (branch `mcp/tmdl-health`). `assets/js/tmdl-model.js` reads `definition/*.tmdl`
  into model.bim JSON; `check_model_health` reads Desktop-saved projects directly. Proven against the same model saved
  by Desktop as TMDL and as .pbit (Health Test: identical; Ramadan Test: identical except the type checks
  on its DAX tables). Columns of DAX tables have no type in TMDL: the checks that need it are skipped and listed, never guessed.

## Next, in order
1. **Column types from the open model.** An optional `columnTypes` input on `check_model_health`, filled by the agent
   from the model open in Power BI Desktop through Microsoft's Power BI Authoring MCP, so a TMDL project with DAX tables
   gets every check (full parity with the .pbit). Test on the Ramadan Test pair in `scripts/tests/fixtures/model-health/tmdl-ramadan`.
2. **Design engine in a shared module.** Move the theme and layout logic out of `theme-generator.js` (page sizes, slots,
   theme JSON, background PNG) into a module the website and the MCP both use. Then add tools: `generate_theme`,
   `plan_layout`, and let `create_report` take a layout preset instead of hand-placed slots. The website's
   theme-generator and layout suites must keep passing unchanged.
3. **Edit an existing report, not only create one.** Restyle a user's report with a theme, move visuals into a layout,
   always as a copy first. Never overwrite their files.
4. **Reload and look.** A tool or documented step that reloads the report in Desktop and screenshots each page, so the
   design loop is: change → reload → screenshot → compare → fix.
5. **Gulf DAX:** Measure Builder patterns (Hijri calendar, Ramadan vs last Ramadan, fiscal years) as tools.
6. **`screenshot-all` on generated projects:** find what Desktop-saved projects have that generated ones lack.
7. **Packaging:**
   - A one-click Desktop Extension for Claude Desktop and Cowork (Anthropic's MCP bundle format). Check Anthropic's
     current docs for the format, manifest and signing before building; it is new and changes.
   - A Claude Code plugin (like Microsoft's `powerbi-authoring`), with the report-design skill bundled.
   - First-run: pick the working folder (becomes `DATAARCUS_ROOT`), explain what the tool can and can't touch.

## Repo: when to move it to a private repo
It lives in the public DataArcus repo for now. **Remind the owner to move `mcp/` into a private repo as soon as any of
these is true:** the design engine (item 2) is in the MCP, it is packaged for other users (item 7), or he wants to sell,
license or brand it. Before moving, make sure the shared engines are handled (copy them in, or publish them as a
package the website and the MCP both use).

## Safety model (keep it)
- One working folder; every path checked against it.
- Never overwrite or delete a user file; new work goes next to it with a free name.
- Read models without changing them; changes to a model go through the user or through Microsoft's MCP with the user watching.
- Nothing leaves the machine.
