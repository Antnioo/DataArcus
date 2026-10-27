// 0.3.1 TT1 (the owner, 27 Oct, after seeing LR2's Arabic titles: "regarding the arabic word in title i want the whole
// title to be either arabic or english"; mcp/work/TT1.md; written red first). It replaces his 26 Oct «حسب» between English
// names (LR2). Made-up models only (written here as model.bim files in a temp working folder): no employer or client data.
//   E  the engine (story-titles.js): an Arabic report's title is ALL ARABIC when every name in it has an Arabic text (one
//      the person approved, or Arabic in the model), otherwise ALL ENGLISH ("Total Sales by Region"); half approved is
//      English; never an Arabic word joining English names or the other way round; isolateWhole (text-measure.js)
//   S  the website's Arabic download (pbip-export.js, as the Theme Generator builds it): English names give English titles,
//      each isolated whole (U+200F, U+2068 ... U+2069); Arabic display names give Arabic titles
//   R  the MCP's Arabic create_report (report-run.mjs build): English names, approved Arabic names, half approved; a model
//      without measures ("Count of Order Id", never «عدد Order Id»); the plan lists the titles that stay English
//   D  DA.StoryTitle's measure (dax-functions.mjs storyDax): the Arabic sentence only for an Arabic noun
//   T  the Arabic twin and the EN-AR copy: a title the person leaves English is isolated whole; no title is mixed
//   node test-0.3.1-tt1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e).slice(0, 300) }; } };
const cut = (o) => (typeof o === 'string' ? o : JSON.stringify(o) || '').slice(0, 500);
const ST = require('../assets/js/story-titles.js'), TM = require('../assets/js/text-measure.js'), Pbip = require('../assets/js/pbip-export.js'), E = require('../assets/js/design-engine.js');

