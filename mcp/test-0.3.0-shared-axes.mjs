// 0.3.0 J19 (B-172; the outside review's card C13): incompatible units never share an axis. Two measures share one
// value axis only when their units, scale and ISO currency match AND the person confirms they compare; otherwise
// separate visuals, each with its unit on its axis, the reason in the plan (English and Arabic). No secondary axis
// anywhere. Written red first. Made-up models only (a shop and a call centre; no employer or client data).
//   E  the engine (assets/js/axis-units.js): identity, normalising, the decision, the memory, the labels
//   G  the gallery's combo (assets/js/visual-gallery.js) follows the engine
//   M  through the MCP tools: plan_layout / create_report (sharedAxes), English, Arabic, the twin; validator and
//      check_report on each
//   N  the native copy of custom visuals (plan_layout / create_report customVisualsFrom)
//   X  no written visual has a secondary axis, and a Y2 only in a combo of a confirmed pair
//   node test-0.3.0-shared-axes.mjs
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
const load = (p) => { try { return req(p); } catch (e) { return null; } };
const AX = load('../assets/js/axis-units.js'), G = load('../assets/js/visual-gallery.js'), Memory = load('../assets/js/confirm-memory.js');
const AR_LETTERS = /[؀-ۿ]/, FSI = '⁨', PDI = '⁩';
const isolated = (s, tok) => String(s).includes(FSI + tok + PDI);

// ---------- E: the engine ----------
// a made-up model's measures: name, format string, DAX (the engine reads metadata only)
const TB = [{ name: 'Sales', measures: [
  { name: 'Sales SAR', formatString: '"SAR" #,0', expression: 'SUM ( Sales[Amount SAR] )' },
  { name: 'Sales AED', formatString: '"AED" #,0', expression: 'SUM ( Sales[Amount] )' },
  { name: 'Cost AED', formatString: '"AED" #,0', expression: 'SUM ( Sales[Cost] )' },
  { name: 'Sales AED K', formatString: '"AED" #,0,', expression: 'SUM ( Sales[Amount] )' },
  { name: 'Sales Sign', formatString: '#,0 "د.إ"', expression: 'SUM ( Sales[Amount] )' },
  { name: 'Sales USD', formatString: '\\$#,0', expression: 'SUM ( Sales[Amount USD] )' },
  { name: 'Cost USD', formatString: '\\$#,0', expression: 'SUM ( Sales[Cost USD] )' },
  { name: 'Margin %', formatString: '0.0%', expression: 'DIVIDE ( [Sales AED] - [Cost AED], [Sales AED] )' },
  { name: 'Discount %', formatString: '0.0%', expression: 'DIVIDE ( SUM ( Sales[Discount] ), [Sales AED] )' },
  { name: 'Return Rate %', formatString: '0.0%', expression: 'DIVIDE ( [Returns], [Orders] )' },
  { name: 'Orders', formatString: '#,0', expression: 'COUNTROWS ( Sales )' },
  { name: 'Returns', formatString: '#,0', expression: 'COUNTROWS ( FILTER ( Sales, Sales[Returned] ) )' },
  { name: 'Units', formatString: '#,0', expression: 'SUM ( Sales[Qty] )' },
  { name: 'Stock Turn', formatString: '0.0"x"', expression: 'DIVIDE ( [Cost AED], [Avg Stock] )' }] },
{ name: 'Calls', measures: [
  { name: 'Handle Time', formatString: '#,0 "min"', expression: 'AVERAGE ( Calls[Seconds] ) / 60' },
  { name: 'Wait Minutes', formatString: '#,0', expression: 'AVERAGE ( Calls[Wait] )' },
  { name: 'Talk Time', formatString: '#,0 "mins"', expression: 'AVERAGE ( Calls[Talk] )' },
  { name: 'Shift Length', formatString: '#,0.0 "hrs"', expression: 'AVERAGE ( Calls[Shift] )' }] }];
