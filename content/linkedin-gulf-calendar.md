# LinkedIn drafts: the Gulf calendar article (3 posts)

From `articles/article-gulf-calendar-power-bi.html`, following `content/LINKEDIN-PLAN.md`: problem and result, one
tip, the tool in action, over two weeks (Tuesday to Thursday, 8:00-9:00 UAE time). Gulf topic, so Arabic first, then
English. The link goes in the first comment, not the post.

**Post only after** the branch is merged and live, and the test model's 40 checks have passed in Power BI Desktop
(`scripts/gulf-calendar/test-model/README.md`): the posts describe a live feature and tested DAX.

---

## Post 1 (Tuesday): the problem and the result. Type: real result, image = the share image `assets/img/og/gulf-calendar.jpg`

بدأ رمضان في 1 مارس 2025، وفي 18 فبراير 2026، ويُتوقع نحو 8 فبراير 2027.
وغيّرت الإمارات عطلتها من الجمعة والسبت إلى السبت والأحد في 1 يناير 2022.

جدول التواريخ المعتاد في Power BI لا يعرف أيًا من ذلك. فتظهر في التقرير "اتجاهات" هي في الحقيقة مجرد تقويم.

راجعنا إعلانات الإمارات من 2018 إلى 2026: 27 تاريخًا لرمضان وعيد الفطر وعيد الأضحى.
26 منها طابقت تقويم أم القرى. وواحد لم يطابقه: رمضان 2018 بدأ في 17 مايو، لا 16 مايو.

لذلك أضفنا إلى مولّد التقويم المجاني:
• مواعيد رمضان والعيد كما أُعلنت، مع تمييز التقديرات المستقبلية
• عطلة كل دولة خليجية حسب السنة، وتغيير الإمارات في 2022

كيف تتعامل تقاريرك مع رمضان اليوم: بالأشهر الميلادية أم بأيام رمضان؟

---

Ramadan started on 1 March 2025, on 18 February 2026, and is expected around 8 February 2027.
And the UAE moved its weekend from Friday-Saturday to Saturday-Sunday on 1 January 2022.

A standard Power BI date table knows none of this, so the report shows "trends" that are really the calendar.

We checked every UAE announcement from 2018 to 2026: 27 dates for Ramadan, Eid al-Fitr and Eid al-Adha.
26 matched the Umm al-Qura calendar. One didn't: Ramadan 2018 started on 17 May, not 16 May.

So the free Calendar Generator now has:
• Ramadan and Eid as announced, with future dates flagged as estimates
• each Gulf country's weekend by year, including the UAE's 2022 change

How do your reports handle Ramadan today: by Gregorian month, or by Ramadan day?

#PowerBI #DAX #UAE

**First comment:** The guide, with the DAX and every source: https://dataarcus.com/articles/article-gulf-calendar-power-bi.html

---

## Post 2 (Wednesday, the week after): one practical tip. Type: tip, image = the Eid window measure as code

الأيام التي تسبق العيد كثيرًا ما تكون أهم من العيد نفسه.
لكنها تقع في شهر ميلادي مختلف كل عام، فتختفي في تقرير الأشهر.

الحل: مقياس "فترة العيد" بلغة DAX.
يجمع الأيام السبعة قبل عيد الفطر وأيامه الثلاثة، لكل عيد يقع أول أيامه ضمن التواريخ المعروضة.

مثال: عيد الفطر 2025 كان الأحد 30 مارس.
فتمتد فترته من 23 مارس إلى 1 أبريل، وتُحسب كاملة لمارس.

ومعه المقياس نفسه لعيد الأضحى (من 10 إلى 13 ذي الحجة)، وفترة العام الماضي، ونسبة التغيّر.
يكتبها منشئ مقاييس DAX المجاني بأسماء جداولك وأعمدتك.

كم يومًا قبل العيد تبدأ ذروة المبيعات في قطاعك؟

---

The days before Eid often matter more than Eid itself.
But they fall in a different Gregorian month every year, so a monthly report hides them.

The fix: an "Eid window" measure in DAX.
It adds the 7 days before Eid al-Fitr and its 3 days, for every Eid whose first day is in view.

Example: Eid al-Fitr 2025 fell on Sunday 30 March.
Its window runs from 23 March to 1 April, and all of it counts in March.

The same measure exists for Eid al-Adha (10 to 13 Dhu al-Hijjah), with last year's window and the % change.
The free DAX Measure Builder writes them with your own table and column names.

How many days before Eid does the peak start in your industry?

#PowerBI #DAX #DataAnalytics

**First comment:** The measure and how to use it: https://dataarcus.com/articles/article-gulf-calendar-power-bi.html (Measure Builder: https://dataarcus.com/tools/dax-measure-builder.html)

---

## Post 3 (Thursday, the week after): the tool in action. Type: tool demo, a 30-45 second silent screen recording

Recording (no voice): open the Calendar Generator, pick the UAE weekend, tick "Announced Ramadan and Eid dates",
show the Ramadan list with "(estimate)" on 2027, copy the DAX, paste it as a new table in Power BI Desktop, show the
Hijri Date and Is Weekend columns. Use a made-up model only.

تقويم خليجي كامل في Power BI خلال 30 ثانية:
التاريخ الهجري، ورمضان والعيد كما أُعلنا، وعطلة دولتك حسب السنة.

1. اختر عطلة دولتك (الإمارات: السبت والأحد منذ 2022)
2. فعّل "مواعيد رمضان والعيد المعلنة"
3. انسخ كود DAX والصقه كجدول جديد

التواريخ المستقبلية تظهر كتقديرات حتى تُعلن، وكل تاريخ له مصدر.
مجاني، في المتصفح، بلا تسجيل.

ما العمود الذي ينقص جدول التواريخ لديك؟

---

A full Gulf calendar in Power BI in 30 seconds:
Hijri dates, Ramadan and Eid as announced, and your country's weekend by year.

1. Pick your country's weekend (UAE: Saturday-Sunday since 2022)
2. Tick "Announced Ramadan and Eid dates"
3. Copy the DAX and paste it as a new table

Future dates show as estimates until they're announced, and every date has a source.
Free, in your browser, no sign-up.

Which column is your date table missing?

#PowerBI #UAE #DataAnalytics

**First comment:** The Calendar Generator: https://dataarcus.com/tools/dax-calendar-table-generator.html
