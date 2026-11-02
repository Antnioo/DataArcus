// 0.3.0 L5 (the theme-icons lab of 10 Oct 2026, Desktop 2.158.1304.0): DataArcus's three status icons in the theme, and
// the plan option statusIcons (off by default) that puts them before a table's or matrix's measure by conditional
// formatting. Written red first. Through the tools (plan_layout -> approve_plan -> create_report, check_report,
// create_arabic_twin) and the shared engine, on a made-up shop model (no employer or client data):
//   S    the input on plan_layout and create_report (one definition), the skill, the instructions' cap
//   TH   the theme's icons block (design-engine.js buildTheme): 3 icons, distinct shapes, the theme's colours (3:1),
//        no bare '#' inside a data URI; the written theme's name = the file report.json references
//   OFF  off by default: no icon entry, no script; statusIcons false the same
//   C    statusIcons true: Way C (a status measure by the target the model names) on the rates that have a target, the
//        entry exactly as the lab's, the script (parsed with assets/js/tmdl-model.js), the plan, the answer, the
//        approval page, validator 0 errors, check_report 0 "can break", the pending note, the a11y note
//   E    the user's thresholds: Way E rules exactly as the lab's, no script
//   P    plan problems: one threshold only, no target, not a measure, overlapping thresholds (no plan id)
//   PIN  another statusIcons at create_report refused, nothing written
//   A    Arabic: the entries kept; validator and check_report clean
//   TW   the Arabic twin keeps the entries; clean; the original untouched
//   H    hostile names: escaped in the script and the selector, the script reads back the same names
//   U    the helper alone: a matrix gets the entry too; a theme without the icons (a user's) gets them in the report's copy
//   node test-0.3.0-theme-icons.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { applyIcons } from './lib/status-icons.mjs';

const require = createRequire(import.meta.url);
const Tmdl = require('../assets/js/tmdl-model.js'), E = require('../assets/js/design-engine.js');
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
const hashes = (d) => (fs.existsSync(d) ? Object.fromEntries(walk(d).sort().map((f) => [path.relative(d, f), crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])) : {});

// ---------- the made-up model: a shop's rates, two with a target the model names, one without; a hostile name ----------
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-l5-'));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
const HOSTILE = 'Share % <b>"A&B"#1</b>';
const BIM = path.join(ROOT, 'g/Shop.SemanticModel/model.bim');
fs.mkdirSync(path.dirname(BIM), { recursive: true });
const MODEL = { compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Cost', 'double'), col('Late', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Date', 'dateTime')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' },
      { name: 'On-time Rate', expression: 'DIVIDE ( SUM ( Sales[Late] ), SUM ( Sales[Amount] ) )', formatString: '0.0%' },
      { name: 'On-time Rate Target', expression: '0.97', formatString: '0.0%' },
      { name: 'Fill Rate', expression: 'DIVIDE ( SUM ( Sales[Cost] ), SUM ( Sales[Amount] ) )', formatString: '0.0%' },
      { name: HOSTILE, expression: 'DIVIDE ( SUM ( Sales[Cost] ), SUM ( Sales[Amount] ) )', formatString: '0.0%' },
      { name: HOSTILE + ' Goal', expression: '0.5', formatString: '0.0%' }] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime', { isKey: true }), col('Month Name', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Year', 'int64')] }],
  relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } };
fs.writeFileSync(BIM, JSON.stringify(MODEL));
fs.writeFileSync(path.join(ROOT, 'g/Shop.pbip'), JSON.stringify({ version: '1.0', artifacts: [] }));
const MP = 'g';
const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[On-time Rate]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]', category2: 'Sales[Channel]',
  table: ['Sales[Region]', 'Sales[On-time Rate]', 'Sales[Fill Rate]', `Sales[${HOSTILE}]`], slicers: ['Sales[Region]', 'Sales[Channel]'] };
const DES = { layout: 'exec', filters: 'top', secondPage: false };
const AR_NAMES = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[On-time Rate]': 'نسبة التسليم في الموعد', 'Sales[Fill Rate]': 'نسبة التلبية', [`Sales[${HOSTILE}]`]: 'الحصة', 'Calendar[Month Name]': 'الشهر', 'Sales[Region]': 'المنطقة', 'Sales[Channel]': 'القناة' };
const modelHash = () => crypto.createHash('sha256').update(fs.readFileSync(BIM)).digest('hex');
const MODEL0 = modelHash();

