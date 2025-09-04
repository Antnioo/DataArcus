// translations/article-etl-vs-power-query.js
window.etlpqTranslations = {
  en: {
    // Page Meta
    meta: {
      title: "ETL vs Power Query: When to Use Each in Power BI - DataArcus",
      description: "A practical guide to ETL vs Power Query in Power BI. Learn the strengths, limits, hybrid patterns, and decision rules to choose the right approach for scale, refresh, and governance.",
      keywords: "ETL vs Power Query, Power BI data preparation, ELT, dataflows, Microsoft Fabric, Direct Lake, data engineering Power BI, incremental refresh, M language"
    },

    // Article Header
    header: {
      title: "ETL vs Power Query: Choosing the Right Tool for Your Data Journey in Power BI",
      subtitle: "Posted on September 4, 2025"
    },

    // Article Content
    content: {
      p1: "In Power BI projects, one of the first questions teams face is: should we rely on engineered ETL/ELT pipelines or simply use Power Query for data preparation? Choosing wisely saves months of rework.",
      p2: "There is no universally 'better' option. ETL shines for scale, governance, and reuse. Power Query excels at speed, proximity to business logic, and analyst autonomy. The best teams blend both.",
      
      h1: "What is ETL?",
      p3: "ETL (or ELT) refers to orchestrated data pipelines that integrate multiple sources, apply versioned transformations, and land curated tables into a warehouse or data lake for broad consumption.",
      list1: [
        "<strong>Engineered & orchestrated:</strong> Scheduled pipelines with monitoring, alerts, retries, and lineage.",
        "<strong>Versionable & testable:</strong> Stored in code repos (e.g., SQL/dbt/ADF/SSIS) with CI/CD and peer review.",
        "<strong>Built for scale:</strong> Handles high volumes, CDC, SCDs, and complex business rules upstream of BI.",
        "<strong>Reusable data products:</strong> Outputs modeled tables (star schemas) for many reports and tools—not just Power BI."
      ],

      h2: "What is Power Query?",
      p4: "Power Query is the M transformation engine inside Power BI. Analysts shape data with step-by-step queries that can fold back to the source when supported, keeping logic close to the report.",
      list2: [
        "<strong>Fast to iterate:</strong> Great for prototyping and last-mile business logic without waiting on the data team.",
        "<strong>Source folding:</strong> When queries fold, heavy work runs in the source; avoid patterns that break folding.",
        "<strong>Model-centric:</strong> Transformations live with the dataset; <em>Dataflows</em> promote reuse across reports.",
        "<strong>Best for medium data:</strong> Ideal when sources are simple, volumes are moderate, and refresh cadence is business-hours."
      ],

      h3: "ETL vs Power Query — Key Differences",
      list3: [
        "<strong>Scale:</strong> ETL is designed for big volumes and complex logic; Power Query is excellent for smaller, well-scoped transformations.",
        "<strong>Latency:</strong> ETL supports near-real-time and micro-batching; Power Query aligns with scheduled dataset refresh windows.",
        "<strong>Governance:</strong> ETL centralizes standards, lineage, and access control; Power Query emphasizes agility with governance via dataflows and workspaces.",
        "<strong>Reuse:</strong> ETL creates shared, conformed tables for many consumers; Power Query logic is often report-specific unless promoted to dataflows.",
        "<strong>Team & ownership:</strong> ETL is owned by data engineering; Power Query empowers analysts and domain experts."
      ],

      h4: "When to Use ETL",
      list4: [
        "You integrate <strong>many sources</strong> (ERP, CRM, web, files) with complex joins, CDC, and SCD Type 2.",
        "Data volume is <strong>large</strong> (tens of millions+ rows) or needs <strong>frequent/micro-batch</strong> refresh.",
        "You need <strong>enterprise governance</strong>: lineage, auditing, masking/PII handling, SLAs, and observability.",
        "Outputs must serve <strong>multiple tools</strong> (Power BI, notebooks, ML, reverse ETL).",
        "You want <strong>long-term maintainability</strong> with versioned code, tests, and CI/CD."
      ],

      h5: "When to Use Power Query",
      list5: [
        "A <strong>single or simple source</strong> with modest volumes and straightforward shaping.",
        "You need <strong>rapid iteration</strong> close to business users and quick experimentation.",
        "Transformations are <strong>report-specific</strong> or last-mile logic layered on top of curated tables.",
        "You plan to <strong>promote reusable logic</strong> via <em>Dataflows</em> once patterns stabilize."
      ],

      h6: "Hybrid Architecture (Best of Both)",
      p5: "Most mature teams push heavy transformations into ETL/ELT and keep last-mile semantics in Power Query for agility—especially effective with Microsoft Fabric (Dataflows Gen2, Lakehouse, Direct Lake).",
      list6: [
        "<strong>Land & standardize:</strong> Land raw data in the lake/warehouse. Apply core cleaning, conformance, and star schemas via ETL.",
        "<strong>Publish data products:</strong> Expose curated tables for broad consumption (analytics, ML, apps).",
        "<strong>Shape in Power Query:</strong> Add light, report-specific logic (flags, small merges, KPI rules). Keep it foldable where possible.",
        "<strong>Optimize refresh:</strong> Use incremental refresh/composite models; push heavy joins upstream; cache only what the report needs."
      ],

      h7: "Performance & Governance Tips",
      list7: [
        "<strong>Favor folding:</strong> Avoid un-foldable M patterns (row-by-row loops, custom functions on large tables, premature <code>Table.Buffer</code>).",
        "<strong>Design star schemas:</strong> Dimensions + fact tables beat wide single tables for scale and DAX performance.",
        "<strong>Type everything:</strong> Declare accurate data types early to improve query folding and compression.",
        "<strong>Partition wisely:</strong> Use incremental refresh with meaningful date keys; keep partitions balanced.",
        "<strong>Centralize reuse:</strong> Promote shared logic to <em>Dataflows</em> or ETL so multiple reports inherit improvements."
      ],

      h8: "Quick Decision Matrix",
      p6: "Use these rules-of-thumb to decide where a transformation belongs:",
      list8: [
        "<strong>Single small source (&lt;~5M rows):</strong> Power Query is typically fine.",
        "<strong>Many sources + complex business rules:</strong> Prefer ETL.",
        "<strong>Near real-time or strict SLAs:</strong> ETL/ELT to lake/warehouse; consider Direct/Direct Lake.",
        "<strong>Logic reused across many reports:</strong> Centralize in ETL or Dataflows.",
        "<strong>Unclear or evolving requirements:</strong> Start in Power Query, stabilize, then migrate to ETL."
      ],

      h9: "Conclusion",
      p7: "There’s no rivalry—only fit for purpose. Use ETL for scale and governance; use Power Query for speed and proximity to the business. Blend them to maximize value.",
      p8: "<strong>Need help designing the right mix?</strong> Book a free, no-obligation strategy call and we’ll map the path from raw data to trusted insight."
    }
  },

  ar: {
    // Page Meta Arabic
    meta: {
      title: "ETL مقابل Power Query: متى تستخدم كل أداة في Power BI - DataArcus",
      description: "دليل عملي يشرح الفرق بين ETL وPower Query في Power BI: نقاط القوة والقيود والأنماط الهجينة وكيف تقرر بشكل ذكي بما يناسب الحجم والحَوْكمة وتواتر التحديث.",
      keywords: "ETL, Power Query, Power BI, ELT, Dataflows, Microsoft Fabric, Direct Lake, هندسة البيانات, التحديث التفاضلي, لغة M"
    },

    // Article Header Arabic
    header: {
      title: "ETL مقابل Power Query: اختيار الأداة المناسبة لرحلة بياناتك في Power BI",
      subtitle: "نُشر في 4 سبتمبر 2025"
    },

    // Article Content Arabic
    content: {
      p1: "في مشاريع Power BI يظهر سؤال مبكرًا: هل نعتمد على خطوط ETL/ELT الهندسية أم نكتفي بـ Power Query لتحضير البيانات؟ الاختيار الصحيح يوفر أشهرًا من إعادة العمل.",
      p2: "لا توجد أداة «أفضل» مطلقًا. تتميّز ETL على مستوى التوسّع والحَوْكمة وإعادة الاستخدام، بينما يتفوّق Power Query في السرعة والقرب من منطق العمل وتمكين المحللين. الأفضل غالبًا هو المزج بينهما.",

      h1: "ما هي ETL؟",
      p3: "ETL (أو ELT) هي خطوط بيانات مُنسَّقة تجمع مصادر متعددة، وتطبق تحويلات مُصدَّرة ككود، ثم تُنتج جداول مُنظَّمة في مستودع أو بحيرة بيانات للاستهلاك الواسع.",
      list1: [
        "<strong>هندسية وقابلة للتنسيق:</strong> جداول تشغيل، مراقبة، تنبيهات، إعادة محاولات، وتتبع نسب (Lineage).",
        "<strong>قابلة للإصدار والاختبار:</strong> تُدار في مستودعات كود (SQL/dbt/ADF/SSIS) مع CI/CD ومراجعات.",
        "<strong>مصممة للتوسّع:</strong> تتعامل مع أحجام ضخمة، وCDC، وSCD بنوعيه، وقواعد عمل معقدة قبل طبقة الـ BI.",
        "<strong>منتجات بيانات قابلة لإعادة الاستخدام:</strong> تُنتج جداول بنماذج نجمية تخدم تقارير وأدوات متعددة—not just Power BI."
      ],

      h2: "ما هو Power Query؟",
      p4: "Power Query هو محرك التحويل M داخل Power BI. يتيح تشكيل البيانات بخطوات متتابعة ويمكنه «الطيّ» إلى المصدر عند الدعم، ما يبقي المنطق قريبًا من التقرير.",
      list2: [
        "<strong>سريع للتجربة:</strong> مثالي للنمذجة المبدئية ومنطق اللمسة الأخيرة دون انتظار فريق البيانات.",
        "<strong>الطيّ إلى المصدر:</strong> عند توفر الطيّ، تُنفَّذ الأعمال الثقيلة في المصدر؛ تجنب الأنماط التي تكسره.",
        "<strong>متمركز حول النموذج:</strong> تعيش التحويلات مع مجموعة البيانات؛ وتُعزَّز إعادة الاستخدام عبر <em>Dataflows</em>.",
        "<strong>أفضل للأحجام المتوسطة:</strong> مناسب عندما تكون المصادر بسيطة والأحجام معتدلة وتواتر التحديث ضمن ساعات العمل."
      ],

      h3: "ETL مقابل Power Query — فروقات أساسية",
      list3: [
        "<strong>التوسّع:</strong> ETL للأحجام والقواعد المعقدة؛ Power Query ممتاز للتحويلات المحدودة النطاق.",
        "<strong>الزمنية:</strong> ETL تدعم القرب من الوقت الحقيقي والتجزئة الدقيقة؛ Power Query يرتبط بنوافذ تحديث مجدولة.",
        "<strong>الحَوْكمة:</strong> ETL تُركّز المعايير والنسب والصلاحيات؛ Power Query يقدّم رشاقة مع حَوْكمة عبر Dataflows والمساحات.",
        "<strong>إعادة الاستخدام:</strong> ETL تُنتج جداول متوافقة للاستهلاك العام؛ منطق Power Query غالبًا خاص بالتقرير إلا إذا رُقّي إلى Dataflows.",
        "<strong>الفِرَق والملكية:</strong> ETL بيد هندسة البيانات؛ Power Query يمكّن المحللين وخبراء المجال."
      ],

      h4: "متى أستخدم ETL",
      list4: [
        "دمج <strong>مصادر كثيرة</strong> (ERP، CRM، الويب، ملفات) مع CDC وSCD وقواعد عمل معقدة.",
        "حجم البيانات <strong>كبير</strong> (عشرات الملايين+ من الصفوف) أو يلزم تحديث <strong>متكرر/دقيق</strong>.",
        "تحتاج إلى <strong>حَوْكمة مؤسسية</strong>: نسب، تدقيق، إخفاء/PII، اتفاقيات خدمة، ومراقبة.",
        "النواتج تخدم <strong>أدوات متعددة</strong> (Power BI، دفاتر تحليلية، تعلم آلي، تطبيقات).",
        "ترغب في <strong>قابلية صيانة طويلة الأمد</strong> بكود مُصَدَّر، واختبارات، وCI/CD."
      ],

      h5: "متى أستخدم Power Query",
      list5: [
        "مصدر <strong>مفرد أو بسيط</strong> بحجم معتدل وتحويلات مباشرة.",
        "تحتاج <strong>سرعة ومرونة</strong> قريبة من مستخدمي العمل وتجربة سريعة.",
        "التحويلات <strong>خاصة بالتقرير</strong> أو منطق اللمسة الأخيرة فوق جداول مُنظَّمة.",
        "تخطط <strong>لترقية المنطق القابل لإعادة الاستخدام</strong> عبر <em>Dataflows</em> عند استقراره."
      ],

      h6: "معمارية هجينة (أفضل مزيج)",
      p5: "الفِرَق الناضجة تدفع الأعمال الثقيلة إلى ETL/ELT وتحتفظ بمنطق اللمسة الأخيرة في Power Query—ويصبح هذا أقوى مع Microsoft Fabric (Dataflows Gen2 وLakehouse وDirect Lake).",
      list6: [
        "<strong>الاستيعاب والتوحيد:</strong> استيعاب الخام في البحيرة/المستودع وتطبيق التنظيف والتوافق والنماذج النجمية عبر ETL.",
        "<strong>نشر منتجات البيانات:</strong> إتاحة الجداول المُهيأة للاستهلاك العام (تحليلات، تعلم آلي، تطبيقات).",
        "<strong>التشكيل في Power Query:</strong> إضافة منطق خفيف خاص بالتقرير (أعلام، دمج صغير، قواعد KPI) مع الحفاظ على الطيّ.",
        "<strong>تحسين التحديث:</strong> استخدام التحديث التفاضلي/النماذج المركبة؛ دفع الوصلات الثقيلة إلى أعلى؛ تخزين ما يحتاجه التقرير فقط."
      ],

      h7: "نصائح أداء وحَوْكمة",
      list7: [
        "<strong>افضل الطيّ:</strong> تجنب أنماط M غير القابلة للطيّ (حلقات صف-بصف، دوال مخصّصة على جداول ضخمة، <code>Table.Buffer</code> المبكر).",
        "<strong>صمّم نماذج نجمية:</strong> أبعاد + حقائق تتفوق على الجداول العريضة في الأداء وDAX.",
        "<strong>عرّف الأنواع:</strong> تحديد أنواع البيانات مبكرًا يحسّن الطيّ والضغط.",
        "<strong>قسّم بذكاء:</strong> استخدم التحديث التفاضلي بمفاتيح تاريخ مفيدة وحافظ على توازن الأقسام.",
        "<strong>ركّز إعادة الاستخدام:</strong> رقِّ المنطق المشترك إلى <em>Dataflows</em> أو ETL ليستفيد منه عدة تقارير."
      ],

      h8: "مصفوفة قرار سريعة",
      p6: "استخدم هذه القواعد السريعة لتحديد مكان تنفيذ التحويل:",
      list8: [
        "<strong>مصدر مفرد صغير (&lt;~5M صف):</strong> غالبًا يكفي Power Query.",
        "<strong>مصادر عديدة + قواعد معقدة:</strong> الأفضل ETL.",
        "<strong>قرب الوقت الحقيقي أو SLAs صارمة:</strong> ETL/ELT إلى البحيرة/المستودع؛ فكر في Direct/Direct Lake.",
        "<strong>منطق يُعاد استخدامه عبر تقارير كثيرة:</strong> ركّزه في ETL أو Dataflows.",
        "<strong>متطلبات غير واضحة أو تتطور:</strong> ابدأ في Power Query، ثم انقل إلى ETL بعد الاستقرار."
      ],

      h9: "الخلاصة",
      p7: "لا توجد منافسة بل «المناسب للغرض». استخدم ETL للتوسّع والحَوْكمة، وPower Query للسرعة والقرب من العمل. امزج بينهما لتحصل على أقصى قيمة.",
      p8: "<strong>تحتاج مساعدة لتصميم المزيج المناسب؟</strong> احجز مكالمة استراتيجية مجانية وغير مُلزِمة لنرسم الطريق من البيانات الخام إلى الرؤى الموثوقة."
    }
  }
};
