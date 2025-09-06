// translations/homepage.js - Homepage Specific
window.homepageTranslations = {
  en: {
    // Page Meta
    meta: {
      title: "DataArcus — Expert Power BI & Data Solutions",
      description: "DataArcus delivers custom Power BI dashboards, data engineering, and analytics consulting to help businesses turn raw data into strategic decisions.",
      keywords: "Power BI consulting, data analytics Egypt, business intelligence MENA, custom dashboards, data engineering, DataArcus, Power BI solutions"
    },

    // Hero Section
    hero: {
      title: "From Data Chaos to Actionable Clarity",
      subtitle: "Stop guessing, start knowing. We build powerful Power BI solutions that give decision-makers the confidence to act decisively and drive measurable growth.",
      buttonWork: "Explore Our Work",
      buttonDiscuss: "Discuss Your Project",
      badgeSecurity: "Enterprise Security",
      badgeTurnaround: "Fast Turnaround",
      badgeExcellence: "Committed to Excellence",
      commitmentTitle: "Our Commitment to Excellence",
      commitmentPoints: [
        "Advanced DAX & Power Query Mastery",
        "Real-time Data Pipeline Architecture",
        "Enterprise Governance & Security",
        "Custom Visual Development"
      ]
    },

    // Tech Stack Section
    techStack: {
      powerbi: "Power BI",
      excel: "Excel",
      sql: "SQL",
      azure: "Azure",
      python: "Python",
      tableau: "Tableau"
    },

    // Services Section
    services: {
      title: "Solutions That Drive Performance",
      subtitle: "We don't just process data; we deliver the targeted insights that empower your teams and accelerate business growth.",
      cards: [
        {
          title: "Executive Dashboards",
          desc: "Get a real-time, 360-degree view of your business. We turn complex data into intuitive dashboards so you can track KPIs and spot opportunities instantly."
        },
        {
          title: "Reliable Data Pipelines",
          desc: "Your insights are only as good as your data. We build robust ETL pipelines that ensure your information is accurate, timely, and always ready for analysis."
        },
        {
          title: "Predictive Insights",
          desc: "Look beyond the \"what\" to understand the \"why\" and \"what's next.\" We leverage advanced analytics to uncover hidden trends and forecast future outcomes."
        },
        {
          title: "Secure & Scalable Systems",
          desc: "From governance frameworks to enterprise-grade security, we build solutions that are not only powerful but also compliant and ready to scale with you."
        }
      ]
    },

    // Portfolio Section
    portfolio: {
      title: "Proven Results",
      subtitle: "We measure our success by the success of our clients. Our portfolio is a showcase of the custom-built, high-impact data solutions we've delivered.",
      cardErHealth: {
        badge: "HEALTHCARE ANALYTICS",
        title: "Emergency Room Performance Analysis",
        desc: "An interactive dashboard providing administrators with a clear view of ER operations, patient wait times, and satisfaction scores."
      },
      cardCallCenter: {
        badge: "CUSTOMER SERVICE",
        title: "Call Center Performance",
        desc: "A complete command center for monitoring call center KPIs, tracking agent performance, and improving customer satisfaction through data-driven insights."
      },
      cardAdventure: {
        badge: "ENTERPRISE SALES",
        title: "AdventureWorks Sales & Operations",
        desc: "Our flagship project featuring predictive 'What-If' analysis, deep customer segmentation, and advanced diagnostics in a multi-page command center."
      },
      button: "View All Case Studies"
    },

    // About Section
    about: {
      title: "A Partner in Your Success",
      subtitle: "At DataArcus, we don't just build dashboards—we build data-driven partnerships that empower you to lead with confidence.",
      quote: "\"My name is Abdelrahman M., and I founded DataArcus to eliminate guesswork from business. After 5 years in data analytics, I saw too many brilliant leaders held back by messy, inaccessible data. We exist to bridge that gap.\"",
      p1: "Our approach is built on a deep understanding of both technology and business strategy. We take the time to understand your unique challenges and goals, ensuring that every solution we build is not just technically excellent, but perfectly aligned with the outcomes you need to achieve.",
      founder: "Abdelrahman M., Founder & Lead Data Architect",
      certification: {
        title: "Google Certified",
        subtitle: "Data Analytics Professional", 
        verified: "Verified on Credly"
      },
      statsTitle: "Our Commitment, Measured",
      statsSubtitle: "Our passion is backed by a track record of excellence and reliability.",
      stats: [
        { title: "Projects Delivered" },
        { title: "Avg. First Dashboard Turnaround" }, // UPDATED
        { title: "Uptime SLA" },
        { title: "Client Satisfaction" }
      ],
      ctaTitle: "Ready to See These Numbers Work for You?",
      ctaSubtitle: "Let's turn your data challenges into your greatest advantage. The first step is a simple conversation.",
      ctaButton: "Book Your Free Consultation"
    },

    // FAQ Section
    faq: {
      title: "Your Questions, Answered",
      subtitle: "We've helped 25+ businesses transform their data. Here are the answers to questions every executive asks.", // UPDATED
      items: [
        {
          q: "How quickly can we see our first dashboard?",
          a: "<strong>Our process is built for speed. Most clients receive a custom mockup in 24 hours and a functional, core dashboard within 48-72 hours.</strong> Our full end-to-end project, including deep data modeling and deployment, is typically completed within one week." // UPDATED
        },
        {
          q: "What's the real ROI of a Power BI implementation?",
          a: "<strong>Our clients typically see 300-500% ROI within 6 months.</strong> Here's the math: If your team spends 10 hours/week on manual reporting, that's 520 hours/year. At EGP 200/hour, you're spending EGP 104,000 annually on manual work.<div class=\"mt-3\"><div class=\"row g-3\"><div class=\"col-sm-6\"><div class=\"p-3 rounded\" style=\"background: rgba(253, 121, 168, 0.1);\"><strong>Before:</strong><br>• 10h/week manual reports<br>• Delayed decisions<br>• Data inconsistencies</div></div><div class=\"col-sm-6\"><div class=\"p-3 rounded\" style=\"background: rgba(0, 206, 201, 0.1);\"><strong>After:</strong><br>• 30min/week monitoring<br>• Real-time insights<br>• Confident decisions</div></div></div></div>"
        },
        {
          q: "How do you handle our sensitive business data?",
          a: "<strong>Your data never leaves your control.</strong> We work within your existing Microsoft environment using row-level security, encrypted connections, and enterprise-grade governance.<div class=\"mt-3\"><div class=\"d-flex align-items-start mb-2\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>NDA signed before any data access</span></div><div class=\"d-flex align-items-start mb-2\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>Data stays in your Microsoft tenant</span></div><div class=\"d-flex align-items-start mb-2\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>Role-based access controls implemented</span></div><div class=\"d-flex align-items-start\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>Full audit trail of all activities</span></div></div>"
        },
        {
          q: "What if our data is a mess? Excel files, old systems, manual processes?",
          a: "<strong>Perfect! That's exactly what we specialize in.</strong> 80% of our clients start with \"messy\" data. We've connected everything from legacy ERP systems to Google Sheets.<div class=\"mt-3 p-3 rounded\" style=\"background: rgba(108, 92, 231, 0.1);\"><strong>We connect to:</strong> Excel files, SQL databases, Oracle, SAP, Salesforce, QuickBooks, Google Analytics, APIs, web scraping, manual uploads, and 200+ other sources.</div><p class=\"mt-3 mb-0\"><em>\"The messier your data, the bigger the transformation impact.\"</em></p>"
        },
        {
          q: "Will our team be able to use and maintain the dashboards?",
          a: "<strong>Absolutely. We build for your team's skill level and provide comprehensive training.</strong> Every project includes user training and documentation. Plus, we offer ongoing support packages.<div class=\"mt-3\"><div class=\"row g-2 small\"><div class=\"col-md-6\"><strong class=\"text-accent\">For End Users:</strong><br>• How to read dashboards<br>• Filtering and drilling down<br>• Export and sharing options</div><div class=\"col-md-6\"><strong class=\"text-accent\">For Admins:</strong><br>• Data refresh schedules<br>• User permissions<br>• Basic troubleshooting</div></div></div>"
        },
        {
          q: "Why choose DataArcus over freelancers or big consulting firms?",
          a: "<strong>We're the sweet spot between cost and quality.</strong> Freelancers lack enterprise experience. Big firms charge 10x more and take 10x longer. We deliver enterprise-quality work at startup speed.<div class=\"mt-3\"><div class=\"row g-3\"><div class=\"col-md-4 text-center\"><div class=\"p-3 rounded\" style=\"background: rgba(253, 121, 168, 0.1);\"><strong>Freelancers</strong><br><small>Cheap but risky<br>Limited expertise<br>No support</small></div></div><div class=\"col-md-4 text-center\"><div class=\"p-3 rounded\" style=\"background: rgba(0, 212, 255, 0.1); border: 2px solid var(--accent);\"><strong>DataArcus</strong><br><small>Best value<br>Proven expertise<br>Ongoing partnership</small></div></div><div class=\"col-md-4 text-center\"><div class=\"p-3 rounded\" style=\"background: rgba(100, 116, 139, 0.1);\"><strong>Big Firms</strong><br><small>Expensive & slow<br>Junior staff<br>Cookie-cutter</small></div></div></div></div>"
        },
        {
          q: "What if we're not sure what we need?",
          a: "<strong>That's exactly why we start with a free data assessment.</strong> We'll audit your current setup and recommend the best path forward - no commitment required. Most clients discover opportunities they never knew existed."
        }
      ]
    },

    // Final CTA Section
    finalCta: {
      title: "Ready to Transform Your Data Strategy?",
      subtitle: "Share your data challenges with us and receive a custom dashboard mockup within 24 hours. No commitment required.",
      button: "Start Your Project"
    },

    // Contact Section
    contact: {
      title: "Let's Discuss Your Data Challenges",
      subtitle: "Tell us about your data landscape and the insights you need to drive your business forward.",
      form: {
        name: "Full Name *",
        email: "Business Email *",
        company: "Company",
        budget: "Estimated Budget",
        budgetText: "Select range (USD)",
        details: "Project Details *",
        placeholder: "Describe your data sources, key metrics, and desired outcomes...",
        button: "Send Message",
        response: "Response within 4 hours"
      },
      checklist: {
        title: "Discovery Checklist",
        items: [
          {
            title: "Business Objectives",
            desc: "What decisions need to be made faster or better?"
          },
          {
            title: "Data Sources",
            desc: "Excel files, databases, CRM, ERP systems, APIs"
          },
          {
            title: "Key Stakeholders",
            desc: "Who will be using the dashboards daily?"
          },
          {
            title: "Success Metrics",
            desc: "How will we measure project success?"
          }
        ]
      },
      timeline: {
        title: "Full Project Timeline", // UPDATED
        items: [
          {
            label: "Discovery & Planning",
            value: "Day 1"
          },
          {
            label: "Data Modeling & ETL",
            value: "Day 2-3"
          },
          {
            label: "Dashboard Development",
            value: "Day 4-5"
          },
          {
            label: "Testing & Deployment",
            value: "Day 6-7"
          }
        ]
      }
    }
  },

  ar: {
    // Page Meta
    meta: {
      title: "DataArcus — حلول متخصصة في Power BI وتحليل البيانات",
      description: "تقدم DataArcus لوحات تحكم Power BI مخصصة، وخدمات هندسة بيانات، واستشارات تحليلية لمساعدة الشركات على تحويل بياناتها الأولية إلى قرارات استراتيجية.",
      keywords: "استشارات Power BI, تحليل بيانات في مصر, ذكاء الأعمال, لوحات تحكم مخصصة, هندسة بيانات, DataArcus, حلول Power BI"
    },

    // Hero Section
    hero: {
      title: "من فوضى البيانات إلى وضوح يدعم القرار",
      subtitle: "توقف عن التخمين، وابدأ في اتخاذ قرارات مبنية على الحقائق. نحن نبني حلول Power BI قوية تمنح صانعي القرار الثقة لاتخاذ إجراءات حاسمة وتحقيق نمو قابل للقياس.",
      buttonWork: "استكشف أعمالنا",
      buttonDiscuss: "ناقش مشروعك",
      badgeSecurity: "أمان على مستوى المؤسسات",
      badgeTurnaround: "تنفيذ سريع",
      badgeExcellence: "ملتزمون بالتميز",
      commitmentTitle: "التزامنا بالتميز",
      commitmentPoints: [
        "إتقان متقدم للغات DAX و Power Query",
        "بنية تحتية لخطوط البيانات تعمل لحظيًا",
        "حوكمة وأمان على مستوى المؤسسات",
        "تطوير واجهات مرئية مخصصة"
      ]
    },

    // Tech Stack Section
    techStack: {
      powerbi: "Power BI",
      excel: "Excel",
      sql: "SQL",
      azure: "Azure",
      python: "Python",
      tableau: "Tableau"
    },

    // Services Section
    services: {
      title: "حلول تعزز الأداء",
      subtitle: "نحن لا نكتفي بمعالجة البيانات؛ بل نقدم الرؤى المستهدفة التي تمكّن فرق عملك وتسرّع نمو أعمالك.",
      cards: [
        {
          title: "لوحات تحكم تنفيذية",
          desc: "احصل على رؤية شاملة ولحظية لأعمالك. نحن نحوّل البيانات المعقدة إلى لوحات تحكم سهلة الاستخدام تمكّنك من تتبع مؤشرات الأداء الرئيسية واكتشاف الفرص فورًا."
        },
        {
          title: "خطوط بيانات موثوقة",
          desc: "جودة رؤيتك تعتمد على جودة بياناتك. نحن نبني خطوط بيانات (ETL) قوية تضمن أن تكون معلوماتك دقيقة، محدّثة، وجاهزة دائمًا للتحليل."
        },
        {
          title: "رؤى تنبؤية",
          desc: "تجاوز مرحلة 'ماذا حدث' لفهم 'لماذا' و 'ماذا بعد'. نحن نستخدم التحليلات المتقدمة للكشف عن الاتجاهات الخفية والتنبؤ بالنتائج المستقبلية."
        },
        {
          title: "أنظمة آمنة وقابلة للتطوير",
          desc: "بدءًا من أطر الحوكمة وحتى الأمان على مستوى المؤسسات، نبني حلولاً ليست قوية فحسب، بل متوافقة مع المعايير وجاهزة للنمو مع شركتك."
        }
      ]
    },

    // Portfolio Section
    portfolio: {
      title: "نتائج مُثبتة",
      subtitle: "نحن نقيس نجاحنا بنجاح عملائنا. معرض أعمالنا هو عرض لحلول البيانات عالية التأثير والمصممة خصيصًا التي قدمناها.",
      cardErHealth: {
        badge: "تحليلات الرعاية الصحية",
        title: "تحليل أداء غرف الطوارئ",
        desc: "لوحة تحكم تفاعلية توفر للمديرين رؤية واضحة لعمليات الطوارئ، وأوقات انتظار المرضى، ومؤشرات رضاهم."
      },
      cardCallCenter: {
        badge: "خدمة العملاء",
        title: "أداء مركز الاتصال",
        desc: "مركز تحكم متكامل لمراقبة مؤشرات الأداء الرئيسية، وتتبع أداء الموظفين، وتحسين رضا العملاء من خلال رؤى قائمة على البيانات."
      },
      cardAdventure: {
        badge: "مبيعات الشركات",
        title: "تحليل مبيعات وعمليات AdventureWorks",
        desc: "مشروعنا الرائد الذي يتميز بتحليل 'ماذا لو' التنبؤي، وتقسيم عميق للعملاء، وتشخيصات متقدمة في مركز تحكم متعدد الصفحات."
      },
      button: "عرض كل دراسات الحالة"
    },

    // About Section
    about: {
      title: "شريك في نجاحك",
      subtitle: "في DataArcus، لا نكتفي ببناء لوحات التحكم، بل نبني شراكات قائمة على البيانات تمكّنك من القيادة بثقة.",
      quote: "\"اسمي عبد الرحمن م.، وأسست DataArcus للقضاء على التخمين في عالم الأعمال. بعد 5 سنوات في تحليل البيانات، رأيت العديد من القادة المتميزين تعيقهم البيانات الفوضوية التي يصعب الوصول إليها. نحن هنا لسد هذه الفجوة.\"",
      p1: "يقوم نهجنا على فهم عميق للتكنولوجيا واستراتيجية الأعمال. نأخذ الوقت الكافي لفهم تحدياتك وأهدافك الفريدة، لضمان أن كل حل نبنيه ليس ممتازًا من الناحية التقنية فحسب، بل متوافق تمامًا مع النتائج التي تسعى لتحقيقها.",
      founder: "عبد الرحمن م.، المؤسس وكبير مهندسي البيانات",
      certification: {
        title: "شهادة Google",
        subtitle: "محترف تحليل البيانات",
        verified: "موثق عبر Credly"
      },
      statsTitle: "التزامنا بالأرقام",
      statsSubtitle: "شغفنا مدعوم بسجل حافل من التميز والموثوقية.",
      stats: [
        { title: "مشروعاً تم تسليمه" },
        { title: "متوسط تسليم أول لوحة تحكم" },
        { title: "اتفاقية مستوى الخدمة" },
        { title: "رضا العملاء" }
      ],
      ctaTitle: "هل أنت مستعد لترى هذه الأرقام تعمل لصالحك؟",
      ctaSubtitle: "دعنا نحوّل تحديات بياناتك إلى أعظم ميزة لديك. الخطوة الأولى هي محادثة بسيطة.",
      ctaButton: "احجز استشارتك المجانية"
    },

    // FAQ Section
    faq: {
      title: "الأسئلة الشائعة",
      subtitle: "لقد ساعدنا أكثر من 25 شركة على تحويل بياناتها. إليك إجابات للأسئلة التي يطرحها كل مدير تنفيذي.",
      items: [
        {
          q: "ما مدى سرعة رؤية أول لوحة تحكم؟",
          a: "<strong>عمليتنا مصممة للسرعة. يحصل معظم العملاء على نموذج أولي مخصص خلال 24 ساعة ولوحة تحكم أساسية فعّالة في غضون 48-72 ساعة.</strong> وعادةً ما يكتمل مشروعنا بالكامل، بما في ذلك نمذجة البيانات العميقة والنشر، في غضون أسبوع واحد."
        },
        {
          q: "ما هو العائد الحقيقي على الاستثمار (ROI) من تطبيق Power BI؟",
          a: "<strong>عادةً ما يحقق عملاؤنا عائدًا على الاستثمار يتراوح بين 300-500% في غضون 6 أشهر.</strong> إليك الحساب: إذا كان فريقك يقضي 10 ساعات أسبوعيًا في إعداد التقارير اليدوية، فهذا يعني 520 ساعة سنويًا. بتكلفة 200 جنيه مصري/ساعة، فأنت تنفق 104,000 جنيه مصري سنويًا على العمل اليدوي.<div class=\"mt-3\"><div class=\"row g-3\"><div class=\"col-sm-6\"><div class=\"p-3 rounded\" style=\"background: rgba(253, 121, 168, 0.1);\"><strong>قبل:</strong><br>• ١٠ ساعات/أسبوع تقارير يدوية<br>• قرارات متأخرة<br>• بيانات غير متسقة</div></div><div class=\"col-sm-6\"><div class=\"p-3 rounded\" style=\"background: rgba(0, 206, 201, 0.1);\"><strong>بعد:</strong><br>• ٣٠ دقيقة/أسبوع للمراقبة<br>• رؤى لحظية<br>• قرارات واثقة</div></div></div></div>"
        },
        {
          q: "كيف تتعاملون مع بيانات أعمالنا الحساسة؟",
          a: "<strong>بياناتك لا تغادر بيئة عملك أبدًا.</strong> نحن نعمل داخل بيئة Microsoft الخاصة بك باستخدام الأمان على مستوى الصف (RLS)، والاتصالات المشفرة، والحوكمة على مستوى المؤسسات.<div class=\"mt-3\"><div class=\"d-flex align-items-start mb-2\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>توقيع اتفاقية سرية (NDA) قبل الوصول لأي بيانات</span></div><div class=\"d-flex align-items-start mb-2\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>تبقى البيانات داخل حساب Microsoft الخاص بك</span></div><div class=\"d-flex align-items-start mb-2\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>تطبيق ضوابط الوصول المستندة إلى الأدوار الوظيفية</span></div><div class=\"d-flex align-items-start\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>سجل تدقيق كامل لجميع الأنشطة</span></div></div>"
        },
        {
          q: "ماذا لو كانت بياناتنا فوضوية؟ (ملفات Excel، أنظمة قديمة، عمليات يدوية)",
          a: "<strong>ممتاز! هذا هو تخصصنا بالضبط.</strong> 80% من عملائنا يبدأون ببيانات \"فوضوية\". لقد قمنا بربط كل شيء بدءًا من أنظمة ERP القديمة إلى جداول بيانات Google.<div class=\"mt-3 p-3 rounded\" style=\"background: rgba(108, 92, 231, 0.1);\"><strong>نحن نتصل بـ:</strong> ملفات Excel، قواعد بيانات SQL، Oracle، SAP، Salesforce، QuickBooks، Google Analytics، واجهات برمجة التطبيقات (APIs)، استخلاص البيانات من الويب، والملفات اليدوية، وأكثر من 200 مصدر آخر.</div><p class=\"mt-3 mb-0\"><em>\"كلما كانت بياناتك أكثر فوضوية، كان تأثير التحول أكبر.\"</em></p>"
        },
        {
          q: "هل سيتمكن فريقنا من استخدام وصيانة لوحات التحكم؟",
          a: "<strong>بالتأكيد. نحن نبني الحلول لتناسب مستوى مهارة فريقك ونقدم تدريبًا شاملاً.</strong> يتضمن كل مشروع تدريبًا للمستخدمين ووثائق كاملة. بالإضافة إلى ذلك، نقدم باقات دعم مستمرة.<div class=\"mt-3\"><div class=\"row g-2 small\"><div class=\"col-md-6\"><strong class=\"text-accent\">للمستخدمين:</strong><br>• كيفية قراءة لوحات التحكم<br>• الفلترة والتعمق في البيانات<br>• خيارات التصدير والمشاركة</div><div class=\"col-md-6\"><strong class=\"text-accent\">للمسؤولين:</strong><br>• جدولة تحديث البيانات<br>• صلاحيات المستخدمين<br>• استكشاف الأخطاء الأساسية</div></div></div>"
        },
        {
          q: "لماذا أختار DataArcus بدلاً من المستقلين أو شركات الاستشارات الكبرى؟",
          a: "<strong>نحن نمثل التوازن المثالي بين التكلفة والجودة.</strong> المستقلون يفتقرون إلى خبرة العمل مع الشركات الكبيرة. والشركات الكبرى تتقاضى 10 أضعاف التكلفة وتستغرق 10 أضعاف الوقت. نحن نقدم عملًا بجودة مؤسسية وبسرعة شركة ناشئة.<div class=\"mt-3\"><div class=\"row g-3\"><div class=\"col-md-4 text-center\"><div class=\"p-3 rounded\" style=\"background: rgba(253, 121, 168, 0.1);\"><strong>المستقلون</strong><br><small>تكلفة أقل ولكن مخاطرة أعلى<br>خبرة محدودة<br>لا يوجد دعم</small></div></div><div class=\"col-md-4 text-center\"><div class=\"p-3 rounded\" style=\"background: rgba(0, 212, 255, 0.1); border: 2px solid var(--accent);\"><strong>DataArcus</strong><br><small>أفضل قيمة<br>خبرة مُثبتة<br>شراكة مستمرة</small></div></div><div class=\"col-md-4 text-center\"><div class=\"p-3 rounded\" style=\"background: rgba(100, 116, 139, 0.1);\"><strong>الشركات الكبرى</strong><br><small>تكلفة باهظة وبطء<br>موظفون مبتدئون<br>حلول نمطية</small></div></div></div></div>"
        },
        {
          q: "ماذا لو لم نكن متأكدين مما نحتاجه؟",
          a: "<strong>لهذا السبب نبدأ بتقييم مجاني للبيانات.</strong> سنقوم بمراجعة وضعك الحالي ونوصي بأفضل مسار للمضي قدمًا - دون أي التزام. يكتشف معظم العملاء فرصًا لم يكونوا على علم بوجودها."
        }
      ]
    },

    // Final CTA Section
    finalCta: {
      title: "مستعد لتحويل استراتيجية بياناتك؟",
      subtitle: "شاركنا تحديات بياناتك واحصل على نموذج أولي مخصص للوحة التحكم في غضون 24 ساعة. لا يوجد أي التزام مطلوب.",
      button: "ابدأ مشروعك"
    },

    // Contact Section
    contact: {
      title: "لنتناقش حول تحديات بياناتك",
      subtitle: "أخبرنا عن بيئة بياناتك الحالية والرؤى التي تحتاجها لدفع أعمالك إلى الأمام.",
      form: {
        name: "الاسم بالكامل *",
        email: "البريد الإلكتروني للعمل *",
        company: "الشركة",
        budget: "الميزانية التقديرية",
        budgetText: "حدد النطاق (بالدولار الأمريكي)",
        details: "تفاصيل المشروع *",
        placeholder: "صف مصادر بياناتك، مؤشرات الأداء الرئيسية، والنتائج المرجوة...",
        button: "أرسل الرسالة",
        response: "الرد في غضون ٤ ساعات"
      },
      checklist: {
        title: "قائمة التحقق المبدئية",
        items: [
          {
            title: "أهداف العمل",
            desc: "ما هي القرارات التي يجب اتخاذها بشكل أسرع أو أفضل؟"
          },
          {
            title: "مصادر البيانات",
            desc: "ملفات Excel، قواعد البيانات، أنظمة CRM و ERP، واجهات APIs"
          },
          {
            title: "أصحاب المصلحة",
            desc: "من سيستخدم لوحات التحكم بشكل يومي؟"
          },
          {
            title: "مقاييس النجاح",
            desc: "كيف سنقيس نجاح المشروع؟"
          }
        ]
      },
      timeline: {
        title: "الجدول الزمني الكامل للمشروع",
        items: [
          {
            label: "الاكتشاف والتخطيط",
            value: "اليوم ١"
          },
          {
            label: "نمذجة البيانات وETL",
            value: "اليوم ٢-٣"
          },
          {
            label: "تطوير لوحة التحكم",
            value: "اليوم ٤-٥"
          },
          {
            label: "الاختبار والنشر",
            value: "اليوم ٦-٧"
          }
        ]
      }
    }
  }
};