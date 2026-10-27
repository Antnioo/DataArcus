// 0.3.1 SQ15b (the owner's "Yes, fix now", 26 Oct; mcp/work/SQ15b.md; written red first). Made-up models only (written
// here as model.bim files in a temp working folder): no employer or client data. In process.
//   J   J18-S2: the isolate rule (J18's: a Latin run inside Arabic text in FSI ... PDI, an RLM where the run reaches an
//       end) is the shared text engine's (assets/js/text-measure.js), the MCP's terminology.mjs re-exports it, and the
//       report writer (assets/js/pbip-export.js) isolates an Arabic build itself: the website's Arabic download too
//   L   L3-S2: the metric switcher leaves out a measure its charts' axes are not related to (the model's relationships
//       and the measure's DAX names: metadata only), and the plan says which and why
//   S   0.2.9-reader-S8: plan-lint's binding is report-run's one page-and-binding function, not a copy
//   T   0.3.1 LR2 (the laptop's run of 26 Oct; mcp/work/LR2.md), moved to TT1's rule (the owner, 27 Oct: a title is wholly
//       Arabic or wholly English; mcp/work/TT1.md): the website's Arabic download, built with the page's own input
//       (chartAxes 'mirrored'), titles its charts on English names "Total Sales by Region", isolated whole (story-titles.js,
//       one engine with the MCP), the ranked and second-chart forms too, never a bracket; the English download unchanged
//   node test-0.3.1-sq15b.mjs
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
const cut = (o) => (typeof o === 'string' ? o : JSON.stringify(o) || '').slice(0, 400);
const TM = require('../assets/js/text-measure.js'), Pbip = require('../assets/js/pbip-export.js'), E = require('../assets/js/design-engine.js');

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sq15b-')));
process.env.DATAARCUS_ROOT = ROOT;
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const modelAt = (dir, tables, relationships) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships: relationships || [] } })); };
const calendar = () => { const c = { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [Object.assign(col('Date', 'dateTime'), { isKey: true }), Object.assign(col('Month', 'string'), { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Year', 'int64')] }; return c; };
const sales = () => ({ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Order Date', 'dateTime')],
  measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }] });
// a fact table no relationship reaches, and a measures table whose measure reads Sales
const targets = () => ({ name: 'Targets', partitions: mp('Targets'), columns: [col('Target', 'double'), col('Target Key', 'int64')], measures: [{ name: 'Total Target', expression: 'SUM ( Targets[Target] )', formatString: '#,0' }] });
const kpis = () => ({ name: 'KPI Measures', partitions: mp('KPI Measures'), columns: [col('Dummy', 'int64')], measures: [{ name: 'Sales Share', expression: 'DIVIDE ( [Total Sales], 1000 )', formatString: '0.0%' }, { name: 'Goal', expression: '1000', formatString: '#,0' }] });
const REL = [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Order Date', toTable: 'Calendar', toColumn: 'Date' }];
modelAt('sw', [sales(), calendar(), targets(), kpis()], REL);
modelAt('swn', [sales(), calendar(), targets(), kpis()], []);

try {
  // ---------- J18-S2: the isolate rule in the shared engine; the writer isolates an Arabic build ----------
  const FSI = '⁨', PDI = '⁩', RLM = '‏', RLI = '⁧', KPI = 'مؤشر KPI 2024';   // (BD2) RLI ... PDI: the whole text's wrap
  chk(() => typeof TM.isolateLatin === 'function' && TM.isolateLatin(KPI) === RLI + 'مؤشر ' + FSI + 'KPI 2024' + PDI + RLM + PDI
    && TM.isolateLatin('مؤشر KPI 2024 حسب الشهر') === RLI + 'مؤشر ' + FSI + 'KPI 2024' + PDI + ' حسب الشهر' + PDI && TM.isolateLatin('Q1/2024 الربع') === RLI + RLM + FSI + 'Q1/2024' + PDI + ' الربع' + PDI,
  () => `J1. the shared text engine (text-measure.js) has J18's isolate rule: ${typeof TM.isolateLatin === 'function' ? cut([KPI, 'Q1/2024 الربع'].map(TM.isolateLatin)) : 'no isolateLatin there'}`);
  chk(() => typeof TM.isolateLatin === 'function' && ['المبيعات', 'Total Sales', 'أعلى 6 من 10', ''].every((x) => TM.isolateLatin(x) === x) && TM.isolateLatin(TM.isolateLatin(KPI)) === TM.isolateLatin(KPI),
    () => 'J2. pure Arabic, pure English, numbers alone and an isolated text are unchanged by the engine\'s rule');
  const Terms = await import('./lib/terminology.mjs');
  chk(() => Terms.isolateLatin === TM.isolateLatin && Terms.isolateNames === TM.isolateNames && typeof Pbip.isolateFiles === 'function' && Terms.isolateFiles === Pbip.isolateFiles,
    () => `J3. the MCP's terminology.mjs re-exports the engines' isolateLatin, isolateNames (text-measure.js) and isolateFiles (pbip-export.js), no copy of its own: ${cut([Terms.isolateLatin === TM.isolateLatin, Terms.isolateNames === TM.isolateNames, typeof Pbip.isolateFiles, Terms.isolateFiles === Pbip.isolateFiles])}`);
  // the website's download on the person's own model (English names), Arabic, as the Theme Generator builds it
  const M = (m) => ({ t: 'Sales', m, name: m }), C = (c, extra) => Object.assign({ t: 'Sales', c, name: c }, extra || {});
  const site = (lang) => { const d = E.fresh(); E.repairState(d); const pages = E.projectPages(d.layout, lang, { second: true, panel: false });
    return Pbip.build({ name: 'Own', title: 'Own Sales', pageName: pages[0].name, lang, rtl: lang === 'ar', ...(lang === 'ar' ? { chartAxes: 'mirrored' } : {}), font: d.font, sample: false, logo: null, theme: E.buildTheme(d, lang), ui: d.ui, texts: E.REPORT_TEXTS[lang],
      model: { byPath: 'T.SemanticModel' }, bind: { kpis: [M('Total Sales'), M('Orders')], measure: M('Total Sales'), date: C('Month', { sortBy: { t: 'Sales', c: 'Month Number' } }), cats: { bar: C('Region'), column: C('Region') }, y: {}, table: [C('Region'), M('Total Sales'), M('Orders')], slicers: [C('Region')], tip: null },
      pages: pages.map((p) => ({ name: p.name, page: p.page, slots: p.slots, png: new Uint8Array([1]), panel: p.panel })) }); };
  const ar = get(() => site('ar')), en = get(() => site('en'));
  const copy = (r) => (r.files || []).map((f) => ({ path: f.path, data: f.data }));
  const left = ar.files ? Terms.isolateFiles(copy(ar), [], { all: true }) : -1;
  const isoTexts = (r) => (r.files || []).filter((f) => typeof f.data === 'string' && /[⁦-⁩]/.test(f.data)).map((f) => f.path);
  chk(() => ar.files && left === 0 && isoTexts(ar).length > 0, () => `J4. the website's Arabic download on an own model: every Arabic text with a Latin run isolated by the writer (${left} left raw; ${isoTexts(ar).length} files with an isolate)${ar.threw ? ' ' + ar.threw : ''}`);
  const raw = ar.files ? ar.files.filter((f) => typeof f.data === 'string' && /\.Report\/.+\.json$/.test(f.path)).flatMap((f) => (f.data.match(/'[^'\n]*[؀-ۿ][^'\n]*'/g) || []).filter((s) => /[A-Za-z]/.test(s) && !/[⁦-⁩]/.test(s))) : ['no build'];
  chk(() => !raw.length, () => `J5. no title, alt text or text run of the Arabic download holds a raw Latin run: ${cut(raw.slice(0, 4))}`);
  chk(() => en.files && !isoTexts(en).length, () => `J6. an English download has no isolate: ${cut(isoTexts(en))}`);
  const tg = fs.readFileSync(path.join(HERE, '../assets/js/theme-generator.js'), 'utf8'), bl = (tg.match(/const BUILDER = \[[^\]]*\]/) || [''])[0];
  chk(() => bl.indexOf('text-measure.min.js') >= 0 && bl.indexOf('text-measure.min.js') < bl.indexOf('pbip-export.min.js'), () => 'J7. the Theme Generator loads text-measure before pbip-export (the writer finds the isolate rule)');
  // ---------- LR2: the Arabic download's chart titles in the «حسب» form ----------
  const ST = require('../assets/js/story-titles.js');
  const titleOf = (r, v) => { const e = ((((v.visualContainerObjects || {}).title || [])[0] || { properties: {} }).properties.text || {}).expr;
    if (e && e.Literal) return String(e.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'");
    if (!e || !e.Measure) return null;
    const ext = JSON.parse(((r.files || []).find((f) => /reportExtensions\.json$/.test(f.path)) || { data: '{}' }).data), m = (ext.entities || []).flatMap((x) => x.measures || []).find((x) => x.name === e.Measure.Property);
    // (BD2) the text at run time: the literal, inside the expression's whole wrap (UNICHAR ( 8295 ) & ( ... ) & UNICHAR ( 8297 ))
    const x = m && /_s = _n, "((?:[^"]|"")*)"/.exec(m.expression), w = m && /^UNICHAR \( 8295 \) & \(.* \) & UNICHAR \( 8297 \)$/s.test(m.expression); return x ? (w ? '⁧' : '') + x[1].replace(/""/g, '"') + (w ? '⁩' : '') : null; };
  const titled = (r, re) => (r.files || []).filter((f) => /visual\.json$/.test(f.path)).map((f) => JSON.parse(f.data).visual).filter((v) => v && re.test(v.visualType)).map((v) => ({ type: v.visualType, t: titleOf(r, v), alt: ((((v.visualContainerObjects || {}).general || [])[0] || { properties: {} }).properties.altText || { expr: { Literal: { Value: '' } } }).expr.Literal.Value }));
  const CH = /^(clusteredBarChart|clusteredColumnChart|lineChart)$/, arT = titled(ar, CH), enT = titled(en, CH);
  // (changed 27 Oct 2026, 0.3.1 TT1, the owner's new rule: a title is wholly Arabic or wholly English; it replaces LR2's
  // «حسب» between English names: T1, T2, T3 and T6 expect the English title, isolated whole by the shared rule (BD2's V3: U+2067, then U+200F and the isolate); T4, T5 as LR2)
  const W = TM.isolateWhole || ((x) => x);
  chk(() => ST.join('Total Sales', 'Region', 'حسب') === 'Total Sales by Region' && ST.join('إجمالي المبيعات', 'Region', 'حسب') === 'إجمالي المبيعات' && ST.join('Total Sales', 'المنطقة', 'by') === 'Total Sales' && ST.join('Total Sales', 'Region', 'by') === 'Total Sales by Region'
    && ST.alternate('Total Sales', 'Region', 2, true, 'حسب') === 'Region ranked by Total Sales' && ST.alternate('Total Sales', 'Region', 2, false, 'حسب') === 'Total Sales per Region',
  () => `T1. story-titles.js: an Arabic report joins two English names with "by" and says its second-chart sentences in English, a mixed pair never joined; an English report as before: ${cut([ST.join('Total Sales', 'Region', 'حسب'), ST.alternate('Total Sales', 'Region', 2, true, 'حسب')])}`);
  chk(() => arT.some((x) => x.type === 'lineChart' && x.t === W('Total Sales by Month')) && W('Total Sales by Month').startsWith('\u2067\u200F\u2068'), () => `T2. the Arabic download's line chart: "Total Sales by Month", isolated whole, U+200F first inside BD2's U+2067 wrap: ${cut(arT.filter((x) => x.type === 'lineChart'))}`);
  chk(() => ['clusteredBarChart', 'clusteredColumnChart'].every((k) => arT.some((x) => x.type === k && x.t === W('Total Sales by Region'))) && arT.some((x) => x.type === 'clusteredBarChart' && x.t === W('Region ranked by Total Sales')),
    () => `T3. the Arabic bar and column charts: "Total Sales by Region", the ranked second bar "Region ranked by Total Sales", each isolated whole: ${cut(arT.filter((x) => x.type !== 'lineChart'))}`);
  chk(() => arT.length >= 4 && arT.concat(titled(ar, /^tableEx$/)).every((x) => x.t && !/[()]/.test(x.t) && !/[()]/.test(x.alt)), () => `T4. no bracket in an Arabic chart or table title or alt text: ${cut(arT.concat(titled(ar, /^tableEx$/)).filter((x) => !x.t || /[()]/.test(x.t + x.alt)))}`);
  chk(() => enT.map((x) => x.t).sort().join('|') === ['Region ranked by Total Sales', 'Region ranked by Total Sales', 'Total Sales by Month', 'Total Sales by Region', 'Total Sales by Region'].join('|'), () => `T5. the English download's chart titles unchanged: ${cut(enT.map((x) => x.t))}`);
  // the MCP's Arabic report: built isolated by the writer, report-run's own pass after its additions changes nothing more
  const { reportRun } = await import('./lib/report-run.mjs'), { withLookDefaults } = await import('./lib/report-inputs.mjs'), { planLayout } = await import('./lib/design.mjs');
  const mcpAr = get(() => reportRun(withLookDefaults({ path: 'sw/M.SemanticModel', name: 'Own AR', lang: 'ar', design: planLayout({ layout: 'exec', lang: 'ar' }).design, secondPage: false }), 'build'));
  chk(() => mcpAr.files && Terms.isolateFiles(copy(mcpAr), [], { all: true }) === 0 && isoTexts(mcpAr).length > 0, () => `J8. the MCP's Arabic report: every mixed text isolated (pin): ${cut(mcpAr.threw || isoTexts(mcpAr))}`);
  chk(() => mcpAr.files && titled(mcpAr, /^lineChart$/).some((x) => x.t === W('Total Sales by Month')), () => `T6. the MCP's Arabic report on the same names: the same engine, "Total Sales by Month" isolated whole: ${cut(mcpAr.threw || titled(mcpAr, CH))}`);

  // ---------- L3-S2: the switch measures the charts' axes are related to ----------
  const S = await import('./lib/metric-switcher.mjs');
  const sw = (dir, list, lang) => get(() => reportRun(withLookDefaults({ path: dir + '/M.SemanticModel', name: 'Switch ' + dir, lang: lang || 'en', design: planLayout({ layout: 'exec', lang: lang || 'en' }).design, secondPage: false, metricSwitcher: list }), 'build'));
  const FOUR = ['Sales[Total Sales]', 'Sales[Orders]', 'Targets[Total Target]', "'KPI Measures'[Sales Share]"];
  const b1 = sw('sw', FOUR), said = b1.metricSwitcher ? S.switchSaid(b1.metricSwitcher) : null, script = b1.files ? (b1.files.find((f) => /metric switcher\.tmdl$/.test(f.path)) || {}).data || '' : '';
  chk(() => said && said.measures.map((x) => x.field).join('|') === 'Sales[Total Sales]|Sales[Orders]|KPI Measures[Sales Share]', () => `L1. the measures the charts' axes are related to are switched, the measures table's (it reads Sales) kept: ${cut(b1.threw || (said && said.measures))}`);
  chk(() => said && Array.isArray(said.leftOut) && said.leftOut.length === 1 && said.leftOut[0].field === 'Targets[Total Target]' && /not related/.test(said.leftOut[0].why) && /Sales\[Region\]|Calendar\[/.test(said.leftOut[0].why),
    () => `L2. the plan names the measure left out and why (its table is not related to the chart's axis): ${cut(said && said.leftOut)}`);
  chk(() => script && !/Total Target/.test(script) && /NAMEOF\('Sales'\[Orders\]\)/.test(script), () => `L3. the field parameter's script holds no unrelated measure: ${cut(script.slice(script.indexOf('source')))}`);
  const b2 = sw('sw', ['Sales[Total Sales]', 'Targets[Total Target]']);
  chk(() => b2.threw && /Nothing was written/.test(b2.threw) && /Targets\[Total Target\]/.test(b2.threw) && /2 to 5/.test(b2.threw), () => `L4. fewer than 2 related measures: refused, nothing built, the measure and why named: ${cut(b2.threw || (b2.metricSwitcher && S.switchSaid(b2.metricSwitcher)))}`);
  const b3 = sw('swn', FOUR), said3 = b3.metricSwitcher ? S.switchSaid(b3.metricSwitcher) : null;
  chk(() => said3 && said3.measures.length === 4 && !(said3.leftOut || []).length, () => `L5. a model that gives no relationships: nothing left out (as before, the picker's rule): ${cut(b3.threw || said3)}`);
  const b4 = sw('sw', FOUR.slice(0, 2).concat("'KPI Measures'[Sales Share]")), said4 = b4.metricSwitcher ? S.switchSaid(b4.metricSwitcher) : null;
  chk(() => said4 && said4.measures.length === 3 && !(said4.leftOut || []).length, () => `L6. all related: nothing left out, no leftOut line: ${cut(b4.threw || said4)}`);
  const b6 = sw('sw', ['Sales[Total Sales]', "'KPI Measures'[Goal]"]), said6 = b6.metricSwitcher ? S.switchSaid(b6.metricSwitcher) : null;
  chk(() => said6 && said6.measures.length === 2 && !(said6.leftOut || []).length, () => `L8. a constant measure (its DAX reads no table) is kept: the same value on every bar is what it means: ${cut(b6.threw || said6)}`);
  const b5 = sw('sw', FOUR, 'ar'), said5 = b5.metricSwitcher ? S.switchSaid(b5.metricSwitcher) : null;
  chk(() => said5 && said5.leftOut && said5.leftOut.length === 1 && said5.measures.length === 3, () => `L7. the Arabic report the same: ${cut(b5.threw || said5)}`);

  // ---------- 0.2.9-reader-S8: plan-lint's binding is report-run's ----------
  const pl = fs.readFileSync(path.join(HERE, 'lib/plan-lint.mjs'), 'utf8'), rr = fs.readFileSync(path.join(HERE, 'lib/report-run.mjs'), 'utf8');
  chk(() => !/Bind\.suggest\(/.test(pl) && !/const relsOf =/.test(pl) && !/\['kpis', F\.kpis\]/.test(pl), () => 'S1. plan-lint.mjs has no copy of the binding: no Bind.suggest, no relsOf, no pinned map of its own');
  chk(() => /export function planBinding\(/.test(rr) && /import \{[^}]*planBinding[^}]*\} from '\.\/report-run\.mjs'/.test(pl) && !/\['kpis', F\.kpis\]/.test(rr.slice(rr.indexOf('export function reportRun('))),
    () => 'S2. report-run.mjs exports the one page-and-binding function (planBinding), plan-lint calls it, and reportRun itself uses it (no pinned map of its own)');
  const RR = await import('./lib/report-run.mjs'), PL = await import('./lib/plan-lint.mjs'), { loadModel } = await import('./lib/model.mjs'), { fieldsAndProblems } = await import('./lib/report-fields.mjs');
  const m = loadModel('sw/M.SemanticModel'), F = fieldsAndProblems(m.tables, { kpis: ['Sales[Orders]', 'Sales[Total Sales]'], category: 'Sales[Region]', table: ['Sales[Region]', 'Sales[Orders]'] }).out;
  const design = planLayout({ layout: 'exec', lang: 'en' }).design;
  const viaRun = get(() => typeof RR.planBinding === 'function' ? RR.planBinding({ m, pickFrom: m.tables, lang: 'en', F, design }).bindFor(2) : null);
  const viaLint = get(() => PL.plannedReport({ m, tables: m.tables, design, lang: 'en', F }, { second: false }));
  const kpiFields = (files) => (files || []).filter((f) => /visual\.json$/.test(f.path)).map((f) => JSON.parse(f.data).visual).filter((v) => v && v.visualType === 'cardVisual').map((v) => JSON.stringify(v.query)).join('|');
  chk(() => viaRun && viaRun.kpis && viaRun.kpis.map((k) => k && k.m).join('|') === 'Orders|Total Sales' && /Orders/.test(kpiFields(viaLint.files)), () => `S3. the binding report-run gives plan-lint pins the plan's fields as create_report: ${cut(viaRun && (viaRun.threw || (viaRun.kpis || []).map((k) => k && k.m)))}`);
} finally {
  try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* the OS cleans its temp folder */ }
}
if (problems.length) { console.log(`FAIL script=test-0.3.1-sq15b.mjs cause=${problems[0].slice(0, 160).replace(/\s+/g, ' ')}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sq15b  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sq15b  ${checks} checks`);
process.exit(0);
