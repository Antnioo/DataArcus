# E (0.3.1, wave 3): one Arabic term per concept, everywhere DataArcus writes Arabic

Cloud builder, 25 Oct. Branch `feat/0.3.1-arabic-terms` from `origin/integration/0.3.1` (5db2627). Push only that
branch; no PR, no merge (the reviewer reviews and merges). The cause: an Arabic review (21 Oct) found one concept written
several ways across the engines (scores 3/4/3). Others working now: X2 (create_report's bilingual report: the pbip
writers, `mcp/lib/arabic-twin.mjs`, report-mirror.js callers) and W (a new website page): their files are touched only
for an Arabic term, one line each, listed under "Lines in other builders' files".

## What is there already (5db2627)
- **The terminology sheet** (0.3.0 J18, `mcp/lib/terminology.mjs`): one approved English / Arabic alias per *field of the
  user's model*, the same on every title, header, tooltip and alt text; plus the **fixed list**
  `assets/data/arabic-report-words.json` (words to propose field names; `phrases`: the report's own fixed texts, which
  the twin drafts from and `test-0.3.0-twin-complete.mjs` checks against the writer). Neither holds DataArcus's *own*
  vocabulary (filters, slicer, tooltip, ...): each engine wrote its own word.
- Arabic is written by: the report writer's fixed texts (`assets/js/design-engine.js` REPORT_TEXTS, `pbip-page.js`), the
  alt texts (`report-a11y.js`), the health check and Gulf check (`model-health-engine.js`, `gulf-health.js`), the website
  tools (`theme-generator.js`, `pbip-bind.js`, `measure-builder.js`, `svg-kpi-*.js`, `calendar-generator.js`, the exam
  sims and their banks), the site's copy (`assets/js/translations/*.js`, rendered into `ar/` by `scripts/ar-pages.mjs`),
  and the MCP (`mcp/lib/approval-window.mjs`, `gulf-date-questions.mjs`, `server.mjs`, `flip-cards.mjs`, ...).
- Measured on 5db2627 (every tracked text file; blog = `articles/`, `ar/articles/`, `translations/article-*.js`):
  «داتا أركوس» 90 times outside the blog (page titles, og/twitter tags, author, alt texts, two engines), «الفلاتر» ~50
  vs «عوامل التصفية» 1 (report-a11y), «مقسم»/«مقسّم» alone 10, «تلميح» alone 12, «مواعيد» 25 vs «تواريخ» (gulf-health,
  the calendar generator's page, the home page), «تقارن المتماثل بالمتماثل» 1 (gulf-health), «الفلترة» 6 vs «التصفية»,
  «جدول التقويم» 6 vs «جدول التاريخ»/«جدول تاريخ» 20, «بطاقات KPI» 7 vs «بطاقات المؤشرات» 9, «رسم بياني» 1 vs «مخطط»
  100+. "Reset filters" and "Clear the filters on this page" are already one Arabic text in the writer (design choice 6,
  5 Oct: «إعادة ضبط الفلاتر») and in the fixed list: kept, and now checked.

## Sources for the Power BI terms (read 25 Oct 2026)
Learn's Power BI *docs* in Arabic (`learn.microsoft.com/ar-sa/power-bi/...`) are served in English now (every page tried:
slicers, filters, tooltips, bookmarks, drill, measures, themes, tables, buttons). Learn's **training** units are in
Arabic, and they are Microsoft's own wording of the Power BI UI:
- [L1] `learn.microsoft.com/ar-sa/training/modules/dax-power-bi-modify-filter/1-introduction`: «عنصر تحكم مقسم طريقة
  العرض», «عوامل التصفية», «المرئيات», «مقياس», «السنة المالية», «صفحة التقرير».
- [L2] `.../perform-analytics-power-bi/3-visuals`: «مقسمات طريقة العرض أو عوامل التصفية»; `.../1-introduction`:
  «التنقل لأسفل»; `.../9-quick-insights`: «لوحة معلوماتك».
