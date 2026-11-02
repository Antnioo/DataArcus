# LinkedIn drafts: the custom-visual article (3 posts)

From `articles/article-power-bi-custom-visual-ai-checks.html`, following `content/LINKEDIN-PLAN.md`: one useful fact
per post, Tuesday to Thursday, 8:00-9:00 UAE time. Not a Gulf topic, so English first, then Arabic. The link goes in
the first comment, not the post. Every fact is from Microsoft Learn (linked in the article); quote nothing we haven't
checked there.

**Post only after** the article is merged and live. Don't name or tag the author of the demo unless the author agrees.
Never write "first", "only", "official" or "free" in a headline.

---

## Post 1 (Tuesday): the trap. Type: tip, image = the share image `assets/img/og/custom-visual-ai-checks.jpg`

An AI agent can now build a Power BI custom visual from one prompt.

Before you build on one at work, know this:
it can work perfectly in Power BI Desktop and show an error once you publish.

Why? Two different rulebooks.
• The Power BI service follows your tenant settings ("Allow visuals created using the Power BI SDK", "Add and use certified visuals only").
• Desktop follows Windows group policy, and allows custom visuals by default.

And a visual written for you can't be certified: Microsoft's FAQ says "Private visuals aren't certified."

The fix is boring and quick: ask your Fabric admin which settings are on, before you spend the afternoon.

Four checks, each from Microsoft's own pages, in the first comment.

---

وكيل ذكاء اصطناعي يستطيع الآن بناء مرئي مخصص في Power BI بطلب واحد.

قبل أن تعتمد عليه في العمل، اعرف هذا:
قد يعمل تمامًا في Power BI Desktop ثم يعرض خطأ بعد النشر.

السبب: قواعد مختلفة.
• خدمة Power BI تتبع إعدادات المستأجر.
• وDesktop يتبع سياسة المجموعة في Windows، ويسمح بالمرئيات المخصصة افتراضيًا.

والمرئي المكتوب لك لا يمكن اعتماده: تقول Microsoft إن المرئيات الخاصة لا تُعتمد.

الحل بسيط: اسأل مسؤول Fabric عن الإعدادات قبل أن تبدأ.

الفحوص الأربعة من صفحات Microsoft في أول تعليق.

---

## Post 2 (Wednesday): the Monday email. Type: tip, no image (or a text card)

Your manager reads the Power BI report in a Monday email subscription.
You add a new custom visual.

What do they see? An error symbol.

Microsoft Learn: in email subscriptions, custom visuals that aren't certified "display an error symbol". Export to PowerPoint skips them too.

Even an admin-approved organizational visual doesn't fix it: only certified visuals imported straight from AppSource work there.

So ask one question before any new visual: how do people actually read this report?

---

مديرك يقرأ تقرير Power BI في رسالة اشتراك صباح الاثنين.
وأنت أضفت مرئيًا مخصصًا جديدًا.

ماذا سيرى؟ رمز خطأ.

بحسب Microsoft Learn: المرئيات المخصصة غير المعتمدة تظهر في رسائل الاشتراك برمز خطأ، ولا تُصدَّر إلى PowerPoint.

وحتى المرئي التنظيمي الذي وافق عليه المسؤول لا يحل ذلك: هذه الميزات للمرئيات المعتمدة المستوردة من AppSource مباشرة.

فاسأل قبل أي مرئي جديد: كيف يقرأ الناس هذا التقرير فعلًا؟

---

## Post 3 (Thursday): the prompt. Type: tip

One line I'd add to every report prompt for an AI agent:

"Use Power BI's core visuals only, and tell me if one can't do this."

Most "new visual" requests are things the core visuals already do: drill-down is a hierarchy on a bar chart's axis, a rich tooltip is a report page tooltip. Core visuals need no admin approval and work in PowerPoint exports and email subscriptions.

And if you truly need a custom one: run Microsoft's own check on the package, `pbiviz package --certification-audit`, and hand your admin the source code, not just the file.

---

سطر أضيفه إلى كل طلب تقرير لوكيل ذكاء اصطناعي:

"استخدم مرئيات Power BI الأساسية فقط، وأخبرني إن لم يستطع أحدها ذلك."

معظم طلبات "المرئي الجديد" تقدر عليها المرئيات الأساسية أصلًا: التنقل إلى التفاصيل تسلسل هرمي على محور مخطط الأعمدة، والتلميح الغني صفحة تلميح. والمرئيات الأساسية لا تحتاج موافقة المسؤول، وتعمل في التصدير إلى PowerPoint ورسائل الاشتراك.

وإن احتجت مرئيًا مخصصًا فعلًا: شغّل فحص Microsoft نفسها على الحزمة `pbiviz package --certification-audit`، وسلّم المسؤول الشيفرة المصدرية لا الملف وحده.
