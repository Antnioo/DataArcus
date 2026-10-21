// Translations for power-bi-mcp/index.html (DataArcus for Power BI, the public beta page)
window.betaPageTranslations = {
  "en": {
    "meta": {
      "title": "DataArcus for Power BI: public beta",
      "description": "An AI agent in Claude Desktop reads your Power BI project and writes a complete new report next to it, in English or Arabic. Public beta for Windows.",
      "author": "DataArcus",
      "og:type": "website",
      "og:title": "DataArcus for Power BI: public beta",
      "og:description": "An AI agent in Claude Desktop reads your Power BI project and writes a complete new report next to it, in English or Arabic. Public beta for Windows.",
      "og:url": "https://dataarcus.com/power-bi-mcp/",
      "og:site_name": "DataArcus",
      "og:image": "https://dataarcus.com/assets/img/og/home.jpg",
      "og:locale": "en_US",
      "twitter:card": "summary_large_image",
      "twitter:title": "DataArcus for Power BI: public beta",
      "twitter:description": "An AI agent in Claude Desktop reads your Power BI project and writes a complete new report next to it, in English or Arabic. Public beta for Windows.",
      "twitter:image": "https://dataarcus.com/assets/img/og/home.jpg",
      "canonical": "https://dataarcus.com/power-bi-mcp/"
    },
    "beta": {
      "hero": {
        "badge": "Public beta",
        "title": "DataArcus for Power BI",
        "subtitle": "An AI agent in Claude Desktop reads your Power BI project (PBIP, with its TMDL model) and writes a complete new report (PBIR) next to it, in English or in Arabic, right to left.",
        "button": "Download 0.3.0",
        "how": "See how it works",
        "facts": "Free during the beta. Windows, with Power BI Desktop and Claude Desktop.",
        "ga": "Microsoft: <em>\"Power BI Desktop projects (PBIP) and Power BI enhanced report format (PBIR) are generally available.\"</em> (<a href='https://learn.microsoft.com/power-bi/developer/projects/projects-external-editing' class='text-accent' target='_blank' rel='noopener'>Microsoft Learn</a>)"
      },
      "new": {
        "title": "What's new in 0.3.0",
        "version": "Version 0.3.0 adds:",
        "l1": "<strong>Arabic reports with no English titles.</strong> An Arabic report from an English-named model, and the Arabic twin of a report, show their titles, table headers, tooltips, alt texts and phone layout in Arabic. Before you approve, the plan lists any field kept in English, with why.",
        "l2": "<strong>An Arabic terminology sheet.</strong> One Arabic name per field, approved by you, written on every title, table header, slicer header, tooltip and alt text. The approval page shows it side by side, English and Arabic.",
        "l3": "<strong>One report in English and Arabic.</strong> <code translate='no'>create_arabic_twin</code> can write a copy named \"(EN-AR)\" holding the English pages and their Arabic pages, with a language button on each page where its header has room (and on its phone layout when that has room too); the plan names any page left without one. Your original report is not changed.",
        "l4": "<strong>Waterfall, combo and small multiples.</strong> Power BI's own visuals, when you ask for them and the fields fit. In an Arabic report the waterfall reads left to right, as Power BI draws it; the rest of the page is mirrored.",
        "l5": "<strong>An approval page you can check.</strong> The preview shows each title as the report will write it, marks a title as cut where the rule measured in Power BI Desktop says Desktop cuts it, and draws each slicer with its header. The page lists every file the plan writes, grouped and counted.",
        "l6": "<strong>More looks, chosen in the plan.</strong> Smooth lines with a dot on each value, slicers as rounded buttons (for a field with 2 to 6 values), dotted or no gridlines, flip cards, status icons that differ in shape as well as colour, and a page that switches between 2 to 5 measures. Flip cards, the metric switcher and status icons from a target come with a model script you apply yourself in TMDL view: DataArcus does not change your model.",
        "l7": "<strong>Dates and units asked, not guessed.</strong> It asks which date a report uses (order date, ship date or another), in which calendar (Gregorian or Hijri) and, for a Ramadan or Eid page, one Hijri year or every season. Two measures in different units, such as SAR and AED or a percent and a count, never share an axis: each gets its own visual.",
        "l8": "<strong>Power BI's October 2026 update.</strong> <code translate='no'>check_report</code> checks reports against Microsoft's report schemas of September 2026 and its visual catalog of 19 October.",
        "try": "Try these first",
        "t1": "<strong>An Arabic report.</strong> Ask Claude for a report in Arabic on your model, and read the terminology sheet on the approval page before you click Approve.",
        "t2": "<strong>The Arabic twin.</strong> Ask for an Arabic copy of a report you already have, and open it next to the original in Power BI Desktop.",
        "t3": "<strong>The EN-AR switch.</strong> Ask for one copy of a report with English and Arabic together (EN-AR), then press «العربية» on any page, and \"English\" to come back.",
        "t4": "<strong>The approval page.</strong> Compare its preview and its list of files with what Power BI Desktop opens, and tell us where they differ."
      },
      "how": {
        "title": "How it works",
        "s1": "<strong>Save as a project.</strong> In Power BI Desktop: File &gt; Save as &gt; Power BI project (.pbip).",
        "s2": "<strong>Ask Claude.</strong> For example: \"Read the model in Sales and suggest a report\".",
        "s3": "<strong>Open the new report</strong> in Power BI Desktop: it is a new .pbip next to your model."
      },
      "tools": {
        "title": "The 11 tools",
        "read_model": "Reads the tables, the columns with their types, the measures with their formats and the date tables. Changes nothing.",
        "suggest_fields": "Picks the measures and columns for each KPI card, chart, table and slicer.",
        "check_model_health": "The Model Health Check: a score and every finding, with fix scripts for you to review (never applied).",
        "plan_layout": "The exact position of every visual on the page, mirrored for right to left (a waterfall reads left to right, as Power BI draws it). Writes nothing.",
        "approve_plan": "Asks for your approval in DataArcus's approval window in your browser, with the plan and every file it writes (in an app that has its own approval prompt, that prompt asks instead): only your Approve lets a tool write, and no tool writes a file in your folder without an approved plan. (A program already running on your computer that controls your browser or mouse could still click it: see the privacy notes.)",
        "create_report": "A new report next to your model, every visual placed and bound to your fields.",
        "check_report": "Checks a report that already exists, offline: Microsoft's validator and the rules measured in Power BI Desktop. Changes nothing.",
        "read_report": "Reads a report you already have, one line per visual, before a redesign. Changes nothing.",
        "create_arabic_twin": "An Arabic, right-to-left copy of an existing report, next to it, with Arabic texts you approve; or one copy with the English and the Arabic pages and a button to switch. The original is never changed.",
        "generate_theme": "A Power BI report theme, exactly as the DataArcus Theme Generator makes it.",
        "add_gulf_calendar": "A Gulf date table (Hijri, Ramadan, Eid and the country's weekend) as a script for you to check and apply."
      },
      "run": {
        "title": "A real run",
        "intro": "Measured on 8 October 2026 with DataArcus 0.2.8, on a made-up home-goods sales model (Marsa Home):",
        "files": "91 files written, all new: 2 pages and 2 tooltip pages, 45 visuals.",
        "validator": "Microsoft's report validator: 0 errors, 0 warnings. (It checks that the files follow Microsoft's format, not that the report answers the right question.)",
        "model": "The model's files byte-identical before and after."
      },
      "safe": {
        "title": "What keeps it safe",
        "model": "It never changes your model and never writes over your files: every report is new, next to your model. The one file it replaces is its own answers file, and only after you approve.",
        "ask": "It writes only inside the one folder you choose (and a private check copy in your computer's temporary folder, deleted when the check ends).",
        "validator": "Its check_report tool checks any PBIR report offline with Microsoft's report validator.",
        "data": "It reads files on your machine to check and fingerprint them, and never returns data values from your model to Claude: what it sends is your model's structure (tables, columns, measures, formats) and, from a report, the texts typed in it: page names and short text boxes, and for the Arabic twin its titles too (a figure or a name typed there is sent too). What the AI app sees: <a href='https://github.com/Antnioo/DataArcus/blob/main/mcp/PRIVACY.md' class='text-accent' target='_blank' rel='noopener'>PRIVACY.md</a>."
      },
      "req": {
        "title": "Requirements and limits",
        "windows": "Windows only.",
        "desktop": "Power BI Desktop 2.159.883.0 (October 2026) or later: the reports use recent features that older versions lack.",
        "claude": "Claude Desktop.",
        "beta": "A public beta: the package is not code-signed yet, so check its SHA-256 (below and in the release notes) before you install it.",
        "large": "Models above about 50 tables are experimental."
      },
      "join": {
        "title": "Download and install",
        "next": "<ol class='mb-3'><li>Download <code>dataarcus-0.3.0.mcpb</code> from the <a href='https://github.com/Antnioo/dataarcus-releases/releases/tag/v0.3.0' class='text-accent'>0.3.0 release</a>.</li><li>Check its SHA-256 before you install it (<code>certutil -hashfile dataarcus-0.3.0.mcpb SHA256</code>): <code class='text-break'>aa23ace80d6777df5dcf47a0847ae8b96783034b2e1e0466625cae579704f9cb</code></li><li>With Claude Desktop installed, double-click the file and choose Install. Every step: <a href='https://github.com/Antnioo/DataArcus/blob/main/mcp/README.md' class='text-accent'>the install guide</a>.</li></ol>Questions, problems or feedback? Write to us here. No payment.",
        "name": "Name *",
        "email": "Email *",
        "model": "What is your model about? *",
        "linkedin": "LinkedIn (optional)",
        "button": "Send",
        "privacy": "What you send reaches our email through Web3Forms, only so we can reply: <a href='../privacy.html' class='text-accent'>Privacy</a>."
      }
    }
  },
  "ar": {
    "meta": {
      "title": "DataArcus لـ Power BI: نسخة تجريبية عامة",
      "description": "وكيل ذكاء اصطناعي في Claude Desktop يقرأ مشروع Power BI ويكتب بجانبه تقريرًا جديدًا كاملًا، بالعربية أو الإنجليزية. نسخة تجريبية عامة لنظام Windows.",
      "author": "داتا أركوس",
      "og:type": "website",
      "og:title": "DataArcus لـ Power BI: نسخة تجريبية عامة",
      "og:description": "وكيل ذكاء اصطناعي في Claude Desktop يقرأ مشروع Power BI ويكتب بجانبه تقريرًا جديدًا كاملًا، بالعربية أو الإنجليزية. نسخة تجريبية عامة لنظام Windows.",
      "og:url": "https://dataarcus.com/power-bi-mcp/",
      "og:site_name": "DataArcus",
      "og:image": "https://dataarcus.com/assets/img/og/home.jpg",
      "og:locale": "ar_AE",
      "twitter:card": "summary_large_image",
      "twitter:title": "DataArcus لـ Power BI: نسخة تجريبية عامة",
      "twitter:description": "وكيل ذكاء اصطناعي في Claude Desktop يقرأ مشروع Power BI ويكتب بجانبه تقريرًا جديدًا كاملًا، بالعربية أو الإنجليزية. نسخة تجريبية عامة لنظام Windows.",
      "twitter:image": "https://dataarcus.com/assets/img/og/home.jpg",
      "canonical": "https://dataarcus.com/power-bi-mcp/"
    },
    "beta": {
      "hero": {
        "badge": "نسخة تجريبية عامة",
        "title": "DataArcus لـ Power BI",
        "subtitle": "وكيل ذكاء اصطناعي في Claude Desktop يقرأ مشروع Power BI الخاص بك (PBIP مع نموذج TMDL) ويكتب بجانبه تقريرًا جديدًا كاملًا (PBIR)، بالإنجليزية أو بالعربية من اليمين إلى اليسار.",
        "button": "نزّل الإصدار 0.3.0",
        "how": "شاهد كيف يعمل",
        "facts": "مجاني خلال النسخة التجريبية. يعمل على Windows مع Power BI Desktop و Claude Desktop.",
        "ga": "Microsoft: <em>\"Power BI Desktop projects (PBIP) and Power BI enhanced report format (PBIR) are generally available.\"</em> أي أن مشاريع Power BI Desktop (PBIP) وصيغة التقارير المحسّنة (PBIR) متاحة للجميع. (<a href='https://learn.microsoft.com/power-bi/developer/projects/projects-external-editing' class='text-accent' target='_blank' rel='noopener'>Microsoft Learn</a>)"
      },
      "new": {
        "title": "الجديد في الإصدار 0.3.0",
        "version": "ما يضيفه الإصدار 0.3.0:",
        "l1": "<strong>تقارير عربية بلا عناوين إنجليزية.</strong> التقرير العربي المبني على نموذج بأسماء إنجليزية، والنسخة العربية من تقرير موجود، تظهر فيهما بالعربية العناوين ورؤوس الجداول والتلميحات والنصوص البديلة وتخطيط الهاتف. وقبل موافقتك تذكر الخطة كل حقل يبقى بالإنجليزية وسبب بقائه.",
        "l2": "<strong>قائمة مصطلحات عربية.</strong> لكل حقل اسم عربي واحد توافق عليه أنت، يُكتب في كل عنوان ورأس جدول ورأس مقسّم وتلميح ونص بديل. وتعرض صفحة الموافقة القائمة جنبًا إلى جنب: الإنجليزية والعربية.",
        "l3": "<strong>تقرير واحد باللغتين.</strong> تستطيع <code translate='no'>create_arabic_twin</code> أن تكتب نسخة باسم \"(EN-AR)\" فيها الصفحات الإنجليزية وما يقابلها بالعربية، وزر للتبديل بين اللغتين في كل صفحة يتسع له رأسها (وعلى الهاتف أيضًا حين يتسع له)، وتذكر الخطة كل صفحة تبقى دونه. ويبقى تقريرك الأصلي كما هو.",
        "l4": "<strong>مخطط الشلال والمخطط المركّب والمخططات المتعددة الصغيرة.</strong> عناصر Power BI المرئية نفسها (waterfall وcombo وsmall multiples)، حين تطلبها وتناسبها الحقول. وفي التقرير العربي يُقرأ مخطط الشلال من اليسار إلى اليمين كما يرسمه Power BI، وتبقى بقية الصفحة معكوسة.",
        "l5": "<strong>صفحة موافقة تستطيع مراجعتها.</strong> تعرض المعاينة كل عنوان كما سيُكتب في التقرير، وتعلّم العنوان بأنه مقطوع حيث تقول القاعدة التي قيست في Power BI Desktop إن Desktop يقطعه، وترسم كل مقسّم مع رأسه. وتسرد الصفحة كل ملف ستكتبه الخطة، مجمّعًا ومعدودًا.",
        "l6": "<strong>أشكال أكثر تختارها في الخطة.</strong> خطوط منحنية بنقطة عند كل قيمة، ومقسّمات بأزرار مستديرة (لحقل له من 2 إلى 6 قيم)، وخطوط شبكة منقّطة أو بلا خطوط، وبطاقات تنقلب، وأيقونات حالة تختلف في الشكل لا في اللون وحده، وصفحة تبدّل بين 2 إلى 5 مقاييس. البطاقات المنقلبة ومبدّل المقاييس وأيقونات الحالة المبنية على هدف تأتي مع نص برمجي للنموذج تطبّقه أنت في TMDL view: لا يغيّر DataArcus نموذجك.",
        "l7": "<strong>التواريخ والوحدات تُسأل ولا تُخمَّن.</strong> يسألك أي تاريخ يعتمد عليه التقرير (تاريخ الطلب أو تاريخ الشحن أو غيرهما)، وبأي تقويم (ميلادي أو هجري)، وفي صفحة رمضان أو العيد: سنة هجرية واحدة أم كل المواسم. ولا يتشارك مقياسان بوحدتين مختلفتين محورًا واحدًا، كالريال السعودي والدرهم أو النسبة والعدد: لكل منهما عنصر مرئي خاص به.",
        "l8": "<strong>تحديث Power BI لشهر أكتوبر 2026.</strong> تفحص <code translate='no'>check_report</code> التقارير وفق مخططات تقارير Microsoft لشهر سبتمبر 2026 وكتالوج العناصر المرئية الصادر في 19 أكتوبر.",
        "try": "جرّب هذه أولًا",
        "t1": "<strong>تقرير عربي.</strong> اطلب من Claude تقريرًا بالعربية على نموذجك، وراجع قائمة المصطلحات في صفحة الموافقة قبل أن تنقر Approve.",
        "t2": "<strong>النسخة العربية.</strong> اطلب نسخة عربية من تقرير لديك، وافتحها بجانب الأصل في Power BI Desktop.",
        "t3": "<strong>زر EN-AR.</strong> اطلب نسخة واحدة من تقريرك بالإنجليزية والعربية معًا (EN-AR)، ثم اضغط «العربية» في أي صفحة، و\"English\" للعودة.",
        "t4": "<strong>صفحة الموافقة.</strong> قارن معاينتها وقائمة ملفاتها بما يفتحه Power BI Desktop، وأخبرنا أين يختلفان."
      },
      "how": {
        "title": "كيف يعمل",
        "s1": "<strong>احفظ التقرير كمشروع.</strong> في Power BI Desktop: File &gt; Save as &gt; Power BI project (.pbip).",
        "s2": "<strong>اطلب من Claude.</strong> مثلًا: \"اقرأ النموذج في مجلد Sales واقترح تقريرًا\".",
        "s3": "<strong>افتح التقرير الجديد</strong> في Power BI Desktop: ملف .pbip جديد بجانب نموذجك."
      },
      "tools": {
        "title": "الأدوات: 11 أداة",
        "read_model": "تقرأ الجداول، والأعمدة بأنواعها، والمقاييس بتنسيقاتها، وجداول التاريخ. لا تغيّر شيئًا.",
        "suggest_fields": "تختار المقاييس والأعمدة لكل بطاقة مؤشر ومخطط وجدول ومقسّم.",
        "check_model_health": "فحص صحة النموذج: درجة وكل ملاحظة، مع نصوص إصلاح تراجعها أنت (لا تُطبَّق أبدًا).",
        "plan_layout": "الموضع الدقيق لكل عنصر مرئي في الصفحة، معكوسًا للاتجاه من اليمين إلى اليسار (ويُقرأ مخطط الشلال من اليسار إلى اليمين كما يرسمه Power BI). لا تكتب شيئًا.",
        "approve_plan": "تطلب موافقتك في نافذة الموافقة من DataArcus في متصفحك، وفيها الخطة وكل ملف ستكتبه (وفي تطبيق له نافذة موافقة خاصة به تسألك تلك النافذة بدلًا منها): لا تكتب أي أداة إلا بعد موافقتك، ولا تكتب أي أداة ملفًا في مجلدك دون خطة موافَق عليها. (يمكن لبرنامج يعمل على جهازك ويتحكم في المتصفح أو الفأرة أن ينقر عليها: راجع ملاحظات الخصوصية.)",
        "create_report": "تقرير جديد بجانب نموذجك، كل عنصر مرئي في مكانه ومربوط بحقولك.",
        "check_report": "تفحص تقريرًا موجودًا دون اتصال: مدقّق Microsoft والقواعد التي قيست في Power BI Desktop. لا تغيّر شيئًا.",
        "read_report": "تقرأ تقريرًا موجودًا لديك، سطرًا لكل عنصر مرئي، قبل إعادة تصميمه. لا تغيّر شيئًا.",
        "create_arabic_twin": "نسخة عربية من تقرير موجود، من اليمين إلى اليسار، بجانبه، بنصوص عربية توافق عليها أنت؛ أو نسخة واحدة فيها الصفحات الإنجليزية والعربية مع زر للتبديل بينهما. لا يتغيّر التقرير الأصلي أبدًا.",
        "generate_theme": "سمة لتقارير Power BI، تمامًا كما يصنعها مولّد السمات من DataArcus.",
        "add_gulf_calendar": "جدول تاريخ خليجي (الهجري ورمضان والعيد وعطلة نهاية الأسبوع في بلدك) كنص برمجي تراجعه وتطبّقه أنت."
      },
      "run": {
        "title": "تشغيل حقيقي",
        "intro": "قيس في 8 أكتوبر 2026 بالإصدار 0.2.8 من DataArcus، على نموذج مختلَق لمبيعات أدوات منزلية (Marsa Home):",
        "files": "كُتب 91 ملفًا، كلها جديدة: صفحتان وصفحتا تلميح، و45 عنصرًا مرئيًا.",
        "validator": "مدقّق التقارير من Microsoft: 0 أخطاء، 0 تحذيرات. (يتحقق من أن الملفات تتبع تنسيق Microsoft، لا من أن التقرير يجيب عن السؤال الصحيح.)",
        "model": "ملفات النموذج مطابقة بايتًا ببايت قبل التشغيل وبعده."
      },
      "safe": {
        "title": "ما الذي يجعله آمنًا",
        "model": "لا يغيّر نموذجك أبدًا ولا يكتب فوق ملفاتك: كل تقرير جديد، بجانب نموذجك. الملف الوحيد الذي يستبدله هو ملف إجاباته الخاص، وبعد موافقتك فقط.",
        "ask": "يكتب فقط داخل المجلد الذي تختاره (ونسخة فحص خاصة في المجلد المؤقت لجهازك، تُحذف عند انتهاء الفحص).",
        "validator": "تفحص أداة check_report أي تقرير بصيغة PBIR دون اتصال بمدقّق التقارير من Microsoft.",
        "data": "يقرأ الملفات على جهازك ليفحصها ويأخذ بصمتها، ولا يُرسل أي قيمة من بيانات نموذجك إلى Claude أبدًا: ما يرسله هو بنية نموذجك (الجداول والأعمدة والمقاييس والتنسيقات)، ومن التقرير النصوص المكتوبة فيه: أسماء الصفحات ومربعات النص القصيرة، وعناوينه أيضًا عند إنشاء النسخة العربية (فإن كُتب فيها رقم أو اسم يُرسل أيضًا). ما يراه تطبيق الذكاء الاصطناعي: <a href='https://github.com/Antnioo/DataArcus/blob/main/mcp/PRIVACY.md' class='text-accent' target='_blank' rel='noopener'>PRIVACY.md</a>."
      },
      "req": {
        "title": "المتطلبات والحدود",
        "windows": "Windows فقط.",
        "desktop": "Power BI Desktop بالإصدار 2.159.883.0 (أكتوبر 2026) أو أحدث: التقارير تستخدم ميزات حديثة لا توجد في الإصدارات الأقدم.",
        "claude": "Claude Desktop.",
        "beta": "نسخة تجريبية عامة: الحزمة غير موقّعة بعد، فتحقّق من بصمتها SHA-256 (أدناه وفي ملاحظات الإصدار) قبل تثبيتها.",
        "large": "النماذج التي تتجاوز نحو 50 جدولًا تجريبية."
      },
      "join": {
        "title": "التنزيل والتثبيت",
        "next": "<ol class='mb-3'><li>نزّل <code>dataarcus-0.3.0.mcpb</code> من <a href='https://github.com/Antnioo/dataarcus-releases/releases/tag/v0.3.0' class='text-accent'>صفحة الإصدار 0.3.0</a>.</li><li>تحقّق من بصمته SHA-256 قبل تثبيته (<code>certutil -hashfile dataarcus-0.3.0.mcpb SHA256</code>): <code class='text-break'>aa23ace80d6777df5dcf47a0847ae8b96783034b2e1e0466625cae579704f9cb</code></li><li>بعد تثبيت Claude Desktop، انقر الملف نقرًا مزدوجًا واختر Install. كل الخطوات: <a href='https://github.com/Antnioo/DataArcus/blob/main/mcp/README.md' class='text-accent'>دليل التثبيت</a>.</li></ol>أسئلة أو مشكلات أو ملاحظات؟ اكتب لنا هنا. دون أي دفع.",
        "name": "الاسم *",
        "email": "البريد الإلكتروني *",
        "model": "عن ماذا يتحدث نموذجك؟ *",
        "linkedin": "LinkedIn (اختياري)",
        "button": "أرسل",
        "privacy": "ما ترسله يصل إلى بريدنا عبر Web3Forms، فقط لنرد عليك: <a href='../privacy.html' class='text-accent'>الخصوصية</a>."
      }
    }
  }
};
