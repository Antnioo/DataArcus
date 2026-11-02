// 0.3.1 MP1f: laptop part 9's last differences on the owner's dashboards (rc.8), each check written red first from the
// real shapes (DataArcus branch evidence/0.3.1-shapes, read only: Call Center p1's positions, its legend donut and its
// agent cards), with made-up names, fields and texts, no data.
//   I1-I7  the four KPI text boxes beside their icons and sparklines (Call Center p1, at their real coordinates): each
//          keeps its width; the icon's room goes to the title's paragraph only; a box of one paragraph still narrows
//   L1-L3  a legend donut of two measures: the legend's order reversed so its first item stands at the right; guards
//   R1-R4  the agent card's value column (MX4: the sentence layout, its titles padded); the name beside the photo
//   K1-K3  a value entry with no alignment of its own under a centred default stays centred (RepeatIQ p4, Fintech p2)
//   node test-0.3.1-mp1f.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';

const require = createRequire(import.meta.url);
const M = require('../assets/js/report-mirror.js'), TM = require('../assets/js/text-measure.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const httpReq = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (d) => { t += d; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const L = (v) => ({ expr: { Literal: { Value: v } } }), S = (t) => L("'" + String(t).replace(/'/g, "''") + "'");
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '') : undefined);
const C = (t, c) => ({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c });
const Me = (t, m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m });
const vis = (name, type, box, visual) => ({ name, position: { x: box[0], y: box[1], z: box[4] || 1000, width: box[2], height: box[3], tabOrder: box[4] || 1000 }, visual: Object.assign({ visualType: type }, visual) });
const mir = (v, o) => M.mirrorVisual(v, 1280, Object.assign({ dateTables: ['Dates'], dateColumns: [], textColumns: [] }, o || {})).json;
const refs = (v, role) => v.visual.query.queryState[role].projections.map((p) => p.queryRef);
const align = (v) => (v.visual.objects.value || []).map((e) => lit((e.properties || {}).horizontalAlignment));

// ---------- L: the legend donut (Call Center p1 a28b4206: two measures, no category, legend TopCenter, labels off) ----------
{
  const two = [Me('Measures', 'Calls Answered'), Me('Measures', 'Calls Unanswered')];
  const sort = { sort: [{ field: two[0].field, direction: 'Descending' }], isDefaultSort: true };
  const strip = vis('legendStrip', 'donutChart', [712, 82, 196, 40], { query: { queryState: { Y: { projections: two } }, sortDefinition: sort }, objects: { labels: [{ properties: { show: L('false') } }], legend: [{ properties: { position: S('TopCenter') } }] } });
  chk(() => JSON.stringify(refs(mir(strip), 'Y')) === JSON.stringify(['Measures.Calls Unanswered', 'Measures.Calls Answered']), () => `L1: a legend donut of two measures lists them in reverse, so the first (Answered) stands at the right over its value as the mirrored cards put it: ${JSON.stringify(refs(mir(strip), 'Y'))}`);
  const ring = vis('ring', 'donutChart', [549, 82, 204, 163], { query: { queryState: { Y: { projections: two } }, sortDefinition: sort }, objects: { legend: [{ properties: { show: L('false') } }], labels: [{ properties: { show: L('false') } }] } });
  chk(() => JSON.stringify(refs(mir(ring), 'Y')) === JSON.stringify(refs(ring, 'Y')), () => `L2 (guard): a ring with its legend hidden keeps its order: ${JSON.stringify(refs(mir(ring), 'Y'))}`);
  const byCat = vis('byCat', 'donutChart', [20, 20, 300, 200], { query: { queryState: { Category: { projections: [C('Calls', 'Channel')] }, Y: { projections: [Me('Measures', 'Calls')] } } }, objects: { legend: [{ properties: { position: S('Top') } }] } });
  chk(() => JSON.stringify(mir(byCat).visual.query) === JSON.stringify(byCat.visual.query), () => `L3 (guard): a donut with a category keeps its query: ${JSON.stringify(mir(byCat).visual.query)}`);
}

