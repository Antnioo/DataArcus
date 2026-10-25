# The Arabic-ready checklist: texts for the owner (LEAD1, 25 Oct 2026)

Not published (content/ is excluded). The page: `resources/arabic-report-checklist.html`; the PDFs:
`assets/downloads/arabic-report-checklist-en.pdf` and `-ar.pdf`. Every claim here comes from the article "Is Your Power
BI Report Ready for Arabic? 19 Things to Check" (`articles/article-power-bi-report-ready-for-arabic.html`, with 0.3.1),
which takes its numbers from the lens's tests: `mcp/work/L1.md` (the measurements on four made-up reports) and
`mcp/test-0.3.0-claims.mjs` W-2 (the article must give 18, 14 of them, 13, 4), both on `integration/0.3.1`.

**When:** only after 0.3.1 is on main and published. The post shows check_report's Arabic lens, which arrives in
DataArcus 0.3.1 ("0.3.0 has no lens", the article), and LINKEDIN-PLAN says never post a feature that isn't live.

## (d) Go live: 6 steps for the owner
1. Wait until 0.3.1 (the article and the Arabic lens) is on main and published.
2. On formspree.io (free plan): New form, sent to hello@DataArcus.com; copy its id (the letters after `/f/`).
3. Paste the id in `resources/arabic-report-checklist.html`, the form line: replace `FORM_ID_HERE` (the one place). Then
   tell a session "LEAD1 go live" (it follows "Go live" in `content/leads/LEAD1.md`: sitemap, llms.txt, the /ar/ copy, checks).
4. Spam: the page already sends Formspree's honeypot field (`_gotcha`); keep Formspree's reCAPTCHA as it comes. If step 5's
   test is refused with a reCAPTCHA message, turn reCAPTCHA off for this form in its Settings (the honeypot stays).
5. Test once with your own email in English and once in Arabic: the PDF buttons show, the submission is in Formspree; delete it.
6. Post (Tuesday-Thursday, 8:00-9:00 Gulf time), the go/ link in the first comment; reply to every "ARABIC" by hand.
   Formspree's free plan keeps 30 days and 50 sign-ups a month: copy each new email into your own list every week.

## (a) The LinkedIn post

The links (the first comment, not the post: LINKEDIN-PLAN). Your profile: `dataarcus.com/go/arabic-checklist`; the
DataArcus page's post: `dataarcus.com/go/arabic-checklist-page`. The Arabic post: `dataarcus.com/go/arabic-checklist-ar`
and `-ar-page`. Their campaign carries the date 2026-10-27; posting another day changes nothing that matters (GA4 still
tells the posts apart), or ask a session to change the date in the 4 links.

Note: LINKEDIN-PLAN's "Never" list says "no engagement bait ("comment YES")"; the comment keyword is your choice of 25 Oct.
The post below says plainly that the link is also in the first comment, so nobody has to comment to get it.

### English
> Claude went from 0 Arabic findings to 18 on the same Power BI report.
>
> Same two-page report, built in English. Same question: "Is my report ready for Arabic?"
>
> Before, DataArcus's check_report had no Arabic lens, so it had nothing to say. With the lens in DataArcus 0.3.1, it
> found 18 things an Arabic reader would trip over. 14 of them are fixed by one call, the Arabic twin.
>
> Why so many? Microsoft says plainly that Power BI "Desktop doesn't support right-to-left languages". Every place, order
> and alignment on the page stays as it was built: for a reader who starts at the left. The titles, the Tab order, the
> bar charts, the table's columns, the month names.
>
> And some have no Power BI setting at all, like the matrix, which keeps its row headers at the left.
>
> I put all 19 kinds on one printable page, in English and Arabic, each with its fix: what DataArcus does, the Desktop
> setting, or "Power BI has no setting for it".
>
> Comment ARABIC and I'll send you the checklist. (The link is in the first comment too.)
>
> Which one have you fought with?
>
> #PowerBI #DataVisualization #UAE

