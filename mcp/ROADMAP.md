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
3. **Split `pbip-export.js` into small parts (owner's go 2026-10-01).** It is about 600 dense lines doing every job
   (cards, slicers, buttons, tables, header, filter rail, slide-in panel, phone layout, every size rule), so a fix in
   one corner means editing a file where everything lives. Split it into modules with one job each:
   - `sizes`: every rule measured in Desktop (text box, slicer, button, Reset, card), with a pointer to its
     measurement in `scripts/tests/DESKTOP-TESTS.md`;
   - visual builders, one per type (card, slicer, button, table, chart, text box);
   - page assembly (header, filter rail, slide-in panel, tooltip page, bookmarks);
   - phone layout (`mobile.json`).
   The website keeps loading one file, built from the parts by a small build step (the same `.min.js` and `?v=`);
   the MCP imports the parts directly. **Proof: the output is byte for byte identical** on all 54 design and 60
   project fixtures, both downloads and the MCP reports; no fixture is recaptured and no expected number changes.
   One writer: start only when no other branch touches `pbip-export.js`. Then a bug in buttons means opening the
   button file, and nothing else is touched.
4. **Packaging:**
   - A one-click Desktop Extension for Claude Desktop and Cowork (Anthropic's MCP bundle format). Check Anthropic's
     current docs for the format, manifest and signing before building; it is new and changes.
   - A Claude Code plugin with the report-design skill bundled.
   - First run: pick the working folder (becomes `DATAARCUS_ROOT`), explain what the tool can and can't touch.
   - Tested on a clean machine.
5. **Private beta:** 5-10 Power BI developers (international and Gulf); collect what breaks and what they want.
6. **Launch:** README, the launch article, LinkedIn (`content/`).
7. **After the beta, as testers need them:** small pages (640 x 360 cards, charts, tables), backgrounds (phase 3:
   the PNG from the engine's SVG), Gulf DAX patterns (Hijri, Ramadan, fiscal years), `screenshot-all` on generated
   projects, then Pro/Teams.

Dropped, because Microsoft's authoring skill and the Desktop bridge already do them: editing existing reports
(restyle, re-layout, modernise visuals) and the reload-and-screenshot loop. Revisit only for something they can't do,
such as mirroring a report for Arabic.

## Repo: the move to the private repo (decided 2026-10-01)
The trigger is reached (the design engine is in the MCP; it is being branded). The private repo exists:
`Antnioo/dataarcus-engine` (empty). **Owner's choice: option A**, after the current round (`fix/phone-and-sizes`) is
merged and before the private beta, with a plan in `WORK.md` and the owner's go first:
- **Moves to the private repo:** `mcp/`, the internal notes (`mcp/WORK.md`, `mcp/ROADMAP.md`, `mcp/CLAUDE.md`,
  `scripts/tests/DESKTOP-TESTS.md`, `content/`), and all future paid work (the Arabic/Gulf pack, Pro features).
- **Stays public:** the website, its tools and the shared engines in `assets/js/` (every visitor's browser downloads
  them anyway, so hiding their source would hide little). The private repo takes a copy of the engines, with a check
  that both copies match, so the website and the MCP keep giving the same answers.
- **Rule from then on:** anything that should stay secret (the premium Arabic/Gulf pack) never goes into the
  website's browser code; it lives only in the MCP.
- Already-pushed history stays readable in the public repo; the move protects the work from then on.
- The laptop clones the new repo next to the public one in `C:\DataArcus`.

## Safety model (keep it)
- One working folder; every path checked against it.
- Never overwrite or delete a user file; new work goes next to it with a free name.
- Read models without changing them; changes to a model go through the user or through Microsoft's MCP with the user watching.
- Nothing leaves the machine.