// ---------- R3, R4: the agent grid's name beside its photo (Call Center p2 c47dbc53) ----------
{
  const agent = Object.assign(Me('Agents', 'First Agent'), { queryRef: 'Min(Agents.Agent)' });
  const grid = vis('agents', 'cardVisual', [149, 83, 1090, 690], { query: { queryState: { Data: { projections: [agent] }, Rows: { projections: [C('Agents', 'Agent')] } } },
    objects: { image: [{ properties: { show: L('false') }, selector: { id: 'default' } }, { properties: { show: L('true'), size: L('100L'), position: S('Left'), verticalAlignment: S('middle') }, selector: { metadata: 'Min(Agents.Agent)' } }],
      value: [{ properties: { fontSize: L('35D') }, selector: { id: 'default' } }], smallMultiplesLayout: [{ properties: { rowCount: L('2L'), columnCount: L('2L'), headerPosition: S('Left') } }],
      smallMultiplesHeader: [{ properties: { fontSize: L('8D'), transparency: L('100D') }, selector: { id: 'default' } }] } });
  const g = mir(grid);
  chk(() => lit(g.visual.objects.image[1].properties.position) === 'Right' && align(g)[0] === 'right', () => `R3: the photo goes right and the name (the card's value; the header is transparent) right-aligned beside it: ${lit(g.visual.objects.image[1].properties.position)}, ${JSON.stringify(align(g))}`);
  const one = vis('one', 'cardVisual', [20, 20, 200, 100], { query: { queryState: { Data: { projections: [Me('Measures', 'Calls')] } } }, objects: { value: [{ properties: { fontSize: L('35D') }, selector: { id: 'default' } }] } });
  chk(() => align(mir(one))[0] === undefined, () => `R4 (guard): a one-value card with no image keeps its value alignment as it is: ${JSON.stringify(align(mir(one)))}`);
}

// ---------- K: a value entry of its own with no alignment, under a centred default ----------
{
  // (RepeatIQ's KPI strip, as p1's 8886cd92: 5 values, the default entry centred; p4's refund rate a percentage with
  // its own entry: the likely shape, the strip of p4 is not in the evidence)
  const five = ['Net Revenue', 'Total Orders', 'Total Customers', 'AOV', 'Refund Rate'].map((m) => Me('Measures', m));
  const strip = mir(vis('kpis', 'cardVisual', [340, 55, 920, 90], { query: { queryState: { Data: { projections: five } } },
    objects: { value: [{ properties: { fontSize: L('25D'), horizontalAlignment: S('center') }, selector: { id: 'default' } }, { properties: { labelPrecision: L('2L') }, selector: { metadata: 'Measures.Refund Rate' } }] } }));
  chk(() => JSON.stringify(align(strip)) === JSON.stringify(['center', undefined]), () => `K1: the refund rate's own value entry, no alignment of its own, takes the centred default (not set right): ${JSON.stringify(align(strip))}`);
  // (Fintech p2: 6 KPI values centred; a count and a percentage with entries of their own)
  const six = ['Projects', 'Budget', 'Spent', 'Late', 'On Time', 'At Risk'].map((m) => Me('Measures', m));
  const fin = mir(vis('fin', 'cardVisual', [30, 140, 1860, 120], { query: { queryState: { Data: { projections: six } } },
    objects: { value: [{ properties: { horizontalAlignment: S('center') }, selector: { id: 'default' } }, { properties: { labelDisplayUnits: L('1D') }, selector: { metadata: 'Measures.Late' } }, { properties: { labelPrecision: L('1L') }, selector: { metadata: 'Measures.At Risk' } }] } }));
  chk(() => !align(fin).includes('right'), () => `K2: Fintech's six centred values: none set right (54 and 44.4% kept centred): ${JSON.stringify(align(fin))}`);
  const cc = mir(vis('cc', 'cardVisual', [110, 80, 1170, 111], { query: { queryState: { Data: { projections: five } } },
    objects: { value: [{ properties: { fontSize: L('25D') }, selector: { id: 'default' } }, { properties: { textWrap: L('true') }, selector: { metadata: 'Measures.AOV' } }] } }));
  chk(() => align(cc).every((a) => a === 'right'), () => `K3 (guard, MP1e A1): a default not centred: every entry right-aligned, the own ones too: ${JSON.stringify(align(cc))}`);
}

