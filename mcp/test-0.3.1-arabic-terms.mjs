// 0.3.1 E (the Arabic review of 21 Oct: one concept written several ways across the engines): one Arabic term per
// concept, everywhere DataArcus writes Arabic. The terminology sheet's `concepts` (assets/data/arabic-report-words.json,
// read by mcp/lib/arabic-terms.mjs) is the one source; this suite checks every Arabic text of the repo against it.
//   AT-1  the sheet is well formed: each concept has its English, its Arabic, a status, Microsoft's source or "none
//         found"; its own Arabic is not one of its variants; each allow-list entry says why
//   AT-2  the scanner finds a planted variant of each concept (after a clitic, with diacritics) and passes its term
//   AT-3  no Arabic text outside the allow-list uses a variant (one check per concept: the files and lines listed)
//   AT-4  the report's fixed texts (the writer's REPORT_TEXTS, the fixed list's phrases, the button's tooltip) use the
//         chosen terms, and "Reset filters" and "Clear the filters on this page" are one Arabic text
//   AT-5  an Arabic page of the site that names a slicer or a tooltip gives the English once, at its first use
//   node test-0.3.1-arabic-terms.mjs        (DA_TERMS=1 prints every hit)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { CONCEPTS, ALLOW, termHits, fileHits, repoHits, repoFiles, englishOnceProblem, fold } from './lib/arabic-terms.mjs';
import { CONCEPTS as SHEET } from './lib/terminology.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const LIST = (a, n = 12) => (a.length > n ? a.slice(0, n).join('; ') + `; ... ${a.length - n} more` : a.join('; '));

