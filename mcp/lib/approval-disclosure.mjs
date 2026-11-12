// What each approval page says (0.3.2 SP23, the split: B-280, B-286; mcp/work/SP23.md): the disclosure summaries of
// DataArcus's own approval window (approval-window.mjs), moved here as they were. Pure: a plan's kind and data in, a
// disclosure model out, in words; no HTML, no HTTP, no secret, no callback, no state. approval-window.mjs renders the
// model (escaping every text in it) and alone holds the secret, the Host and Origin checks and the click.
// The interface:
//   summary(kind, data) -> { title, kind, lang, sections: [{ heading, rows: [[label, value | [values]]], fold?, raw? }],
//     files: [{ label, paths }] | null, previews?, first?, name?, writesAr?, outputsAt?, lostNote?, scriptWhat?,
//     titleKey?, previewFailed? }: a label or value is a string, { en, ar } or { swatches: [[name, hex]] }
//   promptText(plan, data), promptBox(plan, data), promptSummary(kind, data, ar): the app's own prompt, plain text
//   groupFiles(paths, own), kindsLine(paths, kind, ar), plainLine(paths, kind, ar, at): the files, in words
//   and for the page's own lists: cut, HEX, KIND_AR, isScript
import { createRequire } from 'node:module';
import { writesNote, writesNoteAr } from './answers.mjs';   // (R5, F04: the answers file DataArcus wrote is replaced, and said)
import { E } from './design.mjs';             // (D6: the written colour's own contrast, by the engine's rule)
import { BEFORE_APPLIED as FLIP_BEFORE } from './flip-cards.mjs';   // (F1: what a flip card shows before its script)
import { folderSaid } from './plain-words.mjs';   // (0.3.0 T1, T-4)
import { CLASSES as TEXT_CLASSES } from './text-format.mjs';   // (0.3.1 R4A: a text class in words, never its key)
import { arOf, INPUT_AR } from './approval-ar.mjs';
import { ORDER_FUNCTIONS, ORDER_CALC_SAID } from './twin-calcs.mjs';   // (0.3.2 VC2: the one list and VC1's sentence)   // (0.3.1 FX1: an Arabic plan's page wholly Arabic)

