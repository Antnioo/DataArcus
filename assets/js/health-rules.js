/*
 * DataArcus Power BI Model Health Check: the rules (0.3.2 SP27, out of model-health-engine.js).
 * Pure JavaScript, no DOM, no state: the same input always gives the same findings, and the input is never changed.
 *
 * Interface (one input, one output):
 *   RULES: the catalogue (each rule's category, severity, texts en and ar, and its source); BPA_URL.
 *   runRules(input)
 *     Input:  { M: the normalised model, IX: its frozen index (both model-index.js), report: analyzeReport's reading
 *               or null, used: Set of the nodes the report, relationships and roles reach, vis: the visuals using each
 *               measure and column, broken: the report's references the model lacks, styleByMeasure: daxRefs's style
 *               per measure, userTables, autoDateTables, allMeasures: lists of M, mQueries: [{ name, expr, isExpr }],
 *               chainDepths: allMeasures[i]'s measure-chain depth }
 *     Output: { findings: [{ id, items: [{ obj, detail?, variant? }] }] in checking order, skipped: [{ id,
 *               reason: 'unknownType', items: [{ obj }] }] (a check left out for a column of unknown type) }
 *   No score here: the engine (model-health-engine.js) weighs the findings.
 * Requires dax-reference-parser.js (tokens) and model-index.js (K, the node keys), loaded before this file.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const P = node ? require('./dax-reference-parser.js') : root.DADaxParser;
  const X = node ? require('./model-index.js') : root.DAModelIndex;
  const { tokenizeDax, daxCode } = P;
  const { K } = X;
  const lc = (s) => String(s == null ? '' : s).toLowerCase(), uniq = (a) => Array.from(new Set(a));

  // ---------- the rule catalogue ----------
  const RULES = {
    BIDI: { cat: 'perf', sev: 'medium',
      en: ['Relationships that filter in both directions', 'Both-direction filtering makes every query do more work and can create ambiguous paths between tables.', 'Set cross filter direction to Single. Where you need it, use CROSSFILTER(..., Both) inside the one measure that needs it.'],
      ar: ['علاقات تصفّي في الاتجاهين', 'التصفية في الاتجاهين تجعل كل استعلام أبطأ وقد تسبب مسارات غامضة بين الجداول.', 'اجعل اتجاه التصفية Single، واستخدم CROSSFILTER(..., Both) داخل المقياس الذي يحتاجه فقط.'] },
    M2M: { cat: 'perf', sev: 'medium',
      en: ['Many-to-many relationships', 'Many-to-many relationships are slower and often hide duplicate keys in a dimension.', 'Check the dimension for duplicate keys. If both sides really are many, use a bridge table with one-to-many relationships.'],
      ar: ['علاقات many-to-many', 'هذه العلاقات أبطأ وغالبًا تخفي مفاتيح مكررة في جدول الأبعاد.', 'تحقق من وجود مفاتيح مكررة. إن كان الطرفان متعددين فعلًا فاستخدم جدول bridge بعلاقات one-to-many.'] },
    AUTODATE: { cat: 'perf', sev: 'high',
      en: ['Auto date/time is on', 'Power BI builds a hidden date table for every date column. They add memory and refresh time and are rarely needed when you have a real calendar table.', 'File > Options > Current file > Data load: turn off Auto date/time, and use your own calendar table.'],
      ar: ['خاصية Auto date/time مفعّلة', 'ينشئ Power BI جدول تاريخ مخفيًا لكل عمود تاريخ، فيزيد الحجم ووقت التحديث بلا حاجة عند وجود جدول تاريخ.', 'من File > Options > Current file > Data load أوقف Auto date/time واستخدم جدول التاريخ الخاص بك.'] },
    UNUSED_COL: { cat: 'perf', sev: 'low',
      en: ['Columns not used anywhere', 'Every imported column costs memory and refresh time. These are not used in any visual, filter, measure, relationship, sort or security rule in this report.', 'Remove them in Power Query (not just hide them). If other reports use this model, check those first.'],
      ar: ['أعمدة غير مستخدمة', 'كل عمود مستورد يستهلك ذاكرة ووقت تحديث. هذه الأعمدة غير مستخدمة في أي visual أو فلتر أو مقياس أو علاقة أو ترتيب أو قاعدة أمان في هذا التقرير.', 'احذفها من Power Query (لا تكتفِ بإخفائها). إن كانت تقارير أخرى تستخدم النموذج فتحقق منها أولًا.'] },
    UNUSED_MEASURE: { cat: 'maint', sev: 'low',
      en: ['Measures not used by any visual', 'These measures are not in any visual or filter, and no used measure depends on them. Dead measures make the model harder to maintain.', 'Delete them, or move them to a display folder such as "Archive" if you want to keep them.'],
      ar: ['مقاييس غير مستخدمة في أي visual', 'هذه المقاييس ليست في أي visual أو فلتر، ولا يعتمد عليها أي مقياس مستخدم. المقاييس الميتة تصعّب صيانة النموذج.', 'احذفها، أو انقلها إلى مجلد مثل "Archive" إن أردت الاحتفاظ بها.'] },
    UNUSED_TABLE: { cat: 'perf', sev: 'medium',
      en: ['Tables not used at all', 'Nothing in the report, the measures or the relationships uses these tables.', 'Remove them, or disable load in Power Query if another query needs them.'],
      ar: ['جداول غير مستخدمة إطلاقًا', 'لا شيء في التقرير أو المقاييس أو العلاقات يستخدم هذه الجداول.', 'احذفها، أو أوقف Enable load في Power Query إن كان استعلام آخر يحتاجها.'] },
    DOUBLE: { cat: 'bp', sev: 'info',
      en: ['Decimal (floating point) columns', 'Decimal number columns can show tiny rounding differences in totals. Fixed decimal is exact to 4 places.', 'For money and rates, use Fixed decimal number in Power Query.'],
      ar: ['أعمدة Decimal (عشري عائم)', 'أعمدة Decimal قد تُظهر فروق تقريب صغيرة في الإجماليات، بينما Fixed decimal دقيق حتى 4 خانات.', 'للمبالغ والنسب استخدم Fixed decimal number في Power Query.'] },
    CALC_COLS: { cat: 'perf', sev: 'low',
      en: ['Calculated columns on imported tables', 'Calculated columns are computed after load, compress worse than Power Query columns and slow down refresh.', 'Move simple ones (IF, text, dates) into Power Query or the source. Keep DAX columns only when they need model data like RELATED across tables.'],
      ar: ['أعمدة محسوبة على جداول مستوردة', 'الأعمدة المحسوبة تُحسب بعد التحميل وتنضغط أسوأ من أعمدة Power Query وتبطئ التحديث.', 'انقل البسيطة منها (IF، نصوص، تواريخ) إلى Power Query أو المصدر، وأبقِ أعمدة DAX فقط عندما تحتاج بيانات النموذج مثل RELATED.'] },
    FILTER_TABLE: { cat: 'perf', sev: 'medium',
      en: ['FILTER over a whole table inside CALCULATE', 'FILTER(Table, ...) as a CALCULATE filter scans every row of the table. A column filter is much faster.', 'Filter the column instead: CALCULATE([Sales], Table[Column] = "X"), or KEEPFILTERS(Table[Column] = "X").'],
      ar: ['FILTER على جدول كامل داخل CALCULATE', 'استخدام FILTER(Table, ...) كفلتر داخل CALCULATE يمر على كل صفوف الجدول، وتصفية العمود أسرع بكثير.', 'فلتر العمود بدلًا من الجدول: CALCULATE([Sales], Table[Column] = "X") أو KEEPFILTERS(...).'],
      // advice for one item: the predicate compares with another table or an aggregate, which a Boolean filter can't take as written
      variants: { VAR: {
        en: 'Compares with another table or an aggregate, which a Boolean filter can\'t take as written: put that value in a variable first, then filter the column: VAR d = MIN(\'Calendar\'[Date]) RETURN CALCULATE([Sales], Table[Column] >= d).',
        ar: 'يقارن بجدول آخر أو بقيمة مجمّعة، وفلتر Boolean لا يقبل ذلك كما هو مكتوب: ضع القيمة في متغير أولًا ثم فلتر العمود: VAR d = MIN(\'Calendar\'[Date]) RETURN CALCULATE([Sales], Table[Column] >= d).' } } },
    IFERROR: { cat: 'perf', sev: 'low',
      en: ['IFERROR or ISERROR in measures', 'Error handling forces the engine to evaluate the expression row by row and hides real problems.', 'Use DIVIDE for division, and handle blanks with IF or COALESCE.'],
      ar: ['استخدام IFERROR أو ISERROR في المقاييس', 'التعامل مع الأخطاء يجبر المحرك على الحساب صفًا بصف ويخفي المشاكل الحقيقية.', 'استخدم DIVIDE للقسمة، وتعامل مع القيم الفارغة بـ IF أو COALESCE.'] },
    DIVISION: { cat: 'bp', sev: 'low',
      en: ['Division with "/" instead of DIVIDE', 'A "/" by a measure or column fails with an error or infinity when the denominator is zero or blank.', 'Use DIVIDE(numerator, denominator). It returns blank safely.'],
      ar: ['قسمة بـ "/" بدل DIVIDE', 'القسمة بـ "/" على مقياس أو عمود تعطي خطأ أو ما لا نهاية عندما يكون المقام صفرًا أو فارغًا.', 'استخدم DIVIDE(البسط، المقام) فهي تعيد قيمة فارغة بأمان.'] },
    INACTIVE_UNUSED: { cat: 'maint', sev: 'low',
      en: ['Inactive relationships nobody uses', 'An inactive relationship only matters when a measure turns it on with USERELATIONSHIP. No measure does for these.', 'Delete them, or add the measure that was meant to use them.'],
      ar: ['علاقات غير نشطة لا يستخدمها أحد', 'العلاقة غير النشطة لها فائدة فقط عندما يفعّلها مقياس بـ USERELATIONSHIP، ولا يوجد مقياس يفعل ذلك هنا.', 'احذفها، أو أضف المقياس الذي كان يُفترض أن يستخدمها.'] },
    DATE_NOT_MARKED: { cat: 'bp', sev: 'medium',
      en: ['Calendar table not marked as a date table', 'The classic time intelligence functions need the calendar marked as a date table, and marking it removes its auto date table. Calendar-based time intelligence doesn\'t need the mark.', 'Table tools > Mark as date table, and choose the date column.'],
      ar: ['جدول التاريخ غير معلَّم كجدول تاريخ', 'دوال time intelligence الكلاسيكية تحتاج أن يُعلَّم التقويم كجدول تاريخ، وتعليمه يحذف جدول التاريخ التلقائي له. أما time intelligence المبني على التقويم (calendar-based) فلا يحتاج هذا التعليم.', 'من Table tools اختر Mark as date table وحدد عمود التاريخ.'] },
    CALENDARAUTO: { cat: 'perf', sev: 'low',
      en: ['CALENDARAUTO in a calendar table', 'CALENDARAUTO scans every date column in the model, so one wrong date (like 1900 or 2099) stretches the calendar and slows refresh.', 'Use CALENDAR with explicit start and end dates based on your fact tables.'],
      ar: ['استخدام CALENDARAUTO في جدول التاريخ', 'CALENDARAUTO يفحص كل أعمدة التاريخ، فتاريخ خاطئ واحد (مثل 1900) يمد التقويم ويبطئ التحديث.', 'استخدم CALENDAR بتاريخ بداية ونهاية واضحين من جداول الحقائق.'] },
    FK_VISIBLE: { cat: 'maint', sev: 'low',
      en: ['Visible key columns on the many side', 'Report builders should slice by the dimension, not by the fact table key. Visible keys invite wrong filters.', 'Hide the key columns on the many side of relationships.'],
      ar: ['مفاتيح ظاهرة في جداول الحقائق', 'يجب التقطيع باستخدام جدول الأبعاد لا مفتاح جدول الحقائق، والمفاتيح الظاهرة تسبب فلاتر خاطئة.', 'أخفِ أعمدة المفاتيح في جهة many من العلاقات.'] },
    SUMMARIZE_KEYS: { cat: 'bp', sev: 'low',
      en: ['ID, year or code columns that sum by default', 'Numeric columns like IDs, years and codes should never be summed. Dragging them into a visual shows a meaningless total.', 'Set Summarization to Don\'t summarize for these columns.'],
      ar: ['أعمدة معرّفات أو سنوات أو أكواد يتم جمعها افتراضيًا', 'الأعمدة الرقمية مثل المعرّفات والسنوات والأكواد لا يجب جمعها، وسحبها في visual يعطي مجموعًا بلا معنى.', 'اضبط Summarization على Don\'t summarize لهذه الأعمدة.'] },
    NO_FORMAT: { cat: 'bp', sev: 'info',
      en: ['Measures without a format string', 'Without a format, the same number can show as 0.2345 in one visual and 23% in another, depending on who built it.', 'Set a format on each measure (whole number, %, currency).'],
      ar: ['مقاييس بدون تنسيق', 'بدون تنسيق قد يظهر نفس الرقم 0.2345 في visual و23% في آخر حسب من صممه.', 'حدد تنسيقًا لكل مقياس (رقم صحيح، نسبة، عملة).'] },
    PCT_FORMAT: { cat: 'bp', sev: 'low',
      en: ['Rate or % measures not formatted as percentage', 'The name says rate or percent but the format does not, so visuals show 0.23 instead of 23%.', 'Set the format to Percentage.'],
      ar: ['مقاييس نسب غير منسقة كنسبة مئوية', 'الاسم يدل على نسبة لكن التنسيق ليس نسبة، فتظهر 0.23 بدل 23%.', 'اضبط التنسيق على Percentage.'] },
    NO_FOLDERS: { cat: 'maint', sev: 'low',
      en: ['Measures without a display folder', 'With many measures, a flat list is hard to navigate for anyone who builds reports.', 'Group measures into display folders by topic (for example Sales, Leads, Time intelligence).'],
      ar: ['مقاييس بدون مجلد عرض', 'مع كثرة المقاييس تصبح القائمة المسطحة صعبة التصفح لمن يبني التقارير.', 'نظّم المقاييس في مجلدات حسب الموضوع (مثل Sales وLeads وTime intelligence).'] },
    NO_DESC: { cat: 'maint', sev: 'info',
      en: ['Measures without a description', 'Descriptions show as tooltips in the field list and are the cheapest documentation you can write.', 'Add a one-line description to the key measures first.'],
      ar: ['مقاييس بدون وصف', 'الوصف يظهر كتلميح في قائمة الحقول وهو أبسط توثيق ممكن.', 'أضف وصفًا من سطر واحد للمقاييس الأساسية أولًا.'] },
    QUALIFIED_MEASURE: { cat: 'maint', sev: 'info',
      en: ['Measures referenced with a table name', 'Writing Table[Measure] makes a measure look like a column. The common convention is [Measure] for measures and Table[Column] for columns.', 'Remove the table prefix from measure references.'],
      ar: ['الإشارة إلى مقاييس مع اسم جدول', 'كتابة Table[Measure] تجعل المقياس يبدو كعمود. العرف المتبع هو [Measure] للمقاييس وTable[Column] للأعمدة.', 'احذف اسم الجدول من الإشارات إلى المقاييس.'] },
    UNQUALIFIED_COLUMN: { cat: 'maint', sev: 'low',
      en: ['Column references without a table name in measures', 'In a measure, [Column] without a table is easy to confuse with a measure and breaks if a measure with the same name is added.', 'Always write Table[Column] for columns.'],
      ar: ['إشارة لأعمدة بدون اسم الجدول داخل المقاييس', 'كتابة [Column] بدون جدول داخل مقياس تجعله يشبه مقياسًا، وتنكسر إذا أُضيف مقياس بنفس الاسم.', 'اكتب دائمًا Table[Column] للأعمدة.'] },
    DUP_MEASURE: { cat: 'maint', sev: 'low',
      en: ['Measures with identical DAX', 'Two measures with the same formula drift apart when one is edited and the other is forgotten.', 'Keep one and point visuals and other measures to it.'],
      ar: ['مقاييس لها نفس صيغة DAX', 'مقياسان بنفس الصيغة يختلفان مع الوقت عندما يُعدَّل أحدهما ويُنسى الآخر.', 'احتفظ بواحد واجعل الـ visuals والمقاييس الأخرى تستخدمه.'] },
    LONG_MEASURE: { cat: 'maint', sev: 'info',
      en: ['Very long measures', 'Measures over 60 lines are hard to review and often mix several jobs.', 'Split them with variables and helper measures.'],
      ar: ['مقاييس طويلة جدًا', 'المقاييس التي تزيد عن 60 سطرًا صعبة المراجعة وغالبًا تجمع أكثر من مهمة.', 'قسّمها باستخدام المتغيرات ومقاييس مساعدة.'] },
    DEEP_CHAIN: { cat: 'maint', sev: 'info',
      en: ['Deep measure chains', 'These measures sit on top of 8 or more levels of other measures. A change at the bottom is hard to trace.', 'Check the chain in the Measures tab and flatten where a level adds nothing.'],
      ar: ['سلاسل مقاييس عميقة', 'هذه المقاييس تعتمد على 8 مستويات أو أكثر من مقاييس أخرى، وأي تعديل في الأسفل يصعب تتبعه.', 'راجع السلسلة في تبويب المقاييس وقلّل المستويات غير الضرورية.'] },
    NAMING: { cat: 'maint', sev: 'low',
      en: ['Mixed table naming styles', 'Some tables use one style (Dim_X) and others another (Dim X). Consistent names make the model easier to read.', 'Pick one convention and rename the tables that differ.'],
      ar: ['أسماء جداول بأنماط مختلفة', 'بعض الجداول بنمط (Dim_X) وأخرى بنمط (Dim X)، والأسماء الموحدة تجعل النموذج أسهل للقراءة.', 'اختر نمطًا واحدًا وأعد تسمية الجداول المختلفة.'] },
    TRAILING_SPACE: { cat: 'maint', sev: 'low',
      en: ['Names with leading or trailing spaces', 'Extra spaces in names break copy-pasted DAX and look like duplicates in the field list.', 'Rename them without the extra spaces.'],
      ar: ['أسماء تبدأ أو تنتهي بمسافة', 'المسافات الزائدة في الأسماء تكسر DAX المنسوخ وتبدو كتكرار في قائمة الحقول.', 'أعد التسمية بدون المسافات الزائدة.'] },
    HARDCODED_PATH: { cat: 'bp', sev: 'low',
      en: ['Hard-coded file paths or servers in Power Query', 'Paths to a personal folder or a fixed server break when someone else refreshes or when you move to test and production.', 'Put the server, database or folder in a Power Query parameter.'],
      ar: ['مسارات ملفات أو خوادم مكتوبة مباشرة في Power Query', 'المسارات إلى مجلد شخصي أو خادم ثابت تنكسر عند التحديث من شخص آخر أو عند الانتقال بين بيئات الاختبار والإنتاج.', 'ضع الخادم أو قاعدة البيانات أو المجلد في Parameter داخل Power Query.'] },
    TABLE_BUFFER: { cat: 'perf', sev: 'info',
      en: ['Table.Buffer in Power Query', 'Table.Buffer loads the whole table into memory and stops query folding. It helps in a few cases and hurts in most.', 'Remove it unless you measured that it speeds up this query.'],
      ar: ['استخدام Table.Buffer في Power Query', 'Table.Buffer يحمّل الجدول كاملًا في الذاكرة ويوقف query folding، ويفيد في حالات قليلة ويضر في أغلبها.', 'احذفه إلا إذا قست أنه يسرّع هذا الاستعلام فعلًا.'] },
    LONG_M: { cat: 'maint', sev: 'info',
      en: ['Very long Power Query queries', 'Queries with more than 40 steps are hard to debug and usually repeat work that could be a function or done at the source.', 'Move repeated logic into a function or into a view at the source.'],
      ar: ['استعلامات Power Query طويلة جدًا', 'الاستعلامات التي تتجاوز 40 خطوة صعبة التتبع وغالبًا تكرر عملًا يمكن جعله دالة أو تنفيذه في المصدر.', 'انقل المنطق المتكرر إلى دالة أو إلى view في المصدر.'] },
    MONTH_SORT: { cat: 'bp', sev: 'medium',
      en: ['Month or day names without a sort column', 'Month and weekday names sort alphabetically (April, August, December) unless you set Sort by column.', 'Select the column > Sort by column > the month or day number.'],
      ar: ['أسماء الشهور أو الأيام بدون عمود ترتيب', 'أسماء الشهور والأيام تترتب أبجديًا (April, August, December) ما لم تضبط Sort by column.', 'اختر العمود ثم Sort by column ثم رقم الشهر أو اليوم.'] },
    NO_RLS: { cat: 'bp', sev: 'info',
      en: ['No row-level security roles', 'Fine for a personal report. If the model is shared with teams who should see only their own data, RLS is the safe way to do it.', 'Add roles in Modeling > Manage roles if different people should see different rows.'],
      ar: ['لا توجد أدوار Row-level security', 'لا بأس لتقرير شخصي، لكن إن كان النموذج مشتركًا مع فرق يجب أن يرى كل منها بياناته فقط فإن RLS هو الطريقة الآمنة.', 'أضف أدوارًا من Modeling > Manage roles إن كان يجب أن يرى كل شخص صفوفًا مختلفة.'] },
    BROKEN_REF: { cat: 'bp', sev: 'high',
      en: ['Visuals that point to fields that no longer exist', 'These visuals or filters use a measure or column that was renamed or deleted. They show an error or a blank box to report users.', 'Each item shows the page and the visual (its title, or its type if it has none). Open it, then replace or remove the broken field. The Selection pane helps find a visual by name.'],
      ar: ['Visuals تشير إلى حقول لم تعد موجودة', 'هذه الـ visuals أو الفلاتر تستخدم مقياسًا أو عمودًا تمت إعادة تسميته أو حذفه، فتظهر خطأ أو مربعًا فارغًا لمستخدمي التقرير.', 'كل عنصر يذكر الصفحة والـ visual (بعنوانه، أو بنوعه إن لم يكن له عنوان). افتحه واستبدل الحقل المكسور أو احذفه. لوحة Selection تساعدك في إيجاد الـ visual بالاسم.'] },
    USEREL_ACTIVE: { cat: 'maint', sev: 'low',
      en: ['USERELATIONSHIP on a relationship that is already active', 'USERELATIONSHIP only changes something for inactive relationships. On an active one it does nothing and confuses whoever reads the measure next.', 'Remove the USERELATIONSHIP call, or check whether the intended relationship is a different, inactive one.'],
      ar: ['USERELATIONSHIP على علاقة نشطة بالفعل', 'USERELATIONSHIP يغيّر شيئًا فقط مع العلاقات غير النشطة، وعلى علاقة نشطة لا يفعل شيئًا ويربك من يقرأ المقياس لاحقًا.', 'احذف USERELATIONSHIP أو تحقق إن كانت العلاقة المقصودة علاقة أخرى غير نشطة.'] },
    STRING_KEYS: { cat: 'perf', sev: 'info',
      en: ['Text columns used as relationship keys', 'Relationships on whole numbers are smaller and faster than on text.', 'Where the source allows, relate on an integer key.'],
      ar: ['أعمدة نصية كمفاتيح علاقات', 'العلاقات على أرقام صحيحة أصغر وأسرع من العلاقات على النصوص.', 'استخدم مفتاحًا رقميًا صحيحًا للعلاقة حيثما أمكن.'] },
    BIDI_BRIDGE: { cat: 'perf', sev: 'info',
      en: ['Both-direction relationship on a bridge table', 'This table holds only keys and sits on the many side of two or more relationships: the shape of a many-to-many bridge. Microsoft\'s bridge pattern needs one relationship that filters in both directions, so filters reach the fact table.', 'Check that this is the many-to-many bridge Microsoft describes; if so, it is needed: keep one both-direction relationship on the bridge and set any others to Single.'],
      ar: ['علاقة تصفّي في الاتجاهين على جدول bridge', 'هذا الجدول فيه مفاتيح فقط ويقع في جهة many من علاقتين أو أكثر، وهذا شكل جدول bridge لعلاقة many-to-many. نمط Microsoft لهذا الجدول يحتاج علاقة واحدة تصفّي في الاتجاهين حتى تصل الفلاتر إلى جدول الحقائق.', 'تحقق أن هذا جدول bridge لعلاقة many-to-many كما تصفه Microsoft؛ إن كان كذلك فالعلاقة لازمة: أبقِ علاقة واحدة في الاتجاهين على هذا الجدول واجعل الباقي Single.'] },
    FILTER_MEASURE: { cat: 'perf', sev: 'medium',
      en: ['FILTER over a whole table to test a measure', 'FILTER(Table, [Measure] > 0) as a CALCULATE filter evaluates the measure for every row of the table. A measure can\'t go in a Boolean filter, so FILTER is right here, but over the one column you need, not the whole table.', 'Use FILTER over VALUES(the column you need), not the whole table: CALCULATE([Sales], FILTER(VALUES(Table[Column]), [Measure] > 0)). Use ALL(Table[Column]) instead of VALUES to ignore that column\'s filters.'],
      ar: ['FILTER على جدول كامل لاختبار مقياس', 'استخدام FILTER(Table, [Measure] > 0) كفلتر داخل CALCULATE يحسب المقياس لكل صف في الجدول. المقياس لا يصلح في فلتر Boolean، لذلك FILTER صحيح هنا، لكن على العمود الذي تحتاجه فقط لا على الجدول كله.', 'استخدم FILTER على VALUES(العمود الذي تحتاجه) لا على الجدول كله: CALCULATE([Sales], FILTER(VALUES(Table[Column]), [Measure] > 0)). استخدم ALL(Table[Column]) بدل VALUES لتجاهل فلاتر هذا العمود.'] }
  };

  // Where each rule comes from (checked on 15 Oct 2026; each page opened before it was cited). kind: 'microsoft'
  // (a Microsoft Learn page), 'bpa' (a rule of Microsoft's Best Practice Analyzer, by its id), 'dataarcus' (our own
  // rule: no link, the reason in says). says: what the source states, in our own words, English and Arabic.
  const ML = 'https://learn.microsoft.com/';
  const BPA_URL = 'https://github.com/microsoft/Analysis-Services/tree/master/BestPracticeRules';
  const srcMs = (path, title, en, ar, bpa) => Object.assign({ kind: 'microsoft', url: ML + path, title, says: { en, ar } }, bpa ? { bpa } : {});
  const srcBpa = (id, en, ar) => ({ kind: 'bpa', url: BPA_URL, title: id, says: { en, ar } });
  const srcOwn = (en, ar) => ({ kind: 'dataarcus', title: 'DataArcus', says: { en, ar } });
  const SOURCES = {
    AUTODATE: srcMs('power-bi/guidance/auto-date-time', 'Auto date/time guidance in Power BI Desktop',
      'Microsoft advises turning Auto date/time off when it is not needed and using one date table of your own.',
      'تنصح Microsoft بإيقاف Auto date/time عندما لا تحتاجه واستخدام جدول تاريخ واحد خاص بك.'),
    UNUSED_COL: srcMs('power-bi/guidance/import-modeling-data-reduction#remove-unnecessary-columns', 'Data reduction techniques for Import modeling: Remove unnecessary columns',
      'Microsoft says a column that serves no report and no model structure can usually be removed.',
      'تقول Microsoft إن العمود الذي لا يخدم التقرير ولا بنية النموذج يمكن حذفه غالبًا.'),
    UNUSED_TABLE: srcMs('power-bi/guidance/import-modeling-data-reduction#disable-power-query-query-load', 'Data reduction techniques for Import modeling: Disable Power Query query load',
      'Microsoft says a query that only feeds other queries should not be loaded to the model.',
      'تقول Microsoft إن الاستعلام الذي يخدم استعلامات أخرى فقط لا يجب تحميله إلى النموذج.'),
    CALC_COLS: srcMs('power-bi/guidance/import-modeling-data-reduction#preference-for-custom-columns', 'Data reduction techniques for Import modeling: Preference for custom columns',
      'Microsoft says calculated columns compress less well and are built after the tables load, so it prefers Power Query columns where possible.',
      'تقول Microsoft إن الأعمدة المحسوبة تنضغط أقل وتُبنى بعد تحميل الجداول، لذلك تفضّل أعمدة Power Query حيثما أمكن.'),
    STRING_KEYS: srcMs('power-bi/guidance/import-modeling-data-reduction#optimize-column-data-types', 'Data reduction techniques for Import modeling: Optimize column data types',
      'Microsoft says numeric columns store best and text needs hash encoding; its Best Practice Analyzer asks for integer relationship columns.',
      'تقول Microsoft إن الأعمدة الرقمية تُخزَّن بأفضل شكل وإن النصوص تحتاج hash encoding، وقاعدة Best Practice Analyzer تطلب أعمدة علاقات من نوع integer.',
      'RELATIONSHIP_COLUMNS_SHOULD_BE_OF_INTEGER_DATA_TYPE'),
    BIDI: srcMs('power-bi/guidance/relationships-bidirectional-filtering', 'Bi-directional relationship guidance',
      'Microsoft recommends few both-direction relationships and CROSSFILTER inside the measure that needs it; one-to-one relationships and many-to-many bridges are its exceptions.',
      'تنصح Microsoft بتقليل العلاقات في الاتجاهين واستخدام CROSSFILTER داخل المقياس الذي يحتاجه، وتستثني علاقات one-to-one وجداول bridge لعلاقات many-to-many.'),
    BIDI_BRIDGE: srcMs('power-bi/guidance/relationships-many-to-many#relate-many-to-many-dimensions', 'Many-to-many relationship guidance: Relate many-to-many dimensions',
      'Microsoft relates two dimensions through a bridge table with one-to-many relationships, one of them filtering in both directions.',
      'تربط Microsoft بُعدين عبر جدول bridge بعلاقات one-to-many، واحدة منها تصفّي في الاتجاهين.'),
    M2M: srcMs('power-bi/guidance/relationships-many-to-many', 'Many-to-many relationship guidance',
      'Microsoft advises against relating dimensions directly with many-to-many cardinality and uses a bridge table instead.',
      'لا تنصح Microsoft بربط جداول الأبعاد مباشرة بعلاقة many-to-many، وتستخدم جدول bridge بدلًا من ذلك.'),
    INACTIVE_UNUSED: srcMs('power-bi/guidance/relationships-active-inactive', 'Active vs inactive relationship guidance',
      'Microsoft says an inactive relationship filters only while a DAX expression turns it on; its Best Practice Analyzer flags inactive relationships no USERELATIONSHIP uses.',
      'تقول Microsoft إن العلاقة غير النشطة لا تصفّي إلا عندما يفعّلها تعبير DAX، وقاعدة Best Practice Analyzer تنبّه إلى العلاقات غير النشطة التي لا يستخدمها USERELATIONSHIP.',
      'INACTIVE_RELATIONSHIPS_THAT_ARE_NEVER_ACTIVATED'),
    USEREL_ACTIVE: srcMs('dax/userelationship-function-dax', 'USERELATIONSHIP function (DAX)',
      'Microsoft says USERELATIONSHIP makes the named relationship the one used during the calculation, whether or not it is active.',
      'تقول Microsoft إن USERELATIONSHIP يجعل العلاقة المذكورة هي المستخدمة أثناء الحساب، سواء كانت نشطة أم لا.'),
    FILTER_TABLE: srcMs('dax/best-practices/dax-avoid-avoid-filter-as-filter-argument', 'Avoid using FILTER as a filter argument in DAX',
      'Microsoft recommends Boolean filter arguments, with KEEPFILTERS where needed, over FILTER of a table, whenever the filter allows it.',
      'تنصح Microsoft بفلاتر Boolean، مع KEEPFILTERS عند الحاجة، بدل FILTER على جدول كلما سمح الفلتر بذلك.',
      'FILTER_COLUMN_VALUES'),
    FILTER_MEASURE: srcMs('dax/best-practices/dax-avoid-avoid-filter-as-filter-argument', 'Avoid using FILTER as a filter argument in DAX',
      'Microsoft says a Boolean filter cannot reference a measure, so FILTER is needed there, and its example filters VALUES of one column; its Best Practice Analyzer says filter by columns, not tables.',
      'تقول Microsoft إن فلتر Boolean لا يمكن أن يشير إلى مقياس، لذلك يلزم FILTER هنا، ومثالها يصفّي VALUES لعمود واحد، وقاعدة Best Practice Analyzer تقول: فلتر بالأعمدة لا بالجداول.',
      'FILTER_MEASURE_VALUES_BY_COLUMNS'),
    IFERROR: srcMs('dax/best-practices/dax-error-functions', 'Appropriate use of error functions in DAX',
      'Microsoft advises avoiding ISERROR and IFERROR, which can slow calculations, and using IF tests or DIVIDE instead.',
      'تنصح Microsoft بتجنب ISERROR وIFERROR لأنهما قد يبطئان الحساب، وباستخدام IF أو DIVIDE بدلًا منهما.'),
    DIVISION: srcMs('dax/best-practices/dax-divide-function-operator', 'DIVIDE function vs divide operator (/) in DAX',
      'Microsoft recommends DIVIDE when the denominator could be zero or blank, and the "/" operator when it is a constant.',
      'تنصح Microsoft بـ DIVIDE عندما قد يكون المقام صفرًا أو فارغًا، وبالعامل "/" عندما يكون المقام ثابتًا.'),
    QUALIFIED_MEASURE: srcMs('dax/best-practices/dax-column-measure-references', 'Column and measure references in DAX',
      'Microsoft recommends never writing the table name before a measure reference.',
      'تنصح Microsoft بعدم كتابة اسم الجدول قبل الإشارة إلى مقياس أبدًا.'),
    UNQUALIFIED_COLUMN: srcMs('dax/best-practices/dax-column-measure-references', 'Column and measure references in DAX',
      'Microsoft recommends always writing the table name before a column reference.',
      'تنصح Microsoft بكتابة اسم الجدول دائمًا قبل الإشارة إلى عمود.'),
    NO_RLS: srcMs('fabric/security/service-admin-row-level-security', 'Row-level security (RLS) with Power BI',
      'Microsoft describes RLS as the way to restrict which rows each user of a semantic model can see, through roles.',
      'تصف Microsoft أمان RLS بأنه طريقة تحديد الصفوف التي يراها كل مستخدم للنموذج الدلالي، عبر الأدوار.'),
    DATE_NOT_MARKED: srcMs('power-bi/transform-model/desktop-date-tables', 'Set and use date tables in Power BI Desktop',
      'Microsoft says the classic time intelligence functions need the calendar marked as a date table, and marking it removes the automatic date table.',
      'تقول Microsoft إن دوال time intelligence الكلاسيكية تحتاج أن يُعلَّم التقويم كجدول تاريخ، وإن تعليمه يحذف جدول التاريخ التلقائي.'),
    TABLE_BUFFER: srcMs('powerquery-m/table-buffer', 'Table.Buffer (Power Query M)',
      'Microsoft says Table.Buffer may or may not speed a query up, can slow it down, and stops folding after it.',
      'تقول Microsoft إن Table.Buffer قد يسرّع الاستعلام أو لا، وقد يبطئه، ويوقف query folding بعده.'),
    CALENDARAUTO: srcMs('dax/calendarauto-function-dax', 'CALENDARAUTO function (DAX)',
      'Microsoft says CALENDARAUTO takes its range from the earliest and the latest date in the model\'s columns.',
      'تقول Microsoft إن CALENDARAUTO يأخذ مداه من أقدم وأحدث تاريخ في أعمدة النموذج.'),
    DOUBLE: srcBpa('AVOID_FLOATING_POINT_DATA_TYPES', 'Microsoft\'s Best Practice Analyzer advises against the Double type, which can give rounding errors.', 'تنصح قاعدة Best Practice Analyzer من Microsoft بتجنب نوع Double لأنه قد يعطي أخطاء تقريب.'),
    UNUSED_MEASURE: srcBpa('UNNECESSARY_MEASURES', 'Microsoft\'s Best Practice Analyzer asks to remove hidden measures that no DAX expression references.', 'تطلب قاعدة Best Practice Analyzer من Microsoft حذف المقاييس المخفية التي لا يشير إليها أي تعبير DAX.'),
    FK_VISIBLE: srcBpa('HIDE_FOREIGN_KEYS', 'Microsoft\'s Best Practice Analyzer says the key columns on the many side of a relationship should always be hidden.', 'تقول قاعدة Best Practice Analyzer من Microsoft إن أعمدة المفاتيح في جهة many من العلاقة يجب إخفاؤها دائمًا.'),
    SUMMARIZE_KEYS: srcBpa('NUMERIC_COLUMN_SUMMARIZE_BY', 'Microsoft\'s Best Practice Analyzer asks to set numeric columns to not summarize, to avoid accidental sums.', 'تطلب قاعدة Best Practice Analyzer من Microsoft ضبط الأعمدة الرقمية على عدم التجميع لتجنب الجمع بالخطأ.'),
    NO_FORMAT: srcBpa('PROVIDE_FORMAT_STRING_FOR_MEASURES', 'Microsoft\'s Best Practice Analyzer asks for a format string on every visible measure.', 'تطلب قاعدة Best Practice Analyzer من Microsoft تنسيقًا لكل مقياس ظاهر.'),
    NO_DESC: srcBpa('OBJECTS_WITH_NO_DESCRIPTION', 'Microsoft\'s Best Practice Analyzer asks for a description on visible objects, shown when you hover them in the field list.', 'تطلب قاعدة Best Practice Analyzer من Microsoft وصفًا للعناصر الظاهرة، ويظهر عند المرور عليها في قائمة الحقول.'),
    DUP_MEASURE: srcBpa('AVOID_DUPLICATE_MEASURES', 'Microsoft\'s Best Practice Analyzer says two measures should not have the same DAX.', 'تقول قاعدة Best Practice Analyzer من Microsoft إن مقياسين لا يجب أن تكون لهما نفس صيغة DAX.'),
    TRAILING_SPACE: srcBpa('OBJECTS_SHOULD_NOT_START_OR_END_WITH_A_SPACE', 'Microsoft\'s Best Practice Analyzer says names should not start or end with a space.', 'تقول قاعدة Best Practice Analyzer من Microsoft إن الأسماء لا يجب أن تبدأ أو تنتهي بمسافة.'),
    MONTH_SORT: srcBpa('MONTH_(AS_A_STRING)_MUST_BE_SORTED', 'Microsoft\'s Best Practice Analyzer says text month columns need a sort column, or they sort alphabetically.', 'تقول قاعدة Best Practice Analyzer من Microsoft إن أعمدة الشهور النصية تحتاج عمود ترتيب وإلا تترتب أبجديًا.'),
    PCT_FORMAT: srcOwn('A measure named as a rate or percent whose format is not a percentage (Microsoft\'s PERCENTAGE_FORMATTING rule checks a different thing).', 'مقياس اسمه يدل على نسبة وتنسيقه ليس نسبة مئوية (قاعدة PERCENTAGE_FORMATTING من Microsoft تفحص شيئًا آخر).'),
    NO_FOLDERS: srcOwn('With 20 or more measures, a flat list is hard to browse; display folders keep it in order.', 'مع 20 مقياسًا أو أكثر تصعب القائمة المسطحة، ومجلدات العرض ترتّبها.'),
    LONG_MEASURE: srcOwn('Past 60 lines a measure is hard to review; the limit is our choice.', 'بعد 60 سطرًا تصعب مراجعة المقياس، والحد اختيارنا.'),
    DEEP_CHAIN: srcOwn('8 or more levels of measures on measures make a change hard to trace; the limit is our choice.', '8 مستويات أو أكثر من مقاييس فوق مقاييس تجعل تتبع التعديل صعبًا، والحد اختيارنا.'),
    NAMING: srcOwn('One naming style for tables makes a model easier to read.', 'نمط واحد لأسماء الجداول يجعل النموذج أسهل للقراءة.'),
    HARDCODED_PATH: srcOwn('A fixed path or server in a query breaks when someone else refreshes or the model moves between test and production.', 'المسار أو الخادم الثابت في الاستعلام ينكسر عند التحديث من شخص آخر أو عند نقل النموذج بين الاختبار والإنتاج.'),
    LONG_M: srcOwn('Past 40 steps a query is hard to debug; the limit is our choice.', 'بعد 40 خطوة يصعب تتبع الاستعلام، والحد اختيارنا.'),
    BROKEN_REF: srcOwn('A visual or filter that names a field the model no longer has shows an error to report users.', 'الـ visual أو الفلتر الذي يذكر حقلًا لم يعد في النموذج يظهر خطأ لمستخدمي التقرير.')
  };
  Object.keys(SOURCES).forEach((id) => { RULES[id].source = SOURCES[id]; });

  // ---------- the rules: the model in, findings out ----------
  function runRules(input) {
    const { M, IX, report: rep, used, vis, broken, styleByMeasure, userTables, autoDateTables, allMeasures, mQueries, chainDepths } = input;
    const findings = [];
    const add = (id, items) => { if (items && items.length) findings.push({ id, items }); };
    // A check that needs a column's type is skipped for a column whose type is unknown (dataType "unknown": a TMDL
    // project gives no type for columns of DAX tables), and listed, so a missing type never becomes a wrong finding.
    const skipped = [];
    const skip = (id, obj) => {
      let s = skipped.find((x) => x.id === id);
      if (!s) skipped.push(s = { id, reason: 'unknownType', items: [] });
      if (!s.items.some((x) => x.obj === obj)) s.items.push({ obj });
    };
    const untyped = (c) => c.dataType === 'unknown';

    // ---- relationships ----
    // Microsoft's exceptions (Bi-directional relationship guidance): a one-to-one relationship is always both ways (it
    // can't be set otherwise), never a finding; a many-to-many dimension bridge needs one both-way relationship. A
    // bridge here: the many side of two or more one-to-many relationships, no measures, and only key columns (Microsoft's
    // "factless" bridge). A fact table has other columns, so it keeps BIDI (Microsoft: CROSSFILTER in the measure).
    const oneToMany = (r) => r.fromCard === 'many' && r.toCard === 'one';
    const isBridge = (name) => {
      const t = IX.tables.get(lc(name)), rels = M.relationships.filter((r) => oneToMany(r) && lc(r.fromTable) === lc(name));
      if (!t || t.measures.length || rels.length < 2) return false;
      const keys = new Set(rels.map((r) => lc(r.fromColumn)));
      return t.columns.filter((c) => c.kind !== 'rowNumber').every((c) => keys.has(lc(c.name)));
    };
    // an inactive relationship filters nothing until USERELATIONSHIP turns it on (INACTIVE_UNUSED reports it if nothing does)
    const bidi = M.relationships.filter((r) => r.cross === 'bothDirections' && r.active && !(r.fromCard === 'one' && r.toCard === 'one'));
    const bridgeBidi = bidi.filter((r) => oneToMany(r) && isBridge(r.fromTable));
    const relObj = (r) => ({ obj: `${r.fromTable}[${r.fromColumn}] ↔ ${r.toTable}[${r.toColumn}]` });
    add('BIDI', bidi.filter((r) => !bridgeBidi.includes(r)).map(relObj));
    add('BIDI_BRIDGE', bridgeBidi.map(relObj));
    add('M2M', M.relationships.filter((r) => r.fromCard === 'many' && r.toCard === 'many').map((r) => ({ obj: `${r.fromTable}[${r.fromColumn}] ↔ ${r.toTable}[${r.toColumn}]` })));
    const daxSources = [];
    M.tables.forEach((t) => {
      t.measures.forEach((ms) => daxSources.push({ where: '[' + ms.name + ']', expr: [ms.expr, ms.fsExpr, ms.detailRows, ms.kpi].join('\n') }));
      t.columns.forEach((c) => { if (c.expr) daxSources.push({ where: t.name + '[' + c.name + ']', expr: c.expr }); });
      if (t.calcExpr) daxSources.push({ where: t.name, expr: t.calcExpr });
      if (t.calcGroup) t.calcGroup.items.forEach((ci) => daxSources.push({ where: t.name + ' / ' + ci.name, expr: ci.expr + '\n' + ci.fsExpr }));
    });
    M.roles.forEach((ro) => ro.permissions.forEach((p) => daxSources.push({ where: 'Role ' + ro.name, expr: p.filter })));
    M.functions.forEach((f) => daxSources.push({ where: f.name, expr: f.expr }));
    if (rep) rep.ext.forEach((x) => daxSources.push({ where: '[' + x.name + ']', expr: x.expr }));
    const useRel = []; // { a: 'table|col', b: 'table|col', where }
    daxSources.forEach((src) => {
      if (!/USERELATIONSHIP/i.test(src.expr || '')) return;
      const tk = tokenizeDax(src.expr);
      for (let i = 0; i < tk.length; i++) {
        if (!(tk[i].t === 'id' && tk[i].v.toUpperCase() === 'USERELATIONSHIP' && tk[i + 1] && tk[i + 1].v === '(')) continue;
        const cols = [];
        for (let j = i + 2; j < tk.length && cols.length < 2; j++) {
          if (tk[j].t === 'op' && tk[j].v === ')') break;
          if ((tk[j].t === 'tbl' || tk[j].t === 'id') && tk[j + 1] && tk[j + 1].t === 'br') { cols.push(lc(tk[j].v) + '|' + lc(tk[j + 1].v)); j++; }
        }
        if (cols.length === 2) useRel.push({ a: cols[0], b: cols[1], where: src.where });
      }
    });
    const relKey = (r) => [lc(r.fromTable) + '|' + lc(r.fromColumn), lc(r.toTable) + '|' + lc(r.toColumn)];
    const relUsed = (r) => { const [f, t2] = relKey(r); return useRel.filter((u) => (u.a === f && u.b === t2) || (u.a === t2 && u.b === f)); };
    add('INACTIVE_UNUSED', M.relationships.filter((r) => !r.active && !relUsed(r).length).map((r) => ({ obj: `${r.fromTable}[${r.fromColumn}] → ${r.toTable}[${r.toColumn}]` })));
    const activeUse = [];
    M.relationships.filter((r) => r.active).forEach((r) => { const u = relUsed(r); if (u.length) activeUse.push({ obj: `${r.fromTable}[${r.fromColumn}] → ${r.toTable}[${r.toColumn}]`, detail: uniq(u.map((x) => x.where)).slice(0, 3).join(', ') }); });
    add('USEREL_ACTIVE', activeUse);
    if (broken.size) add('BROKEN_REF', Array.from(broken.values()).sort((a, b) => b.n - a.n).map((b) => ({ obj: b.obj, detail: Array.from(b.pages).join('; ') })));
    const strKeys = [];
    M.relationships.forEach((r) => {
      const c = IX.columns.get(lc(r.toTable) + '|' + lc(r.toColumn));
      if (c && untyped(c.col)) skip('STRING_KEYS', `${r.toTable}[${r.toColumn}]`);
      if (c && c.col.dataType === 'string' && !strKeys.some((x) => x.obj === `${r.toTable}[${r.toColumn}]`)) strKeys.push({ obj: `${r.toTable}[${r.toColumn}]` });
    });
    add('STRING_KEYS', strKeys);

    // ---- auto date/time ----
    if (autoDateTables.length) add('AUTODATE', autoDateTables.filter((t) => /^LocalDateTable_/.test(t.name)).map((t) => {
      const owner = M.tables.find((x) => x.columns.some((c) => c.relatedColumnDetails || (c.extendedProperties && JSON.stringify(c.extendedProperties).includes(t.name))));
      return { obj: t.name, detail: owner ? owner.name : '' };
    }));

    // ---- unused (only with a report) ----
    if (rep) {
      const unusedCols = [];
      userTables.forEach((t) => {
        if (t.calcGroup) return;
        t.columns.forEach((c) => {
          if (c.kind === 'rowNumber') return;
          if (!used.has(K.c(t.name, c.name))) unusedCols.push({ obj: `${t.name}[${c.name}]`, detail: t.isCalcTable ? 'DAX table: edit its DAX' : c.kind === 'calculated' ? 'calculated' : (c.hidden ? 'hidden' : '') });
        });
      });
      add('UNUSED_COL', unusedCols);
      add('UNUSED_MEASURE', allMeasures.filter((ms) => !used.has(K.m(ms.name))).map((ms) => ({ obj: `[${ms.name}]`, detail: ms.displayFolder })));
      add('UNUSED_TABLE', userTables.filter((t) => !used.has(K.t(t.name)) && !t.columns.some((c) => used.has(K.c(t.name, c.name))) && !t.measures.some((ms) => used.has(K.m(ms.name)))).map((t) => ({ obj: t.name })));
    }

    // ---- columns ----
    // ---- DAX shape helpers ----
    const isTbl = (tk) => tk && (tk.t === 'tbl' || tk.t === 'id') && IX.tables.has(lc(tk.v));
    const isOp = (x, v) => x && x.t === 'op' && x.v === v;
    const call = (tk, i) => tk[i] && tk[i].t === 'id' && isOp(tk[i + 1], '(');
    const closeOf = (tk, i) => { for (let d = 0, j = i; j < tk.length; j++) { if (isOp(tk[j], '(')) d++; else if (isOp(tk[j], ')') && !--d) return j; } return tk.length; };
    const argsOf = (tk, i) => { // the arguments of the call whose "(" is at i
      const out = [[]], end = closeOf(tk, i);
      for (let j = i + 1, d = 0; j < end; j++) {
        if (isOp(tk[j], '(')) d++; else if (isOp(tk[j], ')')) d--;
        if (!d && isOp(tk[j], ',')) out.push([]); else out[out.length - 1].push(tk[j]);
      }
      return out;
    };
    // a measure reference: [Name] that is a measure and not a column of the qualifying (or home) table
    const measureRef = (tk, j, home) => {
      const x = tk[j], p = tk[j - 1];
      if (x.t !== 'br' || !IX.measures.has(lc(x.v))) return false;
      if (isTbl(p)) return !IX.columns.has(lc(p.v) + '|' + lc(x.v));
      return !(home && IX.columns.has(lc(home) + '|' + lc(x.v)));
    };
    // Does a measure return text, so a number format can't apply? From the DAX: the result (after VAR ... RETURN) is a
    // string, an "&", CONCATENATE(X), FORMAT, UNICHAR, SELECTEDVALUE / MAX / MIN of a text column, a variable holding
    // one of these, an IF / SWITCH whose results are all text, CALCULATE(TABLE) of one of these, an EXTERNALMEASURE
    // declared STRING (a composite model's remote measure), or a measure that returns text. Anything unclear is not
    // text (the finding stays).
    const isBlankCall = (r) => r.length === 3 && r[0].t === 'id' && /^BLANK$/i.test(r[0].v) && isOp(r[1], '(') && isOp(r[2], ')');
    const isText = (tk, vars, n) => {
      if (n > 12 || !tk.length) return false;
      while (tk.length > 2 && isOp(tk[0], '(') && closeOf(tk, 0) === tk.length - 1) tk = tk.slice(1, -1);
      if (tk[0].t === 'id' && /^VAR$/i.test(tk[0].v)) {
        const v2 = Object.assign({}, vars);
        for (let j = 0, d = 0, name = null, start = 0; j < tk.length; j++) {
          if (isOp(tk[j], '(')) d++; else if (isOp(tk[j], ')')) d--;
          if (d || tk[j].t !== 'id' || !/^(VAR|RETURN)$/i.test(tk[j].v)) continue;
          if (name != null) v2[name] = tk.slice(start, j);
          if (/^RETURN$/i.test(tk[j].v)) return isText(tk.slice(j + 1), v2, n + 1);
          name = tk[j + 1] ? lc(tk[j + 1].v) : ''; start = j + 3; j += 2;
        }
        return false;
      }
      for (let j = 0, d = 0; j < tk.length; j++) {
        if (isOp(tk[j], '(')) d++; else if (isOp(tk[j], ')')) d--;
        else if (!d && isOp(tk[j], '&') && !isOp(tk[j + 1], '&') && !isOp(tk[j - 1], '&')) return true; // "&", not "&&"
      }
      if (tk.length === 1 && measureRef(tk, 0, null)) return isText(tokenizeDax(IX.measures.get(lc(tk[0].v)).m.expr), {}, n + 1);
      if (tk.length === 2 && isTbl(tk[0]) && measureRef(tk, 1, null)) return isText(tokenizeDax(IX.measures.get(lc(tk[1].v)).m.expr), {}, n + 1);
      if (tk.length === 1) return tk[0].t === 'str' || (tk[0].t === 'id' && !!vars[lc(tk[0].v)] && isText(vars[lc(tk[0].v)], vars, n + 1));
      if (!call(tk, 0) || closeOf(tk, 1) !== tk.length - 1) return false;
      const fn = tk[0].v.toUpperCase(), args = argsOf(tk, 1);
      const allText = (res) => { res = res.filter((r) => !isBlankCall(r)); return res.length > 0 && res.every((r) => isText(r, vars, n + 1)); };
      if (/^(CONCATENATE|CONCATENATEX|FORMAT|UNICHAR)$/.test(fn)) return true;
      if (fn === 'EXTERNALMEASURE') return !!args[1] && args[1].length === 1 && args[1][0].t === 'id' && /^STRING$/i.test(args[1][0].v);
      if (/^CALCULATE(TABLE)?$/.test(fn)) return isText(args[0], vars, n + 1); // its value is its expression's
      // FIRSTNONBLANK / LASTNONBLANK return the column's value; their VALUE forms return the expression's; MINX / MAXX
      // (over ALLSELECTED, VALUES or a table) return their expression's
      const textCol = (a) => { const c = a && a.length === 2 && isTbl(a[0]) && a[1].t === 'br' && IX.columns.get(lc(a[0].v) + '|' + lc(a[1].v)); return !!c && c.col.dataType === 'string'; };
      if (/^(FIRSTNONBLANK|LASTNONBLANK)$/.test(fn)) return args.length === 2 && textCol(args[0]);
      if (/^(FIRSTNONBLANKVALUE|LASTNONBLANKVALUE|MINX|MAXX)$/.test(fn)) return args.length === 2 && (textCol(args[1]) || isText(args[1], vars, n + 1));
      if (/^(SELECTEDVALUE|MAX|MIN)$/.test(fn)) {
        const a = args[0], c = a && a.length === 2 && isTbl(a[0]) && a[1].t === 'br' && IX.columns.get(lc(a[0].v) + '|' + lc(a[1].v));
        return !!c && c.col.dataType === 'string' && args.length <= (fn === 'SELECTEDVALUE' ? 2 : 1);
      }
      if (fn === 'IF') return args.length >= 2 && allText(args.slice(1));
      if (fn === 'SWITCH') { const rest = args.slice(1), res = []; for (let k = 1; k < rest.length; k += 2) res.push(rest[k]); if (rest.length % 2) res.push(rest[rest.length - 1]); return allText(res); }
      return false;
    };
    const returnsText = (expr) => isText(tokenizeDax(expr), {}, 0);
    // A calculated column Microsoft says belongs in DAX ("when the formula involves evaluating measures, or it requires
    // specific modeling functionality only supported in DAX functions"): parent-child paths, a measure, context
    // transition, RANKX, EARLIER, or an aggregate over another table. RELATED alone is a lookup a merge can do.
    const AGG_FN = /^(SUMX|AVERAGEX|COUNTX|COUNTAX|MINX|MAXX|PRODUCTX|CONCATENATEX|COUNTROWS|FILTER|SUMMARIZE|ADDCOLUMNS|TOPN|SUM|AVERAGE|MIN|MAX|COUNT|COUNTA|DISTINCTCOUNT|COUNTBLANK)$/i;
    const daxOnlyColumn = (expr, home) => {
      const tk = tokenizeDax(expr);
      for (let i = 0; i < tk.length; i++) {
        if (call(tk, i) && /^(PATH|PATHITEM|PATHITEMREVERSE|PATHLENGTH|PATHCONTAINS|CALCULATE|CALCULATETABLE|RANKX|EARLIER|EARLIEST|RELATEDTABLE)$/i.test(tk[i].v)) return true;
        if (call(tk, i) && AGG_FN.test(tk[i].v)) {
          let a = tk[i + 2];
          if (call(tk, i + 2) && /^(ALL|ALLNOBLANKROW|VALUES|DISTINCT)$/i.test(a.v)) a = tk[i + 4];
          if (isTbl(a) && lc(a.v) !== lc(home)) return true;
        }
        if (measureRef(tk, i, home)) return true;
      }
      return false;
    };
    const doubles = [], calcCols = [], fkVisible = [], sumKeys = [], monthSort = [];
    const manySide = new Set(M.relationships.filter((r) => r.fromCard === 'many' && r.toCard === 'one').map((r) => lc(r.fromTable) + '|' + lc(r.fromColumn)));
    const isUnused = (t, c) => rep && !used.has(K.c(t.name, c.name));
    userTables.forEach((t) => {
      const importFromSource = !t.isCalcTable && t.mode !== 'directQuery';
      t.columns.forEach((c) => {
        if (c.kind === 'rowNumber') return;
        // map coordinates are left alone: Microsoft says "Latitude and Longitude fields must be in Decimal Number format"
        // (Decimal number is the double type; https://learn.microsoft.com/power-bi/visuals/power-bi-map-tips-and-tricks)
        const coordinate = /^(latitude|longitude)$/i.test(c.dataCategory);
        if (c.dataType === 'double' && !c.hidden && !coordinate) doubles.push({ obj: `${t.name}[${c.name}]` });
        if (untyped(c) && !c.hidden) skip('DOUBLE', `${t.name}[${c.name}]`);
        if (c.kind === 'calculated' && importFromSource && !daxOnlyColumn(c.expr, t.name)) calcCols.push({ obj: `${t.name}[${c.name}]`, detail: /RELATED|LOOKUPVALUE|CALCULATE|SUMX|COUNTROWS|FILTER/i.test(c.expr) ? 'uses model data' : '' });
        if (isUnused(t, c)) return; // already reported as unused, do not count it twice
        if (!c.hidden && manySide.has(lc(t.name) + '|' + lc(c.name))) fkVisible.push({ obj: `${t.name}[${c.name}]` });
        const cn = c.name.trim();
        // (a key written in CamelCase: a lower-case letter directly followed by ID, Id, Key, Code or No at the end of the
        // name, as in OrderID, CustomerKey, ProductCode, InvoiceNo. The capital matters: Paid, Monkey, Barcode, Casino
        // and Turkey are not keys)
        const keyLike = !c.hidden && (c.summarizeBy === 'default' || c.summarizeBy === 'sum') && (/[a-z](ID|Id|Key|Code|No)$/.test(cn) || /((^|[\s_])(id|key|code|no|index)$|_id$|^(year|month|week|day|quarter)(\s*(no|num|number))?$|^(fiscal\s*)?year$|(month|week|day|quarter)\s*(no|num|number|of year)$|sort\s*(order|key)?$)/i.test(cn));
        if (keyLike && /^(int64|double|decimal)$/.test(c.dataType)) sumKeys.push({ obj: `${t.name}[${c.name}]` });
        if (keyLike && untyped(c)) skip('SUMMARIZE_KEYS', `${t.name}[${c.name}]`);
        const monthLike = /(^|\s|_)(month|day|weekday)\s*_?(name|short)$|^(day of week|weekday|mmm|mmmm)$|short\s*month|month\s*-?\s*year|^month\s*year$|^(اسم\s*)?(الشهر|اليوم)$/i.test(cn) || (c.kind === 'calculated' && /FORMAT\s*\([^)]*"\s*(mmm|mmmm|ddd|dddd)\s*"/i.test(c.expr));
        if (monthLike && c.dataType === 'string' && !c.sortBy) monthSort.push({ obj: `${t.name}[${c.name}]` });
        if (monthLike && untyped(c) && !c.sortBy) skip('MONTH_SORT', `${t.name}[${c.name}]`);
      });
    });
    add('DOUBLE', doubles); add('CALC_COLS', calcCols); add('FK_VISIBLE', fkVisible); add('SUMMARIZE_KEYS', sumKeys); add('MONTH_SORT', monthSort);

    // ---- date table ----
    const dateParts = (t) => t.columns.filter((c) => /^(year|month|month name|month number|quarter|weekday|week|day|fiscal year)/i.test(c.name.trim())).length;
    const relDateTargets = new Set(M.relationships.map((r) => lc(r.toTable) + '|' + lc(r.toColumn)));
    // a calendar: a date column (isDate) and a calendar name, or date parts and a relationship to its date column
    const calendarBy = (isDate) => (t) => t.columns.some(isDate) && (
      // not \b: in JavaScript it only knows ASCII letters, so it never matches after an Arabic word
      /^(dim[_ ]?)?(calendar|dates?|date\s*table|(ال)?تقويم)(?![\p{L}\p{N}_])/iu.test(t.name.trim()) ||
      (dateParts(t) >= 2 && t.columns.some((c) => isDate(c) && relDateTargets.has(lc(t.name) + '|' + lc(c.name)))));
    // a date picker (a disconnected start or end date for a slicer) is not a calendar: its only column is a date and no relationship touches it
    const isPicker = (t) => { const cols = t.columns.filter((c) => c.kind !== 'rowNumber'); return cols.length === 1 && (cols[0].dataType === 'dateTime' || untyped(cols[0])) && !M.relationships.some((r) => lc(r.fromTable) === lc(t.name) || lc(r.toTable) === lc(t.name)); };
    const calendars = userTables.filter((t) => !isPicker(t)).filter(calendarBy((c) => c.dataType === 'dateTime'));
    add('DATE_NOT_MARKED', calendars.filter((t) => lc(t.dataCategory) !== 'time').map((t) => ({ obj: t.name })));
    // would be a calendar if a column of unknown type were a date
    userTables.filter((t) => !calendars.includes(t) && !isPicker(t) && lc(t.dataCategory) !== 'time' && calendarBy((c) => c.dataType === 'dateTime' || untyped(c))(t)).forEach((t) => skip('DATE_NOT_MARKED', t.name));
    add('CALENDARAUTO', userTables.filter((t) => t.isCalcTable && /CALENDARAUTO\s*\(/i.test(daxCode(t.calcExpr))).map((t) => ({ obj: t.name })));

    // ---- DAX patterns ----
    const filterTable = [], filterMeasure = [], iferr = [], division = [], noFmt = [], pctFmt = [], noFolder = [], noDesc = [], longMs = [], deep = [], qualM = [], unqualC = [];
    // FILTER(<table>, ...) or FILTER(ALL(<table>), ...) used directly as a filter argument of CALCULATE / CALCULATETABLE.
    // Returns which kinds it found: 'table' (the predicate tests columns: a Boolean filter can do it) and 'measure' (the
    // predicate references a measure: a Boolean filter can't, so FILTER is right, over a column; Microsoft's own advice).
    // What the FILTER predicate starting at token j (up to FILTER's closing parenthesis) tests: 'measure' (it references
    // a measure), 'var' (it compares with another table's column or an aggregate, which a Boolean filter can't take as
    // written; a value inside RELATED is a row lookup, not that), or 'table' (columns of the filtered table only).
    const PRED_AGG = /^(MIN|MAX|SUM|AVERAGE|COUNT|COUNTA|COUNTROWS|DISTINCTCOUNT|MINX|MAXX|SUMX|AVERAGEX|COUNTX|MINA|MAXA|FIRSTDATE|LASTDATE|CALCULATE)$/i;
    const predKind = (tk, j, filtered) => {
      let kind = 'table';
      for (let depth = 0; j < tk.length; j++) {
        const x = tk[j];
        if (call(tk, j) && /^RELATED$/i.test(x.v)) { j = closeOf(tk, j + 1); continue; }
        if (call(tk, j) && PRED_AGG.test(x.v)) kind = 'var';
        if (isOp(x, '(')) depth++;
        else if (isOp(x, ')')) { if (!depth) return kind; depth--; }
        else if (x.t === 'br') {
          if (measureRef(tk, j, null)) return 'measure';
          if (isTbl(tk[j - 1]) && lc(tk[j - 1].v) !== lc(filtered)) kind = 'var';
        }
      }
      return kind;
    };
    const filterOverTable = (src) => {
      const tk = tokenizeDax(src), stack = [], kinds = new Set();
      for (let i = 0; i < tk.length; i++) {
        const t = tk[i];
        if (t.t === 'op' && t.v === '(') { stack.push({ fn: tk[i - 1] && tk[i - 1].t === 'id' ? tk[i - 1].v.toUpperCase() : '', argStart: true }); continue; }
        if (t.t === 'op' && t.v === ')') { stack.pop(); continue; }
        if (t.t === 'op' && t.v === ',') { if (stack.length) stack[stack.length - 1].argStart = true; continue; }
        const top = stack[stack.length - 1];
        if (top && top.argStart && /^CALCULATE(TABLE)?$/.test(top.fn) && t.t === 'id' && t.v.toUpperCase() === 'FILTER' && tk[i + 1] && tk[i + 1].v === '(') {
          const a = tk[i + 2];
          let pred = -1, filtered = '';
          if (isTbl(a) && tk[i + 3] && tk[i + 3].v === ',') { pred = i + 4; filtered = a.v; }
          else if (a && a.t === 'id' && /^(ALL|ALLNOBLANKROW)$/i.test(a.v) && tk[i + 3] && tk[i + 3].v === '(' && isTbl(tk[i + 4]) && tk[i + 5] && tk[i + 5].v === ')') { pred = i + 7; filtered = tk[i + 4].v; }
          if (pred >= 0) kinds.add(predKind(tk, pred, filtered));
        }
        if (top && t.t !== 'op') top.argStart = false;
      }
      return kinds;
    };
    const msHidden = (ms) => ms.hidden || !!(IX.tables.get(lc(ms.table)) || {}).hidden;
    // daxCode with each use of a VAR bound to a nonzero number written as that number (VAR _Ticks = 60 ... / _Ticks)
    const constVarCode = (src) => {
      const tk = tokenizeDax(src), consts = new Map();
      for (let j = 0; j + 3 < tk.length; j++) {
        if (tk[j].t !== 'id' || !/^VAR$/i.test(tk[j].v) || tk[j + 1].t !== 'id' || !isOp(tk[j + 2], '=') || tk[j + 3].t !== 'num') continue;
        const after = tk[j + 4];
        if (Number(tk[j + 3].v) && (!after || (after.t === 'id' && /^(VAR|RETURN)$/i.test(after.v)))) consts.set(lc(tk[j + 1].v), String(Number(tk[j + 3].v)));
      }
      if (!consts.size) return daxCode(src);
      return tk.map((t, j) => (t.t === 'id' && consts.has(lc(t.v)) && !(tk[j - 1] && tk[j - 1].t === 'id' && /^VAR$/i.test(tk[j - 1].v)) ? consts.get(lc(t.v))
        : t.t === 'str' ? '""' : t.t === 'tbl' ? "'_'" : t.t === 'br' ? '[_]' : t.v)).join(' ');
    };
    // the measure's value is a count: COUNTROWS, COUNT, COUNTA or DISTINCTCOUNT at its root (inside CALCULATE too)
    const countRoot = (src) => {
      let tk = tokenizeDax(src);
      for (let n = 0; n < 4 && tk.length; n++) {
        while (tk.length > 2 && isOp(tk[0], '(') && closeOf(tk, 0) === tk.length - 1) tk = tk.slice(1, -1);
        if (!call(tk, 0) || closeOf(tk, 1) !== tk.length - 1) return false;
        if (/^(COUNTROWS|COUNT|COUNTA|DISTINCTCOUNT)$/i.test(tk[0].v)) return true;
        if (!/^CALCULATE$/i.test(tk[0].v)) return false;
        tk = argsOf(tk, 1)[0] || [];
      }
      return false;
    };
    allMeasures.forEach((ms, i) => {
      const code = daxCode(ms.expr);
      const name = `[${ms.name}]`;
      if (/\bCALCULATE(TABLE)?\b/i.test(code) && /\bFILTER\b/i.test(code)) {
        const kinds = filterOverTable(ms.expr);
        if (kinds.has('var')) filterTable.push({ obj: name, detail: RULES.FILTER_TABLE.variants.VAR.en, variant: 'VAR' });
        else if (kinds.has('table')) filterTable.push({ obj: name });
        if (kinds.has('measure')) filterMeasure.push({ obj: name });
      }
      if (/\b(IFERROR|ISERROR)\s*\(/i.test(code)) iferr.push({ obj: name });
      // "/" followed by something that is not a plain number (a VAR bound to a nonzero number counts as that number)
      if (/\/\s*(?![\d.\s]+(?:[)\s,]|$))[\[\w'(]/.test(constVarCode(ms.expr))) division.push({ obj: name });
      // a measure returning text takes no number format; a hidden one no visual shows is not seen (BPA's rule is for visible measures)
      if (!ms.formatString && !ms.fsExpr && !returnsText(ms.expr) && !(msHidden(ms) && !vis.measures.has(lc(ms.name)))) noFmt.push({ obj: name });
      // (a ratio such as Current Ratio or Asset Turnover is a multiple, 0.00 on purpose; a count is a whole number whatever its name)
      // (AUD-043: the Arabic and full-width percent signs ٪ ％ and نسبة "ratio, percentage" too; not معدل, which is also
      // "average": a wrong finding is worse than a missed one. تغير/فرق are change/diff, left out like them)
      if (/(%|٪|％|نسبة|\bpct\b|\bpercent(age)?\b|\brate\b|\bshare\b)/i.test(ms.name) && !/(colou?r|icon|label|text|arrow|title|\bpp\b|\(pp\)|mom|yoy|delta|change|diff|hourly|exchange|run rate|\bper\b|\bcount\b|▲|▼|تغير|فرق)/i.test(ms.name) && ms.formatString && !/[%@]|pp|percent/i.test(ms.formatString) && !ms.fsExpr && !countRoot(ms.expr)) pctFmt.push({ obj: name, detail: ms.formatString });
      // folders and descriptions are for the field list: hidden measures are not in it
      if (!ms.displayFolder && !msHidden(ms)) noFolder.push({ obj: name });
      if (!ms.description && !msHidden(ms)) noDesc.push({ obj: name });
      const lines = ms.expr.split('\n').length;
      if (lines > 60) longMs.push({ obj: name, detail: lines + ' lines' });
      const dd = chainDepths[i];
      if (dd >= 8) deep.push({ obj: name, detail: dd + ' levels' });
      const st = styleByMeasure[ms.name];
      if (st && st.qualifiedMeasures.length) qualM.push({ obj: name, detail: uniq(st.qualifiedMeasures).slice(0, 3).join(', ') });
      if (st && st.unqualifiedColumns.length) unqualC.push({ obj: name, detail: uniq(st.unqualifiedColumns).slice(0, 3).join(', ') });
    });
    add('FILTER_TABLE', filterTable); add('FILTER_MEASURE', filterMeasure); add('IFERROR', iferr); add('DIVISION', division);
    add('NO_FORMAT', noFmt); add('PCT_FORMAT', pctFmt);
    const shown = allMeasures.filter((ms) => !msHidden(ms)).length; // visible measures, in the share and the floor
    if (shown >= 20 && noFolder.length / shown > 0.3) add('NO_FOLDERS', noFolder);
    if (shown && noDesc.length / shown > 0.5) add('NO_DESC', noDesc);
    add('LONG_MEASURE', longMs); add('DEEP_CHAIN', deep);
    add('QUALIFIED_MEASURE', qualM); add('UNQUALIFIED_COLUMN', unqualC);

    // identical DAX
    const byExpr = new Map();
    allMeasures.forEach((ms) => {
      const tk = tokenizeDax(ms.expr), k0 = tk.map((t) => t.t + ':' + t.v).join('\u0001').toLowerCase();
      if (k0.length < 24) return;
      // an unqualified column is its home table's: SUM([SalesAmount]) in two tables sums two different columns
      const k = tk.map((t, i) => (t.t === 'br' && !isTbl(tk[i - 1]) && !IX.measures.has(lc(t.v)) && IX.columns.has(lc(ms.table) + '|' + lc(t.v)) ? 'br:' + ms.table + '|' + t.v : t.t + ':' + t.v)).join('\u0001').toLowerCase();
      if (!byExpr.has(k)) byExpr.set(k, []); byExpr.get(k).push(ms.name);
    });
    const dups = [];
    byExpr.forEach((names) => { if (names.length > 1) dups.push({ obj: names.map((n) => `[${n}]`).join(' = ') }); });
    add('DUP_MEASURE', dups);

    // ---- naming ----
    const styles = { underscore: [], space: [] };
    userTables.forEach((t) => { const m2 = t.name.match(/^(dim|fact|fct|d|f)([_ ])/i); if (m2) (m2[2] === '_' ? styles.underscore : styles.space).push(t.name); });
    if (styles.underscore.length && styles.space.length) {
      const minority = styles.underscore.length <= styles.space.length ? styles.underscore : styles.space;
      add('NAMING', minority.map((n) => ({ obj: n })));
    }
    const spaced = [];
    M.tables.forEach((t) => {
      if (t.name !== t.name.trim()) spaced.push({ obj: `'${t.name}'` });
      t.columns.forEach((c) => { if (c.name !== c.name.trim()) spaced.push({ obj: `${t.name}[${c.name}]` }); });
      t.measures.forEach((ms) => { if (ms.name !== ms.name.trim()) spaced.push({ obj: `[${ms.name}]` }); });
    });
    add('TRAILING_SPACE', spaced);

    // ---- Power Query ----
    const hard = [], buffer = [], longM = [];
    mQueries.forEach((q) => {
      const e = q.expr;
      // a template placeholder ({{NAME}}) is filled in per deployment, not a fixed server or path
      const eLit = e.replace(/"(?:[^"]|"")*\{\{\s*[\w.-]+\s*\}\}(?:[^"]|"")*"/g, '""');
      const isParam = /IsParameterQuery\s*=\s*true/i.test(e);
      const isEntitySource = q.isExpr && (M.entityExprs.has(lc(q.name)) || /^DatabaseQuery$/i.test(q.name));
      const literalDb = /\b(Sql\.Databases?|Oracle\.Database|MySQL\.Database|PostgreSQL\.Database|Snowflake\.Databases|AnalysisServices\.Databases?|Teradata\.Database|Sybase\.Database|IbmDb2\.Database|SapHana\.Database)\s*\(\s*"[^"]+"/.test(eLit);
      if (!isParam && !isEntitySource && literalDb) hard.push({ obj: q.name });
      else if (!isParam && !isEntitySource && /"(?:[A-Za-z]:\\\\?|\\\\\\\\|https?:\/\/[^"]*(?:sharepoint|onedrive|\.database\.windows\.net|\.fabric\.microsoft\.com|\.datawarehouse)|[a-z0-9-]+\.(?:database\.windows\.net|datawarehouse\.fabric\.microsoft\.com))/i.test(eLit)) hard.push({ obj: q.name });
      if (/Table\.Buffer\s*\(/.test(e)) buffer.push({ obj: q.name });
      const steps = (e.match(/^\s*(#"[^"]+"|[A-Za-z_]\w*)\s*=/gm) || []).length;
      if (steps > 40) longM.push({ obj: q.name, detail: steps + ' steps' });
    });
    add('HARDCODED_PATH', hard); add('TABLE_BUFFER', buffer); add('LONG_M', longM);
    if (!M.roles.length) add('NO_RLS', [{ obj: 'Model' }]);
    return { findings, skipped };
  }

  const api = { RULES, BPA_URL, runRules };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DAHealthRules = api;
})(typeof self !== 'undefined' ? self : this);
