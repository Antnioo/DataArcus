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
import { E } from './design.mjs';             // (D6: the written colour's own contrast, by the engine's rule)
import { BEFORE_APPLIED as FLIP_BEFORE } from './flip-cards.mjs';   // (F1: what a flip card shows before its script)
import { scriptIs, APPLY_STEPS, SCRIPT_IS_AR, APPLY_STEPS_AR } from './plain-words.mjs';   // (0.3.0 T1, T-4)

// (0.3.0 step 1, "Preview before Approve": the planned pages drawn by the shared renderer, the lab page's too)
const Preview = createRequire(import.meta.url)('../../assets/js/page-preview.js');
// (D7) a right-to-left waterfall's switch, in the person's words
const Gallery = createRequire(import.meta.url)('../../assets/js/visual-gallery.js');
const wfRtlSaid = (v) => (Gallery.waterfallRtlOf(v) === 'native' ? `native: ${Gallery.WF_WHAT.native} (Power BI's own waterfall, as in English)` : 'mirror: a stacked column chart drawn as a waterfall, read from the right; no Total column, no legend, the base shown in the tooltip');

const windows = new Map();          // planId -> { secret, plan, show, decided: null | 'approve' | 'decline', waiters, opened, seen }
const bySecret = new Map();         // secret -> planId
let server = null, port = 0, starting = null;

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cut = (s, n) => { const t = String(s); return t.length > n ? t.slice(0, n) + '…' : t; };

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
const HEX = /^#[0-9a-f]{6}$/i;
const swatches = (list) => list.filter(([, c]) => HEX.test(String(c))).map(([n, c]) => `<span class="sw-i"><span class="sw" style="background:${c}"></span>${esc(n ? n + ' ' : '')}${esc(c)}</span>`).join(' ');
// (0.3.0 T2, the laptop's final run: on the Arabic page `"Overview" (page name)` drew `Overview" (page name)"`) every
// cell takes its direction from its own first letter (dir="auto"), and each quoted name ("..." or «...») is isolated, so
// it keeps its order and the words around it decide the cell's direction
const isoText = (t, ar) => (!ar ? esc(t) : esc(t).replace(/&quot;[^&<]+?&quot;|«[^»<]+»/g, (q) => `<bdi>${q}</bdi>`));
// (0.3.1 LR1) a cell { en, ar }: on an Arabic page its Arabic, the English line under it (as the writes are); else the English
const cell = (x, ar) => (x && typeof x === 'object' && typeof x.en === 'string' ? (ar && typeof x.ar === 'string' ? `${isoText(x.ar, true)}<br><span class="note" dir="ltr">${esc(x.en)}</span>` : isoText(x.en, ar)) : isoText(x, ar));
const rows = (list, ar) => `<div class="card"><table>${list.map(([k, v]) => `<tr><td class="k" dir="auto">${cell(k, ar)}</td><td dir="auto">${v && v.swatches ? swatches(v.swatches) : Array.isArray(v) ? `<ul>${v.map((x) => `<li dir="auto">${cell(x, ar)}</li>`).join('')}</ul>` : cell(v, ar)}</td></tr>`).join('')}</table></div>`;

