State: DONE (CI green: https://github.com/Antnioo/DataArcus/actions/runs/42635901639 on 5a42b615, the owner's 10 Arabic changes in; before them run 42625021186 on 3a50c4fa. Arabic APPROVED 9 Nov, D-1109-07. No PR: the hub opens it after #117)

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
- **Expected checks:** claims 721 -> 752 (31 new, red first); sitemap 76 -> 78 URLs, 81 pages, 39 Arabic copies.
  **Got:** the same (see "Results"); lint 0; the MCP suite locally 230 of 230; tests.yml green on 3a50c4fa (run
  42625021186, every job on Linux and Windows; macOS skipped by the workflow) after two red runs, both said in "Results".
- **The Arabic:** APPROVED by the owner 9 Nov with 10 changes (D-1109-07), applied; his standard is now
  `content/ARABIC-STYLE.md`.
- **Resume:** the hub's PR to main after #117; the Desktop run of the one DAX measure (laptop list).

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

## Results
- **The article:** `articles/article-power-bi-copilot-ready-check.html`, its Arabic copy `ar/articles/...` (rendered by
  `scripts/ar-pages.mjs --write`), translations `assets/js/translations/article-power-bi-copilot-ready-check.js` (+ .min.js),
  share image `assets/img/og/copilot-ready-check.jpg` (1200 x 630, 65 KB). English body 1,739 words (header and content,
  tags stripped). Title EN 59 characters, description 148; AR title 50, description 136.
- **Wired:** `assets/js/locale-routes.js` (copilotReadyCheckTranslations), blog card and JSON-LD list (17 posts), the home
  page's latest three (it replaces the best-practice card) and the article count 16 -> 17, sitemap, llms.txt,
  `scripts/make-share-images.mjs` (one entry, COPILOTCHECK), the 7-point article's p12 links to it (EN and AR; its
  `dateModified` left at 2026-10-04: one sentence, no fact changed). Stamps by `npm run build:min` (the routes file
  changed, so every page's `locale-routes.min.js` stamp moved, as W's did); policies by `csp.mjs --write`.
- **The made-up model, measured:** `node mcp/work/cp1/sahel-model.mjs before|after` (the site's own engine,
  `assets/js/model-health-engine.js`, in Node; run twice, identical output, md5 aaa1458e...). Before: score 79 (perf 74,
  maint 94, bp 72), 10 kinds on 24 objects: BIDI 1, MONTH_SORT 2, DATE_NOT_MARKED 1, SUMMARIZE_KEYS 6, DIVISION 1,
  UNUSED_COL 4, FK_VISIBLE 3, NO_DESC 4, NO_FORMAT 1, NO_RLS 1. After the fixes the article lists: 98 (96/100/100), 2
  kinds: UNUSED_COL 1 (the hidden OrderLineID) and NO_RLS 1. No "Please confirm" question either time.
- **DAX:** the one measure (`Margin % = DIVIDE ( [Total Sales] - [Total Cost], [Total Sales] )`, format 0.0%) is the
  "after" model's; the engine reads it (DIVISION and NO_FORMAT gone, nothing added). Not run in Power BI Desktop (the
  cloud has none): on the laptop list for the owner. The AI instructions block is plain English, not DAX.
- **Microsoft Learn, read 9 Nov 2026** (the Learn docs service; every page linked from the article, EN and AR):
  copilot-enable-power-bi (P1/F2, trial not supported, the tenant setting, on by default); copilot-evaluate-data
  ("Resolve modeling issues...", outside the US or EU data boundary disabled by default, the first 200 characters,
  ratios, focused questions); copilot-power-bi-desktop (PPU not supported); copilot-prepare-data-ai (title "(preview)",
  Home ribbon, saved on the model, Q&A, Approved for Copilot); copilot-prepare-data-ai-data-schema (hidden fields left
  out at first set-up; not used for report pages, search, DAX queries); copilot-prepare-data-ai-verified-answers
  (hidden fields, 5 to 7 phrases); copilot-prepare-data-ai-instructions (10,000 characters, no guarantee);
  copilot-ask-data-question ("The only supported language is English", page filters and slicers not applied, year-over-
  year DAX); tutorial-copilot-power-bi-prepare-model (duplicate field names); copilot-integration (hiding fields, pages
  and visuals).
