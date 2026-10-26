// node test-0.3.0-claims.mjs
// (0.3.0 A2, the claims re-check of the 0.3.0 wave, 20 Oct 2026; mcp/work/A2.md) every sentence DataArcus says about
// itself must be true in the code. One check per sentence A2 found untrue and fixed (each failed before its fix), and the
// forbidden-words scan over every file that speaks for DataArcus (English and Arabic).
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { groupFiles, summary, promptSummary } from './lib/approval-window.mjs';
import { serverSource } from './test-source.mjs';   // (0.3.1 S9: the server's code is server.mjs, tools/ and the lib/ modules it shared)
const read = (f) => fs.readFileSync(new URL(f, import.meta.url), 'utf8');
const flat = (f) => read(f).replace(/\s+/g, ' ');
const problems = [];
let checks = 0;
const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };

// the beta page's two languages, from their one source (the HTML pages are rendered from it: ar-pages.mjs)
const bp = read('../assets/js/translations/beta-page.js');
// (a key's section first: "validator" is a key of beta.run and of beta.safe)
const SECTION = { data: 'safe', validator: 'safe', approve_plan: 'tools', l3: 'new', t3: 'new' };
const keyOf = (lang, key) => { const L = bp.slice(bp.indexOf(lang === 'en' ? '"en"' : '"ar"')), part = L.slice(L.indexOf(`"${SECTION[key]}": {`)); const m = new RegExp(`"${key}": "((?:[^"\\\\]|\\\\.)*)"`).exec(part); return m ? m[1] : ''; };
const EN = { html: flat('../power-bi-mcp/index.html') }, AR = { html: flat('../ar/power-bi-mcp/index.html') };
for (const k of ['data', 'approve_plan', 'l3', 't3', 'validator']) { EN[k] = keyOf('en', k); AR[k] = keyOf('ar', k); }

// S1 (since 0.3.0 S1 read_report returns no static title; the twin returns titles, up to 200 characters, for their Arabic)
check(!/short titles as typed/.test(EN.data) && /text boxes/.test(EN.data) && /twin/.test(EN.data), `A2-S1. beta-page en safe.data says read_report's titles are sent: "${EN.data.slice(0, 200)}"`);
check(!/عناوينه القصيرة/.test(AR.data) && /مربعات النص/.test(AR.data) && /النسخة العربية/.test(AR.data), 'A2-S1. beta-page ar safe.data says the same as the English (text boxes; titles for the twin)');
// S2 (an app with MCP elicitation asks in its own prompt: no browser window opens)
check(/own approval prompt/.test(EN.approve_plan), 'A2-S2. beta-page en approve_plan says an app with its own approval prompt asks there instead');
check(/نافذة موافقة خاصة به/.test(AR.approve_plan), 'A2-S2. beta-page ar approve_plan says the same');
// S3 (the EN-AR copy's language button is placed where the header has room; the plan names a page without one)
check(!/on every page, desktop and phone/.test(EN.l3) && /names any page left without one/.test(EN.l3), 'A2-S3. beta-page en new.l3 promises a language button on every page');
check(!/وفي كل صفحة زر/.test(AR.l3) && /دونه/.test(AR.l3), 'A2-S3. beta-page ar new.l3 says the same');
// S4 (the EN-AR switch is a new copy; the original report is not changed)
check(!/in the same report/.test(EN.t3) && /copy/.test(EN.t3), 'A2-S4. beta-page en new.t3 says the twin goes into the same report');
check(!/داخل التقرير نفسه/.test(AR.t3) && /نسخة/.test(AR.t3), 'A2-S4. beta-page ar new.t3 says the same');
// S5 (check_report checks PBIR reports)
check(/any PBIR report/.test(EN.validator) && /بصيغة PBIR/.test(AR.validator), 'A2-S5. beta-page safe.validator says check_report checks any report (it checks PBIR)');
// the pages carry the source's sentences (rendered again)
check(EN.html.includes('own approval prompt') && EN.html.includes('any PBIR report') && !EN.html.includes('short titles as typed'), 'A2-S. power-bi-mcp/index.html does not carry the fixed English sentences (scripts/ar-pages.mjs --write and the page)');
check(AR.html.includes('نافذة موافقة خاصة به') && AR.html.includes('بصيغة PBIR') && !AR.html.includes('عناوينه القصيرة'), 'A2-S. ar/power-bi-mcp/index.html does not carry the fixed Arabic sentences (scripts/ar-pages.mjs --write)');

