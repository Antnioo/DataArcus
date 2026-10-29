// 0.3.1 TB1c: laptop part 5's two twin fails (rc.4) and two wordings, each written red first. Made-up reports on the
// sample project's model, shaped like the owner's (no data values).
//   F1-F4 one measure on seven visuals: two cards renamed "Male" / "Female" (the Female card's nativeQueryRef "Female"
//         too, as Desktop writes a rename), five with no displayName: the field's text is the model's name, each card
//         its own; approving the field writes on the five only
//   C1-C3 a line chart whose title is Min of a field parameter's column, its date axis approved Arabic: listed EN and
//         AR; kept, no plan id (mixedTitles: it would sit English beside Arabic); approved fixed Arabic: written
//   W1    the write answer's titleMeasures agrees with notTranslated: two measure titles approved as fixed Arabic
//   V1-V2 a validator finding of a code Desktop was measured to open: its fix says only what is measured
//   node test-0.3.1-tb1c.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { serverClient } from './test-0.2.9.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null);
const AR = /[؀-ۿ]/;
const httpReq = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});

// ---------- the fixtures: hand-built reports on the sample's model ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-tb1c-root-')));
const LOGS = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-tb1c-log-'))), log = path.join(LOGS, 'links.txt');
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

const M = 'All Measures', PT = 'Patients';
const pat = (dn, nq) => Object.assign(mea(M, PT, dn), nq ? { nativeQueryRef: nq } : {});
const others = [['c249', 'clusteredColumnChart'], ['l4c4', 'lineChart'], ['b05a', 'clusteredBarChart'], ['c1e3', 'clusteredColumnChart'], ['m2c6', 'pivotTable']]
  .map(([n, t], i) => vis(n, t, [20 + i * 250, 300, 240, 200], t === 'pivotTable' ? { Rows: { projections: [col('Branches', 'Country')] }, Values: { projections: [pat()] } } : { Category: { projections: [col('Branches', 'Country')] }, Y: { projections: [pat()] } }, titled('Chart ' + (i + 1))));
const ER = report('Er', [{ id: 'erpage', name: 'Patients', visuals: [vis('amale', 'cardVisual', [20, 20, 200, 100], { Data: { projections: [pat('Male')] } }), vis('zfemale', 'cardVisual', [240, 20, 200, 100], { Data: { projections: [pat('Female', 'Female')] } })].concat(others) }]);
const CMS = 'Customer Metric Selection';
const AW = report('Aw', [{ id: 'awpage', name: 'Customers', visuals: [vis('l884', 'lineChart', [20, 20, 600, 300], { Category: { projections: [col('Calendar', 'Date')] }, Y: { projections: [mea('Sales', 'Revenue per Customer')] } },
  { title: [{ properties: { show: L('true'), text: { expr: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: CMS } }, Property: CMS } }, Function: 3 } } } } }] })] }]);
const mtitle = (m) => ({ title: [{ properties: { show: L('true'), text: { expr: { Measure: { Expression: { SourceRef: { Entity: M } }, Property: m } } } } }] });
const RQ = report('Rq', [{ id: 'rqpage', name: 'Repeat', visuals: [vis('t1', 'lineChart', [20, 20, 400, 200], { Category: { projections: [col('Branches', 'Country')] }, Y: { projections: [mea(M, 'Repeat Rate')] } }, mtitle('Repeat Title')),
  vis('t2', 'clusteredBarChart', [440, 20, 400, 200], { Category: { projections: [col('Branches', 'Country')] }, Y: { projections: [mea(M, 'Visits')] } }, mtitle('Visits Title'))] }]);
const SL = report('Sl', [{ id: 'slpage', name: 'Filters', visuals: [vis('novalue', 'donutChart', [20, 20, 300, 300], { Category: { projections: [col('Branches', 'Country')] } }, titled('Share'))] }]);

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
const projs = (v) => Object.values(((v.visual || {}).query || {}).queryState || {}).flatMap((r) => (r && r.projections) || []);

