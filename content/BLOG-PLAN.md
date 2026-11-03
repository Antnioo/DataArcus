# DataArcus blog: the plan (read before writing a post)

The memory for the blog. Read it before planning or writing an article; update it after each one is published
(the log, the map, "Next up"). Last updated 2026-10-25 by the builder (W, the Arabic-readiness article); before that 2026-10-22 by the reviewer (the custom-visual article; before that 2026-10-03, "Next up" from the SEO research).

## Who we write for, and how we sound
- **Our identity:** Power BI reports designed right, in minutes, and checked in Power BI, not just generated.
  **Our position (owner 2026-10-04):** the Gulf localisation and verification layer next to Microsoft's tools: they
  generate reports; we check them (sizes measured in Desktop, our report files tested against Microsoft's validator,
  the model checked before Copilot reads it; a number check is planned) and add what the Gulf needs. **Our edge:** built for how the Gulf does business
  (Ramadan, Eid, Hijri, the weekend, VAT), in English or Arabic. **Our premium:** Arabic and right to left done
  properly where it is required. Never "the only", never "Microsoft can't"; a planned feature is called planned.
- **For:** people who build Power BI reports every day, above all in the Gulf: analysts, BI developers, finance and
  sales teams who own a dashboard. They are busy, practical and tired of generic advice.
