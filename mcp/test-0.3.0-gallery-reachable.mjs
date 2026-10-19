// 0.3.0 D2 (the laptop proof of 0.3.0-rc.2, Desktop 2.159): no MCP tool could write the visual gallery (#61). Written red
// first. Through the tools only (plan_layout -> approve_plan -> create_report), on a made-up shop model (no employer or
// client data):
//   S   the slot kinds take combo, waterfall, smallMultiples; the instructions and the skill say "only when asked"
//   H   English, hand-placed: each kind's written visual type and roles, the plan's pins, the approval page (kind, why),
//       Microsoft's validator 0 errors, check_report 0 "can break"
//   HA  the same in Arabic, right to left: mirrored as the writer mirrors its charts
//   D   a design with gallery: true: the plan's slots name the kinds; create_report writes them; gallery: ["waterfall"]
//       the waterfall alone; no gallery: none (never chosen silently)
//   U   a combo of two measures in different units: refused into two panels (no secondary axis; outside audit C13)
//   TW  the Arabic twin of the English gallery report
//   TT  titles told apart by words (#57), never "(2)", English and Arabic
//   TH  the theme is the plan's (light by default), dark only when the design asks
//   P   the approval preview draws the gallery visuals (placeholders)
//   node test-0.3.0-gallery-reachable.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (!x ? 'no answer' : x.err ? String(x.t).slice(0, 500) : JSON.stringify(x.j).slice(0, 500));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const S = (p) => { const v = p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value) : undefined; return v == null ? undefined : v.replace(/^'|'$/g, '').replace(/''/g, "'"); };
const req = (url, method, body) => new Promise((resolve) => {
  if (!url) { resolve(''); return; }
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const unesc = (h) => String(h).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// ---------- the made-up model: a shop's sales by month, region and channel ----------
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-d2-'));
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
const MP = 'g';
const SAME_UNIT = { kpis: ['Sales[Total Sales]', 'Sales[Total Cost]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]', category2: 'Sales[Channel]' };
const MIXED = Object.assign({}, SAME_UNIT, { kpis: ['Sales[Total Sales]', 'Sales[Margin %]'] });
const HAND = (kinds, w, h) => [{ name: 'Gallery', width: w || 1280, height: h || 720, slots: kinds.map((k, i) => ({ kind: k, x: 20 + (i % 2) * 630, y: 20 + Math.floor(i / 2) * 350, w: 610, h: 330 })) }];
const AR_NAMES = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Total Cost]': 'إجمالي التكلفة', 'Sales[Margin %]': 'نسبة الهامش', 'Calendar[Month Name]': 'الشهر', 'Sales[Region]': 'المنطقة', 'Sales[Channel]': 'القناة', 'Sales[Orders]': 'الطلبات', 'Calendar[Quarter]': 'الربع' };

// one server whose browser only notes the link: the approval page is read, then Approve is clicked by a POST
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const approve = async (planId) => { const n = links().length; await w.call('approve_plan', { planId }); const url = await linkAt(n), html = await req(url, 'GET'); if (url) await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId }); return html; };
const pagesOf = (dir) => { const P = path.join(dir, 'definition/pages'); if (!fs.existsSync(P)) return [];
  return rd(path.join(P, 'pages.json')).pageOrder.map((id) => ({ id, page: rd(path.join(P, id, 'page.json')), visuals: fs.existsSync(path.join(P, id, 'visuals')) ? fs.readdirSync(path.join(P, id, 'visuals')).map((v) => rd(path.join(P, id, 'visuals', v, 'visual.json'))).filter((v) => v.visual) : [] })); };