const S_ = (m) => ({ t: 'Sales', m }), C_ = (m) => ({ t: 'Calls', m });
const dec = (ms, x) => (AX ? AX.decide(ms, Object.assign({ tables: TB }, x || {})) : { threw: 'assets/js/axis-units.js is missing' });
const conf = (a, b, answer, tables) => (AX ? AX.record(a, b, answer, tables || TB) : null);
{
  let r = dec([S_('Sales SAR'), S_('Sales AED')]);
  chk(() => !r.share && r.groups.length === 2 && /SAR/.test(r.why.en) && /AED/.test(r.why.en) && /currenc/i.test(r.why.en) && !r.ask.length, () => `E1: SAR and AED amounts are separate visuals (no question: they never share): ${JSON.stringify(r)}`);
  r = dec([C_('Handle Time'), C_('Shift Length')]);
  chk(() => !r.share && /minutes/.test(r.why.en) && /hours/.test(r.why.en) && !r.ask.length, () => `E2: minutes and hours are separate (no normalisation approved between them): ${JSON.stringify(r)}`);
  r = dec([S_('Margin %'), S_('Orders')]);
  chk(() => !r.share && /different units/.test(r.why.en) && !r.ask.length, () => `E3: a percentage and a count are separate: ${JSON.stringify(r)}`);
  r = dec([S_('Discount %'), S_('Return Rate %')]);
  chk(() => !r.share && r.ask.length === 1 && r.ask[0].kind === 'denominator' && r.ask[0].denominators === 'different' && /denominator/.test(r.ask[0].question.en) && AR_LETTERS.test(r.ask[0].question.ar),
    () => `E4: two percentages with different denominators: the person is asked (denominator and meaning): ${JSON.stringify(r)}`);
  r = dec([S_('Sales AED'), S_('Cost AED')], { confirmed: [conf(S_('Sales AED'), S_('Cost AED'), 'comparable')] });
  chk(() => r.share && r.groups.length === 1 && /one shared axis/.test(r.why.en), () => `E5: two confirmed AED amounts at the same scale may share one axis: ${JSON.stringify(r)}`);
  r = dec([S_('Sales AED'), S_('Cost AED')]);
  chk(() => !r.share && r.ask.length === 1 && r.ask[0].kind === 'comparable' && /AED/.test(r.ask[0].question.en) && /sharedAxes/.test(r.ask[0].question.en), () => `E6: the same unit, not confirmed: separate, and asked: ${JSON.stringify(r)}`);
  r = dec([S_('Sales AED K'), S_('Cost AED')], { confirmed: [conf(S_('Sales AED K'), S_('Cost AED'), 'comparable')] });
  chk(() => !r.share && /scale/.test(r.why.en) && /thousands/.test(r.why.en), () => `E7: AED in thousands next to AED: separate (scale), even when answered: ${JSON.stringify(r)}`);
  r = dec([S_('Sales AED'), S_('Cost AED')], { confirmed: [conf(S_('Cost AED'), S_('Sales AED'), 'separate')] });
  chk(() => !r.share && !r.ask.length && /do not compare/.test(r.why.en), () => `E8: answered "separate" (either order): separate, not asked again: ${JSON.stringify(r)}`);
  r = dec([S_('Units'), S_('Sales AED')]);
  chk(() => !r.share && /not known/.test(r.why.en), () => `E9: a unit not known next to AED: separate: ${JSON.stringify(r)}`);
  r = dec([S_('Sales USD'), S_('Cost USD')], { confirmed: [conf(S_('Sales USD'), S_('Cost USD'), 'comparable')] });
  chk(() => !r.share && /not known/.test(r.why.en) && AX.identityOf(TB[0].measures[5]).code === null, () => `E10: a "$" names no one currency (no ISO code): separate, even when answered: ${JSON.stringify(r)}`);
  // normalising: the same unit written differently is one identity; nothing is changed
  const frozen = JSON.stringify(TB);
  const idOf = (t, n) => AX.identityOf(TB.find((x) => x.name === t).measures.find((x) => x.name === n));
  chk(() => idOf('Calls', 'Handle Time').code === 'minute' && idOf('Calls', 'Talk Time').code === 'minute' && idOf('Calls', 'Wait Minutes').code === 'minute' && idOf('Calls', 'Shift Length').code === 'hour'
    && idOf('Sales', 'Sales Sign').code === 'AED' && idOf('Sales', 'Sales AED K').scale === 1000 && idOf('Sales', 'Sales AED').scale === 1 && dec([C_('Handle Time'), C_('Talk Time')]).ask.length === 1 && JSON.stringify(TB) === frozen,
  () => `E11: "min", "mins" and a name's "Minutes" are one unit, "hrs" another, د.إ is AED, "#,0," is thousands; the model is not changed: ${AX && JSON.stringify(['Handle Time', 'Talk Time', 'Wait Minutes', 'Shift Length'].map((n) => idOf('Calls', n)))}`);
  // the memory: a record applies while the measures are unchanged, and goes stale when one changes
  const rec = conf(S_('Sales AED'), S_('Cost AED'), 'comparable'), T2 = JSON.parse(frozen); T2[0].measures[2].expression = 'SUM ( Sales[Cost] ) * 1.05';
  chk(() => Memory && Memory.valid(rec) && dec([S_('Sales AED'), S_('Cost AED')], { confirmed: [rec] }).share && !dec([S_('Sales AED'), S_('Cost AED')], { tables: T2, confirmed: [rec] }).share
    && dec([S_('Sales AED'), S_('Cost AED')], { tables: T2, confirmed: [rec] }).ask.length === 1, () => `E12: a memory record (hashes only) applies, and is asked again after a measure's DAX changed: ${JSON.stringify(rec)}`);
  // the labels: the same token in both languages; Arabic isolates ISO codes and digits
  const L = (t, n) => ({ en: AX.labelOf(idOf(t, n), 'en'), ar: AX.labelOf(idOf(t, n), 'ar') });
  chk(() => L('Sales', 'Sales AED').en === 'AED' && isolated(L('Sales', 'Sales AED').ar, 'AED') && L('Sales', 'Margin %').en === '%' && isolated(L('Sales', 'Margin %').ar, '%') && L('Sales', 'Stock Turn').en === '×' && isolated(L('Sales', 'Stock Turn').ar, '×')
    && L('Calls', 'Handle Time').en === 'minutes' && AR_LETTERS.test(L('Calls', 'Handle Time').ar) && isolated(AX.isolate('2026 AED'), '2026 AED'),
  () => `E13: unit labels: AED, %, × the same in English and Arabic (isolated there), a time unit in each language: ${JSON.stringify([L('Sales', 'Sales AED'), L('Sales', 'Margin %'), L('Sales', 'Stock Turn'), L('Calls', 'Handle Time')])}`);
  // every split says why, in English and Arabic
  const all = [dec([S_('Sales SAR'), S_('Sales AED')]), dec([S_('Margin %'), S_('Orders')]), dec([C_('Handle Time'), C_('Shift Length')]), dec([S_('Sales AED'), S_('Cost AED')]), dec([S_('Units'), S_('Sales AED')])];
  chk(() => all.every((x) => x.splits.length && x.splits.every((s) => s.why.en && AR_LETTERS.test(s.why.ar))) && isolated(all[0].why.ar, 'SAR') && isolated(all[0].why.ar, 'AED'),
    () => `E14: each split has its reason in English and Arabic, ISO codes isolated in the Arabic: ${JSON.stringify(all.map((x) => x.why))}`);
  r = dec([S_('Sales AED'), S_('Margin %'), S_('Cost AED')], { confirmed: [conf(S_('Sales AED'), S_('Cost AED'), 'comparable')] });
  chk(() => JSON.stringify(r.groups) === '[[0,2],[1]]' && !r.share, () => `E15: three measures: the confirmed AED pair together, the percentage apart: ${JSON.stringify(r.groups)}`);
  r = dec([S_('Stock Turn'), S_('Margin %')]);
  chk(() => !r.share && /×/.test(r.why.en) && /%/.test(r.why.en), () => `E16: a ratio (×) and a percentage are separate: ${JSON.stringify(r)}`);
}

