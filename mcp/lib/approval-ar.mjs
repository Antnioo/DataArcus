// (0.3.1 FX1, the laptop's part 3, A5, and P3A's Seen 2: "the page is Arabic for an Arabic plan ... but its INPUTS table
// stays English ... Readable; not wholly Arabic") the approval page's own words in Arabic, for an Arabic plan's page:
// every heading, row name and value the page itself composes. An Arabic page shows Arabic only (the owner: wholly
// Arabic); the names it shows (model, table, column, file, page) stay as they are, inside «». approval-window.mjs reads
// arOf for each cell: a cell { en, ar } gives its ar; a text the page composes is found here, word for word or by its
// pattern; anything else is shown as it is.

// (the inputs of a plan in the person's words: INPUT_WORDS's Arabic, the same keys)
const COUNTRY_AR = { uae: 'الإمارات العربية المتحدة', ksa: 'المملكة العربية السعودية', qat: 'قطر', kwt: 'الكويت', bhr: 'البحرين', omn: 'عُمان' };
const DAY_AR = { sunday: 'الأحد', monday: 'الاثنين', saturday: 'السبت' };
const yesNo = (v) => (v ? 'نعم' : 'لا');
export const INPUT_AR = {
  path: ['النموذج', (v) => `«${String(v)}»`], maxItems: ['عدد الملاحظات في كل فحص', (v) => `${v} على الأكثر`], weekStart: ['أول أيام الأسبوع', (v) => DAY_AR[v] || String(v)],
  country: ['الدولة', (v) => COUNTRY_AR[v] || String(v)], asOf: ['تاريخ اليوم في الحساب', (v) => String(v)], forgetAnswers: ['حذف الإجابات المسجلة', yesNo],
  columnTypes: ['أنواع الأعمدة التي حددتها', (v) => `${Object.keys(v || {}).length}`],
  firstYear: ['السنة الأولى', (v) => String(v)], lastYear: ['السنة الأخيرة', (v) => String(v)], name: ['الاسم', (v) => `«${String(v)}»`], folder: ['المجلد', (v) => `«${String(v)}»`],
  announced: ['تواريخ رمضان والعيد', (v, all) => (!v ? 'تقويم أم القرى وحده' : `التواريخ المعلنة في الإمارات (وما بعدها تقديرات من تقويم أم القرى)${all && all.country && all.country !== 'uae' ? `: لا يملك DataArcus تواريخ معلنة خاصة بـ${COUNTRY_AR[all.country] || 'هذه الدولة'}، فحيث أعلنت يومًا آخر يبقى في الجدول يوم الإمارات` : ''}`)],
  weekend: ['عطلة نهاية الأسبوع', (v) => ({ country: 'العطلة الرسمية في الدولة', shj: 'عطلة الشارقة', 'sat-sun': 'السبت والأحد', 'fri-sat': 'الجمعة والسبت', fri: 'الجمعة', sun: 'الأحد' })[v] || String(v)],
  lang: ['لغة الأسماء', (v) => (v === 'ar' ? 'العربية' : 'الإنجليزية')], arabicNames: ['أعمدة الأسماء العربية أيضًا', yesNo], fiscalStart: ['الشهر الذي تبدأ فيه السنة المالية', (v) => String(v)],
  relateTo: ['الأعمدة المطلوب ربطها بتاريخ الجدول الجديد', (v) => [].concat(v).map((x) => `«${String(x)}»`).join('، ')],
  arabicColumnsOnly: ['ما سيُكتب', (v) => (v ? 'أعمدة التقويم العربية وحدها، لجدول التاريخ لديك' : 'جدول تقويم جديد')],
  brand: ['لون العلامة', (v) => String(v)], mode: ['الوضع', (v) => (v === 'dark' ? 'داكن' : v === 'light' ? 'فاتح' : String(v))]
};

