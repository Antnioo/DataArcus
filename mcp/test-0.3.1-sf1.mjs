// 0.3.1 SF1 (the reviewer's brief, 27 Oct; the owner: "get 0.3.1 in a shape that you yourself would back up by every
// means"): the hard rules proven on the paths 0.3.1 added, the way back to 0.3.0, and round 4's text finding.
//   R4  round 4 (a simulated tester: "native copy with consistent text", then the EN-AR copy; 18 of 36 visuals kept
//       their own text settings): consistentText (and keepPositions, titles, restyle) work on a redesign only; given
//       with a native copy (customVisualsFrom) or a new report they were dropped silently. Now plan_layout refuses them
//       there, naming the route, and create_report writes nothing; the route itself (the native copy, its redesign
//       with consistentText, then the EN-AR copy) leaves no visual of a known type with text settings of its own.
//   WB  the way back: mcp/CHANGELOG.md's 0.3.1 section names the 0.3.0 file, where it is, its SHA-256 (the one the
//       0.3.0 release notes publish, recorded in mcp/research/SKILL-PACKAGING.md) and how to install it over 0.3.1;
//       mcp/README.md's install section says how to go back, and its RELEASE comment, applied as it says, leaves no
//       download line on another version (scripts/check-release.mjs's own reading).
// Made-up data only (NC1's custom visuals lab); temporary folders under os.tmpdir().
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { writeLab, NAME } from './lab/custom-visuals-lab.mjs';
import { SHARED_AXES } from './lab/custom-visuals-run.mjs';
import { writeLab as writeCLab } from './lab/consistency-lab.mjs';
import { visualText, KNOWN_TYPES } from './lib/text-format.mjs';
import { downloadFacts } from '../scripts/check-release.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x.err ? x.t.slice(0, 400) : JSON.stringify(x.j).slice(0, 400));
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
// the visuals of a known type that keep a text setting of their own (CS1's reading), and all visuals
const ownText = (rep) => { const vs = tree(rep).filter((f) => path.basename(f) === 'visual.json').map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
  return { all: vs.length, own: vs.filter((j) => KNOWN_TYPES.has((j.visual || {}).visualType) && visualText(j).overrides.length).length }; };