- [L3] `.../power-bi-effective-requirements/3-determine`: «التنقل لأسفل والتصفح وعرض تلميحات الأدوات».
- [L4] `.../power-bi-effective-user-experience/4-bookmarks`: «إشارة مرجعية», «تلميح أداة الصفحة».
- [L5] `.../power-bi-effective-reports/2-report-objects`: «مقسم طريقة العرض», «تحديد إشارة مرجعية».
- [L6] `.../dax-power-bi-time-intelligence/2-functions`: «... جدول التاريخ كجدول تاريخ» (Mark as date table).
- [L7] `.../dax-power-bi-modify-filter/5-context-transition`: «وسيلة الإيضاح», «عمود محسوب».
- [S1] Microsoft Support (Excel, ar-sa), article 249f966b: «استخدام مقسم طريقة العرض لتصفية البيانات» (Slicer).
No Microsoft Arabic source found this session for: theme («السمة» is what DataArcus writes), working day, weekend, Hijri.

## The concept table (the sheet's `concepts`; "to choose" = the owner decides)
| Concept (EN) | Chosen Arabic | Variants flagged | Microsoft's Arabic | Status |
| --- | --- | --- | --- | --- |
| Filters (the report's, the pane) | «الفلاتر» | «عوامل التصفية», «المرشحات» | «عوامل التصفية» [L1, L2] | to choose |
| Filtering (the act) | «التصفية» / «يصفّي» | «الفلترة» | «التصفية» [L1] | chosen |
| Reset filters = Clear the filters on this page (one button) | «إعادة ضبط الفلاتر» | «مسح الفلاتر», «إعادة تعيين الفلاتر», «مسح عوامل التصفية» | (no Power BI button of that name) | chosen (design choice 6) |
| Slicer | «مقسم طريقة العرض» (pl. «مقسمات طريقة العرض»), «(Slicer)» once per Arabic page | «مقسم»/«مقسّم»/«المقسمات» alone | «مقسم طريقة العرض» [L1, L5, S1] | to choose |
| Tooltip | «تلميح الأدوات» (pl. «تلميحات الأدوات»), «(Tooltip)» once per Arabic page | «تلميح»/«التلميح»/«تلميحات» alone | «تلميحات الأدوات» [L3], «تلميح أداة الصفحة» [L4] | to choose |
| Ramadan / Eid dates | «تواريخ» (sing. «تاريخ») | «مواعيد», «موعد» | (none) | chosen |
| The product's name | DataArcus (Latin, everywhere) | «داتا أركوس» | (none) | chosen; the Arabic spelling kept once, in each Arabic page's `keywords` (search) |
| Like for like (seasons) | «كل موسم بنظيره» | «المتماثل بالمتماثل» | (none) | chosen |
| Visual | «عنصر مرئي» (pl. «العناصر المرئية») | «المرئيات», «مرئيات» | «المرئيات» [L1] | to choose |
| Chart | «مخطط» | «رسم بياني», «الرسوم البيانية» | «مخطط» [L1, L7] | chosen |
| KPI card | «بطاقة مؤشر» (pl. «بطاقات المؤشرات») | «بطاقة KPI», «بطاقات KPI» | (none) | chosen |
| Date table | «جدول التاريخ» | «جدول التقويم», «جدول تقويم» | «جدول تاريخ» [L6] | chosen |
| Dashboard | «لوحة تحكم» | «لوحة معلومات» (kept in `keywords`) | «لوحة معلومات» [L2] | to choose |
| Measure | «مقياس» (pl. «مقاييس») | «المقياسات» | «مقياس» [L1] | chosen (one form found) |
| Column / page / report / plan | «عمود» / «صفحة» / «تقرير» / «الخطة» | (none found) | «عمود محسوب» [L7], «صفحة التقرير» [L1] | chosen (one form) |
| Model | «النموذج» | (none flagged: «نموذج البيانات» is the generic data model in the services pages) | (the units say «النموذج») | chosen |
| Approve | «وافق» / «الموافقة» | «المصادقة» | (none) | chosen (one form) |
| Theme | «السمة» | «الثيم», «النسق» | (not found) | chosen (one form) |
| Bookmark | «إشارة مرجعية» (pl. «الإشارات المرجعية») | «علامة مرجعية» | «إشارة مرجعية» [L4, L5] | chosen (one form) |
| Drill | «التعمق» | (none found) | «التنقل لأسفل» [L2, L3] | chosen (one form; Microsoft's said for the owner) |
| Total (a table's total row) | «الإجمالي» | (none flagged: «المجموع» is Sum, another concept) | (the units' «المجموع» is Sum) | chosen |
| Average | «المتوسط» | (none flagged: «معدل» is a rate) | — | chosen |
| Fiscal year | «السنة المالية» | «العام المالي» | «السنة المالية» [L1] | chosen (one form) |
| Hijri / working day / weekend | «الهجري» / «يوم عمل» / «عطلة نهاية الأسبوع» | «يوم دوام», «العطلة الأسبوعية», «الويك إند» | (not found) | chosen (one form) |
| Legend | «وسيلة الإيضاح» | «مفتاح الرسم» | «وسيلة الإيضاح» [L7] | chosen (one form) |

## Plan (in order)
1. This file, pushed first.
2. **The sheet extended, one source.** `assets/data/arabic-report-words.json` gets `concepts` (the table above: id, en,
   ar, variants as patterns, Microsoft's term and source, status, `englishOnce` for slicer and tooltip) and `allow` (the
   allow-list, each entry with why). `mcp/lib/arabic-terms.mjs` (new, node:fs only, so the website check runs it without
   the MCP's packages) reads them: `CONCEPTS`, `termHits(text)` (a line's variants, diacritics folded, a clitic
   و/ف/ب/ل/ك and ال allowed before a term); `mcp/lib/terminology.mjs` re-exports both (the sheet's API).
3. **Red tests first, on 5db2627's code:**
   - `mcp/test-0.3.1-arabic-terms.mjs` (in `npm test`, one line `PASS  test-0.3.1-arabic-terms  N checks`): AT-1 the
     sheet is well formed (every concept has en, ar, a status, a source or "none"; no variant matches its own chosen
     term; every allow entry has a why); AT-2 the scanner finds a planted variant of each concept and passes each chosen
     term; AT-3 no tracked text file outside the allow-list holds a variant (one check per concept, the files and
     lines listed); AT-4 the report's fixed texts (design-engine REPORT_TEXTS ar, the fixed list's phrases) use the
     chosen terms, and "Reset filters" and "Clear the filters on this page" are one Arabic text in the writer
     (`pbip-page.js` resetTip) and the list; AT-5 each Arabic page under `ar/` that names a slicer or a tooltip gives
     the English once, at its first use; AT-6 «داتا أركوس» only in a page's keywords, and every `ar/` page keeps it
     there once (search).
   - `scripts/test-arabic-terms.mjs` (website CI, beside `test-site-config.mjs`): AT-3/5/6 for `assets/` and `ar/`.
   - Expected red on 5db2627: AT-3 for filters (report-a11y), filtering, slicer, tooltip, dates, product name,
     like-for-like, chart, KPI card, date table; AT-4 for slicer and tooltip (REPORT_TEXTS «مقسم», «تلميح»); AT-5 on
     `ar/power-bi-mcp/`; AT-6 on every page with «داتا أركوس» in its title. Green: AT-1, AT-2, the reset text.
4. **The fixes, each in its own file's block:** report-a11y (filters), gulf-health (dates, like-for-like, date table,
   product name), gulf-date-questions (dates), design-engine REPORT_TEXTS + the fixed list's phrases (slicer, tooltip),
   pbip-bind (slicer label), model-health-engine (tooltip, filtering, date table), approval-window (slicers heading),
   measure-builder / theme-generator (product name), the site's translations (product name in titles and tags,
   dates, slicer, tooltip, chart, KPI card, filtering), the PL-300 bank's source (filtering; then `build.js`).
   Approved user labels and the model's own names are never rewritten (the engines only change their own fixed words).