// ---------- G: the gallery's combo follows the engine ----------
{
  const M = (m, f) => ({ t: 'Sales', m, cardFormat: f }), MONTH = { t: 'Sales', c: 'Month Name', kind: 'month', sortBy: { t: 'Sales', c: 'Month Number' } };
  const B = (a, b, x) => Object.assign({ kpis: [a, b], measure: a, date: MONTH, cats: {}, y: {} }, x || {});
  let f = G ? G.fits('combo', B(M('Sales AED', '"AED" #,0'), M('Cost AED', '"AED" #,0'), { axes: { tables: TB, confirmed: [] } })) : {};
  chk(() => !f.fits && f.split && f.ask && f.ask.length === 1, () => `G1: a combo of two AED amounts not confirmed: two panels, and the question: ${JSON.stringify(f)}`);
  f = G ? G.fits('combo', B(M('Sales AED', '"AED" #,0'), M('Cost AED', '"AED" #,0'), { axes: { tables: TB, confirmed: [conf(S_('Sales AED'), S_('Cost AED'), 'comparable')] } })) : {};
  chk(() => f.fits && f.secondary === false, () => `G2: confirmed: one combo on one shared axis: ${JSON.stringify(f)}`);
  f = G ? G.fits('combo', B(M('Sales SAR', '"SAR" #,0'), M('Sales AED', '"AED" #,0'), { axes: { tables: TB, confirmed: [] } })) : {};
  chk(() => !f.fits && f.split && /SAR/.test(f.why) && /AED/.test(f.why) && AR_LETTERS.test(f.whyAr || ''), () => `G3: SAR and AED: two panels, the reason names both, in English and Arabic: ${JSON.stringify(f)}`);
}

