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
- **Position (reframed 2026-10-01, owner's go; research on Arabic demand pending):** three layers.
  - **Identity, for everyone:** "Power BI reports designed right, in minutes, and checked in Power BI, not just
    generated." Speed plus trust (measured, tested, nothing broken). Microsoft's Copilot and authoring tools create
    reports but don't do styling and formatting well.
  - **Edge, across the Gulf: built for how the Gulf does business.** Ramadan vs last Ramadan (it moves about 11 days
    a year), Eid peaks, Hijri months, the Saturday-Sunday weekend, VAT, in English or Arabic reports. Every Gulf
    retailer, dealer, bank and telecom needs this even in English-only reports, and generic tools don't do it.
  - **Premium: Arabic and right to left done properly**, for the clients who need it (government, semi-government,
    Saudi Arabia). Arabic alone is too narrow to be the identity (most private-sector Gulf reports are in English),
    but it is tedious in Power BI (no right-to-left setting), so it is worth paying for where it is required.
  - Don't claim nobody else serves Arabic: articles and tools on it exist; the moat is all three together in real,
    checked report files.
- **Research (2026-10-01, "Gulf Arabic Power BI demand", in the private repo `Antnioo/dataarcus-engine`,
  `research/`; medium confidence, much from search snippets).** It supports the three layers with three refinements:
  - **Lead with the Gulf business logic** (the need is real in English too: Ramadan is about 19% of yearly MENA FMCG
    sales; the week before Eid runs about 33% above normal on Saudi card data; no packaged competitor found).
  - **Arabic/right to left is a premium mainly in Saudi Arabia, government, and banks and listed companies** (they
    already publish in both languages). A plain "dashboard in Arabic" is a $5-100 commodity on Arabic freelance
    sites, so the premium must be visible quality: mirrored layout, language switch, correct fonts.
  - **Make "verified" concrete:** publish the verification checklist (what every report is checked for).
  - **Targets, in order:** UAE groups trading in the UAE and Saudi Arabia (automotive distributors, retail and
    franchise groups, F&B and FMCG distributors; mind the owner's employment contract with any company close to his
    employer); Dubai Microsoft partners and ERP resellers as a subcontracting channel; regulated firms and
    semi-government through those partners. Avoid direct Saudi government tenders and marketplace price wars.
  - **Safe claims only:** Desktop has no right-to-left support (Microsoft's docs); GCC weekends differ by country;
    Ramadan moves about 11 days a year. **Never claim:** that a law requires Arabic dashboards, "the only" or "the
    first" provider, or a single Gulf BI market size.
  - **Cheap checks next:** about 10 conversations with UAE-Saudi distributors and Dubai Microsoft partners; an Arabic
    search of the Saudi tender portal (Etimad) for dashboard tenders.
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
1. **Split `pbip-export.js` into small parts (owner's go 2026-10-01; right after round 0 (`fix/tooltip-logo-table`) merges, in a fresh reviewer session, so Arabic accuracy and later fixes land in the small files).** It is about 600 dense lines doing every job
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
   **CI: done 2026-10-01** (`.github/workflows/tests.yml`, first run green on `47fc6aa`; was planned after the split): a GitHub Actions workflow runs every website suite and `npm test` on every push
   and pull request, so nothing reaches main without passing (free on GitHub). The reviewer adds it.
   **Tools for accuracy (owner's go 2026-10-01):**
   - **Dependabot: done** (`.github/dependabot.yml`; security updates for the site, the MCP and the workflows).
   - **Microsoft's validator on every export** (right after the current round): today it runs on two MCP exports in
     `mcp/test.mjs`; run it in CI on all 60 project fixtures and the MCP's report variants (languages, presets, page
     sizes), and treat every warning as a finding (fix it, or note why it is fine).
   - **Golden screenshots for Desktop checks** (before the beta): save an approved screenshot per test report and
     compare automatically, so a Desktop check shows only what changed.
   - **Microsoft's Best Practice Analyzer rules** (before round 2): compare the health check with the official rule
     set and list the gaps.
   - **Lighthouse and axe in CI** (before the SEO work): speed, SEO and accessibility on every website page.
2. **Arabic accuracy:** Arabic display names for titles (`create_report`), day and month sort order and measures
   without a format string as health findings with ready fix scripts. Checked in Desktop in English and Arabic.
3. **"What I built and why":** after `create_report`, a short design summary for the user (pages, visuals, filter
   rail, tooltip and phone pages, and the design decisions: KPI order, filters on the right for right to left, sizes
   fitted to the page, Arabic text given more height). Builds trust.
4. **Packaging:**
   - A one-click Desktop Extension for Claude Desktop and Cowork (Anthropic's MCP bundle format). Check Anthropic's
     current docs for the format, manifest and signing before building; it is new and changes.
   - A Claude Code plugin with the report-design skill bundled.
   - First run: pick the working folder (becomes `DATAARCUS_ROOT`), explain what the tool can and can't touch.
   - Tested on a clean machine.
   - **AI evaluations:** 10-20 real requests ("a Ramadan sales report in Arabic", "an executive summary from this
     model", ...) with expected results (tools called, pages and visuals built, nothing overwritten), run before
     every release. They test whether Claude uses the tools well, not only the tools.
   - **Releases:** numbered versions (0.2, 0.3, ...) and a `CHANGELOG.md` with what changed in each.
5. **Private beta:** 5-10 Power BI developers (international and Gulf); collect what breaks and what they want.
   Before it starts: the published verification checklist; a feedback channel (GitHub Issues in the private repo or a simple form) and a support email;
   business basics (registering the business, terms of use, and a privacy note for the MCP stating formally that
   nothing leaves the user's machine).
6. **Launch:** README, the launch article, LinkedIn (`content/`), and **the demo moment**: one real, unedited
   60-second recording from a request to a finished Arabic report open in Power BI.
**Dated: the Gulf Calendar pack, ready by 2026-12-01** (Ramadan 2027 starts around 8 February; buyers prepare in
   December). Hijri dates (Umm al-Qura, with UAE moon-sighting overrides), Ramadan day N vs last year, Eid windows,
   per-country weekends and the 2022 UAE change; in the Calendar Generator, the Measure Builder and the MCP; with a
   launch article and posts. Fit it around the rounds above; it is mostly DAX and the website's existing tools.
7. **After launch, the product's next layers:** measures (year over year, Ramadan vs last Ramadan, percentages) from
   the Measure Builder and Gulf DAX, since many real models lack them; and saved company design systems (theme and
   layout reused on every report), the base of the Teams tier; and **automatic right-to-left mirroring of a report**
   (no public equivalent found; our engine already places every visual): the clearest product moat for the premium.
8. **After the beta, as testers need them:** small pages (640 x 360 cards, charts, tables), backgrounds (phase 3:
   the PNG from the engine's SVG), Gulf DAX patterns (Hijri, Ramadan, fiscal years), `screenshot-all` on generated
   projects, then Pro/Teams.

Dropped, because Microsoft's authoring skill and the Desktop bridge already do them: editing existing reports
(restyle, re-layout, modernise visuals) and the reload-and-screenshot loop. Revisit only for something they can't do,
such as mirroring a report for Arabic.

## Business: the report design service (owner's go 2026-10-01)
The likeliest way to earn money first, before software sales: **sell report design as a service, delivered with the
MCP.** "A professional, branded, bilingual (Arabic/English) Power BI report from your model, in 48 hours."
- **Why:** companies already pay for Power BI reports; the MCP makes delivery much faster than doing it by hand; every
  job tests the product on real work; the first invoice proves the business. It can start before the public launch.
- **Before the first paid job (owner):** check the employment contract (side business, and who owns what he
  creates); get the UAE licence needed to invoice (freelance permit or trade licence); a short service agreement with
  an NDA.
- **Client data rule (same as employer data):** a client's model, data, screenshots and names never enter any repo,
  test or example. Client work happens in its own folder outside the repos and is deleted when the job ends. What a
  job teaches goes back into the product only as a general rule or a test on our own sample models.
- **Who to approach:** Gulf companies and consultancies with Power BI and Arabic reporting needs; Power BI
  consultants who'd outsource design. The website's tools, articles and the demo video are the proof.
- **Offer, simple at first:** one report design (theme, layout, pages, Arabic and English), a fixed price per report,
  delivered as a Power BI project; optional monthly retainer for new reports. Prices are the owner's decision once
  the licence is in place.
- **Track:** leads, replies, paid jobs, hours per job (and how much the MCP saved), what clients asked for: in a
  private file once the private repo is in use, never in the public repo.

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