- **The voice of the people:** we write from their side of the desk. Start from a real problem they have ("Ramadan
  moves every year, so last year's sales don't line up"), show the fix with real numbers, and hand them a free tool
  to do it in minutes. No hype, no filler, no "in today's fast-paced world".
- **Plain language.** Short sentences. One problem per post. Every claim either shown (a screenshot, a number, DAX
  that runs) or sourced (Microsoft Learn, official pricing).
- **Both languages.** Every post is written in English and Arabic (the Arabic is written, not machine-sounding; right
  to left checked on the page). Gulf terms where they matter: Hijri, Ramadan, Eid, the Saturday-Sunday weekend, VAT.
- **Accuracy like the code.** DAX in a post is run on a real model before publishing; numbers are checked twice;
  screenshots come from our own test models, never from the owner's job.

## The pillars (what the blog is about)
| Pillar | Published | Free tool it leads to |
|---|---|---|
| Gulf business logic (and Arabic) | Ramadan sales YoY (2026-09-23), Gulf calendar in DAX (2026-10-03), Is your report ready for Arabic? (2026-10-25, with 0.3.1) | DAX Calendar Table Generator (Hijri), Theme Generator (Arabic) |
| Power BI craft (DAX, models) | DAX attribution pattern (2026-09-01), Model health check (2026-09-25), AI-built custom visuals: 4 checks (2026-10-23) | Model Health Check, DAX Measure Builder |
| Report design | Report redesign in 5 minutes (2026-09-28), 7 report styles (2026-09-29) | Theme Generator, SVG KPI Designer |
| Cost and licensing | Pro vs PPU vs Fabric F64 (2026-09-23) | Licensing Cost Calculator |
| E-commerce analytics (2025; **no new posts**, owner 2026-10-01: the existing ones stay online) | CLV, 5 KPIs, Shopify dashboard, ETL vs Power Query, EVM (project risk) | none |

## Tools without an article yet (each deserves one)
- DAX Measure Builder (`tools/dax-measure-builder.html`)
- SVG KPI Designer (`tools/svg-kpi-designer.html`)
- PL-300 practice exam (`tools/pl-300-practice-exam.html`)
- DP-600 practice exam (`tools/dp-600-practice-exam.html`)

## Next up (in order; owner adopted 2026-10-03 from the SEO research, dataarcus-engine `research/SEO-REPORT.md`)
1. **The Copilot-readiness audit page and "Is your model ready for Copilot? How to check in 10 minutes"** (improve
   the AI-ready article: a step-by-step check with the Model Health Check, then the audit). Keywords: copilot
   readiness assessment, power bi copilot best practices, prepare semantic model for copilot, power bi prep data for
   AI. Tool: Model Health Check. The first paid offer. (Audit page: Beta prep, 2026-10-03.)
2. **The week and the weekend in Power BI by Gulf country** (week start Saturday/Sunday, NETWORKDAYS weekend codes,
   the 2022 UAE change, Eid holidays). Keywords: power bi week start saturday/sunday, networkdays power bi. Tool:
   Calendar Table Generator.
3. **How much does Power BI cost in the UAE and Saudi Arabia (with Copilot)?** (USD list prices, no AED price from
   Microsoft, the peg, Copilot capacity). Keywords: power bi license cost uae, سعر باور بي اي, power bi copilot
   capacity requirements. Tool: Licensing Cost Calculator. (A first FAQ and Copilot section: Beta prep, 2026-10-03.)
4. **DP-600 after the October 2026 update**, then the **PL-300 study guide** (a 4-week plan, the traps). Tools: the
   practice exams.
5. **(Written 2026-10-25 as "Is your Power BI report ready for Arabic?", published with DataArcus 0.3.1.)** **Arabic and right-to-left Power BI reports done right**: answer "does power bi support arabic", "matrix right to
   left" and "bilingual report"; our angle is the mirrored layout plus the Gulf logic. Tool: Theme Generator
   (Arabic). Publish with the `/ar/` pages (owner 2026-10-03: option A, after round 3).
6. **KPI cards that tell a story with SVG**: no tool ranks for "power bi svg kpi card". Tool: SVG KPI Designer.
7. **Measures without the guesswork** (target "power bi yoy measure", "power bi ytd"): Tool: DAX Measure Builder.
8. **Claude designs your Power BI report** (the MCP launch): only when the MCP is packaged and public.
- **Published 2026-10-03:** a Gulf calendar in DAX (`articles/article-gulf-calendar-power-bi.html`, merged `2e6fc3d`
  after 40 of 40 Desktop checks); LinkedIn posts 13-15 Oct (`content/linkedin-gulf-calendar.md`).

## Claims: safe and not (from the research of 2026-10-01)
- **Safe, with the source linked:** Power BI Desktop has no right-to-left support (Microsoft Learn); GCC weekends
  differ by country and the UAE changed in 2022; Ramadan moves about 11 days a year; figures from named sources
  (NielsenIQ, Visa, the Saudi central bank's card data), dated.
- **Never:** that a law requires Arabic dashboards; that DataArcus is "the only" or "the first"; a single Gulf BI
  market size; prices or rates from vendor blogs as facts.
- **Lead with the Gulf business logic** (useful in English too); present Arabic as quality done properly, not just
  "dashboards in Arabic".

## To fix
- **Done 2026-10-03 (merged `0a328b5`; the owner reads the Arabic on 9 Oct):** the Health Check article no
  longer describes the owner's employer's model. The case study is now Microsoft's public COVID-19 US Tracking Sample
  (`powerbi-service-samples` in github.com/microsoft/powerbi-desktop-samples, MIT licence), run through our engine
  (`assets/js/model-health-engine.js`) in Node: score 84; 4 tables, 16 columns, 10 measures, 2 relationships, 2 pages,
  67 visuals; 4 of 16 columns unused, 2 of 12 bookmarks pointing at a deleted column, auto date/time on, 4 calculated
  columns on imported tables. Title, description, share image, blog card, home page texts and the tool page's link
  updated in English and Arabic; `dateModified` 2026-10-03.

## Where ideas come from
Questions people ask in LinkedIn comments and messages, Microsoft's monthly Power BI updates (only what matters to
our readers), and problems found while building the tools (the model health check finds unused columns: that
became a post). Add ideas here with the date and where they came from:
- 2026-10-22, LinkedIn: an MVP's demo of Microsoft's Report Authoring skill writing a custom visual from one prompt,
  and the author's reply to the owner's question. Became the custom-visual article (2026-10-23). Follow-up when 0.3.1
  starts: run the same kind of prompt on our made-up Arabic model (Finding #3) and add what we see as a dated update.

## Checklist for every post (a post isn't done until all of these are)
- [ ] `articles/article-<slug>.html`, written from an existing article (same head, nav, footer, scripts).
- [ ] Both languages: `assets/js/translations/article-<slug>.js` and its `.min.js` (`npx terser ... -c -m`).
- [ ] Title under 60 characters, meta description under 155, `datePublished` and `dateModified`, canonical URL.
- [ ] Open Graph image `assets/img/og/<slug>.jpg` (1200 x 630); article images as `.webp` with a `.jpg` fallback.
- [ ] A card on `blog.html` (and its JSON-LD list), the home page's latest posts in `index.html` if it is the newest,
      and an entry in `sitemap.xml`.
- [ ] At least one link to the tool it leads to, and links to 1-2 related posts (and from them back to this one).
- [ ] DAX run on a test model; numbers and claims checked; sources linked.
- [ ] No employer data: no company names, dashboards, screenshots or numbers from the owner's job.
- [ ] Every website suite passes (`node scripts/tests/run-all.mjs`), then merge.
- [ ] Then: the log below, the pillar table, and three LinkedIn posts queued in `content/LINKEDIN-PLAN.md`.

## Published log
| Date | Post | Pillar | Tool linked |
|---|---|---|---|
| 2025-08-23 | Customer Lifetime Value (CLV) for e-commerce | E-commerce | - |
| 2025-09-04 | ETL vs Power Query | E-commerce | - |
| 2025-09-15 | The 5 e-commerce KPIs that drive profitability | E-commerce | - |
| 2025-10-04 | The ultimate Shopify dashboard in Power BI | E-commerce | - |
| 2025-12-10 | Beyond traffic lights: how EVM predicts project risk | E-commerce / projects | - |
| 2026-09-01 | Resolve once, hydrate many: a DAX attribution pattern | Craft | - |
| 2026-09-23 | Compare Ramadan sales year over year (DAX) | Gulf | Calendar generator |
| 2026-09-23 | Power BI Pro vs PPU vs Fabric F64: 2026 cost guide (updated 2026-10-03: what Copilot needs, Power BI price in the UAE and Saudi Arabia, PPU add-on $14) | Cost | Licensing calculator, Copilot readiness audit |
| 2026-09-25 | Health check on a Microsoft Power BI sample: it scored 84 (rewritten 2026-10-03; was the employer's model) | Craft | Model Health Check |
| 2026-09-28 | Same visuals, new design: a report redesign in 5 minutes | Design | Theme Generator |
| 2026-09-29 | Power BI dashboard design by department: 7 report styles | Design | Theme Generator |
| 2026-10-02 | Is your Power BI model ready for AI? A 7-point check | Craft (AI-ready models) | Model Health Check, Calendar Generator |
| 2026-10-03 | A Gulf calendar in Power BI: Hijri dates, Ramadan, Eid and the right weekend | Gulf | Calendar generator, Measure Builder |
| 2026-10-17 | Power BI best practices have exceptions: 5 we missed (the Health Check benchmark: 23 models, 206 wrong findings before, 1 after; Microsoft's own words, quotes checked on Microsoft Learn 16 Oct) | Craft | Model Health Check |
| 2026-10-23 | Before an AI builds your Power BI custom visual: 4 checks (the admin settings, certification, Desktop vs the service, what an uncertified visual can't do; every fact from Microsoft Learn, read 22 Oct; Microsoft's October 2026 feature summary is behind a bot check, its wording confirmed from a verbatim copy) | Craft (AI agents) | Theme Generator, the DataArcus agent |
| 2026-10-25 | Is your Power BI report ready for Arabic? 19 things to check (L1's Arabic lens: each kind with DataArcus's fix, a Desktop setting or no setting; Microsoft Learn read 25 Oct; L1's numbers on four made-up reports; goes live with DataArcus 0.3.1, branch `feat/0.3.1-ready-for-arabic`, mcp/work/W.md; updated 2026-10-26: a Latin run anywhere in Arabic text can swap the Arabic around it, measured in Desktop 2.159, and the "reword it" advice taken out, mcp/work/BD1.md; updated 2026-10-27: the measured fix, the isolates and the whole text wrapped in U+2067 ... U+2069, page names kept in Arabic since tabs lay out left to right, mcp/work/BD2.md) | Gulf (Arabic) | The DataArcus agent (check_report's Arabic lens) |
| 2026-10-03 | Copilot readiness audit (a service page in `services/`, not a post; linked from the home page, the AI-ready article and the licensing guide) | Craft (AI-ready models) | Model Health Check |