// ---------- M: through the tools ----------
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-j19-'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
const wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2)); };
const S = (p) => { const v = p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value) : undefined; return v == null ? undefined : v.replace(/^'|'$/g, '').replace(/''/g, "'"); };
const short = (x) => (!x ? 'no answer' : x.err ? String(x.t).slice(0, 500) : JSON.stringify(x.j).slice(0, 500));
const unesc = (h) => String(h).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const httpReq = (url, method, body) => new Promise((resolve) => {
  if (!url) { resolve(''); return; }
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
fs.mkdirSync(path.join(ROOT, 'g/Shop.SemanticModel'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'g/Shop.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Cost', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Date', 'dateTime')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '"AED" #,0' }, { name: 'Total Cost', expression: 'SUM ( Sales[Cost] )', formatString: '"AED" #,0' },
      { name: 'Margin %', expression: 'DIVIDE ( [Total Sales] - [Total Cost], [Total Sales] )', formatString: '0.0%' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime', { isKey: true }), col('Month Name', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Quarter', 'string')] }],
  relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } }));
fs.writeFileSync(path.join(ROOT, 'g/Shop.pbip'), JSON.stringify({ version: '1.0', artifacts: [] }));
const SAME_UNIT = { kpis: ['Sales[Total Sales]', 'Sales[Total Cost]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]', category2: 'Sales[Channel]' };
const RATE = Object.assign({}, SAME_UNIT, { kpis: ['Sales[Total Sales]', 'Sales[Margin %]'] });
const CONFIRMED = [{ measures: ['Sales[Total Sales]', 'Sales[Total Cost]'], answer: 'comparable' }];
const HAND = [{ name: 'Axes', width: 1280, height: 720, slots: [{ kind: 'combo', x: 20, y: 20, w: 1240, h: 400 }] }];
const AR_NAMES = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Total Cost]': 'إجمالي التكلفة', 'Sales[Margin %]': 'نسبة الهامش', 'Calendar[Month Name]': 'الشهر', 'Sales[Region]': 'المنطقة', 'Sales[Channel]': 'القناة' };

const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const approve = async (planId) => { const n = links().length; await w.call('approve_plan', { planId }); const url = await linkAt(n), html = await httpReq(url, 'GET'); if (url) await httpReq(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId }); return html; };
const pagesOf = (dir) => { const P = path.join(dir, 'definition/pages'); if (!fs.existsSync(P)) return [];
  return rd(path.join(P, 'pages.json')).pageOrder.map((id) => ({ id, page: rd(path.join(P, id, 'page.json')), visuals: fs.existsSync(path.join(P, id, 'visuals')) ? fs.readdirSync(path.join(P, id, 'visuals')).map((v) => rd(path.join(P, id, 'visuals', v, 'visual.json'))).filter((v) => v.visual) : [] })); };
