// assets/js/translations/blog.js
window.blogTranslations = {
  en: {
    attrs: {
      search: "Search posts"
    },
    // Meta (for inclusion in blog.html if needed)
    meta: {
      title: "The Power BI Playbook: Guides for Gulf Teams - DataArcus",
      description: "Practical Power BI guides from real work for teams in the Gulf: Gulf calendars and Ramadan, Copilot-ready models, report design, DAX and licensing.",
      keywords: "Power BI blog, Power BI Gulf, Hijri calendar Power BI, Ramadan sales Power BI, Copilot Power BI, Power BI report design, DAX, Power BI licensing, DataArcus blog",
      author: "DataArcus",
      "og:type": "website",
      "og:title": "The Power BI Playbook: Guides for Gulf Teams - DataArcus",
      "og:description": "Practical Power BI guides from real work for teams in the Gulf: Gulf calendars and Ramadan, Copilot-ready models, report design, DAX and licensing.",
      "og:url": "https://dataarcus.com/blog.html",
      "og:site_name": "DataArcus",
      "og:image": "https://dataarcus.com/assets/img/og/blog.jpg",
      "og:image:alt": "The DataArcus logo showing animated data bars and the brand name.",
      "og:locale": "en_US",
      "twitter:card": "summary_large_image",
      "twitter:title": "The Power BI Playbook: Guides for Gulf Teams - DataArcus",
      "twitter:description": "Practical Power BI guides from real work for teams in the Gulf: Gulf calendars and Ramadan, Copilot-ready models, report design, DAX and licensing.",
      "twitter:image": "https://dataarcus.com/assets/img/og/blog.jpg",
      "twitter:image:alt": "The DataArcus logo showing animated data bars and the brand name.",
      canonical: "https://dataarcus.com/blog.html",
    },
    
    // Header
    header: {
      title: "The Power BI Playbook",
      subtitle: "Practical Power BI guides from real work for teams in the Gulf: Gulf calendars and Ramadan, Copilot-ready models, report design, DAX and licensing."
    },

    // Filters / Search
    filters: {
      all: "All",
      gulf: "Gulf & Ramadan",
      ai: "Copilot & AI",
      design: "Report design",
      modelling: "Modelling & DAX",
      strategy: "Strategy"
    },
    // the topic on each card: the same words as its filter, in capitals
    topics: {
      gulf: "GULF & RAMADAN",
      ai: "COPILOT & AI",
      design: "REPORT DESIGN",
      modelling: "MODELLING & DAX",
      strategy: "STRATEGY"
    },
    blog: {
      sectionTitle: "Latest from the Playbook",
      sectionSubtitle: "Newest first. Pick a topic or search.",
      searchPlaceholder: "Search playbooks…",
      noResultsTitle: "No posts found",
      noResultsSubtext: "Try adjusting your search terms or filters."
    },

    // Posts
    posts: {
      readyForArabic: {
        badge: "ARABIC REPORTS",
        title: "Is Your Power BI Report Ready for Arabic? 19 Things to Check",
        date: "October 25, 2026",
        excerpt: "What goes wrong when a report built in English is read in Arabic, kind by kind, and the fix for each: DataArcus through your approval, a Desktop setting, or plainly no setting.",
        button: "Read Playbook"
      },
      customVisualChecks: {
        badge: "AI AGENTS",
        title: "Before an AI Builds Your Power BI Custom Visual: 4 Checks",
        date: "October 23, 2026",
        excerpt: "AI agents now work with Power BI custom visuals, and some write new ones. Four checks from Microsoft's own pages before you rely on one at work: the admin settings, certification, Desktop vs the service, and what an uncertified visual can't do.",
        button: "Read Playbook"
      },
      bestPracticeExceptions: {
        badge: "BEST PRACTICE",
        title: "We Checked 23 Power BI Models Against Microsoft's Rules. Our Own Tool Was Wrong 206 Times.",
        date: "October 17, 2026",
        excerpt: "We checked 23 Power BI models, 18 of them Microsoft's, against Microsoft's guidance. Our own tool was wrong 206 times. Five cases where a best-practice rule does not apply, with Microsoft's own words.",
        button: "Read Playbook"
      },
      gulfCalendar: {"badge": "GULF CALENDAR", "title": "A Gulf Calendar in Power BI: Hijri Dates, Ramadan, Eid and the Right Weekend", "date": "October 3, 2026", "excerpt": "Ramadan and Eid move, and the UAE changed its weekend in 2022. One DAX calendar with Hijri dates, announced Ramadan and Eid days, each country's weekend, and an Eid window measure.", "button": "Read Playbook"},
      aiReady: {"badge": "COPILOT & AI", "title": "Is Your Power BI Model Ready for AI? A 7-Point Check", "date": "October 2, 2026", "excerpt": "Copilot, data agents and the new Power BI apps all answer from your semantic model. The 7 things to fix first, from names and descriptions to Prep data for AI.", "button": "Read Playbook"},
      reportStyles: {
        badge: "REPORT DESIGN",
        title: "One Design Doesn’t Fit All: 7 Power BI Report Styles",
        date: "September 29, 2026",
        excerpt: "Executive, sales, finance, marketing, operations, HR and customer service reports each answer a different question. The 7 styles with example pages, and a 3-question quiz to pick yours.",
        button: "Read Playbook"
      },
      reportRedesign: {
        badge: "REPORT DESIGN",
        title: "Same Visuals, New Design: How We Redesigned a Power BI Report in 5 Minutes",
        date: "September 28, 2026",
        excerpt: "A leads report with the right visuals but loud colours and a messy layout. The five design changes that fixed it, and how to make them in 5 minutes with a free tool.",
        button: "Read Playbook"
      },
      modelHealth: {
        badge: "BEST PRACTICE",
        title: "We Ran a Health Check on a Microsoft Power BI Sample. It Scored 85.",
        date: "September 25, 2026",
        excerpt: "Microsoft's public COVID-19 sample, checked in under a second: a quarter of its columns unused, two bookmarks pointing at a deleted column and auto date/time left on. What we found and how to check yours.",
        button: "Read Playbook"
      },
      ramadanSales: {
        badge: "POWER BI",
        title: "Ramadan Sales in Power BI: Compare This Ramadan With Last Ramadan",
        date: "September 23, 2026",
        excerpt: "SAMEPERIODLASTYEAR compares March with March, but Ramadan moved 11 days. The Hijri calendar and the one DAX measure that line up every Ramadan day by day.",
        button: "Read Playbook"
      },
      licensingGuide: {
        badge: "STRATEGY",
        title: "Power BI Pro, Premium Per User or Fabric: Which License Do You Actually Need?",
        date: "September 23, 2026",
        excerpt: "One number decides your Power BI license: how many people only view reports. Current prices, the F64 break-even point and a worked example.",
        button: "Read Playbook"
      },
      journeyAttribution: {
        badge: "DATA ENGINEERING",
        title: "Resolve Once, Hydrate Many: A DAX Pattern for Lead Attribution",
        date: "September 1, 2026",
        excerpt: "Why matching the same lead five times produces disagreeing KPIs, and the single-resolution DAX pattern that matched every lead exactly before replacing scattered join logic.",
        button: "Read Playbook"
      },
      evm: {
        badge: "PROJECT ANALYTICS",
        title: "Beyond \"Traffic Lights\": How Earned Value Management (EVM) Predicts Project Risk",
        date: "December 10, 2025",
        excerpt: "Most project dashboards tell you what happened yesterday. Learn how to use CPI and SPI to mathematically forecast tomorrow's delays and budget overruns.",
        button: "Read Playbook"
      },
      shopify: {
        badge: "STRATEGY",
        title: "The Ultimate Shopify Dashboard: How to Build a Single Source of Truth in Power BI",
        date: "October 04, 2025",
        excerpt: "A playbook for e-commerce leaders on building a single source of truth from Shopify data in Power BI to track sales, marketing ROI, and customer behavior.",
        button: "Read Playbook"
      },
      kpis: {
        badge: "STRATEGY",
        title: "5 Marketing KPIs Your E-commerce Store is Ignoring",
        date: "September 15, 2025",
        excerpt: "Our new playbook dives into the advanced marketing analytics, including Customer Acquisition Cost (CAC) and Marketing Efficiency Ratio (MER), that drive profitable growth.",
        button: "Read Playbook"
      },
      etlpq: {
        badge: "DATA ENGINEERING",
        title: "ETL vs Power Query: The Right Data Strategy for Your E-commerce Store",
        date: "September 4, 2025",
        excerpt: "A practical framework for deciding when to use engineered pipelines for your Shopify/backend data vs. keeping logic in Power Query for marketing analytics.",
        button: "Read Playbook"
      },
      clv: {
        badge: "STRATEGY",
        title: "The One Metric That Defines Your E-commerce Future (And How to Track It)",
        date: "August 23, 2025",
        excerpt: "Why Customer Lifetime Value (not just revenue) is the north-star KPI for e-commerce growth, and a concrete path to model it in Power BI.",
        button: "Read Playbook"
      }
    },

    // Subscribe / CTA
    subscribe: {
      title: "Get the Next Power BI Guide",
      badge: "NO SPAM",
      copy: "New guides as they come out: Power BI for teams in the Gulf, from real work. No fluff, just what works.",
      button: "Subscribe for Free"
    }
  },

  ar: {
    attrs: {
      search: "ابحث في المقالات"
    },
    // Meta (AR)
    meta: {
      title: "دليل Power BI: أدلة لفرق الخليج - داتا أركوس",
      description: "أدلة Power BI عملية من عمل حقيقي لفرق الخليج: التقويم الخليجي ورمضان، نماذج جاهزة لـ Copilot، تصميم التقارير، DAX والتراخيص.",
      keywords: "مدونة Power BI, Power BI الخليج, التقويم الهجري في Power BI, مبيعات رمضان في Power BI, Copilot في Power BI, تصميم تقارير Power BI, DAX, تراخيص Power BI, مدونة DataArcus",
      author: "داتا أركوس",
      "og:type": "website",
      "og:title": "دليل Power BI: أدلة لفرق الخليج - داتا أركوس",
      "og:description": "أدلة Power BI عملية من عمل حقيقي لفرق الخليج: التقويم الخليجي ورمضان، نماذج جاهزة لـ Copilot، تصميم التقارير، DAX والتراخيص.",
      "og:url": "https://dataarcus.com/blog.html",
      "og:site_name": "داتا أركوس",
      "og:image": "https://dataarcus.com/assets/img/og/blog.jpg",
      "og:image:alt": "شعار داتا أركوس مع أعمدة بيانات متحركة واسم العلامة التجارية.",
      "og:locale": "ar_EG",
      "twitter:card": "summary_large_image",
      "twitter:title": "دليل Power BI: أدلة لفرق الخليج - داتا أركوس",
      "twitter:description": "أدلة Power BI عملية من عمل حقيقي لفرق الخليج: التقويم الخليجي ورمضان، نماذج جاهزة لـ Copilot، تصميم التقارير، DAX والتراخيص.",
      "twitter:image": "https://dataarcus.com/assets/img/og/blog.jpg",
      "twitter:image:alt": "شعار داتا أركوس مع أعمدة بيانات متحركة واسم العلامة التجارية.",
      canonical: "https://dataarcus.com/blog.html",
    },

    // Header (AR)
    header: {
      title: "دليل Power BI",
      subtitle: "أدلة Power BI عملية من عمل حقيقي لفرق الخليج: التقويم الخليجي ورمضان، نماذج جاهزة لـ Copilot، تصميم التقارير، DAX والتراخيص."
    },

    // Filters / Search (AR)
    filters: {
      all: "الكل",
      gulf: "الخليج ورمضان",
      ai: "Copilot والذكاء الاصطناعي",
      design: "تصميم التقارير",
      modelling: "النمذجة و DAX",
      strategy: "استراتيجية"
    },
    topics: {
      gulf: "الخليج ورمضان",
      ai: "Copilot والذكاء الاصطناعي",
      design: "تصميم التقارير",
      modelling: "النمذجة و DAX",
      strategy: "استراتيجية"
    },
    blog: {
      sectionTitle: "أحدث الأدلة الإرشادية",
      sectionSubtitle: "الأحدث أولاً. اختر موضوعًا أو ابحث.",
      searchPlaceholder: "ابحث في الأدلة…",
      noResultsTitle: "لم يتم العثور على مقالات",
      noResultsSubtext: "حاول تعديل كلمات البحث أو الفلاتر."
    },

    // Posts (AR)
    posts: {
      readyForArabic: {
        badge: "التقارير العربية",
        title: "هل تقرير Power BI الخاص بك جاهز للعربية؟ 19 أمرًا تفحصها",
        date: "25 أكتوبر 2026",
        excerpt: "ما الذي يختل حين يُقرأ تقرير مبني بالإنجليزية بالعربية، نوعًا نوعًا، وعلاج كل نوع: DataArcus بموافقتك، أو إعداد في Desktop، أو لا إعداد له بوضوح.",
        button: "اقرأ الدليل"
      },
      customVisualChecks: {
        badge: "وكلاء الذكاء الاصطناعي",
        title: "قبل أن يبني الذكاء الاصطناعي مرئيًا مخصصًا في Power BI: أربعة فحوص",
        date: "23 أكتوبر 2026",
        excerpt: "صار وكلاء الذكاء الاصطناعي يتعاملون مع مرئيات Power BI المخصصة، وبعضهم يكتب مرئيات جديدة. أربعة فحوص من صفحات Microsoft قبل أن تعتمد على واحد منها في العمل: إعدادات المسؤول، والاعتماد، وDesktop مقابل الخدمة، وما لا يستطيعه المرئي غير المعتمد.",
        button: "اقرأ الدليل"
      },
      bestPracticeExceptions: {
        badge: "أفضل الممارسات",
        title: "فحصنا 23 نموذج Power BI مقابل قواعد Microsoft. أخطأت أداتنا نفسها 206 مرات.",
        date: "17 أكتوبر 2026",
        excerpt: "فحصنا 23 نموذج Power BI، منها 18 من Microsoft، مقابل إرشادات Microsoft. أخطأت أداتنا نفسها 206 مرات. خمس حالات لا تنطبق فيها قاعدة أفضل الممارسات، بكلمات Microsoft نفسها.",
        button: "اقرأ الدليل"
      },
      gulfCalendar: {"badge": "التقويم الخليجي", "title": "تقويم خليجي في Power BI: التاريخ الهجري ورمضان والعيد والعطلة الصحيحة", "date": "3 أكتوبر 2026", "excerpt": "رمضان والعيد يتحركان، والإمارات غيّرت عطلتها في 2022. تقويم DAX واحد بالتاريخ الهجري، ومواعيد رمضان والعيد المعلنة، وعطلة كل دولة، ومقياس لفترة العيد.", "button": "اقرأ الدليل"},
      aiReady: {"badge": "Copilot والذكاء الاصطناعي", "title": "هل نموذج Power BI جاهز للذكاء الاصطناعي؟ فحص من 7 نقاط", "date": "2 أكتوبر 2026", "excerpt": "Copilot ووكلاء البيانات وتطبيقات Power BI الجديدة كلها تجيب من نموذجك الدلالي. سبعة أمور تصلحها أولًا، من الأسماء والأوصاف إلى Prep data for AI.", "button": "اقرأ الدليل"},
      reportStyles: {
        badge: "تصميم التقارير",
        title: "تصميم واحد لا يناسب الجميع: 7 أنماط لتقارير Power BI",
        date: "29 سبتمبر 2026",
        excerpt: "تقارير الإدارة والمبيعات والمالية والتسويق والعمليات والموارد البشرية وخدمة العملاء تجيب كل منها عن سؤال مختلف. الأنماط السبعة بصفحات أمثلة، واختبار من 3 أسئلة لاختيار نمطك.",
        button: "اقرأ الدليل"
      },
      reportRedesign: {
        badge: "تصميم التقارير",
        title: "نفس العناصر، تصميم جديد: كيف أعدنا تصميم تقرير Power BI في 5 دقائق",
        date: "28 سبتمبر 2026",
        excerpt: "تقرير عملاء محتملين بالعناصر الصحيحة لكن بألوان صاخبة وتخطيط فوضوي. خمسة تغييرات في التصميم أصلحته، وكيف تطبقها في 5 دقائق بأداة مجانية.",
        button: "اقرأ الدليل"
      },
      modelHealth: {
        badge: "أفضل الممارسات",
        title: "فحصنا صحة نموذج Power BI تجريبي من Microsoft. النتيجة: 85 من 100.",
        date: "25 سبتمبر 2026",
        excerpt: "نموذج COVID-19 التجريبي العام من Microsoft فُحص في أقل من ثانية: ربع الأعمدة غير مستخدمة، وإشارتان مرجعيتان تشيران إلى عمود محذوف، وخيار Auto date/time مفعّل. هذا ما وجدناه وكيف تفحص نموذجك.",
        button: "اقرأ الدليل"
      },
      ramadanSales: {
        badge: "Power BI",
        title: "مبيعات رمضان في Power BI: قارن رمضان هذا العام برمضان الماضي",
        date: "23 سبتمبر 2026",
        excerpt: "تقارن SAMEPERIODLASTYEAR مارس بمارس، لكن رمضان تحرّك 11 يومًا. التقويم الهجري ومقياس DAX الذي يطابق كل رمضان يومًا بيوم.",
        button: "اقرأ الدليل"
      },
      licensingGuide: {
        badge: "استراتيجية",
        title: "Power BI Pro أم Premium Per User أم Fabric: أي ترخيص تحتاجه فعلًا؟",
        date: "23 سبتمبر 2026",
        excerpt: "رقم واحد يحسم ترخيص Power BI: عدد من يشاهدون التقارير فقط. الأسعار الحالية ونقطة التعادل لـ F64 ومثال عملي.",
        button: "اقرأ الدليل"
      },
      journeyAttribution: {
        badge: "هندسة البيانات",
        title: "حلّ مرة واحدة، غذِّ كل مكان: نمط DAX لعزو العملاء المحتملين",
        date: "1 سبتمبر 2026",
        excerpt: "لماذا تُنتج مطابقة نفس العميل المحتمل خمس مرات مؤشرات أداء متضاربة، ونمط DAX الذي وثّق تطابق كل عميل محتمل قبل استبدال منطق الربط المتناثر.",
        button: "اقرأ الدليل"
      },
      evm: {
        badge: "تحليلات المشاريع",
        title: "ما وراء \"إشارات المرور\": كيف تتنبأ إدارة القيمة المكتسبة (EVM) بمخاطر المشروع",
        date: "10 ديسمبر 2025",
        excerpt: "تخبرك معظم لوحات المعلومات بما حدث بالأمس. تعلم كيف تستخدم CPI و SPI للتنبؤ رياضيًا بالتأخيرات وتجاوز الميزانية قبل حدوثها.",
        button: "اقرأ الدليل"
      },
      shopify: {
        badge: "استراتيجية",
        title: "دليل لقادة التجارة الإلكترونية حول بناء مصدر موحد للحقيقة من بيانات Shopify في Power BI.",
        date: "04 اكتوبر 2025",
        excerpt: "دليل لقادة التجارة الإلكترونية حول بناء مصدر موحد للحقيقة من بيانات Shopify في Power BI لتتبع المبيعات وعائد الاستثمار التسويقي وسلوك العملاء.",
        button: "اقرأ الدليل"
      },
      kpis: {
        badge: "استراتيجية",
        title: "5 مؤشرات أداء تسويقية يتجاهلها متجرك الإلكتروني",
        date: "15 سبتمبر 2025",
        excerpt: "يتعمق دليلنا الجديد في تحليلات التسويق المتقدمة، بما في ذلك تكلفة اكتساب العملاء (CAC) ونسبة كفاءة التسويق (MER)، التي تدفع النمو المربح.",
        button: "اقرأ الدليل"
      },
      etlpq: {
        badge: "هندسة البيانات",
        title: "ETL مقابل Power Query: استراتيجية البيانات الصحيحة لمتجرك الإلكتروني",
        date: "4 سبتمبر 2025",
        excerpt: "إطار عملي لاتخاذ قرار بشأن متى تستخدم خطوط البيانات الهندسية لبيانات Shopify ومتى تحتفظ بالمنطق في Power Query لتحليلات التسويق.",
        button: "اقرأ الدليل"
      },
      clv: {
        badge: "استراتيجية",
        title: "المقياس الوحيد الذي يحدد مستقبل تجارتك الإلكترونية (وكيفية تتبعه)",
        date: "23 أغسطس 2025",
        excerpt: "لماذا تُعد القيمة الدائمة للعميل (وليس فقط الإيرادات) هي مؤشر الأداء الرئيسي لنمو التجارة الإلكترونية، ومسار عملي لنمذجتها في Power BI.",
        button: "اقرأ الدليل"
      }
    },

    // Subscribe / CTA (AR)
    subscribe: {
      title: "احصل على دليل Power BI القادم",
      badge: "لا رسائل مزعجة",
      copy: "أدلة جديدة عند صدورها: Power BI لفرق الخليج، من عمل حقيقي. لا حشو، فقط ما ينفع.",
      button: "اشترك مجانًا"
    }
  }
};