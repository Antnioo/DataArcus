// 0.3.1 L6 (the DAX functions lab of 10 Oct 2026, Desktop 2.158.1304.0, a copy at compatibility level 1702): the DataArcus
// DAX function library (DA.Sparkline, DA.BulletBar, DA.KpiCard, DA.StoryTitle) as ONE TMDL script next to the project,
// behind the plan option daxFunctions (off by default). Written red first. Through the tools (plan_layout ->
// approve_plan -> create_report, check_report, create_arabic_twin) on made-up shop models (no employer or client data):
//   S    the input on plan_layout and create_report (one definition), the skill, the instructions' cap
//   OFF  off by default: no script, no picture or title measure; daxFunctions false the same
//   L    the script: parsed with assets/js/tmdl-model.js, the four functions with typed parameters, quoted dotted names,
//        lineage tags, descriptions; the measures under ref table (folder, Image URL, tags); DAX calls unquoted
//   F    the compatibility step FIRST: the script's header, the plan's answer, the approval page, create_report's answer;
//        a model already at 1702 is told so; the level read from the model's files
//   G    guards inside the functions: a blank item, a zero max, a blank delta, a blank actual or leader
//   P    the parameters: sparkline width/height, the delta's period, the theme's colours (rgb, 3:1 on the card)
//   U    the uses on the report: the sparkline column (only with a related date table), the bullet bar (a target the
//        model names), the KPI cards as Image visuals, the story title bound to the chart's title
//   AR   the Arabic title isolates the leader (U+2068/U+2069); the Arabic card right to left; validator and check clean
//   H    hostile names: escaped inside the functions; DAX strings closed; the script reads back the same names
//   C    validator 0 errors and check_report 0 "can break" on EN, AR, the twin; DAX_MEASURE_PENDING a note until applied
//   PIN  another daxFunctions at create_report refused, nothing written; flipCards with kpiCards a plan problem
//   M    a model at 1702 with the same function: left out of the script, told; its own function under a DA.* name: a
//        plan problem (a script never replaces anything); no related date table: the sparkline not used, with why
//   node test-0.3.1-dax-functions.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { LIBRARY, exprOf, coloursOf, applyDax } from './lib/dax-functions.mjs';

const require = createRequire(import.meta.url);
const Tmdl = require('../assets/js/tmdl-model.js'), E = require('../assets/js/design-engine.js'), Pbip = require('../assets/js/pbip-export.js');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (!x ? 'no answer' : x.err ? String(x.t).slice(0, 600) : JSON.stringify(x.j).slice(0, 600));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const req = (url, method, body) => new Promise((resolve) => {
  if (!url) { resolve(''); return; }
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const unesc = (h) => String(h).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const hashes = (d) => (d && fs.existsSync(d) ? Object.fromEntries(walk(d).sort().map((f) => [path.relative(d, f), crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])) : {});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// a table's widths: { box, cols: [{ ref, shown, w }], grid } (shown: not a hidden helper)
const widthsOf = (v) => { const cw = ((v.visual.objects || {}).columnWidth || []), g = ((((v.visual.objects || {}).grid || [])[0] || {}).properties || {});
  const num = (e) => (e ? +String(e.expr.Literal.Value).replace(/D$/, '') : null);
  return { box: Math.round(v.position.width) - 36, grid: { w: num(g.imageWidth), h: num(g.imageHeight) },
    cols: v.visual.query.queryState.Values.projections.map((p) => ({ ref: p.queryRef, p, w: num((cw.find((e) => e.selector.metadata === p.queryRef) || {}).properties && cw.find((e) => e.selector.metadata === p.queryRef).properties.value) })).filter((c) => c.w !== 0 && c.p.displayName !== ' ') }; };
const roomOf = (p, sc) => Math.ceil(Pbip.columnRoom(p, 10, 'Segoe UI') - 10 + 24 * sc);
// ---------- the made-up models ----------
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-l6-'));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
const HOSTILE = 'Share % <b>"A&B"#1</b>';
const CAL = { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime', { isKey: true }), col('Month Name', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Year', 'int64')] };
const SALES = () => ({ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Cost', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Date', 'dateTime')],
  measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' },
    { name: 'Total Sales Target', expression: 'SUM ( Sales[Cost] ) * 1.2', formatString: '#,0' },
    { name: HOSTILE, expression: 'DIVIDE ( SUM ( Sales[Cost] ), SUM ( Sales[Amount] ) )', formatString: '0.0%' }] });
const modelAt = (dir, name, m) => { const bim = path.join(ROOT, dir, name + '.SemanticModel/model.bim'); fs.mkdirSync(path.dirname(bim), { recursive: true }); fs.writeFileSync(bim, JSON.stringify(m)); fs.writeFileSync(path.join(ROOT, dir, name + '.pbip'), JSON.stringify({ version: '1.0', artifacts: [] })); return bim; };
// g: compatibility 1567, a marked date table related to Sales, a target the model names, a hostile name
const BIM = modelAt('g', 'Shop', { compatibilityLevel: 1567, model: { culture: 'en-US', tables: [SALES(), CAL], relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } });
// h: compatibility 1702, the library's own DA.StoryTitle already in the model, no date table
const STORY = LIBRARY.find((f) => f.name === 'DA.StoryTitle');
modelAt('h', 'Shop17', { compatibilityLevel: 1702, model: { culture: 'en-US', tables: [SALES()], functions: [{ name: 'DA.StoryTitle', expression: exprOf(STORY) }] } });
// k: the model's own DA.KpiCard
modelAt('k', 'ShopK', { compatibilityLevel: 1702, model: { culture: 'en-US', tables: [SALES()], functions: [{ name: 'DA.KpiCard', expression: '(x) => x * 2' }] } });
const FIELDS = { kpis: ['Sales[Total Sales]', `Sales[${HOSTILE}]`], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]', category2: 'Sales[Channel]',
  table: ['Sales[Region]', 'Sales[Total Sales]', `Sales[${HOSTILE}]`], slicers: ['Sales[Region]'] };
