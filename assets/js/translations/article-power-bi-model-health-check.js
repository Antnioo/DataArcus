// Translations for article-power-bi-model-health-check.js (generated)
window.modelHealthArticleTranslations = {
  "en": {
    "meta": {
      "title": "Health Check on a Microsoft Power BI Sample: It Scored 84",
      "description": "We ran our free Model Health Check on Microsoft's public COVID-19 sample: a quarter of its columns unused and two bookmarks pointing at a deleted column.",
      "keywords": "Power BI model health check, Power BI best practices, unused columns Power BI, Power BI performance, DAX FILTER performance, Power BI model documentation, Best Practice Analyzer, DataArcus",
      "author": "DataArcus",
      "og:type": "article",
      "og:title": "Health Check on a Microsoft Power BI Sample: It Scored 84",
      "og:description": "We ran our free Model Health Check on Microsoft's public COVID-19 sample: a quarter of its columns unused and two bookmarks pointing at a deleted column.",
      "og:url": "https://dataarcus.com/articles/article-power-bi-model-health-check.html",
      "og:site_name": "DataArcus",
      "og:image": "https://dataarcus.com/assets/img/og/health-check-article.jpg",
      "og:locale": "en_US",
      "twitter:card": "summary_large_image",
      "twitter:title": "Health Check on a Microsoft Power BI Sample: It Scored 84",
      "twitter:description": "We ran our free Model Health Check on Microsoft's public COVID-19 sample: a quarter of its columns unused and two bookmarks pointing at a deleted column.",
      "twitter:image": "https://dataarcus.com/assets/img/og/health-check-article.jpg",
      "canonical": "https://dataarcus.com/articles/article-power-bi-model-health-check.html"
    },
    "header": {
      "badge": "BEST PRACTICE",
      "title": "We Ran a Health Check on a Microsoft Power BI Sample. It Scored 84.",
      "subtitle": "Posted on September 25, 2026 · Updated October 3, 2026"
    },
    "content": {
      "p1": "Power BI models rarely break in one day. They grow. A measure is copied to test an idea, a column is imported just in case, a page is duplicated for a meeting. Nobody deletes anything, because nobody knows what is safe to delete. A year later the model is slow to refresh, hard to change and full of things no one can explain.",
      "p2": "So we built a free <a href='../tools/power-bi-model-health-check.html' class='text-accent'>Power BI Model Health Check</a>. To show what it finds on a model anyone can download and check for themselves, we ran it on one of Microsoft's own public samples: the <a href='https://github.com/microsoft/powerbi-desktop-samples/tree/main/powerbi-service-samples' class='text-accent' target='_blank' rel='noopener'>COVID-19 US Tracking Sample</a>, published under the MIT licence. It scored <strong>84 out of 100</strong>. Here is what it found, and what each finding means for any model.",
      "h1": "The model we checked",
      "p3": "<strong>4 tables, 16 columns, 10 measures and 2 relationships</strong>, and a report with <strong>2 pages and 67 visuals</strong>. A small, published model, and it still has findings: every model collects them as it changes. The whole check took <strong>well under a second</strong>.",
      "list1_1": "<strong>4 of 16 columns (25%) are not used anywhere</strong>: not in a visual, a filter, a measure, a relationship, a sort order or a security rule.",
      "list1_2": "<strong>2 of 12 bookmarks still refer to a column that no longer exists</strong> in the model.",
      "list1_3": "<strong>Auto date/time is on</strong>, so Power BI keeps a hidden date table for the date column.",
      "list1_4": "<strong>4 calculated columns on imported tables</strong>, three of which read other tables or rows.",
      "list1_5": "Plus smaller things: one unused measure, two visible key columns, a relationship on a text key, and four measures without a format string.",
      "h2": "1. A quarter of the columns are never used",
      "p4": "Every imported column costs memory and refresh time, whether anyone looks at it or not. Text columns with many unique values, like names, notes and IDs, cost the most. Here the unused ones are a county code (<code>FIPS</code>), a flag for US territories and two columns of a hidden helper table. In a small sample that costs little; in a model with millions of rows, one unused ID column can take a large share of its size.",
      "p5": "The fix is to remove them in Power Query, not to hide them. A hidden column is still loaded and stored. The health check writes the <code>Table.RemoveColumns</code> step for each table for you. One caution: \"unused\" means unused in this report. If other reports connect to the same model, check those first.",
      "h3": "2. Two bookmarks point at a column that no longer exists",
      "p6": "This is the kind of finding nobody looks for. The model has a <code>County Name</code> column, but two bookmarks, \"Blue States\" and \"Pink States\", still refer to a <code>County Name - Copy</code> column that is no longer there. The pages look fine: the stale reference sits inside the bookmarks. When a column or measure is renamed or deleted, Power BI does not warn you about every visual, filter or bookmark that used it.",
      "p7": "The check lists each broken field and where it is used, so the fix takes minutes: update the bookmark or the visual, or replace the field.",
      "h4": "3. Auto date/time is still on",
      "p8": "With <strong>Auto date/time</strong> on, Power BI Desktop creates a hidden date table for each date column of an imported table that isn't on the \"many\" side of a relationship. Here that is one table. In a real model with many date columns these hidden tables add up: Microsoft's own guidance says each one increases the model size and extends refresh time.",
      "p8b": "The fix: add one date table and mark it (our free <a href='../tools/dax-calendar-table-generator.html' class='text-accent'>calendar generator</a> writes one), move your visuals to it, then turn the option off in <strong>File > Options and settings > Options > Current File > Data Load > Time intelligence</strong>. Turning it off removes the hidden tables, so check every visual that used them first.",
      "p9": "<code>FILTER(Table, ...)</code> as a CALCULATE filter builds a table of every column of every row that passes, and applies all of it. A filter on the one column you care about lets the engine work on that column alone. In almost every model the result is the same, and <code>KEEPFILTERS</code> keeps it that way when a slicer is already filtering that column. Without it, the column filter would replace the slicer.",
      "h5": "4. Small things that add up",
      "list2_1": "<strong>Calculated columns on imported tables.</strong> Four of them: a county label built with RELATED, daily cases and daily deaths worked out from the day before, and a column that always says \"USA\". Microsoft's guidance prefers columns added in Power Query or at the source, which typically compress better and don't wait for every table to load; a column that needs measures or DAX-only functions can still be the better choice in DAX.",
      "list2_2": "<strong>Visible keys and a text key.</strong> Two key columns on the \"many\" side are visible in the field list, where report authors drag them in by mistake, and one relationship joins on a text code instead of a number.",
      "list2_3": "<strong>A measure nothing uses.</strong> One of the 10 measures feeds no visual, directly or through other measures. The check follows these chains, which is almost impossible to do by hand.",
      "list2_4": "<strong>Measures without a format string.</strong> Four here, but all four return text (notes and button labels), so in this model they are harmless. On a number, a missing format is what makes a card show 0.34 instead of 34%.",
      "p12": "<strong>What it did not find: FILTER over a whole table.</strong> This sample has none, but we see the pattern often, because it is the first way most of us learned to write a filtered measure:",
      "h6": "How the check works, and why your file stays with you",
      "p10": "The tool reads a <strong>Power BI template (.pbit)</strong>. A template has your model and report layout but <strong>no data rows</strong>, so it stays small even for very large models. The file is opened inside your browser tab and never uploaded. The tool maps every measure to the columns and measures it depends on, then follows every visual, filter, relationship and security rule to see what is really used.",
      "h7": "Check your own model in three steps",
      "list3_1": "In Power BI Desktop: <strong>File > Export > Power BI template</strong>.",
      "list3_2": "Drop the .pbit on the <a href='../tools/power-bi-model-health-check.html' class='text-accent'>Model Health Check</a>.",
      "list3_3": "Start with the \"Fix these first\" list. Then copy the cleanup scripts and download the documentation for your team.",
      "p11": "Microsoft's sample is a demo, so these findings cost it little. A production model has more tables, more history and more people editing it, and usually more to find. The first check takes one minute, and it will likely surprise you."
    },
    "exploreMore": {
      "title": "Check your model now",
      "subtitle": "Free, runs in your browser, nothing is uploaded. Or try it first on a sample model.",
      "button1": "Open the Model Health Check"
    },
    "finalCta": {
      "title": "Want a second pair of eyes on your model?",
      "subtitle": "We review and tune Power BI models: faster refresh, smaller models and DAX your team can maintain.",
      "button": "Book a Free Call"
    }
  },
  "ar": {
    "meta": {
      "title": "فحصنا نموذجًا تجريبيًا من Microsoft: النتيجة 84 من 100",
      "description": "شغّلنا أداة فحص صحة النموذج المجانية على نموذج COVID-19 التجريبي العام من Microsoft: ربع الأعمدة غير مستخدمة وإشارتان مرجعيتان إلى عمود محذوف.",
      "keywords": "Power BI model health check, Power BI best practices, unused columns Power BI, Power BI performance, DAX FILTER performance, Power BI model documentation, Best Practice Analyzer, DataArcus",
      "author": "DataArcus",
      "og:type": "article",
      "og:title": "فحصنا نموذجًا تجريبيًا من Microsoft: النتيجة 84 من 100",
      "og:description": "شغّلنا أداة فحص صحة النموذج المجانية على نموذج COVID-19 التجريبي العام من Microsoft: ربع الأعمدة غير مستخدمة وإشارتان مرجعيتان إلى عمود محذوف.",
      "og:url": "https://dataarcus.com/articles/article-power-bi-model-health-check.html",
      "og:site_name": "DataArcus",
      "og:image": "https://dataarcus.com/assets/img/og/health-check-article.jpg",
      "og:locale": "ar_AR",
      "twitter:card": "summary_large_image",
      "twitter:title": "فحصنا نموذجًا تجريبيًا من Microsoft: النتيجة 84 من 100",
      "twitter:description": "شغّلنا أداة فحص صحة النموذج المجانية على نموذج COVID-19 التجريبي العام من Microsoft: ربع الأعمدة غير مستخدمة وإشارتان مرجعيتان إلى عمود محذوف.",
      "twitter:image": "https://dataarcus.com/assets/img/og/health-check-article.jpg",
      "canonical": "https://dataarcus.com/articles/article-power-bi-model-health-check.html"
    },
    "header": {
      "badge": "أفضل الممارسات",
      "title": "فحصنا صحة نموذج Power BI تجريبي من Microsoft. النتيجة: 84 من 100.",
      "subtitle": "نُشر في 25 سبتمبر 2026 · حُدّث في 3 أكتوبر 2026"
    },
    "content": {
      "p1": "نماذج Power BI نادرًا ما تنكسر في يوم واحد، بل تكبر تدريجيًا. يُنسخ مقياس لتجربة فكرة، ويُستورد عمود احتياطًا، وتُكرر صفحة من أجل اجتماع. لا أحد يحذف شيئًا لأن لا أحد يعرف ما الذي يمكن حذفه بأمان. وبعد سنة يصبح النموذج بطيئًا في التحديث وصعب التعديل ومليئًا بأشياء لا يستطيع أحد شرحها.",
      "p2": "لذلك بنينا أداة مجانية لـ <a href='../tools/power-bi-model-health-check.html' class='text-accent'>فحص صحة نموذج Power BI</a>. ولنُظهر ما تجده على نموذج يستطيع أي شخص تنزيله وفحصه بنفسه، شغّلناها على أحد النماذج التجريبية العامة من Microsoft: <a href='https://github.com/microsoft/powerbi-desktop-samples/tree/main/powerbi-service-samples' class='text-accent' target='_blank' rel='noopener'>COVID-19 US Tracking Sample</a>، المنشور بترخيص MIT. كانت النتيجة <strong>84 من 100</strong>. هذا ما وجدته الأداة وما يعنيه كل اكتشاف لأي نموذج.",
      "h1": "النموذج الذي فحصناه",
      "p3": "<strong>4 جداول و16 عمودًا و10 مقاييس وعلاقتان</strong>، وتقرير فيه <strong>صفحتان و67 visual</strong>. نموذج صغير ومنشور، ومع ذلك فيه ملاحظات: كل نموذج يجمعها كلما تغيّر. واستغرق الفحص كله <strong>أقل بكثير من ثانية</strong>.",
      "list1_1": "<strong>4 من 16 عمودًا (25%) غير مستخدمة إطلاقًا</strong>: لا في visual ولا فلتر ولا مقياس ولا علاقة ولا ترتيب ولا قاعدة أمان.",
      "list1_2": "<strong>إشارتان مرجعيتان (bookmarks) من 12 ما زالتا تشيران إلى عمود لم يعد موجودًا</strong> في النموذج.",
      "list1_3": "<strong>خيار Auto date/time مفعّل</strong>، فيحتفظ Power BI بجدول تاريخ مخفي لعمود التاريخ.",
      "list1_4": "<strong>4 أعمدة محسوبة على جداول مستوردة</strong>، ثلاثة منها تقرأ جداول أو صفوفًا أخرى.",
      "list1_5": "بالإضافة إلى أمور أصغر: مقياس واحد غير مستخدم، وعمودا مفتاح ظاهران، وعلاقة على مفتاح نصي، وأربعة مقاييس بلا تنسيق.",
      "h2": "1. ربع الأعمدة لم يُستخدم أبدًا",
      "p4": "كل عمود مستورد يستهلك ذاكرة ووقت تحديث سواء نظر إليه أحد أم لا. والأعمدة النصية ذات القيم الكثيرة المختلفة، مثل الأسماء والملاحظات والمعرّفات، هي الأعلى تكلفة. الأعمدة غير المستخدمة هنا رمز المقاطعة (<code>FIPS</code>) وعلامة للأقاليم الأمريكية وعمودان في جدول مساعد مخفي. في نموذج تجريبي صغير تكلفتها قليلة، أما في نموذج فيه ملايين الصفوف فقد يأخذ عمود معرّف واحد غير مستخدم جزءًا كبيرًا من حجمه.",
      "p5": "الحل هو حذفها من Power Query وليس إخفاؤها، فالعمود المخفي ما زال يُحمَّل ويُخزن. وتكتب الأداة لك خطوة <code>Table.RemoveColumns</code> لكل جدول. وملاحظة مهمة: \"غير مستخدم\" تعني غير مستخدم في هذا التقرير، فإن كانت تقارير أخرى متصلة بنفس النموذج فراجعها أولًا.",
      "h3": "2. إشارتان مرجعيتان تشيران إلى عمود لم يعد موجودًا",
      "p6": "هذا نوع من الملاحظات لا يبحث عنه أحد. في النموذج عمود <code>County Name</code>، لكن الإشارتين المرجعيتين \"Blue States\" و\"Pink States\" ما زالتا تشيران إلى عمود <code>County Name - Copy</code> الذي لم يعد موجودًا. الصفحات تبدو سليمة، والإشارة القديمة مخبأة داخل الإشارات المرجعية. وعند إعادة تسمية عمود أو مقياس أو حذفه لا ينبهك Power BI إلى كل visual أو فلتر أو إشارة مرجعية كانت تستخدمه.",
      "p7": "تعرض الأداة كل حقل مكسور ومكان استخدامه، فيستغرق الإصلاح دقائق: حدّث الإشارة المرجعية أو الـ visual، أو استبدل الحقل.",
      "h4": "3. خيار Auto date/time ما زال مفعّلًا",
      "p8": "عند تفعيل <strong>Auto date/time</strong> ينشئ Power BI Desktop جدول تاريخ مخفيًا لكل عمود تاريخ في جدول مستورد ليس في جهة \"many\" من علاقة. هنا جدول واحد فقط، لكن في نموذج حقيقي فيه أعمدة تاريخ كثيرة تتراكم هذه الجداول المخفية، وتقول إرشادات Microsoft نفسها إن كل واحد منها يزيد حجم النموذج ويطيل وقت التحديث.",
      "p8b": "الحل: أضف جدول تاريخ واحدًا وعلّمه كجدول تاريخ (أداة <a href='../tools/dax-calendar-table-generator.html' class='text-accent'>مولّد التقويم</a> المجانية تكتبه لك)، وانقل الـ visuals إليه، ثم أوقف الخيار من <strong>File > Options and settings > Options > Current File > Data Load > Time intelligence</strong>. إيقافه يحذف الجداول المخفية، فراجع أولًا كل visual كان يستخدمها.",
      "p9": "استخدام <code>FILTER(Table, ...)</code> كفلتر داخل CALCULATE يبني جدولًا بكل أعمدة كل الصفوف المطابقة ويطبقه كاملًا، أما فلترة العمود الذي يهمك فقط فتجعل المحرك يعمل على هذا العمود وحده. وفي أغلب النماذج تكون النتيجة واحدة، وتضمن <code>KEEPFILTERS</code> ذلك عندما يفلتر slicer نفس العمود، فبدونها يحل فلتر العمود محل الـ slicer.",
      "h5": "4. أشياء صغيرة تتراكم",
      "list2_1": "<strong>أعمدة محسوبة على جداول مستوردة.</strong> أربعة: اسم مقاطعة مبني بـ RELATED، والحالات والوفيات اليومية محسوبة من اليوم السابق، وعمود قيمته دائمًا \"USA\". تفضّل إرشادات Microsoft إضافة الأعمدة في Power Query أو في المصدر، فهي عادة تُضغط بشكل أفضل ولا تنتظر تحميل كل الجداول، لكن العمود الذي يحتاج مقاييس أو دوال لا توجد إلا في DAX قد يبقى الخيار الأفضل في DAX.",
      "list2_2": "<strong>مفاتيح ظاهرة ومفتاح نصي.</strong> عمودا مفتاح في جهة \"many\" ظاهران في قائمة الحقول فيسحبهما معدّو التقارير بالخطأ، وعلاقة واحدة تربط على رمز نصي بدل رقم.",
      "list2_3": "<strong>مقياس لا يستخدمه شيء.</strong> واحد من المقاييس العشرة لا يغذي أي visual، لا مباشرة ولا عبر مقاييس أخرى. والأداة تتبع هذه السلاسل، وهو أمر شبه مستحيل يدويًا.",
      "list2_4": "<strong>مقاييس بلا تنسيق.</strong> أربعة هنا، لكنها كلها تُرجع نصًا (ملاحظات ونصوص أزرار)، فلا ضرر منها في هذا النموذج. أما في مقياس رقمي فغياب التنسيق هو ما يجعل البطاقة تعرض 0.34 بدل 34%.",
      "p12": "<strong>ما لم تجده الأداة: FILTER على جدول كامل.</strong> لا يوجد في هذا النموذج، لكننا نراه كثيرًا لأنه أول طريقة يتعلمها معظمنا لكتابة مقياس مفلتر:",
      "h6": "كيف يعمل الفحص، ولماذا يبقى ملفك معك",
      "p10": "تقرأ الأداة <strong>قالب Power BI (.pbit)</strong>. يحتوي القالب نموذجك وتصميم تقريرك لكن <strong>بدون أي صفوف بيانات</strong>، لذلك يبقى صغيرًا حتى للنماذج الضخمة. يُفتح الملف داخل صفحة المتصفح ولا يُرفع أبدًا. ترسم الأداة خريطة لكل مقياس والأعمدة والمقاييس التي يعتمد عليها، ثم تتبع كل visual وفلتر وعلاقة وقاعدة أمان لتعرف ما المستخدم فعلًا.",
      "h7": "افحص نموذجك في ثلاث خطوات",
      "list3_1": "في Power BI Desktop اختر <strong>File > Export > Power BI template</strong>.",
      "list3_2": "أسقط ملف .pbit في <a href='../tools/power-bi-model-health-check.html' class='text-accent'>أداة فحص صحة النموذج</a>.",
      "list3_3": "ابدأ بقائمة \"ابدأ بإصلاح هذه\"، ثم انسخ سكربتات التنظيف وحمّل التوثيق لفريقك.",
      "p11": "نموذج Microsoft نموذج عرض، فتكلفة هذه الملاحظات عليه قليلة. أما نموذج العمل الفعلي ففيه جداول أكثر وتاريخ أطول وأشخاص أكثر يعدّلونه، وغالبًا ما يُكتشف فيه أكثر. الفحص الأول يستغرق دقيقة واحدة، وغالبًا سيفاجئك."
    },
    "exploreMore": {
      "title": "افحص نموذجك الآن",
      "subtitle": "مجانية وتعمل داخل متصفحك ولا يتم رفع أي ملف، أو جرّبها أولًا على نموذج تجريبي.",
      "button1": "افتح أداة فحص صحة النموذج"
    },
    "finalCta": {
      "title": "تريد من يراجع نموذجك معك؟",
      "subtitle": "نراجع نماذج Power BI ونحسّنها: تحديث أسرع ونماذج أصغر وDAX يسهل على فريقك صيانته.",
      "button": "احجز مكالمة مجانية"
    }
  }
};