const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const approve = async (planId) => { const n = links().length; await w.call('approve_plan', { planId }); const url = await linkAt(n), html = await req(url, 'GET'); if (url) await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId }); return html; };
const visualsOf = (dir) => { const P = path.join(dir, 'definition/pages'); if (!fs.existsSync(P)) return [];
  return rd(path.join(P, 'pages.json')).pageOrder.flatMap((id) => { const page = rd(path.join(P, id, 'page.json')); if (page.type === 'Tooltip' || !fs.existsSync(path.join(P, id, 'visuals'))) return [];
    return fs.readdirSync(path.join(P, id, 'visuals')).map((v) => Object.assign(rd(path.join(P, id, 'visuals', v, 'visual.json')), { _page: id })); }); };
const tablesOf = (dir) => visualsOf(dir).filter((v) => v.visual && /^(tableEx|pivotTable)$/.test(v.visual.visualType));
// the icon entries of a visual: [{ metadata, icon }]
const iconsOf = (v) => (((v.visual || {}).objects || {}).values || []).filter((e) => e && e.properties && e.properties.icon).map((e) => ({ metadata: e.selector && e.selector.metadata, selector: e.selector, icon: e.properties.icon }));
const allIcons = (dir) => tablesOf(dir).flatMap(iconsOf);
const lit = (v) => ({ expr: { Literal: { Value: v } } });
// (F1, the laptop proof: "left of the value" put the icon beside the previous column's number in a wide right-aligned
// cell) the icon right of its value in English ('After'), left of it in Arabic ('Before'); changed on purpose
const labShape = (e, metadata, layout = "'After'") => !!e && JSON.stringify(e.selector) === JSON.stringify({ data: [{ dataViewWildcard: { matchingOption: 1 } }], metadata })
  && e.icon.kind === 'Icon' && JSON.stringify(e.icon.layout) === JSON.stringify(lit(layout)) && JSON.stringify(e.icon.verticalAlignment) === JSON.stringify(lit("'Middle'"))
  && Object.keys(e.icon).sort().join() === 'kind,layout,value,verticalAlignment';
const check = async (pbip) => w.call('check_report', { path: pbip });
const clean = (r) => !!r && !r.err && r.j.validator && r.j.validator.ran && r.j.validator.errors === 0;
const noBreak = (r) => !!r && !r.err && r.j.impact && r.j.impact.kinds && (r.j.impact.kinds.canBreak || { count: 0 }).count === 0;
const rules = (r) => (r && r.j && Array.isArray(r.j.findings) ? r.j.findings.map((f) => f.rule) : []);
const valErr = (r) => (r && r.j ? JSON.stringify({ v: r.j.validator, k: r.j.impact && r.j.impact.kinds, f: (r.j.findings || []).filter((f) => f.impact === 'canBreak' || f.severity === 'error').slice(0, 5) }).slice(0, 900) : short(r));
const scriptOf = (name) => path.join(ROOT, 'g', name + ' - status icons.tmdl');
const scriptAt = (f) => { if (!f || !fs.existsSync(f)) return null; const tree = Tmdl.parse(fs.readFileSync(f, 'utf8')), out = [];
  const visit = (n, table) => (n.children || []).forEach((c) => { if (c.type === 'ref' && c.of === 'table') visit(c, c.name); else if (c.type === 'measure') out.push({ table, name: c.name, expression: c.expr || '', props: Object.fromEntries(c.props || []) }); else visit(c, table); });
  visit(tree, null); return { text: fs.readFileSync(f, 'utf8'), measures: out }; };
const themeOf = (dir) => { const pbir = rd(path.join(dir, 'definition/report.json')), ct = pbir.themeCollection && pbir.themeCollection.customTheme; const f = ct && path.join(dir, 'StaticResources/RegisteredResources', ct.name);
  return f && fs.existsSync(f) ? { ref: ct.name, json: rd(f) } : null; };