Where each claim comes from: "0 ... to 18" and "14 of them, one call": the article's four made-up reports ("a report of two
pages in English: 18 findings, 14 of them fixed by one call, the twin") and "0.3.0 has no lens" (so 0.3.0 gives no Arabic finding);
"some have no setting ... the matrix": the matrix is among the 18 (`mcp/work/L1.md`, report (a): "the matrix (no setting)")
and the article's section 4; the Microsoft quote: the article's first paragraph
(Microsoft's supported languages page). The reports are made up, built for the tests
(no customer data): say so if asked.

### العربية
> انتقل Claude من 0 ملاحظات عربية إلى 18 على تقرير Power BI نفسه.
>
> التقرير نفسه، من صفحتين، مبني بالإنجليزية. والسؤال نفسه: «هل تقريري جاهز للعربية؟»
>
> قبلُ لم يكن للأداة check_report من DataArcus عدسة عربية، فلم يكن لديها ما تقوله. ومع العدسة في DataArcus 0.3.1 وجدت
> 18 ملاحظة يتعثر بها القارئ العربي، 14 منها يعالجها طلب واحد: النسخة العربية.
>
> لماذا كل هذا؟ تقول Microsoft بوضوح إن Power BI Desktop لا يدعم اللغات التي تُكتب من اليمين إلى اليسار. فيبقى كل موضع
> وترتيب ومحاذاة في الصفحة كما بُني: لقارئ يبدأ من اليسار. العناوين، وترتيب التنقل بمفتاح Tab، والمخططات الشريطية،
> وأعمدة الجدول، وأسماء الأشهر.
>
> وبعضها لا إعداد له في Power BI أصلًا، مثل المصفوفة التي تبقي رؤوس صفوفها على اليسار.
>
> جمعت الأنواع الـ 19 في صفحة واحدة للطباعة، بالعربية والإنجليزية، ولكل نوع علاجه: ما يقوم به DataArcus، أو إعداد
> Desktop، أو «لا إعداد له في Power BI».
>
> اكتب ARABIC في تعليق وسأرسل لك قائمة الفحص. (والرابط في أول تعليق أيضًا.)
>
> أيّها واجهك أكثر؟
>
> #PowerBI #DataVisualization #UAE

### The first comment
> The checklist (English and Arabic, one page each): dataarcus.com/go/arabic-checklist
>
> قائمة الفحص (بالعربية والإنجليزية): dataarcus.com/go/arabic-checklist-ar

## (b) Replies to a comment (by hand, no DM automation)
1. "Thanks, [name]! Here it is: dataarcus.com/go/arabic-checklist. It's one page in English and one in Arabic. Tell me
   which item bites you most."
2. "Here you go, [name]: dataarcus.com/go/arabic-checklist. The matrix row is the one most people ask about: Power BI has
   no setting for it, so the checklist says what to do instead."

بالعربية:
1. «شكرًا يا [الاسم]! تفضل: dataarcus.com/go/arabic-checklist-ar. صفحة بالعربية وأخرى بالإنجليزية. أخبرني أي بند يزعجك أكثر.»
2. «تفضل يا [الاسم]: dataarcus.com/go/arabic-checklist-ar. وعن المصفوفة: لا إعداد لها في Power BI، وقائمة الفحص تقول ما تفعله بدلًا من ذلك.»

## (c) The three emails (by hand from hello@DataArcus.com; the sign-up's "language" field says EN or AR)

### Day 0: the checklist
Subject: Your Arabic-ready checklist for Power BI

> Hi,
>
> Thanks for asking for the checklist. Here it is, one page in each language:
> English: https://dataarcus.com/assets/downloads/arabic-report-checklist-en.pdf
> Arabic: https://dataarcus.com/assets/downloads/arabic-report-checklist-ar.pdf
>
> Print it and tick the boxes on your next report. Each row says what reads wrong, what DataArcus does from a report built
> in English, and the Desktop setting on an Arabic page you built (or "No setting", said plainly).
>
> The full article, with the pictures: https://dataarcus.com/articles/article-power-bi-report-ready-for-arabic.html
>
> Abdelrahman, DataArcus
>
> You'll get two more short emails from me over the next week. Reply "stop" and I won't write again.

### Day 3: one real fix, worked through
Subject: The month names that read from the wrong end

> Hi,
>
> One row from the checklist, worked through: month and day names.
>
> Say a facility maintenance team has a column chart of work orders by month. The months are English (January ... December)
> and January is at the left. Power BI has no report setting for this: the names are your model's data, and Power BI
> doesn't translate your data.
>
> The fix, in Power BI Desktop:
> 1. In your date table, add a column with the Arabic month name (يناير, فبراير, ...).
> 2. Set its Sort by column to the month number, or the months sort in alphabetical order.
> 3. Show the Arabic column in the chart in place of the English one.
> 4. To start the year at the right, sort the axis: More options (...) > Sort axis, by the month, Sort descending, and move
>    the value axis to the right.
>
> With DataArcus, add_gulf_calendar with arabicColumnsOnly writes a script that adds the Arabic calendar columns to your
> date table, each sorted like its English column. You apply it yourself in Desktop's TMDL view: DataArcus never changes
> your model.
>
> Abdelrahman, DataArcus
>
> One more email next week, then I'll stop. Reply "stop" to end it now.

Where it comes from: the article, section 5 (month and day names) and section 3 (column charts: Sort axis, Sort descending,
the value axis at the right). The work orders are made up.

### Day 7: a 20-minute call
Subject: 20 minutes on your report?

> Hi,
>
> If one of your reports needs to read well in Arabic, I'm happy to look at it with you: a free 20-minute call, and you
> leave with the list of what to change on it.
>
> Book a time here: https://dataarcus.com/#contact
>
> If now isn't the time, no problem: this is my last email about the checklist.
>
> Abdelrahman, DataArcus
>
> Reply "stop" and I won't write again.

### The same emails in Arabic (for sign-ups with language "ar")
Day 0, الموضوع: قائمة فحص التقارير العربية في Power BI
> مرحبًا،
> شكرًا لطلبك قائمة الفحص. هذه هي، صفحة بكل لغة:
> بالعربية: https://dataarcus.com/assets/downloads/arabic-report-checklist-ar.pdf
> بالإنجليزية: https://dataarcus.com/assets/downloads/arabic-report-checklist-en.pdf
> اطبعها وضع علامة على كل بند في تقريرك القادم. ويقول كل صف ما يُقرأ خطأ، وما يقوم به DataArcus في تقرير مبني بالإنجليزية،
> والإعداد في Desktop لصفحة عربية بنيتها بنفسك (أو «لا إعداد»).
> المقال كاملًا: https://dataarcus.com/ar/articles/article-power-bi-report-ready-for-arabic.html
> عبد الرحمن، DataArcus
> ستصلك مني رسالتان قصيرتان خلال الأسبوع القادم. ردّ بكلمة «توقف» ولن أراسلك بعدها.

Day 3, الموضوع: أسماء الأشهر التي تُقرأ من الطرف الخطأ
> مرحبًا،
> بند واحد من القائمة، خطوة خطوة: أسماء الأشهر والأيام.
> لنفترض أن فريق صيانة مرافق لديه مخطط أعمدة لأوامر العمل حسب الشهر، والأشهر بالإنجليزية ويناير على اليسار. لا إعداد لهذا في
> التقرير: الأسماء بيانات نموذجك، وPower BI لا يترجم بياناتك.
> العلاج في Power BI Desktop:
> 1. أضف إلى جدول التاريخ عمودًا لاسم الشهر بالعربية.
> 2. اضبط Sort by column فيه على رقم الشهر، وإلا رُتّبت الأشهر أبجديًا.
> 3. اعرض العمود العربي في المخطط مكان الإنجليزي.
> 4. وليبدأ العام من اليمين: More options (...) > Sort axis، رتّب حسب الشهر ثم Sort descending، وانقل محور القيم إلى اليمين.
> ومع DataArcus، تكتب الأداة add_gulf_calendar مع الخيار arabicColumnsOnly سكربتًا يضيف أعمدة التقويم العربية إلى جدول
> التاريخ، كلٌّ منها مرتب كعموده الإنجليزي. وتطبّقه أنت في عرض TMDL: فـ DataArcus لا يغيّر نموذجك أبدًا.
> عبد الرحمن، DataArcus
> رسالة أخيرة الأسبوع القادم. ردّ بكلمة «توقف» لإنهائها الآن.

Day 7, الموضوع: 20 دقيقة على تقريرك؟
> مرحبًا،
> إن كان أحد تقاريرك يحتاج أن يُقرأ جيدًا بالعربية، يسعدني أن ننظر فيه معًا: مكالمة مجانية مدتها 20 دقيقة، وتخرج منها بقائمة
> ما تغيّره فيه.
> احجز موعدًا من هنا: https://dataarcus.com/ar/#contact
> وإن لم يكن الوقت مناسبًا، فلا بأس: هذه آخر رسالة مني عن قائمة الفحص.
> عبد الرحمن، DataArcus
> ردّ بكلمة «توقف» ولن أراسلك بعدها.
