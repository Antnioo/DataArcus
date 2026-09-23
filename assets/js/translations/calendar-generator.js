// Translations for calendar-generator.js (generated)
window.calendarGeneratorTranslations = {
  "en": {
    "cg": {
      "badge": "Free tool · No sign-up",
      "title": "DAX Calendar Table Generator",
      "subtitle": "A complete Power BI date table in one paste: fiscal years, GCC weekends, and Hijri dates with Ramadan and Eid flags that no built-in function gives you.",
      "quick": "Quick setup",
      "q": {
        "uae": "UAE",
        "ksa": "Saudi Arabia",
        "egypt": "Egypt",
        "global": "Global (no Hijri)"
      },
      "tableName": "Table name",
      "start": "Start date",
      "end": "End date",
      "weekStart": "Week starts on",
      "day": {
        "sun": "Sunday",
        "mon": "Monday",
        "sat": "Saturday"
      },
      "weekend": "Weekend",
      "we": {
        "satsun": "Saturday + Sunday",
        "frisat": "Friday + Saturday",
        "fri": "Friday only",
        "sun": "Sunday only"
      },
      "fyStart": "Fiscal year starts",
      "m": {
        "1": "January",
        "2": "February",
        "3": "March",
        "4": "April",
        "5": "May",
        "6": "June",
        "7": "July",
        "8": "August",
        "9": "September",
        "10": "October",
        "11": "November",
        "12": "December"
      },
      "names": "Month and day names",
      "columns": "Columns to include",
      "col": {
        "hijri": "Hijri dates, Ramadan and Eid",
        "hijriNote": "Umm al-Qura calendar: Hijri year, month, day, Ramadan day, Eid al-Fitr and Eid al-Adha flags.",
        "fiscal": "Fiscal year, quarter and month",
        "fiscalNote": "Labels like FY2026 and FQ1, based on your fiscal start month.",
        "rel": "Relative offsets",
        "relNote": "Day, month and year offsets from today, for \"last 3 months\" slicers that never need updating."
      },
      "preview": "Preview",
      "ramadanRange": "Ramadan in your date range",
      "dax": "Your DAX",
      "download": "Download",
      "copy": "Copy DAX",
      "howto": "In Power BI Desktop: <strong>Modeling → New table</strong>, paste, press Enter. Then <strong>Mark as date table</strong> and choose Date. Sort Month Name by Month Number.",
      "cta": {
        "title": "Ramadan changes everything in your numbers",
        "desc": "Comparing this Ramadan to last Ramadan, not March to March, is where the real insight is. DataArcus builds Power BI reports that understand the Gulf calendar.",
        "next": "Next: build YoY and YTD measures"
      },
      "faq": {
        "title": "Questions",
        "q1": "How do I add this table in Power BI?",
        "a1": "In Power BI Desktop go to <strong>Modeling → New table</strong>, paste the DAX and press Enter. Then right-click the table, choose <strong>Mark as date table</strong>, and pick the Date column. Relate Date to the date column of your fact table.",
        "q2": "How does it get Hijri dates without Power Query?",
        "a2": "Power BI has no Hijri functions. The generator calculates every Hijri month start in your range and embeds them in a small DATATABLE inside the DAX. Each date then looks up its Hijri month, so the table works offline and refreshes instantly.",
        "q3": "Are the Ramadan and Eid dates exact?",
        "a3": "They follow the official Saudi Umm al-Qura calendar. Countries that rely on local moon sighting can differ by one day. If yours did, edit that month's start date in the DATATABLE.",
        "q4": "How do I compare this Ramadan with last Ramadan?",
        "a4": "Put <strong>Ramadan Day</strong> on the axis and <strong>Hijri Year</strong> in the legend. Every Ramadan lines up day by day, even though the Gregorian dates move about 11 days earlier each year.",
        "q5": "Why relative offsets?",
        "a5": "Filter on <strong>Month Offset</strong> between -2 and 0 to always show the last three months. It updates by itself every day, so nobody has to change a slicer again."
      }
    },
    "meta": {
      "title": "DAX Calendar Table Generator with Hijri Dates - DataArcus"
    }
  },
  "ar": {
    "cg": {
      "badge": "أداة مجانية · بدون تسجيل",
      "title": "مولّد جدول التقويم في DAX",
      "subtitle": "جدول تواريخ Power BI كامل بلصقة واحدة: السنة المالية، وعطلات نهاية الأسبوع الخليجية، والتاريخ الهجري مع علامات رمضان والعيد التي لا توفرها أي دالة مدمجة.",
      "quick": "إعداد سريع",
      "q": {
        "uae": "الإمارات",
        "ksa": "السعودية",
        "egypt": "مصر",
        "global": "عالمي (بدون هجري)"
      },
      "tableName": "اسم الجدول",
      "start": "تاريخ البداية",
      "end": "تاريخ النهاية",
      "weekStart": "بداية الأسبوع",
      "day": {
        "sun": "الأحد",
        "mon": "الاثنين",
        "sat": "السبت"
      },
      "weekend": "عطلة نهاية الأسبوع",
      "we": {
        "satsun": "السبت + الأحد",
        "frisat": "الجمعة + السبت",
        "fri": "الجمعة فقط",
        "sun": "الأحد فقط"
      },
      "fyStart": "بداية السنة المالية",
      "m": {
        "1": "يناير",
        "2": "فبراير",
        "3": "مارس",
        "4": "أبريل",
        "5": "مايو",
        "6": "يونيو",
        "7": "يوليو",
        "8": "أغسطس",
        "9": "سبتمبر",
        "10": "أكتوبر",
        "11": "نوفمبر",
        "12": "ديسمبر"
      },
      "names": "أسماء الأشهر والأيام",
      "columns": "الأعمدة المطلوبة",
      "col": {
        "hijri": "التاريخ الهجري ورمضان والعيد",
        "hijriNote": "تقويم أم القرى: السنة والشهر واليوم الهجري، ويوم رمضان، وعلامات عيد الفطر وعيد الأضحى.",
        "fiscal": "السنة والربع والشهر المالي",
        "fiscalNote": "تسميات مثل FY2026 و FQ1 حسب شهر بداية سنتك المالية.",
        "rel": "الإزاحات النسبية",
        "relNote": "إزاحة اليوم والشهر والسنة عن اليوم الحالي، لفلاتر مثل \"آخر 3 أشهر\" التي لا تحتاج أي تحديث."
      },
      "preview": "معاينة",
      "ramadanRange": "رمضان ضمن نطاق التواريخ",
      "dax": "كود DAX الخاص بك",
      "download": "تنزيل",
      "copy": "نسخ DAX",
      "howto": "في Power BI Desktop: <strong>Modeling → New table</strong>، الصق الكود واضغط Enter. ثم <strong>Mark as date table</strong> واختر عمود Date. رتّب Month Name حسب Month Number.",
      "cta": {
        "title": "رمضان يغيّر كل شيء في أرقامك",
        "desc": "المقارنة الحقيقية هي بين رمضان هذا العام ورمضان الماضي، لا بين مارس ومارس. تبني داتا أركوس تقارير Power BI تفهم التقويم الخليجي.",
        "next": "التالي: أنشئ مقاييس YoY و YTD"
      },
      "faq": {
        "title": "أسئلة شائعة",
        "q1": "كيف أضيف هذا الجدول في Power BI؟",
        "a1": "في Power BI Desktop اذهب إلى <strong>Modeling → New table</strong>، والصق كود DAX واضغط Enter. ثم انقر بزر الفأرة الأيمن على الجدول واختر <strong>Mark as date table</strong> وحدد عمود Date. اربط عمود Date بعمود التاريخ في جدول الحقائق.",
        "q2": "كيف يحصل على التاريخ الهجري دون Power Query؟",
        "a2": "لا يحتوي Power BI على دوال للتاريخ الهجري. يحسب المولّد بداية كل شهر هجري ضمن النطاق ويضمّنها في جدول DATATABLE صغير داخل كود DAX. ثم يبحث كل تاريخ عن شهره الهجري، فيعمل الجدول دون اتصال ويتحدث فورًا.",
        "q3": "هل تواريخ رمضان والعيد دقيقة؟",
        "a3": "تتبع تقويم أم القرى السعودي الرسمي. قد تختلف الدول التي تعتمد على رؤية الهلال المحلية بيوم واحد. إذا حدث ذلك في بلدك، عدّل تاريخ بداية ذلك الشهر في DATATABLE.",
        "q4": "كيف أقارن رمضان هذا العام برمضان الماضي؟",
        "a4": "ضع <strong>Ramadan Day</strong> على المحور و<strong>Hijri Year</strong> في وسيلة الإيضاح. سيتطابق كل رمضان يومًا بيوم، رغم أن التاريخ الميلادي يتقدم نحو 11 يومًا كل عام.",
        "q5": "لماذا الإزاحات النسبية؟",
        "a5": "صفِّ على <strong>Month Offset</strong> بين 2- و 0 لعرض آخر ثلاثة أشهر دائمًا. يتحدث تلقائيًا كل يوم، فلا يحتاج أحد لتغيير الفلتر مرة أخرى."
      }
    },
    "meta": {
      "title": "مولّد جدول التقويم في DAX بالتاريخ الهجري - داتا أركوس"
    }
  }
};
