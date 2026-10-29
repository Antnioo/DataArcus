// 0.3.1 TB1: the twin's four broken promises found by the laptop's part 4 on hand-built dashboards (D-1029-01), each
// written red first. Made-up reports shaped like hand-built ones, on the sample project's model (no data values).
//   P1-P7 paging: a report of 85 fields and 200 texts, whose terminology sheet filled the answer ("Only 0 texts"):
//         every call lists texts, the sheet is paged on its own (termsFrom), every text and every term is reached,
//         every answer within 40,000 characters; a small report's sheet whole
//   V1-V6 a visual's own name for a field: two cards of one measure named "Male" and "Female": each its own text
//         (page, visual, queryRef), approved on its own, the field's term never written over it, kept said by name;
//         the EN-AR copy the same
//   D1-D6 titles that change with the selection: a title bound to a measure, a chart on a field parameter: listed in
//         plain words EN and AR; written as a fixed Arabic title only when approved (said: it no longer changes), else
//         left as it is and said in notTranslated by name
//   B1-B5 an Arabic label beside a value Desktop draws (a card's reference label and label, a KPI's goal text, a data
//         label's title): written wrapped RLI ... PDI (the V3 rule), Latin runs isolated; a title is not changed
//   node test-0.3.1-tb1.mjs
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
const AR = /[؀-ۿ]/, RLI = '⁧', PDI = '⁩', FSI = '⁨';
const httpReq = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});

// ---------- the fixtures: hand-built reports on the sample's model ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-tb1-root-')));
const LOGS = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-tb1-log-'))), log = path.join(LOGS, 'links.txt');
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
const projs = (v) => Object.values(((v.visual || {}).query || {}).queryState || {}).flatMap((r) => (r && r.projections) || []);

// the big one (RepeatIQ's shape): 85 cards on 3 pages, each its own measure (a long name) and a title; 27 text boxes
const M = 'All Measures', big = [0, 1, 2].map((p) => ({ id: 'bigpage0' + p, name: ['Overview', 'Repeat customers', 'Visit detail'][p], visuals: [] }));
for (let i = 1; i <= 85; i++) big[i % 3].visuals.push(vis('card' + String(i).padStart(3, '0'), 'cardVisual', [(i % 10) * 125, Math.floor(i / 10) * 70, 120, 60], { Data: { projections: [mea(M, `Repeat visit share for clinic group ${String(i).padStart(2, '0')}`)] } }, titled(`Repeat visits ${i}`)));
for (let i = 1; i <= 27; i++) big[i % 3].visuals.push(vis('note' + String(i).padStart(3, '0'), 'textbox', [1000, i * 20, 200, 20], null, null, { general: [{ properties: { paragraphs: [{ textRuns: [{ value: `Note ${i}: figures refresh each morning` }] }] } }] }));
const BIG = report('Big', big);
const SMALL = report('Small', [{ id: 'smallpage', name: 'Summary', visuals: [vis('card001', 'cardVisual', [20, 20, 200, 100], { Data: { projections: [mea(M, 'Visits')] } }, titled('Visits'))] }]);

// the clinic (ER's, Fintech's and AdventureWorks' shapes) on one page
const PV = 'Patients Visits', FP = { Column: { Expression: { SourceRef: { Entity: 'Metric Choice' } }, Property: 'Metric Choice' } };
const clinic = [{ id: 'clinicpage', name: 'Clinic', visuals: [
  vis('male', 'cardVisual', [20, 20, 200, 100], { Data: { projections: [mea(M, PV, 'Male')] } }),
  vis('female', 'cardVisual', [240, 20, 200, 100], { Data: { projections: [mea(M, PV, 'Female')] } }),
  vis('bydept', 'clusteredColumnChart', [460, 20, 400, 200], { Category: { projections: [col('Branches', 'Country')] }, Y: { projections: [mea(M, PV)] } }, titled('Visits by country')),
  // a title bound to a measure of the model (Fintech's matrix title), one approved and one kept
  vis('matrixtitle', 'lineChart', [20, 240, 400, 200], { Category: { projections: [col('Branches', 'Country')] }, Y: { projections: [mea(M, 'Delivered Tasks')] } }, { title: [{ properties: { show: L('true'), text: { expr: { Measure: { Expression: { SourceRef: { Entity: M } }, Property: 'Task Matrix Title' } } } } }] }),
  vis('keptmeasure', 'clusteredBarChart', [440, 240, 400, 200], { Category: { projections: [col('Branches', 'Country')] }, Y: { projections: [mea(M, 'Open Tasks')] } }, { title: [{ properties: { show: L('true'), text: { expr: { Measure: { Expression: { SourceRef: { Entity: M } }, Property: 'Open Tasks Title' } } } } }] }),
  // charts on a field parameter (AdventureWorks): one field (its default title), and two fields; no title text
  vis('fpone', 'clusteredColumnChart', [20, 460, 300, 200], { Y: { projections: [mea('Sales', 'Revenue per Customer')], fieldParameters: [{ parameterExpr: FP, index: 0, length: 1 }] } }),
  vis('fptwo', 'clusteredColumnChart', [340, 460, 300, 200], { Category: { projections: [col('Branches', 'Country')] }, Y: { projections: [mea('Sales', 'Revenue per Customer')], fieldParameters: [{ parameterExpr: FP, index: 0, length: 1 }] } }),
  // the labels beside a value: a card's reference label title and label, a KPI's goal text, a data label's title
  vis('refcard', 'cardVisual', [880, 20, 300, 120], { Data: { projections: [mea(M, 'Visits Change')] } }, null, { referenceLabelTitle: [{ properties: { titleText: S('vs last month') } }], label: [{ properties: { text: S('Monthly') } }] }),
  vis('kpi', 'kpi', [880, 160, 300, 120], { Indicator: { projections: [mea(M, 'Repeat Rate')] } }, null, { goals: [{ properties: { goalText: S('Goal') } }] }),
  vis('labels', 'lineChart', [880, 300, 380, 200], { Category: { projections: [col('Branches', 'Country')] }, Y: { projections: [mea(M, 'Repeat Rate')] } }, titled('Repeat rate'), { labels: [{ properties: { show: L('true'), dynamicLabelTitle: S('Change') } }] })] }];