// ---------- I, R1, R2: through the server (a plan and its twin) ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mp1f-root-')));
const LOGS = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mp1f-log-'))), log = path.join(LOGS, 'links.txt');
process.env.DATAARCUS_ROOT = ROOT;
const { sampleFiles } = await import('./lib/sample-project.mjs');
sampleFiles('S').forEach((f) => { const p = path.join(ROOT, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
const MODEL = fs.readdirSync(path.join(ROOT, 'S')).find((x) => /\.SemanticModel$/.test(x));
const SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/';
const dir = path.join(ROOT, 'S', 'Calls.Report'), put = (rel, o) => { const p = path.join(dir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(o, null, 2)); };
fs.writeFileSync(path.join(ROOT, 'S', 'Calls.pbip'), JSON.stringify({ version: '1.0', artifacts: [{ report: { path: 'Calls.Report' } }], settings: { enableAutoRecovery: true } }));
put('definition.pbir', { version: '4.0', datasetReference: { byPath: { path: '../' + MODEL } } });
put('definition/version.json', { $schema: SCHEMA + 'versionMetadata/1.0.0/schema.json', version: '2.0.0' });
put('definition/report.json', { $schema: SCHEMA + 'report/2.1.0/schema.json', themeCollection: {} });
put('definition/pages/pages.json', { $schema: SCHEMA + 'pagesMetadata/1.0.0/schema.json', pageOrder: ['cc'], activePageName: 'cc' });
put('definition/pages/cc/page.json', { $schema: SCHEMA + 'page/2.0.0/schema.json', name: 'cc', displayName: 'Overview', displayOption: 'FitToPage', width: 1280, height: 800 });
// (the four KPI boxes at their real coordinates: a title indented by tabs under its icon, the value, a comparison line,
// a legend; left-aligned in English. Their sparklines lie over the boxes' right part)
const run = (value, pt) => ({ value, textStyle: { fontSize: pt + 'pt' } });
const KPI = [
  ['k0', [152.85714285714283, 91.42857142857143, 215.71428571428572], 'i0', [150, 78.33333333333334, 51.66666666666667, 51.66666666666667], 's0', [325, 96.66666666666667, 215, 150], 'Calls', '1,772'],
  ['k1', [152.85714285714283, 266.6666666666667, 214.44444444444443], 'i1', [150, 258.88920162623424, 50.95295536791315, 44.77683956574185], 's1', [325.55555555555566, 270.3251028807647, 214.44444444444443, 151.11111111111111], 'Resolution Rate', '75.4 %'],
  ['k2', [152.85714285714286, 441.42857142857144, 262.8571428571429], 'i2', [150, 435.7142857142857, 51.42857142857143, 45.714285714285715], 's2', [326.6666666666668, 446.2057613170849, 213.33333333333331, 151.11111111111111], 'Avg Call Duration (sec)', '3m 46s'],
  ['k3', [152.85714285714283, 617.6419753089606, 246.66666666666666], 'i3', [150, 610, 51.42857142857143, 47.142857142857146], 's3', [326.6666666666668, 622.0864197534052, 213.33333333333331, 151.11111111111111], 'Avg Speed of Answer', '67']];
const TITLE_AR = { Calls: 'المكالمات', 'Resolution Rate': 'نسبة الحل', 'Avg Call Duration (sec)': 'متوسط مدة المكالمة (بالثواني)', 'Avg Speed of Answer': 'متوسط سرعة الرد' };
const kpiVisuals = KPI.flatMap(([k, b, i, ib, s, sb, title, value], n) => [
  vis(k, 'textbox', [b[0], b[1], b[2], 150, 4000 + n * 3000], { objects: { general: [{ properties: { paragraphs: [
    { textRuns: [run('\t\t\t\t', 12), run(title, 12)] }, { textRuns: [run(value, 20)] }, { textRuns: [run(value + ' | ▼ -8.80 %', 9), run(' vs PM', 9)] }, { textRuns: [run('● This month  ● Highest', 8)] }] } }] } }),
  vis(i, 'image', [ib[0], ib[1], ib[2], ib[3], 5000 + n * 3000], {}),
  vis(s, 'lineChart', [sb[0], sb[1], sb[2], sb[3], 6000 + n * 3000], { query: { queryState: { Category: { projections: [C('Branches', 'Country')] }, Y: { projections: [Me('All Measures', 'Visits')] } } } })]);
// (a one-paragraph title box, MD-c's shape: still narrowed before its icon)
const oneBox = [vis('solo', 'textbox', [600, 20, 200, 40, 30000], { objects: { general: [{ properties: { paragraphs: [{ textRuns: [run('\t\t\t\t\t', 12), run('Calls', 12)] }] } }] } }), vis('soloIcon', 'image', [602, 25, 30, 30, 31000], {})];
// (Call Center p1: Dan's card, its reference label titles padded with "space + LRM" runs into a column)
const pad = (t, n) => t + ' ‎'.repeat(n);
const titles = [['Calls', 30], ['Answered %', 16], ['Resolution Rate', 11], ['Avg Speed of Answer', 2]];
const dan = vis('dan', 'cardVisual', [881, 408, 387, 391, 37000], { query: { queryState: { Data: { projections: [Me('All Measures', 'Visits')] } } },
  objects: { referenceLabelTitle: titles.map(([t, n], i) => ({ properties: { titleContentType: S('custom'), titleText: S(pad(t, n)) }, selector: { metadata: 'All Measures.Visits', id: 'field-' + i } })).concat([{ properties: { titleFontSize: L('12D') }, selector: { metadata: 'All Measures.Visits' } }]) } });
kpiVisuals.concat(oneBox, [dan]).forEach((v) => put(`definition/pages/cc/visuals/${v.name}/visual.json`, Object.assign({ $schema: SCHEMA + 'visualContainer/2.1.0/schema.json' }, v)));
const links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' }), call = s.call;
const AR = ['المكالمات', 'نسبة الرد', 'نسبة الحل', 'متوسط سرعة الرد'];
const labels = Object.assign(Object.fromEntries(AR.map((t, i) => [`text:cc/dan/o.referenceLabelTitle.${i}.titleText`, t])),
  ...KPI.map(([k, , , , , , title]) => ({ [`textbox:cc/${k}/0.1`]: TITLE_AR[title], [`textbox:cc/${k}/2.1`]: 'شهريًا', [`textbox:cc/${k}/3.0`]: '● هذا الشهر  ● الأعلى' })), { 'textbox:cc/solo/0.1': 'المكالمات' });
const a = { path: path.join('S', 'Calls.pbip'), arabicMonth: false, labels };
const plan = await call('create_arabic_twin', a), id = plan.j && plan.j.plan && plan.j.plan.planId;
let w = { err: true, t: 'no plan: ' + short(plan) };
if (id) { const n = links().length; await call('approve_plan', { planId: id }); for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50); const url = links()[n] || ''; if (url) { await httpReq(url, 'POST', 'decision=approve'); await call('approve_plan', { planId: id }); } w = await call('create_arabic_twin', Object.assign({}, a, { planId: id })); }
const V = (n) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'S', 'Calls AR.Report/definition/pages/cc/visuals', n, 'visual.json'), 'utf8')); } catch (e) { return null; } };
const paras = (v) => (v ? v.visual.objects.general[0].properties.paragraphs : []);
const moved = ((w.j || {}).movedByRule || []).map((x) => x.where + ' ' + x.rule);
KPI.forEach(([k, b], n) => { const p = (V(k) || {}).position || {};
  chk(() => !w.err && p.width === M.round(b[2]) && p.x === M.round(1280 - b[0] - b[2]) && !moved.some((m) => m.includes('/' + k + ' ')), () => `I${n + 1}: the KPI box ${k} (a title, a value, a comparison line, a legend) keeps its English width ${M.round(b[2])} at x ${M.round(1280 - b[0] - b[2])}, its lines where the sparkline leaves them: ${JSON.stringify(p)} ${JSON.stringify(moved.filter((m) => m.includes(k)))} ${w.err ? short(w) : ''}`); });