// ---- AT-1 the sheet ----
chk(() => SHEET === CONCEPTS && CONCEPTS.length >= 25, () => `AT-1. the terminology sheet exports the concepts (${CONCEPTS.length})`);
chk(() => new Set(CONCEPTS.map((c) => c.id)).size === CONCEPTS.length, () => 'AT-1. concept ids are unique');
for (const c of CONCEPTS) {
  chk(() => c.id && c.en && /[ء-ي]|^DataArcus$/.test(c.ar) && ['chosen', 'to choose'].includes(c.status) && (c.source === 'none found' || (Array.isArray(c.source) && c.source.every((u) => /^https:\/\/(learn|support)\.microsoft\.com\/ar-sa\//.test(u)))) && Array.isArray(c.variants)
    && !termHits(c.ar).some((h) => h.id === c.id) && (!c.microsoft || c.source !== 'none found'),
  () => `AT-1. ${c.id}: en, ar, status, Microsoft's Arabic source; its own term is not a variant (${JSON.stringify(termHits(c.ar))})`);
}
chk(() => ALLOW.length && ALLOW.every((a) => typeof a.why === 'string' && a.why.length > 20), () => 'AT-1. every allow-list entry says why');

// ---- AT-2 the scanner, on planted texts (each variant after a clitic or with a diacritic) ----
const PLANT = {
  filters: 'افتح عوامل التصفية', filtering: 'للفلترة حسب المنطقة', reset: 'زر مسح الفلاتر', slicer: 'أضف مقسّمًا ثم بالمقسمات', tooltip: 'صفحة التلميح',
  dates: 'مواعيد رمضان', product: 'من داتا أركوس', likeforlike: 'تقارن المتماثل بالمتماثل', visual: 'كل المرئيات', chart: 'رسم بياني',
  kpicard: 'بطاقات KPI', datetable: 'أضف جدول تقويم', dashboard: 'لوحات المعلومات', measure: 'المقياسات', approve: 'بعد المصادقة', theme: 'الثيم',
  bookmark: 'علامة مرجعية', fiscalyear: 'العام المالي', workday: 'يوم دوام', weekend: 'العطلة الأسبوعية', legend: 'مفتاح الرسم',
};
for (const c of CONCEPTS.filter((k) => k.variants.length)) {
  chk(() => PLANT[c.id] && termHits(PLANT[c.id]).some((h) => h.id === c.id), () => `AT-2. ${c.id}: the planted «${PLANT[c.id]}» is found`);
}
chk(() => CONCEPTS.every((c) => !termHits(`نص ${c.ar} نص`).some((h) => h.id === c.id)) && !termHits('مقسمات طريقة العرض وتلميحات الأدوات وقيمة مقسمة').length,
  () => 'AT-2. each chosen term, the plurals and an unrelated «مقسمة» pass');
chk(() => !fileHits('<meta name="keywords" content="داتا أركوس, Power BI">').length && fileHits('<title>Power BI - داتا أركوس</title>').length === 1,
  () => 'AT-2. the product\'s Arabic spelling passes in a page\'s keywords only');

// ---- AT-3 the repo ----
const hits = repoHits(ROOT);
if (process.env.DA_TERMS) for (const [id, l] of Object.entries(hits)) { console.log(`${id} (${l.length})`); l.forEach((x) => console.log('   ' + x)); }
for (const c of CONCEPTS.filter((k) => k.variants.length)) {
  chk(() => !(hits[c.id] || []).length, () => `AT-3. ${c.id}: ${(hits[c.id] || []).length} Arabic texts use another form than «${c.ar}»: ${LIST(hits[c.id] || [])}`);
}
chk(() => !Object.keys(hits).some((id) => !CONCEPTS.some((c) => c.id === id)), () => 'AT-3. every hit is a sheet concept');

// ---- AT-4 the report's fixed texts ----
const Engine = require('../assets/js/design-engine.js');
const LISTFILE = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/arabic-report-words.json'), 'utf8'));
const AR = Engine.REPORT_TEXTS.ar, PH = LISTFILE.phrases;
chk(() => !Object.values(AR).flatMap((t) => termHits(t)).length, () => `AT-4. the writer's Arabic texts use the sheet's terms: ${JSON.stringify(Object.values(AR).flatMap((t) => termHits(t)))}`);
chk(() => !Object.values(PH).flatMap((t) => termHits(t)).length, () => `AT-4. the fixed list's phrases use the sheet's terms: ${JSON.stringify(Object.values(PH).flatMap((t) => termHits(t)))}`);
chk(() => PH.Slicer === AR.slicer && PH.Tooltip === AR.tooltipPage && fold(AR.slicer) === 'مقسم طريقة العرض' && fold(AR.tooltipPage) === 'تلميح الأدوات',
  () => `AT-4. Slicer and Tooltip are the sheet's terms in the writer and the list (${AR.slicer} / ${AR.tooltipPage}; list ${PH.Slicer} / ${PH.Tooltip})`);
const reset = CONCEPTS.find((c) => c.id === 'reset'), page = fs.readFileSync(path.join(ROOT, 'assets/js/pbip-page.js'), 'utf8');
const tip = (/o\.lang === 'ar' \? '([^']+)' : 'Clear the filters on this page'/.exec(page) || [])[1];
chk(() => reset.phrases.every((en) => PH[en] === reset.ar) && AR.reset === reset.ar && tip === reset.ar,
  () => `AT-4. "Reset filters" and "Clear the filters on this page" are one Arabic text «${reset.ar}» (list: ${reset.phrases.map((en) => PH[en]).join(' / ')}; writer ${AR.reset}; tooltip ${tip})`);

// ---- AT-5 the English once, on the site's Arabic pages ----
const pages = repoFiles(ROOT, ['ar']).filter((p) => p.endsWith('.html') && !p.startsWith('ar/articles/'));
for (const c of CONCEPTS.filter((k) => k.englishOnce)) {
  const bad = pages.map((p) => [p, englishOnceProblem(fs.readFileSync(path.join(ROOT, p), 'utf8'), c.id)]).filter((x) => x[1]).map((x) => `${x[0]}: ${x[1]}`);
  const named = pages.filter((p) => new RegExp(c.form, 'u').test(fold(fs.readFileSync(path.join(ROOT, p), 'utf8')))).length;
  chk(() => !bad.length && named > 0, () => `AT-5. ${c.id}: each Arabic page gives (${c.englishOnce}) once, at its first use (${named} pages name it): ${LIST(bad)}`);
}

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  test-0.3.1-arabic-terms  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  test-0.3.1-arabic-terms  ${checks} checks`);
