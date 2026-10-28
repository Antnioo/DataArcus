// 0.3.1 FX3: the Arabic title cases the laptop part 3 found (block A, item A1; Desktop 2.159.883.0), each written red
// first. On made-up fields only (the sample project's Gulf retail and reports built from it here).
//   A1-A7 automatic titles and subtitles (a title or subtitle switched on with no text of its own: Power BI composes it
//         from the field names with its own English "by", «الشريحة by إجمالي الربح»): the twin lists each as a text with
//         an Arabic draft from the approved field names, writes the approved Arabic (or, with none, the English text
//         itself, said), the EN-AR copy's Arabic pages likewise and its English pages as they were; check_report names
//         one on a right-to-left page (AUTO_TITLE), never on a left-to-right one
//   B1-B3 C09 (en+ar, plain look, dark, 1280 x 720, ops, no KPI cards, top filters, pills, waterfall, the sample): no
//         plan id while a title on the Arabic pages would be English without an approved Arabic or a keep-English
//   C1-C2 the sample data's Arabic name: «بيانات تجريبية», never «مختلَقة» (the owner, D-1028-05)
//   D1-D4 the metric switcher's labels on an Arabic report: drafted and approved like the titles, or kept English on purpose
//   node test-0.3.1-fx3.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
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

const Px = req('../assets/js/pbip-export.js'), E = req('../assets/js/design-engine.js');
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fx3-root-')));
const LOGS = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fx3-log-'))), log = path.join(LOGS, 'links.txt');
process.env.DATAARCUS_ROOT = ROOT;   // (lib/twin-plan.mjs, imported below, reads the working folder)
const { sampleFiles } = await import('./lib/sample-project.mjs');
sampleFiles('S').forEach((f) => { const p = path.join(ROOT, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
const SAMPLE = path.join('S', fs.readdirSync(path.join(ROOT, 'S')).find((x) => /\.pbip$/.test(x)));
const MODEL = fs.readdirSync(path.join(ROOT, 'S')).find((x) => /\.SemanticModel$/.test(x));
const links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' }), call = s.call;
async function approve(pid) {
  const n = links().length; await call('approve_plan', { planId: pid });
  for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50);
  const url = links()[n] || ''; if (url) { await httpReq(url, 'POST', 'decision=approve'); await call('approve_plan', { planId: pid }); }
}

// ---------- A: automatic titles and subtitles ----------
// a report on the sample's model, written here as a person's own: its line chart's title and subtitle and its donut's
// subtitle switched on with no text of their own (Power BI composes them from the field names)
const T = 'Sales', MONTH = { t: 'Calendar', c: 'Month Name', kind: 'month', sortBy: { t: 'Calendar', c: 'Month Number' } }, SALES = { t: T, m: 'Total Sales' };
const B = { kpis: [SALES], measure: SALES, date: MONTH, cats: { bar: { t: 'Branches', c: 'Country' }, column: MONTH, donut: { t: T, c: 'Channel' } }, y: {}, table: [{ t: 'Branches', c: 'Country' }, SALES], slicers: [{ t: T, c: 'Channel' }, null, null], tip: { card: SALES, cat: { t: 'Branches', c: 'Country' } } };
const built = (() => { try { const d = E.fresh(); E.repairState(d);
  return Px.build({ name: 'Auto', title: 'Auto', pageName: 'Overview', lang: 'en', rtl: false, font: d.font, ui: d.ui, theme: E.buildTheme(d, 'en'), sample: false, model: { byPath: MODEL }, bind: B, texts: E.REPORT_TEXTS.en, gallery: false,
    pages: [{ name: 'Overview', page: { w: 1280, h: 720 }, panel: null, hand: true, png: new Uint8Array(Buffer.from(req('../assets/js/report-mirror.js').BLANK_PNG, 'base64')), slots: [{ kind: 'line', x: 20, y: 20, w: 600, h: 300 }, { kind: 'donut', x: 640, y: 20, w: 300, h: 300 }, { kind: 'bar', x: 960, y: 20, w: 300, h: 300 }] }] }); } catch (e) { return { threw: String(e && e.message || e) }; } })();
const typeOfFile = (f) => { try { return JSON.parse(String(f.data)).visual.visualType; } catch (e) { return null; } };
const AUTO = { lineChart: ['title', 'subTitle'], donutChart: ['subTitle'] };
(built.files || []).forEach((f) => {
  const t = /\/visual\.json$/.test(f.path) ? typeOfFile(f) : null; let data = f.data;
  if (AUTO[t]) { const j = JSON.parse(String(f.data)), vco = j.visual.visualContainerObjects = j.visual.visualContainerObjects || {};
    AUTO[t].forEach((k) => { vco[k] = [{ properties: { show: { expr: { Literal: { Value: 'true' } } } } }]; }); data = JSON.stringify(j, null, 2); }
  const p = path.join(ROOT, 'S', f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data);
});
const REP = (built.files || []).map((f) => f.path.split('/')[0]).find((x) => /\.Report$/.test(x)) || 'Auto.Report';
const PBIP = path.join('S', REP.replace(/\.Report$/, '.pbip'));
if (!fs.existsSync(path.join(ROOT, PBIP))) fs.writeFileSync(path.join(ROOT, PBIP), JSON.stringify({ version: '1.0', artifacts: [{ report: { path: REP } }], settings: { enableAutoRecovery: true } }));
chk(() => built.files && fs.existsSync(path.join(ROOT, 'S', REP, 'definition')), () => `A0: the fixture report was built: ${built.threw || ''}`);
const visualsIn = (dir) => { const P = path.join(dir, 'definition/pages'), out = []; if (!fs.existsSync(P)) return out;
  fs.readdirSync(P).forEach((pg) => { const V = path.join(P, pg, 'visuals'); if (fs.existsSync(V)) fs.readdirSync(V).forEach((v) => { const f = path.join(V, v, 'visual.json'); if (fs.existsSync(f)) out.push(Object.assign(JSON.parse(fs.readFileSync(f, 'utf8')), { _page: pg })); }); });
  return out; };
const textOf = (v, k) => { const e = (((v.visual || {}).visualContainerObjects || {})[k] || [])[0]; return e && e.properties ? (e.properties.text ? lit(e.properties.text) : null) : undefined; };
const autoOf = (v) => Object.keys(AUTO).includes((v.visual || {}).visualType);
{
  const p0 = await call('create_arabic_twin', { path: PBIP, arabicMonth: false }), texts = (p0.j && p0.j.texts) || [];
  const fieldLabels = {}; texts.filter((x) => x.kind === 'field' && x.draftArabic).forEach((x) => { fieldLabels[x.id] = x.draftArabic; });
  const p1 = await call('create_arabic_twin', { path: PBIP, arabicMonth: false, labels: fieldLabels }), t1 = (p1.j && p1.j.texts) || [];
  const autos = t1.filter((x) => x.automatic);
  chk(() => autos.length === 3 && autos.every((x) => x.draftArabic && AR.test(x.draftArabic) && !LATIN.test(x.draftArabic) && /حسب/.test(x.draftArabic)) && autos.some((x) => x.draftArabic === 'إجمالي المبيعات حسب اسم الشهر'),
    () => `A1: the twin lists the line chart's automatic title and subtitle and the donut's automatic subtitle, each with its English and one Arabic draft from the approved field names: ${JSON.stringify(autos)} ${short(p1)}`);
  // every draft approved, as the laptop did: the twin written, its automatic titles now the visuals' own Arabic texts
  const labels = Object.assign({}, fieldLabels); t1.forEach((x) => { if (x.draftArabic && labels[x.id] == null) labels[x.id] = x.draftArabic; });
  const p2 = await call('create_arabic_twin', { path: PBIP, arabicMonth: false, labels }), id2 = p2.j && p2.j.plan && p2.j.plan.planId; if (id2) await approve(id2);
  const w2 = id2 ? await call('create_arabic_twin', { path: PBIP, arabicMonth: false, labels, planId: id2 }) : { err: true, t: 'no plan: ' + short(p2) };
  const twinPbip = w2.j && String(w2.j.pbip || '').replace(/\\/g, '/'), twin = twinPbip ? visualsIn(path.join(ROOT, twinPbip.replace(/\.pbip$/, '.Report'))) : [];
  const shown = twin.filter(autoOf).flatMap((v) => AUTO[v.visual.visualType].map((k) => textOf(v, k)));
  chk(() => !w2.err && shown.length === 3 && shown.every((t) => t && AR.test(t) && !LATIN.test(t.replace(MARKS, ''))), () => `A2: the twin's automatic title and subtitles are written as the approved Arabic, wholly Arabic: ${JSON.stringify(shown)} ${short(w2)}`);
  // no Arabic for them: the English text itself is written (wholly English), and the plan says so
  const { planTwin } = await import('./lib/twin-plan.mjs');
  const P = planTwin({ path: PBIP, arabicMonth: false, labels: fieldLabels }), kept = (P.answer.notTranslated || []).filter((x) => /Total Sales by (Month Name|Channel)/.test(String(x.text)));
  const bv = P.built.pages.flatMap((x) => x.visuals).filter(autoOf), bt = bv.flatMap((v) => AUTO[v.visual.visualType].map((k) => textOf(v, k)));
  chk(() => bt.length === 3 && bt.every((t) => t && !AR.test(t) && /^Total Sales by (Month Name|Channel)$/.test(t.replace(MARKS, ''))) && kept.length >= 2,
    () => `A3: with no Arabic approved for them, the English text itself is written (never composed by Power BI with Arabic names) and listed as staying English: ${JSON.stringify(bt)} ${JSON.stringify(kept)}`);
  // the copy holding both languages: the Arabic pages' own texts, the English pages as the original
  const Pc = planTwin({ path: PBIP, arabicMonth: false, labels, into: 'same' }), cv = (Pc.copy && Pc.copy.files || []).filter((f) => /visual\.json$/.test(f.rel)).map((f) => JSON.parse(String(f.data != null ? f.data : fs.readFileSync(path.join(ROOT, 'S', REP, f.from), 'utf8')))).filter(autoOf);
  const arT = cv.flatMap((v) => AUTO[v.visual.visualType].map((k) => textOf(v, k))).filter((t) => t && AR.test(t)), enAuto = cv.flatMap((v) => AUTO[v.visual.visualType].map((k) => textOf(v, k))).filter((t) => t === null);
  chk(() => arT.length === 3 && enAuto.length === 3, () => `A4: the EN-AR copy: the Arabic pages' automatic texts written in Arabic (3), the English pages' left as they were (3): ${JSON.stringify(cv.map((v) => AUTO[v.visual.visualType].map((k) => textOf(v, k))))}`);
  const c2 = twinPbip ? await call('check_report', { path: twinPbip, checks: ['rtl'] }) : { err: true, t: 'no twin' };
  chk(() => !c2.err && (c2.j.rulesRun || []).includes('AUTO_TITLE') && !((c2.j.counts || {}).byRule || {}).AUTO_TITLE, () => `A5: check_report runs AUTO_TITLE on the twin and finds none: ${short(c2)}`);
}
{
  const ar = await call('check_report', { path: PBIP, lang: 'ar', checks: ['rtl'] }), en = await call('check_report', { path: PBIP, lang: 'en', checks: ['rtl'] });
  const n = ((ar.j && ar.j.counts && ar.j.counts.byRule) || {}).AUTO_TITLE, f = ((ar.j && ar.j.findings) || []).filter((x) => x.rule === 'AUTO_TITLE');
  chk(() => n === 3 && f.every((x) => x.visual && /automatic/.test(x.what) && !/Total Sales/.test(x.what)), () => `A6: an Arabic page's automatic title and subtitles are findings (3), the report's own text never quoted: ${n} ${JSON.stringify(f).slice(0, 600)}`);
  chk(() => !en.err && !((en.j.counts || {}).byRule || {}).AUTO_TITLE, () => `A7: on a left-to-right page they are not: ${short(en)}`);
}

// ---------- B: C09, the bilingual report's Arabic half ----------
{
  const th = await call('generate_theme', { mode: 'dark', chart: { look: 'plain' }, layout: { page: '1280x720' } }), design = th.j && th.j.design;
  const base = { name: 'C09', path: SAMPLE, design, page: '1280x720', layout: 'ops', kpis: 0, filters: 'top', slicerStyle: 'pills', gallery: ['waterfall'], languages: 'en+ar', lang: 'en' };
  const p0 = await call('plan_layout', base), j0 = p0.j || {}, said = ((j0.bilingual || {}).texts || []);
  chk(() => design && !(j0.plan && j0.plan.planId) && (j0.planProblems || []).some((x) => /Total Sales per Month Name/.test(x) && /arabicTexts/.test(x)),
    () => `B1 (C09): no plan id while a title on the Arabic pages would be English with nothing approved: ${JSON.stringify(j0.plan && j0.plan.planId)} ${JSON.stringify(j0.planProblems || p0.t).slice(0, 600)}`);
  // every text approved as drafted, and the one with no draft given its Arabic: the plan has its id, every title Arabic
  const texts = {}; said.forEach((x) => { if (x.draftArabic) texts[x.text] = x.draftArabic; }); texts['Total Sales per Month Name'] = 'إجمالي المبيعات لكل شهر';
  const p1 = await call('plan_layout', Object.assign({}, base, { arabicTexts: texts })), j1 = p1.j || {};
  const titles = ((j1.bilingual || {}).texts || []).filter((x) => /title/.test(String(x.where)));
  chk(() => j1.plan && j1.plan.planId && titles.length && titles.every((x) => x.arabic && AR.test(x.arabic)), () => `B2: with the titles approved the plan has its id and every title is Arabic: ${JSON.stringify(j1.plan && j1.plan.planId)} ${JSON.stringify(j1.planProblems || p1.t).slice(0, 300)} ${JSON.stringify(titles).slice(0, 400)}`);
  // kept English on purpose (its English back, as arabicTexts says): wholly English, and the plan has its id
  const keep = Object.assign({}, texts, { 'Total Sales per Month Name': 'Total Sales per Month Name' });
  const p2 = await call('plan_layout', Object.assign({}, base, { arabicTexts: keep })), j2 = p2.j || {};
  chk(() => j2.plan && j2.plan.planId, () => `B3: a title kept English on purpose gives the plan its id: ${JSON.stringify(j2.planProblems || p2.t).slice(0, 400)}`);
}

// ---------- C: «بيانات تجريبية» ----------
{
  const g = spawnSync('git', ['grep', '-n', '-e', 'مختلق', '-e', 'مختلَق', '--', '.', ':!mcp/work'], { cwd: REPO, encoding: 'utf8' });
  chk(() => g.status === 1 && !g.stdout, () => `C1: no «مختلَق / مختلقة» left in the product's files (git grep, the work notes aside): ${g.status} ${String(g.stdout || g.stderr).slice(0, 600)}`);
  const sp = fs.readFileSync(path.join(HERE, 'lib/sample-project.mjs'), 'utf8'), aw = fs.readFileSync(path.join(HERE, 'lib/approval-window.mjs'), 'utf8');
  chk(() => /بيانات تجريبية/.test(sp) && /'Made up': 'بيانات تجريبية'/.test(aw) && /مشروع المثال \(بيانات تجريبية\)/.test(aw), () => 'C2: the sample project and its approval page call its data «بيانات تجريبية»');
}

// ---------- D: the metric switcher's labels on an Arabic report ----------
{
  const SW = ['Sales[Total Sales]', 'Sales[Order Count]', 'Sales[Units Sold]'];
  const base = { name: 'MS', path: SAMPLE, page: '1920x1080', layout: 'focus', kpis: 0, filters: 'start', lang: 'ar', metricSwitcher: SW };
  const p0 = await call('plan_layout', base), j0 = p0.j || {}, an = j0.arabicNames || {};
  const drafted = (k) => (an.suggestedDisplayNames || {})[k] || (an.proposeYourself || []).includes(k);
  chk(() => drafted('Sales[Order Count]') && drafted('Sales[Units Sold]'), () => `D1: the switcher's measures are drafted like the report's fields: ${JSON.stringify({ s: an.suggestedDisplayNames, p: an.proposeYourself })}`);
  chk(() => !(j0.plan && j0.plan.planId) && (j0.planProblems || []).some((x) => /Sales\[Units Sold\]/.test(x)), () => `D2: no plan id while a switcher label would be English: ${JSON.stringify(j0.plan && j0.plan.planId)} ${JSON.stringify(j0.planProblems).slice(0, 400)}`);
  const names = Object.assign({}, an.suggestedDisplayNames || {}); (an.proposeYourself || []).forEach((k, i) => { names[k] = k === 'Sales[Units Sold]' ? 'الوحدات المباعة' : 'الحقل ' + (i + 1); });
  const p1 = await call('plan_layout', Object.assign({}, base, { displayNames: names })), j1 = p1.j || {}, ms = ((j1.metricSwitcher || {}).measures || []);
  chk(() => j1.plan && j1.plan.planId && ms.length === 3 && ms.every((x) => AR.test(x.label) && !LATIN.test(x.label)), () => `D3: with the names approved the switcher's labels are Arabic: ${JSON.stringify(ms)} ${JSON.stringify(j1.planProblems || p1.t).slice(0, 300)}`);
  const p2 = await call('plan_layout', Object.assign({}, base, { displayNames: Object.assign({}, names, { 'Sales[Units Sold]': 'Units Sold' }) })), j2 = p2.j || {}, m2 = ((j2.metricSwitcher || {}).measures || []);
  chk(() => j2.plan && j2.plan.planId && m2.some((x) => x.field === 'Sales[Units Sold]' && x.label === 'Units Sold'), () => `D4: a label kept English on purpose: the plan has its id, the label wholly English: ${JSON.stringify(m2)} ${JSON.stringify(j2.planProblems || p2.t).slice(0, 300)}`);
}

await s.close();
fs.rmSync(ROOT, { recursive: true, force: true }); fs.rmSync(LOGS, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-fx3.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('      - ' + p)); console.log(`FAIL  fx3  ${checks} checks, ${problems.length} failed`); process.exit(1); }
console.log(`PASS  fx3  ${checks} checks`);
