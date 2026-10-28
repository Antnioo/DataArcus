// 0.3.1 FX3b: Power BI's default title on an Arabic page (FX3's Seen 1 and 2), each written red first. Hand-made charts
// often have no title card at all; Power BI then shows its default title, composed from the field names with its own
// English "by" («الشريحة by إجمالي الربح», D-1027-03). On made-up fields only (the sample project's model).
//   K1    report-rules.js's types whose default title is off are Microsoft's catalog's (suppressDefaultTitle)
//   T1-T6 the twin of a report whose clustered bar chart and line chart have no title object: each listed with an Arabic
//         draft, written as the approved Arabic (the text only, never "show"), its English when none is approved (said);
//         a multi-row card of two fields (default title off) neither listed nor written; the EN-AR copy's English pages
//         as they were
//   P1-P2 the phone layout: a chart whose mobile.json sets its own title formatting takes the same text; none: none added
//   R1-R4 check_report's AUTO_TITLE on an Arabic page: the two charts, not the card nor a custom visual; none on an
//         English page; none in the twin
//   B1-B3 (D-1028-06, FX5b's item 3) the plan says which charts get thinner bars before the go: plan_layout's answer and
//         the approval page, English and Arabic; counts, sizes and page names only, never a category's name or value
//   node test-0.3.1-fx3b.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null);
const MARKS = /[‎‏⁦-⁩]/g, AR = /[؀-ۿ]/, LATIN = /[A-Za-z]/;
const httpReq = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});

// ---------- K: each type's default title, from Microsoft's catalog ----------
const Rules = req('../assets/js/report-rules.js');
const CAPS = JSON.parse(fs.readFileSync(path.join(HERE, 'node_modules/@microsoft/powerbi-core-visual-schema/data/capabilities.json'), 'utf8'));
const offInCatalog = Object.keys(CAPS).filter((k) => k !== '_metadata' && CAPS[k].suppressDefaultTitle === true).sort();
chk(() => Array.isArray(Rules.DEFAULT_TITLE_OFF) && JSON.stringify([...Rules.DEFAULT_TITLE_OFF].sort()) === JSON.stringify(offInCatalog)
  && Rules.defaultTitle('lineChart') === 'on' && Rules.defaultTitle('cardVisual') === 'off' && Rules.defaultTitle('myCustomVisual0123456789') === 'not known',
() => `K1: the rules' types with no default title are the catalog's (suppressDefaultTitle), every other catalog type's is on, a custom visual's not known: ${JSON.stringify(Rules.DEFAULT_TITLE_OFF)} vs ${JSON.stringify(offInCatalog)}`);