// (D7) a right-to-left waterfall's switch, in the person's words
const Gallery = createRequire(import.meta.url)('../../assets/js/visual-gallery.js');
const wfRtlSaidAr = (v) => (Gallery.waterfallRtlOf(v) === 'native' ? 'أصلي: شلال Power BI نفسه، يُقرأ من اليسار إلى اليمين كما يرسمه Power BI' : 'معكوس: مخطط أعمدة مكدسة مرسوم كشلال، يُقرأ من اليمين؛ دون عمود للإجمالي ودون وسيلة إيضاح، والقاعدة في التلميح');
const wfRtlSaid = (v) => (Gallery.waterfallRtlOf(v) === 'native' ? `native: ${Gallery.WF_WHAT.native} (Power BI's own waterfall, as in English)` : 'mirror: a stacked column chart drawn as a waterfall, read from the right; no Total column, no legend, the base shown in the tooltip');
export const cut = (s, n) => { const t = String(s); return t.length > n ? t.slice(0, n) + '…' : t; };
export const HEX = /^#[0-9a-f]{6}$/i;
// (R6, the outside audit of 19 Oct, F09 c: the page named the report, not every file) every file a plan writes, by kind,
// counted, each path folded under its group (no script: <details> opens without one)
// (SQ3, D6-S3: the twin's copy of Power BI's base theme fell in "Report settings") a theme file: the report's own
// (RegisteredResources) or the base theme Power BI keeps beside it (SharedResources/BaseThemes); one pattern for the
// groups, the redesign's copied theme and the count in words
const THEME_FILE = /(?:RegisteredResources\/[^/]+|SharedResources\/BaseThemes\/[^/]+)\.json$/i;
const GROUPS = [['Bookmarks', /(^|\/)bookmarks\//], ['Pages', /\/page\.json$/], ['Visuals', /\/visual\.json$/], ['Phone layouts', /\/mobile\.json$/], ['Theme', THEME_FILE],
  ['Images', /\.(png|jpe?g|gif|svg)$/i], ['Custom visual packages', /(^|\/)CustomVisuals\//], ['Flip cards script', / - flip cards(?: \d+)?\.tmdl$/i], ['Format script', / - fix formats(?: \d+)?\.tmdl$/i], ['Gulf calendar script', / - add Gulf calendar(?: \d+)?\.tmdl$/i],
  ['Arabic calendar script', / - Arabic calendar(?: \d+)?\.tmdl$/i], ['Metric switcher script', / - metric switcher(?: \d+)?\.tmdl$/i], ['Status icons script', / - status icons(?: \d+)?\.tmdl$/i], ['DAX functions script', / - DAX functions(?: \d+)?\.tmdl$/i], ['Script', /\.tmdl$/i], ['Project file', /\.pbip$/i], ['Report settings', /./]];
// (0.3.0 A2: the flip cards' script was listed as a "Format script", L4; 0.3.1 R4A, the laptop's rc.1 run: the Gulf
// calendar's script too: every script by its own kind, an unknown one a "Script", never a format script)
// own: a plan kind's groups, tried first (D6: the twin's month script, the theme file)
export function groupFiles(paths, own) {
  const G = (own || []).concat(GROUPS), out = G.map(([label]) => ({ label, paths: [] }));
  (paths || []).forEach((f) => { const i = G.findIndex(([, re]) => re.test(String(f))); out[i].paths.push(String(f)); });
  return out.filter((g) => g.paths.length);
}
// (0.3.0 S1, B-183: the app's own prompt showed the writes and the overwrite sentence only) the same as the approval page
// says, in short, for the app's prompt (MCP elicitation): the files counted per group, and each colour the plan writes
// other than the one approved. At most PROMPT_SUMMARY_CAP characters: groups past it are counted, never cut mid-word
export const PROMPT_SUMMARY_CAP = 600;
// (J14) the checks before writing, by their names in the plan's data (exact.notChecked), for the page and the prompt
const NOT_CHECKED = { validator: 'Microsoft\'s validator', references: 'fields against the model', rules: 'measured rules', lint: 'layout check' };
export function promptSummary(kind, data, ar) {
  const d = data || {}, groups = summary(kind, d).files || [], lines = [];
  // (0.3.1 L6) the compatibility step first in the app's prompt too
  if (kind === 'report' && d.daxFunctions && d.daxFunctions.compatibility && d.daxFunctions.compatibility.raises) lines.push('First: applying the DAX functions script raises the model\'s compatibility level to 1702; it cannot be undone.');
  // (SQ3, A2-S9: the page said what the check before writing could not cover, the app's prompt did not) each check not
  // run, by name, with its why cut to fit (a quarter of the cap at most)
  const nc = kind === 'report' && d.exact && Array.isArray(d.exact.notChecked) ? d.exact.notChecked : [];
  if (nc.length) lines.push(cut(`Not checked before writing: ${nc.map((x) => `${NOT_CHECKED[x.check] || 'a check'} (not run: ${String(x.why || '')})`).join('; ')}`, PROMPT_SUMMARY_CAP / 4 - 1) + '.');
  if (groups.length) {
    const n = groups.reduce((a, g) => a + g.paths.length, 0), parts = groups.map((g) => `${ar && KIND_AR[g.label] ? KIND_AR[g.label] : g.label} (${g.paths.length})`);
    let line = ar ? `الملفات (${n}): ` : `${n} file${n === 1 ? '' : 's'}: `, k = 0;
    while (k < parts.length && line.length + parts[k].length + 40 <= PROMPT_SUMMARY_CAP / 2) { line += (k ? (ar ? '، ' : ', ') : '') + parts[k]; k++; }
    if (k < parts.length) line += ar ? `${k ? '، ' : ''}ومجموعات أخرى (${parts.length - k})` : `${k ? ', ' : ''}and ${parts.length - k} more group${parts.length - k === 1 ? '' : 's'}`;
    lines.push(line + '.');
  }
  const cc = kind === 'report' && d.colours && Array.isArray(d.colours.changed) ? d.colours.changed.filter((c) => HEX.test(String(c.from)) && HEX.test(String(c.to))) : [];
  const card = d.colours && HEX.test(String(d.colours.card)) ? ` against ${d.colours.card}` : '';
  cc.forEach((c) => { const own = d.colours && HEX.test(String(d.colours.card)) ? `; the written colour's own ${E.contrast(String(c.to), String(d.colours.card)).toFixed(2)}:1` : '';
    // (0.3.0 A2: the contrast said after the written colour was the approved one's)
    const l = `Colour: approved colour ${c.from} -> written colour ${c.to} (the approved colour's contrast ${Number(c.contrast) || '?'}:1${card}, needs 3:1${own}).`; if (lines.join('\n').length + l.length + 1 <= PROMPT_SUMMARY_CAP) lines.push(l); });
  return lines.join('\n');
}
// (0.3.1 R4A, the laptop's rc.1 run, section 6: an app with its own approval prompt showed an Arabic plan in English
// only) the app's prompt (MCP elicitation), in the plan's language as its page is: on an Arabic plan each write in
// Arabic with its English line under it, the files counted in Arabic, then the English prompt; writes name the report
// by the name the write uses (summary's name). plan: { id, kind, writes }; data: the plan's data
export function promptText(plan, data) {
  const s = summary(plan.kind, data), nm = s.name, named = (x) => (nm ? String(x).split('<name>').join(nm) : String(x));
  const en = plan.writes.map(named), WA = s.lang === 'ar' && Array.isArray(s.writesAr) && s.writesAr.length === en.length ? s.writesAr.map(named) : null;
  const inShort = promptSummary(plan.kind, data), english = `DataArcus asks before it writes anything. Approve this plan (${plan.kind}, ${plan.id})? It will write:\n- ${en.join('\n- ')}\n${inShort ? inShort + '\n' : ''}${writesNote(plan.writes)}`;
  if (!WA) return english;
  const inShortAr = promptSummary(plan.kind, data, true);
  return `يطلب DataArcus موافقتك قبل أن يكتب أي شيء. هل توافق على هذه الخطة (${plan.id})؟ سيُكتب:\n${WA.map((x, i) => `- ${x}\n  ${en[i]}`).join('\n')}\n${inShortAr ? inShortAr + '\n' : ''}${writesNoteAr(plan.writes)}\n\n${english}`;
}
/** The prompt's yes box, in the plan's language (R4A): { title, description }. */
export function promptBox(plan, data) {
  const ar = summary(plan.kind, data).lang === 'ar';
  return ar ? { title: 'اكتب هذه الملفات · Write these files', description: 'نعم: يكتب DataArcus ما في القائمة أعلاه. لا: لا يُكتب شيء. · Yes: DataArcus may write what is listed above. No: nothing is written.' }
    : { title: 'Write these files', description: 'Yes: DataArcus may write what is listed above. No: nothing is written.' };
}
// the file kinds in Arabic, beside their English names (the names Power BI's own files and this page's groups use)
export const KIND_AR = { Bookmarks: 'الإشارات المرجعية', Pages: 'الصفحات', Visuals: 'المرئيات', 'Phone layouts': 'تخطيطات الهاتف', Theme: 'السمة', Images: 'الصور', 'Custom visual packages': 'حزم المرئيات المخصصة',
  'Flip cards script': 'سكربت البطاقات القابلة للقلب', 'Gulf calendar script': 'سكربت تقويم الخليج', Script: 'سكربت', 'Format script': 'سكربت التنسيقات', 'Project file': 'ملف المشروع', 'Report settings': 'إعدادات التقرير', 'Arabic calendar script': 'سكربت أعمدة التقويم العربية', 'Theme file': 'ملف السمة',
  'Metric switcher script': 'سكربت مبدّل المقاييس', 'Model (TMDL)': 'النموذج (TMDL)', 'Empty report': 'تقرير فارغ', 'Status icons script': 'سكربت أيقونات الحالة', 'DAX functions script': 'سكربت دوال DAX', [BLANK_LABEL()]: 'خلفيات الصفحات (فارغة وشفافة: تظهر الصفحة بلون السمة)', [GLASS_LABEL()]: 'خلفيات الصفحات (الصورة الناعمة للشكل الزجاجي، مصنوعة من ألوان السمة: ليست صورة فوتوغرافية)', [GLASS_PLAIN_LABEL()]: 'خلفيات الصفحات (لون الصفحة في الشكل الزجاجي، دون صورة مع هذه الألوان)',
  "Theme (the original's, copied)": 'السمة (سمة التقرير الأصلي، منسوخة كما هي)', "Images (the original's, copied)": 'الصور (صور التقرير الأصلي، منسوخة كما هي)' };
function BLANK_LABEL() { return 'Page backgrounds (blank, see-through: the page shows the theme\'s colour)'; }
// (0.3.1 GD1) the glass look's page picture, listed as what it is
function GLASS_LABEL() { return 'Page backgrounds (the glass look\'s soft picture, made from the theme\'s colours: no photo)'; }
// (0.3.2 AP2) the same files when the look has no page picture (lookFor's noPicture): the plain page colour
function GLASS_PLAIN_LABEL() { return 'Page backgrounds (the glass look\'s page colour, plain: no picture with these colours)'; }
// (0.3.0 T1, T-1: "102 files:" then every visual.json path; finance and HR approved "on the summary line") the files by
// kind, in words ("1 report: 4 pages, 40 visuals, 2 bookmarks, 26 phone layouts; 1 theme; 1 script"), counted from the
// same list the page folds below (the plan's own outputs: what the write writes)
export function kindsLine(paths, kind, ar) {
  const P = (paths || []).map(String), n = (re) => P.filter((f) => re.test(f)).length, en = (k, one, many) => `${k} ${k === 1 ? one : many}`, parts = [];
  const reports = n(/\.pbip$/i);
  if (reports) {
    const inner = [[n(/\/page\.json$/), 'page', 'pages', 'الصفحات'], [n(/\/visual\.json$/), 'visual', 'visuals', 'المرئيات'], [n(/\.bookmark\.json$/), 'bookmark', 'bookmarks', 'الإشارات المرجعية'], [n(/\/mobile\.json$/), 'phone layout', 'phone layouts', 'تخطيطات الهاتف']].filter((x) => x[0]);
    parts.push(ar ? `التقارير: ${reports}${inner.length ? ` (${inner.map((x) => `${x[3]}: ${x[0]}`).join('، ')})` : ''}` : `${en(reports, 'report', 'reports')}${inner.length ? ': ' + inner.map((x) => en(x[0], x[1], x[2])).join(', ') : ''}`);
  }
  const themes = kind === 'theme' ? n(/\.json$/i) : n(THEME_FILE), scripts = P.filter(isScript).length, models = n(/\.SemanticModel\/definition\/model\.tmdl$/i), tables = n(/\.SemanticModel\/definition\/tables\/[^/]+\.tmdl$/i);
  if (models) parts.push(ar ? `النموذج: ${models} (الجداول: ${tables})` : `${en(models, 'model', 'models')} (${en(tables, 'table', 'tables')})`);
  if (themes) parts.push(ar ? `السمة: ${themes}` : en(themes, 'theme', 'themes'));
  if (scripts) parts.push(ar ? `السكربتات: ${scripts}` : en(scripts, 'script', 'scripts'));
  return parts.join(ar ? '؛ ' : '; ');
}
// (0.3.1 R4A, round 4's problem 2: the page opened on counts of files, visuals, bookmarks and phone layouts) the page's
// first line, in plain words: what is new and where ("1 new report: 4 pages, next to your model, in the folder "Sales"
// (C:\\DataArcus\\Sales)"); the counts are folded under it (kindsLine). paths: the plan's outputs, relative to the
// working folder; kind: the plan's
const dirOf = (f) => { const i = String(f).lastIndexOf('/'); return i < 0 ? '.' : String(f).slice(0, i); };
export function plainLine(paths, kind, ar, at) {
  const P = (paths || []).map(String), pbip = P.filter((f) => /\.pbip$/i.test(f)), scripts = P.filter(isScript), pages = P.filter((f) => /\/page\.json$/.test(f)).length;
  const where = (f) => (at == null ? '' : folderSaid(at === '.' ? dirOf(f) : dirOf(f) === '.' ? at : `${at}/${dirOf(f)}`, ar)), near = { report: [', next to your model', '، بجانب نموذجك'], redesign: [', next to the original', '، بجانب التقرير الأصلي'], twin: [', next to the original', '، بجانب التقرير الأصلي'] }[kind];
  const sc = (n) => (ar ? `، ومعه سكربت${n === 1 ? '' : 'ات'} (${n}) في المجلد نفسه` : `, and ${n === 1 ? '1 script' : `${n} scripts`} beside it`);
  const inEn = (f) => (where(f) ? `, in ${where(f)}` : ''), inAr = (f) => (where(f) ? `، في ${where(f)}` : '');
  if (kind === 'sample' && pbip.length) return ar ? `مشروع مثال جديد (بيانات تجريبية)${inAr(pbip[0])}` : `1 new sample project (made-up data)${inEn(pbip[0])}`;
  if (pbip.length) {
    const n = pbip.length, pg = ar ? ` (الصفحات: ${pages})` : `: ${pages} page${pages === 1 ? '' : 's'}`;
    return (ar ? `${n === 1 ? 'تقرير جديد واحد' : `تقارير جديدة (${n})`}${pages ? pg : ''}${near ? near[1] : ''}${inAr(pbip[0])}` : `${n === 1 ? '1 new report' : `${n} new reports`}${pages ? pg : ''}${near ? near[0] : ''}${inEn(pbip[0])}`) + (scripts.length ? sc(scripts.length) : '');
  }
  if (kind === 'theme') { const t = P.find((f) => /\.json$/i.test(f)); return t ? (ar ? `ملف سمة جديد واحد${inAr(t)}` : `1 new theme file${inEn(t)}`) : ''; }
  if (scripts.length) return ar ? `سكربت${scripts.length === 1 ? ' جديد واحد' : `ات جديدة (${scripts.length})`}${inAr(scripts[0])}` : `${scripts.length === 1 ? '1 new script' : `${scripts.length} new scripts`}${inEn(scripts[0])}`;
  return P.length ? (ar ? `ملفات جديدة (${P.length})${inAr(P[0])}` : `${P.length === 1 ? '1 new file' : `${P.length} new files`}${inEn(P[0])}`) : '';
}
// (0.3.1 C: a .tmdl inside a .SemanticModel folder is the model itself, as the sample project writes it, not a script)
export const isScript = (f) => /\.tmdl$/i.test(String(f)) && !/\.SemanticModel\//i.test(String(f));
// (0.3.1 LR1) the sample section's row names in Arabic
const SAMPLE_AR = { 'What it is': 'ما هو', 'Made up': 'بيانات تجريبية', Folder: 'المجلد', 'To open': 'للفتح', 'Date table': 'جدول التاريخ', Report: 'التقرير', Relationships: 'العلاقات', 'The rows': 'الصفوف' };
// (0.3.0 J18, B-171) the terminology sheet, side by side: each field's English name (its key) and its Arabic, with its status
const TERM_STATUS = (r) => (r.status === 'approved' ? `approved${r.earlier ? ' (earlier in this session, unchanged since)' : ''}`
  : r.status === 'draft' ? 'draft from the fixed list of report words: approved with this plan' : `kept in English${r.why ? `: ${String(r.why).replace(/^kept in English(?: for now)?: /, '')}` : ''}`);
const termSheet = (rows) => ({ heading: `Terminology sheet: English | Arabic (${rows.length})`, rows: rows.map((r) => [`${String(r.en)} (${String(r.field)})`, `${r.ar != null ? String(r.ar) : String(r.en)}: ${TERM_STATUS(r)}${r.places ? `; shown in ${r.places} place${r.places === 1 ? '' : 's'}` : ''}`]) });
const KIND_NAME = { bar: 'Bar chart', column: 'Column chart', line: 'Line chart', donut: 'Donut chart', table: 'Table' };
const KIND_A = { bar: 'a bar chart', column: 'a column chart', line: 'a line chart', donut: 'a donut chart', table: 'a table' };
// (FX1) the same in Arabic, for an Arabic page
const KIND_NAME_AR = { bar: 'مخطط شريطي', column: 'مخطط عمودي', line: 'مخطط خطي', donut: 'مخطط دائري مجوف', table: 'جدول' };
const KIND_A_AR = { bar: 'مخطط شريطي', column: 'مخطط عمودي', line: 'مخطط خطي', donut: 'مخطط دائري مجوف', table: 'جدول' };
// (0.3.0 T1, T-7) the tools' inputs in the person's words: [label, (value, val) => text]
const DAY = (v) => String(v).charAt(0).toUpperCase() + String(v).slice(1);
const COUNTRY = { uae: 'United Arab Emirates', ksa: 'Saudi Arabia', qat: 'Qatar', kwt: 'Kuwait', bhr: 'Bahrain', omn: 'Oman' };
const INPUT_WORDS = {
  path: ['Model', (v) => String(v)], maxItems: ['Findings listed per check', (v) => `at most ${v}`], weekStart: ['Week starts on', DAY], country: ['Country', (v) => COUNTRY[v] || String(v)],
  asOf: ['Counted as today', (v) => String(v)], only: ['Only these checks', (v, val) => val(v)], forgetAnswers: ['Forget the recorded answers', (v) => (v ? 'yes' : 'no')],
  columnTypes: ['Column types you gave', (v) => `${Object.keys(v || {}).length} column${Object.keys(v || {}).length === 1 ? '' : 's'}`],
  firstYear: ['First year', (v) => String(v)], lastYear: ['Last year', (v) => String(v)], name: ['Name', (v) => String(v)], folder: ['Folder', (v) => String(v)],
  // (T2: "the UAE's announced dates" for Saudi Arabia read as if they were Saudi Arabia's) the dates the table has: the
  // UAE's announced ones are the only announced dates DataArcus holds (assets/js/gulf-dates.js), for every country
  announced: ['Ramadan and Eid dates', (v, val, all) => (!v ? 'the Umm al-Qura calendar only' : `the UAE's announced dates (later ones are Umm al-Qura estimates)${all && all.country && all.country !== 'uae' ? `: DataArcus holds no announced dates of ${COUNTRY[all.country] || 'this country'}'s own, so where ${COUNTRY[all.country] || 'it'} announced another day, the table has the UAE's` : ''}`)],
  weekend: ['Weekend', (v) => ({ country: 'the country\'s official weekend', 'sat-sun': 'Saturday and Sunday', 'fri-sat': 'Friday and Saturday', fri: 'Friday', sun: 'Sunday' })[v] || String(v)],
  lang: ['Language of the names', (v) => (v === 'ar' ? 'Arabic' : 'English')], arabicNames: ['Arabic name columns too', (v) => (v ? 'yes' : 'no')], fiscalStart: ['Fiscal year starts in month', (v) => String(v)],
  relateTo: ['Asked to relate to the new table\'s Date', (v) => [].concat(v).join(', ')], arabicColumnsOnly: ['What is written', (v) => (v ? 'only the Arabic calendar columns, for your own date table' : 'a new calendar table')],
  brand: ['Brand colour', (v) => String(v)], mode: ['Mode', (v) => String(v)]
};
/** The plan as the window shows it: every input the plan pins, by name, as plain text (A-01: the person sees what the
 *  click approves). kind: the plan's kind; data: the plan's data (its pins, the twin's labels). */
// (0.3.0 X1; 0.3.1 X2) a report holding both languages, on the twin's EN-AR page and on create_report's page: the report,
// every page pair, the language buttons, the slicers kept in sync; at: where in the sections they go (0 first)
function languagesSections(LG, sections, at) {
  const pairs = Array.isArray(LG.pairs) ? LG.pairs : [], btns = Array.isArray(LG.buttons) ? LG.buttons : [], sg = Array.isArray(LG.syncGroups) ? LG.syncGroups : [], T = LG.tabs || {};
  const pg = (x) => `"${String((x && x.name) || '')}"${x && x.hidden ? ' (hidden in the tabs)' : ''}`;
  sections.splice(at, 0, { heading: 'One report, English and Arabic', rows: [['New report', { en: String((LG.copy || {}).report || ''), ar: `«${String((LG.copy || {}).report || '')}»` }], ['Project file', { en: String((LG.copy || {}).pbip || ''), ar: `«${String((LG.copy || {}).pbip || '')}»` }], ['The original', at ? 'none: a new report' : 'only read: not changed'],
    ['Tabs shown', String(T.shown || '')], ['Hidden in the tabs', String(T.hidden || '')], ['Tooltip pages', String(T.tooltipPages || '')], ['What a reader sees', String(T.service || '')], ['Bookmarks', String(LG.bookmarks || 'none')]]
    .concat((Array.isArray(LG.measures) ? LG.measures : []).map((m) => ['Report measure', `${String(m.arabic)} for the Arabic pages; ${String(m.measure)} stays for the English pages`])) },
  { heading: `Page pairs (${pairs.length})`, rows: pairs.map((x, i) => [`${i + 1}. English ${pg(x.english)}`, `Arabic ${pg(x.arabic)}${x.tooltip ? ' (tooltip pages)' : x.drillthrough ? ' (drillthrough pages)' : ''}`]) },
  { heading: `Language buttons (${btns.length})`, rows: btns.map((b) => [`${String(b.on)} page "${String(b.page)}"`, b.placed ? `«${String(b.text)}» at ${String(b.at || '')}, goes to its ${b.on === 'English' ? 'Arabic' : 'English'} page; ${b.phone ? 'on the phone layout too' : `not on the phone layout${b.why ? ': ' + String(b.why) : ''}`}` : `not placed: ${String(b.why || '')}`]) },
  { heading: `Slicers kept in sync (${sg.length})`, rows: sg.map((x) => [`Page "${String(x.page)}": slicer ${String(x.slicer)}`, `with its Arabic copy ${String(x.arabicSlicer || '')}, sync group "${String(x.group)}"${x.kept ? ` (${String(x.kept)})` : ''}`]) });
}
// (0.3.2 AP1, E1 round 5 (a), (d): the page named 3 slicers and one page; the click wrote 9 slicers, 3 reset buttons, a
// second bar chart and two tooltip pages) what each page of the report holds, as plan_layout read it back from the exact
// files the write writes (plan-lint.mjs pagesWritten): every page, the tooltip pages too, and on it every visual by its
// kind, counted; the slicers by field, the buttons by where they go, the charts by their field. English and Arabic
// (the Arabic: a draft for the owner, mcp/work/AP1.md)
const VT_WORDS = { clusteredBarChart: ['bar chart', 'bar charts', 'مخططات شريطية'], barChart: ['stacked bar chart', 'stacked bar charts', 'مخططات شريطية مكدسة'], clusteredColumnChart: ['column chart', 'column charts', 'مخططات عمودية'],
  columnChart: ['stacked column chart', 'stacked column charts', 'مخططات عمودية مكدسة'], lineChart: ['line chart', 'line charts', 'مخططات خطية'], areaChart: ['area chart', 'area charts', 'مخططات مساحية'], donutChart: ['donut chart', 'donut charts', 'مخططات دائرية مجوفة'],
  pieChart: ['pie chart', 'pie charts', 'مخططات دائرية'], lineClusteredColumnComboChart: ['combo chart', 'combo charts', 'مخططات مركبة'], waterfallChart: ['waterfall', 'waterfalls', 'مخططات شلالية'], cardVisual: ['card', 'cards', 'بطاقات'], card: ['card', 'cards', 'بطاقات'],
  multiRowCard: ['multi-row card', 'multi-row cards', 'بطاقات متعددة الصفوف'], kpi: ['KPI visual', 'KPI visuals', 'مرئيات KPI'], tableEx: ['table', 'tables', 'جداول'], pivotTable: ['matrix', 'matrices', 'مصفوفات'], textbox: ['text box', 'text boxes', 'مربعات نص'],
  shape: ['shape', 'shapes', 'أشكال'], image: ['image', 'images', 'صور'], group: ['group', 'groups', 'مجموعات مرئيات'], map: ['map', 'maps', 'خرائط'], filledMap: ['filled map', 'filled maps', 'خرائط ملونة'], scatterChart: ['scatter chart', 'scatter charts', 'مخططات مبعثرة'],
  gauge: ['gauge', 'gauges', 'مقاييس دائرية'], treemap: ['treemap', 'treemaps', 'مخططات شجرية'], funnel: ['funnel', 'funnels', 'مخططات قمعية'], ribbonChart: ['ribbon chart', 'ribbon charts', 'مخططات شريطية متدفقة'],
  // (0.3.2 PL1) the kinds a redesign's rows name too (the page list counts slicers and buttons on their own)
  slicer: ['slicer', 'slicers', 'مقسمات'], advancedSlicerVisual: ['slicer', 'slicers', 'مقسمات'], actionButton: ['button', 'buttons', 'أزرار'], pageNavigator: ['page navigator', 'page navigators', 'أدوات التنقل بين الصفحات'],
  bookmarkNavigator: ['bookmark navigator', 'bookmark navigators', 'أدوات التنقل بين الإشارات المرجعية'] };
// (0.3.2 PL1, E1 round 5: a visual by Power BI's type key) one visual's kind in words; a custom visual by its id
const kindSaid = (t) => { const s = String(t || ''), m = /^custom (.+)$/.exec(s); return m ? `custom visual ${m[1]}` : VT_WORDS[s] ? VT_WORDS[s][0] : s; };
const nOf = (n, one, many) => `${n} ${n === 1 ? one : many}`;
// (AP2) a page's cards (pagesWritten: cards [{ shows: [Table[Measure]] }], messageCards, kinds): each card by its
// measures' names (a model's measure names are unique), the message boxes, the cards with no measure; English and Arabic
// (the Arabic of the message boxes and of a card with no measure: approved by the owner, D-1108-12)
const CARD_KINDS = /^(cardVisual|card|multiRowCard|kpi)$/;
const measureName = (f) => { const m = /\[(.*)\]$/s.exec(String(f)); return m ? m[1] : String(f); };
function cardItems(x) {
  const C = (x.cards || []).map((c) => (c.shows || []).map(measureName)), msg = +x.messageCards || 0, out = [];
  const all = (x.kinds || []).filter((k) => CARD_KINDS.test(k.type)).reduce((n, k) => n + (+k.count || 0), 0), left = Math.max(0, all - C.length - msg);
  if (C.length) out.push({ en: `${nOf(C.length, 'card', 'cards')}: ${C.map((c) => c.join(' and ')).join(', ')}`, ar: `البطاقات: ${C.length} (${C.map((c) => c.map((n) => `«${n}»`).join(' و')).join('، ')})` });
  if (msg) out.push({ en: `${nOf(msg, '"no data" message box', '"no data" message boxes')}: each over a chart, shown when it has no data`, ar: `مربعات رسالة «لا توجد بيانات»: ${msg} (كل منها فوق مخطط، يظهر عندما لا تكون لديه بيانات)` });
  if (left) out.push({ en: `${nOf(left, 'card', 'cards')} with no measure`, ar: `بطاقات دون مقياس: ${left}` });
  return out;
}
function pagesSection(PW) {
  const rows = PW.map((x) => {
    const items = [{ en: nOf(+x.visuals || 0, 'visual', 'visuals'), ar: `المرئيات: ${+x.visuals || 0}` }];
    if (x.tooltip) { const u = (x.usedBy || []).map(String);
      items.push({ en: `a tooltip page${x.hidden ? ', hidden in the tabs' : ''}: shown when a reader points at a chart that uses it${u.length ? ` (on ${u.map((n) => `"${n}"`).join(', ')})` : ''}`,
        ar: `صفحة تلميح${x.hidden ? '، مخفية من علامات التبويب' : ''}: تظهر عندما يشير القارئ إلى مخطط يستخدمها${u.length ? ` (في ${u.map((n) => `«${n}»`).join('، ')})` : ''}` }); }
    else if (x.hidden) items.push({ en: 'hidden in the tabs', ar: 'مخفية من علامات التبويب' });
    const S = (x.slicers || []).map(String);
    if (S.length) items.push({ en: `${nOf(S.length, 'slicer', 'slicers')}: ${S.join(', ')}`, ar: `المقسمات: ${S.length} (${S.map((f) => `«${f}»`).join('، ')})` });
    const B = x.buttons || [];
    if (B.length) items.push({ en: `${nOf(B.length, 'button', 'buttons')}: ${B.map((b) => (b.to === 'page' ? `to page "${b.name}"` : b.to === 'bookmark' ? `"${b.name}" (a bookmark)` : 'another action')).join('; ')}`,
      ar: `الأزرار: ${B.length} (${B.map((b) => (b.to === 'page' ? `إلى الصفحة «${b.name}»` : b.to === 'bookmark' ? `«${b.name}» (إشارة مرجعية)` : 'إجراء آخر')).join('؛ ')})` });
    // (0.3.2 AP2, A-PF2-2, D-1108-07) the cards by the measure each shows, at the place of the first card kind; the "no
    // data" message boxes laid over the charts on their own line, never counted as cards; a card with no measure apart
    let cardsSaid = false;
    (x.kinds || []).forEach((k) => { const w = VT_WORDS[k.type] || [String(k.type), String(k.type), String(k.type)], by = (k.by || []).map(String);
      // (data without the cards list, as before PF2: its card kinds said as before)
      if (CARD_KINDS.test(k.type) && Array.isArray(x.cards)) { if (!cardsSaid) items.push(...cardItems(x)); cardsSaid = true; return; }
      items.push({ en: `${nOf(+k.count || 0, w[0], w[1])}${by.length ? `: ${by.map((f) => `by ${f}`).join(', ')}` : ''}`, ar: `${w[2]}: ${+k.count || 0}${by.length ? ` (${by.map((f) => `حسب «${f}»`).join('، ')})` : ''}` }); });
    return [`Page ${x.n}: ${cut(String(x.name), 80)}`, items];
  });
  return { heading: `What each page holds (${PW.length})`, rows };
}
export function summary(kind, data) {
  const s = summaryOf(kind, data), wa = data && data.writesAr;
  // (SQ3, T1-S6) the writes in Arabic, as the plan's tool said them (shown on an Arabic page only, line for line)
  if (Array.isArray(wa)) s.writesAr = wa.map(String);
  // (R4A) where the outputs are, relative to the working folder (the page's first line names the folder)
  if (data && typeof data.outputsAt === 'string') s.outputsAt = data.outputsAt;
  return s;
}
function summaryOf(kind, data) {
  const d = data || {}, pins = d.pins || {}, sections = [];
  // (R6, F09 f: a long value was cut at 600 characters) every value in full
  const val = (v) => (v == null ? '' : typeof v === 'string' ? v : typeof v === 'boolean' ? (v ? 'yes' : 'no') : JSON.stringify(v));
  // (0.3.0 T1, T-6: "There is no background image." under a list holding the background PNG) a page background the writer
  // writes blank (a see-through pixel, so the page shows the theme's colour) is listed as what it is
  const blank = new Set(Array.isArray(d.blankImages) ? d.blankImages.map(String) : []);
  const glassPics = new Set(Array.isArray(d.glassImages) ? d.glassImages.map(String) : []);
  const files = Array.isArray(d.outputs) ? groupFiles(d.outputs, [[BLANK_LABEL(), { test: (f) => blank.has(f) }], [d.look && d.look.noPicture ? GLASS_PLAIN_LABEL() : GLASS_LABEL(), { test: (f) => glassPics.has(f) }], ['Metric switcher script', / - metric switcher\.tmdl$/i], ['Status icons script', / - status icons\.tmdl$/i], ['DAX functions script', / - DAX functions(?: \d+)?\.tmdl$/i]]) : null;   // (L3: the switch's own script; 0.3.1 L6: the DAX functions')
  // (0.3.2 FN1E) each kind's page by its own steps, on one context; a report's in five, in this order
  const sc = { kind, d, pins, sections, val, files };
  if (kind === 'report') {
    reportHeadStep(sc);
    reportFieldsStep(sc);
    reportExtrasStep(sc);
    reportLookStep(sc);
    return reportTailStep(sc);
  }
  if (kind === 'redesign') return redesignStep(sc);
  if (kind === 'sample') return sampleStep(sc);
  if (kind === 'twin') return twinStep(sc);
  themeColoursStep(sc);
  return inputsStep(sc);
}
// (FN1E) a report: the name written, the title, the DAX library's first line, "Report"
function reportHeadStep(sc) {
  const { kind, d, pins, sections, val, files } = sc;
    const p = pins.create_report || {}, L = (p.design && p.design.layout) || {};
    // (0.3.1 R4A, the laptop's rc.1 run: the prompt named the taken "Gulf Retail Sales" while the write went to the free
    // "Gulf Retail Sales - New design") the name the write uses: the plan's own .pbip, else the name asked
    const pbipOf = Array.isArray(d.outputs) ? d.outputs.map(String).find((f) => /\.pbip$/i.test(f)) : null, wName = pbipOf ? pbipOf.replace(/^.*\//, '').replace(/\.pbip$/i, '') : null, nm0 = wName || p.name;
    const T = { title: (d.bilingual ? 'English and Arabic in one report' : 'Report') + (nm0 ? ` "${cut(nm0, 80)}"` : ''), name: nm0 || null, previews: d.preview && Array.isArray(d.preview.pages) ? d.preview : null, files, kind, lang: p.lang === 'ar' ? 'ar' : 'en', scriptWhat: 'the changes listed with the plan', titleKey: d.bilingual ? 'same' : 'report',
      // (0.3.1 CX2) one report in both languages whose Arabic pages could not be drawn (twinPreview failed: no pairs)
      ...(d.bilingual && d.preview && Array.isArray(d.preview.pages) && !Array.isArray(d.preview.pairs) ? { previewFailed: 'arabic' } : {}) };
    // (0.3.1 L6) the DAX function library's compatibility step, the FIRST thing on the page, in the plan's language: applying
    // its script raises the model's compatibility level to 1702, which cannot be undone (or the model is already there)
    const DF = d.daxFunctions && d.daxFunctions.compatibility ? d.daxFunctions : null;
    if (DF) { const C = DF.compatibility, ar = T.lang === 'ar';
      T.first = { heading: ar ? (C.raises ? 'أولًا: هذا يرفع مستوى التوافق في نموذجك (لا يمكن التراجع عنه)' : 'أولًا: مستوى التوافق في نموذجك') : (C.raises ? 'First: this raises your model\'s compatibility level (cannot be undone)' : 'First: your model\'s compatibility level'),
        text: [String(ar && C.sayFirstAr ? C.sayFirstAr : C.sayFirst || '')] }; }
    // (FX1) on an Arabic page each name inside «» (aq)
    const aq = (en, ar) => ({ en, ar });
    sections.push({ heading: 'Report', rows: [['Name', wName && p.name && wName !== p.name ? aq(`${wName} ("${p.name}" is already taken in that folder: the new report gets this free name)`, `«${wName}» (الاسم «${p.name}» مستخدم في هذا المجلد: يأخذ التقرير الجديد هذا الاسم المتاح)`) : nm0 == null ? nm0 : aq(String(nm0), `«${nm0}»`)],
      ['Title', p.title ? aq(String(p.title), `«${p.title}»`) : (p.name ? '(the report\'s name)' : '')], ['Language', p.lang === 'ar' ? 'Arabic (right to left)' : 'English'],
      ['Page size', p.page ? val(p.page) : L.page || (p.pages ? '' : E.DEFAULT_PAGE)], p.customVisualsFrom != null ? ['Copy of the report', aq(String(p.customVisualsFrom), `«${p.customVisualsFrom}»`)] : null].filter((r) => r && r[1] !== undefined && r[1] !== '' && r[1] !== null).map(([k, v]) => [k, v && typeof v === 'object' ? v : val(v)]) });
  Object.assign(sc, { p, L, T, DF });
}
// (FN1E) a report: the kinds changed, Layout, Fields, each page's visuals, Pages, the names shown, the terminology
function reportFieldsStep(sc) {
  const { d, sections, val, p, L } = sc;
    // (rc.24, B-140: the page said "Column chart by" for the chart written as a bar chart) the kind each chart is written
    // as, with the reason when the writer changed it (the plan's data: kinds [{ role, from, to }], plan_layout's lint)
    const kinds = Array.isArray(d.kinds) ? d.kinds : [], changeOf = (from) => kinds.find((k) => k && k.from === from);
    // (R6, F09 d) the lint's own measured why when the plan holds it (#64), else the general reason
    // (0.3.1 R4A, round 4's problem 1: "42 px a category" where the person decides) the plan's said first: the person's
    // words, no pixels or letter widths (why, the measured numbers, is the agent's); its Arabic on an Arabic page
    const why = (k) => `planned as ${KIND_A[k.from] || 'another kind'}: ${k.said ? String(k.said) : k.why ? String(k.why) : k.to === 'donut' ? 'its category has two values' : 'the names would slant or be cut'}`;
    // (0.3.2 AP1, E1 round 5 (c): "Bar chart by Status (planned as a column chart)" while page 2's Status chart is a
    // column chart) a kind changed is the first page's (plan_layout's slots): said with its page; the other pages' visuals
    // are each named under "What each page holds"
    const PW = Array.isArray(d.pagesWritten) && d.pagesWritten.length ? d.pagesWritten : null, p1 = PW ? PW.find((x) => !x.tooltip) : null;
    const onP1 = p1 ? { en: ` on page ${p1.n} "${String(p1.name)}"`, ar: ` في الصفحة ${p1.n} «${String(p1.name)}»` } : { en: '', ar: '' };
    const two = (en, ar) => (p.lang === 'ar' && ar ? { en, ar } : en);
    // (FX1) the Arabic of a kind changed: the role, the kind written, the kind planned, the reason in the person's words
    const whyAr = (k) => `بدلًا من ${KIND_A_AR[k.from] || 'نوع آخر'}: ${(k.saidAr || arOf(String(k.said || ''))) || (k.to === 'donut' ? 'لفئته قيمتان' : 'ستميل الأسماء أو تُقص')}`;
    if (p.design) sections.push({ heading: 'Layout', rows: [['Layout', { exec: 'Executive summary', analysis: 'Analysis', ops: 'Operations monitor', focus: 'Single focus' }[L.preset] || L.preset], ['KPI cards', L.kpis], ['Filters', L.filters ? String(L.filters) : 'none'], ['Header', L.header === false ? 'no' : 'yes'], ['Second page', p.secondPage === false ? 'no' : 'yes, with page buttons']].filter((r) => r[1] !== undefined).map(([k, v]) => [k, val(v)])
      .concat(kinds.length ? [['Written as another kind', kinds.map((k) => (k.said ? two(`${k.role || 'A chart'}${onP1.en}: ${KIND_NAME[k.to] || 'another kind'} (planned as ${KIND_A[k.from] || 'another kind'}): ${String(k.said)}`, `${k.role || 'مخطط'}${onP1.ar}: ${KIND_NAME_AR[k.to] || 'نوع آخر'} (${whyAr(k)})`)
        : two(`${k.role || 'A chart'}${onP1.en}: ${KIND_NAME[k.to] || 'another kind'} (${why(k)})`, `${k.role || 'مخطط'}${onP1.ar}: ${KIND_NAME_AR[k.to] || 'نوع آخر'} (${whyAr(k)})`)))]] : []) });
    // category is the bar chart's field, category2 the column chart's
    const F = p.fields || {}, FL = { kpis: 'KPI cards', measure: 'Charts\' measure', timeAxis: 'Trend axis', category: 'Bar chart by', category2: 'Column chart by', table: 'Table', slicers: 'Slicers' }, PLANNED = { category: 'bar', category2: 'column' };
    // (0.3.1 LR1) the slicers the plan adds to fill the design's slots, named after the ones asked
    const added = (k0) => (k0 === 'slicers' && Array.isArray(d.slicersAdded) ? d.slicersAdded.map((f) => ({ en: `${String(f)} (added by DataArcus to fill the design's slicer slots)`, ar: `«${String(f)}» (أضافه DataArcus لملء خانات المقسمات في التصميم)` })) : []);
    const fq = (x) => ({ en: String(x), ar: `«${String(x)}»` });
    const fr = Object.keys(FL).filter((k) => F[k] !== undefined).map((k) => { const v = Array.isArray(F[k]) ? F[k].map(fq).concat(added(k)) : fq(F[k]), c = PLANNED[k] && changeOf(PLANNED[k]);
      return c ? [{ en: `${KIND_NAME[c.to] || 'Chart'} by`, ar: `${KIND_NAME_AR[c.to] || 'المخطط'} حسب` }, { en: `${v.en} (${onP1.en ? onP1.en.slice(1) + ': ' : ''}${why(c)})`, ar: `${v.ar} (${onP1.ar ? onP1.ar.slice(1) + ': ' : ''}${whyAr(c)})` }] : [FL[k], v]; });
    // (AP1 (b): "Other visuals: chosen by DataArcus from the model" named none of the 28 visuals) where the plan's own
    // files are read back, the row points to the list of every page's visuals
    const chosen = (more) => (PW ? { en: `chosen by DataArcus from the model${more}: every one is named below, page by page (What each page holds)`, ar: `يختارها DataArcus من النموذج: كلها مذكورة أدناه، صفحة صفحة (ما تحويه كل صفحة)` } : 'chosen by DataArcus from the model' + more);
    sections.push({ heading: 'Fields', rows: fr.length ? fr.concat(Object.keys(F).length < Object.keys(FL).length ? [['Other visuals', chosen('')]] : []) : [['All visuals', chosen((p.focus ? ` (focus: ${val(p.focus)})` : '') + (p.tables ? ` (tables: ${val(p.tables)})` : ''))]] });
    if (PW) sections.push(pagesSection(PW));
    if (p.pages) sections.push({ heading: 'Pages', rows: p.pages.map((pg, i) => [`Page ${i + 1}: ${cut(pg.name, 80)}`, (pg.slots || []).map((s) => `${s.kind}${s.title ? `: ${s.title}` : ''}${s.text ? ` "${cut(s.text, 120)}"` : ''}`).concat(pg.background ? [`background: ${pg.background}`] : [])]) });
    if (p.displayNames && Object.keys(p.displayNames).length) sections.push({ heading: 'Names shown in the report', rows: Object.entries(p.displayNames).map(([k, v]) => [k, String(v)]) });
    if (Array.isArray(d.terminology) && d.terminology.length) sections.push(termSheet(d.terminology));
}
// (FN1E) a report: dates, the fields in English, waterfalls, flip cards, status icons, the DAX function library
function reportExtrasStep(sc) {
  const { d, sections, DF } = sc;
    // (0.3.0 J17, B-170) the date the report follows, its grain and seasonal scope, and the dates' status, before the click
    if (Array.isArray(d.gulfDates) && d.gulfDates.length) sections.push({ heading: 'Dates and seasonal scope', rows: d.gulfDates.map(([k, v]) => [String(k), String(v)]) });
    // (0.3.0 R2: an Arabic report's texts are Arabic, or listed here with why before the go) the fields kept in English
    if (Array.isArray(d.notTranslated) && d.notTranslated.length) sections.push({ heading: `Shown in English (${d.notTranslated.length}, no Arabic name)`, rows: d.notTranslated.map((x) => [String(x.field), String(x.why || '')]) });
    // (D1) a right-to-left report's waterfalls: what each is written as, before the click
    if (Array.isArray(d.waterfallRtl) && d.waterfallRtl.length) sections.push({ heading: `Waterfalls, right to left (${d.waterfallRtl.length})`, rows: d.waterfallRtl.map((x) => [`${cut(String(x.page || ''), 60)}${x.title ? `: ${cut(String(x.title), 80)}` : ''}`, `${String(x.written || '')}: ${String(x.what || '')}${x.why ? ` (${String(x.why)})` : ''}`]) });
    // (0.3.0 L4) the flip cards: which cards, what their back says, the bookmarks, the model change, before the click
    const FC = d.flipCards && Array.isArray(d.flipCards.cards) ? d.flipCards : null;
    const pbipOut = Array.isArray(d.outputs) ? d.outputs.map(String).find((f) => /\.pbip$/i.test(f)) : null, pbipDir = pbipOut ? dirOf(pbipOut) : null;   // (R4A, T-9)
    if (FC && FC.cards.length) sections.push({ heading: `Flip cards (${FC.cards.length})`, rows: FC.cards.map((c) => [`${cut(String(c.page || ''), 60)}: card ${c.card}`, `${cut(String(c.title || ''), 80)}: the front shows its title and value; the back shows the measure's name and one line: ${String((c.back || {}).description || '')}; ${String((c.back || {}).value || '')}; year on year: ${String((c.back || {}).yearOnYear || '')}`])
      .concat([['Bookmarks', `${FC.bookmarks} display-only bookmarks (two a card: one shows the back, one the front); they touch no slicer or filter`],
        ['Model change', `${FC.newMeasures} new measures (the pictures) in the script "${String(FC.scriptAfterGo || '')}" next to the report, in ${pbipDir ? folderSaid(pbipDir) : 'the report\'s folder'}. The model is not changed by DataArcus: apply the script first, in TMDL view (Preview, then Apply); until then ${FLIP_BEFORE}`],
        ['How it turns', 'a click turns the card (Ctrl+click while editing in Desktop), in 0.3 s; the backdrop in the card colour stays behind both faces']],
      (FC.notFlipped || []).map((x) => [`Card ${x.card}`, `not flipped: ${String(x.why || '')}`])) });
    // (0.3.0 L5) the status icons: which columns, how each is decided (the user's thresholds as given, or the target the
    // model names), the shapes, the model change, before the click
    const SI = d.statusIcons && Array.isArray(d.statusIcons.columns) ? d.statusIcons : null;
    if (SI) sections.push({ heading: `Status icons (${SI.columns.length})`, rows: SI.columns.map((c) => [`${cut(String(c.page || ''), 60)}: ${c.visual === 'matrix' ? 'matrix' : 'table'}, ${cut(String(c.measure || ''), 120)}`,
      c.way === 'rules' ? `rules from the user's thresholds, as given: good ${String((c.thresholds || {}).good || '')}, bad ${String((c.thresholds || {}).bad || '')}; between them the warning icon (no script)` : `a status measure ${String(c.statusMeasure || '')}: at or above its target ${String(c.target || '')} (named in the model) good, below it bad; no warning band (no threshold is guessed)`])
      .concat([['Icons', String(SI.icons || '')], ['Placement', String(SI.placement || '')]],
        SI.modelChange ? [['Model change', String(SI.modelChange)]] : [['Model change', 'none: the model is not changed (rules need no measure)']],
        SI.themeAdded ? [['Theme', String(SI.themeAdded)]] : [],
        (SI.notShown || []).map((x) => [`No icon: ${cut(String(x.measure || ''), 120)}`, String(x.why || '')]),
        SI.none ? [['No icon', String(SI.none)]] : []) });
    // (0.3.1 L6) the DAX function library: every function and every measure the script adds, where each shows, before the click
    if (DF) sections.push({ heading: `DAX function library (${(DF.functions || []).length} functions, ${(DF.measures || []).length} measures)`, rows: (DF.functions || []).map((f) => [`Function ${String(f.name || '')}`, `(${String(f.params || '')})${f.inScript === false ? ': already in the model, left out of the script' : ''}`])
      .concat((DF.measures || []).map((x) => [`Measure ${cut(String(x.measure || ''), 140)}`, `${({ sparkline: 'sparkline column', bulletBar: 'bullet bar column', kpiCards: 'KPI card picture', storyTitles: 'story title' })[x.use] || String(x.use || '')} of ${cut(String(x.of || ''), 140)}`]),
        [['Colours', String(DF.colours || '')], ['Model change', String(DF.modelChange || '')], ['User-defined functions', String(DF.status || '')]],
        (DF.notUsed || []).map((x) => [`Not used: ${String(x.use || '')}${x.page ? ` (${cut(String(x.page), 60)})` : ''}`, String(x.why || '')])) });
}
// (0.3.3 RX1) the plan's views, each a bookmark, in the plan's order: its number, its name as given and its page's name
// (the person's own words and the plan's page names only: no new wording, so the Arabic page needs none either)
const viewsSaid = (views, pagesWritten) => { const pg = (Array.isArray(pagesWritten) ? pagesWritten : []).filter((x) => x && !x.tooltip);
  return (Array.isArray(views) ? views : []).map((v, i) => { const n = pg[(+v.page || 1) - 1]; return `${i + 1}. ${cut(String(v.name || ''), 60)}: ${n && n.name != null ? cut(String(n.name), 60) : String(+v.page || 1)}`; }); };
// (FN1E) a report: its look and options
function reportLookStep(sc) {
  const { d, sections, val, p } = sc;
    // (the options by their names in the report's words; a bar colour left out is the default the plan says)
    const LK = { gallery: 'Visual gallery', theme: 'Theme file', logo: 'Logo', colors: 'Colours', chartColors: 'Bar colours', chartAxes: 'Chart axes', kpiValues: 'KPI values', noDataMessage: 'Message when there is no data', slidePanel: 'Filters in a slide-in panel', smoothLines: 'Smooth lines', slicerStyle: 'Slicer style', grid: 'Gridlines', flipCards: 'Flip cards', waterfallRtl: 'Waterfall, right to left', statusIcons: 'Status icons', daxFunctions: 'DAX function library', sharedAxes: 'Shared axes (the user\'s answers)', font: 'Font', rtl: 'Right to left', dir: 'Reading direction', bookmarks: 'Bookmarks' };
    const bars = p.chartColors !== undefined && p.chartColors !== null ? p.chartColors : p.pages ? 'solid' : p.design ? 'gradient' : null;
    const look = Object.keys(LK).filter((k) => k !== 'chartColors' && p[k] !== undefined && p[k] !== null && (k !== 'waterfallRtl' || ((p.lang === 'ar' || p.dir === 'rtl' || p.rtl === true) && (!Array.isArray(d.waterfallRtl) || d.waterfallRtl.length) && (d.waterfalls == null || d.waterfalls > 0)))).map((k) => [LK[k], k === 'waterfallRtl' ? { en: wfRtlSaid(p[k]), ar: wfRtlSaidAr(p[k]) } : k === 'font' ? { en: val(p[k]), ar: `«${val(p[k])}»` } : k === 'kpiValues' && p[k] === 'auto' ? 'auto (short, like 28.01M, when the number is long)' : k === 'smoothLines' ? (p[k] === false ? 'no: straight lines, no dots' : 'yes: smooth curves that never swing past the data, a dot on each point') : k === 'gallery' ? (p[k] === true ? 'yes: every kind whose fields fit' : p[k] === false ? 'no' : `yes: ${[].concat(p[k]).join(', ')}`) : k === 'slicerStyle' ? (p[k] === 'pills' ? 'pills: rounded buttons for a field of 2-6 values known from the model; a rounded dropdown for the others' : 'dropdown, rounded') : k === 'grid' ? ({ solid: 'solid, quiet', dotted: 'dotted, light grey', none: 'none' })[p[k]] || val(p[k]) : k === 'flipCards' ? (p[k] === true ? 'yes: every KPI card' : Array.isArray(p[k]) ? `yes: card${p[k].length === 1 ? '' : 's'} ${p[k].join(', ')}` : 'no') : k === 'statusIcons' ? (p[k] === true ? 'yes: the rates whose target the model names' : Array.isArray(p[k]) ? `yes: ${p[k].length} measure${p[k].length === 1 ? '' : 's'} (listed under Status icons)` : 'no') : k === 'sharedAxes' && Array.isArray(p[k]) ? p[k].map((x) => `${(x.measures || []).join(' and ')}: ${x.answer === 'comparable' ? 'comparable, one axis may be shared' : 'separate visuals'}`).join('; ') : k === 'colors' && typeof p[k] === 'object' ? { swatches: Object.entries(p[k]).map(([n, c]) => [n, String(c)]) } : k === 'bookmarks' ? viewsSaid(p[k], d.pagesWritten) : val(p[k])]);
    // the report's real data colours, as the theme will have them (the plan's design)
    // (R6, F13: the accessibility step changed a colour after the go, and said so only after the write) the colour the
    // report is written with, from the plan's own build, and why, before the click
    const cc = d.colours && Array.isArray(d.colours.changed) ? d.colours.changed : [];
    // (D6, the laptop proof of rc.2: the swatch showed the approved colour beside the line saying another is written) the
    // swatches are the written colours; the line names the approved one
    const written = (c, i) => { const x = i === 0 && cc.find((k) => String(k.from).toLowerCase() === String(c).toLowerCase()); return x ? String(x.to) : String(c); };
    const dc = p.design && Array.isArray(p.design.data) ? p.design.data : null;
    if (dc) look.push(['Data colours', { swatches: dc.map((c, i) => ['', written(c, i)]) }]);
    const own = (c) => (HEX.test(String(c.to)) && HEX.test(String(d.colours.card)) ? `; the written colour's own contrast: ${E.contrast(String(c.to), String(d.colours.card)).toFixed(2)}:1` : '');
    cc.forEach((c) => look.push(['The first data colour, made readable', `approved colour ${String(c.from)} -> written colour ${String(c.to)}: contrast ${c.contrast}:1 against the visuals' background ${String(d.colours.card || '')}, needs 3:1 for a data colour${own(c)} (the 3:1 contrast for graphics of WCAG 2.1, criterion 1.4.11; the hue is kept)`]));
    // (0.3.1 GD1) the cards' look: glass by default, plain where glass can't keep the text readable (and why), or as asked
    const lk = d.look && typeof d.look === 'object' ? d.look : null;
    // (0.3.2 AP2, A-E1R5B-1) glass whose page picture is the plain page colour (lookFor's noPicture): said as such
    const np = lk && lk.look === 'glass' && lk.noPicture && typeof lk.noPicture === 'object' ? lk.noPicture : null;
    if (np) look.unshift(['Card look', `${lk.chosenBy === 'default' ? 'Glass look (default)' : 'Glass look, as asked'}: see-through cards over the page's own colour, with no page picture: the page's text stands ${np.textOnPage == null || !isFinite(+np.textOnPage) ? 'under 4.5:1' : `${(Math.floor(+np.textOnPage * 10) / 10).toFixed(1)}:1`} on that colour, under 4.5:1, and a picture would lower it${lk.chosenBy === 'default' ? '; plain cards: ask for the plain look' : ''}`]);
    else if (lk) look.unshift(['Card look', lk.look === 'glass' ? (lk.chosenBy === 'default' ? 'Glass look (default): see-through cards over a soft page picture made from the theme\'s colours (Power BI has no blur behind a visual); plain cards: ask for the plain look' : 'Glass look, as asked: see-through cards over a soft page picture made from the theme\'s colours')
      : Array.isArray(lk.glassFailed) ? `Plain: with these colours glass can't keep everything readable (${lk.glassFailed.map((c) => `${String(c.check || '')}${c.ratio != null ? ` ${(Math.floor(+c.ratio * 10) / 10).toFixed(1)}:1, needs ${+c.min}:1` : ''}`).join('; ')}), so the cards are solid` : 'Plain, as asked: Power BI\'s own cards']);
    if (bars) look.unshift([LK.chartColors, bars === 'gradient' ? 'each bar fades by its value; a chart by a second category field gets a second colour, the same on every page' : 'one colour for every bar']);
    sections.push({ heading: 'Look and options', rows: look });
}
// (FN1E) a report: the metric switcher, thinner bars, the gallery, more options, both languages, what is not fully
// Arabic, already there, the custom visuals replaced, not checked before writing; the page
function reportTailStep(sc) {
  const { d, sections, val, p, T } = sc;
    // (L3) the metric switcher: the measures and their labels, the charts that switch, and the model change it needs
    const ms = d.metricSwitcher && typeof d.metricSwitcher === 'object' ? d.metricSwitcher : null;
    const CK = { bar: 'Bar chart', line: 'Line chart' };
    if (ms) sections.push({ heading: 'Metric switcher', rows: [['Page', String(ms.page || '')]]
      .concat((Array.isArray(ms.measures) ? ms.measures : []).map((x, i) => [`Metric ${i + 1}: ${cut(String(x.field), 120)}`, `shown as "${cut(String(x.label), 100)}"`]))
      .concat([['Charts that switch', (Array.isArray(ms.charts) ? ms.charts : []).map((c) => `${CK[c.kind] || 'Chart'} by ${String(c.by)}`)]], (ms.notSwitched || []).length ? [['Not on the page', ms.notSwitched.map(String)]] : [],
        // (SQ15b, L3-S2) the measures left out: their table is not related to the charts' axes
        Array.isArray(ms.leftOut) && ms.leftOut.length ? [['Measures left out', ms.leftOut.map((x) => `${cut(String(x.field), 120)}: ${cut(String(x.why), 300)}`)]] : [],
        [['Title with nothing chosen', String(ms.fallbackTitle || '')], ['Model change', String(ms.modelChange || '')], ['Script file', String(ms.script || '')], ['Before the script is applied', String(ms.beforeApplied || '')], ['Saved selection', String(ms.savedSelection || '')]]) });
    // (0.3.1 FX3b, D-1028-06) the charts whose bars the writer makes thinner, in the page's language (FX5b's said: counts
    // and sizes only, never a category's name or value)
    const bt = d.barThickness && typeof d.barThickness === 'object' && d.barThickness.said && typeof d.barThickness.said === 'object' ? d.barThickness : null;
    if (bt) sections.push({ heading: 'Thinner bars', rows: [[{ en: 'Charts', ar: 'المخططات' }, { en: String(bt.said.en || ''), ar: String(bt.said.ar || '') }]] });
    // (0.3.0 D2) each gallery visual the user asked for: what is written and why (the writer's rule on the fields), and
    // how the preview draws it
    const GN = { combo: 'Combo (line and clustered column)', waterfall: 'Waterfall', smallMultiples: 'Small multiples' };
    const gl = Array.isArray(d.gallery) ? d.gallery : [];
    if (gl.length) sections.push({ heading: 'Visual gallery', rows: gl.map((g) => [`${GN[g.kind] || 'A gallery visual'}${g.title ? `: ${cut(g.title, 80)}` : ''}`, `written as ${g.written === g.kind ? (GN[g.kind] || g.kind).toLowerCase() : String(g.written)}: ${String(g.why || '')}`])
      .concat([['Preview', 'the preview draws a waterfall and small multiples as a column-chart placeholder, a combo as a line-chart placeholder']]) });
    const other = ['pageFilters', 'text', 'subtitles', 'svgColumns', 'svgCards'].filter((k) => p[k] !== undefined && p[k] !== null);
    // (0.3.2 PL1, E1 round 5: an option by its input key) each in plain words
    const MORE = { pageFilters: 'Page filters', text: 'Sentence in the text box', subtitles: 'Chart subtitles', svgColumns: 'Small pictures in table rows', svgCards: 'Small pictures beside KPI cards' };
    if (other.length) sections.push({ heading: 'More', rows: other.map((k) => [MORE[k], val(p[k])]) });
    // (0.3.1 X2) a report in English and Arabic: both halves, as the twin's EN-AR page shows them
    if (d.bilingual && typeof d.bilingual === 'object') languagesSections(d.bilingual, sections, 1);
    // (0.3.1 SQ10, K2-S1) what stays English or unmirrored in its Arabic half, in one line, as the twin's page says it
    const NFb = d.bilingual && d.bilingual.notFullyArabic && typeof d.bilingual.notFullyArabic === 'object' ? d.bilingual.notFullyArabic : null;
    // (FX1) an Arabic page: its Arabic line alone; an English page keeps both lines, as before
    if (NFb && NFb.en) sections.push(T.lang === 'ar' ? { heading: 'Not fully Arabic', rows: [[{ en: 'In short', ar: 'باختصار' }, { en: String(NFb.en), ar: String(NFb.ar || NFb.en) }]] }
      : { heading: 'ليست عربية بالكامل · Not fully Arabic', rows: [['العربية', String(NFb.ar || '')], ['English', String(NFb.en)]] });
    // (0.3.1 SQ10, AF2-S4) a script the plan names that is already there with exactly its content: not among the files written
    if (Array.isArray(d.alreadyThere) && d.alreadyThere.length) sections.push({ heading: `Already there, not written again (${d.alreadyThere.length})`, rows: d.alreadyThere.map((f) => [String(f), 'next to the project, holding exactly this script: named again, not written again']) });
    // (R6, F09 a: the replacements were shown as JSON cut at 600 characters) each replacement and everything it loses
    // (0.3.1 NC2) the lead line first (how many at each confidence, how many are guesses), then each replacement's
    // confidence with its evidence, its losses and its second option
    if (Array.isArray(d.customVisualsShown)) { const lead = d.customVisualsShown.find((x) => x && x.lead), reps = d.customVisualsShown.filter((x) => x && !x.lead);
      sections.push({ heading: `Custom visuals replaced (${reps.length})`, rows: (lead ? [['In short', [String(lead.lead)].concat(lead.levels ? ['high', 'medium', 'low'].map((k) => `${k}: ${String(lead.levels[k] || '')}`) : [])]] : [])
        .concat(reps.map((x) => [String(x.line), (x.confidence ? [`confidence: ${String(x.confidence)}${x.evidence ? ` (${String(x.evidence)})` : ''}`] : [])
          .concat((x.lost || []).length ? (x.lost || []).map((l) => 'loses ' + String(l)) : ['loses nothing it shows'])
          .concat((x.needs || []).map((l) => 'to turn on: ' + String(l)))
          .concat(x.second ? [`second option${x.second.chosen ? ' (chosen; the first is the closer one)' : ''}: ${String(x.second.label || x.second.native)} (${String(x.second.native)}), key "${String(x.second.pick)}": it loses ${(x.second.lost || []).map((l) => String(l).split(/: /)[0]).join('; ')}`].concat((x.second.needs || []).map((l) => 'second option, to turn on: ' + String(l))) : [])])) }); }
    else if (d.customVisuals) sections.push({ heading: 'Custom visuals replaced', rows: [['Replacements', val(d.customVisuals)]] });
    // (J14, the owner's decision of 19 Oct) what the check before writing could not cover, said before the click
    const nc = d.exact && Array.isArray(d.exact.notChecked) ? d.exact.notChecked : [];
    if (nc.length) sections.unshift({ heading: 'Not checked before writing', rows: nc.map((n) => [NOT_CHECKED[n.check] ? NOT_CHECKED[n.check].charAt(0).toUpperCase() + NOT_CHECKED[n.check].slice(1) : 'A check', `not run: ${String(n.why || '')}. The rest of the report was checked (all ${d.exact.pages || 'its'} pages).`]) });
    return Object.assign(T, { sections });
}
  // (0.3, J13 redesign step 2; the laptop's PROOF-rc24 block 2 (b): step 1's page showed the plan's fields, not what was
  // dropped) a redesign's page lists every change (page, visual, from, to), every visual not changed with why, and what
  // is copied as it is
function redesignStep(sc) {
  const { kind, d, sections, val } = sc;
    // (0.3.2 PL1, E1 round 5: a theme change by the theme file's key) each colour the restyle changes, in words
    const THEME_KEYS = { dataColors: 'data colours', foreground: 'text colour', background: 'background colour', tableAccent: 'table accent colour', good: 'colour for good results', neutral: 'colour for neutral results', bad: 'colour for bad results' };
    // (ST1, R4A-S4) a text setting in plain words: "font", "text size", "title font" (the visual's own property names
    // are text-format.mjs's: fontFamily, fontSize, textSize, titleFontFamily, titleFontSize, bold, italic...)
    const plainProp = (p) => { const s = String(p || ''), w = /family/i.test(s) ? 'font' : /size/i.test(s) ? 'text size' : /bold/i.test(s) ? 'bold' : /italic/i.test(s) ? 'italic' : s; return /^title/.test(s) && w !== s ? 'title ' + w : w; };
    const S = d.shown || {}, pages = Array.isArray(S.pages) ? S.pages : [], K = S.keptAsIs || {};
    const at = (b) => (b ? `${b.x}, ${b.y}, ${b.w} x ${b.h}` : '');
    // (0.3.0 T1, T-7: "moves from 40, 40, 700 x 640 to 40, 40, 704 x 640") a change of place or size, in words
    const moved = (a, b) => { if (!a || !b) return null; const dx = b.x - a.x, dy = b.y - a.y, dw = b.w - a.w, dh = b.h - a.h, r = Math.round, out = [];
      if (dx) out.push(`${r(Math.abs(dx))} to the ${dx > 0 ? 'right' : 'left'}`); if (dy) out.push(`${r(Math.abs(dy))} ${dy > 0 ? 'down' : 'up'}`);
      const size = [dw ? `${r(Math.abs(dw))} ${dw > 0 ? 'wider' : 'narrower'}` : null, dh ? `${r(Math.abs(dh))} ${dh > 0 ? 'taller' : 'shorter'}` : null].filter(Boolean);
      return [out.length ? `moves ${out.join(' and ')}` : 'stays in place', size.length ? size.join(' and ') : null].filter(Boolean).join(', ') + ` (now ${r(b.w)} x ${r(b.h)}, its top left corner at ${r(b.x)}, ${r(b.y)})`; };
    // (R6, F08: a visual by its kind, fields and place, never its title text)
    const of = (c) => `${cut(kindSaid(c.type), 60)}${Array.isArray(c.fields) && c.fields.length ? ` of ${c.fields.join(', ')}` : ''}${c.place ? ` at ${c.place}` : ''}`;
    // (0.3.0 D4) a unit on one line: the visuals laid on it, each by its kind and fields, and where it goes with it
    const overlaid = (c) => (Array.isArray(c.overlays) && c.overlays.length ? `with what lies on it, ${c.from || c.overlays.some((o) => o.from) ? 'moved' : 'kept'} with it: ${c.overlays.map((o) => `${cut(o.visual, 60)} (${of(Object.assign({}, o, { place: null }))})${o.from ? ` to ${at(o.to)}` : ''}`).join('; ')}` : null);
    // (0.3.1 CS1) a visual's own text settings removed, each: class, property, from -> the text set's value
    // (0.3.1 R4A, round 4's problem 9: "largeTitle fontFamily Segoe UI -> Segoe UI") in the person's words: the class by
    // what it formats, "set to" for a value the text set changes, "removed" only where the theme's own takes over, and the
    // settings that already show the set's value counted once (their removal changes nothing visible)
    const textOf = (c) => {
      if (!Array.isArray(c.text) || !c.text.length) return null;
      const what = (t) => cut(TEXT_CLASSES[t.class] || 'text', 80), prop = (t) => (/family/i.test(t.property) ? 'font' : /size/i.test(t.property) ? 'size' : /bold/i.test(t.property) ? 'bold' : /italic/i.test(t.property) ? 'italic' : 'setting');
      const theirs = (t) => /^the theme's$/.test(String(t.to)), same = c.text.filter((t) => !theirs(t) && String(t.from) === String(t.to));
      const lines = c.text.filter((t) => !same.includes(t)).map((t) => (theirs(t) ? `${what(t)}: its own ${prop(t)} (${cut(t.from, 40)}) removed, the theme's own shows` : `${what(t)}: ${prop(t)} set to ${cut(t.to, 40)} (was ${cut(t.from, 40)})`));
      if (same.length) lines.push(`${same.length} of its own setting${same.length === 1 ? '' : 's'} already the text set's (${[...new Set(same.map((t) => `${what(t)} ${prop(t)}`))].join(', ')}): now from the theme, nothing changes on screen`);
      return `its text, from the theme: ${lines.join('; ')}`;
    };
    const changes = pages.flatMap((p) => (p.changes || []).map((c) => [`${cut(p.page, 60)}: ${cut(c.visual, 60)} (${of(c)})`,
      [c.from ? moved(c.from, c.to) : null, c.narrower ? cut(c.narrower, 200) : null, c.title && typeof c.title === 'object' ? `its title becomes "${String(c.title.to)}"` : null, textOf(c), overlaid(c)].filter(Boolean).join('; ')]));
    if (S.theme && S.theme.tokens) Object.entries(S.theme.tokens).forEach(([k, v]) => changes.push([`Theme ${cut(S.theme.file, 60)}: ${THEME_KEYS[k] || k}`, Array.isArray(v) ? { swatches: v.map((c) => ['', String(c)]) } : /^#[0-9a-f]{6}$/i.test(String(v)) ? { swatches: [['', String(v)]] } : val(v)]));
    const notChanged = pages.flatMap((p) => (p.why ? [[`${cut(p.page, 60)} (the whole page)`, cut(p.why, 200)]] : []).concat((p.notChanged || []).filter((x) => !(p.why && /tooltip page/.test(x.why))).map((x) => [`${cut(p.page, 60)}: ${cut(x.visual, 60)} (${of(x)})`, [cut(x.why, 200), overlaid(x)].filter(Boolean).join('; ')])));
    const n = (k, one, many) => (K[k] ? [[many[0].toUpperCase() + many.slice(1), `${K[k]} ${K[k] === 1 ? one : many}`]] : []);
    sections.push({ heading: 'Report', rows: [['Original', S.original || ''], ['New report', S.newReport || ''], ['Method', 'a copy of the original, file for file, with only the changes below']].map(([k, v]) => [k, val(v)]) });
    // (0.3.1 CS1) the one text set, before the changes
    if (S.text && Array.isArray(S.text.set)) sections.push({ heading: `Text set (${S.text.mode === 'theme' ? 'the theme\'s own' : 'what most visuals already show'})`, rows: S.text.set.map((x) => [cut(x.what || TEXT_CLASSES[x.class] || 'text', 80), `${cut(x.font, 60)}, ${cut(x.size, 20)}`])
      .concat([['Bold and italic', cut(S.text.boldItalic, 200)], ['Theme', cut(S.text.theme, 300)], ['Settings removed', `${S.text.removed} (each listed under Changes, with its visual)`]], (S.text.kept || []).map((k) => [`${cut(k.page, 60)}: ${cut(k.visual, 60)} ${cut(plainProp(k.property), 30)}`, cut(k.why, 120)]),
        (S.text.untouched || []).map((k) => [`${cut(k.page, 60)}: ${cut(k.visual, 60)} (${cut(kindSaid(k.type), 60)})`, `text untouched: ${cut(k.why, 160)}`]), S.text.themeStyles ? [['The theme\'s own visual styles', cut(S.text.themeStyles, 300)]] : []).map(([k, v]) => [k, val(v)]) });
    sections.push({ heading: `Changes (${changes.length})`, rows: changes });
    sections.push({ heading: `Not changed (${notChanged.length})`, rows: notChanged });
    sections.push({ heading: 'Kept as it is', rows: [].concat(n('pages', 'page', 'pages'), n('bookmarks', 'bookmark', 'bookmarks'), n('buttons', 'button', 'buttons'), n('reportFilters', 'report filter', 'report filters'), n('pageFilters', 'page filter', 'page filters'),
      n('visualFilters', 'visual filter', 'visual filters'), n('slicerSelections', 'slicer selection', 'slicer selections'), n('tooltipLinks', 'tooltip link', 'tooltip links'), n('tooltipPages', 'tooltip page', 'tooltip pages'), n('drillthroughPages', 'drillthrough page', 'drillthrough pages'),
      n('interactions', 'visual interaction', 'visual interactions'), n('groups', 'group', 'groups'), n('customVisuals', 'custom visual', 'custom visuals'), n('phoneLayouts', 'phone layout', 'phone layouts'), n('resources', 'resource file', 'resource files'),
      [['How', 'copied as they are: their contents (filter values, slicer selections, bookmark states) are not read']]) });
    // (0.3.0 T1, T-6: "The redesign writes no format script and no theme file of its own." above a list with a theme JSON
    // and a PNG) the theme and the images listed are the original's, copied (the theme with the changes listed, if any)
    const rFiles = Array.isArray(d.outputs) ? groupFiles(d.outputs, [["Theme (the original's, copied)", THEME_FILE], ["Images (the original's, copied)", /\.(png|jpe?g|gif|svg)$/i]]) : null;
    const themed = S.theme && S.theme.tokens && Object.keys(S.theme.tokens).length;
    return { title: 'Redesign of a report', sections, files: rFiles, kind, lostNote: d.copied ? `Nothing is left out: all ${d.copied} files of the original are copied, with only the changes below (the copy is checked before it is written, and a missing file stops the write). The redesign writes no format script; the theme file and the images listed are the original's, copied${themed ? ', the theme with the changes listed under Changes' : ' as they are'}.` : null };
}
  // (0.3.1 C) the sample project: what it holds (names and counts, never a row), every file grouped; no preview (its
  // report is empty) and no script (its .tmdl files are the model itself)
function sampleStep(sc) {
  const { kind, d, pins, sections, val } = sc;
    const S = d.sample || {}, T = Array.isArray(S.tables) ? S.tables : [], own = pins.create_report || {};
    // (0.3.1 LR1) on the Arabic page each row's name and value in Arabic (SAMPLE_AR; the plan's sampleAr, made by
    // sample-project.mjs from the same facts), the English line under each; a value without its Arabic stays English
    const SA = own.lang === 'ar' && d.sampleAr && typeof d.sampleAr === 'object' ? d.sampleAr : null, TA = SA && Array.isArray(SA.tables) && SA.tables.length === T.length ? SA.tables : null;
    const two = (en, ar) => (SA && typeof ar === 'string' ? { en, ar } : en);
    sections.push({ heading: 'Sample project (made-up data)', rows: [['What it is', S.what, SA && SA.what], ['Made up', S.madeUp, SA && SA.madeUp],
      ['Folder', S.folder ? `${folderSaid(String(S.folder))}: a new folder in ${folderSaid('.')}` : null, S.folder ? `${folderSaid(String(S.folder), true)}: مجلد جديد في ${folderSaid('.', true)}` : null],   // (R4A, T-9: the folder by its name and where it is)
      ['To open', S.project, SA && SA.project], ['Date table', S.dateTable, SA && SA.dateTable], ['Report', S.report, SA && SA.report], ['Relationships', S.relationships != null ? String(S.relationships) : null, SA && SA.relationships], ['The rows', S.rows, SA && SA.rows]]
      .filter((r) => r[1] != null).map(([k, v, ar]) => [two(k, SAMPLE_AR[k]), two(val(v), ar == null ? ar : String(ar))]) });
    sections.push({ heading: `Tables (${T.length})`, rows: T.map((t, i) => [String(t.table), two(`${Number(t.rows)} made-up rows, ${Number(t.columns)} columns${t.measures ? `, ${Number(t.measures)} measures` : ''}`, TA ? String(TA[i]) : null)]) });
    return { title: 'Sample project (made-up data)', sections, files: Array.isArray(d.outputs) ? groupFiles(d.outputs, [['Model (TMDL)', /\.SemanticModel\//i], ['Empty report', /\.Report\//i]]) : null, kind, lang: own.lang === 'ar' ? 'ar' : 'en', titleKey: 'sample' };
}
// (FN1E) the Arabic twin, and the EN-AR copy
function twinStep(sc) {
  const { kind, d, sections } = sc;
    const labels = Object.entries(d.labels || {});
    // (0.3.0 T1, T-7: "Waterfall, right to left: native: ..." on a report with no waterfall) an option the report does not
    // use is left out (the plan's data says how many waterfalls and picture pages it has; an older plan shows them all)
    const uses = (k) => d[k] == null || d[k] > 0;
    // (SQ3, T1-S13: the twin's page is Arabic, its options were English, with (see "About the script")) each option in
    // Arabic (FX1: the Arabic alone on the page, wholly Arabic; the English kept for an English reader of the plan)
    const two = (a, e) => ({ en: e, ar: a });
    sections.push({ heading: 'Options', rows: [[two('الرسوم عبر الزمن', 'Charts over time'), d.timeRightToLeft === false ? two('من اليسار إلى اليمين، كما في الإنجليزية', 'left to right, as in English') : two('من اليمين إلى اليسار، مثل بقية الصفحة', 'right to left, like the rest of the page')],
      [two('أعمدة التقويم العربية', 'Arabic calendar columns'), d.arabicMonth ? two('نعم: يضيفها سكربت إلى جدول التاريخ لديك (انظر «عن السكربت»)', 'yes: a script adds them to your date table (see "About the script")') : two('لا', 'no')]]
      // (0.3.1 MP1) each page drawn on a picture: its picture flipped (its fit) / asked (it may hold words) / kept
      .concat(Array.isArray(d.pictures) ? d.pictures.map((x) => [two(`صفحة على صورة «${String(x.page)}»`, `Page on a picture "${String(x.page)}"`), two(String(x.ar || ''), String(x.en || ''))])
        : uses('picturePages') ? [[two('الصفحات المرسومة على صورة خلفية', 'Pages drawn on a background picture'), d.mirrorPicturePages ? two('معكوسة رغم ذلك (صورتها لا تُعكس)', 'mirrored anyway (their picture is not)') : two('تبقى من اليسار إلى اليمين (لا يمكن عكس الصورة)', 'kept left to right (the picture can\'t be mirrored)')]] : [],
        uses('waterfalls') ? [[two('الشلال من اليمين إلى اليسار', 'Waterfall, right to left'), two(wfRtlSaidAr(d.waterfallRtl), wfRtlSaid(d.waterfallRtl))]] : [],
        // (0.3.1 MX1 C) the matrices the user chose to write flat (matrixAsTable), with what that loses
        Array.isArray(d.matrixAsTable) && d.matrixAsTable.length ? [[two('مصفوفات تُكتب جداول مسطحة', 'Matrices written flat'), two(`${d.matrixAsTable.slice(0, 30).map(String).join('، ')}: جدول بعمود لكل مستوى صفوف، والأسماء على اليمين. يضيع التجميع (+/-) وصفوف المجاميع الفرعية للمجموعات`, `${d.matrixAsTable.slice(0, 30).map(String).join(', ')}: a table with one column per row level, the names at the right. Lost: the +/- grouping and the group subtotal rows`)]] : [],
        d.matrices ? [[two('المصفوفات', 'Matrices'), two('لا يوجد في مصفوفة Power BI إعداد من اليمين إلى اليسار: تبقى رؤوس صفوفها على اليسار وأعمدتها (مثل الأشهر) من اليسار إلى اليمين. تنقلها النسخة العربية إلى مكانها المعكوس وتعكس ترتيب مقاييسها فقط، دون أي تزييف. لقراءتها من اليمين، اعرض الأرقام نفسها في جدول أو مخطط، فتعكسه النسخة العربية؛ أو أبقها كما هي.', String(d.matrices))]] : []) });
    sections.push({ heading: `Arabic texts (${labels.length})`, rows: labels.map(([k, v]) => [d.names && d.names[k] ? (d.namesAr && d.namesAr[k] ? { en: d.names[k], ar: d.namesAr[k] } : d.names[k]) : 'A text of the report', String(v)]) });   // (rc.22, B-139: named, never by internal ids)
    if (Array.isArray(d.terminology) && d.terminology.length) sections.push(termSheet(d.terminology));
    // (0.3.0 D3) every text the twin shows in English, with why, before the click
    // (TB1) a why the plan gives in both languages (a title that changes with the selection) shown in the page's
    if (Array.isArray(d.notTranslated) && d.notTranslated.length) sections.push({ heading: `Shown in English (${d.notTranslated.length}, no Arabic text)`, rows: d.notTranslated.map((x) => [String(x.field), x.whyAr ? { en: String(x.why || ''), ar: String(x.whyAr) } : String(x.why || '')]) });
    // (0.3.1 MX1) each matrix written as a table (its first column at the right), named with why (the plan's preview lists them)
    const AT = d.preview && Array.isArray(d.preview.asTables) ? d.preview.asTables.slice(0, 30) : [];
    if (AT.length) sections.push({ heading: `Matrices written as tables (${AT.length})`, rows: AT.map((x) => [{ en: `Page "${String(x.page)}": ${x.title ? `"${String(x.title)}" ` : ''}(${String(x.visual)})`, ar: `صفحة «${String(x.pageAr || x.page)}»: ${x.titleAr || x.title ? `«${String(x.titleAr || x.title)}» ` : ''}(${String(x.visual)})` },
      { en: 'written as a table so its first column reads on the right: Power BI\'s matrix has no right-to-left setting', ar: 'كُتبت جدولًا ليُقرأ عمودها الأول من اليمين: لا يوجد في مصفوفة Power BI إعداد من اليمين إلى اليسار' }]) });
    // (0.3.2 HM1, B-297: Codex N1-1) each visual the twin adds, by the name it is written under, beside its heatmap
    const AD = Array.isArray(d.added) ? d.added.slice(0, 30) : [];
    if (AD.length) sections.push({ heading: `Visuals the twin adds (${AD.length})`, rows: AD.map((x) => [{ en: `Page "${String(x.page)}": ${String(x.name)}`, ar: `صفحة «${String(x.page)}»: ${String(x.name)}` },
      { en: `a table of the weekday names beside the heatmap ${String(x.beside)}, at its grid's right edge (a new visual; nothing of the report is written over)`, ar: `جدول بأسماء أيام الأسبوع بجانب الخريطة الحرارية ${String(x.beside)}، عند الحافة اليمنى لشبكتها (مرئي جديد؛ لا يُكتب فوق أي شيء من التقرير)` }]) });
    // (0.3.2 VC2, B-306) each visual the twin turns that holds a running or neighbour visual calculation (VC1's
    // orderCalculations), by its safe page/visual name, its functions (only the list's names), VC1's sentence
    const OC = d.orderCalculations && typeof d.orderCalculations === 'object' && Array.isArray(d.orderCalculations.visuals) ? d.orderCalculations : null;
    if (OC && OC.visuals.length) {
      const fnsOf = (f) => ORDER_FUNCTIONS.filter((k) => f && typeof f === 'object' && Number(f[k]) > 0).map((k) => (Number(f[k]) > 1 ? `${k} x${Number(f[k])}` : k)).join(', ');
      const more = Number(OC.notListed) > 0 ? [[{ en: `${Number(OC.notListed)} more`, ar: `${Number(OC.notListed)} أخرى` }, { en: 'not listed here; the plan counts them', ar: 'غير مذكورة هنا؛ تعدّها الخطة' }]] : [];
      sections.push({ heading: `Turned visuals with an order calculation (${Number(OC.count) || OC.visuals.length})`, rows: OC.visuals.slice(0, 30).map((x) => { const f = fnsOf(x && x.functions);
        return [{ en: `Visual "${String(x && x.visual)}"${f ? ` (${f})` : ''}`, ar: `المرئي «${String(x && x.visual)}»${f ? ` (${f})` : ''}` }, { en: ORDER_CALC_SAID.en, ar: ORDER_CALC_SAID.ar }]; }).concat(more) });
    }
    // (0.3.1 K2) what stays English or unmirrored in this report, in one line (Arabic first: the page is Arabic)
    const NF = d.notFullyArabic && typeof d.notFullyArabic === 'object' ? d.notFullyArabic : null;
    if (NF && NF.en) sections.push({ heading: 'Not fully Arabic', rows: [[{ en: 'In short', ar: 'باختصار' }, { en: String(NF.en), ar: String(NF.ar || NF.en) }]] });
    // (0.3.0 X1) one report holding both languages: the copy, every page pair, the language buttons, the slicers in sync
    const LG = d.languages && typeof d.languages === 'object' ? d.languages : null;
    if (LG) languagesSections(LG, sections, 0);
    // (0.3.1 CX2) the twin's and the copy's preview is null only when it failed (twinPreview): said on the page
    return { title: LG ? 'English and Arabic in one report' : 'Arabic twin of a report', sections, ...('preview' in d && d.preview == null ? { previewFailed: 'all' } : {}), previews: d.preview && Array.isArray(d.preview.pages) && d.preview.pages.length ? d.preview : null, files: Array.isArray(d.outputs) ? groupFiles(d.outputs, [['Arabic calendar script', /\.tmdl$/i]]) : null, kind, lang: 'ar', scriptWhat: 'the Arabic calendar columns', titleKey: LG ? 'same' : 'twin' };
}
  // (D6, the laptop proof of rc.2: the theme's page showed name, lang and path) the colours it writes, as swatches with
  // their hex, and the report they come from
function themeColoursStep(sc) {
  const { kind, d, sections } = sc;
  if (kind === 'theme' && d.colours && typeof d.colours === 'object') {
    const C = d.colours, src = d.source && typeof d.source === 'object' ? d.source : null, one = (c) => ({ swatches: [['', String(c)]] });
    const from = !src ? null : src.from === 'visuals' ? `from the colours on the visuals of report "${String(src.report)}"`
      : `from the theme of report "${String(src.report)}" (${String(src.theme)})${src.from === 'theme and visuals' ? ' and the colours on its visuals' : ''}`;
    sections.push({ heading: 'Colours', rows: [from ? ['Where they come from', from] : null, ['Data colours', { swatches: (Array.isArray(C.data) ? C.data : []).map((c, i) => [String(i + 1), String(c)]) }],
      ['Page', one(C.page)], ['Visuals', one(C.visuals)], ['Text', one(C.text)], ['Accent', one(C.accent)], C.mode ? ['Mode', (C.mode === 'dark' ? 'dark' : 'light') + (C.modeAsked === 'dark' || C.modeAsked === 'light' ? (C.modeAsked !== C.mode ? `: the palette's own colours decide; "${C.modeAsked}" was asked and not used` : '') : '')] : null].filter(Boolean) });
  }
}
// (FN1E) the inputs (a theme, the fix scripts, the calendar, another kind): in plain words, as given, the answers; the page
function inputsStep(sc) {
  const { kind, d, pins, sections, val, files } = sc;
  const titles = { theme: 'Theme file', scripts: 'Model fix scripts', calendar: 'Gulf calendar script' };
  const own = Object.values(pins)[0] || {}, shownAnswers = Array.isArray(d.answersShown) ? d.answersShown : null;
  // (0.3.0 T1, T-7: "maxItems: 15 weekStart: sunday") each input in plain words; every input as given, folded below
  const given = Object.entries(own).filter(([k, v]) => v !== undefined && v !== null && !(k === 'answers' && shownAnswers));
  // (T2: arabicColumnsOnly listed the calendar table's name, fiscal year and Ramadan inputs it does not use)
  const used = own.arabicColumnsOnly ? ['path', 'arabicColumnsOnly'] : null;
  // (FX1, the laptop's part 3: the calendar's INPUTS table stayed English on its Arabic page) each input's Arabic beside
  // its English (approval-ar.mjs INPUT_AR, the same keys): an Arabic page shows the Arabic
  const inAr = (k, v) => (INPUT_AR[k] ? { en: INPUT_WORDS[k][1](v, val, own), ar: INPUT_AR[k][1](v, own) } : INPUT_WORDS[k][1](v, val, own));
  sections.push({ heading: 'Inputs', rows: given.filter(([k]) => INPUT_WORDS[k] && (!used || used.includes(k))).map(([k, v]) => [INPUT_AR[k] ? { en: INPUT_WORDS[k][0], ar: INPUT_AR[k][0] } : INPUT_WORDS[k][0], inAr(k, v)]) });
  if (given.length) sections.push({ heading: 'All inputs, as given (raw)', fold: true, raw: true, rows: given.map(([k, v]) => [k, val(v)]) });
  // (R6, F09 f: a long answers list was cut at 600 characters, as hashes) every question with the answer recorded for it
  if (shownAnswers && shownAnswers.length) sections.push({ heading: `Answers to record (${shownAnswers.length})`, rows: shownAnswers.map((x) => [String(x.object || ''), `${x.answer === 'mistake' ? 'a mistake' : 'intended'} (the question: ${String(x.question || '')})`]) });
  // (FX1, P3A's Seen 2: the theme's page stayed English on an Arabic theme plan) a theme plan in Arabic is shown in Arabic
  const calAr = (kind === 'calendar' || kind === 'theme') && own.lang === 'ar';
  return { title: titles[kind] || 'Plan', sections, files: kind === 'theme' && Array.isArray(d.outputs) ? groupFiles(d.outputs, [['Theme file', /\.json$/i]]) : files, kind, lang: calAr ? 'ar' : 'en',
    scriptWhat: kind === 'calendar' ? (own.arabicColumnsOnly ? 'the Arabic calendar columns' : 'the calendar table') : kind === 'scripts' ? 'the fixes listed' : null, titleKey: kind === 'calendar' ? (own.arabicColumnsOnly ? 'columns' : 'calendar') : kind === 'theme' ? 'theme' : null };
}
