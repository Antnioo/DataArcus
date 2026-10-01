# DataArcus MCP roadmap

## Where it is (2026-10-01)
6 tools (`read_model`, `suggest_fields`, `check_model_health`, `generate_theme`, `plan_layout`, `create_report`), 87
checks in `npm test`, the website's 16 suites, and every report change checked in Power BI Desktop. About 60% of the
way to a first public release (estimate). Current work: `mcp/WORK.md`.

## Strategy (owner's go, 2026-10-01, after a second opinion on the project brief)
- **The MCP is the product.** The website's free tools bring people in, prove the engine works and are the playground.
- **The engine is the asset; the MCP is its first interface.** Brand it as the DataArcus Power BI design engine, not
  "an MCP for Claude": MCP is an open standard, and the engine must outlive any one AI app. Keep the engines shared
  between the website and the MCP. Only `pbip-export.js` writes Microsoft's report files (PBIR), so a format change
  stays in that one file.
- **Position:** Microsoft's Copilot and authoring tools create reports but don't do styling and formatting well.
  DataArcus is the design layer (brand themes, layouts that fit every page size, backgrounds, model-aware fields) and
  is built for teams that need Arabic, right-to-left, Hijri and Gulf reporting. Don't claim nobody else serves Arabic:
  articles and tools on it exist; the moat is all of it together in real report files.
- **Users before perfection.** The next milestone is a private beta with 5-10 Power BI developers, then launch. Small
  pages and backgrounds wait for what testers actually hit.
- **Who first:** independent Power BI developers and consultants, then small BI teams, then Gulf organisations;
  enterprise later.
- **Direction for money (not built yet):** free (website tools, the public core), Pro for individuals (AI report
  design, Arabic/Gulf pack, saved designs), Teams (shared design systems, company themes, support). A marketplace
  of designs applied to the buyer's real model comes later.
- **Desktop checks, lighter:** each round checks the main path (1920 x 1080 and 1280 x 720, English and Arabic) plus
  whatever the round touched; not every page size every time. The automated tests stay as they are.

## Done
- **Phase 1 and 2:** the health check on TMDL projects and column types from the open model; the design engine
  (`assets/js/design-engine.js`) shared by the website and the MCP; `generate_theme`, `plan_layout`, `create_report`
  reproduce the website exactly (54 design and 60 project fixtures).
- **Report quality:** buttons, tooltip page, field choice for untyped columns, `modelNotes`, tables that fill their
  width (right to left too), cards moved to `cardVisual`, website dropdowns.
- **Finishing now (`fix/phone-and-sizes`):** the phone layout without overlaps; header, filter rail, Reset and page
  buttons sized from Desktop measurements on every page size; the engine's minimum header and rail heights.

## Next, in order
1. **Arabic accuracy:** Arabic display names for titles (`create_report`), day and month sort order and measures
   without a format string as health findings with ready fix scripts. Checked in Desktop in English and Arabic.
2. **"What I built and why":** after `create_report`, a short design summary for the user (pages, visuals, filter
   rail, tooltip and phone pages, and the design decisions: KPI order, filters on the right for right to left, sizes
   fitted to the page, Arabic text given more height). Builds trust.
3. **Packaging:**
   - A one-click Desktop Extension for Claude Desktop and Cowork (Anthropic's MCP bundle format). Check Anthropic's
     current docs for the format, manifest and signing before building; it is new and changes.
   - A Claude Code plugin with the report-design skill bundled.
   - First run: pick the working folder (becomes `DATAARCUS_ROOT`), explain what the tool can and can't touch.
   - Tested on a clean machine.
4. **Private beta:** 5-10 Power BI developers (international and Gulf); collect what breaks and what they want.
5. **Launch:** README, the launch article, LinkedIn (`content/`).
6. **After the beta, as testers need them:** small pages (640 x 360 cards, charts, tables), backgrounds (phase 3:
   the PNG from the engine's SVG), Gulf DAX patterns (Hijri, Ramadan, fiscal years), `screenshot-all` on generated
   projects, then Pro/Teams.

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
