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
        budget: "Project Budget",
        budgetText: "Select range (EGP)",
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
    // Page Meta Arabic
    meta: {
      title: "DataArcus — حلول Power BI وبيانات متخصصة",
      description: "تقدم DataArcus لوحات تحكم Power BI مخصصة وهندسة بيانات واستشارات تحليلية لمساعدة الشركات على تحويل البيانات الخام إلى قرارات استراتيجية.",
      keywords: "استشارات Power BI, تحليل البيانات في مصر, ذكاء الأعمال في الشرق الأوسط, لوحات تحكم مخصصة, هندسة البيانات, DataArcus, حلول Power BI"
    },

    // Hero Section Arabic
    hero: {
      title: "من فوضى البيانات إلى الوضوح القابل للتنفيذ",
      subtitle: "توقف عن التخمين، ابدأ بالمعرفة. نحن نبني حلول Power BI قوية تمنح صانعي القرار الثقة لاتخاذ إجراءات حاسمة ودفع عجلة النمو القابل للقياس.",
      buttonWork: "استكشف أعمالنا",
      buttonDiscuss: "ناقش مشروعك",
      badgeSecurity: "أمان على مستوى الشركات",
      badgeTurnaround: "تنفيذ سريع",
      badgeExcellence: "ملتزمون بالتميز",
      commitmentTitle: "التزامنا بالتميز",
      commitmentPoints: [
        "إتقان متقدم لـ DAX و Power Query",
        "هندسة خطوط أنابيب البيانات في الوقت الفعلي",
        "حوكمة وأمان على مستوى الشركات",
        "تطوير مرئيات مخصصة"
      ]
    },

    // Tech Stack Section Arabic
    techStack: {
      powerbi: "Power BI",
      excel: "Excel",
      sql: "SQL",
      azure: "Azure",
      python: "Python",
      tableau: "Tableau"
    },

    // Services Section Arabic
    services: {
      title: "حلول تقود الأداء",
      subtitle: "نحن لا نعالج البيانات فحسب؛ بل نقدم الرؤى المستهدفة التي تمكّن فرقك وتسرع نمو الأعمال.",
      cards: [
        {
          title: "لوحات تحكم تنفيذية",
          desc: "احصل على رؤية شاملة وعالية المستوى لعملك في الوقت الفعلي. نحوّل البيانات المعقدة إلى لوحات تحكم بديهية لتتبع مؤشرات الأداء الرئيسية واكتشاف الفرص فورًا."
        },
        {
          title: "خطوط أنابيب بيانات موثوقة",
          desc: "جودة رؤاك تعتمد على جودة بياناتك. نبني خطوط أنابيب ETL قوية تضمن أن معلوماتك دقيقة، وفي الوقت المناسب، وجاهزة دائمًا للتحليل."
        },
        {
          title: "رؤى تنبؤية",
          desc: "تجاوز \"ماذا حدث\" لفهم \"لماذا\" و\"ماذا بعد\". نستفيد من التحليلات المتقدمة للكشف عن الاتجاهات الخفية وتوقع النتائج المستقبلية."
        },
        {
          title: "أنظمة آمنة وقابلة للتطوير",
          desc: "من أطر الحوكمة إلى الأمان على مستوى الشركات، نبني حلولًا ليست قوية فحسب، بل متوافقة وجاهزة للنمو معك."
        }
      ]
    },

    // Portfolio Section Arabic
    portfolio: {
      title: "نتائج مثبتة",
      subtitle: "نقيس نجاحنا بنجاح عملائنا. معرض أعمالنا هو عرض لحلول البيانات المخصصة وعالية التأثير التي قدمناها.",
      cardErHealth: {
        badge: "تحليلات الرعاية الصحية",
        title: "تحليل أداء غرفة الطوارئ",
        desc: "لوحة تحكم تفاعلية تزود المديرين برؤية واضحة لعمليات الطوارئ، وأوقات انتظار المرضى، ومؤشرات الرضا."
      },
      cardCallCenter: {
        badge: "خدمة العملاء",
        title: "أداء مركز الاتصال",
        desc: "مركز قيادة كامل لمراقبة مؤشرات الأداء الرئيسية لمركز الاتصال، وتتبع أداء الوكلاء، وتحسين رضا العملاء من خلال الرؤى المبنية على البيانات."
      },
      cardAdventure: {
        badge: "مبيعات الشركات",
        title: "مبيعات وعمليات AdventureWorks",
        desc: "مشروعنا الرائد الذي يتميز بتحليل 'ماذا لو' التنبؤي، وتقسيم عميق للعملاء، وتشخيصات متقدمة في مركز قيادة متعدد الصفحات."
      },
      button: "عرض جميع دراسات الحالة"
    },

    // About Section Arabic
    about: {
      title: "شريك في نجاحك",
      subtitle: "في DataArcus، نحن لا نبني لوحات تحكم فقط - بل نبني شراكات تعتمد على البيانات تمكنك من القيادة بثقة.",
      quote: "\"اسمي عبد الرحمن م.، وقد أسست DataArcus للقضاء على التخمين في الأعمال. بعد 5 سنوات في تحليل البيانات، رأيت العديد من القادة اللامعين مقيدين ببيانات فوضوية وغير متاحة. نحن موجودون لسد هذه الفجوة.\"",
      p1: "يعتمد نهجنا على فهم عميق لكل من التكنولوجيا واستراتيجية الأعمال. نأخذ الوقت الكافي لفهم تحدياتك وأهدافك الفريدة، مما يضمن أن كل حل نبنيه ليس ممتازًا من الناحية الفنية فحسب، بل متوافق تمامًا مع النتائج التي تحتاج إلى تحقيقها.",
      founder: "عبد الرحمن م.، المؤسس ومهندس البيانات الرئيسي",
      certification: {
        title: "معتمد من Google",
        subtitle: "محترف تحليل البيانات",
        verified: "محقق على Credly"
      },
      statsTitle: "التزامنا بالأرقام",
      statsSubtitle: "شغفنا مدعوم بسجل حافل من التميز والموثوقية.",
      stats: [
        { title: "مشروعًا تم تسليمه" },
        { title: "متوسط ​​مدة تسليم أول لوحة تحكم" }, // UPDATED
        { title: "اتفاقية مستوى الخدمة للتشغيل" },
        { title: "رضا العملاء" }
      ],
      ctaTitle: "هل أنت مستعد لرؤية هذه الأرقام تعمل لصالحك؟",
      ctaSubtitle: "دعنا نحول تحديات بياناتك إلى أكبر ميزة لك. الخطوة الأولى هي محادثة بسيطة.",
      ctaButton: "احجز استشارتك المجانية"
    },

    // FAQ Section Arabic
    faq: {
      title: "أسئلتك، مجاب عليها",
      subtitle: "لقد ساعدنا أكثر من 15 شركة على تحويل بياناتها. إليك إجابات للأسئلة التي يطرحها كل مدير تنفيذي.", // UPDATED
      items: [
        {
          q: "ما مدى سرعة رؤية أول لوحة تحكم لدينا؟",
          a: "<strong>عمليتنا مصممة للسرعة. يحصل معظم العملاء على نموذج مخصص في غضون 24 ساعة، ولوحة تحكم أساسية وفعالة في غضون 48-72 ساعة.</strong> وعادةً ما يكتمل مشروعنا الكامل، بما في ذلك نمذجة البيانات العميقة والنشر، في غضون أسبوع واحد." // UPDATED
        },
        {
          q: "ما هو العائد الحقيقي على الاستثمار في تطبيق Power BI؟",
          a: "<strong>يشهد عملاؤنا عادةً عائدًا على الاستثمار بنسبة 300-500% في غضون 6 أشهر.</strong> إليك الحساب: إذا كان فريقك يقضي 10 ساعات أسبوعيًا في إعداد التقارير اليدوية، فهذا يعني 520 ساعة سنويًا. بسعر 200 جنيه مصري للساعة، فإنك تنفق 104,000 جنيه مصري سنويًا على العمل اليدوي.<div class=\"mt-3\"><div class=\"row g-3\"><div class=\"col-sm-6\"><div class=\"p-3 rounded\" style=\"background: rgba(253, 121, 168, 0.1);\"><strong>قبل:</strong><br>• 10 ساعات/أسبوع تقارير يدوية<br>• قرارات متأخرة<br>• عدم اتساق البيانات</div></div><div class=\"col-sm-6\"><div class=\"p-3 rounded\" style=\"background: rgba(0, 206, 201, 0.1);\"><strong>بعد:</strong><br>• 30 دقيقة/أسبوع للمراقبة<br>• رؤى في الوقت الفعلي<br>• قرارات واثقة</div></div></div></div>"
        },
        {
          q: "كيف تتعاملون مع بيانات أعمالنا الحساسة؟",
          a: "<strong>بياناتك لا تغادر سيطرتك أبدًا.</strong> نعمل ضمن بيئة Microsoft الحالية الخاصة بك باستخدام أمان على مستوى الصفوف، واتصالات مشفرة، وحوكمة على مستوى الشركات.<div class=\"mt-3\"><div class=\"d-flex align-items-start mb-2\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>توقيع اتفاقية عدم إفشاء قبل أي وصول للبيانات</span></div><div class=\"d-flex align-items-start mb-2\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>تبقى البيانات في مستأجر Microsoft الخاص بك</span></div><div class=\"d-flex align-items-start mb-2\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>تطبيق ضوابط الوصول القائمة على الأدوار</span></div><div class=\"d-flex align-items-start\"><i class=\"bi bi-check-circle-fill text-success me-2 mt-1\"></i><span>سجل تدقيق كامل لجميع الأنشطة</span></div></div>"
        },
        {
          q: "ماذا لو كانت بياناتنا في حالة فوضى؟ ملفات Excel، أنظمة قديمة، عمليات يدوية؟",
          a: "<strong>ممتاز! هذا هو تخصصنا بالضبط.</strong> 80% من عملائنا يبدأون ببيانات \"فوضوية\". لقد قمنا بتوصيل كل شيء من أنظمة تخطيط موارد المؤسسات القديمة إلى جداول Google.<div class=\"mt-3 p-3 rounded\" style=\"background: rgba(108, 92, 231, 0.1);\"><strong>نتصل بـ:</strong> ملفات Excel، قواعد بيانات SQL، Oracle، SAP، Salesforce، QuickBooks، Google Analytics، واجهات برمجة التطبيقات، استخلاص الويب، التحميلات اليدوية، وأكثر من 200 مصدر آخر.</div><p class=\"mt-3 mb-0\"><em>\"كلما كانت بياناتك أكثر فوضوية، كان تأثير التحول أكبر.\"</em></p>"
        },
        {
          q: "هل سيتمكن فريقنا من استخدام وصيانة لوحات التحكم؟",
          a: "<strong>بالتأكيد. نحن نبني لمستوى مهارة فريقك ونقدم تدريبًا شاملاً.</strong> يتضمن كل مشروع تدريبًا للمستخدمين وتوثيقًا. بالإضافة إلى ذلك، نقدم باقات دعم مستمرة.<div class=\"mt-3\"><div class=\"row g-2 small\"><div class=\"col-md-6\"><strong class=\"text-accent\">للمستخدمين النهائيين:</strong><br>• كيفية قراءة لوحات التحكم<br>• التصفية والتعمق<br>• خيارات التصدير والمشاركة</div><div class=\"col-md-6\"><strong class=\"text-accent\">للمسؤولين:</strong><br>• جداول تحديث البيانات<br>• أذونات المستخدم<br>• استكشاف الأخطاء الأساسية وإصلاحها</div></div></div>"
        },
        {
          q: "ما الذي يميز DataArcus عن المستقلين أو شركات الاستشارات الكبرى؟",
          a: "<strong>نحن النقطة المثالية بين التكلفة والجودة.</strong> يفتقر المستقلون إلى الخبرة المؤسسية. تتقاضى الشركات الكبرى 10 أضعاف وتستغرق 10 أضعاف الوقت. نحن نقدم عملًا بجودة مؤسسية بسرعة الشركات الناشئة.<div class=\"mt-3\"><div class=\"row g-3\"><div class=\"col-md-4 text-center\"><div class=\"p-3 rounded\" style=\"background: rgba(253, 121, 168, 0.1);\"><strong>المستقلون</strong><br><small>رخيص لكن محفوف بالمخاطر<br>خبرة محدودة<br>لا يوجد دعم</small></div></div><div class=\"col-md-4 text-center\"><div class=\"p-3 rounded\" style=\"background: rgba(0, 212, 255, 0.1); border: 2px solid var(--accent);\"><strong>DataArcus</strong><br><small>أفضل قيمة<br>خبرة مثبتة<br>شراكة مستمرة</small></div></div><div class=\"col-md-4 text-center\"><div class=\"p-3 rounded\" style=\"background: rgba(100, 116, 139, 0.1);\"><strong>الشركات الكبرى</strong><br><small>مكلفة وبطيئة<br>موظفون مبتدئون<br>حلول نمطية</small></div></div></div></div>"
        },
        {
          q: "ماذا لو لم نكن متأكدين مما نحتاجه؟",
          a: "<strong>لهذا السبب نبدأ بتقييم مجاني للبيانات.</strong> سنقوم بمراجعة إعداداتك الحالية ونوصي بأفضل مسار للمضي قدمًا - دون أي التزام. يكتشف معظم العملاء فرصًا لم يكونوا على علم بوجودها."
        }
      ]
    },

    // Final CTA Section Arabic
    finalCta: {
      title: "هل أنت مستعد لتحويل استراتيجية بياناتك؟",
      subtitle: "شاركنا تحديات بياناتك واحصل على نموذج لوحة تحكم مخصصة في غضون 24 ساعة. لا يوجد أي التزام.",
      button: "ابدأ مشروعك"
    },

    // Contact Section Arabic
    contact: {
      title: "دعنا نناقش تحديات بياناتك",
      subtitle: "أخبرنا عن مشهد بياناتك والرؤى التي تحتاجها لدفع عملك إلى الأمام.",
      form: {
        name: "الاسم الكامل *",
        email: "البريد الإلكتروني للعمل *",
        company: "الشركة",
        budget: "ميزانية المشروع",
        budgetText: "اختر النطاق (جنيه مصري)",
        details: "تفاصيل المشروع *",
        placeholder: "صف مصادر بياناتك، والمقاييس الرئيسية، والنتائج المرجوة...",
        button: "أرسل الرسالة",
        response: "الرد في غضون 4 ساعات"
      },
      checklist: {
        title: "قائمة التحقق للاستكشاف",
        items: [
          {
            title: "أهداف العمل",
            desc: "ما هي القرارات التي يجب اتخاذها بشكل أسرع أو أفضل؟"
          },
          {
            title: "مصادر البيانات",
            desc: "ملفات Excel، قواعد البيانات، CRM، أنظمة تخطيط موارد المؤسسات، واجهات برمجة التطبيقات"
          },
          {
            title: "أصحاب المصلحة الرئيسيون",
            desc: "من سيستخدم لوحات التحكم يوميًا؟"
          },
          {
            title: "مقاييس النجاح",
            desc: "كيف سنقيس نجاح المشروع؟"
          }
        ]
      },
      timeline: {
        title: "الجدول الزمني الكامل للمشروع", // UPDATED
        items: [
          {
            label: "الاستكشاف والتخطيط",
            value: "اليوم الأول"
          },
          {
            label: "نمذجة البيانات و ETL",
            value: "اليوم 2-3"
          },
          {
            label: "تطوير لوحة التحكم",
            value: "اليوم 4-5"
          },
          {
            label: "الاختبار والنشر",
            value: "اليوم 6-7"
          }
        ]
      }
    }
  }
};