5. `npm run build:min`, `check:min`, new `?v=` stamps on every page loading a changed `.min.js`; `scripts/csp.mjs`,
   `scripts/ar-pages.mjs --write`, `test-site-config`, `node scripts/tests/run-all.mjs` (all suites); the touched mcp
   suites, then the full `cd mcp && npm test` once.
6. This file: results, CHANGELOG line, "For the owner", "Decisions I made", "Seen, not in scope"; WORK.md's line.

## Expected (written before any run)
- New mcp suite: ~45 checks; red on 5db2627 as listed in step 3 (about 14 of them), green after.
- Website check: red on 5db2627 (AT-3 slicer/tooltip/dates/name/chart/KPI/filtering, AT-5, AT-6), green after.
- Expected Arabic strings in other suites that change because their term changes (a deliberate move, each listed in
  Results): the twin's fixed texts («مقسم» -> «مقسم طريقة العرض», «تلميح» -> «تلميح الأدوات» in
  `test-0.3.0-twin-complete.mjs` and design-engine fixtures if they hold them), gulf-health's Arabic finding texts
  where a suite quotes them. Every other count unchanged. Website suites 20/20; full `npm test` green.

## What changed from the plan (said in words)
- AT-6 ("every `ar/` page keeps «داتا أركوس» in its keywords") was dropped: only 5 Arabic pages carry the Arabic spelling
  in their keywords today, 14 have keywords without it, 3 have none; adding it to 17 pages is an SEO choice, not a term
  fix (For the owner, "Search"). The check kept: the Arabic spelling passes only inside a keywords line (AT-2).
