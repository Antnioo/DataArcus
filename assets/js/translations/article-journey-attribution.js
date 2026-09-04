// translations/article-journey-attribution.js - Journey Resolution & Attribution Article
window.journeyAttributionTranslations = {
  en: {
    // Page Meta
    meta: {
      title: "Resolve Once, Hydrate Many: A DAX Attribution Pattern - DataArcus",
      description: "Why matching the same lead five times produces disagreeing KPIs, and the DAX pattern that resolves attribution once and reuses it everywhere.",
      keywords: "lead attribution, DAX pattern, Power BI data modeling, journey resolution, CRM analytics, DataArcus, data engineering",
      author: "DataArcus",
      "og:type": "article",
      "og:title": "Resolve Once, Hydrate Many: A DAX Attribution Pattern - DataArcus",
      "og:description": "Why matching the same lead five times produces disagreeing KPIs, and the DAX pattern that resolves attribution once and reuses it everywhere.",
      "og:url": "https://dataarcus.com/articles/article-journey-attribution.html",
      "og:site_name": "DataArcus",
      "og:image": "https://dataarcus.com/assets/img/portfolio/pulse-preview.jpg",
      "og:image:alt": "A preview of the DataArcus Pulse automotive CRM intelligence dashboard.",
      "og:locale": "en_US",
      "og:article:published_time": "2026-09-01T09:00:00Z",
      "og:article:author": "Abdelrahman M.",
      "twitter:card": "summary_large_image",
      "twitter:title": "Resolve Once, Hydrate Many: A DAX Attribution Pattern - DataArcus",
      "twitter:description": "Why matching the same lead five times produces disagreeing KPIs, and the DAX pattern that resolves attribution once and reuses it everywhere.",
      "twitter:image": "https://dataarcus.com/assets/img/portfolio/pulse-preview.jpg",
      canonical: "https://dataarcus.com/articles/article-journey-attribution.html",
    },

    // Article Header
    header: {
      title: "Resolve Once, Hydrate Many: A DAX Pattern for Lead Attribution",
      subtitle: "Posted on September 1, 2026"
    },

    // Article Content
    content: {
      p1: "Ask three different reports \"how many leads did Campaign X actually convert?\" and you'll often get three different numbers. Not because anyone lied — because each report matched the same lead to a call, an outcome, and an invoice using slightly different logic.",
      p2: "This is the <strong>Attribution Gap</strong>: the same customer journey gets re-resolved independently every time a new measure needs to know \"what happened to this lead.\" Small differences in matching logic — a different date window, a different tie-breaker — compound into KPIs that quietly disagree with each other.",
      p3: "This is the exact problem we solved while building <a href='../dashboards/dataarcus-pulse.html' class='text-accent'>DataArcus Pulse</a>, our anonymized automotive CRM intelligence model. The fix is a pattern we call <strong>Resolve Once, Hydrate Many</strong>, and it changed how every downstream measure in the model behaves.",

      h_sec1: "The Problem: Five Reports, Five Different Answers",
      p_sec1_1: "In a dealership CRM, a single lead can touch dozens of records: multiple calls, several statuses, and eventually — maybe — an invoice. The natural instinct is to let every report answer its own question independently: the Sales report looks up the invoice, the Call report looks up the last call, the Qualification report looks up the latest status.",
      p_sec1_2: "The problem is that <strong>\"independently\" means inconsistently</strong>. If the Sales report resolves a lead to its journey using one join condition, and the Qualification report uses a slightly different one, the two reports can disagree on whether the same lead is even the same journey — especially once a lead has multiple call attempts spread across days.",
      p_sec1_3: "Multiply this by 410 measures and 24 tables, and you get a dashboard where every page is individually correct but collectively untrustworthy. Executives stop asking \"what's the number\" and start asking \"which report's number.\"",

      h_sec2: "Resolve Once: A Single Source of Truth for Every Lead",
      p_sec2_1: "The fix isn't a smarter join — it's fewer joins. We built one column, a <strong>Matched Journey Key</strong>, whose only job is to resolve each lead to exactly one call journey, using one consistent set of tie-breaking rules.",
      p_sec2_2: "Before replacing the old, scattered logic, we validated the new key against every existing measure that depended on lead-to-journey matching: <strong>54,403 out of 54,403 leads</strong> resolved to an identical journey under both the old and new logic. Only after that exact match did the old logic get retired.",
      p_sec2_3: "That single validation pass is what makes the pattern trustworthy — not just for us, but for anyone reading the model later. One resolved key, proven correct once, is worth more than a dozen independently \"probably correct\" joins.",

      h_sec3: "Hydrate Many: Reusing the Resolution Everywhere",
      p_sec3_1: "Once a lead's journey is resolved, every other measure that needs to know something about that journey — status, terminal reason, invoice, agent, outcome — becomes a thin <strong>LOOKUPVALUE</strong> read off the Matched Journey Key, instead of its own independent matching logic.",
      p_sec3_2: "This has a second benefit beyond correctness: it turns 400+ measures into <strong>documentation</strong>. Reading a downstream measure's DAX tells you exactly which single source of truth it depends on, instead of hiding a re-derivation of matching logic inside every formula.",
      p_sec3_3: "The result in DataArcus Pulse: 54,574 leads, 113,321 calls, and 72,013 call journeys that agree with each other across every page — from Executive Overview to Sales &amp; Attribution — because they all trace back to the same resolved key."
    },

    // Explore More & Final CTA
    exploreMore: {
      title: "See the Pattern in a Live Model",
      subtitle: "Explore DataArcus Pulse, the anonymized dashboard built on this exact attribution pattern.",
      button: "View DataArcus Pulse"
    },
    finalCta: {
      title: "Struggling With Numbers That Don't Agree?",
      subtitle: "We can audit your model's matching logic and build a single, trustworthy resolution layer.",
      button: "Book a Data Model Audit"
    }
  },

  ar: {
    // Page Meta
    meta: {
      title: "حلّ مرة واحدة، غذِّ كل مكان: نمط DAX لعزو العملاء المحتملين - داتا أركوس",
      description: "لماذا تُنتج مطابقة نفس العميل المحتمل خمس مرات مؤشرات أداء متضاربة، ونمط DAX الذي يحل العزو مرة واحدة ويعيد استخدامه في كل مكان.",
      keywords: "عزو العملاء المحتملين, نمط DAX, نمذجة بيانات Power BI, حل الرحلات, تحليلات CRM, داتا أركوس, هندسة البيانات",
      author: "داتا أركوس",
      "og:type": "article",
      "og:title": "حلّ مرة واحدة، غذِّ كل مكان: نمط DAX لعزو العملاء المحتملين - داتا أركوس",
      "og:description": "لماذا تُنتج مطابقة نفس العميل المحتمل خمس مرات مؤشرات أداء متضاربة، ونمط DAX الذي يحل العزو مرة واحدة ويعيد استخدامه في كل مكان.",
      "og:url": "https://dataarcus.com/articles/article-journey-attribution.html",
      "og:site_name": "داتا أركوس",
      "og:image": "https://dataarcus.com/assets/img/portfolio/pulse-preview.jpg",
      "og:image:alt": "معاينة للوحة تحكم داتا أركوس بلس لذكاء CRM لقطاع السيارات.",
      "og:locale": "ar_EG",
      "og:article:published_time": "2026-09-01T09:00:00Z",
      "og:article:author": "عبد الرحمن م.",
      "twitter:card": "summary_large_image",
      "twitter:title": "حلّ مرة واحدة، غذِّ كل مكان: نمط DAX لعزو العملاء المحتملين - داتا أركوس",
      "twitter:description": "لماذا تُنتج مطابقة نفس العميل المحتمل خمس مرات مؤشرات أداء متضاربة، ونمط DAX الذي يحل العزو مرة واحدة ويعيد استخدامه في كل مكان.",
      "twitter:image": "https://dataarcus.com/assets/img/portfolio/pulse-preview.jpg",
      canonical: "https://dataarcus.com/articles/article-journey-attribution.html",
    },

    // Article Header
    header: {
      title: "حلّ مرة واحدة، غذِّ كل مكان: نمط DAX لعزو العملاء المحتملين",
      subtitle: "نُشر في 1 سبتمبر 2026"
    },

    // Article Content
    content: {
      p1: "اسأل ثلاثة تقارير مختلفة \"كم عدد العملاء المحتملين الذين حوّلتهم الحملة X فعليًا؟\" وستحصل غالبًا على ثلاثة أرقام مختلفة. ليس لأن أحدًا كذب — بل لأن كل تقرير طابق نفس العميل المحتمل بمكالمة ونتيجة وفاتورة باستخدام منطق مختلف قليلاً.",
      p2: "هذه هي <strong>فجوة العزو</strong>: يُعاد حل رحلة العميل نفسها بشكل مستقل في كل مرة يحتاج فيها مقياس جديد لمعرفة \"ماذا حدث لهذا العميل المحتمل\". الفروقات الصغيرة في منطق المطابقة — نافذة تاريخ مختلفة، قاعدة ترجيح مختلفة — تتراكم لتنتج مؤشرات أداء تتعارض مع بعضها بصمت.",
      p3: "هذه هي المشكلة بالضبط التي حللناها أثناء بناء <a href='../dashboards/dataarcus-pulse.html' class='text-accent'>داتا أركوس بلس</a>، نموذج ذكاء CRM لقطاع السيارات المخفي الهوية. الحل هو نمط نسميه <strong>حلّ مرة واحدة، غذِّ كل مكان</strong>، وقد غيّر طريقة عمل كل مقياس تابع في النموذج.",

      h_sec1: "المشكلة: خمسة تقارير، خمس إجابات مختلفة",
      p_sec1_1: "في نظام CRM لوكالة سيارات، يمكن لعميل محتمل واحد أن يلامس عشرات السجلات: مكالمات متعددة، عدة حالات، وفي النهاية — ربما — فاتورة. الغريزة الطبيعية هي ترك كل تقرير يجيب على سؤاله بشكل مستقل: تقرير المبيعات يبحث عن الفاتورة، تقرير المكالمات يبحث عن آخر مكالمة، تقرير التأهيل يبحث عن أحدث حالة.",
      p_sec1_2: "المشكلة أن <strong>\"بشكل مستقل\" تعني بشكل غير متسق</strong>. إذا حلّ تقرير المبيعات رحلة العميل باستخدام شرط ربط واحد، واستخدم تقرير التأهيل شرطًا مختلفًا قليلاً، يمكن أن يختلف التقريران حول ما إذا كان نفس العميل المحتمل هو نفس الرحلة أصلاً — خاصة عندما يكون لدى العميل محاولات اتصال متعددة موزعة على عدة أيام.",
      p_sec1_3: "اضرب هذا في 410 مقياسًا و24 جدولاً، وستحصل على لوحة تحكم كل صفحة فيها صحيحة على حدة لكنها غير موثوقة مجتمعة. يتوقف المديرون التنفيذيون عن سؤال \"ما هو الرقم\" ويبدؤون بسؤال \"رقم أي تقرير\".",

      h_sec2: "حلّ مرة واحدة: مصدر حقيقة واحد لكل عميل محتمل",
      p_sec2_1: "الحل ليس ربطًا أذكى — بل عدد أقل من الربط. بنينا عمودًا واحدًا، <strong>مفتاح الرحلة المطابقة</strong>، وظيفته الوحيدة هي حل كل عميل محتمل إلى رحلة اتصال واحدة بالضبط، باستخدام مجموعة واحدة ثابتة من قواعد الترجيح.",
      p_sec2_2: "قبل استبدال المنطق القديم المتناثر، تحققنا من المفتاح الجديد مقابل كل مقياس موجود كان يعتمد على مطابقة العميل المحتمل بالرحلة: <strong>54,403 من أصل 54,403 عميل محتمل</strong> تم حلّهم إلى نفس الرحلة تمامًا تحت المنطقين القديم والجديد. لم يُلغَ المنطق القديم إلا بعد هذه المطابقة الكاملة.",
      p_sec2_3: "عملية التحقق الواحدة هذه هي ما يجعل النمط موثوقًا — ليس فقط لنا، بل لأي شخص يقرأ النموذج لاحقًا. مفتاح واحد تم حله وإثبات صحته مرة واحدة يساوي أكثر من عشرات الروابط المستقلة \"الصحيحة على الأرجح\".",

      h_sec3: "غذِّ كل مكان: إعادة استخدام الحل في كل مكان",
      p_sec3_1: "بمجرد حل رحلة العميل المحتمل، يصبح كل مقياس آخر يحتاج لمعرفة شيء عن تلك الرحلة — الحالة، سبب الإنهاء، الفاتورة، الوكيل، النتيجة — قراءة بسيطة عبر <strong>LOOKUPVALUE</strong> من مفتاح الرحلة المطابقة، بدلاً من منطق مطابقة مستقل خاص به.",
      p_sec3_2: "لهذا فائدة ثانية إلى جانب الدقة: إنه يحوّل أكثر من 400 مقياس إلى <strong>توثيق</strong>. قراءة كود DAX لمقياس تابع تخبرك بالضبط بمصدر الحقيقة الوحيد الذي يعتمد عليه، بدلاً من إخفاء إعادة اشتقاق منطق المطابقة داخل كل معادلة.",
      p_sec3_3: "النتيجة في داتا أركوس بلس: 54,574 عميلاً محتملاً، و113,321 مكالمة، و72,013 رحلة اتصال تتفق جميعها مع بعضها عبر كل صفحة — من النظرة التنفيذية العامة إلى المبيعات والعزو — لأنها جميعًا تعود إلى نفس المفتاح المحلول."
    },

    // Explore More & Final CTA
    exploreMore: {
      title: "شاهد النمط في نموذج حي",
      subtitle: "استكشف داتا أركوس بلس، لوحة التحكم المخفية الهوية المبنية على نمط العزو هذا بالضبط.",
      button: "عرض داتا أركوس بلس"
    },
    finalCta: {
      title: "أرقامك لا تتفق مع بعضها؟",
      subtitle: "يمكننا مراجعة منطق المطابقة في نموذجك وبناء طبقة حل واحدة موثوقة.",
      button: "احجز مراجعة نموذج بيانات"
    }
  }
};
