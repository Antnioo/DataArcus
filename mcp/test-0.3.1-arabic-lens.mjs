// 0.3.1 L1 (wave 2; written red first): "Is this report ready for Arabic?" for a report DataArcus did not write.
// check_report with lens "arabic" answers, page by page, what goes wrong when the report is read in Arabic, each finding
// with its fix in DataArcus's words (a call and its options, a model step, a Power BI setting, or "Power BI has no
// setting for this"). Read-only, metadata only, nothing written. Fixtures (made up; no employer data):
//   (a) R1's English report mcp/test-models/service-orders (the user's own shape)
//   (b) hand/Hand.Report, written here on the same model: one Arabic page built left to right by hand
//   (c) the separate Arabic twin DataArcus writes of (a): nothing left that DataArcus or a setting can fix
//   (d) en/Sales.Report, English only, no Arabic: the lens still answers, "no Arabic pages yet: create_arabic_twin"
//   L   the option and the texts that name it      A, B, C, D   the fixtures       X   every answer
//   node test-0.3.1-arabic-lens.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { AIM } from './lib/scope.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), require = createRequire(import.meta.url);
const A11y = require('../assets/js/report-a11y.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const short = (x) => (x && x.err ? String(x.t).slice(0, 300) : JSON.stringify(x && x.j).slice(0, 400));

// ---- the fixtures written here: PBIR the way a person's report is, on R1's made-up model ----
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-l1-')));
fs.cpSync(path.join(HERE, 'test-models/service-orders'), path.join(ROOT, 'so'), { recursive: true, filter: (f) => !/make-report\.mjs$/.test(f) });
const S = 'https://developer.microsoft.com/json-schemas/fabric/';
const SCHEMA = { pbip: S + 'pbip/pbipProperties/1.0.0/schema.json', pbir: S + 'item/report/definitionProperties/2.0.0/schema.json', platform: S + 'gitIntegration/platformProperties/2.0.0/schema.json',
  version: S + 'item/report/definition/versionMetadata/1.0.0/schema.json', report: S + 'item/report/definition/report/2.1.0/schema.json', pages: S + 'item/report/definition/pagesMetadata/1.0.0/schema.json',
  page: S + 'item/report/definition/page/2.0.0/schema.json', visual: S + 'item/report/definition/visualContainer/2.1.0/schema.json' };
const lit = (v) => ({ expr: { Literal: { Value: v } } }), str = (s) => lit("'" + String(s).replace(/'/g, "''") + "'"), bool = (b) => lit(b ? 'true' : 'false'), int = (n) => lit(n + 'L');
const obj = (props) => [{ properties: props }];
const W = 'Work Orders', D = 'Dim Date';
const col = (t, c) => ({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c });
const mea = (t, m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m });
const q = (roles, sort) => Object.assign({ queryState: Object.fromEntries(Object.entries(roles).map(([r, ps]) => [r, { projections: ps }])) }, sort ? { sortDefinition: { sort } } : {});
const title = (text) => ({ title: obj({ show: bool(true), text: str(text) }) });
const textbox = (text, size) => ({ visualType: 'textbox', objects: { general: obj({ paragraphs: [{ textRuns: [{ value: text, textStyle: { fontFamily: 'Segoe UI', fontSize: size + 'pt' } }], horizontalTextAlignment: 'left' }] }) } });
function writeReport(dir, name, pages) {
  const R = name + '.Report', DEF = R + '/definition';
  const put = (rel, o) => { const f = path.join(ROOT, dir, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n'); };
  put(name + '.pbip', { $schema: SCHEMA.pbip, version: '1.0', artifacts: [{ report: { path: R } }], settings: { enableAutoRecovery: true } });
  put(R + '/definition.pbir', { $schema: SCHEMA.pbir, version: '4.0', datasetReference: { byPath: { path: '../../so/Service Orders.SemanticModel' } } });
  put(R + '/.platform', { $schema: SCHEMA.platform, metadata: { type: 'Report', displayName: name }, config: { version: '2.0', logicalId: '3b1f6e2a-9c47-4d08-8a5e-' + (name === 'Hand' ? '0a1b2c3d4e5f' : '5f4e3d2c1b0a') } });
  put(DEF + '/version.json', { $schema: SCHEMA.version, version: '2.0.0' });
  put(DEF + '/report.json', { $schema: SCHEMA.report, themeCollection: { baseTheme: { name: 'CY24SU10', reportVersionAtImport: '5.61', type: 'SharedResources' } } });
  put(DEF + '/pages/pages.json', { $schema: SCHEMA.pages, pageOrder: pages.map((p) => p.name), activePageName: pages[0].name });
  pages.forEach((p) => {
    put(`${DEF}/pages/${p.name}/page.json`, { $schema: SCHEMA.page, name: p.name, displayName: p.displayName, displayOption: 'FitToPage', width: 1280, height: 720 });
    // tab stops in English reading order (left to right), as a person's report has them
    const order = A11y.readingOrder(p.visuals.map((v) => ({ x: v.x, y: v.y, w: v.w, h: v.h, v })), 'ltr').map((b) => b.v);
    p.visuals.forEach((v, i) => put(`${DEF}/pages/${p.name}/visuals/${v.name}/visual.json`, { $schema: SCHEMA.visual, name: v.name, position: { x: v.x, y: v.y, z: (i + 1) * 1000, height: v.h, width: v.w, tabOrder: order.indexOf(v) * 1000 }, visual: v.visual }));
  });
}
// (b) one Arabic page built left to right by hand. The sentinels are its texts: none may reach an answer
const AR_TITLE = 'أوامر العمل المفتوحة', AR_MIXED = 'عدد الأوامر حسب Department في كل شهر', EN_TITLE = 'Open orders this week';
writeReport('hand', 'Hand', [{ name: 'arPage00001', displayName: 'نظرة عامة', visuals: [
  { name: 'arTitle', x: 24, y: 12, w: 520, h: 54, visual: textbox(AR_TITLE, 24) },
  { name: 'arMixed', x: 24, y: 66, w: 700, h: 34, visual: textbox(AR_MIXED, 11) },
  { name: 'arSlMonth', x: 860, y: 6, w: 190, h: 76, visual: { visualType: 'slicer', query: q({ Values: [col(D, 'Month')] }), objects: { data: obj({ mode: str('Dropdown') }) }, visualContainerObjects: title('الشهر') } },
  { name: 'arPills', x: 1066, y: 6, w: 190, h: 76, visual: { visualType: 'advancedSlicerVisual', query: q({ Values: [col(W, 'Department')] }),
    objects: { layout: obj({ rowCount: int(1), columnCount: int(3) }), value: [{ properties: { horizontalAlignment: str('left') }, selector: { id: 'default' } }] }, visualContainerObjects: title('القسم') } },
  { name: 'arCard', x: 24, y: 110, w: 296, h: 100, visual: { visualType: 'card', query: q({ Values: [mea(W, 'Open Orders')] }), visualContainerObjects: title(EN_TITLE) } },
  { name: 'arWf', x: 24, y: 226, w: 600, h: 230, visual: { visualType: 'waterfallChart', query: q({ Category: [col(D, 'Month')], Y: [mea(W, 'Open Orders')] }), visualContainerObjects: title('التغير في الأوامر حسب الشهر') } },
  { name: 'arMatrix', x: 24, y: 472, w: 1232, h: 232, visual: { visualType: 'pivotTable', query: q({ Rows: [col(W, 'Department')], Columns: [col(D, 'Month')], Values: [mea(W, 'Total Cost')] }), visualContainerObjects: title('التكلفة حسب القسم والشهر') } }
] }]);
// (d) English only, no Arabic anywhere
const EN_HEAD = 'Monthly service cost';
writeReport('en', 'Sales', [
  { name: 'enOverview01', displayName: 'Overview', visuals: [
    { name: 'enTitle', x: 24, y: 12, w: 520, h: 54, visual: textbox(EN_HEAD, 24) },
    { name: 'enNav', x: 860, y: 12, w: 396, h: 40, visual: { visualType: 'pageNavigator' } },
    { name: 'enLine', x: 24, y: 110, w: 1232, h: 300, visual: { visualType: 'lineChart', query: q({ Category: [col(D, 'Month')], Y: [mea(W, 'Total Cost')] }), visualContainerObjects: title('Cost by month') } }
  ] },
  { name: 'enDetail0002', displayName: 'Detail', visuals: [
    { name: 'enTable', x: 24, y: 110, w: 800, h: 500, visual: { visualType: 'tableEx', query: q({ Values: [col(W, 'Order Id'), col(W, 'Status'), mea(W, 'Total Cost')] }), visualContainerObjects: title('Orders') } }
  ] }
]);

const files = () => { const out = []; const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else out.push(path.relative(ROOT, f)); }); walk(ROOT); return out.sort(); };
const log = path.join(os.tmpdir(), 'dataarcus-l1-links-' + process.pid + '.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const approve = async (pid) => { const n = links().length; await w.call('approve_plan', { planId: pid }); const url = await linkAt(n); if (url) { await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId: pid }); } };

try {
  // ---------- L: the option and the texts that name it ----------
  const listed = await w.c.listTools(), tools = Object.fromEntries((listed.tools || []).map((t) => [t.name, t]));
  const cr = tools.check_report || {}, lensIn = (((cr.inputSchema || {}).properties || {}).lens) || {};
  chk(() => JSON.stringify(lensIn.enum) === '["arabic"]', () => `L1. check_report has the option lens with the one value "arabic": ${JSON.stringify(lensIn)}`);
  const { INSTRUCTIONS_MAX } = await import('./lib/agent-text.mjs'), ins = String((w.c.getInstructions && w.c.getInstructions()) || '');
  chk(() => /lens/.test(ins) && /arabic/i.test(ins) && ins.length <= INSTRUCTIONS_MAX && /lens/.test(cr.description) && /ready for Arabic/i.test(cr.description),
    () => `L2. the instructions (${ins.length} of ${INSTRUCTIONS_MAX}) and check_report's description name the lens: ${JSON.stringify(String(cr.description).slice(-300))}`);

  // ---------- every answer: X1 its fixes name real tools and options, X2 within the cap, X3 no text of the report ----------
  const answers = [];
  const enumOk = (p, v) => !p || !Array.isArray(p.enum) || p.enum.includes(v);
  const badFixes = (j) => (j && Array.isArray(j.findings) ? j.findings : []).concat(j && j.summary && j.summary.oneCall ? [{ id: 'oneCall', fix: j.summary.oneCall }] : []).filter((f) => {
    const x = f.fix || {}; if (!x.tool) return !['none', 'desktop'].includes(x.kind);
    const t = tools[x.tool], props = t && t.inputSchema && t.inputSchema.properties;
    return !props || Object.entries(x.options || {}).some(([k, v]) => !props[k] || !enumOk(props[k], v));
  }).map((f) => `${f.id} ${JSON.stringify(f.fix).slice(0, 160)}`);
  const lens = async (p) => { const before = files(), x = await w.call('check_report', { path: p, lens: 'arabic' }), after = files(); answers.push({ p, x, wrote: after.filter((f) => !before.includes(f)) }); return x; };
  const F = (j, rule, page) => (j && Array.isArray(j.findings) ? j.findings : []).filter((f) => f.rule === rule && (!page || (f.page && f.page.id === page)));
  const pagesOf = (j) => (j && Array.isArray(j.pages) ? j.pages : []);

  // ---------- (a) R1's English report ----------
  const a = await lens('so/Service Orders.pbip'), A = a.j || {};
  chk(() => !a.err && A.lens === 'arabic' && /Nothing was changed/.test(A.readOnly || '') && answers[answers.length - 1].wrote.length === 0, () => `A1. the lens answers, read-only, writes nothing: ${short(a)}`);
  const sa = A.summary || {};
  chk(() => sa.pages === 2 && sa.findings === (A.findings || []).length + (A.findingsNotListed || 0) && Array.isArray(sa.top) && sa.top.length >= 1 && sa.top.length <= 3 && sa.oneCall && sa.oneCall.tool === 'create_arabic_twin'
    && /no Arabic pages yet/i.test(sa.say || '') && JSON.stringify(sa).length <= 1200, () => `A2. the summary first: 2 pages, at most 3 top lines, one call create_arabic_twin, "no Arabic pages yet", a screenful: ${JSON.stringify(sa).slice(0, 600)}`);
  chk(() => ['overview0001', 'detail000002'].every((p) => F(A, 'READING_DIRECTION', p).some((f) => f.fix.kind === 'twin' && f.fix.tool === 'create_arabic_twin')),
    () => `A3. each English page has its reading-direction finding, fixed by the twin: ${JSON.stringify(F(A, 'READING_DIRECTION')).slice(0, 400)}`);
  chk(() => F(A, 'BAR_LTR', 'overview0001').some((f) => f.count === 3 && f.fix.kind === 'twin'), () => `A4. the 3 bar charts of the Overview read left to right, the twin mirrors them: ${JSON.stringify(F(A, 'BAR_LTR')).slice(0, 300)}`);
  chk(() => F(A, 'TABLE_COLUMNS', 'detail000002').some((f) => f.fix.kind === 'twin') && F(A, 'MATRIX', 'overview0001').some((f) => f.fix.kind === 'none' && /no right-to-left setting/i.test(f.what + f.fix.how) && /measures/i.test(f.fix.how)),
    () => `A5. the table's columns (the twin reverses them) and the matrix (no setting; the twin reverses only its measures): ${JSON.stringify(F(A, 'TABLE_COLUMNS').concat(F(A, 'MATRIX'))).slice(0, 500)}`);
  chk(() => F(A, 'CALENDAR_VALUES', 'overview0001').some((f) => f.fix.kind === 'model' && f.fix.tool === 'add_gulf_calendar' && f.fix.options.arabicColumnsOnly === true && /Month Name \(Arabic\)/.test(f.fix.how) && /Dim Date\[Month\]/.test(f.what)),
    () => `A6. the matrix's English month names: add_gulf_calendar arabicColumnsOnly, the column named: ${JSON.stringify(F(A, 'CALENDAR_VALUES')).slice(0, 400)}`);
  chk(() => F(A, 'SLICER_ITEMS').some((f) => f.fix.kind === 'none' && /no setting/i.test(f.fix.how)), () => `A7. the dropdown slicers' items: Power BI has no setting, said: ${JSON.stringify(F(A, 'SLICER_ITEMS')).slice(0, 300)}`);
  chk(() => ['overview0001', 'detail000002'].every((p) => F(A, 'TEXT_ENGLISH', p).some((f) => f.count > 0 && f.fix.kind === 'twin')), () => `A8. each page's English texts: the twin's approved labels: ${JSON.stringify(F(A, 'TEXT_ENGLISH')).slice(0, 300)}`);

  // ---------- (b) the Arabic page built by hand ----------
  const b = await lens('hand/Hand.pbip'), B = b.j || {}, P = 'arPage00001';
  chk(() => !b.err && pagesOf(B).some((p) => p.id === P && p.lang === 'ar'), () => `B1. the hand-made page is judged Arabic: ${short(b)}`);
  chk(() => F(B, 'TITLES_LEFT', P).some((f) => f.count >= 4 && f.fix.kind === 'desktop' && /right/i.test(f.fix.how)), () => `B2. the visuals' titles aligned left (RTL_MIRROR): align them right in Desktop: ${JSON.stringify(F(B, 'TITLES_LEFT')).slice(0, 300)}`);
  chk(() => F(B, 'TEXT_MIXED', P).some((f) => f.count === 1 && /U\+2068/.test(f.fix.how)), () => `B3. the Arabic text with a Latin run not isolated: ${JSON.stringify(F(B, 'TEXT_MIXED')).slice(0, 300)}`);
  chk(() => F(B, 'TEXT_LEFT', P).some((f) => f.count === 2 && f.fix.kind === 'desktop'), () => `B4. the 2 Arabic text boxes aligned left: ${JSON.stringify(F(B, 'TEXT_LEFT')).slice(0, 300)}`);
  chk(() => F(B, 'TEXT_ENGLISH', P).some((f) => f.count === 1), () => `B5. the English title on the Arabic page: ${JSON.stringify(F(B, 'TEXT_ENGLISH')).slice(0, 300)}`);
  chk(() => F(B, 'WATERFALL', P).some((f) => f.fix.kind === 'none' && f.fix.tool === 'create_arabic_twin' && f.fix.options.waterfallRtl === 'mirror'), () => `B6. the waterfall: no right-to-left setting, DataArcus's mirrored one named: ${JSON.stringify(F(B, 'WATERFALL')).slice(0, 400)}`);
  chk(() => F(B, 'MATRIX', P).some((f) => f.fix.kind === 'none'), () => `B7. the matrix: no setting: ${JSON.stringify(F(B, 'MATRIX')).slice(0, 300)}`);
  chk(() => F(B, 'CALENDAR_VALUES', P).some((f) => f.count === 3 && f.fix.tool === 'add_gulf_calendar'), () => `B8. the month slicer, waterfall and matrix show English month names: ${JSON.stringify(F(B, 'CALENDAR_VALUES')).slice(0, 300)}`);
  chk(() => F(B, 'PILLS_ORDER', P).some((f) => f.fix.kind === 'desktop') && F(B, 'PILLS_ALIGN', P).some((f) => /cent/i.test(f.fix.how)), () => `B9. the pill slicer: left-to-right order, values not centred: ${JSON.stringify(F(B, 'PILLS_ORDER').concat(F(B, 'PILLS_ALIGN'))).slice(0, 400)}`);
  chk(() => F(B, 'READING_DIRECTION', P).some((f) => f.fix.kind === 'desktop'), () => `B10. the heading at the left of an Arabic page: ${JSON.stringify(F(B, 'READING_DIRECTION')).slice(0, 300)}`);
  chk(() => F(B, 'TAB_ORDER', P).some((f) => f.fix.kind === 'desktop' && /Tab order/.test(f.fix.how)), () => `B11. the tab order left to right on an Arabic page (A11Y_TAB_ORDER, right to left): ${JSON.stringify(F(B, 'TAB_ORDER')).slice(0, 300)}`);

  // ---------- (c) the twin DataArcus writes of (a): every text labelled ----------
  const p0 = await w.call('create_arabic_twin', { path: 'so/Service Orders.pbip' }), T0 = (p0.j && p0.j.texts) || [];
  let k = 0; const L = {}; T0.filter((t) => t.text != null).forEach((t) => { L[t.id] = t.draftArabic || `نص ${++k}`; });
  const p1 = await w.call('create_arabic_twin', { path: 'so/Service Orders.pbip', labels: L }), pid = p1.j && p1.j.plan && p1.j.plan.planId;
  if (pid) await approve(pid);
  const wt = pid ? await w.call('create_arabic_twin', { path: 'so/Service Orders.pbip', planId: pid }) : { err: true, t: 'no plan: ' + short(p1) };
  chk(() => !wt.err && fs.existsSync(path.join(ROOT, 'so/Service Orders AR.pbip')), () => `C0. the twin is written: ${short(wt)}`);
  const c = await lens('so/Service Orders AR.pbip'), Cj = c.j || {};
  const fixable = (Cj.findings || []).filter((f) => !(f.fix && (f.fix.kind === 'none' || (f.fix.kind === 'model' && f.rule === 'CALENDAR_VALUES'))));
  chk(() => !c.err && pagesOf(Cj).length === 2 && pagesOf(Cj).every((p) => p.lang === 'ar') && !fixable.length, () => `C1. on the twin nothing is left that DataArcus or a setting fixes (only "no setting" lines and the model's month values): ${JSON.stringify(fixable).slice(0, 700)} ${short(c)}`);
  chk(() => F(Cj, 'MATRIX').length === 1 && F(Cj, 'SLICER_ITEMS').length >= 1, () => `C2. the matrix and the slicer items stay, said plainly: ${JSON.stringify((Cj.findings || []).map((f) => f.rule))}`);

  // ---------- (d) English only ----------
  const d = await lens('en/Sales.pbip'), Dj = d.j || {};
  chk(() => !d.err && /no Arabic pages yet/i.test((Dj.summary || {}).say || '') && /create_arabic_twin/.test((Dj.summary || {}).say || ''), () => `D1. "no Arabic pages yet: create_arabic_twin": ${JSON.stringify(Dj.summary).slice(0, 400)}`);
  chk(() => F(Dj, 'TIME_AXIS', 'enOverview01').some((f) => f.fix.kind === 'twin' && f.fix.options.timeRightToLeft === true), () => `D2. the line chart over months reads left to right: the twin's timeRightToLeft: ${JSON.stringify(F(Dj, 'TIME_AXIS')).slice(0, 300)}`);
  chk(() => F(Dj, 'PAGE_NAVIGATOR', 'enOverview01').some((f) => f.fix.kind === 'none' && /no order setting/i.test(f.fix.how)), () => `D3. the page navigator: Power BI has no order setting: ${JSON.stringify(F(Dj, 'PAGE_NAVIGATOR')).slice(0, 300)}`);

  // ---------- X ----------
  chk(() => answers.length === 4 && answers.every((x) => !x.x.err && x.x.j && Array.isArray(x.x.j.findings) && x.x.j.findings.length && !badFixes(x.x.j).length),
    () => `X1. every fix that names a tool names a real one (tools/list) with real options: ${answers.map((x) => `${x.p}: ${x.x.j ? badFixes(x.x.j).join('; ') : short(x.x)}`).join(' | ').slice(0, 800)}`);
  chk(() => answers.every((x) => x.x.t.length <= AIM && x.x.j && x.x.j.summary), () => `X2. every lens answer within ${AIM} characters: ${answers.map((x) => x.x.t.length).join(', ')}`);
  chk(() => answers.every((x) => ![AR_TITLE, AR_MIXED, EN_TITLE, EN_HEAD, 'Cost by month'].some((s) => x.x.t.includes(s))), () => 'X3. no text of a report (title, text box) reaches a lens answer');
  const plain = await w.call('check_report', { path: 'hand/Hand.pbip' }), PJ = plain.j || {};
  chk(() => !plain.err && Array.isArray(PJ.findings) && !('lens' in PJ) && !('summary' in PJ) && PJ.validator && PJ.counts, () => `X4. check_report without lens answers as before (no lens keys): ${short(plain)}`);
} finally {
  await w.close();
  try { fs.rmSync(log, { force: true }); fs.rmSync(ROOT, { recursive: true, force: true }); } catch (e) { /* the OS cleans its temp folder */ }
}
if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  arabic-lens  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  arabic-lens  ${checks} checks`);