const shownPages = (dir) => pagesOf(dir).filter((p) => p.page.type !== 'Tooltip' && p.page.visibility !== 'HiddenInViewMode');
const allVisuals = (dir) => shownPages(dir).flatMap((p) => p.visuals);
const roles = (v) => Object.fromEntries(Object.entries(((v.visual.query || {}).queryState) || {}).map(([k, r]) => [k, (r.projections || []).map((p) => p.nativeQueryRef || (p.field.Measure || p.field.Column || {}).Property)]));
const objp = (v, o) => ((((v.visual.objects || {})[o]) || [])[0] || { properties: {} }).properties;
const titleOf = (v) => { const t = (((v.visual.visualContainerObjects || {}).title || [])[0] || { properties: {} }).properties.text; return S(t) != null ? S(t) : t && t.expr && t.expr.Measure ? String(t.expr.Measure.Property).replace(/^Title: /, '') : null; };
const isMultiples = (v) => v.visual.visualType === 'clusteredColumnChart' && !!((v.visual.query || {}).queryState || {}).Rows;
const KIND_OF = { combo: (v) => v.visual.visualType === 'lineClusteredColumnComboChart', waterfall: (v) => v.visual.visualType === 'waterfallChart', smallMultiples: isMultiples };
const check = async (pbip) => { const r = await w.call('check_report', { path: pbip, checks: ['validator'] }); return r; };
const clean = (r) => !r.err && r.j.validator && r.j.validator.ran && r.j.validator.errors === 0;
const noBreak = (r) => !r.err && r.j.impact && r.j.impact.kinds && (r.j.impact.kinds.canBreak || { count: 0 }).count === 0;
const galleryOf = (pl) => (pl && pl.j && pl.j.gallery) || null;

// plan + approve + write; returns { pl, html, r, dir }
const write = async (args) => {
  const pl = await w.call('plan_layout', Object.assign({ path: MP }, args));
  const id = pl.j && pl.j.plan && pl.j.plan.planId;
  if (!id) return { pl, err: 'no plan id: ' + short(pl) };
  const html = await approve(id);
  const cr = Object.assign({ path: MP, planId: id }, args, args.pages ? {} : { design: pl.j.design });
  if (args.planFields) { cr.fields = args.planFields; delete cr.planFields; }
  const r = await w.call('create_report', cr);
  return { pl, html, r, dir: path.join(ROOT, 'g', args.name + '.Report'), pbip: 'g/' + args.name + '.pbip' };
};