// ---------- F: the field's text is the model's own name ----------
{
  const p0 = await call('create_arabic_twin', { path: ER, arabicMonth: false }), T0 = (p0.j && p0.j.texts) || [];
  const fld = T0.find((x) => x.id === 'field:All Measures.Patients'), own = T0.filter((x) => x.kind === 'visualField').map((x) => x.id + '=' + x.text).sort();
  chk(() => fld && fld.text === PT, () => `F1: the field's text is the model's name, never a card's: ${JSON.stringify(fld)} ${p0.err ? short(p0) : ''}`);
  chk(() => JSON.stringify(own) === JSON.stringify(['fieldAt:erpage/amale/All Measures.Patients=Male', 'fieldAt:erpage/zfemale/All Measures.Patients=Female']), () => `F2: each card's own name its own text: ${JSON.stringify(own)}`);
  const w = await write({ path: ER, arabicMonth: false, labels: { 'field:All Measures.Patients': 'المرضى', 'fieldAt:erpage/amale/All Measures.Patients': 'ذكور', 'fieldAt:erpage/zfemale/All Measures.Patients': 'إناث' } });
  const tw = w.dir ? visualsIn(w.dir) : [], dn = (n) => { const v = tw.find((x) => x.name === n); return v ? projs(v).filter((x) => x.queryRef === M + '.' + PT).map((x) => x.displayName).join() : 'missing'; };
  chk(() => !w.err && others.every((v) => dn(v.name) === 'المرضى'), () => `F3: the field's Arabic on the five visuals that show all patients: ${others.map((v) => v.name + '=' + dn(v.name)).join(' ')} ${w.err ? short(w) : ''}`);
  chk(() => dn('amale') === 'ذكور' && dn('zfemale') === 'إناث', () => `F4: each card its own Arabic: male ${dn('amale')}, female ${dn('zfemale')}`);
}

// ---------- C: a title bound to a column ----------
{
  const DATE = { 'field:Calendar.Date': 'التاريخ' }, TITLE = 'title:awpage/l884';
  const p0 = await call('create_arabic_twin', { path: AW, arabicMonth: false, labels: DATE }), t = ((p0.j && p0.j.texts) || []).find((x) => x.id === TITLE);
  chk(() => t && t.kind === 'dynamicTitle' && /Customer Metric Selection/.test(t.what) && /no longer changes/.test(t.what) && AR.test(t.whatAr || ''), () => `C1: a title bound to a column is listed, EN and AR: ${JSON.stringify(t)}`);
  chk(() => !planId(p0) && ((p0.j && p0.j.mixedTitles) || []).some((x) => x.id === TITLE) && (p0.j.planProblemsAr || []).some((x) => AR.test(x)), () => `C2: kept beside an Arabic field: no plan id, mixedTitles names it: ${short(p0)}`);
  const w = await write({ path: AW, arabicMonth: false, labels: Object.assign({ [TITLE]: 'مؤشر العملاء' }, DATE) }), v = w.dir ? visualsIn(w.dir).find((x) => x.name === 'l884') : null;
  const tt = v && ((v.visual.visualContainerObjects || {}).title || [])[0];
  chk(() => !w.err && tt && lit(tt.properties.text) === 'مؤشر العملاء', () => `C3: approved: written as a fixed Arabic title: ${JSON.stringify(tt)} ${w.err ? short(w) : ''}`);
}

// ---------- W: titleMeasures agrees ----------
{
  const w = await write({ path: RQ, arabicMonth: false, labels: { 'title:rqpage/t1': 'معدل التكرار', 'title:rqpage/t2': 'الزيارات' } }), tm = w.j && w.j.titleMeasures;
  chk(() => !w.err && tm && !(tm.notTranslated || []).length && (tm.fixed || []).length === 2 && !((w.plan.j.cannot || []).some((c) => /title measures/.test(c.what))),
    () => `W1: two measure titles approved as fixed Arabic: titleMeasures says them fixed, none not translated: ${JSON.stringify(tm)} ${w.err ? short(w) : ''}`);
}

// ---------- V: the validator's fix text ----------
{
  const r = await call('check_report', { path: SL }), fs0 = ((r.j && r.j.findings) || []).filter((f) => f.rule === 'PBIR_ROLE_REQUIRED_MISSING');
  chk(() => !r.err && fs0.length && fs0.every((f) => /opened reports with this shape/.test(f.fix) && /saving the report in Desktop may rewrite it/.test(f.fix)), () => `V1: an openedInDesktop code's fix says the measurement: ${JSON.stringify(fs0).slice(0, 600)} ${r.err ? short(r) : JSON.stringify(((r.j || {}).findings || []).map((f) => f.rule))}`);
  chk(() => !r.err && !/fixes most structure problems/.test(r.t), () => 'V2: no finding claims that opening and saving fixes most structure problems (not measured)');
}

await s.close();
fs.rmSync(ROOT, { recursive: true, force: true }); fs.rmSync(LOGS, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-tb1c.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('      - ' + p)); console.log(`FAIL  tb1c  ${checks} checks, ${problems.length} failed`); process.exit(1); }
console.log(`PASS  tb1c  ${checks} checks`);