// A1 the approval page's file list: the flip cards' script is not a format script (L4)
const g = groupFiles(['Sales - flip cards.tmdl', 'Sales - fix formats.tmdl']);
check(g.some((x) => x.label === 'Flip cards script' && x.paths.length === 1) && g.some((x) => x.label === 'Format script' && x.paths.length === 1), `A2-A1. the approval page groups the flip cards' script as a format script: ${JSON.stringify(g.map((x) => [x.label, x.paths.length]))}`);
const sm = summary('report', { outputs: ['R.Report/definition/report.json', 'R - flip cards.tmdl'], pins: { create_report: {} } }).files || [];
check(sm.some((x) => x.label === 'Flip cards script') && !sm.some((x) => x.label === 'Format script'), 'A2-A1. the report page\'s file list says "Format script" for the flip cards\' script');
// A2 the 3:1 rule for a data colour is WCAG 2.1's non-text contrast (1.4.11); Power BI's accessibility page states none
const aw = read('./lib/approval-window.mjs');
check(!/Power BI's accessibility basics/.test(aw) && /WCAG 2\.1/.test(aw), 'A2-A2. the approval page credits the 3:1 rule for data colours to "Power BI\'s accessibility basics"');
// A3 the app's prompt: the contrast it gives is the approved colour's, said as such, with the written colour's own
const ps = promptSummary('report', { colours: { changed: [{ from: '#f4b183', to: '#c55a11', contrast: 1.9 }], card: '#ffffff' } });
check(/approved colour #f4b183 -> written colour #c55a11/.test(ps) && /the approved colour's contrast 1\.9:1/.test(ps) && /the written colour's own [\d.]+:1/.test(ps), `A2-A3. the app's prompt gives the approved colour's contrast after the written colour, as if it were the written one's: ${ps}`);

// K the skill (the twin's EN-AR copy, its choices; the slicers' answer only with pills)
const sk = flat('./skills/report-design/SKILL.md');
check(!/Ask the two choices the plan names/.test(sk) && /waterfallRtl/.test(sk) && /\(EN-AR\)/.test(sk), 'A2-K1. SKILL.md: the twin\'s plan has more than two choices (waterfallRtl, into "same": the EN-AR copy)');
check(!/The answer's `slicerStyle` says each slicer's style with why/.test(sk), 'A2-K2. SKILL.md says the answer\'s slicerStyle is always there (only with pills)');

// P PRIVACY.md (the wave's answers and memories)
const pv = flat('./PRIVACY.md');
check(!/`read_report` returns a title or a text box/.test(pv), 'A2-P1. PRIVACY.md section 3 says read_report returns a title (no static title since 0.3.0 S1)');
const row = (tool) => (pv.match(new RegExp(`\\| \`${tool}\` \\|([^|]*)\\|`)) || [])[1] || '';
const pl = row('plan_layout'), cr = row('create_report'), tw = row('create_arabic_twin');
check(['terminology', 'gulfDates', 'sharedAxes', 'waterfallRtl', 'metricSwitcher', 'flipCards', 'statusIcons', 'gallery'].every((k) => pl.includes(k)), 'A2-P2. PRIVACY.md\'s plan_layout row names the wave\'s answers (terminology, gulfDates, sharedAxes, waterfallRtl, metricSwitcher, flipCards, statusIcons, gallery)');
check(['metricSwitcher', 'flipCards', 'statusIcons', 'gallery', 'slicerStyle'].every((k) => cr.includes(k)), 'A2-P3. PRIVACY.md\'s create_report row names the wave\'s answers (metricSwitcher, flipCards, statusIcons, gallery, slicerStyle)');
check(/EN-AR/.test(tw) && /terminology/.test(tw), 'A2-P4. PRIVACY.md\'s create_arabic_twin row names the EN-AR copy and the terminology sheet');
check(/kept in the server's memory for this session only/.test(pv) && /never written to a file/.test(pv), 'A2-P5. PRIVACY.md says the approved terms and the Gulf date answers are kept in memory for the session only');
check(/flip cards/i.test(pv) && /descriptions/.test(pv.slice(pv.indexOf('What a new report\'s files hold'))), 'A2-P6. PRIVACY.md says the flip cards\' script holds the measures\' descriptions (what a new report\'s files hold)');

// R README.md: the MCP runs Microsoft's validator on the reports it writes
check(!/It does not run on the reports you make\./.test(flat('../README.md')), 'A2-R1. README.md says Microsoft\'s validator does not run on the reports you make (the MCP runs it on each report before writing it)');

// W2 (an outside review of the public repo and dataarcus.com, 21 Oct; mcp/work/W2.md): each public sentence it found
// untrue, one check each
const home = { en: flat('../index.html'), ar: flat('../ar/index.html'), tr: flat('../assets/js/translations/homepage.js') };
for (const [k, t] of Object.entries(home)) {
  check(!/free and official/i.test(t) && !/مجانيًا، ومن Microsoft نفسها/.test(t), `W2-1a. ${k}: the home page says AI report generation is "free and official"`);
  check(!/Every number validated against the source/.test(t) && !/كل رقم مُطابق مع المصدر/.test(t), `W2-1b. ${k}: the home page's badge says every number is validated against the source`);
}
check(/Microsoft and others now offer AI tools/.test(home.en) && /تقدّم Microsoft وغيرها/.test(home.ar), 'W2-1a. the home page (EN and AR) says what is true: Microsoft and others offer AI report tools');
// (changed on purpose, 21 Oct: the outside review's GO IF: the badge says format, so it can't read as checking the numbers)
check(/Report files checked with Microsoft's format validator/.test(home.en) && /ملفات التقارير تُفحص بمدقّق التنسيق من Microsoft/.test(home.ar), 'W2-1b. the home page badge (EN and AR) says the report files are checked with Microsoft\'s format validator');
const rootReadme = flat('../README.md');
check(!/\(findings\/\)/.test(rootReadme), 'W2-2. README.md links findings/, a folder that does not exist');
check(!/\b\d+ website test suites\b/.test(rootReadme), 'W2-2. README.md gives a website suite count that goes stale');
check(/DataArcus MCP runs it on your machine on each report before it is written/.test(rootReadme), 'W2-2. README.md keeps the wave\'s validator sentence');
const spec = flat('./PRODUCT_SPEC.md');
check(/## The 11 tools/.test(spec) && !/The 6 tools/.test(spec), 'W2-3. PRODUCT_SPEC.md says 6 tools (0.3.0 has 11)');
for (const t of ['approve_plan', 'add_gulf_calendar', 'read_report', 'check_report', 'create_arabic_twin']) check(new RegExp('\\| `' + t + '` \\|').test(spec), `W2-3. PRODUCT_SPEC.md's tool table has no ${t} row`);
check(!/Not yet \(planned\):\*\* the Gulf calendar pack/.test(spec) && /Arabic calendar/.test(spec), 'W2-3. PRODUCT_SPEC.md says the Gulf calendar is planned, or says nothing of the Arabic calendar columns (C1)');
check(!/It doesn't translate\./.test(spec) && /never translates silently/.test(spec) && /approves/.test(spec), 'W2-3. PRODUCT_SPEC.md says the translation truth (Claude drafts, the person approves, never silent)');
const mreadme = flat('./README.md');
// (G1, 0.3.1: the tool table moved from mcp/README.md to mcp/TOOLS.md, text unchanged; the checks of its rows moved with it)
const mtools = flat('./TOOLS.md');
check(/into: "same"/.test(mtools) && /\(EN-AR\)/.test(mtools), 'W2-4. mcp/TOOLS.md documents create_arabic_twin into "same" (the EN-AR copy)');
check(/Arabic calendar\.tmdl/.test(mtools) && /English calendar columns/.test(mtools), 'W2-4. mcp/TOOLS.md documents the Arabic calendar columns script (C1) and the English columns until it is applied');
check(/certutil -hashfile/.test(mreadme) && /Get-FileHash/.test(mreadme), 'W2-4. mcp/README.md says how to check the .mcpb\'s SHA-256 on Windows');
check(/Node\.js 20\.10/.test(mreadme) && /\bgit\b/.test(mreadme) && /spaces/.test(mreadme), 'W2-4. mcp/README.md lists the developer install\'s prerequisites and quoting a path with spaces');
check(/2\.159\.883\.0/.test(mreadme) && !/to the latest version/.test(mreadme) && !/to its latest version/.test(mreadme), 'W2-4. mcp/README.md names the lowest Desktop version tested, not "latest"');

// The forbidden words, in every file that speaks for DataArcus (EN and AR): no "first"/"only" of its kind, no
// official, certified, partner, AI-powered; nothing on Microsoft's Power BI Report skill comparison; nothing of 0.3.1
const SPEAK = ['./PRIVACY.md', './README.md', './TOOLS.md', '../README.md', './server.mjs', './lib/agent-text.mjs', './skills/report-design/SKILL.md',
  './lib/approval-window.mjs', '../power-bi-mcp/index.html', '../ar/power-bi-mcp/index.html', '../assets/js/translations/beta-page.js'];
const BANNED = [
  [/\b(?:world'?s|our) first\b|\bthe first (?:MCP|tool|Power BI tool|of its kind)\b|\bfirst of its kind\b|\bonly (?:tool|MCP) (?:that|to|for)\b|\bthe only (?:tool|MCP|one that)\b/i, 'a first-of-kind or only-one claim'],
  [/\bofficial\b(?! (?:weekend|announcement|Ramadan|dates?|Microsoft))/i, '"official" said of DataArcus'],
  [/\bcertified\b|\bpartner(?:ed|ship)?\b|\bAI[- ]powered\b/i, 'certified, partner or AI-powered'],
  [/الأول من نوعه|الوحيد من نوعه|الأداة الوحيدة|شريك|معتمد من|مدعوم بالذكاء/, 'the same in Arabic'],
  [/Power BI Report skill|powerbi-report skill/i, 'Microsoft\'s Power BI Report skill (the comparison is not approved)', 'skip-skill'],
  [/(?:unlike|compared (?:to|with)|better than|instead of) Microsoft'?s? (?:Power BI )?Report skill/i, 'a comparison with Microsoft\'s Power BI Report skill (not approved)'],
  // (0.3.1 L6, 25 Oct: the DAX function library is built in 0.3.1, behind daxFunctions: its name taken off this list on
  // purpose, said in mcp/work/L6.md; the other 0.3.1 names stay)
  [/render_report|VS Code extension|VS Code marketplace|\.vsix|Skills for Fabric|see the result/i, 'a 0.3.1 feature']
];
// (SKILL.md names Microsoft's skill as the companion tool for edits, older text: a reference, not a comparison; the
// comparison pattern below still runs on it)
for (const f of SPEAK) {
  const t = f === './server.mjs' ? serverSource().replace(/\s+/g, ' ') : flat(f);   // (0.3.1 S9: server.mjs is its tools/ and lib/ parts too)
  for (const [re, what, skip] of BANNED) { if (skip && f.includes('SKILL')) continue; const m = re.exec(t); check(!m, `A2-W. ${f}: ${what}: "${m ? t.slice(Math.max(0, m.index - 40), m.index + 60) : ''}"`); }
}

// (0.3.1 RB, item 5: an outside architecture review) check_report never opens Power BI Desktop: it runs Microsoft's
// validator offline, the schemas and DataArcus's measured rules. No answer it builds says the report opens in Desktop or
// is not broken as the result of a check (a measured Desktop fact, like a kind's own sentence, is not such a claim).
{
  const CHECK_SAID = ['./lib/check-report.mjs', './lib/arabic-lens.mjs', './lib/agent-text.mjs', './tools/check_report.mjs', './TOOLS.md'];
  const OLD = [/the report opens in Power BI Desktop/i, /it is not broken/i, /passes the checks that ran/i, /; Desktop opens the report with/i, /a report Desktop opens is not broken/i, /Nothing found that breaks the report/i];
  for (const f of CHECK_SAID) { const t = flat(f); for (const re of OLD) { const m = re.exec(t); check(!m, `RB-5. ${f} says, as a check's result, what only Power BI Desktop can show: "${m ? t.slice(Math.max(0, m.index - 40), m.index + 80) : ''}"`); } }
}

// W (0.3.1 wave 3, 25 Oct; mcp/work/W.md): the article "Is your Power BI report ready for Arabic?" in English, its Arabic
// copy and its translations: the forbidden words as above, then each public sentence the article must keep true (a
// missing file fails its checks)
const W_FILES = ['../articles/article-power-bi-report-ready-for-arabic.html', '../ar/articles/article-power-bi-report-ready-for-arabic.html', '../assets/js/translations/article-power-bi-report-ready-for-arabic.js'];
const maybe = (f) => { try { return flat(f); } catch (e) { return ''; } };
for (const f of W_FILES) {
  const t = maybe(f);
  for (const [re, what] of BANNED) { const m = re.exec(t); check(t && !m, `W-0. ${f}: ${t ? what + ': "' + (m ? t.slice(Math.max(0, m.index - 40), m.index + 60) : '') + '"' : 'missing'}`); }
}
const W = { en: maybe(W_FILES[0]), ar: maybe(W_FILES[1]) };
// W-1 the lens comes with DataArcus 0.3.1 (0.3.0 has none)
check(/check_report/.test(W.en) && /DataArcus 0\.3\.1/.test(W.en) && /0\.3\.0 has no/.test(W.en), 'W-1. the English article does not say the Arabic lens comes with DataArcus 0.3.1 (and not with 0.3.0)');
check(/check_report/.test(W.ar) && /0\.3\.1/.test(W.ar) && /0\.3\.0/.test(W.ar), 'W-1. the Arabic article does not say the lens comes with 0.3.1 (and not with 0.3.0)');
// W-2 the numbers only as L1 measured them, said as on four made-up reports
check(/four made-up reports/.test(W.en) && /\b18 findings\b/.test(W.en) && /\b14 of them\b/.test(W.en) && /\b13 findings\b/.test(W.en) && /\b4 findings\b/.test(W.en), 'W-2. the English article does not give L1\'s numbers (18, 14 of them, 13, 4) on four made-up reports');
check(/أربعة تقارير مختلقة/.test(W.ar) && /18 ملاحظة/.test(W.ar) && /14 منها/.test(W.ar) && /13 ملاحظة/.test(W.ar) && /4 ملاحظات/.test(W.ar), 'W-2. the Arabic article does not give the same numbers on four made-up reports');
// W-3 the privacy line
check(/reads the report's files on your computer/.test(W.en) && /never your data/.test(W.en) && /changes nothing/.test(W.en), 'W-3. the English article lacks the privacy line (reads the files on your computer, never your data, changes nothing)');
check(/يقرأ ملفات التقرير على جهازك/.test(W.ar) && /لا يقرأ بياناتك/.test(W.ar) && /لا يغيّر شيئًا/.test(W.ar), 'W-3. the Arabic article lacks the privacy line');
// W-4 nothing promised for the matrix: today only the order of its measures; no sentence on the matrix says soon/coming/will/planned
const matrixSaid = (t, re) => t.split(/(?<=[.؟!:])\s+/).filter((s) => re.test(s));
check(/only the order of its measures/.test(W.en) && !matrixSaid(W.en, /\bmatri(?:x|ces)\b/i).some((s) => /\b(?:soon|coming|will|planned|next (?:version|release))\b/i.test(s)), 'W-4. the English article promises something for the matrix, or lacks "only the order of its measures"');
check(/ترتيب مقاييسها فقط/.test(W.ar) && !matrixSaid(W.ar, /المصفوف/).some((s) => /قريبًا|سنضيف|سيصبح|ستصبح|مخطط له|الإصدار القادم/.test(s)), 'W-4. the Arabic article promises something for the matrix, or lacks "ترتيب مقاييسها فقط"');
// W-5 "no right-to-left support" sourced on Microsoft Learn, in both languages
for (const [k, t] of Object.entries(W)) check(/learn\.microsoft\.com\/power-bi\/fundamentals\/supported-languages-countries-regions/.test(t), `W-5. the ${k} article does not link Microsoft Learn's supported-languages page for Desktop's right-to-left support`);
// W-6 no headline with first, only, official or free (title, h1, og:title, twitter:title)
for (const [k, t] of Object.entries(W)) {
  const heads = [...t.matchAll(/<title>([^<]*)<\/title>|<h1[^>]*>([^<]*)<\/h1>|property="og:title" content="([^"]*)"|name="twitter:title" content="([^"]*)"/g)].map((m) => m.slice(1).find(Boolean) || '');
  check(heads.length >= 4 && !heads.some((h) => /\b(?:first|only|official|free)\b|الأول|الوحيد|رسمي|مجان/i.test(h)), `W-6. the ${k} article's headlines are missing or say first, only, official or free: ${JSON.stringify(heads)}`);
}

// D5 (0.3.1 wave 5, 25 Oct; mcp/work/D5.md): every public sentence the release-prep sweep added, one check each, and the
// forbidden words over the texts it touched that the scan above does not read (PRODUCT_SPEC, llms.txt, the CHANGELOG's
// [Unreleased])
// (A1, 0.3.1) each tool's row now sits under its own "## `tool`" heading in TOOLS.md: a row also ends where the next
// heading starts (" #"); the rows read are the same text as before
const mrow = (tool) => (mtools.match(new RegExp(`\\| \`${tool}\` \\| (.*?) \\|(?: \\| \`| \\*\\*| #|$)`)) || [])[1] || '';
// D5-R the MCP README: the 0.3.1 options in their tools' rows, the plugin folder said as not published
check(/languages: "en\+ar"/.test(mrow('plan_layout')) && /bilingual/.test(mrow('plan_layout')), 'D5-R1. mcp/TOOLS.md\'s plan_layout row does not document languages: "en+ar" (and its bilingual answer)');
check(/languages: "en\+ar"/.test(mrow('create_report')) && /after them, each page's Arabic page/.test(mrow('create_report')) && /off by default/.test(mrow('create_report')), 'D5-R2. mcp/TOOLS.md\'s create_report row does not say what languages: "en+ar" writes (off by default)');
check(/draws each Arabic page/.test(mrow('create_arabic_twin')) && /button slicers \(pills\)/.test(mrow('create_arabic_twin')), 'D5-R3. mcp/TOOLS.md\'s create_arabic_twin row does not say the approval page draws the Arabic pages, nor that the copy keeps button slicers (pills) in sync');
check(/`mcp\/skills-packaging\/`/.test(mreadme) && /[Nn]ot published yet/.test(mreadme) && /same `\.mcpb`/.test(mreadme), 'D5-R4. mcp/README.md does not name the plugin folder as not published yet (it starts the same .mcpb)');
// D5-P PRIVACY.md: what each 0.3.1 path reads and writes
check(/`lens: "arabic"`/.test(row('check_report')) && /writes nothing/.test(row('check_report')), 'D5-P1. PRIVACY.md\'s check_report row does not say what the Arabic lens returns and that it writes nothing');
check(/`languages: "en\+ar"`/.test(pl) && /`bilingual`/.test(pl) && /`sample`/.test(pl), 'D5-P2. PRIVACY.md\'s plan_layout row does not name languages "en+ar" (bilingual) and the sample');
check(/`sample: true`/.test(cr) && /made-up/.test(cr) && /never a row/.test(cr) && /`languages: "en\+ar"`/.test(cr), 'D5-P3. PRIVACY.md\'s create_report row does not say the sample writes a made-up project (never a row in the answer) and what languages "en+ar" returns');
check(/draws each Arabic page/.test(pv) && /the same `\.mcpb`/.test(pv), 'D5-P4. PRIVACY.md does not say the approval page draws the twin\'s Arabic pages on your computer, nor that the plugin installs the same .mcpb');
check(/Checked against 0\.3\.1/.test(pv.slice(0, 600)), 'D5-P5. PRIVACY.md\'s header is not checked against 0.3.1');
// D5-S PRODUCT_SPEC.md: 0.3.1's three options said, and the platforms as the release says them
check(/0\.3\.1/.test(spec) && /`lens: "arabic"`/.test(spec) && /`languages: "en\+ar"`/.test(spec) && /`sample: true`/.test(spec), 'D5-S1. PRODUCT_SPEC.md says nothing of 0.3.1 (the Arabic lens, languages "en+ar", the sample)');
check(/Writes Power BI projects on Windows, macOS and Linux; open them in Power BI Desktop on Windows, or deploy the project to Fabric/.test(spec), 'D5-S2. PRODUCT_SPEC.md does not say the platforms in the release\'s words');
// D5-L llms.txt: the agent's line says both languages and the Arabic check
const llms = flat('../llms.txt');
check(/English, Arabic, or both in one report/.test(llms) && /ready for Arabic/.test(llms), 'D5-L1. llms.txt\'s DataArcus for Power BI line says nothing of one report in both languages or the Arabic check');
// D5-B the beta page's tool lines: 0.3.1's options said as 0.3.1's (the download is still 0.3.0 until the release)
const tl = (lang, key) => { const L = bp.slice(bp.indexOf(lang === 'en' ? '"en"' : '"ar"')), part = L.slice(L.indexOf('"tools": {')); const m = new RegExp(`"${key}": "((?:[^"\\\\]|\\\\.)*)"`).exec(part); return m ? m[1] : ''; };
check(/From 0\.3\.1/.test(tl('en', 'check_report')) && /ready for Arabic/.test(tl('en', 'check_report')) && /0\.3\.1/.test(tl('ar', 'check_report')), 'D5-B1. beta-page check_report (EN, AR) does not say the Arabic lens comes with 0.3.1');
check(/From 0\.3\.1/.test(tl('en', 'plan_layout')) && /English and Arabic/.test(tl('en', 'plan_layout')) && /0\.3\.1/.test(tl('ar', 'plan_layout')), 'D5-B2. beta-page plan_layout (EN, AR) does not say one report in English and Arabic comes with 0.3.1');
check(EN.html.includes('From 0.3.1') && AR.html.includes('0.3.1'), 'D5-B3. the MCP page (EN, AR) does not carry the 0.3.1 tool lines (scripts/ar-pages.mjs --write and the page)');
// D5-W the forbidden words, a Mac claim and a matrix promise, over the texts this sweep touched
const unrel = (read('./CHANGELOG.md').match(/^## \[Unreleased\][^\n]*\n([\s\S]*?)(?=^## )/m) || [])[1] || '';
const D5_TEXTS = { 'PRODUCT_SPEC.md': spec, 'llms.txt': llms, 'CHANGELOG [Unreleased]': unrel.replace(/\s+/g, ' ') };
for (const [f, t] of Object.entries(D5_TEXTS)) {
  for (const [re, what] of BANNED) { const m = re.exec(t); check(t && !m, `D5-W. ${f}: ${t ? what + ': "' + (m ? t.slice(Math.max(0, m.index - 40), m.index + 60) : '') + '"' : 'empty'}`); }
}
const MAC = /runs? Power BI (?:Desktop )?on (?:a )?Mac|Power BI Desktop (?:on|for) macOS|يشغّل Power BI على Mac/i;
for (const [f, t] of Object.entries(Object.assign({}, D5_TEXTS, { 'mcp/README.md': mreadme, 'mcp/TOOLS.md': mtools, 'PRIVACY.md': pv, 'beta-page.js': bp }))) {
  const m = MAC.exec(t); check(!m, `D5-W. ${f} says DataArcus runs Power BI on a Mac: "${m ? t.slice(Math.max(0, m.index - 40), m.index + 60) : ''}"`);
}
const promises = unrel.replace(/\s+/g, ' ').split(/(?<=[.:])\s+/).filter((s) => /\bmatri(?:x|ces)\b/i.test(s) && /\b(?:soon|coming|will (?:be|get|read|mirror)|planned|next (?:version|release))\b/i.test(s));
check(!promises.length, `D5-W. the CHANGELOG's [Unreleased] promises something for the matrix: "${promises[0] || ''}"`);
check(!/\bfree\b/i.test((unrel.match(/\*\*[^*]+\*\*/g) || []).join(' ')), 'D5-W. a bold lead in the CHANGELOG\'s [Unreleased] says "free"');

// GC (0.3.1 wave 6, 25 Oct; mcp/work/GC.md): the outside audit of the Gulf calendar's public claims. Each false or
// unsupported sentence it found is banned from the files that carried it (EN and AR), and each new sentence is required
const GC = { article: flat('../articles/article-gulf-calendar-power-bi.html'), articleAr: flat('../ar/articles/article-gulf-calendar-power-bi.html'), articleTr: flat('../assets/js/translations/article-gulf-calendar-power-bi.js'),
  page: flat('../tools/dax-calendar-table-generator.html'), pageAr: flat('../ar/tools/dax-calendar-table-generator.html'), pageTr: flat('../assets/js/translations/calendar-generator.js'),
  mcp: flat('./lib/gulf-calendar.mjs'), health: flat('../assets/js/gulf-health.js'), questions: flat('./lib/gulf-date-questions.mjs') };
const GC_BANNED = [
  [/pick the fixed weekend that matches it|فاختر العطلة الثابتة المطابقة لها/, 'GC-1a. "pick the fixed weekend that matches it" (false for Sharjah, Friday to Sunday)'],
  [/updates by itself every day|يتحدث تلقائيًا كل يوم|never need updating|لا تحتاج أي تحديث/, 'GC-1b. the relative offsets "update every day" / "never need updating" (TODAY moves only on a refresh)'],
  [/it shows in check_model_health's gulfCalendar section/, 'GC-1c. "it shows in check_model_health\'s gulfCalendar section" (the check has no other country\'s dates)'],
  [/refreshes instantly|ويتحدث فورًا/, 'GC-8. "refreshes instantly" (not measured)'],
  [/We checked every UAE announcement|راجعنا كل إعلانات الإمارات/, 'GC-7. "we checked every UAE announcement" (3 Eid al-Adha dates have no dated announcement)'],
  [/in (?:about )?a minute|في دقيقة/, 'GC-8. "in a minute" (not measured)'],
  [/Friday before Monday|والجمعة قبل الاثنين/, 'GC-8. "Friday before Monday" (in Arabic الاثنين sorts first)'],
  [/the right weekend|the Right Weekend|العطلة الصحيحة/, 'GC-8. "the right weekend" (the flag knows the weekend only)'],
  [/gets all of it right|يضبط كل ذلك/, 'GC-8. "gets all of it right"'],
  [/A complete Power BI date table|جدول تواريخ Power BI كامل/, 'GC-8. "a complete date table"'],
  [/changes everything in your numbers|يغيّر كل شيء في أرقامك/, 'GC-8. "Ramadan changes everything in your numbers"'],
  [/No announced dates are sourced for ' \+ C\.name/, 'GC-2. gulf-health says no dates are sourced for any country but the UAE and Saudi Arabia (Oman\'s are)']
];
for (const [f, t] of Object.entries(GC)) for (const [re, what] of GC_BANNED) { const m = re.exec(t); check(!m, `${what}: ${f}: "${m ? t.slice(Math.max(0, m.index - 40), m.index + 80) : ''}"`); }
for (const [f, t] of Object.entries(GC)) for (const [re, what] of BANNED.slice(0, 1).concat([BANNED[3]])) { const m = re.exec(t); check(!m, `GC-W. ${f}: ${what}: "${m ? t.slice(Math.max(0, m.index - 40), m.index + 60) : ''}"`); }
// the new sentences, in both languages where the public reads them
for (const [k, t] of [['article', GC.article], ['articleTr', GC.articleTr]]) {
  check(/Sharjah government/.test(t) && /Is Weekend and Is Working Day columns' DAX/.test(t), `GC-1a. ${k}: Sharjah's own option and how to set another weekend are not said`);
  check(/once DataArcus has added it/.test(t), `GC-6. ${k}: "generate again after an announcement" does not say it helps once DataArcus's table has the date`);
  check(/24 come from a dated announcement/.test(t) && /confirmed by the official celebrations/.test(t), `GC-7. ${k}: the 24 dated announcements and the 3 Eid al-Adha dates are not said`);
  check(/Oman announced 11 of them a day later/.test(t) && /Qatar, Kuwait and Bahrain/.test(t), `GC-2. ${k}: whose announced dates they are (the UAE's; Oman 11 a day later) is not said`);
  check(/public holidays/.test(t), `GC-5. ${k}: the working-day flag's scope is not said`);
}
for (const [k, t] of [['articleAr', GC.articleAr], ['articleTr', GC.articleTr]]) {
  check(/حكومة الشارقة/.test(t) && /Is Weekend وIs Working Day/.test(t), `GC-1a. ${k}: Sharjah's option and another weekend, in Arabic`);
  check(/بعد أن تضيفه DataArcus/.test(t) && /24 منها من إعلان مؤرَّخ/.test(t) && /أعلنت عُمان 11 منها بعد يوم/.test(t) && /قطر والكويت والبحرين/.test(t) && /العطل الرسمية/.test(t) && /والأربعاء قبل الثلاثاء/.test(t),
    `GC-1..8. ${k}: a new Arabic sentence is missing (DataArcus adds the date, 24 dated, Oman 11 a day later, Qatar Kuwait Bahrain, public holidays, the sort example)`);
}
for (const [k, t] of [['page', GC.page], ['pageTr', GC.pageTr]]) check(/move on with each refresh/.test(t) && /Sharjah govt/.test(t) && /public holidays/.test(t) && /Oman announced 11 of them a day later/.test(t), `GC-1b/3/5/2. ${k}: the refresh, Sharjah, the working-day scope or Oman's 11 dates are not said`);
for (const [k, t] of [['pageAr', GC.pageAr], ['pageTr', GC.pageTr]]) check(/تتقدم مع كل تحديث/.test(t) && /حكومة الشارقة/.test(t) && /العطل الرسمية/.test(t) && /أعلنت عُمان 11 منها بعد يوم/.test(t), `GC-1b/3/5/2. ${k}: the same in Arabic`);
check(/only as a note/.test(GC.mcp) && /of them a day later/.test(GC.mcp), 'GC-1c. add_gulf_calendar\'s note does not say what the check does for another country (only as a note) and Oman\'s days a day later');

// GC2 (0.3.1 wave 6, 25 Oct; mcp/work/GC2.md): the audit's sentences still unsupported after GC, each sourced or
// softened. The old sentence is banned from every GC file; the new one (or its source link) is required where it stands
const GC2_BANNED = [
  [/knows January to December and one weekend|يعرف الأشهر من يناير إلى ديسمبر وعطلة واحدة/, 'GC2-1. "a standard date table knows January to December and one weekend"'],
  [/the report shows trends that are really|أظهر التقرير اتجاهات/, 'GC2-2. "the report shows trends that are really the calendar" (a possibility, not a promise)'],
  [/gets wrong in the Gulf|يخطئ فيها التقويم/, 'GC2-3. "four things a standard calendar gets wrong"'],
  [/Shopping builds up in the days before|يزداد الشراء في الأيام التي تسبق/, 'GC2-5. "shopping builds up before Eid" (no source)'],
  [/often matter more than Eid itself|كثيرًا ما تكون أهم من العيد/, 'GC2-5. "the days before Eid often matter more than Eid itself" (no source)'],
  [/fall in a different Gregorian month from one year to the next|في شهر ميلادي مختلف من سنة إلى أخرى/, 'GC2-5. "a different Gregorian month every year" (Eid al-Fitr 2025 and 2026 are both in March)']
];
for (const [f, t] of Object.entries(GC)) for (const [re, what] of GC2_BANNED) { const m = re.exec(t); check(!m, `${what}: ${f}: "${m ? t.slice(Math.max(0, m.index - 40), m.index + 80) : ''}"`); }
const LEARN_AUTO = /learn\.microsoft\.com\/(?:ar-sa\/)?power-bi\/transform-model\/desktop-auto-date-time/;
const LEARN_SORT = /learn\.microsoft\.com\/(?:ar-sa\/)?power-bi\/create-reports\/desktop-tips-and-tricks-for-creating-reports#sort-by-another-column/;
const UAE_HOLIDAYS = /u\.ae\/en\/information-and-services\/public-holidays-and-religious-affairs\/public-holidays/;
const README = /scripts\/gulf-calendar\/test-model\/README\.md/;
const MCP_LINK = /understand the Gulf calendar[^<]{0,40}<a href=['"]\/power-bi-mcp\/['"]/, MCP_LINK_AR = /تفهم التقويم الخليجي[^<]{0,40}<a href=['"]\/(?:ar\/)?power-bi-mcp\/['"]/;
const GC2_EN = [
  [/Power BI's own date table \(auto date\/time\) has Gregorian years, quarters, months and days, and nothing about the weekend, Hijri months or Ramadan/, 'GC2-1. the auto date/time sentence'],
  [LEARN_AUTO, 'GC2-1. its Microsoft Learn link'],
  [/the report can show trends that are really the calendar/, 'GC2-2. "can show"'],
  [/Four things a standard calendar doesn't know in the Gulf/, 'GC2-3. the heading'],
  [UAE_HOLIDAYS, 'GC2-4. the UAE public holidays link for "Eid is a window"'],
  [/If your sales build up in the days before Eid/, 'GC2-5. the conditional Eid sentence (list)'],
  [/If your sales build up before Eid/, 'GC2-5. the conditional Eid sentence (the measure)'],
  [LEARN_SORT, 'GC2-9. the Microsoft Learn link for the alphabetical sort'],
  [README, 'GC2-6. the test model README link'],
  [MCP_LINK, 'GC2-8. the MCP page link at the end']
];
const GC2_AR = [
  [/جدول التواريخ التلقائي في Power BI \(auto date\/time\) فيه السنوات والأرباع والأشهر والأيام الميلادية، ولا شيء عن عطلة نهاية الأسبوع أو الأشهر الهجرية أو رمضان/, 'GC2-1. the auto date/time sentence (AR)'],
  [LEARN_AUTO, 'GC2-1. its Microsoft Learn link (AR)'],
  [/قد يُظهر التقرير اتجاهات/, 'GC2-2. "can show" (AR)'],
  [/أربعة أمور لا يعرفها التقويم المعتاد في الخليج/, 'GC2-3. the heading (AR)'],
  [UAE_HOLIDAYS, 'GC2-4. the UAE public holidays link (AR)'],
  [/إذا كانت مبيعاتك تزداد في الأيام التي تسبق العيد/, 'GC2-5. the conditional Eid sentence (list, AR)'],
  [/إذا كانت مبيعاتك تزداد قبل العيد/, 'GC2-5. the conditional Eid sentence (the measure, AR)'],
  [LEARN_SORT, 'GC2-9. the Microsoft Learn link for the alphabetical sort (AR)'],
  [README, 'GC2-6. the test model README link (AR)'],
  [MCP_LINK_AR, 'GC2-8. the MCP page link at the end (AR)']
];
const enHalf = (t) => t.split(/"ar": \{/)[0], arHalf = (t) => t.split(/"ar": \{/)[1] || '';
for (const [k, t] of [['article', GC.article], ['articleTr', enHalf(GC.articleTr)]]) for (const [re, what] of GC2_EN) check(re.test(t), `${what}: ${k}: missing`);
for (const [k, t] of [['articleAr', GC.articleAr], ['articleTr', arHalf(GC.articleTr)]]) for (const [re, what] of GC2_AR) check(re.test(t), `${what}: ${k}: missing`);
for (const [k, t] of [['article', GC.article], ['articleAr', GC.articleAr]]) {
  const pub = (/"datePublished": "(\d{4})-(\d{2})-(\d{2})"/.exec(t) || []).slice(1).map(Number);
  const months = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
  const en = /Posted on (\w+) (\d+), (\d{4})/.exec(t), ar = /نُشر في (\d+) (\S+) (\d{4})/.exec(t);
  const said = k === 'article' ? (en ? [Number(en[3]), months[en[1]], Number(en[2])] : []) : (ar ? [Number(ar[3]), { 'أكتوبر': 10 }[ar[2]], Number(ar[1])] : []);
  check(pub.length === 3 && said.join('-') === pub.join('-'), `GC2-7. ${k}: the "Posted on" date (${said.join('-')}) is not its datePublished (${pub.join('-')})`);
}
for (const [k, t] of [['page', GC.page], ['pageAr', GC.pageAr], ['pageTr', GC.pageTr]]) {
  if (k !== 'pageAr') check(MCP_LINK.test(enHalf(t)), `GC2-8. ${k}: the CTA's "DataArcus builds Power BI reports ..." has no link to the MCP page`);
  if (k !== 'page') check(MCP_LINK_AR.test(k === 'pageTr' ? arHalf(t) : t), `GC2-8. ${k}: the CTA's "DataArcus builds Power BI reports ..." has no link to the MCP page`);
  check(!/Measured in Power BI Desktop 2\.158|قسناه في Power BI Desktop 2\.158/.test(t) || /DESKTOP-TESTS\.md, "DAX FORMAT with Arabic locales"/.test(t), `GC2-10. ${k}: the FORMAT measurement does not name its DESKTOP-TESTS.md section`);
}

// (the owner, 25 Oct: "do what is more correct") the Is Eid al-Adha column keeps 10 to 13 Dhu al-Hijjah, the day of Eid
// and the days of Tashreeq (haj.gov.sa: "days of Eid"); the article says the columns are the days of Eid, not a
// country's public holidays (u.ae: the UAE's Eid al-Adha holiday is 10 to 12), so its two numbers do not contradict
const HAJ = /haj\.gov\.sa\/(?:en|ar)\/Hajj\/Days-of-Al-Tashreeq/;
for (const [k, t] of [['article', GC.article], ['articleTr', enHalf(GC.articleTr)]]) {
  check(HAJ.test(t) && /the day of Eid and the three days of Tashreeq/.test(t), `Eid al-Adha 10-13: ${k}: the days of Tashreeq and their haj.gov.sa source are missing`);
  check(/They mark the days of Eid, not a country's public holidays: the UAE's Eid al-Adha holiday, for example, is 10 to 12 Dhu al-Hijjah/.test(t), `Eid al-Adha 10-13: ${k}: "the days of Eid, not a country's public holidays" is missing`);
}
for (const [k, t] of [['articleAr', GC.articleAr], ['articleTr', arHalf(GC.articleTr)]]) {
  check(HAJ.test(t) && /يوم العيد وأيام التشريق الثلاثة/.test(t), `Eid al-Adha 10-13: ${k}: the days of Tashreeq and their haj.gov.sa source are missing (AR)`);
  check(/يحددان أيام العيد لا العطلات العامة في كل دولة/.test(t), `Eid al-Adha 10-13: ${k}: "the days of Eid, not a country's public holidays" is missing (AR)`);
}

// AF1 (0.3.1, the release audit's honest limits): each new PRIVACY.md sentence, and the code it describes
{
  const model = read('./lib/model.mjs'), server = read('./server.mjs'), twinTexts = read('./lib/twin-texts.mjs'), twinPreview = read('./lib/twin-preview.mjs'), preview = read('../assets/js/page-preview.js');
  check(/The server does this once, when it starts, for the folder you chose in the settings only \(never a chain of folders\); nothing inside it is written without your approval\./.test(pv)
    && /if \(ROOT && !fs\.existsSync\(ROOT\) && isDir\(path\.dirname\(ROOT\)\)\) \{ try \{ fs\.mkdirSync\(ROOT\); \}/.test(model) && (server.match(/prepareRoot\(\)/g) || []).length === 1,
    'AF1-P1. PRIVACY.md section 4 does not say the server makes the chosen working folder once at start (its parent there, never a chain), or the code no longer does exactly that');
  check(/DataArcus checks a file or folder right before it writes, renames or removes it; another program changing the same place at that same instant is outside what it can check\./.test(pv),
    'AF1-P2. PRIVACY.md section 4 does not say the check right before each write, rename or removal, and the same-instant limit');
  check(/The same holds for a report measure a visual shows as text \(such as the empty state's message\): its fixed texts are returned so their Arabic can be approved, the rest of its DAX is not\./.test(pv)
    && /kind: 'measureText', text: b\.template/.test(twinTexts),
    'AF1-P3. PRIVACY.md section 3 does not say the twin returns a text measure\'s fixed texts (the empty state), or the twin no longer lists them');
  check(/A chart whose title is a DataArcus "Top N" title measure \(named "Title: \.\.\."\) is drawn there with the text that measure's DAX shows when every category is shown, read from the plan's own `reportExtensions\.json`; it is drawn on the page only, never put in an answer\./.test(pv)
    && /\\bIF \\\( _s = _n, "/.test(preview) && /\^Title: \//.test(preview) && /reportExtensions\\\.json\$/.test(twinPreview),
    'AF1-P4. PRIVACY.md section 3 does not say the approval page draws a Top N title measure\'s text, or the page no longer reads it from reportExtensions.json');
}
// DS1 (0.3.1, 25 Oct; mcp/work/DS1.md): an outside fact-check found four public sentences stronger than the truth. The
// old sentence is banned from the files that carried it (EN and AR); the new one, with its source link, is required
const DS1 = { lic: flat('../articles/article-power-bi-licensing-guide.html'), licAr: flat('../ar/articles/article-power-bi-licensing-guide.html'), licTr: flat('../assets/js/translations/article-power-bi-licensing-guide.js'),
  home: home.en, homeAr: home.ar, homeTr: home.tr, mcp: EN.html, mcpAr: AR.html, mcpTr: bp.replace(/\s+/g, ' ') };
const DS1_BANNED = [
  [/removes both limits|ويرفع PPU أو السعة كلا القيدين/, 'DS1-1. "PPU or capacity removes both limits" (PPU: 100 GB, 48 a day; a capacity: by SKU, 48 a day)'],
  [/not the rows in it, and write a new report|لا صفوف البيانات، وتكتب تقريرًا/, 'DS1-2. the homepage FAQ says only "structure, not the rows" (report texts are sent too)'],
  [/never returns data values from your model to Claude|ولا يُرسل أي قيمة من بيانات نموذجك إلى Claude أبدًا/, 'DS1-2. the MCP page says "never returns data values" as an absolute'],
  [/Arabic reports with no English titles|تقارير عربية بلا عناوين إنجليزية/, 'DS1-3. "Arabic reports with no English titles"']
];
for (const [f, t] of Object.entries(DS1)) for (const [re, what] of DS1_BANNED) { const m = re.exec(t); check(!m, `${what}: ${f}: "${m ? t.slice(Math.max(0, m.index - 40), m.index + 80) : ''}"`); }
const LEARN_PPU = /learn\.microsoft\.com\/(?:ar-sa\/)?fabric\/enterprise\/powerbi\/service-premium-per-user-faq/;
const LEARN_PLAN = /learn\.microsoft\.com\/(?:ar-sa\/)?power-bi\/guidance\/powerbi-implementation-planning-subscriptions-licenses-trials/;
const PRIV = /href=['"]https:\/\/github\.com\/Antnioo\/DataArcus\/blob\/main\/mcp\/PRIVACY\.md['"]/;
const PRIV3 = /github\.com\/Antnioo\/DataArcus\/blob\/main\/mcp\/PRIVACY\.md#3-metadata-only-no-data-values/;
const CLIENTS = /github\.com\/Antnioo\/DataArcus\/blob\/main\/mcp\/README\.md#other-mcp-clients-and-platforms-developers/;
const DS1_EN = { lic: [[/PPU or capacity raises both limits: PPU allows models up to 100 GB and 48 scheduled refreshes a day; on a Fabric capacity the model size depends on its SKU, with 48 scheduled refreshes a day/, 'DS1-1. the PPU and capacity limits'], [LEARN_PPU, 'DS1-1. the PPU FAQ link'], [LEARN_PLAN, 'DS1-1. the licenses comparison link']],
  home: [[/the short texts typed on report pages \(titles, text boxes\), which can hold a figure or a name; never table rows, filter or slicer values, or bookmark states/, 'DS1-2. the exact metadata sentence'], [PRIV, 'DS1-2. PRIVACY.md link (the site test reads it as ending in mcp/PRIVACY.md)']],
  mcp: [[/which can hold a figure or a name\. Never table rows, filter or slicer values, or bookmark states/, 'DS1-2. the exact metadata sentence'], [PRIV3, 'DS1-2. PRIVACY.md section 3 link'],
    [/Arabic titles in Arabic reports, even from an English-named model/, 'DS1-3. the Arabic titles heading'], [/Anything kept in English is listed, with why, before you approve/, 'DS1-3. what is kept in English'],
    [/Claude Code, VS Code \(agent mode\) or Cursor, on Windows, macOS or Linux/, 'DS1-4. the other clients'], [CLIENTS, 'DS1-4. the README setup notes link'], [/VS Code and Cursor not yet tried/, 'DS1-4. tried as the README says'], [/one-click \.mcpb is for Windows/, 'DS1-4. the .mcpb stays Windows']] };
const DS1_AR = { lic: [[/ويزيد PPU أو السعة كلا الحدّين: يسمح PPU بنماذج حتى 100 غيغابايت و48 تحديثًا مجدولًا يوميًا، وفي سعة Fabric يتوقف حجم النموذج على فئة السعة \(SKU\) مع 48 تحديثًا مجدولًا يوميًا/, 'DS1-1. the PPU and capacity limits (AR)'], [LEARN_PPU, 'DS1-1. the PPU FAQ link (AR)'], [LEARN_PLAN, 'DS1-1. the licenses comparison link (AR)']],
  home: [[/والنصوص القصيرة المكتوبة في صفحات التقرير \(العناوين ومربعات النص\) وقد تحمل رقمًا أو اسمًا؛ ولا ترسل أبدًا صفوف الجداول ولا قيم الفلاتر أو المقسمات (?:\(Slicers\) )?ولا حالات الإشارات المرجعية/, 'DS1-2. the exact metadata sentence (AR)'], [PRIV, 'DS1-2. PRIVACY.md link (AR)']],
  mcp: [[/وقد تحمل رقمًا أو اسمًا\. ولا يرسل أبدًا صفوف الجداول ولا قيم الفلاتر أو المقسمات ولا حالات الإشارات المرجعية/, 'DS1-2. the exact metadata sentence (AR)'], [PRIV3, 'DS1-2. PRIVACY.md section 3 link (AR)'],
    [/عناوين عربية في التقارير العربية، حتى من نموذج بأسماء إنجليزية/, 'DS1-3. the Arabic titles heading (AR)'], [/وكل ما يبقى بالإنجليزية تذكره الخطة، مع السبب، قبل موافقتك/, 'DS1-3. what is kept in English (AR)'],
    [/Claude Code أو VS Code \(وضع الوكيل\) أو Cursor، على Windows أو macOS أو Linux/, 'DS1-4. the other clients (AR)'], [CLIENTS, 'DS1-4. the README setup notes link (AR)'], [/ولم يُجرَّب VS Code وCursor بعد/, 'DS1-4. tried as the README says (AR)'], [/ملف \.mcpb للتثبيت بنقرة واحدة فهو لـ Windows/, 'DS1-4. the .mcpb stays Windows (AR)']] };
const halves = (t, page) => page === 'home' ? [t.split(/\bar: \{/)[0], t.split(/\bar: \{/)[1] || ''] : [enHalf(t), arHalf(t)];
for (const page of ['lic', 'home', 'mcp']) {
  const [trEn, trAr] = halves(DS1[page + 'Tr'], page);
  for (const [k, t] of [[page, DS1[page]], [page + 'Tr', trEn]]) for (const [re, what] of DS1_EN[page]) check(re.test(t), `${what}: ${k}: missing`);
  for (const [k, t] of [[page + 'Ar', DS1[page + 'Ar']], [page + 'Tr', trAr]]) for (const [re, what] of DS1_AR[page]) check(re.test(t), `${what}: ${k}: missing`);
}

// SQ8 (0.3.1, 26 Oct; mcp/work/SQ8.md): the website's seen items, each sourced
// GC2-S4 Umm al-Qura: not called "official" without a source; the calculated Saudi Hijri calendar, its tables licensed
// from the Saudi government (Microsoft Learn, UmAlQuraCalendar), linked in EN and AR
const UAQ = /learn\.microsoft\.com\/(?:ar-sa\/)?dotnet\/api\/system\.globalization\.umalquracalendar/;
for (const [f, t] of Object.entries(GC)) { const m = /Saudi Arabia's official calculated calendar|التقويم المحسوب الرسمي في السعودية/.exec(t); check(!m, `SQ8 GC2-S4. Umm al-Qura called official with no source: ${f}`); }
for (const [k, t] of [['article', GC.article], ['articleTr', enHalf(GC.articleTr)]]) check(/Umm al-Qura, Saudi Arabia's calculated Hijri calendar, whose tables are licensed from the Saudi government/.test(t) && UAQ.test(t), `SQ8 GC2-S4. ${k}: the Umm al-Qura sentence or its Microsoft Learn link is missing`);
for (const [k, t] of [['articleAr', GC.articleAr], ['articleTr', arHalf(GC.articleTr)]]) check(/تقويم أم القرى، التقويم الهجري المحسوب في السعودية، وجداوله مرخّصة من الحكومة السعودية/.test(t) && UAQ.test(t), `SQ8 GC2-S4. ${k}: the Umm al-Qura sentence or its Microsoft Learn link is missing (AR)`);
// GC-S1 the Gulf calendar's share image says what the article says today (its description), with no "free" and no
// "right weekend"; the JPG is regenerated (not the old picture)
{
  const shots = read('../scripts/make-share-images.mjs'), gulf = (shots.match(/\['gulf-calendar',[^\n]*/) || [''])[0].replace(/\\'/g, "'");
  const desc = (GC.article.match(/<meta name="description" content="A Power BI date table for the Gulf in DAX: ([^"]+)" \/>/) || [])[1] || '';
  check(gulf && !/right weekend|free/i.test(gulf), `SQ8 GC-S1. the Gulf share image still says "right weekend" or "free": ${gulf.slice(0, 160)}`);
  check(desc && gulf.includes(`sub: '${desc.charAt(0).toUpperCase() + desc.slice(1)}'`), `SQ8 GC-S1. the share image's line is not the article's description ("${desc}")`);
  const jpg = createHash('sha256').update(fs.readFileSync(new URL('../assets/img/og/gulf-calendar.jpg', import.meta.url))).digest('hex');
  check(jpg !== '0da0d2e25ad3069f2deefaaa6dd6e51ec3c236791edde580891d721ca0306a46', 'SQ8 GC-S1. assets/img/og/gulf-calendar.jpg is still the old picture');
}
// DS1-S3 the licensing guide and the cost calculator, re-checked against Microsoft on 26 Oct 2026: every figure follows
// from the prices the weekly check keeps (assets/data/powerbi-prices.json: the Power BI pricing page and Azure's Retail
// Prices API, East US) and, for the UAE, Azure's Retail Prices API for uaenorth (read 26 Oct: 0.22 a CU hour, 1,146 a
// CU year reserved); a creator needs Pro or PPU (Microsoft Learn, subscriptions, licenses and trials)
{
  const P = JSON.parse(read('../assets/data/powerbi-prices.json')), H = 730, UAE = { cu: 0.22, resYear: 1146 }, AED = 3.6725, SAR = 3.75;
  const usd = (n) => '$' + Math.round(n).toLocaleString('en-US'), two = (n) => (Math.round(n * 100) / 100).toFixed(2);
  const f64 = 64 * P.cuPayg * H, f64r = f64 * (1 - P.reservedSaving), uae = 64 * UAE.cu * H, uaeR = 64 * UAE.resYear / 12;
  const want = [`$${P.pro} per user per month`, `$${P.ppu} per user per month`, `$${P.cuPayg} per capacity unit per hour`, `about ${(P.reservedSaving * 100).toFixed(1)}% less`,
    `about ${usd(f64)} a month pay-as-you-go`, `about ${usd(f64r)} a month with a one-year reservation`, `about ${Math.ceil(f64r / P.pro)} viewers`, `about ${Math.ceil(f64 / P.pro)} viewers`,
    `212 × $${P.pro} = ${usd(212 * P.pro)}`, `${usd(f64r)} + ${usd(12 * P.pro)} = ${usd(f64r + 12 * P.pro)}`, `462 × $${P.pro} = ${usd(462 * P.pro)}`,
    `add-on of $${P.ppuAddon} per user per month`, `AED ${two(P.pro * AED)} or SAR ${two(P.pro * SAR)} for Pro`, `AED ${two(P.ppu * AED)} or SAR ${two(P.ppu * SAR)} for PPU`,
    `$${UAE.cu} an hour pay-as-you-go in UAE North`, `about ${usd(uae)} a month pay-as-you-go, or about ${usd(uaeR)} with a one-year reservation`, `to about ${Math.ceil(uaeR / P.pro)} viewers`,
    'checked 26 October 2026', 'Report creators always need Pro or PPU'];
  const plain = (t) => t.replace(/<[^>]+>/g, '');
  for (const [k, t] of [['lic', plain(DS1.lic)], ['licTr', plain(enHalf(DS1.licTr))]]) for (const w of want) check(t.includes(w), `SQ8 DS1-S3. ${k}: "${w}" is not said`);
  for (const [k, t] of [['licAr', DS1.licAr], ['licTr', arHalf(DS1.licTr)]]) check(/تمت مراجعتها في 26 أكتوبر 2026/.test(t) && /ومنشئو التقارير يحتاجون دائمًا إلى Pro أو PPU/.test(t), `SQ8 DS1-S3. ${k}: the check date or the creators' licence (AR)`);
  const calc = { calc: flat('../tools/power-bi-licensing-cost-calculator.html'), calcAr: flat('../ar/tools/power-bi-licensing-cost-calculator.html'), calcTr: flat('../assets/js/translations/licensing-calculator.js') };
  for (const [k, t] of Object.entries(calc)) check(!/Creators always need Pro\.|المنشئون يحتاجون Pro دائمًا\./.test(t), `SQ8 DS1-S3. ${k}: "creators always need Pro" (Pro or PPU)`);
  for (const [k, t] of [['calc', calc.calc], ['calcTr', calc.calcTr]]) check(/Creators always need Pro or PPU\./.test(t) && t.includes(`$${UAE.cu} against $${P.cuPayg}`) && t.includes(`AED ${two(P.pro * AED)} or SAR ${two(P.pro * SAR)}`), `SQ8 DS1-S3. ${k}: the creators' licence or the UAE and peg figures`);
  for (const [k, t] of [['calcAr', calc.calcAr], ['calcTr', calc.calcTr]]) check(/المنشئون يحتاجون Pro أو PPU دائمًا\./.test(t), `SQ8 DS1-S3. ${k}: the creators' licence (AR)`);
}
// SQ9 (0.3.1, the Seen batch "tool texts and public claims"; mcp/work/SQ9.md): the package's own words checked against
// the code: the plan kinds (Plans.ALLOWS), the gallery's limits, rule 7, the tools' limits and the privacy sentences
{
  const { planSources, NO_DIRECT_EDITS, writingTools } = await import('./lib/agent-text.mjs');
  const { ALLOWS } = await import('./lib/plans.mjs');
  const { LIMITS } = await import('./lib/tool-limits.mjs');
  const { createRequire } = await import('node:module');
  const Gallery = createRequire(import.meta.url)('../assets/js/visual-gallery.js');
  const ps = planSources();
  // C-S1 every plan kind is named by the tool and option that give it, never by the kind's own key
  check(Object.keys(ALLOWS).every((k) => !ps.includes(`(from ${k})`)), `SQ9 C-S1. approve_plan names a plan source by its kind's key: ${ps}`);
  check(ps.includes('create_report (from plan_layout with redesignFrom)'), `SQ9 C-S1. approve_plan does not name the redesign's plan (plan_layout with redesignFrom): ${ps}`);
  const skills = { 'mcp/skills': flat('./skills/report-design/SKILL.md'), 'mcp/skills-packaging': flat('./skills-packaging/plugins/dataarcus/skills/report-design/SKILL.md') };
  for (const [where, s] of Object.entries(skills)) {
    // A2-S11 the options the skill did not name
    check(/`metricSwitcher`/.test(s) && /2 to 5 of the model's measures/.test(s), `SQ9 A2-S11. ${where} SKILL.md: no metricSwitcher line (2 to 5 measures, the field parameter's script)`);
    check(/`arabicTerms`/.test(s) && /terminology sheet/.test(s) && /`terms`/.test(s), `SQ9 A2-S11. ${where} SKILL.md: no terminology sheet line (arabicTerms, the twin's terms)`);
    check(/`gulfDates`/.test(s) && /askNext/.test(s) && /never answer a question yourself/i.test(s), `SQ9 A2-S11. ${where} SKILL.md: no gulfDates line (askNext, the person's own answers)`);
    // A2-S12 the gallery's limits, from the code
    check(!/of few members/.test(s) && !/with few members/.test(s), `SQ9 A2-S12. ${where} SKILL.md: the gallery's limits are still "few members"`);
    check(s.includes(`at most ${Gallery.MAX_STEPS} members`) && s.includes(`at most ${Gallery.MAX_PANELS} panels`) && /a time or ordered axis/.test(s), `SQ9 A2-S12. ${where} SKILL.md: the waterfall (${Gallery.MAX_STEPS} members), small multiples (${Gallery.MAX_PANELS} panels) and combo (time or ordered axis) limits are not said`);
    // S1-S2 rule 7 in the skill's Rules
    const rules = s.slice(s.indexOf('## Rules'));
    check(s.indexOf('## Rules') >= 0 && rules.includes(NO_DIRECT_EDITS.slice(0, 60)), `SQ9 S1-S2. ${where} SKILL.md: the Rules do not carry rule 7 ("${NO_DIRECT_EDITS.slice(0, 60)}...")`);
    // D5-S1 (the skill's own privacy line): read_report returns no static title since 0.3.0 S1
    check(!/short, screened titles and texts/.test(s) && /never a static title/.test(s), `SQ9 D5-S1. ${where} SKILL.md: the privacy line says read_report returns titles`);
  }
  const readme = flat('./README.md');
  check(readme.includes(NO_DIRECT_EDITS.slice(0, 60)), 'SQ9 S1-S2. mcp/README.md does not carry rule 7');
  // 0.2.9-design-S8 the README's annotations line says the two idempotent tools
  check(/`check_model_health` and `add_gulf_calendar` are also `idempotentHint: true`/.test(readme), 'SQ9 0.2.9-design-S8. mcp/README.md does not say which tools are idempotentHint true');
  // W2-S4 PRODUCT_SPEC's tool rows and rule 4
  const spec = read('./PRODUCT_SPEC.md'), row = (t) => (spec.split('\n').find((l) => l.startsWith(`| \`${t}\` |`)) || '').split(' | ');
  for (const t of writingTools()) check(/approve/.test(row(t)[3] || ''), `SQ9 W2-S4. PRODUCT_SPEC.md: ${t}'s Writes cell names no approved plan: "${(row(t)[3] || '').slice(0, 120)}"`);
  check(!/^nothing/.test(row('check_model_health')[3] || ''), 'SQ9 W2-S4. PRODUCT_SPEC.md: check_model_health "Writes: nothing" (it writes its fix scripts after approval)');
  check((row('suggest_fields')[1] || '').includes(`1-${LIMITS.kpiCards}`), `SQ9 W2-S4. PRODUCT_SPEC.md: suggest_fields' KPI cards are not 1-${LIMITS.kpiCards}: "${row('suggest_fields')[1]}"`);
  check(/planId/.test(row('plan_layout')[2] || ''), 'SQ9 W2-S4. PRODUCT_SPEC.md: plan_layout returns no planId in its row');
  const r4 = flat('./PRODUCT_SPEC.md').split('4. **Metadata only.**')[1] || '';
  check(!/short titles and texts as typed/.test(r4.slice(0, 600)) && /never a static title/.test(r4.slice(0, 600)), 'SQ9 W2-S4. PRODUCT_SPEC.md rule 4 still says "short titles and texts as typed" (read_report: text boxes, never a static title)');
  // D5-S1 the plugin's README
  const pk = flat('./skills-packaging/README.md'), priv = pk.slice(pk.indexOf('## Privacy'), pk.indexOf('## Licence'));
  check(!/short titles, screened/.test(priv) && /never a static title/.test(priv) && /text boxes/.test(priv), `SQ9 D5-S1. skills-packaging/README.md Privacy: ${priv.slice(0, 300)}`);
  // A2-S7 the package's description names no list of tools (it had four of eleven)
  const desc = JSON.parse(read('./package.json')).description;
  check(!/suggest fields|create a report project/.test(desc) && !/:/.test(desc) && !/\b(first|only|official|free)\b/i.test(desc), `SQ9 A2-S7. mcp/package.json's description lists tools (or says first/only/official/free): "${desc}"`);
}

if (problems.length) { console.log(`FAIL  0.3.0-claims  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  0.3.0-claims  ${checks} checks`);
