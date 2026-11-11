// 0.3.2 SP20 (the split: B-280, B-286; mcp/work/SP20.md). A characterisation suite for each page's language
// (mcp/lib/check-report.mjs's language section, moved to mcp/lib/check-language.mjs): pageLanguages and filledLanguages
// for 12 made-up reports, and check_report's whole answer on 4 of them, are the ones recorded on the base
// (integration/0.3.2 0eb9eb9, before the move). Recorded in fixtures/sp20-languages.json (the languages as JSON, the
// answers as sha256); SP20_RECORD=1 records them again (only on the base, never to make a run pass); SP20_DUMP=<file>
// writes the JSON. The reports are written by this script in a temp folder. Made-up reports only.
//   L1  pageLanguages(inv, R, fallback) for fallback 'en', 'ar' and null: { pages, by }
//   F1  filledLanguages(inv, R): { pages, by }
//   K1  check_report's whole answer (checkReport with its defaults) on 4 reports, the temp folder's name written out
//   X1  no text of a report (text boxes, titles, button texts) appears in any answer or in the languages
//   C1  the cases tell pages by every kind: buttons, links, texts, report
//   after the move: P1 check-report.mjs re-exports check-language.mjs's pageLanguages and filledLanguages (the same
//   functions);  P2 check-report.mjs defines none of the language section's names
//   node test-0.3.2-sp20.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
import { withoutBrief } from './fixtures/ox2-pins.mjs';   // (0.3.3 OX2: its own section left out, pinned by ox2)
const BRIEF_TALLY = { had: 0, noted: 0 };
const GOLD = path.join(HERE, 'fixtures', 'sp20-languages.json');

// the working folder first: the library modules read DATAARCUS_ROOT when they are loaded
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sp20-')));
process.env.DATAARCUS_ROOT = ROOT;
const CR = await import('./lib/check-report.mjs');
const RR = await import('./lib/read-report.mjs');