const CLINIC = report('Clinic', clinic);

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

// ---------- P: paging ----------
{
  const first = await call('create_arabic_twin', { path: BIG, arabicMonth: false }), j = first.j || {};
  chk(() => !first.err && (j.texts || []).length >= 1, () => `P1: the first call lists texts beside the terminology sheet (the laptop: "Only 0 texts"): ${(j.texts || []).length} texts, ${JSON.stringify(j.moreTexts || null).slice(0, 300)} ${first.err ? short(first) : ''}`);
  const mt = (j.terminology || {}).moreTerms;
  chk(() => mt && mt.from === (j.terminology.sheet || []).length && mt.notListed > 0 && /termsFrom/.test(mt.how), () => `P2: the sheet is cut to give the texts room, saying where it goes on (termsFrom): ${JSON.stringify(mt || null)} (sheet ${(j.terminology || {}).sheet && j.terminology.sheet.length})`);
  const sizes = [first.t.length], ids = new Set((j.texts || []).map((t) => t.id)), total = (j.labels || {}).withoutLabel;
  let from = j.moreTexts && j.moreTexts.from, n = 0, stuck = false;
  while (from != null && n++ < 40) { const x = await call('create_arabic_twin', { path: BIG, arabicMonth: false, textsFrom: from }); if (x.err) { stuck = true; break; } sizes.push(x.t.length); const got = x.j.texts || []; if (!got.length) { stuck = true; break; } got.forEach((t) => ids.add(t.id)); from = x.j.moreTexts && x.j.moreTexts.from; }
  chk(() => !stuck && total >= 200 && ids.size === total, () => `P3: every text is reached by textsFrom, each call listing some: ${ids.size} of ${total} (stuck ${stuck})`);
  const fields = new Set(((j.terminology || {}).sheet || []).map((r) => r.field)); let tf = mt && mt.from; n = 0; stuck = false;
  while (tf != null && n++ < 40) { const x = await call('create_arabic_twin', { path: BIG, arabicMonth: false, termsFrom: tf }); if (x.err) { stuck = true; break; } sizes.push(x.t.length); const rows = (x.j.terminology || {}).sheet || []; if (!rows.length || !(x.j.texts || []).length) { stuck = true; break; } rows.forEach((r) => fields.add(r.field)); tf = x.j.terminology.moreTerms && x.j.terminology.moreTerms.from; }
  chk(() => !stuck && fields.size === 85, () => `P4: every term is reached by termsFrom, each call still listing texts: ${fields.size} of 85 (stuck ${stuck})`);
  chk(() => sizes.every((x) => x <= 40000), () => `P5: every answer within 40,000 characters: ${JSON.stringify(sizes)}`);
  const one = await call('create_arabic_twin', { path: BIG, arabicMonth: false, termsFrom: 80 }), sh = ((one.j || {}).terminology || {}).sheet || [];
  chk(() => !one.err && sh.length === 5 && one.j.terminology.termsFrom === 80 && !one.j.terminology.moreTerms && (one.j.texts || []).length >= 1, () => `P6: termsFrom 80 lists the last 5 rows, and texts: ${sh.length} ${short(one).slice(0, 300)}`);
  const sm = await call('create_arabic_twin', { path: SMALL, arabicMonth: false });
  chk(() => !sm.err && sm.j.terminology.sheet.length === 1 && !sm.j.terminology.moreTerms && !sm.j.moreTexts, () => `P7 (guard): a small report's sheet is whole, nothing paged: ${short(sm)}`);
}