const write = async (args, crOver) => {
  const pl = await w.call('plan_layout', Object.assign({ path: MP }, args));
  const id = pl.j && pl.j.plan && pl.j.plan.planId;
  if (!id) return { pl, err: 'no plan id: ' + short(pl) };
  const html = await approve(id);
  const cr = Object.assign({ path: MP, planId: id }, args, args.pages ? {} : { design: pl.j.design });
  delete cr.statusIcons;
  if (args.planFields) { cr.fields = args.planFields; delete cr.planFields; }
  const r = await w.call('create_report', Object.assign(cr, crOver || {}));
  return { pl, html, r, id, dir: path.join(ROOT, 'g', args.name + '.Report'), pbip: 'g/' + args.name + '.pbip' };
};
// the three icons' shape: the SVG with its colours taken out
const shapeOf = (url) => decodeURIComponent(String(url).replace(/^data:image\/svg\+xml;utf8,/, '').replace(/%(?![0-9A-F]{2})/gi, '%25')).replace(/rgb\([^)]*\)|%23[0-9a-f]{6}|#[0-9a-f]{6}/gi, 'C');
const rgbHex = (s) => { const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(s); return m ? '#' + [m[1], m[2], m[3]].map((x) => (+x).toString(16).padStart(2, '0')).join('') : null; };
const fillOf = (url) => rgbHex((/fill='(rgb\([^)]*\))'/.exec(decodeURIComponent(String(url).replace(/%(?![0-9A-F]{2})/gi, '%25'))) || [])[1] || '');

