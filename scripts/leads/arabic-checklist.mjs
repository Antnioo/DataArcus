// The Arabic-ready checklist (LEAD1, 25 Oct 2026): the 19 kinds of the article "Is Your Power BI Report Ready for
// Arabic? 19 Things to Check" on one printable A4 page, in English and in Arabic. Every text marked as the article's
// (TEXT, the groups, the rows) is the article's own words, copied from its English page and its Arabic translation
// (assets/js/translations/article-power-bi-report-ready-for-arabic.js): scripts/test-leads.mjs finds each one in the
// article, so the checklist claims nothing the article doesn't. LABELS are the checklist's own few words (no claim).
// The page is built here; scripts/leads/make-arabic-checklist.mjs writes it, its PDF and its pictures.

export const ARTICLE = 'articles/article-power-bi-report-ready-for-arabic.html';

// The article's words: its title, the three answers, the at-a-glance table's headers, the check
export const TEXT = {
  en: {
    title: 'Is Your Power BI Report Ready for Arabic? 19 Things to Check',
    intro: 'From a report built in English, the twin does most of the work in one plan. On an Arabic page you built yourself, the answer is a Desktop setting, or none.',
    answers: 'Each kind has one of three answers:',
    a1: 'DataArcus does it, through your approval.',
    a2: 'A Power BI Desktop setting.',
    a3: 'Power BI has no setting for it.',
    names: "Desktop isn't available in Arabic, so the names are its English ones.",
    thKind: 'What reads wrong',
    thEn: 'From a report built in English',
    thAr: 'On an Arabic page you built',
    check: 'Run the check on your report',
    lens: "DataArcus's check_report has an Arabic lens from DataArcus 0.3.1 (0.3.0 has no lens).",
    ask: 'Is my report ready for Arabic? Use check_report with the Arabic lens.',
    reads: "It reads the report's files on your computer, never your data, and changes nothing.",
  },
  ar: {
    title: 'هل تقرير Power BI الخاص بك جاهز للعربية؟ 19 أمرًا تفحصها',
    intro: 'في تقرير مبني بالإنجليزية، تقوم النسخة العربية بمعظم العمل في خطة واحدة. وفي صفحة عربية بنيتها بنفسك، الجواب إعداد في Desktop، أو لا إعداد.',
    answers: 'ولكل نوع واحد من ثلاثة أجوبة:',
    a1: 'يقوم به DataArcus، بموافقتك.',
    a2: 'إعداد في Power BI Desktop.',
    a3: 'لا إعداد له في Power BI.',
    names: 'وDesktop غير متاح بالعربية، فالأسماء هي أسماؤه الإنجليزية.',
    thKind: 'ما يُقرأ خطأ',
    thEn: 'في تقرير مبني بالإنجليزية',
    thAr: 'في صفحة عربية بنيتها بنفسك',
    check: 'افحص تقريرك',
    lens: 'للأداة check_report من DataArcus عدسة عربية ابتداءً من DataArcus 0.3.1 (لا عدسة في 0.3.0).',
    ask: 'هل تقريري جاهز للعربية؟ استخدم check_report بالعدسة العربية.',
    reads: 'يقرأ ملفات التقرير على جهازك، ولا يقرأ بياناتك، ولا يغيّر شيئًا.',
  },
};

// The checklist's own words (labels, not claims)
export const LABELS = {
  en: { kicker: 'Checklist · Arabic reports', done: 'Done', ask: 'With DataArcus installed in Claude, ask:', article: 'The full article:', agent: 'DataArcus:' },
  ar: { kicker: 'قائمة فحص · التقارير العربية', done: 'تم', ask: 'بعد تثبيت DataArcus في Claude، اسأل:', article: 'المقال كاملًا:', agent: 'DataArcus:' },
};

export const URLS = {
  en: { article: 'https://dataarcus.com/' + ARTICLE, agent: 'https://dataarcus.com/power-bi-mcp/' },
  ar: { article: 'https://dataarcus.com/ar/' + ARTICLE, agent: 'https://dataarcus.com/ar/power-bi-mcp/' },
};

