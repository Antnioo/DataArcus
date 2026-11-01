// 0.3.1 MP1d f: the twin of three front pages built from every real shape the laptop quoted in parts 4 to 8 (the owner's
// Call Center, Fintech and ER dashboards: positions, types, groups, z and query roles as RESULTS.md and the reviewer's
// briefs give them; made-up names and fields, no data). For every visual: its box is its English box mirrored, or a
// named rule's change (movedByRule, keptTogether, fitted, pictureChecks.keptSize); nothing under the guard's limits (75 %
// of its English size; a bar or column chart 60 px); no new overlap left unnamed (pictureChecks.newOverlaps).
//   node test-0.3.1-mp1-shapes.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { draw } from './fixtures/mp1/draw.mjs';

const { PNG } = createRequire(import.meta.url)('pngjs');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const httpReq = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (d) => { t += d; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mp1s-root-')));
const LOGS = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-mp1s-log-'))), log = path.join(LOGS, 'links.txt');
process.env.DATAARCUS_ROOT = ROOT;
const { sampleFiles } = await import('./lib/sample-project.mjs');
sampleFiles('S').forEach((f) => { const p = path.join(ROOT, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
const MODEL = fs.readdirSync(path.join(ROOT, 'S')).find((x) => /\.SemanticModel$/.test(x));
const L = (v) => ({ expr: { Literal: { Value: v } } }), S = (t) => L("'" + String(t).replace(/'/g, "''") + "'");
const SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/';
const W = 1280, H = 720;
const C = (t, c) => ({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c });
const Me = (t, m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m });
const hidden = { categoryAxis: [{ properties: { show: L('false') } }] }, runs = (...vs) => ({ objects: { general: [{ properties: { paragraphs: [{ textRuns: vs.map((value) => ({ value })) }] } }] } });
const bars = (extra) => Object.assign({ query: { queryState: { Category: { projections: [C('Branches', 'Country')] }, Y: { projections: [Me('All Measures', 'Visits')] } } } }, extra || {});
const matrix = { query: { queryState: { Rows: { projections: [C('Branches', 'Country')] }, Values: { projections: [Me('All Measures', 'Visits')] } } } };
const vis = (name, type, x, y, w, h, z, extra, parent) => Object.assign({ $schema: SCHEMA + 'visualContainer/2.1.0/schema.json', name, position: { x, y, z, width: w, height: h, tabOrder: z }, visual: Object.assign({ visualType: type }, extra || {}) }, parent ? { parentGroupName: parent } : {});
const group = (name, x, y, w, h) => ({ $schema: SCHEMA + 'visualContainer/2.1.0/schema.json', name, position: { x, y, z: 1, width: w, height: h, tabOrder: 1 }, visualGroup: { displayName: name, groupMode: 'ScaleMode' } });
const pic = (() => { const p = new PNG({ width: 640, height: 360 }); p.data = Buffer.from(draw('rail', 640, 360)); return PNG.sync.write(p); })();
const background = { background: [{ properties: { image: { image: { name: S('back.png'), url: { expr: { ResourcePackageItem: { PackageName: 'RegisteredResources', PackageType: 1, ItemName: 'back4528801825573012.png' } } }, scaling: S('Fit') } }, transparency: L('0D') } }] };
const T4 = [['Calls', 'المكالمات'], ['Resolution Rate', 'نسبة الحل'], ['Avg Call Duration (sec)', 'متوسط مدة المكالمة (بالثواني)'], ['Avg Speed of Answer', 'متوسط سرعة الرد']];
const PAGES = [
  // Call Center (parts 4b, 6, 7, 8): nav buttons on the rail; "Calls by Department" (axis hidden) and the 2-column
  // ratings table in a group, a small bar chart drawn over the table; the heatmap with a column chart touching its
  // bottom 18 px, a 61.82-wide bar chart in its right margin (8 px over it), the agent card beside it; 4 KPI titles
  // indented by tabs under their icons
  { id: 'cc', name: 'Call Center', visuals: [vis('nav1', 'actionButton', 10, 100, 120, 40, 3000), vis('nav2', 'actionButton', 10, 160, 120, 40, 3000),
    group('row', 548, 258, 711, 200), vis('dept', 'clusteredBarChart', 0, 0, 360, 200, 2000, bars({ objects: hidden }), 'row'),
    vis('ratings', 'tableEx', 372, 0, 339, 200, 2000, { query: { queryState: { Values: { projections: [Me('All Measures', 'Repeat Rate'), Me('All Measures', 'Visits')] } } } }, 'row'),
    vis('stars', 'clusteredBarChart', 522, 10, 150, 150, 2500, bars({ objects: hidden }), 'row'),
    vis('heat', 'pivotTable', 543, 470, 318, 180, 1000, matrix), vis('under', 'clusteredColumnChart', 558, 632, 310, 80, 2000, bars()),
    vis('margin', 'clusteredBarChart', 852.9, 480, 61.82, 160, 2000, bars({ objects: hidden })), vis('agent', 'cardVisual', 930, 470, 200, 100, 2000, { query: { queryState: { Data: { projections: [Me('All Measures', 'Visits')] } } } }),
    ...T4.flatMap(([en], i) => [vis('k' + i, 'textbox', 160 + i * 270, 20, 240, 40, 1000, runs('\t\t\t\t\t', en)), vis('ic' + i, 'image', 162 + i * 270, 25, 30, 30, 2000)])] },
  // Fintech (parts 6, 7, 8): the project matrix with a 1035-wide card behind it; the help box: a shape, its button
  // under its text box, its numbered line; a label " vs PM" beside a number
  { id: 'fin', name: 'Fintech', visuals: [vis('proj', 'pivotTable', 101, 300, 1033.08, 300, 2000, matrix), vis('card', 'cardVisual', 100, 300, 1035, 300, 1000, { query: { queryState: { Data: { projections: [Me('All Measures', 'Visits')] } } } }),
    vis('box', 'shape', 440, 60, 400, 200, 1000), vis('gotit', 'actionButton', 740, 210, 80, 30, 2000), vis('helptext', 'textbox', 460, 70, 360, 130, 3000, runs('1 Pick an order to see its status.')),
    vis('pm', 'textbox', 20, 20, 300, 40, 1000, runs('-8.80 %', ' vs PM'))] },
  // ER (parts 6, 7, 8): the weekday bar chart (axis hidden, 140 wide) 24.03 px over the heatmap matrix's right margin
  { id: 'er', name: 'ER', visuals: [vis('erheat', 'pivotTable', 300, 100, 400, 400, 1000, matrix), vis('weekday', 'clusteredBarChart', 675.97, 120, 140, 360, 2000, bars({ objects: hidden }))] }];
const LABELS = Object.assign({ 'textbox:fin/helptext/0.0': '1 صفّ الطلب لترى حالته.', 'textbox:fin/pm/0.1': 'شهريًا' }, ...T4.map(([, ar], i) => ({ [`textbox:cc/k${i}/0.1`]: ar })));

const dir = path.join(ROOT, 'S', 'Real Pages.Report'), put = (rel, o) => { const p = path.join(dir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, typeof o === 'string' || o instanceof Uint8Array ? o : JSON.stringify(o, null, 2)); };
fs.writeFileSync(path.join(ROOT, 'S', 'Real Pages.pbip'), JSON.stringify({ version: '1.0', artifacts: [{ report: { path: 'Real Pages.Report' } }], settings: { enableAutoRecovery: true } }));
put('definition.pbir', { version: '4.0', datasetReference: { byPath: { path: '../' + MODEL } } });
put('definition/version.json', { $schema: SCHEMA + 'versionMetadata/1.0.0/schema.json', version: '2.0.0' });
put('definition/report.json', { $schema: SCHEMA + 'report/2.1.0/schema.json', themeCollection: {}, resourcePackages: [{ name: 'RegisteredResources', type: 'RegisteredResources', items: [{ name: 'back4528801825573012.png', path: 'back4528801825573012.png', type: 'Image' }] }] });
put('StaticResources/RegisteredResources/back4528801825573012.png', pic);
put('definition/pages/pages.json', { $schema: SCHEMA + 'pagesMetadata/1.0.0/schema.json', pageOrder: PAGES.map((p) => p.id), activePageName: PAGES[0].id });
PAGES.forEach((pg) => { put(`definition/pages/${pg.id}/page.json`, { $schema: SCHEMA + 'page/2.0.0/schema.json', name: pg.id, displayName: pg.name, displayOption: 'FitToPage', width: W, height: H, objects: background });
  pg.visuals.forEach((v) => put(`definition/pages/${pg.id}/visuals/${v.name}/visual.json`, v)); });

const links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' }), call = s.call;
const a = { path: path.join('S', 'Real Pages.pbip'), arabicMonth: false, labels: LABELS };
const plan = await call('create_arabic_twin', a), id = plan.j && plan.j.plan && plan.j.plan.planId;
let w = { err: true, t: 'no plan: ' + short(plan) };
if (id) {
  const n = links().length; await call('approve_plan', { planId: id });
  for (let k = 0; k < 100 && links().length <= n; k++) await sleep(50);
  const url = links()[n] || ''; if (url) { await httpReq(url, 'POST', 'decision=approve'); await call('approve_plan', { planId: id }); }
  w = await call('create_arabic_twin', Object.assign({}, a, { planId: id }));
}
chk(() => !w.err, () => `the twin written: ${short(w)}`);
const twin = path.join(ROOT, 'S', 'Real Pages AR.Report'), j = plan.j || {};
const named = new Set([].concat((j.movedByRule || []).map((x) => x.where), ((j.pictureChecks || {}).keptSize || []).map((x) => x.where), ((j.fitted || {}).textboxes || []).map((x) => x.page + '/' + x.visual),
  (j.keptTogether || []).flatMap((k) => (k.where || []).flatMap((x) => { const m = /^([^/]+)\/(\S+)(?: (?:on|with) (\S+))?/.exec(x); return m ? [m[1] + '/' + m[2]].concat(m[3] ? [m[1] + '/' + m[3]] : []) : []; }))));
const overlapsNamed = ((j.pictureChecks || {}).newOverlaps || []).map((x) => x.where);
const pageBox = (vs, v) => { let x = v.position.x, y = v.position.y, g = v.parentGroupName; while (g) { const p = vs.find((q) => q.name === g); if (!p) break; x += p.position.x; y += p.position.y; g = p.parentGroupName; } return { x, y, w: v.position.width, h: v.position.height }; };
const meets = (p, q) => Math.max(0, Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x)) * Math.max(0, Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y));
const CHARTS = /^(clustered|stacked|hundredPercentStacked)?(Bar|Column)Chart$/i;
PAGES.forEach((pg) => {
  const en = pg.visuals, ar = !w.err ? en.map((v) => JSON.parse(fs.readFileSync(path.join(twin, 'definition/pages', pg.id, 'visuals', v.name, 'visual.json'), 'utf8'))) : [];
  if (!ar.length) return;
  const real = (vs) => vs.filter((v) => !v.visualGroup);
  // every visual: its English box mirrored, or a named rule's change
  const off = real(en).map((v) => { const e = pageBox(en, v), r = pageBox(ar, ar.find((q) => q.name === v.name)), mirror = Math.abs(r.x - (W - e.x - e.w)) < 0.02 && Math.abs(r.w - e.w) < 0.02 && Math.abs(r.y - e.y) < 0.02 && Math.abs(r.h - e.h) < 0.02;
    return mirror || named.has(pg.id + '/' + v.name) ? null : `${v.name}: ${JSON.stringify(r)} (mirror ${W - e.x - e.w})`; }).filter(Boolean);
  chk(() => !off.length, () => `${pg.name}: every visual's box is its English box mirrored or a named rule's change: ${off.join('; ')}`);
  // nothing under the guard's limits
  const small = real(en).map((v) => { const e = v.position, r = ar.find((q) => q.name === v.name).position, chart = CHARTS.test(v.visual.visualType);
    return r.width < e.width * 0.75 || r.height < e.height * 0.75 || (chart && ((r.width < 60 && e.width >= 60) || (r.height < 60 && e.height >= 60))) ? `${v.name} ${r.width} x ${r.height} (English ${e.width} x ${e.height})` : null; }).filter(Boolean);
  chk(() => !small.length, () => `${pg.name}: no visual under 75 % of its English size, no bar or column chart under 60 px: ${small.join('; ')}`);
  // no new overlap left unnamed
  const names = real(en).map((v) => v.name), loose = [];
  for (let i = 0; i < names.length; i++) for (let k = i + 1; k < names.length; k++) {
    const A = names[i], B = names[k], e = meets(pageBox(en, en.find((v) => v.name === A)), pageBox(en, en.find((v) => v.name === B))), r = meets(pageBox(ar, ar.find((v) => v.name === A)), pageBox(ar, ar.find((v) => v.name === B)));
    if (r > 4 && e <= 0 && !overlapsNamed.some((x) => x.startsWith(pg.id + ':') && x.includes(A) && x.includes(B))) loose.push(A + ' + ' + B);
  }
  chk(() => !loose.length, () => `${pg.name}: no new overlap left unnamed: ${loose.join('; ')}`);
});

await s.close();
[ROOT, LOGS].forEach((d) => { try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) { /* left for the OS */ } });
if (problems.length) { console.log(`FAIL script=test-0.3.1-mp1-shapes.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('      - ' + p)); console.log(`FAIL  mp1-shapes  ${checks} checks, ${problems.length} failed`); process.exit(1); }
console.log(`PASS  mp1-shapes  ${checks} checks`);