// ---------- the fixture: a hand-made report on the sample's model ----------
const Px = req('../assets/js/pbip-export.js'), E = req('../assets/js/design-engine.js'), Mirror = req('../assets/js/report-mirror.js');
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fx3b-root-')));
const LOGS = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fx3b-log-'))), log = path.join(LOGS, 'links.txt');
process.env.DATAARCUS_ROOT = ROOT;
const { sampleFiles } = await import('./lib/sample-project.mjs');
sampleFiles('S').forEach((f) => { const p = path.join(ROOT, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
const MODEL = fs.readdirSync(path.join(ROOT, 'S')).find((x) => /\.SemanticModel$/.test(x));
const links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' }), call = s.call;
async function approve(pid) {
  const n = links().length; await call('approve_plan', { planId: pid });
  for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50);
  const url = links()[n] || ''; if (url) { await httpReq(url, 'POST', 'decision=approve'); await call('approve_plan', { planId: pid }); }
}
const T = 'Sales', MONTH = { t: 'Calendar', c: 'Month Name', kind: 'month', sortBy: { t: 'Calendar', c: 'Month Number' } }, SALES = { t: T, m: 'Total Sales' };
const B = { kpis: [SALES], measure: SALES, date: MONTH, cats: { bar: { t: 'Branches', c: 'Country' }, column: MONTH, donut: { t: T, c: 'Channel' } }, y: {}, table: [{ t: 'Branches', c: 'Country' }, SALES], slicers: [{ t: T, c: 'Channel' }, null, null], tip: { card: SALES, cat: { t: 'Branches', c: 'Country' } } };
const built = (() => { try { const d = E.fresh(); E.repairState(d);
  return Px.build({ name: 'Plain', title: 'Plain', pageName: 'Overview', lang: 'en', rtl: false, font: d.font, ui: d.ui, theme: E.buildTheme(d, 'en'), sample: false, model: { byPath: MODEL }, bind: B, texts: E.REPORT_TEXTS.en, gallery: false,
    pages: [{ name: 'Overview', page: { w: 1280, h: 720 }, panel: null, hand: true, png: new Uint8Array(Buffer.from(Mirror.BLANK_PNG, 'base64')), slots: [{ kind: 'line', x: 20, y: 20, w: 600, h: 300 }, { kind: 'bar', x: 640, y: 20, w: 600, h: 300 }] }] }); } catch (e) { return { threw: String(e && e.message || e) }; } })();
const typeOf = (f) => { try { return JSON.parse(String(f.data)).visual.visualType; } catch (e) { return null; } };
const files = built.files || [], REP = files.map((f) => f.path.split('/')[0]).find((x) => /\.Report$/.test(x)) || 'Plain.Report';
const lineF = files.find((f) => typeOf(f) === 'lineChart'), dirOf = (f) => f.path.replace(/visual\.json$/, '');
const extra = [];
files.forEach((f) => {
  let data = f.data; const t = /\/visual\.json$/.test(f.path) ? typeOf(f) : null;
  // the two charts: no title object at all (a hand-made chart, Power BI's default title)
  if (t === 'lineChart' || t === 'clusteredBarChart') { const j = JSON.parse(String(f.data)); delete j.visual.visualContainerObjects.title; data = JSON.stringify(j, null, 2); }
  // the phone: the line chart's mobile.json sets its own title size (no text); the bar chart's none
  if (/\/mobile\.json$/.test(f.path)) { const j = JSON.parse(String(f.data)), v = files.find((x) => x.path === f.path.replace(/mobile\.json$/, 'visual.json')), vt = v ? typeOf(v) : null;
    if (vt === 'lineChart') { j.visualContainerObjects = Object.assign({}, j.visualContainerObjects, { title: [{ properties: { fontSize: { expr: { Literal: { Value: '12D' } } } } }] }); data = JSON.stringify(j, null, 2); }
    if (vt === 'clusteredBarChart' && j.visualContainerObjects) { delete j.visualContainerObjects.title; data = JSON.stringify(j, null, 2); } }
  const p = path.join(ROOT, 'S', f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data);
});
// a multi-row card of the same two fields (its default title off) and a custom visual of them, neither with a title card
if (lineF) [['mrcard01', 'multiRowCard', 700], ['custom01', 'myCustomVisual0123456789', 920]].forEach(([name, type, y]) => {
  const j = JSON.parse(String(lineF.data)); j.name = name; j.visual.visualType = type; delete j.visual.visualContainerObjects.title; j.position = Object.assign({}, j.position, { y: 340, x: y - 680, height: 200 });
  const p = path.join(ROOT, 'S', dirOf(lineF).replace(/visuals\/[^/]+\/$/, `visuals/${name}/`), 'visual.json'); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(j, null, 2)); extra.push(name);
});
const PBIP = path.join('S', REP.replace(/\.Report$/, '.pbip'));
if (!fs.existsSync(path.join(ROOT, PBIP))) fs.writeFileSync(path.join(ROOT, PBIP), JSON.stringify({ version: '1.0', artifacts: [{ report: { path: REP } }], settings: { enableAutoRecovery: true } }));
const visualsIn = (dir) => { const P = path.join(dir, 'definition/pages'), out = []; if (!fs.existsSync(P)) return out;
  fs.readdirSync(P).forEach((pg) => { const V = path.join(P, pg, 'visuals'); if (fs.existsSync(V)) fs.readdirSync(V).forEach((v) => { const f = path.join(V, v, 'visual.json'), m = path.join(V, v, 'mobile.json');
    if (fs.existsSync(f)) out.push(Object.assign(JSON.parse(fs.readFileSync(f, 'utf8')), { _page: pg, _mobile: fs.existsSync(m) ? JSON.parse(fs.readFileSync(m, 'utf8')) : null })); }); });
  return out; };
const CHARTS = ['lineChart', 'clusteredBarChart'], isChart = (v) => CHARTS.includes((v.visual || {}).visualType);
const titleOf = (vco) => ((vco || {}).title || []).find((e) => e && !e.selector && e.properties) || null;

// ---------- T, P: the twin ----------
let twinPbip = null;
{
  const p0 = await call('create_arabic_twin', { path: PBIP, arabicMonth: false }), texts = (p0.j && p0.j.texts) || [];
  const fieldLabels = {}; texts.filter((x) => x.kind === 'field' && x.draftArabic).forEach((x) => { fieldLabels[x.id] = x.draftArabic; });
  const p1 = await call('create_arabic_twin', { path: PBIP, arabicMonth: false, labels: fieldLabels }), t1 = (p1.j && p1.j.texts) || [];
  const autos = t1.filter((x) => x.automatic === 'title');
  chk(() => autos.length === 2 && autos.every((x) => /^Total Sales by (Month Name|Country)$/.test(x.text) && x.draftArabic && AR.test(x.draftArabic) && !LATIN.test(x.draftArabic) && /حسب/.test(x.draftArabic)),
    () => `T1: the two charts with no title card are listed, each with its English and an Arabic draft from the approved field names: ${JSON.stringify(autos)} ${p1.err ? short(p1) : ''}`);
  chk(() => !t1.some((x) => x.automatic && extra.some((n) => String(x.id).includes(n))), () => `T2: neither the multi-row card (default title off) nor the custom visual (not known) is listed: ${JSON.stringify(t1.filter((x) => x.automatic))}`);
  const labels = Object.assign({}, fieldLabels); t1.forEach((x) => { if (x.draftArabic && labels[x.id] == null) labels[x.id] = x.draftArabic; });
  const p2 = await call('create_arabic_twin', { path: PBIP, arabicMonth: false, labels }), id2 = p2.j && p2.j.plan && p2.j.plan.planId; if (id2) await approve(id2);
  const w2 = id2 ? await call('create_arabic_twin', { path: PBIP, arabicMonth: false, labels, planId: id2 }) : { err: true, t: 'no plan: ' + short(p2) };
  twinPbip = w2.j && String(w2.j.pbip || '').replace(/\\/g, '/');
  const twin = twinPbip ? visualsIn(path.join(ROOT, twinPbip.replace(/\.pbip$/, '.Report'))) : [], charts = twin.filter(isChart);
  const tt = charts.map((v) => titleOf(v.visual.visualContainerObjects));
  chk(() => !w2.err && tt.length === 2 && tt.every((e) => e && lit(e.properties.text) && AR.test(lit(e.properties.text)) && !LATIN.test(lit(e.properties.text).replace(MARKS, '')) && e.properties.show === undefined),
    () => `T3: the twin writes each chart's approved Arabic title as its own text, and never "show": ${JSON.stringify(tt)} ${w2.err ? short(w2) : ''}`);
  const others = twin.filter((v) => extra.includes(v.name)).map((v) => (v.visual.visualContainerObjects || {}).title);
  chk(() => others.length === 2 && others.every((x) => x === undefined), () => `T4: the card and the custom visual get no title: ${JSON.stringify(others)}`);
  const line = charts.find((v) => v.visual.visualType === 'lineChart'), bar = charts.find((v) => v.visual.visualType === 'clusteredBarChart');
  const mt = line && line._mobile ? titleOf(line._mobile.visualContainerObjects) : null, lineText = line ? lit(titleOf(line.visual.visualContainerObjects).properties.text) : null;
  chk(() => mt && lineText && lit(mt.properties.text) === lineText && mt.properties.show === undefined && lit(mt.properties.fontSize) === '12D', () => `P1: the phone's own title formatting takes the same text: ${JSON.stringify(mt)} vs ${lineText}`);
  chk(() => bar && bar._mobile && !((bar._mobile.visualContainerObjects || {}).title), () => `P2: a phone layout with no title formatting of its own gets none: ${JSON.stringify(bar && bar._mobile)}`);
  // no Arabic for them: the English written as the text, said; the copy's English pages untouched
  const { planTwin } = await import('./lib/twin-plan.mjs');
  const P = planTwin({ path: PBIP, arabicMonth: false, labels: fieldLabels }), kept = (P.answer.notTranslated || []).filter((x) => /^Total Sales by (Month Name|Country)$/.test(String(x.text)) && /automatic/.test(x.why));
  const bt = P.built.pages.flatMap((x) => x.visuals).filter(isChart).map((v) => lit((titleOf(v.visual.visualContainerObjects) || { properties: {} }).properties.text));
  chk(() => bt.length === 2 && bt.every((t) => t && /^Total Sales by (Month Name|Country)$/.test(t.replace(MARKS, ''))) && kept.length === 2, () => `T5: with no Arabic approved the English is written as the text and said: ${JSON.stringify(bt)} ${JSON.stringify(kept)}`);
  const Pc = planTwin({ path: PBIP, arabicMonth: false, labels, into: 'same' }), cv = (Pc.copy && Pc.copy.files || []).filter((f) => /visual\.json$/.test(f.rel)).map((f) => JSON.parse(String(f.data != null ? f.data : fs.readFileSync(path.join(ROOT, 'S', REP, f.from), 'utf8')))).filter(isChart);
  const titled = cv.map((v) => titleOf(v.visual.visualContainerObjects)), ar = titled.filter((e) => e && AR.test(String(lit(e.properties.text)))), none = titled.filter((e) => !e);
  chk(() => cv.length === 4 && ar.length === 2 && none.length === 2, () => `T6: the EN-AR copy: the Arabic pages' charts titled in Arabic (2), the English pages' as they were, no title card (2): ${JSON.stringify(titled)}`);
}

// ---------- R: check_report ----------
{
  const ar = await call('check_report', { path: PBIP, lang: 'ar', checks: ['rtl'] }), en = await call('check_report', { path: PBIP, lang: 'en', checks: ['rtl'] });
  const f = ((ar.j && ar.j.findings) || []).filter((x) => x.rule === 'AUTO_TITLE'), types = f.map((x) => x.visual && x.visual.type).sort();
  chk(() => JSON.stringify(types) === JSON.stringify(['clusteredBarChart', 'lineChart']) && f.every((x) => /default title/.test(x.what) && !/Total Sales/.test(x.what)), () => `R1: the two charts with no title card on an Arabic page are findings, never quoting their text: ${JSON.stringify(f).slice(0, 600)} ${ar.err ? short(ar) : ''}`);
  chk(() => !types.includes('multiRowCard') && !types.some((t) => /^myCustom/.test(t)), () => `R2: not the card (default title off) nor the custom visual (not known): ${JSON.stringify(types)}`);
  chk(() => !en.err && !((en.j.counts || {}).byRule || {}).AUTO_TITLE, () => `R3: none on an English page: ${short(en)}`);
  const tw = twinPbip ? await call('check_report', { path: twinPbip, checks: ['rtl'] }) : { err: true, t: 'no twin' };
  chk(() => !tw.err && (tw.j.rulesRun || []).includes('AUTO_TITLE') && !((tw.j.counts || {}).byRule || {}).AUTO_TITLE, () => `R4: none in the twin: ${short(tw)}`);
}

// ---------- B: the padded charts in the plan and on its approval page ----------
{
  const SAMPLE = path.join('S', fs.readdirSync(path.join(ROOT, 'S')).find((x) => /\.pbip$/.test(x) && !/Plain|AR/.test(x)));
  const pageOf = async (pid) => { const n = links().length; await call('approve_plan', { planId: pid }); for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50); const url = links()[n] || ''; return url ? httpReq(url, 'GET') : ''; };
  const unesc = (h) => String(h).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/<[^>]+>/g, '');
  const en = await call('plan_layout', { name: 'Bars', path: SAMPLE, lang: 'en' }), bt = en.j && en.j.barThickness;
  const KEYS = ['page', 'kind', 'categories', 'padding', 'thickness', 'max'];
  chk(() => bt && bt.charts.length >= 1 && bt.charts.every((c) => Object.keys(c).every((k) => KEYS.includes(k)) && ['bar', 'column'].includes(c.kind) && Number.isFinite(c.categories)) && /thinner bars/.test(bt.said.en) && /أرفع/.test(bt.said.ar),
    () => `B1: plan_layout's answer lists the padded charts (page, kind, counts and sizes only) with what to say in English and Arabic: ${JSON.stringify(bt || en.t).slice(0, 500)}`);
  const hEn = en.j && en.j.plan && en.j.plan.planId ? unesc(await pageOf(en.j.plan.planId)) : '';
  chk(() => bt && hEn.includes('Thinner bars') && hEn.includes(bt.said.en), () => `B2: the English approval page shows the padded charts: ${(hEn.match(/.{0,60}hinner.{0,200}/) || ['none'])[0]}`);
  let a = { name: 'Bars', path: SAMPLE, lang: 'ar' }, ar = await call('plan_layout', a);
  for (let i = 0; i < 3 && ar.j && !(ar.j.plan && ar.j.plan.planId) && ar.j.arabicNames; i++) { const an = ar.j.arabicNames, own = {}; (an.proposeYourself || []).forEach((k, n) => { own[k] = 'الحقل ' + (n + 1); });
    a = Object.assign({}, a, { displayNames: Object.assign({}, a.displayNames || {}, an.suggestedDisplayNames || {}, own) }); ar = await call('plan_layout', a); }
  const bta = ar.j && ar.j.barThickness, hAr = ar.j && ar.j.plan && ar.j.plan.planId ? unesc(await pageOf(ar.j.plan.planId)) : '';
  chk(() => bta && hAr.includes('أشرطة أرفع') && hAr.includes(bta.said.ar), () => `B3: the Arabic approval page shows them in Arabic: ${(hAr.match(/.{0,60}أشرطة.{0,200}/) || ['none'])[0]} ${ar.err ? short(ar) : JSON.stringify(ar.j && ar.j.planProblems).slice(0, 300)}`);
}

await s.close();
fs.rmSync(ROOT, { recursive: true, force: true }); fs.rmSync(LOGS, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-fx3b.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('      - ' + p)); console.log(`FAIL  fx3b  ${checks} checks, ${problems.length} failed`); process.exit(1); }
console.log(`PASS  fx3b  ${checks} checks`);
