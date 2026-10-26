# SQ8 (0.3.1 night, Seen batch 8): website pages, English and Arabic

## Summary
- **Approval:** the owner's "Yes, fix now" to every open "Seen, not in scope" item (26 Oct); the reviewer's brief "Go on
  SQ8". Batch "SQ8: website pages, English and Arabic" in [SEEN-QUEUE.md](SEEN-QUEUE.md).
- **Scope:** the licensing guide (EN, AR, translations) and the cost calculator's FAQ (EN, AR, translations); the Gulf
  calendar article's p3 (EN, AR, translations); `scripts/make-share-images.mjs` and `assets/img/og/gulf-calendar.jpg`;
  `assets/js/theme-generator.js` (one line); `assets/js/dp600-sim.js` (one line); `scripts/sitemap-lastmod.mjs`; tests
  in `mcp/test-0.3.0-claims.mjs`, `scripts/tests/theme-generator.mjs`, `scripts/tests/tools.mjs`,
  `scripts/test-sitemap-lastmod.mjs`; the six Status cells in SEEN-QUEUE.md. Not SQ7's (calendar-generator.js, the
  Calendar Generator and Health Check pages, gulf-calendar.mjs) nor SQ10's (report-run.mjs, plan notes).
- **Base:** `fix/0.3.1-sq8` from `origin/integration/0.3.1` (26f7fbe). Push only this branch; the reviewer merges.
- **Items:** GC-S1, 0.2.9-design-S4, I-S3, GC2-S4, I-S1, DS1-S3: all six confirmed true on 26f7fbe (below); none
  obsolete.
- **Expected checks:** claims 580 -> about 645, red first (about 25 failed), then PASS; theme-generator and
  theme-generator-lab +4 checks each, 2 red; tools +4 checks, 4 red (if the practice run ends with a skill under 70%);
  test-sitemap-lastmod 37 -> 40, 3 red; then all PASS. site config, csp, ar-pages, check:min, test-arabic-terms,
  sitemap-lastmod PASS; run-all site, spacing, text-align, lang-switcher, tools, theme-generator(-lab) PASS.
- **Got:** claims 580 -> 643 (red ac7f1573: 23 failed) -> 643 PASS; theme-generator and lab 898 (2 red each) -> PASS;
  tools 395 (4 red) -> PASS; test-sitemap-lastmod 37/40 -> 40/40; every other check PASS ("Results").
- **Resume:** done (ac7f1573 plan and red, 0c69f686 fixes, then sitemap and this note); waits for the reviewer.

## The items, confirmed (26f7fbe)
1. **GC-S1** `scripts/make-share-images.mjs:207`: the Gulf image's kicker says "Free tool" and its line "the right
   weekend for each country and year"; the article (meta description) says "Hijri dates, announced Ramadan and Eid
   days, each country's weekend and the 2022 UAE change."
2. **0.2.9-design-S4** `assets/js/theme-generator.js:820`: the folded Layout step's summary is
   `LAYOUTS[c.preset].name`: a 640 x 360 executive page folds as "Executive summary" while the preview (and the
   download) is the single-focus layout (`E.fitLayout`, design-engine.js:350).
3. **I-S3** `assets/js/dp600-sim.js:454`: the practice summary's skill table calls `bar()` without a class (blue);
   the area rows (line 103) and the mock's skill table (line 688) pass good / warn at 70%.
4. **GC2-S4** the Gulf article p3 (EN and AR): Umm al-Qura "Saudi Arabia's official calculated calendar" / «التقويم
   المحسوب الرسمي في السعودية», no source.
5. **I-S1** `scripts/sitemap-lastmod.mjs`: no shallow check. Measured: a `git clone --depth 1` of this branch,
   `--write` -> "Updated 68 dates", exit 0.
6. **DS1-S3** the licensing guide: only the Pro limits were re-checked in DS1.

## Plan (before any edit)
1. This note, pushed first, with the red tests.
2. Red first: claims (SQ8 block: Umm al-Qura sentence and link; the share image's line = the article's description,
   no "free", new JPG; every licensing figure computed from `assets/data/powerbi-prices.json` and the UAE prices; the
   check date; creators "Pro or PPU" in the guide and the calculator); theme-generator 8b (640 x 360 folds as single
   focus, 1280 x 720 as executive, EN and AR); tools (skill bars green / amber at 70%); test-sitemap-lastmod (a
   depth-1 clone: --write and the check exit 2 naming `git fetch --unshallow`, sitemap.xml unchanged).