// ---------- V, D, B: the clinic ----------
const p0 = await call('create_arabic_twin', { path: CLINIC, arabicMonth: false }), T0 = (p0.j && p0.j.texts) || [];
const own = T0.filter((x) => x.kind === 'visualField');
chk(() => own.length === 2 && own.map((x) => x.text).sort().join() === 'Female,Male' && own.every((x) => /^fieldAt:clinicpage\/(male|female)\/All Measures\.Patients Visits$/.test(x.id))
  && T0.filter((x) => x.kind === 'field' && x.id === 'field:All Measures.Patients Visits').map((x) => x.text).join() === PV,
() => `V1: each card's own name is its own text (page, visual, queryRef); the field keeps the model's name: ${JSON.stringify(own)} ${JSON.stringify(T0.filter((x) => /Patients/.test(x.id)))} ${p0.err ? short(p0) : ''}`);
const dyn = T0.filter((x) => x.kind === 'dynamicTitle'), dynOf = (v) => dyn.find((x) => x.id === 'title:clinicpage/' + v);
chk(() => dyn.length === 4 && ['matrixtitle', 'keptmeasure', 'fpone', 'fptwo'].every((v) => dynOf(v) && /no longer changes/.test(dynOf(v).what) && AR.test(dynOf(v).whatAr || '')),
  () => `D1: the titles that change with the selection are listed, saying plainly (EN and AR) that a fixed Arabic title no longer changes: ${JSON.stringify(dyn).slice(0, 900)}`);
chk(() => /Task Matrix Title/.test(dynOf('matrixtitle').what) && /Metric Choice/.test(dynOf('fptwo').what) && !T0.some((x) => x.automatic && /fp(one|two)/.test(x.id)),
  () => `D2: each names what it follows (the measure, the field parameter), and the field parameter's title is no automatic one written as fixed English: ${JSON.stringify(T0.filter((x) => /fp|matrix/.test(x.id)))}`);
const beside = ['refcard/o.referenceLabelTitle.0.titleText', 'refcard/o.label.0.text', 'kpi/o.goals.0.goalText', 'labels/o.labels.0.dynamicLabelTitle'].map((k) => 'text:clinicpage/' + k);
chk(() => beside.every((id) => T0.some((x) => x.id === id)), () => `B1: every label beside a value is listed (the KPI's goal text and the data label's title too): ${JSON.stringify(beside.filter((id) => !T0.some((x) => x.id === id)))} of ${JSON.stringify(T0.map((x) => x.id))}`);

const AR_LABELS = { 'fieldAt:clinicpage/male/All Measures.Patients Visits': 'ذكور', 'title:clinicpage/matrixtitle': 'مصفوفة تسليم المهام', 'title:clinicpage/fptwo': 'الإيراد لكل عميل حسب الدولة',
  [beside[0]]: 'مقارنة بالشهر الماضي', [beside[1]]: 'شهريًا', [beside[2]]: 'الهدف KPI', [beside[3]]: 'التغير', 'title:clinicpage/labels': 'معدل التكرار' };
const TERMS = { 'All Measures[Patients Visits]': 'المرضى' };
const w = await write({ path: CLINIC, arabicMonth: false, labels: AR_LABELS, terms: TERMS }), twin = w.dir ? visualsIn(w.dir) : [], V = (n) => twin.find((v) => v.name === n);
const dnOf = (n) => (V(n) ? projs(V(n)).map((x) => x.displayName).join() : 'missing');
chk(() => !w.err && dnOf('male') === 'ذكور' && dnOf('female') === 'Female' && dnOf('bydept').includes('المرضى'),
  () => `V2: written: the Male card its own approved Arabic, the Female card its own name kept, the term on the chart only: male ${dnOf('male')}, female ${dnOf('female')}, chart ${dnOf('bydept')} ${w.err ? short(w) : ''}`);