// The six groups (the article's headings) and the 19 kinds: k the kind, note a short line from its section (or none),
// en / ar the two answers of the at-a-glance table (from a report built in English / on an Arabic page you built)
export const GROUPS = [
  { en: '1. Where the eye starts', ar: '1. من أين تبدأ العين', rows: [
    { en: { k: 'The heading at the left', note: 'An Arabic reader starts at the top right.', fromEn: 'DataArcus: the twin', onAr: 'Move it by hand' },
      ar: { k: 'العنوان على اليسار', note: 'يبدأ القارئ العربي من أعلى اليمين.', fromEn: 'DataArcus: النسخة العربية', onAr: 'انقله يدويًا' } },
    { en: { k: 'The Tab order', note: 'right to left, top to bottom', fromEn: 'DataArcus: the twin', onAr: 'View > Selection > Tab order' },
      ar: { k: 'ترتيب التنقل بمفتاح Tab', note: 'من اليمين إلى اليسار ومن الأعلى إلى الأسفل', fromEn: 'DataArcus: النسخة العربية', onAr: 'View > Selection > Tab order' } },
    { en: { k: 'Page buttons in a row', note: "the first page's button is at the right", fromEn: 'DataArcus: the twin', onAr: 'Move the buttons' },
      ar: { k: 'صف من أزرار الصفحات', note: 'فيكون زر الصفحة الأولى على اليمين', fromEn: 'DataArcus: النسخة العربية', onAr: 'انقل الأزرار' } },
    { en: { k: 'The page navigator', note: 'For a row that starts at the right, use single page buttons.', fromEn: 'No setting', onAr: 'No setting' },
      ar: { k: 'متصفح الصفحات', note: 'ولصف يبدأ من اليمين، استخدم أزرار صفحات منفردة.', fromEn: 'لا إعداد', onAr: 'لا إعداد' } },
  ] },
  { en: '2. Text', ar: '2. النصوص', rows: [
    { en: { k: 'Titles aligned left', note: "Left is Power BI's default.", fromEn: 'DataArcus: the twin', onAr: 'Title > Horizontal alignment: Right' },
      ar: { k: 'العناوين محاذاة لليسار', note: 'اليسار هو الافتراضي في Power BI.', fromEn: 'DataArcus: النسخة العربية', onAr: 'Title > Horizontal alignment: Right' } },
    { en: { k: 'Arabic text boxes aligned left', note: '', fromEn: 'DataArcus: the twin', onAr: 'Align the paragraphs right' },
      ar: { k: 'مربعات نص عربية محاذاة لليسار', note: '', fromEn: 'DataArcus: النسخة العربية', onAr: 'حاذِ الفقرات لليمين' } },
    { en: { k: 'Arabic and English in one text', note: 'A title like «المبيعات حسب Region» mixes two directions.', fromEn: 'DataArcus: the twin', onAr: 'No setting: retype or reword' },
      ar: { k: 'العربية والإنجليزية في نص واحد', note: 'عنوان مثل «المبيعات حسب Region» يجمع اتجاهين.', fromEn: 'DataArcus: النسخة العربية', onAr: 'لا إعداد: أعد الكتابة أو الصياغة' } },
    { en: { k: 'English titles, text boxes, buttons, page names', note: 'a text without an approved Arabic stays as it is', fromEn: 'DataArcus: the twin, in the Arabic you approve', onAr: 'Write each in Arabic' },
      ar: { k: 'عناوين ومربعات نص وأزرار وأسماء صفحات بالإنجليزية', note: 'وما لم توافق على عربيته يبقى كما هو', fromEn: 'DataArcus: النسخة العربية، بالعربية التي توافق عليها', onAr: 'اكتب كلًّا منها بالعربية' } },
    { en: { k: 'English field names', note: 'your model is not renamed', fromEn: 'DataArcus: the twin', onAr: 'Rename for this visual' },
      ar: { k: 'أسماء الحقول بالإنجليزية', note: 'ولا يُعاد تسمية شيء في نموذجك', fromEn: 'DataArcus: النسخة العربية', onAr: 'Rename for this visual' } },
  ] },
  { en: '3. Charts', ar: '3. المخططات', rows: [
    { en: { k: 'Bar charts', note: '', fromEn: 'DataArcus: the twin', onAr: 'Invert range; the axis on the other side' },
      ar: { k: 'المخططات الشريطية', note: '', fromEn: 'DataArcus: النسخة العربية', onAr: 'Invert range، والمحور في الجهة الأخرى' } },
    { en: { k: 'Column, line and combo charts', note: 'a category axis ignores Invert range: the sort is what turns it round', fromEn: 'DataArcus: the twin', onAr: 'Sort descending; the value axis at the right' },
      ar: { k: 'مخططات الأعمدة والخطوط والمركّبة', note: 'محور الفئات يتجاهل Invert range: الترتيب هو ما يقلبه', fromEn: 'DataArcus: النسخة العربية', onAr: 'Sort descending، ومحور القيم على اليمين' } },
    { en: { k: 'Charts over time', note: 'the first period at the right', fromEn: 'DataArcus: the twin (your choice)', onAr: 'Sort descending by the time field' },
      ar: { k: 'المخططات الزمنية', note: 'وأول فترة على اليمين', fromEn: 'DataArcus: النسخة العربية (باختيارك)', onAr: 'Sort descending حسب حقل الزمن' } },
    { en: { k: 'Waterfalls', note: "Or keep Power BI's own waterfall, left to right.", fromEn: "No setting; DataArcus's waterfall from the right (no Total)", onAr: 'No setting' },
      ar: { k: 'مخططات الشلال', note: 'أو أبقِ مخطط الشلال الخاص بـ Power BI كما هو، من اليسار إلى اليمين.', fromEn: 'لا إعداد؛ مخطط شلال من DataArcus يُقرأ من اليمين (بلا إجمالي)', onAr: 'لا إعداد' } },
  ] },
  { en: '4. Tables and the matrix', ar: '4. الجداول والمصفوفة', rows: [
    { en: { k: 'Table column order', note: 'the first at the right', fromEn: 'DataArcus: the twin', onAr: 'Reverse the columns in the field well' },
      ar: { k: 'ترتيب أعمدة الجدول', note: 'الأول على اليمين', fromEn: 'DataArcus: النسخة العربية', onAr: 'اعكس الأعمدة في حقول المرئي' } },
    { en: { k: 'Matrices', note: 'show the same numbers as a table or a chart', fromEn: "No setting (the twin: the measures' order only)", onAr: 'No setting' },
      ar: { k: 'المصفوفات', note: 'اعرض الأرقام نفسها في جدول أو مخطط', fromEn: 'لا إعداد (النسخة العربية: ترتيب المقاييس فقط)', onAr: 'لا إعداد' } },
  ] },
  { en: '5. Month and day names', ar: '5. أسماء الأشهر والأيام', rows: [
    { en: { k: 'Month and day names', note: "Power BI doesn't translate your data", fromEn: 'DataArcus: the calendar script, applied by you', onAr: 'An Arabic column, Sort by column' },
      ar: { k: 'أسماء الأشهر والأيام', note: 'Power BI لا يترجم بياناتك', fromEn: 'DataArcus: سكربت التقويم، تطبّقه أنت', onAr: 'عمود عربي مع Sort by column' } },
  ] },
  { en: '6. Slicers', ar: '6. المقسمات', rows: [
    { en: { k: 'Slicer items', note: 'The twin moves the slicer, nothing more.', fromEn: 'No setting', onAr: 'No setting' },
      ar: { k: 'عناصر المقسمات', note: 'والنسخة العربية تنقل المقسم فحسب.', fromEn: 'لا إعداد', onAr: 'لا إعداد' } },
    { en: { k: "Pill slicers' order", note: 'the first value is at the right', fromEn: 'DataArcus: the twin', onAr: 'Sort descending' },
      ar: { k: 'ترتيب المقسمات ذات الأزرار', note: 'فتكون القيمة الأولى على اليمين', fromEn: 'DataArcus: النسخة العربية', onAr: 'Sort descending' } },
    { en: { k: 'Pill values not centred', note: 'centre the values in their buttons', fromEn: 'A Desktop setting', onAr: 'Centre the values' },
      ar: { k: 'قيم الأزرار غير موسّطة', note: 'ضع القيم في وسط أزرارها', fromEn: 'إعداد في Desktop', onAr: 'ضع القيم في الوسط' } },
  ] },
];

