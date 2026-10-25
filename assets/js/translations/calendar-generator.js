// Translations for calendar-generator.js (generated)
window.calendarGeneratorTranslations = {
  "en": {
    "cg": {
      "a11yBox": "The DAX code",
      "badge": "Free tool · No sign-up",
      "title": "DAX Calendar Table Generator",
      "subtitle": "A Power BI date table in one paste: fiscal years, GCC weekends, and Hijri dates with Ramadan and Eid flags that no built-in function gives you.",
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
      "weekendNote": "Is Weekend and Is Working Day follow this weekend only: they don't know public holidays, half days (the UAE government works a half day on Friday) or an employer's own rest days.",
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
        "omn": "Oman: Fri + Sat since 2013",
        "shj": "Sharjah govt: Fri-Sun since 2022"
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
        "observedNote": "Moves Ramadan, Shawwal and Dhu al-Hijjah to the dates the UAE announced since 2018, whichever weekend you pick. Saudi Arabia's matched them; Oman announced 11 of them a day later (2019-2026), and Qatar, Kuwait and Bahrain may differ by a day. Dates not announced yet stay on Umm al-Qura and are flagged in Is Estimated Date.",
        "fiscal": "Fiscal year, quarter and month",
        "fiscalNote": "Labels like FY2026 and FQ1, based on your fiscal start month.",
        "rel": "Relative offsets",
        "relNote": "Day, month and year offsets from the day of the last refresh, for \"last 3 months\" slicers that move on with each refresh.",
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
        "title": "Ramadan moves every year, and your numbers with it",
        "desc": "Compare this Ramadan with last Ramadan, not March with March. DataArcus builds Power BI reports that understand the Gulf calendar: see <a href='/power-bi-mcp/' class='text-accent'>DataArcus for Power BI</a>.",
        "next": "Next: build YoY and YTD measures",
        "guide": "Read the guide: compare this Ramadan with last Ramadan →"
      },
      "faq": {
        "title": "Questions",
        "q1": "How do I add this table in Power BI?",
        "a1": "In Power BI Desktop go to <strong>Modeling → New table</strong>, paste the DAX and press Enter. Then right-click the table, choose <strong>Mark as date table</strong>, and pick the Date column. Relate Date to the date column of your fact table.",
        "q2": "How does it get Hijri dates without Power Query?",
        // a2's FORMAT measurement (EN and AR): scripts/tests/DESKTOP-TESTS.md, "DAX FORMAT with Arabic locales" (2026-10-05, round 10, Power BI Desktop 2.158)
        "a2": "Power BI has no built-in function that returns a Hijri month or flags Ramadan. (Measured in Power BI Desktop 2.158, October 2026: DAX FORMAT with \"ar-SA\" or \"ar-AE\" still returns the Gregorian date.) The generator calculates every Hijri month start in your range and embeds them in a small DATATABLE inside the DAX. Each date then looks up its Hijri month, so the table needs no data source and works offline.",
        "q3": "Are the Ramadan and Eid dates exact?",
        "a3": "By default they follow Saudi Arabia's Umm al-Qura calendar; a moon sighting can differ from it, usually by a day. Turn on Announced Ramadan and Eid dates to use the dates the UAE announced since 2018 (only Ramadan 2018 differed from Umm al-Qura). They are the UAE's dates: Oman announced 11 of them a day later from 2019 to 2026. Future dates are estimates until they are announced and added here.",
        "q4": "How do I compare this Ramadan with last Ramadan?",
        "a4": "Put <strong>Ramadan Day</strong> on the axis and <strong>Hijri Year</strong> in the legend. Every Ramadan lines up day by day, even though the Gregorian dates move about 11 days earlier each year.",
        "q5": "Why relative offsets?",
        "a5": "Filter on <strong>Month Offset</strong> between -2 and 0 to show the last three months. The offsets are worked out when the table is calculated, so they move on with each refresh of the model (or when the file is opened again), not at midnight: refresh it every day and the filter keeps showing the last three months."
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
      "title": "مولّد جدول التاريخ في DAX",
      "subtitle": "جدول تواريخ Power BI بلصقة واحدة: السنة المالية، وعطلات نهاية الأسبوع الخليجية، والتاريخ الهجري مع علامات رمضان والعيد التي لا توفرها أي دالة مدمجة.",
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
      "weekendNote": "يتبع العمودان Is Weekend وIs Working Day هذه العطلة فقط: لا يعرفان العطل الرسمية، ولا أنصاف الأيام (تعمل حكومة الإمارات نصف يوم يوم الجمعة)، ولا أيام الراحة التي يحددها صاحب العمل.",
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
        "omn": "عُمان: الجمعة والسبت منذ 2013",
        "shj": "حكومة الشارقة: الجمعة-الأحد منذ 2022"
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
        "observed": "تواريخ رمضان والعيد المعلنة (الإمارات)",
        "observedNote": "تنقل بداية رمضان وشوال وذي الحجة إلى التواريخ التي أعلنتها الإمارات منذ 2018، أيًّا كانت العطلة التي تختارها. وطابقتها تواريخ السعودية، وأعلنت عُمان 11 منها بعد يوم (2019-2026)، وقد تختلف قطر والكويت والبحرين بيوم. التواريخ التي لم تُعلن بعد تبقى على تقويم أم القرى، ويُشار إليها في عمود <bdi>Is Estimated Date</bdi> بأنها تقديرية.",
        "fiscal": "السنة والربع والشهر المالي",
        "fiscalNote": "تسميات مثل FY2026 و FQ1 حسب شهر بداية سنتك المالية.",
        "rel": "الإزاحات النسبية",
        "relNote": "إزاحة اليوم والشهر والسنة عن يوم آخر تحديث، لفلاتر مثل \"آخر 3 أشهر\" تتقدم مع كل تحديث.",
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
        "title": "رمضان يتحرك كل عام، وأرقامك معه",
        "desc": "قارن رمضان هذا العام برمضان الماضي، لا مارس بمارس. تبني DataArcus تقارير Power BI تفهم التقويم الخليجي: انظر <a href='/power-bi-mcp/' class='text-accent'>DataArcus لـ Power BI</a>.",
        "next": "التالي: أنشئ مقاييس YoY و YTD",
        "guide": "اقرأ الدليل: قارن رمضان هذا العام برمضان الماضي ←"
      },
      "faq": {
        "title": "أسئلة شائعة",
        "q1": "كيف أضيف هذا الجدول في Power BI؟",
        "a1": "في Power BI Desktop اذهب إلى <strong>Modeling → New table</strong>، والصق كود DAX واضغط Enter. ثم انقر بزر الفأرة الأيمن على الجدول واختر <strong>Mark as date table</strong> وحدد عمود Date. اربط عمود Date بعمود التاريخ في جدول الحقائق.",
        "q2": "كيف يحصل على التاريخ الهجري دون Power Query؟",
        // a2's FORMAT measurement (EN and AR): scripts/tests/DESKTOP-TESTS.md, "DAX FORMAT with Arabic locales" (2026-10-05, round 10, Power BI Desktop 2.158)
        "a2": "لا توجد في Power BI دالة مدمجة تعطي الشهر الهجري أو تحدد أيام رمضان. (قسناه في Power BI Desktop 2.158 في أكتوبر 2026: الدالة FORMAT في DAX مع \"ar-SA\" أو \"ar-AE\" تعطي التاريخ الميلادي.) يحسب المولّد بداية كل شهر هجري ضمن النطاق ويضمّنها في جدول DATATABLE صغير داخل كود DAX. ثم يبحث كل تاريخ عن شهره الهجري، فلا يحتاج الجدول مصدر بيانات ويعمل دون اتصال.",
        "q3": "هل تواريخ رمضان والعيد دقيقة؟",
        "a3": "تتبع افتراضيًا تقويم أم القرى السعودي، وقد تختلف عنه رؤية الهلال، بيوم واحد في العادة. فعّل خيار تواريخ رمضان والعيد المعلنة لاستخدام التواريخ التي أعلنتها الإمارات منذ 2018 (اختلف عن أم القرى رمضان 2018 فقط). وهي تواريخ الإمارات: أعلنت عُمان 11 منها بعد يوم من 2019 إلى 2026. التواريخ المستقبلية تقديرية حتى تُعلن وتُضاف هنا.",
        "q4": "كيف أقارن رمضان هذا العام برمضان الماضي؟",
        "a4": "ضع <strong>Ramadan Day</strong> على المحور و<strong>Hijri Year</strong> في وسيلة الإيضاح. سيتطابق كل رمضان يومًا بيوم، رغم أن التاريخ الميلادي يتقدم نحو 11 يومًا كل عام.",
        "q5": "لماذا الإزاحات النسبية؟",
        "a5": "صفِّ على <strong>Month Offset</strong> بين 2- و 0 لعرض آخر ثلاثة أشهر. تُحسب الإزاحات عند حساب الجدول، فتتقدم مع كل تحديث للنموذج (أو عند فتح الملف من جديد)، لا عند منتصف الليل: حدّث النموذج كل يوم ويبقى الفلتر على آخر ثلاثة أشهر."
      }
    },
    "meta": {
      "title": "مولّد جدول التاريخ في DAX بالتاريخ الهجري - DataArcus", "description": "أنشئ جدول تاريخ لـ Power BI بلغة DAX مع السنة المالية وعطلة نهاية الأسبوع الخليجية والتاريخ الهجري (أم القرى) وعلامات رمضان والعيد. انسخ والصق. مجانًا.",
      "keywords": "داتا أركوس, DAX calendar table, Power BI date table, DAX date table generator, Hijri calendar Power BI, Ramadan Power BI, fiscal calendar DAX",
    }
  }
};
