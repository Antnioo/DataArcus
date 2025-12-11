// translations/article-evm.js - EVM & Project Risk Article
window.evmTranslations = {
  en: {
    // Page Meta
    meta: {
      title: "Beyond 'Traffic Lights': How EVM Predicts Project Risk - DataArcus",
      description: "Stop relying on subjective 'Green/Amber/Red' status reports. Learn how Earned Value Management (EVM) metrics like CPI and SPI mathematically forecast project delays.",
      keywords: "Earned Value Management, EVM, Project Risk, Power BI for PMO, CPI, SPI, DataArcus, Fintech Project Management",
      author: "DataArcus",
      "og:type": "article",
      "og:title": "Beyond 'Traffic Lights': How EVM Predicts Project Risk - DataArcus",
      "og:description": "Stop relying on subjective 'Green/Amber/Red' status reports. Learn how Earned Value Management (EVM) metrics like CPI and SPI mathematically forecast project delays.",
      "og:url": "https://dataarcus.com/articles/article-evm.html",
      "og:site_name": "DataArcus",
      "og:image": "https://dataarcus.com/assets/img/portfolio/fintech-preview.jpg", // Re-using the dashboard image or a specific blog image
      "og:image:alt": "A dashboard showing project risk timelines.",
      "og:locale": "en_US",
      "og:article:published_time": "2025-12-10T09:00:00Z",
      "og:article:author": "Abdelrahman M.",
      "twitter:card": "summary_large_image",
      "twitter:title": "Beyond 'Traffic Lights': How EVM Predicts Project Risk - DataArcus",
      "twitter:description": "Stop relying on subjective status reports. Learn how CPI and SPI mathematically forecast project delays.",
      "twitter:image": "https://dataarcus.com/assets/img/portfolio/fintech-preview.jpg",
      canonical: "https://dataarcus.com/articles/article-evm.html",
    },
    
    // Article Header
    header: {
      title: "Beyond \"Traffic Lights\": How Earned Value Management (EVM) Predicts Project Risk",
      subtitle: "Posted on December 10, 2025"
    },

    // Article Content
    content: {
      p1: "We've all seen the <strong>'Watermelon Project'</strong>. In every weekly status meeting, the project manager reports the status as 'Green' (On Track). Green, green, green... until suddenly, one week before the deadline, it turns bright 'Red' (Critical Delay).",
      p2: "This happens because traditional status reporting is <strong>subjective</strong>. It relies on feelings, optimism, and the fear of reporting bad news. But in high-stakes industries like Fintech, you can't afford to run projects on feelings. You need math.",
      p3: "This is where <strong>Earned Value Management (EVM)</strong> comes in. It is the methodology we used to build our <a href='../dashboards/fintech-dashboard.html' class='text-accent'>Fintech Portfolio Risk Engine</a>, and it's the only way to mathematically predict a project's landing spot.",

      h_sec1: "The Two Metrics That Don't Lie: CPI & SPI",
      p_sec1_1: "EVM strips away the opinion and looks at two hard numbers:",
      p_sec1_2: "<strong>1. Cost Performance Index (CPI):</strong> Are you getting $1 of value for every $1 you spend?<br><em>Formula: Earned Value / Actual Cost</em><br>If your CPI is 0.8, you are losing 20 cents on every dollar. You <strong>will</strong> go over budget unless something changes.",
      p_sec1_3: "<strong>2. Schedule Performance Index (SPI):</strong> Are you progressing at the planned speed?<br><em>Formula: Earned Value / Planned Value</em><br>If your SPI is 0.9, you are working at 90% efficiency. You <strong>will</strong> be late.",

      h_sec2: "Moving From Tracking to Prediction",
      p_sec2_1: "Most dashboards just show you 'Actual vs. Budget'. That looks backward. The power of EVM is that it looks <strong>forward</strong>.",
      p_sec2_2: "By calculating your current SPI, we can mathematically forecast your <strong>Predicted End Date</strong>. If a project has a 6-month timeline but is running at an SPI of 0.8, Power BI can instantly calculate that it will actually take 7.5 months.",
      p_sec2_3: "This turns your PMO from a 'reporting bureau' into an <strong>Early Warning System</strong>. You can flag projects that are <em>currently</em> Green but are <em>mathematically predicted</em> to turn Red next month.",

      h_sec3: "Automating Governance in Power BI",
      p_sec3_1: "Historically, EVM was hard because it required complex Excel sheets. Today, we automate this in Power BI.",
      p_sec3_2: "In our <strong>Fintech Portfolio Risk Engine</strong>, we ingest data from Jira (for progress) and SAP/Oracle (for actual costs). We then use DAX to calculate CPI and SPI in real-time for every single project.",
      p_sec3_3: "The result? A 'Control Tower' view where executives can see exactly which of their 72 active projects are drifting off course, quantified by the exact dollar amount of risk."
    },
    
    // Explore More & Final CTA
    exploreMore: {
      title: "See EVM in Action",
      subtitle: "Check out the live dashboard that uses these exact metrics.",
      button: "View Fintech Dashboard"
    },
    finalCta: {
      title: "Stop Flying Blind on Project Risk",
      subtitle: "We can audit your project data and build a predictive risk model in 7 days.",
      button: "Book a PMO Strategy Call"
    }
  },

  ar: {
    // Page Meta
    meta: {
      title: "ما وراء 'إشارات المرور': كيف تتنبأ EVM بمخاطر المشروع - داتا أركوس",
      description: "توقف عن الاعتماد على تقارير الحالة الذاتية. تعلم كيف تستخدم إدارة القيمة المكتسبة (EVM) للتنبؤ رياضيًا بتأخيرات المشروع.",
      keywords: "إدارة القيمة المكتسبة, مخاطر المشروع, Power BI, CPI, SPI, داتا أركوس, إدارة مشاريع التكنولوجيا المالية",
      author: "داتا أركوس",
      "og:type": "article",
      "og:title": "ما وراء 'إشارات المرور': كيف تتنبأ EVM بمخاطر المشروع - داتا أركوس",
      "og:description": "توقف عن الاعتماد على تقارير الحالة الذاتية. تعلم كيف تستخدم إدارة القيمة المكتسبة (EVM) للتنبؤ رياضيًا بتأخيرات المشروع.",
      "og:url": "https://dataarcus.com/articles/article-evm.html",
      "og:site_name": "داتا أركوس",
      "og:image": "https://dataarcus.com/assets/img/portfolio/fintech-preview.jpg",
      "og:image:alt": "لوحة تحكم توضح مخاطر المشروع.",
      "og:locale": "ar_EG",
      "og:article:published_time": "2025-12-10T09:00:00Z",
      "og:article:author": "عبد الرحمن م.",
      "twitter:card": "summary_large_image",
      "twitter:title": "ما وراء 'إشارات المرور': كيف تتنبأ EVM بمخاطر المشروع - داتا أركوس",
      "twitter:description": "توقف عن الاعتماد على تقارير الحالة الذاتية. تعلم كيف تستخدم إدارة القيمة المكتسبة (EVM) للتنبؤ رياضيًا بتأخيرات المشروع.",
      "twitter:image": "https://dataarcus.com/assets/img/portfolio/fintech-preview.jpg",
      canonical: "https://dataarcus.com/articles/article-evm.html",
    },
    
    // Article Header
    header: {
      title: "ما وراء \"إشارات المرور\": كيف تتنبأ إدارة القيمة المكتسبة (EVM) بمخاطر المشروع",
      subtitle: "نُشر في 10 ديسمبر 2025"
    },

    // Article Content
    content: {
      p1: "لقد رأينا جميعًا <strong>'مشروع البطيخة'</strong>. في كل اجتماع أسبوعي، يبلغ مدير المشروع أن الحالة 'خضراء' (على المسار الصحيح). خضراء، خضراء... حتى تتحول فجأة، قبل أسبوع واحد من الموعد النهائي، إلى 'حمراء' فاقعة (تأخير حرج).",
      p2: "يحدث هذا لأن تقارير الحالة التقليدية <strong>ذاتية</strong>. تعتمد على المشاعر والتفاؤل والخوف من الإبلاغ عن الأخبار السيئة. ولكن في صناعات حساسة مثل التكنولوجيا المالية، لا يمكنك إدارة المشاريع بناءً على المشاعر. أنت بحاجة إلى الرياضيات.",
      p3: "هنا يأتي دور <strong>إدارة القيمة المكتسبة (EVM)</strong>. إنها المنهجية التي استخدمناها لبناء <a href='../dashboards/fintech-dashboard.html' class='text-accent'>محرك مخاطر محافظ التكنولوجيا المالية</a>، وهي الطريقة الوحيدة للتنبؤ رياضيًا بنقطة هبوط المشروع.",

      h_sec1: "المقياسان اللذان لا يكذبان: CPI و SPI",
      p_sec1_1: "تزيل EVM الآراء وتنظر إلى رقمين صلبين:",
      p_sec1_2: "<strong>1. مؤشر أداء التكلفة (CPI):</strong> هل تحصل على دولار واحد من القيمة مقابل كل دولار تنفقه؟<br><em>المعادلة: القيمة المكتسبة / التكلفة الفعلية</em><br>إذا كان CPI الخاص بك 0.8، فأنت تخسر 20 سنتًا في كل دولار. أنت <strong>ستتجاوز</strong> الميزانية ما لم يتغير شيء.",
      p_sec1_3: "<strong>2. مؤشر أداء الجدول الزمني (SPI):</strong> هل تتقدم بالسرعة المخطط لها؟<br><em>المعادلة: القيمة المكتسبة / القيمة المخططة</em><br>إذا كان SPI الخاص بك 0.9، فأنت تعمل بكفاءة 90%. أنت <strong>ستتأخر</strong> عن الموعد.",

      h_sec2: "الانتقال من التتبع إلى التنبؤ",
      p_sec2_1: "معظم لوحات المعلومات تعرض لك فقط 'الفعلي مقابل الميزانية'. هذا نظر إلى الماضي. قوة EVM تكمن في أنها تنظر إلى <strong>المستقبل</strong>.",
      p_sec2_2: "من خلال حساب SPI الحالي، يمكننا التنبؤ رياضيًا بـ <strong>تاريخ الانتهاء المتوقع</strong>. إذا كان المشروع مدته 6 أشهر ولكنه يعمل بمؤشر SPI قدره 0.8، فيمكن لـ Power BI حساب أنه سيستغرق في الواقع 7.5 أشهر.",
      p_sec2_3: "هذا يحول مكتب إدارة المشاريع (PMO) من 'مكتب تقارير' إلى <strong>نظام إنذار مبكر</strong>. يمكنك تحديد المشاريع التي تظهر <em>حاليًا</em> باللون الأخضر ولكن من <em>المتوقع رياضيًا</em> أن تتحول للأحمر الشهر المقبل.",

      h_sec3: "أتمتة الحوكمة في Power BI",
      p_sec3_1: "تاريخيًا، كانت EVM صعبة لأنها تتطلب جداول Excel معقدة. اليوم، نؤتمت هذا في Power BI.",
      p_sec3_2: "في <strong>محرك مخاطر محافظ التكنولوجيا المالية</strong>، نقوم بسحب البيانات من Jira (للتقدم) و SAP/Oracle (للتكاليف الفعلية). ثم نستخدم DAX لحساب CPI و SPI في الوقت الفعلي لكل مشروع.",
      p_sec3_3: "النتيجة؟ رؤية 'برج مراقبة' حيث يمكن للمديرين التنفيذيين رؤية بالضبط أي من مشاريعهم النشطة الـ 72 ينحرف عن المسار، محددًا بمقدار الخطر المالي الدقيق."
    },
    
    // Explore More & Final CTA
    exploreMore: {
      title: "شاهد EVM أثناء العمل",
      subtitle: "تحقق من لوحة التحكم الحية التي تستخدم هذه المقاييس بالضبط.",
      button: "عرض لوحة تحكم التكنولوجيا المالية"
    },
    finalCta: {
      title: "توقف عن الطيران الأعمى في مخاطر المشروع",
      subtitle: "يمكننا مراجعة بيانات مشاريعك وبناء نموذج مخاطر تنبؤي في 7 أيام.",
      button: "احجز استشارة لمكتب إدارة المشاريع"
    }
  }
};