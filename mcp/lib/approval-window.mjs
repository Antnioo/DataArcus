// DataArcus's own approval window (A-01 of the outside review of rc.14; the owner's rc.16 test in Claude Desktop: the
// app has no MCP elicitation, so approve_plan answered approvedBy "assistant-reported", the assistant's word for the
// person's go). The owner's decision of 14 Oct: the person approves a plan by a click in a page of their own browser,
// which DataArcus opens on their machine; the assistant's reply approves nothing.
// How it holds: the page is served on 127.0.0.1 only, at a link with a one-time secret that is given to the browser
// and never to the assistant (no tool answer holds it); a click is taken only from that page itself (the Host and Origin
// are checked, so another site or a rebound name can't send it); the page shows what the plan writes, every model name
// as plain text. What it can't do: another program on the person's computer (one that controls their browser or mouse,
// or another tool of the AI app that runs commands or reads the browser's history) could click it too.
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { writesNote, writesNoteAr } from './answers.mjs';   // (R5, F04: the answers file DataArcus wrote is replaced, and said)
import { scriptIs, APPLY_STEPS, SCRIPT_IS_AR, APPLY_STEPS_AR } from './plain-words.mjs';   // (0.3.0 T1, T-4)
import { arOf } from './approval-ar.mjs';   // (0.3.1 FX1: an Arabic plan's page wholly Arabic)
// (0.3.2 SP23) what each page says: approval-disclosure.mjs (pure); this file renders it and alone holds the secret,
// the Host and Origin checks, the click and the window's life
import { cut, HEX, KIND_AR, isScript, kindsLine, plainLine } from './approval-disclosure.mjs';
export { summary, groupFiles, kindsLine, plainLine, promptSummary, promptText, promptBox, PROMPT_SUMMARY_CAP } from './approval-disclosure.mjs';

// (0.3.0 step 1, "Preview before Approve": the planned pages drawn by the shared renderer, the lab page's too)
const Preview = createRequire(import.meta.url)('../../assets/js/page-preview.js');

const windows = new Map();          // planId -> { secret, plan, show, decided: null | 'approve' | 'decline', waiters, opened, seen }
const bySecret = new Map();         // secret -> planId
let server = null, port = 0, starting = null;

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** The program that opens the page: the system's default browser, or DATAARCUS_BROWSER (a program's path, or a JSON
 *  array of a program and its first arguments; the tests use it for a browser of their own). */
function browserCommand(url) {
  const own = process.env.DATAARCUS_BROWSER;
  if (own) {
    let cmd = own, args = [];
    if (/^\s*\[/.test(own)) { const v = JSON.parse(own); if (!Array.isArray(v) || !v.length || v.some((x) => typeof x !== 'string')) throw new Error('DATAARCUS_BROWSER must be a program\'s path or a JSON array of strings'); [cmd, ...args] = v; }
    return [cmd, args.concat(url)];
  }
  // (no shell: the link goes to the program as one argument, never through cmd's parsing of & and ^)
  if (process.platform === 'win32') return ['rundll32.exe', ['url.dll,FileProtocolHandler', url]];
  if (process.platform === 'darwin') return ['open', [url]];
  return ['xdg-open', [url]];
}
function launch(url) {
  return new Promise((resolve) => {
    let child;
    try { const [cmd, args] = browserCommand(url); child = spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true }); }
    catch (e) { resolve(String(e && e.message || e)); return; }
    let done = false; const end = (v) => { if (!done) { done = true; resolve(v); } };
    child.once('error', (e) => end(String(e && e.message || e)));
    child.once('spawn', () => { child.unref(); end(null); });
  });
}

