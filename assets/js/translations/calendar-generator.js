// Translations for calendar-generator.js (generated)
window.calendarGeneratorTranslations = {
  "en": {
    "cg": {
      "a11yBox": "The DAX code",
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
        "sun": "Sunday only",
        "uae": "UAE: Sat + Sun since 2022",
        "ksa": "Saudi Arabia: Fri + Sat since 2013",
        "kwt": "Kuwait: Fri + Sat since 2007",
        "qat": "Qatar: Fri + Sat since 2003",
        "bhr": "Bahrain: Fri + Sat since 2006",
        "omn": "Oman: Fri + Sat since 2013"
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
        "observed": "Announced Ramadan and Eid dates (UAE)",
        "observedNote": "Moves Ramadan, Shawwal and Dhu al-Hijjah to the dates the UAE announced since 2018. Dates not announced yet stay on Umm al-Qura and are flagged in Is Estimated Date.",
        "fiscal": "Fiscal year, quarter and month",
        "fiscalNote": "Labels like FY2026 and FQ1, based on your fiscal start month.",
        "rel": "Relative offsets",
        "relNote": "Day, month and year offsets from today, for \"last 3 months\" slicers that never need updating.",
        "arabic": "Add Arabic name columns",
        "arabicNote": "Day Name (Arabic), Month Name (Arabic) and Hijri Month Name (Arabic) beside the English names, for Arabic report pages. Sort each by Day of Week, Month Number or Hijri Month Number."
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
        "next": "Next: build YoY and YTD measures",
        "guide": "Read the guide: compare this Ramadan with last Ramadan →"
      },
      "faq": {
        "title": "Questions",
        "q1": "How do I add this table in Power BI?",
        "a1": "In Power BI Desktop go to <strong>Modeling → New table</strong>, paste the DAX and press Enter. Then right-click the table, choose <strong>Mark as date table</strong>, and pick the Date column. Relate Date to the date column of your fact table.",
        "q2": "How does it get Hijri dates without Power Query?",
        "a2": "Power BI has no built-in function that returns a Hijri month or flags Ramadan. (Measured in Power BI Desktop 2.158, October 2026: DAX FORMAT with \"ar-SA\" or \"ar-AE\" still returns the Gregorian date.) The generator calculates every Hijri month start in your range and embeds them in a small DATATABLE inside the DAX. Each date then looks up its Hijri month, so the table works offline and refreshes instantly.",
        "q3": "Are the Ramadan and Eid dates exact?",
        "a3": "By default they follow the official Saudi Umm al-Qura calendar, and a moon sighting can differ by one day. Turn on Announced Ramadan and Eid dates to use the dates the UAE announced since 2018 (only Ramadan 2018 differed). Future dates are estimates until they are announced.",
        "q4": "How do I compare this Ramadan with last Ramadan?",
        "a4": "Put <strong>Ramadan Day</strong> on the axis and <strong>Hijri Year</strong> in the legend. Every Ramadan lines up day by day, even though the Gregorian dates move about 11 days earlier each year.",
        "q5": "Why relative offsets?",
        "a5": "Filter on <strong>Month Offset</strong> between -2 and 0 to always show the last three months. It updates by itself every day, so nobody has to change a slicer again."
      }
    },
    "meta": {
      "title": "DAX Calendar Table Generator with Hijri Dates - DataArcus", "description": "Generate a Power BI date table in DAX with fiscal years, GCC weekends and Hijri (Umm al-Qura) dates, Ramadan and Eid flags. Copy, paste, done. Free."
    }
  },
  "ar": {
    "cg": {
      "a11yBox": "كود DAX",
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
        "sun": "الأحد فقط",
        "uae": "الإمارات: السبت والأحد منذ 2022",
        "ksa": "السعودية: الجمعة والسبت منذ 2013",
        "kwt": "الكويت: الجمعة والسبت منذ 2007",
        "qat": "قطر: الجمعة والسبت منذ 2003",
        "bhr": "البحرين: الجمعة والسبت منذ 2006",
        "omn": "عُمان: الجمعة والسبت منذ 2013"
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
        "observed": "مواعيد رمضان والعيد المعلنة (الإمارات)",
        "observedNote": "تنقل بداية رمضان وشوال وذي الحجة إلى المواعيد التي أعلنتها الإمارات منذ 2018. المواعيد التي لم تُعلن بعد تبقى على تقويم أم القرى، ويُشار إليها في عمود <bdi>Is Estimated Date</bdi> بأنها تقديرية.",
        "fiscal": "السنة والربع والشهر المالي",
        "fiscalNote": "تسميات مثل FY2026 و FQ1 حسب شهر بداية سنتك المالية.",
        "rel": "الإزاحات النسبية",
        "relNote": "إزاحة اليوم والشهر والسنة عن اليوم الحالي، لفلاتر مثل \"آخر 3 أشهر\" التي لا تحتاج أي تحديث.",
        "arabic": "إضافة أعمدة الأسماء العربية",
        "arabicNote": "أعمدة Day Name (Arabic) وMonth Name (Arabic) وHijri Month Name (Arabic) بجانب الأسماء الإنجليزية، لصفحات التقارير العربية. رتّب كلًا منها حسب Day of Week أو Month Number أو Hijri Month Number."
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
        "next": "التالي: أنشئ مقاييس YoY و YTD",
        "guide": "اقرأ الدليل: قارن رمضان هذا العام برمضان الماضي ←"
      },
      "faq": {
        "title": "أسئلة شائعة",
        "q1": "كيف أضيف هذا الجدول في Power BI؟",
        "a1": "في Power BI Desktop اذهب إلى <strong>Modeling → New table</strong>، والصق كود DAX واضغط Enter. ثم انقر بزر الفأرة الأيمن على الجدول واختر <strong>Mark as date table</strong> وحدد عمود Date. اربط عمود Date بعمود التاريخ في جدول الحقائق.",
        "q2": "كيف يحصل على التاريخ الهجري دون Power Query؟",
        "a2": "لا توجد في Power BI دالة مدمجة تعطي الشهر الهجري أو تحدد أيام رمضان. (قسناه في Power BI Desktop 2.158 في أكتوبر 2026: الدالة FORMAT في DAX مع \"ar-SA\" أو \"ar-AE\" تعطي التاريخ الميلادي.) يحسب المولّد بداية كل شهر هجري ضمن النطاق ويضمّنها في جدول DATATABLE صغير داخل كود DAX. ثم يبحث كل تاريخ عن شهره الهجري، فيعمل الجدول دون اتصال ويتحدث فورًا.",
        "q3": "هل تواريخ رمضان والعيد دقيقة؟",
        "a3": "تتبع افتراضيًا تقويم أم القرى السعودي الرسمي، وقد تختلف رؤية الهلال عنه بيوم واحد. فعّل خيار مواعيد رمضان والعيد المعلنة لاستخدام المواعيد التي أعلنتها الإمارات منذ 2018 (اختلف رمضان 2018 فقط). المواعيد المستقبلية تقديرية حتى يتم إعلانها.",
        "q4": "كيف أقارن رمضان هذا العام برمضان الماضي؟",
        "a4": "ضع <strong>Ramadan Day</strong> على المحور و<strong>Hijri Year</strong> في وسيلة الإيضاح. سيتطابق كل رمضان يومًا بيوم، رغم أن التاريخ الميلادي يتقدم نحو 11 يومًا كل عام.",
        "q5": "لماذا الإزاحات النسبية؟",
        "a5": "صفِّ على <strong>Month Offset</strong> بين 2- و 0 لعرض آخر ثلاثة أشهر دائمًا. يتحدث تلقائيًا كل يوم، فلا يحتاج أحد لتغيير الفلتر مرة أخرى."
      }
    },
    "meta": {
      "title": "مولّد جدول التقويم في DAX بالتاريخ الهجري - داتا أركوس", "description": "أنشئ جدول تاريخ لـ Power BI بلغة DAX مع السنة المالية وعطلة نهاية الأسبوع الخليجية والتاريخ الهجري (أم القرى) وعلامات رمضان والعيد. انسخ والصق. مجانًا."
    }
  }
};
