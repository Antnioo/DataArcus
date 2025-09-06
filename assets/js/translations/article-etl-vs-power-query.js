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
        "<strong>Favor folding:</strong> Avoid un-foldable M patterns (row-by-row loops, custom functions on large tables, premature `Table.Buffer`).",
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
      description: "دليل عملي يشرح الفرق بين ETL وPower Query في Power BI: نقاط القوة والقيود والأنماط الهجينة، وكيفية اتخاذ القرار الصحيح بما يناسب الحجم والحَوْكمة وتواتر التحديث.",
      keywords: "ETL, Power Query, Power BI, ELT, Dataflows, Microsoft Fabric, Direct Lake, هندسة البيانات, التحديث التفاضلي, لغة M"
    },

    // Article Header Arabic
    header: {
      title: "ETL مقابل Power Query: اختيار الأداة المناسبة لرحلة بياناتك في Power BI",
      subtitle: "نُشر في 4 سبتمبر 2025"
    },

    // Article Content Arabic
    content: {
      p1: "في مشاريع Power BI، أحد أول الأسئلة التي تواجه الفِرَق هو: هل يجب أن نعتمد على خطوط بيانات ETL/ELT الهندسية أم نكتفي باستخدام Power Query لتحضير البيانات؟ الاختيار الحكيم يوفر أشهرًا من إعادة العمل.",
      p2: "لا يوجد خيار 'أفضل' عالميًا. تتألق ETL في الحجم الكبير، والحوكمة، وإعادة الاستخدام. بينما يتفوق Power Query في السرعة، والقرب من منطق العمل، واستقلالية المحللين. أفضل الفِرَق تمزج بين الاثنين.",

      h1: "ما هي ETL؟",
      p3: "تشير ETL (أو ELT) إلى خطوط بيانات مُنسَّقة تدمج مصادر متعددة، وتطبق تحويلات مُصَدَّرة (versioned)، وتُنتج جداول مُنظَّمة في مستودع أو بحيرة بيانات للاستهلاك على نطاق واسع.",
      list1: [
        "<strong>هندسية ومُنسَّقة:</strong> خطوط أنابيب مجدولة مع مراقبة وتنبيهات وإعادة محاولات وتتبع لمسار البيانات (Lineage).",
        "<strong>قابلة للإصدار والاختبار:</strong> تُخزن في مستودعات الأكواد (مثل SQL/dbt/ADF/SSIS) مع CI/CD ومراجعة النظراء.",
        "<strong>مصممة للتوسع:</strong> تتعامل مع الأحجام الكبيرة، والتقاط بيانات التغيير (CDC)، والأبعاد المتغيرة ببطء (SCDs)، وقواعد العمل المعقدة قبل طبقة ذكاء الأعمال.",
        "<strong>منتجات بيانات قابلة لإعادة الاستخدام:</strong> تُنتج جداول مُنمذجة (نماذج نجمية) تخدم العديد من التقارير والأدوات — وليس فقط Power BI."
      ],

      h2: "ما هو Power Query؟",
      p4: "Power Query هو محرك التحويل M المدمج في Power BI. يقوم المحللون بتشكيل البيانات عبر استعلامات متدرجة يمكنها 'الطي' (folding) إلى المصدر عند دعمه، مما يُبقي منطق العمل قريبًا من التقرير.",
      list2: [
        "<strong>سريع في التكرار والتجربة:</strong> مثالي للنماذج الأولية ومنطق الأعمال النهائي دون انتظار فريق البيانات.",
        "<strong>طي الاستعلام (Source folding):</strong> عندما يتم طي الاستعلامات، يُنفذ العمل الثقيل في المصدر؛ تجنب الأنماط التي تكسر هذه الميزة.",
        "<strong>متمحور حول النموذج:</strong> التحويلات تعيش مع مجموعة البيانات؛ وتعزز <em>Dataflows</em> إعادة الاستخدام عبر التقارير.",
        "<strong>الأفضل للبيانات المتوسطة:</strong> مثالي عندما تكون المصادر بسيطة، والأحجام معتدلة، وجدولة التحديث خلال ساعات العمل."
      ],

      h3: "ETL مقابل Power Query — الفروقات الرئيسية",
      list3: [
        "<strong>الحجم:</strong> ETL مصممة للأحجام الضخمة والمنطق المعقد؛ Power Query ممتازة للتحويلات الأصغر والمحددة النطاق.",
        "<strong>زمن الوصول:</strong> تدعم ETL شبه الوقت الفعلي والتحديثات الدقيقة؛ Power Query تتماشى مع نوافذ تحديث مجموعة البيانات المجدولة.",
        "<strong>الحوكمة:</strong> تركز ETL على توحيد المعايير وتتبع المصدر والتحكم في الوصول؛ بينما يركز Power Query على المرونة مع توفير الحوكمة عبر dataflows ومساحات العمل.",
        "<strong>إعادة الاستخدام:</strong> تنشئ ETL جداول مشتركة وموحدة لعدة مستهلكين؛ منطق Power Query غالبًا ما يكون خاصًا بالتقرير ما لم يتم ترقيته إلى dataflows.",
        "<strong>الفريق والملكية:</strong> ETL مملوكة لفريق هندسة البيانات؛ Power Query يمكّن المحللين وخبراء المجال."
      ],

      h4: "متى تستخدم ETL",
      list4: [
        "عند دمج <strong>مصادر متعددة</strong> (ERP, CRM, ويب, ملفات) مع عمليات ربط معقدة، و CDC، و SCD Type 2.",
        "عندما يكون حجم البيانات <strong>كبيرًا</strong> (عشرات الملايين من الصفوف أو أكثر) أو يحتاج إلى تحديث <strong>متكرر/دقيق</strong>.",
        "عندما تحتاج إلى <strong>حوكمة على مستوى المؤسسة</strong>: تتبع المصدر، التدقيق، إخفاء البيانات الشخصية (PII)، اتفاقيات مستوى الخدمة (SLAs)، والمراقبة.",
        "عندما يجب أن تخدم المخرجات <strong>أدوات متعددة</strong> (Power BI، دفاتر الملاحظات، تعلم الآلة، ETL العكسي).",
        "عندما تريد <strong>صيانة طويلة الأمد</strong> مع كود مُصَدَّر، واختبارات، و CI/CD."
      ],

      h5: "متى تستخدم Power Query",
      list5: [
        "عند التعامل مع مصدر <strong>واحد أو بسيط</strong> بأحجام متواضعة وعمليات تشكيل مباشرة.",
        "عندما تحتاج إلى <strong>تكرار سريع</strong> قريب من مستخدمي الأعمال وتجربة سريعة.",
        "عندما تكون التحويلات <strong>خاصة بتقرير معين</strong> أو منطق نهائي يُطبق فوق جداول مُنظَّمة.",
        "عندما تخطط <strong>لترقية المنطق القابل لإعادة الاستخدام</strong> عبر <em>Dataflows</em> بعد استقرار الأنماط."
      ],

      h6: "البنية الهجينة (أفضل ما في العالمين)",
      p5: "معظم الفِرَق الناضجة تدفع التحويلات الثقيلة إلى ETL/ELT وتحتفظ باللمسات الأخيرة في Power Query من أجل المرونة — وهو نهج فعال بشكل خاص مع Microsoft Fabric (Dataflows Gen2, Lakehouse, Direct Lake).",
      list6: [
        "<strong>التجهيز والتوحيد:</strong> جهّز البيانات الأولية في بحيرة/مستودع البيانات. طبق التنظيف الأساسي، والمواءمة، والنماذج النجمية عبر ETL.",
        "<strong>نشر منتجات البيانات:</strong> اعرض الجداول المُنظَّمة للاستهلاك الواسع (تحليلات، تعلم الآلة، تطبيقات).",
        "<strong>التشكيل في Power Query:</strong> أضف منطقًا خفيفًا خاصًا بالتقرير (أعلام، عمليات دمج صغيرة، قواعد KPI). حافظ على قابلية الطي قدر الإمكان.",
        "<strong>تحسين التحديث:</strong> استخدم التحديث التزايدي/النماذج المركبة؛ ادفع عمليات الربط الثقيلة إلى المصدر؛ خزّن فقط ما يحتاجه التقرير."
      ],

      h7: "نصائح للأداء والحوكمة",
      list7: [
        "<strong>فضّل الطي (Folding):</strong> تجنب أنماط M غير القابلة للطي (الحلقات على كل صف، الدوال المخصصة على جداول كبيرة، `Table.Buffer` المبكر).",
        "<strong>صمم نماذج نجمية:</strong> تتفوق الأبعاد + جداول الحقائق على الجداول الفردية الواسعة في الحجم وأداء DAX.",
        "<strong>حدد أنواع البيانات:</strong> تحديد أنواع البيانات بدقة في وقت مبكر يحسن طي الاستعلام والضغط.",
        "<strong>قسّم بذكاء:</strong> استخدم التحديث التزايدي مع مفاتيح تاريخ مفيدة وحافظ على توازن الأقسام.",
        "<strong>مركزية إعادة الاستخدام:</strong> قم بترقية المنطق المشترك إلى <em>Dataflows</em> أو ETL حتى ترث التقارير المتعددة التحسينات."
      ],

      h8: "مصفوفة قرار سريعة",
      p6: "استخدم هذه القواعد الإرشادية لتحديد مكان تنفيذ التحويل:",
      list8: [
        "<strong>مصدر واحد صغير (أقل من 5 ملايين صف):</strong> Power Query عادة ما يكون كافيًا.",
        "<strong>مصادر متعددة + قواعد عمل معقدة:</strong> فضّل استخدام ETL.",
        "<strong>شبه الوقت الفعلي أو اتفاقيات مستوى خدمة صارمة:</strong> ETL/ELT إلى بحيرة/مستودع البيانات؛ فكر في Direct/Direct Lake.",
        "<strong>منطق يُعاد استخدامه عبر تقارير كثيرة:</strong> اجعله مركزيًا في ETL أو Dataflows.",
        "<strong>متطلبات غير واضحة أو متطورة:</strong> ابدأ في Power Query، وبعد الاستقرار، قم بالترحيل إلى ETL."
      ],

      h9: "الخلاصة",
      p7: "لا توجد منافسة، بل 'الملاءمة للغرض'. استخدم ETL للتوسع والحوكمة؛ واستخدم Power Query للسرعة والقرب من منطق العمل. امزج بينهما لتحقيق أقصى قيمة.",
      p8: "<strong>هل تحتاج إلى مساعدة في تصميم المزيج الصحيح؟</strong> احجز مكالمة استراتيجية مجانية وغير مُلزِمة وسنرسم لك الطريق من البيانات الأولية إلى رؤى موثوقة."
    }
  }
};
