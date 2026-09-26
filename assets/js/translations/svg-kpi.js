// Translations for tools/svg-kpi-designer.html
window.svgKpiTranslations = {
  "en": {
    "meta": {
      "title": "Free SVG KPI Designer for Power BI: DAX Image Measures - DataArcus"
    },
    "kd": {
      "badge": "Free tool · No sign-up · Nothing uploaded",
      "title": "SVG KPI Designer for Power BI",
      "subtitle": "Draw a KPI visual, link any part of it to your measures, and copy a DAX measure that draws it in Power BI. No code, nothing uploaded.",
      "startFrom": "Start from",
      "undo": "Undo",
      "redo": "Redo",
      "share": "Share link",
      "export": "Export",
      "import": "Import",
      "library": "Library",
      "libTitle": "Design library",
      "premium": "Premium preview",
      "libSave": "Save current design",
      "add": "Add",
      "layers": "Layers",
      "canvas": "Canvas: drag to move, handles to resize, Alt turns off snapping",
      "blankNote": "The \"show nothing when blank\" measure is blank right now, so Power BI would show an empty cell.",
      "data": "Data",
      "measure": "Measure",
      "formula": "Formula",
      "dataHint": "Type your measure names exactly as they are in your model. Test values only drive the preview; drag the sliders to see the design react.",
      "daxTitle": "Your DAX measure",
      "copy": "Copy DAX",
      "step1": "In Power BI Desktop, select a table, click <strong>New measure</strong> and paste.",
      "step2": "In <strong>Measure tools</strong>, set <strong>Data category</strong> to <strong>Image URL</strong>.",
      "step3": "<strong>Insert › Image</strong>, then set <strong>Image URL</strong> with <strong>fx › Field value</strong> to the measure. It scales to any size.",
      "how": {
        "title": "Two ways to show it in Power BI",
        "aTag": "Recommended",
        "aTitle": "Image visual: any size, reads like a card",
        "aSteps": "<li>Create the measure and set its <strong>Data category</strong> to <strong>Image URL</strong>.</li><li>Select <strong>Insert › Image</strong> and place it on the page.</li><li>In <strong>Format › Image</strong>, set <strong>Image URL</strong> with <strong>fx › Field value</strong> and pick your measure.</li><li>Resize the visual freely. Slicers and filters on the page change the card.</li>",
        "bTag": "One card per row",
        "bTitle": "Table or Matrix: a card for every product, store or person",
        "bSteps": "<li>Add a <strong>Table</strong> with a category column (for example Store) and the measure.</li><li>In <strong>Format › Image size</strong>, set height and width. The maximum is 512 pixels.</li><li>Turn off the column header and grid if you want a clean gallery.</li>"
      },
      "faq": {
        "title": "Questions",
        "q1": "Do I need a custom visual?",
        "a1": "No. The measure returns an SVG image as text. Power BI's built-in Image visual, Table, Matrix and some card visuals can show it once the measure's Data category is set to Image URL.",
        "q2": "Is my data uploaded?",
        "a2": "No. You type measure names and test values in the browser. The tool never connects to your model, and your design is saved only in this browser unless you share a link.",
        "q3": "Why does my sparkline show a single dot?",
        "a3": "The date column in Card settings must be the date table that actually filters your measure. If it points to a different calendar, only one period returns a value.",
        "q4": "Can I change the design later?",
        "a4": "Yes. Use Export to save the design as a file, or Share link, then open it again and copy the updated DAX."
      },
      "cta": {
        "title": "Want KPI cards like this across your whole report?",
        "desc": "DataArcus builds complete Power BI dashboards: data model, measures and a design your team uses every day."
      }
    }
  },
  "ar": {
    "meta": {
      "title": "مصمم بطاقات KPI بصيغة SVG لـ Power BI مجانًا - DataArcus"
    },
    "kd": {
      "badge": "أداة مجانية · بدون تسجيل · لا يُرفع أي شيء",
      "title": "مصمم بطاقات KPI بصيغة SVG لـ Power BI",
      "subtitle": "ارسم بطاقة مؤشر، واربط أي جزء منها بمقاييسك، وانسخ مقياس DAX يرسمها داخل Power BI. بدون برمجة وبدون رفع أي بيانات.",
      "startFrom": "ابدأ من",
      "undo": "تراجع",
      "redo": "إعادة",
      "share": "رابط مشاركة",
      "export": "تصدير",
      "import": "استيراد",
      "library": "المكتبة",
      "libTitle": "مكتبة التصاميم",
      "premium": "معاينة Premium",
      "libSave": "احفظ التصميم الحالي",
      "add": "إضافة",
      "layers": "الطبقات",
      "canvas": "اللوحة: اسحب للتحريك، والمقابض لتغيير الحجم، وAlt يلغي المحاذاة",
      "blankNote": "مقياس \"لا تعرض شيئًا عند الفراغ\" فارغ الآن، لذلك سيعرض Power BI خلية فارغة.",
      "data": "البيانات",
      "measure": "مقياس",
      "formula": "معادلة",
      "dataHint": "اكتب أسماء المقاييس كما هي في نموذجك تمامًا. قيم التجربة تحرك المعاينة فقط؛ اسحب المؤشرات لترى التصميم يتفاعل.",
      "daxTitle": "مقياس DAX الخاص بك",
      "copy": "نسخ DAX",
      "step1": "في Power BI Desktop اختر جدولًا واضغط <strong><bdi dir=\"ltr\">New measure</bdi></strong> ثم الصق.",
      "step2": "من <strong><bdi dir=\"ltr\">Measure tools</bdi></strong> اجعل <bdi dir=\"ltr\"><strong>Data category</strong> = <strong>Image URL</strong></bdi>.",
      "step3": "<strong><bdi dir=\"ltr\">Insert › Image</bdi></strong> ثم اضبط <strong><bdi dir=\"ltr\">Image URL</bdi></strong> عبر <strong><bdi dir=\"ltr\">fx › Field value</bdi></strong> على المقياس. يتمدد لأي حجم.",
      "how": {
        "title": "طريقتان لعرضها في Power BI",
        "aTag": "الأفضل",
        "aTitle": "Image visual: أي حجم، ويبدو كبطاقة",
        "aSteps": "<li>أنشئ المقياس واجعل <bdi dir=\"ltr\"><strong>Data category</strong> = <strong>Image URL</strong></bdi>.</li><li>اختر <strong><bdi dir=\"ltr\">Insert › Image</bdi></strong> وضعه في الصفحة.</li><li>من <strong><bdi dir=\"ltr\">Format › Image</bdi></strong> اضبط <strong><bdi dir=\"ltr\">Image URL</bdi></strong> عبر <strong><bdi dir=\"ltr\">fx › Field value</bdi></strong> واختر مقياسك.</li><li>غيّر الحجم بحرية. الـ slicers والفلاتر في الصفحة تغيّر البطاقة.</li>",
        "bTag": "بطاقة لكل صف",
        "bTitle": "Table أو Matrix: بطاقة لكل منتج أو فرع أو شخص",
        "bSteps": "<li>أضف <strong><bdi dir=\"ltr\">Table</bdi></strong> فيه عمود تصنيف (مثل الفرع) والمقياس.</li><li>من <strong><bdi dir=\"ltr\">Format › Image size</bdi></strong> اضبط الارتفاع والعرض. الحد الأقصى 512 بكسل.</li><li>أخفِ عناوين الأعمدة والشبكة لو أردت معرضًا نظيفًا.</li>"
      },
      "faq": {
        "title": "أسئلة شائعة",
        "q1": "هل أحتاج custom visual؟",
        "a1": "لا. المقياس يعيد صورة SVG كنص. الـ Image visual والـ Table والـ Matrix وبعض بطاقات Power BI المدمجة تعرضها بعد ضبط Data category على Image URL.",
        "q2": "هل تُرفع بياناتي؟",
        "a2": "لا. تكتب أسماء المقاييس وقيم التجربة في المتصفح فقط. الأداة لا تتصل بنموذجك، وتصميمك محفوظ في هذا المتصفح فقط إلا إذا شاركت رابطًا.",
        "q3": "لماذا يظهر خط الاتجاه كنقطة واحدة؟",
        "a3": "يجب أن يكون عمود التاريخ في إعدادات البطاقة من جدول التاريخ الذي يفلتر مقياسك فعلًا. لو كان من تقويم آخر، ستعود قيمة لفترة واحدة فقط.",
        "q4": "هل يمكنني تعديل التصميم لاحقًا؟",
        "a4": "نعم. استخدم تصدير لحفظ التصميم كملف، أو رابط مشاركة، ثم افتحه مجددًا وانسخ DAX المحدث."
      },
      "cta": {
        "title": "تريد بطاقات KPI مثل هذه في تقريرك كله؟",
        "desc": "DataArcus تبني لوحات Power BI كاملة: نموذج البيانات والمقاييس وتصميم يستخدمه فريقك كل يوم."
      }
    }
  }
};