const P1 = w.plan && w.plan.j, nt = (P1 && P1.notTranslated) || [];
chk(() => nt.some((r) => r.text === 'Female' && /field name on one visual/.test(r.where)) && !nt.some((r) => r.text === 'Male'), () => `V3: the kept own name is said by name in notTranslated (and the approved one is not): ${JSON.stringify(nt).slice(0, 700)}`);
chk(() => (P1.texts || []).some((x) => x.id === 'fieldAt:clinicpage/male/All Measures.Patients Visits' && x.label === 'ذكور') && !(P1.labels.unknown || []).length, () => `V4: the own label is taken by its id: ${JSON.stringify((P1.texts || []).filter((x) => x.kind === 'visualField'))} ${JSON.stringify(P1.labels)}`);
const sheetRow = ((P1.terminology || {}).sheet || []).find((r) => r.field === 'All Measures[Patients Visits]');
chk(() => sheetRow && sheetRow.status === 'approved' && sheetRow.consistent === true, () => `V5: the sheet: the term approved and consistent (a visual's own name is not the field's header): ${JSON.stringify(sheetRow)}`);
const titleText = (n) => { const e = V(n) && ((V(n).visual.visualContainerObjects || {}).title || []).find((x) => x && x.properties); return e ? e.properties.text : undefined; };
chk(() => lit(titleText('matrixtitle')) === 'مصفوفة تسليم المهام' && lit(titleText('fptwo')) === 'الإيراد لكل عميل حسب الدولة',
  () => `D3: an approved title is written as a fixed Arabic title: ${JSON.stringify(titleText('matrixtitle'))} ${JSON.stringify(titleText('fptwo'))}`);
chk(() => titleText('keptmeasure') && titleText('keptmeasure').expr.Measure.Property === 'Open Tasks Title' && titleText('fpone') === undefined,
  () => `D4: a title not approved is left as it is (the measure; Power BI composing the field parameter's): ${JSON.stringify(titleText('keptmeasure'))} ${JSON.stringify(titleText('fpone'))}`);
chk(() => nt.some((r) => r.text === 'Open Tasks Title' && /changes with the selection/.test(r.why) && AR.test(r.whyAr || '')) && nt.some((r) => /Revenue per Customer/.test(r.text) && /field parameter/.test(r.why)),
  () => `D5: each kept one is in notTranslated by name, with why (EN and AR): ${JSON.stringify(nt.filter((r) => /Title|Revenue/.test(r.text))).slice(0, 700)}`);
const fpt = (P1.texts || []).find((x) => x.id === 'title:clinicpage/fptwo');
chk(() => fpt && fpt.label && /no longer changes/.test(fpt.approved || '') && AR.test(fpt.approvedAr || ''), () => `D6: an approved one says it no longer changes with the selection: ${JSON.stringify(fpt)}`);
const objText = (n, card, prop) => { const e = V(n) && ((V(n).visual.objects || {})[card] || [])[0]; return e ? lit(e.properties[prop]) : null; };
const wrappedAr = (t, ar) => t === RLI + ar + PDI;
chk(() => wrappedAr(objText('refcard', 'referenceLabelTitle', 'titleText'), 'مقارنة بالشهر الماضي') && wrappedAr(objText('refcard', 'label', 'text'), 'شهريًا'),
  () => `B2: the card's reference label title and label are wrapped RLI ... PDI: ${JSON.stringify(objText('refcard', 'referenceLabelTitle', 'titleText'))} ${JSON.stringify(objText('refcard', 'label', 'text'))}`);
const goal = objText('kpi', 'goals', 'goalText');
chk(() => goal && goal.startsWith(RLI) && goal.endsWith(PDI) && goal.includes(FSI + 'KPI' + PDI) && goal.includes('الهدف'), () => `B3: the KPI's goal text: wrapped, its Latin run isolated: ${JSON.stringify(goal)}`);
chk(() => wrappedAr(objText('labels', 'labels', 'dynamicLabelTitle'), 'التغير'), () => `B4: the data label's title is wrapped: ${JSON.stringify(objText('labels', 'labels', 'dynamicLabelTitle'))}`);
chk(() => lit(titleText('labels')) === 'معدل التكرار', () => `B5 (guard): a title beside no value stays as approved: ${JSON.stringify(titleText('labels'))}`);

// V6: the EN-AR copy: the English pages keep both names, the Arabic pages as the twin
{
  const c = await write({ path: CLINIC, arabicMonth: false, labels: AR_LABELS, terms: TERMS, into: 'same' }), vs = c.dir ? visualsIn(c.dir) : [];
  const cards = vs.filter((v) => v.visual.visualType === 'cardVisual' && projs(v).some((x) => x.queryRef === M + '.' + PV)).map((v) => projs(v)[0].displayName).sort();
  chk(() => !c.err && JSON.stringify(cards) === JSON.stringify(['Female', 'Female', 'Male', 'ذكور'].sort()), () => `V6: the EN-AR copy: the English cards Male and Female, the Arabic ones ذكور and Female: ${JSON.stringify(cards)} ${c.err ? short(c) : ''}`);
}

await s.close();
fs.rmSync(ROOT, { recursive: true, force: true }); fs.rmSync(LOGS, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-tb1.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('      - ' + p)); console.log(`FAIL  tb1  ${checks} checks, ${problems.length} failed`); process.exit(1); }
console.log(`PASS  tb1  ${checks} checks`);
