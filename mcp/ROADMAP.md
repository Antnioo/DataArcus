# DataArcus MCP roadmap

## Where it is (v0.1, 2026-09-30)
4 tools (`read_model`, `suggest_fields`, `check_model_health`, `create_report`), 29 checks in `npm test`.
Tested on the owner's laptop next to Power BI Desktop 2.157 with Microsoft's Power BI Authoring MCP and the Desktop bridge.

## Position (from a comparison on 2026-09-30)
Microsoft's `powerbi-authoring` plugin (preview) already covers the general report work: the Report Design skill
(design brief, chart choice, one opinionated theme preset), the Report Authoring skill (create and edit PBIR pages,
visuals, formatting, re-theme and modernise existing reports, validate, reload and screenshot through the Desktop
bridge) and the Report Planner. The open-source `powerbi-report-mcp` builds pages and visuals with 4 theme presets and a
simple grid, with no generated backgrounds, no health check and no right-to-left support. Power BI Desktop itself
does not support right-to-left languages, and report layouts do not mirror for them.
**So DataArcus does not rebuild general report authoring.** It is the design and Gulf layer that works alongside
Microsoft's tools: brand-driven themes, exact layouts with matching backgrounds, Arabic and right-to-left reports,
Gulf DAX, and the model health score. The skill tells Claude to use DataArcus for theme, layout and background, and
Microsoft's authoring skill for the file work on existing reports.

## Done
- **Health check on TMDL projects.** `assets/js/tmdl-model.js` reads `definition/*.tmdl`
  into model.bim JSON; `check_model_health` reads Desktop-saved projects directly. Proven against the same model saved
  by Desktop as TMDL and as .pbit (Health Test: identical; Ramadan Test: identical except the type checks
  on its DAX tables). Columns of DAX tables have no type in TMDL: the checks that need it are skipped and listed, never guessed.
- **Column types from the open model.** Optional `columnTypes` on `check_model_health`,
  filled from the model open in Desktop (an `INFO.COLUMNS()` query, or `column_operations` List, through Microsoft's
  Power BI Authoring MCP). Proven live on Ramadan Test: with the types the result is identical to its .pbit.
- **Design engine, phase 1.** The Theme Generator's pure logic (colours, harmonies, theme JSON, page sizes, font sizes,
  slots, background SVG, file names) is in `assets/js/design-engine.js`, shared by the website and meant for the MCP.
  53 fixture cases prove the output is unchanged (`scripts/tests/design-engine.mjs`); the live generator runs on it.

## Next, in order
1. **Design engine in the MCP (phase 2).** `generate_theme` (a brand theme from a colour, preset or palette, with the
   contrast checks; written next to the model, never overwriting) and `plan_layout` (exact slot positions in page
   units, as the website's slot table). Output that Microsoft's Report Authoring skill can register and place, so the
   agent uses exact numbers instead of guessing coordinates. `create_report` takes a layout preset. Update the skill:
   DataArcus for theme, layout and background; Microsoft's authoring skill for editing existing reports.
2. **Backgrounds (phase 3).** The background PNG from the engine's SVG in Node, lined up with the slots
   (first test whether Power BI accepts the SVG itself as a page background).
3. **Arabic and right-to-left reports.** Mirrored layouts, Arabic titles and number formats, checked in Desktop. Nobody
   else covers this; Desktop has no right-to-left support of its own.
4. **Gulf DAX:** Measure Builder patterns (Hijri calendar, Ramadan vs last Ramadan, fiscal years) as tools.
5. **Packaging:**
   - A one-click Desktop Extension for Claude Desktop and Cowork (Anthropic's MCP bundle format). Check Anthropic's
     current docs for the format, manifest and signing before building; it is new and changes.
   - A Claude Code plugin (like Microsoft's `powerbi-authoring`), with the report-design skill bundled.
   - First-run: pick the working folder (becomes `DATAARCUS_ROOT`), explain what the tool can and can't touch.
6. **`screenshot-all` on generated projects:** find what Desktop-saved projects have that generated ones lack.

Dropped, because Microsoft's authoring skill and the Desktop bridge already do them: editing existing reports
(restyle, re-layout, modernise visuals) and the reload-and-screenshot loop. Revisit only for something they can't do,
such as mirroring a report for Arabic.

## Repo: when to move it to a private repo
It lives in the public DataArcus repo for now. **Remind the owner to move `mcp/` into a private repo as soon as any of
these is true:** the design engine (item 1) is in the MCP, it is packaged for other users (item 5), or he wants to sell,
license or brand it. Before moving, make sure the shared engines are handled (copy them in, or publish them as a
package the website and the MCP both use).

## Safety model (keep it)
- One working folder; every path checked against it.
- Never overwrite or delete a user file; new work goes next to it with a free name.
- Read models without changing them; changes to a model go through the user or through Microsoft's MCP with the user watching.
- Nothing leaves the machine.
