# DataArcus blog: the plan (read before writing a post)

The memory for the blog. Read it before planning or writing an article; update it after each one is published
(the log, the map, "Next up"). Last updated 2026-10-01 by the reviewer.

## Who we write for, and how we sound
- **Our identity:** Power BI reports designed right, fast, and checked in Power BI. **Our edge:** built for how the
  Gulf does business (Ramadan, Eid, Hijri, the weekend, VAT), in English or Arabic. **Our premium:** Arabic and right
  to left done properly where it is required. Posts serve the identity first; Gulf topics are the edge, not the limit.
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
| Gulf business logic (and Arabic) | Ramadan sales YoY (2026-09-23) | DAX Calendar Table Generator (Hijri), Theme Generator (Arabic) |
| Power BI craft (DAX, models) | DAX attribution pattern (2026-09-01), Model health check (2026-09-25) | Model Health Check, DAX Measure Builder |
| Report design | Report redesign in 5 minutes (2026-09-28), 7 report styles (2026-09-29) | Theme Generator, SVG KPI Designer |
| Cost and licensing | Pro vs PPU vs Fabric F64 (2026-09-23) | Licensing Cost Calculator |
| E-commerce analytics (2025; **no new posts**, owner 2026-10-01: the existing ones stay online) | CLV, 5 KPIs, Shopify dashboard, ETL vs Power Query, EVM (project risk) | none |

## Tools without an article yet (each deserves one)
- DAX Measure Builder (`tools/dax-measure-builder.html`)
- DAX Calendar Table Generator (`tools/dax-calendar-table-generator.html`)
- SVG KPI Designer (`tools/svg-kpi-designer.html`)
- PL-300 practice exam (`tools/pl-300-practice-exam.html`)
- DP-600 practice exam (`tools/dp-600-practice-exam.html`)

## Next up (in order; reframed 2026-10-01: the Gulf calendar first, since every Gulf business needs it in any language)
1. **A Gulf calendar in DAX** (publish by early December 2026, ahead of Ramadan 2027 around 8 February): Hijri months, Ramadan and Eid flags, the Saturday-Sunday weekend (UAE since 2022), and
   sorting day and month names correctly. Tool: Calendar Table Generator.
2. **Arabic and right-to-left Power BI reports done right**: what Power BI does and doesn't support (no RTL setting
   in Desktop), mirroring the layout, Arabic fonts, numbers and titles. Tool: Theme Generator (Arabic).
3. **PL-300 study guide** (then DP-600): what the exam weighs, a 4-week plan, the traps. Tool: the practice exams.
   Search demand is high and steady.
4. **Measures without the guesswork**: time intelligence and ratios that people get wrong. Tool: DAX Measure Builder.
5. **KPI cards that tell a story with SVG**: Tool: SVG KPI Designer.
6. **Claude designs your Power BI report** (the MCP launch): only when the MCP is packaged and public.

## Claims: safe and not (from the research of 2026-10-01)
- **Safe, with the source linked:** Power BI Desktop has no right-to-left support (Microsoft Learn); GCC weekends
  differ by country and the UAE changed in 2022; Ramadan moves about 11 days a year; figures from named sources
  (NielsenIQ, Visa, the Saudi central bank's card data), dated.
- **Never:** that a law requires Arabic dashboards; that DataArcus is "the only" or "the first"; a single Gulf BI
  market size; prices or rates from vendor blogs as facts.
- **Lead with the Gulf business logic** (useful in English too); present Arabic as quality done properly, not just
  "dashboards in Arabic".

## Where ideas come from
Questions people ask in LinkedIn comments and messages, Microsoft's monthly Power BI updates (only what matters to
our readers), and problems found while building the tools (the model health check found 41% unused columns: that
became a post). Add ideas here with the date and where they came from:
- (none yet)

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
- [ ] All 16 website suites pass (`node scripts/tests/run-all.mjs`), then merge.
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
| 2026-09-23 | Power BI Pro vs PPU vs Fabric F64: 2026 cost guide | Cost | Licensing calculator |
| 2026-09-25 | We checked a real Power BI model: 41% of columns unused | Craft | Model Health Check |
| 2026-09-28 | Same visuals, new design: a report redesign in 5 minutes | Design | Theme Generator |
| 2026-09-29 | Power BI dashboard design by department: 7 report styles | Design | Theme Generator |
