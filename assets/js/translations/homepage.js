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
    meta: {
      title: "DataArcus — حلول Power BI وذكاء الأعمال",
      description: "في DataArcus بنحوّل بياناتك المعقدة لرؤية واضحة تساعدك تاخد قرارات أسرع وتحقق نمو ملموس من خلال لوحات Power BI مصممة خصيصًا لاحتياجاتك.",
      keywords: "Power BI, ذكاء الأعمال, تحليل البيانات, لوحات تحكم, استشارات بيانات, DataArcus, Dashboards"
    },

    hero: {
      title: "من فوضى البيانات لقرارات أوضح",
      subtitle: "كفاية تخمين 👌 دلوقتي تقدر تعتمد على بياناتك. بنبني لوحات Power BI عملية وبسيطة تخلي عندك رؤية واضحة تدعم قراراتك وتسرّع نمو شركتك.",
      buttonWork: "شوف أعمالنا",
      buttonDiscuss: "ابدأ مشروعك",
      badgeSecurity: "أمان على مستوى المؤسسات",
      badgeTurnaround: "تنفيذ سريع",
      badgeExcellence: "ملتزمون بالجودة",
      commitmentTitle: "ليه تختارنا؟",
      commitmentPoints: [
        "خبرة عميقة في DAX وPower Query",
        "خطوط بيانات نظيفة وآمنة",
        "حوكمة وأمان مؤسسي",
        "تصميم بسيط وسهل الاستخدام"
      ]
    },

    techStack: {
      powerbi: "Power BI",
      excel: "Excel",
      sql: "SQL",
      azure: "Azure",
      python: "Python",
      tableau: "Tableau"
    },

    services: {
      title: "خدماتنا",
      subtitle: "من أول تجميع وتنظيف البيانات لحد التحليل المتقدم، بنوفر حلول متكاملة تناسب شركتك.",
      cards: [
        {
          title: "لوحات تحكم تنفيذية",
          desc: "رؤية لحظية وشاملة لأداء شركتك من خلال لوحات سهلة وبديهية، تخلّي متابعة مؤشراتك الأساسية أوضح."
        },
        {
          title: "هندسة البيانات",
          desc: "تحضير وتجهيز بياناتك بشكل منظم وموثوق، عشان تقدر تعتمد عليها بثقة وتاخد منها Insights دقيقة."
        },
        {
          title: "تحليلات ورؤى متقدمة",
          desc: "مش بس بنعرض أرقام، بنحلل الاتجاهات ونستخدم نماذج إحصائية وتنبؤية تساعدك تفهم «إيه اللي بيحصل وليه»."
        },
        {
          title: "استشارات ومرونة",
          desc: "بنوفر استشارات عملية ونبني حلول قابلة للتوسّع تناسب احتياجاتك وتكبر مع شركتك."
        }
      ]
    },

    portfolio: {
      title: "شغلنا",
      subtitle: "شوف إزاي ساعدنا شركات مختلفة تحوّل بياناتها لأداة عملية بتفرق في القرارات.",
      cardErHealth: {
        badge: "الرعاية الصحية",
        title: "لوحة متابعة غرفة الطوارئ",
        desc: "Dashboard تفاعلي لمتابعة أوقات الانتظار، رضا المرضى، وتحسين جدولة الطاقم الطبي."
      },
      cardCallCenter: {
        badge: "خدمة العملاء",
        title: "أداء مركز الاتصال",
        desc: "متابعة مؤشرات الأداء والإنتاجية وجودة المكالمات لحظة بلحظة، مع أدوات لتحسين تجربة العملاء."
      },
      cardAdventure: {
        badge: "المبيعات",
        title: "مبيعات AdventureWorks",
        desc: "تحليل الاتجاهات والتوقعات باستخدام Dashboards عملية توضح أداء المبيعات والعمليات."
      },
      button: "شوف كل المشاريع"
    },

    about: {
      title: "عن DataArcus",
      subtitle: "مهمتنا نخلي بياناتك أبسط وأوضح.",
      quote: "اسمي عبد الرحمن م.، وأسست DataArcus لإزالة العشوائية من قرارات الأعمال. بعد أكثر من خمس سنوات في مجال تحليلات البيانات، شاهدت الكثير من القادة المتميزين تُعيقهم البيانات المبعثرة أو صعوبة الوصول إليها. نحن موجودون لردم هذه الفجوة.",
      p1: "بنمزج خبرة تقنية مع فهم لأهداف البيزنس. بنسلم حلول دقيقة، عملية، وسهلة الاستخدام حتى لغير المتخصصين.",
      founder: "عبد الرحمن محمد — المؤسس",
      certification: {
        title: "شهادة Google",
        subtitle: "محترف تحليل البيانات",
        verified: "موثق عبر Credly"
      },
      statsTitle: "أرقام بتثبت التزامنا",
      statsSubtitle: "نجاحات حقيقية مع عملاء حقيقيين.",
      stats: [
        { title: "مشروع مكتمل" },
        { title: "متوسط زمن تسليم أول Dashboard" },
        { title: "التشغيل بنسبة التزام 100%" },
        { title: "رضا العملاء" }
      ],
      ctaTitle: "جاهز تستفيد من بياناتك؟",
      ctaSubtitle: "خلينا نبدأ بخطوة بسيطة ونحوّل بياناتك لميزة تنافسية.",
      ctaButton: "احجز استشارة"
    },

    faq: {
      title: "الأسئلة الشائعة",
      subtitle: "إجابات سريعة على اللي دايمًا بتسأل عنه.",
      items: [
        {
          q: "قد إيه بياخد أول Dashboard وقت للتسليم؟",
          a: "في العادة بنسلم نموذج أولي خلال أيام قليلة، وبعدها نكمل تطوير وتحسين حسب احتياجاتك."
        },
        {
          q: "إيه العائد اللي ممكن أتوقعه من Power BI؟",
          a: "هتشوف فرق واضح: وقت أقل في إعداد التقارير، قرارات أسرع، ومتابعة لحظية لأداء شركتك."
        },
        {
          q: "هل بياناتي آمنة معاكم؟",
          a: "أكيد. بنلتزم بمعايير الأمان والحوكمة: وصول مباشر للمصادر، صلاحيات محددة، وشفافية كاملة في إدارة البيانات."
        },
        {
          q: "هل ينفع أستخدم Dashboards من غير خبرة تقنية؟",
          a: "طبعًا. بنبني الواجهة لتكون بديهية وسهلة لأي حد، ومع كده بنوفر تدريب ودعم عند الحاجة."
        },
        {
          q: "ممكن تربطوا أكتر من مصدر بيانات؟",
          a: "بالتأكيد. نقدر نربط Excel، قواعد بيانات، CRM، ERP أو أي مصدر خارجي في نموذج واحد."
        },
        {
          q: "إزاي بيتم التسعير؟",
          a: "على حسب حجم وتعقيد المشروع. بنحدد معاك المتطلبات ونقدملك عرض واضح بالتكلفة والوقت."
        },
        {
          q: "هل بتوفروا دعم بعد التسليم؟",
          a: "نعم. في فترة دعم مجانية بعد التسليم، وكمان بنوفر عقود صيانة شهرية للتطويرات والتحديثات."
        }
      ]
    },

    finalCta: {
      title: "جاهز تبني Dashboard خاص بيك؟",
      subtitle: "تخيل الوضوح ده في شركتك. خلينا نبدأ.",
      button: "ناقش مشروعك"
    },

    contact: {
      title: "تواصل معنا",
      subtitle: "شاركنا تحدياتك مع البيانات وخلينا نساعدك تلاقي الحل المناسب.",
      form: {
        name: "الاسم",
        email: "الإيميل",
        company: "الشركة",
        budget: "الميزانية المتوقعة",
        budgetText: "اختار النطاق (USD)",
        details: "تفاصيل المشروع",
        placeholder: "اكتب هنا مصادر بياناتك، أهم KPIs، وإيه اللي محتاج تحققه...",
        button: "إرسال",
        response: "هنتواصل معاك خلال ٤ ساعات"
      },
      checklist: {
        title: "إيه اللي هنحتاج نعرفه منك",
        items: [
          { title: "أهدافك", desc: "إيه القرارات اللي عايز تاخدها أسرع أو أوضح؟" },
          { title: "مصادر البيانات", desc: "Excel, CRM, ERP, Databases..." },
          { title: "المستخدمين", desc: "مين هيستخدم الـ Dashboard يوميًا؟" },
          { title: "معايير النجاح", desc: "إزاي هنقيس نجاح المشروع؟" }
        ]
      },
      timeline: {
        title: "خطوات المشروع",
        items: [
          { label: "التحليل والتخطيط", value: "اليوم 1" },
          { label: "تحضير البيانات", value: "اليوم 2–3" },
          { label: "تطوير اللوحة", value: "اليوم 4–5" },
          { label: "التجربة والتسليم", value: "اليوم 6–7" }
        ]
      }
    }
  }
};