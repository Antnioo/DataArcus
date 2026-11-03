// 0.3.1 TB1b: TB1's leftovers, each written red first. Made-up reports on the sample project's model (no data values).
//   M1-M4 a chart on a field parameter whose title Power BI composes, kept (left to Power BI) while another of its fields
//         gets an Arabic name: Power BI would compose a mixed title (D-1027-03), so no plan id, said EN and AR
//         (mixedTitles, planProblems); kept where nothing of it is Arabic, or approved as a fixed Arabic title: a plan id
//   S1-S3 a subtitle bound to a measure: listed like such a title (EN and AR), written as a fixed Arabic subtitle when
//         approved, else left as it is and named in notTranslated
//   R1-R2 a reference line's own label (the catalog's xAxisReferenceLine, y1AxisReferenceLine, referenceLine):
//         listed, and written as approved, wrapped RLI ... PDI (drawn beside its value)
//   T1    TOOLS.md says create_arabic_twin's textsFrom and termsFrom
//   node test-0.3.1-tb1b.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null);
const AR = /[؀-ۿ]/, RLI = '⁧', PDI = '⁩';
const httpReq = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});

// ---------- the fixtures: hand-built reports on the sample's model ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-tb1b-root-')));
const LOGS = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-tb1b-log-'))), log = path.join(LOGS, 'links.txt');
process.env.DATAARCUS_ROOT = ROOT;
const { sampleFiles } = await import('./lib/sample-project.mjs');
sampleFiles('S').forEach((f) => { const p = path.join(ROOT, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
const MODEL = fs.readdirSync(path.join(ROOT, 'S')).find((x) => /\.SemanticModel$/.test(x));
const L = (v) => ({ expr: { Literal: { Value: v } } }), S = (t) => L("'" + String(t).replace(/'/g, "''") + "'");
const mea = (t, m, dn) => Object.assign({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m }, dn != null ? { displayName: dn } : {});
const col = (t, c, dn) => Object.assign({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c }, dn != null ? { displayName: dn } : {});
const SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/';
const vis = (name, type, box, query, vco, objects) => ({ $schema: SCHEMA + 'visualContainer/2.1.0/schema.json', name, position: { x: box[0], y: box[1], z: 1000, width: box[2], height: box[3], tabOrder: 1000 },
  visual: Object.assign({ visualType: type }, query ? { query: { queryState: query } } : {}, vco ? { visualContainerObjects: vco } : {}, objects ? { objects } : {}) });
const titled = (t) => ({ title: [{ properties: { show: L('true'), text: S(t) } }] });
function report(name, pages) {
  const dir = path.join(ROOT, 'S', name + '.Report'), w = (rel, o) => { const p = path.join(dir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(o, null, 2)); };
  fs.writeFileSync(path.join(ROOT, 'S', name + '.pbip'), JSON.stringify({ version: '1.0', artifacts: [{ report: { path: name + '.Report' } }], settings: { enableAutoRecovery: true } }));
  w('definition.pbir', { version: '4.0', datasetReference: { byPath: { path: '../' + MODEL } } });
  w('definition/version.json', { $schema: SCHEMA + 'versionMetadata/1.0.0/schema.json', version: '2.0.0' });
  w('definition/report.json', { $schema: SCHEMA + 'report/2.1.0/schema.json', themeCollection: {} });
  w('definition/pages/pages.json', { $schema: SCHEMA + 'pagesMetadata/1.0.0/schema.json', pageOrder: pages.map((p) => p.id), activePageName: pages[0].id });
  pages.forEach((pg) => { w(`definition/pages/${pg.id}/page.json`, { $schema: SCHEMA + 'page/2.0.0/schema.json', name: pg.id, displayName: pg.name, displayOption: 'FitToPage', width: 1280, height: 720 });
    pg.visuals.forEach((v) => w(`definition/pages/${pg.id}/visuals/${v.name}/visual.json`, v)); });
  return path.join('S', name + '.pbip');
}
const visualsIn = (dir) => { const P = path.join(dir, 'definition/pages'), out = []; if (!fs.existsSync(P)) return out;
  fs.readdirSync(P).forEach((pg) => { const V = path.join(P, pg, 'visuals'); if (fs.existsSync(V)) fs.readdirSync(V).forEach((v) => { const f = path.join(V, v, 'visual.json'); if (fs.existsSync(f)) out.push(Object.assign(JSON.parse(fs.readFileSync(f, 'utf8')), { _page: pg })); }); });
  return out; };

const M = 'All Measures', FP = { Column: { Expression: { SourceRef: { Entity: 'Metric Choice' } }, Property: 'Metric Choice' } };
const fpChart = (name, y) => vis(name, 'clusteredColumnChart', [20, y, 400, 200], { Category: { projections: [col('Branches', 'Country')] }, Y: { projections: [mea('Sales', 'Revenue per Customer')], fieldParameters: [{ parameterExpr: FP, index: 0, length: 1 }] } });
const subMeasure = { show: L('true'), text: { expr: { Measure: { Expression: { SourceRef: { Entity: M } }, Property: 'Selection Subtitle' } } } };
const refLine = (card, label) => [{ properties: { show: L('true'), displayName: S(label), value: L('100D') }, selector: { id: '1' } }];
const PB = report('Param', [{ id: 'parampage', name: 'Revenue', visuals: [fpChart('fpchart', 20)] }]);
const SB = report('Lines', [{ id: 'linespage', name: 'Lines', visuals: [
  vis('subchart', 'lineChart', [20, 20, 400, 200], { Category: { projections: [col('Branches', 'Country')] }, Y: { projections: [mea(M, 'Repeat Rate')] } }, Object.assign(titled('Repeat rate'), { subTitle: [{ properties: subMeasure }] })),
  vis('keptsub', 'lineChart', [440, 20, 400, 200], { Category: { projections: [col('Branches', 'Country')] }, Y: { projections: [mea(M, 'Open Tasks')] } }, Object.assign(titled('Open tasks'), { subTitle: [{ properties: Object.assign({}, subMeasure, { text: { expr: { Measure: { Expression: { SourceRef: { Entity: M } }, Property: 'Open Subtitle' } } } }) }] })),
  vis('reflines', 'clusteredColumnChart', [20, 240, 600, 300], { Category: { projections: [col('Branches', 'Country')] }, Y: { projections: [mea(M, 'Visits')] } }, titled('Visits'),
    { y1AxisReferenceLine: refLine('y', 'Target'), xAxisReferenceLine: refLine('x', 'Launch'), referenceLine: refLine('r', 'Average KPI') })] }]);

const links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' }), call = s.call;
async function approve(pid) {
  const n = links().length; await call('approve_plan', { planId: pid });
  for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50);
  const url = links()[n] || ''; if (url) { await httpReq(url, 'POST', 'decision=approve'); await call('approve_plan', { planId: pid }); }
}
async function write(a) {
  const p = await call('create_arabic_twin', a), id = p.j && p.j.plan && p.j.plan.planId; if (!id) return { err: true, t: 'no plan: ' + short(p), plan: p };
  await approve(id); const w = await call('create_arabic_twin', Object.assign({}, a, { planId: id }));
  return Object.assign(w, { plan: p, dir: w.j ? path.join(ROOT, String(w.j.pbip || '').replace(/\\/g, '/').replace(/\.pbip$/, '.Report')) : null });
}
const planId = (x) => x.j && x.j.plan && x.j.plan.planId;

// ---------- M: a kept title that would be mixed ----------
{
  const TITLE = 'title:parampage/fpchart', COUNTRY = { 'field:Branches.Country': 'الدولة' };
  const mixed = await call('create_arabic_twin', { path: PB, arabicMonth: false, labels: COUNTRY }), mt = (mixed.j && mixed.j.mixedTitles) || [];
  chk(() => !mixed.err && !planId(mixed) && (mixed.j.planProblems || []).some((p) => /mixed/.test(p) && /Revenue per Customer/.test(p)) && (mixed.j.planProblemsAr || []).some((p) => AR.test(p)),
    () => `M1: kept while Country gets Arabic: no plan id, planProblems say why EN and AR: ${short(mixed)}`);
  chk(() => mt.length === 1 && mt[0].id === TITLE && /fixed Arabic title/.test(mt[0].how) && AR.test(mt[0].whyAr || ''), () => `M2: mixedTitles names it, with why EN and AR and how: ${JSON.stringify(mt)}`);
  const plain = await call('create_arabic_twin', { path: PB, arabicMonth: false });
  chk(() => !plain.err && planId(plain) && !(plain.j.mixedTitles || []).length, () => `M3 (guard): kept where nothing of it is Arabic: a plan id: ${short(plain)}`);
  const fixed = await call('create_arabic_twin', { path: PB, arabicMonth: false, labels: Object.assign({ [TITLE]: 'الإيراد لكل عميل حسب الدولة' }, COUNTRY) });
  chk(() => !fixed.err && planId(fixed) && !(fixed.j.mixedTitles || []).length, () => `M4 (guard): approved as a fixed Arabic title: a plan id: ${short(fixed)}`);
}

// ---------- S, R: measure subtitles, reference line labels ----------
{
  const p0 = await call('create_arabic_twin', { path: SB, arabicMonth: false }), T0 = (p0.j && p0.j.texts) || [];
  const SUB = 'text:linespage/subchart/c.subTitle.0.text', KEPT = 'text:linespage/keptsub/c.subTitle.0.text', sub = T0.find((x) => x.id === SUB);
  chk(() => sub && sub.kind === 'dynamicTitle' && /Selection Subtitle/.test(sub.what) && /no longer changes/.test(sub.what) && AR.test(sub.whatAr || '') && T0.some((x) => x.id === KEPT),
    () => `S1: a subtitle bound to a measure is listed like such a title, EN and AR: ${JSON.stringify(sub)} ${p0.err ? short(p0) : JSON.stringify(T0.map((x) => x.id))}`);
  const REFS = ['y1AxisReferenceLine', 'xAxisReferenceLine', 'referenceLine'].map((c) => `text:linespage/reflines/o.${c}.0.displayName`);
  chk(() => REFS.every((id) => T0.some((x) => x.id === id)), () => `R1: each reference line's own label is listed: ${JSON.stringify(REFS.filter((id) => !T0.some((x) => x.id === id)))}`);
  const labels = { [SUB]: 'حسب التحديد', [REFS[0]]: 'الهدف', [REFS[1]]: 'الإطلاق', [REFS[2]]: 'متوسط KPI' };
  const w = await write({ path: SB, arabicMonth: false, labels }), tw = w.dir ? visualsIn(w.dir) : [], V = (n) => tw.find((v) => v.name === n);
  const subOf = (n) => { const e = V(n) && ((V(n).visual.visualContainerObjects || {}).subTitle || [])[0]; return e ? e.properties.text : undefined; };
  chk(() => !w.err && lit(subOf('subchart')) === 'حسب التحديد', () => `S2: approved: written as a fixed Arabic subtitle: ${JSON.stringify(subOf('subchart'))} ${w.err ? short(w) : ''}`);
  const nt = (w.plan && w.plan.j && w.plan.j.notTranslated) || [];
  chk(() => subOf('keptsub') && subOf('keptsub').expr.Measure.Property === 'Open Subtitle' && nt.some((r) => r.text === 'Open Subtitle' && /changes with the selection/.test(r.why)),
    () => `S3: kept: the measure stays, named in notTranslated: ${JSON.stringify(subOf('keptsub'))} ${JSON.stringify(nt).slice(0, 500)}`);
  const ref = (c) => { const e = V('reflines') && ((V('reflines').visual.objects || {})[c] || [])[0]; return e ? lit(e.properties.displayName) : null; };
  chk(() => ref('y1AxisReferenceLine') === RLI + 'الهدف' + PDI && ref('xAxisReferenceLine') === RLI + 'الإطلاق' + PDI && /^\u2067.*\u2068KPI\u2069.*\u2069$/.test(ref('referenceLine') || ''),
    () => `R2: written as approved, wrapped (beside its value): ${JSON.stringify(['y1AxisReferenceLine', 'xAxisReferenceLine', 'referenceLine'].map(ref))}`);
}

// ---------- T: TOOLS.md ----------
{
  const tools = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'TOOLS.md'), 'utf8'), sec = tools.slice(tools.indexOf('## `create_arabic_twin`'));
  chk(() => /`textsFrom`/.test(sec) && /`termsFrom`/.test(sec), () => 'T1: TOOLS.md says create_arabic_twin\'s textsFrom and termsFrom');
}

await s.close();
fs.rmSync(ROOT, { recursive: true, force: true }); fs.rmSync(LOGS, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-tb1b.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('      - ' + p)); console.log(`FAIL  tb1b  ${checks} checks, ${problems.length} failed`); process.exit(1); }
console.log(`PASS  tb1b  ${checks} checks`);