const read = (f) => fs.readFileSync(path.join(HERE, f), 'utf8');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sf1-')), ROOTS = [TMP];
try {
  // ---------- R4: consistentText outside a redesign ----------
  const LAB = path.join(TMP, 'lab'); writeLab(LAB);
  const FROM = 'lab/' + NAME + '.Report', NATIVE = 'lab/' + NAME + ' native.Report';
  const s = await serverClient(TMP, {});
  try {
    const cv = await s.call('plan_layout', { path: 'lab', customVisualsFrom: FROM, sharedAxes: SHARED_AXES, consistentText: 'report' });
    const probs = (cv.j && cv.j.planProblems) || [];
    chk(() => !cv.err && !(cv.j.plan && cv.j.plan.planId) && probs.some((p) => /consistentText/.test(p) && /redesignFrom/.test(p) && /native/.test(p)),
      () => `R4-1. a native copy with consistentText: no plan id, a problem naming the route (the native copy, then its redesign with consistentText): ${short(cv)}`);
    for (const [k, v] of [['keepPositions', true], ['titles', { 'p1/x': 'New title' }], ['restyle', { mode: 'dark' }]]) {
      const r = await s.call('plan_layout', { path: 'lab', customVisualsFrom: FROM, sharedAxes: SHARED_AXES, [k]: v });
      chk(() => !r.err && !(r.j.plan && r.j.plan.planId) && (r.j.planProblems || []).some((p) => p.includes(k) && /redesignFrom/.test(p)), () => `R4-2. a native copy with ${k}: refused, named: ${short(r)}`);
    }
    const nr = await s.call('plan_layout', { path: 'lab', consistentText: 'theme' });
    chk(() => !nr.err && !(nr.j.plan && nr.j.plan.planId) && (nr.j.planProblems || []).some((p) => /consistentText/.test(p) && /redesignFrom/.test(p)), () => `R4-3. a new report with consistentText: refused, named: ${short(nr)}`);
    // the write: a native copy's approved plan, called with consistentText, writes nothing
    const pl = await s.call('plan_layout', { path: 'lab', customVisualsFrom: FROM, sharedAxes: SHARED_AXES });
    chk(() => !pl.err && pl.j.plan && pl.j.plan.planId, () => `R4-4. the native copy's plan: ${short(pl)}`);
    await s.call('approve_plan', { planId: pl.j.plan.planId });
    const bad = await s.call('create_report', { path: 'lab', planId: pl.j.plan.planId, customVisualsFrom: FROM, sharedAxes: SHARED_AXES, consistentText: 'report' });
    chk(() => bad.err && /Nothing was written/.test(bad.t) && /consistentText/.test(bad.t) && !fs.existsSync(path.join(TMP, NATIVE)), () => `R4-5. create_report with a native copy's plan and consistentText writes nothing: ${short(bad)}`);
    // the route that works, end to end
    const w = await s.call('create_report', { path: 'lab', planId: pl.j.plan.planId, customVisualsFrom: FROM, sharedAxes: SHARED_AXES });
    const n0 = ownText(path.join(TMP, NATIVE));
    chk(() => !w.err && n0.own > 0, () => `R4-6. the native copy keeps the lab's own text settings (the redesign cleans them): ${JSON.stringify(n0)} ${short(w)}`);
    const rd = await s.call('plan_layout', { path: 'lab', redesignFrom: NATIVE, consistentText: 'report' });
    await s.call('approve_plan', { planId: rd.j.plan.planId });
    const rw = await s.call('create_report', { path: 'lab', redesignFrom: NATIVE, planId: rd.j.plan.planId, consistentText: 'report' });
    const RED = rw.j ? path.join(TMP, 'lab', path.basename(String(rw.j.report))) : '', r0 = ownText(RED);
    chk(() => !rw.err && r0.all === n0.all && r0.own === 0, () => `R4-7. its redesign with consistentText: no visual of a known type keeps its own text: ${JSON.stringify(r0)} ${short(rw)}`);
    const tp = await s.call('create_arabic_twin', { path: path.relative(TMP, RED), into: 'same' });
    await s.call('approve_plan', { planId: tp.j.plan.planId });
    const tw = await s.call('create_arabic_twin', { path: path.relative(TMP, RED), into: 'same', planId: tp.j.plan.planId });
    const enar = fs.readdirSync(path.join(TMP, 'lab')).find((x) => /\(EN-AR\)\.Report$/.test(x)), e0 = enar ? ownText(path.join(TMP, 'lab', enar)) : { all: 0, own: -1 };
    chk(() => !tw.err && e0.all > r0.all && e0.own === 0, () => `R4-8. then the EN-AR copy: both halves without text settings of their own: ${JSON.stringify(e0)} ${short(tw)}`);
  } finally { await s.close(); }

  // ---------- C: a name with a control character is refused or left out, never written raw (AUD-032) ----------
  const CC = /\p{Cc}/u;
  // every string of a JSON file (a raw control character in a JSON string would not parse at all)
  const strings = (x) => (typeof x === 'string' ? [x] : x && typeof x === 'object' ? Object.entries(x).flatMap(([k, v]) => [k].concat(strings(v))) : []);
  const before = (d) => new Set(tree(d));
  // C1: the Gulf calendar's script relates a date column with a tab in its name (asked; a line break is refused by the
  // Table[Column] reading already), or a date table with a
  // tab in its name (reached through the fact column's own date table, GC3's route)
  const GC = path.join(TMP, 'gc');
  const gcModel = (dir, tables, relationships) => { fs.mkdirSync(path.join(GC, dir, 'M.SemanticModel'), { recursive: true });
    fs.writeFileSync(path.join(GC, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: tables.map(([name, cols]) => ({ name, partitions: [{ name, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], columns: cols.map(([n, t]) => ({ name: n, dataType: t, sourceColumn: n })) })), relationships } })); };
  gcModel('a', [['Sales', [['Order\tDate', 'dateTime'], ['Amount', 'double']]]], []);
  gcModel('b', [['Sales', [['Order Date', 'dateTime'], ['Amount', 'double']]], ['Cal\tendar', [['Date', 'dateTime']]]], [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Order Date', toTable: 'Cal\tendar', toColumn: 'Date' }]);
  const g = await serverClient(TMP, {});
  try {
    for (const [dir, rel, what] of [['a', 'Sales[Order\tDate]', 'a date column with a tab in its name'], ['b', 'Sales[Order Date]', 'a date table with a tab in its name, reached through the column\'s own date table']]) {
      const was = before(GC), pl = await g.call('add_gulf_calendar', { path: `gc/${dir}`, firstYear: 2025, lastYear: 2026, relateTo: [rel], asOf: '2026-10-27' });
      let script = '';
      if (!pl.err && pl.j.plan) { await g.call('approve_plan', { planId: pl.j.plan.planId }); const w = await g.call('add_gulf_calendar', { path: `gc/${dir}`, firstYear: 2025, lastYear: 2026, relateTo: [rel], asOf: '2026-10-27', planId: pl.j.plan.planId });
        const f = w.j && w.j.scriptFile; script = f && fs.existsSync(path.join(TMP, f)) ? fs.readFileSync(path.join(TMP, f), 'utf8') : ''; }
      const names = script.split('\n').filter((l) => /^\t*(relationship|fromColumn|toColumn|table|column) /.test(l)).map((l) => l.replace(/^\t+/, ''));
      chk(() => (pl.err && /Nothing was written/.test(pl.t) && tree(GC).length === was.size) || (!pl.err && script && !/(fromColumn|toColumn): [^\n]*[\t\r\x0b]/.test(script) && !/'[^'\n]*$/m.test(script)),
        () => `C1. the Gulf calendar with ${what}: refused (nothing written) or no raw control character in the script: ${pl.err ? pl.t.slice(0, 300) : JSON.stringify(names)}`);
    }
  } finally { await g.close(); }

  // C2: consistentText "report": the text set's font comes from the visuals; a face with a control character after its
  // first family ("Arial, Foo<tab>Bar") is a value DataArcus does not read: kept on its visual, never written into the theme
  const CL = path.join(TMP, 'cl'); await writeCLab(CL);
  const CREP = path.join(CL, 'Store Ops.Report'), BADFACE = "'Arial, Foo\tBar'";
  for (const v of ['cardSales', 'cardOrders', 'cardBasket', 'colBranch', 'lineMonth', 'tblProducts']) {
    const f = path.join(CREP, 'definition/pages/a1b2c3d4e5f6a7b8c9d0/visuals', v, 'visual.json'), j = JSON.parse(fs.readFileSync(f, 'utf8'));
    j.visual.visualContainerObjects.title[0].properties.fontFamily = { expr: { Literal: { Value: BADFACE } } }; fs.writeFileSync(f, JSON.stringify(j, null, 2));
  }
  const c = await serverClient(CL, {});
  try {
    const pl = await c.call('plan_layout', { path: 'Gulf Retail.SemanticModel', redesignFrom: 'Store Ops.pbip', consistentText: 'report' });
    chk(() => !pl.err && pl.j.plan && !CC.test(JSON.stringify((pl.j.redesign.text || {}).set || []).replace(/\\[tnr]/g, (m) => ({ '\\t': '\t', '\\n': '\n', '\\r': '\r' }[m]))), () => `C2. the plan's text set holds no control character: ${short(pl)}`);
    if (pl.j && pl.j.plan) { await c.call('approve_plan', { planId: pl.j.plan.planId }); await c.call('create_report', { path: 'Gulf Retail.SemanticModel', redesignFrom: 'Store Ops.pbip', planId: pl.j.plan.planId, consistentText: 'report' }); }
    const out = path.join(CL, 'Store Ops redesigned.Report'), themes = tree(out).filter((f) => /StaticResources[\\/]RegisteredResources[\\/][^\\/]+\.json$/.test(f));
    chk(() => themes.length === 1 && !strings(JSON.parse(fs.readFileSync(themes[0], 'utf8'))).some((x) => CC.test(x)), () => `C2. the written theme holds no font face with a control character: ${themes.map((f) => fs.readFileSync(f, 'utf8').match(/"fontFamily"[^\n]*/g)).join(' ')}`);
  } finally { await c.close(); }

  // C3: every JSON file the 0.3.1 copies wrote above (the native copy, its consistent redesign, the EN-AR copy) parses,
  // and no name in them holds a control character (the lab's names have none: the guard for a writer that adds one)
  const copies = fs.readdirSync(path.join(TMP, 'lab')).filter((x) => / native/.test(x) && /\.Report$/.test(x)).map((x) => path.join(TMP, 'lab', x));
  const bad = copies.flatMap((d) => tree(d).filter((f) => f.endsWith('.json')).filter((f) => { try { return strings(JSON.parse(fs.readFileSync(f, 'utf8'))).some((x) => CC.test(x)); } catch (e) { return true; } }));
  chk(() => copies.length === 3 && !bad.length, () => `C3. the native copy, its redesign and the EN-AR copy: every JSON file parses, no name with a control character: ${copies.length} ${bad.slice(0, 5)}`);

  // ---------- B and A: every 0.3.1 write path, on NC1's lab with values planted ----------
  // B: nothing is written before the person's click (a plan id never approved is refused, nothing on disk); a write that
  // fails part way (DATAARCUS_TEST_WRITE_FAIL) leaves nothing. A: no answer and no approval page holds a data value: a
  // page filter, a slicer selection, a custom slicer's saved selection, a bookmark's filter, the model's rows.
  const RB = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sf1b-'))); ROOTS.push(RB);
  writeLab(path.join(RB, 'lab'));
  const SENT = { filter: 'SF1_FILTER_SENT_71', slicer: 'SF1_SLICER_SENT_72', custom: 'SF1_CUSTOM_SENT_73', bookmark: 'SF1_BOOKMARK_SENT_74', row: 'SF1_ROW_SENT_75' };
  // the lab's own made-up rows (lab/custom-visuals-lab.mjs: branches and products), never metadata
  const ROWS = ['Marina Walk', 'Old Souk', 'Al Qasba', 'Tahlia', 'West Bay', 'Bakhoor Set', 'Brass Lantern', 'Dallah Pot', 'Silk Shayla', 'Embroidered Abaya'];
  {
    const D = path.join(RB, 'lab', NAME + '.Report/definition'), vis = (n) => tree(D).find((f) => f.endsWith(path.join('visuals', n, 'visual.json')));
    const lit = (v) => ({ Literal: { Value: `'${v}'` } }), colOf = (e, p) => ({ Column: { Expression: { SourceRef: { Entity: e } }, Property: p } });
    const inF = (e, p, v) => ({ Version: 2, From: [{ Name: 's', Entity: e, Type: 0 }], Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: 's' } }, Property: p } }], Values: [[lit(v)]] } } }] });
    const rw = (f, fn) => { const j = JSON.parse(fs.readFileSync(f, 'utf8')); fn(j); fs.writeFileSync(f, JSON.stringify(j, null, 2)); };
    const pg = path.dirname(path.dirname(path.dirname(vis('slMonth'))));
    rw(path.join(pg, 'page.json'), (j) => { j.filterConfig = { filters: [{ name: 'pf1', field: colOf('Branches', 'City'), type: 'Categorical', filter: inF('Branches', 'City', SENT.filter) }] }; });
    rw(vis('slMonth'), (j) => { j.visual.objects = Object.assign({}, j.visual.objects, { general: [{ properties: { filter: { filter: inF('Calendar', 'Month', SENT.slicer) } } }] }); });
    rw(vis('cvChipSlicer'), (j) => { j.visual.objects = Object.assign({}, j.visual.objects, { general: [Object.assign({}, ((j.visual.objects || {}).general || [])[0], { properties: Object.assign({}, (((j.visual.objects || {}).general || [])[0] || {}).properties, { filter: { filter: inF('Branches', 'Country', SENT.custom) } }) })] }); });
    const BM = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/', sec = path.basename(pg);
    fs.mkdirSync(path.join(D, 'bookmarks'), { recursive: true });
    fs.writeFileSync(path.join(D, 'bookmarks/bookmarks.json'), JSON.stringify({ $schema: BM + 'bookmarksMetadata/1.0.0/schema.json', items: [{ name: 'bmSf1' }] }, null, 2));
    fs.writeFileSync(path.join(D, 'bookmarks/bmSf1.bookmark.json'), JSON.stringify({ $schema: BM + 'bookmark/1.4.0/schema.json', displayName: 'Saved view', name: 'bmSf1', explorationState: { version: '1.3', activeSection: sec,
      sections: { [sec]: { visualContainers: {}, filters: { byExpr: [{ name: 'bf1', type: 'Categorical', expression: colOf('Branches', 'City'), filter: inF('Branches', 'City', SENT.bookmark) }] } } } } }, null, 2));
    const mb = path.join(RB, 'lab', NAME + '.SemanticModel/model.bim'); fs.writeFileSync(mb, fs.readFileSync(mb, 'utf8').replace(/\\"Seef\\"/g, `\\"${SENT.row}\\"`));
  }
  const print = (d) => tree(d).map((f) => path.relative(d, f) + ':' + fs.statSync(f).size).sort().join('\n');
  const said = [], pages = [];
  const BLOG = path.join(TMP, 'links.txt'), links = () => (fs.existsSync(BLOG) ? fs.readFileSync(BLOG, 'utf8').split('\n').filter(Boolean) : []);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const get = (url, method) => new Promise((resolve) => { const u = new URL(url), r = http.request(u, { method: method || 'GET', headers: Object.assign({ Host: u.host }, method === 'POST' ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (x) => { t += x; }); res.on('end', () => resolve(t)); }); r.on('error', () => resolve('')); if (method === 'POST') r.write('decision=approve'); r.end(); });
  const sU = await serverClient(RB, {}), sW = await serverClient(RB, { DATAARCUS_TEST_CLICK: 'log:' + BLOG, DATAARCUS_APPROVAL_WAIT_MS: '200' });
  const ask = async (srv, tool, args) => { const r = await srv.call(tool, args); said.push(r.t); return r; };
  // the person's click: the page as their browser gets it, then Approve
  const click = async (planId) => { const n = links().length; await ask(sW, 'approve_plan', { planId }); let url = ''; for (let k = 0; k < 100 && !(url = links()[n] || ''); k++) await sleep(50);
    if (url) { pages.push(await get(url)); await get(url, 'POST'); await ask(sW, 'approve_plan', { planId }); } return !!url; };
  // the bilingual plan: the person approves every Arabic term and text the plan asks for (made-up words)
  const AR = ['المبيعات', 'الفروع', 'المنتجات', 'التقويم', 'الوحدات', 'الطلبات', 'الهدف', 'العام الماضي', 'الشهر', 'الفئة', 'المدينة', 'الدولة'];
  let ai = 0; const ar = () => AR[ai % AR.length] + (ai++ >= AR.length ? ' ' + Math.floor(ai / AR.length + 1) : '');
  const bilingual = async (srv) => { let a = { path: 'lab', name: 'Bilingual', languages: 'en+ar', sharedAxes: SHARED_AXES }, pl = await ask(srv, 'plan_layout', a);
    for (let i = 0; i < 6 && !pl.err && !(pl.j.plan && pl.j.plan.planId); i++) { const j = pl.j, B = j.bilingual || {}, more = {};
      if (j.gulfDates && j.gulfDates.askNext && !a.gulfDates && ((j.gulfDates.candidates || [])[0] || {}).field) more.gulfDates = { dateRole: j.gulfDates.candidates[0].field, grain: 'gregorian', scope: 'all' };
      if (j.sharedAxes && (j.sharedAxes.ask || []).length) more.sharedAxes = SHARED_AXES.concat(j.sharedAxes.ask.map((q) => ({ measures: q.measures, answer: 'comparable' })));
      if (!a.arabicTerms && B.terminology && (B.terminology.sheet || []).length) { const t = {}; B.terminology.sheet.forEach((x) => { if (x.field) t[x.field] = ar(); }); more.arabicTerms = t; }
      else if (a.arabicTerms && !a.arabicTexts && (B.texts || []).length) { const at = {}; B.texts.filter((x) => x.text != null && x.arabic == null && !x.field).forEach((x) => { at[x.text] = x.draftArabic || (/\{1\}/.test(x.text) ? `أعلى {1} من {2}: ${ar()}` : ar()); }); more.arabicTexts = at; }
      if (!Object.keys(more).length) break; a = Object.assign(a, more); pl = await ask(srv, 'plan_layout', a); }
    return { pl, a }; };
  const noDesign = (a) => { const x = Object.assign({}, a); delete x.planFields; return x; };
  const PATHS = [
    ['the native copy', async (srv) => { const a = { path: 'lab', customVisualsFrom: FROM, sharedAxes: SHARED_AXES }; return { pl: await ask(srv, 'plan_layout', a), w: (id) => ask(srv, 'create_report', Object.assign({ planId: id }, a)) }; }],
    ['the consistent redesign', async (srv) => { const a = { path: 'lab', redesignFrom: FROM, consistentText: 'report' }; return { pl: await ask(srv, 'plan_layout', a), w: (id) => ask(srv, 'create_report', Object.assign({ planId: id }, a)) }; }],
    ['the EN-AR copy', async (srv) => { const a = { path: FROM, into: 'same' }; return { pl: await ask(srv, 'create_arabic_twin', a), w: (id) => ask(srv, 'create_arabic_twin', Object.assign({ planId: id }, a)) }; }],
    ['the twin', async (srv) => { const a = { path: FROM }; return { pl: await ask(srv, 'create_arabic_twin', a), w: (id) => ask(srv, 'create_arabic_twin', Object.assign({ planId: id }, a)) }; }],
    ['the bilingual report', async (srv) => { const { pl, a } = await bilingual(srv); return { pl, w: (id) => ask(srv, 'create_report', Object.assign(noDesign(a), { planId: id, design: pl.j.design })) }; }],
    ['the glass theme', async (srv) => { const a = { path: 'lab/' + NAME + '.SemanticModel', name: 'Glass Lab' }; return { pl: await ask(srv, 'generate_theme', a), w: (id) => ask(srv, 'generate_theme', Object.assign({ planId: id }, a)) }; }],
    ['the Gulf calendar', async (srv) => { const a = { path: 'lab/' + NAME + '.SemanticModel', firstYear: 2025, lastYear: 2026, asOf: '2026-10-27' }; return { pl: await ask(srv, 'add_gulf_calendar', a), w: (id) => ask(srv, 'add_gulf_calendar', Object.assign({ planId: id }, a)) }; }],
    ['the sample project', async (srv) => { const pl = await ask(srv, 'plan_layout', { sample: true }); return { pl, w: (id) => ask(srv, 'create_report', { sample: true, path: pl.j.sample.folder, planId: id }) }; }]
  ];
  const idOf = (pl) => pl && pl.j && pl.j.plan && pl.j.plan.planId;
  try {
    for (const [what, run] of PATHS) {
      // B1: the plan id, never approved
      let t0 = print(RB); const u = await run(sU), uid = idOf(u.pl), ur = uid ? await u.w(uid) : { err: false, t: 'no plan: ' + short(u.pl) };
      chk(() => uid && ur.err && /Nothing was written/.test(ur.t) && print(RB) === t0, () => `B1. ${what}: a plan id never approved writes nothing: ${short(ur)}`);
      // B2: approved, and the write fails part way: nothing left
      // (a server of its own: the test's failure counts the server's writes, once)
      t0 = print(RB); const sF = await serverClient(RB, { DATAARCUS_TEST_WRITE_FAIL: /theme|calendar/.test(what) ? 'ENOSPC:partial:1' : 'ENOSPC:partial:2' }); let fid = null, fr = null;
      try { const f = await run(sF); fid = idOf(f.pl); if (fid) await ask(sF, 'approve_plan', { planId: fid }); fr = fid ? await f.w(fid) : { err: false, t: 'no plan: ' + short(f.pl) }; } finally { await sF.close(); }
      chk(() => fid && fr.err && /ENOSPC/.test(fr.t) && print(RB) === t0, () => `B2. ${what}: a write that fails part way leaves nothing: ${short(fr)} ${print(RB) === t0 ? '' : 'the tree changed'}`);
      // the person's click on DataArcus's own page, then the write
      const k = await run(sW), kid = idOf(k.pl), clicked = kid ? await click(kid) : false, kr = clicked ? await k.w(kid) : { err: true, t: 'no page' };
      chk(() => !kr.err && kr.j && (kr.j.written === true || kr.j.written > 0 || kr.j.scriptFile || kr.j.report || kr.j.file || kr.j.folder), () => `B3. ${what}: written after the click: ${short(kr)}`);
    }
    // the glass look by default: the bilingual report's page pictures, written with it (and rolled back with it in B2)
    const pngs = tree(path.join(RB, 'lab', 'Bilingual.Report')).filter((f) => f.endsWith('.png'));
    chk(() => pngs.length > 0 && pngs.every((f) => /StaticResources/.test(f) && /^[\w-]+\.png$/.test(path.basename(f))), () => `B4. the bilingual report's glass pictures, in StaticResources, plain names: ${pngs.map((f) => path.basename(f))}`);
    // A: read_report and check_report (the Arabic lens too) on the EN-AR copy and the bilingual report
    for (const rep of fs.readdirSync(path.join(RB, 'lab')).filter((x) => /(EN-AR\)|Bilingual)\.pbip$/.test(x))) {
      await ask(sW, 'read_report', { path: 'lab/' + rep }); await ask(sW, 'check_report', { path: 'lab/' + rep }); await ask(sW, 'check_report', { path: 'lab/' + rep, lens: 'arabic' });
    }
    await ask(sW, 'read_model', { path: 'lab' }); await ask(sW, 'check_model_health', { path: 'lab' });
  } finally { await sU.close(); await sW.close(); }
  const unesc = (x) => String(x).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  const all = said.concat(pages.map(unesc)).join('\n');
  chk(() => pages.length === PATHS.length && pages.every((h) => /<html/i.test(h)), () => `A0. every path's approval page was read: ${pages.length} of ${PATHS.length}`);
  for (const [k, v] of Object.entries(SENT)) chk(() => !all.includes(v), () => `A1. the ${k} value is in no answer and no approval page: ${(all.match(new RegExp('.{0,120}' + v + '.{0,60}')) || [''])[0]}`);
  chk(() => !ROWS.some((r) => all.includes(r)), () => `A2. the lab's made-up rows are in no answer and no approval page: ${ROWS.filter((r) => all.includes(r))}`);
  // the sample's own rows (lib/sample-project.mjs): the sample's answers and page name its tables and counts, never a row
  chk(() => !['Pearl Bay', 'Falcon Square', 'Majlis Cushion Set', 'Oud Perfume 50ml'].some((r) => all.includes(r)), () => 'A3. the sample project\'s made-up rows are in no answer and no approval page');

  // ---------- D: every answer and list has a cap, on a large hand report (0.3.1's lists: the consistent redesign's
  // removals and untouched visuals, the native copy's replacements) ----------
  const RD = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sf1d-'))); ROOTS.push(RD);
  writeLab(path.join(RD, 'lab'));
  { const P = path.join(RD, 'lab', NAME + '.Report/definition/pages');
    for (const pg of fs.readdirSync(P).filter((x) => !x.endsWith('.json'))) {
      const V = path.join(P, pg, 'visuals');
      for (const v of fs.readdirSync(V).filter((x) => x !== 'pageTitle' && x !== 'band')) for (let i = 1; i <= 12; i++) {
        const j = JSON.parse(fs.readFileSync(path.join(V, v, 'visual.json'), 'utf8')), n = `${v}c${i}`;
        j.name = n; if (j.position) j.position.z = (j.position.z || 0) + i; fs.mkdirSync(path.join(V, n)); fs.writeFileSync(path.join(V, n, 'visual.json'), JSON.stringify(j, null, 2));
      }
    } }
  const sD = await serverClient(RD, {});
  try {
    for (const [what, args] of [['the consistent redesign', { path: 'lab', redesignFrom: FROM, consistentText: 'report' }], ['the native copy', { path: 'lab', customVisualsFrom: FROM, sharedAxes: SHARED_AXES }]]) {
      const r = await sD.call('plan_layout', args), cut = r.j && r.j.truncated, fit = r.j && r.j.redesign && r.j.redesign.listsCut;
      const notListed = JSON.stringify(r.j || {}).match(/NotListed":(\d+)/g) || [];
      chk(() => !r.err && r.t.length <= 40000 && ((cut && Object.keys(cut.cut || {}).length && /\S/.test(cut.how || '')) || (fit && /NotListed/.test(fit.how) && notListed.some((x) => +x.split(':')[1] > 0))),
        () => `D1. ${what} of a report with 13 copies of each visual: the answer within 40,000 characters, each cut list named, with how many it leaves out and how to get the rest: ${String(r.t).length} ${String(JSON.stringify(cut || fit)).slice(0, 300)}`);
    }
  } finally { await sD.close(); }

  // ---------- WB: the way back to 0.3.0 ----------
  const SHA = (/`dataarcus-0\.3\.0\.mcpb`, SHA-256\s+`([0-9a-f]{64})`/.exec(read('research/SKILL-PACKAGING.md')) || [])[1];
  chk(() => !!SHA, () => 'WB-0. the 0.3.0 SHA-256 is recorded in mcp/research/SKILL-PACKAGING.md');
  const log = read('CHANGELOG.md'), sec = (/^## \[(?:Unreleased\]: )?0\.3\.1[\s\S]*?(?=^## )/m.exec(log) || [''])[0];
  const back = sec.split(/\n(?=- )/).find((b) => /0\.3\.0/.test(b) && /[Gg]o(?:ing)? back/.test(b)) || '';
  chk(() => back.includes('`dataarcus-0.3.0.mcpb`') && back.includes('https://github.com/Antnioo/dataarcus-releases/releases') && back.includes(SHA),
    () => `WB-1. the CHANGELOG's 0.3.1 section says where the 0.3.0 file is and its SHA-256: ${back.slice(0, 300)}`);
  chk(() => /double-click/.test(back) && /Claude Desktop/.test(back) && /(Install|Update)/.test(back), () => `WB-2. and how to install it over 0.3.1 in Claude Desktop: ${back.slice(0, 300)}`);
  const readme = read('README.md'), inst = (/## Claude Desktop \(beta\)[\s\S]*?(?=\n## )/.exec(readme) || [''])[0];
  const step = inst.split(/\n(?=\d+\. )/).find((b) => /0\.3\.0/.test(b) && /[Gg]o(?:ing)? back/.test(b)) || '';
  chk(() => /https:\/\/github\.com\/Antnioo\/dataarcus-releases\/releases\b/.test(step) && /SHA-256/.test(step) && /CHANGELOG/.test(step) && /double-click/.test(step), () => `WB-3. mcp/README.md's install section says how to go back to 0.3.0: ${step.slice(0, 300)}`);
  // the RELEASE comment, applied as it says (step 2's three places), leaves every download line on 0.3.1
  const rel = /<!-- RELEASE 0\.3\.1:[^>]*-->/.exec(readme);
  const flipped = readme.replace(/(\n2\. \*\*Get the extension:\*\*[\s\S]*?)(?=\n3\. )/, (m) => m.replace(/0\.3\.0/g, '0.3.1'));
  const facts = downloadFacts(flipped.replace(/<!--[\s\S]*?-->/g, ''));
  chk(() => rel && !/0\.3\.0/.test((/\n2\. \*\*Get the extension:\*\*[\s\S]*?(?=\n3\. )/.exec(flipped) || ['0.3.0'])[0]) && facts.length && facts.every((f) => f.kind !== 'sha' && (f.value === '0.3.1' || f.value === 'dataarcus-0.3.1.mcpb')),
    () => `WB-4. the RELEASE comment applied: step 2 on 0.3.1, and no download line names another version: ${JSON.stringify(facts)}`);
} catch (e) { checks++; problems.push('stopped: ' + String(e && e.stack || e).slice(0, 600)); }
finally { ROOTS.forEach((d) => fs.rmSync(d, { recursive: true, force: true })); }
if (problems.length) { console.log(`FAIL script=test-0.3.1-sf1.mjs cause=${problems[0].slice(0, 160)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sf1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sf1  ${checks} checks`);