try {
  // ---------- S: the input ----------
  {
    const tools = (await w.c.listTools()).tools, pl = tools.find((t) => t.name === 'plan_layout'), cr = tools.find((t) => t.name === 'create_report');
    const d = (t) => JSON.stringify((t.inputSchema.properties || {}).statusIcons || null);
    chk(() => d(pl) !== 'null' && d(pl) === d(cr) && /default/i.test(d(pl)) && /TMDL/i.test(d(pl)) && /threshold/i.test(d(pl)), () => `S1. plan_layout and create_report take statusIcons (one definition: default off, the thresholds, the TMDL script): ${d(pl)}`);
    const skill = fs.readFileSync(path.join(HERE, 'skills/report-design/SKILL.md'), 'utf8');
    chk(() => /statusIcons/.test(skill) && /threshold/i.test(skill), () => 'S2. the skill says when status icons fit and that thresholds come from the user');
    chk(() => (w.c.getInstructions() || '').length <= 2200, () => 'S3. the instructions within their cap');
  }

  // ---------- TH: the theme's icons ----------
  {
    const names = ['daGood', 'daWarn', 'daBad'];
    Object.keys(E.PRESETS).forEach((p) => {
      const t = E.buildTheme(Object.assign({ name: p, font: 'Segoe UI', layout: {}, chart: {} }, E.PRESETS[p]), 'en'), ic = t.icons || {};
      const u = E.colours(Object.assign({ chart: {}, layout: {} }, E.PRESETS[p])).ui;
      chk(() => Object.keys(ic).join() === names.join() && names.every((n) => ic[n] && /^DataArcus /.test(ic[n].description) && /^data:image\/svg\+xml;utf8,<svg xmlns='http:\/\/www\.w3\.org\/2000\/svg' width='16' height='16' viewBox='0 0 16 16'>/.test(ic[n].url)),
        () => `TH1 ${p}. the theme has exactly daGood, daWarn, daBad, each a 16 x 16 SVG data URI with a description: ${JSON.stringify(ic).slice(0, 300)}`);
      chk(() => names.every((n) => !/#/.test(ic[n].url)), () => `TH2 ${p}. no bare '#' inside an icon's data URI: ${names.map((n) => ic[n] && ic[n].url).join(' | ').slice(0, 300)}`);
      chk(() => new Set(names.map((n) => shapeOf(ic[n].url))).size === 3, () => `TH3 ${p}. the three differ in shape, not only colour`);
      chk(() => [['daGood', 'good'], ['daWarn', 'neutral'], ['daBad', 'bad']].every(([n, k]) => fillOf(ic[n].url) === E.toContrast(E.clampHex(u[k]), u.card, 3).toLowerCase() && E.contrast(fillOf(ic[n].url), u.card) >= 2.99),
        () => `TH4 ${p}. each icon in the theme's good / neutral / bad, taken to 3:1 on the card: ${names.map((n) => fillOf(ic[n].url)).join(',')} vs ${[u.good, u.neutral, u.bad].join(',')} on ${u.card}`);
      chk(() => !!t.textClasses && !!t.textClasses.title && t.name, () => `TH5 ${p}. the theme keeps its own textClasses and name`);
    });
  }

  // ---------- OFF: off by default ----------
  {
    const D = await write({ name: 'Icons Off', lang: 'en', ...DES, planFields: FIELDS });
    const Z = await write({ name: 'Icons False', lang: 'en', ...DES, planFields: FIELDS, statusIcons: false });
    chk(() => D.r && !D.r.err && tablesOf(D.dir).length >= 1 && !allIcons(D.dir).length && !fs.existsSync(scriptOf('Icons Off')) && !(D.r.j || {}).statusIcons, () => `OFF1. default: a table, no icon entry, no script, no statusIcons in the answer: ${D.err || short(D.r)}`);
    chk(() => Z.r && !Z.r.err && !allIcons(Z.dir).length && !fs.existsSync(scriptOf('Icons False')) && walk(Z.dir).length === walk(D.dir).length, () => `OFF2. statusIcons false writes what the default writes: ${Z.err || short(Z.r)}`);
    chk(() => JSON.stringify(D.pl.j).includes('"statusIcons":false'), () => `OFF3. the plan's look names the default (off): ${JSON.stringify((D.pl.j || {}).reportLook || null).slice(0, 300)}`);
    const th = D.dir ? themeOf(D.dir) : null;
    chk(() => th && th.json.name === th.ref && th.json.icons && Object.keys(th.json.icons).join() === 'daGood,daWarn,daBad' && th.json.textClasses, () => `OFF4. the written theme carries the icons (every theme), its name is the file report.json references: ${th ? th.ref + ' ' + th.json.name : 'no theme'}`);
    const c = D.r && !D.r.err ? await check(D.pbip) : null;
    chk(() => clean(c) && noBreak(c), () => `OFF5. the default report with the theme's icons: validator 0 errors, 0 "can break": ${valErr(c)}`);
  }

  // ---------- C: statusIcons true (Way C) ----------
  let EN = null;
  {
    EN = await write({ name: 'Icons EN', lang: 'en', ...DES, planFields: FIELDS, statusIcons: true });
    const tb = EN.dir && fs.existsSync(EN.dir) ? tablesOf(EN.dir) : [], ic = tb.flatMap(iconsOf);
    const onTime = ic.find((e) => e.metadata === 'Sales.On-time Rate'), host = ic.find((e) => e.metadata === `Sales.${HOSTILE}`);
    chk(() => ic.length === 2 && onTime && host && !ic.some((e) => e.metadata === 'Sales.Fill Rate'), () => `C1. the two rates with a target get an icon, the rate without one does not: ${EN.err || short(EN.r)} ${JSON.stringify(ic.map((e) => e.metadata))}`);
    chk(() => labShape(onTime, 'Sales.On-time Rate') && labShape(host, `Sales.${HOSTILE}`), () => `C2. the entry exactly as the lab's (kind Icon, 'Before', 'Middle', rows only, metadata Table.Measure): ${JSON.stringify(onTime).slice(0, 500)}`);
    const vm = (e) => e && e.icon.value && e.icon.value.expr && e.icon.value.expr.Measure;
    chk(() => vm(onTime) && vm(onTime).Expression.SourceRef.Entity === 'Sales' && vm(onTime).Property === 'On-time Rate (status icon)' && !vm(onTime).Expression.SourceRef.Schema, () => `C3. Way C: the value is the status measure of the model (no extension): ${JSON.stringify(onTime && onTime.icon.value)}`);
    const sc = scriptAt(scriptOf('Icons EN')), byN = new Map(((sc || {}).measures || []).map((x) => [x.name, x])), st = byN.get('On-time Rate (status icon)');
    chk(() => sc && sc.measures.length === 2 && sc.measures.every((x) => x.table === 'Sales') && /^createOrReplace/.test(sc.text), () => `C4. the script "Icons EN - status icons.tmdl" holds the two status measures under ref table Sales: ${sc ? sc.text.slice(0, 400) : 'no script'}`);
    chk(() => st && /'Sales'\[On-time Rate\]/.test(st.expression) && /'Sales'\[On-time Rate Target\]/.test(st.expression) && /_v\s*>=\s*_t/.test(st.expression) && /"daGood"/.test(st.expression) && /"daBad"/.test(st.expression) && !/"daWarn"/.test(st.expression) && /ISBLANK/.test(st.expression) && !/\d\.\d/.test(st.expression),
      () => `C5. the status measure: at or above the target "daGood", below "daBad", blank when either is blank; no number of its own: ${st ? st.expression : 'none'}`);
    chk(() => sc && sc.measures.every((x) => x.props.displayFolder === 'DataArcus status icons' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(x.props.lineageTag || '')) && new Set(sc.measures.map((x) => x.props.lineageTag)).size === 2, () => `C6. each in the folder "DataArcus status icons" with its own lineage tag: ${sc ? JSON.stringify(sc.measures.map((x) => x.props)) : ''}`);
    const sa = (EN.r && EN.r.j && EN.r.j.statusIcons) || null;
    chk(() => sa && Array.isArray(sa.columns) && sa.columns.length === 2 && sa.columns.every((c) => c.way === 'measure' && /target/i.test(c.rule || '')) && /status icons\.tmdl$/.test(sa.scriptFile || '') && /TMDL view/.test(sa.howToApply || ''), () => `C7. the answer names each column, its way and rule, the script and how to apply it: ${JSON.stringify(sa).slice(0, 600)}`);
    chk(() => sa && (sa.notShown || []).some((x) => x.measure === 'Sales[Fill Rate]' && /target/i.test(x.why)), () => `C8. the rate without a target is told, with why: ${JSON.stringify(sa && sa.notShown)}`);
    const plj = (EN.pl.j || {});
    chk(() => JSON.stringify(plj).includes('"statusIcons":true') && plj.statusIcons && /status icons\.tmdl/.test(JSON.stringify(plj.statusIcons)) && /apply/i.test(JSON.stringify(plj.statusIcons)), () => `C9. the plan pins it, names the script and says to apply it: ${JSON.stringify(plj.statusIcons || null).slice(0, 400)}`);
    const H = unesc((EN.html || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' '), sec = (H.match(/Status icons \(2\)[\s\S]{0,1500}/) || [''])[0];
    chk(() => sec && /On-time Rate/.test(sec) && /On-time Rate Target/.test(sec) && /status icons\.tmdl/.test(sec) && /model is not changed/i.test(sec) && /shape/i.test(sec), () => `C10. the approval page lists each column, the way, the target, the model change, the shapes: ${sec.slice(0, 700)}`);
    const svg = (unesc(EN.html || '').match(/<svg[\s\S]*?<\/svg>/g) || []).join('');
    chk(() => /data-icon="status"/.test(svg), () => 'C11. the preview draws a marker where an icon goes');
    chk(() => modelHash() === MODEL0, () => 'C12. the model is never changed');
    const c = EN.r && !EN.r.err ? await check(EN.pbip) : null;
    chk(() => clean(c), () => `C13. Microsoft's validator: 0 errors: ${valErr(c)}`);
    chk(() => noBreak(c), () => `C14. check_report: 0 "can break": ${valErr(c)} ${rules(c).join(',')}`);
    chk(() => c && (c.j.findings || []).some((f) => f.rule === 'ICON_MEASURE_PENDING' && f.severity === 'note'), () => `C15. before the script is applied, a note says the status measures are not in the model yet: ${rules(c).join(',')}`);
    chk(() => c && (c.j.findings || []).some((f) => f.rule === 'A11Y_ICON_SHAPES' && f.severity === 'note' && /shape/i.test(f.what) && /colour/i.test(f.what)), () => `C16. the a11y note: the icons differ in shape, colour is not the only signal: ${rules(c).join(',')}`);
    if (sc) {
      const applied = JSON.parse(JSON.stringify(MODEL)); applied.model.tables[0].measures.push(...sc.measures.map((x) => ({ name: x.name, expression: x.expression })));
      fs.writeFileSync(BIM, JSON.stringify(applied));
      const c2 = await check(EN.pbip);
      chk(() => !rules(c2).includes('ICON_MEASURE_PENDING') && noBreak(c2), () => `C17. with the script applied the note is gone: ${rules(c2).join(',')}`);
      fs.writeFileSync(BIM, JSON.stringify(MODEL));
    } else chk(() => false, () => 'C17. no script to apply');
  }

  // ---------- E: the user's thresholds (Way E) ----------
  {
    const X = await write({ name: 'Icons Rules', lang: 'en', ...DES, planFields: FIELDS, statusIcons: [{ measure: 'Sales[Fill Rate]', good: '>= 0.97', bad: '< 0.94' }] });
    const ic = X.dir && fs.existsSync(X.dir) ? allIcons(X.dir) : [], e = ic.find((x) => x.metadata === 'Sales.Fill Rate');
    chk(() => ic.length === 1 && labShape(e, 'Sales.Fill Rate'), () => `E1. one icon entry, on Fill Rate, the lab's shape: ${X.err || short(X.r)} ${JSON.stringify(ic).slice(0, 400)}`);
    const cs = e && e.icon.value.expr.Conditional && e.icon.value.expr.Conditional.Cases;
    const isM = (x) => x && x.Measure && x.Measure.Property === 'Fill Rate' && x.Measure.Expression.SourceRef.Entity === 'Sales';
    const cmp = (c, kind, v, icon) => c && c.Condition.Comparison && c.Condition.Comparison.ComparisonKind === kind && isM(c.Condition.Comparison.Left) && JSON.stringify(c.Condition.Comparison.Right) === JSON.stringify({ Literal: { Value: v } }) && JSON.stringify(c.Value) === JSON.stringify({ Literal: { Value: `'${icon}'` } });
    // (F1, the proof: a blank row got the bad icon) the first case: a blank value, no icon (Power BI's blank literal)
    chk(() => Array.isArray(cs) && cs[0].Condition.Comparison && cs[0].Condition.Comparison.ComparisonKind === 0 && isM(cs[0].Condition.Comparison.Left) && JSON.stringify(cs[0].Condition.Comparison.Right) === JSON.stringify({ Literal: { Value: 'null' } }) && JSON.stringify(cs[0].Value) === JSON.stringify({ Literal: { Value: "''" } }),
      () => `E2b. a blank value gets no icon (the first case): ${JSON.stringify(cs && cs[0]).slice(0, 400)}`);
    const cs0 = cs; { const cs = cs0 && cs0.slice(1);
    chk(() => Array.isArray(cs) && cmp(cs[0], 2, '0.97D', 'daGood') && cmp(cs[1], 3, '0.94D', 'daBad'), () => `E2. Way E: >= 0.97 daGood (kind 2), < 0.94 daBad (kind 3), the user's numbers exactly: ${JSON.stringify(cs).slice(0, 600)}`);
    const warn = cs && cs[2], and = warn && warn.Condition.And;
    chk(() => warn && JSON.stringify(warn.Value) === JSON.stringify({ Literal: { Value: "'daWarn'" } }) && and && and.Left.Comparison.ComparisonKind === 3 && and.Left.Comparison.Right.Literal.Value === '0.97D' && and.Right.Comparison.ComparisonKind === 2 && and.Right.Comparison.Right.Literal.Value === '0.94D' && cs.length === 3,
      () => `E3. between the two, daWarn (< 0.97 and >= 0.94), and nothing else: ${JSON.stringify(warn).slice(0, 500)}`); }
    chk(() => !fs.existsSync(scriptOf('Icons Rules')) && X.r.j.statusIcons && X.r.j.statusIcons.columns[0].way === 'rules' && !X.r.j.statusIcons.scriptFile, () => `E4. rules need no script: ${JSON.stringify(X.r && X.r.j && X.r.j.statusIcons).slice(0, 400)}`);
    const H = unesc((X.html || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
    chk(() => /Status icons \(1\)/.test(H) && />= 0\.97/.test(H) && /< 0\.94/.test(H) && /your thresholds|the user's thresholds|as given/i.test(H), () => `E5. the approval page shows the thresholds as given: ${(H.match(/Status icons[\s\S]{0,600}/) || [''])[0]}`);
    const c = X.r && !X.r.err ? await check(X.pbip) : null;
    chk(() => clean(c) && noBreak(c) && !rules(c).includes('ICON_MEASURE_PENDING'), () => `E6. validator 0 errors, 0 "can break", no pending note: ${valErr(c)}`);
    // lower is better: good "<= 0.03", bad "> 0.05"
    const L = await write({ name: 'Icons Lower', lang: 'en', ...DES, planFields: FIELDS, statusIcons: [{ measure: 'Sales[Fill Rate]', good: '<= 0.03', bad: '> 0.05' }] });
    const lc = L.dir && fs.existsSync(L.dir) ? (allIcons(L.dir)[0] || {}).icon : null, lcs = lc && lc.value.expr.Conditional.Cases.slice(1);
    chk(() => lcs && lcs[0].Condition.Comparison.ComparisonKind === 4 && lcs[1].Condition.Comparison.ComparisonKind === 1 && lcs[2].Condition.And.Left.Comparison.ComparisonKind === 1 && lcs[2].Condition.And.Right.Comparison.ComparisonKind === 4,
      () => `E7. lower is better: <= 0.03 good (4), > 0.05 bad (1), between warn: ${L.err || JSON.stringify(lcs).slice(0, 400)}`);
  }

  // ---------- P: plan problems ----------
  {
    const bad = [
      [[{ measure: 'Sales[Fill Rate]', good: '>= 0.97' }], /bad/i, 'one threshold only'],
      [[{ measure: 'Sales[Fill Rate]' }], /target/i, 'no target in the model, no thresholds'],
      [[{ measure: 'Sales[Region]', good: '>= 1', bad: '< 0' }], /not a measure/i, 'a column'],
      [[{ measure: 'Sales[Nope]' }], /not a measure/i, 'not in the model'],
      [[{ measure: 'Sales[Fill Rate]', good: '>= 0.5', bad: '< 0.9' }], /overlap/i, 'overlapping thresholds'],
      [[{ measure: 'Sales[Fill Rate]', good: '>= 0.9', bad: '>= 0.5' }], /opposite|direction/i, 'both the same way']
    ];
    for (const [v, re, what] of bad) {
      const pl = await w.call('plan_layout', { path: MP, lang: 'en', ...DES, planFields: FIELDS, name: 'Icons Bad', statusIcons: v });
      chk(() => !(pl.j && pl.j.plan && pl.j.plan.planId) && re.test(pl.err ? pl.t : JSON.stringify(pl.j)), () => `P ${what}: no plan, the problem said: ${short(pl)}`);
    }
  }

  // ---------- PIN ----------
  {
    const pl = await w.call('plan_layout', { path: MP, lang: 'en', ...DES, planFields: FIELDS, name: 'Icons Pinned', statusIcons: true });
    const id = pl.j && pl.j.plan && pl.j.plan.planId; if (id) await approve(id);
    for (const v of [false, [{ measure: 'Sales[Fill Rate]', good: '>= 0.97', bad: '< 0.94' }]]) {
      const r = id ? await w.call('create_report', { path: MP, planId: id, lang: 'en', ...DES, design: pl.j.design, fields: FIELDS, name: 'Icons Pinned', statusIcons: v }) : null;
      chk(() => r && r.err && !fs.existsSync(path.join(ROOT, 'g', 'Icons Pinned.Report')) && !fs.existsSync(scriptOf('Icons Pinned')), () => `PIN ${JSON.stringify(v)}: another statusIcons than the plan's is refused and nothing is written: ${short(r || pl)}`);
    }
  }

  // ---------- A: Arabic ----------
  {
    const A = await write({ name: 'Icons AR', lang: 'ar', ...DES, planFields: FIELDS, displayNames: AR_NAMES, statusIcons: true });
    const ic = A.dir && fs.existsSync(A.dir) ? allIcons(A.dir) : [];
    chk(() => ic.length === 2 && labShape(ic.find((e) => e.metadata === 'Sales.On-time Rate'), 'Sales.On-time Rate', "'Before'"), () => `A1. the Arabic report's table carries the icons, 'Before' (left of the value, where an Arabic reader ends it): ${A.err || short(A.r)} ${JSON.stringify(ic).slice(0, 300)}`);
    const c = A.r && !A.r.err ? await check(A.pbip) : null;
    chk(() => clean(c) && noBreak(c), () => `A2. validator 0 errors, 0 "can break" on the Arabic report: ${valErr(c)}`);
  }

  // ---------- TW: the twin ----------
  {
    const ENDIR = EN && EN.dir, before = hashes(ENDIR);
    const p0 = EN && EN.r && !EN.r.err ? await w.call('create_arabic_twin', { path: EN.pbip }) : null, id = p0 && p0.j && p0.j.plan && p0.j.plan.planId;
    if (id) await approve(id);
    const tw = id ? await w.call('create_arabic_twin', { path: EN.pbip, planId: id }) : null, twinDir = path.join(ROOT, 'g', 'Icons EN AR.Report');
    const ic = fs.existsSync(twinDir) ? allIcons(twinDir) : [];
    chk(() => ic.length === 2 && ic.every((e) => labShape(e, e.metadata, "'Before'")) && JSON.stringify(ic.map((e) => e.icon.value)) === JSON.stringify(allIcons(ENDIR).map((e) => e.icon.value)), () => `TW1. the twin keeps both icon entries, left of the value as in an Arabic report: ${short(tw || p0)} ${JSON.stringify(ic).slice(0, 300)}`);
    const th = fs.existsSync(twinDir) ? themeOf(twinDir) : null;
    chk(() => th && th.json.icons && th.json.icons.daGood && th.json.name === th.ref, () => 'TW2. the twin\'s theme keeps the icons and its name');
    const c = fs.existsSync(twinDir) ? await check('g/Icons EN AR.pbip') : null;
    chk(() => clean(c) && noBreak(c), () => `TW3. validator 0 errors, 0 "can break" on the twin: ${valErr(c)}`);
    chk(() => JSON.stringify(hashes(ENDIR)) === JSON.stringify(before) && Object.keys(before).length > 0, () => 'TW4. the original report untouched by the twin');
  }

  // ---------- H: hostile names ----------
  {
    const sc = scriptAt(scriptOf('Icons EN')), h = sc && sc.measures.find((x) => x.name === HOSTILE + ' (status icon)');
    chk(() => h && /'Sales'\[Share % <b>"A&B"#1<\/b>\]/.test(h.expression) && /'Sales'\[Share % <b>"A&B"#1<\/b> Goal\]/.test(h.expression), () => `H1. the hostile measure's status measure reads back whole, naming the measure and its goal by their DAX names: ${h ? h.expression : sc ? sc.measures.map((x) => x.name).join(' | ') : 'no script'}`);
    chk(() => sc && sc.measures.every((x) => ((x.expression.match(/"/g) || []).length % 2) === 0), () => 'H2. every DAX string closed (quotes paired)');
    const H = EN && EN.html || '';
    chk(() => !/<b>"A&B"#1<\/b>/.test(H) && /&lt;b&gt;/.test(H), () => 'H3. the approval page escapes the hostile name');
  }
  // ---------- U: the helper alone (a matrix; a user's theme without the icons) ----------
  {
    const R = 'U.Report/definition', vis = (name, type) => ({ path: `${R}/pages/p1/visuals/${name}/visual.json`, data: JSON.stringify({ name, visual: { visualType: type, query: { queryState: { Values: { projections: [
      { field: { Column: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Region' } }, queryRef: 'Sales.Region' },
      { field: { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Fill Rate' } }, queryRef: 'Sales.Fill Rate' }] } } } } }) });
    const files = [{ path: `${R}/report.json`, data: JSON.stringify({ themeCollection: { customTheme: { name: 'mine.json', type: 'RegisteredResources' } } }) },
      { path: 'U.Report/StaticResources/RegisteredResources/mine.json', data: JSON.stringify({ name: 'mine.json', good: '#118833', neutral: '#ddaa00', bad: '#cc2222', background: '#ffffff' }) },
      { path: `${R}/pages/p1/page.json`, data: JSON.stringify({ displayName: 'P1' }) }, vis('m1', 'pivotTable'), vis('t1', 'tableEx'), { path: 'U.pbip', data: '{}' }];
    const r = applyIcons(files, { opt: [{ measure: 'Sales[Fill Rate]', good: '>= 0.97', bad: '< 0.94' }], raw: MODEL.model.tables, base: 'U', seed: 's' });
    const get = (n) => JSON.parse(files.find((f) => f.path.endsWith(`/${n}/visual.json`)).data), th = JSON.parse(files[1].data);
    chk(() => r && r.columns.length === 2 && r.columns.some((c) => c.visual === 'matrix') && labShape({ selector: get('m1').visual.objects.values[0].selector, icon: get('m1').visual.objects.values[0].properties.icon }, 'Sales.Fill Rate'),
      () => `U1. a matrix's measure gets the same entry as a table's: ${JSON.stringify(r && r.columns)}`);
    chk(() => r.themeAdded && th.icons && Object.keys(th.icons).join() === 'daGood,daWarn,daBad' && fillOf(th.icons.daGood.url) === '#118833' && th.name === 'mine.json' && !files.some((f) => /\.tmdl$/.test(f.path)),
      () => `U2. a theme without the icons gets them in the report's copy, in its own good colour; rules write no script: ${JSON.stringify(th).slice(0, 300)}`);
  }
} finally {
  await w.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
}

if (problems.length) { console.log(`FAIL  theme-icons  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  theme-icons  ${checks} checks`);