try {
  // ---------- S: the schema and the texts ----------
  {
    const tools = (await w.c.listTools()).tools, pl = tools.find((t) => t.name === 'plan_layout'), cr = tools.find((t) => t.name === 'create_report');
    const kindsOf = (t) => { try { return t.inputSchema.properties.pages.items.properties.slots.items.properties.kind.enum || []; } catch (e) { return []; } };
    chk(() => ['combo', 'waterfall', 'smallMultiples'].every((k) => kindsOf(pl).includes(k) && kindsOf(cr).includes(k)) && pl.inputSchema.properties.gallery && cr.inputSchema.properties.gallery,
      () => `S1. plan_layout and create_report take the slot kinds combo, waterfall, smallMultiples and the gallery input: ${JSON.stringify(kindsOf(pl))} gallery ${!!(pl && pl.inputSchema.properties.gallery)}`);
    const ins = w.c.getInstructions() || '', desc = String((pl.inputSchema.properties.gallery || {}).description || '') + ' ' + pl.description;
    chk(() => /waterfall/.test(ins) && /only when (the user|asked)/i.test(ins) && /only when (the user|asked)/i.test(desc), () => `S2. the instructions and plan_layout say the gallery is used only when the user asks: ${ins.slice(-700)}`);
    const skill = fs.readFileSync(path.join(HERE, 'skills/report-design/SKILL.md'), 'utf8');
    chk(() => /waterfall/i.test(skill) && /smallMultiples/.test(skill) && /only when (the user|asked)/i.test(skill) && /two panels/i.test(skill), () => 'S3. the skill says the gallery kinds, only when asked, and the two panels of a combo in two units');
  }

  // ---------- H: English, hand-placed ----------
  let EN = null;
  {
    EN = await write({ name: 'Gallery Hand', lang: 'en', pages: HAND(['combo', 'waterfall', 'smallMultiples']), planFields: SAME_UNIT });
    const vs = EN.dir && fs.existsSync(EN.dir) ? allVisuals(EN.dir) : [], g = galleryOf(EN.pl), H = unesc(EN.html || '');
    const find = (k) => vs.find(KIND_OF[k]);
    const want = { combo: { Category: ['Month Name'], Y: ['Total Sales'], Y2: ['Total Cost'] }, waterfall: { Category: ['Month Name'], Y: ['Total Sales'] }, smallMultiples: { Category: ['Channel'], Y: ['Total Sales'], Rows: ['Region'] } };
    for (const k of ['combo', 'waterfall', 'smallMultiples']) {
      const v = find(k), r = v ? roles(v) : null;
      chk(() => v && Object.entries(want[k]).every(([ro, f]) => JSON.stringify((r[ro] || []).slice(0, f.length)) === JSON.stringify(f)), () => `H ${k}: the written visual and its roles: ${EN.err || short(EN.r)} ${JSON.stringify(vs.map((x) => [x.visual.visualType, roles(x)]))}`);
      chk(() => g && Array.isArray(g.slots) && g.slots.some((x) => x.kind === k && x.written === k && /\S/.test(x.why || '')), () => `H ${k}: the plan's gallery names the kind, what is written and why: ${EN.err || JSON.stringify(g)}`);
      chk(() => new RegExp(`<h2>Pages[\\s\\S]*${k}[\\s\\S]*</table>`).test(H) && new RegExp(`<h2>Visual gallery[\\s\\S]*?${({ combo: 'Combo', waterfall: 'Waterfall', smallMultiples: 'Small multiples' })[k]}[^<]*</td><td[^>]*>[^<]{10,}`).test(H),
        () => `H ${k}: the approval page pins the slot and names the kind with why: ${(H.match(/<h2>Visual gallery[\s\S]*?<\/table>/) || [H.slice(0, 300)])[0].slice(0, 600)}`);
    }
    const c = EN.r && !EN.r.err ? await check(EN.pbip) : null;
    chk(() => c && clean(c), () => `H: Microsoft's validator: 0 errors on the English gallery report: ${EN.err || short(c || EN.r)}`);
    chk(() => c && noBreak(c), () => `H: check_report: 0 "can break": ${short(c || EN.r)}`);
  }

  // ---------- HA: Arabic, hand-placed, right to left ----------
  {
    const AR = await write({ name: 'Gallery Arabic', lang: 'ar', pages: HAND(['combo', 'waterfall', 'smallMultiples']), planFields: SAME_UNIT, displayNames: AR_NAMES });
    const vs = AR.dir && fs.existsSync(AR.dir) ? allVisuals(AR.dir) : [], cb = vs.find(KIND_OF.combo), wf = vs.find(KIND_OF.waterfall), sm = vs.find(KIND_OF.smallMultiples);
    chk(() => cb && S(objp(cb, 'valueAxis').switchAxisPosition) === 'true' && S(objp(cb, 'categoryAxis').invertAxis) === 'true' && JSON.stringify(roles(cb).Y2) === '["Total Cost"]',
      () => `HA combo: mirrored (value axis right, categories inverted): ${AR.err || short(AR.r)} ${JSON.stringify(cb && cb.visual.objects)}`);
    chk(() => wf && S(objp(wf, 'valueAxis').switchAxisPosition) === 'true' && !(wf.visual.objects || {}).categoryAxis && wf.visual.query.sortDefinition.sort[0].direction === 'Descending',
      () => `HA waterfall: mirrored by its sort (value axis right, Descending, no categoryAxis): ${JSON.stringify(wf && [wf.visual.objects, wf.visual.query.sortDefinition])}`);
    chk(() => sm && S(objp(sm, 'valueAxis').switchAxisPosition) === 'true' && JSON.stringify(roles(sm).Rows) === '["Region"]', () => `HA small multiples: mirrored, a panel per region: ${JSON.stringify(sm && sm.visual.objects)}`);
    const c = AR.r && !AR.r.err ? await check(AR.pbip) : null;
    chk(() => c && clean(c), () => `HA: Microsoft's validator: 0 errors on the Arabic gallery report: ${AR.err || short(c || AR.r)}`);
    chk(() => c && noBreak(c), () => `HA: check_report: 0 "can break": ${short(c || AR.r)}`);
  }

  // ---------- D: a design with gallery: true; a list; none ----------
  let D = null, D0 = null;
  {
    // (the reviewer's decision of 19 Oct: every designed page, at most one gallery visual a page, only where its fields
    // suit; the tooltip pages keep their plain kinds)
    D = await write({ name: 'Gallery Design', lang: 'en', layout: 'exec', gallery: true, secondPage: true, planFields: SAME_UNIT });
    const kinds = (D.pl.j && D.pl.j.slots || []).map((x) => x.kind), G3 = ['combo', 'waterfall', 'smallMultiples'];
    chk(() => kinds.filter((k) => G3.includes(k)).length === 1 && kinds.includes('combo') && !kinds.includes('line'), () => `D: the plan's first page takes one gallery visual, the combo in the trend's place: ${D.err || JSON.stringify(kinds)}`);
    chk(() => /Visual gallery<\/td><td[^>]*>[^<]*(yes|every kind)/i.test(unesc(D.html || '')), () => `D: the approval page shows the gallery the plan pins: ${(unesc(D.html || '').match(/<h2>Look and options[\s\S]*?<\/table>/) || [''])[0].slice(0, 500)}`);
    const pg = D.dir && fs.existsSync(D.dir) ? pagesOf(D.dir) : [], shown = pg.filter((p) => p.page.type !== 'Tooltip'), tips = pg.filter((p) => p.page.type === 'Tooltip');
    const gOf = (p) => p.visuals.filter((v) => KIND_OF.combo(v) || KIND_OF.waterfall(v) || isMultiples(v)).map((v) => (KIND_OF.combo(v) ? 'combo' : KIND_OF.waterfall(v) ? 'waterfall' : 'smallMultiples'));
    chk(() => shown.length === 2 && tips.length >= 1 && pg.length >= 3 && JSON.stringify(shown.map(gOf)) === '[["combo"],["waterfall"]]' && tips.every((p) => !gOf(p).length),
      () => `D: three pages: one gallery visual on each designed page (a kind not used before first), none on the tooltip pages: ${D.err || short(D.r)} ${JSON.stringify(pg.map((p) => [p.page.displayName, p.page.type || '', gOf(p)]))}`);
    const c = D.r && !D.r.err ? await check(D.pbip) : null;
    chk(() => c && clean(c), () => `D: validator 0 errors: ${short(c || D.r)}`);
    chk(() => c && noBreak(c), () => `D: check_report 0 can break: ${short(c || D.r)}`);
    const gl = (galleryOf(D.pl) || {}).slots || [];
    chk(() => gl.some((g) => g.kind === 'combo' && g.page && g.written === 'combo') && gl.some((g) => g.kind === 'waterfall' && g.page && g.page !== gl.find((x) => x.kind === 'combo').page)
      && gl.some((g) => g.kind === 'smallMultiples' && g.page === null && g.written === 'not placed' && /one a page/.test(g.why)), () => `D: the plan names each gallery visual by page, and the kind no page took, with why: ${JSON.stringify(gl)}`);
    // none where the fields don't suit: a combo of two units is never placed on a designed page (two panels are only for a
    // combo slot the person placed)
    const NU = await write({ name: 'No Combo', lang: 'en', layout: 'exec', gallery: ['combo'], secondPage: true, planFields: MIXED });
    const nk = (NU.pl.j && NU.pl.j.slots || []).map((x) => x.kind), ng = (galleryOf(NU.pl) || {}).slots || [], nv = NU.dir && fs.existsSync(NU.dir) ? allVisuals(NU.dir) : [];
    chk(() => nk.includes('line') && !nk.includes('combo') && !nv.some(KIND_OF.combo) && ng.length === 1 && ng[0].written === 'not placed' && /different units/.test(ng[0].why) && nv.filter((v) => v.visual.visualType === 'lineChart').length === 1,
      () => `D: a combo whose fields don't suit is placed nowhere, and the plan says why: ${NU.err || JSON.stringify(nk)} ${JSON.stringify(ng)} ${JSON.stringify(nv.map((v) => v.visual.visualType))}`);
    const cn = NU.r && !NU.r.err ? await check(NU.pbip) : null;
    chk(() => cn && clean(cn), () => `D: validator 0 errors on the report without a placed gallery visual: ${short(cn || NU.r)}`);
    const one = await w.call('plan_layout', { path: MP, name: 'Only Waterfall', layout: 'exec', gallery: ['waterfall'], planFields: SAME_UNIT });
    const k1 = (one.j && one.j.slots || []).map((x) => x.kind);
    chk(() => k1.includes('waterfall') && !k1.includes('combo') && !k1.includes('smallMultiples') && k1.includes('line') && k1.includes('bar'), () => `D2: gallery ["waterfall"]: the waterfall alone: ${short(one)} ${JSON.stringify(k1)}`);
    D0 = await write({ name: 'No Gallery', lang: 'en', layout: 'exec', secondPage: false, planFields: SAME_UNIT });
    const k0 = (D0.pl.j && D0.pl.j.slots || []).map((x) => x.kind), v0 = D0.dir && fs.existsSync(D0.dir) ? allVisuals(D0.dir) : [];
    chk(() => !k0.some((k) => ['combo', 'waterfall', 'smallMultiples'].includes(k)) && v0.length && !v0.some((v) => KIND_OF.combo(v) || KIND_OF.waterfall(v) || isMultiples(v)) && !galleryOf(D0.pl),
      () => `D3: no gallery asked: no gallery kind, planned or written: ${JSON.stringify(k0)} ${JSON.stringify(v0.map((v) => v.visual.visualType))}`);
  }

  // ---------- U: a combo of two units: two panels ----------
  {
    const U = await write({ name: 'Two Units', lang: 'en', pages: HAND(['combo']), planFields: MIXED });
    const g = galleryOf(U.pl), vs = U.dir && fs.existsSync(U.dir) ? allVisuals(U.dir) : [];
    chk(() => g && g.slots.some((x) => x.kind === 'combo' && /two panels/i.test(x.written + ' ' + x.why) && /unit/i.test(x.why)), () => `U: the plan says two panels and why (the units differ): ${U.err || JSON.stringify(g)}`);
    const lines = vs.filter((v) => v.visual.visualType === 'lineChart');
    chk(() => !vs.some(KIND_OF.combo) && lines.length === 2 && JSON.stringify(lines.map((v) => roles(v).Y[0]).sort()) === '["Margin %","Total Sales"]' && !vs.some((v) => S(objp(v, 'valueAxis').secShow) === 'true'),
      () => `U: two line charts, one measure each, no combo, no secondary axis: ${U.err || short(U.r)} ${JSON.stringify(vs.map((v) => [v.visual.visualType, roles(v)]))}`);
    const c = U.r && !U.r.err ? await check(U.pbip) : null;
    chk(() => c && clean(c), () => `U: validator 0 errors: ${short(c || U.r)}`);
  }

  // ---------- TW: the Arabic twin of the English gallery report ----------
  {
    const p0 = EN && EN.r && !EN.r.err ? await w.call('create_arabic_twin', { path: EN.pbip }) : null, id = p0 && p0.j && p0.j.plan && p0.j.plan.planId;
    if (id) await approve(id);
    const tw = id ? await w.call('create_arabic_twin', { path: EN.pbip, planId: id }) : null, twinDir = path.join(ROOT, 'g', 'Gallery Hand AR.Report');
    const vs = fs.existsSync(twinDir) ? allVisuals(twinDir) : [], cb = vs.find(KIND_OF.combo), wf = vs.find(KIND_OF.waterfall), sm = vs.find(KIND_OF.smallMultiples);
    chk(() => cb && wf && sm && [cb, wf, sm].every((v) => S(objp(v, 'valueAxis').switchAxisPosition) === 'true') && wf.visual.query.sortDefinition.sort[0].direction === 'Descending',
      () => `TW: the twin mirrors the combo, the waterfall (by its sort) and the small multiples: ${short(tw || p0)} ${JSON.stringify(vs.map((v) => v.visual.visualType))}`);
    const twPbip = fs.existsSync(twinDir) ? 'g/' + path.basename(twinDir).replace(/\.Report$/, '.pbip') : null, c = twPbip ? await check(twPbip) : null;
    chk(() => c && clean(c), () => `TW: validator 0 errors on the twin: ${short(c || tw || p0)}`);
  }

  // ---------- TT: titles told apart by words, never numbered ----------
  {
    const numbered = (t) => /\(\d+\)|\s\d+\)$/.test(String(t));
    for (const lang of ['en', 'ar']) {
      const T = await write({ name: 'Titles ' + lang, lang, pages: HAND(['line', 'waterfall', 'combo', 'column']), planFields: SAME_UNIT, displayNames: lang === 'ar' ? AR_NAMES : undefined });
      const ts = (T.dir && fs.existsSync(T.dir) ? allVisuals(T.dir) : []).filter((v) => v.visual.query && v.visual.query.queryState.Category).map(titleOf);
      chk(() => ts.length === 4 && new Set(ts).size === 4 && !ts.some(numbered), () => `TT ${lang}: every chart title its own sentence, never "(2)": ${T.err || short(T.r)} ${JSON.stringify(ts)}`);
    }
  }

  // ---------- TH: the theme is the plan's ----------
  {
    const themeOf = (dir) => { const R = path.join(dir || '', 'StaticResources/RegisteredResources'); const f = fs.existsSync(R) ? fs.readdirSync(R).find((n) => /\.json$/.test(n)) : null; return f ? rd(path.join(R, f)) : null; };
    const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(String(h).slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    const tg = themeOf(D && D.dir), t0 = themeOf(D0 && D0.dir);
    chk(() => tg && t0 && JSON.stringify(tg.dataColors) === JSON.stringify(t0.dataColors) && tg.background === t0.background && lum(tg.background) > 0.45,
      () => `TH: the gallery report has the plan's theme (light by default, as the same plan without gallery): ${JSON.stringify(tg && [tg.background, tg.dataColors])} vs ${JSON.stringify(t0 && [t0.background, t0.dataColors])}`);
    const dark = await w.call('generate_theme', { mode: 'dark', name: 'Dark Shop' });
    const DK = dark.j && dark.j.design ? await write({ name: 'Gallery Dark', lang: 'en', layout: 'exec', gallery: true, secondPage: false, planFields: SAME_UNIT, design: dark.j.design }) : null;
    const td = themeOf(DK && DK.dir);
    chk(() => td && lum(td.background) < 0.45 && allVisuals(DK.dir).some((v) => KIND_OF.combo(v) || KIND_OF.waterfall(v) || isMultiples(v)), () => `TH: dark only when the design asks for it: ${short(dark)} ${DK ? DK.err || short(DK.r) : ''} ${td && td.background}`);
  }

  // ---------- P: the approval preview draws them ----------
  {
    // (each designed page's svg: the combo drawn as a line, the waterfall as columns, page by page)
    const H = D && D.html ? D.html : '', svgs = H.match(/<svg[\s\S]*?<\/svg>/g) || [];
    const charts = svgs.filter((x) => /data-kind="(line|column)"/.test(x)).length;
    chk(() => svgs.length >= 2 && charts >= 2 && /placeholder/i.test(unesc(H)), () => `P: the preview draws the gallery visuals (placeholders) and the page says so: ${charts} line/column shapes; ${(unesc(H).match(/<h2>Visual gallery[\s\S]*?<\/table>/) || [''])[0].slice(0, 400)}`);
  }
} finally {
  await w.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
}

if (problems.length) { console.log(`FAIL  gallery-reachable  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  gallery-reachable  ${checks} checks`);
