// Translations for tools/power-bi-model-health-check.html
window.modelHealthTranslations = {
  "en": {
    "meta": { "title": "Free Power BI Model Health Check: Find Unused Columns, Slow DAX and Model Issues - DataArcus" },
    "mh": {
      "badge": "Free · Runs in your browser · Nothing is uploaded",
      "title": "Power BI Model Health Check",
      "subtitle": "Drop a .pbit and get a health score, the columns and measures nobody uses, risky relationships and slow DAX, with a clear fix for each. Plus full model documentation in one click.",
      "pill": { "private": "Your file stays on your computer", "rules": "30+ checks", "docs": "Documentation export" },
      "cta": { "title": "Want these fixed for you?", "desc": "DataArcus reviews and tunes Power BI models for businesses across the MENA region: faster reports, smaller models and DAX your team can maintain.", "more": "More free tools", "article": "Read the case study: what the check found in a real 410-measure model →" },
      "faq": {
        "title": "Questions",
        "q1": "Is my file uploaded anywhere?",
        "a1": "No. The file is opened and checked inside your browser tab. Nothing is sent to DataArcus or anyone else, and closing the tab clears it. A .pbit also contains no data rows, only the model structure and report layout.",
        "q2": "Why a .pbit and not a .pbix?",
        "a2": "A .pbix stores your data in a compressed format only Power BI can read. A .pbit has the same model and report without the data, so it is small even for very large models and safe to check. In Power BI Desktop: File > Export > Power BI template.",
        "q3": "How is \"unused\" decided?",
        "a3": "A column or measure counts as used if any visual, filter, bookmark, measure, calculated column, relationship, sort order or security rule in the file needs it, directly or through other measures. If other reports connect to the same model, check them too before deleting.",
        "q4": "How is the score calculated?",
        "a4": "Each check has a weight by severity. Performance counts for 40% of the score, maintainability and best practice for 30% each. Large models are judged by the share of objects affected, not the raw count, so a big model is not punished for being big."
      }
    }
  },
  "ar": {
    "meta": { "title": "فحص صحة نموذج Power BI مجانًا: الأعمدة غير المستخدمة وDAX البطيء ومشاكل النموذج - DataArcus" },
    "mh": {
      "badge": "مجاني · يعمل داخل متصفحك · لا يتم رفع أي ملف",
      "title": "فحص صحة نموذج Power BI",
      "subtitle": "أسقط ملف .pbit واحصل على تقييم لصحة النموذج، والأعمدة والمقاييس التي لا يستخدمها أحد، والعلاقات الخطرة وDAX البطيء، مع طريقة إصلاح واضحة لكل مشكلة. وتوثيق كامل للنموذج بضغطة واحدة.",
      "pill": { "private": "ملفك يبقى على جهازك", "rules": "أكثر من 30 فحصًا", "docs": "تصدير التوثيق" },
      "cta": { "title": "تريد من يصلحها لك؟", "desc": "DataArcus تراجع وتحسّن نماذج Power BI للشركات في منطقة الشرق الأوسط وشمال أفريقيا: تقارير أسرع ونماذج أصغر وDAX يسهل على فريقك صيانته.", "more": "أدوات مجانية أخرى", "article": "اقرأ دراسة الحالة: ماذا وجد الفحص في نموذج حقيقي فيه 410 مقاييس ←" },
      "faq": {
        "title": "أسئلة شائعة",
        "q1": "هل يتم رفع ملفي إلى أي مكان؟",
        "a1": "لا. يتم فتح الملف وفحصه داخل صفحة المتصفح فقط، ولا يُرسل إلى DataArcus أو أي جهة أخرى، وإغلاق الصفحة يمسحه. كما أن ملف .pbit لا يحتوي أي صفوف بيانات، فقط هيكل النموذج وتصميم التقرير.",
        "q2": "لماذا .pbit وليس .pbix؟",
        "a2": "ملف pbix يخزن بياناتك بصيغة مضغوطة لا يقرأها إلا Power BI. أما pbit فيحتوي نفس النموذج والتقرير بدون البيانات، فيكون صغيرًا حتى للنماذج الضخمة وآمنًا للفحص. في Power BI Desktop اختر File > Export > Power BI template.",
        "q3": "كيف يتم تحديد \"غير المستخدم\"؟",
        "a3": "يُعتبر العمود أو المقياس مستخدمًا إذا احتاجه أي visual أو فلتر أو bookmark أو مقياس أو عمود محسوب أو علاقة أو ترتيب أو قاعدة أمان في الملف، مباشرة أو عبر مقاييس أخرى. إن كانت تقارير أخرى متصلة بنفس النموذج فراجعها قبل الحذف.",
        "q4": "كيف يُحسب التقييم؟",
        "a4": "لكل فحص وزن حسب خطورته. الأداء يمثل 40% من التقييم، وسهولة الصيانة وأفضل الممارسات 30% لكل منهما. النماذج الكبيرة تُقيَّم بنسبة العناصر المتأثرة لا بعددها، حتى لا يُعاقب النموذج على حجمه."
      }
    }
  }
};