// ---------- the made-up reports (PBIR folders) ----------
const lit = (v) => ({ expr: { Literal: { Value: v } } });
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const TEXTS = [];   // every text written into a visual: none may come back
const said = (s) => { TEXTS.push(s); return s; };
const pos = (i) => ({ x: 20 + 30 * i, y: 20 + 60 * i, z: 1000 * (i + 1), height: 50, width: 300, tabOrder: 1000 * (i + 1) });
const textbox = (name, i, text) => ({ name, position: pos(i), visual: { visualType: 'textbox', objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: said(text) }] }] } }] } } });
const card = (name, i, title, extra) => ({ name, position: pos(i), visual: Object.assign({ visualType: 'card',
  query: { queryState: { Values: { projections: [{ field: { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Amount' } }, queryRef: 'Sales.Amount', nativeQueryRef: 'Amount' }] } } },
  visualContainerObjects: Object.assign(title == null ? {} : { title: [{ properties: { show: lit('true'), text: lit(q(said(title))) } }] }, extra || {}) }) });
const button = (name, i, text, to) => ({ name, position: pos(i), visual: { visualType: 'actionButton',
  objects: { text: [{ properties: { show: lit('true') } }, { properties: { text: lit(q(said(text))) }, selector: { id: 'default' } }] },
  visualContainerObjects: { visualLink: [{ properties: { show: lit('true'), type: lit("'PageNavigation'"), navigationSection: lit(q(to)) } }] } } });
const tipOf = (to) => ({ visualTooltip: [{ properties: { show: lit('true'), type: lit("'ReportPage'"), section: lit(q(to)) } }] });
const drillOf = (to) => ({ visualLink: [{ properties: { show: lit('true'), type: lit("'Drillthrough'"), drillthroughSection: lit(q(to)) } }] });
// a page: [id, displayName, visuals, extra page.json]
const page = (id, displayName, visuals, extra) => ({ id, displayName, visuals, extra });
const SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/';
const write = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); };
function makeReport(name, pages) {
  const dir = path.join(ROOT, name, name + '.Report'), def = path.join(dir, 'definition');
  write(path.join(dir, 'definition.pbir'), { $schema: SCHEMA.replace('report/definition/', 'report/definitionProperties/') + '2.0.0/schema.json', version: '4.0', datasetReference: { byPath: { path: '../' + name + '.SemanticModel' } } });
  write(path.join(def, 'version.json'), { $schema: SCHEMA + 'versionMetadata/1.0.0/schema.json', version: '2.0.0' });
  write(path.join(def, 'report.json'), { $schema: SCHEMA + 'report/2.1.0/schema.json', themeCollection: {}, settings: { useStylableVisualContainerHeader: true } });
  write(path.join(def, 'pages', 'pages.json'), { $schema: SCHEMA + 'pagesMetadata/1.0.0/schema.json', pageOrder: pages.map((p) => p.id), activePageName: pages.length ? pages[0].id : undefined });
  pages.forEach((p) => {
    write(path.join(def, 'pages', p.id, 'page.json'), Object.assign({ $schema: SCHEMA + 'page/2.0.0/schema.json', name: p.id, displayName: p.displayName, displayOption: 'FitToPage', width: 1280, height: 720 }, p.extra || {}));
    p.visuals.forEach((v) => write(path.join(def, 'pages', p.id, 'visuals', v.name, 'visual.json'), Object.assign({ $schema: SCHEMA + 'visualContainer/2.1.0/schema.json' }, v)));
  });
  return name + '/' + name + '.Report';
}
const TIP = { type: 'Tooltip', width: 320, height: 240 };
const DRILL = { pageBinding: { name: 'drill1', type: 'Drillthrough', parameters: [] } };
const REPORTS = {
  english: [page('en1', 'Sales overview', [textbox('t1', 0, 'Quarterly revenue by region'), card('c1', 1, 'Total amount')]),
    page('en2', 'Details', [card('c2', 0, 'Orders this year')])],
  arabic: [page('ar1', 'نظرة عامة', [textbox('t1', 0, 'المبيعات حسب المنطقة في هذا الربع'), card('c1', 1, 'إجمالي المبلغ')]),
    page('ar2', 'التفاصيل', [card('c2', 0, 'الطلبات هذا العام')])],
  // the EN-AR copy: each English page and its Arabic copy, a language button each way (the English page's reads in Arabic)
  enArCopy: [page('p1', 'Overview', [textbox('t1', 0, 'Revenue summary for the quarter'), button('b1', 1, 'العربية', 'p1ar')]),
    page('p2', 'Products', [card('c1', 0, 'Units sold'), button('b2', 1, 'العربية', 'p2ar')]),
    page('p1ar', 'Overview AR', [textbox('t1', 0, 'Revenue summary'), button('b1', 1, 'English', 'p1')], { visibility: 'HiddenInViewMode' }),
    page('p2ar', 'Products AR', [card('c1', 0, 'Units'), button('b2', 1, 'English', 'p2')], { visibility: 'HiddenInViewMode' })],
  // a tooltip page with no text of its own, reached only from Arabic pages
  tooltipFromArabic: [page('a1', 'الرئيسية', [textbox('t1', 0, 'ملخص الأداء الشهري'), card('c1', 1, 'المبيعات', tipOf('tip'))]),
    page('a2', 'المنتجات', [card('c2', 0, 'الكمية', tipOf('tip'))]),
    page('tip', '7', [card('c3', 0, null)], TIP)],
  // a drillthrough page reached from English pages, its name in neither script
  drillthrough: [page('d1', 'Summary', [textbox('t1', 0, 'Pipeline by stage'), card('c1', 1, 'Open deals', drillOf('dt'))]),
    page('dt', '123', [card('c2', 0, null)], DRILL)],
  hebrew: [page('h1', 'סקירה', [textbox('t1', 0, 'הכנסות לפי אזור ברבעון'), card('c1', 1, 'סך הכל')]),
    page('h2', 'Overview', [textbox('t2', 0, 'Revenue by region this quarter')])],
  noText: [page('n1', '1', [card('c1', 0, null)]), page('n2', '2', [])],
  // mixed titles: one page's titles half Arabic half English; another's English name over Arabic titles
  mixedTitles: [page('m1', 'Page A1', [card('c1', 0, 'المبيعات الشهرية'), card('c2', 1, 'Monthly sales total')]),
    page('m2', 'Sales', [card('c3', 0, 'إجمالي الطلبات'), card('c4', 1, 'متوسط السعر')]),
    page('m3', 'لوحة', [textbox('t1', 0, 'Executive summary'), card('c5', 1, 'العملاء')])],
  // a language button one way only, and a pair of buttons in the same script
  oneWayButtons: [page('o1', 'Start', [button('b1', 0, 'العربية', 'o2')]), page('o2', 'Second', [card('c1', 0, 'Count of orders')]),
    page('s1', 'Next A', [button('b2', 0, 'Next page', 's2')]), page('s2', 'Next B', [button('b3', 0, 'Previous page', 's1')])],
  // Arabic pages linking a page that English pages link too: the links disagree
  linksDisagree: [page('l1', 'الملخص', [textbox('t1', 0, 'ملخص المبيعات'), button('b1', 1, 'التفاصيل', 'shared')]),
    page('l2', 'Summary', [textbox('t2', 0, 'Sales summary'), button('b2', 1, 'See the details', 'shared')]),
    page('shared', '0', [card('c1', 0, null)])],
  // an EN-AR copy with Hebrew: the button on the Latin page reads in Hebrew
  enHeCopy: [page('e1', 'Home', [textbox('t1', 0, 'Welcome to the dashboard'), button('b1', 1, 'עברית', 'e1he')]),
    page('e1he', 'Home HE', [card('c1', 0, null), button('b2', 1, 'English', 'e1')])],
  empty: []
};
const ANSWERED = ['english', 'enArCopy', 'tooltipFromArabic', 'mixedTitles'];

const got = {}, dirs = {};
for (const [name, pages] of Object.entries(REPORTS)) {
  dirs[name] = makeReport(name, pages);
  const loc = RR.locate(dirs[name], 'check_report'), inv = RR.inventory(RR.diskSource(loc, { big: [], deep: 0 }), path.basename(loc.reportDir)), { R } = CR.rulesInput(inv);
  for (const fb of ['en', 'ar', null]) got[`L1:${name}:${fb}`] = CR.pageLanguages(inv, R, fb);
  got[`F1:${name}`] = CR.filledLanguages(inv, R);
}
const answers = {};
for (const name of ANSWERED) {
  const a = withoutBrief(await CR.checkReport(dirs[name], {}), BRIEF_TALLY);
  answers[name] = JSON.stringify(a).split(path.basename(ROOT)).join('<root>').split(JSON.stringify(ROOT).slice(1, -1)).join('<root>');
}
const record = { languages: got, answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, sha(v)])) };
if (process.env.SP20_DUMP) fs.writeFileSync(process.env.SP20_DUMP, JSON.stringify({ languages: got, answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, JSON.parse(v)])) }, null, 1) + '\n');
if (process.env.SP20_RECORD) {
  fs.writeFileSync(GOLD, JSON.stringify(Object.assign({ about: 'SP20: each page\'s language (pageLanguages, filledLanguages) for 12 made-up reports, and sha256 of check_report\'s whole answer on 4, recorded on integration/0.3.2 0eb9eb9 (before the language section moved); test-0.3.2-sp20.mjs' }, record), null, 1) + '\n');
}
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8'));
const differ = (prefix) => Object.keys(gold.languages).filter((k) => k.startsWith(prefix)).filter((k) => JSON.stringify(gold.languages[k]) !== JSON.stringify(got[k]));
const extra = Object.keys(got).filter((k) => !(k in gold.languages));
chk(() => !extra.length && differ('L1:').length === 0, () => `L1: pageLanguages differs from the base for ${differ('L1:').concat(extra).join(', ')}`);
chk(() => differ('F1:').length === 0, () => `F1: filledLanguages differs from the base for ${differ('F1:').join(', ')}`);
const ansDiff = Object.keys(gold.answers).filter((k) => gold.answers[k] !== record.answers[k]);
chk(() => ansDiff.length === 0 && Object.keys(gold.answers).length === ANSWERED.length, () => `K1: check_report's answer differs from the base for ${ansDiff.join(', ')}`);
// X1: no text of the reports comes back (the page names are check_report's own, capped and cleaned: not checked here)
const all = JSON.stringify(got) + Object.values(answers).join('');
const leaked = TEXTS.filter((t) => t.length >= 6 && all.includes(t));
chk(() => TEXTS.length >= 30 && leaked.length === 0, () => `X1: ${leaked.length} of ${TEXTS.length} texts of the reports appear in an answer (lengths ${leaked.map((t) => t.length).join(', ')})`);
// C1: the cases tell pages by every kind, and give every language (read from the answers, not the case names)
const kinds = new Set(), langs = new Set();
Object.entries(got).filter(([k]) => k.startsWith('L1:')).forEach(([, v]) => { Object.keys(v.by).forEach((b) => kinds.add(b)); Object.values(v.pages).forEach((l) => langs.add(l)); });
chk(() => ['buttons', 'links', 'texts', 'report'].every((k) => kinds.has(k)) && ['en', 'ar', 'he'].every((l) => langs.has(l))
  && got['L1:enArCopy:null'].by.buttons === 4 && got['L1:tooltipFromArabic:null'].pages.tip === 'ar' && got['L1:drillthrough:null'].pages.dt === 'en' && Object.keys(got['L1:empty:en'].pages).length === 0,
() => `C1: the cases tell pages by buttons, links, texts and the report's language, in English, Arabic and Hebrew: ${[...kinds]} / ${[...langs]}`);