// row names and fixed values, word for word
const EXACT = {
  // the theme's colours
  'Where they come from': 'مصدرها', 'Data colours': 'ألوان البيانات', Page: 'الصفحة', Visuals: 'المرئيات', Text: 'النص', Accent: 'لون التمييز', Mode: 'الوضع', light: 'فاتح', dark: 'داكن',
  // the report
  Name: 'الاسم', Title: 'العنوان', Language: 'اللغة', 'Page size': 'حجم الصفحة', 'Copy of the report': 'نسخة من التقرير', 'Arabic (right to left)': 'العربية (من اليمين إلى اليسار)', English: 'الإنجليزية',
  '(the report\'s name)': '(اسم التقرير)', Layout: 'التخطيط', 'Executive summary': 'ملخص تنفيذي', Analysis: 'تحليل', 'Operations monitor': 'متابعة العمليات', 'Single focus': 'تركيز واحد',
  'KPI cards': 'بطاقات المؤشرات', Filters: 'الفلاتر', Header: 'الترويسة', 'Second page': 'الصفحة الثانية', none: 'لا يوجد', yes: 'نعم', no: 'لا', 'yes, with page buttons': 'نعم، مع أزرار الصفحات',
  top: 'في الأعلى', side: 'على الجانب', panel: 'في لوحة جانبية', left: 'على اليسار', right: 'على اليمين',
  'Written as another kind': 'مكتوب بنوع آخر', "Charts' measure": 'مقياس الرسوم', 'Trend axis': 'محور الاتجاه', 'Bar chart by': 'المخطط الشريطي حسب', 'Column chart by': 'المخطط العمودي حسب',
  Table: 'الجدول', Slicers: 'المقسمات', 'Other visuals': 'المرئيات الأخرى', 'All visuals': 'كل المرئيات', 'chosen by DataArcus from the model': 'يختارها DataArcus من النموذج',
  'Bar chart': 'مخطط شريطي', 'Column chart': 'مخطط عمودي', 'Line chart': 'مخطط خطي', 'Donut chart': 'مخطط دائري مجوف', Chart: 'مخطط',
  // the look and options
  'Visual gallery': 'معرض المرئيات', 'Theme file': 'ملف السمة', Logo: 'الشعار', Colours: 'الألوان', 'Bar colours': 'ألوان الأشرطة', 'Chart axes': 'محاور الرسوم', 'KPI values': 'قيم المؤشرات',
  'Message when there is no data': 'رسالة عند عدم وجود بيانات', 'Filters in a slide-in panel': 'الفلاتر في لوحة منزلقة', 'Smooth lines': 'خطوط منحنية', 'Slicer style': 'شكل المقسمات', Gridlines: 'خطوط الشبكة',
  'Flip cards': 'البطاقات القابلة للقلب', 'Waterfall, right to left': 'الشلال من اليمين إلى اليسار', 'Status icons': 'أيقونات الحالة', 'DAX function library': 'مكتبة دوال DAX',
  "Shared axes (the user's answers)": 'المحاور المشتركة (إجاباتك)', Font: 'الخط', 'Right to left': 'من اليمين إلى اليسار', 'Reading direction': 'اتجاه القراءة', 'Card look': 'شكل البطاقات',
  'auto (short, like 28.01M, when the number is long)': 'تلقائي (مختصر، مثل 28.01M، عندما يكون الرقم طويلًا)', 'no: straight lines, no dots': 'لا: خطوط مستقيمة، دون نقاط',
  'yes: smooth curves that never swing past the data, a dot on each point': 'نعم: منحنيات ناعمة لا تتجاوز البيانات، ونقطة على كل قيمة',
  'yes: every kind whose fields fit': 'نعم: كل نوع تناسبه الحقول', 'pills: rounded buttons for a field of 2-6 values known from the model; a rounded dropdown for the others': 'أزرار مستديرة لحقل له من 2 إلى 6 قيم معروفة من النموذج، وقائمة منسدلة مستديرة لغيره',
  'dropdown, rounded': 'قائمة منسدلة مستديرة', 'solid, quiet': 'متصلة وهادئة', 'dotted, light grey': 'منقطة، رمادية فاتحة', 'yes: every KPI card': 'نعم: كل بطاقات المؤشرات',
  'yes: the rates whose target the model names': 'نعم: النسب التي يحدد النموذج هدفها',
  'each bar fades by its value; a chart by a second category field gets a second colour, the same on every page': 'يتدرّج لون كل شريط حسب قيمته؛ والمخطط حسب حقل فئة ثانٍ يأخذ لونًا ثانيًا، هو نفسه في كل الصفحات',
  'one colour for every bar': 'لون واحد لكل الأشرطة',
  'Glass look (default): see-through cards over a soft page picture made from the theme\'s colours (Power BI has no blur behind a visual); plain: chart.look "auto"': 'الشكل الزجاجي (الافتراضي): بطاقات شفافة فوق صورة ناعمة للصفحة مصنوعة من ألوان السمة (لا يوفّر Power BI تمويهًا خلف المرئي)؛ وللشكل العادي: «chart.look = auto»',
  'Glass look, as asked: see-through cards over a soft page picture made from the theme\'s colours': 'الشكل الزجاجي، كما طلبت: بطاقات شفافة فوق صورة ناعمة للصفحة مصنوعة من ألوان السمة',
  'Plain, as asked: Power BI\'s own cards': 'الشكل العادي، كما طلبت: بطاقات Power BI نفسها',
  // the twin, the copy, the report in both languages
  'A text of the report': 'نص من التقرير', 'New report': 'التقرير الجديد', 'Project file': 'ملف المشروع', 'The original': 'التقرير الأصلي', 'only read: not changed': 'يُقرأ فقط ولا يتغيّر',
  'none: a new report': 'لا يوجد: تقرير جديد', 'Tabs shown': 'علامات التبويب الظاهرة', 'Hidden in the tabs': 'المخفية من علامات التبويب', 'Tooltip pages': 'صفحات التلميح', 'What a reader sees': 'ما يراه القارئ',
  Bookmarks: 'الإشارات المرجعية', 'Report measure': 'مقياس التقرير',
  // the not translated texts' why (twin-texts.mjs notTranslatedOf, the fixed ones)
  'no Arabic was approved for it: the twin shows it as it is': 'لم يُعتمد له نص عربي: تعرضه النسخة العربية كما هو',
  'a field name with no Arabic given: Power BI shows it as the model names it (the person kept it; the model is never renamed)': 'اسم حقل دون اسم عربي: يعرضه Power BI كما يسميه النموذج (أبقيته كما هو؛ ولا يُعاد تسمية النموذج أبدًا)',
  'reads like an instruction to an AI assistant: kept as it is, unless the user gives its Arabic': 'يبدو كتعليمات موجّهة إلى مساعد ذكاء اصطناعي: يبقى كما هو، إلا إذا أعطيت نصه العربي',
  // the sample, the dates
  'not run': 'لم يُشغَّل', true: 'نعم', false: 'لا', 'In short': 'باختصار'
};
// where a text is (twin-texts.mjs KIND_SAID), in Arabic
const WHERE_AR = { 'page name': 'اسم صفحة', button: 'زر', text: 'نص', 'field name': 'اسم حقل', title: 'عنوان', 'text box': 'مربع نص', bookmark: 'إشارة مرجعية', 'bookmark group': 'مجموعة إشارات مرجعية',
  'alt text': 'نص بديل', tooltip: 'تلميح', 'measure text': 'نص من مقياس', 'language button': 'زر اللغة', 'chart title': 'عنوان مخطط', 'text for no data': 'النص عند عدم وجود بيانات', 'button tooltip': 'تلميح زر', 'axis title': 'عنوان محور', 'legend title': 'عنوان وسيلة الإيضاح', subtitle: 'عنوان فرعي', 'slicer header': 'عنوان مقسم', 'phone layout': 'تخطيط الهاتف', header: 'ترويسة' };