const RLM = '‏', FSI = '⁨', PDI = '⁩';
const AR = /[؀-ۿ]/, bare = (s) => String(s == null ? '' : s).replace(/[‎‏⁦-⁩]/g, '');
// a mixed title: Arabic letters and Latin letters in one text (the marks aside)
const mixed = (s) => AR.test(bare(s)) && /[A-Za-z]/.test(bare(s));
// an English title isolated whole, as the writer places it in an Arabic report
const wholeIso = (s) => new RegExp('^' + RLM + FSI + '[^⁦-⁩]+' + PDI + RLM + '$').test(String(s));
const lit = (p) => (p && p.expr && p.expr.Literal && typeof p.expr.Literal.Value === 'string' ? p.expr.Literal.Value.replace(/^'|'$/g, '').replace(/''/g, "'") : null);
const props = (vco, k) => Object.assign({}, ...(((vco || {})[k] || []).map((e) => (e && e.properties) || {})));
// every written title (a visual's title text, and its alt text when it repeats the title), from visual.json and mobile.json
// (a chart cut to its top N takes its title from a report measure: its plain text, "_s = _n, "<title>"", and its lead
// and rest, read from reportExtensions.json)
const dq = (x) => x.replace(/""/g, '"');
function measureTitle(files, e) {
  if (!e || !e.Measure) return null;
  const x = files.find((f) => /reportExtensions\.json$/.test(String(f.path))); if (!x) return null;
  const ext = typeof x.data === 'string' ? JSON.parse(x.data) : x.json || x.data, m = (ext.entities || []).flatMap((y) => y.measures || []).find((y) => y.name === e.Measure.Property);
  const r = m && /_s = _n, "((?:[^"]|"")*)", "((?:[^"]|"")*)" & _s & "((?:[^"]|"")*)" & _n & "((?:[^"]|"")*)"/.exec(m.expression);
  return r ? { plain: dq(r[1]), topped: dq(r[2]) + '6' + dq(r[3]) + '9' + dq(r[4]) } : null;
}
function titlesOf(files) {
  const out = [];
  for (const f of files) {
    if (!/(visual|mobile)\.json$/.test(String(f.path))) continue;
    let j; try { j = typeof f.data === 'string' ? JSON.parse(f.data) : f.json || f.data; } catch (e) { continue; }
    const vco = /mobile\.json$/.test(f.path) ? (j || {}).visualContainerObjects : ((j || {}).visual || {}).visualContainerObjects;
    const t = lit(props(vco, 'title').text), alt = lit(props(vco, 'general').altText), type = ((j || {}).visual || {}).visualType || 'phone';
    const mt = measureTitle(files, ((props(vco, 'title').text || {}).expr));
    if (mt) { out.push({ path: f.path, type, what: 'title', s: mt.plain }); out.push({ path: f.path, type, what: 'topped', s: mt.topped }); }
    if (t) out.push({ path: f.path, type, what: 'title', s: t });
    if (alt && (t || mt) && bare(alt).includes(bare(t || mt.plain))) out.push({ path: f.path, type, what: 'alt', s: alt });
  }
  return out;
}
const copy = (r) => (r.files || []).map((f) => ({ path: f.path, data: f.data }));

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-tt1-')));
process.env.DATAARCUS_ROOT = ROOT;
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const modelAt = (dir, tables, relationships) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships: relationships || [] } })); };
const calendar = () => ({ name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [Object.assign(col('Date', 'dateTime'), { isKey: true }), Object.assign(col('Month', 'string'), { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Year', 'int64')] });
const sales = () => ({ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Order Date', 'dateTime')],
  measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }] });
const REL = [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Order Date', toTable: 'Calendar', toColumn: 'Date' }];
modelAt('tt', [sales(), calendar()], REL);
// names the fixed list of report words has no Arabic for (the plan proposes none)
modelAt('od', [{ name: 'Web Orders', partitions: mp('Web Orders'), columns: [col('Score', 'double'), col('Plan Group', 'string'), col('Sign Up Date', 'dateTime')], measures: [{ name: 'Web Orders Total Score', expression: 'SUM ( \'Web Orders\'[Score] )', formatString: '#,0' }] }]);
// a model without measures (report-run counts its columns)
modelAt('nm', [{ name: 'Orders', partitions: mp('Orders'), columns: [col('Order Id', 'int64'), col('Region', 'string'), col('Amount', 'double'), col('Order Date', 'dateTime')] }, calendar()],
  [{ name: 'r1', fromTable: 'Orders', fromColumn: 'Order Date', toTable: 'Calendar', toColumn: 'Date' }]);

try {
  // ---------- E: the engine ----------
  const v = (mf, cf, by) => ST.variants(mf, cf, by)[0].text;
  const TS = { t: 'Sales', m: 'Total Sales' }, RG = { t: 'Sales', c: 'Region' };
  chk(() => v(TS, RG, 'حسب') === 'Total Sales by Region' && v(TS, RG, 'by') === 'Total Sales by Region',
    () => `E1. English names, no Arabic approved: the Arabic report's title is all English, as the English report's: ${cut([v(TS, RG, 'حسب'), v(TS, RG, 'by')])}`);
  const TSa = Object.assign({ name: 'إجمالي المبيعات' }, TS), RGa = Object.assign({ name: 'المنطقة' }, RG);
  chk(() => v(TSa, RGa, 'حسب') === 'إجمالي المبيعات حسب المنطقة', () => `E2. every name approved in Arabic: all Arabic: ${v(TSa, RGa, 'حسب')}`);
  chk(() => v(TSa, RG, 'حسب') === 'Total Sales by Region' && v(TS, RGa, 'حسب') === 'Total Sales by Region',
    () => `E3. half approved: all English, the model's names: ${cut([v(TSa, RG, 'حسب'), v(TS, RGa, 'حسب')])}`);
  chk(() => v({ t: 'S', m: 'المبيعات' }, { t: 'S', c: 'المنطقة' }, 'حسب') === 'المبيعات حسب المنطقة' && v({ t: 'S', m: 'المبيعات' }, RG, 'حسب') === 'المبيعات',
    () => `E4. Arabic in the model: Arabic; an Arabic measure and an English column with no Arabic name: the measure alone, never mixed: ${cut([v({ t: 'S', m: 'المبيعات' }, { t: 'S', c: 'المنطقة' }, 'حسب'), v({ t: 'S', m: 'المبيعات' }, RG, 'حسب')])}`);
  const all = [[TS, RG], [TSa, RGa], [TSa, RG], [TS, RGa], [{ t: 'S', m: 'المبيعات' }, RG], [{ t: 'S', m: 'Sales Amount After Discounts' }, { t: 'S', c: 'Sales Channel Used In Order', name: 'قناة البيع' }]]
    .flatMap(([m, c]) => ST.variants(m, c, 'حسب').map((x) => x.text));
  chk(() => all.length > 6 && all.every((x) => !mixed(x)), () => `E5. no variant (the full title and every shortened form) of an Arabic report mixes the languages: ${cut(all.filter(mixed))}`);
  chk(() => ST.join('Total Sales', 'Region', 'حسب') === 'Total Sales by Region' && ST.join('إجمالي المبيعات', 'المنطقة', 'حسب') === 'إجمالي المبيعات حسب المنطقة' && ST.join('إجمالي المبيعات', 'Region', 'حسب') === 'إجمالي المبيعات' && ST.join('Total Sales', 'المنطقة', 'حسب') === 'Total Sales',
    () => `E6. join: an Arabic report joins two English names with "by", two Arabic names with «حسب», a mixed pair never: ${cut([ST.join('Total Sales', 'Region', 'حسب'), ST.join('إجمالي المبيعات', 'Region', 'حسب')])}`);
  chk(() => ST.alternate('Total Sales', 'Region', 2, true, 'حسب') === 'Region ranked by Total Sales' && ST.alternate('Total Sales', 'Region', 3, true, 'حسب') === 'Total Sales per Region' && ST.alternate('إجمالي المبيعات', 'المنطقة', 2, true, 'حسب') === 'ترتيب المنطقة حسب إجمالي المبيعات',
    () => `E7. the second chart's sentence in the names' language: ${cut([ST.alternate('Total Sales', 'Region', 2, true, 'حسب'), ST.alternate('إجمالي المبيعات', 'المنطقة', 2, true, 'حسب')])}`);
  chk(() => [2, 3, 4].map((n) => ST.alternate('إجمالي المبيعات', 'Region', n, true, 'حسب')).concat([2, 3].map((n) => ST.alternate('Total Sales', 'المنطقة', n, true, 'by'))).every((x) => x == null || !mixed(x)),
    () => 'E8. a mixed pair\'s second-chart sentences never mix the languages');
  chk(() => typeof TM.isolateWhole === 'function' && TM.isolateWhole('Total Sales by Region') === RLM + FSI + 'Total Sales by Region' + PDI + RLM && ['إجمالي المبيعات', '2024', '', TM.isolateWhole('Total Sales')].every((x) => TM.isolateWhole(x) === x),
    () => `E9. text-measure.js isolateWhole: an English text isolated whole (U+200F, U+2068 ... U+2069, U+200F); Arabic, numbers, an isolated text unchanged: ${typeof TM.isolateWhole}`);

  // ---------- S: the website's Arabic download ----------
  const M = (m, name) => ({ t: 'Sales', m, name: name || m }), C = (c, name, extra) => Object.assign({ t: 'Sales', c, name: name || c }, extra || {});
  const site = (lang, ar) => { const d = E.fresh(); E.repairState(d); const pages = E.projectPages(d.layout, lang, { second: true, panel: false });
    const TSx = M('Total Sales', ar && 'إجمالي المبيعات'), OR = M('Orders', ar && 'الطلبات'), RGx = C('Region', ar && 'المنطقة'), MO = C('Month', ar && 'الشهر', { sortBy: { t: 'Sales', c: 'Month Number' } });
    return Pbip.build({ name: 'Own', title: 'Own Sales', pageName: pages[0].name, lang, rtl: lang === 'ar', ...(lang === 'ar' ? { chartAxes: 'mirrored' } : {}), font: d.font, sample: false, logo: null, theme: E.buildTheme(d, lang), ui: d.ui, texts: E.REPORT_TEXTS[lang],
      model: { byPath: 'T.SemanticModel' }, bind: { kpis: [TSx, OR], measure: TSx, date: MO, cats: { bar: RGx, column: RGx }, y: {}, table: [RGx, TSx, OR], slicers: [RGx, null, null], tip: { card: TSx, cat: RGx, y: TSx } },
      pages: pages.map((p) => ({ name: p.name, page: p.page, slots: p.slots, png: new Uint8Array([1]), panel: p.panel })) }); };
  const sEn = get(() => site('ar', false)), sAr = get(() => site('ar', true)), sEnglish = get(() => site('en', false));
  const tEn = sEn.files ? titlesOf(sEn.files) : [], tAr = sAr.files ? titlesOf(sAr.files) : [];
  chk(() => tEn.length > 8 && tEn.every((x) => !mixed(x.s)), () => `S1. the Arabic download on English names: no title or alt text mixes the languages: ${cut(sEn.threw || tEn.filter((x) => mixed(x.s)).map((x) => x.s))}`);
  chk(() => tEn.some((x) => x.type === 'lineChart' && x.s === TM.isolateWhole('Total Sales by Month')) && tEn.some((x) => x.type === 'clusteredColumnChart' && x.s === TM.isolateWhole('Total Sales by Region'))
    && tEn.some((x) => x.type === 'clusteredBarChart' && bare(x.s) === 'Region ranked by Total Sales'),
  () => `S2. its chart titles: "Total Sales by Month", "Total Sales by Region", the ranked bar "Region ranked by Total Sales": ${cut(tEn.filter((x) => /Chart$/.test(x.type)).map((x) => x.s))}`);
  chk(() => tEn.filter((x) => !AR.test(x.s) && /[A-Za-z]/.test(x.s)).every((x) => wholeIso(x.s)), () => `S3. every English title (and alt text) of the Arabic download is isolated whole: ${cut(tEn.filter((x) => !AR.test(x.s) && !wholeIso(x.s)).map((x) => x.s))}`);
  chk(() => tAr.length > 8 && tAr.every((x) => !mixed(x.s)) && tAr.some((x) => x.type === 'clusteredColumnChart' && x.s === 'إجمالي المبيعات حسب المنطقة') && tAr.some((x) => x.type === 'lineChart' && x.s === 'إجمالي المبيعات حسب الشهر'),
    () => `S4. the Arabic download with Arabic names: all Arabic: ${cut(sAr.threw || tAr.filter((x) => /Chart$/.test(x.type)).map((x) => x.s))}`);
  chk(() => sEnglish.files && titlesOf(sEnglish.files).every((x) => !/[‏⁦-⁩]/.test(x.s)) && titlesOf(sEnglish.files).some((x) => x.s === 'Total Sales by Region'), () => 'S5. the English download: unchanged, no mark');

  // ---------- R: the MCP's Arabic create_report ----------
  const { reportRun } = await import('./lib/report-run.mjs'), { withLookDefaults } = await import('./lib/report-inputs.mjs'), { planLayout } = await import('./lib/design.mjs');
  const run = (dir, name, displayNames) => get(() => reportRun(withLookDefaults(Object.assign({ path: dir + '/M.SemanticModel', name, lang: 'ar', design: planLayout({ layout: 'exec', lang: 'ar' }).design, secondPage: true }, displayNames ? { displayNames } : {})), 'build'));
  const rEn = run('tt', 'TT en'), rAll = run('tt', 'TT all', { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Orders]': 'الطلبات', 'Sales[Region]': 'المنطقة', 'Sales[Channel]': 'القناة', 'Calendar[Month]': 'الشهر', 'Calendar[Year]': 'السنة', 'Calendar[Date]': 'التاريخ' });
  const rHalf = run('tt', 'TT half', { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Orders]': 'الطلبات' }), rNm = run('nm', 'NM');
  const T = (r) => (r.files ? titlesOf(r.files) : []);
  chk(() => T(rEn).length > 8 && T(rEn).every((x) => !mixed(x.s)) && T(rEn).filter((x) => !AR.test(x.s) && /[A-Za-z]/.test(x.s)).every((x) => wholeIso(x.s)),
    () => `R1. English names: every title all English, isolated whole: ${cut(rEn.threw || T(rEn).filter((x) => mixed(x.s) || (!AR.test(x.s) && !wholeIso(x.s))).map((x) => x.s))}`);
  chk(() => T(rEn).some((x) => bare(x.s) === 'Total Sales by Month' || bare(x.s) === 'Total Sales by Region'), () => `R2. its chart titles read "Total Sales by …": ${cut(T(rEn).map((x) => bare(x.s)))}`);
  chk(() => T(rAll).length > 8 && T(rAll).filter((x) => x.what === 'title' && /Chart$/.test(x.type)).every((x) => AR.test(x.s) && !/[A-Za-z]/.test(x.s)),
    () => `R3. every name approved in Arabic: every chart title all Arabic: ${cut(rAll.threw || T(rAll).filter((x) => /Chart$/.test(x.type)).map((x) => x.s))}`);
  chk(() => T(rHalf).length > 8 && T(rHalf).every((x) => !mixed(x.s)) && T(rHalf).filter((x) => x.what === 'title' && /Chart$/.test(x.type) && !/Month|الشهر/.test(bare(x.s))).every((x) => !AR.test(x.s)),
    () => `R4. measures approved, columns not: those charts' titles all English, never mixed: ${cut(rHalf.threw || T(rHalf).filter((x) => /Chart$/.test(x.type)).map((x) => x.s))}`);
  chk(() => T(rNm).length > 4 && T(rNm).every((x) => !mixed(x.s)) && !T(rNm).some((x) => /عدد|مجموع/.test(x.s) && /[A-Za-z]/.test(bare(x.s))),
    () => `R5. a model without measures: no «عدد Order Id» (a count of an English column is "Count of Order Id"): ${cut(rNm.threw || T(rNm).map((x) => x.s))}`);
  // the plan lists the titles that stay English, and how to make them Arabic
  const { serverClient } = await import('./test-0.2.9.mjs');
  const s = await serverClient(ROOT, {});
  const pl = await s.call('plan_layout', { path: 'od/M.SemanticModel', lang: 'ar', layout: 'exec', name: 'TT plan', secondPage: true });
  const te = pl.j && pl.j.arabicNames && pl.j.arabicNames.titlesInEnglish;
  chk(() => te && Array.isArray(te.titles) && te.titles.length > 0 && te.titles.every((x) => !AR.test(x) && /[A-Za-z]/.test(x)) && /displayNames/.test(String(te.how)) && /Arabic/.test(String(te.how)),
    () => `R6. an Arabic plan lists the titles that stay English (titlesInEnglish) and how to make them Arabic: ${cut(pl.err ? pl.t : te)}`);
  chk(() => /wholly English|all English/i.test(String(pl.j.arabicNames.sayInPlan)) && !/never joined/.test(JSON.stringify(pl.j.arabicNames.notTranslated || [])),
    () => `R7. the plan says a title with a field kept in English is wholly English: ${cut(pl.j && pl.j.arabicNames && pl.j.arabicNames.sayInPlan)}`);
  await s.close();

  // ---------- D: DA.StoryTitle ----------
  const Dax = await import('./lib/dax-functions.mjs');
  const mo = { name: 'Total Sales', formatString: '#,0', expression: 'SUM ( Sales[Amount] )' }, cat = { t: 'Sales', c: 'Region' };
  const dEn = get(() => Dax.storyDax('Sales', mo, cat, 'Total Sales', null, 'ar')), dAr = get(() => Dax.storyDax('Sales', mo, cat, 'إجمالي المبيعات', null, 'ar'));
  chk(() => typeof dEn === 'string' && /"en" \) \)$/.test(dEn) && /"last year"/.test(dEn) && typeof dAr === 'string' && /"ar" \) \)$/.test(dAr),
    () => `D1. an Arabic report's story title: the English sentence for an English noun, the Arabic for an Arabic one: ${cut([String(dEn).slice(-80), String(dAr).slice(-80)])}`);

  // ---------- T: the Arabic twin and the EN-AR copy ----------
  const rEnglish = get(() => reportRun(withLookDefaults({ path: 'tt/M.SemanticModel', name: 'TT EN', lang: 'en', design: planLayout({ layout: 'exec', lang: 'en' }).design, secondPage: true }), 'build'));
  (rEnglish.files || []).forEach((f) => { const p = path.join(ROOT, 'tt', f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
  const { planTwin } = await import('./lib/twin-plan.mjs');
  const p0 = get(() => planTwin({ path: 'tt/TT EN.pbip' })), texts = (p0.texts || []).filter((t) => t.text != null);
  // the person translates the page names and the text boxes only: the chart titles stay English
  let k = 0; const L = {}; texts.filter((t) => /^(page|textbox):/.test(t.id)).forEach((t) => { L[t.id] = 'نص ' + (++k); });
  const tw = get(() => planTwin({ path: 'tt/TT EN.pbip', labels: L })), cp = get(() => planTwin({ path: 'tt/TT EN.pbip', labels: L, into: 'same' }));
  const twinFiles = tw.built ? tw.built.pages.flatMap((pg) => pg.visuals.map((j, i) => ({ path: 'p/' + i + '/visual.json', json: j })).concat((pg.mobiles || []).filter(Boolean).map((j, i) => ({ path: 'p/' + i + '/mobile.json', json: j })))) : [];
  const tT = titlesOf(twinFiles), tC = cp.copy ? titlesOf((cp.copy.files || []).map((f) => ({ path: f.rel, data: f.data != null ? String(f.data) : fs.readFileSync(path.join(ROOT, 'tt/TT EN.Report', f.from), 'utf8') }))) : [];
  chk(() => texts.length > 5 && tT.length > 5 && tT.every((x) => !mixed(x.s)) && tT.filter((x) => !AR.test(x.s) && /[A-Za-z]/.test(x.s)).every((x) => wholeIso(x.s)),
    () => `T1. the twin: a title the person left English is isolated whole, none mixed: ${cut(tw.threw || p0.threw || tT.filter((x) => mixed(x.s) || (!AR.test(x.s) && !wholeIso(x.s))).map((x) => x.s))}`);
  chk(() => tC.length > 5 && tC.every((x) => !mixed(x.s)) && tC.some((x) => wholeIso(x.s)), () => `T2. the EN-AR copy: no title mixed, its Arabic pages' English titles isolated whole: ${cut(cp.threw || tC.filter((x) => mixed(x.s)).map((x) => x.s))}`);
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }
fs.rmSync(ROOT, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL script=test-0.3.1-tt1.mjs cause=${problems.length} of ${checks} checks failed`); console.log(`FAIL  tt1  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  tt1  ${checks} checks`);
