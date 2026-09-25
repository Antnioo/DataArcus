// translations/homepage.js - Homepage Specific
window.homepageTranslations = {
  en: {
    // Page Meta
    meta: {
      title: "DataArcus - Power BI & Data Modeling for Growing Businesses",
      description: "Production-grade Power BI dashboards and data models for businesses across the MENA region: CRM intelligence, project risk and retention analytics.",
      keywords: "Power BI consultant, data modeling, DAX, business intelligence dashboards, MENA, CRM analytics, Power BI specialist",
      author: "DataArcus",
      "og:type": "website",
      "og:title": "DataArcus - Power BI & Data Modeling for Growing Businesses",
      "og:description": "I build production-grade Power BI dashboards and data models for businesses across the MENA region, from CRM intelligence to project risk to retention analytics.",
      "og:url": "https://dataarcus.com/",
      "og:site_name": "DataArcus",
      "og:image": "https://dataarcus.com/assets/img/dataarcus-og-logo.png",
      "og:image:alt": "The DataArcus logo showing animated data bars and the brand name.",
      "og:locale": "en_US",
      "twitter:card": "summary_large_image",
      "twitter:title": "DataArcus - Power BI & Data Modeling for Growing Businesses",
      "twitter:description": "I build production-grade Power BI dashboards and data models for businesses across the MENA region, from CRM intelligence to project risk to retention analytics.",
      "twitter:image": "https://dataarcus.com/assets/img/dataarcus-og-logo.png",
      "twitter:image:alt": "The DataArcus logo showing animated data bars and the brand name.",
      canonical: "https://dataarcus.com/",
    },

    // Hero Section
    hero: {
      title: "From Scattered Business Data to Decisions You Can Trust",
      subtitle: "I design and build production-grade Power BI systems that turn messy operational data into numbers your team can actually rely on: dealership CRMs, project risk tracking, subscription retention and more.",
      buttonWork: "Explore My Work",
      buttonDiscuss: "Book a Free Data Clarity Call",
      badgeSecurity: "Enterprise Security",
      badgeTurnaround: "Fast Turnaround",
      badgeExcellence: "Committed to Excellence",
      commitmentTitle: "Our Commitment to Excellence",
      commitmentPoints: [
        "Advanced DAX & Power Query Mastery",
        "Unified Business Data Modeling",
        "Enterprise Governance & Security",
        "Custom Visual Development"
      ],
      proofBadges: ["Microsoft Certified Power BI Data Analyst", "Every number validated against the source", "Arabic & English"],
      proof: {"live": "Production model", "subtitle": "Automotive dealership CRM, anonymized", "kpis": ["leads", "calls", "call journeys", "DAX measures"], "caption": "Three disconnected systems, one model, every lead resolved once and matched against the source.", "link": "See the live dashboard"}
    },

    // Tech Stack Section
    techStack: {
      powerbi: "Power BI",
      excel: "Excel",
      sql: "SQL",
      azure: "Azure",
      python: "Python",
      fabric: "Fabric"
    },

    // Services Section
    services: {
      title: "Solutions Built Around Your Data, Not a Template",
      subtitle: "CRM, e-commerce, project tools or spreadsheets: whatever your business runs on, I turn it into a model your team can actually trust.",
      cards: [
        {
          title: "Executive & Operational Dashboards",
          desc: "A real-time, single view of your business, built the way every DataArcus model is: one validated source of truth instead of five reports that quietly disagree."
        },
        {
          title: "Reliable Data Modeling & Pipelines",
          desc: "Your dashboards are only as good as the model underneath them. I build clean, documented models validated against the source system before anything goes live."
        },
        {
          title: "Predictive & Trend Analysis",
          desc: "Beyond what happened: forecasting, cohort analysis, and pacing models that show you what's coming next, whether that's next month's sales pace or a lead about to go cold."
        },
        {
          title: "Governance & Security",
          desc: "Row-level security and PII-safe anonymization built into the model from day one, not bolted on after the fact."
        }
      ]
    },

    // Portfolio Section
portfolio: {
      title: "Solution Showcases",
      subtitle: "Explore our proof-of-concept dashboards, engineered to solve common business challenges. See what's possible for your data.",
      cardPulse: {
        badge: "AUTOMOTIVE CRM",
        title: "DataArcus Pulse: CRM Intelligence",
        desc: "A production-grade dealership CRM command center: 54K leads, 113K calls and 72K call journeys resolved into one model with 410 measures and daily pacing targets."
      },
      cardFintech: {
        badge: "FINTECH & RISK",
        title: "Fintech Portfolio Risk Engine",
        desc: "A live early-warning system for 72 projects, analyzing budget, schedule, and delivery risk using Earned Value Management (EVM)."
      },
      cardRepeatiq: {
        badge: "SAAS & RETENTION",
        title: "RepeatIQ Commerce Analytics",
        desc: "A 5-page strategic suite maximizing Customer Lifetime Value (CLV) through cohort analysis, churn prediction, and risk modeling."
      },
      cardCfpb: {
        badge: "FINANCE & COMPLIANCE",
        title: "Consumer Financial Complaints",
        desc: "A 4-page showcase analyzing 7 years of U.S. consumer complaints, focusing on trends, company accountability, and regional fairness."
      },
      button: "View All Showcases"
    },

    // About Section
    about: {
      title: "A Partner in Your Success",
      subtitle: "DataArcus isn't a dashboard factory. It's one person building the same kind of production-grade models you'd get from an internal data team, without the internal data team price tag.",
      quote: "\"My name is Abdelrahman M. I've spent 2 years working in CRM and data-driven operations, and I got tired of waiting for someone else to build the reporting I actually needed, so I started building it myself in Power BI. DataArcus is where that work lives: real, production-grade models, not templates.\"",
      p1: "I'm not running a large consultancy. I'm one person who builds every model personally. That means direct access to whoever's actually doing the work, no account-manager layer between you and your dashboard, and what you see in the portfolio is exactly what you'd get.",
      founder: "Abdelrahman M., Founder & Lead Data Architect",
      certification: {
        title: "Industry Certified",
        subtitle: "Data Analytics Professional",
        verified: "Verified by Google & Microsoft"
      },
      statsTitle: "The Track Record So Far",
      statsSubtitle: "Real numbers from real production models, not agency metrics.",
      stats: [
        { title: "Leads Resolved in One Production Model" },
        { title: "DAX Measures in Production" },
        { title: "End-to-End Dashboard Builds" },
        { title: "Free Power BI Tools Published" }
      ],
      ctaTitle: "Curious What This Could Look Like for Your Data?",
      ctaSubtitle: "No obligation. Tell me what you're working with, and I'll show you what's possible on a quick call.",
      ctaButton: "Book a Free Data Clarity Call"
    },

    process: {"title": "How a Project Works", "subtitle": "Three steps, no surprises.", "steps": [{"title": "Free Data Clarity Call", "desc": "20 minutes on your data and the decisions you need to make. You get a straight answer on what's fixable, even if we never work together."}, {"title": "Build and Validate", "desc": "I build the data model and dashboards, and check every number against your source system before you see a single chart."}, {"title": "Handover and Support", "desc": "Your team gets the report, a walkthrough and documentation. Changes after launch are one message away, and you talk to the person who built it."}]},
    toolsStrip: {"badge": "Free · No sign-up", "title": "Free Power BI Tools", "subtitle": "Built from real client work. Use them on your own reports today.", "button": "See all tools", "cards": [{"title": "DP-600 Practice Exam", "desc": "220 Fabric questions, mock exams and case studies."}, {"title": "DAX Calendar Generator", "desc": "Date table with Hijri dates and Ramadan flags."}, {"title": "DAX Measure Builder", "desc": "YTD, YoY, rolling and running totals in one click."}]},
    latest: {"title": "Latest from the Blog", "subtitle": "Playbooks from real models: the patterns, the mistakes, and the fixes.", "button": "All articles", "posts": {"ramadanSales": {"badge": "POWER BI", "title": "Ramadan Sales in Power BI: Compare This Ramadan With Last Ramadan", "date": "September 23, 2026", "excerpt": "SAMEPERIODLASTYEAR compares March with March, but Ramadan moved 11 days. The Hijri calendar and the one DAX measure that line up every Ramadan day by day.", "button": "Read Playbook"}, "licensingGuide": {"badge": "STRATEGY", "title": "Power BI Pro, Premium Per User or Fabric: Which License Do You Actually Need?", "date": "September 23, 2026", "excerpt": "One number decides your Power BI license: how many people only view reports. Current prices, the F64 break-even point and a worked example.", "button": "Read Playbook"}, "journeyAttribution": {"badge": "DATA ENGINEERING", "title": "Resolve Once, Hydrate Many: A DAX Pattern for Lead Attribution", "date": "September 1, 2026", "excerpt": "Why matching the same lead five times produces disagreeing KPIs, and the single-resolution DAX pattern that validated 54,403/54,403 leads before replacing scattered join logic.", "button": "Read Playbook"}}},

    // FAQ Section
    faq: {
      title: "Your Questions, Answered",
      subtitle: "Here are the answers to the questions I get asked most before a project starts.",
      items: [
        {
          q: "How does the free Data Clarity Call work?",
          a: "<strong>It's a focused 20-minute call, not a sales pitch.</strong> Bring whatever you've got (a messy spreadsheet, a CRM export, your current dashboard) and I'll walk through what's actually fixable and what a real model would look like. No build, no obligation, just a straight answer on whether this is worth pursuing."
        },
        {
          q: "What's the real ROI of a Power BI implementation?",
          a: "<strong>Here's a simple way to estimate it, not a guarantee.</strong> If your team spends 10 hours a week on manual reporting, that's roughly 500+ hours a year, and that's before counting the cost of decisions made late because the numbers weren't ready.<div class=\"mt-3\"><div class=\"row g-3\"><div class=\"col-sm-6\"><div class=\"p-3 rounded\" style=\"background: rgba(253, 121, 168, 0.1);\"><strong>Before:</strong><br>• 10h/week manual reports<br>• Delayed decisions<br>• Data inconsistencies</div></div><div class=\"col-sm-6\"><div class=\"p-3 rounded\" style=\"background: rgba(0, 206, 201, 0.1);\"><strong>After:</strong><br>• 30min/week monitoring<br>• Real-time insights<br>• Confident decisions</div></div></div></div>"
        },
        {
          q: "How do you handle our sensitive business data?",
          a: "<strong>On the discovery call, we talk through your data without you needing to hand anything over.</strong> If we move forward, I work within your existing Microsoft environment using row-level security, encrypted connections, and enterprise-grade governance.<div class=\"mt-3\"><div class=\"d-flex align-items-start mb-2\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>NDA signed before any data access</span></div><div class=\"d-flex align-items-start mb-2\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>Data stays in your Microsoft tenant</span></div><div class=\"d-flex align-items-start mb-2\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>Role-based access controls implemented</span></div><div class=\"d-flex align-items-start\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>Full audit trail of all activities</span></div></div>"
        },
        {
          q: "What if our data is a mess? Excel exports, legacy systems, manual processes?",
          a: "<strong>That's normal, and it's exactly the kind of problem I solve.</strong> I connect and clean data from CRMs, e-commerce platforms, ERPs, and spreadsheets into one reliable model.<div class=\"mt-3 p-3 rounded\" style=\"background: rgba(108, 92, 231, 0.1);\"><strong>I connect to:</strong> CRM systems, Shopify, WooCommerce, SQL databases, APIs, Excel files, and most other common business data sources.</div><p class=\"mt-3 mb-0\"><em>\"The messier your data, the bigger the transformation impact.\"</em></p>"
        },
        {
          q: "Will our team be able to use the dashboards?",
          a: "<strong>Absolutely. I build for your team's skill level and provide comprehensive training.</strong> Every project includes user training and documentation, plus ongoing support options.<div class=\"mt-3\"><div class=\"row g-2 small\"><div class=\"col-md-6\"><strong class=\"text-accent\">For End Users:</strong><br>• How to read dashboards<br>• Filtering and drilling down<br>• Export and sharing options</div><div class=\"col-md-6\"><strong class=\"text-accent\">For Admins:</strong><br>• Data refresh schedules<br>• User permissions<br>• Basic troubleshooting</div></div></div>"
        },
        {
          q: "Why work with an independent specialist instead of a large agency?",
          a: "<strong>You get direct access to the person actually building your model.</strong> No account manager relaying requests to a junior analyst. I built <a href='dashboards/dataarcus-pulse.html' class='text-accent'>DataArcus Pulse</a>, a production-grade automotive CRM model with 410 measures, entirely myself, and that's the level of hands-on ownership every project gets.<div class=\"mt-3 p-3 rounded\" style=\"background: rgba(0, 212, 255, 0.1); border: 1px solid var(--accent);\">What you lose versus a big firm is overhead. What you gain is speed, direct communication, and someone personally accountable for every number in your dashboard.</div>"
        },
        {
          q: "What if we're not sure what we need?",
          a: "<strong>That's exactly what the free Data Clarity Call is for.</strong> Bring what you've got, and I'll help you figure out where the real opportunity is, even if that's not a full dashboard build yet. No commitment required."
        }
      ]
    },

    // Final CTA Section
    finalCta: {
      title: "Ready to See Your Data in Action?",
      subtitle: "Book a free 20-minute Data Clarity Call. No obligation, just a straight look at what's possible with what you've got.",
      button: "Book Your Free Call"
    },

    // Contact Section
    contact: {
      title: "Start a Conversation About Your Data",
      subtitle: "Tell me about your business and the decisions you need better data for, and I'll walk you through what's possible on a free call.",
      form: {
        name: "Full Name *",
        email: "Business Email *",
        company: "Company",
        platform: "Data Source / Platform (Optional)",
        platformPlaceholder: "e.g., CRM system, Shopify, internal database...",
        details: "Project Details *",
        placeholder: "e.g., We use a CRM and a few spreadsheets. We need a single view of leads, conversion, and team performance...",
        button: "Book My Free Call",
        response: "Response within 4 hours"
      },
      checklist: {
        title: "What to bring to your Data Clarity Call",
        items: [
          {
            title: "One decision you want to make faster",
            desc: "For example: \"Which campaigns bring buyers, not just leads?\""
          },
          {
            title: "Where your data lives today",
            desc: "CRM export, Excel sheets, Shopify, Google Sheets..."
          },
          {
            title: "Who reads the numbers",
            desc: "You, a manager, the sales team?"
          },
          {
            title: "What \"better\" looks like",
            desc: "A report you stop building by hand, a number you can finally trust"
          }
        ]
      },
      timeline: {
        title: "How a typical project runs",
        items: [
          {
            label: "Discovery and data access",
            value: "Week 1"
          },
          {
            label: "Data model and measures",
            value: "Weeks 1-2"
          },
          {
            label: "Dashboard build",
            value: "Weeks 2-3"
          },
          {
            label: "Testing, training and handover",
            value: "Weeks 3-4"
          }
        ],
        note: "Smaller jobs, like one report on clean data, can take a few days. You get a fixed timeline after the call."
      }
    }
  },

  ar: {
    // Page Meta
    meta: {
      title: "داتا أركوس - حلول Power BI ونمذجة البيانات للأعمال النامية",
      description: "لوحات تحكم Power BI ونماذج بيانات بمستوى الإنتاج للشركات في الشرق الأوسط: ذكاء علاقات العملاء ومخاطر المشاريع وتحليلات الاحتفاظ بالعملاء.",
      keywords: "استشاري Power BI, نمذجة البيانات, DAX, لوحات تحكم ذكاء الأعمال, الشرق الأوسط, تحليلات CRM, متخصص Power BI",
      author: "داتا أركوس",
      "og:type": "website",
      "og:title": "داتا أركوس - حلول Power BI ونمذجة البيانات للأعمال النامية",
      "og:description": "أبني لوحات تحكم Power BI ونماذج بيانات بمستوى الإنتاج للشركات في منطقة الشرق الأوسط، من ذكاء إدارة علاقات العملاء إلى مخاطر المشاريع وتحليلات الاحتفاظ بالعملاء.",
      "og:url": "https://dataarcus.com/",
      "og:site_name": "داتا أركوس",
      "og:image": "https://dataarcus.com/assets/img/dataarcus-og-logo.png",
      "og:image:alt": "شعار داتا أركوس مع أعمدة بيانات متحركة واسم العلامة التجارية.",
      "og:locale": "ar_EG",
      "twitter:card": "summary_large_image",
      "twitter:title": "داتا أركوس - حلول Power BI ونمذجة البيانات للأعمال النامية",
      "twitter:description": "أبني لوحات تحكم Power BI ونماذج بيانات بمستوى الإنتاج للشركات في منطقة الشرق الأوسط، من ذكاء إدارة علاقات العملاء إلى مخاطر المشاريع وتحليلات الاحتفاظ بالعملاء.",
      "twitter:image": "https://dataarcus.com/assets/img/dataarcus-og-logo.png",
      "twitter:image:alt": "شعار داتا أركوس مع أعمدة بيانات متحركة واسم العلامة التجارية.",
      canonical: "https://dataarcus.com/",
    },

    // Hero Section
    hero: {
      title: "من بيانات أعمال مشتتة إلى قرارات يمكنك الوثوق بها",
      subtitle: "أصمم وأبني أنظمة Power BI بمستوى الإنتاج تحوّل بياناتك التشغيلية المشتتة إلى أرقام يمكن لفريقك الاعتماد عليها فعليًا: أنظمة CRM لدى الوكلاء، وتتبع مخاطر المشاريع، وتحليلات الاحتفاظ بالعملاء، وأكثر.",
      buttonWork: "استكشف أعمالي",
      buttonDiscuss: "احجز مكالمة وضوح بيانات مجانية",
      badgeSecurity: "أمان على مستوى الشركات",
      badgeTurnaround: "تنفيذ سريع",
      badgeExcellence: "ملتزمون بالتميز",
      commitmentTitle: "التزامنا بالتميز",
      commitmentPoints: [
        "إتقان متقدم للغات DAX و Power Query",
        "نمذجة موحدة لبيانات الأعمال",
        "حوكمة وأمان على مستوى الشركات",
        "تطوير واجهات مرئية مخصصة"
      ],
      proofBadges: ["محلل بيانات Power BI معتمد من Microsoft", "كل رقم مُطابق مع المصدر", "العربية والإنجليزية"],
      proof: {"live": "نموذج إنتاج حقيقي", "subtitle": "نظام CRM لوكيل سيارات، ببيانات مجهولة الهوية", "kpis": ["عميل محتمل", "مكالمة", "رحلة اتصال", "مقياس DAX"], "caption": "ثلاثة أنظمة منفصلة، نموذج واحد، وكل عميل محتمل يُحل مرة واحدة ويُطابق مع المصدر.", "link": "شاهد لوحة التحكم"}
    },

    // Tech Stack Section
    techStack: {
      powerbi: "Power BI",
      excel: "Excel",
      sql: "SQL",
      azure: "Azure",
      python: "Python",
      fabric: "Fabric"
    },

    // Services Section
    services: {
      title: "حلول مبنية حول بياناتك، لا قالب جاهز",
      subtitle: "أيًا كانت المنصة التي تعمل عليها شركتك، سواء CRM أو تجارة إلكترونية أو أدوات إدارة مشاريع أو جداول بيانات، أحوّلها إلى نموذج يمكن لفريقك الوثوق به فعليًا.",
      cards: [
        {
          title: "لوحات تحكم تنفيذية وتشغيلية",
          desc: "رؤية لحظية وموحدة لأعمالك، مبنية بنفس الطريقة التي يُبنى بها كل نموذج في داتا أركوس: مصدر حقيقة واحد تم التحقق منه بدلاً من خمسة تقارير تتعارض بصمت."
        },
        {
          title: "نمذجة بيانات وخطوط بيانات موثوقة",
          desc: "جودة لوحات تحكمك تعتمد على جودة النموذج تحتها. أبني نماذج نظيفة وموثقة تم التحقق منها مقابل النظام المصدر قبل إطلاق أي شيء."
        },
        {
          title: "التحليل التنبؤي والاتجاهات",
          desc: "ما وراء ما حدث: نماذج تنبؤ وتحليل دفعات ووتيرة تُظهر لك ما هو قادم، سواء كان ذلك وتيرة مبيعات الشهر القادم أو عميلاً محتملاً على وشك أن يبرد."
        },
        {
          title: "الحوكمة والأمان",
          desc: "أمان على مستوى الصف وإخفاء هوية آمن للبيانات الحساسة، مدمجان في النموذج منذ اليوم الأول، وليسا إضافة لاحقة."
        }
      ]
    },

    // Portfolio Section
portfolio: {
      title: "نماذج الحلول",
      subtitle: "استكشف لوحات التحكم التجريبية لدينا. شاهد ما هو ممكن لبياناتك.",
      cardPulse: {
        badge: "CRM لقطاع السيارات",
        title: "داتا أركوس بالس: ذكاء إدارة علاقات العملاء",
        desc: "مركز قيادة CRM لوكالة سيارات بمستوى الإنتاج: 54 ألف عميل محتمل، 113 ألف مكالمة و72 ألف رحلة اتصال في نموذج واحد يضم 410 مقياس وأهداف وتيرة يومية."
      },
      cardFintech: {
        badge: "التكنولوجيا المالية والمخاطر",
        title: "محرك مخاطر محافظ التكنولوجيا المالية",
        desc: "نظام إنذار مبكر لـ 72 مشروعًا، يحلل الميزانية والجدول الزمني ومخاطر التسليم باستخدام إدارة القيمة المكتسبة (EVM)."
      },
      cardRepeatiq: {
        badge: "تحليلات الاشتراكات",
        title: "تحليلات RepeatIQ للتجارة",
        desc: "جناح استراتيجي من 5 صفحات لتعظيم القيمة الدائمة للعميل من خلال تحليل الدفعات (Cohorts) والتنبؤ بالتسرب."
      },
      cardCfpb: {
        badge: "تحليلات مالية وامتثال",
        title: "تحليل شكاوى الخدمات المالية",
        desc: "نموذج من 4 صفحات يحلل 7 سنوات من شكاوى المستهلكين في الولايات المتحدة، مع التركيز على الاتجاهات ومساءلة الشركات."
      },
      button: "عرض كل النماذج"
    },

    // About Section
    about: {
      title: "شريك في نجاحك",
      subtitle: "داتا أركوس ليست مصنعًا للوحات التحكم، بل شخص واحد يبني نفس نوع النماذج بمستوى الإنتاج التي كنت لتحصل عليها من فريق بيانات داخلي، دون تكلفة فريق داخلي كامل.",
      quote: "\"اسمي عبد الرحمن م. أمضيت سنتين في العمل ضمن إدارة علاقات العملاء والعمليات القائمة على البيانات، ثم مللت من انتظار شخص آخر ليبني التقارير التي أحتاجها فعليًا، فبدأت ببنائها بنفسي في Power BI. داتا أركوس هي المكان الذي يعيش فيه هذا العمل: نماذج حقيقية بمستوى الإنتاج، لا قوالب جاهزة.\"",
      p1: "أنا لا أدير استشارة كبرى. أنا شخص واحد يبني كل نموذج بنفسه. هذا يعني وصولاً مباشرًا لمن يقوم بالعمل فعليًا، دون طبقة مدير حسابات بينك وبين لوحة تحكمك، وما تراه في المعرض هو بالضبط ما ستحصل عليه.",
      founder: "عبد الرحمن م.، المؤسس وكبير مهندسي البيانات",
      certification: {
        title: "شهادات معتمدة",
        subtitle: "محترف تحليل بيانات",
        verified: "موثق من Google و Microsoft"
      },
      statsTitle: "السجل حتى الآن",
      statsSubtitle: "أرقام حقيقية من نماذج إنتاج حقيقية، لا مقاييس وكالات مصطنعة.",
      stats: [
        { title: "عميل محتمل تم حله في نموذج إنتاج واحد" },
        { title: "مقياس DAX في الإنتاج" },
        { title: "لوحة تحكم متكاملة تم بناؤها" },
        { title: "أداة Power BI مجانية منشورة" }
      ],
      ctaTitle: "هل تتساءل كيف سيبدو هذا لبياناتك؟",
      ctaSubtitle: "بدون أي التزام. أخبرني بما تعمل عليه، وسأوضح لك ما هو ممكن في مكالمة سريعة.",
      ctaButton: "احجز مكالمة وضوح بيانات مجانية"
    },

    process: {"title": "كيف يسير المشروع", "subtitle": "ثلاث خطوات، بدون مفاجآت.", "steps": [{"title": "مكالمة وضوح البيانات المجانية", "desc": "20 دقيقة حول بياناتك والقرارات التي تحتاج إلى اتخاذها. تحصل على إجابة واضحة عمّا يمكن إصلاحه، حتى لو لم نعمل معًا."}, {"title": "البناء والتحقق", "desc": "أبني نموذج البيانات ولوحات التحكم، وأطابق كل رقم مع نظامك المصدر قبل أن ترى أي رسم بياني."}, {"title": "التسليم والدعم", "desc": "يحصل فريقك على التقرير وشرح عملي وتوثيق كامل. أي تعديل بعد الإطلاق على بُعد رسالة واحدة، مع الشخص الذي بناه مباشرة."}]},
    toolsStrip: {"badge": "مجانية · بدون تسجيل", "title": "أدوات Power BI مجانية", "subtitle": "مبنية من عمل حقيقي مع العملاء. استخدمها في تقاريرك اليوم.", "button": "عرض كل الأدوات", "cards": [{"title": "اختبار DP-600 التجريبي", "desc": "220 سؤالًا عن Fabric واختبارات تجريبية ودراسات حالة."}, {"title": "مولّد تقويم DAX", "desc": "جدول تواريخ بالتاريخ الهجري وعلامات رمضان."}, {"title": "منشئ مقاييس DAX", "desc": "مقاييس YTD و YoY والمتحركة والتراكمية بنقرة واحدة."}]},
    latest: {"title": "أحدث المقالات", "subtitle": "أدلة عملية من نماذج حقيقية: الأنماط والأخطاء والحلول.", "button": "كل المقالات", "posts": {"ramadanSales": {"badge": "Power BI", "title": "مبيعات رمضان في Power BI: قارن رمضان هذا العام برمضان الماضي", "date": "23 سبتمبر 2026", "excerpt": "تقارن SAMEPERIODLASTYEAR مارس بمارس، لكن رمضان تحرّك 11 يومًا. التقويم الهجري ومقياس DAX الذي يطابق كل رمضان يومًا بيوم.", "button": "اقرأ الدليل"}, "licensingGuide": {"badge": "استراتيجية", "title": "Power BI Pro أم Premium Per User أم Fabric: أي ترخيص تحتاجه فعلًا؟", "date": "23 سبتمبر 2026", "excerpt": "رقم واحد يحسم ترخيص Power BI: عدد من يشاهدون التقارير فقط. الأسعار الحالية ونقطة التعادل لـ F64 ومثال عملي.", "button": "اقرأ الدليل"}, "journeyAttribution": {"badge": "هندسة البيانات", "title": "حلّ مرة واحدة، غذِّ كل مكان: نمط DAX لعزو العملاء المحتملين", "date": "1 سبتمبر 2026", "excerpt": "لماذا تُنتج مطابقة نفس العميل المحتمل خمس مرات مؤشرات أداء متضاربة، ونمط DAX الذي وثّق تطابق 54,403 من أصل 54,403 عميل محتمل قبل استبدال منطق الربط المتناثر.", "button": "اقرأ الدليل"}}},

    // FAQ Section
    faq: {
      title: "الأسئلة الشائعة",
      subtitle: "إليك إجابات الأسئلة التي أسمعها غالبًا قبل بدء أي مشروع.",
      items: [
        {
          q: "كيف تعمل مكالمة وضوح البيانات المجانية؟",
          a: "<strong>إنها مكالمة مركّزة مدتها 20 دقيقة، وليست عرضًا ترويجيًا.</strong> أحضر ما لديك (جدول بيانات فوضوي، تصدير من CRM، لوحة تحكمك الحالية) وسأستعرض معك ما يمكن إصلاحه فعليًا وكيف سيبدو نموذج حقيقي. بدون بناء، بدون التزام، فقط إجابة صريحة حول ما إذا كان الأمر يستحق المتابعة."
        },
        {
          q: "ما هو العائد الحقيقي على الاستثمار (ROI) من تطبيق Power BI؟",
          a: "<strong>إليك طريقة بسيطة لتقديره، وليست ضمانًا.</strong> إذا كان فريقك يقضي 10 ساعات أسبوعيًا في إعداد التقارير اليدوية، فهذا يعني أكثر من 500 ساعة سنويًا، وهذا قبل احتساب تكلفة القرارات المتأخرة بسبب عدم جاهزية الأرقام.<div class=\"mt-3\"><div class=\"row g-3\"><div class=\"col-sm-6\"><div class=\"p-3 rounded\" style=\"background: rgba(253, 121, 168, 0.1);\"><strong>قبل:</strong><br>• ١٠ ساعات/أسبوع تقارير يدوية<br>• قرارات متأخرة<br>• بيانات غير متسقة</div></div><div class=\"col-sm-6\"><div class=\"p-3 rounded\" style=\"background: rgba(0, 206, 201, 0.1);\"><strong>بعد:</strong><br>• ٣٠ دقيقة/أسبوع للمراقبة<br>• رؤى لحظية<br>• قرارات واثقة</div></div></div></div>"
        },
        {
          q: "كيف تتعامل مع بيانات أعمالنا الحساسة؟",
          a: "<strong>في مكالمة الاكتشاف، نناقش بياناتك دون الحاجة لتسليم أي شيء.</strong> إذا تقدمنا في المشروع، أعمل داخل بيئة Microsoft الخاصة بك باستخدام الأمان على مستوى الصف (RLS)، والاتصالات المشفرة، والحوكمة على مستوى الشركات.<div class=\"mt-3\"><div class=\"d-flex align-items-start mb-2\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>توقيع اتفاقية سرية (NDA) قبل الوصول لأي بيانات</span></div><div class=\"d-flex align-items-start mb-2\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>تبقى البيانات داخل حساب Microsoft الخاص بك</span></div><div class=\"d-flex align-items-start mb-2\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>تطبيق ضوابط الوصول المستندة إلى الأدوار الوظيفية</span></div><div class=\"d-flex align-items-start\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>سجل تدقيق كامل لجميع الأنشطة</span></div></div>"
        },
        {
          q: "ماذا لو كانت بياناتنا فوضوية؟ ملفات Excel، أنظمة قديمة، عمليات يدوية؟",
          a: "<strong>هذا أمر طبيعي، وهو بالضبط نوع المشكلة التي أحلّها.</strong> أربط وأنظّف البيانات من أنظمة CRM ومنصات التجارة الإلكترونية وأنظمة ERP وجداول البيانات في نموذج واحد موثوق.<div class=\"mt-3 p-3 rounded\" style=\"background: rgba(108, 92, 231, 0.1);\"><strong>أتصل بـ:</strong> أنظمة CRM، Shopify، WooCommerce، قواعد بيانات SQL، واجهات APIs، ملفات Excel، ومعظم مصادر بيانات الأعمال الشائعة الأخرى.</div><p class=\"mt-3 mb-0\"><em>\"كلما كانت بياناتك أكثر فوضوية، كان تأثير التحول أكبر.\"</em></p>"
        },
        {
          q: "هل سيتمكن فريقنا من استخدام لوحات التحكم؟",
          a: "<strong>بالتأكيد. أبني الحلول لتناسب مستوى مهارة فريقك وأقدم تدريبًا شاملاً.</strong> يتضمن كل مشروع تدريبًا للمستخدمين ووثائق كاملة، بالإضافة إلى خيارات دعم مستمرة.<div class=\"mt-3\"><div class=\"row g-2 small\"><div class=\"col-md-6\"><strong class=\"text-accent\">للمستخدمين:</strong><br>• كيفية قراءة لوحات التحكم<br>• الفلترة والتعمق في البيانات<br>• خيارات التصدير والمشاركة</div><div class=\"col-md-6\"><strong class=\"text-accent\">للمسؤولين:</strong><br>• جدولة تحديث البيانات<br>• صلاحيات المستخدمين<br>• استكشاف الأخطاء الأساسية</div></div></div>"
        },
        {
          q: "لماذا العمل مع متخصص مستقل بدلاً من شركة استشارات كبرى؟",
          a: "<strong>تحصل على وصول مباشر للشخص الذي يبني نموذجك فعليًا.</strong> بلا مدير حسابات ينقل الطلبات إلى محلل مبتدئ. لقد بنيت <a href='dashboards/dataarcus-pulse.html' class='text-accent'>داتا أركوس بلس</a>، نموذج ذكاء CRM لقطاع السيارات بمستوى الإنتاج ويضم 410 مقياسًا، بنفسي بالكامل، وهذا هو مستوى الملكية العملية الذي يحصل عليه كل مشروع.<div class=\"mt-3 p-3 rounded\" style=\"background: rgba(0, 212, 255, 0.1); border: 1px solid var(--accent);\">ما تخسره مقارنة بشركة كبرى هو التكاليف الإضافية. وما تكسبه هو السرعة والتواصل المباشر وشخص مسؤول شخصيًا عن كل رقم في لوحة تحكمك.</div>"
        },
        {
          q: "ماذا لو لم نكن متأكدين مما نحتاجه؟",
          a: "<strong>هذا بالضبط سبب وجود مكالمة وضوح البيانات المجانية.</strong> أحضر ما لديك، وسأساعدك في تحديد الفرصة الحقيقية، حتى لو لم تكن بناء لوحة تحكم كاملة بعد. لا يوجد أي التزام مطلوب."
        }
      ]
    },

    // Final CTA Section
    finalCta: {
      title: "هل أنت مستعد لرؤية بياناتك في العمل؟",
      subtitle: "احجز مكالمة وضوح بيانات مجانية مدتها 20 دقيقة. بدون التزام، فقط نظرة صريحة على ما هو ممكن بما لديك.",
      button: "احجز مكالمتك المجانية"
    },

    // Contact Section
    contact: {
      title: "ابدأ محادثة حول بياناتك",
      subtitle: "أخبرني عن أعمالك والقرارات التي تحتاج بيانات أفضل من أجلها، وسأوضح لك ما هو ممكن في مكالمة مجانية.",
      form: {
        name: "الاسم بالكامل *",
        email: "البريد الإلكتروني للعمل *",
        company: "الشركة",
        platform: "مصدر البيانات / المنصة (اختياري)",
        platformPlaceholder: "مثال: نظام CRM، Shopify، قاعدة بيانات داخلية...",
        details: "تفاصيل المشروع *",
        placeholder: "مثال: نستخدم نظام CRM وبعض جداول البيانات. نحتاج رؤية موحدة للعملاء المحتملين والتحويل وأداء الفريق...",
        button: "احجز مكالمتي المجانية",
        response: "الرد في غضون ٤ ساعات"
      },
      checklist: {
        title: "ما الذي تحضره إلى مكالمة وضوح البيانات",
        items: [
          {
            title: "قرار واحد تريد اتخاذه أسرع",
            desc: "مثال: \"أي الحملات تجلب مشترين، وليس مجرد عملاء محتملين؟\""
          },
          {
            title: "أين توجد بياناتك اليوم",
            desc: "تصدير من CRM، أو ملفات Excel، أو متجر Shopify، أو Google Sheets وغيرها"
          },
          {
            title: "من يقرأ الأرقام",
            desc: "أنت، أحد المدراء، أم فريق المبيعات؟"
          },
          {
            title: "كيف يبدو الأفضل",
            desc: "تقرير تتوقف عن إعداده يدويًا، أو رقم تثق به أخيرًا"
          }
        ]
      },
      timeline: {
        title: "كيف يسير المشروع عادةً",
        items: [
          {
            label: "الاكتشاف والوصول إلى البيانات",
            value: "الأسبوع الأول"
          },
          {
            label: "نموذج البيانات والمقاييس",
            value: "الأسبوعان الأول والثاني"
          },
          {
            label: "بناء لوحة التحكم",
            value: "الأسبوعان الثاني والثالث"
          },
          {
            label: "الاختبار والتدريب والتسليم",
            value: "الأسبوعان الثالث والرابع"
          }
        ],
        note: "المهام الأصغر، مثل تقرير واحد على بيانات نظيفة، قد تستغرق أيامًا قليلة. تحصل على جدول زمني محدد بعد المكالمة."
      }
    }
  }
};