// ---------- after the move ----------
let L = null;
try { L = await import('./lib/check-language.mjs'); } catch (e) { L = null; }
if (L) {
  chk(() => CR.pageLanguages === L.pageLanguages && CR.filledLanguages === L.filledLanguages && typeof L.langOfTexts === 'function',
  () => 'P1: check-report.mjs re-exports check-language.mjs\'s pageLanguages and filledLanguages (the same functions); langOfTexts is exported there');
  const src = fs.readFileSync(path.join(HERE, 'lib', 'check-report.mjs'), 'utf8');
  chk(() => !/(^|\n)\s*(export\s+)?(const|function|let)\s+(AR_LETTERS|HE_LETTERS|LAT_LETTERS|langOfTexts|litOfS|plainOf|linkTo|buttonText|titleOf|pageLanguages|filledLanguages)\b/.test(src)
    && !/AR_LETTERS = /.test(src) && /from '\.\/check-language\.mjs'/.test(src),
  () => 'P2: check-report.mjs imports the language section from check-language.mjs and defines none of it');
}

try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* a temp folder */ }
// (0.3.3 OX2, on purpose) the answers above are compared without OX2's own section (fixtures/ox2-pins.mjs): the 4 reports made from scratch name no model folder: no briefCheck, one notChecked line each
chk(() => BRIEF_TALLY.had === 0 && BRIEF_TALLY.noted === 4, () => `OX2: the answers that carry briefCheck and the notChecked lines, 0 and 4: ${JSON.stringify(BRIEF_TALLY)}`);
if (problems.length) { console.log(`FAIL script=test-0.3.2-sp20.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp20  ${checks - problems.length}/${checks} checks`); process.exit(1); }
console.log(`PASS  sp20  ${checks} checks`);