const STYLE = `:root{color-scheme:light dark;--bg:#f4f6fa;--card:#fff;--ink:#14213d;--soft:#5b6478;--line:#dde3ee;--accent:#0f7c90;--accent-ink:#fff;--warn:#8a5a00}
@media (prefers-color-scheme:dark){:root{--bg:#0d1424;--card:#16203a;--ink:#e8edf7;--soft:#a7b1c8;--line:#2a3756;--accent:#33c3d8;--accent-ink:#06202a;--warn:#f0c060}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 "Segoe UI",system-ui,-apple-system,sans-serif}
main{max-width:860px;margin:0 auto;padding:24px 16px 48px}h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:22px 0 8px;color:var(--soft);text-transform:uppercase;letter-spacing:.04em}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}.lead{color:var(--soft);margin:0 0 16px}
table{width:100%;border-collapse:collapse}td{padding:6px 8px;border-top:1px solid var(--line);vertical-align:top;overflow-wrap:anywhere}tr:first-child td{border-top:0}td.k{width:34%;color:var(--soft)}
ul{margin:0;padding-inline-start:20px}li{overflow-wrap:anywhere}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}form{margin:0}
button{font:inherit;font-weight:600;padding:10px 22px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
button.go{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}.note{color:var(--soft);font-size:13px;margin-top:18px}.warn{color:var(--warn)}
.done{font-size:18px;font-weight:600}.sw-i{display:inline-flex;align-items:center;gap:4px;margin:0 10px 4px 0;white-space:nowrap}.sw{display:inline-block;width:14px;height:14px;border-radius:3px;border:1px solid var(--line)}
.preview figure{margin:0 0 14px}.preview svg{display:block;width:100%;height:auto;border-radius:6px}.preview figcaption{color:var(--soft);font-size:13px;margin-top:6px}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media (max-width:700px){.pair{grid-template-columns:1fr}}`;