const whereAr = (w) => String(w).split(', ').map((p) => { const m = /^(phone layout: )?(.+?)(?: \((\d+)\))?$/.exec(p); if (!m) return null; const k = m[2].split(', ').map((x) => WHERE_AR[x] || null);
  return k.some((x) => x == null) ? null : `${m[1] ? 'تخطيط الهاتف: ' : ''}${k.join('، ')}${m[3] ? ` (${m[3]})` : ''}`; });
// the terminology sheet's status (approval-window.mjs TERM_STATUS)
const STATUS_AR = [[/^approved$/, () => 'معتمد'], [/^approved \(earlier in this session, unchanged since\)$/, () => 'معتمد (في وقت سابق من هذه الجلسة، دون تغيير منذ ذلك)'],
  [/^draft from the fixed list of report words: approved with this plan$/, () => 'مسودة من القائمة الثابتة لكلمات التقارير: تُعتمد مع هذه الخطة'], [/^kept in English$/, () => 'يبقى بالإنجليزية']];
// texts the page composes, by pattern: [regex, (...groups) => Arabic or null]
const PATTERNS = [
  // the theme's source: from the theme of report "Sales" (theme.json), and the colours on its visuals
  [/^from the colours on the visuals of report "([^"]*)"$/, (r) => `من ألوان المرئيات في التقرير «${r}»`],
  [/^from the theme of report "([^"]*)" \(([^)]*)\)( and the colours on its visuals)?$/, (r, t, v) => `من سمة التقرير «${r}» («${t}»)${v ? ' ومن ألوان مرئياته' : ''}`],
  [/^(light|dark): the palette's own colours decide; "(light|dark)" was asked and not used$/, (m, a) => `${m === 'dark' ? 'داكن' : 'فاتح'}: تحدده ألوان اللوحة نفسها؛ طُلب «${a === 'dark' ? 'داكن' : 'فاتح'}» ولم يُستخدم`],
  // a terminology row: Orders (Sales[Orders]) | الطلبات: approved; shown in 3 places
  [/^(.*) \(([^()[\]]+\[[^\]]+\])\)$/s, (en, f) => `«${en}» («${f}»)`],
  [/^([^:]*): (approved(?: \(earlier in this session, unchanged since\))?|draft from the fixed list of report words: approved with this plan|kept in English)(?:; shown in (\d+) places?)?$/s, (ar, st, n) => {
    const s = STATUS_AR.find(([re]) => re.test(st)); return s ? `«${ar}»: ${s[1]()}${n ? `؛ يظهر في ${n === '1' ? 'موضع واحد' : n === '2' ? 'موضعين' : `${n} مواضع`}` : ''}` : null; }],
  // a field reference alone (a display name's key): Sales[Total Sales]
  [/^([^\s[\]][^[\]]*\[[^\]]+\])$/, (f) => `«${f}»`],
  // a text that stays English, where it is: «Overview» (page name)
  [/^"(.*)" \(([^()]+(?:\(\d+\))?(?:, [^()]+(?:\(\d+\))?)*)\)$/s, (t, w) => { const a = whereAr(w); return a.some((x) => x == null) ? null : `«${t}» (${a.join('، ')})`; }],
  [/^\(([^()]+(?:\(\d+\))?(?:, [^()]+(?:\(\d+\))?)*)\)$/, (w) => { const a = whereAr(w); return a.some((x) => x == null) ? null : `(${a.join('، ')})`; }],
  [/^its Arabic was not taken: (.*)$/s, () => null],
  // the copy's pages and buttons (languagesSections)
  [/^(\d+)\. English "([^"]*)"( \(hidden in the tabs\))?$/s, (i, n, h) => `${i}. الإنجليزية «${n}»${h ? ' (مخفية من علامات التبويب)' : ''}`],
  [/^Arabic "([^"]*)"( \(hidden in the tabs\))?( \(tooltip pages\)| \(drillthrough pages\))?$/s, (n, h, k) => `العربية «${n}»${h ? ' (مخفية من علامات التبويب)' : ''}${k ? (/tooltip/.test(k) ? ' (صفحات تلميح)' : ' (صفحات تفصيل)') : ''}`],
  [/^(English|Arabic) page "([^"]*)"$/s, (l, n) => `الصفحة ${l === 'English' ? 'الإنجليزية' : 'العربية'} «${n}»`],
  [/^Page "([^"]*)": slicer (.*)$/s, (pg, s) => `الصفحة «${pg}»: المقسم «${s}»`],
  // the terminology: kept in English, with why
  [/^([^:]*): kept in English: no Arabic name was approved and the fixed list of report words has none(?:; shown in (\d+) places?)?$/s, (en, n) => `«${en}»: يبقى بالإنجليزية: لم يُعتمد له اسم عربي، وليس في القائمة الثابتة لكلمات التقارير اسم له${n ? `؛ يظهر في ${n === '1' ? 'موضع واحد' : n === '2' ? 'موضعين' : `${n} مواضع`}` : ''}`],
  [/^([^:]*): kept in English: the person kept the English name(?:; shown in (\d+) places?)?$/s, () => null],
  // the copy (twin-copy.mjs): the tabs, the reader, the bookmarks, the language buttons, the slicers in sync
  [/^the (English|Arabic) pages, as in the original$/, (l) => `الصفحات ${l === 'English' ? 'الإنجليزية' : 'العربية'}، كما في التقرير الأصلي`],
  [/^the Arabic pages \(the report opens on the first Arabic page\)$/, () => 'الصفحات العربية (يُفتح التقرير على أول صفحة عربية)'],
  [/^the (English|Arabic) pages \(hidden in the tabs\): each (English|Arabic) page's (?:"English"|«([^»]*)») button opens its (?:English|Arabic) page, whose (?:"English"|«([^»]*)») button goes back$/s,
    (l, l2, a1, a2) => `الصفحات ${l === 'English' ? 'الإنجليزية' : 'العربية'} (مخفية من علامات التبويب): زر ${l2 === 'Arabic' ? '«English»' : `«${a1}»`} في كل صفحة ${l2 === 'Arabic' ? 'عربية' : 'إنجليزية'} يفتح صفحتها ${l === 'English' ? 'الإنجليزية' : 'العربية'}، وزر ${l2 === 'Arabic' ? `«${a2}»` : '«English»'} فيها يعود`],
  [/^stay hidden in both languages$/, () => 'تبقى مخفية في اللغتين'],
  [/^In the Power BI service \(and Desktop's reading view\) a reader sees one tab per (English|Arabic) page; the (?:English|Arabic) pages are not in the page list and are reached by the (?:"English"|«([^»]*)») button, and (?:"English"|«([^»]*)») brings the reader back\. In Desktop's editing view every page is listed, the hidden ones marked hidden\.$/s,
    (l, a1, a2) => `في خدمة Power BI (وفي وضع القراءة في Power BI Desktop) يرى القارئ علامة تبويب لكل صفحة ${l === 'English' ? 'إنجليزية' : 'عربية'}؛ الصفحات ${l === 'English' ? 'العربية' : 'الإنجليزية'} ليست في قائمة الصفحات ويُوصل إليها بزر ${l === 'English' ? `«${a1}»` : '«English»'}، ويعيد زر ${l === 'English' ? '«English»' : `«${a2}»`} القارئ. في وضع التحرير في Power BI Desktop تظهر كل الصفحات، والمخفية منها معلَّمة بأنها مخفية.`],
  [/^(\d+) bookmarks? copied for the Arabic pages \(their pages and visuals the Arabic ones, their names as approved\); the English ones as they are$/, (n) => `الإشارات المرجعية المنسوخة للصفحات العربية: ${n} (صفحاتها ومرئياتها هي العربية، وأسماؤها كما اعتُمدت)؛ والإنجليزية كما هي`],
  [/^«([^»]*)» at the (left|right) end of the header, beside the page tabs, goes to its (English|Arabic) page; (.*)$/s, (t, sd, l, ph) => { const p = phoneAr(ph); return p == null ? null : `«${t}» في الطرف ${sd === 'left' ? 'الأيسر' : 'الأيمن'} من الترويسة، بجانب علامات تبويب الصفحات، ينتقل إلى صفحتها ${l === 'English' ? 'الإنجليزية' : 'العربية'}؛ ${p}`; }],
  [/^«([^»]*)» at the top (left|right) of the page, goes to its (English|Arabic) page; (.*)$/s, (t, sd, l, ph) => { const p = phoneAr(ph); return p == null ? null : `«${t}» أعلى الصفحة على ${sd === 'left' ? 'اليسار' : 'اليمين'}، ينتقل إلى صفحتها ${l === 'English' ? 'الإنجليزية' : 'العربية'}؛ ${p}`; }],
  [/^with its Arabic copy (\S*), sync group "([^"]*)"( \(the English slicer's own sync group: its Arabic copy joins it\))?$/s, (c, g, k) => `مع نسخته العربية «${c}»، في مجموعة المزامنة «${g}»${k ? ' (مجموعة المزامنة الخاصة بالمقسم الإنجليزي: تنضم إليها نسخته العربية)' : ''}`],
  [/^the button on each Arabic page that opens its English page: a language switch names the language it opens in that language, as the English pages' button reads «([^»]*)»$/, (a) => `الزر في كل صفحة عربية الذي يفتح صفحتها الإنجليزية: زر تبديل اللغة يسمّي اللغة التي يفتحها بتلك اللغة، كما يقرأ زر الصفحات الإنجليزية «${a}»`],
  // a kind written in place of another, in the person's words (label-limits.js said)
  [/^A bar chart, not columns: (?:(\d+) )?(?:the )?(names|months|weekdays|categories) would be cut or slanted under columns\.$/, (n, w) => `مخطط شريطي أفقي لا أعمدة: أسماء ${({ months: 'الأشهر', weekdays: 'الأيام' })[w] || 'الفئات'}${n ? ` (${n})` : ''} ستُقص أو تميل تحت الأعمدة.`],
  [/^Columns: the (?:(\d+) )?(names|months|weekdays|categories) fit under them, level\.$/, (n, w) => `مخطط أعمدة: أسماء ${({ months: 'الأشهر', weekdays: 'الأيام' })[w] || 'الفئات'}${n ? ` (${n})` : ''} تظهر كاملة ومستقيمة تحت الأعمدة.`],
  // the report's pages: Page 1: Overview
  [/^Page (\d+): (.*)$/s, (i, n) => `الصفحة ${i}: «${n}»`]
];
// a language button on the phone layout (twin-copy.mjs langButton)
const PHONE_WHY = { 'the page has no phone layout': 'ليس للصفحة تخطيط هاتف', 'the phone layout has no page tabs to sit beside: the button is on the page only': 'ليس في تخطيط الهاتف علامات تبويب يجاوِرها: الزر في الصفحة فقط' };
function phoneAr(x) { if (x === 'on the phone layout too') return 'وفي تخطيط الهاتف أيضًا'; const m = /^not on the phone layout(?:: (.*))?$/s.exec(x); if (!m) return null; if (!m[1]) return 'ليس في تخطيط الهاتف'; return PHONE_WHY[m[1]] ? `ليس في تخطيط الهاتف: ${PHONE_WHY[m[1]]}` : null; }
/** A cell's Arabic: { en, ar } gives ar; a text the page composes, its Arabic; else null (shown as it is). */
export function arOf(x) {
  if (x && typeof x === 'object') return typeof x.ar === 'string' ? x.ar : null;
  if (typeof x !== 'string') return null;
  if (Object.prototype.hasOwnProperty.call(EXACT, x)) return EXACT[x];
  for (const [re, f] of PATTERNS) { const m = re.exec(x); if (m) { const r = f(...m.slice(1)); if (r != null) return r; } }
  return null;
}