const allVisuals = (dir) => pagesOf(dir).filter((p) => p.page.type !== 'Tooltip' && p.page.visibility !== 'HiddenInViewMode').flatMap((p) => p.visuals);
const roles = (v) => Object.fromEntries(Object.entries(((v.visual.query || {}).queryState) || {}).map(([k, r]) => [k, (r.projections || []).map((p) => p.nativeQueryRef || (p.field.Measure || p.field.Column || {}).Property)]));
const objp = (v, o) => ((((v.visual.objects || {})[o]) || [])[0] || { properties: {} }).properties;
const axisTitle = (v) => (S(objp(v, 'valueAxis').showAxisTitle) === 'true' ? S(objp(v, 'valueAxis').titleText) : null);
const isCombo = (v) => v.visual.visualType === 'lineClusteredColumnComboChart';
const check = async (pbip) => w.call('check_report', { path: pbip, checks: ['validator'] });
const clean = (r) => !!r && !r.err && r.j.validator && r.j.validator.ran && r.j.validator.errors === 0;
const noBreak = (r) => !!r && !r.err && r.j.impact && r.j.impact.kinds && (r.j.impact.kinds.canBreak || { count: 0 }).count === 0;
const galleryOf = (pl) => (pl && pl.j && pl.j.gallery) || null;
const write = async (args) => {
  const pl = await w.call('plan_layout', Object.assign({ path: 'g' }, args));
  const id = pl.j && pl.j.plan && pl.j.plan.planId;
  if (!id) return { pl, err: 'no plan id: ' + short(pl) };
  const html = await approve(id);
  const cr = Object.assign({ path: 'g', planId: id }, args);
  if (args.planFields) { cr.fields = args.planFields; delete cr.planFields; }
  const r = await w.call('create_report', cr);
  return { pl, html, r, id, dir: path.join(ROOT, 'g', args.name + '.Report'), pbip: 'g/' + args.name + '.pbip' };
};
const written = [];   // every report this suite wrote, for X