3. Fixes at the cause: (1) the Gulf entry's kicker and line, image regenerated; (2) the summary reads
   `E.fitLayout(c).preset`; (3) `bar(p, p >= 0.7 ? 'good' : 'warn')` as line 688; (4) p3 softened and sourced; (5)
   refuse on a shallow clone; (6) every figure re-checked (list below), the changes made, dates updated.
4. build:min, ?v= stamps (both copies), git add, csp --write, ar-pages --write, site config, test-arabic-terms, claims,
   run-all (the suites above), commit, sitemap-lastmod --write (commit), the six Status cells, push.

## Before -> after, with sources
1. **GC-S1** `make-share-images.mjs:207` kicker "Gulf calendar · DAX · Free tool" -> "Gulf calendar · DAX · Hijri
   calendar"; line "Hijri dates, announced Ramadan and Eid, and the right weekend for each country and year." -> "Hijri
   dates, announced Ramadan and Eid days, each country's weekend and the 2022 UAE change." (the article's meta
   description today, word for word). `assets/img/og/gulf-calendar.jpg` regenerated (81 KB, sha256 becd523c...; looked
   at). Test: claims SQ8 GC-S1 (the line = the description, no "free" / "right weekend", not the old JPG's hash).
2. **0.2.9-design-S4** the folded Layout summary: `LAYOUTS[c.preset]` -> `LAYOUTS[E.fitLayout(c).preset]` (the design
   engine's own small-page rule): a 640 x 360 executive page folds as "Single focus · 640 × 360 · ..." / «رسالة واحدة
   ...»; 1280 x 720 stays "Executive summary". Test: theme-generator 8b, EN and AR, live page and lab.
3. **I-S3** the practice summary's skill table: `bar(x)` -> `bar(x, x >= 0.7 ? 'good' : 'warn')`, as the mock's
   (dp600-sim.js:688); PL-300 and DP-600 share the script. Test: tools, the practice run (EN, AR, both exams).
4. **GC2-S4** p3 "Umm al-Qura, Saudi Arabia's official calculated calendar" -> "Umm al-Qura, Saudi Arabia's calculated
   Hijri calendar, whose tables are licensed from the Saudi government (Microsoft Learn)"; AR «التقويم الهجري المحسوب
   في السعودية، وجداوله مرخّصة من الحكومة السعودية (Microsoft Learn)». Source: Microsoft Learn, UmAlQuraCalendar class
   ("Represents the Saudi Hijri (Um Al Qura) calendar ... a table-based algorithm licensed from the Saudi government"),
   read 26 Oct; the AR link is `ar-sa`. "Official" is dropped (no source found that says it in those words);
   dateModified 2026-10-25 -> 2026-10-26. Test: claims SQ8 GC2-S4.
5. **I-S1** `sitemap-lastmod.mjs`: a shallow clone (`git rev-parse --is-shallow-repository`) -> exit 2, "This clone
   is shallow ... Run git fetch --unshallow first.", in --write and in the check; CI checks out with fetch-depth 0,
   so CI is unchanged. Test: test-sitemap-lastmod (a depth-1 clone, the checkout's script copied in: exit 2, the
   reason, sitemap.xml unchanged).
6. **DS1-S3** every figure re-checked on 26 Oct 2026 (list below). All prices unchanged. One sentence was not true:
   "Report creators always need Pro." (guide) / "Creators always need Pro." (calculator FAQ and its JSON-LD) -> "Pro
   or PPU" (Learn, subscriptions, licenses and trials: "Power BI content creators still need a Pro or PPU license"),
   EN and AR. "checked 3 October 2026" -> "checked 26 October 2026"; "Updated October 3" -> "October 26";
   dateModified 2026-10-26. Test: claims SQ8 DS1-S3 computes every price figure from
   `assets/data/powerbi-prices.json` (the weekly check's file) and the UAE prices, so a price change fails it.

### DS1-S3: every figure checked (26 Oct 2026)
Sources: (P) microsoft.com Power BI pricing page (read by `scripts/update-powerbi-prices.mjs` and by hand);
(A) Azure Retail Prices API, Microsoft Fabric, eastus and uaenorth; (L1) Learn, subscriptions, licenses and trials;
(L2) Learn, Copilot for Power BI overview; (L3) Learn, What is Copilot in Fabric (available regions); (L4) Learn, Fabric
Copilot capacity; (L5) Learn, Fabric region availability; (L6) Learn, embedded capacity and SKUs.
- Pro $14, PPU $24 per user per month paid yearly (P). PPU add-on $14 for Pro / M365 E5 users (P, footnote 2).
- "may not be reflective of actual list price due to currency, country, and regional variant factors" (P, footnote 1).
- Fabric $0.18 per CU hour, East US (A); 1-year reservation $938 per CU year -> 40.5% less (A).
- F64: 64 x 0.18 x 730 = $8,410 a month; reserved $5,004 (from 40.5%; $938 x 64 / 12 = $5,003); break-even 358 and
  601 viewers. Worked example 212 x $14 = $2,968; $5,004 + $168 = $5,172; 462 x $14 = $6,468; about $1,300 saved.
- UAE North $0.22 per CU hour (A); reserved $1,146 per CU year (A) -> F64 $10,278 and $6,112; break-even 437.
- AED 51.42 / SAR 52.50 (Pro), AED 88.14 / SAR 90.00 (PPU) at 3.6725 and 3.75 (the fixed pegs).
- Pro 1 GB and 8 refreshes a day; PPU 100 GB, 48 a day, XMLA read/write, deployment pipelines; capacity "varies by SKU",
  48 a day; free viewers from F64; PPU content needs PPU to view; creators Pro or PPU (L1).
- Fabric workloads need capacity; embedding for customers needs capacity (A/EM/P/F) (L6, L1).
- Copilot: F2+ or P1+, no trial or free SKUs, "requires organizational capacity", billed in CUs by tokens, prepare the
  model or "generic or inaccurate results" (L2); Fabric Copilot capacity, F2+, Desktop and Pro/PPU workspaces (L4);
  Azure OpenAI in US datacenters and the EU data boundary, outside them off until the admin setting (L3).
- Regions: none in Saudi Arabia; UAE North all workloads; UAE Central and Qatar Central Power BI only (L5).
- The calculator: the same figures (its FAQ, its JSON-LD, its live prices from the same JSON file); unchanged but the
  creators' sentence. `assets/data/powerbi-prices.json` not changed (the weekly job owns it; values identical today).

## CHANGELOG line
None: the website's text and tools, not the MCP.

## Decisions I made
1. GC2-S4: softened and sourced: no source says "official" in those words, so the sentence says what Learn says.
2. GC-S1: the kicker drops "Free tool" (the brief: never "free" in a headline) for "Hijri calendar"; the line is the
   article's description word for word, and the claims test keeps the two equal.
3. DS1-S3: the reserved F64 stays "about $5,004" (40.5% rounded, as the calculator computes); the exact reservation
   price gives $5,003: within "about", recorded here.
4. I-S1: refuse in the check too (not only --write): a shallow clone's check would pass or fail by chance.
5. Design-S4: only the folded summary changed; the download's page name comes from the engine's page specs already.
6. Stamps `20261026sq8` on the 13 pages loading the 5 changed .min.js files (EN and AR copies; the lab page too).

## Results
Commits: ac7f1573 plan and red tests; 0c69f686 the fixes (pages, translations, .min.js, ar/ copies, stamps, image);
then sitemap-lastmod --write, the six Status cells and this note.
claims 643 PASS; test-arabic-terms 87 PASS; ar-pages 38 copies PASS; csp PASS (no change); site config 78 pages PASS;
check:min 74 files PASS; test-sitemap-lastmod 40/40; check-agent-memory PASS. run-all: site 483, anchors 120, tools
395, spacing 1074, lang-switcher 1442, theme-generator 898, theme-generator-lab 898, text-align 474: all PASS.
sitemap-lastmod --write after 0c69f686 (full history, after `git fetch --unshallow`): 4 URLs to 2026-10-26 (the Gulf
article and the cost calculator, EN and AR; the licensing guide already had 2026-10-26).

## Seen, not in scope
New items, not yet rows in [SEEN-QUEUE.md](SEEN-QUEUE.md) (this batch writes only its Status cells there).
1. The share image's URL has no ?v=: LinkedIn and WhatsApp keep the old picture until the page is scraped again
   (LinkedIn Post Inspector).
2. Licensing guide p3 "creators need Pro in both setups": true of the comparison it draws (Pro seats), but PPU creators
   are not counted; left as is.
3. The guide's Fabric price link is Azure's pricing page; the figures were read from Azure's Retail Prices API (the
   same prices, machine-readable), not from that page.
4. Learn lists Qatar Central and UAE Central among the regions without the standalone Copilot; the guide's Copilot
   section does not say it (not untrue, incomplete for a Qatar reader).
5. The Gulf article list4 «العطلة الحكومية الرسمية» (GC2's Seen 4, second half) keeps "official", sourced by its WAM
   link only.
6. `scripts/make-share-images.mjs` needs `npm i --no-save playwright-core @fontsource/inter` and finds this container's
   Chromium only with CHROME_PATH set to the chrome binary (`/opt/pw-browsers/chromium` is a folder).