const FIELDS_NOCAL = Object.assign({}, FIELDS, { timeAxis: undefined }); delete FIELDS_NOCAL.timeAxis;
const DES = { layout: 'exec', filters: 'top', secondPage: false };
const AR_NAMES = { 'Sales[Total Sales]': 'إجمالي المبيعات', [`Sales[${HOSTILE}]`]: 'الحصة', 'Calendar[Month Name]': 'الشهر', 'Sales[Region]': 'المنطقة', 'Sales[Channel]': 'القناة' };
const modelHash = () => crypto.createHash('sha256').update(fs.readFileSync(BIM)).digest('hex');
const MODEL0 = modelHash();

const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const approve = async (planId) => { const n = links().length; await w.call('approve_plan', { planId }); const url = await linkAt(n), html = await req(url, 'GET'); if (url) await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId }); return html; };
const visualsOf = (dir) => { const P = path.join(dir, 'definition/pages'); if (!fs.existsSync(P)) return [];
  return rd(path.join(P, 'pages.json')).pageOrder.flatMap((id) => { const page = rd(path.join(P, id, 'page.json')); if (page.type === 'Tooltip' || !fs.existsSync(path.join(P, id, 'visuals'))) return [];
    return fs.readdirSync(path.join(P, id, 'visuals')).map((v) => Object.assign(rd(path.join(P, id, 'visuals', v, 'visual.json')), { _page: id })).filter((v) => v.visual); }); };
const DAXM = / \((sparkline|bullet bar|KPI card|story title)\)( \d+)?$/;
const measuresIn = (o, out = []) => { if (o && typeof o === 'object') { if (o.Measure && o.Measure.Property) out.push(String(o.Measure.Property)); Object.values(o).forEach((x) => measuresIn(x, out)); } return out; };
const daxRefs = (dir) => visualsOf(dir).flatMap((v) => measuresIn(v.visual)).filter((n) => DAXM.test(n));
const check = async (pbip) => w.call('check_report', { path: pbip });
const clean = (r) => !!r && !r.err && r.j.validator && r.j.validator.ran && r.j.validator.errors === 0;
const noBreak = (r) => !!r && !r.err && r.j.impact && r.j.impact.kinds && (r.j.impact.kinds.canBreak || { count: 0 }).count === 0;
const rules = (r) => (r && r.j && Array.isArray(r.j.findings) ? r.j.findings.map((f) => f.rule) : []);
const valErr = (r) => (r && r.j ? JSON.stringify({ v: r.j.validator, k: r.j.impact && r.j.impact.kinds, f: (r.j.findings || []).filter((f) => f.impact === 'canBreak' || f.severity === 'error').slice(0, 5) }).slice(0, 900) : short(r));
const scriptPath = (dir, name) => path.join(ROOT, dir, name + ' - DAX functions.tmdl');
const scriptAt = (f) => { if (!f || !fs.existsSync(f)) return null; const text = fs.readFileSync(f, 'utf8'), tree = Tmdl.parse(text), fns = [], ms = [];
  const visit = (n, table) => (n.children || []).forEach((c) => { if (c.type === 'ref' && c.of === 'table') visit(c, c.name); else if (c.type === 'function') fns.push({ name: c.name, expr: c.expr || '', description: c.description || '', props: Object.fromEntries(c.props || []) }); else if (c.type === 'measure') ms.push({ table, name: c.name, expression: c.expr || '', props: Object.fromEntries(c.props || []) }); else visit(c, table); });
  visit(tree, null); return { text, tree, fns, ms }; };
const fnOf = (sc, n) => (sc && sc.fns.find((f) => f.name === n)) || { expr: '', description: '', props: {} };

const write = async (args, crOver, dir = 'g') => {
  const pl = await w.call('plan_layout', Object.assign({ path: dir }, args));
  const id = pl.j && pl.j.plan && pl.j.plan.planId;
  if (!id) return { pl, err: 'no plan id: ' + short(pl) };
  const html = await approve(id);
  const cr = Object.assign({ path: dir, planId: id }, args, args.pages ? {} : { design: pl.j.design });
  delete cr.daxFunctions;
  if (args.planFields) { cr.fields = args.planFields; delete cr.planFields; }
  const r = await w.call('create_report', Object.assign(cr, crOver || {}));
  return { pl, html, r, id, dir: path.join(ROOT, dir, args.name + '.Report'), pbip: dir + '/' + args.name + '.pbip', script: scriptPath(dir, args.name) };
};
const SIG = {
  'DA.Sparkline': '(points : STRING, colour : STRING, width : NUMERIC, height : NUMERIC) =>',
  'DA.BulletBar': '(actual : NUMERIC, target : NUMERIC, maxValue : NUMERIC, goodWhenUp : BOOLEAN, good : STRING, bad : STRING, track : STRING, mark : STRING) =>',
  'DA.KpiCard': '(title : STRING, valueText : STRING, delta : NUMERIC, goodWhenUp : BOOLEAN, width : NUMERIC, height : NUMERIC, goodColour : STRING, badColour : STRING, textColour : STRING, cardColour : STRING, lang : STRING) =>',
  'DA.StoryTitle': '(leader : STRING, valueText : STRING, noun : STRING, delta : NUMERIC, period : STRING, lang : STRING) =>'
};
const COMPAT_FIRST = /raises your model's compatibility level (from \d+ )?to 1702[^.]*\. It cannot be undone/;