try {
  {
    const tools = (await w.c.listTools()).tools, pl = tools.find((t) => t.name === 'plan_layout'), cr = tools.find((t) => t.name === 'create_report');
    chk(() => pl.inputSchema.properties.sharedAxes && cr.inputSchema.properties.sharedAxes && /comparable/.test(JSON.stringify(cr.inputSchema.properties.sharedAxes)),
      () => 'M1: plan_layout and create_report take sharedAxes (the person\'s own answer: comparable or separate)');
  }
  // an amount and a rate: two panels, each with its unit
  const EN = await write({ name: 'Amount and Rate', lang: 'en', pages: HAND, planFields: RATE });
  written.push(EN.dir);
  {
    const g = galleryOf(EN.pl), s = g && g.slots && g.slots.find((x) => x.kind === 'combo');
    chk(() => s && /two panels/.test(s.written) && /different units/.test(s.why) && AR_LETTERS.test(s.whyAr || ''), () => `M2: the plan says two panels and why, in English and Arabic: ${EN.err || JSON.stringify(g)}`);
    const vs = EN.dir && fs.existsSync(EN.dir) ? allVisuals(EN.dir) : [], ls = vs.filter((v) => v.visual.visualType === 'lineChart');
    const t = Object.fromEntries(ls.map((v) => [roles(v).Y[0], axisTitle(v)]));
    chk(() => !vs.some(isCombo) && ls.length === 2 && t['Total Sales'] === 'AED' && t['Margin %'] === '%', () => `M3: two line charts, each value axis titled with its unit (AED, %), no combo: ${EN.err || short(EN.r)} ${JSON.stringify(vs.map((v) => [v.visual.visualType, roles(v), objp(v, 'valueAxis')]))}`);
    const c = EN.r && !EN.r.err ? await check(EN.pbip) : null;
    chk(() => clean(c) && noBreak(c), () => `M4: validator 0 errors and check_report 0 "can break" (English): ${short(c || EN.r)}`);
  }
  {
    const AR = await write({ name: 'Rate Arabic', lang: 'ar', pages: HAND, planFields: RATE, displayNames: AR_NAMES });
    written.push(AR.dir);
    const vs = AR.dir && fs.existsSync(AR.dir) ? allVisuals(AR.dir) : [], ls = vs.filter((v) => v.visual.visualType === 'lineChart'), c = AR.r && !AR.r.err ? await check(AR.pbip) : null;
    chk(() => !vs.some(isCombo) && ls.length === 2 && ls.some((v) => isolated(axisTitle(v), 'AED')) && ls.some((v) => isolated(axisTitle(v), '%')) && clean(c) && noBreak(c),
      () => `M5: Arabic: two panels, axis titles AED and % isolated, validator 0 and check_report 0 "can break": ${AR.err || short(AR.r)} ${JSON.stringify(ls.map(axisTitle))} ${short(c)}`);
  }
  {
    const p0 = EN.r && !EN.r.err ? await w.call('create_arabic_twin', { path: EN.pbip }) : null, id = p0 && p0.j && p0.j.plan && p0.j.plan.planId;
    if (id) await approve(id);
    const tw = id ? await w.call('create_arabic_twin', { path: EN.pbip, planId: id }) : null, tdir = path.join(ROOT, 'g', 'Amount and Rate AR.Report');
    written.push(tdir);
    const c = fs.existsSync(tdir) ? await check('g/Amount and Rate AR.pbip') : null;
    chk(() => clean(c) && noBreak(c) && !allVisuals(tdir).some((v) => S(objp(v, 'valueAxis').secShow) === 'true'), () => `M6: the twin of the English report: validator 0, check_report 0 "can break", no secondary axis: ${short(tw || p0)} ${short(c)}`);
  }
  // the same unit, not confirmed: asked, two panels
  {
    const U = await write({ name: 'Same Unit Asked', lang: 'en', pages: HAND, planFields: SAME_UNIT });
    written.push(U.dir);
    const sa = U.pl && U.pl.j && U.pl.j.sharedAxes, vs = U.dir && fs.existsSync(U.dir) ? allVisuals(U.dir) : [];
    chk(() => sa && sa.ask && sa.ask.length === 1 && /Total Sales/.test(sa.ask[0].question.en) && AR_LETTERS.test(sa.ask[0].question.ar) && !vs.some(isCombo) && vs.filter((v) => v.visual.visualType === 'lineChart').length === 2,
      () => `M7: the same unit not confirmed: the plan asks (English and Arabic) and two panels are written: ${U.err || JSON.stringify(sa)} ${JSON.stringify(vs.map((v) => v.visual.visualType))}`);
  }
  // the same unit, confirmed: one combo, one axis
  let OK = null;
  {
    OK = await write({ name: 'Same Unit Confirmed', lang: 'en', pages: HAND, planFields: SAME_UNIT, sharedAxes: CONFIRMED });
    written.push(OK.dir);
    const vs = OK.dir && fs.existsSync(OK.dir) ? allVisuals(OK.dir) : [], cb = vs.find(isCombo), c = OK.r && !OK.r.err ? await check(OK.pbip) : null;
    chk(() => cb && JSON.stringify(roles(cb).Y) === '["Total Sales"]' && JSON.stringify(roles(cb).Y2) === '["Total Cost"]' && S(objp(cb, 'valueAxis').secShow) === 'false' && axisTitle(cb) === 'AED' && clean(c),
      () => `M8: confirmed: one combo, Y and Y2 on one axis (secShow false), titled AED, validator 0: ${OK.err || short(OK.r)} ${JSON.stringify(cb && cb.visual.objects)} ${short(c)}`);
    const H = unesc(OK.html || '');
    chk(() => /Shared axes|sharedAxes/i.test(H) && /comparable/.test(H) && /Total Cost/.test(H), () => `M9: the approval page shows the confirmation: ${(H.match(/sharedAxes[\s\S]{0,300}/i) || [H.slice(0, 200)])[0]}`);
  }
  {
    const pl = await w.call('plan_layout', { path: 'g', name: 'Pinned Axes', lang: 'en', pages: HAND, planFields: SAME_UNIT, sharedAxes: CONFIRMED }), id = pl.j && pl.j.plan && pl.j.plan.planId;
    if (id) await approve(id);
    const r = id ? await w.call('create_report', { path: 'g', planId: id, name: 'Pinned Axes', lang: 'en', pages: HAND, fields: SAME_UNIT, sharedAxes: [{ measures: CONFIRMED[0].measures, answer: 'separate' }] }) : null;
    chk(() => r && r.err && /sharedAxes/.test(r.t) && !fs.existsSync(path.join(ROOT, 'g', 'Pinned Axes.Report')), () => `M10: another sharedAxes at create_report than the plan's is refused, nothing written: ${short(r || pl)}`);
  }

  // ---------- N: the native copy of custom visuals ----------
  {
    const HEX = '0123456789ABCDEF0123456789ABCDEF', VC = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
    const c2 = (t, c) => ({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: `${t}.${c}`, nativeQueryRef: c });
    const m2 = (t, m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: `${t}.${m}`, nativeQueryRef: m });
    const vj = (name, type, rs, x) => ({ $schema: VC, name, position: { x, y: 400, z: 9000 + x, width: 400, height: 260, tabOrder: 9000 + x }, visual: { visualType: type, query: { queryState: Object.fromEntries(Object.entries(rs).map(([r, p]) => [r, { projections: p }])) } } });
    const setup = (dir) => {
      const P = path.join(ROOT, dir); fs.cpSync(path.join(HERE, 'fixtures/twin-project'), P, { recursive: true });
      const mb = path.join(P, 'Twin Sales.SemanticModel/model.bim'), bim = rd(mb), ms = bim.model.tables[0].measures;
      ms.find((x) => x.name === 'Total Sales').formatString = '"AED" #,0';
      ms.push({ name: 'Total Cost', expression: 'SUM ( Sales[Amount] ) * 0.7', formatString: '"AED" #,0' }, { name: 'Margin %', expression: 'DIVIDE ( [Total Sales] - [Total Cost], [Total Sales] )', formatString: '0.0%' }); wr(mb, bim);
      const RD = path.join(P, 'Twin Sales.Report'), PG = path.join(RD, 'definition/pages/p1overview/visuals');
      const CV = { cvMix: 'vendorDrillDownComboPro' + HEX, cvTwo: 'vendorFacetChartPaid' + HEX };
      wr(path.join(PG, 'cvMix/visual.json'), vj('cvMix', CV.cvMix, { Category: [c2('Sales', 'Region')], ColumnValues: [m2('Sales', 'Total Sales')], LineValues: [m2('Sales', 'Margin %')] }, 20));
      wr(path.join(PG, 'cvTwo/visual.json'), vj('cvTwo', CV.cvTwo, { Category: [c2('Sales', 'Region')], Values1: [m2('Sales', 'Total Sales'), m2('Sales', 'Total Cost')] }, 700));
      const rj = rd(path.join(RD, 'definition/report.json')); rj.publicCustomVisuals = (rj.publicCustomVisuals || []).concat(Object.values(CV)); wr(path.join(RD, 'definition/report.json'), rj);
      return { P, RD, NPG: path.join(P, 'Twin Sales native.Report/definition/pages/p1overview/visuals'), ND: path.join(P, 'Twin Sales native.Report') };
    };
    const native = async (dir, extra) => {
      const s = setup(dir), from = dir + '/Twin Sales.Report';
      const pl = await w.call('plan_layout', Object.assign({ path: dir, customVisualsFrom: from }, extra || {})), id = pl.j && pl.j.plan && pl.j.plan.planId;
      if (id) await approve(id);
      const made = id ? await w.call('create_report', Object.assign({ path: dir, planId: id, customVisualsFrom: from }, extra || {})) : null;
      written.push(s.ND);
      const vis = fs.existsSync(s.NPG) ? fs.readdirSync(s.NPG).map((v) => ({ id: v, j: rd(path.join(s.NPG, v, 'visual.json')) })) : [];
      return Object.assign(s, { pl, made, vis, reps: (pl.j && pl.j.customVisuals && pl.j.customVisuals.replacements) || [] });
    };
    const A = await native('cv1');
    const mix = A.reps.find((r) => /Combo/.test(r.from)) || {};
    chk(() => mix.axes && mix.axes.panels === 2 && !mix.axes.share && /different units/.test(mix.axes.why.en) && AR_LETTERS.test(mix.axes.why.ar) && mix.native !== 'lineClusteredColumnComboChart',
      () => `N1: an amount with a percentage: the plan's entry is two panels, why in English and Arabic, no combo: ${short(A.pl)}`);
    const cli = path.join(HERE, 'node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js');
    const { spawnSync } = await import('node:child_process');
    const errorsOf = (dir) => { const pv = spawnSync(process.execPath, [cli, 'validate', dir], { encoding: 'utf8' }); try { const d = JSON.parse(pv.stdout).data; return Object.entries(d.diagnostics || {}).filter(([, x]) => x.severity === 'error').flatMap(([k, x]) => (x.items || [1]).map(() => k)); } catch (e) { return null; } };
    const eo = errorsOf(A.RD), en = fs.existsSync(A.ND) ? errorsOf(A.ND) : null, extra = en && eo ? en.filter((k) => { const i = eo.indexOf(k); if (i >= 0) { eo.splice(i, 1); return false; } return true; }) : null;
    const mixed = A.vis.filter((v) => /^cvMix/.test(v.id));
    chk(() => mixed.length === 2 && mixed.every((v) => v.j.visual.visualType !== 'lineClusteredColumnComboChart' && !v.j.visual.query.queryState.Y2 && v.j.visual.query.queryState.Y.projections.length === 1)
      && mixed.every((v) => v.j.position.x >= 20 && v.j.position.x + v.j.position.width <= 420) && extra && extra.length === 0,
    () => `N2: written as two native visuals in the custom visual's box, no combo, no Y2; the validator adds no error: ${short(A.made)} ${JSON.stringify(mixed.map((v) => [v.id, v.j.visual.visualType, v.j.position]))} ${JSON.stringify(extra)}`);
    const two = A.vis.filter((v) => /^cvTwo/.test(v.id));
    const B = await native('cv2', { sharedAxes: [{ measures: ['Sales[Total Sales]', 'Sales[Total Cost]'], answer: 'comparable' }] });
    const twoB = B.vis.filter((v) => /^cvTwo/.test(v.id));
    chk(() => two.length === 2 && two.every((v) => v.j.visual.query.queryState.Y.projections.length === 1) && twoB.length === 1 && twoB[0].j.visual.query.queryState.Y.projections.length === 2,
      () => `N3: two AED amounts: two panels until the person confirms, then one chart: ${JSON.stringify(two.map((v) => v.id))} ${JSON.stringify(twoB.map((v) => [v.id, v.j.visual.visualType]))} ${short(B.made || B.pl)}`);
  }

  // ---------- X: no secondary axis anywhere ----------
  {
    const bad = [];
    written.filter((d) => d && fs.existsSync(d)).forEach((d) => allVisuals(d).forEach((v) => {
      const va = objp(v, 'valueAxis'), y2 = ((v.visual.query || {}).queryState || {}).Y2;
      if (S(va.secShow) === 'true') bad.push(path.basename(d) + ' ' + v.name + ': secShow true');
      if (y2 && !(isCombo(v) && S(va.secShow) === 'false' && /Confirmed/.test(d))) bad.push(path.basename(d) + ' ' + v.name + ': Y2 outside a confirmed combo with secShow false');
    }));
    chk(() => written.length >= 6 && !bad.length, () => `X: no secondary axis in any report written here; Y2 only in the confirmed combo: ${JSON.stringify(bad)} (${written.length} reports)`);
  }
} finally {
  await w.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
}

if (problems.length) { console.log(`FAIL  shared-axes  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  shared-axes  ${checks} checks`);
