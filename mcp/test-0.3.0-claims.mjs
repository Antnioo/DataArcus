// node test-0.3.0-claims.mjs
// (0.3.0 A2, the claims re-check of the 0.3.0 wave, 20 Oct 2026; mcp/work/A2.md) every sentence DataArcus says about
// itself must be true in the code. One check per sentence A2 found untrue and fixed (each failed before its fix), and the
// forbidden-words scan over every file that speaks for DataArcus (English and Arabic).
import fs from 'node:fs';
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
const mrow = (tool) => (mtools.match(new RegExp(`\\| \`${tool}\` \\| (.*?) \\|(?: \\| \`| \\*\\*|$)`)) || [])[1] || '';
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

if (problems.length) { console.log(`FAIL  0.3.0-claims  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  0.3.0-claims  ${checks} checks`);