// (R6, the outside audit of 19 Oct, F09 c: the page named the report, not every file) every file a plan writes, by kind,
// counted, each path folded under its group (no script: <details> opens without one)
// (SQ3, D6-S3: the twin's copy of Power BI's base theme fell in "Report settings") a theme file: the report's own
// (RegisteredResources) or the base theme Power BI keeps beside it (SharedResources/BaseThemes); one pattern for the
// groups, the redesign's copied theme and the count in words
const THEME_FILE = /(?:RegisteredResources\/[^/]+|SharedResources\/BaseThemes\/[^/]+)\.json$/i;
const GROUPS = [['Bookmarks', /(^|\/)bookmarks\//], ['Pages', /\/page\.json$/], ['Visuals', /\/visual\.json$/], ['Phone layouts', /\/mobile\.json$/], ['Theme', THEME_FILE],
  ['Images', /\.(png|jpe?g|gif|svg)$/i], ['Custom visual packages', /(^|\/)CustomVisuals\//], ['Flip cards script', / - flip cards(?: \d+)?\.tmdl$/i], ['Format script', /\.tmdl$/i], ['Project file', /\.pbip$/i], ['Report settings', /./]];
// (0.3.0 A2: the flip cards' script was listed as a "Format script", L4)
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
// (0.3.1 V1) the most pages a plan's preview draws on its approval page (for the EN-AR copy: page pairs); the rest are
// counted under the pictures. Chosen, not measured: 12 pairs keep the page well under its 2 MB (C-3)
export const PREVIEW_PAGES_MAX = 12;
export function promptSummary(kind, data) {
  const d = data || {}, groups = summary(kind, d).files || [], lines = [];
  // (0.3.1 L6) the compatibility step first in the app's prompt too
  if (kind === 'report' && d.daxFunctions && d.daxFunctions.compatibility && d.daxFunctions.compatibility.raises) lines.push('First: applying the DAX functions script raises the model\'s compatibility level to 1702; it cannot be undone.');
  // (SQ3, A2-S9: the page said what the check before writing could not cover, the app's prompt did not) each check not
  // run, by name, with its why cut to fit (a quarter of the cap at most)
  const nc = kind === 'report' && d.exact && Array.isArray(d.exact.notChecked) ? d.exact.notChecked : [];
  if (nc.length) lines.push(cut(`Not checked before writing: ${nc.map((x) => `${NOT_CHECKED[x.check] || 'a check'} (not run: ${String(x.why || '')})`).join('; ')}`, PROMPT_SUMMARY_CAP / 4 - 1) + '.');
  if (groups.length) {
    const n = groups.reduce((a, g) => a + g.paths.length, 0), parts = groups.map((g) => `${g.label} (${g.paths.length})`);
    let line = `${n} file${n === 1 ? '' : 's'}: `, k = 0;
    while (k < parts.length && line.length + parts[k].length + 40 <= PROMPT_SUMMARY_CAP / 2) { line += (k ? ', ' : '') + parts[k]; k++; }
    if (k < parts.length) line += `${k ? ', ' : ''}and ${parts.length - k} more group${parts.length - k === 1 ? '' : 's'}`;
    lines.push(line + '.');
  }
  const cc = kind === 'report' && d.colours && Array.isArray(d.colours.changed) ? d.colours.changed.filter((c) => HEX.test(String(c.from)) && HEX.test(String(c.to))) : [];
  const card = d.colours && HEX.test(String(d.colours.card)) ? ` against ${d.colours.card}` : '';
  cc.forEach((c) => { const own = d.colours && HEX.test(String(d.colours.card)) ? `; the written colour's own ${E.contrast(String(c.to), String(d.colours.card)).toFixed(2)}:1` : '';
    // (0.3.0 A2: the contrast said after the written colour was the approved one's)
    const l = `Colour: approved colour ${c.from} -> written colour ${c.to} (the approved colour's contrast ${Number(c.contrast) || '?'}:1${card}, needs 3:1${own}).`; if (lines.join('\n').length + l.length + 1 <= PROMPT_SUMMARY_CAP) lines.push(l); });
  return lines.join('\n');
}
// (0.3.0 T1, the simulated beta testers' T-5) the page's own words, in Arabic for an Arabic plan (a report in Arabic,
// a twin, the EN-AR copy); file paths, field names and plan ids stay as they are, isolated left to right (J18)
const WORDS = {
  en: { ask: 'Approve: ', lead: 'DataArcus asks before it writes anything. Nothing has been written yet. Check the plan, then approve it or not.', approve: 'Approve', notNow: 'Not now',
    preview: 'What the report will look like', previewNote: 'A preview drawn from the plan: where each visual goes, its type and its title. The grey shapes are placeholders, not your data: DataArcus reads the files on your computer to check them, and never returns data values to Claude.',
    page: 'Page', enPage: 'English page', arPage: 'Arabic page', toCheck: 'to check', notDrawn: (n, pairs) => `${n} more ${pairs ? 'page pairs' : 'pages'} not drawn here (the preview draws at most ${PREVIEW_PAGES_MAX}); the plan above lists every page.`, checked: 'Checked before writing', worth: 'Worth a look', checkNote: 'The measured rules of what Power BI Desktop draws and the layout check, run on the planned pages (structure only, never data). The report is checked again when it is written.',
    files: 'Files that will be written', yours: 'The files you asked for:', all: (n) => `All ${n} file${n === 1 ? '' : 's'}: the full list, by kind`, about: 'About the script',
    roles: { report: 'the report: open it in Power BI Desktop', script: 'the script: see "About the script" below', theme: 'the theme file: in Power BI Desktop, View > Themes > Browse for themes' },
    plan: (id) => `Plan ${id}. Only a click here approves it: what is typed in the chat does not. Approve only a plan you asked for.` },
  ar: { ask: 'موافقة: ', lead: 'يطلب DataArcus موافقتك قبل أن يكتب أي شيء. لم يُكتب أي شيء بعد. راجع الخطة، ثم وافق عليها أو لا.', approve: 'موافقة', notNow: 'ليس الآن',
    preview: 'كيف سيبدو التقرير', previewNote: 'معاينة مرسومة من الخطة: مكان كل مرئي ونوعه وعنوانه. الأشكال الرمادية عناصر نائبة وليست بياناتك: يقرأ DataArcus الملفات على جهازك ليفحصها، ولا يرسل أي قيمة من بياناتك إلى Claude أبدًا.',
    page: 'الصفحة', enPage: 'الصفحة الإنجليزية', arPage: 'الصفحة العربية', toCheck: 'للفحص', notDrawn: (n, pairs) => `لم تُرسم هنا ${n} ${pairs ? 'من أزواج الصفحات' : 'من الصفحات'} أخرى (ترسم المعاينة ${PREVIEW_PAGES_MAX} على الأكثر) · ${n} more ${pairs ? 'page pairs' : 'pages'} not drawn here (the preview draws at most ${PREVIEW_PAGES_MAX}); the plan lists every page.`, checked: 'فُحص قبل الكتابة', worth: 'للمراجعة', checkNote: 'القواعد المقيسة لما يرسمه Power BI Desktop وفحص التخطيط، على الصفحات المخطط لها (البنية فقط، دون أي بيانات). ويُفحص التقرير مرة أخرى عند كتابته.',
    files: 'الملفات التي ستُكتب', yours: 'الملفات التي طلبتها:', all: (n) => `جميع الملفات (${n}) · All ${n} file${n === 1 ? '' : 's'}: the full list, by kind`, about: 'عن السكربت',
    roles: { report: 'التقرير: افتحه في Power BI Desktop', script: 'السكربت: انظر «عن السكربت» أدناه', theme: 'ملف السمة: في Power BI Desktop اختر View ثم Themes ثم Browse for themes' },
    // (T2: the page's title stayed English on an Arabic page) the titles per plan kind
    titles: { report: 'تقرير', twin: 'النسخة العربية من تقرير', same: 'تقرير واحد بالإنجليزية والعربية', calendar: 'سكربت تقويم الخليج', sample: 'مشروع المثال (بيانات مختلَقة)', columns: 'سكربت أعمدة التقويم العربية' },
    plan: (id) => `الخطة <bdi dir="ltr">${esc(id)}</bdi>. لا يوافق عليها إلا نقرة هنا: ما يُكتب في المحادثة لا يوافق عليها. لا توافق إلا على خطة طلبتها.` }
};
// the file kinds in Arabic, beside their English names (the names Power BI's own files and this page's groups use)
const KIND_AR = { Bookmarks: 'الإشارات المرجعية', Pages: 'الصفحات', Visuals: 'المرئيات', 'Phone layouts': 'تخطيطات الهاتف', Theme: 'السمة', Images: 'الصور', 'Custom visual packages': 'حزم المرئيات المخصصة',
  'Flip cards script': 'سكربت البطاقات القابلة للقلب', 'Format script': 'سكربت التنسيقات', 'Project file': 'ملف المشروع', 'Report settings': 'إعدادات التقرير', 'Arabic calendar script': 'سكربت أعمدة التقويم العربية', 'Theme file': 'ملف السمة',
  'Metric switcher script': 'سكربت مبدّل المقاييس', 'Model (TMDL)': 'النموذج (TMDL)', 'Empty report': 'تقرير فارغ', 'Status icons script': 'سكربت أيقونات الحالة', 'DAX functions script': 'سكربت دوال DAX', [BLANK_LABEL()]: 'خلفيات الصفحات (فارغة وشفافة: تظهر الصفحة بلون السمة)',
  "Theme (the original's, copied)": 'السمة (سمة التقرير الأصلي، منسوخة كما هي)', "Images (the original's, copied)": 'الصور (صور التقرير الأصلي، منسوخة كما هي)' };
function BLANK_LABEL() { return 'Page backgrounds (blank, see-through: the page shows the theme\'s colour)'; }
const kindLabel = (label, ar) => (ar && KIND_AR[label] ? `${KIND_AR[label]} · ${label}` : label);
const iso = (t) => `<bdi dir="ltr">${esc(t)}</bdi>`;
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
// the files the person asked for, named on top: the project file (the report), each script, the theme file
// (0.3.1 C: a .tmdl inside a .SemanticModel folder is the model itself, as the sample project writes it, not a script)
const isScript = (f) => /\.tmdl$/i.test(String(f)) && !/\.SemanticModel\//i.test(String(f));
const mainFiles = (paths, kind) => (paths || []).map(String).filter((f) => /\.pbip$/i.test(f) || isScript(f) || (kind === 'theme' && /\.json$/i.test(f)))
  .map((f) => [f, /\.pbip$/i.test(f) ? 'report' : isScript(f) ? 'script' : 'theme']);
const filesHtml = (groups, kind, ar) => {
  if (!groups || !groups.length) return '';
  const W = WORDS[ar ? 'ar' : 'en'], all = [].concat(...groups.map((g) => g.paths)), n = all.length, line = kindsLine(all, kind, ar), main = mainFiles(all, kind);
  return `${line ? `<p><strong>${esc(line)}</strong></p>` : ''}${main.length ? `<p>${esc(W.yours)}</p><ul>${main.map(([f, r]) => `<li>${iso(f.split('/').pop())}: ${esc(W.roles[r])}</li>`).join('')}</ul>` : ''}`
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
  ['Page pairs', 'أزواج الصفحات'], ['Language buttons', 'أزرار اللغة'], ['Slicers kept in sync', 'المقسمات المتزامنة (Slicers)'], ['Inputs', 'المدخلات'], ['Dates and seasonal scope', 'التواريخ والنطاق الموسمي'], ['Not checked before writing', 'لم يُفحص قبل الكتابة'],
  ['All inputs, as given (raw)', 'كل المدخلات كما أُعطيت (raw)'], ['Colours', 'الألوان'], ['Sample project (made-up data)', 'مشروع المثال (بيانات مختلَقة)'], ['Tables', 'الجداول'], ['DAX function library', 'مكتبة دوال DAX'],
  // (SQ3, T1-S9) the report's other headings an Arabic page shows
  ['Flip cards', 'البطاقات القابلة للقلب'], ['Status icons', 'أيقونات الحالة'], ['Waterfalls, right to left', 'الشلالات من اليمين إلى اليسار'], ['Metric switcher', 'مبدّل المقاييس'], ['Visual gallery', 'معرض المرئيات'],
  ['Custom visuals replaced', 'المرئيات المخصصة المستبدلة']];
// (0.3.1 LR1) the sample section's row names in Arabic
const SAMPLE_AR = { 'What it is': 'ما هو', 'Made up': 'بيانات مختلَقة', Folder: 'المجلد', 'To open': 'للفتح', 'Date table': 'جدول التاريخ', Report: 'التقرير', Relationships: 'العلاقات', 'The rows': 'الصفوف' };
// (SQ3, T1-S9: «تظهر بالإنجليزية · Shown in English (21, no Arabic text)» kept the count's words English only) a count
// with words takes its Arabic words in the Arabic half; a bare count, or words not listed here, stays in the English half
const COUNT_AR = [[/^(\d+), no Arabic text$/, (n) => `${n}، دون نص عربي`], [/^(\d+), no Arabic name$/, (n) => `${n}، دون اسم عربي`],
  [/^(\d+) functions?, (\d+) measures?$/, (f, m) => `الدوال: ${f}، المقاييس: ${m}`]];
// (the English heading stays beside it, as the file kinds do: the person can match it with the chat's words)
const headingOf = (h, ar) => {
  if (!ar) return h;
  const x = HEAD_AR.find(([en]) => h === en || h.startsWith(en + ' (')); if (!x) return h;
  const rest = h.length > x[0].length ? h.slice(x[0].length + 2, -1) : '', c = rest && COUNT_AR.map(([re, f]) => { const m = re.exec(rest); return m ? f(...m.slice(1)) : null; }).find(Boolean);
  return `${x[1]}${c ? ` (${c})` : ''} · ${h}`;
};

function askPage(w) {
  const s = w.show, ar = s.lang === 'ar', W = WORDS[ar ? 'ar' : 'en'];
  // (T-7: the raw inputs folded) a section with fold is shown closed
  const sections = s.sections.filter((x) => x.rows.length).map((x) => (x.fold ? `<details><summary>${esc(headingOf(x.heading, ar))}</summary>${rows(x.rows, ar)}</details>` : `<h2>${esc(headingOf(x.heading, ar))}</h2>${rows(x.rows, ar)}`)).join('');
  // (the pictures: SVG markup from the shared renderer, which escapes every name in it; drawn from the plan, never a value)
  // (0.3.1 V1) the twin's pages too, and the copy's as pairs (its English page beside its Arabic page, one above the other
  // on a narrow window); at most PREVIEW_PAGES_MAX pages (pairs) drawn, the rest counted
  // (SQ3, V1-S3: the "معاينة" tag on the copy's English pages) a pair's English page is drawn in English
  const fig = (p, label, lang) => {
    const fl = Preview.check(p).concat(p.flags || []).filter((f, k, all) => all.findIndex((g) => g.i === f.i && g.kind === f.kind) === k);
    return `<figure>${Preview.render(p, { lang: lang || s.previews.lang, width: 800 })}<figcaption dir="auto">${esc(label)}: ${esc(cut(p.name, 80))}${fl.length ? ` <span class="warn">(${fl.length} ${esc(W.toCheck)}: ${esc([...new Set(fl.map((f) => (Preview.WORDS[ar && Preview.WORDS.ar ? 'ar' : 'en'] || Preview.WORDS.en)[f.kind]))].join(', '))})</span>` : ''}</figcaption></figure>`; };
  const PP = s.previews && Array.isArray(s.previews.pages) ? s.previews.pages : [], PR = s.previews && Array.isArray(s.previews.pairs) ? s.previews.pairs.filter((x) => Array.isArray(x) && PP[x[0]] && PP[x[1]]) : null;
  const drawn = PR ? PR.slice(0, PREVIEW_PAGES_MAX).map(([e, a], i) => `<div class="pair">${fig(PP[e], `${W.enPage} ${i + 1}`, 'en')}${fig(PP[a], `${W.arPage} ${i + 1}`)}</div>`).join('')
    : PP.slice(0, PREVIEW_PAGES_MAX).map((p, i) => fig(p, `${W.page} ${i + 1}`)).join(''), left = (PR || PP).length - PREVIEW_PAGES_MAX;
  const pv = PP.length ? `<h2>${esc(W.preview)}</h2><div class="card preview">${drawn}${left > 0 ? `<p class="note">${esc(W.notDrawn(left, !!PR))}</p>` : ''}<p class="note">${esc(W.previewNote)}</p></div>` : '';
  // (0.3.0 step 2: the check of the planned pages, before Approve: what Power BI Desktop would show; every text escaped)
  // (T1, T-3: "3 more worth a look" with no list) each item worth a look, one plain line
  const ck = s.previews && s.previews.check, wl = ck && Array.isArray(ck.worthALookItems) ? ck.worthALookItems : [];
  const ckHtml = ck ? `<h2>${esc(W.checked)}</h2><div class="card"><p class="${ck.desktop ? 'warn' : ''}"><strong>${esc(ck.summary)}</strong></p>${ck.problems && ck.problems.length ? `<ul>${ck.problems.map((f) => `<li dir="auto">${esc(f.page ? `${W.page} ${f.page}: ` : '')}${esc(f.visual || '')}${f.visual ? ': ' : ''}${esc(f.what)}. <span class="note">${esc(f.fix)}</span></li>`).join('')}</ul>` : ''}${wl.length ? `<p>${esc(W.worth)}:</p><ul>${wl.map((x) => `<li dir="auto">${esc(x)}</li>`).join('')}</ul>` : ''}<p class="note">${esc(W.checkNote)}</p></div>` : '';
  const arTitle = ar && s.titleKey && W.titles[s.titleKey] ? W.titles[s.titleKey] : null;
  // (SQ3, T1-S6: an Arabic page listed the writes in English) each write in Arabic (the plan's writesAr, made by its tool
  // from the same facts), the plan's English line under it; a writesAr that is not one line per write is not shown
  const named = (x) => (s.name ? String(x).split('<name>').join(s.name) : String(x));
  const WA = ar && Array.isArray(s.writesAr) && s.writesAr.length === w.plan.writes.length ? s.writesAr : null;
  const writesHtml = w.plan.writes.map((x, i) => (WA ? `<li dir="auto">${isoText(named(WA[i]), true)}<br><span class="note" dir="ltr">${esc(named(x))}</span></li>` : `<li dir="auto">${esc(named(x))}</li>`)).join('');
  const h1 = arTitle ? `${esc(arTitle)}${s.name ? ` «<bdi>${esc(cut(s.name, 80))}</bdi>»` : ''}` : esc(s.title);
  return page(W.ask + (arTitle ? `${arTitle}${s.name ? ` «${cut(s.name, 80)}»` : ''}` : s.title), `<h1 dir="auto">${h1}</h1>${s.first ? `<h2>${esc(s.first.heading)}</h2><div class="card">${s.first.text.map((t) => `<p class="warn" dir="auto"><strong>${esc(t)}</strong></p>`).join('')}</div>` : ''}<p class="lead">${esc(W.lead)}</p>
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
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" });
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

// (0.3.0 J18, B-171) the terminology sheet, side by side: each field's English name (its key) and its Arabic, with its status
const TERM_STATUS = (r) => (r.status === 'approved' ? `approved${r.earlier ? ' (earlier in this session, unchanged since)' : ''}`
  : r.status === 'draft' ? 'draft from the fixed list of report words: approved with this plan' : `kept in English${r.why ? `: ${String(r.why).replace(/^kept in English(?: for now)?: /, '')}` : ''}`);
const termSheet = (rows) => ({ heading: `Terminology sheet: English | Arabic (${rows.length})`, rows: rows.map((r) => [`${String(r.en)} (${String(r.field)})`, `${r.ar != null ? String(r.ar) : String(r.en)}: ${TERM_STATUS(r)}${r.places ? `; shown in ${r.places} place${r.places === 1 ? '' : 's'}` : ''}`]) });
const KIND_NAME = { bar: 'Bar chart', column: 'Column chart', line: 'Line chart', donut: 'Donut chart', table: 'Table' };
const KIND_A = { bar: 'a bar chart', column: 'a column chart', line: 'a line chart', donut: 'a donut chart', table: 'a table' };
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
  relateTo: ['Related to the new table\'s Date', (v) => [].concat(v).join(', ')], arabicColumnsOnly: ['What is written', (v) => (v ? 'only the Arabic calendar columns, for your own date table' : 'a new calendar table')],
  brand: ['Brand colour', (v) => String(v)], mode: ['Mode', (v) => String(v)]
};
/** The plan as the window shows it: every input the plan pins, by name, as plain text (A-01: the person sees what the
 *  click approves). kind: the plan's kind; data: the plan's data (its pins, the twin's labels). */
// (0.3.0 X1; 0.3.1 X2) a report holding both languages, on the twin's EN-AR page and on create_report's page: the report,
// every page pair, the language buttons, the slicers kept in sync; at: where in the sections they go (0 first)
function languagesSections(LG, sections, at) {
  const pairs = Array.isArray(LG.pairs) ? LG.pairs : [], btns = Array.isArray(LG.buttons) ? LG.buttons : [], sg = Array.isArray(LG.syncGroups) ? LG.syncGroups : [], T = LG.tabs || {};
  const pg = (x) => `"${String((x && x.name) || '')}"${x && x.hidden ? ' (hidden in the tabs)' : ''}`;
  sections.splice(at, 0, { heading: 'One report, English and Arabic', rows: [['New report', String((LG.copy || {}).report || '')], ['Project file', String((LG.copy || {}).pbip || '')], ['The original', at ? 'none: a new report' : 'only read: not changed'],
    ['Tabs shown', String(T.shown || '')], ['Hidden in the tabs', String(T.hidden || '')], ['Tooltip pages', String(T.tooltipPages || '')], ['What a reader sees', String(T.service || '')], ['Bookmarks', String(LG.bookmarks || 'none')]]
    .concat((Array.isArray(LG.measures) ? LG.measures : []).map((m) => ['Report measure', `${String(m.arabic)} for the Arabic pages; ${String(m.measure)} stays for the English pages`])) },
  { heading: `Page pairs (${pairs.length})`, rows: pairs.map((x, i) => [`${i + 1}. English ${pg(x.english)}`, `Arabic ${pg(x.arabic)}${x.tooltip ? ' (tooltip pages)' : x.drillthrough ? ' (drillthrough pages)' : ''}`]) },
  { heading: `Language buttons (${btns.length})`, rows: btns.map((b) => [`${String(b.on)} page "${String(b.page)}"`, b.placed ? `«${String(b.text)}» at ${String(b.at || '')}, goes to its ${b.on === 'English' ? 'Arabic' : 'English'} page; ${b.phone ? 'on the phone layout too' : `not on the phone layout${b.why ? ': ' + String(b.why) : ''}`}` : `not placed: ${String(b.why || '')}`]) },
  { heading: `Slicers kept in sync (${sg.length})`, rows: sg.map((x) => [`Page "${String(x.page)}": slicer ${String(x.slicer)}`, `with its Arabic copy ${String(x.arabicSlicer || '')}, sync group "${String(x.group)}"${x.kept ? ` (${String(x.kept)})` : ''}`]) });
}
export function summary(kind, data) {
  const s = summaryOf(kind, data), wa = data && data.writesAr;
  // (SQ3, T1-S6) the writes in Arabic, as the plan's tool said them (shown on an Arabic page only, line for line)
  if (Array.isArray(wa)) s.writesAr = wa.map(String);
  return s;
}
/** The approval page of a plan as its window serves it before the click (plan: { id, kind, writes }; show: summary()). */
export const approvalHtml = (plan, show) => askPage({ plan, show });
function summaryOf(kind, data) {
  const d = data || {}, pins = d.pins || {}, sections = [];
  // (R6, F09 f: a long value was cut at 600 characters) every value in full
  const val = (v) => (v == null ? '' : typeof v === 'string' ? v : typeof v === 'boolean' ? (v ? 'yes' : 'no') : JSON.stringify(v));
  // (0.3.0 T1, T-6: "There is no background image." under a list holding the background PNG) a page background the writer
  // writes blank (a see-through pixel, so the page shows the theme's colour) is listed as what it is
  const blank = new Set(Array.isArray(d.blankImages) ? d.blankImages.map(String) : []);
  const files = Array.isArray(d.outputs) ? groupFiles(d.outputs, [[BLANK_LABEL(), { test: (f) => blank.has(f) }], ['Metric switcher script', / - metric switcher\.tmdl$/i], ['Status icons script', / - status icons\.tmdl$/i], ['DAX functions script', / - DAX functions(?: \d+)?\.tmdl$/i]]) : null;   // (L3: the switch's own script; 0.3.1 L6: the DAX functions')
  if (kind === 'report') {
    const p = pins.create_report || {}, L = (p.design && p.design.layout) || {};
    const T = { title: (d.bilingual ? 'English and Arabic in one report' : 'Report') + (p.name ? ` "${cut(p.name, 80)}"` : ''), name: p.name || null, previews: d.preview && Array.isArray(d.preview.pages) ? d.preview : null, files, kind, lang: p.lang === 'ar' ? 'ar' : 'en', scriptWhat: 'the changes listed with the plan', titleKey: d.bilingual ? 'same' : 'report' };
    // (0.3.1 L6) the DAX function library's compatibility step, the FIRST thing on the page, in the plan's language: applying
    // its script raises the model's compatibility level to 1702, which cannot be undone (or the model is already there)
    const DF = d.daxFunctions && d.daxFunctions.compatibility ? d.daxFunctions : null;
    if (DF) { const C = DF.compatibility, ar = T.lang === 'ar' && C.sayFirstAr;
      T.first = { heading: (ar ? (C.raises ? 'أولًا: هذا يرفع مستوى التوافق في نموذجك (لا يمكن التراجع عنه) · ' : 'أولًا: مستوى التوافق في نموذجك · ') : '') + (C.raises ? 'First: this raises your model\'s compatibility level (cannot be undone)' : 'First: your model\'s compatibility level'),
        text: ar ? [String(C.sayFirstAr), String(C.sayFirst || '')] : [String(C.sayFirst || '')] }; }
    sections.push({ heading: 'Report', rows: [['Name', p.name], ['Title', p.title || (p.name ? '(the report\'s name)' : '')], ['Language', p.lang === 'ar' ? 'Arabic (right to left)' : 'English'],
      ['Page size', p.page ? val(p.page) : L.page || (p.pages ? '' : '1920x1080')], p.customVisualsFrom != null ? ['Copy of the report', p.customVisualsFrom] : null].filter((r) => r && r[1] !== undefined && r[1] !== '').map(([k, v]) => [k, val(v)]) });
    // (rc.24, B-140: the page said "Column chart by" for the chart written as a bar chart) the kind each chart is written
    // as, with the reason when the writer changed it (the plan's data: kinds [{ role, from, to }], plan_layout's lint)
    const kinds = Array.isArray(d.kinds) ? d.kinds : [], changeOf = (from) => kinds.find((k) => k && k.from === from);
    // (R6, F09 d) the lint's own measured why when the plan holds it (#64), else the general reason
    const why = (k) => `planned as ${KIND_A[k.from] || 'another kind'}: ${k.why ? String(k.why) : k.to === 'donut' ? 'its category has two values' : 'the names would slant or be cut'}`;
    if (p.design) sections.push({ heading: 'Layout', rows: [['Layout', { exec: 'Executive summary', analysis: 'Analysis', ops: 'Operations monitor', focus: 'Single focus' }[L.preset] || L.preset], ['KPI cards', L.kpis], ['Filters', L.filters ? String(L.filters) : 'none'], ['Header', L.header === false ? 'no' : 'yes'], ['Second page', p.secondPage === false ? 'no' : 'yes, with page buttons']].filter((r) => r[1] !== undefined).map(([k, v]) => [k, val(v)])
      .concat(kinds.length ? [['Written as another kind', kinds.map((k) => `${k.role || 'A chart'}: ${KIND_NAME[k.to] || 'another kind'} (${why(k)})`)]] : []) });
    // category is the bar chart's field, category2 the column chart's
    const F = p.fields || {}, FL = { kpis: 'KPI cards', measure: 'Charts\' measure', timeAxis: 'Trend axis', category: 'Bar chart by', category2: 'Column chart by', table: 'Table', slicers: 'Slicers' }, PLANNED = { category: 'bar', category2: 'column' };
    // (0.3.1 LR1) the slicers the plan adds to fill the design's slots, named after the ones asked
    const added = (k0) => (k0 === 'slicers' && Array.isArray(d.slicersAdded) ? d.slicersAdded.map((f) => ({ en: `${String(f)} (added by DataArcus to fill the design's slicer slots)`, ar: `${String(f)} (أضافه DataArcus لملء خانات المقسمات في التصميم)` })) : []);
    const fr = Object.keys(FL).filter((k) => F[k] !== undefined).map((k) => { const v = Array.isArray(F[k]) ? F[k].map(String).concat(added(k)) : String(F[k]), c = PLANNED[k] && changeOf(PLANNED[k]);
      return c ? [`${KIND_NAME[c.to] || 'Chart'} by`, `${v} (${why(c)})`] : [FL[k], v]; });
    sections.push({ heading: 'Fields', rows: fr.length ? fr.concat(Object.keys(F).length < Object.keys(FL).length ? [['Other visuals', 'chosen by DataArcus from the model']] : []) : [['All visuals', 'chosen by DataArcus from the model' + (p.focus ? ` (focus: ${val(p.focus)})` : '') + (p.tables ? ` (tables: ${val(p.tables)})` : '')]] });
    if (p.pages) sections.push({ heading: 'Pages', rows: p.pages.map((pg, i) => [`Page ${i + 1}: ${cut(pg.name, 80)}`, (pg.slots || []).map((s) => `${s.kind}${s.title ? `: ${s.title}` : ''}${s.text ? ` "${cut(s.text, 120)}"` : ''}`).concat(pg.background ? [`background: ${pg.background}`] : [])]) });
    if (p.displayNames && Object.keys(p.displayNames).length) sections.push({ heading: 'Names shown in the report', rows: Object.entries(p.displayNames).map(([k, v]) => [k, String(v)]) });
    if (Array.isArray(d.terminology) && d.terminology.length) sections.push(termSheet(d.terminology));
    // (0.3.0 J17, B-170) the date the report follows, its grain and seasonal scope, and the dates' status, before the click
    if (Array.isArray(d.gulfDates) && d.gulfDates.length) sections.push({ heading: 'Dates and seasonal scope', rows: d.gulfDates.map(([k, v]) => [String(k), String(v)]) });
    // (0.3.0 R2: an Arabic report's texts are Arabic, or listed here with why before the go) the fields kept in English
    if (Array.isArray(d.notTranslated) && d.notTranslated.length) sections.push({ heading: `Shown in English (${d.notTranslated.length}, no Arabic name)`, rows: d.notTranslated.map((x) => [String(x.field), String(x.why || '')]) });
    // (D1) a right-to-left report's waterfalls: what each is written as, before the click
    if (Array.isArray(d.waterfallRtl) && d.waterfallRtl.length) sections.push({ heading: `Waterfalls, right to left (${d.waterfallRtl.length})`, rows: d.waterfallRtl.map((x) => [`${cut(String(x.page || ''), 60)}${x.title ? `: ${cut(String(x.title), 80)}` : ''}`, `${String(x.written || '')}: ${String(x.what || '')}${x.why ? ` (${String(x.why)})` : ''}`]) });
    // (0.3.0 L4) the flip cards: which cards, what their back says, the bookmarks, the model change, before the click
    const FC = d.flipCards && Array.isArray(d.flipCards.cards) ? d.flipCards : null;
    if (FC && FC.cards.length) sections.push({ heading: `Flip cards (${FC.cards.length})`, rows: FC.cards.map((c) => [`${cut(String(c.page || ''), 60)}: card ${c.card}`, `${cut(String(c.title || ''), 80)}: the front shows its title and value; the back shows the measure's name and one line: ${String((c.back || {}).description || '')}; ${String((c.back || {}).value || '')}; year on year: ${String((c.back || {}).yearOnYear || '')}`])
      .concat([['Bookmarks', `${FC.bookmarks} display-only bookmarks (two a card: one shows the back, one the front); they touch no slicer or filter`],
        ['Model change', `${FC.newMeasures} new measures (the pictures) in the script "${String(FC.scriptAfterGo || '')}" next to the project. The model is not changed by DataArcus: apply the script first, in TMDL view (Preview, then Apply); until then ${FLIP_BEFORE}`],
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
    // (the options by their names in the report's words; a bar colour left out is the default the plan says)
    const LK = { gallery: 'Visual gallery', theme: 'Theme file', logo: 'Logo', colors: 'Colours', chartColors: 'Bar colours', chartAxes: 'Chart axes', kpiValues: 'KPI values', noDataMessage: 'Message when there is no data', slidePanel: 'Filters in a slide-in panel', smoothLines: 'Smooth lines', slicerStyle: 'Slicer style', grid: 'Gridlines', flipCards: 'Flip cards', waterfallRtl: 'Waterfall, right to left', statusIcons: 'Status icons', daxFunctions: 'DAX function library', sharedAxes: 'Shared axes (the user\'s answers)', font: 'Font', rtl: 'Right to left', dir: 'Reading direction' };
    const bars = p.chartColors !== undefined && p.chartColors !== null ? p.chartColors : p.pages ? 'solid' : p.design ? 'gradient' : null;
    const look = Object.keys(LK).filter((k) => k !== 'chartColors' && p[k] !== undefined && p[k] !== null && (k !== 'waterfallRtl' || ((p.lang === 'ar' || p.dir === 'rtl' || p.rtl === true) && (!Array.isArray(d.waterfallRtl) || d.waterfallRtl.length) && (d.waterfalls == null || d.waterfalls > 0)))).map((k) => [LK[k], k === 'waterfallRtl' ? wfRtlSaid(p[k]) : k === 'kpiValues' && p[k] === 'auto' ? 'auto (short, like 28.01M, when the number is long)' : k === 'smoothLines' ? (p[k] === false ? 'no: straight lines, no dots' : 'yes: smooth curves that never swing past the data, a dot on each point') : k === 'gallery' ? (p[k] === true ? 'yes: every kind whose fields fit' : p[k] === false ? 'no' : `yes: ${[].concat(p[k]).join(', ')}`) : k === 'slicerStyle' ? (p[k] === 'pills' ? 'pills: rounded buttons for a field of 2-6 values known from the model; a rounded dropdown for the others' : 'dropdown, rounded') : k === 'grid' ? ({ solid: 'solid, quiet', dotted: 'dotted, light grey', none: 'none' })[p[k]] || val(p[k]) : k === 'flipCards' ? (p[k] === true ? 'yes: every KPI card' : Array.isArray(p[k]) ? `yes: card${p[k].length === 1 ? '' : 's'} ${p[k].join(', ')}` : 'no') : k === 'statusIcons' ? (p[k] === true ? 'yes: the rates whose target the model names' : Array.isArray(p[k]) ? `yes: ${p[k].length} measure${p[k].length === 1 ? '' : 's'} (listed under Status icons)` : 'no') : k === 'sharedAxes' && Array.isArray(p[k]) ? p[k].map((x) => `${(x.measures || []).join(' and ')}: ${x.answer === 'comparable' ? 'comparable, one axis may be shared' : 'separate visuals'}`).join('; ') : k === 'colors' && typeof p[k] === 'object' ? { swatches: Object.entries(p[k]).map(([n, c]) => [n, String(c)]) } : val(p[k])]);
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
    if (bars) look.unshift([LK.chartColors, bars === 'gradient' ? 'each bar fades by its value; a chart by a second category field gets a second colour, the same on every page' : 'one colour for every bar']);
    sections.push({ heading: 'Look and options', rows: look });
    // (L3) the metric switcher: the measures and their labels, the charts that switch, and the model change it needs
    const ms = d.metricSwitcher && typeof d.metricSwitcher === 'object' ? d.metricSwitcher : null;
    const CK = { bar: 'Bar chart', line: 'Line chart' };
    if (ms) sections.push({ heading: 'Metric switcher', rows: [['Page', String(ms.page || '')]]
      .concat((Array.isArray(ms.measures) ? ms.measures : []).map((x, i) => [`Metric ${i + 1}: ${cut(String(x.field), 120)}`, `shown as "${cut(String(x.label), 100)}"`]))
      .concat([['Charts that switch', (Array.isArray(ms.charts) ? ms.charts : []).map((c) => `${CK[c.kind] || 'Chart'} by ${String(c.by)}`)]], (ms.notSwitched || []).length ? [['Not on the page', ms.notSwitched.map(String)]] : [],
        // (SQ15b, L3-S2) the measures left out: their table is not related to the charts' axes
        Array.isArray(ms.leftOut) && ms.leftOut.length ? [['Measures left out', ms.leftOut.map((x) => `${cut(String(x.field), 120)}: ${cut(String(x.why), 300)}`)]] : [],
        [['Title with nothing chosen', String(ms.fallbackTitle || '')], ['Model change', String(ms.modelChange || '')], ['Script file', String(ms.script || '')], ['Before the script is applied', String(ms.beforeApplied || '')], ['Saved selection', String(ms.savedSelection || '')]]) });
    // (0.3.0 D2) each gallery visual the user asked for: what is written and why (the writer's rule on the fields), and
    // how the preview draws it
    const GN = { combo: 'Combo (line and clustered column)', waterfall: 'Waterfall', smallMultiples: 'Small multiples' };
    const gl = Array.isArray(d.gallery) ? d.gallery : [];
    if (gl.length) sections.push({ heading: 'Visual gallery', rows: gl.map((g) => [`${GN[g.kind] || 'A gallery visual'}${g.title ? `: ${cut(g.title, 80)}` : ''}`, `written as ${g.written === g.kind ? (GN[g.kind] || g.kind).toLowerCase() : String(g.written)}: ${String(g.why || '')}`])
      .concat([['Preview', 'the preview draws a waterfall and small multiples as a column-chart placeholder, a combo as a line-chart placeholder']]) });
    const other = ['pageFilters', 'text', 'subtitles', 'svgColumns', 'svgCards'].filter((k) => p[k] !== undefined && p[k] !== null);
    if (other.length) sections.push({ heading: 'More', rows: other.map((k) => [k, val(p[k])]) });
    // (0.3.1 X2) a report in English and Arabic: both halves, as the twin's EN-AR page shows them
    if (d.bilingual && typeof d.bilingual === 'object') languagesSections(d.bilingual, sections, 1);
    // (0.3.1 SQ10, K2-S1) what stays English or unmirrored in its Arabic half, in one line, as the twin's page says it
    const NFb = d.bilingual && d.bilingual.notFullyArabic && typeof d.bilingual.notFullyArabic === 'object' ? d.bilingual.notFullyArabic : null;
    if (NFb && NFb.en) sections.push({ heading: 'ليست عربية بالكامل · Not fully Arabic', rows: [['العربية', String(NFb.ar || '')], ['English', String(NFb.en)]] });
    // (0.3.1 SQ10, AF2-S4) a script the plan names that is already there with exactly its content: not among the files written
    if (Array.isArray(d.alreadyThere) && d.alreadyThere.length) sections.push({ heading: `Already there, not written again (${d.alreadyThere.length})`, rows: d.alreadyThere.map((f) => [String(f), 'next to the project, holding exactly this script: named again, not written again']) });
    // (R6, F09 a: the replacements were shown as JSON cut at 600 characters) each replacement and everything it loses
    // (0.3.1 NC2) the lead line first (how many at each confidence, how many are guesses), then each replacement's
    // confidence with its evidence, its losses and its second option
    if (Array.isArray(d.customVisualsShown)) { const lead = d.customVisualsShown.find((x) => x && x.lead), reps = d.customVisualsShown.filter((x) => x && !x.lead);
      sections.push({ heading: `Custom visuals replaced (${reps.length})`, rows: (lead ? [['In short', [String(lead.lead)].concat(lead.levels ? ['high', 'medium', 'low'].map((k) => `${k}: ${String(lead.levels[k] || '')}`) : [])]] : [])
        .concat(reps.map((x) => [String(x.line), (x.confidence ? [`confidence: ${String(x.confidence)}${x.evidence ? ` (${String(x.evidence)})` : ''}`] : [])
          .concat((x.lost || []).length ? (x.lost || []).map((l) => 'loses ' + String(l)) : ['loses nothing it shows'])
          .concat(x.second ? [`second option${x.second.chosen ? ' (chosen; the first is the closer one)' : ''}: ${String(x.second.label || x.second.native)} (${String(x.second.native)}), key "${String(x.second.pick)}": it loses ${(x.second.lost || []).map((l) => String(l).split(/: /)[0]).join('; ')}`] : [])])) }); }
    else if (d.customVisuals) sections.push({ heading: 'Custom visuals replaced', rows: [['Replacements', val(d.customVisuals)]] });
    // (J14, the owner's decision of 19 Oct) what the check before writing could not cover, said before the click
    const nc = d.exact && Array.isArray(d.exact.notChecked) ? d.exact.notChecked : [];
    if (nc.length) sections.unshift({ heading: 'Not checked before writing', rows: nc.map((n) => [NOT_CHECKED[n.check] ? NOT_CHECKED[n.check].charAt(0).toUpperCase() + NOT_CHECKED[n.check].slice(1) : 'A check', `not run: ${String(n.why || '')}. The rest of the report was checked (all ${d.exact.pages || 'its'} pages).`]) });
    return Object.assign(T, { sections });
  }
  // (0.3, J13 redesign step 2; the laptop's PROOF-rc24 block 2 (b): step 1's page showed the plan's fields, not what was
  // dropped) a redesign's page lists every change (page, visual, from, to), every visual not changed with why, and what
  // is copied as it is
  if (kind === 'redesign') {
    const S = d.shown || {}, pages = Array.isArray(S.pages) ? S.pages : [], K = S.keptAsIs || {};
    const at = (b) => (b ? `${b.x}, ${b.y}, ${b.w} x ${b.h}` : '');
    // (0.3.0 T1, T-7: "moves from 40, 40, 700 x 640 to 40, 40, 704 x 640") a change of place or size, in words
    const moved = (a, b) => { if (!a || !b) return null; const dx = b.x - a.x, dy = b.y - a.y, dw = b.w - a.w, dh = b.h - a.h, r = Math.round, out = [];
      if (dx) out.push(`${r(Math.abs(dx))} to the ${dx > 0 ? 'right' : 'left'}`); if (dy) out.push(`${r(Math.abs(dy))} ${dy > 0 ? 'down' : 'up'}`);
      const size = [dw ? `${r(Math.abs(dw))} ${dw > 0 ? 'wider' : 'narrower'}` : null, dh ? `${r(Math.abs(dh))} ${dh > 0 ? 'taller' : 'shorter'}` : null].filter(Boolean);
      return [out.length ? `moves ${out.join(' and ')}` : 'stays in place', size.length ? size.join(' and ') : null].filter(Boolean).join(', ') + ` (now ${r(b.w)} x ${r(b.h)}, its top left corner at ${r(b.x)}, ${r(b.y)})`; };
    // (R6, F08: a visual by its kind, fields and place, never its title text)
    const of = (c) => `${cut(c.type, 40)}${Array.isArray(c.fields) && c.fields.length ? ` of ${c.fields.join(', ')}` : ''}${c.place ? ` at ${c.place}` : ''}`;
    // (0.3.0 D4) a unit on one line: the visuals laid on it, each by its kind and fields, and where it goes with it
    const overlaid = (c) => (Array.isArray(c.overlays) && c.overlays.length ? `with what lies on it, ${c.from || c.overlays.some((o) => o.from) ? 'moved' : 'kept'} with it: ${c.overlays.map((o) => `${cut(o.visual, 60)} (${of(Object.assign({}, o, { place: null }))})${o.from ? ` to ${at(o.to)}` : ''}`).join('; ')}` : null);
    const changes = pages.flatMap((p) => (p.changes || []).map((c) => [`${cut(p.page, 60)}: ${cut(c.visual, 60)} (${of(c)})`,
      [c.from ? moved(c.from, c.to) : null, c.narrower ? cut(c.narrower, 200) : null, c.title && typeof c.title === 'object' ? `its title becomes "${String(c.title.to)}"` : null, overlaid(c)].filter(Boolean).join('; ')]));
    if (S.theme && S.theme.tokens) Object.entries(S.theme.tokens).forEach(([k, v]) => changes.push([`Theme ${cut(S.theme.file, 60)}: ${k}`, Array.isArray(v) ? { swatches: v.map((c) => ['', String(c)]) } : /^#[0-9a-f]{6}$/i.test(String(v)) ? { swatches: [['', String(v)]] } : val(v)]));
    const notChanged = pages.flatMap((p) => (p.why ? [[`${cut(p.page, 60)} (the whole page)`, cut(p.why, 200)]] : []).concat((p.notChanged || []).filter((x) => !(p.why && /tooltip page/.test(x.why))).map((x) => [`${cut(p.page, 60)}: ${cut(x.visual, 60)} (${of(x)})`, [cut(x.why, 200), overlaid(x)].filter(Boolean).join('; ')])));
    const n = (k, one, many) => (K[k] ? [[many[0].toUpperCase() + many.slice(1), `${K[k]} ${K[k] === 1 ? one : many}`]] : []);
    sections.push({ heading: 'Report', rows: [['Original', S.original || ''], ['New report', S.newReport || ''], ['Method', 'a copy of the original, file for file, with only the changes below']].map(([k, v]) => [k, val(v)]) });
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
  if (kind === 'sample') {
    const S = d.sample || {}, T = Array.isArray(S.tables) ? S.tables : [], own = pins.create_report || {};
    // (0.3.1 LR1) on the Arabic page each row's name and value in Arabic (SAMPLE_AR; the plan's sampleAr, made by
    // sample-project.mjs from the same facts), the English line under each; a value without its Arabic stays English
    const SA = own.lang === 'ar' && d.sampleAr && typeof d.sampleAr === 'object' ? d.sampleAr : null, TA = SA && Array.isArray(SA.tables) && SA.tables.length === T.length ? SA.tables : null;
    const two = (en, ar) => (SA && typeof ar === 'string' ? { en, ar } : en);
    sections.push({ heading: 'Sample project (made-up data)', rows: [['What it is', S.what, SA && SA.what], ['Made up', S.madeUp, SA && SA.madeUp],
      ['Folder', S.folder ? `"${String(S.folder)}": a new folder in the working folder` : null, S.folder ? `«${String(S.folder)}»: مجلد جديد في مجلد العمل` : null],
      ['To open', S.project, SA && SA.project], ['Date table', S.dateTable, SA && SA.dateTable], ['Report', S.report, SA && SA.report], ['Relationships', S.relationships != null ? String(S.relationships) : null, SA && SA.relationships], ['The rows', S.rows, SA && SA.rows]]
      .filter((r) => r[1] != null).map(([k, v, ar]) => [two(k, SAMPLE_AR[k]), two(val(v), ar == null ? ar : String(ar))]) });
    sections.push({ heading: `Tables (${T.length})`, rows: T.map((t, i) => [String(t.table), two(`${Number(t.rows)} made-up rows, ${Number(t.columns)} columns${t.measures ? `, ${Number(t.measures)} measures` : ''}`, TA ? String(TA[i]) : null)]) });
    return { title: 'Sample project (made-up data)', sections, files: Array.isArray(d.outputs) ? groupFiles(d.outputs, [['Model (TMDL)', /\.SemanticModel\//i], ['Empty report', /\.Report\//i]]) : null, kind, lang: own.lang === 'ar' ? 'ar' : 'en', titleKey: 'sample' };
  }
  if (kind === 'twin') {
    const labels = Object.entries(d.labels || {});
    // (0.3.0 T1, T-7: "Waterfall, right to left: native: ..." on a report with no waterfall) an option the report does not
    // use is left out (the plan's data says how many waterfalls and picture pages it has; an older plan shows them all)
    const uses = (k) => d[k] == null || d[k] > 0;
    // (SQ3, T1-S13: the twin's page is Arabic, its options were English, with (see "About the script")) each option in
    // Arabic, the English beside it
    const two = (a, e) => `${a} · ${e}`;
    sections.push({ heading: 'Options', rows: [[two('الرسوم عبر الزمن', 'Charts over time'), d.timeRightToLeft === false ? two('من اليسار إلى اليمين، كما في الإنجليزية', 'left to right, as in English') : two('من اليمين إلى اليسار، مثل بقية الصفحة', 'right to left, like the rest of the page')],
      [two('أعمدة التقويم العربية', 'Arabic calendar columns'), d.arabicMonth ? two('نعم: يضيفها سكربت إلى جدول التاريخ لديك (انظر «عن السكربت»)', 'yes: a script adds them to your date table (see "About the script")') : two('لا', 'no')]]
      .concat(uses('picturePages') ? [[two('الصفحات المرسومة على صورة خلفية', 'Pages drawn on a background picture'), d.mirrorPicturePages ? two('معكوسة رغم ذلك (صورتها لا تُعكس)', 'mirrored anyway (their picture is not)') : two('تبقى من اليسار إلى اليمين (لا يمكن عكس الصورة)', 'kept left to right (the picture can\'t be mirrored)')]] : [],
        uses('waterfalls') ? [[two('الشلال من اليمين إلى اليسار', 'Waterfall, right to left'), two(Gallery.waterfallRtlOf(d.waterfallRtl) === 'native' ? 'أصلي: شلال Power BI نفسه، يُقرأ من اليسار إلى اليمين كما يرسمه Power BI' : 'معكوس: مخطط أعمدة مكدسة مرسوم كشلال، يُقرأ من اليمين؛ دون عمود للإجمالي ودون وسيلة إيضاح، والقاعدة في التلميح', wfRtlSaid(d.waterfallRtl))]] : [],
        d.matrices ? [[two('المصفوفات', 'Matrices'), two('لا يوجد في مصفوفة Power BI إعداد من اليمين إلى اليسار: تبقى رؤوس صفوفها على اليسار وأعمدتها من اليسار إلى اليمين', String(d.matrices))]] : []) });
    sections.push({ heading: `Arabic texts (${labels.length})`, rows: labels.map(([k, v]) => [(d.names && d.names[k]) || 'A text of the report', String(v)]) });   // (rc.22, B-139: named, never by internal ids)
    if (Array.isArray(d.terminology) && d.terminology.length) sections.push(termSheet(d.terminology));
    // (0.3.0 D3) every text the twin shows in English, with why, before the click
    if (Array.isArray(d.notTranslated) && d.notTranslated.length) sections.push({ heading: `Shown in English (${d.notTranslated.length}, no Arabic text)`, rows: d.notTranslated.map((x) => [String(x.field), String(x.why || '')]) });
    // (0.3.1 K2) what stays English or unmirrored in this report, in one line (Arabic first: the page is Arabic)
    const NF = d.notFullyArabic && typeof d.notFullyArabic === 'object' ? d.notFullyArabic : null;
    if (NF && NF.en) sections.push({ heading: 'ليست عربية بالكامل · Not fully Arabic', rows: [['العربية', String(NF.ar || '')], ['English', String(NF.en)]] });
    // (0.3.0 X1) one report holding both languages: the copy, every page pair, the language buttons, the slicers in sync
    const LG = d.languages && typeof d.languages === 'object' ? d.languages : null;
    if (LG) languagesSections(LG, sections, 0);
    return { title: LG ? 'English and Arabic in one report' : 'Arabic twin of a report', sections, previews: d.preview && Array.isArray(d.preview.pages) && d.preview.pages.length ? d.preview : null, files: Array.isArray(d.outputs) ? groupFiles(d.outputs, [['Arabic calendar script', /\.tmdl$/i]]) : null, kind, lang: 'ar', scriptWhat: 'the Arabic calendar columns', titleKey: LG ? 'same' : 'twin' };
  }
  // (D6, the laptop proof of rc.2: the theme's page showed name, lang and path) the colours it writes, as swatches with
  // their hex, and the report they come from
  if (kind === 'theme' && d.colours && typeof d.colours === 'object') {
    const C = d.colours, src = d.source && typeof d.source === 'object' ? d.source : null, one = (c) => ({ swatches: [['', String(c)]] });
    const from = !src ? null : src.from === 'visuals' ? `from the colours on the visuals of report "${String(src.report)}"`
      : `from the theme of report "${String(src.report)}" (${String(src.theme)})${src.from === 'theme and visuals' ? ' and the colours on its visuals' : ''}`;
    sections.push({ heading: 'Colours', rows: [from ? ['Where they come from', from] : null, ['Data colours', { swatches: (Array.isArray(C.data) ? C.data : []).map((c, i) => [String(i + 1), String(c)]) }],
      ['Page', one(C.page)], ['Visuals', one(C.visuals)], ['Text', one(C.text)], ['Accent', one(C.accent)], C.mode ? ['Mode', C.mode === 'dark' ? 'dark' : 'light'] : null].filter(Boolean) });
  }
  const titles = { theme: 'Theme file', scripts: 'Model fix scripts', calendar: 'Gulf calendar script' };
  const own = Object.values(pins)[0] || {}, shownAnswers = Array.isArray(d.answersShown) ? d.answersShown : null;
  // (0.3.0 T1, T-7: "maxItems: 15 weekStart: sunday") each input in plain words; every input as given, folded below
  const given = Object.entries(own).filter(([k, v]) => v !== undefined && v !== null && !(k === 'answers' && shownAnswers));
  // (T2: arabicColumnsOnly listed the calendar table's name, fiscal year and Ramadan inputs it does not use)
  const used = own.arabicColumnsOnly ? ['path', 'arabicColumnsOnly'] : null;
  sections.push({ heading: 'Inputs', rows: given.filter(([k]) => INPUT_WORDS[k] && (!used || used.includes(k))).map(([k, v]) => [INPUT_WORDS[k][0], INPUT_WORDS[k][1](v, val, own)]) });
  if (given.length) sections.push({ heading: 'All inputs, as given (raw)', fold: true, rows: given.map(([k, v]) => [k, val(v)]) });
  // (R6, F09 f: a long answers list was cut at 600 characters, as hashes) every question with the answer recorded for it
  if (shownAnswers && shownAnswers.length) sections.push({ heading: `Answers to record (${shownAnswers.length})`, rows: shownAnswers.map((x) => [String(x.object || ''), `${x.answer === 'mistake' ? 'a mistake' : 'intended'} (the question: ${String(x.question || '')})`]) });
  const calAr = kind === 'calendar' && own.lang === 'ar';
  return { title: titles[kind] || 'Plan', sections, files: kind === 'theme' && Array.isArray(d.outputs) ? groupFiles(d.outputs, [['Theme file', /\.json$/i]]) : files, kind, lang: calAr ? 'ar' : 'en',
    scriptWhat: kind === 'calendar' ? (own.arabicColumnsOnly ? 'the Arabic calendar columns' : 'the calendar table') : kind === 'scripts' ? 'the fixes listed' : null, titleKey: kind === 'calendar' ? (own.arabicColumnsOnly ? 'columns' : 'calendar') : null };
}