- The filtering concept got the verb forms too («تفلتر», «يفلتر», found by reading the hits): 5 more lines.
- `scripts/make-article-mockups.mjs` joined the allow-list: it draws the blog articles' published images.
- The SVG KPI designer's Arabic title lost «مجانًا» to stay at 60 characters (the site test's limit) once «بطاقات
  المؤشرات (KPI)» replaced «بطاقات KPI»; its description lost the «(KPI)» (159 -> under 155).

## Results (before -> after)
- Commits: a6d1bd8 plan; 917bbea the sheet's concepts, the scanner and the red tests; 7893922 the engines' and the MCP's
  fixes; da3d133 the site's copy and the regenerated `ar/` pages; then the sitemap dates and this note.
- `mcp/test-0.3.1-arabic-terms.mjs`: on 5db2627's texts 18 of 84 failed (AT-1 the allow entry "The scanner." too short:
  my own slip, fixed before the red commit; AT-3 filters, filtering, slicer, tooltip, dates, product, like-for-like,
  visual, chart, KPI card, date table, dashboard; AT-4 x3 slicer and tooltip in the writer and the list; AT-5 x2); the
  reset button's one text was green, as expected. After: **84/84**.
- `scripts/test-arabic-terms.mjs` (website CI, after `test-site-config`): 12 of 65 failed on 5db2627; after **65/65**.
- The known cases: filters in report-a11y -> «الفلاتر» (and the sheet marks the term "to choose"); Ramadan/Eid
  «مواعيد» -> «تواريخ» (gulf-health 7 lines; gulf-date-questions already said «تواريخ»: unchanged; the calendar
  generator's page, the home page, the blog listing); «داتا أركوس» -> DataArcus in 169 lines (titles, og/twitter,
  author, logo alt texts, gulf-health, measure-builder, theme-generator's preset name, llms.txt), kept only in keywords;
  «تقارن المتماثل بالمتماثل» -> «تقارن كل موسم بنظيره»; «مقسم» -> «مقسم طريقة العرض», «تلميح» -> «تلميح الأدوات»
  (Microsoft's, Learn [L1-L5], with «(Slicer)» / «(Tooltips)» once on the MCP page, the only Arabic page that names them);
  "Reset filters" and "Clear the filters on this page": already one Arabic text, now checked (AT-4).
- Concepts unified: **12** that had two or more forms (filters, filtering, slicer, tooltip, dates, product name,
  like-for-like, visual, chart, KPI card, date table, dashboard) + the reset button checked; 17 more concepts found in
  one form only, now guarded by the sheet (measure, column, page, report, model, plan, approve, theme, bookmark, drill,
  total, average, fiscal year, Hijri, working day, weekend, legend).
- Expected Arabic strings changed in other suites only because their term changed (the deliberate moves):
  `mcp/test-0.3-a11y.mjs` (a card's alt text «... حسب الفلاتر في الصفحة.»), `mcp/test-0.3.0-twin-complete.mjs` (the
  Tooltip page «تلميح الأدوات»), `scripts/tests/model-health.mjs` ("1 عناصر مرئية"), the design-engine fixtures
  `scripts/tests/fixtures/design-engine/cases.json` (2: «مقسمات طريقة العرض (Slicers)») and `project-pages.json` (24:
  slicer, tooltipPage, tooltipHere in 8 captures). No count changed.
- Touched mcp suites: a11y 121, twin-complete 24, arabic-sweep 235, gulf-date-questions 63, arabic-calendar 31,
  twin-preview 23, arabic-lens 31, 0.3.0-claims 117, release-text 36: all pass, counts unchanged.
- Website: build:min (27 .min.js rebuilt; check:min all 73 match, every changed one with the new stamp 20261025e on 39
  English pages + the worker and its two callers); csp: 137 pages current; ar-pages --write (37 copies; the articles'
  copies changed only in their script stamps); test-site-config PASS (76 pages); sitemap-lastmod --write (see "Seen").

## CHANGELOG line
- DataArcus writes one Arabic word for each Power BI and DataArcus idea everywhere: in reports, the approval page, the
  health checks and the website («الفلاتر», «مقسم طريقة العرض», «تلميح الأدوات», «تواريخ رمضان», «جدول التاريخ»,
  «بطاقات المؤشرات», «لوحات التحكم», «عناصر مرئية»), and the name DataArcus in Latin letters. A check keeps it so.

## For the owner (your read: you decide each "to choose")
| Concept | Written now | The other choice | Why I chose it |
| --- | --- | --- | --- |
| Filters | «الفلاتر» | «عوامل التصفية» (Power BI's menus, Learn) | what every report and Gulf analysts say; shorter, so the reset button's measured width holds. Choosing Microsoft's changes the report's buttons («إعادة ضبط عوامل التصفية», longer): a Desktop measurement first |
| Slicer | «مقسم طريقة العرض», «(Slicer)» once per Arabic page | «مقسم» alone (unclear), or «السلايسر» | Microsoft's term (Learn, Microsoft Support); it is longer in a report's placeholder slicer title («مقسم طريقة العرض 1») |
| Tooltip | «تلميح الأدوات», «(Tooltips)» once | «تلميح» alone (reads "a hint") | Microsoft's term; the report's tooltip page name is now «تلميح الأدوات · …» |
| Visual | «عنصر مرئي» / «العناصر المرئية» | «المرئيات» (Learn; the blog's word) | reads as Arabic; the blog keeps «المرئيات» (published) |
| Dashboard | «لوحة تحكم» | «لوحة معلومات» (Power BI's word for a service dashboard) | every portfolio page said «لوحة تحكم»; the portfolio's titles said «لوحات المعلومات» and now say «لوحات التحكم» |
Chosen without a question (one form or a clear call): «التصفية» for the act, «تواريخ» for dates, DataArcus in Latin,
«كل موسم بنظيره», «مخطط», «بطاقة مؤشر», «جدول التاريخ» (Microsoft's "Mark as date table"; the calendar generator's
Arabic title is now «مولّد جدول التاريخ»), and the rest of the table above.
Search: «داتا أركوس» now stays only in the keywords of 5 Arabic pages (4 dashboards and the Copilot audit); titles
say DataArcus. Should every Arabic page carry it once in its keywords (17 more), or its description? Your call.

## Lines in other builders' files (one term each, for a clean merge)
- `assets/js/design-engine.js` (shared; X2's bilingual report reads REPORT_TEXTS): line 306 (the layout's Slicers row),
  420 («لوحات تحكم» in the preview note), 756 (`slicer`), 758 (`tooltipPage`, `tooltipHere`).
- `assets/js/pbip-bind.js` line 867 (the picker's "Slicer n" label).
- None in `pbip-page.js`, `pbip-export.js`, `arabic-twin.mjs` or `report-mirror.js`. W's new page: if it has Arabic,
  `scripts/test-arabic-terms.mjs` and AT-3 check it once merged (a variant there fails until it uses the sheet's term).

## Blog articles (published text: reported, nothing changed; no clear error found)
Variants in `ar/articles/` (the same counts in their `translations/article-*.js`): «المرئيات» 37
(custom-visual-ai-checks), «داتا أركوس» 33 (clv 7, etl-vs-power-query 7, journey-attribution 6, kpi 5, shopify 5,
evm 2, gulf-calendar 1), «مواعيد» 14 (gulf-calendar 10, evm 2, ramadan-sales 2), «الفلترة» 8 (best-practice-exceptions 5,
model-health-check 2, model-ai-ready 1), «جدول التقويم» 6 (gulf-calendar 3, ramadan-sales 3), «تلميح» alone 3
(custom-visual-ai-checks), «لوحة معلومات» 2 (evm, report-styles), «مقسم» alone 1 (report-styles). The LinkedIn drafts in
`content/`: «المرئيات» 7, «تلميح» 2, «مواعيد» 2. These are words a reader understands, not errors: left as published.

## Decisions I made
- The sheet is extended, not doubled: `concepts` and `allow` live in the fixed list's file
  (`assets/data/arabic-report-words.json`), which the twin's phrases already come from; `mcp/lib/arabic-terms.mjs` reads
  them with node:fs only (the website's check runs it without the MCP's packages); `terminology.mjs` re-exports them.
- Engines are *checked* against the sheet (their fixed texts stay where they are written, in their own block), not
  rewired to read it at run time: the browser files would need the JSON loaded first (a new request and a load order).
- Microsoft's term wins for a Power BI UI term unless DataArcus's own report texts were measured in Desktop with another
  one (filters): then the measured one stays and the owner chooses.
- "English once" is enforced on the site's Arabic pages (`ar/`), and written once in the approval page's heading; a
  report's own texts (button, placeholder, page names) carry no English.
- The bidi rule: Power BI texts already isolate a Latin run (terminology.mjs isolateLatin on the twin and Arabic
  reports); HTML pages are `dir="rtl"`, where a Latin name inside Arabic reads in place: no isolates added to HTML.
- Tests, fixtures and notes are allowed to keep old words (they quote what an engine writes, what a user typed, or what
  was true then); `.min.js` files are checked through their sources.
- «المجموع» (Sum) and «معدل» (rate) are other concepts than «الإجمالي» and «المتوسط»: not flagged.

## Seen, not in scope
- `sitemap-lastmod --write` also moved dates that were stale before this branch (e.g. the licensing guide 14 -> 18 Oct,
  English and Arabic): the integration branch's earlier merges had not run it.
- «1 عناصر مرئية» (and before «1 مرئيات»): the Health Check's size line uses one plural form for every count; Arabic needs
  the singular for 1 and 2 («عنصر مرئي واحد», «عنصران مرئيان»), as for tables and measures.
- The calendar generator's English title says "Calendar Table" while the Arabic now says «جدول التاريخ» (Microsoft's
  "date table"): the two pages name the tool differently.
- Learn's Power BI docs are no longer served in Arabic (ar-sa returns English): Microsoft's Arabic terms now come only
  from the training units and the Arabic Desktop UI; a laptop look at Desktop's Arabic menus (Filters pane, Slicer,
  Tooltip) would confirm the three "to choose" terms.