// Every text the checklist takes from the article, for the test: [lang, where, text]
export function claims() {
  const out = [];
  for (const lang of ['en', 'ar']) {
    for (const [k, v] of Object.entries(TEXT[lang])) out.push([lang, k, v]);
    GROUPS.forEach((g, gi) => {
      out.push([lang, `group ${gi + 1}`, g[lang]]);
      g.rows.forEach((r) => { for (const [k, v] of Object.entries(r[lang])) if (v) out.push([lang, `${r.en.k}: ${k}`, v]); });
    });
  }
  return out;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// an answer's kind, from its own words: DataArcus does it, a Desktop setting, or no setting
const kind = (s) => (/^(No setting|لا إعداد)/.test(s) ? 'none' : /^DataArcus/.test(s) ? 'da' : 'set');
// Each run keeps its own direction: Latin runs inside Arabic text (Power BI, Desktop, View > Selection > Tab order),
// and the Arabic example «...» inside an English line
const bidi = (s, lang) => (lang === 'ar' ? esc(s).replace(/[A-Za-z][A-Za-z0-9 .,;:'()&;\-_/]*[A-Za-z0-9)]/g, (m) => `<bdi>${m}</bdi>`).replace(/<bdi>([^<]*&gt;[^<]*)<\/bdi>/g, '<bdi dir="ltr">$1</bdi>') : esc(s).replace(/«[^»]*»/g, (m) => `<bdi dir="rtl">${m}</bdi>`));

// The printable page (A4; the print CSS keeps it to one sheet). Fonts: Inter and IBM Plex Sans Arabic, as the site.
export function html(lang) {
  const t = TEXT[lang], l = LABELS[lang], u = URLS[lang], ar = lang === 'ar';
  const cell = (s) => `<td class="ans ${kind(s)}">${bidi(s, lang)}</td>`;
  const rows = GROUPS.map((g) => `      <tr class="grp"><th colspan="4">${esc(g[lang])}</th></tr>\n` + g.rows.map((r) => {
    const x = r[lang];
    return `      <tr><td class="box" aria-label="${esc(l.done)}"><span></span></td><th scope="row">${bidi(x.k, lang)}${x.note ? `<small>${bidi(x.note, lang)}</small>` : ''}</th>${cell(x.fromEn)}${cell(x.onAr)}</tr>\n`;
  }).join('')).join('');
  return `<!DOCTYPE html>
<html lang="${lang}"${ar ? ' dir="rtl"' : ''}>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>${esc(t.title)} - DataArcus</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${ar ? 'IBM+Plex+Sans+Arabic:wght@400;500;600;700' : 'Inter:wght@400;500;600;700'}&amp;display=swap">
  <style>
    @page { size: A4; margin: 8mm 10mm; }
    * { box-sizing: border-box; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { margin: 0 auto; max-width: 190mm; padding: 0; font: 8pt/1.24 ${ar ? '"IBM Plex Sans Arabic"' : 'Inter'}, system-ui, sans-serif; color: #0f172a; background: #fff; }
    header { display: flex; align-items: flex-start; justify-content: space-between; gap: 6mm; border-bottom: 2px solid #00a9cc; padding-bottom: 2.5mm; }
    .kicker { margin: 0 0 1mm; font-size: 7.5pt; letter-spacing: ${ar ? '0' : '.08em'}; text-transform: uppercase; color: #0089a8; font-weight: 600; }
    h1 { margin: 0; font-size: 15pt; line-height: 1.2; }
    .brand { font: 700 12pt Inter, sans-serif; color: #0a0f1c; white-space: nowrap; direction: ltr; }
    .brand span { color: #00a9cc; }
    .intro { margin: 2mm 0 1.5mm; }
    .key { display: flex; flex-wrap: wrap; gap: 1mm 5mm; margin: 0 0 2.5mm; font-size: 8pt; }
    .key b { font-weight: 600; }
    .dot { display: inline-block; width: 2.6mm; height: 2.6mm; border-radius: 50%; vertical-align: -.2mm; margin-inline-end: 1.2mm; }
    .dot.da { background: #00a9cc; } .dot.set { background: #f59e0b; } .dot.none { background: #94a3b8; }
    table { width: 100%; border-collapse: collapse; }
    thead th { font-size: 7.6pt; text-align: start; color: #475569; font-weight: 600; padding: 0 1.5mm 1mm; border-bottom: 1px solid #cbd5e1; }
    tr.grp th { text-align: start; font-size: 8.8pt; padding: 1.4mm 1.5mm .5mm; color: #0a0f1c; border-bottom: 1px solid #e2e8f0; }
    td, tbody th { padding: .65mm 1.5mm; vertical-align: top; border-bottom: 1px solid #f1f5f9; text-align: start; }
    tbody th[scope=row] { font-weight: 600; width: 36%; }
    tbody th small { display: block; font-weight: 400; color: #475569; font-size: 7.3pt; }
    .box { width: 6mm; } .box span { display: inline-block; width: 3.4mm; height: 3.4mm; border: 1.2px solid #64748b; border-radius: .6mm; margin-top: .3mm; }
    .ans { width: 30%; padding-inline-start: 4.5mm; position: relative; }
    .ans::before { content: ''; position: absolute; inset-inline-start: 1.5mm; top: 1.65mm; width: 2mm; height: 2mm; border-radius: 50%; }
    .ans.da::before { background: #00a9cc; } .ans.set::before { background: #f59e0b; } .ans.none::before { background: #94a3b8; }
    .ans.none { color: #475569; }
    footer { margin-top: 2.5mm; border-top: 2px solid #00a9cc; padding-top: 1.5mm; break-inside: avoid; }
    footer h2 { margin: 0 0 .5mm; font-size: 9.5pt; }
    footer p { margin: 0; }
    .q { font-style: italic; }
    .links { display: flex; flex-wrap: wrap; gap: 0 6mm; margin-top: .8mm; font-size: 8pt; color: #334155; }
    .links a { color: #0089a8; text-decoration: none; direction: ltr; unicode-bidi: isolate; }
    @media screen { body { padding: 10mm 6mm; } }
  </style>
</head>
<body>
  <header>
    <div>
      <p class="kicker">${esc(l.kicker)}</p>
      <h1>${bidi(t.title, lang)}</h1>
    </div>
    <div class="brand">Data<span>Arcus</span></div>
  </header>
  <p class="intro">${bidi(t.intro, lang)}</p>
  <div class="key"><span>${bidi(t.answers, lang)}</span><span><i class="dot da"></i><b>${bidi(t.a1, lang)}</b></span><span><i class="dot set"></i><b>${bidi(t.a2, lang)}</b></span><span><i class="dot none"></i><b>${bidi(t.a3, lang)}</b></span><span>${bidi(t.names, lang)}</span></div>
  <table>
    <thead><tr><th class="box"></th><th>${esc(t.thKind)}</th><th>${esc(t.thEn)}</th><th>${esc(t.thAr)}</th></tr></thead>
    <tbody>
${rows}    </tbody>
  </table>
  <footer>
    <h2>${esc(t.check)}</h2>
    <div>
      <p>${bidi(t.lens, lang)} ${bidi(t.reads, lang)}</p>
      <p>${bidi(l.ask, lang)} <span class="q">${ar ? '«' : '"'}${bidi(t.ask, lang)}${ar ? '»' : '"'}</span></p>
    </div>
    <div class="links">
      <p>${esc(l.article)} <a href="${u.article}">${u.article.replace('https://', '')}</a></p>
      <p>${esc(l.agent)} <a href="${u.agent}">${u.agent.replace('https://', '')}</a></p>
    </div>
  </footer>
</body>
</html>
`;
}