function page(title, body, ar) {
  return `<!doctype html><html lang="${ar ? 'ar" dir="rtl' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="same-origin"><title>${esc(title)}</title><style>${STYLE}</style></head><body><main>${body}</main></body></html>`;
}
// (rc.22, B-135: the colours were shown as raw JSON) a value { swatches: [[name, hex]] } is drawn as colour swatches, each
// hex checked to be a colour (no other text reaches the style)
const swatches = (list) => list.filter(([, c]) => HEX.test(String(c))).map(([n, c]) => `<span class="sw-i"><span class="sw" style="background:${c}"></span>${esc(n ? n + ' ' : '')}${esc(c)}</span>`).join(' ');
// (0.3.0 T2, the laptop's final run: on the Arabic page `"Overview" (page name)` drew `Overview" (page name)"`) every
// cell takes its direction from its own first letter (dir="auto"), and each quoted name ("..." or «...») is isolated, so
// it keeps its order and the words around it decide the cell's direction
// (FX1) and on an Arabic page every other Latin run (a product's name, a folder's full path in brackets, a tool's name)
// is isolated left to right, so it never takes the Arabic words around it with it (the rule: each Latin run isolated)
const ISO_AR = /(&quot;[^&<]+?&quot;|«[^»<]+»)|((?:[A-Za-z]|\/(?=[A-Za-z]))[\w.:/\\[\]-]*(?: +[A-Za-z0-9#][\w.:/\\[\]-]*)*)/g;
const isoText = (t, ar) => (!ar ? esc(t) : esc(t).replace(ISO_AR, (q, name, latin) => (name ? `<bdi>${name}</bdi>` : /^(?:quot|amp|lt|gt|#39)$/.test(latin) ? q : `<bdi dir="ltr">${latin}</bdi>`)));
// (0.3.1 LR1) a cell { en, ar }: on an Arabic page its Arabic; else the English. (FX1, the laptop's part 3: an Arabic
// page wholly Arabic: no English line under it; a text the page composes takes its Arabic from approval-ar.mjs)
const cell = (x, ar) => { const en = x && typeof x === 'object' && typeof x.en === 'string' ? x.en : x, a = ar ? arOf(x) : null; return a != null ? isoText(a, true) : isoText(en, ar); };
// (FX1) the raw inputs as given: code, left to right
const code = (x) => `<bdi dir="ltr">${esc(x)}</bdi>`;
const rows = (list, ar, raw) => `<div class="card"><table>${list.map(([k, v]) => raw ? `<tr><td class="k">${code(k)}</td><td>${code(v)}</td></tr>` : `<tr><td class="k" dir="auto">${cell(k, ar)}</td><td dir="auto">${v && v.swatches ? swatches(v.swatches) : Array.isArray(v) ? `<ul>${v.map((x) => `<li dir="auto">${cell(x, ar)}</li>`).join('')}</ul>` : cell(v, ar)}</td></tr>`).join('')}</table></div>`;

// (0.3.1 V1) the most pages a plan's preview draws on its approval page (for the EN-AR copy: page pairs); the rest are
// counted under the pictures. Chosen, not measured: 12 pairs keep the page well under its 2 MB (C-3)
export const PREVIEW_PAGES_MAX = 12;
// (0.3.0 T1, the simulated beta testers' T-5) the page's own words, in Arabic for an Arabic plan (a report in Arabic,
// a twin, the EN-AR copy); file paths, field names and plan ids stay as they are, isolated left to right (J18)
const WORDS = {
  en: { ask: 'Approve: ', lead: 'DataArcus asks before it writes anything. Nothing has been written yet. Check the plan, then approve it or not.', approve: 'Approve', notNow: 'Not now',
    preview: 'What the report will look like', previewNote: 'A preview drawn from the plan: where each visual goes, its type and its title. The grey shapes are placeholders, not your data: DataArcus reads the files on your computer to check them, and never returns data values to Claude.',
    page: 'Page', enPage: 'English page', arPage: 'Arabic page', toCheck: 'to check', previewFailed: { all: 'The pages could not be drawn here: the preview failed on this plan. Every page is listed in the plan above, and what is written does not depend on the preview.', arabic: 'The Arabic pages could not be drawn here: the preview failed on them, so only the English pages are drawn. Every page is listed in the plan above, and what is written does not depend on the preview.' }, notDrawn: (n, pairs) => `${n} more ${pairs ? 'page pairs' : 'pages'} not drawn here (the preview draws at most ${PREVIEW_PAGES_MAX}); the plan above lists every page.`, checked: 'Checked before writing', worth: 'Worth a look', checkNote: 'The measured rules of what Power BI Desktop draws and the layout check, run on the planned pages (structure only, never data). The report is checked again when it is written.',
    files: 'Files that will be written', counts: 'The files, counted by kind', yours: 'The files you asked for:', all: (n) => `All ${n} file${n === 1 ? '' : 's'}: the full list, by kind`, about: 'About the script',
    roles: { report: 'the report: open it in Power BI Desktop', script: 'the script: see "About the script" below', theme: 'the theme file: in Power BI Desktop, View > Themes > Browse for themes' },
    plan: (id) => `Plan ${id}. Only a click here approves it: what is typed in the chat does not. Approve only a plan you asked for.` },
  ar: { ask: 'موافقة: ', lead: 'يطلب DataArcus موافقتك قبل أن يكتب أي شيء. لم يُكتب أي شيء بعد. راجع الخطة، ثم وافق عليها أو لا.', approve: 'موافقة', notNow: 'ليس الآن',
    preview: 'كيف سيبدو التقرير', previewNote: 'معاينة مرسومة من الخطة: مكان كل مرئي ونوعه وعنوانه. الأشكال الرمادية عناصر نائبة وليست بياناتك: يقرأ DataArcus الملفات على جهازك ليفحصها، ولا يرسل أي قيمة من بياناتك إلى Claude أبدًا.',
    page: 'الصفحة', enPage: 'الصفحة الإنجليزية', arPage: 'الصفحة العربية', toCheck: 'للفحص', previewFailed: { all: 'تعذّر رسم الصفحات هنا: فشلت المعاينة في هذه الخطة. كل الصفحات مذكورة في الخطة أعلاه، وما سيُكتب لا يتوقف على المعاينة.', arabic: 'تعذّر رسم الصفحات العربية هنا: فشلت المعاينة فيها، فرُسمت الصفحات الإنجليزية وحدها. كل الصفحات مذكورة في الخطة أعلاه، وما سيُكتب لا يتوقف على المعاينة.' }, notDrawn: (n, pairs) => `لم تُرسم هنا ${n} ${pairs ? 'من أزواج الصفحات' : 'من الصفحات'} أخرى (ترسم المعاينة ${PREVIEW_PAGES_MAX} على الأكثر)؛ الخطة تذكر كل الصفحات.`, checked: 'فُحص قبل الكتابة', worth: 'للمراجعة', checkNote: 'القواعد المقيسة لما يرسمه Power BI Desktop وفحص التخطيط، على الصفحات المخطط لها (البنية فقط، دون أي بيانات). ويُفحص التقرير مرة أخرى عند كتابته.',
    files: 'الملفات التي ستُكتب', counts: 'الملفات معدودة حسب النوع', yours: 'الملفات التي طلبتها:', all: (n) => `جميع الملفات (${n}): القائمة كاملة، حسب النوع`, about: 'عن السكربت',
    roles: { report: 'التقرير: افتحه في Power BI Desktop', script: 'السكربت: انظر «عن السكربت» أدناه', theme: 'ملف السمة: في Power BI Desktop اختر View ثم Themes ثم Browse for themes' },
    // (T2: the page's title stayed English on an Arabic page) the titles per plan kind
    titles: { theme: 'ملف سمة', report: 'تقرير', twin: 'النسخة العربية من تقرير', same: 'تقرير واحد بالإنجليزية والعربية', calendar: 'سكربت تقويم الخليج', sample: 'مشروع المثال (بيانات تجريبية)', columns: 'سكربت أعمدة التقويم العربية' },
    plan: (id) => `الخطة <bdi dir="ltr">${esc(id)}</bdi>. لا يوافق عليها إلا نقرة هنا: ما يُكتب في المحادثة لا يوافق عليها. لا توافق إلا على خطة طلبتها.` }
};
// (FX1: an Arabic page wholly Arabic) the kind's Arabic only
const kindLabel = (label, ar) => (ar && KIND_AR[label] ? KIND_AR[label] : label);
const iso = (t) => `<bdi dir="ltr">${esc(t)}</bdi>`;
// the files the person asked for, named on top: the project file (the report), each script, the theme file
const mainFiles = (paths, kind) => (paths || []).map(String).filter((f) => /\.pbip$/i.test(f) || isScript(f) || (kind === 'theme' && /\.json$/i.test(f)))
  .map((f) => [f, /\.pbip$/i.test(f) ? 'report' : isScript(f) ? 'script' : 'theme']);
const filesHtml = (groups, kind, ar) => {
  if (!groups || !groups.length) return '';
  const W = WORDS[ar ? 'ar' : 'en'], all = [].concat(...groups.map((g) => g.paths)), n = all.length, main = mainFiles(all, kind);
  return `${main.length ? `<p>${esc(W.yours)}</p><ul>${main.map(([f, r]) => `<li>${iso(f.split('/').pop())}: ${esc(W.roles[r])}</li>`).join('')}</ul>` : ''}`
    + `<details><summary>${esc(W.all(n))}</summary><ul>${groups.map((g) => `<li><details><summary>${esc(kindLabel(g.label, ar))} (${g.paths.length})</summary><ul>${g.paths.map((f) => `<li>${iso(f)}</li>`).join('')}</ul></details></li>`).join('')}</ul></details>`;
};
// (T-4) what a script is and the 3 steps, where the person decides
const scriptHtml = (s, writes, ar) => {
  const any = (s.files || []).some((g) => g.paths.some(isScript)) || (writes || []).some((x) => /\.tmdl\b/i.test(String(x)));
  if (!any) return '';
  const W = WORDS[ar ? 'ar' : 'en'];
  return `<h2>${esc(W.about)}</h2><div class="card"><p>${esc(ar ? SCRIPT_IS_AR : scriptIs(s.scriptWhat))}</p><ol>${(ar ? APPLY_STEPS_AR : APPLY_STEPS).map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>`;
};


// (T-5) a section's heading in Arabic, where the page knows it (the rest of the heading, a count, stays)
const HEAD_AR = [['Report', 'التقرير'], ['Layout', 'التخطيط'], ['Fields', 'الحقول'], ['Pages', 'الصفحات'], ['Names shown in the report', 'الأسماء الظاهرة في التقرير'], ['Look and options', 'المظهر والخيارات'], ['Options', 'الخيارات'],
  ['Arabic texts', 'النصوص العربية'], ['Terminology sheet: English | Arabic', 'ورقة المصطلحات: الإنجليزية | العربية'], ['Shown in English', 'تظهر بالإنجليزية'], ['One report, English and Arabic', 'تقرير واحد بالإنجليزية والعربية'],
  ['Page pairs', 'أزواج الصفحات'], ['Language buttons', 'أزرار اللغة'], ['Slicers kept in sync', 'المقسمات المتزامنة'], ['Inputs', 'المدخلات'], ['Dates and seasonal scope', 'التواريخ والنطاق الموسمي'], ['Not checked before writing', 'لم يُفحص قبل الكتابة'],
  ['All inputs, as given (raw)', 'كل المدخلات كما أُعطيت'], ['Colours', 'الألوان'], ['Sample project (made-up data)', 'مشروع المثال (بيانات تجريبية)'], ['Tables', 'الجداول'], ['DAX function library', 'مكتبة دوال DAX'],
  // (SQ3, T1-S9) the report's other headings an Arabic page shows
  ['Flip cards', 'البطاقات القابلة للقلب'], ['Status icons', 'أيقونات الحالة'], ['Waterfalls, right to left', 'الشلالات من اليمين إلى اليسار'], ['Metric switcher', 'مبدّل المقاييس'], ['Thinner bars', 'أشرطة أرفع'], ['Visual gallery', 'معرض المرئيات'],
  ['Custom visuals replaced', 'المرئيات المخصصة المستبدلة'],
  // (FX1) the rest an Arabic page shows
  ['Not fully Arabic', 'ليست عربية بالكامل'], ['Matrices written as tables', 'المصفوفات المكتوبة جداول'], ['Visuals the twin adds', 'مرئيات تضيفها النسخة العربية'], ['Turned visuals with an order calculation', 'مرئيات معكوسة فيها حساب يعتمد على الترتيب'], ['More', 'المزيد'], ['Already there, not written again', 'موجود من قبل، لا يُكتب مرة أخرى'], ['Answers to record', 'الإجابات التي ستُسجَّل']];
// (SQ3, T1-S9: «تظهر بالإنجليزية · Shown in English (21, no Arabic text)» kept the count's words English only) a count
// with words takes its Arabic words in the Arabic half; a bare count, or words not listed here, stays in the English half
const COUNT_AR = [[/^(\d+), no Arabic text$/, (n) => `${n}، دون نص عربي`], [/^(\d+), no Arabic name$/, (n) => `${n}، دون اسم عربي`],
  [/^(\d+) functions?, (\d+) measures?$/, (f, m) => `الدوال: ${f}، المقاييس: ${m}`]];
// (FX1, the laptop's part 3: an Arabic page wholly Arabic) the Arabic heading alone, its count with it
const headingOf = (h, ar) => {
  if (!ar) return h;
  const x = HEAD_AR.find(([en]) => h === en || h.startsWith(en + ' (')); if (!x) return h;
  const rest = h.length > x[0].length ? h.slice(x[0].length + 2, -1) : '', c = rest && COUNT_AR.map(([re, f]) => { const m = re.exec(rest); return m ? f(...m.slice(1)) : null; }).find(Boolean);
  return `${x[1]}${c ? ` (${c})` : rest && /^\d+$/.test(rest) ? ` (${rest})` : ''}`;
};

function askPage(w) {
  const s = w.show, ar = s.lang === 'ar', W = WORDS[ar ? 'ar' : 'en'];
  // (T-7: the raw inputs folded) a section with fold is shown closed
  const sections = s.sections.filter((x) => x.rows.length).map((x) => (x.fold ? `<details><summary>${esc(headingOf(x.heading, ar))}</summary>${rows(x.rows, ar, x.raw)}</details>` : `<h2>${esc(headingOf(x.heading, ar))}</h2>${rows(x.rows, ar, x.raw)}`)).join('');
  // (the pictures: SVG markup from the shared renderer, which escapes every name in it; drawn from the plan, never a value)
  // (0.3.1 V1) the twin's pages too, and the copy's as pairs (its English page beside its Arabic page, one above the other
  // on a narrow window); at most PREVIEW_PAGES_MAX pages (pairs) drawn, the rest counted
  // (SQ3, V1-S3: the "معاينة" tag on the copy's English pages) a pair's English page is drawn in English
  const fig = (p, label, lang) => {
    const fl = Preview.check(p).concat(p.flags || []).filter((f, k, all) => all.findIndex((g) => g.i === f.i && g.kind === f.kind) === k);
    return `<figure>${Preview.render(p, { lang: lang || s.previews.lang, width: 800 })}<figcaption dir="auto">${esc(label)}: ${ar ? `«<bdi>${esc(cut(p.name, 80))}</bdi>»` : esc(cut(p.name, 80))}${fl.length ? ` <span class="warn">(${fl.length} ${esc(W.toCheck)}: ${esc([...new Set(fl.map((f) => (Preview.WORDS[ar && Preview.WORDS.ar ? 'ar' : 'en'] || Preview.WORDS.en)[f.kind]))].join(', '))})</span>` : ''}</figcaption></figure>`; };
  const PP = s.previews && Array.isArray(s.previews.pages) ? s.previews.pages : [], PR = s.previews && Array.isArray(s.previews.pairs) ? s.previews.pairs.filter((x) => Array.isArray(x) && PP[x[0]] && PP[x[1]]) : null;
  const drawn = PR ? PR.slice(0, PREVIEW_PAGES_MAX).map(([e, a], i) => `<div class="pair">${fig(PP[e], `${W.enPage} ${i + 1}`, 'en')}${fig(PP[a], `${W.arPage} ${i + 1}`)}</div>`).join('')
    : PP.slice(0, PREVIEW_PAGES_MAX).map((p, i) => fig(p, `${W.page} ${i + 1}`)).join(''), left = (PR || PP).length - PREVIEW_PAGES_MAX;
  // (0.3.1 CX2, Codex's F06) a preview that failed is said, never a page that silently shows no pictures
  const failed = s.previewFailed && W.previewFailed[s.previewFailed] ? `<p class="warn">${esc(W.previewFailed[s.previewFailed])}</p>` : '';
  const pv = PP.length ? `<h2>${esc(W.preview)}</h2><div class="card preview">${failed}${drawn}${left > 0 ? `<p class="note">${esc(W.notDrawn(left, !!PR))}</p>` : ''}<p class="note">${esc(W.previewNote)}</p></div>`
    : failed ? `<h2>${esc(W.preview)}</h2><div class="card preview">${failed}</div>` : '';
  // (0.3.0 step 2: the check of the planned pages, before Approve: what Power BI Desktop would show; every text escaped)
  // (T1, T-3: "3 more worth a look" with no list) each item worth a look, one plain line
  const ck = s.previews && s.previews.check, wl = ck && Array.isArray(ck.worthALookItems) ? ck.worthALookItems : [];
  const ckHtml = ck ? `<h2>${esc(W.checked)}</h2><div class="card"><p class="${ck.desktop ? 'warn' : ''}"><strong>${esc(ck.summary)}</strong></p>${ck.problems && ck.problems.length ? `<ul>${ck.problems.map((f) => `<li dir="auto">${esc(f.page ? `${W.page} ${f.page}: ` : '')}${esc(f.visual || '')}${f.visual ? ': ' : ''}${esc(f.what)}. <span class="note">${esc(f.fix)}</span></li>`).join('')}</ul>` : ''}${wl.length ? `<p>${esc(W.worth)}:</p><ul>${wl.map((x) => `<li dir="auto">${esc(x)}</li>`).join('')}</ul>` : ''}<p class="note">${esc(W.checkNote)}</p></div>` : '';
  const arTitle = ar && s.titleKey && W.titles[s.titleKey] ? W.titles[s.titleKey] : null;
  // (SQ3, T1-S6: an Arabic page listed the writes in English) each write in Arabic (the plan's writesAr, made by its tool
  // from the same facts), the plan's English line under it; a writesAr that is not one line per write is not shown
  const named = (x) => (s.name ? String(x).split('<name>').join(s.name) : String(x));
  const WA = ar && Array.isArray(s.writesAr) && s.writesAr.length === w.plan.writes.length ? s.writesAr : null;
  // (FX1, the laptop's part 3: "each Arabic file line is followed by its English copy") the Arabic line alone
  const writesHtml = w.plan.writes.map((x, i) => (WA ? `<li dir="auto">${isoText(named(WA[i]), true)}</li>` : `<li dir="auto">${esc(named(x))}</li>`)).join('');
  // (0.3.1 R4A) the first line: what is new and where; the counts by kind folded under it
  const allPaths = [].concat(...(s.files || []).map((g) => g.paths || [])), first0 = plainLine(allPaths, s.kind, ar, s.outputsAt), counts0 = kindsLine(allPaths, s.kind, ar);
  const firstHtml = first0 ? `<p class="first" dir="auto"><strong>${isoText(first0, ar)}</strong></p>${counts0 ? `<details><summary>${esc(W.counts)}</summary><p dir="auto">${esc(counts0)}</p></details>` : ''}` : '';
  const h1 = arTitle ? `${esc(arTitle)}${s.name ? ` «<bdi>${esc(cut(s.name, 80))}</bdi>»` : ''}` : esc(s.title);
  return page(W.ask + (arTitle ? `${arTitle}${s.name ? ` «${cut(s.name, 80)}»` : ''}` : s.title), `<h1 dir="auto">${h1}</h1>${firstHtml}${s.first ? `<h2>${esc(s.first.heading)}</h2><div class="card">${s.first.text.map((t) => `<p class="warn" dir="auto"><strong>${esc(t)}</strong></p>`).join('')}</div>` : ''}<p class="lead">${esc(W.lead)}</p>
${pv}${ckHtml}<h2 id="files">${esc(W.files)}</h2><div class="card"><ul>${writesHtml}</ul>${s.lostNote ? `<p><strong>${esc(s.lostNote)}</strong></p>` : ''}${filesHtml(s.files, s.kind, ar)}<p class="note">${esc(ar ? writesNoteAr(w.plan.writes) : writesNote(w.plan.writes))}</p></div>
${scriptHtml(s, w.plan.writes, ar)}${sections}
<div class="actions"><form method="post"><input type="hidden" name="decision" value="approve"><button class="go" type="submit">${esc(W.approve)}</button></form>
<form method="post"><input type="hidden" name="decision" value="decline"><button type="submit">${esc(W.notNow)}</button></form></div>
<p class="note">${ar ? W.plan(w.plan.id) : esc(W.plan(w.plan.id))}</p>`, ar);
}
const donePage = (w) => (w.show && w.show.lang === 'ar' ? page(w.decided === 'approve' ? 'تمت الموافقة' : 'لم تتم الموافقة', w.decided === 'approve'
  ? `<p class="done">تمت الموافقة.</p><p>ارجع إلى Claude: يمكنه الآن كتابة ملفات الخطة ${iso(w.plan.id)}. يمكنك إغلاق هذه الصفحة.</p>`
  : `<p class="done">لم تتم الموافقة.</p><p>لن يُكتب أي شيء للخطة ${iso(w.plan.id)}. أخبر Claude بما تريد تغييره. يمكنك إغلاق هذه الصفحة.</p>`, true)
  : page(w.decided === 'approve' ? 'Approved' : 'Not approved', w.decided === 'approve'
  ? `<p class="done">Approved.</p><p>Go back to Claude: it can now write the files of plan ${esc(w.plan.id)}. You can close this tab.</p>`
  : `<p class="done">Not approved.</p><p>Nothing will be written for plan ${esc(w.plan.id)}. Tell Claude what to change. You can close this tab.</p>`));
const gonePage = () => page('Not available', '<p class="done">This approval link is no longer valid.</p><p>It was used, or its plan expired or was made in another session of DataArcus. Ask Claude to make the plan again.</p>');

function headers(res, code, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin',
    // (0.3.1 GD2: the preview draws a glass page on its soft picture, inline in the page as a PNG data URL) img-src data:
    // only: no image is ever fetched, from anywhere
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" });
}

function onRequest(req, res, decide) {
  const here = `127.0.0.1:${port}`;
  // (DNS rebinding: a page of another name that resolves to 127.0.0.1 sends its own Host)
  if (req.headers.host !== here) { headers(res, 421, 'text/plain; charset=utf-8'); res.end('Wrong host'); return; }
  const m = /^\/approve\/([A-Za-z0-9_-]{20,64})$/.exec((req.url || '').split('?')[0]);
  const id = m && bySecret.get(m[1]), w = id && windows.get(id);
  if (!w || (w.expires && Date.now() > w.expires)) { headers(res, 404); res.end(gonePage()); return; }
  if (req.method === 'GET') { w.seen = true; headers(res, 200); res.end(w.decided ? donePage(w) : askPage(w)); return; }
  if (req.method !== 'POST') { headers(res, 405, 'text/plain; charset=utf-8'); res.end('Method not allowed'); return; }
  // (a click comes only from the page itself: its Origin, or, when a browser sends none or "null", Sec-Fetch-Site
  // same-origin, which a web page can't set. The referrer policy is same-origin, not no-referrer: with no-referrer
  // Chromium sends Origin "null" on the form's POST, found by a real click in Chromium, 14 Oct)
  const origin = req.headers.origin, site = req.headers['sec-fetch-site'];
  if (!(origin === 'http://' + here || ((!origin || origin === 'null') && site === 'same-origin'))) { headers(res, 403, 'text/plain; charset=utf-8'); res.end('Refused: the click must come from the DataArcus page itself.'); return; }
  let body = '';
  req.setEncoding('utf8');
  req.on('data', (c) => { body += c; if (body.length > 1000) req.destroy(); });
  req.on('end', () => {
    const d = new URLSearchParams(body).get('decision');
    if (!w.decided && (d === 'approve' || d === 'decline')) decide(w, d);
    headers(res, w.decided ? 200 : 400); res.end(w.decided ? donePage(w) : gonePage());
  });
}

async function listen(decide) {
  if (server) return;
  if (!starting) starting = new Promise((resolve, reject) => {
    const s = http.createServer((req, res) => { try { onRequest(req, res, decide); } catch (e) { try { headers(res, 500, 'text/plain; charset=utf-8'); res.end('Error'); } catch (x) { /* closed */ } } });
    s.once('error', (e) => { starting = null; reject(e); });
    s.listen(0, '127.0.0.1', () => { server = s; port = s.address().port; s.unref(); resolve(); });
  });
  await starting;
}

/** Opens (or, with reopen, opens again) the approval window of a plan. plan: { id, kind, writes }; show: { title,
 *  sections: [{ heading, rows: [[label, value | [values]]] }] }; expires: when the plan expires (ms); onDecide(id,
 *  decision): called once, on the click. Returns { opened: true } or { opened: false, why }. */
export async function open(plan, show, expires, onDecide, reopen) {
  await listen((w, d) => { w.decided = d; try { onDecide(w.plan.id, d); } catch (e) { w.decided = null; return; } w.waiters.splice(0).forEach((f) => f(d)); });
  let w = windows.get(plan.id);
  if (w && w.decided) return { opened: false, why: 'decided' };
  if (!w) {
    const secret = crypto.randomBytes(24).toString('base64url');
    w = { secret, plan: { id: plan.id, kind: plan.kind, writes: plan.writes.slice() }, show, expires, decided: null, waiters: [], opened: false, seen: false };
    windows.set(plan.id, w); bySecret.set(secret, plan.id);
  } else if (w.opened && !reopen) return { opened: true, again: false };
  const why = await launch(`http://127.0.0.1:${port}/approve/${w.secret}`);
  if (why) return { opened: false, why };
  w.opened = true;
  return { opened: true, again: !!reopen };
}

/** Waits up to ms for the click on a plan's window: 'approve', 'decline', or null (no click yet). */
export function wait(id, ms) {
  const w = windows.get(id);
  if (!w) return Promise.resolve(null);
  if (w.decided) return Promise.resolve(w.decided);
  return new Promise((resolve) => {
    const f = (d) => { clearTimeout(t); resolve(d); };
    const t = setTimeout(() => { const i = w.waiters.indexOf(f); if (i >= 0) w.waiters.splice(i, 1); resolve(null); }, Math.max(0, ms));
    w.waiters.push(f);
  });
}

/** What the window of a plan knows: null (none), or { opened, seen, decided }. */
export function state(id) { const w = windows.get(id); return w ? { opened: w.opened, seen: w.seen, decided: w.decided } : null; }

/** Forgets a plan's window (its link answers "no longer valid" from then on). */
export function close(id) { const w = windows.get(id); if (w) { bySecret.delete(w.secret); windows.delete(id); w.waiters.splice(0).forEach((f) => f(null)); } }

/** The approval page of a plan as its window serves it before the click (plan: { id, kind, writes }; show: summary()). */
export const approvalHtml = (plan, show) => askPage({ plan, show });
