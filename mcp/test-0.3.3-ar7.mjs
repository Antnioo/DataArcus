// AR7 (0.3.3; the owner, 12 Nov, D-1112-05: Arabic wording that Microsoft and Google both use is approved, with both
// sources; written red first): the glossary, its check, the Arabic count and the approved lines.
//   G  the term sheet says why each term stands (both use it, the owner's own, one source only), with Microsoft's and
//      Google's word and source for a "both"; content/ARABIC-GLOSSARY.md is the sheet rendered; the style guide points
//      to both; mcp/work/AR7-ARABIC.md holds the 37 items, each APPROVED or HELD
//   K  the check names the file, the key and the word (a planted wrong word in a translations file and in a lib table)
//   C  the one Arabic count: CLDR's six forms (Intl.PluralRules('ar') and the rule written out agree), source and .min.js
//   S  the approved lines, typed here (not read from the code): the missing-table reason, the two-models sentence
//      (the website's worker in a vm, source and .min.js), the two model-path errors with nothing to list; what is
//      held stays English
// Made-up names only. No network.
//   node test-0.3.3-ar7.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as T from './lib/arabic-terms.mjs';
import { wordOf } from './lib/read-words.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..'), JS = path.join(ROOT, 'assets', 'js');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const J = (x) => JSON.stringify(x);

// ---- G the sheet, the glossary, the style guide, the item table ----
const C = T.CONCEPTS;
chk(() => typeof T.approvalProblem === 'function' && C.every((c) => !T.approvalProblem(c)),
  () => `G1. every concept says why it stands, a "both" with Microsoft's and Google's word, source and date: ${C.map((c) => [c.id, T.approvalProblem && T.approvalProblem(c)]).filter((x) => x[1] !== null).map((x) => x.join(': ')).join('; ')}`);
chk(() => ['visual', 'measure', 'report', 'page', 'filters', 'slicer', 'model', 'column', 'table', 'relationship', 'field'].every((id) => C.some((c) => c.id === id)),
  () => `G2. the glossary starts from the brief's terms: ${C.map((c) => c.id).join()}`);
chk(() => C.filter((c) => c.approval === 'D-1112-05').length >= 10 && C.find((c) => c.id === 'relationship').approval === 'one source' && C.find((c) => c.id === 'slicer').approval === 'owner' && C.find((c) => c.id === 'slicer').ar === 'مقسم',
  () => 'G3. a term both use is marked so (10 at least); a model relationship has one source; the owner\'s «مقسم» stays his');
