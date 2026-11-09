State: IN PROGRESS (plan pushed; the article next)

# CP1 (content): the article "Is your Power BI model ready for Copilot? How to check in 10 minutes" (EN and AR)

## Summary
- **Approval:** the owner, 9 Nov: "1 go ahead" (D-1109-06); `content/BLOG-PLAN.md` "Next up" 1 (adopted 3 Oct). The
  hub's brief (session_015Q77oNR7YVFznptSuZoZZ2), relayed in full to this cloud builder.
- **Base:** `content/0.3.2-cp1` from 1cee7142 (the head of PR #117 and integration/0.3.2). 0.3.2 is frozen: this
  branch only; never integration/0.3.2, never PR #117, no PR (the hub opens it to main after #117).
- **Scope:** website content only. One new article, its Arabic copy, its translations, share image and the wiring the
  25 Oct article had (lang routes, blog card and list, home page's latest posts, sitemap, llms.txt, the share-image
  script, BLOG-PLAN.md). A claims block in `mcp/test-0.3.0-claims.mjs` (the test W used for its article). No engine,
  MCP or tool change.
- **Expected checks:** see "Tests"; filled in under "Results".
- **The Arabic waits for the owner:** listed under "## For the owner"; the page ships only after his yes.
- **Resume:** the plan below.

## The article (one problem: "I want my team to use Copilot on this model: is it ready, and how do I check fast?")
- Slug `article-power-bi-copilot-ready-check`; pillar Craft (AI-ready models); blog topic "ai" (COPILOT & AI).
- `<title>` under 60: "Is Your Power BI Model Ready for Copilot? A 10-Minute Check"; h1 the brief's title.
- Outline: (1) the question and what Microsoft says unprepared models do; (2) before the 10 minutes: what Copilot needs
  to run at all (capacity, tenant setting, the data-boundary setting for tenants outside the US and EU: the Gulf case;
  not PPU; not trial); (3) the 10 minutes, timed: 0-2 export a template and run the Model Health Check; 2-6 the
  findings that matter for Copilot, each with why and the fix; 6-9 what no file check settles (duplicate names across
  tables, Arabic-only names, the first 200 characters of a description, Q&A on); 9-10 write the list; (4) the made-up
  model, before and after the fixes, with the engine's own numbers; (5) Prep data for AI, said as Learn says it today
  (preview; three parts; where set; what each does not do); (6) what Copilot does not see; (7) where DataArcus fits
  (the free Health Check; the Copilot readiness audit, a paid service: never "free" for it); (8) FAQ (3).
- Links to the 7-point article for background instead of repeating it; the 7-point article links back (one
  sentence in its p12, both languages).

## The made-up model (no real data, no real company, never the owner's job)
"Sahel Electronics", a made-up Gulf electronics retailer: Sales (fact), Product, Branch (with an Arabic column
«اسم الفرع»), Calendar (Gregorian and Hijri month names, Is Ramadan); 4 measures; one report page of 7 visuals (PBIR).
Built as JSON by `mcp/work/cp1/sahel-model.mjs` and run through `assets/js/model-health-engine.js` in Node (the same
engine the page runs). Before and after the fixes; the article's numbers are this run's output.

## Proof (how each claim is checked)
- Microsoft facts: read on Microsoft Learn on 9 Nov 2026 (the Learn docs service), each linked, "read 9 Nov 2026".
- The Health Check's findings and scores: the engine in Node on the made-up model, twice (same output).
- DAX in the post: parsed by the engine (the DIVISION finding goes, no other finding added); run in Power BI Desktop
  waits for the laptop (listed for the owner): the cloud has no Desktop.
- Screenshots: none of Power BI; the share image from `scripts/make-share-images.mjs`.

## Tests (expected before the work)
- `mcp/test-0.3.0-claims.mjs`: 721 now. A CP1 block: the forbidden words over the three files (7 x 3 = 21), plus
  CP1-1 Prep data for AI said as preview (EN, AR); CP1-2 the Learn pages linked (EN, AR); CP1-3 the made-up model's
  numbers as measured (EN, AR); CP1-4 no headline with first, only, official or free (EN, AR); CP1-5 "free" never said
  of the audit (EN, AR). Expected 721 -> 721 + 21 + 10 = 752; all 31 new red before the files exist.
- `node scripts/test-site-config.mjs` (sitemap 76 -> 78 URLs, 79 -> 81 pages), `node scripts/ar-pages.mjs` (38 -> 39
  copies), `npm run check:min`, `node scripts/csp.mjs`, `npm run lint` (0), then the website suites; tests.yml on the
  branch.
