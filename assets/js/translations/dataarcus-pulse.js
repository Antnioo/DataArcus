// translations/dataarcus-pulse.js - DataArcus Pulse (Automotive CRM Intelligence) Showcase
window.dataarcusPulseTranslations = {
  en: {
    // Page Meta
    meta: {
      title: "DataArcus Pulse - Automotive CRM Intelligence in Power BI - DataArcus",
      description:
        "54K leads, 113K calls, 72K journeys: a production-grade automotive CRM dashboard in Power BI with 410 DAX measures and PII-safe anonymization.",
      keywords:
        "Automotive CRM analytics, dealership lead management, Power BI call center, lead qualification, Keyloop analytics, DAX semantic model, data anonymization, DataArcus",
      author: "DataArcus",
      "og:title": "DataArcus Pulse: Automotive CRM Intelligence",
      "og:description":
        "From raw lead forms and call logs to a single source of truth. A 12-month, production-grade dealership CRM model, fully anonymized for public demo."
    },

    // Page Header
    header: {
      badge: "PRODUCTION-GRADE · ANONYMIZED",
      title: "Showcase: DataArcus Pulse",
      subtitle:
        "An automotive CRM command center built on twelve months of real dealership operations: every lead form, every call, every enquiry and every invoice resolved into one semantic model, then fully anonymized for public demonstration."
    },

    // Stats Row
    stats: [
      "Lead Submissions",
      "Logged Calls",
      "Resolved Call Journeys",
      "Documented DAX Measures"
    ],

    // Case Study Introduction
    intro: {
      challenge: {
        title: "The Dealership CRM Challenge",
        content:
          "A multi-brand dealership receives thousands of digital leads a month from Meta and Google campaigns. Those leads are called by a CRM team, handed to sales executives as enquiries in the dealer management system, routed to sub-dealers in other emirates, or declined. Each step lives in a different system: lead sheets, call logs, SE task exports, sales invoices. Nobody could answer the simplest question: of the leads we paid for, how many did we actually reach, qualify, and sell?"
      },
      skills: {
        title: "What Makes This Different",
        content:
          "This is not a tutorial dataset. It is the anonymized twin of a live model that a CRM team runs its day on.",
        list: [
          "<strong>Journey Resolution Engine:</strong> calls are clustered into journeys per customer and each lead is resolved once to a single journey key; every downstream status is a thin read off that key rather than an independent re-match.",
          "<strong>Daily Pacing & Forecasting:</strong> a run-rate engine that sets each agent's target for today and tomorrow from a frozen through-yesterday snapshot, with 7- and 14-day median projection bands.",
          "<strong>Fair Attribution:</strong> invoices attributed back to the CRM agent who last touched the journey, validated 100% against the sales executive of record, with an explicit Attribution Gap measure for broken enquiry chains.",
          "<strong>PII-Safe by Construction:</strong> a Power Query anonymization layer that pseudonymizes customers, staff, brands, campaigns and task codes after all real-data matching has run, so relationships survive and identities do not."
        ]
      }
    },

    // Dashboard Features
    features: {
      title: "Key Features & Technologies",
      tags: [
        "Microsoft Fabric Lakehouse",
        "Advanced DAX (410 measures)",
        "Power Query Anonymization",
        "Journey Clustering",
        "Run-Rate Forecasting",
        "Period-Aware Time Intelligence",
        "Dual Calendars",
        "Wilson Score Ranking",
        "Keyloop DMS"
      ],
      note:
        "Fully interactive. All customers, staff, brands, branches, campaigns and task codes are pseudonymized (Brand 01, Agent 07, TC-25...). Counts, rates and timings are the real production figures for the September to August window."
    },

    // Capabilities Section
    capabilities: {
      title: "Deep-Dive Analysis by Page",
      subtitle:
        "Built for the CRM manager, the sales director and the agent on the phone, each with their own view of the same truth.",
      list: [
        "<strong>Executive Overview:</strong> total leads, qualified, sub-dealer, invoiced and retail sales with month-over-month arrows on every KPI card. Every comparison is period-aware: select a month and it compares to last month; select a quarter and it compares to last quarter.",
        "<strong>Lead Source Report:</strong> leads, qualification tiers (Qualified / + Sub Dealer / + Unqualified) and decline reasons by campaign, ad set and lead source bucket, with a three-tier qualification taxonomy so marketing and CRM finally count the same thing.",
        "<strong>Agent Performance:</strong> calls made, connected rate, qualified rate, average journey duration, open retries and invoiced attribution per agent, colour-coded against team thresholds and trended month-over-month.",
        "<strong>Journey Intelligence:</strong> how many calls it takes to resolve a lead, percentage resolved on the first call, average lag from lead to first contact, and the age of leads never contacted.",
        "<strong>Qualification Pacing & Workload Forecast:</strong> a live \"are we on track\" engine. Last month's conversion rate becomes this month's target; the gap is spread across agents by fair share; each agent sees a fixed plan for today and a projected requirement for tomorrow that accounts for retry backlog, new-lead intake and expected inbound interruptions.",
        "<strong>Sales & Attribution:</strong> CRM-attributed versus walk-in sales, sales executive conversion and enquiry ageing, top closer by branch, and days from lead to invoice, tied back to the originating campaign."
      ]
    },

    // Engineering Notes
    engineering: {
      title: "Engineering Notes",
      subtitle: "The parts of this project that do not show up in a screenshot.",
      items: [
        {
          title: "Resolve Once, Hydrate Many",
          desc:
            "Lead Status used to be a 150-line independent matching engine, and so was Terminal Reason. Both were rebuilt as thin wrappers reading off a single Matched Journey Key with outcome-priority tie-breaking. Validated row-for-row against the old logic (54,403 of 54,403 exact) before going live."
        },
        {
          title: "Anonymization That Survived an Audit",
          desc:
            "Fourteen mapping expressions and two helper functions pseudonymize every identifier at the end of each table's M partition. A final sweep of calculated-column expressions caught a hidden column that had bypassed the mapping and two measures hard-coding real names as SWITCH keys. Both fixed; zero real identifiers remain outside the sealed raw tables."
        },
        {
          title: "Two Calendars, One Answer",
          desc:
            "Leads are dated by submission, journeys by last activity. Every fact table relates to both a submission Calendar and a Last Activity calendar, and every time-intelligence measure detects which one the viewer filtered so KPI cards never silently ignore a slicer."
        },
        {
          title: "Measures as Documentation",
          desc:
            "All 410 measures carry a written description of what they count, what they exclude and why, including the date and reason of every fix. Each KPI follows one pattern: base value, period-aware last-period sibling, MoM change, arrow text, and a colour measure for conditional formatting."
        }
      ]
    },

    // Explore More Section
    exploreMore: {
      title: "Explore More Showcases",
      subtitle: "See our other enterprise-grade solutions.",
      button: "View Portfolio"
    },

    // Final CTA
    finalCta: {
      title: "Running a dealership or a call center on spreadsheets?",
      subtitle:
        "We connect your lead sources, call logs and DMS into one model your team can act on every morning. Let's start with your data.",
      button: "Book a Strategy Call"
    }
  },

  ar: {
    // Page Meta
    meta: {
      title: "داتا أركوس بالس - ذكاء إدارة علاقات العملاء للسيارات في Power BI - داتا أركوس",
      description:
        "مركز قيادة لإدارة علاقات العملاء في قطاع السيارات بمستوى الإنتاج: 54 ألف عميل محتمل، 113 ألف مكالمة و72 ألف رحلة اتصال في نموذج دلالي واحد يضم 410 مقياس DAX، وأهداف وتيرة يومية، وخط أنابيب إخفاء هوية آمن للبيانات الشخصية.",
      keywords:
        "تحليلات CRM للسيارات, إدارة العملاء المحتملين للوكالات, Power BI مركز اتصال, تأهيل العملاء المحتملين, تحليلات Keyloop, نموذج دلالي DAX, إخفاء هوية البيانات, داتا أركوس",
      author: "داتا أركوس",
      "og:title": "داتا أركوس بالس: ذكاء إدارة علاقات العملاء للسيارات",
      "og:description":
        "من نماذج العملاء المحتملين وسجلات المكالمات الخام إلى مصدر واحد للحقيقة. نموذج CRM لوكالة سيارات على مدار 12 شهرًا بمستوى الإنتاج، مُخفى الهوية بالكامل للعرض العام."
    },

    // Page Header
    header: {
      badge: "بمستوى الإنتاج · مُخفى الهوية",
      title: "نموذج: داتا أركوس بالس",
      subtitle:
        "مركز قيادة لإدارة علاقات العملاء في قطاع السيارات مبني على اثني عشر شهرًا من عمليات وكالة حقيقية: كل نموذج عميل محتمل، كل مكالمة، كل استفسار وكل فاتورة تم حلها في نموذج دلالي واحد، ثم إخفاء هويتها بالكامل للعرض العام."
    },

    // Stats Row
    stats: [
      "طلبات العملاء المحتملين",
      "المكالمات المسجلة",
      "رحلات الاتصال المحلولة",
      "مقاييس DAX الموثقة"
    ],

    // Case Study Introduction
    intro: {
      challenge: {
        title: "تحدي CRM في وكالات السيارات",
        content:
          "تستقبل وكالة متعددة العلامات التجارية آلاف العملاء المحتملين الرقميين شهريًا من حملات Meta وGoogle. يتصل فريق CRM بهؤلاء العملاء، ثم يُحالون إلى مندوبي المبيعات كاستفسارات في نظام إدارة الوكالة، أو يوجَّهون إلى وكلاء فرعيين في إمارات أخرى، أو يُرفضون. كل خطوة تعيش في نظام مختلف: جداول العملاء المحتملين، سجلات المكالمات، تصديرات مهام مندوبي المبيعات، فواتير المبيعات. لم يستطع أحد الإجابة على أبسط سؤال: من بين العملاء المحتملين الذين دفعنا ثمنهم، كم منهم وصلنا إليه فعلًا وأهّلناه وبعنا له؟"
      },
      skills: {
        title: "ما الذي يميز هذا المشروع",
        content:
          "هذه ليست مجموعة بيانات تعليمية. إنها التوأم مُخفى الهوية لنموذج حي يدير به فريق CRM يومه.",
        list: [
          "<strong>محرك حل الرحلات:</strong> تُجمَّع المكالمات في رحلات لكل عميل، ويُحل كل عميل محتمل مرة واحدة إلى مفتاح رحلة واحد؛ كل حالة لاحقة هي قراءة خفيفة من ذلك المفتاح بدلًا من إعادة مطابقة مستقلة.",
          "<strong>الوتيرة اليومية والتنبؤ:</strong> محرك معدل إنجاز يحدد هدف كل وكيل لليوم والغد من لقطة مجمّدة حتى الأمس، مع نطاقات إسقاط بوسيط 7 و14 يومًا.",
          "<strong>إسناد عادل:</strong> تُنسب الفواتير إلى وكيل CRM الذي تعامل أخيرًا مع الرحلة، مع تحقق بنسبة 100% مقابل مندوب المبيعات المسجل، ومقياس صريح لفجوة الإسناد لسلاسل الاستفسار المكسورة.",
          "<strong>آمن للبيانات الشخصية بالتصميم:</strong> طبقة إخفاء هوية في Power Query تستبدل العملاء والموظفين والعلامات التجارية والحملات ورموز المهام بأسماء مستعارة بعد اكتمال كل المطابقة على البيانات الحقيقية، فتبقى العلاقات وتختفي الهويات."
        ]
      }
    },

    // Dashboard Features
    features: {
      title: "أهم الميزات والتقنيات",
      tags: [
        "Microsoft Fabric Lakehouse",
        "DAX متقدم (410 مقياس)",
        "إخفاء الهوية في Power Query",
        "تجميع الرحلات",
        "تنبؤ معدل الإنجاز",
        "ذكاء زمني واعٍ بالفترة",
        "تقويمان مزدوجان",
        "ترتيب Wilson Score",
        "نظام Keyloop DMS"
      ],
      note:
        "تفاعلي بالكامل. جميع العملاء والموظفين والعلامات التجارية والفروع والحملات ورموز المهام بأسماء مستعارة (Brand 01، Agent 07، TC-25...). الأعداد والنسب والتوقيتات هي الأرقام الإنتاجية الحقيقية لفترة سبتمبر إلى أغسطس."
    },

    // Capabilities Section
    capabilities: {
      title: "تحليل معمّق لكل صفحة",
      subtitle:
        "مبني لمدير CRM ومدير المبيعات والوكيل على الهاتف، لكل منهم رؤيته الخاصة للحقيقة نفسها.",
      list: [
        "<strong>النظرة التنفيذية:</strong> إجمالي العملاء المحتملين، المؤهلين، الوكلاء الفرعيين، المفوترين ومبيعات التجزئة مع أسهم شهرية على كل بطاقة مؤشر. كل مقارنة واعية بالفترة: اختر شهرًا فيُقارن بالشهر الماضي؛ اختر ربعًا فيُقارن بالربع الماضي.",
        "<strong>تقرير مصادر العملاء المحتملين:</strong> العملاء المحتملون، مستويات التأهيل (مؤهل / + وكيل فرعي / + غير مؤهل) وأسباب الرفض حسب الحملة ومجموعة الإعلانات ومصدر العميل، مع تصنيف تأهيل ثلاثي المستويات ليعدّ التسويق وCRM الشيء نفسه أخيرًا.",
        "<strong>أداء الوكلاء:</strong> المكالمات المنجزة، نسبة الاتصال الناجح، نسبة التأهيل، متوسط مدة الرحلة، إعادة المحاولات المفتوحة وإسناد الفواتير لكل وكيل، مُلوّنة وفق عتبات الفريق ومتتبعة شهريًا.",
        "<strong>ذكاء الرحلات:</strong> كم مكالمة يلزم لحل عميل محتمل، نسبة المحلولين من المكالمة الأولى، متوسط التأخير من العميل المحتمل إلى أول اتصال، وعمر العملاء الذين لم يُتصل بهم قط.",
        "<strong>وتيرة التأهيل وتوقع عبء العمل:</strong> محرك حي يجيب \"هل نحن على المسار؟\". يصبح معدل تحويل الشهر الماضي هدف هذا الشهر؛ تُوزع الفجوة على الوكلاء بالحصة العادلة؛ يرى كل وكيل خطة ثابتة لليوم ومتطلبًا متوقعًا للغد يراعي تراكم إعادة المحاولات وتدفق العملاء الجدد والمكالمات الواردة المتوقعة.",
        "<strong>المبيعات والإسناد:</strong> المبيعات المنسوبة إلى CRM مقابل الزيارات المباشرة، تحويل مندوبي المبيعات وتقادم الاستفسارات، أفضل مُغلق لكل فرع، والأيام من العميل المحتمل إلى الفاتورة، مربوطة بالحملة الأصلية."
      ]
    },

    // Engineering Notes
    engineering: {
      title: "ملاحظات هندسية",
      subtitle: "الأجزاء من هذا المشروع التي لا تظهر في لقطة شاشة.",
      items: [
        {
          title: "حلّ مرة واحدة، غذِّ الكثير",
          desc:
            "كانت حالة العميل المحتمل محرك مطابقة مستقلًا من 150 سطرًا، وكذلك سبب الإنهاء. أُعيد بناء كليهما كأغلفة خفيفة تقرأ من مفتاح رحلة مطابق واحد مع كسر التعادل بأولوية النتيجة. تم التحقق صفًا بصف مقابل المنطق القديم (54,403 من 54,403 مطابقة تامة) قبل الإطلاق."
        },
        {
          title: "إخفاء هوية صمد أمام التدقيق",
          desc:
            "أربعة عشر تعبير تعيين ودالتان مساعدتان تستبدل كل مُعرّف بأسماء مستعارة في نهاية قسم M لكل جدول. كشف مسح نهائي لتعبيرات الأعمدة المحسوبة عمودًا مخفيًا تجاوز التعيين ومقياسين يُدرجان أسماء حقيقية كمفاتيح SWITCH. تم إصلاحهما؛ لا يتبقى أي مُعرّف حقيقي خارج الجداول الخام المُحكمة."
        },
        {
          title: "تقويمان، إجابة واحدة",
          desc:
            "يُؤرَّخ العملاء المحتملون بتاريخ الإرسال، والرحلات بآخر نشاط. يرتبط كل جدول حقائق بتقويم الإرسال وتقويم آخر نشاط معًا، ويكتشف كل مقياس ذكاء زمني أيهما رشّحه المشاهد حتى لا تتجاهل بطاقات المؤشرات أي مرشّح بصمت."
        },
        {
          title: "المقاييس كتوثيق",
          desc:
            "تحمل جميع المقاييس الـ410 وصفًا مكتوبًا لما تعدّه وما تستثنيه ولماذا، بما في ذلك تاريخ وسبب كل إصلاح. يتبع كل مؤشر نمطًا واحدًا: القيمة الأساسية، نظير الفترة السابقة الواعي بالفترة، التغير الشهري، نص السهم، ومقياس لون للتنسيق الشرطي."
        }
      ]
    },

    // Explore More Section
    exploreMore: {
      title: "استكشف المزيد من النماذج",
      subtitle: "شاهد حلولنا الأخرى للمؤسسات.",
      button: "عرض معرض الأعمال"
    },

    // Final CTA
    finalCta: {
      title: "هل تدير وكالة أو مركز اتصال على جداول البيانات؟",
      subtitle:
        "نربط مصادر عملائك المحتملين وسجلات المكالمات ونظام إدارة الوكالة في نموذج واحد يستطيع فريقك العمل عليه كل صباح. لنبدأ ببياناتك.",
      button: "احجز مكالمة استراتيجية"
    }
  }
};