const md = T.glossaryMd ? T.glossaryMd() : null, file = fs.existsSync(path.join(ROOT, 'content/ARABIC-GLOSSARY.md')) ? rd('content/ARABIC-GLOSSARY.md') : '';
chk(() => md && file === md, () => 'G4. content/ARABIC-GLOSSARY.md is the sheet rendered (node scripts/arabic-glossary.mjs --write)');
chk(() => C.every((c) => file.split('\n').filter((l) => l.startsWith(`| ${c.id} |`) && l.includes(`| ${c.ar} |`)).length === 1), () => 'G5. one row per concept, with its Arabic');
const style = rd('content/ARABIC-STYLE.md');
chk(() => /^## Approval \(D-1112-05\)$/m.test(style) && /ARABIC-GLOSSARY\.md/.test(style) && /arabic-terms/.test(style) && /Microsoft/.test(style) && /Google/.test(style), () => 'G6. the style guide has "Approval (D-1112-05)", pointing to the glossary and the check');
const table = fs.existsSync(path.join(ROOT, 'mcp/work/AR7-ARABIC.md')) ? rd('mcp/work/AR7-ARABIC.md') : '';
const IDS = ['1001', '1003', '1004', '1005', '1006', '1020', '1034', '1036', '1037', '1038', '1039', '1040', '1041', '1045', '1046', '1047', '1048', '1049', '1050', '1052', '1053', '1054', '1055', '1056', '1057', '1058', '1059',
  '1069', '1167', '1665', '1677', '1678', '1679', '1680', '1681', '1682', '1709'];
const rows = table.split('\n').filter((l) => l.startsWith('| I-1112-'));
chk(() => IDS.length === 37 && rows.length === 37 && IDS.every((id) => rows.filter((l) => l.startsWith(`| I-1112-${id} |`)).length === 1), () => `G7. the item table has the brief's 37 items, one row each (${rows.length})`);
chk(() => rows.every((l) => /^(APPROVED|HELD)\b/.test(l.split(' | ')[5] || '')), () => `G8. every row is APPROVED or HELD: ${rows.filter((l) => !/^(APPROVED|HELD)\b/.test(l.split(' | ')[5] || '')).map((l) => l.slice(2, 13)).join()}`);
chk(() => rows.filter((l) => /^APPROVED/.test(l.split(' | ')[5])).every((l) => /[ء-ي"]/.test(l.split(' | ')[6] || '')), () => 'G9. an approved row gives its final Arabic');

// ---- K the check names the file, the key and the word ----
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'da-ar7-'));
try {
  fs.mkdirSync(path.join(tmp, 'assets/js/translations'), { recursive: true }); fs.mkdirSync(path.join(tmp, 'mcp/lib'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'assets/js/translations/planted.js'), 'window.plantedTranslations = {\n  ar: {\n    "heroTitle": "تقرير جاهز",\n    "heroLead": "افتح عوامل التصفية ثم اختر",\n    wrapped:\n      "كل العناصر المرئية في الصفحة",\n  }\n};\n');
  fs.writeFileSync(path.join(tmp, 'mcp/lib/planted.mjs'), "const WHY = {\n  empty: ['empty file', 'ملف فارغ'],\n  noSlicer: ['no slicer', 'لا يوجد مقسّم طريقة العرض'], other: ['x', 'جدول']\n};\nexport const said = (n) => `في ${n} من لوحات التحكم`;\n");
  const hits = T.repoHits(tmp), all = Object.values(hits).flat();
  chk(() => (hits.filters || []).length === 1 && /^assets\/js\/translations\/planted\.js:4 key heroLead «عوامل التصفية» \(sheet: «الفلاتر»\)$/.test(hits.filters[0]), () => `K1. a wrong word in a translations file: the file, the key and the word: ${J(hits.filters)}`);
  chk(() => (hits.visual || []).length === 1 && /planted\.js:6 key wrapped «العناصر المرئية»/.test(hits.visual[0]), () => `K2. a text wrapped under its key names that key: ${J(hits.visual)}`);
  chk(() => (hits.slicer || []).length === 1 && /^mcp\/lib\/planted\.mjs:3 key noSlicer «مقسم طريقة العرض»/.test(hits.slicer[0]), () => `K3. a wrong word in a lib table names the entry's key, not the next one on the line: ${J(hits.slicer)}`);
  chk(() => (hits.dashboard || []).length === 1 && /^mcp\/lib\/planted\.mjs:5 «لوحات التحكم»/.test(hits.dashboard[0]), () => `K4. a sentence built in code has no key: the file, the line and the word: ${J(hits.dashboard)}`);
  chk(() => all.length === 4, () => `K5. the right words («تقرير», «ملف», «جدول») pass: ${J(all)}`);
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
chk(() => T.fileHits('<p>افتح عوامل التصفية</p>')[0].key === null && T.fileHits('  "a1": "x", "b2": "عوامل التصفية"')[0].key === 'b2', () => 'K6. keyOf: null in a page\'s running text; the last key before the word on a line of several');
{ const real = T.repoHits(ROOT, ['mcp/lib', 'mcp/tools', 'assets/js/translations', 'assets/js', 'ar']);
  chk(() => !Object.keys(real).length, () => `K7. the lib's Arabic tables, the engines and the site's translation files use the glossary's words: ${J(real).slice(0, 600)}`); }

// ---- C the Arabic count ----
const countFile = (min) => path.join(JS, min ? 'arabic-count.min.js' : 'arabic-count.js');
for (const min of [false, true]) {
  const label = min ? '.min.js' : 'source';
  let A = null; try { const ctx = { Intl }; ctx.self = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(countFile(min), 'utf8'), ctx); A = ctx.DAArabicCount; } catch (e) { A = null; }
  const want = { 0: 'zero', 1: 'one', 2: 'two', 3: 'few', 10: 'few', 11: 'many', 26: 'many', 99: 'many', 100: 'other', 101: 'other', 102: 'other', 103: 'few', 110: 'few', 111: 'many', 200: 'other', 1003: 'few' };
  chk(() => A && Object.entries(want).every(([n, c]) => A.category(+n) === c && A.byRule(+n) === c), () => `C1 (${label}). CLDR's forms for Arabic: ${A && J(Object.keys(want).map((n) => A.category(+n)))}`);
  const intl = new Intl.PluralRules('ar'), hasAr = /^ar\b/.test(intl.resolvedOptions().locale);
  chk(() => A && Array.from({ length: 2001 }, (_, n) => n).every((n) => A.category(n) === A.byRule(n) && (!hasAr || intl.select(n) === A.byRule(n))), () => `C2 (${label}). the rule written out and Intl.PluralRules('ar') agree for 0 to 2000`);
  const F = A && A.NOUNS.semanticModelsOn, say = (n) => A.arCount(n, F);
  chk(() => say(1) === 'نموذج دلالي واحد' && say(2) === 'نموذجين دلاليين' && say(3) === '3 نماذج دلالية' && say(10) === '10 نماذج دلالية' && say(11) === '11 نموذجًا دلاليًا' && say(99) === '99 نموذجًا دلاليًا' && say(100) === '100 نموذج دلالي' && say(103) === '103 نماذج دلالية',
    () => `C3 (${label}). the models' forms (the owner's «نموذجين» and «نماذج»; 11 to 99 the singular): ${A && [1, 2, 3, 10, 11, 99, 100, 103].map(say).join(' | ')}`);
  chk(() => A.arCount(5, { other: '# x' }) === '5 x' && A.arCount(2, { two: 'اثنان', other: '#' }) === 'اثنان' && A.arCount(0, { other: '# y' }) === '0 y' && A.arCount(0, { zero: 'لا شيء', other: '#' }) === 'لا شيء' && !/[٠-٩]/.test(say(12)),
    () => `C4 (${label}). a missing form reads as other, zero only when given, Western digits`);
}

// ---- S the approved lines (typed here) ----
const Tm = require('../assets/js/tmdl-model.js');
const whyEn = Tm.whyOf({ code: 'missingTable' }, 'en'), whyAr = Tm.whyOf({ code: 'missingTable' }, 'ar');
chk(() => whyEn === 'model.tmdl names this table; no file in the project defines it' && whyAr === 'يذكر model.tmdl هذا الجدول، ولا يوجد في المشروع ملف يعرّفه', () => `S1. the missing-table reason in the approved Arabic, the English unchanged: ${whyAr} | ${whyEn}`);
chk(() => Tm.whyOf({ code: 'missingEnd' }, 'ar') === 'a relationship uses this table; no file in the project defines it' && Tm.whyOf({ code: 'missingEnd' }, 'ar') === Tm.whyOf({ code: 'missingEnd' }, 'en'),
  () => `S2. the relationship reason is held: its Arabic side stays the English: ${Tm.whyOf({ code: 'missingEnd' }, 'ar')}`);
{ const said = Tm.unreadableSaid([{ table: 'Dates', code: 'missingTable' }], 'ar', 'check');
  chk(() => /^تعذّرت قراءة 1 من ملفات النموذج: Dates \(يذكر model\.tmdl هذا الجدول، ولا يوجد في المشروع ملف يعرّفه\)\. /.test(said), () => `S3. inside the approved frame: ${said}`); }
const worker = (min) => {
  const ctx = { console, TextDecoder, TextEncoder, Blob, Response, DecompressionStream, setTimeout, clearTimeout, Date, Intl, posted: [] };
  ctx.self = ctx; vm.createContext(ctx);
  ctx.importScripts = (...names) => names.forEach((n) => { const f = n.replace(/\?.*$/, ''); vm.runInContext(fs.readFileSync(path.join(JS, min ? f : f.replace(/\.min\.js$/, '.js')), 'utf8'), ctx, { filename: f }); });
  ctx.postMessage = (d) => ctx.posted.push(d);
  vm.runInContext(fs.readFileSync(path.join(JS, min ? 'model-health-worker.min.js' : 'model-health-worker.js'), 'utf8'), ctx, { filename: 'worker' });
  return ctx;
};
const I = (s) => '\u2068' + s + '\u2069', plain = (s) => String(s).replace(/[\u2068\u2069]/g, '');
for (const min of [false, true]) {
  const label = min ? '.min.js' : 'source';
  let said = null; try { said = worker(min).modelsSaid; } catch (e) { said = null; }
  const two = said && said({ read: 'Sales.SemanticModel', notRead: ['Stock.SemanticModel'], report: 'read', reports: ['Sales.Report'] });
  chk(() => two && plain(two.ar) === 'يحتوي ملف ZIP هذا على نموذجين دلاليين: قرأ الفحص أدناه Sales.SemanticModel؛ ولم يقرأ Stock.SemanticModel. التقرير المقروء هو تقرير Sales.SemanticModel (Sales.Report)، ولم تُقرأ تقارير النموذج الآخر. لفحص نموذج آخر، ضع مجلد مشروعه وحده في ملف ZIP.',
    () => `S4 (${label}). two models, the approved sentence: ${two && plain(two.ar)}`);
  chk(() => two && two.en === 'This zip holds 2 semantic models: the check below read Sales.SemanticModel; not read: Stock.SemanticModel. The report read is the one of Sales.SemanticModel (Sales.Report); the other models\' reports were not read. To check another model, zip its project folder alone.',
    () => `S5 (${label}). the English unchanged: ${two && two.en}`);
  chk(() => two && [I('ZIP'), I('Sales.SemanticModel'), I('Stock.SemanticModel'), I('Sales.Report')].every((x) => two.ar.includes(x)) && two.ar.split('\u2068').length === two.ar.split('\u2069').length && !/[A-Za-z][^\u2068\u2069]*$/.test(two.ar.split('\u2068')[0]),
    () => `S6 (${label}). each folder name and the word ZIP are isolated (FSI ... PDI): ${two && J(two.ar)}`);
  const three = said && said({ read: 'A', notRead: ['B', 'C'], report: 'none', reports: [] });
  chk(() => three && plain(three.ar) === 'يحتوي ملف ZIP هذا على 3 نماذج دلالية: قرأ الفحص أدناه A؛ ولم يقرأ B، C. لم يُقرأ أي تقرير: لا يمكن أن يُعرف أي تقرير في ملف ZIP يخص A. لفحص نموذج آخر، ضع مجلد مشروعه وحده في ملف ZIP.',
    () => `S7 (${label}). three models and no report: ${three && plain(three.ar)}`);
  const many = said && said({ read: 'A', notRead: Array.from({ length: 11 }, (_, i) => 'M' + i), report: 'read', reports: [] });
  chk(() => many && /^يحتوي ملف ZIP هذا على 12 نموذجًا دلاليًا: /.test(plain(many.ar)) && /التقرير المقروء هو تقرير A، ولم تُقرأ تقارير النماذج الأخرى\./.test(plain(many.ar)), () => `S8 (${label}). twelve models: the form for 11 to 99, «النماذج الأخرى»: ${many && plain(many.ar).slice(0, 120)}`);
  chk(() => two && !T.termHits(two.ar).length && !T.termHits(whyAr).length, () => 'S9. the shipped lines use the glossary\'s words');
}
const E = (code, data, root) => Object.assign(new Error(code === 'NO_MODEL_NAMED' ? `No model named "${data.name}" in the working folder ${data.root}.` : `Nothing at "${data.path}" in the working folder ${root}.`), { code, data, root });
const named0 = E('NO_MODEL_NAMED', { name: 'Sale', root: 'C:\\work', models: [], more: 0 }), at0 = E('NO_MODEL_AT', { path: 'x/Sale.SemanticModel', models: [], more: 0 }, 'C:\\work');
chk(() => wordOf(named0, 'ar') === 'لا يوجد نموذج باسم "Sale" في مجلد العمل C:\\work. أعطِ read_model مسار مجلد مشروع، أو "." لمجلد العمل نفسه.', () => `S10. a wrong name in a folder with no model, lang ar: ${wordOf(named0, 'ar')}`);
chk(() => wordOf(at0, 'ar') === 'لا يوجد شيء في "x/Sale.SemanticModel" داخل مجلد العمل C:\\work. أعد استدعاء الأداة بمسار مجلد مشروع (نسبةً إلى مجلد العمل)، أو "." لمجلد العمل نفسه.', () => `S11. a wrong path in a folder with no model, lang ar: ${wordOf(at0, 'ar')}`);
chk(() => wordOf(named0, 'en') === 'No model named "Sale" in the working folder C:\\work. Give read_model the path of a project folder, or "." for the working folder itself.' && wordOf(named0) === wordOf(named0, 'en')
  && wordOf(at0, 'en') === 'Nothing at "x/Sale.SemanticModel" in the working folder C:\\work. Call the tool again with the path of a project folder, or "." for the working folder itself.',
  () => `S12. English with lang en or none, unchanged: ${wordOf(named0, 'en')} | ${wordOf(at0, 'en')}`);
chk(() => /^Nothing at /.test(wordOf(E('NO_MODEL_AT', { path: 'x', models: [], more: 0 }, null), 'ar')), () => 'S13. no working folder known: the English, as before');
{ const d = { name: 'Sale', root: 'C:\\work', models: ['a/Sales.SemanticModel', 'b/Sales.SemanticModel'], more: 0 };
  chk(() => wordOf(E('NO_MODEL_NAMED', d), 'ar') === 'لا يوجد نموذج باسم "Sale" في مجلد العمل C:\\work. a/Sales.SemanticModel; b/Sales.SemanticModel. أعطِ read_model أحد هذه المسارات، أو "." لمجلد العمل نفسه.'
    && wordOf(E('NO_MODEL_AT', { path: 'x', models: d.models, more: 0 }, 'C:\\work'), 'ar') === 'لا يوجد شيء في "x" داخل مجلد العمل C:\\work. a/Sales.SemanticModel; b/Sales.SemanticModel. أعد استدعاء الأداة بأحد هذه المسارات (نسبةً إلى مجلد العمل)، أو "." لمجلد العمل نفسه.',
  () => 'S14. with models to list: the owner\'s approved lines of 10 Nov, word for word (unchanged)'); }
chk(() => [wordOf(named0, 'ar'), wordOf(at0, 'ar')].every((t) => !/[\u2066-\u2069\u200e\u200f]/.test(t) && !T.termHits(t).length), () => 'S15. a tool answer carries no direction mark (answer.mjs shows them as codes) and uses the glossary\'s words');

if (problems.length) { console.log(`FAIL script=ar7 cause=${problems[0].slice(0, 160)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  ar7  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  ar7  ${checks} checks`);