// (the icon's room on the box's end, mirrored: the box's right edge (1280 - x) less the icon's left edge (1280 - x - w),
// plus the 4 px gap)
const padOk = KPI.map(([k, b, , ib]) => { const t = paras(V(k))[0], last = t && t.textRuns[t.textRuns.length - 1], room = (ib[0] + ib[2]) - b[0] + 4;
  const w0 = last && /^ +$/.test(last.value) ? TM.textWidth(last.value.replace(/ /g, ' '), 12) : -1, sp = TM.textWidth(' ', 12);
  return { k, room: Math.round(room * 10) / 10, pad: Math.round(w0 * 10) / 10, ok: w0 >= room && w0 < room + sp && !t.textRuns.some((r) => /\t/.test(r.value)) }; });
chk(() => padOk.every((x) => x.ok), () => `I5: each title's paragraph ends with a no-break space run as wide as its icon's room (no tab left): ${JSON.stringify(padOk)}`);
chk(() => KPI.every(([k]) => { const ps = paras(V(k)); return ps.length === 4 && ps.slice(1).every((pa) => !pa.textRuns.some((r) => / /.test(r.value))) && ps[1].textRuns[0].value === KPI.find((x) => x[0] === k)[7]; }), () => `I6: the value, comparison and legend paragraphs unchanged by the icon's room: ${JSON.stringify(paras(V('k0')).map((pa) => pa.textRuns.map((r) => r.value)))}`);
const so = (V('solo') || {}).position || {}, si = (V('soloIcon') || {}).position || {};
chk(() => so.x + so.width <= si.x - 4 && so.width < 200, () => `I7 (guard, MD-c): a box of one title paragraph still ends 4 px before its icon: ${JSON.stringify(so)} ${JSON.stringify(si)}`);
const d = V('dan'), lay = d && (d.visual.objects.referenceLabelLayout || []).find((e) => !e.selector || e.selector.id === 'default');
// (MX4, laptop part 10: "tabular" cut the contact line and kept each label at the left; Microsoft's capabilities have no
// setting that puts it at the right: the sentence layout, part 9's, keeps the line whole) R1, R2 moved on purpose
chk(() => d && !(lay && lit(lay.properties.style) === 'tabular'), () => `R1 (MX4): the agent card keeps Power BI's sentence layout, where its contact line is whole (no "tabular"): ${JSON.stringify(d && d.visual.objects.referenceLabelLayout)}`);
const tt = d ? d.visual.objects.referenceLabelTitle.filter((e) => e.properties.titleText).map((e) => lit(e.properties.titleText)) : [];
const tw = tt.map((t) => TM.textWidth(t, 10));
chk(() => tt.length === 4 && tt.every((t, i) => t.startsWith('⁧' + AR[i])) && Math.max(...tw) - Math.min(...tw) <= TM.textWidth(' ', 10) + 0.01, () => `R2 (MX4): its Arabic titles padded to one width (MP1e's column, part 9): ${JSON.stringify(tt)}`);

await s.close();
[ROOT, LOGS].forEach((x) => { try { fs.rmSync(x, { recursive: true, force: true }); } catch (e) { /* left for the OS */ } });
if (problems.length) { console.log(`FAIL script=test-0.3.1-mp1f.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('      - ' + p)); console.log(`FAIL  mp1f  ${checks} checks, ${problems.length} failed`); process.exit(1); }
console.log(`PASS  mp1f  ${checks} checks`);