- **Checks:** `mcp/test-0.3.0-claims.mjs` 721 -> 752; red first on 60725d9 (the plan commit, in a scratch worktree): 752
  checks, 31 failed (every CP1 check), the 721 old ones passing; after: 752/752. `node scripts/test-site-config.mjs` PASS
  (78 URLs, 81 pages, no em dash in 1660 files); `node scripts/ar-pages.mjs` PASS (39 copies); `npm run check:min` PASS
  (stamps 1264); `node scripts/csp.mjs` 142 pages; `npm run lint` 0; check-agent-memory, check-modules (217),
  check-literal-requires, check-result-lines, changelog-words, check-contracts PASS. deny-scan needs DENY_TERMS (CI only).
- **CI, run 1** (https://github.com/Antnioo/DataArcus/actions/runs/42619148915, on 839b1506): red in fx3 C1 (the owner's
  D-1028-05: «تجريبية», never «مختلق»; I had one «مختلق» in the Arabic p2). Fixed in 0d528475; fx3 17/17 locally.
  **Run 2** (https://github.com/Antnioo/DataArcus/actions/runs/42622150469, on 0d528475): every MCP job green (Linux and
  Windows); red in the two characterisation suites, sp35 (E1, A1 home; E8, A8 blog) and sp36 (S1, S2, S3, S5, S6, S7,
  S11), each because the home page and the blog changed on purpose. Re-pinned on purpose, as RV1 round 2 did for its
  subtitle: `SP35_RECORD=1 SP36_RECORD=1`, then every changed line checked. The only keys that moved:
  `scripts/tests/fixtures/sp35-site.json` counters "16 2 7 8 1" -> "17 2 7 8 1" (20 lines: the article count), aos 17 ->
  18 and cards (one more card at index 0, so the search and filter results shift by one: "2,3,7,8,10,14" ->
  "3,4,8,9,11,15", "3,8" -> "4,9"; 40 lines); `sp36-lang.json` i18n and dict of the home page and the blog (EN and AR:
  dict 42532 -> 43065 and 19396 -> 20082; 68 lines). Nothing else moved; both suites pass again (sp35 38, sp36 18).
  **Run 3** (https://github.com/Antnioo/DataArcus/actions/runs/42625021186, on 3a50c4fa): green, every job.
  **Run 4** (https://github.com/Antnioo/DataArcus/actions/runs/42635901639, on 5a42b615, the owner's 10 changes and
  ARABIC-STYLE.md): green, every job. Locally before the push: claims 752, fx3 17, site config (78 URLs, 81 pages),
  ar-pages 39, stamps 1264, csp 142, lint 0, agent-memory 464; the Arabic page at 390 wide read again.
- **On the page (Chromium, 1280 and 390, EN and AR):** no page error, no horizontal scroll at 390, `dir="rtl"` on the
  Arabic copy. The first shots showed code runs (`[Margin %]`, `0.0%`) drawn reversed and «لـ» split from Copilot at a
  line end: every `<code>` in the Arabic is now inside `<bdi>`, and «لـ» is joined to Copilot with a no-break space in the
  title and the audit link. Shots kept in the session scratchpad, not committed.

## For the owner: APPROVED 9 Nov with the 10 changes (D-1109-07)
The owner's words: "agree you see what you did here in your suggestions that's what i need make it a standard in
dataarcus". The 10 changes, applied exactly:
1. h2, h3, h4, h5: «الدقيقة 0 إلى 2» -> «من الدقيقة 0 إلى 2» (and 2 إلى 6, 6 إلى 9, 9 إلى 10).
2. list3_5: «علاقات تُرشّح في الاتجاهين» -> «علاقات بتصفية ثنائية الاتجاه»; later in the line «يجب أن يكون في الاتجاهين»
   -> «يجب أن تكون ثنائية الاتجاه» (the relationship is the subject, so the verb is feminine).
3. list3_2: «جهة الكثير» -> «طرف «متعدد» من العلاقة».
4. p2: «بالساعة» -> «مع حساب الوقت».
5. h1: «قبل أن تبدأ الساعة» -> «قبل أن تبدأ الفحص».
6. exploreMore.title: «ابدأ الساعة» -> «ابدأ الفحص الآن».
7. list2_2: «أفلت ملف .pbit على أداة» -> «اسحب ملف .pbit وأفلته في أداة».
8. list4_3: «ودونها لا رمضان يجيب عنه Copilot» -> «ومن دونها لن يستطيع Copilot أن يجيب عن رمضان».
9. p10: «يستطيع مالكه أن يعلّمه Approved for Copilot» -> «يستطيع مالكه أن يضع عليه علامة Approved for Copilot».
10. h9: «أين يأتي DataArcus» -> «أين يأتي دور DataArcus».
Everything else approved as written. The standard these changes set: `content/ARABIC-STYLE.md` (BLOG-PLAN.md's voice
section points to it).

The final Arabic, every line (the `"ar"` half of the translations file; English runs shown without their `<bdi>`; links
as [text]):

- `meta.title`: هل نموذج Power BI جاهز لـ Copilot؟ فحص في 10 دقائق
- `meta.description`: فحص بالدقائق قبل أن يستخدم فريقك Copilot: ما يحتاجه Copilot ليعمل، وما تكشفه أداة فحص صحة النموذج المجانية، وما تصلحه، على نموذج تجريبي.
- `header.badge`: Copilot والذكاء الاصطناعي
- `header.title`: هل نموذج Power BI جاهز لـ Copilot؟ كيف تفحصه في 10 دقائق
- `header.subtitle`: نُشر في 9 نوفمبر 2026
- `content.p1`: يريد مديرك أن يسأل الفريق Copilot بدل انتظار صفحة تقرير جديدة. والسؤال يصل إليك: هل النموذج جاهز، وكيف تعرف ذلك قبل أن يبدأ الناس في الوثوق بالإجابات؟ نصيحة Microsoft نفسها أن تصلح النموذج أولًا، لأن التعليمات الإضافية لا تصحّح علاقات خاطئة ولا تجميعًا غير مناسب ([Microsoft Learn، قُرئت في 9 نوفمبر 2026]).
- `content.p2`: هذه هي النسخة العملية: فحص تنجزه في نحو عشر دقائق، مع حساب الوقت. شغّلنا كل خطوة على نموذج تجريبي اسمه Sahel Electronics، متجر إلكترونيات خليجي تجريبي، فيه أربعة جداول وأربعة مقاييس وصفحة تقرير واحدة؛ لا شركة حقيقية ولا بيانات حقيقية. ولماذا تهم كل نقطة، اقرأ [فحصنا ذا النقاط السبع]؛ أما هنا فنجري الفحص فقط.
- `content.h1`: قبل أن تبدأ الفحص: هل يعمل Copilot عندكم أصلًا؟
- `content.p3`: إن كان الجواب لا، فالباقي يمكنه الانتظار. من Microsoft Learn، قُرئت في 9 نوفمبر 2026 ([تفعيل Copilot في Power BI]):
- `content.list1_1`: السعة: يجب أن تكون مساحة عمل التقرير على Power BI Premium ‏(P1 أو أعلى) أو على سعة Fabric مدفوعة (F2 أو أعلى)، أو أن تستخدم سعة Fabric Copilot. السعات التجريبية غير مدعومة، وCopilot في Power BI Desktop لا يدعم مساحات العمل بترخيص Premium Per User ([Copilot في Power BI Desktop]).
- `content.list1_2`: إعداد المسؤول: في بوابة إدارة Fabric، ضمن Tenant settings، الإعداد Users can use Copilot and other features powered by Azure OpenAI. تقول Microsoft إنه مفعّل افتراضيًا، ويستطيع المسؤول إيقافه أو قصره على مجموعة.
- `content.list1_3`: الجزء الخليجي: تقول Microsoft إن Copilot يكون معطّلًا افتراضيًا إذا كان المستأجر أو السعة خارج نطاق بيانات الولايات المتحدة أو الاتحاد الأوروبي ([Microsoft Learn]). والمستأجر في الإمارات أو السعودية من هذه الحالة: لا يعمل Copilot إلا بعد أن يفعّل مسؤول Fabric الإعداد الذي يسمح بمعالجة البيانات المرسلة إلى Azure OpenAI خارج منطقتك. وهذا قرار يخص سياسة البيانات في شركتك، لا إصلاحًا في النموذج.
- `content.list1_4`: تفعيل Q&A للنموذج: تستخدم أسئلة البيانات في Copilot المحرك نفسه الذي تستخدمه Q&A، فيجب أن تكون Q&A مفعّلة للنموذج الدلالي ([Microsoft Learn]).
- `content.p4`: لا يلزم شيء من هذا لإجراء الفحص التالي. فهو يعمل على ملف النموذج، فتستطيع إجراءه اليوم وتشغيل Copilot لاحقًا.
- `content.h2`: من الدقيقة 0 إلى 2: شغّل فحص صحة النموذج
- `content.list2_1`: في Power BI Desktop: File > Export > Power BI template. ملف ‎.pbit يحمل تعريف النموذج، لا البيانات التي حمّلها Power BI (وتبقى فيه الجداول الصغيرة المكتوبة يدويًا عبر Enter data والقيم المحفوظة في الفلاتر والمقسمات).
- `content.list2_2`: اسحب ملف ‎.pbit وأفلته في أداة [فحص صحة النموذج] المجانية. تعمل في متصفحك ولا يُرفع أي شيء.
- `content.list2_3`: دوّن النتيجة وعدد الملاحظات، فستعيد الفحص بعد الإصلاحات.
- `content.p5`: حصل Sahel Electronics على 79، مع 10 أنواع من الملاحظات على 24 عنصرًا. ليست كلها عن Copilot. ستة أنواع منها هي كذلك، وهي ما تشغل الدقائق الأربع التالية.
- `content.h3`: من الدقيقة 2 إلى 6: الملاحظات الست التي تهم Copilot
- `content.list3_1`: «أعمدة معرّفات أو سنوات أو رموز تُجمع افتراضيًا» (6 في نموذجنا، منها Calendar[Year] وProduct[ProductCode]). ضع سنة تُجمع افتراضيًا في قيم جدول، فيجمع Power BI السنوات: 2026 عن كل يوم في التقويم. وتذكر Microsoft التجميع غير المناسب ضمن ما لا تصحّحه التعليمات. الإصلاح: اجعل Summarize by على None في كل واحد منها، وضع الأرقام التي يسأل عنها الناس في مقاييس مراجَعة، كما تنصح Microsoft للحسابات المهمة للعمل.
- `content.list3_2`: «أعمدة مفاتيح ظاهرة في طرف «متعدد» من العلاقة» (3) و«أعمدة غير مستخدمة في أي مكان» (4، اثنان منها عمودا رقم الشهر المساعدان). الحقول التي تخفيها تُستبعد من مخطط بيانات الذكاء الاصطناعي حين تُعدّه أول مرة ([Microsoft Learn]). الإصلاح: أخفِ المفاتيح والأعمدة المساعدة للترتيب، واحذف الأعمدة التي لا يستخدمها أحد (عندنا Sales[Old Notes]).
- `content.list3_3`: «أسماء أشهر أو أيام بلا عمود ترتيب» (2: Month Name وHijri Month Name). دون عمود ترتيب تُرتَّب الأشهر الهجرية أبجديًا، فيأتي جمادى الأولى قبل محرم. الإصلاح: Sort by column برقم الشهر.
- `content.list3_4`: «جدول التقويم غير معلَّم كجدول تاريخ» (1). تحتاج إليه دوال ذكاء الوقت التقليدية، وCopilot قد يكتب DAX لأسئلة مثل النمو عن العام السابق ([Microsoft Learn]). الإصلاح: Mark as date table على العمود Date.
- `content.list3_5`: «علاقات بتصفية ثنائية الاتجاه» (1، من Sales إلى Branch). تطلب Microsoft علاقات واضحة ومنطقية، والتعليمات لا تصلحها. الإصلاح: اتجاه واحد، إلا إن كنت تعرف لماذا يجب أن تكون ثنائية الاتجاه.
- `content.list3_6`: «مقاييس بلا وصف» (4)، ومعها [Margin %] بلا تنسيق وبقسمة عادية /. يقرأ Copilot الأوصاف، لكنه لا يستخدم منها إلا أول 200 حرف ([Microsoft Learn]): ابدأ بالمعنى والوحدة وما يُستثنى. وتطلب Microsoft أيضًا أن تُنسَّق النسب كنسب مئوية وأن يُقسَم الهامش من المقاييس المعتمدة. الإصلاح، بالتنسيق 0.0%:
- `content.h4`: من الدقيقة 6 إلى 9: ما لا يحسمه فحص الملف
- `content.p6`: يستطيع الملف أن يُظهر ما ينقص. أما هذه الأربعة فتحتاج إليك:
- `content.list4_1`: الاسم نفسه في جدولين. كان في نموذجنا Name في جدول المنتجات وName في جدول الفروع. يقول الدليل التعليمي من Microsoft أن تتجنب تكرار أسماء الحقول بين الجداول ([Microsoft Learn])، وأداة فحص صحة النموذج لا تكشف ذلك اليوم. أعدنا تسميتهما Product Name وBranch Name.
- `content.list4_2`: أسماء الأعمدة العربية. تقول Microsoft عن أسئلة البيانات في Copilot إن اللغة المدعومة الوحيدة هي الإنجليزية ([Microsoft Learn]). في جدول الفروع عندنا العمود «اسم الفرع» لصفحات التقرير العربية. أبقِه، وأعطه وصفًا بالإنجليزية يقول ما يحمله: Branch name in Arabic (the same branch as Branch Name).
- `content.list4_3`: التقويم الهجري. إن كان الناس سيسألون عن رمضان، فيجب أن يعرفه النموذج: في جدول التقويم عندنا Hijri Year وHijri Month Name وIs Ramadan، ومقياس [Ramadan Sales]. ومن دونها لن يستطيع Copilot أن يجيب عن رمضان. وأداتنا [مولّد جدول التاريخ] تبني هذه الأعمدة.
- `content.list4_4`: عشرة أسئلة حقيقية. تقترح Microsoft أن تبدأ بأسئلة عمل محددة، لكل منها المقياس المتوقع والتجميع وأساس التاريخ والفلاتر والنتيجة. اكتب عشرة أسئلة يطرحها فريقك كل شهر، مع الإجابات التي تثق بها اليوم. هذا هو اختبارك لاحقًا.
- `content.h5`: من الدقيقة 9 إلى 10: اكتب القائمة
- `content.p7`: رتّبها كما ترتّبها Microsoft: النموذج أولًا (الملاحظات الست والفحوص الأربعة)، ثم Prep data for AI، ثم الاختبار بأسئلتك العشرة. كل إصلاح مما سبق دقيقة أو دقيقتان في Desktop؛ والأوصاف تأخذ الوقت الأطول.
- `content.h6`: ما فعلته الإصلاحات بالنموذج التجريبي
- `content.p8`: طبّقنا الإصلاحات على تعريف نموذج Sahel Electronics وشغّلنا محرك فحص صحة النموذج نفسه مرة أخرى. ارتفعت النتيجة من 79 إلى 98، ونزلت الملاحظات من 10 أنواع إلى نوعين: مفتاح مخفي لا يستخدمه أي مرئي (لا بأس: إنه معرّف الصف)، وتنبيه بأن النموذج بلا أدوار أمان على مستوى الصفوف، وهذا صحيح لنموذج يراه الجميع. وصيغة DAX للمقياس [Margin %] أعلاه هي التي حلّت محل القسمة العادية.
- `content.h7`: ثم Prep data for AI (معاينة)
- `content.p9`: ما زالت صفحة Microsoft تسميها معاينة ([تجهيز بياناتك للذكاء الاصطناعي، قُرئت في 9 نوفمبر 2026]). في Desktop هي زر Prep data for AI في شريط Home؛ وفي الخدمة، في شريط النموذج الدلالي. ويُحفظ كل شيء في النموذج الدلالي، لا في التقرير. ولها ثلاثة أجزاء:
- `content.list5_1`: مخطط بيانات للذكاء الاصطناعي (AI data schema): الجداول والأعمدة والمقاييس التي يستخدمها Copilot. وتنبّه Microsoft إلى أن Copilot حين ينشئ صفحة تقرير أو يبحث عن بيانات أو يكتب استعلام DAX يستخدم النموذج الدلالي كله ويتجاهل هذا المخطط. لذا يبقى الإخفاء والحذف مهمَّين.
- `content.list5_2`: إجابات موثّقة (Verified answers): مرئي راجعته، مربوط بالعبارات التي يكتبها الناس (تقترح Microsoft من خمس إلى سبع عبارات لكل إجابة). وفي قائمة Microsoft نفسها تنبيه: الإجابات الموثّقة لا تعمل إذا أخفيت حقولها في النموذج، فابنِها على حقول ظاهرة ([Microsoft Learn]).
- `content.list5_3`: تعليمات للذكاء الاصطناعي (AI instructions): مصطلحات عملك بلغة بسيطة، حتى 10,000 حرف، ولا ضمان أن يتبعها النموذج اللغوي حرفيًا ([Microsoft Learn]). وهذه تعليمات متجرنا التجريبي، بالإنجليزية لأنها لغة أسئلة البيانات اليوم:
- `content.p10`: وحين يجهز النموذج، يستطيع مالكه أن يضع عليه علامة Approved for Copilot في إعدادات النموذج الدلالي في الخدمة.
- `content.h8`: ما لا يراه Copilot
- `content.list6_1`: المقسمات في الصفحة. أسئلة البيانات في Copilot لا تطبّق الفلاتر أو المقسمات المطبّقة حاليًا على صفحة التقرير ([Microsoft Learn]). فسؤال «مبيعات هذا الشهر» يعني النموذج كله ما لم يقل السؤال أكثر.
- `content.list6_2`: الحقول والصفحات والمرئيات المخفية، باختيارك: تصف Microsoft إخفاء الحقول للتحكم فيما يستخدمه Copilot من النموذج، وإخفاء الصفحات والمرئيات للتحكم فيما يقرؤه ملخص التقرير ([Microsoft Learn]).
- `content.list6_3`: ما بعد أول 200 حرف من الوصف، وعناصر مجموعة الحساب، فبيانات النموذج الوصفية لا تتضمنها: اذكرها في وصف عمود مجموعة الحساب.
- `content.list6_4`: تعليماتك، لمن يسأل: لا يرى المستخدمون تعليمات الذكاء الاصطناعي ولا مخطط بياناته. أخبر فريقك بالكلمات ما الغرض من النموذج.
- `content.h9`: أين يأتي دور DataArcus
- `content.p11`: أداة [فحص صحة النموذج] تنجز الجزء القابل للقياس من الدقيقة 0 إلى 6، مجانًا وفي متصفحك. تقرأ تعريف النموذج لا بياناتك، ولا تشغّل Copilot. وحين تريد من يجري الفحص كله على نموذج حقيقي، فإن [تدقيق الجاهزية لـ Copilot] مراجعة بسعر ثابت لنموذج دلالي واحد: كل ملاحظة مع إصلاحها الدقيق، وإعداد Prep data for AI، والتقويم الخليجي إن كان عملك يسير عليه، بالعربية أو الإنجليزية.
- `content.h10`: أسئلة
- `content.q1`: هل أحتاج إلى تشغيل Copilot لإجراء هذا الفحص؟
- `content.a1`: لا. الدقائق من 0 إلى 10 تعمل على ملف النموذج. تحتاج إلى Copilot فقط لاختبار الإجابات بعدها بأسئلتك العشرة.
- `content.q2`: هل يستطيع فريقي سؤال Copilot بالعربية؟
- `content.a2`: تقول Microsoft Learn عن أسئلة البيانات في Copilot إن اللغة المدعومة الوحيدة هي الإنجليزية (قُرئت في 9 نوفمبر 2026). يمكن أن تبقى أسماء الأعمدة العربية لتقريرك؛ أعطها أوصافًا بالإنجليزية.
- `content.q3`: هل ترسل أداة فحص صحة النموذج نموذجي إلى أي مكان؟
- `content.a3`: لا. تعمل في متصفحك ولا يُرفع أي شيء.
- `content.p12`: ميزات الذكاء الاصطناعي في Power BI تتغير كل شهر، لذلك كل معلومة من Microsoft هنا مؤرَّخة. ولخلفية كل فحص، اقرأ [هل نموذج Power BI جاهز للذكاء الاصطناعي؟ فحص من 7 نقاط]؛ وللأعمدة الهجرية، [تقويم خليجي في Power BI].
- `exploreMore.title`: ابدأ الفحص الآن
- `exploreMore.subtitle`: مجانية، تعمل في متصفحك، ولا يُرفع أي شيء.
- `exploreMore.button1`: افتح فحص صحة النموذج
- `finalCta.title`: تريد الفحص كله على نموذجك؟
- `finalCta.subtitle`: مراجعة بسعر ثابت لنموذج دلالي واحد قبل Copilot، مع الإصلاح الدقيق لكل ملاحظة، بالعربية أو الإنجليزية.
- `finalCta.button`: اطّلع على تدقيق الجاهزية لـ Copilot

Also in Arabic on other pages: the blog card (`assets/js/translations/blog.js`, posts.copilotReadyCheck: the title as
meta.title above, excerpt «فحص بالدقائق قبل أن يستخدم فريقك Copilot، أجريناه على نموذج تجريبي: ما يحتاجه Copilot
ليعمل، والملاحظات الست المهمة في فحص صحة النموذج، وما لا يحسمه فحص الملف.»), the home page card (`homepage.js`, excerpt
«فحص بالدقائق قبل أن يستخدم فريقك Copilot: ما يحتاجه ليعمل، والملاحظات التي تهمه.»), and one sentence added to the
7-point article's p12: «وللنسخة العملية مع Copilot، بالدقائق، اقرأ [كيف تفحص نموذجك في 10 دقائق].»

## For the laptop (when the owner batches a Desktop run)
1. The `[Margin %]` measure on a small made-up Sahel model in Power BI Desktop: it returns the margin, formatted 0.0%.
2. Optional: the Prep data for AI button on the Home ribbon, as the article names it from Learn (not seen here).

## CHANGELOG line (for the hub, if the release notes list site content)
- **A new article on dataarcus.com: "Is your Power BI model ready for Copilot? How to check in 10 minutes."** In English
  and Arabic: what Copilot needs to run, a timed check with the Model Health Check on a made-up model, what no file check
  settles, Prep data for AI as Microsoft describes it today, and what Copilot does not see.

## Decisions I made
- **Slug** `article-power-bi-copilot-ready-check`; `<title>` shortened to 59 characters, the h1 and JSON-LD headline keep
  the brief's full title (as the best-practice article does). Badge and blog topic COPILOT & AI.
- **Numbers from the engine, not Desktop:** the fixes were made on the model's definition (JSON) and the same engine
  run again; the article says so ("on Sahel Electronics' model definition").
- **No FAQPage data:** the Arabic copy keeps JSON-LD in English (W's did); three questions sit on the page as text.
- **The home page's latest three** now start with this post; the best-practice card left the three.
- **The Gulf angle where Learn supports it:** the data-boundary setting (a UAE or Saudi tenant is outside the US and EU
  boundary), English-only data questions with Arabic column names, Hijri month sort and Ramadan columns. Not used: Learn's
  note that the standalone Copilot experience is not yet available in the Qatar region (true, but a region list that
  changes; left out rather than dated twice).

## Seen, not in scope
1. The Health Check does not flag the same column name in two tables (Learn's tutorial asks to avoid it): the article says
   so; a rule would be an engine change (backlog candidate).
2. The Health Check's month-sort rule finds `Hijri Month Name` by its English name; a Hijri month column named only in
   Arabic (for example «الشهر الهجري») is not matched by its pattern (`health-rules.js` columnRules).
3. Learn's enable page says the cross-geo setting "only applies if Azure OpenAI isn't available in your geographic
   region", while the evaluate page says Copilot is off by default outside the US and EU boundary; the article quotes
   the second, with its link. Worth re-reading when Microsoft updates either page.
4. BLOG-PLAN's checklist asks for three LinkedIn posts per article: not in this brief, not written.
5. `content/ARABIC-STYLE.md` says "A title is all Arabic or all English, never mixed", while the approved Arabic title
   (and every earlier post's) keeps "Power BI" and "Copilot" inside it, as product names stay English (the same file's
   last rule). Read here as: a product name inside an Arabic title is allowed; the owner may want to say so in the file.