let EN = null;
try {
  // ---------- S: the input ----------
  {
    const tools = (await w.c.listTools()).tools, pl = tools.find((t) => t.name === 'plan_layout'), cr = tools.find((t) => t.name === 'create_report');
    const d = (t) => JSON.stringify((t.inputSchema.properties || {}).daxFunctions || null);
    chk(() => d(pl) !== 'null' && d(pl) === d(cr) && /Default false/.test(d(pl)) && /1702/.test(d(pl)) && /cannot be undone/.test(d(pl)) && /TMDL/.test(d(pl)), () => `S1. plan_layout and create_report take daxFunctions (one definition: default off, 1702 that cannot be undone, the TMDL script): ${d(pl)}`);
    const skill = fs.readFileSync(path.join(HERE, 'skills/report-design/SKILL.md'), 'utf8');
    chk(() => /daxFunctions/.test(skill) && /1702/.test(skill) && /cannot be undone/.test(skill), () => 'S2. the skill says when the DAX functions fit and that they raise the compatibility level, which cannot be undone');
    chk(() => (w.c.getInstructions() || '').length <= 2200, () => 'S3. the instructions within their cap');
  }

  // ---------- OFF: off by default ----------
  {
    const O = await write({ name: 'Dax Off', lang: 'en', ...DES, planFields: FIELDS });
    chk(() => O.r && !O.r.err && fs.existsSync(O.dir) && !fs.existsSync(O.script) && !daxRefs(O.dir).length && !visualsOf(O.dir).some((v) => v.visual.visualType === 'image'),
      () => `OFF1. left out: no script, no DA measure in any visual, the KPI cards stay cards: ${O.err || short(O.r)}`);
    chk(() => O.pl.j.plan && O.pl.j.plan.reportLook && O.pl.j.plan.reportLook.daxFunctions === false && !O.pl.j.daxFunctions && !(O.r.j || {}).daxFunctions, () => `OFF2. the plan says daxFunctions false; no daxFunctions block in the plan or the answer: ${JSON.stringify((O.pl.j.plan || {}).reportLook).slice(0, 300)}`);
    const F = await write({ name: 'Dax False', lang: 'en', ...DES, planFields: FIELDS, daxFunctions: false });
    const strip = (h) => Object.keys(h).filter((k) => !/visual\.json$|page\.json$|mobile\.json$|bookmark/.test(k)).length;
    chk(() => F.r && !F.r.err && !fs.existsSync(F.script) && !daxRefs(F.dir).length && strip(hashes(F.dir)) === strip(hashes(O.dir)) && Object.keys(hashes(F.dir)).length === Object.keys(hashes(O.dir)).length,
      () => `OFF3. daxFunctions false writes the same files as left out, no script: ${F.err || short(F.r)}`);
  }

  // ---------- EN: on ----------
  EN = await write({ name: 'Dax EN', lang: 'en', ...DES, planFields: FIELDS, daxFunctions: true });
  const sc = scriptAt(EN.script) || { text: '', tree: { children: [] }, fns: [], ms: [] };
  {
    chk(() => EN.r && !EN.r.err && sc.fns.length, () => `EN0. plan, go and write with daxFunctions true; the script next to the project: ${EN.err || short(EN.r)}`);
    // L: the script
    chk(() => sc.tree.children.length === 1 && sc.tree.children[0].type === 'createOrReplace', () => 'L1. one createOrReplace script');
    chk(() => sc.fns.map((f) => f.name).join() === 'DA.Sparkline,DA.BulletBar,DA.KpiCard,DA.StoryTitle', () => `L2. the four functions, in order: ${sc.fns.map((f) => f.name)}`);
    chk(() => ['DA.Sparkline', 'DA.BulletBar', 'DA.KpiCard', 'DA.StoryTitle'].every((n) => sc.text.includes(`\tfunction '${n}' =\n`)), () => 'L3. each dotted name quoted in TMDL (function \'DA.X\' =)');
    chk(() => sc.fns.every((f) => f.expr.split('\n')[0] === SIG[f.name]), () => `L4. the typed parameters: ${sc.fns.map((f) => f.expr.split('\n')[0]).join(' | ')}`);
    chk(() => sc.fns.every((f) => UUID.test(f.props.lineageTag || '')) && new Set(sc.fns.map((f) => f.props.lineageTag)).size === 4, () => 'L5. each function has its own lineage tag');
    chk(() => sc.fns.every((f) => f.description && f.description.length > 40), () => 'L6. each function has a /// description');
    chk(() => sc.fns.every((f) => f.expr.split('\n').slice(1).every((l) => /^\t/.test(l))) && sc.fns.every((f) => /\n\t\tlineageTag: /.test(sc.text)), () => 'L7. the body one level deeper than the parameters, the lineage tag a property');
    chk(() => sc.ms.length >= 5 && sc.ms.every((m) => m.table === 'Sales' && m.props.displayFolder === 'DataArcus DAX functions' && UUID.test(m.props.lineageTag || '')), () => `L8. the measures under ref table Sales, folder "DataArcus DAX functions", each tagged: ${JSON.stringify(sc.ms.map((m) => [m.table, m.name, m.props]).slice(0, 4))}`);
    chk(() => sc.ms.filter((m) => /\((sparkline|bullet bar|KPI card)\)/.test(m.name)).every((m) => m.props.dataCategory === 'ImageUrl') && sc.ms.filter((m) => /\(story title\)/.test(m.name)).every((m) => !m.props.dataCategory), () => 'L9. the picture measures are Image URL; the story title is text');
    chk(() => sc.ms.every((m) => /\bDA\.(Sparkline|BulletBar|KpiCard|StoryTitle) \(/.test(m.expression) && !/'DA\./.test(m.expression)), () => 'L10. each measure calls one function, unquoted in DAX');
    const again = await w.call('plan_layout', Object.assign({ path: 'g' }, { name: 'Dax EN', lang: 'en', ...DES, planFields: FIELDS, daxFunctions: true }));
    chk(() => again.j && again.j.daxFunctions && JSON.stringify(again.j.daxFunctions.functions) === JSON.stringify(EN.pl.j.daxFunctions.functions), () => 'L11. the same plan again lists the same library');
    chk(() => JSON.stringify(Tmdl.fromFiles([{ path: 'definition/functions.tmdl', text: sc.text.replace(/^createOrReplace\n/, '').replace(/^\t/gm, '').replace(/^ref table[\s\S]*$/m, '') }]).model.functions.map((f) => f.name)) === JSON.stringify(['DA.Sparkline', 'DA.BulletBar', 'DA.KpiCard', 'DA.StoryTitle']),
      () => 'L12. read as a project\'s functions.tmdl, the model reader lists the four functions');
    chk(() => modelHash() === MODEL0, () => 'L13. the model is untouched (the script is never applied by DataArcus)');

    // F: the compatibility step first
    const head = sc.text.split('\n').slice(0, 5).join('\n');
    chk(() => /^createOrReplace\n\n\t\/\/\/ DataArcus DAX function library/.test(sc.text) && /\t\/\/\/ FIRST: applying this script raises your model's compatibility level to 1702[^\n]*It cannot be undone/.test(head), () => `F1. the script's own header says the compatibility step first: ${head}`);
    const keys = Object.keys((EN.pl && EN.pl.j) || {});
    chk(() => keys[0] === 'daxFunctions' && Object.keys(EN.pl.j.daxFunctions)[0] === 'sayFirst' && COMPAT_FIRST.test(EN.pl.j.daxFunctions.sayFirst) && /from 1567/.test(EN.pl.j.daxFunctions.sayFirst) && /^Say FIRST/.test(EN.pl.j.daxFunctions.sayInPlan),
      () => `F2. the plan's answer opens with the compatibility step (read from the model: 1567): ${keys.slice(0, 3)} ${JSON.stringify(EN.pl.j.daxFunctions || null).slice(0, 300)}`);
    const h2 = (unesc(EN.html || '').match(/<h2>[^<]*<\/h2>/g) || []).map((x) => x.replace(/<\/?h2>/g, ''));
    chk(() => /^First: this raises your model's compatibility level \(cannot be undone\)$/.test(h2[0] || '') && COMPAT_FIRST.test(unesc(EN.html)), () => `F3. the approval page's first section is the compatibility step: ${h2.slice(0, 3)}`);
    chk(() => Object.keys(EN.r.j)[0] === 'daxFunctions' && COMPAT_FIRST.test(EN.r.j.daxFunctions.compatibility.sayFirst) && COMPAT_FIRST.test(EN.r.j.daxFunctions.howToApply) && EN.r.j.daxFunctions.compatibility.level === 1567,
      () => `F4. create_report's answer opens with the compatibility step and how to apply: ${JSON.stringify(EN.r.j.daxFunctions || null).slice(0, 300)}`);
    const page = unesc(String(EN.html || '').replace(/<[^>]+>/g, ' '));
    chk(() => ['DA.Sparkline', 'DA.BulletBar', 'DA.KpiCard', 'DA.StoryTitle'].every((n) => page.includes(`Function ${n}`)) && sc.ms.every((m) => page.includes(`Measure Sales[${m.name}]`)) && /DAX functions script/.test(page),
      () => 'F5. the approval page lists every function and every measure, and the script among the files');

    // G: the guards, inside the functions
    const sp = fnOf(sc, 'DA.Sparkline').expr, bb = fnOf(sc, 'DA.BulletBar').expr, kc = fnOf(sc, 'DA.KpiCard').expr, st = fnOf(sc, 'DA.StoryTitle').expr;
    chk(() => /FILTER \( ADDCOLUMNS \( GENERATESERIES \( 1, MAX \( n, 1 \) \), "@s", TRIM \( PATHITEM \( p, \[Value\] \) \) \), \[@s\] <> "" \)/.test(sp) && sp.indexOf('[@s] <> ""') < sp.indexOf('VALUE ( [@s] )'), () => 'G1. a blank sparkline item is left out before VALUE (VALUE("") never runs)');
    chk(() => /IF \( n < 1 \|\| k < 1, BLANK \(\)/.test(sp) && /ISBLANK \( points \) \|\| TRIM \( points \) = ""/.test(sp), () => 'G2. no points (or only blanks): blank, not an error');
    chk(() => /IF \( mx = mn, 1, mx - mn \)/.test(sp), () => 'G3. a flat series divides by 1');
    chk(() => /IF \( ISBLANK \( maxValue \) \|\| maxValue <= 0, 1, maxValue \)/.test(bb) && /RETURN IF \( ISBLANK \( actual \), BLANK \(\)/.test(bb) && /IF \( ISBLANK \( target \), ""/.test(bb), () => 'G4. a zero or blank max counts as 1; a blank actual is blank; a blank target draws no mark');
    chk(() => /IF \( ISBLANK \( delta \), ""/.test(kc) && /IF \( ISBLANK \( delta \), ""/.test(st) && /IF \( ISBLANK \( leader \) \|\| leader = "", BLANK \(\)/.test(st), () => 'G5. a blank delta: no pill, no change said; a blank leader: a blank title');
    chk(() => sc.ms.every((m) => !/\+ 0\b/.test(m.expression)), () => 'G6. no caller guards with "+ 0" (the function guards)');
    // P: the parameters and colours
    chk(() => !/width='120'|height='30'/.test(sp) && /viewBox='0 0 " & FORMAT \( w,/.test(sp), () => 'P1. the sparkline\'s size is its width and height parameters');
    chk(() => /" on " & period/.test(st) && /" عن " & period/.test(st) && !/last year|العام الماضي/.test(st), () => 'P2. the period of the delta is a parameter (no "on last year" in the function)');
    const C = EN.r && EN.r.j && EN.r.j.daxFunctions, colours = coloursOf(EN.pl.j && EN.pl.j.design && EN.pl.j.design.ui);
    const kcm = sc.ms.find((m) => /\(KPI card\)$/.test(m.name));
    chk(() => kcm && kcm.expression.includes(`"${colours.good}", "${colours.bad}", "${colours.text}", "${colours.card}", "en" )`) && /^rgb\(\d+,\d+,\d+\)$/.test(colours.good), () => `P3. the KPI card takes the theme's good, bad, text and card colours as rgb(): ${kcm && kcm.expression.split('\n').pop()} vs ${JSON.stringify(colours)}`);
    const ui = (EN.pl.j && EN.pl.j.design && EN.pl.j.design.ui) || {};
    chk(() => E.contrast(colours.hex.good, colours.hex.card) >= 2.99 && E.contrast(colours.hex.bad, colours.hex.card) >= 2.99 && colours.hex.good === E.toContrast(E.clampHex(ui.good), E.clampHex(ui.card), 3), () => `P4. good and bad stand 3:1 on the card (the engine's toContrast): ${JSON.stringify(colours.hex)}`);
    chk(() => sc.ms.every((m) => !/#[0-9a-f]{3,6}\b/i.test(m.expression.replace(/"[^"]*"/g, (s) => (/rgb\(/.test(s) ? '' : s)))) && sc.fns.every((f) => !/fill='#|stroke='#/.test(f.expr)), () => 'P5. no bare # colour in a picture');
    chk(() => /FORMAT \( [^"]+, "0\.0", "en-US" \)/.test(sp) && /FORMAT \( ROUND \( _x \* 10000, 0 \), "0", "en-US" \)/.test((sc.ms.find((m) => /\(sparkline\)$/.test(m.name)) || {}).expression || ''), () => 'P6. numbers in en-US: the pictures\' numbers with "0.0", the points passed as whole numbers');

    // U: the uses on the report
    const V = visualsOf(EN.dir), tbl = V.find((v) => v.visual.visualType === 'tableEx'), tps = tbl ? tbl.visual.query.queryState.Values.projections.map((p) => p.field.Measure && p.field.Measure.Property).filter(Boolean) : [];
    chk(() => tps.includes('Total Sales (sparkline)') && tps.includes('Total Sales (bullet bar)') && !tps.includes(`${HOSTILE} (bullet bar)`), () => `U1. the table gets a sparkline column (its first measure) and a bullet bar where the model names a target, not elsewhere: ${tps}`);
    const spm = sc.ms.find((m) => m.name === 'Total Sales (sparkline)'), bbm = sc.ms.find((m) => m.name === 'Total Sales (bullet bar)');
    chk(() => spm && /'Calendar'\[Date\]|Calendar\[Date\]/.test(spm.expression) && /GENERATESERIES \( 1, 12 \)/.test(spm.expression) && /DA\.Sparkline \( _pts, "rgb\(\d+,\d+,\d+\)", 120, 30 \)/.test(spm.expression), () => `U2. the sparkline: 12 months by the related date table, the theme colour, 120 x 30: ${spm && spm.expression}`);
    chk(() => bbm && /'Sales'\[Total Sales Target\]|Sales\[Total Sales Target\]/.test(bbm.expression) && /DA\.BulletBar \( _a, _t, MAX \( _a, _t \) \* 1\.25, TRUE \(\)/.test(bbm.expression), () => `U3. the bullet bar against the target the model names: ${bbm && bbm.expression}`);
    const kpiImgs = V.filter((v) => v.visual.visualType === 'image' && v.parentGroupName);
    const srcs = kpiImgs.map((v) => (((v.visual.objects.image || [])[0] || {}).properties || {}).sourceUrl).map((s) => s && s.expr && s.expr.Measure && s.expr.Measure.Property);
    chk(() => kpiImgs.length === 2 && srcs.every((s) => / \(KPI card\)( \d+)?$/.test(s || '')) && !V.some((v) => v.visual.visualType === 'cardVisual' && v.parentGroupName), () => `U4. both KPI cards are Image visuals of their DA.KpiCard measure: ${srcs}`);
    chk(() => kpiImgs.every((v) => v.position && v.position.tabOrder != null && /\S/.test(String((((v.visual.visualContainerObjects.general || [])[0] || {}).properties || {}).altText ? v.visual.visualContainerObjects.general[0].properties.altText.expr.Literal.Value : ''))), () => 'U5. each KPI picture keeps its tab stop and alt text');
    const bars = V.filter((v) => /^(clusteredBarChart|clusteredColumnChart)$/.test(v.visual.visualType));
    const titled = bars.filter((v) => { const t = ((v.visual.visualContainerObjects || {}).title || [])[0]; return t && t.properties.text && t.properties.text.expr && t.properties.text.expr.Measure && / \(story title\)/.test(t.properties.text.expr.Measure.Property); });
    chk(() => titled.length >= 1, () => `U6. a bar or column chart's title is bound to its DA.StoryTitle measure (visualContainerObjects.title.text): ${bars.map((v) => JSON.stringify((v.visual.visualContainerObjects || {}).title)).join(' | ').slice(0, 400)}`);
    const stm = sc.ms.find((m) => / by Region \(story title\)$/.test(m.name));
    chk(() => stm && /TOPN \( 1, FILTER \( VALUES \( 'Sales'\[Region\] \)|TOPN \( 1, FILTER \( VALUES \( Sales\[Region\] \)/.test(stm.expression) && /SAMEPERIODLASTYEAR/.test(stm.expression) && /"last year", "en" \)/.test(stm.expression), () => `U7. the story title: the leader by the measure, the change on last year, "en": ${stm && stm.expression}`);
    chk(() => C && C.used && C.used.sparkline.length === 1 && C.used.bulletBar.length === 1 && C.used.kpiCards.length === 2 && C.used.storyTitles.length >= 1 && C.measures.length === sc.ms.length, () => `U8. the answer lists every use and measure: ${JSON.stringify(C && C.used).slice(0, 400)}`);
    chk(() => !/"(Sales|Total)[^"]*": ?\d{3,}/.test(JSON.stringify(EN.r.j)), () => 'U9. no data value in the answer');
    const tw0 = tbl ? widthsOf(tbl) : null, pics = tw0 ? tw0.cols.filter((x) => / \((sparkline|bullet bar)\)$/.test(x.ref)) : [];
    chk(() => tw0 && tw0.cols.every((x) => x.w > 0) && tw0.cols.reduce((a, x) => a + x.w, 0) <= tw0.box, () => `U10. every column of the table has a width and together they stay inside its box (no scrollbar): ${JSON.stringify(tw0 && { box: tw0.box, cols: tw0.cols.map((x) => [x.ref, x.w]) })}`);
    chk(() => pics.length === 2 && tw0.grid.w >= 48 && tw0.grid.w <= 120 && pics.every((x) => x.w === tw0.grid.w + 10) && tw0.grid.h === Math.round(tw0.grid.w * 30 / 120), () => `U11. the pictures share the room left: imageWidth at most 120 (the sparkline's), each column + 10, the height by 120 x 30: ${JSON.stringify(tw0 && tw0.grid)} ${JSON.stringify(pics.map((x) => x.w))}`);
    chk(() => tw0.cols.filter((x) => !pics.includes(x)).every((x) => x.w >= roomOf(x.p, 1)), () => `U12. every other column keeps its room (columnRoom + the cell's padding): ${JSON.stringify(tw0.cols.map((x) => [x.ref, x.w, roomOf(x.p, 1)]))}`);

    // H: hostile names
    chk(() => sc.ms.some((m) => m.name === `${HOSTILE} (KPI card)`), () => `H1. the hostile measure's picture reads back with the same name: ${sc.ms.map((m) => m.name)}`);
    chk(() => sc.ms.every((m) => ((m.expression.match(/"/g) || []).length % 2) === 0), () => 'H2. every DAX string closed (quotes paired)');
    const hk = sc.ms.find((m) => m.name === `${HOSTILE} (KPI card)`);
    chk(() => hk && hk.expression.includes('DA.KpiCard ( "Share % <b>""A&B""#1</b>"') || (hk && /DA\.KpiCard \( "[^"]*(""[^"]*)*"/.test(hk.expression)), () => `H3. the title passed as a DAX string, quotes doubled: ${hk && hk.expression.split('\n').pop()}`);
    chk(() => /VAR t = SUBSTITUTE \( SUBSTITUTE \( SUBSTITUTE \( SUBSTITUTE \( SUBSTITUTE \( title, "%", "%25" \), "#", "%23" \), "&", "&amp;" \), "<", "&lt;" \), ">", "&gt;" \)/.test(kc) && /VAR v = SUBSTITUTE \( SUBSTITUTE \( SUBSTITUTE \( SUBSTITUTE \( SUBSTITUTE \( valueText, "%", "%25" \)/.test(kc),
      () => 'H4. DA.KpiCard escapes its title and value inside (% then # then & < >)');
    chk(() => /VAR c = SUBSTITUTE \( SUBSTITUTE \( SUBSTITUTE \( SUBSTITUTE \( colour, "'", "" \), "<", "" \), ">", "" \), "#", "%23" \)/.test(sp), () => 'H5. a colour parameter cannot close an attribute');

    // C: the checks
    const c = EN.r && !EN.r.err ? await check(EN.pbip) : null;
    chk(() => clean(c) && noBreak(c), () => `C1. validator 0 errors, 0 "can break" on the English report: ${valErr(c)}`);
    chk(() => rules(c).includes('DAX_MEASURE_PENDING') && (c.j.findings || []).filter((f) => f.rule === 'DAX_MEASURE_PENDING').every((f) => f.severity === 'note' && f.impact !== 'canBreak' && !/Share %/.test(JSON.stringify(f))) && !rules(c).includes('IMAGE_MEASURE_PENDING'),
      () => `C2. before the script: DAX_MEASURE_PENDING notes (names not quoted), not the flip cards' note: ${JSON.stringify(rules(c))}`);
    chk(() => EN.pl.j.exactCheck && EN.pl.j.exactCheck.status === 'pass', () => `C3. the plan's exact build checks clean (its measures counted as the script's): ${JSON.stringify(EN.pl.j.exactCheck).slice(0, 400)}`);
  }

  // ---------- AR: Arabic ----------
  {
    const A = await write({ name: 'Dax AR', lang: 'ar', ...DES, planFields: FIELDS, displayNames: AR_NAMES, daxFunctions: true });
    const sa = scriptAt(A.script) || { fns: [], ms: [] }, st = fnOf(sa, 'DA.StoryTitle').expr, kc = fnOf(sa, 'DA.KpiCard').expr;
    chk(() => A.r && !A.r.err && sa.fns.length, () => `AR0. the Arabic report with daxFunctions: ${A.err || short(A.r)}`);
    chk(() => /VAR i = UNICHAR \( 8296 \)/.test(st) && /VAR o = UNICHAR \( 8297 \)/.test(st) && /VAR ar = i & leader & o & " في الصدارة بـ " & i & valueText & o & " " & i & noun & o/.test(st), () => 'AR1. the Arabic title isolates the leader, the value and the noun (U+2068 ... U+2069)');
    chk(() => /dir='" & IF \( ar, "rtl", "ltr" \)/.test(kc) && /<span dir='ltr'/.test(kc), () => 'AR2. the card is right to left in Arabic, its pill kept left to right');
    chk(() => sa.ms.filter((m) => /\(story title\)$/.test(m.name)).every((m) => /"العام الماضي", "ar" \)/.test(m.expression)) && sa.ms.filter((m) => /\(KPI card\)$/.test(m.name)).every((m) => /, "ar" \)$/.test(m.expression)), () => 'AR3. the Arabic measures pass "ar" and the Arabic period');
    chk(() => sa.ms.some((m) => m.name === 'Total Sales (KPI card)' && /DA\.KpiCard \( "إجمالي المبيعات"/.test(m.expression)), () => `AR4. the card's title is its Arabic display name: ${(sa.ms.find((m) => /Total Sales \(KPI card\)/.test(m.name)) || {}).expression}`);
    const at = visualsOf(A.dir || '').find((v) => v.visual.visualType === 'tableEx'), aps = at ? at.visual.query.queryState.Values.projections : [], acw = at ? widthsOf(at) : null;
    const firstShown = aps.findIndex((p) => acw.cols.some((x) => x.ref === p.queryRef));
    chk(() => at && / \((sparkline|bullet bar)\)$/.test(aps[firstShown].queryRef) && acw.cols.reduce((a, x) => a + x.w, 0) <= acw.box, () => `AR6. the Arabic table's pictures are at its reading end (the left: its first shown columns), inside its box: ${aps.map((p) => p.queryRef)}`);
    const c = A.r && !A.r.err ? await check(A.pbip) : null;
    chk(() => clean(c) && noBreak(c), () => `AR5. validator 0 errors, 0 "can break" on the Arabic report: ${valErr(c)}`);
  }

  // ---------- TW: the twin of the English report ----------
  {
    const ENDIR = EN && EN.dir, before = hashes(ENDIR);
    const p0 = EN && EN.r && !EN.r.err ? await w.call('create_arabic_twin', { path: EN.pbip }) : null, id = p0 && p0.j && p0.j.plan && p0.j.plan.planId;
    if (id) await approve(id);
    const tw = id ? await w.call('create_arabic_twin', { path: EN.pbip, planId: id }) : null, twinDir = path.join(ROOT, 'g', 'Dax EN AR.Report');
    chk(() => fs.existsSync(twinDir) && daxRefs(twinDir).length === daxRefs(ENDIR).length, () => `TW1. the twin keeps the DA measures' visuals: ${short(tw || p0)}`);
    const c = fs.existsSync(twinDir) ? await check('g/Dax EN AR.pbip') : null;
    chk(() => clean(c) && noBreak(c), () => `TW2. validator 0 errors, 0 "can break" on the twin: ${valErr(c)}`);
    chk(() => JSON.stringify(hashes(ENDIR)) === JSON.stringify(before) && Object.keys(before).length > 0, () => 'TW3. the original report untouched by the twin');
  }

  // ---------- applied: the measures in the model, the note gone ----------
  {
    const m = rd(BIM), extra = (sc ? sc.ms : []).map((x) => ({ name: x.name, expression: x.expression }));
    m.model.tables[0].measures.push(...extra); fs.writeFileSync(BIM, JSON.stringify(m));
    const c = EN.r && !EN.r.err ? await check(EN.pbip) : null;
    chk(() => !rules(c).includes('DAX_MEASURE_PENDING') && noBreak(c), () => `C4. with the measures in the model, no DAX_MEASURE_PENDING: ${JSON.stringify(rules(c))}`);
    fs.writeFileSync(BIM, JSON.stringify(Object.assign(m, { model: Object.assign(m.model, { tables: [Object.assign(m.model.tables[0], { measures: m.model.tables[0].measures.slice(0, 3) }), m.model.tables[1]] }) })));
  }

  // ---------- PIN ----------
  {
    const pl = await w.call('plan_layout', { path: 'g', lang: 'en', ...DES, planFields: FIELDS, name: 'Dax Pinned', daxFunctions: true });
    const id = pl.j && pl.j.plan && pl.j.plan.planId; if (id) await approve(id);
    for (const v of [false, ['sparkline']]) {
      const r = id ? await w.call('create_report', { path: 'g', planId: id, lang: 'en', ...DES, design: pl.j.design, fields: FIELDS, name: 'Dax Pinned', daxFunctions: v }) : null;
      chk(() => r && r.err && !fs.existsSync(path.join(ROOT, 'g', 'Dax Pinned.Report')) && !fs.existsSync(scriptPath('g', 'Dax Pinned')), () => `PIN ${JSON.stringify(v)}: another daxFunctions than the plan's is refused and nothing is written: ${short(r || pl)}`);
    }
    const fc = await w.call('plan_layout', { path: 'g', lang: 'en', ...DES, planFields: FIELDS, name: 'Dax Flip', daxFunctions: true, flipCards: true });
    chk(() => fc.j && !fc.j.plan && (fc.j.planProblems || []).some((p) => /kpiCards/.test(p) && /flipCards/.test(p)), () => `PIN3. flipCards with the DAX KPI cards: a plan problem, no plan id: ${short(fc)}`);
    const fk = await write({ name: 'Dax Flip Ok', lang: 'en', ...DES, planFields: FIELDS, daxFunctions: ['sparkline', 'storyTitles'], flipCards: true });
    const s2 = scriptAt(fk.script);
    chk(() => fk.r && !fk.r.err && s2 && s2.fns.length === 4 && !s2.ms.some((m) => /\(KPI card\)|\(bullet bar\)/.test(m.name)) && s2.ms.some((m) => /\(sparkline\)/.test(m.name)), () => `PIN4. a list of uses: the library whole, only the uses asked (with flip cards): ${fk.err || short(fk.r)}`);
  }

  // ---------- R: a table with no room for a picture column (the helper alone) ----------
  {
    const V0 = visualsOf(EN.dir), t0 = V0.find((v) => v.visual.visualType === 'tableEx');
    const base = 'R.Report/definition', narrow = JSON.parse(JSON.stringify(t0 || {})); narrow.position = Object.assign({}, narrow.position, { width: 420 });
    if (narrow.visual) { narrow.visual.query.queryState.Values.projections = narrow.visual.query.queryState.Values.projections.filter((p) => !(p.field.Measure && DAXM.test(p.field.Measure.Property))); delete narrow.visual.objects.grid; narrow.visual.objects.columnWidth = (narrow.visual.objects.columnWidth || []).filter((e) => !DAXM.test(e.selector.metadata)); }
    delete narrow._page;
    const files = [{ path: base + '/report.json', data: '{}' }, { path: base + '/pages/p1/page.json', data: JSON.stringify({ displayName: 'P1', height: 1080, width: 1920 }) }, { path: base + '/pages/p1/visuals/t/visual.json', data: JSON.stringify(narrow) }, { path: 'R.pbip', data: '{}' }];
    const r = applyDax(files, { opt: ['sparkline', 'bulletBar'], tmsl: rd(BIM), lang: 'en', ui: {}, base: 'R', seed: 's' });
    const after = JSON.parse(files[2].data);
    chk(() => r && !r.used.sparkline.length && !r.used.bulletBar.length && r.notUsed.some((x) => /no room/.test(x.why)) && !r.measures.length && after.visual.query.queryState.Values.projections.length === narrow.visual.query.queryState.Values.projections.length,
      () => `R1. a 420-wide table with three columns gets no picture column and no measure, told why: ${JSON.stringify(r && { used: r.used, notUsed: r.notUsed })}`);
  }

  // ---------- M: other models ----------
  {
    const H = await write({ name: 'Dax 1702', lang: 'en', ...DES, planFields: FIELDS_NOCAL, daxFunctions: true }, null, 'h');
    const sh = scriptAt(H.script) || { fns: [], ms: [] }, D = H.pl && H.pl.j && H.pl.j.daxFunctions;
    chk(() => H.r && !H.r.err && D && /already at compatibility level 1702/.test(D.sayFirst) && D.compatibility.raises === false, () => `M1. a model at 1702 is told it is already there (nothing raised): ${H.err || JSON.stringify(D || null).slice(0, 300)}`);
    chk(() => sh && sh.fns.map((f) => f.name).join() === 'DA.Sparkline,DA.BulletBar,DA.KpiCard' && (D.alreadyInModel || []).join() === 'DA.StoryTitle', () => `M2. the model's identical DA.StoryTitle is left out of the script and told: ${sh && sh.fns.map((f) => f.name)}`);
    chk(() => (D.notUsed || []).some((x) => x.use === 'sparkline' && /date table/.test(x.why)) && !sh.ms.some((m) => /\(sparkline\)/.test(m.name)), () => `M3. no related date table: no sparkline, told why: ${JSON.stringify(D && D.notUsed)}`);
    const h2 = (unesc(H.html || '').match(/<h2>[^<]*<\/h2>/g) || [])[0] || '';
    chk(() => /First: your model's compatibility level/.test(h2), () => `M4. the approval page still opens with the compatibility level: ${h2}`);
    const K = await w.call('plan_layout', { path: 'k', lang: 'en', ...DES, planFields: FIELDS_NOCAL, name: 'Dax K', daxFunctions: true });
    chk(() => K.j && !K.j.plan && (K.j.planProblems || []).some((p) => /already has its own function DA\.KpiCard/.test(p)), () => `M5. the model's own DA.KpiCard: a plan problem, never replaced: ${short(K)}`);
  }
} finally {
  await w.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
}

if (problems.length) { console.log(`FAIL  dax-functions  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  dax-functions  ${checks} checks`);
